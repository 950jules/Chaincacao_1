const agriculteur = {
    async renderDashboard() {
        // Get current user from localStorage or auth
        const userJson = localStorage.getItem('chaincacao_user');
        const user = userJson ? JSON.parse(userJson) : { id: 'UNK', firstname: 'Agriculteur' };
        
        console.log("Rendering Agriculteur dashboard for:", user.id);
        
        // Filtrage des récoltes : Seules les récoltes de cet agriculteur
        const lots = await database.getLotsByFarmer(user.id);
        const totalWeight = lots.reduce((acc, lot) => acc + (lot.weight || 0), 0);
        
        const container = document.getElementById('agriculteur-dashboard');
        container.innerHTML = `
            <div class="welcome-header">
                <div>
                    <small>Bienvenue au dépôt,</small>
                    <h2>Bonjour ${user.firstname}! 👋</h2>
                </div>
                <div class="location-badge">
                    <i data-lucide="map-pin"></i>
                </div>
            </div>
            
            <div class="status-horizontal-band">
                <div class="status-mini yellow">
                    <span class="val">${lots.filter(l => l.status === 'CREATED').length}</span>
                    <span class="lbl">EN ATTENTE</span>
                </div>
                <div class="status-mini green">
                    <span class="val">${lots.filter(l => l.status === 'COLLECTED' || l.status === 'EXPORTED').length}</span>
                    <span class="lbl">ACCEPTÉS</span>
                </div>
                <div class="status-mini red">
                    <span class="val">0</span>
                    <span class="lbl">REFUSÉS</span>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-item">
                    <span class="l">TOTAL SEMAINE</span>
                    <span class="v">${totalWeight.toFixed(1)}kg</span>
                </div>
                <div class="stat-item">
                    <span class="l">DERNIÈRE PESÉE</span>
                    <span class="v">${lots.length > 0 ? lots[lots.length - 1].weight : 0}kg</span>
                </div>
            </div>
            <button class="btn btn-primary" id="btn-new-lot">
                <i data-lucide="plus-circle" style="width:18px; height:18px"></i>
                NOUVEAU LOT
            </button>

            <!-- NOUVEAU: SECTION URGENCE TRANSFERT -->
            <section id="urgence-section" class="card urgent-card">
                <div class="urgent-header">
                    <span class="urgent-icon">🚨</span>
                    <h3 style="margin:0; font-size:0.95rem">Urgence Transfert</h3>
                </div>
                <p class="urgent-text" style="font-size:0.75rem; margin:8px 0; opacity:0.8">
                    Coopérative saturée ou indisponible ? Transférez votre lot vers une autre coopérative.
                </p>
                <div style="display:flex; flex-direction:column; gap:8px">
                    <div class="form-group-mini">
                        <label style="font-size:0.65rem; font-weight:800; text-transform:uppercase">Coopérative de destination</label>
                        <select id="urgence-coop-select" class="input-mini">
                            <option value="">-- Choisir --</option>
                            ${['COOP-KPALIME', 'COOP-AGOU', 'COOP-KLOTO', 'COOP-DANYI', 'COOP-AKEBOU']
                                .filter(c => c !== user.cooperative)
                                .map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group-mini">
                        <label style="font-size:0.65rem; font-weight:800; text-transform:uppercase">Lot à transférer</label>
                        <select id="urgence-lot-select" class="input-mini">
                            <option value="">-- Choisir un lot --</option>
                            ${lots.filter(l => l.status === 'CREATED').map(l => `<option value="${l.id}">${l.id} (${l.weight}kg)</option>`).join('')}
                        </select>
                    </div>
                    <button onclick="agriculteur.transferLotUrgence()" class="btn btn-warning" style="margin-top:5px; height:40px; font-size:0.75rem">
                        🔄 Transférer le lot
                    </button>
                </div>
            </section>

            <h3 class="section-title">Historique des récoltes</h3>
            <div id="agri-lot-list">
                ${lots.reverse().map(lot => `
                    <div class="card" onclick="agriculteur.showDetails('${lot.id}')">
                        <div class="card-header">
                            <strong class="lot-id">${lot.id}</strong>
                            <span class="badge ${lot.status === 'CREATED' ? 'badge-warning' : 'badge-success'}">
                                ${lot.status === 'CREATED' ? 'Nouveau' : 'Validé'}
                            </span>
                        </div>
                        <div class="card-footer">
                            <i data-lucide="calendar" style="width:12px; height:12px"></i>
                            <span>${utils.formatDate(lot.timestamp)}</span>
                            <span class="dot">•</span>
                            <i data-lucide="weight" style="width:12px; height:12px"></i>
                            <span>${lot.weight}kg</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        app.refreshIcons();
        document.getElementById('btn-new-lot').onclick = () => this.showForm();
    },

    showForm() {
        document.getElementById('agriculteur-dashboard').classList.add('hidden');
        document.getElementById('agriculteur-form-container').classList.remove('hidden');
        this.renderFormStep(1);
    },

    formState: { step: 1, data: {} },

    renderFormStep(step) {
        const container = document.getElementById('agriculteur-form-container');
        this.formState.step = step;

        let content = '';
        if (step === 1) {
            content = `
                <h3>Étape 1: Détails du lot</h3>
                <div class="input-group">
                    <label>Poids estimé (kg)</label>
                    <input type="number" id="f-weight" value="${this.formState.data.weight || ''}">
                </div>
                <div class="input-group">
                    <label>Espèce</label>
                    <select id="f-species">
                        ${utils.SPECIES.map(s => `<option ${this.formState.data.species === s ?'selected':''}>${s}</option>`).join('')}
                    </select>
                </div>
                <div class="input-group">
                    <label>Région de récolte</label>
                    <select id="f-region">
                        ${utils.REGIONS.map(r => `<option ${this.formState.data.region === r ?'selected':''}>${r}</option>`).join('')}
                    </select>
                </div>
                <div class="action-bar">
                    <button class="btn btn-outline" onclick="agriculteur.cancelForm()">Annuler</button>
                    <button class="btn btn-primary" onclick="agriculteur.nextStep(2)">Suivant</button>
                </div>
            `;
        } else if (step === 2) {
            content = `
                <h3 class="step-title">Étape 2: Preuves terrain</h3>
                <div class="photo-preview" id="f-photo-preview">
                    ${this.formState.data.photo ? `<img src="${this.formState.data.photo}">` : '<span><i data-lucide="image"></i> Pas de photo</span>'}
                </div>
                <button class="btn btn-outline" style="background:rgba(212,163,115,0.1); border:1px solid var(--primary); color:var(--primary)" onclick="agriculteur.takePhoto()">
                    <i data-lucide="camera"></i> PHOTO DU SAC
                </button>
                
                <div id="mini-map" class="mini-map-container" style="display:none"></div>
                <div id="f-gps-display" style="margin-top:0.5rem"></div>

                <button class="btn btn-primary" id="btn-gps-capture" onclick="agriculteur.getGps()">
                    <i data-lucide="map-pin"></i> CAPTURER GPS
                </button>
                
                <div class="action-bar">
                    <button class="btn btn-outline" onclick="agriculteur.renderFormStep(1)">Retour</button>
                    <button class="btn btn-primary" onclick="agriculteur.nextStep(3)">Valider</button>
                </div>
            `;
        }
 else if (step === 3) {
            const txHash = this.formState.data.txHash;
            content = `
                <div class="qr-result">
                    <div class="badge badge-success">Succès ! Lot enregistré</div>
                    <h2 style="margin-bottom:0.5rem">Lot: ${this.formState.data.id}</h2>
                    
                    <div id="qrcode-display" style="display:flex; justify-content:center; margin: 1.5rem 0"></div>
                    
                    ${txHash ? `
                        <div class="blockchain-link-box" style="background:rgba(130,71,229,0.1); padding:1rem; border-radius:12px; margin: 1rem 0; border:1px dashed #8247E5">
                            <div style="font-size:0.7rem; color:#8247E5; font-weight:800; text-transform:uppercase; margin-bottom:0.5rem">🔐 Ancrage Blockchain (Polygon)</div>
                            <div style="font-family:monospace; font-size:0.7rem; color:var(--primary); word-break:break-all; margin-bottom:1rem">${txHash}</div>
                            <a href="https://polygonscan.com/tx/${txHash}" target="_blank" class="btn btn-sm" style="background:#8247E5; color:white; font-size:0.7rem; width:100%; display:block; text-align:center; padding:8px 0">
                                <i data-lucide="external-link" style="width:12px"></i> VOIR SUR POLYGONSCAN
                            </a>
                        </div>
                    ` : ''}

                    <button class="btn btn-primary" style="margin-top:1rem; width:100%" onclick="agriculteur.cancelForm()">Retour au dashboard</button>
                </div>
            `;
        }

        container.innerHTML = `<div class="form-step">${content}</div>`;
        if (step === 3) {
            qrcodeControl.generate('qrcode-display', this.formState.data.id);
        }
    },

    async nextStep(next) {
        if (this.formState.step === 1) {
            const weight = parseFloat(document.getElementById('f-weight').value);
            if (!utils.isValidWeight(weight)) return alert("Poids invalide");
            this.formState.data.weight = weight;
            this.formState.data.species = document.getElementById('f-species').value;
            this.formState.data.region = document.getElementById('f-region').value;
        }
        if (this.formState.step === 2 && next === 3) {
            if (!this.formState.data.gps) return alert("GPS requis");
            await this.saveLot();
        }
        this.renderFormStep(next);
    },

    async takePhoto() {
        const photo = await camera.capturePhoto();
        this.formState.data.photo = photo;
        this.renderFormStep(2);
    },

    async getGps() {
        const btn = document.getElementById('btn-gps-capture');
        const display = document.getElementById('f-gps-display');
        
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> CAPTURE EN COURS...`;
        
        try {
            const pos = await window.ChainCacaoGPS.getCurrentPosition();
            this.formState.data.gps = pos;
            
            display.innerHTML = `
                <div class="gps-success">
                    POSITION CAPTURÉE<br>
                    <small>${pos.lat.toFixed(5)}°, ${pos.lng.toFixed(5)}°</small>
                </div>
            `;
            
            window.ChainCacaoGPS.displayMiniMap('mini-map', pos.lat, pos.lng);
            
        } catch (e) { 
            display.innerHTML = `<div class="gps-error">ERREUR GPS : ${e.message}</div>`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="map-pin"></i> RE-CAPTURER POSITION`;
        }
    },

    async saveLot() {
        // Correction : S'assurer que les données et l'authentification sont là
        const user = auth.currentUser;
        if (!user) {
            window.showToast("Session expirée, veuillez vous reconnecter", "error");
            return;
        }

        const id = utils.generateId(this.formState.data.region);
        const now = new Date();
        const lot = {
            id: id,
            farmerId: user.id || "ID_MANQUANT",
            farmerName: `${user.firstname || 'Jul'} ${user.lastname || ''}`.trim(),
            cooperative: user.cooperative || "Standard", // On lie le lot à la coop de l'agriculteur
            timestamp: now,
            weight: parseFloat(this.formState.data.weight) || 0,
            species: this.formState.data.species || "Cacao",
            region: this.formState.data.region || "Inconnue",
            gps: this.formState.data.gps || { lat: 0, lng: 0 },
            photo: this.formState.data.photo || null,
            status: 'CREATED'
        };

        try {
            window.showToast("Enregistrement du lot...", "info");
            
            // 1. Sauvegarde Firestore
            await database.addLot(lot);
            this.formState.data.id = id;

            // 2. Notarisation Blockchain + journalisation en arrière-plan
            void (async () => {
                try {
                    const tx = await blockchain.notarize(lot, user.id);
                    this.formState.data.txHash = tx.hash;

                    try {
                        await database.addTransfer({
                            lotId: id,
                            actorId: user.id,
                            type: 'CREATION',
                            timestamp: now,
                            hash: tx.hash,
                            data: { 
                                weight: lot.weight, 
                                network: tx.network || 'Polygon', 
                                block: tx.blockNumber || 0 
                            }
                        });
                    } catch (transferError) {
                        console.warn('Transfer log failed (non-fatal):', transferError);
                    }
                } catch (blockchainError) {
                    console.warn('Blockchain notarization failed (non-fatal):', blockchainError);
                }
            })();

            window.showToast(`✅ Lot ${id} enregistré`, "success");
            this.renderFormStep(3); // On passe à l'étape finale de succès
        } catch (error) {
            console.error("Save Lot Error:", error);
            window.showToast("Erreur lors de la validation. Vérifiez votre connexion ou MetaMask.", "error");
        }
    },

    cancelForm() {
        this.formState = { step: 1, data: {} };
        document.getElementById('agriculteur-dashboard').classList.remove('hidden');
        document.getElementById('agriculteur-form-container').classList.add('hidden');
        this.renderDashboard();
    },

    async transferLotUrgence() {
        const targetCoop = document.getElementById('urgence-coop-select').value;
        const lotId = document.getElementById('urgence-lot-select').value;

        if (!targetCoop || !lotId) {
            return window.showToast("Veuillez remplir tous les champs", "warning");
        }

        try {
            const lot = await database.getLot(lotId);
            if (!lot) throw new Error("Lot introuvable");

            // Simulation du transfert (on change juste la destination dans les logs ou le lot si nécessaire)
            // Dans ce système simplifié, on notifie juste la blockchain du changement de destination
            const now = new Date();
            await database.addTransfer({
                lotId: lotId,
                actorId: auth.currentUser.id,
                type: 'TRANSFERT_URGENCE',
                timestamp: now,
                data: { from: auth.currentUser.cooperative, to: targetCoop }
            });

            window.showToast(`🔄 Lot ${lotId} transféré vers ${targetCoop}`, "success");
            this.renderDashboard();
        } catch (e) {
            window.showToast("Erreur lors du transfert", "error");
        }
    },

    async showDetails(id) {
        const lot = await database.getLot(id);
        app.showModal(`
            <h3>Détails Lot ${lot.id}</h3>
            <p><strong>Poids:</strong> ${lot.weight}kg</p>
            <p><strong>Statut:</strong> ${lot.status}</p>
            <div id="qr-detail-box" style="text-align:center; margin:1rem"></div>
        `);
        qrcodeControl.generate('qr-detail-box', lot.id);
    }
};
