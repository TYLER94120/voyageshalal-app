import AsyncStorage from '@react-native-async-storage/async-storage';

import { ADHAN_PRAYERS, type AdhanPrayer } from './adhanSchedule';

export { ADHAN_PRAYERS, type AdhanPrayer } from './adhanSchedule';

export interface AdhanSettings {
  enabled: boolean;
  prayers: Record<AdhanPrayer, boolean>;
}

export const DEFAULT_ADHAN_SETTINGS: AdhanSettings = {
  enabled: false,
  prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
};

const STORAGE_KEY = 'voyageshalal.adhan.v1';

function sanitize(raw: unknown): AdhanSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const prayersRaw = (obj.prayers && typeof obj.prayers === 'object' ? obj.prayers : {}) as Record<
    string,
    unknown
  >;
  const prayers = { ...DEFAULT_ADHAN_SETTINGS.prayers };
  for (const p of ADHAN_PRAYERS) {
    if (typeof prayersRaw[p] === 'boolean') prayers[p] = prayersRaw[p] as boolean;
  }
  return { enabled: obj.enabled === true, prayers };
}

export async function loadAdhanSettings(): Promise<AdhanSettings> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return DEFAULT_ADHAN_SETTINGS;
    return sanitize(JSON.parse(json));
  } catch {
    return DEFAULT_ADHAN_SETTINGS;
  }
}

export async function saveAdhanSettings(settings: AdhanSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // best-effort
  }
}
