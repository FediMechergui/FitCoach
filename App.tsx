import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { initDatabase } from '@/db/bootstrap';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { darkColors, lightColors } from '@/theme';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useUserStore } from '@/stores/userStore';
import { useSmokingStore } from '@/stores/smokingStore';
import { registerBackgroundSteps, syncTodaySteps } from '@/services/backgroundSteps';

export default function App() {
  const [ready, setReady] = useState(false);
  const scheme = useColorScheme();
  const load = useUserStore((s) => s.load);
  const loadSmoking = useSmokingStore((s) => s.load);

  useEffect(() => {
    // Synchronous bootstrap: create tables + seed, then hydrate the stores.
    initDatabase();
    load();
    loadSmoking();
    setReady(true);
    // Passive step tracking (best-effort; no-op on emulator / Expo Go).
    registerBackgroundSteps();
    syncTodaySteps().catch(() => {});
  }, [load, loadSmoking]);

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
            <RootNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
