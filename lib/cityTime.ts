// ─────────────────────────────────────────────────────────────────────────────
// Heure LOCALE d'une ville (planif voyage). Le moteur adhan renvoie des Date
// absolues ; les afficher avec getHours() donne l'heure de L'APPAREIL — faux
// dès que la ville visée est dans un autre fuseau (Fajr de Tokyo « 20:30 » vu
// de France). Ici : fuseau IANA depuis les coordonnées (tz-lookup, hors-ligne)
// + formatage via Intl (Hermes l'embarque) avec repli sans fuseau si absent.
// ─────────────────────────────────────────────────────────────────────────────

import tzLookup from 'tz-lookup';

/** Fuseau IANA (ex. « Asia/Tokyo ») pour des coordonnées, ou null. */
export function timezoneFor(latitude: number, longitude: number): string | null {
  try {
    return tzLookup(latitude, longitude);
  } catch {
    return null;
  }
}

/** HH:mm dans le fuseau demandé (repli : heure de l'appareil). */
export function formatTimeInTz(date: Date, timeZone: string | null): string {
  if (Number.isNaN(date.getTime())) return '--:--';
  if (timeZone) {
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(date);
    } catch {
      // Intl/fuseau indisponible → repli appareil
    }
  }
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Date civile COURANTE de la ville (année/mois/jour dans son fuseau), rendue
 * comme une Date « midi heure appareil » — la forme attendue par computeDay
 * (qui lit y/m/d dans le fuseau de l'appareil). Sans ça, vers minuit, on
 * calculerait les horaires du mauvais jour (Tokyo déjà « demain »).
 */
export function cityCivilDate(now: Date, timeZone: string | null): Date {
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(now);
      const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
      const d = new Date(get('year'), get('month') - 1, get('day'), 12, 0, 0, 0);
      if (!Number.isNaN(d.getTime())) return d;
    } catch {
      // repli
    }
  }
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  return d;
}
