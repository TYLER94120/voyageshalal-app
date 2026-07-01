import type { Lieu } from './api';
import {
  applyHotelFilter,
  EMPTY_HOTEL_FILTER,
  hasActiveHotelFilter,
  hotelFacets,
  priceBandOf,
  type HotelForFilter,
} from './hotelFilter';

function hotel(over: Partial<HotelForFilter>): HotelForFilter {
  return { id: over.id ?? 'x', nom: over.nom ?? 'H', ...over };
}

describe('priceBandOf', () => {
  it('range chaque prix dans sa bande', () => {
    expect(priceBandOf(40)).toBe('lt50');
    expect(priceBandOf(50)).toBe('b50_100');
    expect(priceBandOf(99)).toBe('b50_100');
    expect(priceBandOf(150)).toBe('b100_200');
    expect(priceBandOf(400)).toBe('gt200');
  });
  it('null si inconnu', () => {
    expect(priceBandOf(undefined)).toBeNull();
    expect(priceBandOf(null)).toBeNull();
    expect(priceBandOf(NaN)).toBeNull();
  });
});

describe('hotelFacets — graceful', () => {
  it('ne remonte que les groupes qui ont de la donnée', () => {
    const hotels: HotelForFilter[] = [
      hotel({ id: 'a', prixNuitEur: 40, category: 'Riad / Villa', salleDePriere: true, loc: { nearestMosqueKm: 0.3, restosNear: 2 } }),
      hotel({ id: 'b', category: 'Premium' }),
    ];
    const f = hotelFacets(hotels);
    expect(f.bands).toEqual(['lt50']);
    expect(f.types).toEqual(['Premium', 'Riad / Villa']);
    expect(f.amenities).toEqual(['salleDePriere']);
    expect(f.hasLocation).toBe(true);
    expect(f.hasRestos).toBe(true);
  });
  it('aucune facette quand rien n’est rempli', () => {
    const f = hotelFacets([hotel({ id: 'a' }), hotel({ id: 'b' })]);
    expect(f.bands).toEqual([]);
    expect(f.types).toEqual([]);
    expect(f.amenities).toEqual([]);
    expect(f.hasLocation).toBe(false);
    expect(f.hasRestos).toBe(false);
  });
});

describe('applyHotelFilter', () => {
  const hotels: HotelForFilter[] = [
    hotel({ id: 'cheapNear', prixNuitEur: 45, category: 'Budget', salleDePriere: true, sansAlcool: true, loc: { nearestMosqueKm: 0.3, restosNear: 3 } }),
    hotel({ id: 'midFar', prixNuitEur: 120, category: 'Premium', sansAlcool: true, loc: { nearestMosqueKm: 1.2, restosNear: 0 } }),
    hotel({ id: 'lux', prixNuitEur: 300, category: 'Premium', loc: { nearestMosqueKm: 0.4, restosNear: 5 } }),
  ];

  it('bandes de prix (OU)', () => {
    const out = applyHotelFilter(hotels, { ...EMPTY_HOTEL_FILTER, bands: ['lt50', 'gt200'] });
    expect(out.map((h) => h.id).sort()).toEqual(['cheapNear', 'lux']);
  });
  it('≤ 500 m mosquée', () => {
    const out = applyHotelFilter(hotels, { ...EMPTY_HOTEL_FILTER, nearMosque: true });
    expect(out.map((h) => h.id).sort()).toEqual(['cheapNear', 'lux']);
  });
  it('restos halal autour', () => {
    const out = applyHotelFilter(hotels, { ...EMPTY_HOTEL_FILTER, restosAround: true });
    expect(out.map((h) => h.id).sort()).toEqual(['cheapNear', 'lux']);
  });
  it('type (OU)', () => {
    const out = applyHotelFilter(hotels, { ...EMPTY_HOTEL_FILTER, types: ['Premium'] });
    expect(out.map((h) => h.id).sort()).toEqual(['lux', 'midFar']);
  });
  it('équipements (ET)', () => {
    const out = applyHotelFilter(hotels, { ...EMPTY_HOTEL_FILTER, amenities: ['salleDePriere', 'sansAlcool'] });
    expect(out.map((h) => h.id)).toEqual(['cheapNear']);
  });
  it('combinaison budget + emplacement + équipement', () => {
    const out = applyHotelFilter(hotels, {
      ...EMPTY_HOTEL_FILTER,
      bands: ['lt50', 'b50_100'],
      nearMosque: true,
      amenities: ['sansAlcool'],
    });
    expect(out.map((h) => h.id)).toEqual(['cheapNear']);
  });
  it('sans filtre : tout passe', () => {
    expect(applyHotelFilter(hotels, EMPTY_HOTEL_FILTER)).toHaveLength(3);
  });
});

describe('hasActiveHotelFilter', () => {
  it('détecte un filtre actif', () => {
    expect(hasActiveHotelFilter(EMPTY_HOTEL_FILTER)).toBe(false);
    expect(hasActiveHotelFilter({ ...EMPTY_HOTEL_FILTER, nearMosque: true })).toBe(true);
    expect(hasActiveHotelFilter({ ...EMPTY_HOTEL_FILTER, bands: ['lt50'] })).toBe(true);
  });
});
