import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

export const DB_NAME = 'fitcoach.db';

/**
 * Single shared SQLite connection. `enableChangeListener` lets us use
 * drizzle's `useLiveQuery` hook for reactive screens.
 */
export const sqlite: SQLiteDatabase = openDatabaseSync(DB_NAME, {
  enableChangeListener: true,
});

export const db = drizzle(sqlite, { schema });

export type DB = typeof db;
export { schema };
