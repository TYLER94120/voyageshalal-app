import type { Lieu, VilleDetail } from './api';
import { autoPlanTrip, pickVaried } from './autoPlan';

function lieu(over: Partial<Lieu>): Lieu {
  return { id: over.id ?? 'x', nom: over.nom ?? 'L', ...over };
}

function ville(over: Partial<VilleDetail>): VilleDetail {
  return {
    slug: 'tokyo',
    nom: 'Tokyo',
    restaurants: [],
    mosquees: [],
    hotels: [],
    activites: [],
    pratiqueInfos: [],
    selections: [],
    ...over,
  };
}

describe('pickVaried', () => {
  it('privilégie la variété de catégorie puis complète', () => {
    const data = [
      { id: 'a', c: 'jap' },
      { id: 'b', c: 'jap' },
      { id: 'c', c: 'turc' },
      { id: 'd', c: 'indien' },
    ];
    const out = pickVaried(data, 3, (x) => x.c);
    // une de chaque catégorie d'abord : jap, turc, indien
    expect(out.map((x) => x.id)).toEqual(['a', 'c', 'd']);
  });
  it('complète si pas assez de catégories', () => {
    const data = [
      { id: 'a', c: 'jap' },
      { id: 'b', c: 'jap' },
    ];
    expect(pickVaried(data, 2, (x) => x.c).map((x) => x.id)).toEqual(['a', 'b']);
  });
});

describe('autoPlanTrip', () => {
  const v = ville({
    hotels: [
      lieu({ id: 'h1', nom: 'Bof', note: 3, latitude: 35.9, longitude: 139.9 }),
      lieu({ id: 'h2', nom: 'Bien situé', note: 4, latitude: 35.681, longitude: 139.766 }),
    ],
    mosquees: [lieu({ id: 'm1', nom: 'Camii', latitude: 35.6815, longitude: 139.7665 })],
    restaurants: [
      lieu({ id: 'r1', nom: 'Sushi A', category: 'Japonais', note: 4.8, halalConfidence: 'yes' }),
      lieu({ id: 'r2', nom: 'Sushi B', category: 'Japonais', note: 4.7 }),
      lieu({ id: 'r3', nom: 'Kebab', category: 'Turc', note: 4.2 }),
      lieu({ id: 'r4', nom: 'Curry', category: 'Indien', note: 4.0 }),
    ],
    activites: [
      lieu({ id: 'a1', nom: 'Temple', category: 'Culture', note: 4.6 }),
      lieu({ id: 'a2', nom: 'Parc', category: 'Nature', note: 4.3 }),
    ],
    selections: [{ key: 'incontournables', label: 'Incontournables', icon: '⭐', names: ['Kebab'] }],
  });

  it('choisit l’hôtel le mieux situé', () => {
    const { items } = autoPlanTrip(v, 2);
    const hotel = items.find((i) => i.type === 'hotel');
    expect(hotel?.title).toBe('Bien situé');
    expect(hotel?.day).toBe(1);
  });

  it('répartit restaurants et activités sur les jours, variés', () => {
    const { items, counts } = autoPlanTrip(v, 2);
    const restos = items.filter((i) => i.type === 'restaurant');
    expect(counts.restaurants).toBeGreaterThanOrEqual(3);
    // variété : les 3 premières catégories distinctes d'abord
    const cats = restos.slice(0, 3).map((r) => r.subtitle);
    expect(new Set(cats).size).toBeGreaterThanOrEqual(3);
    // réparti sur 2 jours
    expect(new Set(restos.map((r) => r.day)).size).toBe(2);
  });

  it('ville vide → programme vide', () => {
    const { items } = autoPlanTrip(ville({}), 3);
    expect(items).toEqual([]);
  });
});
