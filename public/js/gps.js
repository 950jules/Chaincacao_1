/**
 * ChainCacao - Module de Géolocalisation et Cartographie
 */

const gps = {
    currentMap: null,

    /**
     * Obtient la position GPS actuelle
     */
    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                return reject(new Error("La géolocalisation n'est pas supportée"));
            }

            // Sur mobile, Chrome/Safari bloquent souvent si ce n'est pas du HTTPS
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                console.warn("La géolocalisation peut échouer sur un site non-sécurisé (HTTP)");
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            };

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    resolve({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy
                    });
                },
                (err) => {
                    let msg = "Erreur GPS : ";
                    switch(err.code) {
                        case err.PERMISSION_DENIED: msg += "Accès refusé. Activez le GPS."; break;
                        case err.POSITION_UNAVAILABLE: msg += "Position indisponible."; break;
                        case err.TIMEOUT: msg += "Délai dépassé. Réessayez."; break;
                        default: msg += err.message;
                    }
                    reject(new Error(msg));
                },
                options
            );
        });
    },

    /**
     * Initialise une carte Leaflet
     */
    initMap(elementId, lat, lng, zoom = 15) {
        const container = document.getElementById(elementId);
        if (!container) return;

        // Cleanup
        if (this.currentMap) {
            this.currentMap.remove();
        }

        container.style.display = 'block';
        this.currentMap = L.map(elementId).setView([lat, lng], zoom);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(this.currentMap);

        const marker = L.marker([lat, lng]).addTo(this.currentMap);
        
        // Forcer le redimensionnement après injection dans le DOM
        setTimeout(() => {
            this.currentMap.invalidateSize();
        }, 200);

        return this.currentMap;
    },

    /**
     * Mini-carte sans contrôles
     */
    displayMiniMap(elementId, lat, lng) {
        const container = document.getElementById(elementId);
        if (!container) return;

        container.style.display = 'block';
        const miniMap = L.map(elementId, {
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
            touchZoom: false
        }).setView([lat, lng], 14);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(miniMap);
        L.marker([lat, lng]).addTo(miniMap);

        setTimeout(() => miniMap.invalidateSize(), 200);
        return miniMap;
    },

    /**
     * Vérification fictive de zone EUDR
     */
    async verifyParcelZone(lat, lng) {
        // Simulation: On accepte presque tout ce qui est au Togo/Ghana pour la démo
        const isTogo = lat > 6.0 && lat < 11.0 && lng > 0.0 && lng < 1.0;
        if (isTogo) {
            return { valid: true, zone: "Zone Certifiée Togo", message: "Conformité EUDR Confirmée" };
        }
        return { valid: true, zone: "HORS ZONE TYPE", message: "Zone non répertoriée mais conforme" };
    }
};

window.ChainCacaoGPS = gps;
