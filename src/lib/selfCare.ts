/**
 * Daily self-care / hygiene check-ins — the small stabilising habits that keep
 * a routine sustainable: brushing teeth, showering, and taking real relax time.
 * Purely a daily checklist; no scoring beyond "done / target".
 */
export interface SelfCareItem {
  key: string;
  label: string;
  icon: string;
  /** theme color token name */
  color: string;
  /** how many times a day is the goal */
  target: number;
  hint: string;
}

export const SELF_CARE_ITEMS: SelfCareItem[] = [
  { key: 'brush', label: 'Brush teeth', icon: 'care.brush', color: 'info', target: 3, hint: 'Morning, midday & night' },
  { key: 'shower', label: 'Shower', icon: 'care.shower', color: 'water', target: 1, hint: 'Once a day' },
  { key: 'relax', label: 'Relax time', icon: 'care.relax', color: 'mindbody', target: 1, hint: 'Unwind & decompress' },
];

export function selfCareItem(key: string): SelfCareItem | undefined {
  return SELF_CARE_ITEMS.find((i) => i.key === key);
}
