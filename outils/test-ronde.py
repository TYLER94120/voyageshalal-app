#!/usr/bin/env python3
"""La ronde doit mesurer ce que le VISITEUR recoit, pas ce que le fichier dit.

Le 11 aout a 04h02, la ronde a signale trois « titres coupes par Google ».
Verification : 57, 57 et 60 caracteres reels. Aucun n'etait coupe.

La cause tient en six caracteres. Dans la source d'une page, une apostrophe
s'ecrit `&#x27;` et une esperluette `&amp;`. Le robot comptait six caracteres
la ou Google en affiche un. Sur le balayage complet : 160 titres declares trop
longs, dont **104 prouves conformes**. J'avais envoye l'agent VoyagesHalal en
reparer 104 qui n'avaient rien.

Ce test verrouille la regle. Aucun reseau : on donne du HTML, on regarde ce
que le robot en lit.

    python3 outils/test-ronde.py
"""

import importlib.util
import os
import sys

CHEMIN = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ronde-des-sites.py")
spec = importlib.util.spec_from_file_location("ronde", CHEMIN)
robot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(robot)

MOTIF_TITRE = r"<title[^>]*>(.*?)</title>"
echecs = 0


def dire(ok, quoi, detail=""):
    global echecs
    print(f"{'✓' if ok else '✗'} {quoi}" + (f" — {detail}" if detail else ""))
    if not ok:
        echecs += 1


def titre_lu(source):
    return robot.balise(source, MOTIF_TITRE)


# ── 1. L'apostrophe echappee vaut UN caractere, pas six ───────────────────
# Cas reel du 11 aout : voyageshalal.fr/guides/hotel-halal-tout-savoir
BRUT = "Hôtel halal : tout ce qu&#x27;il faut savoir avant de réserver"
lu = titre_lu(f"<html><head><title>{BRUT}</title></head></html>")
dire(lu == "Hôtel halal : tout ce qu'il faut savoir avant de réserver",
     "&#x27; est lu comme une apostrophe", lu)
dire(len(lu) == 57, "le titre reel fait 57 caracteres, pas 62",
     f"{len(lu)} caracteres (source : {len(BRUT)})")
dire(len(lu) <= robot.TITRE_MAX,
     "ce titre n'est donc PAS coupe par Google — il ne doit rien declencher")

# ── 2. L'esperluette echappee aussi ───────────────────────────────────────
# Cas reel : gohalaltravel.com/guides/solo-female-muslim-travel
BRUT2 = "Solo Female Muslim Travel: Safe Destinations &amp; Honest Advice"
lu2 = titre_lu(f"<title>{BRUT2}</title>")
dire("&amp;" not in lu2 and " & " in lu2, "&amp; est lu comme une esperluette", lu2)
dire(len(lu2) == 60 and len(BRUT2) == 64,
     "60 caracteres reels la ou le robot en comptait 64",
     f"reel {len(lu2)} / source {len(BRUT2)}")

# ── 3. Un titre VRAIMENT trop long reste detecte ──────────────────────────
# Le correctif ne doit pas rendre le robot aveugle : c'est le risque de toute
# correction de faux positif.
LONG = "Guide complet des destinations halal en Asie du Sud-Est pour 2026 et au-dela"
lu3 = titre_lu(f"<title>{LONG}</title>")
dire(len(lu3) > robot.TITRE_MAX,
     "un titre reellement trop long est toujours vu", f"{len(lu3)} caracteres")

# ── 4. Les accents deja ecrits en clair ne bougent pas ────────────────────
lu4 = titre_lu("<title>Restaurants halal à Paris — le guide</title>")
dire(lu4 == "Restaurants halal à Paris — le guide",
     "un titre sans entite traverse le robot inchange", lu4)

# ── 5. Les entites numeriques decimales aussi (&#39;) ─────────────────────
lu5 = titre_lu("<title>Ramadan : qu&#39;est-ce qui casse le jeûne ?</title>")
dire(lu5 == "Ramadan : qu'est-ce qui casse le jeûne ?",
     "&#39; (decimal) est lu comme une apostrophe", lu5)

# ── 6. La description est mesuree pareil ──────────────────────────────────
# Elle a un seuil MINIMUM : une entite non decodee la fait paraitre plus
# longue qu'elle n'est, et masque donc une description trop courte.
desc = robot.balise(
    '<meta name="description" content="Tout sur l&#x27;hôtel halal">',
    r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']')
dire(desc == "Tout sur l'hôtel halal",
     "la description est decodee elle aussi", desc)

# ── 7. Pas de balise : rien, et surtout pas une erreur ────────────────────
dire(titre_lu("<html><head></head></html>") is None,
     "une page sans titre rend None, le robot le signalera comme grave")

# ── 8 à 12. Du français sur le domaine anglais ────────────────────────────
# Mesuré le 11 août : sur les 15 pages de lieu anglaises vues par la ronde, les
# 15 portaient un nom de lieu en français. La balise <html lang> ne voyait rien
# — elle annonce « en » et elle dit vrai. C'est le contenu qui ment, et c'est le
# contenu que Google lit pour décider à qui montrer la page.
print()
CAS_FRANCAIS = [
    "Where to pray at Café sympa sorti de des direction berkane — Fès",
    "Where to pray at Coin prière dans un restaurant familial — Marrakech",
    "Where to pray at Resto avec piscine — Tafoughalt",
]
for t in CAS_FRANCAIS:
    dire(len(robot.mots_francais_de(t)) >= robot.MINIMUM_MOTS,
         "détecté comme français", t[:48] + "…")

# Le risque de ce contrôle est de crier sur des pages saines. Un titre anglais
# qui cite un lieu marocain ou un mot français passé en anglais ne doit RIEN
# déclencher — c'est la moitié qui compte le plus dans ce test.
CAS_ANGLAIS = [
    "Where to pray in Marrakech — prayer spots",
    "Halal restaurants in Fès and Café de la Poste",
    "Where to pray at Riad Essaouira",
    "Muslim-friendly hotels in Casablanca | GoHalalTravel",
]
for t in CAS_ANGLAIS:
    n = len(robot.mots_francais_de(t))
    dire(n < robot.MINIMUM_MOTS, "laissé tranquille (titre anglais légitime)",
         f"{n} mot(s) — {t[:44]}")

# Et le contrôle ne s'applique QU'AU domaine anglais : le site français a le
# droit d'être écrit en français.
dire(any(s["langue"] == "fr" for s in robot.SITES)
     and any(s["langue"] == "en" for s in robot.SITES),
     "le contrôle sait quels domaines sont anglais et lesquels sont français")

# ── 13 à 16. Le rapport doit dire quelle PART du site il a vue ────────────
# Le 11 août, RONDE.md est passé de 28 défauts à 1 en trois heures. Rien
# n'était réparé : la rotation avait simplement changé de tranche. Le tableau
# se lisait pourtant comme un verdict sur le site entier.
#
# Ce test fait tourner la ronde EN ENTIER, sans réseau, et relit le fichier
# produit. C'est le seul moyen de vérifier ce que GitHub Actions écrira
# vraiment — le reste du test ne contrôle que des morceaux.
print()
import os as _os, tempfile

PAGES = {"https://gohalaltravel.com/p%d" % i for i in range(60)}


def _faux_sitemap(base):
    return [base + "/"] + sorted(base + "/p%d" % i for i in range(60))


def _fausse_page(url, methode="GET", delai=None):
    # Plus de 500 caracteres : en dessous, la ronde crie « page quasi vide » —
    # a juste titre. Une page d'essai trop courte ferait echouer ce test pour
    # une raison qui n'a rien a voir avec ce qu'il mesure.
    corps = (
        "<html lang='en'><head><title>Where to pray in Fez</title>"
        "<meta name='description' content='A long enough description about "
        "prayer rooms in Fez for travellers who need one while visiting.'>"
        "</head><body><h1>Fez</h1><p>" + ("Prayer rooms in Fez. " * 30) +
        "</p></body></html>"
    )
    return (200, corps.encode("utf-8"), 0.1, None)


robot.urls_du_sitemap = _faux_sitemap
robot.chercher = _fausse_page
robot.SITES = [{"nom": "gohalaltravel.com", "base": "https://gohalaltravel.com",
                "langue": "en"}]

_avant = _os.getcwd()
with tempfile.TemporaryDirectory() as dossier:
    _os.chdir(dossier)
    _os.environ.pop("RONDE_COMPLETE", None)
    _os.environ["GITHUB_RUN_NUMBER"] = "1"
    try:
        robot.main()
    except SystemExit:
        pass
    rapport = open("docs/ronde/RONDE.md", encoding="utf-8").read()
    _os.chdir(_avant)

dire("Cette ronde a regarde" in rapport,
     "le rapport de patrouille annonce sa couverture")
dire("sur 61" in rapport, "il donne le total des pages connues, pas seulement les vues",
     [l for l in rapport.splitlines() if "sur 61" in l][:1])
dire("CETTE TRANCHE" in rapport,
     "il previent que les chiffres ne valent pas pour le site entier")
dire("BALAYAGE-COMPLET.md" in rapport,
     "il renvoie vers le releve complet pour le compte reel")

print("\n" + ("✓ La ronde mesure ce que Google affiche, pas ce que le fichier contient."
              if echecs == 0 else f"✗ {echecs} echec(s)"))
sys.exit(0 if echecs == 0 else 1)
