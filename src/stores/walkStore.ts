import { create } from 'zustand';
import { saveWalkSession } from '@/repositories/activityRepo';
import {
  getLiveSnapshot,
  getWalkPermissions,
  reconcileSteps,
  resumeWalkTracking,
  startWalkTracking,
  stopWalkTracking,
  type WalkPermissions,
} from '@/services/walkTracking';
import { distanceFromSteps } from '@/lib/pedometer';
import type { LatLng } from '@/lib/geo';
import { activityFor, outdoorCalories } from '@/lib/outdoorActivities';
import { shouldDiscardAutoSession } from '@/lib/walkAutoDetect';
import { hasHardwareStepCounter } from '../../modules/step-counter';
import type { StartWalkOptions } from '@/services/walkTracking';
import { syncTodaySteps } from '@/services/backgroundSteps';
import { useUserStore } from './userStore';

interface WalkState {
  active: boolean;
  mode: 'walk' | 'run';
  source: 'pedometer' | 'accelerometer' | 'gps';
  startedAt: number | null;
  steps: number;
  distanceM: number;
  elapsedS: number;
  route: LatLng[];
  usingGps: boolean;
  permissions: WalkPermissions | null;
  starting: boolean;
  /** auto-paused (vehicle / standing still) */
  paused: boolean;
  pauseReason: string;
  /** moving seconds, excluding paused time */
  activeS: number;
  /** which outdoor activity is live (walk/run/hike/ruck/…) */
  activity: string;
  loadKg: number;
  /** started by the auto-detector */
  autoStarted: boolean;

  /** Reattach to a walk that survived a background/app restart. */
  resume: () => void;
  start: (mode: 'walk' | 'run', opts?: StartWalkOptions) => void;
  /** Pull the latest numbers from the in-memory tracker (cheap; no DB read). */
  refresh: () => void;
  /** Reconcile against the hardware step counter (catches up background steps), then refresh. */
  reconcile: () => Promise<void>;
  stop: (opts?: { autoEnded?: boolean }) => WalkStopResult | null;
  reset: () => void;
}

export interface WalkStopResult {
  steps: number;
  distanceM: number;
  calories: number;
  durationS: number;
  /** false = too small to be a real session, so nothing was saved */
  saved: boolean;
}

function heightCm(): number {
  return useUserStore.getState().user?.heightCm ?? 175;
}

/**
 * Steps per minute over the moving time so far — null until there is enough of
 * a sample to mean anything. Feeds the step-length estimate so a brisk walk is
 * not measured with a strolling stride.
 */
function liveCadence(steps: number, activeSec: number): number | null {
  return activeSec > 60 && steps > 30 ? steps / (activeSec / 60) : null;
}

export const useWalkStore = create<WalkState>((set, get) => ({
  active: false,
  mode: 'walk',
  source: 'pedometer',
  startedAt: null,
  steps: 0,
  distanceM: 0,
  elapsedS: 0,
  route: [],
  usingGps: false,
  permissions: null,
  starting: false,
  paused: false,
  pauseReason: '',
  activeS: 0,
  activity: 'walk',
  loadKg: 0,
  autoStarted: false,

  resume: () => {
    const snap = getLiveSnapshot();
    if (snap?.active) {
      void resumeWalkTracking();
      const usingGps = snap.gpsDistanceM > 0 || snap.route.length > 0;
      set({
        active: true,
        mode: snap.mode,
        source: snap.source,
        startedAt: snap.startTime,
        steps: snap.steps,
        distanceM: usingGps ? snap.gpsDistanceM : distanceFromSteps(snap.steps, heightCm(), snap.mode),
        route: snap.route,
        usingGps,
        elapsedS: Math.round((Date.now() - snap.startTime) / 1000),
        paused: snap.paused,
        pauseReason: snap.pauseReason,
        activeS: snap.activeSec,
        activity: snap.activity,
        loadKg: snap.loadKg,
        autoStarted: snap.autoStarted,
      });
    }
  },

  start: (mode, opts) => {
    if (get().starting || get().active) return;
    set({
      starting: true,
      steps: 0,
      distanceM: 0,
      elapsedS: 0,
      route: [],
      // A fresh session must never flash the previous one's pause state.
      paused: false,
      pauseReason: '',
      activeS: 0,
    });

    // `startWalkTracking` brings the session up synchronously and finishes the
    // slow parts (permission dialogs, hardware counter, GPS) in the background,
    // so the UI can switch to the tracking view with no delay.
    void startWalkTracking(mode, opts);

    const snap = getLiveSnapshot();
    set({
      active: true,
      starting: false,
      mode,
      source: snap?.source ?? 'accelerometer',
      startedAt: snap?.startTime ?? Date.now(),
      activity: opts?.activity ?? mode,
      loadKg: opts?.loadKg ?? 0,
      autoStarted: opts?.autoStarted ?? false,
      // Both fill in via refresh() once the async setup resolves.
      usingGps: false,
      permissions: null,
    });
  },

  refresh: () => {
    const s = get();
    if (!s.active || !s.startedAt) return;
    const snap = getLiveSnapshot();
    const steps = snap?.steps ?? s.steps;
    const usingGps = !!snap && (snap.gpsDistanceM > 0 || snap.route.length > 0);
    set({
      steps,
      // Cadence from what has actually been counted so far, so a brisk walk
      // is not measured with a strolling step length.
      distanceM: usingGps
        ? snap!.gpsDistanceM
        : distanceFromSteps(steps, heightCm(), s.mode, liveCadence(steps, snap?.activeSec ?? s.activeS)),
      route: snap?.route ?? s.route,
      usingGps: usingGps || s.usingGps,
      source: snap?.source ?? s.source,
      // Populated once the background permission/GPS handshake finishes.
      permissions: getWalkPermissions() ?? s.permissions,
      paused: snap?.paused ?? s.paused,
      pauseReason: snap?.pauseReason ?? s.pauseReason,
      activeS: snap?.activeSec ?? s.activeS,
      activity: snap?.activity ?? s.activity,
      loadKg: snap?.loadKg ?? s.loadKg,
      autoStarted: snap?.autoStarted ?? s.autoStarted,
      elapsedS: Math.round((Date.now() - s.startedAt) / 1000),
    });
  },

  reconcile: async () => {
    if (!get().active) return;
    await reconcileSteps();
    get().refresh();
  },

  stop: (opts) => {
    const s = get();
    if (!s.active || !s.startedAt) return null;

    const result = stopWalkTracking();
    set({ active: false, startedAt: null, paused: false, pauseReason: '', autoStarted: false });
    if (!result) return null;

    /*
     * Junk guard: an accidental Start-then-Finish (or an auto-detected trigger
     * that never became a walk) must not write a "Walk · 0 steps · 2 s" row
     * into history and the daily totals. Real short walks still save.
     */
    const junk =
      (result.steps < 20 && result.distanceM < 50) ||
      (opts?.autoEnded === true && shouldDiscardAutoSession(result.steps, result.activeSec));
    if (junk) {
      return {
        steps: result.steps,
        distanceM: result.distanceM,
        calories: 0,
        durationS: result.durationS,
        saved: false,
      };
    }

    const weightKg = useUserStore.getState().currentWeightKg ?? 75;
    // THE SAME calorie path as the live screen (MET floor for hikes/rucks, a
    // carried pack scales it) — the number can no longer drop at Finish.
    // Moving time only: standing at a crossing or riding a bus isn't exercise.
    const activity = activityFor(result.activity);
    const calories = outdoorCalories({
      weightKg,
      distanceM: result.distanceM,
      durationSec: result.durationS,
      activeSec: result.activeSec,
      steps: result.steps,
      activity,
      loadKg: result.loadKg,
    });
    // Moving pace — wall-clock would make a paused session look slower than it ran.
    const avgPace = result.distanceM > 0 ? result.activeSec / (result.distanceM / 1000) : null;

    // Steps the hardware sensor counts are banked by the passive daily sync;
    // adding them here too double-counted every phone-carried walk.
    const sensorCovered = result.source === 'pedometer' && hasHardwareStepCounter();

    saveWalkSession({
      mode: result.mode,
      startTime: result.startTime,
      endTime: Date.now(),
      steps: result.steps,
      distanceM: result.distanceM,
      durationS: result.durationS,
      caloriesBurned: calories,
      avgPace,
      source: result.source,
      routeJson: result.route.length > 1 ? JSON.stringify(result.route) : null,
      activity: result.activity,
      loadKg: result.loadKg > 0 ? result.loadKg : null,
      activeS: result.activeSec,
      stepsAdded: sensorCovered ? 0 : result.steps,
    });
    // Fold the sensor's own count into the day right away.
    if (sensorCovered) void syncTodaySteps().catch(() => {});

    return { steps: result.steps, distanceM: result.distanceM, calories, durationS: result.durationS, saved: true };
  },

  reset: () =>
    set({
      active: false,
      startedAt: null,
      steps: 0,
      distanceM: 0,
      elapsedS: 0,
      route: [],
      usingGps: false,
      paused: false,
      pauseReason: '',
      activeS: 0,
      autoStarted: false,
    }),
}));
