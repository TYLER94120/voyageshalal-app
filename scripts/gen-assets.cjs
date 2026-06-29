// Génère des images de marque (croissant or sur fond nuit) pour qu'Expo démarre.
// Pur Node (zlib), sans dépendance. À relancer si on change la palette.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const NIGHT = [11, 26, 15, 255];
const GOLD = [201, 168, 76, 255];
const TRANSP = [0, 0, 0, 0];

// CRC32 (PNG)
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

function crescent(size, bg, scale) {
  const cx = size / 2;
  const cy = size / 2;
  const Rb = (size / 2) * scale;
  const cutR = Rb * 0.86;
  const cutCx = cx + Rb * 0.34;
  const cutCy = cy - Rb * 0.12;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filtre 0
    for (let x = 0; x < size; x++) {
      const dBig = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const dCut = Math.hypot(x + 0.5 - cutCx, y + 0.5 - cutCy);
      const px = dBig <= Rb && dCut > cutR ? GOLD : bg;
      raw[p++] = px[0];
      raw[p++] = px[1];
      raw[p++] = px[2];
      raw[p++] = px[3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return png;
}

const outDir = path.join(__dirname, '..', 'assets', 'images');
const files = [
  ['icon.png', 1024, NIGHT, 0.62],
  ['adaptive-icon.png', 1024, TRANSP, 0.55],
  ['splash.png', 1024, TRANSP, 0.4],
  ['favicon.png', 64, NIGHT, 0.62],
];
for (const [name, size, bg, scale] of files) {
  fs.writeFileSync(path.join(outDir, name), crescent(size, bg, scale));
  console.log('écrit', name, size + 'px');
}
