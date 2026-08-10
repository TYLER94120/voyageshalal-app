# Verification des sources de l'usine

Releve automatique du **2026-08-10 10:25 UTC**, par un robot GitHub.

Ce fichier est genere : ne pas l'ecrire a la main. Il repond a une
seule question — *est-ce que la donnee arrive ?* — et rien n'est bati
sur un projet dont aucune source n'est verte.

## Verdict par projet

| Projet | Jouable | Sources vertes |
|---|---|---|
| `jours-feries` | ✅ oui | 3 / 3 |
| `carburants` | ✅ oui | 2 / 2 |
| `fin-de-support` | ✅ oui | 2 / 2 |

## Le detail, source par source

### jours-feries

✅ **repond, et le format est celui attendu**

- adresse : `https://calendrier.api.gouv.fr/jours-feries/metropole.json`
- a quoi elle sert : API officielle Etalab, toutes annees
- reponse : code 200, 8243 octets, type `application/json; charset=utf-8`
- forme recue : `objet a 285 cles: {2031-01-01, 2031-04-14, 2031-05-01, 2031-05-08, 2031-05-22, 2031-06-02, 2031-07-14, 2031-08-15}`

✅ **repond, et le format est celui attendu**

- adresse : `https://calendrier.api.gouv.fr/jours-feries/metropole/2027.json`
- a quoi elle sert : une annee future : c'est elle qui sert au calcul des ponts
- reponse : code 200, 318 octets, type `application/json; charset=utf-8`
- forme recue : `objet a 11 cles: {2027-01-01, 2027-03-29, 2027-05-01, 2027-05-06, 2027-05-08, 2027-05-17, 2027-07-14, 2027-08-15}`

✅ **repond, et le format est celui attendu**

- adresse : `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records?limit=5`
- a quoi elle sert : calendrier scolaire par zone
- reponse : code 200, 1145 octets, type `application/json; charset=utf-8`
- forme recue : `objet a 2 cles: {total_count, results}`

### carburants

✅ **repond, et le format est celui attendu**

- adresse : `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?limit=5`
- a quoi elle sert : flux instantane, adresse moderne
- reponse : code 200, 13266 octets, type `application/json; charset=utf-8`
- forme recue : `objet a 2 cles: {total_count, results}`

✅ **repond, et le format est celui attendu**

- adresse : `https://donnees.roulez-eco.fr/opendata/instantane`
- a quoi elle sert : ancienne adresse, archive zip — a tester car citee de memoire
- reponse : code 200, 953972 octets, type `application/zip`
- forme recue : `binaire, 4 premiers octets b'PK\x03\x04'`

### fin-de-support

✅ **repond, et le format est celui attendu**

- adresse : `https://endoflife.date/api/all.json`
- a quoi elle sert : index de tous les produits suivis
- reponse : code 200, 5826 octets, type `application/json`
- forme recue : `liste de 462 elements (str)`

✅ **repond, et le format est celui attendu**

- adresse : `https://endoflife.date/api/windows.json`
- a quoi elle sert : un produit reel : verifie que le format porte bien des dates
- reponse : code 200, 12801 octets, type `application/json`
- forme recue : `liste de 47 elements, 1er objet: {cycle, releaseLabel, releaseDate, eol, latest, link, lts, support}`

## Comment lire ce fichier

- ✅ **vert** — l'adresse repond et le contenu se lit dans le format
  attendu. On peut batir.
- ⚠️ **format** — l'adresse repond, mais ce qui arrive n'est pas ce
  qu'on attendait. C'est le cas le plus traitre : un simple `curl`
  aurait vu un code 200 et conclu que tout allait bien.
- ❌ **rouge** — rien n'arrive. Le projet correspondant s'arrete la,
  et on a perdu une heure au lieu d'une semaine.
