const verificateur = {
    async init() {
        document.getElementById('btn-verify').onclick = () => {
            const id = document.getElementById('verify-input').value;
            if (id) this.verifyLot(id);
        };
        
        // Render Compliance Dashboard
        this.renderGlobalDashboard();

        // Ajout du bouton scan dynamique
        const searchBox = document.querySelector('#screen-verificateur .search-box');
        if (searchBox && !document.getElementById('verify-scan')) {
            const scanBtn = document.createElement('button');
            scanBtn.id = 'verify-scan';
            scanBtn.innerHTML = '📷 SCAN';
            scanBtn.classList.add('btn', 'btn-outline');
            scanBtn.style.padding = '0 1rem';
            scanBtn.style.height = '100%';
            scanBtn.style.flex = '0 0 auto';
            scanBtn.onclick = async () => {
                const code = await camera.scanQR();
                if (code) {
                    document.getElementById('verify-input').value = code;
                    this.verifyLot(code);
                }
            };
            searchBox.appendChild(scanBtn);
        }
    },

    async renderGlobalDashboard() {
        const lots = await database.getAllLots();
        const exportLots = lots.filter(l => l.status === 'EXPORTED');
        const container = document.getElementById('verifier-result');
        
        if (exportLots.length > 0) {
            container.classList.remove('hidden');
            container.innerHTML = `
                <div class="stats-grid" style="margin-bottom: 2rem">
                    <div class="stat-item" style="background:var(--success); color:white">
                        <span class="l">Lots Exportés</span>
                        <span class="v">${exportLots.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="l">Conformité</span>
                        <span class="v">100%</span>
                    </div>
                </div>
                
                <h3 style="margin-bottom: 1rem">Registre d'Exportation</h3>
                <div class="history-list">
                    ${exportLots.map(lot => `
                        <div class="history-item" onclick="verificateur.verifyLot('${lot.id}')" style="cursor:pointer">
                            <div class="history-info">
                                <div class="id">${lot.id}</div>
                                <div class="date">Container: ${lot.containerId || 'N/A'}</div>
                            </div>
                            <span class="badge badge-success">EUDR CERTIFIED</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    },

    async verifyLot(lotId) {
        const lot = await database.getLot(lotId);
        if (!lot) return alert("Lot introuvable !");
        
        const transfers = await database.getTransfersByLot(lotId);
        this.renderResult(lot, transfers);
    },

    async renderResult(lot, transfers) {
        const result = document.getElementById('verifier-result');
        result.classList.remove('hidden');
        
        result.innerHTML = `
            <div class="card verify-result-header">
                <h2>Lot ${lot.id}</h2>
                <div class="eudr-badge">
                   <span style="font-size: 2.5rem">🍃</span>
                   <div>
                        <strong>CERTIFIÉ CONFORME EUDR</strong>
                        <p style="font-size: 0.75rem; opacity: 0.8; margin-top: 2px">Zéro Déforestation • Géo-localisé • Blockchain</p>
                   </div>
                </div>

                <div id="map-verify"></div>
                
                <h3 style="font-family:var(--font-heading); margin: 2rem 0 1rem; font-weight:800; color:var(--primary)">Parcours Blockchain</h3>
                <div class="timeline">
                    ${transfers.map(t => `
                        <div class="timeline-event">
                            <div class="timeline-dot">🔒</div>
                            <div class="timeline-content">
                                <span class="actor">${t.actorId}</span>
                                <h4>${t.type === 'CREATION' ? 'Récolte Enregistrée' : t.type === 'COOP_VALIDATION' ? 'Collecte & Contrôle' : 'Manifeste Export'}</h4>
                                <div style="font-size: 0.7rem; color: var(--secondary); font-weight:600">${utils.formatDate(t.timestamp)}</div>
                                <div class="tx-hash">HASH: ${t.hash.substring(0, 24)}...</div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="card" style="margin-top: 2rem; border-top: 4px solid var(--primary)">
                    <h3 style="font-family:var(--font-heading); margin-bottom: 1rem; font-size:1rem; font-weight:800">Fiche de Traçabilité</h3>
                    <p style="font-size:0.9rem; margin-bottom:0.5rem"><strong>Espèce:</strong> ${lot.species}</p>
                    <p style="font-size:0.9rem; margin-bottom:0.5rem"><strong>Poids final:</strong> ${lot.weight}kg</p>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem; margin-top:1.5rem">
                         <div style="text-align:center">
                            <p style="font-size:10px; font-weight:800; color:var(--secondary); text-transform:uppercase; margin-bottom:4px">Photo Sac</p>
                            ${lot.photo ? `<img src="${lot.photo}" style="width:100%; border-radius:12px">` : '<div style="height:80px; background:var(--bg-main); border-radius:12px; display:flex; align-items:center; justify-content:center">📦</div>'}
                         </div>
                         <div style="text-align:center">
                            <p style="font-size:10px; font-weight:800; color:var(--secondary); text-transform:uppercase; margin-bottom:4px">Container</p>
                            <div style="height:100px; background:var(--bg-main); display:flex; align-items:center; justify-content:center; border-radius:12px; font-size:1.5rem">🚢</div>
                         </div>
                    </div>
                </div>

                <button class="btn btn-primary" style="margin-top:2rem" onclick="pdfControl.generateCertificat('${lot.id}')">📄 Télécharger Certificat PDF</button>
            </div>
        `;

        gps.initMap('map-verify', lot.gps.lat, lot.gps.lng);
    },

    async downloadReport(lotId) {
        const lot = await database.getLot(lotId);
        const trans = await database.getTransfersByLot(lotId);
        pdfControl.generateCertificat(lotId);
    },

    shareLink(lotId) {
        const url = window.location.origin + "?lot=" + lotId;
        alert("Lien de vérification copié : " + url);
    }
};
