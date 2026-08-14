/**
 * Les nombres annoncés sur le site disent-ils la vérité ?
 *
 * L'accueil annonce « 56 additifs surveillés » sept fois — dans son `<title>`,
 * dans le bloc FAQ que Google lit, dans deux boutons et dans le corps de la
 * page. Ces nombres étaient écrits à la main, donc indépendants du moteur :
 * au premier additif ajouté, la page devenait fausse sans que personne ne le
 * voie. `npm run build:additifs` les recale désormais tout seul ; cette
 * vérification-ci sort en erreur si quelqu'un les écrit à la main sans
 * relancer la génération.
 *
 * Un site qui annonce un chiffre faux sur sa page d'accueil abîme la confiance
 * exactement comme un verdict faux : c'est la même promesse.
 *
 * Depuis le 12 août, ce contrôle couvre aussi les DATES du sitemap. C'est
 * celle-là que Google lit pour décider s'il revient : elle datait de deux
 * jours sur 4 pages sur 4, le jour même où le plus de corrections partaient.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const PROJET = join(ICI, "..");

const { ADDITIFS_A_RISQUE, REGLES_HARAM, REGLES_DOUTEUX } = await import(
  pathToFileURL(join(PROJET, "site", "halal.js")).href
);
const cosmetiques = await import(
  pathToFileURL(join(PROJET, "site", "cosmetiques.js")).href
);

const nbAdditifs = Object.keys(ADDITIFS_A_RISQUE).length;
const nbTexte = REGLES_HARAM.length + REGLES_DOUTEUX.length;
// Trois listes, pas deux : REGLES_ALCOOL existe à part. Ma première version
// en oubliait une et annonçait 28 au lieu de 29 — l'instrument se trompait,
// pas la page. Compté comme le générateur, à la même source.
const nbCosmetiques =
  cosmetiques.REGLES_INTERDITES.length +
  cosmetiques.REGLES_DOUTEUSES.length +
  cosmetiques.REGLES_ALCOOL.length;

const accueil = readFileSync(join(PROJET, "site", "index.html"), "utf8");
const additifs = readFileSync(join(PROJET, "site", "additifs.html"), "utf8");

const controles = [
  ["accueil : additifs", accueil, /(\d+) additifs/g, nbAdditifs],
  ["accueil : règles cosmétiques", accueil, /(\d+) règles cosmétiques/g, nbCosmetiques],
  ["page additifs : additifs alimentaires", additifs, /(\d+) additifs alimentaires/g, nbAdditifs],
  ["page additifs : règles cosmétiques", additifs, /(\d+) règles cosmétiques/g, nbCosmetiques],
  ["page additifs : total", additifs, /(\d+) règles au total/g, nbAdditifs + nbTexte + nbCosmetiques],
];

let fautes = 0;
console.log("VÉRIFICATION des nombres annoncés\n");
for (const [nom, texte, motif, attendu] of controles) {
  const vus = [...texte.matchAll(motif)].map((m) => Number(m[1]));
  const faux = vus.filter((v) => v !== attendu);
  if (faux.length) fautes += faux.length;
  console.log(
    `  ${faux.length ? "✗" : "✓"} ${nom.padEnd(38)} ${vus.length} occurrence(s), moteur = ${attendu}` +
      (faux.length ? `  ← faux : ${[...new Set(faux)].join(", ")}` : "")
  );
}

// Le sitemap doit annoncer la même date que la page elle-même.
const PAGES = [
  ["index.html", "/"],
  ["scan.html", "/scan.html"],
  ["additifs.html", "/additifs.html"],
  ["mentions-legales.html", "/mentions-legales.html"],
];
const sitemap = readFileSync(join(PROJET, "site", "sitemap.xml"), "utf8");
console.log("");
for (const [fichier, chemin] of PAGES) {
  const html = readFileSync(join(PROJET, "site", fichier), "utf8");
  const surLaPage = (html.match(/<meta name="last-modified" content="([^"]{10})/) || [])[1];
  const motif = new RegExp(
    "<loc>https://halalcheck\\.fr" + chemin.replace(/\//g, "\\/") + "</loc>\\s*<lastmod>([^<]*)</lastmod>"
  );
  const dansLeSitemap = (sitemap.match(motif) || [])[1];
  const ok = surLaPage && dansLeSitemap === surLaPage;
  if (!ok) fautes += 1;
  console.log(
    `  ${ok ? "✓" : "✗"} sitemap : ${fichier.padEnd(22)} page = ${surLaPage || "?"}, sitemap = ${dansLeSitemap || "absent"}`
  );
}

// Les chemins de fichiers écrits à la main dans les pages doivent exister.
// L'accueil et le scanner nomment tous deux le lecteur de codes-barres, avec
// son numéro de version : le jour où on le met à jour, un des deux peut être
// oublié, et personne ne le verrait avant qu'un iPhone ne scanne rien.
console.log("");
const chemins = new Set();
for (const f of ["index.html", "scan.html"]) {
  const html = readFileSync(join(PROJET, "site", f), "utf8");
  for (const m of html.matchAll(/\.\/(vendor\/[\w.@-]+\.js)/g)) chemins.add(m[1]);
}
for (const c of chemins) {
  const existe = existsSync(join(PROJET, "site", c));
  if (!existe) fautes += 1;
  console.log(`  ${existe ? "✓" : "✗"} fichier référencé : ${c}${existe ? "" : "  ← INTROUVABLE"}`);
}
if (chemins.size !== 1) {
  console.log(`  ✗ ${chemins.size} versions différentes du lecteur référencées — elles doivent être identiques`);
  fautes += 1;
}

// ── Aucun hôte tiers dans une page ───────────────────────────────────────
//
// Mesuré le 13 août : les 4 pages chargeaient DM Sans et Playfair Display
// depuis fonts.googleapis.com et fonts.gstatic.com. L'adresse IP de chaque
// visiteur partait donc chez un tiers à chaque ouverture — alors que la page
// « mentions légales » déclare soigneusement GitHub Pages, Open Food Facts et
// HalalGPT, et que le mot « Google » n'y apparaissait nulle part : les trois
// occurrences trouvées étaient les balises <link> du <head> elles-mêmes.
//
// Les polices sont maintenant servies depuis notre domaine. Ce contrôle
// empêche qu'elles y reviennent — c'est en collant un bloc de <head> d'une
// page à l'autre que ça se reproduit.
const HOTES_INTERDITS = /fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com/;
const POLICES = new Set();
for (const f of PAGES.map(([n]) => n)) {
  const html = readFileSync(join(PROJET, "site", f), "utf8");
  // Le commentaire qui explique POURQUOI ces hôtes sont partis nomme
  // forcément l'un d'eux : on ne regarde donc pas les commentaires.
  const sansCommentaires = html.replace(/<!--[\s\S]*?-->/g, "");
  const fautif = HOTES_INTERDITS.test(sansCommentaires);
  if (fautif) fautes += 1;
  console.log(`  ${fautif ? "✗" : "✓"} ${f.padEnd(22)} ${fautif ? "charge depuis un hôte tiers" : "aucun hôte tiers"}`);
  for (const m of html.matchAll(/\.\/(vendor\/polices\/[\w.-]+\.woff2)/g)) POLICES.add(m[1]);
}
for (const c of POLICES) {
  const existe = existsSync(join(PROJET, "site", c));
  if (!existe) fautes += 1;
  if (!existe) console.log(`  ✗ police référencée introuvable : ${c}`);
}
console.log(`  ✓ ${POLICES.size} fichiers de police référencés, tous présents`);

// ── La gravité des doutes, cohérente avec ce que la table en dit ─────────
//
// Le champ `gravite` sépare « presque toujours végétal aujourd'hui » de
// « réellement d'origine animale ». Mesuré le 13 août : il existait depuis
// l'origine et **aucune** des 56 entrées ne le portait. La branche rassurante
// de l'écran — « le doute est théorique » — ne pouvait donc jamais s'afficher,
// et un chocolat signalé pour sa lécithine recevait le même avertissement
// qu'un paquet de bonbons à la gélatine.
//
// Ce contrôle ne juge pas quelles substances méritent l'indulgence : il
// vérifie que la table est d'accord avec elle-même. Une raison qui dit
// « presque toujours végétale » doit porter la gravité faible, et une gravité
// faible doit être justifiée par sa propre raison.
console.log("");
const DIT_FAIBLE = /presque toujours|generalement vegetale|généralement végétale|le plus souvent par fermentation|mais rare|reste possible|possible mais rare/i;
const incoherentes = [];
for (const [code, infos] of Object.entries(ADDITIFS_A_RISQUE)) {
  const raisonFaible = DIT_FAIBLE.test(infos.raison);
  const marqueFaible = infos.gravite === "faible";
  if (raisonFaible && !marqueFaible)
    incoherentes.push(`${code.toUpperCase()} : sa raison dit que le doute est faible, mais la gravité ne l'est pas`);
  if (marqueFaible && !raisonFaible)
    incoherentes.push(`${code.toUpperCase()} : marqué faible sans que sa raison le justifie`);
}
const nbFaibles = Object.values(ADDITIFS_A_RISQUE).filter((i) => i.gravite === "faible").length;
fautes += incoherentes.length;
console.log(
  `  ${incoherentes.length ? "✗" : "✓"} gravité des doutes      ${nbFaibles} additif(s) de gravité faible sur ${nbAdditifs}` +
    (incoherentes.length ? "" : ", tous justifiés par leur raison")
);
for (const m of incoherentes) console.log(`      ← ${m}`);

// ── Les fiches vérifiées, celles qui portent le sceau ────────────────────
//
// Une fiche de `verifications.json` PRIME sur l'analyse : son statut s'affiche
// et les alertes du moteur sont effacées. Mesuré le 12 août sur un pâté dont
// la composition dit « foie de porc, lardons » : cinq fautes de saisie sur
// cinq affichaient ✅ avec le sceau « ✓ VÉRIFIÉ » et zéro alerte — « Halal »
// avec une majuscule, « halall », statut absent, vide, ou « oui ». L'écran
// retombait sur le vert par défaut.
//
// Le scanner ignore désormais une fiche illisible. Mais mieux vaut arrêter la
// faute AVANT la mise en ligne : ce fichier-ci est rempli à la main, en
// recopiant des réponses de fabricants, et la faute de frappe y est normale.
console.log("");
const STATUTS_CONNUS = ["halal", "douteux", "haram", "inconnu"];
for (const [fichier, cle] of [["verifications.json", "produits"], ["produits-locaux.json", "produits"]]) {
  const chemin = join(PROJET, "site", fichier);
  let base;
  try {
    base = JSON.parse(readFileSync(chemin, "utf8"));
  } catch (e) {
    console.log(`  ✗ ${fichier} : JSON illisible — ${e.message}`);
    fautes += 1;
    continue;
  }
  const fiches = Object.entries(base[cle] || {});
  const mauvaises = [];
  for (const [code, f] of fiches) {
    if (!/^\d{8,14}$/.test(code)) mauvaises.push(`${code} : ce n'est pas un code-barres`);
    if (!f || typeof f !== "object") { mauvaises.push(`${code} : fiche vide`); continue; }
    // Seul verifications.json porte un statut : produits-locaux.json fournit
    // des ingrédients, et c'est le moteur qui tranche.
    if (fichier === "verifications.json") {
      const s = String(f.statut || "").toLowerCase().trim();
      if (!STATUTS_CONNUS.includes(s))
        mauvaises.push(`${code} : statut « ${f.statut} » inconnu — attendu ${STATUTS_CONNUS.join(", ")}`);
      if (!String(f.source || "").trim()) mauvaises.push(`${code} : aucune source`);
      if (!String(f.date || "").trim()) mauvaises.push(`${code} : aucune date`);
    } else if (!String(f.ingredientsTexte || f.ingredients || "").trim()) {
      mauvaises.push(`${code} : aucun texte d'ingrédients`);
    }
  }
  fautes += mauvaises.length;
  console.log(`  ${mauvaises.length ? "✗" : "✓"} ${fichier.padEnd(22)} ${fiches.length} fiche(s)` +
    (mauvaises.length ? "" : fiches.length ? ", toutes relisibles" : " — base encore vide"));
  for (const m of mauvaises) console.log(`      ← ${m}`);
}

if (fautes > 0) {
  console.log(`\n✗ ${fautes} affirmation(s) fausse(s). Relance : npm run build:additifs && npm run seo:dates`);
  process.exit(1);
}
console.log("\n✓ Nombres et dates annoncés : tout correspond à la source.");
