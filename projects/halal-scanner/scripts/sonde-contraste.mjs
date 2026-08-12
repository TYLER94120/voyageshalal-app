// Contraste texte/fond, calcule selon la formule WCAG. Seuil : 4,5 pour un
// texte courant, 3,0 pour un texte grand (>=24px, ou >=19px en gras).
import { chargerPlaywright, cheminChromium } from "./playwright-atelier.mjs";
import { servirLeSite } from "./serveur-atelier.mjs";
const { chromium } = await chargerPlaywright();
const { base, arreter } = await servirLeSite();
const n = await chromium.launch({ executablePath: cheminChromium(), args: ["--no-proxy-server"] });
const c = await n.newContext({ viewport:{width:390,height:844}, serviceWorkers:"block" });

let total = 0, faibles = 0, nonMesures = 0;
for (const page of ["index.html", "scan.html", "additifs.html", "mentions-legales.html"]) {
  const p = await c.newPage();
  await p.route(/openfoodfacts\.org|openbeautyfacts\.org|halalgpt\.fr/, r => r.fulfill({status:204,body:""}));
  await p.goto(`${base}/${page}`, { waitUntil:"domcontentloaded" });
  await p.waitForTimeout(2000);
  const r = await p.evaluate(() => {
    const lum = (c) => { const [r,g,b] = c.map(v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
      return 0.2126*r + 0.7152*g + 0.0722*b; };
    const rgb = (s) => { const m = s.match(/\d+(\.\d+)?/g); return m ? m.slice(0,3).map(Number) : null; };
    // Piege : la version precedente lisait le TROISIEME nombre de « rgb(18,38,26) »
    // comme une opacite de 26, ce qui rendait des contrastes negatifs — donc
    // impossibles. On compte les nombres : quatre = opacite, trois = opaque.
    const alpha = (s) => { const m = s.match(/[\d.]+/g); return m && m.length >= 4 ? Number(m[3]) : 1; };
    // Un degrade ou une image de fond ne se lit pas avec backgroundColor : le
    // navigateur y repond « transparent ». La premiere version prenait alors le
    // fond de la page et annoncait du blanc sur creme — un contraste de 1,0,
    // donc quatre faux defauts. On ne mesure pas ces cas, on les compte a part.
    const nonMesurable = (e) => { let x = e;
      while (x) { const s = getComputedStyle(x);
        if (s.backgroundImage && s.backgroundImage !== "none") return true;
        if (alpha(s.backgroundColor) > 0.5) return false;
        x = x.parentElement; }
      return false; };
    const fondDe = (e) => { let x = e;
      while (x) { const b = getComputedStyle(x).backgroundColor;
        if (b && alpha(b) > 0.5 && rgb(b)) return rgb(b); x = x.parentElement; }
      return [255,255,255]; };
    const melange = (av, ar, a) => av.map((v,i) => v*a + ar[i]*(1-a));
    const res = [];
    for (const e of document.querySelectorAll("p, span, a, li, h1, h2, h3, button, div")) {
      if (e.offsetParent === null) continue;
      const propre = [...e.childNodes].some(x => x.nodeType === 3 && x.textContent.trim().length > 3);
      if (!propre) continue;
      if (nonMesurable(e)) { res.push({ nonMesure: true }); continue; }
      const s = getComputedStyle(e);
      const av = rgb(s.color); if (!av) continue;
      const fond = fondDe(e);
      const couleur = melange(av, fond, alpha(s.color));
      const l1 = lum(couleur), l2 = lum(fond);
      const ratio = (Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05);
      const taille = parseFloat(s.fontSize), gras = parseInt(s.fontWeight) >= 700;
      const seuil = (taille >= 24 || (taille >= 19 && gras)) ? 3 : 4.5;
      res.push({ txt: e.textContent.trim().slice(0,34), ratio: Math.round(ratio*10)/10, seuil,
                 ok: ratio >= seuil, taille: Math.round(taille) });
    }
    return res;
  });
  const horsPortee = r.filter(x => x.nonMesure).length;
  const mesures = r.filter(x => !x.nonMesure);
  const mauvais = mesures.filter(x => !x.ok);
  total += mesures.length; faibles += mauvais.length; nonMesures += horsPortee;
  console.log(`--- ${page} : ${mesures.length} textes mesurés, ${mauvais.length} sous le seuil` +
    (horsPortee ? `, ${horsPortee} sur dégradé (non mesurable)` : ""));
  for (const m of mauvais.slice(0, 6)) console.log(`    ${m.ratio} < ${m.seuil}  (${m.taille}px)  « ${m.txt} »`);
  await p.close();
}
console.log(`\n${total - faibles}/${total} textes au-dessus du seuil WCAG` +
  (nonMesures ? `, ${nonMesures} posés sur un dégradé et non mesurables ici.` : "."));
if (faibles > 0) process.exit(1);
await n.close(); await arreter();
