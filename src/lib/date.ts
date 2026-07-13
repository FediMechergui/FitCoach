/** Date helpers. All "day" values are ISO 'YYYY-MM-DD' in local time. */

export function toISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Difference in whole days between two ISO dates (a - b). */
export function daysBetween(a: string, b: string): number {
  const ms = fromISODate(a).getTime() - fromISODate(b).getTime();
  return Math.round(ms / 86_400_000);
}

/** Start-of-day epoch ms for an ISO date. */
export function startOfDayMs(iso: string): number {
  return fromISODate(iso).getTime();
}

/** ISO date N days ago (0 = today). */
export function daysAgoISO(n: number): string {
  return addDays(todayISO(), -n);
}

/** List of ISO dates for the last `n` days, oldest first (includes today). */
export function lastNDates(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(daysAgoISO(i));
  return out;
}

/** Monday-based start of the ISO week containing `iso`. */
export function startOfWeek(iso: string): string {
  const d = fromISODate(iso);
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  return addDays(iso, -dow);
}

export function ageFromBirthdate(birthdateISO: string | null, ref: Date = new Date()): number {
  if (!birthdateISO) return 30;
  const b = fromISODate(birthdateISO);
  let age = ref.getFullYear() - b.getFullYear();
  const m = ref.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < b.getDate())) age--;
  return age;
}
