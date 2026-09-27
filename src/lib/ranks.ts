/**
 * Strength ranks — the Carthage ladder.
 *
 * A lift is worth something different on a 60 kg lifter and a 110 kg one, so a
 * rank is never read off the bar alone. Every ranked set becomes an estimated
 * one-rep max, that becomes a multiple of bodyweight, the multiple is scaled
 * to a reference bodyweight (strength grows with roughly the two-thirds power
 * of mass, so the ratio a lighter lifter can reach is higher), and the scaled
 * ratio is read against a standard for that lift and that sex. The result is a
 * score from 0 to 100, and the score sits on a ladder of eight tiers, each
 * split in three divisions.
 *
 * ── Where the standards come from ──
 * They are FitCoach's own table, set from the published strength-standard
 * literature (the multiples of bodyweight that coaches have used for decades:
 * a bodyweight bench, a double-bodyweight deadlift). They are NOT percentiles
 * of a population — this app has no population, it has one lifter on one
 * phone — and the screen says so. A standard is a yardstick, not a census.
 *
 * ── The ladder ──
 * Named for what Tunisia is made of, from the ground up: sand, clay, copper,
 * olive wood, coral, marble — then the city, then the general who took
 * elephants over the Alps.
 *
 * Everything here is pure: no database, no clock. `ranksRepo` feeds it.
 */

export type RankSex = 'male' | 'female';

// ── The ladder ───────────────────────────────────────────────────────────────

export interface RankTier {
  key: 'sand' | 'clay' | 'copper' | 'olive' | 'coral' | 'marble' | 'carthage' | 'hannibal';
  name: string;
  /** the word in Tunisian derja, as it is said */
  local: string;
  /** one line on why this rung is here */
  origin: string;
  /** the score at which the tier begins — a floor, not an average */
  floor: number;
  /** crest colour, and the darker shade behind it */
  color: string;
  shade: string;
}

export const RANK_TIERS: RankTier[] = [
  { key: 'sand', name: 'Sand', local: 'Rmal', origin: 'The Sahara starts everything. So does showing up.', floor: 0, color: '#D9B98A', shade: '#8C6F45' },
  { key: 'clay', name: 'Clay', local: 'Tin', origin: 'Nabeul turns earth into something that holds. Form first.', floor: 14, color: '#C9764F', shade: '#7A3F26' },
  { key: 'copper', name: 'Copper', local: 'Nhas', origin: 'Hammered in the souk, one strike at a time.', floor: 27, color: '#E0935A', shade: '#8A4E22' },
  { key: 'olive', name: 'Olive', local: 'Zitoun', origin: 'An olive tree takes years and then outlives you.', floor: 40, color: '#9DB86A', shade: '#4F6A2B' },
  { key: 'coral', name: 'Coral', local: 'Morjen', origin: 'Tabarka coral: brought up from deep water, slowly.', floor: 53, color: '#F2727F', shade: '#9A3040' },
  { key: 'marble', name: 'Marble', local: 'Rkham', origin: 'Chemtou marble built Rome. Few get quarried.', floor: 66, color: '#E9E4F5', shade: '#8E84B0' },
  { key: 'carthage', name: 'Carthage', local: 'Qartaj', origin: 'A city that made an empire nervous.', floor: 79, color: '#B58CFF', shade: '#5B3BA8' },
  { key: 'hannibal', name: 'Hannibal', local: 'Hannibal', origin: 'Elephants, over the Alps. Almost nobody.', floor: 91, color: '#F5C542', shade: '#9A6B0E' },
];

export type Division = 1 | 2 | 3;
export const DIVISION_LABEL: Record<Division, string> = { 1: 'I', 2: 'II', 3: 'III' };

export interface RankPlacement {
  score: number;
  tier: RankTier;
  tierIndex: number;
  /** III is the entry division of a tier, I its top */
  division: Division;
  /** "Olive II" */
  label: string;
  /** 0..1 through the current division */
  progress: number;
  /** the score where the next division (or tier) begins; null at the very top */
  nextAt: number | null;
  nextLabel: string | null;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Where a 0..100 score sits on the ladder. */
export function placeScore(raw: number): RankPlacement {
  const score = clamp(Number.isFinite(raw) ? raw : 0, 0, 100);
  let tierIndex = 0;
  for (let i = 0; i < RANK_TIERS.length; i++) if (score >= RANK_TIERS[i].floor) tierIndex = i;
  const tier = RANK_TIERS[tierIndex];
  const ceil = tierIndex + 1 < RANK_TIERS.length ? RANK_TIERS[tierIndex + 1].floor : 100;
  const span = (ceil - tier.floor) / 3;
  const band = Math.min(2, Math.floor((score - tier.floor) / span));
  const division = (3 - band) as Division;
  const bandFloor = tier.floor + band * span;
  const nextAtRaw = bandFloor + span;
  const top = tierIndex === RANK_TIERS.length - 1 && band === 2;
  const nextLabel = top
    ? null
    : band === 2
      ? `${RANK_TIERS[tierIndex + 1].name} III`
      : `${tier.name} ${DIVISION_LABEL[(division - 1) as Division]}`;
  return {
    score: Math.round(score * 10) / 10,
    tier,
    tierIndex,
    division,
    label: `${tier.name} ${DIVISION_LABEL[division]}`,
    progress: clamp((score - bandFloor) / span, 0, 1),
    nextAt: top ? null : Math.round(nextAtRaw * 10) / 10,
    nextLabel,
  };
}

// ── The standards ────────────────────────────────────────────────────────────

export type Pillar = 'push' | 'pull' | 'legs' | 'hinge';
export const PILLAR_LABEL: Record<Pillar, string> = { push: 'Push', pull: 'Pull', legs: 'Legs', hinge: 'Hinge' };

export type StandardKey =
  | 'bench'
  | 'press'
  | 'dip'
  | 'row'
  | 'pullup'
  | 'pulldown'
  | 'curl'
  | 'squat'
  | 'legpress'
  | 'deadlift'
  | 'hipthrust'
  | 'clean';

export interface Standard {
  key: StandardKey;
  label: string;
  pillar: Pillar;
  /** muscle groups this lift speaks for on the bodygraph */
  muscles: string[];
  /**
   * Multiples of bodyweight, for a male lifter at the reference bodyweight,
   * that earn a score of 20, 40, 60, 80 and 100.
   */
  male: [number, number, number, number, number];
  /** the female standard as a share of the male one */
  femaleFactor: number;
}

export const SCORE_ANCHORS = [20, 40, 60, 80, 100] as const;
export const REFERENCE_BODYWEIGHT: Record<RankSex, number> = { male: 80, female: 65 };

export const STANDARDS: Record<StandardKey, Standard> = {
  bench: { key: 'bench', label: 'Bench press', pillar: 'push', muscles: ['chest', 'triceps'], male: [0.6, 1.0, 1.4, 1.8, 2.2], femaleFactor: 0.62 },
  press: { key: 'press', label: 'Overhead press', pillar: 'push', muscles: ['shoulders'], male: [0.4, 0.62, 0.85, 1.1, 1.35], femaleFactor: 0.62 },
  dip: { key: 'dip', label: 'Dip', pillar: 'push', muscles: ['triceps', 'chest'], male: [0.96, 1.3, 1.65, 2.05, 2.45], femaleFactor: 0.8 },
  row: { key: 'row', label: 'Row', pillar: 'pull', muscles: ['back'], male: [0.55, 0.85, 1.15, 1.5, 1.85], femaleFactor: 0.65 },
  pullup: { key: 'pullup', label: 'Pull-up', pillar: 'pull', muscles: ['back', 'biceps'], male: [0.96, 1.2, 1.5, 1.8, 2.1], femaleFactor: 0.82 },
  pulldown: { key: 'pulldown', label: 'Pulldown', pillar: 'pull', muscles: ['back'], male: [0.55, 0.85, 1.1, 1.4, 1.7], femaleFactor: 0.65 },
  curl: { key: 'curl', label: 'Curl', pillar: 'pull', muscles: ['biceps', 'forearms'], male: [0.25, 0.42, 0.6, 0.78, 0.95], femaleFactor: 0.6 },
  squat: { key: 'squat', label: 'Squat', pillar: 'legs', muscles: ['quads', 'glutes'], male: [0.8, 1.3, 1.8, 2.35, 2.9], femaleFactor: 0.75 },
  legpress: { key: 'legpress', label: 'Leg press', pillar: 'legs', muscles: ['quads'], male: [1.5, 2.5, 3.5, 4.5, 5.5], femaleFactor: 0.75 },
  deadlift: { key: 'deadlift', label: 'Deadlift', pillar: 'hinge', muscles: ['hamstrings', 'back', 'glutes'], male: [1.0, 1.6, 2.15, 2.7, 3.3], femaleFactor: 0.75 },
  hipthrust: { key: 'hipthrust', label: 'Hip thrust', pillar: 'hinge', muscles: ['glutes'], male: [0.9, 1.5, 2.1, 2.75, 3.4], femaleFactor: 0.85 },
  clean: { key: 'clean', label: 'Clean', pillar: 'hinge', muscles: ['glutes', 'back'], male: [0.5, 0.8, 1.1, 1.4, 1.7], femaleFactor: 0.68 },
};

/**
 * Which exercises are ranked, and how each compares with its standard lift.
 * `factor` is the share of the standard lift this variation typically moves:
 * an incline bench is ~85% of a flat bench, so an incline 1RM is divided by
 * 0.85 before it is read against the bench standard. Dumbbell entries are per
 * dumbbell, which is how the app logs them.
 *
 * Anything not listed here is not ranked — a lateral raise has no honest
 * standard, and a rank invented for it would be decoration.
 */
export const RANKED_LIFTS: Record<string, { standard: StandardKey; factor: number }> = {
  // ── bench ──
  'bench-press-barbell': { standard: 'bench', factor: 1 },
  'bench-press-incline-barbell': { standard: 'bench', factor: 0.85 },
  'bench-press-decline-barbell': { standard: 'bench', factor: 1.03 },
  'bench-press-close-grip': { standard: 'bench', factor: 0.9 },
  'floor-press-barbell': { standard: 'bench', factor: 0.9 },
  'pin-bench-press': { standard: 'bench', factor: 0.92 },
  'spoto-press': { standard: 'bench', factor: 0.92 },
  'smith-bench-press': { standard: 'bench', factor: 1 },
  'db-bench-press': { standard: 'bench', factor: 0.41 },
  'db-incline-press': { standard: 'bench', factor: 0.36 },
  'chest-press-machine': { standard: 'bench', factor: 1.05 },
  // ── overhead ──
  'overhead-press': { standard: 'press', factor: 1 },
  'push-press': { standard: 'press', factor: 1.25 },
  'z-press': { standard: 'press', factor: 0.82 },
  'behind-neck-press': { standard: 'press', factor: 0.9 },
  'db-shoulder-press': { standard: 'press', factor: 0.4 },
  'arnold-press': { standard: 'press', factor: 0.36 },
  'machine-shoulder-press': { standard: 'press', factor: 1.1 },
  'smith-shoulder-press': { standard: 'press', factor: 1.05 },
  // ── dips ──
  dip: { standard: 'dip', factor: 1 },
  'ring-dip': { standard: 'dip', factor: 0.92 },
  // ── rows ──
  'barbell-row': { standard: 'row', factor: 1 },
  'pendlay-row': { standard: 'row', factor: 0.95 },
  'yates-row': { standard: 'row', factor: 1.05 },
  't-bar-row': { standard: 'row', factor: 1 },
  'seal-row': { standard: 'row', factor: 0.85 },
  'db-one-arm-row': { standard: 'row', factor: 0.45 },
  'db-bent-over-row': { standard: 'row', factor: 0.42 },
  'seated-cable-row': { standard: 'row', factor: 1 },
  'machine-row': { standard: 'row', factor: 1.05 },
  // ── vertical pull ──
  'pull-up': { standard: 'pullup', factor: 1 },
  'pull-up-wide': { standard: 'pullup', factor: 0.97 },
  'pull-up-neutral': { standard: 'pullup', factor: 1.02 },
  'chin-up': { standard: 'pullup', factor: 1.04 },
  'muscle-up': { standard: 'pullup', factor: 0.8 },
  'lat-pulldown': { standard: 'pulldown', factor: 1 },
  'lat-pulldown-close': { standard: 'pulldown', factor: 1.03 },
  'lat-pulldown-reverse': { standard: 'pulldown', factor: 1.03 },
  // ── curls ──
  'barbell-curl': { standard: 'curl', factor: 1 },
  'ez-bar-curl': { standard: 'curl', factor: 1 },
  'db-curl': { standard: 'curl', factor: 0.45 },
  'hammer-curl': { standard: 'curl', factor: 0.5 },
  // ── squat ──
  'back-squat': { standard: 'squat', factor: 1 },
  'front-squat': { standard: 'squat', factor: 0.83 },
  'pause-squat': { standard: 'squat', factor: 0.9 },
  'box-squat': { standard: 'squat', factor: 0.95 },
  'zercher-squat': { standard: 'squat', factor: 0.75 },
  'overhead-squat': { standard: 'squat', factor: 0.62 },
  'barbell-hack-squat': { standard: 'squat', factor: 0.8 },
  'goblet-squat': { standard: 'squat', factor: 0.35 },
  'bulgarian-split-squat': { standard: 'squat', factor: 0.27 },
  'leg-press': { standard: 'legpress', factor: 1 },
  // ── hinge ──
  deadlift: { standard: 'deadlift', factor: 1 },
  'sumo-deadlift': { standard: 'deadlift', factor: 1 },
  'trap-bar-deadlift': { standard: 'deadlift', factor: 1.06 },
  'romanian-deadlift': { standard: 'deadlift', factor: 0.78 },
  'stiff-leg-deadlift': { standard: 'deadlift', factor: 0.75 },
  'deficit-deadlift': { standard: 'deadlift', factor: 0.92 },
  'rack-pull': { standard: 'deadlift', factor: 1.12 },
  'snatch-grip-deadlift': { standard: 'deadlift', factor: 0.88 },
  'db-romanian-deadlift': { standard: 'deadlift', factor: 0.33 },
  'barbell-hip-thrust': { standard: 'hipthrust', factor: 1 },
  'barbell-glute-bridge': { standard: 'hipthrust', factor: 1.1 },
  'power-clean': { standard: 'clean', factor: 1 },
  'hang-power-clean': { standard: 'clean', factor: 0.95 },
  'clean-and-jerk': { standard: 'clean', factor: 1.05 },
};

export const isRankedLift = (slug: string | null | undefined): boolean => !!slug && slug in RANKED_LIFTS;

/** A set's reps count toward a 1RM estimate only this far — past it, it is endurance. */
export const RANK_REP_CAP = 20;

/** The anchors a lifter of this sex is read against, as multiples of bodyweight. */
export function anchorsFor(standard: StandardKey, sex: RankSex): number[] {
  const s = STANDARDS[standard];
  return sex === 'female' ? s.male.map((r) => r * s.femaleFactor) : [...s.male];
}

/**
 * Scale a bodyweight ratio to the reference bodyweight. Strength grows with
 * about mass^(2/3), so load ÷ mass falls with mass^(1/3): a 60 kg lifter's
 * 1.5× is a smaller feat than a 100 kg lifter's 1.5×, and this says by how much.
 */
export function scaledRatio(loadKg: number, bodyweightKg: number, sex: RankSex): number {
  const bw = clamp(bodyweightKg, 40, 160);
  if (!(loadKg > 0)) return 0;
  return (loadKg / bw) * Math.cbrt(bw / REFERENCE_BODYWEIGHT[sex]);
}

/** A scaled ratio read against the anchors: 0..100, straight lines between them. */
export function scoreFromRatio(ratio: number, anchors: number[]): number {
  if (!(ratio > 0)) return 0;
  // Below the first anchor the line runs down to zero at half of it.
  const xs = [anchors[0] * 0.5, ...anchors];
  const ys = [0, ...SCORE_ANCHORS];
  if (ratio <= xs[0]) return 0;
  for (let i = 1; i < xs.length; i++) {
    if (ratio <= xs[i]) {
      const t = (ratio - xs[i - 1]) / (xs[i] - xs[i - 1]);
      return ys[i - 1] + t * (ys[i] - ys[i - 1]);
    }
  }
  return 100;
}

/** The inverse: the scaled ratio a score asks for. */
export function ratioForScore(score: number, anchors: number[]): number {
  const s = clamp(score, 0, 100);
  const xs = [anchors[0] * 0.5, ...anchors];
  const ys = [0, ...SCORE_ANCHORS];
  for (let i = 1; i < ys.length; i++) {
    if (s <= ys[i]) {
      const t = (s - ys[i - 1]) / (ys[i] - ys[i - 1]);
      return xs[i - 1] + t * (xs[i] - xs[i - 1]);
    }
  }
  return xs[xs.length - 1];
}

/**
 * Score one lift. `oneRmKg` is the estimated 1RM of THIS exercise, in the real
 * kilograms moved (bodyweight share included for pull-ups and dips).
 */
export function scoreLift(slug: string, oneRmKg: number, bodyweightKg: number, sex: RankSex): number | null {
  const def = RANKED_LIFTS[slug];
  if (!def || !(oneRmKg > 0) || !(bodyweightKg > 0)) return null;
  const equivalent = oneRmKg / def.factor;
  return scoreFromRatio(scaledRatio(equivalent, bodyweightKg, sex), anchorsFor(def.standard, sex));
}

/** The 1RM, in this exercise's own kilograms, that a score would take. */
export function oneRmForScore(slug: string, score: number, bodyweightKg: number, sex: RankSex): number | null {
  const def = RANKED_LIFTS[slug];
  if (!def || !(bodyweightKg > 0)) return null;
  const bw = clamp(bodyweightKg, 40, 160);
  const ratio = ratioForScore(score, anchorsFor(def.standard, sex));
  const equivalent = (ratio / Math.cbrt(bw / REFERENCE_BODYWEIGHT[sex])) * bw;
  return equivalent * def.factor;
}

// ── Rolling it up ────────────────────────────────────────────────────────────

export interface LiftScore {
  slug: string;
  standard: StandardKey;
  score: number;
  oneRmKg: number;
}

export interface OverallRank {
  /** mean of the best score in each pillar that has one */
  score: number;
  placement: RankPlacement;
  pillars: Partial<Record<Pillar, number>>;
  /** fewer than three pillars ranked: the number stands, but it is a sketch */
  provisional: boolean;
  /** pillars with nothing logged yet */
  missing: Pillar[];
}

export const PILLARS: Pillar[] = ['push', 'pull', 'legs', 'hinge'];

/** The best score each pillar holds. */
export function pillarScores(lifts: LiftScore[]): Partial<Record<Pillar, number>> {
  const out: Partial<Record<Pillar, number>> = {};
  for (const l of lifts) {
    const p = STANDARDS[l.standard].pillar;
    if (out[p] == null || l.score > out[p]!) out[p] = l.score;
  }
  return out;
}

/**
 * The overall rank: the mean of the pillars. A lifter with a huge bench and
 * no legs is ranked on what they have — and told it is provisional — rather
 * than punished with zeros for lifts they may simply not have logged yet.
 */
export function overallRank(lifts: LiftScore[]): OverallRank | null {
  const pillars = pillarScores(lifts);
  const have = PILLARS.filter((p) => pillars[p] != null);
  if (!have.length) return null;
  const score = have.reduce((s, p) => s + pillars[p]!, 0) / have.length;
  return {
    score: Math.round(score * 10) / 10,
    placement: placeScore(score),
    pillars,
    provisional: have.length < 3,
    missing: PILLARS.filter((p) => pillars[p] == null),
  };
}

/** The best score speaking for each muscle group — what shades the bodygraph. */
export function muscleScores(lifts: LiftScore[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of lifts) {
    for (const m of STANDARDS[l.standard].muscles) {
      if (out[m] == null || l.score > out[m]) out[m] = l.score;
    }
  }
  return out;
}
