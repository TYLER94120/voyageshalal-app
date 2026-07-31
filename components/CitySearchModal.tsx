import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { type VilleSummary } from '@/lib/api';
import { getVillesCached } from '@/lib/cityCache';
import { Brand, Radius, Spacing } from '@/constants/theme';

type LoadState = 'loading' | 'ready' | 'error';

const TOP_PAD = Spacing.lg;

// Panneau plein écran (overlay absolu) — fiable sur Android, contrairement au
// composant <Modal> natif qui s'affiche mal au-dessus d'une MapView.
export function CitySearchModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (ville: VilleSummary) => void;
}) {
  const [villes, setVilles] = useState<VilleSummary[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [query, setQuery] = useState('');
  // Compteur de tentatives : « Réessayer » l'incrémente pour relancer l'effet
  // (dépendre de villes.length ne marchait pas — 0 avant ET après l'échec).
  const [attempt, setAttempt] = useState(0);

  // Charge la liste à l'ouverture (avec cache hors-ligne, comme Destinations).
  useEffect(() => {
    if (!visible || villes.length > 0) return;
    let alive = true;
    setState('loading');
    getVillesCached()
      .then(({ data }) => {
        if (!alive) return;
        setVilles(data);
        setState('ready');
      })
      .catch(() => {
        if (alive) setState('error');
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, attempt]);

  // Bouton retour Android → ferme le panneau.
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return villes;
    return villes.filter(
      (v) =>
        v.nom.toLowerCase().includes(q) ||
        (v.region?.toLowerCase().includes(q) ?? false) ||
        (v.pays?.toLowerCase().includes(q) ?? false),
    );
  }, [villes, query]);

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { paddingTop: TOP_PAD }]}>
      <View style={styles.handleRow}>
        <Text style={styles.title}>Où veux-tu aller ?</Text>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔎</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher une ville…"
          placeholderTextColor={Brand.creamMuted}
          style={styles.input}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Text style={styles.clear}>✕</Text>
          </Pressable>
        )}
      </View>

      {state === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.gold} />
          <Text style={styles.muted}>Chargement des villes…</Text>
        </View>
      )}

      {state === 'error' && (
        <View style={styles.center}>
          <Text style={styles.errEmoji}>📡</Text>
          <Text style={styles.muted}>Impossible de charger les villes. Vérifie ta connexion.</Text>
          <Pressable style={styles.retry} onPress={() => setAttempt((a) => a + 1)}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      )}

      {state === 'ready' && (
        <FlatList
          data={filtered}
          keyExtractor={(v) => v.slug}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={[styles.muted, styles.empty]}>Aucune ville pour « {query} ».</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <Text style={styles.rowEmoji}>🕌</Text>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{item.nom}</Text>
                {(item.region || item.pays) && (
                  <Text style={styles.rowSub}>{[item.region, item.pays].filter(Boolean).join(' · ')}</Text>
                )}
              </View>
              <Text style={styles.rowGo}>›</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: Brand.night,
    paddingHorizontal: Spacing.lg,
  },
  handleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  title: { color: Brand.cream, fontSize: 22, fontWeight: '800' },
  closeBtn: { padding: 4 },
  close: { color: Brand.gold, fontSize: 22, fontWeight: '800' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.forest,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  input: { flex: 1, color: Brand.cream, fontSize: 15, paddingVertical: 0 },
  clear: { color: Brand.creamMuted, fontSize: 16 },

  list: { paddingVertical: Spacing.md, gap: Spacing.sm },
  empty: { textAlign: 'center', marginTop: Spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  rowEmoji: { fontSize: 20 },
  rowText: { flex: 1 },
  rowName: { color: Brand.cream, fontSize: 16, fontWeight: '700' },
  rowSub: { color: Brand.gold, fontSize: 12, fontWeight: '600', marginTop: 2 },
  rowGo: { color: Brand.gold, fontSize: 24, fontWeight: '300' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl },
  errEmoji: { fontSize: 40 },
  muted: { color: Brand.creamMuted, fontSize: 14, textAlign: 'center' },
  retry: {
    marginTop: Spacing.sm,
    backgroundColor: Brand.gold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  retryText: { color: Brand.night, fontWeight: '800', fontSize: 14 },
});
