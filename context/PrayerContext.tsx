import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';

import {
  computeDay,
  countdownTo,
  dayKey,
  findCurrentPrayer,
  findNextPrayer,
  type Countdown,
  type NextPrayer,
  type PrayerName,
  type PrayerSlot,
} from '@/lib/prayer';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type PrayerSettings,
} from '@/lib/prayerSettings';

// Position de repli (Paris) si la géoloc est refusée/indisponible.
const DEFAULT_LOCATION = { latitude: 48.8566, longitude: 2.3522, city: 'Paris' };

interface PrayerLocation {
  latitude: number;
  longitude: number;
  city?: string;
  usingDefault: boolean;
  ready: boolean;
}

interface PrayerContextValue {
  settings: PrayerSettings;
  settingsLoaded: boolean;
  updateSettings: (partial: Partial<PrayerSettings>) => void;
  location: PrayerLocation;
  refreshLocation: () => void;
}

const PrayerContext = createContext<PrayerContextValue | null>(null);

export function PrayerProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PrayerSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [location, setLocation] = useState<PrayerLocation>({
    ...DEFAULT_LOCATION,
    usingDefault: true,
    ready: false,
  });

  // Charge les réglages persistés une fois.
  useEffect(() => {
    let alive = true;
    loadSettings().then((s) => {
      if (!alive) return;
      setSettings(s);
      setSettingsLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const resolveLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation({ ...DEFAULT_LOCATION, usingDefault: true, ready: true });
        return;
      }

      // 1) Position connue (rapide) pour afficher quelque chose tout de suite.
      // maxAge : on IGNORE une position trop vieille (> 15 min) — sinon, en
      // voyage (France → Maroc), les horaires restent calés sur l'ancien pays.
      const last = await Location.getLastKnownPositionAsync({ maxAge: 15 * 60 * 1000 });
      if (last) {
        setLocation((prev) => ({
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
          city: prev.usingDefault ? undefined : prev.city,
          usingDefault: false,
          ready: true,
        }));
      }

      // 2) Position précise.
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setLocation({ ...coords, usingDefault: false, ready: true });

      // 3) Nom de ville (best-effort, nécessite le réseau).
      try {
        const places = await Location.reverseGeocodeAsync(coords);
        const city = places[0]?.city ?? places[0]?.subregion ?? undefined;
        if (city) {
          setLocation((prev) => ({ ...prev, city }));
        }
      } catch {
        // pas de nom de ville : on garde les coordonnées
      }
    } catch {
      setLocation({ ...DEFAULT_LOCATION, usingDefault: true, ready: true });
    }
  }, []);

  // Résout au lancement ET à chaque retour au premier plan : indispensable en
  // voyage (l'app reste en mémoire pendant le vol → la position doit se
  // rafraîchir, sinon horaires/adhan restent sur l'ancien pays).
  useEffect(() => {
    resolveLocation();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') resolveLocation();
    });
    return () => sub.remove();
  }, [resolveLocation]);

  // Ref vers les réglages courants : permet de calculer `next` purement, hors
  // de l'updater de setState (un updater doit rester pur — il peut être rejoué).
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const updateSettings = useCallback((partial: Partial<PrayerSettings>) => {
    const next = { ...settingsRef.current, ...partial };
    settingsRef.current = next;
    setSettings(next);
    saveSettings(next);
  }, []);

  const value = useMemo<PrayerContextValue>(
    () => ({ settings, settingsLoaded, updateSettings, location, refreshLocation: resolveLocation }),
    [settings, settingsLoaded, updateSettings, location, resolveLocation],
  );

  return <PrayerContext.Provider value={value}>{children}</PrayerContext.Provider>;
}

export function usePrayerContext(): PrayerContextValue {
  const ctx = useContext(PrayerContext);
  if (!ctx) {
    throw new Error('usePrayerContext doit être utilisé dans <PrayerProvider>');
  }
  return ctx;
}

// ─── Horloge de prière ───────────────────────────────────────────────────────
// Hook autonome (tick local 1 s) : seul le composant qui l'utilise se re-render,
// pas tout l'arbre. Utilisé par le bandeau permanent et l'écran Horaires.

export interface PrayerClock {
  ready: boolean;
  location: PrayerLocation;
  slots: PrayerSlot[];
  next: NextPrayer | null;
  current: PrayerName | null;
  countdown: Countdown | null;
  now: Date;
}

export function usePrayerClock(options?: { tickMs?: number }): PrayerClock {
  const tickMs = options?.tickMs ?? 1000;
  const { settings, location } = usePrayerContext();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNowMs(Date.now()), tickMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tickMs]);

  const now = useMemo(() => new Date(nowMs), [nowMs]);
  const { latitude, longitude } = location;
  const { methodKey, madhab } = settings;
  const dKey = dayKey(now);
  const minuteKey = Math.floor(nowMs / 60000);

  // Recalculé seulement au changement de jour / position / réglages.
  const slots = useMemo(
    () => (location.ready ? computeDay(latitude, longitude, now, methodKey, madhab) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.ready, dKey, latitude, longitude, methodKey, madhab],
  );

  // Recalculé à chaque minute (bascule de prière) ou changement de contexte.
  const next = useMemo(
    () => (location.ready ? findNextPrayer(latitude, longitude, now, methodKey, madhab) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.ready, minuteKey, latitude, longitude, methodKey, madhab],
  );

  const current = useMemo(
    () => (slots.length ? findCurrentPrayer(slots, now) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slots, minuteKey],
  );

  // Compte à rebours vivant (chaque seconde).
  const countdown = next ? countdownTo(next.time, now) : null;

  return { ready: location.ready, location, slots, next, current, countdown, now };
}
