import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

import { usePrayerContext } from '@/context/PrayerContext';
import {
  distanceToKaabaKm,
  norm360,
  qiblaBearing,
  qiblaOffset,
  smoothHeading,
  turnGuidance,
} from '@/lib/qibla';
import { Brand, Radius, Spacing } from '@/constants/theme';

const ALIGN_TOLERANCE = 5; // degrés
const COMPASS_SIZE = 280;

export default function QiblaScreen() {
  const { location } = usePrayerContext();
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [magneticOnly, setMagneticOnly] = useState(false);
  const smoothed = useRef<number | null>(null);
  const wasAligned = useRef(false);

  const bearing = useMemo(
    () => qiblaBearing(location.latitude, location.longitude),
    [location.latitude, location.longitude],
  );
  const distanceKm = useMemo(
    () => distanceToKaabaKm(location.latitude, location.longitude),
    [location.latitude, location.longitude],
  );

  useEffect(() => {
    if (Platform.OS === 'web') {
      setUnavailable(true);
      return;
    }
    let sub: Location.LocationSubscription | null = null;
    let alive = true;
    (async () => {
      try {
        // Localisation requise pour un cap « nord vrai » (corrigé de la
        // déclinaison par l'OS) ; sinon on retombe sur le nord magnétique.
        await Location.requestForegroundPermissionsAsync();
        const s = await Location.watchHeadingAsync((h) => {
          if (!alive) return;
          const useTrue = h.trueHeading >= 0;
          const raw = useTrue ? h.trueHeading : h.magHeading;
          setMagneticOnly(!useTrue);
          smoothed.current = smoothHeading(smoothed.current, raw);
          setHeading(smoothed.current);
          setAccuracy(h.accuracy);
        });
        // Démonté pendant l'attente → retirer tout de suite, sinon le capteur
        // magnétique resterait actif (le cleanup a déjà lu `sub` nul).
        if (!alive) {
          s.remove();
          return;
        }
        sub = s;
      } catch {
        if (alive) setUnavailable(true);
      }
    })();
    return () => {
      alive = false;
      sub?.remove();
    };
  }, []);

  const offset = heading === null ? null : qiblaOffset(heading, bearing);
  const aligned = offset !== null && offset <= ALIGN_TOLERANCE;

  // Retour haptique à l'alignement, avec hystérésis (entrée ≤5°, sortie >8°)
  // pour éviter les vibrations en rafale au voisinage du seuil.
  useEffect(() => {
    if (offset === null) return;
    if (!wasAligned.current && offset <= ALIGN_TOLERANCE) {
      wasAligned.current = true;
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (wasAligned.current && offset > ALIGN_TOLERANCE + 3) {
      wasAligned.current = false;
    }
  }, [offset]);

  // Rotations (deg). Rose ← -cap ; flèche Qibla ← (qibla - cap).
  const roseRotation = heading === null ? 0 : -heading;
  const qiblaRotation = heading === null ? bearing : norm360(bearing - heading);

  const lowAccuracy = accuracy !== null && accuracy <= 1;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Qibla',
          headerStyle: { backgroundColor: Brand.night },
          headerTintColor: Brand.gold,
          headerTitleStyle: { color: Brand.cream, fontWeight: '800' },
        }}
      />

      <Text style={styles.city}>
        📍 {location.city ?? (location.usingDefault ? 'Paris' : 'Ma position')}
        {location.usingDefault ? ' · par défaut' : ''}
      </Text>

      {unavailable ? (
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>🧭</Text>
          <Text style={styles.errorTitle}>Boussole indisponible</Text>
          <Text style={styles.muted}>
            La boussole n’est pas accessible sur cet appareil. La direction de la Qibla reste{' '}
            indiquée ci-dessous.
          </Text>
          <Text style={styles.staticBearing}>Qibla : {Math.round(bearing)}° depuis le nord</Text>
        </View>
      ) : (
        <>
          <View style={styles.compassWrap}>
            {/* Repère fixe (haut = direction du téléphone) */}
            <View style={styles.topMarker}>
              <Text style={[styles.topMarkerText, aligned && styles.topMarkerAligned]}>▼</Text>
            </View>

            {/* Rose des vents (tourne avec le cap) — atténuée tant qu'aucun cap */}
            <View
              style={[
                styles.compass,
                aligned && styles.compassAligned,
                { opacity: heading === null ? 0.35 : 1, transform: [{ rotate: `${roseRotation}deg` }] },
              ]}
            >
              <Text style={[styles.cardinal, styles.north]}>N</Text>
              <Text style={[styles.cardinal, styles.east]}>E</Text>
              <Text style={[styles.cardinal, styles.south]}>S</Text>
              <Text style={[styles.cardinal, styles.west]}>O</Text>
            </View>

            {/* Flèche Qibla — masquée tant qu'aucun cap réel (évite une fausse direction) */}
            <View
              style={[
                styles.qiblaLayer,
                { opacity: heading === null ? 0 : 1, transform: [{ rotate: `${qiblaRotation}deg` }] },
              ]}
              pointerEvents="none"
            >
              <View style={styles.qiblaTop}>
                <View style={[styles.kaaba, aligned && styles.kaabaAligned]}>
                  <Text style={styles.kaabaText}>🕋</Text>
                </View>
              </View>
            </View>

            {/* Lecture centrale */}
            <View style={styles.centerReadout} pointerEvents="none">
              <Text style={styles.headingValue}>{heading === null ? '—' : `${Math.round(heading)}°`}</Text>
              <Text style={styles.headingLabel}>cap</Text>
            </View>
          </View>

          <Text style={[styles.guidance, aligned && styles.guidanceAligned]}>
            {heading === null ? 'Orientez votre téléphone…' : turnGuidance(heading, bearing, ALIGN_TOLERANCE)}
          </Text>

          <View style={styles.statsRow}>
            <Stat label="Qibla" value={`${Math.round(bearing)}°`} />
            <Stat label="Distance Kaaba" value={formatDistance(distanceKm)} />
          </View>

          {magneticOnly && (
            <Text style={styles.calibrate}>
              ⚠️ Direction approximative (nord magnétique non corrigé) — activez la localisation
              pour une précision optimale.
            </Text>
          )}

          {lowAccuracy && (
            <Text style={styles.calibrate}>
              ⚠️ Précision faible — calibrez en dessinant un 8 avec votre téléphone.
            </Text>
          )}
        </>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatDistance(km: number): string {
  if (km >= 100) return `${Math.round(km).toLocaleString('fr-FR')} km`;
  return `${km.toFixed(1)} km`;
}

const RADIUS = COMPASS_SIZE / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.night, alignItems: 'center', paddingTop: Spacing.lg },
  city: { color: Brand.cream, fontSize: 15, fontWeight: '700', marginBottom: Spacing.lg },

  compassWrap: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  topMarker: { position: 'absolute', top: -22, zIndex: 5 },
  topMarkerText: { color: Brand.creamMuted, fontSize: 22 },
  topMarkerAligned: { color: Brand.gold },

  compass: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: RADIUS,
    borderWidth: 2,
    borderColor: Brand.border,
    backgroundColor: Brand.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassAligned: { borderColor: Brand.gold },
  cardinal: { position: 'absolute', color: Brand.creamMuted, fontSize: 18, fontWeight: '800' },
  north: { top: 10, color: Brand.gold },
  south: { bottom: 10 },
  east: { right: 12 },
  west: { left: 12 },

  qiblaLayer: {
    position: 'absolute',
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: 'center',
  },
  qiblaTop: { position: 'absolute', top: -6 },
  kaaba: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Brand.night,
    borderWidth: 2,
    borderColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kaabaAligned: { backgroundColor: Brand.gold },
  kaabaText: { fontSize: 24 },

  centerReadout: { position: 'absolute', alignItems: 'center' },
  headingValue: { color: Brand.cream, fontSize: 30, fontWeight: '800' },
  headingLabel: { color: Brand.creamMuted, fontSize: 12, fontWeight: '600' },

  guidance: {
    color: Brand.cream,
    fontSize: 18,
    fontWeight: '700',
    marginTop: Spacing.xl,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  guidanceAligned: { color: Brand.gold },

  statsRow: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.lg },
  stat: { alignItems: 'center' },
  statValue: { color: Brand.cream, fontSize: 22, fontWeight: '800' },
  statLabel: { color: Brand.creamMuted, fontSize: 12, fontWeight: '600', marginTop: 2 },

  calibrate: {
    color: Brand.gold,
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  bigEmoji: { fontSize: 56 },
  errorTitle: { color: Brand.cream, fontSize: 18, fontWeight: '700' },
  muted: { color: Brand.creamMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  staticBearing: { color: Brand.gold, fontSize: 16, fontWeight: '800', marginTop: Spacing.md },
});
