/**
 * "This one's too hard — find me an easier alternative."
 *
 * Exercises don't carry a stored difficulty, so we estimate one from equipment
 * and the movement's name (bodyweight skill work scales enormously), then offer
 * easier exercises **that train the same thing**.
 *
 * ── Why the matching is strict ──
 * The first version accepted any exercise sharing ANY muscle group. That reads
 * as random in use, and it is: a bench press lists triceps among its groups, so
 * swapping a triceps extension could offer you a bench press — a different
 * movement, a different primary muscle, and no easier. Worse, it would happily
 * trade a rear-delt fly for an overhead press, which is the exact substitution
 * that builds the imbalance the rear-delt work existed to fix.
 *
 * So a candidate must now share the **primary muscle**, full stop. Within that,
 * exercises hitting the same **sub-muscle** (long head vs lateral head, front
 * delt vs rear delt) rank above ones that merely share the muscle group. If
 * nothing suitable exists, the honest answer is an empty list rather than a
 * plausible-looking wrong one.
 */

export interface AltExercise {
  id: number;
  slug: string | null;
  name: string;
  primaryMuscle?: string | null;
  subMuscle?: string | null;
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

/**
 * How well a candidate replaces the target, 2 (same sub-muscle) down to 0 (no).
 * Zero is disqualifying — it is not a weak match, it is a different exercise.
 */
export type MatchQuality = 0 | 1 | 2;

export function matchQuality(target: AltExercise, candidate: AltExercise): MatchQuality {
  // No primary muscle on either side means we cannot make the guarantee.
  if (!target.primaryMuscle || !candidate.primaryMuscle) return 0;
  if (target.primaryMuscle !== candidate.primaryMuscle) return 0;

  /*
   * Same muscle is not enough when the heads do different jobs. The front and
   * rear delt are the clearest case: both are "shoulders", but one presses and
   * one pulls, so offering an overhead press in place of a rear-delt fly is the
   * exact substitution that builds the imbalance the fly existed to correct.
   * When the target names a head, the replacement has to train that head.
   */
  if (target.subMuscle) {
    return candidate.subMuscle === target.subMuscle ? 2 : 0;
  }
  // The target isn't tagged, so the muscle is all we can honestly match on.
  return 1;
}

const FLOW: Record<string, string> = {
  strength: 'lifting', calisthenics: 'lifting',
  cardio: 'cardio', outdoor: 'cardio', sport: 'cardio', martial_arts: 'cardio',
  mindbody: 'mindbody', meditation: 'mindbody',
};

export interface AltResult extends AltExercise {
  difficulty: number;
  match: MatchQuality;
  /** true when it trains the identical sub-muscle, not just the same muscle */
  exactSubMuscle: boolean;
}

/**
 * Easier exercises for the same muscle, best match first.
 *
 * Ordering: same sub-muscle before same muscle, then closest-easier first, so
 * the top suggestion is the smallest honest step down. If nothing in the
 * library is strictly easier, same-difficulty alternatives are offered instead
 * (a lateral swap is still useful — a machine version of a free-weight lift can
 * be the same difficulty but far kinder to a sore joint).
 */
export function findEasierAlternatives(
  target: AltExercise,
  all: AltExercise[],
  limit = 6
): AltResult[] {
  const td = estimateDifficulty(target);
  const flow = FLOW[target.sessionType];

  const scored = all
    .filter((e) => e.id !== target.id && FLOW[e.sessionType] === flow)
    .map((e) => ({ ...e, match: matchQuality(target, e), difficulty: estimateDifficulty(e) }))
    // A different primary muscle is not an alternative, it's a different exercise.
    .filter((e) => e.match > 0);

  const easier = scored.filter((e) => e.difficulty < td);
  const pool = easier.length ? easier : scored.filter((e) => e.difficulty <= td);

  return pool
    .sort(
      (a, b) =>
        b.match - a.match || // same sub-muscle first
        b.difficulty - a.difficulty || // then the smallest step down
        a.name.localeCompare(b.name)
    )
    .slice(0, limit)
    .map((e) => ({ ...e, exactSubMuscle: e.match === 2 }));
}
