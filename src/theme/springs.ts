/**
 * House springs — Motion's model, React Native's engine.
 *
 * Motion (motion.dev) describes a spring by how it FEELS: a perceptual
 * `visualDuration` (seconds until the motion has visibly arrived) and a
 * `bounce` (0 = firm settle, 1 = wobble). Its rules for a serious product:
 * physics springs for anything physical or interruptible, minimal overshoot,
 * snappy ≈ 0.2 s, normal 0.3–0.4 s. React Native's Animated.spring wants
 * stiffness / damping / mass instead, so this converts Motion's two numbers
 * into RN's three with Motion's own mapping (mass = 1):
 *
 *   stiffness = (2π / visualDuration)²
 *   damping   = (1 − bounce) · 4π / visualDuration
 *
 * The presets are the whole vocabulary — screens never invent spring numbers.
 * The challenge wheel keeps its 3600 ms timing curve; a spring has no business
 * on a wheel of fortune.
 */

export interface SpringFeel {
  /** seconds until the motion has visibly arrived */
  visualDuration: number;
  /** 0 = no overshoot, 1 = maximum wobble — FitCoach stays ≤ 0.15 */
  bounce: number;
}

export const SPRING_FEEL = {
  /** a press: instant, firm, no overshoot */
  press: { visualDuration: 0.15, bounce: 0 },
  /** a sheet or panel arriving: quick, one soft settle */
  settle: { visualDuration: 0.32, bounce: 0.12 },
  /** a toast or banner sliding in: light, barely any bounce */
  toast: { visualDuration: 0.28, bounce: 0.1 },
  /** an element revealing in place */
  reveal: { visualDuration: 0.35, bounce: 0.15 },
} as const satisfies Record<string, SpringFeel>;

export type SpringName = keyof typeof SPRING_FEEL;

/** Motion's visualDuration + bounce → Animated.spring's stiffness + damping. */
export function springFromFeel({ visualDuration, bounce }: SpringFeel) {
  const d = Math.max(0.05, visualDuration);
  const b = Math.min(1, Math.max(0, bounce));
  const stiffness = (2 * Math.PI / d) ** 2;
  const damping = ((1 - b) * 4 * Math.PI) / d;
  return { stiffness, damping, mass: 1 };
}

/** A ready Animated.spring config for a named house feel. */
export function spring(name: SpringName) {
  return {
    ...springFromFeel(SPRING_FEEL[name]),
    // Motion's restDelta/restSpeed, scaled for RN's unit space.
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.1,
    useNativeDriver: true as const,
  };
}
