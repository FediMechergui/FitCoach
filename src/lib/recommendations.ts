import type { CoachCategory, SessionType } from '@/db/schema';

/**
 * Rule-based coaching engine (spec §3.7). Pure functions over an aggregated
 * context object; each rule returns at most one dismissible tip with a stable
 * `ruleKey` used to dedupe (a rule fires once per rolling window). Every tip
 * carries transparent reasoning, per the spec.
 */

export interface CoachContext {
  today: string; // ISO date
  goal: 'lose_fat' | 'maintain' | 'build_muscle';

  // Training / recovery
  daysSinceLastSession: number | null;
  consecutiveTrainingDays: number; // high-volume streak with no rest
  /** days since each session type was last performed (Infinity if never) */
  daysSinceType: Partial<Record<SessionType, number>>;
  /** per-exercise recent volume trend, e.g. bench dropped 20% */
  volumeDrops: Array<{ exercise: string; dropPct: number }>;

  // Nutrition (last 7 days)
  calorieTarget: number;
  proteinTarget: number;
  avgCalories7d: number | null;
  daysUnderProtein7d: number;
  daysLoggedNutrition7d: number;

  // Weight trend
  weightTrendKgPerWeek: number | null;

  // Hydration / caffeine (last 7 days)
  avgWaterMl7d: number | null;
  waterGoalMl: number;
  avgCaffeineMg7d: number | null;
  caffeineSoftLimitMg: number;

  // Activity (today)
  stepsToday: number;
  stepGoal: number;
  sessionLoggedToday: boolean;

  // Smoking (opt-in)
  smokingEnabled: boolean;
  cigsToday: number;
  avgCigsPerDay7d: number;
  smokeFreeStreak: number;
  smokingDailyTarget: number | null;
  aerobicPenaltyPct: number;
}

export interface CoachTipDraft {
  category: CoachCategory;
  title: string;
  message: string;
  ruleKey: string;
}

const WEEK = 'w'; // window suffix — one tip per rule per ISO week handled by caller

export function generateCoachTips(ctx: CoachContext): CoachTipDraft[] {
  const tips: CoachTipDraft[] = [];

  // ── Activity: sedentary nudge ──────────────────────────────────────────────
  if (
    !ctx.sessionLoggedToday &&
    ctx.stepGoal > 0 &&
    ctx.stepsToday < ctx.stepGoal * 0.5 &&
    isAfternoon(ctx.today)
  ) {
    tips.push({
      category: 'activity',
      title: 'Get moving today',
      message: `You're at ${ctx.stepsToday.toLocaleString()} of ${ctx.stepGoal.toLocaleString()} steps with no session logged. A 20-minute walk would close most of the gap.`,
      ruleKey: `activity.low_steps.${ctx.today}`,
    });
  }

  // ── Training: no session in a while ────────────────────────────────────────
  if (ctx.daysSinceLastSession !== null && ctx.daysSinceLastSession >= 4) {
    tips.push({
      category: 'training',
      title: 'Time to train',
      message: `It's been ${ctx.daysSinceLastSession} days since your last session. A short workout keeps your momentum and consistency streak alive.`,
      ruleKey: `training.inactive.${ctx.daysSinceLastSession >= 7 ? '7plus' : '4'}.${WEEK}`,
    });
  }

  // ── Training: neglected session type (e.g. no mobility in 3 weeks) ─────────
  const mobilityDays = ctx.daysSinceType.mindbody ?? Infinity;
  if (mobilityDays >= 21) {
    tips.push({
      category: 'training',
      title: 'Add some mobility',
      message: `No mobility or mind-body work in ${mobilityDays === Infinity ? 'a while' : `${mobilityDays} days`}. A yoga or stretching session aids recovery and joint health.`,
      ruleKey: `training.neglect.mindbody.${WEEK}`,
    });
  }

  // ── Training: progressive overload / volume drop ───────────────────────────
  const biggestDrop = [...ctx.volumeDrops].sort((a, b) => b.dropPct - a.dropPct)[0];
  if (biggestDrop && biggestDrop.dropPct >= 15) {
    tips.push({
      category: 'training',
      title: 'Volume is slipping',
      message: `Your ${biggestDrop.exercise} volume dropped ${Math.round(biggestDrop.dropPct)}% over 2 weeks — consider a deload week, then push back up.`,
      ruleKey: `training.volume_drop.${biggestDrop.exercise}.${WEEK}`,
    });
  }

  // ── Recovery: too many consecutive high-volume days ────────────────────────
  if (ctx.consecutiveTrainingDays >= 5) {
    tips.push({
      category: 'recovery',
      title: 'Schedule a rest day',
      message: `${ctx.consecutiveTrainingDays} training days in a row with no rest. A rest or light mind-body day now will protect your progress.`,
      ruleKey: `recovery.no_rest.${WEEK}`,
    });
  }

  // ── Nutrition: protein consistently low ────────────────────────────────────
  if (ctx.daysLoggedNutrition7d >= 3 && ctx.daysUnderProtein7d >= 3) {
    tips.push({
      category: 'nutrition',
      title: 'Protein is running low',
      message: `You've missed your ${Math.round(ctx.proteinTarget)}g protein target on ${ctx.daysUnderProtein7d} of the last 7 days. Protein protects muscle — aim for a source at each meal.`,
      ruleKey: `nutrition.low_protein.${WEEK}`,
    });
  }

  // ── Nutrition: calories vs weight-trend mismatch (recalibration) ───────────
  if (
    ctx.avgCalories7d !== null &&
    ctx.weightTrendKgPerWeek !== null &&
    ctx.daysLoggedNutrition7d >= 4
  ) {
    const trend = ctx.weightTrendKgPerWeek;
    if (ctx.goal === 'lose_fat' && trend > -0.05) {
      tips.push({
        category: 'nutrition',
        title: 'Fat-loss has stalled',
        message: `Weight is flat (${fmtTrend(trend)}/wk) while you're aiming to lose. Consider trimming ~150 kcal or adding activity, then re-check in a week.`,
        ruleKey: `nutrition.stall.lose.${WEEK}`,
      });
    } else if (ctx.goal === 'build_muscle' && trend < 0.05) {
      tips.push({
        category: 'nutrition',
        title: 'Not gaining yet',
        message: `You're aiming to build but weight isn't rising (${fmtTrend(trend)}/wk). A small +150 kcal bump should get the scale moving.`,
        ruleKey: `nutrition.stall.gain.${WEEK}`,
      });
    } else if (ctx.goal === 'lose_fat' && trend < -1.0) {
      tips.push({
        category: 'nutrition',
        title: 'Losing a bit fast',
        message: `Dropping ${fmtTrend(trend)}/wk is quicker than ideal and risks muscle loss. Adding ~150 kcal will make it more sustainable.`,
        ruleKey: `nutrition.fast_loss.${WEEK}`,
      });
    }
  }

  // ── Hydration: consistently low water ──────────────────────────────────────
  if (ctx.avgWaterMl7d !== null && ctx.waterGoalMl > 0 && ctx.avgWaterMl7d < ctx.waterGoalMl * 0.6) {
    tips.push({
      category: 'hydration',
      title: 'Drink a little more',
      message: `Your water intake has averaged ${Math.round((ctx.avgWaterMl7d ?? 0) / 100) / 10} L/day vs a ${(ctx.waterGoalMl / 1000).toFixed(1)} L goal. Keep a bottle in sight as a nudge.`,
      ruleKey: `hydration.low.${WEEK}`,
    });
  }

  // ── Caffeine: trending high ────────────────────────────────────────────────
  if (ctx.avgCaffeineMg7d !== null && ctx.avgCaffeineMg7d > ctx.caffeineSoftLimitMg) {
    tips.push({
      category: 'caffeine',
      title: 'Caffeine is trending high',
      message: `You've averaged ${Math.round(ctx.avgCaffeineMg7d)} mg/day, above the ${ctx.caffeineSoftLimitMg} mg guideline. Consider swapping a later cup for water or decaf.`,
      ruleKey: `caffeine.high.${WEEK}`,
    });
  }

  // ── Smoking (opt-in): impact on training & recovery ────────────────────────
  if (ctx.smokingEnabled) {
    // Smoked on a training day — highlight the direct performance/recovery link.
    if (ctx.sessionLoggedToday && ctx.cigsToday > 0) {
      tips.push({
        category: 'smoking',
        title: 'Smoking on a training day',
        message: `You trained and logged ${ctx.cigsToday} cigarette${ctx.cigsToday === 1 ? '' : 's'} today. Carbon monoxide lowers the oxygen your muscles get, so recovery and endurance take a hit — spacing cigarettes away from sessions helps.`,
        ruleKey: `smoking.training_day.${ctx.today}`,
      });
    }

    // Celebrate smoke-free milestones with the concrete health benefit.
    const milestone = [1, 3, 7, 14, 30].includes(ctx.smokeFreeStreak) ? ctx.smokeFreeStreak : null;
    if (milestone) {
      const benefit =
        milestone >= 14
          ? 'circulation and lung function are measurably improving'
          : milestone >= 3
            ? 'carbon monoxide has cleared and oxygen delivery is back up'
            : 'your heart rate and blood pressure are already recovering';
      tips.push({
        category: 'smoking',
        title: `${milestone} smoke-free day${milestone === 1 ? '' : 's'} 🎉`,
        message: `Great streak — ${benefit}. Your training will feel the difference.`,
        ruleKey: `smoking.milestone.${milestone}`,
      });
    }

    // Over the self-set daily cap.
    if (ctx.smokingDailyTarget != null && ctx.cigsToday > ctx.smokingDailyTarget) {
      tips.push({
        category: 'smoking',
        title: 'Over your daily cap',
        message: `${ctx.cigsToday} today vs a ${ctx.smokingDailyTarget} cap. No judgment — a walk or some breathwork can blunt the next craving.`,
        ruleKey: `smoking.over_cap.${ctx.today}`,
      });
    }

    // Sustained high use dragging endurance.
    if (ctx.avgCigsPerDay7d >= 10 && ctx.aerobicPenaltyPct >= 5) {
      tips.push({
        category: 'smoking',
        title: 'Smoking is capping your cardio',
        message: `At ~${ctx.avgCigsPerDay7d}/day, your aerobic capacity is an estimated ${ctx.aerobicPenaltyPct}% lower — that's real minutes off your pace. Even cutting back a few a day compounds fast.`,
        ruleKey: `smoking.aerobic.${WEEK}`,
      });
    }
  }

  return tips;
}

function isAfternoon(_iso: string): boolean {
  return new Date().getHours() >= 14;
}

function fmtTrend(kgPerWeek: number): string {
  const sign = kgPerWeek >= 0 ? '+' : '';
  return `${sign}${kgPerWeek.toFixed(2)} kg`;
}
