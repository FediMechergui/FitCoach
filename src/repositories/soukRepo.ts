import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { pointPurchases } from '@/db/schema';
import { CARD_SKINS, DEFAULT_SKIN, findSkin, purchaseVerdict, type CardSkin, type PurchaseVerdict } from '@/data/souk';
import { challengeStats } from './challengeRepo';
import { kvGet, kvSet } from './kvRepo';
import { PRIMARY_USER_ID } from './userRepo';

/**
 * The souk's till. A purchase is one row — what was bought and what it cost —
 * and the balance everywhere in the app is earned minus every row like it.
 * Which skin is WORN is a choice, kept in the key-value store; it is checked
 * against what is owned each time it is read, so a skin that was never bought
 * can never be worn.
 */

export const KV_CARD_SKIN = 'souk.cardSkin';

export function ownedSkins(userId: number = PRIMARY_USER_ID): Set<string> {
  const owned = new Set<string>(CARD_SKINS.filter((s) => s.cost === 0).map((s) => s.key));
  try {
    for (const r of db.select({ k: pointPurchases.itemKey }).from(pointPurchases).where(eq(pointPurchases.userId, userId)).all()) {
      owned.add(r.k);
    }
  } catch {
    // no table yet: only the free skin is owned
  }
  return owned;
}

/** The skin the card wears — the chosen one if it is owned, else the default. */
export function wornSkin(userId: number = PRIMARY_USER_ID): CardSkin {
  const chosen = kvGet<string>(KV_CARD_SKIN) ?? DEFAULT_SKIN;
  return ownedSkins(userId).has(chosen) ? findSkin(chosen) : findSkin(DEFAULT_SKIN);
}

export function wearSkin(key: string, userId: number = PRIMARY_USER_ID): boolean {
  if (!ownedSkins(userId).has(key)) return false;
  kvSet(KV_CARD_SKIN, key);
  return true;
}

export interface SoukState {
  balance: number;
  earned: number;
  spent: number;
  worn: string;
  items: Array<{ skin: CardSkin; owned: boolean; verdict: PurchaseVerdict }>;
}

export function soukState(userId: number = PRIMARY_USER_ID): SoukState {
  const st = challengeStats(userId);
  const owned = ownedSkins(userId);
  return {
    balance: st.balance,
    earned: st.points,
    spent: st.spent,
    worn: wornSkin(userId).key,
    items: CARD_SKINS.map((skin) => ({ skin, owned: owned.has(skin.key), verdict: purchaseVerdict(skin.key, owned, st.balance) })),
  };
}

/**
 * Buy a skin and put it on. The verdict is taken again here, from the ledger,
 * at the moment of purchase — never from what a screen believed a second ago.
 */
export function buySkin(key: string, userId: number = PRIMARY_USER_ID): PurchaseVerdict {
  const verdict = purchaseVerdict(key, ownedSkins(userId), challengeStats(userId).balance);
  if (!verdict.ok) return verdict;
  db.insert(pointPurchases).values({ userId, itemKey: key, cost: verdict.cost, purchasedAt: Date.now() }).run();
  kvSet(KV_CARD_SKIN, key);
  return verdict;
}
