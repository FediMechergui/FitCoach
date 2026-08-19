/**
 * How long to rest between sets — from what the set actually was.
 *
 * ── The energy systems ──
 * Every rep is paid for by ATP, and the body has three ways to remake it:
 *
 *   PHOSPHAGEN (ATP-PCr, "ATP-CP").  Creatine phosphate hands its phosphate
 *   straight to ADP. No oxygen, no lag, enormous power — and a tank that is
 *   essentially empty after ~10–15 s of all-out effort. This is what a heavy
 *   triple, a sprint or a max jump runs on. The tank refills only with rest:
 *   roughly half in ~30 s, ~85–90 % by 2 min, ~95 %+ by 3–5 min. Rest too
 *   short and the next set starts on a half-empty tank, so it is weaker —
 *   which for strength and power work is the whole problem.
 *
 *   GLYCOLYTIC (anaerobic).  Glucose broken down without oxygen; fast, lasts
 *   ~15 s to ~2 min, produces the lactate and hydrogen ions that make a set
 *   of 10 burn. Most hypertrophy work lives here. Recovery is clearing that
 *   acidosis: 1–3 min, longer for big muscles.
 *
 *   OXIDATIVE (aerobic).  Fat and carbohydrate burned with oxygen; slow to
 *   ramp, effectively unlimited. Long sets, holds and conditioning. Short
 *   rests are fine — the point is often to train under fatigue.
 *
 * ── The nervous system ──
 * Heavy and explosive work also taxes the motor system itself — high-threshold
 * motor units, rate coding, the spinal and supraspinal drive that recruits
 * them. That "neural" fatigue recovers more slowly than the phosphagen tank,
 * which is why a near-maximal single still feels heavier 2 min later even
 * with PCr mostly back: strength and power trials consistently favour 3–5 min
 * between heavy compound sets. Sets to failure add to it; isolation work and
 * lighter loads barely touch it.
 *
 * ── The evidence behind the numbers ──
 *   • Grgic et al. 2018 (strength): >2 min between sets beats <1 min for
 *     strength gains; heavy compound work benefits from 3–5.
 *   • Schoenfeld et al. 2016: 3 min vs 1 min at 8–12 reps — MORE strength and
 *     MORE muscle with the longer rest, because later sets kept their reps.
 *   • de Salles 2009 review: 3–5 min for strength/power at ≥85 % 1RM; 1–2 min
 *     for hypertrophy ranges; 30–90 s for muscular endurance.
 *   • PCr resynthesis half-time ~30 s (Harris 1976; Bogdanis 1995): the
 *     fraction refilled after t seconds is modelled as 1 − e^(−t/45).
 *
 * ── This model ──
 * Classify the set by its duration and load (energy system), give it the base
 * rest that system wants for the intent, add for neural demand (near-maximal
 * load, failure, explosive work), add for accumulated fatigue (set number,
 * minutes into the session), add when the set is a step up on what you have
 * done before (a progress attempt deserves a full tank), scale by experience
 * level, clamp to 30 s – 5 min and round to 15 s. Every function is pure so
 * the numbers can be checked without a device.
 */

export type EnergySystem = 'phosphagen' | 'glycolytic' | 'oxidative';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type CnsLoad = 'low' | 'moderate' | 'high';

export interface RestInput {
  reps: number | null;
  weightKg: number | null;
  /** 1..10 */
  rpe: number | null;
  toFailure: boolean;
  /** for timed sets (holds, carries) */
  durationS: number | null;
  /** the load is the body, not a bar */
  bodyweight: boolean;
  /** multi-joint: squat, hinge, press, pull, lunge, carry */
  compound: boolean;
  /** explosive / power pattern (jumps, throws, olympic-style) */
  explosive?: boolean;
  /** best estimated 1RM known for this exercise, kg — from history */
  best1RMKg?: number | null;
  /** 0-based index of this set within the exercise this session */
  setIndex: number;
  /** minutes since the session started */
  sessionElapsedMin: number;
  level: ExperienceLevel;
  /** heavier than any previous top set on this exercise — a step up */
  isProgress?: boolean;
}

export interface RestPrescription {
  system: EnergySystem;
  /** estimated seconds under load for the set */
  workSeconds: number;
  /** estimated share of 1RM, 0..1, when it can be known */
  pctOneRM: number | null;
  /** reps in reserve, when known */
  rir: number | null;
  cns: CnsLoad;
  /** the parts, seconds */
  baseSec: number;
  neuralSec: number;
  fatigueSec: number;
  progressSec: number;
  levelFactor: number;
  /** the recommendation, seconds (30..300, multiple of 15) */
  restSec: number;
  /** the evidence range for this kind of set, seconds */
  rangeSec: [number, number];
  reasons: string[];
}

export const SYSTEM_LABEL: Record<EnergySystem, string> = {
  phosphagen: 'ATP-PCr (phosphagen)',
  glycolytic: 'Glycolytic',
  oxidative: 'Oxidative',
};

export const SYSTEM_BLURB: Record<EnergySystem, string> = {
  phosphagen: 'Creatine phosphate refilling ATP directly — maximal power for ~10–15 s, then the tank is empty until it is rested back.',
  glycolytic: 'Glucose without oxygen — the 15 s to 2 min burn; rest clears the acidosis.',
  oxidative: 'Fat and carbohydrate with oxygen — long work; short rests are fine.',
};

export const LEVEL_REST_FACTOR: Record<ExperienceLevel, number> = { beginner: 0.85, intermediate: 1, advanced: 1.1 };

/** Seconds per rep, for estimating time under load when no duration is logged. */
const TEMPO_HEAVY_S = 3;
const TEMPO_NORMAL_S = 2.5;
const TEMPO_BODYWEIGHT_S = 2;
/** PCr resynthesis time constant, s (half-time ≈ 31 s). */
export const PCR_TAU_S = 45;
export const MIN_REST_S = 30;
export const MAX_REST_S = 300;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Fraction of the phosphagen tank refilled after `sec` of rest (1 − e^(−t/τ)). */
export function pcrRecovered(sec: number): number {
  if (sec <= 0) return 0;
  return clamp(1 - Math.exp(-sec / PCR_TAU_S), 0, 1);
}

/** Reps in reserve from the set: failure flag first, then RPE. */
export function rirOf(i: Pick<RestInput, 'rpe' | 'toFailure'>): number | null {
  if (i.toFailure) return 0;
  if (i.rpe == null) return null;
  return clamp(Math.round((10 - i.rpe) * 2) / 2, 0, 10);
}

/**
 * Share of 1RM. From a known 1RM when there is one; otherwise inferred from
 * reps + RIR through the Epley relation (reps-to-failure n ⇒ load ≈ 1/(1+n/30)).
 */
export function pctOneRMOf(i: RestInput): number | null {
  if (i.weightKg && i.best1RMKg && i.best1RMKg > 0) return clamp(i.weightKg / i.best1RMKg, 0.2, 1.1);
  const rir = rirOf(i);
  if (i.reps != null && i.reps > 0 && rir != null) return clamp(1 / (1 + (i.reps + rir) / 30), 0.3, 1);
  return null;
}

/** Seconds under load — logged duration, else reps × a tempo. */
export function workSecondsOf(i: RestInput): number {
  if (i.durationS != null && i.durationS > 0) return i.durationS;
  const reps = i.reps ?? 0;
  const tempo = i.bodyweight ? TEMPO_BODYWEIGHT_S : reps <= 5 ? TEMPO_HEAVY_S : TEMPO_NORMAL_S;
  return Math.round(reps * tempo);
}

/** Which system paid for the set. */
export function energySystemOf(work: number, pct: number | null, reps: number | null): EnergySystem {
  const heavy = (pct != null && pct >= 0.85) || (reps != null && reps > 0 && reps <= 5);
  if (work <= 20 && heavy) return 'phosphagen';
  if (work <= 90) return 'glycolytic';
  return 'oxidative';
}

export function prescribeRest(i: RestInput): RestPrescription {
  const work = workSecondsOf(i);
  const pct = pctOneRMOf(i);
  const rir = rirOf(i);
  const system = energySystemOf(work, pct, i.reps);
  const reasons: string[] = [];

  // ── Base rest by system and intent ──
  let base: number;
  let range: [number, number];
  if (system === 'phosphagen') {
    base = i.compound ? 210 : 150;
    range = [180, 300];
    reasons.push(`${work}s of ${pct != null ? Math.round(pct * 100) + '% 1RM' : 'heavy work'} — phosphagen set; the creatine-phosphate tank needs ~3 min to refill (85–90% by 2 min)`);
  } else if (system === 'glycolytic') {
    const endurance = i.reps != null && i.reps >= 15;
    base = endurance ? (i.compound ? 90 : 60) : i.compound ? 120 : 75;
    range = endurance ? [45, 120] : i.compound ? [90, 180] : [60, 120];
    reasons.push(endurance
      ? `${i.reps} reps, ${work}s under load — muscular-endurance range; 45–90 s is the evidence, a little more if the set was hard`
      : `${work}s under load — glycolytic set; rest clears the acidosis (3 min beat 1 min for both strength and muscle at 8–12 reps)`);
    if (rir != null && rir <= 1) { base += 30; reasons.push('within a rep of failure — a little more to keep the next set\'s reps'); }
  } else {
    base = i.durationS != null ? 60 : 45;
    range = [30, 90];
    reasons.push(`${work}s of work — oxidative; short rests are fine, the point is to work under fatigue`);
  }

  // ── Neural demand ──
  let neural = 0;
  let cns: CnsLoad = 'low';
  if (pct != null && pct >= 0.9) { neural += 60; cns = 'high'; reasons.push('≥90% 1RM — near-maximal neural drive recovers more slowly than the tank'); }
  else if (pct != null && pct >= 0.85) { neural += 30; cns = 'high'; reasons.push('≥85% 1RM — high-threshold motor units; strength trials favour 3–5 min here'); }
  else if (pct != null && pct >= 0.75) { cns = 'moderate'; }
  if (i.toFailure) { neural += i.compound ? 45 : 30; if (cns === 'low') cns = 'moderate'; reasons.push(`to failure — ${i.compound ? 'compound failure sets cost the most; ' : ''}add for the nervous system`); }
  if (i.explosive) { neural += 30; if (cns === 'low') cns = 'moderate'; reasons.push('explosive — power drops fast with fatigue; full recovery keeps the quality'); }
  if (i.compound && cns === 'moderate' && rir != null && rir <= 1) cns = 'high';

  // ── Accumulated fatigue ──
  let fatigue = Math.min(40, Math.max(0, i.setIndex) * 10);
  if (i.sessionElapsedMin > 75) fatigue += 30;
  else if (i.sessionElapsedMin > 45) fatigue += 15;
  if (fatigue > 0) reasons.push(`set ${i.setIndex + 1}${i.sessionElapsedMin > 45 ? `, ${Math.round(i.sessionElapsedMin)} min in` : ''} — fatigue accumulates`);

  // ── Progress attempt ──
  const progress = i.isProgress ? 30 : 0;
  if (progress) reasons.push('heavier than anything before on this lift — give the attempt a full tank');

  const factor = LEVEL_REST_FACTOR[i.level] ?? 1;
  if (factor !== 1) reasons.push(i.level === 'beginner' ? 'beginner: lighter absolute loads recover faster' : 'advanced: heavier absolute loads need a little more');

  const raw = (base + neural + fatigue + progress) * factor;
  const restSec = Math.round(clamp(raw, MIN_REST_S, MAX_REST_S) / 15) * 15;

  return { system, workSeconds: work, pctOneRM: pct, rir, cns, baseSec: base, neuralSec: neural, fatigueSec: fatigue, progressSec: progress, levelFactor: factor, restSec, rangeSec: range, reasons };
}

/** "2:30" */
export function formatRest(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

export const CNS_LABEL: Record<CnsLoad, string> = { low: 'CNS low', moderate: 'CNS moderate', high: 'CNS high' };

/** Patterns that are multi-joint. */
export const COMPOUND_PATTERNS: ReadonlySet<string> = new Set(['horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull', 'squat', 'hinge', 'lunge', 'carry']);
