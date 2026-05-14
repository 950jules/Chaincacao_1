/**
 * Gestion du mode Sombre / Clair
 */
const themeManager = {
    init() {
        const savedTheme = localStorage.getItem('chaincacao_theme') || 'light';
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark-mode'); // Plus sûr qu'au body si on est dans le head
            // On l'ajoute aussi au body quand il est là pour la compatibilité avec le CSS existant
            document.addEventListener('DOMContentLoaded', () => {
                document.body.classList.add('dark-mode');
            });
        }
    },

    toggle() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('chaincacao_theme', isDark ? 'dark' : 'light');
        this.updateToggleButton();
        if (window.showToast) window.showToast(`Mode ${isDark ? 'sombre' : 'clair'} activé`, 'info');
    },

    updateToggleButton() {
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            const isDark = document.body.classList.contains('dark-mode');
            btn.innerHTML = isDark ? '☀️' : '🌙';
        }
    }
};

window.themeManager = themeManager;
themeManager.init();
