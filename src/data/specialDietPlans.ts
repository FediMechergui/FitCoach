import type { MealType } from '@/db/schema';

/**
 * Concrete food builds for every Special Programme meal, so the prose diet in
 * specialPrograms.ts becomes something with real macros and micros that can be
 * logged straight into the Nutrition diary.
 *
 * Each build references existing FOOD_DB ids by `id` with a `servings` multiple,
 * so nothing here invents nutrition — the numbers come from the food database
 * (and, for foods that carry it, the micronutrient layer). Builds are keyed by
 * programme key and aligned index-for-index with that programme's
 * `diet.sampleDay`; a hydration-only meal (plain water/coffee) has empty
 * `components` and simply isn't logged.
 *
 * ⚠️ Every `id` must exist in FOOD_DB and the array must line up with sampleDay
 * (both asserted in scripts/verify-engines.ts).
 */

export interface MealComponent {
  id: string;
  servings: number;
}

export interface MealBuild {
  /** which diary meal this logs into */
  mealType: MealType;
  components: MealComponent[];
}

const M = (mealType: MealType, components: Array<[string, number]>): MealBuild => ({
  mealType,
  components: components.map(([id, servings]) => ({ id, servings })),
});

export const SPECIAL_DIET_BUILDS: Record<string, MealBuild[]> = {
  // ── Military ──
  'mil-army-acft': [
    M('breakfast', [['oats', 1.5], ['milk', 1], ['egg', 2], ['banana', 1]]),
    M('lunch', [['chicken-breast', 1.5], ['white-rice', 1.5], ['broccoli', 1]]),
    M('snack', [['whey', 1], ['banana', 1]]),
    M('dinner', [['salmon', 1], ['tn-potato', 1.5], ['tn-slata-tounsiya', 1]]),
  ],
  'mil-seal-prep': [
    M('breakfast', [['banana', 1]]),
    M('breakfast', [['oats', 2], ['egg', 3], ['orange', 1]]),
    M('lunch', [['white-rice', 2], ['chicken-breast', 1.5], ['broccoli', 1]]),
    M('snack', [['milk', 1], ['almonds', 1], ['apple', 1]]),
    M('dinner', [['tn-mackerel', 1], ['ground-beef', 1], ['tn-potato', 1.5], ['tn-spinach', 1]]),
  ],
  'mil-spetsnaz': [
    M('breakfast', [['buckwheat-cooked', 1.5], ['egg', 2]]),
    M('lunch', [['tn-white-beans', 1], ['tn-pain-complet', 2], ['tn-beef-lean', 1]]),
    M('snack', [['cottage-cheese', 1], ['tn-honey-tbsp', 1]]),
    M('dinner', [['tn-mackerel', 1], ['tn-potato', 1.5], ['tn-torshi', 1]]),
  ],
  'mil-commando': [
    M('breakfast', [['oats', 1.5], ['tn-honey-tbsp', 1], ['tn-walnuts', 1], ['egg', 2]]),
    M('snack', [['tn-date-deglet', 3], ['almonds', 1]]),
    M('snack', [['milk', 1], ['banana', 1]]),
    M('dinner', [['tn-beef-lean', 1.5], ['pasta', 1.5], ['broccoli', 1]]),
  ],

  // ── Historical ──
  'his-roman-legion': [
    M('breakfast', [['oats', 1.5], ['tn-olive-oil-tbsp', 1], ['tn-pain-complet', 1]]),
    M('lunch', [['tn-pain-complet', 2], ['tn-feta', 1], ['tn-olives', 1]]),
    M('dinner', [['tn-lentils', 1], ['tn-white-beans', 1], ['tn-pain-complet', 1]]),
  ],
  'his-spartan-agoge': [
    M('breakfast', [['barley-cooked', 1.5], ['tn-fig-dried', 3], ['tn-feta', 1]]),
    M('lunch', [['barley-cooked', 1], ['tn-olives', 1], ['tn-lentils', 1]]),
    M('dinner', [['tn-lamb', 1], ['tn-white-beans', 1], ['tn-pain-complet', 1]]),
  ],
  'his-shaolin': [
    M('breakfast', [['white-rice', 1], ['tn-peanuts', 1]]),
    M('lunch', [['white-rice', 1.5], ['tofu', 1.5], ['broccoli', 1], ['tn-white-beans', 1]]),
    M('dinner', [['tn-pasta-plain', 1], ['tn-spinach', 1], ['tofu', 1]]),
  ],
  'his-dagestan': [
    M('breakfast', [['cottage-cheese', 1], ['egg', 2], ['tn-pain-complet', 1], ['tn-honey-tbsp', 1]]),
    M('lunch', [['tn-lamb', 1.5], ['pasta', 1]]),
    M('snack', [['dried-apricot', 1], ['tn-walnuts', 1], ['tn-beef-lean', 0.5]]),
    M('dinner', [['tn-lamb', 1.5], ['tn-slata-tounsiya', 1]]),
  ],
  'his-aztec': [
    M('breakfast', [['amaranth-cooked', 1], ['corn-tortilla', 1]]),
    M('lunch', [['tn-kidney-beans', 1.5], ['tn-pumpkin', 1], ['corn-tortilla', 1]]),
    M('snack', [['sd-chia', 1], ['amaranth-cooked', 1]]),
    M('dinner', [['corn-tortilla', 1], ['tn-black-eyed-peas', 1], ['tn-tomato', 1], ['tn-sardine', 1]]),
  ],
  'his-viking': [
    M('breakfast', [['greek-yogurt', 1], ['blueberries', 1], ['tn-pain-complet', 1]]),
    M('lunch', [['salmon', 1], ['barley-cooked', 1], ['tn-carrot', 1]]),
    M('dinner', [['tn-beef-lean', 1.5], ['barley-cooked', 1], ['tn-swiss-chard', 1], ['cheddar', 1]]),
  ],
  'his-samurai': [
    M('breakfast', [['white-rice', 1], ['miso-soup', 1], ['tn-mackerel', 1], ['tofu', 0.5]]),
    M('lunch', [['white-rice', 1], ['tofu', 1], ['tn-torshi', 1]]),
    M('dinner', [['tn-spinach', 1], ['tn-sea-bream', 1], ['white-rice', 1]]),
  ],
  'his-mongol': [
    M('breakfast', [['milk', 1], ['cottage-cheese', 1]]),
    M('snack', [['tn-beef-lean', 1.5]]),
    M('dinner', [['tn-mutton', 1.5], ['tn-jben', 1], ['milk', 1]]),
  ],
  'his-gladiator': [
    M('breakfast', [['barley-cooked', 1.5], ['tn-white-beans', 1]]),
    M('lunch', [['tn-lentils', 1], ['tn-white-beans', 1], ['barley-cooked', 1], ['tn-fig-dried', 2]]),
    M('snack', [['milk', 1], ['tn-jben', 1]]),
    M('dinner', [['barley-cooked', 1.5], ['tn-chickpeas', 1], ['tn-beef-lean', 0.5]]),
  ],
  'his-ninja': [
    M('breakfast', [['white-rice', 1], ['miso-soup', 1]]),
    M('snack', [['white-rice', 1], ['tn-sesame', 1]]),
    M('dinner', [['white-rice', 1], ['tofu', 1], ['broccoli', 1]]),
  ],

  // ── Superhero & Screen Legends ──
  'hero-saitama': [
    M('breakfast', [['banana', 1]]),
    M('breakfast', [['white-rice', 1], ['egg', 2], ['banana', 1]]),
    M('lunch', [['chicken-breast', 1.5], ['white-rice', 1.5], ['broccoli', 1]]),
    M('dinner', [['tn-beef-lean', 1], ['white-rice', 1], ['tn-slata-tounsiya', 1]]),
  ],
  'hero-batman': [
    M('breakfast', [['egg', 3], ['oats', 1], ['blueberries', 1]]),
    M('lunch', [['chicken-breast', 1.5], ['white-rice', 1.5], ['broccoli', 1]]),
    M('snack', [['whey', 1], ['apple', 1]]),
    M('dinner', [['tn-beef-lean', 1.5], ['tn-potato', 1.5], ['tn-spinach', 1]]),
  ],
  'hero-bruce-lee': [
    M('breakfast', [['whey', 1], ['orange', 1]]),
    M('lunch', [['white-rice', 1], ['broccoli', 1], ['chicken-breast', 1.5]]),
    M('snack', [['greek-yogurt', 1], ['almonds', 1]]),
    M('dinner', [['tn-spinach', 1], ['salmon', 1], ['broccoli', 1]]),
  ],
  'hero-rocky': [
    M('breakfast', [['egg', 4], ['oats', 1]]),
    M('lunch', [['tn-beef-lean', 1.5], ['white-rice', 1.5], ['broccoli', 1]]),
    M('snack', [['cottage-cheese', 1], ['milk', 1]]),
    M('dinner', [['tn-mackerel', 1], ['pasta', 1.5], ['broccoli', 1]]),
  ],
  'hero-captain': [
    M('breakfast', [['egg', 3], ['oats', 1.5], ['tn-milk-whole', 1], ['banana', 1]]),
    M('lunch', [['chicken-breast', 2], ['white-rice', 2], ['broccoli', 1]]),
    M('snack', [['whey', 1], ['banana', 1]]),
    M('dinner', [['salmon', 1.5], ['tn-potato', 1.5], ['tn-spinach', 1], ['cottage-cheese', 1]]),
  ],

  // ── Military / Service (more) ──
  'mil-firefighter': [
    M('breakfast', [['egg', 2], ['oats', 1.5]]),
    M('lunch', [['chicken-breast', 1.5], ['white-rice', 1.5], ['broccoli', 1]]),
    M('snack', [['almonds', 1], ['apple', 1], ['greek-yogurt', 1]]),
    M('dinner', [['salmon', 1], ['tn-potato', 1.5], ['tn-slata-tounsiya', 1]]),
  ],

  // ── Lifestyle ──
  'life-prison': [
    M('breakfast', [['oats', 1.5], ['milk', 1], ['peanut-butter', 1]]),
    M('lunch', [['white-rice', 1.5], ['tn-kidney-beans', 1.5], ['tuna', 1]]),
    M('snack', [['egg', 3]]),
    M('dinner', [['white-rice', 1.5], ['tn-white-beans', 1.5], ['broccoli', 1]]),
  ],
  'life-office': [
    M('breakfast', [['greek-yogurt', 1], ['blueberries', 1], ['egg', 1]]),
    M('lunch', [['chicken-breast', 1.5], ['tn-slata-tounsiya', 1]]),
    M('snack', [['almonds', 1], ['apple', 1]]),
    M('dinner', [['salmon', 1], ['tn-potato', 1], ['broccoli', 1]]),
  ],
  'life-morning': [
    M('breakfast', []),
    M('breakfast', [['egg', 2], ['oats', 1], ['banana', 1]]),
    M('snack', []),
  ],
  'life-travel': [
    M('breakfast', [['egg', 2], ['orange', 1]]),
    M('lunch', [['chicken-breast', 1.5], ['tn-slata-tounsiya', 1]]),
    M('snack', [['almonds', 1], ['banana', 1]]),
    M('dinner', [['salmon', 1], ['tn-potato', 1], ['broccoli', 1]]),
  ],
};

export function dietBuildFor(programKey: string): MealBuild[] | undefined {
  return SPECIAL_DIET_BUILDS[programKey];
}
