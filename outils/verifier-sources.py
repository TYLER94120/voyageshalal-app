#!/usr/bin/env python3
"""Le premier robot de l'usine : il ne construit rien, il verifie.

Pourquoi ce fichier existe
--------------------------
Les trois premiers sujets de l'usine ont ete proposes DE MEMOIRE par l'agent
responsable, sans qu'il puisse verifier que les sources existent : la sortie
reseau de son atelier est fermee. Un robot GitHub, lui, a le reseau.

Batir un site avant de savoir si la donnee arrive serait exactement l'erreur
que la competence `mesurer-avant-daffirmer` decrit. Ce script est la mesure.

Ce qu'il refuse de faire
------------------------
Il ne conclut pas « la source marche » sur un code 200. Une page d'erreur, une
page de maintenance et une redirection vers un portail rendent toutes 200 avec
du HTML. On verifie donc le TYPE, la TAILLE, et pour le JSON on parse
reellement et on releve la forme obtenue. Trois etats, jamais deux : vert,
rouge, ou « repond mais pas dans le format attendu » — qui est le cas le plus
traitre et celui qu'un simple curl laisse passer.

Il ne fait jamais echouer le travail. Une source morte est un resultat, pas une
panne : on l'ecrit et le projet correspondant s'arrete avant d'avoir coute
quoi que ce soit.
"""

import json
import os
import ssl
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

DELAI = 30

# Un navigateur ordinaire. Plusieurs portails publics renvoient 403 a
# l'agent par defaut d'urllib, ce qui ferait conclure a tort que la source
# est fermee.
AGENT = "Mozilla/5.0 (compatible; usine-verification/1.0; +https://github.com/)"

SOURCES = [
    # --- Projet 1 : jours feries, ponts et vacances scolaires ---
    {
        "projet": "jours-feries",
        "url": "https://calendrier.api.gouv.fr/jours-feries/metropole.json",
        "attendu": "json",
        "note": "API officielle Etalab, toutes annees",
    },
    {
        "projet": "jours-feries",
        "url": "https://calendrier.api.gouv.fr/jours-feries/metropole/2027.json",
        "attendu": "json",
        "note": "une annee future : c'est elle qui sert au calcul des ponts",
    },
    {
        "projet": "jours-feries",
        "url": "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets"
               "/fr-en-calendrier-scolaire/records?limit=5",
        "attendu": "json",
        "note": "calendrier scolaire par zone",
    },
    # --- Projet 2 : prix des carburants ---
    {
        "projet": "carburants",
        "url": "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets"
               "/prix-des-carburants-en-france-flux-instantane-v2/records?limit=5",
        "attendu": "json",
        "note": "flux instantane, adresse moderne",
    },
    {
        "projet": "carburants",
        "url": "https://donnees.roulez-eco.fr/opendata/instantane",
        "attendu": "binaire",
        "note": "ancienne adresse, archive zip — a tester car citee de memoire",
    },
    # --- Projet 3 : fin de support et compatibilite ---
    {
        "projet": "fin-de-support",
        "url": "https://endoflife.date/api/all.json",
        "attendu": "json",
        "note": "index de tous les produits suivis",
    },
    {
        "projet": "fin-de-support",
        "url": "https://endoflife.date/api/windows.json",
        "attendu": "json",
        "note": "un produit reel : verifie que le format porte bien des dates",
    },
]


def forme(donnee):
    """Decrit la forme d'un JSON sans en recopier le contenu.

    On veut savoir « est-ce que ca ressemble a ce qu'on croit », pas remplir le
    constat avec des milliers de lignes de donnees.
    """
    if isinstance(donnee, list):
        if not donnee:
            return "liste vide"
        premier = donnee[0]
        if isinstance(premier, dict):
            cles = ", ".join(list(premier.keys())[:8])
            return f"liste de {len(donnee)} elements, 1er objet: {{{cles}}}"
        return f"liste de {len(donnee)} elements ({type(premier).__name__})"
    if isinstance(donnee, dict):
        cles = ", ".join(list(donnee.keys())[:8])
        return f"objet a {len(donnee)} cles: {{{cles}}}"
    return type(donnee).__name__


def sonder(source):
    """Interroge une adresse et rend un constat. Ne leve jamais."""
    resultat = {
        "projet": source["projet"],
        "url": source["url"],
        "attendu": source["attendu"],
        "note": source["note"],
        "code": 0,
        "type": "",
        "octets": 0,
        "forme": "",
        "verdict": "",
        "detail": "",
    }

    requete = urllib.request.Request(source["url"], headers={
        "User-Agent": AGENT,
        "Accept": "application/json, */*",
    })

    try:
        contexte = ssl.create_default_context()
        with urllib.request.urlopen(requete, timeout=DELAI, context=contexte) as reponse:
            resultat["code"] = reponse.status
            resultat["type"] = reponse.headers.get("Content-Type", "")
            corps = reponse.read()
    except urllib.error.HTTPError as e:
        resultat["code"] = e.code
        resultat["type"] = e.headers.get("Content-Type", "") if e.headers else ""
        resultat["verdict"] = "rouge"
        resultat["detail"] = f"HTTP {e.code} {e.reason}"
        return resultat
    except Exception as e:  # DNS, TLS, delai depasse, refus de connexion
        resultat["verdict"] = "rouge"
        resultat["detail"] = f"{type(e).__name__}: {e}"
        return resultat

    resultat["octets"] = len(corps)

    if resultat["code"] != 200:
        resultat["verdict"] = "rouge"
        resultat["detail"] = f"code {resultat['code']}"
        return resultat

    if len(corps) == 0:
        resultat["verdict"] = "rouge"
        resultat["detail"] = "reponse vide"
        return resultat

    if source["attendu"] == "json":
        # Le piege : un portail en panne rend 200 + du HTML. Le parse est le
        # seul test qui fasse la difference.
        try:
            donnee = json.loads(corps.decode("utf-8", "replace"))
        except Exception as e:
            resultat["verdict"] = "format"
            debut = corps[:120].decode("utf-8", "replace").replace("\n", " ")
            resultat["detail"] = f"JSON illisible ({e}). Debut recu: {debut!r}"
            return resultat
        resultat["forme"] = forme(donnee)
        resultat["verdict"] = "vert"
        return resultat

    # Attendu binaire (archive) : on verifie au moins que ce n'est pas une
    # page HTML deguisee en telechargement.
    if corps[:15].lstrip().lower().startswith(b"<!doctype") or corps[:6].lower() == b"<html>":
        resultat["verdict"] = "format"
        resultat["detail"] = "du HTML la ou une archive etait attendue"
        return resultat

    resultat["forme"] = f"binaire, 4 premiers octets {corps[:4]!r}"
    resultat["verdict"] = "vert"
    return resultat


SYMBOLE = {"vert": "✅", "format": "⚠️", "rouge": "❌"}
LIBELLE = {
    "vert": "repond, et le format est celui attendu",
    "format": "repond, mais PAS dans le format attendu",
    "rouge": "ne repond pas",
}


def substance(constats):
    """Ce qui merite un commit, et rien d'autre.

    L'heure du releve et le nombre exact d'octets changent a chaque passage :
    les garder dans la comparaison fabriquerait un commit par jour pour dire
    « rien n'a change », ce qui est exactement le bruit qu'on veut eviter.
    """
    return [(c["url"], c["verdict"], c["code"], c["forme"], c["detail"])
            for c in constats]


def main():
    horodatage = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    constats = [sonder(s) for s in SOURCES]

    for c in constats:
        print(f"{SYMBOLE[c['verdict']]}  {c['projet']:15} {c['code']:>3}  "
              f"{c['octets']:>9} o  {c['url']}")
        if c["detail"]:
            print(f"      → {c['detail']}")
        if c["forme"]:
            print(f"      → {c['forme']}")

    # Rien de neuf : on ne reecrit rien. Le robot tourne tous les jours, mais
    # l'historique du depot ne doit raconter que ce qui a bouge. La preuve
    # qu'il a tourne est dans l'historique des executions, pas dans un commit.
    try:
        with open("docs/usine/verification-sources.json", encoding="utf-8") as f:
            ancien = json.load(f)
        if substance(ancien.get("constats", [])) == substance(constats):
            print("\nInchange depuis le dernier releve : aucun fichier reecrit.")
            return 0
    except FileNotFoundError:
        pass
    except Exception as e:
        print(f"\n(ancien constat illisible, on reecrit : {e})")

    os.makedirs("docs/usine", exist_ok=True)

    with open("docs/usine/verification-sources.json", "w", encoding="utf-8") as f:
        json.dump({"verifie_le": horodatage, "constats": constats},
                  f, ensure_ascii=False, indent=2)
        f.write("\n")

    # Un verdict par projet : un projet est jouable si AU MOINS UNE de ses
    # sources est verte. Les adresses de secours sont la pour ca.
    projets = {}
    for c in constats:
        projets.setdefault(c["projet"], []).append(c)

    lignes = [
        "# Verification des sources de l'usine",
        "",
        f"**Dernier changement constate le {horodatage}**, par un robot GitHub.",
        "",
        "Le controle tourne **tous les jours a 5 h**. Ce fichier n'est reecrit",
        "que si quelque chose a bouge : la date ci-dessus est donc celle du",
        "dernier CHANGEMENT, pas celle du dernier controle. Une date ancienne",
        "est une bonne nouvelle — elle veut dire que rien n'a casse depuis.",
        "",
        "Ce fichier est genere : ne pas l'ecrire a la main. Il repond a une",
        "seule question — *est-ce que la donnee arrive ?* — et rien n'est bati",
        "sur un projet dont aucune source n'est verte.",
        "",
        "## Verdict par projet",
        "",
        "| Projet | Jouable | Sources vertes |",
        "|---|---|---|",
    ]
    for nom, liste in projets.items():
        verts = [c for c in liste if c["verdict"] == "vert"]
        jouable = "✅ oui" if verts else "❌ non"
        lignes.append(f"| `{nom}` | {jouable} | {len(verts)} / {len(liste)} |")

    lignes += ["", "## Le detail, source par source", ""]
    for nom, liste in projets.items():
        lignes += [f"### {nom}", ""]
        for c in liste:
            lignes.append(f"{SYMBOLE[c['verdict']]} **{LIBELLE[c['verdict']]}**")
            lignes.append("")
            lignes.append(f"- adresse : `{c['url']}`")
            lignes.append(f"- a quoi elle sert : {c['note']}")
            lignes.append(f"- reponse : code {c['code']}, {c['octets']} octets, "
                          f"type `{c['type'] or 'inconnu'}`")
            if c["forme"]:
                lignes.append(f"- forme recue : `{c['forme']}`")
            if c["detail"]:
                lignes.append(f"- ce qui cloche : {c['detail']}")
            lignes.append("")

    lignes += [
        "## Comment lire ce fichier",
        "",
        "- ✅ **vert** — l'adresse repond et le contenu se lit dans le format",
        "  attendu. On peut batir.",
        "- ⚠️ **format** — l'adresse repond, mais ce qui arrive n'est pas ce",
        "  qu'on attendait. C'est le cas le plus traitre : un simple `curl`",
        "  aurait vu un code 200 et conclu que tout allait bien.",
        "- ❌ **rouge** — rien n'arrive. Le projet correspondant s'arrete la,",
        "  et on a perdu une heure au lieu d'une semaine.",
        "",
    ]

    with open("docs/usine/VERIFICATION-SOURCES.md", "w", encoding="utf-8") as f:
        f.write("\n".join(lignes))

    print(f"\nConstat ecrit : docs/usine/VERIFICATION-SOURCES.md")
    # On sort toujours en succes : une source morte est un resultat, pas une
    # panne du robot.
    return 0


if __name__ == "__main__":
    sys.exit(main())
