// ─────────────────────────────────────────────────────────────────────────────
// Couche d'accès à l'API publique VoyagesHalal.
//
//   GET /api/villes          → liste des villes
//   GET /api/villes/{slug}   → détail complet d'une ville
//
// Le schéma exact des champs n'étant pas figé côté web, le parsing est
// volontairement tolérant : on accepte plusieurs noms de champs possibles
// (nom/name, region/pays, image/imageUrl…) et on ignore ce qu'on ne connaît
// pas. L'app reste fonctionnelle même si le back enrichit ses réponses.
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE = 'https://www.voyageshalal.fr/api';

// ─── Types normalisés exposés à l'app ────────────────────────────────────────

export interface VilleSummary {
  slug: string;
  nom: string;
  region?: string;
  pays?: string;
  description?: string;
  image?: string;
  latitude?: number;
  longitude?: number;
}

export type LieuCategorie =
  | 'restaurants'
  | 'mosquees'
  | 'hotels'
  | 'activites';

export interface Lieu {
  id: string;
  nom: string;
  adresse?: string;
  description?: string;
  image?: string;
  note?: number;
  latitude?: number;
  longitude?: number;
  telephone?: string;
  site?: string;
}

export interface VilleDetail extends VilleSummary {
  restaurants: Lieu[];
  mosquees: Lieu[];
  hotels: Lieu[];
  activites: Lieu[];
  pratique?: string; // infos pratiques (texte libre / markdown léger)
}

// ─── Helpers de lecture tolérante ────────────────────────────────────────────

type Raw = Record<string, unknown>;

function asRecord(v: unknown): Raw {
  return v && typeof v === 'object' ? (v as Raw) : {};
}

function pickString(obj: Raw, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return undefined;
}

function pickNumber(obj: Raw, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) {
      return Number(v);
    }
  }
  return undefined;
}

function pickArray(obj: Raw, ...keys: string[]): Raw[] {
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) return v.map(asRecord);
  }
  return [];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Normalisation ───────────────────────────────────────────────────────────

function normalizeVilleSummary(raw: Raw): VilleSummary | null {
  const nom = pickString(raw, 'nom', 'name', 'ville', 'title', 'label');
  if (!nom) return null;
  const slug = pickString(raw, 'slug', 'id', 'identifier') ?? slugify(nom);
  return {
    slug,
    nom,
    region: pickString(raw, 'region', 'région', 'departement', 'département'),
    pays: pickString(raw, 'pays', 'country'),
    description: pickString(raw, 'description', 'resume', 'résumé', 'intro', 'excerpt'),
    image: pickString(raw, 'image', 'imageUrl', 'image_url', 'photo', 'cover', 'thumbnail'),
    latitude: pickNumber(raw, 'latitude', 'lat'),
    longitude: pickNumber(raw, 'longitude', 'lng', 'lon', 'long'),
  };
}

function normalizeLieu(raw: Raw, idx: number, prefix: string): Lieu {
  const nom = pickString(raw, 'nom', 'name', 'title', 'label') ?? 'Lieu';
  const slug = pickString(raw, 'slug', 'id') ?? `${prefix}-${idx}`;
  return {
    id: String(slug),
    nom,
    adresse: pickString(raw, 'adresse', 'address', 'lieu', 'localisation'),
    description: pickString(raw, 'description', 'resume', 'résumé', 'excerpt'),
    image: pickString(raw, 'image', 'imageUrl', 'image_url', 'photo', 'thumbnail'),
    note: pickNumber(raw, 'note', 'rating', 'stars', 'score'),
    latitude: pickNumber(raw, 'latitude', 'lat'),
    longitude: pickNumber(raw, 'longitude', 'lng', 'lon', 'long'),
    telephone: pickString(raw, 'telephone', 'téléphone', 'phone', 'tel'),
    site: pickString(raw, 'site', 'website', 'url', 'lien'),
  };
}

function normalizeLieux(obj: Raw, idxBase: string, ...keys: string[]): Lieu[] {
  return pickArray(obj, ...keys).map((r, i) => normalizeLieu(r, i, idxBase));
}

function normalizeVilleDetail(raw: Raw): VilleDetail | null {
  const base = normalizeVilleSummary(raw);
  if (!base) return null;
  return {
    ...base,
    restaurants: normalizeLieux(raw, 'resto', 'restaurants', 'restos', 'restauration'),
    mosquees: normalizeLieux(raw, 'mosq', 'mosquees', 'mosquées', 'mosques', 'lieuxDePriere'),
    hotels: normalizeLieux(raw, 'hotel', 'hotels', 'hôtels', 'hebergements', 'hébergements', 'logements'),
    activites: normalizeLieux(raw, 'act', 'activites', 'activités', 'aFaire', 'activities', 'visites'),
    pratique: pickString(raw, 'pratique', 'infosPratiques', 'infos_pratiques', 'practical', 'transport'),
  };
}

// ─── Accès réseau ────────────────────────────────────────────────────────────

const TIMEOUT_MS = 15000;

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Réponse ${res.status} pour ${url}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Le back peut renvoyer soit un tableau brut, soit { villes: [...] } / { data: [...] }.
function extractList(payload: unknown): Raw[] {
  if (Array.isArray(payload)) return payload.map(asRecord);
  const obj = asRecord(payload);
  for (const key of ['villes', 'data', 'results', 'items']) {
    const v = obj[key];
    if (Array.isArray(v)) return v.map(asRecord);
  }
  return [];
}

function extractDetail(payload: unknown): Raw {
  const obj = asRecord(payload);
  for (const key of ['ville', 'data', 'result']) {
    const v = obj[key];
    if (v && typeof v === 'object' && !Array.isArray(v)) return asRecord(v);
  }
  return obj;
}

// ─── API publique ────────────────────────────────────────────────────────────

export async function getVilles(): Promise<VilleSummary[]> {
  const payload = await fetchJson(`${API_BASE}/villes`);
  return extractList(payload)
    .map(normalizeVilleSummary)
    .filter((v): v is VilleSummary => v !== null)
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

export async function getVille(slug: string): Promise<VilleDetail> {
  const payload = await fetchJson(`${API_BASE}/villes/${encodeURIComponent(slug)}`);
  const detail = normalizeVilleDetail(extractDetail(payload));
  if (!detail) {
    throw new Error(`Ville introuvable : ${slug}`);
  }
  return detail;
}
