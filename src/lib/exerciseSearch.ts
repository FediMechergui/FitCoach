const aliases: Record<string, string> = {
  'pompes': 'push up', 'pompe': 'push up', 'tractions': 'pull up', 'traction': 'pull up',
  'developpe couche': 'bench press', 'souleve de terre': 'deadlift', 'fentes': 'lunge',
  'gainage': 'plank', 'tirage': 'row', 'poulie': 'cable', 'halteres': 'dumbbell',
  'course': 'run', 'marche': 'walk', 'velo': 'cycling',
  'ضغط': 'push up', 'عقلة': 'pull up', 'قرفصاء': 'squat', 'جري': 'run', 'مشي': 'walk',
};
export function searchText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
}
export function exerciseMatches(query: string, fields: Array<string | null | undefined>): boolean {
  const normalized = searchText(query);
  const translated = aliases[normalized] ?? normalized;
  const haystack = searchText(fields.filter(Boolean).join(' '));
  return translated.split(' ').every(token => haystack.includes(token));
}
