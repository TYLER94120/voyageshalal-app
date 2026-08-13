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
// ── Et quand le stockage local n'existe pas ? ────────────────────────────
//
// Navigation privee, stockage plein, ou navigateur qui refuse. Safari iOS a
// longtemps leve une exception sur setItem en navigation privee. L'historique
// est un confort — le VERDICT, lui, ne doit jamais en dependre.
//
// Verifie le 13 aout : les quatre modes de panne rendaient deja le bon
// verdict. Cette scene ne corrige rien, elle empeche que ca casse.
console.log("\nStockage local en panne — le verdict tient-il quand meme ?");
const PANNES = [
  ["setItem leve (quota / prive)", () => {
    const vrai = window.localStorage;
    Object.defineProperty(window, "localStorage", { configurable: true, get: () => ({
      getItem: (k) => vrai.getItem(k), setItem: () => { throw new DOMException("QuotaExceededError"); },
      removeItem: (k) => vrai.removeItem(k), key: (i) => vrai.key(i), get length() { return vrai.length; },
    })});
  }],
  ["getItem et setItem levent", () => {
    Object.defineProperty(window, "localStorage", { configurable: true, get: () => ({
      getItem: () => { throw new DOMException("SecurityError"); },
      setItem: () => { throw new DOMException("SecurityError"); },
      removeItem: () => { throw new DOMException("SecurityError"); },
      key: () => { throw new DOMException("SecurityError"); },
      get length() { throw new DOMException("SecurityError"); },
    })});
  }],
  ["localStorage carrement absent", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true, get: () => { throw new DOMException("SecurityError"); } });
  }],
];
let sansStockage = 0;
for (const [nom, panne] of PANNES) {
  const ctx = await n.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  await ctx.addInitScript(panne);
  const page = await ctx.newPage();
  await page.route(/openfoodfacts\.org|openbeautyfacts\.org/, (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: 1,
      product: { product_name: "Pate a tartiner", brands: "Essai",
        ingredients_text_fr: "sucre, huile de palme, emulsifiant E471",
        additives_tags: [], labels_tags: [], categories_tags: [] } }) }));
  await page.route(/halalgpt\.fr/, (r) => r.fulfill({ status: 204, body: "" }));
  await page.goto(`${base}/scan.html?code=3017620422003`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4500);
  const vu = await page.evaluate(() => {
    const e = document.getElementById("ecran-resultat");
    if (!e || e.hidden) return "(pas de verdict)";
    return (document.getElementById("verdict-label").textContent || "").trim() || "(pastille muette)";
  }).catch(() => "(page cassee)");
  const ok = vu === "DOUTEUX";
  if (!ok) sansStockage += 1;
  console.log(`  ${ok ? "✓" : "✗"} ${nom.padEnd(32)} ${vu}${ok ? "" : "  ← attendu DOUTEUX"}`);
  await ctx.close();
}

await n.close(); await arreter();
if (perime || enregistre.some((st) => st !== verdictReel) || sansStockage > 0) {
  if (perime || enregistre.some((st) => st !== verdictReel)) console.log("\n✗ Un verdict perime survit dans les listes.");
  if (sansStockage > 0) console.log(`\n✗ ${sansStockage} panne(s) de stockage empechent le verdict.`);
  process.exit(1);
}
console.log("\n✓ Les listes suivent le moteur, le statut enregistre a ete corrige, et le verdict tient sans stockage local.");
