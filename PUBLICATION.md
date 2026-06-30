# Guide de publication — VoyagesHalal

Ce guide explique, pas à pas, comment **tester l'app sur un vrai téléphone** puis
la **publier sur le Google Play Store** (et plus tard l'App Store iOS), à partir
de zéro.

> Tu n'as rien à coder ici — ce sont des commandes à copier-coller et des étapes
> dans des sites web.

---

## Étape 0 — Prérequis (une seule fois)

1. **Un compte Expo** (gratuit) : https://expo.dev → « Sign up ».
2. **Node.js** installé (tu l'as déjà).
3. Installer l'outil EAS dans le terminal :
   ```
   npm install -g eas-cli
   ```
4. Se connecter :
   ```
   eas login
   ```

---

## Étape 1 — Lier le projet à EAS (une seule fois)

Dans le dossier du projet :
```
eas init
```
→ ça crée/relie un projet sur ton compte Expo (accepte les valeurs proposées).
Le fichier `eas.json` est déjà prêt dans le projet.

---

## Étape 2 — Tester un VRAI build sur ton téléphone (APK)

Avant de publier, on génère un **APK** installable directement (sans Expo Go,
donc plus fidèle au résultat final) :
```
eas build --platform android --profile preview
```
- Ça compile sur les serveurs d'Expo (~10-20 min).
- À la fin, tu reçois un **lien** : ouvre-le sur ton téléphone Android, télécharge
  l'APK, installe-le. **C'est la vraie app.**
- 👉 **Teste tout ici** : géoloc, carte, fiches villes, favoris, prière, hors-ligne.
  Idéalement sur un téléphone **dont l'écran n'est pas cassé** 🙂.

---

## Étape 3 — Build de production (AAB pour le Play Store)

Quand le test APK est bon :
```
eas build --platform android --profile production
```
→ génère un fichier **.aab** (format exigé par le Play Store). Garde le lien.

---

## Étape 4 — Compte Google Play (une seule fois)

1. Va sur **https://play.google.com/console**
2. Crée un compte développeur : **frais uniques de 25 $**.
3. Vérifie ton identité (Google demande une pièce + parfois une adresse).

---

## Étape 5 — Créer la fiche de l'app

Dans la Play Console → **Créer une application**, puis remplis :

- **Nom** : VoyagesHalal
- **Description courte** et **longue** : voir le fichier `STORE_LISTING.md`
- **Icône** : `assets/images/icon.png` (512×512 attendu — Expo la génère, sinon
  redimensionne)
- **Image de présentation (feature graphic)** : 1024×500 (à créer, ou je peux t'en
  générer une)
- **Captures d'écran** : au moins 2 (prends-les sur ton téléphone : accueil,
  fiche ville, prière…)
- **Politique de confidentialité (URL)** : **obligatoire**. Héberge le fichier
  `PRIVACY.md` (voir Étape 6) et colle l'adresse ici.
- **Catégorie** : Voyage et infos locales
- **Questionnaire « Sécurité des données »** : déclare que tu utilises la
  *position* (utilisée mais non collectée/partagée), pas de compte, pas de
  partage publicitaire. Le contenu de `PRIVACY.md` te donne toutes les réponses.
- **Classification du contenu** : remplis le questionnaire (tout public).

---

## Étape 6 — Héberger la politique de confidentialité

Le Play Store exige une **URL publique**. Options simples :

- **GitHub Pages** (gratuit) : pousse `PRIVACY.md` dans un repo, active Pages.
- **Le site voyageshalal.fr** : demande au dev web d'ajouter une page
  `/confidentialite` avec le contenu de `PRIVACY.md`. ← le plus propre.

Puis colle cette URL dans la fiche Play.

---

## Étape 7 — Envoyer l'app

Deux possibilités :

**A. Automatique (recommandé)** — laisse EAS envoyer le build :
```
eas submit --platform android --profile production
```
(la première fois, il te guidera pour connecter ton compte Play via une clé de
service ; suis les instructions affichées).

**B. Manuelle** — dans la Play Console, crée une **release** (test interne d'abord,
puis production) et **téléverse le .aab** téléchargé à l'Étape 3.

> Conseil : commence par un **test interne** (toi + quelques proches) avant la
> production. Ça permet de corriger sans pression.

---

## Étape 8 — iOS (plus tard)

L'app est déjà compatible iOS. Pour publier sur l'App Store :
1. **Compte Apple Developer** : 99 $/an (https://developer.apple.com).
2. Build : `eas build --platform ios --profile production`.
3. Test via **TestFlight**, puis soumission via **App Store Connect** (mêmes
   éléments : description, captures, politique de confidentialité).

---

## Récapitulatif des fichiers fournis

| Fichier | Rôle |
|---|---|
| `eas.json` | Profils de build (preview APK, production AAB) — **déjà prêt** |
| `PRIVACY.md` | Politique de confidentialité à héberger (URL obligatoire) |
| `STORE_LISTING.md` | Textes prêts à coller dans la fiche du store |
| `app.json` | Nom, icône, splash, permissions — **déjà configuré** |

## Ordre conseillé

1. `eas login` → `eas init`
2. `eas build -p android --profile preview` → **teste l'APK sur un vrai téléphone**
3. Corrige ce qui cloche, recommence si besoin
4. Héberge `PRIVACY.md` (obtiens l'URL)
5. `eas build -p android --profile production`
6. Crée la fiche Play + remplis tout (textes dans `STORE_LISTING.md`)
7. `eas submit -p android --profile production`

Besoin d'aide à n'importe quelle étape ? Dis-moi où tu bloques, je t'accompagne.
