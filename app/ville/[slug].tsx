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
import { halalBadge, type Lieu, type PratiqueItem, type VilleDetail } from '@/lib/api';
import { getVilleCached } from '@/lib/cityCache';
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
import { dedupeHotels, hotelLocationStats, type HotelLocationStats } from '@/lib/hotelLocation';
import { HotelAroundSheet } from '@/components/HotelAroundSheet';
import { fetchNearbyMosques } from '@/lib/overpass';
import { mergeMosquees, osmToLieu } from '@/lib/mosques';
import { HeartButton } from '@/components/HeartButton';
import { cityFavKey, placeFavKey, type FavoriteItem } from '@/lib/favorites';

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
  const [aroundHotel, setAroundHotel] = useState<Lieu | null>(null);
  // Mosquées exhaustives (OpenStreetMap) pour fiabiliser le score & la carte.
  const [osmMosquees, setOsmMosquees] = useState<Lieu[]>([]);
  // Sélection premium active (restaurants) + filtre « proche mosquée » (hôtels).
  const [selection, setSelection] = useState<string | null>(null);
  const [nearMosqueOnly, setNearMosqueOnly] = useState(false);
  const [offline, setOffline] = useState(false);

  // Changer d'onglet remet à zéro tri & filtres (chaque onglet a ses propres facettes).
  const selectTab = useCallback((k: TabKey) => {
    setTab(k);
    setSortKey(null);
    setFilters(EMPTY_FILTERS);
    setHotelFilters([]);
    setSelection(null);
    setNearMosqueOnly(false);
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
      const { data, offline: off } = await getVilleCached(slug);
      setVille(data);
      setOffline(off);
      setState('ready');
    } catch (err) {
      console.warn('[ville] échec chargement', slug, err);
      setState('error');
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const cityCoords = useMemo(
    () =>
      ville && ville.latitude != null && ville.longitude != null
        ? { latitude: ville.latitude, longitude: ville.longitude }
        : null,
    [ville],
  );

  // Mosquées exhaustives via OpenStreetMap (comme l'accueil) : fiabilise le score
  // hôtel et complète la fiche ville. 18 km couvrent l'agglomération.
  useEffect(() => {
    setOsmMosquees([]);
    if (!cityCoords) return;
    let alive = true;
    fetchNearbyMosques(cityCoords.latitude, cityCoords.longitude, 18000)
      .then((places) => {
        if (alive) setOsmMosquees(places.map(osmToLieu));
      })
      .catch(() => {
        /* OSM indisponible : on garde les mosquées principales de l'API */
      });
    return () => {
      alive = false;
    };
  }, [cityCoords]);

  // Liste de mosquées de référence : API (curée) + OSM (exhaustive), dédupliquée.
  const allMosquees = useMemo(
    () => mergeMosquees(ville?.mosquees ?? [], osmMosquees),
    [ville, osmMosquees],
  );

  // Hôtels dédupliqués (curés + OSM densifiés) — utilisés partout.
  const hotelsList = useMemo(() => (ville ? dedupeHotels(ville.hotels) : []), [ville]);

  const counts = useMemo(() => {
    if (!ville) return {} as Record<TabKey, number>;
    return {
      restaurants: ville.restaurants.length,
      mosquees: Math.max(ville.mosquees.length, allMosquees.length),
      hotels: hotelsList.length,
      activites: ville.activites.length,
      pratique: ville.pratiqueInfos.length > 0 || ville.pratique ? 1 : 0,
    } as Record<TabKey, number>;
  }, [ville, allMosquees, hotelsList]);

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
    // Mosquées : liste exhaustive (API + OSM). Hôtels : dédupliqués.
    const source = tab === 'mosquees' ? allMosquees : tab === 'hotels' ? hotelsList : ville[tab];
    return source.map((l) => {
      const dist =
        distOrigin && l.latitude != null && l.longitude != null
          ? distanceKm(distOrigin.coords.latitude, distOrigin.coords.longitude, l.latitude, l.longitude)
          : null;
      if (tab === 'hotels') {
        const loc = hotelLocationStats(l, allMosquees, ville.restaurants, 1);
        return { ...l, dist, locScore: loc.score, loc };
      }
      return { ...l, dist, locScore: null as number | null, loc: undefined as HotelLocationStats | undefined };
    });
  }, [ville, tab, distOrigin, allMosquees, hotelsList]);

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

  // Noms de la sélection premium active (restaurants), normalisés pour le matching.
  const selectionNames = useMemo(() => {
    if (tab !== 'restaurants' || !selection || !ville) return null;
    const sel = ville.selections.find((s) => s.key === selection);
    if (!sel) return null;
    return new Set(sel.names.map((n) => n.trim().toLowerCase()));
  }, [tab, selection, ville]);

  // Filtres hôtels (équipements + proche mosquée) et sélection premium (restos).
  const lieux = useMemo(() => {
    let base = rawWithDist;
    if (tab === 'hotels' && hotelFilters.length > 0) {
      base = base.filter((h) =>
        hotelFilters.every((k) => HOTEL_FILTERS.find((f) => f.key === k)?.test(h)),
      );
    }
    if (tab === 'hotels' && nearMosqueOnly) {
      base = base.filter((h) => h.loc?.nearestMosqueKm != null && h.loc.nearestMosqueKm <= 0.5);
    }
    if (selectionNames) {
      base = base.filter((l) => selectionNames.has(l.nom.trim().toLowerCase()));
    }
    return applyLieuFilters(base, filters, effectiveSort);
  }, [rawWithDist, tab, hotelFilters, nearMosqueOnly, selectionNames, filters, effectiveSort]);

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
          headerRight: () =>
            ville ? (
              <HeartButton
                size={22}
                item={{
                  id: cityFavKey(ville.slug),
                  type: 'city',
                  title: ville.nom,
                  subtitle: [ville.pays, ville.continent].filter(Boolean).join(' · '),
                  emoji: '🏙️',
                  citySlug: ville.slug,
                  image: ville.image,
                }}
              />
            ) : null,
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
          {offline && (
            <View style={styles.offlineBar}>
              <Text style={styles.offlineText}>📡 Hors-ligne — dernière version enregistrée</Text>
            </View>
          )}

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
              {/* Sélections premium curées (restaurants) */}
              {tab === 'restaurants' && ville.selections.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.controlRow}
                >
                  {ville.selections.map((s) => {
                    const on = selection === s.key;
                    return (
                      <Pressable
                        key={s.key}
                        onPress={() => setSelection(on ? null : s.key)}
                        style={[styles.selChip, on && styles.selChipOn]}
                      >
                        <Text style={[styles.selChipText, on && styles.selChipTextOn]}>
                          {s.icon} {s.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

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
                {tab === 'hotels' && (
                  <FilterChip
                    label="🕌 ≤ 500 m mosquée"
                    on={nearMosqueOnly}
                    tone="green"
                    onPress={() => setNearMosqueOnly((v) => !v)}
                  />
                )}
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
                {(hasActiveFilters(filters) || hotelFilters.length > 0 || nearMosqueOnly || selection) && (
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      setFilters(EMPTY_FILTERS);
                      setHotelFilters([]);
                      setNearMosqueOnly(false);
                      setSelection(null);
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
              <PratiqueBlock items={ville.pratiqueInfos} text={ville.pratique} ville={ville.nom} pays={ville.pays} />
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
              renderItem={({ item }) => {
                const emoji = tab === 'hotels' ? '🏨' : tab === 'mosquees' ? '🕌' : tab === 'activites' ? '🗺️' : '🍽️';
                const fav = {
                  id: placeFavKey(ville.slug, item.id),
                  type: 'place' as const,
                  title: item.nom,
                  subtitle: [ville.nom, item.category].filter(Boolean).join(' · '),
                  emoji,
                  citySlug: ville.slug,
                  mapsUrl: item.mapsUrl,
                };
                return tab === 'hotels' ? (
                  <HotelCard
                    hotel={item}
                    loc={item.loc}
                    dist={item.dist}
                    fav={fav}
                    onGo={() => goLieu(item)}
                    onAround={
                      item.latitude != null && item.longitude != null
                        ? () => setAroundHotel(item)
                        : undefined
                    }
                  />
                ) : (
                  <LieuCard lieu={item} dist={item.dist} fav={fav} onGo={() => goLieu(item)} />
                );
              }}
            />
          )}

          {aroundHotel && (
            <HotelAroundSheet
              hotel={aroundHotel}
              mosquees={allMosquees}
              restaurants={ville.restaurants}
              onClose={() => setAroundHotel(null)}
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
  fav,
  onGo,
  onAround,
}: {
  hotel: Lieu;
  loc?: HotelLocationStats;
  dist?: number | null;
  fav: Omit<FavoriteItem, 'addedAt'>;
  onGo: () => void;
  onAround?: () => void;
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
          <HeartButton item={fav} size={20} />
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
          {onAround && (
            <Pressable style={styles.aroundBtn} onPress={onAround}>
              <Text style={styles.aroundText}>🗺️ Voir autour</Text>
            </Pressable>
          )}
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

function LieuCard({
  lieu,
  dist,
  fav,
  onGo,
}: {
  lieu: LieuDist;
  dist: number | null;
  fav: Omit<FavoriteItem, 'addedAt'>;
  onGo: () => void;
}) {
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
          <HeartButton item={fav} size={20} />
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

// Pour certaines infos, un tap ouvre une recherche web utile (visa, transport…).
function pratiqueSearchQuery(key: string, ville: string, pays?: string): string | null {
  const lieu = pays || ville;
  switch (key) {
    case 'visa':
      return `visa ${pays || ville} pour français conditions`;
    case 'vaccins':
      return `vaccins voyage ${lieu} recommandations`;
    case 'transport':
      return `transports en commun ${ville} touriste`;
    case 'monnaie':
      return `convertir euro ${lieu} taux`;
    case 'meilleure_periode':
      return `meilleure période pour visiter ${ville} météo`;
    default:
      return null;
  }
}

function PratiqueBlock({
  items,
  text,
  ville,
  pays,
}: {
  items: PratiqueItem[];
  text?: string;
  ville: string;
  pays?: string;
}) {
  if (items.length === 0 && !text) {
    return (
      <View style={styles.emptyTab}>
        <Text style={styles.muted}>Infos pratiques bientôt disponibles.</Text>
      </View>
    );
  }
  const openSearch = (q: string) =>
    Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(q)}`).catch(() => undefined);
  return (
    <View style={styles.pratiqueWrap}>
      {items.map((it) => {
        const query = pratiqueSearchQuery(it.key, ville, pays);
        const row = (
          <>
            <Text style={styles.pratiqueIcon}>{it.icon}</Text>
            <View style={styles.pratiqueRowText}>
              <Text style={styles.pratiqueLabel}>{it.label}</Text>
              <Text style={styles.pratiqueValue}>{it.value}</Text>
            </View>
            {query ? <Text style={styles.pratiqueGo}>Rechercher ↗</Text> : null}
          </>
        );
        return query ? (
          <Pressable key={it.key} style={styles.pratiqueRow} onPress={() => openSearch(query)}>
            {row}
          </Pressable>
        ) : (
          <View key={it.key} style={styles.pratiqueRow}>
            {row}
          </View>
        );
      })}
      {text ? (
        <View style={styles.pratiqueBox}>
          <Text style={styles.pratiqueText}>{text}</Text>
        </View>
      ) : null}
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

  offlineBar: { backgroundColor: '#7a5c12', paddingVertical: 6, paddingHorizontal: Spacing.lg },
  offlineText: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },

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
  sortPillOn: { backgroundColor: Brand.gold, borderColor: Brand.gold },
  sortPillText: { color: Brand.creamMuted, fontSize: 13, fontWeight: '700' },
  sortPillTextOn: { color: Brand.night, fontWeight: '800' },

  selChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(201,168,76,0.14)',
    borderWidth: 1,
    borderColor: Brand.gold,
  },
  selChipOn: { backgroundColor: Brand.gold, borderColor: Brand.gold },
  selChipText: { color: Brand.gold, fontSize: 12, fontWeight: '800' },
  selChipTextOn: { color: Brand.night, fontWeight: '800' },

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
  aroundBtn: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Brand.forest, borderWidth: 1, borderColor: Brand.gold },
  aroundText: { color: Brand.gold, fontSize: 12, fontWeight: '800' },

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

  pratiqueWrap: { gap: Spacing.sm },
  pratiqueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.md,
  },
  pratiqueIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  pratiqueRowText: { flex: 1, gap: 2 },
  pratiqueLabel: { color: Brand.gold, fontSize: 12, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase' },
  pratiqueValue: { color: Brand.cream, fontSize: 15, fontWeight: '600', lineHeight: 21 },
  pratiqueGo: { color: Brand.gold, fontSize: 11, fontWeight: '800', alignSelf: 'center' },
  pratiqueBox: { backgroundColor: Brand.forest, borderRadius: Radius.md, borderWidth: 1, borderColor: Brand.border, padding: Spacing.md, marginTop: Spacing.xs },
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
