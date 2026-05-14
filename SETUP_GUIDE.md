# ChainCacao - Setup & Integration Guide

## ✅ Current Status

### What's Done
- ✅ Website landing page with real-time stats
- ✅ Links redirect to /app (PWA)
- ✅ PWA has complete auth system
- ✅ Firebase Firestore configured
- ✅ Blockchain integration ready
- ✅ Service Worker for offline
- ✅ Role-based screens (4 types)

### What Needs Configuration
- 🔧 Verify Firebase project credentials
- 🔧 Test blockchain transactions
- 🔧 Configure email notifications
- 🔧 Set up APK distribution

---

## 1. Firebase Setup

### Step 1: Verify Credentials
Your Firebase project is already configured in `public/js/firebase-init.js`:
```javascript
projectId: "gen-lang-client-0846821407"
firestoreDatabaseId: "ai-studio-9f533733-bd79-49db-97ba-3503bcaf4462"
```

### Step 2: Check Firestore Collections
In Firebase Console, create these collections:
```
users/
  - id: User ID (AGR-90123456)
  - name, firstname, lastname
  - role (AGR, COOP, EXP, VER)
  - locality, phone
  - createdAt

lots/
  - id: Lot ID (LOT-001)
  - farmer_id, weight, quality
  - location, date
  - blockchain_hash
  - createdAt

transactions/
  - id: Transaction ID
  - lot_id, type (RECORD, COLLECT, EXPORT)
  - user_id, timestamp
  - blockchain_hash
```

### Step 3: Set Firestore Rules
Go to **Firestore > Rules** and set:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Anyone can read lots
    match /lots/{document=**} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
    
    // Transactions (public read)
    match /transactions/{document=**} {
      allow read: if true;
      allow create: if request.auth != null;
    }
  }
}
```

### Step 4: Enable Authentication
In Firebase > Authentication:
- [ ] Enable Email/Password
- [ ] Enable Anonymous (optional)
- [ ] Add authorized domains

---

## 2. Blockchain Setup

### Step 1: Smart Contract
Your contract is deployed:
```
Address: 0xF7d808899F7D529c5f2A2F4637726Bb25B4a26a7
Network: Polygon Mainnet (Chain ID: 137)
ABI: public/js/abi.js
```

### Step 2: Gas Relayer Setup
In `server.ts`, configure:
```javascript
// Private key for gas relayer
const RELAYER_KEY = process.env.RELAYER_PRIVATE_KEY;

// RPC endpoint
const RPC_URL = process.env.POLYGON_RPC_URL;
// Example: https://polygon-rpc.com
```

### Step 3: Environment Variables
Create `.env` file:
```bash
# Blockchain
POLYGON_RPC_URL=https://polygon-rpc.com
RELAYER_PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=0xF7d808899F7D529c5f2A2F4637726Bb25B4a26a7

# Firebase (already in client, but keep for reference)
FIREBASE_PROJECT_ID=gen-lang-client-0846821407
```

### Step 4: Test Transaction
In PWA, try creating a lot:
1. Log in as Agriculteur
2. Fill out "Récolte" form
3. Click "Envoyer à la Blockchain"
4. Should see: "⏳ Pending..." → "✅ Confirmed"

---

## 3. Server API Setup

### Already Configured Endpoints
Your `server.ts` has these working:
```
✅ GET  /api/health
✅ GET  /api/lots
✅ GET  /api/lot/:id
✅ GET  /api/lot/:id/history
✅ GET  /api/analytics
✅ GET  /api/blockchain/status/:hash
✅ POST /api/blockchain/notarize
```

### Test Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Get all lots
curl http://localhost:3000/api/lots

# Get analytics
curl http://localhost:3000/api/analytics
```

---

## 4. PWA Configuration

### Step 1: Manifest
File: `public/manifest.json`
```json
{
  "name": "ChainCacao",
  "short_name": "ChainCacao",
  "start_url": "/app/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#3D1B0B",
  "background_color": "#FFFFFF",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### Step 2: Service Worker
File: `public/service-worker.js`
- Caches static assets
- Enables offline mode
- Updates automatically

### Step 3: Offline Mode
The app works offline:
- Forms are saved locally
- Syncs when connection returns
- See `public/js/offline.js`

---

## 5. Testing Checklist

### Website
```
[ ] http://localhost:3000 loads
[ ] Charts show real-time data
[ ] "Commencer" button redirects to /app
[ ] Verify form works
[ ] Analytics refresh every 30s
[ ] Mobile responsive
```

### PWA - Registration
```
[ ] Registration form shows
[ ] Can select role (4 options)
[ ] Location dropdown works
[ ] Can submit form
[ ] Data saved to Firebase
[ ] User logged in automatically
```

### PWA - Role Screens
```
[ ] Agriculteur screen: Récolte form
[ ] Coopérative screen: Collecte form
[ ] Exportateur screen: Export form
[ ] Vérificateur screen: Verification tools
```

### PWA - Blockchain
```
[ ] Can create lot
[ ] Submit to blockchain button works
[ ] Transaction hash appears
[ ] Status updates: Pending → Confirmed
[ ] Data saved to Firestore
```

### Public Features
```
[ ] /verify.html loads
[ ] Can search lots by ID
[ ] No authentication required
[ ] Shows lot history
[ ] Blockchain confirmation visible
```

---

## 6. Deployment Steps

### Step 1: Server Configuration
```bash
# Set environment variables
export PORT=3000
export POLYGON_RPC_URL=https://polygon-rpc.com
export RELAYER_PRIVATE_KEY=your_key_here
export FIREBASE_PROJECT_ID=gen-lang-client-0846821407

# Start server
npm start
```

### Step 2: Build for Production
```bash
# Build TypeScript
npm run build

# Test production build
npm start
```

### Step 3: Domain Configuration
Update domain in:
- `public/manifest.json`
- `public/js/firebase-init.js`
- `server.ts` CORS settings
- Firebase Console authorized domains

### Step 4: HTTPS Setup
- Get SSL certificate
- Enable HTTPS on server
- Redirect HTTP → HTTPS

### Step 5: Go Live
```bash
# Deploy to your server
git push heroku main
# or
npm run deploy
```

---

## 7. Troubleshooting

### Firebase Connection Issues
**Error:** "Firebase connection failed"
```
Solution:
1. Check firebase-init.js credentials
2. Verify project ID matches
3. Check internet connection
4. Clear browser cache
```

### Blockchain Transaction Fails
**Error:** "Transaction reverted"
```
Solution:
1. Check RPC endpoint working: curl https://polygon-rpc.com
2. Verify relayer has funds
3. Check contract address correct
4. Review transaction gas limits
```

### Forms Not Saving
**Error:** "Firestore write failed"
```
Solution:
1. Check Firestore security rules
2. Verify authentication status
3. Check collection names correct
4. Review user permissions
```

### Offline Mode Not Working
**Error:** "App not loading offline"
```
Solution:
1. Check service-worker.js registered
2. Verify offline.js loaded
3. Check IndexedDB enabled
4. Clear service worker cache
```

---

## 8. Next Steps

### Short Term (1-2 weeks)
- [ ] Configure Firebase project
- [ ] Test blockchain transactions
- [ ] Set up production domain
- [ ] Deploy to production

### Medium Term (1-2 months)
- [ ] Add email notifications
- [ ] Implement push notifications
- [ ] Set up analytics dashboard
- [ ] Create admin panel

### Long Term (3+ months)
- [ ] Build Android APK
- [ ] Submit to Play Store
- [ ] Add more verification methods
- [ ] Integrate with customs systems

---

## 📞 Support Commands

```bash
# View server logs
npm start

# Test API
curl -X GET http://localhost:3000/api/health

# View Firebase data
# Go to: https://console.firebase.google.com

# Clear browser cache
# Dev Tools > Application > Clear Storage

# Reset offline data
# localStorage.removeItem('chaincacao_user')
```

---

**Ready to deploy? Start with step 1: Firebase Setup** ✅
