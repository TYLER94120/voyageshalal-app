---
name: ne-jamais-inventer
description: >
  La regle qui protege Mohamed et qui separe l'empire des fermes de contenu :
  on n'affirme jamais ce qu'on n'a pas verifie. A utiliser DES QU'ON S'APPRETE A
  PUBLIER UN FAIT sur un produit, un lieu, un etablissement ou une source
  religieuse : composition d'un aliment, certification halal, salle de priere,
  restaurant, hotel et ses equipements, horaires, prix, verset, hadith, avis
  d'un savant, date de mise a jour. Declenche aussi sur : « je vais completer la
  fiche », « il manque des donnees », « on met quoi dans cette colonne »,
  « comment remplir cette page », enrichissement de base, import de donnees, et
  toute page ou l'on hesite entre ecrire une supposition et laisser un vide.
---

# Ne jamais inventer

## Ce qui est en jeu

Les sites de l'empire repondent a des gens qui prennent des decisions reelles :
manger ou reposer un produit, emmener sa famille dans un restaurant, reserver un
hotel sans alcool, prier dans un lieu public. Une information fausse ne produit
pas une mauvaise note d'experience utilisateur : elle fait manger du haram a
quelqu'un qui nous a fait confiance.

Et juridiquement, l'editeur c'est Mohamed. Son nom, son domaine, sa
responsabilite. Ce qui le protege n'est pas l'auteur du texte — c'est **la
qualite de ce qui est affirme.**

## La regle : trois etats, jamais deux

La faute la plus frequente n'est pas de mentir, c'est de **binariser**. On a
« halal » et « pas halal », alors il faut bien ranger le produit inconnu quelque
part — et on devine.

Il manque toujours le troisieme etat :

| Etat | Quand | Ce qu'on ecrit |
|---|---|---|
| **Verifie** | source solide et citee | l'information, avec sa source |
| **Ecarte** | on sait que non | l'information, avec sa raison |
| **Non verifie** | on ne sait pas | « information non verifiee » |

Le troisieme n'est pas un echec, c'est une information. L'agent HalalCheck l'a
applique a la lettre sur les alternatives de produits : tout candidat sans liste
d'ingredients est ecarte, et l'ecran distingue explicitement « ce produit est
verifie » de « aucun ingredient a risque detecte par l'analyse ». Deux phrases
differentes pour deux niveaux de certitude differents.

## Ce qu'on n'invente sous aucun pretexte

- une **certification** halal, ni son organisme, ni sa validite ;
- la **composition** d'un produit, l'origine d'un additif, un ingredient qu'on ne
  voit pas sur l'etiquette ;
- une **salle de priere**, un restaurant, une adresse, des horaires ;
- un **equipement d'hotel** : bar sans alcool, petit-dejeuner halal, piscine non
  mixte, tapis de priere en chambre ;
- une **reference religieuse** : numero de verset, recueil de hadith, avis
  attribue a un savant ou a une ecole ;
- une **date de mise a jour**. Une fausse date est une fausse promesse faite au
  lecteur autant qu'a Google. Elles se lisent dans l'historique git, jamais
  ailleurs.

Et jamais le mot **« certifie »** sur quelque chose qui ne l'est pas
formellement. « Halal-friendly », « sans alcool annonce », « non certifie » sont
des mots honnetes ; « certifie » engage quelqu'un d'autre.

## Le trou dans les donnees est un sujet, pas un obstacle

Le meilleur exemple de la semaine. On demande a l'agent VoyagesHalal des pages
d'hotels sans alcool pour Istanbul et Dubai, avec sept criteres. Il mesure, et
constate que ses 222 hotels ne portent que le nom et les coordonnees : rien sur
l'alcool, rien sur la restauration, rien sur la piscine. La seule source verifiee
du depot couvre quatre etablissements, tous ailleurs.

Trois reactions possibles :

1. remplir avec du plausible → **interdit**, et c'est ce que font les fermes de
   contenu ;
2. ne rien livrer → la demande reste sans reponse ;
3. **livrer ce qui est vrai, et construire de quoi obtenir le reste.**

Il a choisi la troisieme : la distance a pied de la mosquee la plus proche,
calculee sur les donnees du depot pour les 222 hotels — a Istanbul, tous a
3 minutes au plus, mediane 2 minutes. Un fait exact, verifiable, que personne
d'autre ne publie. Et en parallele, un script et un declencheur automatique pour
aller chercher chez OpenStreetMap les etiquettes `alcohol` et `diet:halal`
reellement posees.

**Un manque de donnees ne se comble pas, il se travaille.** Et souvent il revele
l'avantage qu'on ne voyait pas.

## Le cas particulier du religieux

Sur une question de religion, deux choses s'ajoutent :

- **Jamais de fatwa personnelle.** On presente les avis repandus, on signale les
  divergences quand elles existent, et on oriente vers un savant pour une
  situation particuliere. La difference est simple : un principe general
  s'explique, un cas personnel ne se tranche pas.
- **Une source qu'on ne peut pas citer exactement ne se cite pas.** Mieux vaut
  « les savants retiennent que… » que d'attribuer un numero de hadith de memoire.
  Un numero faux discredite tout le reste de la page.

## Le test avant de publier

Trois questions, dans cet ordre :

1. **D'ou vient cette information ?** Si la reponse est « ca me semble logique »,
   ce n'est pas une source.
2. **Est-ce que je la mettrais devant la personne concernee ?** Le gerant du
   restaurant, le fabricant du produit, l'imam de la mosquee.
3. **Si elle est fausse, qu'arrive-t-il a quelqu'un ?** Cette question-la decide
   du reste.

Ecrire ce qu'on ignore demande plus de courage que de remplir un tableau. C'est
pourtant exactement ce sur quoi la confiance se construit — et la confiance est
le seul actif que ces sites possedent vraiment.
