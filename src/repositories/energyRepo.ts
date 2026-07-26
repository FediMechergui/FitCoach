import { computeEnergyBalance, type EnergyBalance } from '@/lib/energyBalance';
import { ACTIVITY_MULTIPLIERS } from '@/lib/calories';
import { todayISO, toISODate } from '@/lib/date';
import { getNutritionGoal, getUser, PRIMARY_USER_ID } from './userRepo';
import { dayNutrition } from './nutritionRepo';
import { listSessions } from './sessionRepo';
import { listWalkSessions } from './activityRepo';

/**
 * Assemble the day's energy balance from real logs: the goal's target and TDEE,
 * today's food, and today's *training* burn (sessions + walks/runs). Returns
 * null until a nutrition goal exists — there's nothing honest to compare against
 * without a target.
 */
export function energyBalanceFor(date: string = todayISO(), userId: number = PRIMARY_USER_ID): EnergyBalance | null {
  const goal = getNutritionGoal(userId);
  if (!goal) return null;
  const user = getUser(userId);

  const tdee = goal.tdee ?? goal.calorieTarget;
  const mult = ACTIVITY_MULTIPLIERS[user?.activityLevel ?? 'moderate'] ?? 1.55;
  const bmr = Math.round(tdee / mult);

  const consumed = dayNutrition(date, userId).calories;

  // Training burn on that date — sessions plus any walk/run tracked that day.
  const sessions = listSessions({ since: date, until: date }, userId);
  let exercise = sessions.reduce((s, x) => s + (x.caloriesBurned ?? 0), 0);
  const walks = listWalkSessions(500, userId).filter((w) => toISODate(new Date(w.startTime)) === date);
  exercise += walks.reduce((s, w) => s + (w.caloriesBurned ?? 0), 0);

  return computeEnergyBalance({
    goal: user?.goal ?? 'maintain',
    calorieTarget: goal.calorieTarget,
    tdee,
    bmr,
    consumedKcal: consumed,
    exerciseKcal: exercise,
  });
}
