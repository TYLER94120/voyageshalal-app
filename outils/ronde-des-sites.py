#!/usr/bin/env python3
"""La ronde : un robot regarde les sites en ligne, comme un visiteur.

Pourquoi ce fichier existe
--------------------------
Mohamed, le 10 aout 2026 :

    « Je n'arrete pas de remonter des problemes avec des captures d'ecran.
      Ce n'est pas normal. »

Il a raison, et c'est le vrai defaut : dans cet empire, le detecteur de
pannes etait un humain. Un humain ne regarde que les pages ou il passe, une
fois de temps en temps, et il ne voit que ce qui creve les yeux. Une balise
de titre trop longue ne se voit pas a l'oeil nu — elle coute pourtant des
clics tous les jours.

Ce robot fait la ronde toutes les 30 minutes, sur les quatre sites, et il
regarde ce qu'un visiteur recoit vraiment. Pas le code : la page servie.

Pourquoi de l'exterieur et pas depuis le depot
----------------------------------------------
Parce que les quatre sites vivent dans des depots differents, et qu'un
defaut de deploiement ne se voit PAS dans le code. Le code peut etre bon et
la page servie cassee. Mohamed, lui, regarde le site en ligne — le robot
doit regarder la meme chose que lui, sinon il ne trouvera jamais ce qu'il
trouve.

Ce qu'il refuse de faire
------------------------
Il ne crie pas au loup. Un site lent une fois n'est pas une panne, et une
alerte qui se declenche pour rien finit ignoree — donc inutile. Trois
niveaux, et un seul fait echouer la ronde : 🔴 grave (le visiteur ne recoit
pas la page), 🟠 defaut (il la recoit, mais elle lui dessert), 🟡 a
surveiller.
"""

import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

DELAI = 20
LENT = 3.0          # secondes : au-dela, on note. Google en tient compte.
TITRE_MAX = 60      # au-dela, Google coupe le titre dans ses resultats.
DESC_MIN = 50
PAR_TOUR = 40       # pages de la longue traine verifiees a chaque ronde
PARALLELE = 6
AGENT = "Mozilla/5.0 (compatible; ronde-empire/1.0)"

# Les sites, et ce qu'on attend d'eux. `langue` = ce que <html lang> DOIT
# porter : c'est le defaut le plus traitre du bi-domaine, parce que la page
# s'affiche parfaitement... dans la mauvaise langue.
SITES = [
    {"nom": "voyageshalal.fr",  "base": "https://voyageshalal.fr",  "langue": "fr"},
    {"nom": "gohalaltravel.com", "base": "https://gohalaltravel.com", "langue": "en"},
    {"nom": "halalgpt.fr",      "base": "https://halalgpt.fr",      "langue": "fr"},
    {"nom": "halalcheck.fr",    "base": "https://halalcheck.fr",    "langue": "fr"},
]

GRAVE, DEFAUT, SURVEILLER = "grave", "defaut", "surveiller"
SYMBOLE = {GRAVE: "🔴", DEFAUT: "🟠", SURVEILLER: "🟡"}


def chercher(url, methode="GET"):
    """Rend (code, corps, secondes, erreur). Ne leve jamais."""
    requete = urllib.request.Request(url, method=methode, headers={
        "User-Agent": AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    })
    depart = time.monotonic()
    try:
        contexte = ssl.create_default_context()
        with urllib.request.urlopen(requete, timeout=DELAI, context=contexte) as r:
            corps = r.read(400_000) if methode == "GET" else b""
            return r.status, corps, time.monotonic() - depart, None
    except urllib.error.HTTPError as e:
        return e.code, b"", time.monotonic() - depart, None
    except Exception as e:
        return 0, b"", time.monotonic() - depart, f"{type(e).__name__}: {e}"


def texte(corps):
    return corps.decode("utf-8", "replace")


def balise(html, motif):
    m = re.search(motif, html, re.I | re.S)
    return (m.group(1).strip() if m else None)


def urls_du_sitemap(base):
    """Rend la liste des adresses du sitemap. Un sitemap absent est un
    resultat, pas une panne : on rendra la liste vide et on le signalera."""
    for chemin in ("/sitemap.xml", "/sitemap-0.xml", "/sitemap_index.xml"):
        code, corps, _, _ = chercher(base + chemin)
        if code != 200 or not corps:
            continue
        contenu = texte(corps)
        adresses = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", contenu, re.I)
        # Un index de sitemaps pointe vers d'autres sitemaps : on descend
        # d'un cran, sinon on croirait le site vide alors qu'il est enorme.
        if adresses and all(a.endswith(".xml") for a in adresses[:3]):
            tout = []
            for sous in adresses[:10]:
                c2, b2, _, _ = chercher(sous)
                if c2 == 200:
                    tout += re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", texte(b2), re.I)
            return tout
        if adresses:
            return adresses
    return []


def examiner(site, url):
    """Regarde une page comme un visiteur. Rend la liste de ses defauts."""
    defauts = []

    def noter(niveau, quoi, detail=""):
        defauts.append({"niveau": niveau, "site": site["nom"], "url": url,
                        "quoi": quoi, "detail": detail})

    code, corps, duree, erreur = chercher(url)

    if erreur:
        noter(GRAVE, "la page ne repond pas", erreur)
        return defauts
    if code >= 500:
        noter(GRAVE, f"erreur serveur {code}", "le visiteur ne recoit rien")
        return defauts
    if code == 404:
        noter(GRAVE, "page introuvable (404)", "elle est pourtant dans le sitemap")
        return defauts
    if code != 200:
        noter(DEFAUT, f"reponse inattendue ({code})")
        return defauts

    if duree > LENT:
        noter(SURVEILLER, f"page lente ({duree:.1f} s)",
              "au-dela de 3 s, une part des visiteurs repart")

    html = texte(corps)

    # Un rendu vide est le piege du rendu cote client : code 200, page blanche.
    if len(html) < 500:
        noter(GRAVE, "page quasi vide", f"{len(html)} caracteres recus")
        return defauts

    langue = balise(html, r"<html[^>]*\blang=[\"']([a-zA-Z-]+)")
    if not langue:
        noter(DEFAUT, "aucune langue declaree", "<html lang> absent")
    elif not langue.lower().startswith(site["langue"]):
        noter(GRAVE, "mauvaise langue servie",
              f"attendu « {site['langue']} », recu « {langue} »")

    titre = balise(html, r"<title[^>]*>(.*?)</title>")
    if not titre:
        noter(GRAVE, "aucun titre", "invisible dans Google")
    else:
        titre = re.sub(r"\s+", " ", titre)
        if len(titre) > TITRE_MAX:
            noter(DEFAUT, f"titre coupe par Google ({len(titre)} car.)",
                  f"« {titre[:TITRE_MAX]}… »")

    desc = balise(html, r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']')
    if not desc:
        desc = balise(html, r'<meta[^>]+content=["\'](.*?)["\'][^>]+name=["\']description["\']')
    if not desc:
        noter(DEFAUT, "aucune description", "Google en invente une, souvent mauvaise")
    elif len(desc.strip()) < DESC_MIN:
        noter(SURVEILLER, f"description trop courte ({len(desc.strip())} car.)")

    if not re.search(r"<h1[\s>]", html, re.I):
        noter(DEFAUT, "aucun titre H1", "la page n'annonce pas son sujet")

    for bloc in re.findall(
            r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            html, re.S | re.I):
        try:
            json.loads(bloc)
        except Exception as e:
            noter(DEFAUT, "donnees structurees illisibles",
                  f"Google les ignore — {str(e)[:80]}")
            break

    return defauts


def ronde_du_site(site, tour):
    defauts = []
    base = site["base"]

    code, corps, _, erreur = chercher(base + "/")
    if erreur or code >= 400:
        defauts.append({"niveau": GRAVE, "site": site["nom"], "url": base + "/",
                        "quoi": "le site entier ne repond pas",
                        "detail": erreur or f"code {code}"})
        return defauts, 0

    adresses = urls_du_sitemap(base)
    if not adresses:
        defauts.append({"niveau": DEFAUT, "site": site["nom"], "url": base + "/sitemap.xml",
                        "quoi": "aucun sitemap lisible",
                        "detail": "Google decouvre les pages au hasard"})
        adresses = [base + "/"]

    # L'accueil a chaque ronde ; le reste par rotation, pour couvrir tout le
    # site sans le marteler 48 fois par jour.
    accueil = [base + "/"]
    traine = [a for a in adresses if a.rstrip("/") != base.rstrip("/")]
    if traine:
        depart = (tour * PAR_TOUR) % len(traine)
        tranche = (traine + traine)[depart:depart + PAR_TOUR]
    else:
        tranche = []
    a_voir = accueil + tranche

    with ThreadPoolExecutor(max_workers=PARALLELE) as pool:
        for lot in pool.map(lambda u: examiner(site, u), a_voir):
            defauts += lot

    return defauts, len(a_voir)


def substance(defauts):
    """Ce qui merite un commit. On laisse de cote les durees, qui bougent a
    chaque ronde sans rien vouloir dire."""
    return sorted((d["site"], d["url"], d["niveau"],
                   re.sub(r"\([\d.,]+ s\)", "(lente)", d["quoi"]))
                  for d in defauts)


def main():
    horodatage = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    tour = int(os.environ.get("GITHUB_RUN_NUMBER", "0"))

    tous, vues = [], 0
    for site in SITES:
        defauts, n = ronde_du_site(site, tour)
        tous += defauts
        vues += n
        graves = sum(1 for d in defauts if d["niveau"] == GRAVE)
        print(f"{site['nom']:22} {n:3} pages · {len(defauts):3} defauts "
              f"dont {graves} graves")

    par_niveau = {n: [d for d in tous if d["niveau"] == n]
                  for n in (GRAVE, DEFAUT, SURVEILLER)}

    os.makedirs("docs/ronde", exist_ok=True)

    ancien = None
    try:
        with open("docs/ronde/ronde.json", encoding="utf-8") as f:
            ancien = json.load(f)
    except Exception:
        pass

    inchange = ancien is not None and substance(ancien.get("defauts", [])) == substance(tous)

    if not inchange:
        with open("docs/ronde/ronde.json", "w", encoding="utf-8") as f:
            json.dump({"ronde_du": horodatage, "pages_vues": vues, "defauts": tous},
                      f, ensure_ascii=False, indent=2)
            f.write("\n")

        lignes = [
            "# La ronde des sites",
            "",
            f"**Dernier changement constate le {horodatage}.** "
            f"{vues} pages regardees a cette ronde.",
            "",
            "La ronde passe **toutes les 30 minutes** sur les quatre sites et",
            "regarde ce qu'un visiteur recoit vraiment. Ce fichier n'est reecrit",
            "que si la liste des defauts a bouge : une date ancienne veut dire",
            "que rien de nouveau n'est casse, pas que le robot dort.",
            "",
            "| Niveau | Combien | Ce que ca veut dire |",
            "|---|---|---|",
            f"| 🔴 grave | **{len(par_niveau[GRAVE])}** | le visiteur ne recoit pas la page |",
            f"| 🟠 defaut | {len(par_niveau[DEFAUT])} | il la recoit, mais elle le dessert |",
            f"| 🟡 a surveiller | {len(par_niveau[SURVEILLER])} | pas urgent, a ne pas laisser grossir |",
            "",
        ]
        if not tous:
            lignes += ["## Rien a signaler", "",
                       "Les quatre sites repondent et les pages vues sont correctes.", ""]
        for niveau in (GRAVE, DEFAUT, SURVEILLER):
            liste = par_niveau[niveau]
            if not liste:
                continue
            lignes += [f"## {SYMBOLE[niveau]} {niveau} — {len(liste)}", ""]
            par_site = {}
            for d in liste:
                par_site.setdefault(d["site"], []).append(d)
            for nom, ds in par_site.items():
                lignes += [f"### {nom} ({len(ds)})", ""]
                for d in ds[:40]:
                    detail = f" — {d['detail']}" if d["detail"] else ""
                    lignes.append(f"- **{d['quoi']}**{detail}  \n  `{d['url']}`")
                if len(ds) > 40:
                    lignes.append(f"- … et {len(ds) - 40} autres, "
                                  f"liste complete dans `ronde.json`")
                lignes.append("")

        with open("docs/ronde/RONDE.md", "w", encoding="utf-8") as f:
            f.write("\n".join(lignes))
        print("\nConstat ecrit : docs/ronde/RONDE.md")
    else:
        print("\nRien de nouveau depuis la derniere ronde : aucun fichier reecrit.")

    print(f"\n🔴 {len(par_niveau[GRAVE])}  🟠 {len(par_niveau[DEFAUT])}  "
          f"🟡 {len(par_niveau[SURVEILLER])}")

    # Seul le grave fait echouer la ronde. Une alerte qui se declenche pour
    # un titre trop long finirait ignoree, et le jour ou un site tombe
    # vraiment, personne ne regarderait plus.
    return 1 if par_niveau[GRAVE] else 0


if __name__ == "__main__":
    sys.exit(main())
