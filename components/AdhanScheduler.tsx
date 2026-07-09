import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { usePrayerContext } from '@/context/PrayerContext';
import { loadAdhanSettings } from '@/lib/notificationSettings';
import { rescheduleAdhan, updatePersistentNotification } from '@/lib/notifications';

/**
 * Composant sans rendu, monté à la racine sous PrayerProvider.
 * Reprogramme les rappels d'adhan au lancement et à chaque retour au premier
 * plan, pour que la couverture (SCHEDULE_DAYS) se renouvelle sans devoir ouvrir
 * l'écran Adhan. N'agit que si l'utilisateur a activé l'adhan.
 */
export function AdhanScheduler() {
  const { settings, location } = usePrayerContext();
  const settingsRef = useRef(settings);
  const locationRef = useRef(location);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;

    const run = async () => {
      const loc = locationRef.current;
      if (!loc.ready) return;
      const adhan = await loadAdhanSettings();
      if (cancelled) return;
      const s = settingsRef.current;
      if (adhan.enabled) {
        await rescheduleAdhan({
          enabled: true,
          latitude: loc.latitude,
          longitude: loc.longitude,
          methodKey: s.methodKey,
          madhab: s.madhab,
          prayers: adhan.prayers,
        });
      }
      if (cancelled) return;
      // Rafraîchit l'épingle des horaires (nouveau jour) à chaque ouverture.
      if (adhan.persistent) {
        await updatePersistentNotification({
          enabled: true,
          latitude: loc.latitude,
          longitude: loc.longitude,
          methodKey: s.methodKey,
          madhab: s.madhab,
        });
      }
      // Rafraîchit le widget d'écran d'accueil (position/jour à jour). Garde-fou :
      // module natif absent (ancien binaire / iOS) → ignorer.
      if (Platform.OS === 'android') {
        try {
          const { refreshPrayerWidget } = require('@/widgets/refreshWidget');
          await refreshPrayerWidget();
        } catch {
          // widget indisponible sur ce binaire
        }
      }
    };

    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [location.ready, location.latitude, location.longitude, settings.methodKey, settings.madhab]);

  return null;
}
