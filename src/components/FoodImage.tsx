import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from '@/components/ui/Icon';
import { FOOD_IMAGES } from '@/data/foodImages';
import { foodTile, isLocalImage } from '@/lib/foodTile';

/**
 * The picture of a food.
 *
 * In order: the photograph you took of it, the photograph bundled with the
 * catalogue, and failing both a tile in the colour of its kind. Nothing here
 * loads from the internet, and a picture that has gone missing from storage
 * falls back to the tile instead of leaving a hole.
 */

interface Props {
  /** catalogue id, e.g. "tn-brik" */
  foodId?: string | null;
  /** a file in the app's own storage */
  imageUri?: string | null;
  category?: string | null;
  form?: 'solid' | 'liquid' | null;
  size?: number;
  radius?: number;
}

export function FoodImage({ foodId, imageUri, category, form, size = 44, radius }: Props) {
  const theme = useTheme();
  const [broken, setBroken] = useState(false);
  const r = radius ?? Math.round(size * 0.27);

  const local = !broken && isLocalImage(imageUri) ? imageUri : null;
  const bundled = !local && foodId ? FOOD_IMAGES[foodId] : undefined;

  if (local || bundled != null) {
    return (
      <Image
        source={local ? { uri: local } : (bundled as number)}
        onError={() => setBroken(true)}
        style={{ width: size, height: size, borderRadius: r, backgroundColor: theme.colors.surfaceAlt }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    );
  }

  const tile = foodTile(category, form);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        backgroundColor: theme.alpha.tint14(tile.color),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon icon={tile.icon} size={Math.round(size * 0.46)} color={tile.color} />
    </View>
  );
}
