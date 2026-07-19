// ─────────────────────────────────────────────────────────────────────────────
// « Spots de prière partagés » — couche DISTINCTE des données vérifiées.
// L'app CONSOMME l'API partagée (type ajouté côté Web). Si l'endpoint n'existe
// pas encore, tout se dégrade proprement en liste vide (stub). Pas de soumission
// publique : seul l'admin (propriétaire) peut en ajouter, pour SEMER des spots
// pendant son road trip. On ne CERTIFIE jamais — un spot est « signalé ».
// ─────────────────────────────────────────────────────────────────────────────

import { API_BASE } from './api';

export interface SharedSpot {
  id: string;
  nom: string;
  latitude: number;
  longitude: number;
  type?: string; // clé de SPOT_TYPES (mosquee / salle / coin / autre)
  note?: string;
  photoUrl?: string;
}

// Types de lieux proposés à l'admin et affichés sur la carte.
// Vocabulaire CANONIQUE de l'API (défini côté web) — ne pas inventer d'autres clés.
export const SPOT_TYPES: { key: string; emoji: string; label: string }[] = [
  { key: 'centre_commercial', emoji: '🛍️', label: 'Centre commercial' },
  { key: 'restaurant', emoji: '🍽️', label: 'Restaurant' },
  { key: 'aeroport', emoji: '✈️', label: 'Aéroport' },
  { key: 'gare', emoji: '🚉', label: 'Gare' },
  { key: 'hotel', emoji: '🏨', label: 'Hôtel' },
  { key: 'parc', emoji: '🌳', label: 'Parc' },
  { key: 'universite', emoji: '🎓', label: 'Université' },
  { key: 'bureau', emoji: '🏢', label: 'Bureau' },
  { key: 'autre', emoji: '🤲', label: 'Autre' },
];

export function spotTypeLabel(type?: string): string {
  const t = SPOT_TYPES.find((x) => x.key === type);
  return t ? `${t.emoji} ${t.label}` : '🧎 Spot de prière';
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}
function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

/** Parseur pur, tolérant : accepte [ ... ], { spots: [...] } ou { items: [...] }. */
export function parseSpotsPayload(payload: unknown): SharedSpot[] {
  const p = payload as Record<string, unknown> | unknown[];
  const arr = Array.isArray(p)
    ? p
    : Array.isArray((p as Record<string, unknown>)?.spots)
      ? ((p as Record<string, unknown>).spots as unknown[])
      : Array.isArray((p as Record<string, unknown>)?.items)
        ? ((p as Record<string, unknown>).items as unknown[])
        : [];
  const out: SharedSpot[] = [];
  arr.forEach((raw, i) => {
    const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const coords = (o.coords ?? o.coordonnees ?? {}) as Record<string, unknown>;
    const latitude = num(o.latitude) ?? num(o.lat) ?? num(coords.lat) ?? num(coords.latitude);
    const longitude = num(o.longitude) ?? num(o.lng) ?? num(coords.lng) ?? num(coords.longitude);
    if (latitude == null || longitude == null) return;
    out.push({
      id: str(o.id) ?? str(o.slug) ?? `spot-${i}`,
      nom: str(o.nom) ?? str(o.name) ?? str(o.title) ?? 'Spot de prière',
      latitude,
      longitude,
      type: str(o.type) ?? str(o.typeLieu) ?? str(o.type_lieu) ?? str(o.category),
      note: str(o.note) ?? str(o.description) ?? str(o.commentaire),
      photoUrl: str(o.photoUrl) ?? str(o.photo) ?? str(o.image),
    });
  });
  return out;
}

/** Spots partagés autour d'une position. [] si l'endpoint n'est pas là. */
export async function getSharedSpots(lat: number, lng: number, radiusKm = 12): Promise<SharedSpot[]> {
  try {
    const res = await fetch(`${API_BASE}/spots?lat=${lat}&lng=${lng}&radius=${radiusKm}`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return [];
    return parseSpotsPayload(await res.json());
  } catch {
    return [];
  }
}

export interface NewSpot {
  latitude: number;
  longitude: number;
  type?: string; // clé de SPOT_TYPES
  note?: string;
  photoUrl?: string;
  photoBase64?: string; // photo prise sur place (le serveur peut l'ignorer tant que non géré)
}

export type AddSpotResult = 'ok' | 'forbidden' | 'error';

/** Ajout d'un spot (admin uniquement). La clé admin est validée côté serveur. */
export async function addSpot(spot: NewSpot, adminKey: string): Promise<AddSpotResult> {
  try {
    const res = await fetch(`${API_BASE}/spots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ ...spot, source: 'app-admin' }),
    });
    if (res.status === 401 || res.status === 403) return 'forbidden';
    return res.ok ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

export type SubmitSpotResult = 'ok' | 'closed' | 'error';

/**
 * Soumission d'un spot depuis le flux communautaire. Avec la clé admin si
 * débloquée ; sinon tentative publique — si le serveur exige encore la clé
 * (401/403), on répond « closed » : les contributions publiques ne sont pas
 * encore ouvertes côté API (stub propre, aucune donnée perdue côté UX).
 */
export async function submitSpot(spot: NewSpot, adminKey?: string): Promise<SubmitSpotResult> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminKey) headers['x-admin-key'] = adminKey;
    const res = await fetch(`${API_BASE}/spots`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...spot, source: adminKey ? 'app-admin' : 'app-public' }),
    });
    if (res.status === 401 || res.status === 403) return 'closed';
    return res.ok ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

/**
 * « Toujours là ? » : confirme un spot en 1 tap. Best-effort — si l'endpoint
 * n'existe pas encore (404/405), on renvoie quand même « ok » côté UX (le
 * remerciement reste vrai localement, la persistance serveur viendra).
 */
export async function confirmSpot(spotId: string): Promise<'ok' | 'error'> {
  try {
    const res = await fetch(`${API_BASE}/spots/${encodeURIComponent(spotId)}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'app' }),
    });
    if (res.ok || res.status === 404 || res.status === 405) return 'ok';
    return 'error';
  } catch {
    return 'error';
  }
}
