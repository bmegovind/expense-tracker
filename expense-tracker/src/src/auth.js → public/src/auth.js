import { initAuth, updateAuthUI } from './auth.js';
import { initExpenses } from './expenses.js';

// Initialize the application
function initApp() {
    initAuth();
    
    // Check auth state on load
    if (netlifyIdentity.currentUser()) {
        document.getElementById('app-content').classList.remove('hidden');
        initExpenses();
    }
    
    updateAuthUI();
}

// Wait for Netlify Identity to load
document.addEventListener('DOMContentLoaded', () => {
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on('init', initApp);
    } else {
        console.error('Netlify Identity not loaded');
    }
});
