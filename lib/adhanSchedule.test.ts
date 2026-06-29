import { buildSchedule } from './adhanSchedule';

const LAT = 48.8566;
const LNG = 2.3522;
const ALL = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };
const NONE = { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };

describe('buildSchedule', () => {
  const now = new Date(2026, 5, 29, 10, 0); // 29 juin 2026, 10h

  it('ne renvoie que des horaires futurs, triés', () => {
    const items = buildSchedule(LAT, LNG, now, 'mwl', 'shafi', ALL, 2);
    expect(items.length).toBeGreaterThan(0);
    for (const it of items) {
      expect(it.date.getTime()).toBeGreaterThan(now.getTime());
    }
    for (let i = 1; i < items.length; i++) {
      expect(items[i].date.getTime()).toBeGreaterThanOrEqual(items[i - 1].date.getTime());
    }
  });

  it('reste sous la limite (≤ jours × 5)', () => {
    const items = buildSchedule(LAT, LNG, now, 'mwl', 'shafi', ALL, 2);
    expect(items.length).toBeLessThanOrEqual(10);
  });

  it('aucune prière activée → liste vide', () => {
    expect(buildSchedule(LAT, LNG, now, 'mwl', 'shafi', NONE, 2)).toEqual([]);
  });

  it('ne programme que les prières activées', () => {
    const onlyMaghrib = { ...NONE, maghrib: true };
    const items = buildSchedule(LAT, LNG, now, 'mwl', 'shafi', onlyMaghrib, 2);
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(2);
    expect(items.every((it) => it.prayer === 'maghrib')).toBe(true);
    expect(items.every((it) => it.label === 'Maghrib')).toBe(true);
  });
});
