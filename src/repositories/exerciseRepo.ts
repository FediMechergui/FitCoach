import { and, eq, like, or } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  exercises,
  type EquipmentType,
  type Exercise,
  type NewExercise,
  type SessionType,
} from '@/db/schema';
import { PATTERN_CUES } from '@/data/exercises';

export interface ExerciseView extends Omit<Exercise, 'muscleGroups' | 'instructions'> {
  muscleGroups: string[];
  /** bespoke steps if present, else the generic cues for this movement pattern */
  instructions: string[];
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function hydrate(e: Exercise): ExerciseView {
  const bespoke = parseJson<string[]>(e.instructions, []);
  const cues = e.pattern ? PATTERN_CUES[e.pattern] ?? [] : [];
  return {
    ...e,
    muscleGroups: parseJson<string[]>(e.muscleGroups, []),
    instructions: bespoke.length ? bespoke : cues,
  };
}

export function getExercise(id: number): ExerciseView | undefined {
  const row = db.select().from(exercises).where(eq(exercises.id, id)).get();
  return row ? hydrate(row) : undefined;
}

export function getExerciseBySlug(slug: string): ExerciseView | undefined {
  const row = db.select().from(exercises).where(eq(exercises.slug, slug)).get();
  return row ? hydrate(row) : undefined;
}

export function listExercises(
  opts: {
    sessionType?: SessionType;
    muscle?: string;
    equipmentType?: EquipmentType;
    search?: string;
  } = {}
): ExerciseView[] {
  const clauses = [];
  if (opts.sessionType) clauses.push(eq(exercises.sessionType, opts.sessionType));
  if (opts.muscle) clauses.push(eq(exercises.primaryMuscle, opts.muscle));
  if (opts.equipmentType) clauses.push(eq(exercises.equipmentType, opts.equipmentType));
  if (opts.search && opts.search.trim()) {
    const q = `%${opts.search.trim().toLowerCase()}%`;
    clauses.push(or(like(exercises.name, q), like(exercises.category, q), like(exercises.primaryMuscle, q)));
  }
  const where = clauses.length ? and(...clauses) : undefined;
  const rows = db.select().from(exercises).where(where).orderBy(exercises.name).all();
  return rows.map(hydrate);
}

/** Resolve a list of slugs to exercises, preserving the given order. */
export function exercisesBySlugs(slugs: string[]): ExerciseView[] {
  const out: ExerciseView[] = [];
  for (const slug of slugs) {
    const ex = getExerciseBySlug(slug);
    if (ex) out.push(ex);
  }
  return out;
}

export function createCustomExercise(input: {
  name: string;
  sessionType: SessionType;
  category?: string;
  muscleGroups?: string[];
  primaryMuscle?: string;
  subMuscle?: string;
  equipmentType?: EquipmentType;
  equipment?: string;
  trackingType?: Exercise['trackingType'];
  iconKey?: string;
  metValue?: number;
}): ExerciseView {
  const payload: NewExercise = {
    slug: `custom-${Date.now()}`,
    name: input.name,
    category: input.category ?? 'custom',
    sessionType: input.sessionType,
    muscleGroups: JSON.stringify(input.muscleGroups ?? []),
    primaryMuscle: input.primaryMuscle ?? null,
    subMuscle: input.subMuscle ?? null,
    equipmentType: input.equipmentType ?? null,
    equipment: input.equipment ?? null,
    trackingType: input.trackingType ?? 'reps_weight',
    iconKey: input.iconKey ?? 'core.custom',
    isCustom: true,
    metValue: input.metValue ?? null,
  };
  const res = db.insert(exercises).values(payload).run();
  return getExercise(Number(res.lastInsertRowId))!;
}

/** Update a user-created exercise (built-ins are managed by the seed). */
export function updateCustomExercise(
  id: number,
  patch: {
    name?: string;
    sessionType?: SessionType;
    primaryMuscle?: string | null;
    subMuscle?: string | null;
    equipmentType?: EquipmentType | null;
    equipment?: string | null;
    trackingType?: Exercise['trackingType'];
    muscleGroups?: string[];
    iconKey?: string;
  }
): ExerciseView | undefined {
  const { muscleGroups, ...rest } = patch;
  db.update(exercises)
    .set({
      ...rest,
      ...(muscleGroups ? { muscleGroups: JSON.stringify(muscleGroups) } : {}),
    })
    .where(and(eq(exercises.id, id), eq(exercises.isCustom, true)))
    .run();
  return getExercise(id);
}

export function deleteCustomExercise(id: number): void {
  db.delete(exercises).where(and(eq(exercises.id, id), eq(exercises.isCustom, true))).run();
}
