import { and, desc, eq, gte } from 'drizzle-orm';
import { db, sqlite } from '@/db/client';
import { calendarDate, finiteNumber } from '@/lib/validation';
import { workLogs, type WorkLog } from '@/db/schema';
import { rangeMinutes } from '@/lib/time';
import { daysAgoISO, lastNDates, todayISO } from '@/lib/date';
import { PRIMARY_USER_ID } from './userRepo';

export function logWork(
  input: {
    date?: string;
    startTime?: string;
    endTime?: string;
    minutes?: number;
    breakMinutes?: number;
    quality?: number | null;
    notes?: string;
  },
  userId: number = PRIMARY_USER_ID
): void {
  const date = calendarDate(input.date ?? todayISO());
  finiteNumber(input.breakMinutes ?? 0, 'Break minutes', 0, 1440);
  // Derive minutes from the time range if provided.
  let minutes = input.minutes ?? 0;
  if (input.startTime && input.endTime) {
    const span = rangeMinutes(input.startTime, input.endTime);
    if (span == null) throw new Error('Enter start and end times as HH:MM.');
    if ((input.breakMinutes ?? 0) > span) throw new Error('Break time cannot exceed the shift.');
    minutes = span - (input.breakMinutes ?? 0);
  }
  finiteNumber(minutes, 'Work minutes', 0, 1440);
  sqlite.withTransactionSync(() => {
    const previous = workForDate(date, userId);
    const values = {
      userId,
      date,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      minutes,
      breakMinutes: input.breakMinutes ?? 0,
      quality: input.quality ?? null,
      notes: input.notes ?? null,
    };
    if (previous) db.update(workLogs).set(values).where(eq(workLogs.id, previous.id)).run();
    else db.insert(workLogs).values(values).run();
  });
}

export function deleteWork(id: number): void {
  db.delete(workLogs).where(eq(workLogs.id, id)).run();
}

export function workForDate(date: string = todayISO(), userId: number = PRIMARY_USER_ID): WorkLog | undefined {
  return db.select().from(workLogs).where(and(eq(workLogs.userId, userId), eq(workLogs.date, date))).get();
}

function workSince(sinceISO: string, userId: number): WorkLog[] {
  return db
    .select()
    .from(workLogs)
    .where(and(eq(workLogs.userId, userId), gte(workLogs.date, sinceISO)))
    .orderBy(desc(workLogs.date))
    .all();
}

export interface WorkSummary {
  todayMinutes: number;
  weekMinutes: number;
  weekDaysWorked: number;
  avgMinutesPerWorkday: number;
  series: Array<{ date: string; minutes: number }>;
}

export function workSummary(userId: number = PRIMARY_USER_ID): WorkSummary {
  const week = workSince(daysAgoISO(6), userId);
  const byDay = new Map(week.map((w) => [w.date, w.minutes]));
  const weekMinutes = week.reduce((s, w) => s + w.minutes, 0);
  const daysWorked = week.filter((w) => w.minutes > 0).length;
  return {
    todayMinutes: workForDate(todayISO(), userId)?.minutes ?? 0,
    weekMinutes,
    weekDaysWorked: daysWorked,
    avgMinutesPerWorkday: daysWorked ? Math.round(weekMinutes / daysWorked) : 0,
    series: lastNDates(7).map((d) => ({ date: d, minutes: byDay.get(d) ?? 0 })),
  };
}

export function avgWorkHours(days = 7, userId: number = PRIMARY_USER_ID): number | null {
  const rows = workSince(daysAgoISO(days - 1), userId);
  if (rows.length === 0) return null;
  const total = rows.reduce((s, w) => s + w.minutes, 0);
  return Math.round((total / rows.length / 60) * 10) / 10;
}
