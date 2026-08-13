#!/usr/bin/env python3
"""Quatrieme robot : le fil entre HalalCheck et halalgpt.fr.

Pourquoi celui-la existe
------------------------
Le 13 aout 2026, l'audit de halalgpt.fr a mesure que sur les 56 liens
`halalgpt.fr/e/<CODE>` publies par `halalcheck.fr/additifs.html`, **36
tombaient sur une liste de categorie**. Et ces 36 etaient exactement les codes
que le moteur du scanner classe « douteux — origine animale possible ».

Quelqu'un lisait « E472e » sur un paquet, voyait *douteux*, appuyait pour
comprendre, et recevait une page qui ne parlait pas de son code.

Ce qui rend ce defaut interessant, c'est qu'AUCUN controle ne pouvait le voir :
le scanner testait son moteur, halalgpt.fr testait ses fiches. Les deux moities
etaient vertes et le pont etait rompu. Personne ne testait le FIL.

La ronde regarde si une page est bonne. Les liens morts regardent si les
chemins menent quelque part. Celui-ci regarde une chose que ni l'un ni l'autre
ne voit : est-ce que la promesse faite par un site est TENUE par l'autre ?

Ce qu'il refuse de faire
------------------------
Il ne confond pas « le site repond mal » et « je n'arrive pas a joindre le
site ». C'est la lecon du 10 aout, ou quatre rapports automatiques sur quatre
ont annonce des defauts qui n'existaient pas. Un code injoignable est note ⚪ et
ne fait jamais virer le controle au rouge : sinon la premiere coupure reseau
enverrait quelqu'un reparer un site qui va bien.

Il ne juge pas non plus le CONTENU d'une fiche. Il repond a une seule
question : le lecteur qui suit ce lien recoit-il quelque chose qui parle de son
code ?
"""

import json
import os
import re
import ssl
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

DELAI = 20
PARALLELE = 6
AGENT = "Mozilla/5.0 (compatible; ronde-empire/1.0)"

BASE_GPT = os.environ.get("PASSERELLE_BASE", "https://halalgpt.fr")

PAGE_PUBLIQUE = "projects/halal-scanner/site/additifs.html"
MOTEUR_SCANNER = "projects/halal-scanner/lib/halal.ts"

# La marque de la page honnete. Si halalgpt.fr change ce texte sans prevenir,
# le robot le signalera comme un doute, pas comme une panne — voir CLASSES.
MARQUE_PAGE_HONNETE = "pas encore de fiche"

# Quatre etats, et un seul reveille quelqu'un.
FICHE = "fiche"          # ✅ le lecteur recoit la reponse
HONNETE = "honnete"      # 🟡 on lui dit franchement qu'on ne l'a pas encore
VIDE = "vide"            # 🔴 il tombe sur autre chose : le defaut du 13 aout
INJOIGNABLE = "injoignable"  # ⚪ NOTRE robot n'a pas pu demander. Pas un defaut.


def codes_publies(racine: str) -> list:
    """Les codes que HalalCheck publie en clair, sur une page indexable.

    C'est la source qui compte : ces liens-la sont cliquables par n'importe
    qui, et suivis par Google. Le moteur en connait d'autres, mais ceux-ci
    sont deja dehors.
    """
    chemin = os.path.join(racine, PAGE_PUBLIQUE)
    if not os.path.exists(chemin):
        return []
    with open(chemin, encoding="utf-8") as f:
        html = f.read()
    # [0-9]{3,4} et non {3} : l'audit du 13 aout avait manque E1000 et E1105
    # avec un motif a trois chiffres, et sous-compte la liste a 55 au lieu
    # de 56. Le trou etait dans l'instrument, pas dans le site.
    return sorted(set(re.findall(r"halalgpt\.fr/e/(E[0-9]{3,4}[a-z]?)", html)))


def codes_du_moteur(racine: str) -> list:
    """Les codes que le scanner peut sortir a l'ecran, page publique ou pas.

    Un code connu du moteur mais absent de la page finira tot ou tard dans
    l'application : autant savoir des maintenant s'il aurait une reponse.
    """
    chemin = os.path.join(racine, MOTEUR_SCANNER)
    if not os.path.exists(chemin):
        return []
    with open(chemin, encoding="utf-8") as f:
        source = f.read()
    return sorted(set(re.findall(r"\bE[0-9]{3,4}[a-z]?\b", source)))


def demander(code: str) -> dict:
    """Une demande, un verdict. Sans redirection automatique : c'est justement
    la destination de la redirection qu'on veut lire."""
    url = f"{BASE_GPT}/e/{code}"
    contexte = ssl.create_default_context()

    class SansSuivi(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *_args, **_kwargs):
            return None

    ouvreur = urllib.request.build_opener(
        SansSuivi, urllib.request.HTTPSHandler(context=contexte)
    )
    requete = urllib.request.Request(url, headers={"User-Agent": AGENT})
    try:
        with ouvreur.open(requete, timeout=DELAI) as r:
            corps = r.read(60000).decode("utf-8", "replace")
            return juger(code, url, r.status, r.headers.get("Location", ""), corps)
    except urllib.error.HTTPError as e:
        cible = e.headers.get("Location", "") if e.headers else ""
        corps = ""
        if e.code == 200 or 300 <= e.code < 400:
            try:
                corps = e.read(60000).decode("utf-8", "replace")
            except Exception:
                corps = ""
        if e.code in (301, 302, 307, 308) or e.code == 200:
            return juger(code, url, e.code, cible, corps)
        # 404, 500… : le site a repondu, et il a repondu mal.
        return {"code": code, "url": url, "etat": VIDE,
                "detail": f"HTTP {e.code}"}
    except Exception as e:
        # Reseau, DNS, TLS, delai depasse : NOTRE probleme, pas celui du site.
        return {"code": code, "url": url, "etat": INJOIGNABLE,
                "detail": type(e).__name__}


def juger(code: str, url: str, statut: int, cible: str, corps: str) -> dict:
    chemin = re.sub(r"^https?://[^/]+", "", cible or "")
    if 300 <= statut < 400:
        if chemin.startswith("/q/"):
            return {"code": code, "url": url, "etat": FICHE,
                    "detail": chemin}
        return {"code": code, "url": url, "etat": VIDE,
                "detail": f"redirige vers {chemin or '(vide)'}"}
    if statut == 200:
        if MARQUE_PAGE_HONNETE in corps.lower():
            return {"code": code, "url": url, "etat": HONNETE, "detail": "page « pas encore de fiche »"}
        return {"code": code, "url": url, "etat": VIDE,
                "detail": "page 200 sans reponse ni aveu"}
    return {"code": code, "url": url, "etat": VIDE, "detail": f"HTTP {statut}"}


def main() -> int:
    racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    publies = codes_publies(racine)
    moteur = codes_du_moteur(racine)
    tous = sorted(set(publies) | set(moteur))

    if not tous:
        print("Aucun code trouve — la page publique ou le moteur a bouge.")
        print("Le robot s'arrete sans rien conclure : un comptage a zero se")
        print("soupconne avant de devenir un constat.")
        return 0

    print(f"{len(publies)} codes publies sur la page additifs, "
          f"{len(moteur)} connus du moteur, {len(tous)} distincts.")
    print(f"Passerelle interrogee : {BASE_GPT}/e/<CODE>\n")

    with ThreadPoolExecutor(max_workers=PARALLELE) as pool:
        resultats = list(pool.map(demander, tous))

    par_etat = {FICHE: [], HONNETE: [], VIDE: [], INJOIGNABLE: []}
    for r in resultats:
        r["publie"] = r["code"] in publies
        par_etat[r["etat"]].append(r)

    for etat, symbole in ((FICHE, "✅"), (HONNETE, "🟡"), (VIDE, "🔴"), (INJOIGNABLE, "⚪")):
        print(f"{symbole} {etat:<12} {len(par_etat[etat])}")

    # Si presque rien n'est joignable, c'est notre sortie reseau, pas le site.
    # On le dit et on ne conclut pas — la lecon du 10 aout.
    panne_robot = len(par_etat[INJOIGNABLE]) > len(tous) / 2

    horodate = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
    os.makedirs(os.path.join(racine, "docs/ronde"), exist_ok=True)
    with open(os.path.join(racine, "docs/ronde/passerelle-ecodes.json"), "w",
              encoding="utf-8") as f:
        json.dump({"releve": horodate, "base": BASE_GPT,
                   "publies": len(publies), "moteur": len(moteur),
                   "resultats": resultats}, f, ensure_ascii=False, indent=1)

    lignes = [
        "# La passerelle des codes additifs",
        "",
        f"Releve du **{horodate} UTC** · {len(tous)} codes demandes a "
        f"`{BASE_GPT}/e/<CODE>`.",
        "",
        "HalalCheck promet une reponse pour chaque additif qu'il reconnait.",
        "Ce robot verifie que halalgpt.fr la tient. C'est le seul controle qui",
        "regarde le FIL entre deux sites : le 13 aout, les deux moities etaient",
        "vertes et le pont etait rompu sur 36 codes.",
        "",
        "| | Combien | Ce que recoit le lecteur |",
        "|---|---|---|",
        f"| ✅ une fiche | **{len(par_etat[FICHE])}** | sa reponse |",
        f"| 🟡 un aveu honnete | {len(par_etat[HONNETE])} | « pas encore de fiche », et de quoi avancer |",
        f"| 🔴 autre chose | **{len(par_etat[VIDE])}** | une page qui ne parle pas de son code |",
        f"| ⚪ injoignable | {len(par_etat[INJOIGNABLE])} | *rien de prouve — c'est NOTRE robot qui n'a pas pu demander* |",
        "",
        "⚠️ **Un ⚪ n'est pas un defaut du site.** L'atelier des agents a une",
        "sortie reseau filtree qui repond 403 sur des sites parfaitement",
        "joignables depuis un telephone. Ce robot ne tourne utilement que",
        "depuis GitHub.",
        "",
    ]

    if panne_robot:
        lignes += [
            "## ⚠️ Ce releve ne conclut rien",
            "",
            f"{len(par_etat[INJOIGNABLE])} codes sur {len(tous)} n'ont pas pu etre",
            "demandes. Ce n'est pas une panne du site, c'est une panne de notre",
            "robot ou de sa sortie reseau. Aucun chiffre ci-dessus ne doit etre",
            "cite tant que ce n'est pas resolu.",
            "",
        ]
    elif par_etat[VIDE]:
        lignes += [f"## 🔴 Les {len(par_etat[VIDE])} codes qui ne recoivent pas de reponse", ""]
        for r in par_etat[VIDE][:60]:
            marque = " *(publie sur halalcheck.fr)*" if r["publie"] else ""
            lignes.append(f"- **{r['code']}** — {r['detail']}{marque}")
        lignes.append("")
    else:
        lignes += ["## Rien a signaler", "",
                   "Chaque code reconnu par le scanner recoit soit sa fiche, soit",
                   "un aveu franc. Aucun lecteur ne tombe sur une page qui ne",
                   "parle pas de son code.", ""]

    if par_etat[HONNETE]:
        lignes += [
            f"## 🟡 Les {len(par_etat[HONNETE])} codes sans fiche, dits franchement",
            "",
            "Ce n'est pas un defaut : c'est la file de redaction, et elle est",
            "visible. Chaque fiche ecrite fait descendre ce nombre.",
            "",
            "  " + " ".join(r["code"] for r in par_etat[HONNETE]),
            "",
        ]

    with open(os.path.join(racine, "docs/ronde/PASSERELLE.md"), "w",
              encoding="utf-8") as f:
        f.write("\n".join(lignes))
    print("\nConstat ecrit : docs/ronde/PASSERELLE.md")

    if panne_robot:
        print("Robot injoignable : aucune conclusion tiree.")
        return 0
    return 1 if par_etat[VIDE] else 0


if __name__ == "__main__":
    sys.exit(main())
