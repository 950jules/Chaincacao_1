const CACHE_NAME = 'chaincacao-v3';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './css/agriculteur.css',
    './css/cooperative.css',
    './css/exportateur.css',
    './css/verificateur.css',
    './js/app.js',
    './js/utils.js',
    './js/database.js',
    './js/agriculteur.js',
    './js/cooperative.js',
    './js/exportateur.js',
    './js/verificateur.js',
    './js/blockchain.js',
    './js/gps.js',
    './js/camera.js',
    './js/qrcode.js',
    './js/pdf.js',
    './js/offline.js',
    './js/firebase-init.js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://cdn.jsdelivr.net/npm/idb@8/build/umd.js',
    'https://unpkg.com/html5-qrcode',
    'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting(); // Force activation immediately
});

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Take control of all clients immediately
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests in the cache layer.
    // Avoid caching POST/PUT/PATCH requests (Firebase/Auth/Firestore writes).
    if (event.request.method !== 'GET') {
        return;
    }

    // Network-first strategy: Try network first, fallback to cache
    // This allows Firestore and real-time data to work properly
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful network responses
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fall back to cache if network fails
                return caches.match(event.request);
            })
    );
});
