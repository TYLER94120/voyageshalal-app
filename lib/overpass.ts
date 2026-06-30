// ─────────────────────────────────────────────────────────────────────────────
// Recherche de mosquées proches via l'API Overpass (OpenStreetMap).
// Données réelles, gratuites, mondiales. La requête et le parsing sont séparés
// de l'accès réseau pour rester testables.
// ─────────────────────────────────────────────────────────────────────────────

export interface OsmPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

// Plusieurs miroirs Overpass : on bascule au suivant en cas d'échec.
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const TIMEOUT_MS = 20000;

/** Requête Overpass QL : lieux de culte musulmans dans un rayon (mètres). */
export function buildMosqueQuery(latitude: number, longitude: number, radius: number): string {
  const around = `(around:${Math.round(radius)},${latitude},${longitude})`;
  return `[out:json][timeout:25];
(
  node["amenity"="place_of_worship"]["religion"="muslim"]${around};
  way["amenity"="place_of_worship"]["religion"="muslim"]${around};
  relation["amenity"="place_of_worship"]["religion"="muslim"]${around};
);
out center tags;`;
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

async function postOverpass(endpoint: string, query: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Overpass ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Mosquées proches, triées par ordre d'apparition (distance calculée côté UI). */
export async function fetchNearbyMosques(
  latitude: number,
  longitude: number,
  radius = 6000,
): Promise<OsmPlace[]> {
  const query = buildMosqueQuery(latitude, longitude, radius);
  let lastError: unknown;
  for (const endpoint of ENDPOINTS) {
    try {
      const json = await postOverpass(endpoint, query);
      return parseOverpass(json);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('Overpass injoignable');
}
