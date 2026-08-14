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

console.log("\n=== D. etiquettes qui disent qu'il n'y a PAS d'etiquette ===");
// Le pire verdict possible n'est pas un interdit manque : c'est un HALAL
// fabrique a partir d'une absence de donnees. Mesure du 12 aout, avant
// correctif : 16 formulations sur 28 ressortaient HALAL, dont « non
// renseigne » (12 lettres, pile le seuil) et « voir l'emballage ». Le moteur
// comptait les lettres sans regarder ce qu'elles disaient.
const RIEN_A_LIRE = [
  "non renseigné", "non renseignée", "Non renseigne", "non communiqué",
  "information non disponible", "aucune information", "pas d'information",
  "liste non disponible", "ingrédients non disponibles",
  "voir emballage", "voir l'emballage", "voir sur l'emballage",
  "see packaging", "not available", "no information",
];
const inventes = RIEN_A_LIRE.filter((t) => analyserProduit({ ingredientsTexte: t, additifs: [] }).statut === "halal");
console.log(`${RIEN_A_LIRE.length} formulations testées, ${inventes.length} rendent HALAL sans preuve :`);
for (const t of inventes) console.log(`  ✗ « ${t} » → HALAL alors qu'on ne sait rien`);

// Et l'exces inverse : une VRAIE composition qui mentionne l'emballage doit
// rester lisible. Retirer la mention plutot que rejeter le texte entier.
const VRAIES = [
  "Sucre, cacao maigre, noisettes. Voir emballage pour les allergènes.",
  "Farine de blé, eau, sel. Information non disponible sur les traces.",
];
const perdues = VRAIES.filter((t) => analyserProduit({ ingredientsTexte: t, additifs: [] }).statut === "inconnu");
for (const t of perdues) console.log(`  ✗ « ${t.slice(0, 46)}… » → INCONNU alors que la composition est là`);
if (!perdues.length) console.log(`${VRAIES.length} vraies compositions mentionnant l'emballage : toujours lues.`);

console.log("\n=== E. etiquettes qui NIENT le halal ===");
// « en:non-halal » contient « halal ». Le test etait un simple includes() :
// huit etiquettes qui nient explicitement le halal etaient donc lues comme une
// certification, et une composition a la gelatine ressortait HALAL, certifie.
// C'est l'inversion la plus grave possible — le produit affirmait le contraire
// de ce que la base disait.
const NIENT = [
  "en:non-halal", "en:not-halal", "fr:non-halal", "en:halal-not-certified",
  "en:no-halal-certification", "fr:sans-certification-halal",
  "en:non-vegan", "fr:non-vegetalien",
];
const AVEC_GELATINE = "eau, sucre, gélatine, arôme";
const inversees = NIENT.filter(
  (l) => analyserProduit({ ingredientsTexte: AVEC_GELATINE, additifs: [], labels: [l] }).statut === "halal"
);
console.log(`${NIENT.length} étiquettes négatives testées, ${inversees.length} lues comme une certification :`);
for (const l of inversees) console.log(`  ✗ « ${l} » → HALAL, alors que l'étiquette dit le contraire`);

// L'exces inverse : une vraie certification doit encore certifier. Sur une
// composition a la gelatine, une CERTIFICATION halal repond au doute — c'est
// exactement ce que la regle « sauf mention halal certifiee » annonce.
const AFFIRMENT = ["en:halal", "fr:halal", "en:certified-halal", "fr:certifie-halal",
  "en:halal-certified", "fr:viande-halal"];
const perduesLabel = AFFIRMENT.filter(
  (l) => analyserProduit({ ingredientsTexte: AVEC_GELATINE, additifs: [], labels: [l] }).statut !== "halal"
);
for (const l of perduesLabel) console.log(`  ✗ « ${l} » ne certifie plus rien`);
if (!perduesLabel.length) console.log(`${AFFIRMENT.length} vraies certifications : toujours reconnues.`);

// ATTENDU CORRIGE LE 13 AOUT, PAS LE CODE CONTOURNE.
//
// « en:vegan » et « fr:vegetalien » etaient dans la liste du dessus, donc
// censes rendre HALAL sur une composition a la gelatine. C'etait faux, et
// c'est le controle qui l'a dit : une correction de la nuit precedente a
// retire a l'etiquette vegane son role de laissez-passer. Une etiquette
// vegane ne repond QU'AUX doutes dont « vegetale » est une issue nommee —
// « origine vegetale ou animale non precisee », comme E471. Elle ne repond ni
// a la gelatine, dont la seule issue nommee est une mention halal, ni au
// carmin, extrait d'insectes par definition.
//
// Ces deux etiquettes ont donc leur propre attente, plus exigeante.
const VEGANE = ["en:vegan", "fr:vegetalien"];
const veganeFautif = [];
for (const l of VEGANE) {
  const surGelatine = analyserProduit({ ingredientsTexte: AVEC_GELATINE, additifs: [], labels: [l] }).statut;
  const surE471 = analyserProduit({ ingredientsTexte: "farine, sucre, emulsifiant E471", additifs: [], labels: [l] }).statut;
  if (surGelatine !== "douteux") veganeFautif.push(`« ${l} » + gélatine → ${surGelatine.toUpperCase()}, attendu DOUTEUX`);
  if (surE471 !== "halal") veganeFautif.push(`« ${l} » + E471 → ${surE471.toUpperCase()}, attendu HALAL`);
}
for (const m of veganeFautif) console.log(`  ✗ ${m}`);
if (!veganeFautif.length)
  console.log(`${VEGANE.length} étiquettes véganes : lèvent le doute sur E471, pas sur la gélatine.`);

console.log("\n=== F. la clause « peut contenir des traces de » ===");
// « Peut contenir des traces de porc » n'est pas « contient du porc ». Mesuré
// le 13 aout : les deux rendaient HARAM, le meme verdict qu'un pate de
// campagne. C'est faux sur la composition, et ca tranche une question d'ecole
// qui ne nous appartient pas. Ces alertes sont desormais DOUTEUX.
//
// Mais la separation est PERMISSIVE : le vrai risque est qu'elle avale un
// ingredient reel. C'est ce que cette section garde.
const TRACES = [
  ["traces de porc → doute, pas interdit", "biscuit, sucre. Peut contenir des traces de porc.", "douteux"],
  ["atelier utilisant du porc → doute", "biscuit, sucre. Fabriqué dans un atelier qui utilise du porc.", "douteux"],
  ["traces sans rien d'interdit → halal", "biscuit, sucre. Peut contenir des traces de fruits à coque.", "halal"],
  // Les quatre pieges : un ingredient REEL ne doit jamais devenir une trace.
  ["porc dans la compo + traces de lait", "pate, graisse de porc, sel. Peut contenir des traces de lait.", "haram"],
  ["compo qui REPREND apres la clause", "biscuit. Peut contenir des traces de lait. Ingredients : graisse de porc", "haram"],
  ["lardons dans la compo", "quiche, lardons, creme", "haram"],
  ["gélatine compo + traces de porc", "bonbons, gélatine. Peut contenir des traces de porc.", "douteux"],
];
const tracesFautives = TRACES.filter(
  ([, t, attendu]) => analyserProduit({ ingredientsTexte: t, additifs: [] }).statut !== attendu
);
console.log(`${TRACES.length} étiquettes avec clause de traces testées, ${tracesFautives.length} mal classée(s) :`);
for (const [nom, , attendu] of tracesFautives)
  console.log(`  ✗ ${nom} — attendu ${attendu.toUpperCase()}`);

// Le verdict. Un seul manque suffit : chacune de ces entrées est un aliment
// qu'on servirait comme licite à quelqu'un qui nous a crus.
const manques =
  codeManques.length + texteManques.length + motManques.length +
  inventes.length + perdues.length + inversees.length + perduesLabel.length +
  veganeFautif.length + tracesFautives.length;
if (manques > 0) {
  console.log(`\n✗ ${manques} FAUX NÉGATIF(S) — de l'interdit passe pour licite. Le moteur n'est pas publiable.`);
  process.exit(1);
}
// Compté, pas écrit à la main : le jour où quelqu'un ajoute un cas, cette
// ligne se met à jour toute seule. Une sonde qui annonce un chiffre faux
// abîme la confiance exactement comme une page qui en annonce un.
const total =
  codes.length * 2 + MOTS.length + RIEN_A_LIRE.length + VRAIES.length +
  NIENT.length + AFFIRMENT.length + VEGANE.length * 2 + TRACES.length;
console.log(`\n✓ Aucun faux négatif ni verdict inventé : les ${total} cas à risque sont tous tenus.`);
