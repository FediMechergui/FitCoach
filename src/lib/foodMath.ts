/**
 * Working out a food's calories from its macros.
 *
 * Packaging in most of the world prints protein, carbs and fat but the calorie
 * figure is sometimes missing, unreadable, or in the other unit — and for
 * anything home-cooked there is no label at all. Rather than making that a dead
 * end, a custom food can be logged with just its macros and have the energy
 * derived.
 *
 * The arithmetic is the Atwater system: protein and carbohydrate yield about
 * 4 kcal/g, fat about 9. The one refinement that matters is **fibre**. It is
 * counted inside total carbohydrate on a label, but the body gets roughly
 * 2 kcal/g from it rather than 4, so treating it as ordinary carbohydrate
 * over-states high-fibre foods badly — a bowl of lentils or an avocado can come
 * out 12–16% too high.
 *
 * That refinement isn't a guess. Measured against all 305 real foods in the
 * database (scripts/verify-engines.ts re-runs this):
 *
 *   plain 4/4/9 on total carbs → 81% of foods within 10%, 90th pct error 12.2%
 *   fibre discounted to 2 kcal/g → 97% within 10%, 90th pct error 7.1%
 *
 * So this is an approximation with a known, measured accuracy rather than a
 * plausible-looking formula — which is why the UI can honestly label a derived
 * figure "estimated" and show how close that usually lands.
 */

export const KCAL_PER_G_PROTEIN = 4;
export const KCAL_PER_G_CARB = 4;
export const KCAL_PER_G_FAT = 9;
/** Fibre is carbohydrate on the label but yields roughly half the energy. */
export const KCAL_PER_G_FIBRE = 2;

export interface MacroInput {
  protein: number;
  carbs: number;
  fat: number;
  /** grams of fibre, already counted inside `carbs` */
  fiber?: number;
}

const safe = (n: number | undefined): number =>
  typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0;

/**
 * Energy implied by a set of macros, in kcal, rounded to whole calories.
 * Fibre is subtracted from carbohydrate and re-added at its own lower rate; if
 * the stated fibre exceeds the stated carbs (a typo, or a rounded label) the
 * excess is ignored rather than producing a negative.
 */
export function caloriesFromMacros(m: MacroInput): number {
  const protein = safe(m.protein);
  const carbs = safe(m.carbs);
  const fat = safe(m.fat);
  const fiber = Math.min(safe(m.fiber), carbs);
  const netCarbs = carbs - fiber;
  return Math.round(
    protein * KCAL_PER_G_PROTEIN +
      netCarbs * KCAL_PER_G_CARB +
      fiber * KCAL_PER_G_FIBRE +
      fat * KCAL_PER_G_FAT
  );
}

export interface ResolvedCalories {
  calories: number;
  /** true when the figure was derived from macros rather than entered */
  estimated: boolean;
}

/**
 * The calorie figure to store: what was typed if anything was, otherwise the
 * derived one. Blank, zero and unparseable all count as "not entered" — a food
 * with genuinely zero calories also has zero macros, so deriving gives 0 too.
 */
export function resolveCalories(entered: string | number | null | undefined, m: MacroInput): ResolvedCalories {
  const raw = typeof entered === 'string' ? parseFloat(entered.replace(',', '.')) : entered;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return { calories: Math.round(raw), estimated: false };
  }
  return { calories: caloriesFromMacros(m), estimated: true };
}

/** Parse a user-typed number tolerantly (comma decimals, blanks, junk → 0). */
export function parseAmount(text: string | null | undefined): number {
  if (!text) return 0;
  const n = parseFloat(String(text).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Is this custom food worth saving? A name and at least one macro — otherwise
 * it's an empty row that would log nothing and clutter the search.
 */
export function isCompleteCustomFood(f: { name: string } & MacroInput): boolean {
  if (!f.name.trim()) return false;
  return safe(f.protein) + safe(f.carbs) + safe(f.fat) > 0;
}
