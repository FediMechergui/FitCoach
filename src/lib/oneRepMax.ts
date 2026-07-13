/**
 * One-Rep-Max estimation (spec §3.3). Two standard formulas; Epley is the
 * default (slightly higher at high reps), Brzycki is offered as an alternative.
 */

export type ORMFormula = 'epley' | 'brzycki';

/** Epley: 1RM = w × (1 + reps/30). */
export function epley1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/** Brzycki: 1RM = w × 36 / (37 − reps). Valid for reps < 37. */
export function brzycki1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0 || reps >= 37) return 0;
  if (reps === 1) return weightKg;
  return (weightKg * 36) / (37 - reps);
}

export function estimate1RM(weightKg: number, reps: number, formula: ORMFormula = 'epley'): number {
  const raw = formula === 'brzycki' ? brzycki1RM(weightKg, reps) : epley1RM(weightKg, reps);
  return Math.round(raw * 10) / 10;
}

/** Estimated reps achievable at a target weight given a known 1RM (inverse Epley). */
export function estimateRepsAt(oneRM: number, targetWeightKg: number): number {
  if (targetWeightKg <= 0 || oneRM <= 0 || targetWeightKg >= oneRM) return targetWeightKg === oneRM ? 1 : 0;
  return Math.floor((oneRM / targetWeightKg - 1) * 30);
}

/** Best estimated 1RM across a list of (weight, reps) sets. */
export function best1RM(
  sets: Array<{ weightKg: number | null; reps: number | null }>,
  formula: ORMFormula = 'epley'
): number {
  let best = 0;
  for (const s of sets) {
    if (s.weightKg && s.reps) {
      const e = estimate1RM(s.weightKg, s.reps, formula);
      if (e > best) best = e;
    }
  }
  return best;
}
