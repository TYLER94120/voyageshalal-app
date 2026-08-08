# Stratégie Arrosoir — Écosystème Halal

> Plusieurs pousses en parallèle. Celle qui monte reçoit l'eau.
> Toutes partagent le même terreau : audience musulmane francophone, palette
> visuelle commune, et à terme un compte utilisateur + une base de données uniques.

## 🎯 DÉCISION (6 août 2026) : focus total sur HalalCheck

Décision fondateur : **100 % de l'eau va à HalalCheck** (le scanner halal).
- VoyagesHalal : reste en ligne, zéro développement actif (hub à réactiver plus tard).
- Boutique Malika Paris : **gelée** — le code est conservé dans `projects/boutique-modeste/`
  et redeployable en 2 minutes, mais aucun temps n'y est investi.
- ⚠️ Naming : ne jamais utiliser « Yuka » dans le nom public (marque déposée).
  Le nom officiel est **HalalCheck** — domaine **halalcheck.fr acheté ✓**.
- **Site-first (décision du 6 août)** : lancement en web app sur halalcheck.fr —
  scan caméra dans le navigateur + « Ajouter à l'écran d'accueil » — pour valider
  sans passer par les stores (99 $/an Apple, 25 $ Google, délais de review).
  L'app native Expo reste dans le repo et partage le même moteur : build stores
  dès que la traction web le justifie.

## 🧭 CAP PRODUIT (8 août 2026) : « Yuka version halal »

Décision du fondateur, à respecter dans toutes les sessions :

> « On ne fera pas mieux qu'un site avec des années d'historique et des moyens
> énormes. Ne réinventons pas la roue : **inspirons-nous d'eux**, donnons autant
> de détails qu'eux. Faire la même chose, en version halal, serait déjà énorme. »

Concrètement, avant de concevoir quoi que ce soit : **regarder comment le
leader du secteur traite le problème, puis le transposer au halal.** Ne pas
inventer une mécanique nouvelle quand une mécanique éprouvée existe.

### Ce qu'ils font — et où on en est

| Leur mécanique | Chez nous | État |
|---|---|---|
| Fiche produit claire, photo en grand, interface aérée | Interface claire, cartes blanches | ✅ fait |
| Chaque ingrédient noté, le reste replié | Composition détaillée 🔴🟠🟢 | ✅ fait |
| Alternatives meilleures dans le même rayon | Section « À la place » | ✅ fait |
| Fiche explicative par ingrédient | Lien vers les fiches HalalGPT | 🟡 partiel (additifs seulement) |
| Historique des scans consultable | Historique + « Mes produits validés » | ✅ fait |
| Cosmétiques en plus de l'alimentaire | — | ❌ à faire (Open Beauty Facts) |
| Fonctionne hors-ligne | Cache des pages et des bases | 🟡 partiel |
| Statistiques personnelles, suivi dans le temps | — | ❌ à faire |
| Base de produits massive | Open Food Facts + base locale Maghreb | 🟡 en construction |

### La seule chose qu'on ne copie PAS : le score sur 100

Leur note continue convient à la nutrition (un produit peut être « moyennement »
bon). Le halal ne fonctionne pas ainsi : un produit contenant de la gélatine
porcine n'est pas « 39/100 », il est **interdit**. Inventer une note serait
contraire à la règle d'honnêteté n°3 de la charte. Notre échelle à quatre états
(halal · douteux · haram · inconnu) est le bon équivalent — tout le reste de
leur savoir-faire est à prendre.

## Les 3 pousses actuelles

| # | Projet | Dossier | C'est quoi | Usage visé |
|---|--------|---------|------------|-----------|
| 1 | **VoyagesHalal** (hub) | racine du repo | Guide de voyage halal : carte 1-clic, prière, qibla, HalalScore | Hebdomadaire + pics vacances |
| 2 | **HalalCheck** | `projects/halal-scanner/` | Scan de code-barres → verdict halal/douteux/haram (le "Yuka du halal") | **Quotidien** (courses) |
| 3 | **Malika ✦ Paris** | `projects/boutique-modeste/` | Boutique mode modeste, panier + commande WhatsApp | Achat ponctuel, marge directe |

## La règle de décision (à ne pas négocier avec soi-même)

- Chaque pousse a **8 à 12 semaines** pour montrer UNE métrique d'usage réel :
  - VoyagesHalal : visiteurs organiques hebdo + retours 7 jours
  - HalalCheck : scans / utilisateur / semaine + rétention J7
  - Malika Paris : commandes WhatsApp / semaine + taux d'ajout panier
- À la fin de la fenêtre : **la meilleure pousse reçoit 80 % du temps** le trimestre
  suivant. Les autres passent en pilote automatique (elles restent en ligne, redirigent
  leur trafic vers la gagnante, et continuent d'alimenter la base commune).
- Pari initial : HalalCheck a l'avantage structurel (usage quotidien → peut promouvoir
  gratuitement toutes les autres pousses).

## L'inertie entre les pousses (ce qui fait "écosystème")

1. **Palette commune** nuit `#0B1A0F` / forêt `#1B4332` / or `#C9A84C` / crème `#FDFAF3` — une marque mère reconnaissable.
2. **Liens croisés** : HalalCheck → "En voyage ? VoyagesHalal" · VoyagesHalal → "Au supermarché ? HalalCheck" · partout → la boutique.
3. **À construire ensuite** : compte unique + newsletter unique (un utilisateur gagné quelque part appartient à tout l'écosystème).

## Noms de domaine (vérifiés par DNS le 6 août 2026 — re-confirmer au moment de l'achat)

### À enregistrer en priorité (~100 €/an au total)

| Domaine | Pour | Note |
|---|---|---|
| voyagehalal.fr + .com | VoyagesHalal | Faute de frappe n°1 (singulier) |
| voyages-halal.fr | VoyagesHalal | Variante tiret (.com déjà pris) |
| voyageshalal.net / .org / .app | VoyagesHalal | Défensif — **le .com appartient à Sakina Voyages** |
| halaltravel.fr | VoyagesHalal | Générique SEO (.com pris) |
| halalscore.fr | HalalScore | La marque du score (.com pris) |
| **halalcheck.fr** | HalalCheck | Le domaine du scanner (halalscan.fr/.com pris) |
| **malika-paris.fr** | Boutique | La marque de la boutique |
| **modemodeste.fr + .com** | Boutique | Descriptif SEO |
| **hijabs.fr** | Boutique | Générique rare encore libre — pépite SEO |

### Aussi libres si budget

voyageshalal.eu / .co · halalvoyages.fr · muslimtravel.fr · halalmap.fr ·
monvoyagehalal.fr · scanhalal.fr · investhalal.fr · **rizq.fr** (marque premium) ·
noorwear.fr · modestywear.fr · amanistore.fr · modest-paris.fr

### Déjà pris (ne pas poursuivre, ou racheter plus tard)

voyageshalal.com (**Sakina Voyages — concurrent**) · voyageshalal.be · voyages-halal.com ·
halaltravel.com · halalvoyages.com · halalmap.com · halalscore.com · halalguide.fr ·
halalgo.fr · halal.travel · halalscan.fr/.com · halalcheck.com · financehalal.fr/.com ·
takaful.fr · abayas.fr · qamis.fr · sitara.fr · modesta.fr · layali.fr

⚠️ Ne jamais enregistrer la marque d'un concurrent (halalbooking.fr, halaltrip.fr…) :
cybersquatting = procédure UDRP perdue d'avance.

## Prochaines actions

- [ ] Enregistrer les domaines prioritaires (OVH ou Gandi, renouvellement auto, redirections 301).
- [ ] Sécuriser les handles sociaux des 3 marques (TikTok, Instagram, X, YouTube) — @voyageshalal Instagram semble déjà lié à Sakina Voyages.
- [ ] HalalCheck : tester sur téléphone via Expo Go, puis build stores.
- [ ] Boutique : numéro WhatsApp + vraies photos + mentions légales, puis Netlify/Vercel.
- [ ] Quand un projet décolle : le détacher dans son propre repo GitHub.

## Signatures de l'équipe

- Agent HalalCheck : empire compris, périmètre accepté (7 août 2026) —
  liens croisés préservés, périmètre `projects/halal-scanner/` (+ app mobile),
  honnêteté éditoriale absolue (jamais de verdict ni de certification non
  sourcés — c'est une amana), aucun conseil de finance islamique, palette
  famille respectée. Contribution : lien profond `scan.html?code=XXXX`
  disponible pour les sites frères.
