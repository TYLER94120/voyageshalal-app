// ─────────────────────────────────────────────────────────────────────────────
// « L'hôtel le mieux placé » — cœur stratégique de l'app.
//
// Pour un voyageur musulman, un bon hôtel = proche d'une mosquée ET entouré de
// restaurants halal. On calcule, pour chaque hôtel géolocalisé :
//   • la distance à la mosquée la plus proche,
//   • le nombre de restaurants halal à distance de marche (rayon paramétrable),
// puis un score composite qui privilégie fortement la proximité d'une mosquée.
//
// Fonctions pures (pas de réseau) → testables.
// ─────────────────────────────────────────────────────────────────────────────

import type { Lieu } from './api';
import { distanceKm } from './geo';

export interface HotelLocationStats {
  nearestMosqueKm: number | null;
  nearestMosqueNom?: string;
  restosNear: number; // restaurants halal dans le rayon
  radiusKm: number;
  score: number | null; // null si l'hôtel n'a pas de coordonnées
}

// Un hôtel à 0 km d'une mosquée gagne +10 ; le bonus s'annule au-delà de 2 km.
const MOSQUE_BONUS_RANGE_KM = 2;
const MOSQUE_BONUS_WEIGHT = 5;

function hasCoords(l: Lieu): boolean {
  return l.latitude != null && l.longitude != null;
}

/** Statistiques d'emplacement d'un hôtel vis-à-vis des mosquées et restos de la ville. */
export function hotelLocationStats(
  hotel: Lieu,
  mosquees: Lieu[],
  restaurants: Lieu[],
  radiusKm = 1,
): HotelLocationStats {
  if (!hasCoords(hotel)) {
    return { nearestMosqueKm: null, restosNear: 0, radiusKm, score: null };
  }
  const hlat = hotel.latitude!;
  const hlng = hotel.longitude!;

  let nearestMosqueKm: number | null = null;
  let nearestMosqueNom: string | undefined;
  for (const m of mosquees) {
    if (!hasCoords(m)) continue;
    const d = distanceKm(hlat, hlng, m.latitude!, m.longitude!);
    if (nearestMosqueKm == null || d < nearestMosqueKm) {
      nearestMosqueKm = d;
      nearestMosqueNom = m.nom;
    }
  }

  let restosNear = 0;
  for (const r of restaurants) {
    if (!hasCoords(r)) continue;
    if (distanceKm(hlat, hlng, r.latitude!, r.longitude!) <= radiusKm) restosNear++;
  }

  const mosqueBonus =
    nearestMosqueKm == null
      ? 0
      : Math.max(0, MOSQUE_BONUS_RANGE_KM - nearestMosqueKm) * MOSQUE_BONUS_WEIGHT;
  const score = restosNear + mosqueBonus;

  return { nearestMosqueKm, nearestMosqueNom, restosNear, radiusKm, score };
}

// ─── Déduplication d'hôtels ──────────────────────────────────────────────────
// La densification back ajoute des hôtels OSM par-dessus les hôtels curés : un
// même établissement peut apparaître deux fois. On déduplique de façon PRUDENTE
// (même nom normalisé ET coords quasi identiques) pour ne jamais fusionner deux
// hôtels réellement distincts. L'entrée curée (en premier) est conservée.

const DEDUPE_METERS = 70;
const GENERIC_WORDS = new Set([
  'hotel', 'hôtel', 'the', 'le', 'la', 'les', 'inn', 'resort', 'spa', 'ryokan',
  'auberge', 'hostel', 'guesthouse', 'palace', 'suites', 'suite', 'apartments',
  'apartment', 'appartement',
]);

function normalizeHotelName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w.length > 0 && !GENERIC_WORDS.has(w))
    .join(' ')
    .trim();
}

function namesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  return shorter.length >= 4 && longer.includes(shorter);
}

/** Supprime les doublons d'hôtels (même nom + coords ~identiques), curés gardés. */
export function dedupeHotels(hotels: Lieu[], meters = DEDUPE_METERS): Lieu[] {
  const out: Lieu[] = [];
  const norms: string[] = [];
  for (const h of hotels) {
    const hn = normalizeHotelName(h.nom);
    const isDup =
      hasCoords(h) &&
      out.some((o, i) => {
        if (!hasCoords(o) || !namesMatch(hn, norms[i])) return false;
        return distanceKm(o.latitude!, o.longitude!, h.latitude!, h.longitude!) * 1000 <= meters;
      });
    if (!isDup) {
      out.push(h);
      norms.push(hn);
    }
  }
  return out;
}

export interface NearbyLieu {
  lieu: Lieu;
  distKm: number;
}

/** Lieux géolocalisés dans un rayon autour d'un point, triés du plus proche au plus loin. */
export function nearbyLieux(
  lat: number,
  lng: number,
  list: Lieu[],
  radiusKm: number,
  limit?: number,
): NearbyLieu[] {
  const out: NearbyLieu[] = [];
  for (const l of list) {
    if (!hasCoords(l)) continue;
    const d = distanceKm(lat, lng, l.latitude!, l.longitude!);
    if (d <= radiusKm) out.push({ lieu: l, distKm: d });
  }
  out.sort((a, b) => a.distKm - b.distKm);
  return limit != null ? out.slice(0, limit) : out;
}
