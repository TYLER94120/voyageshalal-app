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
# On importe la FONCTION et non le module : plusieurs fonctions d'ici recoivent
# la source de la page dans une variable nommee `html`, qui masquerait le
# module et ferait echouer `html.unescape` a l'execution.
from html import unescape
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
PAUSE_COMPLET = 0.0  # pause entre deux pages, en balayage complet seulement
AGENT = "Mozilla/5.0 (compatible; ronde-empire/1.0)"

# ── Le balayage complet se rattrape tout seul ────────────────────────────────
#
# Mesure du 12 aout 2026, 6 h. Le rendez-vous quotidien « 47 2 * * * », pose la
# veille a 10 h 18, N'A JAMAIS TOURNE. Ce n'est pas une faute de cron : GitHub
# saute une partie des rendez-vous programmes. Sur les 37 heures precedentes,
# la patrouille « toutes les 30 minutes » aurait du tourner 74 fois. Elle a
# tourne 30 fois, avec un trou de trois heures entre 00 h 08 et 03 h 05 — et
# 02 h 47 tombait dedans.
#
# Pendant ce temps, RONDE.md envoyait les quatre agents, toutes les demi-heures,
# vers un releve complet vieux de quarante heures et portant en tete la mention
# « CE RELEVE EST FAUX ». Personne ne pouvait le savoir : rien ne disait son age.
#
# La lecon : ne pas dependre d'un evenement qu'on ne controle pas, mais d'un
# ETAT qu'on peut lire. Chaque patrouille regarde l'age du dernier balayage
# complet ; s'il est trop vieux, elle se promeut elle-meme. Peu importe alors
# quels rendez-vous GitHub honore ou saute.
HEURES_AVANT_RELANCE = 20

# Et seulement dans ces heures-la (UTC), soit 4 h - 8 h a Paris. Deux raisons :
# le balayage complet, ce sont pres de 2 000 requetes vers nos propres sites, et
# c'est le moment ou personne ne visite ; surtout, si un balayage echoue sans
# ecrire sa date, la fenetre borne les nouvelles tentatives a la nuit au lieu de
# lancer une tempete de balayages toutes les 30 minutes pendant une journee.
HEURES_DE_RATTRAPAGE = range(2, 6)

# Les sites, et ce qu'on attend d'eux. `langue` = ce que <html lang> DOIT
# porter : c'est le defaut le plus traitre du bi-domaine, parce que la page
# s'affiche parfaitement... dans la mauvaise langue.
SITES = [
    # islampasapas.fr : PRET, PAS ACTIF. Le domaine pointe encore vers la page
    # de parcage OVH (constat de l'agent Apprentissage, 14 aout) pendant que le
    # site vit sur Vercel. L'activer maintenant ferait sonner un GRAVE toutes
    # les 30 minutes pour un site qu'on SAIT injoignable — une alarme qu'on
    # ignore des le premier jour ne protege plus rien ensuite. Le jour ou
    # Mohamed branche le domaine, on retire le diese et la ronde le surveille
    # comme les quatre autres.
    # {"nom": "islampasapas.fr", "base": "https://islampasapas.fr", "langue": "fr"},
    {"nom": "voyageshalal.fr",  "base": "https://voyageshalal.fr",  "langue": "fr"},
    {"nom": "gohalaltravel.com", "base": "https://gohalaltravel.com", "langue": "en"},
    {"nom": "halalgpt.fr",      "base": "https://halalgpt.fr",      "langue": "fr"},
    {"nom": "halalcheck.fr",    "base": "https://halalcheck.fr",    "langue": "fr"},
]

GRAVE, DEFAUT, SURVEILLER = "grave", "defaut", "surveiller"
SYMBOLE = {GRAVE: "🔴", DEFAUT: "🟠", SURVEILLER: "🟡"}


def chercher(url, methode="GET", delai=None):
    """Rend (code, corps, secondes, erreur). Ne leve jamais."""
    requete = urllib.request.Request(url, method=methode, headers={
        "User-Agent": AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    })
    depart = time.monotonic()
    try:
        contexte = ssl.create_default_context()
        with urllib.request.urlopen(requete, timeout=delai or DELAI, context=contexte) as r:
            corps = r.read(400_000) if methode == "GET" else b""
            return r.status, corps, time.monotonic() - depart, None
    except urllib.error.HTTPError as e:
        return e.code, b"", time.monotonic() - depart, None
    except Exception as e:
        return 0, b"", time.monotonic() - depart, f"{type(e).__name__}: {e}"


def texte(corps):
    return corps.decode("utf-8", "replace")


# ── Detecter du francais sur le domaine anglais ─────────────────────────────
#
# Mesure du 11 aout : sur les 15 pages de lieu anglaises relevees par la ronde,
# les 15 portaient un nom de lieu ecrit en francais — « Where to pray at Cafe
# sympa sorti de des direction berkane ». Google lit ces pages, y voit du
# francais, et les propose a des gens qui cherchent en francais : 54 % des vues
# du domaine anglais venaient de requetes non anglaises, pour zero clic.
#
# La balise <html lang> ne voit rien de tout cela : elle annonce « en », et
# elle dit vrai. C'est le CONTENU qui ment.
#
# On ne detecte pas « du francais » — on detecte des mots-outils francais, les
# seuls qui ne peuvent pas etre un nom propre. « Cafe », « Hotel », « Riad »,
# « Fes » apparaissent legitimement dans un titre anglais : ce sont des lieux.
# « dans », « avec », « sorti », « magnifique » ne le sont jamais.
MOTS_FRANCAIS = {
    "dans", "avec", "sans", "pour", "sous", "entre", "chez", "vers",
    "les", "une", "des", "du", "aux", "cette", "ce",
    "est", "sont", "qui", "que", "mais", "tres", "bien",
    "priere", "prieres", "mosquee", "eglise", "resto", "restaura", "repas",
    "sympa", "magnifique", "traditionnel", "special", "familial", "excentre",
    "sorti", "rendez", "piscine", "dune", "fruit", "petit",
    "bord", "montagne", "minutes", "direction", "coin", "salle", "ville",
}

# Il en faut DEUX. Un seul serait trop souvent un nom propre — et j'ai passe la
# nuit a reparer des robots qui envoyaient reparer des pages saines.
MINIMUM_MOTS = 2

ACCENTS = str.maketrans("àâäéèêëîïôöùûüç", "aaaeeeeiioouuuc")


def mots_francais_de(texte):
    """Rend les mots-outils francais trouves dans un texte."""
    if not texte:
        return []
    plat = texte.lower().translate(ACCENTS)
    return sorted(set(m for m in re.findall(r"[a-z]+", plat) if m in MOTS_FRANCAIS))


def balise(html, motif):
    """Rend la valeur REELLE d'une balise, entites HTML decodees.

    Le 11 aout, la ronde a signale 160 titres « coupes par Google ». Mesure
    faite : 104 d'entre eux tenaient largement sous la limite. La cause tient
    en six caracteres — dans la source d'une page, une apostrophe s'ecrit
    « &#x27; » et une esperluette « &amp; ». Le robot comptait donc six
    caracteres la ou le lecteur, et Google, en voient un seul.

    Un titre de 57 caracteres etait declare trop long a 62. Et j'ai envoye
    l'agent VoyagesHalal reparer 104 titres qui n'avaient rien.

    Ce qu'on mesure doit etre ce que le visiteur recoit, jamais ce que le
    fichier contient. Meme faute, meme correctif que dans liens-morts.py, ou
    « &amp; » dans une adresse faisait declarer morts des liens valides."""
    m = re.search(motif, html, re.I | re.S)
    return (unescape(m.group(1)).strip() if m else None)


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
    if PAUSE_COMPLET:
        time.sleep(PAUSE_COMPLET)
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

    # Le domaine anglais ne doit pas parler francais a Google.
    #
    # Ce controle est volontairement prudent : deux mots-outils minimum, et
    # uniquement dans le titre et la description — ce que Google lit pour
    # decider a qui montrer la page. Une page anglaise qui cite « Cafe de la
    # Poste » ou « Riad Essaouira » ne declenche rien : ce sont des noms de
    # lieux, pas de la prose francaise.
    if site["langue"].startswith("en") and titre:
        trouves = mots_francais_de(titre)
        if len(trouves) >= MINIMUM_MOTS:
            noter(DEFAUT, "titre en francais sur le domaine anglais",
                  f"mots francais : {', '.join(trouves[:6])} — « {titre[:56]}… »")

    desc = balise(html, r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']')
    if not desc:
        desc = balise(html, r'<meta[^>]+content=["\'](.*?)["\'][^>]+name=["\']description["\']')
    if not desc:
        noter(DEFAUT, "aucune description", "Google en invente une, souvent mauvaise")
    elif len(desc.strip()) < DESC_MIN:
        noter(SURVEILLER, f"description trop courte ({len(desc.strip())} car.)")

    if site["langue"].startswith("en") and desc:
        trouves = mots_francais_de(desc)
        if len(trouves) >= MINIMUM_MOTS:
            noter(DEFAUT, "description en francais sur le domaine anglais",
                  f"mots francais : {', '.join(trouves[:6])}")

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


# ── Les promesses tenues en production ──────────────────────────────────────
#
# Pourquoi ceci existe, ecrit le 12 aout au matin.
#
# Cette nuit j'ai livre deux adresses sur halalgpt.fr : l'index de la recherche
# interne, et l'etat du compteur de passerelles. Les deux marchent en local,
# les deux sont testees. Et je n'ai AUCUN moyen de savoir si elles marchent en
# ligne : le proxy de l'atelier refuse halalgpt.fr (403 sur le tunnel).
#
# Pire, leurs pannes sont silencieuses par construction :
#   · si l'index de recherche ne repond pas, la recherche retombe sur les
#     titres — exactement ce qu'elle faisait avant, sans un mot a l'ecran.
#     C'est voulu : une recherche degradee vaut mieux qu'une recherche cassee.
#     Mais alors PERSONNE ne remarquerait qu'elle est degradee pour toujours.
#   · si le compteur de passerelles n'a pas de base, il ne compte rien. Le
#     25 aout on lirait zero et on conclurait « les passerelles n'amenent
#     personne ».
#
# Ce robot, lui, tourne sur GitHub et atteint les quatre sites — il vient d'en
# balayer 1967 pages. C'est donc lui qui peut poser la question a ma place.
#
# Regle pour ajouter une promesse ici : elle doit etre VERIFIABLE d'un coup
# d'oeil (un mot attendu dans la reponse), et sa panne doit etre SILENCIEUSE
# ailleurs. Une page qui casse bruyamment n'a pas besoin d'etre ici : la ronde
# ordinaire la voit deja.
PROMESSES = [
    {
        "site": "halalgpt.fr",
        "chemin": "/api/recherche",
        "attendu": '"corps"',
        "quoi": "l'index de la recherche interne ne repond pas",
        "detail": "la recherche de /questions retombe sur les titres, sans le dire",
    },
    {
        "site": "halalgpt.fr",
        "chemin": "/api/passerelle",
        "attendu": '"vivant":true',
        "quoi": "le compteur de passerelles n'est pas vivant",
        "detail": "la seule mesure que les agents peuvent lire seuls n'enregistre rien",
    },
]


def tenir_ses_promesses(site):
    """Les adresses qui doivent repondre, et dont la panne ne se verrait pas.

    Rend des defauts au meme format que le reste de la ronde. On ne classe
    jamais GRAVE : un visiteur recoit toujours ses pages. Ce qui tombe, c'est
    une fonction ou une mesure — grave pour nous, invisible pour lui.
    """
    defauts = []
    for p in PROMESSES:
        if p["site"] != site["nom"]:
            continue
        url = site["base"] + p["chemin"]
        code, corps, _, erreur = chercher(url)
        # On DIT qu'on a regarde, meme quand tout va bien. Sans cette ligne, un
        # rapport a zero defaut veut dire deux choses opposees — « verifie, tout
        # va bien » et « pas regarde du tout » — et rien ne permet de trancher.
        # C'est la meme faute que celle du compteur de passerelles ce matin :
        # un silence n'est pas une reponse.
        print(f"{'':20} promesse {p['chemin']:18} "
              f"{'✓' if not erreur and code < 400 else '✗'} code {code or '—'}")
        if erreur or code >= 400:
            defauts.append({"niveau": DEFAUT, "site": site["nom"], "url": url,
                            "quoi": p["quoi"],
                            "detail": (erreur or f"code {code}") + " — " + p["detail"]})
            continue
        # On lit ce qui est REVENU, pas seulement le code : une adresse qui
        # repond 200 avec une page d'erreur est le cas le plus courant, et le
        # plus trompeur.
        texte = (corps or b"").decode("utf-8", "replace")
        if p["attendu"] not in texte:
            defauts.append({"niveau": DEFAUT, "site": site["nom"], "url": url,
                            "quoi": p["quoi"],
                            "detail": f"code {code} mais « {p['attendu']} » absent "
                                      f"de la reponse — " + p["detail"]})
    return defauts


def ronde_du_site(site, tour, complet=False):
    defauts = []
    base = site["base"]

    code, corps, _, erreur = chercher(base + "/")
    if erreur or code >= 400:
        defauts.append({"niveau": GRAVE, "site": site["nom"], "url": base + "/",
                        "quoi": "le site entier ne repond pas",
                        "detail": erreur or f"code {code}"})
        # Trois valeurs ici aussi : le site est tombe, on n'a rien vu et on ne
        # connait rien. Ce chemin-la n'est emprunte qu'un jour de panne — donc
        # exactement le jour ou une erreur de plus serait le plus couteuse.
        return defauts, 0, 0

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
    if complet:
        tranche = traine
    elif traine:
        depart = (tour * PAR_TOUR) % len(traine)
        tranche = (traine + traine)[depart:depart + PAR_TOUR]
    else:
        tranche = []
    a_voir = accueil + tranche

    with ThreadPoolExecutor(max_workers=PARALLELE) as pool:
        for lot in pool.map(lambda u: examiner(site, u), a_voir):
            defauts += lot

    # A chaque tour, pas par rotation : ce sont deux adresses, et leur panne ne
    # se verrait nulle part ailleurs.
    defauts += tenir_ses_promesses(site)

    # On rend aussi le total connu : sans lui, le rapport ne peut pas dire
    # quelle PART du site cette ronde a vue — et un chiffre de defauts sans
    # sa couverture se lit comme un verdict sur tout le site.
    return defauts, len(a_voir), len(adresses)


def confirmer_les_graves(defauts):
    """Un defaut grave ne s'annonce jamais sur un seul essai.

    La ronde interroge jusqu'a 6 pages a la fois. Sur un balayage complet,
    c'est plus de 1700 requetes en quelques minutes — assez pour faire tousser
    un hebergement et provoquer des delais depasses qui n'ont RIEN a voir avec
    l'etat du site.

    Annoncer « 29 pages mortes » alors que c'est notre propre robot qui a
    sature le serveur serait une accusation fausse, et elle enverrait un agent
    reparer un defaut qui n'existe pas. On recontrole donc chaque grave, un par
    un, sans parallelisme, avec plus de patience.

    Une page qui repond au controle calme n'est pas morte : elle est instable
    sous charge. C'est une vraie information, mais ce n'est pas la meme.
    """
    muettes = [d for d in defauts
               if d["niveau"] == GRAVE and "ne repond pas" in d["quoi"]]
    if not muettes:
        return defauts

    print(f"\n{len(muettes)} page(s) muette(s) : second controle, une par une, "
          f"sans parallelisme.")
    verdict = {}
    for d in muettes:
        time.sleep(1.0)
        code, corps, duree, erreur = chercher(d["url"], delai=45)
        vivante = not erreur and code == 200 and len(corps) >= 500
        verdict[d["url"]] = (vivante, duree, code, erreur)
        print(f"  {'repond' if vivante else 'MUETTE'}  {duree:5.1f} s  {d['url']}")

    sortie = []
    for d in defauts:
        v = verdict.get(d["url"]) if d["niveau"] == GRAVE and "ne repond pas" in d["quoi"] else None
        if v and v[0]:
            sortie.append({**d, "niveau": SURVEILLER,
                           "quoi": "page instable sous charge",
                           "detail": f"muette pendant la ronde, repond en {v[1]:.1f} s "
                                     f"au controle calme — a surveiller, pas a reparer"})
        elif v:
            sortie.append({**d, "detail": d["detail"] + " — confirme au second controle"})
        else:
            sortie.append(d)
    return sortie


def substance(defauts):
    """Ce qui merite un commit. On laisse de cote les durees, qui bougent a
    chaque ronde sans rien vouloir dire."""
    return sorted((d["site"], d["url"], d["niveau"],
                   re.sub(r"\([\d.,]+ s\)", "(lente)", d["quoi"]))
                  for d in defauts)


def age_du_balayage_complet(maintenant=None):
    """Depuis combien d'heures le dernier balayage complet a-t-il ete ecrit ?

    On lit la date DANS le fichier, jamais sa date de modification : sur un
    poste GitHub, `actions/checkout` reecrit tous les fichiers a l'instant du
    telechargement, donc leur date de modification vaut « il y a trois
    secondes » pour un releve vieux de deux jours. C'est exactement le genre de
    mesure qui rassure a tort.

    Rend None si on ne sait pas — jamais zero : « je ne sais pas » et « c'est
    tout frais » ne doivent pas se confondre.
    """
    try:
        with open("docs/ronde/balayage-complet.json", encoding="utf-8") as f:
            ecrit = json.load(f).get("ronde_du", "")
        quand = datetime.strptime(ecrit, "%Y-%m-%d %H:%M UTC").replace(tzinfo=timezone.utc)
    except Exception:
        return None
    maintenant = maintenant or datetime.now(timezone.utc)
    return (maintenant - quand).total_seconds() / 3600


def faut_il_rattraper(maintenant, age):
    """Cette patrouille doit-elle se promouvoir en balayage complet ?

    Sortie de `main()` pour une raison precise : une decision qui lit l'heure
    du mur au fond d'une fonction de deux cents lignes ne se teste pas. La
    premiere version l'y cachait, et le test de bout en bout est devenu
    imprevisible — il passait le jour et echouait entre 2 h et 6 h UTC.

    `age` a None veut dire « aucun releve lisible », pas « releve tout frais » :
    on rattrape.
    """
    return maintenant.hour in HEURES_DE_RATTRAPAGE and (
        age is None or age >= HEURES_AVANT_RELANCE
    )


FICHIER_PLAFOND = "docs/ronde/plafond.json"


def lire_plafond():
    """Le nombre de defauts que chaque site a le droit d'avoir, aujourd'hui."""
    try:
        with open(FICHIER_PLAFOND, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def cliquet(compte_par_site, par_niveau):
    """Le verrou qui fait descendre les defauts sans jamais crier au loup.

    Pourquoi un cliquet et pas un simple seuil
    ------------------------------------------
    Ce script disait, et il avait raison : « seul le grave fait echouer la
    ronde ; une alerte qui se declenche pour un titre trop long finirait
    ignoree, et le jour ou un site tombe vraiment, personne ne regarderait
    plus. »

    Mais le 13 aout, 87 defauts dormaient depuis des jours dans un rapport
    juste, et personne n'avait ete reveille. Les deux problemes sont le meme :
    une alarme permanente et une alarme absente finissent toutes deux en
    decor.

    Le cliquet tranche : on n'exige pas zero demain, on interdit de remonter.
    Chaque site part de son compte du jour. Si le compte descend, le plafond
    descend avec lui et ne remonte plus. S'il depasse, le controle vire au
    rouge — et cette fois c'est vrai, parce que ca veut dire qu'on a casse
    quelque chose de neuf.

    Sur un site nourri par une vague automatique chaque nuit, c'est la seule
    forme d'alarme qui tienne : elle ne parle que quand on recule.

    Ce que le cliquet ne fait PAS
    -----------------------------
    Il ne s'applique qu'au balayage COMPLET. La patrouille de 30 minutes ne
    regarde que 6 % du site, par rotation : comparer un echantillon tournant a
    un plafond fixe produirait une alarme rouge un jour sur deux, pour rien.
    C'est exactement l'erreur que les rapports de ce dossier passent leur temps
    a expliquer aux lecteurs.
    """
    plafond = lire_plafond()
    graves = {d["site"] for d in par_niveau[GRAVE]}
    defauts_par_site = {}
    for d in par_niveau[DEFAUT]:
        defauts_par_site[d["site"]] = defauts_par_site.get(d["site"], 0) + 1

    depassements, descentes, nouveau = [], [], dict(plafond)
    for ligne in compte_par_site:
        site = ligne["site"]
        # Un site injoignable inscrit deja un defaut GRAVE, plus precis que
        # tout ce que le cliquet pourrait dire. On ne touche pas a son plafond
        # avec un comptage qui n'a pas eu lieu.
        if site in graves or ligne["pages"] == 0:
            continue
        combien = defauts_par_site.get(site, 0)
        avant = plafond.get(site)
        if avant is None:
            nouveau[site] = combien
        elif combien > avant:
            depassements.append({"site": site, "avant": avant, "maintenant": combien})
        elif combien < avant:
            descentes.append({"site": site, "avant": avant, "maintenant": combien})
            nouveau[site] = combien

    if nouveau != plafond:
        with open(FICHIER_PLAFOND, "w", encoding="utf-8") as f:
            json.dump(nouveau, f, ensure_ascii=False, indent=1, sort_keys=True)
            f.write("\n")
    return depassements, descentes, nouveau


def main():
    debut = datetime.now(timezone.utc)
    horodatage = debut.strftime("%Y-%m-%d %H:%M UTC")
    tour = int(os.environ.get("GITHUB_RUN_NUMBER", "0"))

    # Balayage complet, a la demande : on regarde TOUTES les pages au lieu
    # d'une tranche. On ne le fait pas toutes les 30 minutes — ce serait des
    # milliers de requetes par heure pour re-constater ce qu'on sait deja.
    # Mais avant de reprocher a un agent « beaucoup de defauts », il faut le
    # chiffre exact, pas un echantillon.
    complet = os.environ.get("RONDE_COMPLETE", "").strip() not in ("", "0", "non")

    # Le rattrapage : voir HEURES_AVANT_RELANCE en haut de ce fichier. Une
    # patrouille de nuit qui trouve le releve complet perime prend le relais,
    # sans attendre qu'un rendez-vous programme veuille bien se declencher.
    age = age_du_balayage_complet(debut)
    if not complet and faut_il_rattraper(debut, age):
        complet = True
        print("Le releve complet date de "
              + ("jamais" if age is None else f"{age:.0f} h")
              + f" (limite : {HEURES_AVANT_RELANCE} h) — cette ronde le refait.\n")

    # Filtre facultatif : « voyageshalal.fr,gohalaltravel.com ».
    filtre = [s.strip() for s in os.environ.get("RONDE_SITES", "").split(",") if s.strip()]
    sites = [s for s in SITES if not filtre or s["nom"] in filtre]
    if filtre and not sites:
        print(f"Aucun site ne correspond a « {filtre} ».")
        return 0
    if complet:
        # On ralentit le balayage complet. Mesure du 10 aout, 17h12 : sur
        # 1751 pages a 6 requetes en parallele, 8 pages ont rendu une erreur de
        # POIGNEE DE MAIN SSL — pas un 404, pas une erreur serveur. C'est la
        # signature d'un hebergeur qui limite le debit d'une adresse qui l'a
        # interroge 1751 fois en quelques minutes, et ca produit de fausses
        # pannes en fin de balayage.
        #
        # C'est la troisieme fois dans la journee que mon propre robot fabrique
        # des defauts en tapant trop fort. Deux requetes a la fois et une pause
        # entre chaque : le balayage dure plus longtemps, et ce qu'il rend est
        # vrai. Un balayage rapide qui ment ne sert a rien.
        global PARALLELE, PAUSE_COMPLET
        PARALLELE = 2
        PAUSE_COMPLET = 0.35
        print("Balayage COMPLET : toutes les pages, doucement (2 a la fois).\n")

    tous, vues, connues = [], 0, 0
    # Le detail par site, garde pour le rapport et pas seulement pour la console.
    #
    # Mesure du 13 aout : le balayage complet annoncait « 1976 pages regardees »
    # et ne listait de defauts que pour deux sites sur quatre. Impossible d'y
    # lire la difference entre « halalgpt.fr a ete regarde et il est propre » et
    # « halalgpt.fr n'a jamais ete atteint ». Le chiffre par site existait — il
    # etait calcule ici et imprime juste en dessous — mais il mourait dans les
    # journaux de GitHub, que personne ne lit.
    #
    # Ce que ce tableau ne fait PAS, et pourquoi : la premiere version ajoutait
    # un avertissement « ce site n'a rendu aucune page ». Verification faite
    # dans `ronde_du_site`, zero page n'arrive que lorsque l'accueil ne repond
    # pas — cas qui inscrit deja un defaut GRAVE, « le site entier ne repond
    # pas », plus precis que l'avertissement. Deux alarmes pour un fait, ce
    # n'est pas deux fois plus sur, c'est une de trop. Le tableau se contente
    # donc de montrer ce qui a ete regarde.
    compte_par_site = []
    for site in sites:
        defauts, n, total = ronde_du_site(site, tour, complet)
        tous += defauts
        vues += n
        connues += total
        graves = sum(1 for d in defauts if d["niveau"] == GRAVE)
        compte_par_site.append({"site": site["nom"], "pages": n, "defauts": len(defauts)})
        print(f"{site['nom']:22} {n:3} pages · {len(defauts):3} defauts "
              f"dont {graves} graves")

    tous = confirmer_les_graves(tous)

    par_niveau = {n: [d for d in tous if d["niveau"] == n]
                  for n in (GRAVE, DEFAUT, SURVEILLER)}

    os.makedirs("docs/ronde", exist_ok=True)

    # Le cliquet, avant d'ecrire le constat pour qu'il puisse en parler, et
    # sur le balayage complet seulement — voir la fonction pour le pourquoi.
    depassements, descentes, plafond = [], [], lire_plafond()
    if complet:
        depassements, descentes, plafond = cliquet(compte_par_site, par_niveau)

    # Le balayage complet ecrit AILLEURS. Sinon il ecraserait le rapport que
    # les agents lisent toutes les 30 minutes, et la comparaison « qu'est-ce
    # qui a change » n'aurait plus de sens : on comparerait un echantillon de
    # 40 pages a un balayage de 800.
    fichier_json = "docs/ronde/balayage-complet.json" if complet else "docs/ronde/ronde.json"
    fichier_md = "docs/ronde/BALAYAGE-COMPLET.md" if complet else "docs/ronde/RONDE.md"

    ancien = None
    try:
        with open(fichier_json, encoding="utf-8") as f:
            ancien = json.load(f)
    except Exception:
        pass

    inchange = ancien is not None and substance(ancien.get("defauts", [])) == substance(tous)

    # Le balayage complet ecrit TOUJOURS, meme quand rien n'a bouge. Sa date
    # n'est pas de la decoration : c'est elle qui prouve qu'il a tourne, et
    # c'est elle que la patrouille lit pour decider de prendre le relais. Sans
    # cette ligne, un balayage qui ne trouve rien de neuf laisserait la date
    # d'avant — et toutes les rondes de la nuit se croiraient en retard, ce qui
    # ferait deux mille requetes de plus toutes les trente minutes.
    if complet:
        inchange = False

    if not inchange:
        with open(fichier_json, "w", encoding="utf-8") as f:
            json.dump({"ronde_du": horodatage, "pages_vues": vues,
                       "pages_par_site": compte_par_site, "defauts": tous},
                      f, ensure_ascii=False, indent=2)
            f.write("\n")

        lignes = [
            "# Balayage complet" if complet else "# La ronde des sites",
            "",
            f"**Dernier changement constate le {horodatage}.**",
            "",
        ]
        if complet:
            minutes = (datetime.now(timezone.utc) - debut).total_seconds() / 60
            lignes += [
                f"**{vues} pages regardees — le site entier.** Les chiffres "
                "ci-dessous",
                "valent donc pour tout ce que Google peut voir.",
                "",
                f"Balayage commence le {horodatage}, termine en "
                f"{minutes:.0f} minutes. Un balayage",
                "complet qui rendrait la main en quelques secondes n'aurait pas "
                "eu lieu :",
                "c'est a cette duree qu'on le reconnait.",
                "",
            ]
        else:
            part = round(100 * vues / connues) if connues else 0
            # L'age du releve complet, dit franchement. Le 12 aout, ce lien
            # envoyait les agents, toutes les demi-heures, vers un fichier
            # vieux de quarante heures qui portait en tete « CE RELEVE EST
            # FAUX ». Rien ne le disait. Un renvoi sans date est un piege.
            vieux = age_du_balayage_complet()
            quand = ("jamais fait" if vieux is None
                     else "de ce matin" if vieux < 12
                     else f"vieux de {vieux / 24:.0f} jour(s)" if vieux >= 24
                     else f"vieux de {vieux:.0f} h")
            lignes += [
                f"⚠️ **Cette ronde a regarde {vues} pages sur {connues} — "
                f"environ {part} %.**",
                "",
                "Les chiffres ci-dessous decrivent CETTE TRANCHE, pas le site "
                "entier. Un",
                "jour a 1 defaut et le lendemain a 28 ne veut pas dire que 27 "
                "choses ont",
                "casse dans la nuit : la rotation est simplement passee sur "
                "d'autres pages.",
                "Pour le compte complet, voir "
                f"[BALAYAGE-COMPLET.md](BALAYAGE-COMPLET.md) — **{quand}**.",
                "",
            ]
        lignes += [
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
            "### Ce que cette ronde a regarde, site par site",
            "",
            "Un site sans defaut plus bas a bien ete regarde : cette ligne le "
            "prouve.",
            "Sans elle, « absent de la liste » et « jamais ouvert » se lisaient "
            "pareil.",
            "",
            "| Site | Pages vues | Tous niveaux |"
            + (" 🟠 defauts | Plafond |" if complet else ""),
            "|---|---|---|" + ("---|---|" if complet else ""),
        ]
        # Mesure du 14 aout : la colonne « Defauts » comptait les trois niveaux
        # et la colonne « Plafond » n'en comptait qu'un. Le tableau affichait
        # « 33 » en face d'un plafond de 26 alors que le cliquet, lui, comparait
        # 26 a 26 et ne signalait rien. Un lecteur en concluait qu'on avait
        # recule. Deux colonnes cote a cote doivent compter la meme chose,
        # sinon le tableau ment sans qu'une seule ligne soit fausse.
        defauts_seuls = {}
        for d in par_niveau[DEFAUT]:
            defauts_seuls[d["site"]] = defauts_seuls.get(d["site"], 0) + 1
        lignes += [
            f"| {c['site']} | {c['pages']} | {c['defauts']} |"
            + (f" {defauts_seuls.get(c['site'], 0)} | "
               f"{plafond.get(c['site'], '—')} |" if complet else "")
            for c in compte_par_site
        ]
        lignes += [""]
        if complet:
            lignes += [
                "**Le plafond ne remonte jamais.** Il part du compte du jour ou "
                "il a ete",
                "pose ; chaque fois que les defauts descendent, il descend avec "
                "eux et s'y",
                "verrouille. Si un chiffre le depasse, le controle vire au rouge "
                "— ce qui",
                "veut dire qu'on vient de casser quelque chose de neuf, pas "
                "qu'un vieux",
                "defaut traine encore.",
                "",
                "C'est voulu ainsi : une alarme qui sonnerait pour chaque titre "
                "trop long",
                "serait ignoree en trois jours, et le jour ou un site tombe "
                "vraiment,",
                "personne ne regarderait plus. Le cliquet ne parle que quand on "
                "recule.",
                "",
            ]
            if descentes:
                lignes += ["✅ **Le plafond vient de descendre :**", ""]
                for d in descentes:
                    lignes.append(
                        f"- {d['site']} : {d['avant']} → **{d['maintenant']}**")
                lignes.append("")
            if depassements:
                lignes += ["🔴 **On a recule — c'est ce qui fait echouer ce "
                           "controle :**", ""]
                for d in depassements:
                    lignes.append(
                        f"- {d['site']} : plafond {d['avant']}, "
                        f"compte **{d['maintenant']}**")
                lignes.append("")
        if not tous:
            # « Les quatre sites repondent » etait ecrit en dur, donc vrai meme
            # quand un site n'avait rendu aucune page. On compte maintenant.
            debout = [c for c in compte_par_site if c["pages"] > 0]
            lignes += ["## Rien a signaler", "",
                       f"{len(debout)} site(s) sur {len(compte_par_site)} ont rendu des "
                       "pages, et celles-ci sont correctes.", ""]
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

        with open(fichier_md, "w", encoding="utf-8") as f:
            f.write("\n".join(lignes))
        print(f"\nConstat ecrit : {fichier_md}")
    else:
        print("\nRien de nouveau depuis la derniere ronde : aucun fichier reecrit.")

    print(f"\n🔴 {len(par_niveau[GRAVE])}  🟠 {len(par_niveau[DEFAUT])}  "
          f"🟡 {len(par_niveau[SURVEILLER])}")

    if complet:
        total = sum(plafond.get(l["site"], 0) for l in compte_par_site)
        print(f"\nPlafond : {total} defauts toleres au total.")
        for d in descentes:
            print(f"  ↓ {d['site']} : {d['avant']} → {d['maintenant']}, "
                  "le plafond descend et ne remontera pas.")
        for d in depassements:
            print(f"  ✗ {d['site']} : {d['avant']} → {d['maintenant']} — "
                  "on a recule.")

    # Seul le grave fait echouer la ronde — plus, depuis le 13 aout, le
    # franchissement du cliquet. La raison d'origine tient toujours : une
    # alerte qui sonne pour chaque titre trop long finirait ignoree. Le cliquet
    # ne sonne pas pour les defauts connus, il sonne quand leur nombre REMONTE.
    # Il ne parle donc que d'une chose : on vient de casser quelque chose.
    return 1 if par_niveau[GRAVE] or depassements else 0


if __name__ == "__main__":
    sys.exit(main())
