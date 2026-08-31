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

/**
 * Crude singular form — enough for food names, which are rarely irregular.
 *
 * Only "-es" after a sibilant or an o is a two-letter plural ending
 * (tomatoes, radishes, boxes); everywhere else the e belongs to the word.
 * Stripping it blindly turned "apples" into "appl" and "oranges" into
 * "orang", so a photographed apple matched nothing in a catalogue that has
 * Apple — and was saved as a duplicate food instead.
 */
function singular(token: string): string {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 3 && /(?:s|x|z|ch|sh|o)es$/.test(token)) return token.slice(0, -2);
  // "-us", "-is" and "-ss" endings are part of the word, not a plural:
  // couscous, hummus, harissa's cousins. Stripping them invents non-words.
  if (token.length > 3 && /[^usi]s$/.test(token)) return token.slice(0, -1);
  return token;
}

/**
 * A catalogue name without its bracketed description.
 *
 * The catalogue qualifies foods in brackets — "Tuna (canned in water)",
 * "Harissa (chili paste)" — and those words describe, they don't identify.
 * Left in, they are matchable identity: the word "water" beside a plate found
 * the tuna and logged a tin of fish as a glass of water.
 */
function withoutBrackets(s: string): string {
  return s.replace(/\([^)]*\)/g, ' ');
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
  const all = nameTokens(withoutBrackets(s));
  const core = all.filter((t) => !QUALIFIERS.has(t));
  // A name made only of qualifiers ("fillet") still has to match on something.
  return core.length > 0 ? core : all;
}

/**
 * The preparation words of a food name, in a common form.
 *
 * "roast" and "roasted" are the same instruction, but compared literally they
 * miss each other — so "roast chicken" took no bonus from "Chicken, Whole
 * Roasted" and landed on fried chicken instead, a 74 kcal per 100 g difference.
 * Trimming a trailing "-ed" on both sides makes the pair meet.
 */
export function qualifierTokens(s: string): string[] {
  return nameTokens(s)
    .filter((t) => QUALIFIERS.has(t))
    .map((t) => (t.length > 4 && t.endsWith('ed') ? t.slice(0, -2) : t));
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

  /*
   * Focus has to carry real weight, or a one-word name matches anything
   * containing it: "butter" scored 0.775 against Peanut Butter and "nuts"
   * against a Chocolate Bar with Nuts, logging a different food's macros.
   * Requiring the candidate to be mostly about the query too — not merely to
   * contain it — is what separates "couscous" (the whole name) from "nuts"
   * (a third of one).
   */
  return Math.min(0.99, coverage * 0.6 + focus * 0.25 + qualBonus * 0.15);
}

export interface FoodMatch<T> {
  food: T;
  score: number;
}

/**
 * Good enough to use the catalogue's numbers instead of asking the model.
 * The query must be covered AND the candidate must be mostly about it.
 */
export const MATCH_MIN_SCORE = 0.75;

/**
 * Best catalogue food for a name, or null when nothing is close enough — or
 * when the field is tied.
 *
 * A tie is genuine ambiguity, not a near miss: "milk" fits eleven catalogue
 * entries equally well, and picking one meant picking by array position, which
 * silently favoured whichever custom food had been created most recently. Being
 * unsure is the honest answer; the caller researches the name instead.
 *
 * `nameOf` reads the display name from whatever shape the caller holds.
 */
export function matchFood<T>(
  query: string,
  catalogue: readonly T[],
  nameOf: (item: T) => string,
  minScore: number = MATCH_MIN_SCORE
): FoodMatch<T> | null {
  let best: FoodMatch<T> | null = null;
  let bestIdentity = '';
  let ambiguous = false;
  for (const food of catalogue) {
    const name = nameOf(food);
    const score = scoreFoodMatch(query, name);
    if (score < minScore) continue;
    const identity = [...coreTokens(name)].sort().join(' ');
    if (!best || score > best.score) {
      best = { food, score };
      bestIdentity = identity;
      ambiguous = false;
    } else if (score === best.score && identity !== bestIdentity) {
      /*
       * Two DIFFERENT foods fit equally well. "Apple" and "Apple (medium)" are
       * the same identity in two sizes and tie harmlessly; whole milk and
       * skimmed milk do not, and choosing between them by array position meant
       * silently preferring whichever custom food was created most recently.
       */
      ambiguous = true;
    }
  }
  // An exact name wins outright even if something else ties it.
  if (best && ambiguous && best.score < 1) return null;
  return best;
}
