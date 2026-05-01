const app = {
    async init() {
        try {
            console.log("ChainCacao starting...");
            await database.init();
            offline.init();
            auth.init();
            
            this.setupNavigation();
            this.setupPWAInstall();
            this.refreshIcons();
        } catch (error) {
            console.error("App init error:", error);
        }
    },

    initUserSession(user) {
        document.getElementById('user-id-display').innerText = user.id;
        
        // Hide/Show navigation items based on role if needed
        // For now we allow all for demo purposes as requested
        
        if (user.role === 'AGR') this.switchScreen('agriculteur');
        else if (user.role === 'COOP') this.switchScreen('cooperative');
        else if (user.role === 'EXP') this.switchScreen('exportateur');
        else if (user.role === 'VER') this.switchScreen('verificateur');
    },

    switchScreen(id) {
        const navItem = document.querySelector(`.nav-item[data-screen="${id}"]`);
        if (navItem) navItem.click();
    },

    refreshIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const screens = document.querySelectorAll('.screen');

        navItems.forEach(item => {
            item.onclick = () => {
                const screenId = item.getAttribute('data-screen');
                
                // Update Nav
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                // Update Screen
                screens.forEach(s => s.classList.add('hidden'));
                document.getElementById(`screen-${screenId}`).classList.remove('hidden');

                // Render content
                this.renderScreen(screenId);
            };
        });
    },

    setupPWAInstall() {
        let deferredPrompt;
        const installBtn = document.getElementById('install-btn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtn.style.display = 'block';
        });

        installBtn.onclick = async (e) => {
            e.stopPropagation();
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installBtn.style.display = 'none';
            }
            deferredPrompt = null;
        };
    },

    renderScreen(id) {
        if (id === 'agriculteur') agriculteur.renderDashboard();
        if (id === 'cooperative') cooperative.renderDashboard();
        if (id === 'exportateur') exportateur.renderDashboard();
        if (id === 'verificateur') verificateur.init();
    },

    showModal(content) {
        const modal = document.getElementById('modal-container');
        document.getElementById('modal-body').innerHTML = content;
        modal.classList.remove('hidden');
        
        document.querySelector('.close-modal').onclick = () => {
            modal.classList.add('hidden');
        };
    },

    setLoaded() {
        document.body.classList.add('loaded');
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            if (splash) splash.style.display = 'none';
        }, 500);
    }
};

window.onload = () => {
    app.init().then(() => {
        app.setLoaded();
    });
};
