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
// ── Le sceau « ✓ VÉRIFIÉ » sur une fiche mal saisie ──────────────────────
//
// Une fiche vérifiée PRIME sur l'analyse : son statut s'affiche et les alertes
// du moteur sont effacées. Mesuré le 12 aout sur un pate dont la composition
// dit « foie de porc, lardons » : cinq fautes de saisie sur cinq affichaient
// ✅ avec le sceau et zero alerte, parce que l'ecran retombait sur le vert
// (`EMOJIS[verif.statut] || "✅"`) et que le label restait vide — donc aucun
// mot ne venait contredire la pastille.
//
// C'est le fichier que Mohamed remplit a la main en recopiant des reponses de
// fabricants : la faute de frappe y est le cas NORMAL, pas le cas rare.
console.log("\nFiches vérifiées mal saisies, sur un produit qui contient du porc :");
const PATE = {
  status: 1,
  product: { product_name: "Pâté de campagne", brands: "Essai",
    ingredients_text_fr: "foie de porc, lardons, sel, poivre",
    additives_tags: [], labels_tags: [], categories_tags: [] },
};
const FICHES = [
  ["statut correct « haram »", { statut: "haram", titre: "Contient du porc", source: "Fabricant", date: "2026-08-12" }, "haram", true],
  ["« Halal » avec une majuscule", { statut: "Halal", titre: "Confirmé", source: "F", date: "2026-08-12" }, "halal", true],
  ["« halall »", { statut: "halall", titre: "Confirmé", source: "F", date: "2026-08-12" }, "haram", false],
  ["statut absent", { titre: "Confirmé", source: "F", date: "2026-08-12" }, "haram", false],
  ["statut vide", { statut: "", titre: "Confirmé", source: "F", date: "2026-08-12" }, "haram", false],
  ["statut « oui »", { statut: "oui", titre: "Confirmé", source: "F", date: "2026-08-12" }, "haram", false],
];
const CODE = "3017620422003";
for (const [nom, fiche, statutAttendu, sceauAttendu] of FICHES) {
  const c = await n.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const p = await c.newPage();
  await p.route(/openfoodfacts\.org|openbeautyfacts\.org/, (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PATE) }));
  await p.route(/halalgpt\.fr/, (r) => r.fulfill({ status: 204, body: "" }));
  await p.route(/verifications\.json/, (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ produits: { [CODE]: fiche } }) }));
  await p.goto(`${base}/scan.html?code=${CODE}`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(4000);
  const vu = await p.evaluate(() => ({
    classe: document.getElementById("verdict").className,
    emoji: (document.getElementById("verdict-emoji").textContent || "").trim(),
    label: (document.getElementById("verdict-label").textContent || "").trim(),
    sceau: !document.getElementById("sceau").hidden,
  }));
  const statutJuste = vu.classe.includes("verdict-" + statutAttendu);
  const sceauJuste = vu.sceau === sceauAttendu;
  // Une pastille verte sans un mot pour la nommer, c'est un verdict muet.
  const labelPresent = vu.label.length > 0;
  const ok = statutJuste && sceauJuste && labelPresent;
  if (!ok) fautes++;
  console.log(`  ${ok ? "✓" : "✗"} ${nom.padEnd(30)} ${vu.emoji} ${vu.label.padEnd(8)} sceau=${vu.sceau}` +
    (statutJuste ? "" : `  ← attendu ${statutAttendu.toUpperCase()}`) +
    (sceauJuste ? "" : `  ← sceau attendu ${sceauAttendu}`) +
    (labelPresent ? "" : "  ← pastille sans aucun mot"));
  await c.close();
}

await n.close(); await arreter();
if (fautes > 0) { console.log(`\n✗ ${fautes} écran(s) en défaut.`); process.exit(1); }
console.log("\n✓ Les six écrans disent une seule chose à la fois, et le sceau ne s'affiche que sur une fiche relisible.");
