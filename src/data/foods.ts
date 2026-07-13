/**
 * Built-in food database for "precise" logging mode (spec §3.5).
 * Macros are per the stated serving. This is a compact starter set; users can
 * always add custom macros. Barcode search arrives in Phase 2.
 */
export interface FoodItem {
  id: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export const FOOD_DB: FoodItem[] = [
  { id: 'egg', name: 'Egg (whole, large)', serving: '1 egg (50g)', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, fiber: 0 },
  { id: 'chicken-breast', name: 'Chicken Breast (cooked)', serving: '100g', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  { id: 'white-rice', name: 'White Rice (cooked)', serving: '1 cup (158g)', calories: 205, protein: 4.3, carbs: 45, fat: 0.4, fiber: 0.6 },
  { id: 'brown-rice', name: 'Brown Rice (cooked)', serving: '1 cup (195g)', calories: 216, protein: 5, carbs: 45, fat: 1.8, fiber: 3.5 },
  { id: 'oats', name: 'Rolled Oats (dry)', serving: '40g', calories: 150, protein: 5, carbs: 27, fat: 3, fiber: 4 },
  { id: 'banana', name: 'Banana (medium)', serving: '1 (118g)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1 },
  { id: 'apple', name: 'Apple (medium)', serving: '1 (182g)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4 },
  { id: 'greek-yogurt', name: 'Greek Yogurt (plain, nonfat)', serving: '170g', calories: 100, protein: 17, carbs: 6, fat: 0.7, fiber: 0 },
  { id: 'whey', name: 'Whey Protein (scoop)', serving: '1 scoop (30g)', calories: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0 },
  { id: 'almonds', name: 'Almonds', serving: '28g (23 nuts)', calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 3.5 },
  { id: 'peanut-butter', name: 'Peanut Butter', serving: '2 tbsp (32g)', calories: 188, protein: 8, carbs: 6, fat: 16, fiber: 2 },
  { id: 'salmon', name: 'Salmon (cooked)', serving: '100g', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0 },
  { id: 'ground-beef', name: 'Ground Beef 90/10 (cooked)', serving: '100g', calories: 217, protein: 26, carbs: 0, fat: 12, fiber: 0 },
  { id: 'sweet-potato', name: 'Sweet Potato (baked)', serving: '1 medium (150g)', calories: 130, protein: 3, carbs: 30, fat: 0.1, fiber: 4.5 },
  { id: 'broccoli', name: 'Broccoli (cooked)', serving: '1 cup (156g)', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, fiber: 5 },
  { id: 'avocado', name: 'Avocado', serving: '1/2 (100g)', calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7 },
  { id: 'olive-oil', name: 'Olive Oil', serving: '1 tbsp (14g)', calories: 119, protein: 0, carbs: 0, fat: 13.5, fiber: 0 },
  { id: 'whole-wheat-bread', name: 'Whole Wheat Bread', serving: '1 slice (43g)', calories: 110, protein: 4, carbs: 20, fat: 1.5, fiber: 3 },
  { id: 'pasta', name: 'Pasta (cooked)', serving: '1 cup (140g)', calories: 220, protein: 8, carbs: 43, fat: 1.3, fiber: 2.5 },
  { id: 'cottage-cheese', name: 'Cottage Cheese (low-fat)', serving: '1/2 cup (113g)', calories: 90, protein: 12, carbs: 5, fat: 2.5, fiber: 0 },
  { id: 'tuna', name: 'Tuna (canned in water)', serving: '1 can (142g)', calories: 179, protein: 39, carbs: 0, fat: 1.3, fiber: 0 },
  { id: 'lentils', name: 'Lentils (cooked)', serving: '1 cup (198g)', calories: 230, protein: 18, carbs: 40, fat: 0.8, fiber: 16 },
  { id: 'tofu', name: 'Tofu (firm)', serving: '100g', calories: 144, protein: 15, carbs: 3, fat: 9, fiber: 2 },
  { id: 'milk', name: 'Milk (2%)', serving: '1 cup (244g)', calories: 122, protein: 8, carbs: 12, fat: 5, fiber: 0 },
  { id: 'cheddar', name: 'Cheddar Cheese', serving: '28g', calories: 113, protein: 7, carbs: 0.4, fat: 9, fiber: 0 },
  { id: 'orange', name: 'Orange (medium)', serving: '1 (131g)', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, fiber: 3.1 },
  { id: 'blueberries', name: 'Blueberries', serving: '1 cup (148g)', calories: 84, protein: 1.1, carbs: 21, fat: 0.5, fiber: 3.6 },
  { id: 'protein-bar', name: 'Protein Bar (typical)', serving: '1 bar (60g)', calories: 220, protein: 20, carbs: 22, fat: 7, fiber: 8 },
];

/**
 * Very small keyword → macro estimator for "honest log" mode (spec §3.5).
 * Given a plain-language meal description we scan for known foods/dishes and
 * sum rough macro estimates. Result is always flagged `is_estimated = true`.
 * This is intentionally heuristic: getting an off-plan day *logged* beats
 * perfect precision on one entry.
 */
export interface HonestEstimate {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  matched: string[];
}

interface DishHeuristic {
  keywords: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const DISH_HEURISTICS: DishHeuristic[] = [
  { keywords: ['burger', 'cheeseburger', 'hamburger'], calories: 550, protein: 27, carbs: 40, fat: 30 },
  { keywords: ['fries', 'chips'], calories: 340, protein: 4, carbs: 44, fat: 17 },
  { keywords: ['pizza', 'slice'], calories: 285, protein: 12, carbs: 36, fat: 10 },
  { keywords: ['soda', 'coke', 'pepsi', 'sprite'], calories: 150, protein: 0, carbs: 39, fat: 0 },
  { keywords: ['beer'], calories: 155, protein: 1.6, carbs: 13, fat: 0 },
  { keywords: ['wine'], calories: 125, protein: 0, carbs: 4, fat: 0 },
  { keywords: ['salad'], calories: 180, protein: 5, carbs: 12, fat: 12 },
  { keywords: ['sandwich', 'sub'], calories: 400, protein: 20, carbs: 45, fat: 15 },
  { keywords: ['pasta', 'spaghetti', 'noodles'], calories: 450, protein: 15, carbs: 65, fat: 12 },
  { keywords: ['rice'], calories: 205, protein: 4, carbs: 45, fat: 0.5 },
  { keywords: ['chicken'], calories: 250, protein: 30, carbs: 0, fat: 12 },
  { keywords: ['steak', 'beef'], calories: 400, protein: 34, carbs: 0, fat: 28 },
  { keywords: ['fish', 'salmon', 'tuna'], calories: 220, protein: 25, carbs: 0, fat: 12 },
  { keywords: ['egg', 'eggs', 'omelet', 'omelette'], calories: 160, protein: 13, carbs: 1, fat: 11 },
  { keywords: ['ice cream', 'dessert', 'cake', 'cookie', 'donut', 'doughnut'], calories: 350, protein: 4, carbs: 45, fat: 18 },
  { keywords: ['chocolate', 'candy'], calories: 230, protein: 3, carbs: 26, fat: 13 },
  { keywords: ['coffee', 'latte', 'cappuccino'], calories: 90, protein: 4, carbs: 10, fat: 4 },
  { keywords: ['smoothie', 'shake'], calories: 250, protein: 10, carbs: 40, fat: 5 },
  { keywords: ['taco', 'burrito', 'wrap'], calories: 380, protein: 16, carbs: 40, fat: 16 },
  { keywords: ['sushi'], calories: 350, protein: 14, carbs: 55, fat: 7 },
  { keywords: ['breakfast', 'pancake', 'waffle'], calories: 400, protein: 10, carbs: 55, fat: 15 },
  { keywords: ['fruit', 'apple', 'banana', 'orange'], calories: 95, protein: 1, carbs: 25, fat: 0.3 },
  { keywords: ['yogurt'], calories: 120, protein: 10, carbs: 12, fat: 3 },
  { keywords: ['nuts', 'almonds', 'peanuts'], calories: 200, protein: 7, carbs: 7, fat: 17 },
];

const SKIP_PATTERNS = ['skipped', 'nothing', 'no lunch', 'no breakfast', 'no dinner', "didn't eat", 'fasted'];

const PORTION_MULTIPLIERS: Array<{ words: string[]; mult: number }> = [
  { words: ['big', 'large', 'huge', 'double', 'extra'], mult: 1.4 },
  { words: ['small', 'light', 'little', 'half'], mult: 0.6 },
];

export function estimateFromDescription(text: string): HonestEstimate {
  const lower = text.toLowerCase();
  const result: HonestEstimate = { calories: 0, protein: 0, carbs: 0, fat: 0, matched: [] };

  if (SKIP_PATTERNS.some((p) => lower.includes(p)) && lower.trim().length < 40) {
    return result; // treated as an intentional skip / near-zero
  }

  let portionMult = 1;
  for (const { words, mult } of PORTION_MULTIPLIERS) {
    if (words.some((w) => lower.includes(w))) {
      portionMult = mult;
      break;
    }
  }

  const seen = new Set<string>();
  for (const dish of DISH_HEURISTICS) {
    const hit = dish.keywords.find((k) => lower.includes(k));
    if (hit && !seen.has(dish.keywords[0])) {
      seen.add(dish.keywords[0]);
      result.calories += dish.calories;
      result.protein += dish.protein;
      result.carbs += dish.carbs;
      result.fat += dish.fat;
      result.matched.push(hit);
    }
  }

  // If nothing matched, fall back to an average mixed meal so the day still logs.
  if (result.matched.length === 0 && lower.trim().length > 0) {
    result.calories = 500;
    result.protein = 20;
    result.carbs = 55;
    result.fat = 20;
    result.matched.push('mixed meal (rough estimate)');
  }

  result.calories = Math.round(result.calories * portionMult);
  result.protein = Math.round(result.protein * portionMult);
  result.carbs = Math.round(result.carbs * portionMult);
  result.fat = Math.round(result.fat * portionMult);
  return result;
}
