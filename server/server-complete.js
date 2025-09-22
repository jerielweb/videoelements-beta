const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');
const querystring = require('querystring');
const CryptoUtils = require('./utils/crypto');
const { createUser, findUserByUsername, updateLastLogin, verifyUserPassword, getUserById } = require('./utils/userStorage');

// Rate limiting simple
const loginAttempts = new Map();

const authLimiter = (clientIP) => {
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
        return false;
    }
    
    attempts.count++;
    return true;
};

// Función para parsear JSON del body
const parseJSON = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
    });
};

// Función para enviar respuesta JSON
const sendJSON = (res, statusCode, data) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
    });
    res.end(JSON.stringify(data));
};

// Función para servir archivos estáticos
const serveStaticFile = async (res, filePath) => {
    try {
        const data = await fs.readFile(filePath);
        const ext = path.extname(filePath);
        
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.json': 'application/json'
        };
        
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600'
        });
        
        res.end(data);
    } catch (error) {
        console.error('Error serving file:', error);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Archivo no encontrado</h1>');
    }
};

// Validadores
const validateRegister = (data) => {
    const errors = [];
    const { username, email, password } = data;
    
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
    
    return errors;
};

const validateLogin = (data) => {
    const errors = [];
    const { username, password } = data;
    
    if (!username || username.trim().length === 0) {
        errors.push('El nombre de usuario es requerido');
    }
    
    if (!password || password.length === 0) {
        errors.push('La contraseña es requerida');
    }
    
    return errors;
};

// Función para verificar token
const verifyToken = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.replace('Bearer ', '');
    try {
        return CryptoUtils.verifyToken(token);
    } catch (error) {
        return null;
    }
};

// Endpoint de registro
const handleRegister = async (req, res, clientIP) => {
    if (!authLimiter(clientIP)) {
        return sendJSON(res, 429, {
            success: false,
            message: 'Demasiados intentos. Intenta nuevamente en 15 minutos.'
        });
    }
    
    try {
        const data = await parseJSON(req);
        const errors = validateRegister(data);
        
        if (errors.length > 0) {
            return sendJSON(res, 400, {
                success: false,
                message: 'Datos de entrada inválidos',
                errors: errors
            });
        }
        
        const { username, email, password } = data;
        
        // Crear usuario
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
        
        sendJSON(res, 201, {
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
            return sendJSON(res, 409, {
                success: false,
                message: error.message
            });
        }
        
        sendJSON(res, 500, {
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Endpoint de login
const handleLogin = async (req, res, clientIP) => {
    if (!authLimiter(clientIP)) {
        return sendJSON(res, 429, {
            success: false,
            message: 'Demasiados intentos. Intenta nuevamente en 15 minutos.'
        });
    }
    
    try {
        const data = await parseJSON(req);
        const errors = validateLogin(data);
        
        if (errors.length > 0) {
            return sendJSON(res, 400, {
                success: false,
                message: 'Datos de entrada inválidos',
                errors: errors
            });
        }
        
        const { username, password } = data;
        
        // Verificar usuario y contraseña
        const { valid, user } = await verifyUserPassword(username, password);
        
        if (!user) {
            return sendJSON(res, 401, {
                success: false,
                message: 'Usuario no existe'
            });
        }
        
        if (!valid) {
            return sendJSON(res, 401, {
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
        
        sendJSON(res, 200, {
            success: true,
            message: 'Login exitoso',
            data: {
                user: userWithoutPassword,
                token
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Endpoint para verificar token
const handleVerifyToken = async (req, res, authHeader) => {
    const user = verifyToken(authHeader);
    if (!user) {
        return sendJSON(res, 401, {
            success: false,
            message: 'Token inválido o expirado'
        });
    }
    
    sendJSON(res, 200, {
        success: true,
        message: 'Token válido',
        data: {
            user
        }
    });
};

// Endpoint para obtener perfil
const handleProfile = async (req, res, authHeader) => {
    const user = verifyToken(authHeader);
    if (!user) {
        return sendJSON(res, 401, {
            success: false,
            message: 'Token inválido o expirado'
        });
    }
    
    try {
        const userProfile = await getUserById(user.userId);
        if (!userProfile) {
            return sendJSON(res, 404, {
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        sendJSON(res, 200, {
            success: true,
            data: { user: userProfile }
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        sendJSON(res, 500, {
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Servidor HTTP
const server = http.createServer(async (req, res) => {
    const clientIP = req.connection.remoteAddress;
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    const pathname = parsedUrl.pathname;
    
    // Manejar OPTIONS para CORS
    if (method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        });
        res.end();
        return;
    }
    
    // Rutas de API
    if (method === 'POST' && pathname === '/register') {
        await handleRegister(req, res, clientIP);
    } else if (method === 'POST' && pathname === '/login') {
        await handleLogin(req, res, clientIP);
    } else if (method === 'GET' && pathname === '/verify-token') {
        const authHeader = req.headers.authorization;
        await handleVerifyToken(req, res, authHeader);
    } else if (method === 'GET' && pathname === '/profile') {
        const authHeader = req.headers.authorization;
        await handleProfile(req, res, authHeader);
    } else {
        // Servir archivos estáticos
        let filePath;
        
        if (pathname === '/' || pathname === '/index.html') {
            filePath = path.join(__dirname, '..', 'src', 'html', 'index.html');
        } else if (pathname === '/form.html') {
            filePath = path.join(__dirname, '..', 'src', 'html', 'form.html');
        } else if (pathname.startsWith('/assets/')) {
            filePath = path.join(__dirname, '..', 'src', pathname);
        } else if (pathname.startsWith('/styles/')) {
            filePath = path.join(__dirname, '..', 'src', pathname);
        } else if (pathname.startsWith('/js/')) {
            filePath = path.join(__dirname, '..', 'src', pathname);
        } else {
            // Ruta no encontrada
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Página no encontrada</h1>');
            return;
        }
        
        await serveStaticFile(res, filePath);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor completo iniciado en puerto ${PORT}`);
    console.log(`📝 Modo: desarrollo`);
    console.log(`🔐 Autenticación JWT habilitada`);
    console.log(`🛡️  Medidas de seguridad activadas`);
    console.log(`🌐 Frontend disponible en: http://localhost:${PORT}`);
    console.log(`📊 API disponible en: http://localhost:${PORT}/api`);
});

module.exports = server;
