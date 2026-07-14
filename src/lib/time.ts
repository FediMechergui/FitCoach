/**
 * Time-of-day helpers for range logging (sleep bedtime→wake, work start→end).
 * Times are 'HH:MM' 24-hour strings.
 */

export function parseHM(hm: string): { h: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

export function hmToMinutes(hm: string): number | null {
  const p = parseHM(hm);
  return p ? p.h * 60 + p.m : null;
}

/**
 * Duration in minutes between two 'HH:MM' times. If `overnight` (end earlier
 * than start, e.g. sleep 23:30 → 07:00), the span wraps past midnight.
 */
export function rangeMinutes(start: string, end: string): number | null {
  const s = hmToMinutes(start);
  const e = hmToMinutes(end);
  if (s == null || e == null) return null;
  let diff = e - s;
  if (diff < 0) diff += 24 * 60; // wrapped past midnight
  return diff;
}

/** 135 → "2h 15m" */
export function minutesToHM(totalMinutes: number): string {
  const t = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(t / 60);
  const m = t % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/** 135 → 2.25 (decimal hours) */
export function minutesToHours(totalMinutes: number): number {
  return Math.round((totalMinutes / 60) * 100) / 100;
}

/** Build a validated 'HH:MM' string, clamping fields. */
export function makeHM(h: number, m: number): string {
  const hh = Math.min(23, Math.max(0, Math.round(h)));
  const mm = Math.min(59, Math.max(0, Math.round(m)));
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
