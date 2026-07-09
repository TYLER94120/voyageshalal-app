import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Stack } from 'expo-router';

import { usePrayerContext } from '@/context/PrayerContext';
import { PRAYER_LABELS } from '@/lib/prayer';
import {
  ADHAN_PRAYERS,
  DEFAULT_ADHAN_SETTINGS,
  loadAdhanSettings,
  saveAdhanSettings,
  type AdhanPrayer,
  type AdhanSettings,
} from '@/lib/notificationSettings';
import {
  rescheduleAdhan,
  updatePersistentNotification,
  type PersistentResult,
  type RescheduleResult,
} from '@/lib/notifications';
import { Brand, Radius, Spacing } from '@/constants/theme';

export default function AdhanScreen() {
  const { settings: prayerSettings, location } = usePrayerContext();
  const [adhan, setAdhan] = useState<AdhanSettings>(DEFAULT_ADHAN_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [result, setResult] = useState<RescheduleResult | null>(null);
  const [persistResult, setPersistResult] = useState<PersistentResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    loadAdhanSettings().then((s) => {
      if (!alive) return;
      setAdhan(s);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Applique (persiste + reprogramme) un nouvel état.
  const apply = useCallback(
    async (next: AdhanSettings) => {
      setAdhan(next);
      if (Platform.OS === 'web') {
        saveAdhanSettings(next);
        setResult({ status: 'off', count: 0 });
        return;
      }
      setBusy(true);
      try {
        const res = await rescheduleAdhan({
          enabled: next.enabled,
          latitude: location.latitude,
          longitude: location.longitude,
          methodKey: prayerSettings.methodKey,
          madhab: prayerSettings.madhab,
          prayers: next.prayers,
        });
        // Épingle des horaires (indépendante des rappels sonores).
        const persist = await updatePersistentNotification({
          enabled: next.persistent,
          latitude: location.latitude,
          longitude: location.longitude,
          methodKey: prayerSettings.methodKey,
          madhab: prayerSettings.madhab,
        });
        setResult(res);
        setPersistResult(next.persistent ? persist : null);
        // Corrige l'état si une permission a été refusée (évite de re-solliciter).
        let corrected = next;
        if (res.status === 'denied') corrected = { ...corrected, enabled: false };
        if (next.persistent && persist === 'denied') corrected = { ...corrected, persistent: false };
        if (corrected !== next) setAdhan(corrected);
        saveAdhanSettings(corrected);
      } finally {
        setBusy(false);
      }
    },
    [location.latitude, location.longitude, prayerSettings.methodKey, prayerSettings.madhab],
  );

  // Reprogramme quand la position est prête / change (les horaires en dépendent),
  // sans re-déclencher sur les bascules (lues via ref pour ne pas re-scheduler en double).
  const adhanRef = useRef(adhan);
  useEffect(() => {
    adhanRef.current = adhan;
  }, [adhan]);

  useEffect(() => {
    if (loaded && location.ready && adhanRef.current.enabled) apply(adhanRef.current);
  }, [
    loaded,
    location.ready,
    location.latitude,
    location.longitude,
    prayerSettings.methodKey,
    prayerSettings.madhab,
    apply,
  ]);

  const toggleMaster = (enabled: boolean) => apply({ ...adhan, enabled });
  const togglePrayer = (p: AdhanPrayer, on: boolean) =>
    apply({ ...adhan, prayers: { ...adhan.prayers, [p]: on } });
  const togglePersistent = (persistent: boolean) => apply({ ...adhan, persistent });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Adhan',
          headerStyle: { backgroundColor: Brand.night },
          headerTintColor: Brand.gold,
          headerTitleStyle: { color: Brand.cream, fontWeight: '800' },
        }}
      />

      <Text style={styles.kicker}>RAPPELS DE PRIÈRE</Text>
      <Text style={styles.intro}>
        Recevez une notification à chaque heure de prière, même application fermée.
      </Text>

      {/* Interrupteur principal */}
      <View style={styles.masterCard}>
        <View style={styles.masterText}>
          <Text style={styles.masterTitle}>Activer l’adhan</Text>
          <Text style={styles.masterHint}>
            {location.city ? `Calé sur ${location.city}` : 'Calé sur votre position'}
          </Text>
        </View>
        <Switch
          value={adhan.enabled}
          onValueChange={toggleMaster}
          disabled={busy}
          trackColor={{ false: Brand.border, true: Brand.gold }}
          thumbColor={Brand.cream}
        />
      </View>

      {/* Statut */}
      {result && <StatusLine result={result} />}

      {/* Horaires épinglés (notification permanente) — option indépendante */}
      <View style={styles.masterCard}>
        <View style={styles.masterText}>
          <Text style={styles.masterTitle}>📌 Épingler les horaires</Text>
          <Text style={styles.masterHint}>
            Une notification permanente affiche les 5 horaires du jour, même l’app fermée.
          </Text>
        </View>
        <Switch
          value={adhan.persistent}
          onValueChange={togglePersistent}
          disabled={busy}
          trackColor={{ false: Brand.border, true: Brand.gold }}
          thumbColor={Brand.cream}
        />
      </View>
      {persistResult === 'ok' && (
        <Text style={[styles.status, styles.statusOk]}>
          ✓ Horaires épinglés — visibles dans les notifications, même écran verrouillé.
        </Text>
      )}
      {persistResult === 'denied' && (
        <Text style={[styles.status, styles.statusWarn]}>
          ⚠️ Notifications refusées pour l’app. Autorise-les : Réglages du téléphone → Applications →
          VoyagesHalal → Notifications.
        </Text>
      )}
      {persistResult === 'error' && (
        <Text style={[styles.status, styles.statusWarn]}>
          ⚠️ Impossible d’afficher l’épingle — réessaie (et dis-le-nous si ça persiste).
        </Text>
      )}
      {adhan.persistent && Platform.OS === 'ios' && (
        <Text style={[styles.status, styles.statusWarn]}>
          ℹ️ Sur iPhone, la notification n’est pas permanente (limite iOS) — elle reste affichée mais peut être balayée.
        </Text>
      )}

      {/* Sélection par prière */}
      <Text style={styles.sectionTitle}>Prières notifiées</Text>
      <View style={styles.prayerList}>
        {ADHAN_PRAYERS.map((p) => (
          <View key={p} style={styles.prayerRow}>
            <Text style={styles.prayerEmoji}>🕌</Text>
            <Text style={styles.prayerLabel}>{PRAYER_LABELS[p]}</Text>
            <Switch
              value={adhan.prayers[p]}
              onValueChange={(on) => togglePrayer(p, on)}
              disabled={!adhan.enabled || busy}
              trackColor={{ false: Brand.border, true: Brand.gold }}
              thumbColor={Brand.cream}
            />
          </View>
        ))}
      </View>

      <Text style={styles.footnote}>
        Les rappels couvrent plusieurs jours et sont reprogrammés à chaque ouverture de l’app.
        Pour un véritable son d’adhan (au lieu du son de notification par défaut), ajoutez un
        fichier audio dans assets/sounds/ — voir le README du dossier.
      </Text>
    </ScrollView>
  );
}

function StatusLine({ result }: { result: RescheduleResult }) {
  if (result.status === 'denied') {
    return (
      <Text style={[styles.status, styles.statusWarn]}>
        ⚠️ Notifications refusées. Autorisez-les dans les réglages du téléphone.
      </Text>
    );
  }
  if (result.status === 'scheduled') {
    return (
      <Text style={[styles.status, styles.statusOk]}>
        ✓ {result.count} rappel{result.count > 1 ? 's' : ''} programmé{result.count > 1 ? 's' : ''}.
      </Text>
    );
  }
  return <Text style={styles.status}>Rappels désactivés.</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.night },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl * 2 },

  kicker: { color: Brand.gold, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  intro: { color: Brand.creamMuted, fontSize: 14, lineHeight: 20, marginTop: 6 },

  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  masterText: { flex: 1, paddingRight: Spacing.md },
  masterTitle: { color: Brand.cream, fontSize: 17, fontWeight: '800' },
  masterHint: { color: Brand.creamMuted, fontSize: 13, marginTop: 2 },

  status: { color: Brand.creamMuted, fontSize: 13, marginTop: Spacing.sm, fontWeight: '600' },
  statusOk: { color: Brand.gold },
  statusWarn: { color: '#e8b04b' },

  sectionTitle: {
    color: Brand.cream,
    fontSize: 16,
    fontWeight: '800',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  prayerList: {
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    overflow: 'hidden',
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  prayerEmoji: { fontSize: 16 },
  prayerLabel: { flex: 1, color: Brand.cream, fontSize: 16, fontWeight: '600' },

  footnote: { color: Brand.creamMuted, fontSize: 12, lineHeight: 18, marginTop: Spacing.xl },
});
