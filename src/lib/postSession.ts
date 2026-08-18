/**
 * After the session: the margins to keep — and the one window to hit —
 * before smoking, drinking, eating, a cold plunge or the next hard session,
 * scaled by how hard THIS session actually was.
 *
 * ── Why the session matters ──
 * The hours after training are when the work pays off: muscle protein
 * synthesis climbs over the next 3–5 h and stays up for a day, glycogen is
 * being rebuilt, blood is still being pushed to the muscles you used, and
 * breathing and heart rate are still elevated. Anything that fights those —
 * or gets amplified by them — costs more after a hard session than after an
 * easy one, and for longer. So the margins scale with a STRAIN score built
 * from what was logged: duration, hard sets and how close to failure they
 * were, tonnage relative to bodyweight, and for cardio the type and pace.
 *
 * ── The items, and the evidence behind each ──
 *   EAT      — not a wait, a WINDOW. Protein (20–40 g) plus carbohydrate
 *              within ~2 h supports the repair that is already under way;
 *              the "anabolic window" is generous, but sooner matters more
 *              after a hard or long session, after fasted training, or when
 *              the next session is under 24 h away. The only reason to give
 *              it 15–30 min is that gut blood flow needs to come back —
 *              eating with a heaving stomach helps nobody.
 *   WATER    — now. You are down whatever you sweated; the weather engine's
 *              sweat model sizes it, this card just says start.
 *   SMOKE    — wait, and longer after harder work. Ventilation is still high,
 *              so smoke deposits deeper; carbon monoxide takes oxygen delivery
 *              exactly when repair wants it; nicotine narrows the vessels that
 *              are supposed to be flushing the muscles. 1 h after an easy
 *              session, ~2.5 h after a brutal one.
 *   ALCOHOL  — wait longer, and less of it. Around 1.5 g/kg after training
 *              cut muscle protein synthesis by roughly a quarter to a third for
 *              the following day even WITH protein; it also slows glycogen
 *              refill, works as a diuretic against rehydration, and wrecks the
 *              deep sleep the session was going to bank. 1.5 h after an easy
 *              session, ~5 h after a brutal one — rehydrate and eat first,
 *              keep it to a drink or two, and on a heavy lifting day the
 *              honest answer is none.
 *   COLD     — cold-water immersion within about an hour of lifting blunts the
 *              hypertrophy signal (the classic 2015 study: 10 min at 10 °C
 *              after each session, less strength and less muscle after 12
 *              weeks). Fine after cardio; after lifting, if the goal is
 *              muscle, keep it 4–6 h away — or make it a cool shower.
 *   NEXT     — the same muscles again, hard: 24 h after light work, ~72 h
 *              after brutal. Something else — a walk, other muscles — is fine
 *              sooner; the growth engine tracks the per-muscle picture.
 *
 * Every function is pure so the numbers can be checked without a device.
 */

import { summariseEffort, type SetEffort } from './effort';

export type SessionFlow = 'lifting' | 'cardio' | 'mindbody';
export type StrainLevel = 'light' | 'moderate' | 'hard' | 'brutal';

export interface StrainInput {
  sessionType: string;
  flow: SessionFlow;
  durationMin: number;
  /** completed sets (lifting) — reps / RPE / to-failure */
  sets?: SetEffort[];
  /** total tonnage lifted, kg (Σ weight × reps) */
  volumeKg?: number | null;
  /** for cardio: distance in metres */
  distanceM?: number | null;
  /** the user's bodyweight, for relative tonnage; falls back to 75 */
  bodyweightKg?: number | null;
}

export interface Strain {
  /** 0..1 */
  score: number;
  level: StrainLevel;
  /** the parts, for the explanation line */
  parts: { duration: number; effort: number; volume: number; intensity: number };
  /** what drove it, in words */
  drivers: string[];
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Type intensity for non-lifting flows: how much a minute of it costs. */
export const TYPE_INTENSITY: Record<string, number> = {
  martial_arts: 0.9,
  sport: 0.8,
  cardio: 0.7,
  outdoor: 0.5,
  mindbody: 0.15,
  meditation: 0.05,
  custom: 0.5,
};

/**
 * How hard the session was, 0..1.
 *  lifting:  0.30 duration (90 min = full) + 0.45 effort (24 hard sets = full,
 *            + a little for ≤2 RIR average, + a little for failure share)
 *            + 0.25 relative tonnage (150 × bodyweight = full)
 *  cardio:   type intensity × (0.4 + 0.6 × duration/90) — a stroll stays
 *            light however long it is; a fast run (under 6 min/km) counts full,
 *            a slow one (over 11 min/km) counts as a walk
 *  mindbody: 0.15 × duration — restorative, not strain
 * Calibration: 20-min easy lift → light; 60-min push day of 16 sets at
 * RPE 8 → hard; 90-min leg day, 22 sets, some to failure, 12 t → brutal;
 * 30-min stroll → light; 45-min 8 km run → hard; 90-min football → hard.
 */
export function sessionStrain(i: StrainInput): Strain {
  const dur = clamp(i.durationMin / 90, 0, 1);
  const drivers: string[] = [];
  if (i.flow === 'lifting') {
    const eff = summariseEffort(i.sets ?? []);
    let effort = clamp(eff.effectiveSets / 24, 0, 1);
    if (eff.avgRir != null && eff.avgRir <= 2) effort = clamp(effort + 0.1, 0, 1);
    effort = clamp(effort + eff.failureShare * 0.1, 0, 1);
    const bw = i.bodyweightKg && i.bodyweightKg > 0 ? i.bodyweightKg : 75;
    const volume = clamp((i.volumeKg ?? 0) / (bw * 150), 0, 1);
    const score = clamp(0.3 * dur + 0.45 * effort + 0.25 * volume, 0, 1);
    if (eff.effectiveSets >= 12) drivers.push(`${Math.round(eff.effectiveSets)} hard sets`);
    if (eff.avgRir != null && eff.avgRir <= 2) drivers.push('most sets within 2 reps of failure');
    if (eff.failureShare >= 0.4) drivers.push(`${Math.round(eff.failureShare * 100)}% of sets to failure`);
    if (volume >= 0.7) drivers.push(`${Math.round((i.volumeKg ?? 0) / 1000)} t moved`);
    if (dur >= 0.9) drivers.push(`${Math.round(i.durationMin)} min`);
    return { score, level: level(score), parts: { duration: dur, effort, volume, intensity: 0 }, drivers };
  }
  if (i.flow === 'mindbody') {
    const score = clamp(0.15 * dur, 0, 1);
    return { score, level: level(score), parts: { duration: dur, effort: 0, volume: 0, intensity: TYPE_INTENSITY[i.sessionType] ?? 0.15 }, drivers };
  }
  // cardio and the rest
  let intensity = TYPE_INTENSITY[i.sessionType] ?? 0.5;
  if (i.distanceM && i.durationMin > 0) {
    const paceMinPerKm = i.durationMin / (i.distanceM / 1000);
    if (paceMinPerKm < 6) { intensity = Math.max(intensity, 1); drivers.push('a fast pace'); }
    else if (paceMinPerKm < 8) { intensity = Math.max(intensity, 0.8); }
    else if (paceMinPerKm > 11) { intensity = Math.min(intensity, 0.35); }
  }
  const score = clamp(intensity * (0.4 + 0.6 * dur), 0, 1);
  if (dur >= 0.9) drivers.push(`${Math.round(i.durationMin)} min`);
  if (i.distanceM && i.distanceM >= 8000) drivers.push(`${(i.distanceM / 1000).toFixed(1)} km`);
  return { score, level: level(score), parts: { duration: dur, effort: 0, volume: 0, intensity }, drivers };
}

function level(score: number): StrainLevel {
  return score < 0.3 ? 'light' : score < 0.6 ? 'moderate' : score < 0.85 ? 'hard' : 'brutal';
}

export const STRAIN_LABEL: Record<StrainLevel, string> = {
  light: 'an easy session',
  moderate: 'a solid session',
  hard: 'a hard session',
  brutal: 'a brutal session',
};

export type MarginKey = 'water' | 'eat' | 'smoke' | 'alcohol' | 'cold' | 'next';

export interface Margin {
  key: MarginKey;
  label: string;
  /** minutes after the session end before it is sensible; 0 = now */
  waitMin: number;
  /** for windows (eat): the latest sensible time, minutes after the end */
  byMin?: number;
  /** one line of why, specific to this session */
  why: string;
  /** what to actually do */
  advice: string;
}

/** Linear between an easy-session value and a brutal-session value. */
const scale = (score: number, easy: number, brutal: number) => Math.round(easy + (brutal - easy) * clamp(score, 0, 1));

/**
 * The margins for a session of this strain. Minutes are from the END of the
 * session. `flow` decides the cold-plunge and next-session rules — the
 * hypertrophy argument only applies to lifting.
 */
export function postSessionMargins(strain: Strain, flow: SessionFlow, opts: { smokingEnabled?: boolean; alcoholEnabled?: boolean } = {}): Margin[] {
  const s = strain.score;
  const lift = flow === 'lifting';
  const out: Margin[] = [];

  out.push({
    key: 'water',
    label: 'Water',
    waitMin: 0,
    why: 'You are down whatever you sweated, and every repair process runs in water.',
    advice: s >= 0.6 ? 'Start now — 500 ml over the next half hour, then keep going with the day\'s goal.' : 'Now — a glass, then the day\'s goal.',
  });

  out.push({
    key: 'eat',
    label: 'Eat',
    waitMin: scale(s, 15, 30),
    byMin: scale(s, 120, 60),
    why: lift
      ? 'Muscle protein synthesis is climbing for the next few hours; it needs amino acids to build with. A little delay only lets gut blood flow return.'
      : 'Glycogen refills fastest in the first hours, and it will be needed next time. A little delay only lets the stomach settle.',
    advice: `20–40 g protein and some carbohydrate — sooner rather than later after ${STRAIN_LABEL[strain.level]}.`,
  });

  if (opts.smokingEnabled !== false) {
    out.push({
      key: 'smoke',
      label: 'Smoking',
      waitMin: scale(s, 60, 150),
      why: 'Breathing is still deep, so smoke deposits further in; carbon monoxide takes the oxygen that repair wants; nicotine narrows the vessels flushing the muscles you just used.',
      advice: s >= 0.6 ? 'Give it the full margin — the harder the session, the more it costs to smoke into it.' : 'At least the margin; the recovery it interrupts is real.',
    });
  }

  if (opts.alcoholEnabled !== false) {
    out.push({
      key: 'alcohol',
      label: 'Alcohol',
      waitMin: scale(s, 90, 300),
      why: 'Around 1.5 g/kg after training cuts muscle protein synthesis by up to a third for the next day even with protein; it slows glycogen refill, fights rehydration and flattens deep sleep.',
      advice: lift && s >= 0.6
        ? 'Rehydrate and eat first; a drink or two at most — after lifting like this the honest answer is none tonight.'
        : 'Rehydrate and eat first; keep it to a drink or two.',
    });
  }

  out.push({
    key: 'cold',
    label: 'Cold plunge / ice bath',
    waitMin: lift ? scale(s, 240, 360) : 0,
    why: lift
      ? 'Cold-water immersion within about an hour of lifting blunts the hypertrophy signal — measurably less muscle over months. A cool shower is fine.'
      : 'After cardio a cold plunge is fine and may take the edge off soreness.',
    advice: lift ? 'If the goal is muscle, keep it hours away — or make it a cool shower.' : 'Whenever you like; ease in.',
  });

  out.push({
    key: 'next',
    label: 'Next hard session (same muscles)',
    waitMin: lift ? scale(s, 24 * 60, 72 * 60) : scale(s, 12 * 60, 48 * 60),
    why: 'Repair and adaptation run for a day or three depending on how much was done; going hard again into it borrows from the next one.',
    advice: 'A walk, mobility or other muscles are fine sooner — the muscle-growth screen tracks the per-muscle picture.',
  });

  return out;
}

export interface MarginStatus extends Margin {
  /** minutes still to wait; 0 when open */
  remainingMin: number;
  open: boolean;
  /** epoch ms when it opens */
  openAt: number;
  /** epoch ms of the window's end, when there is one */
  byAt?: number;
  /** for windows: still inside it? */
  inWindow?: boolean;
}

/** Where each margin stands now, given when the session ended. */
export function marginStatuses(margins: Margin[], endedAt: number, now = Date.now()): MarginStatus[] {
  const elapsed = (now - endedAt) / 60_000;
  return margins.map((m) => {
    const remainingMin = Math.max(0, Math.round(m.waitMin - elapsed));
    const openAt = endedAt + m.waitMin * 60_000;
    const byAt = m.byMin != null ? endedAt + m.byMin * 60_000 : undefined;
    return {
      ...m,
      remainingMin,
      open: remainingMin === 0,
      openAt,
      byAt,
      inWindow: byAt != null ? now >= openAt && now <= byAt : undefined,
    };
  });
}

/** True while any margin (other than the multi-day "next session") is still ahead. */
export function marginsStillRunning(margins: Margin[], endedAt: number, now = Date.now()): boolean {
  return marginStatuses(margins.filter((m) => m.key !== 'next'), endedAt, now).some((m) => !m.open || (m.byAt != null && now <= m.byAt));
}
