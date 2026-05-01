# ChainCacao - Mode Démo Automatique

Cette application inclut un moteur de démonstration permettant de simuler tout le cycle de vie d'un lot de cacao en quelques secondes.

## Comment lancer la démo ?

Pour activer le mode démo, ajoutez le paramètre `?demo=true` à l'URL de l'application :
`https://votre-app.url/?demo=true`

## Fonctionnalités du Mode Démo

- **Bouton Flottant** : Un bouton "LANCER LA DÉMO" apparaît en bas à droite.
- **Barre de Contrôle** : Permet de mettre en pause, réinitialiser ou changer la vitesse (x1, x2, x4).
- **Scénario Automatisé** :
    1. **Agriculteur** : Création d'un lot (75kg, Kpévé) avec GPS et Photo.
    2. **Coopérative** : Pesée officielle (74.2kg) et scellage blockchain.
    3. **Exportateur** : Contrôle de conformité EUDR et mise en container.
    4. **Vérificateur** : Audit complet de la traçabilité et génération PDF.

## Traçabilité Blockchain (Simulée)

Chaque étape de la démo génère un hash de transaction et un numéro de bloc sur le réseau **Polygon**, consultable via les fiches de traçabilité.

## Installation PWA

L'application détecte si elle peut être installée et affiche un bouton **"INSTALLER"** dans l'en-tête sur les navigateurs compatibles (Chrome Android notamment).

---
© 2026 ChainCacao v2 - Traçabilité Transparente.
