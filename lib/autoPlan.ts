// ─────────────────────────────────────────────────────────────────────────────
// Suggestion d'une « journée type » halal-friendly à partir des données réelles
// d'une ville : 1 bon hôtel bien situé + restos variés + activités variées.
// Déterministe, pur, testable, hors-ligne. Lecture seule (pas de planificateur
// éditable) : c'est une INSPIRATION, pas un outil de gestion.
// ─────────────────────────────────────────────────────────────────────────────

import type { Lieu, VilleDetail } from './api';
import { hotelLocationStats } from './hotelLocation';

export type PlanItemType = 'hotel' | 'restaurant' | 'activite';

export interface PlanItem {
  id: string;
  type: PlanItemType;
  title: string;
  subtitle?: string;
  emoji: string;
  mapsUrl?: string;
  latitude?: number;
  longitude?: number;
  day: number; // 1-based (utile si on suggère plusieurs jours)
}

function isCertified(l: Lieu): boolean {
  const c = l.halalConfidence?.toLowerCase();
  return c === 'only' || c === 'yes' || c === 'certified' || c === 'certifie';
}

function toItem(l: Lieu, type: PlanItemType, emoji: string, day: number): PlanItem {
  return {
    id: `${type}:${l.id}`,
    type,
    title: l.nom,
    subtitle: l.category,
    emoji,
    mapsUrl: l.mapsUrl,
    latitude: l.latitude,
    longitude: l.longitude,
    day,
  };
}

/**
 * Sélectionne `n` lieux dans une liste DÉJÀ triée du meilleur au moins bon, en
 * privilégiant la variété : on prend d'abord le meilleur de chaque catégorie,
 * puis on complète. Évite « 5 fois le même type de cuisine ».
 */
export function pickVaried<T>(sorted: T[], n: number, keyOf: (t: T) => string): T[] {
  const out: T[] = [];
  const taken = new Set<number>();
  const seen = new Set<string>();
  for (let i = 0; i < sorted.length && out.length < n; i++) {
    const k = keyOf(sorted[i]);
    if (!seen.has(k)) {
      seen.add(k);
      taken.add(i);
      out.push(sorted[i]);
    }
  }
  for (let i = 0; i < sorted.length && out.length < n; i++) {
    if (!taken.has(i)) out.push(sorted[i]);
  }
  return out;
}

function restoRank(ville: VilleDetail): Lieu[] {
  const curated = new Set<string>();
  ville.selections.forEach((s) => s.names.forEach((nm) => curated.add(nm.trim().toLowerCase())));
  const score = (r: Lieu): number => {
    let s = (r.note ?? 0) * 2;
    if (isCertified(r)) s += 5;
    if (curated.has(r.nom.trim().toLowerCase())) s += 4;
    if ((r.reviewCount ?? 0) > 200) s += 1;
    return s;
  };
  return [...ville.restaurants].sort((a, b) => score(b) - score(a));
}

export interface PlanResult {
  hotel?: PlanItem;
  restaurants: PlanItem[];
  activites: PlanItem[];
  items: PlanItem[];
}

/** Construit une suggestion équilibrée sur `days` jours (par défaut une journée). */
export function autoPlanTrip(ville: VilleDetail, days = 1): PlanResult {
  const D = Math.min(Math.max(1, days), 14);

  const hotels = [...ville.hotels].sort((a, b) => {
    const sa = hotelLocationStats(a, ville.mosquees, ville.restaurants, 1).score ?? -1;
    const sb = hotelLocationStats(b, ville.mosquees, ville.restaurants, 1).score ?? -1;
    return sb - sa || (b.note ?? 0) - (a.note ?? 0);
  });
  const hotel = hotels[0] ? toItem(hotels[0], 'hotel', '🏨', 1) : undefined;

  const restos = pickVaried(restoRank(ville), D * 2, (r) => r.category ?? r.id).map((r, i) =>
    toItem(r, 'restaurant', '🍽️', (i % D) + 1),
  );

  const actsSorted = [...ville.activites].sort((a, b) => (b.note ?? 0) - (a.note ?? 0));
  const activites = pickVaried(actsSorted, D * 2, (a) => a.category ?? a.id).map((a, i) =>
    toItem(a, 'activite', '🗺️', (i % D) + 1),
  );

  return {
    hotel,
    restaurants: restos,
    activites,
    items: [...(hotel ? [hotel] : []), ...restos, ...activites],
  };
}
