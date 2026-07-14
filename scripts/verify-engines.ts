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

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
