import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { Icon } from './Icon';
import { Bezel } from './Bezel';

interface PageHeroProps {
  /** semantic icon key, e.g. 'nutrition.calories' */
  icon?: string;
  /** the page's accent — tints the bezel tray, the icon tile and the eyebrow */
  color?: string;
  title: string;
  /** one muted line under the title; keep it to a sentence or two */
  subtitle?: string;
  /**
   * The tracked uppercase line above the title — the coach's register.
   * "PUSH DAY", "RECOVERY", "YOUR STACK". Optional; screens adopt it as they
   * are rebuilt.
   */
  eyebrow?: string;
  /** something to sit at the right edge — a Badge, a small button */
  right?: React.ReactNode;
}

/**
 * The top of every pushed page: since 3.0, a double-bezel tile — the machined
 * tray, tinted in the page's accent — carrying the tinted 44 icon tile, the
 * h1, and an optional one-line subtitle. The native header carries only the
 * back arrow on these pages, so this IS the title — one per page, never two.
 *
 * The geometry contract (44 tile, 24 icon, h1, the 100-char subtitle rule) is
 * script-verified and survives the redesign untouched; the bezel is dressing
 * AROUND it, not a change TO it.
 */
/** A subtitle up to this long sits beside the tile; longer ones run full width beneath. */
const INLINE_SUBTITLE_MAX = 100;

export function PageHero({ icon, color, title, subtitle, eyebrow, right }: PageHeroProps) {
  const theme = useTheme();
  const tint = color ?? theme.colors.primary;
  const inline = !!subtitle && subtitle.length <= INLINE_SUBTITLE_MAX;
  const below = !!subtitle && !inline;
  return (
    <Bezel tint={tint}>
      <View style={{ gap: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {icon ? (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: theme.radius.md,
                backgroundColor: theme.alpha.tint14(tint),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon icon={icon} size={24} color={tint} />
            </View>
          ) : null}
          <View style={{ flex: 1, gap: 2 }}>
            {eyebrow ? (
              <Text variant="eyebrow" style={{ color: tint }}>
                {eyebrow}
              </Text>
            ) : null}
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
    </Bezel>
  );
}
