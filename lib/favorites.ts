// ─────────────────────────────────────────────────────────────────────────────
// Favoris / Wishlists (façon Airbnb) : villes et lieux sauvegardés, persistés
// localement (AsyncStorage). Le cœur (add/remove/toggle/clé) est pur et testable ;
// seules les fonctions load/save touchent au stockage.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';

export type FavoriteType = 'city' | 'place';

export interface FavoriteItem {
  id: string; // clé unique stable
  type: FavoriteType;
  title: string;
  subtitle?: string;
  emoji?: string;
  citySlug?: string; // ville (slug) ou ville de rattachement du lieu
  image?: string;
  mapsUrl?: string;
  addedAt: number;
}

const STORAGE_KEY = '@voyageshalal/favorites';

export function cityFavKey(slug: string): string {
  return `city:${slug}`;
}

export function placeFavKey(citySlug: string, lieuId: string): string {
  return `place:${citySlug}:${lieuId}`;
}

export function isFavorite(list: FavoriteItem[], id: string): boolean {
  return list.some((f) => f.id === id);
}

export function addFavorite(list: FavoriteItem[], item: FavoriteItem): FavoriteItem[] {
  if (isFavorite(list, item.id)) return list;
  return [item, ...list];
}

export function removeFavorite(list: FavoriteItem[], id: string): FavoriteItem[] {
  return list.filter((f) => f.id !== id);
}

/** Bascule un favori. `now` est injectable pour rester testable. */
export function toggleFavorite(
  list: FavoriteItem[],
  item: Omit<FavoriteItem, 'addedAt'>,
  now: number,
): FavoriteItem[] {
  if (isFavorite(list, item.id)) return removeFavorite(list, item.id);
  return addFavorite(list, { ...item, addedAt: now });
}

/** Valide/normalise une charge JSON inconnue en liste de favoris (tolérant). */
export function parseFavorites(raw: unknown): FavoriteItem[] {
  if (!Array.isArray(raw)) return [];
  const out: FavoriteItem[] = [];
  for (const v of raw) {
    if (!v || typeof v !== 'object') continue;
    const o = v as Record<string, unknown>;
    if (typeof o.id !== 'string' || (o.type !== 'city' && o.type !== 'place')) continue;
    if (typeof o.title !== 'string') continue;
    out.push({
      id: o.id,
      type: o.type,
      title: o.title,
      subtitle: typeof o.subtitle === 'string' ? o.subtitle : undefined,
      emoji: typeof o.emoji === 'string' ? o.emoji : undefined,
      citySlug: typeof o.citySlug === 'string' ? o.citySlug : undefined,
      image: typeof o.image === 'string' ? o.image : undefined,
      mapsUrl: typeof o.mapsUrl === 'string' ? o.mapsUrl : undefined,
      addedAt: typeof o.addedAt === 'number' ? o.addedAt : 0,
    });
  }
  return out;
}

export async function loadFavorites(): Promise<FavoriteItem[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return parseFavorites(JSON.parse(json));
  } catch {
    return [];
  }
}

export async function saveFavorites(list: FavoriteItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* stockage indisponible : on garde l'état en mémoire */
  }
}
