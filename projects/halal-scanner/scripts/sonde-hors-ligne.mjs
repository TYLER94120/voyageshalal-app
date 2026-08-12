/**
 * La promesse d'une app installable : marcher SANS reseau. Le service worker
 * pre-charge 12 fichiers ; personne n'a jamais verifie le resultat en entier.
 *
 * CORRIGEE LE 12 AOUT 2026 — elle ne mesurait pas ce qu'elle annoncait.
 *
 * Elle coupait le reseau avec `setOffline(true)`. Or `setOffline` ne s'applique
 * PAS aux requetes emises par un service worker : c'etait deja ecrit dans la
 * file d'attente le 12 aout au matin, sans qu'on en tire la consequence sur
 * cette sonde-ci. Le service worker allait donc chercher les pages sur le
 * reseau, et la sonde declarait le pre-chargement bon.
 *
 * Mesure qui l'a etabli : j'ai retire `./additifs.html` de la liste
 * pre-chargee du service worker. La page etait toujours servie « hors ligne »,
 * avec 16 063 caracteres lisibles, et la sonde sortait en succes.
 *
 * Elle COUPE maintenant le serveur. C'est le seul hors-ligne qu'aucune couche
 * ne contourne : s'il n'y a plus personne au bout du fil, ce qui s'affiche
 * vient forcement du cache.
 */
import { chargerPlaywright, cheminChromium } from "./playwright-atelier.mjs";
import { servirLeSite } from "./serveur-atelier.mjs";
const { chromium } = await chargerPlaywright();
const { base, arreter, couper } = await servirLeSite();
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

// Coupure totale : le serveur s'arrete POUR DE BON, et on coupe aussi le
// reseau du navigateur. La premiere est celle qui compte.
await couper();
await c.setOffline(true);
console.log("--- SERVEUR ARRETE ET RESEAU COUPE ---");
// Controle de la coupure elle-meme : une adresse jamais visitee, donc jamais
// mise en cache, DOIT echouer. Si elle repond, c'est la sonde qui ment, pas le
// site qui marche — et tout ce qui suit ne vaudrait rien.
//
// Le controle se fait par `fetch` depuis la page en cours, PAS en y naviguant.
// Mesure du 12 aout : en y naviguant, Chromium affiche sa page d'erreur, qui
// n'est plus controlee par le service worker — et la navigation SUIVANTE
// repart au reseau, donc echoue. La sonde annoncait alors « accueil NON
// SERVIE » alors que l'accueil sortait tres bien du cache (2 924 caracteres,
// verifie a part). Le controle cassait ce qu'il mesurait.
const coupureReelle = await p.evaluate(
  (u) => fetch(u, { cache: "no-store" }).then(() => false, () => true),
  `${base}/preuve-de-coupure-${Math.random().toString(36).slice(2)}.html`
);
console.log(`  ${coupureReelle ? "✓" : "✗"} controle : une adresse jamais visitee est bien injoignable`);

let fautes = coupureReelle ? 0 : 1;
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
// Defensif : si la page ne s'ouvre pas du tout, les elements n'existent pas.
// La version precedente plantait sur `null.hidden` — un plantage n'est pas une
// mesure, il ne dit meme pas ce qui a echoue.
const r = await p.evaluate(() => {
  const el = (i) => document.getElementById(i);
  if (!el("ecran-resultat")) return { ecran: "(page non ouverte)", texte: "" };
  const e = ["ecran-resultat","ecran-erreur","ecran-chargement","ecran-scan"].find(i => el(i) && !el(i).hidden);
  const t = el("ecran-resultat");
  return { ecran: e || "(aucun)", texte: t && !t.hidden ? t.innerText.replace(/\n+/g," | ").slice(0,90) : "" };
}).catch(() => ({ ecran: "(page non ouverte)", texte: "" }));
console.log(`\n  ${r.ecran === "ecran-resultat" ? "✓" : "✗"} produit deja scanne, hors ligne -> ${r.ecran}`);
if (r.texte) console.log(`      ${r.texte}`);
if (r.ecran !== "ecran-resultat") fautes += 1;
await n.close(); await arreter();
if (fautes > 0) { console.log(`\n✗ ${fautes} defaut(s) hors ligne.`); process.exit(1); }
console.log("\n✓ Les 4 pages et le verdict d'un produit deja scanne tiennent sans reseau — serveur arrete, rien ne pouvait venir d'ailleurs que du cache.");
