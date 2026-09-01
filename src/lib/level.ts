/**
 * Experience level — beginner, intermediate, advanced — and what it changes.
 *
 * The same split day is not the same session for a first-year lifter and a
 * tenth-year one. A beginner gets stronger on less: fewer exercises, fewer
 * sets, a rep range that teaches the movement, and rests that match the
 * lighter absolute loads. An advanced lifter needs more total work to keep
 * adapting, heavier ranges on the compounds, intensifiers on the isolation
 * work, and longer rests because heavier weights tax the nervous system more.
 *
 * The level lives on the profile, is pre-selected in every picker, and can be
 * changed in the picker itself (which also updates the profile). It shapes:
 *   • how many of a split day's / method's exercises are pre-loaded (the list
 *     is ordered compounds-first, so trimming keeps the ones that matter);
 *   • the sets × reps prescription shown with the session;
 *   • the rest between sets (lib/restPrescription scales by level).
 * Nothing here touches logged data.
 */

import type { ExperienceLevel } from './restPrescription';
import { suitsLevel, type Difficulty } from './exerciseDifficulty';
export type { ExperienceLevel } from './restPrescription';

export const EXPERIENCE_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

export const LEVEL_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Pro',
};

export const LEVEL_BLURBS: Record<ExperienceLevel, string> = {
  beginner: 'Under a year of consistent training, or coming back after a long break. Fewer exercises, 3 sets, a rep range that teaches the movement.',
  intermediate: 'One to three years; you know the lifts and progress needs managing. The full day, 3–4 sets, 6–12 reps.',
  advanced: 'Three years plus; progress is slow and earned. The full day plus an accessory, 4–5 sets, heavier compounds, intensifiers on isolation work, longer rests.',
};

export interface LevelPrescription {
  /** how many of the day's ordered exercises to pre-load (Infinity = all) */
  maxExercises: number;
  sets: string;
  reps: string;
  /** compound lifts */
  compoundReps: string;
  restHint: string;
  /** one line of how to progress at this level */
  progression: string;
}

export const LEVEL_PRESCRIPTION: Record<ExperienceLevel, LevelPrescription> = {
  beginner: {
    maxExercises: 4,
    sets: '3',
    reps: '8–12',
    compoundReps: '5–8',
    restHint: '~1.5–2 min (the app times it per set)',
    progression: 'Add a rep each session; when the top of the range is hit on every set, add the smallest weight and start again.',
  },
  intermediate: {
    maxExercises: Infinity,
    sets: '3–4',
    reps: '6–12',
    compoundReps: '4–8',
    restHint: '~2–3 min on compounds, 1–1.5 on isolation (the app times it per set)',
    progression: 'Double progression on isolation; a weekly top set on compounds that creeps up, with back-off sets behind it.',
  },
  advanced: {
    maxExercises: Infinity,
    sets: '4–5',
    reps: '5–12',
    compoundReps: '3–6',
    restHint: '~3–5 min on heavy compounds, 1.5–2 on isolation (the app times it per set)',
    progression: 'Waves and blocks rather than every-session adds; intensifiers (drop sets, rest-pause, myo-reps) on isolation work; deload every 4–6 weeks.',
  },
};

/**
 * Which of an ordered exercise list to pre-load at this level. Lists in the
 * data are compounds-first, so trimming for a beginner keeps the ones that
 * matter; advanced keeps everything.
 */
export function slugsForLevel(
  slugs: string[],
  level: ExperienceLevel,
  difficultyOfSlug?: (slug: string) => Difficulty | null
): string[] {
  const max = LEVEL_PRESCRIPTION[level].maxExercises;

  /*
   * Drop what the level has no business being handed before trimming by count.
   *
   * Level used to change only HOW MANY exercises were pre-loaded, never WHICH,
   * so a beginner's first session could open with a muscle-up as long as it sat
   * high enough in the list. Anything outside the level's band is removed here
   * — but only if enough remains to still be a session, because a thin day of
   * movements you can do beats a full one you cannot.
   */
  let list = slugs;
  if (difficultyOfSlug) {
    const fits = slugs.filter((slug) => {
      const d = difficultyOfSlug(slug);
      return d == null || suitsLevel(d, level);
    });
    if (fits.length >= Math.min(3, slugs.length)) list = fits;
  }

  return Number.isFinite(max) ? list.slice(0, max) : list;
}

/** The prescription in one line: "3 sets × 8–12 (compounds 5–8) · rest ~1.5–2 min". */
export function prescriptionLine(level: ExperienceLevel): string {
  const p = LEVEL_PRESCRIPTION[level];
  return `${p.sets} sets × ${p.reps} (compounds ${p.compoundReps}) · rest ${p.restHint}`;
}

/** NULL on the profile reads as intermediate — nothing changes until the user picks. */
export function levelOrDefault(v: string | null | undefined): ExperienceLevel {
  return v === 'beginner' || v === 'advanced' ? v : 'intermediate';
}
