const verification = {
    async init() {
        try {
            await database.init();
            
            // Sign in anonymously for rules
            if (window.firebase) {
                await firebase.auth().signInAnonymously();
            }

            this.setupListeners();
            if (window.lucide) window.lucide.createIcons();
            
            // Check for ID in URL
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            if (id) {
                document.getElementById('lot-id-input').value = id;
                this.performSearch(id);
            }
        } catch (e) {
            console.error("Init error:", e);
        }
    },

    setupListeners() {
        const btn = document.getElementById('search-btn');
        const input = document.getElementById('lot-id-input');

        btn.onclick = () => {
            console.log("Clic sur bouton vérifier");
            const id = input.value.trim();
            this.performSearch(id);
        };

        input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                const id = input.value.trim();
                this.performSearch(id);
            }
        };
        
        console.log("Listeners de recherche configurés");
    },

    async performSearch(lotId) {
        if (!lotId) return;

        const msgEl = document.getElementById('status-msg');
        const container = document.getElementById('result-container');
        
        msgEl.innerHTML = "Recherche en cours...";
        msgEl.style.color = "#8D5B3E";
        container.classList.add('hidden');

        try {
            const lot = await database.getLot(lotId);
            if (!lot) {
                msgEl.innerHTML = "Lot non trouvé. Vérifiez l'identifiant.";
                msgEl.style.color = "#D32F2F";
                return;
            }

            const transfers = await database.getTransfersByLot(lotId);
            this.renderTrace(lot, transfers);
            
            msgEl.innerHTML = "Historique chargé avec succès.";
            msgEl.style.color = "#388E3C";
            container.classList.remove('hidden');
            document.getElementById('lot-id-display').innerText = lotId;

        } catch (e) {
            console.error(e);
            msgEl.innerHTML = "Erreur: " + (e.message.includes('permission') ? "ID non autorisé ou accès refusé." : "ID inexistant ou erreur réseau.");
            msgEl.style.color = "#D32F2F";
        }
    },

    renderTrace(lot, transfers) {
        const content = document.getElementById('trace-content');
        
        // On réutilise la logique visuelle du vérificateur principal
        let html = `
            <div class="trace-timeline">
                <!-- Origine Agriculteur -->
                <div class="timeline-item">
                    <div class="timeline-icon"><i data-lucide="tractor"></i></div>
                    <div class="timeline-content">
                        <div class="time">${new Date(lot.createdAt).toLocaleString()}</div>
                        <h3>Étape 1: Création du Lot</h3>
                        <div class="actor">Producteur: ${lot.farmerId}</div>
                        <div class="details">
                            <p><strong>Poids déclaré:</strong> ${lot.weight} kg</p>
                            <p><strong>Région:</strong> ${lot.region}</p>
                            <p><strong>Espèce:</strong> ${lot.species}</p>
                        </div>
                        <div class="location-proof">
                            <i data-lucide="map-pin"></i> GPS Certifié: ${lot.gps.lat}, ${lot.gps.lng}
                        </div>
                    </div>
                </div>
        `;

        // Transferts
        transfers.forEach(t => {
            let icon = "arrow-right-left";
            let stepTitle = "Transfert de Responsabilité";
            
            if (t.toRole === 'COOP') {
                icon = "factory";
                stepTitle = "Validation Coopérative";
            } else if (t.toRole === 'EXP') {
                icon = "truck";
                stepTitle = "Réception Exportateur";
            }

            html += `
                <div class="timeline-item">
                    <div class="timeline-icon"><i data-lucide="${icon}"></i></div>
                    <div class="timeline-content">
                        <div class="time">${new Date(t.timestamp).toLocaleString()}</div>
                        <h3>${stepTitle}</h3>
                        <div class="actor">De: ${t.fromActor} vers ${t.toActor}</div>
                        <div class="details">
                            ${t.officialWeight ? `<p><strong>Poids Officiel:</strong> ${t.officialWeight} kg</p>` : ''}
                            <p><strong>Statut:</strong> <span class="badge ${t.status}">${t.status}</span></p>
                            <div class="hash-display">Blockchain TX: ${t.txHash.substring(0,20)}...</div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        content.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
    }
};

window.onload = () => verification.init();
