# ChainCacao - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install & Run
```bash
npm install
npm start
```
Server will start on `http://localhost:3000`

### 2. Test the Website
- **Landing page:** http://localhost:3000/
- **Signup form:** http://localhost:3000/signup.html
- **Verify lot:** http://localhost:3000/verify.html
- **PWA app:** http://localhost:3000/app/

### 3. Test Form Submission
Open signup form → Fill out fields → Click "S'INSCRIRE" → Watch the magic! ✨

---

## 📁 Quick File Guide

**Making changes?**

| What | Where |
|------|-------|
| Change colors | `website/assets/css/styles.css` (`:root` variables) |
| Add animations | `website/assets/css/animations.css` (@keyframes) |
| Edit signup form | `website/signup.html` |
| Edit landing page | `website/index.html` |
| Update backend API | `server.ts` |
| Change form fields | `website/signup.html` line 200+ |

---

## 🎨 Design System

**Colors:**
- Primary: `#3D1B0B` (cacao brown)
- Success: `#2D5A27` (green)
- Warning: `#D35400` (orange)
- Dark BG: `#1a1a1a`

**Animations:**
- Fast: `0.3s` (hovers, transitions)
- Medium: `0.6s-0.8s` (entrance effects)
- Slow: `1.5s+` (complex animations)

---

## 🔌 API Endpoints

```javascript
// Get all lots
GET /api/lots

// Get specific lot
GET /api/lot/:id

// Get lot history
GET /api/lot/:id/history

// Get analytics
GET /api/analytics

// Check blockchain status
GET /api/blockchain/status/:hash

// Submit blockchain transaction
POST /api/blockchain/notarize
```

---

## 🛠️ Common Tasks

### Change signup button text
Edit `website/signup.html` line ~475:
```html
<button type="submit" class="submit-btn">Créer mon Compte</button>
```

### Add a new form field
1. Add input in `website/signup.html` signup form
2. Style in `website/assets/css/styles.css`
3. Add animation delay (see other fields)
4. Update JavaScript to capture the data

### Update animation speed
In `website/assets/css/animations.css`, change `duration`:
```css
@keyframes slideUp {
    /* Increase from 0.7s to 1s */
}
```

### Change color scheme
In `website/assets/css/styles.css`, update `:root`:
```css
:root {
    --primary: #NEW_COLOR;
    --success: #NEW_COLOR;
    /* etc */
}
```

---

## 📱 Responsive Breakpoints

- **Desktop:** 1200px+
- **Tablet:** 768px - 1199px
- **Mobile:** < 768px

Changes live at media queries in CSS files.

---

## 🚨 Troubleshooting

**Charts not showing?**
- Check `/api/analytics` endpoint
- Verify Firebase connection
- Check browser console for errors

**Animations janky?**
- Check for `will-change` abuse
- Use `transform` and `opacity` only
- Test on mobile with DevTools throttling

**Form not submitting?**
- Check browser console for errors
- Verify all required fields filled
- Check server logs

**Server won't start?**
- Check port 3000 is available
- Verify Node.js installed (`node --version`)
- Check for syntax errors in `server.ts`

---

## 📚 Documentation Files

- **DEPLOYMENT_READY.md** - Full production guide
- **README.md** - Project overview
- **security_spec.md** - Security specifications

---

## ✅ Before Deploy

- [ ] Test form submission
- [ ] Verify animations on mobile
- [ ] Check all links work
- [ ] Test responsive design
- [ ] Run `npm build` successfully
- [ ] Set up Firebase credentials
- [ ] Add CORS origins
- [ ] Update domain in code
- [ ] Test on production domain
- [ ] Enable HTTPS

---

## 🎯 Key Performance Targets

- Page load: < 2s
- Animations: 60 FPS
- API response: < 300ms
- Lighthouse: 90+ desktop

---

## 📞 Support

**Error in console?**
1. Check browser DevTools Console tab
2. Search error message in codebase
3. Check corresponding file guide above
4. Review DEPLOYMENT_READY.md troubleshooting

**Need to change something?**
1. Find the file in Quick File Guide above
2. Make the change
3. Refresh browser
4. Verify it works

---

**Ready to build? Start with:**
```bash
npm start
# Then visit http://localhost:3000
```

Good luck! 🍫🌱
