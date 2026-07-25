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

export interface CompositionTrendMetric {
  key: 'fatMassKg' | 'muscleMassKg';
  label: string;
  unit: string;
  points: Array<{ date: string; value: number }>;
  /** net change over the window (last − first), or null if <2 points */
  change: number | null;
  /** plain-language read on why it's moving that way */
  reason: string;
}

export interface CompositionTrend {
  metrics: CompositionTrendMetric[];
  hasData: boolean;
}

const measuredMuscleOf = (w: { muscleMassKg?: number | null; skeletalMuscleKg?: number | null }) =>
  w.muscleMassKg ?? w.skeletalMuscleKg ?? null;

/**
 * The plain measured trend of fat mass and muscle mass from your weigh-ins —
 * shown whenever there are at least two readings — with a plain-language reason
 * for the direction, read off your recent energy balance, protein, training,
 * sleep and smoking.
 */
export function compositionTrend(days = 90, userId: number = PRIMARY_USER_ID): CompositionTrend {
  const since = daysAgoISO(days - 1);
  const weighIns = weighInHistory(userId).filter((w) => w.date >= since);

  const fatPts: Array<{ date: string; value: number }> = [];
  const musclePts: Array<{ date: string; value: number }> = [];
  for (const w of weighIns) {
    const c = computeBodyComp({ weightKg: w.weightKg, bodyFatPct: w.bodyFatPct, fatMassKg: w.fatMassKg });
    if (c.fatMassKg != null) fatPts.push({ date: w.date, value: Math.round(c.fatMassKg * 10) / 10 });
    const m = measuredMuscleOf(w);
    if (m != null) musclePts.push({ date: w.date, value: Math.round(m * 10) / 10 });
  }

  // Recent drivers over the window, to explain direction.
  const intake = dailyIntakeSince(since, userId);
  const loggedIntake = intake.filter((r) => r.calories > 0);
  const avgIntake = loggedIntake.length ? loggedIntake.reduce((s, r) => s + r.calories, 0) / loggedIntake.length : null;
  const avgProtein = loggedIntake.length ? loggedIntake.reduce((s, r) => s + r.protein, 0) / loggedIntake.length : null;
  const goal = getNutritionGoal(userId);
  const tdee = goal?.tdee ?? 2200;
  const startW = weighIns[0]?.weightKg ?? latestWeight(userId)?.weightKg ?? 75;
  const proteinPerKg = avgProtein != null && startW > 0 ? avgProtein / startW : null;
  const sets = hardSetsByDate(since, userId);
  const totalSets = [...sets.values()].reduce((s, n) => s + n, 0);
  const sleep = sleepSince(since, userId);
  const avgSleep = sleep.length ? sleep.reduce((s, r) => s + r.hours, 0) / sleep.length : null;
  const cigs = smokingSeries(days, userId);
  const smokes = cigs.some((r) => r.count > 0);
  const balance = avgIntake != null ? avgIntake - tdee : null;

  const change = (pts: Array<{ value: number }>) => (pts.length >= 2 ? Math.round((pts[pts.length - 1].value - pts[0].value) * 10) / 10 : null);

  const fatReason = (ch: number | null): string => {
    if (ch == null) return 'Log at least two body-fat weigh-ins to see the trend and why it moves.';
    const dir = ch < -0.2 ? 'falling' : ch > 0.2 ? 'rising' : 'holding steady';
    if (dir === 'falling') {
      return balance != null && balance < 0
        ? `Fat is ${dir} (${ch} kg). You've averaged a calorie deficit (~${Math.round(balance)} kcal/day), which is exactly what drives fat down.`
        : `Fat is ${dir} (${ch} kg). Keep the deficit and protein where they are — it's working.`;
    }
    if (dir === 'rising') {
      return balance != null && balance > 0
        ? `Fat is ${dir} (+${ch} kg). You've averaged a surplus (~+${Math.round(balance)} kcal/day) — trim intake a little if fat loss is the goal.`
        : `Fat is ${dir} (+${ch} kg) despite no clear surplus in your logs — check for under-logging, or a real TDEE lower than estimated.`;
    }
    return `Fat is ${dir} (${ch} kg) — intake and expenditure are roughly balanced.`;
  };

  const muscleReason = (ch: number | null): string => {
    if (ch == null) return 'Log muscle mass on at least two weigh-ins to see the trend and why it moves.';
    const dir = ch < -0.2 ? 'falling' : ch > 0.2 ? 'rising' : 'holding steady';
    const bits: string[] = [];
    if (proteinPerKg != null) bits.push(proteinPerKg >= 1.6 ? 'protein is on target' : 'protein is below ~1.6 g/kg');
    if (totalSets > 0) bits.push(`${totalSets} hard sets logged`); else bits.push('little resistance training logged');
    if (avgSleep != null && avgSleep < 6.5) bits.push('short sleep');
    if (smokes) bits.push('smoking (blunts recovery)');
    const ctx = bits.length ? ` (${bits.join(', ')})` : '';
    if (dir === 'rising') return `Muscle is ${dir} (+${ch} kg)${ctx}. Whatever you're doing on training and protein is working — scale muscle swings with hydration, so trust the trend.`;
    if (dir === 'falling') return `Muscle is ${dir} (${ch} kg)${ctx}. The usual culprits are too little protein, too few hard sets, an over-aggressive deficit or poor sleep — check those first. Readings also swing with hydration.`;
    return `Muscle is ${dir} (${ch} kg)${ctx}. Trust the multi-week trend over any single reading — hydration moves it day to day.`;
  };

  const metrics: CompositionTrendMetric[] = [];
  metrics.push({ key: 'fatMassKg', label: 'Fat mass', unit: 'kg', points: fatPts, change: change(fatPts), reason: fatReason(change(fatPts)) });
  metrics.push({ key: 'muscleMassKg', label: 'Muscle mass', unit: 'kg', points: musclePts, change: change(musclePts), reason: muscleReason(change(musclePts)) });

  return { metrics, hasData: fatPts.length > 0 || musclePts.length > 0 };
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
