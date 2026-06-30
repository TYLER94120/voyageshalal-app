// ─────────────────────────────────────────────────────────────────────────────
// Organisateur automatique de séjour : à partir des données réelles d'une ville,
// bâtit un programme équilibré jour par jour (1 hôtel bien situé + restos variés
// + activités variées). Déterministe, pur, testable, hors-ligne. Ce n'est pas un
// LLM : c'est une heuristique soignée qui privilégie le curé, le certifié halal,
// le bien noté et la variété — pour « satisfaire tout le monde ».
// ─────────────────────────────────────────────────────────────────────────────

import type { Lieu, VilleDetail } from './api';
import { hotelLocationStats } from './hotelLocation';
import { tripItemKey, type TripItem, type TripItemType } from './trips';

function isCertified(l: Lieu): boolean {
  const c = l.halalConfidence?.toLowerCase();
  return c === 'only' || c === 'yes' || c === 'certified' || c === 'certifie';
}

function toItem(l: Lieu, type: TripItemType, emoji: string, day: number): TripItem {
  return {
    id: tripItemKey(type, l.id),
    lieuId: l.id,
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
  // 1re passe : une entrée par catégorie distincte
  for (let i = 0; i < sorted.length && out.length < n; i++) {
    const k = keyOf(sorted[i]);
    if (!seen.has(k)) {
      seen.add(k);
      taken.add(i);
      out.push(sorted[i]);
    }
  }
  // 2e passe : compléter avec les meilleurs restants
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

export interface AutoPlanResult {
  items: TripItem[];
  counts: { hotels: number; restaurants: number; activites: number };
}

/** Construit un programme équilibré sur `days` jours. */
export function autoPlanTrip(ville: VilleDetail, days: number): AutoPlanResult {
  const D = Math.min(Math.max(1, days), 14);
  const items: TripItem[] = [];

  // 1 hôtel : le mieux situé (score), à défaut le mieux noté.
  const hotels = [...ville.hotels].sort((a, b) => {
    const sa = hotelLocationStats(a, ville.mosquees, ville.restaurants, 1).score ?? -1;
    const sb = hotelLocationStats(b, ville.mosquees, ville.restaurants, 1).score ?? -1;
    return sb - sa || (b.note ?? 0) - (a.note ?? 0);
  });
  if (hotels[0]) items.push(toItem(hotels[0], 'hotel', '🏨', 1));

  // ~2 restaurants/jour, variés.
  const restos = pickVaried(restoRank(ville), D * 2, (r) => r.category ?? r.id);
  restos.forEach((r, i) => items.push(toItem(r, 'restaurant', '🍽️', (i % D) + 1)));

  // ~2 activités/jour, variées par thème.
  const actsSorted = [...ville.activites].sort((a, b) => (b.note ?? 0) - (a.note ?? 0));
  const acts = pickVaried(actsSorted, D * 2, (a) => a.category ?? a.id);
  acts.forEach((a, i) => items.push(toItem(a, 'activite', '🗺️', (i % D) + 1)));

  return {
    items,
    counts: {
      hotels: hotels[0] ? 1 : 0,
      restaurants: restos.length,
      activites: acts.length,
    },
  };
}
