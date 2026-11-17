import { sqlite } from '@/db/client';
import { atomic } from '@/db/atomic';

export type TimingPhase = 'work' | 'rest' | 'transition' | 'paused';
export interface TimingRow {
  id: number; session_id: number; log_id: number | null; set_id: number | null;
  phase: TimingPhase; started_at: number; ended_at: number | null; target_end: number | null;
  review_required: number;
}
export function timingRows(sessionId: number): TimingRow[] {
  return sqlite.getAllSync<TimingRow>('SELECT * FROM workout_timing WHERE session_id = ? ORDER BY started_at, id', sessionId);
}
export function openTiming(sessionId: number): TimingRow | null {
  return sqlite.getFirstSync<TimingRow>('SELECT * FROM workout_timing WHERE session_id = ? AND ended_at IS NULL', sessionId);
}
function assertLive(sessionId: number) {
  if (!sqlite.getFirstSync('SELECT id FROM sessions WHERE id = ? AND end_time IS NULL AND archived_at IS NULL', sessionId)) throw new Error('This workout is no longer active.');
}
export function changeTiming(sessionId: number, phase: TimingPhase, logId: number | null = null, targetEnd: number | null = null, at = Date.now()): void {
  atomic(() => {
    assertLive(sessionId);
    if (!Number.isFinite(at)) throw new Error('Invalid timer timestamp.');
    if (logId != null && !sqlite.getFirstSync('SELECT id FROM exercise_logs WHERE id = ? AND session_id = ?', logId, sessionId)) throw new Error('Exercise does not belong to this workout.');
    const current = openTiming(sessionId);
    if (current && at < current.started_at) throw new Error('The device clock moved backwards. Correct the clock before continuing the timer.');
    if (current?.phase === phase && current.log_id === logId && current.target_end === targetEnd) return;
    if (current) sqlite.runSync('UPDATE workout_timing SET ended_at = ? WHERE id = ?', at, current.id);
    sqlite.runSync('INSERT INTO workout_timing(session_id,log_id,phase,started_at,target_end) VALUES(?,?,?,?,?)', sessionId, logId, phase, at, targetEnd);
  });
}
/** Rest stops at its deadline even if JS was suspended. Remaining time is transition. */
export function settleRest(sessionId: number, now = Date.now()): void {
  const row = openTiming(sessionId);
  if (row?.phase === 'rest' && row.target_end != null && row.target_end <= now) changeTiming(sessionId, 'transition', row.log_id, null, Math.max(row.started_at, row.target_end));
}
export function startWork(sessionId: number, logId: number): void {
  settleRest(sessionId);
  const pending = sqlite.getFirstSync('SELECT id FROM workout_timing WHERE session_id = ? AND phase = ? AND set_id IS NULL AND log_id IS NOT NULL', sessionId, 'work');
  if (pending) throw new Error('Save or discard the previous timed set before starting another.');
  changeTiming(sessionId, 'work', logId);
}
export function pauseTiming(sessionId: number): void {
  settleRest(sessionId);
  const current = openTiming(sessionId);
  if (current?.phase === 'paused') return;
  changeTiming(sessionId, 'paused', current?.log_id ?? null, current?.target_end ?? null);
}
export function resumeTiming(sessionId: number): void {
  const rows = timingRows(sessionId);
  const paused = rows.at(-1);
  if (paused?.phase !== 'paused' || paused.ended_at != null) return;
  const previous = rows.at(-2);
  const now = Date.now();
  const end = previous?.phase === 'rest' && previous.target_end != null ? now + Math.max(0, previous.target_end - paused.started_at) : null;
  changeTiming(sessionId, previous?.phase ?? 'transition', paused.log_id, end, now);
}
export function stopWork(sessionId: number, logId: number): void {
  const current = openTiming(sessionId);
  if (current?.log_id === logId && (current.phase === 'work' || current.phase === 'paused')) changeTiming(sessionId, 'transition', logId);
}
export function pendingWorkSeconds(sessionId: number, logId: number, now = Date.now()): number | null {
  const rows = timingRows(sessionId).filter(r => r.phase === 'work' && r.log_id === logId && r.set_id == null);
  return rows.length ? Math.max(1, Math.round(rows.reduce((n, r) => n + Math.max(0, (r.ended_at ?? now) - r.started_at), 0) / 1000)) : null;
}
export function attachWorkToSet(sessionId: number, logId: number, setId: number): void {
  sqlite.runSync("UPDATE workout_timing SET set_id = ? WHERE session_id = ? AND log_id = ? AND phase = 'work' AND set_id IS NULL", setId, sessionId, logId);
}
export function discardPendingWork(sessionId: number, logId: number): void {
  atomic(() => {
    stopWork(sessionId, logId);
    // Preserve the interval in the session timeline, but don't pretend it was a completed set.
    sqlite.runSync("UPDATE workout_timing SET phase = 'transition', review_required = 0 WHERE session_id = ? AND log_id = ? AND phase = 'work' AND set_id IS NULL", sessionId, logId);
  });
}
export function closeTiming(sessionId: number, at = Date.now()): void {
  settleRest(sessionId, at);
  const row = openTiming(sessionId);
  if (row) sqlite.runSync('UPDATE workout_timing SET ended_at = ?, review_required = CASE WHEN phase = ? THEN 1 ELSE review_required END WHERE id = ?', Math.max(row.started_at, at), 'work', row.id);
}
export function flagRecoveredTiming(sessionId: number): void {
  sqlite.runSync("UPDATE workout_timing SET review_required = 1 WHERE session_id = ? AND ended_at IS NULL AND phase = 'work'", sessionId);
  settleRest(sessionId);
}
export function timingSummary(sessionId: number, now = Date.now()) {
  const result = { work: 0, rest: 0, transition: 0, paused: 0, reviewRequired: false, recorded: false };
  for (const r of timingRows(sessionId)) {
    result.recorded = true;
    const end = r.ended_at ?? now;
    const phaseEnd = r.phase === 'rest' && r.target_end != null ? Math.min(end, r.target_end) : end;
    result[r.phase] += Math.max(0, phaseEnd - r.started_at) / 1000;
    if (end > phaseEnd) result.transition += (end - phaseEnd) / 1000;
    if (r.review_required) result.reviewRequired = true;
  }
  return result;
}
