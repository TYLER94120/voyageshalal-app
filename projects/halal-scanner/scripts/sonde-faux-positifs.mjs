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

if (faux.length + refusees.length + lues.length > 0) {
  if (faux.length)
    console.log(`\n✗ ${faux.length} composition(s) banale(s) accusée(s) à tort. Un moteur qui doute de tout ne sert plus à rien.`);
  if (refusees.length + lues.length)
    console.log(`\n✗ ${refusees.length + lues.length} composition(s) mal classée(s) entre « lisible » et « illisible ».`);
  process.exit(1);
}
console.log(`\n✓ Aucun faux positif : ${DOIVENT_RESTER_HALAL.length} compositions banales restent halal,`);
console.log(`  ${COURTES.length} compositions courtes sont tranchées, ${ILLISIBLES.length} illisibles restent INCONNU.`);
