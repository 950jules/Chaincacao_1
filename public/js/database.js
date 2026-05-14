const database = {
    localLotsKey: 'chaincacao_lots_local_v1',
    localTransfersKey: 'chaincacao_transfers_local_v1',

    async init() {
        console.log("Database Module Loaded using Firebase Compat SDK");
        if (typeof firebase !== 'undefined') {
            window.firebaseDB = firebase.firestore();
            window.firebaseAuth = firebase.auth();
        }
    },

    getSessionUser() {
        if (typeof auth !== 'undefined' && auth.currentUser) {
            return auth.currentUser;
        }

        try {
            return JSON.parse(localStorage.getItem('chaincacao_user'));
        } catch {
            return null;
        }
    },

    toDateValue(value) {
        if (value && typeof value.toDate === 'function') {
            return value.toDate();
        }

        if (value instanceof Date) {
            return value;
        }

        const parsed = new Date(value || Date.now());
        return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    },

    normalizeLot(lot) {
        return {
            ...lot,
            id: lot.id || `lot-${Date.now()}`,
            timestamp: this.toDateValue(lot.timestamp || new Date())
        };
    },

    readLocalLots() {
        try {
            const raw = localStorage.getItem(this.localLotsKey);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];

            return parsed.map(lot => ({
                ...lot,
                timestamp: this.toDateValue(lot.timestamp)
            }));
        } catch {
            return [];
        }
    },

    writeLocalLots(lots) {
        const serializable = lots.map(lot => ({
            ...lot,
            timestamp: this.toDateValue(lot.timestamp).toISOString()
        }));
        localStorage.setItem(this.localLotsKey, JSON.stringify(serializable));
    },

    upsertLocalLot(lot) {
        const normalized = this.normalizeLot(lot);
        const all = this.readLocalLots();
        const idx = all.findIndex(item => item.id === normalized.id);

        if (idx >= 0) {
            all[idx] = { ...all[idx], ...normalized };
        } else {
            all.push(normalized);
        }

        this.writeLocalLots(all);
        return normalized;
    },

    readLocalTransfers() {
        try {
            const raw = localStorage.getItem(this.localTransfersKey);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];

            return parsed.map(transfer => ({
                ...transfer,
                timestamp: this.toDateValue(transfer.timestamp)
            }));
        } catch {
            return [];
        }
    },

    writeLocalTransfers(transfers) {
        const serializable = transfers.map(transfer => ({
            ...transfer,
            timestamp: this.toDateValue(transfer.timestamp).toISOString()
        }));
        localStorage.setItem(this.localTransfersKey, JSON.stringify(serializable));
    },

    upsertLocalTransfer(transfer) {
        const normalized = {
            ...transfer,
            timestamp: this.toDateValue(transfer.timestamp || new Date())
        };
        const all = this.readLocalTransfers();
        all.push(normalized);
        this.writeLocalTransfers(all);
        return normalized;
    },

    mergeLots(cloudLots, localLots) {
        const map = new Map();

        localLots.forEach(lot => {
            map.set(lot.id, lot);
        });

        cloudLots.forEach(lot => {
            map.set(lot.id, lot);
        });

        return Array.from(map.values()).sort((a, b) => this.toDateValue(b.timestamp) - this.toDateValue(a.timestamp));
    },

    findLocalLotById(id) {
        const target = (id || '').toString().trim().toLowerCase();
        return this.readLocalLots().find(lot => (lot.id || '').toString().trim().toLowerCase() === target) || null;
    },

    filterLotsForCurrentUser(lots) {
        const user = this.getSessionUser();
        if (!user) return lots;

        const role = (user.role || '').toString().toUpperCase();
        if (role === 'AGR') {
            return lots.filter(lot => lot.farmerId === user.id);
        }
        if (role === 'COOP' && user.cooperative) {
            return lots.filter(lot => lot.cooperative === user.cooperative);
        }

        return lots;
    },

    handleError(error, operationType, path) {
        const errInfo = {
            error: error instanceof Error ? error.message : String(error),
            operationType,
            path
        };
        console.error('Firestore Error:', JSON.stringify(errInfo));
    },

    async saveUser(user) {
        console.log("Saving user to Firestore:", user.id);
        try {
            await firebase.firestore().collection('users').doc(user.id).set(user);
            console.log("✅ User saved:", user.id);
        } catch (e) {
            this.handleError(e, 'saveUser', `users/${user.id}`);
        }
    },

    async getUsers() {
        try {
            const snapshot = await firebase.firestore().collection('users').get();
            return snapshot.docs.map(doc => doc.data());
        } catch (e) {
            this.handleError(e, 'getUsers', 'users');
            return [];
        }
    },

    async getUser(id) {
        console.log("Fetching user from Firestore:", id);
        try {
            const docSnap = await firebase.firestore().collection('users').doc(id).get();
            if (docSnap.exists) {
                console.log("✅ User found:", id);
                return docSnap.data();
            }
            return null;
        } catch (e) {
            this.handleError(e, 'getUser', `users/${id}`);
            return null;
        }
    },

    async addLot(lot) {
        const normalized = this.normalizeLot(lot);
        const lotId = normalized.id;
        console.log("Adding lot:", lotId);

        // Always keep a local copy so lots survive reloads and reconnects.
        this.upsertLocalLot(normalized);

        void (async () => {
            try {
                await firebase.firestore().collection('lots').doc(lotId).set({
                    ...normalized,
                    id: lotId,
                    timestamp: this.toDateValue(normalized.timestamp)
                });
                console.log("✅ Lot added:", lotId);
            } catch (e) {
                this.handleError(e, 'addLot', `lots/${lotId}`);
            }
        })();

        return normalized;
    },

    async getLot(id) {
        const localMatch = this.findLocalLotById(id);

        try {
            const docSnap = await firebase.firestore().collection('lots').doc(id).get();
            if (docSnap.exists) {
                return docSnap.data();
            }
            return localMatch;
        } catch (e) {
            this.handleError(e, 'getLot', `lots/${id}`);
            return localMatch;
        }
    },

    async updateLot(lot) {
        const normalized = this.normalizeLot(lot);
        this.upsertLocalLot(normalized);

        void (async () => {
            try {
                const updateData = { ...normalized };
                delete updateData.id;
                await firebase.firestore().collection('lots').doc(normalized.id).update(updateData);
                console.log("✅ Lot updated:", normalized.id);
            } catch (e) {
                this.handleError(e, 'updateLot', `lots/${normalized.id}`);
            }
        })();

        return normalized;
    },

    async getAllLots() {
        const localLots = this.readLocalLots();

        try {
            const snapshot = await firebase.firestore()
                .collection('lots')
                .orderBy('timestamp', 'desc')
                .get();

            const cloudLots = snapshot.docs.map(doc => {
                const data = doc.data();
                if (data.timestamp && data.timestamp.toDate) {
                    data.timestamp = data.timestamp.toDate();
                }
                return data;
            });

            const merged = this.mergeLots(cloudLots, localLots);
            this.writeLocalLots(merged);
            return this.filterLotsForCurrentUser(merged);
        } catch (e) {
            this.handleError(e, 'getAllLots', 'lots');
            return this.filterLotsForCurrentUser(localLots);
        }
    },

    async getLotsByFarmer(farmerId) {
        console.log("Getting lots for farmer:", farmerId);
        try {
            const snapshot = await firebase.firestore()
                .collection('lots')
                .where('farmerId', '==', farmerId)
                .orderBy('timestamp', 'desc')
                .get();
            
            const lots = snapshot.docs.map(doc => {
                const data = doc.data();
                if (data.timestamp && data.timestamp.toDate) {
                    data.timestamp = data.timestamp.toDate();
                }
                return data;
            });

            const localForFarmer = this.readLocalLots().filter(l => l.farmerId === farmerId);
            const merged = this.mergeLots(lots, localForFarmer);
            console.log("✅ Found", lots.length, "lots for farmer:", farmerId);
            return merged;
        } catch (e) {
            console.warn("Query error (index may be missing), trying fallback:", e.message);
            const all = this.readLocalLots();
            return all.filter(l => l.farmerId === farmerId);
        }
    },

    async getLotsByCooperative(cooperativeName) {
        console.log("Getting lots for cooperative:", cooperativeName);
        const target = (cooperativeName || '').toString().trim().toUpperCase();
        const localLots = this.readLocalLots().filter(lot => (lot.cooperative || '').toString().trim().toUpperCase() === target);

        try {
            const snapshot = await firebase.firestore()
                .collection('lots')
                .where('cooperative', '==', cooperativeName)
                .orderBy('timestamp', 'desc')
                .get();
            
            const cloudLots = snapshot.docs.map(doc => {
                const data = doc.data();
                if (data.timestamp && data.timestamp.toDate) {
                    data.timestamp = data.timestamp.toDate();
                }
                return data;
            });

            const merged = this.mergeLots(cloudLots, localLots).filter(lot => (lot.cooperative || '').toString().trim().toUpperCase() === target);
            return merged;
        } catch (e) {
            console.warn("Cooperative query error, trying fallback:", e.message);
            return localLots;
        }
    },

    async addTransfer(transfer) {
        console.log("Adding transfer for lot:", transfer.lotId);
        this.upsertLocalTransfer(transfer);
        try {
            await firebase.firestore()
                .collection('lots')
                .doc(transfer.lotId)
                .collection('transfers')
                .add({
                    ...transfer,
                    timestamp: new Date()
                });
            console.log("✅ Transfer logged");
        } catch (e) {
            this.handleError(e, 'addTransfer', `lots/${transfer.lotId}/transfers`);
        }
    },

    async getTransfersByLot(lotId) {
        try {
            const snapshot = await firebase.firestore()
                .collection('lots')
                .doc(lotId)
                .collection('transfers')
                .orderBy('timestamp', 'asc')
                .get();
            
            return snapshot.docs.map(doc => {
                const data = doc.data();
                if (data.timestamp && data.timestamp.toDate) {
                    data.timestamp = data.timestamp.toDate();
                }
                return data;
            });
        } catch (e) {
            this.handleError(e, 'getTransfersByLot', `lots/${lotId}/transfers`);
            return this.readLocalTransfers().filter(transfer => transfer.lotId === lotId);
        }
    }
};
