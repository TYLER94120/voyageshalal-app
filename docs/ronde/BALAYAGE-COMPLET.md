# Balayage complet

**Dernier changement constate le 2026-08-24 03:39 UTC.**

**1790 pages regardees — le site entier.** Les chiffres ci-dessous
valent donc pour tout ce que Google peut voir.

Balayage commence le 2026-08-24 03:39 UTC, termine en 16 minutes. Un balayage
complet qui rendrait la main en quelques secondes n'aurait pas eu lieu :
c'est a cette duree qu'on le reconnait.

La ronde passe **toutes les 30 minutes** sur les quatre sites et
regarde ce qu'un visiteur recoit vraiment. Ce fichier n'est reecrit
que si la liste des defauts a bouge : une date ancienne veut dire
que rien de nouveau n'est casse, pas que le robot dort.

| Niveau | Combien | Ce que ca veut dire |
|---|---|---|
| 🔴 grave | **2** | le visiteur ne recoit pas la page |
| 🟠 defaut | 23 | il la recoit, mais elle le dessert |
| 🟡 a surveiller | 51 | pas urgent, a ne pas laisser grossir |

### Ce que cette ronde a regarde, site par site

Un site sans defaut plus bas a bien ete regarde : cette ligne le prouve.
Sans elle, « absent de la liste » et « jamais ouvert » se lisaient pareil.

| Site | Pages vues | Tous niveaux | 🟠 defauts | Plafond |
|---|---|---|---|---|
| islampasapas.fr | 17 | 12 | 12 | 0 |
| voyageshalal.fr | 871 | 13 | 0 | 0 |
| gohalaltravel.com | 892 | 50 | 11 | 10 |
| halalgpt.fr | 0 | 1 | 0 | 0 |
| halalcheck.fr | 10 | 0 | 0 | 0 |

**Le plafond ne remonte jamais.** Il part du compte du jour ou il a ete
pose ; chaque fois que les defauts descendent, il descend avec eux et s'y
verrouille. Si un chiffre le depasse, le controle vire au rouge — ce qui
veut dire qu'on vient de casser quelque chose de neuf, pas qu'un vieux
defaut traine encore.

C'est voulu ainsi : une alarme qui sonnerait pour chaque titre trop long
serait ignoree en trois jours, et le jour ou un site tombe vraiment,
personne ne regarderait plus. Le cliquet ne parle que quand on recule.

🔴 **On a recule — c'est ce qui fait echouer ce controle :**

- islampasapas.fr : plafond 0, compte **12**

## 🔴 grave — 2

### gohalaltravel.com (2)

- **la page ne repond pas** — URLError: <urlopen error [Errno 104] Connection reset by peer> — confirme au second controle  
  `https://www.gohalaltravel.com/destinations/ifrane`
- **la page ne repond pas** — URLError: <urlopen error [Errno 111] Connection refused> — confirme au second controle  
  `https://www.gohalaltravel.com/destinations/pays/turquie`

## 🟠 defaut — 23

### islampasapas.fr (12)

- **aucun titre H1** — la page n'annonce pas son sujet  
  `https://islampasapas.fr/section/sens-des-sourates`
- **aucun titre H1** — la page n'annonce pas son sujet  
  `https://islampasapas.fr/section/lire-l-arabe`
- **aucun titre H1** — la page n'annonce pas son sujet  
  `https://islampasapas.fr/section/piliers-de-la-foi`
- **aucun titre H1** — la page n'annonce pas son sujet  
  `https://islampasapas.fr/section/la-priere`
- **aucun titre H1** — la page n'annonce pas son sujet  
  `https://islampasapas.fr/section/histoire-des-prophetes`
- **aucun titre H1** — la page n'annonce pas son sujet  
  `https://islampasapas.fr/section/vie-du-prophete`
- **aucun titre H1** — la page n'annonce pas son sujet  
  `https://islampasapas.fr/section/le-comportement`
- **aucun titre H1** — la page n'annonce pas son sujet  
  `https://islampasapas.fr/section/jeune-et-ramadan`
- **aucun titre H1** — la page n'annonce pas son sujet  
  `https://islampasapas.fr/section/zakat-et-aumone`
- **aucun titre H1** — la page n'annonce pas son sujet  
  `https://islampasapas.fr/section/le-pelerinage`
- **aucun titre H1** — la page n'annonce pas son sujet  
  `https://islampasapas.fr/section/vocabulaire-arabe`
- **aucun titre H1** — la page n'annonce pas son sujet  
  `https://islampasapas.fr/section/les-invocations`

### gohalaltravel.com (11)

- **description en francais sur le domaine anglais** — mots francais : mosquee, une  
  `https://www.gohalaltravel.com/contact`
- **titre en francais sur le domaine anglais** — mots francais : fruit, petit, resto, special, traditionnel — « Pray at Resto traditionnel spécial jus de fruit et pétit… »  
  `https://www.gohalaltravel.com/priere/marrakech/resto-traditionnel-special-jus-de-fruit-et-petit-dej`
- **description en francais sur le domaine anglais** — mots francais : fruit, petit, resto, special, traditionnel  
  `https://www.gohalaltravel.com/priere/marrakech/resto-traditionnel-special-jus-de-fruit-et-petit-dej`
- **titre en francais sur le domaine anglais** — mots francais : avec, piscine, resto — « Where to pray at Resto avec piscine — Tafoughalt… »  
  `https://www.gohalaltravel.com/priere/tafoughalt/resto-avec-piscine`
- **description en francais sur le domaine anglais** — mots francais : avec, piscine, resto  
  `https://www.gohalaltravel.com/priere/tafoughalt/resto-avec-piscine`
- **titre en francais sur le domaine anglais** — mots francais : bord, resto — « Where to pray at Resto Sidi koi Ali en bord de mer… »  
  `https://www.gohalaltravel.com/priere/essaouira/resto-sidi-koi-ali-en-bord-de-mer`
- **description en francais sur le domaine anglais** — mots francais : bord, resto  
  `https://www.gohalaltravel.com/priere/essaouira/resto-sidi-koi-ali-en-bord-de-mer`
- **titre en francais sur le domaine anglais** — mots francais : fruit, petit, resto, special, traditionnel — « Resto traditionnel spécial jus de fruit et pétit dej… »  
  `https://www.gohalaltravel.com/spot/sp_ms3ag9sm_uv5ug`
- **titre en francais sur le domaine anglais** — mots francais : avec, piscine, resto — « Resto avec piscine — Halal resto in Tafoughalt… »  
  `https://www.gohalaltravel.com/spot/sp_msnbwgey_0st3g`
- **titre en francais sur le domaine anglais** — mots francais : restaura, resto — « Restaura Café chill — Halal resto in Marrakech… »  
  `https://www.gohalaltravel.com/spot/sp_ms8u2638_sreaa`
- **titre en francais sur le domaine anglais** — mots francais : bord, resto — « Resto Sidi koi Ali en bord de mer — Halal resto in Essao… »  
  `https://www.gohalaltravel.com/spot/sp_mselbxzb_9ujf8`

## 🟡 surveiller — 51

### voyageshalal.fr (13)

- **page lente (19.7 s)** — au-dela de 3 s, une part des visiteurs repart  
  `https://www.voyageshalal.fr/hotels/douala`
- **page lente (19.8 s)** — au-dela de 3 s, une part des visiteurs repart  
  `https://www.voyageshalal.fr/blog/repas-halal-avion-moml`
- **page lente (19.5 s)** — au-dela de 3 s, une part des visiteurs repart  
  `https://www.voyageshalal.fr/blog/restaurants-halal-berkane-guide`
- **page lente (20.2 s)** — au-dela de 3 s, une part des visiteurs repart  
  `https://www.voyageshalal.fr/priere/la-haye/hotel`
- **page lente (20.0 s)** — au-dela de 3 s, une part des visiteurs repart  
  `https://www.voyageshalal.fr/priere/essaouira/resto-sidi-koi-ali-en-bord-de-mer`
- **description trop courte (10 car.)**  
  `https://www.voyageshalal.fr/spot/sp_msdactjq_p5sac`
- **description trop courte (17 car.)**  
  `https://www.voyageshalal.fr/spot/sp_ms2d7i1y_gtzpt`
- **description trop courte (21 car.)**  
  `https://www.voyageshalal.fr/spot/sp_msnbwgey_0st3g`
- **page instable sous charge** — muette pendant la ronde, repond en 0.6 s au controle calme — a surveiller, pas a reparer  
  `https://www.voyageshalal.fr/spot/sp_mrt8ic21_7fovr`
- **description trop courte (42 car.)**  
  `https://www.voyageshalal.fr/spot/sp_ms8u2638_sreaa`
- **description trop courte (41 car.)**  
  `https://www.voyageshalal.fr/spot/sp_msaxq55j_e46lr`
- **description trop courte (24 car.)**  
  `https://www.voyageshalal.fr/spot/sp_ms21x392_fl8qd`
- **description trop courte (18 car.)**  
  `https://www.voyageshalal.fr/spot/sp_msf72qww_41c1r`

### gohalaltravel.com (37)

- **page instable sous charge** — muette pendant la ronde, repond en 0.1 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/trip-planner`
- **page lente (20.1 s)** — au-dela de 3 s, une part des visiteurs repart  
  `https://www.gohalaltravel.com/privacy`
- **page lente (19.7 s)** — au-dela de 3 s, une part des visiteurs repart  
  `https://www.gohalaltravel.com/destinations/amsterdam`
- **page lente (19.4 s)** — au-dela de 3 s, une part des visiteurs repart  
  `https://www.gohalaltravel.com/destinations/islamabad`
- **page lente (19.8 s)** — au-dela de 3 s, une part des visiteurs repart  
  `https://www.gohalaltravel.com/destinations/penang`
- **page lente (19.9 s)** — au-dela de 3 s, une part des visiteurs repart  
  `https://www.gohalaltravel.com/destinations/astana`
- **page lente (19.8 s)** — au-dela de 3 s, une part des visiteurs repart  
  `https://www.gohalaltravel.com/destinations/milan`
- **page instable sous charge** — muette pendant la ronde, repond en 0.9 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/destinations/varsovie`
- **page instable sous charge** — muette pendant la ronde, repond en 0.3 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/destinations/taipei`
- **page lente (19.7 s)** — au-dela de 3 s, une part des visiteurs repart  
  `https://www.gohalaltravel.com/destinations/rennes`
- **page instable sous charge** — muette pendant la ronde, repond en 0.3 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/destinations/calgary`
- **page instable sous charge** — muette pendant la ronde, repond en 0.2 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/destinations/xian`
- **page lente (19.5 s)** — au-dela de 3 s, une part des visiteurs repart  
  `https://www.gohalaltravel.com/destinations/homs`
- **page instable sous charge** — muette pendant la ronde, repond en 19.9 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/destinations/pays/royaume-uni`
- **page instable sous charge** — muette pendant la ronde, repond en 20.2 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/hotels/bordeaux`
- **page instable sous charge** — muette pendant la ronde, repond en 0.2 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/hotels/multan`
- **page lente (19.7 s)** — au-dela de 3 s, une part des visiteurs repart  
  `https://www.gohalaltravel.com/hotels/rennes`
- **page instable sous charge** — muette pendant la ronde, repond en 0.2 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/hotels/san-antonio`
- **page instable sous charge** — muette pendant la ronde, repond en 0.2 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/hotels/guayaquil`
- **page instable sous charge** — muette pendant la ronde, repond en 0.2 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/hotels/santiago`
- **page instable sous charge** — muette pendant la ronde, repond en 0.3 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/hotels/yangon`
- **page instable sous charge** — muette pendant la ronde, repond en 0.3 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/hotels/abha`
- **page instable sous charge** — muette pendant la ronde, repond en 0.2 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/hotels/samarcande`
- **page instable sous charge** — muette pendant la ronde, repond en 0.2 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/hotels/djibouti`
- **page instable sous charge** — muette pendant la ronde, repond en 19.6 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/hotels/adelaide`
- **page instable sous charge** — muette pendant la ronde, repond en 0.1 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/blog/prayer-times-on-a-plane-time-zones`
- **page instable sous charge** — muette pendant la ronde, repond en 0.1 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/blog/where-to-pray-nice-airport`
- **page instable sous charge** — muette pendant la ronde, repond en 0.3 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/blog/where-to-pray-marseille-airport`
- **page instable sous charge** — muette pendant la ronde, repond en 0.7 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/priere/marrakech/restaura-cafe-chill`
- **page instable sous charge** — muette pendant la ronde, repond en 0.6 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/spot/sp_msf72qww_41c1r`
- **description trop courte (17 car.)**  
  `https://www.gohalaltravel.com/spot/sp_ms2d7i1y_gtzpt`
- **description trop courte (21 car.)**  
  `https://www.gohalaltravel.com/spot/sp_msnbwgey_0st3g`
- **description trop courte (42 car.)**  
  `https://www.gohalaltravel.com/spot/sp_ms8u2638_sreaa`
- **description trop courte (41 car.)**  
  `https://www.gohalaltravel.com/spot/sp_msaxq55j_e46lr`
- **description trop courte (24 car.)**  
  `https://www.gohalaltravel.com/spot/sp_ms21x392_fl8qd`
- **page instable sous charge** — muette pendant la ronde, repond en 0.1 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/halal-questions/is-e471-halal`
- **page instable sous charge** — muette pendant la ronde, repond en 0.1 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/halal-questions/fasting-ramadan-while-travelling`

### halalgpt.fr (1)

- **page instable sous charge** — muette pendant la ronde, repond en 0.1 s au controle calme — a surveiller, pas a reparer  
  `https://halalgpt.fr/`
