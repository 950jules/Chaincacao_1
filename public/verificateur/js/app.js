/**
 * ChainCacao — Application Vérificateur Public
 * Orchestration principale : recherche, affichage, modes
 */

const verifierApp = {
  currentLot: null,
  currentTransfers: [],
  activeMode: "search", // 'search' | 'scan'
  toastTimer: null,

  // ─────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────
  async init() {
    try {
      // Initialiser Firebase
      firebaseService.init();

      // Event listeners
      this._setupSearch();
      this._setupModes();
      this._setupShareButton();

      // Vérifier si URL contient ?lot=CC-2026-XXXX
      const urlParams = new URLSearchParams(window.location.search);
      const lotFromUrl = urlParams.get("lot");
      if (lotFromUrl) {
        document.getElementById("search-input").value = lotFromUrl;
        await this.searchLot(lotFromUrl);
      } else {
        // Charger le registre public des lots exportés
        await this._loadPublicRegistry();
      }
    } catch (e) {
      console.error("[ChainCacao] Init error:", e);
      this.showError("Erreur de connexion. Vérifiez votre connexion internet.");
    }
  },

  // ─────────────────────────────────────────
  // SETUP EVENTS
  // ─────────────────────────────────────────
  _setupSearch() {
    const btn = document.getElementById("btn-search");
    const input = document.getElementById("search-input");

    btn.addEventListener("click", () => {
      const val = input.value.trim().toUpperCase();
      if (val) this.searchLot(val);
      else this._shakeInput(input);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const val = input.value.trim().toUpperCase();
        if (val) this.searchLot(val);
      }
    });

    // Auto-format en majuscules
    input.addEventListener("input", () => {
      input.value = input.value.toUpperCase();
    });
  },

  _setupModes() {
    const tabSearch = document.getElementById("tab-search");
    const tabScan = document.getElementById("tab-scan");

    tabSearch.addEventListener("click", () => this._setMode("search"));
    tabScan.addEventListener("click", () => this._setMode("scan"));
  },

  _setupShareButton() {
    const btn = document.getElementById("btn-share");
    if (btn) {
      btn.addEventListener("click", () => this._shareLot());
    }
  },

  _setMode(mode) {
    this.activeMode = mode;

    const tabSearch = document.getElementById("tab-search");
    const tabScan = document.getElementById("tab-scan");
    const searchPanel = document.getElementById("search-panel");
    const scanPanel = document.getElementById("scan-panel");

    if (mode === "search") {
      tabSearch.classList.add("active");
      tabScan.classList.remove("active");
      searchPanel.style.display = "flex";
      scanPanel.style.display = "none";
      // Arrêter le scanner si actif
      qrcodeScanner.stop();
    } else {
      tabScan.classList.add("active");
      tabSearch.classList.remove("active");
      searchPanel.style.display = "none";
      scanPanel.style.display = "block";
      // Démarrer le scanner
      this._startScanner();
    }
  },

  // ─────────────────────────────────────────
  // SCANNER QR
  // ─────────────────────────────────────────
  _startScanner() {
    const statusEl = document.getElementById("scan-status");
    statusEl.textContent = "Pointez la caméra vers le QR code du lot...";
    statusEl.className = "scan-status scanning";

    qrcodeScanner.start(
      (lotId) => {
        // Succès
        statusEl.textContent = `✓ QR Code lu : ${lotId}`;
        statusEl.className = "scan-status success";
        document.getElementById("search-input").value = lotId;
        this._setMode("search");
        this.searchLot(lotId);
      },
      (errorMsg) => {
        statusEl.textContent = errorMsg;
        statusEl.className = "scan-status error";
      }
    );
  },

  // ─────────────────────────────────────────
  // RECHERCHE LOT
  // ─────────────────────────────────────────
  async searchLot(lotId) {
    // Valider format basique
    if (!lotId || lotId.length < 4) {
      this.showError("Identifiant trop court. Format attendu : CC-2026-XXXXXX");
      return;
    }

    this._showLoading(true);
    this._hideResults();

    try {
      const [lot, transfers] = await Promise.all([
        firebaseService.getLot(lotId),
        firebaseService.getTransfers(lotId),
      ]);

      this._showLoading(false);

      if (!lot) {
        this.showError(`Lot "${lotId}" introuvable dans la base de données ChainCacao.`);
        return;
      }

      this.currentLot = lot;
      this.currentTransfers = transfers;

      // Mettre à jour l'URL sans recharger
      const newUrl = `${window.location.pathname}?lot=${lot.id}`;
      window.history.pushState({ lotId: lot.id }, "", newUrl);

      this._renderResults(lot, transfers);
    } catch (e) {
      this._showLoading(false);
      console.error("[ChainCacao] searchLot error:", e);
      if (e.message && e.message.includes("permission")) {
        this.showError("Accès refusé. Les données de ce lot sont protégées.");
      } else {
        this.showError("Erreur de connexion à Firebase. Réessayez dans quelques instants.");
      }
    }
  },

  // ─────────────────────────────────────────
  // RENDU DES RÉSULTATS
  // ─────────────────────────────────────────
  _renderResults(lot, transfers) {
    const resultsEl = document.getElementById("results-container");
    const registryEl = document.getElementById("registry-section");

    // Cacher le registre, afficher les résultats
    if (registryEl) registryEl.style.display = "none";
    resultsEl.style.display = "block";

    // Badge EUDR
    this._renderBadge(lot);

    // Infos principales du lot
    this._renderLotInfo(lot);

    // Timeline blockchain
    timeline.render(transfers, lot);

    // Carte GPS
    if (lot.gps && lot.gps.lat && lot.gps.lng) {
      document.getElementById("map-section").style.display = "block";
      setTimeout(() => mapModule.init(lot.gps.lat, lot.gps.lng, lot), 100);
    } else {
      document.getElementById("map-section").style.display = "none";
    }

    // QR code de partage
    qrcodeScanner.generateQR("share-qr", lot.id);

    // Photo du lot si disponible
    this._renderPhoto(lot);

    // Scroll vers résultats
    resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
  },

  _renderBadge(lot) {
    const badgeEl = document.getElementById("eudr-badge");
    const isExported = lot.status === "EXPORTED";
    const isCollected = lot.status === "COLLECTED";

    if (isExported) {
      badgeEl.className = "eudr-badge badge-success";
      badgeEl.innerHTML = `
        <div class="badge-icon">✅</div>
        <div class="badge-text">
          <strong>CERTIFIÉ CONFORME EUDR</strong>
          <p>Zéro Déforestation • Géo-localisé • Traçabilité Blockchain</p>
        </div>
      `;
    } else if (isCollected) {
      badgeEl.className = "eudr-badge badge-warning";
      badgeEl.innerHTML = `
        <div class="badge-icon">⏳</div>
        <div class="badge-text">
          <strong>EN COURS D'EXPORTATION</strong>
          <p>Lot collecté — Validation export en attente</p>
        </div>
      `;
    } else {
      badgeEl.className = "eudr-badge badge-pending";
      badgeEl.innerHTML = `
        <div class="badge-icon">📋</div>
        <div class="badge-text">
          <strong>EN COURS DE TRAÇABILITÉ</strong>
          <p>Lot créé — En attente de collecte coopérative</p>
        </div>
      `;
    }
  },

  _renderLotInfo(lot) {
    const el = document.getElementById("lot-info");
    const date = lot.timestamp
      ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(
          lot.timestamp instanceof Date ? lot.timestamp : new Date(lot.timestamp)
        )
      : "—";

    el.innerHTML = `
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Identifiant Lot</span>
          <span class="info-value mono">${lot.id}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Producteur</span>
          <span class="info-value">${lot.farmerName || lot.farmerId || "—"}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Espèce Cacao</span>
          <span class="info-value">${lot.species || "—"}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Région</span>
          <span class="info-value">${lot.region || "—"}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Poids Déclaré</span>
          <span class="info-value">${lot.weight ? lot.weight + " kg" : "—"}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Poids Officiel</span>
          <span class="info-value">${lot.officialWeight ? lot.officialWeight + " kg" : "—"}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Grade Qualité</span>
          <span class="info-value">${lot.qualityGrade || "—"}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Date Enregistrement</span>
          <span class="info-value">${date}</span>
        </div>
        ${lot.gps ? `
        <div class="info-item full-width">
          <span class="info-label">Coordonnées GPS</span>
          <span class="info-value mono">
            ${lot.gps.lat.toFixed(6)}, ${lot.gps.lng.toFixed(6)}
            <button class="btn-map-link" onclick="mapModule.openExternalMap(${lot.gps.lat}, ${lot.gps.lng})" title="Voir sur Google Maps">🗺️</button>
          </span>
        </div>
        ` : ""}
      </div>
    `;
  },

  _renderPhoto(lot) {
    const photoSection = document.getElementById("photo-section");
    if (lot.photo) {
      photoSection.style.display = "block";
      document.getElementById("lot-photo").src = lot.photo;
    } else {
      photoSection.style.display = "none";
    }
  },

  // ─────────────────────────────────────────
  // REGISTRE PUBLIC
  // ─────────────────────────────────────────
  async _loadPublicRegistry() {
    try {
      const lots = await firebaseService.getExportedLots();
      const el = document.getElementById("registry-list");
      const section = document.getElementById("registry-section");

      if (!lots || lots.length === 0) {
        section.style.display = "none";
        return;
      }

      section.style.display = "block";
      document.getElementById("registry-count").textContent = lots.length;

      el.innerHTML = lots
        .map(
          (lot) => `
        <div class="registry-card" onclick="verifierApp._clickRegistry('${lot.id}')">
          <div class="registry-id mono">${lot.id}</div>
          <div class="registry-meta">
            <span>👤 ${lot.farmerName || lot.farmerId || "—"}</span>
            <span>⚖️ ${lot.weight || "—"} kg</span>
            <span>📍 ${lot.region || "—"}</span>
          </div>
          <span class="registry-badge">✅ EUDR</span>
        </div>
      `
        )
        .join("");
    } catch (e) {
      console.warn("[ChainCacao] Registry load:", e.message);
      document.getElementById("registry-section").style.display = "none";
    }
  },

  _clickRegistry(lotId) {
    document.getElementById("search-input").value = lotId;
    document.querySelector(".search-section").scrollIntoView({ behavior: "smooth" });
    this.searchLot(lotId);
  },

  // ─────────────────────────────────────────
  // PDF
  // ─────────────────────────────────────────
  async downloadPDF() {
    if (!this.currentLot) return;
    const btn = document.getElementById("btn-pdf");
    btn.disabled = true;
    btn.textContent = "⏳ Génération en cours...";

    try {
      await pdfGenerator.generate(this.currentLot, this.currentTransfers);
      this.showToast("Certificat PDF téléchargé ✓");
    } catch (e) {
      console.error("[ChainCacao] PDF error:", e);
      this.showToast("Erreur lors de la génération PDF");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span>📄</span> Télécharger Certificat EUDR (PDF)`;
    }
  },

  // ─────────────────────────────────────────
  // PARTAGE
  // ─────────────────────────────────────────
  async _shareLot() {
    if (!this.currentLot) return;
    const url = `${VERIFY_BASE_URL}?lot=${this.currentLot.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `ChainCacao — Lot ${this.currentLot.id}`,
          text: `Vérifiez la traçabilité du lot de cacao ${this.currentLot.id}`,
          url,
        });
      } catch (e) {
        // Annulation par l'utilisateur, ignorer
      }
    } else {
      // Fallback : copier dans le presse-papier
      try {
        await navigator.clipboard.writeText(url);
        this.showToast("Lien copié dans le presse-papier ✓");
      } catch (e) {
        this.showToast("Lien : " + url);
      }
    }
  },

  // ─────────────────────────────────────────
  // UI HELPERS
  // ─────────────────────────────────────────
  _showLoading(show) {
    const spinner = document.getElementById("loading-spinner");
    const btn = document.getElementById("btn-search");
    spinner.style.display = show ? "flex" : "none";
    btn.disabled = show;
    if (show) {
      btn.innerHTML = `<span class="spinner-sm"></span>`;
    } else {
      btn.innerHTML = `<span>🔍</span> Vérifier`;
    }
  },

  _hideResults() {
    document.getElementById("results-container").style.display = "none";
    document.getElementById("error-box").style.display = "none";
  },

  showError(msg) {
    const el = document.getElementById("error-box");
    el.style.display = "flex";
    el.innerHTML = `<span>⚠️</span> <span>${msg}</span>`;
    el.scrollIntoView({ behavior: "smooth" });
  },

  showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  },

  _shakeInput(el) {
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 500);
  },
};

// ─────────────────────────────────────────
// DÉMARRAGE
// ─────────────────────────────────────────
// Init appelé depuis le script ESM dans index.html
// document.addEventListener("DOMContentLoaded", () => {
  verifierApp.init();
});
