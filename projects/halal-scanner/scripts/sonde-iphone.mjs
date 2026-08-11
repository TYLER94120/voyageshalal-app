/**
 * Sonde « iPhone » — ce que voit quelqu'un dont le navigateur n'a PAS de
 * BarcodeDetector natif (Safari iOS, et Firefox). Le scanner bascule alors sur
 * une bibliothèque chargée depuis unpkg.com, un serveur tiers.
 *
 * On mesure les messages affichés dans #etat-camera au fil du temps, dans les
 * trois situations réelles : réseau normal, réseau lent en rayon, serveur tiers
 * injoignable.
 *
 * Ce qu'elle a trouvé le 11 août : sur réseau lent, l'app affichait
 * « 🔎 Recherche du code-barres… » alors que RIEN ne cherchait, puis reprochait
 * à 9 s sa façon de filmer et à 17 s son code-barres. Elle doit rester verte :
 * la colonne « lecture » dit si quelque chose cherche vraiment, et aucun
 * reproche ne doit apparaître tant qu'elle vaut « non ».
 *
 * Avant de lancer : python3 -m http.server 8099  depuis projects/halal-scanner/site
 */
import { chargerPlaywright, cheminChromium } from "./playwright-atelier.mjs";
const { chromium } = await chargerPlaywright();

const BASE = "http://127.0.0.1:8099";
const URL_ZXING = "**/@zxing/**";

// Fausse bibliothèque : juste ce que scan.html lui demande.
const FAUX_ZXING = `
window.ZXing = {
  BrowserMultiFormatReader: function () {
    this.decodeFromStream = function () { window.__zxingDemarre = true; };
    this.reset = function () {};
  }
};`;

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

async function jouer(nom, reglage, jalons) {
  const navigateur = await chromium.launch({
    executablePath: cheminChromium(),
    args: [
      "--no-proxy-server",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  });
  const contexte = await navigateur.newContext({ permissions: ["camera"] });
  // Simule un navigateur sans détecteur natif (iPhone).
  await contexte.addInitScript(() => { delete window.BarcodeDetector; });
  const page = await contexte.newPage();
  await reglage(page);

  const debut = Date.now();
  await page.goto(BASE + "/scan.html", { waitUntil: "domcontentloaded" });

  const releves = [];
  for (const t of jalons) {
    const reste = debut + t - Date.now();
    if (reste > 0) await attendre(reste);
    const texte = await page.evaluate(() => {
      const e = document.getElementById("etat-camera");
      return e && !e.hidden ? e.textContent.trim() : "(rien d'affiché)";
    });
    const demarre = await page.evaluate(() => window.__zxingDemarre === true);
    releves.push({ t: Math.round((Date.now() - debut) / 1000), texte, demarre });
  }
  await navigateur.close();
  return { nom, releves };
}

const cas = [
  {
    nom: "A — réseau normal, la bibliothèque arrive",
    reglage: async (page) =>
      page.route(URL_ZXING, (r) =>
        r.fulfill({ contentType: "application/javascript", body: FAUX_ZXING })),
    jalons: [3000, 9000, 17000],
  },
  {
    nom: "B — réseau lent en rayon, unpkg ne répond jamais",
    reglage: async (page) => page.route(URL_ZXING, () => { /* on ne répond pas */ }),
    jalons: [3000, 9000, 17000, 25000],
  },
  {
    nom: "C — unpkg injoignable (coupé, bloqué, DNS)",
    reglage: async (page) => page.route(URL_ZXING, (r) => r.abort("failed")),
    jalons: [3000, 9000, 17000],
  },
];

// Un message qui rejette la faute sur la personne ou sur son produit. Tant que
// rien ne cherche, aucun de ces mots n'a le droit d'apparaître.
const REPROCHES = [/tiens le téléphone/i, /sans reflet/i, /code abîmé/i, /recherche du code-barres/i];

console.log("SONDE iPhone — navigateur sans BarcodeDetector\n");
let fautes = 0;
for (const c of cas) {
  const r = await jouer(c.nom, c.reglage, c.jalons);
  console.log("### " + r.nom);
  for (const l of r.releves) {
    const faute = !l.demarre && REPROCHES.some((m) => m.test(l.texte));
    if (faute) fautes++;
    console.log(
      `  ${faute ? "✗" : "✓"} ${String(l.t).padStart(2)}s  lecture=${l.demarre ? "OUI" : "non"}  « ${l.texte} »`
    );
  }
  console.log("");
}
if (fautes > 0) {
  console.log(`✗ ${fautes} message(s) accusent la personne alors que rien ne cherche.`);
  process.exit(1);
}
console.log("✓ Aucun message n'accuse la personne tant que rien ne cherche.");
