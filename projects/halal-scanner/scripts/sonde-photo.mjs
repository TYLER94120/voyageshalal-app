// La lecture d'etiquette par photo n'a jamais ete verifiee depuis que Mohamed
// l'a signalee en panne le 10 aout (« ca me demande de reprendre la photo »).
// On la conduit de bout en bout avec une vraie photo de telephone, et on note
// ce que le visiteur voit pour CHAQUE facon d'echouer.
import { chromium } from "playwright";
const BASE = "http://127.0.0.1:8099";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-proxy-server"] });

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
  await p.setInputFiles("#fichier-photo", "etiquette.jpg");
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
