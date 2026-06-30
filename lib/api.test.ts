import { parseVillesPayload, parseVilleDetailPayload } from './api';

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

// Échantillon fidèle au détail /api/villes/tokyo.
const DETAIL = {
  nom: 'Tokyo',
  slug: 'tokyo',
  pays: 'Japon',
  coordonnees: { lat: 35.6762, lng: 139.6503 },
  restaurants: [
    {
      nom: 'Naritaya Halal Ramen Asakusa',
      type: 'Traditionnel local',
      score: 4.4,
      adresse: 'Asakusa',
      mapsUrl: 'https://maps.google.com/?q=Naritaya+Halal+Ramen+Asakusa+Tokyo',
      priceRange: '€€',
      specialite: 'Ramen halal',
      id: 'r1',
    },
  ],
  hotels: [
    {
      nom: 'Aman Tokyo',
      categorie: 'Luxe',
      score: 4.5,
      adresse: 'Otemachi',
      mapsUrl: 'https://maps.google.com/?q=Aman+Tokyo+Tokyo',
      priceRange: '€€€€',
      id: 'h1',
    },
  ],
  mosqueesPrincipales: [
    { nom: 'Tokyo Camii', adresse: 'Shibuya', coordonnees: { lat: 35.68, lng: 139.69 }, id: 'm1' },
  ],
};

describe('parseVilleDetailPayload', () => {
  it('lit restaurants/hôtels avec note, type, prix et lien Maps (sans coords)', () => {
    const d = parseVilleDetailPayload(DETAIL)!;
    expect(d.restaurants).toHaveLength(1);
    const r = d.restaurants[0];
    expect(r.nom).toBe('Naritaya Halal Ramen Asakusa');
    expect(r.note).toBe(4.4);
    expect(r.category).toBe('Traditionnel local');
    expect(r.price).toBe('€€');
    expect(r.mapsUrl).toContain('maps.google.com');
    expect(r.latitude).toBeUndefined();

    const h = d.hotels[0];
    expect(h.category).toBe('Luxe');
    expect(h.price).toBe('€€€€');
  });

  it('mappe mosqueesPrincipales (avec coords) vers mosquees', () => {
    const d = parseVilleDetailPayload(DETAIL)!;
    expect(d.mosquees).toHaveLength(1);
    expect(d.mosquees[0].nom).toBe('Tokyo Camii');
    expect(d.mosquees[0].latitude).toBeCloseTo(35.68, 2);
  });

  it('fusionne infoPratique + infos_pratiques en infos structurées ordonnées', () => {
    const payload = {
      nom: 'Tokyo',
      infoPratique: {
        visa: 'Exemption 90 jours',
        transport: 'Métro JR, Suica',
        decalageHoraire: '+8h',
      },
      infos_pratiques: {
        langue: 'Japonais',
        monnaie: 'Yen (JPY)',
        appel_priere: '5 fois par jour',
        securite: 'Précautions habituelles',
      },
    };
    const d = parseVilleDetailPayload(payload)!;
    const byKey = Object.fromEntries(d.pratiqueInfos.map((p) => [p.key, p.value]));
    expect(byKey.visa).toBe('Exemption 90 jours');
    expect(byKey.langue).toBe('Japonais');
    expect(byKey.monnaie).toBe('Yen (JPY)');
    expect(byKey.appel_priere).toBe('5 fois par jour');
    // Ordre logique : visa avant langue avant transport.
    const keys = d.pratiqueInfos.map((p) => p.key);
    expect(keys.indexOf('visa')).toBeLessThan(keys.indexOf('langue'));
    expect(keys.indexOf('langue')).toBeLessThan(keys.indexOf('transport'));
  });

  it('pratiqueInfos vide si aucune info pratique', () => {
    const d = parseVilleDetailPayload({ nom: 'Ville X' })!;
    expect(d.pratiqueInfos).toEqual([]);
  });
});
