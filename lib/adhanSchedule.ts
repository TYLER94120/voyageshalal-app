// Construction (pure, testable) de la liste des notifications d'adhan à
// programmer. Aucun import natif ici — uniquement le moteur de prière.

import { computeDay, PRAYER_LABELS, type MadhabKey, type PrayerName } from './prayer';

// Prières obligatoires éligibles aux rappels (le lever du soleil est exclu).
// Défini ici (module pur) pour rester testable sans dépendance native.
export type AdhanPrayer = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export const ADHAN_PRAYERS: AdhanPrayer[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

// Nb de jours programmés à l'avance. iOS plafonne à 64 notifications
// (7 jours × 5 prières = 35, marge confortable). Reprogrammé à chaque
// passage au premier plan (cf. components/AdhanScheduler).
export const SCHEDULE_DAYS = 7;

export interface ScheduleItem {
  prayer: AdhanPrayer;
  label: string;
  date: Date;
}

/**
 * Liste triée et future des prières à notifier sur `days` jours.
 * Ignore les prières désactivées, les horaires passés et les dates invalides.
 */
export function buildSchedule(
  latitude: number,
  longitude: number,
  now: Date,
  methodKey: string,
  madhab: MadhabKey,
  enabledPrayers: Record<AdhanPrayer, boolean>,
  days = SCHEDULE_DAYS,
): ScheduleItem[] {
  const items: ScheduleItem[] = [];
  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d);
    date.setHours(12, 0, 0, 0); // midi → date civile stable pour le calcul du jour
    const slots = computeDay(latitude, longitude, date, methodKey, madhab);
    for (const p of ADHAN_PRAYERS) {
      if (!enabledPrayers[p]) continue;
      const slot = slots.find((s) => s.name === (p as PrayerName));
      if (!slot || Number.isNaN(slot.time.getTime())) continue;
      if (slot.time.getTime() > now.getTime()) {
        items.push({ prayer: p, label: PRAYER_LABELS[p], date: slot.time });
      }
    }
  }
  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
}
