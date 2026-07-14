import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { appOpenLogs } from '@/db/schema';
import { daysAgoISO, todayISO } from '@/lib/date';
import { PRIMARY_USER_ID } from './userRepo';

/**
 * Daily app-usage ("check-in") streak — a lightweight engagement streak that
 * rewards opening the app each day, independent of whether you train. One row
 * per day; recorded once on launch.
 */
export function recordAppOpen(userId: number = PRIMARY_USER_ID): void {
  const date = todayISO();
  const existing = db
    .select()
    .from(appOpenLogs)
    .where(and(eq(appOpenLogs.userId, userId), eq(appOpenLogs.date, date)))
    .get();
  if (!existing) {
    db.insert(appOpenLogs).values({ userId, date }).run();
  }
}

export interface StreakDay {
  date: string;
  opened: boolean;
  isToday: boolean;
}

export interface UsageStreak {
  current: number;
  longest: number;
  openedToday: boolean;
  totalDays: number;
  last7: StreakDay[];
  nextMilestone: number;
}

const MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365];

function openedDateSet(userId: number): Set<string> {
  const rows = db.select({ date: appOpenLogs.date }).from(appOpenLogs).where(eq(appOpenLogs.userId, userId)).all();
  return new Set(rows.map((r) => r.date));
}

export function usageStreak(userId: number = PRIMARY_USER_ID): UsageStreak {
  const opened = openedDateSet(userId);
  const openedToday = opened.has(todayISO());

  // Current streak: consecutive days ending today (or yesterday if not opened yet today).
  let current = 0;
  let cursor = openedToday ? 0 : 1;
  for (let i = cursor; i < 3650; i++) {
    if (opened.has(daysAgoISO(i))) current++;
    else break;
  }

  // Longest streak across all history.
  const sorted = [...opened].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    if (prev && daysBetweenISO(d, prev) === 1) run++;
    else run = 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  const last7: StreakDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = daysAgoISO(i);
    last7.push({ date, opened: opened.has(date), isToday: i === 0 });
  }

  const nextMilestone = MILESTONES.find((m) => m > current) ?? current;

  return { current, longest, openedToday, totalDays: opened.size, last7, nextMilestone };
}

function daysBetweenISO(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);
}
