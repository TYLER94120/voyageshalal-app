import { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useFavorites } from '@/context/FavoritesContext';
import { loadSettings } from '@/lib/prayerSettings';
import { METHODS } from '@/lib/prayer';
import { CaptureCard } from '@/components/CaptureCard';
import { loadAdmin, lockAdmin, unlockAdmin } from '@/lib/admin';

type Row = { icon: string; label: string; sub?: string; route?: Href; url?: string };

export default function ProfilScreen() {
  const router = useRouter();
  const { favorites } = useFavorites();
  const [methodLabel, setMethodLabel] = useState<string>('—');
  const [admin, setAdmin] = useState(false);
  const [codeModal, setCodeModal] = useState(false);
  const [code, setCode] = useState('');
  const [codeErr, setCodeErr] = useState(false);
  const tapsRef = useRef(0);

  useEffect(() => {
    loadSettings().then((s) => {
      const m = METHODS.find((x) => x.key === s.methodKey);
      setMethodLabel(m ? m.label : s.methodKey);
    });
    loadAdmin().then((a) => setAdmin(a.isAdmin));
  }, []);

  // Déblocage admin : 7 taps sur la ligne version → saisie de la clé serveur.
  const onVersionTap = () => {
    tapsRef.current += 1;
    if (tapsRef.current >= 7) {
      tapsRef.current = 0;
      setCodeModal(true);
    }
  };
  const submitCode = async () => {
    const ok = await unlockAdmin(code);
    if (ok) {
      setAdmin(true);
      setCodeModal(false);
      setCode('');
      setCodeErr(false);
    } else {
      setCodeErr(true);
    }
  };
  const exitAdmin = async () => {
    await lockAdmin();
    setAdmin(false);
  };

  const sections: { title: string; rows: Row[] }[] = [
    {
      title: 'Spiritualité',
      rows: [
        { icon: '🕌', label: 'Horaires de prière', sub: methodLabel, route: '/horaires' },
        { icon: '🧭', label: 'Qibla', sub: 'Direction de la Mecque', route: '/qibla' },
        { icon: '🔔', label: 'Adhan & notifications', sub: "Rappels à l'heure", route: '/adhan' },
      ],
    },
    {
      title: 'Explorer',
      rows: [
        { icon: '❤️', label: 'Mes favoris', sub: `${favorites.length} sauvegardé${favorites.length > 1 ? 's' : ''}`, route: '/reservations' },
        { icon: '🗺️', label: 'Destinations', sub: 'Villes halal-friendly', route: '/destinations' },
      ],
    },
    {
      title: 'À propos',
      rows: [
        { icon: '🌙', label: 'VoyagesHalal', sub: 'Version 1.0.0' },
        { icon: '🗺️', label: 'Données cartographiques', sub: 'OpenStreetMap & VoyagesHalal' },
        { icon: '✉️', label: 'Nous contacter', url: 'mailto:contact@voyageshalal.fr' },
      ],
    },
  ];

  const press = (row: Row) => {
    if (row.label === 'VoyagesHalal') onVersionTap();
    else if (row.route) router.push(row.route);
    else if (row.url) Linking.openURL(row.url).catch(() => undefined);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🌙</Text>
        </View>
        <Text style={styles.name}>Salam aleykoum 👋</Text>
        <Text style={styles.tagline}>Voyagez serein, partout dans le monde</Text>
      </View>

      <View style={styles.captureWrap}>
        <CaptureCard />
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.card}>
            {section.rows.map((row, i) => {
              const nav = !!row.route || !!row.url;
              const tappable = nav || row.label === 'VoyagesHalal';
              return (
                <Pressable
                  key={row.label}
                  disabled={!tappable}
                  onPress={() => press(row)}
                  style={[styles.row, i < section.rows.length - 1 && styles.rowBorder]}
                >
                  <Text style={styles.rowIcon}>{row.icon}</Text>
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    {row.sub ? <Text style={styles.rowSub}>{row.sub}</Text> : null}
                  </View>
                  {nav ? <Text style={styles.chevron}>›</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {admin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin</Text>
          <View style={styles.card}>
            <Pressable style={[styles.row, styles.rowBorder]} onPress={() => router.push('/admin-spot')}>
              <Text style={styles.rowIcon}>➕</Text>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Ajouter un spot</Text>
                <Text style={styles.rowSub}>Semer un spot de prière sur place</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
            <Pressable style={styles.row} onPress={exitAdmin}>
              <Text style={styles.rowIcon}>🔓</Text>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Quitter le mode admin</Text>
              </View>
            </Pressable>
          </View>
        </View>
      )}

      <Text style={styles.footer}>Fait avec ❤️ pour la communauté musulmane</Text>

      <Modal visible={codeModal} transparent animationType="fade" onRequestClose={() => setCodeModal(false)}>
        <Pressable style={styles.modalBg} onPress={() => setCodeModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Clé admin</Text>
            <TextInput
              value={code}
              onChangeText={(t) => {
                setCode(t);
                setCodeErr(false);
              }}
              placeholder="Clé serveur"
              placeholderTextColor={Brand.creamMuted}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={styles.modalInput}
            />
            {codeErr && <Text style={styles.modalErr}>Clé trop courte (min. 6).</Text>}
            <Pressable style={styles.modalBtn} onPress={submitCode}>
              <Text style={styles.modalBtnText}>Débloquer</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.night },
  content: { paddingBottom: Spacing.xl * 3 },

  hero: { alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 70 : 50, paddingBottom: Spacing.lg },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Brand.forest,
    borderWidth: 2,
    borderColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 38 },
  name: { color: Brand.cream, fontSize: 22, fontWeight: '800', marginTop: Spacing.sm },
  tagline: { color: Brand.creamMuted, fontSize: 14, marginTop: 4 },

  captureWrap: { paddingHorizontal: Spacing.lg, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.md },
  sectionTitle: { color: Brand.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  card: { backgroundColor: Brand.forest, borderRadius: Radius.md, borderWidth: 1, borderColor: Brand.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Brand.border },
  rowIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  rowText: { flex: 1 },
  rowLabel: { color: Brand.cream, fontSize: 15, fontWeight: '700' },
  rowSub: { color: Brand.creamMuted, fontSize: 13, marginTop: 2 },
  chevron: { color: Brand.creamMuted, fontSize: 22, fontWeight: '700' },

  footer: { color: Brand.creamMuted, fontSize: 12, textAlign: 'center', marginTop: Spacing.xl },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  modalCard: { width: '100%', maxWidth: 340, backgroundColor: Brand.forest, borderRadius: Radius.md, borderWidth: 1, borderColor: Brand.gold, padding: Spacing.lg, gap: Spacing.sm },
  modalTitle: { color: Brand.cream, fontSize: 17, fontWeight: '800' },
  modalInput: { backgroundColor: Brand.night, borderRadius: Radius.md, borderWidth: 1, borderColor: Brand.border, padding: Spacing.md, color: Brand.cream, fontSize: 15 },
  modalErr: { color: '#e8b04b', fontSize: 12, fontWeight: '700' },
  modalBtn: { backgroundColor: Brand.gold, borderRadius: Radius.pill, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  modalBtnText: { color: Brand.night, fontWeight: '800', fontSize: 15 },
});
