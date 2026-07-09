// Dernière position connue, persistée pour les usages « hors app » (widget
// Android headless, notifications). Écrite par PrayerContext à chaque
// résolution ; lue par le widget qui n'a pas accès au contexte React.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'voyageshalal.lastloc.v1';

export interface StoredLocation {
  latitude: number;
  longitude: number;
  city?: string;
  at: number; // epoch ms
}

export async function saveLastLocation(loc: Omit<StoredLocation, 'at'>): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ ...loc, at: Date.now() }));
  } catch {
    // best-effort
  }
}

export async function loadLastLocation(): Promise<StoredLocation | null> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    if (!json) return null;
    const o = JSON.parse(json) as Record<string, unknown>;
    if (typeof o.latitude !== 'number' || typeof o.longitude !== 'number') return null;
    return {
      latitude: o.latitude,
      longitude: o.longitude,
      city: typeof o.city === 'string' ? o.city : undefined,
      at: typeof o.at === 'number' ? o.at : 0,
    };
  } catch {
    return null;
  }
}
