import { create } from 'zustand';
import type { Session, SessionType } from '@/db/schema';
import {
  addExerciseToSession,
  addSet,
  deleteSet,
  finalizeSession,
  getSessionDetail,
  lastSetForExercise,
  moveExerciseLog,
  removeExerciseLog,
  startSession,
  updateSet,
  deleteSession,
  activeSession,
  type ActivityDetail,
  type FinalizeResult,
  type SessionDetail,
  type SetDraft,
  toggleWarmupDone,
  replaceExerciseLog,
} from '@/repositories/sessionRepo';
import { exercisesBySlugs } from '@/repositories/exerciseRepo';
import { metaFor } from '@/constants/sessionTypes';
import {
  dismissOngoingNotification,
  showOngoingNotification,
} from '@/services/sessionNotifications';
import { useUserStore } from './userStore';
import type { RestPrescription } from '@/lib/restPrescription';

interface SessionState {
  activeId: number | null;
  sessionType: SessionType | null;
  startedAt: number | null;
  detail: SessionDetail | null;

  // Rest timer (strength)
  restEndsAt: number | null;
  restDurationS: number;
  /** the prescription behind the current rest, when the app chose it */
  restRx: RestPrescription | null;

  resume: () => void;
  begin: (
    type: SessionType,
    opts?: {
      label?: string;
      moodBefore?: number;
      style?: string;
      splitKey?: string;
      splitDay?: string;
      /** exercise slugs to pre-populate (from a training split) */
      prefillSlugs?: string[];
      /** exercise ids to pre-populate (from a saved custom routine) */
      prefillExerciseIds?: number[];
    }
  ) => void;
  refresh: () => void;
  addExercise: (exerciseId: number) => number | null;
  logSet: (logId: number, draft: SetDraft) => void;
  repeatLastSet: (logId: number, exerciseId: number) => void;
  editSet: (setId: number, patch: SetDraft) => void;
  removeSet: (setId: number) => void;
  removeExercise: (logId: number) => void;
  moveExercise: (logId: number, direction: 'up' | 'down') => void;
  /** Replace an exercise with an easier alternative (removes old log, adds new). */
  swapExercise: (logId: number, newExerciseId: number) => number | null;
  startRest: (seconds: number, rx?: RestPrescription | null) => void;
  /** tick / untick a warm-up muscle — persisted on the session row */
  toggleWarmup: (muscle: string) => void;
  clearRest: () => void;
  finish: (opts?: { moodAfter?: number | null; activity?: ActivityDetail; notes?: string | null; onFoot?: boolean }) => FinalizeResult | null;
  cancel: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeId: null,
  sessionType: null,
  startedAt: null,
  detail: null,
  restEndsAt: null,
  restDurationS: 90,
  restRx: null,

  resume: () => {
    const active: Session | undefined = activeSession();
    if (active) {
      set({
        activeId: active.id,
        sessionType: active.sessionType,
        startedAt: active.startTime,
        detail: getSessionDetail(active.id),
      });
      // Re-pin the sticky notification after an app restart.
      const meta = metaFor(active.sessionType);
      void showOngoingNotification(
        'training',
        `FitCoach — ${active.label ?? meta.label} in progress`,
        'Session timer is running. Return to FitCoach to log sets and finish.'
      );
    }
  },

  begin: (type, opts) => {
    const id = startSession(type, opts);
    // Pre-populate the session with the split day's / routine's exercises, in order.
    if (opts?.prefillSlugs?.length) {
      for (const ex of exercisesBySlugs(opts.prefillSlugs)) {
        addExerciseToSession(id, ex.id);
      }
    }
    if (opts?.prefillExerciseIds?.length) {
      for (const exId of opts.prefillExerciseIds) {
        addExerciseToSession(id, exId);
      }
    }
    set({
      activeId: id,
      sessionType: type,
      startedAt: Date.now(),
      detail: getSessionDetail(id),
      restEndsAt: null,
    });

    // Sticky notification while the session is live.
    const meta = metaFor(type);
    void showOngoingNotification(
      'training',
      `FitCoach — ${opts?.label ?? meta.label} in progress`,
      'Session timer is running. Return to FitCoach to log sets and finish.'
    );
  },

  refresh: () => {
    const id = get().activeId;
    if (id) set({ detail: getSessionDetail(id) });
  },

  addExercise: (exerciseId) => {
    const id = get().activeId;
    if (!id) return null;
    const logId = addExerciseToSession(id, exerciseId);
    get().refresh();
    return logId;
  },

  logSet: (logId, draft) => {
    addSet(logId, draft);
    get().refresh();
  },

  repeatLastSet: (logId, exerciseId) => {
    const last = lastSetForExercise(exerciseId);
    addSet(logId, {
      reps: last?.reps ?? null,
      weightKg: last?.weightKg ?? null,
      rpe: last?.rpe ?? null,
      toFailure: !!last?.toFailure,
    });
    get().refresh();
  },

  editSet: (setId, patch) => {
    updateSet(setId, patch);
    get().refresh();
  },

  removeSet: (setId) => {
    deleteSet(setId);
    get().refresh();
  },

  removeExercise: (logId) => {
    removeExerciseLog(logId);
    get().refresh();
  },
  moveExercise: (logId, direction) => {
    if (moveExerciseLog(logId, direction)) get().refresh();
  },

  swapExercise: (logId, newExerciseId) => {
    const id = get().activeId;
    if (!id) return null;
    // In place: the easier alternative takes the same slot in the running
    // order rather than being appended at the bottom.
    const newLogId = replaceExerciseLog(logId, newExerciseId);
    get().refresh();
    return newLogId;
  },

  startRest: (seconds, rx) => set({ restEndsAt: Date.now() + seconds * 1000, restDurationS: seconds, restRx: rx ?? null }),
  toggleWarmup: (muscle) => {
    const id = get().activeId;
    if (!id) return;
    toggleWarmupDone(id, muscle);
    get().refresh();
  },
  clearRest: () => set({ restEndsAt: null }),

  finish: (opts) => {
    const id = get().activeId;
    if (!id) return null;
    const weightKg = useUserStore.getState().currentWeightKg ?? undefined;
    const result = finalizeSession(id, { ...opts, weightKg });
    set({ activeId: null, sessionType: null, startedAt: null, detail: null, restEndsAt: null });
    void dismissOngoingNotification('training');
    return result;
  },

  cancel: () => {
    const id = get().activeId;
    if (id) deleteSession(id);
    set({ activeId: null, sessionType: null, startedAt: null, detail: null, restEndsAt: null });
    void dismissOngoingNotification('training');
  },
}));
