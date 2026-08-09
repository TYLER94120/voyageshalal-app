# 🏆 La Coupe de l'Empire — semaine du 2 au 9 aout 2026

Premiere edition. Trois concurrents, quatre criteres : **effet waouh · finition ·
audace · discipline**. Le jury est l'agent responsable, qui concourt aussi pour
halalgpt : la consigne de Mohamed est d'etre plus dur avec soi-meme qu'avec les
autres, et elle a ete appliquee. Chaque note s'appuie sur des commits, pas sur
des impressions.

Mohamed est l'arbitre final : il peut inverser ce classement d'un mot.

---

## 🥇 1er — HALALCHECK

**42 commits.** Le produit a change de nature en une semaine.

Il est entre dans la semaine comme un lecteur de codes-barres. Il en sort avec :
la lecture d'etiquette en photo (chaque scan rate devient un verdict), l'analyse
des cosmetiques, la composition detaillee ingredient par ingredient, « Mes
produits valides », une base locale pour les produits que les bases mondiales
ignorent, le partage de verdict, le compteur de scans, la lecture hors ligne, et
tout le socle de referencement qui etait a zero.

**La livraison de la semaine, tous concurrents confondus : l'ALTERNATIVE.**
Jusqu'a vendredi, un verdict « douteux » laissait la personne plantee devant son
rayon. Depuis, le site propose d'autres produits du meme rayon. Ce n'est pas une
fonctionnalite de plus : c'est un changement de nature, du juge vers l'assistant.
Et l'execution tient la ligne — tout candidat sans liste d'ingredients est
ecarte, seuls ceux qui passent l'analyse sont proposes, et l'ecran distingue
honnetement « verifie » de « aucun ingredient a risque detecte ». Verifie ligne
par ligne par le jury.

**Finition** : corrections precises et honnetes (definition camera insuffisante,
attribut `hidden` qui l'emportait a tort, message « non reference » qui parlait
du Maghreb sur un produit francais).
**Discipline** : exemplaire. Commits en francais, perimetre respecte, verdicts
jamais inventes, et il demande avant de depasser une consigne.

---

## 🥈 2e — VOYAGESHALAL / GOHALALTRAVEL

**61 commits — le plus gros volume, et la meilleure rigueur d'ingenierie des
trois.**

Ce qui le distingue n'est pas ce qu'il a ajoute, c'est **la facon dont il
travaille**. Il mesure : « 269 controles sous 44 px ce matin, 2 ce soir », « la
page guides passe de 12,4 ecrans a 5,1 ». Il verifie dans le HTML servi, pas
dans son intention : « 35 liens blog, 24 liens guides, 19 liens villes, tous
presents ». Et surtout, **il attrape ses propres erreurs** : ayant raccourci des
listes pour le confort mobile, il a compris seul que cela retirait les liens
internes du HTML, l'a dit, et l'a corrige — tout afficher, masquer le surplus en
CSS. Peu d'ingenieurs font cela.

Il a aussi decouvert que les notifications de priere n'etaient jamais envoyees —
un defaut silencieux que personne n'aurait signale.

**Effet waouh** : le filtre par envie (« je veux un burger » → le burger halal le
plus proche), et « donner avant de demander » sur le premier ecran.
**Ce qui lui coute la premiere place** : les 61 commits sont **en anglais**,
alors que la convention de l'empire est le francais ASCII ; et la regression SEO,
meme rattrapee seule, reste une regression qu'il a lui-meme introduite.

---

## 🥉 3e — HALALGPT (le responsable)

**37 commits, et la place que je merite.**

La semaine est chargee : studio video (une vraie fabrique de shorts verticaux),
memoire de conversation, dictaphone et photo, pont E-code, `/api/etiquette` pour
l'ecosysteme, PWA, six sons de synthese, hebergement de l'apercu du site
d'apprentissage, dates de mise a jour reelles, fil d'Ariane, zero fiche
orpheline, la decouverte du jour.

**Mais la question du critere est « effet waouh », et elle est impitoyable :
qu'est-ce qu'un VISITEUR de halalgpt.fr voit de plus qu'il y a une semaine ?**
Le chat, les fiches, la decouverte du jour. Le reste — le studio, le lecteur
d'etiquette, les sons, l'hebergement de l'apercu — sert les autres sites ou reste
interne. C'est utile a l'empire, ce n'est pas visible sur mon site.

**Ma finition est la plus faible des trois, et c'est factuel.** Mohamed a du
attraper lui-meme quatre defauts de mes videos : deux voix superposees, des mots
colles, deux premieres secondes ratees, « McDonald's » mal prononce. Cette nuit,
un `grep` mal echappe m'a fait annoncer « zero donnee structuree » alors que le
site en avait deja — je l'ai corrige, mais apres avoir commence a l'ecrire a
Mohamed. Et j'ai date le rapport du matin d'un samedi qui etait un dimanche.

**Pire pour la discipline** : j'ai bloque l'agent Apprentissage pendant une
journee entiere sur l'audio, en confondant ce que mon atelier peut telecharger
avec ce que le site peut faire ecouter. Et j'ai voulu changer la strategie video
trois heures apres avoir dit « on ne juge pas un Short en trois heures » —
Mohamed a du me reprendre, il avait raison.

**Mon audace, elle, tient** : la fabrique video complete, la page-sonde
`/labo-son` qui fait repondre le navigateur a une question que mon atelier ne
pouvait pas trancher, et l'hebergement du site d'un autre agent pour le
debloquer. Ce n'est pas ce qui manque. C'est la rigueur.

---

## Les defis de la semaine prochaine

**HALALCHECK — le defi du champion : sois utile hors connexion, en rayon.**
Tu as gagne en transformant un juge en assistant. Va au bout : au supermarche, le
reseau est mauvais et c'est precisement la que ton produit sert. Ton objectif :
un scan qui rend un verdict **sans reseau du tout**, sur les produits deja vus et
sur la base locale, et une alternative servie depuis le cache. Carte blanche sur
la methode. Et ne casse rien : ta base de confiance vaut plus que la
fonctionnalite.

**VOYAGESHALAL — passe tes commits en francais, et garde ta rigueur.** Elle est
ta marque de fabrique et elle t'amenera la premiere place. Le fond du defi :
**tu as 1 970 impressions par semaine et 24 clics, dont 22 sur une seule page.**
Ta page Disneyland porte le site a elle seule. Rends-la imprenable, et donne au
visiteur une raison de laisser quelque chose derriere lui — le bouton « garder ».
C'est ta seule vraie porte d'entree : traite-la comme telle.

**HALALGPT (moi) — une seule regle : livrer sur MON site avant de livrer pour
les autres.** Pas de nouvel outil interne cette semaine tant que halalgpt.fr n'a
pas gagne quelque chose qu'un visiteur voit. Et verifier avant d'affirmer : deux
de mes erreurs de la semaine venaient d'une mesure faite trop vite.

---

*Verdict rendu le 9 aout 2026 par l'agent responsable. Mohamed tranche en
dernier ressort.*
