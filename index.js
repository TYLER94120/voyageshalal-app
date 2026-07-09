// Point d'entrée : enregistre le handler du widget Android (tâche headless,
// appelée par le système même app fermée) AVANT de démarrer expo-router.
// Garde-fou : sur un binaire sans le module natif (ancien build), on n'enregistre
// rien — l'app démarre normalement.
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  try {
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    const { widgetTaskHandler } = require('./widgets/widgetTaskHandler');
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch {
    // module widget absent de ce binaire : ignorer
  }
}

import 'expo-router/entry';
