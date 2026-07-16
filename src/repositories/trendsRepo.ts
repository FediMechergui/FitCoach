import { and, eq, gte } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  alcoholEntries,
  beverageEntries,
  foodEntries,
  habitEntries,
  habitProfiles,
  sessions,
  sleepLogs,
  smokingEntries,
  weighIns,
  workLogs,
  dailyStepLogs,
} from '@/db/schema';
import { BEVERAGE_PRESETS } from '@/data/beverages';
import { daysAgoISO, toISODate } from '@/lib/date';
import { getNutritionGoal, getUser, latestWeight, PRIMARY_USER_ID, weighInHistory } from './userRepo';

/**
 * Long-span trend engine: everything the app tracks, bucketed into weekly
 * points over the last 12 weeks, so the Trends screen can chart the whole
 * picture — training, nutrition, rest, habits — side by side.
 */

export interface WeekPoint {
  label: string; // '-11w' … 'now'
  value: number;
  samples: number; // how many logged days/entries fed this point
}

const WEEKS = 12;
const WK_MS = 7 * 86_400_000;

function weekIndexFor(dateISO: string, now: number): number | null {
  const t = new Date(dateISO).getTime();
  const diff = now - t;
  if (diff < 0 || diff >= WEEKS * WK_MS) return null;
  return Math.floor(diff / WK_MS); // 0 = current week
}

function emptyWeeks(): Array<{ sum: number; n: number }> {
  return Array.from({ length: WEEKS }, () => ({ sum: 0, n: 0 }));
}

function toPoints(buckets: Array<{ sum: number; n: number }>, mode: 'avg' | 'sum'): WeekPoint[] {
  const out: WeekPoint[] = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    const b = buckets[w];
    const value = b.n === 0 ? 0 : mode === 'avg' ? b.sum / b.n : b.sum;
    out.push({
      label: w === 0 ? 'now' : `-${w}w`,
      value: Math.round(value * 10) / 10,
      samples: b.n,
    });
  }
  return out;
}

export interface TrendsData {
  weight: WeekPoint[]; // avg kg per week
  calories: WeekPoint[]; // avg kcal per logged day
  protein: WeekPoint[]; // avg g per logged day
  sleep: WeekPoint[]; // avg h per logged night
  steps: WeekPoint[]; // avg steps per logged day
  volume: WeekPoint[]; // total kg lifted per week
  activeMinutes: WeekPoint[]; // session minutes per week
  mood: WeekPoint[]; // avg after-session mood 1..5
  alcohol: WeekPoint[]; // grams per week
  cigarettes: WeekPoint[]; // count per week
  habitMinutes: WeekPoint[]; // tracked-habit minutes per week
  workHours: WeekPoint[]; // hours per week
  water: WeekPoint[]; // avg L per logged day
  caffeine: WeekPoint[]; // avg mg per logged day
  calorieTarget: number | null;
  // Fat distribution context
  bodyType: string | null;
  sex: 'male' | 'female';
  latestWaist: number | null;
  latestHip: number | null;
  whr: number | null;
  waistChange12w: number | null;
}

export function trendsData(userId: number = PRIMARY_USER_ID): TrendsData {
  const now = Date.now();
  const since = daysAgoISO(WEEKS * 7 - 1);

  // Weight
  const wBuckets = emptyWeeks();
  for (const w of weighInHistory(userId)) {
    const idx = weekIndexFor(w.date, now);
    if (idx != null) {
      wBuckets[idx].sum += w.weightKg;
      wBuckets[idx].n++;
    }
  }

  // Nutrition (per logged day)
  const calB = emptyWeeks();
  const protB = emptyWeeks();
  {
    const rows = db
      .select()
      .from(foodEntries)
      .where(and(eq(foodEntries.userId, userId), gte(foodEntries.date, since)))
      .all();
    const byDay = new Map<string, { cal: number; prot: number }>();
    for (const r of rows) {
      const d = byDay.get(r.date) ?? { cal: 0, prot: 0 };
      d.cal += r.calories;
      d.prot += r.proteinG;
      byDay.set(r.date, d);
    }
    for (const [date, v] of byDay) {
      const idx = weekIndexFor(date, now);
      if (idx != null) {
        calB[idx].sum += v.cal;
        calB[idx].n++;
        protB[idx].sum += v.prot;
        protB[idx].n++;
      }
    }
  }

  // Sleep
  const sleepB = emptyWeeks();
  for (const r of db
    .select()
    .from(sleepLogs)
    .where(and(eq(sleepLogs.userId, userId), gte(sleepLogs.date, since)))
    .all()) {
    const idx = weekIndexFor(r.date, now);
    if (idx != null) {
      sleepB[idx].sum += r.hours;
      sleepB[idx].n++;
    }
  }

  // Steps
  const stepB = emptyWeeks();
  for (const r of db
    .select()
    .from(dailyStepLogs)
    .where(and(eq(dailyStepLogs.userId, userId), gte(dailyStepLogs.date, since)))
    .all()) {
    const idx = weekIndexFor(r.date, now);
    if (idx != null) {
      stepB[idx].sum += r.stepCount;
      stepB[idx].n++;
    }
  }

  // Sessions: volume, minutes, mood
  const volB = emptyWeeks();
  const minB = emptyWeeks();
  const moodB = emptyWeeks();
  for (const s of db.select().from(sessions).where(eq(sessions.userId, userId)).all()) {
    const idx = weekIndexFor(toISODate(new Date(s.startTime)), now);
    if (idx == null) continue;
    if (s.totalVolume) {
      volB[idx].sum += s.totalVolume;
      volB[idx].n++;
    }
    if (s.durationS) {
      minB[idx].sum += s.durationS / 60;
      minB[idx].n++;
    }
    if (s.moodAfter) {
      moodB[idx].sum += s.moodAfter;
      moodB[idx].n++;
    }
  }

  // Alcohol grams / week
  const alcB = emptyWeeks();
  for (const r of db
    .select()
    .from(alcoholEntries)
    .where(and(eq(alcoholEntries.userId, userId), gte(alcoholEntries.date, since)))
    .all()) {
    const idx = weekIndexFor(r.date, now);
    if (idx != null) {
      alcB[idx].sum += r.alcoholGrams;
      alcB[idx].n++;
    }
  }

  // Cigarettes / week
  const cigB = emptyWeeks();
  for (const r of db
    .select()
    .from(smokingEntries)
    .where(and(eq(smokingEntries.userId, userId), gte(smokingEntries.date, since)))
    .all()) {
    const idx = weekIndexFor(r.date, now);
    if (idx != null) {
      cigB[idx].sum += r.quantity;
      cigB[idx].n++;
    }
  }

  // Habit minutes / week (count-habits × minutes-per-occurrence)
  const habB = emptyWeeks();
  {
    const profiles = db.select().from(habitProfiles).where(eq(habitProfiles.userId, userId)).all();
    const mpo = new Map(profiles.map((p) => [p.habitKey, p.minutesPerOccurrence ?? 0]));
    const kind = new Map(profiles.map((p) => [p.habitKey, p.kind]));
    for (const r of db
      .select()
      .from(habitEntries)
      .where(and(eq(habitEntries.userId, userId), gte(habitEntries.date, since)))
      .all()) {
      const idx = weekIndexFor(r.date, now);
      if (idx == null) continue;
      const minutes = kind.get(r.habitKey) === 'duration' ? r.minutes : r.quantity * (mpo.get(r.habitKey) ?? 0);
      habB[idx].sum += minutes;
      habB[idx].n++;
    }
  }

  // Work hours / week
  const workB = emptyWeeks();
  for (const r of db
    .select()
    .from(workLogs)
    .where(and(eq(workLogs.userId, userId), gte(workLogs.date, since)))
    .all()) {
    const idx = weekIndexFor(r.date, now);
    if (idx != null) {
      workB[idx].sum += r.minutes / 60;
      workB[idx].n++;
    }
  }

  // Water & caffeine (per logged day)
  const waterB = emptyWeeks();
  const cafB = emptyWeeks();
  {
    const rows = db
      .select()
      .from(beverageEntries)
      .where(and(eq(beverageEntries.userId, userId), gte(beverageEntries.date, since)))
      .all();
    const byDay = new Map<string, { ml: number; mg: number }>();
    for (const r of rows) {
      const d = byDay.get(r.date) ?? { ml: 0, mg: 0 };
      if (BEVERAGE_PRESETS[r.type].hydrating) d.ml += r.volumeMl;
      d.mg += r.caffeineMg;
      byDay.set(r.date, d);
    }
    for (const [date, v] of byDay) {
      const idx = weekIndexFor(date, now);
      if (idx != null) {
        waterB[idx].sum += v.ml / 1000;
        waterB[idx].n++;
        cafB[idx].sum += v.mg;
        cafB[idx].n++;
      }
    }
  }

  // Fat-distribution context
  const user = getUser(userId);
  const history = weighInHistory(userId);
  const withWaist = history.filter((h) => h.waistCm != null);
  const latest = latestWeight(userId);
  const latestWaist = latest?.waistCm ?? withWaist[withWaist.length - 1]?.waistCm ?? null;
  const latestHip = latest?.hipCm ?? history.filter((h) => h.hipCm != null).pop()?.hipCm ?? null;
  const oldWaist = withWaist.find((h) => weekIndexFor(h.date, now) != null)?.waistCm ?? null;

  return {
    weight: toPoints(wBuckets, 'avg'),
    calories: toPoints(calB, 'avg'),
    protein: toPoints(protB, 'avg'),
    sleep: toPoints(sleepB, 'avg'),
    steps: toPoints(stepB, 'avg'),
    volume: toPoints(volB, 'sum'),
    activeMinutes: toPoints(minB, 'sum'),
    mood: toPoints(moodB, 'avg'),
    alcohol: toPoints(alcB, 'sum'),
    cigarettes: toPoints(cigB, 'sum'),
    habitMinutes: toPoints(habB, 'sum'),
    workHours: toPoints(workB, 'sum'),
    water: toPoints(waterB, 'avg'),
    caffeine: toPoints(cafB, 'avg'),
    calorieTarget: getNutritionGoal(userId)?.calorieTarget ?? null,
    bodyType: user?.bodyType ?? null,
    sex: user?.sex ?? 'male',
    latestWaist,
    latestHip,
    whr:
      latestWaist != null && latestHip != null && latestHip > 0
        ? Math.round((latestWaist / latestHip) * 100) / 100
        : null,
    waistChange12w:
      latestWaist != null && oldWaist != null ? Math.round((latestWaist - oldWaist) * 10) / 10 : null,
  };
}
