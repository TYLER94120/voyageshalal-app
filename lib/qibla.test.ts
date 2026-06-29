import {
  KAABA,
  angleDelta,
  distanceToKaabaKm,
  norm360,
  qiblaBearing,
  qiblaOffset,
  smoothHeading,
  turnGuidance,
} from './qibla';

describe('norm360 / angleDelta', () => {
  it('norm360 ramène dans [0,360)', () => {
    expect(norm360(-10)).toBe(350);
    expect(norm360(370)).toBe(10);
    expect(norm360(720)).toBe(0);
  });

  it('angleDelta donne le plus court écart signé', () => {
    expect(angleDelta(10, 350)).toBe(20);
    expect(angleDelta(350, 10)).toBe(-20);
    expect(angleDelta(0, 180)).toBe(180);
  });
});

describe('smoothHeading', () => {
  it('prev null → next tel quel', () => {
    expect(smoothHeading(null, 123)).toBe(123);
  });

  it('avance vers la cible le long du plus court arc', () => {
    expect(smoothHeading(0, 10, 0.5)).toBe(5);
  });

  it('gère le passage 360→0', () => {
    expect(smoothHeading(350, 10, 0.5)).toBe(0);
  });
});

describe('Qibla depuis Paris', () => {
  const PARIS = { lat: 48.8566, lng: 2.3522 };

  it('cap ~ sud-est (≈ 119°)', () => {
    const b = qiblaBearing(PARIS.lat, PARIS.lng);
    expect(b).toBeGreaterThan(115);
    expect(b).toBeLessThan(122);
  });

  it('distance ≈ 4460 km', () => {
    const d = distanceToKaabaKm(PARIS.lat, PARIS.lng);
    expect(d).toBeGreaterThan(4400);
    expect(d).toBeLessThan(4550);
  });

  it('distance ≈ 0 à la Kaaba', () => {
    expect(distanceToKaabaKm(KAABA.latitude, KAABA.longitude)).toBeLessThan(1);
  });
});

describe('qiblaOffset / turnGuidance', () => {
  it('offset = écart absolu', () => {
    expect(qiblaOffset(100, 119)).toBe(19);
    expect(qiblaOffset(119, 100)).toBe(19);
  });

  it('aligné dans la tolérance', () => {
    expect(turnGuidance(117, 119, 5)).toBe('Aligné avec la Qibla');
  });

  it('indique le sens de rotation', () => {
    expect(turnGuidance(100, 119)).toBe('Tournez à droite de 19°');
    expect(turnGuidance(119, 100)).toBe('Tournez à gauche de 19°');
  });
});
