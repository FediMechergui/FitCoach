import { metaFor } from '@/constants/sessionTypes';
import type { SessionType } from '@/db/schema';
import { marginsStillRunning, postSessionMargins, sessionStrain, type Margin, type Strain } from '@/lib/postSession';
import { getSessionDetail, listSessions } from './sessionRepo';
import { latestWeight, PRIMARY_USER_ID } from './userRepo';
import { isSmokingEnabled } from './smokingRepo';

export interface PostSession {
  /** epoch ms the session ended */
  endedAt: number;
  strain: Strain;
  margins: Margin[];
  sessionType: string;
}

/**
 * The after-session picture for a finished session: how hard it was, from
 * what was logged, and the margins that follow. Only the smoke line depends
 * on a module being on — alcohol advice is worth having whether or not the
 * tracker is used.
 */
export function postSessionFor(sessionId: number, userId: number = PRIMARY_USER_ID): PostSession | null {
  const { session, logs } = getSessionDetail(sessionId);
  const endedAt = session.endTime ?? (session.durationS != null ? session.startTime + session.durationS * 1000 : null);
  if (endedAt == null) return null;
  const meta = metaFor(session.sessionType as SessionType);
  const sets = logs.flatMap((l) =>
    l.sets
      .filter((s) => s.completed)
      .map((s) => ({ reps: s.reps, rpe: s.rpe, toFailure: !!s.toFailure, bodyweight: l.equipmentType === 'bodyweight' }))
  );
  const strain = sessionStrain({
    sessionType: session.sessionType,
    flow: meta.flow,
    durationMin: (session.durationS ?? Math.max(0, endedAt - session.startTime) / 1000) / 60,
    sets,
    volumeKg: session.totalVolume ?? null,
    distanceM: session.distanceM ?? null,
    bodyweightKg: latestWeight(userId)?.weightKg ?? null,
  });
  const margins = postSessionMargins(strain, meta.flow, { smokingEnabled: isSmokingEnabled(userId) });
  return { endedAt, strain, margins, sessionType: session.sessionType };
}

/**
 * The most recent finished session whose margins are still running — for the
 * Home reminder. Null once the day's smoke/alcohol/eat lines have all passed
 * (the multi-day "next hard session" line does not keep it alive).
 */
export function activePostSession(userId: number = PRIMARY_USER_ID, now = Date.now()): PostSession | null {
  const recent = listSessions({ limit: 3 }, userId);
  for (const s of recent) {
    if (!s.endTime && s.durationS == null) continue;
    const ps = postSessionFor(s.id, userId);
    if (!ps) continue;
    if (now - ps.endedAt > 12 * 3_600_000) continue;
    if (marginsStillRunning(ps.margins, ps.endedAt, now)) return ps;
  }
  return null;
}
