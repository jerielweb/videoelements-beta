// Utilidades de autenticación para la página principal
class AuthManager {
    static getToken() {
        return localStorage.getItem('videoelements_token');
    }
    
    static removeToken() {
        localStorage.removeItem('videoelements_token');
    }
    
    static isAuthenticated() {
        return !!this.getToken();
    }
    
    static async verifyToken() {
        const token = this.getToken();
        if (!token) return false;
        
        try {
            const response = await fetch('http://localhost:3000/verify-token', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error verificando token:', error);
            this.removeToken();
            return false;
        }
    }
    
    static async getUserProfile() {
        const token = this.getToken();
        if (!token) return null;
        
        try {
            const response = await fetch('http://localhost:3000/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            return data.success ? data.data.user : null;
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            return null;
        }
    }
    
    static logout() {
        this.removeToken();
        window.location.href = 'form.html';
    }
}

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar si el usuario está autenticado
    if (!AuthManager.isAuthenticated()) {
        // No hay token, redirigir al login
        window.location.href = 'form.html';
        return;
    }
    
    // Verificar si el token es válido
    const isValid = await AuthManager.verifyToken();
    if (!isValid) {
        // Token inválido, redirigir al login
        window.location.href = 'form.html';
        return;
    }
    
    // Obtener y mostrar información del usuario
    try {
        const user = await AuthManager.getUserProfile();
        if (user) {
            // Mostrar información del usuario en la interfaz
            updateUserInterface(user);
        }
    } catch (error) {
        console.error('Error cargando perfil de usuario:', error);
    }
});

// Actualizar la interfaz con información del usuario
function updateUserInterface(user) {
    // Buscar elementos donde mostrar información del usuario
    const userInfoElements = document.querySelectorAll('[data-user-info]');
    
    userInfoElements.forEach(element => {
        const infoType = element.getAttribute('data-user-info');
        
        switch (infoType) {
            case 'username':
                element.textContent = user.username;
                break;
            case 'email':
                element.textContent = user.email;
                break;
            case 'created-at':
                const createdDate = new Date(user.createdAt);
                element.textContent = createdDate.toLocaleDateString('es-ES');
                break;
            case 'last-login':
                if (user.lastLogin) {
                    const lastLoginDate = new Date(user.lastLogin);
                    element.textContent = lastLoginDate.toLocaleDateString('es-ES');
                } else {
                    element.textContent = 'Primera vez';
                }
                break;
        }
    });
    
    // Mostrar/ocultar elementos según el estado de autenticación
    const authElements = document.querySelectorAll('[data-auth-required]');
    authElements.forEach(element => {
        element.style.display = 'flex';
    });
    
    const guestElements = document.querySelectorAll('[data-guest-only]');
    guestElements.forEach(element => {
        element.style.display = 'none';
    });
}

// Manejar botón de logout
document.addEventListener('DOMContentLoaded', function() {
    const logoutButtons = document.querySelectorAll('[data-logout]');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Confirmar logout
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                AuthManager.logout();
            }
        });
    });
});

// Función global para logout (disponible desde cualquier parte)
window.logout = function() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        AuthManager.logout();
    }
};
