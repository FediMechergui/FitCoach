import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { motion } from '@/theme';

/**
 * The bottom sheet — 3.0's standard modal surface.
 *
 * Session start, quick logging, pickers and every "why?" explanation belong
 * here: thumb-reachable, dismissible by scrim tap, visually anchored to the
 * screen that opened it. E3 elevation, radius 28 (the token v2 shipped and
 * never used), grabber on top.
 */

const HOUSE_EASING = Easing.bezier(motion.bezier[0], motion.bezier[1], motion.bezier[2], motion.bezier[3]);

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** cap the sheet's height as a fraction of the window (default 0.88) */
  maxHeightFraction?: number;
}

export function Sheet({ visible, onClose, children, maxHeightFraction = 0.88 }: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slide.setValue(0);
      Animated.timing(slide, {
        toValue: 1,
        duration: theme.motion.settle,
        easing: HOUSE_EASING,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slide, theme.motion.settle]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Scrim — tap anywhere above the sheet to dismiss. */}
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
      >
        {/* The sheet itself swallows presses so content taps don't dismiss. */}
        <Pressable onPress={() => {}} style={{ maxHeight: height * maxHeightFraction }}>
          <Animated.View
            style={{
              ...theme.elevation.e3,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
              borderBottomWidth: 0,
              paddingBottom: insets.bottom + theme.spacing.lg,
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [48, 0],
                  }),
                },
              ],
              opacity: slide,
            }}
          >
            {/* Grabber */}
            <View style={{ alignItems: 'center', paddingTop: theme.spacing.sm }}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.colors.borderStrong,
                }}
              />
            </View>
            <View style={{ padding: theme.spacing.lg, paddingTop: theme.spacing.md }}>
              {children}
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
