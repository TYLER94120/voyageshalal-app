// ─────────────────────────────────────────────────────────────────────────────
// Filtre hôtels « façon Booking, mais halal & bien situé ».
//
// Groupes : Budget (bandes €), Emplacement (proximité mosquée / restos halal),
// Type (category), Équipements halal. Tout est data-driven et GRACEFUL : un
// groupe/chip n'existe que si au moins un hôtel porte la donnée → aucune option
// vide tant que les données ne sont pas remplies. Fonctions pures → testables.
//
// Doit rester aligné avec le web (docs/BRIEF-FILTRE-HOTELS.md).
// ─────────────────────────────────────────────────────────────────────────────

import type { Lieu } from './api';

/** Hôtel enrichi de ses stats d'emplacement (proximité mosquée + restos). */
export type HotelForFilter = Lieu & {
  loc?: { nearestMosqueKm: number | null; restosNear: number };
};

// ─── Budget ────────────────────────────────────────────────────────────────

export type PriceBand = 'lt50' | 'b50_100' | 'b100_200' | 'gt200';

export const PRICE_BANDS: { key: PriceBand; label: string; test: (p: number) => boolean }[] = [
  { key: 'lt50', label: '≤ 50 €', test: (p) => p < 50 },
  { key: 'b50_100', label: '50–100 €', test: (p) => p >= 50 && p < 100 },
  { key: 'b100_200', label: '100–200 €', test: (p) => p >= 100 && p < 200 },
  { key: 'gt200', label: '200 €+', test: (p) => p >= 200 },
];

/** Bande de prix d'un hôtel à partir de son prix indicatif €/nuit. null si inconnu. */
export function priceBandOf(prixNuitEur?: number | null): PriceBand | null {
  if (prixNuitEur == null || !Number.isFinite(prixNuitEur)) return null;
  return PRICE_BANDS.find((b) => b.test(prixNuitEur))?.key ?? null;
}

// ─── Équipements halal ───────────────────────────────────────────────────────

export const HOTEL_AMENITIES: { key: string; label: string; test: (l: Lieu) => boolean }[] = [
  { key: 'salleDePriere', label: '🕌 Salle de prière', test: (l) => !!l.salleDePriere },
  { key: 'sansAlcool', label: '🚫 Sans alcool', test: (l) => !!l.sansAlcool },
  { key: 'petitDejeunerHalal', label: '🍳 Petit-déj halal', test: (l) => !!l.petitDejeunerHalal },
  { key: 'piscineNonMixte', label: '🏊 Piscine non-mixte', test: (l) => !!l.piscineNonMixte },
  { key: 'qibla', label: '🧭 Qibla', test: (l) => !!l.qibla },
];

// ─── État du filtre ──────────────────────────────────────────────────────────

export interface HotelFilterState {
  bands: PriceBand[]; // OU entre bandes
  nearMosque: boolean; // ≤ 500 m d'une mosquée
  restosAround: boolean; // au moins un resto halal à proximité (< 1 km)
  types: string[]; // OU entre catégories
  amenities: string[]; // ET : l'hôtel doit porter tous les équipements choisis
}

export const EMPTY_HOTEL_FILTER: HotelFilterState = {
  bands: [],
  nearMosque: false,
  restosAround: false,
  types: [],
  amenities: [],
};

export function hasActiveHotelFilter(f: HotelFilterState): boolean {
  return (
    f.bands.length > 0 ||
    f.nearMosque ||
    f.restosAround ||
    f.types.length > 0 ||
    f.amenities.length > 0
  );
}

// ─── Facettes disponibles (graceful : seulement ce qui a de la donnée) ────────

export interface HotelFacets {
  bands: PriceBand[]; // bandes réellement présentes
  types: string[]; // catégories présentes
  amenities: string[]; // clés d'équipement présentes
  hasLocation: boolean; // au moins un hôtel avec distance mosquée connue
  hasRestos: boolean; // au moins un hôtel avec restos halal autour
}

export function hotelFacets(hotels: HotelForFilter[]): HotelFacets {
  const bands = new Set<PriceBand>();
  const types = new Set<string>();
  const amenities = new Set<string>();
  let hasLocation = false;
  let hasRestos = false;
  for (const h of hotels) {
    const band = priceBandOf(h.prixNuitEur);
    if (band) bands.add(band);
    if (h.category) types.add(h.category);
    for (const a of HOTEL_AMENITIES) if (a.test(h)) amenities.add(a.key);
    if (h.loc?.nearestMosqueKm != null) hasLocation = true;
    if ((h.loc?.restosNear ?? 0) > 0) hasRestos = true;
  }
  return {
    bands: PRICE_BANDS.filter((b) => bands.has(b.key)).map((b) => b.key),
    types: Array.from(types).sort((a, b) => a.localeCompare(b, 'fr')),
    amenities: HOTEL_AMENITIES.filter((a) => amenities.has(a.key)).map((a) => a.key),
    hasLocation,
    hasRestos,
  };
}

// ─── Application du filtre (pure : ne mute pas l'entrée) ──────────────────────

export function applyHotelFilter<T extends HotelForFilter>(
  hotels: T[],
  f: HotelFilterState,
): T[] {
  return hotels.filter((h) => {
    if (f.bands.length > 0) {
      const band = priceBandOf(h.prixNuitEur);
      if (!band || !f.bands.includes(band)) return false;
    }
    if (f.nearMosque && !(h.loc?.nearestMosqueKm != null && h.loc.nearestMosqueKm <= 0.5)) {
      return false;
    }
    if (f.restosAround && !((h.loc?.restosNear ?? 0) > 0)) return false;
    if (f.types.length > 0 && !(h.category && f.types.includes(h.category))) return false;
    if (f.amenities.length > 0) {
      const ok = f.amenities.every((key) => {
        const a = HOTEL_AMENITIES.find((x) => x.key === key);
        return a ? a.test(h) : true;
      });
      if (!ok) return false;
    }
    return true;
  });
}
