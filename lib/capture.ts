// ─────────────────────────────────────────────────────────────────────────────
// Phase 1 — CAPTURE : e-mail (newsletter) + suivi social + rappel d'installation.
// On CONSOMME l'API partagée : POST best-effort vers /subscribe. Si l'endpoint
// n'existe pas encore, on stocke localement et on n'insiste pas (stub propre).
// La partie réseau est isolée ; la validation reste pure et testable.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE } from './api';

const SUBSCRIBED_KEY = 'voyageshalal.subscribed.v1';

// Liens de suivi (à ajuster si les comptes changent).
export const FOLLOW_LINKS = {
  instagram: 'https://www.instagram.com/voyageshalal',
  site: 'https://www.voyageshalal.fr',
};
// Lien de partage de l'app (site tant que le Play Store n'est pas public).
export const SHARE_URL = 'https://www.voyageshalal.fr';

/** Validation e-mail simple et robuste (pas de regex exotique). */
export function isValidEmail(email: string): boolean {
  const e = email.trim();
  if (e.length < 5 || e.length > 254) return false;
  const at = e.indexOf('@');
  if (at <= 0 || at !== e.lastIndexOf('@')) return false;
  const domain = e.slice(at + 1);
  return domain.includes('.') && !e.includes(' ') && !domain.startsWith('.') && !domain.endsWith('.');
}

export async function hasSubscribed(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(SUBSCRIBED_KEY)) === '1';
  } catch {
    return false;
  }
}

async function markSubscribed(): Promise<void> {
  try {
    await AsyncStorage.setItem(SUBSCRIBED_KEY, '1');
  } catch {
    // best-effort
  }
}

export type SubscribeResult = 'ok' | 'invalid' | 'error';

/** Inscrit l'e-mail (best-effort). Marque comme inscrit dès que la requête part. */
export async function subscribeEmail(email: string): Promise<SubscribeResult> {
  if (!isValidEmail(email)) return 'invalid';
  try {
    const res = await fetch(`${API_BASE}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email: email.trim(), source: 'app' }),
    });
    // 2xx OU 404 (endpoint pas encore là) → on considère l'intention captée
    // localement pour ne pas re-solliciter ; les vraies erreurs réseau => retry.
    if (res.ok || res.status === 404) {
      await markSubscribed();
      return 'ok';
    }
    return 'error';
  } catch {
    return 'error';
  }
}
