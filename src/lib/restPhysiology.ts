/**
 * What the rest of your life does to the rest between your sets.
 *
 * The prescription in lib/restPrescription is built from the set itself — its
 * energy system, its load, its neural cost. That is the right skeleton, but it
 * describes a rested, clean-blooded, empty-stomached person, and nobody is that
 * person every day. This adjusts it for the state you actually turned up in,
 * and it does so through mechanism rather than mood: each factor changes the
 * number only where there is a physiological path for it to.
 *
 * ── Why oxygen is the lever ──
 * Phosphocreatine resynthesis is **entirely aerobic**. The tank that a heavy
 * triple empties is refilled by oxidative ATP production, which is why PCr
 * recovery is one of the most oxygen-sensitive processes in exercise
 * physiology: Haseler et al. (1999) measured recovery under three oxygen
 * fractions and found the time constant shortened breathing 100 % O₂ and
 * lengthened markedly in hypoxia. Oxygen delivery does not change WHETHER you
 * recover, it changes HOW FAST.
 *
 * That gives an exact conversion rather than a guess. Recovery follows
 * 1 − e^(−t/τ), so the time to reach a given fraction is t = −τ·ln(1−f). If
 * delivery falls to a fraction `d` of normal, τ stretches to τ/d, and the time
 * to the SAME fraction stretches by exactly 1/d. The rest the set already
 * wanted is simply divided by the oxygen you actually have.
 *
 * ── What moves oxygen delivery ──
 *
 *   **Carbon monoxide.** The strongest and best-evidenced factor here, and the
 *   reason this file exists. CO binds haemoglobin with roughly 250 times the
 *   avidity of oxygen, so a smoker carries carboxyhaemoglobin that is simply
 *   unavailable for carrying oxygen: a non-smoker sits near 0.5–1 %, a single
 *   cigarette adds several points acutely, and a habitual smoker lives at
 *   4–8 %. Worse than the lost capacity, COHb left-shifts the oxyhaemoglobin
 *   dissociation curve, so what oxygen IS bound comes off less willingly at the
 *   muscle. Maximal oxygen uptake falls by roughly a percent per percent COHb
 *   (Horvath), and the functional cost at the tissue exceeds the arithmetic
 *   loss because of that shift. It clears on the app's existing four-hour
 *   half-life, so this fades exactly as the CO does.
 *
 *   **A full stomach.** Digestion is not free: splanchnic blood flow rises
 *   substantially after a meal and stays raised for an hour or two, and cardiac
 *   output is finite. Muscle wins that competition during hard work, but not
 *   completely. This is a real effect and a small one, and it is modelled as
 *   small — it never approaches what CO does.
 *
 * ── What does NOT move oxygen delivery ──
 * Sleep. Short sleep clearly degrades training — reduced voluntary activation,
 * higher perceived effort, blunted autonomic recovery — but there is no good
 * evidence it slows phosphocreatine kinetics, and pretending otherwise would be
 * inventing a mechanism to justify a number. So sleep is applied where the
 * evidence actually points: to the NEURAL portion of the rest, the part that
 * already exists for near-maximal and failure work. A bad night lengthens the
 * recovery your nervous system needs, not the refilling of a chemical tank.
 *
 * ── Neither more nor less ──
 * Every factor is bounded, and good conditions earn a small reduction rather
 * than merely avoiding a penalty: resting longer than the state warrants wastes
 * the session as surely as resting too little wastes the set. The total effect
 * is deliberately modest — this refines an evidence-based number, it does not
 * overrule it.
 *
 * Pure functions throughout, so every claim above is checkable without a device.
 */

/** Carboxyhaemoglobin in someone who has not been near smoke, %. */
export const BASELINE_COHB_PCT = 0.7;
/**
 * Carboxyhaemoglobin added per cigarette-equivalent still on board, %.
 * Literature puts the acute rise from one cigarette at roughly 3–5 points;
 * the lower end is used, since the app's CO load already decays with time.
 */
export const COHB_PER_CIG_EQ = 3.5;
/** Beyond this, a reading belongs in a hospital, not a gym. % */
export const MAX_COHB_PCT = 12;
/**
 * Functional oxygen-delivery lost per point of COHb.
 *
 * A point of COHb removes a point of carrying capacity outright; the left-shift
 * of the dissociation curve costs a little more again at the tissue. 1.2 % per
 * point is the conservative end of that combined effect.
 */
export const O2_LOSS_PER_COHB_PCT = 0.012;
/** However bad the inputs look, never claim more impairment than this. */
export const MAX_O2_LOSS = 0.2;

/** A stomach holding this much is "full" for the purposes of splanchnic steal. kcal */
export const SPLANCHNIC_FULL_KCAL = 700;
/** The most a full stomach may be said to cost oxygen delivery. */
export const MAX_SPLANCHNIC_LOSS = 0.05;

/** Sleep at or above this needs no neural allowance. hours */
export const SLEEP_NEUTRAL_H = 7;
/** Sleep at or above this earns a small reduction. hours */
export const SLEEP_EXCELLENT_H = 8.5;
/** Extra neural recovery per hour of sleep below neutral. */
export const NEURAL_PER_HOUR_SHORT = 0.06;
export const MAX_NEURAL_FACTOR = 1.3;
export const MIN_NEURAL_FACTOR = 0.94;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** The state you arrived in. Every field is optional; unknown means unchanged. */
export interface RestConditions {
  /** cigarette-equivalents still on board (lib/smokeClock coLoad) */
  coLoad?: number | null;
  /** kcal-equivalents still in the stomach (lib/digestion stomachLoad) */
  stomachKcal?: number | null;
  /** mean sleep over recent nights, hours */
  avgSleepHours?: number | null;
}

export interface RestPhysiology {
  /** estimated carboxyhaemoglobin, %, or null when nothing is known */
  cohbPct: number | null;
  /** oxygen delivery as a fraction of normal — divides the metabolic rest */
  o2Factor: number;
  /** multiplies the neural portion of the rest */
  neuralFactor: number;
  /** the PCr time constant this implies, seconds */
  tauS: number;
  /** true when nothing is known and nothing was changed */
  neutral: boolean;
  notes: string[];
}

/** Carboxyhaemoglobin implied by the CO still on board. */
export function estimateCohbPct(coLoad: number | null | undefined): number {
  const load = typeof coLoad === 'number' && Number.isFinite(coLoad) && coLoad > 0 ? coLoad : 0;
  return Math.min(MAX_COHB_PCT, BASELINE_COHB_PCT + load * COHB_PER_CIG_EQ);
}

/** Oxygen delivery as a fraction of normal, from CO and from digestion. */
export function o2DeliveryFactor(c: RestConditions): number {
  let loss = 0;

  if (c.coLoad != null && c.coLoad > 0) {
    // Only the CO above a non-smoker's baseline is a penalty — everyone carries
    // the baseline, and the evidence-based rest times already assume it.
    const excess = Math.max(0, estimateCohbPct(c.coLoad) - BASELINE_COHB_PCT);
    loss += excess * O2_LOSS_PER_COHB_PCT;
  }

  if (c.stomachKcal != null && c.stomachKcal > 0) {
    loss += clamp(c.stomachKcal / SPLANCHNIC_FULL_KCAL, 0, 1) * MAX_SPLANCHNIC_LOSS;
  }

  return 1 - clamp(loss, 0, MAX_O2_LOSS);
}

/**
 * How much longer the nervous system needs, from sleep.
 *
 * Applied to the neural portion only — see the note above on why sleep does not
 * belong in the oxygen term.
 */
export function neuralRecoveryFactor(c: RestConditions): number {
  const h = c.avgSleepHours;
  if (h == null || !Number.isFinite(h) || h <= 0) return 1;
  if (h >= SLEEP_EXCELLENT_H) return MIN_NEURAL_FACTOR;
  if (h >= SLEEP_NEUTRAL_H) return 1;
  return clamp(1 + (SLEEP_NEUTRAL_H - h) * NEURAL_PER_HOUR_SHORT, 1, MAX_NEURAL_FACTOR);
}

/** Seconds to reach a given fraction of PCr recovery at a given time constant. */
export function pcrTimeFor(fraction: number, tauS: number): number {
  const f = clamp(fraction, 0, 0.999);
  return -tauS * Math.log(1 - f);
}

/** Everything above, resolved into the two numbers the prescription needs. */
export function restPhysiology(c: RestConditions, baseTauS: number): RestPhysiology {
  const knowsCo = c.coLoad != null && c.coLoad > 0;
  const knowsFood = c.stomachKcal != null && c.stomachKcal > 0;
  const knowsSleep = c.avgSleepHours != null && c.avgSleepHours > 0;

  const o2Factor = o2DeliveryFactor(c);
  const neuralFactor = neuralRecoveryFactor(c);
  const cohbPct = knowsCo ? Math.round(estimateCohbPct(c.coLoad) * 10) / 10 : null;
  const notes: string[] = [];

  if (knowsCo && cohbPct != null) {
    const pct = Math.round((1 / o2Factor - 1) * 100);
    notes.push(
      `carbon monoxide still on board — about ${cohbPct}% of your haemoglobin is carrying CO instead of oxygen, ` +
        `and refilling the phosphagen tank is an aerobic job${pct > 0 ? `, so it takes ~${pct}% longer` : ''}`
    );
  }
  if (knowsFood) {
    notes.push('digesting — blood is committed to the gut that would otherwise be at the muscle');
  }
  if (knowsSleep) {
    if (neuralFactor > 1) {
      notes.push(
        `${c.avgSleepHours} h of sleep — short nights blunt voluntary activation and raise perceived effort, ` +
          'so the nervous system needs longer between heavy sets (the tank itself is unaffected)'
      );
    } else if (neuralFactor < 1) {
      notes.push(`${c.avgSleepHours} h of sleep — well recovered, so the neural allowance can come down a little`);
    }
  }

  return {
    cohbPct,
    o2Factor,
    neuralFactor,
    tauS: Math.round((baseTauS / o2Factor) * 10) / 10,
    neutral: o2Factor === 1 && neuralFactor === 1,
    notes,
  };
}
