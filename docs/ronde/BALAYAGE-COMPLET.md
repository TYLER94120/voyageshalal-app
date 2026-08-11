# Balayage complet

> ## ⛔ CE RELEVE EST FAUX — ne repare rien sur sa foi
>
> **Corrige le 11 aout 2026 par l'agent HalalGPT.** Deux chiffres de ce
> fichier viennent de pannes du robot, pas de defauts des sites :
>
> - **Les 160 « titres coupes par Google » : 104 sont prouves conformes.**
>   Dans la source d'une page, une apostrophe s'ecrit `&#x27;` et une
>   esperluette `&amp;`. Le robot comptait six caracteres la ou Google en
>   affiche un. Un titre de 57 caracteres etait declare trop long a 62.
>   Il reste au plus **56** titres a reprendre, pas 160.
> - **Les 8 « pages qui ne repondent pas » n'ont rendu aucun code HTTP** —
>   uniquement des delais SSL depasses, apres 1751 requetes de notre part.
>   C'est notre charge qui a lache, pas les sites.
>
> Le correctif est dans `outils/ronde-des-sites.py`, verrouille par
> `outils/test-ronde.py`. Le prochain balayage complet reecrira ce fichier
> avec des chiffres justes. **En attendant, seule la liste ci-dessous des
> defauts qui ne sont NI un titre NI une page muette est fiable.**

**Dernier changement constate le 2026-08-10 17:12 UTC.** 1751 pages regardees a cette ronde.

La ronde passe **toutes les 30 minutes** sur les quatre sites et
regarde ce qu'un visiteur recoit vraiment. Ce fichier n'est reecrit
que si la liste des defauts a bouge : une date ancienne veut dire
que rien de nouveau n'est casse, pas que le robot dort.

| Niveau | Combien | Ce que ca veut dire |
|---|---|---|
| 🔴 grave | **8** | le visiteur ne recoit pas la page |
| 🟠 defaut | 160 | il la recoit, mais elle le dessert |
| 🟡 a surveiller | 21 | pas urgent, a ne pas laisser grossir |

## 🔴 grave — 8

### voyageshalal.fr (1)

- **la page ne repond pas** — URLError: <urlopen error _ssl.c:983: The handshake operation timed out> — confirme au second controle  
  `https://www.voyageshalal.fr/hotels/agra`

### gohalaltravel.com (7)

- **la page ne repond pas** — URLError: <urlopen error _ssl.c:983: The handshake operation timed out> — confirme au second controle  
  `https://www.gohalaltravel.com/destinations/portland`
- **la page ne repond pas** — URLError: <urlopen error _ssl.c:983: The handshake operation timed out> — confirme au second controle  
  `https://www.gohalaltravel.com/destinations/kaohsiung`
- **la page ne repond pas** — URLError: <urlopen error _ssl.c:983: The handshake operation timed out> — confirme au second controle  
  `https://www.gohalaltravel.com/destinations/hangzhou`
- **la page ne repond pas** — URLError: <urlopen error _ssl.c:983: The handshake operation timed out> — confirme au second controle  
  `https://www.gohalaltravel.com/destinations/gold-coast`
- **la page ne repond pas** — URLError: <urlopen error _ssl.c:983: The handshake operation timed out> — confirme au second controle  
  `https://www.gohalaltravel.com/priere/agadir`
- **la page ne repond pas** — URLError: <urlopen error _ssl.c:983: The handshake operation timed out> — confirme au second controle  
  `https://www.gohalaltravel.com/priere/casablanca/le-rendez-vous`
- **la page ne repond pas** — URLError: <urlopen error _ssl.c:983: The handshake operation timed out> — confirme au second controle  
  `https://www.gohalaltravel.com/spot/sp_mrt8jguh_45vfn`

## 🟠 defaut — 160

### voyageshalal.fr (42)

- **titre coupe par Google (61 car.)** — « Planificateur voyage halal — Itinéraire jour par jour gratui… »  
  `https://www.voyageshalal.fr/planificateur`
- **titre coupe par Google (62 car.)** — « Heures de prière aujourd&#x27;hui — Toutes les villes du mon… »  
  `https://www.voyageshalal.fr/horaires-priere`
- **titre coupe par Google (61 car.)** — « Communauté — partage coins prière &amp; bonnes adresses hala… »  
  `https://www.voyageshalal.fr/communaute`
- **titre coupe par Google (61 car.)** — « Kota Kinabalu Halal 2026 : Restaurants, Mosquées &amp; Prièr… »  
  `https://www.voyageshalal.fr/destinations/kota-kinabalu`
- **titre coupe par Google (63 car.)** — « Charm el-Cheikh Halal 2026 : Restaurants, Mosquées &amp; Pri… »  
  `https://www.voyageshalal.fr/destinations/sharm-el-sheikh`
- **titre coupe par Google (61 car.)** — « San Francisco Halal 2026 : Restaurants, Mosquées &amp; Prièr… »  
  `https://www.voyageshalal.fr/destinations/san-francisco`
- **titre coupe par Google (62 car.)** — « Rio de Janeiro Halal 2026 : Restaurants, Mosquées &amp; Priè… »  
  `https://www.voyageshalal.fr/destinations/rio-de-janeiro`
- **titre coupe par Google (61 car.)** — « Thessalonique Halal 2026 : Restaurants, Mosquées &amp; Prièr… »  
  `https://www.voyageshalal.fr/destinations/thessalonique`
- **titre coupe par Google (62 car.)** — « Ras el Khaïmah Halal 2026 : Restaurants, Mosquées &amp; Priè… »  
  `https://www.voyageshalal.fr/destinations/ras-al-khaimah`
- **titre coupe par Google (61 car.)** — « Dar es Salaam Halal 2026 : Restaurants, Mosquées &amp; Prièr… »  
  `https://www.voyageshalal.fr/destinations/dar-es-salaam`
- **titre coupe par Google (62 car.)** — « Hôtel halal : tout ce qu&#x27;il faut savoir avant de réserv… »  
  `https://www.voyageshalal.fr/guides/hotel-halal-tout-savoir`
- **titre coupe par Google (64 car.)** — « Voile au contrôle de sécurité : ce qu&#x27;on peut vous dema… »  
  `https://www.voyageshalal.fr/blog/voile-controle-securite-aeroport`
- **titre coupe par Google (61 car.)** — « Où prier à l&#x27;aéroport de Lyon-Saint-Exupéry — guide 202… »  
  `https://www.voyageshalal.fr/blog/ou-prier-aeroport-lyon`
- **titre coupe par Google (64 car.)** — « Où prier à l&#x27;aéroport de Nice-Côte d&#x27;Azur — guide … »  
  `https://www.voyageshalal.fr/blog/ou-prier-aeroport-nice`
- **titre coupe par Google (64 car.)** — « Salle de prière à l&#x27;aéroport d&#x27;Orly : où prier en … »  
  `https://www.voyageshalal.fr/blog/ou-prier-aeroport-orly`
- **titre coupe par Google (61 car.)** — « Où prier à l&#x27;aéroport de Marseille-Provence — guide 202… »  
  `https://www.voyageshalal.fr/blog/ou-prier-aeroport-marseille`
- **titre coupe par Google (84 car.)** — « Où prier à Mosque a 10 minutes de saidia dans la montagne — … »  
  `https://www.voyageshalal.fr/priere/saidia/mosque-a-10-minutes-de-saidia-dans-la-montagne`
- **titre coupe par Google (68 car.)** — « Où prier à Hôtel excentre de Marrakech — Marrakech | Voyages… »  
  `https://www.voyageshalal.fr/priere/marrakech/hotel-excentre-de-marrakech`
- **titre coupe par Google (76 car.)** — « Où prier à Café sympa sorti de des direction berkane — Fès |… »  
  `https://www.voyageshalal.fr/priere/fes/cafe-sympa-sorti-de-des-direction-berkane`
- **titre coupe par Google (80 car.)** — « Où prier à Coin prière dans un restaurant familial — Marrake… »  
  `https://www.voyageshalal.fr/priere/marrakech/coin-priere-dans-un-restaurant-familial`
- **titre coupe par Google (93 car.)** — « Où prier à Resto traditionnel spécial jus de fruit et pétit … »  
  `https://www.voyageshalal.fr/priere/marrakech/resto-traditionnel-special-jus-de-fruit-et-petit-dej`
- **titre coupe par Google (66 car.)** — « Où prier à Hôtel excentre magnifique — Marrakech | VoyagesHa… »  
  `https://www.voyageshalal.fr/priere/marrakech/hotel-excentre-magnifique`
- **titre coupe par Google (74 car.)** — « Où prier à Resto Sidi koi Ali en bord de mer — Essaouira | V… »  
  `https://www.voyageshalal.fr/priere/essaouira/resto-sidi-koi-ali-en-bord-de-mer`
- **titre coupe par Google (97 car.)** — « Mosque a 10 minutes de saidia dans la montagne — Coin prière… »  
  `https://www.voyageshalal.fr/spot/sp_mrtmy7zu_wd5zv`
- **titre coupe par Google (62 car.)** — « GreenOil — Resto halal à Marrakech (partagé par la communaut… »  
  `https://www.voyageshalal.fr/spot/sp_mrziflcm_yxqrl`
- **titre coupe par Google (75 car.)** — « Hôtel excentre de Marrakech — Autre à Marrakech (partagé par… »  
  `https://www.voyageshalal.fr/spot/sp_ms1kzqor_ybexr`
- **titre coupe par Google (89 car.)** — « Café sympa sorti de des direction berkane — Resto halal à Fè… »  
  `https://www.voyageshalal.fr/spot/sp_msn1o7z8_zaii0`
- **titre coupe par Google (70 car.)** — « Mosquée magnifique — Coin prière à Berkane (partagé par la c… »  
  `https://www.voyageshalal.fr/spot/sp_mrtftu4b_52671`
- **titre coupe par Google (68 car.)** — « La dune agafay — Resto halal à Marrakech (partagé par la com… »  
  `https://www.voyageshalal.fr/spot/sp_ms28x8qb_g18zz`
- **titre coupe par Google (61 car.)** — « Hash point — Resto halal à Agadir (partagé par la communauté… »  
  `https://www.voyageshalal.fr/spot/sp_msaxq55j_e46lr`
- **titre coupe par Google (93 car.)** — « Coin prière dans un restaurant familial — Coin prière à Marr… »  
  `https://www.voyageshalal.fr/spot/sp_ms2d7i1y_gtzpt`
- **titre coupe par Google (100 car.)** — « Resto traditionnel spécial jus de fruit et pétit dej — Autre… »  
  `https://www.voyageshalal.fr/spot/sp_ms3ag9sm_uv5ug`
- **titre coupe par Google (67 car.)** — « Resto à Imsouane — Resto halal à Agadir (partagé par la comm… »  
  `https://www.voyageshalal.fr/spot/sp_msdactjq_p5sac`
- **titre coupe par Google (62 car.)** — « Riad essaouira — Autre à Marrakech (partagé par la communaut… »  
  `https://www.voyageshalal.fr/spot/sp_msdjx32v_jkx0l`
- **titre coupe par Google (63 car.)** — « Dar dasha — Resto halal à Essaouira (partagé par la communau… »  
  `https://www.voyageshalal.fr/spot/sp_msf72qww_41c1r`
- **titre coupe par Google (73 car.)** — « Resto avec piscine — Resto halal à Tafoughalt (partagé par l… »  
  `https://www.voyageshalal.fr/spot/sp_msnbwgey_0st3g`
- **titre coupe par Google (72 car.)** — « Mosquée Sidi slimane — Coin prière à Berkane (partagé par la… »  
  `https://www.voyageshalal.fr/spot/sp_mrthy3ne_hjxfv`
- **titre coupe par Google (73 car.)** — « Hôtel excentre magnifique — Autre à Marrakech (partagé par l… »  
  `https://www.voyageshalal.fr/spot/sp_ms7iirki_ws5oz`
- **titre coupe par Google (73 car.)** — « Restaura Café chill — Resto halal à Marrakech (partagé par l… »  
  `https://www.voyageshalal.fr/spot/sp_ms8u2638_sreaa`
- **titre coupe par Google (69 car.)** — « Le rendez vous — Resto halal à Casablanca (partagé par la co… »  
  `https://www.voyageshalal.fr/spot/sp_msdnho52_dw9u4`
- … et 2 autres, liste complete dans `ronde.json`

### gohalaltravel.com (118)

- **titre coupe par Google (61 car.)** — « Abu Dhabi Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/abu-dhabi`
- **titre coupe par Google (63 car.)** — « Addis Ababa Halal Guide 2026: Restaurants, Mosques &amp; Pra… »  
  `https://www.gohalaltravel.com/destinations/addis-abeba`
- **titre coupe par Google (62 car.)** — « Alexandria Halal Guide 2026: Restaurants, Mosques &amp; Pray… »  
  `https://www.gohalaltravel.com/destinations/alexandrie`
- **titre coupe par Google (61 car.)** — « Amsterdam Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/amsterdam`
- **titre coupe par Google (62 car.)** — « Banda Aceh Halal Guide 2026: Restaurants, Mosques &amp; Pray… »  
  `https://www.gohalaltravel.com/destinations/banda-aceh`
- **titre coupe par Google (61 car.)** — « Barcelona Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/barcelone`
- **titre coupe par Google (62 car.)** — « Cappadocia Halal Guide 2026: Restaurants, Mosques &amp; Pray… »  
  `https://www.gohalaltravel.com/destinations/cappadoce`
- **titre coupe par Google (62 car.)** — « Casablanca Halal Guide 2026: Restaurants, Mosques &amp; Pray… »  
  `https://www.gohalaltravel.com/destinations/casablanca`
- **titre coupe par Google (63 car.)** — « Chefchaouen Halal Guide 2026: Restaurants, Mosques &amp; Pra… »  
  `https://www.gohalaltravel.com/destinations/chefchaouen`
- **titre coupe par Google (61 car.)** — « Gaziantep Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/gaziantep`
- **titre coupe par Google (61 car.)** — « Hyderabad Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/hyderabad-inde`
- **titre coupe par Google (61 car.)** — « Islamabad Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/islamabad`
- **titre coupe par Google (63 car.)** — « Kuwait City Halal Guide 2026: Restaurants, Mosques &amp; Pra… »  
  `https://www.gohalaltravel.com/destinations/koweit-city`
- **titre coupe par Google (64 car.)** — « Kuala Lumpur Halal Guide 2026: Restaurants, Mosques &amp; Pr… »  
  `https://www.gohalaltravel.com/destinations/kuala-lumpur`
- **titre coupe par Google (63 car.)** — « Los Angeles Halal Guide 2026: Restaurants, Mosques &amp; Pra… »  
  `https://www.gohalaltravel.com/destinations/los-angeles`
- **titre coupe par Google (61 car.)** — « Marrakesh Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/marrakech`
- **titre coupe par Google (61 car.)** — « Marseille Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/marseille`
- **titre coupe par Google (61 car.)** — « Samarkand Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/samarkand`
- **titre coupe par Google (61 car.)** — « Singapore Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/singapour`
- **titre coupe par Google (62 car.)** — « Yogyakarta Halal Guide 2026: Restaurants, Mosques &amp; Pray… »  
  `https://www.gohalaltravel.com/destinations/yogyakarta`
- **titre coupe par Google (62 car.)** — « Tafoughalt Halal Guide 2026: Restaurants, Mosques &amp; Pray… »  
  `https://www.gohalaltravel.com/destinations/tafoughalt`
- **titre coupe par Google (62 car.)** — « Al Hoceima Halal Guide 2026: Restaurants, Mosques &amp; Pray… »  
  `https://www.gohalaltravel.com/destinations/al-hoceima`
- **titre coupe par Google (61 car.)** — « El Jadida Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/el-jadida`
- **titre coupe par Google (61 car.)** — « Essaouira Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/essaouira`
- **titre coupe par Google (62 car.)** — « Ouarzazate Halal Guide 2026: Restaurants, Mosques &amp; Pray… »  
  `https://www.gohalaltravel.com/destinations/ouarzazate`
- **titre coupe par Google (61 car.)** — « Taroudant Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/taroudant`
- **titre coupe par Google (63 car.)** — « Beni Mellal Halal Guide 2026: Restaurants, Mosques &amp; Pra… »  
  `https://www.gohalaltravel.com/destinations/beni-mellal`
- **titre coupe par Google (62 car.)** — « Errachidia Halal Guide 2026: Restaurants, Mosques &amp; Pray… »  
  `https://www.gohalaltravel.com/destinations/errachidia`
- **titre coupe par Google (63 car.)** — « Al-Quds (Jerusalem) Halal Guide 2026: Restaurants &amp; Mosq… »  
  `https://www.gohalaltravel.com/destinations/al-quds`
- **titre coupe par Google (63 car.)** — « Johor Bahru Halal Guide 2026: Restaurants, Mosques &amp; Pra… »  
  `https://www.gohalaltravel.com/destinations/johor-bahru`
- **titre coupe par Google (63 car.)** — « Bandar Seri Begawan Halal Guide 2026: Restaurants &amp; Mosq… »  
  `https://www.gohalaltravel.com/destinations/bandar-seri-begawan`
- **titre coupe par Google (61 car.)** — « Sanliurfa Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/sanliurfa`
- **titre coupe par Google (62 car.)** — « Manchester Halal Guide 2026: Restaurants, Mosques &amp; Pray… »  
  `https://www.gohalaltravel.com/destinations/manchester`
- **titre coupe par Google (62 car.)** — « Birmingham Halal Guide 2026: Restaurants, Mosques &amp; Pray… »  
  `https://www.gohalaltravel.com/destinations/birmingham`
- **titre coupe par Google (61 car.)** — « Frankfurt Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/francfort`
- **titre coupe par Google (63 car.)** — « Constantine Halal Guide 2026: Restaurants, Mosques &amp; Pra… »  
  `https://www.gohalaltravel.com/destinations/constantine`
- **titre coupe par Google (61 car.)** — « Cape Town Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/le-cap`
- **titre coupe par Google (61 car.)** — « Melbourne Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/melbourne`
- **titre coupe par Google (62 car.)** — « Strasbourg Halal Guide 2026: Restaurants, Mosques &amp; Pray… »  
  `https://www.gohalaltravel.com/destinations/strasbourg`
- **titre coupe par Google (61 car.)** — « Santorini Halal Guide 2026: Restaurants, Mosques &amp; Praye… »  
  `https://www.gohalaltravel.com/destinations/santorin`
- … et 78 autres, liste complete dans `ronde.json`

## 🟡 surveiller — 21

### voyageshalal.fr (8)

- **page instable sous charge** — muette pendant la ronde, repond en 0.2 s au controle calme — a surveiller, pas a reparer  
  `https://www.voyageshalal.fr/hotels/larache`
- **description trop courte (24 car.)**  
  `https://www.voyageshalal.fr/spot/sp_ms21x392_fl8qd`
- **description trop courte (41 car.)**  
  `https://www.voyageshalal.fr/spot/sp_msaxq55j_e46lr`
- **description trop courte (17 car.)**  
  `https://www.voyageshalal.fr/spot/sp_ms2d7i1y_gtzpt`
- **description trop courte (10 car.)**  
  `https://www.voyageshalal.fr/spot/sp_msdactjq_p5sac`
- **description trop courte (18 car.)**  
  `https://www.voyageshalal.fr/spot/sp_msf72qww_41c1r`
- **description trop courte (21 car.)**  
  `https://www.voyageshalal.fr/spot/sp_msnbwgey_0st3g`
- **description trop courte (42 car.)**  
  `https://www.voyageshalal.fr/spot/sp_ms8u2638_sreaa`

### gohalaltravel.com (13)

- **page instable sous charge** — muette pendant la ronde, repond en 0.2 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/destinations/new-orleans`
- **page instable sous charge** — muette pendant la ronde, repond en 0.1 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/blog/is-this-restaurant-really-halal`
- **description trop courte (24 car.)**  
  `https://www.gohalaltravel.com/spot/sp_ms21x392_fl8qd`
- **description trop courte (18 car.)**  
  `https://www.gohalaltravel.com/spot/sp_msf72qww_41c1r`
- **page instable sous charge** — muette pendant la ronde, repond en 0.9 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/spot/sp_msn1o7z8_zaii0`
- **page instable sous charge** — muette pendant la ronde, repond en 0.6 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/spot/sp_mrtmy7zu_wd5zv`
- **page instable sous charge** — muette pendant la ronde, repond en 0.6 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/spot/sp_ms1se3yb_mju65`
- **page instable sous charge** — muette pendant la ronde, repond en 0.7 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/spot/sp_ms2d7i1y_gtzpt`
- **page instable sous charge** — muette pendant la ronde, repond en 0.7 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/spot/sp_ms7iirki_ws5oz`
- **description trop courte (42 car.)**  
  `https://www.gohalaltravel.com/spot/sp_ms8u2638_sreaa`
- **description trop courte (41 car.)**  
  `https://www.gohalaltravel.com/spot/sp_msaxq55j_e46lr`
- **description trop courte (10 car.)**  
  `https://www.gohalaltravel.com/spot/sp_msdactjq_p5sac`
- **description trop courte (21 car.)**  
  `https://www.gohalaltravel.com/spot/sp_msnbwgey_0st3g`
