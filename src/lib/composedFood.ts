import type { MicroProfile } from './micros';
import { scaleMicros, sumMicros } from './micros';
import { roundGrams, roundKcal } from './format';

/**
 * A meal built from other foods — "my Friday couscous": couscous ×1.5, lamb ×1,
 * chickpeas ×0.5, olive oil ×2 tbsp — saved once, logged in one tap forever.
 *
 * ── The one design decision that matters ──
 * Each component is a SNAPSHOT of the food's macros and micros at the moment
 * it was added, already scaled by its servings. Not a reference. The catalogue
 * ships with the app and is replaced on every update; a recipe holding food
 * ids would drift when a food's numbers were corrected, or break outright if
 * an id disappeared. Snapshots mean the composed food you saved is the
 * composed food you eat, indefinitely — the same reasoning that makes diary
 * rows copy macros at log time and meal routines snapshot their items.
 *
 * The composed food's own totals are the SUM of its components and are stored
 * on the row itself, kept in sync on every edit — so logging one is exactly as
 * cheap as logging any other food, and the search list can show its calories
 * without parsing anything.
 */

export interface FoodComponent {
  /** catalogue id, custom:<n>, or null for a free-typed line — display only */
  sourceId: string | null;
  name: string;
  /** what one serving of the source food is, e.g. "1 cup (158g)" */
  servingSize: string | null;
  /** how many of those servings went in */
  servings: number;
  // ── snapshot, ALREADY multiplied by `servings` ──
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  micros: Partial<MicroProfile> | null;
}

/** A food as the composer sees it — the shape both catalogue and custom foods reduce to. */
export interface ComposableFood {
  id: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  micros?: Partial<MicroProfile> | null;
}

/** Build one component: the food × servings, snapshotted. */
export function makeComponent(food: ComposableFood, servings: number): FoodComponent {
  const n = Number.isFinite(servings) && servings > 0 ? servings : 1;
  return {
    sourceId: food.id,
    name: food.name,
    servingSize: food.serving,
    servings: n,
    calories: food.calories * n,
    proteinG: food.protein * n,
    carbsG: food.carbs * n,
    fatG: food.fat * n,
    fiberG: food.fiber * n,
    micros: food.micros ? scaleMicros(food.micros, n) : null,
  };
}

export interface ComposedTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  micros: Partial<MicroProfile> | null;
}

/** Sum the components. Rounded once here so nothing downstream sees a float tail. */
export function composeTotals(components: FoodComponent[]): ComposedTotals {
  let calories = 0, proteinG = 0, carbsG = 0, fatG = 0, fiberG = 0;
  const microSets: Array<Partial<MicroProfile>> = [];
  for (const c of components) {
    calories += c.calories;
    proteinG += c.proteinG;
    carbsG += c.carbsG;
    fatG += c.fatG;
    fiberG += c.fiberG;
    if (c.micros) microSets.push(c.micros);
  }
  return {
    calories: roundKcal(calories),
    proteinG: roundGrams(proteinG),
    carbsG: roundGrams(carbsG),
    fatG: roundGrams(fatG),
    fiberG: roundGrams(fiberG),
    // sumMicros returns every key at 0 when empty; null is the honest "none".
    micros: microSets.length ? sumMicros(microSets) : null,
  };
}

/** Change how many servings of a component there are; the snapshot rescales exactly. */
export function rescaleComponent(c: FoodComponent, servings: number): FoodComponent {
  const n = Number.isFinite(servings) && servings > 0 ? servings : c.servings;
  if (n === c.servings) return c;
  const k = n / c.servings;
  return {
    ...c,
    servings: n,
    calories: c.calories * k,
    proteinG: c.proteinG * k,
    carbsG: c.carbsG * k,
    fatG: c.fatG * k,
    fiberG: c.fiberG * k,
    micros: c.micros ? scaleMicros(c.micros, k) : null,
  };
}

export function parseComponents(json: string | null | undefined): FoodComponent[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? (arr as FoodComponent[]) : [];
  } catch {
    return [];
  }
}

/** "couscous ×1.5 · lamb ×1 · chickpeas ×0.5" — for the card subtitle. */
export function describeComponents(components: FoodComponent[], max = 4): string {
  const parts = components.slice(0, max).map((c) => `${c.name} ×${trimNum(c.servings)}`);
  const more = components.length - max;
  return more > 0 ? `${parts.join(' · ')} +${more} more` : parts.join(' · ');
}

const trimNum = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));

/**
 * A composed food may include another composed food (a "set meal" of a saved
 * plate plus a drink), but not itself, directly or through a chain — that is
 * an infinite recipe. Callers pass the ids already on the path.
 */
export function wouldCreateCycle(candidateId: string, path: string[]): boolean {
  return path.includes(candidateId);
}
