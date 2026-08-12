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

if (faux.length > 0) {
  console.log(`\n✗ ${faux.length} composition(s) banale(s) accusée(s) à tort. Un moteur qui doute de tout ne sert plus à rien.`);
  process.exit(1);
}
console.log("\n✓ Aucun faux positif : les 15 compositions banales restent halal.");
