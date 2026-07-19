import { badgesFor, levelFor, nextLevel, EMPTY_CONTRIB } from './contrib';

describe('levelFor', () => {
  it('progression Voyageur → Ambassadeur', () => {
    expect(levelFor(0).key).toBe('voyageur');
    expect(levelFor(1).key).toBe('eclaireur');
    expect(levelFor(4).key).toBe('eclaireur');
    expect(levelFor(5).key).toBe('guide');
    expect(levelFor(15).key).toBe('ambassadeur');
    expect(levelFor(100).key).toBe('ambassadeur');
  });
});

describe('nextLevel', () => {
  it('indique le prochain palier et le restant', () => {
    expect(nextLevel(0)).toMatchObject({ level: { key: 'eclaireur' }, remaining: 1 });
    expect(nextLevel(3)).toMatchObject({ level: { key: 'guide' }, remaining: 2 });
    expect(nextLevel(15)).toBeNull(); // niveau max
  });
});

describe('badgesFor', () => {
  it('badges gagnés selon la contribution', () => {
    const none = badgesFor(EMPTY_CONTRIB);
    expect(none.every((b) => !b.earned)).toBe(true);
    const some = badgesFor({ spotsAdded: 5, confirmedIds: ['a'] });
    const earned = some.filter((b) => b.earned).map((b) => b.key);
    expect(earned).toEqual(expect.arrayContaining(['premier', 'cinq', 'verificateur']));
    expect(earned).not.toContain('quinze');
  });
});
