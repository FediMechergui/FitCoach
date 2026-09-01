import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, Share, Text as RNText, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { darkColors, lume, radius, spacing } from '@/theme';
import { DB_NAME } from '@/db/client';

/**
 * The two pre-theme surfaces: boot and the fatal database screen.
 *
 * Both render BEFORE the ThemeProvider exists — possibly before the database
 * exists — so they use the Night Sea tokens directly and RN's own Text. They
 * are the only screens in the app allowed to.
 *
 * v2's boot was "a solid colour rectangle — no logo, no spinner, no text"
 * during the app's longest moment. v2's fatal screen had no retry and no way
 * out: the app was simply stuck. Both are Selma's first hour and Nour's worst
 * night; both now behave.
 */

// ── Boot ─────────────────────────────────────────────────────────────────────

export function BootView() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View
      style={{ flex: 1, backgroundColor: darkColors.bg, alignItems: 'center', justifyContent: 'center', gap: 16 }}
    >
      {/* The Lume mark: a glow ring with its core — light that needs no power. */}
      <Animated.View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          borderWidth: 3,
          borderColor: lume.base,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pulse,
        }}
      >
        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: lume.base }} />
      </Animated.View>
      <RNText style={{ color: darkColors.text, fontSize: 22, fontWeight: '700', letterSpacing: 0.5 }}>
        FitCoach
      </RNText>
      <RNText style={{ color: darkColors.textFaint, fontSize: 12 }}>On this device — no account, ever.</RNText>
    </View>
  );
}

// ── Fatal ────────────────────────────────────────────────────────────────────

/**
 * The worst moment, made survivable: retry, get your data out, get the error
 * out. Sovereignty holds even in failure — the SQLite file is yours, and this
 * screen will hand it to you.
 */
export function FatalView({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const shareError = () => {
    Share.share({
      message: `FitCoach failed to start.\n${error.name}: ${error.message}\n\n${(error.stack ?? '').split('\n').slice(0, 12).join('\n')}`,
    }).catch(() => {});
  };

  const exportData = async () => {
    try {
      const uri = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { dialogTitle: 'Export your FitCoach data' });
      }
    } catch {
      // If even this fails, the share-error path still works.
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: darkColors.bg, padding: spacing.xl, justifyContent: 'center' }}>
      <ScrollView contentContainerStyle={{ gap: spacing.md }}>
        <RNText style={{ color: darkColors.text, fontSize: 22, fontWeight: '700' }}>
          FitCoach couldn't open your data
        </RNText>
        <RNText style={{ color: darkColors.textMuted, fontSize: 15, lineHeight: 22 }}>
          Your data is still on this device — nothing is lost. Try again first; if it keeps
          happening, export your data file and share the error so it can be fixed.
        </RNText>
        <View
          style={{
            backgroundColor: darkColors.surface,
            borderRadius: radius.md,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: darkColors.border,
          }}
        >
          <RNText selectable style={{ color: darkColors.warning, fontSize: 13, fontWeight: '600' }}>
            {error.name}: {error.message}
          </RNText>
        </View>
        <FatalButton label="Try again" primary onPress={onRetry} />
        <FatalButton label="Export my data file" onPress={exportData} />
        <FatalButton label="Share the error details" onPress={shareError} />
      </ScrollView>
    </View>
  );
}

function FatalButton({ label, primary, onPress }: { label: string; primary?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: primary ? (pressed ? lume.deep : lume.base) : darkColors.surfaceAlt,
        borderRadius: radius.sm,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: primary ? 0 : 1,
        borderColor: darkColors.border,
        opacity: pressed && !primary ? 0.85 : 1,
      })}
    >
      <RNText style={{ color: primary ? lume.ink : darkColors.text, fontSize: 15, fontWeight: '600' }}>
        {label}
      </RNText>
    </Pressable>
  );
}
