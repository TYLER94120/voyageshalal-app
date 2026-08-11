#!/usr/bin/env node
// Tests du moteur de verdict halal.
// Lancer : npm run test:moteur
const { execSync } = require("child_process");
const path = require("path");

const racine = path.join(__dirname, "..");
execSync("npx tsc lib/halal.ts lib/cosmetiques.ts --outDir .test-build --module commonjs --target es2019", {
  cwd: racine,
  stdio: "inherit",
});
const { analyserProduit } = require(path.join(racine, ".test-build", "halal.js"));
const { analyserCosmetique } = require(path.join(racine, ".test-build", "cosmetiques.js"));

// [nom, entrée, statut attendu, nombre d'alertes attendu (null = non vérifié)]
const cas = [
  [
    // Attendu corrigé le 11 août, pas le code contourné : le mot « gélatine »
    // rendait DOUTEUX et son code E441 rendait HARAM — la même substance, deux
    // verdicts selon la façon dont l'étiquette l'écrit. Une gélatine sans
    // origine précisée peut être bovine : dire « interdit » serait un verdict
    // que l'étiquette ne permet pas. La doctrine dit DOUTEUX en cas de doute.
    // « gélatine de porc », elle, reste HARAM.
    "Bonbons gélatine (E441 + texte → 1 seule alerte, la plus sévère)",
    { ingredientsTexte: "sirop de glucose, gélatine, arômes", additifs: ["en:e441"] },
    "douteux",
    1,
  ],
  // Deux alertes de familles distinctes — « porc » et « gélatine » — et c'est juste :
  // les deux méritent d'être nommées à l'écran.
  ["Gélatine explicitement de porc → haram", { ingredientsTexte: "sucre, gélatine de porc", additifs: [] }, "haram", 2],
  // Étiquettes françaises — écarts mesurés le 11 août sur 32 mots courants.
  ["Lardons : le mot ressortait HALAL", { ingredientsTexte: "pate, creme, lardons, oeufs", additifs: [] }, "haram", 1],
  ["Boyau naturel (saucisses)", { ingredientsTexte: "viande, sel, boyau naturel", additifs: [] }, "douteux", null],
  ["L-cystéine écrite sans son code", { ingredientsTexte: "farine, eau, levure, l-cysteine", additifs: [] }, "douteux", 1],
  ["Acide stéarique écrit sans son code", { ingredientsTexte: "sucre, acide stearique", additifs: [] }, "douteux", 1],
  ["Stéarate de magnésium", { ingredientsTexte: "poudre, stearate de magnesium", additifs: [] }, "douteux", 1],
  ["« milliard » ne déclenche pas la règle du lard", { ingredientsTexte: "eau, sucre, un milliard de bulles", additifs: [] }, "halal", 0],
  ["Chips nature", { ingredientsTexte: "pommes de terre, huile de tournesol, sel", additifs: [] }, "halal", 0],
  ["Poulet certifié halal", { ingredientsTexte: "poulet, épices", additifs: [], labels: ["en:halal"] }, "halal", null],
  ["Poulet non certifié", { ingredientsTexte: "poulet, épices", additifs: [] }, "douteux", null],
  ["Plat au vin", { ingredientsTexte: "légumes, vin blanc, crème", additifs: [] }, "haram", null],
  ["Vinaigre de vin (faux positif neutralisé)", { ingredientsTexte: "huile de colza, vinaigre de vin, sel", additifs: [] }, "halal", 0],
  ["Sans alcool (faux positif neutralisé)", { ingredientsTexte: "boisson maltee sans alcool, eau, malt", additifs: [] }, "halal", 0],
  ["Brioche E471", { ingredientsTexte: "farine, oeufs, émulsifiant : e471", additifs: ["en:e471"] }, "douteux", null],
  ["Végane avec E471", { ingredientsTexte: "farine, émulsifiant : e471", additifs: ["en:e471"], labels: ["en:vegan"] }, "halal", null],
  ["Carmin (E120 + texte → 1 seule alerte)", { ingredientsTexte: "sucre, colorant : carmin", additifs: ["en:e120"] }, "douteux", 1],
  ["Aucune donnée", {}, "inconnu", 0],
  ["E1000 — acide cholique (bile animale)", { ingredientsTexte: "sucre", additifs: ["en:e1000"] }, "haram", 1],
  ["E442 — phosphatides d'ammonium", { ingredientsTexte: "sucre, beurre de cacao", additifs: ["en:e442"] }, "douteux", 1],
  ["E322 — lécithines", { ingredientsTexte: "cacao, lécithine de soja", additifs: ["en:e322"] }, "douteux", 1],
  ["E433 — polysorbate", { ingredientsTexte: "eau, sucre", additifs: ["en:e433"] }, "douteux", 1],
  ["Lactates E325+E326 → une seule alerte (même famille)", { ingredientsTexte: "eau", additifs: ["en:e325", "en:e326"] }, "douteux", 1],
  ["Additif non répertorié (E330) reste halal", { ingredientsTexte: "eau, sucre", additifs: ["en:e330"] }, "halal", 0],

  // --- Codes E ECRITS DANS LE TEXTE (10 août) ---------------------------------
  // Sans cette lecture, un produit du Maghreb transcrit depuis une photo — donc
  // sans champ « additifs » — ressortait halal alors que son étiquette dit E471.
  ["E471 écrit dans le texte", { ingredientsTexte: "farine, sucre, émulsifiant E471", additifs: [] }, "douteux", 1],
  ["E441 écrit dans le texte", { ingredientsTexte: "eau, sucre, gélifiant E441", additifs: [] }, "douteux", 1],
  ["E 471 avec une espace", { ingredientsTexte: "farine, émulsifiant E 471", additifs: [] }, "douteux", 1],
  ["E472e avec sa lettre", { ingredientsTexte: "farine, E472e, sel", additifs: [] }, "douteux", 1],
  ["Code dans le texte ET dans les additifs : une seule alerte", { ingredientsTexte: "sucre, E471", additifs: ["en:e471"] }, "douteux", 1],
  ["« Vitamine E 400 » n'est pas l'additif E400", { ingredientsTexte: "huile, Vitamine E 400 UI", additifs: [] }, "halal", 0],

  // --- MOTS D'ETIQUETTE ajoutés le 10 août ------------------------------------
  ["Porto (vin muté)", { ingredientsTexte: "sauce, porto, échalotes", additifs: [] }, "haram", 1],
  ["Rennet (présure en anglais)", { ingredientsTexte: "milk, salt, rennet", additifs: [] }, "douteux", 1],
  ["Tallow (suif en anglais)", { ingredientsTexte: "flour, tallow, salt", additifs: [] }, "douteux", 1],
  ["Carmine (orthographe anglaise)", { ingredientsTexte: "sugar, carmine, water", additifs: [] }, "douteux", 1],
  ["Pepsine (enzyme animale)", { ingredientsTexte: "lait, pepsine, sel", additifs: [] }, "douteux", 1],
  ["Gomme laque et E904 : une seule alerte", { ingredientsTexte: "sucre, gomme laque", additifs: ["en:e904"] }, "douteux", 1],
  ["Glycérine et E422 : une seule alerte", { ingredientsTexte: "eau, glycérine", additifs: ["en:e422"] }, "douteux", 1],

  // --- ETIQUETTES QU'ON NE SAIT PAS LIRE (10 août) ----------------------------
  // Nos motifs sont français et anglais. Une composition en arabe ne déclenche
  // rien — et « aucune alerte » ne doit JAMAIS devenir « halal ». Mesuré :
  // « دهن الخنزير » (graisse de porc) ressortait HALAL.
  // Le 10 août au soir, un petit vocabulaire arabe a été ajouté : ce cas ne
  // ressort plus « inconnu » mais « haram », ce qui est plus juste — le mot
  // « خنزير » (porc) est maintenant reconnu. L'attente a été mise à jour, pas
  // le code : c'est le test qui était périmé.
  ["Porc écrit en arabe → haram", { ingredientsTexte: "المكونات: دهن الخنزير، ملح", additifs: [] }, "haram", 1],
  ["Gélatine écrite en arabe → douteux", { ingredientsTexte: "المكونات: ماء، سكر، جيلاتين", additifs: [] }, "douteux", 1],
  ["Alcool écrit en arabe → haram", { ingredientsTexte: "المكونات: ماء، كحول", additifs: [] }, "haram", 1],
  // Ce qui reste vrai : hors de ce petit vocabulaire, on ne sait pas lire.
  ["Étiquette arabe banale → inconnu, jamais halal", { ingredientsTexte: "المكونات: ماء، سكر، ملح", additifs: [] }, "inconnu", 0],
  ["Bilingue, risque SEULEMENT du côté arabe → détecté", { ingredientsTexte: "ماء، سكر، جيلاتين / eau, sucre, arome", additifs: [] }, "douteux", 1],
  ["Arabe + codes additifs fournis par la base → analysable", { ingredientsTexte: "المكونات: ماء، سكر", additifs: ["en:e441"] }, "douteux", 1],
  ["Bilingue avec un côté français lisible → analysé", { ingredientsTexte: "ماء، سكر، جيلاتين / eau, sucre, gélatine", additifs: [] }, "douteux", 1],
  ["Texte latin trop court pour conclure → inconnu", { ingredientsTexte: "sel", additifs: [] }, "inconnu", 0],

  // --- GARDE-FOUS : une origine annoncée lève le doute ------------------------
  ["Glycérine végétale reste halal", { ingredientsTexte: "eau, glycérine végétale, parfum", additifs: [] }, "halal", 0],
  ["Lipase microbienne reste halal", { ingredientsTexte: "lait, lipase microbienne, sel", additifs: [] }, "halal", 0],
  ["Présure microbienne reste halal", { ingredientsTexte: "lait, présure microbienne", additifs: [] }, "halal", 0],
];

let echecs = 0;
for (const [nom, entree, statutAttendu, nbAlertes] of cas) {
  const v = analyserProduit(entree);
  const okStatut = v.statut === statutAttendu;
  const okAlertes = nbAlertes === null || v.alertes.length === nbAlertes;
  if (!okStatut || !okAlertes) echecs += 1;
  const detail = nbAlertes !== null ? ` (${v.alertes.length} alerte(s))` : "";
  const attendu =
    okStatut && okAlertes
      ? ""
      : `  [attendu : ${statutAttendu}${nbAlertes !== null ? `, ${nbAlertes} alerte(s)` : ""}]`;
  console.log(`${okStatut && okAlertes ? "✓" : "✗"} ${nom} → ${v.statut}${detail}${attendu}`);
}

// ---------------------------------------------------------------------------
// MOTEUR COSMETIQUE
// Il n'avait aucun test avant le 10 août : trois règles y ont été ajoutées ce
// jour-là sur un moteur que rien ne protégeait. Le premier bloc vérifie ce
// qu'on détecte ; le second, ce qu'on ne doit SURTOUT pas signaler.
// ---------------------------------------------------------------------------
console.log("\n--- Moteur cosmétique ---");

// Échafaudage neutre, et on vérifie qu'il l'est vraiment : une sonde du 10 août
// avait annoncé 10 faux positifs sur 10 parce que son décor contenait
// « Glycerin », que le moteur signale à juste titre.
const DECOR = "Aqua, Parfum, Sodium Chloride";
if (analyserCosmetique({ ingredientsTexte: DECOR, labels: [] }).alertes.length > 0) {
  console.error("✗ ÉCHAFAUDAGE CONTAMINÉ : le décor de test alerte tout seul.");
  process.exit(1);
}
const inci = (t, labels = []) => analyserCosmetique({ ingredientsTexte: `${DECOR}, ${t}`, labels });

const casCosmo = [
  ["Sodium Tallowate (suif)", "Sodium Tallowate", true],
  ["Lard", "Lard", true],
  ["Carmine", "Carmine", true],
  ["CI 75470 (carmin)", "CI 75470", true],
  ["Collagen", "Collagen", true],
  ["Gelatin", "Gelatin", true],
  ["Alcohol Denat.", "Alcohol Denat.", true],
  ["Bave d'escargot (ajout du 10 août)", "Snail Secretion Filtrate", true],
  ["Castoréum (ajout du 10 août)", "Castoreum", true],
  ["Rétinol (ajout du 10 août)", "Retinol", true],

  // Le piège que ce moteur existe pour éviter : ce sont des CIRES, pas de
  // l'alcool. Beaucoup d'applications les signalent à tort.
  ["Cetyl Alcohol n'est PAS de l'alcool", "Cetyl Alcohol", false],
  ["Cetearyl Alcohol n'est PAS de l'alcool", "Cetearyl Alcohol", false],
  ["Stearyl Alcohol n'est PAS de l'alcool", "Stearyl Alcohol", false],
  ["Behenyl Alcohol n'est PAS de l'alcool", "Behenyl Alcohol", false],
  ["Benzyl Alcohol (conservateur) reste muet", "Benzyl Alcohol", false],
  ["Propylene Glycol reste muet", "Propylene Glycol", false],
  ["Tocopherol reste muet", "Tocopherol", false],
];

for (const [nom, ingredient, doitAlerter] of casCosmo) {
  const v = inci(ingredient);
  const ok = doitAlerter ? v.alertes.length > 0 : v.alertes.length === 0;
  if (!ok) echecs += 1;
  console.log(
    `${ok ? "✓" : "✗"} ${nom} → ${v.alertes.length} alerte(s)` +
      (ok ? "" : `  [attendu : ${doitAlerter ? "au moins 1" : "aucune"}]`)
  );
}

// Un label certifié halal prime sur l'analyse automatique.
{
  const v = inci("Sodium Tallowate", ["en:halal"]);
  const ok = v.certifieHalal === true;
  if (!ok) echecs += 1;
  console.log(`${ok ? "✓" : "✗"} Label halal reconnu sur un cosmétique → certifieHalal=${v.certifieHalal}`);
}

if (echecs > 0) {
  console.error(`\n${echecs} test(s) en échec`);
  process.exit(1);
}
console.log("\nTous les tests passent ✓");
