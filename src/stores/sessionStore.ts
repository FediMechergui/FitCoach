import { create } from 'zustand';
import { toast } from '@/components/ui/Toast';
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
  type SetRow,
  restoreSetEntry,
  toggleWarmupDone,
  replaceExerciseLog,
  setExerciseRest,
} from '@/repositories/sessionRepo';
import { exercisesBySlugs } from '@/repositories/exerciseRepo';
import { metaFor } from '@/constants/sessionTypes';
import {
  dismissOngoingNotification,
  showOngoingNotification,
} from '@/services/sessionNotifications';
import { useUserStore } from './userStore';
import type { RestPrescription } from '@/lib/restPrescription';
import type { RoutinePrescription } from '@/repositories/routinesRepo';
import { changeTiming, flagRecoveredTiming, openTiming, settleRest } from '@/repositories/timingRepo';
import { setCircuitGroup } from '@/repositories/gymRepo';

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
      prescription?: RoutinePrescription[];
    }
  ) => void;
  refresh: () => void;
  addExercise: (exerciseId: number) => number | null;
  logSet: (logId: number, draft: SetDraft) => void;
  repeatLastSet: (logId: number, exerciseId: number) => void;
  editSet: (setId: number, patch: SetDraft) => void;
  removeSet: (setId: number) => void;
  /** the Undo half of removeSet — re-inserts the captured row verbatim */
  restoreSet: (row: SetRow) => void;
  removeExercise: (logId: number) => void;
  moveExercise: (logId: number, direction: 'up' | 'down') => void;
  /** Replace an exercise with an easier alternative (removes old log, adds new). */
  swapExercise: (logId: number, newExerciseId: number) => number | null;
  startRest: (seconds: number, rx?: RestPrescription | null, logId?: number) => void;
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
      flagRecoveredTiming(active.id);
      const timer = openTiming(active.id);
      set({
        restEndsAt: timer?.phase === 'rest' ? timer.target_end : null,
        restDurationS: timer?.phase === 'rest' && timer.target_end != null ? Math.max(0, (timer.target_end - timer.started_at) / 1000) : 90,
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
    if (activeSession()) { get().resume(); toast({ message: 'Resumed your current workout. Finish or cancel it before starting another.' }); return; }
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
    if (opts?.prescription?.length) {
      for (const entry of opts.prescription) {
        const logId = addExerciseToSession(id, entry.exerciseId);
        setExerciseRest(logId, entry.restSeconds);
        setCircuitGroup(logId, entry.circuitGroup ?? null);
        for (const draft of entry.sets) addSet(logId, { ...draft, completed: false });
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
    const equipmentId = get().detail?.logs.find(l => l.log.id === logId)?.log.equipmentId ?? null;
    const last = lastSetForExercise(exerciseId, undefined, equipmentId);
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

  restoreSet: (row) => {
    restoreSetEntry(row);
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

  startRest: (seconds, rx, logId) => {
    if (logId) setExerciseRest(logId, seconds);
    const ends = Date.now() + seconds * 1000;
    const id = get().activeId;
    if (id) changeTiming(id, 'rest', logId ?? null, ends);
    set({ restEndsAt: ends, restDurationS: seconds, restRx: rx ?? null });
  },
  toggleWarmup: (muscle) => {
    const id = get().activeId;
    if (!id) return;
    toggleWarmupDone(id, muscle);
    get().refresh();
  },
  clearRest: () => {
    const id = get().activeId;
    if (id) { settleRest(id); if (openTiming(id)?.phase === 'rest') changeTiming(id, 'transition'); }
    set({ restEndsAt: null });
  },

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
