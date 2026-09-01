import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * The double-bezel — 3.0's signature surface.
 *
 * A premium tile never sits flat on the ground: it is a glass plate set into a
 * machined tray. The outer shell is a thin tinted ring — the tray — and the
 * inner core is the E1 surface with concentric curvature (inner radius =
 * outer − inset, so the curves stay parallel the way lathed hardware does).
 *
 * Boldness is spent in exactly one place, and this is the place: PageHero and
 * the primary Button wear it, which puts the identity on every screen without
 * decorating any of them. Resist the urge to bezel everything — a tray full of
 * trays is a drawer.
 */

interface BezelProps {
  children: React.ReactNode;
  /** the tint the tray takes — a session/domain colour; defaults to Lume */
  tint?: string;
  /** outer radius; inner is derived to keep the curves concentric */
  radius?: number;
  /** the tray's visible width */
  inset?: number;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
  padded?: boolean;
}

export function Bezel({
  children,
  tint,
  radius,
  inset = 5,
  style,
  innerStyle,
  padded = true,
}: BezelProps) {
  const theme = useTheme();
  const ring = tint ?? theme.colors.primary;
  const outer = radius ?? theme.radius.xl;
  return (
    <View
      style={[
        {
          borderRadius: outer,
          padding: inset,
          backgroundColor: theme.alpha.tint08(ring),
          borderWidth: 1,
          borderColor: theme.alpha.tint14(ring),
        },
        style,
      ]}
    >
      <View
        style={[
          {
            ...theme.elevation.e1,
            borderRadius: outer - inset,
            padding: padded ? theme.spacing.lg : 0,
            overflow: 'hidden',
          },
          innerStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
