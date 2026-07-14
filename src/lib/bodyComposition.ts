/**
 * Body-composition engine. From a weigh-in the user can optionally supply body
 * fat %, fat mass, muscle mass, body-water % and bone mass; we reconcile those
 * into a coherent picture (fat vs fat-free mass) and derive muscularity metrics.
 *
 * FFMI (Fat-Free Mass Index) is a height-normalized measure of muscularity:
 *   FFMI = leanMassKg / heightM²      (normalized to 1.8 m for comparability)
 */

export interface BodyCompInput {
  weightKg: number;
  heightCm?: number | null;
  bodyFatPct?: number | null;
  fatMassKg?: number | null;
  muscleMassKg?: number | null;
  bodyWaterPct?: number | null;
  boneMassKg?: number | null;
  sex?: 'male' | 'female';
}

export interface BodyComp {
  weightKg: number;
  bodyFatPct: number | null;
  fatMassKg: number | null;
  leanMassKg: number | null; // fat-free mass
  muscleMassKg: number | null;
  musclePctOfLean: number | null;
  bodyWaterPct: number | null;
  bodyWaterKg: number | null;
  boneMassKg: number | null;
  ffmi: number | null;
  normalizedFFMI: number | null;
  waterStatus: 'low' | 'healthy' | 'high' | null;
}

/** Healthy total-body-water reference ranges (% of mass). */
const WATER_RANGE = {
  male: [50, 65] as const,
  female: [45, 60] as const,
};

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
  const musclePctOfLean =
    muscleMassKg != null && leanMassKg && leanMassKg > 0
      ? Math.round((muscleMassKg / leanMassKg) * 1000) / 10
      : null;

  const bodyWaterPct = input.bodyWaterPct ?? null;
  const bodyWaterKg = bodyWaterPct != null ? Math.round(((bodyWaterPct / 100) * weightKg) * 10) / 10 : null;

  let waterStatus: BodyComp['waterStatus'] = null;
  if (bodyWaterPct != null) {
    const [lo, hi] = WATER_RANGE[sex];
    waterStatus = bodyWaterPct < lo ? 'low' : bodyWaterPct > hi ? 'high' : 'healthy';
  }

  let ffmi: number | null = null;
  let normalizedFFMI: number | null = null;
  if (leanMassKg != null && heightM && heightM > 0) {
    ffmi = leanMassKg / (heightM * heightM);
    normalizedFFMI = ffmi + 6.1 * (1.8 - heightM);
    ffmi = Math.round(ffmi * 10) / 10;
    normalizedFFMI = Math.round(normalizedFFMI * 10) / 10;
  }

  return {
    weightKg,
    bodyFatPct: bodyFatPct != null ? Math.round(bodyFatPct * 10) / 10 : null,
    fatMassKg: fatMassKg != null ? Math.round(fatMassKg * 10) / 10 : null,
    leanMassKg: leanMassKg != null ? Math.round(leanMassKg * 10) / 10 : null,
    muscleMassKg,
    musclePctOfLean,
    bodyWaterPct,
    bodyWaterKg,
    boneMassKg: input.boneMassKg ?? null,
    ffmi,
    normalizedFFMI,
    waterStatus,
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
