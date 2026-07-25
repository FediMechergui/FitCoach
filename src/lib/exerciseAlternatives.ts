/**
 * "This one's too hard — find me an easier alternative."
 *
 * Exercises don't carry a stored difficulty, so we estimate one from equipment
 * and the movement's name (bodyweight skill work scales enormously), then offer
 * same-muscle exercises that are easier. Heuristic, but good enough to suggest a
 * sensible regression mid-session.
 */

export interface AltExercise {
  id: number;
  slug: string | null;
  name: string;
  primaryMuscle?: string | null;
  muscleGroups: string[];
  equipmentType?: string | null;
  sessionType: string;
}

const EQUIP_BASE: Record<string, number> = {
  machine: 1.5,
  cable: 2,
  band: 1.5,
  dumbbell: 2.5,
  barbell: 3,
  bodyweight: 3,
  other: 2.5,
};

const HARDER = /(one[-\s]?arm|one[-\s]?leg|planche|muscle[-\s]?up|front lever|back lever|human flag|dragon flag|pistol|handstand push|one arm)/i;
const HARDISH = /(archer|pseudo|typewriter|ring|tuck|shrimp|sissy|nordic|deficit|explosive|plyo|clap)/i;
const EASIER = /(assisted|incline|knee|negative|wall|chair|box|band|machine|seated|supported|bench|smith|goblet|half)/i;
const SKILL = /(deadlift|squat|clean|snatch|overhead|jerk|turkish)/i;

/** Estimated difficulty on a 1 (easiest) – 5 (hardest) scale. */
export function estimateDifficulty(ex: AltExercise): number {
  const n = ex.name.toLowerCase();
  let d = ex.equipmentType && EQUIP_BASE[ex.equipmentType] != null ? EQUIP_BASE[ex.equipmentType] : 2.5;
  if (HARDER.test(n)) d += 2;
  else if (HARDISH.test(n)) d += 1;
  if (EASIER.test(n)) d -= 1;
  if (SKILL.test(n)) d += 0.5;
  return Math.max(1, Math.min(5, Math.round(d)));
}

const shareMuscle = (a: AltExercise, b: AltExercise) => {
  if (a.primaryMuscle && b.primaryMuscle && a.primaryMuscle === b.primaryMuscle) return true;
  return a.muscleGroups.some((m) => b.muscleGroups.includes(m));
};

const FLOW: Record<string, string> = {
  strength: 'lifting', calisthenics: 'lifting',
  cardio: 'cardio', outdoor: 'cardio', sport: 'cardio', martial_arts: 'cardio',
  mindbody: 'mindbody', meditation: 'mindbody',
};

/**
 * Same-muscle exercises that are easier than `target`, closest-easier first.
 * Falls back to same-or-easier if nothing is strictly easier.
 */
export function findEasierAlternatives(target: AltExercise, all: AltExercise[], limit = 6): Array<AltExercise & { difficulty: number }> {
  const td = estimateDifficulty(target);
  const flow = FLOW[target.sessionType];
  const scored = all
    .filter((e) => e.id !== target.id && FLOW[e.sessionType] === flow && shareMuscle(target, e))
    .map((e) => ({ ...e, difficulty: estimateDifficulty(e) }));
  const easier = scored.filter((e) => e.difficulty < td);
  const pool = (easier.length ? easier : scored.filter((e) => e.difficulty <= td))
    .sort((a, b) => b.difficulty - a.difficulty || a.name.localeCompare(b.name));
  return pool.slice(0, limit);
}
