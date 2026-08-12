import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/db/client';
import { foodEntries, supplementLogs, supplementStack, type SupplementLog, type SupplementStack } from '@/db/schema';
import { findSupplement, servingUnits } from '@/data/supplements';
import { scaleMicros } from '@/lib/micros';
import { addPreciseFood } from './nutritionRepo';
import { daysAgoISO, todayISO } from '@/lib/date';
import { PRIMARY_USER_ID } from './userRepo';

// ── Stack (the user's chosen supplements for one-tap logging) ────────────────
export function getStack(userId: number = PRIMARY_USER_ID): SupplementStack[] {
  return db
    .select()
    .from(supplementStack)
    .where(and(eq(supplementStack.userId, userId), eq(supplementStack.enabled, true)))
    .all();
}

export function inStack(key: string, userId: number = PRIMARY_USER_ID): boolean {
  return (
    db
      .select()
      .from(supplementStack)
      .where(and(eq(supplementStack.userId, userId), eq(supplementStack.key, key), eq(supplementStack.enabled, true)))
      .get() != null
  );
}

export function addToStack(
  key: string,
  dose?: string,
  userId: number = PRIMARY_USER_ID,
  unitsPerServing?: number | null
): void {
  const existing = db
    .select()
    .from(supplementStack)
    .where(and(eq(supplementStack.userId, userId), eq(supplementStack.key, key)))
    .get();
  const def = findSupplement(key);
  const payload = {
    dose: dose ?? def?.defaultDose ?? null,
    // Seed from the catalogue, but this is the user's own product from here on.
    unitsPerServing: unitsPerServing ?? existing?.unitsPerServing ?? def?.unitsPerServing ?? null,
    enabled: true,
  };
  if (existing) {
    db.update(supplementStack).set(payload).where(eq(supplementStack.id, existing.id)).run();
  } else {
    db.insert(supplementStack).values({ userId, key, ...payload }).run();
  }
}

/**
 * How many pills make one portion of the product the user actually owns.
 * Brands differ — spirulina comes as 500 mg tablets from one maker and 1 g
 * capsules from another — so their own number always beats the catalogue's.
 */
export function setUnitsPerServing(
  key: string,
  units: number | null,
  userId: number = PRIMARY_USER_ID
): void {
  const clean = units != null && Number.isFinite(units) && units > 0 ? Math.round(units) : null;
  db.update(supplementStack)
    .set({ unitsPerServing: clean })
    .where(and(eq(supplementStack.userId, userId), eq(supplementStack.key, key)))
    .run();
}

/** The pills-per-portion in force for a supplement: the user's, else the catalogue's. */
export function unitsPerServingFor(key: string, userId: number = PRIMARY_USER_ID): number | null {
  const row = db
    .select()
    .from(supplementStack)
    .where(and(eq(supplementStack.userId, userId), eq(supplementStack.key, key)))
    .get();
  return row?.unitsPerServing ?? findSupplement(key)?.unitsPerServing ?? null;
}

export function removeFromStack(key: string, userId: number = PRIMARY_USER_ID): void {
  db.delete(supplementStack)
    .where(and(eq(supplementStack.userId, userId), eq(supplementStack.key, key)))
    .run();
}

// ── Logging ──────────────────────────────────────────────────────────────────
export function logSupplement(
  key: string,
  opts: { dose?: string; date?: string; unitsTaken?: number | null } = {},
  userId: number = PRIMARY_USER_ID
): void {
  const def = findSupplement(key);
  if (!def) return;
  /*
   * Default to a full portion, so the one-tap "took it" button keeps working
   * exactly as before and still records a real pill count. Passing a number
   * logs a part portion — which is the honest record when you took 2 of your
   * usual 6 tablets, and stops the day looking like a full dose.
   */
  const perServing = unitsPerServingFor(key, userId);
  const units =
    opts.unitsTaken != null && Number.isFinite(opts.unitsTaken) && opts.unitsTaken > 0
      ? opts.unitsTaken
      : perServing;
  const date = opts.date ?? todayISO();
  const fraction = perServing && units ? units / perServing : 1;

  /*
   * A supplement with real energy writes a diary row, so its calories flow
   * through the same engine as food — the ring, the energy strip, projections.
   * Fish oil is a gram of fat per softgel; small, but fat is not free. The row
   * id is stored on the log so deleting the log deletes its calories too.
   */
  let foodEntryId: number | null = null;
  if (def.macros) {
    foodEntryId = addPreciseFood(
      {
        mealType: 'snack',
        foodName: `${def.label} (supplement)`,
        quantity: 1,
        servingSize: servingUnits(def) ?? def.defaultDose,
        calories: def.macros.calories * fraction,
        proteinG: (def.macros.proteinG ?? 0) * fraction,
        carbsG: (def.macros.carbsG ?? 0) * fraction,
        fatG: (def.macros.fatG ?? 0) * fraction,
        fiberG: 0,
        // Micros stay on the supplement log — carrying them here too would
        // count them twice on the Micros screen.
        date,
      },
      userId
    );
  }

  db.insert(supplementLogs)
    .values({
      userId,
      date,
      key,
      label: def.label,
      category: def.category,
      dose: opts.dose ?? def.defaultDose ?? null,
      unitsTaken: units ?? null,
      foodEntryId,
      // Micros scale with the fraction of a portion actually taken — half the
      // pills is half the iron, and pretending otherwise inflates the day.
      micros: def.micros
        ? JSON.stringify(
            perServing && units && perServing !== units
              ? scaleMicros(def.micros, units / perServing)
              : def.micros
          )
        : null,
    })
    .run();
}

/** Pills swallowed today for one supplement, across every entry. */
export function unitsTakenToday(
  key: string,
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): number {
  const rows = db
    .select({ units: supplementLogs.unitsTaken })
    .from(supplementLogs)
    .where(and(eq(supplementLogs.userId, userId), eq(supplementLogs.key, key), eq(supplementLogs.date, date)))
    .all();
  return rows.reduce((sum, r) => sum + (r.units ?? 0), 0);
}

/** Every pill swallowed today, across the whole stack. */
export function totalUnitsToday(date: string = todayISO(), userId: number = PRIMARY_USER_ID): number {
  const rows = db
    .select({ units: supplementLogs.unitsTaken })
    .from(supplementLogs)
    .where(and(eq(supplementLogs.userId, userId), eq(supplementLogs.date, date)))
    .all();
  return rows.reduce((sum, r) => sum + (r.units ?? 0), 0);
}

export function deleteSupplementLog(id: number): void {
  // A macro-bearing supplement wrote a diary row when it was logged; removing
  // the log must remove those calories with it, or an undone fish-oil tap
  // would keep its fat in the day forever.
  const row = db.select().from(supplementLogs).where(eq(supplementLogs.id, id)).get();
  if (row?.foodEntryId != null) {
    db.delete(foodEntries).where(eq(foodEntries.id, row.foodEntryId)).run();
  }
  db.delete(supplementLogs).where(eq(supplementLogs.id, id)).run();
}

export function loggedToday(key: string, date: string = todayISO(), userId: number = PRIMARY_USER_ID): boolean {
  return (
    db
      .select()
      .from(supplementLogs)
      .where(and(eq(supplementLogs.userId, userId), eq(supplementLogs.key, key), eq(supplementLogs.date, date)))
      .get() != null
  );
}

export function supplementsForDay(date: string = todayISO(), userId: number = PRIMARY_USER_ID): SupplementLog[] {
  return db
    .select()
    .from(supplementLogs)
    .where(and(eq(supplementLogs.userId, userId), eq(supplementLogs.date, date)))
    .orderBy(desc(supplementLogs.createdAt))
    .all();
}

/** Consecutive-day streak for a supplement, ending today (or yesterday). */
export function supplementStreak(key: string, userId: number = PRIMARY_USER_ID): number {
  const rows = db
    .select({ date: supplementLogs.date })
    .from(supplementLogs)
    .where(and(eq(supplementLogs.userId, userId), eq(supplementLogs.key, key), gte(supplementLogs.date, daysAgoISO(400))))
    .all();
  if (rows.length === 0) return 0;
  const days = new Set(rows.map((r) => r.date));
  let streak = 0;
  const start = days.has(todayISO()) ? 0 : 1;
  for (let i = start; i < 400; i++) {
    if (days.has(daysAgoISO(i))) streak++;
    else break;
  }
  return streak;
}
