import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface CardProps extends ViewProps {
  padded?: boolean;
  accent?: string;
}

export function Card({ padded = true, accent, style, children, ...rest }: CardProps) {
  const theme = useTheme();
  const base: ViewStyle = {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: padded ? theme.spacing.lg : 0,
    ...(accent
      ? { borderLeftWidth: 3, borderLeftColor: accent }
      : {}),
  };
  return (
    <View {...rest} style={[base, style]}>
      {children}
    </View>
  );
}
