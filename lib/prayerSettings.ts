import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_METHOD_KEY, methodByKey, type MadhabKey } from './prayer';

const STORAGE_KEY = 'voyageshalal.prayer.settings.v1';

export interface PrayerSettings {
  methodKey: string;
  madhab: MadhabKey;
}

export const DEFAULT_SETTINGS: PrayerSettings = {
  methodKey: DEFAULT_METHOD_KEY,
  madhab: 'shafi',
};

function sanitize(raw: unknown): PrayerSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const methodKey =
    typeof obj.methodKey === 'string' ? methodByKey(obj.methodKey).key : DEFAULT_SETTINGS.methodKey;
  const madhab: MadhabKey = obj.madhab === 'hanafi' ? 'hanafi' : 'shafi';
  return { methodKey, madhab };
}

export async function loadSettings(): Promise<PrayerSettings> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return DEFAULT_SETTINGS;
    return sanitize(JSON.parse(json));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: PrayerSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Persistance best-effort : on n'interrompt pas l'app si l'écriture échoue.
  }
}
