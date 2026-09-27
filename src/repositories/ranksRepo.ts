import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { exerciseLogs, exercises, sessions, setEntries } from '@/db/schema';
import { estimate1RMFromSet } from '@/lib/oneRepMax';
import { effectiveLoadKg, profileFor } from '@/lib/loadProfile';
import { startOfDayMs, daysAgoISO, toISODate } from '@/lib/date';
import {
  RANKED_LIFTS,
  RANK_REP_CAP,
  STANDARDS,
  muscleScores,
  oneRmForScore,
  overallRank,
  placeScore,
  scoreLift,
  type LiftScore,
  type OverallRank,
  type RankPlacement,
  type RankSex,
  type StandardKey,
} from '@/lib/ranks';
import { getUser, latestWeight, PRIMARY_USER_ID } from './userRepo';

/**
 * Strength ranks, read from the sets that were actually logged.
 *
 * Two readings of the same lifter: FORM is the best of the last 120 days —
 * what you can do now — and PEAK is the best you ever logged. The ladder
 * shows form; peak sits beside it, so a lay-off reads as a lay-off and not
 * as a loss of what you once did.
 */

export const FORM_WINDOW_DAYS = 120;

export interface RankedLift {
  exerciseId: number;
  slug: string;
  name: string;
  iconKey: string;
  standard: StandardKey;
  standardLabel: string;
  /** form: best estimated 1RM of the window, in the real kilograms moved */
  oneRmKg: number;
  score: number;
  placement: RankPlacement;
  /** the best ever logged */
  peakOneRmKg: number;
  peakScore: number;
  /** last day this lift was logged */
  lastDate: string;
  /** false when nothing was logged inside the form window — the rank shown is the peak */
  inForm: boolean;
  /** kilograms of 1RM still missing for the next division; null at the very top */
  toNextKg: number | null;
}

export interface RankSnapshot {
  /** false until a weigh-in exists — a rank is a multiple of bodyweight */
  hasBodyweight: boolean;
  bodyweightKg: number;
  sex: RankSex;
  lifts: RankedLift[];
  overall: OverallRank | null;
  peak: OverallRank | null;
  /** best form score per muscle group — what shades the bodygraph */
  muscles: Record<string, number>;
}

export function rankSnapshot(userId: number = PRIMARY_USER_ID): RankSnapshot {
  const user = getUser(userId);
  const sex: RankSex = user?.sex === 'female' ? 'female' : 'male';
  const weighIn = latestWeight(userId);
  const bodyweightKg = weighIn?.weightKg ?? 0;
  const empty: RankSnapshot = { hasBodyweight: !!weighIn, bodyweightKg, sex, lifts: [], overall: null, peak: null, muscles: {} };
  if (!weighIn || !(bodyweightKg > 0)) return empty;

  const rows = db
    .select({
      exerciseId: exercises.id,
      slug: exercises.slug,
      name: exercises.name,
      iconKey: exercises.iconKey,
      equipmentType: exercises.equipmentType,
      pattern: exercises.pattern,
      trackingType: exercises.trackingType,
      startTime: sessions.startTime,
      reps: setEntries.reps,
      weightKg: setEntries.weightKg,
      rpe: setEntries.rpe,
      toFailure: setEntries.toFailure,
    })
    .from(setEntries)
    .innerJoin(exerciseLogs, eq(setEntries.exerciseLogId, exerciseLogs.id))
    .innerJoin(exercises, eq(exerciseLogs.exerciseId, exercises.id))
    .innerJoin(sessions, eq(exerciseLogs.sessionId, sessions.id))
    .where(and(eq(sessions.userId, userId), eq(setEntries.completed, true)))
    .all();

  const since = startOfDayMs(daysAgoISO(FORM_WINDOW_DAYS));
  const byLift = new Map<string, { row: (typeof rows)[number]; form: number; peak: number; last: number }>();

  for (const r of rows) {
    if (!r.slug || !(r.slug in RANKED_LIFTS)) continue;
    if (!r.reps || r.reps <= 0) continue;
    const profile = profileFor({ slug: r.slug, equipmentType: r.equipmentType, pattern: r.pattern, trackingType: r.trackingType });
    const load = effectiveLoadKg(profile, bodyweightKg, r.weightKg);
    if (load == null || !(load > 0)) continue;
    const oneRm = estimate1RMFromSet({
      weightKg: load,
      reps: Math.min(r.reps, RANK_REP_CAP),
      rpe: r.rpe,
      toFailure: r.toFailure,
    });
    if (!(oneRm > 0)) continue;
    const cur = byLift.get(r.slug) ?? { row: r, form: 0, peak: 0, last: 0 };
    if (oneRm > cur.peak) cur.peak = oneRm;
    if (r.startTime >= since && oneRm > cur.form) cur.form = oneRm;
    if (r.startTime > cur.last) cur.last = r.startTime;
    byLift.set(r.slug, cur);
  }

  const lifts: RankedLift[] = [];
  for (const [slug, v] of byLift) {
    const inForm = v.form > 0;
    const shown = inForm ? v.form : v.peak;
    const score = scoreLift(slug, shown, bodyweightKg, sex);
    const peakScore = scoreLift(slug, v.peak, bodyweightKg, sex);
    if (score == null || peakScore == null) continue;
    const placement = placeScore(score);
    const nextRm = placement.nextAt != null ? oneRmForScore(slug, placement.nextAt, bodyweightKg, sex) : null;
    const standard = RANKED_LIFTS[slug].standard;
    lifts.push({
      exerciseId: v.row.exerciseId,
      slug,
      name: v.row.name,
      iconKey: v.row.iconKey,
      standard,
      standardLabel: STANDARDS[standard].label,
      oneRmKg: Math.round(shown * 10) / 10,
      score: Math.round(score * 10) / 10,
      placement,
      peakOneRmKg: Math.round(v.peak * 10) / 10,
      peakScore: Math.round(peakScore * 10) / 10,
      lastDate: toISODate(new Date(v.last)),
      inForm,
      toNextKg: nextRm != null ? Math.max(0.5, Math.round((nextRm - shown) * 2) / 2) : null,
    });
  }
  lifts.sort((a, b) => b.score - a.score);

  const formScores: LiftScore[] = lifts
    .filter((l) => l.inForm)
    .map((l) => ({ slug: l.slug, standard: l.standard, score: l.score, oneRmKg: l.oneRmKg }));
  const peakScores: LiftScore[] = lifts.map((l) => ({ slug: l.slug, standard: l.standard, score: l.peakScore, oneRmKg: l.peakOneRmKg }));

  return {
    hasBodyweight: true,
    bodyweightKg,
    sex,
    lifts,
    overall: overallRank(formScores),
    peak: overallRank(peakScores),
    muscles: muscleScores(formScores.length ? formScores : peakScores),
  };
}

/** The overall placement alone — for the profile header and the athlete card. Never throws. */
export function overallPlacement(
  userId: number = PRIMARY_USER_ID
): { placement: RankPlacement; provisional: boolean; peakOnly: boolean } | null {
  try {
    const s = rankSnapshot(userId);
    const o = s.overall ?? s.peak;
    return o ? { placement: o.placement, provisional: o.provisional, peakOnly: !s.overall } : null;
  } catch {
    return null;
  }
}
