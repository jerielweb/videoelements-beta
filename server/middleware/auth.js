const CryptoUtils = require('../utils/crypto');

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso requerido'
        });
    }
    
    try {
        const decoded = CryptoUtils.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

// Middleware para verificar si el usuario está autenticado (opcional)
const optionalAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
        try {
            const decoded = CryptoUtils.verifyToken(token);
            req.user = decoded;
        } catch (error) {
            // Token inválido, pero continuamos sin usuario
            req.user = null;
        }
    } else {
        req.user = null;
    }
    
    next();
};

module.exports = {
    verifyToken,
    optionalAuth
};
