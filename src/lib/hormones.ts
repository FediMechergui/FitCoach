/**
 * Hormone reference — the endocrine signals that most shape training, recovery,
 * body composition, appetite and mood. For each hormone FitCoach shows what it
 * does, what raises or lowers it, and the signs of it running low or high, plus
 * practical lifestyle levers.
 *
 * This is educational context only — it is NOT a diagnosis and never a substitute
 * for lab work or a clinician. FitCoach cannot measure your hormones; it lets you
 * note ones you're low/high in or monitoring so the guidance is relevant to you.
 */

export type HormoneCategory =
  | 'anabolic'
  | 'metabolic'
  | 'stress'
  | 'thyroid'
  | 'sleep'
  | 'appetite'
  | 'reproductive';

export interface HormoneDef {
  key: string;
  label: string;
  category: HormoneCategory;
  /** one-line role */
  role: string;
  /** what tends to raise / support healthy levels */
  raisedBy: string[];
  /** what tends to suppress / disrupt it */
  loweredBy: string[];
  /** signs it may be running low / deficient */
  lowSigns: string[];
  /** signs it may be running high / excessive */
  highSigns: string[];
  /** the single most useful lifestyle lever */
  lever: string;
}

export const HORMONE_CATALOGUE: HormoneDef[] = [
  {
    key: 'testosterone',
    label: 'Testosterone',
    category: 'anabolic',
    role: 'Primary driver of muscle protein synthesis, strength, libido and drive (present in all sexes, higher in men).',
    raisedBy: ['Heavy compound resistance training', 'Adequate sleep (7–9 h)', 'Healthy fats & enough calories', 'Vitamin D, zinc, magnesium sufficiency', 'Lower body fat (if high)'],
    loweredBy: ['Chronic sleep deprivation', 'Very low-calorie or low-fat diets', 'Overtraining without recovery', 'Chronic stress / high cortisol', 'Excess alcohol', 'Obesity'],
    lowSigns: ['Low libido', 'Persistent fatigue', 'Difficulty building muscle', 'Low mood / motivation', 'Poor recovery'],
    highSigns: ['Acne / oily skin', 'Irritability or aggression', 'Sleep disruption', '(In women) irregular cycles, PCOS-type signs'],
    lever: 'Prioritise sleep and lift heavy — the two biggest natural levers. Get vitamin D, zinc and magnesium adequate.',
  },
  {
    key: 'estrogen',
    label: 'Estrogen',
    category: 'reproductive',
    role: 'Regulates the menstrual cycle, bone density, mood and fat distribution; important for recovery in all sexes.',
    raisedBy: ['Adequate body fat', 'Balanced calories', 'Phytoestrogen-containing foods (soy, flax)'],
    loweredBy: ['Very low body fat / RED-S', 'Menopause', 'Chronic under-eating', 'Excessive endurance volume'],
    lowSigns: ['Irregular or absent periods', 'Low bone density', 'Hot flushes', 'Vaginal dryness', 'Mood swings'],
    highSigns: ['Bloating / water retention', 'Breast tenderness', 'Heavy periods', 'Mood changes'],
    lever: 'Avoid chronic under-eating and extreme leanness; if periods stop, treat it as a red flag and see a clinician.',
  },
  {
    key: 'cortisol',
    label: 'Cortisol',
    category: 'stress',
    role: 'The main stress hormone — mobilises energy and follows a daily rhythm (high AM, low PM). Chronic elevation harms recovery.',
    raisedBy: ['Psychological stress', 'Poor / short sleep', 'Overtraining', 'Excess caffeine late in the day', 'Under-eating'],
    loweredBy: ['Good sleep', 'Breathwork / meditation', 'Zone-2 cardio & walking', 'Adequate carbohydrate', 'Rest days'],
    lowSigns: ['Extreme fatigue', 'Dizziness on standing', 'Salt cravings', 'Low blood pressure'],
    highSigns: ['Trouble sleeping', 'Belly-fat gain', 'Wired-but-tired feeling', 'Frequent illness', 'Stalled recovery'],
    lever: 'Protect sleep and program deload weeks. Meditation, walking and daylight exposure blunt chronic cortisol.',
  },
  {
    key: 'insulin',
    label: 'Insulin',
    category: 'metabolic',
    role: 'Shuttles glucose into cells and drives nutrient storage. Insulin sensitivity is central to body composition and health.',
    raisedBy: ['Carbohydrate & protein intake', 'Frequent large meals'],
    loweredBy: ['Resistance training & walking (improve sensitivity)', 'Lower body fat', 'Fibre-rich, lower-GI carbs', 'Fasting windows'],
    lowSigns: ['(Type 1) high blood glucose, thirst, weight loss — a medical issue'],
    highSigns: ['Insulin resistance', 'Belly fat / stubborn fat loss', 'Energy crashes after meals', 'Elevated fasting glucose'],
    lever: 'Walk after meals and lift — both dramatically improve insulin sensitivity. Favour high-fibre, whole-food carbs.',
  },
  {
    key: 'thyroid',
    label: 'Thyroid (T3 / T4 / TSH)',
    category: 'thyroid',
    role: 'Sets your metabolic rate. Low thyroid slows metabolism and recovery; high speeds everything up.',
    raisedBy: ['Adequate iodine & selenium', 'Enough calories & carbs', 'Managing chronic stress'],
    loweredBy: ['Aggressive prolonged dieting', 'Very low carb long-term', 'Iodine/selenium deficiency', 'Chronic stress'],
    lowSigns: ['Cold intolerance', 'Fatigue', 'Weight gain / slow loss', 'Dry skin', 'Constipation', 'Hair thinning'],
    highSigns: ['Heat intolerance', 'Rapid heartbeat', 'Unintentional weight loss', 'Anxiety', 'Tremor'],
    lever: 'Avoid crash diets; refeed periodically. Ensure iodine (iodised salt, dairy, fish) and selenium (Brazil nuts) intake.',
  },
  {
    key: 'growth_hormone',
    label: 'Growth Hormone (GH)',
    category: 'anabolic',
    role: 'Supports tissue repair, fat metabolism and recovery. Released mostly during deep sleep and after intense exercise.',
    raisedBy: ['Deep sleep', 'Intense / heavy training', 'Fasting', 'Sufficient protein'],
    loweredBy: ['Poor sleep', 'High body fat', 'Eating large meals right before bed', 'Chronic high blood sugar'],
    lowSigns: ['Poor recovery', 'Loss of muscle tone', 'Increased fat', 'Low energy'],
    highSigns: ['(Clinical excess) joint pain, swelling — rare and medical'],
    lever: 'Protect deep sleep — most GH is released in the first few hours of the night. Train hard, avoid late heavy meals.',
  },
  {
    key: 'melatonin',
    label: 'Melatonin',
    category: 'sleep',
    role: 'The sleep-onset hormone — rises in the evening to prepare the body for sleep and anchors your circadian rhythm.',
    raisedBy: ['Dim light in the evening', 'Consistent sleep schedule', 'Morning daylight exposure', 'Cool, dark bedroom'],
    loweredBy: ['Blue light / screens at night', 'Late caffeine', 'Irregular sleep times', 'Alcohol'],
    lowSigns: ['Trouble falling asleep', 'Light / fragmented sleep', 'Jet-lag-like grogginess'],
    highSigns: ['Morning grogginess (usually from supplementing too much)', 'Vivid dreams'],
    lever: 'Dim lights and cut screens 60–90 min before bed; get bright light within an hour of waking.',
  },
  {
    key: 'leptin',
    label: 'Leptin (satiety)',
    category: 'appetite',
    role: 'The "I\'m full / energy is plentiful" signal from fat cells. Drops during dieting, which increases hunger.',
    raisedBy: ['Adequate body fat & calories', 'Good sleep', 'Refeed / diet breaks'],
    loweredBy: ['Prolonged calorie deficit', 'Sleep deprivation', 'Very low body fat'],
    lowSigns: ['Rising hunger while dieting', 'Low energy', 'Cold', 'Diet plateau'],
    highSigns: ['Leptin resistance (with obesity) — hunger signals ignored'],
    lever: 'On long diets, use periodic maintenance refeeds and protect sleep to keep hunger and metabolism in check.',
  },
  {
    key: 'ghrelin',
    label: 'Ghrelin (hunger)',
    category: 'appetite',
    role: 'The "I\'m hungry" hormone from the stomach. Rises before meals and with poor sleep, driving appetite.',
    raisedBy: ['Fasting / empty stomach', 'Sleep deprivation', 'Rapid weight loss'],
    loweredBy: ['Protein & fibre-rich meals', 'Adequate sleep', 'Regular meal timing'],
    lowSigns: ['Low appetite (rarely a problem)'],
    highSigns: ['Constant hunger', 'Cravings', 'Overeating — often worse after a bad night\'s sleep'],
    lever: 'Anchor meals with protein and fibre, and sleep enough — one bad night spikes ghrelin and appetite the next day.',
  },
  {
    key: 'vitamin_d',
    label: 'Vitamin D (hormone)',
    category: 'metabolic',
    role: 'Acts as a hormone affecting bone health, immunity, mood and testosterone. Widespread deficiency, especially in winter.',
    raisedBy: ['Sunlight exposure', 'Fatty fish & egg yolks', 'Vitamin D3 supplementation', 'Fortified foods'],
    loweredBy: ['Little sun exposure', 'Darker skin at high latitude', 'Winter months', 'Always covering up / sunscreen only'],
    lowSigns: ['Frequent illness', 'Fatigue', 'Low mood', 'Bone / muscle aches', 'Poor recovery'],
    highSigns: ['(From over-supplementing) nausea, high calcium — rare'],
    lever: 'Get sensible sun exposure; if that\'s not possible, a D3 supplement is one of the best-supported for deficiency.',
  },
];

export function findHormone(key: string): HormoneDef | undefined {
  return HORMONE_CATALOGUE.find((h) => h.key === key);
}

export const HORMONE_CATEGORY_LABEL: Record<HormoneCategory, string> = {
  anabolic: 'Anabolic & recovery',
  metabolic: 'Metabolic',
  stress: 'Stress',
  thyroid: 'Thyroid',
  sleep: 'Sleep & circadian',
  appetite: 'Appetite',
  reproductive: 'Reproductive',
};

export const HORMONE_STATUS_LABEL = {
  low: 'Running low',
  high: 'Running high',
  monitoring: 'Monitoring',
} as const;
