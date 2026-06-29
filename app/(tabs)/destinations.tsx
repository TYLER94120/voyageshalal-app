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
import { getVilles, type VilleSummary } from '@/lib/api';

type LoadState = 'loading' | 'ready' | 'error';

export default function DestinationsScreen() {
  const router = useRouter();
  const [villes, setVilles] = useState<VilleSummary[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setState('loading');
    try {
      const data = await getVilles();
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

  // Régions disponibles, pour les filtres rapides
  const regions = useMemo(() => {
    const set = new Set<string>();
    villes.forEach((v) => {
      const r = v.region ?? v.pays;
      if (r) set.add(r);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [villes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return villes.filter((v) => {
      const matchesRegion = !region || v.region === region || v.pays === region;
      const matchesQuery =
        !q ||
        v.nom.toLowerCase().includes(q) ||
        (v.region?.toLowerCase().includes(q) ?? false) ||
        (v.pays?.toLowerCase().includes(q) ?? false);
      return matchesRegion && matchesQuery;
    });
  }, [villes, query, region]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>VOYAGESHALAL</Text>
        <Text style={styles.title}>Destinations</Text>
        <Text style={styles.subtitle}>
          {state === 'ready'
            ? `${villes.length} villes prêtes pour un voyage halal`
            : 'Explorez les villes halal-friendly'}
        </Text>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔎</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher une ville…"
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

      {/* Filtres par région */}
      {regions.length > 0 && (
        <FlatList
          data={['Toutes', ...regions]}
          keyExtractor={(r) => r}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsList}
          renderItem={({ item }) => {
            const isAll = item === 'Toutes';
            const active = isAll ? region === null : region === item;
            return (
              <Pressable
                onPress={() => setRegion(isAll ? null : item)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            );
          }}
        />
      )}

      {/* Contenu */}
      {state === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.gold} />
          <Text style={styles.muted}>Chargement des villes…</Text>
        </View>
      )}

      {state === 'error' && (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>📡</Text>
          <Text style={styles.errorTitle}>Connexion impossible</Text>
          <Text style={styles.muted}>Impossible de joindre l’API VoyagesHalal.</Text>
          <Pressable style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      )}

      {state === 'ready' && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.slug}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.gold} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.muted}>Aucune ville ne correspond à « {query} ».</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/ville/${item.slug}`)}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, styles.cardImageFallback]}>
                  <Text style={styles.cardImageFallbackText}>🕌</Text>
                </View>
              )}
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{item.nom}</Text>
                {(item.region || item.pays) && (
                  <Text style={styles.cardRegion}>
                    📍 {[item.region, item.pays].filter(Boolean).join(' · ')}
                  </Text>
                )}
                {item.description && (
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>
              <Text style={styles.cardChevron}>›</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.night,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 64 : 44,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  kicker: {
    color: Brand.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: Brand.cream,
    fontSize: 34,
    fontWeight: '800',
    marginTop: 2,
  },
  subtitle: {
    color: Brand.creamMuted,
    fontSize: 14,
    marginTop: 4,
  },

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
  searchInput: {
    flex: 1,
    color: Brand.cream,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearIcon: {
    color: Brand.creamMuted,
    fontSize: 16,
    paddingHorizontal: 4,
  },

  chipsList: {
    maxHeight: 56,
    marginTop: Spacing.sm,
  },
  chipsRow: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: Brand.gold,
    borderColor: Brand.gold,
  },
  chipText: {
    color: Brand.cream,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Brand.night,
    fontWeight: '800',
  },

  list: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    overflow: 'hidden',
    padding: Spacing.sm,
    gap: Spacing.md,
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: Radius.sm,
    backgroundColor: Brand.night,
  },
  cardImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageFallbackText: {
    fontSize: 30,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    color: Brand.cream,
    fontSize: 17,
    fontWeight: '700',
  },
  cardRegion: {
    color: Brand.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  cardDesc: {
    color: Brand.creamMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  cardChevron: {
    color: Brand.gold,
    fontSize: 28,
    fontWeight: '300',
    paddingRight: Spacing.xs,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  muted: {
    color: Brand.creamMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  errorIcon: { fontSize: 44 },
  errorTitle: {
    color: Brand.cream,
    fontSize: 18,
    fontWeight: '700',
  },
  retryBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Brand.gold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  retryText: {
    color: Brand.night,
    fontWeight: '800',
    fontSize: 14,
  },
});
