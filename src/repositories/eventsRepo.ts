import { kvGet, kvSet } from './kvRepo';

/**
 * Things that happened and left no other trace in the database: an athlete
 * card exported, a report generated. Three badges are earned by exactly
 * these, and until 3.3.0 nothing recorded them — so they could never unlock.
 *
 * A stamp is written only AFTER the export succeeded. Opening the screen, or
 * cancelling the share sheet before a file existed, stamps nothing.
 */

const KV_EVENTS = 'profile.events';

export interface ProfileEvents {
  cardExports: number;
  /** the best overall rating a card carried when it was exported */
  bestExportedOverall: number;
  coachReports: number;
  nutritionReports: number;
  /** finished routes shared or saved as a story image (3.8.0) */
  routeShares: number;
}

export const NO_EVENTS: ProfileEvents = { cardExports: 0, bestExportedOverall: 0, coachReports: 0, nutritionReports: 0, routeShares: 0 };

export function profileEvents(): ProfileEvents {
  const v = kvGet<Partial<ProfileEvents>>(KV_EVENTS);
  return { ...NO_EVENTS, ...(v && typeof v === 'object' ? v : {}) };
}

export function recordCardExport(overall: number): void {
  const e = profileEvents();
  kvSet(KV_EVENTS, {
    ...e,
    cardExports: e.cardExports + 1,
    bestExportedOverall: Math.max(e.bestExportedOverall, Math.round(overall) || 0),
  });
}

export function recordReport(audience: 'coach' | 'nutritionist'): void {
  const e = profileEvents();
  kvSet(KV_EVENTS, audience === 'coach' ? { ...e, coachReports: e.coachReports + 1 } : { ...e, nutritionReports: e.nutritionReports + 1 });
}

/** A route card left the app (shared or saved) — stamped only after the file exists. */
export function recordRouteShare(): void {
  const e = profileEvents();
  kvSet(KV_EVENTS, { ...e, routeShares: e.routeShares + 1 });
}
