import type { SessionType } from '@/db/schema';
import { SESSION_TYPE_COLORS } from '@/theme';
import { sessionTypeIcon } from './icon-map';

export interface SessionTypeMeta {
  type: SessionType;
  label: string;
  icon: string;
  color: string;
  blurb: string;
  /** which live-tracking flow this type uses on check-in */
  flow: 'lifting' | 'cardio' | 'mindbody';
}

export const SESSION_TYPE_META: SessionTypeMeta[] = [
  {
    type: 'strength',
    label: 'Strength',
    icon: sessionTypeIcon('strength'),
    color: SESSION_TYPE_COLORS.strength,
    blurb: 'Sets, reps, weight, RPE',
    flow: 'lifting',
  },
  {
    type: 'calisthenics',
    label: 'Calisthenics',
    icon: sessionTypeIcon('calisthenics'),
    color: SESSION_TYPE_COLORS.calisthenics,
    blurb: 'Bodyweight sets & progressions',
    flow: 'lifting',
  },
  {
    type: 'cardio',
    label: 'Cardio',
    icon: sessionTypeIcon('cardio'),
    color: SESSION_TYPE_COLORS.cardio,
    blurb: 'Treadmill, bike, rower, elliptical',
    flow: 'cardio',
  },
  {
    type: 'outdoor',
    label: 'Outdoor',
    icon: sessionTypeIcon('outdoor'),
    color: SESSION_TYPE_COLORS.outdoor,
    blurb: 'Run, cycle, swim, hike',
    flow: 'cardio',
  },
  {
    type: 'sport',
    label: 'Sport',
    icon: sessionTypeIcon('sport'),
    color: SESSION_TYPE_COLORS.sport,
    blurb: 'Tennis, soccer, basketball…',
    flow: 'cardio',
  },
  {
    type: 'mindbody',
    label: 'Mind-Body',
    icon: sessionTypeIcon('mindbody'),
    color: SESSION_TYPE_COLORS.mindbody,
    blurb: 'Yoga, Pilates, mobility',
    flow: 'mindbody',
  },
  {
    type: 'meditation',
    label: 'Meditation',
    icon: sessionTypeIcon('meditation'),
    color: SESSION_TYPE_COLORS.meditation,
    blurb: 'Breathwork, guided, body scan',
    flow: 'mindbody',
  },
  {
    type: 'custom',
    label: 'Custom',
    icon: 'core.custom',
    color: SESSION_TYPE_COLORS.custom,
    blurb: 'Anything else',
    flow: 'cardio',
  },
];

export function metaFor(type: SessionType): SessionTypeMeta {
  return SESSION_TYPE_META.find((m) => m.type === type) ?? SESSION_TYPE_META[0];
}

export const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😄'];
export const MOOD_LABELS = ['Rough', 'Meh', 'Okay', 'Good', 'Great'];
