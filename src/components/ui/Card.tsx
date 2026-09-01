import React from 'react';
import { Pressable, View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface CardProps extends ViewProps {
  padded?: boolean;
  /** the 3px left accent bar — v2's one emphasis device, kept on purpose */
  accent?: string;
  /**
   * A tappable card. This is a real Pressable with ripple, role and pressed
   * feedback — the 3.0 replacement for the onTouchEnd-on-a-View pattern that
   * fired when a scroll happened to end on the card.
   */
  onPress?: () => void;
  onLongPress?: () => void;
  /** raise to E2 (active bars, open accordions) */
  raised?: boolean;
}

export function Card({
  padded = true,
  accent,
  onPress,
  onLongPress,
  raised,
  style,
  children,
  ...rest
}: CardProps) {
  const theme = useTheme();
  const base: ViewStyle = {
    ...(raised ? theme.elevation.e2 : theme.elevation.e1),
    borderRadius: theme.radius.lg,
    padding: padded ? theme.spacing.lg : 0,
    ...(accent ? { borderLeftWidth: 3, borderLeftColor: accent } : {}),
  };

  if (onPress || onLongPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onLongPress={onLongPress}
        android_ripple={{ color: theme.alpha.tint08(theme.colors.primary) }}
        style={({ pressed }) => [base, pressed && { opacity: 0.92 }, style as ViewStyle]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View {...rest} style={[base, style]}>
      {children}
    </View>
  );
}
