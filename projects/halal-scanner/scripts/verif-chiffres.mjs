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
 */
import { readFileSync } from "node:fs";
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

if (fautes > 0) {
  console.log(`\n✗ ${fautes} nombre(s) faux. Relance : npm run build:additifs`);
  process.exit(1);
}
console.log("\n✓ Tous les nombres annoncés correspondent au moteur.");
