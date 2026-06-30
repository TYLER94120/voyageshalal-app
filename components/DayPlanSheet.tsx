import { useEffect, useMemo } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { openDirections, openMapsUrl } from '@/lib/maps';
import { autoPlanTrip, type PlanItem } from '@/lib/autoPlan';
import type { VilleDetail } from '@/lib/api';

/**
 * Suggestion d'une « journée type » halal-friendly — LECTURE SEULE. Une simple
 * inspiration (où dormir / manger / que faire), pas un outil à gérer.
 */
export function DayPlanSheet({ ville, onClose }: { ville: VilleDetail; onClose: () => void }) {
  const plan = useMemo(() => autoPlanTrip(ville, 1), [ville]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  const go = (i: PlanItem) =>
    i.mapsUrl
      ? openMapsUrl(i.mapsUrl)
      : i.latitude != null && i.longitude != null
        ? openDirections(i.latitude, i.longitude)
        : undefined;

  const sections: { title: string; items: PlanItem[] }[] = [
    { title: '🏨 Où dormir', items: plan.hotel ? [plan.hotel] : [] },
    { title: '🍽️ Où manger', items: plan.restaurants },
    { title: '🗺️ Que faire', items: plan.activites },
  ].filter((s) => s.items.length > 0);

  return (
    <View style={styles.overlay}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Idée de journée</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Une suggestion halal-friendly à {ville.nom}
          </Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10} style={styles.close}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Pas encore assez de lieux pour proposer une journée ici.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.note}>
            Sélection basée sur les lieux les mieux notés, certifiés halal et bien situés. Adaptez à
            votre rythme 🙂
          </Text>
          {sections.map((s) => (
            <View key={s.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{s.title}</Text>
              {s.items.map((it) => (
                <View key={it.id} style={styles.row}>
                  <Text style={styles.rowEmoji}>{it.emoji}</Text>
                  <View style={styles.rowText}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {it.title}
                    </Text>
                    {it.subtitle ? <Text style={styles.rowSub}>{it.subtitle}</Text> : null}
                  </View>
                  <Pressable hitSlop={8} onPress={() => go(it)} style={styles.goBtn}>
                    <Text style={styles.goText}>🧭</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Brand.night, zIndex: 1000 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 54,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerText: { flex: 1 },
  title: { color: Brand.cream, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Brand.creamMuted, fontSize: 13, fontWeight: '600', marginTop: 2 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: Brand.forest, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: Brand.cream, fontSize: 16, fontWeight: '800' },

  body: { padding: Spacing.lg, paddingTop: 0, gap: Spacing.lg, paddingBottom: Spacing.xl * 2 },
  note: { color: Brand.creamMuted, fontSize: 13, lineHeight: 19 },
  section: { gap: Spacing.sm },
  sectionTitle: { color: Brand.gold, fontSize: 14, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.md,
  },
  rowEmoji: { fontSize: 22 },
  rowText: { flex: 1 },
  rowName: { color: Brand.cream, fontSize: 16, fontWeight: '700' },
  rowSub: { color: Brand.creamMuted, fontSize: 13, marginTop: 2 },
  goBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Brand.goldSoft, borderWidth: 1, borderColor: Brand.border, alignItems: 'center', justifyContent: 'center' },
  goText: { fontSize: 16 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyText: { color: Brand.creamMuted, fontSize: 14, textAlign: 'center' },
});
