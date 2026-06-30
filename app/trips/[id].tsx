import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTrips } from '@/context/TripsContext';
import { itemsForDay } from '@/lib/trips';
import { openDirections, openMapsUrl } from '@/lib/maps';
import { computeDay, formatTime } from '@/lib/prayer';
import { DEFAULT_SETTINGS, loadSettings, type PrayerSettings } from '@/lib/prayerSettings';
import { getVilleCached } from '@/lib/cityCache';
import { autoPlanTrip } from '@/lib/autoPlan';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getCityTrip, removeFromTrip, moveItemDay, setTripDays, deleteTrip, applyPlan } = useTrips();
  const trip = getCityTrip(String(id));

  const [day, setDay] = useState(1);
  const [settings, setSettings] = useState<PrayerSettings>(DEFAULT_SETTINGS);
  const [planning, setPlanning] = useState(false);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  // Horaires de prière de la ville pour le jour sélectionné (aujourd'hui + N-1).
  const prayers = useMemo(() => {
    if (!trip || trip.latitude == null || trip.longitude == null) return [];
    const base = new Date();
    base.setDate(base.getDate() + (day - 1));
    return computeDay(trip.latitude, trip.longitude, base, settings.methodKey, settings.madhab).filter(
      (p) => p.obligatory,
    );
  }, [trip, day, settings]);

  if (!trip) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerTitle: 'Séjour', ...headerStyle }} />
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🧳</Text>
          <Text style={styles.emptyTitle}>Séjour introuvable</Text>
          <Pressable style={styles.cta} onPress={() => router.replace('/trips')}>
            <Text style={styles.ctaText}>Mes voyages</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const dayItems = itemsForDay(trip, day);

  const organizeAuto = async () => {
    setPlanning(true);
    try {
      const { data } = await getVilleCached(trip.citySlug);
      const { items } = autoPlanTrip(data, trip.days);
      if (items.length === 0) {
        Alert.alert(
          'Pas assez de données',
          "Cette ville n'a pas encore assez de lieux géolocalisés pour un programme automatique.",
        );
        return;
      }
      applyPlan(
        {
          slug: trip.citySlug,
          nom: trip.cityNom,
          latitude: trip.latitude ?? data.latitude,
          longitude: trip.longitude ?? data.longitude,
        },
        items,
      );
      setDay(1);
    } catch {
      Alert.alert(
        'Connexion requise',
        "Impossible de générer le programme : ouvre d'abord cette ville une fois en ligne.",
      );
    } finally {
      setPlanning(false);
    }
  };

  const handleAuto = () => {
    if (trip.items.length > 0) {
      Alert.alert('Réorganiser le séjour ?', 'Le programme actuel sera remplacé par une proposition automatique.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Réorganiser', onPress: organizeAuto },
      ]);
    } else {
      organizeAuto();
    }
  };

  const confirmDelete = () => {
    Alert.alert('Supprimer ce séjour ?', `« ${trip.cityNom} » et toutes ses étapes seront effacés.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          deleteTrip(trip.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: trip.cityNom,
          ...headerStyle,
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable hitSlop={10} onPress={handleAuto}>
                <Text style={styles.headerAuto}>✨</Text>
              </Pressable>
              <Pressable hitSlop={10} onPress={confirmDelete}>
                <Text style={styles.headerDelete}>🗑️</Text>
              </Pressable>
            </View>
          ),
        }}
      />

      {/* Réglage du nombre de jours */}
      <View style={styles.daysBar}>
        <Text style={styles.daysLabel}>Durée du séjour</Text>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => {
              setTripDays(trip.id, trip.days - 1);
              if (day > trip.days - 1) setDay(Math.max(1, trip.days - 1));
            }}
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.daysCount}>
            {trip.days} jour{trip.days > 1 ? 's' : ''}
          </Text>
          <Pressable style={styles.stepBtn} onPress={() => setTripDays(trip.id, trip.days + 1)}>
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* Sélecteur de jour */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayPills}>
        {Array.from({ length: trip.days }, (_, i) => i + 1).map((d) => {
          const on = d === day;
          const count = itemsForDay(trip, d).length;
          return (
            <Pressable key={d} onPress={() => setDay(d)} style={[styles.dayPill, on && styles.dayPillOn]}>
              <Text style={[styles.dayPillText, on && styles.dayPillTextOn]}>Jour {d}</Text>
              {count > 0 && (
                <View style={[styles.dayBadge, on && styles.dayBadgeOn]}>
                  <Text style={[styles.dayBadgeText, on && styles.dayBadgeTextOn]}>{count}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyPad}>
        {/* Organisateur automatique (séjour vide) */}
        {trip.items.length === 0 && (
          <Pressable style={styles.autoBanner} onPress={handleAuto} disabled={planning}>
            {planning ? (
              <ActivityIndicator color={Brand.night} />
            ) : (
              <>
                <Text style={styles.autoBannerTitle}>✨ Organiser mon séjour pour moi</Text>
                <Text style={styles.autoBannerSub}>
                  Un programme équilibré en 1 tap : meilleur hôtel, restos & activités variés,
                  répartis sur {trip.days} jour{trip.days > 1 ? 's' : ''}
                </Text>
              </>
            )}
          </Pressable>
        )}

        {/* Horaires de prière du jour */}
        {prayers.length > 0 && (
          <View style={styles.prayerCard}>
            <Text style={styles.prayerTitle}>🕌 Prières à {trip.cityNom}</Text>
            <View style={styles.prayerRow}>
              {prayers.map((p) => (
                <View key={p.name} style={styles.prayerSlot}>
                  <Text style={styles.prayerName}>{p.label}</Text>
                  <Text style={styles.prayerTime}>{formatTime(p.time)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Étapes du jour */}
        {dayItems.length === 0 ? (
          <View style={styles.dayEmpty}>
            <Text style={styles.dayEmptyText}>Aucune étape ce jour-là.</Text>
            <Pressable style={styles.addBtn} onPress={() => router.push(`/ville/${trip.citySlug}`)}>
              <Text style={styles.addBtnText}>➕ Ajouter des lieux</Text>
            </Pressable>
            <Pressable onPress={handleAuto} disabled={planning}>
              <Text style={styles.autoLink}>✨ Ou laisse-moi organiser</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.items}>
            {dayItems.map((it) => (
              <View key={it.id} style={styles.item}>
                <Text style={styles.itemEmoji}>{it.emoji}</Text>
                <View style={styles.itemText}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {it.title}
                  </Text>
                  {it.subtitle ? (
                    <Text style={styles.itemSub} numberOfLines={1}>
                      {it.subtitle}
                    </Text>
                  ) : null}
                  <View style={styles.itemActions}>
                    <Pressable
                      onPress={() =>
                        it.mapsUrl
                          ? openMapsUrl(it.mapsUrl)
                          : it.latitude != null && it.longitude != null
                            ? openDirections(it.latitude, it.longitude)
                            : undefined
                      }
                    >
                      <Text style={styles.itemAction}>🧭 Itinéraire</Text>
                    </Pressable>
                    {trip.days > 1 && (
                      <Pressable
                        onPress={() => moveItemDay(trip.id, it.id, day >= trip.days ? 1 : day + 1)}
                      >
                        <Text style={styles.itemAction}>→ Jour {day >= trip.days ? 1 : day + 1}</Text>
                      </Pressable>
                    )}
                    <Pressable onPress={() => removeFromTrip(trip.id, it.id)}>
                      <Text style={[styles.itemAction, styles.itemRemove]}>✕ Retirer</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
            <Pressable style={styles.addBtnGhost} onPress={() => router.push(`/ville/${trip.citySlug}`)}>
              <Text style={styles.addBtnGhostText}>➕ Ajouter d'autres lieux</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const headerStyle = {
  headerStyle: { backgroundColor: Brand.night },
  headerTintColor: Brand.gold,
  headerTitleStyle: { color: Brand.cream, fontWeight: '800' as const },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.night },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerAuto: { fontSize: 18 },
  headerDelete: { fontSize: 18 },

  autoBanner: {
    backgroundColor: Brand.gold,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
    alignItems: 'center',
    minHeight: 64,
    justifyContent: 'center',
  },
  autoBannerTitle: { color: Brand.night, fontSize: 16, fontWeight: '800' },
  autoBannerSub: { color: Brand.night, fontSize: 12, fontWeight: '600', textAlign: 'center', opacity: 0.85 },
  autoLink: { color: Brand.gold, fontSize: 13, fontWeight: '800', marginTop: Spacing.xs },

  daysBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  daysLabel: { color: Brand.creamMuted, fontSize: 13, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Brand.forest,
    borderWidth: 1,
    borderColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { color: Brand.gold, fontSize: 20, fontWeight: '800' },
  daysCount: { color: Brand.cream, fontSize: 15, fontWeight: '800', minWidth: 64, textAlign: 'center' },

  dayPills: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.sm },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  dayPillOn: { backgroundColor: Brand.gold, borderColor: Brand.gold },
  dayPillText: { color: Brand.cream, fontSize: 13, fontWeight: '700' },
  dayPillTextOn: { color: Brand.night, fontWeight: '800' },
  dayBadge: { minWidth: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: Brand.goldSoft, alignItems: 'center' },
  dayBadgeOn: { backgroundColor: Brand.night },
  dayBadgeText: { color: Brand.gold, fontSize: 11, fontWeight: '800' },
  dayBadgeTextOn: { color: Brand.gold },

  body: { flex: 1 },
  bodyPad: { padding: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.md, paddingBottom: Spacing.xl * 2 },

  prayerCard: { backgroundColor: Brand.forest, borderRadius: Radius.md, borderWidth: 1, borderColor: Brand.border, padding: Spacing.md, gap: Spacing.sm },
  prayerTitle: { color: Brand.gold, fontSize: 13, fontWeight: '800' },
  prayerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  prayerSlot: { alignItems: 'center', flex: 1 },
  prayerName: { color: Brand.creamMuted, fontSize: 11, fontWeight: '700' },
  prayerTime: { color: Brand.cream, fontSize: 14, fontWeight: '800', marginTop: 2 },

  items: { gap: Spacing.sm },
  item: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.md,
  },
  itemEmoji: { fontSize: 24 },
  itemText: { flex: 1, gap: 2 },
  itemName: { color: Brand.cream, fontSize: 16, fontWeight: '700' },
  itemSub: { color: Brand.creamMuted, fontSize: 13 },
  itemActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: 6 },
  itemAction: { color: Brand.gold, fontSize: 12, fontWeight: '800' },
  itemRemove: { color: '#e9a' },

  dayEmpty: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  dayEmptyText: { color: Brand.creamMuted, fontSize: 14 },
  addBtn: { backgroundColor: Brand.gold, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.pill },
  addBtnText: { color: Brand.night, fontWeight: '800', fontSize: 14 },
  addBtnGhost: { alignItems: 'center', paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Brand.border, marginTop: Spacing.xs },
  addBtnGhostText: { color: Brand.gold, fontWeight: '800', fontSize: 14 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { color: Brand.cream, fontSize: 18, fontWeight: '800' },
  cta: { backgroundColor: Brand.gold, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.pill },
  ctaText: { color: Brand.night, fontWeight: '800', fontSize: 14 },
});
