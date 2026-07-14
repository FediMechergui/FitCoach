import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { healthConditions, type HealthCondition } from '@/db/schema';
import { findCondition } from '@/lib/conditions';
import { PRIMARY_USER_ID } from './userRepo';

export function listConditions(userId: number = PRIMARY_USER_ID): HealthCondition[] {
  return db
    .select()
    .from(healthConditions)
    .where(and(eq(healthConditions.userId, userId), eq(healthConditions.active, true)))
    .all();
}

export function hasCondition(key: string, userId: number = PRIMARY_USER_ID): boolean {
  return db
    .select()
    .from(healthConditions)
    .where(
      and(
        eq(healthConditions.userId, userId),
        eq(healthConditions.conditionKey, key),
        eq(healthConditions.active, true)
      )
    )
    .get() != null;
}

export function addCondition(key: string, notes?: string, userId: number = PRIMARY_USER_ID): void {
  if (hasCondition(key, userId)) return;
  const def = findCondition(key);
  db.insert(healthConditions)
    .values({
      userId,
      conditionKey: key,
      label: def?.label ?? key,
      category: def?.category ?? null,
      notes: notes ?? null,
      active: true,
    })
    .run();
}

export function removeCondition(key: string, userId: number = PRIMARY_USER_ID): void {
  db.delete(healthConditions)
    .where(and(eq(healthConditions.userId, userId), eq(healthConditions.conditionKey, key)))
    .run();
}
