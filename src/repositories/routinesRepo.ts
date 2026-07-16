import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { customRoutines, exerciseLogs, type CustomRoutine } from '@/db/schema';
import { getExercise, type ExerciseView } from './exerciseRepo';
import { PRIMARY_USER_ID } from './userRepo';

/**
 * Saved, updatable custom workout routines. A routine is an ordered list of
 * exercise ids; saving a session under an existing routine name UPDATES that
 * routine (so templates evolve with you instead of piling up duplicates).
 */

export interface RoutineView extends Omit<CustomRoutine, 'exerciseIds'> {
  exerciseIds: number[];
  exercises: ExerciseView[];
}

function hydrate(r: CustomRoutine): RoutineView {
  let ids: number[] = [];
  try {
    ids = JSON.parse(r.exerciseIds) as number[];
  } catch {
    ids = [];
  }
  const exercises = ids
    .map((id) => getExercise(id))
    .filter((e): e is ExerciseView => !!e);
  return { ...r, exerciseIds: ids, exercises };
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

export function deleteRoutine(id: number): void {
  db.delete(customRoutines).where(eq(customRoutines.id, id)).run();
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
