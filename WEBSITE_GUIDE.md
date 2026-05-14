# Guide d'Utilisation - Website ChainCacao

## Vue d'Ensemble

Le site web ChainCacao est le point d'entrée public de la plateforme. Il offre:

1. **Landing Page**: Présentation, données en temps réel, appel à l'action
2. **Page de Vérification Publique**: Consultation sans authentification
3. **Navigation vers l'Application**: Pour créer un compte et utiliser les fonctionnalités complètes

---

## Architecture Connectée

```
┌─────────────────────────────────────────────────────────┐
│              Website (Landing + Verification)            │
│         https://chaincacao.vercel.app (ou localhost)     │
│                                                          │
│  ┌─────────────────┐          ┌──────────────────┐      │
│  │  Homepage       │          │  Verify Page     │      │
│  │                 │          │                  │      │
│  │ - Charts        │          │ - Search Lot     │      │
│  │ - Real-time     │          │ - View History   │      │
│  │ - Stats         │          │ - Blockchain     │      │
│  │ - CTA Button    │          │ - Public Access  │      │
│  └────────┬────────┘          └────────┬─────────┘      │
│           │ "Commencer maintenant"     │ "Verifier"     │
│           └──────────┬──────────────────┘                │
│                      │                                   │
│              API Endpoints (http://localhost:3000/api)  │
│              - /lots, /lot/:id, /analytics              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
         ┌─────────────────────────────┐
         │  Backend Server (server.ts) │
         │  Port 3000                  │
         └──────────┬──────────────────┘
                    │
                    ↓
         ┌─────────────────────────────┐
         │  Firebase Firestore         │
         │  - lots collection          │
         │  - users collection         │
         │  - transfers collection     │
         └─────────────────────────────┘
```

---

## Flux Utilisateur

### Scénario 1: Découverte & Utilisation

```
1. Visiteur arrive sur Website
   ↓
2. Lit la homepage (features, données temps réel)
   ↓
3. Clique "Commencer maintenant"
   ↓
4. Redirige vers /app (l'application ChainCacao)
   ↓
5. Crée un compte (agriculteur, coopérative, exportateur)
   ↓
6. Utilise les fonctionnalités (créer lot, valider, exporter)
   ↓
7. Son lot est notarisé sur blockchain
```

### Scénario 2: Vérification Publique

```
1. Client (acheteur, tiers) visite Website
   ↓
2. Clique "Vérifier un lot"
   ↓
3. Entre l'ID du lot (fourni par le vendeur)
   ↓
4. Voit le parcours complet du lot
   ↓
5. Peut vérifier la blockchain (lien PolygonScan)
   ↓
6. Confirme l'authenticité du cacao
   ✓ Aucun compte requis
```

---

## Sections du Website

### Homepage (index.html)

#### 1. Navigation (Sticky)
```
ChainCacao | Accueil | Fonctionnalités | Données | Vérifier
```

#### 2. Hero Section
- Titre: "Traçabilité Authentique du Cacao Togolais"
- Subtitle: "Blockchain décentralisée. Transactions gratuites. Transparence totale."
- Boutons:
  - "Commencer maintenant" (lien vers /app)
  - "Vérifier un lot" (lien vers verify.html)
- Illustration: Cacao pod animé

#### 3. Features Section (4 colonnes)
- Sécurité Blockchain
- Traçabilité Complète
- Gratuit pour Agriculteurs
- Données en Temps Réel

#### 4. Stats Section (Données En Temps Réel)
```
Metric Cards:
┌─────────────────────┐
│ Lots Enregistrés    │
│        247          │
│ au total            │
└─────────────────────┘

┌─────────────────────┐
│ Poids Total         │
│      1,234 kg       │
│ kilogrammes         │
└─────────────────────┘

┌─────────────────────┐
│ Notarisations       │
│        198          │
│ transactions        │
└─────────────────────┘

┌─────────────────────┐
│ Qualité             │
│        89%          │
│ collectés/exportés  │
└─────────────────────┘
```

Charts (mis à jour automatiquement toutes les 30s):
- Distribution par Région (Bar Chart)
- Statut des Lots (Doughnut Chart: Pending, Collected, Exported)

#### 5. Quick Verify Section
```
Vérifier un Lot
Entrez l'ID d'un lot pour voir son parcours complet

[Input: "Entrez l'ID du lot..."] [Bouton: Vérifier]
```

#### 6. CTA Section
"Prêt à Tracer Votre Cacao?"
Bouton: "Accéder à l'Application"

#### 7. Footer
- ChainCacao info
- Navigation links
- Application links

---

### Page de Vérification (verify.html)

#### 1. Hero Section
- Titre: "Vérifier la Traçabilité d'un Lot"
- Subtitle: "Consultation publique - Aucun compte requis"

#### 2. Search Form
```
Rechercher par ID de Lot

[Input: "Entrez l'ID du lot (ex: LOT-001, COOP-2024-0001)"]
[Bouton: Rechercher]
```

#### 3. Résultats (Si trouvé)

**Lot Info Card**:
```
┌─────────────────────────────────────┐
│ Lot LOT-001              [COLLECTÉ]  │
├─────────────────────────────────────┤
│ Agriculteur: Adama Ouedraogo        │
│ Coopérative: Coop-A                 │
│ Région: Savanes                     │
│ Poids: 450 kg                       │
│ Espèce: Forastero                   │
│ Date: 13 mai 2026, 14:30            │
└─────────────────────────────────────┘
```

**Timeline**:
```
⏳ 13 mai 2026, 14:30
   Lot Créé
   Lot créé par l'agriculteur Adama Ouedraogo

✓ 13 mai 2026, 14:35
   Notarisé en Blockchain
   Confirmé sur la blockchain Polygon

✓ 14 mai 2026, 09:15
   Collecté par la Coopérative
   Collecté par Coop-A

(Liens vers historique complet)
```

**Blockchain Verification**:
```
┌─────────────────────────────────────┐
│ Vérification Blockchain             │
├─────────────────────────────────────┤
│ Hash:        0x1a2b3c4d...5e6f      │
│ PolygonScan: [Voir sur PolygonScan] │
│ Statut:      Confirmé               │
└─────────────────────────────────────┘
```

#### 4. Info Section
- Comment fonctionne la vérification (3 étapes)
- Avantages de la vérification blockchain

---

## Intégration API

### Endpoints Disponibles

```javascript
// Récupérer tous les lots
GET /api/lots
Response: [
  {
    _id: "lot123",
    farmerId: "adama@test.com",
    cooperative: "Coop-A",
    weight: 450,
    species: "Forastero",
    region: "Savanes",
    status: "collected",
    hash: "0x1a2b3c4d...",
    timestamp: {seconds: 1715654400}
  },
  ...
]

// Récupérer un lot spécifique
GET /api/lot/LOT-001
Response: {
  _id: "lot123",
  farmerId: "adama@test.com",
  ...
}

// Récupérer l'historique d'un lot
GET /api/lot/LOT-001/history
Response: [
  {
    _id: "transfer123",
    action: "collected",
    timestamp: {seconds: 1715657600},
    ...
  }
]

// Récupérer les analytics
GET /api/analytics
Response: {
  totalLots: 247,
  totalWeight: 1234,
  averageWeight: 5.0,
  statuses: {
    pending: 45,
    collected: 156,
    exported: 46
  },
  notarizations: 198,
  regions: {
    "Savanes": 67,
    "Kara": 89,
    "Centrale": 91
  }
}
```

### Rafraîchissement en Temps Réel

**Homepage**:
- Les stats se mettent à jour automatiquement toutes les 30 secondes
- Les graphiques se rafraîchissent sans rechargement de page
- Les animations se déclenchent lors du changement de données

**Page de Vérification**:
- La recherche interroge le serveur en temps réel
- Les résultats affichent les données actuelles
- Les statuts blockchain sont à jour

---

## Déploiement et Liens

### Local Development
```bash
# Terminal 1: Démarrer le serveur
node server.ts
# Output: Server running on http://localhost:3000

# Terminal 2: Ouvrir dans le navigateur
# Homepage: http://localhost:3000/
# Vérification: http://localhost:3000/verify.html
```

### Production (Vercel)
```bash
# Le site est déployé sur Vercel
# URL: https://mbhws.vercel.app/ (ou votre URL)
# Ou: https://chaincacao.vercel.app/

# Les requêtes API se font vers:
# API_URL=https://votre-api-domaine.com/api
```

---

## Flux de Données Complet

```
1. UTILISATEUR VISITE HOMEPAGE
   ↓
2. JavaScript charge assets/js/main.js
   ↓
3. main.js initialise les graphiques Chart.js
   ↓
4. main.js appelle API.getAnalytics()
   ↓
5. Requête GET /api/analytics vers le serveur
   ↓
6. Serveur interroge Firestore
   ↓
7. Serveur retourne les données aggregées
   ↓
8. main.js met à jour les metric cards
   ↓
9. main.js met à jour les graphiques
   ↓
10. CSS animations s'appliquent (slideUp, fadeIn)
    ↓
11. L'utilisateur voit des données en temps réel
    ↓
12. Toutes les 30s, refresh automatique (goto 4)
```

---

## Points Clés pour la Présentation au Jury

### Quand Montrer le Website

1. **Accueil**: Montrer la homepage avec les données en temps réel
2. **Données Visuelles**: Pointer vers les graphiques (régions, statuts)
3. **Credibilité**: "Voici les données actualisées de la plateforme"
4. **Public Trust**: "N'importe qui peut vérifier un lot sans compte"
5. **Transition**: "Cliquez 'Commencer' pour créer un compte et utiliser l'app"

### Script de Présentation

```
"Sur le website, on voit les données en temps réel. 
Ici, 247 lots ont été enregistrés, 1,234 kg au total.

Les graphiques montrent la distribution par région. 
Savanes a le plus de lots, suivi de Kara.

89% des lots ont été collectés ou exportés, c'est du succès!

Maintenant, si je veux vérifier un lot spécifique... 
[Clique sur "Vérifier un lot"]

Je rentre l'ID, et boom, voici l'historique complet du cacao,
du agriculteur jusqu'à la destination finale.

La blockchain le confirme. [Montrer le lien PolygonScan]

C'est ça, la transparence totale du cacao togolais."
```

---

## Support & Maintenance

### Monitoring
- Vérifier les logs du serveur pour les erreurs API
- Vérifier la console du navigateur pour les erreurs JS
- Vérifier que Firebase est accessible

### Mise à Jour des Données
- Les données se rafraîchissent automatiquement
- Pas de cache côté client (sauf brièvement)
- Les changements dans l'app se reflètent dans le website en < 30s

### Troubleshooting

**Q: Les stats ne se mettent pas à jour**
A: Vérifier que le serveur tourne (`node server.ts`)

**Q: "Lot not found" en recherche**
A: Vérifier que le lot existe dans Firestore, vérifier l'ID

**Q: Les animations ne fonctionnent pas**
A: Vérifier que animations.css est chargé, vérifier la console

---

**Version**: 1.0
**Dernière mise à jour**: May 14, 2026
**Status**: Production Ready & Jury Ready
