import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type Theme } from './index';
import { kvGet, kvSet } from '@/repositories/kvRepo';

/**
 * Theme with a user preference, at last.
 *
 * v2 followed the OS and nothing else — the complete light palette shipped in
 * the token file and an OS-dark user could never see it. v3 adds the choice:
 * System (default) / Night Sea / Salt, persisted in app_kv so it survives
 * restarts, applied to every screen from the provider down.
 *
 * The provider mounts only after the database is initialised (App gates its
 * whole tree on `ready`), so the kv read in the state initialiser is safe.
 */

export type ThemePreference = 'system' | 'night' | 'salt';

const KV_THEME = 'theme.preference';

interface ThemeContextValue extends Theme {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  ...darkTheme,
  preference: 'system',
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    try {
      const stored = kvGet<string>(KV_THEME);
      return stored === 'night' || stored === 'salt' || stored === 'system' ? stored : 'system';
    } catch {
      return 'system';
    }
  });

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    try {
      kvSet(KV_THEME, p);
    } catch {
      // Losing the preference on restart is the worst case; the choice still
      // applies for this session.
    }
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const light = preference === 'salt' || (preference === 'system' && scheme === 'light');
    const theme = light ? lightTheme : darkTheme;
    return { ...theme, preference, setPreference };
  }, [scheme, preference, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
