import { addDays, todayISO } from '@/lib/date';

/**
 * Streak arithmetic that knows the difference between a miss and a rest.
 *
 * Pure: no database, so the suite can prove it. A "rest" day carries a run
 * across without counting — it is a decision, not a training day — and a run
 * made only of rest days is zero: you cannot rest your way to a streak.
 */

/** Walk back from today (or yesterday when today is neither yet). */
export function bridgedStreak(has: (d: string) => boolean, rest: (d: string) => boolean, horizon = 400, today = todayISO()): number {
  let streak = 0;
  const cursor = has(today) || rest(today) ? 0 : 1;
  for (let i = cursor; i < horizon; i++) {
    // Relative to the `today` given, never the wall clock — so it is provable.
    const d = addDays(today, -i);
    if (has(d)) streak++;
    else if (rest(d)) continue;
    else break;
  }
  return streak;
}

/** True when every calendar day strictly between a and b is a rest day (or there are none). */
export function onlyRestBetween(a: string, b: string, rest: Set<string>): boolean {
  const start = Date.parse(a);
  const end = Date.parse(b);
  const gap = Math.round((end - start) / 86_400_000);
  if (gap <= 0) return false;
  for (let i = 1; i < gap; i++) {
    const d = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
    if (!rest.has(d)) return false;
  }
  return true;
}

/** Longest bridged run over all history, given ascending earned dates. */
export function bestBridgedStreak(earnedSorted: string[], rest: Set<string>): number {
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of earnedSorted) {
    run = prev && onlyRestBetween(prev, d, rest) ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}
