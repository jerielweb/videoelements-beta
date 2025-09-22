// Configuración del servidor
module.exports = {
    // Puerto del servidor
    PORT: process.env.PORT || 3000,
    
    // Entorno
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // JWT Secret (en producción usar variable de entorno)
    JWT_SECRET: process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura_aqui_cambiar_en_produccion_123456789',
    
    // Configuración de seguridad
    BCRYPT_ROUNDS: 12,
    SESSION_TIMEOUT: '24h',
    
    // CORS
    CORS_ORIGIN: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    
    // Rate limiting
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutos
        MAX_REQUESTS: 5 // máximo 5 intentos por ventana
    },
    
    // Base de datos de usuarios (JSON para desarrollo)
    USERS_DB_PATH: './data/users.json'
};
