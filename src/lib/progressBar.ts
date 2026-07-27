/**
 * Text progress bars for notifications.
 *
 * Android's native notification progress bar isn't exposed through
 * expo-notifications, so we draw one with block characters instead. It renders
 * identically on every device, updates in place with the rest of the body text,
 * and needs no native module.
 */

const FILLED = '█';
const EMPTY = '░';

/** A block-character bar, e.g. `████████░░░░`. `fraction` is clamped to 0…1. */
export function progressBar(fraction: number, width = 12): string {
  const f = Number.isFinite(fraction) ? Math.max(0, Math.min(1, fraction)) : 0;
  const filled = Math.round(f * width);
  return FILLED.repeat(filled) + EMPTY.repeat(Math.max(0, width - filled));
}

/** `████████░░░░ 62%` */
export function progressBarWithPct(fraction: number, width = 12): string {
  const f = Number.isFinite(fraction) ? Math.max(0, Math.min(1, fraction)) : 0;
  return `${progressBar(f, width)} ${Math.round(f * 100)}%`;
}
