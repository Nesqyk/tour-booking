/**
 * Authentication Handler for Landing Page
 * Handles login and registration
 * 
 * Ruf Bac Tour Services
 */

(function() {
    'use strict';
    
    // Check if user is logged in on page load
    async function checkAuthStatus() {
        try {
            const response = await API.getCurrentUser();
            if (response.success && response.data) {
                updateUIForLoggedInUser(response.data);
            }
        } catch (error) {
            // User is not logged in, keep default UI
            console.log('Not authenticated');
        }
    }
    
    /**
     * Update UI for logged in user
     */
    function updateUIForLoggedInUser(user) {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerHTML = `<i class="bi bi-person-circle me-2"></i>${user.email}`;
            loginBtn.setAttribute('onclick', 'Auth.logout()');
            loginBtn.removeAttribute('data-bs-toggle');
            loginBtn.removeAttribute('data-bs-target');
        }
    }
    
    /**
     * Handle login form submission
     */
    async function handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const messageDiv = document.getElementById('authMessage');
        
        messageDiv.innerHTML = '<div class="alert alert-info">Logging in...</div>';
        
        try {
            const response = await API.login({ email, password });
            
            if (response.success) {
                messageDiv.innerHTML = '<div class="alert alert-success">Login successful! Redirecting...</div>';
                
                // Update UI
                updateUIForLoggedInUser(response.data);
                
                // Close modal after delay
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    modal.hide();
                    
                    // Redirect based on user type
                    if (response.data.user_type === 'admin') {
                        window.location.href = 'index.html';
                    } else {
                        // Customer stays on landing page or redirects to booking
                        messageDiv.innerHTML = '';
                    }
                }, 1000);
            }
        } catch (error) {
            messageDiv.innerHTML = `<div class="alert alert-danger">${error.message || 'Login failed. Please check your credentials.'}</div>`;
        }
    }
    
    /**
     * Handle register form submission
     */
    async function handleRegister(e) {
        e.preventDefault();
        
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
        const messageDiv = document.getElementById('authMessage');
        
        // Validate passwords match
        if (password !== passwordConfirm) {
            messageDiv.innerHTML = '<div class="alert alert-danger">Passwords do not match!</div>';
            return;
        }
        
        // Validate password length
        if (password.length < 6) {
            messageDiv.innerHTML = '<div class="alert alert-danger">Password must be at least 6 characters long!</div>';
            return;
        }
        
        messageDiv.innerHTML = '<div class="alert alert-info">Registering...</div>';
        
        try {
            const response = await API.register({
                email,
                password,
                user_type: 'customer' // Always customer for public registration
            });
            
            if (response.success) {
                messageDiv.innerHTML = '<div class="alert alert-success">Registration successful! Please login.</div>';
                
                // Switch to login tab
                const loginTab = document.getElementById('login-tab');
                if (loginTab) {
                    loginTab.click();
                }
                
                // Pre-fill email
                document.getElementById('loginEmail').value = email;
            }
        } catch (error) {
            messageDiv.innerHTML = `<div class="alert alert-danger">${error.message || 'Registration failed. Please try again.'}</div>`;
        }
    }
    
    /**
     * Handle logout
     */
    async function logout() {
        try {
            await API.logout();
            
            // Update UI
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Login';
                loginBtn.setAttribute('data-bs-toggle', 'modal');
                loginBtn.setAttribute('data-bs-target', '#loginModal');
                loginBtn.removeAttribute('onclick');
            }
            
            // If on dashboard, redirect to landing page
            if (window.location.pathname.includes('index.html')) {
                window.location.href = 'landing.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            
            if (loginForm) {
                loginForm.addEventListener('submit', handleLogin);
            }
            
            if (registerForm) {
                registerForm.addEventListener('submit', handleRegister);
            }
            
            checkAuthStatus();
        });
    } else {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
        }
        
        checkAuthStatus();
    }
    
    // Export for global access
    window.Auth = {
        logout
    };
})();

