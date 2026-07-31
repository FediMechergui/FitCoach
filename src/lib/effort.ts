import { clamp } from './format';

/**
 * How hard a set actually was — and what that means for growth.
 *
 * ── Why this exists ──
 * Counting "sets" treats a warm-up and an all-out set as the same thing. They
 * are not. Muscle fibres are recruited in order of size (Henneman's size
 * principle): the large, most growth-responsive motor units only join in once
 * the smaller ones fatigue, which happens in the closing reps of a hard set.
 * Stop five reps early and those fibres were barely involved.
 *
 * ── What the evidence actually says ──
 * Two things, and they point in different directions, which is why this module
 * refuses to simply reward failure:
 *
 *  · **For hypertrophy**, training closer to failure is modestly better, and
 *    the relationship is roughly continuous rather than a cliff at failure.
 *    Meta-analyses comparing sets to failure against sets stopped short find
 *    the difference small — real, but not the deciding factor. Going to failure
 *    is *not required* to grow.
 *  · **For strength**, going to failure is not better and may be slightly
 *    worse. It costs disproportionate fatigue, cuts the reps available in the
 *    sets that follow, and degrades technique exactly when the load is heavy.
 *
 *  · **The exception that matters for calisthenics**: with light loads and high
 *    reps, proximity to failure stops being optional. At low percentages of
 *    maximum, the high-threshold units are only reached at the very end of the
 *    set — studies training to failure at ~30% of max match heavy training,
 *    while the same light load stopped short does not. A set of push-ups with
 *    five left in the tank is a genuinely weaker stimulus than a heavy set of
 *    five with the same reserve.
 *
 * ── The model ──
 * "Stimulating reps" treats roughly the last five reps before failure as the
 * ones that drive growth. It is a **model**, not a measurement — a useful way
 * to express proximity as a number, not a claim about your muscle fibres. Every
 * label this module produces is worded to keep that distinction.
 *
 * ── Log safety ──
 * Effort is unknown for every set logged before this existed, and for anyone
 * who never fills in RPE. Unknown effort therefore gets **full credit**, so
 * nobody's history silently deflates. Only sets that are *known* to have been
 * easy are discounted.
 */

/** Reps in reserve at true failure. */
export const FAILURE_RIR = 0;
/**
 * How many reps before failure are treated as the stimulating ones. Five is the
 * figure the effective-reps model is usually stated with.
 */
export const STIMULATING_REP_WINDOW = 5;
/** Within this many reps of failure, a set counts as a full "hard set". */
export const HARD_SET_MAX_RIR = 4;
/** Past this reserve a set contributes essentially nothing to growth. */
export const NO_STIMULUS_RIR = 8;
/** Reps above which a set counts as light-load work, where failure matters more. */
export const LOW_LOAD_REP_THRESHOLD = 15;
/** Share of sets to failure past which fatigue starts outweighing the benefit. */
export const FAILURE_OVERUSE_SHARE = 0.6;

export interface SetEffort {
  reps: number | null;
  /** 1..10; 10 means failure */
  rpe: number | null;
  /** explicitly logged as taken to failure */
  toFailure: boolean;
  /** true when the load is the body, not a bar — changes what failure means */
  bodyweight?: boolean;
}

/**
 * Reps left in reserve, or null when we genuinely don't know.
 *
 * A logged "to failure" is the strongest signal there is and outranks RPE:
 * people round RPE, but they don't tick "to failure" by accident.
 */
export function repsInReserve(e: SetEffort): number | null {
  if (e.toFailure) return FAILURE_RIR;
  if (e.rpe != null && Number.isFinite(e.rpe) && e.rpe > 0) {
    return clamp(10 - e.rpe, 0, 10);
  }
  return null;
}

export type EffortKnowledge = 'failure' | 'rated' | 'unknown';

export function effortKnowledge(e: SetEffort): EffortKnowledge {
  if (e.toFailure) return 'failure';
  if (e.rpe != null && Number.isFinite(e.rpe) && e.rpe > 0) return 'rated';
  return 'unknown';
}

/**
 * The reps that carry the growth stimulus, under the effective-reps model.
 * Null when effort is unknown — an honest blank rather than a guess.
 */
export function stimulatingReps(e: SetEffort): number | null {
  const rir = repsInReserve(e);
  if (rir == null || e.reps == null || e.reps <= 0) return null;
  if (rir >= STIMULATING_REP_WINDOW) return 0;
  return Math.min(e.reps, STIMULATING_REP_WINDOW - rir);
}

/**
 * How much of a "hard set" this set is worth, 0..1.
 *
 * Full credit inside the 0–4 RIR band that the volume literature counts as a
 * working set, then a straight taper to nothing by 8 reps in reserve. Unknown
 * effort is worth a full set, which is exactly how every set was counted before
 * this feature existed.
 */
export function hardSetCredit(e: SetEffort): number {
  const rir = repsInReserve(e);
  if (rir == null) return 1;
  if (rir <= HARD_SET_MAX_RIR) return 1;
  return clamp((NO_STIMULUS_RIR - rir) / (NO_STIMULUS_RIR - HARD_SET_MAX_RIR), 0, 1);
}

/**
 * A light, high-rep set stopped well short of failure — the one case where
 * proximity isn't a matter of degree. Common in calisthenics, and the reason
 * "10 easy push-ups" builds much less than the rep count suggests.
 */
export function isUnderStimulatingLightSet(e: SetEffort): boolean {
  const rir = repsInReserve(e);
  if (rir == null || e.reps == null) return false;
  return e.reps >= LOW_LOAD_REP_THRESHOLD && rir >= 3;
}

/**
 * The RPE scale in plain words.
 *
 * RPE here is the **Reps In Reserve** version used in lifting, not the old
 * 6–20 Borg cardio scale: the number answers "how many more reps could you have
 * done?", so 10 means none and 8 means two. Anyone meeting it for the first
 * time reasonably assumes it's a 1–10 "how hard did that feel" rating, which is
 * a different thing entirely — hence the guide in every session.
 */
export interface RpeStep {
  rpe: number;
  /** short form for a compact strip: "2 left" */
  short: string;
  meaning: string;
  /** in the productive range for growth */
  productive: boolean;
}

export const RPE_SCALE: RpeStep[] = [
  { rpe: 10, short: 'failure', meaning: 'Could not have done another rep.', productive: true },
  { rpe: 9, short: '1 left', meaning: 'One more rep was in you, no more.', productive: true },
  { rpe: 8, short: '2 left', meaning: 'Two more reps were in you.', productive: true },
  { rpe: 7, short: '3 left', meaning: 'Three more reps — still hard, still counts.', productive: true },
  { rpe: 6, short: '4 left', meaning: 'Four more. Starting to drift out of the growth range.', productive: false },
  { rpe: 5, short: '5+ left', meaning: 'Comfortable. Warm-up territory.', productive: false },
];

/** What a given RPE means, for a one-line hint. */
export function rpeMeaning(rpe: number): string {
  if (!Number.isFinite(rpe)) return '';
  const rounded = clamp(Math.round(rpe), 1, 10);
  const step = RPE_SCALE.find((s) => s.rpe === rounded);
  if (step) return step.meaning;
  return RPE_SCALE[RPE_SCALE.length - 1].meaning; // anything ≤5 reads the same
}

/** Plain-language proximity, for the set list. */
export function proximityLabel(e: SetEffort): string {
  if (e.toFailure) return 'to failure';
  const rir = repsInReserve(e);
  if (rir == null) return '';
  if (rir === 0) return 'to failure';
  if (rir === 1) return '1 left';
  return `${rir} left`;
}

export interface EffortSummary {
  /** sets counted with proximity weighting */
  effectiveSets: number;
  /** raw completed sets, for comparison */
  rawSets: number;
  /** mean reps in reserve across sets we know about, or null */
  avgRir: number | null;
  /** share of sets explicitly taken to failure, 0..1 */
  failureShare: number;
  /** share of sets where effort is known at all, 0..1 — drives how loudly we speak */
  knownShare: number;
  /** total stimulating reps under the model, across sets we know about */
  stimulatingReps: number;
  /** light high-rep sets left too far from failure to do much */
  underStimulatingLightSets: number;
}

export function summariseEffort(sets: SetEffort[]): EffortSummary {
  let effectiveSets = 0;
  let rirSum = 0;
  let rirCount = 0;
  let failures = 0;
  let known = 0;
  let stim = 0;
  let lightMisses = 0;

  for (const s of sets) {
    effectiveSets += hardSetCredit(s);
    const rir = repsInReserve(s);
    if (rir != null) {
      rirSum += rir;
      rirCount += 1;
      known += 1;
    }
    if (s.toFailure) failures += 1;
    const sr = stimulatingReps(s);
    if (sr != null) stim += sr;
    if (isUnderStimulatingLightSet(s)) lightMisses += 1;
  }

  const n = sets.length;
  return {
    // Two decimals, not one: these get divided by 4 for the weekly average and
    // summed across a month, so rounding early visibly drifts the total.
    effectiveSets: Math.round(effectiveSets * 100) / 100,
    rawSets: n,
    avgRir: rirCount ? Math.round((rirSum / rirCount) * 10) / 10 : null,
    failureShare: n ? failures / n : 0,
    knownShare: n ? known / n : 0,
    stimulatingReps: stim,
    underStimulatingLightSets: lightMisses,
  };
}

/**
 * Score the *quality* of effort, 0..100, separately from how much of it there
 * was. Peaks across the productive 0–3 RIR band rather than at failure
 * specifically, because that is what the evidence supports — and it deducts for
 * living at failure, which buys fatigue rather than growth.
 *
 * Returns null when there isn't enough effort data to say anything, so the
 * caller can stay quiet instead of scoring a guess.
 */
export function effortScore(s: EffortSummary): number | null {
  if (s.avgRir == null || s.knownShare < 0.25) return null;
  const rir = s.avgRir;
  let base: number;
  if (rir <= 3) base = 100;
  else if (rir <= 4) base = 85;
  else if (rir <= 5) base = 65;
  else if (rir <= 6) base = 45;
  else base = 25;
  // Living at failure costs more than it returns: more fatigue, fewer reps in
  // the sets that follow, and no strength advantage.
  if (s.failureShare > FAILURE_OVERUSE_SHARE) base -= 15;
  return clamp(Math.round(base), 0, 100);
}

/** Coaching notes about effort — only things the data actually supports. */
export function effortNotes(s: EffortSummary): string[] {
  const notes: string[] = [];
  if (s.knownShare < 0.25) {
    if (s.rawSets > 0) {
      notes.push('Mark sets "to failure" or give them an RPE and this can tell how hard you actually trained, not just how often.');
    }
    return notes;
  }
  if (s.avgRir != null && s.avgRir >= 5) {
    notes.push(`Averaging ~${s.avgRir} reps in reserve — most sets are ending before the reps that drive growth.`);
  }
  if (s.failureShare > FAILURE_OVERUSE_SHARE) {
    notes.push('Most sets are going to failure. It buys little extra growth, costs reps in the sets after it, and does nothing for strength — save it for the last set.');
  } else if (s.failureShare > 0 && s.avgRir != null && s.avgRir <= 3) {
    notes.push('Sets are landing close to failure without living there — this is the productive range.');
  }
  if (s.underStimulatingLightSets >= 3) {
    notes.push(`${s.underStimulatingLightSets} light high-rep sets stopped well short. With bodyweight work, the last reps are the ones that count — take those closer to failure.`);
  }
  return notes;
}
