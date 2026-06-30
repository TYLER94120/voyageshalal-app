// ─────────────────────────────────────────────────────────────────────────────
// Cache hors-ligne des villes : on tente toujours le réseau, mais on garde la
// dernière version connue pour qu'un voyageur SANS data (à l'étranger) puisse
// quand même consulter une ville déjà ouverte. Lecture/écriture AsyncStorage ;
// la validation de forme est pure et testable.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';

import { getVille, getVilles, type VilleDetail, type VilleSummary } from './api';

const VILLE_PREFIX = '@voyageshalal/ville/';
const LIST_KEY = '@voyageshalal/villes';

export function villeCacheKey(slug: string): string {
  return `${VILLE_PREFIX}${slug}`;
}

/** Garde-fou : un détail de ville en cache doit au moins avoir nom + listes. */
export function isValidCachedDetail(v: unknown): v is VilleDetail {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.nom === 'string' &&
    Array.isArray(o.restaurants) &&
    Array.isArray(o.hotels) &&
    Array.isArray(o.mosquees)
  );
}

export function isValidCachedList(v: unknown): v is VilleSummary[] {
  return Array.isArray(v) && v.every((x) => x && typeof x === 'object' && typeof (x as Record<string, unknown>).nom === 'string');
}

async function readJson(key: string): Promise<unknown> {
  try {
    const json = await AsyncStorage.getItem(key);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

async function writeJson(key: string, data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* stockage plein/indisponible : on ignore */
  }
}

export interface CachedResult<T> {
  data: T;
  offline: boolean; // true = servi depuis le cache (réseau indisponible)
}

/** Détail d'une ville : réseau d'abord, repli sur le cache si hors-ligne. */
export async function getVilleCached(slug: string): Promise<CachedResult<VilleDetail>> {
  try {
    const data = await getVille(slug);
    writeJson(villeCacheKey(slug), data);
    return { data, offline: false };
  } catch (err) {
    const cached = await readJson(villeCacheKey(slug));
    if (isValidCachedDetail(cached)) return { data: cached, offline: true };
    throw err;
  }
}

/** Liste des villes : réseau d'abord, repli sur le cache si hors-ligne. */
export async function getVillesCached(): Promise<CachedResult<VilleSummary[]>> {
  try {
    const data = await getVilles();
    writeJson(LIST_KEY, data);
    return { data, offline: false };
  } catch (err) {
    const cached = await readJson(LIST_KEY);
    if (isValidCachedList(cached)) return { data: cached, offline: true };
    throw err;
  }
}
