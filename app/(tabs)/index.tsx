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
import { useFocusEffect } from 'expo-router';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { distanceKm, formatDistance } from '@/lib/geo';
import { openDirections, openDirectionsQuery, openMapsUrl } from '@/lib/maps';
import { fetchNearbyMosques } from '@/lib/overpass';
import { demoPlacesAround, type DemoCategory, type MapPlace } from '@/lib/demoPlaces';
import { CitySearchModal } from '@/components/CitySearchModal';
import { halalBadge, type VilleDetail, type VilleSummary } from '@/lib/api';
import { getVilleCached } from '@/lib/cityCache';
import { priceRank, recommendedScore } from '@/lib/lieuSort';
import { CuisineSheet } from '@/components/CuisineSheet';
import { dedupeHotels, hotelLocationStats } from '@/lib/hotelLocation';
import { HotelAroundSheet } from '@/components/HotelAroundSheet';
import { mergeMosquees, osmToLieu } from '@/lib/mosques';
import { consumePendingCity } from '@/lib/pendingCity';

// Tri rapide de la liste (restaurants / hôtels) sur la page d'accueil.
type QuickSort = 'reco' | 'proche' | 'situe' | 'note' | 'prix';

// Restaurants : « Recommandé » d'abord (note + proximité + rapport qualité-prix).
// Hôtels : « bien situés » (mosquée + restos) d'abord.
function quickSortsFor(filter: FilterKey): { key: QuickSort; label: string }[] {
  if (filter === 'hotels') {
    return [
      { key: 'situe', label: '🕌 Bien situés' },
      { key: 'prix', label: '💶 Prix' },
      { key: 'note', label: '⭐ Noté' },
    ];
  }
  return [
    { key: 'reco', label: '✨ Recommandé' },
    { key: 'proche', label: '📍 Proche' },
    { key: 'note', label: '⭐ Noté' },
    { key: 'prix', label: '💶 Prix' },
  ];
}

function defaultQuickSort(filter: FilterKey): QuickSort {
  return filter === 'hotels' ? 'situe' : 'reco';
}

function quickSortLabel(filter: FilterKey, key: QuickSort): string {
  return quickSortsFor(filter).find((s) => s.key === key)?.label ?? '';
}

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
// Rayon de recherche des mosquées : restreint « autour de moi », large en mode
// ville (mégapoles étalées comme Tokyo → couvrir toute l'agglomération).
const ME_RADIUS_M = 6000;
const CITY_RADIUS_M = 25000;

// Dimensions des cartes du bas (pour le défilement lié à la carte).
const CARD_W = 190;
const CARD_GAP = 10;

type MosqueState = 'idle' | 'loading' | 'ready' | 'error';
type CityDetailState = 'idle' | 'loading' | 'ready' | 'error';

interface PinItem {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  note?: number;
  price?: string;
  category?: string;
  mapsUrl?: string;
  halalConfidence?: string;
  demo?: boolean;
  // Hôtels : emplacement stratégique (proximité mosquée + restos halal).
  locScore?: number | null;
  nearestMosqueKm?: number | null;
  restosNear?: number;
}
interface PinWithDist extends PinItem {
  dist: number | null;
}

export default function HomeScreen() {
  const mapRef = useRef<MapView>(null);
  const mapCenter = useRef({ ...PARIS });
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const mosquesKicked = useRef(false);
  const cardsRef = useRef<ScrollView>(null);

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
  // Lieu sélectionné (lien carte ↔ liste du bas).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Sélection fine côté restaurants : cuisine + tri (ex. « le japonais le plus proche »).
  const [quickCat, setQuickCat] = useState<string | null>(null);
  const [quickSort, setQuickSort] = useState<QuickSort>('reco');
  // Ouverture de la petite feuille cuisine + tri (accueil épuré : 1 bouton).
  const [quickSheet, setQuickSheet] = useState(false);
  // Hôtel dont on regarde « autour » (mini-carte mosquées + restos).
  const [aroundHotelId, setAroundHotelId] = useState<string | null>(null);

  const activeFilterRef = useRef(activeFilter);
  useEffect(() => {
    activeFilterRef.current = activeFilter;
  }, [activeFilter]);

  // ── Mosquées réelles (Overpass) ──
  const loadMosques = useCallback(async (lat: number, lng: number, radius: number = ME_RADIUS_M) => {
    setMosqueState('loading');
    try {
      const res = await fetchNearbyMosques(lat, lng, radius);
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
      setSelectedId(null);
      setQuickCat(null);
      setQuickSort(defaultQuickSort(activeFilterRef.current));
      mapCenter.current = coords;
      // Vue large pour voir un maximum de mosquées de l'agglomération.
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.16, longitudeDelta: 0.16 }, 800);
      // Toujours charger les mosquées réelles (OSM) : affichées si l'onglet Mosquées
      // est actif, et indispensables au score « hôtel bien situé ».
      loadMosques(coords.latitude, coords.longitude, CITY_RADIUS_M);

      // Détail de la ville (restaurants / hôtels réels)
      setCityDetail(null);
      setCityDetailState('loading');
      try {
        const { data } = await getVilleCached(ville.slug);
        setCityDetail(data);
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
    setSelectedId(null);
    setQuickCat(null);
    setQuickSort(defaultQuickSort(activeFilterRef.current));
    if (userLoc) {
      mapCenter.current = userLoc;
      mapRef.current?.animateToRegion({ ...userLoc, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 700);
      if (activeFilterRef.current === 'mosquees') loadMosques(userLoc.latitude, userLoc.longitude);
    } else {
      locate();
    }
  }, [userLoc, loadMosques, locate]);

  // Projection demandée depuis la fiche ville (« Voir sur la carte »).
  useFocusEffect(
    useCallback(() => {
      const pc = consumePendingCity();
      if (pc) selectCity(pc as VilleSummary);
    }, [selectCity]),
  );

  // ── Lieux affichés ──
  const activeCfg = FILTERS.find((f) => f.key === activeFilter)!;

  // Mosquées de référence de la ville : principales (API) + exhaustives (OSM),
  // dédupliquées → score hôtel fiable.
  const cityMosquees = useMemo(
    () => (cityDetail ? mergeMosquees(cityDetail.mosquees, mosques.map(osmToLieu)) : []),
    [cityDetail, mosques],
  );

  const places: PinItem[] = useMemo(() => {
    if (activeFilter === 'mosquees') {
      return mosques.map((m) => ({ id: m.id, name: m.name, latitude: m.latitude, longitude: m.longitude }));
    }
    // Restaurants / hôtels : vraies données de la ville si disponibles.
    if (selectedCity && cityDetail && (activeFilter === 'restaurants' || activeFilter === 'hotels')) {
      const arr =
        activeFilter === 'restaurants' ? cityDetail.restaurants : dedupeHotels(cityDetail.hotels);
      if (arr && arr.length > 0) {
        return arr.map((l) => {
          const base: PinItem = {
            id: l.id,
            name: l.nom,
            latitude: l.latitude,
            longitude: l.longitude,
            address: l.adresse,
            note: l.note,
            price: l.price,
            category: l.category,
            mapsUrl: l.mapsUrl,
            halalConfidence: l.halalConfidence,
          };
          if (activeFilter === 'hotels') {
            const loc = hotelLocationStats(l, cityMosquees, cityDetail.restaurants, 1);
            base.locScore = loc.score;
            base.nearestMosqueKm = loc.nearestMosqueKm;
            base.restosNear = loc.restosNear;
          }
          return base;
        });
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
  }, [activeFilter, mosques, selectedCity, cityDetail, userLoc, cityMosquees]);

  // Restaurants : la sélection fine s'applique aussi aux hôtels (gammes/budgets).
  const sortable = activeFilter === 'restaurants' || activeFilter === 'hotels';

  // Catégories disponibles : cuisines (restos) ou gammes (hôtels : Luxe, Budget, Capsule…).
  const categoryOptions = useMemo(() => {
    if (!sortable) return [];
    const set = new Set<string>();
    places.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [places, sortable]);

  // Liste affichée = lieux filtrés par la catégorie choisie.
  const visiblePlaces = useMemo(() => {
    if (sortable && quickCat) {
      return places.filter((p) => p.category === quickCat);
    }
    return places;
  }, [places, sortable, quickCat]);

  const showQuickBar = sortable && !!selectedCity && places.length > 1;

  // On plafonne les repères de la carte : rendre des centaines de marqueurs
  // personnalisés fige la carte. ~60 suffisent largement à l'écran.
  const MAX_MARKERS = 60;
  const markers = useMemo(
    () =>
      visiblePlaces
        .filter(
          (p): p is PinItem & { latitude: number; longitude: number } =>
            typeof p.latitude === 'number' && typeof p.longitude === 'number',
        )
        .slice(0, MAX_MARKERS),
    [visiblePlaces],
  );

  // tracksViewChanges : true brièvement pour dessiner les marqueurs, puis false
  // (sinon react-native-maps les redessine à chaque frame → gros lag).
  const [markersTrack, setMarkersTrack] = useState(true);
  useEffect(() => {
    setMarkersTrack(true);
    const t = setTimeout(() => setMarkersTrack(false), 900);
    return () => clearTimeout(t);
  }, [markers, selectedId]);

  const nearbyList: PinWithDist[] = useMemo(() => {
    const origin = selectedCity ?? userLoc ?? mapCenter.current;
    const withDist = visiblePlaces.map((p) => ({
      ...p,
      dist:
        typeof p.latitude === 'number' && typeof p.longitude === 'number'
          ? distanceKm(origin.latitude, origin.longitude, p.latitude, p.longitude)
          : null,
    }));
    withDist.sort((a, b) => {
      if (sortable) {
        if (quickSort === 'reco') return recommendedScore(b) - recommendedScore(a);
        if (quickSort === 'situe') return (b.locScore ?? -1) - (a.locScore ?? -1);
        if (quickSort === 'note') return (b.note ?? -1) - (a.note ?? -1);
        if (quickSort === 'prix') return (priceRank(a.price) ?? 99) - (priceRank(b.price) ?? 99);
      }
      return (a.dist ?? Infinity) - (b.dist ?? Infinity);
    });
    return withDist.slice(0, 40);
  }, [visiblePlaces, userLoc, selectedCity, sortable, quickSort]);

  const searchRadius = () => (selectedCity ? CITY_RADIUS_M : ME_RADIUS_M);

  // Fait défiler la liste du bas jusqu'à la carte d'un lieu.
  const scrollCardsTo = (id: string) => {
    const idx = nearbyList.findIndex((p) => p.id === id);
    if (idx >= 0) {
      cardsRef.current?.scrollTo({ x: Math.max(0, idx * (CARD_W + CARD_GAP) - 16), animated: true });
    }
  };

  // Clic sur un repère de la carte → sélectionne + met en avant sa carte.
  const onMarkerPress = (id: string) => {
    setSelectedId(id);
    scrollCardsTo(id);
  };

  const handleFilterPress = (key: FilterKey) => {
    setActiveFilter(key);
    setSelectedId(null);
    setQuickCat(null);
    setQuickSort(defaultQuickSort(key));
    if (key === 'mosquees' && (mosqueState === 'idle' || mosqueState === 'error')) {
      loadMosques(mapCenter.current.latitude, mapCenter.current.longitude, searchRadius());
    }
  };

  const goPlace = (p: PinItem) => {
    if (p.mapsUrl) {
      openMapsUrl(p.mapsUrl);
    } else if (typeof p.latitude === 'number' && typeof p.longitude === 'number') {
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

        {markers.map((place) => {
          const isSel = selectedId === place.id;
          return (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            pinColor={activeCfg.marker}
            onPress={() => onMarkerPress(place.id)}
            tracksViewChanges={markersTrack}
            zIndex={isSel ? 99 : 1}
          >
            <View
              style={[
                styles.markerBubble,
                { backgroundColor: activeCfg.marker },
                isSel && styles.markerBubbleActive,
              ]}
            >
              <Text style={styles.markerEmoji}>{activeCfg.emoji}</Text>
            </View>
            <Callout tooltip onPress={() => goPlace(place)}>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{place.name}</Text>
                {place.address && <Text style={styles.calloutDist}>{place.address}</Text>}
                {place.nearestMosqueKm != null && (
                  <Text style={styles.calloutLoc}>
                    🕌 Mosquée à {formatDistance(place.nearestMosqueKm)}
                    {place.restosNear ? ` · 🍽️ ${place.restosNear} restos` : ''}
                  </Text>
                )}
                {place.demo && <Text style={styles.calloutDemo}>exemple (démo)</Text>}
                <View style={styles.calloutCta}>
                  <Text style={styles.calloutCtaText}>🧭 Y aller (itinéraire)</Text>
                </View>
              </View>
            </Callout>
          </Marker>
          );
        })}
      </MapView>

      {/* En-tête : logo + barre de recherche de ville */}
      <View style={styles.header}>
        <View style={styles.brandDot}>
          <Text style={styles.brandEmoji}>🌙</Text>
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
          <Pressable style={styles.searchBar} onPress={() => setCityModal(true)}>
            <Text style={styles.searchBarIcon}>🔍</Text>
            <Text style={styles.searchBarText} numberOfLines={1}>
              Une ville ? Tokyo, Dubaï, Istanbul…
            </Text>
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
            <Pressable onPress={() => loadMosques(mapCenter.current.latitude, mapCenter.current.longitude, searchRadius())}>
              <Text style={styles.statusText}>Erreur réseau — appuyez pour réessayer</Text>
            </Pressable>
          ) : activeFilter === 'mosquees' && places.length === 0 && mosqueState === 'ready' ? (
            <Text style={styles.statusText}>Aucune mosquée ici — déplacez la carte</Text>
          ) : (
            <Text style={styles.statusText}>
              {visiblePlaces.length} {quickCat ?? activeCfg.label}
              {selectedCity ? ` · ${selectedCity.nom}` : activeFilter === 'mosquees' ? ' à proximité' : ' (démo)'}
            </Text>
          )}
        </View>
      )}

      {/* « Rechercher dans cette zone » (mosquées) */}
      {activeFilter === 'mosquees' && mosqueState !== 'loading' && !(locDenied && !selectedCity) && (
        <Pressable
          style={styles.searchHere}
          onPress={() => loadMosques(mapCenter.current.latitude, mapCenter.current.longitude, searchRadius())}
        >
          <Text style={styles.searchHereText}>🔄 Rechercher dans cette zone</Text>
        </Pressable>
      )}

      {/* Recentrer sur moi (et quitter le mode ville) */}
      <Pressable style={styles.recenter} onPress={goToMe}>
        {locating ? <ActivityIndicator size="small" color={Brand.forest} /> : <Text style={styles.recenterIcon}>📍</Text>}
      </Pressable>

      {/* Recherche de ville accessible depuis le bas (miroir du bouton 📍) */}
      <Pressable style={styles.cityFab} onPress={() => setCityModal(true)}>
        <Text style={styles.cityFabIcon}>🌍</Text>
      </Pressable>

      {/* Liste des lieux proches */}
      {nearbyList.length > 0 && (
        <View style={styles.cardsWrapper}>
          {/* Accueil épuré : un seul bouton « cuisine + tri » (« le japonais le plus proche ») */}
          {showQuickBar && (
            <View style={styles.quickBar}>
              <Pressable style={styles.quickBtn} onPress={() => setQuickSheet(true)}>
                <Text style={styles.quickBtnText} numberOfLines={1}>
                  {activeCfg.emoji}{' '}
                  {quickCat ??
                    (activeFilter === 'hotels' ? 'Gamme & tri' : 'Cuisine & tri')}
                  {quickSort !== defaultQuickSort(activeFilter)
                    ? ` · ${quickSortLabel(activeFilter, quickSort)}`
                    : ''}{' '}
                  ▾
                </Text>
              </Pressable>
              {(quickCat || quickSort !== defaultQuickSort(activeFilter)) && (
                <Pressable
                  hitSlop={8}
                  style={styles.quickReset}
                  onPress={() => {
                    setQuickCat(null);
                    setQuickSort(defaultQuickSort(activeFilter));
                  }}
                >
                  <Text style={styles.quickResetText}>✕</Text>
                </Pressable>
              )}
            </View>
          )}
          <ScrollView
            ref={cardsRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScroll}
          >
            {nearbyList.map((p, i) => (
              <Pressable
                key={p.id}
                style={[styles.placeCard, selectedId === p.id && styles.placeCardActive]}
                onPress={() => {
                  setSelectedId(p.id);
                  focusPlace(p);
                }}
              >
                <View style={styles.placeCardTop}>
                  <Text style={styles.placeEmoji}>{activeCfg.emoji}</Text>
                  {(() => {
                    const b = halalBadge(p.halalConfidence);
                    return b ? (
                      <Text style={[styles.halalTag, b.tone === 'green' ? styles.halalTagGreen : styles.halalTagAmber]}>
                        {b.label}
                      </Text>
                    ) : null;
                  })()}
                  {i === 0 && quickSort === 'reco' && (p.note != null || p.dist != null) && (
                    <Text style={styles.nearestTag}>✨ Reco</Text>
                  )}
                  {i === 0 && p.dist != null && quickSort === 'proche' && (
                    <Text style={styles.nearestTag}>la + proche</Text>
                  )}
                  {i === 0 && quickSort === 'situe' && p.locScore != null && (
                    <Text style={styles.nearestTag}>🕌 top emplacement</Text>
                  )}
                  {p.demo && <Text style={styles.demoTag}>démo</Text>}
                </View>
                <Text style={styles.placeName} numberOfLines={2}>
                  {p.name}
                </Text>
                {p.category && (
                  <Text style={styles.placeCat} numberOfLines={1}>
                    {p.category}
                  </Text>
                )}
                {p.nearestMosqueKm != null && (
                  <Pressable onPress={() => setAroundHotelId(p.id)} hitSlop={6}>
                    <Text style={styles.placeLoc} numberOfLines={1}>
                      🕌 {formatDistance(p.nearestMosqueKm)}
                      {p.restosNear ? ` · 🍽️ ${p.restosNear} restos` : ''} · voir autour ›
                    </Text>
                  </Pressable>
                )}
                <View style={styles.placeCardBottom}>
                  <Text style={styles.placeDist}>
                    {p.note != null
                      ? `⭐ ${p.note.toFixed(1)}${p.price ? ` · ${p.price}` : ''}`
                      : p.dist != null
                        ? formatDistance(p.dist)
                        : 'voir'}
                  </Text>
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

      {showQuickBar && (
        <CuisineSheet
          visible={quickSheet}
          title={activeFilter === 'hotels' ? '🏨 Gamme & tri' : '🍽️ Cuisine & tri'}
          categoryLabel={activeFilter === 'hotels' ? 'Gamme' : 'Cuisine'}
          allLabel={activeFilter === 'hotels' ? 'Toutes gammes' : 'Toutes cuisines'}
          sorts={quickSortsFor(activeFilter)}
          activeSort={quickSort}
          onPickSort={(k) => setQuickSort(k as QuickSort)}
          categories={categoryOptions.length > 1 ? categoryOptions : []}
          activeCategory={quickCat}
          onPickCategory={setQuickCat}
          onClose={() => setQuickSheet(false)}
        />
      )}

      {(() => {
        const h = cityDetail?.hotels.find((x) => x.id === aroundHotelId);
        return h ? (
          <HotelAroundSheet
            hotel={h}
            mosquees={cityMosquees}
            restaurants={cityDetail!.restaurants}
            onClose={() => setAroundHotelId(null)}
          />
        ) : null;
      })()}
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
  brandDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.forest,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  brandEmoji: { fontSize: 20 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 22,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  searchBarIcon: { fontSize: 15 },
  searchBarText: { flex: 1, color: '#888', fontSize: 14, fontWeight: '600' },
  cityActive: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    backgroundColor: Brand.gold,
    borderRadius: 22,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cityActiveMain: { flex: 1 },
  cityActiveText: { color: Brand.night, fontWeight: '800', fontSize: 15 },
  cityClear: { color: Brand.night, fontWeight: '800', fontSize: 16 },

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

  cityFab: {
    position: 'absolute',
    left: 16,
    bottom: Platform.OS === 'ios' ? 250 : 220,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
  },
  cityFabIcon: { fontSize: 22 },

  cardsWrapper: { position: 'absolute', left: 0, right: 0, bottom: Platform.OS === 'ios' ? 124 : 98 },
  cardsScroll: { paddingHorizontal: 16, gap: 10 },

  quickBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  quickBtn: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    backgroundColor: Brand.gold,
    borderWidth: 1.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 6,
  },
  quickBtnText: { color: Brand.night, fontSize: 13.5, fontWeight: '800' },
  quickReset: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  quickResetText: { color: Brand.night, fontSize: 13, fontWeight: '800' },
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
  placeCardActive: { borderWidth: 2, borderColor: Brand.gold },
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
  halalTag: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  halalTagGreen: { backgroundColor: '#2d6a4f', color: '#eafff1' },
  halalTagAmber: { backgroundColor: Brand.gold, color: Brand.night },
  placeName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', minHeight: 36 },
  placeCat: { fontSize: 11, fontWeight: '600', color: '#9c4221', marginTop: -2 },
  placeLoc: { fontSize: 11, fontWeight: '800', color: '#1b4332' },
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
  markerBubbleActive: {
    borderColor: Brand.gold,
    borderWidth: 4,
    transform: [{ scale: 1.25 }],
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
  calloutLoc: { fontSize: 12, fontWeight: '700', color: '#1b4332' },
  calloutDemo: { fontSize: 11, color: '#999', fontStyle: 'italic' },
  calloutCta: { marginTop: 6, backgroundColor: Brand.forest, borderRadius: Radius.sm, paddingVertical: 8, alignItems: 'center' },
  calloutCtaText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
