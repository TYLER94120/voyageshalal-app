import {
  addItem,
  findTripByCity,
  hasItem,
  itemsForDay,
  makeTrip,
  moveItem,
  parseTrips,
  removeItem,
  removeTrip,
  setDays,
  tripItemKey,
  upsertTrip,
  type Trip,
  type TripItem,
} from './trips';

function freshTrip(): Trip {
  return makeTrip('tokyo', 'Tokyo', { latitude: 35.6, longitude: 139.6 }, 1000);
}

const sushi: Omit<TripItem, 'day'> = {
  id: tripItemKey('restaurant', 'r1'),
  lieuId: 'r1',
  type: 'restaurant',
  title: 'Halal Sushi-ya',
  emoji: '🍽️',
};

describe('makeTrip', () => {
  it('crée un séjour vide de 3 jours, id = slug', () => {
    const t = freshTrip();
    expect(t.id).toBe('tokyo');
    expect(t.days).toBe(3);
    expect(t.items).toHaveLength(0);
  });
});

describe('items', () => {
  it('ajoute sans doublon', () => {
    let t = addItem(freshTrip(), sushi, 1, 2000);
    expect(t.items).toHaveLength(1);
    expect(t.items[0].day).toBe(1);
    t = addItem(t, sushi, 2, 3000);
    expect(t.items).toHaveLength(1); // déjà présent
  });
  it('borne le jour au nombre de jours', () => {
    const t = addItem(freshTrip(), sushi, 99, 2000);
    expect(t.items[0].day).toBe(3);
  });
  it('déplace une étape', () => {
    let t = addItem(freshTrip(), sushi, 1, 2000);
    t = moveItem(t, sushi.id, 2, 3000);
    expect(itemsForDay(t, 2).map((i) => i.id)).toEqual([sushi.id]);
    expect(itemsForDay(t, 1)).toHaveLength(0);
  });
  it('retire une étape', () => {
    let t = addItem(freshTrip(), sushi, 1, 2000);
    t = removeItem(t, sushi.id, 3000);
    expect(t.items).toHaveLength(0);
  });
  it('hasItem', () => {
    const t = addItem(freshTrip(), sushi, 1, 2000);
    expect(hasItem(t, sushi.id)).toBe(true);
  });
});

describe('setDays', () => {
  it('réduit les jours et ramène les étapes au dernier jour', () => {
    let t = addItem(freshTrip(), sushi, 3, 2000);
    t = setDays(t, 2, 3000);
    expect(t.days).toBe(2);
    expect(t.items[0].day).toBe(2);
  });
  it('borne entre 1 et 14', () => {
    expect(setDays(freshTrip(), 0, 1).days).toBe(1);
    expect(setDays(freshTrip(), 50, 1).days).toBe(14);
  });
});

describe('collection de séjours', () => {
  it('upsert remplace ou ajoute, findTripByCity, removeTrip', () => {
    const t = freshTrip();
    let list = upsertTrip([], t);
    expect(list).toHaveLength(1);
    const updated = setDays(t, 5, 9999);
    list = upsertTrip(list, updated);
    expect(list).toHaveLength(1);
    expect(findTripByCity(list, 'tokyo')!.days).toBe(5);
    list = removeTrip(list, 'tokyo');
    expect(list).toHaveLength(0);
  });
});

describe('parseTrips', () => {
  it('tolère les entrées invalides', () => {
    const raw = [
      { id: 'tokyo', cityNom: 'Tokyo', days: 3, items: [{ id: 'a' }, 'bad'] },
      { id: 'no-name' },
      null,
    ];
    const out = parseTrips(raw);
    expect(out).toHaveLength(1);
    expect(out[0].items).toHaveLength(1);
  });
  it('non-tableau → vide', () => {
    expect(parseTrips(null)).toEqual([]);
  });
});
