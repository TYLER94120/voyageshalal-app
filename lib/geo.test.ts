import { distanceKm, formatDistance } from './geo';

describe('distanceKm', () => {
  it('≈ 0 pour le même point', () => {
    expect(distanceKm(48.85, 2.35, 48.85, 2.35)).toBeLessThan(0.001);
  });

  it('Paris → Londres ≈ 344 km', () => {
    const d = distanceKm(48.8566, 2.3522, 51.5074, -0.1278);
    expect(d).toBeGreaterThan(330);
    expect(d).toBeLessThan(360);
  });
});

describe('formatDistance', () => {
  it('mètres sous 1 km, km au-delà', () => {
    expect(formatDistance(0.42)).toBe('420 m');
    expect(formatDistance(2.34)).toBe('2.3 km');
    expect(formatDistance(0.999)).toBe('999 m');
  });
});
