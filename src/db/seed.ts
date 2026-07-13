import { sql } from 'drizzle-orm';
import { db } from './client';
import { exercises } from './schema';
import { EXERCISE_LIBRARY } from '@/data/exercises';

/**
 * Seed the built-in (non-custom) exercise library. Called once from the
 * bootstrap when user_version < SCHEMA_VERSION. Idempotent: clears prior
 * built-ins first so re-seeding on upgrade doesn't duplicate rows, while
 * leaving any user-created custom exercises intact.
 */
export function seedExerciseLibrary(): void {
  db.delete(exercises).where(sql`${exercises.isCustom} = 0`).run();

  const rows = EXERCISE_LIBRARY.map((e) => ({
    name: e.name,
    category: e.category,
    sessionType: e.sessionType,
    muscleGroups: JSON.stringify(e.muscleGroups),
    equipment: e.equipment ?? null,
    description: e.description ?? null,
    trackingType: e.trackingType,
    iconKey: e.icon,
    isCustom: false,
    metValue: e.met ?? null,
  }));

  // Batch insert in chunks to stay well within SQLite variable limits.
  const CHUNK = 50;
  for (let i = 0; i < rows.length; i += CHUNK) {
    db.insert(exercises).values(rows.slice(i, i + CHUNK)).run();
  }
}
