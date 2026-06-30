// ─────────────────────────────────────────────────────────────────────────────
// Tri & filtres des lieux d'une fiche ville (restaurants / activités / hôtels).
//
// Tout est piloté par les données : les facettes (cuisines, thèmes, ambiances)
// sont extraites de la liste réelle de la ville, donc ça marche pour les 157
// villes sans configuration. Fonctions pures → testables sans réseau.
// ─────────────────────────────────────────────────────────────────────────────

import type { Lieu } from './api';

export type SortKey = 'proche' | 'note' | 'populaire' | 'prix';

export interface SortOption {
  key: SortKey;
  label: string;
}

/** Lieu enrichi d'une distance (au centre-ville ou à l'utilisateur). */
export type LieuDist = Lieu & { dist?: number | null };

// ─── Prix ────────────────────────────────────────────────────────────────────

/** Range de prix → rang numérique pour le tri. "Gratuit"=0, "€€"=2… null sinon. */
export function priceRank(price?: string): number | null {
  if (!price) return null;
  const p = price.trim().toLowerCase();
  if (p === 'gratuit' || p === 'free' || p === '0') return 0;
  const euros = (price.match(/€/g) ?? []).length;
  return euros > 0 ? euros : null;
}

/** Une activité « gratuite » ? */
export function isGratuit(l: Lieu): boolean {
  return priceRank(l.price) === 0;
}

// ─── Tri ─────────────────────────────────────────────────────────────────────

/** Trie une copie de la liste selon la clé. Les valeurs manquantes finissent en bas. */
export function sortLieux<T extends LieuDist>(arr: T[], key: SortKey): T[] {
  const copy = [...arr];
  switch (key) {
    case 'note':
      return copy.sort((a, b) => (b.note ?? -1) - (a.note ?? -1));
    case 'populaire':
      return copy.sort((a, b) => (b.reviewCount ?? -1) - (a.reviewCount ?? -1));
    case 'prix':
      return copy.sort((a, b) => (priceRank(a.price) ?? 99) - (priceRank(b.price) ?? 99));
    case 'proche':
    default:
      return copy.sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));
  }
}

/** Options de tri pertinentes pour une liste (on masque celles sans donnée). */
export function sortOptionsFor(arr: Lieu[], hasDistance: boolean): SortOption[] {
  const opts: SortOption[] = [];
  if (hasDistance && arr.some((l) => l.latitude != null && l.longitude != null)) {
    opts.push({ key: 'proche', label: '📍 Au plus proche' });
  }
  if (arr.some((l) => l.note != null)) opts.push({ key: 'note', label: '⭐ Mieux notés' });
  if (arr.some((l) => l.reviewCount != null)) opts.push({ key: 'populaire', label: '🔥 Populaires' });
  if (arr.some((l) => priceRank(l.price) != null)) opts.push({ key: 'prix', label: '💶 Moins cher' });
  return opts;
}

// ─── Facettes (filtres) ──────────────────────────────────────────────────────

/** Catégories présentes (cuisine pour les restos, thème pour les activités…). */
export function categoryFacets(arr: Lieu[]): string[] {
  const set = new Set<string>();
  arr.forEach((l) => {
    if (l.category) set.add(l.category);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
}

// Vocabulaire d'ambiance connu → libellé joli. Le reste reçoit un repli #tag.
const TAG_LABELS: Record<string, string> = {
  familial: '👨‍👩‍👧 Famille',
  romantique: '❤️ En amoureux',
  calme: '🤫 Calme',
  anime: '🎉 Animé',
  'animé': '🎉 Animé',
  touristique: '📸 Touristique',
  'local-authentique': '🏠 Authentique',
  livraison: '🛵 Livraison',
  'a-emporter': '🥡 À emporter',
  'reservation-requise': '📅 Sur réservation',
};

// Ordre d'affichage privilégié (les plus parlants d'abord).
const TAG_ORDER = [
  'familial',
  'romantique',
  'calme',
  'anime',
  'animé',
  'local-authentique',
  'livraison',
  'a-emporter',
  'touristique',
  'reservation-requise',
];

export function tagLabel(tag: string): string {
  return TAG_LABELS[tag] ?? `#${tag}`;
}

/** Ambiances présentes dans la liste, ordonnées (connues d'abord). */
export function tagFacets(arr: Lieu[]): string[] {
  const set = new Set<string>();
  arr.forEach((l) => l.tags?.forEach((t) => set.add(t)));
  const present = Array.from(set);
  return present.sort((a, b) => {
    const ia = TAG_ORDER.indexOf(a);
    const ib = TAG_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b, 'fr');
  });
}

// ─── Application combinée ────────────────────────────────────────────────────

export interface LieuFilters {
  categories: string[]; // OU entre catégories sélectionnées
  tags: string[]; // ET : le lieu doit porter tous les tags choisis
  certifOnly: boolean; // restaurants : certifiés halal seulement
  gratuitOnly: boolean; // activités : gratuites seulement
}

export const EMPTY_FILTERS: LieuFilters = {
  categories: [],
  tags: [],
  certifOnly: false,
  gratuitOnly: false,
};

function isCertified(l: Lieu): boolean {
  const c = l.halalConfidence?.toLowerCase();
  return c === 'only' || c === 'yes' || c === 'certified' || c === 'certifie';
}

/** Filtre puis trie. Pur : ne mute pas l'entrée. */
export function applyLieuFilters<T extends LieuDist>(
  arr: T[],
  filters: LieuFilters,
  sort: SortKey,
): T[] {
  const filtered = arr.filter((l) => {
    if (filters.categories.length > 0 && !(l.category && filters.categories.includes(l.category))) {
      return false;
    }
    if (filters.tags.length > 0) {
      const tags = l.tags ?? [];
      if (!filters.tags.every((t) => tags.includes(t))) return false;
    }
    if (filters.certifOnly && !isCertified(l)) return false;
    if (filters.gratuitOnly && !isGratuit(l)) return false;
    return true;
  });
  return sortLieux(filtered, sort);
}

/** Y a-t-il au moins un filtre actif ? (pour afficher un « Effacer ».) */
export function hasActiveFilters(f: LieuFilters): boolean {
  return f.categories.length > 0 || f.tags.length > 0 || f.certifOnly || f.gratuitOnly;
}
