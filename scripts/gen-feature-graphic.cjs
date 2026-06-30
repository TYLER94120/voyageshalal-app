// Génère l'image de présentation du Play Store (feature graphic, 1024×500).
// Rend une page HTML de marque avec Chromium (playwright-core) → PNG.
//   node scripts/gen-feature-graphic.cjs
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const EXEC = '/opt/pw-browsers/chromium';
const ICON = path.join(__dirname, '..', 'assets', 'images', 'icon.png');
const OUT_DIR = path.join(__dirname, '..', 'assets', 'store');
const OUT = path.join(OUT_DIR, 'feature-graphic.png');

const iconB64 = fs.readFileSync(ICON).toString('base64');

const HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif}
  body{width:1024px;height:500px;overflow:hidden}
  .wrap{width:1024px;height:500px;display:flex;align-items:center;gap:56px;padding:0 72px;
        background:radial-gradient(120% 140% at 18% 30%, #1b4332 0%, #102718 45%, #0b1a0f 100%)}
  .icon{width:268px;height:268px;border-radius:60px;flex:0 0 auto;
        box-shadow:0 20px 50px rgba(0,0,0,.45);border:1px solid rgba(201,168,76,.35)}
  .right{display:flex;flex-direction:column;gap:18px}
  h1{font-size:74px;font-weight:800;color:#fdfaf3;letter-spacing:-1px;line-height:1}
  h1 span{color:#c9a84c}
  .tag{font-size:27px;font-weight:600;color:#e9e0c7}
  .tag b{color:#c9a84c}
  .chips{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;max-width:560px}
  .chip{font-size:19px;font-weight:700;color:#c9a84c;border:1.5px solid rgba(201,168,76,.6);
        border-radius:999px;padding:8px 18px;background:rgba(201,168,76,.08)}
</style></head>
<body>
  <div class="wrap">
    <img class="icon" src="data:image/png;base64,${iconB64}"/>
    <div class="right">
      <h1>Voyages<span>Halal</span></h1>
      <div class="tag">Le voyage musulman, <b>partout dans le monde</b>.</div>
      <div class="chips">
        <div class="chip">Mosquées proches</div>
        <div class="chip">Restaurants halal</div>
        <div class="chip">Hôtels bien situés</div>
        <div class="chip">Prière &amp; Qibla</div>
      </div>
    </div>
  </div>
</body></html>`;

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  await page.setContent(HTML, { waitUntil: 'networkidle' });
  await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 1024, height: 500 } });
  await browser.close();
  console.log('écrit', OUT);
})();
