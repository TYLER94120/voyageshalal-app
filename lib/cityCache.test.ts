import { isValidCachedDetail, isValidCachedList, villeCacheKey } from './cityCache';

describe('villeCacheKey', () => {
  it('préfixe stable par slug', () => {
    expect(villeCacheKey('tokyo')).toBe('@voyageshalal/ville/tokyo');
  });
});

describe('isValidCachedDetail', () => {
  it('accepte un détail bien formé', () => {
    expect(
      isValidCachedDetail({ nom: 'Tokyo', restaurants: [], hotels: [], mosquees: [] }),
    ).toBe(true);
  });
  it('rejette une forme incomplète ou invalide', () => {
    expect(isValidCachedDetail({ nom: 'Tokyo' })).toBe(false);
    expect(isValidCachedDetail(null)).toBe(false);
    expect(isValidCachedDetail({ restaurants: [], hotels: [], mosquees: [] })).toBe(false);
  });
});

describe('isValidCachedList', () => {
  it('accepte une liste de villes', () => {
    expect(isValidCachedList([{ nom: 'Tokyo' }, { nom: 'Paris' }])).toBe(true);
    expect(isValidCachedList([])).toBe(true);
  });
  it('rejette ce qui n’est pas une liste de villes', () => {
    expect(isValidCachedList(null)).toBe(false);
    expect(isValidCachedList([{ slug: 'x' }])).toBe(false);
  });
});
