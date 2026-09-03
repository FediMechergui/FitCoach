import { and, desc, eq, gte, lt } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  beverageEntries,
  dailyChallenges,
  exerciseLogs,
  exercises,
  fastingLogs,
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
import { isRestDay } from './restDaysRepo';
import { listWalkSessions } from './activityRepo';
import { napsForDate } from './sleepRepo';
import { dayMicros } from './microsRepo';
import { microGaps } from '@/lib/micros';
import { getUser } from './userRepo';
import { CHALLENGES, DIFFICULTY_POINTS, findChallenge, type ChallengeDef, type ChallengeMetric } from '@/data/challenges';
import { bestBridgedStreak, bridgedStreak } from '@/lib/streaks';
import { restDaySet } from './restDaysRepo';
import { buildDailyWheel, isChallengeComplete, type ChallengeContext, type DailyWheel } from '@/lib/challengeWheel';
import { hardSetCredit } from '@/lib/effort';
import { productOrDefault } from '@/data/nicotineProducts';
import { daysAgoISO, todayISO } from '@/lib/date';
import { dayNutrition } from './nutritionRepo';
import { getDailySteps } from './activityRepo';
import { getNutritionGoal, PRIMARY_USER_ID } from './userRepo';
import { supplementFoodEntryIds } from './supplementsRepo';

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

/**
 * Challenge keys landed on in the two weeks BEFORE `date`, so the wheel varies.
 *
 * Strictly before: today's own spin must not count as "recent", because the
 * wheel is rebuilt on every visit. Including today meant that the moment you
 * spun, the rebuilt wheel rotated today's challenge out of its own segments —
 * and the settled pointer sat on some other wedge than the challenge shown
 * beneath it.
 */
function recentKeys(userId: number, before: string, days = 14): string[] {
  return db
    .select({ key: dailyChallenges.challengeKey })
    .from(dailyChallenges)
    .where(and(eq(dailyChallenges.userId, userId), gte(dailyChallenges.date, daysAgoISO(days)), lt(dailyChallenges.date, before)))
    .all()
    .map((r) => r.key);
}

export function wheelForToday(
  ctx: Omit<ChallengeContext, 'recentKeys'>,
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): DailyWheel | null {
  return buildDailyWheel(date, { ...ctx, recentKeys: recentKeys(userId, date) });
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
      isPr: setEntries.isPr,
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
        /*
         * A meal counts when it holds something the user actually logged.
         * Supplement-created rows are excluded: a fish-oil tap auto-writes a
         * snack entry, and "log your meals honestly" being satisfied by a pill
         * defeats the challenge it's measuring.
         */
        const suppRows = supplementFoodEntryIds(date, userId);
        return (Object.values(n.byMeal) as Array<Array<{ id: number }>>).filter((m) =>
          m.some((e) => !suppRows.has(e.id))
        ).length;
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
      case 'burnedKcal': {
        /*
         * Training sessions + walks. No double count: walk calories roll into
         * daily_step_logs, and on-foot SESSIONS contribute steps to that table
         * but never calories (contributeSteps passes 0), so the two sources
         * are disjoint by construction.
         */
        const fromSessions = sessionsOn(date, userId).reduce((s, x) => s + (x.caloriesBurned ?? 0), 0);
        const fromWalks = getDailySteps(date, userId)?.caloriesBurned ?? 0;
        return Math.round(fromSessions + fromWalks);
      }
      // ── 3.2.1 ──
      case 'restDayTaken':
        return isRestDay(date, userId) ? 1 : 0;
      case 'walkSessions':
        return listWalkSessions(500, userId).filter((w) => toDate(w.startTime) === date).length;
      case 'distinctExercises':
        return new Set(setsOn(date, userId).map((r) => r.exerciseId)).size;
      case 'prsToday':
        return setsOn(date, userId).filter((r) => !!r.isPr).length;
      case 'caffeineUnderLimit': {
        // A day with nothing logged is not "under" anything — it is unmeasured.
        const rows = db
          .select()
          .from(beverageEntries)
          .where(and(eq(beverageEntries.userId, userId), eq(beverageEntries.date, date)))
          .all();
        if (!rows.length) return 0;
        const mg = rows.reduce((s, r) => s + (r.caffeineMg ?? 0), 0);
        const limit = getNutritionGoal(userId)?.caffeineSoftLimitMg ?? 400;
        return mg <= limit ? 1 : 0;
      }
      case 'napMinutes':
        return napsForDate(date, userId).reduce((s, n) => s + (n.minutes ?? 0), 0);
      case 'fastedDay':
        return db
          .select()
          .from(fastingLogs)
          .where(and(eq(fastingLogs.userId, userId), eq(fastingLogs.date, date)))
          .all()
          .some((r) => r.completed)
          ? 1
          : 0;
      case 'microGapsZero': {
        // Only a day that carried micronutrient data can be gap-free; silence is not health.
        const m = dayMicros(date, userId);
        if (m.foodEntriesWithMicros === 0 && m.supplementCount === 0) return 0;
        const sex = getUser(userId)?.sex ?? 'male';
        return microGaps(m.totals, sex).length === 0 ? 1 : 0;
      }
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
  /*
   * The challenge says "without smoking anything", and it means it literally:
   * a nicotine pouch or a piece of NRT gum is not smoking, and failing the
   * challenge for using one punishes exactly the substitution the smoking
   * tracker exists to encourage. Only combusted products break a clean day.
   */
  const smoked = db
    .select()
    .from(smokingEntries)
    .where(and(eq(smokingEntries.userId, userId), eq(smokingEntries.date, date)))
    .all()
    .some((r) => productOrDefault(r.productKey).combusted);
  return smoked ? 0 : 1;
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

  const points = defs.reduce((s, d) => s + DIFFICULTY_POINTS[d.difficulty], 0);
  const doneDates = new Set(done.map((r) => r.date));
  // A flagged rest day carries the streak across without counting — the wheel
  // asks for movement most days, and a rest day is the one you chose not to.
  const rest = restDaySet(daysAgoISO(400), userId);

  // Current streak: today counts if done, otherwise start from yesterday so an
  // unfinished day in progress doesn't look like a broken streak.
  const streak = bridgedStreak((d) => doneDates.has(d), (d) => rest.has(d));

  // Best streak over all history, rest days bridging.
  const sorted = [...doneDates].sort();
  const best = bestBridgedStreak(sorted, rest);

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

/** Points earned on or after `since` — the windowed reader the athlete card needs. */
export function challengePointsSince(since: string, userId: number = PRIMARY_USER_ID): number {
  const rows = db
    .select({ key: dailyChallenges.challengeKey, completedAt: dailyChallenges.completedAt })
    .from(dailyChallenges)
    .where(and(eq(dailyChallenges.userId, userId), gte(dailyChallenges.date, since)))
    .all();
  return rows.reduce((sum, r) => {
    if (r.completedAt == null) return sum;
    const def = findChallenge(r.key);
    return sum + (def ? DIFFICULTY_POINTS[def.difficulty] : 0);
  }, 0);
}

/**
 * Stamp completions the screen never saw. Every metric is measured by date, so
 * a day done and not revisited before midnight is still provably done — walk
 * the last `days` and stamp what was earned. Called at boot and on the
 * challenge screen, never from a look at Home.
 */
export function catchUpChallengeCompletions(days = 7, userId: number = PRIMARY_USER_ID): number {
  let stamped = 0;
  for (let i = days - 1; i >= 0; i--) {
    const date = daysAgoISO(i);
    const before = challengeForDate(date, userId);
    if (!before || before.completedAt) continue;
    const after = refreshChallengeCompletion(date, userId);
    if (after?.completedAt) stamped++;
  }
  return stamped;
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
