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

  // ── Historical (more) ──
  'his-islamic-conquest': [
    M('breakfast', [['tn-date-deglet', 3], ['milk', 1], ['tn-pain-complet', 1]]),
    M('lunch', [['tn-pain-complet', 2], ['tn-olive-oil-tbsp', 1], ['tn-beef-lean', 1], ['greek-yogurt', 1]]),
    M('dinner', [['tn-lamb', 1.5], ['barley-cooked', 1], ['tn-date-deglet', 2]]),
  ],
  'his-chinese-warrior': [
    M('breakfast', [['white-rice', 1], ['tn-torshi', 1]]),
    M('lunch', [['white-rice', 1.5], ['tofu', 1], ['tn-spinach', 1]]),
    M('dinner', [['tn-pasta-plain', 1], ['tn-beef-lean', 1], ['broccoli', 1]]),
  ],
  'his-zulu-impi': [
    M('breakfast', [['amaranth-cooked', 1], ['greek-yogurt', 1]]),
    M('lunch', [['tn-kidney-beans', 1.5], ['tn-spinach', 1], ['corn-tortilla', 1]]),
    M('dinner', [['amaranth-cooked', 1], ['tn-beef-lean', 1], ['tn-carrot', 1]]),
  ],
  'his-egypt-warrior': [
    M('breakfast', [['tn-pain-complet', 1], ['tn-onion', 0.5], ['tn-date-deglet', 2], ['tn-fig-dried', 2]]),
    M('lunch', [['tn-fava-beans', 1.5], ['tn-pain-complet', 1]]),
    M('dinner', [['tn-sea-bream', 1], ['tn-pain-complet', 1], ['broccoli', 1]]),
  ],

  // ── Bodybuilders ──
  'hero-arnold': [
    M('breakfast', [['egg', 3], ['oats', 1.5], ['tn-milk-whole', 1], ['banana', 1]]),
    M('lunch', [['tn-beef-lean', 1.5], ['white-rice', 1.5], ['broccoli', 1]]),
    M('snack', [['whey', 1], ['milk', 1]]),
    M('dinner', [['salmon', 1.5], ['tn-potato', 1.5], ['tn-spinach', 1]]),
  ],
  'hero-ronnie': [
    M('breakfast', [['egg', 3], ['oats', 1.5], ['tn-milk-whole', 1]]),
    M('lunch', [['chicken-breast', 2], ['white-rice', 2], ['broccoli', 1]]),
    M('snack', [['whey', 1], ['banana', 1]]),
    M('dinner', [['tn-beef-lean', 1.5], ['tn-potato', 1.5], ['tn-spinach', 1]]),
  ],
  'hero-dorian': [
    M('breakfast', [['egg', 3], ['oats', 1]]),
    M('lunch', [['chicken-breast', 1.5], ['white-rice', 1.5], ['broccoli', 1]]),
    M('snack', [['whey', 1], ['apple', 1]]),
    M('dinner', [['tn-beef-lean', 1.5], ['tn-potato', 1.5], ['tn-spinach', 1]]),
  ],

  // ── Military (more) ──
  'mil-france-legion': [
    M('breakfast', [['tn-pain-complet', 1], ['cheddar', 1], ['egg', 2]]),
    M('lunch', [['pasta', 1.5], ['tuna', 1]]),
    M('snack', [['whey', 1], ['banana', 1]]),
    M('dinner', [['salmon', 1], ['tn-potato', 1.5], ['broccoli', 1]]),
  ],

  // ── Counters — one supportive snack; the rest are hydration/principle notes ──
  'ctr-nicotine': [
    M('snack', [['tn-carrot', 1], ['tn-celery', 1], ['sd-sunflower', 1]]),
    M('snack', []),
    M('snack', []),
  ],
  'ctr-urge-reset': [
    M('snack', [['greek-yogurt', 1], ['almonds', 1]]),
    M('snack', []),
    M('snack', []),
  ],
  'ctr-focus-shift': [
    M('breakfast', [['egg', 2], ['oats', 1]]),
    M('snack', []),
    M('snack', []),
  ],

  // ── Warriors of the world ──
  // Where a culture's staple isn't in FOOD_DB (cassava, quinoa, kūmara, pinole),
  // the build uses the closest nutritional equivalent that is — noted in each
  // programme's diet.notes so nothing here pretends to be the original food.
  'his-inuit-hunter': [
    M('breakfast', [['tn-mackerel', 1], ['egg', 3]]),
    M('lunch', [['tn-beef-lean', 1.5], ['tn-beef-liver', 0.5], ['tn-cabbage', 1]]),
    M('dinner', [['salmon', 1.5], ['tn-blueberry', 1], ['tn-walnuts', 1]]),
  ],
  'his-amazon-tribe': [
    M('breakfast', [['sweet-potato', 1], ['banana', 1], ['tn-papaya', 1]]),
    M('lunch', [['tn-sea-bream', 1], ['sweet-potato', 1], ['tn-spinach', 1]]),
    // Peanuts are genuinely South American in origin, and carry the fat that a
    // lean-fish-and-root day would otherwise be missing entirely.
    M('dinner', [['tn-black-eyed-peas', 1.5], ['tn-pumpkin', 1], ['tn-sweet-potato', 1], ['tn-peanuts', 1]]),
  ],
  'his-plains-nation': [
    M('breakfast', [['amaranth-cooked', 1], ['tn-blackberry', 1]]),
    M('lunch', [['tn-beef-lean', 1.5], ['tn-pumpkin', 1], ['tn-sweet-corn', 1]]),
    M('dinner', [['tn-kidney-beans', 1.5], ['corn-tortilla', 1], ['tn-pumpkin', 1]]),
  ],
  'his-raramuri': [
    M('snack', [['sd-chia', 1], ['tn-lemon', 0.5]]),
    M('lunch', [['corn-tortilla', 2], ['tn-kidney-beans', 1.5]]),
    M('dinner', [['tn-kidney-beans', 1.5], ['tn-pumpkin', 1], ['corn-tortilla', 1]]),
  ],
  'his-persian-pahlavan': [
    M('breakfast', [['tn-pain-complet', 1], ['tn-jben', 1], ['tn-walnuts', 1], ['tn-date-deglet', 3]]),
    M('lunch', [['white-rice', 1.5], ['tn-lamb', 1.5], ['greek-yogurt', 1]]),
    M('dinner', [['tn-split-peas', 1], ['tn-chicken-breast', 1], ['tn-pomegranate', 1], ['tn-spinach', 1]]),
  ],
  'his-hindu-pehlwan': [
    M('breakfast', [['tn-milk-whole', 2], ['tn-almonds', 2]]),
    M('lunch', [['tn-chickpeas', 1.5], ['ff-chapati', 2], ['greek-yogurt', 1]]),
    M('dinner', [['tn-milk-whole', 2], ['egg', 3], ['banana', 2]]),
  ],
  'his-sikh-nihang': [
    M('breakfast', [['greek-yogurt', 1], ['ff-chapati', 1], ['tn-mango', 1]]),
    M('lunch', [['tn-lentils', 1.5], ['tn-chickpeas', 1], ['white-rice', 1]]),
    M('dinner', [['lentils', 1], ['tn-spinach', 1], ['ff-chapati', 1], ['milk', 1]]),
  ],
  'his-sumo': [
    M('lunch', [['tn-chicken-thigh', 1.5], ['tofu', 1], ['egg', 2], ['tn-cabbage', 1], ['white-rice', 2]]),
    M('lunch', [['tn-mackerel', 1], ['white-rice', 1.5], ['tn-swiss-chard', 1]]),
    M('dinner', [['tn-chicken-breast', 1], ['tofu', 1], ['tn-spinach', 1], ['miso-soup', 1]]),
  ],
  'his-maori-toa': [
    M('breakfast', [['sweet-potato', 1], ['egg', 2], ['tn-kale', 1]]),
    M('lunch', [['tn-sea-bass', 1], ['tn-mussels', 1], ['sweet-potato', 1]]),
    M('dinner', [['tn-lamb', 1], ['tn-sweet-potato', 1], ['blueberries', 1]]),
  ],
  'his-maasai-moran': [
    M('breakfast', [['tn-milk-whole', 2], ['tn-laban', 1]]),
    M('lunch', [['tn-beef-lean', 1.5], ['milk', 1]]),
    M('dinner', [['tn-goat-meat', 1.5], ['tn-milk-whole', 1], ['tn-kale', 1]]),
  ],
  'his-turkish-pehlivan': [
    M('breakfast', [['egg', 3], ['tn-feta', 1], ['tn-olives', 1], ['tn-pain-complet', 1]]),
    M('lunch', [['tn-lamb', 1.5], ['tn-bulgur', 1.5], ['greek-yogurt', 1]]),
    M('dinner', [['tn-white-beans', 1.5], ['white-rice', 1], ['tn-slata-tounsiya', 1], ['tn-olive-oil-tbsp', 1]]),
  ],
  'his-celtic-highland': [
    M('breakfast', [['oats', 2], ['milk', 1.5]]),
    M('lunch', [['tn-beef-lean', 1.5], ['barley-cooked', 1.5], ['tn-turnip', 1]]),
    M('dinner', [['tn-mackerel', 1], ['tn-potato', 1.5], ['tn-kale', 1], ['cheddar', 1]]),
  ],
  'his-korean-hwarang': [
    M('breakfast', [['white-rice', 1], ['miso-soup', 1], ['tn-torshi', 1], ['egg', 1]]),
    M('lunch', [['white-rice', 1.5], ['tn-mackerel', 1], ['tn-spinach', 1]]),
    M('dinner', [['tofu', 1.5], ['white-rice', 1], ['tn-cabbage', 1], ['tn-torshi', 1]]),
  ],
  'his-inca-chasqui': [
    M('breakfast', [['amaranth-cooked', 1.5], ['corn-tortilla', 1]]),
    M('lunch', [['tn-potato', 2], ['tn-kidney-beans', 1], ['tn-swiss-chard', 1]]),
    M('dinner', [['amaranth-cooked', 1], ['tn-white-beans', 1], ['tn-beef-lean', 0.5]]),
  ],
  'his-filipino-kali': [
    M('breakfast', [['white-rice', 1], ['egg', 2], ['tn-anchovy', 1]]),
    M('lunch', [['tn-chicken-thigh', 1.5], ['white-rice', 1.5], ['tn-green-beans', 1]]),
    M('dinner', [['tn-sea-bream', 1], ['white-rice', 1], ['tn-swiss-chard', 1]]),
  ],
  'his-aboriginal-hunter': [
    M('breakfast', [['whole-wheat-bread', 2], ['tn-guava', 1], ['sd-sunflower', 1]]),
    M('lunch', [['tn-beef-lean', 1.5], ['tn-sweet-potato', 1.5]]),
    M('dinner', [['tn-sea-bass', 1], ['tn-kale', 1], ['sweet-potato', 1]]),
  ],
  'his-muay-boran': [
    M('breakfast', [['white-rice', 1.5], ['egg', 3], ['tn-mango', 1]]),
    M('lunch', [['tn-chicken-breast', 1.5], ['white-rice', 1.5], ['tn-papaya', 1]]),
    M('dinner', [['tn-sea-bream', 1], ['white-rice', 1.5], ['tn-green-beans', 1]]),
  ],
  // ── Elite sport ──
  'ath-footballer': [
    M('breakfast', [['oats', 1.5], ['egg', 2], ['banana', 1]]),
    M('lunch', [['white-rice', 1.5], ['chicken-breast', 1.5], ['tn-slata-tounsiya', 1]]),
    M('snack', [['whey', 1], ['banana', 1]]),
    M('dinner', [['salmon', 1], ['tn-potato', 1.5], ['broccoli', 1]]),
  ],
  'ath-basketballer': [
    M('breakfast', [['oats', 2], ['egg', 3], ['tn-milk-whole', 1], ['orange', 1]]),
    M('lunch', [['white-rice', 2], ['tn-chicken-breast', 1.5], ['tn-green-beans', 1]]),
    M('snack', [['whey', 1], ['tn-date-deglet', 3]]),
    M('dinner', [['salmon', 1.5], ['tn-potato', 1.5], ['tn-spinach', 1]]),
  ],
  'ath-boxer': [
    M('breakfast', [['banana', 1]]),
    M('breakfast', [['egg', 3], ['oats', 1]]),
    M('lunch', [['white-rice', 1], ['tn-chicken-breast', 1.5], ['broccoli', 1]]),
    M('dinner', [['tn-sea-bream', 1], ['tn-slata-tounsiya', 1], ['tn-sweet-potato', 0.7]]),
  ],
  'ath-sprinter': [
    M('breakfast', [['egg', 3], ['oats', 1], ['blueberries', 1]]),
    M('lunch', [['white-rice', 1.2], ['chicken-breast', 1.5], ['tn-broccoli', 1]]),
    M('snack', [['whey', 1], ['apple', 1]]),
    M('dinner', [['tn-beef-lean', 1.5], ['tn-potato', 1.2], ['tn-swiss-chard', 1]]),
  ],
  'ath-marathoner': [
    M('breakfast', [['banana', 1], ['tn-honey-tbsp', 1]]),
    M('breakfast', [['oats', 2], ['egg', 2], ['df-raisins', 1]]),
    M('lunch', [['pasta', 2], ['tn-chicken-breast', 1], ['tn-tomato', 1]]),
    M('dinner', [['tn-beef-lean', 1], ['white-rice', 2], ['tn-spinach', 1]]),
  ],
  'ath-swimmer': [
    M('snack', [['banana', 1], ['tn-honey-tbsp', 1]]),
    M('breakfast', [['oats', 2], ['egg', 3], ['tn-milk-whole', 1], ['orange', 1]]),
    M('lunch', [['pasta', 2], ['chicken-breast', 1.5], ['broccoli', 1]]),
    M('dinner', [['salmon', 1.5], ['tn-potato', 1.5], ['tn-kale', 1]]),
  ],
  'ath-cyclist': [
    M('breakfast', [['oats', 2], ['banana', 1], ['tn-honey-tbsp', 1]]),
    M('snack', [['tn-date-deglet', 4], ['df-raisins', 1]]),
    M('snack', [['whey', 1], ['white-rice', 1]]),
    M('dinner', [['tn-potato', 2], ['tn-sea-bass', 1], ['tn-swiss-chard', 1]]),
  ],
  'ath-tennis': [
    M('lunch', [['pasta', 1.5], ['tn-chicken-breast', 1.2], ['tn-tomato', 1]]),
    M('snack', [['banana', 2], ['tn-date-deglet', 2]]),
    M('snack', [['whey', 1], ['tn-milk-whole', 0.5]]),
    M('dinner', [['tn-turkey-breast', 1.5], ['white-rice', 1.5], ['tn-slata-tounsiya', 1]]),
  ],

  'hero-luchador': [
    M('breakfast', [['egg', 3], ['corn-tortilla', 1], ['tn-orange', 1]]),
    M('lunch', [['chicken-breast', 1.5], ['tn-kidney-beans', 1], ['white-rice', 1], ['tn-slata-tounsiya', 1]]),
    M('snack', [['whey', 1], ['banana', 1]]),
    M('dinner', [['tn-beef-lean', 1.5], ['tn-broccoli', 1], ['tn-sweet-potato', 0.5]]),
  ],
};

export function dietBuildFor(programKey: string): MealBuild[] | undefined {
  return SPECIAL_DIET_BUILDS[programKey];
}
