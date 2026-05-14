const cooperative = {
    async renderDashboard() {
        const container = document.getElementById('cooperative-scanner');
        const user = auth.currentUser;
        // La coopérative voit tous les lots de SA zone/coopérative
        const allLots = await database.getLotsByCooperative(user.cooperative);
        const pendingLots = allLots.filter(l => l.status === 'CREATED').reverse();

        container.innerHTML = `
            <div class="search-box">
                <input type="text" id="coop-search" placeholder="Vérifier ID lot..." style="flex:1">
                <button onclick="cooperative.verifyLotSearch()" class="btn-search-icon">
                    <i data-lucide="search" style="width:18px; height:18px"></i>
                </button>
                <button onclick="cooperative.startScan()">
                    <i data-lucide="camera" style="width:18px; height:18px"></i>
                </button>
            </div>
            
            <div class="stats-grid">
                <div class="stat-item clickable" onclick="cooperative.filterList('pending')">
                    <span class="l">En attente</span>
                    <span class="v" id="stat-pending">${pendingLots.length}</span>
                </div>
                <div class="stat-item clickable" onclick="cooperative.filterList('collected')">
                    <span class="l">TOTAL COLLECTÉ</span>
                    <span class="v" id="stat-collected">${allLots.filter(l => l.status !== 'CREATED' && l.coopId === (auth.currentUser?.id || 'COOP-001')).length}</span>
                </div>
            </div>

            <h3 class="section-title" id="list-title">Lots à valider</h3>
            <div id="coop-lot-list">
                ${pendingLots.map(lot => `
                    <div class="card" onclick="cooperative.loadLotDetails('${lot.id}')">
                        <div class="card-header">
                            <strong class="lot-id">${lot.id}</strong>
                            <span class="badge ${lot.weight > 50 ? 'badge-success' : 'badge-warning'}">${lot.weight}kg</span>
                        </div>
                        <div class="card-footer">
                            <i data-lucide="user" style="width:12px; height:12px"></i>
                            <span>${lot.farmerName}</span>
                            <span class="dot">•</span>
                            <i data-lucide="clock" style="width:12px; height:12px"></i>
                            <span>${utils.formatDate(lot.timestamp)}</span>
                        </div>
                    </div>
                `).join('')}
                ${pendingLots.length === 0 ? '<div class="empty-state">Tout est validé !</div>' : ''}
            </div>
        `;
        app.refreshIcons();
        
        this.renderHistory();
    },

    async verifyLotSearch() {
        const id = document.getElementById('coop-search').value.trim().toUpperCase();
        if (!id) return window.showToast("Veuillez entrer un ID de lot", "warning");
        
        window.showToast("Recherche du lot...", "info");
        const lot = await database.getLot(id);
        if (lot) {
            this.showLotDetailsPopup(lot);
        } else {
            window.showToast("Lot introuvable", "error");
        }
    },

    async showLotDetailsPopup(lot) {
        let statusText = "INCONNU";
        let statusClass = "";
        
        switch(lot.status) {
            case 'CREATED': statusText = "Producteur (En attente)"; statusClass = "badge-warning"; break;
            case 'COLLECTED': statusText = "Collecté (Prêt pour export)"; statusClass = "badge-success"; break;
            case 'EXPORTED': statusText = "Exporté"; statusClass = "badge-info"; break;
        }

        app.showModal(`
            <div style="padding:1rem">
                <h3 style="color:var(--primary); margin-bottom:1.5rem">Fiche de Traçabilité</h3>
                <div class="card" style="background:var(--card-bg)">
                    <div style="margin-bottom:1rem">
                        <label style="font-size:0.7rem; text-transform:uppercase; color:var(--secondary)">ID LOT</label>
                        <div style="font-weight:800; font-size:1.2rem">${lot.id}</div>
                    </div>
                    <div style="margin-bottom:1rem">
                        <label style="font-size:0.7rem; text-transform:uppercase; color:var(--secondary)">Statut</label>
                        <div><span class="badge ${statusClass}">${statusText}</span></div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:1rem">
                        <div>
                            <label style="font-size:0.7rem; text-transform:uppercase; color:var(--secondary)">Producteur</label>
                            <div style="font-weight:700">${lot.farmerName}</div>
                        </div>
                        <div>
                            <label style="font-size:0.7rem; text-transform:uppercase; color:var(--secondary)">Poids</label>
                            <div style="font-weight:700">${lot.weight} kg</div>
                        </div>
                    </div>
                    <div>
                        <label style="font-size:0.7rem; text-transform:uppercase; color:var(--secondary)">Localité</label>
                        <div style="font-weight:700">${lot.locality}</div>
                    </div>
                </div>
                ${lot.status === 'CREATED' ? `
                    <button class="btn btn-primary" style="width:100%; margin-top:1.5rem" onclick="document.querySelector('.close-modal').click(); cooperative.loadLotDetails('${lot.id}')">VALIDER CE LOT MAINTENANT</button>
                ` : ''}
            </div>
        `);
        app.refreshIcons();
    },

    async filterList(type) {
        const allLots = await database.getAllLots();
        const user = auth.currentUser || { id: 'COOP-001' };
        let filtered = [];
        let title = "";

        if (type === 'pending') {
            filtered = allLots.filter(l => l.status === 'CREATED').reverse();
            title = "Lots en attente de validation";
        } else {
            filtered = allLots.filter(l => (l.status === 'COLLECTED' || l.status === 'EXPORTED') && l.coopId === user.id).reverse();
            title = "Historique des collectes";
        }

        document.getElementById('list-title').innerText = title;
        const listContainer = document.getElementById('coop-lot-list');
        listContainer.innerHTML = filtered.map(lot => `
            <div class="card" onclick="cooperative.loadLotDetails('${lot.id}')">
                <div class="card-header">
                    <strong class="lot-id">${lot.id}</strong>
                    <span class="badge ${lot.weight > 50 ? 'badge-success' : 'badge-warning'}">${lot.weight}kg</span>
                </div>
                <div class="card-footer">
                    <i data-lucide="user" style="width:12px; height:12px"></i>
                    <span>${lot.farmerName}</span>
                    <span class="dot">•</span>
                    <i data-lucide="${lot.status === 'CREATED' ? 'clock' : 'check-circle'}" style="width:12px; height:12px"></i>
                    <span>${lot.status === 'CREATED' ? utils.formatDate(lot.timestamp) : 'Validé'}</span>
                </div>
            </div>
        `).join('');
        if (filtered.length === 0) listContainer.innerHTML = `<div class="empty-state">Aucun lot trouvé</div>`;
        app.refreshIcons();
    },

    filterLots(query) {
        const q = query.toLowerCase();
        const cards = document.querySelectorAll('#coop-lot-list .card');
        cards.forEach(card => {
            const id = card.querySelector('strong').innerText.toLowerCase();
            if (id.includes(q)) card.style.display = 'block';
            else card.style.display = 'none';
        });
    },

    async startScan() {
        const code = await camera.scanQR();
        if (code) {
            document.getElementById('coop-search').value = code;
            this.filterLots(code);
            // S'il n'y a qu'un résultat exact, on l'ouvre
            const lot = await database.getLot(code);
            if (lot) this.loadLotDetails(code);
        }
    },

    async loadLotDetails(lotId) {
        const lot = await database.getLot(lotId);
        if (!lot) return alert("Lot introuvable !");
        this.showLotValidation(lot);
    },

    showLotValidation(lot) {
        const container = document.getElementById('cooperative-details');
        container.classList.remove('hidden');
        document.getElementById('cooperative-scanner').classList.add('hidden');
        
        container.innerHTML = `
            <div class="card coop-lot-card">
                <h2 style="font-family:var(--font-heading); margin-bottom: 1.5rem; font-weight:800; color:var(--primary)">Validation Lot: ${lot.id}</h2>
                <div style="margin-bottom: 1.5rem">
                    <p style="font-size:0.8rem; color:var(--secondary); font-weight:700; text-transform:uppercase">Producteur</p>
                    <p style="font-size:1.1rem; font-weight:800; color:var(--primary)">${lot.farmerName}</p>
                </div>
                <div style="margin-bottom: 2rem">
                    <p style="font-size:0.8rem; color:var(--secondary); font-weight:700; text-transform:uppercase">Origine GPS</p>
                    <p style="font-size:0.9rem; font-weight:600; color:var(--secondary)">${lot.gps.lat.toFixed(4)}, ${lot.gps.lng.toFixed(4)}</p>
                </div>
                
                <div class="input-group">
                    <label>Poids officiel (pesée coop)</label>
                    <input type="number" id="official-weight" placeholder="0.0" style="font-size: 1.5rem; text-align: center; font-weight: 800;">
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1.5rem">
                    <div class="input-group">
                        <label>Taux humidité (%)</label>
                        <input type="number" id="moisture-test" value="7.5" step="0.1" style="text-align:center">
                    </div>
                    <div class="input-group">
                        <label>Paiement effectué</label>
                        <select id="payment-status">
                            <option value="pending">En attente</option>
                            <option value="paid">PAYÉ</option>
                        </select>
                    </div>
                </div>

                <div class="weight-comparison hidden" id="comp-box">
                    <span style="font-weight:700; color:var(--secondary)">Écart:</span>
                    <span id="weight-gap" class="weight-diff">0%</span>
                </div>

                <div class="input-group">
                    <label>Grade de qualité</label>
                    <div class="grade-toggles" id="grade-container">
                        <button class="grade-btn active" data-grade="Grade 1">Grade 1</button>
                        <button class="grade-btn" data-grade="Grade 2">Grade 2</button>
                        <button class="grade-btn" data-grade="Hors-norme">Hors-norme</button>
                    </div>
                </div>

                <div class="action-bar">
                    <button class="btn btn-outline" onclick="cooperative.cancelValidation()">Annuler</button>
                    <button class="btn btn-primary" onclick="cooperative.validateLot('${lot.id}')">SCELLER DANS LA BLOCKCHAIN</button>
                </div>
            </div>
        `;

        this.selectedGrade = 'Grade 1';
        const btns = document.querySelectorAll('.grade-btn');
        btns.forEach(btn => {
            btn.onclick = () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedGrade = btn.dataset.grade;
            };
        });

        document.getElementById('official-weight').oninput = (e) => {
            const off = parseFloat(e.target.value);
            if (isNaN(off)) return;
            const diff = Math.abs(off - lot.weight) / lot.weight;
            const box = document.getElementById('comp-box');
            const gap = document.getElementById('weight-gap');
            
            box.classList.remove('hidden');
            gap.innerText = utils.formatPercentage(diff);
            
            // UI Visual feedback on colors and background
            if (diff > 0.03) {
                gap.style.color = 'var(--danger)';
                box.style.background = 'rgba(211, 47, 47, 0.1)';
                box.style.borderColor = 'rgba(211, 47, 47, 0.3)';
            } else if (diff > 0.01) {
                gap.style.color = 'var(--warning)';
                box.style.background = 'rgba(251, 192, 43, 0.1)';
                box.style.borderColor = 'rgba(251, 192, 43, 0.3)';
            } else {
                gap.style.color = 'var(--success)';
                box.style.background = 'rgba(137, 187, 7, 0.1)';
                box.style.borderColor = 'rgba(137, 187, 7, 0.3)';
            }
        };
    },

    async validateLot(lotId) {
        const user = auth.currentUser || { id: 'COOP-001' };
        const offWeightInput = document.getElementById('official-weight');
        const offWeight = parseFloat(offWeightInput.value);
        const moisture = parseFloat(document.getElementById('moisture-test').value);
        const payment = document.getElementById('payment-status').value;
        
        if (isNaN(offWeight)) return alert("Veuillez saisir le poids officiel.");
        
        const lot = await database.getLot(lotId);
        const diff = Math.abs(offWeight - lot.weight) / lot.weight;

        if (diff > 0.03) {
            alert(`SANTÉ: L'écart de poids (${utils.formatPercentage(diff)}) est trop important (max 3%). Validation refusée.`);
            offWeightInput.style.borderColor = 'var(--danger)';
            offWeightInput.focus();
            return;
        }

        lot.weight = offWeight;
        lot.officialWeight = offWeight;
        lot.status = 'COLLECTED';
        lot.quality = { moisture, grade: this.selectedGrade };
        lot.qualityGrade = this.selectedGrade;
        lot.paymentStatus = payment;
        lot.coopId = user.id;
        await database.updateLot(lot);

        // Journal local immédiat pour éviter tout blocage UI
        const txRecord = {
            lotId,
            actorId: user.id,
            type: 'COOP_VALIDATION',
            timestamp: new Date(),
            hash: `pending-${lotId}-${Date.now()}`,
            data: { 
                officialWeight: offWeight, 
                grade: this.selectedGrade,
                moisture: moisture,
                paymentStatus: payment
            }
        };
        await database.addTransfer(txRecord);

        window.showToast("Lot validé. Scellage blockchain en arrière-plan...", "success");

        void (async () => {
            try {
                const tx = await blockchain.notarize({ offWeight, lotId, moisture, grade: this.selectedGrade }, user.id);
                await database.addTransfer({
                    ...txRecord,
                    hash: tx.hash,
                    data: {
                        ...txRecord.data,
                        network: tx.network || 'Polygon',
                        block: tx.blockNumber || 0
                    }
                });
            } catch (error) {
                console.warn('Blockchain sealing background task failed:', error);
            }
        })();

        this.cancelValidation();
    },

    cancelValidation() {
        document.getElementById('cooperative-details').classList.add('hidden');
        document.getElementById('cooperative-scanner').classList.remove('hidden');
        document.getElementById('btn-scan').classList.remove('hidden');
        this.renderDashboard();
    },

    async renderHistory() {
        const user = auth.currentUser || { id: 'COOP-001' };
        const allLots = await database.getAllLots();
        const validatedLots = allLots.filter(l => (l.status === 'COLLECTED' || l.status === 'EXPORTED') && l.coopId === user.id).reverse();
        
        const container = document.getElementById('cooperative-history');
        container.innerHTML = `
            <h3>Collectes du jour</h3>
            <div class="history-list">
                ${validatedLots.map(l => `
                    <div class="history-item">
                        <div class="history-info">
                            <div class="id">${l.id}</div>
                            <div class="date">${utils.formatDate(l.timestamp)}</div>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px">
                            <span class="badge badge-success">${l.quality?.grade || 'Grade 1'}</span>
                            <span style="font-size:9px; font-weight:800; color:var(--success); text-transform:uppercase">CERTIFIÉ EUDR</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};
