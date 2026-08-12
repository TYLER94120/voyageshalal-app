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
 *
 * CORRIGÉE LE 12 AOÛT 2026 — la sonde était un feu vert qui ne pouvait
 * presque pas rougir. Elle cherchait les motifs « dans le / dans la / dans
 * les / dans l' », c'est-à-dire l'ancien défaut lui-même, et rien d'autre.
 *
 * Mesure : j'ai remplacé « au Maroc » par « en Maroc » dans scan.html. La page
 * affichait « Les produits enregistrés **en Maroc** » — une faute de français
 * sur le pays du public principal — et la sonde répondait « ✓ Maroc », sortie
 * 0. Toute préposition fautive autre que celle d'août 2025 passait.
 *
 * Elle compare maintenant la phrase à la forme attendue, pays par pays. Les
 * formes ci-dessous sont écrites d'après la grammaire française, PAS recopiées
 * de la table de scan.html : une sonde qui recopie sa source ne compare rien.
 */
import { chargerPlaywright, cheminChromium } from "./playwright-atelier.mjs";
import { servirLeSite } from "./serveur-atelier.mjs";
const { chromium } = await chargerPlaywright();
const { base: BASE, arreter: arreterLeServeur } = await servirLeSite();

// Un code par pays surveillé, complété pour atteindre 13 chiffres, et la
// forme locative que le français impose.
const CODES = [
  ["Maroc", "6111035000041", "au Maroc"], ["Algérie", "6130000000017", "en Algérie"],
  ["Tunisie", "6191000000015", "en Tunisie"], ["Égypte", "6221000000018", "en Égypte"],
  ["Libye", "6241000000016", "en Libye"], ["Jordanie", "6251000000015", "en Jordanie"],
  ["Iran", "6261000000014", "en Iran"], ["Koweït", "6271000000013", "au Koweït"],
  ["Arabie saoudite", "6281000000012", "en Arabie saoudite"],
  ["Émirats", "6291000000011", "aux Émirats"], ["Syrie", "6211000000017", "en Syrie"],
  ["Ghana", "6031000000019", "au Ghana"], ["Nigeria", "6151000000017", "au Nigeria"],
  ["Kenya", "6161000000016", "au Kenya"], ["Côte d'Ivoire", "6181000000014", "en Côte d'Ivoire"],
  ["Inde", "8901000000013", "en Inde"], ["Pakistan", "8961000000017", "au Pakistan"],
  ["Indonésie", "8991000000014", "en Indonésie"], ["Malaisie", "9551000000010", "en Malaisie"],
  ["Thaïlande", "8851000000018", "en Thaïlande"], ["Vietnam", "8931000000015", "au Vietnam"],
  ["Chine", "6901000000015", "en Chine"], ["Turquie", "8681000000011", "en Turquie"],
  ["Israël", "7291000000018", "en Israël"],
];

// La France a une phrase À ELLE, et c'est voulu : devant un code français, la
// bonne explication n'est pas « les bases mondiales connaissent mal ce pays »
// — ce serait faux et ça décrédibiliserait le verdict — mais « marque de
// distributeur ou nouveauté ». Mohamed a demandé les produits de France en
// plus de ceux du Maghreb ; ce cas-ci garde cette promesse-là.
// 3017620422003 : préfixe 301, France.
const CODE_FRANCE = "3017620422003";
const ATTENDU_FRANCE = /marques de distributeur/i;
// Et surtout, la faute à ne jamais commettre : parler d'un pays lointain
// devant un produit français.
const PAYS_ETRANGER = /Les produits enregistrés/i;

// L'ancien défaut, gardé pour mémoire : « dans le Maroc », « dans l'Algérie ».
// Il ne suffit plus — c'est justement ce qui rendait cette sonde aveugle.
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
async function phraseAffichee(code) {
  const page = await contexte.newPage();
  await page.goto(`${BASE}/scan.html?code=${code}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const phrase = (await page.locator("#erreur-texte").textContent().catch(() => "") || "").trim();
  await page.close();
  return phrase;
}

for (const [pays, code, attendu] of CODES) {
  const phrase = await phraseAffichee(code);
  const extrait = (phrase.match(/Les produits enregistrés [^.]*/u) || [phrase.slice(0, 60)])[0];
  // Deux contrôles, et le second est le vrai : l'ancien motif ne rattrape que
  // l'ancien défaut, la forme attendue rattrape n'importe quelle faute.
  const ancienDefaut = FAUTES.some((m) => m.test(phrase));
  const formeJuste = phrase.includes(`enregistrés ${attendu} `);
  const faute = ancienDefaut || !formeJuste;
  if (faute) fautes++;
  console.log(`  ${faute ? "✗" : "✓"} ${pays.padEnd(16)} « ${extrait.slice(0, 52)} »` +
    (formeJuste ? "" : `  ← attendu « enregistrés ${attendu} »`));
}

// La France : phrase à elle, et surtout pas celle d'un pays lointain.
const phraseFr = await phraseAffichee(CODE_FRANCE);
const franceOk = ATTENDU_FRANCE.test(phraseFr) && !PAYS_ETRANGER.test(phraseFr);
if (!franceOk) fautes++;
console.log(`\n  ${franceOk ? "✓" : "✗"} France           « ${phraseFr.slice(0, 52)} »` +
  (franceOk ? "" : "  ← devrait parler de marque de distributeur, pas d'un pays"));

await navigateur.close();
await arreterLeServeur();

if (fautes > 0) {
  console.log(`\n✗ ${fautes} cas sur ${CODES.length + 1} avec une phrase fautive.`);
  process.exit(1);
}
console.log(`\n✓ Les ${CODES.length} pays sont nommés avec la bonne préposition, et la France a bien sa phrase à elle.`);
