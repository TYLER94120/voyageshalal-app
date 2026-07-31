import { cityCivilDate, formatTimeInTz, timezoneFor } from './cityTime';

describe('timezoneFor', () => {
  it('retrouve le fuseau IANA depuis les coordonnées', () => {
    expect(timezoneFor(35.68, 139.76)).toBe('Asia/Tokyo');
    expect(timezoneFor(48.85, 2.35)).toBe('Europe/Paris');
    expect(timezoneFor(34.92, -2.32)).toBe('Africa/Casablanca');
  });
});

describe('formatTimeInTz', () => {
  const instant = new Date('2026-06-29T03:00:00Z'); // 03:00 UTC
  it('affiche l’heure DE LA VILLE, pas celle de l’appareil', () => {
    expect(formatTimeInTz(instant, 'Asia/Tokyo')).toBe('12:00'); // UTC+9
    expect(formatTimeInTz(instant, 'Europe/Paris')).toBe('05:00'); // été UTC+2
  });
  it('date invalide → --:--', () => {
    expect(formatTimeInTz(new Date(NaN), 'Asia/Tokyo')).toBe('--:--');
  });
});

describe('cityCivilDate', () => {
  it('vers minuit, prend le jour civil de la ville (Tokyo déjà demain)', () => {
    const lateParisEvening = new Date('2026-06-29T21:00:00Z'); // 30 juin 06:00 à Tokyo
    const d = cityCivilDate(lateParisEvening, 'Asia/Tokyo');
    expect(d.getDate()).toBe(30);
    expect(d.getMonth()).toBe(5);
  });
});
