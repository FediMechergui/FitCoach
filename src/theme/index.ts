/**
 * Design system 3.0 — "Night Sea & Lume".
 *
 * The v2 palette had a soul it didn't know it had: its generic blue did
 * quadruple duty (brand, carbs, info, work) while the mint quietly owned every
 * moment that mattered — success, streaks, outdoor air, smoke-free, the start
 * marker on the map. v3 promotes the mint. Lume is bioluminescence — the
 * Mediterranean at night, a glow that needs no external power — the right
 * metaphor for an app that runs with the radio off. It is the only colour
 * allowed to mean "interactive" and the only colour allowed to glow.
 *
 * Every v2 token NAME survives with a v3 value, which is what re-skins all 50
 * screens through the components they already use. The rules:
 *
 *   · Lume means "you can act" or "this succeeded".
 *   · Domain colours mean "this metric" — regenerated at a shared perceptual
 *     lightness so no metric shouts over another. Carbs keep blue, which is
 *     exactly why the brand had to stop being blue.
 *   · Status colours mean "pay attention". There is no fourth status colour:
 *     the old `info` blue is retired and its token now reads as muted ink.
 *   · Depth is tonal — each raised layer is one lightness step up the same
 *     deep teal-navy, hairlines separate, gradients never decorate.
 *
 * Alpha is a real token here (`alpha.tint*`), replacing the hex-suffix
 * concatenation habit ('1F', '22', '33') that breaks the moment a colour isn't
 * hex. Old call sites migrate screen by screen; a ratchet in verify-engines
 * stops new ones.
 */

// ── Lume — the signature ─────────────────────────────────────────────────────
export const lume = {
  hi: '#63E8C6', // hover / active glow
  base: '#3FE0B6', // oklch(.84 .13 172)
  deep: '#1FBD95', // pressed; the interactive ink on Salt
  well: '#0E3A2F', // tinted containers on Night Sea
  ink: '#062019', // text set on a Lume fill
} as const;

/** rgba() from a #rrggbb hex — the typed replacement for `hex + '22'`. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** The five alpha steps. Use these, never string-concatenated hex suffixes. */
export const alpha = {
  tint04: (c: string) => withAlpha(c, 0.04),
  tint08: (c: string) => withAlpha(c, 0.08),
  tint14: (c: string) => withAlpha(c, 0.14),
  tint22: (c: string) => withAlpha(c, 0.22),
} as const;

// ── Shared hue positions, harmonised (~L0.78 C0.12) ─────────────────────────
export const palette = {
  // Brand — Lume. `primary` IS the accent now; the old blue is demoted below.
  primary: lume.base,
  primaryDark: lume.deep,
  primarySoft: withAlpha(lume.base, 0.14),
  accent: lume.base,
  accentSoft: withAlpha(lume.base, 0.14),

  // Status trio. Positive shares the brand, as in v2; `info` is retired to ink
  // (informational moments use ink + icon — there is no fourth status colour).
  success: lume.base,
  warning: '#F5B759',
  danger: '#FF6B6B',
  info: '#9FB0C3',

  // Session-type accents v3
  strength: '#6FA7F5',
  calisthenics: '#9A8CFA',
  cardio: '#FF8663',
  outdoor: '#45D9A0',
  sport: '#F0B45C',
  martial_arts: '#E4596B',
  mindbody: '#6FD4E4',
  meditation: '#C09AF7',
  custom: '#8FA0B5',

  // Domain palette — one metric, one hue, none of them shouting.
  protein: '#F58CB0',
  carbs: '#6FA7F5',
  fat: '#F0B45C',
  fiber: '#7FD98F',
  calories: '#FF8663', // "Signal"
  water: '#58C8F0',
  caffeine: '#C69368',

  white: '#FFFFFF',
  black: '#000000',
} as const;

// ── Night Sea — the surface ramp ────────────────────────────────────────────
// The v2 ground shifts two degrees toward teal so Lume reads as native light,
// not a sticker. Hairlines are ink at α12, not a solid third colour.
export const darkColors = {
  bg: '#070C14', // ground · E0
  surface: '#0C1420', // surface-1 · resting card
  surfaceAlt: '#121C2B', // surface-2 · raised
  surface3: '#182437', // sheets
  surface4: '#213047', // highest
  card: '#0C1420',
  border: 'rgba(237,243,249,0.12)', // hairline: ink @ α12
  borderStrong: 'rgba(237,243,249,0.24)',
  /** the 1px top-light that sells tonal elevation */
  topLight: 'rgba(255,255,255,0.06)',
  text: '#EDF3F9',
  textMuted: '#9FB0C3',
  textFaint: '#5F7189',
  ...palette,
} as const;

// ── Salt — the light theme ──────────────────────────────────────────────────
// Warm mineral white — whitewashed Sidi Bou Said walls, not clinical #FFF.
// Lume-deep is the interactive ink (4.6:1 on white).
export const lightColors = {
  bg: '#F5F7F6',
  surface: '#FFFFFF',
  surfaceAlt: '#E8EEEC',
  surface3: '#FFFFFF',
  surface4: '#DFE8E4',
  card: '#FFFFFF',
  border: 'rgba(19,32,26,0.12)',
  borderStrong: 'rgba(19,32,26,0.24)',
  topLight: 'rgba(255,255,255,0)',
  text: '#132019',
  textMuted: '#4F625B',
  textFaint: '#7E938B',
  ...palette,
  // Interactive ink must darken on white to keep contrast.
  primary: '#0FA57F',
  primaryDark: '#0C8A6A',
  accent: '#0FA57F',
  success: '#0FA57F',
  info: '#4F625B',
} as const;

// Widen values to `string` so the light and dark palettes (which share keys but
// have different hex values) are both assignable to the token type.
export type ColorTokens = { [K in keyof typeof darkColors]: string };

// ── Space & shape ───────────────────────────────────────────────────────────
// The 4-base ramp keeps v2's steps and adds the missing 20 (`s20`): sectional
// rhythm is 12 within a group, 24 between groups.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  s20: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// Hierarchy through curvature: 10 controls · 14 nested tiles · 20 cards ·
// 28 sheets & hero tiles · pill chips.
export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

// ── Typography — the app finally gets a voice ───────────────────────────────
// Space Grotesk carries display, headings and every number (true tabular
// figures — the voice of an engine that shows its work); Inter carries body,
// labels, captions. Families apply only once the fonts have actually loaded
// (see ./fonts); until then the weights below keep the system face legible.
// Hard floor: nothing below 11px, ever.
export const typography = {
  display: { fontSize: 34, lineHeight: 38, fontWeight: '700' as const, letterSpacing: -0.85 },
  h1: { fontSize: 27, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -0.54 },
  h2: { fontSize: 21, lineHeight: 26, fontWeight: '600' as const, letterSpacing: -0.2 },
  h3: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 23, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 23, fontWeight: '600' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '400' as const },
  /** numerals: stat tiles, set rows, timers */
  numeralM: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600' as const,
    fontVariant: ['tabular-nums'] as const,
  },
  /** the loudest voice on a screen — one per screen, if that */
  numeralXL: {
    fontSize: 44,
    lineHeight: 46,
    fontWeight: '700' as const,
    letterSpacing: -1.3,
    fontVariant: ['tabular-nums'] as const,
  },
  /**
   * The eyebrow — a microscopic uppercase label tracked wide open, in the
   * display face: PUSH DAY, REST, SET 4. It is how this app says a section
   * name like a coach rather than a form. Sits exactly on the 11px floor.
   */
  eyebrow: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600' as const,
    letterSpacing: 2.2,
    textTransform: 'uppercase' as const,
  },
  /** v2 compatibility: tabular numbers at body size */
  mono: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const,
    fontVariant: ['tabular-nums'] as const,
  },
} as const;

/** Which family each variant wears once fonts are loaded. */
export const FONT_BY_VARIANT: Record<keyof typeof typography, string> = {
  display: 'SpaceGrotesk-Bold',
  h1: 'SpaceGrotesk-Bold',
  h2: 'SpaceGrotesk-SemiBold',
  h3: 'SpaceGrotesk-SemiBold',
  body: 'Inter-Regular',
  bodyStrong: 'Inter-SemiBold',
  label: 'Inter-Medium',
  caption: 'Inter-Regular',
  numeralM: 'SpaceGrotesk-SemiBold',
  numeralXL: 'SpaceGrotesk-Bold',
  eyebrow: 'SpaceGrotesk-Medium',
  mono: 'SpaceGrotesk-SemiBold',
};

// ── Motion — reveals state, never invents excitement ────────────────────────
export const motion = {
  /**
   * The house curve — fast out of the gate, long settle, like a plate set
   * down rather than dropped. Every animated component builds its Easing
   * from this; linear and ease-in-out are not used anywhere.
   */
  bezier: [0.32, 0.72, 0, 1] as const,
  /** press states, chip toggles, checkbox fills */
  swift: 120,
  /** sheet open, accordion, tab cross-fade */
  settle: 200,
  /** the signature: ring/rail fills, the Lume sweep */
  sweep: 320,
  /** unchanged and sacred — the challenge spin */
  wheel: 3600,
} as const;

export const SESSION_TYPE_COLORS: Record<string, string> = {
  strength: palette.strength,
  calisthenics: palette.calisthenics,
  cardio: palette.cardio,
  outdoor: palette.outdoor,
  sport: palette.sport,
  martial_arts: palette.martial_arts,
  mindbody: palette.mindbody,
  meditation: palette.meditation,
  custom: palette.custom,
};

// ── Elevation — the z-axis v2 never had ─────────────────────────────────────
// Night Sea: tonal steps + hairline + 1px top-light (cheap on mobile GPUs and
// true to dark-UI physics). Salt earns one soft shadow tier.
export interface ElevationStyle {
  backgroundColor: string;
  borderWidth: number;
  borderColor: string;
  borderTopColor?: string;
  shadowColor?: string;
  shadowOpacity?: number;
  shadowRadius?: number;
  shadowOffset?: { width: number; height: number };
  elevation?: number;
}

function elevations(colors: ColorTokens, dark: boolean) {
  const shadow = (y: number, blur: number, opacity: number) =>
    dark
      ? {}
      : {
          shadowColor: '#132019',
          shadowOpacity: opacity,
          shadowRadius: blur / 2,
          shadowOffset: { width: 0, height: y },
          elevation: Math.round(y / 2),
        };
  return {
    /** resting card — on Salt it floats on diffused ambient light */
    e1: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderTopColor: dark ? colors.topLight : colors.border,
      ...shadow(6, 24, 0.06),
    } as ElevationStyle,
    /** raised: active bars, open accordions, FABs */
    e2: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderTopColor: dark ? colors.topLight : colors.borderStrong,
      ...shadow(10, 32, 0.08),
    } as ElevationStyle,
    /** sheets & dialogs */
    e3: {
      backgroundColor: colors.surface3,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      ...shadow(16, 48, 0.12),
    } as ElevationStyle,
  };
}

export interface Theme {
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  motion: typeof motion;
  alpha: typeof alpha;
  elevation: ReturnType<typeof elevations>;
  dark: boolean;
}

export const darkTheme: Theme = {
  colors: darkColors,
  spacing,
  radius,
  typography,
  motion,
  alpha,
  elevation: elevations(darkColors, true),
  dark: true,
};

export const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  radius,
  typography,
  motion,
  alpha,
  elevation: elevations(lightColors, false),
  dark: false,
};
