import { create } from 'zustand';
import type { Session, SessionType } from '@/db/schema';
import {
  addExerciseToSession,
  addSet,
  deleteSet,
  finalizeSession,
  getSessionDetail,
  lastSetForExercise,
  removeExerciseLog,
  startSession,
  updateSet,
  deleteSession,
  activeSession,
  type ActivityDetail,
  type FinalizeResult,
  type SessionDetail,
  type SetDraft,
} from '@/repositories/sessionRepo';
import { exercisesBySlugs } from '@/repositories/exerciseRepo';
import { useUserStore } from './userStore';

interface SessionState {
  activeId: number | null;
  sessionType: SessionType | null;
  startedAt: number | null;
  detail: SessionDetail | null;

  // Rest timer (strength)
  restEndsAt: number | null;
  restDurationS: number;

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
  startRest: (seconds: number) => void;
  clearRest: () => void;
  finish: (opts?: { moodAfter?: number | null; activity?: ActivityDetail; notes?: string | null }) => FinalizeResult | null;
  cancel: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeId: null,
  sessionType: null,
  startedAt: null,
  detail: null,
  restEndsAt: null,
  restDurationS: 90,

  resume: () => {
    const active: Session | undefined = activeSession();
    if (active) {
      set({
        activeId: active.id,
        sessionType: active.sessionType,
        startedAt: active.startTime,
        detail: getSessionDetail(active.id),
      });
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

  startRest: (seconds) => set({ restEndsAt: Date.now() + seconds * 1000, restDurationS: seconds }),
  clearRest: () => set({ restEndsAt: null }),

  finish: (opts) => {
    const id = get().activeId;
    if (!id) return null;
    const weightKg = useUserStore.getState().currentWeightKg ?? undefined;
    const result = finalizeSession(id, { ...opts, weightKg });
    set({ activeId: null, sessionType: null, startedAt: null, detail: null, restEndsAt: null });
    return result;
  },

  cancel: () => {
    const id = get().activeId;
    if (id) deleteSession(id);
    set({ activeId: null, sessionType: null, startedAt: null, detail: null, restEndsAt: null });
  },
}));
