const offline = {
    init() {
        window.addEventListener('online', () => this.updateStatus());
        window.addEventListener('offline', () => this.updateStatus());
        this.updateStatus();

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log("SW Registered", reg))
                .catch(err => console.log("SW Error", err));
        }
    },

    updateStatus() {
        const badge = document.getElementById('connection-status');
        const banner = document.getElementById('offline-banner');
        
        if (navigator.onLine) {
            badge.innerText = "En ligne";
            badge.className = "status-badge online";
            banner.classList.add('hidden');
        } else {
            badge.innerText = "Hors-ligne";
            badge.className = "status-badge";
            banner.classList.remove('hidden');
        }
    }
};
