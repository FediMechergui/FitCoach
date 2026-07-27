import { create } from 'zustand';

/**
 * A scratch list of exercise ids picked from the library *before* a session
 * exists — used when logging a past session, where there's no session id to
 * attach picks to yet. The log screen reads this, passes the ids to
 * `logPastSession`, then clears it.
 */
interface ExerciseDraftState {
  ids: number[];
  add: (id: number) => void;
  remove: (id: number) => void;
  clear: () => void;
}

export const useExerciseDraftStore = create<ExerciseDraftState>((set, get) => ({
  ids: [],
  add: (id) => {
    if (get().ids.includes(id)) return; // no duplicates in a draft list
    set({ ids: [...get().ids, id] });
  },
  remove: (id) => set({ ids: get().ids.filter((x) => x !== id) }),
  clear: () => set({ ids: [] }),
}));
