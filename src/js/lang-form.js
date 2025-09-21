// Sistema de cambio de idioma para Video Elements
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
                'register-verify': 'Verificar'
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
                'register-verify': 'Verify'
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
            });
            
            // Agregar efecto visual al botón
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
        
        // Mostrar notificación de cambio
        this.showLanguageNotification(previousLang, this.currentLanguage);
    }
    
    showLanguageNotification(fromLang, toLang) {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        const langNames = {
            'es': 'Español',
            'en': 'English'
        };
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
        
        // Actualizar el texto del botón de idioma
        const langButton = document.querySelector('#lang-button');
        const langText = document.querySelector('#lang-text');
        if (langButton && langText) {
            // Mostrar el idioma actual y el siguiente disponible
            const nextLang = this.currentLanguage === 'es' ? 'EN' : 'ES';
            const currentLang = this.currentLanguage === 'es' ? 'ES' : 'EN';
            
            // Actualizar el texto del botón
            langText.innerHTML = `
                <span idstyle="font-weight: bold;">${currentLang}</span>
                <span style="margin: 0 5px; opacity: 0.6;">→</span>
                <span style="opacity: 0.7;">${nextLang}</span>
            `;
            
            // Agregar título para mostrar información adicional
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
