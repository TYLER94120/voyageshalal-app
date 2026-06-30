import {
  addFavorite,
  cityFavKey,
  isFavorite,
  parseFavorites,
  placeFavKey,
  removeFavorite,
  toggleFavorite,
  type FavoriteItem,
} from './favorites';

const city: FavoriteItem = { id: cityFavKey('tokyo'), type: 'city', title: 'Tokyo', addedAt: 1 };

describe('clés', () => {
  it('clés stables et distinctes', () => {
    expect(cityFavKey('tokyo')).toBe('city:tokyo');
    expect(placeFavKey('tokyo', 'h1')).toBe('place:tokyo:h1');
  });
});

describe('add/remove/isFavorite', () => {
  it('ajoute en tête et évite les doublons', () => {
    const a = addFavorite([], city);
    expect(a).toHaveLength(1);
    expect(addFavorite(a, city)).toHaveLength(1);
  });
  it('retire par id', () => {
    expect(removeFavorite([city], city.id)).toHaveLength(0);
  });
  it('isFavorite', () => {
    expect(isFavorite([city], city.id)).toBe(true);
    expect(isFavorite([], city.id)).toBe(false);
  });
});

describe('toggleFavorite', () => {
  it('ajoute puis retire', () => {
    const base = { id: city.id, type: 'city' as const, title: 'Tokyo' };
    const added = toggleFavorite([], base, 123);
    expect(added).toHaveLength(1);
    expect(added[0].addedAt).toBe(123);
    expect(toggleFavorite(added, base, 456)).toHaveLength(0);
  });
});

describe('parseFavorites', () => {
  it('ignore les entrées invalides', () => {
    const raw = [
      { id: 'city:x', type: 'city', title: 'X', addedAt: 1 },
      { id: 'bad', type: 'unknown', title: 'Y' },
      { type: 'city', title: 'no id' },
      null,
      'nope',
    ];
    const out = parseFavorites(raw);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('city:x');
  });
  it('non-tableau → vide', () => {
    expect(parseFavorites(null)).toEqual([]);
    expect(parseFavorites({})).toEqual([]);
  });
});
