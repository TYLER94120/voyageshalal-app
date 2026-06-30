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
const SEARCH_RADIUS_M = 6000;

type MosqueState = 'idle' | 'loading' | 'ready' | 'error';

export default function HomeScreen() {
  const mapRef = useRef<MapView>(null);
  const mapCenter = useRef({ ...PARIS });

  const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number } | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('mosquees');
  const [locating, setLocating] = useState(true);
  const [locDenied, setLocDenied] = useState(false);
  const [mosques, setMosques] = useState<MapPlace[]>([]);
  const [mosqueState, setMosqueState] = useState<MosqueState>('idle');

  // ── Mosquées réelles (Overpass) ──
  const loadMosques = useCallback(async (lat: number, lng: number) => {
    setMosqueState('loading');
    try {
      const res = await fetchNearbyMosques(lat, lng, SEARCH_RADIUS_M);
      const sorted = [...res].sort(
        (a, b) =>
          distanceKm(lat, lng, a.latitude, a.longitude) -
          distanceKm(lat, lng, b.latitude, b.longitude),
      );
      setMosques(sorted);
      setMosqueState('ready');
    } catch (err) {
      console.warn('[home] Overpass échec', err);
      setMosqueState('error');
    }
  }, []);

  // ── Géolocalisation ──
  const applyUser = useCallback((coords: { latitude: number; longitude: number }, animate: boolean) => {
    setUserLoc(coords);
    mapCenter.current = { latitude: coords.latitude, longitude: coords.longitude };
    if (animate) {
      mapRef.current?.animateToRegion(
        { ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 },
        700,
      );
    }
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
      if (last) applyUser(last.coords, true);
      const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      applyUser(cur.coords, true);
      return { latitude: cur.coords.latitude, longitude: cur.coords.longitude };
    } catch {
      return null;
    } finally {
      setLocating(false);
    }
  }, [applyUser]);

  // Au lancement : géoloc, puis chargement des mosquées autour de l'utilisateur.
  useEffect(() => {
    locate().then((coords) => {
      const c = coords ?? PARIS;
      loadMosques(c.latitude, c.longitude);
    });
  }, [locate, loadMosques]);

  // ── Lieux affichés selon le filtre ──
  const activeCfg = FILTERS.find((f) => f.key === activeFilter)!;
  const places: MapPlace[] = useMemo(() => {
    if (activeFilter === 'mosquees') return mosques;
    const origin = userLoc ?? mapCenter.current;
    return demoPlacesAround(activeFilter, origin.latitude, origin.longitude);
  }, [activeFilter, mosques, userLoc]);

  // Mosquée la plus proche (pour le bouton « Itinéraire » direct).
  const nearest = useMemo(() => {
    if (activeFilter !== 'mosquees' || !userLoc || mosques.length === 0) return null;
    let best: MapPlace | null = null;
    let bd = Infinity;
    for (const m of mosques) {
      const d = distanceKm(userLoc.latitude, userLoc.longitude, m.latitude, m.longitude);
      if (d < bd) {
        bd = d;
        best = m;
      }
    }
    return best ? { place: best, dist: bd } : null;
  }, [activeFilter, userLoc, mosques]);

  const handleFilterPress = (key: FilterKey) => {
    setActiveFilter(key);
    if (key === 'mosquees' && (mosqueState === 'idle' || mosqueState === 'error')) {
      loadMosques(mapCenter.current.latitude, mapCenter.current.longitude);
    }
  };

  const distanceLabel = (p: MapPlace): string | null => {
    if (!userLoc) return null;
    return formatDistance(distanceKm(userLoc.latitude, userLoc.longitude, p.latitude, p.longitude));
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={(r) => {
          mapCenter.current = { latitude: r.latitude, longitude: r.longitude };
        }}
      >
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
                {distanceLabel(place) && (
                  <Text style={styles.calloutDist}>📍 {distanceLabel(place)}</Text>
                )}
                {place.demo && <Text style={styles.calloutDemo}>exemple (démo)</Text>}
                <View style={styles.calloutCta}>
                  <Text style={styles.calloutCtaText}>🧭 Itinéraire sur Maps</Text>
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

      {/* Bandeau d'état (compteur / chargement / erreur) */}
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
            <Text style={styles.statusText}>Aucune mosquée trouvée ici — déplacez la carte</Text>
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
        {locating ? (
          <ActivityIndicator size="small" color={Brand.forest} />
        ) : (
          <Text style={styles.recenterIcon}>📍</Text>
        )}
      </Pressable>

      {/* Itinéraire vers la mosquée la plus proche */}
      {nearest && (
        <Pressable
          style={styles.nearestBtn}
          onPress={() => openDirections(nearest.place.latitude, nearest.place.longitude)}
        >
          <Text style={styles.nearestText} numberOfLines={1}>
            🕌 La plus proche · {formatDistance(nearest.dist)}
          </Text>
          <Text style={styles.nearestGo}>Itinéraire ›</Text>
        </Pressable>
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
                style={[
                  styles.filterPill,
                  isActive ? { backgroundColor: filter.color } : styles.filterPillInactive,
                ]}
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
  denyBtn: {
    backgroundColor: Brand.forest,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
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
    bottom: Platform.OS === 'ios' ? 180 : 150,
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

  nearestBtn: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 130 : 100,
    backgroundColor: Brand.gold,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nearestText: { color: Brand.night, fontWeight: '800', fontSize: 15, flex: 1 },
  nearestGo: { color: Brand.night, fontWeight: '800', fontSize: 15 },

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
  calloutCta: {
    marginTop: 6,
    backgroundColor: Brand.forest,
    borderRadius: Radius.sm,
    paddingVertical: 7,
    alignItems: 'center',
  },
  calloutCtaText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
