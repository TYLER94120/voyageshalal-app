import { parseSpotsPayload, spotTypeLabel } from './spots';
import { isValidAdminCode } from './admin';

describe('spotTypeLabel', () => {
  it('libellé pour un type connu, repli sinon', () => {
    expect(spotTypeLabel('salle')).toContain('Salle de prière');
    expect(spotTypeLabel('mosquee')).toContain('Mosquée');
    expect(spotTypeLabel(undefined)).toContain('Spot de prière');
    expect(spotTypeLabel('inconnu')).toContain('Spot de prière');
  });
});

describe('parseSpotsPayload', () => {
  it('accepte { spots: [...] } et normalise', () => {
    const out = parseSpotsPayload({
      spots: [{ id: 's1', name: 'Coin prière gare', lat: 48.8, lng: 2.3, note: 'Calme', photo: 'http://x/y.jpg' }],
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: 's1', nom: 'Coin prière gare', latitude: 48.8, longitude: 2.3, note: 'Calme' });
    expect(out[0].photoUrl).toBe('http://x/y.jpg');
  });
  it('accepte un tableau brut et des coords imbriquées', () => {
    const out = parseSpotsPayload([{ coords: { lat: 1, lng: 2 } }]);
    expect(out).toHaveLength(1);
    expect(out[0].nom).toBe('Spot de prière'); // repli
  });
  it('lit le type de lieu (plusieurs clés acceptées)', () => {
    const out = parseSpotsPayload([
      { lat: 1, lng: 2, type: 'salle' },
      { lat: 3, lng: 4, type_lieu: 'coin' },
    ]);
    expect(out[0].type).toBe('salle');
    expect(out[1].type).toBe('coin');
  });
  it('ignore les entrées sans coordonnées ; tolère le vide', () => {
    expect(parseSpotsPayload({ spots: [{ nom: 'X' }] })).toEqual([]);
    expect(parseSpotsPayload(null)).toEqual([]);
    expect(parseSpotsPayload({})).toEqual([]);
  });
});

describe('isValidAdminCode', () => {
  it('exige au moins 6 caractères', () => {
    expect(isValidAdminCode('abc')).toBe(false);
    expect(isValidAdminCode('  short ')).toBe(false);
    expect(isValidAdminCode('cleadmin2026')).toBe(true);
  });
});
