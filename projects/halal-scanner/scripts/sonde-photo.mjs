// La lecture d'etiquette par photo n'a jamais ete verifiee depuis que Mohamed
// l'a signalee en panne le 10 aout (« ca me demande de reprendre la photo »).
// On la conduit de bout en bout avec une vraie photo de telephone, et on note
// ce que le visiteur voit pour CHAQUE facon d'echouer.
//
// ARMEE LE 12 AOUT 2026. Comme les trois sondes du moteur corrigees ce matin,
// celle-ci decrivait sans rien attendre : six scenes imprimees, aucune valeur
// comparee, succes garanti. Chaque scene porte maintenant sa promesse.
//
// Les deux promesses qui comptent le plus, et pourquoi :
//
//  · « Ce n'est pas ta photo » sur une panne de SERVICE (500, reponse
//    illisible, JSON sans verdict). C'est litteralement la plainte du
//    10 aout : l'app renvoyait l'utilisateur a sa photo alors que la panne
//    etait chez nous. Quelqu'un reprend trois fois la meme photo dans un
//    rayon, en 3G, et finit par croire que l'app ne marche pas.
//
//  · La photo est COMPRESSEE avant l'envoi : 2,97 Mo fabriques -> 0,20 Mo
//    envoyes. Si une regression supprimait la compression, l'envoi de 3 Mo
//    depuis un supermarche en 3G echouerait — sans qu'aucun test ne rougisse.
//    Le seuil est pose a 0,5 Mo : large, mais un retour au fichier brut le
//    depasse six fois.
import { writeFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chargerPlaywright, cheminChromium } from "./playwright-atelier.mjs";
import { servirLeSite } from "./serveur-atelier.mjs";
const { chromium } = await chargerPlaywright();
// La sonde sert le site elle-meme. Avant, elle visait le port 8099 en esperant
// que quelqu'un l'ait lance : `npm run sonde:photo` s'arretait sur
// ERR_CONNECTION_REFUSED, et les six cas annonces « repasses » n'avaient en
// realite jamais tourne.
const { base: BASE, arreter: arreterLeServeur } = await servirLeSite();
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

const POIDS_MAX = 0.5 * 1024 * 1024; // 0,5 Mo envoyés au maximum
let ecarts = 0;

async function scene(nom, reponseApi, attendu) {
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
  // Les promesses de la scène. Chacune est un défaut qu'un visiteur verrait.
  const manques = [];
  if (ecran !== attendu.ecran) manques.push(`écran ${ecran}, attendu ${attendu.ecran}`);
  if (err.length) manques.push(`erreur JS : ${err.join("; ")}`);
  if (poids === null) manques.push("rien n'a été envoyé au service");
  else if (poids > POIDS_MAX)
    manques.push(`${(poids / 1024 / 1024).toFixed(2)} Mo envoyés — la photo n'est plus compressée`);
  if (attendu.ecran === "ecran-erreur") {
    if (!titre.trim()) manques.push("écran d'erreur sans titre");
    if (!texte.trim()) manques.push("écran d'erreur sans explication");
    if (!bouton.trim()) manques.push("écran d'erreur sans bouton pour continuer");
  }
  // La phrase du 10 août : sur une panne de service, on ne renvoie pas le
  // visiteur à sa photo. Gelée mot pour mot, c'est la correction elle-même.
  if (attendu.pasTaPhoto && !/ce n'est pas ta photo/i.test(texte))
    manques.push("ne dit pas « Ce n'est pas ta photo » alors que la panne est chez nous");

  if (manques.length) ecarts += manques.length;
  console.log(`${manques.length ? "✗" : "✓"} ${nom}`);
  console.log(`  écran : ${ecran}${poids ? ` | envoyé : ${(poids / 1024 / 1024).toFixed(2)} Mo` : " | rien envoyé"}`);
  if (ecran === "ecran-erreur") console.log(`  « ${titre} » — ${texte.split("\n")[0].slice(0, 70)} → bouton « ${bouton.trim()} »`);
  for (const m of manques) console.log(`  ← ${m}`);
  console.log();
  await ctx.close();
}

const json = (o) => (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(o) });

await scene("1. service répond correctement",
  json({ verdict: "douteux", resume: "Gélatine détectée", ingredients_a_risque: [{ nom: "Gélatine", raison: "origine non précisée" }] }),
  { ecran: "ecran-etiquette" });
// 429 : la panne est chez nous, mais elle est temporaire et se dit autrement
// (« réessaie dans quelques minutes »). On n'y exige pas la phrase.
await scene("2. service saturé (429)",
  (r) => r.fulfill({ status: 429, body: "" }), { ecran: "ecran-erreur" });
await scene("3. service en panne (500)",
  (r) => r.fulfill({ status: 500, body: "" }), { ecran: "ecran-erreur", pasTaPhoto: true });
await scene("4. réponse illisible (pas du JSON)",
  (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<html>oops</html>" }),
  { ecran: "ecran-erreur", pasTaPhoto: true });
await scene("5. JSON valide mais sans verdict",
  json({ resume: "rien" }), { ecran: "ecran-erreur", pasTaPhoto: true });
// Réseau coupé : là, c'est bien au visiteur d'agir — vérifier sa connexion.
// La phrase serait fausse ici, on ne l'exige pas.
await scene("6. réseau coupé", (r) => r.abort(), { ecran: "ecran-erreur" });
await b.close();
await arreterLeServeur();
rmSync(PHOTO, { force: true });

if (ecarts > 0) {
  console.log(`✗ ${ecarts} défaut(s) sur les 6 façons dont la lecture par photo peut se passer.`);
  process.exit(1);
}
console.log("✓ Les 6 scènes de la lecture par photo tiennent leur promesse, panne du service comprise.");
