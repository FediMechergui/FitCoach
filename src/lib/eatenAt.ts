/**
 * When was the meal actually finished?
 *
 * The digestion clock reads a diary row's `createdAt` as the moment eating
 * ended. That is right when you log as you finish — and wrong when you log
 * lunch at 15:00 because you forgot at 13:00: the clock would then think you
 * had just eaten and hold you back for two hours you have already waited. So
 * the log form asks, with "just now" as the default that keeps the one-tap
 * flow, and this file turns the answer into the timestamp to store.
 */

export type EatenAtChoice =
  | { kind: 'now' }
  | { kind: 'ago'; minutes: number }
  | { kind: 'clock'; hhmm: string };

export const EATEN_AT_PRESETS: Array<{ label: string; choice: EatenAtChoice }> = [
  { label: 'Just now', choice: { kind: 'now' } },
  { label: '15 min ago', choice: { kind: 'ago', minutes: 15 } },
  { label: '30 min ago', choice: { kind: 'ago', minutes: 30 } },
  { label: '1 h ago', choice: { kind: 'ago', minutes: 60 } },
  { label: '2 h ago', choice: { kind: 'ago', minutes: 120 } },
];

/** "13:40" → minutes since midnight; null when not a valid 24 h time. */
export function parseHHMM(text: string): number | null {
  const m = /^\s*(\d{1,2})\s*[:hH.]\s*(\d{2})\s*$/.exec(text) ?? /^\s*(\d{1,2})(\d{2})\s*$/.exec(text);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isInteger(h) || !Number.isInteger(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** Local midnight (epoch ms) of an ISO date, in the device's zone. */
function localMidnight(dateISO: string): number {
  const [y, mo, d] = dateISO.split('-').map(Number);
  return new Date(y, (mo ?? 1) - 1, d ?? 1, 0, 0, 0, 0).getTime();
}

const todayISOOf = (now: number): string => {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * The timestamp to store for a meal on `dateISO` given the user's choice, or
 * `undefined` to let the row take the database default (now) — which is what
 * "just now" on today means, and keeps every existing caller byte-identical.
 *
 * Rules:
 *   • never in the future — clamped to `now`;
 *   • "ago" and "clock" on a PAST diary date are anchored to that date, so a
 *     meal added to yesterday at 20:00 lands at yesterday 20:00;
 *   • "just now" on a past date means "unknown time" → the DB default, as before.
 */
export function resolveEatenAt(choice: EatenAtChoice, dateISO: string, now = Date.now()): number | undefined {
  const isToday = dateISO === todayISOOf(now);
  if (choice.kind === 'now') return undefined;
  if (choice.kind === 'ago') {
    const base = isToday ? now : localMidnight(dateISO) + 12 * 3_600_000; // past day: noon-ish anchor
    return Math.min(now, base - Math.max(0, choice.minutes) * 60_000);
  }
  const mins = parseHHMM(choice.hhmm);
  if (mins == null) return undefined;
  return Math.min(now, localMidnight(dateISO) + mins * 60_000);
}

/** "13:40" for a timestamp, for the caption under the chips. */
export function clockOf(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
