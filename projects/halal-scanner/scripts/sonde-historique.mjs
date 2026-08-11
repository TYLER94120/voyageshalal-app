// Quand une regle change, que devient le verdict deja affiche dans
// l'historique de quelqu'un ? Cas reel : une quiche aux lardons scannee avant
// la correction du 11 aout, donc enregistree HALAL.
import { chargerPlaywright, cheminChromium } from "./playwright-atelier.mjs";
import { servirLeSite } from "./serveur-atelier.mjs";
const { chromium } = await chargerPlaywright();
const { base, arreter } = await servirLeSite();
const n = await chromium.launch({ executablePath: cheminChromium(), args: ["--no-proxy-server"] });
const c = await n.newContext({ viewport:{width:390,height:844}, serviceWorkers:"block" });
const p = await c.newPage();
await p.route(/openfoodfacts\.org|openbeautyfacts\.org|halalgpt\.fr/, r => r.fulfill({status:204,body:""}));
await p.goto(base + "/scan.html", { waitUntil:"domcontentloaded" });

// On rejoue l'etat d'un telephone : un scan d'hier, verdict fige a « halal »,
// et la fiche du produit encore en cache.
await p.evaluate(() => {
  const produit = { code:"3560070462926", nom:"Quiche lardons", marque:"Essai",
    ingredientsTexte:"pate, creme, lardons, oeufs", additifs:[], labels:[] };
  localStorage.setItem("halalcheck.scans", JSON.stringify([{ code: produit.code, nom: produit.nom, statut: "halal" }]));
  localStorage.setItem("halalcheck.gardes", JSON.stringify([{ code: produit.code, nom: produit.nom, statut: "halal" }]));
  localStorage.setItem("halalcheck.produits", JSON.stringify({ [produit.code]: { produit, date: new Date().toISOString() } }));
});
await p.reload({ waitUntil:"domcontentloaded" });
await p.waitForTimeout(3000);
const lignes = await p.evaluate(() =>
  [...document.querySelectorAll("#historique .scan-ligne, #liste-gardes .scan-ligne")]
    .map(b => b.innerText.replace(/\n/g," ").trim()));
console.log("Ce que la personne voit dans ses listes :");
for (const l of lignes) console.log("   " + l);
const verdictReel = await p.evaluate(async () => {
  const m = await import("./halal.js");
  return m.analyserProduit({ ingredientsTexte:"pate, creme, lardons, oeufs", additifs:[] }).statut;
});
console.log("\nVerdict que le moteur rend AUJOURD'HUI pour ce produit : " + verdictReel.toUpperCase());

// La pastille et l'emoji doivent suivre le moteur, pas la memoire.
const perime = lignes.some((l) => l.startsWith("✅"));
// Et le statut doit avoir ete reecrit dans les deux listes, pour rester juste
// meme quand la fiche sortira du cache.
const enregistre = await p.evaluate(() => {
  const lu = (c) => { try { return JSON.parse(localStorage.getItem(c) || "[]"); } catch (e) { return []; } };
  return [...lu("halalcheck.scans"), ...lu("halalcheck.gardes")].map((e) => e.statut);
});
console.log("Statuts reecrits dans les listes : " + enregistre.join(", "));
await n.close(); await arreter();
if (perime || enregistre.some((st) => st !== verdictReel)) {
  console.log("\n✗ Un verdict perime survit dans les listes.");
  process.exit(1);
}
console.log("\n✓ Les listes suivent le moteur, et le statut enregistre a ete corrige.");
