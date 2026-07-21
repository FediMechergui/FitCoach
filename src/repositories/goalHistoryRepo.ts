import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { goalHistory, type GoalHistory } from '@/db/schema';
import type { Goal, RateOfChange } from '@/lib/calories';
import { todayISO } from '@/lib/date';
import { PRIMARY_USER_ID } from './userRepo';

/**
 * A log of every goal change / target recalculation — the same idea as weigh-in
 * history, so you can see how your targets evolved alongside your body.
 */

export interface GoalSnapshot {
  goal: Goal;
  rateOfChange: RateOfChange;
  targetWeightKg?: number | null;
  calorieTarget: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  tdee?: number | null;
  bmr?: number | null;
  basis?: string | null;
  atWeightKg?: number | null;
  atBodyFatPct?: number | null;
  notes?: string | null;
  date?: string;
}

export function recordGoalChange(snap: GoalSnapshot, userId: number = PRIMARY_USER_ID): void {
  db.insert(goalHistory)
    .values({
      userId,
      date: snap.date ?? todayISO(),
      goal: snap.goal,
      rateOfChange: snap.rateOfChange,
      targetWeightKg: snap.targetWeightKg ?? null,
      calorieTarget: snap.calorieTarget,
      proteinG: snap.proteinG,
      carbsG: snap.carbsG,
      fatG: snap.fatG,
      tdee: snap.tdee ?? null,
      bmr: snap.bmr ?? null,
      basis: snap.basis ?? null,
      atWeightKg: snap.atWeightKg ?? null,
      atBodyFatPct: snap.atBodyFatPct ?? null,
      notes: snap.notes ?? null,
    })
    .run();
}

export function goalHistoryList(limit = 50, userId: number = PRIMARY_USER_ID): GoalHistory[] {
  return db
    .select()
    .from(goalHistory)
    .where(eq(goalHistory.userId, userId))
    .orderBy(desc(goalHistory.date), desc(goalHistory.id))
    .limit(limit)
    .all();
}

export function latestGoalRecord(userId: number = PRIMARY_USER_ID): GoalHistory | undefined {
  return goalHistoryList(1, userId)[0];
}

export function deleteGoalRecord(id: number): void {
  db.delete(goalHistory).where(eq(goalHistory.id, id)).run();
}
