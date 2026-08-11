// Les verdicts tels que la personne les VOIT, ecran complet. Le moteur a ete mesure ;
// l'ecran qui le montre, jamais en entier. Un « inconnu » qui ressemble a un
// feu vert est aussi grave qu'un mauvais calcul.
import { chargerPlaywright, cheminChromium } from "./playwright-atelier.mjs";
import { servirLeSite } from "./serveur-atelier.mjs";
const { chromium } = await chargerPlaywright();
const { base, arreter } = await servirLeSite();
const n = await chromium.launch({ executablePath: cheminChromium(), args: ["--no-proxy-server"] });

const fiche = (p) => ({ status: 1, product: Object.assign({ product_name: "Produit d'essai", brands: "Essai", labels_tags: [], additives_tags: [], categories_tags: [] }, p) });

const CAS = [
  ["HALAL   (rien à signaler)", fiche({ ingredients_text_fr: "pommes de terre, huile de tournesol, sel" }), []],
  ["DOUTEUX (E471)", fiche({ ingredients_text_fr: "farine, sucre, emulsifiant E471" }), ["E471"]],
  ["HARAM   (lardons)", fiche({ ingredients_text_fr: "pate, creme, lardons" }), ["HARAM"]],
  ["INCONNU (étiquette illisible)", fiche({ ingredients_text_fr: "ab" }), ["INCONNU"]],
  ["POULET sans label → à vérifier", fiche({ ingredients_text_fr: "poulet, epices" }), ["à vérifier", "Viande"]],
  ["CERTIFIÉ halal → aucune contradiction", fiche({ ingredients_text_fr: "poulet, epices", labels_tags: ["en:halal"] }), []],
];

let fautes = 0;
for (const [nom, rep, attendus] of CAS) {
  const c = await n.newContext({ viewport:{width:390,height:844}, serviceWorkers:"block" });
  const p = await c.newPage();
  await p.route(/openfoodfacts\.org|openbeautyfacts\.org/, r => r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(rep)}));
  await p.route(/halalgpt\.fr/, r => r.fulfill({status:204,body:""}));
  await p.goto(`${base}/scan.html?code=3017620422003`, { waitUntil:"domcontentloaded" });
  await p.waitForTimeout(4500);
  const t = await p.evaluate(() => {
    const e = document.getElementById("ecran-resultat");
    return e && !e.hidden ? e.innerText.replace(/\n{2,}/g,"\n").trim() : "(pas d'ecran resultat)";
  });
  const contradiction = /certifié halal/i.test(t) && /à vérifier/i.test(t);
  const manquants = (attendus || []).filter((a) => !t.includes(a));
  const ok = !contradiction && manquants.length === 0;
  if (!ok) fautes++;
  console.log(`${ok ? "✓" : "✗"} ${nom}` + (contradiction ? "  ← CONTRADICTION dans le même écran" : "") +
    (manquants.length ? "  ← manque : " + manquants.join(", ") : ""));
  await c.close();
}
await n.close(); await arreter();
if (fautes > 0) { console.log(`\n✗ ${fautes} écran(s) en défaut.`); process.exit(1); }
console.log("\n✓ Les six écrans disent une seule chose à la fois.");
