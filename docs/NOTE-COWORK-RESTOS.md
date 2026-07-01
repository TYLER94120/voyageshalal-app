# Note à Cowork / Claude web — densifier les restaurants halal en banlieue

## Constat (mesuré dans l'app)
Le endpoint `/api/nearby` marche très bien. MAIS la **couverture restos** est
inégale :
- **Centres-villes** : denses (ex. Paris centre → 35 restaurants dans 8 km ✅).
- **Banlieues / zones résidentielles** : quasi vides (ex. Fontenay-sous-Bois →
  **2 restaurants**, un peu loin).

Les mosquées (OSM) et les activités sont bien fournies partout ; ce sont les
**restaurants halal curés** qui manquent hors des hyper-centres.

## Pourquoi c'est important
Le voyageur (et surtout l'habitant en déplacement) ouvre l'app **là où il est**,
souvent pas en plein centre. Un « 2 restos à 4 km » donne une impression de vide
alors que la zone regorge sûrement d'adresses halal. C'est un frein direct à
l'expérience — et donc aux clics affiliés.

## Demande
Densifier la base **restaurants halal** dans les **agglomérations** (pas seulement
le centre) — banlieues, quartiers périphériques. Sources possibles :
- Import OSM `amenity=restaurant` + `diet:halal=yes/only` (ou `cuisine` typée
  kebab/turc/libanais/…) pour amorcer, puis curation.
- Datasets halal existants / annuaires communautaires.
- Étendre le rayon de collecte autour de chaque ville de la base (l'agglo, pas
  juste le point central).

## Côté app (déjà fait, pour info)
- Rayon « autour de moi » élargi **8 → 15 km** (mitigation immédiate : plus de
  choix, les plus proches restent en tête).
- **Boucheries halal** passées en **RÉEL via OSM** (fini le démo).
- Dès que la base restos se densifie, l'app en profite **automatiquement** (via
  `/api/nearby`) — aucune modif app nécessaire.

## Mesure de suivi
Comparer, pour quelques points banlieue (Fontenay, Créteil, Nanterre…), le
nombre de restaurants renvoyés par `/api/nearby?type=restaurants&radius=8`
**avant / après** densification. Objectif : passer de ~2 à plusieurs dizaines.
