import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { usePrayerClock } from '@/context/PrayerContext';
import { formatCountdownShort, formatTime } from '@/lib/prayer';
import { Brand, Spacing } from '@/constants/theme';

/**
 * Bandeau « prochaine prière » permanent, en haut de l'app.
 * Rendu dans le layout racine → présent sur tous les écrans.
 */
export function NextPrayerBanner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Le bandeau n'affiche qu'une granularité à la minute → tick lent (15 s)
  // pour éviter un re-render par seconde sur tous les écrans.
  const { ready, next, countdown, location } = usePrayerClock({ tickMs: 15000 });

  const goToHoraires = () => router.push('/horaires');

  return (
    <Pressable
      onPress={goToHoraires}
      style={[styles.container, { paddingTop: insets.top + 6 }]}
      accessibilityRole="button"
      accessibilityLabel="Voir les horaires de prière"
    >
      <View style={styles.left}>
        <Text style={styles.emoji}>🕌</Text>
        <View style={styles.leftText}>
          <Text style={styles.kicker} numberOfLines={1} ellipsizeMode="tail">
            PROCHAINE PRIÈRE{location.city ? ` · ${location.city}` : ''}
          </Text>
          <Text style={styles.prayer} numberOfLines={1} ellipsizeMode="tail">
            {ready && next ? next.label : 'Calcul des horaires…'}
            {next?.isTomorrow ? ' (demain)' : ''}
          </Text>
        </View>
      </View>

      {ready && next && countdown ? (
        <View style={styles.right}>
          <Text style={styles.time}>{formatTime(next.time)}</Text>
          <Text style={styles.countdown}>dans {formatCountdownShort(countdown)}</Text>
        </View>
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.forest,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  leftText: {
    flex: 1,
  },
  emoji: { fontSize: 22 },
  kicker: {
    color: Brand.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  prayer: {
    color: Brand.cream,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 1,
  },
  right: {
    alignItems: 'flex-end',
    flexShrink: 0,
    marginLeft: Spacing.sm,
  },
  time: {
    color: Brand.cream,
    fontSize: 18,
    fontWeight: '800',
  },
  countdown: {
    color: Brand.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    color: Brand.gold,
    fontSize: 24,
    fontWeight: '300',
  },
});
