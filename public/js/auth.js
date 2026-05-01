const auth = {
    currentUser: null,

    async init() {
        console.log("Auth init starting...");
        // Sign in anonymously to satisfy security rules
        try {
            if (window.firebase) {
                await firebase.auth().signInAnonymously();
                console.log("Firebase Auth: Signed in anonymously");
            }
        } catch (e) {
            console.error("Firebase Auth Error (Continuing anyway):", e);
        }

        this.currentUser = JSON.parse(localStorage.getItem('chaincacao_user'));
        if (this.currentUser) {
            console.log("User found in localStorage:", this.currentUser.id);
            app.initUserSession(this.currentUser);
        } else {
            console.log("No user found, showing auth screen");
            this.showAuthScreen();
        }
    },

    showAuthScreen() {
        if (document.getElementById('auth-screen')) return;
        
        const appEl = document.getElementById('app');
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
                    <button id="tab-login" class="active">Connexion</button>
                    <button id="tab-register">Inscription</button>
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
                    <button class="btn btn-primary" id="btn-login-submit">SE CONNECTER</button>
                </div>

                <div id="register-form" class="auth-form hidden">
                    <div class="input-group">
                        <label>Je suis un :</label>
                        <select id="reg-role">
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
                    <div class="input-group">
                        <label>Localité (Togo)</label>
                        <select id="reg-locality">
                            <option value="Agou">Agou</option>
                            <option value="Kpalimé">Kpalimé</option>
                            <option value="Litimé">Litimé</option>
                            <option value="Kpévé">Kpévé</option>
                            <option value="Atakpamé">Atakpamé</option>
                            <option value="Badou">Badou</option>
                            <option value="Amlamé">Amlamé</option>
                        </select>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
                        <div class="input-group">
                            <label>Âge</label>
                            <input type="number" id="reg-age" placeholder="Age">
                        </div>
                        <div class="input-group">
                            <label>Téléphone (Togo)</label>
                            <input type="tel" id="reg-phone" placeholder="90123456">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Mot de passe (min 8 car.)</label>
                        <input type="password" id="reg-pass" placeholder="••••••••">
                    </div>
                    <div class="input-group">
                        <label>Confirmer le mot de passe</label>
                        <input type="password" id="reg-pass-confirm" placeholder="••••••••">
                    </div>
                    <button class="btn btn-primary" id="btn-register-submit" style="margin-top:10px">S'INSCRIRE</button>
                </div>
            </div>
        `;
        document.body.appendChild(authContainer);
        appEl.classList.add('blurred');

        // Attach Event Listeners
        const tLogin = document.getElementById('tab-login');
        const tReg = document.getElementById('tab-register');
        const bLogin = document.getElementById('btn-login-submit');
        const bReg = document.getElementById('btn-register-submit');
        const roleSel = document.getElementById('reg-role');

        if (tLogin) tLogin.onclick = () => this.switchTab('login');
        if (tReg) tReg.onclick = () => this.switchTab('register');
        if (bLogin) bLogin.onclick = () => this.login();
        if (bReg) bReg.onclick = () => this.register();
        if (roleSel) roleSel.onchange = () => this.updatePrefix();
        
        console.log("Auth listeners attached");
    },

    switchTab(tab) {
        document.getElementById('tab-login').classList.toggle('active', tab === 'login');
        document.getElementById('tab-register').classList.toggle('active', tab === 'register');
        document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
        document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
    },

    async login() {
        console.log("Click detected: login");
        const btn = document.getElementById('btn-login-submit');
        if (!btn) return;
        const originalText = btn.innerText;
        
        try {
            console.log("Login attempt...");
            btn.innerText = "CONNEXION...";
            btn.disabled = true;

            const id = document.getElementById('login-id').value.trim();
            const pass = document.getElementById('login-pass').value;

            if (!id || !pass) throw new Error("Veuillez remplir tous les champs");

            const users = await database.getUsers() || [];
            const user = users.find(u => u.id === id && u.password === pass);

            if (user) {
                this.handleSuccess(user);
            } else {
                throw new Error("Identifiant ou mot de passe incorrect");
            }
        } catch (e) {
            console.error("Login Error:", e);
            alert(e.message);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    },

    async register() {
        console.log("Click detected: register");
        const btn = document.getElementById('btn-register-submit');
        if (!btn) return;
        const originalText = btn.innerText;

        try {
            console.log("Register attempt...");
            btn.innerText = "INSCRIPTION...";
            btn.disabled = true;

            const role = document.getElementById('reg-role').value;
            const last = document.getElementById('reg-lastname').value.trim();
            const first = document.getElementById('reg-firstname').value.trim();
            const locality = document.getElementById('reg-locality').value;
            const age = document.getElementById('reg-age').value;
            const phone = document.getElementById('reg-phone').value.trim();
            const pass = document.getElementById('reg-pass').value;
            const passConfirm = document.getElementById('reg-pass-confirm').value;

            if (!last || !first || !phone || !pass) throw new Error("Tous les champs sont obligatoires");
            if (phone.length < 8) throw new Error("Numéro de téléphone invalide (8 chiffres min)");
            if (pass.length < 8) throw new Error("Le mot de passe doit faire au moins 8 caractères");
            if (pass !== passConfirm) throw new Error("Les mots de passe ne correspondent pas");

            const userId = `${role}-${phone}`;
            
            // Check existence
            const allUsers = await database.getUsers() || [];
            if (allUsers.some(u => u.id === userId)) {
                throw new Error("Cet identifiant (téléphone) est déjà utilisé");
            }

            const newUser = {
                id: userId,
                role,
                lastname: last,
                firstname: first,
                locality,
                age,
                phone,
                password: pass,
                createdAt: new Date().toISOString()
            };

            await database.saveUser(newUser);
            alert(`Inscription réussie ! Votre identifiant est : ${userId}`);
            this.handleSuccess(newUser);
        } catch (e) {
            console.error("Register Error:", e);
            alert(e.message);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    },

    handleSuccess(user) {
        this.currentUser = user;
        localStorage.setItem('chaincacao_user', JSON.stringify(user));
        document.getElementById('auth-screen').remove();
        document.getElementById('app').classList.remove('blurred');
        app.initUserSession(user);
    },

    logout() {
        localStorage.removeItem('chaincacao_user');
        location.reload();
    },

    updatePrefix() {
        const role = document.getElementById('reg-role').value;
        const idDisplay = document.querySelector('label[for="reg-phone"]') || { innerText: "" };
        console.log("Role changed to:", role);
    }
};

window.auth = auth;
