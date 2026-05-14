# 🧪 Guide de Test - ChainCacao v2.1

## ✅ Démarrage du Serveur

```bash
cd c:\Users\Baron_PC\OneDrive\Desktop\chaincacao
node server.ts
```

**Résultats attendus:**
- ✓ Message: `✅ Pré-requis mobile : ...`
- ✓ QR Code visible dans le terminal
- ✓ Endpoints disponibles:
  - http://localhost:3000/
  - http://localhost:3000/api/health
  - http://localhost:3000/api/blockchain/notarize (POST)
  - http://localhost:3000/api/blockchain/status/:hash (GET)

---

## 📱 Accès à l'Application

### Sur PC (Local):
```
http://localhost:3000/
```

### Sur Téléphone (Même Wi-Fi):
```
Scannez le QR Code du terminal
ou
http://{YOUR_PC_IP}:3000/
```

**Exemple:** http://192.168.1.79:3000/

---

## 🧑‍🌾 Test 1: Workflow Agriculteur (Création de Lot)

### Étape 1: Connexion
1. Ouvrez l'application
2. Cliquez sur le bouton "Connexion" ou attendez le remplissage automatique
3. Entrez un email test: `agri1@test.com` (ou any `agri*@test.com`)
4. Cliquez "Connexion"

**Résultat:** Vous êtes redirigé vers le dashboard Agriculteur

### Étape 2: Créer un Nouveau Lot
1. Cliquez "NOUVEAU LOT"
2. Remplissez le formulaire:
   - **Poids:** 50 (kg) - Entre 0.5 et 1000
   - **Espèce:** Cacao
   - **Région:** Région du Plateau (ou autre)
3. Cliquez "Suivant"

**Résultat attendu:**
- ✓ Aucune erreur de validation
- ✓ Passage à l'étape photo

### Étape 3: Capturer GPS et Photo
1. Cliquez "CAPTURER GPS" (mobile seulement)
   - Sur PC: GPS sera simulé en Togo
   - Sur Mobile: Acceptez l'accès GPS quand demandé
2. Cliquez "PHOTO DU SAC" (optionnel)
3. Cliquez "Valider"

**Résultat attendu:**
- ✓ GPS affiché (latitude/longitude)
- ✓ Mini-map visible
- ✓ Passage à l'étape validation blockchain

### Étape 4: Confirmation Blockchain
1. Attendez le message "⏳ Attente de confirmation blockchain..."
2. Attendez 10-30 secondes pour la confirmation PolygonScan

**Résultats attendus:**
- ✓ ID du Lot généré (ex: "PLATEAU-AGR1-20260514-001")
- ✓ QR Code affiché pour l'ID
- ✓ Transaction Hash visible
- ✓ Bouton "VOIR SUR POLYGONSCAN" clickable
- ✓ Message: "✅ Lot enregistré et ancré sur Polygon"

### Étape 5: Vérifier sur PolygonScan
1. Cliquez "VOIR SUR POLYGONSCAN"
2. Vérifiez que:
   - Transaction apparaît sur polygonscan.com
   - Status = "Success"
   - Method = "anchorData"
   - Input Data contient l'ID du lot

**Jury Point:** Montre que c'est du vrai blockchain, pas une simulation!

---

## 👥 Test 2: Workflow Coopérative (Validation Lot)

### Étape 1: Se Connecter comme Coopérative
1. Retour au login
2. Email: `coop1@test.com` (ou `coop*@test.com`)
3. Cliquez "Connexion"

**Résultat:** Dashboard Coopérative visible

### Étape 2: Vérifier le Filtrage de Lots
1. Observez la section "Lots à valider"
2. **Important:** Vous devriez voir le lot créé par `agri1@test.com`
3. Si vous créez un lot avec un autre agriculteur (ex `agri2@test.com`), il n'apparaîtrait pas ici

**Jury Point:** Démontre la confidentialité des données!

### Étape 3: Valider un Lot
1. Cliquez sur le lot dans la liste
2. Popup "Fiche de Traçabilité" apparaît
3. Cliquez "VALIDER LOT" (si bouton visible)

**Résultat:** Lot status change de "CREATED" à "COLLECTED"

---

## 📊 Test 3: Dashboard Analytics

### Étape 1: Accéder au Dashboard
1. Cherchez l'onglet "📊 Tableau de Bord" dans la navigation
   - **OU** allez à http://localhost:3000 (page d'accueil)

### Étape 2: Vérifier les Statistiques
Vous devriez voir:

| Métrique | Exemple |
|----------|---------|
| Lots Enregistrés | 2 |
| Total Poids | 150.5 kg |
| Collectés | 1 |
| Notarisations | 2 |
| Qualité % | 50% |

### Étape 3: Vérifier les Graphiques
- Distribution par État (barres)
- Distribution Régionale (liste)
- Distribution par Coopérative (liste)

**Jury Point:** Données visuelles montrent une application scalable et professionnelle!

---

## ✔️ Test 4: Validation des Formulaires

### Poids Invalide:
1. Créez un nouveau lot
2. Poids: "-50" ou "2000"
3. **Résultat attendu:** ❌ Message d'erreur "Le poids minimum est 0.5kg"

### GPS Invalide (sur PC):
1. Créez un nouveau lot
2. GPS sera faux si hors Togo
3. **Résultat attendu:** ❌ Message "Position hors de Togo"

---

## 🔒 Test 5: Rate Limiting (Avancé)

### Test Limiter les Requêtes:
```bash
# Terminal 2 - Envoyer 15 requêtes d'affilée
for i in {1..15}; do 
  curl -X POST http://localhost:3000/api/blockchain/notarize \
    -H "Content-Type: application/json" \
    -d '{"batchId":"test-'$i'","dataHash":"0x123","actorId":"user1"}' 
  echo "Request $i"
done
```

**Résultat attendu:**
- Requêtes 1-10 = Réponses 200 OK
- Requêtes 11-15 = Réponse 429 (Too Many Requests)

---

## 🎨 Test 6: Responsive Design

### Sur PC (1920x1080):
1. Ouvrez l'application
2. Vérifiez que le layout utilise toute la largeur
3. Cartes doivent être bien espacées et lisibles

### Sur Tablet (iPad, 1024x768):
1. Scannez le QR Code sur tablet
2. Interface doit être fluide et adaptée
3. Boutons doivent être faciles à toucher

### Sur Mobile (iPhone 12, 390x844):
1. Scannez le QR Code sur mobile
2. Interface doit être verticale et touchable
3. Aucun débordement de texte

---

## 🌙 Test 7: Dark Mode

1. Cliquez le bouton 🌙 (Moon icon) en haut à droite
2. L'app doit passer en thème sombre
3. Texte rester lisible
4. Cliquez à nouveau pour revenir au mode clair

---

## 🐛 Troubleshooting

### Le serveur ne démarre pas:
```bash
# Erreur: "Cannot find module 'express'"
npm install
node server.ts
```

### Erreur CORS sur mobile:
- Assurez-vous d'être sur le même Wi-Fi
- Vérifiez l'IP: `ipconfig getifaddr en0` (Mac) ou `ipconfig` (Windows)

### Blockchain transaction ne confirme pas:
- Attendez 30-60 secondes
- Vérifiez la clé privée du Relayer en .env
- Allez sur PolygonScan pour vérifier manuellement

### GPS retourne toujours 0,0:
- Sur PC: C'est normal, c'est simulé
- Sur mobile: Autorisez l'accès GPS dans les paramètres du téléphone

---

## 📋 Checklist Pré-Présentation Jury

- [ ] Serveur démarre sans erreurs
- [ ] PolygonScan API accessible
- [ ] Connexion Firebase fonctionne
- [ ] Au moins 1 agriculteur et 1 coopérative testés
- [ ] Lot créé et confirmé sur blockchain
- [ ] Dashboard analytics affiche des données
- [ ] Validation des formulaires fonctionne
- [ ] Dark mode fonctionne
- [ ] App responsive sur mobile
- [ ] Aucun erreur console (F12)

---

## 📹 Demo Script pour le Jury (~10 min)

1. **[1 min]** Montre l'architecture: Blockchain + Firebase + Web3
2. **[2 min]** Crée un lot agriculteur → montre la notarisation blockchain
3. **[1 min]** Montre le lot sur PolygonScan
4. **[2 min]** Se connecte comme coopérative → montre le filtrage
5. **[2 min]** Montre le dashboard analytics
6. **[1 min]** Teste la validation (poids invalide)
7. **[1 min]** Q&A Jury

---

## 🚀 Prêt? Lancez:

```bash
node server.ts
```

Puis ouvrez: **http://localhost:3000/**

Bonne présentation! 🎉
