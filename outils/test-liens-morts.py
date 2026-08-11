#!/usr/bin/env python3
"""Le robot des liens morts ne doit JAMAIS declarer mort sur une panne reseau.

Le 11 aout, il a declare mort `halalgpt.fr/e/E572`. Verification a la main :
la page repond 308 vers /categorie/additifs, qui repond 200. Rien n'etait
casse. Ce qui avait echoue, c'est le robot lui-meme, apres ~1700 requetes.

La difference tient en un mot : un CODE HTTP est un verdict (le serveur a
parle, il a dit 404) ; une panne reseau sans code n'est pas un verdict, c'est
une absence de reponse. Et une absence de reponse sous notre propre charge
parle de nous, pas du site d'en face.

Ce test verrouille la regle. Aucun reseau n'est utilise : on remplace la
fonction qui interroge, et on regarde ce que le robot conclut.

    python3 outils/test-liens-morts.py
"""

import importlib.util
import os
import sys

CHEMIN = os.path.join(os.path.dirname(os.path.abspath(__file__)), "liens-morts.py")
spec = importlib.util.spec_from_file_location("liens_morts", CHEMIN)
robot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(robot)

echecs = 0


def dire(ok, quoi, detail=""):
    global echecs
    print(f"{'✓' if ok else '✗'} {quoi}" + (f" — {detail}" if detail else ""))
    if not ok:
        echecs += 1


# Les pauses du controle calme sont reelles en production ; ici elles ne
# servent qu'a faire perdre du temps.
robot.time.sleep = lambda _s: None


def faire_repondre(reponses):
    """Remplace l'interrogation reseau. `reponses` : url -> liste de retours,
    consommes dans l'ordre (le dernier vaut pour tous les appels suivants)."""
    etat = {u: list(v) for u, v in reponses.items()}

    def demander(url, methode):
        suite = etat.get(url) or [(0, b"", "URLError")]
        code = suite[0] if len(suite) == 1 else suite.pop(0)
        return code

    robot.demander = demander


# ── 1. Une panne reseau ne doit pas donner « mort », mais « doute » ─────────
faire_repondre({"http://x/a": [(0, b"", "URLError")]})
etat, detail = robot.etat_du_lien("http://x/a")
dire(etat == "doute", "aucun code de reponse -> doute, jamais mort d'emblee",
     f"obtenu : {etat}")

# ── 2. Un vrai 404 reste un verdict immediat ───────────────────────────────
faire_repondre({"http://x/b": [(404, b"", None)]})
etat, _ = robot.etat_du_lien("http://x/b")
dire(etat == "mort", "un code 404 reste un verdict, sans quarantaine",
     f"obtenu : {etat}")

# ── 3. Le controle calme innocente ce qui repond une fois la machine calme ──
faire_repondre({"http://x/c": [(200, b"", None)]})
confirmes, innocentes = robot.confirmer_les_muets(
    [{"site": "s", "genre": "interne", "url": "http://x/c", "detail": "URLError"}])
dire(len(confirmes) == 0 and len(innocentes) == 1,
     "le lien qui repond au controle calme est innocente, pas repare pour rien",
     f"{len(confirmes)} mort(s), {len(innocentes)} innocente(s)")

# ── 4. Le controle calme confirme ce qui est vraiment mort ─────────────────
faire_repondre({"http://x/d": [(0, b"", "URLError")]})
confirmes, innocentes = robot.confirmer_les_muets(
    [{"site": "s", "genre": "interne", "url": "http://x/d", "detail": "URLError"}])
dire(len(confirmes) == 1 and len(innocentes) == 0,
     "le lien muet deux fois, machine calme, est bien declare mort",
     f"{len(confirmes)} mort(s)")
dire(confirmes and "machine calme" in confirmes[0]["detail"],
     "le constat dit DANS QUELLES CONDITIONS il a ete etabli",
     confirmes[0]["detail"] if confirmes else "")

# ── 5. Un 403 au controle calme = robot refuse, surtout pas un lien a retirer ─
faire_repondre({"http://x/e": [(403, b"", None)]})
confirmes, innocentes = robot.confirmer_les_muets(
    [{"site": "s", "genre": "interne", "url": "http://x/e", "detail": "URLError"}])
dire(len(confirmes) == 0, "un 403 au controle calme n'est pas un lien mort",
     f"{len(confirmes)} mort(s)")

# ── 6. Le cas reel : une redirection 308 est un lien VIVANT ────────────────
# C'est exactement /e/E572 -> /categorie/additifs. Si le robot ne compte pas
# le 308 comme vivant, il ira « reparer » tout le pont des additifs.
faire_repondre({"http://x/e572": [(308, b"", None)]})
etat, _ = robot.etat_du_lien("http://x/e572")
dire(etat == "vivant", "une redirection 308 est un lien vivant (cas /e/E572)",
     f"obtenu : {etat}")

# ── 7. Rien en quarantaine : le controle calme ne doit rien inventer ───────
confirmes, innocentes = robot.confirmer_les_muets([])
dire(confirmes == [] and innocentes == [],
     "sans suspect, le controle calme ne produit rien")

print("\n" + ("✓ Une panne de notre robot ne peut plus etre lue comme une page cassee."
              if echecs == 0 else f"✗ {echecs} echec(s)"))
sys.exit(0 if echecs == 0 else 1)
