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
import { toISODate } from '@/lib/date';
import { getNutritionGoal, getUser, latestWeight, PRIMARY_USER_ID, weighInHistory } from './userRepo';

/**
 * Long-span trend engine: everything the app tracks, bucketed into weekly
 * points over the last 12 weeks, so the Trends screen can chart the whole
 * picture — training, nutrition, rest, habits — side by side.
 */

export interface WeekPoint {
  label: string;
  value: number;
  samples: number; // how many logged days/entries fed this point
}

export type Granularity = 'daily' | 'weekly';

export interface TrendsQuery {
  granularity: Granularity;
  /** 0 = the most recent window; 1 = the previous window; … */
  page: number;
}

interface WindowConfig {
  buckets: number;
  lenMs: number;
  windowEnd: number; // exclusive
  windowStart: number;
}

const DAY_MS = 86_400_000;

function windowConfig(q: TrendsQuery): WindowConfig {
  const buckets = q.granularity === 'daily' ? 14 : 12;
  const lenMs = q.granularity === 'daily' ? DAY_MS : 7 * DAY_MS;
  // Anchor "now" to end-of-today so today's logs land in bucket 0.
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const windowEnd = end.getTime() - q.page * buckets * lenMs;
  return { buckets, lenMs, windowEnd, windowStart: windowEnd - buckets * lenMs };
}

function bucketIndexFor(dateISO: string, cfg: WindowConfig): number | null {
  const t = new Date(dateISO).getTime() + DAY_MS / 2; // midday, avoids TZ edges
  const diff = cfg.windowEnd - t;
  if (diff < 0 || diff >= cfg.buckets * cfg.lenMs) return null;
  return Math.floor(diff / cfg.lenMs); // 0 = most recent bucket
}

function bucketIndexForMs(ms: number, cfg: WindowConfig): number | null {
  const diff = cfg.windowEnd - ms;
  if (diff < 0 || diff >= cfg.buckets * cfg.lenMs) return null;
  return Math.floor(diff / cfg.lenMs);
}

function emptyBuckets(cfg: WindowConfig): Array<{ sum: number; n: number }> {
  return Array.from({ length: cfg.buckets }, () => ({ sum: 0, n: 0 }));
}

function bucketLabel(idx: number, cfg: WindowConfig): string {
  const start = new Date(cfg.windowEnd - (idx + 1) * cfg.lenMs + DAY_MS / 2);
  const mm = String(start.getMonth() + 1).padStart(2, '0');
  const dd = String(start.getDate()).padStart(2, '0');
  return `${dd}/${mm}`;
}

function toPoints(
  buckets: Array<{ sum: number; n: number }>,
  mode: 'avg' | 'sum',
  cfg: WindowConfig
): WeekPoint[] {
  const out: WeekPoint[] = [];
  for (let w = cfg.buckets - 1; w >= 0; w--) {
    const b = buckets[w];
    const value = b.n === 0 ? 0 : mode === 'avg' ? b.sum / b.n : b.sum;
    out.push({ label: bucketLabel(w, cfg), value: Math.round(value * 10) / 10, samples: b.n });
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
  granularity: Granularity;
  page: number;
  rangeLabel: string;
  // Fat distribution context
  bodyType: string | null;
  sex: 'male' | 'female';
  latestWaist: number | null;
  latestHip: number | null;
  whr: number | null;
  waistChange12w: number | null;
}

export function trendsData(
  query: TrendsQuery = { granularity: 'weekly', page: 0 },
  userId: number = PRIMARY_USER_ID
): TrendsData {
  const cfg = windowConfig(query);
  const since = toISODate(new Date(cfg.windowStart));

  // Weight
  const wBuckets = emptyBuckets(cfg);
  for (const w of weighInHistory(userId)) {
    const idx = bucketIndexFor(w.date, cfg);
    if (idx != null) {
      wBuckets[idx].sum += w.weightKg;
      wBuckets[idx].n++;
    }
  }

  // Nutrition (per logged day)
  const calB = emptyBuckets(cfg);
  const protB = emptyBuckets(cfg);
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
      const idx = bucketIndexFor(date, cfg);
      if (idx != null) {
        calB[idx].sum += v.cal;
        calB[idx].n++;
        protB[idx].sum += v.prot;
        protB[idx].n++;
      }
    }
  }

  // Sleep
  const sleepB = emptyBuckets(cfg);
  for (const r of db
    .select()
    .from(sleepLogs)
    .where(and(eq(sleepLogs.userId, userId), gte(sleepLogs.date, since)))
    .all()) {
    const idx = bucketIndexFor(r.date, cfg);
    if (idx != null) {
      sleepB[idx].sum += r.hours;
      sleepB[idx].n++;
    }
  }

  // Steps
  const stepB = emptyBuckets(cfg);
  for (const r of db
    .select()
    .from(dailyStepLogs)
    .where(and(eq(dailyStepLogs.userId, userId), gte(dailyStepLogs.date, since)))
    .all()) {
    const idx = bucketIndexFor(r.date, cfg);
    if (idx != null) {
      stepB[idx].sum += r.stepCount;
      stepB[idx].n++;
    }
  }

  // Sessions: volume, minutes, mood
  const volB = emptyBuckets(cfg);
  const minB = emptyBuckets(cfg);
  const moodB = emptyBuckets(cfg);
  for (const s of db.select().from(sessions).where(eq(sessions.userId, userId)).all()) {
    const idx = bucketIndexForMs(s.startTime, cfg);
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
  const alcB = emptyBuckets(cfg);
  for (const r of db
    .select()
    .from(alcoholEntries)
    .where(and(eq(alcoholEntries.userId, userId), gte(alcoholEntries.date, since)))
    .all()) {
    const idx = bucketIndexFor(r.date, cfg);
    if (idx != null) {
      alcB[idx].sum += r.alcoholGrams;
      alcB[idx].n++;
    }
  }

  // Cigarettes / week
  const cigB = emptyBuckets(cfg);
  for (const r of db
    .select()
    .from(smokingEntries)
    .where(and(eq(smokingEntries.userId, userId), gte(smokingEntries.date, since)))
    .all()) {
    const idx = bucketIndexFor(r.date, cfg);
    if (idx != null) {
      cigB[idx].sum += r.quantity;
      cigB[idx].n++;
    }
  }

  // Habit minutes / week (count-habits × minutes-per-occurrence)
  const habB = emptyBuckets(cfg);
  {
    const profiles = db.select().from(habitProfiles).where(eq(habitProfiles.userId, userId)).all();
    const mpo = new Map(profiles.map((p) => [p.habitKey, p.minutesPerOccurrence ?? 0]));
    const kind = new Map(profiles.map((p) => [p.habitKey, p.kind]));
    for (const r of db
      .select()
      .from(habitEntries)
      .where(and(eq(habitEntries.userId, userId), gte(habitEntries.date, since)))
      .all()) {
      const idx = bucketIndexFor(r.date, cfg);
      if (idx == null) continue;
      const minutes = kind.get(r.habitKey) === 'duration' ? r.minutes : r.quantity * (mpo.get(r.habitKey) ?? 0);
      habB[idx].sum += minutes;
      habB[idx].n++;
    }
  }

  // Work hours / week
  const workB = emptyBuckets(cfg);
  for (const r of db
    .select()
    .from(workLogs)
    .where(and(eq(workLogs.userId, userId), gte(workLogs.date, since)))
    .all()) {
    const idx = bucketIndexFor(r.date, cfg);
    if (idx != null) {
      workB[idx].sum += r.minutes / 60;
      workB[idx].n++;
    }
  }

  // Water & caffeine (per logged day)
  const waterB = emptyBuckets(cfg);
  const cafB = emptyBuckets(cfg);
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
      const idx = bucketIndexFor(date, cfg);
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
  const oldWaist = withWaist.find((h) => bucketIndexFor(h.date, cfg) != null)?.waistCm ?? null;

  return {
    weight: toPoints(wBuckets, 'avg', cfg),
    calories: toPoints(calB, 'avg', cfg),
    protein: toPoints(protB, 'avg', cfg),
    sleep: toPoints(sleepB, 'avg', cfg),
    steps: toPoints(stepB, 'avg', cfg),
    volume: toPoints(volB, 'sum', cfg),
    activeMinutes: toPoints(minB, 'sum', cfg),
    mood: toPoints(moodB, 'avg', cfg),
    alcohol: toPoints(alcB, 'sum', cfg),
    cigarettes: toPoints(cigB, 'sum', cfg),
    habitMinutes: toPoints(habB, 'sum', cfg),
    workHours: toPoints(workB, 'sum', cfg),
    water: toPoints(waterB, 'avg', cfg),
    caffeine: toPoints(cafB, 'avg', cfg),
    calorieTarget: getNutritionGoal(userId)?.calorieTarget ?? null,
    granularity: query.granularity,
    page: query.page,
    rangeLabel: `${toISODate(new Date(cfg.windowStart + DAY_MS)).slice(5)} → ${toISODate(new Date(cfg.windowEnd)).slice(5)}`,
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
