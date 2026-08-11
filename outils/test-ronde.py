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

print("\n" + ("✓ La ronde mesure ce que Google affiche, pas ce que le fichier contient."
              if echecs == 0 else f"✗ {echecs} echec(s)"))
sys.exit(0 if echecs == 0 else 1)
