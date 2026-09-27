import { and, eq, gte, isNotNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { pathEnrolments, pathGraduations, sessions, walkSessions, type PathEnrolment } from '@/db/schema';
import { findPath, type PathStage, type TrainingPath } from '@/data/paths';
import { gateStatus, nextDayKey, parsePathStyle, pathProgress, type GateStatus } from '@/lib/paths';
import { RANK_TIERS } from '@/lib/ranks';
import { overallPlacement } from './ranksRepo';
import { PRIMARY_USER_ID } from './userRepo';

/**
 * Paths, walked.
 *
 * Enrolment is one row per path: which stage, and when it began. Progress is
 * never stored — it is counted, each time, from the sessions that carry the
 * stage's tag and were finished after the stage began. Graduating writes a
 * row that is never deleted: the record of having passed that way.
 */

export interface PathState {
  path: TrainingPath;
  enrolment: PathEnrolment;
  stage: PathStage;
  stageIndex: number;
  /** finished sessions of the current stage, per day key */
  dayCounts: Record<string, number>;
  sessions: number;
  gate: GateStatus;
  nextDay: string;
  /** 0..1 across the whole path */
  progress: number;
  completed: boolean;
  paused: boolean;
}

export function enrolmentFor(pathKey: string, userId: number = PRIMARY_USER_ID): PathEnrolment | undefined {
  return db
    .select()
    .from(pathEnrolments)
    .where(and(eq(pathEnrolments.userId, userId), eq(pathEnrolments.pathKey, pathKey)))
    .get();
}

/** Begin a path, or pick one back up where it was left. */
export function enrol(pathKey: string, userId: number = PRIMARY_USER_ID): PathEnrolment | undefined {
  if (!findPath(pathKey)) return undefined;
  const existing = enrolmentFor(pathKey, userId);
  const now = Date.now();
  if (existing) {
    if (existing.pausedAt != null) {
      // Time away does not count as time in the stage: the clock restarts, the sessions stay.
      db.update(pathEnrolments).set({ pausedAt: null }).where(eq(pathEnrolments.id, existing.id)).run();
    }
    return enrolmentFor(pathKey, userId);
  }
  db.insert(pathEnrolments).values({ userId, pathKey, stageIndex: 0, enrolledAt: now, stageStartedAt: now }).run();
  return enrolmentFor(pathKey, userId);
}

export function pausePath(pathKey: string, userId: number = PRIMARY_USER_ID): void {
  const e = enrolmentFor(pathKey, userId);
  if (e && e.pausedAt == null && e.completedAt == null) {
    db.update(pathEnrolments).set({ pausedAt: Date.now() }).where(eq(pathEnrolments.id, e.id)).run();
  }
}

function stageFacts(e: PathEnrolment, stage: PathStage, userId: number) {
  const rows = db
    .select({ style: sessions.style, startTime: sessions.startTime, distanceM: sessions.distanceM })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNotNull(sessions.endTime), gte(sessions.startTime, e.stageStartedAt)))
    .all();

  const dayCounts: Record<string, number> = {};
  let count = 0;
  let longestM = 0;
  for (const r of rows) {
    if ((r.distanceM ?? 0) > longestM) longestM = r.distanceM ?? 0;
    const tag = parsePathStyle(r.style);
    if (!tag || tag.pathKey !== e.pathKey || tag.stageKey !== stage.key) continue;
    count++;
    dayCounts[tag.dayKey] = (dayCounts[tag.dayKey] ?? 0) + 1;
  }
  try {
    for (const w of db
      .select({ distanceM: walkSessions.distanceM })
      .from(walkSessions)
      .where(and(eq(walkSessions.userId, userId), gte(walkSessions.startTime, e.stageStartedAt)))
      .all()) {
      if ((w.distanceM ?? 0) > longestM) longestM = w.distanceM ?? 0;
    }
  } catch {
    // no walks table read: the run check simply stays where the sessions put it
  }
  return { dayCounts, count, longestRunKm: longestM / 1000 };
}

export function pathState(pathKey: string, userId: number = PRIMARY_USER_ID): PathState | null {
  const path = findPath(pathKey);
  const enrolment = enrolmentFor(pathKey, userId);
  if (!path || !enrolment) return null;
  const stageIndex = Math.min(Math.max(0, enrolment.stageIndex), path.stages.length - 1);
  const stage = path.stages[stageIndex];
  const facts = stageFacts(enrolment, stage, userId);
  const rank = overallPlacement(userId);
  const gate = gateStatus(
    stage.gate,
    {
      sessions: facts.count,
      daysIn: Math.max(0, (Date.now() - enrolment.stageStartedAt) / 86_400_000),
      longestRunKm: facts.longestRunKm,
      overallTier: rank ? rank.placement.tierIndex : -1,
    },
    (i) => RANK_TIERS[Math.min(Math.max(0, i), RANK_TIERS.length - 1)].name
  );
  const completed = enrolment.completedAt != null;
  return {
    path,
    enrolment,
    stage,
    stageIndex,
    dayCounts: facts.dayCounts,
    sessions: facts.count,
    gate,
    nextDay: nextDayKey(stage, facts.dayCounts),
    progress: pathProgress(path, stageIndex, gate.progress, completed),
    completed,
    paused: enrolment.pausedAt != null,
  };
}

/** Every path begun, the ones being walked first. */
export function myPaths(userId: number = PRIMARY_USER_ID): PathState[] {
  const rows = db.select().from(pathEnrolments).where(eq(pathEnrolments.userId, userId)).all();
  const out: PathState[] = [];
  for (const r of rows) {
    const s = pathState(r.pathKey, userId);
    if (s) out.push(s);
  }
  const rankOf = (s: PathState) => (s.completed ? 2 : s.paused ? 1 : 0);
  return out.sort((a, b) => rankOf(a) - rankOf(b) || b.enrolment.stageStartedAt - a.enrolment.stageStartedAt);
}

export type GraduateResult = { ok: true; finished: boolean; stage: PathStage; next: PathStage | null } | { ok: false; reason: 'not-enrolled' | 'gate' | 'done' };

/**
 * Graduate the current stage. The gate is read again here, from the record,
 * at the moment of graduating — a screen that believed it was met a minute
 * ago does not get to decide.
 */
export function graduate(pathKey: string, userId: number = PRIMARY_USER_ID): GraduateResult {
  const s = pathState(pathKey, userId);
  if (!s) return { ok: false, reason: 'not-enrolled' };
  if (s.completed) return { ok: false, reason: 'done' };
  if (!s.gate.met) return { ok: false, reason: 'gate' };
  const now = Date.now();
  try {
    db.insert(pathGraduations).values({ userId, pathKey, stageKey: s.stage.key, sessions: s.sessions, graduatedAt: now }).run();
  } catch {
    // The stage was already graduated once (the unique index): move on without a second row.
  }
  const last = s.stageIndex >= s.path.stages.length - 1;
  db.update(pathEnrolments)
    .set(last ? { completedAt: now } : { stageIndex: s.stageIndex + 1, stageStartedAt: now })
    .where(eq(pathEnrolments.id, s.enrolment.id))
    .run();
  return { ok: true, finished: last, stage: s.stage, next: last ? null : s.path.stages[s.stageIndex + 1] };
}

/** Stages graduated across every path — experience and titles read this. A missing table reads zero. */
export function graduatedStageCount(userId: number = PRIMARY_USER_ID): number {
  try {
    return db.select({ id: pathGraduations.id }).from(pathGraduations).where(eq(pathGraduations.userId, userId)).all().length;
  } catch {
    return 0;
  }
}

export function completedPathCount(userId: number = PRIMARY_USER_ID): number {
  try {
    return db
      .select({ id: pathEnrolments.id })
      .from(pathEnrolments)
      .where(and(eq(pathEnrolments.userId, userId), isNotNull(pathEnrolments.completedAt)))
      .all().length;
  } catch {
    return 0;
  }
}
