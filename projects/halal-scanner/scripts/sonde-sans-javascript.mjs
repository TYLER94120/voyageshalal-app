/**
 * CE QU'UN ROBOT LIT QUAND LE JAVASCRIPT NE S'EXECUTE PAS.
 *
 * Test posé par l'ordre SEO du 17 août : « désactive JavaScript dans le
 * navigateur et recharge. Si l'écran est vide, ce n'est pas fait. »
 *
 * Mesuré le 18 août, JavaScript coupé, avant correction :
 *
 *   index.html              2 898 caractères
 *   additifs.html          16 513
 *   mentions-legales.html   4 217
 *   scan.html                 339   ← « Démarrage de la caméra… »
 *
 * scan.html est la page du scanner, celle dont le titre vise « scanner un
 * code-barres halal ». Un robot qui n'exécute pas le JavaScript n'y lisait
 * aucune phrase décrivant ce que la page fait : rien que du mobilier d'app.
 * Un bloc rendu par le serveur a été ajouté sous les écrans — 1 325
 * caractères, l'écran reste épuré pour la personne.
 *
 * Cette sonde empêche la rechute, et elle vérifie aussi l'autre règle de
 * l'ordre : aucune page orpheline, chacune doit recevoir au moins deux liens
 * internes des autres pages.
 */
import { chargerPlaywright, cheminChromium } from "./playwright-atelier.mjs";
import { servirLeSite } from "./serveur-atelier.mjs";

const PAGES = ["index.html", "scan.html", "additifs.html", "mentions-legales.html"];
const MINIMUM = 1000;   // caractères rendus par le serveur
const LIENS_RECUS = 2;  // liens internes venant des autres pages

const { chromium } = await chargerPlaywright();
const { base, arreter } = await servirLeSite();
const n = await chromium.launch({ executablePath: cheminChromium(), args: ["--no-proxy-server"] });

let fautes = 0;
const sortants = new Map();

console.log("JavaScript COUPÉ — ce que le robot reçoit :\n");
for (const f of PAGES) {
  const ctx = await n.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const p = await ctx.newPage();
  await p.goto(`${base}/${f}`, { waitUntil: "domcontentloaded" });
  const r = await p.evaluate(() => {
    // Un h1 caché derrière un écran d'app n'est pas un titre concurrent :
    // on ne compte que ce qui est réellement affiché.
    const h1 = [...document.querySelectorAll("h1")].filter((e) => e.offsetParent !== null);
    return {
      nbH1: h1.length,
      titre: h1[0] ? h1[0].innerText.trim() : "",
      taille: (document.body.innerText || "").replace(/\s+/g, " ").trim().length,
      liens: [...document.querySelectorAll("a[href]")]
        .map((a) => a.getAttribute("href"))
        .filter((h) => h && !/^(https?:|mailto:|#)/.test(h))
        .map((h) => h.replace(/^\.\//, "").replace(/^$/, "index.html")),
    };
  });
  sortants.set(f, new Set(r.liens));

  const soucis = [];
  if (r.nbH1 !== 1) soucis.push(`${r.nbH1} h1 visibles au lieu d'un seul`);
  if (!r.titre) soucis.push("le h1 est vide");
  if (r.taille < MINIMUM) soucis.push(`${r.taille} caractères rendus, moins de ${MINIMUM} — page vide pour un robot`);
  if (soucis.length) fautes += 1;
  console.log(
    `  ${soucis.length ? "✗" : "✓"} ${f.padEnd(22)} ${String(r.taille).padStart(6)} car.  h1 « ${r.titre.replace(/\n/g, " ").slice(0, 40)} »` +
      (soucis.length ? `\n      ← ${soucis.join(" ; ")}` : "")
  );
  await ctx.close();
}

// ── Aucune page orpheline ────────────────────────────────────────────────
console.log("\nLiens internes reçus par chaque page :\n");
for (const cible of PAGES) {
  const venant = PAGES.filter((autre) => autre !== cible && sortants.get(autre).has(cible));
  const ok = venant.length >= LIENS_RECUS;
  if (!ok) fautes += 1;
  console.log(
    `  ${ok ? "✓" : "✗"} ${cible.padEnd(22)} ${venant.length} lien(s) — depuis ${venant.join(", ") || "personne"}` +
      (ok ? "" : `  ← moins de ${LIENS_RECUS}, Google la trouvera mal`)
  );
}

await n.close();
await arreter();
console.log("");
console.log(fautes ? `✗ ${fautes} page(s) en défaut` : "✓ Les 4 pages rendent du texte sans JavaScript, et aucune n'est orpheline.");
process.exit(fautes ? 1 : 0);
