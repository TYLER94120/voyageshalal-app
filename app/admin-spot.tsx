import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Location from 'expo-location';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { loadAdmin } from '@/lib/admin';
import { addSpot, type AddSpotResult } from '@/lib/spots';

/**
 * Écran ADMIN « + Ajouter un spot » : réservé au propriétaire (clé admin) pour
 * SEMER des spots de prière sur place pendant le road trip. Pas de soumission
 * publique. Photo par lien pour l'instant (la capture directe nécessitera une
 * mise à jour complète de l'app — expo-image-picker non installé).
 */
export default function AdminSpotScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AddSpotResult | null>(null);

  useEffect(() => {
    loadAdmin().then((a) => {
      setAdminKey(a.key);
      setReady(true);
    });
  }, []);

  const locate = useCallback(async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      // géoloc indisponible
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    if (ready && adminKey) locate();
  }, [ready, adminKey, locate]);

  const submit = async () => {
    if (!coords) return;
    setBusy(true);
    setResult(null);
    const res = await addSpot(
      { latitude: coords.latitude, longitude: coords.longitude, note: note.trim() || undefined, photoUrl: photoUrl.trim() || undefined },
      adminKey,
    );
    setResult(res);
    setBusy(false);
    if (res === 'ok') {
      setNote('');
      setPhotoUrl('');
    }
  };

  const header = (
    <Stack.Screen
      options={{
        headerShown: true,
        headerTitle: 'Ajouter un spot',
        headerStyle: { backgroundColor: Brand.night },
        headerTintColor: Brand.gold,
        headerTitleStyle: { color: Brand.cream, fontWeight: '800' },
      }}
    />
  );

  if (ready && !adminKey) {
    return (
      <View style={styles.center}>
        {header}
        <Text style={styles.lock}>🔒</Text>
        <Text style={styles.lockText}>Écran réservé à l’admin.</Text>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {header}

      <Text style={styles.kicker}>ADMIN · SEMER UN SPOT</Text>
      <Text style={styles.intro}>
        Ajoute un spot de prière là où tu es. Il apparaîtra dans la couche « Spots partagés » (signalé,
        non vérifié). Pas de soumission publique.
      </Text>

      <Text style={styles.section}>📍 Position</Text>
      <View style={styles.card}>
        {coords ? (
          <Text style={styles.coords}>
            {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          </Text>
        ) : (
          <Text style={styles.coordsMuted}>{locating ? 'Localisation…' : 'Position inconnue'}</Text>
        )}
        <Pressable style={styles.locBtn} onPress={locate} disabled={locating}>
          {locating ? <ActivityIndicator color={Brand.night} /> : <Text style={styles.locBtnText}>📍 Utiliser ma position</Text>}
        </Pressable>
      </View>

      <Text style={styles.section}>📝 Note (facultatif)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Ex. Coin calme au 2e étage, tapis dispo…"
        placeholderTextColor={Brand.creamMuted}
        style={[styles.input, styles.multiline]}
        multiline
      />

      <Text style={styles.section}>📷 Photo (lien, facultatif)</Text>
      <TextInput
        value={photoUrl}
        onChangeText={setPhotoUrl}
        placeholder="https://…"
        placeholderTextColor={Brand.creamMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      <Text style={styles.photoHint}>
        📸 La prise de photo directe arrive à la prochaine mise à jour complète de l’app.
      </Text>

      <Pressable style={[styles.submit, !coords && styles.submitOff]} onPress={submit} disabled={!coords || busy}>
        {busy ? <ActivityIndicator color={Brand.night} /> : <Text style={styles.submitText}>Semer ce spot</Text>}
      </Pressable>

      {result === 'ok' && <Text style={[styles.status, styles.ok]}>✓ Spot ajouté. Merci !</Text>}
      {result === 'forbidden' && <Text style={[styles.status, styles.warn]}>⛔ Clé admin refusée par le serveur.</Text>}
      {result === 'error' && <Text style={[styles.status, styles.warn]}>Réseau indisponible — réessaie.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.night },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl * 2 },
  center: { flex: 1, backgroundColor: Brand.night, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  lock: { fontSize: 44 },
  lockText: { color: Brand.creamMuted, fontSize: 15 },
  back: { marginTop: Spacing.md, backgroundColor: Brand.gold, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  backText: { color: Brand.night, fontWeight: '800' },

  kicker: { color: Brand.gold, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  intro: { color: Brand.creamMuted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  section: { color: Brand.cream, fontSize: 15, fontWeight: '800', marginTop: Spacing.lg, marginBottom: Spacing.sm },

  card: { backgroundColor: Brand.forest, borderRadius: Radius.md, borderWidth: 1, borderColor: Brand.border, padding: Spacing.md, gap: Spacing.sm },
  coords: { color: Brand.gold, fontSize: 16, fontWeight: '800' },
  coordsMuted: { color: Brand.creamMuted, fontSize: 15 },
  locBtn: { backgroundColor: Brand.gold, borderRadius: Radius.pill, paddingVertical: 12, alignItems: 'center' },
  locBtnText: { color: Brand.night, fontWeight: '800', fontSize: 14 },

  input: { backgroundColor: Brand.forest, borderRadius: Radius.md, borderWidth: 1, borderColor: Brand.border, padding: Spacing.md, color: Brand.cream, fontSize: 15 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  photoHint: { color: Brand.creamMuted, fontSize: 12, marginTop: 6 },

  submit: { marginTop: Spacing.xl, backgroundColor: Brand.gold, borderRadius: Radius.pill, paddingVertical: 15, alignItems: 'center' },
  submitOff: { opacity: 0.5 },
  submitText: { color: Brand.night, fontWeight: '800', fontSize: 16 },

  status: { textAlign: 'center', marginTop: Spacing.md, fontSize: 14, fontWeight: '700' },
  ok: { color: Brand.gold },
  warn: { color: '#e8b04b' },
});
