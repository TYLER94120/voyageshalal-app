import type { Lieu } from './api';
import {
  applyLieuFilters,
  categoryFacets,
  EMPTY_FILTERS,
  hasActiveFilters,
  isGratuit,
  priceRank,
  sortLieux,
  sortOptionsFor,
  tagFacets,
  tagLabel,
  type LieuDist,
} from './lieuSort';

function lieu(over: Partial<Lieu>): Lieu {
  return { id: over.id ?? 'x', nom: over.nom ?? 'L', ...over };
}

describe('priceRank', () => {
  it('compte les €', () => {
    expect(priceRank('€')).toBe(1);
    expect(priceRank('€€€')).toBe(3);
  });
  it('gère Gratuit', () => {
    expect(priceRank('Gratuit')).toBe(0);
    expect(priceRank('gratuit')).toBe(0);
  });
  it('null si absent ou non reconnu', () => {
    expect(priceRank(undefined)).toBeNull();
    expect(priceRank('abc')).toBeNull();
  });
});

describe('sortLieux', () => {
  const data: LieuDist[] = [
    { ...lieu({ id: 'a', note: 4.0, reviewCount: 10, price: '€€€' }), dist: 5 },
    { ...lieu({ id: 'b', note: 4.8, reviewCount: 1000, price: '€' }), dist: 2 },
    { ...lieu({ id: 'c', note: 3.5, reviewCount: 50, price: '€€' }), dist: 9 },
  ];

  it('proche : distance croissante', () => {
    expect(sortLieux(data, 'proche').map((l) => l.id)).toEqual(['b', 'a', 'c']);
  });
  it('note : décroissante', () => {
    expect(sortLieux(data, 'note').map((l) => l.id)).toEqual(['b', 'a', 'c']);
  });
  it('populaire : avis décroissants', () => {
    expect(sortLieux(data, 'populaire').map((l) => l.id)).toEqual(['b', 'c', 'a']);
  });
  it('prix : du moins cher au plus cher', () => {
    expect(sortLieux(data, 'prix').map((l) => l.id)).toEqual(['b', 'c', 'a']);
  });
  it('ne mute pas la liste source', () => {
    const before = data.map((l) => l.id);
    sortLieux(data, 'note');
    expect(data.map((l) => l.id)).toEqual(before);
  });
  it('valeurs manquantes en bas', () => {
    const arr: LieuDist[] = [{ ...lieu({ id: 'x' }), dist: null }, { ...lieu({ id: 'y' }), dist: 1 }];
    expect(sortLieux(arr, 'proche').map((l) => l.id)).toEqual(['y', 'x']);
  });
  it('situe : meilleur score d’emplacement en premier', () => {
    const arr: LieuDist[] = [
      { ...lieu({ id: 'a' }), locScore: 2 },
      { ...lieu({ id: 'b' }), locScore: 9 },
      { ...lieu({ id: 'c' }), locScore: null },
    ];
    expect(sortLieux(arr, 'situe').map((l) => l.id)).toEqual(['b', 'a', 'c']);
  });
});

describe('sortOptionsFor — bien situés', () => {
  it('ajoute « situe » en tête quand un locScore existe', () => {
    const arr: LieuDist[] = [{ ...lieu({ note: 4 }), locScore: 7 }];
    const keys = sortOptionsFor(arr, false).map((o) => o.key);
    expect(keys[0]).toBe('situe');
  });
  it('pas de « situe » sans score', () => {
    expect(sortOptionsFor([lieu({ note: 4 })], false).map((o) => o.key)).not.toContain('situe');
  });
});

describe('sortOptionsFor', () => {
  it('masque les options sans donnée', () => {
    const arr = [lieu({ note: 4.2 }), lieu({ note: 3.9 })];
    const keys = sortOptionsFor(arr, false).map((o) => o.key);
    expect(keys).toContain('note');
    expect(keys).not.toContain('proche');
    expect(keys).not.toContain('populaire');
  });
  it('proche seulement si distance demandée ET coords présentes', () => {
    const arr = [lieu({ latitude: 1, longitude: 2 })];
    expect(sortOptionsFor(arr, true).map((o) => o.key)).toContain('proche');
    expect(sortOptionsFor(arr, false).map((o) => o.key)).not.toContain('proche');
  });
});

describe('facettes', () => {
  const arr = [
    lieu({ category: 'Turc', tags: ['familial', 'livraison'] }),
    lieu({ category: 'Japonais', tags: ['romantique', 'calme'] }),
    lieu({ category: 'Turc', tags: ['familial'] }),
  ];
  it('catégories dédupliquées et triées', () => {
    expect(categoryFacets(arr)).toEqual(['Japonais', 'Turc']);
  });
  it('tags connus ordonnés avant alpha', () => {
    expect(tagFacets(arr)).toEqual(['familial', 'romantique', 'calme', 'livraison']);
  });
  it('libellé joli pour tag connu, repli sinon', () => {
    expect(tagLabel('familial')).toContain('Famille');
    expect(tagLabel('inconnu')).toBe('#inconnu');
  });
});

describe('applyLieuFilters', () => {
  const arr: LieuDist[] = [
    { ...lieu({ id: 'a', category: 'Turc', tags: ['familial', 'calme'], halalConfidence: 'yes', note: 4 }), dist: 3 },
    { ...lieu({ id: 'b', category: 'Japonais', tags: ['romantique'], halalConfidence: 'likely', note: 5 }), dist: 1 },
    { ...lieu({ id: 'c', category: 'Turc', tags: ['familial'], halalConfidence: 'only', note: 3 }), dist: 2 },
  ];

  it('OU entre catégories', () => {
    const out = applyLieuFilters(arr, { ...EMPTY_FILTERS, categories: ['Turc'] }, 'proche');
    expect(out.map((l) => l.id)).toEqual(['c', 'a']);
  });
  it('ET entre tags', () => {
    const out = applyLieuFilters(arr, { ...EMPTY_FILTERS, tags: ['familial', 'calme'] }, 'note');
    expect(out.map((l) => l.id)).toEqual(['a']);
  });
  it('certifié seulement', () => {
    const out = applyLieuFilters(arr, { ...EMPTY_FILTERS, certifOnly: true }, 'note');
    expect(out.map((l) => l.id).sort()).toEqual(['a', 'c']);
  });
  it('filtre + tri combinés', () => {
    const out = applyLieuFilters(arr, { ...EMPTY_FILTERS, categories: ['Turc'] }, 'note');
    expect(out.map((l) => l.id)).toEqual(['a', 'c']);
  });
});

describe('helpers', () => {
  it('isGratuit', () => {
    expect(isGratuit(lieu({ price: 'Gratuit' }))).toBe(true);
    expect(isGratuit(lieu({ price: '€€' }))).toBe(false);
  });
  it('hasActiveFilters', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, gratuitOnly: true })).toBe(true);
  });
});
