import { Pressable, type StyleProp, Text, type ViewStyle } from 'react-native';

import { useFavorites } from '@/context/FavoritesContext';
import type { FavoriteItem } from '@/lib/favorites';

/** Cœur de favori : plein (❤️) si sauvegardé, vide (🤍) sinon. Toggle au tap. */
export function HeartButton({
  item,
  size = 22,
  style,
}: {
  item: Omit<FavoriteItem, 'addedAt'>;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { isFavorite, toggle } = useFavorites();
  const on = isFavorite(item.id);
  return (
    <Pressable hitSlop={10} onPress={() => toggle(item)} style={style}>
      <Text style={{ fontSize: size }}>{on ? '❤️' : '🤍'}</Text>
    </Pressable>
  );
}
