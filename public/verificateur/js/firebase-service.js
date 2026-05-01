/**
 * ChainCacao — Service Firebase Firestore
 * SDK Modulaire v9 (ESM) avec support database ID custom
 * Collections : lots/{lotId} + lots/{lotId}/transfers/{transferId}
 */

const firebaseService = {
  app: null,
  db: null,

  /**
   * Initialise Firebase avec la config réelle + database ID custom
   * Utilise le SDK modulaire chargé via window.firebaseModular
   */
  async init() {
    const { initializeApp } = window.firebaseModular.app;
    const { getFirestore, collection, doc, getDoc, getDocs, query, orderBy, where, limit } = window.firebaseModular.firestore;

    try {
      this.app = initializeApp(firebaseConfig);
    } catch (e) {
      if (e.code === "app/duplicate-app") {
        const { getApp } = window.firebaseModular.app;
        this.app = getApp();
      } else {
        throw e;
      }
    }

    // Connexion au database ID custom (pas "(default)")
    this.db = getFirestore(this.app, firebaseConfig.firestoreDatabaseId);
    console.log("[ChainCacao] Firestore connecté — DB:", firebaseConfig.firestoreDatabaseId, "✓");

    // Exposer les helpers Firestore pour usage interne
    this._fs = { collection, doc, getDoc, getDocs, query, orderBy, where, limit };
  },

  /**
   * Récupère un lot par son ID
   */
  async getLot(lotId) {
    const { doc, getDoc } = this._fs;
    const docRef = doc(this.db, "lots", lotId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    if (data.timestamp?.toDate) data.timestamp = data.timestamp.toDate();
    if (data.harvestDate?.toDate) data.harvestDate = data.harvestDate.toDate();
    return { id: docSnap.id, ...data };
  },

  /**
   * Récupère les transfers d'un lot, triés par timestamp ASC
   */
  async getTransfers(lotId) {
    const { collection, getDocs, query, orderBy } = this._fs;
    try {
      const q = query(
        collection(this.db, "lots", lotId, "transfers"),
        orderBy("timestamp", "asc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
        const data = d.data();
        if (data.timestamp?.toDate) data.timestamp = data.timestamp.toDate();
        return { id: d.id, ...data };
      });
    } catch (e) {
      // Fallback sans orderBy si index manquant
      const { collection, getDocs } = this._fs;
      const snapshot = await getDocs(collection(this.db, "lots", lotId, "transfers"));
      return snapshot.docs
        .map(d => {
          const data = d.data();
          if (data.timestamp?.toDate) data.timestamp = data.timestamp.toDate();
          return { id: d.id, ...data };
        })
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    }
  },

  /**
   * Récupère les lots exportés pour le registre public
   */
  async getExportedLots() {
    const { collection, getDocs, query, where, orderBy, limit } = this._fs;
    try {
      const q = query(
        collection(this.db, "lots"),
        where("status", "==", "EXPORTED"),
        orderBy("timestamp", "desc"),
        limit(20)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
        const data = d.data();
        if (data.timestamp?.toDate) data.timestamp = data.timestamp.toDate();
        return { id: d.id, ...data };
      });
    } catch (e) {
      console.warn("[ChainCacao] getExportedLots:", e.message);
      return [];
    }
  }
};
