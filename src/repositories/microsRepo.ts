import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { foodEntries, supplementLogs } from '@/db/schema';
import { sumMicros, type MicroProfile } from '@/lib/micros';
import { todayISO } from '@/lib/date';
import { PRIMARY_USER_ID } from './userRepo';

function parseMicros(raw: string | null): Partial<MicroProfile> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<MicroProfile>;
  } catch {
    return {};
  }
}

export interface DayMicros {
  totals: MicroProfile;
  fromFood: MicroProfile;
  fromSupplements: MicroProfile;
  /** how many of the day's food entries carried micro data */
  foodEntriesWithMicros: number;
  foodEntriesTotal: number;
  supplementCount: number;
}

/**
 * Total micronutrient intake for a day = food micros (denormalized at log time)
 * + micronutrient-supplement micros. Purely additive to macros; reads only the
 * `micros` JSON columns.
 */
export function dayMicros(date: string = todayISO(), userId: number = PRIMARY_USER_ID): DayMicros {
  const foods = db
    .select()
    .from(foodEntries)
    .where(and(eq(foodEntries.userId, userId), eq(foodEntries.date, date)))
    .all();

  const supps = db
    .select()
    .from(supplementLogs)
    .where(and(eq(supplementLogs.userId, userId), eq(supplementLogs.date, date)))
    .all();

  const foodProfiles = foods.map((f) => parseMicros(f.micros));
  const suppProfiles = supps.map((s) => parseMicros(s.micros));

  const fromFood = sumMicros(foodProfiles);
  const fromSupplements = sumMicros(suppProfiles);
  const totals = sumMicros([fromFood, fromSupplements]);

  return {
    totals,
    fromFood,
    fromSupplements,
    foodEntriesWithMicros: foods.filter((f) => f.micros).length,
    foodEntriesTotal: foods.length,
    supplementCount: supps.length,
  };
}
