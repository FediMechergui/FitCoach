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

/**
 * Max of a numeric array WITHOUT `Math.max(...spread)` — spreading a large array
 * (hundreds of sessions/walks) can throw RangeError on Hermes, which was
 * white-screening the Achievements screen. reduce is safe at any length.
 */
function maxOf(nums: number[], base = 0): number {
  let m = base;
  for (const n of nums) if (n > m) m = n;
  return m;
}

/** Run a metric computation but never let it crash the whole screen. */
function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function computeAchievementStats(userId: number): AchievementStats {
  const appStreakBest = safe(() => usageStreak(userId).longest, 0);
  const goal = safe(() => getNutritionGoal(userId), undefined);
  const weightKg = safe(() => latestWeight(userId)?.weightKg ?? 75, 75);
  const sex = safe(() => getUser(userId)?.sex ?? 'male', 'male' as const);

  // ── steps / movement ──
  const stepHist = safe(() => stepHistorySince(daysAgoISO(90), userId), []);
  const stepsByDate = new Map(stepHist.map((r) => [r.date, r.stepCount]));
  const bestStepDay = maxOf(stepHist.map((r) => r.stepCount), safe(() => getDailySteps(todayISO(), userId)?.stepCount ?? 0, 0));
  const best10kStreak = trailingStreak((d) => (stepsByDate.get(d) ?? 0) >= 10000);
  const walks = safe(() => listWalkSessions(500, userId), []);
  const monthCutoff = Date.now() - 30 * 86_400_000;
  const monthDistanceKm =
    walks.filter((w) => w.startTime >= monthCutoff).reduce((s, w) => s + w.distanceM, 0) / 1000;
  const bestRunKcal = maxOf(walks.map((w) => w.caloriesBurned));
  const bestRunMinutes = maxOf(walks.map((w) => w.durationS / 60));

  // ── strength / sessions ──
  const sessions = safe(() => listSessions({ limit: 1000 }, userId), []);
  const maxVolumeKg = maxOf(sessions.map((s) => s.totalVolume ?? 0));
  const fullBodyDone = sessions.some(
    (s) => (s.splitKey ?? '').toLowerCase().includes('full') || (s.label ?? '').toLowerCase().includes('full-body')
  );
  const prCount = safe(() => personalRecords(200, userId).length, 0);
  const routineCount = safe(() => listRoutines(userId).length, 0);
  const customExerciseCount = safe(() => listExercises({}).filter((e) => e.isCustom).length, 0);
  const maxSetsThisWeek = safe(() => maxOf(growthReport(userId).muscles.map((m) => m.setsThisWeek)), 0);

  // ── nutrition ──
  const todayN = safe(() => dayNutrition(todayISO(), userId), null);
  const proteinPerKgToday = todayN && weightKg > 0 ? todayN.protein / weightKg : 0;
  const intake = safe(() => dailyIntakeSince(daysAgoISO(60), userId), []);
  const intakeByDate = new Map(intake.map((r) => [r.date, r]));
  const nutritionLogStreak = trailingStreak((d) => (intakeByDate.get(d)?.calories ?? 0) > 0);
  const loggedDaysCount = intake.filter((r) => r.calories > 0).length;
  const calTarget = goal?.calorieTarget ?? 0;
  const caloriesAdherentDays = calTarget
    ? intake.filter((r) => Math.abs(r.calories - calTarget) <= calTarget * 0.1).length
    : 0;
  let macroHitsToday = 0;
  if (goal && todayN) {
    if (Math.abs(todayN.protein - goal.proteinG) <= 5) macroHitsToday++;
    if (Math.abs(todayN.carbs - goal.carbsG) <= 5) macroHitsToday++;
    if (Math.abs(todayN.fat - goal.fatG) <= 5) macroHitsToday++;
  }

  // water & caffeine per-day (from beverages) for streaks
  const bevRows = safe(
    () =>
      db
        .select()
        .from(beverageEntries)
        .where(and(eq(beverageEntries.userId, userId), gte(beverageEntries.date, daysAgoISO(20))))
        .all(),
    []
  );
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
  const foodRows = safe(
    () =>
      db
        .select()
        .from(foodEntries)
        .where(and(eq(foodEntries.userId, userId), gte(foodEntries.date, daysAgoISO(90))))
        .all(),
    []
  );
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
  const sleeps = safe(() => sleepSince(daysAgoISO(30), userId), []);
  const bestSleepHours = maxOf(sleeps.map((s) => s.hours));
  const sleepDebt = safe(() => sleepSummary(userId).debt7d, 0);

  // ── smoking ──
  const smk = safe(() => smokingImpact(userId), null);

  // ── alcohol ──
  const alc = safe(() => alcoholImpact(userId), null);
  let dryStreak = 0;
  if (alc) {
    for (let i = alc.series.length - 1; i >= 0; i--) {
      if (alc.series[i].grams === 0) dryStreak++;
      else break;
    }
  }

  // ── faith ──
  const fasting = safe(() => fastingStats(userId), { streak: 0, fastedLast30: 0, loggedToday: false });

  // ── micros / supplements ──
  const micros = safe(() => dayMicros(todayISO(), userId), null);
  const microRdiMetCount = micros ? MICRO_KEYS.filter((k) => percentRdi(micros.totals[k], k, sex) >= 100).length : 0;
  const microGapsCount = micros ? MICRO_KEYS.filter((k) => k !== 'sodium_mg' && percentRdi(micros.totals[k], k, sex) < 50).length : MICRO_KEYS.length - 1;
  const stack = safe(() => getStack(userId), []);
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
    appStreakBest,
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
    smokingEnabled: safe(() => isSmokingEnabled(userId), false),
    smokeFreeStreak: smk?.smokeFreeStreak ?? 0,
    smokeFreeHours: smk?.smokeFreeHours ?? 0,
    dryDays7d: alc?.dryDays7d ?? 0,
    dryStreak,
    alcoholWeekGrams: alc?.weekGrams ?? 0,
    alcoholLimitG: alc?.weeklyLimitG ?? 100,
    fastingStreak: fasting.streak,
    fastedLast30: fasting.fastedLast30,
    prayersEnabled: safe(() => !!getPrayerSettings()?.enabled, false),
    prayersToday: safe(() => prayersDone(todayISO(), userId).size, 0),
    microRdiMetCount,
    microGapsCount,
    hasMicroData: !!micros && (micros.foodEntriesWithMicros > 0 || micros.supplementCount > 0),
    suppStackCount: stack.length,
    hasStrongSupp,
    creatineStreak: safe(() => supplementStreak('creatine', userId), 0),
    ashwaStreak: safe(() => supplementStreak('ashwagandha', userId), 0),
    cardOverall,
    cardEND,
    cardDIS,
  };
}

/** Fully zeroed stats — returned if the whole computation somehow fails. */
const ZERO_STATS: AchievementStats = {
  appStreakBest: 0, bestStepDay: 0, best10kStreak: 0, monthDistanceKm: 0, bestRunKcal: 0, bestRunMinutes: 0,
  sessionCount: 0, maxVolumeKg: 0, fullBodyDone: false, prCount: 0, routineCount: 0, customExerciseCount: 0, maxSetsThisWeek: 0,
  tdeeCalculated: false, proteinPerKgToday: 0, nutritionLogStreak: 0, loggedDaysCount: 0, caloriesAdherentDays: 0, macroHitsToday: 0,
  waterGoalStreak: 0, caffeineUnderStreak: 0, loggedBlob: '', tunisianSalads: 0, tunisianShare7d: 0,
  bestSleepHours: 0, sleepDebt: 0, smokingEnabled: false, smokeFreeStreak: 0, smokeFreeHours: 0,
  dryDays7d: 0, dryStreak: 0, alcoholWeekGrams: 0, alcoholLimitG: 100,
  fastingStreak: 0, fastedLast30: 0, prayersEnabled: false, prayersToday: 0,
  microRdiMetCount: 0, microGapsCount: 0, hasMicroData: false, suppStackCount: 0, hasStrongSupp: false, creatineStreak: 0, ashwaStreak: 0,
  cardOverall: 0, cardEND: 0, cardDIS: 0,
};

/** Public entry — never throws; a failure yields zeroed stats, not a white screen. */
export function achievementStats(userId: number = PRIMARY_USER_ID): AchievementStats {
  try {
    return computeAchievementStats(userId);
  } catch (e) {
    console.warn('[achievements] stats computation failed:', e);
    return ZERO_STATS;
  }
}
