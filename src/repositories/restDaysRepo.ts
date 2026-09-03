import { and, eq, gte } from 'drizzle-orm';
import { db } from '@/db/client';
import { restDays } from '@/db/schema';
import { daysAgoISO, todayISO } from '@/lib/date';
import { PRIMARY_USER_ID } from './userRepo';

/**
 * Rest days — a day you chose not to train, on purpose.
 *
 * Before 3.2 the app could not tell a rest day from a missed day: both were
 * "no session", both broke the training streak, both broke the challenge
 * streak, and the coach nagged about either. A flagged rest day is a decision,
 * and the app treats it as one: the streaks carry across it (it does not add
 * to them — it is not a training day), the no-rest warning resets on it, the
 * athlete card's recovery already counts it, and the coach stops asking.
 */

export function isRestDay(date: string = todayISO(), userId: number = PRIMARY_USER_ID): boolean {
  return !!db
    .select({ id: restDays.id })
    .from(restDays)
    .where(and(eq(restDays.userId, userId), eq(restDays.date, date)))
    .get();
}

export function setRestDay(on: boolean, date: string = todayISO(), userId: number = PRIMARY_USER_ID): void {
  if (on) {
    if (isRestDay(date, userId)) return;
    db.insert(restDays).values({ userId, date, source: 'manual' }).run();
  } else {
    db.delete(restDays).where(and(eq(restDays.userId, userId), eq(restDays.date, date))).run();
  }
}

/** Every flagged date on or after `since`, for streak walks. */
export function restDaySet(since: string = daysAgoISO(400), userId: number = PRIMARY_USER_ID): Set<string> {
  return new Set(
    db
      .select({ date: restDays.date })
      .from(restDays)
      .where(and(eq(restDays.userId, userId), gte(restDays.date, since)))
      .all()
      .map((r) => r.date)
  );
}

export function restDayCount(sinceDays: number | null = null, userId: number = PRIMARY_USER_ID): number {
  const rows = db
    .select({ date: restDays.date })
    .from(restDays)
    .where(sinceDays == null ? eq(restDays.userId, userId) : and(eq(restDays.userId, userId), gte(restDays.date, daysAgoISO(sinceDays - 1))))
    .all();
  return rows.length;
}

// The streak arithmetic itself is pure and lives in src/lib/streaks.ts, where
// the suite can prove it without a database.
export { bridgedStreak, bestBridgedStreak, onlyRestBetween } from '@/lib/streaks';
