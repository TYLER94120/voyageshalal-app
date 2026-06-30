import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Callout, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { distanceKm, formatDistance } from '@/lib/geo';
import { openDirections } from '@/lib/maps';
import { fetchNearbyMosques } from '@/lib/overpass';
import { demoPlacesAround, type DemoCategory, type MapPlace } from '@/lib/demoPlaces';

// ─── Filtres ────────────────────────────────────────────────────────────────

type FilterKey = 'mosquees' | DemoCategory;

interface FilterConfig {
  key: FilterKey;
  emoji: string;
  label: string;
  color: string;
  marker: string;
  real: boolean;
}

const FILTERS: FilterConfig[] = [
  { key: 'mosquees', emoji: '🕌', label: 'Mosquées', color: Brand.forest, marker: '#2d6a4f', real: true },
  { key: 'restaurants', emoji: '🍽️', label: 'Restaurants halal', color: '#9c4221', marker: '#c05621', real: false },
  { key: 'hotels', emoji: '🏨', label: 'Hôtels', color: '#1d4e89', marker: '#2b6cb0', real: false },
  { key: 'commerces', emoji: '🥩', label: 'Boucheries halal', color: '#702459', marker: '#97266d', real: false },
];

const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const DEFAULT_REGION: Region = { ...PARIS, latitudeDelta: 0.06, longitudeDelta: 0.06 };
const SEARCH_RADIUS_M = 5000;

type MosqueState = 'idle' | 'loading' | 'ready' | 'error';

interface PlaceWithDist extends MapPlace {
  dist: number;
}

export default function HomeScreen() {
  const mapRef = useRef<MapView>(null);
  const mapCenter = useRef({ ...PARIS });
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const mosquesKicked = useRef(false);

  const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number } | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('mosquees');
  const [locating, setLocating] = useState(true);
  const [locDenied, setLocDenied] = useState(false);
  const [mosques, setMosques] = useState<MapPlace[]>([]);
  const [mosqueState, setMosqueState] = useState<MosqueState>('idle');
  // Bug Android react-native-maps : un marqueur custom rendu avec
  // tracksViewChanges=false dès le départ apparaît vide. On laisse "true"
  // brièvement le temps du rendu, puis on fige pour les performances.
  const [userTracks, setUserTracks] = useState(true);

  const activeFilterRef = useRef(activeFilter);
  useEffect(() => {
    activeFilterRef.current = activeFilter;
  }, [activeFilter]);

  // ── Mosquées réelles (Overpass) ──
  const loadMosques = useCallback(async (lat: number, lng: number) => {
    setMosqueState('loading');
    try {
      const res = await fetchNearbyMosques(lat, lng, SEARCH_RADIUS_M);
      setMosques(res);
      setMosqueState('ready');
    } catch (err) {
      console.warn('[home] Overpass échec', err);
      setMosqueState('error');
    }
  }, []);

  // Lance le chargement des mosquées dès la 1ʳᵉ position connue (1 seule fois),
  // sans attendre le GPS précis → ressenti bien plus rapide.
  const kickMosques = useCallback(
    (lat: number, lng: number) => {
      if (mosquesKicked.current || activeFilterRef.current !== 'mosquees') return;
      mosquesKicked.current = true;
      loadMosques(lat, lng);
    },
    [loadMosques],
  );

  // ── Géolocalisation ──
  const applyUser = useCallback((coords: { latitude: number; longitude: number }, animate: boolean) => {
    setUserLoc({ latitude: coords.latitude, longitude: coords.longitude });
    mapCenter.current = { latitude: coords.latitude, longitude: coords.longitude };
    if (animate) {
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 700);
    }
  }, []);

  const startWatching = useCallback(async () => {
    if (watchRef.current) return;
    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 20 },
      (loc) => setUserLoc({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
    );
  }, []);

  const locate = useCallback(async (): Promise<{ latitude: number; longitude: number } | null> => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocDenied(true);
        return null;
      }
      setLocDenied(false);
      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        applyUser(last.coords, true);
        kickMosques(last.coords.latitude, last.coords.longitude); // démarrage anticipé
      }
      const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      applyUser(cur.coords, true);
      kickMosques(cur.coords.latitude, cur.coords.longitude);
      startWatching();
      return { latitude: cur.coords.latitude, longitude: cur.coords.longitude };
    } catch {
      return null;
    } finally {
      setLocating(false);
    }
  }, [applyUser, startWatching, kickMosques]);

  // Au lancement : géoloc, puis (au cas où) chargement autour de la position.
  useEffect(() => {
    locate().then((coords) => {
      const c = coords ?? PARIS;
      kickMosques(c.latitude, c.longitude);
    });
    return () => {
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, [locate, kickMosques]);

  // Fige le marqueur "Moi" après son premier rendu (perf + visibilité Android).
  useEffect(() => {
    if (userLoc && userTracks) {
      const t = setTimeout(() => setUserTracks(false), 2000);
      return () => clearTimeout(t);
    }
  }, [userLoc, userTracks]);

  // ── Lieux affichés selon le filtre ──
  const activeCfg = FILTERS.find((f) => f.key === activeFilter)!;
  const places: MapPlace[] = useMemo(() => {
    if (activeFilter === 'mosquees') return mosques;
    const origin = userLoc ?? mapCenter.current;
    return demoPlacesAround(activeFilter, origin.latitude, origin.longitude);
  }, [activeFilter, mosques, userLoc]);

  // Liste triée par distance (pour les cartes du bas).
  const nearbyList: PlaceWithDist[] = useMemo(() => {
    const origin = userLoc ?? mapCenter.current;
    return places
      .map((p) => ({ ...p, dist: distanceKm(origin.latitude, origin.longitude, p.latitude, p.longitude) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 15);
  }, [places, userLoc]);

  const handleFilterPress = (key: FilterKey) => {
    setActiveFilter(key);
    if (key === 'mosquees' && (mosqueState === 'idle' || mosqueState === 'error')) {
      loadMosques(mapCenter.current.latitude, mapCenter.current.longitude);
    }
  };

  const focusPlace = (p: MapPlace) => {
    mapRef.current?.animateToRegion(
      { latitude: p.latitude, longitude: p.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 },
      600,
    );
  };

  const distanceLabel = (p: MapPlace): string | null =>
    userLoc ? formatDistance(distanceKm(userLoc.latitude, userLoc.longitude, p.latitude, p.longitude)) : null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        onRegionChangeComplete={(r) => {
          mapCenter.current = { latitude: r.latitude, longitude: r.longitude };
        }}
      >
        {/* Marqueur « Moi » bien visible */}
        {userLoc && (
          <Marker coordinate={userLoc} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={userTracks}>
            <View style={styles.userMarker}>
              <View style={styles.userPin}>
                <Text style={styles.userEmoji}>🧍</Text>
              </View>
              <Text style={styles.userLabel}>Moi</Text>
            </View>
          </Marker>
        )}

        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            pinColor={activeCfg.marker}
          >
            <View style={[styles.markerBubble, { backgroundColor: activeCfg.marker }]}>
              <Text style={styles.markerEmoji}>{activeCfg.emoji}</Text>
            </View>
            <Callout tooltip onPress={() => openDirections(place.latitude, place.longitude)}>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{place.name}</Text>
                {distanceLabel(place) && <Text style={styles.calloutDist}>📍 {distanceLabel(place)}</Text>}
                {place.demo && <Text style={styles.calloutDemo}>exemple (démo)</Text>}
                <View style={styles.calloutCta}>
                  <Text style={styles.calloutCtaText}>🧭 Y aller (itinéraire)</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerPill}>
          <Text style={styles.headerEmoji}>🌙</Text>
          <Text style={styles.headerTitle}>VoyagesHalal</Text>
        </View>
      </View>

      {/* Localisation refusée */}
      {locDenied && (
        <View style={styles.denyBanner}>
          <Text style={styles.denyText}>📍 Active ta localisation pour voir les lieux autour de toi.</Text>
          <View style={styles.denyRow}>
            <Pressable style={styles.denyBtn} onPress={locate}>
              <Text style={styles.denyBtnText}>Réessayer</Text>
            </Pressable>
            <Pressable style={styles.denyBtnGhost} onPress={() => Linking.openSettings()}>
              <Text style={styles.denyBtnGhostText}>Réglages</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Bandeau d'état */}
      {!locDenied && (
        <View style={[styles.statusBadge, { backgroundColor: activeCfg.color }]}>
          {activeFilter === 'mosquees' && mosqueState === 'loading' ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.statusText}>Recherche des mosquées…</Text>
            </View>
          ) : activeFilter === 'mosquees' && mosqueState === 'error' ? (
            <Pressable onPress={() => loadMosques(mapCenter.current.latitude, mapCenter.current.longitude)}>
              <Text style={styles.statusText}>Erreur réseau — appuyez pour réessayer</Text>
            </Pressable>
          ) : activeFilter === 'mosquees' && places.length === 0 && mosqueState === 'ready' ? (
            <Text style={styles.statusText}>Aucune mosquée ici — déplacez la carte</Text>
          ) : (
            <Text style={styles.statusText}>
              {places.length} {activeCfg.label}
              {activeFilter === 'mosquees' ? ' à proximité' : ' (démo)'}
            </Text>
          )}
        </View>
      )}

      {/* « Rechercher dans cette zone » (mosquées) */}
      {activeFilter === 'mosquees' && mosqueState !== 'loading' && !locDenied && (
        <Pressable
          style={styles.searchHere}
          onPress={() => loadMosques(mapCenter.current.latitude, mapCenter.current.longitude)}
        >
          <Text style={styles.searchHereText}>🔄 Rechercher dans cette zone</Text>
        </Pressable>
      )}

      {/* Recentrer sur moi */}
      <Pressable style={styles.recenter} onPress={locate}>
        {locating ? <ActivityIndicator size="small" color={Brand.forest} /> : <Text style={styles.recenterIcon}>📍</Text>}
      </Pressable>

      {/* Liste des lieux proches (cartes cliquables → Y aller) */}
      {nearbyList.length > 0 && (
        <View style={styles.cardsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
            {nearbyList.map((p, i) => (
              <Pressable key={p.id} style={styles.placeCard} onPress={() => focusPlace(p)}>
                <View style={styles.placeCardTop}>
                  <Text style={styles.placeEmoji}>{activeCfg.emoji}</Text>
                  {i === 0 && <Text style={styles.nearestTag}>la + proche</Text>}
                </View>
                <Text style={styles.placeName} numberOfLines={2}>
                  {p.name}
                </Text>
                <View style={styles.placeCardBottom}>
                  <Text style={styles.placeDist}>{formatDistance(p.dist)}</Text>
                  <Pressable
                    style={styles.goBtn}
                    onPress={() => openDirections(p.latitude, p.longitude)}
                    hitSlop={8}
                  >
                    <Text style={styles.goBtnText}>Y aller ›</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Filtres */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                onPress={() => handleFilterPress(filter.key)}
                style={[styles.filterPill, isActive ? { backgroundColor: filter.color } : styles.filterPillInactive]}
              >
                <Text style={styles.filterEmoji}>{filter.emoji}</Text>
                <Text style={[styles.filterLabel, isActive ? styles.filterLabelActive : styles.filterLabelInactive]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.night },

  header: { position: 'absolute', top: 14, left: 16, right: 16, flexDirection: 'row' },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerEmoji: { fontSize: 18 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Brand.forest, letterSpacing: 0.3 },

  denyBanner: {
    position: 'absolute',
    top: 66,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  denyText: { color: '#333', fontSize: 13, fontWeight: '600' },
  denyRow: { flexDirection: 'row', gap: Spacing.sm },
  denyBtn: { backgroundColor: Brand.forest, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  denyBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  denyBtnGhost: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Brand.forest,
  },
  denyBtnGhostText: { color: Brand.forest, fontWeight: '700', fontSize: 13 },

  statusBadge: {
    position: 'absolute',
    top: 66,
    alignSelf: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.2 },

  searchHere: {
    position: 'absolute',
    top: 108,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  searchHereText: { color: Brand.forest, fontWeight: '700', fontSize: 12 },

  recenter: {
    position: 'absolute',
    right: 16,
    bottom: Platform.OS === 'ios' ? 250 : 220,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  recenterIcon: { fontSize: 22 },

  // Cartes des lieux proches
  cardsWrapper: { position: 'absolute', left: 0, right: 0, bottom: Platform.OS === 'ios' ? 124 : 98 },
  cardsScroll: { paddingHorizontal: 16, gap: 10 },
  placeCard: {
    width: 190,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: Radius.md,
    padding: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 7,
  },
  placeCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  placeEmoji: { fontSize: 18 },
  nearestTag: {
    backgroundColor: Brand.gold,
    color: Brand.night,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  placeName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', minHeight: 36 },
  placeCardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  placeDist: { fontSize: 13, fontWeight: '700', color: '#666' },
  goBtn: { backgroundColor: Brand.forest, borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  goBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  filtersWrapper: { position: 'absolute', bottom: Platform.OS === 'ios' ? 70 : 44, left: 0, right: 0 },
  filtersScroll: { paddingHorizontal: 16, gap: 10 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  filterPillInactive: { backgroundColor: 'rgba(255,255,255,0.95)' },
  filterEmoji: { fontSize: 18 },
  filterLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  filterLabelActive: { color: '#fff' },
  filterLabelInactive: { color: '#333' },

  // Marqueur utilisateur
  userMarker: { alignItems: 'center' },
  userPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  userEmoji: { fontSize: 18 },
  userLabel: {
    marginTop: 2,
    backgroundColor: '#2563eb',
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },

  markerBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  markerEmoji: { fontSize: 20 },

  callout: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    width: 220,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  calloutName: { fontWeight: '700', fontSize: 14, color: '#111' },
  calloutDist: { fontSize: 12, color: '#666' },
  calloutDemo: { fontSize: 11, color: '#999', fontStyle: 'italic' },
  calloutCta: { marginTop: 6, backgroundColor: Brand.forest, borderRadius: Radius.sm, paddingVertical: 8, alignItems: 'center' },
  calloutCtaText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
