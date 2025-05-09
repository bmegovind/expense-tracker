// Initialize Netlify Identity
export function initAuth() {
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on("init", user => {
            if (user) {
                document.getElementById('app-content').classList.remove('hidden');
                updateAuthUI();
            }
        });
        
        window.netlifyIdentity.on("login", user => {
            document.getElementById('app-content').classList.remove('hidden');
            updateAuthUI();
            document.getElementById('auth-modal').classList.add('hidden');
            window.location.reload();
        });
        
        window.netlifyIdentity.on("logout", () => {
            document.getElementById('app-content').classList.add('hidden');
            updateAuthUI();
        });
        
        // Open modal when auth button clicked
        document.getElementById('auth-button').addEventListener('click', () => {
            const modal = document.getElementById('auth-modal');
            modal.classList.remove('hidden');
        });
        
        // Close modal
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('auth-modal').classList.add('hidden');
        });
    }
    
    // Set current year
    document.getElementById('current-year').textContent = new Date().getFullYear();
}

// Update UI based on auth state
export function updateAuthUI() {
    const user = netlifyIdentity.currentUser();
    const authButton = document.getElementById('auth-button');
    const userEmail = document.getElementById('user-email');
    
    if (user) {
        userEmail.textContent = user.email;
        authButton.textContent = 'Logout';
        authButton.onclick = () => {
            netlifyIdentity.logout();
        };
    } else {
        userEmail.textContent = '';
        authButton.textContent = 'Login';
        authButton.onclick = () => {
            document.getElementById('auth-modal').classList.remove('hidden');
        };
    }
}

// Check if user is authenticated
export function isAuthenticated() {
    return netlifyIdentity.currentUser() !== null;
}

// Get current user ID
export function getUserId() {
    const user = netlifyIdentity.currentUser();
    return user ? user.id : null;
}
