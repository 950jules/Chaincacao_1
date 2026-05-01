const app = {
    async init() {
        try {
            console.log("ChainCacao starting...");
            await database.init();
            offline.init();
            verificateur.init();

            this.setupNavigation();
            
            // Render initial screen
            agriculteur.renderDashboard();
        } catch (error) {
            console.error("Initialization Failed:", error);
            document.body.innerHTML = `
                <div style="padding: 2rem; color: red; background: #fff; font-family: sans-serif;">
                    <h1>Erreur d'initialisation</h1>
                    <p>${error.message}</p>
                    <pre>${error.stack}</pre>
                    <button onclick="location.reload()" style="padding: 1rem; border: 1px solid #ccc; border-radius: 8px; cursor: pointer;">Réessayer</button>
                </div>
            `;
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
