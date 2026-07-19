import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { hormoneFlags, type HormoneFlag, type HormoneStatus } from '@/db/schema';
import { findHormone } from '@/lib/hormones';
import { PRIMARY_USER_ID } from './userRepo';

export function listHormoneFlags(userId: number = PRIMARY_USER_ID): HormoneFlag[] {
  return db
    .select()
    .from(hormoneFlags)
    .where(and(eq(hormoneFlags.userId, userId), eq(hormoneFlags.active, true)))
    .all();
}

export function hormoneFlag(key: string, userId: number = PRIMARY_USER_ID): HormoneFlag | undefined {
  return db
    .select()
    .from(hormoneFlags)
    .where(and(eq(hormoneFlags.userId, userId), eq(hormoneFlags.hormoneKey, key), eq(hormoneFlags.active, true)))
    .get();
}

/** Add or update a hormone flag (set its status/notes). Idempotent per key. */
export function setHormoneFlag(
  key: string,
  status: HormoneStatus,
  notes?: string | null,
  userId: number = PRIMARY_USER_ID
): void {
  const existing = hormoneFlag(key, userId);
  const def = findHormone(key);
  if (existing) {
    db.update(hormoneFlags)
      .set({ status, notes: notes ?? existing.notes ?? null })
      .where(eq(hormoneFlags.id, existing.id))
      .run();
  } else {
    db.insert(hormoneFlags)
      .values({
        userId,
        hormoneKey: key,
        label: def?.label ?? key,
        status,
        notes: notes ?? null,
        active: true,
      })
      .run();
  }
}

export function removeHormoneFlag(key: string, userId: number = PRIMARY_USER_ID): void {
  db.delete(hormoneFlags)
    .where(and(eq(hormoneFlags.userId, userId), eq(hormoneFlags.hormoneKey, key)))
    .run();
}
