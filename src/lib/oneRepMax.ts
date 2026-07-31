/**
 * One-Rep-Max estimation (spec §3.3). Two standard formulas; Epley is the
 * default (slightly higher at high reps), Brzycki is offered as an alternative.
 *
 * ── The assumption everyone forgets ──
 * Both formulas were derived from sets taken **to failure**. "How much could
 * you lift once?" is answered by "how many could you manage before you
 * couldn't" — so a set with reps left in the tank breaks the premise. Feeding
 * 100 kg × 5 into Epley returns 117 kg whether those five were all you had or
 * whether you stopped with three in reserve, and in the second case the honest
 * answer is nearer 127 kg.
 *
 * The standard correction is to ask what the set would have been if it *had*
 * gone to failure: add the reps in reserve before applying the formula. That is
 * exactly what RPE-based load charts do.
 *
 * So: a set logged to failure is trusted as-is, a set with a known RPE is
 * corrected upward by its reserve, and a set with neither is used raw — which
 * is what the app has always done, so no existing estimate moves unless there
 * was effort data sitting unused next to it.
 */
import { repsInReserve, type SetEffort } from './effort';

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

/**
 * The reps a set would have reached had it continued to failure — what the 1RM
 * formulas actually want. Reps in reserve are added on; unknown effort leaves
 * the count untouched.
 */
export function repsAtFailureEquivalent(reps: number, effort?: SetEffort | null): number {
  if (!effort) return reps;
  const rir = repsInReserve(effort);
  return rir == null ? reps : reps + rir;
}

/**
 * Estimated 1RM from a logged set, correcting for how far it was from failure.
 * Prefer this over `estimate1RM` anywhere a real set is involved.
 */
export function estimate1RMFromSet(
  set: { weightKg: number | null; reps: number | null; rpe?: number | null; toFailure?: boolean | null },
  formula: ORMFormula = 'epley'
): number {
  if (!set.weightKg || !set.reps) return 0;
  const reps = repsAtFailureEquivalent(set.reps, {
    reps: set.reps,
    rpe: set.rpe ?? null,
    toFailure: !!set.toFailure,
  });
  return estimate1RM(set.weightKg, reps, formula);
}

/**
 * How much to trust an estimate. A set taken to failure satisfies the formula's
 * own assumption; a rated set is corrected but relies on the rating; an
 * unrated one is the formula applied to a premise it can't check.
 */
export type ORMConfidence = 'high' | 'medium' | 'low';

export function ormConfidence(set: { rpe?: number | null; toFailure?: boolean | null }): ORMConfidence {
  if (set.toFailure) return 'high';
  if (set.rpe != null) return 'medium';
  return 'low';
}

/** Best estimated 1RM across a list of sets, effort-corrected where known. */
export function best1RM(
  sets: Array<{ weightKg: number | null; reps: number | null; rpe?: number | null; toFailure?: boolean | null }>,
  formula: ORMFormula = 'epley'
): number {
  let best = 0;
  for (const s of sets) {
    const e = estimate1RMFromSet(s, formula);
    if (e > best) best = e;
  }
  return best;
}
