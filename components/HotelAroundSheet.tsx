import { useEffect, useMemo, useRef } from 'react';
import { BackHandler, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, Region } from 'react-native-maps';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { formatDistance } from '@/lib/geo';
import { openDirections, openMapsUrl } from '@/lib/maps';
import { nearbyLieux } from '@/lib/hotelLocation';
import { type Lieu } from '@/lib/api';

// Rayons « à pied » autour de l'hôtel.
const MOSQUE_RADIUS_KM = 3;
const RESTO_RADIUS_KM = 1.5;

/**
 * Vue « autour de l'hôtel » : mini-carte centrée sur l'hôtel + mosquées et
 * restaurants halal à proximité, avec distances et itinéraires. C'est l'argument
 * décisif pour choisir où dormir quand on voyage en tant que musulman.
 */
export function HotelAroundSheet({
  hotel,
  mosquees,
  restaurants,
  onClose,
}: {
  hotel: Lieu;
  mosquees: Lieu[];
  restaurants: Lieu[];
  onClose: () => void;
}) {
  const mapRef = useRef<MapView>(null);
  const hlat = hotel.latitude!;
  const hlng = hotel.longitude!;

  const nearMosquees = useMemo(
    () => nearbyLieux(hlat, hlng, mosquees, MOSQUE_RADIUS_KM, 8),
    [hlat, hlng, mosquees],
  );
  const nearRestos = useMemo(
    () => nearbyLieux(hlat, hlng, restaurants, RESTO_RADIUS_KM, 15),
    [hlat, hlng, restaurants],
  );

  // Fermer avec le bouton retour Android.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  // Cadrer la carte sur l'hôtel + les lieux proches.
  useEffect(() => {
    const coords = [
      { latitude: hlat, longitude: hlng },
      ...nearMosquees.map((n) => ({ latitude: n.lieu.latitude!, longitude: n.lieu.longitude! })),
      ...nearRestos.slice(0, 8).map((n) => ({ latitude: n.lieu.latitude!, longitude: n.lieu.longitude! })),
    ];
    const t = setTimeout(() => {
      if (coords.length > 1) {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 60, left: 60, right: 60, bottom: 60 },
          animated: true,
        });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [hlat, hlng, nearMosquees, nearRestos]);

  const region: Region = { latitude: hlat, longitude: hlng, latitudeDelta: 0.03, longitudeDelta: 0.03 };

  const nearestMosque = nearMosquees[0];

  return (
    <View style={styles.overlay}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {hotel.nom}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Autour de l'hôtel
            {hotel.category ? ` · ${hotel.category}` : ''}
            {hotel.price ? ` · ${hotel.price}` : ''}
          </Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10} style={styles.close}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      {/* Résumé emplacement */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {nearestMosque
            ? `🕌 Mosquée la plus proche à ${formatDistance(nearestMosque.distKm)}`
            : '🕌 Aucune mosquée référencée à proximité'}
          {nearRestos.length > 0 ? `  ·  🍽️ ${nearRestos.length} restos halal autour` : ''}
        </Text>
      </View>

      {/* Mini-carte */}
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={region}
          showsCompass={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
        >
          {/* Hôtel */}
          <Marker coordinate={{ latitude: hlat, longitude: hlng }} zIndex={99}>
            <View style={styles.hotelPin}>
              <Text style={styles.pinEmoji}>🏨</Text>
            </View>
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{hotel.nom}</Text>
              </View>
            </Callout>
          </Marker>

          {/* Mosquées */}
          {nearMosquees.map((n) => (
            <Marker
              key={`m-${n.lieu.id}`}
              coordinate={{ latitude: n.lieu.latitude!, longitude: n.lieu.longitude! }}
              pinColor="#1b4332"
            >
              <View style={[styles.lieuPin, styles.mosquePin]}>
                <Text style={styles.pinEmojiSm}>🕌</Text>
              </View>
              <Callout tooltip onPress={() => goTo(n.lieu)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutName}>{n.lieu.nom}</Text>
                  <Text style={styles.calloutDist}>🕌 à {formatDistance(n.distKm)}</Text>
                  <View style={styles.calloutCta}>
                    <Text style={styles.calloutCtaText}>🧭 Itinéraire</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}

          {/* Restaurants */}
          {nearRestos.map((n) => (
            <Marker
              key={`r-${n.lieu.id}`}
              coordinate={{ latitude: n.lieu.latitude!, longitude: n.lieu.longitude! }}
              pinColor="#c05621"
            >
              <View style={[styles.lieuPin, styles.restoPin]}>
                <Text style={styles.pinEmojiSm}>🍽️</Text>
              </View>
              <Callout tooltip onPress={() => goTo(n.lieu)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutName}>{n.lieu.nom}</Text>
                  <Text style={styles.calloutDist}>🍽️ à {formatDistance(n.distKm)}</Text>
                  <View style={styles.calloutCta}>
                    <Text style={styles.calloutCtaText}>🧭 Itinéraire</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Listes proches */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listPad}>
        <Section
          title="🕌 Mosquées à proximité"
          empty="Aucune mosquée géolocalisée autour de cet hôtel."
          items={nearMosquees}
          onGo={goTo}
        />
        <Section
          title="🍽️ Restaurants halal à proximité"
          empty="Aucun restaurant géolocalisé dans le rayon de marche."
          items={nearRestos}
          onGo={goTo}
        />

        <View style={styles.actions}>
          {hotel.halalBookingUrl ? (
            <Pressable
              style={styles.bookBtn}
              onPress={() => Linking.openURL(hotel.halalBookingUrl!).catch(() => undefined)}
            >
              <Text style={styles.bookText}>🕌 Réserver halal</Text>
            </Pressable>
          ) : null}
          {hotel.bookingUrl ? (
            <Pressable
              style={styles.actionBtn}
              onPress={() => Linking.openURL(hotel.bookingUrl!).catch(() => undefined)}
            >
              <Text style={styles.actionText}>Réserver</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.actionBtn} onPress={() => goTo(hotel)}>
            <Text style={styles.actionText}>🧭 Aller à l'hôtel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function goTo(l: Lieu) {
  if (l.mapsUrl) openMapsUrl(l.mapsUrl);
  else if (l.latitude != null && l.longitude != null) openDirections(l.latitude, l.longitude);
}

function Section({
  title,
  empty,
  items,
  onGo,
}: {
  title: string;
  empty: string;
  items: { lieu: Lieu; distKm: number }[];
  onGo: (l: Lieu) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.sectionEmpty}>{empty}</Text>
      ) : (
        items.map((n) => (
          <View key={n.lieu.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowName} numberOfLines={1}>
                {n.lieu.nom}
              </Text>
              <Text style={styles.rowDist}>{formatDistance(n.distKm)} à pied</Text>
            </View>
            <Pressable style={styles.rowBtn} onPress={() => onGo(n.lieu)} hitSlop={8}>
              <Text style={styles.rowBtnText}>🧭 Y aller</Text>
            </Pressable>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Brand.night, zIndex: 1000 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 54,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerText: { flex: 1 },
  title: { color: Brand.cream, fontSize: 20, fontWeight: '800' },
  subtitle: { color: Brand.creamMuted, fontSize: 13, fontWeight: '600', marginTop: 2 },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: Brand.cream, fontSize: 16, fontWeight: '800' },

  summary: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  summaryText: { color: Brand.gold, fontSize: 13, fontWeight: '800' },

  mapWrap: { height: 280, backgroundColor: Brand.forest },

  hotelPin: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Brand.gold,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinEmoji: { fontSize: 20 },
  lieuPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mosquePin: { backgroundColor: '#1b4332' },
  restoPin: { backgroundColor: '#c05621' },
  pinEmojiSm: { fontSize: 15 },

  callout: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    width: 190,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  calloutName: { fontWeight: '700', fontSize: 14, color: '#111' },
  calloutDist: { fontSize: 12, color: '#666', fontWeight: '700' },
  calloutCta: { marginTop: 4, backgroundColor: Brand.forest, borderRadius: Radius.sm, paddingVertical: 7, alignItems: 'center' },
  calloutCtaText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  list: { flex: 1 },
  listPad: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xl * 2 },

  section: { gap: Spacing.sm },
  sectionTitle: { color: Brand.cream, fontSize: 16, fontWeight: '800' },
  sectionEmpty: { color: Brand.creamMuted, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    backgroundColor: Brand.forest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.md,
  },
  rowText: { flex: 1 },
  rowName: { color: Brand.cream, fontSize: 15, fontWeight: '700' },
  rowDist: { color: Brand.gold, fontSize: 12, fontWeight: '700', marginTop: 2 },
  rowBtn: { backgroundColor: Brand.goldSoft, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 7, borderWidth: 1, borderColor: Brand.border },
  rowBtnText: { color: Brand.gold, fontSize: 12, fontWeight: '800' },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  bookBtn: { paddingHorizontal: Spacing.md, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: Brand.gold },
  bookText: { color: Brand.night, fontSize: 13, fontWeight: '800' },
  actionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    backgroundColor: Brand.goldSoft,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  actionText: { color: Brand.gold, fontSize: 13, fontWeight: '700' },
});
