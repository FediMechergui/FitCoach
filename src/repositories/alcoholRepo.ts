import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/db/client';
import { alcoholEntries, type AlcoholEntry, type AlcoholType } from '@/db/schema';
import { computeDrink, estimateBAC, hoursToSober, WEEKLY_LOWRISK_G } from '@/lib/alcohol';
import { daysAgoISO, lastNDates, todayISO } from '@/lib/date';
import { getUser, latestWeight, PRIMARY_USER_ID } from './userRepo';

export function logDrink(
  input: { type: AlcoholType; label?: string; volumeMl: number; abvPct: number; date?: string },
  userId: number = PRIMARY_USER_ID
): void {
  const calc = computeDrink(input.type, input.volumeMl, input.abvPct);
  db.insert(alcoholEntries)
    .values({
      userId,
      date: input.date ?? todayISO(),
      type: input.type,
      label: input.label ?? null,
      volumeMl: input.volumeMl,
      abvPct: input.abvPct,
      alcoholGrams: calc.grams,
      standardDrinks: calc.standardDrinks,
      calories: calc.totalCalories,
    })
    .run();
}

export function deleteDrink(id: number): void {
  db.delete(alcoholEntries).where(eq(alcoholEntries.id, id)).run();
}

export function drinksForDay(date: string = todayISO(), userId: number = PRIMARY_USER_ID): AlcoholEntry[] {
  return db
    .select()
    .from(alcoholEntries)
    .where(and(eq(alcoholEntries.userId, userId), eq(alcoholEntries.date, date)))
    .orderBy(desc(alcoholEntries.createdAt))
    .all();
}

function sumRange(sinceISO: string, userId: number) {
  const rows = db
    .select()
    .from(alcoholEntries)
    .where(and(eq(alcoholEntries.userId, userId), gte(alcoholEntries.date, sinceISO)))
    .all();
  return rows;
}

export interface AlcoholDay {
  grams: number;
  standardDrinks: number;
  calories: number;
  entries: AlcoholEntry[];
}

export function alcoholDay(date: string = todayISO(), userId: number = PRIMARY_USER_ID): AlcoholDay {
  const entries = drinksForDay(date, userId);
  return {
    grams: Math.round(entries.reduce((s, e) => s + e.alcoholGrams, 0) * 10) / 10,
    standardDrinks: Math.round(entries.reduce((s, e) => s + e.standardDrinks, 0) * 10) / 10,
    calories: Math.round(entries.reduce((s, e) => s + e.calories, 0)),
    entries,
  };
}

export interface AlcoholImpact {
  todayGrams: number;
  todayDrinks: number;
  todayCalories: number;
  weekGrams: number;
  weekDrinks: number;
  weekCalories: number;
  weeklyLimitG: number;
  estimatedPeakBAC: number;
  hoursToSober: number;
  dryDays7d: number;
  series: Array<{ date: string; grams: number }>;
}

export function alcoholImpact(userId: number = PRIMARY_USER_ID): AlcoholImpact {
  const today = alcoholDay(todayISO(), userId);
  const weekRows = sumRange(daysAgoISO(6), userId);
  const weekGrams = weekRows.reduce((s, e) => s + e.alcoholGrams, 0);

  const user = getUser(userId);
  const weightKg = latestWeight(userId)?.weightKg ?? 75;
  const peakBAC = estimateBAC({ totalGrams: today.grams, weightKg, sex: user?.sex ?? 'male' });

  const byDate = new Map<string, number>();
  for (const e of weekRows) byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.alcoholGrams);
  const series = lastNDates(7).map((d) => ({ date: d, grams: Math.round((byDate.get(d) ?? 0) * 10) / 10 }));
  const dryDays7d = series.filter((d) => d.grams === 0).length;

  return {
    todayGrams: today.grams,
    todayDrinks: today.standardDrinks,
    todayCalories: today.calories,
    weekGrams: Math.round(weekGrams * 10) / 10,
    weekDrinks: Math.round((weekGrams / 10) * 10) / 10,
    weekCalories: Math.round(weekRows.reduce((s, e) => s + e.calories, 0)),
    weeklyLimitG: WEEKLY_LOWRISK_G,
    estimatedPeakBAC: peakBAC,
    hoursToSober: hoursToSober(peakBAC),
    dryDays7d,
    series,
  };
}

export function avgAlcoholGramsPerWeek(userId: number = PRIMARY_USER_ID): number {
  const rows = sumRange(daysAgoISO(27), userId); // last 4 weeks
  const total = rows.reduce((s, e) => s + e.alcoholGrams, 0);
  return Math.round((total / 4) * 10) / 10;
}
