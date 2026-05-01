# ChainCacao - Traçabilité du Cacao du Togo

ChainCacao est une solution technologique de pointe conçue pour assurer la traçabilité complète du cacao togolais, en conformité avec les réglementations internationales (EUDR). L'application utilise la technologie Blockchain et le QR Code pour relier chaque sac de cacao à sa parcelle d'origine.

## 🚀 Fonctionnalités Clés

-   **PWA (Progressive Web App) :** Fonctionne hors-ligne dans les zones rurales reculées.
-   **Traçabilité Blockchain :** Chaque transaction est enregistrée sur Polygon pour une immuabilité totale.
-   **Preuves EUDR :** Capture automatique des coordonnées GPS et photos lors de la récolte.
-   **Interface Multi-Acteurs :**
    -   🧑‍🌾 **Agriculteur :** Déclaration des lots, capture GPS et QR Code.
    -   🤝 **Coopérative :** Pesée officielle, contrôle qualité et scellage.
    -   🚢 **Exportateur :** Gestion des manifests, contrôle phytosanitaire et douanes.
    -   🔍 **Vérificateur :** Audit public de la chaîne de traçabilité.

## 🖥️ Mode Démo

Pour voir l'application en action sans créer de compte, utilisez le paramètre d'URL :
`?demo=true`

Ceci lancera un assistant qui parcourt automatiquement les 4 étapes de la chaîne avec des données pré-remplies.

## 🛠️ Architecture Technique

-   **Frontend :** Vanilla JS (ES6+), CSS Grid/Flexbox (Vibe Design).
-   **Base de données :** IndexedDB (via `idb` library) pour le support offline.
-   **Blockchain :** Simulation de smart contracts sur réseau Polygon.
-   **Cartographie :** Leaflet.js pour la visualisation des parcelles.
-   **QR Code :** qrcode.js pour la génération d'identifiants uniques.

## 📦 Installation

1. Clonez le dépôt.
2. Ouvrez `index.html` via un serveur local (Live Server, etc.).
3. Pour la PWA, assurez-vous d'utiliser `https` ou `localhost`.

---
*Développé pour l'excellence et la transparence de la filière Cacao.*
