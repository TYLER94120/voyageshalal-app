// Palette de marque VoyagesHalal / GoHalalTravel
// Référence design : nuit / forêt / or / crème
export const Brand = {
  night: '#0b1a0f',   // fond profond
  forest: '#1b4332',  // vert forêt (surfaces, accents)
  gold: '#c9a84c',    // or (titres, sélection)
  cream: '#fdfaf3',   // crème (texte sur fond sombre, cartes)

  // Variantes utilitaires dérivées
  forestLight: '#2d6a4f',
  goldSoft: 'rgba(201, 168, 76, 0.16)',
  nightSoft: 'rgba(11, 26, 15, 0.6)',
  creamMuted: 'rgba(253, 250, 243, 0.66)',
  border: 'rgba(201, 168, 76, 0.28)',
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
