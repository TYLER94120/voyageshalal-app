import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ReservationsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Mes Réservations</ThemedText>
      <ThemedView style={styles.empty}>
        <ThemedText style={styles.emptyIcon}>📋</ThemedText>
        <ThemedText type="subtitle">Aucune réservation</ThemedText>
        <ThemedText style={styles.hint}>
          Vos voyages réservés apparaîtront ici
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
  },
  hint: {
    opacity: 0.6,
    textAlign: 'center',
  },
});
