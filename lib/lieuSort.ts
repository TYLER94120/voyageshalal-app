// ─────────────────────────────────────────────────────────────────────────────
// Tri & filtres des lieux d'une fiche ville (restaurants / activités / hôtels).
//
// Tout est piloté par les données : les facettes (cuisines, thèmes, ambiances)
// sont extraites de la liste réelle de la ville, donc ça marche pour les 157
// villes sans configuration. Fonctions pures → testables sans réseau.
// ─────────────────────────────────────────────────────────────────────────────

import type { Lieu } from './api';

export type SortKey = 'reco' | 'situe' | 'proche' | 'note' | 'populaire' | 'prix';

export interface SortOption {
  key: SortKey;
  label: string;
}

/**
 * Lieu enrichi pour l'affichage :
 *   • `dist`     distance (au centre-ville ou à l'utilisateur),
 *   • `locScore` score « bien situé » (hôtels : proximité mosquée + restos halal).
 */
export type LieuDist = Lieu & { dist?: number | null; locScore?: number | null };

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

// ─── Score « Recommandé » ─────────────────────────────────────────────────────

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function isCertifiedConf(conf?: string): boolean {
  const c = conf?.toLowerCase();
  return c === 'only' || c === 'yes' || c === 'certified' || c === 'certifie';
}

/** Sous-ensemble minimal de champs nécessaires au score « Recommandé ». */
export interface Recommendable {
  note?: number | null;
  price?: string;
  dist?: number | null;
  reviewCount?: number | null;
  halalConfidence?: string;
}

/**
 * Score « Recommandé » (≈ 0..1) : combine la **note** (~40 %), la **proximité**
 * (~35 %) et le **rapport qualité-prix** (~25 %), plus de petits bonus pour un
 * lieu **certifié halal** et **populaire**. Pensé pour les restaurants — « le
 * japonais le plus proche, bien noté et au bon prix ». Les valeurs manquantes
 * sont traitées de façon neutre pour ne pas trop pénaliser un lieu incomplet.
 */
export function recommendedScore(l: Recommendable): number {
  const noteScore = l.note != null ? clamp01(l.note / 5) : 0.5;
  // Décroissance douce : 0 km → 1, 2 km → 0.5, 6 km → 0.25.
  const proxScore = l.dist != null ? 1 / (1 + Math.max(0, l.dist) / 2) : 0.4;
  const pr = priceRank(l.price);
  // Moins cher = mieux (€ → 1, €€€€ → 0.25) ; inconnu → légèrement neutre.
  const cheapness = pr != null ? clamp01((5 - pr) / 4) : 0.6;
  // Le rapport qualité-prix récompense une bonne note à petit prix.
  const valueScore = noteScore * cheapness;

  let score = 0.4 * noteScore + 0.35 * proxScore + 0.25 * valueScore;
  if (isCertifiedConf(l.halalConfidence)) score += 0.05;
  if (l.reviewCount != null) score += Math.min(l.reviewCount / 800, 1) * 0.04;
  return score;
}

// ─── Tri ─────────────────────────────────────────────────────────────────────

/** Trie une copie de la liste selon la clé. Les valeurs manquantes finissent en bas. */
export function sortLieux<T extends LieuDist>(arr: T[], key: SortKey): T[] {
  const copy = [...arr];
  switch (key) {
    case 'reco':
      return copy.sort((a, b) => recommendedScore(b) - recommendedScore(a));
    case 'situe':
      return copy.sort((a, b) => (b.locScore ?? -1) - (a.locScore ?? -1));
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

/**
 * Options de tri pertinentes pour une liste (on masque celles sans donnée).
 * `reco` (Recommandé) est proposé en tête pour les restaurants — tri par défaut,
 * combinant note + proximité + rapport qualité-prix.
 */
export function sortOptionsFor(
  arr: LieuDist[],
  hasDistance: boolean,
  opts0?: { reco?: boolean },
): SortOption[] {
  const opts: SortOption[] = [];
  // « Recommandé » en premier (restaurants) : la meilleure suggestion par défaut.
  if (opts0?.reco && arr.some((l) => l.note != null)) opts.push({ key: 'reco', label: '✨ Recommandé' });
  // « Bien situés » en tête quand on a des scores d'emplacement (hôtels) : c'est
  // la valeur ajoutée stratégique pour le voyageur musulman.
  if (arr.some((l) => l.locScore != null)) opts.push({ key: 'situe', label: '🕌 Bien situés' });
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
