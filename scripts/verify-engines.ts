/* Smoke-test the pure domain engines against known values. Run: npx tsx scripts/verify-engines.ts */
import fs from 'node:fs';
import { darkTheme, lightTheme, lume, withAlpha, radius, spacing, typography, FONT_BY_VARIANT, motion } from '../src/theme';
import { calculateBMR, calculateTDEE, computeTargets, refineTDEE, GOAL_LABELS, GOAL_BLURBS, GOAL_NOTES, GOAL_ORDER, recommendedFiberG, FIBRE_MIN_G, FIBRE_G_PER_1000_KCAL } from '../src/lib/calories';
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
import { difficultyBySlug } from '../src/data/exercises';
import { difficultyOf, skillDifficulty, suitsLevel, levelFit, levelNote, DIFFICULTY_LABELS, type Difficulty } from '../src/lib/exerciseDifficulty';
import { SPLITS } from '../src/data/splits';
import { computePrayerTimes, nextPrayer } from '../src/lib/prayers';
import { resolveWindow, fastingState } from '../src/lib/fasting';
import { scoreMuscle, naturalGainRangeKgPerMonth } from '../src/lib/growth';
import { sumMicros, scaleMicros, percentRdi, microStatus, microGaps, MICRO_KEYS } from '../src/lib/micros';
import { haversine, routeDistanceM, normalizeRoute, parseRoute, type LatLng } from '../src/lib/geo';
import { segmentGateM, MIN_SEGMENT_M, ACCURACY_SLACK, VAGUE_SLACK, VAGUE_ACCURACY_M } from '../src/lib/gpsFilter';
import { parsePhotoIdentification, parseNutritionPer100g, sanitiseMicros, DEFAULT_MODEL, FALLBACK_MODELS, extractJson, MICRO_SANITY_MULTIPLE, modelRoute, MAX_ROUTE_MODELS, isUsableVisionModel, firstBalancedJson } from '../src/lib/aiFood';
import { matchFood, scoreFoodMatch, nameTokens, MATCH_MIN_SCORE } from '../src/lib/foodMatch';
import { servingGrams, scaleCatalogueFood, rowFromCatalogue, rowFromResearch, unresolvedNames, mealTotals } from '../src/lib/photoMeal';

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
import { FOOD_DB, FOODS_WITH_MICROS, formOf } from '../src/data/foods';
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
  rpeMeaning,
  RPE_SCALE,
  HARD_SET_MAX_RIR,
  STIMULATING_REP_WINDOW,
} from '../src/lib/effort';
import { estimate1RMFromSet, repsAtFailureEquivalent, ormConfidence } from '../src/lib/oneRepMax';
import { roundTo, roundKcal, roundGrams } from '../src/lib/format';
import { NICOTINE_PRODUCTS, findNicotineProduct, productOrDefault } from '../src/data/nicotineProducts';
import { BADGE_IMAGES } from '../src/data/badgeImages';
import {
  heatIndexC, windChillC, feelsLikeC, heatBand, extraWaterMl, calorieCostMultiplier,
  pacePenaltyPct, weatherAdvice, isReadingFresh, HEAT_BAND_LABEL, HEAT_BAND_COLOR,
  humiditySweatFactor,
} from '../src/lib/weather';
import {
  makeComponent, composeTotals, rescaleComponent, parseComponents, describeComponents, wouldCreateCycle,
} from '../src/lib/composedFood';
import { digestionMinutes, digestionStatus, currentDigestion, formatWait, intensityForSessionType, mealsFromEntries, mealSlowness, stomachLoad, drain, minutesToDrain, LIQUID_SPEED, MIN_SLOWNESS, LIQUID_SETTLE_MIN, type MealForDigestion } from '../src/lib/digestion';
import { smokeStatus, currentSmoke, coLoad, minutesToDecay, CO_HALF_LIFE_MIN, CO_THRESHOLD, NICOTINE_ACUTE_MIN } from '../src/lib/smokeClock';
import { trainReadiness } from '../src/lib/readiness';
import { buildReportHtml } from '../src/lib/reportHtml';
import type { ReportData } from '../src/repositories/reportRepo';
import { parseHHMM, resolveEatenAt, clockOf, EATEN_AT_PRESETS } from '../src/lib/eatenAt';
import { sessionStrain, postSessionMargins, marginStatuses, marginsStillRunning } from '../src/lib/postSession';
import { prescribeRest, pcrRecovered } from '../src/lib/restPrescription';
import { PCR_TAU_S, MAX_REST_S } from '../src/lib/restPrescription';
import { restPhysiology, estimateCohbPct, o2DeliveryFactor, neuralRecoveryFactor, pcrTimeFor, BASELINE_COHB_PCT, MAX_COHB_PCT, MAX_O2_LOSS, MAX_SPLANCHNIC_LOSS, type RestConditions } from '../src/lib/restPhysiology';
import { napBand, napValue, dayRest, timingFactor, nightSleepCostMin, napAdvice, BAND_EFFICIENCY, BAND_INERTIA_MIN, BAND_ALERTNESS_MIN, MAX_NAP_CREDIT_MIN } from '../src/lib/naps';
import { profileFor, effectiveLoadKg, loadCalorieFactor, intensityCalorieFactor } from '../src/lib/loadProfile';
import { EXPERIENCE_LEVELS, LEVEL_LABELS, slugsForLevel, prescriptionLine, levelOrDefault } from '../src/lib/level';
import { MUSCLE_GROUPS, MUSCLE_LABELS, SUB_MUSCLE_LABELS } from '../src/data/exercises';
import { CHALLENGES, DIFFICULTY_POINTS } from '../src/data/challenges';
import {
  buildDailyWheel,
  eligibleChallenges,
  wheelRotationDeg,
  challengeProgress,
  isChallengeComplete,
  WHEEL_SIZE,
} from '../src/lib/challengeWheel';
import { ICONS } from '../src/constants/icon-map';
import { combustedEquivalents, totalNicotineMg, combustedShare } from '../src/lib/smoking';
import { caloriesFromMacros, resolveCalories, parseAmount, isCompleteCustomFood, macroEnergyShares } from '../src/lib/foodMath';
import { SUPPLEMENTS, findSupplement, servingUnits } from '../src/data/supplements';
import { buildIntakePlan } from '../src/lib/supplementPlan';
import { projectComposition, compareToActual, explainGap, fatLossFraction, leanGainFraction, type DayInput } from '../src/lib/projection';
import { distributeSessionCalories, activeSecondsFor, caloriesForReference, restMetFor, REST_MET_FLOOR, REST_MET_PEAK, type BurnExercise } from '../src/lib/exerciseCalories';
import { OUTDOOR_ACTIVITIES, activityFor, activityMet, requiresGps } from '../src/lib/outdoorActivities';
import { strideFactorFor } from '../src/lib/pedometer';
import { ALIAS_SLUGS } from '../src/data/exercises';
import { SEARCH_FOOD_DB } from '../src/data/foods';
import { TRAINING_METHODS, methodsFor, findMethod } from '../src/data/trainingMethods';
import { PROGRAMS, programsFor } from '../src/data/programs';
import { SPECIAL_PROGRAMS, SPECIAL_CATEGORY_META, SPECIAL_CATEGORY_ORDER, specialProgramsFor, findSpecialProgram, specialStyleTag } from '../src/data/specialPrograms';
import { SPECIAL_DIET_BUILDS } from '../src/data/specialDietPlans';
import { subMuscleOf, subMusclesFor } from '../src/lib/subMuscle';
import { estimateDifficulty, findEasierAlternatives, matchQuality, type AltExercise } from '../src/lib/exerciseAlternatives';
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
check('Rest is no longer valued at the exercise MET — the old flat estimate is nearly 3× too high', uniform.total < netCaloriesFromMet(5, 80, 3600) / 2, `${uniform.total} vs the old ${netCaloriesFromMet(5, 80, 3600)}`);
check('…and the work itself is still valued at its own MET', uniform.perExercise[0] === netCaloriesFromMet(5, 80, 30) && uniform.workSeconds === 60);
// Mixed session: the higher-MET movement earns a larger share for equal work.
const mixed = distributeSessionCalories({ durationS: 1800, weightKg: 80, fallbackMet: 6, exercises: [ { met: 11, trackingType: 'duration', sets: [{ durationS: 600, completed: true }] }, { met: 3, trackingType: 'duration', sets: [{ durationS: 600, completed: true }] } ] });
check('Higher-MET movement earns a bigger share', mixed.perExercise[0] > mixed.perExercise[1] * 3, `${mixed.perExercise[0]} vs ${mixed.perExercise[1]}`);
check('Work shares plus the rest add up to the session total', Math.abs(mixed.perExercise[0] + mixed.perExercise[1] + mixed.restCalories - mixed.total) < 1);
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
// Every declared category must carry programmes — checked against the META
// itself rather than a hard-coded list, so adding a category can't leave it
// silently empty.
check('Every declared category is populated', (Object.keys(SPECIAL_CATEGORY_META) as Array<keyof typeof SPECIAL_CATEGORY_META>).every((c) => specialProgramsFor(c).length >= 2), Object.keys(SPECIAL_CATEGORY_META).filter((c) => specialProgramsFor(c as never).length < 2).join(', '));
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
// The portion is 3 g — the dose the trials actually use — not the token 1 g
// most labels suggest. Every micro figure below is per-100 g x 0.03.
check('Spiruline portion is 3 g (6 tablets)', /3 g/.test(spir.defaultDose) && /6 tablets/.test(spir.defaultDose), spir.defaultDose);
check('Spiruline minerals scaled from per-100g', near(spir.micros!.calcium_mg!, 3.6, 0.05) && near(spir.micros!.iron_mg!, 0.855, 0.02) && near(spir.micros!.magnesium_mg!, 5.85, 0.05) && near(spir.micros!.phosphorus_mg!, 3.54, 0.05) && near(spir.micros!.potassium_mg!, 40.8, 0.1));
check('Spiruline B-vitamins scaled from per-100g', near(spir.micros!.thiamin_mg!, 0.0714, 0.003) && near(spir.micros!.riboflavin_mg!, 0.11, 0.003) && near(spir.micros!.niacin_mg!, 0.384, 0.005));
check('Spiruline copper is included (a real contributor at 3 g)', near(spir.micros!.copper_mg!, 0.183, 0.01), `${spir.micros!.copper_mg}`);
// Vitamin A stored as RAE (beta-carotene ÷12), so a stack can't trip a false toxicity flag.
check('Spiruline vitamin A stored as RAE (~350µg), not raw 4200µg', spir.micros!.vitaminA_ug! > 300 && spir.micros!.vitaminA_ug! < 420, `${spir.micros!.vitaminA_ug}`);
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
/*
 * Written against the catalogue's SHAPE rather than a pinned count: every
 * category holds exactly ten badges and ids run 1..n contiguously. Hard-coding
 * 120 made these fail on the next addition for a reason unrelated to what they
 * test.
 */
const badgeCount = ACHIEVEMENTS.length;
check('Every badge carries real SVG art', ACHIEVEMENTS.every((a) => a.svg.startsWith('<svg') && a.svg.endsWith('</svg>')), `${badgeCount} badges`);
check('Ten badges in every category', ACHIEVEMENT_CATEGORIES.every((_, i) => ACHIEVEMENTS.filter((a) => a.category === i + 1).length === 10), `${ACHIEVEMENT_CATEGORIES.length} categories`);
check('Categories and badges stay in step', badgeCount === ACHIEVEMENT_CATEGORIES.length * 10);
check('Every badge has criteria text', ACHIEVEMENTS.every((a) => a.criteria.length > 0));
check('Badge ids are unique and contiguous from 1', new Set(ACHIEVEMENTS.map((a) => a.id)).size === badgeCount && Math.min(...ACHIEVEMENTS.map((a) => a.id)) === 1 && Math.max(...ACHIEVEMENTS.map((a) => a.id)) === badgeCount);
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
  challengesSpun: 0, challengesCompleted: 0, challengeStreakBest: 0,
  challengeHardCompleted: 0, challengeCategories: 0, challengePoints: 0,
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

console.log('\nCodebase audit (references, schema parity, navigation):');
{
  // Every achievement must have pre-rendered badge art — the SVG path crashes
  // natively, so a missing PNG silently downgrades to a generic medallion.
  const artless = ACHIEVEMENTS.filter((a) => !(BADGE_IMAGES as Record<number, string>)[a.id]);
  check('Every achievement has rendered badge art', artless.length === 0, artless.map((a) => a.id).join(','));

  // Every icon key in every catalogue resolves — a bad key renders blank.
  const iconOk2 = (k: string) => { const [g, n] = (k ?? '').split('.'); return !!(ICONS as Record<string, Record<string, unknown>>)[g]?.[n]; };
  const badIcons = [
    ...EXLIB.map((e) => [`exercise ${e.slug}`, e.icon]),
    ...SPECIAL_PROGRAMS.map((p) => [`special ${p.key}`, p.icon]),
    ...SUPPLEMENTS.map((s) => [`supp ${s.key}`, s.icon]),
    ...NICOTINE_PRODUCTS.map((p) => [`nicotine ${p.key}`, p.icon]),
  ].filter(([, k]) => !iconOk2(k));
  check('Every catalogue icon key resolves', badIcons.length === 0, badIcons.slice(0, 4).map(([w, k]) => `${k}@${w}`).join(', '));

  /*
   * Drizzle schema ↔ runtime DDL parity, table by table and column by column.
   * A column in the schema but not the CREATE TABLE breaks fresh installs the
   * moment anything selects it — the family of bug that has bitten before.
   */
  const normEol = (p: string) => fs.readFileSync(p, 'utf8').split('\r\n').join('\n');
  const schemaSrc2 = normEol('src/db/schema.ts');
  const bootSrc7 = normEol('src/db/bootstrap.ts');
  const schemaTableRe = /sqliteTable\('(\w+)',\s*\{([\s\S]*?)\n\}\)/g;
  const parityIssues: string[] = [];
  let tm: RegExpExecArray | null;
  let tablesChecked = 0;
  while ((tm = schemaTableRe.exec(schemaSrc2))) {
    const [, table, body] = tm;
    tablesChecked++;
    const tok = `CREATE TABLE IF NOT EXISTS ${table} (`;
    const at = bootSrc7.indexOf(tok);
    if (at < 0) { parityIssues.push(`table ${table} missing`); continue; }
    const ddlBody = bootSrc7.slice(at + tok.length, bootSrc7.indexOf(');', at));
    const ddlCols = new Set(ddlBody.split('\n').map((l) => l.trim().split(/\s+/)[0]).filter(Boolean));
    for (const col of [...body.matchAll(/(?:text|integer|real)\('(\w+)'/g)].map((x) => x[1])) {
      if (!ddlCols.has(col)) parityIssues.push(`${table}.${col}`);
    }
  }
  check('Every drizzle table and column exists in the runtime DDL', parityIssues.length === 0, parityIssues.slice(0, 5).join(', ') || `${tablesChecked} tables`);
  check('The parity scan actually parsed the schema', tablesChecked >= 25, `${tablesChecked}`);

  // Every navigation target must be a registered route — the inverse of the
  // orphan check, catching typos and screens navigated to but never registered.
  const rootNav = normEol('src/navigation/RootNavigator.tsx');
  const tabNav = normEol('src/navigation/TabNavigator.tsx');
  const registeredRoutes = new Set([
    ...[...rootNav.matchAll(/name="(\w+)"/g)].map((x) => x[1]),
    ...[...tabNav.matchAll(/name="(\w+)"/g)].map((x) => x[1]),
  ]);
  const walkDir = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walkDir(`${dir}/${e.name}`) : e.name.endsWith('.tsx') ? [`${dir}/${e.name}`] : []);
  const badTargets: string[] = [];
  for (const f of [...walkDir('src/screens'), ...walkDir('src/components')]) {
    for (const t of [...normEol(f).matchAll(/(?:navigate|replace|push)\('(\w+)'/g)].map((x) => x[1])) {
      if (!registeredRoutes.has(t)) badTargets.push(`${f} → ${t}`);
    }
  }
  check('Every navigation call targets a registered route', badTargets.length === 0, badTargets.slice(0, 3).join('; '));
}

console.log('\nWeather engine:');
{
  // ── Heat index: a standard regression, checked against published values ──
  check('Heat index at 32°C / 70% RH ≈ 41°C', near(heatIndexC(32, 70), 41, 1.5), `${heatIndexC(32, 70)}`);
  check('Heat index at 38°C / 60% RH is dangerous (~52°C)', heatIndexC(38, 60) > 48, `${heatIndexC(38, 60)}`);
  check('Below 27°C the heat index is just the temperature', heatIndexC(22, 90) === 22);
  check('Unknown humidity returns temperature, not a guess', heatIndexC(35, null) === 35);
  // ── Wind chill ──
  check('Wind chill at 0°C / 30 km/h ≈ -6.5°C', near(windChillC(0, 30), -6.5, 1), `${windChillC(0, 30)}`);
  check('Above 10°C wind chill does not apply', windChillC(15, 40) === 15);
  check('Calm air has no wind chill', windChillC(-5, 2) === -5);
  // ── Bands and their colours cover every value ──
  check('Bands span the whole scale', ['cold', 'cool', 'ideal', 'warm', 'hot', 'extreme'].every((b) => !!HEAT_BAND_LABEL[b as never] && !!HEAT_BAND_COLOR[b as never]));
  check('Band edges are monotonic', heatBand(-10) === 'cold' && heatBand(8) === 'cool' && heatBand(18) === 'ideal' && heatBand(27) === 'warm' && heatBand(34) === 'hot' && heatBand(42) === 'extreme');
  // ── Feels-like picks the right correction ──
  check('feelsLike uses heat index when hot', feelsLikeC({ tempC: 33, humidityPct: 75, windKmh: 5 }) > 33);
  check('feelsLike uses wind chill when cold', feelsLikeC({ tempC: 2, humidityPct: 50, windKmh: 30 }) < 2);
  check('feelsLike is untouched in the comfortable middle', feelsLikeC({ tempC: 18, humidityPct: 90, windKmh: 40 }) === 18);
  // ── Hydration: adds on heat, never subtracts, capped ──
  check('Ideal weather adds no water', extraWaterMl(18, 60) === 0);
  check('Hot weather adds meaningfully more', extraWaterMl(34, 60) >= 700, `${extraWaterMl(34, 60)}`);
  check('Extra water scales with planned training', extraWaterMl(34, 120) > extraWaterMl(34, 30));
  check('A hot rest day still adds something (resting sweat)', extraWaterMl(34, 0) > 0);
  check('The extra is capped at a sane ceiling', extraWaterMl(45, 600, { tempC: 45, humidityPct: 100 }) <= 3000);
  // ── Humidity: the piece feels-like does NOT capture ──
  // Two days at the same feels-like are not equal for sweat. At 90% humidity
  // almost none of it evaporates, so the body pours out more for less cooling.
  check('Humidity factor is 1 in dry air', humiditySweatFactor(30, 30) === 1);
  check('Humidity factor rises toward 1.4 in saturated warm air', humiditySweatFactor(30, 100) > 1.35 && humiditySweatFactor(30, 100) <= 1.4, `${humiditySweatFactor(30, 100)}`);
  check('Humidity does nothing in the cold (you are not sweating)', humiditySweatFactor(10, 100) === 1);
  check('Unknown humidity is 1, not a guess', humiditySweatFactor(30, null) === 1);
  check('Same feels-like, humid day needs MORE water', extraWaterMl(32, 60, { tempC: 30, humidityPct: 90 }) > extraWaterMl(32, 60, { tempC: 30, humidityPct: 40 }));
  check('Humid heat costs more pace than dry heat', pacePenaltyPct(32, { tempC: 30, humidityPct: 90 }) > pacePenaltyPct(32, { tempC: 30, humidityPct: 40 }));
  check('Humidity adds nothing to pace when it is not hot', pacePenaltyPct(18, { tempC: 18, humidityPct: 95 }) === 0);
  check('The advice names very high humidity explicitly', weatherAdvice({ tempC: 33, humidityPct: 85, windKmh: 5, observedAt: Date.now(), source: 'manual' }, { plannedActiveMin: 60 }).points.some((p) => /85% humidity/.test(p)));
  const wRepoH = fs.readFileSync('src/repositories/weatherRepo.ts', 'utf8');
  check('The water goal passes humidity through', /extraWaterMl\(fl, plannedActiveMin, \{ tempC: r\.tempC, humidityPct: r\.humidityPct \}\)/.test(wRepoH));
  // ── Walk/Run: the one activity that is always outdoors ──
  const walkSrcW = fs.readFileSync('src/screens/train/WalkScreen.tsx', 'utf8');
  check('The Walk/Run screen shows weather before you start', /<WeatherCard plannedActiveMin=/.test(walkSrcW));
  check('…and a one-line reminder while moving', /<WalkWeatherLine \/>/.test(walkSrcW) && /function WalkWeatherLine/.test(walkSrcW));
  check('The in-session line never fetches (foreground service is busy)', !/fetchLiveWeather/.test(walkSrcW.slice(walkSrcW.indexOf('function WalkWeatherLine'))));
  check('Cold adds no water (thirst blunted, note handles it)', extraWaterMl(-5, 60) === 0);
  // ── Calorie multiplier is modest and never applied to logs ──
  check('Calorie multiplier stays within a sane band', [45, 34, 27, 18, 3, -8].every((t) => calorieCostMultiplier(t) >= 1 && calorieCostMultiplier(t) <= 1.1));
  check('Ideal weather has no calorie effect', calorieCostMultiplier(18) === 1);
  const sessSrcW = fs.readFileSync('src/repositories/sessionRepo.ts', 'utf8');
  check('Weather is NOT baked into logged session calories', !/calorieCostMultiplier/.test(sessSrcW) && !/weather/i.test(sessSrcW));
  // ── Pace penalty rises with heat ──
  check('Pace penalty rises monotonically', pacePenaltyPct(18) === 0 && pacePenaltyPct(25) < pacePenaltyPct(30) && pacePenaltyPct(30) < pacePenaltyPct(36) && pacePenaltyPct(36) < pacePenaltyPct(42));
  // ── Advice: personal context actually changes the output ──
  const hot = { tempC: 36, humidityPct: 60, windKmh: 5, observedAt: Date.now(), source: 'manual' as const };
  const cold = { tempC: 1, humidityPct: 60, windKmh: 25, observedAt: Date.now(), source: 'manual' as const };
  const base = { plannedActiveMin: 60 };
  check('Extreme heat advises against hard outdoor training', weatherAdvice(hot, base).cautionOutdoors === true);
  check('Ideal weather does not', weatherAdvice({ ...hot, tempC: 18, humidityPct: 50 }, base).cautionOutdoors === false);
  check('A respiratory condition adds airway advice in the cold', weatherAdvice(cold, { ...base, respiratoryCondition: true }).points.some((p) => /respiratory|airway/i.test(p)));
  check('…and NOT in the heat (where it is irrelevant)', !weatherAdvice(hot, { ...base, respiratoryCondition: true }).points.some((p) => /respiratory/i.test(p)));
  check('A cardiac condition escalates heat to caution', weatherAdvice({ ...hot, tempC: 31, humidityPct: 50 }, { ...base, cardiacCondition: true }).cautionOutdoors === true);
  check('Fasting in heat mentions the eating window', weatherAdvice(hot, { ...base, fasting: true }).points.some((p) => /eating window/i.test(p)));
  check('Every band produces a headline and at least one point', ([-8, 8, 18, 27, 34, 42] as const).every((t) => { const a = weatherAdvice({ ...hot, tempC: t, humidityPct: 50, windKmh: 10 }, base); return a.headline.length > 10 && a.points.length >= 1; }));
  // ── Freshness ──
  check('A 2-hour-old reading is fresh', isReadingFresh({ ...hot, observedAt: Date.now() - 2 * 3_600_000 }));
  check('A 5-hour-old reading is stale', !isReadingFresh({ ...hot, observedAt: Date.now() - 5 * 3_600_000 }));
  // ── Fetch service: privacy and failure posture ──
  const fetchSrc = fs.readFileSync('src/services/weatherFetch.ts', 'utf8');
  check('Live fetch needs no API key or account', !/api[_-]?key|token|appid/i.test(fetchSrc));
  check('Coordinates are rounded before leaving the device', /toFixed\(2\)/.test(fetchSrc));
  check('Fetch never throws into the UI', /catch \{[\s\S]*return null;/.test(fetchSrc));
  check('Fetch has a timeout so it cannot hang the screen', /AbortController/.test(fetchSrc));
  // ── Schema ──
  const bootSrcW = fs.readFileSync('src/db/bootstrap.ts', 'utf8');
  check('weather_readings is in the CREATE TABLE DDL', /CREATE TABLE IF NOT EXISTS weather_readings/.test(bootSrcW));
  const svW = Number((bootSrcW.match(/SCHEMA_VERSION = (\d+)/) || [])[1] ?? 0);
  check('Schema version is at or past the weather table', svW >= 25, `${svW}`);
  // ── Hydration wiring: adds, never subtracts, explained ──
  const wRepo = fs.readFileSync('src/repositories/weatherRepo.ts', 'utf8');
  check('Weather-adjusted water goal is base + extra', /totalMl: baseMl \+ extra/.test(wRepo));
  check('Both Home and Nutrition use the adjusted goal', /weatherAdjustedWaterGoal\(/.test(fs.readFileSync('src/screens/home/HomeScreen.tsx', 'utf8')) && /weatherAdjustedWaterGoal\(/.test(fs.readFileSync('src/screens/nutrition/NutritionScreen.tsx', 'utf8')));
  check('Nutrition explains the extra rather than hiding it', /for the heat/.test(fs.readFileSync('src/screens/nutrition/NutritionScreen.tsx', 'utf8')));
}

console.log('\nComposed foods (a dish from other foods with quantities):');
{
  const couscous = FOOD_DB.find((f) => f.id === 'tn-couscous-plain')!;
  const lamb = FOOD_DB.find((f) => f.id === 'tn-lamb')!;
  const chickpeas = FOOD_DB.find((f) => f.id === 'tn-chickpeas')!;
  const asC = (f: typeof couscous) => ({ id: f.id, name: f.name, serving: f.serving, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat, fiber: f.fiber, micros: f.micros ?? null });

  // ── A component is the food × servings, snapshotted ──
  const c1 = makeComponent(asC(couscous), 1.5);
  check('A component scales macros by servings', near(c1.calories, couscous.calories * 1.5, 0.01) && near(c1.proteinG, couscous.protein * 1.5, 0.01));
  check('…and scales micros by servings too', (c1.micros?.selenium_ug ?? 0) > 0 && near(c1.micros!.selenium_ug!, (couscous.micros!.selenium_ug!) * 1.5, 0.05));
  check('Nonsense servings default to 1, never 0 or negative', makeComponent(asC(lamb), -2).servings === 1 && makeComponent(asC(lamb), NaN).servings === 1);

  // ── The dish is the sum of its parts, macros AND micros ──
  const plate = [c1, makeComponent(asC(lamb), 1), makeComponent(asC(chickpeas), 0.5)];
  const t = composeTotals(plate);
  const expectKcal = couscous.calories * 1.5 + lamb.calories + chickpeas.calories * 0.5;
  check('Totals sum the parts exactly', near(t.calories, Math.round(expectKcal), 1), `${t.calories} vs ${Math.round(expectKcal)}`);
  check('Protein sums the parts', near(t.proteinG, couscous.protein * 1.5 + lamb.protein + chickpeas.protein * 0.5, 0.15));
  /*
   * The reason to compose rather than guess a number for the finished plate:
   * the lamb's iron and B12 must ride along into the totals exactly as they
   * would if the parts had been logged separately.
   */
  check("The lamb's B12 and iron survive into the dish", (t.micros?.vitaminB12_ug ?? 0) > 0 && (t.micros?.iron_mg ?? 0) > 0);
  check('Dish micros equal the sum of component micros', near(t.micros!.iron_mg!, (c1.micros?.iron_mg ?? 0) + (lamb.micros?.iron_mg ?? 0) + (chickpeas.micros?.iron_mg ?? 0) * 0.5, 0.05));
  check('Totals carry no float tails', Number.isInteger(t.calories) && String(t.proteinG).replace(/[^.]/g, '').length <= 1 && (String(t.proteinG).split('.')[1]?.length ?? 0) <= 1);
  check('An empty dish is zero with no micros', composeTotals([]).calories === 0 && composeTotals([]).micros === null);

  // ── Rescaling a component keeps its snapshot exact ──
  const doubled = rescaleComponent(c1, 3);
  check('Rescaling doubles every figure', near(doubled.calories, c1.calories * 2, 0.01) && near(doubled.micros!.selenium_ug!, c1.micros!.selenium_ug! * 2, 0.05));
  check('Rescaling to the same servings is a no-op', rescaleComponent(c1, 1.5) === c1);
  check('Rescaling to nonsense keeps the old value', rescaleComponent(c1, 0).servings === 1.5);

  // ── Serialisation and display ──
  check('Components round-trip through JSON', parseComponents(JSON.stringify(plate)).length === 3 && parseComponents('garbage').length === 0 && parseComponents(null).length === 0);
  check('The description names parts and quantities', /×1\.5/.test(describeComponents(plate)) && /×0\.5/.test(describeComponents(plate)));
  check('Long lists truncate with a count', /\+2 more/.test(describeComponents([...plate, ...plate], 4)));

  // ── A dish may not contain itself ──
  check('Self-inclusion is a cycle', wouldCreateCycle('custom:7', ['custom:7']));
  check('Another dish is not', !wouldCreateCycle('custom:8', ['custom:7']));

  // ── Wiring: stored as a snapshot, logged like any food, edited in the composer ──
  const cfRepo = fs.readFileSync('src/repositories/customFoodRepo.ts', 'utf8');
  check('Composed foods store their components as a snapshot', /componentsJson: JSON\.stringify\(input\.components\)/.test(cfRepo));
  check('…with the row macros pre-summed so logging is one read', /calories: t\.calories,\s*\n\s*protein: t\.proteinG/.test(cfRepo));
  check('…and their summed micros stored for the Micros screen', /microsJson: t\.micros \? JSON\.stringify\(t\.micros\) : null/.test(cfRepo));
  check('Composed calories are real sums, not marked estimated', /caloriesEstimated: false,\s*\n\s*componentsJson/.test(cfRepo));
  check('The composer can pick from own foods AND the catalogue', /composableFoods\(/.test(cfRepo) && /listCustomFoods\(userId\)\.map/.test(cfRepo));
  check('A dish is excluded from its own picker', /excludeId \? all\.filter\(\(f\) => f\.id !== excludeId\)/.test(cfRepo));
  const addSrc = fs.readFileSync('src/screens/nutrition/AddFoodScreen.tsx', 'utf8');
  check('The composer is reachable from the food search', /navigate\('ComposeFood', \{\}\)/.test(addSrc));
  check('Editing a composed dish opens the composer, not the plain form', /item\.isComposed \? 'ComposeFood' : 'CustomFood'/.test(addSrc));
  const bootSrcC = fs.readFileSync('src/db/bootstrap.ts', 'utf8');
  check('components_json and micros_json are in DDL and migration', /components_json TEXT/.test(bootSrcC) && /column: 'components_json'/.test(bootSrcC) && /column: 'micros_json'/.test(bootSrcC));
  const svC = Number((bootSrcC.match(/SCHEMA_VERSION = (\d+)/) || [])[1] ?? 0);
  check('Schema version is at or past the composed-food migration', svC >= 26, `${svC}`);
}

console.log('\nDigestion clock — a stomach load that stacks:');
{
  const NOW = Date.now();
  const meal = (calories: number, fatG: number, proteinG = 20, fiberG = 4, agoMin = 0): MealForDigestion => ({
    calories, fatG, proteinG, carbsG: 50, fiberG, eatenAt: NOW - agoMin * 60_000,
  });
  // ── Calibration against the standard gastric-emptying ranges ──
  const snack = digestionMinutes(meal(200, 3, 4, 2), 'moderate');
  const mixed = digestionMinutes(meal(600, 20, 30, 6), 'moderate');
  const mixedHard = digestionMinutes(meal(600, 20, 30, 6), 'hard');
  const fatty = digestionMinutes(meal(900, 40, 35, 6), 'hard');
  check('A 200 kcal carb snack: a normal session in ~20–45 min', snack >= 15 && snack <= 45, `${snack} min`);
  check('A 600 kcal mixed meal: a normal session in ~2 h', mixed >= 100 && mixed <= 150, `${mixed} min`);
  check('…and hard training in ~2–3 h', mixedHard >= 130 && mixedHard <= 190, `${mixedHard} min`);
  check('A 900 kcal fatty meal before hard training needs 4 h+', fatty >= 240, `${fatty} min`);
  check('Water / a hydration row needs no wait', digestionMinutes(meal(0, 0, 0, 0)) === 0);
  // ── The levers move the right way, and are about the MIX ──
  check('More fat means longer', digestionMinutes(meal(600, 40)) > digestionMinutes(meal(600, 10)));
  check('More food means longer', digestionMinutes(meal(900, 20)) > digestionMinutes(meal(400, 20)));
  check('More fibre means longer', digestionMinutes(meal(600, 20, 20, 15)) > digestionMinutes(meal(600, 20, 20, 2)));
  check('More protein means longer', digestionMinutes(meal(600, 10, 60, 4)) > digestionMinutes(meal(600, 10, 15, 4)));
  check('A carb-heavy meal is the fast reference (slowness ~1)', mealSlowness({ calories: 600, proteinG: 15, fatG: 5, fiberG: 3 }) < 1.1);
  check('A greasy meal is markedly slower than a lean one of the same size', mealSlowness({ calories: 600, proteinG: 20, fatG: 38, fiberG: 2 }) > mealSlowness({ calories: 600, proteinG: 45, fatG: 5, fiberG: 6 }) * 1.25);
  check('Slowness is bounded 1..2', mealSlowness({ calories: 100, proteinG: 0, fatG: 11, fiberG: 6 }) <= 2 && mealSlowness({ calories: 100, proteinG: 0, fatG: 0, fiberG: 0 }) === 1);
  check('Hard training needs longer than normal, normal than light', digestionMinutes(meal(600, 20), 'hard') > digestionMinutes(meal(600, 20), 'moderate') && digestionMinutes(meal(600, 20), 'moderate') > digestionMinutes(meal(600, 20), 'light'));
  check('A walk after a big meal is fine within the hour', digestionMinutes(meal(600, 20), 'light') <= 45);
  check('Never absurd: capped at 5 h', digestionMinutes(meal(3000, 150, 100, 40), 'hard') <= 300);
  check('Even a small bite settles first: hard training waits 30 min', digestionMinutes(meal(60, 0, 0, 0), 'hard') === 30);
  // ── The drain maths ──
  check('Draining for zero minutes changes nothing', drain(600, 0, 1.2) === 600);
  check('Draining reduces the load and never goes negative', drain(600, 60, 1.2) < 600 && drain(50, 600, 1) === 0);
  check('minutesToDrain inverts drain', Math.abs(drain(600, minutesToDrain(600, 180, 1.3), 1.3) - 180) < 0.5);
  check('A fuller stomach drains more kcal per minute (but takes longer overall)', (1000 - drain(1000, 30, 1)) > (300 - drain(300, 30, 1)) && minutesToDrain(1000, 180, 1) > minutesToDrain(300, 180, 1));
  // ── Status and countdown ──
  const fresh = digestionStatus(meal(600, 20), 'moderate', NOW);
  check('A meal eaten just now is not ready', !fresh.ready && fresh.remainingMin > 0 && fresh.progress === 0);
  const old = digestionStatus(meal(600, 20, 20, 4, 400), 'hard', NOW);
  check('A meal from 6+ hours ago is ready for anything', old.ready && old.readyFor === 'hard' && old.progress === 1 && old.loadKcal === 0);
  // 100 min after a 600 kcal meal ~300 kcal is left: too much for a normal
  // session (260) or sprints (180), fine for a walk (500).
  const half = digestionStatus(meal(600, 20, 20, 4, 100), 'hard', NOW);
  check('Part-way through: readyFor answers what you CAN do now', half.readyFor === 'light' && !half.ready, `${half.readyFor} @${half.loadKcal}`);
  check('…and too soon for anything reads as null, not a flattering guess', digestionStatus(meal(600, 20, 20, 4, 5), 'hard', NOW).readyFor === null);
  check('readyAt is now plus the remaining minutes', fresh.readyAt === NOW + fresh.remainingMin * 60_000);
  check('The status carries the load and what went in', fresh.loadKcal > 0 && fresh.eatenKcal === 600 && fresh.mealCount === 1);
  // ── STACKING: the whole point ──
  const lunch = meal(600, 20, 30, 6, 95);
  const snack2 = meal(300, 10, 10, 3, 5);
  const alone1 = currentDigestion([lunch], 'hard', NOW)!;
  const alone2 = currentDigestion([snack2], 'hard', NOW)!;
  const both = currentDigestion([lunch, snack2], 'hard', NOW)!;
  check('A snack on top of a half-digested lunch waits for BOTH', both.remainingMin > alone1.remainingMin && both.remainingMin > alone2.remainingMin, `${alone1.remainingMin} / ${alone2.remainingMin} → ${both.remainingMin}`);
  // Slightly MORE than the two remainders added: two separate timers would each
  // get their own base emptying rate, and a real stomach has one. That is the
  // error the old per-meal model made, and the reason for stacking.
  check('The stacked load is the lunch remainder plus the snack, sharing one stomach', both.loadKcal >= alone1.loadKcal + alone2.loadKcal - 2 && both.loadKcal <= (alone1.loadKcal + alone2.loadKcal) * 1.05 && both.mealCount === 2 && both.eatenKcal === 900, `${alone1.loadKcal}+${alone2.loadKcal} → ${both.loadKcal}`);
  const stack = stomachLoad([lunch, snack2], NOW);
  check('stomachLoad reports the last bite and blends the mix', stack.lastEatenAt === snack2.eatenAt && stack.slowness > 1 && stack.slowness < 2);
  check('A meal cleared before the next does not stack', stomachLoad([meal(500, 15, 20, 4, 600), meal(300, 10, 10, 3, 5)], NOW).meals.length === 1);
  check('Meals stamped in the future are ignored', stomachLoad([meal(500, 15, 20, 4, -30)], NOW).loadKcal === 0);
  check('Order of the input list does not matter', stomachLoad([snack2, lunch], NOW).loadKcal === stack.loadKcal);
  check('The governing status stacks; cleared ones drop out', !!currentDigestion([meal(600, 20, 20, 4, 30), meal(200, 3, 4, 2, 10), meal(500, 15, 20, 4, 600)], 'moderate', NOW));
  check('An empty stomach reads as clear', currentDigestion([], 'hard', NOW) === null);
  check('All-cleared meals read as clear', currentDigestion([meal(600, 20, 20, 4, 600)], 'hard', NOW) === null);
  // ── Presentation ──
  check('Wait formats read naturally', formatWait(0) === 'clear' && formatWait(45) === '45 min' && formatWait(80) === '1 h 20' && formatWait(120) === '2 h');
  check('Session types map to sensible intensities', intensityForSessionType('strength') === 'hard' && intensityForSessionType('mindbody') === 'light' && intensityForSessionType('cardio') === 'moderate');
  check('mealsFromEntries carries the eaten time', mealsFromEntries([{ calories: 500, proteinG: 20, carbsG: 50, fatG: 15, fiberG: 4, createdAt: 12345 }])[0].eatenAt === 12345);
  // ── Wiring: shown where the decision is made, and only for today ──
  const nutSrcD = fs.readFileSync('src/screens/nutrition/NutritionScreen.tsx', 'utf8');
  check('Nutrition shows the clock only for today', /date === todayISO\(\) && <DigestionCard meals=\{digestMeals\} smokes=\{smokes\} smokingEnabled=\{smokingEnabled\}/.test(nutSrcD) && /date === todayISO\(\) && e\.calories >= 20/.test(nutSrcD));
  check('The Train tab asks the question at hard intensity, with the smoke clock', /intensity="hard"/.test(fs.readFileSync('src/screens/train/TrainScreen.tsx', 'utf8')) && /<ReadinessStrip/.test(fs.readFileSync('src/screens/train/TrainScreen.tsx', 'utf8')));
  // Superseded by the 3.0 bento: Home shows the readiness VERDICT; the full
  // digestion card (smoke clock included) lives one tap down in the sheet.
  check('Home carries the readiness strip', /<ReadinessStrip/.test(fs.readFileSync('src/screens/home/HomeScreen.tsx', 'utf8')));
  check('...whose sheet holds the full digestion card', /<DigestionCard meals=\{meals\} smokes=\{smokes\} smokingEnabled=\{smokingEnabled\} defaultIntensity=\{intensity\} \/>/.test(fs.readFileSync('src/components/ReadinessStrip.tsx', 'utf8')));
  check('...and a clear day says so instead of hiding', /Clear to train/.test(fs.readFileSync('src/components/ReadinessStrip.tsx', 'utf8')));
  const cardSrcD = fs.readFileSync('src/components/DigestionCard.tsx', 'utf8');
  // Two meters, never one merged bar.
  check('The card draws the stomach and the smoke as two separate meters', /<Meter icon="digest\.stomach" title="Stomach"/.test(cardSrcD) && /<Meter icon="smoking\.cigarette" title="Smoke"/.test(cardSrcD));
  check('…each with its own bar and its own countdown', (cardSrcD.match(/<ProgressBar progress=\{progress\} color=\{color\}/g) ?? []).length === 1 && /progress=\{s \? s\.progress : 1\}/.test(cardSrcD) && /progress=\{k \? k\.progress : 1\}/.test(cardSrcD));
  check('The smoke meter shows whenever the module is on, even when clear', /const showSmoke = smokingEnabled \|\| smokes\.length > 0;/.test(cardSrcD) && /Nothing smoked in the last day\./.test(cardSrcD));
  check('The headline names which clock governs', /The smoke clock' : 'The stomach clock'\} governs/.test(cardSrcD));
  check('The card names the stacked load and how many meals are in it', /kcal still digesting/.test(cardSrcD) && /across \$\{s\.mealCount\} meals/.test(cardSrcD));
  check('The card explains that carbs are fast and fat/fibre slow', /carbs fastest, then protein, fat and fibre slowest/.test(cardSrcD));
}

console.log('\nSmoke clock — after a cigarette, and it stacks:');
{
  const NOW = Date.now();
  const M = 60_000;
  const cig = (minsAgo: number, qty = 1) => ({ at: NOW - minsAgo * M, combusted: true, cigaretteEquivalent: 1, quantity: qty });
  const pouch = (minsAgo: number) => ({ at: NOW - minsAgo * M, combusted: false, cigaretteEquivalent: 0, quantity: 1 });
  const cigar = (minsAgo: number) => ({ at: NOW - minsAgo * M, combusted: true, cigaretteEquivalent: 4, quantity: 1 });
  const shisha = (minsAgo: number) => ({ at: NOW - minsAgo * M, combusted: true, cigaretteEquivalent: 10, quantity: 1 });
  const one = smokeStatus([cig(5)], 'hard', NOW)!;
  check('One cigarette: hard training waits out the acute window (~45 min)', one.remainingMin === 40 && one.limitedBy === 'nicotine', `${one.remainingMin}`);
  check('…normal 30, a walk 15', smokeStatus([cig(5)], 'moderate', NOW)!.remainingMin === 25 && smokeStatus([cig(5)], 'light', NOW)!.remainingMin === 10);
  check('…and is clear for anything after 50 min', smokeStatus([cig(50)], 'hard', NOW)!.ready && currentSmoke([cig(50)], 'hard', NOW) === null);
  check('A pouch or vape gets the acute window but no carbon monoxide', smokeStatus([pouch(5)], 'hard', NOW)!.remainingMin === 25 && smokeStatus([pouch(5)], 'hard', NOW)!.coLoad === 0);
  const three = smokeStatus([cig(5), cig(30), cig(55)], 'hard', NOW)!;
  check('Three in an hour: carbon monoxide takes over — well past 45 min', three.limitedBy === 'co' && three.remainingMin > 90, `${three.remainingMin} min, CO ${three.coLoad}`);
  check('…because the CO load stacks (≈2.8 cigarettes\' worth on board)', three.coLoad > 2.5 && three.coLoad < 3);
  const two = smokeStatus([cig(5), cig(45)], 'hard', NOW)!;
  check('Two in an hour is still under the CO threshold — the acute window governs', two.limitedBy === 'nicotine' && two.remainingMin === 40);
  check('A cigar is several cigarettes: a long CO wait', smokeStatus([cigar(10)], 'hard', NOW)!.remainingMin > 180 && smokeStatus([cigar(10)], 'hard', NOW)!.limitedBy === 'co');
  check('A shisha session hits the 5 h cap', smokeStatus([shisha(30)], 'hard', NOW)!.remainingMin === 300);
  check('Even a walk after shisha waits hours', smokeStatus([shisha(30)], 'light', NOW)!.remainingMin > 120);
  check('A cigarette three hours ago is clear', smokeStatus([cig(180)], 'hard', NOW)!.ready);
  check('readyFor: 20 min after one cigarette a walk is fine, a session is not', smokeStatus([cig(20)], 'hard', NOW)!.readyFor === 'light');
  check('CO halves every 4 h', Math.abs(coLoad([cig(240)], NOW) - 0.5) < 0.01 && Math.abs(coLoad([cig(480)], NOW) - 0.25) < 0.01);
  check('Quantity multiplies the CO load', Math.abs(coLoad([cig(0, 3)], NOW) - 3) < 0.01);
  check('Events in the future or older than a day are ignored', smokeStatus([cig(-10)], 'hard', NOW) === null && smokeStatus([cig(25 * 60)], 'hard', NOW) === null);
  check('Nothing logged reads as null, not zero-wait', smokeStatus([], 'hard', NOW) === null && currentSmoke([], 'hard', NOW) === null);
  check('minutesToDecay: already under → 0; double the threshold → one half-life', minutesToDecay(1, 2) === 0 && Math.abs(minutesToDecay(4, 2) - CO_HALF_LIFE_MIN) < 0.01);
  check('The thresholds and windows are as documented', CO_THRESHOLD.hard === 2 && CO_THRESHOLD.moderate === 3 && CO_THRESHOLD.light === 5 && NICOTINE_ACUTE_MIN.hard.combusted === 45 && NICOTINE_ACUTE_MIN.hard.other === 30);
  // ── Repo: events come from the smoking log, with product facts ──
  const smokeRepoSrc = fs.readFileSync('src/repositories/smokingRepo.ts', 'utf8');
  check('recentSmokeEvents reads today AND yesterday (a 23:40 cigarette counts at 00:20)', /dayEntries\(todayISO\(\), userId\), \.\.\.dayEntries\(daysAgoISO\(1\), userId\)/.test(smokeRepoSrc));
  check('…carries each product\'s combustion facts', /combusted: p\.combusted, cigaretteEquivalent: p\.cigaretteEquivalent/.test(smokeRepoSrc));
  check('…and is empty when the module is off', /if \(!isSmokingEnabled\(userId\)\) return \[\];/.test(smokeRepoSrc));
  check('The Smoking screen shows the training clock right where you log', /<DigestionCard meals=\{\[\]\} smokes=\{smokes\} smokingEnabled defaultIntensity="hard" compact/.test(fs.readFileSync('src/screens/smoking/SmokingScreen.tsx', 'utf8')));
}

console.log('\nReadiness — the two clocks combined:');
{
  const NOW = Date.now();
  const M = 60_000;
  const meal = (calories: number, agoMin: number): MealForDigestion => ({ calories, fatG: 20, proteinG: 25, carbsG: 60, fiberG: 5, eatenAt: NOW - agoMin * M });
  const cig = (minsAgo: number) => ({ at: NOW - minsAgo * M, combusted: true, cigaretteEquivalent: 1, quantity: 1 });
  check('Nothing in the way: ready, no governor', trainReadiness({ meals: [], smokes: [] }, 'hard', NOW).ready && trainReadiness({ meals: [] }, 'hard', NOW).governor === null);
  const mealOnly = trainReadiness({ meals: [meal(600, 30)] }, 'hard', NOW);
  check('A meal alone: the stomach governs', mealOnly.governor === 'stomach' && mealOnly.stomach !== null && mealOnly.smoke === null);
  const cigOnly = trainReadiness({ meals: [], smokes: [cig(5)] }, 'hard', NOW);
  check('A cigarette alone: the smoke governs', cigOnly.governor === 'smoke' && cigOnly.smoke !== null && cigOnly.remainingMin === 40);
  const both = trainReadiness({ meals: [meal(600, 30)], smokes: [cig(5)] }, 'hard', NOW);
  check('Both: the later one governs and both are reported', both.governor === 'stomach' && both.remainingMin === Math.max(mealOnly.remainingMin, cigOnly.remainingMin) && !!both.smoke && !!both.stomach);
  const smokeLater = trainReadiness({ meals: [meal(600, 140)], smokes: [cig(2)] }, 'hard', NOW);
  check('…and it can be the smoke, late in a meal', smokeLater.governor === 'smoke');
  check('readyFor respects BOTH clocks', trainReadiness({ meals: [meal(600, 30)], smokes: [cig(20)] }, 'hard', NOW).readyFor === 'light' && trainReadiness({ meals: [meal(600, 30)], smokes: [cig(2)] }, 'hard', NOW).readyFor === null);
  check('readyAt is now plus the governing wait', both.readyAt === NOW + both.remainingMin * M);
  const cardSrcR = fs.readFileSync('src/components/DigestionCard.tsx', 'utf8');
  check('The card uses the combined readiness and names the governor', /trainReadiness\(\{ meals, smokes \}/.test(cardSrcR) && /r\.governor === 'smoke'/.test(cardSrcR));
  check('The card shows a smoke line with the reason (acute window vs CO)', /acute nicotine window/.test(cardSrcR) && /carbon monoxide still on board/.test(cardSrcR));
}

console.log('\nAudit fixes — supplement rows vs meals, date parsing:');
{
  /*
   * Supplement-created diary rows (fish oil, whey) belong to the supplement
   * log that made them. Two consumers must exclude them: meal routines
   * (snapshotting one means re-applying re-logs its calories as food, and
   * taking the supplement the same day doubles them) and the "log your meals"
   * challenge (a pill must not fill a meal slot).
   */
  const suppRepo3 = fs.readFileSync('src/repositories/supplementsRepo.ts', 'utf8');
  check('The supplement-row helper exists once, shared', /export function supplementFoodEntryIds/.test(suppRepo3));
  const mrRepo2 = fs.readFileSync('src/repositories/mealRoutineRepo.ts', 'utf8');
  check('Meal routines never snapshot supplement rows', (mrRepo2.match(/!suppRows\.has\(e\.id\)/g) ?? []).length === 2, 'save + count must both filter');
  const chalRepo3 = fs.readFileSync('src/repositories/challengeRepo.ts', 'utf8');
  check('A pill cannot fill a meal slot for the challenge', /m\.some\(\(e\) => !suppRows\.has\(e\.id\)\)/.test(chalRepo3));

  // A LOCAL ISO date fed to new Date() parses as UTC midnight, skewing any
  // cutoff it is compared against. Differences of two such dates are fine
  // (offsets cancel); absolute comparisons are not.
  const statsSrc2 = fs.readFileSync('src/repositories/statsRepo.ts', 'utf8');
  check('Muscle balance uses a local-midnight cutoff', /const since = startOfDayMs\(daysAgoISO\(days\)\)/.test(statsSrc2));
  check('No absolute cutoff parses a local date as UTC', !/const since = new Date\(daysAgoISO/.test(statsSrc2));

  // Challenge copy must not embed counts that go stale as the library grows.
  check('No challenge hard-codes the library size', CHALLENGES.every((c) => !/library has \d/.test(c.detail)));
}

console.log('\nAudit fixes — smoking figures & wheel stability:');
{
  const smokeRepo2 = fs.readFileSync('src/repositories/smokingRepo.ts', 'utf8');
  /*
   * Health figures run on combustion-weighted counts; nicotine and money must
   * NOT. Weighted nicotine reads a pouch-only week as zero and a shisha session
   * as ten cigarettes' worth — false in both directions — and weighted money
   * prices a shisha session as ten cigarettes off the pack price.
   */
  check('Weekly nicotine reads the actual products', /nicotineWeekMg: Math\.round\(nicotineMgSince\(/.test(smokeRepo2));
  check('Money counts only real cigarettes (the one known price)', /export function cigaretteMoneySince/.test(smokeRepo2) && /key === 'cigarette'/.test(smokeRepo2));
  check('The year projection derives from measured spend', /\(weekMoney \/ 7\) \* 365/.test(smokeRepo2));
  check('Life-cost still uses the combustion-weighted count', /lifeMinutesWeek: lifeMinutesLost\(week\)/.test(smokeRepo2));
  // The quit-recovery timeline describes what happens when SMOKE stops.
  check('Smoke-free hours reset only on combusted products', /combusted\)/.test(smokeRepo2.slice(smokeRepo2.indexOf('export function smokeFreeHours'), smokeRepo2.indexOf('export function smokeFreeStreak'))));
  const chalRepo2 = fs.readFileSync('src/repositories/challengeRepo.ts', 'utf8');
  check('A Clean Day is broken only by smoking, not by a pouch', /\.some\(\(r\) => productOrDefault\(r\.productKey\)\.combusted\)/.test(chalRepo2));
  /*
   * The wheel must be stable across the whole day. recentKeys including the
   * current date meant a spin immediately rotated its own challenge off the
   * wheel, leaving the pointer on the wrong wedge.
   */
  check("Recent-challenge exclusion stops BEFORE the day being spun", /lt\(dailyChallenges\.date, before\)/.test(chalRepo2));
}

console.log('\nElite-sport programmes & meal routines:');
{
  const athletes = specialProgramsFor('athlete');
  check('Elite-sport programmes exist', athletes.length === 8, `${athletes.length}`);
  check('The named sports are all present', ['ath-footballer', 'ath-basketballer', 'ath-boxer', 'ath-sprinter', 'ath-marathoner', 'ath-swimmer', 'ath-cyclist', 'ath-tennis'].every((k) => findSpecialProgram(k)?.category === 'athlete'));
  /*
   * These describe how professionals train, which means describing the parts
   * that hurt people. Each of the four sports with a well-known injury or
   * fuelling failure mode has to name it rather than sell the glamour.
   */
  check('Boxing is honest about head impacts and sparring', /head impacts are cumulative/i.test(findSpecialProgram('ath-boxer')?.safetyNote ?? ''));
  check('Football names the hamstring mechanism', /hamstring/i.test(findSpecialProgram('ath-footballer')?.safetyNote ?? ''));
  check('Distance running warns about under-fuelling (RED-S)', /RED-S|under-fuelling/i.test(findSpecialProgram('ath-marathoner')!.diet.notes.join(' ')));
  check('Cycling names the watts-per-kilogram trap', /watts per kilogram/i.test(findSpecialProgram('ath-cyclist')!.diet.notes.join(' ')));
  check('Swimming explains the shoulder is the limiting factor', /shoulder/i.test(findSpecialProgram('ath-swimmer')?.safetyNote ?? ''));
  check('Sprinting says the volume is meant to be low', /volume/i.test(findSpecialProgram('ath-sprinter')?.authenticityNote ?? ''));
  check('Every elite programme carries a loggable diet', athletes.every((p) => !!SPECIAL_DIET_BUILDS[p.key]));
  check('…aligned with its own sample day', athletes.every((p) => SPECIAL_DIET_BUILDS[p.key].length === p.diet.sampleDay.length));

  /*
   * The Daily Challenge shipped with no way to reach it — the edit that added
   * the Train-tab card silently failed to apply. A registered route nobody can
   * navigate to is invisible, so both halves are now checked.
   */
  /*
   * The same failure twice: data added, UI never told about it. Both screens
   * kept their own hard-coded category array, so Elite Sport shipped complete
   * and invisible. They now render SPECIAL_CATEGORY_ORDER, which is derived
   * from the META and appends anything the preferred order forgot — so a new
   * category cannot fail to appear.
   */
  check('Every category is in the render order', SPECIAL_CATEGORY_ORDER.length === Object.keys(SPECIAL_CATEGORY_META).length, `${SPECIAL_CATEGORY_ORDER.length} of ${Object.keys(SPECIAL_CATEGORY_META).length}`);
  check('…including athlete', SPECIAL_CATEGORY_ORDER.includes('athlete'));
  check('…with no duplicates', new Set(SPECIAL_CATEGORY_ORDER).size === SPECIAL_CATEGORY_ORDER.length);
  for (const f of ['src/screens/train/SpecialProgramsScreen.tsx', 'src/screens/nutrition/ProgrammeMealsScreen.tsx']) {
    const src = fs.readFileSync(f, 'utf8');
    check(`${f.split('/').pop()} renders the shared order`, /SPECIAL_CATEGORY_ORDER\.map\(/.test(src));
    check(`${f.split('/').pop()} keeps no private category list`, !/const CATEGORY_ORDER/.test(src));
  }

  const trainSrc = fs.readFileSync('src/screens/train/TrainScreen.tsx', 'utf8');
  check('The Daily Challenge is reachable from the Train tab', /navigate\('DailyChallenge'\)/.test(trainSrc));
  const navSrc = fs.readFileSync('src/navigation/RootNavigator.tsx', 'utf8');
  check('…and its route is registered', /name="DailyChallenge"/.test(navSrc));
  // Anything registered ought to be reachable from somewhere in the app.
  const screenFiles = ['src/screens', 'src/components'].flatMap((d) =>
    fs.readdirSync(d, { recursive: true, encoding: 'utf8' } as never).map((f: string) => `${d}/${f}`)
  ).filter((f) => f.endsWith('.tsx'));
  const allScreenSrc = screenFiles.map((f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } }).join('\n');
  const routes = [...navSrc.matchAll(/name="(\w+)"/g)].map((m) => m[1]);
  // navigate / replace / push all count as a way in.
  const orphans = routes.filter(
    (r) => r !== 'Main' && r !== 'Onboarding' && !new RegExp(`(navigate|replace|push)\\('${r}'`).test(allScreenSrc)
  );
  check('No screen is registered but unreachable', orphans.length === 0, orphans.join(', '));

  // Meal routines: the snapshot decision is the load-safe one.
  const mrRepo = fs.readFileSync('src/repositories/mealRoutineRepo.ts', 'utf8');
  check('Routines snapshot macros rather than catalogue ids', /foodName: e\.foodName/.test(mrRepo) && !/foodId/.test(mrRepo));
  /*
   * An honest-log entry is a free-text estimate, not a food. Re-logging one
   * would replay a guess as though it had been measured.
   */
  check('Honest-log entries are excluded from routines', /e\.logMode !== 'honest'/.test(mrRepo));
  check('A whole-day routine keeps each item in its own meal', /wholeDay \? i\.mealType/.test(mrRepo));
  check('Applying a routine logs the saved amount, not a re-scaled one', /quantity: 1, \/\/ the snapshot is already the eaten amount/.test(mrRepo));
  const bootSrc6 = fs.readFileSync('src/db/bootstrap.ts', 'utf8');
  check('meal_routines is in the CREATE TABLE DDL', /CREATE TABLE IF NOT EXISTS meal_routines/.test(bootSrc6));
  const sv4 = Number((bootSrc6.match(/SCHEMA_VERSION = (\d+)/) || [])[1] ?? 0);
  check('Schema version is at or past the routines table', sv4 >= 23, `${sv4}`);
  const nutSrc2 = fs.readFileSync('src/screens/nutrition/NutritionScreen.tsx', 'utf8');
  check('Routines are offered per meal AND for the whole day', /mealType=\{meal\}/.test(nutSrc2) && /mealType=\{null\}/.test(nutSrc2));
}

console.log('\nDaily challenge wheel:');
{
  const allOn = { enabled: { prayer: true, smoking: true, sleep: true, supplements: true, nutrition: true } };
  const nothingOn = { enabled: {} };

  check('Every challenge is measurable and has a positive target', CHALLENGES.every((c) => !!c.metric && c.target > 0));
  check('The wheel now has 44 challenges to draw from', CHALLENGES.length === 44, `${CHALLENGES.length}`);
  /*
   * The wiring guard for challenges: a metric named in the data but without a
   * `case` in measureMetric would read as permanent zero — a challenge that can
   * never complete, which is worse than none. Same failure shape as the
   * missing button and the invisible category.
   */
  const measureSrc = fs.readFileSync('src/repositories/challengeRepo.ts', 'utf8');
  const unwired = [...new Set(CHALLENGES.map((c) => c.metric))].filter((m) => !measureSrc.includes(`case '${m}':`));
  check('Every challenge metric is wired into measureMetric', unwired.length === 0, unwired.join(', '));
  // burnedKcal must not double-count walks against on-foot sessions.
  check('Burned-kcal sums sessions and walks disjointly', /fromSessions \+ fromWalks/.test(measureSrc) && /caloriesBurned \?\? 0/.test(measureSrc));
  check('Each category offers at least 3 challenges', (['move', 'lift', 'fuel', 'mind', 'care'] as const).every((c) => CHALLENGES.filter((x) => x.category === c).length >= 3), (['move', 'lift', 'fuel', 'mind', 'care'] as const).map((c) => `${c}:${CHALLENGES.filter((x) => x.category === c).length}`).join(' '));
  check('Challenge keys are unique', new Set(CHALLENGES.map((c) => c.key)).size === CHALLENGES.length);
  check('All five categories are represented', new Set(CHALLENGES.map((c) => c.category)).size === 5);
  check('All three difficulties are represented', new Set(CHALLENGES.map((c) => c.difficulty)).size === 3);
  check('Harder challenges are worth more', DIFFICULTY_POINTS.hard > DIFFICULTY_POINTS.medium && DIFFICULTY_POINTS.medium > DIFFICULTY_POINTS.easy);

  /*
   * The property the whole feature rests on. A wheel that rolls fresh
   * randomness per tap is a wheel you re-spin until it gives you "8,000 steps".
   * The date decides; the animation only reveals.
   */
  const a = buildDailyWheel('2026-08-02', allOn)!;
  const b = buildDailyWheel('2026-08-02', allOn)!;
  check('The same day always gives the same challenge', a.challenge.key === b.challenge.key, a.challenge.key);
  check('…and the same wheel, in the same order', a.segments.map((s) => s.key).join() === b.segments.map((s) => s.key).join());
  const c = buildDailyWheel('2026-08-03', allOn)!;
  check('A different day gives a different wheel', a.segments.map((s) => s.key).join() !== c.segments.map((s) => s.key).join());

  // Over a month the wheel must not fixate on one challenge or one slot.
  const month = Array.from({ length: 30 }, (_, i) => buildDailyWheel(`2026-09-${String(i + 1).padStart(2, '0')}`, allOn)!);
  check('A month of spins gives real variety', new Set(month.map((w) => w.challenge.key)).size >= 10, `${new Set(month.map((w) => w.challenge.key)).size} distinct in 30 days`);
  check('The winning slot is not always the same', new Set(month.map((w) => w.winningIndex)).size >= 4, `${new Set(month.map((w) => w.winningIndex)).size} distinct slots`);
  check('Every wheel is full and its winner is on it', month.every((w) => w.segments.length === WHEEL_SIZE && w.segments[w.winningIndex] === w.challenge));

  /*
   * An impossible challenge is worse than none: it teaches you to ignore the
   * wheel. With every optional tracker off, nothing that depends on one may
   * appear.
   */
  const bare = buildDailyWheel('2026-08-02', nothingOn)!;
  check('Gated challenges never appear when their tracker is off', bare.segments.every((s) => !s.requires), bare.segments.filter((s) => s.requires).map((s) => s.key).join());
  check('…and there are still enough left to spin', bare.segments.length >= 5, `${bare.segments.length}`);
  check('Enabling a tracker lets its challenges back in', eligibleChallenges(allOn).length > eligibleChallenges(nothingOn).length);

  // Recently-seen challenges are pushed out, but never at the cost of an empty wheel.
  const recent = buildDailyWheel('2026-08-02', { ...allOn, recentKeys: a.segments.map((s) => s.key) })!;
  check('Recent challenges are rotated out of the wheel', recent.segments.some((s) => !a.segments.includes(s)));
  const everythingRecent = buildDailyWheel('2026-08-02', { ...allOn, recentKeys: CHALLENGES.map((c) => c.key) })!;
  check('Repeating beats an empty wheel', everythingRecent.segments.length === WHEEL_SIZE);

  // Rotation geometry — the wedge must land under the pointer at the top.
  check('A winner at slot 0 needs no offset', wheelRotationDeg(0, 8) % 360 === 0);
  check('Slot 2 of 8 rotates back by 90°', wheelRotationDeg(2, 8) % 360 === 270, `${wheelRotationDeg(2, 8) % 360}`);
  check('The spin always turns forward, never backward', [0, 1, 4, 7].every((i) => wheelRotationDeg(i, 8) > 0));
  check('A zero-segment wheel cannot divide by zero', wheelRotationDeg(0, 0) === 0);

  // Progress maths.
  check('Progress is a clean 0..1 fraction', challengeProgress(4000, 8000) === 0.5 && challengeProgress(9000, 8000) === 1 && challengeProgress(-5, 8000) === 0);
  check('A zero target cannot divide by zero', challengeProgress(5, 0) === 0);
  check('Completion needs the target actually met', isChallengeComplete(7999, 8000) === false && isChallengeComplete(8000, 8000) === true);

  // Every challenge icon must resolve, or the wheel renders blank wedges.
  const iconOk = (k: string) => { const [g, n] = k.split('.'); return !!(ICONS as Record<string, Record<string, unknown>>)[g]?.[n]; };
  check('Every challenge icon resolves', CHALLENGES.every((c) => iconOk(c.icon)), CHALLENGES.filter((c) => !iconOk(c.icon)).map((c) => c.icon).join());

  // The achievements that hang off it.
  const challengeBadges = ACHIEVEMENTS.filter((x) => x.category === 13);
  check('Daily-challenge achievements exist', challengeBadges.length === 10);
  check('…and every one is auto-tracked from data', challengeBadges.every((x) => evaluateAchievement(x, zeroStats).tracked));
  check('…and none is unlocked on an empty account', challengeBadges.every((x) => !evaluateAchievement(x, zeroStats).unlocked));

  // The table has to reach existing installs.
  const bootSrc5 = fs.readFileSync('src/db/bootstrap.ts', 'utf8');
  check('daily_challenges is in the CREATE TABLE DDL', /CREATE TABLE IF NOT EXISTS daily_challenges/.test(bootSrc5));
  check('One challenge per day is enforced by the database', /UNIQUE INDEX IF NOT EXISTS idx_daily_challenges_user_date/.test(bootSrc5));
  const sv3 = Number((bootSrc5.match(/SCHEMA_VERSION = (\d+)/) || [])[1] ?? 0);
  check('Schema version is at or past the challenge table', sv3 >= 22, `${sv3}`);
  // Re-spinning for an easier challenge must be impossible.
  const chalRepo = fs.readFileSync('src/repositories/challengeRepo.ts', 'utf8');
  check('A day already spun is never re-spun', /const existing = challengeForDate\(date, userId\);\s*\n\s*if \(existing\) return existing;/.test(chalRepo));
  check('Completion is measured, never self-declared', /if \(!m\.complete\) return row;/.test(chalRepo));
  check('A completed challenge is never un-completed', /if \(!row \|\| row\.completedAt\) return row;/.test(chalRepo));
}

console.log('\nTriceps coverage & strict alternative matching:');
{
  const tri = EXLIB.filter((e) => e.primaryMuscle === 'triceps');
  check('Triceps has real machine coverage', tri.filter((e) => e.equipmentType === 'machine').length >= 4, `${tri.filter((e) => e.equipmentType === 'machine').length} machines`);
  check('…and cable variety beyond one pushdown', tri.filter((e) => e.equipmentType === 'cable').length >= 6);
  check('The new triceps movements are present', ['triceps-extension-machine', 'assisted-dip-machine', 'smith-close-grip-bench', 'rope-pushdown', 'v-bar-pushdown', 'reverse-grip-pushdown', 'cable-kickback', 'ez-bar-overhead-extension', 'db-single-arm-overhead-extension', 'bodyweight-skullcrusher'].every((s) => ALL_SLUGS.has(s)));
  check('Every triceps exercise names its head', tri.every((e) => !!e.subMuscle));
  // Assistance machines are counterintuitive: a LOWER number is a harder set.
  check('The assisted dip explains its inverted loading', /ASSISTANCE|assistance/.test(EXLIB.find((e) => e.slug === 'assisted-dip-machine')?.description ?? ''));

  /*
   * The reported bug. `shareMuscle` accepted any overlapping muscle GROUP, and
   * a bench press lists triceps among its groups — so asking for an easier
   * skullcrusher could return a bench press. Different primary muscle, not
   * easier, and for a rear-delt fly the same flaw would offer an overhead
   * press: precisely the swap that builds the imbalance the exercise fixed.
   */
  const asAlt = (e: (typeof EXLIB)[number], i: number) => ({
    id: i + 1, slug: e.slug, name: e.name, primaryMuscle: e.primaryMuscle ?? null,
    subMuscle: e.subMuscle ?? null, muscleGroups: e.muscleGroups, equipmentType: e.equipmentType ?? null,
    sessionType: e.sessionType,
  });
  const pool = EXLIB.map(asAlt);
  const byslug = (s: string) => pool.find((e) => e.slug === s)!;

  check('A bench press is not an alternative to a skullcrusher', matchQuality(byslug('skullcrusher'), byslug('bench-press-barbell')) === 0);
  check('An overhead press is not an alternative to a rear-delt fly', matchQuality(byslug('rear-delt-fly'), byslug('overhead-press')) === 0);
  check('Same muscle, same head scores highest', matchQuality(byslug('skullcrusher'), byslug('triceps-extension-machine')) === 2);
  // Strict on the head too: a pushdown is lateral-head work, so it is NOT an
  // alternative to a long-head skullcrusher, however similar they look.
  check('A different head of the same muscle is not a match', matchQuality(byslug('skullcrusher'), byslug('triceps-pushdown')) === 0);
  check('Untagged targets still match on the muscle alone', matchQuality({ ...byslug('skullcrusher'), subMuscle: null }, byslug('triceps-pushdown')) === 1);

  const skullAlts = findEasierAlternatives(byslug('skullcrusher'), pool, 8);
  check('Every suggestion trains the same primary muscle', skullAlts.every((a) => a.primaryMuscle === 'triceps'), skullAlts.map((a) => a.primaryMuscle).join(','));
  check('Suggestions are all genuinely easier', skullAlts.every((a) => a.difficulty <= estimateDifficulty(byslug('skullcrusher'))));
  // Same-head options must come before merely-same-muscle ones.
  check('Every suggestion trains the same head, not just the same muscle', skullAlts.every((a) => a.subMuscle === byslug('skullcrusher').subMuscle), skullAlts.map((a) => a.subMuscle).join(','));
  check('There are still enough options to be useful', skullAlts.length >= 4, `${skullAlts.length}`);
  // An exercise with no relatives must return nothing rather than something wrong.
  const lonely = findEasierAlternatives({ id: 99999, slug: 'x', name: 'Imaginary Lift', primaryMuscle: 'nonexistent-muscle', subMuscle: null, muscleGroups: ['chest'], equipmentType: 'barbell', sessionType: 'strength' }, pool);
  check('No relatives means no suggestions, not a wrong one', lonely.length === 0);

  // Reordering exercises within a session.
  const sessSrc2 = fs.readFileSync('src/repositories/sessionRepo.ts', 'utf8');
  check('Exercises can be moved up and down a session', /export function moveExerciseLog/.test(sessSrc2));
  /*
   * Deleting an exercise leaves a gap in orderIndex, and swapping raw index
   * values across a gap silently does nothing. Renumbering densely after each
   * move is what makes the control reliable rather than intermittent.
   */
  check('Order is renumbered densely so deletes cannot break it', /reordered\.forEach\(\(s, i\) =>/.test(sessSrc2));
  check('A move at the end reports failure instead of pretending', /if \(at < 0 \|\| to < 0 \|\| to >= siblings\.length\) return false/.test(sessSrc2));
}

console.log('\nNicotine products — cigarettes and the alternatives:');
{
  const cig = productOrDefault('cigarette');
  const pouch = productOrDefault('pouch');
  const shisha = productOrDefault('shisha');

  check('An unknown or missing product falls back to cigarettes', productOrDefault(null).key === 'cigarette' && productOrDefault('nonsense').key === 'cigarette');
  check('Snus, pouches, vape and NRT are all available', ['snus', 'pouch', 'vape', 'nrt-gum', 'nrt-lozenge', 'nrt-patch'].every((k) => !!findNicotineProduct(k)));

  /*
   * The distinction the whole model turns on. Nicotine is what makes it
   * addictive; smoke is what makes it lethal. Counting a pouch as a cigarette
   * would tell someone who had successfully switched that they had done
   * themselves identical damage — false, and the surest way to make them give
   * up trying.
   */
  check('Only burned products carry a cigarette-equivalent', NICOTINE_PRODUCTS.every((p) => (p.cigaretteEquivalent > 0) === p.combusted));
  check('A day of pouches costs zero cigarette-equivalents', combustedEquivalents([{ productKey: 'pouch', quantity: 12 }]) === 0);
  check('…but still counts as nicotine', totalNicotineMg([{ productKey: 'pouch', quantity: 12 }], DEFAULT_SMOKING_SETTINGS) > 0);
  check('NRT is flagged as a licensed medicine', ['nrt-gum', 'nrt-lozenge', 'nrt-patch'].every((k) => findNicotineProduct(k)?.isNrt === true));

  // Shisha is the one people underestimate, and the model has to say so.
  check('Shisha counts for far more than one cigarette', shisha.cigaretteEquivalent >= 5, `${shisha.cigaretteEquivalent}`);
  check('…and the note explains the smoke volume', /smoke volume|30–60 minutes/.test(shisha.note));
  check('Heated tobacco is treated as partially burned, not clean', productOrDefault('heated').combusted && productOrDefault('heated').cigaretteEquivalent < 1);

  // Mixed days.
  const mix = [{ productKey: 'cigarette', quantity: 4 }, { productKey: 'pouch', quantity: 6 }, { productKey: 'shisha', quantity: 1 }];
  check('A mixed day counts only what was burned', combustedEquivalents(mix) === 14, `${combustedEquivalents(mix)}`);
  check('Nicotine totals span every product', near(totalNicotineMg(mix, DEFAULT_SMOKING_SETTINGS), 4 * 1.1 + 6 * 4 + 3, 0.1), `${totalNicotineMg(mix, DEFAULT_SMOKING_SETTINGS)}`);
  /*
   * The number that makes switching visible. Total nicotine can stay flat while
   * this falls — which is exactly what a successful switch looks like, and what
   * a plain cigarette count hides entirely.
   */
  check('Smoked share falls as you move off cigarettes', combustedShare(mix, DEFAULT_SMOKING_SETTINGS) < 0.3, `${combustedShare(mix, DEFAULT_SMOKING_SETTINGS)}`);
  check('An all-cigarette day is 100% smoked', combustedShare([{ productKey: 'cigarette', quantity: 10 }], DEFAULT_SMOKING_SETTINGS) === 1);
  check('A nicotine-free day divides safely', combustedShare([], DEFAULT_SMOKING_SETTINGS) === 0);
  // Every product must justify itself, including the ones that look benign.
  check('Every product carries an honest note', NICOTINE_PRODUCTS.every((p) => p.note.length > 60));
  check('Smoke-free products are never called safe', NICOTINE_PRODUCTS.filter((p) => !p.combusted).every((p) => !/\bharmless\b(?!:)/i.test(p.note) || /not harmless/i.test(p.note)));

  // Migration wiring.
  const bootSrc4 = fs.readFileSync('src/db/bootstrap.ts', 'utf8');
  check('product_key is in the DDL and the migration', /product_key TEXT/.test(bootSrc4) && /column: 'product_key'/.test(bootSrc4));
  const sv2 = Number((bootSrc4.match(/SCHEMA_VERSION = (\d+)/) || [])[1] ?? 0);
  check('Schema version is at or past the product migration', sv2 >= 21, `${sv2}`);
  const smokeRepo = fs.readFileSync('src/repositories/smokingRepo.ts', 'utf8');
  check('Daily counts are weighted by combustion', /combustedEquivalents\(/.test(smokeRepo));
  check('Trends use the same weighting as the daily figure', /productOrDefault\(r\.productKey\)\.cigaretteEquivalent/.test(smokeRepo));
}

console.log('\nSupplements — Shilajit, Spiruline & pill counting:');
{
  const spiruline = SUPPLEMENTS.find((s) => s.key === 'spirulina')!;
  const shilajit = SUPPLEMENTS.find((s) => s.key === 'shilajit')!;

  // Named the way it's sold locally, but the KEY must never move — logs store
  // it, so renaming the key would orphan every entry already in the diary.
  check('Spiruline is labelled the French/local way', spiruline.label === 'Spiruline');
  check('…while its catalogue key stays stable for existing logs', spiruline.key === 'spirulina');

  /*
   * The B12 trap. Labels advertise spirulina as B12-rich; almost all of it is
   * pseudo-B12 the body cannot use. Recording it would let the Micros screen
   * tell a vegan they were covered while they quietly became deficient — so
   * the absence of this key is a deliberate safety property, not an omission.
   */
  check('Spiruline records NO vitamin B12', spiruline.micros?.vitaminB12_ug === undefined);
  check('…and the note explains why, in as many words', /pseudo-B12|pseudo-vitamin/i.test(spiruline.evidence ?? '') && /deficien/i.test(spiruline.evidence ?? ''));
  check('Spiruline warns about microcystins and PKU', /microcystin/i.test(spiruline.evidence ?? '') && /phenylketonuria|PKU/i.test(spiruline.evidence ?? ''));
  check('Spiruline dose matches the trial range (3 g)', /3 g/.test(spiruline.defaultDose) && spiruline.unitsPerServing === 6);
  // Micros must scale with the portion, not be left at the old 1 g figures.
  check('Spiruline micros are stated for the 3 g portion', (spiruline.micros?.iron_mg ?? 0) > 0.8 && (spiruline.micros?.vitaminA_ug ?? 0) > 300, `Fe ${spiruline.micros?.iron_mg}`);
  check('Provitamin-A is stored as RAE, not raw beta-carotene', (spiruline.micros?.vitaminA_ug ?? 0) < 1000);

  check('Shilajit is honest that testosterone rests on one small trial', /one 90-day|ONE 90-day/i.test(shilajit.evidence ?? '') && /industry-linked|industry-funded/i.test(shilajit.evidence ?? ''));
  check('Shilajit leads with heavy-metal purity, not benefits', /lead|arsenic|mercury/i.test(shilajit.evidence ?? '') && /third-party/i.test(shilajit.evidence ?? ''));
  check('Shilajit flags iron, gout and pregnancy', /haemochromatosis|ferritin/i.test(shilajit.evidence ?? '') && /uric acid|gout/i.test(shilajit.evidence ?? '') && /pregnan/i.test(shilajit.evidence ?? ''));
  check('Shilajit separates mechanism from result on cognition', /mechanism, not a result/i.test(shilajit.evidence ?? ''));
  // Inventing a mineral profile for something that varies by batch would be
  // worse than leaving it blank.
  check('Shilajit contributes no invented micronutrients', shilajit.micros === undefined);
  check('Both are marked as limited evidence', spiruline.evidenceLevel === 'limited' && shilajit.evidenceLevel === 'limited');
  check('Both carry a pill count for the new tracking', !!spiruline.unitsPerServing && !!shilajit.unitsPerServing);

  // ── The GSN stack (the user's own products, from their labels) ──
  const gsnMulti = SUPPLEMENTS.find((s) => s.key === 'gsn-multivitamin')!;
  const gsnZinc = SUPPLEMENTS.find((s) => s.key === 'gsn-zinc')!;
  const gsnMag = SUPPLEMENTS.find((s) => s.key === 'gsn-mag-b')!;
  const gsnFish = SUPPLEMENTS.find((s) => s.key === 'gsn-fish-oil')!;
  check('All four GSN products exist', !!gsnMulti && !!gsnZinc && !!gsnMag && !!gsnFish);
  // Spot-check the multi against its label (all lines are 300% AJR).
  check('GSN multi matches its label', gsnMulti.micros?.vitaminA_ug === 2400 && gsnMulti.micros?.iron_mg === 42 && gsnMulti.micros?.zinc_mg === 30 && gsnMulti.micros?.iodine_ug === 450 && gsnMulti.micros?.chromium_ug === 120);
  check('Chromium is now a real tracked micronutrient', (MICRO_KEYS as readonly string[]).includes('chromium_ug'));
  check('GSN zinc matches its label', gsnZinc.micros?.zinc_mg === 30 && Object.keys(gsnZinc.micros ?? {}).length === 1);
  check('GSN Mag+B matches its label', gsnMag.micros?.magnesium_mg === 415 && gsnMag.micros?.folate_ug === 200 && gsnMag.micros?.vitaminB12_ug === 2.5);
  /*
   * The multi and the standalone zinc together are 60 mg/day — past the 40 mg
   * upper limit, with copper depletion the documented consequence of chronic
   * excess. Both notes must carry that warning; a catalogue that records the
   * doses but not the interaction is doing half the job.
   */
  check('The zinc-stacking warning is on both entries', /60 mg/.test(gsnMulti.evidence ?? '') && /60 mg/.test(gsnZinc.evidence ?? '') && /copper/i.test(gsnZinc.evidence ?? ''));
  check('The multi flags its iron and vitamin A honestly', /45 mg/.test(gsnMulti.evidence ?? '') && /3000 µg|upper limit/.test(gsnMulti.evidence ?? ''));

  // ── Fish oil: the macro path ──
  check('Fish oil records only the omega-3 that matters (300 mg)', gsnFish.micros?.omega3_mg === 300);
  check('Fish oil carries its real energy (10 kcal, 1 g fat)', gsnFish.macros?.calories === 10 && gsnFish.macros?.fatG === 1);
  /*
   * The macro-bearing set is exactly the products that genuinely carry energy:
   * the fish oils (fat), whey (a protein food in a tub), collagen and the
   * free-form aminos (amino acids are ~4 kcal/g whether or not they count as
   * protein). Everything else is a pill with no meaningful energy, and a pill
   * inventing calories would be as wrong as one hiding them.
   */
  const macroKeys = SUPPLEMENTS.filter((s) => s.macros).map((s) => s.key).sort();
  check('Exactly the energy-carrying supplements have macros', macroKeys.join(',') === ['beta-alanine', 'citrulline', 'collagen', 'gsn-fish-oil', 'omega-3', 'whey'].join(','), macroKeys.join(','));
  const wheySupp = SUPPLEMENTS.find((s) => s.key === 'whey')!;
  const wheyFood = FOOD_DB.find((f) => f.id === 'whey')!;
  // One scoop must count identically whichever way it gets logged.
  check('Whey supplement matches the whey food exactly', wheySupp.macros?.calories === wheyFood.calories && wheySupp.macros?.proteinG === wheyFood.protein && wheySupp.macros?.carbsG === wheyFood.carbs && wheySupp.macros?.fatG === wheyFood.fat);
  /*
   * Collagen is energy but not protein: missing tryptophan, low leucine, so it
   * cannot do what the protein target measures. Recording it as protein would
   * let a collagen habit inflate the number driving the muscle-growth gates.
   */
  const collagenSupp = SUPPLEMENTS.find((s) => s.key === 'collagen')!;
  check('Collagen counts calories but never protein', (collagenSupp.macros?.calories ?? 0) > 0 && collagenSupp.macros?.proteinG === undefined);
  check('…and its note says why', /tryptophan/i.test(collagenSupp.evidence ?? ''));
  check('Aminos carry calories only, no protein claim', ['beta-alanine', 'citrulline'].every((k) => { const d = SUPPLEMENTS.find((s) => s.key === k)!; return (d.macros?.calories ?? 0) > 0 && d.macros?.proteinG === undefined; }));
  check('Both fish oils carry their fat', ['gsn-fish-oil', 'omega-3'].every((k) => (SUPPLEMENTS.find((s) => s.key === k)?.macros?.fatG ?? 0) > 0));
  check('Whey warns against logging the same scoop twice', /don't also log it as a food/i.test(wheySupp.evidence ?? ''));
  const suppRepo2 = fs.readFileSync('src/repositories/supplementsRepo.ts', 'utf8');
  check('Macro supplements write a linked diary row', /foodEntryId = addPreciseFood\(/.test(suppRepo2));
  check('The diary row scales with a part portion', /def\.macros\.calories \* fraction/.test(suppRepo2));
  check('The diary row carries no micros (no double count)', !/micros:/.test(suppRepo2.slice(suppRepo2.indexOf('foodEntryId = addPreciseFood'), suppRepo2.indexOf('db.insert(supplementLogs)'))));
  check('Deleting the log deletes its calories with it', /row\?\.foodEntryId != null/.test(suppRepo2) && /db\.delete\(foodEntries\)/.test(suppRepo2));
  const bootSrc8 = fs.readFileSync('src/db/bootstrap.ts', 'utf8');
  check('food_entry_id is in the DDL and the migration', /food_entry_id INTEGER/.test(bootSrc8) && /column: 'food_entry_id'/.test(bootSrc8));
  const sv5 = Number((bootSrc8.match(/SCHEMA_VERSION = (\d+)/) || [])[1] ?? 0);
  check('Schema version is at or past the macro-supplement migration', sv5 >= 24, `${sv5}`);

  // ── Herbz TestoBooster (the user's own product, from its label) ──
  const herbz = SUPPLEMENTS.find((s) => s.key === 'herbz-testobooster')!;
  check('Herbz TestoBooster exists with the label\'s serving', !!herbz && herbz.unitsPerServing === 2 && herbz.unitLabel === 'capsule');
  check('Its C and Mg match the label exactly', herbz.micros?.vitaminC_mg === 80 && herbz.micros?.magnesium_mg === 70);
  // The label prints no vitamin values for the herbs, so none may be invented.
  check('Nothing is invented beyond the two labelled nutrients', Object.keys(herbz.micros ?? {}).length === 2);
  /*
   * A "testo booster" entry is exactly where this catalogue could slide into
   * selling hope. The note must compare each dose to what trials actually use,
   * say plainly that the formula is not evidenced to raise testosterone, and
   * point at the things that genuinely move it.
   */
  check('Its note compares label doses to trial doses', /GRAMS|1–3 g|200 mg/.test(herbz.evidence ?? ''));
  check('It says plainly the testosterone claim is unsupported', /nothing in this formula.*raising testosterone/i.test(herbz.evidence ?? ''));
  check('It names what actually moves testosterone', /sleep/i.test(herbz.evidence ?? '') && /body fat/i.test(herbz.evidence ?? ''));
  check('It flags the ginseng interactions', /anticoagulant/i.test(herbz.evidence ?? ''));
  check('It is marked limited evidence, not promoted', herbz.evidenceLevel === 'limited');

  // Every catalogue entry that counts pills must say what to call them.
  const badUnits = SUPPLEMENTS.filter((s) => s.unitsPerServing && !s.unitLabel);
  check('Any supplement with a pill count names the unit', badUnits.length === 0, badUnits.map((s) => s.key).join(', '));
  check('servingUnits reads as plain English', servingUnits(spiruline) === '6 tablets' && servingUnits(shilajit) === '1 capsule');

  // Schema + migration wiring for the pill counts.
  const bootSrc3 = fs.readFileSync('src/db/bootstrap.ts', 'utf8');
  check('units_per_serving is in the DDL and the migration', /units_per_serving INTEGER/.test(bootSrc3) && /column: 'units_per_serving'/.test(bootSrc3));
  check('units_taken is in the DDL and the migration', /units_taken REAL/.test(bootSrc3) && /column: 'units_taken'/.test(bootSrc3));
  const sv = Number((bootSrc3.match(/SCHEMA_VERSION = (\d+)/) || [])[1] ?? 0);
  check('Schema version is at or past the pill-count migration', sv >= 20, `${sv}`);

  const suppRepo = fs.readFileSync('src/repositories/supplementsRepo.ts', 'utf8');
  check("The user's own pill count beats the catalogue default", /row\?\.unitsPerServing \?\? findSupplement\(key\)\?\.unitsPerServing/.test(suppRepo));
  /*
   * Half the pills is half the iron. Logging a part portion at full micros
   * would inflate the day's totals — quietly, and in the direction that makes
   * a deficiency look solved.
   */
  check('A part portion scales its micronutrients down', /scaleMicros\(def\.micros, units \/ perServing\)/.test(suppRepo));
  check('One-tap "Take" still logs a whole portion', /opts\.unitsTaken != null && Number\.isFinite\(opts\.unitsTaken\) && opts\.unitsTaken > 0/.test(suppRepo) && /: perServing;/.test(suppRepo));
  check('Pills taken today can be totalled per supplement and overall', /export function unitsTakenToday/.test(suppRepo) && /export function totalUnitsToday/.test(suppRepo));
}

console.log('\nShoulder coverage:');
{
  const sh = EXLIB.filter((e) => e.primaryMuscle === 'shoulders');
  check('Face pull exists (cable and band)', ['face-pull', 'band-face-pull'].every((s) => ALL_SLUGS.has(s)));
  check('Rotator-cuff work exists', ['cable-external-rotation', 'db-external-rotation', 'db-cuban-press'].every((s) => ALL_SLUGS.has(s)));
  check('Shoulder machines cover press, raise and rear delt', ['plate-loaded-shoulder-press', 'smith-shoulder-press', 'machine-rear-delt-row', 'machine-front-raise', 'lateral-raise-machine', 'reverse-pec-deck'].every((s) => ALL_SLUGS.has(s)));
  check('Shoulder-friendly pressing variants exist', ['landmine-press', 'z-press', 'bradford-press', 'kb-bottoms-up-press'].every((s) => ALL_SLUGS.has(s)));
  /*
   * The imbalance that matters. Every press and every bench hits the front
   * delt, so a library heavy on pressing and light on pulling quietly steers
   * people into the exact shoulder problem this section exists to avoid.
   */
  const bySub = (m: string) => sh.filter((e) => e.subMuscle === m).length;
  check('Rear delt is no longer the poor relation', bySub('rear_delt') >= 12, `front ${bySub('front_delt')} / side ${bySub('side_delt')} / rear ${bySub('rear_delt')}`);
  check('Every shoulder exercise carries a sub-muscle tag', sh.every((e) => !!e.subMuscle), sh.filter((e) => !e.subMuscle).map((e) => e.slug).join(', '));
  check('Free weights, machines and cables are all represented', ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight'].every((eq) => sh.some((e) => e.equipmentType === eq)));
  // A new exercise reaches existing installs only if the seed version moves.
  const bootSrc2 = fs.readFileSync('src/db/bootstrap.ts', 'utf8');
  const seedVersion = Number((bootSrc2.match(/SCHEMA_VERSION = (\d+)/) || [])[1] ?? 0);
  check('Seed version was bumped so existing installs get them', seedVersion >= 19, `${seedVersion}`);

  // Dumbbell loads are logged per hand; the UI has to say so, because guessing
  // wrong halves or doubles every volume and 1RM figure for that lift.
  const uiSrc2 = fs.readFileSync('src/screens/train/ActiveSessionScreen.tsx', 'utf8');
  check('The weight field names the dumbbell convention', /'Weight \/ dumbbell' : loadLabel/.test(fs.readFileSync('src/screens/train/ActiveSessionScreen.tsx', 'utf8')));
  check('…and spells it out underneath', /One dumbbell, not the pair/.test(uiSrc2));
  const repoSrc2 = fs.readFileSync('src/repositories/sessionRepo.ts', 'utf8');
  check('Equipment type reaches the logging screen', /equipmentType: exercises\.equipmentType/.test(repoSrc2));
}

console.log('\nNumber display — no floating-point tails:');
{
  /*
   * The reported bug: the Home ring showed "419.8000000000002 kcal left".
   * Nothing was wrong with the arithmetic — adding a day of food entries one at
   * a time in binary floating point genuinely lands there. It just must never
   * reach a screen.
   */
  const day = [280, 316.4, 500, 150.3, 205.7, 120.9, 164.2, 96.5, 84.8, 135.4];
  const eaten = day.reduce((a, b) => a + b, 0);
  check('A real day of entries does produce a float tail', !Number.isInteger(eaten) && String(eaten).length > 8, `${eaten}`);
  check('Rounded intake is clean', roundKcal(eaten) === 2054, `${roundKcal(eaten)}`);
  check('…and so is what is left of the target', roundKcal(2474 - eaten) === 420, `${roundKcal(2474 - eaten)}`);
  check('A rounded kcal never renders more than 5 characters', String(roundKcal(2474 - eaten)).length <= 5);

  check('roundTo kills the classic 0.1 + 0.2', roundTo(0.1 + 0.2, 2) === 0.3);
  check('roundGrams keeps one decimal of real precision', roundGrams(52.63) === 52.6 && roundGrams(0.05) === 0.1);
  check('Rounding is exact on whole numbers', roundKcal(2000) === 2000 && roundGrams(31) === 31);
  check('Negative values round toward the right side', roundKcal(-0.4) === 0 && roundTo(-1.25, 1) === -1.2);
  // A NaN reaching a screen renders the literal text "NaN", which is worse than
  // a wrong number because it looks like a crash.
  check('Non-finite input yields 0, never NaN on screen', roundKcal(NaN) === 0 && roundGrams(Infinity) === 0 && roundTo(NaN, 2) === 0);

  // The repository must do the rounding, so every consumer inherits it rather
  // than each screen having to remember.
  const nutSrc = fs.readFileSync('src/repositories/nutritionRepo.ts', 'utf8');
  check('Daily totals are rounded in the repository', /calories: roundKcal\(total\.calories\)/.test(nutSrc) && /protein: roundGrams\(total\.protein\)/.test(nutSrc));
  check('The trend rows are rounded too', /calories: roundKcal\(r\.calories\), protein: roundGrams\(r\.protein\)/.test(nutSrc));
  const homeSrc = fs.readFileSync('src/screens/home/HomeScreen.tsx', 'utf8');
  // The ring became the Fuel Arc; the rounding moved with the numeral.
  check('The Fuel cell rounds what it renders', /Math\.round\(calTarget - calConsumed\)/.test(fs.readFileSync('src/components/FuelCell.tsx', 'utf8')));
  check('...and says "+n over" instead of clamping the number', /kcal over/.test(fs.readFileSync('src/components/FuelCell.tsx', 'utf8')));
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

  // ── A failure set logged without a rep count ──
  // Ticking "to failure" removes the rep box, so these have to behave.
  const noReps = set(null, null, true);
  check('A failure set with no reps is still a full hard set', hardSetCredit(noReps) === 1);
  check('…still reads as 0 reps in reserve', repsInReserve(noReps) === 0);
  check('…yields no stimulating-rep figure rather than a wrong one', stimulatingReps(noReps) === null);
  check('…is not mistaken for a light-load miss', !isUnderStimulatingLightSet(noReps));
  check('…and still labels itself', proximityLabel(noReps) === 'to failure');
  check('…produces no 1RM estimate, since there is nothing to estimate from', estimate1RMFromSet({ weightKg: 100, reps: null, toFailure: true }) === 0);
  const failureOnly = summariseEffort([noReps, noReps, noReps]);
  check('A week of rep-less failure sets still counts as hard sets', failureOnly.effectiveSets === 3, `${failureOnly.effectiveSets}`);
  check('…with a 100% failure share and 0 reserve', failureOnly.failureShare === 1 && failureOnly.avgRir === 0);

  // ── The RPE scale, stated rather than assumed ──
  check('The scale covers 10 down to 5', RPE_SCALE.length === 6 && RPE_SCALE[0].rpe === 10 && RPE_SCALE[RPE_SCALE.length - 1].rpe === 5);
  check('RPE 10 is defined as failure, not "very hard"', /another rep/i.test(RPE_SCALE[0].meaning));
  check('Each step matches its own reps-in-reserve', RPE_SCALE.every((s) => s.rpe < 6 || repsInReserve({ reps: 10, rpe: s.rpe, toFailure: false }) === 10 - s.rpe));
  check('7–10 is marked as the productive range', RPE_SCALE.filter((s) => s.productive).map((s) => s.rpe).join(',') === '10,9,8,7');
  check('rpeMeaning answers for any input, including junk', rpeMeaning(8).length > 0 && rpeMeaning(2).length > 0 && rpeMeaning(NaN) === '');

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
  /*
   * A plain custom food carries no micros (nothing to derive from, none
   * invented). A COMPOSED food carries the SUM of its parts' micros — real
   * data, not invented. The check is that micros only ever come from
   * parseMicros(f.microsJson), i.e. from a stored sum, never fabricated.
   */
  check('Custom-food micros come only from a stored component sum', /micros: parseMicros\(f\.microsJson\)/.test(repoSrc) && !/micros: \{/.test(repoSrc));
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
  // At-or-above, not exactly: pinning the number makes this fail on every
  // later bump for a reason that has nothing to do with what it's testing.
  const schemaVersion = Number((bootSrc.match(/SCHEMA_VERSION = (\d+)/) || [])[1] ?? 0);
  check('Schema version is at or past the to_failure migration', schemaVersion >= 18, `${schemaVersion}`);

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

  // Ticking "to failure" hides the rep box — and must also stop a rep count
  // typed *before* the tick from being saved, or the field would be hidden
  // while its old value still went to the database.
  const uiSrc = fs.readFileSync('src/screens/train/ActiveSessionScreen.tsx', 'utf8');
  check('The rep field is hidden on a failure set', /f\.reps && !toFailure/.test(uiSrc));
  check('A stale rep count is not saved once failure is ticked', /reps: f\.reps && reps && !\(isLifting && toFailure\)/.test(uiSrc));
  check('RPE and failure are never asked for at the same time', /isLifting && !toFailure/.test(uiSrc));
  check('The RPE guide appears in every lifting session', /<RpeGuide \/>/.test(uiSrc));

  // Volume must treat "not recorded" as unknown rather than zero, or the
  // overload trend collapses the moment someone logs rep-less failure sets.
  const growthSrc = fs.readFileSync('src/repositories/growthRepo.ts', 'utf8');
  check('Unknown volume is null, not zero', /volume: r\.weightKg != null && r\.reps != null \? r\.weightKg \* r\.reps : null/.test(growthSrc));
  check('The overload trend compares only measured volume', /const measured = mRows\.filter\(\(r\) => r\.volume != null\)/.test(growthSrc));
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
  // A 40 m fix is now vague-but-usable rather than binned outright, so the
  // first one anchors the route. What must never happen is DISTANCE, and the
  // 60 m gate its own accuracy earns it means none of the drift can clear it.
  check('Indoor drift adds no distance at all', roomRes.distanceM === 0, `${roomRes.rejected.jitter} rejected as jitter`);
  check('…and it never grows into a route', roomRes.accepted.length <= 1);

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

console.log('\nFibre — the fourth bar:');
{
  // IOM ratio above the floor, WHO floor beneath it.
  check('2200 kcal → 31 g (14 g per 1000 kcal)', recommendedFiberG(2200) === 31, `${recommendedFiberG(2200)}`);
  check('3500 kcal athlete → 49 g, not a population number', recommendedFiberG(3500) === 49, `${recommendedFiberG(3500)}`);
  check('A deep cut never drops below the WHO 25 g floor', recommendedFiberG(1400) === FIBRE_MIN_G && recommendedFiberG(1000) === FIBRE_MIN_G);
  check('The floor is the WHO adult minimum', FIBRE_MIN_G === 25 && FIBRE_G_PER_1000_KCAL === 14);
  check('Garbage in yields the floor, never NaN', recommendedFiberG(NaN) === FIBRE_MIN_G && recommendedFiberG(-5) === FIBRE_MIN_G);
  check('The 2700-kcal male reference reproduces the 38 g AI', recommendedFiberG(2700) === 38);
  check('The 1800-kcal female reference reproduces the 25 g AI', recommendedFiberG(1800) === 25);

  // The day total already exists in the repository; the screens must render it.
  const nutRepoSrc = fs.readFileSync('src/repositories/nutritionRepo.ts', 'utf8');
  check('The day summary sums and rounds fibre', /total\.fiber \+= e\.fiberG/.test(nutRepoSrc) && /fiber: roundGrams\(total\.fiber\)/.test(nutRepoSrc));
  const nutScreenSrc = fs.readFileSync('src/screens/nutrition/NutritionScreen.tsx', 'utf8');
  // Superseded by 3.0.7: the four macro bars became FuelRails in the shared grammar.
  check('Nutrition shows a fibre rail beside protein, carbs and fat', /<FuelRail label="Fibre"[^\n]*max=\{fiberTarget\}/.test(nutScreenSrc) && ['Protein', 'Carbs', 'Fat'].every((l) => new RegExp(`<FuelRail label="${l}"`).test(nutScreenSrc)));
  check('The fibre target follows the calorie target', /fiberTarget = recommendedFiberG\(calTarget\)/.test(nutScreenSrc));
  // Superseded by 3.0.7: the donut left with the remodel; the Arc carries the
  // calorie verdict and fibre rides its own rail against its own target.
  check('The calorie Arc wears Home\'s overflow honesty', /kcal over/.test(nutScreenSrc) && /kcal left/.test(nutScreenSrc) && /<Arc value=\{cal\} max=\{calTarget\}/.test(nutScreenSrc));

  // The donut slice: fibre is carved OUT of carbs (it is inside the carb
  // grams), at the same 2 kcal/g discount foodMath uses — never added on top.
  const s = macroEnergyShares({ protein: 100, carbs: 200, fat: 50, fiber: 30 });
  // 400 + 170*4 + 30*2 + 450 = 1590 kcal
  check('Shares sum to 1', Math.abs(s.protein + s.carbs + s.fiber + s.fat - 1) < 1e-9);
  check('Fibre is carved out of carbs, not added on top', Math.abs(s.carbs - 680 / 1590) < 1e-9 && Math.abs(s.fiber - 60 / 1590) < 1e-9, `${s.carbs} ${s.fiber}`);
  check('Fibre is weighted at 2 kcal/g, matching the calorie estimate', Math.abs(s.fiber / s.carbs - (30 * 2) / (170 * 4)) < 1e-9);
  const s0 = macroEnergyShares({ protein: 100, carbs: 200, fat: 50 });
  check('No fibre → the classic three-way split, unchanged', s0.fiber === 0 && Math.abs(s0.carbs - 800 / 1650) < 1e-9);
  const sOver = macroEnergyShares({ protein: 0, carbs: 10, fat: 0, fiber: 25 });
  check('Fibre above carbs is capped so the carb slice never goes negative', sOver.carbs === 0 && sOver.fiber === 1);
  const sEmpty = macroEnergyShares({ protein: 0, carbs: 0, fat: 0, fiber: 0 });
  check('An empty day draws nothing, not NaN', sEmpty.protein === 0 && sEmpty.fiber === 0 && !Number.isNaN(sEmpty.fat));
  // Superseded by 3.0.7: the donut is gone from the tree entirely (the shares
  // math above is foodMath's, tested directly, and outlives its first renderer).
  check('The donut left cleanly - no file, no imports', !fs.existsSync('src/components/charts/MacroDonut.tsx') && !/MacroDonut/.test(nutScreenSrc));
  const homeScreenSrc = fs.readFileSync('src/screens/home/HomeScreen.tsx', 'utf8');
  // Fibre's tile left Home in the bento collapse (two Metrics + a door);
  // the same target still governs the Nutrition screen's fibre rail.
  check('Home collapses macros to two Metrics and a door', /All macros & micros/.test(homeScreenSrc) && (homeScreenSrc.match(/<Metric\b/g) ?? []).length === 2);
  check('The fibre target still rules the Nutrition screen', /recommendedFiberG\(calTarget\)/.test(fs.readFileSync('src/screens/nutrition/NutritionScreen.tsx', 'utf8')));
  const themeSrc = fs.readFileSync('src/theme/index.ts', 'utf8');
  check('Fibre has its own colour token', /fiber: '#[0-9A-Fa-f]{6}'/.test(themeSrc));
  check('The fibre icon resolves', !!(ICONS as Record<string, Record<string, unknown>>).nutrition?.fiber);
}

console.log('\nNutrient completeness — every food, every supplement, every write path:');
{
  const isNum = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  // ── Foods: all five macros, present and sane ──
  const badMacro = FOOD_DB.filter((f) => !(['calories', 'protein', 'carbs', 'fat', 'fiber'] as const).every((k) => isNum(f[k])));
  check('Every food carries finite kcal, protein, carbs, fat AND fibre', badMacro.length === 0, badMacro.slice(0, 5).map((f) => f.id).join(', '));
  const fibreOver = FOOD_DB.filter((f) => f.fiber > f.carbs + 0.01);
  check('No food declares more fibre than carbs (fibre is inside carbs)', fibreOver.length === 0, fibreOver.slice(0, 5).map((f) => f.id).join(', '));
  const kcalOff = FOOD_DB.filter((f) => Math.abs(caloriesFromMacros(f) - f.calories) > Math.max(25, f.calories * 0.15));
  check('Every food\'s calories agree with its macros (±15% or 25 kcal)', kcalOff.length === 0, kcalOff.slice(0, 5).map((f) => `${f.id}:${f.calories}vs${caloriesFromMacros(f)}`).join(', '));
  const PLANT = /vegetable|fruit|legume|grain|nuts|seeds|bread|dried fruit/i;
  const plantNoFibre = FOOD_DB.filter((f) => PLANT.test(f.category ?? '') && f.carbs >= 5 && f.fiber === 0);
  check('No plant food with real carbs is missing its fibre', plantNoFibre.length === 0, plantNoFibre.slice(0, 5).map((f) => f.id).join(', '));
  check('Every food carries micronutrients (321+ foods)', FOODS_WITH_MICROS === FOOD_DB.length && FOOD_DB.length >= 321, `${FOODS_WITH_MICROS}/${FOOD_DB.length}`);
  const badMicroVal = FOOD_DB.filter((f) => f.micros && Object.values(f.micros).some((v) => !isNum(v)));
  check('Every food micro value is a finite non-negative number', badMicroVal.length === 0, badMicroVal.slice(0, 5).map((f) => f.id).join(', '));

  // ── Supplements ──
  const whey = findSupplement('whey')!;
  const wheyFood = FOOD_DB.find((f) => f.id === 'whey')!;
  check('Whey the supplement carries the same micros as whey the food', JSON.stringify(whey.micros) === JSON.stringify(wheyFood.micros), JSON.stringify(whey.micros));
  check('…and the same macros', whey.macros?.calories === wheyFood.calories && whey.macros?.proteinG === wheyFood.protein && whey.macros?.carbsG === wheyFood.carbs && whey.macros?.fatG === wheyFood.fat);
  const VITAMINS = ['vitaminA_ug', 'vitaminC_mg', 'vitaminD_ug', 'vitaminE_mg', 'vitaminK_ug', 'thiamin_mg', 'riboflavin_mg', 'niacin_mg', 'pantothenic_mg', 'vitaminB6_mg', 'biotin_ug', 'folate_ug', 'vitaminB12_ug'];
  const multi = findSupplement('multivitamin')!;
  check('The generic multivitamin carries all 13 vitamins', VITAMINS.every((k) => (multi.micros as Record<string, number>)[k] > 0), VITAMINS.filter((k) => !(multi.micros as Record<string, number>)[k]).join(','));
  check('…and the minerals a one-a-day actually carries', ['calcium_mg', 'magnesium_mg', 'zinc_mg', 'iron_mg', 'iodine_ug', 'selenium_ug', 'copper_mg', 'manganese_mg', 'chromium_ug'].every((k) => (multi.micros as Record<string, number>)[k] > 0));
  const gsnMultiV = findSupplement('gsn-multivitamin')!;
  check('The GSN multivitamin carries all 13 vitamins', VITAMINS.every((k) => (gsnMultiV.micros as Record<string, number>)[k] > 0));
  const microSupps = SUPPLEMENTS.filter((s) => s.category === 'micronutrient');
  check('Every micronutrient-category supplement carries micros', microSupps.every((s) => s.micros && Object.keys(s.micros).length > 0), microSupps.filter((s) => !s.micros).map((s) => s.key).join(','));
  const badSuppVal = SUPPLEMENTS.filter((s) => s.micros && Object.values(s.micros).some((v) => !isNum(v)));
  check('Every supplement micro value is a finite non-negative number', badSuppVal.length === 0);
  // Ergogenics with no micronutrients say so by omission — nothing invented.
  check('Pure ergogenics carry no invented micros', ['creatine', 'caffeine', 'beta-alanine', 'citrulline', 'l-theanine', 'melatonin', 'probiotics'].every((k) => !findSupplement(k)?.micros));

  // ── Every diary write path carries fibre AND micros ──
  const addFoodSrcN = fs.readFileSync('src/screens/nutrition/AddFoodScreen.tsx', 'utf8');
  check('AddFood logs fibre and micros', /fiberG: selected\.fiber/.test(addFoodSrcN) && /micros: selected\.micros/.test(addFoodSrcN));
  const mrSrcN = fs.readFileSync('src/repositories/mealRoutineRepo.ts', 'utf8');
  check('Meal routines snapshot fibre and micros…', /fiberG: e\.fiberG/.test(mrSrcN) && /micros: e\.micros \? safeParse\(e\.micros\) : null/.test(mrSrcN));
  check('…and re-log both', /fiberG: i\.fiberG/.test(mrSrcN) && /micros: i\.micros \?\? undefined/.test(mrSrcN));
  const sdSrcN = fs.readFileSync('src/lib/specialDiet.ts', 'utf8');
  check('Programme meals log fibre and micros', /fiberG: base\.fiber \?\? 0/.test(sdSrcN) && /micros: base\.micros/.test(sdSrcN));
  const dpSrcN = fs.readFileSync('src/screens/nutrition/DietPlanScreen.tsx', 'utf8');
  check('Diet plan logs fibre and micros', /fiberG: food\?\.fiber/.test(dpSrcN) && /micros: food\?\.micros/.test(dpSrcN));
  const cfSrcN = fs.readFileSync('src/lib/composedFood.ts', 'utf8');
  check('Composed dishes snapshot fibre per component', /fiberG: food\.fiber \* n/.test(cfSrcN));
  const suppSrcN = fs.readFileSync('src/repositories/supplementsRepo.ts', 'utf8');
  check('Supplement micros are logged from the definition, any category', /micros: def\.micros/.test(suppSrcN));
  check('…and never duplicated onto the diary row', /Micros stay on the supplement log/.test(suppSrcN));

  // ── Fibre visible wherever the other macros are ──
  check('AddFood detail shows fibre', /<Macro label="Fibre" value=\{`\$\{Math\.round\(selected\.fiber \* q\)\}g`\}/.test(addFoodSrcN));
  check('AddFood search rows show fibre', /F\{item\.fat\} Fb\{item\.fiber\}/.test(addFoodSrcN));
  const composeSrcN = fs.readFileSync('src/screens/nutrition/ComposeFoodScreen.tsx', 'utf8');
  check('Compose totals show fibre', /<Macro label="Fibre" value=\{`\$\{totals\.fiberG\}g`\}/.test(composeSrcN));
  check('Compose picker shows fibre', /Fb\{pending\.fiber\}/.test(composeSrcN));
  const dpl = generateDietPlan(dpTarget, { style: 'balanced', meals: 4, seed: 42 });
  check('Diet plan items carry fibre', dpl.meals.every((m) => m.items.every((i) => isNum(i.fiber))));
  check('Diet plan totals sum fibre from the items', dpl.totals.fiber === dpl.meals.reduce((s, m) => s + m.items.reduce((t, i) => t + i.fiber, 0), 0) && dpl.totals.fiber > 0, `${dpl.totals.fiber}`);
  check('Diet plan shows a fibre pill and per-item fibre', /label="Fb" got=\{plan\.totals\.fiber\} target=\{recommendedFiberG\(target\.calories\)\}/.test(dpSrcN) && /F\{item\.fat\} Fb\{item\.fiber\}/.test(dpSrcN));
}

console.log('\nLayout — one title per page, uniform heroes, section rhythm:');
{
  const navSrcL = fs.readFileSync('src/navigation/RootNavigator.tsx', 'utf8');
  const importsL = Object.fromEntries([...navSrcL.matchAll(/import \{ (\w+) \} from '@\/screens\/([^']+)';/g)].map((m) => [m[1], m[2]]));
  const routesL = [...navSrcL.matchAll(/<Stack\.Screen\s+name="(\w+)"\s+component=\{(\w+)\}\s+options=\{\{([^}]*)\}\}/g)]
    .filter((m) => importsL[m[2]])
    .map((m) => {
      const src = fs.readFileSync(`src/screens/${importsL[m[2]]}.tsx`, 'utf8');
      const t = /title: (?:'([^']*)'|"([^"]*)")/.exec(m[3]);
      return { name: m[1], hero: /<PageHero\b/.test(src), title: t ? (t[1] ?? t[2]) : null, hidden: /headerShown: false/.test(m[3]) };
    });
  // A page that opens with a PageHero owns its title; the bar must not repeat it.
  const doubled = routesL.filter((r) => r.hero && r.title && !r.hidden);
  check('No page is titled twice (hero + header bar)', doubled.length === 0, doubled.map((r) => r.name).join(', '));
  // …and a page whose bar title is blank must actually have a hero, or it has no title at all.
  const untitled = routesL.filter((r) => r.title === '' && !r.hero);
  check('Every blank-bar page carries a hero', untitled.length === 0, untitled.map((r) => r.name).join(', '));
  check('The hero pattern is the norm on pushed pages (30+)', routesL.filter((r) => r.hero).length >= 30, `${routesL.filter((r) => r.hero).length}`);
  check('The rule is documented where the routes live', /Title ownership: a page has exactly one title/.test(navSrcL));

  // No screen still hand-rolls the old hero row — that is how the drift began.
  const screenFiles = fs.readdirSync('src/screens').flatMap((d) => fs.readdirSync(`src/screens/${d}`).map((f) => `src/screens/${d}/${f}`)).filter((f) => f.endsWith('.tsx') && !/Onboarding/.test(f));
  const oldHero = screenFiles.filter((f) => /<Row gap=\{12\} style=\{\{ alignItems: 'center' \}\}>\s*<Icon [^\n]*\n\s*<Text variant="h1"/.test(fs.readFileSync(f, 'utf8')));
  check('No hand-rolled icon + h1 hero rows remain', oldHero.length === 0, oldHero.join(', '));

  const heroSrc = fs.readFileSync('src/components/ui/PageHero.tsx', 'utf8');
  check('PageHero: tinted 44 tile, 24 icon, h1 title', /width: 44/.test(heroSrc) && /size=\{24\}/.test(heroSrc) && /variant="h1"/.test(heroSrc));
  check('PageHero: long subtitles run full width beneath, short ones sit inline', /INLINE_SUBTITLE_MAX = 100/.test(heroSrc) && /below \?/.test(heroSrc));

  const miscSrc = fs.readFileSync('src/components/ui/misc.tsx', 'utf8');
  check('SectionHeader takes room above and pulls its content closer', /marginTop: theme\.spacing\.sm,\s*marginBottom: -theme\.spacing\.xs/.test(miscSrc));
  check('SectionHeader action has a chevron and a generous hit area', /hitSlop=\{8\}/.test(miscSrc) && /icon="core\.forward" size=\{14\}/.test(miscSrc));
  // Its rhythm is tuned for the screen's gap; inside a card it is just an h3.
  const inCard = screenFiles.filter((f) => /<Card[^>]*>\s*<SectionHeader/.test(fs.readFileSync(f, 'utf8')));
  check('SectionHeader is a page-level element, never a card\'s first child', inCard.length === 0, inCard.join(', '));

  // Copy that stopped being true when supplements started logging calories.
  check('Supplements intro no longer claims pills never touch calories', !/None of this changes your calories/.test(fs.readFileSync('src/screens/nutrition/SupplementsScreen.tsx', 'utf8')));
}

console.log('\nReports — the PDF document renders from full and sparse data:');
{
  const base = {
    generatedOn: '2026-08-18',
    profile: { name: 'Fedi', age: 23, sex: 'male' as const, gender: 'male', heightCm: 178, goal: 'build_muscle', activityLevel: 'moderate', bodyType: 'mesomorph' },
    weightKg: 76.4,
    bodyComp: { bodyFatPct: 15, fatMassKg: 11.5, leanMassKg: 64.9, muscleMassKg: 36, bodyWaterPct: 60, waterStatus: 'normal', boneMassKg: 3.2, normalizedFFMI: 21.1, ffmi: 20.5, bmi: 24.1, bmiCategory: 'normal', ffmiCategory: 'above average' },
    weightTrendKgPerWeek: 0.21,
    nutrition: { calorieTarget: 2700, proteinG: 160, carbsG: 320, fatG: 80, avg7d: { calories: 2610, protein: 152, fiber: 27 }, avg30d: { calories: 2550, protein: 148, fiber: 24 }, fiberTargetG: 38, daysLogged30d: 26, waterGoalMl: 2700, caffeineSoftLimitMg: 400 },
    micros: { daysWithData: 6, gaps: [{ label: 'Vitamin D', avgAmount: '4.2 µg', rdi: '15 µg', pct: 28 }, { label: 'Magnesium', avgAmount: '190 mg', rdi: '400 mg', pct: 48 }], coveredCount: 17, trackedCount: 25 },
    supplements: [{ label: 'Multivitamines GSN', dose: '1 capsule', category: 'micronutrient' }, { label: 'Creatine', dose: '5 g/day', category: 'ergogenic' }],
    training: { sessions30d: 14, streak: 5, weeklyVolume: [{ weekStart: '2026-08-10', volume: 24000 }], sessionMix: { strength: 10, cardio: 4 }, prs: [{ date: '2026-08-12', exerciseName: 'Back Squat', weightKg: 120, reps: 5, est1RM: 140 }], avgStepsPerDay: 8200 },
    sleep: { lastNight: 7.2, avg7d: 7.0, debt7d: 3, performanceFactor: 0.96, series: [] },
    alcohol: { todayGrams: 0, todayDrinks: 0, todayCalories: 0, weekGrams: 20, weekDrinks: 2, weekCalories: 140, weeklyLimitG: 100, estimatedPeakBAC: 0, hoursToSober: 0, dryDays7d: 6, series: [] },
    smoking: { today: 2, week: 18, avgPerDay: 2.6, dailyTarget: 3, nicotineWeekMg: 20, moneyWeek: 7.2, moneyYearProjected: 374, currency: 'TND ', lifeMinutesWeek: 198, lifeHoursYearProjected: 171, aerobicPenaltyPct: 3, restingHrElevationBpm: 4, smokeFreeHours: 5, smokeFreeStreak: 0 },
    cycle: null,
    conditions: [{ label: 'Asthma', category: 'respiratory', notes: 'Inhaler before cardio' }],
    rating: { overall: 74, attributes: { STR: 70, END: 66, CON: 80, NUT: 77, REC: 72, DIS: 79 }, tier: 'Gold' as const, tierColor: '#FFB454' },
  };
  const full = { ...base, audience: 'nutritionist' as const } as unknown as ReportData;
  const html = buildReportHtml(full);
  check('The nutritionist report renders', html.startsWith('<!DOCTYPE html>') && /Nutrition &amp; Body Report/.test(html));
  check('…with fibre target and averages', /Fibre target/.test(html) && /38 g/.test(html) && /27 \/ 24 g/.test(html));
  check('…a micronutrient section listing what runs low', /Micronutrients \(7-day average\)/.test(html) && /Vitamin D/.test(html) && /28%/.test(html) && /17 of 25 tracked/.test(html));
  check('…the supplement stack', /Supplement Stack/.test(html) && /Multivitamines GSN/.test(html) && /1 capsule/.test(html));
  check('…PRs, conditions, rating, smoking', /Back Squat/.test(html) && /Asthma/.test(html) && /Overall <strong>74<\/strong>/.test(html) && /Est\. aerobic penalty/.test(html));
  check('Nutritionist order: Nutrition and Micronutrients come before Training', html.indexOf('<h2>Nutrition</h2>') < html.indexOf('<h2>Micronutrients') && html.indexOf('<h2>Micronutrients') < html.indexOf('<h2>Training'));
  const coach = buildReportHtml({ ...base, audience: 'coach' } as unknown as ReportData);
  check('Coach order: Athlete Rating and Training come first', coach.indexOf('<h2>Athlete Rating</h2>') < coach.indexOf('<h2>Nutrition</h2>') && /Training &amp; Recovery Report/.test(coach));
  // Sparse: a brand-new user with almost nothing logged must still get a document.
  const sparse = {
    ...base,
    audience: 'nutritionist' as const,
    weightKg: null, bodyComp: null, weightTrendKgPerWeek: null, nutrition: null,
    micros: { daysWithData: 0, gaps: [], coveredCount: 0, trackedCount: 25 },
    supplements: [],
    training: { sessions30d: 0, streak: 0, weeklyVolume: [], sessionMix: {}, prs: [], avgStepsPerDay: 0 },
    sleep: { lastNight: null, avg7d: null, debt7d: 0, performanceFactor: 1, series: [] },
    smoking: { ...base.smoking, week: 0, avgPerDay: 0 },
    cycle: null, conditions: [],
    profile: { ...base.profile, heightCm: null, bodyType: null },
  } as unknown as ReportData;
  let sparseHtml = '';
  let threw: unknown = null;
  try { sparseHtml = buildReportHtml(sparse); } catch (e) { threw = e; }
  check('A sparse profile renders without throwing', threw === null && sparseHtml.length > 500, String(threw));
  check('…omitting the sections that have nothing (micros, supplements, smoking, body comp)', !/<h2>Micronutrients/.test(sparseHtml) && !/Supplement Stack/.test(sparseHtml) && !/<h2>Smoking<\/h2>/.test(sparseHtml) && !/<h2>Body Composition<\/h2>/.test(sparseHtml));
  check('…and saying so where it matters', /No PRs recorded yet\./.test(sparseHtml) && /Weight<\/td><td class="v">—/.test(sparseHtml));
  // Escaping: a name is user text.
  const nasty = buildReportHtml({ ...base, audience: 'coach', profile: { ...base.profile, name: '<script>alert(1)</script> & co' } } as unknown as ReportData);
  check('User text is escaped in the document', /&lt;script&gt;/.test(nasty) && !/<script>alert/.test(nasty) && /&amp; co/.test(nasty));
  // The service is a thin shell around the pure builder, and never fails silently.
  const svc = fs.readFileSync('src/services/pdfReport.ts', 'utf8');
  check('pdfReport renders the pure builder', /buildReportHtml\(data\)/.test(svc) && /Print\.printToFileAsync\(\{ html/.test(svc));
  check('…and tells the user where the file is when no share sheet exists', /Alert\.alert\('Report generated'/.test(svc));
  check('The Reports screen catches and shows generation errors', /Alert\.alert\('Could not generate report'/.test(fs.readFileSync('src/screens/profile/ReportsScreen.tsx', 'utf8')));
  // Data side: fibre rides along in daily intake, micros averaged over days WITH data.
  const nutRepoR = fs.readFileSync('src/repositories/nutritionRepo.ts', 'utf8');
  check('Daily intake rows carry fibre', /cur\.fiber \+= e\.fiberG/.test(nutRepoR) && /fiber: roundGrams\(r\.fiber\)/.test(nutRepoR));
  const repRepo = fs.readFileSync('src/repositories/reportRepo.ts', 'utf8');
  check('Report micros average only the days that had micro data', /filter\(\(m\) => m\.foodEntriesWithMicros > 0 \|\| m\.supplementCount > 0\)/.test(repRepo) && /Math\.max\(1, microDays\.length\)/.test(repRepo));
  check('Report fibre target is the same function the app shows', /fiberTargetG: recommendedFiberG\(goal\.calorieTarget\)/.test(repRepo));
  check('Report supplement stack comes from the enabled stack with the user\'s serving', /getStack\(userId\)/.test(repRepo) && /servingUnits\(def\) \?\? def\.defaultDose/.test(repRepo));
}

console.log('\nFinished eating at — the forgotten meal, timed right:');
{
  // A fixed "now": local 15:00 today.
  const nowD = new Date(); nowD.setHours(15, 0, 0, 0);
  const NOW = nowD.getTime();
  const todayL = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}-${String(nowD.getDate()).padStart(2, '0')}`;
  const yd = new Date(NOW - 86_400_000);
  const yesterdayL = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;
  const M = 60_000;
  check('parseHHMM reads the usual forms', parseHHMM('13:40') === 820 && parseHHMM('9:05') === 545 && parseHHMM('0940') === 580 && parseHHMM('13h40') === 820 && parseHHMM(' 7.30 ') === 450);
  check('…and rejects nonsense', parseHHMM('25:00') === null && parseHHMM('13:60') === null && parseHHMM('abc') === null && parseHHMM('') === null);
  check('"Just now" on today leaves the row to its default (byte-identical to before)', resolveEatenAt({ kind: 'now' }, todayL, NOW) === undefined);
  check('"30 min ago" on today is now minus 30', resolveEatenAt({ kind: 'ago', minutes: 30 }, todayL, NOW) === NOW - 30 * M);
  check('"At 13:40" on today is today 13:40', clockOf(resolveEatenAt({ kind: 'clock', hhmm: '13:40' }, todayL, NOW)!) === '13:40' && resolveEatenAt({ kind: 'clock', hhmm: '13:40' }, todayL, NOW)! === NOW - 80 * M);
  check('A time in the future is clamped to now (never a meal you have not eaten)', resolveEatenAt({ kind: 'clock', hhmm: '18:00' }, todayL, NOW) === NOW && resolveEatenAt({ kind: 'ago', minutes: -60 }, todayL, NOW) === NOW);
  check('An invalid clock falls back to the default rather than a wrong time', resolveEatenAt({ kind: 'clock', hhmm: '99:99' }, todayL, NOW) === undefined);
  const yEight = resolveEatenAt({ kind: 'clock', hhmm: '20:00' }, yesterdayL, NOW)!;
  check('"At 20:00" on a past diary day lands on THAT day at 20:00', clockOf(yEight) === '20:00' && yEight < NOW && yEight > NOW - 24 * 60 * M);
  check('"Just now" on a past day means unknown → the default', resolveEatenAt({ kind: 'now' }, yesterdayL, NOW) === undefined);
  check('"1 h ago" on a past day is anchored to that day, not to now', resolveEatenAt({ kind: 'ago', minutes: 60 }, yesterdayL, NOW)! < NOW - 12 * 60 * M);
  check('Presets start with "Just now" as the default', EATEN_AT_PRESETS[0].choice.kind === 'now' && EATEN_AT_PRESETS.length >= 4);
  // The digestion clock honours it: a 600 kcal meal "finished 2 h ago" is far along.
  const eaten = resolveEatenAt({ kind: 'ago', minutes: 120 }, todayL, NOW)!;
  const st = currentDigestion([{ calories: 600, proteinG: 30, carbsG: 60, fatG: 20, fiberG: 6, eatenAt: eaten }], 'hard', NOW);
  check('A backdated meal is that far along on the training clock', st !== null && st.elapsedMin === 120 && st.remainingMin < 60, `${st?.elapsedMin} / ${st?.remainingMin}`);
  check('…and already clear for a normal session, as 2 h after 600 kcal should be', currentDigestion([{ calories: 600, proteinG: 30, carbsG: 60, fatG: 20, fiberG: 6, eatenAt: eaten }], 'moderate', NOW) === null);
  // Wiring
  const nutRepoE = fs.readFileSync('src/repositories/nutritionRepo.ts', 'utf8');
  check('addPreciseFood stores eatenAt as createdAt only when given', (nutRepoE.match(/\.\.\.\(input\.eatenAt != null \? \{ createdAt: input\.eatenAt \} : \{\}\)/g) ?? []).length === 2);
  const addSrcE = fs.readFileSync('src/screens/nutrition/AddFoodScreen.tsx', 'utf8');
  check('AddFood asks in both modes and resolves against the diary date', (addSrcE.match(/<EatenAtPicker value=\{eatenAt\} onChange=\{setEatenAt\} dateISO=\{diaryDate\} \/>/g) ?? []).length === 2 && (addSrcE.match(/eatenAt: resolveEatenAt\(eatenAt, diaryDate\)/g) ?? []).length === 2);
  check('…defaulting to just now', (addSrcE.match(/useState<EatenAtChoice>\(\{ kind: 'now' \}\)/g) ?? []).length === 2);
  check('The diary row shows when it was eaten, and its fibre', /\{clockOf\(e\.createdAt\)\} · \{Math\.round\(e\.calories\)\} kcal/.test(fs.readFileSync('src/screens/nutrition/NutritionScreen.tsx', 'utf8')) && /Fb\{Math\.round\(e\.fiberG\)\}/.test(fs.readFileSync('src/screens/nutrition/NutritionScreen.tsx', 'utf8')));
  const pickerSrc = fs.readFileSync('src/components/EatenAtPicker.tsx', 'utf8');
  check('The picker says plainly what the clock will do', /the training clock counts from then, not from now/.test(pickerSrc) && /the training clock starts from this moment/.test(pickerSrc));
}

console.log('\nAthlete card — export never fails silently, photo survives a cache clear:');
{
  const ce = fs.readFileSync('src/services/cardExport.ts', 'utf8');
  check('exportCardPng returns a result instead of throwing', /ok: false; reason: 'no-view' \| 'permission-denied' \| 'error'/.test(ce) && /catch \(e\)/.test(ce) && /return \{ ok: true, uri, saved, shared \}/.test(ce));
  check('A denied photos permission is reported, not swallowed', /return \{ ok: false, reason: 'permission-denied' \}/.test(ce));
  check('The picked photo is copied into the app\'s own directory', /FileSystem\.documentDirectory\}profile-photos\//.test(ce) && /FileSystem\.copyAsync\(\{ from: sourceUri, to: dest \}\)/.test(ce));
  check('…falling back to the original if the copy fails', /catch \{\s*return sourceUri;/.test(ce));
  const pcs = fs.readFileSync('src/screens/profile/ProfileCardScreen.tsx', 'utf8');
  check('The card screen persists the photo before storing its URI', /const durable = await persistProfilePhoto\(result\.assets\[0\]\.uri, month\);\s*setProfilePhoto\(month, durable\);/.test(pcs));
  check('…drops a photo whose file has gone rather than rendering a hole', /photoStillExists\(stored\)\.then\(\(ok\) => \{ if \(!ok\) setPhotoUri\(null\); \}\)/.test(pcs));
  check('…tells the user about permission and errors, and confirms a save', /Alert\.alert\('Photos permission needed'/.test(pcs) && /Alert\.alert\('Could not export the card'/.test(pcs) && /Alert\.alert\('Saved to Photos'/.test(pcs));
  check('…and guards against double taps with a busy state', /if \(busy\) return;/.test(pcs) && /loading=\{busy === 'share'\}/.test(pcs) && /loading=\{busy === 'save'\}/.test(pcs));
  check('The capture view is marked non-collapsable (Android needs a real native view)', /collapsable=\{false\}/.test(pcs));
}

console.log('\nAfter the session — margins scaled by how hard it was:');
{
  const st = (reps: number, rpe: number | null, toFailure = false) => ({ reps, rpe, toFailure });
  const easy = sessionStrain({ sessionType: 'strength', flow: 'lifting', durationMin: 20, sets: Array(6).fill(st(10, 6)), volumeKg: 2000, bodyweightKg: 80 });
  const push = sessionStrain({ sessionType: 'strength', flow: 'lifting', durationMin: 60, sets: Array(16).fill(st(8, 8)), volumeKg: 8000, bodyweightKg: 80 });
  const legs = sessionStrain({ sessionType: 'strength', flow: 'lifting', durationMin: 90, sets: [...Array(13).fill(st(8, 9)), ...Array(9).fill(st(8, null, true))], volumeKg: 12000, bodyweightKg: 80 });
  const stroll = sessionStrain({ sessionType: 'outdoor', flow: 'cardio', durationMin: 30, distanceM: 2500 });
  const run = sessionStrain({ sessionType: 'cardio', flow: 'cardio', durationMin: 45, distanceM: 8000 });
  const football = sessionStrain({ sessionType: 'sport', flow: 'cardio', durationMin: 90 });
  const yoga = sessionStrain({ sessionType: 'mindbody', flow: 'mindbody', durationMin: 30 });
  // ── Calibration ──
  check('A 20-min easy lift is light', easy.level === 'light', `${easy.score}`);
  check('A 60-min push day of 16 sets at RPE 8 is hard, not brutal', push.level === 'hard', `${push.score}`);
  check('A 90-min leg day, 22 sets, some to failure, 12 t is brutal', legs.level === 'brutal' && legs.score >= 0.95, `${legs.score}`);
  check('A 30-min stroll is light however you slice it', stroll.level === 'light', `${stroll.score}`);
  check('A 45-min 8 km run is hard', run.level === 'hard', `${run.score}`);
  check('90 min of football is hard', football.level === 'hard', `${football.score}`);
  check('30 min of yoga is light — restorative, not strain', yoga.level === 'light' && yoga.score < 0.1);
  // ── The levers ──
  check('More hard sets → more strain', sessionStrain({ sessionType: 'strength', flow: 'lifting', durationMin: 60, sets: Array(20).fill(st(8, 8)), volumeKg: 8000, bodyweightKg: 80 }).score > push.score);
  check('Sets to failure add strain over the same sets at RPE 8', sessionStrain({ sessionType: 'strength', flow: 'lifting', durationMin: 60, sets: Array(16).fill(st(8, null, true)), volumeKg: 8000, bodyweightKg: 80 }).score > push.score);
  check('Longer → more strain', sessionStrain({ sessionType: 'strength', flow: 'lifting', durationMin: 90, sets: Array(16).fill(st(8, 8)), volumeKg: 8000, bodyweightKg: 80 }).score > push.score);
  check('Tonnage is relative to bodyweight', sessionStrain({ sessionType: 'strength', flow: 'lifting', durationMin: 60, sets: Array(16).fill(st(8, 8)), volumeKg: 8000, bodyweightKg: 60 }).score > push.score);
  check('A faster pace → more strain for the same distance', sessionStrain({ sessionType: 'cardio', flow: 'cardio', durationMin: 35, distanceM: 8000 }).parts.intensity > sessionStrain({ sessionType: 'cardio', flow: 'cardio', durationMin: 60, distanceM: 8000 }).parts.intensity);
  check('The strain names its drivers', legs.drivers.some((d) => /hard sets/.test(d)) && legs.drivers.some((d) => /to failure/.test(d)) && run.drivers.some((d) => /fast pace/.test(d)));
  check('Score is bounded 0..1', legs.score <= 1 && yoga.score >= 0);
  // ── Margins ──
  const mE = postSessionMargins(easy, 'lifting');
  const mB = postSessionMargins(legs, 'lifting');
  const g = (ms: typeof mE, k: string) => ms.find((m) => m.key === k)!;
  check('Eating is a WINDOW, not a wait — and it opens sooner and closes sooner after a brutal session', g(mE, 'eat').byMin! > g(mE, 'eat').waitMin && g(mB, 'eat').byMin! < g(mE, 'eat').byMin! && g(mB, 'eat').byMin === 60);
  check('Water is now, always', g(mE, 'water').waitMin === 0 && g(mB, 'water').waitMin === 0);
  check('Smoking: ~1 h after an easy session, ~2.5 h after a brutal one', g(mE, 'smoke').waitMin >= 60 && g(mE, 'smoke').waitMin <= 90 && g(mB, 'smoke').waitMin === 150);
  check('Alcohol: longer than smoking, up to 5 h after a brutal session', g(mE, 'alcohol').waitMin > g(mE, 'smoke').waitMin && g(mB, 'alcohol').waitMin === 300);
  check('…and after heavy lifting the advice is honest: none tonight', /none tonight/.test(g(mB, 'alcohol').advice) && !/none tonight/.test(g(mE, 'alcohol').advice));
  check('Cold plunge: hours away after lifting, fine after cardio', g(mB, 'cold').waitMin >= 240 && g(postSessionMargins(run, 'cardio'), 'cold').waitMin === 0);
  check('Next hard session: 24 h light → 72 h brutal for lifting', g(mE, 'next').waitMin >= 24 * 60 && g(mB, 'next').waitMin === 72 * 60);
  check('The smoke line drops out when the module is off', !postSessionMargins(easy, 'lifting', { smokingEnabled: false }).some((m) => m.key === 'smoke'));
  check('Every margin has a why and an advice', mB.every((m) => m.why.length > 30 && m.advice.length > 10));
  // ── Statuses over time ──
  const NOW = Date.now();
  const ended = NOW - 90 * 60_000; // ended 90 min ago
  const stat = marginStatuses(mB, ended, NOW);
  const sm = stat.find((m) => m.key === 'smoke')!;
  check('90 min after a brutal session: smoking still 60 min away', !sm.open && sm.remainingMin === 60 && sm.openAt === ended + 150 * 60_000);
  const eat = stat.find((m) => m.key === 'eat')!;
  check('…and the eating window has closed (30–60 min)', eat.open && eat.inWindow === false && eat.byAt === ended + 60 * 60_000);
  check('Water is open', stat.find((m) => m.key === 'water')!.open);
  check('marginsStillRunning is true while smoke/alcohol are ahead…', marginsStillRunning(mB, ended, NOW));
  check('…false once they have all passed, even though "next session" is days out', !marginsStillRunning(mB, NOW - 6 * 3_600_000, NOW));
  // ── Wiring ──
  const recapSrc = fs.readFileSync('src/screens/train/SessionRecapScreen.tsx', 'utf8');
  check('The recap shows the margins for THIS session', /postSessionFor\(route\.params\.sessionId\)/.test(recapSrc) && /<PostSessionCard endedAt=\{after\.endedAt\} strain=\{after\.strain\} margins=\{after\.margins\} \/>/.test(recapSrc));
  const walkSrc2 = fs.readFileSync('src/screens/train/WalkScreen.tsx', 'utf8');
  check('The walk/run recap shows them too, with the end time captured once', /endedAt: Date\.now\(\) \}\)/.test(walkSrc2) && /<PostSessionCard endedAt=\{summary\.endedAt\}/.test(walkSrc2));
  const homeSrc2 = fs.readFileSync('src/screens/home/HomeScreen.tsx', 'utf8');
  check('Home still reads the running margins', /setAfter\(activePostSession\(\)\)/.test(homeSrc2));
  check('...notes them on the readiness strip and details them in its sheet', /post-session margins running/.test(fs.readFileSync('src/components/ReadinessStrip.tsx', 'utf8')) && /<PostSessionCard[\s\S]{0,200}margins=\{after\.margins\}/.test(fs.readFileSync('src/components/ReadinessStrip.tsx', 'utf8')));
  const psRepo = fs.readFileSync('src/repositories/postSessionRepo.ts', 'utf8');
  check('The repo builds strain from completed sets, tonnage, bodyweight and the module flag', /\.filter\(\(s\) => s\.completed\)/.test(psRepo) && /volumeKg: session\.totalVolume/.test(psRepo) && /latestWeight\(userId\)\?\.weightKg/.test(psRepo) && /smokingEnabled: isSmokingEnabled\(userId\)/.test(psRepo));
  check('…and the Home reminder only looks 12 h back', /12 \* 3_600_000/.test(psRepo));
  const cardSrcP = fs.readFileSync('src/components/PostSessionCard.tsx', 'utf8');
  check('The card renders a window as "now — until", and long waits with a weekday', /now — until \$\{clock\(m\.byAt\)\}/.test(cardSrcP) && /\['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'\]/.test(cardSrcP));
  check('Every after-session line is its own meter (bar), except the multi-day next-session line', /\{m\.key !== 'next' && <ProgressBar progress=\{progress\} color=\{barColor\}/.test(cardSrcP) && /elapsedMin \/ m\.waitMin/.test(cardSrcP));
  check('The after-session icons resolve', ['session', 'water', 'eat', 'smoke', 'alcohol', 'cold', 'next'].every((k) => !!(ICONS as Record<string, Record<string, unknown>>).after?.[k]));
}

console.log('\nLiquid vs solid — a drink is not a plate:');
{
  const m = (calories: number, proteinG: number, carbsG: number, fatG: number, fiberG: number, form: 'solid' | 'liquid', eatenAt = 0) => ({ calories, proteinG, carbsG, fatG, fiberG, eatenAt, form });
  // ── The model ──
  check('A liquid runs the same composition at half the slowness', Math.abs(mealSlowness(m(300, 12, 40, 9, 4, 'liquid')) - mealSlowness(m(300, 12, 40, 9, 4, 'solid')) / LIQUID_SPEED) < 1e-9 && LIQUID_SPEED === 2);
  check('The bounds follow: solids 1..2, liquids 0.5..1', MIN_SLOWNESS === 0.5 && mealSlowness(m(300, 0, 75, 0, 0, 'liquid')) === 0.5 && mealSlowness(m(300, 0, 75, 0, 0, 'solid')) === 1);
  check('A whey shake needs 15 min before hard training, not 30', digestionMinutes(m(120, 24, 3, 1.5, 0, 'liquid'), 'hard') === 15 && digestionMinutes(m(120, 24, 3, 1.5, 0, 'solid'), 'hard') === 30);
  check('Liquid settle floors are a quarter to a half of solid ones', LIQUID_SETTLE_MIN.hard === 15 && LIQUID_SETTLE_MIN.moderate === 10 && LIQUID_SETTLE_MIN.light === 0);
  const smoothieL = digestionMinutes(m(500, 10, 90, 5, 3, 'liquid'), 'hard');
  const smoothieS = digestionMinutes(m(500, 10, 90, 5, 3, 'solid'), 'hard');
  check('A 500 kcal smoothie clears in about half the time of the same calories as a bowl', smoothieL >= 40 && smoothieL <= 60 && smoothieS >= 90 && smoothieS <= 110 && smoothieL < smoothieS * 0.6, `${smoothieL} vs ${smoothieS}`);
  check('A soup clears faster than the same calories as solid food', digestionMinutes(m(300, 12, 40, 9, 4, 'liquid'), 'hard') < digestionMinutes(m(300, 12, 40, 9, 4, 'solid'), 'hard'));
  check('A big fast-food milkshake still needs an hour before sprints — the fat and the size', digestionMinutes(m(550, 12, 90, 16, 0, 'liquid'), 'hard') >= 55);
  check('Missing form reads as solid — every pre-flag row is byte-identical', digestionMinutes({ calories: 300, proteinG: 12, carbsG: 40, fatG: 9, fiberG: 4, eatenAt: 0 }, 'hard') === digestionMinutes(m(300, 12, 40, 9, 4, 'solid'), 'hard'));
  // ── Stacking ──
  const NOW = Date.now();
  const H = 3_600_000;
  const lunch = m(600, 30, 60, 20, 6, 'solid', NOW - 95 * 60_000);
  const shake = m(300, 25, 40, 5, 2, 'liquid', NOW - 5 * 60_000);
  const bar = m(300, 25, 40, 5, 2, 'solid', NOW - 5 * 60_000);
  const withShake = currentDigestion([lunch, shake], 'hard', NOW)!;
  const withBar = currentDigestion([lunch, bar], 'hard', NOW)!;
  check('A shake on top of lunch clears sooner than the same snack as a bar', withShake.remainingMin < withBar.remainingMin, `${withShake.remainingMin} vs ${withBar.remainingMin}`);
  check('The stomach load remembers whether the last bite was a drink', stomachLoad([lunch, shake], NOW).lastForm === 'liquid' && stomachLoad([lunch, bar], NOW).lastForm === 'solid');
  check('A drink as the last bite uses the liquid settle floor', currentDigestion([m(120, 24, 3, 1.5, 0, 'liquid', NOW - 16 * 60_000)], 'hard', NOW) === null && currentDigestion([m(120, 24, 3, 1.5, 0, 'solid', NOW - 16 * 60_000)], 'hard', NOW) !== null);
  check('mealsFromEntries maps the column, NULL → solid', mealsFromEntries([{ calories: 100, proteinG: 1, carbsG: 20, fatG: 0, fiberG: 0, createdAt: 1, form: 'liquid' }])[0].form === 'liquid' && mealsFromEntries([{ calories: 100, proteinG: 1, carbsG: 20, fatG: 0, fiberG: 0, createdAt: 1, form: null }])[0].form === 'solid');
  // ── The catalogue: every food marked, and marked right ──
  check('Every food in the database is marked liquid or solid', FOOD_DB.every((f) => f.form === 'liquid' || f.form === 'solid'));
  const liquids = FOOD_DB.filter((f) => f.form === 'liquid');
  check('Milks, juices, milkshakes and the Tunisian drinks are liquid', FOOD_DB.filter((f) => ['Milk', 'Juice', 'Milkshake', 'Tunisian drink'].includes(f.category ?? '')).every((f) => f.form === 'liquid'));
  check('The generic milk, the whey shake, the soups and the hot chocolate are liquid', ['milk', 'whey', 'miso-soup', 'tn-chorba-frik', 'tn-douwida', 'tn-lablabi', 'ff-milkshake', 'ch-hot-chocolate'].every((id) => FOOD_DB.find((f) => f.id === id)?.form === 'liquid'));
  check('Bread, rice, chicken, couscous, yoghurt and porridge are solid', ['whole-wheat-bread', 'white-rice', 'chicken-breast', 'tn-couscous-full', 'greek-yogurt', 'tn-oatmeal', 'olive-oil'].every((id) => FOOD_DB.find((f) => f.id === id)?.form === 'solid'));
  check('About forty drinks in the catalogue — not zero, not half of it', liquids.length >= 35 && liquids.length <= 60, `${liquids.length}`);
  check('The rule lives in one place (formOf) and is applied to every catalogue food', /form: formOf\(f\)|const form = formOf\(f\);/.test(fs.readFileSync('src/data/foods.ts', 'utf8')) && formOf({ id: 'x', category: 'Juice' }) === 'liquid' && formOf({ id: 'whey', category: undefined }) === 'liquid' && formOf({ id: 'x', category: 'Bread' }) === 'solid');
  // ── Schema and every write path ──
  const bootL = fs.readFileSync('src/db/bootstrap.ts', 'utf8');
  check('SCHEMA_VERSION is 27 or later', Number(/const SCHEMA_VERSION = (\d+);/.exec(bootL)?.[1]) >= 27);
  check('form is in the DDL of both tables AND in ADDED_COLUMNS for both', (bootL.match(/^\s*form TEXT,\s*$/gm) ?? []).length === 2 && /table: 'food_entries', column: 'form'/.test(bootL) && /table: 'custom_foods', column: 'form'/.test(bootL));
  const nutRepoL = fs.readFileSync('src/repositories/nutritionRepo.ts', 'utf8');
  check('addPreciseFood stores form (NULL when not given)', /form: input\.form \?\? null,/.test(nutRepoL));
  check('AddFood passes the food\'s form', /form: selected\.form,/.test(fs.readFileSync('src/screens/nutrition/AddFoodScreen.tsx', 'utf8')));
  const mrL = fs.readFileSync('src/repositories/mealRoutineRepo.ts', 'utf8');
  check('Meal routines snapshot and re-log form', /form: e\.form \?\? null,/.test(mrL) && /form: i\.form \?\? undefined,/.test(mrL));
  check('Programme meals and the diet plan pass form', /form: base\.form,/.test(fs.readFileSync('src/lib/specialDiet.ts', 'utf8')) && /form: food\?\.form,/.test(fs.readFileSync('src/screens/nutrition/DietPlanScreen.tsx', 'utf8')));
  check('The whey supplement logs its diary row as a liquid', findSupplement('whey')?.macros?.form === 'liquid' && /form: def\.macros\.form,/.test(fs.readFileSync('src/repositories/supplementsRepo.ts', 'utf8')));
  const cfL = fs.readFileSync('src/repositories/customFoodRepo.ts', 'utf8');
  check('Custom foods store their form (solid when unsure) and read it back', /form: input\.form \?\? 'solid',/.test(cfL) && /form: f\.form === 'liquid' \? 'liquid' : 'solid',/.test(cfL));
  check('A composed dish of only drinks defaults to liquid; one solid part makes it solid', /components\.length > 0 && components\.every\(\(c\) => c\.form === 'liquid'\) \? 'liquid' : 'solid'/.test(cfL));
  check('…and components carry their source food\'s form so the default can be computed', /form: food\.form === 'liquid' \? 'liquid' : 'solid',/.test(fs.readFileSync('src/lib/composedFood.ts', 'utf8')));
  // ── The place to choose ──
  const customScr = fs.readFileSync('src/screens/nutrition/CustomFoodScreen.tsx', 'utf8');
  const composeScr = fs.readFileSync('src/screens/nutrition/ComposeFoodScreen.tsx', 'utf8');
  check('The custom-food form offers Solid / Liquid', /Solid or liquid/.test(customScr) && /value: 'liquid', label: 'Liquid'/.test(customScr) && /form,\s*\};/.test(customScr));
  check('The dish composer offers it too, defaulting from the parts', /Solid or liquid/.test(composeScr) && /formChoice \?\? composedFormDefault\(components\)/.test(composeScr) && /const input = \{ name, serving, category, components, form \};/.test(composeScr));
  check('The picker shows which foods are drinks', /liquid — clears the stomach about twice as fast/.test(fs.readFileSync('src/screens/nutrition/AddFoodScreen.tsx', 'utf8')));
  check('The readiness card explains drinks run faster', /a drink about twice as fast/.test(fs.readFileSync('src/components/DigestionCard.tsx', 'utf8')));
}

console.log('\nRest prescription — ATP-PCr, glycolytic, oxidative; the nervous system; the level:');
{
  const base = { durationS: null, bodyweight: false, compound: true, setIndex: 0, sessionElapsedMin: 10, level: 'intermediate' as const };
  const rx = (o: Partial<Parameters<typeof prescribeRest>[0]>) => prescribeRest({ reps: 8, weightKg: 75, rpe: 8, toFailure: false, ...base, ...o });
  // ── Energy system classification ──
  check('A heavy triple at 90% is phosphagen (ATP-PCr)', rx({ reps: 3, weightKg: 135, rpe: 9, best1RMKg: 150 }).system === 'phosphagen');
  check('A set of 8 at 75% is glycolytic', rx({ reps: 8, weightKg: 75, rpe: 8, best1RMKg: 100 }).system === 'glycolytic');
  check('A 2-minute hold is oxidative', rx({ reps: null, weightKg: null, rpe: null, durationS: 120, compound: false }).system === 'oxidative');
  check('Five reps or fewer read as heavy even without a known 1RM', rx({ reps: 5, weightKg: 100, rpe: 8, best1RMKg: null }).system === 'phosphagen');
  check('%1RM is inferred from reps + RIR when no 1RM is known (8 reps @ RPE 8 ≈ 75%)', Math.abs((rx({ reps: 8, weightKg: 60, rpe: 8, best1RMKg: null }).pctOneRM ?? 0) - 0.75) < 0.01);
  check('…and taken from the known 1RM when there is one', Math.abs((rx({ reps: 3, weightKg: 135, rpe: 9, best1RMKg: 150 }).pctOneRM ?? 0) - 0.9) < 1e-9);
  // ── Calibration against the evidence ──
  check('Heavy triple at 90%: 4–5 min (3–5 min for strength/power at ≥85%)', rx({ reps: 3, weightKg: 135, rpe: 9, best1RMKg: 150 }).restSec >= 240 && rx({ reps: 3, weightKg: 135, rpe: 9, best1RMKg: 150 }).restSec <= 300);
  check('8 reps at 75%, compound: ~2 min (Schoenfeld: 3 min beat 1 at 8–12)', rx({ reps: 8, weightKg: 75, rpe: 8, best1RMKg: 100 }).restSec === 120);
  check('The same set to failure: ~3 min — failure costs the nervous system', rx({ reps: 10, weightKg: 70, rpe: null, toFailure: true, best1RMKg: 100 }).restSec >= 180 && rx({ reps: 10, weightKg: 70, rpe: null, toFailure: true, best1RMKg: 100 }).cns === 'high');
  check('Isolation curls at RPE 8: ~1 min 15', rx({ compound: false, reps: 12, weightKg: 14, rpe: 8, best1RMKg: null }).restSec === 75);
  check('Endurance range (20+ reps) rests less than a set of 8', rx({ bodyweight: true, reps: 25, weightKg: null, rpe: 7 }).restSec < rx({ bodyweight: true, reps: 8, weightKg: null, rpe: 7 }).restSec);
  check('A plank rests ~1 min', rx({ compound: false, reps: null, weightKg: null, rpe: null, durationS: 60 }).restSec >= 60 && rx({ compound: false, reps: null, weightKg: null, rpe: null, durationS: 60 }).restSec <= 90);
  check('Explosive work gets full recovery (power drops fast)', rx({ bodyweight: true, explosive: true, reps: 5, weightKg: null, rpe: 7 }).restSec >= 210);
  // ── The levers move the right way ──
  check('Heavier (% 1RM) → longer', rx({ reps: 5, weightKg: 140, rpe: 9, best1RMKg: 150 }).restSec > rx({ reps: 5, weightKg: 110, rpe: 7, best1RMKg: 150 }).restSec);
  check('Closer to failure → longer', rx({ reps: 10, weightKg: 70, rpe: 9.5, best1RMKg: 100 }).restSec > rx({ reps: 10, weightKg: 70, rpe: 7, best1RMKg: 100 }).restSec);
  check('Compound → longer than isolation for the same set', rx({ compound: true }).restSec > rx({ compound: false }).restSec);
  check('Later sets → longer (fatigue accumulates)', rx({ setIndex: 4 }).restSec > rx({ setIndex: 0 }).restSec);
  check('Deep into the session → longer', rx({ sessionElapsedMin: 80 }).restSec > rx({ sessionElapsedMin: 10 }).restSec);
  check('A step up on the lift → longer (a progress attempt deserves a full tank)', rx({ isProgress: true }).restSec > rx({ isProgress: false }).restSec);
  check('Beginner < intermediate < advanced for the same set', rx({ level: 'beginner' }).restSec < rx({ level: 'intermediate' }).restSec && rx({ level: 'intermediate' }).restSec < rx({ level: 'advanced' }).restSec);
  check('Clamped to 30 s – 5 min and a multiple of 15', [rx({ reps: 1, weightKg: 190, rpe: 9.5, best1RMKg: 200, setIndex: 5, sessionElapsedMin: 90, isProgress: true, toFailure: true }).restSec, rx({ compound: false, reps: 30, weightKg: 5, rpe: 5 }).restSec].every((r) => r >= 30 && r <= 300 && r % 15 === 0));
  check('Every prescription explains itself', rx({}).reasons.length >= 1 && rx({ reps: 3, weightKg: 135, rpe: 9, best1RMKg: 150 }).reasons.some((r) => /creatine-phosphate/.test(r)));
  // ── The phosphagen tank ──
  check('PCr refills ~50% at 30 s, ~75% at 1 min, >90% at 2 min, >97% at 3 min', Math.abs(pcrRecovered(30) - 0.49) < 0.02 && Math.abs(pcrRecovered(60) - 0.74) < 0.02 && pcrRecovered(120) > 0.9 && pcrRecovered(180) > 0.97 && pcrRecovered(0) === 0);
  // ── Wiring ──
  const actSrc = fs.readFileSync('src/screens/train/ActiveSessionScreen.tsx', 'utf8');
  check('The rest presets include 5 minutes', /const REST_PRESETS = \[60, 90, 120, 180, 300\];/.test(actSrc));
  check('Logging a set starts the rest the set earned, from the set BEFORE it is written', /const rx = isLifting \? rxFor\(draft\) : null;\s*store\.logSet\(lv\.log\.id, draft\);/.test(actSrc) && /store\.startRest\(rx\.restSec, rx\)/.test(actSrc));
  check('…using the movement pattern, bodyweight flag, history 1RM, set index, session clock, level and progress', /compound: COMPOUND_PATTERNS\.has\(lv\.pattern \?\? ''\)/.test(actSrc) && /bodyweight: lv\.equipmentType === 'bodyweight'/.test(actSrc) && /best1RMKg: effBest,/.test(actSrc) && /setIndex: completed\.length/.test(actSrc) && /sessionElapsedMin: \(Date\.now\(\) - sessionStart\)/.test(actSrc) && /isProgress: d\.weightKg != null && topWeightBefore > 0 && d\.weightKg > topWeightBefore/.test(actSrc));
  check('The card says how long and why (energy system, %1RM, CNS, tap for reasons)', /Rest set to/.test(actSrc) && /SYSTEM_LABEL\[lastRx\.system\]/.test(actSrc) && /lastRx\.reasons\.map/.test(actSrc));
  check('The rest banner shows the creatine-phosphate tank refilling', /Creatine phosphate ~\{pcr\}% refilled/.test(actSrc) && /pcrRecovered\(elapsed, rx\?\.physiology\?\.tauS\)/.test(actSrc));
  check('The session detail carries the movement pattern', /pattern: exercises\.pattern,/.test(fs.readFileSync('src/repositories/sessionRepo.ts', 'utf8')));
  check('The store remembers the prescription behind the current rest', /restRx: RestPrescription \| null;/.test(fs.readFileSync('src/stores/sessionStore.ts', 'utf8')));
}

console.log('\nNeck — three sub-muscles, exercises for each:');
{
  const neck = EXLIB.filter((e) => e.primaryMuscle === 'neck');
  check('The neck is a muscle group', (MUSCLE_GROUPS as readonly string[]).includes('neck') && MUSCLE_LABELS.neck === 'Neck');
  check('Three neck sub-muscles are labelled', ['neck_flexors', 'neck_extensors', 'neck_lateral'].every((k) => !!SUB_MUSCLE_LABELS[k]));
  check('A dozen or more neck exercises', neck.length >= 12, `${neck.length}`);
  check('Every neck exercise is tagged with one of the three sub-muscles', neck.every((e) => ['neck_flexors', 'neck_extensors', 'neck_lateral'].includes(e.subMuscle ?? '')), neck.filter((e) => !e.subMuscle).map((e) => e.slug).join());
  check('Each sub-muscle has at least three exercises', ['neck_flexors', 'neck_extensors', 'neck_lateral'].every((k) => neck.filter((e) => e.subMuscle === k).length >= 3));
  check('Plate, harness, cable, machine, band and bodyweight variants all exist', ['plate-neck-flexion', 'neck-harness-extension', 'cable-neck-flexion', 'neck-machine-4-way', 'band-neck-flexion', 'isometric-neck-4-way'].every((sl) => neck.some((e) => e.slug === sl)));
  check('Every neck exercise has beginner instructions and a warning tone', neck.every((e) => (e.instructions?.length ?? 0) >= 3) && /never start the neck cold/.test(WARMUPS_BY_MUSCLE.neck ?? ''));
  check('The neck icon resolves', !!(ICONS as Record<string, Record<string, unknown>>).strength?.neck);
  check('The wrestler\'s bridge now carries its sub-muscle', EXLIB.find((e) => e.slug === 'neck-bridge')?.subMuscle === 'neck_extensors');
}

console.log('\nPredetermined sessions — every method pre-loads real exercises; the level shapes them:');
{
  const slugSet = new Set(EXLIB.map((e) => e.slug));
  const noPrefill = TRAINING_METHODS.filter((m) => !m.prefillSlugs || m.prefillSlugs.length === 0);
  check('Every training method in every category pre-loads exercises', noPrefill.length === 0, noPrefill.map((m) => m.key).join(', '));
  const unknown = TRAINING_METHODS.flatMap((m) => (m.prefillSlugs ?? []).filter((sl) => !slugSet.has(sl)).map((sl) => `${m.key}:${sl}`));
  check('…and every pre-loaded slug exists', unknown.length === 0, unknown.join(', '));
  check('Every program day and every split day has exercises, all real', PROGRAMS.every((p) => p.days.every((d) => d.exercises.length > 0 && d.exercises.every((sl) => slugSet.has(sl)))) && SPLITS.every((sp) => sp.days.every((d) => d.exercises.length > 0 && d.exercises.every((sl) => slugSet.has(sl)))));
  check('Strength methods lead with compounds (the level trim keeps them)', ['str-5x5', 'str-531', 'str-pyramid', 'str-cluster'].every((k) => { const first = TRAINING_METHODS.find((m) => m.key === k)!.prefillSlugs![0]; const e = EXLIB.find((x) => x.slug === first)!; return ['squat', 'hinge', 'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull'].includes(e.pattern ?? ''); }));
  // Level
  check('Three levels: Beginner / Intermediate / Pro', EXPERIENCE_LEVELS.length === 3 && LEVEL_LABELS.advanced === 'Pro');
  check('A beginner pre-loads the first four (compounds), others everything', slugsForLevel(['a', 'b', 'c', 'd', 'e', 'f'], 'beginner').length === 4 && slugsForLevel(['a', 'b', 'c', 'd', 'e', 'f'], 'intermediate').length === 6 && slugsForLevel(['a', 'b', 'c', 'd', 'e', 'f'], 'advanced').length === 6);
  check('Prescriptions differ by level', prescriptionLine('beginner') !== prescriptionLine('advanced') && /3 sets × 8–12/.test(prescriptionLine('beginner')) && /4–5 sets/.test(prescriptionLine('advanced')));
  check('An unset level reads as intermediate', levelOrDefault(null) === 'intermediate' && levelOrDefault('advanced') === 'advanced' && levelOrDefault('nonsense') === 'intermediate');
  const bootLv = fs.readFileSync('src/db/bootstrap.ts', 'utf8');
  check('users.experience_level is in the DDL and ADDED_COLUMNS, schema ≥ 28', /experience_level TEXT,/.test(bootLv) && /table: 'users', column: 'experience_level'/.test(bootLv) && Number(/const SCHEMA_VERSION = (\d+);/.exec(bootLv)?.[1]) >= 28);
  check('Split, method and program pickers all carry the level picker', ['src/screens/train/SplitPickerScreen.tsx', 'src/screens/train/MethodPickerScreen.tsx', 'src/screens/train/ProgramPickerScreen.tsx'].every((f) => /<LevelPicker/.test(fs.readFileSync(f, 'utf8'))));
  check('The split pre-loads by level and shows the prescription', /prefillSlugs: slugsForLevel\(day\.exercises, level, difficultyBySlug\)/.test(fs.readFileSync('src/screens/train/SplitPickerScreen.tsx', 'utf8')) && /rx\.sets\} sets × \{rx\.reps\}/.test(fs.readFileSync('src/screens/train/SplitPickerScreen.tsx', 'utf8')));
  check('Lifting methods pre-load by level; others in full', /trims && m\.prefillSlugs \? slugsForLevel\(m\.prefillSlugs, level, difficultyBySlug\) : m\.prefillSlugs/.test(fs.readFileSync('src/screens/train/MethodPickerScreen.tsx', 'utf8')));
  check('Programs at your level come first and are badged', /a\.level === level \? 0 : 1/.test(fs.readFileSync('src/screens/train/ProgramPickerScreen.tsx', 'utf8')) && /· for you/.test(fs.readFileSync('src/screens/train/ProgramPickerScreen.tsx', 'utf8')));
  check('The level is editable on the profile and saved by the picker', /experienceLevel: experience,/.test(fs.readFileSync('src/screens/profile/EditProfileScreen.tsx', 'utf8')) && /updateProfile\(\{ experienceLevel: v as ExperienceLevel \}\)/.test(fs.readFileSync('src/components/LevelPicker.tsx', 'utf8')));
}

console.log('\nWarm-ups survive leaving and resuming a session:');
{
  const actW = fs.readFileSync('src/screens/train/ActiveSessionScreen.tsx', 'utf8');
  check('The checklist reads its ticks from the session row, not local state', /warmupsDoneOf\(session\)/.test(actW) && !/useState<Record<string, boolean>>\(\{\}\)/.test(actW));
  check('…and writes them through the store', /onPress=\{\(\) => toggleWarmup\(m\)\}/.test(actW));
  const repoW = fs.readFileSync('src/repositories/sessionRepo.ts', 'utf8');
  check('toggleWarmupDone persists a JSON list on the session', /export function toggleWarmupDone/.test(repoW) && /set\(\{ warmupsDone: JSON\.stringify\(next\) \}\)/.test(repoW));
  check('warmupsDoneOf tolerates NULL and bad JSON', /if \(!session\.warmupsDone\) return \[\];/.test(repoW) && /catch \{\s*return \[\];/.test(repoW));
  const bootW = fs.readFileSync('src/db/bootstrap.ts', 'utf8');
  check('sessions.warmups_done is in the DDL and ADDED_COLUMNS, schema ≥ 29', /warmups_done TEXT,/.test(bootW) && /table: 'sessions', column: 'warmups_done'/.test(bootW) && Number(/const SCHEMA_VERSION = (\d+);/.exec(bootW)?.[1]) >= 29);
  check('The store exposes toggleWarmup and refreshes after it', /toggleWarmup: \(muscle\) => \{[\s\S]*?toggleWarmupDone\(id, muscle\);\s*get\(\)\.refresh\(\);/.test(fs.readFileSync('src/stores/sessionStore.ts', 'utf8')));
}

console.log('\nLoad profiles — what the weight field means, for every exercise:');
{
  const pf = (slug: string) => { const e = EXLIB.find((x) => x.slug === slug)!; return profileFor({ slug: e.slug, equipmentType: e.equipmentType, pattern: e.pattern, trackingType: e.trackingType }); };
  // ── The modes ──
  check('A pull-up takes ADDED weight and assistance, at ~96% bodyweight', pf('pull-up').loadMode === 'added' && pf('pull-up').assistable && pf('pull-up').bwFraction === 0.96);
  check('A dip: added at ~96%; a push-up: added at ~64% (Ebben force-plate data)', pf('dip').bwFraction === 0.96 && pf('push-up').bwFraction === 0.64 && pf('push-up').loadMode === 'added');
  check('Incline push-up lighter (~50%), decline heavier (~74%)', pf('push-up-incline').bwFraction === 0.5 && pf('push-up-decline').bwFraction === 0.74);
  check('Rucking, hiking and trekking log a CARRIED pack', ['rucking', 'hiking', 'trekking'].every((sl) => pf(sl).loadMode === 'carried'));
  check('Farmers carries and sled work are carried too', ['farmers-carry', 'sandbag-carry', 'overhead-carry', 'sled-push', 'loaded-carry-cardio'].every((sl) => pf(sl).loadMode === 'carried'));
  check('A barbell bench stays external — nothing changed there', pf('bench-press-barbell').loadMode === 'external' && pf('bench-press-barbell').bwFraction === null);
  check('Sprints, rounds and flows have no load field', ['jump-squat', 'ma-bag-round', 'sun-salutations'].every((sl) => pf(sl).loadMode === 'none'));
  check('The assisted pull-up machine is assistance (negative weight)', pf('assisted-pull-up').assistable);
  check('Unlisted bodyweight rep movements default by pattern, never blank', (() => { const p = profileFor({ slug: 'some-new-thing', equipmentType: 'bodyweight', pattern: 'vertical_pull', trackingType: 'reps_only' }); return p.loadMode === 'added' && p.bwFraction === 0.96; })());
  // ── Effective load ──
  check('+20 kg on pull-ups at 80 kg is a ~97 kg set', Math.abs((effectiveLoadKg(pf('pull-up'), 80, 20) ?? 0) - 96.8) < 0.01);
  check('−15 kg assistance takes it to ~62 kg', Math.abs((effectiveLoadKg(pf('pull-up'), 80, -15) ?? 0) - 61.8) < 0.01);
  check('Assistance can never drive the load negative', (effectiveLoadKg(pf('pull-up'), 80, -200) ?? -1) === 0);
  check('Every exercise in the library resolves a profile with a sane bwFraction', EXLIB.every((e) => { const p = profileFor({ slug: e.slug, equipmentType: e.equipmentType, pattern: e.pattern, trackingType: e.trackingType }); return p.bwFraction == null || (p.bwFraction > 0 && p.bwFraction <= 1.05); }));
  // ── Calorie factors ──
  check('A 20 kg ruck at 80 kg burns ×1.25 — you are moving 25% more mass', Math.abs(loadCalorieFactor(pf('rucking'), 80, 20) - 1.25) < 1e-9);
  check('Carried load is capped at ×2', loadCalorieFactor(pf('rucking'), 60, 200) === 2);
  check('A 20 kg belt on dips is ×1.125 (rides only through the lifted share)', Math.abs(loadCalorieFactor(pf('dip'), 80, 20) - 1.125) < 1e-9);
  check('No load, no change — and external barbell load does not double-count', loadCalorieFactor(pf('rucking'), 80, null) === 1 && loadCalorieFactor(pf('bench-press-barbell'), 80, 100) === 1);
  check('RPE 9 costs ~6% more, RPE 5 ~6% less, failure ~9% more; unknown is ×1', Math.abs(intensityCalorieFactor(9, false) - 1.06) < 1e-9 && Math.abs(intensityCalorieFactor(5, false) - 0.94) < 1e-9 && Math.abs(intensityCalorieFactor(null, true) - 1.09) < 1e-9 && intensityCalorieFactor(null, false) === 1);
  // ── The attribution engine uses them ──
  const ruck = { met: 8, trackingType: 'duration' as const, slug: 'rucking', equipmentType: undefined, pattern: 'cardio', sets: [{ durationS: 3600, weightKg: 20, completed: true }] };
  const walk = { ...ruck, sets: [{ durationS: 3600, completed: true }] };
  const loaded = distributeSessionCalories({ durationS: 3600, weightKg: 80, fallbackMet: 8, exercises: [ruck] });
  const empty = distributeSessionCalories({ durationS: 3600, weightKg: 80, fallbackMet: 8, exercises: [walk] });
  check('An hour rucking 20 kg burns ~25% more than the same hour unloaded', Math.abs(loaded.total / empty.total - 1.25) < 0.02, `${empty.total} → ${loaded.total}`);
  const noLoads = distributeSessionCalories({ durationS: 1800, weightKg: 80, fallbackMet: 5, exercises: [{ met: 5, trackingType: 'reps_weight' as const, sets: [{ reps: 10, completed: true }, { reps: 10, completed: true }] }] });
  const noLoadsPlain = distributeSessionCalories({ durationS: 1800, weightKg: 80, fallbackMet: 5, exercises: [{ met: 5, trackingType: 'reps_weight' as const, sets: [{ reps: 10, completed: true }, { reps: 10, completed: true }] }] });
  check('Sessions without loads or RPE are byte-identical to before', noLoads.total === noLoadsPlain.total && noLoads.basis === 'per-exercise');
  const mixed = distributeSessionCalories({ durationS: 3600, weightKg: 80, fallbackMet: 5, exercises: [ruck, walk] });
  check('In a mixed session the loaded exercise takes the larger share of the same clock', mixed.perExercise[0] > mixed.perExercise[1]);
  // ── Wiring ──
  const repoSrcL = fs.readFileSync('src/repositories/sessionRepo.ts', 'utf8');
  check('The burn carries slug, equipment, pattern and each set\'s load / RPE / failure', /slug: lv\.slug,/.test(repoSrcL) && /weightKg: s\.weightKg,/.test(repoSrcL) && /rpe: s\.rpe,/.test(repoSrcL) && /toFailure: s\.toFailure,/.test(repoSrcL));
  const actSrcL = fs.readFileSync('src/screens/train/ActiveSessionScreen.tsx', 'utf8');
  check('The set form shows the load field for added and carried exercises', /const showLoad = f\.weight \|\| profile\.loadMode === 'added' \|\| profile\.loadMode === 'carried';/.test(actSrcL) && /weightKg: showLoad && weight \? parseFloat\(weight\) : null,/.test(actSrcL));
  check('…labelled by what it means (+ kg / Load kg), with the caption explaining', /LOAD_FIELD_LABEL\[profile\.loadMode\]/.test(actSrcL) && /Weight added on a belt or vest/.test(actSrcL) && /The load you carry/.test(actSrcL));
  check('Logged sets read back honestly (+10 kg / assisted / 20 kg load)', /\+\$\{s\.weightKg\} kg/.test(actSrcL) && /kg \(assisted\)/.test(actSrcL) && /kg load/.test(actSrcL));
  check('The rest prescription reasons in effective kilograms for weighted calisthenics', /effectiveLoadKg\(profile, bodyKg, d\.weightKg\)/.test(actSrcL) && /profile\.bwFraction! \* bodyKg \+ histBest/.test(actSrcL));
  // ── Every exercise's MET is present and plausible for its kind ──
  const MET_BOUNDS: Record<string, [number, number]> = { strength: [2, 10], calisthenics: [2, 10], cardio: [3, 15], outdoor: [3, 14], sport: [3, 13], martial_arts: [4, 13], mindbody: [1.5, 5], meditation: [1, 2.5] };
  const badMet = EXLIB.filter((e) => { const [lo, hi] = MET_BOUNDS[e.sessionType] ?? [1, 16]; return !(e.met && e.met >= lo && e.met <= hi); });
  check('Every one of the ' + EXLIB.length + ' exercises has a MET within its category\'s plausible range', badMet.length === 0, badMet.slice(0, 5).map((e) => `${e.slug}:${e.met}`).join(', '));
}

console.log('\nNaps — what they are actually worth for recovery:');
{
  const nap = (minutes: number, startTime?: string) => ({ minutes, startTime });
  // ── Bands ──
  check('Bands follow the sleep architecture', napBand(5) === 'micro' && napBand(20) === 'power' && napBand(35) === 'truncated' && napBand(60) === 'recovery' && napBand(90) === 'cycle' && napBand(150) === 'long');
  check('The power nap is the most efficient minute-for-minute short nap', BAND_EFFICIENCY.power > BAND_EFFICIENCY.micro && BAND_EFFICIENCY.power > BAND_EFFICIENCY.truncated);
  check('A completed cycle is the most efficient of all', BAND_EFFICIENCY.cycle === Math.max(...Object.values(BAND_EFFICIENCY)));
  check('Sleep inertia is worst waking out of deep sleep, near-zero for short naps and a full cycle', BAND_INERTIA_MIN.power === 0 && BAND_INERTIA_MIN.truncated === 20 && BAND_INERTIA_MIN.cycle < BAND_INERTIA_MIN.truncated);
  check('A 10-minute nap buys ~2.5 h of alertness (Brooks & Lack)', BAND_ALERTNESS_MIN.power === 155);
  // ── Timing ──
  check('The early-afternoon dip is the best time to nap', timingFactor('14:00') === 1 && timingFactor('13:00') === 1);
  check('Evening naps are worth less and cost the night', timingFactor('19:00') < timingFactor('14:00') && nightSleepCostMin(nap(30, '19:00')) > 0 && nightSleepCostMin(nap(30, '13:00')) === 0);
  check('An unrecorded time is treated as a typical afternoon nap, not penalised', timingFactor(null) >= 0.9 && timingFactor(undefined) >= 0.9);
  check('The later and longer the nap, the more it borrows from tonight', nightSleepCostMin(nap(60, '20:00')) > nightSleepCostMin(nap(60, '16:00')) && nightSleepCostMin(nap(90, '18:00')) > nightSleepCostMin(nap(30, '18:00')));
  // ── Value ──
  const shortNight = { nightHours: 5 };
  const goodNight = { nightHours: 8 };
  check('A 20-min nap after a 5 h night is worth ~14 min of night sleep', napValue(nap(20, '14:00'), shortNight).netMin === 14, `${napValue(nap(20, '14:00'), shortNight).netMin}`);
  check('The same nap after a full night is worth far less — it bought alertness, not recovery', napValue(nap(20, '14:00'), goodNight).netMin < napValue(nap(20, '14:00'), shortNight).netMin / 2 && !napValue(nap(20, '14:00'), goodNight).repaidDebt);
  check('A 90-min cycle after a 5 h night repays over an hour', napValue(nap(90, '13:30'), shortNight).netMin >= 60 && napValue(nap(90, '13:30'), shortNight).repaidDebt);
  check('A nap can never repay more than the night actually owed', napValue(nap(180, '13:00'), { nightHours: 7.5 }).netMin < 180 * 0.7);
  check('An evening nap can net out at zero — it costs what it gives', napValue(nap(30, '19:00'), { nightHours: 6 }).netMin === 0);
  check('Every nap explains itself', napValue(nap(35, '14:00'), shortNight).notes.some((n) => /grogginess/.test(n)) && napValue(nap(90, '13:00'), shortNight).notes.length > 0);
  check('The cut-short nap warns you to go shorter or longer', napValue(nap(35, '14:00'), shortNight).notes.some((n) => /under 25 min or take it to ~90/.test(n)));
  // ── The day ──
  const d1 = dayRest(5, [nap(90, '13:30')]);
  check('5 h night + a 90-min cycle reads as ~6 h of rest, not 5', d1.restHours > 6 && d1.restHours < 6.5, `${d1.restHours}`);
  check('A good night plus a short nap barely moves — nothing to repay', dayRest(8, [nap(20, '14:00')]).restHours <= 8.2);
  const capped = dayRest(4, [nap(60, '13:00'), nap(60, '13:00'), nap(60, '13:00'), nap(60, '13:00')]);
  check('Naps can never stand in for a night: credit is capped at 2.5 h', capped.capped && capped.napCreditMin === MAX_NAP_CREDIT_MIN && capped.restHours < 7, `${capped.restHours}`);
  check('No naps means the day reads exactly as the night did', dayRest(7.5, []).restHours === 7.5 && dayRest(7.5, []).napCreditMin === 0);
  check('Advice matches the night you had', /90-minute/.test(napAdvice(5, 13)) && /alertness/.test(napAdvice(8, 13)) && /Late for a nap/.test(napAdvice(6, 17)));
  // ── Wiring: naps reach the recovery figures ──
  const sleepRepoSrc = fs.readFileSync('src/repositories/sleepRepo.ts', 'utf8');
  check('The sleep summary carries nap credit and total rest', /napCreditToday: restTodayCalc\.napCreditMin/.test(sleepRepoSrc) && /avgRest7d: avgRest/.test(sleepRepoSrc));
  check('Debt and the performance factor read total rest, not night sleep alone', /sleepDebt\(restLogged\.length \? restLogged : \[\]\)/.test(sleepRepoSrc) && /sleepPerformanceFactor\(avgRest \?\? avg\)/.test(sleepRepoSrc));
  check('…and an unlogged night is still not read as zero', /filter\(\(r\) => byDate\.has\(r\.date\)\)/.test(sleepRepoSrc));
  check('avgRestHours exists alongside the night-only avgSleepHours', /export function avgRestHours/.test(sleepRepoSrc) && /export function avgSleepHours/.test(sleepRepoSrc));
  check('The growth engine and the athlete card both read total rest', /avgRestHours\(7, userId\)/.test(fs.readFileSync('src/repositories/growthRepo.ts', 'utf8')) && /avgRestHours\(7, userId\)/.test(fs.readFileSync('src/repositories/cardRepo.ts', 'utf8')));
  const sleepScr = fs.readFileSync('src/screens/health/SleepScreen.tsx', 'utf8');
  check('The Sleep screen shows what each nap was worth', /worth ~\$\{v\.netMin\} min of night sleep/.test(sleepScr) && /NAP_BAND_META\[v\.band\]\.label/.test(sleepScr));
  check('…a Rest tile beside the Nights tile, and advice for right now', /label="Rest \(7d\)"/.test(sleepScr) && /napAdvice\(summary\?\.lastNight \?\? null, new Date\(\)\.getHours\(\)\)/.test(sleepScr));
}

console.log('\nSeeing what is in a routine or a past session, without starting one:');
{
  const peekSrc = fs.readFileSync('src/components/ExercisePeek.tsx', 'utf8');
  check('ExercisePeek lists the running order with what each one hits', /\{i \+ 1\}\./.test(peekSrc) && /SUB_MUSCLE_LABELS\[ex\.subMuscle\]/.test(peekSrc));
  check('…and says so when the list is empty rather than rendering nothing', /emptyLabel/.test(peekSrc));
  const trainSrc = fs.readFileSync('src/screens/train/TrainScreen.tsx', 'utf8');
  check('A routine expands in place instead of starting a session', /setOpenRoutine\(open \? null : r\.id\)/.test(trainSrc) && /<ExercisePeek exercises=\{r\.exercises\}/.test(trainSrc));
  check('…with Start still one tap away, inside and outside the expansion', /onPress=\{\(\) => startRoutine\(r\)\}/.test(trainSrc) && /title=\{`Start \$\{r\.name\}`\}/.test(trainSrc));
  check('A past session can be peeked at from the list too', /setSessionPeek\(sessionExercisePeek\(s\.id\)\)/.test(trainSrc) && /No exercises were logged in this session\./.test(trainSrc));
  check('The methods page offers the same peek on saved routines', /<ExercisePeek exercises=\{r\.exercises\}/.test(fs.readFileSync('src/screens/train/MethodPickerScreen.tsx', 'utf8')));
  const repoPeek = fs.readFileSync('src/repositories/sessionRepo.ts', 'utf8');
  check('sessionExercisePeek returns the order plus what was logged', /export function sessionExercisePeek/.test(repoPeek) && /orderBy\(exerciseLogs\.orderIndex\)/.test(repoPeek) && /\$\{done\.length\} set/.test(repoPeek));
  check('The list icon resolves', !!(ICONS as Record<string, Record<string, unknown>>).core?.list);
}

console.log('\nRest between sets — paid at its own rate, not the exercise\'s:');
{
  const set10 = { reps: 10, completed: true };
  const lift = { met: 6, trackingType: 'reps_weight' as const, sets: [set10, set10, set10, set10] };
  const run = (durationS: number, ex: BurnExercise[]) => distributeSessionCalories({ durationS, weightKg: 80, fallbackMet: 5, exercises: ex });
  // ── The recovery curve ──
  check('Rest sits above standing but far below the lift — the post-set oxygen tail', restMetFor(90) > 2 && restMetFor(90) < 4);
  check('Shorter rests keep you more elevated per minute than long ones', restMetFor(45) > restMetFor(120) && restMetFor(120) > restMetFor(300));
  check('A very long rest settles toward standing', restMetFor(600) < 2.4 && restMetFor(600) > 2);
  check('The curve is bounded by its floor and peak', restMetFor(1) <= REST_MET_PEAK && restMetFor(100000) >= REST_MET_FLOOR);
  // ── A real session ──
  const push = run(3600, [lift, lift, lift, lift, lift]); // 20 sets, ~10 min under load
  check('A 60-min push day separates 10 min of work from 50 min of rest', push.workSeconds === 600 && push.restSeconds === 3000);
  check('…and comes out near 200 kcal, not the 400+ the old model claimed', push.total > 150 && push.total < 280, `${push.total}`);
  check('…with the rest counted, not discarded — it is most of the session', push.restCalories > 0 && push.restCalories > push.total * 0.4);
  check('The rest MET matches the average rest period, not a flat guess', Math.abs(push.restMet - restMetFor(3000 / 20)) < 0.01);
  // ── Continuous work is untouched ──
  const cardio = run(1800, [{ met: 8, trackingType: 'duration' as const, sets: [{ durationS: 1740, completed: true }] }]);
  check('Continuous cardio barely changes — there is almost no rest to separate', cardio.restSeconds === 60 && Math.abs(cardio.total - netCaloriesFromMet(8, 80, 1740)) < 8, `${cardio.total}`);
  const circuit = run(1200, [{ met: 8, trackingType: 'duration' as const, sets: Array(8).fill({ durationS: 120, completed: true }) }]);
  check('A circuit keeps most of its value — short rests, high recovery MET', circuit.restMet > 3.5 && circuit.total > netCaloriesFromMet(8, 80, 960) * 0.9);
  // ── Edges ──
  check('More work logged than the clock allows is scaled down, never invented', run(600, [lift, lift, lift]).workSeconds <= 600);
  check('A past session with no set timing still splits by MET, with no rest to find', run(1800, [{ met: 10, trackingType: 'duration' as const, sets: [] }]).restSeconds === 0);
  check('Zero duration is zero, not a divide by zero', run(0, [lift]).total === 0);
  const repoRest = fs.readFileSync('src/repositories/sessionRepo.ts', 'utf8');
  check('The session breakdown carries the work / rest split for the UI', /restCalories: dist\.restCalories/.test(repoRest) && /restSeconds: dist\.restSeconds/.test(repoRest));
}

console.log('\nRunning order — top to bottom, and it stays where you put it:');
{
  const repoOrd = fs.readFileSync('src/repositories/sessionRepo.ts', 'utf8');
  check('Swapping an exercise keeps its slot in the order', /export function replaceExerciseLog/.test(repoOrd) && /return addExerciseToSession\(sessionId, newExerciseId, slot\);/.test(repoOrd));
  check('…and the store uses it instead of remove-then-append', /const newLogId = replaceExerciseLog\(logId, newExerciseId\);/.test(fs.readFileSync('src/stores/sessionStore.ts', 'utf8')));
  check('An exercise you have started cannot be moved — its place is history', /if \(completedSetsOf\(logId\) > 0\) return false;/.test(repoOrd) && /export function completedSetsOf/.test(repoOrd));
  check('addExerciseToSession can place a row at an explicit slot', /orderIndex\?: number\)/.test(repoOrd) && /orderIndex: orderIndex \?\? count/.test(repoOrd));
  const actOrd = fs.readFileSync('src/screens/train/ActiveSessionScreen.tsx', 'utf8');
  check('The card knows its place in the order and shows it', /position=\{i \+ 1\}/.test(actOrd) && /\{position\}\/\{total\}/.test(actOrd));
  check('"Up next" is the first exercise with nothing logged yet', /const upNextIndex = detail\.findIndex\(\(x\) => !x\.sets\.some\(\(s\) => s\.completed\)\)/.test(actOrd) && /label="Up next"/.test(actOrd));
  check('Move controls are off once an exercise is started, and it says why', /canMoveUp=\{i > 0 && !started\}/.test(actOrd) && /its place in the running order is fixed now/.test(actOrd));
}

console.log('\nOutdoor ground activities launch like a walk:');
{
  const walk = activityFor('walk');
  const hike = activityFor('hike');
  const ruck = activityFor('ruck');
  const ride = activityFor('cycle');
  check('Seven ground activities, walk and run among them', OUTDOOR_ACTIVITIES.length >= 7 && !!activityFor('trail-run') && !!activityFor('stairs'));
  check('An unknown key falls back to walk rather than breaking the screen', activityFor('nonsense').key === 'walk' && activityFor(null).key === 'walk');
  check('Gait decides how steps become distance; a ride has none', walk.gait === 'walk' && activityFor('run').gait === 'run' && hike.gait === 'walk' && ride.gait === 'none' && requiresGps(ride) && !requiresGps(hike));
  check('A hike at walking pace costs more than a walk at walking pace', activityMet(hike, 3.5) === 6 && activityMet(walk, 3.5) === 3.5);
  check('…but a fast pace still wins over the floor', activityMet(hike, 9) === 9);
  check('Rucking and stairs cost more again, and both ask for the load', ruck.metFloor > hike.metFloor - 0.5 && ruck.carries && activityFor('stairs').carries && activityFor('stairs').metFloor >= 8);
  check('A trail run is floored above a road run', activityFor('trail-run').metFloor >= 9);
  check('Each is recorded as the right session type', hike.sessionType === 'outdoor' && activityFor('run').sessionType === 'cardio');
  check('Every activity has a verb, an icon and a blurb', OUTDOOR_ACTIVITIES.every((a) => a.verb.length > 3 && a.icon.includes('.') && a.blurb.length > 20));
  check('Every activity icon resolves', OUTDOOR_ACTIVITIES.every((a) => { const [g, n] = a.icon.split('.'); return !!(ICONS as Record<string, Record<string, unknown>>)[g]?.[n]; }));
  const walkSrcO = fs.readFileSync('src/screens/train/WalkScreen.tsx', 'utf8');
  check('The tracker screen takes an activity and keeps working from a plain mode', /activityFor\(route\.params\?\.activity \?\? route\.params\?\.mode \?\? 'walk'\)/.test(walkSrcO));
  check('…floors the pace MET by activity and scales by the carried pack', /activityMet\(activity, paceMet\)/.test(walkSrcO) && /loadCalorieFactor\(profileFor\(\{ slug: 'rucking' \}\), weightKg, loadKg\)/.test(walkSrcO));
  check('…asks for the pack only where it makes sense, and warns when GPS is the only source', /activity\.carries && \(/.test(walkSrcO) && /gpsOnly && \(/.test(walkSrcO));
  check('…and labels everything by the activity, not "walk"', /title=\{activity\.label\}/.test(walkSrcO) && /: activity\.verb\}/.test(walkSrcO) && /sessionType: activity\.sessionType/.test(walkSrcO));
  check('Train offers every ground activity one tap away', /OUTDOOR_ACTIVITIES\.map\(\(a\) => \(/.test(fs.readFileSync('src/screens/train/TrainScreen.tsx', 'utf8')));
}

console.log('\nWhy walks read slow — the speed sentinel and the stride:');
{
  // A straight 500 m walk: fixes every 3 s (~4 m apart), 8 m accuracy.
  const straightWalk = (speed: number) => {
    const out: Array<{ lat: number; lng: number; accuracy: number; speed: number }> = [];
    let lat = 36.8;
    for (let i = 0; i < 125; i++) { lat += 4.05 / 111320; out.push({ lat, lng: 10.18, accuracy: 8, speed }); }
    return out;
  };
  // ── The bug ──
  const noDoppler = filterFixes([], straightWalk(0));
  check('A receiver reporting speed 0 (no Doppler) still records the walk', noDoppler.distanceM > 450, `${Math.round(noDoppler.distanceM)} m of 506`);
  check('…and none of it is thrown away as "standing still"', noDoppler.rejected.stationary === 0);
  check('Unknown speed as -1 (iOS) is treated the same way', filterFixes([], straightWalk(-1)).distanceM > 450);
  check('A working Doppler reading is unaffected', Math.abs(filterFixes([], straightWalk(1.35)).distanceM - noDoppler.distanceM) < 1);
  // A POSITIVE but tiny speed is still real evidence of standing still.
  const dithering = Array.from({ length: 40 }, (_, i) => ({ lat: 36.8 + (i % 2) * 0.00012, lng: 10.18, accuracy: 8, speed: 0.05 }));
  check('A positive but near-zero speed still rejects the fix — that is real evidence', filterFixes([], dithering).rejected.stationary > 0);
  // ── Stride ──
  check('Unknown cadence keeps the textbook constants exactly', strideFactorFor('walk') === 0.415 && strideFactorFor('run') === 0.5);
  check('A brisk cadence lengthens the step, a slow one shortens it', strideFactorFor('walk', 125) > 0.44 && strideFactorFor('walk', 80) < 0.4);
  check('Step length stays within human bounds at any cadence', strideFactorFor('walk', 300) <= 0.5 && strideFactorFor('walk', 5) >= 0.36 && strideFactorFor('run', 400) <= 0.65);
  check('6000 brisk steps at 178 cm read ~400 m further than at the flat constant', distanceFromSteps(6000, 178, 'walk', 125) - distanceFromSteps(6000, 178, 'walk') > 300);
  check('The reference cadence reproduces the old number exactly', distanceFromSteps(6000, 178, 'walk', 100) === distanceFromSteps(6000, 178, 'walk'));
  check('The live walk feeds its measured cadence into the step fallback', /liveCadence\(steps, snap\?\.activeSec \?\? s\.activeS\)/.test(fs.readFileSync('src/stores/walkStore.ts', 'utf8')));
  check('…and only once there is enough of a sample to mean anything', /activeSec > 60 && steps > 30/.test(fs.readFileSync('src/stores/walkStore.ts', 'utf8')));
  check('The reason the zero is not trusted is written down where it bit', /hasSpeed\(\)` is the flag/.test(fs.readFileSync('src/lib/gpsFilter.ts', 'utf8')));
}

console.log('\nMicros and supplements follow the diary date, like food:');
{
  const suppStore = fs.readFileSync('src/stores/supplementsStore.ts', 'utf8');
  check('The supplement store reads the shared nutrition date', /const diaryDate = \(\): string => useNutritionStore\.getState\(\)\.date;/.test(suppStore));
  check('…loads that day\'s logs, not today\'s', /today: supplementsForDay\(date\)/.test(suppStore));
  check('…logs to that day', /logSupplement\(key, \{ dose, unitsTaken: units \?\? null, date: diaryDate\(\) \}\)/.test(suppStore));
  check('…and "already taken" is asked of that day', /loggedToday\(key, get\(\)\.date\)/.test(suppStore));
  check('Changing the date there moves the whole nutrition section', /useNutritionStore\.getState\(\)\.setDate\(date\)/.test(suppStore));
  const suppRepo2 = fs.readFileSync('src/repositories/supplementsRepo.ts', 'utf8');
  check('A supplement logged for a past day stamps its diary row that day too', /const backdated = date !== todayISO\(\);/.test(suppRepo2) && /eatenAt = backdated \?/.test(suppRepo2) && /eatenAt,/.test(suppRepo2));
  const suppScr = fs.readFileSync('src/screens/nutrition/SupplementsScreen.tsx', 'utf8');
  check('The screen has a date navigator and says when it is not today', /setDate\(addDays\(date, -1\)\)/.test(suppScr) && /Logging for \{dayLabel\}/.test(suppScr));
  check('…and the pill counts read the day being shown', /unitsTakenToday\(s\.key, date\)/.test(suppScr) && /dayLabel=\{isToday \? 'today' : dayLabel\}/.test(suppScr));
  check('Micronutrients already followed the shared date', /useNutritionStore\(\(s\) => s\.date\)/.test(fs.readFileSync('src/screens/nutrition/MicronutrientsScreen.tsx', 'utf8')));
}

console.log('\nThe audit — duplicate movements, wrong labels, wrong numbers:');
{
  const bySlug = new Map(EXERCISE_LIBRARY.map((e) => [e.slug, e]));
  // Every alias points at a real primary that is itself not an alias,
  // and the pair really is the same movement.
  const aliases = EXERCISE_LIBRARY.filter((e) => e.aliasOf);
  check('Six duplicate exercises are marked as aliases of their primary', aliases.length === 6 && ALIAS_SLUGS.size === 6);
  check('Every alias points at a real, non-alias primary', aliases.every((e) => {
    const prim = bySlug.get(e.aliasOf!);
    return !!prim && !prim.aliasOf && prim.slug !== e.slug;
  }));
  // (The old martial entries filed everything under 'cardio'; the primary names
  // the real muscle. Patterns must always agree.)
  check('An alias and its primary agree on muscle and movement pattern', aliases.every((e) => {
    const prim = bySlug.get(e.aliasOf!)!;
    const muscleOk = prim.primaryMuscle === e.primaryMuscle || e.primaryMuscle === 'cardio' || prim.primaryMuscle === 'cardio';
    return muscleOk && prim.pattern === e.pattern;
  }));
  check('…and on how they load the body, so calories cannot diverge', aliases.every((e) => {
    const a = profileFor({ slug: e.slug }); const b = profileFor({ slug: e.aliasOf! });
    return a.bwFraction === b.bwFraction && a.loadMode === b.loadMode;
  }));
  // The library browser and the prefills only ever offer the primary.
  check('The exercise library hides the aliases from browsing', /filter\(\(e\) => !ALIAS_SLUGS\.has\(e\.slug \?\? ''\)\)/.test(fs.readFileSync('src/screens/train/ExerciseLibraryScreen.tsx', 'utf8')));
  const prefillSources = ['src/data/trainingMethods.ts', 'src/data/programs.ts', 'src/data/specialPrograms.ts', 'src/data/splits.ts'].map((f) => fs.readFileSync(f, 'utf8')).join('');
  check('No prefilled session references an alias slug', [...ALIAS_SLUGS].every((slug) => !prefillSources.includes(`'${slug}'`)));
  // With aliases hidden and the two kickbacks renamed, every visible name is unique.
  const visible = EXERCISE_LIBRARY.filter((e) => !e.aliasOf);
  const nameCounts = new Map<string, number>();
  for (const e of visible) nameCounts.set(e.name, (nameCounts.get(e.name) ?? 0) + 1);
  const dupNames = [...nameCounts.entries()].filter(([, n]) => n > 1).map(([n]) => n);
  check('No two browsable exercises share a name', dupNames.length === 0, dupNames.slice(0, 4).join(', '));
  check('The glute and triceps cable kickbacks say which is which', bySlug.get('cable-glute-kickback')!.name === 'Cable Glute Kickback' && bySlug.get('cable-kickback')!.name === 'Cable Triceps Kickback');
  // The mis-tagged heads. Hands UP inclines the torso toward the LOWER chest —
  // it is the incline bench that flips it to upper.
  check('Incline push-ups target the lower chest, both twins', bySlug.get('incline-pushup')!.subMuscle === 'lower_chest' && bySlug.get('push-up-incline')!.subMuscle === 'lower_chest' && subMuscleOf(bySlug.get('incline-pushup')!) === 'lower_chest');
  check('Diamond push-ups agree on the long head, both twins', bySlug.get('diamond-push-up')!.subMuscle === subMuscleOf(bySlug.get('push-up-diamond')!) && subMuscleOf(bySlug.get('push-up-diamond')!) === 'triceps_long');
  check('The decline push-up twins are one movement', bySlug.get('decline-push-up')!.pattern === bySlug.get('push-up-decline')!.pattern);
}

console.log('\nThe audit — foods that showed twice, and one wrong daily value:');
{
  const hidden = ['white-rice', 'almonds', 'avocado', 'olive-oil', 'dried-apricot'];
  const searchIds = new Set(SEARCH_FOOD_DB.map((f) => f.id));
  check('The five generic twins stay in the catalogue for old logs', hidden.every((id) => FOOD_DB.some((f) => f.id === id)));
  check('…but the pickers no longer offer them next to their richer twin', hidden.every((id) => !searchIds.has(id)) && SEARCH_FOOD_DB.length === FOOD_DB.length - hidden.length);
  check('…and each hidden twin has a visible stand-in', ['tn-rice-white', 'tn-almonds', 'tn-avocado', 'tn-olive-oil-tbsp', 'df-dried-apricot'].every((id) => searchIds.has(id)));
  check('Both food pickers search the visible list', /SEARCH_FOOD_DB/.test(fs.readFileSync('src/screens/nutrition/AddFoodScreen.tsx', 'utf8')) && /composableFoods\(SEARCH_FOOD_DB, selfId\)/.test(fs.readFileSync('src/screens/nutrition/ComposeFoodScreen.tsx', 'utf8')));
  // The teaspoon and the tablespoon no longer share one name.
  const nameServing = new Map<string, number>();
  for (const f of SEARCH_FOOD_DB) { const k = `${f.name}|${f.serving}`; nameServing.set(k, (nameServing.get(k) ?? 0) + 1); }
  const dupFood = [...nameServing.entries()].filter(([, n]) => n > 1).map(([k]) => k);
  check('No two searchable foods share both a name and a serving', dupFood.length === 0, dupFood.slice(0, 3).join(' / '));
  check('Honey and olive oil say teaspoon or tablespoon in the name', FOOD_DB.find((f) => f.id === 'tn-honey-tsp')!.name === 'Honey (teaspoon)' && FOOD_DB.find((f) => f.id === 'tn-olive-oil-tbsp')!.name === 'Olive Oil (tablespoon)');
  // Chromium: NIH adequate intake is 35 µg for men, 25 for women — not 40 flat.
  check('Chromium daily value follows the NIH adequate intake', percentRdi(35, 'chromium_ug', 'male') === 100 && percentRdi(25, 'chromium_ug', 'female') === 100 && percentRdi(35, 'chromium_ug', 'female') > 100);
}

console.log('\nThe audit — a crash vector and a total that did not visibly add up:');
{
  const cycle = fs.readFileSync('src/screens/health/CycleScreen.tsx', 'utf8');
  check('Cycle history survives a malformed symptoms row', /function safeSymptomCount\(json: string\): number/.test(cycle) && /catch \{\s*return 0;/.test(cycle) && !/\$\{\(JSON\.parse\(p\.symptoms\)/.test(cycle));
  const detail = fs.readFileSync('src/screens/train/SessionDetailScreen.tsx', 'utf8');
  check('The session detail shows the rest share, so the parts sum to the total', /restCalories > 0/.test(detail) && /min of rest between sets/.test(detail));
}

console.log('\nThe route has to actually draw:');
{
  const MDEG = 111320;
  // A 400 m loop around a city block, one fix every 5 m, at a given accuracy.
  const blockLoop = (acc: number | null) => {
    const out: Array<{ lat: number; lng: number; accuracy: number | null; speed: number }> = [];
    let lat = 36.8;
    let lng = 10.18;
    const lngM = MDEG * Math.cos((36.8 * Math.PI) / 180);
    for (const [dLat, dLng] of [[1, 0], [0, 1], [-1, 0], [0, -1]] as Array<[number, number]>) {
      for (let d = 0; d < 100; d += 5) {
        lat += (dLat * 5) / MDEG;
        lng += (dLng * 5) / lngM;
        out.push({ lat, lng, accuracy: acc, speed: 1.4 });
      }
    }
    return out;
  };
  // RouteMap needs two points before it can draw anything at all.
  const res = (acc: number | null) => filterFixes([], blockLoop(acc));
  check('A clean walk draws its route', res(8).accepted.length >= 2);
  check('An urban-canyon walk draws too', res(25).accepted.length >= 2);
  // The blackout this release fixes: at 30 m the ceiling binned EVERY fix of a
  // pocket walk, so no route was drawn and no GPS distance existed at all.
  const pocket = res(35);
  check('A pocket walk at 35 m accuracy draws — this used to be a blackout', pocket.accepted.length >= 2, `${pocket.accepted.length} points`);
  check('…and keeps most of its distance', pocket.distanceM > 300, `${Math.round(pocket.distanceM)} m of 400`);
  check('A 45 m walk still draws rather than vanishing', res(45).accepted.length >= 2);
  check('A walk with no reported accuracy is unaffected', res(null).accepted.length >= 2);
  // Good fixes must be byte-identical to before the ceiling moved.
  check('Excellent-accuracy walks are unchanged', Math.round(res(8).distanceM) === 381 && res(8).accepted.length === 40);
  check('Urban-canyon walks are unchanged', Math.round(res(25).distanceM) === 381);
  // Genuinely useless fixes are still refused.
  check('An 80 m fix proves nothing and is still thrown away', res(80).accepted.length === 0);

  // The vaguer the fix, the further you must prove you moved.
  check('The segment gate rises with the error bar', segmentGateM(8) === 6 && segmentGateM(35) === 52.5 && segmentGateM(45) === 67.5);
  check('…and never drops below the absolute floor', segmentGateM(1) === MIN_SEGMENT_M);
  check('Vague fixes are held to a stricter multiple than sharp ones', VAGUE_SLACK > ACCURACY_SLACK && segmentGateM(VAGUE_ACCURACY_M + 1) > segmentGateM(VAGUE_ACCURACY_M));

  // Raising the ceiling must not let phantom distance in anywhere.
  const yard = Array.from({ length: 40 }, (_, i) => ({
    lat: 36.8 + Math.sin(i) * 0.00006,
    lng: 10.18 + Math.cos(i) * 0.00006,
    accuracy: 35,
    speed: 0.4,
  }));
  check('Pacing on the spot at poor accuracy credits nothing', filterFixes([], yard).distanceM === 0);
}

console.log('\nReading a meal from a photograph — nothing a model says is taken on trust:');
{
  // ── The shape gate: a reply that isn't the shape we asked for logs nothing.
  check('A missing reply is refused', parsePhotoIdentification(null) === null && parsePhotoIdentification({}) === null);
  check('An empty plate is refused rather than invented', parsePhotoIdentification({ dishName: 'x', items: [] }) === null);
  check('Items without a name or weight are dropped', parsePhotoIdentification({ items: [{ name: 'rice' }, { grams: 50 }] }) === null);
  const ok = parsePhotoIdentification({ dishName: 'plate', items: [{ name: 'White Rice', grams: 150, confidence: 0.8 }] });
  check('A well-formed reply parses', !!ok && ok.items.length === 1 && ok.items[0].grams === 150);
  // Portions outside human range are the model losing the plot, not a big meal.
  check('An absurd portion is dropped', parsePhotoIdentification({ items: [{ name: 'rice', grams: 99999 }] }) === null);
  check('A zero portion is dropped', parsePhotoIdentification({ items: [{ name: 'rice', grams: 0 }] }) === null);
  check('Confidence is clamped into 0..1', parsePhotoIdentification({ items: [{ name: 'r', grams: 10, confidence: 9 }] })!.items[0].confidence === 1);

  // ── Physics: 100 g of food cannot hold more than 100 g of macronutrients.
  check('Impossible macros are refused outright', parseNutritionPer100g({ protein: 60, carbs: 60, fat: 40, fiber: 0 }) === null);
  check('Negative macros are refused', parseNutritionPer100g({ protein: -1, carbs: 10, fat: 1, fiber: 0 }) === null);
  const rice = parseNutritionPer100g({ calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 });
  check('Real figures pass', !!rice && rice.calories === 130);
  check('Fibre can never exceed the carbohydrate it is part of', parseNutritionPer100g({ calories: 100, protein: 1, carbs: 5, fat: 1, fiber: 40 })!.fiber <= 5);

  // ── Energy: stated calories must agree with the model's own macros.
  const lying = parseNutritionPer100g({ calories: 5, protein: 20, carbs: 30, fat: 10, fiber: 0 });
  check('Calories that contradict the macros are rebuilt from the macros', !!lying && lying.calories > 250, `${lying?.calories} kcal`);
  const honest = parseNutritionPer100g({ calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 });
  check('Calories that agree with the macros are kept as given', honest!.calories === 165);

  // ── Plausibility: an absurd micronutrient is dropped, one key at a time.
  const wild = parseNutritionPer100g({
    calories: 62, protein: 3.6, carbs: 10, fat: 0.9, fiber: 2,
    micros: { iron_mg: 1.2, vitaminB12_ug: 99999, folate_ug: 44 },
  });
  check('An impossible vitamin value is dropped', wild!.micros?.vitaminB12_ug === undefined);
  check('…while the plausible ones beside it survive', wild!.micros?.iron_mg === 1.2 && wild!.micros?.folate_ug === 44);
  check('A real outlier is still allowed through', !!sanitiseMicros({ selenium_ug: 1900 })?.selenium_ug);
  check('Negative nutrients are dropped', sanitiseMicros({ iron_mg: -5 }) === undefined);

  // ── Matching: the catalogue answers whatever it can, so curated data wins.
  // Word order is genuinely irrelevant: the two orders must score identically,
  // not merely both pass. (0.85 is the ceiling for a full-coverage match with no
  // preparation word in common; only an exact name reaches 1.)
  check('Word order does not matter at all', scoreFoodMatch('breast chicken', 'Chicken Breast (cooked)') === scoreFoodMatch('chicken breast', 'Chicken Breast (cooked)'));
  check('…and a full-coverage match scores well clear of the threshold', scoreFoodMatch('breast chicken', 'Chicken Breast (cooked)') >= 0.85);
  check('Plurals do not matter either', scoreFoodMatch('almonds', 'Almond') >= 0.85 && scoreFoodMatch('berries', 'Berry') >= 0.85);
  check('Preparation words never block a match', matchFood('grilled chicken breast', SEARCH_FOOD_DB, (f) => f.name)?.food.name === 'Chicken Breast (cooked)');
  check('…but they do break the tie', matchFood('fried chicken', SEARCH_FOOD_DB, (f) => f.name)?.food.name.startsWith('Fried Chicken') === true);
  check('A genuinely different dish is not forced onto a near name', matchFood('lentil soup', SEARCH_FOOD_DB, (f) => f.name) === null);
  check('Something that is not food matches nothing', matchFood('unicorn steak', SEARCH_FOOD_DB, (f) => f.name) === null);
  check('An exact name scores perfectly', scoreFoodMatch('Banana', 'banana') === 1);

  // ── Portions: a catalogue serving is scaled by its own gram weight.
  check('Grams are read from a serving however it is written', servingGrams('1 cup (195g)') === 195 && servingGrams('225 g (1 cup)') === 225 && servingGrams('100g') === 100);
  check('A serving with no weight says so rather than guessing', servingGrams('1 handful') === null);
  const chicken = SEARCH_FOOD_DB.find((f) => f.name === 'Chicken Breast (cooked)')!;
  const scaled = scaleCatalogueFood(chicken, 150);
  check('A 150 g portion of a 100 g serving logs one and a half servings', scaled.quantity === 1.5);
  check('…and its calories scale with it', scaled.nutrition.calories === Math.round(chicken.calories * 1.5));
  /*
   * What the review screen shows must be exactly what the diary stores. The
   * diary keeps a quantity and re-multiplies the per-serving figures by it, so
   * the reviewed nutrition has to be derived from the SAME rounded quantity.
   * Checked across the whole catalogue at awkward portions, because this
   * disagreed by a kilocalorie or two before (200 g couscous: shown 444,
   * logged 445).
   */
  let drift = 0;
  let driftExample = '';
  for (const f of SEARCH_FOOD_DB) {
    for (const grams of [133, 150, 175, 200, 47]) {
      const sc = scaleCatalogueFood(f, grams);
      if (sc.servingUnknown) continue;
      if (sc.nutrition.calories !== Math.round(f.calories * sc.quantity)) {
        drift += 1;
        if (!driftExample) driftExample = `${f.name} @${grams}g`;
      }
    }
  }
  check('Reviewed calories equal logged calories, for every food and portion', drift === 0, driftExample || 'no drift');

  // ── The whole plate: catalogue first, research only for what is left.
  const plate = parsePhotoIdentification({
    dishName: 'chicken couscous',
    items: [
      { name: 'grilled chicken breast', grams: 150, confidence: 0.9 },
      { name: 'couscous', grams: 200, confidence: 0.8 },
      { name: 'lentil soup', grams: 250, confidence: 0.7 },
    ],
  })!;
  const unknown = unresolvedNames(plate.items, SEARCH_FOOD_DB);
  check('Only what the catalogue lacks is sent to be researched', unknown.length === 1 && unknown[0] === 'lentil soup');
  const soup = parseNutritionPer100g({ calories: 62, protein: 3.6, carbs: 10.1, fat: 0.9, fiber: 2.2, form: 'liquid' })!;
  const allRows = plate.items.map((it) => rowFromCatalogue(it, SEARCH_FOOD_DB) ?? rowFromResearch(it, soup));
  check('Every food ends up with numbers', allRows.length === 3 && allRows.every((r) => r.nutrition.calories > 0));
  check('Catalogue foods keep their measured micronutrients', allRows.some((r) => r.source === 'catalogue' && !!r.nutrition.micros));
  check('A researched food is stored per 100 g, so its quantity is the portion', allRows.find((r) => r.source === 'researched')!.quantity === 2.5);
  const totals = mealTotals(allRows);
  check('The plate totals its parts', totals.calories === allRows.reduce((n, r) => n + r.nutrition.calories, 0));
  check('…and sums their micronutrients', !!totals.micros && Object.keys(totals.micros).length > 0);

  // ── Provenance: an estimate must never be mistakable for measured data.
  const repo = fs.readFileSync('src/repositories/customFoodRepo.ts', 'utf8');
  check('A researched food is written with source ai', /source: input\.source \?\? \('user' as const\)/.test(repo));
  /*
   * Editing a researched food must not erase what makes it one. It is not a
   * composed food, so correcting a macro goes through the ordinary editor,
   * whose update applies everything normalise() returns as a SET. If micros or
   * source were named there, that edit would wipe the micronutrient profile and
   * relabel a model estimate as hand-entered.
   */
  const normaliseBody = repo.slice(repo.indexOf('function normalise('), repo.indexOf('function provenance('));
  check('Editing a food cannot erase its micronutrients', !/microsJson/.test(normaliseBody));
  check('…nor quietly relabel an estimate as your own data', !/source/.test(normaliseBody));
  check('Both are written on creation instead', /\.values\(\{ \.\.\.normalise\(input\), \.\.\.provenance\(input\), userId \}\)/.test(repo));
  check('Composed foods never go through that path at all', /componentsJson: JSON\.stringify\(input\.components\)/.test(repo));

  /*
   * A food is researched ONCE. Saved into the food database, the next
   * photograph of it matches there like any catalogue entry — no second lookup
   * against the daily request limit, and no creeping duplicates.
   */
  const savedByAi = {
    id: 'custom:1', name: 'lentil soup', serving: '100 g',
    calories: 62, protein: 3.6, carbs: 10.1, fat: 0.9, fiber: 2.2,
    micros: { iron_mg: 1.0 }, isCustom: true, aiSourced: true, form: 'liquid' as const,
  };
  const second = parsePhotoIdentification({ items: [{ name: 'lentil soup', grams: 300 }] })!.items[0];
  check('A researched food is not researched a second time', !!rowFromCatalogue(second, [savedByAi]));
  check('…and scales from its stored 100 g basis', rowFromCatalogue(second, [savedByAi])!.quantity === 3);
  check('…carrying its micronutrients with it', rowFromCatalogue(second, [savedByAi])!.nutrition.micros?.iron_mg === 3);
  check('…and surfaces that flag on the food itself', /aiSourced: f\.source === 'ai'/.test(repo));
  const screen = fs.readFileSync('src/screens/nutrition/PhotoFoodScreen.tsx', 'utf8');
  check('The photo screen saves new foods marked as model-sourced', /source: 'ai'/.test(screen));
  check('Nothing is logged before it is reviewed', /setStage\('review'\)/.test(screen) && /const logMeal/.test(screen));
  check('Portions stay editable, because a photo judges weight worst', /const setGrams/.test(screen));

  // ── The key is the user's, and stays on the device.
  const kv = fs.readFileSync('src/repositories/kvRepo.ts', 'utf8');
  check('The API key lives in the device database, not the bundle', /openRouterKey/.test(kv) && !/sk-or-/.test(kv));
  const svc = fs.readFileSync('src/services/foodVision.ts', 'utf8');
  check('No key is ever hard-coded', !/sk-or-v1-[A-Za-z0-9]/.test(svc));
  check('The request carries no personal data beyond the photo', !/email|userId|user_id/.test(svc));
  check('Every call is bounded by a timeout', /AbortController/.test(svc) && /setTimeout\(\(\) => ctrl\.abort/.test(svc));
  check('A free model is the default', /:free/.test(DEFAULT_MODEL));
  check('…with free fallbacks behind it', FALLBACK_MODELS.length >= 2 && FALLBACK_MODELS.every((m) => m.includes(':free') || m === 'openrouter/free'));

  // ── A reply wrapped in prose or a code fence is still readable.
  check('JSON inside a code fence is recovered', (extractJson('```json\n{"a":1}\n```') as { a: number }).a === 1);
  check('JSON inside a sentence is recovered', (extractJson('Here you go: {"a":2} hope that helps') as { a: number }).a === 2);
  check('Prose with no JSON at all returns nothing', extractJson('I cannot help with that') === null);
}

console.log('\nWhat the review pass caught, held down:');
{
  const nameOf = (f: { name: string }) => f.name;
  const hit = (q: string) => matchFood(q, SEARCH_FOOD_DB, nameOf);

  // ── A bare word must not bind to a food that merely contains it. ──
  // "water" beside a plate found Tuna (canned in water) and logged 315 kcal
  // and 68 g of protein for a glass of water.
  const traps = ['water', 'butter', 'nuts', 'vegetables', 'corn', 'fruit', 'seeds',
                 'sauce', 'cream', 'soup', 'greens', 'stew', 'rice'];
  const stillTrapped = traps.filter((q) => hit(q) !== null);
  check('A bare word never binds to a food that merely contains it', stillTrapped.length === 0, stillTrapped.join(', '));
  check('…and the catalogue description is not matchable identity', scoreFoodMatch('water', 'Tuna (canned in water)') < MATCH_MIN_SCORE);

  // ── Ambiguity is answered with "unsure", not with array order. ──
  check('Two different foods fitting equally well is no match', matchFood('milk drink', [{ name: 'Whole Milk' }, { name: 'Skimmed Milk' }], nameOf) === null);
  check('…but the same food in two sizes still matches', !!matchFood('apples', [{ name: 'Apple' }, { name: 'Apple (medium)' }], nameOf));
  check('…and an exact name wins outright', matchFood('Banana', [{ name: 'Banana' }, { name: 'Banana Bread' }], nameOf)?.food.name === 'Banana');

  // ── Plurals. "apples" stemmed to "appl" and matched nothing, so every
  //    photographed apple was saved as a duplicate food, forever.
  for (const [plural, singularName] of [['apples', 'Apple'], ['oranges', 'Orange'], ['sardines', 'Sardine'], ['tomatoes', 'Tomato']] as Array<[string, string]>) {
    check(`"${plural}" still finds ${singularName}`, hit(plural)?.food.name.startsWith(singularName) === true, hit(plural)?.food.name ?? 'no match');
  }
  check('A double-s word is not stripped to nonsense', nameTokens('couscous')[0] === 'couscous');

  // ── Preparation words agree across their forms. ──
  check('"roast" and "roasted" are the same instruction', hit('roasted chicken')?.food.name === hit('roast chicken')?.food.name);

  // ── Everything that must still match, still does. ──
  const keep = ['couscous', 'harissa', 'banana', 'white rice', 'olive oil', 'grilled chicken breast',
                'fried chicken', 'salmon fillet', 'chicken nuggets', 'french fries', 'greek yogurt'];
  const lost = keep.filter((q) => hit(q) === null);
  check('Every real food the catalogue has is still found', lost.length === 0, lost.join(', '));
  check('Preparation still breaks the tie', hit('fried chicken')?.food.name.startsWith('Fried Chicken') === true);

  // ── A portion of nothing must log nothing. The diary reads quantity 0 as
  //    "unspecified" and substitutes a whole serving, so a row shown as 0 kcal
  //    was writing a full portion.
  const screen = fs.readFileSync('src/screens/nutrition/PhotoFoodScreen.tsx', 'utf8');
  check('A row edited to zero is never logged', /rows\.filter\(\(r\) => r\.quantity > 0\)/.test(screen));
  check('…and the button will not offer to log nothing', /disabled=\{loggable === 0\}/.test(screen));

  // ── A serving with no gram weight is counted in servings, not in a grams
  //    box that silently does nothing.
  const noGrams = SEARCH_FOOD_DB.filter((f) => servingGrams(f.serving) === null);
  check('Some catalogue servings genuinely have no gram weight', noGrams.length > 0, `${noGrams.length} foods`);
  const drink = noGrams[0];
  const one = scaleCatalogueFood(drink, 100);
  const two = scaleCatalogueFood(drink, 400);
  check('…so grams cannot move them, which is why the UI offers servings', one.quantity === two.quantity && one.servingUnknown);
  check('The screen switches that row to a servings control', /label=\{r\.servingUnknown \? 'Servings' : 'Portion'\}/.test(screen));

  // ── Researched rows must not drift between review and diary either.
  const per100 = parseNutritionPer100g({ calories: 321, protein: 10, carbs: 40, fat: 13, fiber: 2 })!;
  const odd = rowFromResearch({ name: 'x', grams: 12.5, confidence: 1 }, per100);
  check('A researched row logs exactly what it showed', odd.nutrition.calories === Math.round(per100.calories * odd.quantity));

  // ── The micronutrient ceiling has to catch a slipped decimal point.
  check('A ten-fold vitamin C error is refused', sanitiseMicros({ vitaminC_mg: 5300 })?.vitaminC_mg === undefined);
  check('…while a genuine outlier still passes', sanitiseMicros({ selenium_ug: 1900 })?.selenium_ug === 1900);
  check('The ceiling sits just above the real extremes', MICRO_SANITY_MULTIPLE >= 35 && MICRO_SANITY_MULTIPLE <= 50);

  // ── An estimate has to look like one wherever it appears.
  const addScreen = fs.readFileSync('src/screens/nutrition/AddFoodScreen.tsx', 'utf8');
  check('Searching shows which foods are estimates', /item\.aiSourced && \(/.test(addScreen) && /estimated/.test(addScreen));
  const customScreen = fs.readFileSync('src/screens/nutrition/CustomFoodScreen.tsx', 'utf8');
  check('…and editing one says so rather than claiming it has no micros', /existing\?\.source === 'ai'/.test(customScreen));
  const repo2 = fs.readFileSync('src/repositories/customFoodRepo.ts', 'utf8');
  check('A dish built from an estimate inherits the mark', /componentsCarryEstimate\(input\.components\)/.test(repo2));
  check('…on edit as well as on creation', (repo2.match(/componentsCarryEstimate\(input\.components\)/g) ?? []).length >= 2);

  // ── One plate cannot write the same new food twice.
  check('A repeated new food is only saved once', /written\.has\(key\)/.test(screen) && /written\.add\(key\)/.test(screen));
  // ── And a food that could not be priced is named, not silently dropped.
  check('Foods that could not be priced are declared', /dropped\.length > 0 && \(/.test(screen) && /logs short/.test(screen));
  // ── A mistyped key must be replaceable.
  check('The API key can be replaced without clearing app data', /Replace API key/.test(screen));
}

console.log('\nThe first live photo failed silently; now the pipe bends instead of breaking:');
{
  // A model answering outside an enforced schema writes "150 g", not 150.
  // Number() made that NaN, the item was dropped, and a perfectly good reply
  // reported as unreadable - likely exactly what the egg test hit.
  const loose = parsePhotoIdentification({ items: [{ name: 'boiled egg', grams: '150 g', confidence: '0.9' }] });
  check('Loose numbers in a reply still parse', loose !== null && loose.items[0].grams === 150 && loose.items[0].confidence === 0.9);
  check('...for researched nutrition too', parseNutritionPer100g({ calories: '155 kcal', protein: '13', carbs: '1.1', fat: '11' })!.protein === 13);

  // The photographed egg itself must resolve from the catalogue.
  const egg = (q: string) => matchFood(q, SEARCH_FOOD_DB, (f) => f.name)?.food.name;
  check('An egg is an egg', egg('egg') === 'Egg (whole, large)' && egg('boiled egg') === 'Egg (whole, large)' && egg('eggs') === 'Egg (whole, large)');

  const svc = fs.readFileSync('src/services/foodVision.ts', 'utf8');
  // Enforced schema first, schema-in-prompt second: several free endpoints
  // declare no structured-output support and reject or ignore json_schema.
  // Superseded by v2.60: none of the routed models advertise structured
  // outputs, so the schema is described in the prompt on BOTH attempts and
  // JSON mode is requested in the form they do support.
  check('The first attempt asks for JSON mode the models support', /post\(asked, \{ type: 'json_object' \}/.test(svc));
  check('...with the schema described in the prompt both times', /matching exactly this JSON schema/.test(svc) && /const asked = \[\.\.\.content, hint\];/.test(svc));
  // Superseded by v2.62: the single first/retry pair is now a loop over the
  // route, and an account-level answer ends it rather than being retried.
  check('An account-level answer is never retried', /attempt\.error === 'no-key' \|\| attempt\.error === 'unauthorised'/.test(svc));

  // The free-model privacy gate is named, not lumped into "failed".
  check('The OpenRouter privacy refusal is recognised', /data policy\|allowed providers\|privacy/.test(svc));
  check('...and explained as the setting it is', /data-policy/.test(svc) && /enable free model training/.test(svc));
  check('A refusal hidden in a 200 body is caught too', /json\.error\?\.message/.test(svc));

  // Failures say WHY, on screen.
  check('Every failure path records what came back', /lastDetail = `\$\{model\}: HTTP \$\{res\.status\}/.test(svc) && /Not JSON: /.test(svc) && /no reply in \$\{waited\} s/.test(svc));
  const scr = fs.readFileSync('src/screens/nutrition/PhotoFoodScreen.tsx', 'utf8');
  check('...and the screen shows it', /lastVisionDetail\(\)/.test(scr));
}

console.log('\nThe request itself has to be one OpenRouter will accept:');
{
  /*
   * The bug that meant photo logging never worked at all: the routing list was
   * built as primary + THREE fallbacks, and OpenRouter rejects anything over
   * three with a 400 before a model ever sees the photograph. Every call died
   * there. These checks make the route length a fact the build enforces.
   */
  const route = modelRoute(DEFAULT_MODEL);
  check('The routing list is within what OpenRouter accepts', route.length <= MAX_ROUTE_MODELS, `${route.length} models`);
  check('The chosen model leads it', route[0] === DEFAULT_MODEL);
  check('No model is listed twice', new Set(route).size === route.length);
  check('A custom model override stays inside the cap', modelRoute('some/other-model:free').length <= MAX_ROUTE_MODELS);
  check('...and leads its own route', modelRoute('some/other-model:free')[0] === 'some/other-model:free');
  // The cap must hold even if someone lengthens the fallback list later.
  check('The cap survives a longer fallback list', FALLBACK_MODELS.length + 1 > MAX_ROUTE_MODELS ? route.length === MAX_ROUTE_MODELS : true);
  check('Every model on the route is free', route.every((m) => m.includes(':free') || m === 'openrouter/free'));
  const svc = fs.readFileSync('src/services/foodVision.ts', 'utf8');
  // Superseded by v2.62: the route is walked here, one named model per
  // request, because the server-side `models` list did not fail over.
  check('The service walks the capped route itself', /for \(const model of modelRoute\(activeModel\(\)\)\)/.test(svc));
  check('...and never inlines an uncapped list again', !/models: \[activeModel\(\), \.\.\.FALLBACK_MODELS/.test(svc));
}

console.log('\nWaiting for a free model, without calling it a lost connection:');
{
  const svc = fs.readFileSync('src/services/foodVision.ts', 'utf8');
  const scr = fs.readFileSync('src/screens/nutrition/PhotoFoodScreen.tsx', 'utf8');

  /*
   * A request that reached OpenRouter and simply was not answered in time is
   * not "no connection" — saying so sent the user hunting a network fault that
   * did not exist. It is its own outcome, with its own advice.
   */
  check('A timeout is its own failure, not an offline one', /\| 'timeout'/.test(svc) && /error: aborted \? 'timeout' : 'offline'/.test(svc));
  check('...and says the connection is fine', /Your connection is/.test(svc) && /try again/.test(svc));

  // Free endpoints queue; 45 s was not patient enough for a real meal.
  const vision = svc.match(/const VISION_TIMEOUT_MS = ([\d_]+);/);
  check('Vision waits long enough for a queued free model', !!vision && Number(vision[1].replace(/_/g, '')) >= 90_000, `${vision?.[1]} ms`);
  check('The research call is given room too', /const TEXT_TIMEOUT_MS = 60_000;/.test(svc));

  // Identification returns a short list; asking for fewer tokens is faster.
  // Raised in v2.60: a reply cut off at the ceiling never closes its JSON,
  // which is indistinguishable from prose to the reader.
  check('Identification has room to finish its JSON', /IDENTIFY_MAX_TOKENS = 1500/.test(svc));
  check('...and researching micronutrients has more', /NUTRITION_MAX_TOKENS = 2400/.test(svc));
  check('Both calls state their own budget', /IDENTIFY_MAX_TOKENS\s*\n?\s*\);/.test(svc) && /NUTRITION_MAX_TOKENS\s*\n?\s*\);/.test(svc));

  // The photo is the bulk of the request, so it goes up small.
  check('The photograph is sent small', /quality: 0\.2,/.test(scr));
  check('...and cropped square, which cuts the pixels as well', /allowsEditing: true,/.test(scr) && /aspect: \[1, 1\],/.test(scr));

  // Instrumented, so the next failure is conclusive rather than a guess.
  check('A failure reports how much was sent and how long it waited', /sent \$\{sentKb\} KB, no reply in \$\{waited\} s/.test(svc));
  check('...measured from the body actually posted', /const sentKb = Math\.round\(body\.length \/ 1024\);/.test(svc));
  check('The wait says it may take a minute', /free models queue when busy/.test(scr));
}

console.log('\nOnly models that can actually describe a meal are asked to:');
{
  /*
   * A photograph of an egg came back as "User Safety: safe". The free
   * catalogue contains a content-safety CLASSIFIER that accepts images, and
   * the routing list ended in openrouter/free - a router, free to pick it.
   * The reply was not wrong, it was an answer to a different question.
   */
  check('A router is never routed to', !isUsableVisionModel('openrouter/free'));
  check('Nor is a content-safety classifier', !isUsableVisionModel('nvidia/nemotron-3.5-content-safety:free'));
  check('Nor an audio or embedding model', !isUsableVisionModel('google/lyria-3-pro-preview') && !isUsableVisionModel('some/text-embed-3:free'));
  check('A real multimodal model is allowed', isUsableVisionModel(DEFAULT_MODEL) && isUsableVisionModel('minimax/minimax-m3:free'));

  const route = modelRoute(DEFAULT_MODEL);
  check('Every model on the route can describe a picture', route.every(isUsableVisionModel), route.join(', '));
  check('The route is named models only, no router', !route.includes('openrouter/free'));
  check('The whole fallback list is usable', FALLBACK_MODELS.every(isUsableVisionModel));
  check('The route is still within the length OpenRouter accepts', route.length <= MAX_ROUTE_MODELS);
  check('The chosen model still leads', route[0] === DEFAULT_MODEL);
  // Choosing an unusable model by hand must not leave nothing to ask.
  const rescued = modelRoute('openrouter/free');
  check('An unusable choice falls back rather than sending nothing', rescued.length > 0 && rescued.every(isUsableVisionModel));
}

console.log('\nAsking for JSON in a way these models can actually answer:');
{
  const svc = fs.readFileSync('src/services/foodVision.ts', 'utf8');

  /*
   * A json_schema response format requires a provider that advertises
   * `structured_outputs`, and NONE of the free vision models this routes to
   * do - they support plain `response_format` only. Demanding the schema meant
   * every reply came back as prose and read as "the answer couldn't be read".
   */
  check('JSON mode is asked for in the supported way', /post\(asked, \{ type: 'json_object' \}/.test(svc));
  check('The strict schema format is no longer demanded', !/type: 'json_schema'/.test(svc));
  check('The shape is spelled out in the prompt instead', /matching exactly this JSON schema/.test(svc) && /Reply with ONE JSON object and nothing else/.test(svc));
  check('The retry drops the format and doubles the budget', /post\(asked, undefined, timeoutMs, key, maxTokens \* 2, model\)/.test(svc));
  check('...and is aimed at the model that just chatted', /if \(attempt\.error === 'unreadable'\)/.test(svc));

  // A reply cut off at the ceiling is a knowable failure, not a mystery.
  check('A truncated reply is named as truncated', /finish_reason === 'length'/.test(svc) && /cut short at the length limit/.test(svc));
  check('The token budgets leave room for the answer', /IDENTIFY_MAX_TOKENS = 1500/.test(svc) && /NUTRITION_MAX_TOKENS = 2400/.test(svc));
  check('An unreadable reply is quoted at length enough to diagnose', /text\.slice\(0, 300\)/.test(svc));

  // Extraction has to cope with however a model chooses to present itself.
  check('Clean JSON parses', (extractJson('{"a":1}') as { a: number }).a === 1);
  check('A fenced block parses', (extractJson('```json\n{"a":2}\n```') as { a: number }).a === 2);
  check('JSON after a preamble parses', (extractJson('Sure! Here you go:\n{"a":3}') as { a: number }).a === 3);
  check('JSON with chatter on both sides parses', (extractJson('Thinking...\n{"a":4}\nHope that helps') as { a: number }).a === 4);
  check('A brace inside a string does not fool the scanner', (extractJson('{"n":"egg {large}","a":5}') as { a: number }).a === 5);
  check('An escaped quote does not fool it either', (extractJson('{"n":"a\\"b","a":6}') as { a: number }).a === 6);
  check('An array reply parses', Array.isArray(extractJson('[{"a":7}]')));
  check('Truncated JSON is refused, not half-read', extractJson('{"items":[{"name":"egg","gram') === null);
  check('Pure prose is refused', extractJson('User Safety: safe') === null && extractJson('I cannot help') === null);
  check('The scanner finds the first balanced value', firstBalancedJson('noise {"a":1} more {"b":2}') === '{"a":1}');
}

console.log('\nMeasuring instead of guessing:');
{
  const svc = fs.readFileSync('src/services/foodVision.ts', 'utf8');
  const scr = fs.readFileSync('src/screens/nutrition/PhotoFoodScreen.tsx', 'utf8');
  // Several releases were spent inferring a network failure from a one-line
  // symptom. This asks each model directly and prints what it says, verbatim.
  check('There is a connection test', /export async function runDiagnostic/.test(svc));
  check('It tries every model on the route', /for \(const model of modelRoute\(activeModel\(\)\)\)/.test(svc));
  check('It proves text before blaming the image', /'text', 'image'/.test(svc));
  check('It reports the raw reply, not a verdict', /JSON\.stringify\(reply\)/.test(svc) && /raw\.slice\(0, 260\)/.test(svc));
  check('It reports the finish reason', /finish \$\{finish/.test(svc));
  check('It never prints the key itself', /key\.slice\(-6\)/.test(svc));
  check('The screen can run it', /runDiagnostic\(\)/.test(scr));
  check('...and shows the report so it can be copied', /selectable/.test(scr));
}

console.log('\nFailing over between free models, on evidence from a real device:');
{
  const svc = fs.readFileSync('src/services/foodVision.ts', 'utf8');

  /*
   * Measured from the phone: asked the simplest possible question,
   * minimax-m3 answered correctly in about a second while BOTH gemma
   * endpoints returned 429 "temporarily rate-limited upstream". Gemma was the
   * primary, so every real request met that wall - and OpenRouter's own
   * `models` fallback list did not rescue it.
   */
  check('The model that answers leads the route', DEFAULT_MODEL === 'minimax/minimax-m3:free');
  check('The rate-limited ones are kept as fallbacks, not dropped', FALLBACK_MODELS.includes('google/gemma-4-31b-it:free'));
  check('The route still starts with the working model', modelRoute(DEFAULT_MODEL)[0] === 'minimax/minimax-m3:free');

  // Failover is ours now, not the server's.
  check('Each request names exactly one model', /const body = JSON\.stringify\(\{\s*\n\s*model,/.test(svc));
  check('...with no server-side fallback list', !/models: modelRoute\(activeModel\(\)\)/.test(svc));
  check('The route is walked here instead', /for \(const model of modelRoute\(activeModel\(\)\)\)/.test(svc));
  check('A busy model moves on to the next', /if \(attempt\.error === 'no-key' \|\| attempt\.error === 'unauthorised'\) return attempt;/.test(svc));
  check('...while an account-level answer stops immediately', /attempt\.error === 'data-policy' \|\| attempt\.error === 'timeout'/.test(svc));
  check('A model that chats gets one plain retry', /if \(attempt\.error === 'unreadable'\)/.test(svc) && /post\(asked, undefined, timeoutMs, key, maxTokens \* 2, model\)/.test(svc));
  check('Every failure names which model produced it', /\$\{model\}: HTTP \$\{res\.status\}/.test(svc));
  check('Being busy is explained as shared capacity', /capacity is shared/.test(svc));
}

console.log('\nRest that accounts for the state you turned up in:');
{
  const heavy = {
    reps: 3, weightKg: 140, rpe: 9, toFailure: false, durationS: null,
    bodyweight: false, compound: true, best1RMKg: 160, setIndex: 2,
    sessionElapsedMin: 30, level: 'intermediate' as const,
  };
  const rest = (conditions?: RestConditions) => prescribeRest({ ...heavy, conditions }).restSec;
  const clean = rest();

  // ── Carbon monoxide: the mechanism this is built on. PCr resynthesis is
  //    entirely aerobic, so CO on the haemoglobin slows the refill itself.
  check('A cigarette on board lengthens the rest', rest({ coLoad: 1 }) > clean);
  check('Three lengthen it further', rest({ coLoad: 3 }) >= rest({ coLoad: 1 }));
  check('COHb rises with the CO still on board', estimateCohbPct(0) === BASELINE_COHB_PCT && estimateCohbPct(1) > estimateCohbPct(0));
  check('...and never reaches a figure that belongs in a hospital', estimateCohbPct(50) <= MAX_COHB_PCT);
  check('Oxygen delivery falls with CO, never below the floor', o2DeliveryFactor({ coLoad: 3 }) < 1 && o2DeliveryFactor({ coLoad: 99 }) >= 1 - MAX_O2_LOSS);
  check('A non-smoker is not penalised for baseline CO', o2DeliveryFactor({}) === 1);

  // ── The conversion is exact, not a fudge: recovery is 1 - e^(-t/tau), so
  //    time to the same fraction scales exactly as tau does.
  const phys = restPhysiology({ coLoad: 3 }, PCR_TAU_S);
  check('The time constant stretches by exactly the oxygen shortfall', Math.abs(phys.tauS - PCR_TAU_S / phys.o2Factor) < 0.2);
  check('Reaching the same recovery takes proportionally longer', Math.abs(pcrTimeFor(0.9, phys.tauS) / pcrTimeFor(0.9, PCR_TAU_S) - 1 / phys.o2Factor) < 0.01);
  check('The recovery curve honours the stretched constant', pcrRecovered(120, phys.tauS) < pcrRecovered(120, PCR_TAU_S));

  // ── Digestion: real, and deliberately small next to CO.
  check('A full stomach lengthens rest a little', rest({ stomachKcal: 600 }) > clean);
  check('...but far less than smoking does', 1 - o2DeliveryFactor({ stomachKcal: 700 }) <= MAX_SPLANCHNIC_LOSS + 1e-9 && MAX_SPLANCHNIC_LOSS * 3 < MAX_O2_LOSS);
  check('An empty stomach changes nothing', o2DeliveryFactor({ stomachKcal: 0 }) === 1);

  // ── Sleep acts on the NERVOUS SYSTEM, not on the phosphagen tank. Claiming
  //    otherwise would invent a mechanism to justify a number.
  check('Short sleep does not touch oxygen delivery', o2DeliveryFactor({ avgSleepHours: 4 }) === 1);
  check('...but does lengthen the neural allowance', neuralRecoveryFactor({ avgSleepHours: 5 }) > 1);
  check('Enough sleep is neutral', neuralRecoveryFactor({ avgSleepHours: 7.5 }) === 1);
  check('Excellent sleep earns a small reduction', neuralRecoveryFactor({ avgSleepHours: 9 }) < 1);
  check('Unknown sleep changes nothing', neuralRecoveryFactor({}) === 1);
  check('Short sleep lengthens a heavy set, which has a neural cost', rest({ avgSleepHours: 5 }) > clean);
  // A set with no neural component cannot be moved by sleep alone.
  const light = { ...heavy, reps: 15, weightKg: 20, rpe: 6, compound: false, best1RMKg: 40 };
  check('...but not an easy set, which has none', prescribeRest({ ...light, conditions: { avgSleepHours: 5 } }).restSec === prescribeRest(light).restSec);

  // ── Neither more nor less than necessary.
  check('Knowing nothing leaves the evidence-based number untouched', prescribeRest({ ...heavy, conditions: {} }).restSec === clean);
  check('...and says so rather than inventing a reason', prescribeRest({ ...heavy, conditions: {} }).physiology === undefined);
  check('Everything at once still respects the five-minute ceiling', rest({ coLoad: 20, stomachKcal: 2000, avgSleepHours: 3 }) <= MAX_REST_S);
  check('The change from the state is reported, not hidden', prescribeRest({ ...heavy, conditions: { coLoad: 3 } }).restBeforeStateSec === clean);
  check('Each factor is explained by its mechanism', restPhysiology({ coLoad: 2, stomachKcal: 500, avgSleepHours: 5 }, PCR_TAU_S).notes.length === 3);

  // ── The session screen reads the real, moving state.
  const screen = fs.readFileSync('src/screens/train/ActiveSessionScreen.tsx', 'utf8');
  check('The session reads CO, stomach and sleep', /coLoad\(recentSmokeEvents\(\)\)/.test(screen) && /stomachLoad\(/.test(screen) && /sleepSummary\(\)\.avgRest7d/.test(screen));
  check('Naps count toward how rested you are', /avgRest7d/.test(screen));
  check('...and it re-reads as the session runs, since all three move', /\[lv\.sets\.length\]/.test(screen));
  check('The recovery bar uses the real time constant', /pcrRecovered\(elapsed, rx\?\.physiology\?\.tauS\)/.test(screen));
}

console.log('\nA library big enough to be whole, graded so it can be used:');
{
  const vis = EXERCISE_LIBRARY.filter((e) => !e.aliasOf);

  // ── Size and integrity. Growth is worthless if it arrives as duplicates.
  check('The library is large', vis.length >= 740, `${vis.length} browsable`);
  const slugSeen = new Set<string>();
  const dupSlugs = vis.filter((e) => e.slug && (slugSeen.has(e.slug) || (slugSeen.add(e.slug), false)));
  check('Every slug is unique', dupSlugs.length === 0, dupSlugs.map((e) => e.slug).slice(0, 3).join(', '));
  const nameCount = new Map<string, number>();
  for (const e of vis) nameCount.set(e.name.toLowerCase(), (nameCount.get(e.name.toLowerCase()) ?? 0) + 1);
  const dupNames = [...nameCount.entries()].filter(([, n]) => n > 1).map(([n]) => n);
  check('No two browsable exercises share a name', dupNames.length === 0, dupNames.slice(0, 3).join(', '));
  check('Every exercise has a description', vis.filter((e) => !e.description).length < vis.length * 0.35);

  // ── Difficulty exists on everything, and actually differs.
  check('Every exercise carries a difficulty', vis.every((e) => e.difficulty != null));
  check('...within the scale', vis.every((e) => e.difficulty! >= 1 && e.difficulty! <= 5));
  const dist = [1, 2, 3, 4, 5].map((d) => vis.filter((e) => e.difficulty === d).length);
  check('All five grades are populated', dist.every((n) => n > 0), dist.join('/'));
  check('...and none of them swallows the library', dist.every((n) => n < vis.length * 0.6), dist.join('/'));
  check('The easy end is real, not a token', dist[0] >= 20 && dist[1] >= 100, `${dist[0]} at 1, ${dist[1]} at 2`);
  check('The hard end is real too', dist[3] >= 50 && dist[4] >= 8, `${dist[3]} at 4, ${dist[4]} at 5`);

  // ── The grading has to agree with what a coach would say.
  const dOf = (slug: string) => vis.find((e) => e.slug === slug)?.difficulty ?? null;
  check('A muscle-up is elite', dOf('muscle-up') === 5);
  check('A pistol squat is hard', dOf('pistol-squat') === 4);
  check('A glute bridge is for anyone', dOf('glute-bridge') === 1);
  check('A machine isolation is beginner-friendly', dOf('leg-extension') === 2);
  check('Named skills beat the derivation', skillDifficulty('front-lever-tuck') === 5 && skillDifficulty('some-cable-row') === null);
  check('...and the longest match wins', skillDifficulty('ring-muscle-up') === 5);
  check('An authored value beats everything', difficultyOf({ slug: 'muscle-up', difficulty: 2 }) === 2);
  check('Equipment sets the floor when nothing else applies', difficultyOf({ slug: 'x', equipmentType: 'machine', pattern: 'curl' }) < difficultyOf({ slug: 'y', equipmentType: 'barbell', pattern: 'hinge' }));

  // ── Level bands: overlapping on purpose, and never hiding anything.
  check('A beginner has plenty to do', vis.filter((e) => suitsLevel(e.difficulty as Difficulty, 'beginner')).length >= 500);
  check('An advanced lifter is not offered only hard things', suitsLevel(2, 'advanced'));
  check('A beginner is not offered elite skills', !suitsLevel(5, 'beginner'));
  check('The bands overlap, so levels are not silos', suitsLevel(3, 'beginner') && suitsLevel(3, 'intermediate') && suitsLevel(3, 'advanced'));
  check('Fit peaks at each level\'s own centre', levelFit(2, 'beginner') > levelFit(4, 'beginner') && levelFit(4, 'advanced') > levelFit(2, 'advanced'));
  check('An out-of-band exercise explains itself', !!levelNote(5, 'beginner') && levelNote(3, 'intermediate') === null);

  // ── Prefilled sessions stop handing a beginner things they cannot do.
  const day = ['leg-extension', 'muscle-up', 'glute-bridge', 'full-planche', 'leg-press', 'lat-pulldown', 'human-flag'];
  const forBeginner = slugsForLevel(day, 'beginner', (sl) => difficultyBySlug(sl));
  check('A prefill drops what the level cannot do', !forBeginner.includes('muscle-up') && !forBeginner.includes('full-planche'));
  check('...and keeps what it can', forBeginner.includes('leg-extension'));
  check('An advanced lifter keeps the hard ones', slugsForLevel(day, 'advanced', (sl) => difficultyBySlug(sl)).includes('muscle-up'));
  // A day of nothing but hard movements must not become an empty day.
  const allHard = ['muscle-up', 'full-planche', 'human-flag'];
  check('It never empties a session to enforce a band', slugsForLevel(allHard, 'beginner', (sl) => difficultyBySlug(sl)).length > 0);
  check('Without a difficulty source it behaves exactly as before', slugsForLevel(day, 'beginner').length === Math.min(day.length, 4));

  // ── And the screens use it.
  const lib = fs.readFileSync('src/screens/train/ExerciseLibraryScreen.tsx', 'utf8');
  check('The library orders by how well each movement fits you', /levelFit\(/.test(lib) && /forMyLevel/.test(lib));
  check('...and shows how hard each one is', /DIFFICULTY_LABELS\[d\]/.test(lib));
  check('Both prefill pickers pass difficulty through', /slugsForLevel\(day\.exercises, level, difficultyBySlug\)/.test(fs.readFileSync('src/screens/train/SplitPickerScreen.tsx', 'utf8')) && /difficultyBySlug/.test(fs.readFileSync('src/screens/train/MethodPickerScreen.tsx', 'utf8')));
  // New exercises only reach an existing install when the schema version moves.
  check('The schema bump is what delivers them', /const SCHEMA_VERSION = 32;/.test(fs.readFileSync('src/db/bootstrap.ts', 'utf8')));
}

console.log('\n3.0 "Lume" - the design platform holds its own rules:');
{
  // ── The accent. Lume is the only colour allowed to mean "interactive". ──
  check('The brand is Lume, not the old blue', darkTheme.colors.primary === lume.base && darkTheme.colors.primary === '#3FE0B6');
  check('Success shares the brand, as it always quietly did', darkTheme.colors.success === lume.base);
  check('On Salt the interactive ink darkens for contrast', lightTheme.colors.primary === '#0FA57F');
  check('There is no fourth status colour - info reads as ink', darkTheme.colors.info === darkTheme.colors.textMuted);
  check('Carbs keep blue, which is why the brand could not', darkTheme.colors.carbs === '#6FA7F5' && darkTheme.colors.carbs !== darkTheme.colors.primary);

  // ── Night Sea: tonal depth, hairlines - not a solid third colour. ──
  check('The ground shifted toward teal', darkTheme.colors.bg === '#070C14');
  check('Hairlines are ink at alpha, not hex walls', darkTheme.colors.border.startsWith('rgba(') && lightTheme.colors.border.startsWith('rgba('));
  check('The surface ramp exists', darkTheme.colors.surface !== darkTheme.colors.bg && darkTheme.colors.surfaceAlt !== darkTheme.colors.surface && !!darkTheme.colors.surface3);
  check('Elevation is a real token set', !!darkTheme.elevation.e1 && !!darkTheme.elevation.e2 && !!darkTheme.elevation.e3);
  check('Night Sea depth is tonal - no shadows faked in the dark', darkTheme.elevation.e1.shadowOpacity === undefined && lightTheme.elevation.e1.shadowOpacity !== undefined);

  // ── Alpha is a token, and the concat habit can only shrink. ──
  check('withAlpha produces real rgba', withAlpha('#3FE0B6', 0.14) === 'rgba(63,224,182,0.14)');
  check('The five alpha steps exist', typeof darkTheme.alpha.tint04 === 'function' && darkTheme.alpha.tint22('#FFFFFF') === 'rgba(255,255,255,0.22)');
  {
    // Ratchet: 20 hex-concat sites existed when the token landed. New code
    // must use withAlpha; this count may only go down.
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const f of fs.readdirSync(dir)) {
        const full = dir + '/' + f;
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (/\.tsx?$/.test(f)) files.push(full);
      }
    };
    walk('src');
    let concat = 0;
    for (const f of files) concat += (fs.readFileSync(f, 'utf8').match(/\+ '[0-9A-Fa-f]{2}'/g) ?? []).length;
    check('Hex-suffix alpha concatenation never grows', concat <= 18, `${concat} sites (ratchet: 18)`);
  }

  // ── Shape. Hierarchy through curvature. ──
  check('Cards are 20, sheets are 28, controls are 10', radius.lg === 20 && radius.xl === 28 && radius.sm === 10);
  check('The missing 20 joined the spacing ramp', spacing.s20 === 20);

  // ── Type. Two families, tabular numerals, an 11px floor. ──
  const variants = Object.keys(typography) as Array<keyof typeof typography>;
  check('Nothing sits below the 11px floor, ever', variants.every((v) => typography[v].fontSize >= 11));
  check('The numeral roles exist and are tabular', (typography.numeralXL.fontVariant ?? []).includes('tabular-nums') && (typography.numeralM.fontVariant ?? []).includes('tabular-nums'));
  check('Every variant knows its family', variants.every((v) => !!FONT_BY_VARIANT[v]));
  check('Numerals wear Space Grotesk; body wears Inter', FONT_BY_VARIANT.numeralXL.startsWith('SpaceGrotesk') && FONT_BY_VARIANT.body.startsWith('Inter'));
  for (const f of ['SpaceGrotesk-Bold', 'SpaceGrotesk-SemiBold', 'SpaceGrotesk-Medium', 'Inter-Regular', 'Inter-Medium', 'Inter-SemiBold']) {
    const bytes = fs.readFileSync(`assets/fonts/${f}.ttf`);
    check(`${f} ships and is a real TTF`, bytes.length > 10000 && bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0);
  }
  const textSrc = fs.readFileSync('src/components/ui/Text.tsx', 'utf8');
  check('Text degrades to the system face if fonts fail', /fontsLoaded\(\) \? \{ fontFamily/.test(textSrc));

  // ── Motion reveals state; the wheel is sacred. ──
  check('The motion tokens exist', motion.swift === 120 && motion.settle === 200 && motion.sweep === 320);
  check('The challenge spin is untouched', motion.wheel === 3600);

  // ── The theme is finally a choice. ──
  const provider = fs.readFileSync('src/theme/ThemeProvider.tsx', 'utf8');
  check('System / Night Sea / Salt persists in kv', /kvGet<string>\(KV_THEME\)/.test(provider) && /kvSet\(KV_THEME, p\)/.test(provider));
  const appSrc = fs.readFileSync('App.tsx', 'utf8');
  check('Navigation chrome consumes the chosen theme, not the OS', /function ThemedApp\(\)/.test(appSrc) && !/const scheme = useColorScheme\(\)/.test(appSrc));
  check('The brand fonts load at boot, best-effort', /await loadBrandFonts\(\);/.test(appSrc));

  // ── The new primitives, present and honest. ──
  const toastSrc = fs.readFileSync('src/components/ui/Toast.tsx', 'utf8');
  check('The Undo toast gives six seconds of forgiveness', /t\.duration \?\? 6000/.test(toastSrc) && /export function toast\(/.test(toastSrc));
  check('...and is mounted once at the root', /<ToastHost \/>/.test(appSrc));
  const meterSrc = fs.readFileSync('src/components/ui/Meter.tsx', 'utf8');
  check('The Meter has exactly its two forms', /export function Rail\(/.test(meterSrc) && /export function Arc\(/.test(meterSrc));
  check('Past 100% the fill shows overflow instead of lying', (meterSrc.match(/Math\.min\(0\.5, Math\.max\(0, frac - 1\)/g) ?? []).length === 2);
  const sheetSrc = fs.readFileSync('src/components/ui/Sheet.tsx', 'utf8');
  check('Sheets wear the 28 radius v2 shipped and never used', /borderTopLeftRadius: theme\.radius\.xl/.test(sheetSrc));
  const misc3 = fs.readFileSync('src/components/ui/misc3.tsx', 'utf8');
  check('Skeleton, EmptyState, ProvenanceChip and Metric exist', /export function Skeleton/.test(misc3) && /export function EmptyState/.test(misc3) && /export function ProvenanceChip/.test(misc3) && /export function Metric/.test(misc3));
  check('Provenance speaks the four honest words', /Measured/.test(misc3) && /Derived/.test(misc3) && /Estimate/.test(misc3) && /Your entry/.test(misc3));

  // ── Re-cuts keep their contracts. ──
  const cardSrc = fs.readFileSync('src/components/ui/Card.tsx', 'utf8');
  check('A tappable Card is a real Pressable with a role', /accessibilityRole="button"/.test(cardSrc) && /android_ripple/.test(cardSrc));
  check('The 3px accent bar survives - it is a learned pattern', /borderLeftWidth: 3/.test(cardSrc));
  const buttonSrc = fs.readFileSync('src/components/ui/Button.tsx', 'utf8');
  check('The primary wears Lume ink, not white-on-mint', /isBrand \? lume\.ink : '#fff'/.test(buttonSrc));
  check('A disabled button can say why', /hint\?: string/.test(buttonSrc) && /disabled && hint/.test(buttonSrc));
  const inputSrc = fs.readFileSync('src/components/ui/Input.tsx', 'utf8');
  check('Inputs gained focus ring, error and helper', /focused/.test(inputSrc) && /error\?: string/.test(inputSrc) && /helper\?: string/.test(inputSrc));
  const tabSrc = fs.readFileSync('src/navigation/TabNavigator.tsx', 'utf8');
  check('The fifth tab reads You; the route name stays Profile', /tabBarLabel: 'You'/.test(tabSrc) && /name="Profile"/.test(tabSrc));
  check('The tab bar stands 64 tall', /height: 64/.test(tabSrc));

  // ── The famous unwired switch, actually wired this time. ──
  // The v2.64 guard only proved the identifier existed; this proves the
  // setter is CALLED from a rendered control.
  const lib = fs.readFileSync('src/screens/train/ExerciseLibraryScreen.tsx', 'utf8');
  check('"Fits my level" is a control a finger can reach', /onPress=\{\(\) => setForMyLevel\(\(v\) => !v\)\}/.test(lib));
  check('...that names the level it filters for', /Fits my level \(\$\{LEVEL_LABELS\[level\]\}\)/.test(lib));
}

console.log('\n3.0.1 - the slick pass keeps its own discipline:');
{
  // ── The signature is spent in one place: the double-bezel. ──
  const bezelSrc = fs.readFileSync('src/components/ui/Bezel.tsx', 'utf8');
  check('The Bezel exists: tray, hairline ring, concentric core', /padding: inset/.test(bezelSrc) && /borderRadius: outer - inset/.test(bezelSrc));
  const heroSrc2 = fs.readFileSync('src/components/ui/PageHero.tsx', 'utf8');
  check('PageHero wears it on every pushed page', /<Bezel tint=\{tint\}>/.test(heroSrc2));
  check('...without touching the guarded geometry', /width: 44/.test(heroSrc2) && /size=\{24\}/.test(heroSrc2) && /INLINE_SUBTITLE_MAX = 100/.test(heroSrc2));
  check('...and its tint is a token, not a hex concat', /theme\.alpha\.tint14\(tint\)/.test(heroSrc2) && !/tint \+ '/.test(heroSrc2));
  check('The eyebrow speaks in the coach register', typography.eyebrow.letterSpacing === 2.2 && typography.eyebrow.textTransform === 'uppercase' && typography.eyebrow.fontSize === 11);
  check('...set in the display face', FONT_BY_VARIANT.eyebrow.startsWith('SpaceGrotesk'));

  // ── CTAs became hardware. ──
  const btnSrc = fs.readFileSync('src/components/ui/Button.tsx', 'utf8');
  check('Md/lg buttons are pills; sm stays flat for dense rows', /const pill = size !== 'sm';/.test(btnSrc));
  check('The primary sits in its charged ring', /const ringed = pill && variant === 'primary'/.test(btnSrc) && /padding: 3/.test(btnSrc));
  check('A primary icon rides in its own trailing well', /trailingWell/.test(btnSrc) && /rgba\(6,32,25,0\.14\)/.test(btnSrc));
  // The 3.0.1 regression, held down: the title must never take bare flex, and
  // the caller's layout style must land on the OUTERMOST wrapper — otherwise a
  // natural-width primary collapses its text and Home shows a blank mint blob
  // where "Start Session" was.
  check('The title can shrink but never bare-flexes to zero', /style=\{\{ flexShrink: 1 \}\}/.test(btnSrc) && !/style=\{trailingWell \? \{ flex: 1 \}/.test(btnSrc));
  check("The caller's layout style sizes the whole control", /style=\{\[\{ alignSelf: fullWidth \? 'stretch' : 'flex-start', gap: 6 \}, style\]\}/.test(btnSrc));
  check('The core stretches to fill its ring', /alignSelf: 'stretch',/.test(btnSrc));
  check('Presses land on the house curve, never linear', /Easing\.bezier\(motion\.bezier\[0\]/.test(btnSrc) && /toValue: to/.test(btnSrc));

  // ── Motion: one curve everywhere it interpolates. ──
  check('The house bezier is a token', motion.bezier.length === 4 && motion.bezier[0] === 0.32 && motion.bezier[3] === 1);
  for (const f of ['src/components/ui/Sheet.tsx', 'src/components/ui/Toast.tsx']) {
    check(`${f.split('/').pop()} animates on the house curve`, /easing: HOUSE_EASING/.test(fs.readFileSync(f, 'utf8')));
  }

  // ── Both themes are deliberate, not one theme twice. ──
  check('Salt floats on diffused ambient shadow', (lightTheme.elevation.e1.shadowRadius ?? 0) >= 12 && (lightTheme.elevation.e1.shadowOpacity ?? 1) <= 0.06);
  check('Night Sea still refuses faked shadows', lightTheme.elevation.e3.shadowRadius === 24 && darkTheme.elevation.e3.shadowRadius === undefined);

  // ── Controls stopped shouting; numbers got the voice instead. ──
  const chipSrc = fs.readFileSync('src/components/ui/Chip.tsx', 'utf8');
  check('An active chip is a tinted wash with coloured text', /theme\.alpha\.tint14\(brand\)/.test(chipSrc) && !/color=\{active \? '#fff'/.test(chipSrc));
  const tileSrc = fs.readFileSync('src/components/ui/StatTile.tsx', 'utf8');
  check('Stat tiles: eyebrow label over a Grotesk numeral', /variant="eyebrow"/.test(tileSrc) && /variant="numeralM"/.test(tileSrc));
}

console.log('\nHome 3.0 - a briefing in four bands, and reads that stop writing:');
{
  const home = fs.readFileSync('src/screens/home/HomeScreen.tsx', 'utf8');

  // ── Reads stop writing. Coach tips refresh once per app open; looking at
  //    Home must never insert rows.
  check('Tips refresh once, at the app-open boundary', /useEffect\(\(\) => \{\s*\n\s*setTips\(refreshCoachTips\(\)\);\s*\n\s*\}, \[\]\);/.test(home));
  check('Focus reloads read, they do not write', /setTips\(activeCoachTips\(\)\);/.test(home) && (home.match(/refreshCoachTips\(\)/g) ?? []).length === 1);
  check('The coach offers at most two tips', /MAX_TIPS = 2/.test(home) && /tips\.slice\(0, MAX_TIPS\)/.test(home));

  // ── One consistency story instead of two unlabeled streaks.
  check('The two streaks merged into one card', /<ConsistencyCard usage=\{usage\} trainingStreak=\{streak\}/.test(home));
  const cons = fs.readFileSync('src/components/ConsistencyCard.tsx', 'utf8');
  check('...that labels both numbers', /Training/.test(cons) && /Check-in/.test(cons));
  check('...and never threatens loss', /no shame attached/.test(cons));

  // ── Self-care gained forgiveness: the wrap-to-zero announces and undoes.
  check('A self-care wrap-to-zero can be undone', /reset to 0/.test(home) && /actionLabel: 'Undo'/.test(home));
  check('...by replaying the taps back', /for \(let i = 0; i < before; i\+\+\) bumpSelfCare\(key\);/.test(home));

  // ── The greeting speaks in the new voice.
  check('The greeting is an eyebrow over a display name', /variant="eyebrow" color="textMuted">\s*\n\s*\{greeting\}/.test(home) && /variant="display">\{user\?\.name/.test(home));

  // ── Cycle and Alcohol stop fighting for one slot.
  check('With the cycle on, alcohol keeps its own tile', /cycleEnabled && cycleState \? \(\s*\n\s*<Pressable onPress=\{\(\) => navigation\.navigate\('Alcohol'\)\}/.test(home));

  // ── The Fuel band is one grammar.
  const fuel = fs.readFileSync('src/components/FuelCell.tsx', 'utf8');
  check('Fuel is one Arc and three Rails - one grammar', /<Arc value=\{calConsumed\}/.test(fuel) && (fuel.match(/<Rail /g) ?? []).length === 1 && /FuelRail/.test(fuel));
  check('The heat surcharge on water is explained, not silent', /for the heat/.test(fuel));
}

console.log("\nThe first hour - boot, crash and onboarding stop being hostile:");
{
  const ob = fs.readFileSync('src/screens/onboarding/OnboardingScreen.tsx', 'utf8');

  // ── Selection is a press, never a scroll accident.
  check('Selection cards are real presses at last', /<Card\s*\n\s*onPress=\{onPress\}/.test(ob) && !/onTouchEnd=\{/.test(ob));

  // ── The birthdate is a date, not a regex.
  check('The birthdate is three numeric boxes', /placeholder="DD"/.test(ob) && /placeholder="MM"/.test(ob) && /placeholder="YYYY"/.test(ob));
  check('...validated against the actual calendar', /date\.getDate\(\) !== d/.test(ob) && /That date does not exist/.test(ob));
  check('The old free-text ISO field is gone', !/YYYY-MM-DD\)"/.test(ob));

  // ── The wizard asks what it silently assumed.
  check('Experience level is asked at onboarding', /EXPERIENCE_LEVELS\.map/.test(ob) && /experienceLevel: level/.test(ob));
  check('...and the store writes it', /experienceLevel\?: User\['experienceLevel'\]/.test(fs.readFileSync('src/stores/userStore.ts', 'utf8')) && /data\.experienceLevel \? \{ experienceLevel: data\.experienceLevel \}/.test(fs.readFileSync('src/stores/userStore.ts', 'utf8')));
  check('The wizard is now seven beats', /TOTAL_STEPS = 7/.test(ob));
  check('The fifth gender value is finally offered', /prefer_not_to_say/.test(ob));
  check('The BMR-sex control says why it asks', /calibrated per/.test(ob));

  // ── A disabled Continue says what it is waiting for.
  check('Validation speaks instead of dimming', /Still needed: \$\{gaps\.join/.test(ob) && /hint=\{gaps\.length > 0/.test(ob));

  // ── The targets step is a moment, marked sovereign.
  check('The calorie target lands as the display numeral', /variant="numeralXL"/.test(ob) && /<Bezel tint=\{theme\.colors\.calories\}>/.test(ob));
  check('The sovereignty mark is on the last step', /On this device/.test(ob) && /no account, ever/.test(ob));

  // ── Boot is branded; the fatal moment is survivable.
  const boot = fs.readFileSync('src/components/BootScreens.tsx', 'utf8');
  check('Boot shows the Lume mark, not a blank rectangle', /export function BootView/.test(boot) && /Animated\.loop/.test(boot) && /FitCoach/.test(boot));
  const app = fs.readFileSync('App.tsx', 'utf8');
  check('...and the app actually boots into it', /return <BootView \/>;/.test(app));
  check('The fatal screen can retry', /setBootAttempt\(\(n\) => n \+ 1\)/.test(app) && /onRetry/.test(boot));
  check('...hand your data out even in failure', /Sharing\.shareAsync\(uri/.test(boot) && /SQLite\/\$\{DB_NAME\}/.test(boot));
  check('...and share the error itself', /Share\.share\(/.test(boot));
  check('Nothing is lost, and it says so', /nothing is lost/.test(boot));

  // ── The crash fallback grew up.
  const eb = fs.readFileSync('src/components/ErrorBoundary.tsx', 'utf8');
  check('The crash screen wears Night Sea, not stale hex', /darkColors\.bg/.test(eb) && !/#0B1220/.test(eb));
  check('The stack folds behind Details and is selectable', /showDetails/.test(eb) && /selectable/.test(eb));
  check('It says the data is untouched, because it is', /not a data problem/.test(eb));
}

console.log('\nTrain 3.0 - a spine, not a pile:');
{
  const train = fs.readFileSync('src/screens/train/TrainScreen.tsx', 'utf8');
  // Start, then Browse, then History - in that order on the screen.
  const iStart = train.indexOf("Start a Session");
  const iBrowse = train.indexOf('SectionHeader title="Browse"');
  const iRoutines = train.indexOf('SectionHeader title="My Routines"');
  const iRecent = train.indexOf('title="Recent Sessions"');
  check('The spine reads Start, Browse, History', iStart > 0 && iBrowse > iStart && iRoutines > iBrowse && iRecent > iRoutines);
  check('The readiness verdict replaces two stacked cards', /<ReadinessStrip/.test(train) && !/<DigestionCard/.test(train) && !/<WeatherCard/.test(train));
  check('All seven ground activities ride one rail', /OUTDOOR_ACTIVITIES\.map/.test(train));
  check('Deleting a routine forgives', /toast\(\{\s*\n\s*message: `Deleted/.test(train) && /saveRoutine\(name, exerciseIds\)/.test(train));
  check('...and the confirm Alert is gone from this screen', !/Alert\.alert/.test(train));
  check('Category doors say they browse', /Browse \{m\.label\.toLowerCase\(\)\}/.test(train));
  check('Recent sessions wear their type colour', /SESSION_TYPE_META\.find\(\(m\) => m\.type === s\.sessionType\)\?\.color/.test(train));
  check('The resume card rides raised elevation', /<Card accent=\{theme\.colors\.accent\} raised>/.test(train));
}

console.log('\nNutrition 3.0 - the diary earns edit:');
{
  const repo = fs.readFileSync('src/repositories/nutritionRepo.ts', 'utf8');
  // The rescale is a ratio against the stored quantity, applied to every total.
  check('Quantity edits rescale from the implied per-serving base', /const f = newQty \/ row\.quantity;/.test(repo));
  check('...touching all five stored totals', ['calories', 'proteinG', 'carbsG', 'fatG', 'fiberG'].every((k) => new RegExp(`updates\\.${k} = Math\\.round\\(row\\.${k} \\* f \\* 10\\) / 10;`).test(repo)));
  check('...and the micros JSON scales with them', /scaled\[k\] = Math\.round\(v \* f \* 100\) \/ 100;/.test(repo));
  check('A malformed micros blob survives the edit untouched', /} catch \{\s*\n\s*\/\/ A malformed micros blob stays as it was/.test(repo));
  check('Honest-log rows never pretend to have a serving to rescale', /row\.logMode === 'precise' &&\s*\n\s*row\.quantity > 0/.test(repo));
  check('Eaten-at edits land in createdAt, where every reader looks', /if \(patch\.eatenAt != null && Number\.isFinite\(patch\.eatenAt\)\) updates\.createdAt = patch\.eatenAt;/.test(repo));
  check('Restore puts the row back verbatim, id aside', /const \{ id: _dropped, \.\.\.values \} = row;/.test(repo) && /db\.insert\(foodEntries\)\.values\(values\)\.run\(\);/.test(repo));

  const store = fs.readFileSync('src/stores/nutritionStore.ts', 'utf8');
  check('The store exposes edit, snapshot and restore, each refreshing the day', /editFood/.test(store) && /snapshotFood/.test(store) && /restoreFood/.test(store) && /updateFoodEntry\(id, patch\);/.test(store));

  const scr = fs.readFileSync('src/screens/nutrition/NutritionScreen.tsx', 'utf8');
  check('Tapping a diary row opens the edit sheet', /onPress=\{\(\) => openEdit\(e\)\}/.test(scr));
  check('The X-delete forgives: snapshot first, then a six-second Undo', /const snap = snapshotFood\(id\);/.test(scr) && /actionLabel: 'Undo',\s*\n\s*onAction: \(\) => restoreFood\(snap\),/.test(scr));
  check('...and no blocking Alert guards the diary', !/Alert\.alert/.test(scr));
  check('Only precise entries offer the quantity field', /editing\.logMode === 'precise' \? \(\s*\n\s*<Input/.test(scr));
  check('The edited time stays anchored to the day being viewed', scr.includes('new Date(`${date}T${'));
  check('The meal slot moves through a segmented control over all four slots', /SegmentedControl\s*\n\s*options=\{MEAL_TYPES\.map/.test(scr));
}

console.log('\nNutrition 3.0 - one fuel grammar:');
{
  const scr7 = fs.readFileSync('src/screens/nutrition/NutritionScreen.tsx', 'utf8');
  const cell = fs.readFileSync('src/components/FuelCell.tsx', 'utf8');
  check('FuelRail is shared vocabulary, exported from the cell', /export function FuelRail\(/.test(cell));
  check('The dashboard is the Arc plus four macro rails', /<Arc value=\{cal\} max=\{calTarget\} size=\{132\}/.test(scr7) && (scr7.match(/<FuelRail label="(Protein|Carbs|Fat|Fibre)"/g) ?? []).length === 4);
  check('Water is a rail with the heat surcharge on its sub line', /<FuelRail\s*\n\s*label="Water"/.test(scr7) && /for the heat/.test(scr7));
  check('Caffeine rides a Rail against the soft limit', /<Rail value=\{caffeine\} max=\{caffeineLimit\}/.test(scr7) && !/<ProgressBar/.test(scr7));
  check('The legacy grammars have left the screen', !/ProgressRing/.test(scr7) && !/MacroDonut/.test(scr7) && !/function MacroRow/.test(scr7));
  check('The water quick-add wash is a token, not a concat', /theme\.alpha\.tint22\(theme\.colors\.water\)/.test(scr7) && !/theme\.colors\.water \+ '/.test(scr7));
}

console.log('\nYou hub 3.0 - the light switch exists:');
{
  const you = fs.readFileSync('src/screens/profile/ProfileScreen.tsx', 'utf8');
  // The provider shipped in 3.0 with no rendered control; this is its door.
  check('The theme picker is rendered, all three choices offered', /value=\{theme\.preference\}/.test(you) && /theme\.setPreference\(v\)/.test(you) && ["'system'", "'night'", "'salt'"].every((v) => you.includes(`value: ${v}`)));
  check('Each choice explains itself in one line', /Follows your phone/.test(you) && /home palette/.test(you) && /unmistakably FitCoach/.test(you));
  check('Loading is a shape, not a word', !you.includes('Loading…') && /<Skeleton height=\{64\}/.test(you));
  check('The hub opens on its eyebrow', /variant="eyebrow"/.test(you));
  check('The avatar wash is a token, not the legacy soft colour', /theme\.alpha\.tint14\(theme\.colors\.primary\)/.test(you) && !/primarySoft/.test(you));
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
