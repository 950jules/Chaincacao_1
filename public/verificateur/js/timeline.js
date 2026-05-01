/**
 * ChainCacao — Rendu Timeline Blockchain
 * Affiche les 3 étapes : CREATION → COOP_VALIDATION → EXPORT
 */

const timeline = {
  /**
   * Config des types d'événements
   */
  EVENT_CONFIG: {
    CREATION: {
      label: "Récolte Enregistrée",
      icon: "🌱",
      iconClass: "step-harvest",
      description: "Lot créé par l'agriculteur",
    },
    COOP_VALIDATION: {
      label: "Collecte & Contrôle Qualité",
      icon: "⚖️",
      iconClass: "step-coop",
      description: "Validé par la coopérative",
    },
    EXPORT: {
      label: "Manifeste d'Export",
      icon: "🚢",
      iconClass: "step-export",
      description: "Certifié par l'exportateur",
    },
  },

  /**
   * Rend la timeline dans le conteneur #timeline-container
   * @param {Array} transfers - liste des transfers Firestore
   * @param {object} lot - données du lot
   */
  render(transfers, lot) {
    const container = document.getElementById("timeline-container");
    if (!container) return;

    if (!transfers || transfers.length === 0) {
      container.innerHTML = `<p class="timeline-empty">Aucune transaction blockchain enregistrée.</p>`;
      return;
    }

    // Ordres forcés pour affichage cohérent
    const ORDER = ["CREATION", "COOP_VALIDATION", "EXPORT"];
    const transferMap = {};
    transfers.forEach((t) => {
      transferMap[t.type] = t;
    });

    const steps = ORDER.map((type) => ({
      type,
      transfer: transferMap[type] || null,
      config: this.EVENT_CONFIG[type] || {
        label: type,
        icon: "📋",
        iconClass: "step-default",
        description: "",
      },
    }));

    container.innerHTML = steps
      .map((step, index) => this._renderStep(step, index, steps.length))
      .join("");
  },

  /**
   * Rend une étape individuelle
   */
  _renderStep(step, index, total) {
    const { type, transfer, config } = step;
    const isDone = !!transfer;
    const isLast = index === total - 1;

    const statusClass = isDone ? "step-done" : "step-pending";
    const date = isDone ? this._formatDate(transfer.timestamp) : "En attente...";
    const actorId = isDone ? (transfer.actorId || "—") : "—";
    const hash = isDone ? transfer.hash : null;

    // Données supplémentaires depuis transfer.data
    const extraData = isDone && transfer.data ? this._renderExtraData(transfer.data, type) : "";

    return `
      <div class="timeline-step ${statusClass}">
        <div class="step-connector">
          <div class="step-icon ${config.iconClass}">
            <span>${isDone ? config.icon : "○"}</span>
          </div>
          ${!isLast ? '<div class="step-line"></div>' : ""}
        </div>
        <div class="step-body">
          <div class="step-header">
            <h4 class="step-label">${config.label}</h4>
            <span class="step-badge ${statusClass}">${isDone ? "✓ Validé" : "En attente"}</span>
          </div>
          <p class="step-desc">${config.description}</p>
          ${isDone ? `
            <div class="step-meta">
              <div class="meta-row">
                <span class="meta-key">Acteur</span>
                <span class="meta-val">${actorId}</span>
              </div>
              <div class="meta-row">
                <span class="meta-key">Date</span>
                <span class="meta-val">${date}</span>
              </div>
              ${extraData}
            </div>
            ${hash ? `
              <div class="tx-hash-box">
                <span class="tx-label">TX HASH</span>
                <span class="tx-value" title="${hash}">${hash.substring(0, 32)}…</span>
                <button class="btn-copy-hash" onclick="timeline.copyHash('${hash}')" title="Copier le hash">⧉</button>
              </div>
            ` : ""}
          ` : ""}
        </div>
      </div>
    `;
  },

  /**
   * Rend les données spécifiques selon le type
   */
  _renderExtraData(data, type) {
    const rows = [];

    if (type === "COOP_VALIDATION") {
      if (data.officialWeight) rows.push(["Poids officiel", `${data.officialWeight} kg`]);
      if (data.qualityGrade) rows.push(["Grade qualité", data.qualityGrade]);
      if (data.coopName) rows.push(["Coopérative", data.coopName]);
    }

    if (type === "EXPORT") {
      if (data.exportManifestId) rows.push(["Manifeste", data.exportManifestId]);
      if (data.containerId) rows.push(["Container", data.containerId]);
      if (data.destination) rows.push(["Destination", data.destination]);
      if (data.portName) rows.push(["Port", data.portName]);
    }

    if (type === "CREATION") {
      if (data.weight) rows.push(["Poids déclaré", `${data.weight} kg`]);
      if (data.species) rows.push(["Espèce", data.species]);
      if (data.region) rows.push(["Région", data.region]);
    }

    return rows
      .map(
        ([k, v]) => `
      <div class="meta-row">
        <span class="meta-key">${k}</span>
        <span class="meta-val">${v}</span>
      </div>
    `
      )
      .join("");
  },

  /**
   * Copie un hash dans le presse-papier
   */
  async copyHash(hash) {
    try {
      await navigator.clipboard.writeText(hash);
      verifierApp.showToast("Hash copié ✓");
    } catch (e) {
      // Fallback
      const el = document.createElement("textarea");
      el.value = hash;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      verifierApp.showToast("Hash copié ✓");
    }
  },

  /**
   * Formate une date en français
   */
  _formatDate(date) {
    if (!date) return "—";
    const d = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  },
};
