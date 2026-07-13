/**
 * Design-system layer (spec §2): a single source of truth for color tokens,
 * spacing, radius and typography. Screens reference tokens, never raw hex, so a
 * theme swap is a one-file change. Dark-first palette (health apps read well on
 * dark); a light palette is provided for future user preference.
 */

export const palette = {
  // Brand
  primary: '#4F8CFF',
  primaryDark: '#2F6BD8',
  primarySoft: 'rgba(79,140,255,0.14)',
  accent: '#33D9A6',
  accentSoft: 'rgba(51,217,166,0.14)',

  // Semantic
  success: '#33D9A6',
  warning: '#FFB454',
  danger: '#FF5D5D',
  info: '#4F8CFF',

  // Session-type accents
  strength: '#4F8CFF',
  calisthenics: '#7C6CFF',
  cardio: '#FF7A59',
  outdoor: '#33D9A6',
  sport: '#FFB454',
  mindbody: '#5FD0E0',
  meditation: '#B58CFF',
  custom: '#9AA6B2',

  // Macro colors
  protein: '#FF6B9D',
  carbs: '#4F8CFF',
  fat: '#FFB454',
  calories: '#FF7A59',
  water: '#4FC3F7',
  caffeine: '#B58750',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const darkColors = {
  bg: '#0B1220',
  surface: '#141C2E',
  surfaceAlt: '#1C2740',
  card: '#141C2E',
  border: '#26314A',
  text: '#EAF0F7',
  textMuted: '#9AA6B8',
  textFaint: '#63708A',
  ...palette,
} as const;

export const lightColors = {
  bg: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F8',
  card: '#FFFFFF',
  border: '#E1E7F0',
  text: '#131A26',
  textMuted: '#5A6577',
  textFaint: '#8B95A6',
  ...palette,
} as const;

export type ColorTokens = typeof darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  bodyStrong: { fontSize: 15, fontWeight: '700' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  mono: { fontSize: 15, fontWeight: '700' as const, fontVariant: ['tabular-nums'] as const },
} as const;

export const SESSION_TYPE_COLORS: Record<string, string> = {
  strength: palette.strength,
  calisthenics: palette.calisthenics,
  cardio: palette.cardio,
  outdoor: palette.outdoor,
  sport: palette.sport,
  mindbody: palette.mindbody,
  meditation: palette.meditation,
  custom: palette.custom,
};

export interface Theme {
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  dark: boolean;
}

export const darkTheme: Theme = {
  colors: darkColors,
  spacing,
  radius,
  typography,
  dark: true,
};

export const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  radius,
  typography,
  dark: false,
};
