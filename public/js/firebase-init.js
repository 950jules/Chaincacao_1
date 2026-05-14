// Configuration Firebase pour le mode compatibilité (Navigateurs et PWA)
const firebaseConfig = {
    projectId: "gen-lang-client-0846821407",
    appId: "1:692923259240:web:ab1f1cb49bbb19b8d81edd",
    apiKey: "AIzaSyCIuyy15SbpaSLmy1s8ntz-WlOqaQ4PwvA",
    authDomain: "gen-lang-client-0846821407.firebaseapp.com",
    storageBucket: "gen-lang-client-0846821407.firebasestorage.app",
    messagingSenderId: "692923259240"
};

// Initialisation globale pour que auth.js et database.js puissent l'utiliser sans import
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

window.firebaseAuth = firebase.auth();
window.firebaseDB = firebase.firestore();

// Firebase Cloud par défaut. Les émulateurs ne sont plus utilisés dans cette build.
const useEmulator = false;

if (useEmulator) {
    try {
        window.firebaseDB.useEmulator("localhost", 8081);
        window.firebaseAuth.useEmulator("http://localhost:9098", { disableWarnings: true });
        console.log("✅ Firebase SDK (Compat) - Connecté aux émulateurs locaux (ports 8081/9098)");
    } catch (error) {
        console.warn("Émulateurs non disponibles, utilisant Firebase Cloud:", error.message);
    }
} else {
    console.log("✅ Firebase SDK (Compat) - Mode Firebase Cloud");
}

