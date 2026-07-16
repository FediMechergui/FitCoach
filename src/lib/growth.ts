import { clamp } from './format';

/**
 * Muscle-growth estimation — honest by design.
 *
 * An app cannot measure hypertrophy directly; what it CAN do is measure how
 * well your logged behaviour matches the conditions research consistently ties
 * to growth, and report a transparent "growth readiness" per muscle:
 *
 *  • Volume        — ~10–20 hard sets per muscle per week
 *  • Overload      — volume/load trending up across weeks
 *  • Frequency/rest — hitting a muscle ~2×/week with 48–72 h between
 *  • Protein       — ~1.6–2.2 g/kg/day
 *  • Sleep         — 7–9 h/night
 *
 * The natural rate-of-gain ranges below are population averages (McDonald /
 * Aragon models); they're shown as ranges, never as a promise.
 */

export const OPTIMAL_SETS_MIN = 10;
export const OPTIMAL_SETS_MAX = 20;

export interface MuscleGrowthInputs {
  muscle: string;
  setsThisWeek: number;
  avgSetsPerWeek4w: number;
  /** volume last 2 weeks vs prior 2 weeks, as % change */
  overloadTrendPct: number | null;
  /** average days between sessions hitting this muscle */
  avgRestDays: number | null;
  sessionsPerWeek: number;
}

export interface GrowthGates {
  proteinOk: boolean;
  sleepOk: boolean;
  calorieOk: boolean; // not in a harsh deficit
}

export interface MuscleGrowthScore {
  muscle: string;
  score: number; // 0..100
  status: 'growing' | 'maintaining' | 'under-stimulated' | 'overreached';
  volumeScore: number;
  overloadScore: number;
  recoveryScore: number;
  setsThisWeek: number;
  avgSetsPerWeek4w: number;
  overloadTrendPct: number | null;
  notes: string[];
}

export function scoreMuscle(i: MuscleGrowthInputs, gates: GrowthGates): MuscleGrowthScore {
  const notes: string[] = [];

  // Volume: 0 at 0 sets, full inside the 10–20 band, taper above 24 (junk volume).
  let volumeScore: number;
  const s = i.avgSetsPerWeek4w;
  if (s <= 0) volumeScore = 0;
  else if (s < OPTIMAL_SETS_MIN) volumeScore = (s / OPTIMAL_SETS_MIN) * 70;
  else if (s <= OPTIMAL_SETS_MAX) volumeScore = 100;
  else volumeScore = Math.max(50, 100 - (s - OPTIMAL_SETS_MAX) * 5);

  if (s > 0 && s < OPTIMAL_SETS_MIN) notes.push(`Only ~${Math.round(s)} sets/week — the growth zone starts around ${OPTIMAL_SETS_MIN}.`);
  if (s > OPTIMAL_SETS_MAX + 4) notes.push('Very high volume — extra sets past ~20/week add fatigue faster than growth.');

  // Overload: reward an upward volume trend, small penalty for decline.
  let overloadScore = 60; // neutral when unknown
  if (i.overloadTrendPct != null) {
    overloadScore = clamp(60 + i.overloadTrendPct * 2, 0, 100);
    if (i.overloadTrendPct >= 5) notes.push('Volume is trending up — progressive overload is happening.');
    else if (i.overloadTrendPct <= -15) notes.push('Volume dropped vs the previous weeks — consider working back up.');
  }

  // Recovery: ideal rest 1.5–4 days between hits; gates for protein/sleep.
  let recoveryScore = 70;
  if (i.avgRestDays != null) {
    if (i.avgRestDays < 1.5) {
      recoveryScore = 45;
      notes.push('Hitting this muscle with <48h rest — growth happens between sessions.');
    } else if (i.avgRestDays <= 4.5) {
      recoveryScore = 100;
    } else {
      recoveryScore = clamp(100 - (i.avgRestDays - 4.5) * 12, 30, 100);
      if (i.avgRestDays > 6) notes.push('Long gaps between sessions — ~2×/week per muscle grows faster.');
    }
  }
  if (!gates.proteinOk) {
    recoveryScore = Math.min(recoveryScore, 55);
    notes.push('Protein is below ~1.6 g/kg — the bricks are missing.');
  }
  if (!gates.sleepOk) {
    recoveryScore = Math.min(recoveryScore, 60);
    notes.push('Sleep is under 7h — growth hormone and recovery take the hit.');
  }
  if (!gates.calorieOk) notes.push('A harsh calorie deficit limits muscle gain — expect maintenance at best.');

  const score = Math.round(volumeScore * 0.45 + overloadScore * 0.25 + recoveryScore * 0.3);

  let status: MuscleGrowthScore['status'];
  if (s === 0) status = 'under-stimulated';
  else if (score >= 70 && gates.calorieOk) status = 'growing';
  else if (s > OPTIMAL_SETS_MAX + 4 && recoveryScore < 60) status = 'overreached';
  else if (score >= 45) status = 'maintaining';
  else status = 'under-stimulated';

  return {
    muscle: i.muscle,
    score: clamp(score, 0, 100),
    status,
    volumeScore: Math.round(volumeScore),
    overloadScore: Math.round(overloadScore),
    recoveryScore: Math.round(recoveryScore),
    setsThisWeek: i.setsThisWeek,
    avgSetsPerWeek4w: Math.round(i.avgSetsPerWeek4w * 10) / 10,
    overloadTrendPct: i.overloadTrendPct,
    notes,
  };
}

/**
 * Realistic natural muscle-gain range (kg/month) by training age — population
 * averages under GOOD conditions (McDonald/Aragon-style models). Women trend
 * toward ~half these absolute rates.
 */
export function naturalGainRangeKgPerMonth(
  trainingAgeMonths: number,
  sex: 'male' | 'female'
): { min: number; max: number; label: string } {
  let min: number, max: number, label: string;
  if (trainingAgeMonths < 12) {
    min = 0.5; max = 1.0; label = 'Beginner (year 1)';
  } else if (trainingAgeMonths < 36) {
    min = 0.25; max = 0.5; label = 'Intermediate (years 2–3)';
  } else {
    min = 0.1; max = 0.25; label = 'Advanced (3+ years)';
  }
  if (sex === 'female') {
    min *= 0.5;
    max *= 0.5;
  }
  return { min: Math.round(min * 100) / 100, max: Math.round(max * 100) / 100, label };
}

export const GROWTH_STATUS_LABEL: Record<MuscleGrowthScore['status'], string> = {
  growing: 'Growth conditions met',
  maintaining: 'Maintaining',
  'under-stimulated': 'Under-stimulated',
  overreached: 'Overreached',
};

export const GROWTH_STATUS_COLOR: Record<MuscleGrowthScore['status'], string> = {
  growing: '#33D9A6',
  maintaining: '#4F8CFF',
  'under-stimulated': '#FFB454',
  overreached: '#FF5D5D',
};
