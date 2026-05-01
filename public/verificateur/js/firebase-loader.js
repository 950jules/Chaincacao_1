/**
 * ChainCacao — Chargeur SDK Firebase Modulaire (ESM)
 * Charge dynamiquement le SDK v9 modulaire pour supporter le database ID custom
 * Exécuté AVANT tous les autres scripts ChainCacao
 */

(async function loadFirebaseModular() {
  try {
    const [appModule, firestoreModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js")
    ]);

    // Exposer globalement pour firebase-service.js
    window.firebaseModular = {
      app: appModule,
      firestore: firestoreModule
    };

    console.log("[ChainCacao] SDK Firebase modulaire chargé ✓");

    // Signal que Firebase est prêt
    window.dispatchEvent(new Event("firebase-modular-ready"));
  } catch (e) {
    console.error("[ChainCacao] Erreur chargement Firebase SDK:", e);
    window.dispatchEvent(new CustomEvent("firebase-modular-error", { detail: e }));
  }
})();
