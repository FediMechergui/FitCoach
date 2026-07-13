/**
 * Body-type quick assessment (spec §3.7). A lightweight, transparent heuristic
 * from height/weight (BMI) plus optional waist-to-hip ratio. Used only to bias
 * initial calorie/macro/training defaults; it refreshes as real trend data
 * arrives, and is never presented as a clinical measurement.
 */

export type BodyType = 'ectomorph' | 'mesomorph' | 'endomorph';

export interface BodyTypeInputs {
  heightCm: number;
  weightKg: number;
  waistCm?: number | null;
  hipCm?: number | null;
  sex?: 'male' | 'female';
}

export const BODY_TYPE_LABELS: Record<BodyType, string> = {
  ectomorph: 'Ectomorph-leaning',
  mesomorph: 'Mesomorph-leaning',
  endomorph: 'Endomorph-leaning',
};

export const BODY_TYPE_BLURB: Record<BodyType, string> = {
  ectomorph: 'Naturally lean, gains muscle slowly. Slightly higher carbs help.',
  mesomorph: 'Builds muscle readily, responds well to balanced macros.',
  endomorph: 'Stores energy easily; a modest carb pull-back and more protein help.',
};

export function bmi(heightCm: number, weightKg: number): number {
  const m = heightCm / 100;
  if (m <= 0) return 0;
  return weightKg / (m * m);
}

export function estimateBodyType(input: BodyTypeInputs): BodyType {
  const b = bmi(input.heightCm, input.weightKg);
  const whr =
    input.waistCm && input.hipCm && input.hipCm > 0 ? input.waistCm / input.hipCm : null;

  // Waist-to-hip ratio, when available, dominates: high WHR → endomorph-leaning.
  if (whr !== null) {
    const highWhr = (input.sex === 'female' ? 0.85 : 0.95);
    const lowWhr = (input.sex === 'female' ? 0.75 : 0.85);
    if (whr >= highWhr || b >= 27) return 'endomorph';
    if (whr <= lowWhr && b < 22) return 'ectomorph';
    return 'mesomorph';
  }

  if (b < 20) return 'ectomorph';
  if (b >= 26) return 'endomorph';
  return 'mesomorph';
}

/**
 * Small macro bias applied on top of the base split (fractions added to
 * carb/fat/protein ratios, normalized by the caller). Kept intentionally gentle.
 */
export function bodyTypeCarbBias(type: BodyType): number {
  switch (type) {
    case 'ectomorph':
      return 0.05; // a touch more carbs
    case 'endomorph':
      return -0.05; // a touch fewer carbs
    default:
      return 0;
  }
}
