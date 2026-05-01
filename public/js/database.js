const DB_NAME = 'ChainCacaoDB';
const DB_VERSION = 1;

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
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            }
        });

        await this.seedIfNeeded();
    },

    async seedIfNeeded() {
        const count = await this.getAllLots();
        if (count.length === 0) {
            console.log("Seeding initial data...");
            const actors = [
                { id: 'ACT-001', name: 'Jean Coulibaly', role: 'FARMER', region: 'Sud-Ouest' },
                { id: 'COOP-001', name: 'Coopérative de Gagnoa', role: 'COOPERATIVE' }
            ];
            for (const actor of actors) await db.put('actors', actor);

            const demoLot = {
                id: 'LOT-20260430-1234',
                farmerId: 'ACT-001',
                farmerName: 'Jean Coulibaly',
                timestamp: new Date(),
                weight: 50.5,
                species: 'Forastero',
                gps: { lat: 5.92, lng: -6.01 },
                photo: null,
                status: 'COOP_VALIDATED'
            };
            await db.put('lots', demoLot);

            await db.add('transfers', {
                lotId: demoLot.id,
                actorId: 'ACT-001',
                type: 'CREATION',
                timestamp: new Date(Date.now() - 3600000),
                hash: '1a2b3c4d5e6f...',
                data: { weight: 50.5 }
            });
            
            await db.add('transfers', {
                lotId: demoLot.id,
                actorId: 'COOP-001',
                type: 'COOP_VALIDATION',
                timestamp: new Date(),
                hash: '9z8y7x6w5v...',
                data: { officialWeight: 50.2, grade: 'Grade 1' }
            });
        }
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

    async getTransfersByLot(lotId) {
        return db.getAllFromIndex('transfers', 'by-lot', lotId);
    }
};
