import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useWalkStore } from '@/stores/walkStore';

/**
 * Foreground poller for an active walk/run. The heavy lifting (permissions,
 * pedometer/accelerometer/GPS) lives in src/services/walkTracking.ts. This hook
 * keeps the on-screen numbers live by reconciling against the hardware step
 * counter every second, and — importantly — immediately when the app returns to
 * the foreground, so steps taken with the screen off or the app backgrounded
 * "catch up" the instant you look back at it rather than lagging.
 */
export function useLiveWalk(active: boolean) {
  const reconcile = useWalkStore((s) => s.reconcile);
  useEffect(() => {
    if (!active) return;
    void reconcile();
    const t = setInterval(() => void reconcile(), 1000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reconcile();
    });
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, [active, reconcile]);
}
