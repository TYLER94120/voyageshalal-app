/**
 * MESURE : que reste-t-il des polices quand le reseau disparait ?
 *
 * Constat du 14 aout 2026. Les 7 fichiers de police ont ete rapatries sur
 * notre domaine le 13 aout pour cesser d'envoyer l'adresse IP des visiteurs
 * chez Google. Correction juste — mais ils n'ont JAMAIS ete ajoutes a la
 * liste `FICHIERS` pre-chargee par le service worker :
 *
 *   fichiers pre-charges           : 12
 *   ressources reclamees par les 4 pages : 15
 *   polices dans le pre-chargement : 0 sur 7
 *
 * Le service worker garde bien une copie de tout ce qui passe (« cache
 * d'abord » sur les ressources de notre domaine). La question n'est donc PAS
 * « les polices sont-elles cachees un jour » mais « le sont-elles au moment
 * ou le reseau tombe ».
 *
 * Et la reponse depend d'un detail du navigateur : une police @font-face
 * n'est telechargee QUE si un glyphe de cette graisse est reellement dessine.
 * Une graisse utilisee seulement sur scan.html n'est jamais chargee par une
 * visite de l'accueil. Le visiteur qui installe l'app depuis l'accueil, puis
 * descend au parking du supermarche, ouvre le scanner sans elles.
 *
 * Cette sonde coupe le SERVEUR — le seul hors-ligne qu'aucune couche ne
 * contourne (leçon du 12 aout : `setOffline` ne s'applique pas aux requetes
 * emises par un service worker).
 */
import { chargerPlaywright, cheminChromium } from "./playwright-atelier.mjs";
import { servirLeSite } from "./serveur-atelier.mjs";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PROJET = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = join(PROJET, "site");

// Les polices que les pages reclament vraiment, lues dans les pages.
const POLICES = new Set();
for (const f of ["index.html", "scan.html", "additifs.html", "mentions-legales.html"]) {
  const html = readFileSync(join(SITE, f), "utf8");
  for (const m of html.matchAll(/url\(["']?\.\/(vendor\/polices\/[\w.-]+\.woff2)/g)) POLICES.add(m[1]);
}
const ATTENDUES = [...POLICES].sort();

// Ce que le service worker promet de pre-charger.
const sw = readFileSync(join(SITE, "sw.js"), "utf8");
const bloc = (sw.match(/const FICHIERS = \[([\s\S]*?)\];/) || [])[1] || "";
const PRECHARGE = [...bloc.matchAll(/"([^"]+)"/g)].map((m) => m[1].replace(/^\.\//, ""));

let fautes = 0;

console.log(`Polices reclamees par les pages : ${ATTENDUES.length}`);
console.log(`Polices pre-chargees par le service worker : ${ATTENDUES.filter((p) => PRECHARGE.includes(p)).length}`);

// Un fichier annonce au pre-chargement mais absent du disque fait echouer
// `addAll` EN ENTIER : l'installation du service worker echoue, et le site
// perd tout son hors-ligne — pas seulement sa police. On s'arrete donc ici
// plutot que d'ouvrir un navigateur pendant trois minutes pour rien.
const absents = ATTENDUES.filter((p) => !existsSync(join(SITE, p)));
if (absents.length) {
  for (const p of absents) console.log(`  ✗ ${p} — INTROUVABLE sur le disque`);
  console.log("");
  console.log(`✗ ${absents.length} fichier(s) manquant(s) : addAll echouerait et le site perdrait TOUT son hors-ligne`);
  process.exit(1);
}
console.log("");

const { chromium } = await chargerPlaywright();
const { base, arreter, couper } = await servirLeSite();
const n = await chromium.launch({
  executablePath: cheminChromium(),
  args: ["--no-proxy-server"],
});

/**
 * Rejoue le parcours reel : le visiteur arrive par UNE page, l'app s'installe,
 * puis le reseau disparait pour de bon. On demande ensuite au cache ce qu'il
 * contient — c'est la seule reponse qui ne se discute pas.
 */
async function mesurer(pageDArrivee) {
  const ctx = await n.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/${pageDArrivee}`, { waitUntil: "load" });

  // Attendre que le service worker soit reellement actif, sinon on mesure
  // un cache qui n'a pas encore commence a se remplir.
  await page
    .evaluate(() => navigator.serviceWorker.ready.then(() => true))
    .catch(() => false);
  await page.waitForTimeout(1500);

  const dansLeCache = await page.evaluate(async () => {
    const noms = await caches.keys();
    const urls = [];
    for (const nom of noms) {
      const c = await caches.open(nom);
      for (const r of await c.keys()) urls.push(r.url);
    }
    return urls;
  });

  await ctx.close();
  return dansLeCache;
}

const RESULTATS = [];
for (const arrivee of ["index.html", "scan.html"]) {
  const urls = await mesurer(arrivee);
  const presentes = ATTENDUES.filter((p) => urls.some((u) => u.endsWith(p)));
  RESULTATS.push([arrivee, presentes.length]);
  console.log(`Arrivee par ${arrivee.padEnd(14)} → ${presentes.length}/${ATTENDUES.length} polices en cache`);
  for (const p of ATTENDUES) {
    const ok = presentes.includes(p);
    console.log(`   ${ok ? "✓" : "✗"} ${p.replace("vendor/polices/", "")}`);
  }
  console.log("");
}

// ── Le verdict : le scanner ouvert hors ligne apres une arrivee par l'accueil
//
// C'est le parcours qui compte. Personne n'installe une app depuis la page
// du scanner : on arrive par l'accueil, et le scanner sert plus tard, souvent
// sans reseau. Si les polices ne sont pas la a ce moment, elles ne le seront
// jamais.
console.log("Parcours reel : arrivee par l'accueil, PUIS le scanner sans reseau.");
const ctx = await n.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(`${base}/index.html`, { waitUntil: "load" });
await page.evaluate(() => navigator.serviceWorker.ready.then(() => true)).catch(() => false);
await page.waitForTimeout(1500);

await couper(); // plus personne au bout du fil

// On NE NAVIGUE PAS vers un serveur mort. Faute deja commise le 12 aout, et
// refaite ici le 14 : `page.goto` rend alors la page d'erreur du navigateur
// (345 caracteres) et la sonde annonce un defaut grave inexistant. Mesure qui
// l'a etabli, au meme instant et sur la meme page :
//     page.goto("./scan.html")   ->     345 caracteres  (page d'erreur)
//     fetch("./scan.html")       -> 129 795 caracteres  (le vrai scanner)
// On interroge donc le cache DEPUIS la page deja ouverte.
const titre = await page
  .evaluate(async () => {
    try {
      const r = await fetch("./scan.html");
      return (await r.text()).length;
    } catch {
      return 0;
    }
  })
  .catch(() => 0);
const policesServies = await page
  .evaluate(async () => {
    const noms = await caches.keys();
    const urls = [];
    for (const nom of noms) {
      const c = await caches.open(nom);
      for (const r of await c.keys()) urls.push(r.url);
    }
    return urls.filter((u) => u.includes("/vendor/polices/")).length;
  })
  .catch(() => 0);

console.log(`  scanner servi hors ligne : ${titre > 500 ? "OUI" : "NON"} (${titre} caracteres recus du cache)`);
console.log(`  polices disponibles a cet instant : ${policesServies}/${ATTENDUES.length}`);

if (titre <= 500) {
  console.log("  ✗ le scanner ne s'ouvre pas sans reseau — defaut grave");
  fautes += 1;
}
if (policesServies < ATTENDUES.length) {
  console.log(`  ✗ ${ATTENDUES.length - policesServies} police(s) manquante(s) : le scanner s'affiche avec la police de secours`);
  fautes += 1;
}

await ctx.close();
await n.close();
await arreter();

console.log("");
console.log(fautes ? `✗ ${fautes} defaut(s)` : "✓ toutes les polices survivent a la coupure");
process.exit(fautes ? 1 : 0);
