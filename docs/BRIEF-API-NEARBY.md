# Brief technique — Endpoint API « nearby » (lieux autour de coordonnées)

Pour **Claude web** (back / API). Objectif : permettre à l'app (et au site)
d'afficher **restaurants, hôtels, activités, boucheries autour d'une position
GPS**, exactement comme on le fait déjà pour les **mosquées** via OpenStreetMap.

## Le problème résolu
Aujourd'hui l'API ne se requête que **par ville** (`/api/villes/{slug}`). Un
utilisateur à Fontenay-sous-Bois ne peut donc pas voir « les restos halal à 5 km
de moi » : il doit choisir « Paris », et les résultats sont au centre de Paris.
Les mosquées, elles, marchent partout car OSM se requête **par rayon GPS**. On
veut la même chose pour **nos** données curées (halal, notes, prix).

Les données existent déjà (tous les lieux sont géolocalisés après le géocodage) —
il manque **une requête géographique** transversale à toutes les villes.

## L'endpoint à créer

```
GET /api/nearby
```

### Paramètres (query string)
| Param | Type | Défaut | Notes |
|---|---|---|---|
| `lat` | number | — (requis) | latitude de l'utilisateur |
| `lng` | number | — (requis) | longitude de l'utilisateur |
| `type` | string | `all` | `restaurants` \| `hotels` \| `activites` \| `commerces` \| `mosquees` \| `all` |
| `radius` | number (km) | `8` | plafonner à `25` |
| `limit` | number | `100` | par type ; plafonner à `300` |

### Réponse (JSON)
**Réutiliser EXACTEMENT le même format d'objet lieu que `/api/villes/{slug}`**
(mêmes noms de champs), pour que le parseur de l'app fonctionne **sans
modification**. Ajouter un champ `distanceKm` (pratique, sinon l'app le
recalcule).

```json
{
  "origin": { "lat": 48.85, "lng": 2.47, "radius": 8 },
  "restaurants": [ { /* même shape que dans la fiche ville */ "distanceKm": 1.2 } ],
  "hotels":       [ { /* … */ } ],
  "activites":    [ { /* … */ } ],
  "commerces":    [ { /* … */ } ]
}
```
> Si `type` ≠ `all`, ne renvoyer que le tableau demandé (les autres vides ou absents).

### Champs attendus par lieu (déjà acceptés par le parseur app)
`id`/`slug`, `nom`/`name`, `latitude`/`longitude` (ou objet `coords`), `note`,
`reviewCount`/`nombreAvis`, `price`/`prix`, `category`/`type`, `adresse`,
`mapsUrl`, `halalConfidence`/`certificationHalal`, `tags`, `specialite`, `duree`.
Hôtels en plus : `prixNuitEur`, `bookingUrl`, `halalBookingUrl`, `salleDePriere`,
`sansAlcool`, `petitDejeunerHalal`, `piscineNonMixte`, `qibla`, `halalFriendly`.
→ **Ne rien renommer** : garder les clés déjà utilisées dans les fiches villes.

## Implémentation (recommandations)
1. **Filtre grossier par bounding-box** d'abord (rapide, indexable) :
   ```
   latMin = lat - radius/111
   latMax = lat + radius/111
   lngMin = lng - radius/(111·cos(lat))
   lngMax = lng + radius/(111·cos(lat))
   ```
   → `WHERE latitude BETWEEN latMin AND latMax AND longitude BETWEEN lngMin AND lngMax`.
2. **Affiner par distance Haversine** (km) et **filtrer** `distanceKm ≤ radius`.
   *(Même formule que l'app : `lib/geo.ts` → `distanceKm`.)*
3. **Trier** par `distanceKm` croissant, **couper** à `limit` par type.
4. **Index spatial** : si Postgres, idéalement **PostGIS** (`geography` +
   `ST_DWithin(geom, point, radius_m)`) qui fait tout ça nativement et vite.
   Sinon, un index B-tree sur `(latitude, longitude)` + le pré-filtre bbox.
5. **Dédup** : mêmes règles que l'app (`lib/hotelLocation.ts` → `dedupeHotels`,
   nom normalisé + ≤ 70 m) pour éviter les doublons issus de la densification.

## Contraintes / garde-fous
- **Perf** : viser < 300 ms. Le pré-filtre bbox + index est indispensable
  (33 819 hôtels + restos → ne PAS scanner toute la base à chaque appel).
- **Données halal** : garder la curation (certif, halalConfidence…) — c'est la
  valeur ajoutée vs OSM. Ne pas mélanger avec des lieux OSM génériques ici.
- **Champs manquants** : renvoyer `null`/absent (jamais inventer un `true`).
- **CORS** : autoriser l'app mobile (pas de cookie/credential requis).

## Intégration côté app (ce que je ferai, session app)
- En mode « autour de moi » (pas de ville choisie), l'app appellera
  `/api/nearby?lat=..&lng=..&type=..&radius=8` au lieu des données démo.
- Réponse passée dans le **parseur existant** (`normalizeLieu`) → cartes, tris
  (Recommandé/Proche/…) et **filtres** marchent tels quels.
- Les mosquées restent sur OSM (déjà OK) ; `nearby` sert aux restos/hôtels/
  activités/boucheries.

## Résultat attendu
« Restos halal / hôtels bien situés / activités **autour de moi** », partout,
sans choisir de ville — la même magie que les mosquées, mais avec **tes données
curées**. C'est ce qui rend l'app imbattable pour un voyageur en déplacement.
