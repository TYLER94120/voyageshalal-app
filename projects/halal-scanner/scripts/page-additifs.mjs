#!/usr/bin/env node
// Génère site/additifs.html — la liste publique de TOUT ce que le scanner
// surveille.
//
// Pourquoi une génération et pas une page écrite à la main : une liste
// recopiée se désynchronise du moteur au premier ajout d'additif, et le site
// se met alors à promettre autre chose que ce qu'il fait. Ici la page est
// construite à partir des tables réellement utilisées par l'analyse
// (site/halal.js et site/cosmetiques.js, compilées depuis lib/). Ce qui est
// affiché est donc, par construction, ce qui est détecté.
//
// Usage : npm run build:additifs   (après npm run build:site)

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE_PROJET = join(ICI, "..");
const SITE = join(RACINE_PROJET, "site");
const RACINE_DEPOT = join(RACINE_PROJET, "..", "..");
const TAMPON = join(RACINE_PROJET, ".test-build");

const URL_PAGE = "https://halalcheck.fr/additifs.html";
// Dans une URL écrite en HTML, les « & » doivent être encodés : sinon le
// document n'est pas valide et certains outils tronquent les paramètres.
const UTM = "utm_source=halalcheck&amp;utm_medium=passerelle&amp;utm_campaign=liste-additifs";

/* ---------- Chargement des tables du moteur ----------
   Les fichiers compilés portent l'extension .js et le package.json du projet
   n'est pas « type: module » : Node les lirait en CommonJS et refuserait les
   `export`. On les recopie en .mjs dans le dossier de travail (ignoré par git)
   pour pouvoir les importer tels quels, sans jamais dupliquer leur contenu. */
async function chargerMoteur(nom) {
  mkdirSync(TAMPON, { recursive: true });
  const source = readFileSync(join(SITE, `${nom}.js`), "utf8");
  const copie = join(TAMPON, `${nom}.mjs`);
  writeFileSync(copie, source);
  return import(pathToFileURL(copie).href);
}

/* ---------- Rendre une expression régulière lisible ----------
   La page annonce les mots réellement cherchés dans la liste d'ingrédients.
   On les extrait du motif du moteur plutôt que de les réécrire à côté : deux
   listes finiraient par diverger. */
function decouperAlternatives(source) {
  const parties = [];
  let profondeur = 0;
  let courant = "";
  for (const c of source) {
    if (c === "(") profondeur += 1;
    if (c === ")") profondeur -= 1;
    if (c === "|" && profondeur === 0) {
      parties.push(courant);
      courant = "";
    } else {
      courant += c;
    }
  }
  parties.push(courant);
  return parties;
}

// Les marques diacritiques sont invisibles dans un éditeur : on décrit la
// plage par ses points de code plutôt que de coller des caractères combinants.
const DIACRITIQUES = new RegExp("[\\u0300-\\u036f]", "g");

function sansAccents(t) {
  return t
    .normalize("NFD")
    .replace(DIACRITIQUES, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae");
}

function lisible(alternative) {
  let t = alternative
    .replace(/\\b/g, "")
    // Un groupe (a|b|c) devient « a / b / c », doublons d'accents écartés.
    .replace(/\(([^)]*)\)/g, (_, groupe) => {
      const vus = new Set();
      const mots = [];
      for (const mot of groupe.split("|")) {
        const cle = sansAccents(mot.trim().toLowerCase());
        if (cle && !vus.has(cle)) {
          vus.add(cle);
          mots.push(mot.trim());
        }
      }
      return mots.slice(0, 4).join(" / ");
    })
    // « l[- ]?cysteine » → « l-cysteine »
    .replace(/\[- \]\?/g, "-")
    .replace(/\[[^\]]*\]\??/g, "")
    // Caractère facultatif : « porcs? » → « porc »
    .replace(/[a-zà-ÿœ]\?/gi, "")
    .replace(/\\/g, "")
    .replace(/[.*+^$]/g, "")
    .replace(/-et /g, " et ")
    .replace(/\s+/g, " ")
    .trim();
  return t;
}

function motsSurveilles(motif) {
  const vus = new Set();
  const mots = [];
  for (const alternative of decouperAlternatives(motif.source)) {
    const mot = lisible(alternative);
    const cle = sansAccents(mot.toLowerCase());
    if (mot && !vus.has(cle)) {
      vus.add(cle);
      mots.push(mot);
    }
  }
  return mots;
}

/* ---------- Utilitaires de rendu ---------- */
function echapper(t) {
  return String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// « E471 — Mono- et diglycérides » → « E471 » (même règle que le scanner).
function codeAdditif(nom) {
  const m = String(nom || "").match(/^\s*E\s?(\d{3,4})\s?([a-z])?\b/i);
  if (!m) return null;
  return "E" + m[1] + (m[2] ? m[2].toLowerCase() : "");
}

function dateGit(cheminAbsolu) {
  const chemin = relative(RACINE_DEPOT, cheminAbsolu);
  try {
    const sortie = execFileSync("git", ["log", "-1", "--format=%cI", "--", chemin], {
      cwd: RACINE_DEPOT,
      encoding: "utf8",
    }).trim();
    return sortie || null;
  } catch {
    return null;
  }
}

function enFrancais(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ---------- Cartes ---------- */
function carteAdditif(cle, infos) {
  const code = codeAdditif(infos.nom);
  // « E471 — Mono- et diglycérides » : le code sert de pastille, le reste de titre.
  const titre = infos.nom.replace(/^\s*E\s?\d{3,4}\s?[a-z]?\s*—\s*/i, "");
  const badge = code || cle.toUpperCase();
  const lien = code
    ? `<a class="fiche" href="https://halalgpt.fr/e/${encodeURIComponent(code)}?${UTM}" target="_blank" rel="noopener">Comprendre le ${echapper(code)} →</a>`
    : "";
  const cherchable = sansAccents(`${badge} ${titre} ${infos.raison}`.toLowerCase());
  return `      <article class="carte ${infos.niveau}" data-cherche="${echapper(cherchable)}">
        <div class="entete"><span class="code">${echapper(badge)}</span><h3>${echapper(titre)}</h3></div>
        <p class="raison">${echapper(infos.raison)}</p>
        ${lien}
      </article>`;
}

function carteRegle(regle, niveau) {
  const mots = motsSurveilles(regle.motif);
  const puces = mots
    .map((m) => `<span class="mot">${echapper(m)}</span>`)
    .join("");
  const faible = regle.gravite === "faible" ? `<p class="nuance">Doute mineur : dans les faits, cet ingrédient est presque toujours d'origine non animale.</p>` : "";
  const cherchable = sansAccents(`${regle.element} ${regle.raison} ${mots.join(" ")}`.toLowerCase());
  return `      <article class="carte ${niveau}" data-cherche="${echapper(cherchable)}">
        <div class="entete"><h3>${echapper(regle.element)}</h3></div>
        <p class="raison">${echapper(regle.raison)}</p>
        ${faible}
        <div class="mots"><span class="mots-titre">Mots repérés&nbsp;:</span>${puces}</div>
      </article>`;
}

function section(id, titre, chapeau, cartes) {
  if (cartes.length === 0) return null;
  return {
    id,
    titre,
    nombre: cartes.length,
    html: `    <section class="bloc" id="${id}">
      <h2>${titre} <span class="compte" data-total="${cartes.length}">${cartes.length}</span></h2>
      <p class="chapeau">${chapeau}</p>
${cartes.join("\n")}
    </section>`,
  };
}

/* ---------- Construction ---------- */
const halal = await chargerMoteur("halal");
const cosmetiques = await chargerMoteur("cosmetiques");

const additifs = Object.entries(halal.ADDITIFS_A_RISQUE);
const additifsHaram = additifs.filter(([, i]) => i.niveau === "haram");
const additifsDouteux = additifs.filter(([, i]) => i.niveau === "douteux");

const nbAdditifs = additifs.length;
const nbTexte = halal.REGLES_HARAM.length + halal.REGLES_DOUTEUX.length;
const nbCosmetiques =
  cosmetiques.REGLES_INTERDITES.length +
  cosmetiques.REGLES_DOUTEUSES.length +
  cosmetiques.REGLES_ALCOOL.length;
const nbTotal = nbAdditifs + nbTexte + nbCosmetiques;

const trierParCode = (a, b) => a[0].localeCompare(b[0], "fr", { numeric: true });

const sections = [
  section(
    "additifs-interdits",
    "Additifs interdits",
    "Leur origine est établie, pas seulement possible. Le verdict est <strong>haram</strong> sauf mention halal certifiée sur l'emballage.",
    additifsHaram.sort(trierParCode).map(([c, i]) => carteAdditif(c, i))
  ),
  section(
    "additifs-verifier",
    "Additifs à vérifier",
    "Ces additifs existent en version végétale <em>comme</em> animale. L'étiquette ne permet pas de trancher : le verdict est <strong>douteux</strong>, et la raison exacte est affichée.",
    additifsDouteux.sort(trierParCode).map(([c, i]) => carteAdditif(c, i))
  ),
  section(
    "ingredients-interdits",
    "Ingrédients interdits dans la liste",
    "Repérés directement dans le texte de la composition, sans code E.",
    halal.REGLES_HARAM.map((r) => carteRegle(r, "haram"))
  ),
  section(
    "ingredients-verifier",
    "Ingrédients à vérifier dans la liste",
    "Mots qui déclenchent un doute et une demande de vérification.",
    halal.REGLES_DOUTEUX.map((r) => carteRegle(r, "douteux"))
  ),
  section(
    "cosmetiques-interdits",
    "Cosmétiques — ingrédients interdits",
    "Nomenclature INCI, celle imprimée au dos des shampooings, crèmes et savons.",
    cosmetiques.REGLES_INTERDITES.map((r) => carteRegle(r, "haram"))
  ),
  section(
    "cosmetiques-verifier",
    "Cosmétiques — ingrédients à vérifier",
    "Origine végétale ou animale selon le fabricant. Un produit certifié halal ou végane lève ce doute.",
    cosmetiques.REGLES_DOUTEUSES.map((r) => carteRegle(r, "douteux"))
  ),
  section(
    "cosmetiques-alcool",
    "Cosmétiques — alcool",
    "Seul l'alcool <em>éthylique</em> est relevé. Cetyl, Cetearyl et Stearyl Alcohol sont des cires grasses, pas de l'alcool : le scanner ne les signale jamais.",
    cosmetiques.REGLES_ALCOOL.map((r) => carteRegle(r, "douteux"))
  ),
].filter(Boolean);

// Un sommaire cliquable : 94 fiches d'affilée se lisent mal sur un téléphone.
const sommaire = sections
  .map(
    (s) =>
      `      <a href="#${s.id}">${s.titre.replace(/^Cosmétiques — /, "Cosmétiques · ")} <span>${s.nombre}</span></a>`
  )
  .join("\n");

const TITRE = `Additifs halal ou haram : les ${nbAdditifs} additifs surveillés`;
const DESCRIPTION = `E120, E441, E471… la liste complète des additifs et ingrédients que HalalCheck repère, avec la raison du doute pour chacun. Alimentaire et cosmétiques.`;

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${echapper(TITRE)}</title>
  <meta name="description" content="${echapper(DESCRIPTION)}" />
  <meta property="og:title" content="${echapper(TITRE)}" />
  <meta property="og:description" content="${echapper(DESCRIPTION)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${URL_PAGE}" />
  <link rel="canonical" href="${URL_PAGE}" />
  <meta name="theme-color" content="#FDFAF3" />
  <link rel="manifest" href="./manifest.json" />
  <link rel="icon" href="./icon-192.png" />
  <link rel="apple-touch-icon" href="./icon-192.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&amp;family=Playfair+Display:wght@800&amp;display=swap" onload="this.onload=null;this.rel='stylesheet'" />
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&amp;family=Playfair+Display:wght@800&amp;display=swap" /></noscript>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "${URL_PAGE}#page",
        "url": "${URL_PAGE}",
        "name": ${JSON.stringify(TITRE)},
        "inLanguage": "fr",
        "description": ${JSON.stringify(DESCRIPTION)},
        "isPartOf": { "@id": "https://halalcheck.fr/#application" },
        "publisher": { "@id": "https://halalcheck.fr/#editeur" },
        "dateModified": "PLACEHOLDER_DATE"
      },
      {
        "@type": "BreadcrumbList",
        "@id": "${URL_PAGE}#fil",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://halalcheck.fr/" },
          { "@type": "ListItem", "position": 2, "name": "Additifs surveillés", "item": "${URL_PAGE}" }
        ]
      }
    ]
  }
  </script>
  <style>
    :root {
      --nuit: #0B1A0F; --foret: #1B4332; --or: #C9A84C; --creme: #FDFAF3;
      --douteux: #E08E3C; --haram: #C0392B; --halal: #3E9B4F;
      --fond: #FDFAF3; --carte: #FFFFFF; --texte: #12261A;
      --texte-doux: rgba(18, 38, 26, 0.62); --bordure: rgba(18, 38, 26, 0.10);
      --or-lisible: #7A5F1C; --ombre-douce: 0 2px 10px rgba(18, 38, 26, 0.06);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      font-family: "DM Sans", system-ui, sans-serif;
      background: var(--fond); color: var(--texte);
      font-size: 16px; line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }
    [hidden] { display: none !important; }
    header {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 20px; max-width: 820px; margin: 0 auto;
    }
    .retour {
      min-width: 56px; min-height: 56px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 16px; background: var(--carte);
      border: 1px solid var(--bordure); box-shadow: var(--ombre-douce);
      color: var(--texte); text-decoration: none; font-size: 24px;
    }
    .titre-entete { font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
    .titre-entete .coche {
      display: inline-flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border-radius: 8px;
      background: linear-gradient(150deg, #dcc27a, var(--or));
      color: var(--nuit); font-size: 15px;
    }
    .fil-ariane {
      max-width: 820px; margin: 0 auto; padding: 0 20px 6px;
      font-size: 13px; color: rgba(18, 38, 26, 0.42);
      display: flex; align-items: center; gap: 8px;
    }
    .fil-ariane a { color: var(--texte-doux); text-decoration: none; }
    main { max-width: 820px; margin: 0 auto; padding: 10px 20px 40px; }
    h1 { font-family: "Playfair Display", Georgia, serif; font-size: 31px; font-weight: 800; line-height: 1.15; margin-bottom: 10px; }
    .intro { color: var(--texte-doux); margin-bottom: 4px; }
    .date { font-size: 14px; color: rgba(18, 38, 26, 0.42); margin-bottom: 20px; }

    .recherche { position: sticky; top: 0; z-index: 5; padding: 10px 0 14px; background: linear-gradient(var(--fond) 78%, rgba(253,250,243,0)); }
    .recherche input {
      width: 100%; font: inherit; font-size: 17px;
      padding: 15px 18px; border-radius: 16px;
      border: 1px solid var(--bordure); background: var(--carte);
      color: var(--texte); box-shadow: var(--ombre-douce);
    }
    .recherche input:focus { outline: 2px solid var(--or); outline-offset: 1px; }
    .resultat-vide { text-align: center; color: var(--texte-doux); padding: 30px 0; }
    .resultat-vide a { color: var(--or-lisible); }

    .sommaire { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
    .sommaire a {
      display: inline-flex; align-items: center; gap: 7px;
      background: var(--carte); border: 1px solid var(--bordure);
      border-radius: 999px; padding: 9px 14px;
      color: var(--texte); text-decoration: none;
      font-size: 14px; font-weight: 600; box-shadow: var(--ombre-douce);
    }
    .sommaire a span {
      font-size: 12px; font-weight: 700; color: var(--texte-doux);
      background: rgba(18, 38, 26, 0.06); border-radius: 999px; padding: 1px 7px;
    }

    /* Le champ de recherche est collant : sans cette marge, un lien du
       sommaire amènerait le titre de section juste derrière lui. */
    .bloc { margin-top: 34px; scroll-margin-top: 84px; }
    h2 {
      font-family: "Playfair Display", Georgia, serif;
      font-size: 22px; font-weight: 800;
      display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
    }
    .compte {
      font-family: "DM Sans", sans-serif; font-size: 13px; font-weight: 700;
      background: rgba(18, 38, 26, 0.06); color: var(--texte-doux);
      border-radius: 999px; padding: 2px 10px;
    }
    .chapeau { color: var(--texte-doux); font-size: 15px; margin-bottom: 14px; }

    .carte {
      background: var(--carte); border: 1px solid var(--bordure);
      border-left: 4px solid var(--douteux);
      border-radius: 16px; padding: 15px 17px; margin-bottom: 10px;
      box-shadow: var(--ombre-douce);
    }
    .carte.haram { border-left-color: var(--haram); }
    .entete { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .code {
      font-weight: 800; font-size: 13px; letter-spacing: 0.02em;
      background: rgba(224, 142, 60, 0.14); color: #8A4F13;
      border-radius: 8px; padding: 3px 9px;
    }
    .carte.haram .code { background: rgba(192, 57, 43, 0.12); color: #8E2A20; }
    .carte h3 { font-size: 16px; font-weight: 700; }
    .raison { color: var(--texte-doux); font-size: 15px; margin-top: 7px; }
    .nuance { font-size: 14px; color: var(--halal); margin-top: 6px; font-weight: 600; }
    .mots { margin-top: 10px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .mots-titre { font-size: 12px; color: rgba(18, 38, 26, 0.42); }
    .mot {
      font-size: 12px; background: rgba(18, 38, 26, 0.05);
      border-radius: 999px; padding: 3px 9px; color: var(--texte-doux);
    }
    .fiche {
      display: inline-block; margin-top: 10px; font-size: 14px; font-weight: 700;
      color: var(--or-lisible); text-decoration: none; padding: 4px 0;
    }

    .rappel {
      background: var(--carte); border: 1px solid var(--bordure);
      border-left: 4px solid var(--foret);
      border-radius: 16px; padding: 18px 20px; margin: 26px 0 0;
      box-shadow: var(--ombre-douce);
    }
    .rappel strong { display: block; margin-bottom: 6px; }
    .rappel p { color: var(--texte-doux); font-size: 15px; }
    .rappel a { color: var(--or-lisible); }

    .cta {
      display: block; text-align: center; margin: 30px 0 0;
      background: linear-gradient(135deg, var(--foret), var(--nuit));
      color: var(--creme); text-decoration: none; font-weight: 800; font-size: 17px;
      border-radius: 18px; padding: 18px 22px;
      box-shadow: 0 8px 24px rgba(27, 67, 50, 0.28);
    }
    footer {
      background: var(--nuit); color: var(--creme);
      text-align: center; padding: 40px 24px; margin-top: 44px;
    }
    footer a { color: var(--or); text-decoration: none; padding: 4px 8px; display: inline-block; }
    footer p { font-size: 14px; color: rgba(253, 250, 243, 0.6); }
    @media (min-width: 700px) { h1 { font-size: 38px; } }
  </style>
</head>
<body>
  <header>
    <a class="retour" href="./index.html" aria-label="Retour à l'accueil">←</a>
    <div class="titre-entete">HalalCheck <span class="coche">✓</span></div>
  </header>
  <nav class="fil-ariane" aria-label="Fil d'Ariane">
    <a href="./index.html">Accueil</a>
    <span aria-hidden="true">›</span>
    <span aria-current="page">Additifs surveillés</span>
  </nav>

  <main>
    <h1>Ce que le scanner surveille</h1>
    <p class="intro">
      ${nbTotal} règles au total&nbsp;: ${nbAdditifs} additifs alimentaires, ${nbTexte} ingrédients repérés
      dans la composition et ${nbCosmetiques} règles cosmétiques. Cette page est générée
      directement depuis le moteur d'analyse&nbsp;: ce qui est écrit ici est exactement
      ce qui est détecté lors d'un scan.
    </p>
    <p class="date">Mis à jour le <span class="date-maj">PLACEHOLDER_DATE_FR</span></p>

    <div class="recherche">
      <input id="q" type="search" inputmode="search" autocomplete="off"
             placeholder="Chercher : E471, gélatine, carmin…"
             aria-label="Chercher un additif ou un ingrédient" />
    </div>
    <p class="resultat-vide" id="vide" hidden>
      Rien trouvé pour cette recherche.<br />
      <a href="./scan.html">Scanne directement le produit →</a>
    </p>

    <nav class="sommaire" id="sommaire" aria-label="Sommaire">
${sommaire}
    </nav>

${sections.map((s) => s.html).join("\n\n")}

    <div class="rappel">
      <strong>Deux choses à garder en tête</strong>
      <p>
        Cette liste est une analyse indicative, jamais une certification&nbsp;: les recettes
        changent, et un même additif peut être végétal chez un fabricant et animal chez un
        autre. <strong>La certification imprimée sur l'emballage prime toujours.</strong>
        Le détail de la méthode est sur la page
        <a href="./mentions-legales.html">méthode et sources</a>.
      </p>
    </div>

    <a class="cta" href="./scan.html">Scanner un produit →</a>
  </main>

  <footer>
    <p>HalalCheck ✓ — <a href="./index.html">Accueil</a> · <a href="./scan.html">Scanner</a> · <a href="./mentions-legales.html">Méthode</a></p>
    <p style="margin-top:10px">
      <a href="https://halalgpt.fr?${UTM}">🌙 HalalGPT</a>
      <a href="https://www.voyageshalal.fr">🗺 VoyagesHalal</a>
      <a href="https://www.gohalaltravel.com">🌍 GoHalalTravel</a>
    </p>
  </footer>

  <script>
    /* Filtre instantané. Sans JavaScript la page reste entièrement lisible :
       toutes les cartes sont dans le HTML, seul le champ de recherche est inerte. */
    (function () {
      var champ = document.getElementById("q");
      var vide = document.getElementById("vide");
      var sommaire = document.getElementById("sommaire");
      var cartes = Array.prototype.slice.call(document.querySelectorAll(".carte"));
      var blocs = Array.prototype.slice.call(document.querySelectorAll(".bloc"));
      if (!champ) return;

      function sansAccents(t) {
        return t.normalize ? t.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "") : t;
      }

      function filtrer() {
        var q = sansAccents(champ.value.toLowerCase().trim());
        var trouves = 0;
        cartes.forEach(function (c) {
          var visible = !q || c.getAttribute("data-cherche").indexOf(q) !== -1;
          c.hidden = !visible;
          if (visible) trouves += 1;
        });
        // Une section dont toutes les cartes sont masquées disparaît aussi, et
        // son compteur suit la recherche : afficher « 9 » au-dessus d'une seule
        // fiche donnerait l'impression qu'il en manque huit.
        blocs.forEach(function (b) {
          var reste = b.querySelectorAll(".carte:not([hidden])").length;
          b.hidden = reste === 0;
          var compte = b.querySelector(".compte");
          if (compte) compte.textContent = q ? reste : compte.getAttribute("data-total");
        });
        // Pendant une recherche, le sommaire n'a plus de sens : les sections
        // affichées sont déjà la réponse.
        if (sommaire) sommaire.hidden = !!q;
        vide.hidden = trouves > 0;
      }

      champ.addEventListener("input", filtrer);
    })();

    if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(function () {});
  </script>
</body>
</html>
`;

const cible = join(SITE, "additifs.html");
writeFileSync(cible, html);

// La date réelle ne peut être connue qu'une fois le fichier suivi par git.
// Au premier passage il n'y a pas d'historique : on écrit la date du dernier
// commit du moteur, qui est la vraie date du contenu affiché.
const iso =
  dateGit(cible) || dateGit(join(RACINE_PROJET, "lib", "halal.ts")) || null;
if (iso) {
  const avecDate = html
    .replace(/PLACEHOLDER_DATE_FR/g, enFrancais(iso))
    .replace(/PLACEHOLDER_DATE/g, iso)
    .replace(
      /(<link rel="canonical"[^>]*>)/,
      `$1\n  <meta name="last-modified" content="${iso}" />`
    );
  writeFileSync(cible, avecDate);
  console.log(`  date réelle : ${enFrancais(iso)} (${iso})`);
} else {
  console.log("  aucune date git disponible — placeholders laissés en place");
}

console.log(`
site/additifs.html généré
  additifs alimentaires : ${nbAdditifs} (${additifsHaram.length} interdits, ${additifsDouteux.length} à vérifier)
  ingrédients (texte)   : ${nbTexte}
  règles cosmétiques    : ${nbCosmetiques}
  total                 : ${nbTotal} règles publiées`);
