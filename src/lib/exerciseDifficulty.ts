/**
 * How hard an exercise is, and who it is for.
 *
 * The library had no notion of this. Difficulty was guessed on demand from the
 * exercise's NAME by regular expression — "advanced" in the title made it hard,
 * "assisted" made it easy — which is a reasonable trick for finding an easier
 * alternative and a poor foundation for anything else. A pistol squat and a
 * bodyweight squat are the same word plus one; a muscle-up and a pull-up read
 * almost identically. Meanwhile the level a lifter had chosen changed how MANY
 * exercises they were given, and never WHICH.
 *
 * So difficulty is now a property of every exercise, on a five-point scale that
 * means something specific:
 *
 *   1  Anyone, first session, no learning required. Glute bridge, wall push-up.
 *   2  A beginner can be taught it in one session. Goblet squat, lat pulldown.
 *   3  The standard gym movement. Needs competence, not talent. Bench, squat,
 *      barbell row — most of the library sits here.
 *   4  Demands real strength or a skill that takes months. Weighted dip,
 *      pistol squat, handstand push-up against a wall.
 *   5  An advanced skill most people never own. Muscle-up, front lever,
 *      planche, one-arm pull-up.
 *
 * ── Where the number comes from ──
 * Authored on the exercise when it is known; otherwise derived from what the
 * exercise IS rather than what it is called: the equipment sets a floor (a
 * machine constrains the path, a barbell does not), the movement pattern
 * adjusts it (an overhead press asks more of a novice than a curl), and a
 * small set of named skills override everything because no rule will ever
 * derive that a human flag is harder than a lateral raise.
 *
 * ── What it is for ──
 * Matching exercises to the level the lifter chose, so a beginner is offered
 * movements they can perform and an advanced lifter is not padded with wall
 * push-ups. Suitability is deliberately a BAND rather than a cutoff: every
 * level can see everything, but each has a range that fits, and the library
 * can lead with it.
 *
 * Pure functions; scripts/verify-engines.ts checks the distribution against the
 * real library so this cannot quietly collapse into "everything is a 3".
 */

import type { ExperienceLevel } from './level';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: 'Anyone',
  2: 'Beginner',
  3: 'Standard',
  4: 'Hard',
  5: 'Elite',
};

export const DIFFICULTY_BLURBS: Record<Difficulty, string> = {
  1: 'No learning curve — a first session can include this.',
  2: 'Learnable in one session with a cue or two.',
  3: 'The standard gym movement; needs competence, not talent.',
  4: 'Demands real strength or a skill that takes months.',
  5: 'An advanced skill most people never own.',
};

/** What a piece of equipment asks of you before the movement even starts. */
const EQUIPMENT_BASE: Record<string, number> = {
  // The machine holds the path for you — that is the whole point of a machine.
  machine: 2,
  cable: 2.5,
  // Someone hands you the weight and the path is yours to control.
  dumbbell: 3,
  barbell: 3.5,
  // Your own body, which is where both the easiest and the hardest things live.
  bodyweight: 3,
  other: 3,
};

/** Some patterns are simply harder to own than others. */
const PATTERN_ADJUST: Record<string, number> = {
  vertical_push: 0.5, // overhead demands shoulder mobility and a braced trunk
  vertical_pull: 0.5, // most beginners cannot yet do one
  hinge: 0.5, // the pattern most often taught wrong
  squat: 0.25,
  carry: -0.25,
  lunge: 0.25,
  isolation: -0.5,
  biceps_curl: -0.75,
  lateral_raise: -0.75,
  triceps_extension: -0.5,
  core: -0.25,
  mobility: -1,
  cardio: -0.5,
};

/**
 * Named skills, where no rule will ever reach the right answer.
 *
 * Matched on the slug, which is stable, rather than the display name, which is
 * not. Substring matching, so a family ("front-lever", "front-lever-tuck")
 * shares a floor unless a more specific entry overrides it — longest match wins.
 */
const SKILL_OVERRIDES: Array<[string, Difficulty]> = [
  // ── 5: the ones almost nobody gets ──
  ['planche', 5],
  ['front-lever', 5],
  ['back-lever', 5],
  ['human-flag', 5],
  ['one-arm-pull-up', 5],
  ['one-arm-chin', 5],
  ['muscle-up', 5],
  ['iron-cross', 5],
  ['manna', 5],
  ['handstand-push-up-freestanding', 5],
  ['freestanding-handstand', 5],
  ['dragon-flag', 5],
  ['ninety-degree-push-up', 5],
  // ── 4: real strength or months of practice ──
  ['pistol-squat', 4],
  ['shrimp-squat', 4],
  ['nordic', 4],
  ['handstand-push-up', 4],
  ['handstand-hold', 4],
  ['wall-handstand', 4],
  ['l-sit', 4],
  ['skin-the-cat', 4],
  ['ring-dip', 4],
  ['ring-muscle', 5],
  ['archer-push-up', 4],
  ['archer-pull-up', 4],
  ['one-arm-push-up', 4],
  ['weighted-dip', 4],
  ['weighted-pull-up', 4],
  ['sissy-squat', 4],
  ['glute-ham-raise', 4],
  ['snatch', 4],
  ['clean-and-jerk', 4],
  ['overhead-squat', 4],
  ['turkish-get-up', 4],
  ['windshield-wiper', 4],
  ['toes-to-bar', 4],
  ['tuck-planche', 4],
  ['korean-dip', 4],
  // ── 2: the regressions that make a start possible ──
  ['wall-push-up', 1],
  ['knee-push-up', 1],
  ['incline-pushup', 2],
  ['push-up-incline', 2],
  ['assisted', 2],
  ['band-assisted', 2],
  ['negative', 2],
  ['inverted-row', 2],
  ['australian', 2],
  ['glute-bridge', 1],
  ['dead-bug', 1],
  ['bird-dog', 1],
  ['wall-sit', 2],
  ['wall-slide', 1],
  ['cat-cow', 1],
];

const clamp5 = (n: number): Difficulty => Math.max(1, Math.min(5, Math.round(n))) as Difficulty;

/** The named-skill answer for a slug, when there is one. Longest match wins. */
export function skillDifficulty(slug: string): Difficulty | null {
  const s = slug.toLowerCase();
  let best: [string, Difficulty] | null = null;
  for (const entry of SKILL_OVERRIDES) {
    if (!s.includes(entry[0])) continue;
    if (!best || entry[0].length > best[0].length) best = entry;
  }
  return best ? best[1] : null;
}

export interface DifficultyInput {
  slug: string;
  equipmentType?: string | null;
  pattern?: string | null;
  /** already-authored value, which always wins */
  difficulty?: number | null;
}

/**
 * The difficulty of an exercise: authored if it has one, a named skill if it is
 * one, and otherwise derived from its equipment and movement pattern.
 */
export function difficultyOf(ex: DifficultyInput): Difficulty {
  if (ex.difficulty != null && ex.difficulty >= 1 && ex.difficulty <= 5) {
    return Math.round(ex.difficulty) as Difficulty;
  }
  const skill = skillDifficulty(ex.slug);
  if (skill != null) return skill;

  const base = EQUIPMENT_BASE[ex.equipmentType ?? 'other'] ?? 3;
  const adjust = PATTERN_ADJUST[ex.pattern ?? ''] ?? 0;
  return clamp5(base + adjust);
}

// ── Matching exercises to the lifter ──────────────────────────────────────────

/**
 * The difficulty band that fits each level.
 *
 * Bands overlap, and deliberately: a beginner should meet a few standard
 * movements or they never progress, and an advanced lifter still warms up on
 * easy ones. Nothing is ever hidden — this decides what is OFFERED first, not
 * what exists.
 */
export const LEVEL_BAND: Record<ExperienceLevel, [Difficulty, Difficulty]> = {
  beginner: [1, 3],
  intermediate: [2, 4],
  advanced: [2, 5],
};

/** Where a level's offering should centre. */
const LEVEL_IDEAL: Record<ExperienceLevel, number> = { beginner: 2, intermediate: 3, advanced: 4 };

/** Does this difficulty sit in the band for that level? */
export function suitsLevel(difficulty: Difficulty, level: ExperienceLevel): boolean {
  const [lo, hi] = LEVEL_BAND[level];
  return difficulty >= lo && difficulty <= hi;
}

/**
 * How well an exercise fits a level, 0..1 — for ordering rather than filtering.
 * Peaks at the level's ideal and falls away either side, so a beginner's list
 * leads with 2s, shows 1s and 3s behind them, and buries the muscle-up.
 */
export function levelFit(difficulty: Difficulty, level: ExperienceLevel): number {
  const gap = Math.abs(difficulty - LEVEL_IDEAL[level]);
  return Math.max(0, 1 - gap * 0.28);
}

/** Plain reason an exercise is or is not a fit, for the UI. */
export function levelNote(difficulty: Difficulty, level: ExperienceLevel): string | null {
  if (suitsLevel(difficulty, level)) return null;
  const [lo, hi] = LEVEL_BAND[level];
  if (difficulty > hi) {
    return level === 'beginner'
      ? 'Harder than a beginner should start with — build to it.'
      : 'A step beyond your level; treat it as a goal rather than a staple.';
  }
  if (difficulty < lo) return 'Easier than your level needs — useful as a warm-up.';
  return null;
}
