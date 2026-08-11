/**
 * Sonde « iPhone » — ce que voit quelqu'un dont le navigateur n'a PAS de
 * BarcodeDetector natif (Safari iOS, et Firefox). Le scanner charge alors une
 * bibliothèque de 328 Ko, aujourd'hui livrée avec le site (`site/vendor/`).
 *
 * Quatre scènes : réseau normal, réseau lent en rayon, bibliothèque
 * injoignable, et deuxième visite sans réseau du tout.
 *
 * Ce qu'elle a trouvé le 11 août : sur réseau lent, l'app affichait
 * « 🔎 Recherche du code-barres… » alors que RIEN ne cherchait, puis reprochait
 * à 9 s sa façon de filmer et à 17 s son code-barres. Elle doit rester verte :
 * la colonne « lecteur » dit si la bibliothèque est là, et aucun reproche ne
 * doit apparaître tant qu'elle vaut « absent ».
 *
 * Se lance seule : `npm run sonde:iphone`. Elle demandait avant qu'on ait
 * lancé `python3 -m http.server 8099` à la main — un commentaire n'a jamais
 * démarré un serveur, et une sonde qui ne démarre pas ne mesure rien.
 */
import { chargerPlaywright, cheminChromium } from "./playwright-atelier.mjs";
import { servirLeSite } from "./serveur-atelier.mjs";
const { chromium } = await chargerPlaywright();

const { base: BASE, arreter: arreterLeServeur } = await servirLeSite();

// On reconnaît la requête par une fonction et non par un motif : un motif qui
// cesse de correspondre laisse passer la requête, et la sonde passe alors au
// vert sans avoir rien simulé. C'est arrivé le 11 août, quand la bibliothèque
// a changé d'adresse — l'instrument mentait, pas le site.
const estLaBibliotheque = (u) => /\/vendor\/zxing-.*\.js$/.test(String(u));

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
  // Service worker coupé : une fois installé, il sert la bibliothèque depuis le
  // cache et la requête ne passe plus par le réseau — les scènes « réseau lent »
  // et « injoignable » ne simuleraient alors plus rien. Le hors-ligne se mesure
  // à part, dans la scène D.
  const contexte = await navigateur.newContext({
    permissions: ["camera"],
    serviceWorkers: "block",
  });
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
    // `detectionActive` vit dans un <script type="module"> : illisible d'ici.
    // Le paquet UMD, lui, pose window.ZXing en arrivant — fait observable.
    const demarre = await page.evaluate(() => typeof window.ZXing !== "undefined");
    releves.push({ t: Math.round((Date.now() - debut) / 1000), texte, demarre });
  }
  await navigateur.close();
  return { nom, releves };
}

const cas = [
  {
    nom: "A — réseau normal, la vraie bibliothèque livrée avec le site",
    reglage: async (page) => {
      let vue = false;
      page.on("request", (r) => { if (estLaBibliotheque(r.url())) vue = true; });
      page.once("close", () => {
        if (!vue) {
          console.log("✗ la bibliothèque locale n'a jamais été demandée — chemin faux ?");
          process.exitCode = 1;
        }
      });
    },
    jalons: [3000, 9000, 17000],
  },
  {
    nom: "B — réseau lent en rayon, la bibliothèque n'arrive pas",
    reglage: async (page) => page.route(estLaBibliotheque, () => { /* on ne répond pas */ }),
    jalons: [3000, 9000, 17000, 25000],
  },
  {
    nom: "C — bibliothèque injoignable (fichier perdu, réseau coupé)",
    reglage: async (page) => page.route(estLaBibliotheque, (r) => r.abort("failed")),
    jalons: [3000, 9000, 17000],
  },
];

// Un message qui rejette la faute sur la personne ou sur son produit. Tant que
// le lecteur n'est pas là, rien ne cherche, et aucun de ces mots n'a le droit
// d'apparaître — y compris « Recherche du code-barres », qui annonce une
// recherche qui n'a pas commencé.
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
      `  ${faute ? "✗" : "✓"} ${String(l.t).padStart(2)}s  lecteur=${l.demarre ? "chargé" : "absent"}  « ${l.texte} »`
    );
  }
  console.log("");
}

/**
 * Scène D — deuxième visite, hors ligne.
 *
 * C'est la raison d'être du rapatriement de la bibliothèque. Tant qu'elle
 * venait d'unpkg.com, le service worker la laissait passer sans la garder
 * (`origine différente → return`) : aucun iPhone ne pouvait scanner hors
 * connexion, même à la dixième visite.
 */
async function deuxiemeVisiteHorsLigne() {
  const navigateur = await chromium.launch({
    executablePath: cheminChromium(),
    args: ["--no-proxy-server", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
  });
  const contexte = await navigateur.newContext({ permissions: ["camera"] });
  await contexte.addInitScript(() => { delete window.BarcodeDetector; });
  const page = await contexte.newPage();

  // 1re visite, en ligne : le service worker s'installe et le premier scan
  // fait entrer la bibliothèque dans le cache.
  await page.goto(BASE + "/scan.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof window.ZXing !== "undefined", null, { timeout: 20000 })
    .catch(() => {});
  const premiere = await page.evaluate(() => typeof window.ZXing !== "undefined");
  await attendre(1500); // laisse le service worker écrire dans le cache

  // 2e visite, sans réseau du tout.
  await contexte.setOffline(true);
  let pageServie = true;
  await page.reload({ waitUntil: "domcontentloaded" }).catch(() => { pageServie = false; });
  await attendre(6000);
  const seconde = pageServie && (await page.evaluate(() => typeof window.ZXing !== "undefined"));
  const message = pageServie
    ? await page.evaluate(() => {
        const e = document.getElementById("etat-camera");
        return e && !e.hidden ? e.textContent.trim() : "(rien d'affiché)";
      })
    : "la page elle-même n'a pas été servie";
  await navigateur.close();
  return { premiere, pageServie, seconde, message };
}

const d = await deuxiemeVisiteHorsLigne();
console.log("### D — deuxième visite, hors ligne (service worker actif)");
console.log(`  ${d.premiere ? "✓" : "✗"} 1re visite en ligne : lecteur ${d.premiere ? "chargé" : "absent"}`);
console.log(`  ${d.pageServie ? "✓" : "✗"} page servie hors ligne : ${d.pageServie ? "oui" : "NON"}`);
console.log(`  ${d.seconde ? "✓" : "✗"} lecteur disponible hors ligne : ${d.seconde ? "OUI" : "non"}`);
console.log(`     « ${d.message} »\n`);
if (!d.seconde) fautes++;

await arreterLeServeur();

if (fautes > 0) {
  console.log(`✗ ${fautes} défaut(s). Un message accuse la personne, ou le hors-ligne ne marche pas.`);
  process.exit(1);
}
console.log("✓ Aucun message n'accuse la personne tant que le lecteur n'est pas là,");
console.log("  et la lecture reste possible hors ligne dès la deuxième visite.");
