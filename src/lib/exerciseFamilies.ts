/**
 * Families — a way into the library that is neither a muscle nor a session
 * type: the kettlebell, the band, the straps, rehabilitation, the chair,
 * pregnancy, the weeks after birth, dance.
 *
 * A family is read from the exercise itself (its category, or its slug for the
 * entries that were in the library before families had a name), so nothing is
 * stored and nothing needs migrating. Pure: no database, no React.
 */

export type ExerciseFamily =
  | 'kettlebell'
  | 'band'
  | 'suspension'
  | 'rehab'
  | 'seniors'
  | 'prenatal'
  | 'postnatal'
  | 'dance';

export interface FamilyMeta {
  key: ExerciseFamily;
  label: string;
  icon: string;
  /** said once at the top of the list, for the families where it matters */
  caution?: string;
}

export const EXERCISE_FAMILIES: FamilyMeta[] = [
  { key: 'kettlebell', label: 'Kettlebell', icon: 'strength.kettlebell' },
  { key: 'band', label: 'Bands', icon: 'strength.band' },
  { key: 'suspension', label: 'Straps & rings', icon: 'strength.pull' },
  {
    key: 'rehab',
    label: 'Rehab',
    icon: 'mindbody.joint',
    caution:
      'These are the exercises physiotherapists commonly give. The app cannot examine you: an injury that is swollen, unstable, numb or not improving needs to be seen.',
  },
  {
    key: 'seniors',
    label: 'Seniors & chair',
    icon: 'mindbody.balance',
    caution:
      'Do standing balance work beside a counter or a sturdy chair. Stop for dizziness, chest pain or breathlessness that stops you talking.',
  },
  {
    key: 'prenatal',
    label: 'Pregnancy',
    icon: 'mindbody.breath',
    caution:
      'Agree your activity with your midwife or doctor. Stop and call them for bleeding, leaking fluid, dizziness, chest pain, calf pain or swelling, regular painful contractions, or if the baby moves less.',
  },
  {
    key: 'postnatal',
    label: 'After birth',
    icon: 'mindbody.breath',
    caution:
      'Start gently and build after your postnatal check, later after a caesarean. Leaking, heaviness in the pelvis, a doming abdomen, pain or heavier bleeding mean step back and ask.',
  },
  { key: 'dance', label: 'Dance', icon: 'sport.dance' },
];

/** in the library before families were named, and belonging to one all the same */
const BY_SLUG: Record<string, ExerciseFamily> = {
  'kettlebell-swing': 'kettlebell',
  'kettlebell-swing-cardio': 'kettlebell',
  'turkish-get-up': 'kettlebell',
  'goblet-squat': 'kettlebell',
  'spanish-squat': 'band',
  'monster-walk': 'band',
  'clamshell': 'band',
  'push-up-banded': 'band',
  'dead-bug-banded': 'band',
  'finger-extension-band': 'band',
  'swim-dryland-band-pull': 'band',
  'atomic-push-up': 'suspension',
  'chair-yoga': 'seniors',
  'chair-squat': 'seniors',
  'chair-tai-chi': 'seniors',
  'balance-training': 'seniors',
  'prenatal-yoga': 'prenatal',
  'pelvic-floor-kegels': 'postnatal',
  breaking: 'dance',
  barre: 'dance',
  'pole-aerial': 'dance',
};

const BY_CATEGORY: Record<string, ExerciseFamily> = {
  kettlebell: 'kettlebell',
  'resistance band': 'band',
  'suspension trainer': 'suspension',
  rehab: 'rehab',
  seniors: 'seniors',
  prenatal: 'prenatal',
  postnatal: 'postnatal',
  dance: 'dance',
};

export function familyOf(e: { slug?: string | null; category?: string | null }): ExerciseFamily | null {
  const slug = e.slug ?? '';
  const named = BY_CATEGORY[e.category ?? ''];
  if (named) return named;
  if (BY_SLUG[slug]) return BY_SLUG[slug];
  // "kb-dutch-combo-drill" is kickboxing: kb there stands for the sport, not the bell.
  if (/^kb-/.test(slug) && slug !== 'kb-dutch-combo-drill') return 'kettlebell';
  if (/^(band|banded)-/.test(slug)) return 'band';
  if (/^ring-/.test(slug)) return 'suspension';
  if (/^dance-/.test(slug)) return 'dance';
  return null;
}

export function findFamily(key: string | null | undefined): FamilyMeta | undefined {
  return EXERCISE_FAMILIES.find((f) => f.key === key);
}
