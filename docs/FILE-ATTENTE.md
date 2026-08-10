# File d'attente — halalcheck.fr

Un élément par ligne, avec **ce qui le justifie**. Une idée sans preuve n'entre
pas ici : elle attend dans la boîte aux lettres.

À chaque cycle : on prend le premier élément qu'on peut finir, on le finit, on
le déplace en bas avec sa mesure. S'il reste moins de trois éléments, le cycle
sert à auditer pour remplir la file.

Rappel du périmètre : `projects/halal-scanner/`. La valeur de ce produit est la
**confiance** — un seul verdict faux le détruit. En cas de doute : DOUTEUX avec
une explication honnête, jamais un verdict inventé.

---

## À faire

1. **Aucun outil de mesure sur halalcheck.fr.**
   *Preuve :* `grep -il "gtag\|analytics\|plausible\|matomo\|google-site-verification"`
   sur les quatre pages ne rend rien. Zéro. Conséquence directe : je ne peux
   répondre ni « combien de gens scannent », ni « est-ce que la passerelle vers
   HalalGPT amène quelqu'un », ni « quelle page fait revenir ». J'ai participé
   au brainstorm du 10 août les mains vides pour cette seule raison.
   *Bloqué sur :* la balise de vérification Search Console, que Mohamed doit
   récupérer depuis son ordinateur. Le compteur `/api/passerelle` de HalalGPT
   accepte déjà `halalcheck` comme source.

2. **Les deux bases de données sont vides.**
   *Preuve :* `verifications.json` et `produits-locaux.json` contiennent
   0 produit chacun (les deux fiches de démonstration ont été retirées le
   10 août). Or le sceau « ✓ INFORMATION VÉRIFIÉE » est annoncé sur l'accueil,
   dans la FAQ et dans les mentions légales comme **ce qui nous distingue des
   autres scanners**. Aujourd'hui il ne peut se déclencher pour aucun produit
   réel. La promesse est vraie sur le principe, vide dans les faits.
   *Ce qu'il faut :* des codes-barres marocains avec photo des ingrédients, ou
   une réponse écrite de fabricant. Demandé à Mohamed, pas encore reçu.

3. **Open Food Facts est injoignable depuis l'atelier.**
   *Preuve :* `curl` vers `world.openfoodfacts.org` rend le code 000 en 0,45 s —
   bloqué par le proxy réseau. Conséquence : **aucun agent ne peut tester le
   moteur sur des produits réels.** Les 56 additifs et 29 règles cosmétiques ne
   sont validés que par 51 tests écrits à la main — écrits par nous, donc ils ne
   couvrent que ce à quoi nous avons pensé. On ne sait toujours pas quel
   pourcentage des produits réels tombe en « inconnu ».
   *Piste :* constituer un jeu de fiches réelles figées dans le dépôt, capturées
   une fois depuis le navigateur de Mohamed, pour tester hors ligne.

---

## Fait

- **Le moteur cosmétique n'avait aucun test, et trois trous** *(10 août)* —
  même sonde que sur l'alimentaire, sur 30 mentions INCI réellement imprimées
  au dos de flacons.

  | Sonde | Avant | Après |
  |---|---|---|
  | Mentions animales devant alerter | **27 / 30** | **30 / 30** |
  | Mentions banales devant rester muettes | 10 / 10 | **10 / 10** |

  Manquaient : la bave d'escargot (*Snail Secretion Filtrate*), le castoréum
  et les sécrétions de parfumerie (civette, musc, ambre gris), et le rétinol.
  Ce dernier est ajouté en **doute mineur** — il est obtenu par synthèse dans la
  quasi-totalité des cosmétiques ; l'annoncer comme un vrai doute aurait fait du
  bruit sur un ingrédient très courant, ce qui use la confiance autant qu'un
  oubli.

  **Le vrai sujet était ailleurs : ce moteur n'avait AUCUN test.** La suite ne
  compilait que `lib/halal.ts`. Trois règles venaient d'y être ajoutées sur un
  moteur que rien ne protégeait. 18 cas ajoutés, dont les cinq qui gardent le
  piège central du produit : *Cetyl*, *Cetearyl*, *Stearyl* et *Behenyl
  Alcohol* sont des CIRES et ne doivent jamais être signalées comme de
  l'alcool — c'est ce qui nous sépare des applications concurrentes.
  Tests du moteur : **33 → 51**. Règles publiées : 98 → 101.

  *Note de méthode :* la sonde a d'abord annoncé **10 faux positifs sur 10**,
  jusqu'à « Sodium Chloride ». C'était l'instrument : son décor de test
  contenait « Glycerin », que le moteur signale à juste titre. Le décor est
  désormais vérifié par la suite elle-même — elle refuse de tourner s'il alerte
  tout seul. Deuxième fois en deux cycles qu'une sonde ment ; la compétence
  `soupconner-l-instrument` a exactement raison.

- **Le moteur laissait passer des étiquettes entières** *(10 août)* — sonde de
  faux négatifs sur des mentions réellement imprimées sur des emballages. C'est
  le seul défaut qui détruit ce produit : un « douteux » de trop agace, un
  « halal » de trop fait manger du haram.

  | Sonde | Avant | Après |
  |---|---|---|
  | Codes E écrits dans le **texte** de la composition | **0 / 8** détectés | **8 / 8** |
  | Mots d'étiquette hors codes E | **0 / 14** | **14 / 14** |
  | Compositions banales devant rester halal | — | **15 / 15**, 0 faux positif |

  Le cas grave était le premier. Les codes E n'arrivaient que par le champ
  `additives_tags` d'Open Food Facts — souvent vide sur les produits du Maghreb,
  et **inexistant quand l'étiquette est lue en photo**. Un produit marocain
  transcrit depuis une photo dont l'étiquette dit « émulsifiant E471 »
  ressortait donc **halal**. Exactement le public pour lequel le produit a été
  construit.

  Ajouté ensuite : porto, sherry, xérès, madère, vermouth, saké, cidre
  (la règle alcool ne connaissait que vin, bière, rhum, whisky) ; `rennet`,
  `tallow`, `carmine`, `shortening` (mots anglais des étiquettes importées) ;
  pepsine, pancréatine, lipase, trypsine ; gomme laque ; collagène et élastine,
  déjà couverts côté cosmétiques mais pas côté alimentaire ; glycérine.

  **Garde-fous, car un faux positif use la confiance lui aussi :**
  « Vitamine E 400 UI » ne doit pas se lire comme l'additif E400 ; « glycérine
  végétale », « lipase microbienne » et « présure microbienne » annoncent leur
  origine et restent halal. Les trois sont testés.

  Tests du moteur : **17 → 33**, tous verts. Règles publiées : 94 → 98.
  Vérifié aussi qu'un code présent à la fois dans le texte et dans les additifs
  ne produit qu'une seule alerte.

  *Note de méthode :* ma première sonde annonçait 23 défauts sur 42. Elle était
  fausse — elle passait les codes E par le mauvais canal. Refaite proprement,
  elle a séparé 8 vrais défauts d'artefacts de mesure. **Quand une mesure rend
  un chiffre spectaculaire, on la refait avant d'y croire.**

- **Les liens d'action étaient trop petits au doigt** *(10 août)* — mesuré sur
  un écran de 320 px, sur les liens d'action autonomes uniquement (boutons et
  navigation), 44 px étant le minimum recommandé.
  **Mesure : 74 liens sous 44 px → 0**, sur les quatre pages.
  Le gros du lot : les 57 liens « Comprendre le E471 → » d'`additifs.html`, à
  30 px, qui portent la passerelle vers HalalGPT — les rater coûtait deux fois.
  Corrigé dans la RÈGLE (`.fiche`, `.sommaire a`, `footer a`, `.pied a`), pas
  page par page : `additifs.html` étant générée, la prochaine régénération ne
  peut pas réintroduire le défaut.
  **Ce qui n'a délibérément PAS été touché :** les liens en pleine phrase
  (adresse de contact, sources externes citées dans un paragraphe). Un lien
  dans un texte a la hauteur de sa ligne ; le forcer à 44 px casserait le
  paragraphe. Le script de mesure les exclut explicitement.
  Vérifié sans régression : aucun débordement horizontal sur les quatre pages,
  aucune erreur JS, scan « douteux » de bout en bout inchangé.

- **La page du scanner n'avait aucun titre principal** *(10 août)* — mesuré
  après rendu, comme le fait le robot de Google : les trois `h1` du document
  étaient cachés, et le seul portant du texte disait « Lire l'étiquette en
  photo » — une fonction secondaire, sur un écran invisible. L'écran du
  scanner, lui, n'avait aucun titre.
  **Mesure : titre retenu par un robot « Lire l'étiquette en photo » →
  « Scanner un produit »**, désormais visible et premier dans le document.
  Vérifié sans régression : aucun débordement horizontal, aucune erreur JS.
  Les trois autres pages avaient déjà un `h1` unique et juste.

- **Le service worker attendait le réseau sans limite** *(10 août)* — les pages
  HTML et les bases JSON étaient servies « réseau d'abord » avec un `fetch` sans
  délai maximum. Une page pourtant **présente dans le cache** restait invisible
  tant que le réseau n'avait pas répondu : exactement la situation du rayon de
  supermarché, où le réseau n'est pas coupé mais lent.
  **Mesure, réseau retardé de 20 s : 20,1 s → 4,1 s avant affichage.**
  Les trois autres cas vérifiés sans régression : réseau normal 0,1 s, réseau
  coupé avec page en cache 0,1 s, et première visite sans cache — on continue
  d'attendre le réseau quel qu'en soit le temps, puisqu'il n'y a rien à servir.
  La requête n'est pas annulée : elle continue en arrière-plan et met le cache à
  jour pour la fois suivante. Trou que ma propre compétence
  `repondre-en-conditions-degradees` documentait comme non traité ; il l'est.

- **Le débordement horizontal du scanner** *(10 août)* — sur un écran de 320 px,
  le bouton « Chercher » sortait de 64 px et toute la page défilait
  latéralement. Cause : `#saisie` avait `flex: 1` sans `min-width: 0`, et un
  enfant de flex refuse par défaut de rétrécir sous sa largeur intrinsèque.
  **Mesure : 64 px de débordement → 0 px**, vérifié à 280, 320, 360 et 390 px ;
  le bouton est visible sur les quatre.

- **Deux fiches inventées servies en production** *(10 août)* —
  `verifications.json` affichait « Confirmé halal par le fabricant » sur le code
  `0000000000000`, et `produits-locaux.json` une fiche factice. Les deux
  portaient écrit « à supprimer avant l'ouverture publique » ; le site est
  ouvert depuis le 8 août. Servir une certification fabricant inventée est
  exactement ce que la règle `ne-jamais-inventer` interdit.
  **Mesure : 2 fiches inventées → 0.** Vérifié ensuite que le scanner fonctionne
  toujours avec des bases vides (verdict DOUTEUX, 2 alertes, aucune erreur JS)
  et que le code de démonstration n'affiche plus de sceau « VÉRIFIÉE ».

---

## Note de méthode — ce que l'audit a cru trouver et qui était faux

Deux « défauts » relevés automatiquement n'en étaient pas, et les écarter a pris
autant de temps que de les trouver :

- **« 3 h1 sur scan.html »** — c'est une application à écrans multiples : les
  trois `h1` appartiennent à trois écrans dont un seul est visible à la fois.
  Ce n'est pas une faute de structure. Il en restait un vrai sujet, plus étroit,
  traité le 10 août (voir « Fait »).
- **« un lien vide sans aria-label »** — `#cta-verifier` est `hidden` et rempli
  par JavaScript au moment où il sert. Aucun utilisateur ne le rencontre vide.

Mon propre script d'audit comptait des éléments du document sans regarder s'ils
étaient visibles. **Quand une mesure automatique rend un défaut, il faut encore
vérifier qu'il existe** — c'est la même règle que « quand un comptage rend zéro,
soupçonne d'abord le comptage », appliquée dans l'autre sens.
