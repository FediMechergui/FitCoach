import { EXERCISE_LIBRARY } from '../src/data/exercises';
import { SPECIAL_PROGRAMS } from '../src/data/specialPrograms';
const slugs = new Set(EXERCISE_LIBRARY.map((e) => e.slug));
const bad: string[] = [];
for (const p of SPECIAL_PROGRAMS) for (const d of p.days) for (const s of d.exercises) if (!slugs.has(s)) bad.push(`${p.key}/${d.key}: ${s}`);
console.log(bad.length ? bad.join('\n') : 'ALL SLUGS OK');
console.log('programmes:', SPECIAL_PROGRAMS.length, '| athlete:', SPECIAL_PROGRAMS.filter((p) => p.category === 'athlete').length);
