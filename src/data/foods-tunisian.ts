import type { FoodItem } from './foods';

/**
 * Tunisian & Mediterranean food reference.
 *
 * Calories come from the Tunisian Diet & Gym Reference (USDA FoodData Central,
 * CIQUAL, and typical Tunisian recipe ratios). Macros are derived from the
 * dish's known composition; composite dishes are honest estimates.
 *
 * This list is purely additive — existing food_entries store their macros
 * denormalized at log time, so nothing already logged is affected by changes here.
 */

// Compact builder: id, name, serving, kcal, protein, carbs, fat, fiber, category
const F = (
  id: string,
  name: string,
  serving: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  fiber: number,
  category: string
): FoodItem => ({ id, name, serving, calories, protein, carbs, fat, fiber, category, cuisine: 'tunisian' });

export const TUNISIAN_FOODS: FoodItem[] = [
  // ── Main dishes & specialties ──────────────────────────────────────────────
  F('tn-couscous-plain', 'Couscous (plain)', '225 g (1 cup)', 500, 17, 103, 1, 6, 'Tunisian dish'),
  F('tn-couscous-full', 'Couscous with Meat & Vegetables', '500 g plate', 700, 35, 85, 22, 8, 'Tunisian dish'),
  F('tn-tajine', 'Tajine Tunisien', '300 g', 540, 35, 20, 35, 3, 'Tunisian dish'),
  F('tn-brik', 'Brik', '1 piece (60 g)', 280, 9, 20, 19, 1, 'Tunisian dish'),
  F('tn-fricasse', 'Fricassé', '204 g', 316, 12, 32, 16, 2, 'Tunisian dish'),
  F('tn-lablabi', 'Lablabi', '300 g bowl', 250, 11, 35, 7, 9, 'Tunisian dish'),
  F('tn-chorba-frik', 'Chorba Frik', '300 g bowl', 150, 8, 20, 4, 3, 'Tunisian dish'),
  F('tn-ojja', 'Ojja', '250 g', 280, 15, 10, 20, 3, 'Tunisian dish'),
  F('tn-mloukhia', 'Mloukhia', '250 g bowl', 300, 22, 12, 18, 5, 'Tunisian dish'),
  F('tn-bambalouni', 'Bambalouni', '1 doughnut (50 g)', 260, 4, 33, 12, 1, 'Tunisian sweet'),

  // ── Pasta (Tunisian-style) ────────────────────────────────────────────────
  F('tn-pasta-plain', 'Pasta (plain, cooked)', '140 g (1 cup)', 183, 7, 36, 1, 2, 'Pasta'),
  F('tn-maccarona', 'Maccarona (tomato-meat pasta)', '300 g plate', 450, 22, 55, 15, 4, 'Pasta'),
  F('tn-rechta', 'Rechta (Tunisian noodles)', '300 g bowl', 420, 20, 55, 12, 5, 'Pasta'),
  F('tn-pasta-thon', 'Pasta au Thon (tuna pasta)', '300 g plate', 390, 22, 50, 11, 4, 'Pasta'),

  // ── Breads, pastries & sweets ─────────────────────────────────────────────
  F('tn-khobz-tabouna', 'Khobz Tabouna', '100 g', 270, 9, 55, 1.5, 3, 'Bread'),
  F('tn-baguette', 'Baguette', '60 g', 160, 5, 31, 1, 1.5, 'Bread'),
  F('tn-pain-complet', 'Pain Complet (whole wheat)', '50 g slice', 120, 5, 21, 1.5, 3, 'Bread'),
  F('tn-croissant', 'Croissant', '60 g', 240, 5, 26, 13, 1.5, 'Pastry'),
  F('tn-makroudh', 'Makroudh', '50 g', 200, 2, 30, 8, 2, 'Tunisian sweet'),
  F('tn-baklava', 'Baklava', '28 g', 120, 2, 14, 7, 0.7, 'Tunisian sweet'),
  F('tn-assidat-zgougou', 'Assidat Zgougou', '150 g cup', 200, 5, 25, 9, 2, 'Tunisian sweet'),

  // ── Honey & olive oil ─────────────────────────────────────────────────────
  F('tn-honey-tsp', 'Honey', '1 tsp (7 g)', 21, 0, 5.7, 0, 0, 'Condiment'),
  F('tn-honey-tbsp', 'Honey', '1 tbsp (21 g)', 64, 0.1, 17, 0, 0, 'Condiment'),
  F('tn-olive-oil-tsp', 'Olive Oil', '1 tsp (4.5 g)', 40, 0, 0, 4.5, 0, 'Fat'),
  F('tn-olive-oil-tbsp', 'Olive Oil', '1 tbsp (13.5 g)', 120, 0, 0, 13.5, 0, 'Fat'),

  // ── Cheeses ───────────────────────────────────────────────────────────────
  F('tn-jben', 'Jben (fresh goat cheese)', '30 g', 48, 5, 1, 3, 0, 'Cheese'),
  F('tn-rigouta', 'Rigouta (whey cheese)', '30 g', 45, 4, 1, 3, 0, 'Cheese'),
  F('tn-halloumi', 'Halloumi (grilled)', '30 g', 90, 6, 0.5, 7, 0, 'Cheese'),
  F('tn-feta', 'Feta', '30 g', 75, 4, 1, 6, 0, 'Cheese'),
  F('tn-mozzarella', 'Mozzarella', '30 g', 85, 6, 1, 6, 0, 'Cheese'),
  F('tn-cheddar', 'Cheddar', '30 g', 120, 7, 0.4, 10, 0, 'Cheese'),
  F('tn-vache-qui-rit', 'Vache qui Rit (processed spread)', '1 wedge (20 g)', 50, 2, 1.5, 4, 0, 'Cheese'),
  F('tn-cream-cheese', 'Cream Cheese (Kiri-style)', '30 g', 85, 2, 1, 8, 0, 'Cheese'),
  F('tn-edam-gouda', 'Edam / Gouda', '30 g', 110, 7, 0.4, 9, 0, 'Cheese'),
  F('tn-parmesan', 'Parmesan (grated)', '10 g', 40, 3.6, 0.3, 2.6, 0, 'Cheese'),
  F('tn-ricotta', 'Ricotta', '100 g', 174, 11, 3, 13, 0, 'Cheese'),
  F('tn-labneh', 'Labneh (strained yogurt cheese)', '30 g', 54, 3, 1.5, 4, 0, 'Cheese'),
  F('tn-processed-slice', 'Processed Cheese Slice', '20 g', 60, 3, 1, 5, 0, 'Cheese'),
  F('tn-camembert', 'Camembert / Brie', '30 g', 95, 6, 0.1, 8, 0, 'Cheese'),

  // ── Milks ─────────────────────────────────────────────────────────────────
  F('tn-milk-whole', 'Whole Cow Milk', '250 ml', 150, 8, 12, 8, 0, 'Milk'),
  F('tn-milk-semi', 'Semi-Skimmed Cow Milk', '250 ml', 120, 8, 12, 5, 0, 'Milk'),
  F('tn-milk-skim', 'Skim / Non-Fat Milk', '250 ml', 86, 8, 12, 0.4, 0, 'Milk'),
  F('tn-milk-goat', 'Goat Milk', '250 ml', 168, 9, 11, 10, 0, 'Milk'),
  F('tn-milk-sheep', 'Sheep Milk', '250 ml', 264, 15, 13, 17, 0, 'Milk'),
  F('tn-milk-camel', 'Camel Milk', '250 ml', 130, 8, 12, 5, 0, 'Milk'),
  F('tn-laban', 'Laban / Buttermilk', '250 ml', 99, 8, 12, 2, 0, 'Milk'),
  F('tn-milk-soy', 'Soy Milk (unsweetened)', '250 ml', 80, 7, 4, 4, 1, 'Milk'),
  F('tn-milk-almond', 'Almond Milk (unsweetened)', '250 ml', 40, 1, 2, 3, 0.5, 'Milk'),
  F('tn-milk-oat', 'Oat Milk', '250 ml', 120, 3, 16, 5, 1.5, 'Milk'),
  F('tn-milk-evaporated', 'Evaporated Milk', '30 ml', 25, 1.2, 1.8, 1.4, 0, 'Milk'),
  F('tn-milk-condensed', 'Condensed Milk (sweetened)', '1 tbsp (20 g)', 65, 1.6, 11, 1.7, 0, 'Milk'),

  // ── Legumes ───────────────────────────────────────────────────────────────
  F('tn-white-beans', 'White Beans (Loubia)', '150 g cooked', 190, 13, 34, 0.6, 10, 'Legume'),
  F('tn-fava-beans', 'Fava Beans (Foul)', '150 g cooked', 165, 11, 27, 0.6, 8, 'Legume'),
  F('tn-chickpeas', 'Chickpeas (Hommos)', '150 g cooked', 245, 13, 41, 4, 11, 'Legume'),
  F('tn-lentils', 'Lentils (Adas)', '150 g cooked', 174, 13, 30, 0.6, 12, 'Legume'),
  F('tn-kidney-beans', 'Kidney Beans', '150 g cooked', 190, 13, 34, 0.7, 10, 'Legume'),
  F('tn-black-eyed-peas', 'Black-Eyed Peas', '150 g cooked', 174, 12, 31, 0.7, 9, 'Legume'),
  F('tn-split-peas', 'Split Peas', '150 g cooked', 176, 12, 31, 0.6, 11, 'Legume'),

  // ── Grains ────────────────────────────────────────────────────────────────
  F('tn-oats-raw', 'Oats (raw)', '40 g (½ cup)', 156, 5.4, 27, 2.8, 4, 'Grain'),
  F('tn-oatmeal', 'Oatmeal (cooked in water)', '234 g (1 cup)', 166, 6, 28, 3.6, 4, 'Grain'),
  F('tn-rice-white', 'White Rice (cooked)', '158 g (1 cup)', 205, 4.3, 45, 0.4, 0.6, 'Grain'),
  F('tn-bulgur', 'Bulgur (cooked)', '182 g (1 cup)', 151, 5.6, 34, 0.4, 8, 'Grain'),

  // ── Nuts & seeds ──────────────────────────────────────────────────────────
  F('tn-peanuts', 'Peanuts', '28 g', 160, 7, 4.6, 14, 2.4, 'Nuts'),
  F('tn-almonds', 'Almonds', '28 g', 170, 6, 6, 15, 3.5, 'Nuts'),
  F('tn-cashews', 'Cashews', '28 g', 157, 5, 9, 12, 1, 'Nuts'),
  F('tn-walnuts', 'Walnuts', '28 g', 185, 4.3, 3.9, 18.5, 1.9, 'Nuts'),
  F('tn-pistachios', 'Pistachios', '28 g', 159, 6, 8, 13, 3, 'Nuts'),
  F('tn-pine-nuts', 'Pine Nuts (Zgougou)', '28 g', 191, 3.9, 3.7, 19, 1, 'Nuts'),
  F('tn-sesame', 'Sesame Seeds', '10 g (1 tbsp)', 52, 1.6, 2.1, 4.5, 1.2, 'Nuts'),

  // ── Fruits ────────────────────────────────────────────────────────────────
  F('tn-apple', 'Apple', '1 medium (182 g)', 95, 0.5, 25, 0.3, 4.4, 'Fruit'),
  F('tn-banana', 'Banana', '1 medium (118 g)', 105, 1.3, 27, 0.4, 3.1, 'Fruit'),
  F('tn-orange', 'Orange', '1 medium (131 g)', 62, 1.2, 15, 0.2, 3.1, 'Fruit'),
  F('tn-mandarin', 'Mandarin / Clementine', '1 (74 g)', 35, 0.5, 9, 0.2, 1.3, 'Fruit'),
  F('tn-grapefruit', 'Grapefruit', '½ (123 g)', 52, 1, 13, 0.2, 2, 'Fruit'),
  F('tn-lemon', 'Lemon', '1 (58 g)', 17, 0.6, 5, 0.2, 1.6, 'Fruit'),
  F('tn-lime', 'Lime', '1 (67 g)', 20, 0.5, 7, 0.1, 1.9, 'Fruit'),
  F('tn-grapes', 'Grapes', '1 cup (92 g)', 62, 0.6, 16, 0.3, 0.8, 'Fruit'),
  F('tn-watermelon', 'Watermelon', '1 cup diced (152 g)', 46, 0.9, 11, 0.2, 0.6, 'Fruit'),
  F('tn-cantaloupe', 'Melon (Cantaloupe)', '1 cup diced (160 g)', 54, 1.3, 13, 0.3, 1.4, 'Fruit'),
  F('tn-strawberry', 'Strawberry', '1 cup (152 g)', 49, 1, 12, 0.5, 3, 'Fruit'),
  F('tn-fig-fresh', 'Fig (fresh)', '3 figs (150 g)', 111, 1.1, 29, 0.4, 4.4, 'Fruit'),
  F('tn-fig-dried', 'Fig (dried)', '40 g (2 figs)', 100, 1.3, 25, 0.4, 3.7, 'Fruit'),
  F('tn-date-fresh', 'Date (fresh)', '40 g (5 dates)', 60, 0.6, 15, 0.1, 1.5, 'Fruit'),
  F('tn-date-deglet', 'Date (dried, Deglet Nour)', '40 g (5 dates)', 113, 1, 30, 0.2, 3.2, 'Fruit'),
  F('tn-pomegranate', 'Pomegranate', '100 g seeds', 83, 1.7, 19, 1.2, 4, 'Fruit'),
  F('tn-peach', 'Peach', '1 medium (150 g)', 58, 1.4, 14, 0.4, 2.3, 'Fruit'),
  F('tn-apricot', 'Apricot', '3 (105 g)', 50, 1.5, 12, 0.4, 2.1, 'Fruit'),
  F('tn-plum', 'Plum', '2 (132 g)', 76, 1.2, 18, 0.5, 2, 'Fruit'),
  F('tn-pear', 'Pear', '1 medium (178 g)', 101, 0.6, 27, 0.2, 5.5, 'Fruit'),
  F('tn-cherry', 'Cherry', '1 cup (154 g)', 97, 1.6, 25, 0.3, 3.2, 'Fruit'),
  F('tn-pineapple', 'Pineapple', '1 cup chunks (165 g)', 82, 0.9, 22, 0.2, 2.3, 'Fruit'),
  F('tn-mango', 'Mango', '1 cup (165 g)', 99, 1.4, 25, 0.6, 2.6, 'Fruit'),
  F('tn-kiwi', 'Kiwi', '1 medium (69 g)', 42, 0.8, 10, 0.4, 2.1, 'Fruit'),
  F('tn-papaya', 'Papaya', '1 cup (145 g)', 62, 0.7, 16, 0.4, 2.5, 'Fruit'),
  F('tn-guava', 'Guava', '1 fruit (55 g)', 37, 1.4, 8, 0.5, 3, 'Fruit'),
  F('tn-prickly-pear', 'Prickly Pear (Hindi)', '1 fruit (100 g)', 41, 0.7, 10, 0.5, 3.6, 'Fruit'),
  F('tn-loquat', 'Loquat (Nèfle)', '100 g', 47, 0.4, 12, 0.2, 1.7, 'Fruit'),
  F('tn-quince', 'Quince (Coing)', '1 medium (92 g)', 52, 0.4, 14, 0.1, 1.7, 'Fruit'),
  F('tn-blackberry', 'Blackberry', '1 cup (144 g)', 62, 2, 14, 0.7, 7.6, 'Fruit'),
  F('tn-raspberry', 'Raspberry', '1 cup (123 g)', 64, 1.5, 15, 0.8, 8, 'Fruit'),
  F('tn-blueberry', 'Blueberry', '1 cup (148 g)', 84, 1.1, 21, 0.5, 3.6, 'Fruit'),
  F('tn-avocado', 'Avocado', '½ fruit (100 g)', 160, 2, 9, 15, 7, 'Fruit'),
  F('tn-persimmon', 'Persimmon (Kaki)', '1 fruit (168 g)', 118, 1, 31, 0.3, 6, 'Fruit'),

  // ── Meats & poultry ───────────────────────────────────────────────────────
  F('tn-beef-lean', 'Beef, Lean Cut (grilled)', '100 g', 250, 26, 0, 16, 0, 'Meat'),
  F('tn-beef-ground', 'Beef, Ground (80/20)', '100 g', 254, 26, 0, 17, 0, 'Meat'),
  F('tn-lamb', 'Lamb (grilled)', '100 g', 294, 25, 0, 21, 0, 'Meat'),
  F('tn-mutton', 'Mutton', '100 g', 258, 25, 0, 17, 0, 'Meat'),
  F('tn-veal', 'Veal', '100 g', 172, 24, 0, 8, 0, 'Meat'),
  F('tn-goat-meat', 'Goat Meat', '100 g', 143, 27, 0, 3, 0, 'Meat'),
  F('tn-camel-meat', 'Camel Meat', '100 g', 150, 26, 0, 4, 0, 'Meat'),
  F('tn-chicken-breast', 'Chicken Breast (skinless)', '100 g', 165, 31, 0, 3.6, 0, 'Poultry'),
  F('tn-chicken-thigh', 'Chicken Thigh (skin-on)', '100 g', 209, 26, 0, 11, 0, 'Poultry'),
  F('tn-chicken-whole', 'Chicken, Whole Roasted (w/ skin)', '100 g', 239, 27, 0, 14, 0, 'Poultry'),
  F('tn-turkey-breast', 'Turkey Breast', '100 g', 135, 30, 0, 1, 0, 'Poultry'),
  F('tn-duck', 'Duck (roasted)', '100 g', 337, 19, 0, 28, 0, 'Poultry'),
  F('tn-merguez', 'Merguez Sausage', '1 sausage (50 g)', 150, 8, 1, 13, 0, 'Meat'),
  F('tn-beef-liver', 'Beef Liver', '100 g', 175, 26, 5, 5, 0, 'Offal'),
  F('tn-lamb-liver', 'Lamb Liver', '100 g', 139, 21, 2, 5, 0, 'Offal'),
  F('tn-kidney', 'Kidney (beef/lamb)', '100 g', 99, 17, 0, 3, 0, 'Offal'),
  F('tn-rabbit', 'Rabbit', '100 g', 173, 33, 0, 3.5, 0, 'Meat'),
  F('tn-quail', 'Quail', '100 g', 227, 25, 0, 14, 0, 'Poultry'),

  // ── Fish & seafood ────────────────────────────────────────────────────────
  F('tn-tuna-fresh', 'Tuna (fresh, grilled)', '100 g', 184, 30, 0, 6, 0, 'Seafood'),
  F('tn-sardine', 'Sardine', '100 g', 208, 25, 0, 11, 0, 'Seafood'),
  F('tn-sea-bream', 'Sea Bream (Dorade)', '100 g', 96, 20, 0, 1.5, 0, 'Seafood'),
  F('tn-sea-bass', 'Sea Bass (Loup de Mer)', '100 g', 97, 18, 0, 2, 0, 'Seafood'),
  F('tn-mackerel', 'Mackerel', '100 g', 205, 19, 0, 14, 0, 'Seafood'),
  F('tn-anchovy', 'Anchovy', '100 g', 131, 20, 0, 5, 0, 'Seafood'),
  F('tn-shrimp', 'Shrimp', '100 g', 99, 24, 0.2, 0.3, 0, 'Seafood'),
  F('tn-octopus', 'Octopus', '100 g', 82, 15, 2, 1, 0, 'Seafood'),
  F('tn-squid', 'Squid (Calamari)', '100 g', 92, 16, 3, 1.4, 0, 'Seafood'),
  F('tn-mussels', 'Mussels', '100 g', 86, 12, 4, 2, 0, 'Seafood'),
  F('tn-cuttlefish', 'Cuttlefish', '100 g', 79, 16, 0.8, 0.7, 0, 'Seafood'),

  // ── Vegetables ────────────────────────────────────────────────────────────
  F('tn-cucumber', 'Cucumber', '100 g', 15, 0.7, 3.6, 0.1, 0.5, 'Vegetable'),
  F('tn-tomato', 'Tomato', '100 g', 18, 0.9, 3.9, 0.2, 1.2, 'Vegetable'),
  F('tn-bell-pepper', 'Bell Pepper', '100 g', 20, 0.9, 4.6, 0.2, 1.7, 'Vegetable'),
  F('tn-onion', 'Onion', '100 g', 40, 1.1, 9, 0.1, 1.7, 'Vegetable'),
  F('tn-garlic', 'Garlic', '3 cloves (9 g)', 13, 0.6, 3, 0, 0.2, 'Vegetable'),
  F('tn-eggplant', 'Eggplant', '100 g', 25, 1, 6, 0.2, 3, 'Vegetable'),
  F('tn-zucchini', 'Zucchini', '100 g', 17, 1.2, 3.1, 0.3, 1, 'Vegetable'),
  F('tn-potato', 'Potato', '100 g', 77, 2, 17, 0.1, 2.2, 'Vegetable'),
  F('tn-sweet-potato', 'Sweet Potato', '100 g', 86, 1.6, 20, 0.1, 3, 'Vegetable'),
  F('tn-carrot', 'Carrot', '100 g', 41, 0.9, 10, 0.2, 2.8, 'Vegetable'),
  F('tn-spinach', 'Spinach', '100 g', 23, 2.9, 3.6, 0.4, 2.2, 'Vegetable'),
  F('tn-swiss-chard', 'Swiss Chard (Blette)', '100 g', 19, 1.8, 3.7, 0.2, 1.6, 'Vegetable'),
  F('tn-kale', 'Kale', '100 g', 35, 2.9, 4.4, 1.5, 4.1, 'Vegetable'),
  F('tn-lettuce', 'Lettuce', '100 g', 15, 1.4, 2.9, 0.2, 1.3, 'Vegetable'),
  F('tn-cauliflower', 'Cauliflower', '100 g', 25, 1.9, 5, 0.3, 2, 'Vegetable'),
  F('tn-broccoli', 'Broccoli', '100 g', 34, 2.8, 7, 0.4, 2.6, 'Vegetable'),
  F('tn-cabbage', 'Cabbage', '100 g', 25, 1.3, 6, 0.1, 2.5, 'Vegetable'),
  F('tn-green-beans', 'Green Beans', '100 g', 31, 1.8, 7, 0.1, 3.4, 'Vegetable'),
  F('tn-peas', 'Peas (green)', '100 g', 81, 5.4, 14, 0.4, 5.7, 'Vegetable'),
  F('tn-fennel', 'Fennel', '100 g', 31, 1.2, 7, 0.2, 3.1, 'Vegetable'),
  F('tn-celery', 'Celery', '100 g', 16, 0.7, 3, 0.2, 1.6, 'Vegetable'),
  F('tn-radish', 'Radish', '100 g', 16, 0.7, 3.4, 0.1, 1.6, 'Vegetable'),
  F('tn-turnip', 'Turnip', '100 g', 28, 0.9, 6, 0.1, 1.8, 'Vegetable'),
  F('tn-beetroot', 'Beetroot', '100 g', 43, 1.6, 10, 0.2, 2.8, 'Vegetable'),
  F('tn-artichoke', 'Artichoke', '1 medium (128 g)', 64, 3.5, 14, 0.2, 7, 'Vegetable'),
  F('tn-pumpkin', 'Pumpkin / Squash', '100 g', 26, 1, 6.5, 0.1, 0.5, 'Vegetable'),
  F('tn-leek', 'Leek', '100 g', 61, 1.5, 14, 0.3, 1.8, 'Vegetable'),
  F('tn-mushroom', 'Mushroom', '100 g', 22, 3.1, 3.3, 0.3, 1, 'Vegetable'),
  F('tn-okra', 'Okra (Gombo)', '100 g', 33, 1.9, 7, 0.2, 3.2, 'Vegetable'),
  F('tn-asparagus', 'Asparagus', '100 g', 20, 2.2, 3.9, 0.1, 2.1, 'Vegetable'),
  F('tn-sweet-corn', 'Sweet Corn', '100 g', 86, 3.2, 19, 1.2, 2.7, 'Vegetable'),
  F('tn-olives', 'Olives', '30 g (10 olives)', 35, 0.3, 1, 3.3, 1, 'Vegetable'),
];
