// ─────────────────────────────────────────────────────────────────────────────
// Recherche de mosquées proches via l'API Overpass (OpenStreetMap).
//
// Optimisé pour la vitesse :
//  - requête allégée (node + way, pas de relation ; timeout serveur court)
//  - COURSE entre plusieurs miroirs : le premier qui répond gagne (Promise.any)
//  - cache mémoire (re-ouverture / changement d'onglet instantané)
// La requête et le parsing sont séparés du réseau pour rester testables.
// ─────────────────────────────────────────────────────────────────────────────

export interface OsmPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

// Plusieurs miroirs Overpass interrogés EN PARALLÈLE (le plus rapide gagne).
const ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const PER_REQUEST_TIMEOUT_MS = 12000;
const CACHE_TTL_MS = 15 * 60 * 1000;

/** Requête Overpass QL : lieux de culte musulmans dans un rayon (mètres). */
export function buildMosqueQuery(latitude: number, longitude: number, radius: number): string {
  const around = `(around:${Math.round(radius)},${latitude},${longitude})`;
  // timeout serveur court + node/way uniquement (les relations sont rares et lentes).
  return `[out:json][timeout:15];
(
  node["amenity"="place_of_worship"]["religion"="muslim"]${around};
  way["amenity"="place_of_worship"]["religion"="muslim"]${around};
);
out center;`;
}

type RawElement = {
  type?: string;
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

/** Transforme la réponse Overpass en lieux normalisés (tolérant). */
export function parseOverpass(payload: unknown): OsmPlace[] {
  const obj = (payload && typeof payload === 'object' ? payload : {}) as { elements?: unknown };
  const elements = Array.isArray(obj.elements) ? (obj.elements as RawElement[]) : [];
  const places: OsmPlace[] = [];
  for (const el of elements) {
    const lat = typeof el.lat === 'number' ? el.lat : el.center?.lat;
    const lon = typeof el.lon === 'number' ? el.lon : el.center?.lon;
    if (typeof lat !== 'number' || typeof lon !== 'number') continue;
    const tags = el.tags ?? {};
    const name = tags.name || tags['name:fr'] || tags['name:ar'] || 'Mosquée';
    places.push({
      id: `${el.type ?? 'node'}/${el.id ?? `${lat},${lon}`}`,
      name,
      latitude: lat,
      longitude: lon,
    });
  }
  return places;
}

async function postOverpass(endpoint: string, query: string): Promise<OsmPlace[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PER_REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Overpass ${res.status}`);
    return parseOverpass(await res.json());
  } finally {
    clearTimeout(timer);
  }
}

// ── Cache mémoire ──
const cache = new Map<string, { at: number; places: OsmPlace[] }>();
function cacheKey(lat: number, lng: number, radius: number): string {
  // ~1 km de granularité : les re-recherches proches réutilisent le cache.
  return `${lat.toFixed(2)},${lng.toFixed(2)},${radius}`;
}

/** Mosquées proches (course entre miroirs + cache). */
export async function fetchNearbyMosques(
  latitude: number,
  longitude: number,
  radius = 5000,
): Promise<OsmPlace[]> {
  const key = cacheKey(latitude, longitude, radius);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.places;

  const query = buildMosqueQuery(latitude, longitude, radius);
  const attempts = ENDPOINTS.map((ep) => postOverpass(ep, query));
  let places: OsmPlace[];
  try {
    places = await Promise.any(attempts); // premier miroir qui répond
  } catch {
    throw new Error('Overpass injoignable');
  }
  cache.set(key, { at: Date.now(), places });
  return places;
}
