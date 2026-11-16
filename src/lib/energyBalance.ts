/** Diary comparison, not a diagnosis of energy availability or overtraining. */
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

export type EnergyStatus = 'incomplete' | 'eat_more' | 'on_track' | 'over_eaten' | 'over_trained';

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

/** An incomplete diary cannot diagnose energy deficiency or overtraining. */
export function computeEnergyBalance(i: EnergyBalanceInput): EnergyBalance {
  const targetIntake = Math.round(Math.max(0, i.calorieTarget));
  const consumed = Math.round(Math.max(0, i.consumedKcal));
  const exerciseBurned = Math.round(Math.max(0, i.exerciseKcal));
  const leftToEat = targetIntake - consumed;
  const status: EnergyStatus = consumed === 0 ? 'incomplete' : leftToEat > 100 ? 'eat_more' : leftToEat < -100 ? 'over_eaten' : 'on_track';
  const message = consumed === 0
    ? 'No food logged for this day. Missing entries do not mean you ate nothing.'
    : `${consumed} kcal logged so far against a ${targetIntake} kcal target. This comparison depends on complete food logs.`;
  // The activity-adjusted target already includes exercise. Show exercise
  // separately without adding it again or prescribing calories to eat back.
  return { targetIntake, consumed, leftToEat, exerciseBurned,
    availableAfterExercise: consumed - exerciseBurned,
    floorKcal: 0, lineKcal: 0, headroomKcal: 0, restoreKcal: 0, status, message };
}
export function trainingLoadFraction(_balance: EnergyBalance): number { return 0; }
