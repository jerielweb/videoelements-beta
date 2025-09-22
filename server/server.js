const express = require('express');
const CryptoUtils = require('./utils/crypto');

// Importar configuraciones y utilidades
const config = require('./config');
const { createUser, findUserByUsername, updateLastLogin, verifyUserPassword } = require('./utils/userStorage');
const { verifyToken } = require('./middleware/auth');

const app = express();

// Middleware de seguridad básico
app.use((req, res, next) => {
    // CORS básico
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Headers de seguridad básicos
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting simple
const loginAttempts = new Map();

const authLimiter = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos
    const maxAttempts = 5;
    
    if (!loginAttempts.has(clientIP)) {
        loginAttempts.set(clientIP, { count: 0, resetTime: now + windowMs });
    }
    
    const attempts = loginAttempts.get(clientIP);
    
    if (now > attempts.resetTime) {
        attempts.count = 0;
        attempts.resetTime = now + windowMs;
    }
    
    if (attempts.count >= maxAttempts) {
        return res.status(429).json({
            success: false,
            message: 'Demasiados intentos. Intenta nuevamente en 15 minutos.'
        });
    }
    
    attempts.count++;
    next();
};

// Validadores simples
const validateRegister = (req, res, next) => {
    const { username, email, password } = req.body;
    const errors = [];
    
    if (!username || username.length < 3 || username.length > 30) {
        errors.push('El nombre de usuario debe tener entre 3 y 30 caracteres');
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('El nombre de usuario solo puede contener letras, números y guiones bajos');
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Debe ser un email válido');
    }
    
    if (!password || password.length < 8) {
        errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        errors.push('La contraseña debe contener al menos una letra minúscula, una mayúscula y un número');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: errors
        });
    }
    
    next();
};

const validateLogin = (req, res, next) => {
    const { username, password } = req.body;
    const errors = [];
    
    if (!username || username.trim().length === 0) {
        errors.push('El nombre de usuario es requerido');
    }
    
    if (!password || password.length === 0) {
        errors.push('La contraseña es requerida');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: errors
        });
    }
    
    next();
};

// Endpoint de registro
app.post('/register', authLimiter, validateRegister, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Crear usuario (la contraseña se hashea en createUser)
        const user = await createUser({
            username,
            email,
            password
        });

        // Generar JWT
        const payload = { 
            userId: user.id, 
            username: user.username,
            email: user.email,
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
        };
        const token = CryptoUtils.generateToken(payload);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user,
                token
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        
        if (error.message.includes('ya está')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint de login
app.post('/login', authLimiter, validateLogin, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Verificar usuario y contraseña
        const { valid, user } = await verifyUserPassword(username, password);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no existe'
            });
        }

        if (!valid) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

        // Actualizar último login
        await updateLastLogin(user.id);

        // Generar JWT
        const payload = { 
            userId: user.id, 
            username: user.username,
            email: user.email,
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
        };
        const token = CryptoUtils.generateToken(payload);

        // Retornar datos sin contraseña y salt
        const { password: _, salt: __, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                user: userWithoutPassword,
                token
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint para verificar token
app.get('/verify-token', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token válido',
        data: {
            user: req.user
        }
    });
});

// Endpoint para obtener perfil del usuario
app.get('/profile', verifyToken, async (req, res) => {
    try {
        const { getUserById } = require('./utils/userStorage');
        const user = await getUserById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Iniciar servidor
const PORT = config.PORT;
app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
    console.log(`📝 Modo: ${config.NODE_ENV}`);
    console.log(`🔐 Autenticación JWT habilitada`);
    console.log(`🛡️  Medidas de seguridad activadas`);
});

module.exports = app;
