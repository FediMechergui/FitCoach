import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { Icon } from './Icon';

interface PageHeroProps {
  /** semantic icon key, e.g. 'nutrition.calories' */
  icon?: string;
  /** the page's accent — tints the icon tile and the icon */
  color?: string;
  title: string;
  /** one muted line under the title; keep it to a sentence or two */
  subtitle?: string;
  /** something to sit at the right edge — a Badge, a small button */
  right?: React.ReactNode;
}

/**
 * The top of every pushed page: a tinted icon tile, the page title, and an
 * optional one-line subtitle. The native header carries only the back arrow
 * on these pages, so this IS the title — one per page, never two.
 *
 * Shared so every page opens the same way: same tile, same size, same gap.
 * A page's colour comes in through `color`, nothing else varies.
 */
/** A subtitle up to this long sits beside the tile; longer ones run full width beneath. */
const INLINE_SUBTITLE_MAX = 100;

export function PageHero({ icon, color, title, subtitle, right }: PageHeroProps) {
  const theme = useTheme();
  const tint = color ?? theme.colors.primary;
  const inline = !!subtitle && subtitle.length <= INLINE_SUBTITLE_MAX;
  const below = !!subtitle && !inline;
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {icon ? (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: theme.radius.md,
              backgroundColor: tint + '1F',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon icon={icon} size={24} color={tint} />
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="h1">{title}</Text>
          {inline ? (
            <Text variant="body" color="textMuted">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ?? null}
      </View>
      {below ? (
        <Text variant="body" color="textMuted">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
