#!/usr/bin/env node
// Tests du moteur de verdict halal.
// Lancer : npm run test:moteur
const { execSync } = require("child_process");
const path = require("path");

const racine = path.join(__dirname, "..");
execSync("npx tsc lib/halal.ts --outDir .test-build --module commonjs --target es2019", {
  cwd: racine,
  stdio: "inherit",
});
const { analyserProduit } = require(path.join(racine, ".test-build", "halal.js"));

// [nom, entrée, statut attendu, nombre d'alertes attendu (null = non vérifié)]
const cas = [
  [
    "Bonbons gélatine (E441 + texte → 1 seule alerte, la plus sévère)",
    { ingredientsTexte: "sirop de glucose, gélatine, arômes", additifs: ["en:e441"] },
    "haram",
    1,
  ],
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

if (echecs > 0) {
  console.error(`\n${echecs} test(s) en échec`);
  process.exit(1);
}
console.log("\nTous les tests passent ✓");
