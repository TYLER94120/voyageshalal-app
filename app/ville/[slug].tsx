import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Callout, Marker, Region } from 'react-native-maps';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { distanceKm, formatDistance } from '@/lib/geo';
import { openMapsUrl, openDirections } from '@/lib/maps';
import { getVille, halalBadge, type Lieu, type VilleDetail } from '@/lib/api';
import {
  applyLieuFilters,
  categoryFacets,
  EMPTY_FILTERS,
  hasActiveFilters,
  sortOptionsFor,
  tagFacets,
  tagLabel,
  type LieuFilters,
  type SortKey,
} from '@/lib/lieuSort';
import { hotelLocationStats, type HotelLocationStats } from '@/lib/hotelLocation';

type TabKey = 'restaurants' | 'mosquees' | 'hotels' | 'activites' | 'pratique';

const TABS: { key: TabKey; emoji: string; label: string }[] = [
  { key: 'restaurants', emoji: '🍽️', label: 'Restaurants' },
  { key: 'mosquees', emoji: '🕌', label: 'Mosquées' },
  { key: 'hotels', emoji: '🏨', label: 'Hôtels' },
  { key: 'activites', emoji: '🗺️', label: 'À faire' },
  { key: 'pratique', emoji: 'ℹ️', label: 'Pratique' },
];

type LoadState = 'loading' | 'ready' | 'error';
type LieuDist = Lieu & { dist: number | null };

// Onglets affichant des pins sur la carte.
const MAP_TABS: TabKey[] = ['restaurants', 'mosquees', 'activites', 'hotels'];

// Filtres équipements halal pour les hôtels.
const HOTEL_FILTERS: { key: string; label: string; test: (l: Lieu) => boolean | undefined }[] = [
  { key: 'priere', label: '🕌 Salle de prière', test: (l) => l.salleDePriere },
  { key: 'sansAlcool', label: '🚫 Sans alcool', test: (l) => l.sansAlcool },
  { key: 'petitDej', label: '🍳 Petit-déj halal', test: (l) => l.petitDejeunerHalal },
];

function pinColor(tab: TabKey, lieu: Lieu): string {
  if (tab === 'restaurants') {
    const b = halalBadge(lieu.halalConfidence);
    return b?.tone === 'amber' ? '#c9a84c' : '#2d6a4f';
  }
  if (tab === 'mosquees') return '#1b4332';
  if (tab === 'activites') return '#6A1B9A';
  return '#2b6cb0';
}

export default function VilleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [ville, setVille] = useState<VilleDetail | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [tab, setTab] = useState<TabKey>('restaurants');
  const [hotelFilters, setHotelFilters] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [filters, setFilters] = useState<LieuFilters>(EMPTY_FILTERS);
  const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number } | null>(null);

  // Changer d'onglet remet à zéro tri & filtres (chaque onglet a ses propres facettes).
  const selectTab = useCallback((k: TabKey) => {
    setTab(k);
    setSortKey(null);
    setFilters(EMPTY_FILTERS);
    setHotelFilters([]);
  }, []);

  // Position connue de l'utilisateur (sans nouvelle demande de permission) : sert à
  // trier « au plus proche » quand il est physiquement dans la ville.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const Location = await import('expo-location');
        const perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted) return;
        const pos = await Location.getLastKnownPositionAsync();
        if (alive && pos) {
          setUserLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        }
      } catch {
        /* géoloc indisponible : on retombe sur le centre-ville */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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

  const cityCoords = useMemo(
    () =>
      ville && ville.latitude != null && ville.longitude != null
        ? { latitude: ville.latitude, longitude: ville.longitude }
        : null,
    [ville],
  );

  // Origine des distances : la position de l'utilisateur s'il est dans la ville
  // (≤ 80 km du centre), sinon le centre-ville.
  const distOrigin = useMemo(() => {
    if (userLoc && cityCoords) {
      const d = distanceKm(userLoc.latitude, userLoc.longitude, cityCoords.latitude, cityCoords.longitude);
      if (d <= 80) return { coords: userLoc, fromUser: true };
    }
    return cityCoords ? { coords: cityCoords, fromUser: false } : null;
  }, [userLoc, cityCoords]);

  // Liste brute de l'onglet enrichie d'une distance, et — pour les hôtels — d'un
  // score « bien situé » (proximité mosquée + restos halal autour).
  const rawWithDist = useMemo(() => {
    if (!ville || tab === 'pratique') return [];
    return ville[tab].map((l) => {
      const dist =
        distOrigin && l.latitude != null && l.longitude != null
          ? distanceKm(distOrigin.coords.latitude, distOrigin.coords.longitude, l.latitude, l.longitude)
          : null;
      if (tab === 'hotels') {
        const loc = hotelLocationStats(l, ville.mosquees, ville.restaurants, 1);
        return { ...l, dist, locScore: loc.score, loc };
      }
      return { ...l, dist, locScore: null as number | null, loc: undefined as HotelLocationStats | undefined };
    });
  }, [ville, tab, distOrigin]);

  // Facettes (tri + filtres) calculées sur la liste réelle de l'onglet.
  const sortOptions = useMemo(
    () => sortOptionsFor(rawWithDist, distOrigin != null),
    [rawWithDist, distOrigin],
  );
  const catFacets = useMemo(() => categoryFacets(rawWithDist), [rawWithDist]);
  const ambianceFacets = useMemo(
    () => (tab === 'restaurants' ? tagFacets(rawWithDist) : []),
    [rawWithDist, tab],
  );
  const effectiveSort: SortKey = sortKey ?? sortOptions[0]?.key ?? 'proche';

  // Filtres équipements hôtels (booléens), appliqués avant le moteur générique.
  const lieux = useMemo(() => {
    let base = rawWithDist;
    if (tab === 'hotels' && hotelFilters.length > 0) {
      base = base.filter((h) =>
        hotelFilters.every((k) => HOTEL_FILTERS.find((f) => f.key === k)?.test(h)),
      );
    }
    return applyLieuFilters(base, filters, effectiveSort);
  }, [rawWithDist, tab, hotelFilters, filters, effectiveSort]);

  const pins = useMemo(() => lieux.filter((l) => l.latitude != null && l.longitude != null), [lieux]);
  const showMap = MAP_TABS.includes(tab) && !!cityCoords;

  // Cadre la carte sur les pins de l'onglet actif.
  useEffect(() => {
    if (!showMap) return;
    if (pins.length > 0) {
      mapRef.current?.fitToCoordinates(
        pins.map((p) => ({ latitude: p.latitude!, longitude: p.longitude! })),
        { edgePadding: { top: 60, left: 60, right: 60, bottom: 60 }, animated: true },
      );
    } else if (cityCoords) {
      mapRef.current?.animateToRegion(
        { ...cityCoords, latitudeDelta: 0.12, longitudeDelta: 0.12 },
        400,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, ville?.slug, pins.length]);

  const initialRegion: Region | undefined = cityCoords
    ? { ...cityCoords, latitudeDelta: 0.12, longitudeDelta: 0.12 }
    : undefined;

  const goLieu = (l: Lieu) => {
    if (l.mapsUrl) openMapsUrl(l.mapsUrl);
    else if (l.latitude != null && l.longitude != null) openDirections(l.latitude, l.longitude);
  };

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
        <>
          {/* Carte (onglets géolocalisés) */}
          {showMap && (
            <View style={styles.mapWrap}>
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                initialRegion={initialRegion}
                showsCompass={false}
                rotateEnabled={false}
                pitchEnabled={false}
                toolbarEnabled={false}
              >
                {pins.map((p) => (
                  <Marker
                    key={p.id}
                    coordinate={{ latitude: p.latitude!, longitude: p.longitude! }}
                    pinColor={pinColor(tab, p)}
                  >
                    <Callout tooltip onPress={() => goLieu(p)}>
                      <View style={styles.callout}>
                        <Text style={styles.calloutName}>{p.nom}</Text>
                        {tab === 'restaurants' &&
                          (() => {
                            const b = halalBadge(p.halalConfidence);
                            return b ? (
                              <Text
                                style={[
                                  styles.calloutBadge,
                                  b.tone === 'green' ? styles.calloutGreen : styles.calloutAmber,
                                ]}
                              >
                                {b.label}
                              </Text>
                            ) : null;
                          })()}
                        {tab === 'hotels' && p.loc?.nearestMosqueKm != null && (
                          <Text style={styles.calloutMeta}>
                            🕌 Mosquée à {formatDistance(p.loc.nearestMosqueKm)}
                            {p.loc.restosNear > 0 ? ` · 🍽️ ${p.loc.restosNear} restos` : ''}
                          </Text>
                        )}
                        <View style={styles.calloutCta}>
                          <Text style={styles.calloutCtaText}>🧭 Itinéraire</Text>
                        </View>
                      </View>
                    </Callout>
                  </Marker>
                ))}
              </MapView>
              {pins.length === 0 && (
                <View style={styles.mapEmpty} pointerEvents="none">
                  <Text style={styles.mapEmptyText}>Positions bientôt disponibles</Text>
                </View>
              )}
            </View>
          )}

          {/* Onglets */}
          <View style={styles.tabsBar}>
            <FlatList
              data={TABS}
              keyExtractor={(t) => t.key}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsRow}
              renderItem={({ item }) => {
                const active = tab === item.key;
                const count = counts[item.key] ?? 0;
                return (
                  <Pressable onPress={() => selectTab(item.key)} style={[styles.tab, active && styles.tabActive]}>
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
          </View>

          {/* Tri + filtres (restaurants / activités / hôtels) */}
          {tab !== 'pratique' && tab !== 'mosquees' && (
            <View style={styles.controls}>
              {sortOptions.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.controlRow}
                >
                  {sortOptions.map((o) => {
                    const on = effectiveSort === o.key;
                    return (
                      <Pressable
                        key={o.key}
                        onPress={() => setSortKey(o.key)}
                        style={[styles.sortPill, on && styles.sortPillOn]}
                      >
                        <Text style={[styles.sortPillText, on && styles.sortPillTextOn]}>{o.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.controlRow}
              >
                {tab === 'restaurants' && (
                  <FilterChip
                    label="✓ Certifié"
                    on={filters.certifOnly}
                    tone="green"
                    onPress={() => setFilters((f) => ({ ...f, certifOnly: !f.certifOnly }))}
                  />
                )}
                {tab === 'activites' && rawWithDist.some((l) => l.price?.toLowerCase() === 'gratuit') && (
                  <FilterChip
                    label="🆓 Gratuit"
                    on={filters.gratuitOnly}
                    onPress={() => setFilters((f) => ({ ...f, gratuitOnly: !f.gratuitOnly }))}
                  />
                )}
                {catFacets.map((c) => (
                  <FilterChip
                    key={`c-${c}`}
                    label={c}
                    on={filters.categories.includes(c)}
                    onPress={() =>
                      setFilters((f) => ({
                        ...f,
                        categories: f.categories.includes(c)
                          ? f.categories.filter((x) => x !== c)
                          : [...f.categories, c],
                      }))
                    }
                  />
                ))}
                {ambianceFacets.map((t) => (
                  <FilterChip
                    key={`t-${t}`}
                    label={tagLabel(t)}
                    on={filters.tags.includes(t)}
                    onPress={() =>
                      setFilters((f) => ({
                        ...f,
                        tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t],
                      }))
                    }
                  />
                ))}
                {tab === 'hotels' &&
                  HOTEL_FILTERS.map((hf) => (
                    <FilterChip
                      key={`h-${hf.key}`}
                      label={hf.label}
                      on={hotelFilters.includes(hf.key)}
                      onPress={() =>
                        setHotelFilters((prev) =>
                          prev.includes(hf.key) ? prev.filter((k) => k !== hf.key) : [...prev, hf.key],
                        )
                      }
                    />
                  ))}
              </ScrollView>

              <View style={styles.resultRow}>
                <Text style={styles.resultCount}>
                  {lieux.length} résultat{lieux.length > 1 ? 's' : ''}
                  {distOrigin?.fromUser && effectiveSort === 'proche' ? ' · près de vous' : ''}
                </Text>
                {(hasActiveFilters(filters) || hotelFilters.length > 0) && (
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      setFilters(EMPTY_FILTERS);
                      setHotelFilters([]);
                    }}
                  >
                    <Text style={styles.clearLink}>Effacer</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Contenu */}
          {tab === 'pratique' ? (
            <ScrollView style={styles.list} contentContainerStyle={styles.listPad}>
              <PratiqueBlock text={ville.pratique} />
            </ScrollView>
          ) : (
            <FlatList
              data={lieux}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listPad}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyTab}>
                  <Text style={styles.muted}>Rien pour cet onglet pour le moment.</Text>
                </View>
              }
              renderItem={({ item }) =>
                tab === 'hotels' ? (
                  <HotelCard hotel={item} loc={item.loc} dist={item.dist} onGo={() => goLieu(item)} />
                ) : (
                  <LieuCard lieu={item} dist={item.dist} onGo={() => goLieu(item)} />
                )
              }
            />
          )}
        </>
      )}
    </View>
  );
}

function HotelCard({
  hotel,
  loc,
  dist,
  onGo,
}: {
  hotel: Lieu;
  loc?: HotelLocationStats;
  dist?: number | null;
  onGo: () => void;
}) {
  const amenities: string[] = [];
  if (hotel.salleDePriere) amenities.push('🕌 Salle de prière');
  if (hotel.qibla) amenities.push('🧭 Qibla');
  if (hotel.petitDejeunerHalal) amenities.push('🍳 Petit-déj halal');
  if (hotel.sansAlcool) amenities.push('🚫 Sans alcool');
  if (hotel.piscineNonMixte) amenities.push('🏊 Piscine non-mixte');
  if (hotel.halalFriendly && amenities.length === 0) amenities.push('✓ Halal-friendly');

  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardName}>{hotel.nom}</Text>
          {hotel.note != null && (
            <View style={styles.rating}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingText}>{hotel.note.toFixed(1)}</Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          {hotel.category && <Text style={styles.metaText}>{hotel.category}</Text>}
          {hotel.price && <Text style={styles.metaText}>{hotel.price}</Text>}
          {dist != null && <Text style={styles.metaText}>📍 {formatDistance(dist)}</Text>}
          {dist == null && hotel.adresse && <Text style={styles.metaText}>📍 {hotel.adresse}</Text>}
        </View>

        {/* Score « bien situé » : proximité mosquée + restos halal autour */}
        {loc && (loc.nearestMosqueKm != null || loc.restosNear > 0) && (
          <View style={styles.locRow}>
            {loc.nearestMosqueKm != null && (
              <Text style={styles.locBadge}>🕌 Mosquée à {formatDistance(loc.nearestMosqueKm)}</Text>
            )}
            {loc.restosNear > 0 && (
              <Text style={styles.locBadge}>
                🍽️ {loc.restosNear} resto{loc.restosNear > 1 ? 's' : ''} halal à proximité
              </Text>
            )}
          </View>
        )}

        {amenities.length > 0 && (
          <View style={styles.amenityRow}>
            {amenities.map((a) => (
              <Text key={a} style={styles.amenity}>
                {a}
              </Text>
            ))}
          </View>
        )}

        {hotel.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {hotel.description}
          </Text>
        )}

        <View style={styles.actionsRow}>
          {hotel.halalBookingUrl ? (
            <Pressable
              style={styles.bookBtn}
              onPress={() => Linking.openURL(hotel.halalBookingUrl!).catch(() => undefined)}
            >
              <Text style={styles.bookText}>🕌 Réserver halal</Text>
            </Pressable>
          ) : null}
          {hotel.bookingUrl ? (
            <Pressable
              style={styles.actionBtn}
              onPress={() => Linking.openURL(hotel.bookingUrl!).catch(() => undefined)}
            >
              <Text style={styles.actionText}>Réserver</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.actionBtn} onPress={onGo}>
            <Text style={styles.actionText}>🧭 Itinéraire</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function LieuCard({ lieu, dist, onGo }: { lieu: LieuDist; dist: number | null; onGo: () => void }) {
  const badge = halalBadge(lieu.halalConfidence);
  return (
    <View style={styles.card}>
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

        <View style={styles.metaRow}>
          {badge && (
            <Text
              style={[styles.halalBadge, badge.tone === 'green' ? styles.halalGreen : styles.halalAmber]}
            >
              {badge.label}
            </Text>
          )}
          {lieu.category && <Text style={styles.metaText}>{lieu.category}</Text>}
          {lieu.price && <Text style={styles.metaText}>{lieu.price}</Text>}
          {lieu.reviewCount != null && (
            <Text style={styles.metaText}>🔥 {formatCount(lieu.reviewCount)} avis</Text>
          )}
          {lieu.duree && <Text style={styles.metaText}>⏱️ {lieu.duree}</Text>}
          {dist != null && <Text style={styles.metaText}>📍 {formatDistance(dist)}</Text>}
        </View>

        {lieu.specialite && (
          <Text style={styles.specialite}>⭐ Spécialité : {lieu.specialite}</Text>
        )}

        {lieu.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {lieu.description}
          </Text>
        )}

        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={onGo}>
            <Text style={styles.actionText}>🧭 Itinéraire</Text>
          </Pressable>
          {lieu.telephone && (
            <Pressable
              style={styles.actionBtn}
              onPress={() => Linking.openURL(`tel:${lieu.telephone}`).catch(() => undefined)}
            >
              <Text style={styles.actionText}>📞 Appeler</Text>
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

// Séparateur de milliers sans dépendre d'Intl (limité sous Hermes).
function formatCount(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function FilterChip({
  label,
  on,
  onPress,
  tone,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  tone?: 'green';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.fchip, on && (tone === 'green' ? styles.fchipGreenOn : styles.fchipOn)]}
    >
      <Text
        style={[
          styles.fchipText,
          on && (tone === 'green' ? styles.fchipTextGreenOn : styles.fchipTextOn),
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.night },

  mapWrap: { height: 260, backgroundColor: Brand.forest },
  mapEmpty: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  mapEmptyText: { color: Brand.cream, fontWeight: '700', backgroundColor: Brand.nightSoft, padding: Spacing.sm, borderRadius: Radius.sm },

  tabsBar: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Brand.border },
  tabsRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm },
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
  badge: { minWidth: 20, paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.pill, backgroundColor: Brand.goldSoft, alignItems: 'center' },
  badgeActive: { backgroundColor: Brand.night },
  badgeText: { color: Brand.gold, fontSize: 11, fontWeight: '800' },
  badgeTextActive: { color: Brand.gold },

  list: { flex: 1 },
  listPad: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xl * 2 },

  controls: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Brand.border, paddingTop: Spacing.sm, gap: 8 },
  controlRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, alignItems: 'center' },
  sortPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Brand.forest,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  sortPillOn: { backgroundColor: Brand.night, borderColor: Brand.gold },
  sortPillText: { color: Brand.creamMuted, fontSize: 13, fontWeight: '700' },
  sortPillTextOn: { color: Brand.gold, fontWeight: '800' },

  fchip: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.pill, borderWidth: 1, borderColor: Brand.border },
  fchipOn: { backgroundColor: Brand.gold, borderColor: Brand.gold },
  fchipGreenOn: { backgroundColor: '#2d6a4f', borderColor: '#2d6a4f' },
  fchipText: { color: Brand.cream, fontSize: 12, fontWeight: '700' },
  fchipTextOn: { color: Brand.night, fontWeight: '800' },
  fchipTextGreenOn: { color: '#eafff1', fontWeight: '800' },

  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  resultCount: { color: Brand.creamMuted, fontSize: 12, fontWeight: '700' },
  clearLink: { color: Brand.gold, fontSize: 12, fontWeight: '800' },

  amenityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  amenity: {
    backgroundColor: 'rgba(45,106,79,0.85)',
    color: '#eafff1',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  bookBtn: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Brand.gold },
  bookText: { color: Brand.night, fontSize: 12, fontWeight: '800' },

  card: {
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    overflow: 'hidden',
  },
  cardBody: { padding: Spacing.md, gap: 6 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  cardName: { color: Brand.cream, fontSize: 17, fontWeight: '700', flex: 1 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingStar: { color: Brand.gold, fontSize: 14 },
  ratingText: { color: Brand.gold, fontSize: 13, fontWeight: '800' },

  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  halalBadge: { borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 2, fontSize: 11, fontWeight: '800', overflow: 'hidden' },
  halalGreen: { backgroundColor: '#2d6a4f', color: '#eafff1' },
  halalAmber: { backgroundColor: Brand.gold, color: Brand.night },
  metaText: { color: Brand.creamMuted, fontSize: 12, fontWeight: '600' },

  cardDesc: { color: Brand.creamMuted, fontSize: 13, lineHeight: 19, marginTop: 2 },
  specialite: { color: Brand.gold, fontSize: 12, fontWeight: '700', marginTop: 2 },

  locRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  locBadge: {
    backgroundColor: 'rgba(201,168,76,0.16)',
    borderWidth: 1,
    borderColor: Brand.gold,
    color: Brand.gold,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },

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

  pratiqueBox: { backgroundColor: Brand.forest, borderRadius: Radius.md, borderWidth: 1, borderColor: Brand.border, padding: Spacing.md },
  pratiqueText: { color: Brand.cream, fontSize: 14, lineHeight: 22 },

  emptyTab: { padding: Spacing.xl, alignItems: 'center' },

  callout: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    width: 200,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  calloutName: { fontWeight: '700', fontSize: 14, color: '#111' },
  calloutMeta: { fontSize: 12, fontWeight: '700', color: '#1b4332' },
  calloutBadge: { alignSelf: 'flex-start', borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 2, fontSize: 11, fontWeight: '800', overflow: 'hidden' },
  calloutGreen: { backgroundColor: '#2d6a4f', color: '#eafff1' },
  calloutAmber: { backgroundColor: Brand.gold, color: Brand.night },
  calloutCta: { marginTop: 4, backgroundColor: Brand.forest, borderRadius: Radius.sm, paddingVertical: 7, alignItems: 'center' },
  calloutCtaText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  muted: { color: Brand.creamMuted, fontSize: 14, textAlign: 'center' },
  errorIcon: { fontSize: 44 },
  errorTitle: { color: Brand.cream, fontSize: 18, fontWeight: '700' },
  retryBtn: { marginTop: Spacing.sm, backgroundColor: Brand.gold, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.pill },
  retryText: { color: Brand.night, fontWeight: '800', fontSize: 14 },
  linkBtn: { marginTop: Spacing.xs, padding: Spacing.sm },
  linkText: { color: Brand.gold, fontWeight: '700', fontSize: 14 },
});
