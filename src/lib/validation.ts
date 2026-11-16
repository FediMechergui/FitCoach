/** Validation shared by forms and persistence boundaries. */
export function finiteNumber(value: unknown, label: string, min: number, max: number): number {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${label} must be between ${min} and ${max}.`);
  }
  return number;
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return y >= 1900 && date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function calendarDate(value: string): string {
  if (!isCalendarDate(value)) throw new Error('Enter a real date in YYYY-MM-DD format.');
  return value;
}

export function optionalNumber(value: unknown, label: string, min: number, max: number): number | null {
  return value == null || value === '' ? null : finiteNumber(value, label, min, max);
}
