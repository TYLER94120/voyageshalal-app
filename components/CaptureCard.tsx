import { useEffect, useState } from 'react';
import { Linking, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import {
  FOLLOW_LINKS,
  SHARE_URL,
  hasSubscribed,
  subscribeEmail,
  type SubscribeResult,
} from '@/lib/capture';

/**
 * Bloc « Reste connecté » (Phase 1 — capter) : e-mail + suivi social + partage.
 * Discret, une seule carte. Se replie une fois l'e-mail enregistré.
 */
export function CaptureCard() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<SubscribeResult | 'idle' | 'busy'>('idle');
  const [done, setDone] = useState(false);

  useEffect(() => {
    hasSubscribed().then(setDone);
  }, []);

  const submit = async () => {
    setState('busy');
    const res = await subscribeEmail(email);
    setState(res);
    if (res === 'ok') setDone(true);
  };

  const openShare = () =>
    Share.share({
      message: `VoyagesHalal — mosquées, restos halal et hôtels bien situés, partout. ${SHARE_URL}`,
    }).catch(() => undefined);

  return (
    <View style={styles.card}>
      {!done ? (
        <>
          <Text style={styles.title}>📬 Reste au courant</Text>
          <Text style={styles.hint}>Nouvelles villes, bons plans halal. Pas de spam.</Text>
          <View style={styles.emailRow}>
            <TextInput
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (state === 'invalid' || state === 'error') setState('idle');
              }}
              placeholder="Ton e-mail"
              placeholderTextColor={Brand.creamMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            <Pressable style={styles.submit} onPress={submit} disabled={state === 'busy'}>
              <Text style={styles.submitText}>{state === 'busy' ? '…' : 'OK'}</Text>
            </Pressable>
          </View>
          {state === 'invalid' && <Text style={styles.err}>E-mail invalide.</Text>}
          {state === 'error' && <Text style={styles.err}>Réseau indisponible — réessaie.</Text>}
        </>
      ) : (
        <>
          <Text style={styles.title}>🙏 Merci de nous suivre</Text>
          <Text style={styles.hint}>Partage l’app autour de toi, ça nous aide énormément.</Text>
        </>
      )}

      <View style={styles.actions}>
        <Pressable
          style={styles.action}
          onPress={() => Linking.openURL(FOLLOW_LINKS.instagram).catch(() => undefined)}
        >
          <Text style={styles.actionText}>📸 Suivre</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={openShare}>
          <Text style={styles.actionText}>📲 Partager l’app</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.gold,
    padding: Spacing.md,
    gap: 6,
  },
  title: { color: Brand.cream, fontSize: 16, fontWeight: '800' },
  hint: { color: Brand.creamMuted, fontSize: 13 },
  emailRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: 6 },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: Brand.night,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: Spacing.md,
    color: Brand.cream,
    fontSize: 15,
  },
  submit: {
    width: 52,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: Brand.night, fontWeight: '800', fontSize: 15 },
  err: { color: '#e8b04b', fontSize: 12, fontWeight: '700', marginTop: 2 },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  action: {
    flex: 1,
    backgroundColor: Brand.goldSoft,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionText: { color: Brand.gold, fontSize: 13, fontWeight: '800' },
});
