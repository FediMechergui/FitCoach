/**
 * How long after smoking until it is sensible to train — and why it stacks.
 *
 * ── The physiology ──
 * Two things happen when you smoke, on two different clocks:
 *
 *   1. NICOTINE — acute. Within minutes heart rate is up 10–20 beats, blood
 *      pressure is up, and the small arteries in skin and muscle are
 *      constricted. The airways are irritated and mucus is up. These effects
 *      peak in the first quarter-hour and fade over roughly 30–60 minutes,
 *      long before the nicotine itself is gone (half-life ~2 h). Training
 *      inside that window means a heart already working harder against
 *      narrower vessels — a worse session and, for hard efforts, more strain
 *      than the effort deserves. Every nicotine product does this, smoked or
 *      not: a pouch or a vape gets the acute window too, just without the
 *      smoke.
 *
 *   2. CARBON MONOXIDE — cumulative. Only what BURNS makes it. CO binds
 *      haemoglobin ~240× more tightly than oxygen, so each cigarette parks a
 *      little of your blood's oxygen-carrying capacity for hours: roughly one
 *      percentage point of carboxyhaemoglobin per cigarette, cleared with a
 *      half-life of about 4–5 hours breathing room air (faster when you
 *      breathe hard, slower asleep). Two cigarettes an hour apart do not reset
 *      each other — the second lands on what is left of the first. A cigar is
 *      several cigarettes' worth; a shisha session, with burning charcoal on
 *      top, is a dozen. Measured VO2max drops noticeably from ~4% COHb, and
 *      that is a normal evening for a pack-a-day smoker.
 *
 * ── The model ──
 *   • An acute floor since the LAST use of anything with nicotine — longer if
 *     it was smoked, scaled by how hard you intend to go.
 *   • A CO load in cigarette-equivalents (the same units the smoking module
 *     already uses for damage), summed over recent smoked products with
 *     exponential decay, that must fall under an intensity threshold before
 *     the clock says clear. That is the CUMULATIVE part: three cigarettes in
 *     an hour is not "45 minutes after the third".
 *   • Whichever of the two is later, capped. Estimates from the standard
 *     figures above; the UI says so.
 *
 * Nothing here softens the smoking module's health figures — this is only the
 * question of when to train after, answered honestly.
 */

import type { TrainingIntensity } from './digestion';

export interface SmokeEvent {
  /** epoch ms */
  at: number;
  /** was something burned and inhaled? */
  combusted: boolean;
  /** cigarette-equivalents of combustion per unit (0 when not combusted) */
  cigaretteEquivalent: number;
  /** units logged in this event */
  quantity: number;
}

// ── Model constants ────────────────────────────────────────────────────────

/** Minutes after the last use before the acute nicotine effects have faded, by intensity. */
export const NICOTINE_ACUTE_MIN: Record<TrainingIntensity, { combusted: number; other: number }> = {
  hard: { combusted: 45, other: 30 },
  moderate: { combusted: 30, other: 20 },
  light: { combusted: 15, other: 10 },
};
/** CO half-life breathing room air, minutes (4 h; literature 4–6 at rest, faster with activity). */
export const CO_HALF_LIFE_MIN = 240;
/**
 * The CO load (cigarette-equivalents still on board) that is acceptable for
 * each intensity. One cigarette on an empty system is under every threshold —
 * only the acute floor applies. Stack them and the CO term takes over.
 */
export const CO_THRESHOLD: Record<TrainingIntensity, number> = { hard: 2, moderate: 3, light: 5 };
/** Anything older than this contributes nothing worth counting. */
export const SMOKE_LOOKBACK_MIN = 24 * 60;
export const MAX_SMOKE_WAIT_MIN = 300;

/** CO load right now: Σ cigEq × qty × 2^(−Δt / half-life) over recent smoked events. */
export function coLoad(events: SmokeEvent[], now = Date.now()): number {
  let load = 0;
  for (const e of events) {
    if (!e.combusted || e.cigaretteEquivalent <= 0) continue;
    const dt = (now - e.at) / 60_000;
    if (dt < 0 || dt > SMOKE_LOOKBACK_MIN) continue;
    load += e.cigaretteEquivalent * Math.max(0, e.quantity) * Math.pow(2, -dt / CO_HALF_LIFE_MIN);
  }
  return load;
}

/** Minutes for a CO load to decay to `target`; 0 if already under. */
export function minutesToDecay(load: number, target: number): number {
  if (load <= target || target <= 0) return 0;
  return CO_HALF_LIFE_MIN * Math.log2(load / target);
}

export interface SmokeStatus {
  /** minutes since the last nicotine use of any kind */
  elapsedMin: number;
  /** minutes still to wait for the intensity asked; 0 when clear */
  remainingMin: number;
  ready: boolean;
  /** which intensity is fine RIGHT NOW */
  readyFor: TrainingIntensity | null;
  /** epoch ms at which the requested intensity is fine */
  readyAt: number;
  /** cigarette-equivalents of CO still on board (0 for pouches/vapes only) */
  coLoad: number;
  /** what is holding you: the acute nicotine window, the CO load, or nothing */
  limitedBy: 'nicotine' | 'co' | null;
  /** events inside the lookback window */
  recentCount: number;
  /** was the most recent one smoked? */
  lastCombusted: boolean;
  /** 0..1 how far along the wait is */
  progress: number;
}

function waitFor(events: SmokeEvent[], intensity: TrainingIntensity, now: number): { wait: number; by: 'nicotine' | 'co' | null } {
  const recent = events.filter((e) => e.at <= now && now - e.at <= SMOKE_LOOKBACK_MIN * 60_000);
  if (!recent.length) return { wait: 0, by: null };
  const last = recent.reduce((a, b) => (b.at > a.at ? b : a));
  const sinceLast = (now - last.at) / 60_000;
  const acute = last.combusted ? NICOTINE_ACUTE_MIN[intensity].combusted : NICOTINE_ACUTE_MIN[intensity].other;
  const nicotineWait = Math.max(0, acute - sinceLast);
  const coWait = minutesToDecay(coLoad(recent, now), CO_THRESHOLD[intensity]);
  const wait = Math.round(Math.min(MAX_SMOKE_WAIT_MIN, Math.max(nicotineWait, coWait)));
  return { wait, by: wait === 0 ? null : coWait > nicotineWait ? 'co' : 'nicotine' };
}

/** The smoke side of "can I train now?". Null when nothing was used in the lookback window. */
export function smokeStatus(events: SmokeEvent[], intensity: TrainingIntensity = 'moderate', now = Date.now()): SmokeStatus | null {
  const recent = events.filter((e) => e.at <= now && now - e.at <= SMOKE_LOOKBACK_MIN * 60_000);
  if (!recent.length) return null;
  const last = recent.reduce((a, b) => (b.at > a.at ? b : a));
  const elapsedMin = Math.max(0, Math.round((now - last.at) / 60_000));
  const { wait, by } = waitFor(recent, intensity, now);
  let readyFor: TrainingIntensity | null = null;
  for (const level of ['hard', 'moderate', 'light'] as const) {
    if (waitFor(recent, level, now).wait === 0) { readyFor = level; break; }
  }
  const required = elapsedMin + wait;
  return {
    elapsedMin,
    remainingMin: wait,
    ready: wait === 0,
    readyFor,
    readyAt: now + wait * 60_000,
    coLoad: Math.round(coLoad(recent, now) * 100) / 100,
    limitedBy: by,
    recentCount: recent.reduce((n, e) => n + Math.max(0, e.quantity), 0),
    lastCombusted: last.combusted,
    progress: required > 0 ? Math.min(1, elapsedMin / required) : 1,
  };
}

/** The smoke status that governs training NOW, or null when clear. */
export function currentSmoke(events: SmokeEvent[], intensity: TrainingIntensity = 'moderate', now = Date.now()): SmokeStatus | null {
  const s = smokeStatus(events, intensity, now);
  return s && !s.ready ? s : null;
}
