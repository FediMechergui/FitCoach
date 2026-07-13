import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  nutritionGoals,
  users,
  weighIns,
  type NewUser,
  type NutritionGoal,
  type User,
  type WeighIn,
} from '@/db/schema';
import { todayISO } from '@/lib/date';

/** The app is single-user (local-first); user id 1 is the primary profile. */
export const PRIMARY_USER_ID = 1;

export function getUser(id: number = PRIMARY_USER_ID): User | undefined {
  return db.select().from(users).where(eq(users.id, id)).get();
}

export function ensureUser(): User {
  const existing = getUser();
  if (existing) return existing;
  db.insert(users).values({ id: PRIMARY_USER_ID, name: 'Athlete' }).run();
  return getUser()!;
}

export function updateUser(patch: Partial<NewUser>, id: number = PRIMARY_USER_ID): User {
  db.update(users).set(patch).where(eq(users.id, id)).run();
  return getUser(id)!;
}

export function markOnboarded(id: number = PRIMARY_USER_ID): void {
  db.update(users).set({ onboardedAt: Date.now() }).where(eq(users.id, id)).run();
}

export function isOnboarded(id: number = PRIMARY_USER_ID): boolean {
  const u = getUser(id);
  return !!u?.onboardedAt;
}

// ── Weigh-ins ────────────────────────────────────────────────────────────────
export function addWeighIn(
  weightKg: number,
  extra: { bodyFatPct?: number | null; waistCm?: number | null; hipCm?: number | null; date?: string } = {},
  userId: number = PRIMARY_USER_ID
): void {
  const date = extra.date ?? todayISO();
  // One weigh-in per day: replace an existing same-day entry.
  db.delete(weighIns).where(and(eq(weighIns.userId, userId), eq(weighIns.date, date))).run();
  db.insert(weighIns)
    .values({
      userId,
      date,
      weightKg,
      bodyFatPct: extra.bodyFatPct ?? null,
      waistCm: extra.waistCm ?? null,
      hipCm: extra.hipCm ?? null,
    })
    .run();
}

export function latestWeight(userId: number = PRIMARY_USER_ID): WeighIn | undefined {
  return db
    .select()
    .from(weighIns)
    .where(eq(weighIns.userId, userId))
    .orderBy(desc(weighIns.date))
    .limit(1)
    .get();
}

export function weighInHistory(userId: number = PRIMARY_USER_ID): WeighIn[] {
  return db
    .select()
    .from(weighIns)
    .where(eq(weighIns.userId, userId))
    .orderBy(weighIns.date)
    .all();
}

/**
 * Linear-fit weight trend in kg/week over the most recent `days`.
 * Returns null if fewer than 2 weigh-ins in the window.
 */
export function weightTrendKgPerWeek(days = 21, userId: number = PRIMARY_USER_ID): number | null {
  const all = weighInHistory(userId);
  if (all.length < 2) return null;
  const cutoff = Date.now() - days * 86_400_000;
  const pts = all
    .map((w) => ({ t: new Date(w.date).getTime(), y: w.weightKg }))
    .filter((p) => p.t >= cutoff);
  if (pts.length < 2) return null;

  // Least-squares slope (kg per ms) → kg per week.
  const n = pts.length;
  const meanT = pts.reduce((s, p) => s + p.t, 0) / n;
  const meanY = pts.reduce((s, p) => s + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of pts) {
    num += (p.t - meanT) * (p.y - meanY);
    den += (p.t - meanT) ** 2;
  }
  if (den === 0) return null;
  const slopePerMs = num / den;
  return slopePerMs * 7 * 86_400_000;
}

// ── Nutrition goal ───────────────────────────────────────────────────────────
export function getNutritionGoal(userId: number = PRIMARY_USER_ID): NutritionGoal | undefined {
  return db
    .select()
    .from(nutritionGoals)
    .where(eq(nutritionGoals.userId, userId))
    .orderBy(desc(nutritionGoals.id))
    .limit(1)
    .get();
}

export function upsertNutritionGoal(
  goal: {
    calorieTarget: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    waterGoalMl: number;
    caffeineSoftLimitMg: number;
    tdee?: number | null;
  },
  userId: number = PRIMARY_USER_ID
): NutritionGoal {
  const existing = getNutritionGoal(userId);
  const payload = {
    userId,
    ...goal,
    tdee: goal.tdee ?? null,
    lastRecalculatedDate: todayISO(),
  };
  if (existing) {
    db.update(nutritionGoals).set(payload).where(eq(nutritionGoals.id, existing.id)).run();
    return getNutritionGoal(userId)!;
  }
  db.insert(nutritionGoals).values(payload).run();
  return getNutritionGoal(userId)!;
}
