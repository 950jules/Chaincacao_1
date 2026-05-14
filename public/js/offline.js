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
            if (badge) {
                badge.innerText = "";
                badge.className = "status-badge online hidden";
            }
            if (banner) banner.classList.add('hidden');
        } else {
            if (badge) {
                badge.innerText = "Hors-ligne";
                badge.className = "status-badge";
            }
            if (banner) banner.classList.remove('hidden');
        }
    }
};
