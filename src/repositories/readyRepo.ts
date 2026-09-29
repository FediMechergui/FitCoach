import { and, eq, isNotNull, like } from 'drizzle-orm';
import { db } from '@/db/client';
import { sessions } from '@/db/schema';
import { parseReadyStyle } from '@/data/readySessions';
import { PRIMARY_USER_ID } from './userRepo';

/**
 * What has been done of the ready sessions: how many times each, and when last.
 * Read from the sessions themselves (their `style` tag), so there is nothing
 * to keep in step and nothing to migrate.
 */

export interface ReadyDone {
  count: number;
  lastAt: number;
}

export function readyHistory(userId: number = PRIMARY_USER_ID): Record<string, ReadyDone> {
  const rows = db
    .select({ style: sessions.style, startTime: sessions.startTime })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNotNull(sessions.endTime), like(sessions.style, 'ready:%')))
    .all();
  const out: Record<string, ReadyDone> = {};
  for (const r of rows) {
    const key = parseReadyStyle(r.style);
    if (!key) continue;
    const seen = out[key];
    if (seen) {
      seen.count++;
      if (r.startTime > seen.lastAt) seen.lastAt = r.startTime;
    } else {
      out[key] = { count: 1, lastAt: r.startTime };
    }
  }
  return out;
}
