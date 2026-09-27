/**
 * The souk — where challenge points are spent.
 *
 * Everything sold here is cosmetic: a skin for the athlete card. Nothing in
 * the souk makes a number bigger, skips a day, or buys a badge — points are
 * earned by doing the thing, and the only things they can buy are things to
 * look at. A skin is bought once and kept.
 *
 * Each skin is a place: its colours are the colours of that place.
 */

export interface CardSkin {
  key: string;
  name: string;
  /** where the colours come from */
  place: string;
  story: string;
  /** points; 0 is yours from the start */
  cost: number;
  /** card gradient, top to bottom */
  top: string;
  bottom: string;
  /** frame and accents */
  frame: string;
  /** text on the card */
  ink: string;
  /** when true the card keeps the colour of its rating tier at the top, as it always has */
  tierTinted?: boolean;
}

export const CARD_SKINS: CardSkin[] = [
  { key: 'lume', name: 'Lume', place: 'FitCoach', story: 'The card as it has always been: the colour of your tier over the night sea.', cost: 0, top: '#3FE0B6', bottom: '#0B1220', frame: '#3FE0B6', ink: '#FFFFFF', tierTinted: true },
  { key: 'jasmin', name: 'Jasmin', place: 'Hammamet', story: 'White petals, green stem: the machmoum tucked behind the ear on a summer evening.', cost: 100, top: '#3F8F63', bottom: '#173A29', frame: '#F4F1E6', ink: '#FFFFFF' },
  { key: 'sidi-bou-said', name: 'Sidi Bou Said', place: 'Sidi Bou Said', story: 'Whitewashed walls and studded blue doors above the gulf.', cost: 120, top: '#2F7BD6', bottom: '#123A73', frame: '#F3F6FA', ink: '#FFFFFF' },
  { key: 'djerba', name: 'Djerba', place: 'Djerba', story: 'Lime-white menzels and a turquoise, shallow sea.', cost: 120, top: '#25B5BE', bottom: '#0E5560', frame: '#FBF7EE', ink: '#FFFFFF' },
  { key: 'medina', name: 'Medina', place: 'Tunis', story: 'Terracotta, brass and the green of old zellige.', cost: 150, top: '#C9743A', bottom: '#1F5B4C', frame: '#E6B866', ink: '#FFFFFF' },
  { key: 'sahara', name: 'Sahara', place: 'Douz', story: 'Dune gold going to dusk at the gate of the desert.', cost: 150, top: '#C98A2B', bottom: '#6A3118', frame: '#F6DDA0', ink: '#FFFFFF' },
  { key: 'el-jem', name: 'El Jem', place: 'El Jem', story: 'The amphitheatre at sunset: honey stone over deep shadow.', cost: 200, top: '#B9803F', bottom: '#3B2A1E', frame: '#F2D6A6', ink: '#FFFFFF' },
  { key: 'kairouan', name: 'Kairouan', place: 'Kairouan', story: 'Wool-red and indigo, the colours of the carpets.', cost: 200, top: '#B8323A', bottom: '#1E2A5A', frame: '#E9D2A0', ink: '#FFFFFF' },
  { key: 'carthage', name: 'Carthage', place: 'Carthage', story: 'Tyrian purple, the dye the Phoenicians were named for, edged in gold.', cost: 300, top: '#8A4FD1', bottom: '#2A1248', frame: '#F5C542', ink: '#FFFFFF' },
];

export const DEFAULT_SKIN = 'lume';
export const findSkin = (key: string | null | undefined): CardSkin => CARD_SKINS.find((s) => s.key === key) ?? CARD_SKINS[0];

export type PurchaseVerdict = { ok: true; cost: number } | { ok: false; reason: 'owned' | 'points' | 'unknown'; cost: number };

/** May this be bought? Pure: what is owned and what is in hand decide it. */
export function purchaseVerdict(key: string, owned: Set<string>, balance: number): PurchaseVerdict {
  const skin = CARD_SKINS.find((s) => s.key === key);
  if (!skin) return { ok: false, reason: 'unknown', cost: 0 };
  if (skin.cost === 0 || owned.has(key)) return { ok: false, reason: 'owned', cost: skin.cost };
  if (skin.cost > balance) return { ok: false, reason: 'points', cost: skin.cost };
  return { ok: true, cost: skin.cost };
}
