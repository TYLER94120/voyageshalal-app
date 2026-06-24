import { StyleSheet, ScrollView, Image } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
    <ScrollView>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.hero}>
          <ThemedText type="title" style={styles.heroTitle}>
            VoyagesHalal 🌙
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Voyagez en toute sérénité, selon vos valeurs
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Destinations populaires</ThemedText>
          <ThemedText style={styles.placeholder}>
            Maroc · Turquie · Émirats Arabes Unis · Indonésie · Malaisie
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Nos services</ThemedText>
          <ThemedText>✈️ Vols halal-friendly</ThemedText>
          <ThemedText>🏨 Hôtels certifiés halal</ThemedText>
          <ThemedText>🍽️ Restauration halal garantie</ThemedText>
          <ThemedText>🕌 Proximité des mosquées</ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  hero: {
    backgroundColor: '#1B5E20',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#A5D6A7',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
    gap: 8,
  },
  placeholder: {
    opacity: 0.6,
  },
});
