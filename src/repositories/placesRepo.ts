import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { places, placeVisits, sessions, type Place } from '@/db/schema';
import { validCoords } from '@/lib/places';
import { PRIMARY_USER_ID } from './userRepo';

/**
 * Places the user has marked. Everything here stays on the phone: a place is
 * written by its owner, read by its owner, and `visibility` stays 'private'
 * until there is an account to share it with — which there is not.
 */

export interface PlaceInput {
  name: string;
  kind: string;
  latitude?: number | null;
  longitude?: number | null;
  governorate?: string | null;
  city?: string | null;
  address?: string | null;
  notes?: string | null;
  access?: string | null;
  priceNote?: string | null;
  activities?: string[] | null;
  rating?: number | null;
  isHome?: boolean;
}

function clean(input: PlaceInput) {
  const hasFix = validCoords(input.latitude, input.longitude);
  const rating = input.rating != null && input.rating >= 1 && input.rating <= 5 ? Math.round(input.rating) : null;
  const text = (v: string | null | undefined) => {
    const t = (v ?? '').trim();
    return t.length ? t : null;
  };
  return {
    name: input.name.trim().slice(0, 80),
    kind: input.kind,
    latitude: hasFix ? (input.latitude as number) : null,
    longitude: hasFix ? (input.longitude as number) : null,
    governorate: text(input.governorate),
    city: text(input.city),
    address: text(input.address),
    notes: text(input.notes),
    access: text(input.access),
    priceNote: text(input.priceNote),
    activities: input.activities && input.activities.length ? input.activities.join(',') : null,
    rating,
    isHome: !!input.isHome,
  };
}

/** Only one place is home: marking another takes the mark off the first. */
function clearHome(userId: number, except?: number): void {
  for (const p of db.select().from(places).where(and(eq(places.userId, userId), eq(places.isHome, true))).all()) {
    if (p.id !== except) db.update(places).set({ isHome: false }).where(eq(places.id, p.id)).run();
  }
}

export function createPlace(input: PlaceInput, userId: number = PRIMARY_USER_ID): number | null {
  const v = clean(input);
  if (!v.name) return null;
  const now = Date.now();
  const r = db.insert(places).values({ userId, ...v, updatedAt: now }).run();
  const id = Number(r.lastInsertRowId);
  if (v.isHome) clearHome(userId, id);
  return id;
}

export function updatePlace(id: number, input: PlaceInput, userId: number = PRIMARY_USER_ID): boolean {
  const v = clean(input);
  if (!v.name) return false;
  db.update(places)
    .set({ ...v, updatedAt: Date.now() })
    .where(and(eq(places.id, id), eq(places.userId, userId)))
    .run();
  if (v.isHome) clearHome(userId, id);
  return true;
}

export function getPlace(id: number, userId: number = PRIMARY_USER_ID): Place | undefined {
  return db.select().from(places).where(and(eq(places.id, id), eq(places.userId, userId))).get();
}

export function listPlaces(userId: number = PRIMARY_USER_ID): Place[] {
  return db.select().from(places).where(eq(places.userId, userId)).orderBy(desc(places.isHome), desc(places.updatedAt)).all();
}

/** Delete a place and hand back everything needed to restore it, visits included. */
export function deletePlace(id: number, userId: number = PRIMARY_USER_ID): { place: Place; sessionIds: number[] } | null {
  const place = getPlace(id, userId);
  if (!place) return null;
  const sessionIds = db.select({ id: sessions.id }).from(sessions).where(and(eq(sessions.userId, userId), eq(sessions.placeId, id))).all().map((r) => r.id);
  db.update(sessions).set({ placeId: null }).where(and(eq(sessions.userId, userId), eq(sessions.placeId, id))).run();
  db.delete(placeVisits).where(and(eq(placeVisits.userId, userId), eq(placeVisits.placeId, id))).run();
  db.delete(places).where(eq(places.id, id)).run();
  return { place, sessionIds };
}

/** The Undo half of deletePlace: the same row, the same id, and its sessions re-attached. */
export function restorePlace(snapshot: { place: Place; sessionIds: number[] }): void {
  db.insert(places).values(snapshot.place).run();
  for (const sid of snapshot.sessionIds) attachSession(sid, snapshot.place.id, snapshot.place.userId);
}

// ── Sessions at a place ──────────────────────────────────────────────────────

export function attachSession(sessionId: number, placeId: number | null, userId: number = PRIMARY_USER_ID): void {
  const s = db.select().from(sessions).where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId))).get();
  if (!s) return;
  db.delete(placeVisits).where(and(eq(placeVisits.userId, userId), eq(placeVisits.sessionId, sessionId))).run();
  db.update(sessions).set({ placeId }).where(eq(sessions.id, sessionId)).run();
  if (placeId != null) {
    db.insert(placeVisits).values({ userId, placeId, sessionId, visitedAt: s.startTime }).run();
  }
}

export function placeOfSession(sessionId: number, userId: number = PRIMARY_USER_ID): Place | undefined {
  const s = db.select({ placeId: sessions.placeId }).from(sessions).where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId))).get();
  return s?.placeId != null ? getPlace(s.placeId, userId) : undefined;
}

export interface PlaceStats {
  visits: number;
  lastVisit: number | null;
}

export function placeStats(userId: number = PRIMARY_USER_ID): Map<number, PlaceStats> {
  const out = new Map<number, PlaceStats>();
  for (const v of db.select().from(placeVisits).where(eq(placeVisits.userId, userId)).all()) {
    const cur = out.get(v.placeId) ?? { visits: 0, lastVisit: null };
    cur.visits++;
    if (cur.lastVisit == null || v.visitedAt > cur.lastVisit) cur.lastVisit = v.visitedAt;
    out.set(v.placeId, cur);
  }
  return out;
}

export function homePlace(userId: number = PRIMARY_USER_ID): Place | undefined {
  return db.select().from(places).where(and(eq(places.userId, userId), eq(places.isHome, true))).get();
}
