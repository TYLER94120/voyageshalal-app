#!/usr/bin/env python3
"""Deuxieme robot : les liens qui ne menent nulle part.

Pourquoi celui-la en particulier
--------------------------------
Un guide de voyage vit de ses liens. Un lien mort vers un restaurant, une
mosquee ou un hotel, c'est un lecteur qui arrive sur une erreur au moment
precis ou il faisait confiance au guide. C'est le defaut le plus couteux d'un
site de recommandations, et le plus invisible pour celui qui l'ecrit : le lien
marchait le jour ou il l'a pose.

La ronde regarde si une PAGE est bonne. Ce robot regarde si les CHEMINS qui en
partent menent quelque part. Les deux sont necessaires : une page parfaite
remplie de liens morts reste une mauvaise page.

Deux poids, deux mesures, et c'est voulu
----------------------------------------
Un lien INTERNE mort est grave : c'est notre faute, ca se repare, et Google
le compte contre nous. Un lien EXTERNE mort est un defaut : le site d'en face
a ferme, on n'y peut rien — mais il faut quand meme retirer le lien.

Ce qu'il refuse de faire
------------------------
Il ne declare pas un lien mort sur un seul essai rate. Beaucoup de sites
repondent 403 a un robot tout en fonctionnant parfaitement dans un
navigateur ; d'autres refusent HEAD mais acceptent GET. Conclure trop vite
ferait retirer des liens valides, ce qui est pire que le probleme. Un lien
n'est declare mort qu'apres HEAD puis GET, et un 403 est note a part comme
« bloque aux robots », jamais comme mort.
"""

import html
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

DELAI = 15
PARALLELE = 8
PAGES_PAR_TOUR = 120     # pages dont on extrait les liens, par site et par tour
EXTERNES_PAR_TOUR = 250  # liens externes distincts verifies par tour
AGENT = "Mozilla/5.0 (compatible; ronde-empire/1.0)"

SITES = [
    {"nom": "voyageshalal.fr", "base": "https://voyageshalal.fr"},
    {"nom": "gohalaltravel.com", "base": "https://gohalaltravel.com"},
    {"nom": "halalgpt.fr", "base": "https://halalgpt.fr"},
    {"nom": "halalcheck.fr", "base": "https://halalcheck.fr"},
]

IGNORER = re.compile(r"^(mailto:|tel:|javascript:|#|data:)", re.I)


def demander(url, methode):
    requete = urllib.request.Request(url, method=methode, headers={
        "User-Agent": AGENT,
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    })
    try:
        with urllib.request.urlopen(requete, timeout=DELAI,
                                    context=ssl.create_default_context()) as r:
            return r.status, r.read(200_000) if methode == "GET" else b"", None
    except urllib.error.HTTPError as e:
        return e.code, b"", None
    except Exception as e:
        return 0, b"", f"{type(e).__name__}"


def etat_du_lien(url):
    """Rend ('vivant'|'mort'|'bloque', detail).

    HEAD d'abord parce que c'est cent fois moins lourd pour le site d'en face.
    GET ensuite, parce que beaucoup de serveurs refusent HEAD sans que la page
    soit cassee — s'arreter au HEAD ferait retirer des liens valides.

    Et si les deux echouent SANS code de reponse — delai depasse, connexion
    coupee — on ne conclut pas. Le robot lance 8 requetes en parallele : une
    coupure passagere sous cette charge ne prouve rien. Mesure du 10 aout :
    sur 5 liens declares morts, 3 repondaient parfaitement au controle calme.
    Un seul echec n'est pas un verdict.
    """
    code, _, erreur = demander(url, "HEAD")
    if code in (200, 201, 202, 204, 206, 301, 302, 303, 307, 308):
        return "vivant", ""
    code2, _, erreur2 = demander(url, "GET")
    if code2 in (200, 201, 202, 204, 206, 301, 302, 303, 307, 308):
        return "vivant", ""
    if code2 in (401, 403, 429) or code in (401, 403, 429):
        return "bloque", f"code {code2 or code} — refuse les robots, pas forcement mort"
    if code2 == 0 and code == 0:
        # Aucune reponse du tout : on retente une fois, calmement, avant de
        # dire quoi que ce soit.
        time.sleep(1.5)
        code3, _, erreur3 = demander(url, "GET")
        if code3 in (200, 201, 202, 204, 206, 301, 302, 303, 307, 308):
            return "vivant", ""
        if code3 in (401, 403, 429):
            return "bloque", f"code {code3} — refuse les robots"
        if code3 == 0:
            return "mort", f"{erreur3 or erreur2 or erreur} (confirme au 2e controle)"
        return "mort", f"code {code3} (confirme au 2e controle)"
    return "mort", f"code {code2 or code}"


def liens_de_la_page(base, url):
    code, corps, _ = demander(url, "GET")
    if code != 200 or not corps:
        return set(), set()
    page = corps.decode("utf-8", "replace")
    internes, externes = set(), set()
    hote = urllib.parse.urlparse(base).netloc.replace("www.", "")
    for brut in re.findall(r'<a[^>]+href=["\']([^"\']+)["\']', page, re.I):
        # Une adresse ecrite dans du HTML porte ses entites : « &amp; » et non
        # « & ». Sans ce decodage, le robot demandait litteralement
        # « ?utm_source=x&amp;utm_medium=y » — une adresse que personne n'a
        # jamais publiee — et declarait mort un lien parfaitement valide.
        brut = html.unescape(brut.strip())
        if not brut or IGNORER.match(brut):
            continue
        absolu = urllib.parse.urljoin(url, brut)
        if not absolu.startswith("http"):
            continue
        absolu = absolu.split("#")[0]
        if urllib.parse.urlparse(absolu).netloc.replace("www.", "") == hote:
            internes.add(absolu)
        else:
            externes.add(absolu)
    return internes, externes


def urls_du_sitemap(base):
    for chemin in ("/sitemap.xml", "/sitemap-0.xml", "/sitemap_index.xml"):
        code, corps, _ = demander(base + chemin, "GET")
        if code != 200 or not corps:
            continue
        contenu = corps.decode("utf-8", "replace")
        adresses = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", contenu, re.I)
        if adresses and all(a.endswith(".xml") for a in adresses[:3]):
            tout = []
            for sous in adresses[:10]:
                c2, b2, _ = demander(sous, "GET")
                if c2 == 200:
                    tout += re.findall(r"<loc>\s*([^<\s]+)\s*</loc>",
                                       b2.decode("utf-8", "replace"), re.I)
            return tout
        if adresses:
            return adresses
    return [base + "/"]


def main():
    horodatage = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    tour = int(os.environ.get("GITHUB_RUN_NUMBER", "0"))
    filtre = [s.strip() for s in os.environ.get("LIENS_SITES", "").split(",") if s.strip()]
    sites = [s for s in SITES if not filtre or s["nom"] in filtre]

    morts, bloques = [], []
    total_liens = 0

    for site in sites:
        pages = urls_du_sitemap(site["base"])
        if len(pages) > PAGES_PAR_TOUR:
            depart = (tour * PAGES_PAR_TOUR) % len(pages)
            pages = (pages + pages)[depart:depart + PAGES_PAR_TOUR]

        internes, externes = set(), set()
        with ThreadPoolExecutor(max_workers=PARALLELE) as pool:
            for i, e in pool.map(lambda u: liens_de_la_page(site["base"], u), pages):
                internes |= i
                externes |= e

        # Les externes sont rognes : verifier 5000 adresses tierces a chaque
        # tour serait impoli envers elles et inutile pour nous. La rotation
        # les couvre toutes au fil des passages.
        externes = sorted(externes)
        rognes = len(externes) - EXTERNES_PAR_TOUR
        if rognes > 0:
            depart = (tour * EXTERNES_PAR_TOUR) % len(externes)
            externes = (externes + externes)[depart:depart + EXTERNES_PAR_TOUR]

        total_liens += len(internes) + len(externes)
        print(f"{site['nom']:20} {len(pages):4} pages · {len(internes):4} liens internes · "
              f"{len(externes):4} externes" + (f" (sur {len(externes) + rognes})" if rognes > 0 else ""))
        if rognes > 0:
            print(f"{'':20} ⚠ {rognes} liens externes non verifies ce tour, "
                  f"ils le seront au suivant")

        def controler(url, genre):
            etat, detail = etat_du_lien(url)
            if etat == "mort":
                morts.append({"site": site["nom"], "genre": genre, "url": url,
                              "detail": detail})
            elif etat == "bloque":
                bloques.append({"site": site["nom"], "genre": genre, "url": url,
                                "detail": detail})

        with ThreadPoolExecutor(max_workers=PARALLELE) as pool:
            list(pool.map(lambda u: controler(u, "interne"), internes))
            list(pool.map(lambda u: controler(u, "externe"), externes))

    internes_morts = [m for m in morts if m["genre"] == "interne"]
    externes_morts = [m for m in morts if m["genre"] == "externe"]

    print(f"\n🔴 {len(internes_morts)} liens INTERNES morts")
    print(f"🟠 {len(externes_morts)} liens externes morts")
    print(f"⚪ {len(bloques)} bloques aux robots (pas forcement morts)")

    os.makedirs("docs/ronde", exist_ok=True)
    with open("docs/ronde/liens-morts.json", "w", encoding="utf-8") as f:
        json.dump({"verifie_le": horodatage, "liens_controles": total_liens,
                   "morts": morts, "bloques": bloques}, f, ensure_ascii=False, indent=2)
        f.write("\n")

    lignes = [
        "# Les liens qui ne menent nulle part",
        "",
        f"Releve du **{horodatage}** · {total_liens} liens controles.",
        "",
        "Un guide de voyage vit de ses liens. Un lien mort, c'est un lecteur qui",
        "arrive sur une erreur au moment precis ou il faisait confiance au guide.",
        "",
        "| | Combien | Qui repare |",
        "|---|---|---|",
        f"| 🔴 liens **internes** morts | **{len(internes_morts)}** | nous, c'est notre faute |",
        f"| 🟠 liens externes morts | {len(externes_morts)} | nous, en retirant le lien |",
        f"| ⚪ bloques aux robots | {len(bloques)} | personne — a ne PAS retirer |",
        "",
        "⚠️ **Un lien ⚪ n'est pas mort.** Beaucoup de sites repondent 403 a un",
        "robot tout en marchant parfaitement dans un navigateur. Les retirer",
        "serait pire que le probleme qu'on corrige.",
        "",
    ]
    for titre, liste in (("🔴 Liens internes morts", internes_morts),
                         ("🟠 Liens externes morts", externes_morts)):
        if not liste:
            continue
        lignes += [f"## {titre} — {len(liste)}", ""]
        for m in liste[:80]:
            lignes.append(f"- `{m['url']}` — {m['detail']}  \n  *(sur {m['site']})*")
        if len(liste) > 80:
            lignes.append(f"- … et {len(liste) - 80} autres dans `liens-morts.json`")
        lignes.append("")
    if not morts:
        lignes += ["## Rien a signaler", "",
                   "Tous les liens controles menent quelque part.", ""]

    with open("docs/ronde/LIENS-MORTS.md", "w", encoding="utf-8") as f:
        f.write("\n".join(lignes))

    print("\nConstat ecrit : docs/ronde/LIENS-MORTS.md")
    # Un lien interne mort est notre faute et se repare : ca merite la croix
    # rouge. Un lien externe mort ne depend pas de nous.
    return 1 if internes_morts else 0


if __name__ == "__main__":
    sys.exit(main())
