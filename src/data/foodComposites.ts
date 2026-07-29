import type { MicroProfile } from '@/lib/micros';

/**
 * Micronutrients for **composite dishes**, derived rather than guessed.
 *
 * A tajine, a kafteji, a makloub, an Eid cookie — none of these have a USDA
 * entry, and inventing plausible-looking numbers for them would be the worst
 * possible outcome: fabricated data that looks exactly as authoritative as the
 * measured kind. So instead each dish is written down as what it is actually
 * made of, in servings of foods that DO have measured data, and its micros are
 * the sum of its parts.
 *
 * That buys three things:
 *  · nothing is invented — every number traces back to a measured ingredient;
 *  · a recipe is checkable, and it is checked: `verify-engines` recomputes each
 *    dish's macros from its components and fails if they drift too far from the
 *    macros the food itself declares. A wrong recipe can't sit here quietly;
 *  · when an ingredient's data improves, every dish containing it improves too.
 *
 * Recipes are approximations of a typical home/restaurant portion, not a chef's
 * formula. They are tuned to reproduce the dish's own declared macros, which is
 * what makes the derived micros land in the right range.
 *
 * A component may itself be a composite (a sandwich contains bread which
 * contains flour); resolution recurses, with a depth cap for safety.
 */

/** [food id, how many of that food's servings are in one serving of the dish] */
export type Recipe = Array<[string, number]>;

export const FOOD_COMPOSITES: Record<string, Recipe> = {
  // ── Tunisian mains & stews ─────────────────────────────────────────────────
  'tn-couscous-full': [['tn-couscous-plain', 0.6], ['tn-lamb', 0.7], ['tn-carrot', 0.5], ['tn-pumpkin', 0.5], ['tn-chickpeas', 0.3], ['tn-olive-oil-tbsp', 0.6]],
  'tn-tajine': [['egg', 3], ['tn-chicken-breast', 0.5], ['tn-parmesan', 0.4], ['tn-potato', 0.5], ['tn-olive-oil-tbsp', 1.3], ['tn-onion', 0.4]],
  'tn-brik': [['egg', 1], ['tn-baguette', 0.35], ['tuna', 0.08], ['tn-potato', 0.3], ['tn-olive-oil-tbsp', 0.9]],
  'tn-fricasse': [['tn-baguette', 0.7], ['tuna', 0.25], ['egg', 0.5], ['tn-olives', 0.4], ['tn-potato', 0.3], ['tn-olive-oil-tbsp', 0.8]],
  'tn-lablabi': [['tn-chickpeas', 0.55], ['tn-baguette', 0.4], ['tn-olive-oil-tbsp', 0.3], ['cd-harissa', 0.4], ['tn-garlic', 0.4]],
  'tn-chorba-frik': [['tn-bulgur', 0.45], ['tn-lamb', 0.15], ['tn-tomato', 0.5], ['tn-onion', 0.3], ['tn-olive-oil-tbsp', 0.15]],
  'tn-ojja': [['egg', 2], ['tn-merguez', 0.35], ['tn-tomato', 0.8], ['tn-bell-pepper', 0.5], ['tn-olive-oil-tbsp', 0.4]],
  'tn-kafteji': [['tn-potato', 1.1], ['tn-eggplant', 0.8], ['tn-bell-pepper', 0.8], ['tn-pumpkin', 0.4], ['egg', 1], ['tn-olive-oil-tbsp', 2]],
  // The generic `tn-mloukhia` bowl is already the finished dish (jute leaves,
  // oil and meat), so these use a fraction of it as the greens-and-sauce base
  // and add the specific protein on top.
  'tn-mloukhia-beef': [['tn-mloukhia', 0.8], ['tn-beef-lean', 0.5], ['tn-olive-oil-tbsp', 0.6], ['tn-potato', 0.4], ['tn-garlic', 0.5]],
  'tn-mloukhia-chicken': [['tn-mloukhia', 0.7], ['tn-chicken-thigh', 0.6], ['tn-olive-oil-tbsp', 0.4], ['tn-potato', 0.4], ['tn-garlic', 0.5]],
  'tn-mloukhia-veg': [['tn-mloukhia', 0.35], ['tn-chickpeas', 0.3], ['tn-olive-oil-tbsp', 0.5], ['tn-garlic', 0.5]],
  'tn-marqet-jelbana': [['tn-peas', 1.5], ['tn-beef-lean', 0.6], ['tn-carrot', 0.4], ['tn-tomato', 0.4], ['tn-olive-oil-tbsp', 0.5]],
  'tn-marqa-loubia': [['tn-white-beans', 1.1], ['tn-beef-lean', 0.3], ['tn-tomato', 0.5], ['tn-olive-oil-tbsp', 0.3]],
  'tn-kammounia': [['tn-beef-liver', 1.2], ['tn-olive-oil-tbsp', 1.1], ['tn-garlic', 0.6], ['tn-tomato', 0.3]],
  'tn-marqa-hlou': [['tn-lamb', 0.8], ['tn-date-deglet', 1.2], ['tn-prickly-pear', 0.3], ['tn-carrot', 0.4], ['tn-olive-oil-tbsp', 0.35], ['tn-potato', 0.3]],
  'tn-nwasser': [['tn-pasta-plain', 1.55], ['tn-chicken-thigh', 0.3], ['tn-onion', 0.4], ['tn-olive-oil-tbsp', 0.5]],
  'tn-mhamsa': [['tn-couscous-plain', 0.65], ['tn-chickpeas', 0.3], ['tn-tomato', 0.4], ['tn-olive-oil-tbsp', 0.4]],
  'tn-douwida': [['tn-pasta-plain', 1.1], ['tn-chicken-breast', 0.08], ['tn-carrot', 0.4], ['tn-olive-oil-tbsp', 0.2]],
  'tn-chakchouka': [['egg', 1.6], ['tn-bell-pepper', 1.2], ['tn-tomato', 1], ['tn-onion', 0.5], ['tn-olive-oil-tbsp', 0.6]],
  'tn-madfouna': [['tn-swiss-chard', 1.5], ['tn-white-beans', 1], ['tn-olive-oil-tbsp', 0.8], ['tn-garlic', 0.5]],
  'tn-osban': [['tn-lamb', 0.5], ['tn-lamb-liver', 0.2], ['tn-rice-white', 0.35], ['tn-swiss-chard', 0.4], ['tn-olive-oil-tbsp', 0.5]],
  'tn-maccarona': [['tn-pasta-plain', 1.35], ['tn-beef-ground', 0.45], ['cd-tomato-sauce', 1], ['tn-olive-oil-tbsp', 0.4]],
  'tn-rechta': [['tn-pasta-plain', 1.2], ['tn-chicken-thigh', 0.45], ['tn-chickpeas', 0.25], ['tn-olive-oil-tbsp', 0.35]],
  'tn-pasta-thon': [['tn-pasta-plain', 1.25], ['tuna', 0.35], ['cd-tomato-sauce', 0.8], ['tn-olive-oil-tbsp', 0.55]],
  'tn-bsisa-prepared': [['tn-bsisa-dry', 0.5], ['tn-olive-oil-tbsp', 0.3], ['tn-honey-tbsp', 0.5]],
  'tn-bsisa-drink': [['tn-bsisa-dry', 0.4], ['tn-milk-whole', 0.4], ['tn-olive-oil-tbsp', 0.3], ['tn-honey-tbsp', 0.5]],

  // ── Salads ─────────────────────────────────────────────────────────────────
  'tn-mechouia': [['tn-bell-pepper', 1.2], ['tn-tomato', 0.8], ['tuna', 0.12], ['egg', 0.4], ['tn-olive-oil-tbsp', 0.45], ['tn-garlic', 0.3]],
  'tn-slata-tounsiya': [['tn-tomato', 1], ['tn-cucumber', 1], ['tn-onion', 0.5], ['tn-olive-oil-tbsp', 0.85], ['tn-olives', 0.3]],
  'tn-houria': [['tn-carrot', 0.9], ['tn-olive-oil-tbsp', 0.3], ['cd-harissa', 0.2], ['tn-garlic', 0.2]],
  'tn-torshi': [['tn-turnip', 0.15], ['tn-carrot', 0.1], ['tn-cabbage', 0.1]],
  'tn-salade-poivrons': [['tn-bell-pepper', 1.5], ['tn-olive-oil-tbsp', 0.6], ['tn-garlic', 0.3]],
  'tn-salade-aubergines': [['tn-eggplant', 1.4], ['tn-olive-oil-tbsp', 0.8], ['tn-garlic', 0.4]],
  'tn-salade-poulpe': [['tn-octopus', 0.9], ['tn-olive-oil-tbsp', 0.5], ['tn-lemon', 0.3], ['tn-onion', 0.2]],
  'tn-salade-thon': [['tuna', 0.5], ['tn-tomato', 0.6], ['cd-mayo', 0.8], ['tn-olives', 0.3]],
  'tn-salade-betterave': [['tn-beetroot', 0.9], ['tn-olive-oil-tbsp', 0.13], ['tn-lemon', 0.2]],

  // ── Sweets, pastries & Eid cookies ─────────────────────────────────────────
  'tn-bambalouni': [['tn-baguette', 0.85], ['tn-olive-oil-tbsp', 0.85], ['tn-honey-tbsp', 0.3]],
  'tn-makroudh': [['tn-couscous-plain', 0.1], ['tn-date-deglet', 0.8], ['tn-olive-oil-tbsp', 0.5]],
  'tn-baklava': [['tn-baguette', 0.18], ['tn-almonds', 0.35], ['tn-honey-tbsp', 0.45], ['tn-olive-oil-tbsp', 0.12]],
  'tn-assidat-zgougou': [['tn-pine-nuts', 0.3], ['tn-milk-whole', 0.35], ['tn-honey-tbsp', 1.4]],
  'tn-assida-zgougou-full': [['tn-pine-nuts', 0.6], ['tn-milk-whole', 0.6], ['tn-honey-tbsp', 1.8], ['tn-almonds', 0.3], ['tn-pistachios', 0.2]],
  'tn-assida-boufriwa': [['tn-walnuts', 0.7], ['tn-pine-nuts', 0.35], ['tn-milk-whole', 0.5], ['tn-honey-tbsp', 2.2]],
  'tn-droo-assida': [['tn-droo', 0.9], ['tn-milk-whole', 0.35], ['tn-honey-tbsp', 0.9], ['tn-olive-oil-tbsp', 0.2]],
  'tn-zrir': [['tn-almonds', 0.5], ['tn-sesame', 0.5], ['tn-honey-tbsp', 0.5]],
  'tn-ghraiba-homs': [['tn-chickpeas', 0.18], ['tn-olive-oil-tbsp', 0.28], ['tn-honey-tbsp', 0.3]],
  'tn-ghraiba-dhra': [['tn-droo', 0.25], ['tn-olive-oil-tbsp', 0.28], ['tn-honey-tbsp', 0.3]],
  'tn-ghraiba-flour': [['tn-couscous-plain', 0.1], ['tn-olive-oil-tbsp', 0.45], ['tn-honey-tbsp', 0.25]],
  'tn-baklawa': [['tn-almonds', 0.4], ['tn-baguette', 0.2], ['tn-honey-tbsp', 0.5], ['tn-olive-oil-tbsp', 0.08]],
  'tn-kaak-warka': [['tn-almonds', 0.35], ['tn-baguette', 0.15], ['tn-honey-tbsp', 0.45]],
  'tn-kaak-warka-box': [['tn-almonds', 1.4], ['tn-baguette', 0.7], ['tn-honey-tbsp', 1.5], ['tn-sesame', 0.4]],
  'tn-samsa': [['tn-almonds', 0.35], ['tn-sesame', 0.2], ['tn-baguette', 0.12], ['tn-honey-tbsp', 0.5]],
  'tn-makroudh-el-louz': [['tn-almonds', 0.4], ['tn-couscous-plain', 0.05], ['tn-honey-tbsp', 0.65]],
  'tn-kaak-neqache': [['tn-baguette', 0.6], ['tn-olive-oil-tbsp', 0.4], ['tn-sesame', 0.2], ['tn-honey-tbsp', 0.3]],
  'tn-mlabes': [['tn-almonds', 0.15], ['tn-honey-tbsp', 0.6]],
  'tn-boulou': [['tn-baguette', 0.75], ['tn-almonds', 0.15], ['df-raisins', 0.25], ['tn-olive-oil-tbsp', 0.2]],
  'tn-dides': [['tn-baguette', 0.4], ['tn-olive-oil-tbsp', 0.5], ['tn-honey-tbsp', 0.3]],

  // ── Chocolate & drinks ─────────────────────────────────────────────────────
  'ch-bar-nuts': [['ch-milk', 1.1], ['tn-almonds', 0.4]],
  'ch-hot-chocolate': [['tn-milk-whole', 1], ['ch-cocoa', 1], ['tn-honey-tbsp', 0.6]],
  'ch-chocolate-croissant': [['tn-croissant', 0.85], ['ch-dark-60', 0.5]],
  'ju-banana-milk': [['tn-milk-whole', 0.65], ['banana', 0.8]],

  // ── Sandwiches & fast food ─────────────────────────────────────────────────
  // Restaurant food is fat- and sodium-heavy; the recipes say so through their
  // ingredients rather than through an invented sodium figure.
  'ff-big-mac': [['tn-baguette', 1.3], ['tn-beef-ground', 0.7], ['tn-cheddar', 0.5], ['cd-mayo', 1.1], ['tn-lettuce', 0.4]],
  'ff-cheeseburger': [['tn-baguette', 0.8], ['tn-beef-ground', 0.4], ['tn-cheddar', 0.4], ['cd-ketchup', 1]],
  'ff-fries-medium': [['tn-potato', 2.6], ['tn-olive-oil-tbsp', 1.2]],
  'ff-nuggets': [['tn-chicken-breast', 0.4], ['tn-baguette', 0.5], ['tn-olive-oil-tbsp', 0.9]],
  'ff-pizza-slice': [['tn-baguette', 0.9], ['tn-mozzarella', 0.9], ['cd-tomato-sauce', 0.8], ['tn-olive-oil-tbsp', 0.15]],
  'ff-tacos-fr': [['tn-baguette', 1.6], ['tn-chicken-breast', 0.4], ['tn-potato', 0.9], ['tn-cheddar', 0.6], ['cd-mayo', 2.2], ['tn-beef-ground', 0.3]],
  'ff-kebab': [['tn-baguette', 1.3], ['tn-lamb', 0.75], ['cd-garlic-sauce', 0.8], ['tn-lettuce', 0.5], ['tn-tomato', 0.5]],
  'ff-shawarma': [['tn-baguette', 1.35], ['tn-chicken-thigh', 0.8], ['cd-garlic-sauce', 0.9], ['tn-lettuce', 0.4], ['tn-tomato', 0.5]],
  'ff-chapati': [['tn-mlewi', 1.15], ['tn-chicken-breast', 0.4], ['cd-mayo', 0.7], ['tn-lettuce', 0.3], ['tn-olives', 0.3]],
  'ff-makloub': [['tn-mlewi', 1.2], ['tn-chicken-thigh', 0.6], ['tn-cheddar', 0.5], ['cd-mayo-harissa', 1], ['tn-potato', 0.3]],
  'ff-baguette-farcie': [['tn-baguette', 2], ['tn-tuna-fresh', 0.3], ['tn-potato', 0.7], ['egg', 0.8], ['cd-mayo-harissa', 1.6], ['tn-olives', 0.4]],
  'ff-libanais': [['tn-baguette', 1.5], ['tn-chicken-breast', 0.5], ['cd-garlic-sauce', 1.3], ['tn-lettuce', 0.3], ['tn-potato', 0.3]],
  'ff-panini': [['tn-baguette', 1.3], ['tn-mozzarella', 1.2], ['tn-turkey-breast', 0.2], ['cd-tomato-sauce', 0.5], ['tn-olive-oil-tbsp', 0.9]],
  'ff-hot-dog': [['tn-baguette', 0.8], ['tn-merguez', 0.6], ['cd-ketchup', 1], ['cd-mayo', 0.5]],
  'ff-fried-chicken': [['tn-chicken-thigh', 0.8], ['tn-baguette', 0.3], ['tn-olive-oil-tbsp', 0.8]],
  'ff-ice-cream': [['tn-milk-whole', 0.6], ['ch-cocoa', 0.2], ['tn-honey-tbsp', 0.7]],
  'ff-milkshake': [['tn-milk-whole', 1.8], ['tn-honey-tbsp', 3.5], ['ch-cocoa', 0.6]],
  'tn-pate-sandwich': [['tn-baguette', 1.9], ['tn-pate', 1.2], ['cd-mayo', 0.7], ['tn-lettuce', 0.3], ['tn-olives', 0.3]],
};

/** Macros a recipe implies, for validating it against the dish's own figures. */
export interface DerivedMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface Resolvable {
  micros?: Partial<MicroProfile>;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

const MAX_DEPTH = 4;

/**
 * Walk a recipe down to measured ingredients, accumulating whatever the caller
 * asks for. Components that are themselves composites recurse; anything that
 * resolves to neither a known food nor a recipe is skipped rather than guessed.
 */
function walkComponent(
  id: string,
  scale: number,
  depth: number,
  lookup: (id: string) => Resolvable | undefined,
  visit: (food: Resolvable, scale: number) => void
): void {
  if (depth > MAX_DEPTH) return;
  // A measured ingredient is a leaf — prefer its own data over any recipe.
  const food = lookup(id);
  if (food?.micros) {
    visit(food, scale);
    return;
  }
  const recipe = FOOD_COMPOSITES[id];
  if (recipe) {
    walkRecipe(recipe, scale, depth, lookup, visit);
    return;
  }
  // A measured food with no micro profile still contributes its macros.
  if (food) visit(food, scale);
}

/**
 * Always expand the dish's own recipe, even if the dish happens to carry a
 * direct micro entry too — otherwise the macro self-check would validate the
 * dish against itself and never catch a wrong recipe.
 */
function walkRecipe(
  recipe: Recipe,
  scale: number,
  depth: number,
  lookup: (id: string) => Resolvable | undefined,
  visit: (food: Resolvable, scale: number) => void
): void {
  for (const [componentId, servings] of recipe) {
    walkComponent(componentId, scale * servings, depth + 1, lookup, visit);
  }
}

/** Sum of a recipe's component micronutrients, per one serving of the dish. */
export function deriveMicros(
  id: string,
  lookup: (id: string) => Resolvable | undefined
): Partial<MicroProfile> | undefined {
  const recipe = FOOD_COMPOSITES[id];
  if (!recipe) return undefined;
  const out: Record<string, number> = {};
  walkRecipe(recipe, 1, 0, lookup, (food, scale) => {
    if (!food.micros) return;
    for (const [k, v] of Object.entries(food.micros)) {
      if (typeof v === 'number' && isFinite(v)) out[k] = (out[k] ?? 0) + v * scale;
    }
  });
  const keys = Object.keys(out);
  if (!keys.length) return undefined;
  // Round to two decimals so totals never render a float tail.
  for (const k of keys) out[k] = Math.round(out[k] * 100) / 100;
  return out as Partial<MicroProfile>;
}

/** Macros a recipe adds up to — the self-check that keeps recipes honest. */
export function deriveMacros(
  id: string,
  lookup: (id: string) => Resolvable | undefined
): DerivedMacros | undefined {
  const recipe = FOOD_COMPOSITES[id];
  if (!recipe) return undefined;
  const out: DerivedMacros = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  walkRecipe(recipe, 1, 0, lookup, (food, scale) => {
    out.calories += food.calories * scale;
    out.protein += food.protein * scale;
    out.carbs += food.carbs * scale;
    out.fat += food.fat * scale;
    out.fiber += food.fiber * scale;
  });
  return out;
}
