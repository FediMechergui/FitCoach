/**
 * Expectation vs reality — a transparent model of where your body composition
 * *should* be heading, so you can hold it against what actually happened.
 *
 * The model, stated plainly:
 *  1. Energy balance drives total weight change: 7700 kcal ≈ 1 kg of body mass.
 *     Days with no logged intake are treated as maintenance (contributing 0)
 *     rather than guessed — an unlogged day should never invent a trend.
 *  2. Where that change lands (fat vs lean) is decided by PARTITIONING, which
 *     is what training, protein, sleep and smoking actually influence:
 *       • enough protein (≥1.6 g/kg) and resistance training push loss toward
 *         fat and gain toward lean;
 *       • short sleep does the opposite — it is one of the best-evidenced ways
 *         to lose lean mass while dieting;
 *       • smoking gets a modest penalty on lean gain (impaired recovery and
 *         muscle protein synthesis).
 *  3. Training calories are deliberately NOT subtracted again: the TDEE the app
 *     uses already includes an activity multiplier, so counting sessions twice
 *     would fake a deficit that isn't there.
 *
 * Everything here is an estimate with a stated basis, not a promise. Divergence
 * between the expected and actual lines is the interesting part — that gap is
 * the signal (mis-logged intake, a wrong TDEE, water shifts, or real progress).
 */

export const KCAL_PER_KG = 7700;

export interface DayInput {
  date: string;
  /** logged calories; null/undefined = not logged (treated as maintenance) */
  intakeKcal?: number | null;
  proteinG?: number | null;
  /** hard resistance sets that day (drives lean partitioning) */
  hardSets?: number;
  /** any training minutes that day (cardio counts for adherence, not extra burn) */
  trainingMinutes?: number;
  sleepHours?: number | null;
  cigarettes?: number;
}

export interface ProjectionParams {
  startWeightKg: number;
  /** measured fat mass at the start; without it only weight is projected */
  startFatMassKg?: number | null;
  /** measured muscle mass at the start; projects a muscle-mass line when present */
  startMuscleMassKg?: number | null;
  /** maintenance calories (already includes the activity multiplier) */
  tdee: number;
  /** bodyweight used for the protein-per-kg gate */
  bodyweightKg: number;
  days: DayInput[];
}

export interface ProjectedPoint {
  date: string;
  weightKg: number;
  fatMassKg: number | null;
  leanMassKg: number | null;
  /**
   * Expected muscle mass. Muscle is the trainable part of lean mass — bone and
   * organ mass barely move over weeks — so it tracks the modelled lean change,
   * anchored to the starting muscle measurement. Null until that anchor exists.
   */
  muscleMassKg: number | null;
  /** running energy balance in kcal, for explanation */
  cumulativeKcal: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Trailing-window average of a numeric field, ignoring missing values. */
function trailingAvg(days: DayInput[], i: number, window: number, pick: (d: DayInput) => number | null | undefined): number | null {
  let sum = 0;
  let n = 0;
  for (let k = Math.max(0, i - window + 1); k <= i; k++) {
    const v = pick(days[k]);
    if (v != null && isFinite(v)) {
      sum += v;
      n++;
    }
  }
  return n ? sum / n : null;
}

/**
 * Fraction of a LOSS that comes from fat (rest from lean). Base ~75%; good
 * protein + lifting push it up, short sleep pushes it down.
 */
export function fatLossFraction(opts: { proteinPerKg: number | null; hardSetsPerWeek: number; sleepHours: number | null }): number {
  let f = 0.75;
  if (opts.proteinPerKg != null && opts.proteinPerKg >= 1.6) f += 0.1;
  else if (opts.proteinPerKg != null && opts.proteinPerKg < 1.0) f -= 0.1;
  if (opts.hardSetsPerWeek >= 10) f += 0.1;
  else if (opts.hardSetsPerWeek === 0) f -= 0.1;
  if (opts.sleepHours != null && opts.sleepHours < 6) f -= 0.15;
  else if (opts.sleepHours != null && opts.sleepHours >= 7) f += 0.03;
  return clamp(f, 0.5, 0.95);
}

/**
 * Fraction of a GAIN that goes to lean (rest to fat). Base ~35%; lifting with
 * enough protein raises it, poor sleep and smoking lower it.
 */
export function leanGainFraction(opts: {
  proteinPerKg: number | null;
  hardSetsPerWeek: number;
  sleepHours: number | null;
  cigarettesPerDay: number;
}): number {
  let f = 0.35;
  if (opts.hardSetsPerWeek >= 10 && (opts.proteinPerKg ?? 0) >= 1.6) f += 0.15;
  else if (opts.hardSetsPerWeek === 0) f -= 0.15;
  if (opts.sleepHours != null && opts.sleepHours < 6) f -= 0.1;
  if (opts.cigarettesPerDay > 0) f -= 0.05;
  return clamp(f, 0.1, 0.6);
}

export function projectComposition(p: ProjectionParams): ProjectedPoint[] {
  const out: ProjectedPoint[] = [];
  let cumulativeKcal = 0;
  let fat = p.startFatMassKg ?? null;
  let lean = p.startFatMassKg != null ? p.startWeightKg - p.startFatMassKg : null;
  let muscle = p.startMuscleMassKg ?? null;

  for (let i = 0; i < p.days.length; i++) {
    const d = p.days[i];
    // Unlogged day → assume maintenance rather than inventing a deficit.
    const balance = d.intakeKcal != null && d.intakeKcal > 0 ? d.intakeKcal - p.tdee : 0;
    cumulativeKcal += balance;

    const deltaKg = balance / KCAL_PER_KG;

    // Trailing behaviour drives partitioning.
    const avgProtein = trailingAvg(p.days, i, 7, (x) => x.proteinG);
    const proteinPerKg = avgProtein != null && p.bodyweightKg > 0 ? avgProtein / p.bodyweightKg : null;
    const setsPerWeek = (trailingAvg(p.days, i, 7, (x) => x.hardSets ?? 0) ?? 0) * 7;
    const sleep = trailingAvg(p.days, i, 7, (x) => x.sleepHours);
    const cigs = trailingAvg(p.days, i, 7, (x) => x.cigarettes ?? 0) ?? 0;

    if (fat != null && lean != null && deltaKg !== 0) {
      const leanBefore = lean;
      if (deltaKg < 0) {
        const ff = fatLossFraction({ proteinPerKg, hardSetsPerWeek: setsPerWeek, sleepHours: sleep });
        fat = Math.max(0, fat + deltaKg * ff);
        lean = Math.max(0, lean + deltaKg * (1 - ff));
      } else {
        const lf = leanGainFraction({ proteinPerKg, hardSetsPerWeek: setsPerWeek, sleepHours: sleep, cigarettesPerDay: cigs });
        lean += deltaKg * lf;
        fat += deltaKg * (1 - lf);
      }
      // Muscle carries the lean change (bone/organ mass is effectively fixed).
      if (muscle != null) muscle = Math.max(0, muscle + (lean - leanBefore));
    }

    const weightKg = p.startWeightKg + cumulativeKcal / KCAL_PER_KG;
    out.push({
      date: d.date,
      weightKg: r2(weightKg),
      fatMassKg: fat != null ? r2(fat) : null,
      leanMassKg: lean != null ? r2(lean) : null,
      muscleMassKg: muscle != null ? r2(muscle) : null,
      cumulativeKcal: Math.round(cumulativeKcal),
    });
  }
  return out;
}

export type CompositionMetric = 'weightKg' | 'fatMassKg' | 'leanMassKg' | 'muscleMassKg' | 'bodyFatPct';

export interface ComparisonPoint {
  date: string;
  expected: number | null;
  actual: number | null;
}

export interface ComparisonSeries {
  metric: CompositionMetric;
  label: string;
  unit: string;
  points: ComparisonPoint[];
  /** actual − expected at the last point where both exist */
  gap: number | null;
}

export const METRIC_META: Record<CompositionMetric, { label: string; unit: string }> = {
  weightKg: { label: 'Weight', unit: 'kg' },
  fatMassKg: { label: 'Fat weight', unit: 'kg' },
  leanMassKg: { label: 'Lean mass', unit: 'kg' },
  muscleMassKg: { label: 'Muscle mass', unit: 'kg' },
  bodyFatPct: { label: 'Body fat', unit: '%' },
};

export interface ActualPoint {
  date: string;
  weightKg: number;
  fatMassKg?: number | null;
  leanMassKg?: number | null;
  muscleMassKg?: number | null;
  bodyFatPct?: number | null;
}

/** Pair the modelled trajectory with the measurements actually recorded. */
export function compareToActual(
  projected: ProjectedPoint[],
  actuals: ActualPoint[],
  metric: CompositionMetric
): ComparisonSeries {
  const actualByDate = new Map(actuals.map((a) => [a.date, a]));
  const points: ComparisonPoint[] = projected.map((p) => {
    const a = actualByDate.get(p.date);
    let expected: number | null;
    let actual: number | null = null;
    if (metric === 'bodyFatPct') {
      expected = p.fatMassKg != null && p.weightKg > 0 ? r2((p.fatMassKg / p.weightKg) * 100) : null;
      actual = a?.bodyFatPct ?? (a?.fatMassKg != null && a.weightKg > 0 ? r2((a.fatMassKg / a.weightKg) * 100) : null);
    } else {
      expected = p[metric];
      actual = a ? ((a as unknown as Record<string, number | null | undefined>)[metric] ?? null) : null;
    }
    return { date: p.date, expected, actual };
  });

  let gap: number | null = null;
  for (let i = points.length - 1; i >= 0; i--) {
    const pt = points[i];
    if (pt.expected != null && pt.actual != null) {
      gap = r2(pt.actual - pt.expected);
      break;
    }
  }
  return { metric, label: METRIC_META[metric].label, unit: METRIC_META[metric].unit, points, gap };
}

/** A plain-language read on why expected and actual disagree. */
export function explainGap(series: ComparisonSeries): string {
  if (series.gap == null) return 'Not enough measurements yet to compare against the model.';
  const g = series.gap;
  const near = Math.abs(g) < (series.metric === 'bodyFatPct' ? 1 : 0.7);
  if (near) return `Tracking the model closely (${g > 0 ? '+' : ''}${g}${series.unit}). Your logging and your TDEE estimate look consistent.`;
  if (series.metric === 'weightKg' || series.metric === 'fatMassKg') {
    return g > 0
      ? `You're ${g}${series.unit} above the model. Usually this means intake is under-logged, your real TDEE is lower than estimated, or water retention — check a 7-day average before changing anything.`
      : `You're ${Math.abs(g)}${series.unit} below the model. Either your real TDEE is higher than estimated, or you're eating less than logged. Faster isn't automatically better if lean mass is falling too.`;
  }
  const tissue = series.metric === 'muscleMassKg' ? 'Muscle mass' : 'Lean mass';
  return g > 0
    ? `${tissue} is ${g}${series.unit} above the model — protein, lifting and sleep are doing their job. (Scale muscle readings swing with hydration, so trust the trend over any one reading.)`
    : `${tissue} is ${Math.abs(g)}${series.unit} below the model — check protein, hard sets per muscle, and sleep first. (Scale muscle readings swing with hydration, so trust the trend over any one reading.)`;
}
