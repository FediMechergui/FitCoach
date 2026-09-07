import { CHALLENGES, type ChallengeDef, type ChallengeRequirement } from '@/data/challenges';

/**
 * Which challenges the wheel shows today, and which one it lands on.
 *
 * ── Why the result is decided by the date, not by the spin ──
 * A wheel that rolls fresh randomness on every tap is a wheel you re-spin until
 * you get "8,000 steps". The whole point of a daily challenge is that you don't
 * choose it. So the day's segments AND the winning segment are both derived
 * from the date: the animation is a reveal, not a lottery. Close the app,
 * reopen it, change the clock — the same day gives the same answer.
 *
 * That also makes the entire thing a pure function of (date, eligible set),
 * which is why it can be tested without a database or a running app.
 */

/** How many segments the wheel shows. Enough to feel like a choice, few enough to read. */
export const WHEEL_SIZE = 8;

/** Which optional features are switched on, so the wheel never offers the impossible. */
export interface ChallengeContext {
  enabled: Partial<Record<ChallengeRequirement, boolean>>;
  /** keys completed recently — kept off the wheel so it doesn't repeat itself */
  recentKeys?: string[];
}

/**
 * Deterministic 32-bit hash of a string. Same input, same number, on every
 * device and every JS engine — which is the property the whole design rests on.
 */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // >>> 0 keeps it unsigned; Math.imul can return negatives.
  return h >>> 0;
}

/** Mulberry32 — a small, fast, well-distributed seeded generator. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates using a seeded generator, so the order is reproducible. */
export function seededShuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Challenges the user can actually attempt today. */
export function eligibleChallenges(ctx: ChallengeContext): ChallengeDef[] {
  return CHALLENGES.filter((c) => !c.requires || ctx.enabled[c.requires] === true);
}

export interface DailyWheel {
  /** the segments, in the order they appear around the wheel */
  segments: ChallengeDef[];
  /** index into `segments` that the pointer lands on */
  winningIndex: number;
  /** the challenge itself, for convenience */
  challenge: ChallengeDef;
}

/**
 * Build today's wheel.
 *
 * Recently-completed challenges are pushed out of the running first, so the
 * wheel doesn't hand you the same thing three days running — but only while
 * there are enough others left. Repeating beats an empty wheel.
 */
export function buildDailyWheel(dateISO: string, ctx: ChallengeContext): DailyWheel | null {
  const eligible = eligibleChallenges(ctx);
  if (eligible.length === 0) return null;

  const recent = new Set(ctx.recentKeys ?? []);
  const fresh = eligible.filter((c) => !recent.has(c.key));
  // Fall back to the full set when avoiding repeats would leave too few.
  const pool = fresh.length >= WHEEL_SIZE ? fresh : eligible;

  const rand = seededRandom(hashSeed(dateISO));
  const segments = seededShuffle(pool, rand).slice(0, Math.min(WHEEL_SIZE, pool.length));

  /*
   * Draw the winner from a SECOND generator seeded differently, so the winning
   * position isn't correlated with the shuffle — otherwise the pointer would
   * favour a particular slot and anyone watching closely would spot it.
   */
  const pickRand = seededRandom(hashSeed(`${dateISO}:pick`));
  const winningIndex = Math.floor(pickRand() * segments.length) % segments.length;

  return { segments, winningIndex, challenge: segments[winningIndex] };
}

/**
 * Where the wheel must stop, in degrees, for `winningIndex` to sit under a
 * pointer at the top. Includes whole extra turns so the spin looks like a spin.
 *
 * Segments are laid out clockwise from the top: segment i spans
 * [i, i + 1] × (360 / n), so its CENTRE is (i + ½) × (360 / n). Rotating back
 * by the leading edge instead — which this did until 3.2.3 — parked the
 * pointer exactly on the seam between two wedges, and the challenge shown
 * beneath was the one clockwise of it. The pointer now lands dead centre.
 */
export function wheelRotationDeg(winningIndex: number, segmentCount: number, turns = 5): number {
  if (segmentCount <= 0) return 0;
  const per = 360 / segmentCount;
  const centre = (winningIndex + 0.5) * per;
  return turns * 360 - centre;
}

/**
 * Where the NEXT spin must stop, given where the wheel is now: at least four
 * full turns on, and on the centre of the winning wedge. The wheel's angle
 * only ever grows, so a second spin of the day keeps turning the same way
 * from where it rests instead of snapping back to zero first.
 */
export function nextWheelStopDeg(currentDeg: number, winningIndex: number, segmentCount: number, turns = 5): number {
  const base = Math.ceil(Math.max(0, currentDeg) / 360) * 360;
  return base + wheelRotationDeg(winningIndex, segmentCount, turns);
}

// ── The spin economy ──────────────────────────────────────────────────────────

/** Two spins a day cost nothing; every spin after that is bought with points. */
export const FREE_SPINS_PER_DAY = 2;
export const RESPIN_COST = 10;

/** What the next spin costs, given how many the day has already used. */
export function spinCost(spinsSoFar: number): number {
  return spinsSoFar < FREE_SPINS_PER_DAY ? 0 : RESPIN_COST;
}

export type SpinVerdict =
  | { ok: true; cost: number; free: boolean }
  | { ok: false; reason: 'completed' | 'points'; cost: number };

/**
 * May the wheel turn again? Never once the day's challenge is complete — a
 * finished challenge is banked, not gambled — and a paid spin needs the
 * points in hand. The balance is earned minus spent, so a spin can never be
 * bought with points that were already spent on one.
 */
export function spinVerdict(spinsSoFar: number, balance: number, completed: boolean): SpinVerdict {
  const cost = spinCost(spinsSoFar);
  if (completed) return { ok: false, reason: 'completed', cost };
  if (cost > balance) return { ok: false, reason: 'points', cost };
  return { ok: true, cost, free: cost === 0 };
}

/**
 * Which wedge a re-spin lands on. Seeded by the date AND the spin number, so
 * the second spin of a given day gives the same answer on every device —
 * the wheel reveals, it does not gamble — and it never lands on the wedge
 * you just left: a re-spin that changes nothing is a spin paid for nothing.
 */
export function respinIndex(dateISO: string, spinNumber: number, segmentCount: number, currentIndex: number): number {
  if (segmentCount <= 1) return 0;
  const rand = seededRandom(hashSeed(`${dateISO}:pick:${spinNumber}`));
  const candidates = Array.from({ length: segmentCount }, (_, i) => i).filter((i) => i !== currentIndex);
  return candidates[Math.floor(rand() * candidates.length) % candidates.length];
}

/** Progress toward a challenge, as a fraction 0..1. */
export function challengeProgress(current: number, target: number): number {
  if (!(target > 0)) return 0;
  if (!Number.isFinite(current) || current <= 0) return 0;
  return Math.min(1, current / target);
}

export const isChallengeComplete = (current: number, target: number): boolean =>
  target > 0 && current >= target;
