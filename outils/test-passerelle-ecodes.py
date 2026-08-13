#!/usr/bin/env python3
"""Le controle du robot de la passerelle — pas du site.

Il repond a une seule question, et c'est la plus importante qu'on puisse poser
a un robot : **une panne de NOTRE cote peut-elle etre lue comme un defaut du
site ?**

Le 10 aout 2026, quatre rapports automatiques sur quatre ont annonce des
defauts qui n'existaient pas. Le 13 aout, en une seule matinee, trois comptages
de l'agent responsable ont menti — dont une expression `E[0-9]{3}` qui ne voyait
pas E1000. Un robot qu'on n'a pas essaye de faire mentir n'est pas un
instrument, c'est une opinion.
"""

import importlib.util
import os
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location(
    "passerelle", os.path.join(RACINE, "outils", "passerelle-ecodes.py"))
P = importlib.util.module_from_spec(spec)
spec.loader.exec_module(P)

rates = 0


def verifie(nom, condition, detail=""):
    global rates
    if condition:
        print(f"  ✓ {nom}")
    else:
        rates += 1
        print(f"  ✗ {nom}    {detail}")


print("\nLE ROBOT DE LA PASSERELLE\n")

# ── Le jugement, cas par cas ────────────────────────────────────────────────
r = P.juger("E471", "u", 308, "https://halalgpt.fr/q/e471-halal", "")
verifie("une redirection vers une fiche est un succes", r["etat"] == P.FICHE, r)

r = P.juger("E470a", "u", 308, "https://halalgpt.fr/categorie/additifs", "")
verifie("une redirection vers la categorie est le defaut du 13 aout",
        r["etat"] == P.VIDE, r)

r = P.juger("E470a", "u", 200, "", "<h1>E470a — pas encore de fiche</h1>")
verifie("la page d'aveu est comptee a part, pas comme un defaut",
        r["etat"] == P.HONNETE, r)

r = P.juger("E470a", "u", 200, "", "<h1>Bienvenue</h1>")
verifie("une page 200 qui ne repond ni n'avoue est un defaut",
        r["etat"] == P.VIDE, r)

r = P.juger("E999", "u", 404, "", "")
verifie("un 404 est un defaut : le site a repondu, et mal", r["etat"] == P.VIDE, r)

# ── LA verification qui justifie ce fichier ─────────────────────────────────
# On coupe le reseau en pointant le robot sur une adresse qui ne repond pas.
P.BASE_GPT = "https://127.0.0.1:9"
P.DELAI = 2
r = P.demander("E471")
verifie("un site injoignable n'est JAMAIS compte comme un defaut",
        r["etat"] == P.INJOIGNABLE,
        f"recu {r['etat']} ({r['detail']}) — c'est le piege du 10 aout")

# ── La lecture des sources ─────────────────────────────────────────────────
publies = P.codes_publies(RACINE)
verifie("les codes publies par halalcheck.fr sont retrouves",
        len(publies) > 40, f"{len(publies)} trouves")
verifie("les codes a quatre chiffres ne sont plus manques",
        any(len(c) >= 5 and c[1:].isdigit() for c in publies),
        f"aucun code a 4 chiffres dans {len(publies)} codes — "
        "c'est l'erreur E[0-9]{3} de l'audit du 13 aout")

moteur = P.codes_du_moteur(RACINE)
verifie("les codes du moteur du scanner sont retrouves",
        len(moteur) > 40, f"{len(moteur)} trouves")

# Un comptage a zero se soupconne avant de devenir un constat.
verifie("une source introuvable rend une liste vide, sans exploser",
        P.codes_publies("/chemin/qui/n/existe/pas") == [])

if rates:
    print(f"\n✗ {rates} verification(s) en echec.\n")
    sys.exit(1)
print("\n✓ Le robot sait distinguer « le site repond mal » de « je n'ai pas pu demander ».\n")
