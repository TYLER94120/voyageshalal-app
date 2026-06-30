import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { getVille, type Lieu, type VilleDetail } from '@/lib/api';
import { setPendingCity } from '@/lib/pendingCity';

type TabKey = 'restaurants' | 'mosquees' | 'hotels' | 'activites' | 'pratique';

const TABS: { key: TabKey; emoji: string; label: string }[] = [
  { key: 'restaurants', emoji: '🍽️', label: 'Restaurants' },
  { key: 'mosquees', emoji: '🕌', label: 'Mosquées' },
  { key: 'hotels', emoji: '🏨', label: 'Hôtels' },
  { key: 'activites', emoji: '🗺️', label: 'À faire' },
  { key: 'pratique', emoji: 'ℹ️', label: 'Pratique' },
];

type LoadState = 'loading' | 'ready' | 'error';

export default function VilleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [ville, setVille] = useState<VilleDetail | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [tab, setTab] = useState<TabKey>('restaurants');

  const load = useCallback(async () => {
    if (!slug) return;
    setState('loading');
    try {
      setVille(await getVille(slug));
      setState('ready');
    } catch (err) {
      console.warn('[ville] échec chargement', slug, err);
      setState('error');
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  // Compteurs par onglet, pour afficher les badges
  const counts = useMemo(() => {
    if (!ville) return {} as Record<TabKey, number>;
    return {
      restaurants: ville.restaurants.length,
      mosquees: ville.mosquees.length,
      hotels: ville.hotels.length,
      activites: ville.activites.length,
      pratique: ville.pratique ? 1 : 0,
    } as Record<TabKey, number>;
  }, [ville]);

  const lieux: Lieu[] = useMemo(() => {
    if (!ville || tab === 'pratique') return [];
    return ville[tab];
  }, [ville, tab]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: ville?.nom ?? 'Ville',
          headerStyle: { backgroundColor: Brand.night },
          headerTintColor: Brand.gold,
          headerTitleStyle: { color: Brand.cream, fontWeight: '800' },
        }}
      />

      {state === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.gold} />
          <Text style={styles.muted}>Chargement…</Text>
        </View>
      )}

      {state === 'error' && (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>📡</Text>
          <Text style={styles.errorTitle}>Ville indisponible</Text>
          <Text style={styles.muted}>Impossible de charger « {slug} ».</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
          <Pressable style={styles.linkBtn} onPress={() => router.back()}>
            <Text style={styles.linkText}>Retour</Text>
          </Pressable>
        </View>
      )}

      {state === 'ready' && ville && (
        <FlatList
          data={lieux}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <VilleHeader ville={ville} tab={tab} setTab={setTab} counts={counts} />
          }
          ListEmptyComponent={
            tab === 'pratique' ? (
              <PratiqueBlock text={ville.pratique} />
            ) : (
              <View style={styles.emptyTab}>
                <Text style={styles.muted}>
                  Aucune adresse renseignée pour cet onglet pour le moment.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => <LieuCard lieu={item} />}
        />
      )}
    </View>
  );
}

function VilleHeader({
  ville,
  tab,
  setTab,
  counts,
}: {
  ville: VilleDetail;
  tab: TabKey;
  setTab: (t: TabKey) => void;
  counts: Record<TabKey, number>;
}) {
  const router = useRouter();
  const seeOnMap = () => {
    setPendingCity({
      slug: ville.slug,
      nom: ville.nom,
      latitude: ville.latitude,
      longitude: ville.longitude,
    });
    router.navigate('/');
  };
  return (
    <View>
      {ville.image ? (
        <Image source={{ uri: ville.image }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroFallback]}>
          <Text style={styles.heroFallbackText}>🕌</Text>
        </View>
      )}
      <View style={styles.heroOverlay}>
        <Text style={styles.heroName}>{ville.nom}</Text>
        {(ville.region || ville.pays) && (
          <Text style={styles.heroRegion}>
            📍 {[ville.region, ville.pays].filter(Boolean).join(' · ')}
          </Text>
        )}
      </View>

      {ville.description && <Text style={styles.intro}>{ville.description}</Text>}

      <Pressable style={styles.mapBtn} onPress={seeOnMap}>
        <Text style={styles.mapBtnText}>🗺️  Voir les mosquées & restos sur la carte</Text>
      </Pressable>

      {/* Onglets */}
      <FlatList
        data={TABS}
        keyExtractor={(t) => t.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsList}
        renderItem={({ item }) => {
          const active = tab === item.key;
          const count = counts[item.key] ?? 0;
          return (
            <Pressable
              onPress={() => setTab(item.key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={styles.tabEmoji}>{item.emoji}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
              {count > 0 && item.key !== 'pratique' && (
                <View style={[styles.badge, active && styles.badgeActive]}>
                  <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{count}</Text>
                </View>
              )}
            </Pressable>
          );
        }}
      />

      {tab === 'mosquees' && (
        <Pressable style={styles.mosqueeHint} onPress={seeOnMap}>
          <Text style={styles.mosqueeHintText}>
            📍 La mosquée la plus proche de vous (en temps réel) → ouvrir la carte
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function LieuCard({ lieu }: { lieu: Lieu }) {
  // Priorité au lien Maps fourni par la base ; sinon coords, sinon nom+adresse.
  const openMaps = () => {
    if (lieu.mapsUrl) {
      Linking.openURL(lieu.mapsUrl).catch(() => undefined);
      return;
    }
    if (lieu.latitude != null && lieu.longitude != null) {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${lieu.latitude},${lieu.longitude}`,
      ).catch(() => undefined);
      return;
    }
    const q = [lieu.nom, lieu.adresse].filter(Boolean).join(', ');
    if (q) {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
      ).catch(() => undefined);
    }
  };

  // Un lieu a toujours au moins un nom → on peut toujours l'ouvrir dans Maps.
  const hasLocation = true;

  return (
    <View style={styles.card}>
      {lieu.image && <Image source={{ uri: lieu.image }} style={styles.cardImage} />}
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardName}>{lieu.nom}</Text>
          {lieu.note != null && (
            <View style={styles.rating}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingText}>{lieu.note.toFixed(1)}</Text>
            </View>
          )}
        </View>
        {lieu.adresse && <Text style={styles.cardAddress}>{lieu.adresse}</Text>}
        {lieu.description && (
          <Text style={styles.cardDesc} numberOfLines={3}>
            {lieu.description}
          </Text>
        )}
        <View style={styles.actionsRow}>
          {hasLocation && (
            <Pressable style={styles.actionBtn} onPress={openMaps}>
              <Text style={styles.actionText}>🧭 Itinéraire</Text>
            </Pressable>
          )}
          {lieu.telephone && (
            <Pressable
              style={styles.actionBtn}
              onPress={() => Linking.openURL(`tel:${lieu.telephone}`).catch(() => undefined)}
            >
              <Text style={styles.actionText}>📞 Appeler</Text>
            </Pressable>
          )}
          {lieu.site && (
            <Pressable
              style={styles.actionBtn}
              onPress={() => Linking.openURL(lieu.site!).catch(() => undefined)}
            >
              <Text style={styles.actionText}>🔗 Site</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function PratiqueBlock({ text }: { text?: string }) {
  if (!text) {
    return (
      <View style={styles.emptyTab}>
        <Text style={styles.muted}>Infos pratiques bientôt disponibles.</Text>
      </View>
    );
  }
  return (
    <View style={styles.pratiqueBox}>
      <Text style={styles.pratiqueText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.night },

  list: { paddingBottom: Spacing.xl },

  hero: { width: '100%', height: 200, backgroundColor: Brand.forest },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
  heroFallbackText: { fontSize: 64 },
  heroOverlay: {
    position: 'absolute',
    left: Spacing.lg,
    top: 140,
  },
  heroName: {
    color: Brand.cream,
    fontSize: 30,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 8,
  },
  heroRegion: {
    color: Brand.gold,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
  },
  intro: {
    color: Brand.creamMuted,
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },

  mapBtn: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Brand.gold,
    borderRadius: Radius.pill,
    paddingVertical: 13,
    alignItems: 'center',
  },
  mapBtnText: { color: Brand.night, fontWeight: '800', fontSize: 14 },

  mosqueeHint: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Brand.goldSoft,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.md,
  },
  mosqueeHintText: { color: Brand.gold, fontSize: 13, fontWeight: '700', textAlign: 'center' },

  tabsList: { marginTop: Spacing.md },
  tabsRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  tabActive: { backgroundColor: Brand.gold, borderColor: Brand.gold },
  tabEmoji: { fontSize: 14 },
  tabLabel: { color: Brand.cream, fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: Brand.night, fontWeight: '800' },
  badge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.pill,
    backgroundColor: Brand.goldSoft,
    alignItems: 'center',
  },
  badgeActive: { backgroundColor: Brand.night },
  badgeText: { color: Brand.gold, fontSize: 11, fontWeight: '800' },
  badgeTextActive: { color: Brand.gold },

  card: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 140, backgroundColor: Brand.night },
  cardBody: { padding: Spacing.md, gap: 4 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardName: { color: Brand.cream, fontSize: 17, fontWeight: '700', flex: 1 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingStar: { color: Brand.gold, fontSize: 14 },
  ratingText: { color: Brand.gold, fontSize: 13, fontWeight: '800' },
  cardAddress: { color: Brand.creamMuted, fontSize: 13 },
  cardDesc: { color: Brand.creamMuted, fontSize: 13, lineHeight: 19, marginTop: 2 },

  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Brand.goldSoft,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  actionText: { color: Brand.gold, fontSize: 12, fontWeight: '700' },

  pratiqueBox: {
    margin: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  pratiqueText: { color: Brand.cream, fontSize: 14, lineHeight: 22 },

  emptyTab: { padding: Spacing.xl, alignItems: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  muted: { color: Brand.creamMuted, fontSize: 14, textAlign: 'center' },
  errorIcon: { fontSize: 44 },
  errorTitle: { color: Brand.cream, fontSize: 18, fontWeight: '700' },
  retryBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Brand.gold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  retryText: { color: Brand.night, fontWeight: '800', fontSize: 14 },
  linkBtn: { marginTop: Spacing.xs, padding: Spacing.sm },
  linkText: { color: Brand.gold, fontWeight: '700', fontSize: 14 },
});
