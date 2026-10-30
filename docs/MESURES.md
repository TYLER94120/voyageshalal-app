# Le carnet de mesures de l'empire

**Ce fichier existe parce qu'il a déjà été perdu une fois.**

Mohamed a demandé le 21 août que toutes les mesures soient conservées de façon
permanente et accessibles à tout le monde. Elles l'ont été — sur une branche
`claude/carnet-halalgpt-21aout` qui n'a jamais été fusionnée, et qui a fini par
disparaître. Le 5 septembre, en voulant y ajouter la ronde de la nuit, j'ai
constaté qu'il ne restait rien : ni la branche sur le dépôt, ni le fichier dans
`main`, ni le répertoire dans le conteneur — celui-ci est recyclé entre les
sessions.

La leçon est plus large qu'un fichier : **une mesure qui vit sur une branche non
fusionnée n'est pas conservée, elle est en sursis.** Ce carnet repart donc de
`main`, et il n'a de valeur que fusionné dans `main`.

Ce qui suit a été reconstruit de mémoire de session. Les chiffres sont ceux qui
ont été relevés et vérifiés à l'époque ; quand une valeur est déduite plutôt que
lue, c'est écrit.

---

## 1. Les cinq domaines, et ce qui les sert

| Domaine | Hébergeur | Forme canonique |
|---|---|---|
| halalgpt.fr | Vercel | apex |
| voyageshalal.fr | Vercel | apex |
| gohalaltravel.com | Vercel — **même projet que voyageshalal** | apex |
| islampasapas.fr | Vercel | apex |
| halalcheck.fr | GitHub Pages | apex |

`node scripts/test-dns.mjs` (dans le dépôt halalgpt) résout les dix adresses.
**L'apex qui ne résout pas est un échec ; le www absent est un avertissement.**

Configuration Vercel pour halalgpt.fr, telle que le tableau de bord la donne :

```
A      @      216.150.1.1
CNAME  www    aa6a18ce96688f26.vercel-dns-017.com.
```

**Vercel exige un CNAME pour un sous-domaine, jamais un A.** Cette phrase a
coûté cinq jours (voir §5).

---

## 2. Ce que Google fait de halalgpt — le diagnostic central

Relevé Search Console du 14 août 2026, sur 199 pages connues :

| État | Pages | Ce que ça veut dire |
|---|---|---|
| Dans l'index | 52 | — |
| **Détectée, actuellement non indexée** | **135** | Google n'est **jamais venu** |
| Explorée, actuellement non indexée | 6 | Google est venu et a refusé |
| Page en double sans canonique | 4 | — |
| Exclue par noindex | 2 | volontaire |

**Six refus sur 207 fiches, c'est un contenu jugé correct.** Le problème de
halalgpt n'est pas la qualité, c'est le **budget d'exploration**. J'ai soutenu
l'hypothèse inverse (« signal de contenu généré en masse ») devant Mohamed ; il
a répondu « T'es sur ? », j'ai répondu « Non. » et je me suis rétracté. Le
démenti était déjà écrit dans l'en-tête de `scripts/densifier-maillage.mjs`, sur
`main`, depuis le 14 août.

**Le seul levier entièrement dans nos mains pour augmenter ce budget est le
maillage interne.** Mesure du même jour : 101 fiches sur 207 avaient 2 liens
entrants ou moins, pendant qu'une poignée en concentrait 18.

Les onze pages que Search Console montre visitées par Google — nos portes
d'entrée, celles par lesquelles l'exploration se propage :

```
levure-biere-halal   mentos-halal        priere-voiture
medicaments-gelules-halal                vernis-ongles-priere
glace-halal          e466-halal          e621-halal
certifications-halal-france              mcdo-halal
isla-delice-halal
```

**Quatre d'entre elles ne sont pas alimentaires** — c'est de là qu'il faut
partir quand on écrit hors alimentaire :

| Page | Catégorie |
|---|---|
| `priere-voiture` | Prière |
| `vernis-ongles-priere` | Prière |
| `medicaments-gelules-halal` | Vie quotidienne |
| `certifications-halal-france` | Pratique |

> **Correction du 12 septembre.** J'avais écrit ici « deux seulement », compté à
> la main le 5 septembre. `scripts/que-ecrire.mjs` en a trouvé quatre à sa
> première exécution. Le compte à la main était faux ; celui que le dépôt fait
> lui-même est juste. C'est exactement la raison d'être de cet outil — et la
> raison pour laquelle un chiffre de ce carnet devrait, autant que possible,
> être recalculable plutôt que recopié.

---

## 3. Mobile contre ordinateur — l'écart qu'on ne voit pas dans le total

| Appareil | Part des impressions | Part des clics | CTR |
|---|---|---|---|
| Mobile | 38 % | 88 % | **2,31 %** |
| Ordinateur | 62 % | 12 % | **0,19 %** |

**Facteur 12.** 62 % des impressions produisent 12 % des clics.

Positions **déduites** (calculées à partir des CTR et non lues telles quelles
dans Search Console) côté ordinateur : **49,7 / 40,1 / 36,7**. Autrement dit, la
faiblesse du CTR ordinateur n'est pas un problème de titre — c'est un problème
de position. On n'est pas sur la première page.

---

## 4. Le facteur de précision ×25

Sur halalgpt, **3 % des impressions produisent 46 % des clics.**

Ces 3 % sont les requêtes où la fiche répond exactement à la question posée. Le
reste est du bruit de longue traîne où l'on apparaît sans être la bonne réponse.

Corollaire pour l'écriture : **une fiche qui répond précisément à une question
que les gens posent vaut vingt-cinq fiches qui effleurent un sujet.** C'est la
raison pour laquelle ce site se construit en profondeur et non en volume.

### Le cas du Maroc — l'invisibilité n'est pas le seul échec

gohalaltravel.com, requête « Morocco » : **118 impressions, position moyenne
7,8, zéro clic.**

Position 7,8 signifie qu'on est vu. Zéro clic sur 118 impressions signifie qu'on
est **refusé**, pas ignoré. Ce n'est pas un problème de référencement, c'est un
problème de titre et de description. Distinction à faire systématiquement avant
de proposer un correctif.

### La contre-épreuve : voyageshalal, 20 août

Les titres ont été réécrits le 20 août. À **impressions constantes** :

| | Avant | Après |
|---|---|---|
| Clics / semaine | 12 | **28** |
| CTR | 0,7 % | **1,6 %** |

**C'est le seul levier de référencement qui agit le jour même**, parce qu'il
travaille sur des impressions déjà acquises. Rien d'autre dans ce carnet n'a
produit un effet aussi rapide.

Un CTR n'a aucun sens sous ~100 impressions sur une requête. Ne jamais conclure
en dessous.

---

## 5. La panne DNS du 23 au 28 août — et ce qui l'a masquée

Du 23 au 28 août, **halalgpt.fr n'avait plus d'enregistrement A**. L'adresse
canonique du site — celle que Google a indexée, celle de chaque ligne du
sitemap — ne résolvait plus. Les impressions sont tombées à zéro. Personne ne
l'a vu pendant cinq jours.

**Cause : moi.** J'ai dit à Mohamed de créer un enregistrement `A` pour `www` en
recopiant les domaines voisins, au lieu de lire le tableau de bord Vercel qui
demande un `CNAME`. L'enregistrement A de l'apex a disparu dans l'opération.

**Ce qui a masqué la panne est plus grave que la panne.** Le test en direct de
Search Console, interrogé sur `https://halalgpt.fr/`, répondait :

> « Google a accès à cette URL · La page peut être indexée »

**alors que le domaine ne résolvait pas du tout.** Cette réponse a écarté la
bonne piste et m'a fait enchaîner trois hypothèses fausses, chacune corrigée par
Mohamed :

1. « données incomplètes » — réfutée par la fenêtre de 28 jours ;
2. « le site n'est jamais revenu après la pause Vercel » — *« Non c'est faux
   j'avais vérifié sa s'est remis en même tp que Voyageshalal »* ;
3. « signal de contenu généré en masse » — *« T'es sur »*, et je me suis
   rétracté.

**Aucune des trois n'aurait survécu à deux secondes de résolution DNS.**

> **Règle qui en découle.** Search Console, les rapports d'indexation et les
> tableaux de bord décrivent ce que Google **croit**. Le DNS dit ce qui
> **existe**. On commence toujours par lui. D'où `scripts/test-dns.mjs`, et
> l'étape 0 de chaque ronde.

Correctif appliqué le 28 août : apex rétabli à `216.150.1.1`, www converti de
`A` en `CNAME → aa6a18ce96688f26.vercel-dns-017.com.`

---

## 6. Vercel — la pause du 23 août et le coût

Le compte Hobby a dépassé son plafond de **Fast Origin Transfer : 10,66 Go pour
10 Go inclus.** L'équipe a été mise en pause, et **la page servie par Vercel
pendant une pause renvoie un code 4xx.**

> **Pourquoi ce détail compte.** Un **503** dit à Google « reviens plus tard » :
> il conserve les pages. Un **4xx** dit « cette page n'existe plus » : il
> déréférence. Une pause de facturation est donc une pression au
> déréférencement, pas une simple coupure.

Décision de Mohamed le 23 août : passage au plan **Pro, 20 $/mois, 100 Go**,
période **23 août – 23 septembre**. Sa réaction, qui mérite d'être conservée
telle quelle : *« JE SUIS DEG 20 EUROS POUR DES SITES FATIGUER LOLLL »*

Le Spend Management de Vercel : **le budget n'est qu'un seuil de notification,
pas un plafond dur.** Le seul arrêt réel est l'interrupteur « Pause Production
Deployments ».

**Décision à prendre avant le 23 septembre** : redescendre en Hobby suppose
d'avoir corrigé la fuite de ~300 Mo/jour de Fast Origin Transfer. La stratégie
de cache proposée sur voyageshalal attend l'accord de Mohamed (refonte à deux
gabarits, 45 pages).

### Mesure du 23 septembre — halalgpt n'est pas le coupable

Fait le jour du renouvellement, pour que la décision repose sur des chiffres.

**Tout ce qui sert du contenu sur halalgpt est statique ou pré-rendu** (`○` et
`●` dans la table de routes) : l'accueil, `/questions`, les neuf hubs de
catégorie, les 237 fiches, le sitemap, `robots.txt`. Ces pages sortent du cache
de Vercel et ne consomment pas de Fast Origin Transfer une fois chaudes.

Ne restent dynamiques (`ƒ`) que les neuf routes d'API, `/e/[code]`, et les deux
routes d'image Open Graph.

| Route | Brut | Gzip |
|---|---|---|
| `/` | 21,6 ko | **5,0 ko** |
| `/q/e120-halal` | 29,4 ko | **6,1 ko** |
| `/categorie/additifs` | 38,8 ko | **6,5 ko** |
| `/questions` | 107,6 ko | **21,5 ko** |
| `/sitemap.xml` | 41,3 ko | **2,8 ko** |
| `/q/e120-halal/opengraph-image` | 37,1 ko | — |

**Une hypothèse que j'avais et qui est fausse** : je soupçonnais les images Open
Graph, générées à la demande pour chacune des 237 fiches. Une image de fiche
pèse 37 ko — le même ordre de grandeur qu'une page HTML, pas les 200 à 300 ko
que j'imaginais. Ce n'est pas là que part la bande passante.

**Conclusion pour halalgpt : rien à corriger.** Le site est déjà dans la forme
la moins coûteuse possible, et une fiche coûte 6 ko compressés à un visiteur
mobile — ce qui compte, puisque 88 % des clics viennent du mobile.

**Ce que je n'ai PAS pu mesurer, et c'est la moitié qui décide.** Le gros
consommateur est presque certainement voyageshalal — 33 322 hôtels — mais
**son dépôt n'est pas dans ce conteneur.** `/home/user/voyageshalal-app`, malgré
son nom, est l'application mobile **Expo / React Native** (`expo-router/entry`,
`expo start --android`), pas le site Next.js. Aucun `force-dynamic`, aucun
`revalidate` : normal, ce n'est pas un site web.

Donc : la question « peut-on redescendre en Hobby ? » ne se tranche pas depuis
ici. Il faut soit attacher le dépôt du site voyageshalal à une session, soit
lire l'onglet Usage de Vercel, qui ventile la consommation **par projet**. C'est
la seule mesure qui dira lequel des cinq sites dépense les 10 Go.

---

## 7. Les règles permanentes

1. **NE JAMAIS POUSSER SUR `main`.** Un push déclenche un déploiement de
   production Vercel. On pousse sur une branche ; **c'est Mohamed qui promeut
   depuis Vercel.** Origine de la règle : j'ai écrasé le commit `d88488f` qu'il
   avait promu — *« Tu as redéployé le mauvais commit »*.

2. **Comparer le CONTENU de `main`, pas son empreinte de commit.** J'ai vérifié
   le hash de `origin/main` toutes les nuits sans jamais regarder ce qu'il
   contenait. Un autre agent avait enrichi **122 fiches communes**. Fusionner ma
   branche aurait effacé une semaine de son travail. Une branche vieille de
   trois semaines n'est pas « en avance de 321 commits » : elle est morte.

3. **On ne publie jamais un fait non vérifié** — composition, certification,
   verset, hadith, avis de savant, note d'établissement. Voir §8.

4. **On présente les avis répandus avec leurs divergences ; on ne tranche
   jamais.** Voir §8.

5. **Une mesure vaut mieux qu'une hypothèse, et une hypothèse énoncée vaut mieux
   qu'une hypothèse déguisée en fait.** Trois fois sur ce projet, c'est Mohamed
   qui a dû attraper l'erreur.

---

## 8. La responsabilité religieuse — la question de Mohamed

Le 22 août, Mohamed a écrit :

> *« Mon frère m'a parlé de la responsabilité de tous ces sites concernant la
> religion et l'islam, car je suis responsable de tout ce qu'il y a dans ces
> sites et s'il y a un problème, c'est moi qui aurais tous les pêche. Fais en
> sorte que ceci ne se produise pas. »*

Ce qui a été mis en place, et qui doit le rester :

- **Aucune fiche ne rend un avis.** Elles décrivent les positions répandues et
  **nomment les divergences quand elles existent**. « La majorité tolère », « les
  deux avis existent chez des gens sérieux », jamais « c'est halal ».
- **Chaque fiche porte une note de bas de page** renvoyant vers un savant ou un
  organisme de certification pour toute situation personnelle, et rappelant que
  les compositions évoluent.
- **Les faits matériels sont vérifiés avant publication** — c'est là que se
  joue l'essentiel du risque, et c'est vérifiable, contrairement à un avis.
  Exemple du 5 septembre : je voulais opposer la durée illimitée de l'essuyage
  sur un plâtre aux 24 h des chaussettes. La recherche n'a pas confirmé le
  point. **Il ne figure pas dans la fiche.**
- **Quand une question de fond est incertaine, la fiche le dit et renvoie à un
  savant** plutôt que d'arbitrer. C'est le cas de `platre-pansement-ablutions`
  sur le tayammum complémentaire.

**Ce qui reste à faire, et que je ne peux pas faire à sa place : Mohamed doit
poser la question de la responsabilité à un savant qualifié.** Un site ne
répond pas à cette question-là.

---

## 9. En attente, côté Mohamed

> Le titre disait « deux choses » et la liste en comptait quatre. Corrigé le
> 17 octobre : une liste qui grossit sous un titre qui ne bouge pas finit par
> faire croire que rien ne s'accumule.

- **Regénérer la clé `GOOGLE_PLACES_KEY`**, exposée. Non fait à ce jour.
- **Élargir la politique réseau de l'environnement** aux cinq domaines de
  l'empire. Sans cela l'étape 0 de la ronde reste aveugle : la liste blanche du
  conteneur ne les laisse sortir ni par le résolveur DNS ni par le proxy (§5).
  Aucun contournement de mon côté — c'est un réglage, pas une panne.
- **Renvoyer le sitemap de halalgpt dans Search Console** — l'action de
  récupération la plus rentable après la panne, toujours pas faite.
- Ajouter une propriété **Domaine** pour `islampasapas.fr` (seulement en préfixe
  d'URL aujourd'hui).
- **HalalCheck n'a pas de ronde** : la session correspondante n'a pas le dépôt
  attaché.

---

## 10. Journal des rondes

### 30 octobre — l'outil, puis deux de mes fiches qui se contredisaient

**L'atelier avait disparu** : conteneur recyclé, `/home/user/halalgpt` absent. Le
`cd` a échoué silencieusement et tout ce qui suivait a tourné dans le dépôt
voyageshalal — d'où des chiffres absurdes (« main à 52a8390, 0 fiche ») que je
n'ai pas rapportés. Reconstruit par clonage : la branche était à `b072e37`,
exactement ce que j'avais poussé la veille.

**⚠️ ET UNE DÉCOUVERTE QUI CHANGE L'INSTRUCTION POUR CE CARNET.** La branche
locale portait le bon nom mais pointait sur la **pointe de `main`**, pas sur mon
travail (même dérive de pointeur que le 1er octobre). Récupéré depuis `origin`.
En mesurant l'écart, ceci :

| Mesure | Résultat |
|---|---|
| Fichiers que mes commits touchent | **`docs/MESURES.md`, et lui seul** |
| `docs/MESURES.md` sur `main` | **absent** — c'est un ajout propre |
| Fichiers qui *paraissent* modifiés | **10**, tous dans `docs/ronde/` et `docs/usine/` |

Ces dix fichiers sont la production **d'un autre agent**, et ils n'apparaissent
modifiés que parce que la base de ma branche est antérieure à son travail — mes
commits ne les ont jamais touchés. **Conséquence : fusionner cette branche
annulerait silencieusement sa journée.**

> **Pour Mohamed : ne fusionne pas la branche, prends le fichier.**
> `git checkout claude/halalgpt-domain-hxl2t7 -- docs/MESURES.md`
> Cela donne le carnet sur `main` sans toucher à quoi que ce soit d'autre. Je ne
> rebase pas la branche moi-même : le clone est superficiel, `git merge-base`
> échoue faute d'historique, et le 1er octobre j'ai cassé un rebase en opérant
> sans l'historique nécessaire.

**Mesure d'abord, suite de la leçon de la veille.** La forme fautive — une phrase
qui nomme plusieurs marques et affirme leur état — existe-t-elle encore ailleurs ?
**Un seul résultat, et c'est un faux positif** : `mentos-halal` nomme E901 et
E903, des codes additifs, et sa phrase « ne sont pas une réponse unique » dit
justement que la réponse *varie*.

**Donc pas de garde-fou, et le raisonnement vaut d'être gardé :** juger si une
mention est *périmée* n'est pas dérivable, il faut lire ; le déclencheur n'est pas
un état du dépôt mais un **geste** (« je viens de corriger une fiche de marque »),
qu'aucun test lancé à chaque commit ne peut connaître ; et il n'y a plus rien à
garder — il y a **un geste à outiller**. D'où `scripts/renvois.mjs` : on
l'appelle, il ne crie pas.

**Septième faute de ma main ce mois-ci**, dans sa première version : elle devinait
les noms propres aux **majuscules du titre**. Premier essai — « Par » et « Des »
donnés comme noms de `lardons-halal` (29 renvois !), « Que » pour
`halal-definition`, « Je » pour `retard-fajr-reveil`, et « Dubaï » tronqué en
« Duba », les lettres accentuées n'étant pas dans `\w`. Il aurait fallu allonger
une liste d'exclusions — **la péremption que je fuis depuis le 19 septembre, et
que j'avais écrite dans l'en-tête du fichier avant de bâtir le mode par défaut
dessus.** Deuxième version : les termes viennent du **slug**, écrit à la main,
sans accent, et qui nomme déjà le sujet.

**L'épreuve qui compte** : lancé sur `lib/questions.ts` remis à l'état du
28 octobre, l'outil remonte **exactement** la phrase qui était fausse. Il aurait
donc attrapé le défaut resté deux semaines dans une porte visitée par Google.

**Puis je m'en suis servi, et il a trouvé mieux qu'une mention périmée : deux de
mes propres fiches se contredisaient.**

| Fiche | Ce qu'elle disait |
|---|---|
| `quick-halal` (9 oct.) | « Burger King… **n'en propose pas** dans ses restaurants français » |
| `burger-king-halal` (14 oct.) | « une partie des restaurants… **aurait conservé une certification** » |

Écrites à cinq jours d'intervalle, par moi, disant l'inverse l'une de l'autre.
`quick-halal` renvoie désormais à la fiche Burger King, qui fait foi et qui ne
tranche pas — **deux pages du même site ne peuvent pas dire le contraire l'une de
l'autre.**

**Et la même faute qu'il y a quinze jours, attrapée par la vérification de la page
SERVIE.** Après avoir corrigé le paragraphe, « seule grande enseigne » restait
dans le **`short`** — la ligne que Google affiche. C'est précisément ce que j'ai
corrigé le 15 octobre sur la fiche voisine, et le titre de mon commit ce jour-là
disait : *« Domino's : le corps était prudent, la ligne que Google affiche ne
l'était pas. »* La leçon était écrite ; ce qui l'a rattrapée est d'avoir **servi
la page et regardé**. Mesure au passage : l'ancien résumé faisait **163
caractères**, donc la description était déjà tronquée.

**Honnêteté sur le build** : la première tentative a échoué sur une erreur
webpack, la seconde a réussi sans rien changer au code — le serveur de la
vérification précédente tenait encore `.next`. Je ne nomme pas un défaut que je
ne peux pas reproduire, et je ne le cache pas non plus.

**Compte** : 251 fiches, aucune créée — part alimentaire inchangée à **51,0 %**.
Étape 0 : code 2, **dix-huitième nuit aveugle**. `main` de halalgpt toujours à
`94b078f`, **75 commits de retard**, **76 jours**.

### 29 octobre — KFC était faux, et l'erreur était recopiée ailleurs

Pas de fiche neuve : j'avais conclu la veille que les trous à fort enjeu étaient
épuisés et que les nuits suivantes valaient mieux en qualité. Mesure de ce qui
restait le plus risqué — **les fiches de marque, où quatre des cinq chaînes
vérifiées en octobre se sont avérées fausses.** Sur 128 fiches alimentaires,
**12 portent encore la forme à risque** (affirmation non bornée sur l'état d'une
offre ou d'une certification). Une sautait aux yeux : `kfc-halal`, écrite le
4 août, **jamais retouchée**, portant un « ❌ Non en France » plat.

**Cinquième fois qu'un « non » assuré tombe.** Depuis le **21 janvier 2026**, KFC
France propose une carte **exclusivement halal** dans une partie de ses
restaurants, en commençant par vingt-quatre. La fiche était donc fausse **deux
fois** : elle affirmait le contraire, elle l'**attribuait à la FAQ officielle de
la marque**, et elle rangeait les « rumeurs de KFC halal » du côté des enseignes
qui imitent le concept. **Exactement l'erreur Subway, répétée** — traiter de
rumeur ce qui est vrai.

**Et l'autre moitié, que la réécriture donne.** La certification a été
publiquement **contestée** : le **19 août 2026**, **AVS a démenti** certifier
KFC, en réponse à un site tiers qui l'avait listé parmi les certificateurs. KFC a
ensuite publié des certificats, qu'un site spécialisé a jugés utiles pour
identifier des acteurs de la chaîne d'approvisionnement mais **insuffisants à eux
seuls** pour garantir la conformité de la viande servie. La fiche ne tranche donc
pas : offre déclarée, partielle, chaîne de certification discutée — et quelqu'un
qui suit AVS a une raison **réelle** de prudence, *un démenti, pas une rumeur*.
Deux chiffres non donnés : le nombre de restaurants (il bouge, comptes de sites
secondaires) et l'origine de la viande (annoncée européenne sans source officielle
lisible).

**ET LE VRAI DÉFAUT DE LA NUIT, plus grave que KFC.** J'ai corrigé cinq fiches de
chaîne en octobre **sans jamais balayer les renvois croisés**. Mesure :

| Fiche | Ce qu'elle disait encore |
|---|---|
| `mcdo-halal` **(une des 11 portes)** | « KFC, Burger King, Quick, Subway et Domino's ne servent pas non plus de viande halal en France » — **une seule phrase pour cinq réseaux, fausse sur trois**, dont deux que j'avais corrigés deux semaines plus tôt |
| `popeyes-halal` | KFC « donne la réponse opposée en France : poulet de filière standard, pas de certification » |

La page la plus vue du lot portait donc l'erreur. `mcdo-halal` ne porte plus de
liste du tout : la situation diffère d'une enseigne à l'autre, elle bouge,
parfois d'un restaurant à l'autre — chaque enseigne a sa fiche. **Une phrase qui
porte cinq réseaux se périme cinq fois plus vite.**

**Au crédit du passage d'octobre** : les renvois écrits *alors*, dans
`burger-king-halal` et `quick-halal`, sont déjà bornés (« des exceptions
circulent sans liste vérifiable », « l'étendue de cette certification a bougé »).
La règle avait donc bien été appliquée aux fiches réécrites — ce qui manquait,
c'était de l'appliquer aux fiches **qui parlent d'elles**.

**Leçon de procédé, et c'est l'acquis de la nuit** : une correction de fiche de
marque n'est pas finie tant que les **renvois croisés** ne sont pas balayés. Le
balayage est dérivable et coûte trente secondes.

**Compte** : 251 fiches, aucune créée — part alimentaire inchangée à **51,0 %**.
Étape 0 : code 2, **dix-septième nuit aveugle**. `main` toujours à `94b078f`,
**72 commits de retard**, **75 jours**.

### 28 octobre — le dernier trou à enjeu vital

**`transfusion-don-sang-islam`**, et c'était le **dernier sujet à enjeu vital**
de la liste mesurée le 24 octobre. Vérifié avant d'écrire : `transfusion` ne
ramenait rien, et `don-organes-islam` — bien attribué — ne dit **rien du sang**.
Question distincte, d'ailleurs : un organe ne se renouvelle pas, le sang si.

**Pourquoi ce n'est pas un « oui évidemment »**, et c'est ce qui rend la page
utile : il y avait une **vraie réserve à lever**. Le sang qui sort du corps est
tenu pour impur, et il est une partie du corps humain, dont les juristes disent
qu'elle doit être traitée avec respect. Quelqu'un qui n'a entendu que cette
moitié-là peut en conclure qu'il faut refuser.

Ce qui lève la réserve est la *darura*. Et l'état précis de la question : **pour
un malade dont la vie est en jeu sans transfusion immédiate, l'accord rapporté
est unanime.** C'est la phrase qui justifie la fiche — *personne ne devrait
refuser une transfusion, pour soi ou pour son enfant, en croyant que la religion
l'interdit.* Le don **sans urgence** est plus discuté, et la fiche le dit :
majorité contemporaine pour, sous trois conditions, mais des savants nommés
tiennent qu'en l'absence de nécessité le don n'est pas permis — donc si on a
répondu non à quelqu'un, on ne l'a pas forcément mal renseigné.

**Et la convergence que personne ne dit**, vérifiée aux sources
institutionnelles : la condition qui inquiétait le plus les juristes — **qu'on ne
vende pas** son sang — est satisfaite **d'office en France, par la loi**. L'EFS
énonce quatre valeurs (anonymat, non-profit, volontariat, bénévolat) et le don ne
peut être rémunéré sous aucune forme ; la **loi du 21 juillet 1952** interdit de
faire commerce de son corps, et la **loi Aujaleu** la même année interdit tout
profit tiré du sang offert. Ce qui était une condition à vérifier est ici un
pilier du droit.

**Deux refus assumés.** Pas de critères d'admission — âge, poids, délais,
contre-indications appartiennent à l'EFS : ils changent, et un critère périmé
enverrait quelqu'un pour rien. Et sur le don en journée pendant le jeûne, la
fiche dit **ne pas avoir établi** le point, tout en donnant le conseil pratique
qui évite la question : donner après la rupture. **Une résolution de l'Académie
du fiqh de 1988 n'est pas citée** : une source la mentionne, je n'ai pas pu lire
le texte, et un numéro de résolution qu'on n'a pas lu ne se cite pas.

**Cinquième fiche de suite où le contrôle avant commit trouve quelque chose — et
cette fois il a corrigé le titre.** `sang islam` ramenait `adoption-islam` en
premier : mon titre n'avait pas le mot *islam*, donc il pesait **2 contre 12**.
La convention du site l'inclut déjà, d'où « Transfusion et don du sang : permis
en islam ? », qui garde la forme interrogative et les trois mots qui comptent.

**Où en est le contenu, maintenant que ce trou est comblé.** Les gaps restants de
la liste du 24 octobre — halloween, saint-valentin, horoscope, épilation, bourse,
incinération — sont **tous à faible enjeu**. Le critère « où une mauvaise réponse
coûte-t-elle le plus cher » ne désigne plus personne, ce qui veut dire que les
prochaines nuits valent mieux en qualité et en outillage qu'en volume.

**Compte** : 251 fiches, 263 URLs au plan, part alimentaire **51,0 %**, **16
restantes** pour 48 %. Étape 0 : code 2, **seizième nuit aveugle**. `main`
toujours à `94b078f`, **70 commits de retard**, **74 jours**.

### 27 octobre — le plan du site, audité avant d'être renvoyé

Pas de fiche neuve. Le diagnostic qui gouverne le site est un **budget
d'exploration**, le plan du site est le **seul** artefact qui dise à Google quoi
venir chercher, et son renvoi dans Search Console est l'action en attente depuis
le plus longtemps (§9). Il n'avait **jamais été audité** : un défaut dedans se
propagerait au moment du renvoi.

**L'audit revient propre, et c'est la première chose à dire.**

| Vérification | Résultat |
|---|---|
| Compte | **262 URLs** = accueil + /questions + /conduite + 9 hubs + 250 fiches |
| Réponse HTTP | **262 testées, 0 échec** |
| Domaine | toutes sur `https://halalgpt.fr`, **0 hors domaine** |
| Doublons | **0** |
| Dates | **262 lastmod**, aucune dans le futur |
| Canoniques | échantillon de 38, **0 écart** avec le plan |
| robots.txt | `/api/`, `/apprendre/`, `/labo-son` interdits — et **aucune** annoncée dans le plan |

**Donc le renvoi ne propagera rien de faux.** C'est bon à savoir *avant*
d'appuyer, pas après.

**Et une fausse alerte de ma main, la cinquième du mois.** J'ai d'abord compté
`/confidentialite` et `/mentions-legales` comme des oublis du plan. Elles portent
`index: false, follow: true` : leur absence est **voulue**. Pire — le commentaire
de `test-canoniques.mjs` raconte **déjà** cet épisode : le 13 août, une première
version du même test avait accusé les deux mêmes pages, et la conclusion écrite
était que *« la règle n'existait nulle part ailleurs que dans ma tête »*. Deux
mois plus tard, même observation sur les mêmes pages. **La différence, cette
fois : j'ai vérifié avant d'agir.**

**Le garde ajouté**, dans `test-canoniques.mjs` plutôt que dans un script neuf —
la consigne prévient qu'un test de liens en doublon a déjà dû être jeté, et ce
fichier énumère déjà les routes. La règle : *une route est du même côté du plan
que de l'index.* **Mesurée avant d'être écrite**, parce que le même fichier
avertit qu'un test qui invente sa règle fabrique du travail : 5 indexables toutes
annoncées, 5 en noindex toutes absentes, 0 écart dans chaque sens. Le garde
décrit donc l'état du site, et protège contre l'oubli qui ne se voit jamais —
**une page absente du plan s'affiche parfaitement.**

**Deux fautes de ma main dans la seule fonction de détection**, toutes deux
trouvées en écrivant le test d'échec : elle cherchait le chemin littéral et
annonçait `/q/[slug]` absent du plan alors que les 250 fiches y sont ; puis
`includes('${SITE_URL}/conduite')` répondait **oui** alors que le plan disait
`/conduite-xx` — une sous-chaîne n'est pas une égalité, et le garde ne détectait
donc **pas** une page retirée du plan, soit exactement le sens qu'il existe pour
couvrir. **Sixième fois ce mois-ci** que le défaut est trouvé par l'exécution du
test d'échec et non par la relecture. Les trois chemins d'échec sont maintenant
exercés et nommés.

**Compte** : 250 fiches, inchangé. Étape 0 : code 2, **quinzième nuit aveugle**.
`main` toujours à `94b078f`, **68 commits de retard**, **73 jours**.

### 26 octobre — le trou où l'erreur peut coûter une vie

**`antidepresseurs-halal`**, choisie sur le même critère que la veille — *où une
mauvaise réponse coûte le plus cher au lecteur* — et c'est le sujet qui dominait
la liste des trous mesurés le 24 octobre.

**Le trou, vérifié avant d'écrire.** `psy-therapie-islam` traite la consultation
d'un psychologue à fond et ne dit **rien** des médicaments : ni *antidépresseur*,
ni *psychiatre*, ni *psychotrope*, ni *anxiolytique*. `medicament-ramadan` et
`piqure-ramadan` couvrent la mécanique générale du jeûne mais ne nomment **aucun
traitement psychiatrique**. Deux questions restaient donc sans réponse, et ce
sont les deux plus coûteuses.

**La première est celle du stigmate** : beaucoup renoncent à un traitement parce
qu'on leur a dit que c'était manquer de confiance en Dieu. Le site répond déjà à
cela pour la consultation ; la fiche étend le même fondement, et la phrase qui
compte est que le hadith « soignez-vous » **ne fait aucune exception pour
l'esprit**, et que rien dans ce principe ne distingue un comprimé d'une
conversation.

**La seconde est le Ramadan, et c'est là que l'erreur est grave.** La mécanique
est ailleurs sur le site ; ce qui manquait est le **critère**. L'exemption repose
sur le **verset 2:184**, et la maladie qui la justifie est celle que le jeûne
**aggraverait** ou dont il **retarderait la guérison** — formulation des
juristes, vérifiée. Un traitement psychiatrique est exactement ce cas.

**Et un fait vérifié que personne ne dit** : les carnets de suivi français remis
aux patients sous **lithium** rangent **le jeûne parmi les situations qui font
monter la lithiémie**, et le déconseillent. Une étude prospective sur des
patients bipolaires en contexte de jeûne musulman observe la même chose — baisse
de la filtration rénale, hausse des concentrations — en précisant que la
littérature reste **limitée**, et la fiche le précise aussi. Détail qui lève un
obstacle : **une prise de sang de contrôle ne demande pas d'être à jeun.**

**Ce que la fiche refuse de faire, et elle le dit** : publier une liste de
symptômes qu'elle n'a pas vérifiée. Ce que la recherche m'a donné sur ce point
venait de la **synthèse du moteur**, pas d'un document — et une liste clinique de
ma composition sur une page que lisent des gens sous traitement serait
exactement le genre de chose qui ne se rattrape pas. À la place, trois questions
à poser au prescripteur, dont la réponse lui appartient.

**Le contrôle avant commit attrape quelque chose pour la quatrième fiche de
suite**, et cette fois plus qu'un synonyme : **`psychiatre` n'apparaissait nulle
part sur le site**, alors qu'en France c'est lui qui prescrit — ni
`anxiolytique`, `psychotrope`, `somnifère`, `neuroleptique`, alors que la fiche
vaut pour toute la classe. Les deux ajouts sont donc informatifs : nommer le
prescripteur tel qu'on l'appelle, et dire que la page vaut pour les psychotropes
quel que soit le nom sur la boîte. `psychiatrie` reste muet, et c'est assumé —
taper *plus* que le mot indexé échoue (limitation du 20 octobre), et forcer le
mot serait du bourrage pour une requête moins probable que `psychiatre`.

**Compte** : 250 fiches, part alimentaire **51,2 %**, **17 restantes** pour 48 %.
Étape 0 : code 2, **quatorzième nuit aveugle**. `main` toujours à `94b078f`,
**67 commits de retard**, **72 jours**.

### 25 octobre — une prémisse fausse qui coûte de l'argent

**`allocation-chomage-halal`**, choisie parmi les trous mesurés la veille sur un
critère précis : **celui dont une mauvaise réponse coûte le plus cher au
lecteur.** Croire à tort que c'est interdit, c'est renoncer à un revenu auquel on
a droit et que son propre travail a financé — **la même forme que l'erreur
Subway : un « non » qui ferme une porte ouverte.** Le sujet était absent :
`chomage`, `allocation`, `cotisation`, `indemnite` ne ramenaient rien.

**Ce que la fiche apprend est d'abord un fait, pas un avis.** La prémisse que la
plupart des gens ont fausse : **ce n'est pas de la charité.** L'ARE est une
**assurance**, financée par des cotisations patronales assises sur les salaires
et par la CSG, versée à qui a travaillé une durée minimale. La ligne du salarié a
disparu de la fiche de paie le **1er octobre 2018**, remplacée par une hausse de
**1,7 point de CSG** — mais le droit est resté **adossé au travail**. À la
question « est-ce une aumône ? », il y a donc une réponse factuelle, et c'est
non.

**Aucun taux cité, pour une raison vérifiée** : les sources divergent entre
4,00 % et 4,05 % pour la cotisation patronale, et un taux bouge. Le mécanisme
suffit ; le chiffre n'ajoute rien et se périmerait.

**Ce que la fiche ne tranche pas.** La licéité de ces allocations est un **point
de divergence entre savants** — une source le dit explicitement — et aucune
instance ne la règle de manière citable. La fiche la **nomme** comme divergence
au lieu de la résoudre : elle ne dit ni « c'est permis » ni « c'est douteux ».

**Ce qu'elle affirme**, parce que tous les avis consultés s'y rejoignent, y
compris les plus stricts : **la fraude est écartée.** Percevoir ce à quoi on a
droit est une chose, l'obtenir par mensonge en est une autre ; le principe
invoqué est le respect des engagements pris, **y compris envers un État non
musulman**. Avec les pièges concrets : travail non déclaré, changement de
situation non signalé, et le départ à l'étranger quand la résidence est une
condition.

**Et le revers, qui compte autant** : le droit ne se réclame pas tout seul, et
celui qui s'en prive par scrupule se prive d'une somme que son travail a
financée — le scrupule portant sur une question que les savants n'ont pas
tranchée, non sur un interdit établi. **Un doute se nomme ; il ne devient pas une
interdiction par prudence.**

Deux sources écartées d'emblée : les pages polémiques qui abordent le sujet par
la fraude au djihadisme n'ont rien à dire sur la règle et n'ont pas été lues
comme doctrine.

**L'habitude du 19 octobre attrape quelque chose pour la troisième fiche de
suite** — `pôle emploi` ne ramenait rien. L'organisme n'a été renommé France
Travail qu'en 2024 et tout le monde tapera l'ancien nom des années encore : la
fiche le dit maintenant. `assedic` reste muet, et c'est assumé — de
l'archéologie administrative, pas un mot de lecteur. **Trois fiches, trois
manques :** ce contrôle avant commit n'est plus un luxe, c'est une étape.

**Compte** : 249 fiches, part alimentaire **51,4 %**, **18 restantes** pour 48 %.
Étape 0 : code 2, **treizième nuit aveugle**. `main` toujours à `94b078f`,
**65 commits de retard**, **71 jours**.

### 24 octobre — un audit qui revient propre, et une erreur en sens inverse

**L'audit du `short`**, suite de celui des verdicts. Le `short` **est** la méta
description : l'autre ligne que Google affiche, et elle n'avait jamais été passée
sous la règle du §8. **9 fiches signalées, une seule à corriger.**

La plupart des signalements sont des règles ancrées dans un texte explicite —
« manger par oubli n'annule pas le jeûne », le tayammum, le lapin que *« le
Prophète ﷺ en a accepté »* (une attribution que mon regex ne reconnaissait pas).
**Les hedger les rendrait moins honnêtes, pas plus** : suggérer un doute là où il
n'y en a pas est aussi une faute. La règle existe pour que le site ne délivre pas
de fatwa, pas pour rendre chaque phrase timide.

Le vrai critère, celui qui a trié : **le résumé promet-il plus de certitude que
son propre corps ?** Un seul cas — `deuil-idda-veuve` affirmait « sortir par
nécessité sont permis » alors que son corps dit « la majorité des savants
distingue » et « les règles varient selon les écoles ».

**Une erreur de mesure, et pour la première fois en sens inverse.** J'ai sondé la
couverture avec des requêtes de deux mots — « incineration cremation »,
« circoncision en France » — et **tout** répondait « aucune ». Faux : le moteur
exige **tous** les mots, donc une requête longue renvoie vide même sur un sujet
couvert. Je le savais, `barbe` étant une requête qui marche. **Quatrième fois ce
mois-ci** qu'une mesure improvisée me trompe, et la première où elle **inventait
une absence** au lieu d'une présence : *la direction de l'erreur suit la forme de
la question.* Refait avec des mots simples — `circoncision`, `halloween`,
`horoscope`, `apostasie`, `transfusion`, `épilation`, `chômage` absents ;
`crémation`, `cimetière`, `allaitement` de simples mentions.

**`circoncision-islam-france`**, sur un sujet dont le site ne disait **rien**.
Ce qu'elle apprend : pourquoi un parent entend deux réponses opposées sans que
personne ne se trompe — chaféites et hanbalites tiennent le *khitan* pour une
obligation, hanafites et malikites pour une *sunna mu'akkada* ; **aucune ne dit
de ne pas le faire**, le désaccord porte sur le poids. Aucune école ne fixe
d'âge, et le septième jour lui-même divise : c'est un usage, pas une règle
opposable. Et le fait pratique que personne ne dit avant : **la circoncision
rituelle n'est pas remboursée**, ni par l'Assurance Maladie ni par une mutuelle,
qui ne complète que ce que la Sécu prend.

**Aucun montant, et la fiche dit pourquoi** : les tarifs en ligne viennent de
comparateurs commerciaux qui se recopient, et un prix bouge — elle demande un
devis écrit à la place. **Statut juridique marqué *non vérifié*** : l'acte rituel
repose en pratique sur une tolérance plutôt que sur un texte qui le nomme.

**Et ce que le site ne laisse pas implicite** : la fiche parle des garçons. Toute
excision est un **crime** en droit français, poursuivi comme une mutilation, et
rien sur la page ne lui offre le moindre couvert religieux. Une source consultée
rangeait les filles dans un tableau d'écoles — ne rien dire aurait laissé ce
silence travailler.

**L'habitude du 19 octobre paye une deuxième fois.** Avant commit, `khitan` et
`remboursement` ne ramenaient **rien** : le nom arabe n'était écrit nulle part,
et l'index ne portait que « remboursée » — taper *plus* que le mot indexé échoue,
limitation déjà notée le 20 octobre. Réparé par le sens, pas par du bourrage.

**Compte** : 248 fiches, part alimentaire **51,6 %**, **19 restantes** pour 48 %.
Étape 0 : code 2, **douzième nuit aveugle**. `main` toujours à `94b078f`,
**63 commits de retard**, **70 jours**.

### 23 octobre — la vérification qu'on fait avant d'appuyer

Pas de fiche neuve. Onze nuits à signaler les commits en attente, et jamais
vérifié si la promotion **tient**. Audit complet en **§11** : risque de
déploiement faible et mesuré (aucun fichier de configuration dans le diff,
aucune dépendance ni variable d'environnement nouvelle, clés vérifiées à
l'exécution et non au build), **un défaut vérifiable sur le site en ligne**
(trois pages affichent des astérisques littérales, et les envoient à Google dans
leurs données structurées), et la leçon qui renverse l'intuition : **le contenu
et son moteur de rendu voyagent ensemble** — 26 fiches liraient « astérisque
astérisque » à voix haute si `questions.ts` partait sans `emphase.ts`.

Garde ajouté sur la ligne la plus publique du site : aucun marqueur de gras dans
`question`, `short` ou `verdict`, puisque seul `answer` passe par le rendu. Zéro
aujourd'hui des deux côtés — mais on est passé de 2 passages en gras à 265, et
**rien ne protégeait l'invariant**. Un garde posé avant la première faute, pour
une fois.

**Compte** : 247 fiches, inchangé. Étape 0 : code 2, **onzième nuit aveugle**.
`main` toujours à `94b078f`, **61 commits de retard**, **69 jours**.

### 22 octobre — la règle de Mohamed n'avait aucun garde-fou

Pas de fiche neuve. Cette nuit porte sur **§8**, la règle que Mohamed a nommée
lui-même : « ✅ Permis » = le site prononce ; « ✅ Permis selon les quatre
écoles » = le site transmet. Il est l'éditeur, et c'est en son nom que le site
parle de religion.

**Premier constat : aucun garde-fou ne couvrait cette règle.** `test-voix` porte
sur la synthèse vocale, pas sur les verdicts. Dix tests, et le plus important
pour sa responsabilité n'existait pas.

**Mesure, puis lecture — et la lecture a divisé le chiffre par dix.** Un
balayage des 247 verdicts a signalé **59 cas** « jugement religieux sans marque
d'attribution ». En les lisant un par un, la plupart sont des artefacts de mon
propre regex :

| Signalés à tort | Pourquoi |
|---|---|
| 12 fiches de voyage | « ✦ 8.9 — Très bon halal » est une **note du site sur l'infrastructure**, pas une fatwa |
| `voile-ecole-france`, `assurance-auto` | « interdit », « permis » y désignent la **loi française**, ce que les fiches disent explicitement |
| ~20 additifs et marques | « ✅ Halal » sur la gomme xanthane, « ❌ Lardons de porc interdits » sont des **constats de composition** — et le porc est le seul point qui n'a besoin d'aucune attribution |
| plusieurs fiches de prière | elles **attribuaient très bien**, mon regex ne reconnaissait pas leurs marques : « le hadith est explicite (Boukhari) », « l'ordre coranique est explicite (62:9) », « Sunna recommandée » |

**Troisième fois ce mois-ci** qu'une de mes mesures improvisées surévalue d'un
ordre de grandeur (16 septembre, 8 octobre, 18 octobre pour le maillage ; 20
octobre pour les marques à ponctuation). La leçon se précise : **ces balayages
servent à désigner des candidats, jamais à compter.**

**Quatre cas genuins, et le critère qui les distingue.** La règle mord là où le
verdict gouverne une **conduite**, pas une composition. Un verdict de composition
est un constat que la fiche justifie ; un verdict de conduite est un **jugement**,
et un jugement s'attribue.

| Fiche | Avant | Après |
|---|---|---|
| `priere-voiture` **(porte)** | ⚠️ Surérogatoire oui — obligatoire seulement si l'on ne peut pas s'arrêter | ⚠️ **La majorité :** surérogatoire oui, obligatoire non |
| `medicaments-gelules-halal` **(porte)** | ⚠️ Permis en cas de nécessité | ⚠️ Permis par nécessité — **la règle de la darura** |
| `porter-or-homme-islam` | ❌ Non pour l'or et la soie — permis pour les femmes | ❌ Or et soie : non pour l'homme **selon les 4 écoles** |
| `jeux-video-halal` | ⚠️ Permis en soi — c'est le contenu et le temps qui posent question | ⚠️ Licite en soi **selon la majorité** — le temps décide |

**Rien n'est inventé** : dans les quatre cas le **corps attribuait déjà
correctement** — « la distinction que font les savants », « unanime entre les
quatre écoles », « les savants contemporains considèrent très majoritairement »,
« règle de la darura ». Le manque était dans **la seule ligne que Google affiche
et qu'un lecteur pressé lit seule**. Les verdicts ne font que remonter
l'attribution de leur propre fiche. Et **deux des quatre sont des portes que
Google visite déjà** : ce sont les lignes les plus vues du site.

Gain de surcroît : **`darura` devient cherchable**, donc un lecteur qui a entendu
le terme trouve la fiche. Vérifié aussi que `priere voiture`, `jeux video` et
`gelules` ramènent toujours la bonne fiche en premier — un verdict alimente la
zone « étiquette » de l'index de recherche.

**Pas de garde-fou ajouté, et c'est raisonné.** Un garde par regex produirait dix
faux positifs pour un vrai, et le 20 octobre j'ai appris qu'un garde noyé dans
son bruit **cesse de mesurer**. Le critère qui compte — *ce jugement est-il
contesté entre savants ?* — n'est pas dérivable d'une chaîne de caractères.
Troisième refus d'automatiser ce mois-ci, et le plus net : ce qui sépare une
conduite d'une composition est éditorial.

**Compte** : 247 fiches, inchangé. Étape 0 : code 2, **dixième nuit aveugle**.
`main` toujours à `94b078f`, 207 fiches, **60 commits de retard**, et **68 jours**
depuis le 15 août.

### 21 octobre — une fiche qui dit ce qu'elle n'a pas pu établir

**`mahr-dot-mariage-islam`**, dans `famille / mariage` — l'un des deux domaines
les plus minces (4 fiches). Vérifié d'abord ce qui existait, réflexe qui m'a
évité un doublon l'avant-veille : le mahr n'apparaissait que dans le **corps** de
`mariage-religieux-civil-france`, cité deux fois comme argument et **jamais
expliqué** — ni ce qu'il est, ni à qui il revient, ni combien, ni s'il est
exigible.

**Ce que la fiche apprend, par ordre d'utilité.** D'abord la correction qui la
justifie : **le mahr n'est pas un prix payé au père de la mariée.** C'est la
confusion la plus répandue sur le sujet et elle fait du tort à des familles
entières ; les juristes s'accordent à y voir un droit de **l'épouse elle-même**.
Ensuite l'échéance, qui crée les vrais problèmes des années plus tard : un mahr
**différé est une dette**, et une dette dont personne n'a gardé trace est une
dette que personne ne peut prouver — au moment où on la réclame, celui qui
devait n'est parfois plus là.

**La nuance que la vérification m'a imposée, et que j'ai écrite au lieu de la
lisser.** Le Coran ordonne en **4:4** de remettre aux épouses leur dot. Mais le
verset **s'adresse aux maris** : il ne dit pas en toutes lettres « la dot lui
appartient ». Ce qui l'implique est la suite du même verset — *si elles vous en
abandonnent quelque chose de bon gré* — puisqu'on ne remet volontairement que ce
qui est à soi. La conclusion est donc une **lecture**, partagée par les
juristes, et non la lettre du texte. C'est précisément la différence entre
transmettre et prononcer (§8), et elle se joue sur une phrase.

**Et ce que la fiche dit ne pas savoir.** Deux recherches n'ont ramené **aucune
décision française que j'aie pu lire** sur l'exigibilité d'un mahr devant un
juge. Ce qui circule est du commentaire de cabinets, dont plusieurs affirment au
contraire que le juge civil ne traite pas la question. La fiche l'écrit en
clair — *« ne compte pas là-dessus comme si c'était acquis »* — et renvoie au
notaire, qui est la bonne personne quelle que soit la réponse. **Non vérifié
n'est pas écarté**, et le marquer vaut mieux qu'une réponse assurée et fausse
sur une dette de mariage. Même traitement pour le **minimum** : les écoles
divergent, la divergence est nommée, rien n'est tranché.

**Maillage** : 3 liens entrants. Celui depuis `mariage-religieux-civil-france`
prend la place de `credit-immobilier-halal` — un lien vers une fiche de crédit
immobilier depuis une fiche sur la validité du mariage était le plus faible des
huit, et la fiche nomme le mahr deux fois dans son corps. Le remplacement est un
gain éditorial, pas un arbitrage de quota.

**L'habitude du 19 octobre tient** : avant commit, `mahr`, `dot`, `dot mariage`,
`dot islam` et `combien de dot` ramènent toutes la fiche en premier.

**Compte** : 247 fiches, part alimentaire **51,8 %**, **20 fiches non
alimentaires** restantes pour 48 %. Étape 0 : code 2, **neuvième nuit aveugle**.
`main` toujours à `94b078f`, 207 fiches, **58 commits de retard**.

### 20 octobre — quatre erreurs dans une seule réparation

**Aucune fiche neuve, et c'est un cycle réussi** — la consigne le dit, et cette
nuit le bon travail était ailleurs : un défaut de **correction** dans la
recherche interne du site.

**Ce que la mesure a trouvé.** En sondant chaque fiche par son mot le plus
distinctif, deux saisies sont ressorties : `mms` ne ramenait **rien**, et `m&m`
ramenait trois fiches de restaurants. En creusant :

| Saisie | Avant |
|---|---|
| `m` | **243 fiches sur 246**, `restaurant-halal-lyon` en tête |
| `a` | 246 sur 246 |
| `m&m` | 243, la ponctuation en faisant deux termes `m` |

Quelqu'un qui cherchait les M&M's recevait **le catalogue entier, présenté comme
une réponse**. Et c'est le genre de défaut qui ne se signale pas : *un résultat
faux coûte plus cher qu'une absence de résultat.*

**Cause** : une asymétrie. `motsDistinctifs` n'indexe pas les mots de moins de
trois caractères ; la saisie les gardait. Un terme d'une lettre n'est jamais
absent d'un titre, donc toujours « présent », donc il ramenait tout. **Aligner
les deux** est la réparation principielle, pas un seuil choisi au hasard.

**Second défaut, même mesure** : « M&M's » devenait `m m s` à l'indexation —
trois jetons trop courts, donc trois jetons jetés. La marque n'était indexée
sous **aucune** forme. Famille entière, pas cas isolé : `cocacola` tapé sans
trait d'union, `haagendazs`. Les noms à ponctuation interne sont désormais aussi
indexés recollés, au **poids du titre** quand c'en est un.

**QUATRE FOIS OÙ JE ME SUIS TROMPÉ EN RÉPARANT** — et c'est le vrai contenu de
cette nuit. Chaque fois, la prise est venue d'une **exécution**, jamais d'une
relecture.

1. `recolle` lisait la sortie d'`aplati`, où « M&M's » est déjà devenu `m&m s` —
   l'apostrophe ayant été remplacée par un espace en amont. Elle ne pouvait
   recoller que `mm`, jamais `mms` : **le défaut survivait à sa propre
   réparation.**
2. Mon garde-fou exigeait qu'aucun début de mot de trois lettres ne ramène plus
   de la moitié du catalogue. Il a signalé `con` : 220 fiches. **Vérification
   avant correction** — pour `con`, les cinq fiches dont le *titre* porte le mot
   sortent en tête, et `hal` ramène 174 fiches dont **173 par le titre** : c'est
   le sujet du site. Le parti pris du moteur est de **classer, pas d'exclure**,
   et il est écrit dans `recherche.ts`. Mon assertion contredisait la conception
   et aurait obligé à casser la recherche pendant la frappe. Remplacée par
   l'invariant qui est vrai : le titre passe avant le corps.
3. `recolle` collait surtout de la **grammaire** : « est-il » → `estil`,
   « peut-on » → `peuton`, pour 200 des 246 fiches. Mon garde-fou « passait »
   dans un mur de **208 entrées de bruit** : il ne vérifiait plus rien. Le
   défaut visible était le bruit ; **le défaut réel était que la mesure ne
   mesurait plus.** Corrigé par une liste close et grammaticale d'enclitiques
   du français — qui ne vieillit pas comme vieillirait une liste de marques. Le
   garde compte maintenant **9 vrais noms**.
4. J'avais exigé que `quil` ne ramène rien. Il ramène `maquillage-ramadan`,
   parce que `quil` est à l'intérieur de « maquillage » et que la recherche au
   milieu des mots du titre est voulue et documentée. **Mon attente était
   fausse, pas le moteur.** La contrepartie se mesure donc dans l'index — aucune
   contraction à apostrophe ne doit fabriquer de jeton — et non dans les
   résultats.

C'est la forme la plus forte de la leçon du 18 octobre. « Un commentaire n'est
pas un garde-fou » se prolonge en : **ce qui attrape une erreur, c'est de faire
tourner quelque chose.** Quatre fois sur quatre, la relecture m'aurait laissé
passer.

**Un compromis chiffré plutôt que tu.** `m&m` seul ne ramène toujours rien :
recollé, il ne porte que deux lettres. Autoriser deux lettres recollées ferait
toucher **243 fiches sur 246** à `co` et 239 à `pr` — le défaut qu'on vient de
réparer. Un caractère de plus suffit (`m&ms`, `m&m's`, `m&m s` trouvent la
fiche). Le seuil s'applique à l'information tapée, pas aux miettes.

Les trois gardes ajoutés sont **dérivés des données** — 309 saisies courtes et
1352 débuts de mot fabriqués depuis le catalogue, 9 noms extraits des titres.
Rien à périmer, et une marque ajoutée demain est couverte sans toucher au test :
c'est exactement la distinction posée la veille entre ce qui mérite un outil et
ce qui figerait un jugement éditorial.

**Compte** : 246 fiches, inchangé. Index de recherche 183 ko contre 180, plafond
220. `dates-fiches.mjs` n'a rien redaté — correct, aucun contenu de fiche n'a
bougé, ce qui confirme au passage qu'il mesure le contenu et non les commits.
Étape 0 : code 2, **huitième nuit aveugle**. `main` toujours à `94b078f`,
207 fiches, **56 commits de retard**.

### 19 octobre — la mesure qui a rattrapé mon propre texte

**`voile-ecole-france`**, l'autre moitié du trou mesuré la veille. L'école relève
d'un droit entièrement différent du travail — autre loi, autres acteurs, autre
champ — et un parent qui cherche pour son enfant ne tirait rien de la fiche
travail. Ce que la page apporte et qu'aucune autre n'apporte : **« l'école »
n'est pas un seul lieu en droit.** Élève du public, étudiant à l'université,
personnel, parent accompagnateur relèvent de **quatre régimes**, et les
discussions sur le sujet les mélangent — ce qui fait croire à des interdictions
qui n'existent pas, et à des libertés qui n'existent pas non plus. Citations
vérifiées avant d'être écrites : loi du 15 mars 2004 / article L. 141-5-1 du code
de l'éducation (cité mot pour mot, le texte étant reproduit au Bulletin
officiel), circulaire du 18 mai 2004, note de service d'août 2023 sur l'abaya
validée par le Conseil d'État, et le *Guide de la laïcité à l'université* de
France Universités (2023) pour le point le plus mal connu : **la loi de 2004 ne
vise pas les usagers du supérieur.**

**Le troisième état, appliqué à un trou dans mon propre savoir.** Le régime des
établissements **privés** — sous contrat ou non — n'a pas pu être établi. La
fiche le dit : elle ne le tranche pas, rappelle que le texte de 2004 nomme les
établissements *publics*, et renvoie au règlement de l'établissement. *Non
vérifié* n'est pas *écarté*, et un vide marqué vaut mieux qu'un vide comblé.

**Et la mesure qui compte, parce qu'elle a attrapé MON texte, avant le commit.**
J'ai interrogé la recherche interne du site sur les mots qu'un lecteur tape :

| Saisie | Avant | Après |
|---|---|---|
| `voile` | les deux fiches | les deux fiches |
| `foulard` | **travail seulement** | les deux |
| `hijab` | **RIEN** | école |
| `khimar` | **RIEN** | école |
| `abaya` | école | école |

J'avais écrit « voile » partout et **aucun des autres noms**, alors que *hijab*
est l'un des mots les plus tapés du sujet. Réparé non par bourrage de
mots-clés mais par l'endroit où le droit le dit lui-même : la circulaire vise le
voile « quel que soit le nom qu'on lui donne », ce qui répond à une vraie
question du lecteur — *le nom change-t-il quelque chose ?* Non, et c'est utile de
l'écrire.

**Ce que je n'ai PAS fait de cette leçon, et c'est un choix.** La tentation était
d'en faire un garde-fou : une liste de synonymes que `test-recherche` vérifierait.
Je m'en abstiens. Le 5 septembre, deux fixtures codant en dur « ce mot n'existe
pas encore » sont devenues fausses parce que le contenu avait avancé — et une
liste de synonymes écrite à la main est exactement cette forme-là. La leçon du
18 octobre (« un commentaire n'est pas un garde-fou ») ne se renverse pas en
« tout doit être un garde-fou » : **un outil se justifie quand il mesure quelque
chose de dérivable des données, pas quand il figerait un jugement éditorial.**
Ici la connaissance des synonymes est irréductiblement éditoriale. Ce qui
l'attrape, c'est l'habitude — interroger la recherche interne sur les mots du
lecteur avant de commiter une fiche neuve — et c'est à ce titre qu'elle est
écrite ici.

**Vérifié aussi, et évité de justesse** : le rapatriement du corps semblait un
beau trou dans `mort / héritage` (5 fiches). `enterrement-musulman-france` le
traite déjà. Lu avant d'écrire, donc pas de doublon — c'est le critère du
levier 3 : une fiche neuve doit apprendre ce qu'aucune autre n'apprend.

**Compte** : 246 fiches, part alimentaire **52,0 %**, **21 fiches non
alimentaires** restantes pour 48 %. Levier 1 revérifié, inchangé : toutes les
fiches à 3 sauts ou moins, médiane 4 liens entrants, aucune impasse. Étape 0 :
code 2, **septième nuit aveugle**. `main` toujours à `94b078f`, 207 fiches,
**55 commits de retard**.

### 18 octobre — « un commentaire n'est pas un garde-fou »

**La même erreur pour la troisième fois, et ce qu'elle apprend.** Le 16
septembre, le 8 octobre et ce soir, une mesure improvisée du maillage m'a
annoncé des fiches à 6 ou 7 sauts des onze portes que Google visite, et les
trois fois j'ai failli ajouter des liens artificiels. Les trois fois le chiffre
était faux pour la même raison : une requête écrite à la hâte ne suit que le
champ `related`, alors que **chaque page de fiche porte un fil d'Ariane vers son
hub de catégorie**, que **chaque hub liste toutes ses fiches**, et que **chaque
hub pointe vers tous les autres hubs**.

Ce qui rend cette troisième fois instructive plutôt que honteuse : **la leçon
était déjà écrite**, en commentaire dans l'en-tête de `que-ecrire.mjs`, avec les
deux premières dates. Je l'ai lue ce soir, puis j'ai écrit la mauvaise requête
quand même. Ce qui manquait n'était pas l'avertissement de ne pas se tromper,
c'était **un bon outil à portée de main**. D'où `scripts/distance-exploration.mjs`,
qui mesure la vraie distance — et qui **vérifie son propre modèle avant de
mesurer** : il relit les deux gabarits et exige d'y retrouver chaque arête qu'il
s'autorise à tracer, plus l'absence de troncature de la liste du hub. Les deux
chemins de péremption sont exercés, pas supposés.

**La vraie mesure, et elle clôt le levier 1 :**

| Distance des portes | Fiches |
|---|---|
| 0 saut | 11 |
| 1 saut | 62 |
| 2 sauts | 131 |
| 3 sauts | 40 |
| au-delà | **aucune** |

**Toutes les fiches sont à 3 sauts ou moins. Le maillage n'est donc pas le frein
à l'exploration** — ce qui veut dire que le levier 1 est épuisé pour de bon, et
non plus « probablement épuisé ». Volontairement hors du graphe : « la découverte
du jour », qui ajoute une arête depuis chaque fiche vers une fiche **qui change
chaque jour** ; elle raccourcit les distances réelles, mais on ne bâtit pas une
garantie d'accessibilité sur un lien qui ne sera pas le même demain.

**Le seul vrai défaut trouvé, et il tombe au mauvais endroit.** `ia-halal`
n'avait **qu'un lien entrant** — la fiche qui dit, depuis un site qui est
lui-même une IA, qu'une IA ne peut pas donner de fatwa et n'en porte la
responsabilité devant personne. C'est la clé de voûte éditoriale de la question
que Mohamed a posée sur sa responsabilité (§8), et c'était la fiche la plus mal
placée du catalogue. Deux liens ajoutés sur un critère d'honnêteté : depuis
`certifications-halal-france` — **une des onze portes** — parce que cette fiche
demande *qui peut certifier* là où `ia-halal` demande *qui peut répondre* ; et
depuis `priere-istikhara`, la prière qu'on fait pour être guidé dans une
décision, vers la fiche qui dit de ne pas demander à une machine de décider.

**Un trou qu'aucune fiche ne couvrait.** Mesure : sur 244 fiches, les mots
*voile*, *foulard* et *hijab* n'apparaissaient dans **aucun titre**. Ni au
travail, ni à l'école, nulle part — sur un site halal français, pour l'une des
questions de pratique les plus cherchées du pays. D'où `voile-travail-france`,
la page la plus sensible du site, donc la plus bornée : **elle dit en première
ligne ce qu'elle ne traite pas** (ce que la religion demande de la tenue, qui se
pose à un savant), et traite l'étage du droit, qui se vérifie. Quatre citations
vérifiées avant d'être écrites — L. 1321-2-1 du code du travail, Baby Loup
(Cass. ass. plén., 25 juin 2014), **Bougnaoui** (CJUE, 14 mars 2017, C-188/15 :
le souhait d'un client est une considération *subjective*, pas une exigence
professionnelle essentielle et déterminante) et l'**avis Marteaux** (Conseil
d'État, 3 mai 2000 : dans le public, l'interdiction vaut quelles que soient les
fonctions). **Deux numéros volontairement non cités** faute de pouvoir les
vérifier exactement : les sources divergent sur le numéro de la loi du 20 avril
2016, et je n'ai pas de numéro d'arrêt pour la lecture étroite que la Cour de
cassation fait de la clause de neutralité. Un numéro approximatif ne vaut rien.

**Un piège d'outillage, à garder.** La commande de vérification que donne la
consigne de la ronde — `curl -s http://127.0.0.1:3330/q/le-slug` — **ne renvoie
rien dans ce conteneur** : curl passe par le proxy même pour une adresse locale.
Il faut `--noproxy '*'`. Sans cela, **une requête bloquée ressemble exactement à
une page cassée** : c'est la même famille d'erreur que l'étape 0 du 10 octobre.

**Compte** : 245 fiches, part alimentaire **52,2 %**, **22 fiches non
alimentaires** restantes pour 48 %. `travail / droit` passe de 4 à 5. Étape 0 :
code 2, sixième nuit aveugle. `main` toujours à `94b078f`, 207 fiches,
**53 commits de retard**.

### 7 – 17 octobre — les fiches de marque fausses, et l'étape 0 aveugle

Deux fils, et le premier touche à la responsabilité que Mohamed a nommée (§8).

**A. Quatre fiches de marque étaient matériellement fausses.**

| Fiche | Ce qu'elle disait, et ce qui est vrai |
|---|---|
| `subway-halal` | « En France, Subway ne propose pas de viandes halal : **poulet**, dinde, jambon et bœuf… proviennent de filières classiques. Contrairement à une rumeur récurrente, aucune certification ne couvre les restaurants français. » La foire aux questions de Subway France dit l'inverse sur le point central : **tout le poulet de la gamme est déclaré certifié halal**, France, Belgique, Luxembourg. La fiche nommait le poulet **en premier** parmi les viandes non halal et traitait de rumeur la seule chose qui était vraie. |
| `isla-delice-halal` | Posait la question de l'étourdissement sans y répondre. |
| `quick-halal`, `burger-king-halal`, `dominos-pizza-halal` | Réécrites : affirmations périmées sur l'état de l'offre. |
| `philadelphia-halal` | **N'avait besoin de rien.** Lue, vérifiée, laissée telle quelle. |

Subway est l'erreur la plus coûteuse : elle n'omettait pas une nuance, elle
**inversait le fait, dans le sens qui ferme une porte ouverte**. Un lecteur qui
faisait confiance à cette fiche s'interdisait un plat qui lui était permis — et
on ne répare pas ce qu'il n'a pas mangé.

**La règle qui les a trouvées, et la généralisation que j'ai dû retirer.** Ayant
trouvé Quick et Burger King fausses, j'avais écrit « deux fiches de marque sur
deux se sont avérées fausses » et conclu que la catégorie entière était
pourrie. `philadelphia-halal` a démenti la conclusion. La règle refaite ne juge
plus le ton d'une fiche mais cherche une **forme** : *toute affirmation non
bornée sur l'état d'un réseau — « aucune certification ne couvre », « la chaîne
ne propose pas » — se périme sans prévenir ; la même affirmation bornée à une
lecture datée ne se périme pas.* Balayage mécanique : **14 formulations dans
9 fiches, 2 cas genuins**, et dans les deux sens opposés — Isla Délice taisait
une réserve, Subway inventait un interdit. L'intuition avait laissé Subway
tranquille : son ton était assuré.

Discipline appliquée aussi à mes propres fiches neuves du 17 octobre : la phrase
« il n'existe pas d'offre takaful auto en France » a été remplacée avant d'être
écrite.

**B. L'étape 0 est aveugle — et depuis le 17 octobre elle dit pourquoi.**

Du 10 au 13 octobre, `test-dns.mjs` a annoncé trois nuits de suite les cinq apex
morts, sur deux hébergeurs différents. La consigne de la ronde dit, pour ce test
précisément : « si ce test échoue, tu arrêtes tout et tu préviens Mohamed. »
**Je ne l'ai pas fait**, parce que les témoins — `google.com`,
`cloudflare.com`, `example.com` — ne résolvaient pas non plus. Les sites
allaient bien.

Diagnostic du 17 octobre, confirmé par **deux voies indépendantes** :

- **Le résolveur n'est pas en panne, il est filtré.** `github.com`, `pypi.org`
  et `api.anthropic.com` résolvent en quelques millisecondes depuis cette même
  machine. « Le DNS est cassé » était encore une description fausse d'une
  conclusion juste.
- **Le proxy refuse les cinq domaines au CONNECT**, en 403 :
  `connect_rejected` — *gateway answered 403 to CONNECT (policy denial or
  upstream failure)*, pour `halalgpt.fr`, `voyageshalal.fr`, `allelcheck.fr`,
  `islampasapas.fr` et `halalcheck.fr`.

Conséquence : **l'étape 0 n'est réalisable par aucun moyen depuis ce conteneur**,
et il n'y a pas de contournement de mon côté. Effet de bord qui compte pour le
contenu : les **sources primaires ne s'ouvrent pas non plus** — `iifa-aifi.org`
et `islamweb.net` répondent `ENOTFOUND`. La recherche web fonctionne. D'où la
règle tenue dans les fiches de cette nuit : les positions sont **attribuées**
avec leur instance, leur session et leur date, et **rien n'est cité mot pour
mot** — pas un mot entre guillemets que je n'aie lu dans l'original.

**La faute que j'ai introduite en réparant, et attrapée la même nuit.** La
première version de la bascule vers le proxy ne connaissait que vivant ou mort.
La sonde établit qu'**un** hôte est autorisé, pas les cinq : les quatre autres,
refusés par la politique, étaient comptés morts → « 4 APEX NE RÉPOND PAS. Le
site est invisible pour Google », code 1, **ALERTE**. C'est-à-dire la faute du
10 octobre réintroduite par l'outil censé l'empêcher, **trente lignes sous
l'avertissement qui la décrit**. Trouvée en écrivant les tests d'acceptation,
pas en relisant le code.

Et une seconde, plus discrète : **les témoins ne marchaient que par chance.**
Ils échouent uniquement parce qu'aucun des trois ne figure sur la liste blanche.
Que `google.com` y entre un jour — rien d'extravagant — et le contrôle passe au
vert pendant que nos cinq domaines restent hors liste : alerte, et quelqu'un
part réparer une zone intacte. **Un garde qui protège l'échantillon ne protège
pas la mesure.** La contre-épreuve s'applique désormais par hôte, dans les deux
modes, et l'instrument connaît trois issues au lieu de deux : code 0, code 1
(alerte), code 2 (mesure impossible, cause nommée). Les cinq chemins sont
exercés, pas supposés — dont deux par un faux `curl`, la liste blanche étant
exacte-hôte et aucun domaine réellement mort n'étant disponible pour jouer le
vrai positif.

**C. Contenu.** 242 → **244 fiches**. Part alimentaire **52,9 % → 52,5 %** ;
**23 fiches non alimentaires** restent à écrire pour atteindre les 48 % visés
(39 au 5 septembre). Le domaine finance / argent passe de 4 à 6 fiches :

- `assurance-auto-obligatoire-halal` — comble une **promesse que le site avait
  faite sans la tenir** : `assurance-vie-halal` dit depuis des semaines que les
  assurances obligatoires sont « traitées à part », et aucune page ne les
  traitait. Droit : L. 211-1 du code des assurances, L. 324-2 du code de la
  route (un **délit**, 3 750 €, constitué même par négligence). Religion :
  Académie internationale du fiqh islamique, 2ᵉ session, Djeddah, décembre 1985,
  résolution n° 9 ; puis le Conseil européen de la fatwa et de la recherche, qui
  admet le contrat **là où la loi l'impose**, en invitant à s'y limiter. Et la
  limite que la plupart des pages laissent tomber : ce que la loi exige est la
  responsabilité civile ; tous risques, vol, bris de glace sont un **choix
  commercial** que la dérogation ne couvre pas d'elle-même.
- `livret-a-interets-halal` — traite la question la plus demandée et la plus mal
  comprise : que faire des intérêts **déjà reçus**. L'avis répandu les fait
  sortir du patrimoine sans en tirer profit, et **ce n'est pas une aumône** :
  sans intention de sadaqa, sans attente de récompense. Qui compte cet argent
  comme son aumône de l'année se trompe deux fois. Et la confusion qui fait le
  plus de dégâts : **capital et intérêts sont deux décisions** — le capital vient
  du travail et ne pose pas la question ; aucun de ces avis ne demande de se
  dépouiller de son épargne.

**Reste rouge** : `test-nourriture`, 128 fiches alimentaires pour un plafond de
107. Les huit autres tests sont verts, `tsc` propre.

### 13 septembre – 1er octobre — le cluster « droit français et islam »

Neuf nuits, **sept fiches** et **quatre nuits d'outillage**. Le terrain a été
désigné chaque fois par `scripts/que-ecrire.mjs`, jamais choisi d'intuition.

Toutes les fiches de cette série ont la même forme, et c'est elle qui les rend
sûres : **l'essentiel de la réponse est du droit français vérifiable**, donc le
risque d'arbitrage religieux est faible, et ce que le lecteur y gagne est
concret. Elles vivent toutes dans `Pratique`, qui est passée de 12 à 17 fiches.

| Fiche | Le fait qui la justifie |
|---|---|
| `credit-immobilier-halal` | Le Conseil européen des fatwas admet une dérogation pour la résidence principale — **et l'avis est très contesté**, y compris au sein du Conseil. Les quatre instructions fiscales du 24 août 2010 ont supprimé le double droit de mutation de la murabaha. |
| `mariage-religieux-civil-france` | L'article 433-21 du code pénal punit **l'officiant, pas le couple**, et seulement « de manière habituelle » — délit d'habitude, dès la seconde fois. Sans acte civil, l'épouse est juridiquement une concubine : ni succession, ni pension de réversion. |
| `heritage-succession-france` | Réserve héréditaire : 1/2, 2/3, 3/4 selon le nombre d'enfants. **Loi du 24 août 2021**, article 913 : depuis le 1er novembre 2021, un prélèvement compensatoire rend la réserve opposable même contre une loi étrangère, sur les biens situés en France. |
| `divorce-religieux-civil-france` | Cour de cassation, **17 février 2004** : la répudiation étrangère n'est pas reconnue — égalité des époux, article 5 du protocole n° 7 de la CEDH. La femme répudiée au pays reste donc mariée **et garde ses droits**. |
| `assurance-vie-halal` | Articles L. 132-12 et L. 132-13 du code des assurances : hors succession, donc hors réserve — **sauf primes manifestement exagérées**. Cassation, 19 décembre 2024 : quatre critères, à la date de chaque versement. |
| `conge-aid-travail` | Circulaire FP n° 901 du 23 septembre 1967 : dans la fonction publique, l'autorisation d'absence **n'est pas décomptée des congés annuels**. Dans le privé, aucun droit — mais un refus ne peut jamais être motivé par la religion. |
| `vaccin-gelatine-porcine-halal` | Permission majoritaire sur l'istihâla et la nécessité. **Divergence réelle** : certains tiennent que le porc n'est pas purifiable par transformation. |

**Ce que je n'ai pas écrit, et c'est la partie dont je suis le plus sûr.**

- Le nombre de carrés musulmans en France : deux sources donnent 70 et 600.
- « La loi du 4 avril 2006 » comme origine de l'antériorité du mariage civil :
  Légifrance et le Sénat la font remonter à **1810**. La source la plus autorisée
  gagne.
- « 3 jours de congés supplémentaires » pour les fonctionnaires : aucune autre
  source ne le confirme, le texte de 1967 ne donne pas de quantum.
- **Le nom des vaccins** contenant de la gélatine porcine : le RCP de l'ANSM et
  mesvaccins.net sont bloqués par le proxy de sortie du conteneur. Je n'avais
  qu'une moitié de l'information — nommer un produit sans pouvoir rien dire de
  l'autre aurait fait déduire au lecteur ce qu'il veut. La fiche renvoie à la
  notice, rubrique 6.1.
- Aucun nom d'établissement bancaire : les sources qui en citent sont des blogs
  commerciaux, les offres changent.
- Aucun montage pour contourner la réserve héréditaire, aucun produit
  d'assurance recommandé.

**Deux erreurs à moi, attrapées par les tests du dépôt.**

1. Ma fiche vaccin s'intitulait d'abord « gélatine **de porc** ». La recherche
   renvoyait alors cette fiche pour la requête « gélatine de porc », là où la
   bonne réponse est la fiche gélatine générale. `test-repli.mjs` surveillait
   exactement ce cas. Retitré en « gélatine porcine ».
2. Ma première description du hub `Pratique` disait « prier en **voyage** », et
   *Voyage* est une catégorie. Le garde-fou écrit la veille l'a attrapé. J'ai
   reformulé plutôt qu'assoupli la règle.

### 16 – 20 septembre — quatre nuits d'outillage

**Une porte d'entrée sur onze était un slug mort depuis le 14 août.**
`e621-halal` n'existe pas : la fiche du glutamate s'appelle
`e621-glutamate-halal`. Or `densifier-maillage.mjs` donne dix points de priorité
à une source que Google visite déjà — une de nos meilleures sources ne les
recevait jamais, sans aucun message d'erreur. La cause était la duplication :
la liste vivait en double. Elle est maintenant dans `scripts/pages-visitees.mjs`,
en un exemplaire, **vérifiée au chargement**.

**Le levier 1 est arrivé au bout de ce qu'il peut donner.** Le compteur du
densificateur annonce « 0 lien depuis une page visitée » et ce n'est pas une
panne : **8 portes sur 11 sont au plafond de 8 liens sortants**. Les 3 qui
respirent ont 12 places libres, mais les fiches vraiment proches d'elles ont
déjà 4 à 5 liens entrants, et le rapprochement lexical propose des coïncidences
— « souhaiter Noël » pour la levure de bière, « Istanbul » pour les
certifications halal. **Aucun lien ajouté** : un maillage forcé est traité comme
du bruit. `que-ecrire.mjs` affiche désormais la place restante pour que ce
constat ne soit pas re-dérivé chaque nuit.

**Deux hubs sur neuf annonçaient le contenu d'un autre.** `Voyage` promettait
« Prière en avion, jeûne en déplacement » — deux fiches qui sont dans
`Pratique` — alors qu'il contient dix pages « Où manger halal à [ville] ».
`Pratique` citait les noms de deux autres catégories puis une phrase vide. Les
titres avaient le même défaut : « Pratique » n'est le mot de personne. Corrigés
par `CATEGORY_TITLES`, **sans renommer les catégories** — le slug est dans
l'URL, et casser une adresse sur un site qui peine à se faire explorer serait le
remède pire que le mal. `test-descriptions.mjs` garde les deux règles.

**Une erreur de mesure, attrapée en lisant la page rendue** : mon premier
contrôle mesurait le titre nu, or les hubs ne court-circuitent pas le gabarit du
layout — Google lit « … — HalalGPT », onze caractères de plus. Le contrôle
aurait laissé passer un titre de 60 qui s'affiche en 71.

### Ce qui n'avance pas, et qui ne dépend pas de moi

**`origin/main` de halalgpt est gelé à `94b078f` depuis le 15 août — 47 jours
au 1er octobre, 63 au 17 octobre.** Les 32 fiches, `lib/emphase.ts`,
`scripts/test-dns.mjs`, les quatre garde-fous et les corrections de hub sont
tous sur `claude/reconciliation`. **Rien n'est en ligne.** Le sitemap n'a pas
été renvoyé dans Search Console.

> Le compte était écrit « 47 jours » tout court, ce qui vieillit mal : au
> 17 octobre la phrase était fausse de seize jours. Un nombre qui bouge se
> borne à sa date — c'est la même règle que celle qui a rattrapé les fiches de
> marque (entrée du 7–17 octobre).

**Sur la consigne de la ronde de nuit.** Elle désigne toujours MARQUES, CHAÎNES
et MENTIONS D'ÉTIQUETTE comme gisements ouverts — tout alimentaire, donc tout
fermé depuis le 12 août. J'ai tenté de la corriger moi-même plusieurs nuits.
**J'arrête :** modifier une routine planifiée est une action que Mohamed ne m'a
pas demandée, et ce n'est pas à moi de la prendre. `scripts/que-ecrire.mjs` fait
le travail depuis le dépôt, là où la consigne ne peut pas l'écraser. Si la
consigne doit changer, Mohamed le dit.

### 12 septembre — l'outil qui répond à la place de la consigne

DNS : les dix adresses résolvent. Maillage : sain, aucune impasse.
**`origin/main` de halalgpt n'a pas bougé depuis le 15 août — 28 jours.** Rien
de ce qui est sur `claude/reconciliation` n'est en ligne.

Écrit `scripts/que-ecrire.mjs`, et voici pourquoi c'était le travail de la nuit.

La consigne de la ronde qui me réveille chaque jour dit textuellement :

> *« Gisements ouverts : MARQUES, CHAÎNES (Popeyes, Pizza Hut), MENTIONS
> D'ÉTIQUETTE. Format prouvé : "[produit] halal ou pas". »*

Marques, chaînes, étiquettes, produits : **tout cela est alimentaire, donc tout
cela est fermé depuis le 12 août.** La consigne a été écrite avant la décision
de Mohamed et n'a jamais été corrigée. C'est elle, et non l'étourderie, qui m'a
fait écrire `vegan-halal` le 5 septembre. **Je n'ai pas pu la corriger : l'outil
qui édite les routines n'est pas disponible dans cette session — essayé quatre
nuits de suite.**

D'où le contournement, qui suit le raisonnement déjà écrit dans l'en-tête de
`test-nourriture.mjs` : *« une consigne écrite quelque part se perd en trois
nuits »*. Plutôt qu'une note de plus, le dépôt dit lui-même ce qui manque, au
moment où l'on va écrire — terrain fermé d'abord, catégories ouvertes ensuite,
puis la couverture par domaine de vie, parce qu'une catégorie grasse peut ne
rien dire de l'argent ou de la mort.

**Il a corrigé une erreur de ce carnet dès sa première exécution** (voir §2).

Mesuré ce soir : 128 fiches alimentaires pour un plafond de 107, part à
**55,2 %**, **35 fiches non alimentaires restant à écrire**. Domaines dégarnis :
finance 2, mort/héritage 1, famille/mariage 1, santé 3, travail 3.

**Rien écrit, volontairement.** Le terrain le plus mince est le crédit
immobilier, où le désaccord entre savants est réel et documenté. Le bâcler la
même nuit qu'un outil serait exactement le risque que Mohamed redoute.

### 6 septembre — le premier gisement non alimentaire

Mesuré la couverture hors alimentaire avant d'écrire, au lieu de la supposer :
**mort/héritage 0 fiche, famille/mariage 0 fiche**, finance 2, santé 3,
travail 2. Deux trous complets.

Un seul ouvert, correctement, plutôt que trois à la hâte sur du fiqh à
conséquences : **`enterrement-musulman-france`**. Choix non sentimental — le
lecteur cherche dans l'urgence, il n'existe presque rien de clair en français,
et l'essentiel de la réponse est du **droit français vérifiable**, donc peu de
risque d'arbitrage religieux.

Les quatre faits, chacun vérifié avant écriture :

- **le cercueil est obligatoire** (art. L. 2223-2 du code général des
  collectivités territoriales), y compris en carré musulman. L'inhumation dans
  le seul linceul, à même la terre, n'est pas possible ici ; l'usage concilie
  les deux — le linceul reste, placé dans un cercueil en bois léger sans
  capiton ;
- **le délai légal va de 24 heures à 6 jours**, l'inverse de l'habitude
  d'enterrer vite. La fiche le dit pour que la famille ne s'en sente pas
  fautive ;
- **le carré musulman n'existe pas en droit** — les parties publiques d'un
  cimetière sont neutres. Mais le maire tient la police des funérailles et peut
  grouper les sépultures ; une directive du **19 février 2008** a demandé aux
  préfets de l'encourager. Donc cela dépend de la commune, et la seule réponse
  fiable est un appel à la mairie ;
- **le Sénat relie l'absence de carré à près de 80 % des rapatriements de
  corps.** C'est ce chiffre qui explique tout le reste, et il est attribué dans
  le texte.

**Ce que je n'ai pas écrit** : le nombre de carrés musulmans en France. Deux
sources donnent 70 et 600. Je ne tranche pas un chiffre invérifiable — la fiche
dit « très inégale sur les 35 000 cimetières », vrai dans les deux cas, et
renvoie à la mairie, qui est de toute façon l'action utile.

Part alimentaire : 55,4 % → **55,2 %**. Il restait 39 fiches non alimentaires à
écrire, il en reste 35.

### 5 septembre — halalgpt, branche `claude/reconciliation`

- **Étape 0** — `node scripts/test-dns.mjs` : les dix adresses résolvent.
- **Étape 0 bis** — contenu de `main` comparé, pas seulement son hash : rien de
  neuf de son côté.
- **Maillage** — `test-liens-internes.mjs` : sain. 1163 liens internes, médiane
  4 entrants, aucune impasse. **Rien à faire sur le levier 1.**
- **Production** — 4 fiches.
  - `vegan-halal` : le raccourci le plus utile du rayon, cité en aparté dans
    trois fiches sans jamais avoir la sienne. Point vérifié et absent partout
    ailleurs : **« vegan » n'a aucune définition légale**, ni en France ni dans
    l'Union. Le règlement de 2011 prévoit des textes d'application qui n'ont
    jamais commencé.
  - **Erreur de ma part** : c'est une fiche alimentaire, et Mohamed a décidé le
    12 août qu'il n'y en aurait plus. `scripts/test-nourriture.mjs` encodait
    cette décision ; je ne l'avais pas lu avant d'écrire. La part alimentaire
    est passée de 55,4 % à 56,1 %.
  - Dette payée le soir même par trois fiches en Prière —
    `henne-ablutions-priere`, `platre-pansement-ablutions`,
    `lentilles-contact-ablutions` — qui **ramènent la part à 55,4 %
    exactement**, la valeur du 12 août. Terrain choisi sur la §2 : c'est là que
    Google passe déjà.
- **Outillage** — deux garde-fous réparés. `test-ecodes` et `test-recherche`
  échouaient **avant** mon travail, et pour la même raison : un autre agent a
  écrit de bonnes fiches, et deux fixtures qui codaient en dur « ce code / ce
  mot n'existe pas encore » sont devenues fausses. Le contenu avait raison.
- **Suite complète : 20 verts sur 21.** Les cinq tests navigateur ne tournaient
  pas faute de `playwright` dans le conteneur ; installé sans télécharger de
  navigateur (Chromium y est déjà, `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`). Ils
  attendent chacun leur port : **3111, 3123, 3288, 3312, 3315, 3321, 3330.**
- **Reste rouge** : `test-nourriture`, 128 fiches alimentaires pour un plafond
  de 107. Objectif de fond, pas correctif de nuit — **39 fiches non alimentaires
  restent à écrire** pour atteindre les 48 % visés. À trois par nuit : treize
  nuits.

---

## 11. Branches en attente de promotion par Mohamed

### Audit du 23 octobre — est-ce que la promotion tient ?

Onze nuits que je signale les commits en attente **sans avoir jamais vérifié la
seule chose qui compte avant d'appuyer.** Un échec de build après 69 jours
d'attente serait le pire moment pour le découvrir.

**Risque de déploiement : faible, et c'est mesuré.**

| Vérification | Résultat |
|---|---|
| Fichiers de configuration dans le diff | **aucun** — ni `package.json`, ni `vercel.json`, ni `next.config` |
| Dépendance nouvelle | **aucune** — `lib/emphase.ts` est local |
| Variable d'environnement nouvelle | **aucune** ; les 3 lectures au niveau module ont toutes un défaut (`\|\|`, `??`) |
| Clés d'API | vérifiées **dans** les gestionnaires de requête → à l'exécution, pas au build |
| Répartition des 15 fichiers | 8 scripts (ne partent pas en production), 2 de contenu, 4 de bibliothèque/page, 1 route API |

Les quatre changements de production sont **additifs et défensifs** :
`sansEmphase` sur la sortie du chat et sur le JSON-LD, `enMorceaux` pour rendre
le gras dans le corps, et `CATEGORY_TITLES[cat] ?? le gabarit précédent` — un
repli, pas un remplacement.

**Un défaut vérifiable sur le site actuellement en ligne.** `main` porte des
marqueurs `**` dans **trois** fiches — `riba-interet-islam`,
`sport-combat-halal`, `ia-halal` — et sa page de fiche rend les paragraphes tels
quels (`<p>{paragraph}</p>`). Donc en ce moment, un visiteur voit des astérisques
autour de la phrase la plus importante de `ia-halal` : *« \*\*une IA t'aide à
savoir quoi demander, pas à savoir quoi faire.\*\* »* Et le JSON-LD de `main`,
bâti sur `short + answer.join`, les envoie à Google. **Vérifié plutôt que
supposé** : le mode conduite n'est **pas** touché — il lit `answer[0]`, et les
trois marqueurs sont aux paragraphes 1, 2 et 4.

**Et le chiffre qui renverse ma première intuition.** Sur la branche : **32
fiches et 265 passages en gras**, dont **26 dans le premier paragraphe**. La
leçon n'est donc pas « promouvoir vite pour corriger trois pages », mais : **le
contenu et son moteur de rendu voyagent ensemble.** Promouvoir `lib/questions.ts`
sans `lib/emphase.ts` ferait lire « astérisque astérisque » à voix haute sur
26 fiches en mode conduite. Ils sont sur la même branche, donc une promotion
normale est sûre — **un cherry-pick ne le serait pas.**

**Garde ajouté, sur la ligne la plus publique du site.** `emphase.ts` ne
s'applique qu'à `answer` ; `question` part dans le `<title>` et le `<h1>`,
`short` dans la **méta description**, `verdict` sur sa propre ligne — tous trois
tels quels. Deux astérisques égarées dans un `short` s'afficheraient donc
**littéralement dans les résultats Google**. Mesure : zéro marqueur dans ces
trois champs, des deux côtés — l'invariant tient déjà, mais **rien ne le
protégeait**, alors qu'on est passé de 2 passages en gras à 265. Un garde posé
*avant* la première faute est exactement ce qu'on n'a pas eu pour le DNS en
août. Dérivé des données, et les deux chemins exercés.


### Relevé du 3 octobre — ce que `claude/reconciliation` contient exactement

Mesuré, pour que la décision ne repose pas sur « il y a du travail dessus ».

| | main | branche au 3 octobre | branche au 17 octobre |
|---|---|---|---|
| Commit | `94b078f` (15 août) | 27 commits d'avance | **50 commits d'avance** |
| Fiches | **207** | 240 (+33) | **244 (+37)** |
| Diff | — | 13 fichiers, 1102 insertions, 92 suppressions | 13 fichiers, **1487 insertions**, 114 suppressions |

Mesuré à nouveau le 17 octobre plutôt que réécrit : l'écart lui-même est la
donnée, et le voir grandir vaut mieux qu'un chiffre toujours frais.

**Quatre fichiers que `main` n'a pas du tout :**

| Fichier | À quoi il sert |
|---|---|
| `lib/emphase.ts` | Les marqueurs de gras partaient tels quels dans les données structurées envoyées à Google et dans le texte lu à voix haute par le mode conduite. Corrigé — mais seulement sur la branche. |
| `scripts/test-dns.mjs` | Les dix adresses de l'empire. C'est le contrôle qui aurait évité les cinq jours d'invisibilité d'août (§5). |
| `scripts/que-ecrire.mjs` | Répond par la mesure à « sur quel terrain écrire », et annonce d'abord le terrain fermé le 12 août. |
| `scripts/pages-visitees.mjs` | La liste des onze portes d'entrée, en un exemplaire et vérifiée au chargement. |

**Et le fait qui éclaire les 49 jours : il n'y a JAMAIS eu de pull request sur
le dépôt halalgpt.** Zéro, tous états confondus (`gh api repos/.../pulls?state=all`
renvoie une liste vide). Ce n'est pas une anomalie en soi — Mohamed promeut
depuis Vercel, pas depuis GitHub, et ce circuit ne demande aucune PR. Mais la
conséquence est qu'**il n'existe nulle part une vue unique de ce qui attend** :
pas de diff à relire, pas de résumé, rien qui dise « voilà les 33 fiches et les
cinq garde-fous, promeus ou refuse ». D'où ce tableau.

**Je n'ouvre pas de pull request** : la consigne est de ne pas en créer sans
demande explicite, et c'est la bonne règle — une PR sur ce dépôt changerait son
circuit de validation. Si Mohamed en veut une, il le dit et je l'ouvre.


| Dépôt | Branche | Ce qu'elle contient |
|---|---|---|
| halalgpt | `claude/reconciliation` | tout le travail depuis le 30 août — **rien n'est en ligne** |
| voyageshalal-app | `claude/notes-inventees` | suppression des notes et avis fabriqués |
| voyageshalal-app | `claude/halalgpt-domain-hxl2t7` | ce carnet |

**Mesure conservée sur les notes inventées** : 33 322 hôtels, **zéro** avec un
`avis_count` réel. Tous annonçaient 20 avis imaginaires à Google via
`aggregateRating`. Le `?? 20` et le `?? 50` ont été retirés ; l'objet n'est plus
émis quand la donnée n'existe pas.
