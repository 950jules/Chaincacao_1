import express from 'express';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import qrcode from 'qrcode-terminal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Headers CORS pour éviter les blocages sur mobile
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
