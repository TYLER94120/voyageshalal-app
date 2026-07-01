# Brief — Filtre hôtels « façon Booking, mais halal & bien situé » (app + web)

But : reproduire sur le **site** le même filtre replié que l'app, et remplir les
**données** pour qu'il fonctionne. L'app et le web lisent la **même API**, donc
un seul jeu de données sert les deux. Ce doc = **source de vérité partagée**.

Trois publics :
- **Partie A → Cowork / données** : quels champs remplir, avec quelles valeurs.
- **Partie B → Claude web** : où vivent les formules (le CODE de l'app) pour être
  identique, au chiffre près.
- **Addendum → enrichissement** : source réelle de chaque champ + garde-fous.

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
| **Prix (bandes €)** | `prixNuitEur`,`prix_nuit_eur`,`prixNuit`,`nightlyPrice` | nombre € / nuit (min) | Bandes fines : ≤50 / 50-100 / 100-200 / 200+ |
| **Type/gamme** | `category`,`type`,`categorie` | **vocabulaire ci-dessous** | Filtre Type |
| **Salle de prière** | `salleDePriere`,`prayerRoom` | booléen | Filtre équipement |
| **Sans alcool** | `sansAlcool`,`noAlcohol` | booléen | Filtre équipement |
| **Petit-déj halal** | `petitDejeunerHalal`,`halalBreakfast` | booléen | Filtre équipement |
| **Piscine non-mixte** | `piscineNonMixte`,`womenOnlyPool` | booléen | Filtre équipement |
| **Qibla en chambre** | `qibla`,`qiblaIndicateur` | booléen | Filtre équipement |
| **Halal-friendly** | `halalFriendly` | booléen | Badge de repli |
| **Lien HalalBooking** | `halalBookingUrl`,`halal_booking_url` | URL **avec ton ID affilié** | Bouton « Réserver halal » (revenu n°1) |
| **Lien Booking** | `bookingUrl`,`booking_url` | URL **avec `aid=` = ton ID** | Bouton « Réserver » |

> ✅ Le champ `prixNuitEur` est **désormais parsé par l'app** — dès qu'il est
> rempli, les bandes budget apparaissent (côté app comme web).

### Vocabulaire `category` à normaliser (valeurs CONSTANTES)
Utiliser **exactement** ces libellés (mêmes accents/casse) pour que les filtres
regroupent bien, sur app comme sur web :

`Premium` · `Boutique` · `Riad / Villa` · `Appartement` · `Familial` ·
`Budget` · `Capsule` · `Auberge`

> Un hôtel = **une** valeur `category`.

---

## Partie B — Logique de classement : SOURCE UNIQUE = le code de l'app

Pour que le site classe les hôtels **à l'identique de l'app**, sans risque de
divergence, les formules **ne sont pas recopiées ici** : elles vivent dans le
code de l'app (repo mobile), **testées**. Le web les **réplique/importe** depuis
ces modules. Toute évolution se fait à **un seul endroit**.

| Logique | Module (repo app) | Fonction |
|---|---|---|
| Distance (Haversine, km) | `lib/geo.ts` | `distanceKm` |
| Rang de prix (« € » → 1..4) | `lib/lieuSort.ts` | `priceRank` |
| Score « bien situé » (mosquée + restos) | `lib/hotelLocation.ts` | `hotelLocationStats` |
| Score « Recommandé » (tri par défaut) | `lib/lieuSort.ts` | `recommendedScore` |
| Tris (situe / reco / proche / note / prix) | `lib/lieuSort.ts` | `sortLieux`, `sortOptionsFor` |
| Bandes budget + filtres hôtels | `lib/hotelFilter.ts` | `priceBandOf`, `applyHotelFilter`, `hotelFacets` |
| Déduplication hôtels (nom + ≤ 70 m) | `lib/hotelLocation.ts` | `dedupeHotels` |

> Chaque module a ses tests (`*.test.ts`) qui **figent le comportement attendu** :
> c'est la référence exécutable. Le web doit produire les **mêmes classements**
> (comme on l'a fait pour le score halal /10).

### Tris & filtres exposés dans l'UI (spec produit)
- **Tris** : ✨ Recommandé (défaut) · 🕌 Bien situés · 📍 Au plus proche · ⭐ Mieux notés · 💶 Moins cher
- **Filtres** (feuille repliée : 1 bouton → 1 feuille) :
  - 💶 **Budget** : bandes `prixNuitEur` (≤50 / 50-100 / 100-200 / 200+)
  - 🕌 **Emplacement** : ≤ 500 m mosquée · restos halal autour
  - 🏨 **Type** : valeurs `category` (Partie A)
  - ✅ **Équipements halal** : salle de prière · sans alcool · petit-déj halal · piscine non-mixte · qibla (ET, cumulables)
- **Graceful** : un groupe/chip n'apparaît **que si** au moins un hôtel porte la donnée → aucune option vide tant que la donnée n'est pas remplie.

---

## Enrichissement des données (addendum — remplissage)

### Source réelle de chaque champ
| Champ | Source |
|---|---|
| latitude/longitude | Géocodage (job en cours) |
| note, reviewCount, price | Dataset Booking existant |
| category | Normalisé depuis le type source (mapping ci-dessous) |
| Équipements halal (salleDePriere, sansAlcool, petitDejeunerHalal, piscineNonMixte, qibla) | HalalBooking là où l'hôtel est couvert ; sinon `null` |
| halalBookingUrl / bookingUrl | Liens affiliés (IDs du propriétaire) |

### Normalisation `category` — 8 valeurs CONSTANTES
- **Premium** ← luxe, luxury, 5-star, palace, deluxe, resort 5★
- **Boutique** ← boutique, design hotel
- **Riad / Villa** ← riad, villa, dar, kasbah
- **Appartement** ← apartment, appart'hôtel, studio, flat
- **Familial** ← family, family-friendly, club familial
- **Budget** ← budget, economy, 2-star, cheap
- **Capsule** ← capsule, pod
- **Auberge** ← hostel, auberge, maison d'hôtes, B&B, guesthouse

Règle : 1 hôtel = 1 seule `category`. Non reconnu → `Budget` (ou `null`, à trancher).

### Garde-fou honnêteté (booléens équipements)
- `null` = inconnu (le filtre ne remonte simplement pas l'hôtel).
- NE JAMAIS mettre `true` sans source vérifiable.
- NE JAMAIS présenter un `false` comme un fait affirmé.
→ Même principe que les libellés « Halal vérifié / Options halal ». Conséquence
assumée : le filtre équipements sera peu rempli au début (surtout hôtels
HalalBooking) — c'est honnête, il s'enrichit ensuite.

### Formules de score & tri — SOURCE UNIQUE = l'app
Ne PAS recopier les formules ici. Elles vivent dans le code de l'app — voir le
tableau **Partie B** (modules `lib/lieuSort.ts`, `lib/hotelLocation.ts`,
`lib/hotelFilter.ts`, `lib/geo.ts`). Le web réplique depuis ces modules. Toute
évolution se fait à un seul endroit.

### Répartition
- **Claude Code (session données/web)** : géocodage, normalisation `category`,
  remontée équipements (HalalBooking), mosquées/restos (OSM), dédup
  (nom + ≤ 70 m), injection liens affiliés.
- **Propriétaire (humain)** : obtenir les **2 IDs affiliés** (Travelpayouts +
  HalalBooking) ; vérifier sur le terrain (road trip Maroc) les équipements des
  hôtels visités.
- **Cowork** : entretien de cet addendum (mapping, garde-fous, cas ambigus).
- **Claude Code (session app)** : l'interface (feuille de filtres) + garde les
  formules synchro (modules Partie B).

---

## Principe directeur
- **Données remplies richement** = le filtre prend toute sa valeur.
- **Liens avec ton ID affilié** = chaque réservation rapporte (app + web).
- **App = web** : mêmes **modules** de calcul (Partie B) → mêmes classements,
  zéro incohérence (comme pour le score halal /10).
- **UI repliée** (1 bouton → 1 feuille) + **graceful** = riche SANS polluer la page.
