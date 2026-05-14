const auth = {
    currentUser: null,

    async withTimeout(promise, ms, label) {
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(label || 'timeout')), ms);
        });

        try {
            return await Promise.race([promise, timeoutPromise]);
        } finally {
            clearTimeout(timeoutId);
        }
    },

    deriveRole(id, fallbackRole = '') {
        const normalizedFallback = (fallbackRole || '').toString().toUpperCase();
        if (['AGR', 'COOP', 'EXP', 'VER'].includes(normalizedFallback)) {
            return normalizedFallback;
        }

        const prefix = (id || '').toString().split('-')[0].toUpperCase();
        if (['AGR', 'COOP', 'EXP', 'VER'].includes(prefix)) {
            return prefix;
        }

        return '';
    },

    buildSessionUser(data = {}, id = '') {
        const resolvedId = (data.id || id || '').toString().trim();
        const resolvedRole = this.deriveRole(resolvedId, data.role);

        return {
            ...data,
            id: resolvedId,
            role: resolvedRole,
            firstname: data.firstname || data.name || resolvedId,
            lastname: data.lastname || '',
        };
    },

    async init() {
        console.log("Auth initializing...");
        if (typeof firebase === 'undefined') {
            console.warn("Firebase not ready, retrying in 100ms...");
            setTimeout(() => this.init(), 100);
            return;
        }

        if (this.currentUser) {
            console.log('Auth.init: currentUser already set, skipping auth screen.');
            return;
        }

        const savedUser = JSON.parse(localStorage.getItem('chaincacao_user'));
        if (savedUser) {
            const cachedUser = this.buildSessionUser(savedUser, savedUser.id);
            // Retry fetching profile a few times before showing auth screen
            let profile = null;
            const maxAttempts = 6;
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    profile = await database.getUser(cachedUser.id);
                    if (profile) break;
                } catch (err) {
                    console.warn('Auth.init: error fetching profile, attempt', attempt, err);
                }
                console.log(`Auth.init: profile not found for ${cachedUser.id}, retry ${attempt}/${maxAttempts}`);
                // small delay
                await new Promise(r => setTimeout(r, 500));
            }

            if (profile) {
                this.handleSuccess(this.buildSessionUser(profile, cachedUser.id));
                return;
            }
            console.warn('Auth.init: profile still missing after retries, using cached session fallback.');
            this.handleSuccess(cachedUser);
        } else {
            this.showAuthScreen();
        }
    },

    showAuthScreen() {
        console.log("Showing Auth Screen...");
        if (document.getElementById('auth-screen')) return;
        
        const appEl = document.getElementById('app');
        if (!appEl) return;

        const authContainer = document.createElement('div');
        authContainer.id = 'auth-screen';
        authContainer.innerHTML = `
            <div class="auth-card">
                <div class="auth-header">
                    <div class="logo-box">C</div>
                    <h1>ChainCacao</h1>
                    <p>Système de Traçabilité Togolais</p>
                </div>
                
                <div class="auth-tabs">
                    <button id="tab-login" class="active" onclick="auth.switchTab('login')">Connexion</button>
                    <button id="tab-register" onclick="auth.switchTab('register')">Inscription</button>
                </div>

                <div id="login-form" class="auth-form">
                    <div class="input-group">
                        <label>Identifiant (ex: AGR-90123456)</label>
                        <input type="text" id="login-id" placeholder="VOTRE-ID">
                    </div>
                    <div class="input-group">
                        <label>Mot de passe</label>
                        <input type="password" id="login-pass" placeholder="••••••••">
                    </div>
                    <button class="btn btn-primary" onclick="auth.login()">SE CONNECTER</button>
                </div>

                <div id="register-form" class="auth-form hidden">
                    <div class="input-group">
                        <label>Je suis un :</label>
                        <select id="reg-role" onchange="auth.toggleVerifierFields()">
                            <option value="AGR">Agriculteur</option>
                            <option value="COOP">Coopérative</option>
                            <option value="EXP">Exportateur</option>
                            <option value="VER">Vérificateur</option>
                        </select>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
                        <div class="input-group">
                            <label>Nom</label>
                            <input type="text" id="reg-lastname" placeholder="Nom">
                        </div>
                        <div class="input-group">
                            <label>Prénom</label>
                            <input type="text" id="reg-firstname" placeholder="Prénom">
                        </div>
                    </div>
                    <div class="input-group" id="locality-group">
                        <label>Localité</label>
                        <select id="reg-locality">
                            <option value="Kpalimé">Kpalimé</option>
                            <option value="Agou">Agou</option>
                        </select>
                    </div>
                    <div id="coop-select-group" class="input-group">
                        <label>Votre coopérative</label>
                        <select id="reg-coop-select">
                            <option value="COOP-KPALIME">COOP-KPALIME</option>
                            <option value="COOP-AGOU">COOP-AGOU</option>
                        </select>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
                        <div class="input-group">
                            <label>Âge</label>
                            <input type="number" id="reg-age" placeholder="35">
                        </div>
                        <div class="input-group">
                            <label>Mobile (+228)</label>
                            <input type="tel" id="reg-phone" placeholder="90123456">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Mot de passe (min 6 car.)</label>
                        <input type="password" id="reg-pass" placeholder="••••••••">
                    </div>
                    <div class="input-group">
                        <label>Confirmer</label>
                        <input type="password" id="reg-pass-confirm" placeholder="••••••••">
                    </div>
                    <button id="btn-register" class="btn btn-primary" onclick="auth.register()">S'INSCRIRE</button>
                </div>
            </div>
        `;
        document.body.appendChild(authContainer);
        appEl.classList.add('blurred');
    },

    switchTab(tab) {
        document.getElementById('tab-login').classList.toggle('active', tab === 'login');
        document.getElementById('tab-register').classList.toggle('active', tab === 'register');
        document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
        document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
    },

    toggleVerifierFields() {
        const role = document.getElementById('reg-role').value;
        const locGroup = document.getElementById('locality-group');
        const coopSelectGroup = document.getElementById('coop-select-group');
        
        locGroup.style.display = (role === 'VER') ? 'none' : 'block';
        coopSelectGroup.style.display = (role === 'AGR') ? 'block' : 'none';
    },

    async login() {
        const id = document.getElementById('login-id').value.toUpperCase().trim();
        const pass = document.getElementById('login-pass').value;

        if (!id || !pass) return window.showToast("Remplissez tous les champs", "warning");

        const email = `${id.toLowerCase()}@chaincacao.tg`;

        try {
            window.showToast("Connexion...", "info");
            if (typeof firebase !== 'undefined') {
                try {
                    const authResult = await this.withTimeout(
                        firebase.auth().signInWithEmailAndPassword(email, pass),
                        5000,
                        'auth-login-timeout'
                    );
                    console.log("Firebase Auth success:", authResult.user.email);
                } catch (authError) {
                    console.warn('Firebase Auth login fallback:', authError.message);
                }
                
                // Wait for Firestore to be ready (Firebase sync may take a moment)
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                throw new Error("Firebase not available");
            }
            
            const user = await database.getUser(id);
            if (user) {
                const sessionUser = this.buildSessionUser(user, id);
                window.showToast(`Bienvenue ${sessionUser.firstname}!`, "success");
                this.handleSuccess(sessionUser);
            } else {
                const fallbackUser = this.buildSessionUser({ id, role: this.deriveRole(id) }, id);
                window.showToast("Profil introuvable, ouverture du rôle détecté", "warning");
                this.handleSuccess(fallbackUser);
            }
        } catch (e) {
            console.error("Login error:", e);
            const fallbackUser = this.buildSessionUser({ id, role: this.deriveRole(id) }, id);
            if (fallbackUser.role) {
                window.showToast("Connexion cloud indisponible, ouverture du rôle détecté", "warning");
                this.handleSuccess(fallbackUser);
                return;
            }
            window.showToast("Identifiant ou mot de passe incorrect", "error");
        }
    },

    async register() {
        const registerBtn = document.getElementById('btn-register');
        if (registerBtn) registerBtn.disabled = true;

        try {
            const role = document.getElementById('reg-role').value;
            const last = document.getElementById('reg-lastname').value.trim();
            const first = document.getElementById('reg-firstname').value.trim();
            const age = document.getElementById('reg-age').value;
            const phone = document.getElementById('reg-phone').value.trim();
            const pass = document.getElementById('reg-pass').value;
            const passConfirm = document.getElementById('reg-pass-confirm').value;
            const loc = (role === 'VER') ? 'Global' : document.getElementById('reg-locality').value;

            let coop = null;
            if (role === 'AGR') {
                coop = document.getElementById('reg-coop-select').value;
            }

            if (!last || !first || !phone) {
                window.showToast("Champs requis manquants", "warning");
                return;
            }
            if (phone.length < 8) {
                window.showToast("Téléphone invalide", "warning");
                return;
            }
            if (pass.length < 6) {
                window.showToast("Mot de passe: min 6 caractères", "warning");
                return;
            }
            if (pass !== passConfirm) {
                window.showToast("Mots de passe non identiques", "warning");
                return;
            }

            const userId = `${role}-${phone}`;
            const email = `${userId.toLowerCase()}@chaincacao.tg`;

            window.showToast("Création du compte...", "info");

            const sessionUser = this.buildSessionUser({
                id: userId,
                role,
                lastname: last,
                firstname: first,
                locality: loc,
                cooperative: coop,
                age,
                phone,
                createdAt: new Date().toISOString()
            }, userId);

            // Open the role interface immediately so the UI stays usable even
            // if cloud auth/firestore are slow or unavailable.
            this.handleSuccess(sessionUser);

            void (async () => {
                try {
                    if (typeof firebase !== 'undefined') {
                        try {
                            await this.withTimeout(
                                firebase.auth().createUserWithEmailAndPassword(email, pass),
                                5000,
                                'auth-register-timeout'
                            );
                        } catch (authError) {
                            console.warn('Firebase Auth register fallback:', authError.message);
                        }
                    }

                    if (typeof database !== 'undefined') {
                        try {
                            await database.saveUser(sessionUser);
                        } catch (err) {
                            console.warn('Firestore save failed (non-fatal):', err);
                        }
                    }
                } catch (backgroundError) {
                    console.warn('Background cloud sync failed:', backgroundError);
                }
            })();

            window.showToast(`Bienvenue ${first}!`, "success");
        } catch (e) {
            console.error("Register error:", e);

            if (e && e.code === 'auth/email-already-in-use') {
                window.showToast("Compte déjà créé, tentative de connexion...", "info");
                try {
                    const role = document.getElementById('reg-role').value;
                    const phone = document.getElementById('reg-phone').value.trim();
                    const userId = `${role}-${phone}`;
                    const email = `${userId.toLowerCase()}@chaincacao.tg`;
                    const pass = document.getElementById('reg-pass').value;

                    await firebase.auth().signInWithEmailAndPassword(email, pass);
                    await new Promise(r => setTimeout(r, 400));

                    const existing = await database.getUser(userId);
                    if (existing) {
                        const sessionUser = this.buildSessionUser(existing, userId);
                        window.showToast(`Bienvenue ${sessionUser.firstname || ''}!`, "success");
                        this.handleSuccess(sessionUser);
                    } else {
                        const fallbackUser = this.buildSessionUser({ id: userId, role }, userId);
                        window.showToast("Compte existant mais profil introuvable, ouverture du rôle détecté", "warning");
                        this.handleSuccess(fallbackUser);
                    }
                } catch (signinErr) {
                    console.error('Signin fallback failed:', signinErr);
                    window.showToast("Compte déjà créé — utilisez la connexion", "error");
                }
            } else {
                window.showToast("Erreur d'inscription", "error");
            }
        } finally {
            if (registerBtn) registerBtn.disabled = false;
        }
    },

    handleSuccess(user) {
        // Ensure role field is normalized
        user.role = (user.role || '').toString().toUpperCase();
        this.currentUser = user;
        localStorage.setItem('chaincacao_user', JSON.stringify(user));

        // Remove any existing auth overlays reliably
        const screen = document.getElementById('auth-screen');
        if (screen) screen.remove();
        // also remove elements by class in case of duplicates
        document.querySelectorAll('.auth-overlay, #auth-screen').forEach(el => el.remove());

        const appEl = document.getElementById('app');
        if (appEl) appEl.classList.remove('blurred');

        const display = document.getElementById('user-id-display');
        if (display) display.innerText = `${user.firstname || ''} (${user.id})`;

        // Ensure `app` is ready before initializing the user session
        if (typeof app !== 'undefined' && typeof app.initUserSession === 'function') {
            app.initUserSession(user);
        } else {
            // Retry shortly if app not yet available
            setTimeout(() => {
                if (typeof app !== 'undefined' && typeof app.initUserSession === 'function') {
                    app.initUserSession(user);
                }
            }, 200);
        }
    },

    async logout() {
        localStorage.removeItem('chaincacao_user');
        location.reload();
    }
};

window.auth = auth;
