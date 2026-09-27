/**
 * The wire contracts of a network that does not exist yet.
 *
 * TYPES ONLY. There is no account, no server and no request in this folder,
 * and `SOCIAL_ENABLED` is false. These describe what WOULD cross the wire, so
 * that the phone side can be built against a fixed shape and so that the most
 * important rule of the plan can be checked by a machine:
 *
 *   nothing here can carry health data.
 *
 * No type below has a field for weight, body composition, food, sleep,
 * smoking, alcohol, the cycle, hormones, conditions, prayer or fasting. The
 * engine suite reads this file and fails if one appears. See
 * docs/SOCIAL-PLAN.md, section 5.
 */

import type { PlaceKind } from '@/data/placeKinds';
import type { PathDiscipline } from '@/data/paths';
import type { StandardKey } from '@/lib/ranks';

/** Off, and nothing reads it as on. The day it flips, it flips in a release that says so. */
export const SOCIAL_ENABLED = false;

/** Generated on the phone, so a row can be made offline and sent later unchanged. */
export type Uuid = string;
/** A calendar day, never a moment: "2026-09-27". */
export type Day = string;

export interface PublicProfile {
  id: Uuid;
  handle: string;
  /** a key of GOVERNORATES */
  governorate: string | null;
  /** a key of TITLES */
  title: string;
  level: number;
  /** rung index on the Carthage ladder and division, or null when unranked */
  rank: { tier: number; division: 1 | 2 | 3; verified: boolean } | null;
  /** up to three achievement ids */
  showcase: number[];
  paths: Array<{ pathKey: string; stage: number; completed: boolean }>;
  published: boolean;
}

export interface SharedPlace {
  id: Uuid;
  name: string;
  kind: PlaceKind;
  latitude: number;
  longitude: number;
  governorate: string | null;
  city: string | null;
  access: 'free' | 'paid' | 'members' | null;
  /** in the owner's words: "60 TND a month" */
  priceNote: string | null;
  /** how many different people have logged a session here */
  confirmedBy: number;
}

export interface PlaceReview {
  id: Uuid;
  placeId: Uuid;
  authorId: Uuid;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  day: Day;
}

/** What a public rank is recomputed from. Bodyweight travels as a band, never as a number. */
export interface LiftRecord {
  id: Uuid;
  authorId: Uuid;
  standard: StandardKey;
  exerciseSlug: string;
  oneRmKg: number;
  /** lower edge of a 5 kg band: 75 means 75 to 80 */
  bodyweightBandKg: number;
  sex: 'male' | 'female';
  day: Day;
}

export type PostPayload =
  | { kind: 'session'; sessionType: string; minutes: number; placeId: Uuid | null; pathKey: string | null }
  | { kind: 'rank'; tier: number; division: 1 | 2 | 3; standard: StandardKey | null }
  | { kind: 'stage'; pathKey: string; stage: number; discipline: PathDiscipline }
  | { kind: 'badge'; achievementId: number }
  | { kind: 'card'; imageUrl: string }
  | { kind: 'game'; gameId: Uuid };

export interface Post {
  id: Uuid;
  authorId: Uuid;
  day: Day;
  payload: PostPayload;
  text: string | null;
}

export interface Crew {
  id: Uuid;
  name: string;
  governorate: string | null;
  /** the place it gathers at, when it has one */
  placeId: Uuid | null;
  members: number;
}

export interface Game {
  id: Uuid;
  organiserId: Uuid;
  placeId: Uuid;
  sport: string;
  /** local time, to the quarter hour */
  startsAt: string;
  seats: number;
  taken: number;
}

/** One thing waiting to be sent. Sending it twice must be harmless, which the id makes true. */
export interface OutboxItem {
  id: Uuid;
  kind: 'profile' | 'place' | 'review' | 'lift' | 'post' | 'follow' | 'game';
  createdAt: number;
  attempts: number;
  body: PublicProfile | SharedPlace | PlaceReview | LiftRecord | Post | { followedId: Uuid } | Game;
}
