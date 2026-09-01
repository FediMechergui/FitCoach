import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
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
 *
 * The sheet owns its own scrolling. The first shape wrapped the sheet in the
 * scrim Pressable and hung the height cap on a wrapper the content ignored —
 * so a tall sheet ran straight off the bottom of the screen and no caller's
 * inner ScrollView could save it reliably. Now the scrim is a SIBLING behind
 * the sheet, the cap sits on the sheet itself, and children live in a built-in
 * ScrollView; content taller than the cap scrolls, content shorter than it
 * costs nothing. Callers must not add their own vertical ScrollView.
 */

const HOUSE_EASING = Easing.bezier(motion.bezier[0], motion.bezier[1], motion.bezier[2], motion.bezier[3]);

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** cap the sheet's height as a fraction of the window (default 0.88) */
  maxHeightFraction?: number;
  /** pinned below the scrolling content — a primary action that must stay reachable */
  footer?: React.ReactNode;
}

export function Sheet({ visible, onClose, children, maxHeightFraction = 0.88, footer }: SheetProps) {
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
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* Scrim — a sibling BEHIND the sheet, so sheet touches never route
            through a Pressable and scrolling inside is never contested. */}
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' }}
        />
        <Animated.View
          style={{
            ...theme.elevation.e3,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            borderBottomWidth: 0,
            maxHeight: height * maxHeightFraction,
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
          <ScrollView
            style={{ flexGrow: 0, flexShrink: 1 }}
            contentContainerStyle={{ padding: theme.spacing.lg, paddingTop: theme.spacing.md }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>
          {footer ? (
            <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>{footer}</View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}
