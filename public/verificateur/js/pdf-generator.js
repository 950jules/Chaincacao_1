/**
 * ChainCacao — Générateur de Certificat PDF
 * Utilise jsPDF pour produire un document officiel EUDR
 */

const pdfGenerator = {
  /**
   * Génère et télécharge le certificat PDF d'un lot
   * @param {object} lot - données du lot Firestore
   * @param {Array} transfers - liste des transfers
   */
  async generate(lot, transfers) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210;
    const MARGIN = 18;

    // ─────────────────────────────────────────
    // HEADER BRUN ESPRESSO
    // ─────────────────────────────────────────
    doc.setFillColor(61, 27, 11); // #3D1B0B
    doc.rect(0, 0, W, 48, "F");

    // Logo texte
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("🍫 CHAINCACAO", MARGIN, 20);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(210, 180, 140);
    doc.text("CERTIFICAT OFFICIEL DE TRAÇABILITÉ BLOCKCHAIN", MARGIN, 28);
    doc.text("Règlement UE 2023/1115 — Conformité EUDR", MARGIN, 34);

    // Numéro de certificat (droit)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`ID LOT : ${lot.id}`, W - MARGIN, 28, { align: "right" });
    doc.text(`Émis le : ${this._formatDate(new Date())}`, W - MARGIN, 34, { align: "right" });

    // ─────────────────────────────────────────
    // BADGE EUDR VERT
    // ─────────────────────────────────────────
    doc.setFillColor(45, 90, 39); // #2D5A27
    doc.roundedRect(MARGIN, 54, W - MARGIN * 2, 16, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("✅  CERTIFIÉ CONFORME EUDR — ZÉRO DÉFORESTATION", W / 2, 64, { align: "center" });

    // ─────────────────────────────────────────
    // SECTION 1 : INFORMATIONS DU LOT
    // ─────────────────────────────────────────
    let y = 80;
    this._sectionTitle(doc, "INFORMATIONS DU LOT", y, MARGIN);
    y += 8;

    const lotFields = [
      ["Identifiant lot", lot.id],
      ["Producteur", lot.farmerName || lot.farmerId || "—"],
      ["Espèce cacao", lot.species || "—"],
      ["Région", lot.region || "—"],
      ["Poids déclaré", lot.weight ? `${lot.weight} kg` : "—"],
      ["Poids officiel", lot.officialWeight ? `${lot.officialWeight} kg` : "—"],
      ["Grade qualité", lot.qualityGrade || "—"],
      ["Statut", lot.status || "—"],
      ["Coordonnées GPS", lot.gps ? `${lot.gps.lat.toFixed(5)}, ${lot.gps.lng.toFixed(5)}` : "—"],
    ];

    y = this._renderTable(doc, lotFields, y, MARGIN, W);

    // ─────────────────────────────────────────
    // SECTION 2 : HISTORIQUE BLOCKCHAIN
    // ─────────────────────────────────────────
    y += 8;
    this._sectionTitle(doc, "HISTORIQUE BLOCKCHAIN", y, MARGIN);
    y += 8;

    const EVENT_LABELS = {
      CREATION: "Récolte Enregistrée",
      COOP_VALIDATION: "Collecte & Contrôle Qualité",
      EXPORT: "Manifeste d'Export",
    };

    transfers.forEach((tx, i) => {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // Box par transfer
      doc.setFillColor(253, 248, 243); // bg-main
      doc.roundedRect(MARGIN, y, W - MARGIN * 2, 28, 2, 2, "F");
      doc.setDrawColor(61, 27, 11);
      doc.setLineWidth(0.3);
      doc.roundedRect(MARGIN, y, W - MARGIN * 2, 28, 2, 2, "S");

      // Numéro
      doc.setFillColor(61, 27, 11);
      doc.circle(MARGIN + 5, y + 7, 4, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(`${i + 1}`, MARGIN + 5, y + 9, { align: "center" });

      // Label
      doc.setTextColor(61, 27, 11);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(EVENT_LABELS[tx.type] || tx.type, MARGIN + 13, y + 8);

      // Acteur + Date
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(93, 64, 55);
      doc.text(`Acteur : ${tx.actorId || "—"}`, MARGIN + 13, y + 14);
      doc.text(`Date : ${this._formatDate(tx.timestamp)}`, MARGIN + 80, y + 14);

      // Hash
      doc.setFont("courier", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(150, 100, 70);
      const hashDisplay = tx.hash ? tx.hash.substring(0, 52) + "…" : "—";
      doc.text(`TX: ${hashDisplay}`, MARGIN + 13, y + 21);

      y += 33;
    });

    // ─────────────────────────────────────────
    // SECTION 3 : CONFORMITÉ EUDR
    // ─────────────────────────────────────────
    if (y > 220) { doc.addPage(); y = 20; }
    y += 4;
    this._sectionTitle(doc, "CONFORMITÉ RÈGLEMENTAIRE", y, MARGIN);
    y += 8;

    const eudrFields = [
      ["Règlement applicable", "UE 2023/1115 (EUDR)"],
      ["Critère déforestation", "Conforme — Parcelle géo-localisée"],
      ["Date de référence", "Postérieur au 31/12/2020"],
      ["Vérification blockchain", "Hash SHA-256 — Immuable"],
      ["Plateforme", "ChainCacao — Firebase + Polygon"],
    ];
    y = this._renderTable(doc, eudrFields, y, MARGIN, W);

    // ─────────────────────────────────────────
    // FOOTER
    // ─────────────────────────────────────────
    const footerY = 285;
    doc.setFillColor(245, 230, 200);
    doc.rect(0, footerY - 8, W, 20, "F");

    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(93, 64, 55);
    doc.text(
      "Ce document est généré automatiquement par ChainCacao. L'authenticité des données peut être vérifiée sur la blockchain publique.",
      W / 2,
      footerY,
      { align: "center" }
    );
    doc.text(
      `Vérification : ${VERIFY_BASE_URL}?lot=${lot.id}`,
      W / 2,
      footerY + 5,
      { align: "center" }
    );

    // Sauvegarder
    doc.save(`ChainCacao_Certificat_${lot.id}.pdf`);
  },

  /**
   * Titre de section avec ligne décorative
   */
  _sectionTitle(doc, text, y, margin) {
    doc.setFillColor(61, 27, 11);
    doc.rect(margin, y, 3, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(61, 27, 11);
    doc.text(text, margin + 6, y + 5);

    doc.setDrawColor(200, 180, 160);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 8, 210 - margin, y + 8);
  },

  /**
   * Tableau clé/valeur sur 2 colonnes
   */
  _renderTable(doc, fields, startY, margin, pageW) {
    let y = startY;
    fields.forEach(([key, val], i) => {
      const bg = i % 2 === 0 ? [255, 255, 255] : [253, 248, 243];
      doc.setFillColor(...bg);
      doc.rect(margin, y, pageW - margin * 2, 7, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(93, 64, 55);
      doc.text(key, margin + 3, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(61, 27, 11);
      doc.text(String(val), margin + 65, y + 5);

      y += 7;
    });
    return y;
  },

  _formatDate(date) {
    if (!date) return "—";
    const d = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(d);
  },
};
