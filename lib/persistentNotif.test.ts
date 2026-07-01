import { buildPersistentContent } from './persistentNotif';

describe('buildPersistentContent', () => {
  // Paris, un jour fixe (calcul adhan déterministe).
  const c = buildPersistentContent(48.8566, 2.3522, new Date('2026-06-29T09:00:00'), 'mwl', 'shafi');

  it('titre stable', () => {
    expect(c.title).toContain('Horaires de prière');
  });
  it('corps : les 5 prières avec un horaire HH:mm', () => {
    for (const label of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
      expect(c.body).toContain(label);
    }
    expect(c.body).toMatch(/\d{2}:\d{2}/);
  });
  it('sous-titre : prochaine prière', () => {
    expect(c.subtitle).toContain('Prochaine :');
    expect(c.subtitle).toMatch(/\d{2}:\d{2}/);
  });
});
