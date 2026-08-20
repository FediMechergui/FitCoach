/**
 * Per-exercise calorie attribution.
 *
 * The old model burned one flat session-type MET across the whole session, so a
 * round of MET-11 jump rope and a round of MET-3 stretching in the same session
 * looked identical. This attributes calories to each exercise using *its own*
 * MET and the time it actually took — the "real value" for every movement and
 * variation — while keeping the session total honest.
 *
 * The method: estimate each exercise's active seconds, then normalise those
 * shares to span the whole session duration (so rest and transitions aren't
 * lost) and value each share at that exercise's MET. When every exercise shares
 * one MET this reduces *exactly* to the old flat estimate — no surprise drift on
 * a pure-strength or single-activity session — but a mixed session finally
 * reflects its mix.
 *
 *   kcal = MET × 3.5 × weightKg / 200 × minutes   (see met.ts)
 *
 * Attribution uses NET calories (MET − 1), i.e. the burn above resting
 * metabolism. Your calorie target already covers resting through TDEE, so
 * crediting the gross figure would count roughly an extra 1 MET × duration twice
 * and quietly inflate the energy-balance and over-training maths. The library's
 * "what does this movement cost" reference below stays gross, because there it's
 * a standalone Compendium figure rather than something added to a daily budget.
 */
import { caloriesFromMet, netCaloriesFromMet } from './met';
import { intensityCalorieFactor, loadCalorieFactor, profileFor, type LoadProfile } from './loadProfile';
import type { TrackingType } from '@/db/schema';

/** Seconds of work a single rep represents, for reps-tracked movements. */
export const SECONDS_PER_REP = 3;

export interface BurnSet {
  reps?: number | null;
  durationS?: number | null;
  distanceM?: number | null;
  completed?: boolean | null;
  /** the logged kilograms — external load, added belt/vest weight, or carried pack */
  weightKg?: number | null;
  /** 1..10, when logged */
  rpe?: number | null;
  toFailure?: boolean | null;
}

export interface BurnExercise {
  /** the exercise's own MET; null falls back to the session-type MET */
  met?: number | null;
  trackingType: TrackingType;
  sets: BurnSet[];
  /** identity for the load profile — a ruck burns by its pack, a vest by its vest */
  slug?: string | null;
  equipmentType?: string | null;
  pattern?: string | null;
}

/**
 * Per-set energy factor: what the load does (a 20 kg ruck at 80 kg is ×1.25;
 * a 20 kg belt on dips ×1.12) times what the effort does (RPE 9 ≈ ×1.06).
 * A set with neither logged is exactly ×1, so history and unloaded sessions
 * are byte-identical to before.
 */
export function setEnergyFactor(profile: LoadProfile, bodyweightKg: number, set: BurnSet): number {
  return (
    loadCalorieFactor(profile, bodyweightKg, set.weightKg ?? null) *
    intensityCalorieFactor(set.rpe ?? null, !!set.toFailure)
  );
}

/**
 * Estimate how many seconds of actual work an exercise represents.
 *  - explicit set durations are trusted as-is (cardio, holds, rounds)
 *  - reps become time via SECONDS_PER_REP (a set of 10 ≈ 30 s under tension)
 *  - a bare completed set with neither still counts as one working minute, so an
 *    exercise that was clearly done is never valued at zero.
 */
export function activeSecondsFor(ex: BurnExercise): number {
  let seconds = 0;
  for (const s of ex.sets) {
    if (s.completed === false) continue;
    seconds += setSeconds(s);
  }
  return seconds;
}

function setSeconds(s: BurnSet): number {
  if (typeof s.durationS === 'number' && s.durationS > 0) return s.durationS;
  if (typeof s.reps === 'number' && s.reps > 0) return s.reps * SECONDS_PER_REP;
  return 60;
}

/**
 * Active seconds weighted by each set's energy factor — the "effective MET
 * seconds" of the exercise. Equal to plain active seconds whenever no set
 * carries a load or an RPE.
 */
export function weightedActiveSecondsFor(ex: BurnExercise, bodyweightKg: number): number {
  const profile = profileFor(ex);
  let weighted = 0;
  for (const s of ex.sets) {
    if (s.completed === false) continue;
    weighted += setSeconds(s) * setEnergyFactor(profile, bodyweightKg, s);
  }
  return weighted;
}

export interface CalorieBreakdown {
  /** kcal per exercise, index-aligned with the input array */
  perExercise: number[];
  total: number;
  /** how the number was produced, for honest UI labelling */
  basis: 'per-exercise' | 'session-met';
}

/**
 * Attribute a session's calories across its exercises.
 *
 * `fallbackMet` is used for the whole session when there's nothing to attribute
 * to (e.g. a walk, or a session whose sets were never filled in) and for any
 * individual exercise missing a MET.
 */
export function distributeSessionCalories(params: {
  durationS: number;
  weightKg: number;
  exercises: BurnExercise[];
  fallbackMet: number;
}): CalorieBreakdown {
  const { durationS, weightKg, exercises, fallbackMet } = params;
  const actives = exercises.map(activeSecondsFor);
  // Energy-weighted seconds: the load on the back and the effort in the set
  // scale the burn; the plain seconds still decide how the wall clock is split.
  const weighted = exercises.map((ex) => weightedActiveSecondsFor(ex, weightKg));
  const totalActive = actives.reduce((a, b) => a + b, 0);

  if (durationS <= 0) {
    return { perExercise: exercises.map(() => 0), total: 0, basis: 'session-met' };
  }

  if (totalActive <= 0) {
    // No set-level timing (e.g. a past session logged as a block of exercises).
    // With nothing to weight by, split the duration evenly across the listed
    // exercises, still valuing each at its own MET.
    if (exercises.length === 0) {
      return {
        perExercise: [],
        total: netCaloriesFromMet(fallbackMet, weightKg, durationS),
        basis: 'session-met',
      };
    }
    const share = durationS / exercises.length;
    const perExercise = exercises.map((ex) =>
      netCaloriesFromMet(ex.met && ex.met > 0 ? ex.met : fallbackMet, weightKg, share)
    );
    return {
      perExercise,
      total: perExercise.reduce((a, b) => a + b, 0),
      basis: 'per-exercise',
    };
  }

  // Spread the whole wall-clock duration over the exercises in proportion to
  // their active time — rest and transitions ride along with the work that
  // earned them rather than vanishing. The energy factor (load carried, added
  // weight, effort) then scales each exercise's share: same minutes, more work.
  const scale = durationS / totalActive;
  const perExercise = exercises.map((ex, i) => {
    const met = ex.met && ex.met > 0 ? ex.met : fallbackMet;
    const factor = actives[i] > 0 ? weighted[i] / actives[i] : 1;
    // The factor scales the WORK above resting (net MET), not the resting
    // share — a 20 kg pack multiplies what you do, not your idle metabolism.
    // 1 + (met − 1) × factor keeps a single rounding step in netCaloriesFromMet.
    return netCaloriesFromMet(1 + (met - 1) * factor, weightKg, actives[i] * scale);
  });
  const total = perExercise.reduce((a, b) => a + b, 0);
  return { perExercise, total, basis: 'per-exercise' };
}

/**
 * Calories for one exercise done for a given time at the user's weight — used by
 * the library to show the "real value" of each movement before you even do it,
 * expressed per a reference window (default 10 minutes).
 */
export function caloriesForReference(met: number, weightKg: number, minutes = 10): number {
  return caloriesFromMet(met, weightKg, minutes * 60);
}
