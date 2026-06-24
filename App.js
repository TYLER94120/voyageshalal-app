
import { useEffect, useRef, useState } from 'react';
import {
  Animated, BackHandler, Dimensions, Easing, Linking, Platform,
  Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet,
  Text, View, ActivityIndicator,
} from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';

// ╔══════════════════════════════════════════════════════════════╗
// ║           REMPLACE CETTE VALEUR PAR TA CLÉ GOOGLE           ║
// ╚══════════════════════════════════════════════════════════════╝
const GOOGLE_API_KEY = "AIzaSyDGZZgkVgfGLSJl7QHUynUDR3xzel-9x_U";

// ─── Design System ────────────────────────────────────────────────────────────
const DS = {
  cream:   '#FFFAF1',
  green:   '#1B5E20',
  greenLt: '#E8F5E9',
  gold:    '#C9A84C',
  text:    '#333333',
  textMd:  '#666666',
  white:   '#FFFFFF',
  red:     '#B71C1C',
  redLt:   '#FFEBEE',
  shadow: {
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
};

const { width, height } = Dimensions.get('window');

// ─── Écran d'alerte clé API manquante ────────────────────────────────────────
function ApiKeyMissingScreen() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  return (
    <SafeAreaView style={ak.screen}>
      <StatusBar barStyle="light-content" backgroundColor={DS.red} />
      <View style={ak.container}>

        <Animated.View style={[ak.iconWrap, { transform: [{ scale: pulse }] }]}>
          <Text style={ak.icon}>⚠️</Text>
        </Animated.View>

        <Text style={ak.title}>Clé API manquante</Text>

        <View style={ak.messageBox}>
          <Text style={ak.message}>
            Veuillez insérer votre clé API Google dans le code.
          </Text>
        </View>

        <View style={ak.steps}>
          <Text style={ak.stepsTitle}>Comment faire :</Text>
          {[
            '1. Ouvre le fichier App.js',
            '2. Repère la ligne tout en haut :\n     const GOOGLE_API_KEY = "METS_TA_CLE_ICI"',
            '3. Remplace METS_TA_CLE_ICI\n     par ta vraie clé Google Cloud',
            '4. Active "Places API" dans\n     Google Cloud Console',
          ].map((step, i) => (
            <View key={i} style={ak.stepRow}>
              <Text style={ak.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={ak.footer}>
          <Text style={ak.footerText}>
            console.error → GOOGLE_API_KEY non définie
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const ak = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: DS.red },
  container:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 24 },
  iconWrap:   { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  icon:       { fontSize: 52 },
  title:      { fontSize: 28, fontWeight: '900', color: DS.white, textAlign: 'center', letterSpacing: -0.5 },
  messageBox: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 18, width: '100%' },
  message:    { fontSize: 17, color: DS.white, textAlign: 'center', fontWeight: '600', lineHeight: 26 },
  steps:      { backgroundColor: 'rgba(0,0,0,0.20)', borderRadius: 20, padding: 20, width: '100%', gap: 12 },
  stepsTitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  stepRow:    { borderLeftWidth: 2, borderLeftColor: 'rgba(255,255,255,0.3)', paddingLeft: 12 },
  stepText:   { fontSize: 13, color: DS.white, lineHeight: 20 },
  footer:     { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  footerText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});

// ─── Données de démo (fallback si API KO) ─────────────────────────────────────
const DEMO_MOSQUES = [
  { id: 'd1', name: 'Grande Mosquée de Paris', subtitle: 'Mosquée cathédrale · 75005', latitude: 48.8427, longitude: 2.3536, rating: 4.8 },
  { id: 'd2', name: 'Mosquée Al-Fath',         subtitle: 'Mosquée · 75018',            latitude: 48.8984, longitude: 2.3487, rating: 4.6 },
  { id: 'd3', name: 'Mosquée Omar',             subtitle: 'Mosquée · 75011',            latitude: 48.8647, longitude: 2.3732, rating: 4.5 },
  { id: 'd4', name: 'Mosquée de Clichy',        subtitle: 'Mosquée · Clichy',           latitude: 48.9048, longitude: 2.3042, rating: 4.3 },
];

const INSPIRATIONS = [
  { id: '1', arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',          french: 'Car avec la difficulté vient la facilité.', source: 'Sourate Al-Inshirah · 94:6', type: 'verset' },
  { id: '2', arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', french: 'Louange à Allah, Seigneur des mondes.',      source: 'Sourate Al-Fatiha · 1:2',    type: 'verset' },
  { id: '3', arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ',          french: 'Gloire à Allah et louange Lui soit rendue.', source: 'Invocation du matin',        type: 'dhikr'  },
];

// ─── Utilitaires ──────────────────────────────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function estimatedTime(km) {
  if (km < 1) return { mins: Math.round((km / 5) * 60), mode: 'À pied' };
  return { mins: Math.round((km / 40) * 60), mode: 'Voiture' };
}

function formatPlaceResult(place, index) {
  return {
    id:        place.place_id || `p_${index}`,
    name:      place.name     || 'Mosquée',
    subtitle:  place.vicinity || 'Lieu de culte',
    latitude:  place.geometry?.location?.lat ?? 0,
    longitude: place.geometry?.location?.lng ?? 0,
    rating:    place.rating   ?? null,
  };
}

// ─── Header partagé ───────────────────────────────────────────────────────────
function Header({ title, subtitle, onBack }) {
  return (
    <View style={hS.wrap}>
      {onBack && (
        <Pressable onPress={onBack} style={hS.back} hitSlop={12}>
          <Text style={hS.backIcon}>←</Text>
        </Pressable>
      )}
      <View style={hS.text}>
        <Text style={hS.title}>{title}</Text>
        {subtitle ? <Text style={hS.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}
const hS = StyleSheet.create({
  wrap:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 16 },
  back:     { width: 40, height: 40, borderRadius: 20, backgroundColor: DS.greenLt, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  backIcon: { fontSize: 20, color: DS.green, fontWeight: '700' },
  text:     { flex: 1 },
  title:    { fontSize: 26, fontWeight: '800', color: DS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: DS.textMd, marginTop: 2 },
});

// ─── SCREEN 1 — Dashboard ─────────────────────────────────────────────────────
function DashboardScreen({ navigate }) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  const CARDS = [
    { screen: 'mosquees',    emoji: '🕌', title: 'Mosquées',    desc: 'Trouve une mosquée\nprès de toi',  accent: DS.green,  bg: DS.greenLt },
    { screen: 'qibla',       emoji: '🧭', title: 'Qibla',       desc: 'Direction de\nla Mecque',          accent: DS.gold,   bg: '#FDF8EC'  },
    { screen: 'inspiration', emoji: '✨', title: 'Inspiration', desc: 'Verset & invocation\ndu jour',     accent: '#5C6BC0', bg: '#EEF0FB'  },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DS.cream }}>
      <StatusBar barStyle="dark-content" backgroundColor={DS.cream} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dS.scroll}>

        <Animated.View style={[dS.logoWrap, { opacity: fade, transform: [{ translateY: slide }] }]}>
          <View style={dS.moonBadge}><Text style={dS.moonText}>🌙</Text></View>
          <Text style={dS.appName}>VoyagesHalal</Text>
          <Text style={dS.tagline}>Voyagez en toute sérénité</Text>
          <View style={dS.divider} />
        </Animated.View>

        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          {(CARDS || []).map((c) => (
            <DashCard key={c.screen} card={c} onPress={() => navigate(c.screen)} />
          ))}
        </Animated.View>

        <Text style={dS.footer}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function DashCard({ card, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[dS.card, DS.shadow, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20 }).start()}
        style={dS.cardInner}
      >
        <View style={[dS.iconBubble, { backgroundColor: card.bg }]}>
          <Text style={dS.cardEmoji}>{card.emoji}</Text>
        </View>
        <View style={dS.cardText}>
          <Text style={dS.cardTitle}>{card.title}</Text>
          <Text style={dS.cardDesc}>{card.desc}</Text>
        </View>
        <View style={[dS.arrow, { backgroundColor: card.accent }]}>
          <Text style={dS.arrowText}>›</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const dS = StyleSheet.create({
  scroll:     { paddingHorizontal: 20, paddingBottom: 40 },
  logoWrap:   { alignItems: 'center', paddingTop: 24, paddingBottom: 32 },
  moonBadge:  { width: 72, height: 72, borderRadius: 36, backgroundColor: DS.greenLt, alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...DS.shadow },
  moonText:   { fontSize: 36 },
  appName:    { fontSize: 32, fontWeight: '800', color: DS.text, letterSpacing: -0.8 },
  tagline:    { fontSize: 14, color: DS.textMd, marginTop: 6, letterSpacing: 0.3 },
  divider:    { width: 48, height: 3, backgroundColor: DS.gold, borderRadius: 99, marginTop: 20 },
  card:       { backgroundColor: DS.white, borderRadius: 24, marginBottom: 16, overflow: 'hidden' },
  cardInner:  { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  iconBubble: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardEmoji:  { fontSize: 28 },
  cardText:   { flex: 1 },
  cardTitle:  { fontSize: 18, fontWeight: '700', color: DS.text, marginBottom: 4 },
  cardDesc:   { fontSize: 13, color: DS.textMd, lineHeight: 19 },
  arrow:      { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  arrowText:  { color: DS.white, fontSize: 20, fontWeight: '700', lineHeight: 22 },
  footer:     { textAlign: 'center', fontSize: 18, color: DS.textMd, marginTop: 24, letterSpacing: 1 },
});

// ─── SCREEN 2 — Mosquées ──────────────────────────────────────────────────────
function MosqueesScreen({ goBack }) {
  const mapRef = useRef(null);
  const [mosques, setMosques]     = useState([]);
  const [userPos, setUserPos]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const log = (msg) => {
    console.log(`[Mosquées] ${msg}`);
    setStatusMsg(msg);
  };

  const fetchMosques = async (lat, lon) => {
    log(`Appel Google Places — lat:${lat.toFixed(4)} lon:${lon.toFixed(4)}`);
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
        `?location=${lat},${lon}&radius=5000&type=mosque&key=${GOOGLE_API_KEY}`;
      console.log('[Mosquées] URL →', url);

      const res  = await fetch(url);
      const json = await res.json();

      console.log('[Mosquées] Statut API →', json.status);
      console.log('[Mosquées] Résultats reçus →', (json.results || []).length);

      if (json.status === 'OK' && Array.isArray(json.results) && json.results.length > 0) {
        const formatted = json.results.map(formatPlaceResult);
        setMosques(formatted);
        log(`✅ ${formatted.length} mosquées chargées depuis l'API`);
      } else if (json.status === 'ZERO_RESULTS') {
        setMosques(DEMO_MOSQUES);
        log('⚠️ Aucun résultat — données de démo affichées');
      } else {
        throw new Error(`Statut API inattendu : ${json.status}`);
      }
    } catch (err) {
      console.error('[Mosquées] Erreur →', err.message);
      setMosques(DEMO_MOSQUES);
      log(`❌ Erreur API — données de démo affichées`);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      log('Demande de permission GPS…');

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        log('Permission GPS refusée → fallback Paris');
        await fetchMosques(48.8566, 2.3522);
        setLoading(false);
        return;
      }

      try {
        log('Obtention de la position…');
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        console.log('[Mosquées] Position →', pos);
        setUserPos(pos);
        mapRef.current?.animateToRegion({ ...pos, latitudeDelta: 0.06, longitudeDelta: 0.06 }, 800);
        await fetchMosques(pos.latitude, pos.longitude);
      } catch (err) {
        console.error('[Mosquées] Erreur GPS →', err.message);
        log('Erreur GPS → fallback Paris');
        await fetchMosques(48.8566, 2.3522);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!userPos) return;
    const id = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        setUserPos({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch { /* position inchangée */ }
    }, 15000);
    return () => clearInterval(id);
  }, [userPos]);

  const openMaps = (lat, lon, name) => {
    const label = encodeURIComponent(name);
    const url   = Platform.OS === 'ios'
      ? `maps://app?daddr=${lat},${lon}&q=${label}`
      : `google.navigation:q=${lat},${lon}`;
    Linking.canOpenURL(url).then((ok) =>
      Linking.openURL(ok
        ? url
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`)
    );
  };

  const getInfo = (mosque) => {
    if (!userPos) return { dist: '…', mins: '…', mode: '' };
    const km            = haversineKm(userPos.latitude, userPos.longitude, mosque.latitude, mosque.longitude);
    const { mins, mode } = estimatedTime(km);
    return { dist: formatDist(km), mins, mode };
  };

  return (
    <View style={{ flex: 1, backgroundColor: DS.cream }}>
      <StatusBar barStyle="dark-content" />

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{ latitude: 48.8566, longitude: 2.3522, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
        showsUserLocation
      >
        {(mosques || []).map((m) => {
          const { dist, mins, mode } = getInfo(m);
          const isActive = selectedId === m.id;
          return (
            <Marker
              key={m.id}
              coordinate={{ latitude: m.latitude, longitude: m.longitude }}
              onPress={() => setSelectedId(m.id)}
            >
              <View style={[mS.marker, isActive && mS.markerActive]}>
                <Text style={mS.markerEmoji}>🕌</Text>
              </View>

              <Callout tooltip onPress={() => openMaps(m.latitude, m.longitude, m.name)}>
                <View style={mS.callout}>
                  <Text style={mS.calloutName}>{m.name}</Text>
                  <Text style={mS.calloutSub}>{m.subtitle}</Text>

                  <View style={mS.calloutInfoRow}>
                    <View style={mS.calloutInfoBox}>
                      <Text style={mS.calloutInfoIcon}>📍</Text>
                      <Text style={mS.calloutInfoValue}>{dist}</Text>
                      <Text style={mS.calloutInfoLabel}>Distance</Text>
                    </View>
                    <View style={mS.calloutInfoDivider} />
                    <View style={mS.calloutInfoBox}>
                      <Text style={mS.calloutInfoIcon}>⏱</Text>
                      <Text style={mS.calloutInfoValue}>{mins} min</Text>
                      <Text style={mS.calloutInfoLabel}>{mode}</Text>
                    </View>
                  </View>

                  <View style={mS.calloutBtn}>
                    <Text style={mS.calloutBtnText}>🧭  Lancer l'itinéraire</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Loader */}
      {loading && (
        <View style={mS.loaderOverlay}>
          <ActivityIndicator size="large" color={DS.green} />
          <Text style={mS.loaderText}>{statusMsg || 'Chargement…'}</Text>
        </View>
      )}

      {/* Header flottant */}
      <View style={mS.headerOverlay}>
        <Pressable onPress={goBack} style={mS.backBtn}>
          <Text style={mS.backBtnText}>←</Text>
        </Pressable>
        <View style={mS.headerPill}>
          <Text style={mS.headerPillText}>
            🕌  {(mosques || []).length} mosquée{(mosques || []).length > 1 ? 's' : ''} trouvée{(mosques || []).length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Log de statut visible */}
      {!loading && statusMsg ? (
        <View style={mS.statusBar}>
          <Text style={mS.statusText}>{statusMsg}</Text>
        </View>
      ) : null}

      {/* Liste horizontale */}
      <View style={mS.bottomSheet}>
        <View style={mS.handle} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={mS.listScroll}>
          {(mosques || []).map((m) => {
            const { dist, mins } = getInfo(m);
            const isActive = selectedId === m.id;
            return (
              <Pressable
                key={m.id}
                style={[mS.listCard, isActive && mS.listCardActive, DS.shadow]}
                onPress={() => {
                  setSelectedId(m.id);
                  mapRef.current?.animateToRegion(
                    { latitude: m.latitude, longitude: m.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 },
                    600
                  );
                }}
              >
                <Text style={mS.listEmoji}>🕌</Text>
                <Text style={[mS.listName, isActive && { color: DS.green }]} numberOfLines={2}>{m.name}</Text>
                <Text style={mS.listDist}>📍 {dist}  ·  ⏱ {mins} min</Text>
                <Pressable onPress={() => openMaps(m.latitude, m.longitude, m.name)} style={mS.listItinBtn}>
                  <Text style={mS.listItinText}>Itinéraire →</Text>
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const mS = StyleSheet.create({
  marker:             { width: 48, height: 48, borderRadius: 24, backgroundColor: DS.green, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: DS.white, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 6 },
  markerActive:       { backgroundColor: DS.gold, transform: [{ scale: 1.15 }] },
  markerEmoji:        { fontSize: 24 },
  callout:            { backgroundColor: DS.white, borderRadius: 20, padding: 16, width: 240, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10 },
  calloutName:        { fontWeight: '800', fontSize: 15, color: DS.text, marginBottom: 2 },
  calloutSub:         { fontSize: 12, color: DS.textMd, marginBottom: 12 },
  calloutInfoRow:     { flexDirection: 'row', backgroundColor: DS.greenLt, borderRadius: 14, padding: 12, marginBottom: 12 },
  calloutInfoBox:     { flex: 1, alignItems: 'center', gap: 2 },
  calloutInfoDivider: { width: 1, backgroundColor: '#C8E6C9' },
  calloutInfoIcon:    { fontSize: 16 },
  calloutInfoValue:   { fontSize: 15, fontWeight: '800', color: DS.green },
  calloutInfoLabel:   { fontSize: 10, color: DS.textMd, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  calloutBtn:         { backgroundColor: DS.green, borderRadius: 14, paddingVertical: 13, alignItems: 'center', width: '100%' },
  calloutBtnText:     { color: DS.white, fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  loaderOverlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,250,241,0.90)', alignItems: 'center', justifyContent: 'center', gap: 14 },
  loaderText:         { color: DS.green, fontWeight: '600', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  headerOverlay:      { position: 'absolute', top: Platform.OS === 'ios' ? 56 : 36, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:            { width: 42, height: 42, borderRadius: 21, backgroundColor: DS.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 5 },
  backBtnText:        { fontSize: 18, color: DS.green, fontWeight: '700' },
  headerPill:         { flex: 1, backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4 },
  headerPillText:     { fontSize: 13, fontWeight: '700', color: DS.green },
  statusBar:          { position: 'absolute', top: Platform.OS === 'ios' ? 112 : 92, left: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7 },
  statusText:         { fontSize: 11, color: DS.textMd, textAlign: 'center' },
  bottomSheet:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: DS.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 16 },
  handle:             { width: 40, height: 4, backgroundColor: '#D0D0D0', borderRadius: 99, alignSelf: 'center', marginBottom: 16 },
  listScroll:         { paddingHorizontal: 16, gap: 12 },
  listCard:           { backgroundColor: DS.white, borderRadius: 20, padding: 16, width: 168, gap: 5 },
  listCardActive:     { borderWidth: 2, borderColor: DS.green },
  listEmoji:          { fontSize: 28 },
  listName:           { fontSize: 13, fontWeight: '700', color: DS.text, lineHeight: 18 },
  listDist:           { fontSize: 11, color: DS.textMd },
  listItinBtn:        { marginTop: 4, backgroundColor: DS.green, borderRadius: 10, paddingVertical: 7, alignItems: 'center' },
  listItinText:       { fontSize: 12, fontWeight: '700', color: DS.white },
});

// ─── SCREEN 3 — Qibla ────────────────────────────────────────────────────────
const MECCA_BEARING = 119.7;
const COMPASS_SIZE  = width * 0.68;

function QiblaScreen({ goBack }) {
  const [heading, setHeading]         = useState(0);
  const [sensorAvail, setSensorAvail] = useState(true);
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const prevAngle = useRef(0);
  const glowAnim  = useRef(new Animated.Value(0.6)).current;

  const qiblaDisplay = Math.round((MECCA_BEARING - heading + 360) % 360);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    let sub = null;
    Magnetometer.isAvailableAsync().then((ok) => {
      if (!ok) { setSensorAvail(false); return; }
      Magnetometer.setUpdateInterval(80);
      sub = Magnetometer.addListener(({ x, y }) => {
        let phoneNorth = Math.atan2(y, x) * (180 / Math.PI);
        if (phoneNorth < 0) phoneNorth += 360;
        setHeading(phoneNorth);

        let target = MECCA_BEARING - phoneNorth;
        let diff   = target - prevAngle.current;
        if (diff >  180) diff -= 360;
        if (diff < -180) diff += 360;
        const next = prevAngle.current + diff;
        prevAngle.current = next;

        Animated.spring(arrowAnim, { toValue: next, useNativeDriver: true, tension: 80, friction: 12 }).start();
      });
    });

    return () => {
      if (sub) sub.remove();
      Magnetometer.removeAllListeners();
    };
  }, [arrowAnim, glowAnim]);

  const rotate = arrowAnim.interpolate({ inputRange: [-720, 720], outputRange: ['-720deg', '720deg'] });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DS.cream }}>
      <StatusBar barStyle="dark-content" />
      <Header title="Qibla" subtitle="Direction de La Mecque" onBack={goBack} />

      <View style={qS.container}>

        <View style={[qS.topCard, DS.shadow]}>
          <View style={qS.topItem}>
            <Text style={qS.topValue}>{qiblaDisplay}°</Text>
            <Text style={qS.topLabel}>Degrés Qibla</Text>
          </View>
          <View style={qS.topDivider} />
          <View style={qS.topItem}>
            <Text style={qS.topValue}>5 190 km</Text>
            <Text style={qS.topLabel}>Distance</Text>
          </View>
          <View style={qS.topDivider} />
          <View style={qS.topItem}>
            <Text style={qS.topValue}>{Math.round(heading)}°</Text>
            <Text style={qS.topLabel}>Orientation</Text>
          </View>
        </View>

        <Animated.View style={[qS.glowRing, { opacity: glowAnim }]} />

        <View style={qS.dial}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <View
              key={deg}
              style={[
                qS.tick,
                deg % 90 === 0 ? qS.tickMajor : qS.tickMinor,
                { transform: [{ rotate: `${deg}deg` }, { translateY: -(COMPASS_SIZE / 2 - 16) }] },
              ]}
            />
          ))}

          {[['N', 0], ['E', 90], ['S', 180], ['O', 270]].map(([label, deg]) => {
            const rad = (deg - 90) * Math.PI / 180;
            const r   = COMPASS_SIZE / 2 - 36;
            return (
              <Text
                key={label}
                style={[
                  qS.cardinalLabel,
                  label === 'N' && qS.cardinalN,
                  { position: 'absolute', left: COMPASS_SIZE / 2 + r * Math.cos(rad) - 10, top: COMPASS_SIZE / 2 + r * Math.sin(rad) - 10 },
                ]}
              >
                {label}
              </Text>
            );
          })}

          {/* Aiguille unique verte → Qibla */}
          <Animated.View style={[qS.arrowWrap, { transform: [{ rotate }] }]}>
            <View style={qS.arrowHead} />
            <View style={qS.arrowShaft} />
            <View style={qS.arrowTail} />
          </Animated.View>

          <View style={qS.center}>
            <Text style={qS.centerEmoji}>🕋</Text>
          </View>
        </View>

        {!sensorAvail && (
          <View style={qS.warnBadge}>
            <Text style={qS.warnText}>⚠️  Magnétomètre non disponible sur cet appareil</Text>
          </View>
        )}

        <Text style={qS.hint}>Tourne-toi jusqu'à ce que la flèche pointe vers le haut ↑</Text>
        <Text style={qS.disclaimer}>Direction approximative. Vérifiez toujours la direction.</Text>

      </View>
    </SafeAreaView>
  );
}

const qS = StyleSheet.create({
  container:    { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  topCard:      { flexDirection: 'row', backgroundColor: DS.white, borderRadius: 20, width: '100%', padding: 16, marginBottom: 20, alignItems: 'center' },
  topItem:      { flex: 1, alignItems: 'center', gap: 3 },
  topDivider:   { width: 1, height: 36, backgroundColor: '#F0EDE8' },
  topValue:     { fontSize: 20, fontWeight: '900', color: DS.green },
  topLabel:     { fontSize: 10, color: DS.textMd, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  glowRing:     { position: 'absolute', top: height * 0.22, width: COMPASS_SIZE + 56, height: COMPASS_SIZE + 56, borderRadius: (COMPASS_SIZE + 56) / 2, borderWidth: 2, borderColor: '#A5D6A7' },
  dial:         { width: COMPASS_SIZE, height: COMPASS_SIZE, borderRadius: COMPASS_SIZE / 2, backgroundColor: DS.white, alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...DS.shadow },
  tick:         { position: 'absolute', borderRadius: 2, alignSelf: 'center' },
  tickMajor:    { width: 3, height: 16, backgroundColor: '#BBBBBB' },
  tickMinor:    { width: 2, height: 8,  backgroundColor: '#E0E0E0' },
  cardinalLabel:{ width: 20, height: 20, textAlign: 'center', fontSize: 12, fontWeight: '700', color: DS.textMd },
  cardinalN:    { color: DS.green, fontWeight: '900', fontSize: 14 },
  arrowWrap:    { position: 'absolute', alignItems: 'center', height: COMPASS_SIZE * 0.74, justifyContent: 'center' },
  arrowHead:    { width: 0, height: 0, borderLeftWidth: 13, borderRightWidth: 13, borderBottomWidth: 26, borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: DS.green },
  arrowShaft:   { width: 6, height: COMPASS_SIZE * 0.24, backgroundColor: DS.green, borderRadius: 3, marginTop: -1 },
  arrowTail:    { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CCCCCC' },
  center:       { position: 'absolute', width: 50, height: 50, borderRadius: 25, backgroundColor: DS.cream, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: DS.greenLt },
  centerEmoji:  { fontSize: 26 },
  warnBadge:    { backgroundColor: '#FFF3E0', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 8 },
  warnText:     { fontSize: 12, color: '#E65100', textAlign: 'center', fontWeight: '600' },
  hint:         { fontSize: 12, color: '#999999', textAlign: 'center', lineHeight: 18, marginBottom: 6 },
  disclaimer:   { fontSize: 11, color: '#BBBBBB', textAlign: 'center', lineHeight: 16, fontStyle: 'italic' },
});

// ─── SCREEN 4 — Inspiration ───────────────────────────────────────────────────
function InspirationScreen({ goBack }) {
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const card = (INSPIRATIONS || [])[index] || INSPIRATIONS[0];

  const changeCard = (dir) => {
    Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setIndex((i) => (i + dir + INSPIRATIONS.length) % INSPIRATIONS.length);
      Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DS.cream }}>
      <StatusBar barStyle="dark-content" />
      <Header title="Inspiration" subtitle="Verset & Dhikr du jour" onBack={goBack} />
      <View style={iS.container}>
        <Animated.View style={[iS.card, DS.shadow, { opacity: fade }]}>
          <View style={iS.badge}>
            <Text style={iS.badgeText}>{card.type === 'verset' ? '📖 Verset' : '📿 Dhikr'}</Text>
          </View>
          <Text style={iS.arabic}>{card.arabic}</Text>
          <View style={iS.ornament}>
            <View style={iS.ornLine} /><Text style={iS.ornStar}>✦</Text><View style={iS.ornLine} />
          </View>
          <Text style={iS.french}>« {card.french} »</Text>
          <Text style={iS.source}>{card.source}</Text>
        </Animated.View>
        <View style={iS.nav}>
          <Pressable onPress={() => changeCard(-1)} style={iS.navBtn}><Text style={iS.navBtnText}>‹</Text></Pressable>
          <View style={iS.dots}>
            {(INSPIRATIONS || []).map((_, i) => <View key={i} style={[iS.dot, i === index && iS.dotActive]} />)}
          </View>
          <Pressable onPress={() => changeCard(1)} style={iS.navBtn}><Text style={iS.navBtnText}>›</Text></Pressable>
        </View>
        <View style={[iS.duaCard, DS.shadow]}>
          <Text style={iS.duaTitle}>Invocation du voyageur</Text>
          <Text style={iS.duaArabic}>اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا</Text>
          <Text style={iS.duaFrench}>«Ô Allah, facilite-nous notre voyage.»</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const iS = StyleSheet.create({
  container:  { flex: 1, paddingHorizontal: 20, paddingBottom: 24 },
  card:       { backgroundColor: DS.white, borderRadius: 28, padding: 32, marginBottom: 24, alignItems: 'center' },
  badge:      { backgroundColor: DS.greenLt, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 28 },
  badgeText:  { fontSize: 12, fontWeight: '700', color: DS.green, letterSpacing: 0.5 },
  arabic:     { fontSize: 28, color: DS.text, textAlign: 'center', lineHeight: 44, marginBottom: 24, letterSpacing: 1 },
  ornament:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, width: '80%' },
  ornLine:    { flex: 1, height: 1, backgroundColor: '#E8E2D8' },
  ornStar:    { color: DS.gold, fontSize: 14 },
  french:     { fontSize: 16, color: DS.text, textAlign: 'center', lineHeight: 26, fontStyle: 'italic', marginBottom: 20 },
  source:     { fontSize: 12, color: DS.textMd, textAlign: 'center', letterSpacing: 0.5, fontWeight: '600' },
  nav:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 24 },
  navBtn:     { width: 48, height: 48, borderRadius: 24, backgroundColor: DS.white, alignItems: 'center', justifyContent: 'center', ...DS.shadow },
  navBtnText: { fontSize: 26, color: DS.green, fontWeight: '700', lineHeight: 30 },
  dots:       { flexDirection: 'row', gap: 8 },
  dot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D0D0D0' },
  dotActive:  { backgroundColor: DS.green, width: 24 },
  duaCard:    { backgroundColor: DS.green, borderRadius: 24, padding: 24, alignItems: 'center', gap: 10 },
  duaTitle:   { fontSize: 12, color: '#A5D6A7', fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  duaArabic:  { fontSize: 20, color: DS.white, textAlign: 'center', lineHeight: 32 },
  duaFrench:  { fontSize: 13, color: '#A5D6A7', textAlign: 'center', fontStyle: 'italic', lineHeight: 20 },
});

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('dashboard');

  // Affiche l'écran d'alerte si la clé API n'a pas été configurée
  if (GOOGLE_API_KEY === 'METS_TA_CLE_ICI') {
    return <ApiKeyMissingScreen />;
  }

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen !== 'dashboard') { setScreen('dashboard'); return true; }
      return false;
    });
    return () => handler.remove();
  }, [screen]);

  switch (screen) {
    case 'mosquees':    return <MosqueesScreen    goBack={() => setScreen('dashboard')} />;
    case 'qibla':       return <QiblaScreen        goBack={() => setScreen('dashboard')} />;
    case 'inspiration': return <InspirationScreen  goBack={() => setScreen('dashboard')} />;
    default:            return <DashboardScreen    navigate={setScreen} />;
  }
}

