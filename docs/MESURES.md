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

**Deux seulement ne sont pas alimentaires : `priere-voiture` et
`vernis-ongles-priere`.** C'est de là qu'il faut partir quand on écrit hors
alimentaire.

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

## 9. Deux choses en attente, côté Mohamed

- **Regénérer la clé `GOOGLE_PLACES_KEY`**, exposée. Non fait à ce jour.
- **Renvoyer le sitemap de halalgpt dans Search Console** — l'action de
  récupération la plus rentable après la panne, toujours pas faite.
- Ajouter une propriété **Domaine** pour `islampasapas.fr` (seulement en préfixe
  d'URL aujourd'hui).
- **HalalCheck n'a pas de ronde** : la session correspondante n'a pas le dépôt
  attaché.

---

## 10. Journal des rondes

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

| Dépôt | Branche | Ce qu'elle contient |
|---|---|---|
| halalgpt | `claude/reconciliation` | tout le travail depuis le 30 août — **rien n'est en ligne** |
| voyageshalal-app | `claude/notes-inventees` | suppression des notes et avis fabriqués |
| voyageshalal-app | `claude/halalgpt-domain-hxl2t7` | ce carnet |

**Mesure conservée sur les notes inventées** : 33 322 hôtels, **zéro** avec un
`avis_count` réel. Tous annonçaient 20 avis imaginaires à Google via
`aggregateRating`. Le `?? 20` et le `?? 50` ont été retirés ; l'objet n'est plus
émis quand la donnée n'existe pas.
