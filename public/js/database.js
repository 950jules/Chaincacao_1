const DB_NAME = 'ChainCacaoDB';
const DB_VERSION = 3;

let db;

const database = {
    async init() {
        db = await idb.openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('lots')) {
                    db.createObjectStore('lots', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('transfers')) {
                    const store = db.createObjectStore('transfers', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('by-lot', 'lotId');
                }
                if (!db.objectStoreNames.contains('actors')) {
                    db.createObjectStore('actors', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('users')) {
                    db.createObjectStore('users', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            }
        });

        await this.seedIfNeeded();
    },

    async seedIfNeeded() {
        // ... (existing seed code if any)
    },

    async saveUser(user) {
        return db.put('users', user);
    },

    async getUsers() {
        return db.getAll('users');
    },

    async clearAllData() {
        const tx = db.transaction(['lots', 'transfers'], 'readwrite');
        await tx.objectStore('lots').clear();
        await tx.objectStore('transfers').clear();
        await tx.done;
    },

    async addLot(lot) {
        return db.add('lots', lot);
    },

    async getLot(id) {
        return db.get('lots', id);
    },

    async updateLot(lot) {
        return db.put('lots', lot);
    },

    async getAllLots() {
        return db.getAll('lots');
    },

    async addTransfer(transfer) {
        return db.add('transfers', transfer);
    },

    async getAllTransfers() {
        return db.getAll('transfers');
    },

    async getTransfersByLot(lotId) {
        return db.getAllFromIndex('transfers', 'by-lot', lotId);
    }
};
