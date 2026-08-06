# Stratégie Arrosoir — Écosystème Halal

> Plusieurs pousses en parallèle. Celle qui monte reçoit l'eau.
> Toutes partagent le même terreau : audience musulmane francophone, palette
> visuelle commune, et à terme un compte utilisateur + une base de données uniques.

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
