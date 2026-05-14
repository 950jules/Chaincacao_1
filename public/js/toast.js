/**
 * Système de notifications Toast
 */
(function(window) {
    function createToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            
            // Si le body n'existe pas encore (chargement depuis le head), on peut attendre
            if (document.body) {
                document.body.appendChild(container);
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    if (!document.getElementById('toast-container')) {
                        document.body.appendChild(container);
                    }
                });
            }
        }
        return container;
    }

    function showToast(message, type = 'info') {
        const container = createToastContainer();
        const toast = document.createElement('div');
        const icons = { 
            success: '✅', 
            error: '❌', 
            info: 'ℹ️', 
            warning: '⚠️' 
        };
        
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span class="toast-icon">${icons[type]}</span> <span class="toast-message">${message}</span>`;
        
        container.appendChild(toast);
        
        // Suppression automatique après 3 secondes
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => {
                    if (toast.parentNode) toast.remove();
                }, 300);
            }
        }, 3000);
    }

    // Export global
    window.showToast = showToast;
})(window);
