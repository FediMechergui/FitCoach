import type { Config } from 'drizzle-kit';

/**
 * Drizzle Kit config. Generates SQL migrations from src/db/schema.ts.
 * At runtime the app bootstraps the schema directly (see src/db/bootstrap.ts),
 * so generated migrations are optional but kept for schema diffing / reference.
 */
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
