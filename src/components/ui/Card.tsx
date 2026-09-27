import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
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
  /** optional background image that takes the full card with a gradual opacity scrim */
  imageUri?: string;
  /** translucent glassmorphic look */
  translucent?: boolean;
}

export function Card({
  padded = true,
  accent,
  onPress,
  onLongPress,
  raised,
  imageUri,
  translucent,
  style,
  children,
  ...rest
}: CardProps) {
  const theme = useTheme();
  const uid = React.useId().replace(/:/g, '');
  const scrimId = `card-scrim-${uid}`;

  const base: ViewStyle = {
    ...(raised ? theme.elevation.e2 : theme.elevation.e1),
    borderRadius: theme.radius.lg,
    padding: padded ? theme.spacing.lg : 0,
    // The elevation tokens own the surface, the hairline and the top-light.
    // Only the two opt-in looks change them.
    ...(translucent ? { backgroundColor: theme.alpha.tint08(theme.colors.surface) } : {}),
    ...(imageUri ? { overflow: 'hidden' as const } : {}),
    ...(accent ? { borderLeftWidth: 3, borderLeftColor: accent } : {}),
  };

  const content = (
    <>
      {imageUri && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]}>
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {/* Gradual opacity overlay: clearer at top/focal point, darker at bottom */}
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
            <Defs>
              <LinearGradient id={scrimId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={theme.colors.bg} stopOpacity={0.25} />
                <Stop offset="45%" stopColor={theme.colors.surface} stopOpacity={0.7} />
                <Stop offset="100%" stopColor={theme.colors.surface} stopOpacity={0.96} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${scrimId})`} />
          </Svg>
        </View>
      )}
      {/*
        Children are rendered DIRECTLY, never inside a wrapper: cards all over
        the app pass gap, flexDirection and alignItems in `style`, and those
        only reach direct children. The image layer is absolute and drawn
        first, so the children sit above it without help.
      */}
      {children}
    </>
  );

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
        {content}
      </Pressable>
    );
  }

  return (
    <View {...rest} style={[base, style]}>
      {content}
    </View>
  );
}

