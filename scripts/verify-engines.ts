/* Smoke-test the pure domain engines against known values. Run: npx tsx scripts/verify-engines.ts */
import { calculateBMR, calculateTDEE, computeTargets, refineTDEE, GOAL_LABELS, GOAL_BLURBS, GOAL_NOTES, GOAL_ORDER } from '../src/lib/calories';
import { epley1RM, brzycki1RM, estimate1RM } from '../src/lib/oneRepMax';
import { caloriesFromMet, walkRunMet } from '../src/lib/met';
import { estimateBodyType, bmi } from '../src/lib/bodyType';
import { StepDetector, distanceFromSteps } from '../src/lib/pedometer';
import { lifeMinutesLost, moneyCost, aerobicPenaltyPct, currentQuitMilestone, DEFAULT_SMOKING_SETTINGS } from '../src/lib/smoking';
import { generateCoachTips, type CoachContext } from '../src/lib/recommendations';
import { estimateFromDescription } from '../src/data/foods';
import { computeDrink, estimateBAC, alcoholGrams } from '../src/lib/alcohol';
import { computeBodyComp, ffmiCategory, MEASUREMENT_FIELDS } from '../src/lib/bodyComposition';
import { computeCycle } from '../src/lib/cycle';
import { computeRating } from '../src/lib/rating';
import { assessNight, sleepDebt } from '../src/lib/sleep';
import { rangeMinutes, minutesToHM, minutesToHours, hmToMinutes } from '../src/lib/time';
import { projectedYearHours, timeEquivalents, minutesFor } from '../src/lib/habits';
import { estimateFromDescription as estFood } from '../src/data/foods';
import { EXERCISE_LIBRARY, WARMUPS_BY_MUSCLE } from '../src/data/exercises';
import { SPLITS } from '../src/data/splits';
import { computePrayerTimes, nextPrayer } from '../src/lib/prayers';
import { resolveWindow, fastingState } from '../src/lib/fasting';
import { scoreMuscle, naturalGainRangeKgPerMonth } from '../src/lib/growth';
import { sumMicros, scaleMicros, percentRdi, microStatus, microGaps, MICRO_KEYS } from '../src/lib/micros';
import { haversine, routeDistanceM, normalizeRoute, parseRoute, type LatLng } from '../src/lib/geo';
import { generateDietPlan } from '../src/lib/dietPlan';
import { EXERCISE_LIBRARY as EXLIB, PRAYER_EXERCISE_MINUTES } from '../src/data/exercises';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../src/data/achievements';
import { evaluateAchievement, TRACKED_ACHIEVEMENT_COUNT } from '../src/lib/achievementRules';
import type { AchievementStats } from '../src/repositories/achievementsRepo';
import { FOOD_DB, FOODS_WITH_MICROS } from '../src/data/foods';
import { SUPPLEMENTS, findSupplement } from '../src/data/supplements';
import { buildIntakePlan } from '../src/lib/supplementPlan';
import { projectComposition, compareToActual, explainGap, fatLossFraction, leanGainFraction, type DayInput } from '../src/lib/projection';
import { distributeSessionCalories, activeSecondsFor, caloriesForReference } from '../src/lib/exerciseCalories';
import { TRAINING_METHODS, methodsFor, findMethod } from '../src/data/trainingMethods';
import { PROGRAMS, programsFor } from '../src/data/programs';

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`); }
  else { fail++; console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
}
const near = (a: number, b: number, tol = 1) => Math.abs(a - b) <= tol;

console.log('\nCalories (Mifflin-St Jeor):');
// Man 80kg, 180cm, 30y: 10*80 + 6.25*180 - 5*30 + 5 = 800+1125-150+5 = 1780
const bmrM = calculateBMR('male', 80, 180, 30);
check('BMR male 80/180/30 = 1780', bmrM === 1780, `got ${bmrM}`);
// Woman 60kg, 165cm, 30y: 600 + 1031.25 - 150 - 161 = 1320.25 → 1320
const bmrF = calculateBMR('female', 60, 165, 30);
check('BMR female 60/165/30 ≈ 1320', near(bmrF, 1320), `got ${bmrF}`);
const tdee = calculateTDEE(bmrM, 'moderate'); // 1780 * 1.55 = 2759
check('TDEE moderate = 2759', tdee === 2759, `got ${tdee}`);
const targets = computeTargets({ sex: 'male', age: 30, heightCm: 180, weightKg: 80, activityLevel: 'moderate', goal: 'lose_fat', rate: 'moderate' });
check('Fat-loss target below TDEE', targets.calorieTarget < tdee && targets.calorieTarget >= bmrM, `target ${targets.calorieTarget}, tdee ${tdee}`);
check('Macros sum ~ calories', near(targets.macros.protein*4 + targets.macros.carbs*4 + targets.macros.fat*9, targets.calorieTarget, 60), `P${targets.macros.protein} C${targets.macros.carbs} F${targets.macros.fat}`);
const refined = refineTDEE({ formulaTDEE: 2500, avgDailyIntake: 2000, weightChangeKg: -0.5, days: 14 });
check('Dynamic TDEE refine in bounds', refined >= 2500*0.75 && refined <= 2500*1.25, `got ${refined}`);

console.log('\nOne-Rep-Max:');
check('Epley 100x1 = 100', epley1RM(100, 1) === 100);
check('Epley 100x10 ≈ 133.3', near(epley1RM(100, 10), 133.33, 0.1), `${epley1RM(100,10).toFixed(2)}`);
check('Brzycki 100x10 ≈ 133.3', near(brzycki1RM(100, 10), 133.33, 0.5), `${brzycki1RM(100,10).toFixed(2)}`);
check('estimate1RM rounds', estimate1RM(100, 5) === Math.round(epley1RM(100,5)*10)/10);

console.log('\nMET calorie burn:');
// 8 MET, 80kg, 30 min = 8*3.5*80/200*30 = 336
const burn = caloriesFromMet(8, 80, 1800);
check('8 MET 80kg 30min = 336', burn === 336, `got ${burn}`);
check('walkRunMet increases with speed', walkRunMet(10) > walkRunMet(5));

console.log('\nBody type:');
check('BMI 80/180 ≈ 24.7', near(bmi(180,80), 24.69, 0.1), `${bmi(180,80).toFixed(2)}`);
check('Low BMI → ectomorph', estimateBodyType({ heightCm: 185, weightKg: 60 }) === 'ectomorph');
check('High BMI → endomorph', estimateBodyType({ heightCm: 165, weightKg: 95 }) === 'endomorph');

console.log('\nPedometer (accelerometer fallback):');
const det = new StepDetector();
// Simulate ~2Hz walking: sinusoidal magnitude around 1g with steps.
let steps = 0;
for (let i = 0; i < 400; i++) {
  const t = i * 20; // ms, 50Hz
  const mag = 1 + 0.5 * Math.sin((2 * Math.PI * 2 * t) / 1000); // 2 steps/sec
  // decompose into z only for test
  if (det.onSample(0, 0, mag, t)) steps++;
}
check('Detects ~16 steps over 8s @2Hz', det.steps >= 10 && det.steps <= 20, `got ${det.steps}`);
check('distanceFromSteps positive', distanceFromSteps(1000, 175, 'walk') > 600);

console.log('\nSmoking impact model:');
check('11 min per cigarette', lifeMinutesLost(10) === 110);
check('Money: 20 cigs = 1 pack', near(moneyCost(20, DEFAULT_SMOKING_SETTINGS), 8, 0.01), `${moneyCost(20, DEFAULT_SMOKING_SETTINGS)}`);
check('Aerobic penalty capped at 15%', aerobicPenaltyPct(100) === 15, `${aerobicPenaltyPct(100)}`);
check('Aerobic penalty ~6% at 10/day', near(aerobicPenaltyPct(10), 6, 0.1), `${aerobicPenaltyPct(10)}`);
check('Quit milestone at 13h = CO normalized', currentQuitMilestone(13)?.afterLabel === '12 hours', `${currentQuitMilestone(13)?.afterLabel}`);

console.log('\nHonest-log estimator:');
const est = estimateFromDescription('burger, fries and a soda');
check('burger+fries+soda estimated', est.calories > 800 && est.matched.length >= 3, `${est.calories} kcal, ${est.matched.join('+')}`);
const skip = estimateFromDescription('skipped lunch');
check('skipped meal ~ 0 kcal', skip.calories === 0, `${skip.calories}`);

console.log('\nCoach-tips engine (incl. smoking):');
const ctx: CoachContext = {
  today: '2026-07-14', goal: 'lose_fat',
  daysSinceLastSession: 5, consecutiveTrainingDays: 6, daysSinceType: { mindbody: 25 }, volumeDrops: [{ exercise: 'Bench', dropPct: 22 }],
  calorieTarget: 2000, proteinTarget: 150, avgCalories7d: 2100, daysUnderProtein7d: 4, daysLoggedNutrition7d: 6,
  weightTrendKgPerWeek: 0.0, avgWaterMl7d: 1000, waterGoalMl: 2500, avgCaffeineMg7d: 500, caffeineSoftLimitMg: 400,
  stepsToday: 1000, stepGoal: 8000, sessionLoggedToday: true,
  smokingEnabled: true, cigsToday: 3, avgCigsPerDay7d: 12, smokeFreeStreak: 0, smokingDailyTarget: 2, aerobicPenaltyPct: 7.2,
  avgSleep7d: 5.5, lastNightSleep: 5, alcoholWeekG: 140, alcoholWeeklyLimitG: 100, dryDays7d: 0,
  cycleEnabled: true, cyclePhase: 'luteal', cycleDaysUntilPeriod: 1,
};
const tips = generateCoachTips(ctx);
const cats = new Set(tips.map((t) => t.category));
check('Generates multiple tips', tips.length >= 5, `${tips.length} tips`);
check('Includes a smoking tip', cats.has('smoking'), [...cats].join(','));
check('Smoking-on-training-day fires', tips.some((t) => t.ruleKey.startsWith('smoking.training_day')));
check('Over-cap tip fires', tips.some((t) => t.ruleKey.startsWith('smoking.over_cap')));
check('Recovery (no rest) fires', tips.some((t) => t.category === 'recovery'));
check('Sleep low-avg tip fires', tips.some((t) => t.category === 'sleep'));
check('Alcohol over-limit tip fires', tips.some((t) => t.ruleKey.startsWith('alcohol.over_limit')));
check('Cycle pre-period tip fires', tips.some((t) => t.ruleKey.startsWith('cycle.pre_period')));

console.log('\nAlcohol model:');
// 330ml beer @5% = 330*0.05*0.789 = 13.02 g
check('Beer 330ml 5% ≈ 13g alcohol', near(alcoholGrams(330, 5), 13.02, 0.1), `${alcoholGrams(330, 5).toFixed(2)}`);
const drink = computeDrink('beer', 330, 5);
check('Beer std drinks ≈ 1.3', near(drink.standardDrinks, 1.3, 0.1), `${drink.standardDrinks}`);
check('Beer total calories > alcohol calories', drink.totalCalories > drink.alcoholCalories, `${drink.totalCalories} vs ${drink.alcoholCalories}`);
// Spirit (liquor) 45ml @45% = 45*0.45*0.789 = 15.98 g
check('Spirit 45ml 45% ≈ 16g', near(alcoholGrams(45, 45), 15.98, 0.1), `${alcoholGrams(45, 45).toFixed(2)}`);
// BAC 40g, 80kg male: 40/(0.68*80*10)=0.0735 (already in % units)
const bac = estimateBAC({ totalGrams: 40, weightKg: 80, sex: 'male' });
check('BAC 40g/80kg male ≈ 0.0735%', near(bac, 0.0735, 0.002), `${bac.toFixed(4)}%`);
check('Female BAC higher than male (same dose)', estimateBAC({ totalGrams: 40, weightKg: 80, sex: 'female' }) > bac);

console.log('\nBody composition:');
const comp = computeBodyComp({ weightKg: 80, heightCm: 180, bodyFatPct: 15, muscleMassKg: 38, bodyWaterPct: 58, sex: 'male' });
check('Fat mass = 12kg at 15% of 80kg', comp.fatMassKg === 12, `${comp.fatMassKg}`);
check('Lean mass = 68kg', comp.leanMassKg === 68, `${comp.leanMassKg}`);
check('FFMI computed', comp.normalizedFFMI != null && comp.normalizedFFMI > 18, `${comp.normalizedFFMI}`);
check('Water status healthy at 58% (male)', comp.waterStatus === 'healthy', `${comp.waterStatus}`);
check('FFMI category is a string', typeof ffmiCategory(comp.normalizedFFMI!, 'male') === 'string');

console.log('\nMenstrual cycle:');
// last period 2026-07-04, 28-day cycle, today 2026-07-14 → day 11 (follicular)
const cyc = computeCycle({ lastPeriodStart: '2026-07-04', cycleLength: 28, periodLength: 5, today: '2026-07-14' });
check('Cycle day 11', cyc.dayOfCycle === 11, `${cyc.dayOfCycle}`);
check('Follicular phase on day 11', cyc.phase === 'follicular', cyc.phase);
check('Ovulation ~ day 14 (2026-07-17)', cyc.ovulationDate === '2026-07-17', cyc.ovulationDate);
check('Next period 2026-08-01', cyc.nextPeriodDate === '2026-08-01', cyc.nextPeriodDate);

console.log('\nSleep model:');
check('7h assessed optimal', assessNight(7).status === 'optimal');
check('5h assessed short', assessNight(5).status === 'short');
check('Sleep debt: three 6h nights = 6h', sleepDebt([6, 6, 6]) === 6, `${sleepDebt([6, 6, 6])}`);

console.log('\nAthlete rating:');
const rating = computeRating({
  avgSessionsPerWeek: 4, streakDays: 12, relativeStrength: 2.2, weeklyCardioMinutes: 120, avgStepsPerDay: 9000,
  calorieAdherence: 0.9, proteinAdherence: 0.95, avgSleepHours: 7.5, restDaysPerWeek: 2, loggingDaysPerWeek: 6,
  cigarettesPerDay: 0, alcoholGramsPerWeek: 20,
});
check('Overall in 1..99', rating.overall >= 1 && rating.overall <= 99, `${rating.overall}`);
check('All attributes in range', Object.values(rating.attributes).every((v) => v >= 1 && v <= 99));
check('Solid athlete → Gold+ tier', ['Gold', 'Elite', 'Legend'].includes(rating.tier), rating.tier);

console.log('\nTime-range logging:');
check('23:30 → 07:00 = 450 min (overnight)', rangeMinutes('23:30', '07:00') === 450, `${rangeMinutes('23:30', '07:00')}`);
check('09:00 → 17:30 = 510 min', rangeMinutes('09:00', '17:30') === 510, `${rangeMinutes('09:00', '17:30')}`);
check('450 min → "7h 30m"', minutesToHM(450) === '7h 30m', minutesToHM(450));
check('450 min → 7.5 h', minutesToHours(450) === 7.5, `${minutesToHours(450)}`);
check('Invalid time → null', hmToMinutes('25:00') === null);

console.log('\nHabits model:');
check('Year hours: 210 min/wk ≈ 182h', projectedYearHours(210) === 182, `${projectedYearHours(210)}`);
check('Time equivalents produced', timeEquivalents(182).length >= 1, timeEquivalents(182).join(', '));
check('minutesFor count = qty × per-occurrence', minutesFor('count', 4, 0, 15) === 60, `${minutesFor('count', 4, 0, 15)}`);
check('minutesFor duration = minutes', minutesFor('duration', 1, 45, 15) === 45, `${minutesFor('duration', 1, 45, 15)}`);

console.log('\nTunisian food & library integrity:');
const cousEst = estFood('couscous with lamb');
check('Honest log knows couscous', cousEst.matched.some((m) => m.includes('couscous')), cousEst.matched.join('+'));
check('Library has 150+ exercises', EXERCISE_LIBRARY.length >= 150, `${EXERCISE_LIBRARY.length}`);
const slugs = EXERCISE_LIBRARY.map((e) => e.slug);
check('All exercise slugs unique', new Set(slugs).size === slugs.length, `${slugs.length} slugs`);
// Every split references exercises that exist in the library (no dead prefill).
const known = new Set(slugs);
const missing = SPLITS.flatMap((s) => s.days.flatMap((d) => d.exercises)).filter((x) => !known.has(x));
check('All split exercises exist in library', missing.length === 0, missing.join(', ') || 'none missing');
const originalNames = ['Barbell Bench Press', 'Pull-Up', 'Barbell Back Squat', 'Barbell Deadlift', 'Plank'];
check('Original exercise names preserved (log-safe)', originalNames.every((n) => EXERCISE_LIBRARY.some((e) => e.name === n)));

console.log('\nPrayer times (Tunis, 2026-07-15, UTC+1):');
const pt = computePrayerTimes({
  date: new Date(2026, 6, 15),
  latitude: 36.8065,
  longitude: 10.1815,
  tzOffsetHours: 1,
  method: 'tunisia',
});
const mins = (hm: string) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
const between = (hm: string, lo: string, hi: string) => mins(hm) >= mins(lo) && mins(hm) <= mins(hi);
check('Dhuhr ≈ solar noon (12:05–12:25)', between(pt.dhuhr, '12:05', '12:25'), pt.dhuhr);
check('Sunrise plausible (05:00–05:25)', between(pt.sunrise, '05:00', '05:25'), pt.sunrise);
check('Maghrib plausible (19:05–19:40)', between(pt.maghrib, '19:05', '19:40'), pt.maghrib);
check('Fajr plausible (03:00–04:05)', between(pt.fajr, '03:00', '04:05'), pt.fajr);
check('Asr plausible (15:45–16:30)', between(pt.asr, '15:45', '16:30'), pt.asr);
check('Isha plausible (20:50–21:40)', between(pt.isha, '20:50', '21:40'), pt.isha);
check(
  'Times strictly ordered',
  mins(pt.fajr) < mins(pt.sunrise) && mins(pt.sunrise) < mins(pt.dhuhr) &&
    mins(pt.dhuhr) < mins(pt.asr) && mins(pt.asr) < mins(pt.maghrib) && mins(pt.maghrib) < mins(pt.isha),
  `${pt.fajr} ${pt.sunrise} ${pt.dhuhr} ${pt.asr} ${pt.maghrib} ${pt.isha}`
);
const np = nextPrayer(pt, new Date(2026, 6, 15, 13, 0));
check('Next prayer after 13:00 is Asr', np.key === 'asr', np.label);

console.log('\nFasting model:');
const ramadanWin = resolveWindow('ramadan', { manualSuhoor: '04:00', manualIftar: '19:00' });
const fsNoon = fastingState(ramadanWin, new Date(2026, 6, 15, 12, 0));
check('Ramadan noon → fasting', fsNoon.fasting === true);
check('Minutes to iftar = 420', fsNoon.minutesUntilNext === 420, `${fsNoon.minutesUntilNext}`);
const fsNight = fastingState(ramadanWin, new Date(2026, 6, 15, 20, 0));
check('After iftar → eating', fsNight.fasting === false);
const ifWin = resolveWindow('intermittent', { eatingStart: '12:00', eatingEnd: '20:00' });
const fsMorning = fastingState(ifWin, new Date(2026, 6, 15, 9, 0));
check('16:8 morning → fasting, eats at 12:00', fsMorning.fasting === true && fsMorning.nextTime === '12:00', `${fsMorning.fasting} ${fsMorning.nextTime}`);

console.log('\nMuscle growth model:');
const gGood = scoreMuscle(
  { muscle: 'chest', setsThisWeek: 14, avgSetsPerWeek4w: 14, overloadTrendPct: 8, avgRestDays: 3, sessionsPerWeek: 2 },
  { proteinOk: true, sleepOk: true, calorieOk: true }
);
check('In-band + gates → growing', gGood.status === 'growing' && gGood.score >= 70, `${gGood.status} ${gGood.score}`);
const gNone = scoreMuscle(
  { muscle: 'calves', setsThisWeek: 0, avgSetsPerWeek4w: 0, overloadTrendPct: null, avgRestDays: null, sessionsPerWeek: 0 },
  { proteinOk: true, sleepOk: true, calorieOk: true }
);
check('0 sets → under-stimulated', gNone.status === 'under-stimulated');
const gr = naturalGainRangeKgPerMonth(6, 'male');
check('Beginner male 0.5–1.0 kg/mo', gr.min === 0.5 && gr.max === 1.0, `${gr.min}-${gr.max}`);
check('Female rate is half', naturalGainRangeKgPerMonth(6, 'female').max === 0.5);
check('Every muscle group has a warm-up', ['chest','back','quads','hamstrings','glutes','calves','shoulders','biceps','triceps','core','forearms'].every((m) => !!WARMUPS_BY_MUSCLE[m]));

console.log('\nMicronutrients:');
const mSum = sumMicros([{ iron_mg: 6.6, folate_ug: 358 }, { iron_mg: 4.7, magnesium_mg: 79 }]);
check('Sum adds overlapping keys (iron 11.3)', near(mSum.iron_mg, 11.3, 0.01), `${mSum.iron_mg}`);
check('Sum keeps distinct keys (folate 358)', mSum.folate_ug === 358);
check('Missing key sums to 0 (vitaminC)', mSum.vitaminC_mg === 0);
const mScaled = scaleMicros({ iron_mg: 6.6, magnesium_mg: 71 }, 2);
check('Scale ×2 doubles present keys', mScaled.iron_mg === 13.2 && mScaled.magnesium_mg === 142);
check('Iron RDI differs by sex (m8 f18)', percentRdi(9, 'iron_mg', 'male') === 113 && percentRdi(9, 'iron_mg', 'female') === 50, `${percentRdi(9,'iron_mg','male')}/${percentRdi(9,'iron_mg','female')}`);
check('Low status under 50% RDI', microStatus(3, 'iron_mg', 'female') === 'low');
check('Over-upper-limit flagged (sodium)', microStatus(3000, 'sodium_mg', 'male') === 'over');
const gaps = microGaps(sumMicros([{ vitaminC_mg: 80 }]), 'male');
check('Gaps exclude what is met, include what is missing', !gaps.some((g) => g.key === 'vitaminC_mg') && gaps.some((g) => g.key === 'iron_mg'));

console.log('\nFood micros ↔ macros integrity:');
check('190+ foods carry micro data', FOODS_WITH_MICROS >= 190, `${FOODS_WITH_MICROS}`);
const liver = FOOD_DB.find((f) => f.id === 'tn-beef-liver')!;
check('Liver is a B12 powerhouse (>20µg)', (liver.micros?.vitaminB12_ug ?? 0) > 20, `${liver.micros?.vitaminB12_ug}`);
// New foods (v2.2) carry data
const newFoods = ['tn-halwa-chamia', 'tn-cordon-bleu', 'cd-mayo', 'cd-garlic-sauce', 'cd-harissa', 'cd-harissa-arbi', 'cd-hummus', 'ms-vanilla'];
check('New foods (halwa, cordon bleu, condiments, milkshakes) all present + have micros', newFoods.every((id) => FOOD_DB.find((f) => f.id === id)?.micros), newFoods.filter((id) => !FOOD_DB.find((f) => f.id === id)?.micros).join(',') || 'all present');
check('Omega-3 filled on oily/plant foods (mayo, egg, avocado, olive oil)', ['cd-mayo', 'egg', 'avocado', 'olive-oil'].every((id) => (FOOD_DB.find((f) => f.id === id)?.micros?.omega3_mg ?? 0) > 0));
// Macros must be UNAFFECTED by the micro merge.
check('Chicken macros unchanged by micro merge', (() => {
  const c = FOOD_DB.find((f) => f.id === 'chicken-breast')!;
  return c.calories === 165 && c.protein === 31 && c.carbs === 0 && c.fat === 3.6;
})());
check('Every food micro key is a valid MicroKey', FOOD_DB.every((f) => !f.micros || Object.keys(f.micros).every((k) => (MICRO_KEYS as readonly string[]).includes(k))));

console.log('\nSupplements:');
check('Magnesium pill adds 400mg magnesium', findSupplement('magnesium')?.micros?.magnesium_mg === 400);
check('Multivitamin spans many nutrients', Object.keys(findSupplement('multivitamin')?.micros ?? {}).length >= 15);
check('Creatine is ergogenic with strong evidence', findSupplement('creatine')?.category === 'ergogenic' && findSupplement('creatine')?.evidenceLevel === 'strong');
check('Ashwagandha present & honestly rated (not strong)', ['moderate', 'limited', 'mixed'].includes(findSupplement('ashwagandha')?.evidenceLevel ?? ''));
check('Ergogenics carry evidence text', SUPPLEMENTS.filter((s) => s.category === 'ergogenic').every((s) => !!s.evidence));
check('All supplement micro keys valid', SUPPLEMENTS.every((s) => !s.micros || Object.keys(s.micros).every((k) => (MICRO_KEYS as readonly string[]).includes(k))));

console.log('\nGPS route geometry:');
// 0.001° latitude ≈ 111.32 m
check('Haversine 0.001° lat ≈ 111m', near(haversine([36.8065, 10.1815], [36.8075, 10.1815]), 111.3, 1), `${haversine([36.8065, 10.1815], [36.8075, 10.1815]).toFixed(1)}`);
const sq: LatLng[] = [[36.8, 10.18], [36.801, 10.18], [36.801, 10.1812], [36.8, 10.1812], [36.8, 10.18]];
check('Route distance sums segments (>400m loop)', routeDistanceM(sq) > 400, `${Math.round(routeDistanceM(sq))}m`);
const norm = normalizeRoute(sq);
check('normalizeRoute yields 0..1 points', !!norm && norm.points.every((p) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1));
check('normalizeRoute null for a single point', normalizeRoute([[36.8, 10.18]]) === null);
check('parseRoute round-trips JSON', parseRoute(JSON.stringify(sq)).length === sq.length && parseRoute('garbage').length === 0);

console.log('\nDiet plan generator:');
const dpTarget = { calories: 2200, protein: 160, carbs: 220, fat: 70 };
const dp = generateDietPlan(dpTarget, { style: 'balanced', meals: 4, seed: 42 });
check('Plan has 4 meals with foods', dp.meals.length === 4 && dp.meals.every((m) => m.items.length > 0));
check('Calories within ~20% of target', Math.abs(dp.totals.calories - dpTarget.calories) / dpTarget.calories < 0.2, `${dp.totals.calories} vs ${dpTarget.calories}`);
check('Protein at least meets ~85% of target', dp.totals.protein >= dpTarget.protein * 0.85, `${dp.totals.protein}`);
check('Same seed → identical plan (deterministic)', JSON.stringify(generateDietPlan(dpTarget, { seed: 7 })) === JSON.stringify(generateDietPlan(dpTarget, { seed: 7 })));
const namesA = generateDietPlan(dpTarget, { seed: 1 }).meals.flatMap((m) => m.items.map((i) => i.name)).join('|');
const namesB = generateDietPlan(dpTarget, { seed: 2 }).meals.flatMap((m) => m.items.map((i) => i.name)).join('|');
check('Different seed → different foods (variation)', namesA !== namesB);
check('Vegetarian style excludes meat/fish/poultry', generateDietPlan(dpTarget, { style: 'vegetarian', seed: 3 }).meals.flatMap((m) => m.items).every((i) => !/beef|chicken|lamb|tuna|salmon|turkey|liver|fish|sardine|shrimp/i.test(i.name)));

console.log('\nPrayer exercises:');
const prayerSlugs = ['prayer-fajr', 'prayer-dhuhr', 'prayer-asr', 'prayer-maghrib', 'prayer-isha'];
check('5 prayers are meditation exercises', prayerSlugs.every((s) => EXLIB.find((e) => e.slug === s)?.sessionType === 'meditation'));
check('Each prayer has an approximate duration', prayerSlugs.every((s) => (PRAYER_EXERCISE_MINUTES[s] ?? 0) > 0));

console.log('\nProjection — expected vs reality:');
const mkDays = (n: number, o: Partial<DayInput> = {}) =>
  Array.from({ length: n }, (_, i) => ({ date: `2026-07-${String(i + 1).padStart(2, '0')}`, intakeKcal: 2200, proteinG: 160, hardSets: 3, sleepHours: 7.5, cigarettes: 0, ...o }));
const cut = projectComposition({ startWeightKg: 80, startFatMassKg: 16, tdee: 2700, bodyweightKg: 80, days: mkDays(28) });
const cutLast = cut[cut.length - 1];
// 28 days x -500 kcal = -14000 kcal => -1.82 kg
check('Energy balance drives weight (-14000 kcal ≈ -1.8kg)', near(cutLast.weightKg, 78.2, 0.15), `${cutLast.weightKg}`);
check('Good protein + lifting + sleep spares lean', 16 - cutLast.fatMassKg! > 1.5 && 64 - cutLast.leanMassKg! < 0.3, `fat -${(16 - cutLast.fatMassKg!).toFixed(2)}, lean -${(64 - cutLast.leanMassKg!).toFixed(2)}`);
const badSleep = projectComposition({ startWeightKg: 80, startFatMassKg: 16, tdee: 2700, bodyweightKg: 80, days: mkDays(28, { sleepHours: 5, hardSets: 0, proteinG: 70 }) });
check('Poor sleep / no lifting / low protein costs more lean', 64 - badSleep[badSleep.length - 1].leanMassKg! > 0.4, `lean -${(64 - badSleep[badSleep.length - 1].leanMassKg!).toFixed(2)}`);
check('Fat-loss fraction responds to sleep', fatLossFraction({ proteinPerKg: 2, hardSetsPerWeek: 14, sleepHours: 8 }) > fatLossFraction({ proteinPerKg: 2, hardSetsPerWeek: 14, sleepHours: 5 }));
check('Lean-gain fraction responds to training/protein/smoking', leanGainFraction({ proteinPerKg: 2, hardSetsPerWeek: 14, sleepHours: 8, cigarettesPerDay: 0 }) > leanGainFraction({ proteinPerKg: 1, hardSetsPerWeek: 0, sleepHours: 5, cigarettesPerDay: 10 }));
const unlogged = projectComposition({ startWeightKg: 80, startFatMassKg: 16, tdee: 2700, bodyweightKg: 80, days: mkDays(28, { intakeKcal: null }) });
check('Unlogged days are treated as maintenance, not invented', unlogged[unlogged.length - 1].weightKg === 80);
const cmp = compareToActual(cut, [{ date: '2026-07-01', weightKg: 80, fatMassKg: 16 }, { date: '2026-07-28', weightKg: 79, fatMassKg: 15 }], 'weightKg');
check('Comparison pairs expected with actual and reports the gap', cmp.gap != null && near(cmp.gap, 79 - cutLast.weightKg, 0.05), `${cmp.gap}`);
check('Gap is explained in plain language', explainGap(cmp).length > 30);
// Muscle mass tracks the modelled lean change, from a measured anchor.
const musc = projectComposition({ startWeightKg: 80, startFatMassKg: 16, startMuscleMassKg: 36, tdee: 2700, bodyweightKg: 80, days: mkDays(28) });
const muscLast = musc[musc.length - 1];
check('Muscle mass line only appears with a measured anchor', cut[0].muscleMassKg === null && musc[0].muscleMassKg === 36);
check('Muscle mass moves with lean, not fat', near((36 - muscLast.muscleMassKg!), (64 - muscLast.leanMassKg!), 0.01), `muscle -${(36 - muscLast.muscleMassKg!).toFixed(2)}, lean -${(64 - muscLast.leanMassKg!).toFixed(2)}`);
const muscleCmp = compareToActual(musc, [{ date: '2026-07-01', weightKg: 80, muscleMassKg: 36 }, { date: '2026-07-28', weightKg: 79, muscleMassKg: 36.5 }], 'muscleMassKg');
check('Muscle mass compares expected vs measured', muscleCmp.gap != null && muscleCmp.label === 'Muscle mass', `${muscleCmp.gap}`);
check('Fat weight is a first-class metric', compareToActual(cut, [{ date: '2026-07-28', weightKg: 79, fatMassKg: 15 }], 'fatMassKg').label === 'Fat weight');

console.log('\nPer-exercise calories (real MET per movement):');
// Uniform-MET session reduces exactly to the flat session-type estimate.
const uniform = distributeSessionCalories({ durationS: 3600, weightKg: 80, fallbackMet: 5, exercises: [ { met: 5, trackingType: 'reps_weight', sets: [{ reps: 10, completed: true }] }, { met: 5, trackingType: 'reps_weight', sets: [{ reps: 10, completed: true }] } ] });
check('Uniform MET reduces to the flat session estimate', uniform.total === caloriesFromMet(5, 80, 3600), `${uniform.total} vs ${caloriesFromMet(5, 80, 3600)}`);
// Mixed session: the higher-MET movement earns a larger share for equal work.
const mixed = distributeSessionCalories({ durationS: 1800, weightKg: 80, fallbackMet: 6, exercises: [ { met: 11, trackingType: 'duration', sets: [{ durationS: 600, completed: true }] }, { met: 3, trackingType: 'duration', sets: [{ durationS: 600, completed: true }] } ] });
check('Higher-MET movement earns a bigger share', mixed.perExercise[0] > mixed.perExercise[1] * 3, `${mixed.perExercise[0]} vs ${mixed.perExercise[1]}`);
check('Per-exercise shares sum to the session total', Math.abs(mixed.perExercise[0] + mixed.perExercise[1] - mixed.total) < 1);
check('Jump rope really does burn more than stretching', mixed.perExercise[0] > 120);
// No set-level timing (a past session) still splits evenly by MET.
const past = distributeSessionCalories({ durationS: 1800, weightKg: 80, fallbackMet: 6, exercises: [ { met: 10, trackingType: 'duration', sets: [] }, { met: 4, trackingType: 'duration', sets: [] } ] });
check('Past session with no sets splits evenly by MET', past.basis === 'per-exercise' && past.perExercise[0] > past.perExercise[1]);
// No exercises at all → session-type fallback over the whole duration.
const none = distributeSessionCalories({ durationS: 1800, weightKg: 80, fallbackMet: 7, exercises: [] });
check('No exercises falls back to session-type MET', none.total === caloriesFromMet(7, 80, 1800) && none.basis === 'session-met');
check('Reps become active seconds (10 reps ≈ 30s)', activeSecondsFor({ trackingType: 'reps_weight', sets: [{ reps: 10, completed: true }] }) === 30);
check('Skipped sets do not count', activeSecondsFor({ trackingType: 'reps_weight', sets: [{ reps: 10, completed: false }] }) === 0);
check('Library reference kcal matches the MET formula', caloriesForReference(11, 80, 10) === caloriesFromMet(11, 80, 600));

console.log('\nTraining methods & martial arts:');
check('Every session type has at least one method', (['strength','calisthenics','cardio','outdoor','sport','martial_arts','mindbody','meditation'] as const).every((t) => methodsFor(t).length > 0));
check('Martial arts has strike, grappling and sparring protocols', methodsFor('martial_arts').length >= 6);
check('Methods declare how progress is measured', TRAINING_METHODS.every((m) => !!m.progressBy && m.progressNote.length > 10));
check('Martial arts exercises seeded', EXLIB.filter((e) => e.sessionType === 'martial_arts').length >= 10, `${EXLIB.filter((e) => e.sessionType === 'martial_arts').length}`);
check('Method keys unique', new Set(TRAINING_METHODS.map((m) => m.key)).size === TRAINING_METHODS.length);
check('Pill-based supplements report capsule counts', ['spirulina','ashwagandha','shilajit'].every((k) => (findSupplement(k)?.unitsPerServing ?? 0) > 0 && findSupplement(k)!.defaultDose.startsWith(String(findSupplement(k)!.unitsPerServing))));

console.log('\nPrograms & library integrity:');
const ALL_SLUGS = new Set(EXLIB.map((e) => e.slug));
// Every prefill in the app must resolve to a real exercise, or a program day
// silently starts an empty session.
const badProgramSlugs = PROGRAMS.flatMap((p) => p.days.flatMap((d) => d.exercises.filter((s) => !ALL_SLUGS.has(s))));
const badMethodSlugs = TRAINING_METHODS.flatMap((m) => (m.prefillSlugs ?? []).filter((s) => !ALL_SLUGS.has(s)));
const badSplitSlugs = SPLITS.flatMap((sp) => sp.days.flatMap((d) => d.exercises.filter((s) => !ALL_SLUGS.has(s))));
check('Every program exercise slug exists', badProgramSlugs.length === 0, badProgramSlugs.join(', '));
check('Every method prefill slug exists', badMethodSlugs.length === 0, badMethodSlugs.join(', '));
check('Every split slug exists', badSplitSlugs.length === 0, badSplitSlugs.join(', '));
check('Every program method reference exists', PROGRAMS.every((p) => p.days.every((d) => !d.method || !!findMethod(d.method))));
// Slugs are the seed's natural key — a duplicate would make the upsert
// non-deterministic and could repoint existing logs.
check('Exercise slugs unique', new Set(EXLIB.map((e) => e.slug)).size === EXLIB.length, `${EXLIB.length} exercises`);
check('Program keys unique', new Set(PROGRAMS.map((p) => p.key)).size === PROGRAMS.length, `${PROGRAMS.length} programs`);
check('Program day keys unique within each program', PROGRAMS.every((p) => new Set(p.days.map((d) => d.key)).size === p.days.length));
check('Programs cover every trainable category', (['strength','calisthenics','cardio','outdoor','sport','martial_arts','mindbody','meditation'] as const).every((t) => programsFor(t).length > 0));
check('Program days declare purpose, prescription and duration', PROGRAMS.every((p) => p.days.every((d) => d.purpose.length > 10 && d.prescription.length > 5 && d.minutes > 0)));
check('Cardio machines cover treadmill, bike, stairs and rope', ['treadmill-run','stationary-bike','stairmaster','jump-rope-basic','rowing-machine','elliptical'].every((s) => ALL_SLUGS.has(s)));
// No category should be left thin — that was the whole point of this pass.
const CATS = ['strength','calisthenics','cardio','outdoor','sport','martial_arts','mindbody','meditation'] as const;
const thin = CATS.filter((t) => EXLIB.filter((e) => e.sessionType === t).length < 30);
check('Every category has a deep exercise library (30+)', thin.length === 0, thin.length ? `thin: ${thin.join(', ')}` : CATS.map((t) => `${t} ${EXLIB.filter((e) => e.sessionType === t).length}`).join(', '));
const fewMethods = CATS.filter((t) => methodsFor(t).length < 6);
check('Every category has 6+ methods', fewMethods.length === 0, fewMethods.join(', '));
const fewPrograms = CATS.filter((t) => programsFor(t).length < 2);
check('Every category has 2+ programs', fewPrograms.length === 0, fewPrograms.join(', '));
check('Sport covers team, racket, water, winter and practice drills', ['soccer','pickleball','kayaking','ice-skating','sport-serve-practice','gymnastics','dance-ballroom'].every((s) => ALL_SLUGS.has(s)));
check('Outdoor covers run, ride, walk, water and winter', ['long-run','hill-sprints','gravel-cycling','nordic-walking','paddleboarding','cross-country-skiing','brick-session'].every((s) => ALL_SLUGS.has(s)));
check('Mind-body covers yoga styles, mobility and recovery', ['hatha-yoga','ashtanga-yoga','restorative-yoga','joint-cars','pnf-stretching','balance-training','ankle-mobility'].every((s) => ALL_SLUGS.has(s)));
check('Meditation covers focus, compassion, breath and sleep', ['noting-practice','loving-kindness','box-breathing','breathing-478','yoga-nidra','progressive-relaxation','visualization'].every((s) => ALL_SLUGS.has(s)));
check('Faith practices sit alongside the five prayers', ['dhikr','quran-recitation','dua-supplication','prayer-fajr'].every((s) => ALL_SLUGS.has(s)));
// A breathing protocol with a real fainting risk must carry its warning.
const wimhof = EXLIB.find((e) => e.slug === 'wim-hof-breathing');
check('Cyclic hyperventilation carries a water/fainting warning', /water/i.test(wimhof?.description ?? '') && (wimhof?.instructions ?? []).some((i) => /water|faint/i.test(i)));
check('Martial arts library covers styles and drills', EXLIB.filter((e) => e.sessionType === 'martial_arts').length >= 40, `${EXLIB.filter((e) => e.sessionType === 'martial_arts').length}`);

console.log('\nGoals — recomposition & performance:');
const recompTargets = computeTargets({ sex: 'male', age: 30, heightCm: 180, weightKg: 80, activityLevel: 'moderate', goal: 'recomp', rate: 'moderate' });
const cutTargets = computeTargets({ sex: 'male', age: 30, heightCm: 180, weightKg: 80, activityLevel: 'moderate', goal: 'lose_fat', rate: 'moderate' });
const bulkTargets = computeTargets({ sex: 'male', age: 30, heightCm: 180, weightKg: 80, activityLevel: 'moderate', goal: 'build_muscle', rate: 'moderate' });
const perfTargets = computeTargets({ sex: 'male', age: 30, heightCm: 180, weightKg: 80, activityLevel: 'moderate', goal: 'performance', rate: 'moderate' });
check('Recomp sits between a cut and maintenance', recompTargets.calorieTarget > cutTargets.calorieTarget && recompTargets.calorieTarget < recompTargets.tdee, `${recompTargets.calorieTarget} kcal vs cut ${cutTargets.calorieTarget}, tdee ${recompTargets.tdee}`);
check('Recomp prescribes the highest protein of any goal', recompTargets.macros.protein > cutTargets.macros.protein && recompTargets.macros.protein > bulkTargets.macros.protein, `${recompTargets.macros.protein}g vs cut ${cutTargets.macros.protein}g, bulk ${bulkTargets.macros.protein}g`);
check('Performance fuels at or above maintenance', perfTargets.calorieTarget >= perfTargets.tdee, `${perfTargets.calorieTarget} vs tdee ${perfTargets.tdee}`);
check('Performance is the most carb-forward goal', perfTargets.macros.carbs > recompTargets.macros.carbs && perfTargets.macros.carbs > cutTargets.macros.carbs, `${perfTargets.macros.carbs}g carbs`);
check('Every goal has a label, blurb and honest note', GOAL_ORDER.every((g) => !!GOAL_LABELS[g] && !!GOAL_BLURBS[g] && GOAL_NOTES[g].length > 30));
// Regression guard: adding goals must not shift the ones people already use.
// 2759 × 0.83 = 2290 (cut), 2759 × 1.12 = 3090 (bulk).
check('Existing goals unchanged by the new ones', cutTargets.calorieTarget === 2290 && bulkTargets.calorieTarget === 3090, `cut ${cutTargets.calorieTarget}, bulk ${bulkTargets.calorieTarget}`);

console.log('\nBody composition — derived metrics:');
const full = computeBodyComp({
  weightKg: 80, heightCm: 180, bodyFatPct: 20, muscleMassKg: 36, skeletalMuscleKg: 33,
  bodyWaterPct: 55, boneMassKg: 3.2, proteinPct: 17, visceralFatRating: 8, trappedWaterKg: 1.4,
  waistCm: 84, hipCm: 100, sex: 'male',
});
check('BMI 80kg/180cm = 24.7', near(full.bmi!, 24.7, 0.1), `${full.bmi}`);
check('BMI category Normal', full.bmiCategory === 'Normal', full.bmiCategory!);
check('Fat weight = 16kg at 20% of 80kg', full.fatMassKg === 16, `${full.fatMassKg}`);
check('Lean mass = 64kg', full.leanMassKg === 64, `${full.leanMassKg}`);
check('Muscle % of weight = 45%', near(full.musclePct!, 45, 0.1), `${full.musclePct}`);
check('Skeletal muscle % = 41.3%', near(full.skeletalMusclePct!, 41.3, 0.1), `${full.skeletalMusclePct}`);
check('Water weight = 44kg at 55%', near(full.bodyWaterKg!, 44, 0.1), `${full.bodyWaterKg}`);
check('Bone % = 4%', near(full.bonePct!, 4, 0.1), `${full.bonePct}`);
check('Protein weight = 13.6kg at 17%', near(full.proteinKg!, 13.6, 0.1), `${full.proteinKg}`);
check('Visceral rating 8 → healthy', full.visceralStatus === 'healthy');
// ideal at BMI22 = 22*1.8^2 = 71.28 → (80-71.28)/71.28 = +12.2%
check('Obesity degree vs BMI-22 ideal ≈ +12.2%', near(full.obesityDegreePct!, 12.2, 0.2), `${full.obesityDegreePct}`);
check('Waist-to-hip = 0.84', near(full.waistToHip!, 0.84, 0.01), `${full.waistToHip}`);
check('Waist-to-height = 0.47', near(full.waistToHeight!, 0.47, 0.01), `${full.waistToHeight}`);
// Katch-McArdle: 370 + 21.6*64 = 1752
check('BMR uses Katch-McArdle from lean mass (1752)', full.bmrKcal === 1752 && full.bmrBasis === 'katch', `${full.bmrKcal}/${full.bmrBasis}`);
const noComp = computeBodyComp({ weightKg: 80, heightCm: 180, sex: 'male' });
check('Without body fat, derived fields stay null (nothing invented)', noComp.fatMassKg === null && noComp.leanMassKg === null && noComp.bmrKcal === null);
check('BMI still computed without body fat', noComp.bmi != null);
check('15 tape measurements defined', MEASUREMENT_FIELDS.length === 15, `${MEASUREMENT_FIELDS.length}`);
// Targets should follow composition: Katch when lean mass known, Mifflin otherwise.
const tKatch = computeTargets({ sex: 'male', age: 30, heightCm: 180, weightKg: 80, activityLevel: 'moderate', goal: 'lose_fat', rate: 'moderate', bodyFatPct: 20, leanMassKg: 64 });
const tMifflin = computeTargets({ sex: 'male', age: 30, heightCm: 180, weightKg: 80, activityLevel: 'moderate', goal: 'lose_fat', rate: 'moderate' });
check('computeTargets uses Katch when lean mass supplied', tKatch.bmrBasis === 'katch' && tKatch.bmr === 1752, `${tKatch.bmr}`);
check('computeTargets falls back to Mifflin', tMifflin.bmrBasis === 'mifflin' && tMifflin.bmr === 1780, `${tMifflin.bmr}`);
check('Never prescribes below BMR', tKatch.calorieTarget >= tKatch.bmr && tMifflin.calorieTarget >= tMifflin.bmr);

console.log('\nSupplements — spirulina / shilajit / ashwagandha:');
const spir = findSupplement('spirulina')!;
check('Spirulina portion is 1 g (3 capsules)', /1 g/.test(spir.defaultDose) && /3 capsules/.test(spir.defaultDose), spir.defaultDose);
// per-100 g figures ÷ 100 for the 1 g portion
check('Spirulina minerals scaled from per-100g', near(spir.micros!.calcium_mg!, 1.2, 0.01) && near(spir.micros!.iron_mg!, 0.285, 0.01) && near(spir.micros!.magnesium_mg!, 1.95, 0.01) && near(spir.micros!.phosphorus_mg!, 1.18, 0.01) && near(spir.micros!.potassium_mg!, 13.6, 0.05));
check('Spirulina B-vitamins scaled from per-100g', near(spir.micros!.thiamin_mg!, 0.0238, 0.002) && near(spir.micros!.riboflavin_mg!, 0.0367, 0.002) && near(spir.micros!.niacin_mg!, 0.128, 0.002));
// Vitamin A stored as RAE (beta-carotene ÷12), so a stack can't trip a false toxicity flag.
check('Spirulina vitamin A stored as RAE (~117µg), not raw 1400µg', spir.micros!.vitaminA_ug! > 90 && spir.micros!.vitaminA_ug! < 150, `${spir.micros!.vitaminA_ug}`);
const heavyA = sumMicros([findSupplement('multivitamin')!.micros!, spir.micros!, spir.micros!]);
check('Multivitamin + 2 spirulina stays under vitamin A upper limit', microStatus(heavyA.vitaminA_ug, 'vitaminA_ug', 'male') !== 'over', `${heavyA.vitaminA_ug}µg`);
check('Ashwagandha portion is 400 mg extract (2 capsules)', /400 mg/.test(findSupplement('ashwagandha')!.defaultDose) && /2 capsules/.test(findSupplement('ashwagandha')!.defaultDose));
check('Shilajit present, honestly rated, no invented micros', findSupplement('shilajit')?.evidenceLevel === 'limited' && !findSupplement('shilajit')?.micros);

console.log('\nSupplement plan engine:');
const planA = buildIntakePlan(['athletic_performance', 'sleep_quality'], { caffeineMgPerDay: 320 });
check('Plan produces time-slotted items', planA.slots.length >= 2 && planA.slots.every((s) => s.items.length > 0));
check('Caffeine + sleep goal raises a conflict warning', planA.notes.some((n) => n.severity === 'warning' && /caffeine/i.test(n.text)));
const planQuit = buildIntakePlan(['quit_smoking'], { smokes: true });
check('Quit-smoking plan states supplements do not treat dependence', planQuit.notes.some((n) => n.severity === 'warning' && /nicotine dependence/i.test(n.text)));
const planWB = buildIntakePlan(['general_wellbeing'], { smokes: true });
check('Smoker + beta-carotene caution fires (ATBC/CARET)', planWB.notes.some((n) => /beta-carotene/i.test(n.text)));
const planThy = buildIntakePlan(['stress_recovery'], { conditions: ['hypothyroidism'] });
check('Thyroid condition escalates ashwagandha to a warning', planThy.notes.some((n) => n.severity === 'warning' && /thyroid/i.test(n.text)));
check('Every plan carries a not-medical-advice note', [planA, planQuit, planWB].every((p) => p.notes.some((n) => /not medical advice/i.test(n.text))));
// A supplement wanted by two goals must appear once, not twice.
const dup = buildIntakePlan(['sleep_quality', 'stress_recovery']);
const allKeys = dup.slots.flatMap((s) => s.items.map((i) => i.key));
check('Overlapping goals de-duplicate supplements', new Set(allKeys).size === allKeys.length, allKeys.join(','));

console.log('\nAchievements:');
check('Exactly 100 badges, all with SVG art', ACHIEVEMENTS.length === 100 && ACHIEVEMENTS.every((a) => a.svg.startsWith('<svg') && a.svg.endsWith('</svg>')));
check('10 categories, 10 badges each', ACHIEVEMENT_CATEGORIES.length === 10 && [1,2,3,4,5,6,7,8,9,10].every((c) => ACHIEVEMENTS.filter((a) => a.category === c).length === 10));
check('Every badge has criteria text', ACHIEVEMENTS.every((a) => a.criteria.length > 0));
check('A good share of badges are auto-tracked', TRACKED_ACHIEVEMENT_COUNT >= 50, `${TRACKED_ACHIEVEMENT_COUNT}`);
// Build a zeroed stats object and a maxed one to exercise the rules.
const zeroStats: AchievementStats = {
  appStreakBest: 0, bestStepDay: 0, best10kStreak: 0, monthDistanceKm: 0, bestRunKcal: 0, bestRunMinutes: 0,
  sessionCount: 0, maxVolumeKg: 0, fullBodyDone: false, prCount: 0, routineCount: 0, customExerciseCount: 0, maxSetsThisWeek: 0,
  tdeeCalculated: false, proteinPerKgToday: 0, nutritionLogStreak: 0, loggedDaysCount: 0, caloriesAdherentDays: 0, macroHitsToday: 0,
  waterGoalStreak: 0, caffeineUnderStreak: 0, loggedBlob: '', tunisianSalads: 0, tunisianShare7d: 0,
  bestSleepHours: 0, sleepDebt: 10, smokingEnabled: false, smokeFreeStreak: 0, smokeFreeHours: 0,
  dryDays7d: 0, dryStreak: 0, alcoholWeekGrams: 999, alcoholLimitG: 100,
  fastingStreak: 0, fastedLast30: 0, prayersEnabled: false, prayersToday: 0,
  microRdiMetCount: 0, microGapsCount: 5, hasMicroData: false, suppStackCount: 0, hasStrongSupp: false, creatineStreak: 0, ashwaStreak: 0,
  cardOverall: 0, cardEND: 0, cardDIS: 0,
};
const maxed: AchievementStats = { ...zeroStats, appStreakBest: 400, bestStepDay: 12000, best10kStreak: 8, cardOverall: 80, prCount: 3, routineCount: 2, maxVolumeKg: 12000, tdeeCalculated: true, bestSleepHours: 8, sleepDebt: 0 };
check('Fresh account unlocks nothing that is tracked-and-zero (Spark locked)', evaluateAchievement(ACHIEVEMENTS[0], zeroStats).unlocked === false);
check('The Spark unlocks at a 3-day streak', evaluateAchievement(ACHIEVEMENTS[0], maxed).unlocked === true);
check('Untracked badge (Scouted #7) reports tracked=false', evaluateAchievement(ACHIEVEMENTS.find((a) => a.id === 7)!, zeroStats).tracked === false);
check('Heavy Metal (#20) needs 10,000kg', evaluateAchievement(ACHIEVEMENTS.find((a) => a.id === 20)!, { ...zeroStats, maxVolumeKg: 10500 }).unlocked === true);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
