export type TimeInterval = [number, number];
export interface SavedWalkPause { startTime: number; total: number; since: number | null; observedAt?: number; intervals?: TimeInterval[] }

/** Union overlapping exclusions so vehicle pauses count once and separate stops add up. */
export function excludedTime(start: number, now: number, intervals: TimeInterval[]): number {
  let end = start, total = 0;
  for (const [from, to] of [...intervals].sort((a,b) => a[0]-b[0])) {
    const lo = Math.max(start, end, from), hi = Math.min(now, to);
    if (hi > lo) total += hi-lo;
    end = Math.max(end, hi);
  }
  return total;
}

/** After process loss, only observed time can contribute to a session's pace. */
export function restoreWalkClock(startTime: number, now: number, lastObservedAt: number,
  saved: SavedWalkPause | null, gpsObservedAt = 0, gpsExcludedMs = 0, gpsIntervals: TimeInterval[] = []) {
  const pause = saved?.startTime === startTime ? saved : null;
  const observedAt = Math.min(now, Math.max(startTime, lastObservedAt, pause?.observedAt ?? 0, gpsObservedAt));
  const unknownMs = now - observedAt > 15_000 ? now - observedAt : 0;
  // A pause already spanning the gap includes that gap; never subtract it twice.
  const total = Math.max(0, pause?.total ?? 0) + (pause?.since == null ? unknownMs : 0);
  const since = pause?.since ?? null;
  const pausedMs = total + (since == null ? 0 : Math.max(0, now - since));
  const intervals: TimeInterval[] = [...(pause?.intervals ?? [])];
  if (unknownMs && since == null) intervals.push([observedAt,now]);
  const union = excludedTime(startTime,now,[...intervals,...gpsIntervals,...(since == null ? [] : [[since,now] as TimeInterval])]);
  return { total, since, intervals, activeSec: Math.max(0, Math.round((now - startTime - Math.max(union, pausedMs, gpsExcludedMs)) / 1000)) };
}
