// Configuración de la API
// Forzamos el uso del servidor backend en 3000 para evitar live preview en 3001
const API_BASE_URL = 'http://localhost:3000';

// Utilidades para manejo de tokens
class TokenManager {
    static setToken(token) {
        localStorage.setItem('videoelements_token', token);
    }
    
    static getToken() {
        return localStorage.getItem('videoelements_token');
    }
    
    static removeToken() {
        localStorage.removeItem('videoelements_token');
    }
    
    static isAuthenticated() {
        return !!this.getToken();
    }
}

// Utilidades para mostrar mensajes
class MessageManager {
    static showMessage(message, type = 'error') {
        // Remover mensajes anteriores
        const existingMessage = document.querySelector('.api-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Crear nuevo mensaje
        const messageDiv = document.createElement('div');
        messageDiv.className = `api-message ${type}`;
        messageDiv.textContent = message;
        
        // Estilos del mensaje
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        if (type === 'error') {
            messageDiv.style.backgroundColor = '#e74c3c';
        } else if (type === 'success') {
            messageDiv.style.backgroundColor = '#27ae60';
        } else {
            messageDiv.style.backgroundColor = '#3498db';
        }
        
        // Agregar animación CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(messageDiv);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
    
    static showLoading(form, isLoading = true) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Cargando...';
            submitBtn.style.opacity = '0.7';
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.originalText || 'Enviar';
            submitBtn.style.opacity = '1';
        }
    }
}

// Clase para manejo de autenticación
class AuthManager {
    static async register(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                TokenManager.setToken(data.data.token);
                MessageManager.showMessage('¡Registro exitoso! Bienvenido a Video Elements.', 'success');
                
                // Redirigir al usuario después del registro exitoso
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                
                return data;
            } else {
                throw new Error(data.message || 'Error en el registro');
            }
        } catch (error) {
            console.error('Error en registro:', error);
            console.error('Datos enviados:', userData);
            MessageManager.showMessage(error.message || 'Error al registrarse');
            throw error;
        }
    }
    
    static async login(credentials) {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });
            
            const data = await response.json();
            
            if (data.success) {
                TokenManager.setToken(data.data.token);
                MessageManager.showMessage('¡Bienvenido de vuelta!', 'success');
                
                // Redirigir al usuario después del login exitoso
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
                
                return data;
            } else {
                throw new Error(data.message || 'Error en el login');
            }
        } catch (error) {
            console.error('Error en login:', error);
            MessageManager.showMessage(error.message || 'Error al iniciar sesión');
            throw error;
        }
    }
    
    static async verifyToken() {
        const token = TokenManager.getToken();
        if (!token) return false;
        
        try {
            const response = await fetch(`${API_BASE_URL}/verify-token`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error verificando token:', error);
            TokenManager.removeToken();
            return false;
        }
    }
    
    static logout() {
        TokenManager.removeToken();
        MessageManager.showMessage('Sesión cerrada exitosamente', 'info');
        window.location.href = 'form.html';
    }
}

// Buttons help
document.addEventListener('DOMContentLoaded', function() {
    const loginSection = document.querySelector('.log-in')
    const signupSection = document.querySelector('.sing-up')
    const signupButton = document.getElementById('sing-up')
    const loginButton = document.getElementById('log-in')

    function showSignupForm() {
        loginSection.classList.remove('active')
        loginSection.classList.add('none')
        signupSection.classList.remove('none')
        signupSection.classList.add('active')
    }

    function showLoginForm() {
        signupSection.classList.remove('active')
        signupSection.classList.add('none')
        loginSection.classList.remove('none')
        loginSection.classList.add('active')
    }

    if (signupButton) {
        signupButton.addEventListener('click', function(e) {
            e.preventDefault()
            showSignupForm()
        });
    }

    if (loginButton) {
        loginButton.addEventListener('click', function(e) {
            e.preventDefault()
            showLoginForm()
        });
    }

    // Guardar texto original de los botones
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach(btn => {
        btn.dataset.originalText = btn.textContent;
    });

    // Manejo del formulario de registro
    const registerForm = document.querySelector('form[action="/register"]');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            MessageManager.showLoading(registerForm, true);
            
            const formData = new FormData(registerForm);
            const userData = {
                username: formData.get('user'),
                email: formData.get('email'),
                password: formData.get('password')
            };
            
            console.log('Datos del formulario:', userData);
            
            try {
                await AuthManager.register(userData);
            } catch (error) {
                console.error('Error en registro:', error);
            } finally {
                MessageManager.showLoading(registerForm, false);
            }
        });
    }

    // Manejo del formulario de login
    const loginForm = document.querySelector('form[action="/login"]');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            MessageManager.showLoading(loginForm, true);
            
            const formData = new FormData(loginForm);
            const credentials = {
                username: formData.get('user'),
                password: formData.get('password')
            };
            
            try {
                await AuthManager.login(credentials);
            } catch (error) {
                console.error('Error en login:', error);
            } finally {
                MessageManager.showLoading(loginForm, false);
            }
        });
    }

    // Verificar si el usuario ya está autenticado
    if (TokenManager.isAuthenticated()) {
        AuthManager.verifyToken().then(isValid => {
            if (isValid) {
                // Usuario ya autenticado, redirigir al inicio
                window.location.href = 'index.html';
            }
        });
    }
});







// Lenguage 
class LanguageManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('videoelements-lang') || 'es';
        this.translations = {
            es: {
                // Navegación
                'nav-home': 'Inicio',
                'nav-lang': 'Español',
                
                // Login
                'login-title': '¡Bienvenido de vuelta!',
                'login-subtitle': 'Inicia sesión para acceder a todos sus recursos.',
                'login-no-account': '¿No tiene una cuenta?',
                'login-register-link': 'Registrate',
                'login-user-placeholder': 'Usuario',
                'login-password-placeholder': 'Contraseña',
                'login-cookies': 'Al iniciar sesión aceptas los',
                'login-cookies-link': 'Uso de Cookies',
                'login-terms-link': 'Términos de Servicio',
                'login-submit': 'Ingresar',
                'login-forgot': '¿Olvidaste tu contraseña?',
                'login-restore': 'Restaurar',
                
                // Register
                'register-title': '¡Te doy la Bienvenida!',
                'register-subtitle': 'Crea una cuenta para acceder a todos sus recursos.',
                'register-have-account': '¿Ya tienes una cuenta?',
                'register-login-link': 'Iniciar Sesión',
                'register-user-placeholder': 'Usuario',
                'register-email-placeholder': 'Correo',
                'register-password-placeholder': 'Contraseña',
                'register-cookies': 'Al registrarte aceptas los',
                'register-cookies-link': 'Uso de Cookies',
                'register-terms-link': 'Términos de Servicio',
                'register-submit': 'Registrar',
                'register-email-issue': '¿Tu correo no funciona?',
                'register-verify': 'Verificar validación'
            },
            en: {
                // Navigation
                'nav-home': 'Home',
                'nav-lang': 'English',
                
                // Login
                'login-title': 'Welcome back!',
                'login-subtitle': 'Sign in to access all your resources.',
                'login-no-account': "Don't have an account?",
                'login-register-link': 'Sign up',
                'login-user-placeholder': 'Username',
                'login-password-placeholder': 'Password',
                'login-cookies': 'By signing in you accept the',
                'login-cookies-link': 'Cookie Usage',
                'login-terms-link': 'Terms of Service',
                'login-submit': 'Sign In',
                'login-forgot': 'Forgot your password?',
                'login-restore': 'Restore',
                
                // Register
                'register-title': 'Welcome!',
                'register-subtitle': 'Create an account to access all your resources.',
                'register-have-account': 'Already have an account?',
                'register-login-link': 'Sign In',
                'register-user-placeholder': 'Username',
                'register-email-placeholder': 'Email',
                'register-password-placeholder': 'Password',
                'register-cookies': 'By registering you accept the',
                'register-cookies-link': 'Cookie Usage',
                'register-terms-link': 'Terms of Service',
                'register-submit': 'Register',
                'register-email-issue': 'Email not working?',
                'register-verify': 'Check validation '
            }
        };
        
        this.init();
    }
    
    init() {
        this.updateLanguage();
        this.bindEvents();
    }
    
    bindEvents() {
        const langButton = document.getElementById('lang-button');
        if (langButton) {
            langButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleLanguage();
            })
            
            langButton.style.cursor = 'pointer';
            langButton.style.transition = 'all 0.3s ease';
            
            langButton.addEventListener('mouseleave', () => {
                langButton.style.transform = 'scale(1)';
                langButton.style.opacity = '1';
            });
        }
    }
    
    toggleLanguage() {
        const previousLang = this.currentLanguage;
        this.currentLanguage = this.currentLanguage === 'es' ? 'en' : 'es';
        localStorage.setItem('videoelements-lang', this.currentLanguage);
        this.updateLanguage();
    }
    
    updateLanguage() {
        document.documentElement.lang = this.currentLanguage;
        
        this.updateMetaTags();
        const elements = document.querySelectorAll('[data-lang]');
        elements.forEach(element => {
            const key = element.getAttribute('data-lang');
            if (this.translations[this.currentLanguage][key]) {
                if (element.tagName === 'INPUT' && element.type !== 'submit') {
                    element.placeholder = this.translations[this.currentLanguage][key];
                } else if (element.tagName === 'BUTTON') {
                    element.textContent = this.translations[this.currentLanguage][key];
                } else {
                    element.textContent = this.translations[this.currentLanguage][key];
                }
            }
        });
        
        const langButton = document.querySelector('#lang-button');
        const langText = document.querySelector('#lang-text');
        if (langButton && langText) {
            const nextLang = this.currentLanguage === 'es' ? 'EN' : 'ES';
            const currentLang = this.currentLanguage === 'es' ? 'ES' : 'EN';
            
            langText.innerHTML = `
                <span idstyle="font-weight: bold;">${currentLang}</span>
                <span style="margin: 0 5px; opacity: 0.6;">→</span>
                <span style="opacity: 0.7;">${nextLang}</span>
            `;
            
            langButton.title = `Idioma actual: ${this.currentLanguage === 'es' ? 'Español' : 'English'}. Click para cambiar a ${this.currentLanguage === 'es' ? 'English' : 'Español'}`;
        }
    }
    
    updateMetaTags() {
        const metaDescription = document.querySelector('meta[name="description"]');
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDescription = document.querySelector('meta[property="og:description"]');
        const twitterTitle = document.querySelector('meta[property="twitter:title"]');
        const twitterDescription = document.querySelector('meta[property="twitter:description"]');
        
        if (this.currentLanguage === 'es') {
            if (metaDescription) metaDescription.content = 'Accede a Video Elements - Inicia sesión o regístrate en nuestra plataforma de gestión multimedia. Gestiona tus videos favoritos de forma segura y organizada.';
            if (metaKeywords) metaKeywords.content = 'login, registro, video elements, acceso, cuenta, multimedia, videos, plataforma';
            if (ogTitle) ogTitle.content = 'Video Elements | Acceso y Registro';
            if (ogDescription) ogDescription.content = 'Accede a Video Elements - Inicia sesión o regístrate en nuestra plataforma de gestión multimedia.';
            if (twitterTitle) twitterTitle.content = 'Video Elements | Acceso y Registro';
            if (twitterDescription) twitterDescription.content = 'Accede a Video Elements - Inicia sesión o regístrate en nuestra plataforma de gestión multimedia.';
        } else {
            if (metaDescription) metaDescription.content = 'Access Video Elements - Sign in or register on our multimedia management platform. Manage your favorite videos safely and organized.';
            if (metaKeywords) metaKeywords.content = 'login, register, video elements, access, account, multimedia, videos, platform';
            if (ogTitle) ogTitle.content = 'Video Elements | Access and Registration';
            if (ogDescription) ogDescription.content = 'Access Video Elements - Sign in or register on our multimedia management platform.';
            if (twitterTitle) twitterTitle.content = 'Video Elements | Access and Registration';
            if (twitterDescription) twitterDescription.content = 'Access Video Elements - Sign in or register on our multimedia management platform.';
        }
    }
}

// Inicializar el sistema de idiomas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new LanguageManager();
});
