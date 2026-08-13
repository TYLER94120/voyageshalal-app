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
   *Preuve, mesurée précisément le 11 août :* ce n'est pas une panne, c'est une
   **politique**. Le proxy de l'atelier répond `connect_rejected — gateway
   answered 403 to CONNECT (policy denial)` pour `world.openfoodfacts.org`,
   `halalgpt.fr` et `unpkg.com`. Sa liste d'exceptions ne contient que des
   dépôts de paquets : npm, jsr, PyPI, crates.io, proxy.golang.org — plus
   GitHub. **Tout le reste du web est refusé par règle**, pas par incident.
   Conséquence : **aucun agent ne peut tester le
   moteur sur des produits réels.** Les 56 additifs et 29 règles cosmétiques ne
   sont validés que par 51 tests écrits à la main — écrits par nous, donc ils ne
   couvrent que ce à quoi nous avons pensé. On ne sait toujours pas quel
   pourcentage des produits réels tombe en « inconnu ».
   *Revérifié le 13 août à 16:05 UTC :* toujours refusé, pour
   `world.openfoodfacts.org` comme pour `halalgpt.fr`.
   *Ma moitié est faite (13 août).* `npm run sonde:fiches` lit
   `fiches-reelles/`, rejoue le moteur hors ligne sur de vraies fiches et rend
   la répartition des verdicts — dont **le pourcentage d'INCONNU**, le chiffre
   qui manque depuis le début — plus la raison de chaque INCONNU (liste absente,
   arabe seul, texte trop court, mentions d'absence). Éprouvée sur 6 fiches
   d'essai puis remise à zéro ; elle sort en erreur sur un fichier illisible.
   En CI : tant que le dossier est vide, elle dit « 0 fiche » au lieu
   d'inventer un succès.
   *Ce que Mohamed seul peut faire, au choix :* élargir la politique réseau de
   l'environnement pour autoriser `world.openfoodfacts.org` — ou déposer une
   vingtaine de fiches dans `projects/halal-scanner/fiches-reelles/`, marche à
   suivre dans le README de ce dossier. Vingt minutes de copier-coller
   produisent alors une mesure que trois jours de sondes n'ont pas pu produire.

4. **La lecture d'étiquette n'a jamais été vérifiée contre le VRAI service.**
   *Preuve :* les six façons d'échouer ont été mesurées le 11 août avec une
   fausse réponse d'API — le côté navigateur est sain. Mais `halalgpt.fr` est
   refusé par la politique réseau de l'atelier (403 au CONNECT, voir le point
   ci-dessus), donc **personne n'a jamais vu la chaîne complète fonctionner**. La plainte de Mohamed du 10 août
   (« ça me demande de reprendre la photo ») venait forcément du service ou du
   réseau, jamais du navigateur.
   *Ce qu'il faut :* un essai depuis le téléphone de Mohamed, ou l'agent
   HalalGPT qui confirme que `/api/etiquette` répond et dans quel format —
   l'un comme l'autre contourne la règle sans toucher à l'environnement.
   La sonde `npm run sonde:photo` rejoue les six cas en trente secondes.

5. **« Arôme naturel » : un verdict que je ne tranche pas seul.**
   *Preuve :* mesuré le 11 août, il ressort **halal**. Or un arôme naturel peut
   être porté par de l'alcool ou tiré d'une source animale. D'autres scanners
   le signalent.
   *Pourquoi je m'arrête là :* cela relève d'un désaccord entre écoles, pas d'un
   fait d'étiquette. Et « arôme naturel » figure sur une part énorme des
   produits français : le signaler ferait basculer des milliers de produits en
   DOUTEUX. Un doute inventé abîme la confiance autant qu'un verdict faux.
   *Ce qu'il faut :* la position que Mohamed veut tenir, ou l'avis d'un savant.
   Dès que c'est tranché, c'est une ligne de code et un test.
   *Correction du 11 août :* j'avais mis « vinaigre de vin » sur la même ligne.
   C'était faux — le code le neutralise **volontairement** depuis longtemps
   (`t.replace(/vinaigre de vin/g, "vinaigre")`). Ce n'était pas un oubli mais
   une décision déjà prise ; le vinaigre d'alcool la rejoint (voir « Fait »).

6. **Le lien partagé `scan.html?code=…` mérite d'être vérifié en vrai.**
   *Preuve :* corrigé le 12 août dans `sw.js` (`ignoreSearch` sur les
   navigations), et vérifié serveur coupé dans l'atelier. Mais l'atelier n'est
   pas un téléphone : je n'ai jamais vu ce lien s'ouvrir en mode avion sur un
   vrai iPhone, ni sur un Android.
   *Pourquoi ça compte :* c'est le lien que l'app fabrique au partage
   (« Scanné avec HalalCheck ») et celui par lequel HalalGPT envoie les gens
   ici. Il ne s'ouvrait pas du tout hors ligne.
   *Ce qu'il faut :* Mohamed scanne un produit, se met en mode avion, et ouvre
   le lien partagé. Une capture d'écran suffit. C'est le seul point de cette
   file où sa capture d'écran est utile plutôt que subie.

7. **Un produit sans composition mais avec un additif anodin ressort HALAL.**
   *Preuve, mesurée le 12 août :* `analyserProduit({ ingredientsTexte: null,
   additifs: ["en:e330"] })` → **HALAL, 0 alerte**. La règle actuelle dit qu'on
   a « des données » dès que la base fournit au moins un code additif, même
   sans une seule ligne d'ingrédients.
   *Pourquoi j'hésite plutôt que de corriger :* durcir ferait basculer en
   INCONNU des produits dont la fiche est probablement correcte, et « un moteur
   qui doute de tout est aussi inutile qu'un moteur aveugle » — c'est la
   doctrine que garde `sonde:faux-positifs`. Je ne sais pas combien de produits
   réels sont dans ce cas : la mesure demanderait Open Food Facts, injoignable
   depuis l'atelier (élément 3).
   *Ce qu'il faut :* soit l'accès à Open Food Facts pour compter, soit la
   position de Mohamed. Lié à l'élément 3 ; je ne tranche pas seul un critère
   qui décide de la couleur d'un verdict.

---

## Fait

- **Une correction du moteur était commitée mais jamais compilée — le site
  servait encore le défaut** *(13 août)*. Le plus vicieux rencontré jusqu'ici,
  parce qu'il **annule silencieusement n'importe quelle correction**.

  Trouvé par accident : après un `git rebase`, `npm run build:site` a produit
  un diff de 26 lignes sur `site/halal.js`. Un fichier généré qui change alors
  que personne n'a touché à la source, c'est que le fichier servi avait
  **divergé** de `lib/halal.ts`.

  Un cycle de cette nuit avait corrigé « l'étiquette végane servait de
  laissez-passer », avec son commit et ses explications. Mais `site/halal.js` —
  **le fichier que le navigateur exécute** — n'avait jamais été recompilé.

  | Moteur réellement en ligne | avant | après recompilation |
  |---|---|---|
  | végane + étiquette « non halal » | **HALAL** *(avec l'alerte affichée dessous)* | DOUTEUX |
  | végane + gélatine | **HALAL** | DOUTEUX |
  | végane + carmin | **HALAL** | DOUTEUX |
  | végane + E471 *(doute que « végétal » lève)* | HALAL | HALAL, 0 alerte |

  **Pourquoi aucune sonde ne l'a vu :** elles lisent toutes `site/*.js`, le
  fichier compilé. Un build périmé leur fait donc tester l'**ancien** moteur —
  et passer. Le commit disait « corrigé », les 17 étapes de contrôle étaient
  vertes, et le site servait le défaut. C'est exactement la famille de défaut
  que je traque depuis trois jours, mais un étage au-dessus : **cette fois
  c'est la chaîne de contrôle elle-même qui mentait.**

  Deux choses faites :
  - **Le moteur en ligne est recompilé** — les trois verdicts faux sont
    corrigés pour de vrai cette fois.
  - **`npm run verif:build`** recompile dans un dossier à part et compare octet
    pour octet. Placé **en première position** du travail « moteur » en CI,
    avant les tests : il décide si les étapes suivantes mesurent quelque chose.
    Sabotage de contrôle — fichier périmé remis : `PÉRIMÉ — 26 901 octets
    servis, 28 266 attendus`, sortie en erreur.

  *Note de méthode :* j'avais lancé la suite complète **avant** le rebase, donc
  sur mon état à moi. C'est en la relançant après fusion que l'écart est
  apparu. Une suite verte sur un état qui n'est pas celui qu'on pousse ne
  prouve rien.

- **Deux audits, aucun défaut — et les deux sont maintenant gelés** *(13 août)*
  — audit de cycle, les 7 éléments de la file étant tous bloqués. **Le résultat
  honnête de ce cycle est « rien de cassé », et je ne fabrique pas une
  correction pour avoir l'air utile.**

  **1. Le stockage local en panne.** Navigation privée, stockage plein,
  navigateur qui refuse — Safari iOS a longtemps levé une exception sur
  `setItem` en navigation privée. L'historique est un confort ; le **verdict**
  ne doit jamais en dépendre.

  | Panne injectée | verdict rendu |
  |---|---|
  | `setItem` lève *(quota / privé)* | DOUTEUX ✓ |
  | `getItem` **et** `setItem` lèvent | DOUTEUX ✓ |
  | `localStorage` carrément absent | DOUTEUX ✓ |

  **3 sur 3.** Les cinq écritures sont déjà dans un `try`, et aucune lecture au
  démarrage n'est laissée nue.

  **2. La caméra refusée, absente, ou occupée.** `sonde:saisie` simulait une
  panne du **lecteur**, caméra accordée. Le refus de la **caméra** — le cas le
  plus fréquent, on tape « Refuser » par réflexe — n'avait jamais été vérifié.

  | Panne | message | champ visible | après saisie du code |
  |---|---|---|---|
  | `NotAllowedError` | « Caméra **refusée** — autorise-la… » | oui | verdict ✓ |
  | `NotFoundError` | « Caméra indisponible ici… » | oui | verdict ✓ |
  | `NotReadableError` | « Caméra indisponible ici… » | oui | verdict ✓ |
  | pas de `mediaDevices` | « Caméra indisponible ici… » | oui | verdict ✓ |

  **4 sur 4**, avec le bon message dans chaque cas — le refus est distingué de
  l'absence, ce qui n'est pas la même action pour l'utilisateur.

  **Ce que ce cycle produit :** ces six chemins ne cassent pas *aujourd'hui*,
  mais rien ne les empêchait de casser demain. `sonde:saisie` gagne 3 scènes,
  `sonde:historique` en gagne 3. Sabotages de contrôle : message de refus
  remplacé par « Erreur. » → rouge ; une lecture de stockage laissée nue au
  démarrage → 2 scènes sans verdict, rouge.

- **L'adresse IP de chaque visiteur partait chez Google, sans que les mentions
  légales le disent** *(13 août)* — audit de cycle, les 7 éléments de la file
  étant tous bloqués.

  Question posée : **le site dit-il la vérité sur ce qu'il envoie ?** Les
  claims de l'accueil sont sobres et exacts (« gratuit, sans compte », « tes
  scans restent sur ton téléphone » — c'est du `localStorage`, c'est vrai).
  Mais en comparant les hôtes réellement contactés à ceux que la page
  « mentions légales » déclare :

  | Hôte contacté | déclaré ? |
  |---|---|
  | `world.openfoodfacts.org`, `world.openbeautyfacts.org` | oui |
  | `halalgpt.fr` | oui |
  | GitHub Pages *(hébergeur)* | oui |
  | **`fonts.googleapis.com`, `fonts.gstatic.com`** | **non** |

  Les 4 pages sur 4 chargeaient DM Sans et Playfair Display chez Google. Le
  mot « Google » apparaissait bien 3 fois dans `mentions-legales.html` — mais
  **les 3 occurrences étaient ses propres balises `<link>` dans le `<head>`**.
  Pas un mot dans le corps de la page.

  Même décision que pour le lecteur ZXing le 12 août, pour la même raison : on
  sert les fichiers nous-mêmes.

  | | avant | après |
  |---|---|---|
  | hôtes tiers à l'ouverture de l'accueil | **2** | **0** |
  | idem, page additifs et mentions légales | **2** | **0** |
  | hôtes tiers sur le scanner | 3 | **1** — `halalgpt.fr`, déclaré |
  | polices disponibles hors ligne | non | oui |

  Récupérées depuis **npm** (`@fontsource/*`), pas depuis un site : sous-ensemble
  latin, graisse normale, 7 fichiers, 148 Ko — mais un navigateur ne télécharge
  que les graisses qu'il **affiche**. Elles ne sont donc pas dans la liste
  pré-chargée du service worker : elles entrent dans le cache à la première
  utilisation réelle, comme ZXing. Empreintes SHA-256 et procédure de mise à
  jour dans `site/vendor/polices/README.md`. Licence OFL, qui autorise
  explicitement l'auto-hébergement.

  *Ce que la mesure a corrigé chez moi :* j'allais retirer Playfair 900 pour
  économiser 22 Ko. La mesure des requêtes réelles montre que **l'accueil le
  charge** — il est utilisé. Gardé.

  Gelé dans `verif:chiffres` (en CI) : aucune page ne peut charger depuis
  `fonts.googleapis`, `fonts.gstatic`, jsDelivr, unpkg ou cdnjs, et tout
  fichier de police nommé doit exister. Sabotage de contrôle — un `<link>`
  Google remis sur l'accueil : sortie en erreur.

- **32 secondes d'écran de chargement en rayon** *(12 août)* — audit de cycle,
  les 7 éléments de la file étant tous bloqués. Cette fois le défaut n'est pas
  un verdict faux : c'est un verdict qui n'arrive jamais.

  En rayon, le réseau n'est pas absent, il est **lent** — le cas que la
  compétence `repondre-en-conditions-degradees` décrit, et le commentaire du
  code disait déjà « une requête qui traîne dix secondes est pire qu'un échec
  immédiat ». C'était vrai de la **requête**, pas de la **recherche**.

  `fetchCourt` coupe bien chaque requête à 4 s. Mais `chercherProduit` en
  enchaîne **quatre par code candidat** (Open Food Facts v2 et v0, puis Open
  Beauty Facts v2 et v0), et un code à 12 chiffres a **deux** candidats. Rien
  ne bornait l'ensemble.

  Mesuré, chaque réponse arrivant en 10 s :

  | | avant | après |
  |---|---|---|
  | code à 13 chiffres | **16,6 s**, 4 requêtes | **6,3 s**, 2 requêtes |
  | code à 12 chiffres | **32,2 s**, 8 requêtes | **6,2 s**, 2 requêtes |
  | témoin, réseau normal | 0,3 s, 4 requêtes | 0,4 s, 4 requêtes |

  Une demi-minute devant un écran de chargement, dans un rayon, en 3G — après
  quoi la personne repose le produit.

  Un **budget de 6 s borne la recherche entière** : on n'ouvre pas une requête
  de plus si le temps est écoulé, et la dernière est raccourcie à ce qu'il
  reste. Le chemin normal est intact : les quatre adresses sont toujours
  essayées quand elles répondent vite. Et ne rien trouver n'est pas une
  impasse — l'écran « produit non référencé » propose la lecture par photo, qui
  sait lire une étiquette maghrébine.

  Gelé dans `sonde:hors-ligne`, qui couvre maintenant les deux conditions
  dégradées — réseau lent **et** réseau coupé. Sabotage de contrôle — budget
  retiré : 16,3 s et 32,2 s, la sonde vire au rouge.

- **Un savon au suif rangé dans la base alimentaire ressortait HALAL**
  *(12 août)* — audit de cycle, les 7 éléments de la file étant tous bloqués.

  L'aiguillage vers le moteur cosmétique se fait sur la **base d'origine** :
  cosmétique si le produit vient d'Open Beauty Facts. Or Open Food Facts est
  interrogé **en premier**, et contient des savons, dentifrices et crèmes. Ces
  produits partent donc au moteur alimentaire, qui ne lit pas l'INCI.

  | Liste INCI trouvée dans la base alimentaire | avant | après |
  |---|---|---|
  | `Sodium Tallowate, Aqua, Parfum` *(savon au suif)* | **HALAL** | HARAM |
  | `Aqua, Adeps Suillus, Cetyl Alcohol` *(graisse de porc)* | **HALAL** | HARAM |
  | `Aqua, Hydrolyzed Keratin, …` | **HALAL** | DOUTEUX |
  | `Aqua, Hydrolyzed Collagen, Glycerin` | **HALAL** | DOUTEUX |
  | `Alcohol Denat., Aqua, Parfum` | **HALAL** | DOUTEUX |

  **6 listes INCI réalistes sur 7 ressortaient HALAL.**

  **Ce que je n'ai pas fait, et pourquoi :** faire tourner les deux moteurs sur
  tout serait l'erreur inverse, et je l'ai mesurée — « glycérine végétale, eau,
  parfum » passe DOUTEUX chez le cosmétique alors que l'étiquette dit
  *végétale*. **1 faux positif sur 15** compositions banales.

  D'où un marqueur, et pas un autre : **« Aqua »**, le nom INCI de l'eau.
  Aucune étiquette alimentaire française ne l'emploie — elle écrit « eau ».
  Vérifié : **7 listes INCI sur 7 reconnues, 0 aliment sur 19 pris à tort.**
  Quand le marqueur est là, le second moteur tourne et ne peut que **durcir**,
  les alertes des deux étant fusionnées sans doublon.

  Gelé dans `sonde:verdicts` : **12 → 17 scènes**, dont deux aliments témoins
  qui doivent rester HALAL. Sabotage de contrôle — second avis retiré :
  3 scènes repassent HALAL, la sonde vire au rouge.

- **Une faute de frappe dans `verifications.json` mettait le sceau vert sur du
  porc** *(12 août)* — audit de cycle, les 7 éléments de la file étant tous
  bloqués. C'est le défaut le plus grave trouvé jusqu'ici : il touche le moat
  lui-même.

  Une fiche vérifiée **prime** sur l'analyse — son statut s'affiche, les
  alertes du moteur sont effacées. Le statut n'était jamais contrôlé, et
  l'écran retombait sur le vert :

  ```js
  $("verdict-emoji").textContent = EMOJIS[verif.statut] || "✅";
  ```

  Mesuré sur un pâté dont la composition dit « foie de porc, lardons » :

  | Fiche saisie à la main | avant | après |
  |---|---|---|
  | `statut: "Halal"` *(majuscule)* | **✅, sceau, label vide** | ✅ HALAL, sceau |
  | `statut: "halall"` | **✅, sceau, 0 alerte** | ❌ HARAM, pas de sceau |
  | statut absent | **✅, sceau, 0 alerte** | ❌ HARAM, pas de sceau |
  | statut vide | **✅, sceau, 0 alerte** | ❌ HARAM, pas de sceau |
  | `statut: "oui"` | **✅, sceau, 0 alerte** | ❌ HARAM, pas de sceau |

  **5 sur 5 → 0.** Et le label restait vide : aucun mot ne venait contredire la
  pastille verte. La classe CSS devenait `verdict-halall`, `verdict-undefined`,
  `verdict-oui` — sans correspondance, donc même la couleur ne signalait rien.

  **C'est le fichier que Mohamed remplira à la main**, en recopiant des
  réponses de fabricants. La faute de frappe y est le cas normal, pas le cas
  rare — et la base est encore vide, donc le correctif arrive avant la première
  fiche, pas après.

  Deux serrures :
  - **À l'exécution :** une fiche illisible est traitée comme absente, on
    retombe sur l'analyse automatique, qui dit la vérité de la composition. Le
    repli d'emoji est ❓, plus jamais ✅. Une majuscule est simplement
    normalisée — c'est une faute sans ambiguïté.
  - **Avant la mise en ligne :** `npm run verif:chiffres` (en CI) refuse de
    passer si une fiche porte un statut inconnu, ou n'a ni source ni date, ou
    si la clé n'est pas un code-barres. Vérifié en injectant deux fiches
    fautives : 3 défauts, sortie en erreur.

  Gelé dans `sonde:verdicts` : **6 → 12 scènes**. Sabotage de contrôle — filtre
  retiré : 5 scènes repassent au sceau vert, la sonde vire au rouge.

- **La lecture photo affichait ✅ HALAL sur du saindoux** *(12 août)* — audit de
  cycle, les 7 éléments de la file étant tous bloqués.

  Question posée : **le chemin photo consulte-t-il nos règles ?** Réponse :
  non. Il affichait tel quel le verdict rendu par `halalgpt.fr/api/etiquette`.
  Nos règles locales — celles qui attrapent lardons, saindoux, vin — n'étaient
  jamais consultées sur le verdict. Elles servaient uniquement à graduer la
  gravité, et **par le moteur cosmétique**, qui ne connaît ni « Saindoux » ni
  « Lardons ».

  Ce que la personne voyait, réponse `{verdict:"halal",
  ingredients_a_risque:[{nom:"Saindoux"}]}` — mesuré sur le vrai écran :

  ```
  ✅ HALAL — Rien de problématique détecté.
  SI C'EST UN COSMÉTIQUE — … la transformation chimique lève le problème …
  ⚠️ Saindoux — graisse de porc
  ```

  **Trois défauts sur le même écran.** Un verdict vert sur du porc, avec
  l'aveu juste en dessous. Un bandeau cosmétique devant une étiquette
  alimentaire. Et, en verdict DOUTEUX, la phrase *« le point à vérifier, c'est
  Saindoux : cet ingrédient existe en version végétale comme animale »* —
  **factuellement fausse**, le saindoux EST de la graisse de porc.

  Ce chemin est celui recommandé pour les produits maghrébins absents des
  bases. **Le moins vérifié était celui du public visé.**

  | Réponse du service | avant | après |
  |---|---|---|
  | `halal` + Saindoux | **✅ HALAL** | ❌ HARAM |
  | `halal` + Lardons | **✅ HALAL** | ❌ HARAM |
  | `halal` + Sodium Tallowate *(INCI)* | **✅ HALAL** | ❌ HARAM |
  | `haram` + ingrédient inconnu de nos tables | ❌ HARAM | ❌ HARAM |

  **La règle ne va que dans un sens.** Le service a vu l'étiquette entière,
  nous n'avons que les noms qu'il signale : nous ne pouvons jamais l'adoucir.
  Mais s'il dit « halal » alors qu'un de ces noms est interdit chez nous, le
  nôtre l'emporte. Les deux moteurs sont interrogés, la photo servant aussi
  bien une étiquette alimentaire qu'une liste INCI.

  Quand nous durcissons, le résumé du service décrivait encore l'ancien verdict
  (« Rien de problématique détecté » sous ❌ HARAM) : il est remplacé par
  l'explication de l'écart. Et le bandeau cosmétique se tait devant un interdit
  alimentaire.

  `sonde:photo` passe de **6 à 10 scènes**. Sabotage de contrôle — confiance
  aveugle rétablie : 3 scènes repassent HALAL, la sonde vire au rouge.

- **« non-halal » était lu comme une certification halal** *(12 août)* — audit
  de cycle, les 7 éléments de la file étant tous bloqués sur Mohamed ou sur la
  politique réseau.

  Question posée : **sur quoi repose l'affirmation « certifié halal ✓ » ?**
  C'est la plus forte que ce produit fasse. Réponse trouvée dans le code :
  `labels.some(l => l.includes("halal"))`. Or **« en:non-halal » contient
  « halal »**.

  | Étiquette de la base, sur une composition à la gélatine | avant | après |
  |---|---|---|
  | `en:non-halal` | **HALAL, certifié ✓** | DOUTEUX |
  | `en:not-halal` | **HALAL, certifié ✓** | DOUTEUX |
  | `fr:non-halal` | **HALAL, certifié ✓** | DOUTEUX |
  | `en:halal-not-certified` | **HALAL, certifié ✓** | DOUTEUX |
  | `en:no-halal-certification` | **HALAL, certifié ✓** | DOUTEUX |
  | `fr:sans-certification-halal` | **HALAL, certifié ✓** | DOUTEUX |
  | `en:non-vegan` | **HALAL** *(raccourci végane)* | DOUTEUX |
  | `fr:non-vegetalien` | **HALAL** *(raccourci végane)* | DOUTEUX |

  **8 sur 8 → 0.** C'est l'inversion la plus grave possible : le produit
  affirmait le contraire de ce que la base disait, et l'affichait avec le
  sceau. Même famille de défaut que « lardons » attrapé par `\blard\b` — une
  sous-chaîne qui ne regarde pas le mot autour.

  **Le doute penche désormais toujours du même côté** : en cas d'ambiguïté, on
  ne certifie pas. Une certification manquée affiche DOUTEUX avec une
  explication ; une certification inventée fait manger du porc.

  Et parce que se taire serait aussi un mensonge : une composition **propre**
  portant `en:non-halal` ne ressort plus HALAL en silence, elle porte
  l'alerte « La base indique que ce produit n'est PAS halal. Cette information
  vient de contributeurs, pas d'un organisme : à vérifier sur l'emballage. » —
  ce que la base dit, sans en faire un interdit inventé.

  Contrecoup vérifié : les 8 vraies certifications (`en:halal`, `fr:halal`,
  `en:certified-halal`, `fr:certifie-halal`, `en:halal-certified`,
  `fr:viande-halal`, `en:vegan`, `fr:vegetalien`) certifient toujours. Même
  correctif dans le moteur cosmétique.

  Gelé dans `sonde:faux-negatifs` (section E) : **66 → 82 cas**. Sabotage de
  contrôle — `includes()` naïf remis : 6/8 repassent HALAL, la sonde vire au
  rouge.

- **16 façons d'écrire « on ne sait pas » rendaient HALAL** *(12 août)* — audit
  de cycle : les 6 éléments de la file étaient tous bloqués sur Mohamed ou sur
  la politique réseau, donc j'ai mesuré au lieu d'attendre.

  Question posée au moteur : **que rend-il quand l'étiquette est absente ou
  inutilisable ?** C'est le cas le plus fréquent des bases mondiales, et le
  plus dangereux — un verdict rendu sans preuve est un verdict inventé.

  | | avant | après |
  |---|---|---|
  | formulations d'absence testées | 28 | 28 |
  | qui rendaient **HALAL sans aucune preuve** | **16** | **0** |

  Parmi elles : « non renseigné » (12 lettres, **pile le seuil**),
  « information non disponible », « aucune information », « voir l'emballage »,
  « see packaging », « ingrédients non disponibles », « not available ».

  **La cause :** le garde-fou comptait les lettres latines — 12 minimum — sans
  regarder ce qu'elles disaient. Une phrase qui dit « on ne sait pas » est
  faite de lettres, donc elle passait pour une composition lisible, donc
  « aucune alerte » devenait « halal ». Les rares qui échappaient n'échappaient
  que par leur longueur : « azertyuiop » sortait INCONNU à 10 lettres et serait
  passé HALAL à 12.

  Concrètement : une charcuterie dont la base ne connaît pas la composition
  ressortait **verte**.

  **Le correctif retire ces mentions avant de compter**, plutôt que de rejeter
  le texte entier — sinon on tombe dans l'excès inverse. Vérifié :
  « Sucre, cacao maigre, noisettes. Voir emballage pour les allergènes. » garde
  25 lettres utiles et reste HALAL ; « Voir emballage. Contient du lard fumé. »
  reste HARAM. Même défaut, même correctif dans le moteur cosmétique.

  Gelé dans `sonde:faux-negatifs` (section D, en CI depuis ce matin) : **30 → 66
  cas**. Sabotage de contrôle — garde-fou retiré : 15/15 repassent HALAL, la
  sonde vire au rouge.

  *Ce que je n'ai pas tranché :* un produit **sans texte** mais avec un seul
  additif sans risque (`additives_tags: ["en:e330"]`) ressort HALAL. C'est
  peut-être trop généreux — voir élément 7.

- **Deux gardes-fous sur cinq étaient des feux verts — et l'un cachait un vrai
  défaut** *(12 août)* — élément 6 de la file. Chacune des cinq sondes d'écran
  jamais éprouvées a reçu une régression volontaire.

  | Sonde | Sabotage | Verdict |
  |---|---|---|
  | `verdicts` | filtre du label certifié retiré | **rouge** — « CONTRADICTION dans le même écran » |
  | `historique` | `statutAJour` ne recalcule plus | **rouge** — statuts restés `halal, halal` |
  | `saisie` | l'invite ne parle plus de chiffres | **rouge** — 2 défauts |
  | `pays` | « au Maroc » → « en Maroc » | **VERTE** ← aveugle |
  | `hors-ligne` | `additifs.html` retiré du pré-chargement | **VERTE** ← aveugle |

  **`sonde:pays` ne cherchait que l'ancien défaut** — les motifs « dans le /
  dans la / dans les / dans l' » d'août 2025. La page affichait « Les produits
  enregistrés **en Maroc** », faute de français sur le pays du public
  principal, et la sonde répondait ✓. Elle compare maintenant à la forme
  attendue, **pays par pays, 24 formes écrites d'après la grammaire et non
  recopiées de la source** — une sonde qui recopie sa source ne compare rien.
  Ajout : **la France**, que la sonde ignorait alors que Mohamed a demandé les
  produits de France. Elle a sa phrase à elle (« marque de distributeur »), et
  la sonde refuse désormais qu'un code français reçoive la phrase d'un pays
  lointain. 24 → 25 cas, les deux sabotages virent au rouge.

  **`sonde:hors-ligne` ne coupait pas le réseau.** Elle utilisait
  `setOffline(true)`, dont je savais depuis ce matin qu'il **n'atteint pas les
  requêtes du service worker** — sans en tirer la conséquence ici. Le service
  worker allait donc chercher les pages sur le réseau et la sonde déclarait le
  pré-chargement bon. Elle **arrête maintenant le serveur** : s'il n'y a plus
  personne au bout du fil, ce qui s'affiche vient forcément du cache. Un
  contrôle de la coupure elle-même a été ajouté — une adresse jamais visitée
  doit échouer, sinon la sonde ment.

  **Et là, un vrai défaut est apparu, invisible jusqu'ici :**

  | Serveur réellement coupé | Avant | Après |
  |---|---|---|
  | `scan.html` | s'ouvre | s'ouvre |
  | `scan.html?code=3017620422003` | **ne s'ouvre pas du tout** | s'ouvre, verdict affiché |

  Le cache est indexé sur l'adresse complète, question comprise, et cette
  adresse-là n'y est jamais. Or c'est **le lien que l'app fabrique quand on
  partage un produit** (« Scanné avec HalalCheck ») et celui par lequel
  HalalGPT envoie les gens ici. Quelqu'un reçoit ce lien sur WhatsApp, le
  touche dans un rayon sans réseau — rien, alors que la page était sur son
  téléphone. Corrigé dans `sw.js` : à défaut de l'adresse exacte, une
  navigation retombe sur la même page sans son « ? ». Le code est lu à
  l'exécution depuis `location.search`, donc le bon produit s'affiche.

  *Deuxième fois aujourd'hui que mon propre instrument fabrique le défaut :* ma
  première version du contrôle de coupure **naviguait** vers une adresse
  injoignable. Chromium affiche alors sa page d'erreur, qui n'est plus
  contrôlée par le service worker, et la navigation suivante repart au réseau.
  La sonde annonçait « accueil NON SERVIE » alors que l'accueil sortait très
  bien du cache — 2 898 caractères, vérifié à part. Le contrôle cassait ce
  qu'il mesurait. Il se fait maintenant par `fetch` depuis la page en cours.

  **Bilan : 5 sondes sur 5 savent maintenant virer au rouge** (8 sur 8 avec
  photo et contraste, éprouvées ce matin).

- **L'écran est enfin contrôlé tout seul, et pas seulement le moteur**
  *(12 août)* — élément 6 de la file, ouvert et refermé le même jour. Suite
  directe de l'entrée ci-dessous : ce matin les contrôles de moteur ont appris
  à virer au rouge ; ceux de l'écran ne tournaient nulle part.

  | | avant | après |
  |---|---|---|
  | étapes de contrôle au push | 5 | **17** |
  | sondes qui ouvrent un navigateur, lancées automatiquement | **0 / 8** | 8 / 8 |
  | sondes sans navigateur oubliées hors CI | 2 | 0 |

  *Correction de ce que j'ai écrit ce matin :* j'avais annoncé « 10 sondes qui
  ouvrent un vrai navigateur ». **C'est faux, elles sont 8.** Les deux autres —
  `sonde:inci` (noms INCI cosmétiques) et `verif:chiffres` (les nombres et les
  dates annoncés sur le site) — ne demandent aucun navigateur, savaient déjà
  sortir en erreur, et ne tournaient nulle part depuis des jours. Deux lignes
  de workflow, deux secondes d'exécution.

  **La sonde photo ne pouvait pas échouer non plus.** Elle jouait six façons de
  rater la lecture d'étiquette et n'en comparait aucune. Deux promesses gelées,
  celles qui comptent :

  - *« Ce n'est pas ta photo »* sur une panne de service (500, réponse
    illisible, JSON sans verdict). C'est littéralement la plainte de Mohamed le
    10 août — l'app le renvoyait à sa photo alors que la panne était chez nous.
  - *La photo est compressée avant l'envoi :* **2,97 Mo → 0,20 Mo**. Sans ça,
    3 Mo à envoyer depuis un rayon en 3G.

  **Éprouvé contre des régressions volontaires**, parce qu'un garde-fou jamais
  attaqué ne prouve rien :

  | Sabotage | Résultat |
  |---|---|
  | redimensionnement retiré | **rouge** — 1,07 Mo envoyés au lieu de 0,20 |
  | « Ce n'est pas ta photo » remplacé par « reprends la photo » | **rouge** — scène 3 |
  | `--creme` passée en gris (#6B6B63) | **rouge** — 3,3 < 4,5 sur « Caméra indisponible ici » |

  *Ce que je n'ai pas fait, et je ne le revendique pas :* cinq des huit sondes
  (saisie, verdicts, historique, pays, hors-ligne) n'ont **pas** été éprouvées
  contre une régression volontaire. Elles contiennent bien un `process.exit(1)`
  et passent aujourd'hui ; je n'ai pas vérifié qu'elles savent virer au rouge.
  C'est exactement l'erreur que je viens de corriger ailleurs — à faire.

  *Durée mesurée :* environ 5 minutes pour les huit dans l'atelier. Le travail
  tourne à côté de « moteur », il ne le retarde pas.

- **Trois contrôles automatiques sur cinq ne pouvaient pas virer au rouge**
  *(12 août)* — réponse à Mohamed : « je n'arrête pas de remonter des
  problèmes avec des captures d'écran, ce n'est pas normal ».

  La ronde ne trouve jamais rien sur halalcheck.fr. Vérifié dans le journal du
  robot plutôt que supposé : `halalcheck.fr  7 pages · 0 defauts dont 0
  graves` (exécution du 12 août 08:22 UTC). Le robot atteint bien le site.
  Mais ses **16 contrôles portent tous sur l'enveloppe HTML** — code de
  réponse, vitesse, `<html lang>`, `<title>`, description, `<h1>`, données
  structurées, sitemap. Aucun n'ouvre la caméra, ne saisit un code-barres, ne
  lit un verdict. Sur un site de 4 pages dont toute la valeur est ce qui se
  passe *après* le JavaScript, il rendra 0 défaut quoi qu'il arrive.

  Restaient donc les contrôles au push. **Trois des cinq étaient décoratifs :**

  | Sonde | Avant | Après |
  |---|---|---|
  | faux-négatifs | affiche les manques, **sort en succès** | sort en erreur |
  | faux-positifs | affiche `FAUX POSITIFS : n`, **sort en succès** | sort en erreur |
  | étiquettes arabes | **n'attend aucune valeur**, imprime 7 lignes | 7 verdicts promis, gelés |

  **Mesuré, pas déduit.** J'ai cassé le moteur exprès — la règle texte
  `/gelatine/` remplacée par un motif impossible. « eau, sucre, gélatine,
  arôme » ressortait **HALAL, 0 alerte**, et les trois sondes sortaient en
  succès : contrôle vert, push accepté, mise en ligne acceptée. Le seul
  détecteur restant, c'était Mohamed devant son téléphone.

  Refait après correction, dans les deux directions :

  | Sabotage | faux-nég. | faux-pos. | arabe |
  |---|---|---|---|
  | *(aucun — moteur propre)* | ✓ | ✓ | ✓ |
  | gélatine non détectée *(interdit qui passe)* | **rouge** | ✓ | **rouge** |
  | garde « vinaigre de vin » retirée *(licite accusé)* | ✓ | **rouge** | ✓ |

  Le premier sabotage a révélé un trou dans la sonde elle-même : elle restait
  verte parce qu'elle ne testait **pas le mot « gélatine »**, seulement le code
  E441, qui passe par une autre règle. Ses 14 mots étaient tous techniques ou
  anglais (*rennet, tallow, shortening*). Ajouté le vocabulaire d'une étiquette
  ordinaire — gélatine, porc, lardons, saindoux, jambon, bacon, couenne, suif,
  présure, carmin, cochenille, rhum, vin blanc, bière, boyau naturel,
  L-cystéine, stéarate de magnésium. **14 → 33 mots, 30 → 49 cas**, tous
  attrapés aujourd'hui. Le total est compté, plus écrit à la main.

  *Ce que ça ne règle pas :* les 10 sondes qui ouvrent un vrai navigateur
  (caméra, contraste, hors-ligne, historique) ne tournent toujours qu'à la
  main. C'est là que vivent la plupart des captures d'écran de Mohamed.
  Prochain élément de la file, pas revendiqué ici.

- **Le lecteur de codes-barres se met de côté pendant qu'on lit l'accueil**
  *(12 août)* — l'élément 6 de la file, refermé sans imposer le choix qu'il
  annonçait.

  Le problème posé : sur Safari iOS et Firefox, le scanner doit télécharger un
  lecteur de 96 Ko compressés, absent des 12 fichiers pré-chargés. Quelqu'un
  qui installe l'app, ne scanne rien, puis se retrouve sans réseau en rayon n'a
  pas de lecteur. L'alternative annoncée était : imposer 96 Ko à tout le monde,
  ou laisser le trou.

  **Il y avait une troisième voie, et elle ne coûte rien à personne :** la page
  d'accueil sait si le navigateur a un lecteur intégré. S'il n'en a pas, elle
  met le fichier de côté tranquillement pendant qu'on lit la page
  (`requestIdleCallback`), et le service worker le garde.

  | Après une simple visite de l'accueil | Fichiers en cache | Lecteur présent |
  |---|---|---|
  | Chrome, Edge *(lecteur intégré)* | 12 | **non — ils ne paient rien** |
  | Safari iOS, Firefox | **13** | **oui** |

  *Ce que je n'ai pas pu mesurer :* la conséquence hors ligne elle-même.
  `setOffline` de l'outil de test ne s'applique **pas** aux requêtes émises par
  le service worker — vérifié : hors ligne, une requête de la page échoue bien,
  mais celle du service worker passe. Huitième instrument pris en défaut
  aujourd'hui. Je mesure donc ce qui est mesurable — le fichier est dans le
  cache — et j'en déduis le reste sans le prétendre observé.

  Garde-fou : le chemin du fichier est écrit à la main dans deux pages, avec
  son numéro de version. `npm run verif:chiffres` refuse désormais de passer si
  ce fichier n'existe pas, ou si les deux pages ne nomment pas la même version.

- **Deux audits, aucun défaut — et c'est aussi une mesure** *(12 août)* :
  le poids des pages et le fonctionnement complet sans réseau.

  **Poids d'une première visite, compressé** (ce qui voyage réellement) :

  | | Brut | Compressé |
  |---|---|---|
  | accueil | 28 Ko | **7 Ko** |
  | scanner | 116 Ko | **31 Ko** |
  | page additifs | 77 Ko | **12 Ko** |
  | lecteur de codes-barres | 328 Ko | **96 Ko** |

  Un scan complet coûte donc ~45 Ko compressés sur Chrome et Edge, ~140 Ko sur
  les navigateurs qui ont besoin du lecteur. Rien à corriger.

  *Note de méthode :* ma première mesure annonçait **489 Ko** pour le scanner
  et 3,8 s d'attente en 3G lente. Chiffres bruts : le serveur de l'atelier
  n'envoie pas de compression, GitHub Pages si. Septième fois qu'un instrument
  mesure autre chose que ce qu'il prétend. Mesurer le brut quand c'est le
  compressé qui voyage, c'est se tromper d'un facteur 3,7.

  **Hors réseau, coupure totale après une première visite :** les 4 pages sont
  servies (2 898, 335, 16 063 et 4 217 caractères lisibles), et le verdict d'un
  produit déjà scanné s'affiche avec la mention honnête « 📴 Hors connexion —
  fiche gardée en mémoire sur cet appareil ». 4 sur 4.

  Sonde conservée : `npm run sonde:hors-ligne`.

- **Le sitemap disait à Google que rien n'avait bougé depuis deux jours**
  *(12 août)* — le jour où le plus de corrections sont parties en ligne.

  Le `lastmod` du sitemap est ce que Google lit pour décider s'il revient
  recharger une page. Il était écrit à la main, indépendant des pages :

  | Page | Date déclarée par la page | Date annoncée au moteur |
  |---|---|---|
  | accueil | 11 août | **9 août** |
  | scan | 11 août | **9 août** |
  | additifs | 11 août | **10 août** |
  | mentions légales | 11 août | **9 août** |

  **4 sur 4 en retard**, de un à deux jours. `seo:dates` mettait bien à jour la
  date *dans* chaque page — meta, données structurées, mention visible — mais
  ignorait le sitemap. On corrigeait un verdict faux le matin et on demandait
  au moteur de ne pas revenir voir.

  Réparé au même endroit que le reste : `npm run seo:dates` recale désormais
  le sitemap depuis l'historique git, page par page. Mesure après :
  **4 dates sur 4 identiques** à celles des pages.

  Le contrôle `npm run verif:chiffres` couvre maintenant les deux familles
  d'affirmations vérifiables — les nombres et les dates : 5 + 4 contrôles.

- **Le panneau des messages caméra était écrit en noir sur fond noir**
  *(11 août)* — premier audit d'accessibilité du site : ce que reçoit
  quelqu'un qui écoute la page avec un lecteur d'écran, ou qui lit mal les
  gris clairs.

  **Ce qui était déjà bon, mesuré sur les 4 pages :** 0 bouton ou lien sans
  nom accessible, 0 image sans `alt`, 0 champ atteignable sans étiquette,
  `lang="fr"` partout, et **un seul h1 visible à la fois** sur scan.html —
  une affirmation que j'avais notée en août sans jamais la vérifier ; elle est
  maintenant mesurée, et le h1 porte bien le nom du produit sur l'écran de
  verdict.

  **Le défaut, et il est visible à l'œil nu :** `.etat-camera` pose un fond
  presque noir mais ne déclarait **aucune couleur de texte** — il héritait donc
  du texte sombre de la page. **Contraste 1,1 sur 4,5 requis.** C'est le
  panneau qui porte *tous* les messages de la caméra, y compris « Caméra
  refusée — autorise-la » et « saisis les chiffres ci-dessous » : ceux-là mêmes
  que j'ai réécrits toute la journée pour qu'ils soient justes. Ils étaient
  justes et illisibles. Le bouton torche juste à côté, lui, déclarait bien sa
  couleur.

  | | Textes au-dessus du seuil WCAG |
  |---|---|
  | Avant | 681 / 755 |
  | Après | **750 / 750** (+ 5 posés sur un dégradé, non mesurables) |

  Corrigés au passage : les gris à 0,42 et 0,45 d'opacité (fils d'Ariane,
  dates, « Mots repérés », « Aucun risque connu ») montaient à 2,5 seulement —
  passés à 0,66, soit 5,1 ; et le vert des textes « doute mineur » (3,5) a reçu
  sa variante lisible, sur le modèle de `--or-lisible` déjà utilisé ailleurs.

  *Note de méthode :* la sonde a menti **deux fois**. D'abord des contrastes
  **négatifs** — mathématiquement impossibles : elle lisait le troisième nombre
  de `rgb(18,38,26)` comme une opacité de 26. Puis 4 faux défauts « blanc sur
  crème, contraste 1,0 » : un dégradé ne se lit pas avec `backgroundColor`, le
  navigateur y répond « transparent ». Elle compte désormais ces cas à part au
  lieu de les accuser. Cinquième et sixième instrument fautif de la journée.

  Sonde conservée : `npm run sonde:contraste`, 750 textes, sortie en erreur au
  premier passage sous le seuil.

- **Sept chiffres écrits à la main sur l'accueil, qu'aucun contrôle ne tenait
  à jour** *(11 août)* — audit des promesses de la page d'accueil : chaque
  affirmation chiffrée confrontée au moteur.

  **Bonne nouvelle d'abord :** les 4 nombres affichés aujourd'hui sont
  **justes** — 56 additifs, 29 règles cosmétiques, 24 ingrédients, 109 au
  total. Rien de faux en ligne.

  **Le défaut est ailleurs :** ces nombres apparaissent **sept fois** sur
  l'accueil — dans le `<title>`, dans le bloc FAQ que Google lit, dans deux
  boutons et dans le corps de la page — et ils étaient écrits à la main,
  indépendants du moteur. Le générateur `build:additifs` ne touchait que
  `additifs.html`. Au premier additif ajouté, l'accueil devenait faux sans que
  personne ne le voie. Un site qui annonce un chiffre faux sur sa page
  d'accueil abîme la confiance exactement comme un verdict faux.

  Réparé à la règle, pas page par page : le générateur recale désormais
  l'accueil à la source. **Vérifié en cassant volontairement les nombres**
  (56 → 81, 29 → 44) : la génération suivante en a remis **8 sur 8** d'accord
  avec le moteur.

  Et un contrôle qui refuse de passer si quelqu'un les réécrit à la main sans
  régénérer : `npm run verif:chiffres`, 5 contrôles sur les deux pages.

  *Note de méthode :* ce contrôle a annoncé « 29 est faux, le moteur dit 28 ».
  C'était lui qui comptait mal — les règles cosmétiques vivent dans **trois**
  listes, pas deux, et il en oubliait une. Quatrième instrument fautif de la
  journée. Il compte maintenant à la même source que le générateur.

- **Chaque règle corrigée laissait une pastille verte périmée dans la liste
  des gens** *(11 août)* — le défaut le plus grave trouvé aujourd'hui, et une
  conséquence directe de tout le reste du travail de la journée.

  L'historique et les produits gardés enregistrent le **verdict**, pas la
  composition. Une quiche aux lardons scannée le matin — donc enregistrée
  « halal » avant la correction — restait affichée **✅ vert** l'après-midi,
  alors que le moteur rendait HARAM. C'est la première chose qu'on voit en
  ouvrant le scanner, et l'étoile « gardé » désigne précisément les produits
  auxquels quelqu'un fait le plus confiance.

  | | Ce que la liste affiche | Ce que le moteur dit |
  |---|---|---|
  | Avant | **✅ Quiche lardons ★** | HARAM |
  | Après | ❌ Quiche lardons ★ | HARAM |

  La fiche du produit, elle, est gardée telle quelle en cache (60 produits, et
  l'historique en compte 20 au maximum) : on peut donc **refaire le calcul** à
  l'affichage au lieu de croire la mémoire. Le statut corrigé est aussi
  réécrit dans les deux listes, pour rester juste quand la fiche sortira du
  cache. Sans fiche en cache, on garde le statut enregistré — inventer serait
  pire.

  *Note de méthode :* la première mesure n'a rien montré. La sonde écrivait le
  cache sous la clé `halalcheck.cache` alors que le code lit
  `halalcheck.produits` : elle testait un chemin qui n'existe pas. Troisième
  fois qu'une sonde ment avant de dire vrai. L'« avant » du tableau a été
  rejoué avec la bonne clé, correctif retiré, pour ne pas comparer deux choses
  différentes.

  Sonde conservée : `npm run sonde:historique`.

- **Un produit certifié halal affichait « certifié ✓ » ET « ⚠️ à vérifier »**
  *(11 août)* — le moteur avait été mesuré sous toutes les coutures ; l'écran
  qui montre son résultat, jamais en entier. Les six écrans lus intégralement.

  **Ce qui était déjà bon :** le DOUTEUX ne se contente pas du mot — il nomme
  l'ingrédient, donne la raison, renvoie à sa fiche, et montre la composition
  ligne par ligne. L'INCONNU ne ressemble jamais à un feu vert.

  **Le défaut :** sur un produit portant un label halal, l'écran disait en haut
  « HALAL — Produit certifié halal ✓ » et juste dessous
  « ⚠️ Viande — abattage halal à vérifier, **sauf certification** ». Le doute
  était donc levé par la certification, de l'aveu même de la règle, et on
  l'affichait quand même. Deux réponses contraires à la même question, dans le
  même écran.

  Corrigé des deux côtés : le moteur retire les doutes que le label répond —
  reconnus à leur propre formulation « sauf certification », **jamais un
  interdit** — et la composition ligne par ligne suit la même règle.

  **Le bug derrière le bug :** la première correction n'a rien changé, et la
  mesure l'a montré. `verdict` est déclaré dans un bloc `else` ; plus bas, hors
  de ce bloc, le nom désignait l'**élément `#verdict` du DOM** — les `id` sont
  exposés comme variables globales. L'expression était donc toujours vraie et
  le champ toujours vide, sans la moindre erreur JavaScript. Sans la sonde,
  j'aurais annoncé une réparation qui n'existait pas.

  Sonde conservée : `npm run sonde:verdicts`, six écrans lus en entier, elle
  sort en erreur si un écran dit deux choses à la fois. Contrôles : 73 tests,
  26/26 INCI, 0 faux positif.

- **Le moteur cosmétiques n'avait jamais été mesuré sur ce qu'il RATE**
  *(11 août)* — la sonde existante ne vérifiait que les faux positifs. La
  moitié cosmétique du produit n'avait donc aucun contrôle de détection, alors
  que la moitié alimentaire venait d'y révéler « lardons ».

  26 noms INCI tels qu'ils figurent sur les emballages européens :
  **16 conformes sur 26**, 8 vrais manques.

  | Nom INCI | Avant | Après |
  |---|---|---|
  | **Adeps Suillus** *(graisse de porc, nom latin)* | **muet** | interdit |
  | Adeps Bovis *(graisse de bœuf)* | muet | interdit |
  | Tallowamide DEA, Suet | muet | interdit |
  | Gelatine *(orthographe sans accent)* | muet | signalé |
  | Sodium Stearoyl Lactylate, Stearoyl Glutamate | muet | signalé |
  | Cysteine HCl | muet | signalé |

  Le pire est le premier : **« Adeps Suillus » est de la graisse de porc**, et
  le moteur ne disait rien. Même piège que « lardons » — `\btallow\b` et
  `\bgelatin\b` s'arrêtent au mot exact et laissent passer les dérivés.

  **Une incohérence entre les deux moteurs :** la cystéine était surveillée
  côté alimentaire et ignorée côté cosmétique, alors qu'elle est bien plus
  fréquente dans les lissages capillaires que dans le pain.

  **Deux manques laissés volontairement :** « Cetyl Esters » est aujourd'hui
  de synthèse dans la quasi-totalité des cas, et le spermaceti ne figure plus
  sur un emballage européen depuis des décennies. Une règle pour un ingrédient
  qui n'apparaît pas, c'est du bruit — la sonde les note comme attendus muets.

  Sonde conservée : `npm run sonde:inci`, 26 cas, elle sort en erreur au
  premier écart. Contrôles : 73 tests, 0 faux positif sur les trois sondes.

- **Dix pluriels manqués, et un interdit inventé** *(11 août)* — suite directe
  du défaut « lardons ». Si un `\blard\b` laissait passer « lardons », combien
  d'autres règles s'arrêtaient au mot exact ?

  **La première mesure était fausse** : en fabriquant des variantes
  automatiquement, elle a annoncé **226 formes manquées**. Presque toutes
  étaient du charabia — « agneaus », « vinss », « bacones ». L'instrument
  fabriquait le défaut. Refaite sur 27 formes qui figurent réellement sur des
  étiquettes françaises : **17 vues sur 27**.

  | Manqué | Statut avant | Après |
  |---|---|---|
  | jambons secs, canards, moutons, suifs | halal | douteux |
  | rhums, cidres, portos, whiskies | halal | haram |
  | collagènes marins, cystéines | halal | douteux |

  Les pluriels en **-x** (veaux, agneaux) et la ligature **œ** (bœuf) étaient
  déjà couverts — le générateur les avait mal formés, pas le moteur.

  **Et le défaut inverse, plus grave que les dix autres :**

  | Ingrédient | Avant | Après |
  |---|---|---|
  | extrait de **levure de bière** | **HARAM** | halal |
  | **vinaigre d'alcool** | **HARAM** | halal |

  La levure de bière est une levure séchée, sans une goutte d'alcool : le mot
  « bière » n'y désigne que son origine industrielle. Et le vinaigre d'alcool
  est le vinaigre blanc des moutardes et des cornichons — le code neutralisait
  déjà « vinaigre de vin » par décision explicite, mais pas celui-ci : deux
  produits de la même famille, deux verdicts opposés. **Un interdit inventé
  chasse les gens d'un aliment permis** et abîme la confiance autant qu'un
  « halal » faux. « Bière » seule reste HARAM, un test le vérifie.

  Contrôles : 8 nouveaux tests, les 73 passent, 0 faux positif sur les deux
  sondes, 14/14 sur les mots d'étiquette, page des additifs régénérée.

- **« Lardons » ressortait HALAL** *(11 août)* — demande de Mohamed : les
  produits vendus en France aussi. Vérifié plutôt qu'affirmé : 32 mots
  d'étiquette française passés au moteur, **21 conformes sur 32** au départ.

  **D'abord la réponse à la question :** les produits français marchent déjà
  de bout en bout. Code présent dans la base → écran de verdict avec ses
  alertes ; code absent → message adapté à la France (« fréquent pour les
  marques de distributeur et les nouveautés »), et non le message Maghreb.

  **Les quatre vrais défauts, tous corrigés :**

  | Mot d'étiquette | Avant | Après |
  |---|---|---|
  | **lardons** | **halal** | **haram** |
  | boyau naturel | halal | douteux |
  | cystéine écrite sans son code | halal | douteux |
  | acide stéarique, stéarate de magnésium | halal | douteux |

  Le premier est le plus grave que ce moteur ait produit : un produit au porc
  déclaré halal. La règle disait `\blard\b`, qui s'arrête au mot exact et
  laisse passer « lardons » — présent sur des centaines d'étiquettes
  françaises. Un test vérifie aussi que « milliard » ne déclenche rien.

  **Une incohérence corrigée dans la foulée :** la gélatine rendait DOUTEUX
  écrite en toutes lettres et **HARAM** sous son code E441 — la même substance,
  deux verdicts selon la façon dont l'étiquette l'écrit. Une gélatine sans
  origine précisée peut être bovine : « interdit » est un verdict que
  l'étiquette ne permet pas. Aligné sur DOUTEUX, conformément à la doctrine.
  « Gélatine de porc » reste HARAM, avec ses deux alertes.

  **Trois écarts n'en étaient pas** — jambon, présure animale, graisse animale
  ressortent DOUTEUX là où j'attendais HARAM. C'est le moteur qui a raison :
  le jambon de dinde existe, la présure peut venir d'un veau abattu selon les
  règles, la graisse animale peut être bovine. Mon attente était plus sévère
  que la réalité de l'étiquette.

  Contrôles : 6 nouveaux tests, les 65 passent, 0 faux positif sur les deux
  sondes, page des additifs régénérée (109 règles publiées).

- **« Les produits enregistrés DANS LE Maroc »** *(11 août)* — question de
  Mohamed : est-ce que les produits du Maghreb sont pris en compte ? Vérifié
  point par point plutôt que répondu de mémoire.

  **Ce qui marche déjà, mesuré :**

  | Cas propre au Maghreb | Verdict rendu |
  |---|---|
  | codes E écrits dans le texte, base sans additifs déclarés | DOUTEUX — E471, E120 repérés |
  | étiquette bilingue, gélatine côté arabe seulement | DOUTEUX |
  | étiquette en arabe seul, présure | DOUTEUX |
  | étiquette en arabe seul, porc | HARAM |
  | étiquette illisible (photo floue) | INCONNU — jamais « halal » par défaut |
  | code-barres 611 absent des bases | écran dédié + lecture par photo |

  **Le défaut trouvé en vérifiant :** la phrase affichée sur cet écran disait
  « Les produits enregistrés **dans le** Maroc », « dans l'Algérie », « dans
  les Émirats ». Ce n'est pas du français, et c'est adressé précisément aux
  gens dont c'est le pays — une phrase bancale décrédibilise le verdict qui la
  suit. Le code contenait bien un `.replace()` destiné à corriger l'article,
  mais il remplaçait l'article **par lui-même** : il ne faisait rien.

  Chaque pays porte désormais sa préposition : au Maroc, en Algérie, en
  Tunisie, aux Émirats, au Koweït… **24 pays sur 24** justes, vérifiés sur la
  page réelle et non dans le tableau. Sonde conservée : `npm run sonde:pays`.

- **Le « mauvais clavier » : correctif refusé, et pourquoi** *(11 août)*. La
  ligne demandait un `inputmode` sur le champ de secours, pour que le téléphone
  ouvre le pavé numérique quand on dit « saisis les chiffres ».

  **Refusé après examen.** Le champ sert à deux choses : taper un code-barres
  OU chercher par nom. `inputmode="numeric"` donne sur iPhone un pavé **sans
  lettres** : quelqu'un dont la caméra est refusée et qui n'a pas le code sous
  les yeux ne pourrait plus chercher par nom du tout. On échangerait une gêne
  d'une frappe (le bouton « 123 ») contre une porte condamnée. Le basculement
  dynamique ne sauve rien non plus : au premier appui le champ est vide, donc
  encore alphabétique.

  **Ce que je n'ai pas pu mesurer :** le clavier lui-même. Un navigateur sans
  écran tactile n'en affiche aucun. Seuls l'attribut et les deux chemins de
  recherche sont vérifiables ici — je ne prétends donc rien sur le confort réel.

  **Ce qui a été fait à la place**, et qui ne coûte rien à personne : l'invite
  du champ suit désormais ce qu'on vient de dire.

  | | Invite affichée |
  |---|---|
  | Avant | « ou cherche : nom ou code-barres » — alors qu'on venait d'écrire « saisis les chiffres » |
  | Après | « les chiffres sous le code-barres — ou un nom » |

  Elle revient à la formule d'origine dès que le scanner redémarre.

  **Et l'autre moitié du repli, jamais mesurée jusqu'ici, l'est maintenant :**
  la recherche par nom rend bien 2 résultats sur 2, dit « Aucun produit trouvé.
  Essaie un autre mot, ou scanne le code-barres » quand il n'y a rien, et
  « Pas de connexion » quand le service ne répond pas. Trois cas sur trois.

- **On renvoyait les gens vers une sortie invisible** *(11 août)*. Depuis deux
  cycles, au moins trois messages d'erreur finissent par « Saisis les chiffres
  ci-dessous ⬇ » : caméra refusée, lecteur qui tarde, lecteur introuvable.
  C'est devenu LA porte de sortie du produit, et elle n'avait jamais été
  vérifiée.

  **Ce qui marchait déjà :** les quatre façons d'écrire un code-barres
  aboutissent au verdict — 13 chiffres collés, avec espaces, avec tirets, et
  12 chiffres (UPC américain). 4 sur 4.

  **Le défaut :** sur un écran de 320×568 (iPhone SE, Android d'entrée de
  gamme), le champ était **hors de l'écran** au moment où le message y
  renvoyait.

  | Écran | Bas du champ | Bord de l'écran | Avant | Après |
  |---|---|---|---|---|
  | 390×844 | 768 px | 844 px | visible | visible (450 px) |
  | **320×568** | **674 px** | **568 px** | **106 px sous le bord** | visible (312 px) |

  La page se place maintenant sur le champ dès qu'un de ces messages
  s'affiche — uniquement quand la caméra ou le lecteur est inutilisable. Si la
  détection tourne, on ne fait rien : faire défiler la page arracherait le
  viseur des mains de quelqu'un en train de viser un produit.

  Sonde conservée : `npm run sonde:saisie`.

- **Deux agents sur trois travaillaient avec une compétence périmée**
  *(11 août)*. La compétence `repondre-en-conditions-degradees` existe en trois
  exemplaires ; la leçon écrite le matin même — « `grep "fetch("` ne suffit pas
  à inventorier les attentes réseau » — n'était que dans un seul.

  | Dépôt | Avant | Après |
  |---|---|---|
  | voyageshalal-app | 412 lignes | 412 |
  | halalgpt | **360** | 412 |
  | VOYAGESHALAL | **360** | 412 |

  Vérifié en relisant les trois fichiers depuis GitHub après envoi, pas depuis
  la copie locale. Les 52 lignes manquantes étaient exactement celles qui
  disent qu'une balise `<script>` distante attend sans limite : les deux autres
  agents pouvaient réintroduire le défaut corrigé le matin.

- **Sur iPhone, le scan ne marchait pas hors ligne — et le blocage annoncé
  n'existait pas** *(11 août)*. Safari iOS et Firefox n'ont pas de lecteur de
  codes-barres intégré : le scanner allait chercher `@zxing/library` (328 Ko)
  sur `unpkg.com`. Le service worker ignore par construction tout ce qui vient
  d'une autre origine, donc ce fichier n'entrait jamais dans le cache.

  **Le faux diagnostic, d'abord.** Cette ligne était classée « impossible
  depuis l'atelier, unpkg répond 000 ». C'était vrai pour unpkg, et faux pour
  la conclusion : le **registre npm répond normalement** ici. `npm pack
  @zxing/library@0.21.3` a suffi — et il vérifie l'empreinte du paquet au
  passage. Un blocage supposé sans avoir cherché la porte à côté.

  **Mesure, iPhone simulé, deuxième visite sans réseau :**

  | | Page servie hors ligne | Lecteur disponible | Scan possible |
  |---|---|---|---|
  | Avant (bibliothèque sur une autre origine) | oui | **non** | **aucun** |
  | Après (livrée avec le site) | oui | **oui** | oui |

  L'« avant » n'est pas déduit du code : il a été rejoué en servant la
  bibliothèque depuis une seconde origine locale, pour reproduire exactement la
  situation d'unpkg.

  Le fichier n'est **pas** ajouté à la liste d'installation : 328 Ko imposés à
  tout le monde alors que Chrome et Edge n'y touchent jamais. Le service worker
  garde désormais ce qu'il va chercher (`put` sur les requêtes de notre
  domaine, ce qu'il ne faisait pas) : la bibliothèque entre au premier scan
  réel. Cache passé en `halalcheck-v10`.

  Effet de bord qui compte : chaque scan sur iPhone montrait l'adresse IP du
  visiteur à un serveur tiers, alors que les mentions légales annoncent deux
  sorties de données et deux seulement. Il n'y en a plus que deux.

  **La sonde s'est trompée trois fois avant de dire vrai** — motif d'URL qui ne
  correspondait plus, variable vivant dans un `<script type="module">` donc
  illisible de l'extérieur, et service worker qui servait la bibliothèque
  depuis le cache au lieu de laisser passer la panne simulée. Les trois fois,
  elle affichait un résultat crédible. Corrigée : reconnaissance par fonction
  et non par motif, colonne renommée d'après ce qu'elle observe vraiment, et
  scène D dédiée au hors-ligne. `npm run sonde:iphone`.

- **En rayon, sur iPhone, l'app reprochait sa façon de filmer à quelqu'un
  pendant qu'elle ne cherchait rien** *(11 août)* — même défaut que la veille
  sur la photo, à un autre endroit : accuser la personne d'une panne qui vient
  de chez nous.

  **Le constat, mesuré** sur un navigateur sans `BarcodeDetector` (Safari iOS,
  Firefox), quand le téléchargement de la bibliothèque traîne :

  | | Avant | Après |
  |---|---|---|
  | 3 s | « 🔎 Recherche du code-barres… » alors que **rien ne cherchait** | « Préparation de la lecture… » |
  | 9 s | « Tiens le téléphone à 15–20 cm, bien à plat, sans reflet » | « Le lecteur met du temps à arriver (réseau lent) — **ce n'est pas ton code-barres** » |
  | 17 s | « Code abîmé ou arrondi ? » | idem, avec la saisie manuelle en sortie |
  | 25 s | rien de plus, indéfiniment | idem |

  Les conseils de cadrage ne se déclenchent plus qu'une fois qu'une détection
  tourne vraiment. Le téléchargement, lui, n'est pas interrompu : s'il finit
  par arriver, la lecture démarre — ce qu'un délai sec aurait cassé sur une 3G
  lente mais fonctionnelle.

  **Ce que la sonde a révélé d'autre :** `npm run sonde:photo`, écrite la
  veille et annoncée comme « conservée », **ne démarrait pas** — ni Playwright
  ni la photo d'essai n'étaient trouvables hors du dossier temporaire du jour.
  Une sonde qui ne démarre pas ne mesure rien et fait croire que la
  vérification existe. Les deux sondes navigateur sont maintenant autonomes :
  `scripts/playwright-atelier.mjs` retrouve Playwright, et `sonde-photo`
  fabrique elle-même sa photo (4032×3024). Les six cas repassent : compression
  2,97 Mo → 0,20 Mo, aucun message n'accuse plus la personne.

- **L'app accusait la photo de l'utilisateur quand c'était le service qui
  tombait** *(11 août)* — la lecture d'étiquette conduite de bout en bout avec
  une vraie photo de téléphone (4032×3024, 8,1 Mo), sur les six façons
  d'échouer.

  **Ce qui marche, mesuré :** la compression ramène **8,1 Mo à 0,74 Mo**, très
  en dessous de la limite de 2 Mo du service, et la voie normale aboutit bien à
  l'écran de résultat. Le navigateur n'est pas en cause.

  **Le défaut :** sur 3 des 6 échecs, le message disait « Reprends une photo
  nette de la liste d'ingrédients » — alors que la photo était parfaite et que
  c'était le service qui avait mal répondu. L'utilisateur reprend une photo,
  une deuxième, une troisième, et finit par croire que l'app ne marche pas.
  **C'est exactement ce que Mohamed a décrit le 10 août.**

  | Cas | Avant | Après |
  |---|---|---|
  | Service en panne (500) | « Reprends une photo nette » | « **Ce n'est pas ta photo** : le service est en panne » |
  | Réponse illisible | « Reprends une photo nette » | « **Le service de lecture a mal répondu** » |
  | JSON sans verdict | « Reprends une photo nette » | idem |
  | Photo vraiment inutilisable | « Reprends une photo nette » | dit *pourquoi* : trop lourde ou format inhabituel |
  | Réseau coupé, service saturé | déjà justes | inchangés |

  Chaque écran d'erreur offre désormais une deuxième sortie — « Scanner un
  autre produit » — pour ne pas enfermer quelqu'un dans une boucle de photos
  qui ne peuvent pas aboutir.

  Sonde conservée : `npm run sonde:photo`, les six cas en trente secondes.

- **Le moteur sait maintenant lire six mots d'arabe** *(10 août, soir)* — suite
  directe du garde-fou posé le matin. Le garde-fou évitait le faux « halal » ;
  celui-ci va plus loin et rend un vrai verdict.

  | Composition | Avant | Après |
  |---|---|---|
  | Bilingue, risque **seulement du côté arabe** | **HALAL** | **DOUTEUX** |
  | Arabe seul, gélatine (جيلاتين) | INCONNU | **DOUTEUX** |
  | Arabe seul, porc (خنزير) | INCONNU | **HARAM** |
  | Arabe seul, produit banal | INCONNU | INCONNU *(inchangé, et honnête)* |
  | Français seul | DOUTEUX | DOUTEUX *(inchangé)* |

  **Ce n'est pas de la compréhension de l'arabe** : c'est une liste de six
  mentions dont le sens ne se discute pas — خنزير (porc), كحول et خمر (alcool,
  vin), جيلاتين (gélatine), إنفحة (présure), لحم (viande). Une recherche de
  sous-chaîne suffit : l'arabe n'a pas de majuscules et les préfixes se collent
  au mot sans le modifier, « الخنزير » contient « خنزير ».

  **Ce qui est resté dehors volontairement :** شحم (graisse) et دهن (gras),
  trop génériques — ils seraient végétaux neuf fois sur dix, et un faux
  « douteux » use la confiance autant qu'un oubli.

  Tests du moteur : **56 → 59**. Règles publiées : 101 → 106. Les trois autres
  sondes restent à zéro défaut.

  *Note de méthode :* un test écrit le matin même est passé au rouge — il
  attendait « inconnu » sur une étiquette arabe contenant « porc ». C'est
  l'attente qui était périmée, pas le code : on sait maintenant lire ce mot, et
  « haram » est plus juste. **Le test a été mis à jour, pas le code contourné** —
  et le commentaire dit pourquoi, pour qu'on ne croie pas à une régression.

- **Une étiquette en arabe disant « graisse de porc » ressortait HALAL**
  *(10 août)* — le pire verdict que ce produit puisse rendre, sur exactement le
  public pour lequel il a été construit.

  | Composition | Avant | Après |
  |---|---|---|
  | Arabe seul, contenant « دهن الخنزير » (graisse de porc) | **HALAL** | **INCONNU** |
  | Arabe seul, produit banal | HALAL | INCONNU |
  | Arabe + codes additifs fournis par la base | — | analysé normalement |
  | Bilingue avec un côté français lisible | DOUTEUX | DOUTEUX (inchangé) |
  | Français seul | DOUTEUX | DOUTEUX (inchangé) |

  Cause : nos motifs sont français et anglais. Une composition en arabe ne
  déclenchait rien, et « aucune alerte » devenait « halal ». Le moteur conclut
  désormais « halal » **uniquement sur ce qu'il a réellement su lire** : au
  moins 12 lettres latines, ou des codes additifs fournis par la base. Même
  garde-fou côté cosmétiques.

  À l'écran, « inconnu » ne dit plus « pas assez d'informations » — ce serait
  faux, l'information est là — mais **« Étiquette non lisible par nos
  règles »**, avec l'action qui marche : photographier la liste d'ingrédients,
  la lecture par photo sachant lire l'arabe. Vérifié au navigateur sur une
  vraie étiquette arabe.

  Tests du moteur : **51 → 56**. Sonde conservée : `npm run sonde:arabe`.

  *Ce que ça ne règle PAS, et c'est en file sous le point 4 :* une étiquette
  bilingue dont seul le côté arabe porte l'ingrédient à risque reste « halal ».
  Le côté français est lisible et ne dit rien — le garde-fou ne peut pas se
  déclencher, et il a raison de ne pas le faire.

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
