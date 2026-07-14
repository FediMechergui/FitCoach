/**
 * Catalogue of common chronic conditions. Selecting a condition lets FitCoach
 * surface general, non-diagnostic considerations in reports and coach tips, and
 * flag them for a nutritionist/coach. This is educational context only — it is
 * not medical advice, and the app always defers to the user's clinician.
 */

export type ConditionCategory =
  | 'metabolic'
  | 'cardiovascular'
  | 'respiratory'
  | 'musculoskeletal'
  | 'hormonal'
  | 'digestive'
  | 'mental'
  | 'other';

export interface ConditionDef {
  key: string;
  label: string;
  category: ConditionCategory;
  /** short, general guidance shown to the user and included in reports */
  consideration: string;
}

export const CONDITION_CATALOGUE: ConditionDef[] = [
  { key: 'type1_diabetes', label: 'Type 1 Diabetes', category: 'metabolic', consideration: 'Monitor blood glucose around training; carry fast carbs. Coordinate carb targets and insulin with your care team.' },
  { key: 'type2_diabetes', label: 'Type 2 Diabetes', category: 'metabolic', consideration: 'Resistance training and walking improve insulin sensitivity. Favor high-fiber, lower-GI carbs.' },
  { key: 'hypertension', label: 'Hypertension', category: 'cardiovascular', consideration: 'Avoid breath-holding (Valsalva) on heavy lifts; prioritize steady cardio and lower sodium.' },
  { key: 'high_cholesterol', label: 'High Cholesterol', category: 'cardiovascular', consideration: 'Emphasize unsaturated fats and soluble fiber; regular aerobic work helps the lipid profile.' },
  { key: 'heart_disease', label: 'Heart Disease', category: 'cardiovascular', consideration: 'Train within clinician-set heart-rate limits; progress intensity gradually and stop with any chest symptoms.' },
  { key: 'asthma', label: 'Asthma', category: 'respiratory', consideration: 'Warm up thoroughly, keep a reliever inhaler handy, and be cautious in cold/dry air.' },
  { key: 'copd', label: 'COPD', category: 'respiratory', consideration: 'Interval-style, paced sessions and breathing techniques help; monitor exertion carefully.' },
  { key: 'hypothyroidism', label: 'Hypothyroidism', category: 'hormonal', consideration: 'Metabolism can run lower — recalibrate calorie targets gradually and be patient with fat loss.' },
  { key: 'hyperthyroidism', label: 'Hyperthyroidism', category: 'hormonal', consideration: 'Higher metabolic demand — ensure adequate calories and monitor resting heart rate.' },
  { key: 'pcos', label: 'PCOS', category: 'hormonal', consideration: 'Resistance training + higher-protein, lower-GI eating improve insulin sensitivity and body composition.' },
  { key: 'arthritis', label: 'Arthritis / Joint issues', category: 'musculoskeletal', consideration: 'Favor low-impact and controlled ranges; keep joints warm and progress load conservatively.' },
  { key: 'osteoporosis', label: 'Osteoporosis', category: 'musculoskeletal', consideration: 'Progressive resistance and weight-bearing work support bone density; avoid loaded spinal flexion.' },
  { key: 'lower_back_pain', label: 'Chronic Lower-Back Pain', category: 'musculoskeletal', consideration: 'Build core stability, master hip-hinge mechanics, and progress load slowly.' },
  { key: 'celiac', label: 'Celiac Disease', category: 'digestive', consideration: 'Strict gluten-free intake; watch iron, fiber and B-vitamins.' },
  { key: 'ibs', label: 'IBS', category: 'digestive', consideration: 'Identify trigger foods (often high-FODMAP); time fiber and meals around training.' },
  { key: 'kidney_disease', label: 'Chronic Kidney Disease', category: 'other', consideration: 'Protein, sodium and potassium may need limits — set macro targets with your clinician.' },
  { key: 'anemia', label: 'Anemia', category: 'other', consideration: 'Endurance can suffer with low iron; prioritize iron + vitamin C and progress cautiously.' },
  { key: 'depression', label: 'Depression', category: 'mental', consideration: 'Regular exercise is a strong mood support; consistency matters more than intensity.' },
  { key: 'anxiety', label: 'Anxiety', category: 'mental', consideration: 'Breathwork, mobility and steady cardio help regulate; watch high caffeine intake.' },
  { key: 'pregnancy', label: 'Pregnancy', category: 'other', consideration: 'Follow clinician guidance; generally avoid supine work later on and overheating, and keep effort conversational.' },
];

export function findCondition(key: string): ConditionDef | undefined {
  return CONDITION_CATALOGUE.find((c) => c.key === key);
}

export const CONDITION_CATEGORY_LABEL: Record<ConditionCategory, string> = {
  metabolic: 'Metabolic',
  cardiovascular: 'Cardiovascular',
  respiratory: 'Respiratory',
  musculoskeletal: 'Musculoskeletal',
  hormonal: 'Hormonal',
  digestive: 'Digestive',
  mental: 'Mental health',
  other: 'Other',
};
