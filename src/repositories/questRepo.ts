import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { weeklyQuests } from '@/db/schema';
import type { ChallengeRequirement } from '@/data/challenges';
import { addDays, startOfWeek, todayISO } from '@/lib/date';
import { QUEST_POINTS, questProgress, questsForWeek, type QuestDef } from '@/lib/quests';
import { measureMetric } from './challengeRepo';
import { PRIMARY_USER_ID } from './userRepo';

/**
 * Weekly quests, measured.
 *
 * A quest has no row until it is met: progress is read from the week's own
 * data every time, and the row written on completion is the receipt — the
 * points it paid and the value it was met at. A met quest stays met; a step
 * count that a later sync revises down cannot take it back.
 */

export interface QuestState {
  def: QuestDef;
  points: number;
  current: number;
  target: number;
  /** met and paid */
  done: boolean;
  /** met now, not yet stamped (looking does not stamp it) */
  ready: boolean;
}

export interface WeekQuests {
  week: string;
  /** last day of the week, ISO */
  ends: string;
  daysLeft: number;
  quests: QuestState[];
  earned: number;
  available: number;
}

/** The days of the week that have happened: Monday up to `upTo` (or Sunday). */
function weekDays(week: string, upTo: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(week, i);
    if (d > upTo) break;
    out.push(d);
  }
  return out;
}

function stamped(week: string, userId: number): Map<string, number> {
  try {
    const rows = db
      .select()
      .from(weeklyQuests)
      .where(and(eq(weeklyQuests.userId, userId), eq(weeklyQuests.week, week)))
      .all();
    return new Map(rows.map((r) => [r.questKey, r.points]));
  } catch {
    return new Map();
  }
}

export function weekQuests(
  enabled: Partial<Record<ChallengeRequirement, boolean>>,
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): WeekQuests {
  const week = startOfWeek(date);
  const ends = addDays(week, 6);
  const days = weekDays(week, date);
  const paid = stamped(week, userId);

  const quests: QuestState[] = questsForWeek(week, enabled).map((def) => {
    const p = questProgress(def, days.map((d) => measureMetric(def.metric, d, userId)));
    const done = paid.has(def.key);
    return {
      def,
      points: QUEST_POINTS[def.weight],
      current: p.current,
      target: p.target,
      done,
      ready: !done && p.complete,
    };
  });

  return {
    week,
    ends,
    daysLeft: Math.max(0, 6 - (days.length - 1)),
    quests,
    earned: quests.reduce((s, q) => s + (q.done ? q.points : 0), 0),
    available: quests.reduce((s, q) => s + q.points, 0),
  };
}

/**
 * Stamp the quests that have been met. Safe to call as often as you like: a
 * quest is written once (the unique index refuses a second row). Called at
 * launch and on the challenge screen — never from a look at Home.
 * Returns the quests stamped by THIS call, so the screen can say so.
 */
export function refreshQuestCompletions(
  enabled: Partial<Record<ChallengeRequirement, boolean>>,
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): QuestDef[] {
  const out: QuestDef[] = [];
  let state: WeekQuests;
  try {
    state = weekQuests(enabled, date, userId);
  } catch {
    return out;
  }
  for (const q of state.quests) {
    if (!q.ready) continue;
    try {
      db.insert(weeklyQuests)
        .values({ userId, week: state.week, questKey: q.def.key, points: q.points, completedAt: Date.now(), finalValue: q.current })
        .run();
      out.push(q.def);
    } catch {
      // Already stamped by another call: the receipt exists, which is all that matters.
    }
  }
  return out;
}

/**
 * Last week's quests may have been met on Sunday night and never looked at.
 * Walk back one week and stamp what was earned.
 */
export function catchUpQuests(
  enabled: Partial<Record<ChallengeRequirement, boolean>>,
  userId: number = PRIMARY_USER_ID
): number {
  const today = todayISO();
  const lastSunday = addDays(startOfWeek(today), -1);
  return refreshQuestCompletions(enabled, lastSunday, userId).length + refreshQuestCompletions(enabled, today, userId).length;
}
