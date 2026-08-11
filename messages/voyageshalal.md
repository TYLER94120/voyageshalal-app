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
