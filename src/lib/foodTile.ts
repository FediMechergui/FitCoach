/**
 * What a food shows when it has no photograph. Pure.
 *
 * A food without a picture is not given a wrong one: it shows a tile in the
 * colour of its kind, with the icon of its kind. That is honest, it is never
 * broken, and it still tells a vegetable from a pastry at a glance.
 */

export interface FoodTile {
  icon: string;
  color: string;
}

const TILES: Array<{ match: RegExp; tile: FoodTile }> = [
  { match: /fruit|juice/i, tile: { icon: 'nutrition.snack', color: '#FF8663' } },
  { match: /vegetable|salad|legume/i, tile: { icon: 'nutrition.veg', color: '#7FD98F' } },
  { match: /meat|poultry|offal|seafood|egg/i, tile: { icon: 'nutrition.protein', color: '#F58CB0' } },
  { match: /bread|grain|pasta|pastry|sandwich|cookie/i, tile: { icon: 'nutrition.carbs', color: '#F0B45C' } },
  { match: /cheese|milk|milkshake|dairy/i, tile: { icon: 'nutrition.water', color: '#6FA7F5' } },
  { match: /nuts|seeds|fat|spread|chocolate|sweet/i, tile: { icon: 'nutrition.fat', color: '#C69368' } },
  { match: /drink|beverage/i, tile: { icon: 'nutrition.soda', color: '#58C8F0' } },
  { match: /fast food|prepared|dish|condiment/i, tile: { icon: 'nutrition.lunch', color: '#C09AF7' } },
  { match: /packaged/i, tile: { icon: 'nutrition.barcode', color: '#8FA0B5' } },
];

export const DEFAULT_TILE: FoodTile = { icon: 'nutrition.lunch', color: '#8FA0B5' };

export function foodTile(category: string | null | undefined, form?: 'solid' | 'liquid' | null): FoodTile {
  const c = category ?? '';
  for (const t of TILES) if (t.match.test(c)) return t.tile;
  if (form === 'liquid') return { icon: 'nutrition.soda', color: '#58C8F0' };
  return DEFAULT_TILE;
}

/**
 * A picture address the app is willing to show.
 *
 * Only two kinds are: a file in the app's own storage, and nothing else. A
 * web address is never shown directly — a food list that loaded pictures
 * from the internet would tell a server what you eat, every time you scroll.
 * Pictures that come from the web are downloaded once, on purpose, and shown
 * from the phone after that.
 */
export function isLocalImage(uri: string | null | undefined): uri is string {
  return typeof uri === 'string' && /^(file|content):\/\//.test(uri) && !/^(https?|data):/i.test(uri);
}

/** The key under which a diary row finds its food's picture: the name, lower-cased and tidied. */
export function foodNameKey(name: string | null | undefined): string {
  return (name ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Only Open Food Facts' own image servers, over https, and only an image. */
export function offImageAllowed(url: string | null | undefined): url is string {
  if (typeof url !== 'string') return false;
  return /^https:\/\/(images|static)\.openfoodfacts\.(org|net)\/[^\s?#]+\.(jpe?g|png|webp)$/i.test(url);
}
