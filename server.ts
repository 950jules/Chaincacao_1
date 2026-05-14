import express from 'express';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';
import qrcode from 'qrcode-terminal';
import compression from 'compression';
import helmet from 'helmet';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

const env = (key: string, fallback = '') => process.env[key] || fallback;
// Initialize singletons for provider/wallet/contract to reduce latency
const RPC_URL = env('NEXT_PUBLIC_POLYGON_RPC_URL', env('NEXT_PUBLIC_AMOY_RPC_URL', 'https://polygon-rpc.com'));
let providerSingleton: ethers.JsonRpcProvider | null = null;
let walletSingleton: ethers.Wallet | null = null;
let contractSingleton: ethers.Contract | null = null;

function maskRpc(url: string) {
    try {
        return url.replace(/(v2\/)[^\/]+$/, '$1***');
    } catch (e) {
        return '***masked***';
    }
}

function initRelayerSingletons() {
    // Wrap global fetch to log outgoing provider requests (masked)
    try {
        const _origFetch = (globalThis as any).fetch;
        if (_origFetch && !(globalThis as any).__fetch_wrapped) {
            (globalThis as any).fetch = async (input: any, init?: any) => {
                try {
                    const urlStr = typeof input === 'string' ? input : (input && input.url) ? input.url : String(input);
                    console.log('Outgoing fetch ->', maskRpc(String(urlStr)));
                } catch (e) {}
                return _origFetch(input, init);
            };
            (globalThis as any).__fetch_wrapped = true;
        }
    } catch (e) {}

    if (!providerSingleton) {
        providerSingleton = new ethers.JsonRpcProvider(RPC_URL);
    }

    const pk = env('PRIVATE_KEY_RELAYER');
    const contractAddress = env('NEXT_PUBLIC_CONTRACT_ADDRESS');
    const abi = [
        'function anchorData(string memory batchId, string memory dataHash, string memory actorId) public'
    ];

    if (pk && !walletSingleton) {
        walletSingleton = new ethers.Wallet(pk, providerSingleton);
    }

    if (contractAddress && !contractSingleton) {
        if (walletSingleton) contractSingleton = new ethers.Contract(contractAddress, abi, walletSingleton);
        else contractSingleton = new ethers.Contract(contractAddress, abi, providerSingleton);
    }

    // Minimal startup info without leaking secrets
    console.log('Relayer initialized. RPC:', maskRpc(RPC_URL), 'Contract:', contractAddress ? contractAddress : 'not set');
}

// Init singletons eagerly
initRelayerSingletons();

// Initialisation Firebase Admin
try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
    if (serviceAccountPath) {
        const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(serviceAccountPath), 'utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin initialisé avec succès');
    }
} catch (error: any) {
    console.error('⚠️ Firebase Admin non initialisé:', error.message);
}

// Simple in-memory rate limiting
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
function rateLimit(ip: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = rateLimitStore.get(ip);
    
    if (!record || now > record.resetTime) {
        rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
        return true;
    }
    
    if (record.count >= maxRequests) {
        return false;
    }
    
    record.count++;
    return true;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Sécurité et Optimisation
app.use(helmet({
    contentSecurityPolicy: false, // Désactivé pour permettre le chargement des scripts Firebase/CDNs externes facilement en démo
}));
app.use(compression());
app.use(express.json());

// Headers CORS pour éviter les blocages sur mobile
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Route de santé pour le monitoring
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '2.1.0'
    });
});

// Serve website FIRST (priority over app)
app.use(express.static(path.join(__dirname, 'website')));

// Serve PWA under /app so API calls remain same-origin with the backend
app.use('/app', express.static(path.join(__dirname, 'public')));

app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Relayer pour les transactions sans gaz (Gasless)
app.post('/api/blockchain/notarize', async (req, res) => {
    const clientIP = req.ip || 'unknown';
    
    if (!rateLimit(clientIP, 10, 60000)) {
        return res.status(429).json({ error: 'Trop de requêtes. Veuillez attendre 1 minute.' });
    }
    
    const { batchId, dataHash, actorId } = req.body;
    
    // Validation
    if (!batchId || typeof batchId !== 'string' || batchId.length === 0) {
        return res.status(400).json({ error: 'ID lot invalide' });
    }
    if (!dataHash || typeof dataHash !== 'string') {
        return res.status(400).json({ error: 'Hash de données invalide' });
    }
    if (!actorId || typeof actorId !== 'string') {
        return res.status(400).json({ error: 'ID acteur invalide' });
    }
    
    const contract = contractSingleton;

    if (!contract) {
        return res.status(500).json({ error: 'Relayer non configuré (contract missing)' });
    }

    try {
        console.log(`🔐 Relayer: Notarisation en cours pour ${batchId}...`);
        const tx = await contract.anchorData(batchId, dataHash, actorId);
        console.log(`✅ Relayer: Tx envoyée - ${tx.hash}`);

        res.json({
            success: true,
            hash: tx.hash,
            status: 'pending',
            network: 'Polygon Mainnet',
            explorerUrl: `https://polygonscan.com/tx/${tx.hash}`
        });
    } catch (error: any) {
        console.error('❌ Relayer Error:', error && error.message ? error.message : error);
        res.status(500).json({ 
            success: false,
            error: error && error.message ? error.message : String(error)
        });
    }
});

// API pour vérifier le statut d'une transaction
app.get('/api/blockchain/status/:hash', async (req, res) => {
    const { hash } = req.params;
    
    if (!hash || typeof hash !== 'string' || !hash.startsWith('0x')) {
        return res.status(400).json({ error: 'Hash invalide' });
    }
    
    try {
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com');
        const receipt = await provider.getTransactionReceipt(hash);
        
        if (!receipt) {
            return res.json({ status: 'pending', confirmations: 0 });
        }
        
        const blockNumber = await provider.getBlockNumber();
        const confirmations = Math.max(0, blockNumber - receipt.blockNumber);
        
        res.json({
            status: receipt.status === 1 ? 'confirmed' : 'failed',
            blockNumber: receipt.blockNumber,
            confirmations,
            gasUsed: receipt.gasUsed.toString(),
            explorerUrl: `https://polygonscan.com/tx/${hash}`
        });
    } catch (error: any) {
        console.error('Status check error:', error.message);
        res.status(500).json({ error: 'Erreur lors de la vérification du statut' });
    }
});

// DEBUG: expose RPC url and test provider (local only)
app.get('/api/debug/rpc', async (req, res) => {
    try {
        const rpc = RPC_URL;
        if (!providerSingleton) providerSingleton = new ethers.JsonRpcProvider(rpc);
        const block = await providerSingleton.getBlockNumber();
        res.json({ rpc: maskRpc(rpc), block });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ==== API ENDPOINTS FOR WEBSITE ====

// Import Firebase Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
    apiKey: env('NEXT_PUBLIC_FIREBASE_API_KEY', env('FIREBASE_API_KEY')),
    authDomain: env('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', `${env('FIREBASE_PROJECT_ID')}.firebaseapp.com`),
    projectId: env('NEXT_PUBLIC_FIREBASE_PROJECT_ID', env('FIREBASE_PROJECT_ID')),
    storageBucket: env('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', `${env('FIREBASE_PROJECT_ID')}.firebasestorage.app`),
    messagingSenderId: env('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', ''),
    appId: env('NEXT_PUBLIC_FIREBASE_APP_ID', '')
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Get all lots for analytics
app.get('/api/lots', async (req, res) => {
    try {
        const lotsCollection = collection(db, 'lots');
        const snapshot = await getDocs(lotsCollection);
        const lots = snapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data()
        }));
        res.json(lots);
    } catch (error: any) {
        console.error('Error fetching lots:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des lots' });
    }
});

// Get single lot by ID
app.get('/api/lot/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const lotsCollection = collection(db, 'lots');
        
        // Try by exact ID match
        const q = query(lotsCollection, where('__name__', '==', id));
        let snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            // Try by custom ID field
            const q2 = query(lotsCollection, where('id', '==', id));
            snapshot = await getDocs(q2);
        }
        
        if (snapshot.empty) {
            // Try by batchId
            const q3 = query(lotsCollection, where('batchId', '==', id));
            snapshot = await getDocs(q3);
        }

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Lot not found' });
        }

        const lot = snapshot.docs[0];
        res.json({
            _id: lot.id,
            ...lot.data()
        });
    } catch (error: any) {
        console.error('Error fetching lot:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du lot' });
    }
});

// Get lot history/transfers
app.get('/api/lot/:id/history', async (req, res) => {
    try {
        const { id } = req.params;
        const transfersCollection = collection(db, 'transfers');
        
        // Query transfers for this lot
        const q = query(transfersCollection, where('lotId', '==', id));
        const snapshot = await getDocs(q);
        
        const transfers = snapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data()
        }));
        
        res.json(transfers.sort((a: any, b: any) => {
            const aTime = a.timestamp?.seconds || 0;
            const bTime = b.timestamp?.seconds || 0;
            return aTime - bTime;
        }));
    } catch (error: any) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
    }
});

// Get analytics data
app.get('/api/analytics', async (req, res) => {
    try {
        const lotsCollection = collection(db, 'lots');
        const snapshot = await getDocs(lotsCollection);
        const lots = snapshot.docs.map(doc => doc.data());

        // Calculate analytics
        const totalLots = lots.length;
        const totalWeight = lots.reduce((sum: number, lot: any) => sum + (lot.weight || 0), 0);
        const averageWeight = totalLots > 0 ? totalWeight / totalLots : 0;

        const statuses = {
            pending: lots.filter((lot: any) => lot.status === 'pending').length,
            collected: lots.filter((lot: any) => lot.status === 'collected').length,
            exported: lots.filter((lot: any) => lot.status === 'exported').length
        };

        const notarizations = lots.filter((lot: any) => lot.hash).length;

        // Group by region
        const regions: any = {};
        lots.forEach((lot: any) => {
            const region = lot.region || 'Unknown';
            regions[region] = (regions[region] || 0) + 1;
        });

        // Group by cooperative
        const cooperatives: any = {};
        lots.forEach((lot: any) => {
            const coop = lot.cooperative || 'Standard';
            cooperatives[coop] = (cooperatives[coop] || 0) + 1;
        });

        res.json({
            totalLots,
            totalWeight: Math.round(totalWeight),
            averageWeight: Math.round(averageWeight * 100) / 100,
            statuses,
            notarizations,
            regions,
            cooperatives
        });
    } catch (error: any) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des analytics' });
    }
});

// Serve app at /app/* route
app.use('/app', express.static(path.join(__dirname, 'public')));
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback - serve website (for SPA routing)
app.get(/.*/, (req, res) => {
    const websiteIndex = path.join(__dirname, 'website', 'index.html');
    const publicIndex = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(websiteIndex)) {
        res.sendFile(websiteIndex);
    } else if (fs.existsSync(publicIndex)) {
        res.sendFile(publicIndex);
    } else {
        res.status(404).send('Not found');
    }
});

// Détection fiable de l'IP locale (ignore loopback, VPN, etc.)
function getLocalIP(): string {
    const interfaces = os.networkInterfaces();
    const candidates: string[] = [];

    for (const name of Object.keys(interfaces)) {
        const iface = interfaces[name];
        if (!iface) continue;
        for (const info of iface) {
            if (info.family === 'IPv4' && !info.internal) {
                // Priorité aux adresses de réseau local classiques
                if (info.address.startsWith('192.168.') ||
                    info.address.startsWith('10.') ||
                    info.address.startsWith('172.')) {
                    candidates.unshift(info.address); // Priorité haute
                } else {
                    candidates.push(info.address);
                }
            }
        }
    }
    return candidates[0] || '127.0.0.1';
}

app.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    const url = `http://${localIP}:${PORT}`;

    console.log('\n');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║         🍫  ChainCacao  v2               ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  Local  : http://localhost:${PORT}          ║`);
    console.log(`║  Réseau : ${url.padEnd(31)}║`);
    console.log('╠══════════════════════════════════════════╣');
    console.log('║  📱 Scannez pour tester sur mobile :     ║');
    console.log('╚══════════════════════════════════════════╝\n');

    // QR code dans le terminal
    qrcode.generate(url, { small: true });

    console.log('\n✅ Pré-requis mobile :');
    console.log('   • Téléphone sur le MÊME Wi-Fi que ce PC');
    console.log('   • GPS : fonctionne en HTTP local sur Android ✓');
    console.log('   • Caméra : fonctionne en HTTP local sur Android ✓');
    console.log('   • iOS : activer Réglages > Safari > Avancé > Fonctions expérimentales > Localhost\n');
    console.log('💡 Pour HTTPS (iOS strict) : npx ngrok http ' + PORT);
});
