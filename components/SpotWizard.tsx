import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { loadAdmin } from '@/lib/admin';
import { levelFor, loadContrib, recordSpotAdded } from '@/lib/contrib';
import { SPOT_TYPES, submitSpot, type SubmitSpotResult } from '@/lib/spots';

// Photo « dans l'instant » : module natif absent des anciens builds → garde-fou.
function getImagePicker(): typeof import('expo-image-picker') | null {
  try {
    return require('expo-image-picker');
  } catch {
    return null;
  }
}

type Step = 'type' | 'details' | 'done';

/**
 * Flux « + Ajouter un spot » : type → GPS auto + photo + 1 phrase → publier.
 * 3 taps, < 30 s. Célébration à la publication (confettis one-shot dans la
 * modale — aucun impact sur le défilement). Jamais « certifié ».
 */
export function SpotWizard({
  visible,
  onClose,
  onPublished,
}: {
  visible: boolean;
  onClose: () => void;
  onPublished?: () => void;
}) {
  const [step, setStep] = useState<Step>('type');
  const [spotType, setSpotType] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitSpotResult | null>(null);
  const [newLevel, setNewLevel] = useState<string | null>(null);

  const picker = getImagePicker();

  const reset = useCallback(() => {
    setStep('type');
    setSpotType(null);
    // La position aussi : « ➕ Un autre » après avoir marché 800 m republiait
    // sinon aux coordonnées du spot PRÉCÉDENT (donnée corrompue).
    setCoords(null);
    setNote('');
    setPhotoBase64(null);
    setPhotoTaken(false);
    setPhotoTooBig(false);
    setResult(null);
    setNewLevel(null);
  }, []);

  // GPS auto dès l'ouverture (position exacte, sur place).
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
    if (visible) {
      reset();
      locate();
    }
  }, [visible, reset, locate]);

  // Plafond d'envoi (~2 Mo décodés) : au-delà, le JSON devient énorme pour le
  // réseau mobile et le serveur. quality 0.3 suffit largement pour un spot.
  const PHOTO_MAX_B64 = 2_800_000;
  const [photoTooBig, setPhotoTooBig] = useState(false);

  const takePhoto = async () => {
    if (!picker) return;
    setPhotoTooBig(false);
    try {
      const perm = await picker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      const res = await picker.launchCameraAsync({ quality: 0.3, base64: true, allowsEditing: false });
      const asset = res.assets?.[0];
      if (asset?.base64) {
        if (asset.base64.length > PHOTO_MAX_B64) {
          setPhotoTooBig(true);
          return;
        }
        setPhotoBase64(asset.base64);
        setPhotoTaken(true);
      }
    } catch {
      // caméra indisponible
    }
  };

  const publish = async () => {
    if (!coords || !spotType) return;
    setBusy(true);
    const admin = await loadAdmin();
    const res = await submitSpot(
      {
        latitude: coords.latitude,
        longitude: coords.longitude,
        type: spotType,
        note: note.trim() || undefined,
        photoBase64: photoBase64 ?? undefined,
      },
      admin.key || undefined,
    );
    setResult(res);
    if (res === 'ok') {
      const prev = await loadContrib();
      const state = await recordSpotAdded();
      const was = levelFor(prev.spotsAdded).key;
      const now = levelFor(state.spotsAdded);
      if (now.key !== was) setNewLevel(`${now.emoji} ${now.label}`);
      onPublished?.();
    }
    setBusy(false);
    setStep('done');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grip} />

          {step === 'type' && (
            <>
              <Text style={styles.title}>🧎 Ajouter un spot de prière</Text>
              <Text style={styles.hint}>Tu es sur place ? Choisis le type de lieu :</Text>
              <View style={styles.typeWrap}>
                {SPOT_TYPES.map((t) => (
                  <Pressable
                    key={t.key}
                    style={styles.typeChip}
                    onPress={() => {
                      setSpotType(t.key);
                      setStep('details');
                    }}
                  >
                    <Text style={styles.typeChipText}>
                      {t.emoji} {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {step === 'details' && (
            <>
              <Text style={styles.title}>
                {SPOT_TYPES.find((t) => t.key === spotType)?.emoji} Presque fini !
              </Text>

              <View style={styles.gpsRow}>
                {coords ? (
                  <Text style={styles.gpsOk}>📍 Position captée ✓</Text>
                ) : locating ? (
                  <View style={styles.gpsWait}>
                    <ActivityIndicator size="small" color={Brand.gold} />
                    <Text style={styles.gpsWaitText}>Position en cours…</Text>
                  </View>
                ) : (
                  <Pressable onPress={locate}>
                    <Text style={styles.gpsRetry}>📍 Réessayer la position</Text>
                  </Pressable>
                )}
              </View>

              {picker ? (
                <Pressable style={[styles.photoBtn, photoTaken && styles.photoBtnOn]} onPress={takePhoto}>
                  <Text style={[styles.photoBtnText, photoTaken && styles.photoBtnTextOn]}>
                    {photoTaken ? '📷 Photo ajoutée ✓ (reprendre)' : '📷 Prendre une photo'}
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.photoHint}>
                  📷 La photo arrive à la prochaine mise à jour complète de l’app.
                </Text>
              )}
              {photoTooBig && (
                <Text style={styles.photoHint}>
                  ⚠️ Photo trop lourde — reprends-la (elle sera plus légère), ou publie sans photo.
                </Text>
              )}

              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Une phrase utile (ex. « 2e étage, tapis dispo, calme »)"
                placeholderTextColor={Brand.creamMuted}
                style={styles.input}
                multiline
              />

              <Pressable
                style={[styles.publish, (!coords || busy) && styles.publishOff]}
                disabled={!coords || busy}
                onPress={publish}
              >
                {busy ? (
                  <ActivityIndicator color={Brand.night} />
                ) : (
                  <Text style={styles.publishText}>🤲 Publier ce spot</Text>
                )}
              </Pressable>
            </>
          )}

          {step === 'done' && result === 'ok' && (
            <Celebration
              newLevel={newLevel}
              onMore={() => {
                reset();
                locate(); // nouvelle position pour le nouveau spot
              }}
              onClose={onClose}
            />
          )}
          {step === 'done' && result === 'closed' && (
            <>
              <Text style={styles.title}>🚧 Bientôt !</Text>
              <Text style={styles.hint}>
                Les contributions publiques ouvrent très prochainement. Merci pour ton élan — reviens
                vite, ton spot aidera des voyageurs in shâ Allah.
              </Text>
              <Pressable style={styles.publish} onPress={onClose}>
                <Text style={styles.publishText}>OK</Text>
              </Pressable>
            </>
          )}
          {step === 'done' && result === 'error' && (
            <>
              <Text style={styles.title}>📡 Oups</Text>
              <Text style={styles.hint}>Réseau indisponible — ton spot n’a pas été envoyé. Réessaie.</Text>
              <Pressable style={styles.publish} onPress={() => setStep('details')}>
                <Text style={styles.publishText}>Réessayer</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Célébration (confettis one-shot, aucun lien avec un scroll) ─────────────

const CONFETTI_COLORS = ['#c9a84c', '#e2c778', '#2d6a4f', '#7c3aed', '#fdfaf3'];

function Celebration({
  newLevel,
  onMore,
  onClose,
}: {
  newLevel: string | null;
  onMore: () => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.celebrate}>
      <Confetti />
      <Text style={styles.celebrateEmoji}>🎉</Text>
      <Text style={styles.celebrateTitle}>Barak Allahou fik !</Text>
      <Text style={styles.celebrateText}>Sadaqa jâriya en cours 🤲</Text>
      <Text style={styles.celebrateSub}>
        Chaque voyageur qui priera grâce à ton spot, c’est une récompense qui continue.
      </Text>
      {newLevel && <Text style={styles.levelUp}>Nouveau niveau : {newLevel}</Text>}
      <View style={styles.celebrateRow}>
        <Pressable style={styles.again} onPress={onMore}>
          <Text style={styles.againText}>➕ Un autre</Text>
        </Pressable>
        <Pressable style={styles.publish} onPress={onClose}>
          <Text style={styles.publishText}>Fermer</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Confetti() {
  const parts = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      x: (i / 18) * 300 + (i % 3) * 8,
      delay: (i % 6) * 90,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      anim: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    Animated.stagger(
      40,
      parts.map((p) =>
        Animated.timing(p.anim, {
          toValue: 1,
          duration: 1500,
          delay: p.delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [parts]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {parts.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: -12,
            left: p.x,
            width: 8,
            height: 12,
            borderRadius: 2,
            backgroundColor: p.color,
            opacity: p.anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, 260] }) },
              { rotate: p.anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${180 + (i % 4) * 90}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Brand.night,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    paddingBottom: Spacing.xl,
  },
  grip: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Brand.border, marginBottom: 12 },
  title: { color: Brand.cream, fontSize: 19, fontWeight: '800' },
  hint: { color: Brand.creamMuted, fontSize: 14, marginTop: 6, lineHeight: 20 },

  typeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    borderRadius: Radius.pill,
    backgroundColor: Brand.forest,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  typeChipText: { color: Brand.cream, fontSize: 14, fontWeight: '700' },

  gpsRow: { marginTop: Spacing.md },
  gpsOk: { color: Brand.gold, fontSize: 15, fontWeight: '800' },
  gpsWait: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gpsWaitText: { color: Brand.creamMuted, fontSize: 14 },
  gpsRetry: { color: Brand.gold, fontSize: 14, fontWeight: '800' },

  photoBtn: {
    marginTop: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.gold,
    backgroundColor: 'rgba(201,168,76,0.12)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  photoBtnOn: { backgroundColor: Brand.gold },
  photoBtnText: { color: Brand.gold, fontSize: 14, fontWeight: '800' },
  photoBtnTextOn: { color: Brand.night },
  photoHint: { color: Brand.creamMuted, fontSize: 12, marginTop: Spacing.md },

  input: {
    marginTop: Spacing.md,
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.md,
    color: Brand.cream,
    fontSize: 15,
    minHeight: 64,
    textAlignVertical: 'top',
  },

  publish: {
    marginTop: Spacing.lg,
    backgroundColor: Brand.gold,
    borderRadius: Radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    flexGrow: 1,
  },
  publishOff: { opacity: 0.45 },
  publishText: { color: Brand.night, fontSize: 16, fontWeight: '800' },

  celebrate: { alignItems: 'center', paddingVertical: Spacing.md },
  celebrateEmoji: { fontSize: 44 },
  celebrateTitle: { color: Brand.gold, fontSize: 22, fontWeight: '800', marginTop: 6 },
  celebrateText: { color: Brand.cream, fontSize: 16, fontWeight: '700', marginTop: 2 },
  celebrateSub: { color: Brand.creamMuted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  levelUp: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(201,168,76,0.16)',
    borderWidth: 1,
    borderColor: Brand.gold,
    color: Brand.gold,
    fontWeight: '800',
    fontSize: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  celebrateRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg, alignSelf: 'stretch' },
  again: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.gold,
    paddingVertical: 15,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  againText: { color: Brand.gold, fontSize: 15, fontWeight: '800' },
});
