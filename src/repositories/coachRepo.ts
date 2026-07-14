import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { coachTips, type CoachTip } from '@/db/schema';
import { daysAgoISO, startOfWeek, todayISO } from '@/lib/date';
import { generateCoachTips, type CoachContext } from '@/lib/recommendations';
import {
  avgCaffeineSince,
  avgWaterSince,
  dailyIntakeSince,
} from './nutritionRepo';
import { getDailySteps, stepHistorySince } from './activityRepo';
import {
  consecutiveTrainingDays,
  daysSinceLastSession,
  daysSinceType,
  recentVolumeDrops,
} from './statsRepo';
import { listSessions } from './sessionRepo';
import {
  getNutritionGoal,
  getUser,
  PRIMARY_USER_ID,
  weightTrendKgPerWeek,
} from './userRepo';
import {
  avgCigarettesPerDay,
  dayCigarettes,
  getSmokingProfile,
  smokeFreeStreak,
} from './smokingRepo';
import { aerobicPenaltyPct } from '@/lib/smoking';
import { avgSleepHours, sleepForDate } from './sleepRepo';
import { alcoholImpact } from './alcoholRepo';
import { currentCycle } from './cycleRepo';

const DEFAULT_STEP_GOAL = 8000;

/** Assemble the aggregated context the rule engine needs. */
export function buildCoachContext(userId: number = PRIMARY_USER_ID): CoachContext {
  const user = getUser(userId);
  const goal = getNutritionGoal(userId);
  const today = todayISO();
  const since7 = daysAgoISO(6);

  const intake = dailyIntakeSince(since7, userId);
  const daysLoggedNutrition7d = intake.length;
  const avgCalories7d =
    intake.length > 0 ? intake.reduce((s, r) => s + r.calories, 0) / intake.length : null;
  const proteinTarget = goal?.proteinG ?? 140;
  const daysUnderProtein7d = intake.filter((r) => r.protein < proteinTarget * 0.8).length;

  const stepsToday = getDailySteps(today, userId)?.stepCount ?? 0;
  const sessionLoggedToday = listSessions({ since: today, until: today }, userId).length > 0;

  const smokingProfile = getSmokingProfile(userId);
  const smokingEnabled = !!smokingProfile?.enabled;
  const avgCigsPerDay7d = smokingEnabled ? avgCigarettesPerDay(7, userId) : 0;

  const alcohol = alcoholImpact(userId);
  const cycle = currentCycle(userId);

  return {
    today,
    goal: user?.goal ?? 'maintain',
    daysSinceLastSession: daysSinceLastSession(userId),
    consecutiveTrainingDays: consecutiveTrainingDays(userId),
    daysSinceType: daysSinceType(userId),
    volumeDrops: recentVolumeDrops(userId),
    calorieTarget: goal?.calorieTarget ?? 2200,
    proteinTarget,
    avgCalories7d,
    daysUnderProtein7d,
    daysLoggedNutrition7d,
    weightTrendKgPerWeek: weightTrendKgPerWeek(21, userId),
    avgWaterMl7d: avgWaterSince(since7, userId),
    waterGoalMl: goal?.waterGoalMl ?? 2500,
    avgCaffeineMg7d: avgCaffeineSince(since7, userId),
    caffeineSoftLimitMg: goal?.caffeineSoftLimitMg ?? 400,
    stepsToday,
    stepGoal: DEFAULT_STEP_GOAL,
    sessionLoggedToday,
    smokingEnabled,
    cigsToday: smokingEnabled ? dayCigarettes(today, userId) : 0,
    avgCigsPerDay7d,
    smokeFreeStreak: smokingEnabled ? smokeFreeStreak(userId) : 0,
    smokingDailyTarget: smokingProfile?.dailyTarget ?? null,
    aerobicPenaltyPct: aerobicPenaltyPct(avgCigsPerDay7d),
    avgSleep7d: avgSleepHours(7, userId),
    lastNightSleep: sleepForDate(today, userId)?.hours ?? null,
    alcoholWeekG: alcohol.weekGrams,
    alcoholWeeklyLimitG: alcohol.weeklyLimitG,
    dryDays7d: alcohol.dryDays7d,
    cycleEnabled: !!cycle,
    cyclePhase: cycle?.phase ?? null,
    cycleDaysUntilPeriod: cycle?.daysUntilNextPeriod ?? null,
  };
}

/**
 * Run the rule engine and persist any newly-triggered tips. A tip is inserted
 * only if a non-dismissed tip with the same ruleKey doesn't already exist this
 * ISO week — so a rule nudges once per window, not on every app open.
 */
export function refreshCoachTips(userId: number = PRIMARY_USER_ID): CoachTip[] {
  const ctx = buildCoachContext(userId);
  const drafts = generateCoachTips(ctx);
  const weekStart = startOfWeek(ctx.today);

  for (const d of drafts) {
    const existing = db
      .select()
      .from(coachTips)
      .where(and(eq(coachTips.userId, userId), eq(coachTips.ruleKey, d.ruleKey)))
      .orderBy(desc(coachTips.id))
      .limit(1)
      .get();
    // Skip if an identical rule already fired this week (dismissed or not).
    if (existing && existing.date >= weekStart) continue;
    db.insert(coachTips)
      .values({
        userId,
        date: ctx.today,
        category: d.category,
        title: d.title,
        message: d.message,
        ruleKey: d.ruleKey,
        dismissed: false,
      })
      .run();
  }
  return activeCoachTips(userId);
}

export function activeCoachTips(userId: number = PRIMARY_USER_ID): CoachTip[] {
  return db
    .select()
    .from(coachTips)
    .where(and(eq(coachTips.userId, userId), eq(coachTips.dismissed, false)))
    .orderBy(desc(coachTips.createdAt))
    .limit(5)
    .all();
}

export function dismissCoachTip(id: number): void {
  db.update(coachTips).set({ dismissed: true }).where(eq(coachTips.id, id)).run();
}

/** Small helper used by the Stats screen for a steps sparkline. */
export function weeklyStepAverage(userId: number = PRIMARY_USER_ID): number {
  const rows = stepHistorySince(daysAgoISO(6), userId);
  if (rows.length === 0) return 0;
  return Math.round(rows.reduce((s, r) => s + r.stepCount, 0) / rows.length);
}
