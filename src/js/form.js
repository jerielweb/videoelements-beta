
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
});
