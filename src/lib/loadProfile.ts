/**
 * What "load" means for every exercise — the variables the calorie engine,
 * the 1RM maths and the set form need to treat each movement as itself.
 *
 * Four load modes:
 *   external — the weight IS the load (barbell, dumbbell, machine, cable).
 *              The field logs it; nothing new here.
 *   added    — bodyweight movements that take extra weight on a belt, vest or
 *              between the ankles (weighted pull-ups, dips, push-ups…). The
 *              field logs the ADDED kilograms; negative means assistance (a
 *              band or an assisted machine taking weight off). The real load
 *              of the set is bwFraction × bodyweight + added.
 *   carried  — the load rides on you while you move (ruck pack, farmers
 *              carry, sandbag, sled, weighted-vest conditioning). The field
 *              logs the carried kilograms, and the energy cost scales with
 *              them: carrying X% of bodyweight costs ≈ X% more, because the
 *              body is simply moving that much more mass.
 *   none     — no meaningful load to log (yoga, breathwork, sprints, rounds).
 *
 * bwFraction — the share of bodyweight the movement actually lifts, from
 * force-plate studies (Ebben 2011 and similar): a push-up supports ~64% of
 * bodyweight, from the knees ~49%, feet elevated ~74%; a pull-up hoists ~96%
 * (the forearms stay on the bar); a dip ~96%; a bodyweight squat moves ~85%
 * (shanks stay put); a hip thrust / glute bridge ~50–55%; a calf raise ~95%.
 * It turns "8 weighted pull-ups +20 kg at 80 kg bodyweight" into a real load
 * (0.96 × 80 + 20 ≈ 97 kg), which is what the rest prescription, the strain
 * score and the calorie engine should be reasoning about.
 *
 * Every function is pure; slugs not listed fall back by pattern + equipment,
 * so a new exercise gets a sensible profile the day it is added.
 */

export type LoadMode = 'external' | 'added' | 'carried' | 'none';

export interface LoadProfile {
  /** share of bodyweight the movement lifts; null when bodyweight is not the load */
  bwFraction: number | null;
  loadMode: LoadMode;
  /** negative added weight (band / assisted machine) makes sense here */
  assistable: boolean;
}

/** Per-slug profiles where the default by pattern would be wrong or vague. */
export const LOAD_PROFILES: Record<string, Partial<LoadProfile>> = {
  // ── Push-up family (Ebben 2011: standard ~64% BW) ──
  'push-up': { bwFraction: 0.64, loadMode: 'added' },
  'push-up-wide': { bwFraction: 0.64, loadMode: 'added' },
  'push-up-diamond': { bwFraction: 0.65, loadMode: 'added' },
  'diamond-push-up': { bwFraction: 0.65, loadMode: 'added' },
  'close-grip-push-up': { bwFraction: 0.65, loadMode: 'added' },
  'push-up-incline': { bwFraction: 0.5, loadMode: 'added' },
  'incline-pushup': { bwFraction: 0.5, loadMode: 'added' },
  'push-up-decline': { bwFraction: 0.74, loadMode: 'added' },
  'decline-push-up': { bwFraction: 0.74, loadMode: 'added' },
  'push-up-archer': { bwFraction: 0.7, loadMode: 'added' },
  'archer-push-up': { bwFraction: 0.7, loadMode: 'added' },
  'ring-push-up': { bwFraction: 0.68, loadMode: 'added' },
  'push-up-explosive': { bwFraction: 0.64, loadMode: 'none' },
  'hand-release-pushup': { bwFraction: 0.64, loadMode: 'added' },
  'pseudo-planche-pushup': { bwFraction: 0.75, loadMode: 'none' },
  'one-arm-pushup': { bwFraction: 0.64, loadMode: 'none' },
  'pike-push-up': { bwFraction: 0.6, loadMode: 'added' },
  'handstand-push-up': { bwFraction: 0.78, loadMode: 'none' },
  'wall-handstand-pushup': { bwFraction: 0.75, loadMode: 'none' },
  'bodyweight-skullcrusher': { bwFraction: 0.45, loadMode: 'none' },
  // ── Pull-up family (~96% BW) ──
  'pull-up': { bwFraction: 0.96, loadMode: 'added', assistable: true },
  'pull-up-wide': { bwFraction: 0.96, loadMode: 'added', assistable: true },
  'pull-up-neutral': { bwFraction: 0.96, loadMode: 'added', assistable: true },
  'chin-up': { bwFraction: 0.96, loadMode: 'added', assistable: true },
  'archer-pull-up': { bwFraction: 0.96, loadMode: 'none' },
  'commando-pull-up': { bwFraction: 0.96, loadMode: 'added' },
  'muscle-up': { bwFraction: 1.0, loadMode: 'added' },
  'assisted-pull-up': { bwFraction: 0.96, loadMode: 'added', assistable: true },
  'inverted-row': { bwFraction: 0.5, loadMode: 'added' },
  'ring-row': { bwFraction: 0.55, loadMode: 'added' },
  'scapular-pull-up': { bwFraction: 0.96, loadMode: 'none' },
  'rope-climb': { bwFraction: 1.0, loadMode: 'none' },
  // ── Dips ──
  dip: { bwFraction: 0.96, loadMode: 'added', assistable: true },
  'ring-dip': { bwFraction: 0.96, loadMode: 'added' },
  'bench-dip': { bwFraction: 0.6, loadMode: 'added' },
  'chair-dip': { bwFraction: 0.6, loadMode: 'added' },
  // ── Bodyweight legs (~85% BW moves; shanks stay) ──
  'bodyweight-squat': { bwFraction: 0.85, loadMode: 'added' },
  'jump-squat': { bwFraction: 0.85, loadMode: 'none' },
  'pistol-squat': { bwFraction: 0.85, loadMode: 'added' },
  'shrimp-squat': { bwFraction: 0.85, loadMode: 'added' },
  'sissy-squat': { bwFraction: 0.6, loadMode: 'added' },
  'wall-sit': { bwFraction: 0.85, loadMode: 'added' },
  'step-ups': { bwFraction: 0.85, loadMode: 'added' },
  'glute-bridge': { bwFraction: 0.5, loadMode: 'added' },
  'single-leg-glute-bridge': { bwFraction: 0.5, loadMode: 'added' },
  'nordic-curl': { bwFraction: 0.45, loadMode: 'none' },
  'nordic-negative': { bwFraction: 0.45, loadMode: 'none' },
  'glute-ham-raise': { bwFraction: 0.5, loadMode: 'added' },
  'single-leg-rdl': { bwFraction: 0.6, loadMode: 'added' },
  'calf-raise-step': { bwFraction: 0.95, loadMode: 'added' },
  'single-leg-calf-raise': { bwFraction: 0.95, loadMode: 'added' },
  'donkey-calf-raise': { bwFraction: 0.7, loadMode: 'added' },
  'hyperextension-bw': { bwFraction: 0.45, loadMode: 'added' },
  // ── Core (load rarely makes sense; a few take a plate/ankle weight) ──
  crunch: { bwFraction: 0.3, loadMode: 'added' },
  'sit-up': { bwFraction: 0.35, loadMode: 'added' },
  'hanging-leg-raise': { bwFraction: 0.35, loadMode: 'added' },
  'lying-leg-raise': { bwFraction: 0.35, loadMode: 'added' },
  plank: { bwFraction: 0.6, loadMode: 'added' },
  'side-plank': { bwFraction: 0.5, loadMode: 'none' },
  'l-sit': { bwFraction: 0.4, loadMode: 'none' },
  // ── Carries & loaded conditioning (strength side logs weight already) ──
  'farmers-carry': { bwFraction: null, loadMode: 'carried' },
  'farmers-carry-shrug': { bwFraction: null, loadMode: 'carried' },
  'farmers-hold': { bwFraction: null, loadMode: 'carried' },
  'sandbag-carry': { bwFraction: null, loadMode: 'carried' },
  'overhead-carry': { bwFraction: null, loadMode: 'carried' },
  'shield-carry-march': { bwFraction: null, loadMode: 'carried' },
  'atlas-stone-lift': { bwFraction: null, loadMode: 'external' },
  'tire-flip': { bwFraction: null, loadMode: 'external' },
  'sled-push': { bwFraction: null, loadMode: 'carried' },
  'loaded-carry-cardio': { bwFraction: null, loadMode: 'carried' },
  'sandbag-clean-press': { bwFraction: null, loadMode: 'external' },
  // ── Outdoor with a pack ──
  rucking: { bwFraction: null, loadMode: 'carried' },
  hiking: { bwFraction: null, loadMode: 'carried' },
  trekking: { bwFraction: null, loadMode: 'carried' },
  mountaineering: { bwFraction: null, loadMode: 'carried' },
  'stair-climbing-outdoor': { bwFraction: null, loadMode: 'carried' },
  'outdoor-bootcamp': { bwFraction: null, loadMode: 'carried' },
  // ── Neck bodyweight ──
  'neck-curl-bodyweight': { bwFraction: 0.08, loadMode: 'added' },
  'neck-extension-bodyweight': { bwFraction: 0.08, loadMode: 'added' },
};

const BW_BY_PATTERN: Record<string, number> = {
  horizontal_push: 0.64,
  vertical_push: 0.7,
  horizontal_pull: 0.55,
  vertical_pull: 0.96,
  squat: 0.85,
  lunge: 0.85,
  hinge: 0.5,
  calf_raise: 0.95,
  core: 0.35,
  triceps_extension: 0.6,
  curl: 0.5,
};

/**
 * The profile for an exercise. Slug-specific values win; otherwise bodyweight
 * exercises default by movement pattern (added weight allowed on the classic
 * rep patterns), external equipment defaults to `external`, and everything
 * else — rounds, drills, flows — to `none`.
 */
export function profileFor(ex: {
  slug?: string | null;
  equipmentType?: string | null;
  pattern?: string | null;
  trackingType?: string | null;
}): LoadProfile {
  const specific = ex.slug ? LOAD_PROFILES[ex.slug] : undefined;
  const bodyweight = ex.equipmentType === 'bodyweight';
  const base: LoadProfile = bodyweight
    ? {
        bwFraction: BW_BY_PATTERN[ex.pattern ?? ''] ?? 0.6,
        loadMode: ex.trackingType === 'reps_only' && (ex.pattern ?? '') in BW_BY_PATTERN ? 'added' : 'none',
        assistable: false,
      }
    : ex.equipmentType === 'barbell' || ex.equipmentType === 'dumbbell' || ex.equipmentType === 'machine' || ex.equipmentType === 'cable'
      ? { bwFraction: null, loadMode: ex.trackingType === 'reps_weight' ? 'external' : 'none', assistable: false }
      : { bwFraction: null, loadMode: ex.trackingType === 'reps_weight' ? 'external' : 'none', assistable: false };
  return { ...base, ...specific } as LoadProfile;
}

/**
 * The real kilograms a set moved. External load passes through; added weight
 * sits on top of the bodyweight share (assistance subtracts); carried load is
 * itself (the calorie engine adds the body separately); none is null.
 */
export function effectiveLoadKg(
  profile: LoadProfile,
  bodyweightKg: number,
  loggedKg: number | null
): number | null {
  if (profile.loadMode === 'external') return loggedKg;
  if (profile.loadMode === 'added') {
    if (profile.bwFraction == null) return loggedKg;
    return Math.max(0, profile.bwFraction * bodyweightKg + (loggedKg ?? 0));
  }
  if (profile.loadMode === 'carried') return loggedKg;
  return null;
}

/**
 * How much a load multiplies the energy cost of the movement's MET.
 *
 * carried — moving X% of bodyweight extra costs ≈ X% more (the MET tables
 *           assume an unloaded body; total moved mass scales the work almost
 *           linearly at walking/carrying speeds). A 20 kg ruck at 80 kg is
 *           ×1.25. Capped ×2 — past that, form and pace change everything.
 * added   — a belt or vest on a rep movement: the extra mass rides only
 *           through the lifted fraction of the movement, so half weight.
 * external / none — the MET for the movement already assumes the implement;
 *           extra-heavy barbell work shows up through intensity instead.
 */
export function loadCalorieFactor(profile: LoadProfile, bodyweightKg: number, loggedKg: number | null): number {
  if (!loggedKg || loggedKg <= 0 || bodyweightKg <= 0) return 1;
  if (profile.loadMode === 'carried') return Math.min(2, 1 + loggedKg / bodyweightKg);
  if (profile.loadMode === 'added') return Math.min(1.6, 1 + loggedKg / (2 * bodyweightKg));
  return 1;
}

/**
 * How effort multiplies energy cost. Harder sets recruit more muscle, breathe
 * harder and run hotter between reps; the Compendium MET is a mid-effort
 * figure. ±3% per RPE point around 7, clamped to ±12%.
 */
export function intensityCalorieFactor(rpe: number | null, toFailure: boolean): number {
  const effRpe = toFailure ? 10 : rpe;
  if (effRpe == null) return 1;
  return Math.min(1.12, Math.max(0.88, 1 + (effRpe - 7) * 0.03));
}

/** What the weight field is called for each mode. */
export const LOAD_FIELD_LABEL: Record<LoadMode, string | null> = {
  external: 'Weight',
  added: '+ kg',
  carried: 'Load kg',
  none: null,
};
