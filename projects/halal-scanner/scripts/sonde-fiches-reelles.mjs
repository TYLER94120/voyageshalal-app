/**
 * Le moteur, confronté à de VRAIS produits.
 *
 * Le trou que cette sonde comble — élément 3 de la file d'attente : le proxy
 * de l'atelier refuse `world.openfoodfacts.org` par politique
 * (`connect_rejected — 403 to CONNECT`, revérifié le 13 août à 16:05). Aucun
 * agent ne peut donc interroger une base réelle. Tout ce qui est vérifié
 * jusqu'ici — 82 cas en CI, 56 additifs, 29 règles cosmétiques — l'est contre
 * des fiches que **nous** avons écrites. Elles ne couvrent que ce à quoi nous
 * avons pensé.
 *
 * D'où la voie de secours : Mohamed enregistre depuis SON navigateur quelques
 * fiches réelles, on les fige dans le dépôt, et le moteur tourne dessus hors
 * ligne. Voir `site/../fiches-reelles/README.md` pour la marche à suivre.
 *
 * Ce que cette sonde rend, et qu'aucune autre ne peut rendre : **le
 * pourcentage de produits réels qui ressortent INCONNU**. C'est le chiffre
 * qui manque depuis le début — un moteur qui répond « je ne sais pas » sur la
 * moitié des paquets d'un rayon n'a pas la même valeur qu'un moteur qui
 * tranche neuf fois sur dix.
 *
 * Sortie en erreur : seulement si une fiche est illisible ou fait planter le
 * moteur. La répartition des verdicts est une MESURE, pas une note : je
 * n'invente pas un seuil (« moins de 30 % d'inconnus ») que rien ne fonde.
 * Dossier vide = 0 fiche, rien à mesurer, et c'est dit franchement.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const PROJET = join(ICI, "..");
const DOSSIER = join(PROJET, "fiches-reelles");

mkdirSync(join(PROJET, ".test-build"), { recursive: true });
writeFileSync(join(PROJET, ".test-build/halal.mjs"), readFileSync(join(PROJET, "site/halal.js"), "utf8"));
writeFileSync(join(PROJET, ".test-build/cosmetiques.mjs"), readFileSync(join(PROJET, "site/cosmetiques.js"), "utf8"));
const { analyserProduit } = await import(pathToFileURL(join(PROJET, ".test-build/halal.mjs")).href);
const { analyserCosmetique } = await import(pathToFileURL(join(PROJET, ".test-build/cosmetiques.mjs")).href);

// Même aiguillage que `analyserSelonType` dans scan.html, y compris le second
// avis déclenché par « Aqua » — le nom INCI de l'eau, qui trahit une liste
// cosmétique rangée dans la base alimentaire. `sonde:verdicts` garde la
// version de la page ; celle-ci sert à mesurer, pas à la remplacer.
const RESSEMBLE_A_UNE_INCI = /\baqua\b/i;
const RANG = { haram: 3, douteux: 2, inconnu: 1, halal: 0 };

function analyser(fiche, cosmetique) {
  const entree = {
    ingredientsTexte: fiche.ingredients_text_fr || fiche.ingredients_text || null,
    additifs: Array.isArray(fiche.additives_tags) ? fiche.additives_tags : [],
    labels: Array.isArray(fiche.labels_tags) ? fiche.labels_tags : [],
  };
  if (cosmetique) return analyserCosmetique({ ingredientsTexte: entree.ingredientsTexte, labels: entree.labels });
  const a = analyserProduit(entree);
  if (!RESSEMBLE_A_UNE_INCI.test(String(entree.ingredientsTexte || ""))) return a;
  const c = analyserCosmetique({ ingredientsTexte: entree.ingredientsTexte, labels: entree.labels });
  return RANG[c.statut] > RANG[a.statut] ? c : a;
}

// Pourquoi ce produit n'a pas pu être tranché — dit en clair, parce que
// « inconnu » n'a pas la même valeur selon la raison.
function pourquoiInconnu(texte) {
  const t = String(texte || "");
  if (!t.trim()) return "aucune liste d'ingrédients dans la base";
  const latines = (t.match(/[a-zà-öø-ÿ]/gi) || []).length;
  if (latines < 12 && /[؀-ۿ]/.test(t)) return "étiquette en arabe uniquement";
  if (latines < 12) return `trop court pour être lu (${latines} lettres)`;
  return "mentions d'absence uniquement (« non renseigné », « voir emballage »…)";
}

if (!existsSync(DOSSIER)) {
  console.log("Dossier fiches-reelles/ absent — rien à mesurer.");
  process.exit(0);
}
const fichiers = readdirSync(DOSSIER).filter((f) => f.endsWith(".json")).sort();
if (fichiers.length === 0) {
  console.log("0 fiche réelle dans fiches-reelles/ — rien à mesurer.");
  console.log("Marche à suivre pour en déposer : fiches-reelles/README.md");
  process.exit(0);
}

const compte = { halal: 0, douteux: 0, haram: 0, inconnu: 0 };
const inconnus = [];
let illisibles = 0;

console.log(`${fichiers.length} fiche(s) réelle(s) figée(s) dans le dépôt.\n`);
for (const f of fichiers) {
  let brut;
  try {
    brut = JSON.parse(readFileSync(join(DOSSIER, f), "utf8"));
  } catch (e) {
    illisibles += 1;
    console.log(`  ✗ ${f} : JSON illisible — ${e.message}`);
    continue;
  }
  // On accepte la réponse d'API telle qu'elle sort du navigateur, et aussi la
  // fiche seule : c'est plus tolérant que d'exiger un format.
  const fiche = brut && brut.product ? brut.product : brut;
  if (!fiche || typeof fiche !== "object") {
    illisibles += 1;
    console.log(`  ✗ ${f} : ni une réponse d'API, ni une fiche produit`);
    continue;
  }
  // Convention : un fichier nommé « obf-… » vient d'Open Beauty Facts.
  const cosmetique = /^obf[-_]/i.test(f);
  let v;
  try {
    v = analyser(fiche, cosmetique);
  } catch (e) {
    illisibles += 1;
    console.log(`  ✗ ${f} : le moteur a planté — ${e.message}`);
    continue;
  }
  compte[v.statut] = (compte[v.statut] || 0) + 1;
  const nom = (fiche.product_name || "(sans nom)").slice(0, 34);
  const texte = fiche.ingredients_text_fr || fiche.ingredients_text || "";
  if (v.statut === "inconnu") inconnus.push([f, nom, pourquoiInconnu(texte)]);
  console.log(
    `  ${v.statut === "inconnu" ? "?" : "•"} ${nom.padEnd(36)} ${v.statut.toUpperCase().padEnd(8)}` +
      ` ${v.alertes.length} alerte(s)${cosmetique ? "  [cosmétique]" : ""}`
  );
}

const total = Object.values(compte).reduce((a, b) => a + b, 0);
console.log("\n── Répartition sur des produits RÉELS ──");
for (const s of ["halal", "douteux", "haram", "inconnu"]) {
  const n = compte[s] || 0;
  const pc = total ? Math.round((n * 100) / total) : 0;
  console.log(`  ${s.toUpperCase().padEnd(9)} ${String(n).padStart(3)} / ${total}   ${pc} %`);
}

if (inconnus.length) {
  console.log("\n── Pourquoi ceux-là n'ont pas pu être tranchés ──");
  for (const [f, nom, raison] of inconnus) console.log(`  ${nom.padEnd(36)} ${raison}`);
}

if (illisibles > 0) {
  console.log(`\n✗ ${illisibles} fiche(s) illisible(s) ou qui font planter le moteur.`);
  process.exit(1);
}
console.log(`\n✓ ${total} fiche(s) réelle(s) analysée(s), aucune n'a fait planter le moteur.`);
