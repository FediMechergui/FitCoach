import { and, desc, eq } from 'drizzle-orm';
import { db, sqlite } from '@/db/client';
import { atomic } from '@/db/atomic';
import { customRoutines, exerciseLogs, type CustomRoutine, type SessionType } from '@/db/schema';
import { getSessionDetail, type SetDraft } from './sessionRepo';

export interface RoutinePrescription { exerciseId: number; sets: SetDraft[]; restSeconds: number; circuitGroup?: number | null }
import { getExercise, type ExerciseView } from './exerciseRepo';
import { PRIMARY_USER_ID } from './userRepo';

/**
 * Saved, updatable custom workout routines. A routine is an ordered list of
 * exercise ids; saving a session under an existing routine name UPDATES that
 * routine (so templates evolve with you instead of piling up duplicates).
 */

export interface RoutineView extends Omit<CustomRoutine, 'exerciseIds' | 'prescription' | 'sessionType'> {
  prescription: RoutinePrescription[];
  sessionType: SessionType;
  exerciseIds: number[];
  exercises: ExerciseView[];
}

function hydrate(r: CustomRoutine): RoutineView {
  let ids: number[];
  try {
    ids = JSON.parse(r.exerciseIds) as number[];
  } catch {
    ids = [];
  }
  const exercises = ids
    .map((id) => getExercise(id))
    .filter((e): e is ExerciseView => !!e);
  let prescription: RoutinePrescription[] = [];
  try { prescription = JSON.parse(r.prescription ?? '[]'); } catch { /* old routine has no set template */ }
  return { ...r, exerciseIds: ids, exercises, prescription: ids.map(id => prescription.find(p => p.exerciseId === id) ?? {exerciseId:id,restSeconds:90,sets:[]}),
    sessionType: r.sessionType ?? exercises[0]?.sessionType ?? 'strength' };
}

export function saveSessionRoutine(name: string, sessionId: number): RoutineView {
  return atomic(() => {
  const detail = getSessionDetail(sessionId);
  const routine = saveRoutine(name, detail.logs.map(l => l.log.exerciseId));
  const prescription: RoutinePrescription[] = detail.logs.map(l => ({ exerciseId: l.log.exerciseId,
    circuitGroup: l.log.supersetGroup,
    restSeconds: l.log.restSeconds ?? 90, sets: l.sets.map(s => ({ reps: s.reps, weightKg: s.weightKg, durationS: s.durationS,
      distanceM: s.distanceM, rpe: s.rpe, toFailure: false, completed: false })) }));
  db.update(customRoutines).set({ sessionType: detail.session.sessionType,
    style: detail.session.style,
    prescription: JSON.stringify(prescription) }).where(eq(customRoutines.id, routine.id)).run();
  return getRoutine(routine.id)!;
  });
}

export function listRoutines(userId: number = PRIMARY_USER_ID): RoutineView[] {
  return db
    .select()
    .from(customRoutines)
    .where(eq(customRoutines.userId, userId))
    .orderBy(desc(customRoutines.updatedAt))
    .all()
    .map(hydrate);
}

export function getRoutine(id: number): RoutineView | undefined {
  const row = db.select().from(customRoutines).where(eq(customRoutines.id, id)).get();
  return row ? hydrate(row) : undefined;
}

export function findRoutineByName(name: string, userId: number = PRIMARY_USER_ID): RoutineView | undefined {
  const row = db
    .select()
    .from(customRoutines)
    .where(and(eq(customRoutines.userId, userId), eq(customRoutines.name, name)))
    .get();
  return row ? hydrate(row) : undefined;
}

/** Create a routine, or UPDATE the existing one with the same name. */
export function saveRoutine(
  name: string,
  exerciseIds: number[],
  userId: number = PRIMARY_USER_ID
): RoutineView {
  const existing = findRoutineByName(name.trim(), userId);
  if (existing) {
    db.update(customRoutines)
      .set({ exerciseIds: JSON.stringify(exerciseIds), updatedAt: Date.now() })
      .where(eq(customRoutines.id, existing.id))
      .run();
    return getRoutine(existing.id)!;
  }
  const res = db
    .insert(customRoutines)
    .values({ userId, name: name.trim(), exerciseIds: JSON.stringify(exerciseIds), updatedAt: Date.now() })
    .run();
  return getRoutine(Number(res.lastInsertRowId))!;
}

export function renameRoutine(id: number, name: string): void {
  db.update(customRoutines).set({ name: name.trim(), updatedAt: Date.now() }).where(eq(customRoutines.id, id)).run();
}

export function updateRoutineExercises(id: number, exerciseIds: number[]): void {
  db.update(customRoutines)
    .set({ exerciseIds: JSON.stringify(exerciseIds), updatedAt: Date.now() })
    .where(eq(customRoutines.id, id))
    .run();
}

export function deleteRoutine(id: number): () => void {
  return atomic(() => {
  const snapshot = db.select().from(customRoutines).where(eq(customRoutines.id, id)).get();
  const planned = sqlite.getAllSync<{id:number}>('SELECT id FROM training_calendar WHERE routine_id=?',id);
  sqlite.runSync('UPDATE training_calendar SET routine_id=NULL WHERE routine_id=?',id);
  db.delete(customRoutines).where(eq(customRoutines.id, id)).run();
  return () => atomic(() => {
    if (!snapshot) return;
    db.insert(customRoutines).values(snapshot).run();
    for (const row of planned) sqlite.runSync('UPDATE training_calendar SET routine_id=? WHERE id=? AND routine_id IS NULL',id,row.id);
  });
  });
}

/** The ordered exercise ids of a logged session — for "save session as routine". */
export function sessionExerciseIds(sessionId: number): number[] {
  return db
    .select({ exerciseId: exerciseLogs.exerciseId, orderIndex: exerciseLogs.orderIndex })
    .from(exerciseLogs)
    .where(eq(exerciseLogs.sessionId, sessionId))
    .orderBy(exerciseLogs.orderIndex)
    .all()
    .map((r) => r.exerciseId);
}
