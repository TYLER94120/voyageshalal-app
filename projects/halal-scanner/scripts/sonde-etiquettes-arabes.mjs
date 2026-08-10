// Public cible : le Maghreb. Les etiquettes y sont bilingues, parfois
// uniquement en arabe. Le moteur ne connait que des mots francais et anglais.
// Que rend-il alors ?
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
mkdirSync(".test-build", { recursive: true });
writeFileSync(".test-build/halal.mjs", readFileSync("site/halal.js", "utf8"));
const { analyserProduit } = await import(pathToFileURL(".test-build/halal.mjs").href);

const CAS = [
  ["français seul, avec gélatine", "eau, sucre, gélatine, arôme"],
  ["bilingue, gélatine côté français", "ماء، سكر، جيلاتين، نكهة / eau, sucre, gélatine, arôme"],
  ["bilingue, gélatine SEULEMENT en arabe", "ماء، سكر، جيلاتين، نكهة / eau, sucre, arome"],
  ["arabe seul, contient de la gélatine", "المكونات: ماء، سكر، جيلاتين، نكهة طبيعية"],
  ["arabe seul, contient du porc", "المكونات: دهن الخنزير، ملح"],
  ["arabe seul, produit banal", "المكونات: ماء، سكر، ملح"],
  ["texte vide", ""],
];

for (const [nom, texte] of CAS) {
  const v = analyserProduit({ ingredientsTexte: texte, additifs: [] });
  console.log(`${nom.padEnd(42)} -> ${v.statut.toUpperCase().padEnd(8)} ${v.alertes.length} alerte(s)`);
}
