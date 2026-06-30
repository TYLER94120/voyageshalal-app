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
import { openDirections, openDirectionsQuery } from '@/lib/maps';
import { fetchNearbyMosques } from '@/lib/overpass';
import { demoPlacesAround, type DemoCategory, type MapPlace } from '@/lib/demoPlaces';
import { CitySearchModal } from '@/components/CitySearchModal';
import { getVille, type VilleDetail, type VilleSummary } from '@/lib/api';

// ─── Filtres ────────────────────────────────────────────────────────────────

type FilterKey = 'mosquees' | DemoCategory;

interface FilterConfig {
  key: FilterKey;
  emoji: string;
  label: string;
  color: string;
  marker: string;
}

const FILTERS: FilterConfig[] = [
  { key: 'mosquees', emoji: '🕌', label: 'Mosquées', color: Brand.forest, marker: '#2d6a4f' },
  { key: 'restaurants', emoji: '🍽️', label: 'Restaurants halal', color: '#9c4221', marker: '#c05621' },
  { key: 'hotels', emoji: '🏨', label: 'Hôtels', color: '#1d4e89', marker: '#2b6cb0' },
  { key: 'commerces', emoji: '🥩', label: 'Boucheries halal', color: '#702459', marker: '#97266d' },
];

const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const DEFAULT_REGION: Region = { ...PARIS, latitudeDelta: 0.06, longitudeDelta: 0.06 };
const SEARCH_RADIUS_M = 5000;

type MosqueState = 'idle' | 'loading' | 'ready' | 'error';
type CityDetailState = 'idle' | 'loading' | 'ready' | 'error';

interface PinItem {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  demo?: boolean;
}
interface PinWithDist extends PinItem {
  dist: number | null;
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
  const [userTracks, setUserTracks] = useState(true);
  const [selectedCity, setSelectedCity] = useState<{ nom: string; latitude: number; longitude: number } | null>(null);
  const [cityModal, setCityModal] = useState(false);
  const [cityDetail, setCityDetail] = useState<VilleDetail | null>(null);
  const [cityDetailState, setCityDetailState] = useState<CityDetailState>('idle');

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
        kickMosques(last.coords.latitude, last.coords.longitude);
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

  useEffect(() => {
    if (userLoc && userTracks) {
      const t = setTimeout(() => setUserTracks(false), 2000);
      return () => clearTimeout(t);
    }
  }, [userLoc, userTracks]);

  // ── Mode ville ──
  const selectCity = useCallback(
    async (ville: VilleSummary) => {
      let coords: { latitude: number; longitude: number } | null =
        typeof ville.latitude === 'number' && typeof ville.longitude === 'number'
          ? { latitude: ville.latitude, longitude: ville.longitude }
          : null;
      if (!coords) {
        try {
          const g = await Location.geocodeAsync([ville.nom, ville.pays].filter(Boolean).join(', '));
          if (g[0]) coords = { latitude: g[0].latitude, longitude: g[0].longitude };
        } catch {
          // géocodage indisponible
        }
      }
      if (!coords) return;

      setSelectedCity({ nom: ville.nom, ...coords });
      mapCenter.current = coords;
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.08, longitudeDelta: 0.08 }, 800);
      if (activeFilterRef.current === 'mosquees') loadMosques(coords.latitude, coords.longitude);

      // Détail de la ville (restaurants / hôtels réels)
      setCityDetail(null);
      setCityDetailState('loading');
      try {
        const detail = await getVille(ville.slug);
        setCityDetail(detail);
        setCityDetailState('ready');
      } catch {
        setCityDetailState('error');
      }
    },
    [loadMosques],
  );

  const goToMe = useCallback(() => {
    setSelectedCity(null);
    setCityDetail(null);
    setCityDetailState('idle');
    if (userLoc) {
      mapCenter.current = userLoc;
      mapRef.current?.animateToRegion({ ...userLoc, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 700);
      if (activeFilterRef.current === 'mosquees') loadMosques(userLoc.latitude, userLoc.longitude);
    } else {
      locate();
    }
  }, [userLoc, loadMosques, locate]);

  // ── Lieux affichés ──
  const activeCfg = FILTERS.find((f) => f.key === activeFilter)!;

  const places: PinItem[] = useMemo(() => {
    if (activeFilter === 'mosquees') {
      return mosques.map((m) => ({ id: m.id, name: m.name, latitude: m.latitude, longitude: m.longitude }));
    }
    // Restaurants / hôtels : vraies données de la ville si disponibles.
    if (selectedCity && cityDetail && (activeFilter === 'restaurants' || activeFilter === 'hotels')) {
      const arr = activeFilter === 'restaurants' ? cityDetail.restaurants : cityDetail.hotels;
      if (arr && arr.length > 0) {
        return arr.map((l) => ({
          id: l.id,
          name: l.nom,
          latitude: l.latitude,
          longitude: l.longitude,
          address: l.adresse,
        }));
      }
    }
    // Sinon : démo, autour de la ville choisie ou de l'utilisateur.
    const origin = selectedCity ?? userLoc ?? mapCenter.current;
    return demoPlacesAround(activeFilter as DemoCategory, origin.latitude, origin.longitude).map((p) => ({
      id: p.id,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      demo: true,
    }));
  }, [activeFilter, mosques, selectedCity, cityDetail, userLoc]);

  const markers = useMemo(
    () =>
      places.filter(
        (p): p is PinItem & { latitude: number; longitude: number } =>
          typeof p.latitude === 'number' && typeof p.longitude === 'number',
      ),
    [places],
  );

  const nearbyList: PinWithDist[] = useMemo(() => {
    const origin = selectedCity ?? userLoc ?? mapCenter.current;
    return places
      .map((p) => ({
        ...p,
        dist:
          typeof p.latitude === 'number' && typeof p.longitude === 'number'
            ? distanceKm(origin.latitude, origin.longitude, p.latitude, p.longitude)
            : null,
      }))
      .sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity))
      .slice(0, 20);
  }, [places, userLoc, selectedCity]);

  const handleFilterPress = (key: FilterKey) => {
    setActiveFilter(key);
    if (key === 'mosquees' && (mosqueState === 'idle' || mosqueState === 'error')) {
      loadMosques(mapCenter.current.latitude, mapCenter.current.longitude);
    }
  };

  const goPlace = (p: PinItem) => {
    if (typeof p.latitude === 'number' && typeof p.longitude === 'number') {
      openDirections(p.latitude, p.longitude);
    } else {
      openDirectionsQuery([p.name, selectedCity?.nom].filter(Boolean).join(', '));
    }
  };

  const focusPlace = (p: PinItem) => {
    if (typeof p.latitude === 'number' && typeof p.longitude === 'number') {
      mapRef.current?.animateToRegion(
        { latitude: p.latitude, longitude: p.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 },
        600,
      );
    } else {
      goPlace(p);
    }
  };

  const cityLoadingLieux =
    !!selectedCity && cityDetailState === 'loading' && (activeFilter === 'restaurants' || activeFilter === 'hotels');

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

        {markers.map((place) => (
          <Marker key={place.id} coordinate={{ latitude: place.latitude, longitude: place.longitude }} pinColor={activeCfg.marker}>
            <View style={[styles.markerBubble, { backgroundColor: activeCfg.marker }]}>
              <Text style={styles.markerEmoji}>{activeCfg.emoji}</Text>
            </View>
            <Callout tooltip onPress={() => goPlace(place)}>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{place.name}</Text>
                {place.address && <Text style={styles.calloutDist}>{place.address}</Text>}
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

        {selectedCity ? (
          <View style={styles.cityActive}>
            <Pressable onPress={() => setCityModal(true)} style={styles.cityActiveMain}>
              <Text style={styles.cityActiveText} numberOfLines={1}>📍 {selectedCity.nom}</Text>
            </Pressable>
            <Pressable onPress={goToMe} hitSlop={8}>
              <Text style={styles.cityClear}>✕</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.cityBtn} onPress={() => setCityModal(true)}>
            <Text style={styles.cityBtnText}>🌍 Ville</Text>
          </Pressable>
        )}
      </View>

      {/* Localisation refusée */}
      {locDenied && !selectedCity && (
        <View style={styles.denyBanner}>
          <Text style={styles.denyText}>📍 Active ta localisation, ou choisis une ville en haut à droite.</Text>
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
      {!(locDenied && !selectedCity) && (
        <View style={[styles.statusBadge, { backgroundColor: activeCfg.color }]}>
          {activeFilter === 'mosquees' && mosqueState === 'loading' ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.statusText}>Recherche des mosquées…</Text>
            </View>
          ) : cityLoadingLieux ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.statusText}>Chargement des lieux…</Text>
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
              {selectedCity ? ` · ${selectedCity.nom}` : activeFilter === 'mosquees' ? ' à proximité' : ' (démo)'}
            </Text>
          )}
        </View>
      )}

      {/* « Rechercher dans cette zone » (mosquées) */}
      {activeFilter === 'mosquees' && mosqueState !== 'loading' && !(locDenied && !selectedCity) && (
        <Pressable
          style={styles.searchHere}
          onPress={() => loadMosques(mapCenter.current.latitude, mapCenter.current.longitude)}
        >
          <Text style={styles.searchHereText}>🔄 Rechercher dans cette zone</Text>
        </Pressable>
      )}

      {/* Recentrer sur moi (et quitter le mode ville) */}
      <Pressable style={styles.recenter} onPress={goToMe}>
        {locating ? <ActivityIndicator size="small" color={Brand.forest} /> : <Text style={styles.recenterIcon}>📍</Text>}
      </Pressable>

      {/* Liste des lieux proches */}
      {nearbyList.length > 0 && (
        <View style={styles.cardsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
            {nearbyList.map((p, i) => (
              <Pressable key={p.id} style={styles.placeCard} onPress={() => focusPlace(p)}>
                <View style={styles.placeCardTop}>
                  <Text style={styles.placeEmoji}>{activeCfg.emoji}</Text>
                  {i === 0 && p.dist != null && <Text style={styles.nearestTag}>la + proche</Text>}
                  {p.demo && <Text style={styles.demoTag}>démo</Text>}
                </View>
                <Text style={styles.placeName} numberOfLines={2}>
                  {p.name}
                </Text>
                <View style={styles.placeCardBottom}>
                  <Text style={styles.placeDist}>{p.dist != null ? formatDistance(p.dist) : 'voir'}</Text>
                  <Pressable style={styles.goBtn} onPress={() => goPlace(p)} hitSlop={8}>
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

      <CitySearchModal visible={cityModal} onClose={() => setCityModal(false)} onSelect={selectCity} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.night },

  header: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cityBtn: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cityBtnText: { color: Brand.forest, fontWeight: '800', fontSize: 14 },
  cityActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '55%',
    backgroundColor: Brand.gold,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cityActiveMain: { flexShrink: 1 },
  cityActiveText: { color: Brand.night, fontWeight: '800', fontSize: 14 },
  cityClear: { color: Brand.night, fontWeight: '800', fontSize: 16 },

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
  placeCardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  placeEmoji: { fontSize: 18, flex: 1 },
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
  demoTag: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
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
