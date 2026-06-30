// Données de démonstration pour les filtres non encore branchés à une vraie
// source (restaurants halal, hôtels, boucheries). Les points sont générés
// AUTOUR de la position de l'utilisateur (et non fixés sur Paris) afin de
// rester visibles où qu'il soit. À remplacer par une vraie source plus tard.

export interface MapPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  demo?: boolean;
}

export type DemoCategory = 'restaurants' | 'hotels' | 'commerces';

// Décalages fixes (≈ 0.4 à 3 km) pour un rendu stable d'un render à l'autre.
const OFFSETS = [
  { dLat: 0.006, dLng: 0.004 },
  { dLat: -0.005, dLng: 0.009 },
  { dLat: 0.011, dLng: -0.007 },
  { dLat: -0.009, dLng: -0.006 },
  { dLat: 0.003, dLng: 0.014 },
];

const NAMES: Record<DemoCategory, string[]> = {
  restaurants: [
    'Restaurant Halal Le Cèdre',
    'Snack Halal Istanbul',
    'Le Sultan — Cuisine Halal',
    'Halal Food House',
    'Chez Brahim',
  ],
  hotels: [
    'Hôtel Al Andalus',
    'Résidence Salam',
    'Hôtel du Croissant',
    'Riad Hôtel',
    'Hôtel Médina',
  ],
  commerces: [
    'Boucherie Halal Al Baraka',
    'Épicerie Orientale du Marché',
    'Boucherie El Medina',
    'Halal Market',
    'Boucherie Sary',
  ],
};

export function demoPlacesAround(
  category: DemoCategory,
  latitude: number,
  longitude: number,
): MapPlace[] {
  const names = NAMES[category];
  return OFFSETS.map((o, i) => ({
    id: `${category}-${i}`,
    name: names[i],
    latitude: latitude + o.dLat,
    longitude: longitude + o.dLng,
    demo: true,
  }));
}
