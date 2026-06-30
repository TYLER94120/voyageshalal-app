import { useMemo } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useFavorites } from '@/context/FavoritesContext';
import { openMapsUrl } from '@/lib/maps';
import type { FavoriteItem } from '@/lib/favorites';

export default function FavorisScreen() {
  const router = useRouter();
  const { favorites, remove } = useFavorites();

  const cityCount = useMemo(() => favorites.filter((f) => f.type === 'city').length, [favorites]);

  const open = (f: FavoriteItem) => {
    if (f.type === 'city' && f.citySlug) {
      router.push(`/ville/${f.citySlug}`);
    } else if (f.mapsUrl) {
      openMapsUrl(f.mapsUrl);
    } else if (f.citySlug) {
      router.push(`/ville/${f.citySlug}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>MES ENVIES</Text>
        <Text style={styles.title}>Favoris</Text>
        <Text style={styles.subtitle}>
          {favorites.length > 0
            ? `${favorites.length} ${favorites.length > 1 ? 'éléments sauvegardés' : 'sauvegardé'}`
            : 'Vos coups de cœur, au même endroit'}
        </Text>
      </View>

      {favorites.length === 0 ? (
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
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(f) => f.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const showCitiesTitle = index === 0 && item.type === 'city';
            const showPlacesTitle =
              item.type === 'place' && (index === 0 || favorites[index - 1].type !== 'place');
            return (
              <View>
                {showCitiesTitle && cityCount > 0 && <Text style={styles.sectionTitle}>🏙️ Villes</Text>}
                {showPlacesTitle && <Text style={styles.sectionTitle}>📍 Lieux</Text>}
                <Pressable style={styles.card} onPress={() => open(item)}>
                  <Text style={styles.cardEmoji}>{item.emoji ?? (item.type === 'city' ? '🏙️' : '📍')}</Text>
                  <View style={styles.cardText}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.subtitle ? (
                      <Text style={styles.cardSub} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable hitSlop={10} onPress={() => remove(item.id)} style={styles.heartBtn}>
                    <Text style={styles.heart}>❤️</Text>
                  </Pressable>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.night },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  kicker: { color: Brand.gold, fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { color: Brand.cream, fontSize: 34, fontWeight: '800', marginTop: 2 },
  subtitle: { color: Brand.creamMuted, fontSize: 14, marginTop: 4 },

  list: { padding: Spacing.lg, paddingBottom: Spacing.xl * 3 },
  sectionTitle: { color: Brand.cream, fontSize: 16, fontWeight: '800', marginTop: Spacing.sm, marginBottom: 6 },

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
  cardEmoji: { fontSize: 26 },
  cardText: { flex: 1 },
  cardName: { color: Brand.cream, fontSize: 16, fontWeight: '700' },
  cardSub: { color: Brand.creamMuted, fontSize: 13, marginTop: 2 },
  heartBtn: { padding: 4 },
  heart: { fontSize: 20 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { color: Brand.cream, fontSize: 18, fontWeight: '800' },
  emptyHint: { color: Brand.creamMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  cta: { marginTop: Spacing.md, backgroundColor: Brand.gold, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.pill },
  ctaText: { color: Brand.night, fontWeight: '800', fontSize: 14 },
});
