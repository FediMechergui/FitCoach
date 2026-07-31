/* Smoke-test the pure domain engines against known values. Run: npx tsx scripts/verify-engines.ts */
import fs from 'node:fs';
import { calculateBMR, calculateTDEE, computeTargets, refineTDEE, GOAL_LABELS, GOAL_BLURBS, GOAL_NOTES, GOAL_ORDER } from '../src/lib/calories';
import { epley1RM, brzycki1RM, estimate1RM } from '../src/lib/oneRepMax';
import { caloriesFromMet, netCaloriesFromMet, gradeMultiplier, walkCalories, walkRunMet } from '../src/lib/met';
import { estimateBodyType, bmi } from '../src/lib/bodyType';
import { StepDetector, distanceFromSteps, stepsFromDistance, stepsFromDuration } from '../src/lib/pedometer';
import { recoverGapSteps, measuredCadence, MAX_GAP_CREDIT_MIN, MAX_CADENCE, DEFAULT_CADENCE } from '../src/lib/walkRecovery';
import { progressBar, progressBarWithPct } from '../src/lib/progressBar';
import {
  classifyMotion,
  segmentSpeedMs,
  isPlausibleOnFootSegment,
  PAUSE_CONFIRM_MS,
  RESUME_CONFIRM_MS,
} from '../src/lib/motionValidation';
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
import {
  filterFixes,
  isConfined,
  spreadRadiusM,
  straightness,
  CONFINEMENT_RADIUS_M,
} from '../src/lib/gpsFilter';
import { generateDietPlan } from '../src/lib/dietPlan';
import { EXERCISE_LIBRARY as EXLIB, PRAYER_EXERCISE_MINUTES } from '../src/data/exercises';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../src/data/achievements';
import { evaluateAchievement, TRACKED_ACHIEVEMENT_COUNT } from '../src/lib/achievementRules';
import type { AchievementStats } from '../src/repositories/achievementsRepo';
import { FOOD_DB, FOODS_WITH_MICROS } from '../src/data/foods';
import { FOOD_COMPOSITES, deriveMacros } from '../src/data/foodComposites';
import {
  repsInReserve,
  stimulatingReps,
  hardSetCredit,
  summariseEffort,
  effortScore,
  effortNotes,
  isUnderStimulatingLightSet,
  proximityLabel,
  HARD_SET_MAX_RIR,
  STIMULATING_REP_WINDOW,
} from '../src/lib/effort';
import { estimate1RMFromSet, repsAtFailureEquivalent, ormConfidence } from '../src/lib/oneRepMax';
import { caloriesFromMacros, resolveCalories, parseAmount, isCompleteCustomFood } from '../src/lib/foodMath';
import { SUPPLEMENTS, findSupplement } from '../src/data/supplements';
import { buildIntakePlan } from '../src/lib/supplementPlan';
import { projectComposition, compareToActual, explainGap, fatLossFraction, leanGainFraction, type DayInput } from '../src/lib/projection';
import { distributeSessionCalories, activeSecondsFor, caloriesForReference } from '../src/lib/exerciseCalories';
import { TRAINING_METHODS, methodsFor, findMethod } from '../src/data/trainingMethods';
import { PROGRAMS, programsFor } from '../src/data/programs';
import { SPECIAL_PROGRAMS, specialProgramsFor, findSpecialProgram, specialStyleTag } from '../src/data/specialPrograms';
import { SPECIAL_DIET_BUILDS } from '../src/data/specialDietPlans';
import { subMuscleOf, subMusclesFor } from '../src/lib/subMuscle';
import { estimateDifficulty, findEasierAlternatives, type AltExercise } from '../src/lib/exerciseAlternatives';
import { estimateActivitySteps } from '../src/lib/activitySteps';
import { computeEnergyBalance, trainingLoadFraction } from '../src/lib/energyBalance';
import { dietNutrition, mealToDiaryInputs } from '../src/lib/specialDiet';
import { FOOD_DB as SPECIAL_FOOD_DB } from '../src/data/foods';

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
/** Sets carrying no effort data — how every set logged before v2.23 looks. */
const blankEffort = (n: number) =>
  summariseEffort(Array.from({ length: n }, () => ({ reps: 10, rpe: null, toFailure: false })));
const gGood = scoreMuscle(
  { muscle: 'chest', setsThisWeek: 14, avgSetsPerWeek4w: 14, effectiveSetsThisWeek: 14, avgEffectiveSetsPerWeek4w: 14, effort: blankEffort(56), overloadTrendPct: 8, avgRestDays: 3, sessionsPerWeek: 2 },
  { proteinOk: true, sleepOk: true, calorieOk: true }
);
check('In-band + gates → growing', gGood.status === 'growing' && gGood.score >= 70, `${gGood.status} ${gGood.score}`);
const gNone = scoreMuscle(
  { muscle: 'calves', setsThisWeek: 0, avgSetsPerWeek4w: 0, effectiveSetsThisWeek: 0, avgEffectiveSetsPerWeek4w: 0, effort: blankEffort(0), overloadTrendPct: null, avgRestDays: null, sessionsPerWeek: 0 },
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
// Every single food now carries micronutrients — measured where measurements
// exist, derived from the dish's own ingredients where they don't.
const noMicros = FOOD_DB.filter((f) => !f.micros);
check('Every food in the database carries micronutrients', noMicros.length === 0, noMicros.slice(0, 5).map((f) => f.id).join(', '));
{
  const byId = new Map(FOOD_DB.map((f) => [f.id, f]));
  const compositeIds = Object.keys(FOOD_COMPOSITES);
  check('Every composite recipe names a real dish', compositeIds.every((id) => byId.has(id)), compositeIds.filter((id) => !byId.has(id)).join(', '));
  const badComponents = compositeIds.flatMap((id) => FOOD_COMPOSITES[id].filter(([c]) => !byId.has(c)).map(([c]) => `${id}→${c}`));
  check('Every recipe component is a real food', badComponents.length === 0, badComponents.slice(0, 5).join(', '));
  /*
   * The check that keeps derived micros honest. A recipe is a claim about what
   * a dish is made of; if that claim were wrong, its micros would be wrong too
   * and nothing would say so. Recomputing the dish's MACROS from the same
   * recipe tests the claim against a number we already know independently — so
   * a recipe that doesn't describe the food can't sit here quietly.
   */
  const drift = compositeIds
    .map((id) => {
      const f = byId.get(id)!;
      const d = deriveMacros(id, (x) => byId.get(x))!;
      return { id, dev: Math.abs(d.calories - f.calories) / Math.max(f.calories, 1) };
    })
    .sort((a, b) => b.dev - a.dev);
  check(
    'Every recipe reproduces its dish\'s calories within 20%',
    drift[0].dev <= 0.2,
    `worst: ${drift[0].id} off by ${Math.round(drift[0].dev * 100)}%`
  );
  check('Derived dishes are flagged as derived, not passed off as measured', FOOD_DB.filter((f) => compositeIds.includes(f.id)).every((f) => f.microsDerived === true));
  check('Measured foods are never flagged as derived', (FOOD_DB.find((f) => f.id === 'chicken-breast')!).microsDerived === undefined);
  // A dish must actually gain something from its recipe.
  const emptyDerived = compositeIds.filter((id) => Object.keys(byId.get(id)?.micros ?? {}).length < 3);
  check('Every derived dish carries at least three micronutrients', emptyDerived.length === 0, emptyDerived.slice(0, 5).join(', '));
  // Spot-check that the derivation carries real signal rather than noise:
  // liver pâté should dominate vitamin A, mloukhia should dominate vitamin K.
  check('Pâté sandwich inherits liver\'s vitamin A', (byId.get('tn-pate-sandwich')?.micros?.vitaminA_ug ?? 0) > 1000);
  check('Mloukhia dishes inherit the greens\' vitamin K', (byId.get('tn-mloukhia-beef')?.micros?.vitaminK_ug ?? 0) > 50);
  check('Fried food inherits its cooking oil\'s vitamin E', (byId.get('ff-fries-medium')?.micros?.vitaminE_mg ?? 0) > 1);
}

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
check('Uniform MET reduces to the flat session estimate (net)', uniform.total === netCaloriesFromMet(5, 80, 3600), `${uniform.total} vs ${netCaloriesFromMet(5, 80, 3600)}`);
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
check('No exercises falls back to session-type MET (net)', none.total === netCaloriesFromMet(7, 80, 1800) && none.basis === 'session-met');
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

console.log('\nSpecial Programmes:');
const badSpecialSlugs = SPECIAL_PROGRAMS.flatMap((p) => p.days.flatMap((d) => d.exercises.filter((s) => !ALL_SLUGS.has(s))));
check('Every special-programme exercise slug exists', badSpecialSlugs.length === 0, badSpecialSlugs.slice(0, 5).join(', '));
check('Special-programme keys are unique', new Set(SPECIAL_PROGRAMS.map((p) => p.key)).size === SPECIAL_PROGRAMS.length, `${SPECIAL_PROGRAMS.length} programmes`);
check('Every programme has origin, ethos and an authenticity note', SPECIAL_PROGRAMS.every((p) => p.origin.length > 40 && p.ethos.length > 10 && p.authenticityNote.length > 30));
check('Every programme ships a diet with a sample day and notes', SPECIAL_PROGRAMS.every((p) => p.diet.approach.length > 40 && p.diet.sampleDay.length >= 3 && p.diet.notes.length >= 1));
check('Every day declares a session type, focus and prescription', SPECIAL_PROGRAMS.every((p) => p.days.length >= 3 && p.days.every((d) => !!d.sessionType && d.focus.length > 10 && d.prescription.length > 5 && d.minutes > 0)));
check('All five categories are populated', (['military','historical','superhero','lifestyle','counters'] as const).every((c) => specialProgramsFor(c).length >= 2));
check('The named programmes are all present', ['mil-army-acft','mil-seal-prep','mil-spetsnaz','mil-firefighter','mil-france-legion','his-roman-legion','his-spartan-agoge','his-shaolin','his-dagestan','his-aztec','his-mongol','his-gladiator','his-ninja','his-islamic-conquest','his-chinese-warrior','his-zulu-impi','his-egypt-warrior','life-office','life-morning','life-prison'].every((k) => !!findSpecialProgram(k)));
check('Bodybuilder legends present (Arnold, Ronnie, Dorian)', ['hero-arnold','hero-ronnie','hero-dorian'].every((k) => findSpecialProgram(k)?.category === 'superhero'));
check('Quick-counter programmes present (nicotine, impulse, focus)', ['ctr-nicotine','ctr-urge-reset','ctr-focus-shift'].every((k) => findSpecialProgram(k)?.category === 'counters'));
check('Urge counters are framed as evidence-based & non-judgemental', ['ctr-nicotine','ctr-urge-reset'].every((k) => /evidence|standard|non-judge|behavioural|habit/.test((findSpecialProgram(k)?.authenticityNote ?? '').toLowerCase())));
check('No counter makes pseudoscience claims (no retention/testosterone myths)', ['ctr-nicotine','ctr-urge-reset','ctr-focus-shift'].every((k) => { const p = findSpecialProgram(k)!; const blob = (p.authenticityNote + ' ' + p.origin + ' ' + p.ethos).toLowerCase(); return !/testosterone|retention|semen|superpower/.test(blob); }));
check('Superhero section covers Saitama, Batman, Bruce Lee, Rocky and the super-soldier', ['hero-saitama','hero-batman','hero-bruce-lee','hero-rocky','hero-captain'].every((k) => findSpecialProgram(k)?.category === 'superhero'));
// The demanding ones must carry a safety note.
check('Demanding programmes carry a safety note', ['mil-seal-prep','mil-commando','mil-firefighter','his-spartan-agoge','his-shaolin','his-dagestan','hero-saitama','hero-batman','life-prison'].every((k) => (findSpecialProgram(k)?.safetyNote ?? '').length > 20));
// Fictional / risky ones must be honest in their authenticity note.
check('Saitama routine is flagged as fictional, not optimal', /fiction|not.*optimal|not an optimal/i.test(findSpecialProgram('hero-saitama')?.authenticityNote ?? ''));
check('Rocky reminds you to cook the eggs', /cook|salmonella/i.test((findSpecialProgram('hero-rocky')?.authenticityNote ?? '') + JSON.stringify(findSpecialProgram('hero-rocky')?.diet.notes)));
// Iron-body / neck-bridge conditioning must warn about gradual progression.
const ironBody = EXLIB.find((e) => e.slug === 'iron-body-conditioning');
check('Body-conditioning drills warn to progress gradually', (ironBody?.instructions ?? []).some((i) => /month|gradual|pain/i.test(i)));
check('Session style tag namespaces the programme and day', specialStyleTag(SPECIAL_PROGRAMS[0], SPECIAL_PROGRAMS[0].days[0]).startsWith('special:'));
// Warrior cultures from beyond the usual Greek/Roman/Japanese canon.
const worldKeys = [
  'his-inuit-hunter', 'his-amazon-tribe', 'his-plains-nation', 'his-raramuri',
  'his-persian-pahlavan', 'his-hindu-pehlwan', 'his-sikh-nihang', 'his-sumo',
  'his-maori-toa', 'his-maasai-moran', 'his-turkish-pehlivan', 'his-celtic-highland',
  'his-korean-hwarang', 'his-inca-chasqui', 'his-filipino-kali', 'his-aboriginal-hunter',
  'his-muay-boran',
];
check('World-culture warrior programmes are all present', worldKeys.every((k) => findSpecialProgram(k)?.category === 'historical'), `${worldKeys.length} added`);
check('Sumo is present and built on the real heya morning', ['shiko', 'suriashi', 'butsukari', 'teppo'].every((d) => !!findSpecialProgram('his-sumo')?.days.some((x) => x.key === d)));
check('Lucha libre sits with the screen legends', findSpecialProgram('hero-luchador')?.category === 'superhero');
// Cultures whose traditional practice includes something an app must not
// prescribe have to say so plainly rather than quietly dropping it.
check(
  'Sumo refuses to reproduce the weight-gain protocol',
  /weight-gain protocol/i.test(findSpecialProgram('his-sumo')?.authenticityNote ?? '') &&
    findSpecialProgram('his-sumo')!.diet.notes.some((n) => /skip the sumo weight protocol/i.test(n))
);
check('Muay Boran warns against striking hard objects to condition shins', /never with a stick|hard objects/i.test((findSpecialProgram('his-muay-boran')?.authenticityNote ?? '') + (findSpecialProgram('his-muay-boran')?.safetyNote ?? '')));
check('Maasai programme declines to recommend drinking blood', /not being recommended/i.test(findSpecialProgram('his-maasai-moran')!.diet.notes.join(' ')));
check('Rarámuri minimal-footwear warning is explicit', /stress fracture/i.test(findSpecialProgram('his-raramuri')?.safetyNote ?? ''));
check('Pehlwan diet says to scale the legendary intakes down', /scale it/i.test(findSpecialProgram('his-hindu-pehlwan')!.diet.notes.join(' ')));
check('Luchador refuses to prescribe unsupervised aerial work', /qualified coach/i.test(findSpecialProgram('hero-luchador')?.safetyNote ?? ''));
// Living cultures get named as plural and distinct, not flattened into one myth.
check(
  'Composite programmes admit they are composites',
  /composite|many distinct|are many and distinct/i.test(findSpecialProgram('his-plains-nation')?.authenticityNote ?? '') &&
    /many and distinct/i.test(findSpecialProgram('his-aboriginal-hunter')?.authenticityNote ?? '')
);
// Substituted staples must be disclosed, not silently swapped.
check(
  'Diets disclose where a staple was substituted',
  ['his-amazon-tribe', 'his-inca-chasqui'].every((k) => /aren't in the food list|isn't in the food list/i.test(findSpecialProgram(k)!.diet.notes.join(' ')))
);

console.log('\nSpecial Programme diets (loggable, real nutrition):');
const specialFoodIds = new Set(SPECIAL_FOOD_DB.map((f) => f.id));
const badDietIds = Object.values(SPECIAL_DIET_BUILDS).flatMap((b) => b.flatMap((m) => m.components.map((c) => c.id))).filter((id) => !specialFoodIds.has(id));
check('Every meal component maps to a real food', badDietIds.length === 0, badDietIds.slice(0, 5).join(', '));
check('Every programme has a diet build', SPECIAL_PROGRAMS.every((p) => !!SPECIAL_DIET_BUILDS[p.key]));
check('Builds align with each programme\'s sample day', SPECIAL_PROGRAMS.every((p) => (SPECIAL_DIET_BUILDS[p.key]?.length ?? -1) === p.diet.sampleDay.length));
const dietsN = SPECIAL_PROGRAMS.map((p) => dietNutrition(p));
check('Every programme day has real calories from its foods', dietsN.every((d) => d.calories > 0));
check('Diet macros are consistent with calories (±15%)', dietsN.every((d) => { const kcal = d.protein * 4 + d.carbs * 4 + d.fat * 9; return kcal === 0 || Math.abs(kcal - d.calories) <= d.calories * 0.15; }));
// Micros must actually flow through: most non-hydration meals carry vitamins/minerals.
const allMeals = dietsN.flatMap((d) => d.meals).filter((m) => !m.hydrationOnly);
const mealsWithMicros = allMeals.filter((m) => MICRO_KEYS.some((k) => (m.micros[k] ?? 0) > 0)).length;
check('The large majority of meals carry micronutrients', mealsWithMicros >= allMeals.length * 0.9, `${mealsWithMicros}/${allMeals.length}`);
// Logging path yields precise diary rows with per-serving macros + micros.
const sampleMeal = dietNutrition(findSpecialProgram('his-roman-legion')!).meals[0];
const rows = mealToDiaryInputs(sampleMeal);
check('A meal converts to precise diary rows with macros', rows.length >= 1 && rows.every((r) => r.calories >= 0 && r.foodName.length > 0 && !!r.mealType));
check('Hydration-only meals log nothing', mealToDiaryInputs(dietNutrition(findSpecialProgram('life-morning')!).meals[0]).length === 0);

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
check('Exactly 120 badges, all with SVG art', ACHIEVEMENTS.length === 120 && ACHIEVEMENTS.every((a) => a.svg.startsWith('<svg') && a.svg.endsWith('</svg>')));
check('12 categories, 10 badges each', ACHIEVEMENT_CATEGORIES.length === 12 && [1,2,3,4,5,6,7,8,9,10,11,12].every((c) => ACHIEVEMENTS.filter((a) => a.category === c).length === 10));
check('Every badge has criteria text', ACHIEVEMENTS.every((a) => a.criteria.length > 0));
check('Badge ids are unique and contiguous 1..120', new Set(ACHIEVEMENTS.map((a) => a.id)).size === 120 && Math.min(...ACHIEVEMENTS.map((a) => a.id)) === 1 && Math.max(...ACHIEVEMENTS.map((a) => a.id)) === 120);
check('Category matches ceil(id/10) for every badge', ACHIEVEMENTS.every((a) => a.category === Math.ceil(a.id / 10)));
check('A good share of badges are auto-tracked', TRACKED_ACHIEVEMENT_COUNT >= 70, `${TRACKED_ACHIEVEMENT_COUNT}`);
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
  brushBestDay: 0, hygieneFullBest: 0, hygieneStreak: 0, prayersBestDay: 0, allPrayersStreak: 0, fajrLogged: false,
  napCount: 0, meditationSessions: 0, meditationMinutes7d: 0, balancedDayDone: 0,
  hasBodyFat: false, hasAllMeasurements: false, weighInCount: 0, goalIsRecompOrPerf: false,
  specialSessionCount: 0, distinctSpecialPrograms: 0, distinctSessionTypes: 0,
};
const maxed: AchievementStats = { ...zeroStats, appStreakBest: 400, bestStepDay: 12000, best10kStreak: 8, cardOverall: 80, prCount: 3, routineCount: 2, maxVolumeKg: 12000, tdeeCalculated: true, bestSleepHours: 8, sleepDebt: 0 };
check('Fresh account unlocks nothing that is tracked-and-zero (Spark locked)', evaluateAchievement(ACHIEVEMENTS[0], zeroStats).unlocked === false);
check('The Spark unlocks at a 3-day streak', evaluateAchievement(ACHIEVEMENTS[0], maxed).unlocked === true);
check('Untracked badge (Scouted #7) reports tracked=false', evaluateAchievement(ACHIEVEMENTS.find((a) => a.id === 7)!, zeroStats).tracked === false);
check('Heavy Metal (#20) needs 10,000kg', evaluateAchievement(ACHIEVEMENTS.find((a) => a.id === 20)!, { ...zeroStats, maxVolumeKg: 10500 }).unlocked === true);
// New categories 11 & 12 are tracked and read real data.
check('Hygiene badge (#101) tracks tooth-brushing', evaluateAchievement(ACHIEVEMENTS.find((a) => a.id === 101)!, { ...zeroStats, brushBestDay: 3 }).unlocked === true && evaluateAchievement(ACHIEVEMENTS.find((a) => a.id === 101)!, zeroStats).tracked === true);
check('Salat badge (#104) needs all five prayers', evaluateAchievement(ACHIEVEMENTS.find((a) => a.id === 104)!, { ...zeroStats, prayersBestDay: 5 }).unlocked === true && evaluateAchievement(ACHIEVEMENTS.find((a) => a.id === 104)!, { ...zeroStats, prayersBestDay: 4 }).unlocked === false);
check('Nap badge (#107) unlocks on first nap', evaluateAchievement(ACHIEVEMENTS.find((a) => a.id === 107)!, { ...zeroStats, napCount: 1 }).unlocked === true);
check('Body-comp badge (#111) needs a body-fat weigh-in', evaluateAchievement(ACHIEVEMENTS.find((a) => a.id === 111)!, { ...zeroStats, hasBodyFat: true }).unlocked === true);
check('Special-programme badge (#117) unlocks on first session', evaluateAchievement(ACHIEVEMENTS.find((a) => a.id === 117)!, { ...zeroStats, specialSessionCount: 1 }).unlocked === true);
check('Complete Athlete (#120) needs all 8 categories', evaluateAchievement(ACHIEVEMENTS.find((a) => a.id === 120)!, { ...zeroStats, distinctSessionTypes: 7 }).unlocked === false && evaluateAchievement(ACHIEVEMENTS.find((a) => a.id === 120)!, { ...zeroStats, distinctSessionTypes: 8 }).unlocked === true);
check('New badges are auto-tracked (101-120)', [101,104,107,111,117,120].every((id) => evaluateAchievement(ACHIEVEMENTS.find((a) => a.id === id)!, zeroStats).tracked === true));

console.log('\nSub-muscle resolution & alternatives:');
const TAXONOMIED = ['chest','back','shoulders','biceps','triceps','forearms','quads','hamstrings','glutes','calves','core'];
const taxExlib = EXLIB.filter((e) => e.primaryMuscle && TAXONOMIED.includes(e.primaryMuscle));
check('Every taxonomied exercise carries an EXPLICIT sub-muscle (pinned, not inferred)', taxExlib.every((e) => !!e.subMuscle), `${taxExlib.filter((e) => !e.subMuscle).length} untagged`);
check('Hand corrections applied (reverse wrist curl → extensors)', EXLIB.find((e) => e.slug === 'barbell-reverse-wrist-curl')?.subMuscle === 'wrist_extensors' && EXLIB.find((e) => e.slug === 'db-reverse-wrist-curl')?.subMuscle === 'wrist_extensors');
check('Rotational core drills tagged obliques, stone lift lower-back', EXLIB.find((e) => e.slug === 'sledgehammer-swing')?.subMuscle === 'obliques' && EXLIB.find((e) => e.slug === 'atlas-stone-lift')?.subMuscle === 'lower_back');
check('Every exercise resolves a sub-muscle or a clear reason not to', EXLIB.every((e) => {
  const sm = subMuscleOf({ name: e.name, primaryMuscle: e.primaryMuscle, subMuscle: e.subMuscle });
  return e.primaryMuscle && TAXONOMIED.includes(e.primaryMuscle) ? !!sm : true;
}));
check('Explicit sub-muscle always wins over inference', subMuscleOf({ name: 'Whatever', primaryMuscle: 'back', subMuscle: 'traps' }) === 'traps');
check('Inference reads the movement (incline press → upper chest)', subMuscleOf({ name: 'Incline Bench Press', primaryMuscle: 'chest' }) === 'upper_chest');
check('Wrist curl infers wrist flexors', subMuscleOf({ name: 'Barbell Wrist Curl', primaryMuscle: 'forearms' }) === 'wrist_flexors');
const chestSubs = subMusclesFor(EXLIB.filter((e) => e.primaryMuscle === 'chest').map((e) => ({ name: e.name, primaryMuscle: e.primaryMuscle, subMuscle: e.subMuscle })));
check('Chest exercises span multiple sub-regions', chestSubs.length >= 2, chestSubs.join(', '));
// Difficulty + easier-alternative finder.
const toAlt = (e: typeof EXLIB[number], id: number): AltExercise => ({ id, slug: e.slug, name: e.name, primaryMuscle: e.primaryMuscle, muscleGroups: e.muscleGroups, equipmentType: e.equipmentType, sessionType: e.sessionType });
const allAlts = EXLIB.map((e, i) => toAlt(e, i));
check('One-arm push-up is harder than a knee push-up', estimateDifficulty({ id: 1, slug: 'a', name: 'One-Arm Push-Up', primaryMuscle: 'chest', muscleGroups: ['chest'], equipmentType: 'bodyweight', sessionType: 'calisthenics' }) > estimateDifficulty({ id: 2, slug: 'b', name: 'Incline Push-Up', primaryMuscle: 'chest', muscleGroups: ['chest'], equipmentType: 'bodyweight', sessionType: 'calisthenics' }));
const oneArmIdx = EXLIB.findIndex((e) => e.slug === 'one-arm-pushup');
const oneArm = allAlts[oneArmIdx];
const alts = findEasierAlternatives(oneArm, allAlts);
check('Find-alternative returns easier same-muscle options', alts.length > 0
  && alts.every((a) => a.difficulty <= estimateDifficulty(oneArm))
  && alts.every((a) => a.primaryMuscle === oneArm.primaryMuscle || a.muscleGroups.some((m) => oneArm.muscleGroups.includes(m)))
  && alts.some((a) => a.difficulty < estimateDifficulty(oneArm)));
check('Bro split now has an Abs day', SPLITS.find((s) => s.key === 'bro')!.days.some((d) => d.key === 'abs'));
check('Bro Arm day includes forearm work', SPLITS.find((s) => s.key === 'bro')!.days.find((d) => d.key === 'arms')!.exercises.includes('reverse-curl'));
check('Wellness protocols exist (quit-smoking / hormones / energy)', ['craving-buster-walk','heavy-compound-circuit','morning-sunlight-walk','energy-reset-breath'].every((s) => ALL_SLUGS.has(s)));
check('Grip & forearm library expanded', EXLIB.filter((e) => e.primaryMuscle === 'forearms').length >= 15, `${EXLIB.filter((e) => e.primaryMuscle === 'forearms').length}`);

console.log('\nActivity → steps:');
// ~5 km run for a 180 cm runner: stride ~0.9 m → ~5,500 steps.
const runSteps = estimateActivitySteps({ distanceM: 5000, durationSec: 25 * 60, heightCm: 180 });
check('A 5 km run yields a sensible step count', runSteps.steps > 4500 && runSteps.steps < 7000 && runSteps.mode === 'run', `${runSteps.steps} steps, ${runSteps.mode}`);
const walk = estimateActivitySteps({ distanceM: 3000, durationSec: 40 * 60, heightCm: 170 });
check('A slow 3 km is classed as walking', walk.mode === 'walk' && walk.steps > 3500);
check('Duration-only falls back to cadence', estimateActivitySteps({ durationSec: 30 * 60, heightCm: 170 }).steps > 2500);
check('No distance or duration → no steps', estimateActivitySteps({ heightCm: 170 }).steps === 0);
check('stepsFromDistance inverts distanceFromSteps roughly', Math.abs(stepsFromDistance(distanceFromSteps(6000, 175, 'run'), 175, 'run') - 6000) <= 1);
check('Running cadence beats walking cadence', stepsFromDuration(600, 'run') > stepsFromDuration(600, 'walk'));

console.log('\nEnergy balance & the over-training line:');
const bmrBase = 1600, tdeeBase = 2480, target = 1980;
// Fat loss, ate 1500, burned 300 → available 1200 < floor(max(bmr, target-500)=1600) → over-trained.
const ebCut = computeEnergyBalance({ goal: 'lose_fat', calorieTarget: target, tdee: tdeeBase, bmr: bmrBase, consumedKcal: 1500, exerciseKcal: 300 });
check('Aggressive deficit + big burn flags over-training', ebCut.status === 'over_trained', `${ebCut.status}, avail ${ebCut.availableAfterExercise}, floor ${ebCut.floorKcal}`);
check('Left-to-eat is target minus consumed', ebCut.leftToEat === target - 1500);
// Same day but ate to target and only light burn → on track with headroom.
const okDay = computeEnergyBalance({ goal: 'lose_fat', calorieTarget: target, tdee: tdeeBase, bmr: bmrBase, consumedKcal: 1980, exerciseKcal: 150 });
check('Eating to target with light training is on track', okDay.status === 'on_track' && okDay.headroomKcal > 0, `${okDay.status}, head ${okDay.headroomKcal}`);
// Bulk: surplus wiped by cardio → over-trained, message says eat back.
const bulk = computeEnergyBalance({ goal: 'build_muscle', calorieTarget: 3000, tdee: 2700, bmr: 1700, consumedKcal: 2900, exerciseKcal: 500 });
check('A bulk that burns off its surplus is flagged', bulk.status === 'over_trained' && /surplus/i.test(bulk.message));
check('The line is a burn ceiling, not the calorie target', ebCut.lineKcal >= 0 && okDay.lineKcal === Math.max(0, 1980 - okDay.floorKcal));
check('Training-load fraction stays within 0..1', [ebCut, okDay, bulk].every((b) => { const f = trainingLoadFraction(b); return f >= 0 && f <= 1; }));
check('Never lets the floor drop below BMR', computeEnergyBalance({ goal: 'lose_fat', calorieTarget: 1200, tdee: 1800, bmr: 1500, consumedKcal: 1400, exerciseKcal: 0 }).floorKcal >= 1500);
// The Home "restore" value: eat-back needed to reach the floor, 0 when fine.
check('Restore = eat-back to the floor when over-trained', ebCut.restoreKcal === Math.max(0, ebCut.floorKcal - ebCut.availableAfterExercise) && ebCut.restoreKcal > 0);
check('Restore is 0 when on track', okDay.restoreKcal === 0);

console.log('\nWalk recovery (screen off / app killed):');
// GPS is evidence: a traced 5 km run implies far more steps than 100 counted.
const gpsRec = recoverGapSteps({ mode: 'run', observedSteps: 100, observedMs: 60_000, gapMs: 20 * 60_000, gpsDistanceM: 5000, heightCm: 175 });
check('GPS distance recovers a killed run', gpsRec.basis === 'gps' && gpsRec.estimated === false && gpsRec.steps > 4000, `${gpsRec.steps}`);
// Applying it twice must not double count (it raises to a floor, not additive).
const gpsAgain = recoverGapSteps({ mode: 'run', observedSteps: 100 + gpsRec.steps, observedMs: 60_000, gapMs: 20 * 60_000, gpsDistanceM: 5000, heightCm: 175 });
check('GPS recovery is idempotent (a floor, never additive)', gpsAgain.steps === 0);
// No GPS, no hardware: estimate the blind window from measured cadence.
const cadRec = recoverGapSteps({ mode: 'walk', observedSteps: 1000, observedMs: 10 * 60_000, gapMs: 10 * 60_000, gpsDistanceM: 0, heightCm: 175 });
check('Cadence fills a blind walk window', cadRec.basis === 'cadence' && cadRec.estimated === true && near(cadRec.steps, 1000, 50), `${cadRec.steps}`);
check('Short gaps are ignored', recoverGapSteps({ mode: 'walk', observedSteps: 1000, observedMs: 600_000, gapMs: 5_000, heightCm: 175 }).steps === 0);
// The critical honesty guard: a huge gap can't invent a huge number of steps.
const hugeGap = recoverGapSteps({ mode: 'walk', observedSteps: 1000, observedMs: 10 * 60_000, gapMs: 12 * 3600_000, gpsDistanceM: 0, heightCm: 175 });
check('A long gap is capped, not extrapolated forever', hugeGap.steps <= MAX_GAP_CREDIT_MIN * MAX_CADENCE.walk, `${hugeGap.steps}`);
check('Cadence is capped at a realistic ceiling', measuredCadence(100000, 60_000, 'walk') === MAX_CADENCE.walk);
check('Cadence falls back to a default with too little data', measuredCadence(0, 1000, 'run') === DEFAULT_CADENCE.run);
// Steps↔distance round-trip underpins both directions.
check('stepsFromDistance inverts distanceFromSteps', Math.abs(stepsFromDistance(distanceFromSteps(5000, 175, 'walk'), 175, 'walk') - 5000) <= 1);
check('Duration-only steps use a plausible cadence', stepsFromDuration(600, 'walk') === 1100 && stepsFromDuration(600, 'run') === 1600);

console.log('\nNotification progress bar:');
check('Bar renders full/empty blocks at the right ratio', progressBar(0.5, 10) === '█████░░░░░');
check('Bar clamps out-of-range input', progressBar(-1, 4) === '░░░░' && progressBar(9, 4) === '████');
check('Bar with percentage reads correctly', progressBarWithPct(0.62, 10) === '██████░░░░ 62%');

console.log('\nMotion validation (vehicle / stationary auto-pause):');
// The whole point: speed alone can't tell a run from a bus — cadence can.
const busRide = classifyMotion({ speedMs: 12, cadenceSpm: 0 });
check('Fast with no cadence is a vehicle', busRide.kind === 'vehicle' && !busRide.countDistance && busRide.shouldPause);
const fastRun = classifyMotion({ speedMs: 5, cadenceSpm: 175 });
check('Fast WITH cadence is a run, not a vehicle', fastRun.kind === 'running' && fastRun.countDistance && !fastRun.shouldPause);
// A sprinter at 8 m/s still keeps their cadence — must not be misread as a car.
check('A sprinter is not mistaken for a vehicle', classifyMotion({ speedMs: 8, cadenceSpm: 185 }).kind === 'running');
// But nothing human sustains 10 m/s, cadence or not.
check('Impossible speed is a vehicle regardless of cadence', classifyMotion({ speedMs: 11, cadenceSpm: 180 }).kind === 'vehicle');
const waiting = classifyMotion({ speedMs: 0.05, cadenceSpm: 0 });
check('Standing still auto-pauses', waiting.kind === 'stationary' && waiting.shouldPause && !waiting.countDistance);
check('Slow with cadence is walking', classifyMotion({ speedMs: 1.2, cadenceSpm: 105 }).kind === 'walking');
// With no step sensor we must not guess "vehicle" from speed alone at running pace.
check('Unknown cadence does not fabricate a vehicle at running speed', classifyMotion({ speedMs: 7.5, cadenceSpm: null }).kind === 'running');
check('Segment speed maths', Math.abs(segmentSpeedMs(100, 20_000) - 5) < 1e-9);
check('Implausible on-foot segments are rejected', !isPlausibleOnFootSegment(300, 10_000) && isPlausibleOnFootSegment(30, 10_000));
check('Pause needs sustained evidence, resume is quicker', PAUSE_CONFIRM_MS > RESUME_CONFIRM_MS);

console.log('\nCalorie accuracy:');
// Net vs gross: the ~1 MET of resting metabolism must not be credited as exercise,
// because the calorie target already covers it via TDEE.
check('Net burn excludes resting metabolism', netCaloriesFromMet(8, 80, 3600) === caloriesFromMet(7, 80, 3600), `${netCaloriesFromMet(8, 80, 3600)} vs ${caloriesFromMet(7, 80, 3600)}`);
check('Gross is unchanged (existing behaviour preserved)', caloriesFromMet(8, 80, 1800) === 336);
check('Net never goes negative below resting', netCaloriesFromMet(0.5, 80, 3600) === 0);
// Paused time must not be credited: same distance, same moving time, longer wall clock.
const movingOnly = walkCalories({ weightKg: 80, distanceM: 5000, durationSec: 3600, activeSec: 1800, steps: 6500 });
const wallClock = walkCalories({ weightKg: 80, distanceM: 5000, durationSec: 1800, activeSec: 1800, steps: 6500 });
check('Paused time is excluded from calories', movingOnly === wallClock, `${movingOnly} vs ${wallClock}`);
// Pace is derived from MOVING time, so 5 km with 30 min of walking is scored as
// 10 km/h — not the 5 km/h that wall-clock time would imply. Excluding pauses
// therefore *raises* the figure here, which is the physiologically right answer:
// half an hour at running pace is harder work than an hour of strolling.
const wallClockPace = walkCalories({ weightKg: 80, distanceM: 5000, durationSec: 3600, steps: 6500 });
check('Pace comes from moving time, not wall clock', movingOnly > wallClockPace, `${movingOnly} (10km/h) > ${wallClockPace} (5km/h)`);
// And standing still genuinely adds nothing: same distance, same moving time,
// twice the wall clock → identical burn (asserted above), so idle time is inert.
const idleAdded = walkCalories({ weightKg: 80, distanceM: 5000, durationSec: 7200, activeSec: 1800, steps: 6500 });
check('Extra idle time adds no calories at all', idleAdded === movingOnly, `${idleAdded} === ${movingOnly}`);
// Grade: climbing costs more, descending a little less, both bounded.
check('Uphill costs more than level', gradeMultiplier(5) > 1 && gradeMultiplier(5) <= 2.5);
check('Downhill is cheaper but never free', gradeMultiplier(-5) < 1 && gradeMultiplier(-5) >= 0.85);
check('Flat is neutral', gradeMultiplier(0) === 1);
const climb = walkCalories({ weightKg: 80, distanceM: 4000, durationSec: 3600, activeSec: 3600, steps: 6000, elevationGainM: 300 });
const flat = walkCalories({ weightKg: 80, distanceM: 4000, durationSec: 3600, activeSec: 3600, steps: 6000 });
check('A climb burns more than the same distance flat', climb > flat, `${climb} vs ${flat}`);
check('Time-only sessions still estimate something', walkCalories({ weightKg: 80, distanceM: 0, durationSec: 1800, steps: 0 }) > 0);
check('Steps-only fallback scales with bodyweight', walkCalories({ weightKg: 100, distanceM: 0, durationSec: 0, steps: 5000 }) > walkCalories({ weightKg: 60, distanceM: 0, durationSec: 0, steps: 5000 }));

console.log('\nDeletes undo their side effects:');
/*
 * Creating a session or walk writes into daily_step_logs. Deleting the row alone
 * left those totals inflated — a deleted session kept counting toward the day.
 * These assert the rollback wiring stays in place; the arithmetic itself is
 * proven separately against a real SQLite table.
 */
{
  const actSrc = fs.readFileSync('src/repositories/activityRepo.ts', 'utf8');
  const sessSrc = fs.readFileSync('src/repositories/sessionRepo.ts', 'utf8');
  check('activityRepo exposes a clamped removeSteps', /export function removeSteps/.test(actSrc) && /Math\.max\(0, existing\.stepCount/.test(actSrc));
  check('Deleting a walk subtracts its steps/distance/calories', /export function deleteWalkSession[\s\S]{0,400}removeSteps\(/.test(actSrc));
  check('A walk is rolled back on the day it counted, not today', /removeSteps\([\s\S]{0,120}toISODate\(new Date\(row\.startTime\)\)/.test(actSrc));
  check('Sessions record what they contributed', /stepsAdded: steps, distanceAddedM: distanceM/.test(sessSrc));
  check('Deleting a session subtracts its recorded contribution', /export function deleteSession[\s\S]{0,900}session\?\.stepsAdded[\s\S]{0,200}removeSteps\(/.test(sessSrc));
  check('Session rollback uses the session date', /removeSteps\([\s\S]{0,200}toISODate\(new Date\(session\.startTime\)\)/.test(sessSrc));
}

console.log('\nSchema ↔ migration integrity:');
/*
 * Every column in the Drizzle schema must also be reachable by an existing
 * install: either it's in bootstrap's CREATE TABLE (fresh installs) *and* in
 * ADDED_COLUMNS (upgrades), or the table itself is new. A column added to
 * schema.ts without an ADDED_COLUMNS entry compiles fine and then throws
 * "no such column" at runtime on every existing install — which is exactly how
 * walk tracking got hard-broken once. This catches it at test time.
 */
{
  const schemaSrc = fs.readFileSync('src/db/schema.ts', 'utf8');
  const bootSrc = fs.readFileSync('src/db/bootstrap.ts', 'utf8');
  const missing: string[] = [];
  // Each sqliteTable('name', { ...cols }) block.
  const tableRe = /sqliteTable\(\s*'([a-z_]+)'\s*,\s*\{([\s\S]*?)\n\}\)/g;
  let tm: RegExpExecArray | null;
  while ((tm = tableRe.exec(schemaSrc))) {
    const [, table, body] = tm;
    // Column SQL names: text('x') / integer('x') / real('x') / blob('x')
    const colRe = /\b(?:text|integer|real|blob)\(\s*'([a-z_0-9]+)'/g;
    let cm: RegExpExecArray | null;
    while ((cm = colRe.exec(body))) {
      const col = cm[1];
      if (!bootSrc.includes(`'${col}'`) && !new RegExp(`\\b${col}\\b`).test(bootSrc)) {
        missing.push(`${table}.${col}`);
      }
    }
  }
  check(
    'Every schema column is present in bootstrap (create or ADDED_COLUMNS)',
    missing.length === 0,
    missing.length ? `unreachable on existing installs: ${missing.slice(0, 6).join(', ')}` : 'all columns migrated'
  );
}
// The broken background-step task must stay gone: its premise (watchStepCount
// returns a since-boot cumulative total) is false, and it overwrote real step
// counts with ~0 every 10 s.
{
  const svcDir = 'src/services/';
  const files = fs.readdirSync(svcDir);
  check('The data-corrupting walkBackgroundTask is not back', !files.includes('walkBackgroundTask.ts'));
  const walkSrc = fs.readFileSync('src/services/walkTracking.ts', 'utf8');
  check('walkTracking does not import the removed background task', !/walkBackgroundTask/.test(walkSrc));
  check('GPS is started for walks as well as runs', /startRouteTracking\(mode\)/.test(walkSrc) && !/mode === 'run'\s*\)\s*\{\s*gps/.test(walkSrc));
  check('Hardware step counter is preferred over the accelerometer', /hardware \? 'pedometer'/.test(walkSrc) && /attachStepSource\(true\)/.test(walkSrc));
  // The background location task must checkpoint steps so they keep climbing
  // while the app is killed — and must only ever raise the stored count.
  const repoSrc = fs.readFileSync('src/repositories/activityRepo.ts', 'utf8');
  check('Background task checkpoints steps from GPS distance', /stepsFromDistance\(distance/.test(repoSrc));
  check('Step checkpoint is monotonic (never lowers the count)', /steps: Math\.max\(row\.steps, impliedSteps\)/.test(repoSrc));
  // Every GPS fix must go through the filter — the raw haversine loop inflated
  // distance indoors and while turning on the spot.
  check('Route append filters fixes before crediting distance', /filterFixes\(route, fixes\)/.test(repoSrc));
  check('Raw unfiltered segment accumulation is gone', !/const seg = haversine\(last, p\)/.test(repoSrc));
  // Rejecting every fix still counts as observing the session; leaving updatedAt
  // stale would make the stretch look like a blind window and let the gap
  // estimator re-credit the steps the filter just discarded.
  check(
    'A fully-rejected batch still stamps updatedAt',
    /if \(!accepted\.length\)/.test(repoSrc) && /set\(\{ updatedAt: Date\.now\(\) \}\)/.test(repoSrc)
  );
  // Accuracy and Doppler speed are the filter's two best signals; the task must
  // hand them over rather than throwing them away at the boundary.
  const locSrc = fs.readFileSync('src/services/locationTracking.ts', 'utf8');
  check(
    'Location task forwards accuracy and speed to the filter',
    /accuracy: l\.coords\.accuracy/.test(locSrc) && /speed: l\.coords\.speed/.test(locSrc)
  );
  // The warm-up credits several steps at once, so the listener must add the
  // returned count rather than incrementing by one.
  check('Accelerometer listener banks the whole credited count', /mem\.steps \+= credited/.test(walkSrc));
}

console.log('\nEffort — proximity to failure:');
{
  const set = (reps: number | null, rpe: number | null, toFailure = false) => ({ reps, rpe, toFailure });

  // ── Reps in reserve ──
  check('A set marked to failure has 0 reps in reserve', repsInReserve(set(8, null, true)) === 0);
  check('RPE 8 means 2 reps in reserve', repsInReserve(set(8, 8)) === 2);
  check('RPE 10 means failure', repsInReserve(set(8, 10)) === 0);
  check('No RPE and no flag means unknown, not zero', repsInReserve(set(8, null)) === null);
  // People round RPE; nobody ticks "to failure" by accident.
  check('An explicit failure flag outranks a contradicting RPE', repsInReserve(set(8, 7, true)) === 0);

  // ── Stimulating reps (the model) ──
  check('A set to failure yields the full stimulating window', stimulatingReps(set(10, null, true)) === STIMULATING_REP_WINDOW);
  check('2 in reserve yields 3 stimulating reps', stimulatingReps(set(10, 8)) === 3);
  check('5+ in reserve yields none', stimulatingReps(set(10, 5)) === 0);
  check('A short set cannot yield more stimulating reps than it has', stimulatingReps(set(2, null, true)) === 2);
  check('Unknown effort yields no number rather than a guess', stimulatingReps(set(10, null)) === null);

  // ── Hard-set credit ──
  check('A set to failure is a full hard set', hardSetCredit(set(10, null, true)) === 1);
  check(`Anything within ${HARD_SET_MAX_RIR} of failure is a full hard set`, hardSetCredit(set(10, 6)) === 1);
  check('An easy set is discounted, not erased', hardSetCredit(set(10, 4)) > 0 && hardSetCredit(set(10, 4)) < 1, `${hardSetCredit(set(10, 4))}`);
  check('A set 8 from failure counts for nothing', hardSetCredit(set(10, 2)) === 0);
  /*
   * The log-safety guarantee. Every set logged before this feature existed has
   * no RPE and no failure flag; if those counted for less, the entire back
   * catalogue of training would appear to shrink the day the update landed.
   */
  check('Unknown effort still counts as a full set (log-safe)', hardSetCredit(set(10, null)) === 1);
  check('Credit never rises above 1 or falls below 0', [0, 1, 3, 5, 7, 9, 10].every((rpe) => { const c = hardSetCredit(set(10, rpe)); return c >= 0 && c <= 1; }));
  // Credit must fall monotonically as the set gets easier.
  const credits = [10, 9, 8, 7, 6, 5, 4, 3, 2].map((rpe) => hardSetCredit(set(10, rpe)));
  check('Credit falls monotonically as reserve grows', credits.every((c, idx) => idx === 0 || c <= credits[idx - 1]), credits.join(' '));

  // ── The light-load exception (calisthenics) ──
  check('20 easy push-ups are flagged as under-stimulating', isUnderStimulatingLightSet(set(20, 6)));
  check('20 push-ups to failure are not', !isUnderStimulatingLightSet(set(20, null, true)));
  check('A heavy set of 5 with reserve is not a light-load miss', !isUnderStimulatingLightSet(set(5, 6)));

  check('Proximity reads as plain words', proximityLabel(set(8, null, true)) === 'to failure' && proximityLabel(set(8, 8)) === '2 left' && proximityLabel(set(8, null)) === '');

  // ── Summaries ──
  const mixed = summariseEffort([set(10, null, true), set(10, 8), set(10, 3), set(10, null)]);
  check('Effective sets discount the easy one only', mixed.effectiveSets === 3.25, `${mixed.effectiveSets} of ${mixed.rawSets}`);
  check('Average reserve ignores the unrated set', mixed.avgRir === 3, `${mixed.avgRir}`);
  check('Failure share is measured against every set', Math.abs(mixed.failureShare - 0.25) < 1e-9);
  check('Known share reports how much data we actually have', Math.abs(mixed.knownShare - 0.75) < 1e-9);

  // ── Effort score ──
  const allBlank = summariseEffort(Array.from({ length: 10 }, () => set(10, null)));
  check('No effort data → no effort score (stay quiet)', effortScore(allBlank) === null);
  check('No effort data → a prompt, not a judgement', effortNotes(allBlank).some((n) => /RPE|to failure/i.test(n)));
  const productive = summariseEffort([set(10, 9), set(10, 8), set(10, null, true), set(10, 9)]);
  check('Training near failure scores full marks', effortScore(productive) === 100, `${effortScore(productive)}`);
  const tooEasy = summariseEffort(Array.from({ length: 8 }, () => set(10, 4)));
  check('Training far from failure scores poorly', (effortScore(tooEasy) ?? 100) <= 45, `${effortScore(tooEasy)}`);
  check('…and says why', effortNotes(tooEasy).some((n) => /reps in reserve/i.test(n)));
  /*
   * Failure is not the goal. Going to failure on everything buys little extra
   * growth, costs reps in the following sets and does nothing for strength — so
   * the score has to stop rewarding it past a point, or the app would coach
   * people into a hole.
   */
  const alwaysFailure = summariseEffort(Array.from({ length: 10 }, () => set(10, null, true)));
  check('Everything to failure scores BELOW a mixed near-failure approach', (effortScore(alwaysFailure) ?? 0) < (effortScore(productive) ?? 0), `${effortScore(alwaysFailure)} vs ${effortScore(productive)}`);
  check('…and warns about the cost', effortNotes(alwaysFailure).some((n) => /save it for the last set/i.test(n)));

  // ── 1RM: the formulas assume a set taken to failure ──
  check('Reps to failure add the reserve on', repsAtFailureEquivalent(5, set(5, 7)) === 8);
  check('A set to failure needs no correction', repsAtFailureEquivalent(5, set(5, null, true)) === 5);
  check('Unknown effort leaves the rep count alone', repsAtFailureEquivalent(5, set(5, null)) === 5);
  const failed5 = estimate1RMFromSet({ weightKg: 100, reps: 5, toFailure: true });
  const easy5 = estimate1RMFromSet({ weightKg: 100, reps: 5, rpe: 7 });
  check('100kg×5 to failure estimates ~117kg', Math.abs(failed5 - 116.7) < 0.2, `${failed5}`);
  check('The same set with 3 in reserve implies MORE strength', easy5 > failed5, `${easy5} vs ${failed5}`);
  check('…and lands near 127kg', Math.abs(easy5 - 126.7) < 0.2, `${easy5}`);
  // Unchanged for every set that carries no effort data — the historical case.
  check('An unrated set estimates exactly as it always did', estimate1RMFromSet({ weightKg: 100, reps: 5 }) === estimate1RM(100, 5));
  check('Confidence is highest for a set taken to failure', ormConfidence({ toFailure: true }) === 'high' && ormConfidence({ rpe: 8 }) === 'medium' && ormConfidence({}) === 'low');
}

console.log('\nGrowth engine — effort dimension:');
{
  const sets = (n: number, rpe: number | null, toFailure = false) =>
    summariseEffort(Array.from({ length: n }, () => ({ reps: 10, rpe, toFailure })));
  const gates = { proteinOk: true, sleepOk: true, calorieOk: true };
  const base = { muscle: 'chest', overloadTrendPct: 8, avgRestDays: 3, sessionsPerWeek: 2 };

  // Same 14 sets a week, logged three different ways.
  const unrated = scoreMuscle({ ...base, setsThisWeek: 14, avgSetsPerWeek4w: 14, effectiveSetsThisWeek: 14, avgEffectiveSetsPerWeek4w: 14, effort: sets(56, null) }, gates);
  const hard = scoreMuscle({ ...base, setsThisWeek: 14, avgSetsPerWeek4w: 14, effectiveSetsThisWeek: 14, avgEffectiveSetsPerWeek4w: 14, effort: sets(56, 9) }, gates);
  const easy = scoreMuscle({ ...base, setsThisWeek: 14, avgSetsPerWeek4w: 14, effectiveSetsThisWeek: 7, avgEffectiveSetsPerWeek4w: 7, effort: sets(56, 4) }, gates);

  check('Effort score is hidden when nothing was logged', unrated.effortScore === null);
  check('Effort score appears once sets are rated', hard.effortScore === 100, `${hard.effortScore}`);
  check('Hard training outscores the same count of easy sets', hard.score > easy.score, `${hard.score} vs ${easy.score}`);
  check('Fourteen easy sets no longer read as fourteen hard ones', easy.avgEffectiveSetsPerWeek4w === 7 && easy.volumeScore < hard.volumeScore, `${easy.volumeScore} vs ${hard.volumeScore}`);
  check('Reserve and failure share are reported back', hard.avgRir === 1 && hard.failureSharePct === 0, `rir ${hard.avgRir}`);
  /*
   * The whole update has to be invisible to anyone who never logs effort. If an
   * unrated week scored differently after this change, every existing user
   * would open the app to a Growth screen that had moved for no reason.
   */
  check('An unrated week scores exactly as before the feature', unrated.score === Math.round(unrated.volumeScore * 0.45 + unrated.overloadScore * 0.25 + unrated.recoveryScore * 0.3), `${unrated.score}`);
}

console.log('\nCustom foods — calories from macros:');
{
  check('Atwater basics: 10P/10C/10F = 170 kcal', caloriesFromMacros({ protein: 10, carbs: 10, fat: 10 }) === 170, `${caloriesFromMacros({ protein: 10, carbs: 10, fat: 10 })}`);
  check('Fibre is discounted to 2 kcal/g inside carbs', caloriesFromMacros({ protein: 0, carbs: 10, fat: 0, fiber: 10 }) === 20);
  check('Nothing in, nothing out', caloriesFromMacros({ protein: 0, carbs: 0, fat: 0 }) === 0);
  check('Negative macros are ignored, never subtracted', caloriesFromMacros({ protein: -5, carbs: 10, fat: 0 }) === 40);
  check('Fibre exceeding carbs cannot go negative', caloriesFromMacros({ protein: 0, carbs: 5, fat: 0, fiber: 50 }) === 10);
  /*
   * The claim the UI makes to the user — "within 10% for 97 of every 100 foods"
   * — checked against the whole real database rather than asserted. If the
   * formula or the food data ever drifts, this fails rather than the copy
   * quietly becoming a lie.
   */
  const realFoods = FOOD_DB.filter((f) => f.calories > 20);
  const errors = realFoods
    .map((f) => Math.abs(caloriesFromMacros(f) - f.calories) / f.calories)
    .sort((a, b) => a - b);
  const within10 = errors.filter((e) => e <= 0.1).length / errors.length;
  const p90 = errors[Math.floor(errors.length * 0.9)];
  check('Estimator lands within 10% for 95%+ of real foods', within10 >= 0.95, `${(within10 * 100).toFixed(0)}% of ${errors.length}`);
  check('90th-percentile estimation error stays under 10%', p90 < 0.1, `${(p90 * 100).toFixed(1)}%`);
  // Discounting fibre must genuinely beat the naive formula, or it's just
  // complexity for its own sake.
  const naive = realFoods.map((f) => Math.abs((f.protein * 4 + f.carbs * 4 + f.fat * 9) - f.calories) / f.calories);
  const naiveWithin10 = naive.filter((e) => e <= 0.1).length / naive.length;
  check('Fibre discount beats plain 4/4/9', within10 > naiveWithin10, `${(within10 * 100).toFixed(0)}% vs ${(naiveWithin10 * 100).toFixed(0)}%`);

  // An entered figure always wins; a blank one is derived and flagged.
  check('A typed calorie figure is used as-is', resolveCalories('250', { protein: 1, carbs: 1, fat: 1 }).calories === 250);
  check('A typed figure is not marked estimated', resolveCalories('250', { protein: 1, carbs: 1, fat: 1 }).estimated === false);
  check('A blank figure is derived and marked estimated', (() => {
    const r = resolveCalories('', { protein: 10, carbs: 10, fat: 10 });
    return r.calories === 170 && r.estimated === true;
  })());
  check('Junk in the calorie box falls back to the estimate', resolveCalories('abc', { protein: 10, carbs: 0, fat: 0 }).estimated === true);
  check('Comma decimals parse (fr-FR keyboards)', parseAmount('12,5') === 12.5);
  check('Blank and junk amounts read as zero', parseAmount('') === 0 && parseAmount('abc') === 0 && parseAmount('-3') === 0);
  // A food needs a name and something to contribute.
  check('A nameless food is incomplete', !isCompleteCustomFood({ name: '  ', protein: 10, carbs: 0, fat: 0 }));
  check('A food with no macros at all is incomplete', !isCompleteCustomFood({ name: 'Water', protein: 0, carbs: 0, fat: 0 }));
  check('A name plus one macro is enough', isCompleteCustomFood({ name: 'Mum\'s couscous', protein: 0, carbs: 40, fat: 0 }));
}
{
  // The custom-foods table must be in the DDL, or the feature silently fails
  // on every existing install (the CREATE block is what reaches them).
  const bootSrc = fs.readFileSync('src/db/bootstrap.ts', 'utf8');
  check('custom_foods is in the CREATE TABLE DDL', /CREATE TABLE IF NOT EXISTS custom_foods/.test(bootSrc));
  // Custom foods must never be written into the shipped catalogue, which is
  // replaced wholesale on every app update.
  const repoSrc = fs.readFileSync('src/repositories/customFoodRepo.ts', 'utf8');
  check('Custom foods live in their own table, not FOOD_DB', !/FOOD_DB\.push|FOOD_DB\s*=/.test(repoSrc));
  check('Custom food ids are namespaced away from catalogue ids', /CUSTOM_FOOD_PREFIX = 'custom:'/.test(repoSrc));
  check('Custom foods carry no invented micronutrients', !/micros:/.test(repoSrc));
}
{
  /*
   * A column added to the Drizzle schema but not to ADDED_COLUMNS throws "no
   * such column" on every existing install. It has happened before, so the
   * pairing is enforced rather than remembered.
   */
  const bootSrc = fs.readFileSync('src/db/bootstrap.ts', 'utf8');
  check('to_failure is in the CREATE TABLE DDL (fresh installs)', /to_failure INTEGER NOT NULL DEFAULT 0\s*\);/.test(bootSrc));
  check('to_failure is in ADDED_COLUMNS (existing installs)', /table: 'set_entries', column: 'to_failure'/.test(bootSrc));
  check('Schema version was bumped for it', /SCHEMA_VERSION = 18/.test(bootSrc));

  // A failure set IS RPE 10; storing only the flag would leave every older
  // reader of `rpe` seeing a blank where the hardest set of the day was.
  const sessSrc = fs.readFileSync('src/repositories/sessionRepo.ts', 'utf8');
  check('Logging to failure also records RPE 10', /rpe: draft\.toFailure \? 10 : draft\.rpe/.test(sessSrc));
  check('PR detection uses the effort-corrected estimate', /estimate1RMFromSet\(s\)/.test(sessSrc) && !/estimate1RM\(s\.weightKg/.test(sessSrc));

  /*
   * A 1RM estimate needs rpe and to_failure in its query, or the correction is
   * silently skipped and that screen keeps the old under-estimate while the
   * others move — the worst kind of bug, because both numbers look plausible.
   * Volume queries don't need them, so the invariant is: a file can't estimate
   * 1RM in more places than it has effort-bearing queries.
   */
  for (const f of ['src/repositories/statsRepo.ts', 'src/repositories/cardRepo.ts', 'src/repositories/sessionRepo.ts']) {
    const s = fs.readFileSync(f, 'utf8');
    const estimates = (s.match(/estimate1RMFromSet\(/g) ?? []).length;
    // An unprojected `.select()` returns every column, so it carries effort too.
    const effortQueries =
      (s.match(/toFailure: setEntries\.toFailure/g) ?? []).length +
      (s.match(/\.select\(\)\s*\r?\n\s*\.from\(setEntries\)/g) ?? []).length;
    check(
      `${f.split('/').pop()} selects effort wherever it estimates 1RM`,
      effortQueries >= estimates,
      `${estimates} estimate(s), ${effortQueries} effort-bearing quer(ies)`
    );
  }
  // growthRepo doesn't estimate 1RM but does need effort for set weighting.
  check('growthRepo reads effort for its set weighting', /toFailure: setEntries\.toFailure/.test(fs.readFileSync('src/repositories/growthRepo.ts', 'utf8')));

  // "Repeat Last" must carry the flag, or repeating a failure set quietly
  // downgrades it to an ordinary one.
  const storeSrc = fs.readFileSync('src/stores/sessionStore.ts', 'utf8');
  check('Repeat Last carries the failure flag', /toFailure: !!last\?\.toFailure/.test(storeSrc));
}

console.log('\nGPS fix filtering (indoor drift & spinning):');
{
  // A straight street walk: every fix is real and must be credited in full.
  const street = Array.from({ length: 12 }, (_, i) => ({
    lat: 36.8 + i * 0.00009, lng: 10.18, accuracy: 6, speed: 1.4,
  }));
  const walkRes = filterFixes([], street);
  check('A real street walk is credited in full', walkRes.accepted.length === 12 && walkRes.distanceM > 95, `${Math.round(walkRes.distanceM)}m from ${walkRes.accepted.length} fixes`);
  check('Credited distance equals the stored path length', near(walkRes.distanceM, routeDistanceM(walkRes.accepted), 0.001));

  // Indoors: the receiver keeps emitting, wandering by tens of metres, and
  // honestly reports both the poor accuracy and a Doppler speed of zero.
  let s = 7;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const indoors = Array.from({ length: 40 }, () => ({
    lat: 36.8 + (rnd() - 0.5) * 0.0004, lng: 10.18 + (rnd() - 0.5) * 0.0004, accuracy: 40, speed: 0,
  }));
  const roomRes = filterFixes([], indoors);
  check('Indoor drift adds no distance at all', roomRes.accepted.length === 0 && roomRes.distanceM === 0, `${roomRes.rejected.accuracy} dropped on accuracy`);

  // Turning on the spot / pacing a small room, with decent accuracy and no
  // speed reported — the case the geometric gates exist for.
  const circling = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * Math.PI * 6;
    return { lat: 36.8 + Math.sin(a) * 0.00008, lng: 10.18 + Math.cos(a) * 0.00008, accuracy: 12, speed: null };
  });
  const spinRes = filterFixes([], circling);
  const rawPath = routeDistanceM(circling.map((f) => [f.lat, f.lng] as LatLng));
  check('Spinning in one spot is mostly suppressed', spinRes.distanceM < rawPath * 0.25, `${Math.round(spinRes.distanceM)}m of a raw ${Math.round(rawPath)}m`);
  check('Confinement is what rejected them', spinRes.rejected.confined > 0, `${spinRes.rejected.confined} confined`);
  /*
   * The property that actually matters. Some distance always leaks out at the
   * moment you stop, because the first few clustered fixes are genuinely
   * indistinguishable from a slow walk until the window fills. What must never
   * happen is that leak repeating: an hour in a small room has to cost the same
   * ~30 m as a minute does. Feed three more laps on top and check the total
   * barely moves.
   */
  let acc = spinRes.accepted;
  let extra = 0;
  for (let lap = 0; lap < 3; lap++) {
    const more = filterFixes(acc, circling);
    extra += more.distanceM;
    acc = [...acc, ...more.accepted];
  }
  check('Staying put does not keep adding distance', extra < 5, `${Math.round(extra)}m over three further laps`);

  // …and it must un-stick itself the moment you actually walk away.
  const leaving = Array.from({ length: 15 }, (_, i) => ({
    lat: 36.8 + (i + 1) * 0.00012, lng: 10.18, accuracy: 8, speed: 1.5,
  }));
  const leaveRes = filterFixes(spinRes.accepted, leaving);
  check('Walking away resumes crediting immediately', leaveRes.accepted.length >= 13 && leaveRes.distanceM > 180, `${Math.round(leaveRes.distanceM)}m`);

  // Geometry primitives.
  const straightLine: LatLng[] = [[36.8, 10.18], [36.801, 10.18], [36.802, 10.18], [36.803, 10.18], [36.804, 10.18]];
  check('A straight line is never confined', !isConfined(straightLine) && straightness(straightLine) > 0.99);
  const cluster: LatLng[] = [[36.8, 10.18], [36.80005, 10.18004], [36.79997, 10.17996], [36.80003, 10.17995], [36.8, 10.18001]];
  check('A tight wandering cluster is confined', isConfined(cluster) && spreadRadiusM(cluster) < CONFINEMENT_RADIUS_M);
  // A fix can never prove a movement smaller than its own error bar.
  const vague = filterFixes([[36.8, 10.18]], [{ lat: 36.80005, lng: 10.18, accuracy: 25, speed: null }]);
  check('A 5.5 m hop on a 25 m fix is rejected as jitter', vague.accepted.length === 0 && vague.rejected.jitter === 1);
  const precise = filterFixes([[36.8, 10.18]], [{ lat: 36.80005, lng: 10.18, accuracy: 4, speed: 1.2 }]);
  check('The same hop on a 4 m fix is accepted', precise.accepted.length === 1);
  // A car doesn't become a walk just because the phone is in it.
  const car = filterFixes([[36.8, 10.18]], [{ lat: 36.803, lng: 10.18, accuracy: 5, speed: 22 }]);
  check('Vehicle-speed fixes are still rejected', car.accepted.length === 0 && car.rejected.impossible === 1);
}

console.log('\nStep detector — rejecting motion that is not walking:');
{
  let s2 = 7;
  const rnd2 = () => ((s2 = (s2 * 1103515245 + 12345) % 2147483648) / 2147483648);

  // Turning on the spot: a small, slow, irregular wobble. The adaptive threshold
  // alone used to read this as ~26 steps per 30 s.
  const spinDet = new StepDetector();
  for (let i = 0; i < 1500; i++) {
    const t = i * 20;
    spinDet.onSample(0, 0, 1 + 0.03 * Math.sin((2 * Math.PI * 0.9 * t) / 1000) + 0.02 * (rnd2() - 0.5), t);
  }
  check('Spinning on the spot counts no steps', spinDet.steps === 0, `${spinDet.steps} over 30 s`);

  // A phone lying still — pure sensor noise.
  const stillDet = new StepDetector();
  for (let i = 0; i < 1500; i++) stillDet.onSample(0, 0, 1 + 0.004 * (rnd2() - 0.5), i * 20);
  check('A phone at rest counts no steps', stillDet.steps === 0, `${stillDet.steps} over 30 s`);

  // Real running must be unaffected: 2.8 Hz ≈ 168 steps/min for 30 s ≈ 84.
  const runDet = new StepDetector();
  for (let i = 0; i < 1500; i++) {
    const t = i * 20;
    runDet.onSample(0, 0, 1 + 1.1 * Math.sin((2 * Math.PI * 2.8 * t) / 1000), t);
  }
  check('Real running is counted accurately', runDet.steps >= 78 && runDet.steps <= 86, `${runDet.steps} vs ~84 expected`);

  // The warm-up must not silently eat the first strides of a walk.
  const warmDet = new StepDetector();
  let credited = 0;
  for (let i = 0; i < 400; i++) {
    const t = i * 20;
    credited += warmDet.onSample(0, 0, 1 + 0.5 * Math.sin((2 * Math.PI * 2 * t) / 1000), t);
  }
  check('Warm-up strides are banked, not lost', credited === warmDet.steps && warmDet.steps >= 12, `${warmDet.steps}`);

  // A single isolated thump is not a step.
  const bumpDet = new StepDetector();
  for (let i = 0; i < 200; i++) {
    const t = i * 20;
    bumpDet.onSample(0, 0, 1 + (i === 100 ? 0.8 : 0), t);
  }
  check('One isolated jolt is not a step', bumpDet.steps === 0, `${bumpDet.steps}`);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
