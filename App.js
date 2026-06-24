import { useEffect, useRef, useState } from 'react';
import {
  Animated, BackHandler, Dimensions, Easing, Linking, Platform,
  Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet,
  Text, View, ActivityIndicator, TextInput,
} from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';

// ╔══════════════════════════════════════════════════════════════╗
// ║                    CLÉ API GOOGLE PLACES                    ║
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
  shadow: {
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
};

const { width, height } = Dimensions.get('window');

// ─── Liste complète de mosquées en France ─────────────────────────────────────
const TOUTES_MOSQUEES = [
  // ── Paris & Île-de-France ──
  { id: 'm001', name: 'Grande Mosquée de Paris',          ville: 'Paris 5e',        latitude: 48.8427,  longitude: 2.3536,  rating: 4.8 },
  { id: 'm002', name: 'Mosquée Al-Fath',                  ville: 'Paris 18e',       latitude: 48.8984,  longitude: 2.3487,  rating: 4.6 },
  { id: 'm003', name: 'Mosquée Omar',                     ville: 'Paris 11e',       latitude: 48.8647,  longitude: 2.3732,  rating: 4.5 },
  { id: 'm004', name: 'Mosquée Adda\'wa',                 ville: 'Paris 19e',       latitude: 48.8820,  longitude: 2.3760,  rating: 4.4 },
  { id: 'm005', name: 'Mosquée Bilal',                    ville: 'Paris 20e',       latitude: 48.8620,  longitude: 2.3980,  rating: 4.2 },
  { id: 'm006', name: 'Mosquée de Clichy',                ville: 'Clichy',          latitude: 48.9048,  longitude: 2.3042,  rating: 4.3 },
  { id: 'm007', name: 'Mosquée de Saint-Denis',           ville: 'Saint-Denis',     latitude: 48.9356,  longitude: 2.3534,  rating: 4.5 },
  { id: 'm008', name: 'Mosquée de Bobigny',               ville: 'Bobigny',         latitude: 48.9100,  longitude: 2.4400,  rating: 4.3 },
  { id: 'm009', name: 'Mosquée Al-Rahma',                 ville: 'Créteil',         latitude: 48.7901,  longitude: 2.4572,  rating: 4.4 },
  { id: 'm010', name: 'Mosquée de Mantes-la-Jolie',       ville: 'Mantes-la-Jolie', latitude: 48.9900,  longitude: 1.7170,  rating: 4.5 },
  { id: 'm011', name: 'Mosquée Al-Badr',                  ville: 'Argenteuil',      latitude: 48.9470,  longitude: 2.2460,  rating: 4.2 },
  { id: 'm012', name: 'Mosquée de Sarcelles',             ville: 'Sarcelles',       latitude: 49.0000,  longitude: 2.3800,  rating: 4.3 },
  { id: 'm013', name: 'Mosquée Al-Ihsan',                 ville: 'Vitry-sur-Seine', latitude: 48.7870,  longitude: 2.3930,  rating: 4.1 },
  { id: 'm014', name: 'Mosquée de Versailles',            ville: 'Versailles',      latitude: 48.8060,  longitude: 2.1280,  rating: 4.4 },
  { id: 'm015', name: 'Mosquée de Nanterre',              ville: 'Nanterre',        latitude: 48.8960,  longitude: 2.1960,  rating: 4.2 },

  // ── Lyon & Rhône-Alpes ──
  { id: 'm020', name: 'Grande Mosquée de Lyon',           ville: 'Lyon 8e',         latitude: 45.7330,  longitude: 4.8690,  rating: 4.7 },
  { id: 'm021', name: 'Mosquée Al-Kauthar',               ville: 'Lyon 3e',         latitude: 45.7520,  longitude: 4.8560,  rating: 4.4 },
  { id: 'm022', name: 'Mosquée Othmane',                  ville: 'Vaulx-en-Velin',  latitude: 45.7760,  longitude: 4.9180,  rating: 4.3 },
  { id: 'm023', name: 'Mosquée de Vénissieux',            ville: 'Vénissieux',      latitude: 45.6970,  longitude: 4.8850,  rating: 4.2 },
  { id: 'm024', name: 'Mosquée de Villeurbanne',          ville: 'Villeurbanne',    latitude: 45.7660,  longitude: 4.8800,  rating: 4.3 },
  { id: 'm025', name: 'Mosquée de Saint-Étienne',         ville: 'Saint-Étienne',   latitude: 45.4347,  longitude: 4.3903,  rating: 4.2 },
  { id: 'm026', name: 'Mosquée de Grenoble',              ville: 'Grenoble',        latitude: 45.1885,  longitude: 5.7245,  rating: 4.3 },
  { id: 'm027', name: 'Grande Mosquée de Grenoble',       ville: 'Grenoble',        latitude: 45.1720,  longitude: 5.7380,  rating: 4.5 },

  // ── Marseille & PACA ──
  { id: 'm030', name: 'Grande Mosquée de Marseille',      ville: 'Marseille 13e',   latitude: 43.3600,  longitude: 5.4200,  rating: 4.6 },
  { id: 'm031', name: 'Mosquée As-Salam',                 ville: 'Marseille 14e',   latitude: 43.3100,  longitude: 5.3900,  rating: 4.4 },
  { id: 'm032', name: 'Mosquée Al-Aqsa',                  ville: 'Marseille 3e',    latitude: 43.3090,  longitude: 5.3820,  rating: 4.3 },
  { id: 'm033', name: 'Mosquée de la Capelette',          ville: 'Marseille 10e',   latitude: 43.2870,  longitude: 5.4010,  rating: 4.2 },
  { id: 'm034', name: 'Mosquée Al-Hidaya',                ville: 'Aix-en-Provence', latitude: 43.5297,  longitude: 5.4474,  rating: 4.3 },
  { id: 'm035', name: 'Mosquée de Nice',                  ville: 'Nice',            latitude: 43.7102,  longitude: 7.2620,  rating: 4.4 },
  { id: 'm036', name: 'Mosquée de Toulon',                ville: 'Toulon',          latitude: 43.1242,  longitude: 5.9280,  rating: 4.2 },
  { id: 'm037', name: 'Mosquée d\'Avignon',               ville: 'Avignon',         latitude: 43.9493,  longitude: 4.8055,  rating: 4.1 },

  // ── Bordeaux & Nouvelle-Aquitaine ──
  { id: 'm040', name: 'Grande Mosquée de Bordeaux',       ville: 'Bordeaux',        latitude: 44.8400,  longitude: -0.5780, rating: 4.6 },
  { id: 'm041', name: 'Mosquée Al-Barakah',               ville: 'Bordeaux',        latitude: 44.8560,  longitude: -0.5640, rating: 4.3 },
  { id: 'm042', name: 'Mosquée de Mérignac',              ville: 'Mérignac',        latitude: 44.8340,  longitude: -0.6450, rating: 4.2 },
  { id: 'm043', name: 'Mosquée de Pau',                   ville: 'Pau',             latitude: 43.2951,  longitude: -0.3708, rating: 4.3 },
  { id: 'm044', name: 'Mosquée de Bayonne',               ville: 'Bayonne',         latitude: 43.4921,  longitude: -1.4752, rating: 4.1 },

  // ── Toulouse & Occitanie ──
  { id: 'm050', name: 'Grande Mosquée de Toulouse',       ville: 'Toulouse',        latitude: 43.6047,  longitude: 1.4442,  rating: 4.7 },
  { id: 'm051', name: 'Mosquée Al-Baraka',                ville: 'Toulouse',        latitude: 43.6200,  longitude: 1.4600,  rating: 4.4 },
  { id: 'm052', name: 'Mosquée Assalam',                  ville: 'Toulouse',        latitude: 43.5900,  longitude: 1.4300,  rating: 4.3 },
  { id: 'm053', name: 'Mosquée de Montpellier',           ville: 'Montpellier',     latitude: 43.6119,  longitude: 3.8772,  rating: 4.4 },
  { id: 'm054', name: 'Grande Mosquée de Montpellier',    ville: 'Montpellier',     latitude: 43.6000,  longitude: 3.8900,  rating: 4.6 },
  { id: 'm055', name: 'Mosquée de Nîmes',                 ville: 'Nîmes',           latitude: 43.8367,  longitude: 4.3601,  rating: 4.2 },
  { id: 'm056', name: 'Mosquée de Perpignan',             ville: 'Perpignan',       latitude: 42.6887,  longitude: 2.8948,  rating: 4.3 },
  { id: 'm057', name: 'Mosquée de Béziers',               ville: 'Béziers',         latitude: 43.3442,  longitude: 3.2160,  rating: 4.1 },

  // ── Lille & Hauts-de-France ──
  { id: 'm060', name: 'Grande Mosquée de Lille',          ville: 'Lille',           latitude: 50.6292,  longitude: 3.0573,  rating: 4.6 },
  { id: 'm061', name: 'Mosquée Al-Nour',                  ville: 'Roubaix',         latitude: 50.6934,  longitude: 3.1746,  rating: 4.4 },
  { id: 'm062', name: 'Mosquée de Tourcoing',             ville: 'Tourcoing',       latitude: 50.7237,  longitude: 3.1582,  rating: 4.3 },
  { id: 'm063', name: 'Mosquée de Valenciennes',          ville: 'Valenciennes',    latitude: 50.3580,  longitude: 3.5236,  rating: 4.2 },
  { id: 'm064', name: 'Mosquée de Dunkerque',             ville: 'Dunkerque',       latitude: 51.0343,  longitude: 2.3770,  rating: 4.1 },
  { id: 'm065', name: 'Mosquée de Lens',                  ville: 'Lens',            latitude: 50.4320,  longitude: 2.8310,  rating: 4.2 },
  { id: 'm066', name: 'Mosquée de Douai',                 ville: 'Douai',           latitude: 50.3720,  longitude: 3.0800,  rating: 4.1 },

  // ── Strasbourg & Grand Est ──
  { id: 'm070', name: 'Grande Mosquée de Strasbourg',     ville: 'Strasbourg',      latitude: 48.5734,  longitude: 7.7521,  rating: 4.7 },
  { id: 'm071', name: 'Mosquée Eyyub Sultan',             ville: 'Strasbourg',      latitude: 48.5900,  longitude: 7.7800,  rating: 4.4 },
  { id: 'm072', name: 'Grande Mosquée de Metz',           ville: 'Metz',            latitude: 49.1193,  longitude: 6.1757,  rating: 4.5 },
  { id: 'm073', name: 'Mosquée de Mulhouse',              ville: 'Mulhouse',        latitude: 47.7508,  longitude: 7.3359,  rating: 4.4 },
  { id: 'm074', name: 'Mosquée de Nancy',                 ville: 'Nancy',           latitude: 48.6921,  longitude: 6.1844,  rating: 4.3 },
  { id: 'm075', name: 'Mosquée de Reims',                 ville: 'Reims',           latitude: 49.2583,  longitude: 4.0317,  rating: 4.2 },
  { id: 'm076', name: 'Mosquée de Colmar',                ville: 'Colmar',          latitude: 48.0797,  longitude: 7.3586,  rating: 4.2 },
  { id: 'm077', name: 'Mosquée de Thionville',            ville: 'Thionville',      latitude: 49.3585,  longitude: 6.1680,  rating: 4.1 },

  // ── Nantes & Pays de la Loire ──
  { id: 'm080', name: 'Grande Mosquée de Nantes',         ville: 'Nantes',          latitude: 47.2184,  longitude: -1.5536, rating: 4.6 },
  { id: 'm081', name: 'Mosquée Assalam',                  ville: 'Nantes',          latitude: 47.2100,  longitude: -1.5400, rating: 4.3 },
  { id: 'm082', name: 'Mosquée de Saint-Nazaire',         ville: 'Saint-Nazaire',   latitude: 47.2737,  longitude: -2.2136, rating: 4.1 },
  { id: 'm083', name: 'Mosquée du Mans',                  ville: 'Le Mans',         latitude: 48.0061,  longitude: 0.1996,  rating: 4.2 },
  { id: 'm084', name: 'Mosquée d\'Angers',                ville: 'Angers',          latitude: 47.4784,  longitude: -0.5632, rating: 4.2 },

  // ── Rennes & Bretagne ──
  { id: 'm090', name: 'Mosquée de Rennes',                ville: 'Rennes',          latitude: 48.1147,  longitude: -1.6794, rating: 4.3 },
  { id: 'm091', name: 'Mosquée de Brest',                 ville: 'Brest',           latitude: 48.3904,  longitude: -4.4861, rating: 4.1 },
  { id: 'm092', name: 'Mosquée de Lorient',               ville: 'Lorient',         latitude: 47.7486,  longitude: -3.3673, rating: 4.0 },

  // ── Rouen & Normandie ──
  { id: 'm100', name: 'Grande Mosquée de Rouen',          ville: 'Rouen',           latitude: 49.4431,  longitude: 1.0993,  rating: 4.5 },
  { id: 'm101', name: 'Mosquée de Caen',                  ville: 'Caen',            latitude: 49.1829,  longitude: -0.3707, rating: 4.2 },
  { id: 'm102', name: 'Mosquée du Havre',                 ville: 'Le Havre',        latitude: 49.4944,  longitude: 0.1079,  rating: 4.3 },
  { id: 'm103', name: 'Mosquée d\'Évreux',                ville: 'Évreux',          latitude: 49.0258,  longitude: 1.1507,  rating: 4.1 },

  // ── Montpellier ── (déjà dans Occitanie)

  // ── Clermont-Ferrand & Auvergne ──
  { id: 'm110', name: 'Mosquée de Clermont-Ferrand',      ville: 'Clermont-Ferrand', latitude: 45.7772, longitude: 3.0870,  rating: 4.2 },
  { id: 'm111', name: 'Mosquée Bilal',                    ville: 'Clermont-Ferrand', latitude: 45.7860, longitude: 3.1010,  rating: 4.1 },

  // ── Dijon & Bourgogne ──
  { id: 'm120', name: 'Mosquée de Dijon',                 ville: 'Dijon',           latitude: 47.3220,  longitude: 5.0415,  rating: 4.2 },
  { id: 'm121', name: 'Mosquée Attawba',                  ville: 'Dijon',           latitude: 47.3120,  longitude: 5.0530,  rating: 4.1 },

  // ── Tours & Centre-Val de Loire ──
  { id: 'm130', name: 'Mosquée de Tours',                 ville: 'Tours',           latitude: 47.3941,  longitude: 0.6848,  rating: 4.2 },
  { id: 'm131', name: 'Mosquée d\'Orléans',               ville: 'Orléans',         latitude: 47.9029,  longitude: 1.9039,  rating: 4.3 },
  { id: 'm132', name: 'Grande Mosquée d\'Orléans',        ville: 'Orléans',         latitude: 47.9100,  longitude: 1.9100,  rating: 4.5 },

  // ── La Réunion ──
  { id: 'm140', name: 'Mosquée Noor-e-Islam',             ville: 'Saint-Denis (Réunion)', latitude: -20.8789, longitude: 55.4481, rating: 4.5 },
  { id: 'm141', name: 'Mosquée Anoorul Islam',            ville: 'Saint-Paul (Réunion)',  latitude: -21.0046, longitude: 55.2733, rating: 4.3 },

  // ── Martinique ──
  { id: 'm150', name: 'Mosquée de Fort-de-France',        ville: 'Fort-de-France',  latitude: 14.6037,  longitude: -61.0686, rating: 4.2 },

  // ── Guyane ──
  { id: 'm160', name: 'Mosquée de Cayenne',               ville: 'Cayenne',         latitude: 4.9372,   longitude: -52.3260, rating: 4.1 },
];

const INSPIRATIONS = [
  { id: '1', arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',          french: 'Car avec la difficulté vient la facilité.', source: 'Sourate Al-Inshirah · 94:6', type: 'verset' },
  { id: '2', arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', french: 'Louange à Allah, Seigneur des mondes.',      source: 'Sourate Al-Fatiha · 1:2',    type: 'verset' },
  { id: '3', arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ',          french: 'Gloire à Allah et louange Lui soit rendue.', source: 'Invocation du matin',        type: 'dhikr'  },
  { id: '4', arabic: 'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ',     french: 'Ma réussite ne vient que d\'Allah.',         source: 'Sourate Hud · 11:88',        type: 'verset' },
  { id: '5', arabic: 'رَبِّ زِدْنِي عِلْمًا',                 french: 'Seigneur, accroît ma science.',              source: 'Sourate Ta-Ha · 20:114',     type: 'dhikr'  },
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
    ville:     place.vicinity || 'Lieu de culte',
    latitude:  place.geometry?.location?.lat ?? 0,
    longitude: place.geometry?.location?.lng ?? 0,
    rating:    place.rating   ?? null,
    source:    'api',
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
    { screen: 'mosquees',    emoji: '🕌', title: 'Mosquées',    desc: `${TOUTES_MOSQUEES.length} mosquées\nen France`,      accent: DS.green,  bg: DS.greenLt },
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

  const [mode, setMode]             = useState('nearby');
  const [mosques, setMosques]       = useState([]);
  const [userPos, setUserPos]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [statusMsg, setStatusMsg]   = useState('Géolocalisation en cours…');
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch]         = useState('');

  // ── Recherche Google Places (mode À proximité) ───────────────────────────
  const fetchNearby = async (lat, lon) => {
    setLoading(true);
    setStatusMsg('Recherche des mosquées à proximité…');

    const BASE  = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const FIRST = `${BASE}?location=${lat},${lon}&radius=5000&type=mosque&keyword=${encodeURIComponent('mosquée')}&key=${GOOGLE_API_KEY}`;

    try {
      let allResults = [];
      let nextUrl    = FIRST;

      // Pagination : l'API Places retourne max 20 résultats par page, 3 pages max (60 total)
      for (let page = 0; page < 3; page++) {
        const res  = await fetch(nextUrl);
        const json = await res.json();

        if ((json.status === 'OK' || json.status === 'ZERO_RESULTS') && Array.isArray(json.results)) {
          allResults = [...allResults, ...json.results];
        }

        // next_page_token disponible → attendre 2 s (délai imposé par Google) puis continuer
        if (json.next_page_token) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          nextUrl = `${BASE}?pagetoken=${json.next_page_token}&key=${GOOGLE_API_KEY}`;
        } else {
          break;
        }
      }

      if (allResults.length > 0) {
        // Déduplique par place_id et trie par distance
        const seen = new Set();
        const unique = allResults.filter(p => {
          if (seen.has(p.place_id)) return false;
          seen.add(p.place_id);
          return true;
        });
        const formatted = unique
          .map(formatPlaceResult)
          .map(m => ({ ...m, km: haversineKm(lat, lon, m.latitude, m.longitude) }))
          .sort((a, b) => a.km - b.km);
        setMosques(formatted);
        setStatusMsg(`✅ ${formatted.length} mosquées trouvées dans un rayon de 5 km`);
      } else {
        // Fallback : liste France triée par distance
        const sorted = [...TOUTES_MOSQUEES]
          .map(m => ({ ...m, km: haversineKm(lat, lon, m.latitude, m.longitude) }))
          .sort((a, b) => a.km - b.km)
          .slice(0, 25);
        setMosques(sorted);
        setStatusMsg(`📍 ${sorted.length} mosquées les plus proches (base locale)`);
      }
    } catch {
      const sorted = [...TOUTES_MOSQUEES]
        .map(m => ({ ...m, km: haversineKm(lat, lon, m.latitude, m.longitude) }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 25);
      setMosques(sorted);
      setStatusMsg('Mode hors-ligne — mosquées les plus proches');
    } finally {
      setLoading(false);
    }
  };

  // ── Géolocalisation + fetch (appelé automatiquement au montage) ──────────
  const doGeolocate = async () => {
    setMode('nearby');
    setLoading(true);
    setStatusMsg('Géolocalisation en cours…');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setStatusMsg('Permission GPS refusée → Paris par défaut');
      await fetchNearby(48.8566, 2.3522);
      return;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserPos(pos);
      mapRef.current?.animateToRegion({ ...pos, latitudeDelta: 0.12, longitudeDelta: 0.12 }, 800);
      await fetchNearby(pos.latitude, pos.longitude);
    } catch {
      setStatusMsg('Erreur GPS → Paris par défaut');
      await fetchNearby(48.8566, 2.3522);
    }
  };

  // Géolocalisation automatique à l'ouverture
  useEffect(() => { doGeolocate(); }, []);

  const switchToNearby = () => doGeolocate();

  // ── Revenir en mode France entière ───────────────────────────────────────
  const switchToFrance = () => {
    setMode('france');
    setMosques(TOUTES_MOSQUEES);
    setSearch('');
    setStatusMsg('');
    mapRef.current?.animateToRegion(
      { latitude: 46.6034, longitude: 2.3488, latitudeDelta: 12, longitudeDelta: 12 },
      800
    );
  };

  // ── Filtrer par recherche ─────────────────────────────────────────────────
  // Si l'utilisateur tape, on cherche dans TOUTE la base France
  const baseList = search.length >= 2 ? TOUTES_MOSQUEES : (mosques || []);
  const displayed = baseList.filter(m =>
    search.length < 2 ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.ville || '').toLowerCase().includes(search.toLowerCase())
  );

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
    if (!userPos) return { dist: null, mins: null, mode: '' };
    const km             = haversineKm(userPos.latitude, userPos.longitude, mosque.latitude, mosque.longitude);
    const { mins, mode } = estimatedTime(km);
    return { dist: formatDist(km), mins, mode };
  };

  return (
    <View style={{ flex: 1, backgroundColor: DS.cream }}>
      <StatusBar barStyle="dark-content" />

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{ latitude: 46.6034, longitude: 2.3488, latitudeDelta: 12, longitudeDelta: 12 }}
        showsUserLocation
      >
        {(displayed || []).map((m) => {
          const isActive = selectedId === m.id;
          const { dist, mins, mode: tMode } = getInfo(m);
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
                  <Text style={mS.calloutSub}>{m.ville || m.subtitle || ''}</Text>

                  {dist ? (
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
                        <Text style={mS.calloutInfoLabel}>{tMode}</Text>
                      </View>
                    </View>
                  ) : null}

                  {m.rating ? (
                    <Text style={mS.calloutRating}>{'⭐'.repeat(Math.round(m.rating))}  {m.rating}/5</Text>
                  ) : null}

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
            🕌  {displayed.length} mosquée{displayed.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Barre de recherche */}
      <View style={mS.searchBar}>
        <Text style={mS.searchIcon}>🔍</Text>
        <TextInput
          style={mS.searchInput}
          placeholder="Rechercher une ville ou mosquée…"
          placeholderTextColor={DS.textMd}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Text style={mS.searchClear}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Switcher mode */}
      <View style={mS.modeSwitch}>
        <Pressable
          style={[mS.modeBtn, mode === 'france' && mS.modeBtnActive]}
          onPress={switchToFrance}
        >
          <Text style={[mS.modeBtnText, mode === 'france' && mS.modeBtnTextActive]}>🇫🇷 Toute la France</Text>
        </Pressable>
        <Pressable
          style={[mS.modeBtn, mode === 'nearby' && mS.modeBtnActive]}
          onPress={switchToNearby}
        >
          <Text style={[mS.modeBtnText, mode === 'nearby' && mS.modeBtnTextActive]}>📍 À proximité</Text>
        </Pressable>
      </View>

      {/* Status */}
      {!loading && statusMsg ? (
        <View style={mS.statusBar}>
          <Text style={mS.statusText}>{statusMsg}</Text>
        </View>
      ) : null}

      {/* Liste horizontale */}
      <View style={mS.bottomSheet}>
        <View style={mS.handle} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={mS.listScroll}>
          {(displayed || []).map((m) => {
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
                <Text style={mS.listVille} numberOfLines={1}>{m.ville || m.subtitle || ''}</Text>
                {dist ? <Text style={mS.listDist}>📍 {dist}  ·  ⏱ {mins} min</Text> : null}
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
  marker:             { width: 44, height: 44, borderRadius: 22, backgroundColor: DS.green, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: DS.white, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 6 },
  markerActive:       { backgroundColor: DS.gold, transform: [{ scale: 1.2 }] },
  markerEmoji:        { fontSize: 22 },
  callout:            { backgroundColor: DS.white, borderRadius: 20, padding: 16, width: 240, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10 },
  calloutName:        { fontWeight: '800', fontSize: 15, color: DS.text, marginBottom: 2 },
  calloutSub:         { fontSize: 12, color: DS.textMd, marginBottom: 10 },
  calloutInfoRow:     { flexDirection: 'row', backgroundColor: DS.greenLt, borderRadius: 14, padding: 12, marginBottom: 10 },
  calloutInfoBox:     { flex: 1, alignItems: 'center', gap: 2 },
  calloutInfoDivider: { width: 1, backgroundColor: '#C8E6C9' },
  calloutInfoIcon:    { fontSize: 16 },
  calloutInfoValue:   { fontSize: 15, fontWeight: '800', color: DS.green },
  calloutInfoLabel:   { fontSize: 10, color: DS.textMd, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  calloutRating:      { fontSize: 12, color: DS.gold, marginBottom: 10, textAlign: 'center' },
  calloutBtn:         { backgroundColor: DS.green, borderRadius: 14, paddingVertical: 13, alignItems: 'center', width: '100%' },
  calloutBtnText:     { color: DS.white, fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  loaderOverlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,250,241,0.92)', alignItems: 'center', justifyContent: 'center', gap: 14 },
  loaderText:         { color: DS.green, fontWeight: '600', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  headerOverlay:      { position: 'absolute', top: Platform.OS === 'ios' ? 56 : 36, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:            { width: 42, height: 42, borderRadius: 21, backgroundColor: DS.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 5 },
  backBtnText:        { fontSize: 18, color: DS.green, fontWeight: '700' },
  headerPill:         { flex: 1, backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4 },
  headerPillText:     { fontSize: 13, fontWeight: '700', color: DS.green },
  searchBar:          { position: 'absolute', top: Platform.OS === 'ios' ? 110 : 90, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: DS.white, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 5 },
  searchIcon:         { fontSize: 16, marginRight: 8 },
  searchInput:        { flex: 1, fontSize: 14, color: DS.text },
  searchClear:        { fontSize: 14, color: DS.textMd, paddingLeft: 8 },
  modeSwitch:         { position: 'absolute', top: Platform.OS === 'ios' ? 162 : 142, left: 16, right: 16, flexDirection: 'row', gap: 8 },
  modeBtn:            { flex: 1, backgroundColor: 'rgba(255,255,255,0.90)', borderRadius: 16, paddingVertical: 9, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  modeBtnActive:      { backgroundColor: DS.green },
  modeBtnText:        { fontSize: 12, fontWeight: '700', color: DS.textMd },
  modeBtnTextActive:  { color: DS.white },
  statusBar:          { position: 'absolute', top: Platform.OS === 'ios' ? 210 : 190, left: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7 },
  statusText:         { fontSize: 11, color: DS.textMd, textAlign: 'center' },
  bottomSheet:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: DS.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 16 },
  handle:             { width: 40, height: 4, backgroundColor: '#D0D0D0', borderRadius: 99, alignSelf: 'center', marginBottom: 16 },
  listScroll:         { paddingHorizontal: 16, gap: 12 },
  listCard:           { backgroundColor: DS.white, borderRadius: 20, padding: 14, width: 168, gap: 4 },
  listCardActive:     { borderWidth: 2, borderColor: DS.green },
  listEmoji:          { fontSize: 26 },
  listName:           { fontSize: 13, fontWeight: '700', color: DS.text, lineHeight: 18 },
  listVille:          { fontSize: 11, color: DS.textMd, fontWeight: '600' },
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
