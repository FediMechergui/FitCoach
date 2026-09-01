import React from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { lume, motion } from '@/theme';
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

const HOUSE_EASING = Easing.bezier(motion.bezier[0], motion.bezier[1], motion.bezier[2], motion.bezier[3]);

/**
 * 3.0.1 — the CTA becomes hardware. Md/lg buttons are full pills; the primary
 * sits in its own thin tinted ring (the double-bezel, shared with PageHero) and
 * presses with real physics: scale into Lume-deep on the house curve, never a
 * flat opacity blink. An icon on a primary rides in its own circular well at
 * the trailing edge — a control inside a control, machined flush.
 *
 * The primary wears Lume with Lume-ink text; white text only when a caller
 * supplies its own colour. `sm` stays rectangular and flat — dense rows are no
 * place for jewellery.
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
    primary: isBrand ? lume.ink : '#fff',
    secondary: theme.colors.text,
    ghost: brand,
    danger: '#fff',
  };
  const pressedBg: Partial<Record<Variant, string>> = {
    primary: isBrand ? theme.colors.primaryDark : brand,
  };

  const pill = size !== 'sm';
  const ringed = pill && variant === 'primary' && !disabled;
  const trailingWell = pill && (variant === 'primary' || variant === 'danger') && !!icon;

  const press = (to: number) =>
    Animated.timing(scale, {
      toValue: to,
      duration: theme.motion.swift,
      easing: HOUSE_EASING,
      useNativeDriver: true,
    });

  const core = (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => press(0.97).start()}
      onPressOut={() => press(1).start()}
      style={({ pressed }) => [
        {
          height: heights[size],
          borderRadius: pill ? theme.radius.pill : theme.radius.sm,
          backgroundColor: pressed ? (pressedBg[variant] ?? bg[variant]) : bg[variant],
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          paddingLeft: theme.spacing.lg + (pill ? 4 : 0),
          paddingRight: trailingWell ? 9 : theme.spacing.lg + (pill ? 4 : 0),
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: trailingWell ? 1 : undefined }}>
          {icon && !trailingWell ? (
            <Icon icon={icon} size={size === 'lg' ? 22 : 18} color={fg[variant]} />
          ) : null}
          <Text
            variant={size === 'sm' ? 'label' : 'bodyStrong'}
            color={fg[variant]}
            style={trailingWell ? { flex: 1 } : undefined}
          >
            {title}
          </Text>
          {trailingWell ? (
            <View
              style={{
                width: size === 'lg' ? 34 : 30,
                height: size === 'lg' ? 34 : 30,
                borderRadius: theme.radius.pill,
                backgroundColor: isBrand ? 'rgba(6,32,25,0.14)' : 'rgba(255,255,255,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon icon={icon!} size={size === 'lg' ? 18 : 16} color={fg[variant]} />
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );

  return (
    <View style={{ alignSelf: fullWidth ? 'stretch' : 'flex-start', gap: 6 }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        {ringed ? (
          // The charged ring — the CTA's share of the double-bezel signature.
          <View
            style={{
              borderRadius: theme.radius.pill,
              padding: 3,
              backgroundColor: theme.alpha.tint08(brand),
              borderWidth: 1,
              borderColor: theme.alpha.tint14(brand),
            }}
          >
            {core}
          </View>
        ) : (
          core
        )}
      </Animated.View>
      {disabled && hint ? (
        <Text variant="caption" color="textFaint" center>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
