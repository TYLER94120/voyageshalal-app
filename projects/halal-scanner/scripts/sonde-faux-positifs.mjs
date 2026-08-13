// L'autre direction : un « douteux » injustifie use la confiance et pousse a
// ignorer l'app. On verifie que des compositions banales restent halal.
//
// ARMEE LE 12 AOUT 2026, meme raison que sa jumelle sonde-faux-negatifs :
// elle imprimait « FAUX POSITIFS : n » puis sortait en succes, quel que soit
// n. Elle tourne dans Controles a chaque envoi de code — verte quoi qu'elle
// trouve. Etat a l'armement : 15/15 restees halal, 0 faux positif.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
mkdirSync(".test-build", { recursive: true });
writeFileSync(".test-build/halal.mjs", readFileSync("site/halal.js", "utf8"));
const { analyserProduit } = await import(pathToFileURL(".test-build/halal.mjs").href);

const DOIVENT_RESTER_HALAL = [
  "eau, sucre, jus de citron",
  "farine de blé, eau, levure, sel",
  "lait, ferments lactiques, sel",
  "tomates, huile d'olive vierge extra, basilic, sel",
  "Vitamine E 400 UI, huile de tournesol",
  "vitamine E, vitamine C, zinc",
  "glycérine végétale, eau, parfum",
  "lipase microbienne, lait, sel",
  "présure microbienne, lait, sel",
  "vinaigre de vin, huile, moutarde",
  "arôme naturel de vanille sans alcool",
  "chocolat noir 70%, sucre, beurre de cacao",
  "riz, eau, sel",
  "pois chiches, eau, sel, acide citrique",
  "huile de palme, sucre, cacao maigre, noisettes",
];

let faux = [];
for (const t of DOIVENT_RESTER_HALAL) {
  const v = analyserProduit({ ingredientsTexte: t, additifs: [] });
  if (v.alertes.length > 0) faux.push([t, v.alertes.map((a) => a.element).join(", ")]);
}
console.log(`${DOIVENT_RESTER_HALAL.length} compositions banales testées.`);
console.log(`Restées halal : ${DOIVENT_RESTER_HALAL.length - faux.length}`);
console.log(`FAUX POSITIFS : ${faux.length}`);
for (const [t, a] of faux) console.log(`  ✗ « ${t} » → alerte : ${a}`);

// ── Les compositions COURTES, mais complètes ────────────────────────────
//
// Le 13 août, Mohamed a photographié une bouteille d'eau Cristaline :
// composition « Eau de source », verdict INCONNU. Onze lettres, seuil à
// douze. Mesuré alors sur 19 compositions réelles : SEIZE ressortaient
// INCONNU — eau, riz, sel, sucre, miel, farine, thé, café, pois chiches,
// semoule, huile d'olive, lait entier.
//
// Un « je ne sais pas » devant une bouteille d'eau ne protège personne : il
// donne l'app pour cassée, et on cesse de la croire quand elle dit vraiment
// quelque chose. C'est un faux positif d'un autre genre — pas une accusation,
// un refus de répondre.
const COURTES = [
  "Eau de source", "Eau", "Riz", "Sel", "Sucre", "Miel", "Semoule",
  "Thé vert", "Sel de mer", "Lait entier", "Farine de blé", "Café arabica",
  "Pois chiches", "Huile d'olive", "riz, eau, sel", "Eau, sucre",
];
const refusees = COURTES.filter(
  (t) => analyserProduit({ ingredientsTexte: t, additifs: [] }).statut === "inconnu"
);
console.log(`\n${COURTES.length} compositions courtes mais complètes testées.`);
for (const t of refusees) console.log(`  ✗ « ${t} » → INCONNU alors que l'étiquette est lisible`);

// ── Les étiquettes qui PRÉCISENT déjà l'origine ─────────────────────────
//
// Même famille que l'eau de source du 13 août : un excès de doute sur un
// produit ordinaire, alors que l'étiquette RÉPOND déjà à la question. Douter
// d'un paquet qui écrit « d'origine végétale » punit exactement les fabricants
// qui ont fait l'effort de le préciser.
const ORIGINE_DITE = [
  "chocolat, sucre, lécithine de soja",
  "chocolat 40% (sucre, beurre de cacao, émulsifiant : lécithines de soja)",
  "farine, sucre, émulsifiant E471 d'origine végétale",
  "farine, mono- et diglycérides d'acides gras d'origine végétale",
  "comprimé, stéarate de magnésium d'origine végétale",
  "biscuit, sucre, graisse végétale de palme",
  "lait, présure microbienne, sel",
  // La gélatine de poisson est l'alternative halal la plus courante, et les
  // fabricants l'écrivent justement pour le signaler.
  "bonbons, sucre, gélatine de poisson",
  "bonbons, sucre, gélatine de boeuf halal",
];
const doutesInutiles = ORIGINE_DITE.filter(
  (t) => analyserProduit({ ingredientsTexte: t, additifs: [] }).statut !== "halal"
);
console.log(`\n${ORIGINE_DITE.length} étiquettes qui précisent l'origine testées.`);
for (const t of doutesInutiles) console.log(`  ✗ « ${t.slice(0, 52)}… » → doute alors que l'étiquette répond`);

// ET LE PIÈGE DE CES GARDE-FOUS : ils sont PERMISSIFS, donc le vrai risque
// est qu'ils avalent un interdit au passage. Mesuré le 13 août : la première
// version rendait HALAL sur « mono- et diglycérides d'acides gras ANIMAUX et
// huile végétale » — le motif enjambait le mot « animaux » pour atteindre
// « végétale ». Un garde-fou trop large fabrique un faux négatif.
const PIEGES = [
  ["mono/diglycérides animaux + huile végétale", "mono- et diglycérides d'acides gras animaux et huile végétale", "douteux"],
  ["gélatine de porc ET de poisson", "bonbons, gélatine de porc, gélatine de poisson", "haram"],
  ["gélatine de boeuf NON halal", "bonbons, gélatine de boeuf non halal", "douteux"],
  ["stéarate d'origine animale", "comprimé, stéarate de magnésium d'origine animale", "douteux"],
  ["saindoux + huile végétale", "pate, saindoux, huile végétale", "haram"],
];
const avales = PIEGES.filter(
  ([, t, attendu]) => analyserProduit({ ingredientsTexte: t, additifs: [] }).statut !== attendu
);
for (const [nom, , attendu] of avales)
  console.log(`  ✗ ${nom} : le garde-fou a avalé l'interdit, attendu ${attendu.toUpperCase()}`);
if (!doutesInutiles.length && !avales.length)
  console.log(`  toutes tranchées halal, et les ${PIEGES.length} pièges restent attrapés.`);

// Le garde-fou d'origine doit tenir : une étiquette qu'on ne sait vraiment pas
// lire reste INCONNU. C'est pour elle que le seuil existait.
const ILLISIBLES = [
  ["arabe seul", "المكونات: ماء، سكر، ملح"],
  ["deux lettres", "ab"],
  ["texte vide", ""],
];
const lues = ILLISIBLES.filter(
  ([, t]) => analyserProduit({ ingredientsTexte: t, additifs: [] }).statut !== "inconnu"
);
for (const [nom] of lues) console.log(`  ✗ « ${nom} » n'est plus INCONNU — le garde-fou a sauté`);
if (!refusees.length && !lues.length)
  console.log(`  toutes tranchées, et les ${ILLISIBLES.length} vraiment illisibles restent INCONNU.`);

if (faux.length + refusees.length + lues.length + doutesInutiles.length + avales.length > 0) {
  if (faux.length)
    console.log(`\n✗ ${faux.length} composition(s) banale(s) accusée(s) à tort. Un moteur qui doute de tout ne sert plus à rien.`);
  if (refusees.length + lues.length)
    console.log(`\n✗ ${refusees.length + lues.length} composition(s) mal classée(s) entre « lisible » et « illisible ».`);
  if (doutesInutiles.length)
    console.log(`\n✗ ${doutesInutiles.length} étiquette(s) qui précisent l'origine et dont on doute quand même.`);
  if (avales.length)
    console.log(`\n✗ ${avales.length} interdit(s) avalé(s) par un garde-fou trop large. C'est un faux négatif.`);
  process.exit(1);
}
console.log(`\n✓ Aucun faux positif : ${DOIVENT_RESTER_HALAL.length} compositions banales restent halal,`);
console.log(`  ${COURTES.length} compositions courtes sont tranchées, ${ILLISIBLES.length} illisibles restent INCONNU,`);
console.log(`  ${ORIGINE_DITE.length} étiquettes à origine précisée passent, et les ${PIEGES.length} pièges restent attrapés.`);
