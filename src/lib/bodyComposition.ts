/**
 * Body-composition engine.
 *
 * Strict separation of concerns:
 *  • INPUTS  — what you measure (scale readings + tape measurements). Only
 *    `weightKg` is required; everything else is optional.
 *  • DERIVED — everything this module computes from those inputs (BMI, fat
 *    weight, lean mass, percentages, obesity degree, ratios, FFMI, BMR…).
 *    Derived values are never stored, so history can't contradict itself.
 *
 * FFMI (Fat-Free Mass Index) is a height-normalized measure of muscularity:
 *   FFMI = leanMassKg / heightM²      (normalized to 1.8 m for comparability)
 */

export interface BodyCompInput {
  // ── measured: mass & composition ──
  weightKg: number;
  heightCm?: number | null;
  bodyFatPct?: number | null;
  fatMassKg?: number | null;
  muscleMassKg?: number | null;
  skeletalMuscleKg?: number | null;
  bodyWaterPct?: number | null;
  trappedWaterKg?: number | null;
  boneMassKg?: number | null;
  visceralFatRating?: number | null;
  proteinPct?: number | null;
  /** the scale's own BMR reading, if it gives one */
  bmrKcal?: number | null;
  // ── measured: circumferences (cm) ──
  neckCm?: number | null;
  shoulderCm?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  upperAbdomenCm?: number | null;
  lowerAbdomenCm?: number | null;
  hipCm?: number | null;
  armUpperLCm?: number | null;
  armUpperRCm?: number | null;
  armLowerLCm?: number | null;
  armLowerRCm?: number | null;
  thighLCm?: number | null;
  thighRCm?: number | null;
  calfLCm?: number | null;
  calfRCm?: number | null;
  sex?: 'male' | 'female';
}

export interface BodyComp {
  weightKg: number;
  // fat
  bodyFatPct: number | null;
  fatMassKg: number | null;
  fatCategory: string | null;
  // lean / muscle
  leanMassKg: number | null;
  muscleMassKg: number | null;
  musclePct: number | null; // of total weight
  musclePctOfLean: number | null;
  skeletalMuscleKg: number | null;
  skeletalMusclePct: number | null;
  // water
  bodyWaterPct: number | null;
  bodyWaterKg: number | null;
  trappedWaterKg: number | null;
  waterStatus: 'low' | 'healthy' | 'high' | null;
  // other compartments
  boneMassKg: number | null;
  bonePct: number | null;
  proteinPct: number | null;
  proteinKg: number | null;
  visceralFatRating: number | null;
  visceralStatus: 'healthy' | 'excess' | 'high' | null;
  // indices
  bmi: number | null;
  bmiCategory: string | null;
  obesityDegreePct: number | null;
  ffmi: number | null;
  normalizedFFMI: number | null;
  waistToHip: number | null;
  waistToHeight: number | null;
  // energy
  bmrKcal: number | null;
  bmrBasis: 'katch' | 'scale' | null;
}

/** Healthy total-body-water reference ranges (% of mass). */
const WATER_RANGE = {
  male: [50, 65] as const,
  female: [45, 60] as const,
};

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Katch-McArdle BMR — more accurate than Mifflin when lean mass is measured. */
export function katchMcArdleBMR(leanMassKg: number): number {
  return Math.round(370 + 21.6 * leanMassKg);
}

/** BMI = kg / m². */
export function bmiOf(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return m > 0 ? r1(weightKg / (m * m)) : 0;
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  if (bmi < 35) return 'Obese I';
  if (bmi < 40) return 'Obese II';
  return 'Obese III';
}

/**
 * Obesity degree — how far you are from an "ideal" weight, as used by
 * bio-impedance scales: ideal weight is taken at BMI 22.
 *   degree% = (weight − ideal) / ideal × 100
 */
export function obesityDegree(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  if (m <= 0) return 0;
  const ideal = 22 * m * m;
  return r1(((weightKg - ideal) / ideal) * 100);
}

/** Visceral fat rating bands (bio-impedance scale convention). */
export function visceralStatusOf(rating: number): 'healthy' | 'excess' | 'high' {
  if (rating <= 9) return 'healthy';
  if (rating <= 14) return 'excess';
  return 'high';
}

export function computeBodyComp(input: BodyCompInput): BodyComp {
  const { weightKg, sex = 'male' } = input;
  const heightM = input.heightCm ? input.heightCm / 100 : null;

  // Reconcile fat mass ↔ body-fat %.
  let fatMassKg: number | null = input.fatMassKg ?? null;
  let bodyFatPct: number | null = input.bodyFatPct ?? null;
  if (fatMassKg == null && bodyFatPct != null && weightKg > 0) {
    fatMassKg = (bodyFatPct / 100) * weightKg;
  } else if (bodyFatPct == null && fatMassKg != null && weightKg > 0) {
    bodyFatPct = (fatMassKg / weightKg) * 100;
  }

  const leanMassKg = fatMassKg != null ? Math.max(0, weightKg - fatMassKg) : null;
  const muscleMassKg = input.muscleMassKg ?? null;
  const musclePct = muscleMassKg != null && weightKg > 0 ? r1((muscleMassKg / weightKg) * 100) : null;
  const musclePctOfLean =
    muscleMassKg != null && leanMassKg && leanMassKg > 0 ? r1((muscleMassKg / leanMassKg) * 100) : null;

  const skeletalMuscleKg = input.skeletalMuscleKg ?? null;
  const skeletalMusclePct =
    skeletalMuscleKg != null && weightKg > 0 ? r1((skeletalMuscleKg / weightKg) * 100) : null;

  const bodyWaterPct = input.bodyWaterPct ?? null;
  const bodyWaterKg = bodyWaterPct != null ? r1((bodyWaterPct / 100) * weightKg) : null;

  let waterStatus: BodyComp['waterStatus'] = null;
  if (bodyWaterPct != null) {
    const [lo, hi] = WATER_RANGE[sex];
    waterStatus = bodyWaterPct < lo ? 'low' : bodyWaterPct > hi ? 'high' : 'healthy';
  }

  const boneMassKg = input.boneMassKg ?? null;
  const bonePct = boneMassKg != null && weightKg > 0 ? r1((boneMassKg / weightKg) * 100) : null;

  const proteinPct = input.proteinPct ?? null;
  const proteinKg = proteinPct != null && weightKg > 0 ? r1((proteinPct / 100) * weightKg) : null;

  const visceralFatRating = input.visceralFatRating ?? null;
  const visceralStatus = visceralFatRating != null ? visceralStatusOf(visceralFatRating) : null;

  let ffmi: number | null = null;
  let normalizedFFMI: number | null = null;
  if (leanMassKg != null && heightM && heightM > 0) {
    ffmi = leanMassKg / (heightM * heightM);
    normalizedFFMI = r1(ffmi + 6.1 * (1.8 - heightM));
    ffmi = r1(ffmi);
  }

  const bmi = input.heightCm ? bmiOf(weightKg, input.heightCm) : null;
  const obesityDegreePct = input.heightCm ? obesityDegree(weightKg, input.heightCm) : null;

  const waistToHip =
    input.waistCm && input.hipCm && input.hipCm > 0 ? Math.round((input.waistCm / input.hipCm) * 100) / 100 : null;
  const waistToHeight =
    input.waistCm && input.heightCm && input.heightCm > 0
      ? Math.round((input.waistCm / input.heightCm) * 100) / 100
      : null;

  // Prefer Katch-McArdle (uses measured lean mass); fall back to the scale's own.
  let bmrKcal: number | null = null;
  let bmrBasis: BodyComp['bmrBasis'] = null;
  if (leanMassKg != null && leanMassKg > 0) {
    bmrKcal = katchMcArdleBMR(leanMassKg);
    bmrBasis = 'katch';
  } else if (input.bmrKcal != null) {
    bmrKcal = Math.round(input.bmrKcal);
    bmrBasis = 'scale';
  }

  return {
    weightKg,
    bodyFatPct: bodyFatPct != null ? r1(bodyFatPct) : null,
    fatMassKg: fatMassKg != null ? r1(fatMassKg) : null,
    fatCategory: bodyFatPct != null ? bodyFatCategory(bodyFatPct, sex) : null,
    leanMassKg: leanMassKg != null ? r1(leanMassKg) : null,
    muscleMassKg,
    musclePct,
    musclePctOfLean,
    skeletalMuscleKg,
    skeletalMusclePct,
    bodyWaterPct,
    bodyWaterKg,
    trappedWaterKg: input.trappedWaterKg ?? null,
    waterStatus,
    boneMassKg,
    bonePct,
    proteinPct,
    proteinKg,
    visceralFatRating,
    visceralStatus,
    bmi,
    bmiCategory: bmi != null ? bmiCategory(bmi) : null,
    obesityDegreePct,
    ffmi,
    normalizedFFMI,
    waistToHip,
    waistToHeight,
    bmrKcal,
    bmrBasis,
  };
}

/** Descriptive body-fat category (American Council on Exercise ranges). */
export function bodyFatCategory(pct: number, sex: 'male' | 'female'): string {
  const t =
    sex === 'female'
      ? { ess: 13, ath: 20, fit: 24, avg: 31 }
      : { ess: 5, ath: 13, fit: 17, avg: 24 };
  if (pct < t.ess) return 'Essential';
  if (pct < t.ath) return 'Athletic';
  if (pct < t.fit) return 'Fitness';
  if (pct < t.avg) return 'Average';
  return 'Above average';
}

/** Interpret a normalized FFMI value. ~25 is the natural-muscular ceiling. */
export function ffmiCategory(nFFMI: number, sex: 'male' | 'female'): string {
  const shift = sex === 'female' ? -3 : 0;
  const v = nFFMI - shift;
  if (v < 18) return 'Lean';
  if (v < 20) return 'Average';
  if (v < 22) return 'Fit';
  if (v < 24) return 'Muscular';
  if (v < 26) return 'Very muscular';
  return 'Exceptional';
}

/** The tape measurements, in display order — used by the form and history. */
export const MEASUREMENT_FIELDS: Array<{ key: keyof BodyCompInput; label: string; group: string }> = [
  { key: 'neckCm', label: 'Neck', group: 'Upper body' },
  { key: 'shoulderCm', label: 'Shoulders', group: 'Upper body' },
  { key: 'chestCm', label: 'Chest', group: 'Upper body' },
  { key: 'upperAbdomenCm', label: 'Upper abdomen', group: 'Torso' },
  { key: 'waistCm', label: 'Waist', group: 'Torso' },
  { key: 'lowerAbdomenCm', label: 'Lower abdomen', group: 'Torso' },
  { key: 'hipCm', label: 'Hips', group: 'Torso' },
  { key: 'armUpperLCm', label: 'Upper arm (L)', group: 'Arms' },
  { key: 'armUpperRCm', label: 'Upper arm (R)', group: 'Arms' },
  { key: 'armLowerLCm', label: 'Forearm (L)', group: 'Arms' },
  { key: 'armLowerRCm', label: 'Forearm (R)', group: 'Arms' },
  { key: 'thighLCm', label: 'Thigh (L)', group: 'Legs' },
  { key: 'thighRCm', label: 'Thigh (R)', group: 'Legs' },
  { key: 'calfLCm', label: 'Calf (L)', group: 'Legs' },
  { key: 'calfRCm', label: 'Calf (R)', group: 'Legs' },
];
