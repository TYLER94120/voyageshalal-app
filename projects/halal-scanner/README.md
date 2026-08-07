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

### 🔑 Le système de vérifications (`site/verifications.json`) — la vraie valeur ajoutée

Tous les scanners halal *devinent* à partir des ingrédients : ils sortent
« douteux » sur un E471… et ne résolvent rien. HalalCheck distingue ce qu'on
**sait** de ce qu'on **devine** :

- **Analyse indicative** (moteur `halal.js`) : déduction automatique, affichée
  avec le label « à titre indicatif ». C'est ce que font les concurrents.
- **Information vérifiée** (`verifications.json`) : une certitude sourcée —
  certification officielle (AVS, ARGML…) ou réponse écrite du fabricant. Elle
  **prime** sur l'analyse auto, s'affiche avec un sceau doré « ✓ INFORMATION
  VÉRIFIÉE » et sa source, et s'applique **même si le produit est absent
  d'Open Food Facts** (précieux pour les produits maghrébins).

Quand un produit n'est pas vérifié, chaque doute devient **actionnable** : un
bouton « ✉️ Une info sûre sur ce produit ? » ouvre un e-mail pré-rempli vers
`contact@halalcheck.fr`. Tu reçois la réponse, tu la valides, tu l'ajoutes à la
base — et le doute devient une certitude **pour toute la communauté**, une fois
pour toutes. C'est ce capital de vérifications accumulées qui est le moat :
personne ne peut le copier vite, car c'est du travail humain vérifié.

**Ajouter une vérification** : édite `site/verifications.json`, clé =
code-barres :
```json
"3017620422003": {
  "nom": "Nom du produit",
  "statut": "halal",                      // ou "haram"
  "titre": "Confirmé halal par le fabricant",
  "detail": "Ce que la marque a répondu, en clair.",
  "source": "Email service client Ferrero",
  "date": "2026-08"
}
```
> ⚠️ N'ajoute QUE des informations réellement confirmées, toujours avec source
> et date — c'est une *amana*. Supprime l'entrée d'exemple `0000000000000`
> avant l'ouverture publique (tape ce code dans l'app pour voir le rendu vérifié).
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
