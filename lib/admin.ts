// Mode admin (propriétaire) : débloqué en saisissant la CLÉ ADMIN du serveur.
// Aucun secret n'est embarqué dans le bundle — la clé saisie est stockée
// localement et envoyée au serveur, qui seul la valide. Sert à semer des spots.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'voyageshalal.admin.v1';

export interface AdminState {
  isAdmin: boolean;
  key: string;
}

/** Une clé admin plausible (le serveur reste seul juge de sa validité). */
export function isValidAdminCode(code: string): boolean {
  return code.trim().length >= 6;
}

export async function loadAdmin(): Promise<AdminState> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    if (!json) return { isAdmin: false, key: '' };
    const o = JSON.parse(json) as Record<string, unknown>;
    return { isAdmin: o.isAdmin === true, key: typeof o.key === 'string' ? o.key : '' };
  } catch {
    return { isAdmin: false, key: '' };
  }
}

/** Débloque le mode admin avec la clé serveur. false si la clé est trop courte. */
export async function unlockAdmin(code: string): Promise<boolean> {
  const key = code.trim();
  if (!isValidAdminCode(key)) return false;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ isAdmin: true, key }));
  } catch {
    // best-effort
  }
  return true;
}

export async function lockAdmin(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // best-effort
  }
}
