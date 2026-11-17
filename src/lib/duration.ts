/** Bare numbers mean seconds. Never silently interpret 45 as 45 minutes. */
export function parseDuration(value: string): number | null {
  const text = value.trim().toLowerCase().replace(/,/g, '.');
  if (!text) return null;
  let seconds: number;
  if (/^\d+:\d{1,2}$/.test(text)) {
    const [m, s] = text.split(':').map(Number);
    if (s >= 60) throw new Error('Use minutes:seconds, with seconds below 60.');
    seconds = m * 60 + s;
  } else {
    const match = text.match(/^(\d+(?:\.\d+)?)\s*(s|sec|secs|seconds?|m|min|mins|minutes?)?$/);
    if (!match) throw new Error('Enter seconds (45s), minutes (1.5m), or minutes:seconds (1:30).');
    seconds = Number(match[1]) * (match[2]?.startsWith('m') ? 60 : 1);
  }
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 604800) throw new Error('Duration must be greater than zero and at most 7 days.');
  return Math.max(1, Math.round(seconds));
}
export function clockDuration(seconds: number): string {
  const n = Math.max(0, Math.floor(seconds));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}
