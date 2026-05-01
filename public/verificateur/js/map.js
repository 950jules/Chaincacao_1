/**
 * ChainCacao — Carte Leaflet GPS
 * Affiche la parcelle de l'agriculteur + zone EUDR
 */

const mapModule = {
  currentMap: null,
  currentMarker: null,

  /**
   * Initialise la carte dans #map-container
   * @param {number} lat
   * @param {number} lng
   * @param {object} lot - données du lot pour le popup
   */
  init(lat, lng, lot = {}) {
    const container = document.getElementById("map-container");
    if (!container) return;

    // Nettoyer la carte précédente
    if (this.currentMap) {
      this.currentMap.remove();
      this.currentMap = null;
    }

    container.style.display = "block";

    // Initialiser Leaflet
    this.currentMap = L.map("map-container", {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([lat, lng], 14);

    // Tuiles CartoCDN (style clair, approprié pour officiel)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org/">OSM</a>',
        maxZoom: 19,
      }
    ).addTo(this.currentMap);

    // Icône personnalisée ChainCacao
    const cacaoIcon = L.divIcon({
      className: "cacao-marker",
      html: `
        <div class="marker-inner">
          <span>🍫</span>
        </div>
        <div class="marker-pulse"></div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -48],
    });

    // Marker principal
    this.currentMarker = L.marker([lat, lng], { icon: cacaoIcon })
      .addTo(this.currentMap)
      .bindPopup(this._buildPopup(lat, lng, lot))
      .openPopup();

    // Cercle de zone (rayon ~500m = zone parcelle)
    L.circle([lat, lng], {
      radius: 500,
      color: "#2D5A27",
      fillColor: "#2D5A27",
      fillOpacity: 0.08,
      weight: 2,
      dashArray: "6,4",
    }).addTo(this.currentMap);

    // Forcer redimensionnement après rendu DOM
    setTimeout(() => {
      if (this.currentMap) this.currentMap.invalidateSize();
    }, 300);
  },

  /**
   * Construit le popup HTML du marker
   */
  _buildPopup(lat, lng, lot) {
    return `
      <div style="font-family: 'Outfit', sans-serif; min-width: 180px;">
        <strong style="color: #3D1B0B; font-size: 0.9rem;">📍 ${lot.region || "Parcelle cacao"}</strong><br>
        <small style="color: #5D4037;">Lat: ${lat.toFixed(5)} • Lng: ${lng.toFixed(5)}</small>
        ${lot.farmerName ? `<br><small>👤 ${lot.farmerName}</small>` : ""}
        ${lot.species ? `<br><small>🌿 ${lot.species}</small>` : ""}
        <br><span style="color: #2D5A27; font-size: 0.75rem; font-weight: 700;">✅ Zone EUDR Certifiée</span>
      </div>
    `;
  },

  /**
   * Ouvre Google Maps pour la navigation
   */
  openExternalMap(lat, lng) {
    window.open(
      `https://www.google.com/maps?q=${lat},${lng}&z=15`,
      "_blank"
    );
  },
};
