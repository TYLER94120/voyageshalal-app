// Contenu (pur, testable) de la notification « horaires épinglés » : titre +
// sous-titre (prochaine prière) + corps (les 5 horaires du jour). Aucun import
// natif ici — uniquement le moteur de prière.

import { ADHAN_PRAYERS } from './adhanSchedule';
import { computeDay, findNextPrayer, formatTime, PRAYER_LABELS, type MadhabKey } from './prayer';

export interface PersistentContent {
  title: string;
  subtitle: string;
  body: string;
}

/**
 * Construit le texte de l'épingle : les 5 horaires du jour (toujours valides sur
 * la journée) + un rappel de la prochaine prière en sous-titre.
 */
export function buildPersistentContent(
  latitude: number,
  longitude: number,
  now: Date,
  methodKey: string,
  madhab: MadhabKey,
): PersistentContent {
  const slots = computeDay(latitude, longitude, now, methodKey, madhab);
  const parts = ADHAN_PRAYERS.map((p) => {
    const slot = slots.find((s) => s.name === p);
    return `${PRAYER_LABELS[p]} ${slot ? formatTime(slot.time) : '--:--'}`;
  });
  const next = findNextPrayer(latitude, longitude, now, methodKey, madhab);
  return {
    title: '🕌 Horaires de prière',
    subtitle: `Prochaine : ${next.label} ${formatTime(next.time)}`,
    body: parts.join('  ·  '),
  };
}
