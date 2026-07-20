import { db } from '@/db/client';
import { beverageEntries, foodEntries } from '@/db/schema';
import { and, eq, gte } from 'drizzle-orm';
import { BEVERAGE_PRESETS } from '@/data/beverages';
import { usageStreak } from './usageRepo';
import { getDailySteps, stepHistorySince, listWalkSessions } from './activityRepo';
import { listSessions } from './sessionRepo';
import { personalRecords } from './statsRepo';
import { listRoutines } from './routinesRepo';
import { listExercises } from './exerciseRepo';
import { sleepSince, sleepSummary } from './sleepRepo';
import { smokingImpact, isSmokingEnabled } from './smokingRepo';
import { alcoholImpact } from './alcoholRepo';
import { fastingStats, getPrayerSettings, prayersDone } from './faithRepo';
import { dayMicros } from './microsRepo';
import { getStack, supplementStreak } from './supplementsRepo';
import { dayNutrition, dailyIntakeSince } from './nutritionRepo';
import { getNutritionGoal, getUser, latestWeight, PRIMARY_USER_ID } from './userRepo';
import { growthReport } from './growthRepo';
import { computeCardRating } from './cardRepo';
import { MICRO_KEYS, percentRdi } from '@/lib/micros';
import { SUPPLEMENTS } from '@/data/supplements';
import { daysAgoISO, lastNDates, todayISO } from '@/lib/date';

export interface AchievementStats {
  // streaks / usage
  appStreakBest: number;
  // steps / movement
  bestStepDay: number;
  best10kStreak: number;
  monthDistanceKm: number;
  bestRunKcal: number;
  bestRunMinutes: number;
  // strength
  sessionCount: number;
  maxVolumeKg: number;
  fullBodyDone: boolean;
  prCount: number;
  routineCount: number;
  customExerciseCount: number;
  maxSetsThisWeek: number;
  // nutrition
  tdeeCalculated: boolean;
  proteinPerKgToday: number;
  nutritionLogStreak: number;
  loggedDaysCount: number;
  caloriesAdherentDays: number;
  macroHitsToday: number; // 0..3
  waterGoalStreak: number;
  caffeineUnderStreak: number;
  // heritage (logged-food text search)
  loggedBlob: string;
  tunisianSalads: number;
  tunisianShare7d: number;
  // sleep
  bestSleepHours: number;
  sleepDebt: number;
  // smoking
  smokingEnabled: boolean;
  smokeFreeStreak: number;
  smokeFreeHours: number;
  // alcohol
  dryDays7d: number;
  dryStreak: number;
  alcoholWeekGrams: number;
  alcoholLimitG: number;
  // faith
  fastingStreak: number;
  fastedLast30: number;
  prayersEnabled: boolean;
  prayersToday: number;
  // micros / supplements
  microRdiMetCount: number;
  microGapsCount: number;
  hasMicroData: boolean;
  suppStackCount: number;
  hasStrongSupp: boolean;
  creatineStreak: number;
  ashwaStreak: number;
  // card
  cardOverall: number;
  cardEND: number;
  cardDIS: number;
}

/** Longest run of consecutive true days ending at the most recent (today, else yesterday). */
function trailingStreak(has: (d: string) => boolean): number {
  let streak = 0;
  const start = has(todayISO()) ? 0 : 1;
  for (let i = start; i < 400; i++) {
    if (has(daysAgoISO(i))) streak++;
    else break;
  }
  return streak;
}

export function achievementStats(userId: number = PRIMARY_USER_ID): AchievementStats {
  const usage = usageStreak(userId);
  const goal = getNutritionGoal(userId);
  const weightKg = latestWeight(userId)?.weightKg ?? 75;
  const sex = getUser(userId)?.sex ?? 'male';

  // ── steps / movement ──
  const stepHist = stepHistorySince(daysAgoISO(90), userId);
  const stepsByDate = new Map(stepHist.map((r) => [r.date, r.stepCount]));
  const bestStepDay = Math.max(getDailySteps(todayISO(), userId)?.stepCount ?? 0, ...stepHist.map((r) => r.stepCount), 0);
  const best10kStreak = trailingStreak((d) => (stepsByDate.get(d) ?? 0) >= 10000);
  const walks = listWalkSessions(500, userId);
  const monthCutoff = Date.now() - 30 * 86_400_000;
  const monthDistanceKm =
    walks.filter((w) => w.startTime >= monthCutoff).reduce((s, w) => s + w.distanceM, 0) / 1000;
  const bestRunKcal = Math.max(0, ...walks.map((w) => w.caloriesBurned));
  const bestRunMinutes = Math.max(0, ...walks.map((w) => w.durationS / 60));

  // ── strength / sessions ──
  const sessions = listSessions({ limit: 1000 }, userId);
  const maxVolumeKg = Math.max(0, ...sessions.map((s) => s.totalVolume ?? 0));
  const fullBodyDone = sessions.some(
    (s) => (s.splitKey ?? '').toLowerCase().includes('full') || (s.label ?? '').toLowerCase().includes('full-body')
  );
  const prCount = personalRecords(200, userId).length;
  const routineCount = listRoutines(userId).length;
  const customExerciseCount = listExercises({}).filter((e) => e.isCustom).length;
  let maxSetsThisWeek = 0;
  try {
    maxSetsThisWeek = Math.max(0, ...growthReport(userId).muscles.map((m) => m.setsThisWeek));
  } catch {
    maxSetsThisWeek = 0;
  }

  // ── nutrition ──
  const todayN = dayNutrition(todayISO(), userId);
  const proteinPerKgToday = weightKg > 0 ? todayN.protein / weightKg : 0;
  const intake = dailyIntakeSince(daysAgoISO(60), userId);
  const intakeByDate = new Map(intake.map((r) => [r.date, r]));
  const nutritionLogStreak = trailingStreak((d) => (intakeByDate.get(d)?.calories ?? 0) > 0);
  const loggedDaysCount = intake.filter((r) => r.calories > 0).length;
  const calTarget = goal?.calorieTarget ?? 0;
  const caloriesAdherentDays = calTarget
    ? intake.filter((r) => Math.abs(r.calories - calTarget) <= calTarget * 0.1).length
    : 0;
  let macroHitsToday = 0;
  if (goal) {
    if (Math.abs(todayN.protein - goal.proteinG) <= 5) macroHitsToday++;
    if (Math.abs(todayN.carbs - goal.carbsG) <= 5) macroHitsToday++;
    if (Math.abs(todayN.fat - goal.fatG) <= 5) macroHitsToday++;
  }

  // water & caffeine per-day (from beverages) for streaks
  const bevRows = db
    .select()
    .from(beverageEntries)
    .where(and(eq(beverageEntries.userId, userId), gte(beverageEntries.date, daysAgoISO(20))))
    .all();
  const waterByDate = new Map<string, number>();
  const caffByDate = new Map<string, number>();
  for (const b of bevRows) {
    if (BEVERAGE_PRESETS[b.type]?.hydrating) waterByDate.set(b.date, (waterByDate.get(b.date) ?? 0) + b.volumeMl);
    caffByDate.set(b.date, (caffByDate.get(b.date) ?? 0) + b.caffeineMg);
  }
  const waterGoal = goal?.waterGoalMl ?? 2500;
  const caffLimit = goal?.caffeineSoftLimitMg ?? 400;
  const waterGoalStreak = trailingStreak((d) => (waterByDate.get(d) ?? 0) >= waterGoal);
  // Only count days the user actually logged nutrition, so an empty diary can't
  // trivially "stay under" the caffeine limit forever.
  const caffeineUnderStreak = trailingStreak((d) => intakeByDate.has(d) && (caffByDate.get(d) ?? 0) <= caffLimit);

  // ── heritage (search logged food text) ──
  const foodRows = db
    .select()
    .from(foodEntries)
    .where(and(eq(foodEntries.userId, userId), gte(foodEntries.date, daysAgoISO(90))))
    .all();
  const loggedBlob = foodRows
    .map((f) => `${f.foodName ?? ''} ${f.freeTextDescription ?? ''}`.toLowerCase())
    .join(' | ');
  const SALADS = ['mechouia', 'slata', 'houria', 'torshi', 'betterave', 'poivrons', 'aubergines', 'poulpe'];
  const tunisianSalads = new Set(SALADS.filter((s) => loggedBlob.includes(s))).size;
  const last7 = new Set(lastNDates(7));
  const rows7 = foodRows.filter((f) => last7.has(f.date));
  const tunisianShare7d = rows7.length
    ? rows7.filter((f) => /couscous|brik|lablabi|mloukhia|ojja|kafteji|bsisa|harissa|mechouia|slata|tajine|merguez|makroudh|tabouna/.test(`${f.foodName ?? ''} ${f.freeTextDescription ?? ''}`.toLowerCase())).length / rows7.length
    : 0;

  // ── sleep ──
  const sleeps = sleepSince(daysAgoISO(30), userId);
  const bestSleepHours = Math.max(0, ...sleeps.map((s) => s.hours));
  const sleepDebt = sleepSummary(userId).debt7d;

  // ── smoking ──
  const smk = smokingImpact(userId);

  // ── alcohol ──
  const alc = alcoholImpact(userId);
  // dry streak: consecutive most-recent days with 0 g (from 30-day series would be better; use 7-day series tail)
  let dryStreak = 0;
  for (let i = alc.series.length - 1; i >= 0; i--) {
    if (alc.series[i].grams === 0) dryStreak++;
    else break;
  }

  // ── faith ──
  const fasting = fastingStats(userId);

  // ── micros / supplements ──
  const micros = dayMicros(todayISO(), userId);
  const microRdiMetCount = MICRO_KEYS.filter((k) => percentRdi(micros.totals[k], k, sex) >= 100).length;
  const microGapsCount = MICRO_KEYS.filter((k) => k !== 'sodium_mg' && percentRdi(micros.totals[k], k, sex) < 50).length;
  const stack = getStack(userId);
  const hasStrongSupp = stack.some((s) => SUPPLEMENTS.find((d) => d.key === s.key)?.evidenceLevel === 'strong');

  // ── card ──
  let cardOverall = 0;
  let cardEND = 0;
  let cardDIS = 0;
  try {
    const card = computeCardRating(userId);
    cardOverall = card.overall;
    cardEND = card.attributes.END;
    cardDIS = card.attributes.DIS;
  } catch {
    /* rating needs data */
  }

  return {
    appStreakBest: usage.longest,
    bestStepDay,
    best10kStreak,
    monthDistanceKm,
    bestRunKcal,
    bestRunMinutes,
    sessionCount: sessions.length,
    maxVolumeKg,
    fullBodyDone,
    prCount,
    routineCount,
    customExerciseCount,
    maxSetsThisWeek,
    tdeeCalculated: goal?.tdee != null,
    proteinPerKgToday,
    nutritionLogStreak,
    loggedDaysCount,
    caloriesAdherentDays,
    macroHitsToday,
    waterGoalStreak,
    caffeineUnderStreak,
    loggedBlob,
    tunisianSalads,
    tunisianShare7d,
    bestSleepHours,
    sleepDebt,
    smokingEnabled: isSmokingEnabled(userId),
    smokeFreeStreak: smk?.smokeFreeStreak ?? 0,
    smokeFreeHours: smk?.smokeFreeHours ?? 0,
    dryDays7d: alc.dryDays7d,
    dryStreak,
    alcoholWeekGrams: alc.weekGrams,
    alcoholLimitG: alc.weeklyLimitG,
    fastingStreak: fasting.streak,
    fastedLast30: fasting.fastedLast30,
    prayersEnabled: !!getPrayerSettings()?.enabled,
    prayersToday: prayersDone(todayISO(), userId).size,
    microRdiMetCount,
    microGapsCount,
    hasMicroData: micros.foodEntriesWithMicros > 0 || micros.supplementCount > 0,
    suppStackCount: stack.length,
    hasStrongSupp,
    creatineStreak: supplementStreak('creatine', userId),
    ashwaStreak: supplementStreak('ashwagandha', userId),
    cardOverall,
    cardEND,
    cardDIS,
  };
}
