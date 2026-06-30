import type { Lieu } from './api';
import type { OsmPlace } from './overpass';
import { mergeMosquees, osmToLieu } from './mosques';

function L(over: Partial<Lieu>): Lieu {
  return { id: over.id ?? 'x', nom: over.nom ?? 'M', ...over };
}

describe('osmToLieu', () => {
  it('convertit un OsmPlace en Lieu', () => {
    const p: OsmPlace = { id: 'node/1', name: 'Mosquée X', latitude: 48.85, longitude: 2.35 };
    const l = osmToLieu(p);
    expect(l).toMatchObject({ id: 'osm-node/1', nom: 'Mosquée X', latitude: 48.85, longitude: 2.35 });
  });
});

describe('mergeMosquees', () => {
  it('supprime les doublons géographiques en gardant la fiche API', () => {
    const api = [L({ id: 'api1', nom: 'Grande Mosquée', latitude: 48.857, longitude: 2.352 })];
    const osm = [
      // ~10 m de l'API → doublon, ignoré
      L({ id: 'osm1', nom: 'Mosquée', latitude: 48.8571, longitude: 2.3521 }),
      // loin → conservé
      L({ id: 'osm2', nom: 'Mosquée de quartier', latitude: 48.87, longitude: 2.36 }),
    ];
    const out = mergeMosquees(api, osm);
    expect(out.map((m) => m.id)).toEqual(['api1', 'osm2']);
  });

  it('garde toutes les mosquées distinctes', () => {
    const osm = [
      L({ id: 'a', latitude: 48.85, longitude: 2.35 }),
      L({ id: 'b', latitude: 48.90, longitude: 2.40 }),
    ];
    expect(mergeMosquees([], osm)).toHaveLength(2);
  });

  it('conserve les entrées sans coordonnées (pas de dédup possible)', () => {
    const api = [L({ id: 'noco', nom: 'Sans coords' })];
    const osm = [L({ id: 'o', latitude: 48.85, longitude: 2.35 })];
    expect(mergeMosquees(api, osm).map((m) => m.id)).toEqual(['noco', 'o']);
  });
});
