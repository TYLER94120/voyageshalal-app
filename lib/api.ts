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
  continent?: string;
  description?: string;
  image?: string;
  scoreHalal?: number; // note halal sur 5
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
  mapsUrl?: string; // lien Google Maps fourni par la base (recherche par nom)
  category?: string; // type de cuisine / catégorie d'hôtel
  price?: string; // gamme de prix (€, €€…) ou "Gratuit" pour une activité
  halalConfidence?: string; // 'only' | 'yes' (certifié) | 'likely' (à vérifier)
  reviewCount?: number; // nombre d'avis (popularité)
  tags?: string[]; // ambiance : familial, romantique, calme, animé, livraison…
  specialite?: string; // plat signature (restaurants)
  duree?: string; // durée conseillée (activités, ex. "2h")
  // ── Spécifique hôtels ──
  bookingUrl?: string;
  halalBookingUrl?: string;
  sansAlcool?: boolean;
  salleDePriere?: boolean;
  qibla?: boolean;
  petitDejeunerHalal?: boolean;
  piscineNonMixte?: boolean;
  halalFriendly?: boolean;
  services?: string[];
}

/** Niveau de confiance halal → badge à afficher (vert certifié / ambre à vérifier). */
export function halalBadge(conf?: string): { label: string; tone: 'green' | 'amber' } | null {
  if (!conf) return null;
  const c = conf.toLowerCase();
  if (c === 'only' || c === 'yes' || c === 'certified' || c === 'certifie') {
    return { label: '✓ Halal', tone: 'green' };
  }
  if (c === 'likely' || c === 'maybe' || c === 'probable') {
    return { label: '≈ à vérifier', tone: 'amber' };
  }
  return null;
}

/**
 * Score halal officiel pour l'affichage : la donnée source est sur 5
 * (`score_halal`), on l'affiche sur **10** (× 2) comme le site web, source
 * unique de vérité. Ex. 5 → "10", 4.9 → "9.8". Pas de dénominateur ici (le
 * composant ajoute « /10 »).
 */
export function formatScore10(score: number): string {
  return (score * 2).toFixed(1).replace(/\.0$/, '');
}

export interface PratiqueItem {
  key: string;
  label: string;
  icon: string;
  value: string;
}

export interface VilleSelection {
  key: string;
  label: string;
  icon: string;
  names: string[]; // noms de lieux (restaurants) à mettre en avant
}

export interface VilleDetail extends VilleSummary {
  restaurants: Lieu[];
  mosquees: Lieu[];
  hotels: Lieu[];
  activites: Lieu[];
  pratique?: string; // infos pratiques (texte libre / markdown léger)
  pratiqueInfos: PratiqueItem[]; // infos pratiques structurées (visa, transport…)
  selections: VilleSelection[]; // sélections premium curées (incontournables…)
}

// Sélections premium connues → libellé FR + icône, dans un ordre de pertinence.
const SELECTION_FIELDS: { keys: string[]; label: string; icon: string }[] = [
  { keys: ['incontournables'], label: 'Incontournables', icon: '⭐' },
  { keys: ['mieuxNotes', 'mieux_notes'], label: 'Mieux notés', icon: '🏆' },
  { keys: ['meilleurRapportQualitePrix', 'meilleur_rapport_qualite_prix', 'rapportQualitePrix'], label: 'Rapport qualité-prix', icon: '💰' },
  { keys: ['pepitesCachees', 'pepites_cachees'], label: 'Pépites cachées', icon: '💎' },
  { keys: ['idealFamille', 'ideal_famille'], label: 'Idéal famille', icon: '👨‍👩‍👧' },
  { keys: ['gastronomique'], label: 'Gastronomique', icon: '🍴' },
];

function normalizeSelections(raw: Raw): VilleSelection[] {
  const prem = asRecord(raw.selectionsPremium ?? raw.selections_premium ?? raw.selections);
  const out: VilleSelection[] = [];
  for (const field of SELECTION_FIELDS) {
    let names: string[] | undefined;
    for (const k of field.keys) {
      const v = prem[k] ?? raw[k];
      if (Array.isArray(v)) {
        names = v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
        break;
      }
    }
    if (names && names.length > 0) {
      out.push({ key: field.keys[0], label: field.label, icon: field.icon, names });
    }
  }
  return out;
}

// Champs pratiques connus → libellé FR + icône, dans un ordre logique de voyage.
const PRATIQUE_FIELDS: { keys: string[]; label: string; icon: string }[] = [
  { keys: ['visa'], label: 'Visa', icon: '🛂' },
  { keys: ['vaccins', 'sante', 'santé', 'vaccin'], label: 'Santé / vaccins', icon: '💉' },
  { keys: ['langue', 'langues'], label: 'Langue', icon: '🗣️' },
  { keys: ['monnaie', 'devise'], label: 'Monnaie', icon: '💱' },
  { keys: ['decalageHoraire', 'decalage_horaire', 'decalage', 'décalage', 'fuseau'], label: 'Décalage horaire', icon: '🕐' },
  { keys: ['transport', 'transports'], label: 'Transport', icon: '🚇' },
  { keys: ['priseElectrique', 'prise_electrique', 'prise', 'electricite', 'électricité'], label: 'Prises électriques', icon: '🔌' },
  { keys: ['meilleure_periode', 'meilleurePeriode', 'saison', 'climat'], label: 'Meilleure période', icon: '📅' },
  { keys: ['appel_priere', 'appelPriere', 'appel_prière'], label: 'Appel à la prière', icon: '🕌' },
  { keys: ['nourriture_halal', 'nourritureHalal', 'halal'], label: 'Nourriture halal', icon: '🍽️' },
  { keys: ['alcool', 'alcohol'], label: 'Alcool', icon: '🍷' },
  { keys: ['securite', 'sécurité', 'security'], label: 'Sécurité', icon: '🛡️' },
  { keys: ['wifi', 'internet'], label: 'Wi-Fi / Internet', icon: '📶' },
];

function normalizePratique(raw: Raw): PratiqueItem[] {
  // Les infos peuvent être dans infoPratique, infos_pratiques, ou à la racine.
  const sources = [
    asRecord(raw.infoPratique ?? raw.info_pratique),
    asRecord(raw.infosPratiques ?? raw.infos_pratiques),
    raw,
  ];
  const items: PratiqueItem[] = [];
  for (const field of PRATIQUE_FIELDS) {
    let value: string | undefined;
    for (const src of sources) {
      value = pickString(src, ...field.keys);
      if (value) break;
    }
    if (value) items.push({ key: field.keys[0], label: field.label, icon: field.icon, value });
  }
  return items;
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

function pickBool(obj: Raw, ...keys: string[]): boolean | undefined {
  for (const k of keys) {
    if (typeof obj[k] === 'boolean') return obj[k] as boolean;
  }
  return undefined;
}

function pickStringList(obj: Raw, ...keys: string[]): string[] | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  }
  return undefined;
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

// Coordonnées : à plat (latitude/longitude/lat/lng) ou imbriquées
// (coordonnees/coords/location/geo : { lat, lng }).
function pickCoords(raw: Raw): { latitude?: number; longitude?: number } {
  const nested = asRecord(raw.coordonnees ?? raw.coords ?? raw.location ?? raw.geo);
  const latitude =
    pickNumber(raw, 'latitude', 'lat') ?? pickNumber(nested, 'lat', 'latitude');
  const longitude =
    pickNumber(raw, 'longitude', 'lng', 'lon', 'long') ?? pickNumber(nested, 'lng', 'lon', 'longitude', 'long');
  return { latitude, longitude };
}

function normalizeVilleSummary(raw: Raw): VilleSummary | null {
  const nom = pickString(raw, 'nom', 'name', 'ville', 'title', 'label');
  if (!nom) return null;
  const slug = pickString(raw, 'slug', 'id', 'identifier') ?? slugify(nom);
  const { latitude, longitude } = pickCoords(raw);
  return {
    slug,
    nom,
    region: pickString(raw, 'region', 'région', 'departement', 'département'),
    pays: pickString(raw, 'pays', 'country'),
    continent: pickString(raw, 'continent'),
    description: pickString(raw, 'description', 'resume', 'résumé', 'intro', 'excerpt'),
    image: pickString(raw, 'image', 'imageUrl', 'image_url', 'photo', 'cover', 'thumbnail'),
    scoreHalal: pickNumber(raw, 'score_halal', 'scoreHalal'),
    latitude,
    longitude,
  };
}

function normalizeLieu(raw: Raw, idx: number, prefix: string): Lieu {
  const nom = pickString(raw, 'nom', 'name', 'title', 'label') ?? 'Lieu';
  const slug = pickString(raw, 'slug', 'id') ?? `${prefix}-${idx}`;
  const { latitude, longitude } = pickCoords(raw);
  return {
    id: String(slug),
    nom,
    adresse: pickString(raw, 'adresse', 'address', 'lieu', 'localisation'),
    description: pickString(raw, 'description', 'resume', 'résumé', 'excerpt'),
    image: pickString(raw, 'image', 'imageUrl', 'image_url', 'photo', 'thumbnail'),
    note: pickNumber(raw, 'note', 'rating', 'stars', 'score'),
    latitude,
    longitude,
    telephone: pickString(raw, 'telephone', 'téléphone', 'phone', 'tel'),
    site: pickString(raw, 'site', 'website', 'url', 'lien'),
    mapsUrl: pickString(raw, 'mapsUrl', 'maps_url', 'googleMaps', 'google_maps'),
    category: pickString(raw, 'type', 'categorie', 'catégorie', 'category'),
    price: pickString(raw, 'priceRange', 'price', 'prix', 'gamme_prix'),
    halalConfidence:
      pickString(raw, 'halalConfidence', 'halal_confidence') ??
      (raw.certificationHalal === true ? 'yes' : undefined),
    reviewCount: pickNumber(raw, 'nombreAvis', 'reviewCount', 'review_count', 'nbAvis', 'avis'),
    tags: pickStringList(raw, 'tags', 'ambiance', 'ambiances'),
    specialite: pickString(raw, 'specialite', 'spécialité', 'specialty', 'signature'),
    duree: pickString(raw, 'duree', 'durée', 'duration'),
    // Hôtels (tolérant à la coquille "salleDePreiere" présente dans la base).
    bookingUrl: pickString(raw, 'bookingUrl', 'booking_url', 'booking'),
    halalBookingUrl: pickString(raw, 'halalBookingUrl', 'halal_booking_url', 'halalbooking'),
    sansAlcool: pickBool(raw, 'sansAlcool', 'sans_alcool', 'noAlcohol'),
    salleDePriere: pickBool(raw, 'salleDePriere', 'salleDePreiere', 'salle_de_priere', 'prayerRoom'),
    qibla: pickBool(raw, 'qiblaIndicateur', 'qibla', 'qibla_indicateur', 'qiblaDirection'),
    petitDejeunerHalal: pickBool(raw, 'petitDejeunerHalal', 'petit_dejeuner_halal', 'halalBreakfast'),
    piscineNonMixte: pickBool(raw, 'piscineNonMixte', 'piscine_non_mixte', 'womenOnlyPool'),
    halalFriendly: pickBool(raw, 'halalFriendly', 'halal_friendly'),
    services: pickStringList(raw, 'services', 'equipements', 'amenities'),
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
    mosquees: normalizeLieux(raw, 'mosq', 'mosqueesPrincipales', 'mosquees', 'mosquées', 'mosques', 'lieuxDePriere'),
    hotels: normalizeLieux(raw, 'hotel', 'hotels', 'hôtels', 'hebergements', 'hébergements', 'logements'),
    activites: normalizeLieux(raw, 'act', 'activites', 'activités', 'aFaire', 'activities', 'visites'),
    pratique: pickString(raw, 'pratique', 'practical', 'conseils', 'description_pratique'),
    pratiqueInfos: normalizePratique(raw),
    selections: normalizeSelections(raw),
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

/** Parsing pur de la réponse /api/villes (testable). */
export function parseVillesPayload(payload: unknown): VilleSummary[] {
  return extractList(payload)
    .map(normalizeVilleSummary)
    .filter((v): v is VilleSummary => v !== null)
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

export async function getVilles(): Promise<VilleSummary[]> {
  const payload = await fetchJson(`${API_BASE}/villes`);
  return parseVillesPayload(payload);
}

/** Parsing pur de la réponse /api/villes/{slug} (testable). */
export function parseVilleDetailPayload(payload: unknown): VilleDetail | null {
  return normalizeVilleDetail(extractDetail(payload));
}

export async function getVille(slug: string): Promise<VilleDetail> {
  const payload = await fetchJson(`${API_BASE}/villes/${encodeURIComponent(slug)}`);
  const detail = parseVilleDetailPayload(payload);
  if (!detail) {
    throw new Error(`Ville introuvable : ${slug}`);
  }
  return detail;
}
