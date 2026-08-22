#!/usr/bin/env node
/**
 * Génère les pages « rayon » : bonbons, fromage, pain et viennoiseries.
 *
 * POURQUOI CES PAGES EXISTENT
 * Mesure du 21 août, première donnée réelle reçue de Search Console :
 * 1 impression, 0 clic, 7 jours. Le site est techniquement irréprochable et
 * n'a rien à proposer à Google — 4 pages, toutes sur le même sujet.
 *
 * Ce qui manquait n'était pas de la technique mais un TERRAIN. Celui-ci est
 * le nôtre et personne d'autre ne l'occupe dans l'empire :
 *   · halalgpt.fr répond « qu'est-ce que le E471 ? » — une page par CODE.
 *   · nous répondons « je tiens un paquet de bonbons, je regarde quoi ? » —
 *     une page par SITUATION, avec les mots qui sont vraiment sur l'étiquette
 *     française : gélatine, présure, L-cystéine, carmin, gomme laque.
 * On ne double donc pas les fiches de halalgpt, on y renvoie.
 *
 * POURQUOI C'EST GÉNÉRÉ ET NON ÉCRIT
 * Une page qui recopie une règle du moteur devient fausse le jour où la règle
 * change, et personne ne le voit. Ici chaque phrase de risque est LUE dans le
 * moteur au moment de la génération. Si un ingrédient cité n'existe pas, la
 * génération ÉCHOUE — c'est le seul garde-fou qui empêche d'inventer.
 *
 * Usage : npm run build:rayons   (après npm run build:site)
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const PROJET = join(ICI, "..");
const SITE = join(PROJET, "site");
const RACINE_DEPOT = join(PROJET, "..", "..");
const TAMPON = join(PROJET, ".test-build");

const UTM = "utm_source=halalcheck&amp;utm_medium=passerelle&amp;utm_campaign=rayon";

async function chargerMoteur(nom) {
  mkdirSync(TAMPON, { recursive: true });
  const copie = join(TAMPON, `${nom}.mjs`);
  writeFileSync(copie, readFileSync(join(SITE, `${nom}.js`), "utf8"));
  return import(pathToFileURL(copie).href);
}
const moteur = await chargerMoteur("halal");
const { REGLES_HARAM, REGLES_DOUTEUX, ADDITIFS_A_RISQUE } = moteur;
const REGLES = [...REGLES_HARAM, ...REGLES_DOUTEUX];

// Le moteur cosmetique est une table separee — 29 regles qu'aucune page ne
// citait encore, alors que « savon halal » et « creme halal » sont des
// recherches a part entiere, sans rapport avec l'alimentaire.
const cosmo = await chargerMoteur("cosmetiques");
const REGLES_COSMO = [
  ...cosmo.REGLES_INTERDITES.map((r) => ({ ...r, niveau: "haram" })),
  ...cosmo.REGLES_ALCOOL.map((r) => ({ ...r, niveau: r.niveau || "douteux" })),
  ...cosmo.REGLES_DOUTEUSES.map((r) => ({ ...r, niveau: "douteux" })),
];

function echapper(t) {
  return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function codeAdditif(nom) {
  const m = String(nom || "").match(/^\s*E\s?(\d{3,4})\s?([a-z])?\b/i);
  return m ? "E" + m[1] + (m[2] ? m[2].toLowerCase() : "") : null;
}
function dateGit(chemin) {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cI", "--", relative(RACINE_DEPOT, chemin)],
      { cwd: RACINE_DEPOT, encoding: "utf8" }).trim() || null;
  } catch { return null; }
}
function enFrancais(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/* ---------- Lecture DANS le moteur, jamais à côté ----------
   `ingredient` cherche une règle par le nom exact de son élément.
   `additif` cherche un code. Les deux jettent si l'entrée n'existe pas :
   c'est ce qui rend impossible de citer un ingrédient inventé. */
function ingredient(nomExact) {
  const r = REGLES.find((x) => x.element === nomExact);
  if (!r) throw new Error(`Ingrédient absent du moteur : « ${nomExact} » — page non générée`);
  return { titre: r.element, raison: r.raison, niveau: r.niveau || "douteux" };
}
function cosmetique(nomExact) {
  const r = REGLES_COSMO.find((x) => x.element === nomExact);
  if (!r) throw new Error(`Règle cosmétique absente du moteur : « ${nomExact} » — page non générée`);
  return { titre: r.element, raison: r.raison, niveau: r.niveau };
}

function additif(code) {
  const trouve = Object.values(ADDITIFS_A_RISQUE).find((a) => codeAdditif(a.nom) === code);
  if (!trouve) throw new Error(`Additif absent du moteur : « ${code} » — page non générée`);
  return { titre: trouve.nom, raison: trouve.raison, niveau: trouve.niveau || "douteux", code };
}

/* ---------- Les rayons ----------
   Le choix des rayons et l'ordre sont editoriaux ; le CONTENU de chaque
   risque ne l'est pas, il vient du moteur. */
const RAYONS = [
  {
    fichier: "bonbons.html",
    etiquette: "🍬 Bonbons et confiseries",
    slug: "bonbons",
    titre: (n) => `Quels bonbons sont halal : ${n} ingrédients à vérifier`,
    description: (n) =>
      `Gélatine, carmin, gomme laque, glycérine : les ${n} ingrédients à repérer sur un paquet, la raison exacte du doute, et quoi faire. Gratuit.`,
    h1: "Bonbons et confiseries : ce qu'il faut vérifier",
    besoin: "Quels bonbons sont halal",
    intro:
      "Un paquet de bonbons ne porte presque jamais la mention « halal ». La question se joue sur quelques ingrédients précis, et ils sont écrits sur l'étiquette — encore faut-il savoir lesquels regarder.",
    risques: [
      ingredient("Gélatine"),
      additif("E441"),
      ingredient("Carmin (cochenille)"),
      additif("E120"),
      ingredient("Gomme laque (shellac)"),
      additif("E904"),
      ingredient("Glycérine"),
      additif("E422"),
    ],
    quoiFaire:
      "Cherche le mot « gélatine » dans la liste d'ingrédients. S'il est suivi de « de bœuf », « de poisson » ou d'une mention halal, le doute tombe. S'il est seul, il reste entier : en France la gélatine alimentaire est majoritairement porcine.",
  },
  {
    fichier: "fromage.html",
    etiquette: "🧀 Fromage et présure",
    slug: "fromage",
    titre: (n) => `Fromage halal : la présure et ${n - 1} autres à vérifier`,
    description: () =>
      `Présure animale ou microbienne : ce que l’étiquette dit, ce qu’elle tait, et comment trancher devant le rayon. Gratuit, sans compte.`,
    h1: "Fromage : la présure, et comment la lire",
    besoin: "Le fromage et la présure",
    intro:
      "La plupart des fromages sont coagulés avec de la présure. Selon son origine, la question ne se pose pas du tout ou se pose entièrement — et l'étiquette française reste souvent muette.",
    risques: [
      ingredient("Présure"),
      ingredient("Enzyme d'origine possiblement animale"),
      ingredient("Carmin (cochenille)"),
    ],
    quoiFaire:
      "Cherche « présure » ou « coagulant ». « Présure microbienne », « coagulant microbien » ou « ferments végétaux » lèvent le doute. « Présure » seule ne dit pas son origine : elle peut être extraite de caillette de veau, et l'abattage n'est alors pas connu.",
  },
  {
    fichier: "pain-viennoiserie.html",
    etiquette: "🥐 Pain et viennoiseries",
    slug: "pain-viennoiserie",
    titre: (n) => `Pain de mie halal : ${n} ingrédients à repérer`,
    description: (n) =>
      `L-cystéine, E471, graisse animale : les ${n} ingrédients à vérifier sur un pain de mie ou une viennoiserie industrielle, et pourquoi. Gratuit.`,
    h1: "Pain, viennoiseries et biscuits : quoi vérifier",
    besoin: "Le pain de mie et les viennoiseries",
    intro:
      "Un pain de mie industriel contient plus d'ingrédients qu'un pain de boulangerie, et deux d'entre eux posent une vraie question d'origine. Aucun n'est visible autrement qu'en lisant la liste.",
    risques: [
      ingredient("L-cystéine"),
      additif("E920"),
      ingredient("Mono/diglycérides"),
      additif("E471"),
      ingredient("Graisse animale"),
      ingredient("Acide stéarique / stéarate"),
    ],
    quoiFaire:
      "Cherche « L-cystéine », « E920 », « mono- et diglycérides » ou « E471 ». Une mention « d'origine végétale » à côté lève le doute — le scanner la reconnaît. Sans elle, l'origine n'est pas déclarée, et la loi n'oblige pas à la déclarer.",
  },
  {
    fichier: "charcuterie.html",
    etiquette: "🥓 Charcuterie et viande",
    slug: "charcuterie",
    titre: (n) => `Charcuterie halal : ${n} mentions à vérifier`,
    description: () =>
      `Boyau naturel, arôme de viande, collagène : ce que l’étiquette d’une charcuterie déclare, ce qu’elle tait, et quoi regarder. Gratuit.`,
    besoin: "La charcuterie et la viande",
    h1: "Charcuterie et viande : ce que l’étiquette déclare",
    intro:
      "Une charcuterie « de dinde » ou « de volaille » ne dit rien de l’abattage, ni de ce qui entoure la tranche. Deux mentions passent presque toujours inaperçues, et ce sont celles qui décident.",
    risques: [
      ingredient("Porc / dérivé de porc"),
      ingredient("Charcuterie"),
      ingredient("Boyau naturel"),
      ingredient("Viande"),
      ingredient("Arôme / bouillon de viande"),
      ingredient("Collagène / élastine"),
      additif("E542"),
    ],
    quoiFaire:
      "Regarde deux choses. Le boyau d’abord : « boyau naturel » sans autre précision est un intestin animal, souvent porcin — « boyau végétal » ou « sans boyau » lèvent la question. L’abattage ensuite : seule une certification portée sur l’emballage y répond, la liste d’ingrédients ne le fera jamais.",
  },
  {
    fichier: "alcool-aliments.html",
    etiquette: "🍷 Alcool dans les aliments",
    slug: "alcool-aliments",
    titre: (n) => `Alcool caché dans les aliments : ${n} formes`,
    description: () =>
      `Arôme, vinaigre de vin, dessert au rhum : où l’alcool se déclare et où il se devine dans une liste d’ingrédients française. Gratuit, sans compte.`,
    besoin: "L’alcool dans les aliments",
    h1: "L’alcool dans les aliments : où il se cache",
    intro:
      "L’alcool n’apparaît pas toujours sous le mot « alcool ». Il entre dans un plat comme ingrédient, sert de support à un arôme, ou reste dans un vinaigre. Les trois se lisent différemment.",
    risques: [
      ingredient("Alcool"),
      ingredient("Alcool (vin / spiritueux)"),
      ingredient("Alcool (كحول)"),
    ],
    quoiFaire:
      "Cherche « vin », « bière », « rhum », « kirsch », « liqueur » — ils sont déclarés en toutes lettres quand ils sont ingrédients. Le vinaigre de vin et le vinaigre d’alcool sont volontairement neutralisés par notre moteur : la transformation en vinaigre est admise par la majorité des avis. Un « arôme » seul, lui, ne dit pas ce qui le porte.",
  },
  {
    fichier: "cosmetiques.html",
    etiquette: "🧴 Savons et cosmétiques",
    slug: "cosmetiques",
    titre: (n) => `Cosmétique halal : ${n} ingrédients à repérer`,
    description: () =>
      `Suif, lanoline, kératine, carmin, Alcohol Denat. : ce qu’il faut chercher dans une liste INCI de savon, crème ou shampooing. Gratuit.`,
    besoin: "Les cosmétiques",
    h1: "Savon, crème, shampooing : lire une liste INCI",
    intro:
      "Un cosmétique ne se mange pas, mais il touche la peau et reste pendant la prière. Sa liste d’ingrédients est écrite en INCI, un vocabulaire latin où les origines animales sont particulièrement difficiles à voir.",
    risques: [
      cosmetique("Suif (Tallow)"),
      cosmetique("Dérivé de porc"),
      cosmetique("Placenta"),
      cosmetique("Carmin (CI 75470)"),
      cosmetique("Alcool éthylique (Alcohol Denat.)"),
      cosmetique("Lanoline"),
      cosmetique("Kératine"),
      cosmetique("Collagène"),
      cosmetique("Squalène / Squalane"),
      cosmetique("Glycérine"),
    ],
    quoiFaire:
      "Le mot à chercher en premier est « Tallow » : c’est du suif, et il se cache derrière Sodium Tallowate dans beaucoup de savons solides. Ensuite « Lanolin », « Keratin », « Collagen », « Squalene ». Une mention « vegetable origin » ou « plant-derived » à côté lève le doute ; sans elle, l’origine n’est pas déclarée.",
  },
];

/* ---------- Rendu ---------- */
const POLICES = ["dm-sans-latin-400-normal", "dm-sans-latin-600-normal", "dm-sans-latin-700-normal",
  "dm-sans-latin-800-normal", "dm-sans-latin-900-normal"].map((f) => `    @font-face {
      font-family: "DM Sans"; font-style: normal; font-display: swap;
      font-weight: ${f.match(/-(\d00)-/)[1]};
      src: url("./vendor/polices/${f}.woff2") format("woff2");
    }`).join("\n") + `
    @font-face {
      font-family: "Playfair Display"; font-style: normal; font-display: swap;
      font-weight: 800;
      src: url("./vendor/polices/playfair-display-latin-800-normal.woff2") format("woff2");
    }`;

function carte(r) {
  const badge = r.code ? `<span class="code">${echapper(r.code)}</span>` : "";
  const lien = r.code
    ? `<a class="fiche" href="https://halalgpt.fr/e/${encodeURIComponent(r.code)}?${UTM}" target="_blank" rel="noopener">Comprendre le ${echapper(r.code)} →</a>`
    : "";
  const titre = r.code ? r.titre.replace(/^\s*E\s?\d{3,4}\s?[a-z]?\s*—\s*/i, "") : r.titre;
  return `      <article class="carte ${r.niveau}">
        <div class="entete">${badge}<h3>${echapper(titre)}</h3></div>
        <p class="raison">${echapper(r.raison)}</p>
        ${lien}
      </article>`;
}

function page(rayon, nbTotalRegles) {
  const url = `https://halalcheck.fr/${rayon.fichier}`;
  const n = rayon.risques.length;
  const titre = rayon.titre(n);
  const description = rayon.description(n);
  // Le garde-fou est ICI, a la source. Une page generee hors limites serait
  // coupee par Google et le defaut n'existerait que dans le resultat de
  // recherche — la ou personne chez nous ne va le lire.
  if (titre.length > 60) throw new Error(`${rayon.fichier} : titre ${titre.length} car. > 60 — « ${titre} »`);
  if (description.length > 155) throw new Error(`${rayon.fichier} : description ${description.length} car. > 155`);
  // Apostrophe droite dans un titre ou une description : un lecteur qui
  // termine l'attribut au premier caractere quote n'en lit que le debut.
  // Defaut mesure le 20 aout sur mentions-legales.html — 1 caractere lu sur
  // 158. On refuse a la generation plutot que de le decouvrir en CI.
  for (const [champ, valeur] of [["titre", titre], ["description", description]]) {
    const i = valeur.search(/['"]/);
    if (i !== -1) throw new Error(`${rayon.fichier} : ${champ}, apostrophe droite en position ${i + 1} — utiliser ’`);
  }
  return { titre, description, html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${echapper(titre)}</title>
  <meta name="description" content="${echapper(description)}" />
  <meta property="og:title" content="${echapper(titre)}" />
  <meta property="og:description" content="${echapper(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <link rel="canonical" href="${url}" />
  <meta name="theme-color" content="#FDFAF3" />
  <link rel="icon" href="./icon-192.png" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "${url}#page",
        "url": "${url}",
        "name": ${JSON.stringify(titre)},
        "inLanguage": "fr",
        "description": ${JSON.stringify(description)},
        "isPartOf": { "@id": "https://halalcheck.fr/#application" },
        "dateModified": "PLACEHOLDER_DATE"
      },
      {
        "@type": "BreadcrumbList",
        "@id": "${url}#fil",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://halalcheck.fr/" },
          { "@type": "ListItem", "position": 2, "name": ${JSON.stringify(rayon.besoin)}, "item": "${url}" }
        ]
      }
    ]
  }
  </script>
  <style>
${POLICES}
  </style>
  <style>
    :root {
      --nuit:#0B1A0F; --foret:#1B4332; --or:#C9A84C; --creme:#FDFAF3;
      --fond:#FDFAF3; --carte:#FFFFFF; --texte:#12261A;
      --texte-doux:rgba(18,38,26,0.62); --bordure:rgba(18,38,26,0.10);
      --or-lisible:#7A5F1C; --ombre-douce:0 2px 10px rgba(18,38,26,0.06);
    }
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:"DM Sans",system-ui,sans-serif;background:var(--fond);color:var(--texte);font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased}
    header{display:flex;align-items:center;gap:10px;padding:14px 20px;max-width:760px;margin:0 auto}
    .retour{min-width:56px;min-height:56px;display:flex;align-items:center;justify-content:center;border-radius:16px;background:var(--carte);border:1px solid var(--bordure);box-shadow:var(--ombre-douce);color:var(--texte);text-decoration:none;font-size:24px}
    .titre-entete{font-size:20px;font-weight:800}
    .fil-ariane{max-width:760px;margin:0 auto;padding:0 20px 6px;font-size:13px;color:rgba(18,38,26,0.66);display:flex;gap:8px}
    .fil-ariane a{color:var(--texte-doux);text-decoration:none}
    main{max-width:760px;margin:0 auto;padding:10px 20px 64px}
    h1{font-family:"Playfair Display",Georgia,serif;font-size:30px;font-weight:800;margin-bottom:10px}
    .date{font-size:14px;color:var(--texte-doux);margin-bottom:22px}
    .intro{font-size:17px;margin-bottom:26px}
    h2{font-family:"Playfair Display",Georgia,serif;font-size:21px;font-weight:800;margin:30px 0 12px}
    .carte{background:var(--carte);border:1px solid var(--bordure);border-radius:16px;padding:16px 18px;margin-bottom:12px;box-shadow:var(--ombre-douce)}
    .carte.haram{border-left:4px solid #C0392B}
    .carte.douteux{border-left:4px solid #E08E3C}
    .entete{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
    .code{font-weight:800;font-size:13px;letter-spacing:.02em;background:rgba(224,142,60,.14);color:#8A4F13;border-radius:8px;padding:3px 9px}
    .carte h3{font-size:16px;font-weight:700}
    .raison{color:var(--texte-doux);font-size:15px;margin-top:7px}
    .fiche{display:inline-block;margin-top:9px;font-size:14px;font-weight:700;color:var(--or-lisible);text-decoration:none}
    .encadre{background:var(--carte);border:1px solid var(--bordure);border-left:4px solid var(--foret);border-radius:16px;padding:18px 20px;margin:20px 0;box-shadow:var(--ombre-douce)}
    .encadre strong{display:block;margin-bottom:6px}
    .cta{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:60px;padding:0 30px;background:linear-gradient(150deg,#e9d49f,var(--or) 55%,#b8963c);color:var(--nuit);font-size:17px;font-weight:800;border-radius:20px;text-decoration:none;margin-top:8px}
    .suite{margin-top:30px;font-size:15px}
    .suite a{color:var(--or-lisible);font-weight:700}
    footer{background:var(--nuit);color:var(--creme);text-align:center;padding:34px 24px;margin-top:44px;font-size:14px}
    footer a{color:var(--or);text-decoration:none;padding:4px 8px;display:inline-flex;align-items:center;min-height:44px}
  </style>
</head>
<body>
  <header>
    <a class="retour" href="./index.html" aria-label="Retour à l'accueil">←</a>
    <div class="titre-entete">HalalCheck</div>
  </header>
  <nav class="fil-ariane" aria-label="Fil d'Ariane">
    <a href="./index.html">Accueil</a><span aria-hidden="true">›</span><span aria-current="page">${echapper(rayon.besoin)}</span>
  </nav>
  <main>
    <h1>${echapper(rayon.h1)}</h1>
    <p class="date">Mis à jour le PLACEHOLDER_DATE_FR</p>
    <p class="intro">${echapper(rayon.intro)}</p>

    <h2>Les ${n} ingrédients à repérer</h2>
${rayon.risques.map(carte).join("\n")}

    <div class="encadre">
      <strong>Ce qu'il faut faire, concrètement</strong>
      ${echapper(rayon.quoiFaire)}
    </div>

    <h2>Le plus simple : scanne le code-barres</h2>
    <p>Le scanner lit la composition et applique ces règles tout seul, plus ${nbTotalRegles - n} autres. Il dit ce qu'il a trouvé et pourquoi — et quand il ne sait pas, il le dit aussi.</p>
    <p><a class="cta" href="./scan.html">📷&nbsp; Scanner un produit</a></p>

    <div class="encadre">
      <strong>Ce que cette page ne fait pas</strong>
      Elle ne déclare aucun produit ni aucune marque halal. Une liste d'ingrédients ne dit rien de l'abattage, de la contamination croisée sur une ligne partagée, ni des auxiliaires que la loi n'oblige pas à déclarer. Pour une certitude, réfère-toi à la certification portée sur l'emballage.
    </div>

    <p class="suite">
      À lire ensuite :
      <a href="./additifs.html">les ${nbTotalRegles} règles au complet</a> ·
      <a href="./mentions-legales.html">d'où viennent nos données</a>
    </p>
  </main>
  <footer>
    <a href="./index.html">Accueil</a> ·
    <a href="./scan.html">Scanner</a> ·
    <a href="./additifs.html">Additifs surveillés</a> ·
    <a href="./mentions-legales.html">Mentions légales</a>
  </footer>
</body>
</html>
` };
}

/* ---------- Écriture ---------- */
const nbTotalRegles = Object.keys(ADDITIFS_A_RISQUE).length + REGLES.length;
console.log("GÉNÉRATION des pages rayon\n");
for (const rayon of RAYONS) {
  const { titre, description, html } = page(rayon, nbTotalRegles);
  const cible = join(SITE, rayon.fichier);
  writeFileSync(cible, html);
  const iso = dateGit(cible) || dateGit(join(PROJET, "lib", "halal.ts"));
  if (iso) {
    writeFileSync(cible, html
      .replace(/PLACEHOLDER_DATE_FR/g, enFrancais(iso))
      .replace(/PLACEHOLDER_DATE/g, iso)
      .replace(/(<link rel="canonical"[^>]*>)/, `$1\n  <meta name="last-modified" content="${iso}" />`));
  }
  console.log(`  ✓ ${rayon.fichier.padEnd(24)} ${rayon.risques.length} risques · titre ${titre.length} car. · description ${description.length} car.`);
}
/* ---------- Le manifeste : une seule liste, pour tout le monde ----------
   Le 22 aout, l'ajout de 3 pages m'a fait editer la MEME liste dans cinq
   fichiers : le sitemap, dates-seo, verif-chiffres, la sonde sans-JavaScript
   et le controle CI. Cinq occasions d'en oublier une, et une page oubliee est
   une page que Google ne voit pas.
   Elle est desormais ecrite ici, a l'endroit ou les pages sont fabriquees,
   et lue partout ailleurs. */
const PAGES_FIXES = [
  { fichier: "index.html", chemin: "/", priorite: "1.0" },
  { fichier: "scan.html", chemin: "/scan.html", priorite: "0.9" },
  { fichier: "additifs.html", chemin: "/additifs.html", priorite: "0.8" },
  { fichier: "mentions-legales.html", chemin: "/mentions-legales.html", priorite: "0.4" },
];
const TOUTES = [
  ...PAGES_FIXES,
  ...RAYONS.map((r) => ({ fichier: r.fichier, chemin: "/" + r.fichier, priorite: "0.7", etiquette: r.etiquette })),
];
writeFileSync(join(ICI, "pages-du-site.json"), JSON.stringify(TOUTES, null, 2) + "\n");

/* Le sitemap est REGENERE en entier, jamais complete a la main. Les dates
   sont relues dans les pages elles-memes : c'est seo:dates qui les y pose,
   depuis l'historique git, et une date inventee est une fausse promesse. */
const lignes = TOUTES.map((p) => {
  const html = readFileSync(join(SITE, p.fichier), "utf8");
  const date = (html.match(/<meta name="last-modified" content="([^"]{10})/) || [])[1] || "";
  return `  <url>
    <loc>https://halalcheck.fr${p.chemin}</loc>
    <lastmod>${date}</lastmod>
    <priority>${p.priorite}</priority>
  </url>`;
});
writeFileSync(join(SITE, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lignes.join("\n")}\n</urlset>\n`);

/* Les liens de l'accueil vers les rayons sont REECRITS ici, jamais tenus a
   la main. Mesure du 22 aout : 3 pages neuves sont sorties orphelines parce
   que j'avais ajoute les rayons sans toucher au bloc de liens. Une page
   orpheline n'existe pas — la sonde l'a vue, mais elle ne devrait pas avoir
   a la voir. */
const ACCUEIL = join(SITE, "index.html");
try {
  const avant = readFileSync(ACCUEIL, "utf8");
  const liens = RAYONS.map((r) => `      <a href="./${r.fichier}">${r.etiquette}</a>`).join("\n");
  const apres = avant.replace(
    /(<div class="rayons-liens">)[\s\S]*?(<\/div>)/,
    `$1\n${liens}\n    $2`
  );
  if (apres !== avant) {
    writeFileSync(ACCUEIL, apres);
    console.log(`  accueil : ${RAYONS.length} liens vers les rayons réécrits`);
  } else {
    console.log("  accueil : liens déjà à jour");
  }
} catch (e) {
  console.log("  accueil introuvable — liens non posés");
}

console.log(`\n${RAYONS.length} pages rayon générées, chaque risque lu dans le moteur.`);
console.log(`manifeste : ${TOUTES.length} pages · sitemap régénéré`);
