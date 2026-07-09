// Contenu (pur, testable) du widget « horaires de prière » de l'écran
// d'accueil : les 5 prières du jour + la prochaine mise en avant. Aucun
// import natif — uniquement le moteur de prière local (hors-ligne).

import { ADHAN_PRAYERS } from './adhanSchedule';
import { computeDay, findNextPrayer, formatTime, PRAYER_LABELS, type MadhabKey } from './prayer';

export interface WidgetRow {
  key: string;
  label: string;
  time: string; // HH:mm
  isNext: boolean;
}

export interface WidgetContent {
  city?: string;
  nextLabel: string; // ex. « Maghrib 21:57 »
  rows: WidgetRow[];
}

export function buildWidgetContent(
  latitude: number,
  longitude: number,
  now: Date,
  methodKey: string,
  madhab: MadhabKey,
  city?: string,
): WidgetContent {
  const slots = computeDay(latitude, longitude, now, methodKey, madhab);
  const next = findNextPrayer(latitude, longitude, now, methodKey, madhab);
  const rows: WidgetRow[] = ADHAN_PRAYERS.map((p) => {
    const slot = slots.find((s) => s.name === p);
    return {
      key: p,
      label: PRAYER_LABELS[p],
      time: slot ? formatTime(slot.time) : '--:--',
      isNext: !next.isTomorrow && next.name === p,
    };
  });
  return {
    city,
    nextLabel: `${next.label} ${formatTime(next.time)}${next.isTomorrow ? ' (demain)' : ''}`,
    rows,
  };
}
