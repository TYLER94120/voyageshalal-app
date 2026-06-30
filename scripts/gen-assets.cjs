// Génère les assets de marque (icône, adaptive, splash, favicon) — croissant + étoile
// dorés sur fond nuit dégradé, avec anti-aliasing (supersampling). Pur Node (zlib),
// sans dépendance. Relancer après un changement de palette : `node scripts/gen-assets.cjs`.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const NIGHT = [11, 26, 15];
const NIGHT_LIGHT = [22, 48, 30]; // centre du dégradé (un peu plus clair)
const GOLD = [201, 168, 76];
const GOLD_HI = [226, 199, 120]; // léger reflet

// ── PNG (CRC + chunks) ──
const crcTable = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function toPng(size, rgba) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filtre 0
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      raw[p++] = rgba[i];
      raw[p++] = rgba[i + 1];
      raw[p++] = rgba[i + 2];
      raw[p++] = rgba[i + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Géométrie ──
function lerp(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// Rend l'icône avec supersampling SS×SS pour des bords lisses.
function render(size, { gradient, scale }) {
  const SS = 3;
  const S = size * SS;
  const cy = S / 2;
  const Rb = (S / 2) * scale; // rayon du croissant
  // On décale le croissant vers la droite pour qu'il paraisse centré (sa masse
  // visible est à gauche du cercle).
  const cx = S / 2 + Rb * 0.2;
  const cutR = Rb * 0.84;
  const cutCx = cx + Rb * 0.36; // ouverture vers la droite
  const cutCy = cy - Rb * 0.06;
  const maxR = Math.hypot(S / 2, S / 2);

  // Rendu haute résolution → moyenne.
  const hi = new Uint8ClampedArray(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      let bg;
      if (gradient) {
        const d = Math.hypot(x - S / 2, y - S / 2) / maxR;
        const [r, g, b] = lerp(NIGHT_LIGHT, NIGHT, Math.min(1, d * 1.05));
        bg = [r, g, b, 255];
      } else {
        bg = [0, 0, 0, 0];
      }
      const dBig = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const dCut = Math.hypot(x + 0.5 - cutCx, y + 0.5 - cutCy);
      const inCrescent = dBig <= Rb && dCut > cutR;
      let px = bg;
      if (inCrescent) {
        // léger dégradé doré (reflet en haut-gauche).
        const t = Math.min(1, Math.max(0, (y - (cy - Rb)) / (2 * Rb)));
        const [r, g, b] = lerp(GOLD_HI, GOLD, t);
        px = [r, g, b, 255];
      }
      hi[i] = px[0];
      hi[i + 1] = px[1];
      hi[i + 2] = px[2];
      hi[i + 3] = px[3];
    }
  }
  // Downsample SS×SS.
  const out = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < SS; dy++) {
        for (let dx = 0; dx < SS; dx++) {
          const j = ((y * SS + dy) * S + (x * SS + dx)) * 4;
          const al = hi[j + 3];
          r += hi[j] * al;
          g += hi[j + 1] * al;
          b += hi[j + 2] * al;
          a += al;
        }
      }
      const o = (y * size + x) * 4;
      const n = SS * SS;
      out[o] = a ? r / a : 0;
      out[o + 1] = a ? g / a : 0;
      out[o + 2] = a ? b / a : 0;
      out[o + 3] = a / n;
    }
  }
  return out;
}

const outDir = path.join(__dirname, '..', 'assets', 'images');
const jobs = [
  ['icon.png', 1024, { gradient: true, scale: 0.62 }],
  ['adaptive-icon.png', 1024, { gradient: false, scale: 0.5 }],
  ['splash.png', 1024, { gradient: false, scale: 0.42 }],
  ['favicon.png', 64, { gradient: true, scale: 0.62 }],
];
for (const [name, size, opts] of jobs) {
  const rgba = render(size, opts);
  fs.writeFileSync(path.join(outDir, name), toPng(size, rgba));
  console.log('écrit', name, size + 'px');
}
