import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Brand, Radius, Spacing } from '@/constants/theme';
import {
  badgesFor,
  levelFor,
  loadContrib,
  nextLevel,
  EMPTY_CONTRIB,
  type ContribState,
} from '@/lib/contrib';
import { SpotWizard } from './SpotWizard';

/**
 * « Ma contribution » (Profil) : niveau Voyageur→Ambassadeur, progression,
 * badges, et le CTA « + Ajouter un spot ». Cadre sadaqa jâriya — les chiffres
 * affichés sont réels (ta contribution locale), rien d'inventé.
 */
export function ContributionCard() {
  const [state, setState] = useState<ContribState>(EMPTY_CONTRIB);
  const [wizard, setWizard] = useState(false);

  const refresh = useCallback(() => {
    loadContrib().then(setState);
  }, []);

  // Au focus de l'onglet (pas seulement au montage) : les confirmations faites
  // sur la carte incrémentent le compteur dès qu'on revient sur le profil.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const level = levelFor(state.spotsAdded);
  const next = nextLevel(state.spotsAdded);
  const badges = badgesFor(state).filter((b) => b.earned);

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <Text style={styles.title}>🤲 Ma contribution</Text>
        <Text style={styles.level}>
          {level.emoji} {level.label}
        </Text>
      </View>

      <Text style={styles.stats}>
        {state.spotsAdded} spot{state.spotsAdded > 1 ? 's' : ''} partagé{state.spotsAdded > 1 ? 's' : ''} ·{' '}
        {state.confirmedIds.length} confirmation{state.confirmedIds.length > 1 ? 's' : ''}
      </Text>

      {next ? (
        <Text style={styles.next}>
          Encore {next.remaining} spot{next.remaining > 1 ? 's' : ''} pour devenir {next.level.emoji}{' '}
          {next.level.label}
        </Text>
      ) : (
        <Text style={styles.next}>Niveau maximum — qu’Allah te récompense 🌟</Text>
      )}

      {badges.length > 0 && (
        <View style={styles.badgeRow}>
          {badges.map((b) => (
            <Text key={b.key} style={styles.badge}>
              {b.emoji} {b.label}
            </Text>
          ))}
        </View>
      )}

      <Text style={styles.sadaqa}>
        Chaque spot partagé aide des voyageurs à prier — une sadaqa jâriya qui continue sans toi.
      </Text>

      <Pressable style={styles.cta} onPress={() => setWizard(true)}>
        <Text style={styles.ctaText}>➕ Ajouter un spot de prière</Text>
      </Pressable>

      <SpotWizard
        visible={wizard}
        onClose={() => {
          setWizard(false);
          refresh();
        }}
        onPublished={refresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#7c3aed',
    padding: Spacing.md,
    gap: 6,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: Brand.cream, fontSize: 16, fontWeight: '800' },
  level: {
    color: '#ede9fe',
    backgroundColor: '#5b21b6',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  stats: { color: Brand.gold, fontSize: 14, fontWeight: '800' },
  next: { color: Brand.creamMuted, fontSize: 12 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  badge: {
    backgroundColor: 'rgba(201,168,76,0.14)',
    borderWidth: 1,
    borderColor: Brand.gold,
    color: Brand.gold,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  sadaqa: { color: Brand.creamMuted, fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  cta: {
    marginTop: Spacing.sm,
    backgroundColor: '#5b21b6',
    borderRadius: Radius.pill,
    paddingVertical: 13,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
