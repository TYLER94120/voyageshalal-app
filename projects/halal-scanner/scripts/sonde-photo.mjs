// La lecture d'etiquette par photo n'a jamais ete verifiee depuis que Mohamed
// l'a signalee en panne le 10 aout (« ca me demande de reprendre la photo »).
// On la conduit de bout en bout avec une vraie photo de telephone, et on note
// ce que le visiteur voit pour CHAQUE facon d'echouer.
import { writeFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chargerPlaywright, cheminChromium } from "./playwright-atelier.mjs";
const { chromium } = await chargerPlaywright();
const BASE = "http://127.0.0.1:8099";
const b = await chromium.launch({ executablePath: cheminChromium(), args: ["--no-proxy-server"] });

// La sonde fabrique elle-même sa photo : une sonde qui dépend d'un fichier posé
// à la main un jour donné ne se relance jamais. Format d'un vrai appareil
// photo de téléphone, avec du grain pour peser le poids d'une vraie prise.
const PHOTO = join(tmpdir(), "halalcheck-etiquette.jpg");
async function fabriquerPhoto() {
  const p = await b.newPage();
  const donnees = await p.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 4032; c.height = 3024;
    const g = c.getContext("2d");
    g.fillStyle = "#f2efe6"; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = "#1a1a1a"; g.font = "bold 120px sans-serif";
    g.fillText("INGRÉDIENTS : farine de blé, sucre, huile de", 160, 700);
    g.fillText("palme, émulsifiant E471, arôme, gélatine.", 160, 880);
    const img = g.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const bruit = (Math.random() * 46) | 0;
      img.data[i] = Math.min(255, img.data[i] + bruit);
      img.data[i + 1] = Math.min(255, img.data[i + 1] + bruit);
      img.data[i + 2] = Math.min(255, img.data[i + 2] + bruit);
    }
    g.putImageData(img, 0, 0);
    return c.toDataURL("image/jpeg", 0.92).split(",")[1];
  });
  await p.close();
  writeFileSync(PHOTO, Buffer.from(donnees, "base64"));
  return statSync(PHOTO).size;
}
const poidsOrigine = await fabriquerPhoto();
console.log(`Photo fabriquée : 4032×3024, ${(poidsOrigine / 1024 / 1024).toFixed(2)} Mo\n`);

async function scene(nom, reponseApi) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const err = [];
  let poids = null;
  p.on("pageerror", (e) => err.push(e.message));
  await ctx.route("**/*", async (r) => {
    const u = r.request().url();
    if (u.includes("/api/etiquette")) {
      poids = (r.request().postData() || "").length;
      return reponseApi(r);
    }
    if (u.startsWith(BASE)) return r.continue();
    return r.fulfill({ status: 204, body: "" });
  });

  await p.goto(`${BASE}/scan.html?code=6111234567890`);
  await p.waitForTimeout(1500);
  // On force l'ecran photo puis on depose le fichier, comme le ferait l'appareil.
  await p.evaluate(() => document.getElementById("ecran-photo").hidden = false);
  await p.setInputFiles("#fichier-photo", PHOTO);
  await p.waitForTimeout(4000);

  const ecran = await p.evaluate(() =>
    ["ecran-etiquette", "ecran-erreur", "ecran-chargement"].find((i) => !document.getElementById(i).hidden) || "(aucun)"
  );
  const titre = await p.locator("#erreur-titre").textContent().catch(() => "");
  const texte = (await p.locator("#erreur-texte").textContent().catch(() => "")) || "";
  const bouton = await p.locator("#reessayer").textContent().catch(() => "");
  console.log(`${nom}`);
  console.log(`  écran : ${ecran}${poids ? ` | envoyé : ${(poids / 1024 / 1024).toFixed(2)} Mo` : " | rien envoyé"}`);
  if (ecran === "ecran-erreur") console.log(`  « ${titre} » — ${texte.split("\n")[0].slice(0, 70)} → bouton « ${bouton.trim()} »`);
  if (err.length) console.log(`  ERREURS JS : ${err.join("; ")}`);
  console.log();
  await ctx.close();
}

const json = (o) => (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(o) });

await scene("1. service répond correctement", json({ verdict: "douteux", resume: "Gélatine détectée", ingredients_a_risque: [{ nom: "Gélatine", raison: "origine non précisée" }] }));
await scene("2. service saturé (429)", (r) => r.fulfill({ status: 429, body: "" }));
await scene("3. service en panne (500)", (r) => r.fulfill({ status: 500, body: "" }));
await scene("4. réponse illisible (pas du JSON)", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<html>oops</html>" }));
await scene("5. JSON valide mais sans verdict", json({ resume: "rien" }));
await scene("6. réseau coupé", (r) => r.abort());
await b.close();
rmSync(PHOTO, { force: true });
