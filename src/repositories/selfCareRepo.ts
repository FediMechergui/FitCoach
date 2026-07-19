import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { selfCareLogs } from '@/db/schema';
import { selfCareItem } from '@/lib/selfCare';
import { todayISO } from '@/lib/date';
import { PRIMARY_USER_ID } from './userRepo';

/** Today's self-care counts keyed by item (missing = 0). */
export function getSelfCare(date: string = todayISO(), userId: number = PRIMARY_USER_ID): Record<string, number> {
  const rows = db
    .select()
    .from(selfCareLogs)
    .where(and(eq(selfCareLogs.userId, userId), eq(selfCareLogs.date, date)))
    .all();
  const out: Record<string, number> = {};
  for (const r of rows) out[r.key] = r.count;
  return out;
}

function setCount(key: string, count: number, date: string, userId: number): void {
  const existing = db
    .select()
    .from(selfCareLogs)
    .where(and(eq(selfCareLogs.userId, userId), eq(selfCareLogs.date, date), eq(selfCareLogs.key, key)))
    .get();
  if (existing) {
    db.update(selfCareLogs).set({ count }).where(eq(selfCareLogs.id, existing.id)).run();
  } else {
    db.insert(selfCareLogs).values({ userId, date, key, count }).run();
  }
}

/**
 * Bump a self-care item by +1, wrapping back to 0 once its daily target is hit
 * (so tapping cycles 0→1→…→target→0). Returns the new count.
 */
export function bumpSelfCare(key: string, date: string = todayISO(), userId: number = PRIMARY_USER_ID): number {
  const target = selfCareItem(key)?.target ?? 1;
  const current = getSelfCare(date, userId)[key] ?? 0;
  const next = current >= target ? 0 : current + 1;
  setCount(key, next, date, userId);
  return next;
}

export function setSelfCare(key: string, count: number, date: string = todayISO(), userId: number = PRIMARY_USER_ID): void {
  setCount(key, Math.max(0, count), date, userId);
}
