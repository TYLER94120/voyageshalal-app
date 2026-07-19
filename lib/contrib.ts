// ─────────────────────────────────────────────────────────────────────────────
// Ma contribution communautaire : spots que J'AI partagés + spots que j'ai
// confirmés, suivis localement (l'API ne connaît pas encore de comptes).
// Niveaux et badges calculés en pur → testables. Vocabulaire sadaqa jâriya,
// jamais de « certifié ».
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'voyageshalal.contrib.v1';

export interface ContribState {
  spotsAdded: number;
  confirmedIds: string[]; // spots des autres que j'ai confirmés (1 tap, anti-doublon)
}

export const EMPTY_CONTRIB: ContribState = { spotsAdded: 0, confirmedIds: [] };

export async function loadContrib(): Promise<ContribState> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    if (!json) return EMPTY_CONTRIB;
    const o = JSON.parse(json) as Record<string, unknown>;
    return {
      spotsAdded: typeof o.spotsAdded === 'number' && o.spotsAdded >= 0 ? o.spotsAdded : 0,
      confirmedIds: Array.isArray(o.confirmedIds)
        ? o.confirmedIds.filter((x): x is string => typeof x === 'string')
        : [],
    };
  } catch {
    return EMPTY_CONTRIB;
  }
}

async function save(state: ContribState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // best-effort
  }
}

export async function recordSpotAdded(): Promise<ContribState> {
  const s = await loadContrib();
  const next = { ...s, spotsAdded: s.spotsAdded + 1 };
  await save(next);
  return next;
}

export async function recordConfirmation(spotId: string): Promise<ContribState> {
  const s = await loadContrib();
  if (s.confirmedIds.includes(spotId)) return s;
  const next = { ...s, confirmedIds: [...s.confirmedIds, spotId] };
  await save(next);
  return next;
}

// ─── Niveaux & badges ────────────────────────────────────────────────────────

export interface ContribLevel {
  key: string;
  label: string;
  emoji: string;
  min: number; // nb de spots partagés pour l'atteindre
}

// Progression volontairement atteignable : le 1er spot change déjà de niveau.
export const LEVELS: ContribLevel[] = [
  { key: 'voyageur', label: 'Voyageur', emoji: '🧳', min: 0 },
  { key: 'eclaireur', label: 'Éclaireur', emoji: '🔦', min: 1 },
  { key: 'guide', label: 'Guide', emoji: '🧭', min: 5 },
  { key: 'ambassadeur', label: 'Ambassadeur', emoji: '🌟', min: 15 },
];

export function levelFor(spotsAdded: number): ContribLevel {
  let cur = LEVELS[0];
  for (const l of LEVELS) if (spotsAdded >= l.min) cur = l;
  return cur;
}

/** Prochain niveau et nb de spots restants (null si niveau max atteint). */
export function nextLevel(spotsAdded: number): { level: ContribLevel; remaining: number } | null {
  for (const l of LEVELS) {
    if (spotsAdded < l.min) return { level: l, remaining: l.min - spotsAdded };
  }
  return null;
}

export interface Badge {
  key: string;
  emoji: string;
  label: string;
  earned: boolean;
}

export function badgesFor(state: ContribState): Badge[] {
  return [
    { key: 'premier', emoji: '🌱', label: 'Premier spot', earned: state.spotsAdded >= 1 },
    { key: 'cinq', emoji: '🖐️', label: '5 spots partagés', earned: state.spotsAdded >= 5 },
    { key: 'quinze', emoji: '🏆', label: '15 spots partagés', earned: state.spotsAdded >= 15 },
    { key: 'verificateur', emoji: '✅', label: 'A confirmé un spot', earned: state.confirmedIds.length >= 1 },
    { key: 'gardien', emoji: '🛡️', label: '10 confirmations', earned: state.confirmedIds.length >= 10 },
  ];
}
