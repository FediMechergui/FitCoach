import { clamp } from './format';

/**
 * Athlete-card rating engine — turns the user's real logged signals into a
 * FIFA/TCG-style overall rating (0–99) with six attributes. Everything is
 * derived from tracked data so the card is earned, not cosmetic.
 */

export interface RatingInputs {
  avgSessionsPerWeek: number; // last 4 weeks
  streakDays: number;
  relativeStrength: number; // Σ(best est. 1RM of big lifts) / bodyweight
  weeklyCardioMinutes: number;
  avgStepsPerDay: number;
  calorieAdherence: number; // 0..1 (how close to target, not over)
  proteinAdherence: number; // 0..1
  avgSleepHours: number | null;
  restDaysPerWeek: number;
  loggingDaysPerWeek: number; // nutrition logged days
  cigarettesPerDay: number;
  alcoholGramsPerWeek: number;
}

export interface AttributeSet {
  STR: number; // Strength
  END: number; // Endurance
  CON: number; // Consistency
  NUT: number; // Nutrition
  REC: number; // Recovery
  DIS: number; // Discipline
}

export interface CardRating {
  overall: number;
  attributes: AttributeSet;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Elite' | 'Legend';
  tierColor: string;
}

const A = (v: number) => Math.round(clamp(v, 1, 99));

export function computeRating(i: RatingInputs): CardRating {
  // Strength: relative strength drives most of it (2.0×BW total on big-3 ≈ strong).
  const STR = A(30 + i.relativeStrength * 22 + Math.min(15, i.avgSessionsPerWeek * 3));

  // Endurance: cardio minutes + steps.
  const END = A(
    25 + Math.min(45, i.weeklyCardioMinutes / 4) + Math.min(25, i.avgStepsPerDay / 400)
  );

  // Consistency: sessions/week + streak.
  const CON = A(30 + Math.min(40, i.avgSessionsPerWeek * 9) + Math.min(25, i.streakDays * 1.5));

  // Nutrition: adherence to calorie & protein targets + logging habit.
  const NUT = A(
    20 +
      i.calorieAdherence * 35 +
      i.proteinAdherence * 30 +
      Math.min(14, i.loggingDaysPerWeek * 2)
  );

  // Recovery: sleep + rest days, penalised by alcohol.
  const sleepScore = i.avgSleepHours == null ? 20 : clamp((i.avgSleepHours / 8) * 45, 0, 45);
  const REC = A(
    25 + sleepScore + Math.min(18, i.restDaysPerWeek * 8) - Math.min(25, i.alcoholGramsPerWeek / 8)
  );

  // Discipline: logging + low smoking/alcohol + consistency.
  const DIS = A(
    35 +
      Math.min(20, i.loggingDaysPerWeek * 3) +
      Math.min(15, i.avgSessionsPerWeek * 3) -
      Math.min(25, i.cigarettesPerDay * 3) -
      Math.min(15, i.alcoholGramsPerWeek / 12)
  );

  const attributes: AttributeSet = { STR, END, CON, NUT, REC, DIS };
  // Overall weights the pillars; consistency & discipline matter a lot.
  const overall = Math.round(
    (STR * 1.0 + END * 1.0 + CON * 1.3 + NUT * 1.1 + REC * 1.0 + DIS * 1.1) / 6.5
  );

  return { overall, attributes, tier: tierFor(overall), tierColor: tierColor(overall) };
}

function tierFor(overall: number): CardRating['tier'] {
  if (overall >= 90) return 'Legend';
  if (overall >= 80) return 'Elite';
  if (overall >= 68) return 'Gold';
  if (overall >= 55) return 'Silver';
  return 'Bronze';
}

function tierColor(overall: number): string {
  if (overall >= 90) return '#B58CFF';
  if (overall >= 80) return '#4FC3F7';
  if (overall >= 68) return '#FFD54A';
  if (overall >= 55) return '#C0C6D0';
  return '#CD8B62';
}

export const ATTRIBUTE_LABELS: Record<keyof AttributeSet, string> = {
  STR: 'Strength',
  END: 'Endurance',
  CON: 'Consistency',
  NUT: 'Nutrition',
  REC: 'Recovery',
  DIS: 'Discipline',
};
