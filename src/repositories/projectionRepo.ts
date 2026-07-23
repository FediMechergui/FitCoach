import { and, eq, gte } from 'drizzle-orm';
import { db } from '@/db/client';
import { exerciseLogs, sessions, setEntries } from '@/db/schema';
import { dailyIntakeSince } from './nutritionRepo';
import { sleepSince } from './sleepRepo';
import { dailySeries as smokingSeries } from './smokingRepo';
import { getNutritionGoal, latestWeight, weighInHistory, PRIMARY_USER_ID } from './userRepo';
import {
  compareToActual,
  projectComposition,
  type ActualPoint,
  type ComparisonSeries,
  type CompositionMetric,
  type DayInput,
} from '@/lib/projection';
import { computeBodyComp } from '@/lib/bodyComposition';
import { daysAgoISO, lastNDates, toISODate } from '@/lib/date';

/** Hard resistance sets logged per day (drives lean partitioning). */
function hardSetsByDate(sinceISO: string, userId: number): Map<string, number> {
  const rows = db
    .select({ startTime: sessions.startTime, setId: setEntries.id, completed: setEntries.completed })
    .from(setEntries)
    .innerJoin(exerciseLogs, eq(setEntries.exerciseLogId, exerciseLogs.id))
    .innerJoin(sessions, eq(exerciseLogs.sessionId, sessions.id))
    .where(and(eq(sessions.userId, userId), gte(sessions.startTime, new Date(sinceISO).getTime())))
    .all();
  const out = new Map<string, number>();
  for (const r of rows) {
    if (!r.completed) continue;
    const d = toISODate(new Date(r.startTime));
    out.set(d, (out.get(d) ?? 0) + 1);
  }
  return out;
}

export interface CompositionProjection {
  series: ComparisonSeries[];
  /** true when there's enough measured data for the comparison to mean anything */
  hasEnoughData: boolean;
  tdee: number;
  days: number;
}

/**
 * Build the expected-vs-actual comparison for the last `days` days from real
 * logs: intake & protein, hard sets, sleep, cigarettes and every weigh-in.
 */
export function compositionProjection(
  days = 60,
  userId: number = PRIMARY_USER_ID
): CompositionProjection {
  const since = daysAgoISO(days - 1);
  const dates = lastNDates(days);

  const intake = new Map(dailyIntakeSince(since, userId).map((r) => [r.date, r]));
  const sleep = new Map(sleepSince(since, userId).map((r) => [r.date, r.hours]));
  const cigs = new Map(smokingSeries(days, userId).map((r) => [r.date, r.count]));
  const sets = hardSetsByDate(since, userId);

  const weighIns = weighInHistory(userId).filter((w) => w.date >= since);
  const first = weighIns[0] ?? latestWeight(userId);
  const goal = getNutritionGoal(userId);
  const tdee = goal?.tdee ?? 2200;

  const startWeightKg = first?.weightKg ?? latestWeight(userId)?.weightKg ?? 0;
  const startComp = first
    ? computeBodyComp({ weightKg: first.weightKg, bodyFatPct: first.bodyFatPct, fatMassKg: first.fatMassKg })
    : null;
  // Muscle mass is a directly measured scale reading (fall back to skeletal
  // muscle when that's what the scale reports).
  const measuredMuscle = (w: { muscleMassKg?: number | null; skeletalMuscleKg?: number | null }) =>
    w.muscleMassKg ?? w.skeletalMuscleKg ?? null;
  const startMuscleMassKg = first ? measuredMuscle(first) : null;

  const dayInputs: DayInput[] = dates.map((date) => ({
    date,
    intakeKcal: intake.get(date)?.calories ?? null,
    proteinG: intake.get(date)?.protein ?? null,
    hardSets: sets.get(date) ?? 0,
    sleepHours: sleep.get(date) ?? null,
    cigarettes: cigs.get(date) ?? 0,
  }));

  const projected = projectComposition({
    startWeightKg,
    startFatMassKg: startComp?.fatMassKg ?? null,
    startMuscleMassKg,
    tdee,
    bodyweightKg: startWeightKg || 75,
    days: dayInputs,
  });

  const actuals: ActualPoint[] = weighIns.map((w) => {
    const c = computeBodyComp({ weightKg: w.weightKg, bodyFatPct: w.bodyFatPct, fatMassKg: w.fatMassKg });
    return {
      date: w.date,
      weightKg: w.weightKg,
      fatMassKg: c.fatMassKg,
      leanMassKg: c.leanMassKg,
      muscleMassKg: measuredMuscle(w),
      bodyFatPct: c.bodyFatPct,
    };
  });

  // Only show muscle mass when it's actually been measured more than once —
  // otherwise there's nothing real to hold the model against.
  const muscleReadings = weighIns.filter((w) => measuredMuscle(w) != null).length;
  const metrics: CompositionMetric[] = startComp?.fatMassKg != null
    ? ['weightKg', 'fatMassKg', 'leanMassKg', 'bodyFatPct']
    : ['weightKg'];
  if (startMuscleMassKg != null && muscleReadings >= 2) metrics.push('muscleMassKg');
  const series = metrics.map((m) => compareToActual(projected, actuals, m));

  const loggedDays = dayInputs.filter((d) => d.intakeKcal != null).length;
  return {
    series,
    hasEnoughData: weighIns.length >= 2 && loggedDays >= 7 && startWeightKg > 0,
    tdee,
    days,
  };
}
