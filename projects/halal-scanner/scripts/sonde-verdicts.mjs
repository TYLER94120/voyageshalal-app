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
// ── Tous les doutes ne se valent pas ─────────────────────────────────────
//
// `conclusionPratique` a deux branches : « le doute est theorique » quand
// TOUTES les alertes sont de gravite faible, « Le point a verifier, c'est… »
// sinon. Mesure du 13 aout : le champ `gravite` n'etait renseigne nulle part,
// donc la premiere branche ne pouvait jamais s'afficher. Un chocolat signale
// pour sa lecithine recevait le meme avertissement qu'un paquet de bonbons a
// la gelatine.
//
// Le VERDICT ne change pas — les trois restent DOUTEUX. C'est l'explication
// qui cesse d'alarmer autant pour tout.
console.log("\nLe ton de l'explication suit la gravite du doute :");
const GRAVITE = [
  ["chocolat, lécithine E322 seule", ["en:e322"], /doute est théorique|réellement problématique/i],
  ["pain de mie, E471", ["en:e471"], /point à vérifier/i],
  ["bonbons à la gélatine", ["en:e441"], /point à vérifier/i],
];
for (const [nom, additifs, attendu] of GRAVITE) {
  const c = await n.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const p = await c.newPage();
  await p.route(/openfoodfacts\.org|openbeautyfacts\.org/, (r) =>
    r.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify(fiche({ ingredients_text_fr: "sucre, farine, émulsifiant", additives_tags: additifs })) }));
  await p.route(/halalgpt\.fr/, (r) => r.fulfill({ status: 204, body: "" }));
  await p.goto(`${base}/scan.html?code=3017620422003`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(4000);
  const vu = await p.evaluate(() => {
    const e = document.getElementById("conclusion");
    return {
      verdict: document.getElementById("verdict").className,
      texte: e && !e.hidden ? (e.querySelector(".conclusion-texte").textContent || "").trim() : "",
    };
  });
  // Le verdict doit rester DOUTEUX dans les trois cas : on n'a pas adouci un
  // verdict, seulement la phrase qui l'explique.
  const douteux = vu.verdict.includes("verdict-douteux");
  const bonneBranche = attendu.test(vu.texte);
  const ok = douteux && bonneBranche;
  if (!ok) fautes++;
  console.log(`  ${ok ? "✓" : "✗"} ${nom.padEnd(32)} ${douteux ? "DOUTEUX" : vu.verdict}` +
    (bonneBranche ? "" : `  ← « ${vu.texte.slice(0, 46)}… »`));
  await c.close();
}

// ── « C'est surement de l'arabe » : une cause jamais verifiee ────────────
//
// Le 13 aout, Mohamed a photographie une bouteille d'eau Cristaline :
// composition « Eau de source », en francais, parfaitement lisible. L'app
// affichait INCONNU, et expliquait que l'etiquette n'etait « pas ecrite dans
// une langue que notre analyse sait lire — de l'arabe, le plus souvent ».
//
// Deux fautes sur le meme ecran : un verdict refuse a de l'eau de source, et
// une cause inventee. Affirmer ce qu'on n'a pas verifie est exactement ce que
// « ne jamais inventer » interdit — et ca decredibilise tout le reste.
console.log("\nLa phrase « c'est de l'arabe » ne sort que devant de l'arabe :");
// La troisieme ligne est celle qui compte pour ce controle-ci : un texte
// LATIN mais illisible. Les deux premieres ne peuvent pas prendre la phrase en
// defaut — depuis que le moteur les tranche, l'ecran « inconnu » ou la phrase
// vit n'est meme plus atteint. Sans ce cas-la, ce controle serait decoratif.
const ECRITURE = [
  ["eau de source, en français", "Eau de source", "halal", false],
  ["riz, en français", "Riz", "halal", false],
  ["latin mais illisible", "a b c d e f", "inconnu", false],
  ["arabe seul, produit banal", "المكونات: ماء، سكر، ملح", "inconnu", true],
];
for (const [nom, texte, statutAttendu, phraseAttendue] of ECRITURE) {
  const c = await n.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const p = await c.newPage();
  await p.route(/openfoodfacts\.org|openbeautyfacts\.org/, (r) =>
    r.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify(fiche({ ingredients_text_fr: texte })) }));
  await p.route(/halalgpt\.fr/, (r) => r.fulfill({ status: 204, body: "" }));
  await p.goto(`${base}/scan.html?code=3017620422003`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(4000);
  const vu = await p.evaluate(() => {
    const e = document.getElementById("ecran-resultat");
    return {
      classe: document.getElementById("verdict").className,
      texte: e && !e.hidden ? e.innerText : "",
    };
  });
  const statutJuste = vu.classe.includes("verdict-" + statutAttendu);
  const parleArabe = /de l'arabe/i.test(vu.texte);
  const ok = statutJuste && parleArabe === phraseAttendue;
  if (!ok) fautes++;
  console.log(`  ${ok ? "✓" : "✗"} ${nom.padEnd(30)} ${statutAttendu.toUpperCase().padEnd(8)}` +
    (statutJuste ? "" : `  ← verdict ${vu.classe}`) +
    (parleArabe === phraseAttendue ? "" : parleArabe ? "  ← invente « de l'arabe »" : "  ← ne dit plus pourquoi"));
  await c.close();
}

// ── Une liste INCI rangee du mauvais cote ────────────────────────────────
//
// L'aiguillage se fait sur la BASE d'origine : cosmetique si le produit vient
// d'Open Beauty Facts. Or Open Food Facts est interroge EN PREMIER, et
// contient des savons, dentifrices et cremes. Mesure du 12 aout : six listes
// INCI realistes sur sept ressortaient HALAL par le moteur alimentaire, dont
// « Aqua, Adeps Suillus » — de la graisse de porc.
//
// Les deux dernieres lignes sont la pour l'erreur inverse : faire tourner le
// moteur cosmetique sur TOUT accuserait « glycerine vegetale » a tort.
console.log("\nListes INCI rangées dans la base alimentaire :");
const AIGUILLAGE = [
  ["savon au suif", "Sodium Tallowate, Aqua, Parfum, Glycerin", "haram"],
  ["crème à la graisse de porc", "Aqua, Adeps Suillus, Cetyl Alcohol", "haram"],
  ["shampooing à la kératine", "Aqua, Hydrolyzed Keratin, Sodium Laureth Sulfate", "douteux"],
  ["aliment — glycérine végétale", "glycérine végétale, eau, parfum", "halal"],
  ["aliment — composition banale", "tomates, huile d'olive vierge extra, basilic, sel", "halal"],
];
for (const [nom, texte, attendu] of AIGUILLAGE) {
  const c = await n.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const p = await c.newPage();
  await p.route(/openfoodfacts\.org|openbeautyfacts\.org/, (r) =>
    r.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify(fiche({ ingredients_text_fr: texte })) }));
  await p.route(/halalgpt\.fr/, (r) => r.fulfill({ status: 204, body: "" }));
  await p.goto(`${base}/scan.html?code=3017620422003`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(4000);
  const vu = await p.evaluate(() => ({
    label: (document.getElementById("verdict-label").textContent || "").trim(),
    classe: document.getElementById("verdict").className,
  }));
  const ok = vu.classe.includes("verdict-" + attendu);
  if (!ok) fautes++;
  console.log(`  ${ok ? "✓" : "✗"} ${nom.padEnd(30)} ${vu.label.padEnd(8)}` +
    (ok ? "" : `  ← attendu ${attendu.toUpperCase()}`));
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
console.log("\n✓ Les six écrans disent une seule chose à la fois, une liste INCI est reconnue même rangée du mauvais côté, et le sceau ne s'affiche que sur une fiche relisible.");
