import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { appOpenLogs } from '@/db/schema';
import { ACHIEVEMENTS } from '@/data/achievements';
import { evaluateAchievement } from '@/lib/achievementRules';
import {
  DEFAULT_TITLE,
  earnedTitles,
  findTitle,
  levelFromXp,
  sanitizeShowcase,
  TITLES,
  totalXp,
  wornTitle,
  xpBreakdown,
  type LevelState,
  type TitleDef,
  type TitleFacts,
  type XpInputs,
  type XpLine,
} from '@/lib/progression';
import type { RankPlacement } from '@/lib/ranks';
import { achievementStats } from './achievementsRepo';
import { challengeStats } from './challengeRepo';
import { kvGet, kvSet } from './kvRepo';
import { graduatedStageCount } from './pathsRepo';
import { rankSnapshot } from './ranksRepo';
import { listSessions } from './sessionRepo';
import { PRIMARY_USER_ID } from './userRepo';

/**
 * The profile's identity — level, title, rank, pinned badges — assembled from
 * the record. Nothing here is a counter of its own: the level is recomputed
 * from sessions, challenges and badges each time it is read.
 *
 * The only things STORED are choices: which title to wear, which badges to pin.
 */

export const KV_TITLE = 'profile.title';
export const KV_SHOWCASE = 'profile.showcase';
// ── Identity ─────────────────────────────────────────────────────────────────

export interface ProfileIdentity {
  level: LevelState;
  lines: XpLine[];
  title: TitleDef;
  titles: Array<TitleDef & { earnedNow: boolean }>;
  /** pinned badge ids, already checked against what is unlocked */
  showcase: number[];
  unlockedBadges: number[];
  rank: { placement: RankPlacement; provisional: boolean; peakOnly: boolean } | null;
  /** earned all time, and what is left to spend */
  points: number;
  balance: number;
  facts: TitleFacts;
}

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function profileIdentity(userId: number = PRIMARY_USER_ID): ProfileIdentity {
  const stats = achievementStats(userId);
  const chal = safe(() => challengeStats(userId), null);
  const unlockedBadges = ACHIEVEMENTS.filter((a) => safe(() => evaluateAchievement(a, stats).unlocked, false)).map((a) => a.id);

  const finished = safe(() => listSessions({}, userId).filter((s) => s.endTime != null), []);
  const sessionMinutes = finished.reduce((s, x) => s + (x.durationS ?? 0), 0) / 60;
  const checkInDays = safe(() => db.select({ d: appOpenLogs.date }).from(appOpenLogs).where(eq(appOpenLogs.userId, userId)).all().length, 0);
  const pathStages = safe(() => graduatedStageCount(userId), 0);

  const inputs: XpInputs = {
    sessions: finished.length,
    sessionMinutes,
    prs: stats.prCount,
    walks: stats.walkCount,
    challengePoints: chal?.points ?? 0,
    badges: unlockedBadges.length,
    restDays: stats.restDaysTaken,
    pathStages,
    checkInDays,
  };
  const level = levelFromXp(totalXp(inputs));

  const snap = safe(() => rankSnapshot(userId), null);
  const overall = snap ? (snap.overall ?? snap.peak) : null;
  const rank = overall && snap ? { placement: overall.placement, provisional: overall.provisional, peakOnly: !snap.overall } : null;
  const bestLiftTier = snap && snap.lifts.length ? Math.max(...snap.lifts.map((l) => l.placement.tierIndex)) : -1;

  const facts: TitleFacts = {
    level: level.level,
    sessions: finished.length,
    bestTrainingStreak: stats.restBridgedStreakBest,
    challengesCompleted: chal?.completed ?? 0,
    hardChallengesCompleted: chal?.hardCompleted ?? 0,
    badges: unlockedBadges.length,
    overallTier: rank ? rank.placement.tierIndex : -1,
    bestLiftTier,
    walks: stats.walkCount,
    pathStages,
    tunisianShare7d: stats.tunisianShare7d,
    restDays: stats.restDaysTaken,
  };

  const earned = new Set(earnedTitles(facts).map((t) => t.key));
  const chosen = kvGet<string>(KV_TITLE) ?? DEFAULT_TITLE;

  return {
    level,
    lines: xpBreakdown(inputs),
    title: wornTitle(chosen, facts),
    titles: TITLES.map((t) => ({ ...t, earnedNow: earned.has(t.key) })),
    showcase: sanitizeShowcase(kvGet<unknown>(KV_SHOWCASE), new Set(unlockedBadges)),
    unlockedBadges,
    rank,
    points: chal?.points ?? 0,
    balance: chal?.balance ?? 0,
    facts,
  };
}

export function chooseTitle(key: string): void {
  if (findTitle(key)) kvSet(KV_TITLE, key);
}

/** Pin or unpin a badge. Returns the new showcase; a full showcase drops its oldest pin. */
export function toggleShowcase(id: number, unlocked: number[]): number[] {
  const set = new Set(unlocked);
  const current = sanitizeShowcase(kvGet<unknown>(KV_SHOWCASE), set);
  let next: number[];
  if (current.includes(id)) next = current.filter((x) => x !== id);
  else if (!set.has(id)) next = current;
  else next = [...current, id].slice(-3);
  kvSet(KV_SHOWCASE, next);
  return next;
}
