/**
 * The souk — where challenge points are spent.
 *
 * Everything sold here is cosmetic: a skin for the athlete card. Nothing in
 * the souk makes a number bigger, skips a day, or buys a badge — points are
 * earned by doing the thing, and the only things they can buy are things to
 * look at. A skin is bought once and kept.
 *
 * Each skin is a place: its colours are the colours of that place.
 *
 * Since 3.8.0 there is a second shelf: story themes, the colours of the image
 * a finished route is shared as. Same rule — a place, its colours, cosmetic
 * only — and the same till: one ledger, one balance.
 */
import type { MapStyle } from '@/lib/outdoorSettings';

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
  // ── 3.8.0 ──
  { key: 'tabarka', name: 'Tabarka', place: 'Tabarka', story: 'Red coral under a green, pine-lined coast at the Algerian border.', cost: 160, top: '#D1495B', bottom: '#1F4D3A', frame: '#F7C6A3', ink: '#FFFFFF' },
  { key: 'chott-el-jerid', name: 'Chott el Jerid', place: 'Chott el Jerid', story: 'The salt lake at dawn: pink crust, violet sky, a mirage on the line between.', cost: 180, top: '#C97BA1', bottom: '#3B2A5C', frame: '#F4E7EE', ink: '#FFFFFF' },
  { key: 'matmata', name: 'Matmata', place: 'Matmata', story: 'Ochre earth dug into courtyards, whitewashed doors at the bottom of the pit.', cost: 180, top: '#B9783F', bottom: '#4A2C17', frame: '#F1E4D0', ink: '#FFFFFF' },
  { key: 'ichkeul', name: 'Ichkeul', place: 'Ichkeul', story: 'Lake water and reed beds where the winter birds come down from Europe.', cost: 200, top: '#3E8E9B', bottom: '#183E2E', frame: '#DCEBD3', ink: '#FFFFFF' },
  { key: 'bizerte', name: 'Bizerte', place: 'Bizerte', story: 'The old port: blue boats, orange nets, the canal between two seas.', cost: 220, top: '#2E6FB5', bottom: '#162B4D', frame: '#F29A4A', ink: '#FFFFFF' },
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

// ── Story themes (3.8.0) ─────────────────────────────────────────────────────
/**
 * The colours of a shared route: the card behind it, the map's tint, and the
 * line drawn over the streets. The first is free; the others are places.
 */
export interface StoryTheme {
  key: string;
  name: string;
  place: string;
  story: string;
  cost: number;
  /** card gradient, top to bottom */
  top: string;
  bottom: string;
  /** text on the card, and the quieter text under it */
  ink: string;
  muted: string;
  /** the route line: start, middle, finish */
  line: [string, string, string];
  /** how the real map under the line is tinted */
  map: MapStyle;
}

export const STORY_THEMES: StoryTheme[] = [
  { key: 'story:night-sea', name: 'Night Sea', place: 'FitCoach', story: 'The app’s own colours: your line glowing over a dark map.', cost: 0, top: '#0F1A2B', bottom: '#070C14', ink: '#FFFFFF', muted: '#9FB0C8', line: ['#33D9A6', '#4F8CFF', '#FF8663'], map: 'dark' },
  { key: 'story:sidi-bou-said', name: 'Sidi Bou Said', place: 'Sidi Bou Said', story: 'White walls and studded blue doors: a daylight map and a deep blue line.', cost: 90, top: '#F3F6FA', bottom: '#D5E3F5', ink: '#0E2A4F', muted: '#4A6283', line: ['#2F7BD6', '#123A73', '#E8A33D'], map: 'light' },
  { key: 'story:sahara', name: 'Sahara', place: 'Douz', story: 'Dune gold going to dusk, the line in the white of hot sand.', cost: 120, top: '#C98A2B', bottom: '#5E2A14', ink: '#FFF6E8', muted: '#F2D3A8', line: ['#FFF3D6', '#FFC266', '#FFFFFF'], map: 'warm' },
  { key: 'story:djerba', name: 'Djerba', place: 'Djerba', story: 'Lime-white menzels over a turquoise shallow sea.', cost: 120, top: '#E9FAF8', bottom: '#A8E6E1', ink: '#0B3B40', muted: '#2F6E72', line: ['#0E8F96', '#0B5F7A', '#F28C28'], map: 'light' },
  { key: 'story:kairouan', name: 'Kairouan', place: 'Kairouan', story: 'Carpet red and indigo, the line woven through the night.', cost: 150, top: '#7A1F2B', bottom: '#141B3D', ink: '#FFFFFF', muted: '#E3C3A8', line: ['#F2C14E', '#E84855', '#F7F3E3'], map: 'dark' },
  { key: 'story:tozeur', name: 'Tozeur', place: 'Tozeur', story: 'Palm green and brick: the oasis at the edge of the salt.', cost: 150, top: '#2D5A3D', bottom: '#2A1D14', ink: '#FFF6E8', muted: '#CFE3C9', line: ['#B6E388', '#E9C46A', '#F4A261'], map: 'warm' },
  { key: 'story:jasmin', name: 'Jasmin', place: 'Hammamet', story: 'White petals on green: a summer evening on the coast.', cost: 180, top: '#FFFFFF', bottom: '#DDEEE2', ink: '#173A29', muted: '#3F6B54', line: ['#3F8F63', '#173A29', '#F2B5D4'], map: 'light' },
  { key: 'story:carthage', name: 'Carthage', place: 'Carthage', story: 'Tyrian purple and gold: the route as an emperor would have walked it.', cost: 250, top: '#3A1A63', bottom: '#120821', ink: '#FFFFFF', muted: '#D8C3F2', line: ['#F5C542', '#C18CFF', '#FFFFFF'], map: 'dark' },
];

export const DEFAULT_STORY_THEME = 'story:night-sea';
export const findStoryTheme = (key: string | null | undefined): StoryTheme =>
  STORY_THEMES.find((t) => t.key === key) ?? STORY_THEMES[0];

/** May this story theme be bought? Pure, like the skins. */
export function storyVerdict(key: string, owned: Set<string>, balance: number): PurchaseVerdict {
  const theme = STORY_THEMES.find((t) => t.key === key);
  if (!theme) return { ok: false, reason: 'unknown', cost: 0 };
  if (theme.cost === 0 || owned.has(key)) return { ok: false, reason: 'owned', cost: theme.cost };
  if (theme.cost > balance) return { ok: false, reason: 'points', cost: theme.cost };
  return { ok: true, cost: theme.cost };
}
