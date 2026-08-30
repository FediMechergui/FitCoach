import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { appKv } from '@/db/schema';

/**
 * Tiny JSON key–value store (table `app_kv`) for app-level state that isn't a
 * log: the step counter's day baseline, the auto-walk-detection toggle, and the
 * like. Values round-trip through JSON so callers keep their types.
 */

export function kvGet<T>(key: string): T | null {
  try {
    const row = db.select().from(appKv).where(eq(appKv.key, key)).get();
    if (!row) return null;
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

export function kvSet(key: string, value: unknown): void {
  const json = JSON.stringify(value);
  const now = Date.now();
  try {
    db.insert(appKv)
      .values({ key, value: json, updatedAt: now })
      .onConflictDoUpdate({ target: appKv.key, set: { value: json, updatedAt: now } })
      .run();
  } catch {
    // A failed write here loses a convenience value, never user data.
  }
}
