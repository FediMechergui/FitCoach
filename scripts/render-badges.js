#!/usr/bin/env node
/**
 * Pre-render the achievement badges to PNG (base64) so the app can show the
 * art with a plain <Image> — no runtime react-native-svg, which crashed the
 * Achievements screen natively on device.
 *
 * 3.2.3 — the badges are minted, not drawn flat. The catalogue SVG in
 * src/data/achievements.ts still supplies everything that makes a badge ITS
 * badge: the disc colour, the rim colour and the glyph. This script re-frames
 * that glyph in a medal — a bevelled metallic rim with a reeded edge, a lit
 * disc, a glass sheen, a soft shadow under the coin and under the glyph — and
 * rasterises it at three times the display size.
 *
 * Reads src/data/achievements.ts, writes src/data/badgeImages.ts.
 * Re-run whenever the badge art (or this frame) changes.
 *
 * Requires: npm install --no-save @resvg/resvg-js sharp
 * (sharp quantises each PNG to a palette; without it the 150 medals weigh
 * five times as much in the bundle.)
 */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
let sharp = null;
try {
  sharp = require('sharp');
} catch {
  console.warn('sharp not found: PNGs will not be quantised (npm install --no-save sharp)');
}

const SRC = path.join(__dirname, '..', 'src', 'data', 'achievements.ts');
const OUT = path.join(__dirname, '..', 'src', 'data', 'badgeImages.ts');
/** rendered px; badges display at 56pt, so this is ~2.5× — crisp on a 3× screen without a 3 MB bundle */
const SIZE = Number(process.env.BADGE_PX || 144);

// ── colour helpers ───────────────────────────────────────────────────────────
const hex = (h) => {
  const m = h.replace('#', '');
  const s = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const toHex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
const light = (c, t) => mix(c, '#ffffff', t);
const dark = (c, t) => mix(c, '#000000', t);

// ── the catalogue ────────────────────────────────────────────────────────────
function attr(tag, name) {
  const m = (tag || '').match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : undefined;
}

/**
 * Pull the palette and the glyph out of a flat catalogue badge: the first
 * <circle> is the disc (fill + rim stroke); everything after it is the glyph.
 */
function dissect(svg) {
  const disc = svg.match(/<circle\b[^>]*\/>/);
  if (!disc) throw new Error('badge has no disc circle');
  const fill = attr(disc[0], 'fill') || '#ECEFF1';
  const rim = attr(disc[0], 'stroke') || '#B0BEC5';
  const glyph = svg
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(disc[0], '');
  const accent = (glyph.match(/fill="(#[0-9A-Fa-f]{3,6})"/) || [])[1] || '#607D8B';
  return { fill, rim, accent, glyph };
}

/** The medal frame around a glyph. */
function medal({ fill, rim, accent, glyph }) {
  const rimHi = light(rim, 0.55);
  const rimLo = dark(rim, 0.28);
  const discHi = light(fill, 0.55);
  const discLo = mix(fill, rim, 0.5);
  return `<svg viewBox="-4 -3 72 72" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${rimHi}"/>
    <stop offset="0.42" stop-color="${rim}"/>
    <stop offset="0.58" stop-color="${rimLo}"/>
    <stop offset="1" stop-color="${light(rim, 0.3)}"/>
  </linearGradient>
  <radialGradient id="disc" cx="0.38" cy="0.3" r="0.78">
    <stop offset="0" stop-color="${discHi}"/>
    <stop offset="0.55" stop-color="${fill}"/>
    <stop offset="1" stop-color="${discLo}"/>
  </radialGradient>
  <radialGradient id="sheen" cx="0.3" cy="0.2" r="0.6">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/>
    <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0.55" stop-color="${accent}" stop-opacity="0.16"/>
    <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
  </radialGradient>
  <filter id="coinShadow" x="-25%" y="-25%" width="150%" height="150%">
    <feDropShadow dx="0" dy="1.6" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.32"/>
  </filter>
  <filter id="glyphShadow" x="-25%" y="-25%" width="150%" height="150%">
    <feDropShadow dx="0" dy="0.9" stdDeviation="0.7" flood-color="#000000" flood-opacity="0.26"/>
  </filter>
</defs>
<!-- the coin: rim, reeded edge, bevel -->
<circle cx="32" cy="32" r="30" fill="url(#rim)" filter="url(#coinShadow)"/>
<circle cx="32" cy="32" r="30" fill="none" stroke="${rimLo}" stroke-width="0.6" opacity="0.7"/>
<circle cx="32" cy="32" r="28.4" fill="none" stroke="${rimLo}" stroke-width="1.1" stroke-dasharray="0.8 1.2" opacity="0.5"/>
<!-- the disc, lit from the top-left, with a soft halo of the glyph colour -->
<circle cx="32" cy="32" r="26.4" fill="url(#disc)"/>
<circle cx="32" cy="32" r="26.4" fill="url(#halo)"/>
<circle cx="32" cy="32" r="26.4" fill="none" stroke="${rimLo}" stroke-width="0.9" opacity="0.55"/>
<circle cx="32" cy="32" r="25.3" fill="none" stroke="#ffffff" stroke-width="0.7" opacity="0.55"/>
<!-- the glyph itself, scaled to sit inside the bevel, lifted off the disc -->
<g filter="url(#glyphShadow)" transform="translate(32 32) scale(0.88) translate(-32 -32)">${glyph}</g>
<!-- glass -->
<circle cx="32" cy="32" r="26.4" fill="url(#sheen)"/>
</svg>`;
}

const lines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/);
const entries = [];
for (const line of lines) {
  const idM = line.match(/id:\s*(\d+),/);
  const svgM = line.match(/svg:\s*("(?:[^"\\]|\\.)*")/);
  if (idM && svgM) entries.push({ id: Number(idM[1]), svg: JSON.parse(svgM[1]) });
}
entries.sort((a, b) => a.id - b.id);
console.log('badges found:', entries.length);

const render = (svg) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: SIZE }, background: 'rgba(0,0,0,0)' }).render().asPng();

/** A 32-bit PNG of soft gradients compresses badly; a 200-colour palette with dithering looks the same at 56pt. */
const quantise = async (png) =>
  sharp ? sharp(png).png({ palette: true, quality: 90, colours: 200, dither: 0.8, effort: 10, compressionLevel: 9 }).toBuffer() : png;

// A preview sheet, when asked for: node scripts/render-badges.js --preview out.png
const previewAt = process.argv.indexOf('--preview');
if (previewAt > 0) {
  const outPng = process.argv[previewAt + 1];
  const ids = (process.argv[previewAt + 2] || '1,2,3,13,22,45,64,88,131,141').split(',').map(Number);
  const cell = 160;
  const cols = 5;
  const rows = Math.ceil(ids.length / cols);
  const tiles = ids
    .map((id, i) => {
      const e = entries.find((x) => x.id === id);
      if (!e) return '';
      const inner = medal(dissect(e.svg)).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
      const x = (i % cols) * cell;
      const y = Math.floor(i / cols) * cell;
      // ids in the defs collide across tiles; namespace them
      const ns = inner.replace(/id="([a-z]+)"/gi, `id="$1${i}"`).replace(/url\(#([a-z]+)\)/gi, `url(#$1${i})`);
      return `<g transform="translate(${x + 8} ${y + 8}) scale(2)">${ns}</g>`;
    })
    .join('');
  const sheet = `<svg viewBox="0 0 ${cols * cell} ${rows * cell}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0C1420"/>${tiles}</svg>`;
  fs.writeFileSync(outPng, new Resvg(sheet, { fitTo: { mode: 'width', value: cols * cell } }).render().asPng());
  console.log('preview written to', outPng);
  process.exit(0);
}

(async () => {
let total = 0;
const rows = [];
for (const { id, svg } of entries) {
  const b64 = (await quantise(render(medal(dissect(svg))))).toString('base64');
  total += b64.length;
  rows.push(`  ${id}: 'data:image/png;base64,${b64}',`);
}

const out = `/**
 * Pre-rendered achievement badge art as base64 PNG data URIs.
 * GENERATED by scripts/render-badges.js — do not edit by hand. Re-run that
 * script if the badge SVGs in achievements.ts (or the medal frame) change.
 *
 * Each badge is the catalogue glyph minted into a medal (rim, lit disc,
 * sheen, shadow) and rasterised at ${SIZE}px, so the app shows the real art
 * with a plain <Image>, avoiding runtime react-native-svg (which crashed the
 * Achievements screen natively on device).
 */
export const BADGE_IMAGES: Record<number, string> = {
${rows.join('\n')}
};
`;

fs.writeFileSync(OUT, out, 'utf8');
console.log('wrote', OUT, '| approx base64 KB:', Math.round(total / 1024));
})();
