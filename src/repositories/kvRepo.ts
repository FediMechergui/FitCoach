import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { appKv } from '@/db/schema';

/**
 * Small JSON key–value store (`app_kv`) for app-level state that is neither a
 * log nor worth a table: the OpenRouter key behind photo food logging, and
 * whatever else must persist without earning a schema.
 *
 * Nothing here leaves the device. The API key in particular is deliberately
 * stored only in the app's own database and never in the repository, the
 * JavaScript bundle or an environment file — the repository is public, and a
 * key shipped inside an app can be extracted from it.
 */

export const KV_OPENROUTER_KEY = 'openrouter.apiKey';
export const KV_OPENROUTER_MODEL = 'openrouter.model';

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
    // Losing a convenience value is survivable; never let it reach the UI.
  }
}

export function kvDelete(key: string): void {
  try {
    db.delete(appKv).where(eq(appKv.key, key)).run();
  } catch {
    // ignore
  }
}

/** The stored OpenRouter key, or null when the feature hasn't been set up. */
export function openRouterKey(): string | null {
  const v = kvGet<string>(KV_OPENROUTER_KEY);
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
}

export function setOpenRouterKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) kvSet(KV_OPENROUTER_KEY, trimmed);
  else kvDelete(KV_OPENROUTER_KEY);
}
