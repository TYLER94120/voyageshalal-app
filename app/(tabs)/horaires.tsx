import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePrayerClock, usePrayerContext } from '@/context/PrayerContext';
import {
  METHODS,
  formatFrenchDate,
  formatTime,
  methodByKey,
  type MadhabKey,
  type PrayerSlot,
} from '@/lib/prayer';
import { Brand, Radius, Spacing } from '@/constants/theme';

export default function HorairesScreen() {
  const { settings, updateSettings } = usePrayerContext();
  const { ready, slots, next, current, countdown, now, location } = usePrayerClock();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* En-tête */}
      <Text style={styles.kicker}>HORAIRES DE PRIÈRE</Text>
      <Text style={styles.city}>
        📍 {location.city ?? (location.usingDefault ? 'Paris' : 'Ma position')}
        {location.usingDefault ? ' · par défaut' : ''}
      </Text>
      <Text style={styles.date}>{formatFrenchDate(now)}</Text>

      {/* Carte prochaine prière */}
      {ready && next && countdown ? (
        <View style={styles.heroCard}>
          <Text style={styles.heroKicker}>
            PROCHAINE PRIÈRE{next.isTomorrow ? ' · DEMAIN' : ''}
          </Text>
          <Text style={styles.heroPrayer}>{next.label}</Text>
          <Text style={styles.heroTime}>{formatTime(next.time)}</Text>
          <View style={styles.heroCountdownRow}>
            <CountUnit value={countdown.hours} label="h" />
            <CountUnit value={countdown.minutes} label="min" />
            <CountUnit value={countdown.seconds} label="s" />
          </View>
        </View>
      ) : (
        <View style={styles.heroCard}>
          <Text style={styles.heroPrayer}>Calcul en cours…</Text>
          <Text style={styles.muted}>Localisation et horaires</Text>
        </View>
      )}

      {/* Timeline du jour */}
      <View style={styles.section}>
        {slots.map((slot) => {
          const isNext = ready && next?.name === slot.name && !next.isTomorrow;
          const isCurrent = current === slot.name;
          const isPast = slot.time.getTime() <= now.getTime() && !isNext && !isCurrent;
          return (
            <PrayerRow
              key={slot.name}
              slot={slot}
              isNext={isNext}
              isCurrent={isCurrent}
              isPast={isPast}
            />
          );
        })}
      </View>

      {/* Réglages : méthode de calcul */}
      <Text style={styles.settingTitle}>Méthode de calcul</Text>
      <View style={styles.methodList}>
        {METHODS.map((m) => {
          const active = settings.methodKey === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => updateSettings({ methodKey: m.key })}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Méthode ${m.label}, ${m.hint}`}
              style={[styles.methodCard, active && styles.methodCardActive]}
            >
              <View style={styles.methodTextWrap}>
                <Text style={[styles.methodLabel, active && styles.methodLabelActive]}>
                  {m.label}
                </Text>
                <Text style={[styles.methodHint, active && styles.methodHintActive]}>{m.hint}</Text>
              </View>
              {active && (
                <Text style={styles.methodCheck} accessible={false}>
                  ✓
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Réglages : école (madhab) pour le Asr */}
      <Text style={styles.settingTitle}>École (calcul du Asr)</Text>
      <View style={styles.madhabRow}>
        {(['shafi', 'hanafi'] as MadhabKey[]).map((key) => {
          const active = settings.madhab === key;
          return (
            <Pressable
              key={key}
              onPress={() => updateSettings({ madhab: key })}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`École ${
                key === 'shafi' ? 'Shafi‘i, Maliki, Hanbali, Asr standard' : 'Hanafi, Asr plus tardif'
              }`}
              style={[styles.madhabBtn, active && styles.madhabBtnActive]}
            >
              <Text style={[styles.madhabLabel, active && styles.madhabLabelActive]}>
                {key === 'shafi' ? 'Shafi‘i / Maliki / Hanbali' : 'Hanafi'}
              </Text>
              <Text style={[styles.madhabHint, active && styles.madhabHintActive]}>
                {key === 'shafi' ? 'Asr standard' : 'Asr plus tardif'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.footnote}>
        Méthode actuelle : {methodByKey(settings.methodKey).label}. Calcul local basé sur votre
        position — aucune connexion requise.
      </Text>
    </ScrollView>
  );
}

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.countUnit}>
      <Text style={styles.countValue}>{String(value).padStart(2, '0')}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

function PrayerRow({
  slot,
  isNext,
  isCurrent,
  isPast,
}: {
  slot: PrayerSlot;
  isNext: boolean;
  isCurrent: boolean;
  isPast: boolean;
}) {
  return (
    <View style={[styles.row, isNext && styles.rowNext, isPast && styles.rowPast]}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowEmoji}>{slot.name === 'sunrise' ? '🌅' : '🕌'}</Text>
        <Text style={[styles.rowLabel, isNext && styles.rowLabelNext]}>{slot.label}</Text>
        {isNext && <Text style={styles.badgeNext}>PROCHAINE</Text>}
        {isCurrent && !isNext && <Text style={styles.badgeCurrent}>EN COURS</Text>}
      </View>
      <Text style={[styles.rowTime, isNext && styles.rowTimeNext]}>{formatTime(slot.time)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.night },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl * 2 },

  kicker: { color: Brand.gold, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  city: { color: Brand.cream, fontSize: 15, fontWeight: '700', marginTop: 6 },
  date: { color: Brand.creamMuted, fontSize: 13, marginTop: 2, textTransform: 'capitalize' },

  heroCard: {
    marginTop: Spacing.lg,
    backgroundColor: Brand.forest,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  heroKicker: { color: Brand.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  heroPrayer: { color: Brand.cream, fontSize: 28, fontWeight: '800', marginTop: 4 },
  heroTime: { color: Brand.gold, fontSize: 40, fontWeight: '800', marginTop: 2 },
  heroCountdownRow: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md },
  countUnit: { alignItems: 'center', minWidth: 48 },
  countValue: { color: Brand.cream, fontSize: 24, fontWeight: '800' },
  countLabel: { color: Brand.creamMuted, fontSize: 11, fontWeight: '600', marginTop: 2 },

  section: {
    marginTop: Spacing.lg,
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  rowNext: { backgroundColor: Brand.goldSoft },
  rowPast: { opacity: 0.45 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  rowEmoji: { fontSize: 16 },
  rowLabel: { color: Brand.cream, fontSize: 16, fontWeight: '600' },
  rowLabelNext: { fontWeight: '800' },
  rowTime: { color: Brand.cream, fontSize: 17, fontWeight: '700' },
  rowTimeNext: { color: Brand.gold },
  badgeNext: {
    color: Brand.night,
    backgroundColor: Brand.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  badgeCurrent: {
    color: Brand.gold,
    borderColor: Brand.border,
    borderWidth: 1,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },

  settingTitle: {
    color: Brand.cream,
    fontSize: 16,
    fontWeight: '800',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  methodList: { gap: Spacing.sm },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.forest,
  },
  methodCardActive: { backgroundColor: Brand.gold, borderColor: Brand.gold },
  methodTextWrap: { flex: 1 },
  methodLabel: { color: Brand.cream, fontSize: 15, fontWeight: '700' },
  methodLabelActive: { color: Brand.night, fontWeight: '800' },
  methodHint: { color: Brand.creamMuted, fontSize: 12, marginTop: 2 },
  methodHintActive: { color: Brand.night, opacity: 0.7 },
  methodCheck: { color: Brand.night, fontSize: 18, fontWeight: '800', marginLeft: Spacing.sm },

  madhabRow: { flexDirection: 'row', gap: Spacing.sm },
  madhabBtn: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.forest,
  },
  madhabBtnActive: { backgroundColor: Brand.gold, borderColor: Brand.gold },
  madhabLabel: { color: Brand.cream, fontSize: 13, fontWeight: '700' },
  madhabLabelActive: { color: Brand.night, fontWeight: '800' },
  madhabHint: { color: Brand.creamMuted, fontSize: 11, marginTop: 2 },
  madhabHintActive: { color: Brand.night, opacity: 0.7 },

  muted: { color: Brand.creamMuted, fontSize: 13, marginTop: 4 },
  footnote: {
    color: Brand.creamMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: Spacing.xl,
  },
});
