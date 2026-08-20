# La ronde des sites

**Dernier changement constate le 2026-08-20 22:33 UTC.**

⚠️ **Cette ronde a regarde 171 pages sur 2017 — environ 8 %.**

Les chiffres ci-dessous decrivent CETTE TRANCHE, pas le site entier. Un
jour a 1 defaut et le lendemain a 28 ne veut pas dire que 27 choses ont
casse dans la nuit : la rotation est simplement passee sur d'autres pages.
Pour le compte complet, voir [BALAYAGE-COMPLET.md](BALAYAGE-COMPLET.md) — **vieux de 19 h**.

La ronde passe **toutes les 30 minutes** sur les quatre sites et
regarde ce qu'un visiteur recoit vraiment. Ce fichier n'est reecrit
que si la liste des defauts a bouge : une date ancienne veut dire
que rien de nouveau n'est casse, pas que le robot dort.

| Niveau | Combien | Ce que ca veut dire |
|---|---|---|
| 🔴 grave | **0** | le visiteur ne recoit pas la page |
| 🟠 defaut | 3 | il la recoit, mais elle le dessert |
| 🟡 a surveiller | 3 | pas urgent, a ne pas laisser grossir |

### Ce que cette ronde a regarde, site par site

Un site sans defaut plus bas a bien ete regarde : cette ligne le prouve.
Sans elle, « absent de la liste » et « jamais ouvert » se lisaient pareil.

| Site | Pages vues | Tous niveaux |
|---|---|---|
| islampasapas.fr | 41 | 0 |
| voyageshalal.fr | 41 | 0 |
| gohalaltravel.com | 41 | 3 |
| halalgpt.fr | 41 | 3 |
| halalcheck.fr | 7 | 0 |

## 🟠 defaut — 3

### gohalaltravel.com (1)

- **description en francais sur le domaine anglais** — mots francais : mosquee, une  
  `https://www.gohalaltravel.com/contact`

### halalgpt.fr (2)

- **l'index de la recherche interne ne repond pas** — URLError: <urlopen error timed out> — la recherche de /questions retombe sur les titres, sans le dire  
  `https://halalgpt.fr/api/recherche`
- **le compteur de passerelles n'est pas vivant** — URLError: <urlopen error timed out> — la seule mesure que les agents peuvent lire seuls n'enregistre rien  
  `https://halalgpt.fr/api/passerelle`

## 🟡 surveiller — 3

### gohalaltravel.com (2)

- **page instable sous charge** — muette pendant la ronde, repond en 36.2 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/destinations/addis-abeba`
- **page instable sous charge** — muette pendant la ronde, repond en 0.3 s au controle calme — a surveiller, pas a reparer  
  `https://www.gohalaltravel.com/destinations/amsterdam`

### halalgpt.fr (1)

- **page instable sous charge** — muette pendant la ronde, repond en 0.2 s au controle calme — a surveiller, pas a reparer  
  `https://halalgpt.fr/questions`
