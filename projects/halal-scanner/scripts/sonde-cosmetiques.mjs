// Meme exercice que sur le moteur alimentaire, applique aux 26 regles INCI.
// Mentions reellement imprimees au dos de flacons.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
mkdirSync(".test-build", { recursive: true });
writeFileSync(".test-build/cosmetiques.mjs", readFileSync("site/cosmetiques.js", "utf8"));
const { analyserCosmetique } = await import(pathToFileURL(".test-build/cosmetiques.mjs").href);

// Echafaudage NEUTRE : verifie ci-dessous qu'il ne declenche rien par lui-meme.
const BASE = "Aqua, Parfum, Sodium Chloride";
const test = (t) => analyserCosmetique({ ingredientsTexte: `${BASE}, ${t}`, labels: [] });
if (analyserCosmetique({ ingredientsTexte: BASE, labels: [] }).alertes.length > 0) {
  console.error("ECHAFAUDAGE CONTAMINE : il alerte tout seul. Sonde inutilisable.");
  process.exit(1);
}

const DOIVENT_ALERTER = [
  ["Sodium Tallowate", "suif, savons"],
  ["Lard", "graisse porcine"],
  ["Carmine", "insecte broyé"],
  ["CI 75470", "carmin, notation colorant"],
  ["Collagen", "protéine animale"],
  ["Elastin", "protéine animale"],
  ["Keratin", "protéine animale"],
  ["Gelatin", "protéine animale"],
  ["Alcohol Denat.", "alcool éthylique"],
  ["Placenta", "extrait animal"],
  ["Lanolin", "cire de laine"],
  ["Squalene", "souvent foie de requin"],
  ["Guanine", "écailles de poisson"],
  ["CI 75170", "guanine, notation colorant"],
  ["Shellac", "sécrétion d'insecte"],
  ["Silk Amino Acids", "protéine de soie"],
  ["Hydrolyzed Silk", "protéine de soie"],
  ["Snail Secretion Filtrate", "mucine d'escargot"],
  ["Ambergris", "sécrétion de cachalot"],
  ["Civet", "sécrétion animale"],
  ["Castoreum", "sécrétion de castor"],
  ["Musk", "sécrétion animale"],
  ["Cholesterol", "lipide animal"],
  ["Oleic Acid", "acide gras, origine non précisée"],
  ["Palmitic Acid", "acide gras, origine non précisée"],
  ["Myristic Acid", "acide gras, origine non précisée"],
  ["Sodium Stearate", "sel d'acide gras"],
  ["Hyaluronic Acid", "parfois crêtes de coq"],
  ["Retinol", "parfois d'origine animale"],
  ["Ethanol", "alcool éthylique"],
];

const DOIVENT_RESTER_MUETS = [
  ["Cetyl Alcohol", "cire grasse, PAS de l'alcool"],
  ["Cetearyl Alcohol", "cire grasse"],
  ["Stearyl Alcohol", "cire grasse"],
  ["Behenyl Alcohol", "cire grasse"],
  ["Benzyl Alcohol", "conservateur, non enivrant"],
  ["Propylene Glycol", "n'est pas un alcool éthylique"],
  ["Citric Acid", "banal"],
  ["Sodium Chloride", "sel"],
  ["Tocopherol", "vitamine E"],
  ["Aloe Barbadensis Leaf Juice", "végétal"],
];

const manques = DOIVENT_ALERTER.filter(([m]) => test(m).alertes.length === 0);
const faux = DOIVENT_RESTER_MUETS.filter(([m]) => test(m).alertes.length > 0);

console.log(`FAUX NEGATIFS — ${DOIVENT_ALERTER.length} mentions testées, ${DOIVENT_ALERTER.length - manques.length} détectées, ${manques.length} ignorées :`);
for (const [m, p] of manques) console.log(`  ✗ ${m} — ${p}`);
console.log(`\nFAUX POSITIFS — ${DOIVENT_RESTER_MUETS.length} testées, ${faux.length} alertes injustifiées :`);
for (const [m, p] of faux) console.log(`  ✗ ${m} — ${p}`);
