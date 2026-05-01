const cooperative = {
    async renderDashboard() {
        const container = document.getElementById('cooperative-scanner');
        const allLots = await database.getAllLots();
        const pendingLots = allLots.filter(l => l.status === 'CREATED').reverse();

        container.innerHTML = `
            <div class="search-box">
                <input type="text" id="coop-search" placeholder="ID ou scanner lot..." oninput="cooperative.filterLots(this.value)">
                <button onclick="cooperative.startScan()">
                    <i data-lucide="camera" style="width:16px; height:16px"></i>
                    SCAN
                </button>
            </div>
            
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="l">En attente</span>
                    <span class="v">${pendingLots.length}</span>
                </div>
                <div class="stat-item">
                    <span class="l">TOTAL COLLECTÉ</span>
                    <span class="v">${allLots.length}</span>
                </div>
            </div>

            <h3 class="section-title">Lots à valider</h3>
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
            gap.className = 'weight-diff ' + (diff < 0.02 ? 'gap-ok' : diff < 0.05 ? 'gap-warning' : 'gap-danger');
        };
    },

    async validateLot(lotId) {
        const offWeight = parseFloat(document.getElementById('official-weight').value);
        const moisture = parseFloat(document.getElementById('moisture-test').value);
        const payment = document.getElementById('payment-status').value;
        
        if (isNaN(offWeight)) return alert("Poids invalide");
        
        const lot = await database.getLot(lotId);
        lot.weight = offWeight;
        lot.status = 'COOP_VALIDATED';
        lot.quality = { moisture, grade: this.selectedGrade };
        lot.paymentStatus = payment;
        await database.updateLot(lot);

        const tx = await blockchain.simulateTransaction({ offWeight, lotId, moisture, grade: this.selectedGrade }, 'COOP-001');
        await database.addTransfer({
            lotId: lotId,
            actorId: 'COOP-001',
            type: 'COOP_VALIDATION',
            timestamp: new Date(),
            hash: tx.hash,
            data: { 
                officialWeight: offWeight, 
                grade: this.selectedGrade,
                moisture: moisture,
                paymentStatus: payment
            }
        });

        alert("Lot validé et scellé dans la blockchain !");
        this.cancelValidation();
    },

    cancelValidation() {
        document.getElementById('cooperative-details').classList.add('hidden');
        document.getElementById('cooperative-scanner').classList.remove('hidden');
        document.getElementById('btn-scan').classList.remove('hidden');
        this.renderDashboard();
    },

    async renderHistory() {
        const transfers = await idb.openDB(DB_NAME, DB_VERSION).then(db => db.getAll('transfers'));
        const coopTransfers = transfers.filter(t => t.actorId === 'COOP-001').reverse();
        
        const container = document.getElementById('cooperative-history');
        container.innerHTML = `
            <h3>Collectes du jour</h3>
            <div class="history-list">
                ${coopTransfers.map(t => `
                    <div class="history-item">
                        <div class="history-info">
                            <div class="id">${t.lotId}</div>
                            <div class="date">${utils.formatDate(t.timestamp)}</div>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px">
                            <span class="badge badge-success">${t.data.grade}</span>
                            <span style="font-size:9px; font-weight:800; color:var(--success); text-transform:uppercase">CERTIFIÉ EUDR</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};
