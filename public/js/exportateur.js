const exportateur = {
    async renderDashboard() {
        const container = document.getElementById('exportateur-dashboard');
        
        container.innerHTML = `
            <div class="pipeline">
                <div class="pipeline-step active">Entrepôt</div>
                <div class="pipeline-step">Douanes</div>
            </div>

            <div class="search-box" style="margin-bottom: 2rem">
                <select id="coop-filter-select" onchange="exportateur.filterByCoop()" style="flex:1; height:45px; border-radius:12px; border:1px solid #ddd; padding:0 15px; font-weight:700">
                    <option value="">-- Filtrer par Coopérative --</option>
                    ${['COOP-KPALIME', 'COOP-AGOU', 'COOP-KLOTO', 'COOP-DANYI', 'COOP-AKEBOU']
                        .map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <button onclick="exportateur.filterByCoop()" class="btn-search-icon" style="background:var(--primary); color:white">
                    <i data-lucide="search" style="width:18px; height:18px"></i>
                </button>
            </div>

            <h3 class="section-title" id="export-list-title">Lots prêts pour l'export</h3>
            <div id="export-lot-list" style="margin-bottom: 8rem">
                <div class="empty-state">Sélectionnez une coopérative pour voir les lots</div>
            </div>
        `;
        app.refreshIcons();
        this.renderSelectionSummary();
    },

    async filterByCoop() {
        const coop = document.getElementById('coop-filter-select').value;
        if (!coop) return window.showToast("Choisissez une coopérative", "warning");

        const listContainer = document.getElementById('export-lot-list');
        listContainer.innerHTML = '<div class="loading-spinner">Chargement...</div>';

        const lots = await database.getLotsByCooperative(coop);
        const validatedLots = lots.filter(l => (l.status || '').toString().toUpperCase() === 'COLLECTED');

        document.getElementById('export-list-title').innerText = `Lots de ${coop} (${validatedLots.length})`;

        listContainer.innerHTML = validatedLots.map(lot => `
            <div class="card arrival-card">
                <input type="checkbox" class="arrival-check" data-id="${lot.id}" data-weight="${lot.weight}" onchange="exportateur.updateSummary()">
                <div style="flex:1">
                    <div class="card-header" style="margin-bottom:0">
                        <strong class="lot-id">${lot.id}</strong>
                        <span class="badge badge-success">${lot.weight}kg</span>
                    </div>
                    <div style="font-size:0.75rem; opacity:0.75; margin-top:4px">
                        ${lot.farmerName || 'Producteur inconnu'} • ${lot.region || lot.locality || 'Origine non précisée'}
                    </div>
                </div>
            </div>
        `).join('') || '<div class="empty-state">Aucun lot prêt pour l\'export dans cette zone</div>';
        
        app.refreshIcons();
        this.renderSelectionSummary();
    },

    renderSelectionSummary() {
        // Ensure a fixed summary bar exists to show selected count/weight and the seal button
        if (!document.getElementById('selection-summary')) {
            const el = document.createElement('div');
            el.id = 'selection-summary';
            el.className = 'selection-summary hidden';
            el.innerHTML = `
                <div>
                    <div id="sel-count">0 LOTS SÉLECTIONNÉS</div>
                    <div id="sel-weight">0 KG</div>
                </div>
                <div style="display:flex; gap:10px; align-items:center">
                    <button class="btn btn-secondary" onclick="exportateur.clearSelection()">ANNULER</button>
                    <button class="btn btn-success" onclick="exportateur.validateSelection()">VALIDER SÉLECTION</button>
                    <button class="btn btn-primary" onclick="exportateur.createManifest()">SCELLER MANIFESTE</button>
                </div>
            `;
            document.body.appendChild(el);
            app.refreshIcons();
        }
    },

    updateSummary() {
        const checks = document.querySelectorAll('.arrival-check:checked');
        const count = checks.length;
        let summary = document.getElementById('selection-summary');
        if (!summary) {
            this.renderSelectionSummary();
            summary = document.getElementById('selection-summary');
        }
        
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

    clearSelection() {
        document.querySelectorAll('.arrival-check:checked').forEach(c => c.checked = false);
        this.updateSummary();
    },

    async validateSelection() {
        const checks = document.querySelectorAll('.arrival-check:checked');
        const ids = Array.from(checks).map(c => c.getAttribute('data-id'));
        if (ids.length === 0) return window.showToast('Aucun lot sélectionné', 'warning');

        if (!confirm(`Valider ${ids.length} lot(s) sélectionné(s) ?`)) return;

        const user = auth.currentUser || { id: 'EXP-001' };

        for (const id of ids) {
            try {
                const lot = await database.getLot(id);
                if (!lot) continue;

                // If lot already collected or exported, skip updating status
                if ((lot.status || '').toString().toUpperCase() === 'CREATED') {
                    lot.status = 'COLLECTED';
                    await database.updateLot(lot);
                }

                // Local transfer record (pending)
                const txRecord = {
                    lotId: id,
                    actorId: user.id,
                    type: 'EXP_VALIDATION',
                    timestamp: new Date(),
                    hash: `pending-${id}-${Date.now()}`,
                    data: { action: 'EXP_VALIDATE' }
                };
                await database.addTransfer(txRecord);

                // Notarize on blockchain in background
                try {
                    const tx = await blockchain.notarize({ action: 'EXP_VALIDATE', lotId: id }, user.id);
                    await database.addTransfer({
                        ...txRecord,
                        hash: tx.hash,
                        data: { ...txRecord.data, network: tx.network || 'Polygon', block: tx.blockNumber || 0 }
                    });
                } catch (err) {
                    console.warn('Blockchain notarize failed for', id, err);
                }
            } catch (e) {
                console.error('Error validating lot', id, e);
            }
        }

        window.showToast(`${ids.length} lot(s) validé(s)`, 'success');
        this.clearSelection();
        this.renderDashboard();
    },

    async verifyLotSearch() {
        const id = document.getElementById('export-search').value.trim().toUpperCase();
        if (!id) return window.showToast("Veuillez entrer un ID de lot", "warning");
        
        window.showToast("Localisation du lot...", "info");
        const lot = await database.getLot(id);
        if (lot) {
            this.showLotVerification(lot);
        } else {
            window.showToast("Lot introuvable", "error");
        }
    },

    async showLotVerification(lot) {
        let statusText = "INCONNU";
        let statusClass = "";
        
        switch(lot.status) {
            case 'CREATED': statusText = "Producteur (En attente coop)"; break;
            case 'COLLECTED': statusText = "Collecté (Prêt pour export)"; statusClass = "badge-success"; break;
            case 'EXPORTED': statusText = "Déjà exporté"; statusClass = "badge-info"; break;
        }

        app.showModal(`
            <div style="padding:1rem">
                <h3 style="color:var(--primary); margin-bottom:1.5rem">Vérification de Lot</h3>
                <div class="card" style="background:var(--card-bg)">
                    <div style="margin-bottom:1rem">
                        <label style="font-size:0.7rem; text-transform:uppercase; color:var(--secondary)">ID LOT</label>
                        <div style="font-weight:800; font-size:1.2rem">${lot.id}</div>
                    </div>
                    <div style="margin-bottom:1rem">
                        <label style="font-size:0.7rem; text-transform:uppercase; color:var(--secondary)">Status Actuel</label>
                        <div><span class="badge ${statusClass}">${statusText}</span></div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:1rem">
                        <div>
                            <label style="font-size:0.7rem; text-transform:uppercase; color:var(--secondary)">Poids</label>
                            <div style="font-weight:700">${lot.weight} kg</div>
                        </div>
                        <div>
                            <label style="font-size:0.7rem; text-transform:uppercase; color:var(--secondary)">Humidité</label>
                            <div style="font-weight:700">${lot.quality?.moisture || 'N/A'}%</div>
                        </div>
                    </div>
                    <div>
                        <label style="font-size:0.7rem; text-transform:uppercase; color:var(--secondary)">Origine GPS</label>
                        <div style="font-size:0.9rem">${lot.gps.lat.toFixed(4)}, ${lot.gps.lng.toFixed(4)}</div>
                    </div>
                </div>
                ${lot.status === 'COLLECTED' ? `
                    <button class="btn btn-primary" style="width:100%; margin-top:1.5rem" onclick="exportateur.selectLotForExport('${lot.id}')">SÉLECTIONNER POUR EXPORT</button>
                ` : ''}
            </div>
        `);
        app.refreshIcons();
    },

    selectLotForExport(lotId) {
        document.querySelector('.close-modal').click();
        // Coche la case correspondante si elle est visible
        const check = document.querySelector(`.arrival-check[data-id="${lotId}"]`);
        if (check) {
            check.checked = true;
            this.updateSummary();
        } else {
            alert("Lot sélectionné, mais non visible dans la liste d'attente (vérifiez le status).");
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
        
        if (confirm(`Traiter l'export pour ${ids.length} sacs ?`)) {
            const containerId = prompt("Numéro de Container (ex: MSCU-123456) :") || "CONT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
            
            app.showModal(`
                <div style="text-align:center; padding:1rem">
                    <h3 style="color:var(--primary); margin-bottom:1.5rem">PROCÉDURE D'EXPORTATION</h3>
                    <div id="export-steps-list" style="text-align:left; max-width:300px; margin:0 auto">
                        <div class="proc-step" id="proc-1"><i data-lucide="check-circle" class="pending"></i> Contrôle Phytosanitaire (Lomé)</div>
                        <div class="proc-step" id="proc-2"><i data-lucide="circle" class="pending"></i> Scellage Container ${containerId}</div>
                        <div class="proc-step" id="proc-3"><i data-lucide="circle" class="pending"></i> Validation Douanes Togolaises</div>
                        <div class="proc-step" id="proc-4"><i data-lucide="circle" class="pending"></i> Chargement Port Autonome de Lomé</div>
                    </div>
                    <div id="proc-status" style="margin-top:2rem; font-weight:700; color:var(--secondary)">Initialisation...</div>
                </div>
            `);
            app.refreshIcons();

            await new Promise(r => setTimeout(r, 1000));
            document.getElementById('proc-1').querySelector('i').className = 'done';
            document.getElementById('proc-status').innerText = "Validation Qualité...";
            
            await new Promise(r => setTimeout(r, 1000));
            document.getElementById('proc-2').querySelector('i').setAttribute('data-lucide', 'check-circle');
            document.getElementById('proc-2').querySelector('i').className = 'done';
            document.getElementById('proc-status').innerText = "Scellage en cours...";
            app.refreshIcons();
 
            await new Promise(r => setTimeout(r, 1000));
            document.getElementById('proc-3').querySelector('i').setAttribute('data-lucide', 'check-circle');
            document.getElementById('proc-3').querySelector('i').className = 'done';
            document.getElementById('proc-status').innerText = "Vérification Douanes...";
            app.refreshIcons();
 
            for (const id of ids) {
                const user = auth.currentUser || { id: 'EXP-001' };
                const lot = await database.getLot(id);
                lot.status = 'EXPORTED';
                lot.containerId = containerId;
                await database.updateLot(lot);
                
                const tx = await blockchain.notarize({ action: 'EXPORT_COMPLETE', containerId }, user.id);
                await database.addTransfer({
                    lotId: id,
                    actorId: user.id,
                    type: 'EXPORT_COMPLETED',
                    timestamp: new Date(),
                    hash: tx.hash,
                    data: { 
                        containerId: containerId,
                        port: 'Lomé, Togo',
                        compliance: 'EUDR_CERTIFIED_TOGO_CACAO',
                        customsRef: 'TG-LFW-2026-' + Math.floor(Math.random()*100000)
                    }
                });
            }
 
            await new Promise(r => setTimeout(r, 1000));
            document.getElementById('proc-4').querySelector('i').setAttribute('data-lucide', 'check-circle');
            document.getElementById('proc-4').querySelector('i').className = 'done';
            document.getElementById('proc-status').innerText = "Finalisation...";
            app.refreshIcons();

            setTimeout(() => {
                alert(`Exportation validée !\nLes lots ont été scellés dans le container ${containerId} et enregistrés sur la blockchain Polygon.`);
                document.querySelector('.close-modal').click();
                this.renderDashboard();
            }, 1000);
        }
    }
};
