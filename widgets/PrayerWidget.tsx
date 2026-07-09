import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { WidgetContent } from '@/lib/widgetContent';

// Palette de marque (constants/theme n'est pas importable dans le contexte
// headless du widget sans tirer tout React Native → valeurs locales).
const NIGHT = '#0b1a0f';
const FOREST = '#1b4332';
const GOLD = '#c9a84c';
const CREAM = '#fdfaf3';
const MUTED = '#b9c4ba';

/**
 * Widget d'écran d'accueil : les 5 horaires du jour, toujours visibles,
 * prochaine prière en doré. Un tap ouvre l'app.
 */
export function PrayerWidget({ content }: { content: WidgetContent }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        flex: 1,
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: NIGHT,
        borderRadius: 20,
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TextWidget
          text={`🕌 ${content.city ?? 'Prière'}`}
          style={{ fontSize: 12, color: MUTED, fontWeight: '700' }}
        />
        <TextWidget
          text={`→ ${content.nextLabel}`}
          style={{ fontSize: 12, color: GOLD, fontWeight: '700' }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 8,
        }}
      >
        {content.rows.map((r) => (
          <FlexWidget
            key={r.key}
            style={{
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: r.isNext ? GOLD : FOREST,
              borderRadius: 12,
              paddingVertical: 6,
              paddingHorizontal: 8,
            }}
          >
            <TextWidget
              text={r.label}
              style={{ fontSize: 10, color: r.isNext ? NIGHT : MUTED, fontWeight: '700' }}
            />
            <TextWidget
              text={r.time}
              style={{ fontSize: 13, color: r.isNext ? NIGHT : CREAM, fontWeight: '700' }}
            />
          </FlexWidget>
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}
