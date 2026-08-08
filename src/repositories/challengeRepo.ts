import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  beverageEntries,
  dailyChallenges,
  exerciseLogs,
  exercises,
  prayerLogs,
  selfCareLogs,
  sessions,
  setEntries,
  sleepLogs,
  smokingEntries,
  supplementLogs,
  supplementStack,
  type DailyChallenge,
} from '@/db/schema';
import { CHALLENGES, findChallenge, type ChallengeDef, type ChallengeMetric } from '@/data/challenges';
import { buildDailyWheel, isChallengeComplete, type ChallengeContext, type DailyWheel } from '@/lib/challengeWheel';
import { hardSetCredit } from '@/lib/effort';
import { daysAgoISO, todayISO } from '@/lib/date';
import { dayNutrition } from './nutritionRepo';
import { getDailySteps } from './activityRepo';
import { getNutritionGoal, PRIMARY_USER_ID } from './userRepo';

/**
 * The daily challenge: spinning, measuring and completing.
 *
 * Progress is always **measured**, never declared. Every metric reads the same
 * tables the rest of the app writes to, so a challenge is completed by doing
 * the thing, not by tapping a box — which is the only version of this feature
 * worth having.
 */

// ── Spinning ─────────────────────────────────────────────────────────────────

export function challengeForDate(
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): DailyChallenge | undefined {
  return db
    .select()
    .from(dailyChallenges)
    .where(and(eq(dailyChallenges.userId, userId), eq(dailyChallenges.date, date)))
    .get();
}

/** Challenge keys landed on in the last two weeks, so the wheel varies. */
function recentKeys(userId: number, days = 14): string[] {
  return db
    .select({ key: dailyChallenges.challengeKey })
    .from(dailyChallenges)
    .where(and(eq(dailyChallenges.userId, userId), gte(dailyChallenges.date, daysAgoISO(days))))
    .all()
    .map((r) => r.key);
}

export function wheelForToday(
  ctx: Omit<ChallengeContext, 'recentKeys'>,
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): DailyWheel | null {
  return buildDailyWheel(date, { ...ctx, recentKeys: recentKeys(userId) });
}

/**
 * Record the spin. Idempotent on purpose: if today already has a challenge the
 * existing row is returned untouched, so re-spinning for an easier one is not
 * possible — which is what makes finishing one mean anything.
 */
export function spinDailyChallenge(
  ctx: Omit<ChallengeContext, 'recentKeys'>,
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): DailyChallenge | undefined {
  const existing = challengeForDate(date, userId);
  if (existing) return existing;

  const wheel = wheelForToday(ctx, date, userId);
  if (!wheel) return undefined;

  db.insert(dailyChallenges)
    .values({ userId, date, challengeKey: wheel.challenge.key, spunAt: Date.now() })
    .run();
  return challengeForDate(date, userId);
}

// ── Measuring ────────────────────────────────────────────────────────────────

/** Sessions finished on a date, with their exercise logs — the training basis. */
function sessionsOn(date: string, userId: number) {
  return db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .all()
    .filter((s) => toDate(s.startTime) === date);
}

const toDate = (ms: number): string => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Sets logged on a date, joined to their exercise for muscle grouping. */
function setsOn(date: string, userId: number) {
  const ids = sessionsOn(date, userId).map((s) => s.id);
  if (!ids.length) return [];
  return db
    .select({
      reps: setEntries.reps,
      rpe: setEntries.rpe,
      toFailure: setEntries.toFailure,
      completed: setEntries.completed,
      muscle: exercises.primaryMuscle,
      exerciseId: exerciseLogs.exerciseId,
      sessionId: exerciseLogs.sessionId,
    })
    .from(setEntries)
    .innerJoin(exerciseLogs, eq(setEntries.exerciseLogId, exerciseLogs.id))
    .innerJoin(exercises, eq(exerciseLogs.exerciseId, exercises.id))
    .all()
    .filter((r) => ids.includes(r.sessionId) && r.completed);
}

export interface ChallengeMeasurement {
  current: number;
  target: number;
  complete: boolean;
  /** true when the metric can't be read because the feature is off */
  unavailable?: boolean;
}

/**
 * Read one metric for a date. Every branch reads real logged data; there is no
 * "assume it happened" path, and an unreadable metric returns 0 rather than a
 * flattering guess.
 */
export function measureMetric(
  metric: ChallengeMetric,
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): number {
  try {
    switch (metric) {
      case 'steps':
        return getDailySteps(date, userId)?.stepCount ?? 0;
      case 'walkDistanceM':
        return getDailySteps(date, userId)?.distanceM ?? 0;
      case 'waterMl':
        return sumBeverages(date, userId);
      case 'proteinG':
        return dayNutrition(date, userId).protein;
      case 'fibreG':
        return dayNutrition(date, userId).fiber;
      case 'caloriesLogged': {
        const n = dayNutrition(date, userId);
        // Meals that actually contain something — an empty meal isn't a log.
        return (Object.values(n.byMeal) as Array<unknown[]>).filter((m) => m.length > 0).length;
      }
      case 'withinCalorieTarget': {
        const goal = getNutritionGoal(userId);
        const n = dayNutrition(date, userId);
        // Nothing logged is not success — you cannot be inside a line you never drew.
        if (!goal || n.calories <= 0) return 0;
        return n.calories <= goal.calorieTarget ? 1 : 0;
      }
      case 'sessionMinutes':
        return Math.round(
          sessionsOn(date, userId).reduce((s, x) => s + (x.durationS ?? 0), 0) / 60
        );
      case 'sessionCount':
        return sessionsOn(date, userId).filter((s) => s.endTime != null).length;
      case 'hardSets':
        return Math.round(
          setsOn(date, userId).reduce(
            (s, r) => s + hardSetCredit({ reps: r.reps, rpe: r.rpe, toFailure: !!r.toFailure }),
            0
          )
        );
      case 'failureSets':
        return setsOn(date, userId).filter((r) => r.toFailure).length;
      case 'distinctMuscles':
        return new Set(setsOn(date, userId).map((r) => r.muscle).filter(Boolean)).size;
      case 'meditationMinutes':
        return sessionMinutesOfType(date, userId, ['meditation']);
      case 'mindbodyMinutes':
        return sessionMinutesOfType(date, userId, ['mindbody']);
      case 'newExerciseTried':
        return countFirstTimeExercises(date, userId);
      case 'prayersDone':
        return countPrayers(date, userId);
      case 'selfCareDone':
        return countSelfCare(date, userId);
      case 'supplementsTaken':
        return allStackTaken(date, userId);
      case 'smokeFreeDay':
        return smokeFree(date, userId);
      case 'sleepHours':
        return sleepFor(date, userId);
      default:
        return 0;
    }
  } catch {
    // A missing table or a feature that was never enabled must never crash the
    // Home screen — an unreadable metric simply reads as no progress.
    return 0;
  }
}

function sessionMinutesOfType(date: string, userId: number, types: string[]): number {
  return Math.round(
    sessionsOn(date, userId)
      .filter((s) => types.includes(s.sessionType))
      .reduce((sum, s) => sum + (s.durationS ?? 0), 0) / 60
  );
}

/** Exercises logged today that had never been logged on any earlier day. */
function countFirstTimeExercises(date: string, userId: number): number {
  const todayIds = new Set(setsOn(date, userId).map((r) => r.exerciseId));
  if (!todayIds.size) return 0;
  const earlierIds = new Set(
    db
      .select({ exerciseId: exerciseLogs.exerciseId, startTime: sessions.startTime })
      .from(exerciseLogs)
      .innerJoin(sessions, eq(exerciseLogs.sessionId, sessions.id))
      .where(eq(sessions.userId, userId))
      .all()
      .filter((r) => toDate(r.startTime) < date)
      .map((r) => r.exerciseId)
  );
  return [...todayIds].filter((id) => !earlierIds.has(id)).length;
}

// The remaining metrics read optional-feature tables. A feature that was never
// switched on simply has no rows, which reads as no progress — the try/catch in
// measureMetric covers anything worse than that.
function sumBeverages(date: string, userId: number): number {
  return db
    .select()
    .from(beverageEntries)
    .where(and(eq(beverageEntries.userId, userId), eq(beverageEntries.date, date)))
    .all()
    .reduce((s, r) => s + (r.volumeMl ?? 0), 0);
}

function countPrayers(date: string, userId: number): number {
  // A row exists only when the prayer was marked done, and each of the five
  // logs at most once — so distinct rows is the count.
  return new Set(
    db
      .select()
      .from(prayerLogs)
      .where(and(eq(prayerLogs.userId, userId), eq(prayerLogs.date, date)))
      .all()
      .map((r) => r.prayer)
  ).size;
}

function countSelfCare(date: string, userId: number): number {
  return db
    .select()
    .from(selfCareLogs)
    .where(and(eq(selfCareLogs.userId, userId), eq(selfCareLogs.date, date)))
    .all().length;
}

/** 1 only when every enabled supplement in the stack was logged that day. */
function allStackTaken(date: string, userId: number): number {
  const stack = db
    .select()
    .from(supplementStack)
    .where(and(eq(supplementStack.userId, userId), eq(supplementStack.enabled, true)))
    .all();
  if (!stack.length) return 0;
  const logged = new Set(
    db
      .select()
      .from(supplementLogs)
      .where(and(eq(supplementLogs.userId, userId), eq(supplementLogs.date, date)))
      .all()
      .map((r) => r.key)
  );
  return stack.every((s) => logged.has(s.key)) ? 1 : 0;
}

/** 1 when nothing at all was logged in the smoking tracker that day. */
function smokeFree(date: string, userId: number): number {
  const any = db
    .select()
    .from(smokingEntries)
    .where(and(eq(smokingEntries.userId, userId), eq(smokingEntries.date, date)))
    .get();
  return any ? 0 : 1;
}

function sleepFor(date: string, userId: number): number {
  const row = db
    .select()
    .from(sleepLogs)
    .where(and(eq(sleepLogs.userId, userId), eq(sleepLogs.date, date)))
    .get();
  return row?.hours ?? 0;
}

// ── Completion ───────────────────────────────────────────────────────────────

export function measureChallenge(
  def: ChallengeDef,
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): ChallengeMeasurement {
  const current = measureMetric(def.metric, date, userId);
  return { current, target: def.target, complete: isChallengeComplete(current, def.target) };
}

/**
 * Check today's challenge and stamp it complete if the metric has reached its
 * target. Safe to call as often as you like — it only ever writes once, and it
 * never un-completes something, so a step count that dips after a sync can't
 * take a finished challenge away from you.
 */
export function refreshChallengeCompletion(
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): DailyChallenge | undefined {
  const row = challengeForDate(date, userId);
  if (!row || row.completedAt) return row;
  const def = findChallenge(row.challengeKey);
  if (!def) return row;
  const m = measureChallenge(def, date, userId);
  if (!m.complete) return row;
  db.update(dailyChallenges)
    .set({ completedAt: Date.now(), finalValue: m.current })
    .where(eq(dailyChallenges.id, row.id))
    .run();
  return challengeForDate(date, userId);
}

// ── Stats (for the screen and the achievements) ──────────────────────────────

export interface ChallengeStats {
  spun: number;
  completed: number;
  points: number;
  /** consecutive days ending today (or yesterday) with a completed challenge */
  streak: number;
  bestStreak: number;
  hardCompleted: number;
  distinctCategories: number;
  distinctChallenges: number;
}

export function challengeStats(userId: number = PRIMARY_USER_ID): ChallengeStats {
  const rows = db
    .select()
    .from(dailyChallenges)
    .where(eq(dailyChallenges.userId, userId))
    .orderBy(desc(dailyChallenges.date))
    .all();

  const done = rows.filter((r) => r.completedAt != null);
  const defs = done.map((r) => findChallenge(r.challengeKey)).filter((d): d is ChallengeDef => !!d);

  const points = defs.reduce((s, d) => s + POINTS[d.difficulty], 0);
  const doneDates = new Set(done.map((r) => r.date));

  // Current streak: today counts if done, otherwise start from yesterday so an
  // unfinished day in progress doesn't look like a broken streak.
  let streak = 0;
  const start = doneDates.has(todayISO()) ? 0 : 1;
  for (let i = start; i < 400; i++) {
    if (doneDates.has(daysAgoISO(i))) streak++;
    else break;
  }

  // Best streak over all history.
  const sorted = [...doneDates].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && isNextDay(prev, d) ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }

  return {
    spun: rows.length,
    completed: done.length,
    points,
    streak,
    bestStreak: best,
    hardCompleted: defs.filter((d) => d.difficulty === 'hard').length,
    distinctCategories: new Set(defs.map((d) => d.category)).size,
    distinctChallenges: new Set(done.map((r) => r.challengeKey)).size,
  };
}

const POINTS = { easy: 10, medium: 20, hard: 35 } as const;

function isNextDay(prev: string, next: string): boolean {
  const a = new Date(prev).getTime();
  const b = new Date(next).getTime();
  return Math.round((b - a) / 86_400_000) === 1;
}

/** Recent challenges with their outcome, for the history list. */
export function challengeHistory(limit = 30, userId: number = PRIMARY_USER_ID) {
  return db
    .select()
    .from(dailyChallenges)
    .where(eq(dailyChallenges.userId, userId))
    .orderBy(desc(dailyChallenges.date))
    .limit(limit)
    .all()
    .map((r) => ({ row: r, def: findChallenge(r.challengeKey) }))
    .filter((x): x is { row: DailyChallenge; def: ChallengeDef } => !!x.def);
}

export const ALL_CHALLENGE_KEYS = CHALLENGES.map((c) => c.key);
