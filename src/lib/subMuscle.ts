/**
 * Sub-muscle resolution.
 *
 * Only ~100 of the built-in exercises carry an explicit `subMuscle`, but the
 * app should still be able to tell you which part of a muscle any exercise
 * emphasises. This infers a sensible sub-muscle from the exercise's name and
 * primary muscle when one isn't recorded — so every exercise can indicate a
 * sub-muscle, and the library can group a muscle's exercises by the region they
 * hit. Inference is a best-effort hint, never presented as gospel.
 */

export interface SubMuscleInput {
  name: string;
  primaryMuscle?: string | null;
  subMuscle?: string | null;
}

const has = (name: string, ...needles: string[]) => needles.some((n) => name.includes(n));

/** Infer the emphasised sub-muscle from name + primary muscle (lowercased). */
function infer(nameRaw: string, muscle: string): string | null {
  const n = nameRaw.toLowerCase();
  switch (muscle) {
    case 'chest':
      if (has(n, 'incline', 'decline push', 'pike')) return 'upper_chest';
      if (has(n, 'dip', 'decline', 'pseudo', 'lower', 'crossover')) return 'lower_chest';
      return 'mid_chest';
    case 'triceps':
      if (has(n, 'skull', 'overhead', 'french', 'extension')) return 'triceps_long';
      if (has(n, 'pushdown', 'kickback', 'diamond', 'press-down')) return 'triceps_lateral';
      return 'triceps_long';
    case 'biceps':
      if (has(n, 'hammer', 'reverse')) return 'brachialis';
      if (has(n, 'preacher', 'concentration', 'spider')) return 'biceps_short';
      if (has(n, 'incline')) return 'biceps_long';
      return 'biceps_long';
    case 'forearms':
      if (has(n, 'reverse wrist', 'extension', 'extensor')) return 'wrist_extensors';
      if (has(n, 'wrist curl', 'roller')) return 'wrist_flexors';
      if (has(n, 'reverse curl', 'hammer', 'supination', 'pronation')) return 'brachioradialis';
      if (has(n, 'grip', 'pinch', 'hold', 'hang', 'axle', 'farmer')) return 'grip';
      return 'grip';
    case 'quads':
      if (has(n, 'extension', 'sissy', 'step')) return 'rectus_femoris';
      if (has(n, 'hack', 'press', 'squat', 'lunge', 'split', 'pistol', 'shrimp')) return 'vastus';
      return 'rectus_femoris';
    case 'hamstrings':
      return 'hamstrings';
    case 'glutes':
      if (has(n, 'abduction', 'band walk', 'clam', 'medius', 'lateral')) return 'glute_med';
      return 'glute_max';
    case 'calves':
      if (has(n, 'seated', 'soleus')) return 'soleus';
      return 'gastrocnemius';
    case 'back':
      if (has(n, 'shrug', 'trap')) return 'traps';
      if (has(n, 'deadlift', 'hyper', 'good morning', 'good-morning', 'superman')) return 'lower_back';
      if (has(n, 'row', 'rear')) return 'mid_back';
      if (has(n, 'pulldown', 'pull-up', 'pull up', 'pullup', 'chin', 'lever', 'lat', 'pullover', 'muscle-up')) return 'lats';
      return 'lats';
    case 'shoulders':
      if (has(n, 'lateral', 'side')) return 'side_delt';
      if (has(n, 'rear', 'reverse fly', 'face pull')) return 'rear_delt';
      return 'front_delt';
    case 'core':
      if (has(n, 'oblique', 'woodchop', 'side', 'twist', 'rotation', 'windmill')) return 'obliques';
      if (has(n, 'leg raise', 'reverse crunch', 'hollow', 'dragon', 'l-sit', 'knee raise', 'flutter')) return 'lower_abs';
      if (has(n, 'crunch', 'sit-up', 'sit up', 'situp')) return 'upper_abs';
      return 'upper_abs';
    default:
      return null;
  }
}

/** Explicit sub-muscle if recorded, else an inferred one (or null). */
export function subMuscleOf(ex: SubMuscleInput): string | null {
  if (ex.subMuscle) return ex.subMuscle;
  if (!ex.primaryMuscle) return null;
  return infer(ex.name, ex.primaryMuscle);
}

/** Distinct sub-muscles present across a set of exercises, in first-seen order. */
export function subMusclesFor(list: SubMuscleInput[]): string[] {
  const seen: string[] = [];
  for (const ex of list) {
    const s = subMuscleOf(ex);
    if (s && !seen.includes(s)) seen.push(s);
  }
  return seen;
}
