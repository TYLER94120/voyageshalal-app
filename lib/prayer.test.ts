import {
  computeDay,
  countdownTo,
  findCurrentPrayer,
  findNextPrayer,
  formatCountdownShort,
  formatFrenchDate,
  formatTime,
  methodByKey,
} from './prayer';

// Paris, méthode MWL, école Shafi — données déterministes (calcul local adhan).
const LAT = 48.8566;
const LNG = 2.3522;
const METHOD = 'mwl';
const MADHAB = 'shafi' as const;

describe('computeDay', () => {
  it('renvoie 6 créneaux ordonnés avec le lever entre Fajr et Dhuhr', () => {
    const slots = computeDay(LAT, LNG, new Date(2026, 5, 29, 12, 0), METHOD, MADHAB);
    expect(slots.map((s) => s.name)).toEqual([
      'fajr',
      'sunrise',
      'dhuhr',
      'asr',
      'maghrib',
      'isha',
    ]);
    // strictement croissants
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i].time.getTime()).toBeGreaterThan(slots[i - 1].time.getTime());
    }
    // seul le lever n'est pas obligatoire
    expect(slots.filter((s) => !s.obligatory).map((s) => s.name)).toEqual(['sunrise']);
  });
});

describe('findNextPrayer', () => {
  // NB : on teste la branche isTomorrow=false avec une prière de journée (Dhuhr)
  // pour rester indépendant du fuseau de la machine de test. (En UTC, l'instant
  // du Fajr de Paris tombe la veille à 23:54Z, ce qui piégerait une soustraction
  // naïve « fajr − 60s » au passage de minuit UTC — un artefact absent sur un
  // appareil réel, dont l'heure locale partage toujours la date du Fajr.)
  it('avant une prière de journée → prochaine = cette prière, le jour même', () => {
    const slots = computeDay(LAT, LNG, new Date(2026, 5, 29, 12, 0), METHOD, MADHAB);
    const dhuhr = slots.find((s) => s.name === 'dhuhr')!;
    const now = new Date(dhuhr.time.getTime() - 60_000);
    const next = findNextPrayer(LAT, LNG, now, METHOD, MADHAB);
    expect(next.name).toBe('dhuhr');
    expect(next.isTomorrow).toBe(false);
  });

  it('juste après l’Isha → prochaine = Fajr de demain (rollover)', () => {
    const slots = computeDay(LAT, LNG, new Date(2026, 5, 29, 23, 0), METHOD, MADHAB);
    const isha = slots.find((s) => s.name === 'isha')!;
    const now = new Date(isha.time.getTime() + 60_000);
    const next = findNextPrayer(LAT, LNG, now, METHOD, MADHAB);
    expect(next.name).toBe('fajr');
    expect(next.isTomorrow).toBe(true);
    expect(next.time.getTime()).toBeGreaterThan(isha.time.getTime());
  });

  it('ne saute jamais une prière au moment exact du créneau (strict >)', () => {
    const slots = computeDay(LAT, LNG, new Date(2026, 5, 29, 12, 0), METHOD, MADHAB);
    const dhuhr = slots.find((s) => s.name === 'dhuhr')!;
    // exactement à l'heure du Dhuhr : il est entamé → prochaine = Asr
    const next = findNextPrayer(LAT, LNG, new Date(dhuhr.time.getTime()), METHOD, MADHAB);
    expect(next.name).toBe('asr');
  });
});

describe('findCurrentPrayer', () => {
  it('avant le Fajr → aucune prière en cours', () => {
    const slots = computeDay(LAT, LNG, new Date(2026, 5, 29, 1, 0), METHOD, MADHAB);
    const fajr = slots.find((s) => s.name === 'fajr')!;
    expect(findCurrentPrayer(slots, new Date(fajr.time.getTime() - 60_000))).toBeNull();
  });

  it('après le Maghrib → Maghrib en cours (le lever n’est jamais "en cours")', () => {
    const slots = computeDay(LAT, LNG, new Date(2026, 5, 29, 22, 0), METHOD, MADHAB);
    const maghrib = slots.find((s) => s.name === 'maghrib')!;
    const isha = slots.find((s) => s.name === 'isha')!;
    const now = new Date((maghrib.time.getTime() + isha.time.getTime()) / 2);
    expect(findCurrentPrayer(slots, now)).toBe('maghrib');
  });

  it('entre Fajr et le lever → Fajr en cours', () => {
    const slots = computeDay(LAT, LNG, new Date(2026, 5, 29, 4, 0), METHOD, MADHAB);
    const fajr = slots.find((s) => s.name === 'fajr')!;
    const sunrise = slots.find((s) => s.name === 'sunrise')!;
    const now = new Date((fajr.time.getTime() + sunrise.time.getTime()) / 2);
    expect(findCurrentPrayer(slots, now)).toBe('fajr');
  });

  it('après le lever et avant Dhuhr → aucune prière en cours (Fajr terminé au lever)', () => {
    const slots = computeDay(LAT, LNG, new Date(2026, 5, 29, 8, 0), METHOD, MADHAB);
    const sunrise = slots.find((s) => s.name === 'sunrise')!;
    const dhuhr = slots.find((s) => s.name === 'dhuhr')!;
    const now = new Date((sunrise.time.getTime() + dhuhr.time.getTime()) / 2);
    expect(findCurrentPrayer(slots, now)).toBeNull();
  });
});

describe('hautes latitudes (résolution polaire)', () => {
  it('Tromsø au solstice → des horaires valides (pas de NaN)', () => {
    // 69.65N : l'angle du Fajr/Isha n'est pas atteint au solstice ; sans
    // résolution polaire adhan renverrait des dates invalides.
    const slots = computeDay(69.6496, 18.956, new Date(2026, 5, 21, 12, 0), METHOD, MADHAB);
    for (const slot of slots) {
      expect(Number.isNaN(slot.time.getTime())).toBe(false);
    }
  });
});

describe('formatage', () => {
  it('formatTime pad sur 24h', () => {
    expect(formatTime(new Date(2026, 0, 1, 5, 4))).toBe('05:04');
    expect(formatTime(new Date(2026, 0, 1, 19, 30))).toBe('19:30');
  });

  it('formatFrenchDate', () => {
    // 29 juin 2026 est un lundi
    expect(formatFrenchDate(new Date(2026, 5, 29))).toBe('lundi 29 juin 2026');
  });

  it('countdownTo clampe à 0 dans le passé et décompose correctement', () => {
    const base = new Date(2026, 0, 1, 12, 0, 0);
    const past = countdownTo(new Date(base.getTime() - 5000), base);
    expect(past.totalMs).toBe(0);

    const future = countdownTo(new Date(base.getTime() + (3600 + 120 + 5) * 1000), base);
    expect(future.hours).toBe(1);
    expect(future.minutes).toBe(2);
    expect(future.seconds).toBe(5);
  });

  it('formatCountdownShort', () => {
    expect(formatCountdownShort({ hours: 1, minutes: 5, seconds: 0, totalMs: 1 })).toBe('1h05');
    expect(formatCountdownShort({ hours: 0, minutes: 38, seconds: 0, totalMs: 1 })).toBe('38 min');
    expect(formatCountdownShort({ hours: 0, minutes: 0, seconds: 12, totalMs: 1 })).toBe('12 s');
  });
});

describe('methodByKey', () => {
  it('retombe sur MWL pour une clé inconnue', () => {
    expect(methodByKey('inconnue').key).toBe('mwl');
    expect(methodByKey('uoif').key).toBe('uoif');
  });
});
