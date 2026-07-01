# Brief — Filtre hôtels « façon Booking, mais halal & bien situé » (app + web)

But : reproduire sur le **site** le même filtre replié que l'app, et remplir les
**données** pour qu'il fonctionne. L'app et le web lisent la **même API**, donc
un seul jeu de données sert les deux. Ce doc = **source de vérité partagée**.

Deux publics :
- **Partie A → Cowork / données** : quels champs remplir, avec quelles valeurs.
- **Partie B → Claude web** : la logique exacte (tris + score) pour être
  identique à l'app, au chiffre près.

---

## Partie A — Données à fournir par hôtel (Cowork)

Le parseur de l'app accepte plusieurs noms de clés (tolérant). Remplir **au
mieux** ces champs sur un maximum d'hôtels — c'est ce qui donne de la valeur au
filtre.

| Donnée | Clés acceptées (API) | Valeurs attendues | Sert à |
|---|---|---|---|
| **Coordonnées** | `latitude`/`longitude` (ou objet `coords`) | nombres | Score « bien situé », tri proche |
| **Note** | `note` | 0–5 | Tri Noté / Recommandé |
| **Nb d'avis** | `reviewCount`,`nombreAvis`,`avis` | entier | Bonus popularité |
| **Prix (affichage)** | `price`,`prix`,`priceRange`,`gamme_prix` | `€`,`€€`,`€€€`,`€€€€` | 4 bandes de prix grossières |
| **Prix (bandes €)** | `prixNuitEur` *(à créer)* | nombre € / nuit (min) | Bandes fines : ≤50 / 50-100 / 100-200 / 200+ |
| **Type/gamme** | `category`,`type`,`categorie` | **vocabulaire ci-dessous** | Filtre Type |
| **Salle de prière** | `salleDePriere`,`prayerRoom` | booléen | Filtre équipement |
| **Sans alcool** | `sansAlcool`,`noAlcohol` | booléen | Filtre équipement |
| **Petit-déj halal** | `petitDejeunerHalal`,`halalBreakfast` | booléen | Filtre équipement |
| **Piscine non-mixte** | `piscineNonMixte`,`womenOnlyPool` | booléen | Filtre équipement |
| **Qibla en chambre** | `qibla`,`qiblaIndicateur` | booléen | Filtre équipement |
| **Halal-friendly** | `halalFriendly` | booléen | Badge de repli |
| **Lien HalalBooking** | `halalBookingUrl`,`halal_booking_url` | URL **avec ton ID affilié** | Bouton « Réserver halal » (revenu n°1) |
| **Lien Booking** | `bookingUrl`,`booking_url` | URL **avec `aid=` = ton ID** | Bouton « Réserver » |

### Vocabulaire `category` à normaliser (important : valeurs CONSTANTES)
Utiliser **exactement** ces libellés (mêmes accents/casse) pour que les filtres
regroupent bien, sur app comme sur web :

`Premium` · `Boutique` · `Riad / Villa` · `Appartement` · `Familial` ·
`Budget` · `Capsule` · `Auberge`

> Un hôtel = **une** valeur `category`. Éviter les variantes libres
> (« hotel de luxe », « luxueux »…) qui casseraient le regroupement.

### Prix — recommandation
Pour des **bandes en euros** (≤50 € / 50-100 € / 100-200 € / 200 €+), ajouter un
champ numérique `prixNuitEur` (prix mini/nuit). Sans lui, on ne peut proposer
que 4 bandes grossières via les symboles `€` (€ = pas cher … €€€€ = luxe).
→ *Quand `prixNuitEur` existe, je l'ajoute au parseur de l'app.*

---

## Partie B — Logique EXACTE à répliquer sur le web (Claude web)

Pour que le site classe les hôtels **à l'identique de l'app**. Toutes ces
fonctions sont pures (aucun réseau).

### 1. Distance (Haversine), en km
```
R = 6371
dLat = (lat2-lat1)·π/180 ; dLng = (lng2-lng1)·π/180
a = sin(dLat/2)² + cos(lat1·π/180)·cos(lat2·π/180)·sin(dLng/2)²
distanceKm = 2·R·atan2(√a, √(1-a))
```

### 2. Rang de prix (à partir de `price`)
```
"Gratuit"/"free"/"0" → 0
sinon → nombre de « € » (1..4) ; aucun « € » → null
```

### 3. Score « bien situé » (LE différenciateur — proximité mosquée + restos halal)
Pour chaque hôtel géolocalisé, avec la liste des mosquées et des restaurants
halal de la ville :
```
nearestMosqueKm = min distance à une mosquée
restosNear      = nb de restaurants halal à ≤ 1 km de l'hôtel
mosqueBonus     = max(0, 2 - nearestMosqueKm) × 5     // 0 km → +10, ≥2 km → 0
score_situe     = restosNear + mosqueBonus
```
> Les mosquées doivent être **exhaustives** (idéalement API + OpenStreetMap
> Overpass, dédupliquées) — sinon le score est faux. C'est ce que fait l'app.

### 4. Score « Recommandé » (tri par défaut) — 0..1
`dist` = distance de l'hôtel à l'origine (centre-ville, ou position user).
```
noteScore  = note != null ? clamp(note/5, 0, 1) : 0.5
proxScore  = dist != null ? 1 / (1 + max(0,dist)/2) : 0.4      // 0km→1, 2km→0.5, 6km→0.25
cheapness  = priceRank != null ? clamp((5 - priceRank)/4, 0, 1) : 0.6
valueScore = noteScore × cheapness
score = 0.40·noteScore + 0.35·proxScore + 0.25·valueScore
        + (certifié halal ? 0.05 : 0)
        + min(reviewCount/800, 1) × 0.04
```

### 5. Tris proposés (mêmes clés que l'app)
- **✨ Recommandé** (défaut) → score §4 décroissant
- **🕌 Bien situés** → score §3 décroissant
- **📍 Au plus proche** → `dist` croissant
- **⭐ Mieux notés** → `note` décroissant
- **💶 Moins cher** → `priceRank` croissant

### 6. Filtres (groupes de la feuille)
- **💶 Budget** : bandes via `prixNuitEur` (≤50 / 50-100 / 100-200 / 200+) ou `price`
- **🕌 Emplacement** : « ≤ 500 m d'une mosquée » (`nearestMosqueKm ≤ 0.5`), « restos halal autour » (`restosNear > 0`)
- **🏨 Type** : valeurs `category` (§A)
- **✅ Équipements halal** : `salleDePriere`, `sansAlcool`, `petitDejeunerHalal`, `piscineNonMixte`, `qibla` (ET logique : cumulables)

### 7. Déduplication hôtels (la densification peut créer des doublons)
Fusionner deux hôtels seulement si **nom normalisé proche ET coords à ≤ 70 m**.
Normalisation du nom : minuscules, sans accents, on retire les mots génériques
(hotel, riad, resort, suites, the, le/la…). L'entrée curée (en premier) gagne.

---

## Principe directeur
- **Données remplies richement** = le filtre prend toute sa valeur.
- **Liens avec ton ID affilié** = chaque réservation rapporte (app + web).
- **App = web** : mêmes formules ci-dessus → mêmes classements, zéro incohérence
  (comme on l'a fait pour le score halal /10).
- **UI repliée** (1 bouton → 1 feuille) = riche SANS polluer la page.
