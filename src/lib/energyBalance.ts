/**
 * Daily energy balance — how much you've eaten, how much you've burned in
 * training, how much is left to eat, and (the point of this) where the line is
 * before extra training starts working against the goal you set.
 *
 * The honest bit: your calorie target already assumes a baseline of daily
 * activity (it's TDEE-based). Logged *training* burn is treated as on top of
 * that — so the numbers here lean slightly conservative, which is the safe
 * direction for an over-training warning. A hard floor protects you either way:
 * the energy actually available to your body (what you ate minus what you
 * trained off) should never drop below a goal-appropriate minimum, and never
 * below your BMR.
 */
import type { Goal } from './calories';

export interface EnergyBalanceInput {
  goal: Goal;
  /** the goal's daily intake target (kcal) */
  calorieTarget: number;
  /** maintenance calories */
  tdee: number;
  /** basal metabolic rate — the absolute floor */
  bmr: number;
  /** calories eaten today */
  consumedKcal: number;
  /** calories burned in logged training today (sessions + walks/runs) */
  exerciseKcal: number;
}

export type EnergyStatus = 'eat_more' | 'on_track' | 'over_eaten' | 'over_trained';

export interface EnergyBalance {
  targetIntake: number;
  consumed: number;
  /** targetIntake − consumed (positive = room to eat, negative = over) */
  leftToEat: number;
  exerciseBurned: number;
  /** energy available to the body after training: consumed − exercise */
  availableAfterExercise: number;
  /** the goal-appropriate minimum available energy for the day */
  floorKcal: number;
  /** the training-burn ceiling for today before crossing the floor */
  lineKcal: number;
  /** how much more you can burn before crossing the line (≥0) */
  headroomKcal: number;
  /** kcal to eat back to bring available energy up to the goal floor (0 if fine) */
  restoreKcal: number;
  status: EnergyStatus;
  message: string;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** The minimum available energy (eaten − trained off) that still serves the goal. */
function floorFor(goal: Goal, calorieTarget: number, tdee: number, bmr: number): number {
  let floor: number;
  switch (goal) {
    case 'build_muscle':
      // A bulk should not dip into a deficit — hold at/above maintenance.
      floor = tdee;
      break;
    case 'lose_fat':
      // Allow up to ~500 kcal of extra deficit beyond the plan via training…
      floor = calorieTarget - 500;
      break;
    case 'performance':
      floor = calorieTarget - 200;
      break;
    default: // maintain, recomp
      floor = calorieTarget - 300;
  }
  // …but never below BMR — going under that is where the real damage starts.
  return Math.max(bmr, Math.round(floor));
}

export function computeEnergyBalance(i: EnergyBalanceInput): EnergyBalance {
  const targetIntake = Math.round(i.calorieTarget);
  const consumed = Math.round(i.consumedKcal);
  const exercise = Math.round(i.exerciseKcal);
  const floor = floorFor(i.goal, i.calorieTarget, i.tdee, i.bmr);

  const availableAfterExercise = consumed - exercise;
  const leftToEat = targetIntake - consumed;
  // The most you can burn today before available energy hits the floor.
  const lineKcal = Math.max(0, consumed - floor);
  const headroom = Math.max(0, lineKcal - exercise);
  const over = exercise - lineKcal; // >0 means past the line
  // How much to eat back so available energy returns to the goal floor.
  const restoreKcal = Math.max(0, Math.round(floor - availableAfterExercise));

  let status: EnergyStatus;
  if (over > 0) status = 'over_trained';
  else if (leftToEat > 100) status = 'eat_more';
  else if (leftToEat < -100) status = 'over_eaten';
  else status = 'on_track';

  const message = buildMessage(i.goal, status, {
    leftToEat,
    headroom,
    over: Math.round(over),
    available: availableAfterExercise,
    floor,
  });

  return {
    targetIntake,
    consumed,
    leftToEat,
    exerciseBurned: exercise,
    availableAfterExercise,
    floorKcal: floor,
    lineKcal: Math.round(lineKcal),
    headroomKcal: Math.round(headroom),
    restoreKcal,
    status,
    message,
  };
}

function buildMessage(
  goal: Goal,
  status: EnergyStatus,
  n: { leftToEat: number; headroom: number; over: number; available: number; floor: number }
): string {
  if (status === 'over_trained') {
    const eatBack = Math.max(n.over, n.floor - n.available);
    if (goal === 'build_muscle') {
      return `You've trained past the line — today's burn has wiped out your muscle-building surplus. Eat about ${Math.round(eatBack)} kcal more, or this session works against your goal.`;
    }
    if (goal === 'lose_fat') {
      return `That's a very aggressive deficit — only ~${Math.round(n.available)} kcal is left for your body after training, below your ${Math.round(n.floor)} floor. More won't speed fat loss and it risks muscle; eat a bit more or ease off.`;
    }
    return `You've trained past your plan today — available energy is under your ${Math.round(n.floor)} floor. Eat back about ${Math.round(eatBack)} kcal to stay on track.`;
  }
  if (status === 'eat_more') {
    const head = n.headroom > 100 ? ` You can still burn ~${Math.round(n.headroom)} kcal before it starts eating into your goal.` : '';
    return `You have ${Math.round(n.leftToEat)} kcal left to eat toward your target.${head}`;
  }
  if (status === 'over_eaten') {
    return `You're ${Math.round(-n.leftToEat)} kcal over your target for the day — worth a note, not a crisis.`;
  }
  // on_track
  const head = n.headroom > 100 ? ` About ${Math.round(n.headroom)} kcal of training headroom left before you'd cross the line.` : '';
  return `Right on your target for the day.${head}`;
}

/** Where today's training burn sits on the 0 → line scale (0..1, clamped). */
export function trainingLoadFraction(b: EnergyBalance): number {
  if (b.lineKcal <= 0) return b.exerciseBurned > 0 ? 1 : 0;
  return clamp(b.exerciseBurned / b.lineKcal, 0, 1);
}
