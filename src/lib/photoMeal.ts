/**
 * Turning what a model saw into rows you can check before anything is logged.
 *
 * Each food the model names goes down one of two paths, and which one it takes
 * is the whole point of the design:
 *
 *  · **The catalogue has it.** Then the catalogue's numbers are used — curated
 *    macros, and micronutrients that were measured rather than generated. The
 *    model's only contribution is the name and the portion.
 *  · **The catalogue doesn't.** Then, and only then, researched figures are
 *    used, saved as a new food marked as model-sourced so the estimate can
 *    never later be mistaken for measured data.
 *
 * Portion is the weak link in all of this — judging grams from a flat image is
 * far harder than naming the food — which is why every row is editable before
 * it is logged, and why nothing here writes to the database itself.
 *
 * Pure functions; scripts/verify-engines.ts tests them without a network.
 */
import type { FoodItem } from '@/data/foods';
import { matchFood, MATCH_MIN_SCORE } from './foodMatch';
import { scalePer100g, type AiFoodPortion, type AiNutritionPer100g, type ScaledPortion } from './aiFood';
import type { MicroKey, MicroProfile } from './micros';

/** Where a row's numbers come from. */
export type PhotoItemSource = 'catalogue' | 'researched';

/**
 * Roughly 36 catalogue foods — mostly drinks, plus a sandwich — state a serving
 * with no gram weight ("250 ml glass", "1 sandwich"). There is nothing to scale
 * against, so such a row is counted in SERVINGS instead of grams, and the UI
 * offers that control rather than a grams box that silently does nothing.
 */
export interface PhotoMealRow {
  /** what will be logged — the catalogue's name when matched, else the model's */
  name: string;
  /** what the model actually called it, kept for the UI and for research */
  spokenName: string;
  grams: number;
  confidence: number;
  source: PhotoItemSource;
  /** how well the catalogue name matched, when it did */
  matchScore?: number;
  /** the matched catalogue food */
  food?: FoodItem;
  /** how many of that food's servings `grams` comes to */
  quantity: number;
  /** true when the serving had no gram figure, so quantity is a guess of 1 */
  servingUnknown?: boolean;
  /** the nutrition that will actually be logged for this row */
  nutrition: ScaledPortion;
  /** for a researched food, the per-100 g profile to save alongside it */
  per100g?: AiNutritionPer100g;
}

/**
 * The gram weight a serving describes, or null when it doesn't say.
 *
 * Servings read like "1 cup (195g)", "225 g (1 cup)", "100g" or "1 egg (50g)",
 * so a figure in brackets is preferred — that is where the weight lives when
 * the serving leads with a household measure — and a bare leading figure is
 * used otherwise.
 */
export function servingGrams(serving: string): number | null {
  if (!serving) return null;
  const bracketed = serving.match(/\(\s*([\d.]+)\s*g\b/i);
  if (bracketed) {
    const n = parseFloat(bracketed[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const leading = serving.match(/(?:^|[\s(])([\d.]+)\s*g\b/i);
  if (leading) {
    const n = parseFloat(leading[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function scaleMicroProfile(
  micros: Partial<MicroProfile> | undefined,
  factor: number
): Partial<MicroProfile> | undefined {
  if (!micros) return undefined;
  const out: Partial<MicroProfile> = {};
  let kept = 0;
  for (const [k, v] of Object.entries(micros)) {
    if (typeof v === 'number' && Number.isFinite(v)) {
      out[k as MicroKey] = Math.round(v * factor * 100) / 100;
      kept += 1;
    }
  }
  return kept > 0 ? out : undefined;
}

/** A catalogue food scaled to a gram weight. */
export function scaleCatalogueFood(food: FoodItem, grams: number): {
  quantity: number;
  servingUnknown: boolean;
  nutrition: ScaledPortion;
} {
  const perServing = servingGrams(food.serving);
  // With no gram figure to scale against, one serving is the honest default and
  // the UI says the portion needs checking rather than inventing a factor.
  const servingUnknown = perServing == null;
  /*
   * Round the quantity FIRST, then derive everything from the rounded value.
   *
   * The diary stores a quantity and multiplies the per-serving figures by it
   * (see nutritionRepo.addPreciseFood), so any nutrition computed from a more
   * precise quantity than the one actually stored would disagree with what is
   * recorded. 200 g of couscous showed 444 kcal on review and logged 445.
   * Deriving both from the same rounded number makes what you approve exactly
   * what is kept.
   */
  const quantity = servingUnknown ? 1 : Math.round((grams / perServing!) * 100) / 100;
  const round1 = (v: number) => Math.round(v * 10) / 10;
  return {
    quantity,
    servingUnknown,
    nutrition: {
      calories: Math.round(food.calories * quantity),
      protein: round1(food.protein * quantity),
      carbs: round1(food.carbs * quantity),
      fat: round1(food.fat * quantity),
      fiber: round1(food.fiber * quantity),
      micros: scaleMicroProfile(food.micros, quantity),
    },
  };
}

/**
 * Try to answer one identified food from the catalogue. Null means nothing was
 * close enough and the food needs researching.
 */
export function rowFromCatalogue(
  item: AiFoodPortion,
  catalogue: readonly FoodItem[],
  minScore: number = MATCH_MIN_SCORE
): PhotoMealRow | null {
  const match = matchFood(item.name, catalogue, (f) => f.name, minScore);
  if (!match) return null;
  const scaled = scaleCatalogueFood(match.food, item.grams);
  return {
    name: match.food.name,
    spokenName: item.name,
    grams: item.grams,
    confidence: item.confidence,
    source: 'catalogue',
    matchScore: match.score,
    food: match.food,
    quantity: scaled.quantity,
    servingUnknown: scaled.servingUnknown,
    nutrition: scaled.nutrition,
  };
}

/** A row for a food the catalogue doesn't have, from researched figures. */
export function rowFromResearch(item: AiFoodPortion, per100g: AiNutritionPer100g): PhotoMealRow {
  // Researched foods are stored per 100 g, so the logged quantity is simply how
  // many hundreds of grams this portion is. As on the catalogue path, the
  // nutrition is derived from the ROUNDED quantity the diary will actually
  // keep, so what was approved and what is stored cannot drift apart.
  const quantity = Math.round((item.grams / 100) * 100) / 100;
  return {
    name: item.name,
    spokenName: item.name,
    grams: item.grams,
    confidence: item.confidence,
    source: 'researched',
    quantity,
    nutrition: scalePer100g(per100g, quantity * 100),
    per100g,
  };
}

/** Which identified foods the catalogue could not answer. */
export function unresolvedNames(
  items: readonly AiFoodPortion[],
  catalogue: readonly FoodItem[],
  minScore: number = MATCH_MIN_SCORE
): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (!rowFromCatalogue(item, catalogue, minScore)) out.push(item.name);
  }
  return out;
}

/** What the whole plate comes to. */
export function mealTotals(rows: readonly PhotoMealRow[]): ScaledPortion {
  const round1 = (v: number) => Math.round(v * 10) / 10;
  const micros: Partial<MicroProfile> = {};
  let anyMicro = false;
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;
  for (const r of rows) {
    calories += r.nutrition.calories;
    protein += r.nutrition.protein;
    carbs += r.nutrition.carbs;
    fat += r.nutrition.fat;
    fiber += r.nutrition.fiber;
    if (r.nutrition.micros) {
      for (const [k, v] of Object.entries(r.nutrition.micros)) {
        if (typeof v !== 'number' || !Number.isFinite(v)) continue;
        micros[k as MicroKey] = Math.round(((micros[k as MicroKey] ?? 0) + v) * 100) / 100;
        anyMicro = true;
      }
    }
  }
  return {
    calories: Math.round(calories),
    protein: round1(protein),
    carbs: round1(carbs),
    fat: round1(fat),
    fiber: round1(fiber),
    micros: anyMicro ? micros : undefined,
  };
}
