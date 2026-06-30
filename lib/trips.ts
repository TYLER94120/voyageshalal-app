// ─────────────────────────────────────────────────────────────────────────────
// Planificateur « Mon séjour » : un séjour par ville, organisé jour par jour.
// Le cœur (création, ajout/retrait/déplacement d'étapes) est pur et testable ;
// seules load/save touchent au stockage (AsyncStorage). L'id du séjour = slug
// de la ville → « ajouter à mon séjour » depuis une fiche est immédiat.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';

export type TripItemType = 'hotel' | 'restaurant' | 'activite' | 'mosquee';

export interface TripItem {
  id: string; // unique dans le séjour (type + lieuId)
  lieuId: string;
  type: TripItemType;
  title: string;
  subtitle?: string;
  emoji: string;
  mapsUrl?: string;
  latitude?: number;
  longitude?: number;
  day: number; // 1-based
}

export interface Trip {
  id: string; // = slug de la ville (un séjour par ville)
  citySlug: string;
  cityNom: string;
  latitude?: number;
  longitude?: number;
  days: number;
  items: TripItem[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = '@voyageshalal/trips';
const DEFAULT_DAYS = 3;
const MAX_DAYS = 14;

export function tripItemKey(type: TripItemType, lieuId: string): string {
  return `${type}:${lieuId}`;
}

export function makeTrip(
  citySlug: string,
  cityNom: string,
  coords: { latitude?: number; longitude?: number },
  now: number,
): Trip {
  return {
    id: citySlug,
    citySlug,
    cityNom,
    latitude: coords.latitude,
    longitude: coords.longitude,
    days: DEFAULT_DAYS,
    items: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function findTripByCity(trips: Trip[], citySlug: string): Trip | undefined {
  return trips.find((t) => t.id === citySlug);
}

export function upsertTrip(trips: Trip[], trip: Trip): Trip[] {
  const idx = trips.findIndex((t) => t.id === trip.id);
  if (idx === -1) return [trip, ...trips];
  const copy = [...trips];
  copy[idx] = trip;
  return copy;
}

export function removeTrip(trips: Trip[], tripId: string): Trip[] {
  return trips.filter((t) => t.id !== tripId);
}

export function hasItem(trip: Trip, itemId: string): boolean {
  return trip.items.some((it) => it.id === itemId);
}

export function addItem(trip: Trip, item: Omit<TripItem, 'day'>, day: number, now: number): Trip {
  if (hasItem(trip, item.id)) return trip;
  const safeDay = Math.min(Math.max(1, day), trip.days);
  return { ...trip, items: [...trip.items, { ...item, day: safeDay }], updatedAt: now };
}

export function removeItem(trip: Trip, itemId: string, now: number): Trip {
  return { ...trip, items: trip.items.filter((it) => it.id !== itemId), updatedAt: now };
}

export function moveItem(trip: Trip, itemId: string, day: number, now: number): Trip {
  const safeDay = Math.min(Math.max(1, day), trip.days);
  return {
    ...trip,
    items: trip.items.map((it) => (it.id === itemId ? { ...it, day: safeDay } : it)),
    updatedAt: now,
  };
}

export function setDays(trip: Trip, days: number, now: number): Trip {
  const safe = Math.min(Math.max(1, days), MAX_DAYS);
  // Les étapes des jours supprimés sont ramenées au dernier jour.
  const items = trip.items.map((it) => (it.day > safe ? { ...it, day: safe } : it));
  return { ...trip, days: safe, items, updatedAt: now };
}

export function itemsForDay(trip: Trip, day: number): TripItem[] {
  return trip.items.filter((it) => it.day === day);
}

// ─── Persistance ─────────────────────────────────────────────────────────────

export function parseTrips(raw: unknown): Trip[] {
  if (!Array.isArray(raw)) return [];
  const out: Trip[] = [];
  for (const v of raw) {
    if (!v || typeof v !== 'object') continue;
    const o = v as Record<string, unknown>;
    if (typeof o.id !== 'string' || typeof o.cityNom !== 'string') continue;
    const items = Array.isArray(o.items)
      ? (o.items as unknown[]).filter(
          (x): x is TripItem =>
            !!x && typeof x === 'object' && typeof (x as TripItem).id === 'string',
        )
      : [];
    out.push({
      id: o.id,
      citySlug: typeof o.citySlug === 'string' ? o.citySlug : o.id,
      cityNom: o.cityNom,
      latitude: typeof o.latitude === 'number' ? o.latitude : undefined,
      longitude: typeof o.longitude === 'number' ? o.longitude : undefined,
      days: typeof o.days === 'number' && o.days > 0 ? Math.min(o.days, MAX_DAYS) : DEFAULT_DAYS,
      items,
      createdAt: typeof o.createdAt === 'number' ? o.createdAt : 0,
      updatedAt: typeof o.updatedAt === 'number' ? o.updatedAt : 0,
    });
  }
  return out;
}

export async function loadTrips(): Promise<Trip[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? parseTrips(JSON.parse(json)) : [];
  } catch {
    return [];
  }
}

export async function saveTrips(trips: Trip[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch {
    /* stockage indisponible */
  }
}
