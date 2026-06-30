import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTrips } from '@/context/TripsContext';

export default function TripsListScreen() {
  const router = useRouter();
  const { trips } = useTrips();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Mes voyages',
          headerStyle: { backgroundColor: Brand.night },
          headerTintColor: Brand.gold,
          headerTitleStyle: { color: Brand.cream, fontWeight: '800' },
        }}
      />

      {trips.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🗓️</Text>
          <Text style={styles.emptyTitle}>Aucun séjour pour l’instant</Text>
          <Text style={styles.emptyHint}>
            Ouvrez une ville, puis « ➕ Séjour » sur un hôtel, un restaurant ou une activité pour
            commencer à planifier.
          </Text>
          <Pressable style={styles.cta} onPress={() => router.push('/destinations')}>
            <Text style={styles.ctaText}>Choisir une destination</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/trips/${item.id}`)}>
              <Text style={styles.cardEmoji}>🧳</Text>
              <View style={styles.cardText}>
                <Text style={styles.cardName}>{item.cityNom}</Text>
                <Text style={styles.cardSub}>
                  {item.days} jour{item.days > 1 ? 's' : ''} · {item.items.length} étape
                  {item.items.length > 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.night },
  list: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xl * 2 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardEmoji: { fontSize: 28 },
  cardText: { flex: 1 },
  cardName: { color: Brand.cream, fontSize: 17, fontWeight: '800' },
  cardSub: { color: Brand.creamMuted, fontSize: 13, marginTop: 2 },
  chevron: { color: Brand.creamMuted, fontSize: 24, fontWeight: '700' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm, paddingTop: Platform.OS === 'ios' ? 40 : 20 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { color: Brand.cream, fontSize: 18, fontWeight: '800' },
  emptyHint: { color: Brand.creamMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  cta: { marginTop: Spacing.md, backgroundColor: Brand.gold, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.pill },
  ctaText: { color: Brand.night, fontWeight: '800', fontSize: 14 },
});
