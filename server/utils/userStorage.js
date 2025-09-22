const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const CryptoUtils = require('./crypto');

// Ruta del archivo de usuarios
const usersFilePath = path.join(__dirname, '..', 'data', 'users.json');

// Cargar usuarios desde el archivo JSON
const loadUsers = async () => {
    try {
        const data = await fs.readFile(usersFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si el archivo no existe, crear uno vacío
        if (error.code === 'ENOENT') {
            await saveUsers([]);
            return [];
        }
        throw error;
    }
};

// Guardar usuarios en el archivo JSON
const saveUsers = async (users) => {
    try {
        await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
        throw new Error('Error al guardar usuarios: ' + error.message);
    }
};

// Buscar usuario por nombre de usuario
const findUserByUsername = async (username) => {
    const users = await loadUsers();
    return users.find(user => user.username === username);
};

// Buscar usuario por email
const findUserByEmail = async (email) => {
    const users = await loadUsers();
    return users.find(user => user.email === email);
};

// Crear nuevo usuario
const createUser = async (userData) => {
    const users = await loadUsers();
    
    // Verificar si el usuario ya existe
    const existingUser = await findUserByUsername(userData.username);
    if (existingUser) {
        throw new Error('El nombre de usuario ya está en uso');
    }
    
    // Verificar si el email ya existe
    const existingEmail = await findUserByEmail(userData.email);
    if (existingEmail) {
        throw new Error('El email ya está registrado');
    }
    
    // Agregar fecha de creación
    const salt = CryptoUtils.generateSalt();
    const hashedPassword = CryptoUtils.hashPassword(userData.password, salt);
    
    const newUser = {
        id: CryptoUtils.generateId(),
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        salt: salt,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true
    };
    
    users.push(newUser);
    await saveUsers(users);
    
    // Retornar usuario sin la contraseña
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
};

// Actualizar último login
const updateLastLogin = async (userId) => {
    const users = await loadUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
        users[userIndex].lastLogin = new Date().toISOString();
        await saveUsers(users);
    }
};

// Obtener usuario por ID
const getUserById = async (userId) => {
    const users = await loadUsers();
    const user = users.find(user => user.id === userId);
    
    if (user) {
        const { password, salt, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    
    return null;
};

// Verificar contraseña de usuario
const verifyUserPassword = async (username, password) => {
    const user = await findUserByUsername(username);
    if (!user) {
        return { valid: false, user: null };
    }
    
    const isValid = CryptoUtils.verifyPassword(password, user.password, user.salt);
    return { valid: isValid, user: isValid ? user : null };
};

module.exports = {
    loadUsers,
    saveUsers,
    findUserByUsername,
    findUserByEmail,
    createUser,
    updateLastLogin,
    getUserById,
    verifyUserPassword
};
