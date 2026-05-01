// Firebase Configuration (from firebase-applet-config.json)
const firebaseConfig = {
    projectId: "gen-lang-client-0846821407",
    appId: "1:692923259240:web:ab1f1cb49bbb19b8d81edd",
    apiKey: "AIzaSyCIuyy15SbpaSLmy1s8ntz-WlOqaQ4PwvA",
    authDomain: "gen-lang-client-0846821407.firebaseapp.com",
    storageBucket: "gen-lang-client-0846821407.firebasestorage.app",
    messagingSenderId: "692923259240",
    firestoreDatabaseId: "ai-studio-9f533733-bd79-49db-97ba-3503bcaf4462"
};

let db;

const database = {
    async init() {
        if (!window.firebase) {
            console.error("Firebase SDK non chargé");
            throw new Error("SDK Firebase manquant");
        }

        try {
            // Check if app is already initialized
            let app;
            if (firebase.apps.length === 0) {
                app = firebase.initializeApp(firebaseConfig);
                console.log("Firebase App initialisée");
            } else {
                app = firebase.app();
            }

            // In compat SDK, firebase.app().firestore() is usually used
            // Multi-database support in compat is limited, so we use the default or what's configured
            db = firebase.firestore();

            console.log("Firestore ready");
        } catch (e) {
            console.error("Firestore init failed:", e);
            throw e;
        }
    },

    // Error handler mandatory for security rule debugging
    handleError(error, operation, path) {
        const errInfo = {
            error: error.message || String(error),
            operationType: operation, // 'create', 'update', 'delete', 'list', 'get', 'write'
            path: path,
            authInfo: {
                userId: null // We'll add auth later
            }
        };
        console.error('Firestore Error: ', JSON.stringify(errInfo));
        throw new Error(JSON.stringify(errInfo));
    },

    async saveUser(user) {
        try {
            await db.collection('users').doc(user.id).set(user);
        } catch (e) {
            this.handleError(e, 'write', 'users/' + user.id);
        }
    },

    async getUsers() {
        try {
            const snapshot = await db.collection('users').get();
            return snapshot.docs.map(doc => doc.data());
        } catch (e) {
            this.handleError(e, 'list', 'users');
        }
    },

    async addLot(lot) {
        try {
            await db.collection('lots').doc(lot.id).set(lot);
        } catch (e) {
            this.handleError(e, 'create', 'lots/' + lot.id);
        }
    },

    async getLot(id) {
        try {
            const doc = await db.collection('lots').doc(id).get();
            return doc.exists ? doc.data() : null;
        } catch (e) {
            this.handleError(e, 'get', 'lots/' + id);
        }
    },

    async updateLot(lot) {
        try {
            await db.collection('lots').doc(lot.id).set(lot, { merge: true });
        } catch (e) {
            this.handleError(e, 'update', 'lots/' + lot.id);
        }
    },

    async getAllLots() {
        try {
            const snapshot = await db.collection('lots').get();
            return snapshot.docs.map(doc => doc.data());
        } catch (e) {
            this.handleError(e, 'list', 'lots');
        }
    },

    async addTransfer(transfer) {
        try {
            // Firestore doesn't have auto-increment. We use document ID or timestamp.
            const id = transfer.id || `trans_${Date.now()}`;
            await db.collection('transfers').doc(id).set({ ...transfer, id });
        } catch (e) {
            this.handleError(e, 'create', 'transfers');
        }
    },

    async getAllTransfers() {
        try {
            const snapshot = await db.collection('transfers').get();
            return snapshot.docs.map(doc => doc.data());
        } catch (e) {
            this.handleError(e, 'list', 'transfers');
        }
    },

    async getTransfersByLot(lotId) {
        try {
            const snapshot = await db.collection('transfers').where('lotId', '==', lotId).get();
            return snapshot.docs.map(doc => doc.data()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } catch (e) {
            this.handleError(e, 'list', 'transfers');
        }
    },

    async clearAllData() {
        // En Firebase, on évite de tout vider à chaque fois, mais pour un bouton "clear" :
        console.warn("ClearAllData non implémenté pour Firebase pour éviter les destructions accidentelles.");
    }
};
