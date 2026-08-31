import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text as RNText, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { initDatabase } from '@/db/bootstrap';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { darkColors, lightColors } from '@/theme';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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

export default function App() {
  const [ready, setReady] = useState(false);
  const [fatal, setFatal] = useState<Error | null>(null);
  const scheme = useColorScheme();
  const load = useUserStore((s) => s.load);
  const loadSmoking = useSmokingStore((s) => s.load);
  const recordOpen = useUsageStore((s) => s.record);
  const resumeWalk = useWalkStore((s) => s.resume);

  useEffect(() => {
    // The database is the only truly critical step — if it fails, surface it
    // instead of hanging on a blank screen forever.
    try {
      initDatabase();
    } catch (e) {
      setFatal(e instanceof Error ? e : new Error(String(e)));
      setReady(true);
      return;
    }

    // Everything else is best-effort and isolated so one failure can't block
    // the app from opening.
    safe('user store', load);
    safe('smoking store', loadSmoking);
    safe('usage streak', recordOpen);
    safe('resume walk', resumeWalk);
    setReady(true);

    registerBackgroundSteps();
    syncTodaySteps().catch(() => {});
    cleanupOrphanWalk().catch(() => {});
  }, [load, loadSmoking, recordOpen, resumeWalk]);

  const colors = scheme === 'light' ? lightColors : darkColors;
  const navTheme = {
    ...(scheme === 'light' ? DefaultTheme : DarkTheme),
    colors: {
      ...(scheme === 'light' ? DefaultTheme.colors : DarkTheme.colors),
      primary: colors.primary,
      background: colors.bg,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
  };

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  if (fatal) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B1220', padding: 24, justifyContent: 'center' }}>
        <ScrollView contentContainerStyle={{ gap: 12 }}>
          <RNText style={{ color: '#FF5D5D', fontSize: 22, fontWeight: '800' }}>
            Couldn't start the database
          </RNText>
          <RNText style={{ color: '#EAF0F7', fontSize: 15 }}>
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
          <ErrorBoundary>
            <NavigationContainer theme={navTheme}>
              <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
              <RootNavigator />
            </NavigationContainer>
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
