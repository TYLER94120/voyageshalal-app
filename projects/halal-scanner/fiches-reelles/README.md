# Des fiches de VRAIS produits, figées ici

## À quoi ce dossier sert

Le moteur de verdict n'a **jamais** été confronté à un produit réel. Tout ce
qui est vérifié — 82 cas en CI, 56 additifs, 29 règles cosmétiques — l'est
contre des fiches que nous avons écrites nous-mêmes. Elles ne couvrent donc
que ce à quoi nous avons pensé.

La raison est mesurée, pas supposée : le proxy de l'atelier refuse
`world.openfoodfacts.org` **par politique**, pas par panne — `connect_rejected,
403 to CONNECT`, revérifié le 13 août 2026 à 16:05 UTC. Sa liste d'exceptions
ne contient que des dépôts de paquets et GitHub.

Ce dossier est la voie de secours : les fiches sont capturées **une fois**
depuis un navigateur qui, lui, a le droit d'y aller, puis figées dans le dépôt.
`npm run sonde:fiches` les rejoue hors ligne, autant de fois qu'on veut.

## Ce que ça répond, et que rien d'autre ne répond

**Quel pourcentage des produits réels ressort INCONNU ?** Un moteur qui répond
« je ne sais pas » sur la moitié des paquets d'un rayon n'a pas la même valeur
qu'un moteur qui tranche neuf fois sur dix. Aujourd'hui, ce chiffre n'existe
pas.

La sonde dit aussi **pourquoi** chaque produit est resté INCONNU : liste
absente de la base, étiquette en arabe seul, texte trop court, ou mentions
d'absence. Ce sont quatre problèmes différents, avec quatre corrections
différentes.

## Comment en déposer

1. Prends un produit — idéalement la moitié de marques maghrébines, la moitié
   de marques françaises : ce sont les deux publics.
2. Ouvre dans ton navigateur, en remplaçant le code-barres :

   ```
   https://world.openfoodfacts.org/api/v2/product/3017620422003.json
   ```

   Pour un cosmétique (savon, shampooing, dentifrice), utiliser
   `world.openbeautyfacts.org` à la place.
3. Enregistre la page (`Ctrl+S`) dans ce dossier, en `.json`.
4. **Nomme le fichier avec le préfixe `obf-` s'il vient d'Open Beauty Facts.**
   C'est ce qui aiguille la fiche vers le moteur cosmétique. Sans préfixe, elle
   part au moteur alimentaire — avec le second avis « Aqua », comme sur le
   site.

Aucun format à respecter : la sonde accepte la réponse d'API telle quelle
(`{"status":1,"product":{…}}`) comme la fiche seule.

## Ce qu'on ne met PAS ici

Rien d'inventé, rien de retouché à la main. Une fiche modifiée pour « faire
passer un test » détruirait la seule chose qui rend ce dossier utile : que ces
produits existent vraiment, avec leurs étiquettes telles qu'elles sont.

Les cas fabriqués ont déjà leur place — dans `scripts/sonde-faux-negatifs.mjs`
et les autres sondes.

## Ce que la sonde considère comme une faute

Uniquement ce qui est indiscutable : un fichier illisible, ou une fiche qui
fait planter le moteur. **La répartition des verdicts est une mesure, pas une
note** — aucun seuil du genre « moins de 30 % d'inconnus » n'est imposé, parce
que rien ne le fonderait aujourd'hui.
