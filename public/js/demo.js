const demo = {
    isActive: false,
    isPaused: false,
    speed: 1,
    currentStep: 0,
    steps: [],
    timer: null,

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('demo') === 'true') {
            this.isActive = true;
            this.renderUI();
            this.prepareDemoData();
            console.log("Mode Démo Activé");
        }
    },

    renderUI() {
        // Bouton flottant
        const floatBtn = document.createElement('div');
        floatBtn.id = 'demo-float-btn';
        floatBtn.innerHTML = 'LANCER LA DÉMO';
        floatBtn.className = 'demo-btn-main';
        floatBtn.onclick = () => this.start();
        document.body.appendChild(floatBtn);

        // Barre de contrôle
        const controlBar = document.createElement('div');
        controlBar.id = 'demo-control-bar';
        controlBar.className = 'demo-bar hidden';
        controlBar.innerHTML = `
            <div class="demo-progress">
                <div id="demo-progress-bar" class="progress-fill"></div>
            </div>
            <div class="demo-controls">
                <button onclick="demo.reset()">RESET</button>
                <button id="demo-pause-btn" onclick="demo.togglePause()">PAUSE</button>
                <select onchange="demo.setSpeed(this.value)">
                    <option value="1">Vitesse x1</option>
                    <option value="2">Vitesse x2</option>
                    <option value="4">Vitesse x4</option>
                </select>
                <div id="demo-step-text">Étape 0/4</div>
            </div>
        `;
        document.body.appendChild(controlBar);

        // Overlay
        const overlay = document.createElement('div');
        overlay.id = 'demo-overlay';
        overlay.className = 'demo-overlay hidden';
        overlay.innerHTML = '<div class="demo-msg">Action en cours...</div>';
        document.body.appendChild(overlay);
    },

    async prepareDemoData() {
        // Nettoyer si besoin ou ajouter des données de base
        // Pour l'instant on garde à 0 comme demandé
    },

    async start() {
        if (this.currentStep > 0) return;
        
        // Initial clearing for a clean demo run
        if (window.database && database.clearAllData) {
            await database.clearAllData();
        }
        
        this.currentStep = 1;
        document.getElementById('demo-float-btn').classList.add('hidden');
        document.getElementById('demo-control-bar').classList.remove('hidden');
        document.getElementById('demo-overlay').classList.remove('hidden');
        this.executeStep();
    },

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('demo-pause-btn').innerHTML = this.isPaused ? 'REPRENDRE' : 'PAUSE';
    },

    setSpeed(s) {
        this.speed = parseInt(s);
    },

    async reset() {
        location.reload(); // Simple et efficace
    },

    updateUI() {
        document.getElementById('demo-step-text').innerText = `Étape ${this.currentStep}/4`;
        document.getElementById('demo-progress-bar').style.width = `${(this.currentStep / 4) * 100}%`;
    },

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms / this.speed));
    },

    setPersona(role) {
        const personas = {
            farmer: { id: 'AGRI-DEMO-01', firstname: 'Kodjo', lastname: 'Démovore', role: 'AGR' },
            coop: { id: 'COOP-DEMO-01', firstname: 'Coopérative', lastname: 'Plateau', role: 'COOP' },
            export: { id: 'EXP-DEMO-01', firstname: 'Exporter', lastname: 'Togo', role: 'EXP' },
            verify: { id: 'VERIFY-DEMO-01', firstname: 'Audit', lastname: 'EUDR', role: 'VER' }
        };
        localStorage.setItem('chaincacao_user', JSON.stringify(personas[role]));
    },

    highlight(selector) {
        const el = document.querySelector(selector);
        if (el) {
            el.classList.add('demo-highlight');
            setTimeout(() => el.classList.remove('demo-highlight'), 1500 / this.speed);
        }
    },

    async executeStep() {
        if (this.isPaused) {
            setTimeout(() => this.executeStep(), 500);
            return;
        }

        this.updateUI();

        try {
            switch(this.currentStep) {
                case 1: 
                    this.setPersona('farmer');
                    await this.stepFarmer(); 
                    break;
                case 2: 
                    this.setPersona('coop');
                    await this.stepCoop(); 
                    break;
                case 3: 
                    this.setPersona('export');
                    await this.stepExport(); 
                    break;
                case 4: 
                    this.setPersona('verify');
                    await this.stepVerify(); 
                    break;
                default: 
                    this.finish();
                    return;
            }
            this.currentStep++;
            this.executeStep();
        } catch (e) {
            console.error("Erreur démo:", e);
            alert("La démo a rencontré une erreur technique : " + e.message);
        }
    },

    // --- ÉTAPES ---

    async stepFarmer() {
        document.querySelector('.demo-msg').innerText = "Étape 1: Création du lot par l'agriculteur (Kodjo)";
        app.switchScreen('agriculteur');
        await this.wait(1000);
        
        // Ouvrir formulaire
        this.highlight('#btn-new-lot');
        agriculteur.showForm();
        await this.wait(1000);

        // Étape 1: Saisie
        document.getElementById('f-weight').value = 75;
        document.getElementById('f-species').value = "Forastero";
        document.getElementById('f-region').value = "Kpalimé";
        this.highlight('#f-weight');
        await this.wait(800);
        await agriculteur.nextStep(2);
        await this.wait(1000);

        // Étape 2: GPS
        agriculteur.formState.data.gps = { lat: 6.9075, lng: 0.6339 };
        document.getElementById('f-gps-display').innerHTML = "GPS: 6.9075, 0.6339 (Fixé pour démo)";
        this.highlight('#btn-gps-capture');
        await this.wait(1000);

        await agriculteur.nextStep(3);
        await this.wait(2000);
    },

    async stepCoop() {
        document.querySelector('.demo-msg').innerText = "Étape 2: Validation coopérative & Scellage Blockchain";
        app.switchScreen('cooperative');
        await this.wait(1000);

        const lots = await database.getAllLots();
        if (lots.length === 0) throw new Error("Lot non trouvé dans la base");
        const demoLot = lots[lots.length - 1];

        // Ouvrir validation
        await cooperative.loadLotDetails(demoLot.id);
        await this.wait(1000);

        // Saisir poids réel
        document.getElementById('official-weight').value = 74.5;
        this.highlight('#official-weight');
        await this.wait(1000);

        // Sceller
        this.highlight('.btn-primary');
        await cooperative.validateLot(demoLot.id);
        await this.wait(2000);
    },

    async stepExport() {
        document.querySelector('.demo-msg').innerText = "Étape 3: Procédure export & Douanes Togolaises";
        app.switchScreen('exportateur');
        await this.wait(1000);

        // Sélectionner
        const check = document.querySelector('.arrival-check');
        if (check) {
            check.checked = true;
            exportateur.updateSummary();
        }
        this.highlight('.arrival-card');
        await this.wait(800);

        // Traiter Export
        this.highlight('.btn-white');
        
        // Override confirm/prompt
        const oldConfirm = window.confirm;
        const oldPrompt = window.prompt;
        const oldAlert = window.alert;
        window.confirm = () => true;
        window.prompt = () => "MEDU-TG-2026-001";
        window.alert = () => true;
        
        await exportateur.createManifest();
        
        window.confirm = oldConfirm;
        window.prompt = oldPrompt;
        window.alert = oldAlert;
        
        await this.wait(2000); 
    },

    async stepVerify() {
        document.querySelector('.demo-msg').innerText = "Étape 4: Vérification finale (Consommateur/Régulateur)";
        app.switchScreen('verificateur');
        await this.wait(1000);

        const lots = await database.getAllLots();
        const demoLot = lots[lots.length - 1];

        document.getElementById('verify-input').value = demoLot.id;
        this.highlight('#verify-input');
        await this.wait(500);

        this.highlight('#btn-verify');
        await verificateur.verifyLot(demoLot.id);
        await this.wait(2000);

        // Download simulation
        this.highlight('#btn-download-pdf');
        await this.wait(1500);
    },

    finish() {
        document.getElementById('demo-overlay').classList.add('hidden');
        const summary = document.createElement('div');
        summary.className = 'demo-summary';
        summary.innerHTML = `
            <h2>Démo Terminée !</h2>
            <p>Le lot a parcouru toute la chaîne en 8 secondes (simulées).</p>
            <p>Toutes les étapes sont inscrites sur <b>Polygon Mainnet</b> (simulé).</p>
            <button onclick="location.reload()">RETOUR AU MODE RÉEL</button>
        `;
        document.body.appendChild(summary);
    }
};

window.addEventListener('load', () => demo.init());
