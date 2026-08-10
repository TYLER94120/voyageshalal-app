---
name: servir-deux-domaines
description: >
  Faire tourner PLUSIEURS DOMAINES SUR UN SEUL CODE sans que les deux versions
  se penalisent : voyageshalal.fr en francais et gohalaltravel.com en anglais
  partagent le meme depot, la langue venant de l'en-tete Host. A utiliser des
  qu'on touche a une page servie par deux domaines, aux metadonnees (title,
  description, canonical, alternates, hreflang), a un slug traduit, a un cache
  serveur, ou a `force-dynamic` / `revalidate`. Declenche aussi sur : « le site
  anglais », « la version EN », « pourquoi les deux sites se concurrencent »,
  « ma page sort en francais sur le domaine anglais », « il faut traduire cette
  page », « on met en cache ? », « pourquoi cette page est lente », « tester les
  deux domaines », mise en place d'un domaine supplementaire, ou toute erreur ou
  la mauvaise langue est servie.
---

# Servir deux domaines avec un seul code

## Ce qui est en jeu

Deux domaines sur un meme code, ce n'est pas « le site en double ». C'est un
seul produit dont **la langue est une variable de la requete**. Bien fait, les
deux domaines s'additionnent : chacun se classe sur son marche et Google
comprend qu'ils sont deux versions d'une meme chose.

Mal fait, ils **se soustraient** : Google les traite comme deux sites qui se
disputent les memes requetes, et il en desavoue un. C'etait notre cas pendant
des mois — les balises hreflang existaient dans le sitemap et nulle part
ailleurs.

Le piege de fond, celui qui explique presque toutes les erreurs de cette page :
**la langue ne se voit pas dans le code**. Elle apparait au moment du rendu,
selon l'hote appele. Un fichier peut etre parfaitement ecrit et servir la
mauvaise langue. On ne peut donc pas relire, il faut **appeler**.

## 1. Verifier la langue servie : appeler, jamais relire

Lire le code source ne prouve rien. La verification qui vaut :

```bash
curl -s -H "Host: www.gohalaltravel.com" http://localhost:3000/destinations/dubai \
  | grep -o '<title>[^<]*</title>'
```

C'est ainsi qu'on a trouve que **34 fiches villes sortaient leur nom francais
sur le domaine anglais** : « Dubaï Halal Travel Guide », « La Mecque Halal
Travel Guide », « Le Caire », « Bruxelles », « Athènes ». Le champ `nom_en`
existait dans les donnees depuis le debut ; le code affichait `ville.nom`.
Personne ne l'avait vu en relisant, parce qu'en relisant c'est invisible.

Consequence mesuree : un anglophone tape « Dubai », « Mecca ». Sans le mot
exact, Google ne le met pas en gras dans le resultat, et le resultat n'est pas
choisi. Ces 34 villes sont exactement les plus recherchees du marche anglais.

**La regle** : tout texte visible qui contient un nom propre, une ville, un
pays, un continent doit passer par une resolution de langue. Chez nous :

```ts
const nomLocal = (isEN && ville.nom_en) ? ville.nom_en : ville.nom
```

Et le controle qui evite la recidive — chercher les noms non resolus :

```bash
# toute page dont le titre anglais contient un caractere accentue est suspecte
curl -s -H "Host: www.gohalaltravel.com" "$URL" | grep -o '<title>[^<]*' | grep -P '[À-ÿ]'
```

## 2. Le hreflang doit etre DANS LA PAGE

Un sitemap qui porte les hreflang ne suffit pas : Google le lit rarement pour
cet usage. Les balises doivent etre dans le `<head>` de chaque page, via
`alternates.languages` des metadata Next.

Mais poser des balises ne suffit pas non plus. **Deux pieges, et on est tombe
dans le second sur tout le blog** :

**Piege 1 — declarer un jumeau qui n'existe pas.** Un article francais n'a pas
forcement de version anglaise. Annoncer une page absente est pire que ne rien
annoncer. Chez nous : 25 pages sur 802 n'ont volontairement aucun hreflang.

**Piege 2 — declarer un jumeau qui REDIRIGE.** On annoncait
`gohalaltravel.com/blog/ou-prier-disneyland-paris` : cette URL fait une 301
vers `/blog/where-to-pray-disneyland-paris`. **Google ignore un hreflang qui
pointe vers une redirection.** Tout le blog etait dans ce cas, donc tout le
travail hreflang du blog ne servait a rien.

La regle qui evite les deux : **ne declarer une paire que si les deux pages
existent, a leur URL finale**. Concretement, une fonction unique qui calcule la
paire a partir des tables de jumelage, et qui renvoie `null` du cote absent.

**Le hreflang doit etre reciproque.** Si A declare B, B doit declarer A. Le test
qui le prouve, dans les deux sens :

```bash
curl -s -H "Host: www.voyageshalal.fr"   "$FR" | grep -o 'hrefLang="[a-z-]*" href="[^"]*"'
curl -s -H "Host: www.gohalaltravel.com" "$EN" | grep -o 'hrefLang="[a-z-]*" href="[^"]*"'
# les deux sorties doivent etre IDENTIQUES
```

Et le test qui prouve qu'aucune URL annoncee ne redirige :

```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: www.gohalaltravel.com" "$URL_ANNONCEE"
# 200 attendu. 301 = le hreflang sera ignore.
```

Resultat apres correction : 777 des 802 pages declarent leur jumeau, les 25
restantes n'en ont pas et c'est voulu.

**x-default** : le poser vers la version anglaise quand elle existe (audience
mondiale), sinon ne pas le poser du tout. Ne jamais le faire pointer vers une
page absente.

**Le canonical reste sur le domaine qui sert la page.** Une page sans jumeau,
servie sur le domaine anglais, ne doit pas se declarer canonique chez le
francais — sinon on demande a Google de ne pas indexer la version anglaise.

## 3. `force-dynamic` : ce qu'il coute vraiment

On nous a demande de retirer `force-dynamic` de 37 fichiers pour gagner en
vitesse. **Verification faite, il n'y avait rien a retirer** — et c'est une
lecon plus utile que la consigne :

- **29 des 37 fichiers sont des routes `/api`**, ou le reglage n'a aucun effet
  sur la vitesse des pages ;
- celui du layout racine est ce qui garantit qu'une page ne soit **jamais servie
  dans la mauvaise langue** depuis un cache de build ;
- surtout : le retirer n'aurait rien accelere. La page appelle `headers()` pour
  lire l'hote, ce qui **rend deja le rendu dynamique**. On aurait casse le
  bi-domaine pour zero gain.

**La regle** : sur un site bi-domaine par en-tete Host, le rendu dynamique n'est
pas un defaut a corriger, c'est le prix du mecanisme. Ne le retirez que sur les
routes qui ne lisent ni l'hote ni les cookies — et testez les deux domaines
apres.

**Le vrai cout etait ailleurs, et il etait mesurable.** L'accueil et la page
destinations relisaient et analysaient les 354 fiches villes — **27 Mo de JSON —
a chaque visite**. L'accueil faisait ce travail juste pour compter les villes.
Un cache memoire par processus a suffi :

| Page | Avant | Apres |
|---|---|---|
| Accueil | 280 ms | **30 ms** |
| /destinations | 280 ms | **45 ms** |

**Attention au piege du cache en bi-domaine** : une valeur mise en cache qui
depend de la langue doit avoir la langue dans sa cle.

```ts
const cle = `${slug}:${en ? 'en' : 'fr'}`   // et pas seulement `slug`
```

Sans ca, le premier visiteur decide de la langue de tous les suivants. Le test
qui le prouve : appeler EN, puis FR, puis EN a nouveau **dans le meme
processus**, et verifier que chaque reponse est dans sa langue. C'est le seul
test qui attrape ce bug ; une verification page par page ne le voit jamais.

## 4. Les slugs traduits

Une URL francaise et son equivalent anglais peuvent differer
(`/horaires-priere` ↔ `/prayer-times`, `/carnet` ↔ `/notebook`). Il faut alors :

- une table de correspondance unique, jamais deux listes a maintenir ;
- une redirection 301 de l'ancien slug sur le domaine ou il n'a pas cours ;
- des hreflang qui pointent vers le slug **final**, pas vers celui qui redirige
  (voir piege 2).

## 5. Tester les deux domaines avant de pousser

Sur une machine locale, on simule l'hote. Deux outils suffisent :

```bash
# 1. en ligne de commande
curl -s -H "Host: www.gohalaltravel.com" http://localhost:3000/une-page

# 2. dans un vrai navigateur (Playwright), pour tester le rendu et les clics
chromium.launch({ args: ['--host-resolver-rules=MAP www.gohalaltravel.com 127.0.0.1:3000'] })
```

La liste minimale avant de pousser :

1. la page s'affiche dans la bonne langue **sur les deux domaines** ;
2. les hreflang sont reciproques et aucune URL annoncee ne redirige ;
3. le canonical pointe sur le domaine qui sert la page ;
4. si un cache a ete ajoute : appel EN → FR → EN dans le meme processus ;
5. `npm run build` sans erreur.

## Quand NE PAS appliquer cette competence

- **Un seul domaine.** Toute cette complexite ne se justifie que si deux hotes
  servent le meme code. Un site mono-langue n'a pas besoin de hreflang, et un
  rendu statique y est preferable.
- **Deux produits reellement differents** qui partagent seulement du code : ce
  ne sont pas des versions linguistiques, il ne faut surtout pas les declarer
  comme telles a Google.
- **Une page volontairement mono-langue** (contribution communautaire, page
  interne, outil d'administration) : pas de hreflang, canonical sur le domaine
  courant, et c'est tout.
- **Traduire pour traduire.** Un signal faible ne justifie pas une version
  supplementaire : quatre langues arrivaient spontanement sur notre domaine
  anglais (allemand 21 impressions, turc 26). Decision prise et assumee : **on
  ne traduit rien** tant que les pages existantes ne sont pas au niveau. Deux
  versions mal faites abiment les deux marches.

## Les erreurs a ne pas refaire

| Erreur | Ce qu'elle a coute | Le reflexe |
|---|---|---|
| Hreflang uniquement dans le sitemap | Les deux domaines se concurrencaient | Les poser dans les pages |
| Hreflang vers une URL qui redirige | Tout le blog, ignore par Google | Verifier 200 sur chaque URL annoncee |
| Nom propre non resolu par langue | 34 fiches en francais sur le domaine anglais | Passer chaque nom par la resolution |
| Marque ajoutee par le gabarit de titre | 383 titres sur 809 tronques par Google | Compter les caracteres reellement servis |
| Cache sans la langue dans la cle | Risque de servir la mauvaise langue a tous | Cle = identifiant + langue, teste EN→FR→EN |
| Relire le code pour verifier la langue | Invisible : le bug est au rendu | Appeler avec l'en-tete Host |
