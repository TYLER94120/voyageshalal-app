/**
 * Ce qui est interdit doit etre attrape. Sinon quelqu'un mange du porc.
 *
 * ARMEE LE 12 AOUT 2026. Jusqu'a ce matin cette sonde AFFICHAIT ses manques
 * et sortait quand meme en succes. Elle tourne pourtant dans Controles a
 * chaque envoi de code, et l'en-tete du workflow annonce que les faux
 * negatifs y sont controles « sans qu'on ait a y penser ».
 *
 * Mesure faite avant d'ecrire cette ligne : j'ai casse le moteur expres —
 * la regle texte /gelatine/ remplacee par un motif qui ne peut rien
 * reconnaitre. Resultat : « eau, sucre, gelatine, arome » ressortait HALAL,
 * 0 alerte. Les trois sondes du workflow sortaient toutes en succes. Le
 * controle etait vert, le pousse serait passe, la mise en ligne aussi.
 *
 * C'est cela qui laissait a Mohamed le soin de trouver les defauts a la
 * main, capture d'ecran par capture d'ecran. Un controle qui ne peut pas
 * virer au rouge ne controle rien : il rassure.
 *
 * Etat au moment de l'armement : 8/8, 8/8, 14/14 — aucun manque. Le garde-fou
 * se pose donc sur un moteur propre, il ne gele aucun defaut existant.
 */
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
  // Ajoutés le 12 août 2026. L'expérience de sabotage a montré le trou : en
  // cassant la règle texte /gelatine/, la sonde restait VERTE — parce qu'elle
  // ne testait pas le mot « gélatine », seulement le code E441, qui passe par
  // une autre règle. Les quatorze mots du dessus sont des termes techniques
  // ou anglais ; il manquait le vocabulaire d'une étiquette ordinaire, celui
  // qu'on lit vraiment sur un paquet en France ou au Maroc.
  ["gélatine", "le mot le plus fréquent sur une étiquette"],
  ["porc", "le mot lui-même"],
  ["lardons", "forme d'étiquette la plus courante"],
  ["saindoux", "graisse de porc"],
  ["jambon", "charcuterie"],
  ["bacon", "porc"],
  ["couenne", "peau de porc"],
  ["suif", "graisse animale, en français"],
  ["graisse animale", "origine non précisée"],
  ["présure", "sans mention microbienne"],
  ["carmin", "orthographe française"],
  ["cochenille", "l'insecte, nommé en clair"],
  ["rhum", "spiritueux"],
  ["vin blanc", "vin, écrit tel quel"],
  ["bière", "alcool"],
  ["mono- et diglycérides", "E471, écrit en toutes lettres"],
  ["boyau naturel", "enveloppe de saucisse"],
  ["L-cystéine", "E920, souvent d'origine animale"],
  ["stéarate de magnésium", "acide gras, origine possible animale"],
];
const motManques = MOTS.filter(([m]) => parTexte(m).alertes.length === 0);
console.log(`${MOTS.length} testés, ${MOTS.length - motManques.length} détectés, ${motManques.length} ignorés :`);
for (const [m, p] of motManques) console.log(`  ✗ « ${m} » — ${p}`);

// Le verdict. Un seul manque suffit : chacune de ces entrées est un aliment
// qu'on servirait comme licite à quelqu'un qui nous a crus.
const manques = codeManques.length + texteManques.length + motManques.length;
if (manques > 0) {
  console.log(`\n✗ ${manques} FAUX NÉGATIF(S) — de l'interdit passe pour licite. Le moteur n'est pas publiable.`);
  process.exit(1);
}
// Compté, pas écrit à la main : le jour où quelqu'un ajoute un cas, cette
// ligne se met à jour toute seule. Une sonde qui annonce un chiffre faux
// abîme la confiance exactement comme une page qui en annonce un.
const total = codes.length * 2 + MOTS.length;
console.log(`\n✓ Aucun faux négatif : les ${total} cas à risque sont tous attrapés.`);
