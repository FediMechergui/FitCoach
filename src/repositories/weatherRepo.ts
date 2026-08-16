import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { weatherReadings, type WeatherReadingRow } from '@/db/schema';
import { extraWaterMl, feelsLikeC, isReadingFresh, weatherAdvice, type WeatherAdvice, type WeatherContext, type WeatherReading } from '@/lib/weather';
import { todayISO } from '@/lib/date';
import { PRIMARY_USER_ID } from './userRepo';

/**
 * Weather readings — stored, so the app can work from the last one it has and
 * so today's advice doesn't vanish the moment the network does.
 */

export function saveWeatherReading(
  r: Omit<WeatherReading, 'observedAt'> & { observedAt?: number },
  date: string = todayISO(),
  userId: number = PRIMARY_USER_ID
): void {
  db.insert(weatherReadings)
    .values({
      userId,
      date,
      tempC: r.tempC,
      humidityPct: r.humidityPct,
      windKmh: r.windKmh,
      source: r.source,
      observedAt: r.observedAt ?? Date.now(),
    })
    .run();
}

/** The most recent reading for a day, whatever its source. */
export function latestReading(date: string = todayISO(), userId: number = PRIMARY_USER_ID): WeatherReading | null {
  const row = db
    .select()
    .from(weatherReadings)
    .where(and(eq(weatherReadings.userId, userId), eq(weatherReadings.date, date)))
    .orderBy(desc(weatherReadings.observedAt))
    .limit(1)
    .get();
  return row ? toReading(row) : null;
}

/** Latest reading if it's still recent enough to act on, else null. */
export function freshReading(date: string = todayISO(), userId: number = PRIMARY_USER_ID): WeatherReading | null {
  const r = latestReading(date, userId);
  return r && isReadingFresh(r) ? r : null;
}

export function todaysAdvice(ctx: WeatherContext, userId: number = PRIMARY_USER_ID): WeatherAdvice | null {
  const r = latestReading(todayISO(), userId);
  return r ? weatherAdvice(r, ctx) : null;
}

function toReading(row: WeatherReadingRow): WeatherReading {
  return {
    tempC: row.tempC,
    humidityPct: row.humidityPct,
    windKmh: row.windKmh,
    observedAt: row.observedAt,
    source: row.source,
  };
}

/**
 * Today's hydration goal with the weather's extra on top.
 *
 * The base goal is the user's; the weather adds to it, never subtracts, and
 * only when there's a reading from today. Returns the parts separately so a
 * screen can show "2,500 + 400 for the heat" rather than an unexplained number.
 */
export function weatherAdjustedWaterGoal(
  baseMl: number,
  plannedActiveMin = 45,
  userId: number = PRIMARY_USER_ID
): { totalMl: number; extraMl: number; feelsLike: number | null } {
  const r = latestReading(todayISO(), userId);
  if (!r) return { totalMl: baseMl, extraMl: 0, feelsLike: null };
  const fl = feelsLikeC(r);
  const extra = extraWaterMl(fl, plannedActiveMin, { tempC: r.tempC, humidityPct: r.humidityPct });
  return { totalMl: baseMl + extra, extraMl: extra, feelsLike: fl };
}
