// Mesure le taux de remplissage des liens de réservation (revenu n°1 du plan)
// sur les hôtels de toutes les villes de l'API. À lancer depuis TON ordi
// (l'API voyageshalal.fr est joignable de là) :
//
//   node scripts/audit-booking-links.cjs           # toutes les villes
//   node scripts/audit-booking-links.cjs 40         # échantillon de 40 villes
//
// N'écrit rien, ne modifie rien : lecture seule + rapport dans le terminal.

const API_BASE = 'https://www.voyageshalal.fr/api';
const SAMPLE = Number(process.argv[2]) || null; // nb de villes à échantillonner
const CONCURRENCY = 8;

// Mêmes clés que le parseur de l'app (lib/api.ts) → mesure fidèle.
const HOTEL_KEYS = ['hotels', 'hôtels', 'hebergements', 'hébergements', 'logements'];
const HALAL_BOOK_KEYS = ['halalBookingUrl', 'halal_booking_url', 'halalbooking'];
const BOOK_KEYS = ['bookingUrl', 'booking_url', 'booking'];

const firstStr = (obj, keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
};
const firstArr = (obj, keys) => {
  for (const k of keys) if (Array.isArray(obj?.[k])) return obj[k];
  return [];
};

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function mapLimit(items, limit, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        out[idx] = await fn(items[idx], idx);
      } catch (e) {
        out[idx] = { error: e.message };
      }
    }
  });
  await Promise.all(workers);
  return out;
}

(async () => {
  console.log('→ Récupération de la liste des villes…');
  const vpayload = await getJson(`${API_BASE}/villes`);
  let villes = Array.isArray(vpayload)
    ? vpayload
    : vpayload.villes || vpayload.data || vpayload.cities || vpayload.items || [];
  villes = villes.filter((v) => v && (v.slug || v.id));
  if (SAMPLE) villes = villes.slice(0, SAMPLE);
  console.log(`  ${villes.length} villes à analyser (concurrence ${CONCURRENCY})\n`);

  let totalHotels = 0;
  let withHalal = 0;
  let withBooking = 0;
  let withEither = 0;
  let citiesWithHotels = 0;
  let citiesZeroLink = [];
  let done = 0;

  await mapLimit(villes, CONCURRENCY, async (v) => {
    const slug = v.slug || v.id;
    const payload = await getJson(`${API_BASE}/villes/${encodeURIComponent(slug)}`);
    const detail = payload.ville || payload.data || payload;
    const hotels = firstArr(detail, HOTEL_KEYS);
    if (hotels.length) citiesWithHotels++;
    let cityLinks = 0;
    for (const h of hotels) {
      totalHotels++;
      const hb = firstStr(h, HALAL_BOOK_KEYS);
      const bk = firstStr(h, BOOK_KEYS);
      if (hb) withHalal++;
      if (bk) withBooking++;
      if (hb || bk) {
        withEither++;
        cityLinks++;
      }
    }
    if (hotels.length > 0 && cityLinks === 0) citiesZeroLink.push(`${v.nom || slug} (${hotels.length})`);
    done++;
    if (done % 25 === 0) process.stdout.write(`  …${done}/${villes.length} villes\n`);
  });

  const pct = (n) => (totalHotels ? ((100 * n) / totalHotels).toFixed(1) : '0') + '%';
  console.log('\n════════ TAUX DE REMPLISSAGE — LIENS DE RÉSERVATION ════════');
  console.log(`Villes analysées         : ${villes.length}  (dont ${citiesWithHotels} avec ≥1 hôtel)`);
  console.log(`Hôtels au total          : ${totalHotels}`);
  console.log(`  • lien HalalBooking     : ${withHalal}  (${pct(withHalal)})   ← revenu n°1`);
  console.log(`  • lien Booking.com      : ${withBooking}  (${pct(withBooking)})`);
  console.log(`  • au moins un lien      : ${withEither}  (${pct(withEither)})`);
  console.log(`  • AUCUN lien (perdu)    : ${totalHotels - withEither}  (${pct(totalHotels - withEither)})`);
  if (citiesZeroLink.length) {
    console.log(`\nVilles avec hôtels mais 0 lien (${citiesZeroLink.length}) — ex. :`);
    console.log('  ' + citiesZeroLink.slice(0, 15).join(', ') + (citiesZeroLink.length > 15 ? ' …' : ''));
  }
  console.log('════════════════════════════════════════════════════════════');
})().catch((e) => {
  console.error('ÉCHEC :', e.message);
  process.exit(1);
});
