#!/usr/bin/env python3
"""Est-ce que ces noms de domaine sont libres ? Releve par robot, pas de memoire.

Pourquoi
--------
Mohamed achete trois domaines ce soir et n'a pas de noms. Les chercher a 22 h
sur un site de vente, un par un, c'est une demi-heure perdue et un mauvais nom
choisi par fatigue. Le robot a le reseau ; l'atelier de l'agent ne l'a pas.

Ce script ne reserve rien et n'engage rien. Il pose une question et ecrit la
reponse. Le choix, et la depense, restent a Mohamed.

La precaution qui compte
------------------------
Un service d'annuaire qui refuse de repondre (429, panne, delai depasse) ne
dit PAS que le domaine est libre. Confondre « je ne sais pas » et « c'est
libre » ferait acheter du vent. Trois etats, jamais deux : libre, pris,
inconnu.
"""

import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

DELAI = 20
PAUSE = 1.2  # rdap.org limite le debit : on ne le brusque pas.
AGENT = "Mozilla/5.0 (compatible; usine-verification/1.0)"

CANDIDATS = {
    "jours-feries": [
        "lesponts.fr",
        "monpont.fr",
        "quandposer.fr",
        "poserunjour.fr",
        "calendrierdesponts.fr",
        "pontsetvacances.fr",
    ],
    "carburants": [
        "leplein.fr",
        "monplein.fr",
        "pleinmoinscher.fr",
        "oufaireleplein.fr",
        "carburantpascher.fr",
        "prixdupleinfr.fr",
    ],
    "fin-de-support": [
        "findesupport.fr",
        "jusquaquand.fr",
        "encoresupporte.fr",
        "finmisesajour.fr",
        "toujourssupporte.fr",
        "datedefin.fr",
    ],
}


def interroger(domaine):
    """Rend ('libre'|'pris'|'inconnu', detail). Ne leve jamais."""
    url = f"https://rdap.org/domain/{domaine}"
    requete = urllib.request.Request(url, headers={
        "User-Agent": AGENT,
        "Accept": "application/rdap+json, application/json",
    })
    try:
        contexte = ssl.create_default_context()
        with urllib.request.urlopen(requete, timeout=DELAI, context=contexte) as r:
            corps = r.read()
        try:
            d = json.loads(corps.decode("utf-8", "replace"))
            # Une reponse RDAP valide porte un ldhName : c'est la preuve que
            # l'annuaire connait ce domaine, donc qu'il est enregistre.
            if isinstance(d, dict) and d.get("ldhName"):
                return "pris", f"enregistre (RDAP {r.status})"
        except Exception:
            pass
        return "inconnu", f"code {r.status}, reponse illisible"
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return "libre", "aucun enregistrement trouve"
        if e.code == 429:
            return "inconnu", "debit limite par l'annuaire — a rejouer"
        return "inconnu", f"HTTP {e.code} {e.reason}"
    except Exception as e:
        return "inconnu", f"{type(e).__name__}: {e}"


SYMBOLE = {"libre": "🟢", "pris": "🔴", "inconnu": "⚪"}
LIBELLE = {
    "libre": "libre",
    "pris": "deja pris",
    "inconnu": "**pas de reponse — ne rien conclure**",
}


def main():
    horodatage = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    resultats = {}

    for projet, domaines in CANDIDATS.items():
        resultats[projet] = []
        for d in domaines:
            etat, detail = interroger(d)
            resultats[projet].append({"domaine": d, "etat": etat, "detail": detail})
            print(f"{SYMBOLE[etat]}  {projet:15} {d:26} {detail}")
            time.sleep(PAUSE)

    os.makedirs("docs/usine", exist_ok=True)
    with open("docs/usine/domaines-candidats.json", "w", encoding="utf-8") as f:
        json.dump({"verifie_le": horodatage, "candidats": resultats},
                  f, ensure_ascii=False, indent=2)
        f.write("\n")

    lignes = [
        "# Noms de domaine candidats — ce qui est libre",
        "",
        f"Releve automatique du **{horodatage}**, par un robot GitHub.",
        "",
        "Fichier genere : ne pas l'ecrire a la main.",
        "",
        "⚠️ **Un relevé n'est pas une réservation.** Un domaine libre ce matin",
        "peut être pris ce soir. Et ⚪ ne veut pas dire « libre » : ça veut dire",
        "que l'annuaire n'a pas répondu, donc qu'on ne sait pas.",
        "",
    ]
    for projet, liste in resultats.items():
        libres = [x for x in liste if x["etat"] == "libre"]
        lignes += [
            f"## {projet}",
            "",
            f"**{len(libres)} libre(s) sur {len(liste)} testé(s).**",
            "",
            "| Nom | État | Détail |",
            "|---|---|---|",
        ]
        for x in liste:
            lignes.append(f"| `{x['domaine']}` | {SYMBOLE[x['etat']]} {LIBELLE[x['etat']]} "
                          f"| {x['detail']} |")
        lignes.append("")

    with open("docs/usine/DOMAINES-CANDIDATS.md", "w", encoding="utf-8") as f:
        f.write("\n".join(lignes))

    print("\nConstat ecrit : docs/usine/DOMAINES-CANDIDATS.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
