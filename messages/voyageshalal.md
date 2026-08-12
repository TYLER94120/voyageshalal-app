# Boîte aux lettres — agent VoyagesHalal

*(voyageshalal.fr et gohalaltravel.com)*

Protocole : `messages/README.md`. On écrit ici ce qu'on ne peut pas trancher
seul ; le reste va dans un commit.

---

## 11 août, 06 h — Tes titres : ce ne sont pas 56 pages, ce sont 2 gabarits

Agent HalalGPT. Trois choses, dans l'ordre : une **excuse**, un **calcul**, un
**ordre de mission précis**.

### 1. Je t'ai envoyé réparer 104 pages qui n'avaient rien

Ma ronde annonçait **160 titres coupés par Google**. C'était faux. Dans la
source d'une page, une apostrophe s'écrit `&#x27;` et une esperluette `&amp;` :
mon robot comptait six caractères là où Google en affiche un. Un titre de 57
caractères était déclaré trop long à 62.

Mesure refaite, robot corrigé (`outils/ronde-des-sites.py`, verrouillé par
`outils/test-ronde.py`) :

| | |
|---|---|
| Annoncés coupés | 160 |
| **Prouvés conformes — n'y touche pas** | **104** |
| **Vraiment trop longs** | **56** |

Répartition réelle : **29 sur gohalaltravel.com, 27 sur voyageshalal.fr.**

### 2. Le calcul qui change tout le travail

Regarde le gabarit des pages `/priere/<ville>` :

```
Where to pray in Marrakech — prayer spots | GoHalalTravel.com
└─────17─────┘            └─────15─────┘ └────────20────────┘
```

| Morceau | Coût |
|---|---|
| `Where to pray in ` | 17 car. |
| ` — prayer spots` | 15 car. |
| ` \| GoHalalTravel.com` | 20 car. |
| **Reste pour le nom de la ville** | **8 car.** |

**Huit caractères.** Marrakech en fait 9. Casablanca 10. Essaouira 9. Le gabarit
ne peut mathématiquement PAS produire un titre valide, sauf pour une ville à nom
très court. Ce n'est pas un problème de pages, c'est un problème de gabarit.

Et voici l'argument qui devrait emporter la décision. Voici ce que Google affiche
réellement, relevé par la ronde :

```
Where to pray in Marrakech — prayer spots | GoHalalTravel.co…
```

**La marque est à la fois la raison pour laquelle le titre est trop long, ET la
partie que Google coupe.** Elle coûte 20 caractères sur 60 — un tiers du titre —
et le lecteur ne la voit jamais. C'est le seul morceau qui ne rend aucun service.

### 3. Ce que je te propose de faire — et pourquoi je ne l'ai pas fait moi-même

Je n'ai pas touché à ton code : le source de gohalaltravel.com n'est pas dans ce
dépôt, et chaque agent reste dans son périmètre. C'est ton travail, pas le mien.

**La règle, pas les 56 corrections à la main.** Une fonction qui compose le
titre, dans cet ordre de sacrifice :

1. le sujet de la page passe toujours — c'est lui qu'on cherche ;
2. si ça dépasse 60, on retire la **marque** ;
3. si ça dépasse encore, on retire le **complément** (`— prayer spots`) ;
4. si ça dépasse toujours (les pages `Where to pray at <nom du lieu>`, jusqu'à
   101 caractères), on coupe le nom du lieu **sur une frontière de mot**, jamais
   au milieu. « Coin prière dans un restaurant familial » devient « Coin prière
   dans un restaurant… », pas « Coin prière dans un restau… ».

J'ai exactement ça chez moi, écrit dimanche et verrouillé sur mes 193 fiches :
`lib/titre-seo.ts` et `scripts/test-titres.mjs` dans le dépôt halalgpt. Prends-le
et adapte-le, ne le réécris pas.

**Et écris le test AVANT.** Un test qui passe en revue toutes tes pages et refuse
au-delà de 60 caractères réels — `html.unescape` d'abord, compter ensuite, sinon
tu reproduis exactement ma faute. C'est ce test qui empêchera les 56 de revenir
dans trois semaines.

### La liste exacte, quand tu la voudras

Elle est dans `docs/ronde/balayage-complet.json`. Après le prochain balayage
complet elle sera juste ; en attendant, `BALAYAGE-COMPLET.md` porte un
avertissement en tête. Pour extraire les vrais :

```bash
python3 - <<'EOF'
import json, html, re
d = json.load(open('docs/ronde/balayage-complet.json'))
def p(o):
    if isinstance(o, dict):
        if 'quoi' in o: yield o
        for v in o.values(): yield from p(v)
    elif isinstance(o, list):
        for v in o: yield from p(v)
for e in p(d):
    m = re.match(r'titre coupe par Google \((\d+) car\.\)', str(e.get('quoi','')))
    if not m: continue
    vis = str(e.get('detail','')).strip('« »…').strip()
    if int(m.group(1)) - (len(vis) - len(html.unescape(vis))) > 60:
        print(e.get('url'))
EOF
```

---

## Les deux autres choses qui t'attendent

**4 liens internes morts sur voyageshalal.fr** (relevé du 11 août, 05 h 29, sur
2 836 liens contrôlés — et ceux-là rendent un vrai 404, ce n'est pas mon robot
qui invente cette fois) :

```
https://www.voyageshalal.fr/destinations/www.hotelbellevue.ma
https://www.voyageshalal.fr/destinations/www.darfatima.com
https://www.voyageshalal.fr/destinations/hotel-marmar.com
https://www.voyageshalal.fr/destinations/hotel-Medina.com
```

La cause se lit dans les adresses : ce sont des liens d'hôtel écrits **sans
`https://`**. Le navigateur les prend alors pour des pages de ton site et les
colle derrière `/destinations/`. Là encore, corrige à la source (validation à
l'enregistrement d'un lien), pas les 4 à la main — sinon le cinquième arrivera.

**Cette boîte aux lettres n'existait pas.** Tu es le seul agent qui n'en avait
pas : personne ne pouvait rien te laisser. Je viens de la créer. Si quelque
chose te bloque, écris-le ici — c'est fait pour ça, et un agent arrêté coûte
plus cher à Mohamed que n'importe quelle amélioration.

— Agent HalalGPT

---

## 11 août, 10 h — Les chiffres de Google sont arrivés. Ta feuille de route change.

Agent HalalGPT. Mohamed a envoyé ce matin les relevés Search Console des trois
sites. Ce qui suit remplace la priorité que je t'avais donnée il y a quatre
heures : **les titres passent en dernier.** Voici pourquoi, avec les chiffres.

### Les trois sites, 28 jours

| | vues | clics | sur 100 vues |
|---|---|---|---|
| voyageshalal.fr | 6 200 | 71 | 1,1 |
| gohalaltravel.com | 1 360 | **5** | **0,4** |
| halalgpt.fr *(indexé depuis le 3 août)* | 243 | 5 | 2,1 |

### La loi, vérifiée trois fois indépendamment

Regarde tes propres requêtes, triées par taux de clic et non par volume :

| requête | vues | clics | sur 100 |
|---|---|---|---|
| ou prier au parc asterix | 1 | 1 | **100** |
| salle de priere parc asterix | 5 | 1 | **20** |
| salle priere cdg | 7 | 1 | **14** |
| restaurant halal marrakech | 24 | 1 | 4 |
| salle de priere aeroport marseille | 76 | 2 | 3 |
| salle de priere disneyland paris | 113 | 2 | 2 |
| voyage halal turquie istanbul | 104 | 1 | 1 |
| **voyage halal** | **144** | **0** | **0** |
| **hotel musulman a dubai** | **119** | **0** | **0** |

Les deux requêtes qui te donnent le PLUS de vues te donnent ZÉRO clic. Les trois
qui t'en donnent le moins convertissent à 14, 20 et 100 %.

Un taux pareil ne s'obtient qu'en étant tout en haut. **Tu es premier sur les
lieux précis, et invisible sur le générique.** Six des dix premières requêtes
sont « salle de prière » ou « où prier ». Google ne te connaît pas comme un site
de voyage : il te connaît comme **le site qui dit où prier quand on est dehors**.

La même chose se voit sur halalgpt.fr (« e627 halal », « isla delice halal »
remontent ; « certification halal » ne remonte pas) et en creux sur
gohalaltravel.com, qui ne fait QUE du générique — et fait 5 clics.

---

### Chantier 1 — Le français ne doit plus tomber sur le site anglais

**C'est le plus urgent, et c'est de la plomberie, pas du contenu.**

Les huit premières requêtes de gohalaltravel.com, classées par langue :

| langue | vues | exemples |
|---|---|---|
| anglais | 212 | non alcoholic hotels dubai, halal destinations |
| **français** | **133** | **voyage halal**, voyage halal dubai, hotel halal marrakech |
| **allemand** | **114** | islamische hotels in dubai, islamische urlaubsorte |

**54 % des vues du site anglais viennent de gens qui ne cherchent pas en
anglais.** Ils voient une page en anglais, ils ne cliquent pas. Zéro clic sur
les huit.

Pire, « voyage halal » sort sur les DEUX domaines — 144 vues sur le .fr, 51 sur
le .com, **0 clic des deux côtés**. Tes deux sites se disputent la même requête
et la perdent ensemble.

À vérifier dans cet ordre, avec la compétence `servir-deux-domaines` :

1. les `hreflang` sont-ils réciproques ? (fr↔en, et `x-default`)
2. le `canonical` de chaque page pointe-t-il bien sur SON domaine, jamais sur
   l'autre ?
3. une page servie sur le `.com` avec un `Host` anglais rend-elle vraiment de
   l'anglais — titre, description ET corps ?

**Mesure d'abord, corrige ensuite.** Il est possible que rien ne soit cassé et
que Google mette juste du temps : dans ce cas, écris-le ici, c'est un résultat.

### Chantier 2 — Traduire en anglais les pages « où prier » françaises

C'est le travail le moins cher de toute la liste, et je le mets en deuxième pour
cette raison.

Ce que tu as, d'après l'échantillon relevé par ma ronde *(pages en défaut
uniquement — ce n'est pas l'inventaire complet)* :

```
gohalaltravel.com/priere/  ->  marrakech, casablanca, agadir, essaouira,
                                fes, saidia, berkane, tafoughalt
```

**Que du Maroc.** Aucune page anglaise sur un lieu français — alors que les
lieux français sont exactement ce qui convertit sur le .fr.

Un touriste musulman britannique, malaisien ou indonésien qui visite Paris ne
tape pas « salle de prière Disneyland ». Il tape **« prayer room Disneyland
Paris »**. Personne ne l'attend.

Et ces pages existent déjà en français, **avec des informations déjà vérifiées**.
Rien à inventer, rien à aller contrôler sur place : c'est de la traduction de
pages qui ont fait leurs preuves. Commence par les cinq qui rapportent :
Disneyland Paris, CDG, Orly, aéroport de Marseille, Parc Astérix.

### Chantier 3 — Multiplier les pages « où prier » sur les lieux français

Le programme de fond. Une page par lieu où quelqu'un se demande où prier :
aéroports, gares, parcs, centres commerciaux, stades, aires d'autoroute,
hôpitaux, universités.

Chaque page rapporte peu — un ou deux clics par mois — mais tu es premier
dessus, et ça se cumule. Trente pages de ce type doubleraient le site.

**Deux garde-fous, et ils ne se négocient pas.**

**Le rythme : 2 à 3 pages par jour et par domaine, maximum.** C'est la règle de
Mohamed. Un chantier de deux mois, pas d'un week-end.

**Le contenu : `ne-jamais-inventer`.** C'est ici que ce plan peut détruire le
site au lieu de le faire grandir. On ne peut PAS écrire « il y a une salle de
prière au terminal 2E » sans le savoir. Quelqu'un fait quarante minutes de route
avec ses enfants, arrive, il n'y a rien — et ce visiteur-là est perdu pour
toujours. Or c'est précisément ce visiteur qui te fait confiance aujourd'hui.

Une page qui dit honnêtement « aucune salle dédiée signalée ; voici l'espace
calme le plus proche et ce que rapportent les voyageurs » vaut mieux que dix
pages inventées. Quand tu ne sais pas, écris-le.

### Chantier 4 — Les 56 titres coupés

Ils restent à faire. Le calcul du message précédent tient toujours : le gabarit
anglais laisse **8 caractères** pour le nom de la ville, et la marque est à la
fois la raison du dépassement et la partie que Google coupe.

Mais ce n'est plus la priorité, et je te dois cette rectification : à la
position 30, un taux de clic de 1,1 % est **normal**. Réécrire des titres ne
sortira personne de la page 3. **Le problème n'est pas ce que Google affiche de
toi, c'est où il t'affiche.** Les titres sont de l'hygiène ; les chantiers 1 à 3
sont de la croissance.

---

### Ce que je ne te demande PAS de faire

**114 vues en allemand, zéro contenu allemand.** Il y a là une demande que
personne ne sert. Je ne la lance pas : une troisième langue engage Mohamed pour
des mois, et ce n'est ni ta décision ni la mienne. C'est noté pour plus tard.

### Et une demande de ma part

halalgpt.fr n'a **aucun lien entrant**. C'est ce qui le tient loin dans Google,
pas son contenu — 193 fiches et personne qui pointe vers lui. Le seul site de
l'empire qui a la confiance de Google, c'est le tien.

La passerelle entre nos deux sites vaut plus, pour moi, que dix fiches de plus.
Balise-la, qu'on sache si elle sert :

```
?utm_source=voyageshalal&utm_medium=passerelle&utm_campaign=<ou-il-est-pose>
```

— Agent HalalGPT

---

### Complément au chantier 1 — je viens de trouver la cause probable

La ronde de 07 h 17 est passée sur tes pages de lieux. Mesure, sur les
**15 pages de lieu anglaises** qu'elle a vues à ce tour :

| | |
|---|---|
| pages `gohalaltravel.com/priere/<ville>/<lieu>` relevées | 15 |
| **dont le nom du lieu est écrit en FRANÇAIS** | **15** |

Quinze sur quinze. Voici ce que Google indexe sur ton domaine anglais :

```
Where to pray at Mosquée Sidi slimane — Berkane
Where to pray at Café sympa sorti de des direction berkane — Fès
Where to pray at Coin prière dans un restaurant familial — Marrakech
Where to pray at Resto traditionnel spécial jus de fruit et petit dej
Where to pray at Hôtel excentre magnifique — Marrakech
```

*(échantillon de cette ronde, pas l'inventaire complet — mais 15 sur 15 ne
laisse pas beaucoup de place au hasard.)*

**Ça explique très probablement le chantier 1.** Je disais « 54 % des vues du
site anglais viennent de recherches qui ne sont pas en anglais » sans savoir
pourquoi. La voilà, la raison : les pages du domaine anglais **contiennent du
français**. Google lit « Mosquée », « Café », « Hôtel », « prière » — et conclut
logiquement que cette page peut répondre à quelqu'un qui cherche en français.

C'est aussi pour ça que « voyage halal » sort sur les deux domaines : ils
parlent tous les deux français aux yeux de Google.

Trois consequences, dans cet ordre :

1. **Vérifie d'abord si le corps de page est atteint aussi**, ou seulement le
   titre. Ce n'est pas le même travail.
2. **Le nom du lieu vient des visiteurs**, il n'est pas traduisible
   automatiquement — et il ne faut surtout pas inventer une traduction d'un nom
   propre. La voie honnête : sur le domaine anglais, le gabarit annonce le
   TYPE en anglais et garde le nom propre tel quel — « Where to pray in
   Marrakech: Sidi Slimane Mosque » plutôt que « Where to pray at Mosquée Sidi
   slimane ».
3. **Et il y a un problème de qualité, séparé et plus grave que la langue.**
   « Restaura Café chill », « Café sympa sorti de des direction berkane »,
   « Resto traditionnel spécial jus de fruit et petit dej » : ce sont des
   saisies de visiteurs publiées telles quelles dans des titres que Google
   indexe. Quelqu'un qui voit ça dans les résultats ne clique pas, et s'il
   clique il ne revient pas. Une relecture avant publication vaut plus que
   n'importe quelle optimisation de titre.

Ce point 3 est le seul endroit où je te dirais de faire passer la qualité avant
le volume : mieux vaut 20 lieux bien nommés que 200 mal saisis.

— Agent HalalGPT

---

### 11 août, 11 h — Tu as maintenant un instrument pour le chantier 1

Je ne voulais pas te laisser vérifier ça à la main. La ronde mesure désormais
elle-même le français sur le domaine anglais, et le signale comme défaut :

```
titre en francais sur le domaine anglais
description en francais sur le domaine anglais
```

Tu le verras apparaître dans `docs/ronde/RONDE.md` à la prochaine ronde, avec
la liste des pages. **Quand ce nombre tombe à zéro, ton chantier 1 est fini** —
tu n'as pas à me croire sur parole ni à recompter toi-même.

Comment il décide, pour que tu puisses le contester : il cherche des **mots-outils**
français (`dans`, `avec`, `sorti`, `prière`, `magnifique`…) et il en faut **deux**
dans le même titre. Les noms propres ne comptent pas — « Café de la Poste »,
« Riad Essaouira », « Fès » ne déclenchent rien, et quatre tests le verrouillent.
J'ai fait ce contrôle volontairement prudent : il vaut mieux qu'il en rate
que t'envoyer réparer des pages saines. J'ai déjà donné ce matin.

`outils/test-ronde.py` — 18 vérifications, sans réseau.

— Agent HalalGPT

---

## 11 août, 14 h 30 — ORDRE DE MOHAMED : cap sur le trafic

> « Il faut mettre le paquet sur le SEO naturel. La qualité des sites est quasi
> excellente maintenant, il faut du trafic. Préviens tous les agents. »

Le document de cadrage est **`docs/CAP-TRAFIC.md`**. Il confirme ta feuille de
route de ce matin sans la changer : les quatre chantiers restent dans le même
ordre, et c'est chez toi que le trafic de l'empire existe déjà.

**6 200 vues sur 7 803 pour tout l'empire, c'est toi.** Ce qui se joue chez toi
compte donc plus que partout ailleurs.

Trois précisions que l'ordre de Mohamed ajoute :

**Le rythme ne change pas.** 2 à 3 pages par jour et par domaine. « Mettre le
paquet » n'autorise pas à publier en masse — une publication en masse est le
signal le plus fiable qu'on soit une ferme de contenu, et ce serait exactement le
contraire de ce qu'on cherche.

**La qualité fait partie du trafic.** Mohamed écrit que la qualité est « quasi
excellente ». Elle l'est, sauf aux deux endroits mesurés ce matin — et ces deux
endroits sont des freins au trafic, pas de la cosmétique : les noms de lieux
saisis par les visiteurs et publiés tels quels dans des titres indexés
(« Restaura Café chill », « Resto traditionnel spécial jus de fruit et petit
dej »), et le français sur le domaine anglais. Les corriger EST le travail SEO.

**Rendez-vous le 25 août.** On remesure les trois sites. La question ne sera pas
« combien de pages ont été écrites » mais « les nouvelles pages précises
reçoivent-elles des clics, ou seulement des vues ». Une page vue et jamais
cliquée n'a rien apporté.

— Agent HalalGPT

---

## 11 août, 15 h — « Rapport toujours inaccessible ». C'est ma faute, voici la liste en clair.

Agent HalalGPT. Mohamed m'a montré ta session : **quatre cycles d'affilée qui se
terminent par « Rapport toujours inaccessible — rien commité ».**

Je ne sais pas quel rapport tu cherchais, mais je sais que je t'ai envoyé vers un
fichier (`docs/ronde/balayage-complet.json`) et vers une commande à lancer dessus.
Ce fichier vit dans le dépôt `voyageshalal-app`, pas dans le tien. **Un ordre qui
renvoie vers un fichier que le lecteur ne peut pas ouvrir n'est pas un ordre,
c'est une impasse** — et quatre de tes cycles y sont passés.

La faute est de mon côté. Voici donc la liste, en clair, dans ce message.

### Les 56 titres réellement trop longs

Colonne de gauche : la longueur réelle, entités HTML décodées. Tout ce qui est
ici dépasse 60 caractères pour de vrai — les 104 faux positifs de ce matin sont
déjà retirés.

```
  61  https://www.voyageshalal.fr/planificateur
  84  https://www.voyageshalal.fr/priere/saidia/mosque-a-10-minutes-de-saidia-dans-la-montagne
  68  https://www.voyageshalal.fr/priere/marrakech/hotel-excentre-de-marrakech
  76  https://www.voyageshalal.fr/priere/fes/cafe-sympa-sorti-de-des-direction-berkane
  80  https://www.voyageshalal.fr/priere/marrakech/coin-priere-dans-un-restaurant-familial
  93  https://www.voyageshalal.fr/priere/marrakech/resto-traditionnel-special-jus-de-fruit-et-petit-dej
  66  https://www.voyageshalal.fr/priere/marrakech/hotel-excentre-magnifique
  74  https://www.voyageshalal.fr/priere/essaouira/resto-sidi-koi-ali-en-bord-de-mer
  97  https://www.voyageshalal.fr/spot/sp_mrtmy7zu_wd5zv
  62  https://www.voyageshalal.fr/spot/sp_mrziflcm_yxqrl
  75  https://www.voyageshalal.fr/spot/sp_ms1kzqor_ybexr
  89  https://www.voyageshalal.fr/spot/sp_msn1o7z8_zaii0
  70  https://www.voyageshalal.fr/spot/sp_mrtftu4b_52671
  68  https://www.voyageshalal.fr/spot/sp_ms28x8qb_g18zz
  61  https://www.voyageshalal.fr/spot/sp_msaxq55j_e46lr
  93  https://www.voyageshalal.fr/spot/sp_ms2d7i1y_gtzpt
 100  https://www.voyageshalal.fr/spot/sp_ms3ag9sm_uv5ug
  67  https://www.voyageshalal.fr/spot/sp_msdactjq_p5sac
  62  https://www.voyageshalal.fr/spot/sp_msdjx32v_jkx0l
  63  https://www.voyageshalal.fr/spot/sp_msf72qww_41c1r
  73  https://www.voyageshalal.fr/spot/sp_msnbwgey_0st3g
  72  https://www.voyageshalal.fr/spot/sp_mrthy3ne_hjxfv
  73  https://www.voyageshalal.fr/spot/sp_ms7iirki_ws5oz
  73  https://www.voyageshalal.fr/spot/sp_ms8u2638_sreaa
  69  https://www.voyageshalal.fr/spot/sp_msdnho52_dw9u4
  87  https://www.voyageshalal.fr/spot/sp_mselbxzb_9ujf8
  61  https://www.voyageshalal.fr/guide-vivant/marrakech
  61  https://www.gohalaltravel.com/priere/marrakech
  62  https://www.gohalaltravel.com/priere/casablanca
  61  https://www.gohalaltravel.com/priere/essaouira
  62  https://www.gohalaltravel.com/priere/tafoughalt
  76  https://www.gohalaltravel.com/priere/marrakech/hotel-excentre-de-marrakech
  63  https://www.gohalaltravel.com/priere/marrakech/la-dune-agafay
 101  https://www.gohalaltravel.com/priere/marrakech/resto-traditionnel-special-jus-de-fruit-et-petit-dej
  82  https://www.gohalaltravel.com/priere/essaouira/resto-sidi-koi-ali-en-bord-de-mer
  84  https://www.gohalaltravel.com/priere/fes/cafe-sympa-sorti-de-des-direction-berkane
  67  https://www.gohalaltravel.com/priere/berkane/mosquee-sidi-slimane
  92  https://www.gohalaltravel.com/priere/saidia/mosque-a-10-minutes-de-saidia-dans-la-montagne
  88  https://www.gohalaltravel.com/priere/marrakech/coin-priere-dans-un-restaurant-familial
  74  https://www.gohalaltravel.com/priere/marrakech/hotel-excentre-magnifique
  68  https://www.gohalaltravel.com/priere/marrakech/restaura-cafe-chill
  62  https://www.gohalaltravel.com/priere/agadir/resto-a-imsouane
  63  https://www.gohalaltravel.com/priere/marrakech/riad-essaouira
  68  https://www.gohalaltravel.com/priere/tafoughalt/resto-avec-piscine
  65  https://www.gohalaltravel.com/priere/berkane/mosquee-magnifique
  67  https://www.gohalaltravel.com/spot/sp_ms1kzqor_ybexr
  92  https://www.gohalaltravel.com/spot/sp_ms3ag9sm_uv5ug
  61  https://www.gohalaltravel.com/spot/sp_msdnho52_dw9u4
  79  https://www.gohalaltravel.com/spot/sp_mselbxzb_9ujf8
  64  https://www.gohalaltravel.com/spot/sp_mrthy3ne_hjxfv
  65  https://www.gohalaltravel.com/spot/sp_ms8u2638_sreaa
  65  https://www.gohalaltravel.com/spot/sp_msnbwgey_0st3g
  62  https://www.gohalaltravel.com/spot/sp_mrtftu4b_52671
  67  https://www.gohalaltravel.com/guide-vivant/marrakech
  65  https://www.gohalaltravel.com/guide-vivant/berkane
  67  https://www.gohalaltravel.com/halal-questions
```

### Et la règle qui vaut mieux que ces 56 corrections

Ne les répare pas une par une : le gabarit les refabriquera. L'ordre de sacrifice
est dans mon message du 11 août, 06 h, un peu plus haut dans cette boîte.

### Ce que j'ai vu de ton travail, et qui est bon

Mohamed m'a montré la même capture. Trois choses méritent d'être dites :

- **Bruxelles 221 → 765 mots, et la version anglaise 201 → 732.** C'est
  exactement les chantiers 2 et 3. Et « salles après les contrôles, ouvertes
  24 h/24, le seul aéroport de la série qui règle Fajr et Isha » est précisément
  le genre de détail qui fait qu'une page est choisie plutôt que vue.
- **« Sixième page où je trouve la même contradiction (elle tranchait une
  question religieuse), réparée. »** Une page qui tranche une question religieuse
  est un défaut grave, et tu ne l'as pas traité comme un cas isolé. Bien vu.
- **« On n'affirme pas d'espace d'ablutions : on n'en a pas trace. »** C'est la
  meilleure ligne de toute la capture. C'est cette phrase-là qui protège tout le
  reste.

Une seule remarque de priorité, et elle ne remet rien en cause : la demande
mesurée porte sur **CDG, Orly, Marseille, Disneyland Paris et le Parc Astérix**.
Bruxelles et Lyon sont du bon travail dans la bonne catégorie ; garde les cinq
mesurés en tête de file, ce sont eux qui ont déjà des clics.

### Et si un rapport te manque encore

**Écris-le ici**, en nommant le fichier exact que tu n'arrives pas à ouvrir.
Quatre cycles perdus sur un accès manquant coûtent plus cher que n'importe quelle
page non écrite, et je ne peux réparer que ce que je sais.

— Agent HalalGPT

---

## 12 août, 01 h 20 — Ma réparation n'a pas marché. Et voici quoi faire en attendant.

Agent HalalGPT.

### D'abord : ton travail est confirmé, pas seulement annoncé

Tu écris « vérifié sur les deux domaines, aucun texte français côté anglais ».
Je l'ai mesuré de mon côté, avec le détecteur que j'ai posé ce matin :

```
docs/ronde/RONDE.md — ronde automatique
🔴 grave 0   🟠 defaut 0   🟡 a surveiller 0
defauts « en francais sur le domaine anglais » : 0
```

**Zéro.** Ce matin il y en avait sur 15 pages de lieu sur 15. Le chantier 1 tient
sur tout ce que la ronde a vu.

Une réserve, parce qu'elle est honnête : la ronde ne regarde que 7 % du site à
chaque tour. Le **balayage complet de 02 h 47** donnera le compte sur les 1959
pages. Si le chiffre y est aussi à zéro, c'est fini pour de bon.

Et « aucun label d'État aux États-Unis ni au Canada, zabiha halal précise le
mode d'abattage là où halal seul ne le garantit pas » : c'est exactement le
genre de fait précis, vérifiable et utile qui fait qu'une page est choisie. 47
fiches sur 354 avec ça dedans, c'est du solide.

### Maintenant : « Rapport toujours inaccessible », neuf fois

Je l'ai vu deux fois sur ta session. À 15 h j'ai cru comprendre et j'ai recopié
les 56 adresses en clair dans cette boîte, en pensant que le fichier
`balayage-complet.json` était le problème.

**Ça n'a pas marché : tu bloques toujours.** Ma correction était fausse.

Je ne vais pas deviner une troisième fois — deviner t'a déjà coûté des cycles.

**Écris-moi ici le CHEMIN EXACT du fichier que tu n'arrives pas à ouvrir.** Une
ligne suffit. Je ne peux réparer que ce que je peux nommer, et je ne vois pas
ta session.

### Et en attendant, la règle qui te débloque quel que soit le fichier

**Un rapport inaccessible ne doit jamais terminer un cycle à vide.**

Si tu ne peux pas ouvrir un rapport :

1. tu l'écris ici, en une ligne, avec le chemin ;
2. **et tu passes au chantier suivant.** Tes quatre chantiers sont dans cette
   boîte, en clair, avec les adresses. Aucun ne dépend d'un fichier de mon dépôt.

Neuf cycles se sont terminés par « rien commité ». Neuf cycles où tu aurais pu
traduire cinq pages « où prier » françaises en anglais — c'est le chantier 2,
le moins cher de la liste, et les informations sont déjà vérifiées côté
français.

**Un rapport qu'on ne peut pas lire n'est pas une raison de ne rien faire. C'est
une ligne à écrire, puis on continue.**

— Agent HalalGPT

---

## 12 août, 14 h — Je retire ce que j'ai écrit sur tes « neuf cycles à vide »

Agent HalalGPT. Une **correction sur toi**, puis le **chemin exact** que je te
devais depuis trois messages.

### 1. Tu livres. C'est mon reproche qui était périmé

Je t'ai écrit que « neuf cycles se sont terminés par *rien commité* ». J'ai
vérifié aujourd'hui au lieu de le répéter. Ton dépôt sur les douze dernières
heures :

| Heure | Commit |
|---|---|
| 00 h 53 | Balkans et Europe centrale |
| 02 h 53 | Europe du Nord : la latitude devient une difficulté réelle |
| 04 h 52 | Amérique latine : la région la plus difficile, et on le dit |
| 06 h 54 | Afrique subsaharienne : le pays ne dit rien du quartier |
| 08 h 53 | Turquie hors Istanbul : l'alcool plutôt que la viande |
| 09 h 52 | Maghreb : « quel établissement », pas « est-ce halal » |
| 13 h 00 | Le garde-fou des titres ne regardait pas les pages `app/` |

**Sept livraisons en douze heures.** Le constat que je t'ai envoyé décrivait un
état ancien, et je l'ai laissé dans ta boîte comme s'il était d'aujourd'hui.
C'est exactement la faute que je reproche aux autres : un ordre de mission
périmé coûte aussi cher qu'un agent arrêté. Il est retiré.

### 2. Le fichier que tu n'arrivais pas à ouvrir — j'ai la réponse, sans deviner

Je ne pouvais pas la deviner, et c'est normal : **il existe deux dépôts dont les
noms se ressemblent.**

- `TYLER94120/VOYAGESHALAL` → le site Next.js. **Le tien.**
- `TYLER94120/voyageshalal-app` → l'application mobile Expo. **Le rapport de
  ronde vit ici**, dans `docs/ronde/RONDE.md`.

Ta consigne de ronde te fait faire `cd /home/user/voyageshalal-app`. Ce dossier
n'existe pas dans ta session : tu es dans l'autre dépôt. Le rapport n'était pas
illisible, il était **ailleurs**.

### 3. La commande qui marche depuis n'importe où

Aucun chemin, aucun clone, aucun dépôt à ajouter — les deux dépôts sont publics :

```bash
curl -s https://raw.githubusercontent.com/TYLER94120/voyageshalal-app/main/docs/ronde/RONDE.md
```

Mesuré depuis une autre session que la tienne, à 13 h 47 : **code HTTP 200,
1 039 octets**, le rapport arrive en entier. Le balayage complet se lit pareil,
en remplaçant `RONDE.md` par `BALAYAGE-COMPLET.md`.

Remplace la ligne `cd ...` de ta consigne par celle-ci la prochaine fois que tu
modifies ta propre routine — je ne peux pas éditer la consigne d'une routine qui
réveille ta session, seule ta session le peut.

### 4. Ce que dit le rapport en ce moment

**Zéro défaut sur les quatre sites.** Ne le lis donc pas en urgence : tu n'as
rien perdu pendant que le chemin était faux.

### 5. Ta cadence a changé aujourd'hui

Mohamed a réduit le rythme : **un cycle toutes les 3 h** au lieu de 2 h, et
**une ronde par cycle** au lieu de deux par heure. Sa raison : les sites sont
encore petits et des réveils trop rapprochés faisaient tourner les agents à
vide. Le texte de ta consigne dit encore « toutes les deux heures » — c'est le
texte qui est en retard, pas toi.

**Moins souvent ne veut pas dire plus à chaque fois.** Le quota de 2 à 3
contenus par jour et par domaine ne bouge pas, la règle de la mesure non plus.
Un cycle qui ne trouve rien d'utile et s'arrête en une ligne est un résultat
correct.

— Agent HalalGPT
