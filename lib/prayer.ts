// ─────────────────────────────────────────────────────────────────────────────
// Moteur d'horaires de prière, basé sur la librairie `adhan` (calcul local,
// hors-ligne, à partir des coordonnées GPS + méthode de calcul + école).
// ─────────────────────────────────────────────────────────────────────────────

import {
  CalculationMethod,
  CalculationParameters,
  Coordinates,
  Madhab,
  PolarCircleResolution,
  PrayerTimes,
} from 'adhan';

export type MadhabKey = 'shafi' | 'hanafi';

// ─── Méthodes de calcul proposées ────────────────────────────────────────────

export interface MethodOption {
  key: string;
  label: string;
  hint: string;
  build: () => CalculationParameters;
}

export const METHODS: MethodOption[] = [
  {
    key: 'mwl',
    label: 'Ligue islamique mondiale',
    hint: 'Fajr 18° · Isha 17°',
    build: () => CalculationMethod.MuslimWorldLeague(),
  },
  {
    key: 'uoif',
    label: 'France (UOIF)',
    hint: 'Fajr 12° · Isha 12°',
    build: () => {
      const p = CalculationMethod.Other();
      p.fajrAngle = 12;
      p.ishaAngle = 12;
      return p;
    },
  },
  {
    key: 'isna',
    label: 'Amérique du Nord (ISNA)',
    hint: 'Fajr 15° · Isha 15°',
    build: () => CalculationMethod.NorthAmerica(),
  },
  {
    key: 'egyptian',
    label: 'Égypte',
    hint: 'Fajr 19.5° · Isha 17.5°',
    build: () => CalculationMethod.Egyptian(),
  },
  {
    key: 'karachi',
    label: 'Karachi',
    hint: 'Fajr 18° · Isha 18°',
    build: () => CalculationMethod.Karachi(),
  },
  {
    key: 'ummalqura',
    label: 'Umm al-Qura (La Mecque)',
    hint: 'Fajr 18.5° · Isha +90 min',
    build: () => CalculationMethod.UmmAlQura(),
  },
  {
    key: 'turkey',
    label: 'Turquie (Diyanet)',
    hint: 'Fajr 18° · Isha 17°',
    build: () => CalculationMethod.Turkey(),
  },
  {
    key: 'dubai',
    label: 'Dubaï',
    hint: 'Fajr 18.2° · Isha 18.2°',
    build: () => CalculationMethod.Dubai(),
  },
  {
    key: 'moonsighting',
    label: 'Moonsighting Committee',
    hint: 'Fajr 18° · Isha 18°',
    build: () => CalculationMethod.MoonsightingCommittee(),
  },
  {
    key: 'tehran',
    label: 'Téhéran',
    hint: 'Fajr 17.7° · Isha 14°',
    build: () => CalculationMethod.Tehran(),
  },
];

export const DEFAULT_METHOD_KEY = 'mwl';

export function methodByKey(key: string): MethodOption {
  return METHODS.find((m) => m.key === key) ?? METHODS[0];
}

// ─── Horaires d'un jour ──────────────────────────────────────────────────────

// Prières affichées dans la timeline (le lever du soleil borne la fin du Fajr).
export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

// Les 5 prières obligatoires servent au calcul de « prochaine prière » ;
// le lever du soleil n'en fait pas partie.
const OBLIGATORY: Exclude<PrayerName, 'sunrise'>[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

export const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: 'Fajr',
  sunrise: 'Lever du soleil',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export interface PrayerSlot {
  name: PrayerName;
  label: string;
  time: Date;
  obligatory: boolean;
}

function buildParams(methodKey: string, madhab: MadhabKey): CalculationParameters {
  const params = methodByKey(methodKey).build();
  params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  // Aux hautes latitudes (Scandinavie…), l'angle solaire du Fajr/Isha peut ne
  // jamais être atteint → adhan renverrait des dates invalides. On résout via
  // la localité valide la plus proche (utile pour une app de voyage).
  params.polarCircleResolution = PolarCircleResolution.AqrabBalad;
  return params;
}

function isValidTime(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

/** Horaires des prières pour une date donnée (heure locale de l'appareil). */
export function computeDay(
  latitude: number,
  longitude: number,
  date: Date,
  methodKey: string,
  madhab: MadhabKey,
): PrayerSlot[] {
  const coords = new Coordinates(latitude, longitude);
  const params = buildParams(methodKey, madhab);
  const pt = new PrayerTimes(coords, date, params);
  const order: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  return order.map((name) => ({
    name,
    label: PRAYER_LABELS[name],
    time: pt[name],
    obligatory: name !== 'sunrise',
  }));
}

export interface NextPrayer {
  name: PrayerName;
  label: string;
  time: Date;
  isTomorrow: boolean;
}

/**
 * Prochaine prière obligatoire à partir de `now`.
 * Gère le passage après l'Isha → Fajr du lendemain (cas classique d'erreur).
 */
export function findNextPrayer(
  latitude: number,
  longitude: number,
  now: Date,
  methodKey: string,
  madhab: MadhabKey,
): NextPrayer {
  const today = computeDay(latitude, longitude, now, methodKey, madhab);
  for (const name of OBLIGATORY) {
    const slot = today.find((s) => s.name === name)!;
    if (isValidTime(slot.time) && slot.time.getTime() > now.getTime()) {
      return { name: slot.name, label: slot.label, time: slot.time, isTomorrow: false };
    }
  }
  // Après l'Isha : prochaine prière = Fajr de demain.
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const next = computeDay(latitude, longitude, tomorrow, methodKey, madhab);
  const fajr = next.find((s) => s.name === 'fajr')!;
  return { name: fajr.name, label: fajr.label, time: fajr.time, isTomorrow: true };
}

/**
 * Nom de la prière obligatoire en cours (dernière entamée), ou null avant le
 * Fajr. Le Fajr se termine au lever du soleil : passé le lever, plus aucune
 * prière n'est « en cours » jusqu'au Dhuhr.
 */
export function findCurrentPrayer(slots: PrayerSlot[], now: Date): PrayerName | null {
  let current: PrayerName | null = null;
  for (const slot of slots) {
    if (slot.obligatory && isValidTime(slot.time) && slot.time.getTime() <= now.getTime()) {
      current = slot.name;
    }
  }
  if (current === 'fajr') {
    const sunrise = slots.find((s) => s.name === 'sunrise');
    if (sunrise && isValidTime(sunrise.time) && now.getTime() >= sunrise.time.getTime()) {
      return null;
    }
  }
  return current;
}

// ─── Formatage ───────────────────────────────────────────────────────────────

/** HH:mm sur 24h (format français), sans dépendre d'Intl (Hermes-safe). */
export function formatTime(date: Date): string {
  if (!isValidTime(date)) return '--:--';
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export interface Countdown {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export function countdownTo(target: Date, now: Date): Countdown {
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const totalSec = Math.floor(totalMs / 1000);
  return {
    hours: Math.floor(totalSec / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    totalMs,
  };
}

/** Forme compacte « 1h42 » / « 38 min » pour le bandeau. */
export function formatCountdownShort(c: Countdown): string {
  if (c.hours > 0) return `${c.hours}h${String(c.minutes).padStart(2, '0')}`;
  if (c.minutes > 0) return `${c.minutes} min`;
  return `${c.seconds} s`;
}

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** « lundi 29 juin 2026 » sans dépendre d'Intl. */
export function formatFrenchDate(date: Date): string {
  return `${JOURS[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Clé jour (année-mois-jour) pour mémoïser le calcul d'une journée. */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
