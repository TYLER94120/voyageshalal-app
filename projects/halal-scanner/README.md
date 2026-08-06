# HalalCheck ✓ — le Yuka du halal

Scanne le code-barres d'un produit → verdict immédiat : **HALAL / DOUTEUX / HARAM / INCONNU**, avec la liste des ingrédients à risque et pourquoi.

Pousse n°2 de l'écosystème halal (stratégie arrosoir — voir `docs/PORTFOLIO.md` à la racine du repo).

## Comment ça marche

1. L'utilisateur scanne un code-barres (ou le saisit à la main).
2. L'app interroge **Open Food Facts** (base alimentaire mondiale, gratuite, sans clé API).
3. Le moteur `lib/halal.ts` analyse ingrédients + additifs :
   - additifs à risque (E120, E441, E471, E904…) avec explication,
   - mots-clés haram (porc, alcool…) et douteux (gélatine, présure, viande non certifiée…),
   - raccourcis : label **halal** → certifié · label **végane** → risques d'origine animale écartés.
4. Verdict affiché en badge géant coloré + historique local des 20 derniers scans.

## Produit v0 : la web app (`site/`) — SITE-FIRST

Décision : on lance d'abord **halalcheck.fr en web app** (pas de stores à convaincre,
mises à jour instantanées, partage par lien). Le dossier `site/` contient :

- `index.html` — la page d'accueil / argumentaire
- `scan.html` — **le scanner** : caméra dans le navigateur (API BarcodeDetector,
  repli ZXing pour Safari/iPhone), saisie manuelle, verdict, historique
- `halal.js` — le moteur compilé depuis `lib/halal.ts` (**ne pas éditer à la main** :
  modifier `lib/halal.ts` puis `npm run build:site`)
- `manifest.json` + `sw.js` + icônes — installable sur l'écran d'accueil comme une app

**Tester en local** : `python3 -m http.server 8000 --directory site` puis ouvrir
http://localhost:8000 (la caméra exige HTTPS ou localhost).
**Déployer** : glisser le dossier `site/` sur Netlify Drop (ou `vercel site/`),
puis pointer le domaine halalcheck.fr dessus.

## Lancer l'app mobile (phase 2 — même moteur)

```bash
cd projects/halal-scanner
npm install
npx expo start
```

Scanne le QR code avec Expo Go (Android/iOS). La caméra ne fonctionne pas dans le
navigateur — utilise la saisie manuelle du code-barres pour tester sur le web
(ex : `3017620422003`).

## Identité

- **Nom** : HalalCheck — domaine **halalcheck.fr** (libre au dernier pointage, à enregistrer).
- Palette VoyagesHalal (nuit/forêt/or/crème) : cohérence visuelle de l'écosystème.
- Design : règles de la skill VoyagesHalal (boutons ≥ 56 px, texte ≥ 16 px, 1 action par écran).

## Métriques de décision (fenêtre 8–12 semaines)

- Scans par utilisateur et par semaine (usage réel).
- Rétention à 7 jours.
- Si ça décolle → détacher dans son propre repo + compte pro + stores.

## Prochaines étapes

- [ ] Photos de produits manquants → contribution Open Food Facts.
- [ ] Signalement d'erreur par les utilisateurs (bouton "Signaler").
- [ ] Mode hors-ligne (cache des derniers produits).
- [ ] Lien croisé écosystème : "En voyage ? → VoyagesHalal".

> ⚠️ L'analyse est indicative et ne remplace ni la certification (AVS, ARGML…) ni un avis religieux.
