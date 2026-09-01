import React from 'react';
import { ActivityIndicator, Animated, Pressable, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { lume } from '@/theme';
import { Text } from './Text';
import { Icon } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  color?: string;
  /**
   * Why the button is disabled, said out loud. v2 dimmed to 0.45 opacity and
   * stayed silent; a control that won't act should say what it's waiting for.
   */
  hint?: string;
}

/**
 * 3.0: the primary wears Lume with Lume-ink text (dark text on the glow — the
 * white-on-mint of v2 failed contrast), presses with depth (scale + deep), and
 * the ghost keeps a hairline. `color` still overrides for domain-coloured
 * actions, with white text as before.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  loading,
  fullWidth = true,
  style,
  color,
  hint,
}: ButtonProps) {
  const theme = useTheme();
  const heights: Record<Size, number> = { sm: 38, md: 48, lg: 56 };
  const brand = color ?? theme.colors.primary;
  const isBrand = color == null;
  const scale = React.useRef(new Animated.Value(1)).current;

  const bg: Record<Variant, string> = {
    primary: brand,
    secondary: theme.colors.surfaceAlt,
    ghost: 'transparent',
    danger: theme.colors.danger,
  };
  const fg: Record<Variant, string> = {
    // Dark ink on the Lume fill; white only when a caller supplies its own colour.
    primary: isBrand ? lume.ink : '#fff',
    secondary: theme.colors.text,
    ghost: brand,
    danger: '#fff',
  };
  const pressedBg: Partial<Record<Variant, string>> = {
    primary: isBrand ? theme.colors.primaryDark : brand,
  };

  const press = (to: number) =>
    Animated.timing(scale, { toValue: to, duration: theme.motion.swift, useNativeDriver: true });

  return (
    <View style={{ alignSelf: fullWidth ? 'stretch' : 'flex-start', gap: 6 }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !!disabled, busy: !!loading }}
          onPress={onPress}
          disabled={disabled || loading}
          onPressIn={() => press(0.98).start()}
          onPressOut={() => press(1).start()}
          style={({ pressed }) => [
            {
              height: heights[size],
              borderRadius: theme.radius.sm,
              backgroundColor: pressed ? (pressedBg[variant] ?? bg[variant]) : bg[variant],
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              paddingHorizontal: theme.spacing.lg,
              opacity: disabled ? 0.45 : 1,
              borderWidth: variant === 'ghost' ? 1 : 0,
              borderColor: variant === 'ghost' ? theme.colors.border : 'transparent',
            },
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={fg[variant]} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {icon ? <Icon icon={icon} size={size === 'lg' ? 22 : 18} color={fg[variant]} /> : null}
              <Text variant={size === 'sm' ? 'label' : 'bodyStrong'} color={fg[variant]}>
                {title}
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
      {disabled && hint ? (
        <Text variant="caption" color="textFaint" center>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
