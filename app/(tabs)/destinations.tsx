import { StyleSheet, FlatList } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const DESTINATIONS = [
  { id: '1', name: 'Maroc', emoji: '🇲🇦', description: 'Culture, histoire et gastronomie halal' },
  { id: '2', name: 'Turquie', emoji: '🇹🇷', description: 'Entre Orient et Occident' },
  { id: '3', name: 'Émirats Arabes Unis', emoji: '🇦🇪', description: 'Luxe et modernité' },
  { id: '4', name: 'Indonésie', emoji: '🇮🇩', description: 'Nature et spiritualité' },
  { id: '5', name: 'Malaisie', emoji: '🇲🇾', description: 'Diversité et saveurs' },
  { id: '6', name: 'Jordanie', emoji: '🇯🇴', description: 'Petra et mer Morte' },
  { id: '7', name: 'Égypte', emoji: '🇪🇬', description: 'Pyramides et patrimoine' },
  { id: '8', name: 'Tunisie', emoji: '🇹🇳', description: 'Méditerranée et désert' },
];

export default function DestinationsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Destinations</ThemedText>
      <FlatList
        data={DESTINATIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThemedView style={styles.card}>
            <ThemedText style={styles.emoji}>{item.emoji}</ThemedText>
            <ThemedView style={styles.cardContent}>
              <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
              <ThemedText style={styles.description}>{item.description}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}
        contentContainerStyle={styles.list}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 16,
  },
  emoji: {
    fontSize: 40,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  description: {
    opacity: 0.7,
    fontSize: 14,
  },
});
