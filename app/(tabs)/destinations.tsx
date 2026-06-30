import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { type VilleSummary } from '@/lib/api';
import { getVillesCached } from '@/lib/cityCache';
import { HeartButton } from '@/components/HeartButton';
import { cityFavKey } from '@/lib/favorites';

type LoadState = 'loading' | 'ready' | 'error';
type SortKey = 'az' | 'score';

// Image de ville avec repli 🕌 si l'URL est absente OU si le chargement échoue
// (certaines URLs Unsplash de la base sont cassées → on évite la carte vide).
function CityImage({ uri }: { uri?: string }) {
  const [err, setErr] = useState(false);
  if (!uri || err) {
    return (
      <View style={[styles.cardImage, styles.cardImageFallback]}>
        <Text style={styles.cardImageFallbackText}>🕌</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={styles.cardImage} onError={() => setErr(true)} />;
}

export default function DestinationsScreen() {
  const router = useRouter();
  const [villes, setVilles] = useState<VilleSummary[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [continent, setContinent] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('score');

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setState('loading');
    try {
      const { data } = await getVillesCached();
      setVilles(data);
      setState('ready');
    } catch (err) {
      console.warn('[destinations] échec chargement /api/villes', err);
      setState('error');
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  // Continents disponibles (filtres principaux, peu nombreux et clairs).
  const continents = useMemo(() => {
    const set = new Set<string>();
    villes.forEach((v) => v.continent && set.add(v.continent));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [villes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = villes.filter((v) => {
      const matchCont = !continent || v.continent === continent;
      const matchQ =
        !q ||
        v.nom.toLowerCase().includes(q) ||
        (v.pays?.toLowerCase().includes(q) ?? false) ||
        (v.region?.toLowerCase().includes(q) ?? false);
      return matchCont && matchQ;
    });
    if (sort === 'score') {
      return [...list].sort((a, b) => (b.scoreHalal ?? 0) - (a.scoreHalal ?? 0));
    }
    return [...list].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  }, [villes, query, continent, sort]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>DESTINATIONS</Text>
        <Text style={styles.title}>Où partir ?</Text>
        <Text style={styles.subtitle}>
          {state === 'ready' ? `${villes.length} villes halal-friendly dans le monde` : 'Inspirez votre prochain voyage'}
        </Text>
      </View>

      {/* Recherche */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔎</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher une ville, un pays…"
          placeholderTextColor={Brand.creamMuted}
          style={styles.searchInput}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Text style={styles.clearIcon}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Filtres continent + tri */}
      {state === 'ready' && (
        <FlatList
          data={['Toutes', ...continents]}
          keyExtractor={(c) => c}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsList}
          contentContainerStyle={styles.chipsRow}
          ListHeaderComponent={
            <Pressable
              onPress={() => setSort((s) => (s === 'score' ? 'az' : 'score'))}
              style={[styles.chip, styles.sortChip]}
            >
              <Text style={styles.sortChipText}>{sort === 'score' ? '★ Top halal' : 'A→Z'}</Text>
            </Pressable>
          }
          renderItem={({ item }) => {
            const isAll = item === 'Toutes';
            const active = isAll ? continent === null : continent === item;
            return (
              <Pressable
                onPress={() => setContinent(isAll ? null : item)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            );
          }}
        />
      )}

      {state === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.gold} />
          <Text style={styles.muted}>Chargement des destinations…</Text>
        </View>
      )}

      {state === 'error' && (
        <View style={styles.center}>
          <Text style={styles.errEmoji}>📡</Text>
          <Text style={styles.muted}>Impossible de charger les destinations.</Text>
          <Pressable style={styles.retry} onPress={() => load()}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      )}

      {state === 'ready' && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.slug}
          style={styles.cardsList}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.gold} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.muted}>Aucune destination ne correspond.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/ville/${item.slug}`)}>
              <CityImage uri={item.image} />

              {item.scoreHalal != null && (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>★ {item.scoreHalal.toFixed(1)}</Text>
                </View>
              )}

              <HeartButton
                style={styles.cardHeart}
                size={24}
                item={{
                  id: cityFavKey(item.slug),
                  type: 'city',
                  title: item.nom,
                  subtitle: [item.pays, item.continent].filter(Boolean).join(' · '),
                  emoji: '🏙️',
                  citySlug: item.slug,
                  image: item.image,
                }}
              />

              <View style={styles.cardOverlay}>
                <Text style={styles.cardName}>{item.nom}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>
                  {[item.pays, item.continent].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </Pressable>
          )}
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

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Brand.forest,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    height: 48,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: Brand.cream, fontSize: 15, paddingVertical: 0 },
  clearIcon: { color: Brand.creamMuted, fontSize: 16, paddingHorizontal: 4 },

  chipsList: { maxHeight: 56, marginTop: Spacing.sm },
  chipsRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, alignItems: 'center' },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  chipActive: { backgroundColor: Brand.gold, borderColor: Brand.gold },
  chipText: { color: Brand.cream, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: Brand.night, fontWeight: '800' },
  sortChip: { backgroundColor: Brand.forest, borderColor: Brand.gold },
  sortChipText: { color: Brand.gold, fontSize: 13, fontWeight: '800' },

  cardsList: { flex: 1 },
  list: { padding: Spacing.lg, paddingTop: Spacing.md, gap: 14 },
  card: {
    height: 170,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Brand.forest,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  cardImage: { width: '100%', height: '100%' },
  cardImageFallback: { alignItems: 'center', justifyContent: 'center' },
  cardImageFallbackText: { fontSize: 48 },
  scoreBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Brand.gold,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreText: { color: Brand.night, fontWeight: '800', fontSize: 13 },
  cardHeart: { position: 'absolute', top: 8, left: 8, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(11,26,15,0.45)', alignItems: 'center', justifyContent: 'center' },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: 'rgba(11,26,15,0.62)',
  },
  cardName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  cardSub: { color: '#f0e9d8', fontSize: 13, fontWeight: '600', marginTop: 2 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  muted: { color: Brand.creamMuted, fontSize: 14, textAlign: 'center' },
  errEmoji: { fontSize: 44 },
  retry: {
    marginTop: Spacing.sm,
    backgroundColor: Brand.gold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  retryText: { color: Brand.night, fontWeight: '800', fontSize: 14 },
});
