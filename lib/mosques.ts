// ─────────────────────────────────────────────────────────────────────────────
// Fusion des mosquées « principales » de l'API avec les mosquées exhaustives
// d'OpenStreetMap (Overpass).
//
// L'API ne liste que les mosquées principales d'une ville ; OSM les recense
// (presque) toutes, y compris les petites salles de prière de quartier. Pour que
// le score « hôtel bien situé » et la fiche ville soient FIABLES, on raisonne sur
// la liste exhaustive — tout en gardant les fiches curées de l'API (noms soignés)
// quand un même lieu existe des deux côtés.
//
// Fonctions pures → testables sans réseau.
// ─────────────────────────────────────────────────────────────────────────────

import type { Lieu } from './api';
import type { OsmPlace } from './overpass';

const DEFAULT_DEDUPE_METERS = 140;

/** Convertit un résultat OpenStreetMap en Lieu minimal. */
export function osmToLieu(p: OsmPlace): Lieu {
  return { id: `osm-${p.id}`, nom: p.name, latitude: p.latitude, longitude: p.longitude };
}

/**
 * Fusionne mosquées API (prioritaires) + OSM, en supprimant les doublons
 * géographiques (deux entrées à moins de `dedupeMeters` = même mosquée).
 */
export function mergeMosquees(
  api: Lieu[],
  osm: Lieu[],
  dedupeMeters = DEFAULT_DEDUPE_METERS,
): Lieu[] {
  const result: Lieu[] = [];
  // Déduplication par grille spatiale → O(n) (au lieu de O(n²)). La taille de
  // cellule ≈ dedupeMeters : deux mosquées dans la même cellule = la même.
  const cell = Math.max(0.0005, dedupeMeters / 111000); // mètres → degrés (~111 km/°)
  const seen = new Set<string>();
  // API d'abord : en cas de doublon, on conserve la fiche curée (mieux nommée).
  for (const m of [...api, ...osm]) {
    if (m.latitude == null || m.longitude == null) {
      result.push(m);
      continue;
    }
    const key = `${Math.round(m.latitude / cell)},${Math.round(m.longitude / cell)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(m);
  }
  return result;
}
