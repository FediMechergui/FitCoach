const fs = require('fs');

const SRC = 'C:/Users/fedim/Downloads/achivements.md';
const OUT = 'C:/Users/fedim/OneDrive/Bureau/FitCoach/src/data/achievements.ts';

const CATEGORIES = [
  'Consistency & Streaks',
  'Strength & Muscle Growth',
  'Movement & Endurance',
  'Honest Nutrition & Hydration',
  'Tunisian & Mediterranean Heritage',
  'Smoking Cessation & Health Recovery',
  'Mind, Sleep & Work Balance',
  'Mindful Alcohol Moderation',
  'Faith & Fasting',
  'Micronutrients & Supplement Stacks',
];

let raw = fs.readFileSync(SRC, 'utf8');

// The markdown wraps everything in ``` fences and sometimes prefixes headings
// with "# `". Normalise: drop fence lines and unwrap backtick-wrapped headings.
const lines = raw.split(/\r?\n/);
const clean = [];
for (let line of lines) {
  const t = line.trim();
  if (t === '```' || t === '```xml' || t === '````xml`' || t === '````xml`' || t === '# ````xml`') continue;
  // "# `### 6. Unbreakable`"  -> "### 6. Unbreakable"
  let m = t.match(/^#?\s*`(#{2,4}\s+.+?)`?$/);
  if (m) { clean.push(m[1].replace(/`$/, '')); continue; }
  clean.push(line);
}
const text = clean.join('\n');

// Find every "### N. Name" heading, then slice the body up to the next heading
// (## or ###). Only keep sections that carry an <svg> (the detail sections).
const headingRe = /^#{3}\s+(\d+)\.\s+(.+?)\s*$/gm;
const heads = [];
let hm;
while ((hm = headingRe.exec(text)) !== null) {
  heads.push({ id: Number(hm[1]), name: hm[2].trim(), start: hm.index, end: hm.index + hm[0].length });
}

const byId = new Map();
for (let i = 0; i < heads.length; i++) {
  const h = heads[i];
  const bodyEnd = i + 1 < heads.length ? heads[i + 1].start : text.length;
  const body = text.slice(h.end, bodyEnd);
  const svgMatch = body.match(/<svg[\s\S]*?<\/svg>/i);
  if (!svgMatch) continue; // directory entries have no svg
  const svg = svgMatch[0].replace(/\s+/g, ' ').trim();
  const critMatch = body.match(/\*\*Criteria:\*\*\s*([\s\S]*?)(?=\n\s*<svg|\n\s*```|$)/);
  const criteria = critMatch ? critMatch[1].replace(/\s+/g, ' ').trim() : '';
  byId.set(h.id, { id: h.id, name: h.name, criteria, svg });
}

const items = [...byId.values()].sort((a, b) => a.id - b.id);
console.log('extracted', items.length, 'achievements with SVGs');
const missing = [];
for (let i = 1; i <= 100; i++) if (!byId.has(i)) missing.push(i);
console.log('missing ids:', missing.join(',') || 'none');
console.log('missing criteria:', items.filter((x) => !x.criteria).map((x) => x.id).join(',') || 'none');

const header = `/**
 * Achievement badge catalogue — 100 badges across 10 categories (10 each).
 * Each badge carries a raw inline SVG (rendered via react-native-svg SvgXml).
 * Generated from the achievements directory; edit the source markdown + re-run
 * scripts/extract-achievements.js if the catalogue changes.
 *
 * \`category\` is 1-based (id → Math.ceil(id / 10)). See ACHIEVEMENT_CATEGORIES.
 */
export interface AchievementDef {
  id: number;
  category: number;
  name: string;
  criteria: string;
  svg: string;
}

export const ACHIEVEMENT_CATEGORIES: string[] = ${JSON.stringify(CATEGORIES, null, 2)};

export const ACHIEVEMENTS: AchievementDef[] = [
`;

const rows = items
  .map(
    (a) =>
      `  { id: ${a.id}, category: ${Math.ceil(a.id / 10)}, name: ${JSON.stringify(a.name)}, criteria: ${JSON.stringify(a.criteria)}, svg: ${JSON.stringify(a.svg)} },`
  )
  .join('\n');

const footer = `
];

export function achievementsInCategory(cat: number): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => a.category === cat);
}
`;

fs.writeFileSync(OUT, header + rows + footer, 'utf8');
console.log('wrote', OUT);
