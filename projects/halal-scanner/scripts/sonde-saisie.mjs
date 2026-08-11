/**
 * Sonde « saisie manuelle » — le repli que l'app recommande partout.
 *
 * Depuis le 11 août, trois messages d'erreur au moins finissent par
 * « Saisis les chiffres ci-dessous ⬇ » : caméra refusée, lecteur de
 * codes-barres qui tarde, lecteur introuvable. C'est devenu LA porte de sortie
 * du produit — et elle n'avait jamais été vérifiée.
 *
 * Deux questions, deux mesures :
 *   1. quand le message s'affiche, le champ est-il visible à l'écran, ou
 *      faut-il deviner qu'il existe et faire défiler ?
 *   2. une fois les chiffres tapés, obtient-on vraiment un verdict — y compris
 *      avec des espaces, des tirets, ou un code à 12 chiffres (UPC américain) ?
 *
 * Se lance seule : `npm run sonde:saisie`.
 */
import { chargerPlaywright, cheminChromium } from "./playwright-atelier.mjs";
import { servirLeSite } from "./serveur-atelier.mjs";
const { chromium } = await chargerPlaywright();

const { base: BASE, arreter: arreterLeServeur } = await servirLeSite();
const estLaBibliotheque = (u) => /\/vendor\/zxing-.*\.js$/.test(String(u));

// Fiche réelle d'Open Food Facts, figée ici : le service est refusé par la
// politique réseau de l'atelier, mais la sonde doit quand même mesurer le
// chemin complet jusqu'au verdict.
const FICHE = {
  status: 1,
  product: {
    product_name: "Pâte à tartiner noisettes",
    brands: "Marque d'essai",
    ingredients_text_fr: "sucre, huile de palme, noisettes, cacao, émulsifiant : lécithines (E322), vanilline",
    additives_tags: ["en:e322"],
    labels_tags: [],
    categories_tags: ["en:spreads"],
  },
};

const TELEPHONES = [
  { nom: "iPhone 14 (390×844)", largeur: 390, hauteur: 844 },
  { nom: "petit écran (320×568)", largeur: 320, hauteur: 568 },
];

const SAISIES = [
  { nom: "13 chiffres collés", valeur: "3017620422003" },
  { nom: "avec des espaces", valeur: "3017 620 422 003" },
  { nom: "avec des tirets", valeur: "3017-620-422-003" },
  { nom: "12 chiffres (UPC)", valeur: "017620422003" },
];

const navigateur = await chromium.launch({
  executablePath: cheminChromium(),
  args: ["--no-proxy-server", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
});

/** Prépare une page dans l'état « le lecteur n'est pas arrivé ». */
async function pageEnPanneDeLecteur(largeur, hauteur) {
  const contexte = await navigateur.newContext({
    viewport: { width: largeur, height: hauteur },
    permissions: ["camera"],
    serviceWorkers: "block",
  });
  await contexte.addInitScript(() => { delete window.BarcodeDetector; });
  const page = await contexte.newPage();
  await page.route(estLaBibliotheque, (r) => r.abort("failed"));
  await page.route(/openfoodfacts\.org|openbeautyfacts\.org/, (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(FICHE) }));
  await page.route(/halalgpt\.fr/, (r) => r.fulfill({ status: 204, body: "" }));
  await page.goto(BASE + "/scan.html", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  return { contexte, page };
}

let fautes = 0;

console.log("SONDE saisie manuelle — le repli que l'app recommande\n");
console.log("### 1. Le champ est-il visible quand on y renvoie quelqu'un ?");
for (const t of TELEPHONES) {
  const { contexte, page } = await pageEnPanneDeLecteur(t.largeur, t.hauteur);
  const message = await page.evaluate(() => {
    const e = document.getElementById("etat-camera");
    return e && !e.hidden ? e.textContent.trim() : "(rien)";
  });
  const boite = await page.locator("#saisie").boundingBox();
  const visible = boite !== null && boite.y + boite.height <= t.hauteur && boite.y >= 0;
  // Le champ doit aussi tenir dans la largeur, sans déborder.
  const deborde = boite !== null && boite.x + boite.width > t.largeur + 1;
  if (!visible || deborde) fautes++;
  console.log(`  ${visible && !deborde ? "✓" : "✗"} ${t.nom} : champ ${boite ? `a ${Math.round(boite.y)} px du haut, bas a ${Math.round(boite.y + boite.height)} px` : "INTROUVABLE"}` +
    ` — ${visible ? "visible sans defiler" : "HORS DE L'ECRAN"}${deborde ? ", ET DEBORDE EN LARGEUR" : ""}`);
  console.log(`     message affiche : « ${message.slice(0, 60)}… »`);
  await contexte.close();
}

console.log("\n### 2. Taper les chiffres mène-t-il à un verdict ?");
for (const s of SAISIES) {
  const { contexte, page } = await pageEnPanneDeLecteur(390, 844);
  await page.fill("#saisie", s.valeur);
  const boutonActif = !(await page.locator("#verifier").isDisabled());
  await page.press("#saisie", "Enter");
  await page.waitForTimeout(3500);
  const ecran = await page.evaluate(() =>
    ["ecran-resultat", "ecran-recherche", "ecran-erreur", "ecran-chargement", "ecran-scan"]
      .find((i) => !document.getElementById(i).hidden) || "(aucun)");
  const nom = await page.locator("#ecran-resultat h1, #ecran-resultat .nom-produit").first()
    .textContent().catch(() => "");
  const abouti = ecran === "ecran-resultat";
  if (!abouti || !boutonActif) fautes++;
  console.log(`  ${abouti && boutonActif ? "✓" : "✗"} ${s.nom.padEnd(22)} bouton ${boutonActif ? "actif" : "GRISE"} → ${ecran}` +
    `${nom ? ` (« ${nom.trim().slice(0, 34)} »)` : ""}`);
  await contexte.close();
}

await navigateur.close();
await arreterLeServeur();

if (fautes > 0) {
  console.log(`\n✗ ${fautes} défaut(s) sur le repli. On y envoie des gens : il doit marcher.`);
  process.exit(1);
}
console.log("\n✓ Le champ est visible sur les deux écrans, et les quatre façons d'écrire");
console.log("  un code-barres aboutissent au verdict.");
