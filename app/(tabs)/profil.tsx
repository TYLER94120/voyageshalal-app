import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ProfilScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.avatar}>
        <ThemedText style={styles.avatarText}>👤</ThemedText>
      </ThemedView>
      <ThemedText type="title" style={styles.name}>Mon Profil</ThemedText>

      <ThemedView style={styles.menu}>
        {[
          { icon: '⚙️', label: 'Paramètres' },
          { icon: '🔔', label: 'Notifications' },
          { icon: '❓', label: 'Aide & Support' },
          { icon: '📜', label: 'Conditions d\'utilisation' },
          { icon: '🚪', label: 'Se déconnecter' },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem}>
            <ThemedText style={styles.menuIcon}>{item.icon}</ThemedText>
            <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 48,
  },
  name: {
    marginBottom: 32,
  },
  menu: {
    width: '100%',
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    gap: 12,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuLabel: {
    fontSize: 16,
  },
});
