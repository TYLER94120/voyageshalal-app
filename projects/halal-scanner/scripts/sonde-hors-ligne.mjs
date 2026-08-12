// La promesse d'une app installable : marcher SANS reseau. Le service worker
// pre-charge 12 fichiers ; personne n'a jamais verifie le resultat en entier.
import { chargerPlaywright, cheminChromium } from "./playwright-atelier.mjs";
import { servirLeSite } from "./serveur-atelier.mjs";
const { chromium } = await chargerPlaywright();
const { base, arreter } = await servirLeSite();
const n = await chromium.launch({ executablePath: cheminChromium(), args: ["--no-proxy-server","--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream"] });
const c = await n.newContext({ viewport:{width:390,height:844}, permissions:["camera"] });
const p = await c.newPage();

// 1re visite en ligne : le service worker s'installe, et on scanne un produit
// pour qu'il entre dans le cache local.
await p.route(/openfoodfacts\.org|openbeautyfacts\.org/, r => r.fulfill({status:200,contentType:"application/json",
  body: JSON.stringify({status:1, product:{ product_name:"Pate a tartiner", brands:"Essai",
    ingredients_text_fr:"sucre, huile de palme, emulsifiant E471", additives_tags:[], labels_tags:[], categories_tags:[] }})}));
await p.route(/halalgpt\.fr/, r => r.fulfill({status:204,body:""}));
await p.goto(`${base}/scan.html?code=3017620422003`, { waitUntil:"domcontentloaded" });
await p.waitForTimeout(5000);
console.log("1re visite en ligne : verdict obtenu et service worker installe.\n");
await p.waitForTimeout(2000);

// Coupure totale.
await c.setOffline(true);
console.log("--- RESEAU COUPE ---");

let fautes = 0;
for (const [nom, url] of [["accueil","index.html"], ["scanner","scan.html"],
                          ["additifs","additifs.html"], ["mentions legales","mentions-legales.html"]]) {
  let servie = true;
  await p.goto(`${base}/${url}`, { waitUntil:"domcontentloaded" }).catch(() => { servie = false; });
  await p.waitForTimeout(1200);
  const utile = servie ? await p.evaluate(() => document.body.innerText.replace(/\s+/g," ").trim().length) : 0;
  if (!servie || utile <= 200) fautes += 1;
  console.log(`  ${servie && utile > 200 ? "✓" : "✗"} ${nom.padEnd(18)} ${servie ? "servie" : "NON SERVIE"}, ${utile} caracteres lisibles`);
}

// Et le verdict d'un produit deja scanne, hors ligne ?
await p.goto(`${base}/scan.html?code=3017620422003`, { waitUntil:"domcontentloaded" }).catch(()=>{});
await p.waitForTimeout(5000);
const r = await p.evaluate(() => {
  const e = ["ecran-resultat","ecran-erreur","ecran-chargement","ecran-scan"].find(i => !document.getElementById(i).hidden);
  const t = document.getElementById("ecran-resultat");
  return { ecran: e || "(aucun)", texte: t && !t.hidden ? t.innerText.replace(/\n+/g," | ").slice(0,90) : "" };
});
console.log(`\n  ${r.ecran === "ecran-resultat" ? "✓" : "✗"} produit deja scanne, hors ligne -> ${r.ecran}`);
if (r.texte) console.log(`      ${r.texte}`);
if (r.ecran !== "ecran-resultat") fautes += 1;
await n.close(); await arreter();
if (fautes > 0) { console.log(`\n✗ ${fautes} defaut(s) hors ligne.`); process.exit(1); }
console.log("\n✓ Les 4 pages et le verdict d'un produit deja scanne tiennent sans reseau.");
