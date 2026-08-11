---
name: repondre-en-conditions-degradees
description: >
  Concevoir un produit qui repond QUAND MEME quand le reseau est mauvais — le
  cas normal en rayon de supermarche, en sous-sol, en voyage, a l'etranger. A
  utiliser des qu'on ecrit un appel reseau destine a un telephone : fetch, appel
  d'API, chargement d'une fiche produit, recherche, service worker, mode hors
  ligne, cache local, localStorage, chargement d'une bibliotheque depuis un CDN,
  balise script ou import() dynamique. Declenche aussi sur : « ca rame », « ca
  tourne dans le vide », « l'ecran de chargement reste bloque », « ca marche chez
  moi », « et si l'utilisateur n'a pas de reseau », « hors connexion »,
  « offline », « en magasin », « en 3G », « a l'etranger », « ca met dix
  secondes », delai d'attente, timeout, AbortController, PWA, ecran de
  chargement, message d'erreur reseau. Si tu ecris une attente reseau sans delai
  maximum — `await fetch(...)`, mais aussi un `<script>` distant ou un `import()`
  — lis cette skill d'abord.
---

# Repondre en conditions degradees

## La lecon, en une phrase

**Le reseau n'est presque jamais absent : il est lent.** Et une requete qui
traine dix secondes est pire qu'un echec immediat, parce que pendant ces dix
secondes le produit n'a rien affiche, rien explique, et l'utilisateur a conclu
qu'il etait casse.

## D'ou elle vient

Mohamed a demande a HalalCheck de fonctionner « sans reseau ». Le premier
reflexe aurait ete de detecter l'absence de connexion et d'afficher un ecran
hors ligne. C'est faux, et c'est le piege central de cette skill.

La scene reelle : quelqu'un est debout dans un rayon, un paquet de biscuits a la
main, en sous-sol ou au fond d'un hypermarche. Son telephone affiche une barre de
reseau. Il **est** connecte. Simplement, la requete vers Open Food Facts va
mettre huit secondes, ou quinze, ou ne jamais revenir.

`navigator.onLine === false` ne voit rien de tout cela. Il ne detecte que le
mode avion et la perte totale d'interface reseau — le cas le plus rare des
trois.

## Trois etats, jamais deux

Le meme travers que dans `ne-jamais-inventer` : on binarise « en ligne / hors
ligne » et on rate le cas majoritaire.

| Etat | Comment on le detecte | Ce qu'on fait |
|---|---|---|
| **En ligne** | la requete revient sous le delai | on affiche la reponse fraiche |
| **Lent** | le delai expire avant la reponse | **on abandonne et on repond avec ce qu'on sait deja** |
| **Coupe** | `navigator.onLine === false` | on ne tente meme pas la requete |

Le troisieme etat sert a economiser une attente inutile, pas a decider du
comportement. C'est le deuxieme qui compte, et c'est celui que tout le monde
oublie.

## Le point technique que personne ne sait

**`fetch` n'a aucun delai maximum.** Aucun. Sans intervention, il attend le
delai du systeme — de trente secondes a plusieurs minutes selon le navigateur et
l'OS. Un `await fetch(...)` nu, sur un telephone en rayon, c'est un ecran de
chargement qui tourne une demi-minute.

Le remede tient en dix lignes :

```js
const DELAI_RESEAU = 4000;

async function fetchCourt(url, options) {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), DELAI_RESEAU);
  try {
    return await fetch(url, Object.assign({}, options, { signal: controleur.signal }));
  } finally {
    clearTimeout(minuteur);
  }
}
```

Le `finally` n'est pas cosmetique : sans lui, chaque appel reussi laisse un
minuteur actif jusqu'a son terme. Sur un scan enchaine, ils s'empilent.

## Un seul `fetch` oublie annule toute la protection

C'est la partie de cette skill qui a ete apprise en l'ecrivant, et elle vaut
plus que le reste.

HalalCheck avait deja `DELAI_RESEAU = 4000` et `fetchCourt`. Tout semblait
protege. En listant les appels reseau du fichier pour rediger cette skill —
`grep -n "fetch(" scan.html` — trois `fetch` nus sont apparus. Dont celui-ci,
sur le chemin le plus critique du produit :

```js
const verifsPretes = (async () => {
  const [rv, rl] = await Promise.all([
    fetch("./verifications.json", { cache: "no-store" }),   // sans delai maximum
    fetch("./produits-locaux.json", { cache: "no-store" }),
  ]);
  ...
})();

async function traiterCode(code) {
  await verifsPretes;          // <- CHAQUE scan attend cette promesse
  const enCache = lireCacheProduit(code);
  if (enCache) { afficherResultat(enCache, verif); return; }   // « instantane »
```

Le cache repondait bien en quelques millisecondes — mais **derriere une attente
reseau sans limite**. La promesse « verdict immediat, meme hors reseau » etait
donc fausse des que le reseau devenait lent, et fausse precisement dans la
situation pour laquelle elle avait ete construite.

Mesure, avec les deux fichiers de base retardes de 20 secondes, verdict d'un
produit deja connu :

| | Temps avant affichage du verdict |
|---|---|
| Avant correction | **20,2 s** |
| Apres correction (`fetchCourt`) | **5,2 s** |
| Reseau normal (temoin) | 0,2 s |

Deux enseignements :

1. **Le delai maximum se verifie sur le chemin, pas sur la fonction.** Avoir
   ecrit `fetchCourt` ne prouve rien ; ce qui compte est qu'aucun appel bloquant
   ne lui echappe. Le controle tient en une commande :
   `grep -n "fetch(" fichier` — et chaque resultat doit se justifier.
2. **Attention aux fichiers « locaux ».** Ces deux-la sont sur notre propre
   domaine, livres avec le site : on les croit gratuits. Ils passent pourtant
   par le reseau au premier chargement, et le service worker les sert reseau
   d'abord. Un fichier de son propre site n'est pas une donnee locale.

### `grep "fetch("` ne suffit pas : le reseau entre aussi par d'autres portes

Suite du meme enseignement, apprise deux jours plus tard, et plus large que la
precedente : **le controle par `grep "fetch("` a laisse passer l'attente la
plus longue du produit.** Elle ne s'ecrivait pas avec `fetch`.

Sur Safari iOS et Firefox il n'y a pas de lecteur de codes-barres natif : le
scanner telecharge une bibliotheque depuis un serveur tiers.

```js
await chargerScript("https://unpkg.com/@zxing/library@…/index.min.js");
```

Un `<script>` a un `onerror` — donc une **panne** est bien traitee. Mais
`onerror` ne se declenche jamais pour un chargement simplement **lent** : la
promesse reste en attente indefiniment. Or en rayon, la panne franche est le
cas rare ; la lenteur est le cas normal. Mesure, sur un navigateur sans
detecteur natif, le serveur tiers ne repondant pas :

| | Ce que la personne voit | Est-ce qu'on cherche vraiment ? |
|---|---|---|
| 3 s | « 🔎 Recherche du code-barres… » | **non** |
| 9 s | « Tiens le telephone a 15–20 cm, bien a plat, sans reflet » | **non** |
| 17 s | « Code abime ou arrondi ? » | **non** |
| 25 s, et au-dela | identique, indefiniment | **non** |

Le produit reprochait sa facon de filmer a quelqu'un dont le geste etait
parfait. C'est le pire des deux mondes : l'attente infinie **plus** une fausse
accusation.

Ce qu'il faut en retenir, dans l'ordre d'importance :

1. **Inventorier les attentes, pas les `fetch`.** Tout ce qui suspend le
   produit en attendant un octet distant : `fetch`, `XMLHttpRequest`,
   `import()` dynamique, `<script>`, `<img>` dont on attend `onload`,
   `link rel=stylesheet` bloquant, `navigator.sendBeacon` qu'on croit
   asynchrone, une police web. Chacun doit avoir un delai maximum ou une
   raison ecrite de ne pas en avoir.
2. **Un `onerror` n'est pas un delai maximum.** Il couvre l'echec, pas la
   lenteur. Les deux se traitent separement.
3. **Ne jamais annoncer une action qui n'a pas commence.** « Recherche en
   cours » pendant qu'on attend l'outil qui fera la recherche est un mensonge,
   et il devient une accusation des que le message suivant conseille a la
   personne de mieux s'y prendre. Les conseils d'usage ne se declenchent
   qu'apres le demarrage reel.
4. **Le delai peut avertir sans interrompre.** Ici le telechargement continue
   apres l'avertissement : s'il finit par arriver, la lecture demarre. Un
   `abort()` sec aurait casse une 3G lente mais fonctionnelle. Couper est
   parfois necessaire (le verdict d'un scan), avertir suffit souvent.

## Pourquoi 4 secondes, et pas 10

Le chiffre ne se choisit pas au feeling. Il se deduit de deux questions.

**1. Combien de temps l'utilisateur accepte-t-il d'attendre dans cette
situation-la ?** Debout dans une allee, un produit dans une main et le telephone
dans l'autre, avec des gens qui passent. Ce n'est pas quelqu'un assis a un
bureau. Au-dela de quatre secondes environ, il ne pense pas « ca charge », il
pense « ca ne marche pas » — et il range son telephone.

**2. Que vaut la reponse de secours ?** C'est la vraie question, et elle est
souvent oubliee. Ici le repli est excellent : le cache local et la base de
produits repondent en quelques millisecondes, avec un verdict complet. Attendre
six secondes de plus pour obtenir *peut-etre* une fiche legerement plus fraiche
est un mauvais echange.

**La regle generale :** le delai maximum doit etre proportionnel a ce qu'on perd
en abandonnant. Repli excellent → delai court. Aucun repli → un delai plus long
se defend, mais alors il faut expliquer l'attente a l'ecran.

Autrement dit, on ne regle pas un delai : on compare deux reponses possibles.

## La chaine de replis, dans l'ordre

Un delai court n'a de valeur que s'il y a quelque chose derriere. L'ordre compte,
du plus rapide et du plus sur au plus incertain :

1. **Le cache local** — produit deja scanne sur cet appareil. Affiche
   instantanement, sans meme tenter le reseau.
2. **Les bases embarquees** — verifications et produits locaux, livrees avec le
   site, donc disponibles hors ligne par construction.
3. **Le reseau**, avec son delai maximum.
4. **Un message d'erreur qui propose une action reelle** — jamais un cul-de-sac.

Detail qui a de la valeur : quand le cache repond, **on rafraichit en silence en
arriere-plan**. L'utilisateur lit son verdict tout de suite ; la fiche est mise a
jour pour la fois suivante, sans aucun saut visuel a l'ecran.

```js
const enCache = lireCacheProduit(code);
if (enCache) {
  afficherResultat(enCache, verif);        // immediat
  if (!horsLigne()) rafraichirEnSilence(code);  // pour la prochaine fois
  return;
}
```

Et le cache est borne : 60 fiches, les plus anciennes evincees par date. Toute
l'ecriture est dans un `try/catch` — si le stockage est sature, on continue sans
cache. **Le cache est un confort, jamais un prerequis** ; un produit qui tombe en
panne parce que son cache est plein est un produit rate.

## Dire honnetement d'ou vient ce qu'on affiche

C'est le point ou cette skill rejoint `ne-jamais-inventer`. Une fiche servie
depuis la memoire peut avoir des semaines. Elle reste utile — mais elle ne doit
jamais passer pour une donnee fraiche.

HalalCheck affiche, au-dessus du verdict :

```
📴 Hors connexion — fiche gardée en mémoire sur cet appareil
```

Deux choses dans cette phrase : d'ou vient l'information, et qu'elle est locale.
L'utilisateur peut alors decider lui-meme s'il fait confiance. C'est exactement
le meme geste que distinguer a l'ecran « verifie » de « aucun ingredient a risque
detecte ».

Le message d'erreur suit la meme regle. Comparons :

- Faible : « Erreur reseau. Reessayez. »
- Juste : « Ce produit n'a jamais ete scanne sur cet appareil, il n'y a donc rien
  en memoire a te montrer. Les produits deja scannes, eux, restent consultables
  sans reseau. »

Le second explique **pourquoi** il n'y a rien, et propose un bouton qui marche
vraiment dans cet etat (« Voir mes produits deja scannes »). Un message d'erreur
sans action possible est une impasse.

## Une attente legitime s'accompagne, elle ne se coupe pas

Toutes les attentes ne sont pas des pannes. La camera qui cherche un code-barres
n'a rien a repondre : c'est l'utilisateur qui detient la solution. Couper serait
absurde ; laisser tourner en silence aussi.

La reponse est de **paliers de conseils** :

| Apres | Message |
|---|---|
| 0 s | « Recherche du code-barres… » |
| 7 s | « Tiens le telephone a 15-20 cm, bien a plat sur le code, sans reflet. » |
| 15 s | « Code abime ou arrondi (bouteille) ? Saisis les chiffres sous le code-barres. » |

Le critere qui separe les deux cas : **est-ce que l'utilisateur peut changer
quelque chose ?** S'il le peut, on l'accompagne. Sinon, on coupe et on repond
autrement.

## Le service worker : deux strategies, pas une

Un service worker qui met tout en cache-first sert du contenu perime ; un qui met
tout en network-first ne marche pas hors ligne. Le partage se fait sur la
question : **une version perimee de ce fichier est-elle acceptable ?**

- **Pages HTML et bases de donnees JSON** → reseau d'abord, cache en secours. Une
  nouvelle verification halal doit arriver vite ; c'est le coeur de la promesse.
- **Scripts, styles, images, polices** → cache d'abord. Ils sont versionnes par
  le nom du cache, donc jamais perimes silencieusement.

## Ce qui ne marche PAS hors reseau, et qu'il faut dire

Une skill qui ne connait pas ses trous ment. Dans HalalCheck, sans reseau :

- **la lecture d'etiquette par photo** ne marche pas — elle appelle une API
  distante, il n'y a aucun repli local possible ;
- **un produit jamais scanne** ne peut pas etre analyse : il n'est ni en cache,
  ni dans les bases embarquees ;
- **l'annuaire des fiches d'additifs** de HalalGPT n'est pas joignable, donc les
  liens « Comprendre le E471 » pointent vers une page qui ne s'ouvrira pas.

Dire ces trois choses vaut mieux que promettre un « mode hors ligne » complet qui
decevrait au premier essai.

### Le meme piege se cache DANS le service worker

Cette section annoncait un manque connu : le service worker faisait
`fetch(requete)` en reseau d'abord, sans delai maximum. **Corrige le 10 aout,
et la mesure valait la peine :**

| Reseau retarde de 20 s | Temps avant affichage de la page |
|---|---|
| Avant | **20,1 s** |
| Apres | **4,1 s** |

La page etait pourtant **deja dans le cache**. Proteger le scan ne suffit pas si
le chargement de la page qui le contient reste otage du reseau.

Le remede n'est pas un `AbortController` : couper la requete ferait perdre la
mise a jour. C'est une **course entre le reseau et un minuteur**, ou la copie
en cache gagne si le reseau tarde, pendant que la requete continue en
arriere-plan et rafraichit le cache pour la fois suivante :

```js
function reseauDAbordAvecDelai(requete) {
  const reseau = fetch(requete).then((r) => {
    const copie = r.clone();
    caches.open(CACHE).then((c) => c.put(requete, copie));
    return r;
  });
  return caches.match(requete).then((enCache) => {
    // Sans copie locale, on attend le reseau quel qu'en soit le temps :
    // rien a servir vaut moins qu'une attente.
    if (!enCache) return reseau.catch(() => Response.error());
    return new Promise((resoudre) => {
      let repondu = false;
      const une = (r) => { if (!repondu) { repondu = true; resoudre(r); } };
      const t = setTimeout(() => une(enCache.clone()), DELAI_RESEAU);
      reseau.then((r) => { clearTimeout(t); une(r); },
                  () => { clearTimeout(t); une(enCache.clone()); });
    });
  });
}
```

Le `enCache.clone()` n'est pas un detail : une reponse ne se consomme qu'une
fois, et les deux branches peuvent la servir.

Quatre cas verifies apres correction, et il faut les quatre : reseau normal
0,1 s (aucune penalite), reseau lent 4,1 s, reseau coupe avec page en cache
0,1 s, et **premiere visite sans cache** — on attend toujours le reseau, ce qui
est le comportement voulu. Ne tester que le cas lent aurait laisse passer une
regression sur les trois autres.

## Comment le verifier

L'atelier ment : le reseau y est rapide et stable. Trois tests suffisent, et ils
prennent dix minutes.

1. **Lister les appels** — `grep -n "fetch(" fichier`. Chaque resultat doit soit
   passer par la fonction a delai maximum, soit porter un commentaire disant
   pourquoi il en est dispense. C'est le test le plus rentable des trois : c'est
   lui qui a trouve les 20,2 s ci-dessus.
2. **Mode avion**, puis scanner un produit deja scanne. Le verdict doit
   apparaitre immediatement, avec le bandeau de provenance. Mesure sur
   HalalCheck : **0,3 s**, badge « Hors connexion » affiche, contre 0,2 s en
   ligne sans badge. C'est le resultat attendu — pas « ca finit par s'afficher »,
   mais « aussi vite qu'en ligne, et l'utilisateur sait d'ou ca vient ».
3. **Reseau lent, pas coupe** — c'est le test que tout le monde saute, et c'est
   la situation reelle du rayon. En automatisant, on ne coupe pas la requete :
   **on la retarde**, ce qui est different et bien plus revelateur.

```js
// Playwright : verifications.json arrive au bout de 20 s au lieu d'echouer
await ctx.route("**/*", async (route) => {
  if (route.request().url().includes("verifications.json")) {
    await new Promise((r) => setTimeout(r, 20000));
  }
  return route.continue();
});
```

Puis on **chronometre l'affichage du verdict**. Un test qui verifie seulement
« le verdict finit par s'afficher » aurait declare la version a 20,2 s conforme.
C'est la duree qui est le resultat, pas la presence.

## Quand NE PAS appliquer cette skill

Un delai maximum court est **dangereux** dans trois cas :

- **Une operation qui ecrit** — paiement, commande, envoi de formulaire.
  Abandonner cote client n'annule rien cote serveur : la requete peut aboutir
  quand meme, et un utilisateur qui reessaie paie deux fois. Sur une ecriture, on
  attend, on affiche l'attente, et on rend l'operation idempotente.
- **Un traitement long que l'utilisateur a lance sciemment** — un export, un
  televersement, une generation. Il sait que c'est long. Ce qu'il attend, c'est
  une progression, pas une coupure. C'est le cas du troisieme `fetch` nu de
  HalalCheck, l'envoi de la photo d'etiquette : il a ete **volontairement
  laisse sans delai maximum**, et un commentaire dans le code le dit, pour qu'un
  agent futur ne le « corrige » pas. La photo pese plusieurs centaines de
  kilo-octets, l'utilisateur a declenche l'envoi lui-meme, et surtout il n'y a
  aucun repli local a lui servir : couper a 4 s le priverait de la seule reponse
  possible.
- **Un travail cote serveur** — traitement par lots, script de migration,
  integration continue. Il n'y a personne devant l'ecran ; la bonne strategie est
  la reprise avec attente croissante, pas l'abandon rapide.

Le partage tient en une question : **y a-t-il un humain qui attend, et existe-t-il
une reponse de secours a lui donner ?** Si oui, coupe court. Si non, accompagne
l'attente.
