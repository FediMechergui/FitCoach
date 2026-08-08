/**
 * Smoking health-impact model (opt-in tracker).
 *
 * All figures are transparent, evidence-based estimates — surfaced honestly and
 * without judgment, in the same spirit as the nutrition "honest log". Sources
 * are cited inline; every derived number is presented in-app as an *estimate*.
 *
 * Key references:
 *  - Life lost ≈ 11 min/cigarette: Shaw, Mishra & Dobson, BMJ 2000;320:53.
 *  - Nicotine absorbed ≈ 1–1.5 mg/cigarette: US NIDA / Surgeon General.
 *  - Quit-benefit timeline: US Surgeon General / CDC "Benefits of Quitting".
 *  - Reduced VO2max / aerobic capacity & elevated resting HR in smokers:
 *    well-documented; modelled here as a bounded, clearly-labelled estimate.
 */

import { productOrDefault } from '@/data/nicotineProducts';

export const MINUTES_LOST_PER_CIGARETTE = 11;
export const NICOTINE_MG_PER_CIGARETTE = 1.1; // absorbed
export const TAR_MG_PER_CIGARETTE = 10;
export const CO_MG_PER_CIGARETTE = 14; // approx carbon-monoxide yield

export interface SmokingSettings {
  cigarettesPerPack: number;
  pricePerPack: number;
  currency: string;
  nicotineMgPerCig: number;
  baselinePerDay: number; // typical intake before tracking/quitting
  mode: 'tracking' | 'quitting';
}

export const DEFAULT_SMOKING_SETTINGS: SmokingSettings = {
  cigarettesPerPack: 20,
  pricePerPack: 8,
  currency: '$',
  nicotineMgPerCig: NICOTINE_MG_PER_CIGARETTE,
  baselinePerDay: 10,
  mode: 'quitting',
};

/** Minutes of life expectancy associated with a number of cigarettes. */
export function lifeMinutesLost(cigarettes: number): number {
  return Math.round(cigarettes * MINUTES_LOST_PER_CIGARETTE);
}

// ── Mixed products (cigarettes, shisha, pouches, patches…) ───────────────────

export interface NicotineUse {
  /** catalogue key from data/nicotineProducts; null means cigarettes */
  productKey?: string | null;
  quantity: number;
}

/**
 * Cigarette-equivalents of **combustion**, which is what the health model is
 * actually built on. A pouch or a patch contributes zero here — not because
 * they are harmless, but because the 11-minutes-per-cigarette figure and the
 * carbon-monoxide aerobic penalty are both consequences of inhaling smoke, and
 * applying them to something you never lit would be inventing a number.
 */
export function combustedEquivalents(uses: NicotineUse[]): number {
  return uses.reduce((sum, u) => {
    const p = productOrDefault(u.productKey);
    return sum + u.quantity * p.cigaretteEquivalent;
  }, 0);
}

/** Total nicotine absorbed across any mix of products, mg. */
export function totalNicotineMg(uses: NicotineUse[], s: SmokingSettings): number {
  const total = uses.reduce((sum, u) => {
    const p = productOrDefault(u.productKey);
    // Cigarettes honour the user's own per-cigarette setting; everything else
    // uses the product's own figure.
    const perUnit = p.key === 'cigarette' ? s.nicotineMgPerCig || p.nicotineMg : p.nicotineMg;
    return sum + u.quantity * perUnit;
  }, 0);
  return Math.round(total * 10) / 10;
}

/**
 * Share of today's nicotine that came from something burned, 0..1.
 * The single most useful number for anyone switching: it goes down as you move
 * off cigarettes even while total nicotine stays flat, which is exactly what
 * successful switching looks like and what a plain cigarette count hides.
 */
export function combustedShare(uses: NicotineUse[], s: SmokingSettings): number {
  const all = totalNicotineMg(uses, s);
  if (all <= 0) return 0;
  const burned = totalNicotineMg(
    uses.filter((u) => productOrDefault(u.productKey).combusted),
    s
  );
  return Math.round((burned / all) * 100) / 100;
}

export function moneyCost(cigarettes: number, s: SmokingSettings): number {
  if (s.cigarettesPerPack <= 0) return 0;
  return (cigarettes / s.cigarettesPerPack) * s.pricePerPack;
}

export function nicotineMg(cigarettes: number, s: SmokingSettings): number {
  return cigarettes * (s.nicotineMgPerCig || NICOTINE_MG_PER_CIGARETTE);
}

/**
 * Estimated aerobic-capacity (VO2max) penalty as a % reduction, based on recent
 * average cigarettes/day. Bounded and deliberately conservative. Carbon
 * monoxide binds haemoglobin and reduces O2 delivery, which blunts endurance
 * performance — this converts that into a single legible number for the user.
 */
export function aerobicPenaltyPct(avgCigsPerDay: number): number {
  if (avgCigsPerDay <= 0) return 0;
  return Math.min(15, Math.round(avgCigsPerDay * 0.6 * 10) / 10);
}

/** Estimated resting-heart-rate elevation (bpm) from recent average use. */
export function restingHrElevation(avgCigsPerDay: number): number {
  if (avgCigsPerDay <= 0) return 0;
  return Math.min(12, Math.round(avgCigsPerDay * 0.5));
}

/**
 * Effective calorie-burn efficiency multiplier for endurance work, given the
 * aerobic penalty. Used to contextualize cardio output, not to alter logged
 * calories. Returns e.g. 0.94 for a 6% penalty.
 */
export function aerobicEfficiency(avgCigsPerDay: number): number {
  return 1 - aerobicPenaltyPct(avgCigsPerDay) / 100;
}

export interface QuitMilestone {
  afterLabel: string;
  hours: number;
  benefit: string;
}

/** US Surgeon General / CDC smoke-free recovery timeline. */
export const QUIT_TIMELINE: QuitMilestone[] = [
  { afterLabel: '20 minutes', hours: 20 / 60, benefit: 'Heart rate and blood pressure drop toward normal.' },
  { afterLabel: '12 hours', hours: 12, benefit: 'Blood carbon-monoxide level returns to normal — more oxygen to muscles.' },
  { afterLabel: '2 days', hours: 48, benefit: 'Nerve endings regrow; sense of taste and smell improve.' },
  { afterLabel: '2 weeks', hours: 24 * 14, benefit: 'Circulation improves; walking and training feel easier.' },
  { afterLabel: '1–3 months', hours: 24 * 30, benefit: 'Lung function can improve by up to ~30%.' },
  { afterLabel: '1 year', hours: 24 * 365, benefit: 'Excess risk of coronary heart disease is about half a smoker’s.' },
];

/** The most advanced milestone reached given a smoke-free duration in hours. */
export function currentQuitMilestone(smokeFreeHours: number): QuitMilestone | null {
  let reached: QuitMilestone | null = null;
  for (const m of QUIT_TIMELINE) {
    if (smokeFreeHours >= m.hours) reached = m;
  }
  return reached;
}

/** The next milestone not yet reached. */
export function nextQuitMilestone(smokeFreeHours: number): QuitMilestone | null {
  for (const m of QUIT_TIMELINE) {
    if (smokeFreeHours < m.hours) return m;
  }
  return null;
}

/**
 * Training days equivalent "given back" by the aerobic penalty — a friendly way
 * to express reduced capacity. If endurance output is X% lower, roughly every
 * 100/X sessions is a session's worth of lost aerobic benefit.
 */
export function lostSessionEquivalent(avgCigsPerDay: number, sessionsLogged: number): number {
  const pct = aerobicPenaltyPct(avgCigsPerDay);
  if (pct <= 0 || sessionsLogged <= 0) return 0;
  return Math.round((sessionsLogged * pct) / 100 * 10) / 10;
}
