/**
 * CE QUE L'ECRAN A LE DROIT D'AFFIRMER.
 *
 * Consigne ecrite de Mohamed, 14 aout 2026 : « je ne veux pas engager ma
 * responsabilite, je ne veux pas de peche, je veux aider les musulmans ».
 * Traduit en regle de produit : ne jamais affirmer plus que ce qu'on sait.
 *
 * Deux defauts mesures ce jour-la, et que cette sonde empeche de revenir.
 *
 * 1. LE MOT « HALAL » SUR UNE SIMPLE DEDUCTION.
 *    Le rond vert affichait HALAL alors que le moteur voulait dire « je n'ai
 *    rien trouve d'interdit dans ce que j'ai pu lire ». Ce ne sont pas les
 *    memes phrases : « halal » porte aussi sur l'abattage, la contamination
 *    croisee, les auxiliaires non declares, l'alcool porteur d'arome —
 *    absents de toute liste d'ingredients. Le mot n'est legitime que si
 *    quelqu'un d'autre que nous le porte : une fiche verifiee (attestee), ou
 *    une certification declaree sur l'emballage.
 *
 * 2. L'INCONNU SANS ISSUE.
 *    Quand la base a le produit mais pas sa liste d'ingredients — le cas
 *    francais courant — l'ecran disait « Pas assez d'informations » et
 *    n'offrait que « Scanner un autre produit ». Et le cas de l'etiquette en
 *    arabe promettait « avec le bouton ci-dessous » alors qu'aucun bouton
 *    photo n'existait sur cet ecran. Une consigne impossible a suivre est
 *    pire que pas de consigne.
 */
import { chargerPlaywright, cheminChromium } from "./playwright-atelier.mjs";
import { servirLeSite } from "./serveur-atelier.mjs";

const fiche = (p) => ({
  status: 1,
  product: Object.assign(
    { product_name: "Produit d'essai", brands: "Essai", labels_tags: [], additives_tags: [], categories_tags: [] },
    p
  ),
});

// attendu : le mot exact que le rond doit porter.
// photo    : le bouton de lecture d'etiquette doit-il etre propose ?
// retenir  : un bloc « ce qu'il faut retenir » doit-il expliquer quoi faire ?
const CAS = [
  {
    nom: "deduction seule, rien trouve",
    champs: { ingredients_text: "eau, sucre, sel" },
    attendu: "RIEN D'INTERDIT",
    photo: false,
    retenir: false,
  },
  {
    nom: "certification declaree sur l'emballage",
    champs: { ingredients_text: "eau, sucre, sel", labels_tags: ["en:halal"] },
    attendu: "HALAL CERTIFIÉ",
    photo: false,
    retenir: false,
  },
  {
    nom: "etiquette vegane — n'est PAS une certification",
    champs: { ingredients_text: "eau, sucre, sel", labels_tags: ["en:vegan"] },
    attendu: "RIEN D'INTERDIT",
    photo: false,
    retenir: false,
  },
  {
    nom: "doute (E471)",
    champs: { ingredients_text: "farine, E471" },
    attendu: "DOUTEUX",
    photo: false,
    retenir: true,
  },
  {
    nom: "interdit (lardons)",
    champs: { ingredients_text: "pate, lardons fumes" },
    attendu: "HARAM",
    photo: false,
    retenir: true,
  },
  {
    nom: "INCONNU — liste d'ingredients absente",
    champs: { ingredients_text: "" },
    attendu: "INCONNU",
    photo: true,
    retenir: true,
  },
  {
    nom: "INCONNU — champ ingredients manquant",
    champs: {},
    attendu: "INCONNU",
    photo: true,
    retenir: true,
  },
  {
    nom: "INCONNU — etiquette en arabe",
    champs: { ingredients_text: "الماء، السكر، ملح" },
    attendu: "INCONNU",
    photo: true,
    retenir: true,
  },
];

const ECRANS = [
  ["iPhone 14", 390, 844],
  ["petit ecran", 320, 568],
];

const { chromium } = await chargerPlaywright();
const { base, arreter } = await servirLeSite();
const n = await chromium.launch({ executablePath: cheminChromium(), args: ["--no-proxy-server"] });

let fautes = 0;

for (const [ecran, w, h] of ECRANS) {
  console.log(`### ${ecran} (${w} px)`);
  for (const cas of CAS) {
    const ctx = await n.newContext({ viewport: { width: w, height: h }, serviceWorkers: "block" });
    const p = await ctx.newPage();
    await p.route(/openfoodfacts\.org|openbeautyfacts\.org/, (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fiche(cas.champs)) })
    );
    await p.route(/halalgpt\.fr/, (r) => r.fulfill({ status: 204, body: "" }));
    await p.goto(`${base}/scan.html?code=3017620422003`, { waitUntil: "domcontentloaded" });

    let pret = false;
    for (let i = 0; i < 150 && !pret; i++) {
      pret = await p
        .evaluate(() => {
          const e = document.getElementById("ecran-resultat");
          return !!e && !e.hidden;
        })
        .catch(() => false);
      if (!pret) await p.waitForTimeout(200);
    }

    const vu = await p
      .evaluate(() => {
        const l = document.getElementById("verdict-label");
        const bouton = document.getElementById("lire-etiquette-resultat");
        const corps = document.getElementById("ecran-resultat").innerText;
        // getClientRects() sur le TEXTE rend une boite par ligne reellement
        // dessinee : le pseudo-element ::after du rond n'y entre pas, et la
        // hauteur de la boite ne trompe pas le comptage.
        const plage = document.createRange();
        plage.selectNodeContents(l.firstChild);
        const lignes = [...plage.getClientRects()].filter((b) => b.width > 0).length;
        return {
          mot: l.textContent.trim(),
          lignes,
          debordeX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          photo: !!bouton && !bouton.hidden,
          retenir: /CE QU'IL FAUT RETENIR/i.test(corps),
          conclusion: /CE QU'IL FAUT RETENIR/i.test(corps)
            ? corps.split(/CE QU'IL FAUT RETENIR/i)[1].trim().slice(0, 60)
            : "",
        };
      })
      .catch((e) => ({ mot: "ERREUR", erreur: String(e).slice(0, 80) }));

    const soucis = [];
    if (vu.mot !== cas.attendu) soucis.push(`mot « ${vu.mot} » au lieu de « ${cas.attendu} »`);
    if (vu.photo !== cas.photo) soucis.push(`bouton photo ${vu.photo ? "propose" : "absent"}, attendu ${cas.photo ? "propose" : "absent"}`);
    if (vu.retenir !== cas.retenir) soucis.push(`bloc « retenir » ${vu.retenir ? "present" : "absent"}, attendu ${cas.retenir ? "present" : "absent"}`);
    if (vu.lignes > 1) soucis.push(`le mot du verdict tient sur ${vu.lignes} lignes`);
    if (vu.debordeX) soucis.push("la page deborde horizontalement");

    // La promesse ecrite doit correspondre a ce qui est affiche : un texte qui
    // dit « le bouton ci-dessous » sans bouton est une consigne impossible.
    if (/bouton ci-dessous/i.test(vu.conclusion || "") && !vu.photo) {
      soucis.push("le texte renvoie a un bouton qui n'existe pas");
    }

    if (soucis.length) fautes += 1;
    console.log(
      `  ${soucis.length ? "✗" : "✓"} ${cas.nom.padEnd(42)} « ${vu.mot} »` +
        (soucis.length ? `\n      ← ${soucis.join(" ; ")}` : "")
    );
    await ctx.close();
  }
  console.log("");
}

await n.close();
await arreter();

console.log(
  fautes
    ? `✗ ${fautes} ecran(s) affirment autre chose que ce qu'on sait`
    : "✓ Chaque ecran n'affirme que ce qu'on sait, et tout INCONNU offre une issue."
);
process.exit(fautes ? 1 : 0);
