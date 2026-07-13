import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/db/client';
import { dailyStepLogs, walkSessions, type DailyStepLog, type WalkSession } from '@/db/schema';
import { todayISO } from '@/lib/date';
import { PRIMARY_USER_ID } from './userRepo';

// ── Walk / Run sessions ──────────────────────────────────────────────────────
export function saveWalkSession(
  data: {
    mode: 'walk' | 'run';
    startTime: number;
    endTime: number;
    steps: number;
    distanceM: number;
    durationS: number;
    caloriesBurned: number;
    avgPace?: number | null;
    source: 'pedometer' | 'accelerometer' | 'gps';
  },
  userId: number = PRIMARY_USER_ID
): number {
  const res = db
    .insert(walkSessions)
    .values({
      userId,
      mode: data.mode,
      startTime: data.startTime,
      endTime: data.endTime,
      steps: data.steps,
      distanceM: data.distanceM,
      durationS: data.durationS,
      caloriesBurned: data.caloriesBurned,
      avgPace: data.avgPace ?? null,
      source: data.source,
    })
    .run();
  // Roll the session's steps into today's passive step total too.
  addSteps(data.steps, data.distanceM, data.caloriesBurned, todayISO(), userId);
  return Number(res.lastInsertRowId);
}

export function listWalkSessions(limit = 30, userId: number = PRIMARY_USER_ID): WalkSession[] {
  return db
    .select()
    .from(walkSessions)
    .where(eq(walkSessions.userId, userId))
    .orderBy(desc(walkSessions.startTime))
    .limit(limit)
    .all();
}

// ── Daily passive step counter ───────────────────────────────────────────────
export function getDailySteps(date: string = todayISO(), userId: number = PRIMARY_USER_ID): DailyStepLog | undefined {
  return db
    .select()
    .from(dailyStepLogs)
    .where(and(eq(dailyStepLogs.userId, userId), eq(dailyStepLogs.date, date)))
    .get();
}

/** Set today's absolute step count (e.g. from the hardware pedometer snapshot). */
export function setDailySteps(
  date: string,
  stepCount: number,
  distanceM: number,
  caloriesBurned: number,
  userId: number = PRIMARY_USER_ID
): void {
  const existing = getDailySteps(date, userId);
  if (existing) {
    db.update(dailyStepLogs)
      .set({ stepCount, distanceM, caloriesBurned })
      .where(eq(dailyStepLogs.id, existing.id))
      .run();
  } else {
    db.insert(dailyStepLogs).values({ userId, date, stepCount, distanceM, caloriesBurned }).run();
  }
}

/** Increment today's step total (e.g. from a completed walk session). */
export function addSteps(
  steps: number,
  distanceM: number,
  caloriesBurned: number,
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): void {
  const existing = getDailySteps(date, userId);
  if (existing) {
    db.update(dailyStepLogs)
      .set({
        stepCount: existing.stepCount + steps,
        distanceM: existing.distanceM + distanceM,
        caloriesBurned: existing.caloriesBurned + caloriesBurned,
      })
      .where(eq(dailyStepLogs.id, existing.id))
      .run();
  } else {
    db.insert(dailyStepLogs).values({ userId, date, stepCount: steps, distanceM, caloriesBurned }).run();
  }
}

export function stepHistorySince(sinceISO: string, userId: number = PRIMARY_USER_ID): DailyStepLog[] {
  return db
    .select()
    .from(dailyStepLogs)
    .where(and(eq(dailyStepLogs.userId, userId), gte(dailyStepLogs.date, sinceISO)))
    .orderBy(dailyStepLogs.date)
    .all();
}
