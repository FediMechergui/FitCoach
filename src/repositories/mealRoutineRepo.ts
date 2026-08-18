import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { mealRoutines, type MealRoutine, type MealType } from '@/db/schema';
import { roundGrams, roundKcal } from '@/lib/format';
import { addPreciseFood, foodEntriesForDay } from './nutritionRepo';
import { supplementFoodEntryIds } from './supplementsRepo';
import { todayISO } from '@/lib/date';
import { PRIMARY_USER_ID } from './userRepo';

/**
 * Saved meals — "my usual breakfast", "post-training", or a whole day's
 * distribution for a fasting window.
 *
 * Items are stored as a **macro snapshot**, not as references into the food
 * catalogue. The catalogue ships with the app and is replaced on every update,
 * so a routine holding ids would quietly change under you — or break outright
 * if an id moved. A snapshot re-logs exactly what you saved, indefinitely.
 * It is the same reasoning that makes `food_entries` copy macros at log time.
 */

export interface RoutineItem {
  foodName: string;
  servingSize: string | null;
  quantity: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  /** liquid or solid, for the digestion clock; missing = solid */
  form?: 'solid' | 'liquid' | null;
  /** which meal this item belongs to — used by whole-day routines */
  mealType: MealType;
  /** micronutrients, already scaled to `quantity` */
  micros?: Record<string, number> | null;
}

export function parseItems(json: string | null | undefined): RoutineItem[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? (arr as RoutineItem[]) : [];
  } catch {
    return [];
  }
}

export function listMealRoutines(
  mealType?: MealType | null,
  userId: number = PRIMARY_USER_ID
): MealRoutine[] {
  const rows = db
    .select()
    .from(mealRoutines)
    .where(eq(mealRoutines.userId, userId))
    .orderBy(desc(mealRoutines.useCount), desc(mealRoutines.createdAt))
    .all();
  if (mealType === undefined) return rows;
  // A whole-day routine (mealType null) is offered on every meal, since
  // applying it fills all of them at once.
  return rows.filter((r) => r.mealType === mealType || r.mealType === null);
}

/** Totals for a routine, for the card subtitle. */
export function routineTotals(routine: MealRoutine) {
  const items = parseItems(routine.itemsJson);
  const t = items.reduce(
    (a, i) => ({
      calories: a.calories + i.calories,
      protein: a.protein + i.proteinG,
      carbs: a.carbs + i.carbsG,
      fat: a.fat + i.fatG,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return {
    calories: roundKcal(t.calories),
    protein: roundGrams(t.protein),
    carbs: roundGrams(t.carbs),
    fat: roundGrams(t.fat),
    count: items.length,
  };
}

/**
 * Save what's currently logged for a meal (or the whole day) as a routine.
 * Honest-log entries are skipped: they carry an estimate and a free-text
 * description rather than a food, so re-logging one would be re-logging a
 * guess as though it were a measurement.
 */
export function saveMealRoutine(
  name: string,
  mealType: MealType | null,
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): number {
  /*
   * Two kinds of diary rows are excluded from the snapshot. Honest-log entries
   * are estimates, and re-logging a guess as though it were measured would be
   * dishonest. Supplement-created rows (fish oil, whey) belong to the
   * supplement log that made them — snapshot one and re-applying the routine
   * re-logs those calories as food, and taking the supplement the same day
   * then counts them twice.
   */
  const suppRows = supplementFoodEntryIds(date, userId);
  const entries = foodEntriesForDay(date, userId).filter(
    (e) => e.logMode !== 'honest' && !suppRows.has(e.id) && (mealType === null || e.mealType === mealType)
  );
  const items: RoutineItem[] = entries.map((e) => ({
    foodName: e.foodName ?? 'Food',
    servingSize: e.servingSize ?? null,
    quantity: e.quantity ?? 1,
    calories: e.calories,
    proteinG: e.proteinG,
    carbsG: e.carbsG,
    fatG: e.fatG,
    fiberG: e.fiberG,
    form: e.form ?? null,
    mealType: e.mealType,
    micros: e.micros ? safeParse(e.micros) : null,
  }));
  const row = db
    .insert(mealRoutines)
    .values({ userId, name: name.trim() || 'Saved meal', mealType, itemsJson: JSON.stringify(items) })
    .returning({ id: mealRoutines.id })
    .get();
  return row?.id ?? 0;
}

/**
 * Log a routine into a day.
 *
 * `intoMeal` overrides where the items land — so a saved breakfast can be
 * eaten for dinner without saving it twice. A whole-day routine ignores it and
 * uses each item's own meal, which is the point of saving one.
 */
export function applyMealRoutine(
  routineId: number,
  intoMeal?: MealType,
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): number {
  const routine = db
    .select()
    .from(mealRoutines)
    .where(and(eq(mealRoutines.id, routineId), eq(mealRoutines.userId, userId)))
    .get();
  if (!routine) return 0;

  const items = parseItems(routine.itemsJson);
  const wholeDay = routine.mealType === null;
  for (const i of items) {
    addPreciseFood(
      {
        mealType: wholeDay ? i.mealType : (intoMeal ?? routine.mealType ?? i.mealType),
        foodName: i.foodName,
        quantity: 1, // the snapshot is already the eaten amount
        servingSize: i.servingSize ?? undefined,
        calories: i.calories,
        proteinG: i.proteinG,
        carbsG: i.carbsG,
        fatG: i.fatG,
        fiberG: i.fiberG,
        micros: i.micros ?? undefined,
        form: i.form ?? undefined,
        date,
      },
      userId
    );
  }

  db.update(mealRoutines)
    .set({ useCount: routine.useCount + 1, lastUsedAt: Date.now() })
    .where(eq(mealRoutines.id, routineId))
    .run();
  return items.length;
}

export function deleteMealRoutine(id: number, userId: number = PRIMARY_USER_ID): void {
  db.delete(mealRoutines).where(and(eq(mealRoutines.id, id), eq(mealRoutines.userId, userId))).run();
}

export function renameMealRoutine(id: number, name: string, userId: number = PRIMARY_USER_ID): void {
  const clean = name.trim();
  if (!clean) return;
  db.update(mealRoutines)
    .set({ name: clean })
    .where(and(eq(mealRoutines.id, id), eq(mealRoutines.userId, userId)))
    .run();
}

/** How many precise (re-loggable) entries a meal currently has. */
export function saveableEntryCount(
  mealType: MealType | null,
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): number {
  // Mirrors saveMealRoutine's filter exactly, so the "save (n items)" label
  // never promises rows the save would then skip.
  const suppRows = supplementFoodEntryIds(date, userId);
  return foodEntriesForDay(date, userId).filter(
    (e) => e.logMode !== 'honest' && !suppRows.has(e.id) && (mealType === null || e.mealType === mealType)
  ).length;
}

function safeParse(json: string): Record<string, number> | null {
  try {
    const v = JSON.parse(json);
    return v && typeof v === 'object' ? (v as Record<string, number>) : null;
  } catch {
    return null;
  }
}
