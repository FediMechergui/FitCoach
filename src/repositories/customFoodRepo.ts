import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { customFoods, type CustomFood } from '@/db/schema';
import type { FoodItem } from '@/data/foods';
import { caloriesFromMacros } from '@/lib/foodMath';
import { composeTotals, parseComponents, type ComposableFood, type FoodComponent } from '@/lib/composedFood';
import type { MicroProfile } from '@/lib/micros';
import { PRIMARY_USER_ID } from './userRepo';

/**
 * Foods the user entered themselves.
 *
 * These are deliberately kept in their own table rather than being appended to
 * the built-in catalogue: the catalogue is a static asset that ships with the
 * app and gets replaced on every update, so anything written into it would be
 * lost. A separate table also means a custom food can be edited or deleted
 * without touching anything already logged — `food_entries` copies macros at
 * log time, exactly as it does for built-in foods, so past diary days never
 * shift when a custom food is corrected later.
 */

/** The id namespace for custom foods, kept distinct from catalogue ids. */
export const CUSTOM_FOOD_PREFIX = 'custom:';

export const isCustomFoodId = (id: string): boolean => id.startsWith(CUSTOM_FOOD_PREFIX);

export interface CustomFoodInput {
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  category: string | null;
  caloriesEstimated: boolean;
  /** liquid or solid — the user's choice; solid when unsure */
  form?: 'solid' | 'liquid';
  /**
   * Vitamins and minerals for one serving. A hand-entered food has none (see
   * the note on customFoodsAsItems), but a food researched from a photograph
   * arrives with a full profile, and dropping it would throw away the only
   * micronutrient data such a meal will ever have.
   */
  micros?: Partial<MicroProfile>;
  /** who produced these numbers — 'ai' when a model did. Defaults to 'user'. */
  source?: 'user' | 'ai';
}

export function listCustomFoods(userId: number = PRIMARY_USER_ID): CustomFood[] {
  return db
    .select()
    .from(customFoods)
    .where(eq(customFoods.userId, userId))
    .orderBy(desc(customFoods.createdAt))
    .all();
}

export function getCustomFood(id: number, userId: number = PRIMARY_USER_ID): CustomFood | undefined {
  return db
    .select()
    .from(customFoods)
    .where(and(eq(customFoods.id, id), eq(customFoods.userId, userId)))
    .get();
}

export function createCustomFood(input: CustomFoodInput, userId: number = PRIMARY_USER_ID): number {
  const row = db
    .insert(customFoods)
    .values({ ...normalise(input), ...provenance(input), userId })
    .returning({ id: customFoods.id })
    .get();
  return row?.id ?? 0;
}

export function updateCustomFood(
  id: number,
  input: CustomFoodInput,
  userId: number = PRIMARY_USER_ID
): void {
  db.update(customFoods)
    .set(normalise(input))
    .where(and(eq(customFoods.id, id), eq(customFoods.userId, userId)))
    .run();
}

export function deleteCustomFood(id: number, userId: number = PRIMARY_USER_ID): void {
  db.delete(customFoods).where(and(eq(customFoods.id, id), eq(customFoods.userId, userId))).run();
}

/**
 * Clamp to sane values before storing. Negative macros are nonsense, and a
 * missing calorie figure is derived rather than stored as zero — a food with no
 * energy at all would silently under-count the whole day.
 */
function normalise(input: CustomFoodInput) {
  const protein = Math.max(0, input.protein);
  const carbs = Math.max(0, input.carbs);
  const fat = Math.max(0, input.fat);
  const fiber = Math.max(0, Math.min(input.fiber, carbs));
  const macros = { protein, carbs, fat, fiber };
  const entered = Math.max(0, input.calories);
  const calories = entered > 0 ? entered : caloriesFromMacros(macros);
  return {
    name: input.name.trim(),
    serving: input.serving.trim() || '1 serving',
    calories,
    protein,
    carbs,
    fat,
    fiber,
    category: input.category?.trim() || null,
    caloriesEstimated: entered > 0 ? false : true,
    form: input.form ?? 'solid',
  };
}

/**
 * Micros and provenance are written on CREATE only, deliberately.
 *
 * `updateCustomFood` applies everything `normalise` returns as a SET, so any
 * column named there is overwritten on every edit. A food researched from a
 * photograph is not "composed", so correcting one of its numbers goes through
 * the ordinary editor — and if these were part of `normalise`, that edit would
 * silently erase the whole micronutrient profile and relabel a model estimate
 * as hand-entered data. Left out, an edit changes the macros and leaves both
 * the micros and the 'ai' mark exactly as they were.
 */
function provenance(input: CustomFoodInput) {
  return {
    microsJson:
      input.micros && Object.keys(input.micros).length > 0 ? JSON.stringify(input.micros) : null,
    source: input.source ?? ('user' as const),
  };
}

/**
 * Custom foods shaped like catalogue entries, so search, selection and logging
 * treat them identically to built-in foods.
 *
 * A hand-entered food still carries no micronutrients: the user gave macros,
 * and inventing a vitamin profile from a name would be exactly the fabrication
 * the rest of the food data avoids. It contributes nothing to the micro totals,
 * which is honest. A food researched from a photograph is different — it has a
 * profile, sanity-checked in lib/aiFood, and carries source 'ai' so it can
 * always be told apart from measured data.
 */
export function customFoodsAsItems(userId: number = PRIMARY_USER_ID): FoodItem[] {
  return listCustomFoods(userId).map(toFoodItem);
}

export function toFoodItem(f: CustomFood): FoodItem {
  return {
    id: `${CUSTOM_FOOD_PREFIX}${f.id}`,
    name: f.name,
    serving: f.serving,
    calories: f.calories,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    fiber: f.fiber,
    category: f.category ?? undefined,
    isCustom: true,
    caloriesEstimated: f.caloriesEstimated,
    form: f.form === 'liquid' ? 'liquid' : 'solid',
    // A composed food carries the micros summed from its parts; a plain
    // custom food has none (nothing to sum from, and none is invented).
    micros: parseMicros(f.microsJson) ?? undefined,
    isComposed: !!f.componentsJson,
    aiSourced: f.source === 'ai',
  };
}

/** The numeric row id behind a `custom:<n>` food id, or null if it isn't one. */
export function customFoodIdFrom(foodId: string): number | null {
  if (!isCustomFoodId(foodId)) return null;
  const n = parseInt(foodId.slice(CUSTOM_FOOD_PREFIX.length), 10);
  return Number.isFinite(n) ? n : null;
}

// ── Composed foods: a dish built from other foods with quantities ────────────

export interface ComposedFoodInput {
  name: string;
  serving: string;
  category: string | null;
  components: FoodComponent[];
  /** liquid or solid; when omitted, a dish of only drinks is a drink, anything else is solid */
  form?: 'solid' | 'liquid';
}

/** A dish made only of drinks is a drink (a smoothie); one solid part makes it solid. */
export function composedFormDefault(components: Array<{ form?: 'solid' | 'liquid' | null }>): 'solid' | 'liquid' {
  return components.length > 0 && components.every((c) => c.form === 'liquid') ? 'liquid' : 'solid';
}

/**
 * Save a composed food. The row's macros are the SUM of its components —
 * written on every save so logging it stays a single-row read, and so the
 * search list can show its calories without parsing JSON. Micros are summed
 * too and stored alongside, so a plate of couscous with lamb carries the iron
 * and B12 of the lamb into your daily totals, exactly as the parts would.
 */
export function createComposedFood(input: ComposedFoodInput, userId: number = PRIMARY_USER_ID): number {
  const t = composeTotals(input.components);
  const row = db
    .insert(customFoods)
    .values({
      userId,
      name: input.name.trim() || 'Composed meal',
      serving: input.serving.trim() || '1 plate',
      calories: t.calories,
      protein: t.proteinG,
      carbs: t.carbsG,
      fat: t.fatG,
      fiber: t.fiberG,
      category: input.category?.trim() || null,
      // Summed from real per-food figures, not estimated from macros.
      caloriesEstimated: false,
      componentsJson: JSON.stringify(input.components),
      microsJson: t.micros ? JSON.stringify(t.micros) : null,
      form: input.form ?? composedFormDefault(input.components),
    })
    .returning({ id: customFoods.id })
    .get();
  return row?.id ?? 0;
}

export function updateComposedFood(id: number, input: ComposedFoodInput, userId: number = PRIMARY_USER_ID): void {
  const t = composeTotals(input.components);
  db.update(customFoods)
    .set({
      name: input.name.trim() || 'Composed meal',
      serving: input.serving.trim() || '1 plate',
      calories: t.calories,
      protein: t.proteinG,
      carbs: t.carbsG,
      fat: t.fatG,
      fiber: t.fiberG,
      category: input.category?.trim() || null,
      caloriesEstimated: false,
      componentsJson: JSON.stringify(input.components),
      microsJson: t.micros ? JSON.stringify(t.micros) : null,
      form: input.form ?? composedFormDefault(input.components),
    })
    .where(and(eq(customFoods.id, id), eq(customFoods.userId, userId)))
    .run();
}

export const isComposed = (f: CustomFood): boolean => !!f.componentsJson;

export function componentsOf(f: CustomFood): FoodComponent[] {
  return parseComponents(f.componentsJson);
}

/**
 * Everything the composer can pick from: the catalogue plus the user's own
 * foods (including other composed ones — a "set meal" of a saved plate and a
 * drink is a legitimate thing to want). `excludeId` keeps a food from
 * containing itself.
 */
export function composableFoods(
  catalogue: FoodItem[],
  excludeId?: string,
  userId: number = PRIMARY_USER_ID
): ComposableFood[] {
  const own = listCustomFoods(userId).map((f) => ({
    id: `${CUSTOM_FOOD_PREFIX}${f.id}`,
    name: f.name,
    serving: f.serving,
    calories: f.calories,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    fiber: f.fiber,
    micros: parseMicros(f.microsJson),
    form: (f.form === 'liquid' ? 'liquid' : 'solid') as 'solid' | 'liquid',
  }));
  const all: ComposableFood[] = [
    ...own,
    ...catalogue.map((f) => ({
      id: f.id, name: f.name, serving: f.serving, calories: f.calories,
      protein: f.protein, carbs: f.carbs, fat: f.fat, fiber: f.fiber, micros: f.micros ?? null,
      form: f.form,
    })),
  ];
  return excludeId ? all.filter((f) => f.id !== excludeId) : all;
}

function parseMicros(json: string | null): Partial<MicroProfile> | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json);
    return v && typeof v === 'object' ? (v as Partial<MicroProfile>) : null;
  } catch {
    return null;
  }
}
