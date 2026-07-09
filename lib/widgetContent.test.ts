import { buildWidgetContent } from './widgetContent';

describe('buildWidgetContent', () => {
  const c = buildWidgetContent(48.8566, 2.3522, new Date('2026-06-29T09:00:00'), 'mwl', 'shafi', 'Paris');

  it('5 lignes, dans l’ordre des prières', () => {
    expect(c.rows.map((r) => r.key)).toEqual(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);
    for (const r of c.rows) expect(r.time).toMatch(/\d{2}:\d{2}/);
  });
  it('exactement une prochaine prière mise en avant (à 9h → Dhuhr)', () => {
    expect(c.rows.filter((r) => r.isNext)).toHaveLength(1);
    expect(c.rows.find((r) => r.isNext)?.key).toBe('dhuhr');
  });
  it('libellé prochaine + ville', () => {
    expect(c.nextLabel).toContain('Dhuhr');
    expect(c.city).toBe('Paris');
  });
  it('après Isha → Fajr (demain)', () => {
    const late = buildWidgetContent(48.8566, 2.3522, new Date('2026-06-29T23:59:00'), 'mwl', 'shafi');
    expect(late.nextLabel).toContain('Fajr');
    expect(late.nextLabel).toContain('demain');
    expect(late.rows.every((r) => !r.isNext)).toBe(true);
  });
});
