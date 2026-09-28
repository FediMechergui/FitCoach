#!/usr/bin/env node
/**
 * Fetch one freely-licensed photograph for every food in the catalogue, from
 * Wikimedia Commons, and bundle it with the app.
 *
 * WHY BUNDLED: the app works with the radio off, and a food list that loaded
 * its pictures from the internet would tell a server what you eat. So the
 * pictures are downloaded HERE, once, shrunk to a thumbnail, and shipped
 * inside the app. Nothing is fetched on the phone.
 *
 * WHAT IS ACCEPTED: only files hosted on Commons under a licence that allows
 * reuse — public domain, CC0, CC BY, CC BY-SA. Anything else (fair-use images
 * that live on Wikipedia itself, unknown licences) is skipped, and the food
 * shows its category tile instead. Every picture used is credited in
 * src/data/foodImageCredits.ts, which the app shows on its credits page.
 *
 * Usage:
 *   npm install --no-save sharp
 *   node scripts/fetch-food-images.js            resume from the cache
 *   node scripts/fetch-food-images.js --redo=id1,id2   forget these and fetch again
 *   node scripts/fetch-food-images.js --sheet out.png [from] [count]   contact sheet to eyeball
 *
 * Overrides (scripts/food-image-overrides.json): food id -> a Wikipedia page
 * title ("Couscous"), a Commons file ("File:Brik.jpg"), or null for "no
 * picture, on purpose".
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CACHE_DIR = path.join(__dirname, '.cache');
const CACHE = path.join(CACHE_DIR, 'food-images.json');
const OVERRIDES = path.join(__dirname, 'food-image-overrides.json');
const OUT_DIR = path.join(ROOT, 'assets', 'foods');
const OUT_MAP = path.join(ROOT, 'src', 'data', 'foodImages.ts');
const OUT_CREDITS = path.join(ROOT, 'src', 'data', 'foodImageCredits.ts');
const FOODS = process.env.FOODS_JSON;
const SIZE = 160;
const AGENT = 'FitCoachFoodImages/1.0 (https://github.com/FediMechergui/FitCoach; build-time thumbnail fetch)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const args = process.argv.slice(2);
const flag = (name) => (args.find((a) => a.startsWith(`--${name}=`)) || '').split('=')[1];

async function getJson(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': AGENT, Accept: 'application/json' } });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      if (i === tries - 1) return null;
      await sleep(1500 * (i + 1));
    }
  }
  return null;
}

async function getBytes(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': AGENT } });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (i === tries - 1) return null;
      await sleep(1500 * (i + 1));
    }
  }
  return null;
}

/** "Egg (whole, large)" -> "egg"; "Couscous with Meat & Vegetables" -> "couscous with meat vegetables" */
function queryFor(name) {
  return name
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[&/,]/g, ' ')
    .replace(/\b(cooked|raw|boiled|grilled|fried|whole|large|medium|small|plain|fresh|dried|homemade|1|2|slice|piece)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const strip = (html) => String(html || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();

/** Articles about a whole cuisine or a list: their lead picture is not a picture of the food asked for. */
const GENERIC = /cuisine|gastronomie|^list of|^liste d|food and drink|culture of/i;

const FREE = /^(public domain|pd|cc0|cc[ -]by([ -]sa)?([ -]\d(\.\d)?)?( [a-z-]+)?)$/i;

/** Licence, author and a thumbnail URL for a Commons file, or null when it cannot be reused. */
async function commonsInfo(fileTitle) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=${SIZE * 2}&titles=${encodeURIComponent(fileTitle)}`;
  const j = await getJson(url);
  const page = j && j.query && Object.values(j.query.pages || {})[0];
  const info = page && page.imageinfo && page.imageinfo[0];
  if (!info || page.missing !== undefined) return null;
  if (!/^image\/(jpeg|png|webp)$/.test(info.mime || '')) return null;
  const m = info.extmetadata || {};
  const licence = strip(m.LicenseShortName && m.LicenseShortName.value);
  if (!FREE.test(licence)) return null;
  return {
    file: page.title,
    thumb: info.thumburl || info.url,
    page: info.descriptionurl,
    licence,
    artist: strip(m.Artist && m.Artist.value).slice(0, 80) || 'Unknown author',
  };
}

/** The lead image of the best-matching Wikipedia page, if it lives on Commons. */
async function leadImage(lang, search, exactTitle) {
  const base = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages|pageprops&piprop=name&pilimit=5`;
  const url = exactTitle
    ? `${base}&redirects=1&titles=${encodeURIComponent(exactTitle)}`
    : `${base}&generator=search&gsrlimit=4&gsrsearch=${encodeURIComponent(search)}`;
  const j = await getJson(url);
  const pages = j && j.query ? Object.values(j.query.pages || {}) : [];
  pages.sort((a, b) => (a.index || 0) - (b.index || 0));
  for (const p of pages) {
    if (p.pageprops && p.pageprops.disambiguation !== undefined) continue;
    if (!p.pageimage) continue;
    if (/\.(svg|gif)$/i.test(p.pageimage)) continue;
    const info = await commonsInfo(`File:${p.pageimage}`);
    if (info) return { ...info, article: p.title, lang };
  }
  return null;
}

/**
 * Search Commons itself for a photograph: "search:red apple fruit". Used where a
 * Wikipedia page leads with a drawing, a plant, a live animal or something that
 * merely shares the name. Drawings and diagrams are skipped by their file names.
 */
async function commonsSearch(words) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=12&srsearch=${encodeURIComponent(words + ' filetype:bitmap')}`;
  const j = await getJson(url);
  const hits = (j && j.query && j.query.search) || [];
  for (const h of hits) {
    if (!/\.jpe?g$/i.test(h.title)) continue;
    if (/illustration|drawing|koehler|k%C3%B6hler|köhler|plate|engraving|diagram|map|logo|flora|botanical|herbarium|stamp|painting|1[6-9]\d\d/i.test(h.title)) continue;
    const info = await commonsInfo(h.title);
    if (info) return { ...info, article: h.title, lang: 'commons' };
  }
  return null;
}

async function resolve(food, override) {
  if (override === null) return { none: true };
  if (typeof override === 'string') {
    if (/^search:/i.test(override)) return commonsSearch(override.slice(7).trim());
    if (/^File:/i.test(override)) {
      const info = await commonsInfo(override);
      return info ? { ...info, article: override, lang: 'commons' } : null;
    }
    return (await leadImage('en', '', override)) || (await leadImage('fr', '', override));
  }
  const q = queryFor(food.name);
  // Only a DISH is searched for as Tunisian. The Tunisian list also holds plain
  // ingredients (spinach, dried figs), and asking for "spinach, Tunisian cuisine"
  // returns the article about the cuisine, with the same photograph every time.
  const dish = food.cuisine === 'tunisian' && /tunisian|eid/i.test(food.category || '');
  const order = dish ? ['fr', 'en'] : ['en', 'fr'];
  const accept = (hit) => (hit && !GENERIC.test(hit.article) ? hit : null);
  for (const lang of order) {
    const hit = accept(await leadImage(lang, q, null));
    if (hit) return hit;
  }
  if (!dish) {
    for (const lang of order) {
      const hit = accept(await leadImage(lang, `${q} food`, null));
      if (hit) return hit;
    }
  }
  return null;
}

async function main() {
  if (!FOODS || !fs.existsSync(FOODS)) throw new Error('Set FOODS_JSON to a JSON dump of the catalogue: [{id,name,category,cuisine}]');
  const sharp = require('sharp');
  const foods = JSON.parse(fs.readFileSync(FOODS, 'utf8'));
  const overrides = fs.existsSync(OVERRIDES) ? JSON.parse(fs.readFileSync(OVERRIDES, 'utf8')) : {};
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

  const sheetAt = args.indexOf('--sheet');
  if (sheetAt >= 0) {
    const out = args[sheetAt + 1];
    const from = Number(args[sheetAt + 2] || 0);
    const count = Number(args[sheetAt + 3] || 60);
    const have = foods.filter((f) => fs.existsSync(path.join(OUT_DIR, `${f.id}.jpg`))).slice(from, from + count);
    const cols = 10;
    const cell = 128;
    const label = 34;
    const rows = Math.ceil(have.length / cols);
    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const text = have
      .map((f, i) => {
        const x = (i % cols) * cell + 3;
        const y = Math.floor(i / cols) * (cell + label) + cell + 12;
        const n = f.name;
        return `<text x="${x}" y="${y}" font-size="10" font-family="Arial" fill="#fff">${esc(n.slice(0, 22))}</text><text x="${x}" y="${y + 12}" font-size="10" font-family="Arial" fill="#9cf">${esc(n.slice(22, 44))}</text>`;
      })
      .join('');
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cell}" height="${rows * (cell + label)}">${text}</svg>`);
    const tiles = await Promise.all(
      have.map(async (f, i) => ({
        input: await sharp(path.join(OUT_DIR, `${f.id}.jpg`)).resize(cell - 4, cell - 4).toBuffer(),
        left: (i % cols) * cell + 2,
        top: Math.floor(i / cols) * (cell + label) + 2,
      }))
    );
    await sharp({ create: { width: cols * cell, height: rows * (cell + label), channels: 3, background: '#0C1420' } })
      .composite([...tiles, { input: svg, left: 0, top: 0 }])
      .png()
      .toFile(out);
    console.log('sheet', out, have.length, 'foods from', from);
    return;
  }

  const redo = (flag('redo') || '').split(',').filter(Boolean);
  for (const id of redo) {
    delete cache[id];
    const f = path.join(OUT_DIR, `${id}.jpg`);
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }

  let done = 0;
  for (const food of foods) {
    done++;
    const file = path.join(OUT_DIR, `${food.id}.jpg`);
    const known = cache[food.id];
    const override = Object.prototype.hasOwnProperty.call(overrides, food.id) ? overrides[food.id] : undefined;
    if (known && (known.none || fs.existsSync(file)) && known.override === JSON.stringify(override)) continue;

    const hit = await resolve(food, override);
    if (!hit || hit.none) {
      cache[food.id] = { none: true, override: JSON.stringify(override) };
      if (fs.existsSync(file)) fs.unlinkSync(file);
      console.log(`${done}/${foods.length} - ${food.id}: ${hit ? 'none by choice' : 'nothing usable'}`);
    } else {
      const bytes = await getBytes(hit.thumb);
      if (!bytes) {
        console.log(`${done}/${foods.length} ! ${food.id}: download failed`);
      } else {
        try {
          await sharp(bytes).rotate().resize(SIZE, SIZE, { fit: 'cover', position: 'attention' }).jpeg({ quality: 68, mozjpeg: true }).toFile(file);
          cache[food.id] = { file: hit.file, page: hit.page, licence: hit.licence, artist: hit.artist, article: hit.article, lang: hit.lang, override: JSON.stringify(override) };
          console.log(`${done}/${foods.length} + ${food.id}: ${hit.article} [${hit.licence}]`);
        } catch (e) {
          console.log(`${done}/${foods.length} ! ${food.id}: could not process image`);
        }
      }
    }
    fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
    await sleep(250);
  }

  // ── Generated files ──
  const have = foods.filter((f) => cache[f.id] && !cache[f.id].none && fs.existsSync(path.join(OUT_DIR, `${f.id}.jpg`)));
  // Remove pictures of foods that no longer exist.
  const ids = new Set(have.map((f) => f.id));
  for (const f of fs.readdirSync(OUT_DIR)) if (f.endsWith('.jpg') && !ids.has(f.replace(/\.jpg$/, ''))) fs.unlinkSync(path.join(OUT_DIR, f));

  const q = (s) => JSON.stringify(String(s));
  fs.writeFileSync(
    OUT_MAP,
    `/**
 * A photograph for each food in the catalogue, bundled with the app.
 * GENERATED by scripts/fetch-food-images.js — do not edit by hand.
 *
 * ${have.length} of ${foods.length} foods have one. The rest show their category tile:
 * no freely-licensed photograph was found, and a wrong picture is worse than none.
 * Credits are in ./foodImageCredits.ts.
 */
export const FOOD_IMAGES: Record<string, number> = {
${have.map((f) => `  ${q(f.id)}: require('../../assets/foods/${f.id}.jpg'),`).join('\n')}
};
`,
    'utf8'
  );
  fs.writeFileSync(
    OUT_CREDITS,
    `/**
 * Who took each food photograph, and under what licence.
 * GENERATED by scripts/fetch-food-images.js — do not edit by hand.
 *
 * Every picture comes from Wikimedia Commons under a licence that allows
 * reuse. Pictures were cropped to a square and reduced; under CC BY-SA the
 * thumbnails are shared under the same licence as their originals.
 */
export interface FoodImageCredit {
  artist: string;
  licence: string;
  /** the file's page on Wikimedia Commons */
  page: string;
}

export const FOOD_IMAGE_CREDITS: Record<string, FoodImageCredit> = {
${have.map((f) => `  ${q(f.id)}: { artist: ${q(cache[f.id].artist)}, licence: ${q(cache[f.id].licence)}, page: ${q(cache[f.id].page)} },`).join('\n')}
};
`,
    'utf8'
  );
  const kb = have.reduce((s, f) => s + fs.statSync(path.join(OUT_DIR, `${f.id}.jpg`)).size, 0) / 1024;
  console.log(`wrote ${have.length}/${foods.length} pictures, ${Math.round(kb)} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
