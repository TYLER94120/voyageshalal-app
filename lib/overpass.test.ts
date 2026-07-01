import { buildButcherQuery, buildMosqueQuery, parseOverpass } from './overpass';

describe('buildMosqueQuery', () => {
  it('cible les lieux de culte musulmans dans le rayon', () => {
    const q = buildMosqueQuery(48.85, 2.35, 6000);
    expect(q).toContain('"amenity"="place_of_worship"');
    expect(q).toContain('"religion"="muslim"');
    expect(q).toContain('around:6000,48.85,2.35');
    expect(q).toContain('node');
    expect(q).toContain('way');
  });
});

describe('buildButcherQuery', () => {
  it('cible les boucheries halal (diet:halal ou nom halal) dans le rayon', () => {
    const q = buildButcherQuery(48.85, 2.35, 6000);
    expect(q).toContain('"shop"="butcher"');
    expect(q).toContain('"diet:halal"');
    expect(q).toContain('"name"~"halal",i');
    expect(q).toContain('around:6000,48.85,2.35');
  });
});

describe('parseOverpass — nom par défaut personnalisable', () => {
  it('utilise le repli fourni (ex. boucherie)', () => {
    const places = parseOverpass(
      { elements: [{ type: 'node', id: 5, lat: 1, lon: 2, tags: {} }] },
      'Boucherie halal',
    );
    expect(places[0].name).toBe('Boucherie halal');
  });
});

describe('parseOverpass', () => {
  it('lit les nœuds et le centre des ways, avec repli de nom', () => {
    const payload = {
      elements: [
        { type: 'node', id: 1, lat: 48.86, lon: 2.34, tags: { name: 'Grande Mosquée' } },
        { type: 'way', id: 2, center: { lat: 48.87, lon: 2.36 }, tags: {} },
        { type: 'node', id: 3, tags: { name: 'Sans coord' } }, // ignoré (pas de coord)
      ],
    };
    const places = parseOverpass(payload);
    expect(places).toHaveLength(2);
    expect(places[0]).toMatchObject({ name: 'Grande Mosquée', latitude: 48.86, longitude: 2.34 });
    expect(places[1].name).toBe('Mosquée'); // repli
    expect(places[1].latitude).toBe(48.87);
    expect(places[0].id).toBe('node/1');
  });

  it('tolère une charge utile vide ou invalide', () => {
    expect(parseOverpass(null)).toEqual([]);
    expect(parseOverpass({})).toEqual([]);
    expect(parseOverpass({ elements: 'nope' })).toEqual([]);
  });

  it('utilise name:fr / name:ar en repli', () => {
    const places = parseOverpass({
      elements: [{ type: 'node', id: 9, lat: 1, lon: 2, tags: { 'name:fr': 'Mosquée de Paris' } }],
    });
    expect(places[0].name).toBe('Mosquée de Paris');
  });
});
