const app = {
    async init() {
        try {
            console.log("ChainCacao starting...");
            
            // Forcer l'affichage immédiat du splash screen si pas déjà fait
            const splash = document.getElementById('splash-screen');
            if (splash) splash.style.opacity = '1';

            // Masquer le splash screen après un court délai
            setTimeout(() => {
                document.body.classList.add('loaded');
                console.log("Splash screen hidden");
            }, 1000);

            if (typeof database !== 'undefined') await database.init();
            if (typeof offline !== 'undefined') offline.init();
            if (typeof auth !== 'undefined') auth.init();
            else console.error("Auth module not found!");
            
            this.setupNavigation();
            this.setupPWAInstall();
            this.refreshIcons();
        } catch (error) {
            console.error("App init error:", error);
        }
    },

    initUserSession(user) {
        const display = document.getElementById('user-id-display');
        if (display) {
            const name = user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : (user.name || user.id);
            const normalizedRole = (user.role || '').toString().toUpperCase();
            const coopBadge = (normalizedRole === 'AGR' && user.cooperative) ? 
                `<span class="badge badge-success" style="font-size:8px; margin-top:2px">${user.cooperative}</span>` : '';
            
            display.innerHTML = `<div style="display:flex; flex-direction:column; align-items:flex-end">
                <span style="font-weight:900; font-size:11px; white-space:nowrap">${name}</span>
                <span style="font-size:9px; opacity:0.7; font-weight:600">${user.id}</span>
                ${coopBadge}
            </div>`;
        }
        
        const navItems = document.querySelectorAll('.nav-item');
        let allowedScreen = '';
        const role = (user.role || '').toString().toUpperCase();

        if (role === 'AGR') allowedScreen = 'agriculteur';
        else if (role === 'COOP') allowedScreen = 'cooperative';
        else if (role === 'EXP') allowedScreen = 'exportateur';
        else if (role === 'VER') allowedScreen = 'verificateur';

        navItems.forEach(item => {
            const screenId = item.getAttribute('data-screen');
            if (screenId === allowedScreen) {
                item.style.display = 'flex';
                item.classList.add('active');
            } else {
                item.style.display = 'none'; // Use display none strictly
                item.classList.remove('active');
            }
        });
        
        if (allowedScreen) {
            this.switchScreen(allowedScreen);
        }
    },

    async switchScreen(id) {
        const current = document.querySelector('.screen:not(.hidden)');
        const target = document.getElementById(`screen-${id}`);
        const navItems = document.querySelectorAll('.nav-item');
        const targetItem = document.querySelector(`.nav-item[data-screen="${id}"]`);

        if (current === target) return;

        // 1. Fade out écran actuel
        if (current) {
            current.classList.add('screen-exit');
            await new Promise(r => setTimeout(r, 200));
            current.classList.add('hidden');
            current.classList.remove('screen-exit');
        }

        // 2. Afficher Skeleton loader
        this.showSkeleton(target);

        // 3. Update Nav
        navItems.forEach(i => i.classList.remove('active'));
        if (targetItem) targetItem.classList.add('active');

        // 4. Fade in nouvel écran
        target.classList.remove('hidden');
        target.classList.add('screen-enter');
        
        // Simuler un temps de chargement pour le skeleton (profesionnalisme)
        await new Promise(r => setTimeout(r, 400));
        
        target.classList.remove('screen-enter');

        // 5. Charger données réelles
        await this.renderScreen(id);
        
        this.hideSkeleton(target);
    },

    showSkeleton(targetScreen) {
        const skeleton = document.getElementById('skeleton-loader');
        if (skeleton) {
            skeleton.classList.remove('hidden');
            // On cache le contenu réel de l'écran pendant que le skeleton pulse
            const content = targetScreen.querySelectorAll('div');
            content.forEach(c => c.style.opacity = '0');
        }
    },

    hideSkeleton(targetScreen) {
        const skeleton = document.getElementById('skeleton-loader');
        if (skeleton) {
            skeleton.classList.add('hidden');
            const content = targetScreen.querySelectorAll('div');
            content.forEach(c => c.style.opacity = '1');
        }
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
                const user = auth.currentUser;
                
                // Vérification de sécurité supplémentaire
                let isAllowed = false;
                if (!user) return;
                if (user.role === 'AGR' && screenId === 'agriculteur') isAllowed = true;
                else if (user.role === 'COOP' && screenId === 'cooperative') isAllowed = true;
                else if (user.role === 'EXP' && screenId === 'exportateur') isAllowed = true;
                else if (user.role === 'VER' && screenId === 'verificateur') isAllowed = true;

                if (!isAllowed) {
                    console.warn("Accès refusé à cet écran pour votre rôle.");
                    return;
                }
                
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

window.app = app;

window.onload = () => {
    app.init().then(() => {
        app.setLoaded();
    });
};
