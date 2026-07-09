import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { loadLastLocation } from '@/lib/locationStore';
import { loadSettings } from '@/lib/prayerSettings';
import { buildWidgetContent } from '@/lib/widgetContent';
import { PrayerWidget } from './PrayerWidget';

// Position de repli si l'app n'a encore jamais résolu la géoloc.
const FALLBACK = { latitude: 48.8566, longitude: 2.3522, city: 'Paris' };

/**
 * Handler headless du widget Android : appelé par le système (ajout, mise à
 * jour périodique, redimensionnement) SANS que l'app soit ouverte. Calcule les
 * horaires localement (hors-ligne) depuis la dernière position connue.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const [loc, settings] = await Promise.all([loadLastLocation(), loadSettings()]);
      const l = loc ?? FALLBACK;
      const content = buildWidgetContent(
        l.latitude,
        l.longitude,
        new Date(),
        settings.methodKey,
        settings.madhab,
        'city' in l ? l.city : undefined,
      );
      props.renderWidget(<PrayerWidget content={content} />);
      break;
    }
    default:
      // WIDGET_DELETED / WIDGET_CLICK : rien à faire (le tap ouvre l'app).
      break;
  }
}
