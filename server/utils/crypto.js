const crypto = require('crypto');

// Utilidades de encriptación usando Node.js crypto nativo
class CryptoUtils {
    // Generar salt para bcrypt
    static generateSalt(rounds = 12) {
        return crypto.randomBytes(16).toString('hex');
    }
    
    // Hash de contraseña simple pero seguro
    static hashPassword(password, salt) {
        return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    }
    
    // Verificar contraseña
    static verifyPassword(password, hash, salt) {
        const hashedPassword = this.hashPassword(password, salt);
        return hashedPassword === hash;
    }
    
    // Generar token JWT simple
    static generateToken(payload) {
        const header = {
            alg: 'HS256',
            typ: 'JWT'
        };
        
        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        
        const signature = crypto
            .createHmac('sha256', 'tu_clave_secreta_muy_segura_aqui_cambiar_en_produccion_123456789')
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest('base64url');
        
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }
    
    // Verificar token JWT
    static verifyToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Token inválido');
            }
            
            const [encodedHeader, encodedPayload, signature] = parts;
            
            // Verificar firma
            const expectedSignature = crypto
                .createHmac('sha256', 'tu_clave_secreta_muy_segura_aqui_cambiar_en_produccion_123456789')
                .update(`${encodedHeader}.${encodedPayload}`)
                .digest('base64url');
            
            if (signature !== expectedSignature) {
                throw new Error('Token inválido');
            }
            
            const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
            
            // Verificar expiración
            if (payload.exp && Date.now() >= payload.exp * 1000) {
                throw new Error('Token expirado');
            }
            
            return payload;
        } catch (error) {
            throw new Error('Token inválido');
        }
    }
    
    // Generar ID único
    static generateId() {
        return crypto.randomUUID();
    }
}

module.exports = CryptoUtils;
