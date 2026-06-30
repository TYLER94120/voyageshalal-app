import { parseVillesPayload } from './api';

// Échantillon fidèle à la vraie réponse /api/villes (coords imbriquées).
const PAYLOAD = {
  count: 3,
  villes: [
    {
      slug: 'tokyo',
      nom: 'Tokyo',
      pays: 'Japon',
      continent: 'Asie',
      region: 'Asie de l’Est',
      image: 'https://example.com/tokyo.jpg',
      coordonnees: { lat: 35.6762, lng: 139.6503 },
      statistiques: { mosquees: 40 },
    },
    {
      slug: 'paris',
      nom: 'Paris',
      pays: 'France',
      region: 'Europe de l’Ouest',
      coordonnees: { lat: 48.8566, lng: 2.3522 },
    },
    {
      slug: 'dubai',
      nom: 'Dubaï',
      pays: 'Émirats Arabes Unis',
      coordonnees: { lat: 25.2048, lng: 55.2708 },
    },
  ],
};

describe('parseVillesPayload', () => {
  it('extrait la liste sous la clé "villes" et trie par nom', () => {
    const villes = parseVillesPayload(PAYLOAD);
    expect(villes).toHaveLength(3);
    expect(villes.map((v) => v.slug)).toEqual(['dubai', 'paris', 'tokyo']);
  });

  it('lit les coordonnées imbriquées coordonnees.lat/lng', () => {
    const tokyo = parseVillesPayload(PAYLOAD).find((v) => v.slug === 'tokyo')!;
    expect(tokyo.latitude).toBeCloseTo(35.6762, 3);
    expect(tokyo.longitude).toBeCloseTo(139.6503, 3);
    expect(tokyo.pays).toBe('Japon');
    expect(tokyo.region).toBe('Asie de l’Est');
  });

  it('tolère un tableau brut et une charge vide', () => {
    expect(parseVillesPayload([{ slug: 'x', nom: 'X', coordonnees: { lat: 1, lng: 2 } }])).toHaveLength(1);
    expect(parseVillesPayload(null)).toEqual([]);
    expect(parseVillesPayload({})).toEqual([]);
  });
});
