import type { PathGate, PathStage, TrainingPath } from '@/data/paths';

/**
 * Paths — the arithmetic of a gate. Pure.
 *
 * A stage is left by meeting its gate, and a gate is made of things the app
 * can count. What it cannot count — whether the jab is straight — is listed
 * beside the gate as a benchmark and left to the person throwing it.
 */

/** The tag a path session carries in `sessions.style`. */
export function pathStyleTag(pathKey: string, stageKey: string, dayKey: string): string {
  return `path:${pathKey}:${stageKey}:${dayKey}`;
}

export function parsePathStyle(style: string | null | undefined): { pathKey: string; stageKey: string; dayKey: string } | null {
  if (!style || !style.startsWith('path:')) return null;
  const [, pathKey, stageKey, dayKey] = style.split(':');
  if (!pathKey || !stageKey || !dayKey) return null;
  return { pathKey, stageKey, dayKey };
}

/** What has actually happened inside the stage. */
export interface GateFacts {
  sessions: number;
  /** days since the stage began */
  daysIn: number;
  /** longest single tracked run or walk since the stage began, km */
  longestRunKm: number;
  /** overall rung index on the ladder; -1 when unranked */
  overallTier: number;
}

export interface GateCheck {
  key: 'sessions' | 'weeks' | 'run' | 'rank';
  label: string;
  current: number;
  target: number;
  unit: string;
  met: boolean;
}

export interface GateStatus {
  checks: GateCheck[];
  met: boolean;
  /** 0..1 — the mean of the checks, each capped at done */
  progress: number;
}

export function gateStatus(gate: PathGate, f: GateFacts, tierName: (i: number) => string = (i) => `rung ${i + 1}`): GateStatus {
  const n = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
  const weeksIn = Math.floor(n(f.daysIn) / 7);
  const checks: GateCheck[] = [
    { key: 'sessions', label: 'Sessions of this stage', current: Math.floor(n(f.sessions)), target: gate.sessions, unit: 'sessions', met: n(f.sessions) >= gate.sessions },
    { key: 'weeks', label: 'Weeks in this stage', current: weeksIn, target: gate.weeks, unit: 'weeks', met: weeksIn >= gate.weeks },
  ];
  if (gate.longestRunKm != null) {
    checks.push({ key: 'run', label: 'Longest tracked run', current: Math.round(n(f.longestRunKm) * 10) / 10, target: gate.longestRunKm, unit: 'km', met: n(f.longestRunKm) >= gate.longestRunKm });
  }
  if (gate.overallTier != null) {
    checks.push({ key: 'rank', label: `Overall rank: ${tierName(gate.overallTier)}`, current: Math.max(0, f.overallTier + 1), target: gate.overallTier + 1, unit: 'rung', met: f.overallTier >= gate.overallTier });
  }
  const progress = checks.reduce((s, c) => s + Math.min(1, c.target > 0 ? c.current / c.target : 1), 0) / checks.length;
  return { checks, met: checks.every((c) => c.met), progress };
}

/** Which day of the stage comes next: the one logged least, earliest first on a tie. */
export function nextDayKey(stage: PathStage, counts: Record<string, number>): string {
  let best = stage.days[0].key;
  let bestCount = Infinity;
  for (const d of stage.days) {
    const c = counts[d.key] ?? 0;
    if (c < bestCount) {
      best = d.key;
      bestCount = c;
    }
  }
  return best;
}

/** How far along the whole path someone is, 0..1: stages done plus the share of the current one. */
export function pathProgress(path: TrainingPath, stageIndex: number, stageProgress: number, completed: boolean): number {
  if (completed) return 1;
  const total = path.stages.length;
  const i = Math.min(Math.max(0, stageIndex), total - 1);
  return Math.min(1, (i + Math.min(1, Math.max(0, stageProgress))) / total);
}
