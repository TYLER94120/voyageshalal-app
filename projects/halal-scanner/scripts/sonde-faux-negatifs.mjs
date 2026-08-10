import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
mkdirSync(".test-build", { recursive: true });
writeFileSync(".test-build/halal.mjs", readFileSync("site/halal.js", "utf8"));
const { analyserProduit } = await import(pathToFileURL(".test-build/halal.mjs").href);

const parTexte = (t) => analyserProduit({ ingredientsTexte: `eau, sucre, ${t}, sel`, additifs: [] });
const parCode  = (c) => analyserProduit({ ingredientsTexte: "eau, sucre, sel", additifs: [`en:${c.toLowerCase()}`] });

console.log("=== A. codes E par le canal NORMAL (champ additifs d'Open Food Facts) ===");
const codes = ["e441", "e471", "e120", "e422", "e904", "e542", "e920", "e1105"];
const codeManques = codes.filter((c) => parCode(c).alertes.length === 0);
console.log(`${codes.length} testés, ${codes.length - codeManques.length} détectés` +
  (codeManques.length ? ` | NON couverts par la table : ${codeManques.join(", ")}` : " | tous couverts"));

console.log("\n=== B. les MEMES codes ecrits dans le TEXTE de la composition ===");
const texteManques = codes.filter((c) => parTexte(c.toUpperCase()).alertes.length === 0);
console.log(`${codes.length} testés, ${codes.length - texteManques.length} détectés` +
  (texteManques.length ? ` | ignorés : ${texteManques.join(", ").toUpperCase()}` : ""));

console.log("\n=== C. mots d'etiquette, hors codes E ===");
const MOTS = [
  ["rennet", "présure, en anglais"],
  ["pepsine", "enzyme souvent porcine"],
  ["pancréatine", "enzyme animale"],
  ["lipase", "enzyme souvent animale"],
  ["shortening", "matière grasse parfois animale"],
  ["tallow", "suif, en anglais"],
  ["gomme laque", "shellac"],
  ["carmine", "carmin, orthographe anglaise"],
  ["collagène", "protéine animale"],
  ["élastine", "protéine animale"],
  ["porto", "vin muté"],
  ["sherry", "vin muté"],
  ["madère", "vin muté"],
  ["glycérine", "origine non précisée"],
];
const motManques = MOTS.filter(([m]) => parTexte(m).alertes.length === 0);
console.log(`${MOTS.length} testés, ${MOTS.length - motManques.length} détectés, ${motManques.length} ignorés :`);
for (const [m, p] of motManques) console.log(`  ✗ « ${m} » — ${p}`);
