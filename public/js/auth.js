const auth = {
    currentUser: null,

    async init() {
        this.currentUser = JSON.parse(localStorage.getItem('chaincacao_user'));
        if (this.currentUser) {
            app.initUserSession(this.currentUser);
        } else {
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
        document.getElementById('tab-login').onclick = () => this.switchTab('login');
        document.getElementById('tab-register').onclick = () => this.switchTab('register');
        document.getElementById('btn-login-submit').onclick = () => this.login();
        document.getElementById('btn-register-submit').onclick = () => this.register();
        document.getElementById('reg-role').onchange = () => this.updatePrefix();
    },

    switchTab(tab) {
        document.getElementById('tab-login').classList.toggle('active', tab === 'login');
        document.getElementById('tab-register').classList.toggle('active', tab === 'register');
        document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
        document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
    },

    async login() {
        console.log("Login attempt...");
        const id = document.getElementById('login-id').value;
        const pass = document.getElementById('login-pass').value;

        const users = await database.getUsers() || [];
        const user = users.find(u => u.id === id && u.password === pass);

        if (user) {
            this.handleSuccess(user);
        } else {
            alert("Identifiant ou mot de passe incorrect");
        }
    },

    async register() {
        console.log("Register attempt...");
        const role = document.getElementById('reg-role').value;
        const last = document.getElementById('reg-lastname').value;
        const first = document.getElementById('reg-firstname').value;
        const locality = document.getElementById('reg-locality').value;
        const age = document.getElementById('reg-age').value;
        const phone = document.getElementById('reg-phone').value;
        const pass = document.getElementById('reg-pass').value;
        const passConfirm = document.getElementById('reg-pass-confirm').value;

        if (!phone || phone.length < 8) return alert("Numéro de téléphone invalide");
        if (pass.length < 8) return alert("Le mot de passe doit faire au moins 8 caractères");
        if (pass !== passConfirm) return alert("Les mots de passe ne correspondent pas");

        const userId = `${role}-${phone}`;
        const newUser = {
            id: userId,
            role,
            lastname: last,
            firstname: first,
            locality,
            age,
            phone,
            password: pass
        };

        await database.saveUser(newUser);
        alert(`Inscription réussie ! Votre identifiant est : ${userId}`);
        this.handleSuccess(newUser);
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
