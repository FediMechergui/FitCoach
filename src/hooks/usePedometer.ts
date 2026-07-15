import { useEffect } from 'react';
import { useWalkStore } from '@/stores/walkStore';

/**
 * Foreground poller for an active walk/run. The heavy lifting (permissions,
 * pedometer/accelerometer subscription and the background foreground-service
 * location task) lives in src/services/walkTracking.ts and persists progress to
 * the shared `live_walks` row. This hook just refreshes the store from that row
 * once a second so the UI stays live while it's on screen. Because tracking runs
 * in a foreground service, progress keeps accruing while this hook is asleep in
 * the background, and jumps forward when the screen comes back on.
 */
export function useLiveWalk(active: boolean) {
  const refresh = useWalkStore((s) => s.refresh);
  useEffect(() => {
    if (!active) return;
    refresh();
    const t = setInterval(refresh, 1000);
    return () => clearInterval(t);
  }, [active, refresh]);
}
