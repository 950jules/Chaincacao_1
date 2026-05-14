# ChainCacao - Architecture Finale ✅

## Structure: Website + PWA Integration

### 🌐 Website (`/website`)
**Landing Page** - Static entry point
- URL: `http://localhost:3000/`
- Features: Product info, real-time stats, verification form
- Links: All CTAs point to `/app` (PWA)
- No forms - just information and links

### 📱 PWA (`/public`)
**Full Application** - User-facing app
- URL: `http://localhost:3000/app/`
- Authentication: Built-in signup + login forms
- Roles: Agriculteur, Coopérative, Exportateur, Vérificateur
- Data: Connected to Firebase Firestore
- Blockchain: Connected to Polygon mainnet

---

## User Flow

```
1. User lands on website home page
   ↓
2. Clicks "Commencer maintenant" or "Accéder à l'Application"
   ↓
3. Redirected to /app (PWA)
   ↓
4. If not logged in → Auth screen shows
   - Option to Login (existing user)
   - Option to Register (new user)
   ↓
5. Registration form collects:
   - Role (Agriculteur/Coop/Exportateur/Vérificateur)
   - Name (Nom/Prénom)
   - Location (Région Togo)
   - Cooperative (if applicable)
   - Age, Phone
   ↓
6. User data saved to Firebase Firestore
   ↓
7. User enters PWA with role-based screens:
   - Agriculteur → Récolte form
   - Coopérative → Collecte form
   - Exportateur → Export form
   - Vérificateur → Verification tools
   ↓
8. Each form can submit to Blockchain (Polygon)
```

---

## Backend Integration

### Database: Firebase Firestore
**Config:** `public/js/firebase-init.js`
```javascript
projectId: "gen-lang-client-0846821407"
database: "ai-studio-9f533733-bd79-49db-97ba-3503bcaf4462"
```

**Collections:**
- `users/` - User profiles
- `lots/` - Cacao lots
- `transactions/` - Blockchain records

**Operations:** Handled by `public/js/database.js`
- `saveUser()` - Store user during signup
- `getUser()` - Retrieve user data
- `getLot()` - Fetch lot info
- `saveLot()` - Create new lot

### Blockchain: Polygon Mainnet
**Connection:** `public/js/blockchain.js`
**Contract:** 0xF7d808899F7D529c5f2A2F4637726Bb25B4a26a7
**Model:** Gasless relayer
- Farmers register for free
- Server pays gas fees
- Transactions recorded on-chain

### API Endpoints: Express Server
**Base URL:** `http://localhost:3000`

**Public Endpoints:**
```
GET  /api/health               # Server status
GET  /api/lots                 # List all lots
GET  /api/lot/:id              # Get specific lot
GET  /api/lot/:id/history      # Lot transaction history
GET  /api/analytics            # Real-time stats
```

**Blockchain Endpoints:**
```
GET  /api/blockchain/status/:hash   # Check confirmation
POST /api/blockchain/notarize       # Submit transaction
```

---

## File Organization

```
chaincacao/
├── server.ts                    # Express backend
├── package.json                 # Dependencies
│
├── website/                     # Static landing page
│   ├── index.html              # Home page (links to /app)
│   ├── signup.html             # Redirect to /app (302)
│   ├── verify.html             # Public verification
│   └── assets/
│       ├── css/
│       │   ├── styles.css      # Main styling
│       │   └── animations.css  # Animations
│       └── js/
│           ├── main.js         # Landing logic
│           ├── verify.js       # Verify logic
│           └── api.js          # API calls
│
├── public/                      # PWA Application
│   ├── index.html              # PWA entry point
│   ├── manifest.json           # PWA manifest
│   ├── service-worker.js       # Offline support
│   ├── css/
│   │   ├── style.css          # Main styles
│   │   ├── auth.css           # Auth screens
│   │   ├── agriculteur.css    # Farmer screen
│   │   ├── cooperative.css    # Coop screen
│   │   ├── exportateur.css    # Exporter screen
│   │   └── verificateur.css   # Verifier screen
│   └── js/
│       ├── firebase-init.js   # Firebase config
│       ├── auth.js            # Auth logic (login/signup)
│       ├── database.js        # Firestore operations
│       ├── blockchain.js      # Polygon integration
│       ├── app.js             # Main app logic
│       ├── agriculteur.js     # Farmer module
│       ├── cooperative.js     # Coop module
│       ├── exportateur.js     # Exporter module
│       ├── verificateur.js    # Verifier module
│       ├── utils.js           # Helper functions
│       ├── validation.js      # Form validation
│       ├── gps.js             # GPS/Maps
│       ├── camera.js          # Camera integration
│       ├── qrcode.js          # QR code generation
│       ├── analytics.js       # Data analytics
│       ├── offline.js         # Offline mode
│       ├── theme.js           # Dark/Light theme
│       └── toast.js           # Notifications
```

---

## Signup/Login Flow

### New User (Registration)
1. **Website →** User clicks "Commencer"
2. **Redirect →** Sent to `/app`
3. **Auth Screen →** Shows registration form
4. **Form Fields:**
   - Role selector (4 options)
   - Name & Surname
   - Age, Phone
   - Location (Togo regions)
   - Cooperative (if applicable)
5. **Validation →** Client-side checks via `validation.js`
6. **Save User →** `auth.js` → `database.js` → Firestore
7. **Success →** User logged in, enters PWA

### Existing User (Login)
1. **Website →** User clicks link
2. **Redirect →** Sent to `/app`
3. **Auth Screen →** Shows login form
4. **Fields:**
   - ID (e.g., AGR-90123456)
   - Password
5. **Verify →** Check Firestore
6. **Success →** User enters PWA with role screen

---

## Data Flow Examples

### Example 1: Farmer Creating a Lot
```
1. Farmer logs in via /app
2. Goes to "Récolte" screen (agriculteur.js)
3. Fills out form:
   - Weight, Quality, Location, etc.
4. Clicks "Submit to Blockchain"
5. Data sent to blockchain.js
6. Polygon transaction created (gasless)
7. Hash returned to user
8. Status shown as "⏳ Pending" → "✅ Confirmed"
9. Lot data saved to Firestore
10. Appears on website analytics dashboard
```

### Example 2: Public Verification
```
1. User visits website /verify.html
2. Enters lot ID (e.g., LOT-001)
3. Searches via api.js
4. api.js calls /api/lot/:id endpoint
5. Server returns lot data + blockchain info
6. Timeline shown to user
7. No authentication required
```

### Example 3: Real-Time Analytics
```
1. Website loads index.html
2. Chart.js initialized in main.js
3. api.js fetches /api/analytics
4. Data displayed in charts
5. Auto-refresh every 30 seconds
6. Numbers animate with smooth transitions
```

---

## Security & Permissions

### Firebase Firestore Rules
```
- Users can read/write own data
- Admins can read all
- Public read for lots
- Write only authenticated
```

### Website
- Static content only
- No sensitive data
- Public verification allowed

### PWA
- Authentication required
- Role-based access control
- localStorage for sessions
- Service Worker for offline

### Blockchain
- Public ledger (read-only)
- Gasless transactions (no key exposure)
- Smart contract handles validation

---

## Deployment Checklist

### Backend (server.ts)
- [ ] Set PORT environment variable
- [ ] Configure rate limiting
- [ ] Set up blockchain RPC
- [ ] Firebase credentials

### Website
- [ ] Update domain in links
- [ ] Add CORS headers
- [ ] Enable caching
- [ ] Set up CDN

### PWA
- [ ] Configure Firebase project
- [ ] Add web domain to Firebase
- [ ] Test offline mode
- [ ] Update manifest.json

### SSL/HTTPS
- [ ] Get SSL certificate
- [ ] Redirect HTTP → HTTPS
- [ ] Update manifest URLs

---

## Development vs Production

### Development
```bash
npm start
# Server on http://localhost:3000
# Website: http://localhost:3000
# PWA: http://localhost:3000/app
# Verify: http://localhost:3000/verify.html
```

### Production
```bash
npm run build
npm start
# Server on your domain
# Website: https://your-domain.com
# PWA: https://your-domain.com/app
# Verify: https://your-domain.com/verify.html
```

---

## Key Points

✅ **Single Entry Point:** Website is just a landing page
✅ **No Duplicate Forms:** Only one auth system (in PWA)
✅ **Clean Links:** Website just links to `/app`
✅ **Full Integration:** PWA connected to Firebase + Blockchain
✅ **Role-Based:** Different screens for different users
✅ **Offline-Ready:** Service Worker for offline support
✅ **Mobile-First:** Progressive Web App works on all devices

---

## Testing Checklist

- [ ] Website loads correctly
- [ ] "Commencer" button redirects to /app
- [ ] PWA shows auth screen
- [ ] Registration form works
- [ ] User data saves to Firebase
- [ ] Login works for existing users
- [ ] Role screens display correctly
- [ ] Forms submit to blockchain
- [ ] Public verification page works
- [ ] Analytics dashboard updates
- [ ] Offline mode works
- [ ] Mobile responsive

---

**Status:** ✅ INTEGRATED AND READY
**Last Updated:** May 14, 2026
