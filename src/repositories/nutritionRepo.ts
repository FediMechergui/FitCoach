import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  beverageEntries,
  foodEntries,
  type BeverageType,
  type FoodEntry,
  type MealType,
} from '@/db/schema';
import { BEVERAGE_PRESETS } from '@/data/beverages';
import { estimateFromDescription } from '@/data/foods';
import { todayISO } from '@/lib/date';
import { PRIMARY_USER_ID } from './userRepo';

// ── Food entries ─────────────────────────────────────────────────────────────
export interface PreciseFoodInput {
  mealType: MealType;
  foodName: string;
  quantity: number;
  servingSize?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  date?: string;
}

export function addPreciseFood(input: PreciseFoodInput, userId: number = PRIMARY_USER_ID): number {
  const q = input.quantity || 1;
  const res = db
    .insert(foodEntries)
    .values({
      userId,
      date: input.date ?? todayISO(),
      mealType: input.mealType,
      logMode: 'precise',
      foodName: input.foodName,
      servingSize: input.servingSize ?? null,
      quantity: q,
      calories: input.calories * q,
      proteinG: input.proteinG * q,
      carbsG: input.carbsG * q,
      fatG: input.fatG * q,
      fiberG: (input.fiberG ?? 0) * q,
      isEstimated: false,
    })
    .run();
  return Number(res.lastInsertRowId);
}

/**
 * Honest-log mode (spec §3.5): store the plain-language description and a rough
 * macro estimate flagged `isEstimated`. If the caller overrides macros (user
 * adjusted the estimate) those are used verbatim.
 */
export function addHonestFood(
  input: {
    mealType: MealType;
    description: string;
    override?: { calories: number; proteinG: number; carbsG: number; fatG: number };
    date?: string;
  },
  userId: number = PRIMARY_USER_ID
): { id: number; estimate: ReturnType<typeof estimateFromDescription> } {
  const est = estimateFromDescription(input.description);
  const macros = input.override ?? {
    calories: est.calories,
    proteinG: est.protein,
    carbsG: est.carbs,
    fatG: est.fat,
  };
  const res = db
    .insert(foodEntries)
    .values({
      userId,
      date: input.date ?? todayISO(),
      mealType: input.mealType,
      logMode: 'honest',
      freeTextDescription: input.description,
      foodName: est.matched[0] ?? 'Honest log',
      quantity: 1,
      calories: macros.calories,
      proteinG: macros.proteinG,
      carbsG: macros.carbsG,
      fatG: macros.fatG,
      fiberG: 0,
      isEstimated: true,
    })
    .run();
  return { id: Number(res.lastInsertRowId), estimate: est };
}

export function deleteFoodEntry(id: number): void {
  db.delete(foodEntries).where(eq(foodEntries.id, id)).run();
}

export function foodEntriesForDay(date: string, userId: number = PRIMARY_USER_ID): FoodEntry[] {
  return db
    .select()
    .from(foodEntries)
    .where(and(eq(foodEntries.userId, userId), eq(foodEntries.date, date)))
    .orderBy(foodEntries.createdAt)
    .all();
}

export interface DayNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  byMeal: Record<MealType, FoodEntry[]>;
  honestCount: number;
  preciseCount: number;
}

export function dayNutrition(date: string, userId: number = PRIMARY_USER_ID): DayNutrition {
  const entries = foodEntriesForDay(date, userId);
  const byMeal: Record<MealType, FoodEntry[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };
  const total = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  let honestCount = 0;
  let preciseCount = 0;
  for (const e of entries) {
    byMeal[e.mealType].push(e);
    total.calories += e.calories;
    total.protein += e.proteinG;
    total.carbs += e.carbsG;
    total.fat += e.fatG;
    total.fiber += e.fiberG;
    if (e.logMode === 'honest') honestCount++;
    else preciseCount++;
  }
  return { ...total, byMeal, honestCount, preciseCount };
}

// ── Beverages (water + caffeine) ─────────────────────────────────────────────
export function addBeverage(
  type: BeverageType,
  opts: { volumeMl?: number; caffeineMg?: number; date?: string } = {},
  userId: number = PRIMARY_USER_ID
): number {
  const preset = BEVERAGE_PRESETS[type];
  const volumeMl = opts.volumeMl ?? preset.defaultVolumeMl;
  const servings = preset.defaultVolumeMl > 0 ? volumeMl / preset.defaultVolumeMl : 1;
  const caffeineMg = opts.caffeineMg ?? preset.caffeinePerServingMg * servings;
  const res = db
    .insert(beverageEntries)
    .values({
      userId,
      date: opts.date ?? todayISO(),
      type,
      volumeMl,
      caffeineMg: Math.round(caffeineMg),
    })
    .run();
  return Number(res.lastInsertRowId);
}

export function deleteBeverage(id: number): void {
  db.delete(beverageEntries).where(eq(beverageEntries.id, id)).run();
}

export interface DayBeverages {
  hydrationMl: number; // counts hydrating beverages toward the water ring
  waterMl: number; // pure water only
  caffeineMg: number;
  entries: Array<typeof beverageEntries.$inferSelect>;
}

export function dayBeverages(date: string, userId: number = PRIMARY_USER_ID): DayBeverages {
  const entries = db
    .select()
    .from(beverageEntries)
    .where(and(eq(beverageEntries.userId, userId), eq(beverageEntries.date, date)))
    .orderBy(desc(beverageEntries.createdAt))
    .all();
  let hydrationMl = 0;
  let waterMl = 0;
  let caffeineMg = 0;
  for (const e of entries) {
    if (BEVERAGE_PRESETS[e.type].hydrating) hydrationMl += e.volumeMl;
    if (e.type === 'water') waterMl += e.volumeMl;
    caffeineMg += e.caffeineMg;
  }
  return { hydrationMl, waterMl, caffeineMg, entries };
}

// ── Trend aggregation (for coach tips / stats) ───────────────────────────────
export interface DailyIntakeRow {
  date: string;
  calories: number;
  protein: number;
}

export function dailyIntakeSince(sinceISO: string, userId: number = PRIMARY_USER_ID): DailyIntakeRow[] {
  const rows = db
    .select()
    .from(foodEntries)
    .where(and(eq(foodEntries.userId, userId), gte(foodEntries.date, sinceISO)))
    .all();
  const map = new Map<string, DailyIntakeRow>();
  for (const e of rows) {
    const cur = map.get(e.date) ?? { date: e.date, calories: 0, protein: 0 };
    cur.calories += e.calories;
    cur.protein += e.proteinG;
    map.set(e.date, cur);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function avgWaterSince(sinceISO: string, userId: number = PRIMARY_USER_ID): number | null {
  const rows = db
    .select()
    .from(beverageEntries)
    .where(and(eq(beverageEntries.userId, userId), gte(beverageEntries.date, sinceISO)))
    .all();
  if (rows.length === 0) return null;
  const byDay = new Map<string, number>();
  for (const e of rows) {
    if (BEVERAGE_PRESETS[e.type].hydrating) {
      byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.volumeMl);
    }
  }
  if (byDay.size === 0) return 0;
  const total = [...byDay.values()].reduce((s, v) => s + v, 0);
  return total / byDay.size;
}

export function avgCaffeineSince(sinceISO: string, userId: number = PRIMARY_USER_ID): number | null {
  const rows = db
    .select()
    .from(beverageEntries)
    .where(and(eq(beverageEntries.userId, userId), gte(beverageEntries.date, sinceISO)))
    .all();
  if (rows.length === 0) return null;
  const byDay = new Map<string, number>();
  for (const e of rows) byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.caffeineMg);
  const total = [...byDay.values()].reduce((s, v) => s + v, 0);
  return byDay.size ? total / byDay.size : 0;
}
