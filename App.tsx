import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text as RNText } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { initDatabase } from '@/db/bootstrap';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { darkColors } from '@/theme';
import { loadBrandFonts } from '@/theme/fonts';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastHost } from '@/components/ui/Toast';
import { useUserStore } from '@/stores/userStore';
import { useSmokingStore } from '@/stores/smokingStore';
import { useUsageStore } from '@/stores/usageStore';
import { useWalkStore } from '@/stores/walkStore';
import { registerBackgroundSteps, syncTodaySteps } from '@/services/backgroundSteps';
// Importing the service registers its TaskManager background task at startup.
import { cleanupOrphanWalk } from '@/services/walkTracking';

/** Run a startup step but never let it brick the app; log failures instead. */
function safe(label: string, fn: () => void) {
  try {
    fn();
  } catch (e) {
    console.warn(`[startup] ${label} failed:`, e);
  }
}

/**
 * Navigation chrome, inside the theme.
 *
 * This lives below ThemeProvider — not beside it — because 3.0 introduces a
 * THEME PREFERENCE (System / Night Sea / Salt). Reading useColorScheme up in
 * App, as v2 did, would pin the navigator and status bar to the OS while the
 * user had chosen otherwise.
 */
function ThemedApp() {
  const theme = useTheme();
  const base = theme.dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.bg,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.accent,
    },
  };
  return (
    <ErrorBoundary>
      <NavigationContainer theme={navTheme}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
      {/* Undo lives here so any screen can offer forgiveness. */}
      <ToastHost />
    </ErrorBoundary>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [fatal, setFatal] = useState<Error | null>(null);
  const load = useUserStore((s) => s.load);
  const loadSmoking = useSmokingStore((s) => s.load);
  const recordOpen = useUsageStore((s) => s.record);
  const resumeWalk = useWalkStore((s) => s.resume);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // The brand faces load first — from bundled assets, so this is fast and
      // offline; a failure just leaves the system font in place.
      await loadBrandFonts();

      // The database is the only truly critical step — if it fails, surface it
      // instead of hanging on a blank screen forever.
      try {
        initDatabase();
      } catch (e) {
        if (!cancelled) {
          setFatal(e instanceof Error ? e : new Error(String(e)));
          setReady(true);
        }
        return;
      }

      // Everything else is best-effort and isolated so one failure can't block
      // the app from opening.
      safe('user store', load);
      safe('smoking store', loadSmoking);
      safe('usage streak', recordOpen);
      safe('resume walk', resumeWalk);
      if (!cancelled) setReady(true);

      registerBackgroundSteps();
      syncTodaySteps().catch(() => {});
      cleanupOrphanWalk().catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [load, loadSmoking, recordOpen, resumeWalk]);

  if (!ready) {
    // Pre-theme: the provider isn't mounted yet, so this uses the dark ground
    // directly. (The branded boot view is on the 3.0 list; this keeps the
    // colour honest meanwhile.)
    return <View style={{ flex: 1, backgroundColor: darkColors.bg }} />;
  }

  if (fatal) {
    return (
      <View style={{ flex: 1, backgroundColor: '#070C14', padding: 24, justifyContent: 'center' }}>
        <ScrollView contentContainerStyle={{ gap: 12 }}>
          <RNText style={{ color: '#FF6B6B', fontSize: 22, fontWeight: '800' }}>
            Couldn't start the database
          </RNText>
          <RNText style={{ color: '#EDF3F9', fontSize: 15 }}>
            {fatal.name}: {fatal.message}
          </RNText>
        </ScrollView>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
