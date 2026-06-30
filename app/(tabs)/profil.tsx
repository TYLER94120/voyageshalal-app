import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useFavorites } from '@/context/FavoritesContext';
import { useTrips } from '@/context/TripsContext';
import { loadSettings } from '@/lib/prayerSettings';
import { METHODS } from '@/lib/prayer';

type Row = { icon: string; label: string; sub?: string; route?: Href; url?: string };

export default function ProfilScreen() {
  const router = useRouter();
  const { favorites } = useFavorites();
  const { trips } = useTrips();
  const [methodLabel, setMethodLabel] = useState<string>('—');

  const tripsSub =
    trips.length > 0 ? `${trips.length} séjour${trips.length > 1 ? 's' : ''} planifié${trips.length > 1 ? 's' : ''}` : 'Planifiez vos journées';

  useEffect(() => {
    loadSettings().then((s) => {
      const m = METHODS.find((x) => x.key === s.methodKey);
      setMethodLabel(m ? m.label : s.methodKey);
    });
  }, []);

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
        { icon: '🗓️', label: 'Mes voyages', sub: tripsSub, route: '/trips' },
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
    if (row.route) router.push(row.route);
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

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.card}>
            {section.rows.map((row, i) => {
              const tappable = !!row.route || !!row.url;
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
                  {tappable ? <Text style={styles.chevron}>›</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <Text style={styles.footer}>Fait avec ❤️ pour la communauté musulmane</Text>
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
});
