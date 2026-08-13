# Audit de halalgpt.fr — 13 août 2026

Demandé par Mohamed. Écrit par l'agent HalalGPT sur son propre site, avec la
consigne qu'il applique aux autres : **plus dur avec soi-même qu'avec les
voisins**.

Toutes les mesures ci-dessous ont été prises le 13 août entre 08 h 20 et 09 h 00
UTC, sur la **construction de production** du dépôt `halalgpt` (`next build`
puis `next start`), c'est-à-dire sur le HTML réellement servi — pas sur ce que
le code a l'air de produire.

---

## 0. Ce que je n'ai PAS pu mesurer, et qui manque à cet audit

À dire avant le reste, sinon le reste ment par omission.

| Ce qui manque | Pourquoi | Qui peut le faire |
|---|---|---|
| Le site **en ligne** | La sortie réseau de l'atelier répond 403 au CONNECT vers `halalgpt.fr` (vérifié : `connect_rejected`, politique du relais). J'ai mesuré la même construction, servie localement. | La ronde, qui tourne depuis GitHub et atteint les quatre sites |
| **Positions et impressions Google** | La donnée est chez Google. Search Console n'est pas lisible depuis une session. | Mohamed |
| **Liens entrants** | Aucun outil ici ne peut interroger l'index de Google. Le chiffre « aucun lien entrant » de mon plan de la semaine est **une déduction, pas une mesure** — je le signale comme tel. | Mohamed, ou un outil tiers |

Ce que j'affirme plus bas est donc vrai **du site tel qu'il est fabriqué**. Ce
qu'il devient dans les résultats de Google, je ne l'ai pas vu.

---

## 1. Ce qui est sain — et il faut le dire, sinon les défauts sont illisibles

214 adresses au plan du site, **toutes les 214 mesurées**, aucune en échec.

| Contrôle | Résultat |
|---|---|
| Titres > 60 caractères (coupés par Google) | **0** sur 214 — le plus long fait exactement 60 |
| Descriptions vides | **0** |
| Descriptions > 160 caractères | **1** (179) |
| Titres en double | **0** |
| Descriptions en double | **0** |
| Pages sans `<h1>` | **0** |
| Pages sans canonique | **0** |
| Fiches sans données structurées | **0** sur 202 (`FAQPage` + `BreadcrumbList`) |
| Pages du plan vers lesquelles rien ne pointe | **0** |
| Temps de réponse (local, sans réseau) | médiane **7 ms**, maximum 28 ms |

Un audit de référencement classique s'arrêterait là et rendrait « rien à
signaler ». C'est exactement ce que Mohamed a constaté le 11 août : *« la
qualité des sites est quasi excellente, il faut du trafic. »* Le plafond n'est
pas dans l'hygiène technique. Il est ailleurs, et les quatre défauts qui suivent
disent où.

---

## 2. Défaut n° 1 — La passerelle de l'empire fuit sur 36 codes sur 55

**C'est la trouvaille de cet audit, et de loin la plus grave.**

HalalCheck, quand son moteur reconnaît un additif, envoie le lecteur vers
`halalgpt.fr/e/<CODE>`. C'est la **seule passerelle mesurable de l'empire**
(65 liens, dont 60 balisés `utm_source=halalcheck`), et c'est le compteur qu'on
relira le 25 août.

J'ai pris les **55 codes E que le moteur du scanner sait reconnaître**
(`projects/halal-scanner/lib/halal.ts`) et je les ai tous demandés à la
passerelle, un par un :

| | |
|---|---|
| Codes envoyés par le scanner | **55** |
| Qui arrivent sur une vraie fiche | **19** |
| Qui tombent sur `/categorie/additifs` | **36** |

Et voici ce qui rend le défaut sérieux plutôt qu'ennuyeux : **les 36 codes
orphelins sont, sans exception, ceux que le scanner classe « douteux — origine
animale possible ».**

```
E153  E325  E326  E327  E400  E430  E431  E432  E433  E434  E435  E436
E442  E470a E470b E473  E474  E475  E477  E478  E479b E482  E483  E484
E485  E491  E492  E493  E494  E495  E542  E572  E635  E640  E921  E966
```

Ce sont les esters d'acides gras, les stéarates, les sels d'acides gras, le
phosphate d'os, la L-cystine. Autrement dit : le moment exact où quelqu'un,
debout dans un rayon, lit « E472e » sur un paquet, voit son scanner afficher
**douteux**, appuie pour comprendre — et reçoit une liste de catégorie qui ne
parle pas de son code.

On a construit la question et on n'a pas écrit la réponse. Sur les 36 cas où la
personne en avait le plus besoin.

### Ce que ça dit de plus, et qui vaut pour tout l'empire

Un défaut pareil ne pouvait pas être vu par les contrôles existants : le scanner
teste **son** moteur, mon site teste **ses** fiches, et personne ne testait le
**fil entre les deux**. Les deux moitiés étaient vertes ; le pont était rompu.

---

## 3. Défaut n° 2 — Le site est bâti là où il perd et maigre là où il gagne

La loi établie le 11 août sur trois sites indépendamment : **le précis gagne, le
générique perd.** Sur halalgpt.fr, les requêtes qui remontent sont
« e627 halal », « isla delice halal », « mcdo halal en france ». Celles qui ne
remontent pas sont les larges.

Le catalogue, lui, est construit à l'envers :

| Famille | Fiches | La requête visée |
|---|---|---|
| Produits (marques) | 46 | précise ✅ |
| Vie quotidienne | 29 | variable |
| **Additifs** | **32** | **la plus précise de toutes** |
| **restaurant-halal-\<ville\>** | **10** | générique — tenue par Google Maps |

Et les 10 pages « restaurant halal + ville » sont **parmi les plus maigres du
site entier** : 293 à 308 mots, quand la médiane est à 386.

Ce sont donc les pages les plus faibles qui visent les requêtes les plus
disputées. Elles ne peuvent pas gagner : sur « restaurant halal Lyon », la
première place appartient à une carte, pas à un article de 300 mots.

Pendant ce temps, la famille qui gagne — les codes E — compte **32 fiches**,
alors que le scanner en réclame 55 et que la liste européenne en compte
plusieurs centaines.

Mesure complémentaire : **78 fiches sur 202 sont sous 350 mots.**

---

## 4. Défaut n° 3 — Le lien court existe, marche, et personne ne peut le trouver

`halalgpt.fr/e/E471` fonctionne. C'est court, mémorisable, ça se colle dans un
message ou un forum, et **aucun autre site francophone n'a d'adresse canonique
par numéro E**.

Il n'apparaît nulle part : pas sur les fiches, pas au plan du site, pas dans une
page qui l'explique. Il n'est connu que du scanner, qui le construit tout seul.

On a fabriqué la seule chose de l'empire qui soit vraiment partageable, et on l'a
laissée invisible.

---

## 5. Défaut n° 4 — 7 séries de tests sur 18 ne tournent jamais toutes seules

18 séries existent dans `scripts/`. Le contrôle automatique en lance **11**.
Les 7 autres ne tournent pas :

- **5 réclament `playwright`** — qui n'est même pas déclaré dans le
  `package.json` du dépôt (`test-navigation`, `test-recherche-navigateur`,
  `test-partage`, `test-chevauchement`, `test-conduite`).
- **2 réclament un serveur en marche**, et pas sur le même port : `test-sitemap`
  attend le **3330**, `test-etage1` attend le **3321**. Un contrôle qui n'a
  jamais tourné dans son fichier de contrôle est un contrôle qui n'existe pas.

À décharge : le fichier `controles.yml` **écrit noir sur blanc ce qu'il ne
regarde pas**. C'est honnête, et c'est la règle de la maison. Mais ça reste un
trou, et ce sont précisément les tests du comportement visible — le partage, la
navigation, le mode conduite.

**Et je n'ai pas d'excuse** : HalalCheck, dans le dépôt partagé, installe
Playwright et Chromium et fait tourner ses huit sondes de navigateur à chaque
envoi. Mon voisin fait mieux que moi sur mon propre reproche du 11 août.

### Un mot sur la façon dont j'ai trouvé ça

Au premier passage, 8 séries sur 18 ressortaient « en échec ». J'ai failli
l'écrire. C'était **mon instrument** : pas de serveur, pas de playwright. Et mon
compteur de passerelle a d'abord annoncé **55 codes cassés sur 55** — faux
aussi : la redirection est absolue (`https://halalgpt.fr/...`) et mon test de
préfixe échouait sur les 55. Deux fois en une heure, la mesure brute mentait
dans le sens du spectaculaire. C'est la règle `soupconner-l-instrument`, et elle
a servi deux fois avant que cet audit n'existe.

---

## 6. Défaut n° 5 — petit, mais il tombe au mauvais endroit

**12 pages sur 214 n'ont aucune donnée structurée** : l'accueil, `/questions`,
`/conduite` et les 9 pages de catégorie — pendant que les 202 fiches en ont
deux chacune.

Ce serait anecdotique si `/categorie/additifs` n'était pas exactement l'endroit
où atterrissent les **36 codes orphelins** du défaut n° 1.

---

## Les leviers — classés par effet réel, pas par facilité d'écriture

### 🥇 Levier 1 — Colmater la passerelle aujourd'hui, avant d'écrire une ligne

*Une heure de travail. Effet immédiat sur le seul chiffre qu'on relira le 25.*

Quand `/e/<CODE>` ne trouve pas de fiche, il n'envoie plus vers la catégorie :
il rend une **page de code honnête** qui dit les trois choses qu'on sait
vraiment — le nom de l'additif, le fait qu'on n'a pas encore écrit sa fiche, et
ce que le moteur du scanner en dit, **attribué à lui** (« origine animale
possible ») plutôt que servi comme un verdict de notre part.

Ce n'est pas une page de remplissage : c'est la différence entre « on ne sait
pas » et « on ne vous répond pas ». La règle `ne-jamais-inventer` est tenue —
on n'écrit aucun avis qu'on n'a pas, on cite celui qui existe.

### 🥇 Levier 2 — Les 36 fiches, et un test qui empêche le trou de se rouvrir

*Le fond. 36 fiches ≈ 9 à 18 nuits de la vague automatique.*

Le plan de contenu n'est plus à deviner : **la passerelle l'écrit elle-même.**
Ce sont les 36 codes ci-dessus, dans cet ordre, parce que chacun est une requête
précise, à faible concurrence, avec une intention maximale — quelqu'un qui a le
paquet dans la main.

Et surtout, la partie qui vaut mieux que les 36 fiches : **un test qui échoue
quand le scanner connaît un code que je ne couvre pas.** Il tient dans vingt
lignes, il lit les deux dépôts, et il transforme une décision éditoriale — qui
se perd en trois nuits — en une mécanique qui ne se perd pas. Le jour où
HalalCheck ajoute un code à son moteur, mon contrôle passe au rouge le soir même.

C'est la vraie livraison. Les 36 fiches sont le rattrapage ; le test est ce qui
fait qu'il n'y en aura pas un 37ᵉ.

### 🥈 Levier 3 — Rendre le lien court visible, et en faire l'objet à partager

*Le seul mécanisme de liens entrants qui ne demande de faveur à personne.*

Sur chaque fiche : **« Lien court à partager : halalgpt.fr/e/E471 »**, avec un
bouton copier. 202 fiches deviennent 202 invitations à partager.

Pourquoi c'est le bon objet et pas un gadget : la question « E471 c'est halal ? »
se pose dans des groupes WhatsApp et des forums, jamais dans un article. Une
adresse de 22 caractères se colle dans une conversation ; une URL de fiche ne
s'y colle pas. On ne demande de lien à personne — on rend le partage possible.

Je ne promets pas de résultat mesurable avant le 25 août : les liens mettent des
semaines. Je le dis parce que promettre le contraire serait exactement ce que
cet audit reproche aux autres.

### 🥉 Levier 4 — Arrêter de fabriquer des pages qui ne peuvent pas gagner

*Zéro travail d'écriture. Une règle.*

La vague automatique ajoute 2 à 5 fiches par nuit sans règle sur **quelle**
fiche. Résultat mesuré : 10 pages « restaurant halal + ville », les plus maigres
du site, sur les requêtes les plus disputées.

La règle, tenue par un test comme celle de la nourriture l'est déjà : **une
nouvelle fiche doit viser une requête où le site peut plausiblement être
premier** — un code, une marque, un produit nommé. Pas une catégorie, pas une
ville.

Et les 10 pages « ville » existantes : ne pas les supprimer, les **rediriger vers
le voisin dont c'est le métier**. `restaurant-halal-lyon` a sa place sur
voyageshalal.fr, pas chez moi. Ce serait la première passerelle dans ce sens-là.

### Levier 5 — Le trou de mesure, et il n'est pas chez moi

*Cinq minutes de Mohamed. Le meilleur rapport information/effort de la liste.*

Le 25 août, on rouvre les compteurs de l'empire. **halalcheck.fr n'a pas de
Search Console** — la balise attend Mohamed depuis le 11 août. Un des cinq sites
rendra donc zéro donnée, et on ne saura pas si c'est parce qu'il ne marche pas
ou parce qu'on ne le regarde pas.

Aucun levier de cette liste ne vaut une mesure qu'on n'a pas.

### Levier 6 — La donnée ouverte, pour septembre et pas pour le 25

*Le seul levier à plafond haut. Le plus lent.*

`/api/ecodes` existe, rend une donnée propre et structurée — et il est
**interdit aux robots** par `robots.txt` (`Disallow: /api/`). Personne ne peut
le trouver.

Il n'existe pas, à ma connaissance, de base francophone libre et citable du
statut halal des additifs alimentaires. En publier une — page dédiée, licence
claire, bloc « comment citer » — est le mécanisme qui fait qu'un site inconnu
reçoit des liens de forums, de projets étudiants, d'autres applications, sans
avoir rien demandé à personne.

Je ne promets pas de résultat : je n'ai aucun moyen de mesurer un lien entrant
depuis l'atelier. Je propose un mécanisme dont je peux mesurer la première
moitié — la page existe, elle est lisible par un robot, elle est citable — et
dont la seconde moitié appartient au monde.

---

## Ce que je fais, moi, et dans quel ordre

1. **Aujourd'hui** — levier 1 (la page de code honnête) et le test du levier 2.
   C'est-à-dire : je colmate, puis je pose le filet, avant d'écrire la moindre
   fiche.
2. **Cette semaine** — la vague automatique consomme la file des 36 codes au lieu
   de piocher au hasard. Levier 4 en même temps : la règle de la fiche précise.
3. **Puis** — le lien court sur les fiches, les 12 pages-carrefour, et
   `playwright` déclaré pour que les 7 séries orphelines tournent.
4. **Septembre** — la donnée ouverte.

Ce que je ne fais pas : réécrire les 78 fiches maigres. Allonger un texte n'est
pas un levier, c'est du volume. Les 36 fiches manquantes valent mieux que
78 fiches rallongées, parce qu'elles répondent à une demande dont j'ai la preuve.

---

## Ce que je demande aux trois autres agents

Le même exercice, sur leur propre site, avec la même règle : **une mesure ou
l'aveu qu'on ne sait pas.** Le détail est parti dans leurs boîtes le 13 août.

Deux choses que cet audit m'a apprises et qui valent pour eux :

- **Le défaut n'était pas chez moi ni chez le voisin, il était sur le fil entre
  nous deux.** Chacun testait sa moitié. Cherchez ce que vous partagez avec
  quelqu'un d'autre et que personne ne teste.
- **Deux fois en une heure, ma mesure brute a menti dans le sens du
  spectaculaire** (« 8 tests en échec », « 55 passerelles cassées sur 55 »). Un
  chiffre spectaculaire se recoupe avant d'être écrit — surtout quand il va
  envoyer quelqu'un travailler.

— Agent HalalGPT, 13 août 2026
