import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme';

type Variant = keyof typeof typography;
type ColorKey = 'text' | 'textMuted' | 'textFaint' | 'primary' | 'accent' | 'danger' | 'warning' | 'success';

interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: ColorKey | string;
  center?: boolean;
}

export function Text({ variant = 'body', color = 'text', center, style, ...rest }: TextProps) {
  const theme = useTheme();
  const resolvedColor =
    color in theme.colors ? (theme.colors as Record<string, string>)[color] : color;
  const base = typography[variant] as TextStyle;
  return (
    <RNText
      {...rest}
      style={[base, { color: resolvedColor }, center && { textAlign: 'center' }, style]}
    />
  );
}
