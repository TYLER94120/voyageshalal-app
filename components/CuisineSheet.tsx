import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';

export interface SheetSort {
  key: string;
  label: string;
}

/**
 * Petite feuille repliable : cuisine (ou gamme d'hôtel) + tri. Remplace la rangée
 * de chips sur l'accueil pour garder la carte propre. Rien qui affecte le
 * défilement — simple Modal en fondu, actions accessibles en bas.
 */
export function CuisineSheet({
  visible,
  title,
  categoryLabel,
  allLabel,
  sorts,
  activeSort,
  onPickSort,
  categories,
  activeCategory,
  onPickCategory,
  onClose,
}: {
  visible: boolean;
  title: string;
  categoryLabel: string;
  allLabel: string;
  sorts: SheetSort[];
  activeSort: string;
  onPickSort: (key: string) => void;
  categories: string[];
  activeCategory: string | null;
  onPickCategory: (c: string | null) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grip} />
          <Text style={styles.title}>{title}</Text>

          <Text style={styles.section}>Trier par</Text>
          <View style={styles.chipsWrap}>
            {sorts.map((s) => {
              const on = activeSort === s.key;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => onPickSort(s.key)}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {categories.length > 0 && (
            <>
              <Text style={styles.section}>{categoryLabel}</Text>
              <ScrollView style={styles.catScroll}>
                <View style={styles.chipsWrap}>
                  <Pressable
                    onPress={() => onPickCategory(null)}
                    style={[styles.chip, !activeCategory && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, !activeCategory && styles.chipTextOn]}>{allLabel}</Text>
                  </Pressable>
                  {categories.map((c) => {
                    const on = activeCategory === c;
                    return (
                      <Pressable
                        key={c}
                        onPress={() => onPickCategory(on ? null : c)}
                        style={[styles.chip, on && styles.chipOn]}
                      >
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{c}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </>
          )}

          <Pressable style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneText}>Voir les résultats</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Brand.night,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderColor: Brand.border,
  },
  grip: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Brand.border, marginBottom: 12 },
  title: { color: Brand.cream, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  section: {
    color: Brand.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 8,
  },
  catScroll: { maxHeight: 200 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    backgroundColor: Brand.forest,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  chipOn: { backgroundColor: Brand.gold, borderColor: Brand.gold },
  chipText: { color: Brand.cream, fontSize: 13, fontWeight: '700' },
  chipTextOn: { color: Brand.night, fontWeight: '800' },
  doneBtn: {
    marginTop: 20,
    backgroundColor: Brand.gold,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneText: { color: Brand.night, fontSize: 15, fontWeight: '800' },
});
