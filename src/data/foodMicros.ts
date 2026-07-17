import type { MicroProfile } from '@/lib/micros';

/**
 * Curated micronutrient data, keyed by food id, expressed **per the food's
 * stated serving** (so it scales with `quantity` at log time, just like macros).
 *
 * Only nutritionally significant whole foods are covered — the contributors that
 * actually move the needle. Composite/fast-food dishes are intentionally left
 * out rather than guessed, so nothing here is fabricated. Values are rounded
 * USDA/CIQUAL figures.
 *
 * Keys omitted from a profile simply don't contribute — sums treat them as 0.
 */
type M = Partial<MicroProfile>;

export const FOOD_MICROS: Record<string, M> = {
  // ── Eggs, dairy ────────────────────────────────────────────────────────────
  egg: { vitaminA_ug: 80, vitaminD_ug: 1.1, vitaminB12_ug: 0.6, riboflavin_mg: 0.23, folate_ug: 22, selenium_ug: 15, phosphorus_mg: 99, iodine_ug: 24 },
  'greek-yogurt': { calcium_mg: 187, vitaminB12_ug: 0.8, riboflavin_mg: 0.3, phosphorus_mg: 230, zinc_mg: 1, iodine_ug: 60 },
  milk: { calcium_mg: 293, vitaminB12_ug: 1.1, vitaminD_ug: 2.6, riboflavin_mg: 0.45, phosphorus_mg: 224, potassium_mg: 342, iodine_ug: 67 },
  cheddar: { calcium_mg: 200, vitaminA_ug: 75, vitaminB12_ug: 0.3, phosphorus_mg: 145, zinc_mg: 0.9, sodium_mg: 180 },
  'cottage-cheese': { calcium_mg: 83, vitaminB12_ug: 0.7, phosphorus_mg: 170, selenium_ug: 10, sodium_mg: 350, riboflavin_mg: 0.2 },
  'tn-milk-whole': { calcium_mg: 300, vitaminB12_ug: 1.1, vitaminD_ug: 2.5, riboflavin_mg: 0.45, phosphorus_mg: 230, potassium_mg: 350, iodine_ug: 67 },
  'tn-jben': { calcium_mg: 100, phosphorus_mg: 90, vitaminA_ug: 40, sodium_mg: 180 },
  'tn-feta': { calcium_mg: 148, vitaminB12_ug: 0.5, phosphorus_mg: 100, sodium_mg: 320, riboflavin_mg: 0.2 },

  // ── Meat, poultry, offal ───────────────────────────────────────────────────
  'chicken-breast': { niacin_mg: 13.7, vitaminB6_mg: 0.9, phosphorus_mg: 210, selenium_ug: 24, potassium_mg: 256, zinc_mg: 1 },
  'tn-chicken-breast': { niacin_mg: 13.7, vitaminB6_mg: 0.9, phosphorus_mg: 210, selenium_ug: 24, potassium_mg: 256, zinc_mg: 1 },
  'ground-beef': { vitaminB12_ug: 2.6, zinc_mg: 6.3, iron_mg: 2.7, niacin_mg: 5.4, selenium_ug: 17, phosphorus_mg: 200 },
  'tn-beef-lean': { vitaminB12_ug: 2.6, zinc_mg: 6, iron_mg: 2.6, niacin_mg: 5.4, selenium_ug: 17, phosphorus_mg: 200 },
  'tn-lamb': { vitaminB12_ug: 2.6, zinc_mg: 4.5, iron_mg: 1.9, niacin_mg: 6, selenium_ug: 9, phosphorus_mg: 190 },
  'tn-beef-liver': { vitaminA_ug: 4970, vitaminB12_ug: 59, riboflavin_mg: 2.8, folate_ug: 253, copper_mg: 9.8, iron_mg: 4.9, zinc_mg: 4, selenium_ug: 33, niacin_mg: 13 },
  'tn-lamb-liver': { vitaminA_ug: 7390, vitaminB12_ug: 85, riboflavin_mg: 3.6, folate_ug: 230, copper_mg: 7, iron_mg: 7.5, zinc_mg: 4, selenium_ug: 82 },
  'tn-turkey-breast': { niacin_mg: 11, vitaminB6_mg: 0.8, phosphorus_mg: 200, selenium_ug: 27, zinc_mg: 1.5 },

  // ── Fish & seafood ─────────────────────────────────────────────────────────
  salmon: { vitaminD_ug: 11, vitaminB12_ug: 3.2, omega3_mg: 2200, selenium_ug: 24, niacin_mg: 8.5, potassium_mg: 363 },
  tuna: { vitaminD_ug: 2, vitaminB12_ug: 2.5, selenium_ug: 90, niacin_mg: 18, omega3_mg: 300, phosphorus_mg: 200 },
  'tn-tuna-fresh': { vitaminD_ug: 5, vitaminB12_ug: 9, selenium_ug: 90, niacin_mg: 18, omega3_mg: 1300, phosphorus_mg: 250 },
  'tn-sardine': { vitaminD_ug: 5, vitaminB12_ug: 8.9, calcium_mg: 382, omega3_mg: 1480, selenium_ug: 52, phosphorus_mg: 490, iodine_ug: 35 },
  'tn-mackerel': { vitaminD_ug: 16, vitaminB12_ug: 19, omega3_mg: 2600, selenium_ug: 44, niacin_mg: 9, phosphorus_mg: 217 },
  'tn-shrimp': { vitaminB12_ug: 1.4, selenium_ug: 40, iodine_ug: 35, phosphorus_mg: 200, zinc_mg: 1.3, copper_mg: 0.3 },

  // ── Legumes ────────────────────────────────────────────────────────────────
  lentils: { folate_ug: 358, iron_mg: 6.6, magnesium_mg: 71, potassium_mg: 731, zinc_mg: 2.5, manganese_mg: 1, copper_mg: 0.5, phosphorus_mg: 356 },
  'tn-lentils': { folate_ug: 358, iron_mg: 6.6, magnesium_mg: 71, potassium_mg: 731, zinc_mg: 2.5, manganese_mg: 1, phosphorus_mg: 356 },
  'tn-chickpeas': { folate_ug: 172, iron_mg: 4.7, magnesium_mg: 79, potassium_mg: 477, zinc_mg: 2.5, manganese_mg: 1.7, copper_mg: 0.6, phosphorus_mg: 252 },
  'tn-white-beans': { folate_ug: 145, iron_mg: 3.7, magnesium_mg: 80, potassium_mg: 561, zinc_mg: 1.9, phosphorus_mg: 170 },
  'tn-fava-beans': { folate_ug: 155, iron_mg: 2.5, magnesium_mg: 63, potassium_mg: 456, manganese_mg: 0.7 },
  tofu: { calcium_mg: 350, iron_mg: 2.7, magnesium_mg: 58, manganese_mg: 1.2, selenium_ug: 12, phosphorus_mg: 120, zinc_mg: 1.6 },

  // ── Grains & seeds ─────────────────────────────────────────────────────────
  oats: { magnesium_mg: 55, phosphorus_mg: 166, manganese_mg: 1.9, thiamin_mg: 0.3, zinc_mg: 1.6, iron_mg: 1.9 },
  'tn-oats-raw': { magnesium_mg: 55, phosphorus_mg: 166, manganese_mg: 1.9, thiamin_mg: 0.3, zinc_mg: 1.6, iron_mg: 1.9 },
  'brown-rice': { magnesium_mg: 84, manganese_mg: 1.8, selenium_ug: 19, niacin_mg: 5.2, phosphorus_mg: 208, thiamin_mg: 0.2 },
  'whole-wheat-bread': { magnesium_mg: 24, manganese_mg: 1, selenium_ug: 12, niacin_mg: 2, folate_ug: 14, iron_mg: 1 },
  'sd-chia': { calcium_mg: 179, magnesium_mg: 95, phosphorus_mg: 244, omega3_mg: 4900, manganese_mg: 0.7, iron_mg: 2.2, zinc_mg: 1.3 },
  'sd-pumpkin': { magnesium_mg: 156, zinc_mg: 2.2, iron_mg: 2.5, manganese_mg: 1.3, phosphorus_mg: 333, copper_mg: 0.4 },
  'sd-flax': { omega3_mg: 2280, magnesium_mg: 40, manganese_mg: 0.25, thiamin_mg: 0.16, phosphorus_mg: 66 },
  'sd-sunflower': { vitaminE_mg: 10, magnesium_mg: 91, selenium_ug: 15, copper_mg: 0.5, phosphorus_mg: 185, folate_ug: 67 },

  // ── Nuts ───────────────────────────────────────────────────────────────────
  almonds: { vitaminE_mg: 7.3, magnesium_mg: 76, calcium_mg: 76, manganese_mg: 0.6, riboflavin_mg: 0.3, copper_mg: 0.3, phosphorus_mg: 137 },
  'tn-almonds': { vitaminE_mg: 7.3, magnesium_mg: 76, calcium_mg: 76, manganese_mg: 0.6, riboflavin_mg: 0.3, copper_mg: 0.3, phosphorus_mg: 137 },
  'tn-walnuts': { omega3_mg: 2570, copper_mg: 0.45, manganese_mg: 1, magnesium_mg: 45, phosphorus_mg: 98 },
  'tn-pistachios': { vitaminB6_mg: 0.5, potassium_mg: 285, copper_mg: 0.4, manganese_mg: 0.3, phosphorus_mg: 137 },
  'peanut-butter': { niacin_mg: 4.2, vitaminE_mg: 2.9, magnesium_mg: 54, manganese_mg: 0.5, phosphorus_mg: 107, folate_ug: 24 },

  // ── Vegetables ─────────────────────────────────────────────────────────────
  broccoli: { vitaminC_mg: 81, vitaminK_ug: 92, folate_ug: 84, vitaminA_ug: 47, potassium_mg: 293, manganese_mg: 0.3 },
  'tn-broccoli': { vitaminC_mg: 81, vitaminK_ug: 92, folate_ug: 84, vitaminA_ug: 47, potassium_mg: 293, manganese_mg: 0.3 },
  'tn-spinach': { vitaminK_ug: 483, vitaminA_ug: 469, folate_ug: 194, iron_mg: 2.7, magnesium_mg: 79, vitaminC_mg: 28, potassium_mg: 558, manganese_mg: 0.9 },
  'tn-swiss-chard': { vitaminK_ug: 830, vitaminA_ug: 306, magnesium_mg: 81, potassium_mg: 379, vitaminC_mg: 30, iron_mg: 1.8 },
  'tn-kale': { vitaminK_ug: 390, vitaminC_mg: 93, vitaminA_ug: 241, calcium_mg: 150, manganese_mg: 0.7, potassium_mg: 491 },
  'sweet-potato': { vitaminA_ug: 709, vitaminC_mg: 2.4, potassium_mg: 337, manganese_mg: 0.3, vitaminB6_mg: 0.2 },
  'tn-sweet-potato': { vitaminA_ug: 709, vitaminC_mg: 2.4, potassium_mg: 337, manganese_mg: 0.3, vitaminB6_mg: 0.2 },
  'tn-carrot': { vitaminA_ug: 835, vitaminK_ug: 13, potassium_mg: 320, vitaminC_mg: 6 },
  'tn-tomato': { vitaminC_mg: 14, vitaminA_ug: 42, potassium_mg: 237, vitaminK_ug: 8, folate_ug: 15 },
  'tn-bell-pepper': { vitaminC_mg: 128, vitaminA_ug: 157, vitaminB6_mg: 0.3, folate_ug: 46 },
  'tn-eggplant': { manganese_mg: 0.2, potassium_mg: 229, folate_ug: 22, vitaminK_ug: 3.5 },
  'tn-potato': { vitaminC_mg: 20, potassium_mg: 425, vitaminB6_mg: 0.3, magnesium_mg: 23 },
  'tn-mloukhia': { vitaminA_ug: 278, vitaminC_mg: 37, calcium_mg: 208, iron_mg: 4.8, potassium_mg: 559, folate_ug: 123, vitaminK_ug: 120 },
  'tn-olives': { iron_mg: 1, vitaminE_mg: 1, sodium_mg: 220, copper_mg: 0.1 },

  // ── Fruits ─────────────────────────────────────────────────────────────────
  banana: { vitaminB6_mg: 0.5, vitaminC_mg: 10, potassium_mg: 422, manganese_mg: 0.3, magnesium_mg: 32 },
  'tn-banana': { vitaminB6_mg: 0.5, vitaminC_mg: 10, potassium_mg: 422, manganese_mg: 0.3, magnesium_mg: 32 },
  orange: { vitaminC_mg: 70, folate_ug: 39, potassium_mg: 237, thiamin_mg: 0.1, calcium_mg: 52 },
  'tn-orange': { vitaminC_mg: 70, folate_ug: 39, potassium_mg: 237, thiamin_mg: 0.1, calcium_mg: 52 },
  apple: { vitaminC_mg: 8, potassium_mg: 195, vitaminK_ug: 4 },
  blueberries: { vitaminC_mg: 14, vitaminK_ug: 29, manganese_mg: 0.5, vitaminE_mg: 0.8 },
  avocado: { vitaminK_ug: 21, folate_ug: 81, potassium_mg: 485, vitaminE_mg: 2.1, vitaminC_mg: 10, magnesium_mg: 29 },
  'tn-avocado': { vitaminK_ug: 21, folate_ug: 81, potassium_mg: 485, vitaminE_mg: 2.1, vitaminC_mg: 10, magnesium_mg: 29 },
  'tn-date-deglet': { potassium_mg: 267, magnesium_mg: 22, copper_mg: 0.1, manganese_mg: 0.2, vitaminB6_mg: 0.1 },
  'tn-fig-dried': { calcium_mg: 68, potassium_mg: 273, magnesium_mg: 27, iron_mg: 0.8, manganese_mg: 0.2 },
  'tn-pomegranate': { vitaminC_mg: 10, vitaminK_ug: 16, potassium_mg: 236, folate_ug: 38 },
  'tn-strawberry': { vitaminC_mg: 89, manganese_mg: 0.6, folate_ug: 36 },
  'tn-kiwi': { vitaminC_mg: 64, vitaminK_ug: 27, potassium_mg: 215, vitaminE_mg: 1 },

  // ── Fats ───────────────────────────────────────────────────────────────────
  'olive-oil': { vitaminE_mg: 1.9, vitaminK_ug: 8 },
  'tn-olive-oil-tbsp': { vitaminE_mg: 1.9, vitaminK_ug: 8 },

  // ── Chocolate / cocoa ──────────────────────────────────────────────────────
  'ch-dark-85': { iron_mg: 3.3, magnesium_mg: 65, copper_mg: 0.5, manganese_mg: 0.6, potassium_mg: 200 },
  'ch-cocoa': { magnesium_mg: 27, iron_mg: 0.7, copper_mg: 0.2, manganese_mg: 0.2 },
};
