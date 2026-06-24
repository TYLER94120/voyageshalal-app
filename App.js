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

  // ══════════════════════════════════════════════════════════════
  // ÎLE-DE-FRANCE — 75 / 77 / 78 / 91 / 92 / 93 / 94 / 95
  // ══════════════════════════════════════════════════════════════

  // ── 75 · Paris ──
  { id: 'p75a', name: 'Grande Mosquée de Paris',             ville: 'Paris 5e',            latitude: 48.8427,  longitude: 2.3536,   rating: 4.8 },
  { id: 'p75b', name: 'Mosquée Al-Fath',                     ville: 'Paris 18e',           latitude: 48.8984,  longitude: 2.3487,   rating: 4.6 },
  { id: 'p75c', name: 'Mosquée Omar',                        ville: 'Paris 11e',           latitude: 48.8647,  longitude: 2.3732,   rating: 4.5 },
  { id: 'p75d', name: "Mosquée Adda'wa",                     ville: 'Paris 19e',           latitude: 48.8820,  longitude: 2.3760,   rating: 4.4 },
  { id: 'p75e', name: 'Mosquée Bilal',                       ville: 'Paris 20e',           latitude: 48.8620,  longitude: 2.3980,   rating: 4.2 },
  { id: 'p75f', name: 'Mosquée Al-Rawda',                    ville: 'Paris 13e',           latitude: 48.8280,  longitude: 2.3610,   rating: 4.3 },
  { id: 'p75g', name: 'Mosquée Al-Taqwa',                    ville: 'Paris 10e',           latitude: 48.8750,  longitude: 2.3600,   rating: 4.2 },
  { id: 'p75h', name: 'Mosquée de la Folie-Méricourt',       ville: 'Paris 11e',           latitude: 48.8640,  longitude: 2.3680,   rating: 4.1 },

  // ── 92 · Hauts-de-Seine ──
  { id: 'p92a', name: 'Mosquée de Clichy',                   ville: 'Clichy',              latitude: 48.9048,  longitude: 2.3042,   rating: 4.3 },
  { id: 'p92b', name: 'Mosquée de Nanterre',                 ville: 'Nanterre',            latitude: 48.8960,  longitude: 2.1960,   rating: 4.2 },
  { id: 'p92c', name: 'Mosquée Bilal',                       ville: 'Asnières-sur-Seine',  latitude: 48.9160,  longitude: 2.2860,   rating: 4.2 },
  { id: 'p92d', name: 'Mosquée Al-Forqane',                  ville: 'Colombes',            latitude: 48.9230,  longitude: 2.2530,   rating: 4.3 },
  { id: 'p92e', name: 'Mosquée de Gennevilliers',            ville: 'Gennevilliers',       latitude: 48.9330,  longitude: 2.2950,   rating: 4.2 },
  { id: 'p92f', name: 'Mosquée Al-Hidaya',                   ville: 'Boulogne-Billancourt',latitude: 48.8340,  longitude: 2.2440,   rating: 4.3 },
  { id: 'p92g', name: 'Mosquée de Levallois-Perret',         ville: 'Levallois-Perret',    latitude: 48.8950,  longitude: 2.2870,   rating: 4.1 },
  { id: 'p92h', name: 'Mosquée Al-Nour',                     ville: 'Sartrouville',        latitude: 48.9380,  longitude: 2.1860,   rating: 4.1 },

  // ── 93 · Seine-Saint-Denis ──
  { id: 'p93a', name: 'Mosquée de Saint-Denis',              ville: 'Saint-Denis',         latitude: 48.9356,  longitude: 2.3534,   rating: 4.5 },
  { id: 'p93b', name: 'Mosquée Attawbah',                    ville: 'Aubervilliers',       latitude: 48.9140,  longitude: 2.3820,   rating: 4.4 },
  { id: 'p93c', name: 'Mosquée Al-Fath',                     ville: 'La Courneuve',        latitude: 48.9300,  longitude: 2.3960,   rating: 4.3 },
  { id: 'p93d', name: 'Mosquée Al-Mouhajirines',             ville: 'Stains',              latitude: 48.9500,  longitude: 2.3740,   rating: 4.1 },
  { id: 'p93e', name: 'Mosquée Bilal',                       ville: 'Épinay-sur-Seine',    latitude: 48.9540,  longitude: 2.3140,   rating: 4.2 },
  { id: 'p93f', name: 'Mosquée de Bobigny',                  ville: 'Bobigny',             latitude: 48.9100,  longitude: 2.4400,   rating: 4.3 },
  { id: 'p93g', name: 'Mosquée As-Salam',                    ville: 'Drancy',              latitude: 48.9220,  longitude: 2.4470,   rating: 4.2 },
  { id: 'p93h', name: 'Mosquée Al-Rahman',                   ville: 'Pantin',              latitude: 48.8980,  longitude: 2.4090,   rating: 4.3 },
  { id: 'p93i', name: 'Mosquée Al-Nour',                     ville: 'Aulnay-sous-Bois',    latitude: 48.9390,  longitude: 2.4970,   rating: 4.3 },
  { id: 'p93j', name: 'Mosquée Bilal',                       ville: 'Bondy',               latitude: 48.9030,  longitude: 2.4830,   rating: 4.2 },
  { id: 'p93k', name: 'Mosquée Al-Rahma',                    ville: 'Sevran',              latitude: 48.9360,  longitude: 2.5270,   rating: 4.1 },
  { id: 'p93l', name: 'Mosquée de Villepinte',               ville: 'Villepinte',          latitude: 48.9630,  longitude: 2.5480,   rating: 4.1 },
  { id: 'p93m', name: 'Mosquée de Tremblay-en-France',       ville: 'Tremblay-en-France',  latitude: 48.9670,  longitude: 2.5670,   rating: 4.0 },
  { id: 'p93n', name: 'Mosquée Al-Ihsan',                    ville: 'Clichy-sous-Bois',    latitude: 48.9100,  longitude: 2.5540,   rating: 4.2 },
  { id: 'p93o', name: 'Mosquée As-Salam',                    ville: 'Montfermeil',         latitude: 48.8990,  longitude: 2.5760,   rating: 4.1 },
  { id: 'p93p', name: 'Mosquée de Montreuil',                ville: 'Montreuil',           latitude: 48.8640,  longitude: 2.4430,   rating: 4.4 },

  // ── 94 · Val-de-Marne ──
  { id: 'p94a', name: 'Mosquée Al-Rahma',                    ville: 'Créteil',             latitude: 48.7901,  longitude: 2.4572,   rating: 4.4 },
  { id: 'p94b', name: 'Mosquée Al-Ihsan',                    ville: 'Vitry-sur-Seine',     latitude: 48.7870,  longitude: 2.3930,   rating: 4.1 },
  { id: 'p94c', name: 'Mosquée Al-Barakah',                  ville: 'Ivry-sur-Seine',      latitude: 48.8090,  longitude: 2.3830,   rating: 4.2 },
  { id: 'p94d', name: 'Mosquée de Choisy-le-Roi',            ville: 'Choisy-le-Roi',       latitude: 48.7640,  longitude: 2.4050,   rating: 4.1 },
  { id: 'p94e', name: 'Mosquée Al-Forqane',                  ville: 'Gagny',               latitude: 48.8830,  longitude: 2.5400,   rating: 4.0 },
  { id: 'p94f', name: 'Mosquée Al-Badr',                     ville: 'Rosny-sous-Bois',     latitude: 48.8720,  longitude: 2.4870,   rating: 4.1 },
  { id: 'p94g', name: 'Mosquée Al-Kauthar',                  ville: 'Noisy-le-Grand',      latitude: 48.8470,  longitude: 2.5570,   rating: 4.2 },

  // ── 77 · Seine-et-Marne ──
  { id: 'p77a', name: 'Mosquée Al-Rahma',                    ville: 'Meaux',               latitude: 48.9600,  longitude: 2.8890,   rating: 4.2 },
  { id: 'p77b', name: 'Mosquée de Melun',                    ville: 'Melun',               latitude: 48.5400,  longitude: 2.6550,   rating: 4.1 },
  { id: 'p77c', name: 'Mosquée de Chelles',                  ville: 'Chelles',             latitude: 48.8780,  longitude: 2.5930,   rating: 4.0 },

  // ── 78 · Yvelines ──
  { id: 'p78a', name: 'Mosquée de Versailles',               ville: 'Versailles',          latitude: 48.8060,  longitude: 2.1280,   rating: 4.4 },
  { id: 'p78b', name: 'Mosquée de Mantes-la-Jolie',          ville: 'Mantes-la-Jolie',     latitude: 48.9900,  longitude: 1.7170,   rating: 4.5 },
  { id: 'p78c', name: 'Mosquée de Poissy',                   ville: 'Poissy',              latitude: 48.9290,  longitude: 2.0460,   rating: 4.1 },
  { id: 'p78d', name: 'Mosquée Al-Ihsan',                    ville: 'Trappes',             latitude: 48.7740,  longitude: 1.9990,   rating: 4.3 },

  // ── 91 · Essonne ──
  { id: 'p91a', name: 'Grande Mosquée d\'Évry',              ville: 'Évry-Courcouronnes',  latitude: 48.6290,  longitude: 2.4400,   rating: 4.6 },
  { id: 'p91b', name: 'Mosquée de Corbeil-Essonnes',         ville: 'Corbeil-Essonnes',    latitude: 48.6100,  longitude: 2.4770,   rating: 4.2 },
  { id: 'p91c', name: 'Mosquée de Massy',                    ville: 'Massy',               latitude: 48.7270,  longitude: 2.2730,   rating: 4.2 },

  // ── 95 · Val-d'Oise ──
  { id: 'p95a', name: 'Mosquée Al-Badr',                     ville: 'Argenteuil',          latitude: 48.9470,  longitude: 2.2460,   rating: 4.2 },
  { id: 'p95b', name: 'Mosquée de Sarcelles',                ville: 'Sarcelles',           latitude: 49.0000,  longitude: 2.3800,   rating: 4.3 },
  { id: 'p95c', name: 'Mosquée Bilal',                       ville: 'Cergy',               latitude: 49.0360,  longitude: 2.0630,   rating: 4.2 },
  { id: 'p95d', name: 'Mosquée Al-Nour',                     ville: 'Pontoise',            latitude: 49.0490,  longitude: 2.1000,   rating: 4.0 },

  // ══════════════════════════════════════════════════════════════
  // AUVERGNE-RHÔNE-ALPES — 01/03/07/15/26/38/42/43/63/69/73/74
  // ══════════════════════════════════════════════════════════════

  // ── 69 · Rhône ──
  { id: 'r69a', name: 'Grande Mosquée de Lyon',              ville: 'Lyon 8e',             latitude: 45.7330,  longitude: 4.8690,   rating: 4.7 },
  { id: 'r69b', name: 'Mosquée Al-Kauthar',                  ville: 'Lyon 3e',             latitude: 45.7520,  longitude: 4.8560,   rating: 4.4 },
  { id: 'r69c', name: 'Mosquée Othmane',                     ville: 'Vaulx-en-Velin',      latitude: 45.7760,  longitude: 4.9180,   rating: 4.3 },
  { id: 'r69d', name: 'Mosquée de Vénissieux',               ville: 'Vénissieux',          latitude: 45.6970,  longitude: 4.8850,   rating: 4.2 },
  { id: 'r69e', name: 'Mosquée de Villeurbanne',             ville: 'Villeurbanne',        latitude: 45.7660,  longitude: 4.8800,   rating: 4.3 },
  { id: 'r69f', name: 'Mosquée Al-Badr',                     ville: 'Bron',                latitude: 45.7340,  longitude: 4.9190,   rating: 4.1 },

  // ── 42 · Loire ──
  { id: 'r42a', name: 'Mosquée de Saint-Étienne',            ville: 'Saint-Étienne',       latitude: 45.4347,  longitude: 4.3903,   rating: 4.2 },
  { id: 'r42b', name: 'Mosquée Al-Nour',                     ville: 'Roanne',              latitude: 46.0330,  longitude: 4.0640,   rating: 4.0 },

  // ── 38 · Isère ──
  { id: 'r38a', name: 'Grande Mosquée de Grenoble',          ville: 'Grenoble',            latitude: 45.1720,  longitude: 5.7380,   rating: 4.5 },
  { id: 'r38b', name: 'Mosquée Al-Forqane',                  ville: 'Grenoble',            latitude: 45.1885,  longitude: 5.7245,   rating: 4.3 },
  { id: 'r38c', name: 'Mosquée de Bourgoin-Jallieu',         ville: 'Bourgoin-Jallieu',    latitude: 45.5820,  longitude: 5.2770,   rating: 4.0 },

  // ── 74 · Haute-Savoie ──
  { id: 'r74a', name: 'Mosquée d\'Annecy',                   ville: 'Annecy',              latitude: 45.8992,  longitude: 6.1294,   rating: 4.3 },
  { id: 'r74b', name: 'Mosquée de Thonon-les-Bains',         ville: 'Thonon-les-Bains',    latitude: 46.3700,  longitude: 6.4760,   rating: 4.1 },

  // ── 73 · Savoie ──
  { id: 'r73a', name: 'Mosquée de Chambéry',                 ville: 'Chambéry',            latitude: 45.5646,  longitude: 5.9178,   rating: 4.2 },

  // ── 26 · Drôme ──
  { id: 'r26a', name: 'Mosquée de Valence',                  ville: 'Valence',             latitude: 44.9334,  longitude: 4.8924,   rating: 4.2 },
  { id: 'r26b', name: 'Mosquée de Romans-sur-Isère',         ville: 'Romans-sur-Isère',    latitude: 45.0460,  longitude: 5.0540,   rating: 4.0 },

  // ── 07 · Ardèche ──
  { id: 'r07a', name: 'Mosquée d\'Aubenas',                  ville: 'Aubenas',             latitude: 44.6238,  longitude: 4.3899,   rating: 3.9 },

  // ── 01 · Ain ──
  { id: 'r01a', name: 'Mosquée de Bourg-en-Bresse',          ville: 'Bourg-en-Bresse',     latitude: 46.2050,  longitude: 5.2290,   rating: 4.0 },

  // ── 63 · Puy-de-Dôme ──
  { id: 'r63a', name: 'Mosquée de Clermont-Ferrand',         ville: 'Clermont-Ferrand',    latitude: 45.7772,  longitude: 3.0870,   rating: 4.2 },
  { id: 'r63b', name: 'Mosquée Bilal',                       ville: 'Clermont-Ferrand',    latitude: 45.7860,  longitude: 3.1010,   rating: 4.1 },

  // ── 43 · Haute-Loire ──
  { id: 'r43a', name: 'Mosquée du Puy-en-Velay',             ville: 'Le Puy-en-Velay',     latitude: 45.0430,  longitude: 3.8830,   rating: 3.9 },

  // ── 03 · Allier ──
  { id: 'r03a', name: 'Mosquée de Moulins',                  ville: 'Moulins',             latitude: 46.5640,  longitude: 3.3320,   rating: 3.9 },
  { id: 'r03b', name: 'Mosquée de Vichy',                    ville: 'Vichy',               latitude: 46.1270,  longitude: 3.4260,   rating: 4.0 },

  // ── 15 · Cantal ──
  { id: 'r15a', name: 'Mosquée d\'Aurillac',                 ville: 'Aurillac',            latitude: 44.9290,  longitude: 2.4430,   rating: 3.8 },

  // ══════════════════════════════════════════════════════════════
  // PROVENCE-ALPES-CÔTE D'AZUR — 04/05/06/13/83/84
  // ══════════════════════════════════════════════════════════════

  // ── 13 · Bouches-du-Rhône ──
  { id: 'v13a', name: 'Grande Mosquée de Marseille',         ville: 'Marseille 13e',       latitude: 43.3600,  longitude: 5.4200,   rating: 4.6 },
  { id: 'v13b', name: 'Mosquée As-Salam',                    ville: 'Marseille 14e',       latitude: 43.3100,  longitude: 5.3900,   rating: 4.4 },
  { id: 'v13c', name: 'Mosquée Al-Aqsa',                     ville: 'Marseille 3e',        latitude: 43.3090,  longitude: 5.3820,   rating: 4.3 },
  { id: 'v13d', name: 'Mosquée de la Capelette',             ville: 'Marseille 10e',       latitude: 43.2870,  longitude: 5.4010,   rating: 4.2 },
  { id: 'v13e', name: 'Mosquée Al-Hidaya',                   ville: 'Aix-en-Provence',     latitude: 43.5297,  longitude: 5.4474,   rating: 4.3 },
  { id: 'v13f', name: 'Mosquée de Vitrolles',                ville: 'Vitrolles',           latitude: 43.4570,  longitude: 5.2440,   rating: 4.0 },
  { id: 'v13g', name: 'Mosquée d\'Arles',                    ville: 'Arles',               latitude: 43.6767,  longitude: 4.6278,   rating: 4.0 },

  // ── 06 · Alpes-Maritimes ──
  { id: 'v06a', name: 'Mosquée de Nice',                     ville: 'Nice',                latitude: 43.7102,  longitude: 7.2620,   rating: 4.4 },
  { id: 'v06b', name: 'Mosquée de Cannes',                   ville: 'Cannes',              latitude: 43.5528,  longitude: 7.0174,   rating: 4.2 },
  { id: 'v06c', name: 'Mosquée d\'Antibes',                  ville: 'Antibes',             latitude: 43.5804,  longitude: 7.1282,   rating: 4.1 },

  // ── 83 · Var ──
  { id: 'v83a', name: 'Mosquée de Toulon',                   ville: 'Toulon',              latitude: 43.1242,  longitude: 5.9280,   rating: 4.2 },
  { id: 'v83b', name: 'Mosquée de La Seyne-sur-Mer',         ville: 'La Seyne-sur-Mer',    latitude: 43.1040,  longitude: 5.8800,   rating: 4.0 },
  { id: 'v83c', name: 'Mosquée de Fréjus',                   ville: 'Fréjus',              latitude: 43.4330,  longitude: 6.7370,   rating: 4.1 },

  // ── 84 · Vaucluse ──
  { id: 'v84a', name: "Mosquée d'Avignon",                   ville: 'Avignon',             latitude: 43.9493,  longitude: 4.8055,   rating: 4.1 },
  { id: 'v84b', name: 'Mosquée de Carpentras',               ville: 'Carpentras',          latitude: 44.0560,  longitude: 5.0470,   rating: 3.9 },

  // ── 04 · Alpes-de-Haute-Provence ──
  { id: 'v04a', name: 'Mosquée de Manosque',                 ville: 'Manosque',            latitude: 43.8310,  longitude: 5.7870,   rating: 3.9 },

  // ── 05 · Hautes-Alpes ──
  { id: 'v05a', name: 'Mosquée de Gap',                      ville: 'Gap',                 latitude: 44.5590,  longitude: 6.0750,   rating: 3.9 },

  // ══════════════════════════════════════════════════════════════
  // OCCITANIE — 09/11/12/30/31/32/34/46/48/65/66/81/82
  // ══════════════════════════════════════════════════════════════

  // ── 31 · Haute-Garonne ──
  { id: 'o31a', name: 'Grande Mosquée de Toulouse',          ville: 'Toulouse',            latitude: 43.6047,  longitude: 1.4442,   rating: 4.7 },
  { id: 'o31b', name: 'Mosquée Al-Baraka',                   ville: 'Toulouse',            latitude: 43.6200,  longitude: 1.4600,   rating: 4.4 },
  { id: 'o31c', name: 'Mosquée Assalam',                     ville: 'Toulouse',            latitude: 43.5900,  longitude: 1.4300,   rating: 4.3 },

  // ── 34 · Hérault ──
  { id: 'o34a', name: 'Grande Mosquée de Montpellier',       ville: 'Montpellier',         latitude: 43.6000,  longitude: 3.8900,   rating: 4.6 },
  { id: 'o34b', name: 'Mosquée de Montpellier',              ville: 'Montpellier',         latitude: 43.6119,  longitude: 3.8772,   rating: 4.4 },
  { id: 'o34c', name: 'Mosquée de Béziers',                  ville: 'Béziers',             latitude: 43.3442,  longitude: 3.2160,   rating: 4.1 },
  { id: 'o34d', name: 'Mosquée de Sète',                     ville: 'Sète',                latitude: 43.4060,  longitude: 3.6970,   rating: 4.0 },
  { id: 'o34e', name: 'Mosquée de Lunel',                    ville: 'Lunel',               latitude: 43.6740,  longitude: 4.1360,   rating: 4.0 },

  // ── 30 · Gard ──
  { id: 'o30a', name: 'Mosquée de Nîmes',                    ville: 'Nîmes',               latitude: 43.8367,  longitude: 4.3601,   rating: 4.2 },
  { id: 'o30b', name: 'Mosquée d\'Alès',                     ville: 'Alès',                latitude: 44.1234,  longitude: 4.0830,   rating: 4.0 },

  // ── 66 · Pyrénées-Orientales ──
  { id: 'o66a', name: 'Mosquée de Perpignan',                ville: 'Perpignan',           latitude: 42.6887,  longitude: 2.8948,   rating: 4.3 },
  { id: 'o66b', name: 'Mosquée Al-Hidaya',                   ville: 'Perpignan',           latitude: 42.7050,  longitude: 2.9000,   rating: 4.1 },

  // ── 11 · Aude ──
  { id: 'o11a', name: 'Mosquée de Carcassonne',              ville: 'Carcassonne',         latitude: 43.2130,  longitude: 2.3490,   rating: 4.0 },
  { id: 'o11b', name: 'Mosquée de Narbonne',                 ville: 'Narbonne',            latitude: 43.1850,  longitude: 3.0070,   rating: 4.0 },

  // ── 81 · Tarn ──
  { id: 'o81a', name: 'Mosquée d\'Albi',                     ville: 'Albi',                latitude: 43.9290,  longitude: 2.1480,   rating: 4.1 },
  { id: 'o81b', name: 'Mosquée de Castres',                  ville: 'Castres',             latitude: 43.6030,  longitude: 2.2370,   rating: 4.0 },

  // ── 82 · Tarn-et-Garonne ──
  { id: 'o82a', name: 'Mosquée de Montauban',                ville: 'Montauban',           latitude: 44.0175,  longitude: 1.3527,   rating: 4.1 },

  // ── 65 · Hautes-Pyrénées ──
  { id: 'o65a', name: 'Mosquée de Tarbes',                   ville: 'Tarbes',              latitude: 43.2328,  longitude: 0.0781,   rating: 4.0 },

  // ── 32 · Gers ──
  { id: 'o32a', name: 'Mosquée d\'Auch',                     ville: 'Auch',                latitude: 43.6460,  longitude: 0.5860,   rating: 3.9 },

  // ── 09 · Ariège ──
  { id: 'o09a', name: 'Mosquée de Pamiers',                  ville: 'Pamiers',             latitude: 43.1170,  longitude: 1.6110,   rating: 3.9 },

  // ── 12 · Aveyron ──
  { id: 'o12a', name: 'Mosquée de Rodez',                    ville: 'Rodez',               latitude: 44.3500,  longitude: 2.5750,   rating: 3.9 },

  // ── 46 · Lot ──
  { id: 'o46a', name: 'Mosquée de Cahors',                   ville: 'Cahors',              latitude: 44.4476,  longitude: 1.4400,   rating: 3.9 },

  // ── 48 · Lozère ──
  { id: 'o48a', name: 'Mosquée de Mende',                    ville: 'Mende',               latitude: 44.5200,  longitude: 3.4990,   rating: 3.8 },

  // ══════════════════════════════════════════════════════════════
  // NOUVELLE-AQUITAINE — 16/17/19/23/24/33/40/47/64/79/86/87
  // ══════════════════════════════════════════════════════════════

  // ── 33 · Gironde ──
  { id: 'a33a', name: 'Grande Mosquée de Bordeaux',          ville: 'Bordeaux',            latitude: 44.8400,  longitude: -0.5780,  rating: 4.6 },
  { id: 'a33b', name: 'Mosquée Al-Barakah',                  ville: 'Bordeaux',            latitude: 44.8560,  longitude: -0.5640,  rating: 4.3 },
  { id: 'a33c', name: 'Mosquée de Mérignac',                 ville: 'Mérignac',            latitude: 44.8340,  longitude: -0.6450,  rating: 4.2 },
  { id: 'a33d', name: 'Mosquée de Pessac',                   ville: 'Pessac',              latitude: 44.8060,  longitude: -0.6310,  rating: 4.1 },

  // ── 64 · Pyrénées-Atlantiques ──
  { id: 'a64a', name: 'Mosquée de Pau',                      ville: 'Pau',                 latitude: 43.2951,  longitude: -0.3708,  rating: 4.3 },
  { id: 'a64b', name: 'Mosquée de Bayonne',                  ville: 'Bayonne',             latitude: 43.4921,  longitude: -1.4752,  rating: 4.1 },

  // ── 87 · Haute-Vienne ──
  { id: 'a87a', name: 'Mosquée de Limoges',                  ville: 'Limoges',             latitude: 45.8336,  longitude: 1.2611,   rating: 4.2 },

  // ── 86 · Vienne ──
  { id: 'a86a', name: 'Mosquée de Poitiers',                 ville: 'Poitiers',            latitude: 46.5802,  longitude: 0.3404,   rating: 4.1 },
  { id: 'a86b', name: 'Mosquée de Châtellerault',            ville: 'Châtellerault',       latitude: 46.8177,  longitude: 0.5463,   rating: 4.0 },

  // ── 17 · Charente-Maritime ──
  { id: 'a17a', name: 'Mosquée de La Rochelle',              ville: 'La Rochelle',         latitude: 46.1591,  longitude: -1.1520,  rating: 4.2 },
  { id: 'a17b', name: 'Mosquée de Saintes',                  ville: 'Saintes',             latitude: 45.7460,  longitude: -0.6360,  rating: 4.0 },

  // ── 16 · Charente ──
  { id: 'a16a', name: "Mosquée d'Angoulême",                 ville: 'Angoulême',           latitude: 45.6499,  longitude: 0.1566,   rating: 4.0 },

  // ── 47 · Lot-et-Garonne ──
  { id: 'a47a', name: "Mosquée d'Agen",                      ville: 'Agen',                latitude: 44.2021,  longitude: 0.6203,   rating: 4.1 },

  // ── 40 · Landes ──
  { id: 'a40a', name: 'Mosquée de Mont-de-Marsan',           ville: 'Mont-de-Marsan',      latitude: 43.8924,  longitude: -0.4990,  rating: 4.0 },
  { id: 'a40b', name: 'Mosquée de Dax',                      ville: 'Dax',                 latitude: 43.7094,  longitude: -1.0518,  rating: 3.9 },

  // ── 24 · Dordogne ──
  { id: 'a24a', name: 'Mosquée de Périgueux',                ville: 'Périgueux',           latitude: 45.1844,  longitude: 0.7204,   rating: 4.0 },

  // ── 79 · Deux-Sèvres ──
  { id: 'a79a', name: 'Mosquée de Niort',                    ville: 'Niort',               latitude: 46.3232,  longitude: -0.4583,  rating: 4.0 },

  // ── 19 · Corrèze ──
  { id: 'a19a', name: 'Mosquée de Brive-la-Gaillarde',       ville: 'Brive-la-Gaillarde',  latitude: 45.1585,  longitude: 1.5316,   rating: 4.0 },

  // ── 23 · Creuse ──
  { id: 'a23a', name: 'Mosquée de Guéret',                   ville: 'Guéret',              latitude: 46.1672,  longitude: 1.8699,   rating: 3.8 },

  // ══════════════════════════════════════════════════════════════
  // HAUTS-DE-FRANCE — 02/59/60/62/80
  // ══════════════════════════════════════════════════════════════

  // ── 59 · Nord ──
  { id: 'h59a', name: 'Grande Mosquée de Lille',             ville: 'Lille',               latitude: 50.6292,  longitude: 3.0573,   rating: 4.6 },
  { id: 'h59b', name: 'Mosquée Al-Nour',                     ville: 'Roubaix',             latitude: 50.6934,  longitude: 3.1746,   rating: 4.4 },
  { id: 'h59c', name: 'Mosquée de Tourcoing',                ville: 'Tourcoing',           latitude: 50.7237,  longitude: 3.1582,   rating: 4.3 },
  { id: 'h59d', name: 'Mosquée de Valenciennes',             ville: 'Valenciennes',        latitude: 50.3580,  longitude: 3.5236,   rating: 4.2 },
  { id: 'h59e', name: 'Mosquée de Dunkerque',                ville: 'Dunkerque',           latitude: 51.0343,  longitude: 2.3770,   rating: 4.1 },
  { id: 'h59f', name: 'Mosquée Al-Rahma',                    ville: 'Villeneuve-d\'Ascq',  latitude: 50.6150,  longitude: 3.1400,   rating: 4.2 },
  { id: 'h59g', name: 'Mosquée de Maubeuge',                 ville: 'Maubeuge',            latitude: 50.2770,  longitude: 3.9730,   rating: 4.0 },

  // ── 62 · Pas-de-Calais ──
  { id: 'h62a', name: 'Mosquée de Lens',                     ville: 'Lens',                latitude: 50.4320,  longitude: 2.8310,   rating: 4.2 },
  { id: 'h62b', name: 'Mosquée de Douai',                    ville: 'Douai',               latitude: 50.3720,  longitude: 3.0800,   rating: 4.1 },
  { id: 'h62c', name: 'Mosquée de Calais',                   ville: 'Calais',              latitude: 50.9513,  longitude: 1.8587,   rating: 4.1 },
  { id: 'h62d', name: 'Mosquée de Boulogne-sur-Mer',         ville: 'Boulogne-sur-Mer',    latitude: 50.7263,  longitude: 1.6140,   rating: 4.0 },
  { id: 'h62e', name: "Mosquée d'Arras",                     ville: 'Arras',               latitude: 50.2927,  longitude: 2.7770,   rating: 4.1 },

  // ── 80 · Somme ──
  { id: 'h80a', name: "Mosquée d'Amiens",                    ville: 'Amiens',              latitude: 49.8942,  longitude: 2.2957,   rating: 4.2 },

  // ── 60 · Oise ──
  { id: 'h60a', name: 'Mosquée de Beauvais',                 ville: 'Beauvais',            latitude: 49.4304,  longitude: 2.0801,   rating: 4.1 },
  { id: 'h60b', name: 'Mosquée de Creil',                    ville: 'Creil',               latitude: 49.2560,  longitude: 2.4820,   rating: 4.0 },

  // ── 02 · Aisne ──
  { id: 'h02a', name: 'Mosquée de Laon',                     ville: 'Laon',                latitude: 49.5637,  longitude: 3.6244,   rating: 3.9 },
  { id: 'h02b', name: 'Mosquée de Saint-Quentin',            ville: 'Saint-Quentin',       latitude: 49.8490,  longitude: 3.2870,   rating: 4.0 },
  { id: 'h02c', name: 'Mosquée de Soissons',                 ville: 'Soissons',            latitude: 49.3820,  longitude: 3.3230,   rating: 4.0 },

  // ══════════════════════════════════════════════════════════════
  // GRAND EST — 08/10/51/52/54/55/57/67/68/88
  // ══════════════════════════════════════════════════════════════

  // ── 67 · Bas-Rhin ──
  { id: 'g67a', name: 'Grande Mosquée de Strasbourg',        ville: 'Strasbourg',          latitude: 48.5734,  longitude: 7.7521,   rating: 4.7 },
  { id: 'g67b', name: 'Mosquée Eyyub Sultan',                ville: 'Strasbourg',          latitude: 48.5900,  longitude: 7.7800,   rating: 4.4 },
  { id: 'g67c', name: 'Mosquée de Haguenau',                 ville: 'Haguenau',            latitude: 48.8156,  longitude: 7.7896,   rating: 4.1 },

  // ── 68 · Haut-Rhin ──
  { id: 'g68a', name: 'Mosquée de Mulhouse',                 ville: 'Mulhouse',            latitude: 47.7508,  longitude: 7.3359,   rating: 4.4 },
  { id: 'g68b', name: 'Mosquée de Colmar',                   ville: 'Colmar',              latitude: 48.0797,  longitude: 7.3586,   rating: 4.2 },

  // ── 57 · Moselle ──
  { id: 'g57a', name: 'Grande Mosquée de Metz',              ville: 'Metz',                latitude: 49.1193,  longitude: 6.1757,   rating: 4.5 },
  { id: 'g57b', name: 'Mosquée de Thionville',               ville: 'Thionville',          latitude: 49.3585,  longitude: 6.1680,   rating: 4.1 },
  { id: 'g57c', name: 'Mosquée de Forbach',                  ville: 'Forbach',             latitude: 49.1880,  longitude: 6.9000,   rating: 4.0 },

  // ── 54 · Meurthe-et-Moselle ──
  { id: 'g54a', name: 'Mosquée de Nancy',                    ville: 'Nancy',               latitude: 48.6921,  longitude: 6.1844,   rating: 4.3 },
  { id: 'g54b', name: 'Mosquée de Longwy',                   ville: 'Longwy',              latitude: 49.5210,  longitude: 5.7630,   rating: 4.0 },

  // ── 51 · Marne ──
  { id: 'g51a', name: 'Mosquée de Reims',                    ville: 'Reims',               latitude: 49.2583,  longitude: 4.0317,   rating: 4.2 },
  { id: 'g51b', name: 'Mosquée de Châlons-en-Champagne',     ville: 'Châlons-en-Champagne',latitude: 48.9574,  longitude: 4.3659,   rating: 4.0 },

  // ── 55 · Meuse ──
  { id: 'g55a', name: 'Mosquée de Bar-le-Duc',               ville: 'Bar-le-Duc',          latitude: 48.7730,  longitude: 5.1610,   rating: 3.9 },

  // ── 52 · Haute-Marne ──
  { id: 'g52a', name: 'Mosquée de Chaumont',                 ville: 'Chaumont',            latitude: 48.1122,  longitude: 5.1397,   rating: 3.9 },

  // ── 88 · Vosges ──
  { id: 'g88a', name: 'Mosquée d\'Épinal',                   ville: 'Épinal',              latitude: 48.1764,  longitude: 6.4508,   rating: 4.0 },

  // ── 08 · Ardennes ──
  { id: 'g08a', name: 'Mosquée de Charleville-Mézières',     ville: 'Charleville-Mézières',latitude: 49.7708,  longitude: 4.7163,   rating: 4.0 },

  // ── 10 · Aube ──
  { id: 'g10a', name: 'Mosquée de Troyes',                   ville: 'Troyes',              latitude: 48.2973,  longitude: 4.0744,   rating: 4.1 },

  // ══════════════════════════════════════════════════════════════
  // PAYS DE LA LOIRE — 44/49/53/72/85
  // ══════════════════════════════════════════════════════════════

  // ── 44 · Loire-Atlantique ──
  { id: 'l44a', name: 'Grande Mosquée de Nantes',            ville: 'Nantes',              latitude: 47.2184,  longitude: -1.5536,  rating: 4.6 },
  { id: 'l44b', name: 'Mosquée Assalam',                     ville: 'Nantes',              latitude: 47.2100,  longitude: -1.5400,  rating: 4.3 },
  { id: 'l44c', name: 'Mosquée de Saint-Nazaire',            ville: 'Saint-Nazaire',       latitude: 47.2737,  longitude: -2.2136,  rating: 4.1 },

  // ── 49 · Maine-et-Loire ──
  { id: 'l49a', name: "Mosquée d'Angers",                    ville: 'Angers',              latitude: 47.4784,  longitude: -0.5632,  rating: 4.2 },
  { id: 'l49b', name: 'Mosquée de Cholet',                   ville: 'Cholet',              latitude: 47.0600,  longitude: -0.8770,  rating: 4.0 },

  // ── 72 · Sarthe ──
  { id: 'l72a', name: 'Mosquée du Mans',                     ville: 'Le Mans',             latitude: 48.0061,  longitude: 0.1996,   rating: 4.2 },

  // ── 85 · Vendée ──
  { id: 'l85a', name: 'Mosquée de La Roche-sur-Yon',         ville: 'La Roche-sur-Yon',    latitude: 46.6700,  longitude: -1.4280,  rating: 4.0 },

  // ── 53 · Mayenne ──
  { id: 'l53a', name: 'Mosquée de Laval',                    ville: 'Laval',               latitude: 48.0730,  longitude: -0.7688,  rating: 4.0 },

  // ══════════════════════════════════════════════════════════════
  // BRETAGNE — 22/29/35/56
  // ══════════════════════════════════════════════════════════════

  { id: 'b35a', name: 'Mosquée de Rennes',                   ville: 'Rennes',              latitude: 48.1147,  longitude: -1.6794,  rating: 4.3 },
  { id: 'b29a', name: 'Mosquée de Brest',                    ville: 'Brest',               latitude: 48.3904,  longitude: -4.4861,  rating: 4.1 },
  { id: 'b29b', name: 'Mosquée de Quimper',                  ville: 'Quimper',             latitude: 47.9973,  longitude: -4.0975,  rating: 4.0 },
  { id: 'b56a', name: 'Mosquée de Lorient',                  ville: 'Lorient',             latitude: 47.7486,  longitude: -3.3673,  rating: 4.0 },
  { id: 'b56b', name: 'Mosquée de Vannes',                   ville: 'Vannes',              latitude: 47.6573,  longitude: -2.7598,  rating: 4.0 },
  { id: 'b22a', name: 'Mosquée de Saint-Brieuc',             ville: 'Saint-Brieuc',        latitude: 48.5140,  longitude: -2.7630,  rating: 3.9 },

  // ══════════════════════════════════════════════════════════════
  // NORMANDIE — 14/27/50/61/76
  // ══════════════════════════════════════════════════════════════

  { id: 'n76a', name: 'Grande Mosquée de Rouen',             ville: 'Rouen',               latitude: 49.4431,  longitude: 1.0993,   rating: 4.5 },
  { id: 'n76b', name: 'Mosquée du Havre',                    ville: 'Le Havre',            latitude: 49.4944,  longitude: 0.1079,   rating: 4.3 },
  { id: 'n76c', name: 'Mosquée de Dieppe',                   ville: 'Dieppe',              latitude: 49.9210,  longitude: 1.0800,   rating: 4.0 },
  { id: 'n14a', name: 'Mosquée de Caen',                     ville: 'Caen',                latitude: 49.1829,  longitude: -0.3707,  rating: 4.2 },
  { id: 'n27a', name: "Mosquée d'Évreux",                    ville: 'Évreux',              latitude: 49.0258,  longitude: 1.1507,   rating: 4.1 },
  { id: 'n27b', name: 'Mosquée de Vernon',                   ville: 'Vernon',              latitude: 49.0950,  longitude: 1.4840,   rating: 4.0 },
  { id: 'n50a', name: 'Mosquée de Cherbourg',                ville: 'Cherbourg-en-Cotentin',latitude: 49.6380, longitude: -1.6200,  rating: 4.0 },
  { id: 'n61a', name: "Mosquée d'Alençon",                   ville: 'Alençon',             latitude: 48.4296,  longitude: 0.0919,   rating: 4.0 },

  // ══════════════════════════════════════════════════════════════
  // CENTRE-VAL DE LOIRE — 18/28/36/37/41/45
  // ══════════════════════════════════════════════════════════════

  { id: 'c45a', name: "Grande Mosquée d'Orléans",            ville: 'Orléans',             latitude: 47.9100,  longitude: 1.9100,   rating: 4.5 },
  { id: 'c45b', name: "Mosquée d'Orléans",                   ville: 'Orléans',             latitude: 47.9029,  longitude: 1.9039,   rating: 4.3 },
  { id: 'c37a', name: 'Mosquée de Tours',                    ville: 'Tours',               latitude: 47.3941,  longitude: 0.6848,   rating: 4.2 },
  { id: 'c18a', name: 'Mosquée de Bourges',                  ville: 'Bourges',             latitude: 47.0810,  longitude: 2.3980,   rating: 4.1 },
  { id: 'c28a', name: 'Mosquée de Chartres',                 ville: 'Chartres',            latitude: 48.4469,  longitude: 1.4888,   rating: 4.1 },
  { id: 'c28b', name: "Mosquée de Dreux",                    ville: 'Dreux',               latitude: 48.7360,  longitude: 1.3650,   rating: 4.0 },
  { id: 'c41a', name: 'Mosquée de Blois',                    ville: 'Blois',               latitude: 47.5936,  longitude: 1.3330,   rating: 4.0 },
  { id: 'c36a', name: 'Mosquée de Châteauroux',              ville: 'Châteauroux',         latitude: 46.8138,  longitude: 1.6902,   rating: 3.9 },

  // ══════════════════════════════════════════════════════════════
  // BOURGOGNE-FRANCHE-COMTÉ — 21/25/39/58/70/71/89/90
  // ══════════════════════════════════════════════════════════════

  { id: 'f21a', name: 'Mosquée de Dijon',                    ville: 'Dijon',               latitude: 47.3220,  longitude: 5.0415,   rating: 4.2 },
  { id: 'f21b', name: 'Mosquée Attawba',                     ville: 'Dijon',               latitude: 47.3120,  longitude: 5.0530,   rating: 4.1 },
  { id: 'f25a', name: 'Mosquée de Besançon',                 ville: 'Besançon',            latitude: 47.2378,  longitude: 6.0241,   rating: 4.2 },
  { id: 'f25b', name: 'Mosquée de Montbéliard',              ville: 'Montbéliard',         latitude: 47.5100,  longitude: 6.7980,   rating: 4.1 },
  { id: 'f90a', name: 'Mosquée de Belfort',                  ville: 'Belfort',             latitude: 47.6394,  longitude: 6.8638,   rating: 4.1 },
  { id: 'f71a', name: 'Mosquée de Mâcon',                    ville: 'Mâcon',               latitude: 46.3060,  longitude: 4.8310,   rating: 4.0 },
  { id: 'f71b', name: 'Mosquée du Creusot',                  ville: 'Le Creusot',          latitude: 46.8020,  longitude: 4.4310,   rating: 3.9 },
  { id: 'f89a', name: "Mosquée d'Auxerre",                   ville: 'Auxerre',             latitude: 47.7981,  longitude: 3.5674,   rating: 4.0 },
  { id: 'f58a', name: 'Mosquée de Nevers',                   ville: 'Nevers',              latitude: 46.9892,  longitude: 3.1572,   rating: 3.9 },
  { id: 'f39a', name: 'Mosquée de Lons-le-Saunier',          ville: 'Lons-le-Saunier',     latitude: 46.6744,  longitude: 5.5547,   rating: 3.9 },
  { id: 'f70a', name: 'Mosquée de Vesoul',                   ville: 'Vesoul',              latitude: 47.6210,  longitude: 6.1540,   rating: 3.9 },

  // ══════════════════════════════════════════════════════════════
  // CORSE — 2A / 2B
  // ══════════════════════════════════════════════════════════════

  { id: 'c2aa', name: "Mosquée d'Ajaccio",                   ville: 'Ajaccio',             latitude: 41.9192,  longitude: 8.7386,   rating: 4.1 },
  { id: 'c2ba', name: 'Mosquée de Bastia',                   ville: 'Bastia',              latitude: 42.7050,  longitude: 9.4500,   rating: 4.0 },

  // ══════════════════════════════════════════════════════════════
  // DOM-TOM
  // ══════════════════════════════════════════════════════════════

  // ── 974 · La Réunion ──
  { id: 'd974a', name: 'Mosquée Noor-e-Islam',               ville: 'Saint-Denis (Réunion)',  latitude: -20.8789, longitude: 55.4481,  rating: 4.5 },
  { id: 'd974b', name: 'Mosquée Anoorul Islam',              ville: 'Saint-Paul (Réunion)',   latitude: -21.0046, longitude: 55.2733,  rating: 4.3 },
  { id: 'd974c', name: 'Mosquée de Saint-Pierre',            ville: 'Saint-Pierre (Réunion)',  latitude: -21.3390, longitude: 55.4760,  rating: 4.2 },

  // ── 972 · Martinique ──
  { id: 'd972a', name: 'Mosquée de Fort-de-France',          ville: 'Fort-de-France',         latitude: 14.6037,  longitude: -61.0686, rating: 4.2 },
  { id: 'd972b', name: 'Mosquée de Schoelcher',              ville: 'Schoelcher',             latitude: 14.6233,  longitude: -61.1030, rating: 4.0 },

  // ── 973 · Guyane ──
  { id: 'd973a', name: 'Mosquée de Cayenne',                 ville: 'Cayenne',               latitude: 4.9372,   longitude: -52.3260, rating: 4.1 },
  { id: 'd973b', name: 'Mosquée de Saint-Laurent-du-Maroni', ville: 'Saint-Laurent-du-Maroni',latitude: 5.5000,   longitude: -54.0330, rating: 4.0 },

  // ── 971 · Guadeloupe ──
  { id: 'd971a', name: 'Mosquée de Pointe-à-Pitre',          ville: 'Pointe-à-Pitre',         latitude: 16.2413,  longitude: -61.5327, rating: 4.1 },
  { id: 'd971b', name: 'Mosquée de Baie-Mahault',            ville: 'Baie-Mahault',           latitude: 16.2690,  longitude: -61.5870, rating: 4.0 },

  // ── 976 · Mayotte ──
  { id: 'd976a', name: 'Grande Mosquée de Mamoudzou',        ville: 'Mamoudzou',             latitude: -12.7806, longitude: 45.2278,  rating: 4.4 },
  { id: 'd976b', name: 'Mosquée de Koungou',                 ville: 'Koungou',               latitude: -12.7300, longitude: 45.2030,  rating: 4.2 },

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

  const [mosques, setMosques]       = useState([]);
  const [userPos, setUserPos]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [statusMsg, setStatusMsg]   = useState('Géolocalisation en cours…');
  const [selectedId, setSelectedId] = useState(null);

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

  const displayed = mosques || [];

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

      {/* Bouton À proximité */}
      <View style={mS.modeSwitch}>
        <Pressable style={[mS.modeBtn, mS.modeBtnActive]} onPress={doGeolocate}>
          <Text style={[mS.modeBtnText, mS.modeBtnTextActive]}>📍 À proximité</Text>
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
  modeSwitch:         { position: 'absolute', top: Platform.OS === 'ios' ? 110 : 90, left: 16, right: 80, flexDirection: 'row', gap: 8 },
  modeBtn:            { flex: 1, backgroundColor: 'rgba(255,255,255,0.90)', borderRadius: 16, paddingVertical: 9, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  modeBtnActive:      { backgroundColor: DS.green },
  modeBtnText:        { fontSize: 12, fontWeight: '700', color: DS.textMd },
  modeBtnTextActive:  { color: DS.white },
  statusBar:          { position: 'absolute', top: Platform.OS === 'ios' ? 156 : 136, left: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7 },
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
