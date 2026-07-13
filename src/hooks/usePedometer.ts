import { useEffect, useRef } from 'react';
import { Accelerometer, Pedometer } from 'expo-sensors';
import { useWalkStore } from '@/stores/walkStore';
import { StepDetector } from '@/lib/pedometer';

/**
 * Drives live step counting for an active walk/run (spec §3.4). Prefers the
 * hardware Pedometer (TYPE_STEP_COUNTER); if unavailable, falls back to the
 * accelerometer peak-detection algorithm in src/lib/pedometer.ts.
 */
export function useLivePedometer(active: boolean) {
  const setSteps = useWalkStore((s) => s.setSteps);
  const addStep = useWalkStore((s) => s.addStep);
  const tick = useWalkStore((s) => s.tick);
  const startedAt = useWalkStore((s) => s.startedAt);
  const detectorRef = useRef<StepDetector | null>(null);

  useEffect(() => {
    if (!active) return;
    let mounted = true;
    let pedoSub: { remove: () => void } | null = null;
    let accelSub: { remove: () => void } | null = null;
    let usingHardware = false;

    (async () => {
      const available = await Pedometer.isAvailableAsync().catch(() => false);
      if (mounted && available) {
        usingHardware = true;
        const start = startedAt ? new Date(startedAt) : new Date();
        pedoSub = Pedometer.watchStepCount((result) => {
          setSteps(result.steps);
        });
        // Also backfill any steps since the session began.
        Pedometer.getStepCountAsync(start, new Date())
          .then((r) => r && setSteps(r.steps))
          .catch(() => {});
      }

      if (mounted && !usingHardware) {
        // Accelerometer fallback ~50Hz.
        detectorRef.current = new StepDetector();
        Accelerometer.setUpdateInterval(20);
        accelSub = Accelerometer.addListener(({ x, y, z }) => {
          const stepped = detectorRef.current!.onSample(x, y, z, Date.now());
          if (stepped) addStep(1);
        });
      }
    })();

    // Elapsed-time ticker.
    const timer = setInterval(() => {
      const started = useWalkStore.getState().startedAt;
      if (started) tick(Math.round((Date.now() - started) / 1000));
    }, 1000);

    return () => {
      mounted = false;
      pedoSub?.remove();
      accelSub?.remove();
      clearInterval(timer);
    };
  }, [active, startedAt, setSteps, addStep, tick]);
}
