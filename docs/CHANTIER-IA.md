# Chantier IA — l'ordre du 14 août 2026

> **Mohamed, 14 août :** « Grâce à notre API Claude intégrée dans halalgpt.fr,
> générer de l'intelligence artificielle sur tous les sites. […] Il faudrait
> qu'on génère de l'IA partout. »

## L'architecture, en une phrase

**Une clé, une porte, chaque site apporte ses données.**

La clé Anthropic vit sur halalgpt.fr et nulle part ailleurs. Les autres sites
appellent la porte commune avec leur nom, la question du visiteur, et **leurs
propres données vérifiées**. L'IA rédige ; les faits viennent du site.

## La porte, en ligne depuis le 14 août

```
POST https://halalgpt.fr/api/assistant
{ "site": "voyageshalal", "question": "…", "contexte": ["…", "…"] }
→ flux texte (la réponse s'écrit mot à mot), ou JSON d'erreur
```

- `site` : `voyageshalal` · `gohalaltravel` · `halalcheck` · `islampasapas`
- `contexte` : les **3 à 6 résultats** que TON site a trouvés dans SA base
  (spots, fiches, leçons), en phrases courtes avec leur statut. Douze maximum,
  5 000 caractères maximum — au-delà, la porte refuse : envoie les résultats
  pertinents, pas ta base.
- CORS : seuls les domaines de la famille peuvent appeler depuis un navigateur.
- Garde-fous d'argent : 30 appels/heure par visiteur, 1 500/jour au total.
- gohalaltravel reçoit ses réponses **en anglais**, les autres en français.

## La règle qui pèse double sur une IA

**Ne-jamais-inventer est tenue À LA PORTE**, pas seulement promise chez
l'appelant : l'assistant n'a le droit d'affirmer un fait local — adresse,
horaire, équipement, certification — que depuis le bloc `contexte`. S'il est
vide, il le dit et renvoie vers la page utile du site. Il distingue toujours
« vérifié », « partagé par la communauté, à confirmer sur place » et
« inconnu ». Jamais de fatwa, jamais de finance, jamais de récitation.

**L'exemple de Mohamed, version honnête** — « je veux manger une pizza pas
loin » sur voyageshalal.fr :
1. le site prend la position (avec permission) et interroge **sa** base de
   spots + son relais OpenStreetMap — comme il le fait déjà ;
2. il envoie la question + les 3-6 adresses trouvées en `contexte` ;
3. l'assistant rédige : « D'après les adresses de VoyagesHalal : Pizzeria X à
   400 m — halal partagé par la communauté, à confirmer sur place… » ;
4. s'il n'y a rien : il le dit, et propose le guide de la ville.

Jamais une pizzeria sortie du modèle. C'est ce qui nous sépare des fermes de
contenu, et un widget qui invente une adresse une seule fois détruit la
confiance des cinq sites d'un coup.

## Le phasage — pour ne pas recréer le 14 août au matin

Le cap clics reste LA mesure (25 août, base 81). Ce chantier s'y insère sans
disperser personne :

| Phase | Qui | Quoi | Quand |
|---|---|---|---|
| 1 ✅ | HalalGPT | La porte, les garde-fous, les tests | **en ligne** |
| 2 | VoyagesHalal | Le widget sur voyageshalal.fr, branché sur SA base spots/OSM | **après** ses pages à 0 clic — ou tout de suite si Mohamed le décide |
| 3 | Apprentissage | Le tuteur sur islampasapas.fr | après le branchement du domaine |
| 4 | HalalCheck | « Pose une question sur ce produit » | après ses premières données Search Console |
| 5 | Mohamed | Google Places, si nos données ne suffisent pas | décision à part — clé et coûts chez lui |

Sur Google Places : commencer **sans**. Nos propres données + OSM sont
gratuites et déjà branchées chez VoyagesHalal ; Places coûte par requête et ne
sait de toute façon PAS dire si un lieu est halal — il élargirait la carte,
pas la confiance. On en reparle si la phase 2 montre des trous.

## La mesure

Chaque appel est compté **par site** dans la mine (`halalgpt.fr/api/mine`).
Le 25 août, on saura qui a consommé quoi et si les visiteurs s'en servent —
la règle du cap s'applique au widget comme au reste : un usage qu'on ne mesure
pas n'existe pas.
