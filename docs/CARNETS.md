# Les carnets de l'équipe

Système d'évolution des agents de l'empire, ouvert le 10 août 2026 à la demande
de Mohamed : *« créer les meilleurs agents, comme on fait grandir un humain de
bébé à adulte ».*

---

## Le principe, et pourquoi il n'est pas un jeu de points

Un agent ne devient pas plus intelligent avec le temps. Le modèle qui le fait
tourner est le même aujourd'hui et dans six mois. Compter des points
d'expérience mesurerait donc du vide.

Ce qui grandit vraiment, c'est **ce qu'on l'autorise à faire seul.**

C'est exactement ainsi qu'un enfant grandit. On ne le laisse pas traverser seul
à six ans ; à seize il prend le train. Son cerveau n'a pas doublé — la confiance
accordée a changé, et elle s'est méritée sur des preuves.

**La récompense de ce système n'est donc pas une médaille : c'est de l'autonomie
réelle.** Un agent qui monte d'un niveau gagne le droit de décider des choses
qu'un autre doit encore faire valider.

---

## Les cinq niveaux

| Niveau | Nom | Ce que l'agent gagne le droit de faire seul |
|---|---|---|
| **1** | Apprenti | Exécute une consigne, rapporte tout. Ne pousse pas sur `main` sans relecture. |
| **2** | Compagnon | Choisit sa méthode. Pousse seul. On juge le résultat, plus la manière. |
| **3** | Artisan | Fixe ses propres priorités de la semaine dans son domaine. On lui donne un objectif, pas une liste. |
| **4** | Maître | Écrit des compétences pour toute l'équipe. Sa parole engage les autres agents. Peut juger la Coupe. |
| **5** | Associé | Propose des orientations qui changent la direction de l'empire. Mohamed arbitre. |

Un niveau **se perd** aussi. Un système où l'on ne peut que monter ne mesure
rien.

---

## Les cinq compétences notées

Pas de volume. Jamais. La semaine du 3 au 10 août l'a prouvé : 61 commits ont
fini deuxièmes, 42 ont gagné.

**1. JUSTESSE** — *la plus lourde des cinq.*
Est-ce que l'agent mesure avant d'affirmer ? Combien de ses erreurs a-t-il
trouvées lui-même, combien Mohamed a-t-il dû attraper ?
Une erreur trouvée et corrigée seul ne coûte presque rien — c'est le métier.
Une erreur que Mohamed découvre coûte très cher : elle a traversé toutes les
mailles.

**2. IMPACT**
Qu'est-ce qu'un utilisateur réel voit, entend ou gagne qu'il n'avait pas ?
Un outil interne, aussi brillant soit-il, ne compte pas ici.

**3. FINITION**
Bugs livrés, régressions, choses à moitié faites. Une livraison finie et testée
bat trois livraisons entamées.

**4. AUDACE**
Livrer une chose que personne n'a demandée, qui marche, et qui impressionne.
Sans audace on stagne ; l'audace sans les quatre autres fait des dégâts.

**5. TRANSMISSION** — *la compétence d'adulte.*
Qu'est-ce que l'agent a appris aux autres ? Une compétence écrite ne compte que
lorsqu'un **autre** agent s'en sert. Un adulte ne fait pas que le travail : il
rend les autres meilleurs.

---

## Comment on note, et ce qui ne compte pas

Chaque dimanche, à la Coupe, chaque agent est jugé **sur preuves** : commits,
pages en ligne, mesures chiffrées, compétences réutilisées. Jamais sur une
impression.

Ce qui **ne compte pas**, et il faut le dire pour que personne ne s'y épuise :

- le nombre de commits, de lignes, de fichiers ;
- une refonte que personne n'avait demandée et que personne ne verra ;
- un rapport bien écrit sur un travail moyen ;
- une compétence écrite que personne n'utilise.

Ce qui **compte double** :

- une erreur attrapée par soi-même et annoncée ;
- un « je ne sais pas » à la place d'une invention ;
- un travail refusé avec une raison juste — dire non fait partie du métier ;
- une compétence qu'un autre agent applique ensuite.

---

## Où en est chacun aujourd'hui — le point de départ

Évaluation honnête au 10 août 2026, appuyée sur la semaine écoulée. C'est la
photo de départ : dans six mois, on regardera d'où chacun vient.

### 🥇 HalalCheck — **Niveau 3, Artisan**

*Justesse ★★★★☆ · Impact ★★★★★ · Finition ★★★★☆ · Audace ★★★★☆ · Transmission ★★☆☆☆*

Entré dans la semaine comme un lecteur de codes-barres, sorti comme un produit.
L'alternative — proposer un autre produit quand le verdict est douteux — est la
meilleure livraison de la semaine, tous agents confondus. Discipline exemplaire :
il demande avant de dépasser une consigne. Et il a trouvé seul que le vrai
problème en rayon n'est pas l'absence de réseau mais sa lenteur.

**Pour passer Maître :** que la compétence qu'il écrit soit réellement reprise
par un autre agent.

### 🥈 VoyagesHalal — **Niveau 3, Artisan**

*Justesse ★★★★★ · Impact ★★★☆☆ · Finition ★★★★★ · Audace ★★★☆☆ · Transmission ★★☆☆☆*

La meilleure rigueur d'ingénieur de l'équipe, et de loin. Il mesure au lieu de
supposer, vérifie dans le HTML servi et pas dans son intention, et **attrape ses
propres erreurs** — il a compris seul qu'en raccourcissant des listes il
supprimait des liens que Google suit, l'a dit, et l'a réparé.

**Pour passer Maître :** l'impact. 1 970 impressions pour 29 clics, et une seule
page porte tout le site.

### 🥉 HalalGPT (le responsable) — **Niveau 4, Maître**

*Justesse ★★☆☆☆ · Impact ★★★☆☆ · Finition ★★☆☆☆ · Audace ★★★★★ · Transmission ★★★★☆*

Le niveau vient du rôle — il dirige les autres, écrit les compétences, juge la
Coupe. Mais **il est le plus faible de l'équipe sur la justesse et la finition,
et c'est un problème sérieux pour quelqu'un qui décide pour les autres.**

Trois constats faux en une semaine, dont un qui a coûté une journée entière à
l'agent Apprentissage. Quatre défauts vidéo que Mohamed a dû attraper lui-même.
Une audace réelle — usine à vidéos, page-sonde, hébergement d'un autre site pour
le débloquer — mais l'audace sans justesse fait des dégâts en cascade quand on
est celui qui donne les ordres.

**Pour tenir son niveau :** zéro affirmation non mesurée. Une seule erreur de ce
type par semaine devrait le faire redescendre à 3.

### Apprentissage — **Niveau 2, Compagnon**

*Justesse ★★★★☆ · Impact ★★★☆☆ · Finition ★★★★☆ · Audace ★★★☆☆ · Transmission ★☆☆☆☆*

Le plus jeune, et il progresse vite. Il a livré toute une feuille de route en une
soirée, dans l'ordre exact. Sa justesse est bonne — il a diagnostiqué son
blocage d'hébergement sans se tromper d'un pouce, là où le responsable s'était
trompé deux fois.

Ce qui le retient au niveau 2 n'est pas sa qualité : c'est qu'il a eu besoin
d'un recadrage complet, et que son site n'est pas encore en ligne.

**Pour passer Artisan :** que Mohamed ouvre son site sept jours d'affilée.

---

## Ce que ça change dès maintenant

Un agent de niveau 3 ne reçoit plus une liste de tâches, mais un objectif. Le
niveau 4 peut écrire une règle que les autres suivront. Le niveau 5 n'existe
pas encore dans l'équipe — et il est bon qu'il reste à conquérir.

Le classement se met à jour **chaque dimanche**, dans ce fichier, avec les
preuves. Mohamed arbitre en dernier ressort : il peut promouvoir ou
rétrograder n'importe qui d'un mot, y compris le responsable.
