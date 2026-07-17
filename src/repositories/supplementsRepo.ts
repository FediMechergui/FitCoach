import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/db/client';
import { supplementLogs, supplementStack, type SupplementLog, type SupplementStack } from '@/db/schema';
import { findSupplement } from '@/data/supplements';
import { daysAgoISO, todayISO } from '@/lib/date';
import { PRIMARY_USER_ID } from './userRepo';

// ── Stack (the user's chosen supplements for one-tap logging) ────────────────
export function getStack(userId: number = PRIMARY_USER_ID): SupplementStack[] {
  return db
    .select()
    .from(supplementStack)
    .where(and(eq(supplementStack.userId, userId), eq(supplementStack.enabled, true)))
    .all();
}

export function inStack(key: string, userId: number = PRIMARY_USER_ID): boolean {
  return (
    db
      .select()
      .from(supplementStack)
      .where(and(eq(supplementStack.userId, userId), eq(supplementStack.key, key), eq(supplementStack.enabled, true)))
      .get() != null
  );
}

export function addToStack(key: string, dose?: string, userId: number = PRIMARY_USER_ID): void {
  const existing = db
    .select()
    .from(supplementStack)
    .where(and(eq(supplementStack.userId, userId), eq(supplementStack.key, key)))
    .get();
  const def = findSupplement(key);
  const payload = { dose: dose ?? def?.defaultDose ?? null, enabled: true };
  if (existing) {
    db.update(supplementStack).set(payload).where(eq(supplementStack.id, existing.id)).run();
  } else {
    db.insert(supplementStack).values({ userId, key, ...payload }).run();
  }
}

export function removeFromStack(key: string, userId: number = PRIMARY_USER_ID): void {
  db.delete(supplementStack)
    .where(and(eq(supplementStack.userId, userId), eq(supplementStack.key, key)))
    .run();
}

// ── Logging ──────────────────────────────────────────────────────────────────
export function logSupplement(
  key: string,
  opts: { dose?: string; date?: string } = {},
  userId: number = PRIMARY_USER_ID
): void {
  const def = findSupplement(key);
  if (!def) return;
  db.insert(supplementLogs)
    .values({
      userId,
      date: opts.date ?? todayISO(),
      key,
      label: def.label,
      category: def.category,
      dose: opts.dose ?? def.defaultDose ?? null,
      micros: def.micros ? JSON.stringify(def.micros) : null,
    })
    .run();
}

export function deleteSupplementLog(id: number): void {
  db.delete(supplementLogs).where(eq(supplementLogs.id, id)).run();
}

export function loggedToday(key: string, date: string = todayISO(), userId: number = PRIMARY_USER_ID): boolean {
  return (
    db
      .select()
      .from(supplementLogs)
      .where(and(eq(supplementLogs.userId, userId), eq(supplementLogs.key, key), eq(supplementLogs.date, date)))
      .get() != null
  );
}

export function supplementsForDay(date: string = todayISO(), userId: number = PRIMARY_USER_ID): SupplementLog[] {
  return db
    .select()
    .from(supplementLogs)
    .where(and(eq(supplementLogs.userId, userId), eq(supplementLogs.date, date)))
    .orderBy(desc(supplementLogs.createdAt))
    .all();
}

/** Consecutive-day streak for a supplement, ending today (or yesterday). */
export function supplementStreak(key: string, userId: number = PRIMARY_USER_ID): number {
  const rows = db
    .select({ date: supplementLogs.date })
    .from(supplementLogs)
    .where(and(eq(supplementLogs.userId, userId), eq(supplementLogs.key, key), gte(supplementLogs.date, daysAgoISO(400))))
    .all();
  if (rows.length === 0) return 0;
  const days = new Set(rows.map((r) => r.date));
  let streak = 0;
  const start = days.has(todayISO()) ? 0 : 1;
  for (let i = start; i < 400; i++) {
    if (days.has(daysAgoISO(i))) streak++;
    else break;
  }
  return streak;
}
