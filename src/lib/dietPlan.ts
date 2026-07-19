import { FOOD_DB, type FoodItem } from '@/data/foods';

/**
 * Diet plan generator.
 *
 * Builds a day of meals from the food database that lands close to the user's
 * calorie & macro targets, with random variations: the same targets can be met
 * by many different food combinations (change the seed → a fresh plan with the
 * same macros). Customisable by diet style and number of meals. Deterministic
 * for a given seed so a plan can be reproduced.
 *
 * This is a suggestion engine, not a prescription — it favours whole foods and
 * protein sufficiency, then fills carbs and fats around them.
 */

export type DietStyle = 'balanced' | 'high_protein' | 'low_carb' | 'vegetarian' | 'mediterranean';

export interface DietTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface PlanFood {
  id: string;
  name: string;
  serving: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface PlanMeal {
  key: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  label: string;
  items: PlanFood[];
  totals: DietTarget;
}

export interface DietPlan {
  meals: PlanMeal[];
  totals: DietTarget;
  target: DietTarget;
  style: DietStyle;
  seed: number;
}

export const DIET_STYLES: Array<{ key: DietStyle; label: string; blurb: string }> = [
  { key: 'balanced', label: 'Balanced', blurb: 'A bit of everything' },
  { key: 'high_protein', label: 'High protein', blurb: 'Lean, protein-forward' },
  { key: 'low_carb', label: 'Low carb', blurb: 'Fewer carbs, more fat' },
  { key: 'vegetarian', label: 'Vegetarian', blurb: 'No meat, fish or poultry' },
  { key: 'mediterranean', label: 'Mediterranean', blurb: 'Fish, olive oil, legumes' },
];

// ── seeded RNG (mulberry32) ──────────────────────────────────────────────────
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(arr: T[], r: () => number): T => arr[Math.floor(r() * arr.length) % arr.length];

// ── food role classification ─────────────────────────────────────────────────
type Role = 'protein' | 'carb' | 'fat' | 'veg' | 'other';
const MEAT_CATS = new Set(['Meat', 'Poultry', 'Seafood', 'Offal']);
/** Names that signal meat/fish even when the category is Salad/Pasta/etc. */
const MEAT_NAME =
  /beef|chicken|lamb|mutton|veal|turkey|duck|rabbit|quail|liver|kidney|merguez|tuna|thon|salmon|sardine|mackerel|anchovy|shrimp|octopus|squid|mussel|cuttlefish|\bfish\b|poulet|viande|poisson|goat meat|camel meat|sea bream|sea bass/i;
const RED_MEAT_NAME = /beef|lamb|mutton|veal|goat meat|camel meat|merguez|liver|kidney/i;

function roleOf(f: FoodItem): Role {
  const kcal = f.calories || 1;
  const pPct = (f.protein * 4) / kcal;
  const cPct = (f.carbs * 4) / kcal;
  const fPct = (f.fat * 9) / kcal;
  if (f.category === 'Vegetable') return 'veg';
  if (f.protein >= 10 && pPct >= 0.3) return 'protein';
  if (cPct >= 0.5) return 'carb';
  if (fPct >= 0.5) return 'fat';
  return 'other';
}

/** Only whole, single foods make sensible plan building blocks (skip composite dishes). */
function isBuildingBlock(f: FoodItem): boolean {
  const composite = ['Fast food', 'Tunisian dish', 'Tunisian sweet', 'Milkshake', 'Pastry', 'Chocolate'];
  return !composite.includes(f.category ?? '') && f.calories > 0;
}

function poolsFor(style: DietStyle) {
  let foods = FOOD_DB.filter(isBuildingBlock);
  if (style === 'vegetarian') {
    foods = foods.filter((f) => !MEAT_CATS.has(f.category ?? '') && !MEAT_NAME.test(f.name));
  }
  if (style === 'mediterranean') {
    // Fish & legumes stay; drop red meat & offal (by category and by name).
    foods = foods.filter((f) => f.category !== 'Meat' && f.category !== 'Offal' && !RED_MEAT_NAME.test(f.name));
  }
  const protein = foods.filter((f) => roleOf(f) === 'protein');
  const carb = foods.filter((f) => roleOf(f) === 'carb');
  const fat = foods.filter((f) => roleOf(f) === 'fat');
  const veg = foods.filter((f) => roleOf(f) === 'veg');
  return { protein, carb, fat, veg };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
/** Round servings to a friendly 0.5 step. */
function nice(v: number): number {
  return Math.max(0.5, Math.round(v * 2) / 2);
}

function scaled(f: FoodItem, servings: number): PlanFood {
  return {
    id: f.id,
    name: f.name,
    serving: f.serving,
    servings,
    calories: Math.round(f.calories * servings),
    protein: Math.round(f.protein * servings),
    carbs: Math.round(f.carbs * servings),
    fat: Math.round(f.fat * servings),
  };
}

const MEAL_SPLITS: Record<number, Array<{ key: PlanMeal['key']; label: string; w: number }>> = {
  3: [
    { key: 'breakfast', label: 'Breakfast', w: 0.33 },
    { key: 'lunch', label: 'Lunch', w: 0.37 },
    { key: 'dinner', label: 'Dinner', w: 0.3 },
  ],
  4: [
    { key: 'breakfast', label: 'Breakfast', w: 0.28 },
    { key: 'lunch', label: 'Lunch', w: 0.32 },
    { key: 'dinner', label: 'Dinner', w: 0.3 },
    { key: 'snack', label: 'Snack', w: 0.1 },
  ],
};

export function generateDietPlan(
  target: DietTarget,
  opts: { style?: DietStyle; meals?: number; seed?: number } = {}
): DietPlan {
  const style = opts.style ?? 'balanced';
  const mealsCount = opts.meals === 3 ? 3 : 4;
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
  const r = rng(seed);
  const pools = poolsFor(style);

  const splits = MEAL_SPLITS[mealsCount];
  const meals: PlanMeal[] = [];

  for (const split of splits) {
    const mealP = target.protein * split.w;
    const mealC = target.carbs * split.w;
    const mealF = target.fat * split.w;
    const items: PlanFood[] = [];

    // 1) Protein anchor — aim for ~80% of the meal's protein from the anchor,
    //    leaving headroom for the protein that carb/fat/veg foods also add.
    if (pools.protein.length) {
      const p = pick(pools.protein, r);
      const servings = nice(clamp((mealP * 0.8) / Math.max(1, p.protein), 0.5, 3.5));
      items.push(scaled(p, servings));
    }
    const gotP = items.reduce((s, i) => s + i.protein, 0);
    const gotC = items.reduce((s, i) => s + i.carbs, 0);
    const gotF = items.reduce((s, i) => s + i.fat, 0);

    // 2) Carb filler — fill the remaining carbs (skip most carbs on low-carb).
    const carbNeed = style === 'low_carb' ? mealC * 0.4 : mealC;
    if (pools.carb.length && carbNeed - gotC > 5) {
      const c = pick(pools.carb, r);
      const servings = nice(clamp((carbNeed - gotC) / Math.max(1, c.carbs), 0.5, 4));
      items.push(scaled(c, servings));
    }

    // 3) Fat filler — top up remaining fat.
    const fatNeed = style === 'low_carb' ? mealF * 1.2 : mealF;
    if (pools.fat.length && fatNeed - gotF > 3) {
      const ff = pick(pools.fat, r);
      const servings = nice(clamp((fatNeed - gotF) / Math.max(1, ff.fat), 0.5, 3));
      items.push(scaled(ff, servings));
    }

    // 4) A vegetable for volume & micros (not on the snack).
    if (pools.veg.length && split.key !== 'snack') {
      items.push(scaled(pick(pools.veg, r), 1));
    }

    const totals = items.reduce(
      (t, i) => ({
        calories: t.calories + i.calories,
        protein: t.protein + i.protein,
        carbs: t.carbs + i.carbs,
        fat: t.fat + i.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    meals.push({ key: split.key, label: split.label, items, totals });
  }

  const totals = meals.reduce(
    (t, m) => ({
      calories: t.calories + m.totals.calories,
      protein: t.protein + m.totals.protein,
      carbs: t.carbs + m.totals.carbs,
      fat: t.fat + m.totals.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return { meals, totals, target, style, seed };
}
