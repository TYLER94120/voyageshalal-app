import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Callout, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryKey = 'mosquees' | 'pizzas' | 'japonais' | 'hotels';

interface Place {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_DATA: Record<CategoryKey, Place[]> = {
  mosquees: [
    { id: 'm1', name: 'Grande Mosquée de Paris', address: '2bis pl. du Puits-de-l\'Ermite, 75005', latitude: 48.8427, longitude: 2.3536, rating: 4.8 },
    { id: 'm2', name: 'Mosquée Al-Fath', address: '53 Bd Ney, 75018', latitude: 48.8984, longitude: 2.3487, rating: 4.6 },
    { id: 'm3', name: 'Mosquée Omar', address: '53 Rue Jean-Pierre Timbaud, 75011', latitude: 48.8647, longitude: 2.3732, rating: 4.5 },
    { id: 'm4', name: 'Mosquée de Clichy', address: 'Clichy-la-Garenne', latitude: 48.9048, longitude: 2.3042, rating: 4.3 },
  ],
  pizzas: [
    { id: 'p1', name: 'Pizza Halal Bella', address: '12 Rue de la Roquette, 75011', latitude: 48.8528, longitude: 2.3769, rating: 4.4 },
    { id: 'p2', name: 'Al Capone Halal', address: '38 Rue du Faubourg Saint-Denis, 75010', latitude: 48.8719, longitude: 2.3553, rating: 4.2 },
    { id: 'p3', name: 'Pizza King Halal', address: '7 Rue Myrha, 75018', latitude: 48.8889, longitude: 2.3522, rating: 4.0 },
    { id: 'p4', name: 'La Piazza Halal', address: '22 Av. de Clichy, 75017', latitude: 48.8863, longitude: 2.3222, rating: 4.5 },
  ],
  japonais: [
    { id: 'j1', name: 'Sushi Halal Osaka', address: '9 Rue de la Paix, 75002', latitude: 48.8699, longitude: 2.3302, rating: 4.7 },
    { id: 'j2', name: 'Ramen Halal Tokyo', address: '44 Rue Saint-Anne, 75001', latitude: 48.8645, longitude: 2.3368, rating: 4.5 },
    { id: 'j3', name: 'Wagyu Halal Bistro', address: '18 Rue Montorgueil, 75002', latitude: 48.8635, longitude: 2.3466, rating: 4.6 },
    { id: 'j4', name: 'Izakaya Halal', address: '66 Rue de Bretagne, 75003', latitude: 48.8627, longitude: 2.3598, rating: 4.3 },
  ],
  hotels: [
    { id: 'h1', name: 'Hôtel Halal Lumière', address: '4 Av. des Gobelins, 75005', latitude: 48.8358, longitude: 2.3519, rating: 4.6 },
    { id: 'h2', name: 'Résidence Al Baraka', address: 'Rue de la Harpe, 75005', latitude: 48.8513, longitude: 2.3447, rating: 4.4 },
    { id: 'h3', name: 'Hôtel Salam Paris', address: '87 Blvd de Clichy, 75018', latitude: 48.8843, longitude: 2.3321, rating: 4.2 },
    { id: 'h4', name: 'Apart\'Halal Nation', address: '1 Pl. de la Nation, 75011', latitude: 48.8487, longitude: 2.3955, rating: 4.5 },
  ],
};

// ─── Filter config ─────────────────────────────────────────────────────────────

interface FilterConfig {
  key: CategoryKey;
  emoji: string;
  label: string;
  color: string;
  markerColor: string;
}

const FILTERS: FilterConfig[] = [
  { key: 'mosquees', emoji: '🕌', label: 'Mosquées',    color: '#1B5E20', markerColor: '#2E7D32' },
  { key: 'pizzas',   emoji: '🍕', label: 'Pizzas',      color: '#BF360C', markerColor: '#D84315' },
  { key: 'japonais', emoji: '🍣', label: 'Japonais',    color: '#4A148C', markerColor: '#6A1B9A' },
  { key: 'hotels',   emoji: '🏨', label: 'Hôtels Halal',color: '#0D47A1', markerColor: '#1565C0' },
];

const DEFAULT_REGION: Region = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [activeFilter, setActiveFilter] = useState<CategoryKey>('mosquees');
  const [locationError, setLocationError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Animated scale per filter button
  const scales = useRef(
    Object.fromEntries(FILTERS.map((f) => [f.key, new Animated.Value(1)])) as Record<CategoryKey, Animated.Value>
  ).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(true);
        setLoading(false);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const userRegion: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(userRegion);
        mapRef.current?.animateToRegion(userRegion, 800);
      } catch {
        setLocationError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFilterPress = (key: CategoryKey) => {
    // Bounce animation
    Animated.sequence([
      Animated.spring(scales[key], { toValue: 0.88, useNativeDriver: true, speed: 40 }),
      Animated.spring(scales[key], { toValue: 1,    useNativeDriver: true, speed: 20 }),
    ]).start();

    setActiveFilter(key);

    // Fit map to markers of new category
    const places = MOCK_DATA[key];
    if (places.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(
        places.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
        { edgePadding: { top: 120, right: 60, bottom: 180, left: 60 }, animated: true }
      );
    }
  };

  const activeCfg = FILTERS.find((f) => f.key === activeFilter)!;
  const places = MOCK_DATA[activeFilter];

  return (
    <View style={styles.container}>
      {/* ── Map ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        mapType={Platform.OS === 'android' ? 'standard' : 'standard'}
      >
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            pinColor={activeCfg.markerColor}
          >
            <View style={[styles.markerBubble, { backgroundColor: activeCfg.markerColor }]}>
              <Text style={styles.markerEmoji}>{activeCfg.emoji}</Text>
            </View>
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{place.name}</Text>
                <Text style={styles.calloutAddress}>{place.address}</Text>
                <View style={styles.calloutRating}>
                  <Text style={styles.calloutStar}>★</Text>
                  <Text style={styles.calloutRatingText}>{place.rating.toFixed(1)}</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* ── Top header ── */}
      <View style={styles.header}>
        <View style={styles.headerPill}>
          <Text style={styles.headerEmoji}>🌙</Text>
          <Text style={styles.headerTitle}>VoyagesHalal</Text>
        </View>
        {locationError && (
          <View style={styles.locationBadge}>
            <Text style={styles.locationBadgeText}>📍 Paris (par défaut)</Text>
          </View>
        )}
      </View>

      {/* ── Loading overlay ── */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1B5E20" />
          <Text style={styles.loadingText}>Localisation en cours…</Text>
        </View>
      )}

      {/* ── Counter badge ── */}
      <View style={[styles.countBadge, { backgroundColor: activeCfg.color }]}>
        <Text style={styles.countText}>
          {places.length} {activeCfg.label} à proximité
        </Text>
      </View>

      {/* ── Filter pills ── */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <Animated.View key={filter.key} style={{ transform: [{ scale: scales[filter.key] }] }}>
                <Pressable
                  onPress={() => handleFilterPress(filter.key)}
                  style={[
                    styles.filterPill,
                    isActive
                      ? { backgroundColor: filter.color, shadowColor: filter.color }
                      : styles.filterPillInactive,
                  ]}
                >
                  <Text style={styles.filterEmoji}>{filter.emoji}</Text>
                  <Text style={[styles.filterLabel, isActive ? styles.filterLabelActive : styles.filterLabelInactive]}>
                    {filter.label}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Header
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
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
  headerEmoji: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B5E20',
    letterSpacing: 0.3,
  },
  locationBadge: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  locationBadgeText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#1B5E20',
    fontWeight: '600',
    fontSize: 15,
  },

  // Count badge
  countBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    alignSelf: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  countText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // Filters
  filtersWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 80,
    left: 0,
    right: 0,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 30,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  filterPillInactive: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
  },
  filterEmoji: {
    fontSize: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  filterLabelActive: {
    color: '#fff',
  },
  filterLabelInactive: {
    color: '#333',
  },

  // Markers
  markerBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  markerEmoji: {
    fontSize: 22,
  },

  // Callout
  callout: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    gap: 4,
  },
  calloutName: {
    fontWeight: '700',
    fontSize: 14,
    color: '#111',
  },
  calloutAddress: {
    fontSize: 12,
    color: '#777',
    lineHeight: 16,
  },
  calloutRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  calloutStar: {
    color: '#F9A825',
    fontSize: 14,
  },
  calloutRatingText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#333',
  },
});
