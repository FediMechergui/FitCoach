import { hmToMinutes } from './time';
import type { PrayerTimes } from './prayers';

/**
 * Fasting model. Two modes:
 *  • ramadan      — fast from Fajr (suhoor end) to Maghrib (iftar); windows come
 *                   from the prayer calculator when configured, else manual times
 *  • intermittent — eat inside a daily window (e.g. 16:8), fast outside it
 */

export type FastingMode = 'ramadan' | 'intermittent';

export interface FastingWindow {
  /** fast start 'HH:MM' (suhoor end / eating end) */
  fastStart: string;
  /** fast end 'HH:MM' (iftar / eating start) */
  fastEnd: string;
}

export interface FastingState {
  fasting: boolean;
  /** what's coming next: 'iftar' when fasting, 'fast start' when eating */
  nextLabel: string;
  nextTime: string;
  minutesUntilNext: number;
  window: FastingWindow;
  /** how far through the current phase, 0..1 */
  progress: number;
}

/** Resolve the day's fasting window for a mode. */
export function resolveWindow(
  mode: FastingMode,
  opts: {
    prayers?: PrayerTimes | null;
    manualSuhoor?: string | null;
    manualIftar?: string | null;
    eatingStart?: string | null;
    eatingEnd?: string | null;
  }
): FastingWindow {
  if (mode === 'ramadan') {
    return {
      fastStart: opts.prayers?.fajr ?? opts.manualSuhoor ?? '04:00',
      fastEnd: opts.prayers?.maghrib ?? opts.manualIftar ?? '19:00',
    };
  }
  // Intermittent: fasting outside the eating window.
  return {
    fastStart: opts.eatingEnd ?? '20:00',
    fastEnd: opts.eatingStart ?? '12:00',
  };
}

/** Current fasting state at `now` for a window (handles overnight spans). */
export function fastingState(window: FastingWindow, now: Date = new Date()): FastingState {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const start = hmToMinutes(window.fastStart) ?? 0;
  const end = hmToMinutes(window.fastEnd) ?? 0;

  // Is `nowMin` inside [start, end) accounting for wrap?
  const inFast =
    start <= end ? nowMin >= start && nowMin < end : nowMin >= start || nowMin < end;

  const until = (target: number) => (target - nowMin + 24 * 60) % (24 * 60);

  if (inFast) {
    const total = (end - start + 24 * 60) % (24 * 60) || 24 * 60;
    const elapsed = (nowMin - start + 24 * 60) % (24 * 60);
    return {
      fasting: true,
      nextLabel: 'Iftar / eating window',
      nextTime: window.fastEnd,
      minutesUntilNext: until(end),
      window,
      progress: Math.min(1, elapsed / total),
    };
  }
  const total = (start - end + 24 * 60) % (24 * 60) || 24 * 60;
  const elapsed = (nowMin - end + 24 * 60) % (24 * 60);
  return {
    fasting: false,
    nextLabel: 'Fast begins',
    nextTime: window.fastStart,
    minutesUntilNext: until(start),
    window,
    progress: Math.min(1, elapsed / total),
  };
}

/** Fasting has real, evidence-backed training implications — shown in-app. */
export const FASTING_TRAINING_TIPS = [
  'Train light-to-moderate while fasted; schedule hard sessions after Iftar / in the eating window.',
  'Protect protein: hit your full daily protein target inside the eating window.',
  'Front-load hydration — most of your water now has to fit into non-fasting hours.',
  'Suhoor with slow carbs, protein and fat (e.g. bsisa, eggs, dates) sustains the day better than a sugary meal.',
];
