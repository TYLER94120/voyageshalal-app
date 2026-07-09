import { requestWidgetUpdate } from 'react-native-android-widget';

import { loadLastLocation } from '@/lib/locationStore';
import { loadSettings } from '@/lib/prayerSettings';
import { buildWidgetContent } from '@/lib/widgetContent';
import { PrayerWidget } from './PrayerWidget';

const FALLBACK = { latitude: 48.8566, longitude: 2.3522, city: 'Paris' as string | undefined };

/** Redessine le widget avec la position/le jour courants (appelé à l'ouverture). */
export async function refreshPrayerWidget(): Promise<void> {
  const [loc, settings] = await Promise.all([loadLastLocation(), loadSettings()]);
  const l = loc ?? FALLBACK;
  const content = buildWidgetContent(
    l.latitude,
    l.longitude,
    new Date(),
    settings.methodKey,
    settings.madhab,
    l.city,
  );
  await requestWidgetUpdate({
    widgetName: 'PrayerWidget',
    renderWidget: () => <PrayerWidget content={content} />,
    // Aucun widget posé : rien à faire.
    widgetNotFound: () => undefined,
  });
}
