import type { Lieu } from './api';
import { hotelLocationStats, nearbyLieux } from './hotelLocation';

function L(over: Partial<Lieu>): Lieu {
  return { id: over.id ?? 'x', nom: over.nom ?? 'L', ...over };
}

// Paris ~ (48.857, 2.352). Petits décalages ≈ centaines de mètres / km.
const hotel = L({ id: 'h', nom: 'Hôtel', latitude: 48.857, longitude: 2.352 });

describe('hotelLocationStats', () => {
  it('hôtel sans coords → score null', () => {
    const s = hotelLocationStats(L({ id: 'h2', nom: 'Sans coords' }), [], []);
    expect(s.score).toBeNull();
    expect(s.nearestMosqueKm).toBeNull();
  });

  it('trouve la mosquée la plus proche et son nom', () => {
    const mosquees = [
      L({ nom: 'Loin', latitude: 48.90, longitude: 2.40 }),
      L({ nom: 'Proche', latitude: 48.858, longitude: 2.353 }),
    ];
    const s = hotelLocationStats(hotel, mosquees, []);
    expect(s.nearestMosqueNom).toBe('Proche');
    expect(s.nearestMosqueKm).not.toBeNull();
    expect(s.nearestMosqueKm!).toBeLessThan(0.3);
  });

  it('compte les restos dans le rayon, ignore ceux hors rayon et sans coords', () => {
    const restos = [
      L({ nom: 'Voisin1', latitude: 48.8575, longitude: 2.3525 }),
      L({ nom: 'Voisin2', latitude: 48.858, longitude: 2.351 }),
      L({ nom: 'Loin', latitude: 49.0, longitude: 2.6 }),
      L({ nom: 'SansCoords' }),
    ];
    const s = hotelLocationStats(hotel, [], restos, 1);
    expect(s.restosNear).toBe(2);
  });

  it('un hôtel proche mosquée + nombreux restos score mieux qu’un isolé', () => {
    const mosquees = [L({ nom: 'M', latitude: 48.8575, longitude: 2.3525 })];
    const restos = [
      L({ latitude: 48.8572, longitude: 2.3522 }),
      L({ latitude: 48.8578, longitude: 2.3528 }),
    ];
    const bien = hotelLocationStats(hotel, mosquees, restos, 1);

    const isole = hotelLocationStats(
      L({ id: 'h3', nom: 'Isolé', latitude: 48.95, longitude: 2.6 }),
      mosquees,
      restos,
      1,
    );
    expect(bien.score!).toBeGreaterThan(isole.score!);
    expect(isole.restosNear).toBe(0);
  });
});

describe('nearbyLieux', () => {
  const list = [
    L({ id: 'a', nom: 'Proche', latitude: 48.8575, longitude: 2.3525 }),
    L({ id: 'b', nom: 'Moyen', latitude: 48.861, longitude: 2.356 }),
    L({ id: 'c', nom: 'Loin', latitude: 49.0, longitude: 2.6 }),
    L({ id: 'd', nom: 'SansCoords' }),
  ];

  it('trie du plus proche au plus loin et respecte le rayon', () => {
    const out = nearbyLieux(48.857, 2.352, list, 2);
    expect(out.map((n) => n.lieu.id)).toEqual(['a', 'b']);
    expect(out[0].distKm).toBeLessThan(out[1].distKm);
  });

  it('applique la limite', () => {
    expect(nearbyLieux(48.857, 2.352, list, 50, 1).map((n) => n.lieu.id)).toEqual(['a']);
  });

  it('ignore les lieux sans coordonnées', () => {
    const out = nearbyLieux(48.857, 2.352, list, 100);
    expect(out.some((n) => n.lieu.id === 'd')).toBe(false);
  });
});
