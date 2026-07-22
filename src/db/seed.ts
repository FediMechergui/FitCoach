import { eq } from 'drizzle-orm';
import { db } from './client';
import { exercises } from './schema';
import { EXERCISE_LIBRARY } from '@/data/exercises';

/**
 * Seed / refresh the built-in exercise library.
 *
 * IMPORTANT — this must never delete-and-reinsert. `exercise_logs.exercise_id`
 * references these rows by id, so wiping the table would orphan every workout
 * the user has already logged. Instead we **upsert by `slug`** (a stable natural
 * key), which preserves ids across library expansions:
 *   - existing row (matched by slug, or by name for pre-slug databases) → UPDATE
 *   - new exercise → INSERT
 *   - exercises no longer in the library → left untouched, never deleted
 * Custom user exercises are never touched.
 */
export function seedExerciseLibrary(): void {
  const existing = db.select().from(exercises).all();
  const bySlug = new Map<string, number>();
  const byName = new Map<string, number>();
  for (const row of existing) {
    if (row.slug) bySlug.set(row.slug, row.id);
    // Only built-in rows are name-matchable. A user's custom "Burpees" must
    // never be silently converted into the built-in one when the library later
    // adds that name — that would overwrite their exercise and flip isCustom.
    if (!row.isCustom) byName.set(row.name.toLowerCase(), row.id);
  }

  for (const e of EXERCISE_LIBRARY) {
    const payload = {
      slug: e.slug,
      name: e.name,
      category: e.category,
      sessionType: e.sessionType,
      muscleGroups: JSON.stringify(e.muscleGroups),
      primaryMuscle: e.primaryMuscle ?? null,
      subMuscle: e.subMuscle ?? null,
      equipmentType: e.equipmentType ?? null,
      equipment: e.equipment ?? null,
      pattern: e.pattern ?? null,
      description: e.description ?? null,
      instructions: e.instructions ? JSON.stringify(e.instructions) : null,
      trackingType: e.trackingType,
      iconKey: e.icon,
      isCustom: false,
      metValue: e.met ?? null,
    };

    // Match an existing row by slug first, then fall back to name so databases
    // seeded before `slug` existed adopt the slug instead of duplicating.
    const id = bySlug.get(e.slug) ?? byName.get(e.name.toLowerCase());

    if (id !== undefined) {
      db.update(exercises).set(payload).where(eq(exercises.id, id)).run();
      bySlug.set(e.slug, id);
    } else {
      const res = db.insert(exercises).values(payload).run();
      bySlug.set(e.slug, Number(res.lastInsertRowId));
    }
  }
}
