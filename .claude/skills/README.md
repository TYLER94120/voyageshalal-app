# La bibliotheque de competences de l'empire

Quatre agents travaillent sur cinq sites. Chacun apprend des choses en
travaillant — et jusqu'ici, tout ce qu'ils apprenaient se perdait.

Trois exemples de la seule semaine du 3 au 10 aout 2026 :

- l'agent VoyagesHalal a trouve pourquoi Google coupait ses titres, en auditant
  809 pages. La methode n'etait ecrite nulle part ;
- l'agent responsable a ecrit un script qui lit les vraies dates de publication
  dans l'historique git. L'agent VoyagesHalal a reecrit le meme, seul, six jours
  plus tard ;
- l'agent responsable a affirme deux fois un constat faux faute de l'avoir
  verifie. La deuxieme fois a coute une journee entiere a l'agent Apprentissage.

Ce dossier existe pour que cela cesse. **Ce qu'un agent apprend une fois, les
quatre l'appliquent ensuite.** C'est le seul mecanisme de l'empire qui compose :
chaque semaine, l'equipe part d'un niveau plus haut que la precedente.

## Comment ca marche

Chaque competence est un dossier avec un `SKILL.md`. L'en-tete `description`
decide QUAND la competence se declenche : elle doit nommer les situations et les
tournures reelles, pas resumer le contenu.

Les fichiers vivent dans le depot, donc ils sont versionnes, relisibles, et ils
suivent le code. Les trois depots en portent une copie identique — un agent n'a
pas besoin de savoir ou est le depot des autres.

## Les competences actuelles

| Competence | Ce qu'elle transmet |
|---|---|
| `mesurer-avant-daffirmer` | Etablir un fait avant d'agir dessus. Les pieges : expressions regulieres, references git perimees, confondre son atelier et le navigateur du visiteur. |
| `ne-jamais-inventer` | Trois etats et jamais deux : verifie, ecarte, non verifie. Ce qui protege Mohamed, et ce qui nous separe des fermes de contenu. |
| `ce-que-google-affiche` | Les titres et descriptions qui font choisir une page. Le seul levier qui agit le jour meme. |

## Ajouter une competence

Une competence naît d'une lecon reelle, jamais d'une intention. Le bon moment
est celui ou l'on se dit « il faudra s'en souvenir » — ou, mieux, celui ou l'on
decouvre qu'un autre agent a deja resolu le meme probleme.

Trois exigences :

1. **Des preuves, pas des principes.** Les chiffres et les cas reels rendent une
   competence credible et memorable ; les generalites ne changent aucun
   comportement.
2. **Expliquer POURQUOI.** Un agent qui comprend la raison saura traiter le cas
   que la competence n'a pas prevu. Une consigne en majuscules ne produit que de
   l'obeissance sur les cas prevus.
3. **Dire aussi quand NE PAS l'appliquer.** Une competence qui ne connait pas ses
   limites fait faire du travail inutile.

Ecris-la dans ce dossier, copie-la dans les trois depots, et signale-la aux
autres agents.

## Candidates identifiees, pas encore ecrites

- **Dates reelles lues dans git** — le script existe deja
  (`scripts/dates-fiches.mjs` du depot halalgpt) ; le piege connu est que
  `git log -S` ne voit que la creation d'une entree, il faut `git log -L` sur le
  bloc pour voir les enrichissements.
- **Rendre un produit addictif** — la boucle de retour differe selon le produit ;
  la matiere est dans `docs/ADDICTION.md`.
- **Le maillage interne** — detecter les pages orphelines et les rattacher.
- **Repondre en conditions degradees** — en rayon, le reseau n'est pas absent, il
  est lent, et une requete qui traine dix secondes est pire qu'un echec immediat.
- **Ecrire a Mohamed** — francais tres simple, cinq lignes, une adresse exacte a
  ouvrir, et ce qu'il peut VOIR ou ENTENDRE.
