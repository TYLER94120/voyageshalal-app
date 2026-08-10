---
name: mesurer-avant-daffirmer
description: >
  Methode de l'empire pour etablir un fait avant d'agir dessus. A utiliser DES
  QU'UNE AFFIRMATION VA DECLENCHER DU TRAVAIL : « il manque X », « le probleme
  vient de Y », « cette page est mal referencee », « le site est lent », « il n'y
  a pas de Z », « personne ne clique parce que... ». Declenche aussi sur : audit,
  diagnostic, « pourquoi ca ne marche pas », « je pense que », « ca doit venir
  de », avant de reecrire des titres, avant de corriger un defaut suppose, et
  avant tout rapport a Mohamed contenant un chiffre. Si tu t'apprentes a ecrire
  « il n'y a aucun... » ou « le probleme est... », lis cette skill d'abord.
---

# Mesurer avant d'affirmer

## Pourquoi cette skill existe

Trois evenements reels, dans la meme semaine d'aout 2026 :

- L'agent responsable a lance un `grep` pour compter les donnees structurees des
  trois sites. Le motif etait `application/ld+json` en expression reguliere, ou
  `+` signifie « une ou plusieurs fois le caractere precedent ». Il cherchait
  donc `ldjson`, `lddjson`, `ldddjson` — jamais `ld+json`. Resultat : **zero**
  partout. Il a commence a annoncer a Mohamed que le site n'avait aucune donnee
  structuree. Le site en avait depuis le debut.

- Le meme jour, il a conclu que le commit d'un autre agent avait ete ecrase. Sa
  reference locale de suivi etait simplement perimee — `git fetch origin
  <branche>` sans refspec n'ecrit que `FETCH_HEAD`, pas `origin/<branche>`. Rien
  n'avait ete ecrase.

- Il a ensuite suppose que le mauvais taux de clic de gohalaltravel.com venait de
  titres traduits du francais. Faux. L'agent VoyagesHalal, lui, a **audite 809
  pages** et trouve la vraie cause en une heure : un suffixe de marque ajoute par
  le gabarit coutait 15 a 19 caracteres sur une limite d'environ 60, et **383
  pages sur 809** etaient tronquees par Google.

Une supposition coute une nuit de travail sur le mauvais probleme. Une mesure
coute dix minutes. C'est tout l'ecart entre les deux facons de travailler, et
c'est ce qui a fait la difference au classement de la Coupe.

## La regle

**Un chiffre, ou l'aveu qu'on ne sait pas.** Jamais de « il semble que »
transforme en decision.

Avant d'ecrire qu'une chose manque, est cassee ou mal faite, produis la mesure
qui l'etablit : combien, sur combien, mesure comment. Si tu ne peux pas
mesurer — parce que l'acces reseau est ferme, parce que la donnee est chez
Google — dis-le explicitement au lieu de combler le trou par une hypothese.

## Comment mesurer, selon ce qu'on cherche

**Ce qu'une page sert vraiment** — jamais ce que le code a l'air de produire.
Le rendu peut dependre du domaine, d'un gabarit, d'un cache. Va chercher la page
telle qu'elle est livree :

```bash
curl -s https://exemple.fr/page | grep -oE '<title>[^<]*' | head -1
curl -s https://exemple.fr/page | grep -o 'name="description"[^>]*'
```

Et compte : un titre de plus de 60 caracteres est coupe par Google. Le compter
vaut mieux que le regarder.

**Une absence dans le code** — le piege est l'expression reguliere. `+`, `?`,
`|`, `.`, `(` ont un sens special. Un motif qui rend zero se recoupe avant de
devenir un constat :

```bash
grep -rlF 'application/ld+json' .    # -F : chaine exacte, aucun caractere special
grep -rlE 'application/ld\+json' .   # ou alors on echappe
```

Regle pratique : **quand un comptage rend zero, soupconne d'abord le comptage.**
Un vrai zero se confirme par une seconde methode differente.

**L'etat d'un depot** — une reference locale peut etre perimee :

```bash
git ls-remote origin <branche>        # la verite du serveur
git fetch origin '+refs/heads/<b>:refs/remotes/origin/<b>'   # met a jour le suivi
```

**Une performance** — chronometre, ne devine pas. `time`, l'onglet reseau, une
mesure avant et une apres.

## Le piege le plus couteux : confondre son atelier et le monde

L'environnement des agents a une sortie reseau filtree. Beaucoup d'hebergeurs y
repondent 403. **Cela ne dit rien de ce que le site publie peut faire** : c'est
le navigateur du visiteur qui va chercher les fichiers, et lui n'a aucun filtre.

Cette confusion a coute une journee entiere a l'agent Apprentissage : on lui a
fait ranger la recitation coranique comme « impossible » alors qu'elle etait
parfaitement joignable depuis un telephone.

Avant de conclure « c'est impossible », demande-toi : **impossible pour qui ?
Pour moi, ou pour l'utilisateur final ?** Ce n'est presque jamais la meme chose.

## Comment l'ecrire ensuite

Une mesure s'ecrit avec son chiffre, son perimetre et sa methode. Comparons :

- Faible : « les titres sont trop longs, ca doit nuire au referencement »
- Juste : « 383 pages sur 809 depassent 60 caracteres, mesure sur les titres
  reellement servis par les deux domaines. Cause : le suffixe de marque du
  gabarit, 15 a 19 caracteres. »

La seconde permet a quelqu'un d'autre de verifier, de contredire, et de savoir
quand le probleme est resolu. La premiere ne permet rien.

Et quand la mesure est inconfortable, elle se dit quand meme. L'agent
VoyagesHalal a ecrit noir sur blanc que ses 222 hotels n'avaient aucune
information sur l'alcool — donc qu'il ne pouvait pas remplir la page comme
demande. C'est ce constat honnete qui a produit la bonne livraison : la distance
a pied de la mosquee, qui etait vraie et verifiable.

## Ce que tu fais quand tu ne peux pas mesurer

Tu le dis, et tu proposes qui peut le faire. « Je ne peux pas verifier depuis
l'atelier, la sortie reseau est fermee — la page halalgpt.fr/labo-son fait la
sonde depuis le navigateur de Mohamed. » Une limite annoncee vaut infiniment
mieux qu'un fait invente, et elle ouvre souvent la solution.
