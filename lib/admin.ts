// Mode admin (propriétaire) : débloqué en saisissant la CLÉ ADMIN du serveur.
// Aucun secret n'est embarqué dans le bundle — la clé saisie est stockée
// localement et envoyée au serveur, qui seul la valide. Sert à semer des spots.
//
// Stockage : Keystore/Keychain via expo-secure-store quand le binaire l'embarque
// (chiffré au repos), sinon repli AsyncStorage (anciens builds — module natif
// absent). La migration AsyncStorage → SecureStore est automatique.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'voyageshalal.admin.v1';
const SECURE_KEY = 'voyageshalal_admin_key'; // SecureStore : alphanumérique + . - _

type SecureStoreModule = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

function getSecureStore(): SecureStoreModule | null {
  try {
    return require('expo-secure-store');
  } catch {
    return null;
  }
}

export interface AdminState {
  isAdmin: boolean;
  key: string;
}

/** Une clé admin plausible (le serveur reste seul juge de sa validité). */
export function isValidAdminCode(code: string): boolean {
  return code.trim().length >= 6;
}

async function loadLegacy(): Promise<AdminState> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    if (!json) return { isAdmin: false, key: '' };
    const o = JSON.parse(json) as Record<string, unknown>;
    return { isAdmin: o.isAdmin === true, key: typeof o.key === 'string' ? o.key : '' };
  } catch {
    return { isAdmin: false, key: '' };
  }
}

export async function loadAdmin(): Promise<AdminState> {
  const secure = getSecureStore();
  if (secure) {
    try {
      const key = await secure.getItemAsync(SECURE_KEY);
      if (key) return { isAdmin: true, key };
      // Migration : une clé posée par un ancien build vit encore en AsyncStorage.
      const legacy = await loadLegacy();
      if (legacy.isAdmin && legacy.key) {
        await secure.setItemAsync(SECURE_KEY, legacy.key);
        await AsyncStorage.removeItem(KEY).catch(() => undefined);
        return legacy;
      }
      return { isAdmin: false, key: '' };
    } catch {
      return loadLegacy();
    }
  }
  return loadLegacy();
}

/** Débloque le mode admin avec la clé serveur. false si la clé est trop courte. */
export async function unlockAdmin(code: string): Promise<boolean> {
  const key = code.trim();
  if (!isValidAdminCode(key)) return false;
  const secure = getSecureStore();
  try {
    if (secure) await secure.setItemAsync(SECURE_KEY, key);
    else await AsyncStorage.setItem(KEY, JSON.stringify({ isAdmin: true, key }));
  } catch {
    // best-effort
  }
  return true;
}

export async function lockAdmin(): Promise<void> {
  const secure = getSecureStore();
  try {
    if (secure) await secure.deleteItemAsync(SECURE_KEY);
  } catch {
    // best-effort
  }
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // best-effort
  }
}
