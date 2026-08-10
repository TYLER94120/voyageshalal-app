---
name: ce-que-google-affiche
description: >
  Ecrire les titres et descriptions qui font CHOISIR une page dans les resultats
  Google — le seul levier de referencement qui agit le jour meme, sur les
  impressions deja acquises. A utiliser des qu'on touche a un <title>, une
  <meta name="description">, un objet `metadata` de Next.js, un gabarit de titre,
  ou qu'on cree une page destinee a etre trouvee. Declenche aussi sur : « taux de
  clic », CTR, « personne ne clique », « on a des impressions mais pas de
  visites », Search Console, « ameliorer le referencement », « optimiser les
  titres », « la page ne ressort pas », et avant toute publication d'une nouvelle
  page ou d'un nouveau guide.
---

# Ce que Google affiche

## Le probleme que cette skill resout

Chiffres mesures sur l'empire, une semaine d'aout 2026 :

| | Impressions | Clics | Taux de clic |
|---|---|---|---|
| voyageshalal.fr | 1 970 | 29 | 1,5 % |
| gohalaltravel.com | 441 | 3 | **0,7 %** |
| halalgpt.fr | 88 | 3 | 3,4 % |
| **Total** | **2 499** | **35** | **1,4 %** |

Google montrait deja ces sites 2 500 fois par semaine. Trente-cinq personnes
cliquaient.

Le probleme n'etait donc pas d'etre vu, mais **d'etre choisi**. Et c'est une
bonne nouvelle : gagner en visibilite prend des mois, alors que ce que Google
AFFICHE de nous — un titre et deux lignes — se corrige aujourd'hui et agit
immediatement sur des impressions deja gagnees.

## La cause la plus frequente, et elle est invisible dans le code

Sur gohalaltravel.com, l'audit des 809 pages a trouve trois causes chiffrees.
La principale n'etait ecrite nulle part dans les pages :

**Le gabarit ajoutait ` | GoHalalTravel` a la fin de chaque titre.** Quinze a
dix-neuf caracteres, sur une limite d'environ soixante. **383 pages sur 809**
etaient coupees par Google, qui tranchait au milieu de l'information utile :

- Avant : `Halal Hotels in Dubai 2026: Alcohol-Free | GoHalalTravel` → coupe
- Apres : `Halal Hotels in Dubai 2026: Alcohol-Free` → entier

En Next.js, ce suffixe vient de `title.template` dans le `layout`. On ne le voit
pas en lisant la page : il faut regarder le titre **reellement servi**.

Deux autres causes trouvees au meme endroit, qui se reproduisent partout :

- **Le nom de ville reste dans la mauvaise langue.** 34 fiches sortaient « Dubaï
  Halal Travel Guide » ou « La Mecque Halal Travel Guide » sur le domaine
  anglais. Un anglophone tape « Dubai », « Mecca » : sans le mot exact, Google ne
  le met pas en gras et le resultat n'est pas choisi.
- **La description annonce un chiffre faux** (« 40+ adresses » sur une page qui
  en compte douze). Le lecteur qui clique et ne trouve pas repart : Google
  l'apprend.

## Les regles qui deplacent vraiment le taux de clic

**Le titre — moins de 60 caracteres, compte-les.**

- Les mots exacts de la requete **en debut** : Google les met en gras, l'oeil les
  attrape avant tout le reste.
- Du concret, un nombre : « 12 salles de priere a Disneyland » bat « ou prier a
  Disneyland ». Un nombre promet un contenu reel.
- L'annee sur ce qui vieillit : « 2026 » rassure sur la fraicheur.
- **La marque n'est pas dans le titre.** Elle mange des caracteres et n'apporte
  rien a quelqu'un qui ne la connait pas encore.
- Jamais la reponse entiere dans le titre : il doit rester une raison de cliquer.

**La description — 150 a 160 caracteres.** Elle dit ce que la page **contient**,
pas ce qu'elle promet : « adresses verifiees, horaires, plan d'acces, distance a
pied de la mosquee » bat « le guide complet pour voyager sereinement ». Elle
reprend les mots de la requete, qui seront mis en gras eux aussi.

**En anglais : ecrire comme un anglophone CHERCHE, pas comme on traduit.** Le
francais dit « ou prier a Disneyland », l'anglais tape « prayer room Disneyland
Paris ». Ce n'est pas la meme phrase, et la traduction litterale rate la requete.

Cas reel : la requete numero un de gohalaltravel.com est
`non alcoholic hotels dubai`. Pas « halal », pas « muslim-friendly ».
**Alcohol-free.** C'est le mot du lecteur qui compte, pas le notre.

## La methode, dans l'ordre

1. **Mesurer d'abord** (voir la skill `mesurer-avant-daffirmer`). Releve les
   titres et descriptions REELLEMENT servis, pas ceux du code source — le rendu
   peut dependre du domaine ou d'un gabarit :
   ```bash
   curl -s https://exemple.fr/page | grep -oE '<title>[^<]*'
   ```
   Compte les caracteres. Liste combien de pages depassent.
2. **Chercher les requetes reelles** dans la Search Console, onglet Requetes.
   Les mots des visiteurs valent mieux que les notres.
3. **Corriger d'abord les pages qui ont deja des impressions.** Une page a zero
   impression ne gagne rien a un beau titre : elle n'a personne a convaincre.
   L'ordre est toujours : le volume d'abord.
4. **Noter la date de la correction.** Google met sept a dix jours a rafraichir
   ses affichages. Sans cette date, on rejuge son propre travail sur des chiffres
   d'avant, et on corrige ce qui etait deja repare.

## Quand ne PAS faire ce travail

Une page a 88 impressions n'a pas un probleme de titre, elle a un probleme de
visibilite : elle sort trop bas pour que quiconque la voie. Un beau titre a la
position 22 reste invisible. Dans ce cas le levier est ailleurs — des liens
entrants, de la profondeur, du temps.

Savoir que ce chantier ne sert a rien ici est aussi utile que savoir le mener
ailleurs.
