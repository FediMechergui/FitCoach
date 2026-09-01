import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { typography, FONT_BY_VARIANT } from '@/theme';
import { fontsLoaded } from '@/theme/fonts';

type Variant = keyof typeof typography;
type ColorKey = 'text' | 'textMuted' | 'textFaint' | 'primary' | 'accent' | 'danger' | 'warning' | 'success';

interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: ColorKey | string;
  center?: boolean;
}

/**
 * All app text. Two families since 3.0 — Space Grotesk for display, headings
 * and every number (true tabular figures), Inter for body and labels — applied
 * per variant once the fonts are loaded; before that (or if loading failed) the
 * sizes and weights alone carry the hierarchy in the system face.
 *
 * The floor is 11px: no variant sits below it, and per-style overrides must not
 * take one there either. Nour reads this app at 130% font scale at 4 a.m.
 */
export function Text({ variant = 'body', color = 'text', center, style, ...rest }: TextProps) {
  const theme = useTheme();
  const resolvedColor =
    color in theme.colors ? (theme.colors as Record<string, string>)[color] : color;
  const base = typography[variant] as TextStyle;
  const family = fontsLoaded() ? { fontFamily: FONT_BY_VARIANT[variant] } : null;
  return (
    <RNText
      {...rest}
      style={[base, family, { color: resolvedColor }, center && { textAlign: 'center' }, style]}
    />
  );
}
