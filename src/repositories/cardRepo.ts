import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { exerciseLogs, exercises, sessions, setEntries } from '@/db/schema';
import { computeRating, type CardRating, type RatingInputs } from '@/lib/rating';
import { estimate1RM } from '@/lib/oneRepMax';
import { daysAgoISO, toISODate } from '@/lib/date';
import { currentStreak } from './statsRepo';
import { dailyIntakeSince } from './nutritionRepo';
import { getNutritionGoal, latestWeight, PRIMARY_USER_ID } from './userRepo';
import { weeklyStepAverage } from './coachRepo';
import { avgSleepHours } from './sleepRepo';
import { avgCigarettesPerDay, getSmokingProfile } from './smokingRepo';
import { avgAlcoholGramsPerWeek } from './alcoholRepo';

/** Sum of the user's best estimated 1RM across their top 3 lifts. */
function topLiftsBest1RM(userId: number): number {
  const rows = db
    .select({
      exerciseId: exerciseLogs.exerciseId,
      reps: setEntries.reps,
      weightKg: setEntries.weightKg,
    })
    .from(setEntries)
    .innerJoin(exerciseLogs, eq(setEntries.exerciseLogId, exerciseLogs.id))
    .innerJoin(sessions, eq(exerciseLogs.sessionId, sessions.id))
    .innerJoin(exercises, eq(exerciseLogs.exerciseId, exercises.id))
    .where(and(eq(sessions.userId, userId), eq(setEntries.completed, true)))
    .all();

  const bestByExercise = new Map<number, number>();
  for (const r of rows) {
    if (!r.weightKg || !r.reps) continue;
    const e = estimate1RM(r.weightKg, r.reps);
    bestByExercise.set(r.exerciseId, Math.max(bestByExercise.get(r.exerciseId) ?? 0, e));
  }
  const top3 = [...bestByExercise.values()].sort((a, b) => b - a).slice(0, 3);
  return top3.reduce((s, v) => s + v, 0);
}

export function buildRatingInputs(userId: number = PRIMARY_USER_ID): RatingInputs {
  const since28 = daysAgoISO(27);
  const since7 = daysAgoISO(6);

  const sess28 = db.select().from(sessions).where(eq(sessions.userId, userId)).all();
  const recent28 = sess28.filter((s) => toISODate(new Date(s.startTime)) >= since28);
  const recent7 = sess28.filter((s) => toISODate(new Date(s.startTime)) >= since7);

  const weightKg = latestWeight(userId)?.weightKg ?? 75;
  const relativeStrength = weightKg > 0 ? topLiftsBest1RM(userId) / weightKg : 0;

  const cardioMinutes = recent7
    .filter((s) => ['cardio', 'outdoor', 'sport'].includes(s.sessionType))
    .reduce((sum, s) => sum + (s.durationS ?? 0) / 60, 0);

  const trainingDays7 = new Set(recent7.map((s) => toISODate(new Date(s.startTime)))).size;

  const goal = getNutritionGoal(userId);
  const intake = dailyIntakeSince(since7, userId);
  const calAdh = adherence(intake.map((r) => r.calories), goal?.calorieTarget ?? 2200);
  const protAdh = adherenceProtein(intake.map((r) => r.protein), goal?.proteinG ?? 140);

  return {
    avgSessionsPerWeek: recent28.length / 4,
    streakDays: currentStreak(userId),
    relativeStrength,
    weeklyCardioMinutes: cardioMinutes,
    avgStepsPerDay: weeklyStepAverage(userId),
    calorieAdherence: calAdh,
    proteinAdherence: protAdh,
    avgSleepHours: avgSleepHours(7, userId),
    restDaysPerWeek: Math.max(0, 7 - trainingDays7),
    loggingDaysPerWeek: intake.length,
    cigarettesPerDay: getSmokingProfile(userId)?.enabled ? avgCigarettesPerDay(7, userId) : 0,
    alcoholGramsPerWeek: avgAlcoholGramsPerWeek(userId),
  };
}

/** Adherence 0..1: 1 when average is near target, decaying as it deviates. */
function adherence(values: number[], target: number): number {
  if (values.length === 0 || target <= 0) return 0;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const deviation = Math.abs(avg - target) / target;
  return Math.max(0, 1 - deviation);
}

/** Protein adherence rewards hitting/exceeding target (no penalty for over). */
function adherenceProtein(values: number[], target: number): number {
  if (values.length === 0 || target <= 0) return 0;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.max(0, Math.min(1, avg / target));
}

export function computeCardRating(userId: number = PRIMARY_USER_ID): CardRating {
  return computeRating(buildRatingInputs(userId));
}
