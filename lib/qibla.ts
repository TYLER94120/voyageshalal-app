// ─────────────────────────────────────────────────────────────────────────────
// Calculs Qibla : direction (cap depuis le nord vrai) et distance vers la Kaaba.
// La direction provient d'adhan (orthodromie). Le cap appareil utilisé à l'écran
// est le `trueHeading` d'expo-location, déjà corrigé de la déclinaison magnétique
// par le modèle géomagnétique de l'OS.
// ─────────────────────────────────────────────────────────────────────────────

import { Coordinates, Qibla } from 'adhan';

export const KAABA = { latitude: 21.4225, longitude: 39.8262 };
const EARTH_RADIUS_KM = 6371;

/** Direction de la Qibla en degrés depuis le nord vrai (sens horaire), [0,360). */
export function qiblaBearing(latitude: number, longitude: number): number {
  return norm360(Qibla(new Coordinates(latitude, longitude)));
}

/** Distance orthodromique jusqu'à la Kaaba, en kilomètres. */
export function distanceToKaabaKm(latitude: number, longitude: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(KAABA.latitude - latitude);
  const dLng = toRad(KAABA.longitude - longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latitude)) * Math.cos(toRad(KAABA.latitude)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Ramène un angle dans [0, 360). */
export function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Plus petit écart signé `a - b`, dans (-180, 180]. */
export function angleDelta(a: number, b: number): number {
  let d = norm360(a - b);
  if (d > 180) d -= 360;
  return d;
}

/**
 * Lissage circulaire du cap (EMA le long du plus court arc) pour limiter la
 * gigue du magnétomètre. `prev` null → on prend `next` tel quel.
 */
export function smoothHeading(prev: number | null, next: number, alpha = 0.18): number {
  if (prev === null || Number.isNaN(prev)) return norm360(next);
  return norm360(prev + alpha * angleDelta(next, prev));
}

/** Écart absolu (0..180) entre le cap appareil et la Qibla. */
export function qiblaOffset(heading: number, bearing: number): number {
  return Math.abs(angleDelta(bearing, heading));
}

/** Consigne de rotation lisible : « Tournez à droite de 34° » / « Aligné ». */
export function turnGuidance(heading: number, bearing: number, tolerance = 5): string {
  const signed = angleDelta(bearing, heading); // >0 → tourner à droite
  if (Math.abs(signed) <= tolerance) return 'Aligné avec la Qibla';
  const dir = signed > 0 ? 'droite' : 'gauche';
  return `Tournez à ${dir} de ${Math.round(Math.abs(signed))}°`;
}
