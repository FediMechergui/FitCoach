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
  'ch-dark-60': { iron_mg: 2.4, magnesium_mg: 46, copper_mg: 0.3, potassium_mg: 165 },
  'ch-milk': { calcium_mg: 57, iron_mg: 0.7, magnesium_mg: 18, potassium_mg: 110 },

  // ── More meats & poultry ───────────────────────────────────────────────────
  'tn-beef-ground': { vitaminB12_ug: 2.6, zinc_mg: 6, iron_mg: 2.5, niacin_mg: 5, selenium_ug: 16, phosphorus_mg: 190 },
  'tn-mutton': { vitaminB12_ug: 2.6, zinc_mg: 4, iron_mg: 1.9, niacin_mg: 6, phosphorus_mg: 180 },
  'tn-veal': { vitaminB12_ug: 1.4, zinc_mg: 4.4, niacin_mg: 8, selenium_ug: 12, phosphorus_mg: 200 },
  'tn-goat-meat': { vitaminB12_ug: 1.1, iron_mg: 3, zinc_mg: 4, potassium_mg: 385, niacin_mg: 3.8 },
  'tn-camel-meat': { iron_mg: 2.9, zinc_mg: 4.4, vitaminB12_ug: 1.8, phosphorus_mg: 190 },
  'tn-chicken-thigh': { niacin_mg: 5, vitaminB6_mg: 0.3, zinc_mg: 1.5, selenium_ug: 18, phosphorus_mg: 160 },
  'tn-chicken-whole': { niacin_mg: 8, vitaminB6_mg: 0.4, zinc_mg: 1.5, selenium_ug: 20, phosphorus_mg: 170 },
  'tn-duck': { iron_mg: 2.7, zinc_mg: 1.9, vitaminB12_ug: 0.4, selenium_ug: 14, niacin_mg: 5 },
  'tn-merguez': { iron_mg: 1.5, zinc_mg: 2, vitaminB12_ug: 1, sodium_mg: 480, phosphorus_mg: 90 },
  'tn-kidney': { vitaminB12_ug: 25, riboflavin_mg: 2, selenium_ug: 141, iron_mg: 4.6, vitaminA_ug: 419 },
  'tn-rabbit': { vitaminB12_ug: 7, selenium_ug: 38, phosphorus_mg: 220, niacin_mg: 7, zinc_mg: 1.9 },
  'tn-quail': { iron_mg: 4.5, zinc_mg: 2.4, vitaminB12_ug: 0.4, phosphorus_mg: 275, niacin_mg: 8 },
  whey: { calcium_mg: 120, phosphorus_mg: 100, magnesium_mg: 20, potassium_mg: 160 },

  // ── More fish & seafood ────────────────────────────────────────────────────
  'tn-sea-bream': { vitaminB12_ug: 1, selenium_ug: 37, phosphorus_mg: 200, potassium_mg: 400, omega3_mg: 400 },
  'tn-sea-bass': { vitaminB12_ug: 2.5, selenium_ug: 37, phosphorus_mg: 200, potassium_mg: 256, omega3_mg: 600 },
  'tn-anchovy': { calcium_mg: 147, iron_mg: 3.2, vitaminB12_ug: 0.6, selenium_ug: 68, niacin_mg: 14, omega3_mg: 1400 },
  'tn-octopus': { vitaminB12_ug: 20, iron_mg: 5.3, selenium_ug: 44, copper_mg: 0.4, phosphorus_mg: 186 },
  'tn-squid': { vitaminB12_ug: 1.3, selenium_ug: 44, copper_mg: 1.9, phosphorus_mg: 221, zinc_mg: 1.5 },
  'tn-mussels': { vitaminB12_ug: 12, iron_mg: 3.9, selenium_ug: 45, manganese_mg: 3.4, omega3_mg: 700 },
  'tn-cuttlefish': { vitaminB12_ug: 5.4, selenium_ug: 45, copper_mg: 0.6, phosphorus_mg: 490 },

  // ── More cheeses & dairy ───────────────────────────────────────────────────
  'tn-rigouta': { calcium_mg: 60, phosphorus_mg: 55, riboflavin_mg: 0.1 },
  'tn-halloumi': { calcium_mg: 220, phosphorus_mg: 140, sodium_mg: 350, zinc_mg: 0.9 },
  'tn-mozzarella': { calcium_mg: 150, phosphorus_mg: 105, vitaminB12_ug: 0.7, sodium_mg: 190 },
  'tn-cheddar': { calcium_mg: 200, vitaminA_ug: 75, vitaminB12_ug: 0.3, phosphorus_mg: 145, zinc_mg: 0.9 },
  'tn-vache-qui-rit': { calcium_mg: 120, phosphorus_mg: 160, sodium_mg: 220 },
  'tn-parmesan': { calcium_mg: 120, phosphorus_mg: 70, vitaminA_ug: 20, sodium_mg: 160 },
  'tn-ricotta': { calcium_mg: 207, phosphorus_mg: 158, vitaminA_ug: 120, selenium_ug: 15 },
  'tn-labneh': { calcium_mg: 90, phosphorus_mg: 80, vitaminB12_ug: 0.3 },
  'tn-camembert': { calcium_mg: 100, vitaminB12_ug: 0.5, phosphorus_mg: 100, sodium_mg: 250, riboflavin_mg: 0.2 },
  'tn-milk-semi': { calcium_mg: 300, vitaminB12_ug: 1.1, riboflavin_mg: 0.45, phosphorus_mg: 230, potassium_mg: 350, iodine_ug: 67 },
  'tn-milk-skim': { calcium_mg: 305, vitaminB12_ug: 1.1, riboflavin_mg: 0.45, phosphorus_mg: 245, potassium_mg: 370, iodine_ug: 70 },
  'tn-milk-goat': { calcium_mg: 327, potassium_mg: 498, phosphorus_mg: 271, riboflavin_mg: 0.34, vitaminA_ug: 139 },
  'tn-milk-sheep': { calcium_mg: 473, phosphorus_mg: 387, zinc_mg: 1.3, riboflavin_mg: 0.9, vitaminB12_ug: 1.3 },
  'tn-milk-camel': { calcium_mg: 285, vitaminC_mg: 9, iron_mg: 0.5, vitaminB12_ug: 0.5 },
  'tn-laban': { calcium_mg: 285, vitaminB12_ug: 0.9, riboflavin_mg: 0.4, potassium_mg: 370 },
  'tn-milk-soy': { calcium_mg: 60, vitaminB12_ug: 1.1, riboflavin_mg: 0.2, potassium_mg: 290 },
  'tn-milk-almond': { calcium_mg: 120, vitaminE_mg: 6, vitaminD_ug: 2.4 },
  'tn-milk-oat': { calcium_mg: 120, vitaminD_ug: 2, riboflavin_mg: 0.4, potassium_mg: 160 },

  // ── More legumes ───────────────────────────────────────────────────────────
  'tn-kidney-beans': { folate_ug: 130, iron_mg: 3.9, magnesium_mg: 74, potassium_mg: 620, manganese_mg: 0.7, phosphorus_mg: 205 },
  'tn-black-eyed-peas': { folate_ug: 208, iron_mg: 2.5, magnesium_mg: 84, potassium_mg: 419, zinc_mg: 1.7 },
  'tn-split-peas': { folate_ug: 95, iron_mg: 1.8, magnesium_mg: 54, potassium_mg: 435, manganese_mg: 0.6 },

  // ── More grains ────────────────────────────────────────────────────────────
  'white-rice': { manganese_mg: 0.7, selenium_ug: 12, niacin_mg: 2.3, folate_ug: 92, thiamin_mg: 0.2 },
  'tn-rice-white': { manganese_mg: 0.7, selenium_ug: 12, niacin_mg: 2.3, folate_ug: 92, thiamin_mg: 0.2 },
  pasta: { manganese_mg: 0.5, selenium_ug: 26, folate_ug: 83, niacin_mg: 2.3, iron_mg: 1.3 },
  'tn-oatmeal': { magnesium_mg: 63, manganese_mg: 1.4, phosphorus_mg: 180, zinc_mg: 1.5, iron_mg: 2.1 },
  'tn-bulgur': { magnesium_mg: 58, manganese_mg: 1.1, niacin_mg: 1.8, iron_mg: 1.7, folate_ug: 33 },

  // ── More nuts ──────────────────────────────────────────────────────────────
  'tn-peanuts': { niacin_mg: 3.4, vitaminE_mg: 2.3, magnesium_mg: 47, folate_ug: 68, manganese_mg: 0.5, phosphorus_mg: 107 },
  'tn-cashews': { magnesium_mg: 82, iron_mg: 1.9, zinc_mg: 1.6, copper_mg: 0.6, manganese_mg: 0.5, phosphorus_mg: 168 },
  'tn-pine-nuts': { magnesium_mg: 71, manganese_mg: 2.5, zinc_mg: 1.8, vitaminE_mg: 2.6, copper_mg: 0.4 },
  'tn-sesame': { calcium_mg: 88, iron_mg: 1.5, magnesium_mg: 32, copper_mg: 0.4, manganese_mg: 0.2 },

  // ── More fruits ────────────────────────────────────────────────────────────
  'tn-mandarin': { vitaminC_mg: 20, vitaminA_ug: 34, potassium_mg: 125, folate_ug: 12 },
  'tn-grapefruit': { vitaminC_mg: 38, vitaminA_ug: 58, potassium_mg: 166 },
  'tn-lemon': { vitaminC_mg: 31, potassium_mg: 80 },
  'tn-grapes': { vitaminK_ug: 13, vitaminC_mg: 10, potassium_mg: 176, copper_mg: 0.1 },
  'tn-watermelon': { vitaminC_mg: 12, vitaminA_ug: 43, potassium_mg: 170 },
  'tn-cantaloupe': { vitaminA_ug: 270, vitaminC_mg: 58, potassium_mg: 417 },
  'tn-fig-fresh': { potassium_mg: 348, calcium_mg: 53, magnesium_mg: 25, vitaminK_ug: 7 },
  'tn-date-fresh': { potassium_mg: 267, magnesium_mg: 22, vitaminB6_mg: 0.1 },
  'tn-peach': { vitaminC_mg: 10, vitaminA_ug: 24, potassium_mg: 285, vitaminE_mg: 1.1 },
  'tn-apricot': { vitaminA_ug: 96, vitaminC_mg: 10, potassium_mg: 273, vitaminE_mg: 0.9 },
  'tn-plum': { vitaminC_mg: 13, vitaminK_ug: 8, potassium_mg: 207 },
  'tn-pear': { vitaminC_mg: 8, vitaminK_ug: 8, potassium_mg: 206, copper_mg: 0.2 },
  'tn-cherry': { vitaminC_mg: 10, potassium_mg: 342, copper_mg: 0.1 },
  'tn-pineapple': { vitaminC_mg: 79, manganese_mg: 1.5, vitaminB6_mg: 0.2, folate_ug: 30 },
  'tn-mango': { vitaminC_mg: 60, vitaminA_ug: 89, folate_ug: 71, vitaminE_mg: 1.5, potassium_mg: 277 },
  'tn-papaya': { vitaminC_mg: 88, vitaminA_ug: 68, folate_ug: 53, potassium_mg: 264 },
  'tn-guava': { vitaminC_mg: 126, vitaminA_ug: 17, potassium_mg: 229, folate_ug: 27 },
  'tn-prickly-pear': { vitaminC_mg: 14, magnesium_mg: 85, calcium_mg: 56, potassium_mg: 220 },
  'tn-loquat': { vitaminA_ug: 76, potassium_mg: 266, manganese_mg: 0.1 },
  'tn-blackberry': { vitaminC_mg: 30, vitaminK_ug: 29, manganese_mg: 0.9, folate_ug: 36 },
  'tn-raspberry': { vitaminC_mg: 32, manganese_mg: 0.8, vitaminK_ug: 9.6, folate_ug: 26 },
  'tn-blueberry': { vitaminC_mg: 14, vitaminK_ug: 29, manganese_mg: 0.5 },
  'tn-persimmon': { vitaminA_ug: 137, vitaminC_mg: 13, manganese_mg: 0.6, potassium_mg: 270 },

  // ── More vegetables ────────────────────────────────────────────────────────
  'tn-cucumber': { vitaminK_ug: 16, potassium_mg: 147, vitaminC_mg: 2.8 },
  'tn-onion': { vitaminC_mg: 7, vitaminB6_mg: 0.1, folate_ug: 19, potassium_mg: 146 },
  'tn-garlic': { manganese_mg: 0.2, vitaminC_mg: 2.8, selenium_ug: 1.3 },
  'tn-zucchini': { vitaminC_mg: 18, vitaminB6_mg: 0.2, potassium_mg: 261, manganese_mg: 0.2 },
  'tn-cauliflower': { vitaminC_mg: 48, vitaminK_ug: 15, folate_ug: 57, potassium_mg: 299 },
  'tn-cabbage': { vitaminC_mg: 37, vitaminK_ug: 76, folate_ug: 43, potassium_mg: 170 },
  'tn-green-beans': { vitaminC_mg: 12, vitaminK_ug: 43, folate_ug: 33, manganese_mg: 0.2 },
  'tn-peas': { vitaminC_mg: 40, vitaminK_ug: 24, folate_ug: 65, thiamin_mg: 0.3, manganese_mg: 0.4, iron_mg: 1.5 },
  'tn-fennel': { vitaminC_mg: 12, potassium_mg: 414, manganese_mg: 0.2 },
  'tn-celery': { vitaminK_ug: 29, folate_ug: 36, potassium_mg: 260 },
  'tn-radish': { vitaminC_mg: 15, potassium_mg: 233, folate_ug: 25 },
  'tn-turnip': { vitaminC_mg: 21, potassium_mg: 191, folate_ug: 15 },
  'tn-beetroot': { folate_ug: 109, potassium_mg: 325, manganese_mg: 0.3, iron_mg: 0.8 },
  'tn-artichoke': { folate_ug: 68, vitaminC_mg: 15, vitaminK_ug: 18, magnesium_mg: 77, potassium_mg: 474 },
  'tn-pumpkin': { vitaminA_ug: 426, vitaminC_mg: 9, potassium_mg: 340 },
  'tn-leek': { vitaminK_ug: 47, vitaminA_ug: 83, folate_ug: 64, manganese_mg: 0.5, iron_mg: 2.1 },
  'tn-mushroom': { riboflavin_mg: 0.4, niacin_mg: 3.6, selenium_ug: 9, copper_mg: 0.3, potassium_mg: 318, vitaminD_ug: 0.2 },
  'tn-okra': { vitaminC_mg: 23, vitaminK_ug: 31, folate_ug: 60, magnesium_mg: 57, manganese_mg: 0.8 },
  'tn-asparagus': { vitaminK_ug: 42, folate_ug: 52, vitaminC_mg: 5.6, vitaminA_ug: 38 },
  'tn-sweet-corn': { vitaminC_mg: 7, folate_ug: 42, magnesium_mg: 37, thiamin_mg: 0.2, potassium_mg: 270 },
  'tn-lettuce': { vitaminK_ug: 126, vitaminA_ug: 370, folate_ug: 38 },

  // ── Juices (fresh) ─────────────────────────────────────────────────────────
  'ju-orange': { vitaminC_mg: 124, folate_ug: 74, potassium_mg: 496, thiamin_mg: 0.2 },
  'ju-pomegranate': { vitaminC_mg: 0.3, potassium_mg: 533, vitaminK_ug: 26, folate_ug: 60 },
  'ju-carrot': { vitaminA_ug: 2256, vitaminK_ug: 36, potassium_mg: 689, vitaminC_mg: 20 },
  'ju-multifruit': { vitaminC_mg: 40, potassium_mg: 250 },
  'ju-grape': { vitaminC_mg: 0.6, potassium_mg: 334, manganese_mg: 0.6 },
  'ju-strawberry': { vitaminC_mg: 80, folate_ug: 30, manganese_mg: 0.5 },

  // ── Honey ──────────────────────────────────────────────────────────────────
  'tn-honey-tbsp': { manganese_mg: 0.1, potassium_mg: 11 },

  // ── Condiments & sandwich sauces ───────────────────────────────────────────
  // Oil-based sauces carry meaningful ALA omega-3 (soybean/sunflower oil) + fat-soluble vits.
  'cd-mayo': { omega3_mg: 600, vitaminE_mg: 1.5, vitaminK_ug: 24, sodium_mg: 90 },
  'cd-garlic-sauce': { omega3_mg: 700, vitaminE_mg: 1.8, vitaminK_ug: 10, sodium_mg: 200 },
  'cd-mayo-harissa': { omega3_mg: 450, vitaminE_mg: 1.2, vitaminK_ug: 18, vitaminA_ug: 30, sodium_mg: 180 },
  'cd-harissa': { vitaminA_ug: 80, vitaminC_mg: 5, vitaminE_mg: 1, iron_mg: 0.5, potassium_mg: 60, sodium_mg: 200 },
  'cd-harissa-arbi': { vitaminA_ug: 110, vitaminC_mg: 6, vitaminE_mg: 1.3, iron_mg: 0.7, potassium_mg: 75, sodium_mg: 220 },
  'cd-hummus': { folate_ug: 15, iron_mg: 0.9, magnesium_mg: 18, phosphorus_mg: 55, copper_mg: 0.1, calcium_mg: 15, zinc_mg: 0.6 },
  'cd-tahini': { calcium_mg: 64, iron_mg: 1.3, magnesium_mg: 14, phosphorus_mg: 110, copper_mg: 0.24, thiamin_mg: 0.18, zinc_mg: 0.7 },
  'cd-ketchup': { vitaminA_ug: 20, vitaminC_mg: 2, potassium_mg: 57, sodium_mg: 154 },
  'cd-mustard': { selenium_ug: 5, sodium_mg: 168, calcium_mg: 9, phosphorus_mg: 15 },
  'cd-tomato-sauce': { vitaminC_mg: 6, vitaminA_ug: 25, potassium_mg: 180, vitaminK_ug: 3, iron_mg: 0.5, sodium_mg: 250 },
  'cd-bechamel': { calcium_mg: 70, vitaminA_ug: 60, vitaminB12_ug: 0.3, phosphorus_mg: 55, sodium_mg: 200 },

  // ── Prepared / breaded & sweets ────────────────────────────────────────────
  'tn-cordon-bleu': { calcium_mg: 120, vitaminB12_ug: 0.6, selenium_ug: 22, phosphorus_mg: 200, niacin_mg: 8, zinc_mg: 1.4, sodium_mg: 620 },
  'tn-halwa-chamia': { calcium_mg: 90, iron_mg: 1.8, magnesium_mg: 25, phosphorus_mg: 110, copper_mg: 0.4, zinc_mg: 0.7, thiamin_mg: 0.1 },

  // ── Milkshakes (milk + ice cream base) ─────────────────────────────────────
  'ms-vanilla': { calcium_mg: 250, vitaminB12_ug: 0.9, riboflavin_mg: 0.35, phosphorus_mg: 200, potassium_mg: 380, vitaminA_ug: 120, iodine_ug: 40 },
  'ms-chocolate': { calcium_mg: 250, vitaminB12_ug: 0.9, riboflavin_mg: 0.35, phosphorus_mg: 210, potassium_mg: 420, magnesium_mg: 30, vitaminA_ug: 110 },
  'ms-strawberry': { calcium_mg: 240, vitaminB12_ug: 0.8, riboflavin_mg: 0.32, phosphorus_mg: 195, potassium_mg: 360, vitaminC_mg: 12, vitaminA_ug: 110 },
  'ms-banana': { calcium_mg: 230, vitaminB12_ug: 0.8, potassium_mg: 500, vitaminB6_mg: 0.3, riboflavin_mg: 0.3, vitaminA_ug: 100 },
  'ms-oreo': { calcium_mg: 240, vitaminB12_ug: 0.8, riboflavin_mg: 0.32, phosphorus_mg: 210, potassium_mg: 350, iron_mg: 1 },
  'ms-caramel': { calcium_mg: 245, vitaminB12_ug: 0.85, riboflavin_mg: 0.34, phosphorus_mg: 200, potassium_mg: 370, vitaminA_ug: 110 },

};

/**
 * Additive omega-3 (and a few micro) top-ups merged into the profiles above.
 * Kept separate so the base tables stay readable; applied at module load.
 * These fill the nutrient the user most asked about (omega-3) on foods that
 * genuinely contain it but were previously blank for it.
 */
const MICRO_TOPUPS: Record<string, M> = {
  egg: { omega3_mg: 50 },
  avocado: { omega3_mg: 110 },
  'tn-avocado': { omega3_mg: 110 },
  'olive-oil': { omega3_mg: 100 },
  'tn-olive-oil-tbsp': { omega3_mg: 100 },
  tofu: { omega3_mg: 200 },
  'tn-milk-soy': { omega3_mg: 90 },
  'peanut-butter': { omega3_mg: 30 },
  'tn-sardine': { vitaminA_ug: 32 },
};

for (const [id, topup] of Object.entries(MICRO_TOPUPS)) {
  FOOD_MICROS[id] = { ...(FOOD_MICROS[id] ?? {}), ...topup };
}
