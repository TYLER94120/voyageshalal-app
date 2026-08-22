#!/usr/bin/env node
// Injecte dans les pages la VRAIE date de dernière modification, lue dans
// l'historique git. Une date inventée est une fausse promesse faite au
// lecteur comme au moteur de recherche : on ne prend jamais « aujourd'hui »
// par défaut.
//
// Usage : npm run seo:dates

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE_PROJET = join(ICI, "..");
const SITE = join(RACINE_PROJET, "site");
const RACINE_DEPOT = join(RACINE_PROJET, "..", "..");

const PAGES = ["index.html", "scan.html", "additifs.html", "mentions-legales.html",
  "bonbons.html", "fromage.html", "pain-viennoiserie.html"];

/** Date du dernier commit ayant touché ce fichier (ISO, UTC). */
function dateGit(cheminAbsolu) {
  const chemin = relative(RACINE_DEPOT, cheminAbsolu);
  try {
    const sortie = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", chemin],
      { cwd: RACINE_DEPOT, encoding: "utf8" }
    ).trim();
    return sortie || null;
  } catch (e) {
    return null;
  }
}

function enFrancais(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

let modifiees = 0;
for (const page of PAGES) {
  const chemin = join(SITE, page);
  if (!existsSync(chemin)) {
    console.log(`  ignorée (absente) : ${page}`);
    continue;
  }
  const iso = dateGit(chemin);
  if (!iso) {
    console.log(`  ignorée (aucune date git) : ${page}`);
    continue;
  }
  let html = readFileSync(chemin, "utf8");
  const avant = html;

  // 1. Métadonnée lisible par les moteurs
  const balise = `<meta name="last-modified" content="${iso}" />`;
  if (/<meta name="last-modified"[^>]*>/.test(html)) {
    html = html.replace(/<meta name="last-modified"[^>]*>/, balise);
  } else {
    html = html.replace(/(<link rel="canonical"[^>]*>)/, `$1\n  ${balise}`);
  }

  // 2. Champ dateModified des données structurées
  html = html.replace(/"dateModified":\s*"[^"]*"/g, `"dateModified": "${iso}"`);

  // 3. Mention visible en pied de page
  html = html.replace(
    /(<span class="date-maj">)[^<]*(<\/span>)/g,
    `$1${enFrancais(iso)}$2`
  );

  if (html !== avant) {
    writeFileSync(chemin, html);
    modifiees += 1;
    console.log(`  ${page} → ${enFrancais(iso)} (${iso})`);
  } else {
    console.log(`  ${page} → déjà à jour`);
  }
}
console.log(`\n${modifiees} page(s) mise(s) à jour avec des dates réelles.`);

// ---------------------------------------------------------------------------
// Le sitemap annonce lui aussi une date de modification, et c'est CELLE-LÀ que
// Google lit pour décider s'il revient. Elle était écrite à la main : mesurée
// le 11 août, elle datait de deux jours sur 4 pages sur 4, alors que les
// pages, elles, déclaraient bien le jour même. Résultat : on disait au moteur
// « rien n'a bougé » le jour où le plus de corrections partaient en ligne.
const SITEMAP = join(SITE, "sitemap.xml");
if (existsSync(SITEMAP)) {
  const avant = readFileSync(SITEMAP, "utf8");
  let xml = avant;
  let recalees = 0;
  for (const page of PAGES) {
    const iso = dateGit(join(SITE, page));
    if (!iso) continue;
    const jour = iso.slice(0, 10);
    // L'accueil est référencé par « / », pas par « /index.html ».
    const fin = page === "index.html" ? "/" : "/" + page;
    const motif = new RegExp(
      "(<loc>https://halalcheck\\.fr" + fin.replace(/\//g, "\\/") +
        "</loc>\\s*<lastmod>)([^<]*)(</lastmod>)"
    );
    const trouve = xml.match(motif);
    if (trouve && trouve[2] !== jour) recalees += 1;
    xml = xml.replace(motif, `$1${jour}$3`);
  }
  if (xml !== avant) {
    writeFileSync(SITEMAP, xml);
    console.log(`\nsitemap.xml : ${recalees} date(s) remise(s) à la vraie date`);
  } else {
    console.log("\nsitemap.xml : dates déjà justes");
  }
}

