/**
 * Matching a name to a food we already have.
 *
 * When a model says "grilled chicken breast", the honest answer is almost
 * always already in the catalogue — with macros and micronutrients that were
 * curated rather than generated. Finding it is worth real effort: a match means
 * the entry gets measured data instead of an estimate, and it keeps the food
 * database from filling up with near-duplicates of things it already knows.
 *
 * The existing pickers search with `name.includes(query)`, which fails on
 * everything a model actually says — word order, plurals, accents, and cooking
 * words the catalogue spells differently ("chicken breast, grilled" vs "grilled
 * chicken breast"). So matching here is by TOKENS rather than substrings, and
 * scored, so a caller can insist on a good match and otherwise fall back.
 *
 * Pure functions; scripts/verify-engines.ts tests them against the real
 * catalogue so a match that regresses fails the build.
 */

/** Words that carry no identity — dropped before comparing. */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'with', 'and', 'in', 'on', 'or', 'plain', 'fresh',
  'homemade', 'style', 'served', 'side', 'piece', 'pieces', 'slice', 'slices',
  'portion', 'serving', 'some', 'small', 'large', 'medium',
]);

/**
 * Lowercase, strip accents and punctuation, collapse whitespace. Keeps the
 * cooking method ("grilled", "fried") because it genuinely changes the food.
 */
export function normaliseFoodName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // drop diacritics: 'creme' stays 'creme'
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Crude singular form — enough for food names, which are rarely irregular. */
function singular(token: string): string {
  if (token.length > 3 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 3 && token.endsWith('es') && !token.endsWith('ses')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

/**
 * Words that describe HOW a food was prepared or cut, rather than what it is.
 *
 * These refine an identity without defining it, and the catalogue keeps them in
 * parentheses — "Chicken Breast (cooked)", "Salmon (cooked)" — while a model
 * says "grilled chicken breast" or "salmon fillet". Treated as identity words
 * they block the match entirely; ignored altogether they let "fried chicken"
 * pass for chicken breast, which is nutritionally a different meal. So they are
 * scored separately: they never block a match, but matching one breaks the tie.
 */
const QUALIFIERS = new Set([
  'cooked', 'raw', 'grilled', 'fried', 'baked', 'roasted', 'roast', 'boiled',
  'steamed', 'stewed', 'smoked', 'canned', 'dried', 'frozen', 'breaded',
  'skinless', 'boneless', 'fillet', 'filet', 'whole', 'chopped', 'sliced',
  'ground', 'minced', 'nonfat', 'lowfat', 'skim', 'lean', 'peeled', 'unsalted',
  'salted', 'sweetened', 'unsweetened', 'cup', 'tbsp', 'tsp', 'g', 'ml',
]);

/** Identity-bearing tokens of a food name. */
export function nameTokens(s: string): string[] {
  return normaliseFoodName(s)
    .split(' ')
    .filter((t) => t.length > 0 && !STOPWORDS.has(t))
    .map(singular);
}

/** The tokens that say what a food IS, ignoring how it was prepared. */
export function coreTokens(s: string): string[] {
  const all = nameTokens(s);
  const core = all.filter((t) => !QUALIFIERS.has(t));
  // A name made only of qualifiers ("fillet") still has to match on something.
  return core.length > 0 ? core : all;
}

/** The preparation words of a food name. */
export function qualifierTokens(s: string): string[] {
  return nameTokens(s).filter((t) => QUALIFIERS.has(t));
}

/**
 * How well `candidate` answers `query`, 0–1.
 *
 * Identity decides whether it matches at all: every core word of the query the
 * candidate also has counts, so word order never matters, and a candidate
 * carrying extra identity words is a looser answer and is discounted.
 * Preparation words then break ties, which is what keeps "fried chicken" on
 * the fried chicken rather than on a plain breast that scores the same on
 * identity alone.
 */
export function scoreFoodMatch(query: string, candidate: string): number {
  if (normaliseFoodName(query) === normaliseFoodName(candidate)) return 1;

  const qCore = coreTokens(query);
  const cCore = coreTokens(candidate);
  if (qCore.length === 0 || cCore.length === 0) return 0;

  const cSet = new Set(cCore);
  let hits = 0;
  for (const t of qCore) if (cSet.has(t)) hits += 1;
  if (hits === 0) return 0;

  const coverage = hits / qCore.length; // how much of what was asked for is there
  const focus = hits / cCore.length; // how much of the candidate is on-topic

  const qQual = qualifierTokens(query);
  const cQual = new Set(qualifierTokens(candidate));
  const qualHits = qQual.filter((t) => cQual.has(t)).length;
  const qualBonus = qQual.length > 0 ? qualHits / qQual.length : 0;

  return Math.min(0.99, coverage * 0.7 + focus * 0.15 + qualBonus * 0.15);
}

export interface FoodMatch<T> {
  food: T;
  score: number;
}

/**
 * Good enough to use the catalogue's numbers instead of asking the model.
 * Requires the whole query to be covered, or nearly.
 */
export const MATCH_MIN_SCORE = 0.7;

/**
 * Best catalogue food for a name, or null when nothing is close enough.
 * `nameOf` reads the display name from whatever shape the caller holds.
 */
export function matchFood<T>(
  query: string,
  catalogue: readonly T[],
  nameOf: (item: T) => string,
  minScore: number = MATCH_MIN_SCORE
): FoodMatch<T> | null {
  let best: FoodMatch<T> | null = null;
  for (const food of catalogue) {
    const score = scoreFoodMatch(query, nameOf(food));
    if (score >= minScore && (!best || score > best.score)) best = { food, score };
  }
  return best;
}
