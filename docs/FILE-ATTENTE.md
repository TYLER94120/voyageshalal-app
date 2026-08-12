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
   *Piste :* constituer un jeu de fiches réelles figées dans le dépôt, capturées
   une fois depuis le navigateur de Mohamed, pour tester hors ligne.
   *Ce que Mohamed seul peut faire :* élargir la politique réseau de
   l'environnement (réglages de l'environnement Claude Code) pour y autoriser
   `world.openfoodfacts.org`. Sans cela, la seule voie reste un jeu de fiches
   figées déposé dans le dépôt — les dépôts de paquets, eux, sont ouverts.

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

6. **Installer l'app puis partir en magasin sans avoir scanné une seule fois :
   sur iPhone, aucun lecteur.**
   *Preuve, mesurée le 12 août :* le lecteur de codes-barres des navigateurs
   sans détecteur natif pèse **96 Ko compressés** et n'est **volontairement pas**
   dans les 12 fichiers pré-chargés à l'installation — pour ne pas l'imposer à
   Chrome et Edge, qui n'y touchent jamais. Il entre dans le cache au premier
   scan réel. Le trou : quelqu'un qui installe l'app, ne scanne rien, puis se
   retrouve sans réseau en rayon n'a pas de lecteur. Vérifié : à la deuxième
   visite *après* un scan, tout marche (`npm run sonde:iphone`, scène D).
   *Le choix à faire :* imposer 96 Ko à l'installation de tout le monde, ou
   laisser ce trou. Petite population, coût réel : à trancher, pas à deviner.

---

## Fait

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
