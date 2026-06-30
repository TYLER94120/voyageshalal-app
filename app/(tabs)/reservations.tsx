import { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useFavorites } from '@/context/FavoritesContext';
import { openMapsUrl } from '@/lib/maps';
import type { FavoriteItem } from '@/lib/favorites';

interface PlaceGroup {
  citySlug: string;
  cityNom: string;
  items: FavoriteItem[];
}

export default function FavorisScreen() {
  const router = useRouter();
  const { favorites, remove } = useFavorites();

  const cities = useMemo(() => favorites.filter((f) => f.type === 'city'), [favorites]);

  // Lieux regroupés par ville (façon « wishlist » Airbnb).
  const placeGroups = useMemo<PlaceGroup[]>(() => {
    const map = new Map<string, PlaceGroup>();
    for (const f of favorites) {
      if (f.type !== 'place') continue;
      const slug = f.citySlug ?? '—';
      if (!map.has(slug)) {
        const cityFav = cities.find((c) => c.citySlug === slug);
        const cityNom = cityFav?.title ?? f.subtitle?.split('·')[0]?.trim() ?? slug;
        map.set(slug, { citySlug: slug, cityNom, items: [] });
      }
      map.get(slug)!.items.push(f);
    }
    return Array.from(map.values());
  }, [favorites, cities]);

  if (favorites.length === 0) {
    return (
      <View style={styles.container}>
        <Header router={router} count={0} />
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🤍</Text>
          <Text style={styles.emptyTitle}>Aucun favori pour l’instant</Text>
          <Text style={styles.emptyHint}>
            Touchez le cœur sur une ville, un restaurant ou un hôtel pour le retrouver ici.
          </Text>
          <Pressable style={styles.cta} onPress={() => router.push('/destinations')}>
            <Text style={styles.ctaText}>Explorer les destinations</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header router={router} count={favorites.length} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Villes sauvegardées */}
        {cities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏙️ Mes villes</Text>
            {cities.map((c) => (
              <Pressable
                key={c.id}
                style={styles.cityCard}
                onPress={() => c.citySlug && router.push(`/ville/${c.citySlug}`)}
              >
                <Text style={styles.cityEmoji}>🏙️</Text>
                <View style={styles.cardText}>
                  <Text style={styles.cardName}>{c.title}</Text>
                  {c.subtitle ? <Text style={styles.cardSub}>{c.subtitle}</Text> : null}
                </View>
                <Pressable hitSlop={10} onPress={() => remove(c.id)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}

        {/* Lieux, groupés par ville */}
        {placeGroups.map((g) => (
          <View key={g.citySlug} style={styles.section}>
            <View style={styles.groupHeader}>
              <Text style={styles.sectionTitle}>📍 {g.cityNom}</Text>
              {g.citySlug !== '—' && (
                <Pressable hitSlop={8} onPress={() => router.push(`/ville/${g.citySlug}`)}>
                  <Text style={styles.groupLink}>Ouvrir la ville ›</Text>
                </Pressable>
              )}
            </View>
            {g.items.map((it) => (
              <Pressable
                key={it.id}
                style={styles.placeRow}
                onPress={() => (it.mapsUrl ? openMapsUrl(it.mapsUrl) : it.citySlug && router.push(`/ville/${it.citySlug}`))}
              >
                <Text style={styles.placeEmoji}>{it.emoji ?? '📍'}</Text>
                <View style={styles.cardText}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {it.title}
                  </Text>
                  {it.subtitle ? (
                    <Text style={styles.cardSub} numberOfLines={1}>
                      {it.subtitle}
                    </Text>
                  ) : null}
                </View>
                <Pressable hitSlop={10} onPress={() => remove(it.id)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Header({ router, count }: { router: ReturnType<typeof useRouter>; count: number }) {
  return (
    <View style={styles.header}>
      <Text style={styles.kicker}>MES ENVIES</Text>
      <Text style={styles.title}>Favoris</Text>
      <Text style={styles.subtitle}>
        {count > 0 ? `${count} ${count > 1 ? 'éléments sauvegardés' : 'sauvegardé'}` : 'Vos coups de cœur, au même endroit'}
      </Text>
      <Pressable style={styles.tripsLink} onPress={() => router.push('/trips')}>
        <Text style={styles.tripsLinkText}>🗓️ Mes voyages</Text>
        <Text style={styles.tripsLinkChevron}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.night },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  kicker: { color: Brand.gold, fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { color: Brand.cream, fontSize: 34, fontWeight: '800', marginTop: 2 },
  subtitle: { color: Brand.creamMuted, fontSize: 14, marginTop: 4 },
  tripsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    backgroundColor: Brand.forest,
    borderWidth: 1,
    borderColor: Brand.gold,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  tripsLinkText: { color: Brand.gold, fontSize: 14, fontWeight: '800' },
  tripsLinkChevron: { color: Brand.gold, fontSize: 20, fontWeight: '800' },

  scroll: { padding: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xl * 3 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { color: Brand.cream, fontSize: 16, fontWeight: '800' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  groupLink: { color: Brand.gold, fontSize: 12, fontWeight: '800' },

  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  cityEmoji: { fontSize: 26 },
  placeRow: {
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
  placeEmoji: { fontSize: 22 },
  cardText: { flex: 1 },
  cardName: { color: Brand.cream, fontSize: 16, fontWeight: '700' },
  cardSub: { color: Brand.creamMuted, fontSize: 13, marginTop: 2 },
  removeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Brand.night, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: Brand.creamMuted, fontSize: 14, fontWeight: '800' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { color: Brand.cream, fontSize: 18, fontWeight: '800' },
  emptyHint: { color: Brand.creamMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  cta: { marginTop: Spacing.md, backgroundColor: Brand.gold, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.pill },
  ctaText: { color: Brand.night, fontWeight: '800', fontSize: 14 },
});
