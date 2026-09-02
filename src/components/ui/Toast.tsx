import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { spring } from '@/theme/springs';
import { motion } from '@/theme';
import { Text } from './Text';

/**
 * The Undo toast — the backbone of 3.0's destruction inversion.
 *
 * v2 had a dozen instant destructive taps and exactly two confirmation Alerts.
 * v3 inverts it: destructive actions execute optimistically, and this toast
 * offers six seconds of forgiveness. Confirms are reserved for the truly
 * irreversible.
 *
 * One host, mounted once at the app root; any code shows a toast through the
 * module-level `toast()` — no context threading, usable from stores and
 * services as well as screens.
 */

const HOUSE_EASING = Easing.bezier(motion.bezier[0], motion.bezier[1], motion.bezier[2], motion.bezier[3]);

export interface ToastOptions {
  message: string;
  /** the action slot — almost always "Undo" */
  actionLabel?: string;
  onAction?: () => void;
  /** ms; the 6-second default is the undo contract */
  duration?: number;
}

type Listener = (t: ToastOptions) => void;
let listener: Listener | null = null;
let queued: ToastOptions | null = null;

export function toast(options: ToastOptions): void {
  if (listener) listener(options);
  else queued = options;
}

export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<ToastOptions | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listener = (t) => {
      if (timer.current) clearTimeout(timer.current);
      setCurrent(t);
      // Fade is a tween (opacity is not physical); the rise is a spring.
      rise.setValue(14);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: theme.motion.swift,
          easing: HOUSE_EASING,
          useNativeDriver: true,
        }),
        Animated.spring(rise, { toValue: 0, ...spring('toast') }),
      ]).start();
      timer.current = setTimeout(() => dismiss(), t.duration ?? 6000);
    };
    if (queued) {
      const q = queued;
      queued = null;
      listener(q);
    }
    return () => {
      listener = null;
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: theme.motion.swift,
      easing: HOUSE_EASING,
      useNativeDriver: true,
    }).start(() => setCurrent(null));
  };

  if (!current) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        // Above the 64px tab bar, respecting the gesture inset.
        bottom: insets.bottom + 76,
        opacity,
        transform: [{ translateY: rise }],
      }}
    >
      <View
        style={{
          ...theme.elevation.e3,
          borderRadius: theme.radius.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
        }}
      >
        <Text variant="body" style={{ flex: 1 }} numberOfLines={2}>
          {current.message}
        </Text>
        {current.actionLabel ? (
          <Pressable
            hitSlop={10}
            onPress={() => {
              current.onAction?.();
              dismiss();
            }}
          >
            <Text variant="bodyStrong" color="primary">
              {current.actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}
