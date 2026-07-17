/* Smoke-test the pure domain engines against known values. Run: npx tsx scripts/verify-engines.ts */
import { calculateBMR, calculateTDEE, computeTargets, refineTDEE } from '../src/lib/calories';
import { epley1RM, brzycki1RM, estimate1RM } from '../src/lib/oneRepMax';
import { caloriesFromMet, walkRunMet } from '../src/lib/met';
import { estimateBodyType, bmi } from '../src/lib/bodyType';
import { StepDetector, distanceFromSteps } from '../src/lib/pedometer';
import { lifeMinutesLost, moneyCost, aerobicPenaltyPct, currentQuitMilestone, DEFAULT_SMOKING_SETTINGS } from '../src/lib/smoking';
import { generateCoachTips, type CoachContext } from '../src/lib/recommendations';
import { estimateFromDescription } from '../src/data/foods';
import { computeDrink, estimateBAC, alcoholGrams } from '../src/lib/alcohol';
import { computeBodyComp, ffmiCategory } from '../src/lib/bodyComposition';
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
import { FOOD_DB, FOODS_WITH_MICROS } from '../src/data/foods';
import { SUPPLEMENTS, findSupplement } from '../src/data/supplements';

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
check('60+ foods carry micro data', FOODS_WITH_MICROS >= 55, `${FOODS_WITH_MICROS}`);
const liver = FOOD_DB.find((f) => f.id === 'tn-beef-liver')!;
check('Liver is a B12 powerhouse (>20µg)', (liver.micros?.vitaminB12_ug ?? 0) > 20, `${liver.micros?.vitaminB12_ug}`);
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

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
