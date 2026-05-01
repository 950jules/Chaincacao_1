const exportateur = {
    async renderDashboard() {
        const lots = await database.getAllLots();
        const validatedLots = lots.filter(l => l.status === 'COOP_VALIDATED');
        const totalWeight = validatedLots.reduce((acc, l) => acc + l.weight, 0);

        const container = document.getElementById('exportateur-dashboard');
        container.innerHTML = `
            <div class="pipeline">
                <div class="pipeline-step active">Entrepôt</div>
                <div class="pipeline-step">Tri & Séchage</div>
                <div class="pipeline-step">Ensachage</div>
                <div class="pipeline-step">Chargement</div>
                <div class="pipeline-step">Douanes</div>
            </div>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="l">Lots en attente</span>
                    <span class="v">${validatedLots.length}</span>
                </div>
                <div class="stat-item">
                    <span class="l">Poids total</span>
                    <span class="v">${totalWeight.toFixed(1)}kg</span>
                </div>
            </div>

            <div class="search-box" style="margin-bottom: 2rem">
                <input type="text" id="export-search" placeholder="Rechercher un ID de sac..." oninput="exportateur.filterLots(this.value)">
                <button onclick="exportateur.startScan()">📷 SCAN</button>
            </div>

            <h3 style="margin: 2rem 0 1rem; font-family:var(--font-heading); font-size: 1rem; font-weight: 800;">Lots prêts pour l'export</h3>
            <div id="export-lot-list" style="margin-bottom: 8rem">
                ${validatedLots.map(lot => `
                    <div class="card arrival-card">
                        <input type="checkbox" class="arrival-check" data-id="${lot.id}" data-weight="${lot.weight}" onchange="exportateur.updateSummary()">
                        <div style="flex:1">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px">
                                <strong style="font-family:var(--font-heading); font-weight:800; color:var(--primary)">${lot.id}</strong>
                                <span class="badge badge-success">${lot.weight}kg</span>
                            </div>
                            <div style="font-size:0.75rem; color:var(--secondary); font-weight:600; display:flex; align-items:center; gap:8px">
                                <span>${lot.species} • ${utils.formatDate(lot.timestamp)}</span>
                                <span style="color:var(--success); font-weight:800; font-size:9px; border:1px solid var(--success); padding:2px 6px; border-radius:4px">EUDR ✓</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
                ${validatedLots.length === 0 ? '<div style="text-align:center; padding:3rem; color:var(--secondary)">Aucun lot en attente</div>' : ''}
            </div>
            <div id="selection-summary" class="selection-summary hidden">
                <div>
                    <div id="sel-count">0 LOTS SÉLECTIONNÉS</div>
                    <div id="sel-weight">0.0 KG</div>
                </div>
                <button class="btn btn-white" style="background:white; color:var(--primary); font-family:var(--font-heading); font-weight:800; padding: 0.8rem 1.2rem; font-size: 0.75rem" onclick="exportateur.createManifest()">CRÉER MANIFESTE</button>
            </div>
        `;
    },

    updateSummary() {
        const checks = document.querySelectorAll('.arrival-check:checked');
        const count = checks.length;
        const summary = document.getElementById('selection-summary');
        
        if (count > 0) {
            summary.classList.remove('hidden');
            document.getElementById('sel-count').innerText = `${count} LOTS SÉLECTIONNÉS`;
            
            let total = 0;
            checks.forEach(c => total += parseFloat(c.dataset.weight));
            document.getElementById('sel-weight').innerText = `${total.toFixed(1)} KG`;
        } else {
            summary.classList.add('hidden');
        }
    },

    filterLots(query) {
        const q = query.toLowerCase();
        const cards = document.querySelectorAll('.arrival-card');
        cards.forEach(card => {
            const id = card.querySelector('strong').innerText.toLowerCase();
            if (id.includes(q)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    },

    async startScan() {
        const code = await camera.scanQR();
        if (code) {
            document.getElementById('export-search').value = code;
            this.filterLots(code);
        }
    },

    async createManifest() {
        const checks = document.querySelectorAll('.arrival-check:checked');
        const ids = Array.from(checks).map(c => c.getAttribute('data-id'));
        
        if (confirm(`Générer un manifeste d'exportation pour ces ${ids.length} lots ?`)) {
            const containerId = prompt("Entrez le numéro du container (Ex: MEDU-1234567) :") || "CONT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
            
            for (const id of ids) {
                const lot = await database.getLot(id);
                lot.status = 'EXPORTED';
                lot.containerId = containerId;
                await database.updateLot(lot);
                
                const tx = await blockchain.simulateTransaction({ action: 'EXPORT_READY', lots: ids, containerId }, 'EXP-001');
                await database.addTransfer({
                    lotId: id,
                    actorId: 'EXP-001',
                    type: 'EXPORT_SHIPPED',
                    timestamp: new Date(),
                    hash: tx.hash,
                    data: { 
                        containerId: containerId,
                        compliance: 'EUDR_VERIFIED_DEFORESTATION_FREE',
                        destination: 'Rotterdam, NL' 
                    }
                });
            }
            alert(`Succès !\nContainer: ${containerId}\nLes certificats EUDR ont été générés pour ${ids.length} lots.`);
            this.renderDashboard();
        }
    }
};
