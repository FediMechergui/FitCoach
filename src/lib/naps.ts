/**
 * What a nap is actually worth.
 *
 * Naps were logged but counted for nothing: the debt, the performance factor,
 * the growth engine's recovery input and the athlete card all read night sleep
 * only. A 90-minute afternoon sleep after a 5-hour night is not nothing, and
 * pretending otherwise makes every recovery figure in the app pessimistic.
 *
 * ── The physiology ──
 * A nap is real sleep, but not the same sleep as the night:
 *
 *   • The first ~5–10 minutes are N1 — the doze. Alertness improves, almost no
 *     physiological recovery.
 *   • ~10–25 minutes is N2, the sweet spot. Brooks & Lack (2006) found a
 *     10-minute nap produced immediate improvements in alertness and cognitive
 *     performance that lasted up to ~155 minutes, with no grogginess. NASA's
 *     flight-deck study (Rosekind 1995) put a 26-minute nap at +34%
 *     performance and +54% alertness.
 *   • Past ~25–30 minutes you enter slow-wave sleep. That is where the real
 *     restorative work happens — but waking mid-SWS causes SLEEP INERTIA:
 *     15–30 minutes of impaired reaction time and decision-making, longer if
 *     you were sleep-deprived to begin with. The nap is still worth having;
 *     it just is not worth having 20 minutes before you train or drive.
 *   • ~90 minutes completes a full cycle (N1→N2→SWS→REM) and you wake near
 *     the light end of it, so inertia is small again and you have banked REM
 *     as well.
 *
 * Nap sleep is also less efficient than night sleep minute-for-minute — it is
 * lighter, more fragmented, and the homeostatic pressure driving it is lower
 * once you are partly rested. So a nap minute is modelled as a fraction of a
 * night-sleep minute rather than an equal.
 *
 * ── Timing ──
 * The early-afternoon dip (roughly 13:00–15:00) is a real circadian trough:
 * sleep comes fast and cheap there. Nap late and you spend the sleep pressure
 * you need for tonight — Process S, the homeostatic drive, dissipates and the
 * night that follows is shorter and shallower. That cost is modelled
 * explicitly and subtracted, rather than being quietly ignored.
 *
 * ── For training ──
 * The athlete literature is consistent: post-lunch naps improve sprint times,
 * reaction time and perceived fatigue, and the benefit is LARGEST when night
 * sleep was restricted. A nap after a good night mostly buys alertness; a nap
 * after a short night buys back real recovery. Both are true and the model
 * says which one you got.
 *
 * Every function is pure so the numbers can be checked without a device.
 */

export type NapBand = 'micro' | 'power' | 'truncated' | 'recovery' | 'cycle' | 'long';

export interface NapInput {
  minutes: number;
  /** "14:30" — when the nap started; null when not recorded */
  startTime?: string | null;
}

export interface NapContext {
  /** last night's sleep, hours — decides whether the nap repays debt or buys alertness */
  nightHours?: number | null;
  /** target night sleep, hours */
  targetHours?: number;
}

export const NAP_BAND_META: Record<NapBand, { label: string; blurb: string }> = {
  micro: {
    label: 'Micro-nap',
    blurb: 'Under 10 minutes — mostly the doze before real sleep. Sharpens you up; recovers little.',
  },
  power: {
    label: 'Power nap',
    blurb: '10–25 minutes of light sleep — the best value per minute there is, and you wake clear-headed.',
  },
  truncated: {
    label: 'Cut-short nap',
    blurb: '25–45 minutes lands you in deep sleep and then wakes you out of it — real recovery, but expect grogginess.',
  },
  recovery: {
    label: 'Recovery nap',
    blurb: '45–80 minutes — deep sleep with some of a cycle behind it. Good after a short night.',
  },
  cycle: {
    label: 'Full cycle',
    blurb: '~90 minutes completes a sleep cycle, so you wake at the light end with REM banked and little grogginess.',
  },
  long: {
    label: 'Long sleep',
    blurb: 'Over two hours in the day. Restorative, but it takes a real bite out of tonight.',
  },
};

/**
 * Restorative fraction of a nap minute versus a night-sleep minute. Peaks for
 * the efficient N2 window and for a completed cycle; dips where the nap is
 * mostly the doze, or ends mid-slow-wave.
 */
export const BAND_EFFICIENCY: Record<NapBand, number> = {
  micro: 0.35,
  power: 0.7,
  truncated: 0.6,
  recovery: 0.65,
  cycle: 0.75,
  long: 0.7,
};

/** Minutes of sleep inertia to expect on waking, by band. */
export const BAND_INERTIA_MIN: Record<NapBand, number> = {
  micro: 0,
  power: 0,
  truncated: 20,
  recovery: 15,
  cycle: 8,
  long: 20,
};

/** How long the alertness lift lasts, minutes (Brooks & Lack: ~155 min from 10 min). */
export const BAND_ALERTNESS_MIN: Record<NapBand, number> = {
  micro: 60,
  power: 155,
  truncated: 180,
  recovery: 200,
  cycle: 240,
  long: 240,
};

/** Naps cannot replace nights: at most this much night-sleep-equivalent per day. */
export const MAX_NAP_CREDIT_MIN = 150;
export const DEFAULT_TARGET_HOURS = 8;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function napBand(minutes: number): NapBand {
  if (minutes < 10) return 'micro';
  if (minutes <= 25) return 'power';
  if (minutes <= 45) return 'truncated';
  if (minutes <= 80) return 'recovery';
  if (minutes <= 110) return 'cycle';
  return 'long';
}

/** "14:30" → 14.5; null when unparsable. */
export function hourOf(startTime: string | null | undefined): number | null {
  if (!startTime) return null;
  const m = /^\s*(\d{1,2})\s*[:hH.]\s*(\d{2})/.exec(startTime);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h + min / 60;
}

/**
 * How well the clock suits a nap. Best in the early-afternoon circadian dip;
 * worse in the evening, when sleep comes easily precisely because you are
 * spending tonight's sleep pressure.
 */
export function timingFactor(startTime: string | null | undefined): number {
  const h = hourOf(startTime);
  if (h == null) return 0.95; // unknown — assume a typical afternoon nap
  if (h < 10) return 0.85;
  if (h < 12) return 0.92;
  if (h < 15) return 1;
  if (h < 16) return 0.95;
  if (h < 18) return 0.85;
  return 0.7;
}

/**
 * Minutes borrowed from tonight — the homeostatic pressure this nap spends.
 * Nothing before mid-afternoon; ramping after, and longer naps cost more.
 */
export function nightSleepCostMin(nap: NapInput): number {
  const h = hourOf(nap.startTime);
  const minutes = Math.max(0, nap.minutes);
  if (h == null) return Math.round(minutes * 0.1);
  if (h < 15) return 0;
  const lateness = clamp((h - 15) / 5, 0, 1); // 15:00 → 0, 20:00 → 1
  return Math.round(minutes * (0.15 + 0.45 * lateness));
}

export interface NapValue {
  band: NapBand;
  /** night-sleep-equivalent minutes this nap recovered, before the night cost */
  restorativeMin: number;
  /** minutes taken out of tonight */
  nightCostMin: number;
  /** what it is worth on the day, net */
  netMin: number;
  /** grogginess to expect on waking */
  inertiaMin: number;
  /** how long the alertness lift lasts */
  alertnessMin: number;
  efficiency: number;
  timing: number;
  /** true when last night was short enough that this nap repaid real debt */
  repaidDebt: boolean;
  notes: string[];
}

/**
 * What one nap was worth. `repaidDebt` distinguishes the two honest cases: a
 * nap after a short night buys back recovery; a nap after a full night mostly
 * buys alertness, and the model says so rather than inflating the number.
 */
export function napValue(nap: NapInput, ctx: NapContext = {}): NapValue {
  const minutes = Math.max(0, Math.round(nap.minutes));
  const band = napBand(minutes);
  const efficiency = BAND_EFFICIENCY[band];
  const timing = timingFactor(nap.startTime);
  const target = ctx.targetHours ?? DEFAULT_TARGET_HOURS;
  const night = ctx.nightHours ?? null;
  const debtMin = night != null ? Math.max(0, (target - night) * 60) : null;

  let restorative = minutes * efficiency * timing;
  const notes: string[] = [];

  // A nap cannot recover more than the night actually owed. Past that it is
  // still worth having — it just buys alertness, not recovery.
  let repaidDebt = false;
  if (debtMin != null) {
    if (debtMin <= 0) {
      restorative *= 0.4;
      notes.push('You were not short on sleep, so this mostly bought alertness rather than recovery.');
    } else {
      repaidDebt = true;
      if (restorative > debtMin) {
        restorative = debtMin + (restorative - debtMin) * 0.4;
        notes.push('Longer than the debt it had to repay — the extra counts for less.');
      } else {
        notes.push(`Repaid about ${Math.round(restorative)} min of last night's ${Math.round(debtMin)} min shortfall.`);
      }
    }
  }

  const nightCostMin = nightSleepCostMin(nap);
  const inertiaMin = BAND_INERTIA_MIN[band];
  const netMin = Math.max(0, Math.round(restorative - nightCostMin));

  if (inertiaMin > 0) notes.push(`Expect about ${inertiaMin} min of grogginess on waking — do not train or drive straight out of it.`);
  if (nightCostMin > 0) notes.push(`Costs roughly ${nightCostMin} min of tonight's sleep — it spends the pressure that gets you off.`);
  if (band === 'power') notes.push('The best value per minute: light sleep only, so you wake clear.');
  if (band === 'truncated') notes.push('Either keep it under 25 min or take it to ~90 — this length wakes you out of deep sleep.');
  if (band === 'cycle') notes.push('A complete cycle, so you woke at the light end with REM banked.');
  if (band === 'long') notes.push('Fine occasionally after a bad night; nightly, it is the night that needs fixing.');

  return {
    band,
    restorativeMin: Math.round(restorative),
    nightCostMin,
    netMin,
    inertiaMin,
    alertnessMin: BAND_ALERTNESS_MIN[band],
    efficiency,
    timing: Math.round(timing * 100) / 100,
    repaidDebt,
    notes,
  };
}

export interface DayRest {
  /** night sleep, hours (0 when not logged) */
  nightHours: number;
  /** raw minutes napped */
  napMinutes: number;
  /** night-sleep-equivalent minutes credited from naps, after cost and cap */
  napCreditMin: number;
  /** night + credited naps, hours — what "how rested are you" should read */
  restHours: number;
  /** true when the cap bit */
  capped: boolean;
}

/**
 * The day's total rest: last night plus what the naps were actually worth.
 * The cap keeps naps from standing in for a night — someone sleeping 4 hours
 * and napping 4 is not well rested, and the number should not say they are.
 */
export function dayRest(nightHours: number | null, naps: NapInput[], ctx: NapContext = {}): DayRest {
  const night = nightHours ?? 0;
  const napMinutes = naps.reduce((s, n) => s + Math.max(0, n.minutes), 0);
  const raw = naps.reduce((s, n) => s + napValue(n, { ...ctx, nightHours: nightHours }).netMin, 0);
  const napCreditMin = Math.min(MAX_NAP_CREDIT_MIN, raw);
  return {
    nightHours: Math.round(night * 10) / 10,
    napMinutes,
    napCreditMin: Math.round(napCreditMin),
    restHours: Math.round((night + napCreditMin / 60) * 10) / 10,
    capped: raw > MAX_NAP_CREDIT_MIN,
  };
}

/** One line for the nap row: "25 min power nap · worth ~17 min of night sleep". */
export function describeNap(nap: NapInput, ctx: NapContext = {}): string {
  const v = napValue(nap, ctx);
  const worth = v.netMin > 0 ? `worth ~${v.netMin} min of night sleep` : 'no recovery credit at this time of day';
  return `${NAP_BAND_META[v.band].label} · ${worth}`;
}

/** The ideal nap right now, given how last night went. */
export function napAdvice(nightHours: number | null, hourNow: number): string {
  if (hourNow >= 16) return 'Late for a nap — it will cost you tonight. A 10-minute lie-down at most, or push through to bedtime.';
  const short = nightHours != null && nightHours < 6;
  if (short) return 'Short night: a full ~90-minute cycle repays the most, or 20 minutes if that is all you have. Before 15:00.';
  if (nightHours != null && nightHours < 7) return 'A little short: 20–25 minutes is the sweet spot — clear-headed on waking, no cost tonight.';
  return 'You slept enough: 10–20 minutes for alertness. Longer will just borrow from tonight.';
}
