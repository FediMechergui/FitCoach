/**
 * Turns a Special Programme's prose diet into real, loggable nutrition by
 * resolving each meal's food components against FOOD_DB — so the macros and
 * micros come straight from the food database, never invented here.
 */
import { FOOD_DB } from '@/data/foods';
import { SPECIAL_DIET_BUILDS, type MealBuild } from '@/data/specialDietPlans';
import { findSpecialProgram, type SpecialProgram } from '@/data/specialPrograms';
import { sumMicros, scaleMicros, type MicroProfile } from './micros';
import type { PreciseFoodInput } from '@/repositories/nutritionRepo';

const FOOD_BY_ID = new Map(FOOD_DB.map((f) => [f.id, f]));

export interface ResolvedFood {
  id: string;
  name: string;
  serving: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  micros: Partial<MicroProfile>;
}

export interface MealNutrition {
  mealType: MealBuild['mealType'];
  /** the programme's own label for this meal (from sampleDay) */
  label: string;
  detail: string;
  foods: ResolvedFood[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  micros: MicroProfile;
  /** true for plain water/coffee notes with nothing to log */
  hydrationOnly: boolean;
}

export interface DietNutrition {
  meals: MealNutrition[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  micros: MicroProfile;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function resolveFood(id: string, servings: number): ResolvedFood | null {
  const f = FOOD_BY_ID.get(id);
  if (!f) return null;
  return {
    id: f.id,
    name: f.name,
    serving: f.serving,
    servings,
    calories: f.calories * servings,
    protein: f.protein * servings,
    carbs: f.carbs * servings,
    fat: f.fat * servings,
    fiber: (f.fiber ?? 0) * servings,
    micros: f.micros ? scaleMicros(f.micros, servings) : {},
  };
}

/** Nutrition for one programme meal (by build + its sampleDay label/detail). */
export function mealNutrition(build: MealBuild, label: string, detail: string): MealNutrition {
  const foods = build.components
    .map((c) => resolveFood(c.id, c.servings))
    .filter((f): f is ResolvedFood => f !== null);
  const micros = sumMicros(foods.map((f) => f.micros));
  return {
    mealType: build.mealType,
    label,
    detail,
    foods,
    calories: Math.round(foods.reduce((s, f) => s + f.calories, 0)),
    protein: r1(foods.reduce((s, f) => s + f.protein, 0)),
    carbs: r1(foods.reduce((s, f) => s + f.carbs, 0)),
    fat: r1(foods.reduce((s, f) => s + f.fat, 0)),
    fiber: r1(foods.reduce((s, f) => s + f.fiber, 0)),
    micros,
    hydrationOnly: build.components.length === 0,
  };
}

/** Full nutrition for a programme's diet (all meals + day totals). */
export function dietNutrition(program: SpecialProgram): DietNutrition {
  const builds = SPECIAL_DIET_BUILDS[program.key] ?? [];
  const meals = program.diet.sampleDay.map((m, i) =>
    mealNutrition(builds[i] ?? { mealType: 'snack', components: [] }, m.label, m.detail)
  );
  return {
    meals,
    calories: Math.round(meals.reduce((s, m) => s + m.calories, 0)),
    protein: r1(meals.reduce((s, m) => s + m.protein, 0)),
    carbs: r1(meals.reduce((s, m) => s + m.carbs, 0)),
    fat: r1(meals.reduce((s, m) => s + m.fat, 0)),
    fiber: r1(meals.reduce((s, m) => s + m.fiber, 0)),
    micros: sumMicros(meals.map((m) => m.micros)),
  };
}

/** Convenience: resolve a programme's diet by key. */
export function dietNutritionByKey(programKey: string): DietNutrition | null {
  const p = findSpecialProgram(programKey);
  return p ? dietNutrition(p) : null;
}

/**
 * Turn a resolved meal into diary rows — one precise food entry per component,
 * each carrying its real per-serving macros and micros (scaled on insert by the
 * repository), so logging a programme meal is exactly like logging those foods.
 */
export function mealToDiaryInputs(meal: MealNutrition, date?: string): PreciseFoodInput[] {
  return meal.foods.map((f) => {
    const base = FOOD_BY_ID.get(f.id)!;
    return {
      mealType: meal.mealType,
      foodName: base.name,
      quantity: f.servings,
      servingSize: base.serving,
      calories: base.calories,
      proteinG: base.protein,
      carbsG: base.carbs,
      fatG: base.fat,
      fiberG: base.fiber ?? 0,
      micros: base.micros,
      date,
    };
  });
}
