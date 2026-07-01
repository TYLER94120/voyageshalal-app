import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import {
  HOTEL_AMENITIES,
  PRICE_BANDS,
  type HotelFacets,
  type HotelFilterState,
  type PriceBand,
} from '@/lib/hotelFilter';

export interface HotelSort {
  key: string;
  label: string;
}

/**
 * Feuille repliée « façon Booking, halal & bien situé ». Groupes : Tri, Budget,
 * Emplacement, Type, Équipements. GRACEFUL : un groupe n'apparaît que si les
 * facettes correspondantes existent (aucune option vide). Fondu simple → aucun
 * impact sur le défilement.
 */
export function HotelFilterSheet({
  visible,
  facets,
  sorts,
  activeSort,
  onPickSort,
  state,
  onChange,
  onReset,
  onClose,
  resultCount,
}: {
  visible: boolean;
  facets: HotelFacets;
  sorts: HotelSort[];
  activeSort: string;
  onPickSort: (key: string) => void;
  state: HotelFilterState;
  onChange: (next: HotelFilterState) => void;
  onReset: () => void;
  onClose: () => void;
  resultCount: number;
}) {
  const toggleBand = (b: PriceBand) =>
    onChange({
      ...state,
      bands: state.bands.includes(b) ? state.bands.filter((x) => x !== b) : [...state.bands, b],
    });
  const toggleType = (t: string) =>
    onChange({
      ...state,
      types: state.types.includes(t) ? state.types.filter((x) => x !== t) : [...state.types, t],
    });
  const toggleAmenity = (k: string) =>
    onChange({
      ...state,
      amenities: state.amenities.includes(k)
        ? state.amenities.filter((x) => x !== k)
        : [...state.amenities, k],
    });

  const chip = (label: string, on: boolean, onPress: () => void, key: string) => (
    <Pressable key={key} onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );

  const bandChips = PRICE_BANDS.filter((b) => facets.bands.includes(b.key));
  const amenityDefs = HOTEL_AMENITIES.filter((a) => facets.amenities.includes(a.key));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grip} />
          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            <Text style={styles.title}>🏨 Filtrer & trier les hôtels</Text>

            <Text style={styles.section}>Trier par</Text>
            <View style={styles.wrap}>
              {sorts.map((s) => chip(s.label, activeSort === s.key, () => onPickSort(s.key), s.key))}
            </View>

            {bandChips.length > 0 && (
              <>
                <Text style={styles.section}>💶 Budget / nuit</Text>
                <View style={styles.wrap}>
                  {bandChips.map((b) => chip(b.label, state.bands.includes(b.key), () => toggleBand(b.key), b.key))}
                </View>
              </>
            )}

            {(facets.hasLocation || facets.hasRestos) && (
              <>
                <Text style={styles.section}>🕌 Emplacement</Text>
                <View style={styles.wrap}>
                  {facets.hasLocation &&
                    chip(
                      '🕌 ≤ 500 m d’une mosquée',
                      state.nearMosque,
                      () => onChange({ ...state, nearMosque: !state.nearMosque }),
                      'nearMosque',
                    )}
                  {facets.hasRestos &&
                    chip(
                      '🍽️ Restos halal autour',
                      state.restosAround,
                      () => onChange({ ...state, restosAround: !state.restosAround }),
                      'restosAround',
                    )}
                </View>
              </>
            )}

            {facets.types.length > 0 && (
              <>
                <Text style={styles.section}>🏨 Type</Text>
                <View style={styles.wrap}>
                  {facets.types.map((t) => chip(t, state.types.includes(t), () => toggleType(t), t))}
                </View>
              </>
            )}

            {amenityDefs.length > 0 && (
              <>
                <Text style={styles.section}>✅ Équipements halal</Text>
                <View style={styles.wrap}>
                  {amenityDefs.map((a) =>
                    chip(a.label, state.amenities.includes(a.key), () => toggleAmenity(a.key), a.key),
                  )}
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.resetBtn} onPress={onReset}>
              <Text style={styles.resetText}>Effacer</Text>
            </Pressable>
            <Pressable style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneText}>Voir {resultCount} hôtel{resultCount > 1 ? 's' : ''}</Text>
            </Pressable>
          </View>
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
    paddingTop: 10,
    maxHeight: '82%',
    borderTopWidth: 1,
    borderColor: Brand.border,
  },
  grip: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Brand.border, marginBottom: 6 },
  body: { paddingHorizontal: Spacing.lg },
  title: { color: Brand.cream, fontSize: 18, fontWeight: '800', marginTop: 6, marginBottom: 2 },
  section: {
    color: Brand.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
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
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: Spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
  resetBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: { color: Brand.cream, fontSize: 14, fontWeight: '700' },
  doneBtn: {
    flex: 1,
    backgroundColor: Brand.gold,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneText: { color: Brand.night, fontSize: 15, fontWeight: '800' },
});
