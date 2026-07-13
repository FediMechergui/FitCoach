import { and, eq, like, or } from 'drizzle-orm';
import { db } from '@/db/client';
import { exercises, type Exercise, type NewExercise, type SessionType } from '@/db/schema';

export interface ExerciseView extends Omit<Exercise, 'muscleGroups'> {
  muscleGroups: string[];
}

function hydrate(e: Exercise): ExerciseView {
  let mg: string[] = [];
  if (e.muscleGroups) {
    try {
      mg = JSON.parse(e.muscleGroups) as string[];
    } catch {
      mg = [];
    }
  }
  return { ...e, muscleGroups: mg };
}

export function getExercise(id: number): ExerciseView | undefined {
  const row = db.select().from(exercises).where(eq(exercises.id, id)).get();
  return row ? hydrate(row) : undefined;
}

export function listExercises(opts: {
  sessionType?: SessionType;
  search?: string;
} = {}): ExerciseView[] {
  const clauses = [];
  if (opts.sessionType) clauses.push(eq(exercises.sessionType, opts.sessionType));
  if (opts.search && opts.search.trim()) {
    const q = `%${opts.search.trim().toLowerCase()}%`;
    clauses.push(or(like(exercises.name, q), like(exercises.category, q)));
  }
  const where = clauses.length ? and(...clauses) : undefined;
  const rows = db.select().from(exercises).where(where).orderBy(exercises.name).all();
  return rows.map(hydrate);
}

export function createCustomExercise(input: {
  name: string;
  sessionType: SessionType;
  category?: string;
  muscleGroups?: string[];
  equipment?: string;
  trackingType?: Exercise['trackingType'];
  iconKey?: string;
  metValue?: number;
}): ExerciseView {
  const payload: NewExercise = {
    name: input.name,
    category: input.category ?? 'custom',
    sessionType: input.sessionType,
    muscleGroups: JSON.stringify(input.muscleGroups ?? []),
    equipment: input.equipment ?? null,
    trackingType: input.trackingType ?? 'reps_weight',
    iconKey: input.iconKey ?? 'core.custom',
    isCustom: true,
    metValue: input.metValue ?? null,
  };
  const res = db.insert(exercises).values(payload).run();
  return getExercise(Number(res.lastInsertRowId))!;
}

export function deleteCustomExercise(id: number): void {
  db.delete(exercises).where(and(eq(exercises.id, id), eq(exercises.isCustom, true))).run();
}
