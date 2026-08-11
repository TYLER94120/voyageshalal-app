/**
 * Sonde « pays du code-barres ».
 *
 * Quand un produit n'est dans aucune base — le cas le plus fréquent au
 * Maghreb — l'app explique pourquoi en nommant le pays d'enregistrement. La
 * phrase disait « Les produits enregistrés DANS LE Maroc », « dans l'Algérie »,
 * « dans les Émirats ». Ce n'est pas du français, et c'est adressé à des gens
 * dont c'est le pays : une phrase bancale décrédibilise le verdict qui suit.
 *
 * On lit la vraie page et on vérifie la phrase telle qu'elle s'affiche.
 */
import { chargerPlaywright, cheminChromium } from "./playwright-atelier.mjs";
import { servirLeSite } from "./serveur-atelier.mjs";
const { chromium } = await chargerPlaywright();
const { base: BASE, arreter: arreterLeServeur } = await servirLeSite();

// Un code par pays surveillé, complété pour atteindre 13 chiffres.
const CODES = [
  ["Maroc", "6111035000041"], ["Algérie", "6130000000017"], ["Tunisie", "6191000000015"],
  ["Égypte", "6221000000018"], ["Libye", "6241000000016"], ["Jordanie", "6251000000015"],
  ["Iran", "6261000000014"], ["Koweït", "6271000000013"], ["Arabie saoudite", "6281000000012"],
  ["Émirats", "6291000000011"], ["Syrie", "6211000000017"], ["Ghana", "6031000000019"],
  ["Nigeria", "6151000000017"], ["Kenya", "6161000000016"], ["Côte d'Ivoire", "6181000000014"],
  ["Inde", "8901000000013"], ["Pakistan", "8961000000017"], ["Indonésie", "8991000000014"],
  ["Malaisie", "9551000000010"], ["Thaïlande", "8851000000018"], ["Vietnam", "8931000000015"],
  ["Chine", "6901000000015"], ["Turquie", "8681000000011"], ["Israël", "7291000000018"],
];

// Toute préposition fautive devant un nom de pays.
const FAUTES = [/dans le [A-ZÉÈÀ]/u, /dans la [A-ZÉÈÀ]/u, /dans les [A-ZÉÈÀ]/u, /dans l'[A-ZÉÈÀ]/u, /enregistrés dans /];

const navigateur = await chromium.launch({
  executablePath: cheminChromium(),
  args: ["--no-proxy-server"],
});
const contexte = await navigateur.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
await contexte.route(/openfoodfacts\.org|openbeautyfacts\.org/, (r) =>
  r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: 0 }) }));
await contexte.route(/halalgpt\.fr/, (r) => r.fulfill({ status: 204, body: "" }));

let fautes = 0;
console.log("SONDE pays — la phrase du produit non référencé\n");
for (const [pays, code] of CODES) {
  const page = await contexte.newPage();
  await page.goto(`${BASE}/scan.html?code=${code}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const phrase = (await page.locator("#erreur-texte").textContent().catch(() => "") || "").trim();
  const extrait = (phrase.match(/Les produits enregistrés [^.]*/u) || [phrase.slice(0, 60)])[0];
  const faute = FAUTES.some((m) => m.test(phrase));
  if (faute) fautes++;
  console.log(`  ${faute ? "✗" : "✓"} ${pays.padEnd(16)} « ${extrait.slice(0, 52)} »`);
  await page.close();
}
await navigateur.close();
await arreterLeServeur();

if (fautes > 0) {
  console.log(`\n✗ ${fautes} pays sur ${CODES.length} avec une préposition fautive.`);
  process.exit(1);
}
console.log(`\n✓ Les ${CODES.length} pays sont nommés avec la bonne préposition.`);
