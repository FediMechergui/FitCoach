import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { exerciseLogs, exercises, sessions, setEntries } from '@/db/schema';
import {
  naturalGainRangeKgPerMonth,
  scoreMuscle,
  type GrowthGates,
  type MuscleGrowthScore,
} from '@/lib/growth';
import { MUSCLE_GROUPS } from '@/data/exercises';
import { daysAgoISO, toISODate } from '@/lib/date';
import { dailyIntakeSince } from './nutritionRepo';
import { avgSleepHours } from './sleepRepo';
import { getNutritionGoal, getUser, latestWeight, PRIMARY_USER_ID } from './userRepo';

/**
 * Aggregates real training logs into per-muscle growth-readiness scores.
 * A "hard set" = a completed set on an exercise whose primaryMuscle matches.
 */

interface SetRow {
  muscle: string | null;
  startTime: number;
  volume: number;
  sessionId: number;
}

function liftingSetRows(sinceMs: number, userId: number): SetRow[] {
  return db
    .select({
      muscle: exercises.primaryMuscle,
      startTime: sessions.startTime,
      weightKg: setEntries.weightKg,
      reps: setEntries.reps,
      sessionId: sessions.id,
    })
    .from(setEntries)
    .innerJoin(exerciseLogs, eq(setEntries.exerciseLogId, exerciseLogs.id))
    .innerJoin(exercises, eq(exerciseLogs.exerciseId, exercises.id))
    .innerJoin(sessions, eq(exerciseLogs.sessionId, sessions.id))
    .where(and(eq(sessions.userId, userId), eq(setEntries.completed, true)))
    .all()
    .filter((r) => r.startTime >= sinceMs)
    .map((r) => ({
      muscle: r.muscle,
      startTime: r.startTime,
      volume: (r.weightKg ?? 0) * (r.reps ?? 0),
      sessionId: r.sessionId,
    }));
}

export interface GrowthReport {
  gates: GrowthGates & { proteinGPerKg: number | null; avgSleep: number | null };
  muscles: MuscleGrowthScore[];
  trainingAgeMonths: number;
  gainRange: ReturnType<typeof naturalGainRangeKgPerMonth>;
  weeklySetSeries: Array<{ weekLabel: string; sets: number }>;
}

export function growthReport(userId: number = PRIMARY_USER_ID): GrowthReport {
  const now = Date.now();
  const wk = 7 * 86_400_000;
  const rows = liftingSetRows(now - 4 * wk, userId);

  // ── Gates from nutrition + sleep ────────────────────────────────────────────
  const weightKg = latestWeight(userId)?.weightKg ?? 75;
  const intake = dailyIntakeSince(daysAgoISO(6), userId);
  const avgProtein = intake.length ? intake.reduce((s, r) => s + r.protein, 0) / intake.length : null;
  const proteinGPerKg = avgProtein != null ? Math.round((avgProtein / weightKg) * 100) / 100 : null;
  const avgSleep = avgSleepHours(7, userId);
  const goal = getNutritionGoal(userId);
  const avgCal = intake.length ? intake.reduce((s, r) => s + r.calories, 0) / intake.length : null;
  const calorieOk =
    avgCal == null || goal == null ? true : avgCal >= goal.calorieTarget * 0.8;

  const gates: GrowthReport['gates'] = {
    proteinOk: proteinGPerKg == null ? false : proteinGPerKg >= 1.6,
    sleepOk: avgSleep == null ? false : avgSleep >= 7,
    calorieOk,
    proteinGPerKg,
    avgSleep,
  };

  // ── Per-muscle aggregation ─────────────────────────────────────────────────
  const muscles: MuscleGrowthScore[] = [];
  for (const muscle of MUSCLE_GROUPS) {
    const mRows = rows.filter((r) => r.muscle === muscle);
    const setsThisWeek = mRows.filter((r) => now - r.startTime <= wk).length;
    const avgSetsPerWeek4w = mRows.length / 4;

    // Overload: volume last 2 weeks vs prior 2 weeks.
    const recentVol = mRows.filter((r) => now - r.startTime <= 2 * wk).reduce((s, r) => s + r.volume, 0);
    const priorVol = mRows
      .filter((r) => now - r.startTime > 2 * wk && now - r.startTime <= 4 * wk)
      .reduce((s, r) => s + r.volume, 0);
    const overloadTrendPct =
      priorVol > 0 ? Math.round(((recentVol - priorVol) / priorVol) * 100) : null;

    // Rest spacing: avg gap between distinct training days for this muscle.
    const days = [...new Set(mRows.map((r) => toISODate(new Date(r.startTime))))].sort();
    let avgRestDays: number | null = null;
    if (days.length >= 2) {
      let total = 0;
      for (let i = 1; i < days.length; i++) {
        total += Math.round(
          (new Date(days[i]).getTime() - new Date(days[i - 1]).getTime()) / 86_400_000
        );
      }
      avgRestDays = Math.round((total / (days.length - 1)) * 10) / 10;
    }

    muscles.push(
      scoreMuscle(
        {
          muscle,
          setsThisWeek,
          avgSetsPerWeek4w,
          overloadTrendPct,
          avgRestDays,
          sessionsPerWeek: days.length / 4,
        },
        gates
      )
    );
  }
  muscles.sort((a, b) => b.avgSetsPerWeek4w - a.avgSetsPerWeek4w);

  // ── Training age & realistic gain range ────────────────────────────────────
  const firstSession = db
    .select({ startTime: sessions.startTime })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(sessions.startTime)
    .limit(1)
    .get();
  const trainingAgeMonths = firstSession
    ? Math.max(0, Math.round((now - firstSession.startTime) / (30 * 86_400_000)))
    : 0;
  const user = getUser(userId);
  const gainRange = naturalGainRangeKgPerMonth(trainingAgeMonths, user?.sex ?? 'male');

  // ── Total weekly hard-set series (8 weeks) for the chart ───────────────────
  const rows8 = liftingSetRows(now - 8 * wk, userId);
  const weeklySetSeries: GrowthReport['weeklySetSeries'] = [];
  for (let w = 7; w >= 0; w--) {
    const from = now - (w + 1) * wk;
    const to = now - w * wk;
    const sets = rows8.filter((r) => r.startTime > from && r.startTime <= to).length;
    weeklySetSeries.push({ weekLabel: w === 0 ? 'now' : `-${w}w`, sets });
  }

  return { gates, muscles, trainingAgeMonths, gainRange, weeklySetSeries };
}
