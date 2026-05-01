/**
 * ChainCacao — Scanner QR Code
 * Utilise html5-qrcode pour lire via caméra
 */

const qrcodeScanner = {
  instance: null,
  isScanning: false,

  /**
   * Démarre le scanner dans le div #qr-reader
   * @param {function} onSuccess - callback(decodedText)
   * @param {function} onError  - callback(errorMsg)
   */
  async start(onSuccess, onError) {
    if (this.isScanning) await this.stop();

    const container = document.getElementById("qr-reader");
    if (!container) return;

    container.innerHTML = "";
    container.style.display = "block";

    try {
      this.instance = new Html5Qrcode("qr-reader");

      const config = {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      await this.instance.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          // Extraire l'ID lot du QR (peut contenir une URL complète)
          const lotId = this._extractLotId(decodedText);
          this.stop();
          onSuccess(lotId || decodedText);
        },
        (errorMsg) => {
          // Erreurs de scan normales (frame sans QR), ignorer silencieusement
        }
      );

      this.isScanning = true;
    } catch (e) {
      this.isScanning = false;
      const msg = e.message || String(e);
      if (msg.includes("Permission") || msg.includes("permission")) {
        onError("Accès caméra refusé. Autorisez la caméra dans votre navigateur.");
      } else if (msg.includes("NotFound") || msg.includes("device")) {
        onError("Aucune caméra détectée sur cet appareil.");
      } else {
        onError("Impossible de démarrer le scanner : " + msg);
      }
    }
  },

  /**
   * Arrête le scanner proprement
   */
  async stop() {
    if (this.instance && this.isScanning) {
      try {
        await this.instance.stop();
        this.instance.clear();
      } catch (e) {
        // Ignorer les erreurs d'arrêt
      }
    }
    this.isScanning = false;
    this.instance = null;

    const container = document.getElementById("qr-reader");
    if (container) {
      container.innerHTML = "";
      container.style.display = "none";
    }
  },

  /**
   * Extrait l'ID lot depuis une URL ou texte brut
   * Supporte : "CC-2026-XXXXXX" ou "https://.../CC-2026-XXXXXX"
   */
  _extractLotId(text) {
  // Accepte tous les formats : CC-2026-XXX, (Region)-CC_XXX, etc.
  return text.trim() || null;
},

  /**
   * Génère un QR code dans un élément DOM
   * @param {string} elementId
   * @param {string} lotId
   */
  generateQR(elementId, lotId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = "";

    const verifyUrl = `${VERIFY_BASE_URL}?lot=${lotId}`;

    try {
      new QRCode(el, {
        text: verifyUrl,
        width: 160,
        height: 160,
        colorDark: "#3D1B0B",
        colorLight: "#FFFFFF",
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch (e) {
      el.textContent = verifyUrl;
    }
  },
};
