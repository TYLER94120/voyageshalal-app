import { Linking, Platform } from 'react-native';

/**
 * Ouvre l'app Maps en itinéraire vers le point donné.
 * URL universelle Google Maps : ouvre l'app si installée, sinon le navigateur,
 * sur iOS comme Android.
 */
export function openDirections(latitude: number, longitude: number): void {
  const dest = `${latitude},${longitude}`;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`;
  Linking.openURL(url).catch(() => {
    // Repli : schéma natif géo/Apple plans.
    const fallback = Platform.select({
      ios: `http://maps.apple.com/?daddr=${dest}`,
      default: `geo:0,0?q=${dest}`,
    });
    if (fallback) Linking.openURL(fallback).catch(() => undefined);
  });
}

/** Itinéraire vers un lieu décrit par texte (nom + ville) quand on n'a pas de coords. */
export function openDirectionsQuery(query: string): void {
  const dest = encodeURIComponent(query);
  const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  Linking.openURL(url).catch(() => undefined);
}
