import type { SessionType } from '@/db/schema';

/**
 * The kinds of place a session can happen in.
 *
 * Every kind names what it is called here — in French, the way it is written
 * on the door — because that is the word people search for and say. `fits`
 * lists the session types the place suits, so the session screen can offer
 * the right places first.
 */

export type PlaceKind =
  | 'gym'
  | 'boxing_gym'
  | 'dojo'
  | 'calisthenics_park'
  | 'stadium'
  | 'pitch'
  | 'sports_hall'
  | 'court'
  | 'racket_club'
  | 'pool'
  | 'track'
  | 'climbing'
  | 'riding_club'
  | 'studio'
  | 'beach'
  | 'trail'
  | 'park'
  | 'home'
  | 'other';

export interface PlaceKindDef {
  key: PlaceKind;
  label: string;
  /** as it is written on the door */
  local: string;
  icon: string;
  color: string;
  fits: SessionType[];
  /** what to write in the notes, as a prompt */
  hint: string;
}

export const PLACE_KINDS: PlaceKindDef[] = [
  { key: 'gym', label: 'Gym', local: 'Salle de sport', icon: 'strength.barbell', color: '#6FA7F5', fits: ['strength', 'cardio', 'calisthenics'], hint: 'Racks, dumbbells up to what weight, opening hours, busy times.' },
  { key: 'boxing_gym', label: 'Boxing gym', local: 'Salle de boxe', icon: 'sport.boxing', color: '#E4596B', fits: ['martial_arts', 'cardio'], hint: 'Ring, bags, coached classes, sparring days.' },
  { key: 'dojo', label: 'Dojo or martial arts club', local: 'Dojo / club d’arts martiaux', icon: 'martial.belt', color: '#E4596B', fits: ['martial_arts'], hint: 'Style taught, mat days, gi or no-gi, beginners welcome.' },
  { key: 'calisthenics_park', label: 'Calisthenics park', local: 'Parc de street workout', icon: 'strength.pullup', color: '#9A8CFA', fits: ['calisthenics', 'outdoor'], hint: 'Bars, dip station, rings, shade, lighting at night.' },
  { key: 'stadium', label: 'Stadium', local: 'Stade', icon: 'sport.soccer', color: '#F0B45C', fits: ['sport', 'outdoor', 'cardio'], hint: 'Pitch surface, track around it, when it is open to the public.' },
  { key: 'pitch', label: 'Five-a-side pitch', local: 'Terrain de mini-foot', icon: 'sport.soccer', color: '#F0B45C', fits: ['sport'], hint: 'Price per hour, surface, booking, lights.' },
  { key: 'sports_hall', label: 'Sports hall', local: 'Salle omnisports', icon: 'sport.handball', color: '#F0B45C', fits: ['sport', 'martial_arts'], hint: 'Handball, basketball, volleyball; club training nights.' },
  { key: 'court', label: 'Outdoor court', local: 'Terrain de basket / hand', icon: 'sport.basketball', color: '#F0B45C', fits: ['sport'], hint: 'Hoops and goals in good state, surface, lights.' },
  { key: 'racket_club', label: 'Tennis or padel club', local: 'Club de tennis / padel', icon: 'sport.padel', color: '#F0B45C', fits: ['sport'], hint: 'Courts, price per hour, coaching, racket hire.' },
  { key: 'pool', label: 'Swimming pool', local: 'Piscine', icon: 'cardio.swimming', color: '#58C8F0', fits: ['cardio', 'sport', 'outdoor'], hint: 'Length (25 or 50 m), lane hours, entry price.' },
  { key: 'track', label: 'Running track', local: 'Piste d’athlétisme', icon: 'cardio.running', color: '#FF8663', fits: ['outdoor', 'cardio', 'sport'], hint: 'Surface, lanes, public hours.' },
  { key: 'climbing', label: 'Climbing wall or crag', local: 'Mur / site d’escalade', icon: 'cardio.elevation', color: '#45D9A0', fits: ['sport', 'outdoor'], hint: 'Bouldering or ropes, grades, gear hire, instruction.' },
  { key: 'riding_club', label: 'Riding club', local: 'Club hippique', icon: 'sport.horse', color: '#C69368', fits: ['sport', 'outdoor'], hint: 'Lessons, arena, trail rides, price per lesson.' },
  { key: 'studio', label: 'Yoga or Pilates studio', local: 'Studio de yoga / Pilates', icon: 'mindbody.yoga', color: '#6FD4E4', fits: ['mindbody', 'meditation'], hint: 'Class timetable, styles, mats provided.' },
  { key: 'beach', label: 'Beach', local: 'Plage', icon: 'sport.surf', color: '#58C8F0', fits: ['outdoor', 'sport', 'cardio'], hint: 'Sand firmness for running, swimming conditions, crowds.' },
  { key: 'trail', label: 'Trail or route', local: 'Sentier / parcours', icon: 'cardio.hiking', color: '#45D9A0', fits: ['outdoor'], hint: 'Distance, climb, shade, water points.' },
  { key: 'park', label: 'Park', local: 'Parc / jardin public', icon: 'cardio.walk', color: '#45D9A0', fits: ['outdoor', 'calisthenics', 'mindbody'], hint: 'Loop length, surface, opening hours.' },
  { key: 'home', label: 'Home', local: 'À la maison', icon: 'strength.dumbbell', color: '#8FA0B5', fits: ['strength', 'calisthenics', 'mindbody', 'meditation', 'cardio'], hint: 'What equipment you keep here.' },
  { key: 'other', label: 'Somewhere else', local: 'Autre', icon: 'core.custom', color: '#8FA0B5', fits: [], hint: 'What it is, and what it is good for.' },
];

export const findPlaceKind = (key: string | null | undefined): PlaceKindDef =>
  PLACE_KINDS.find((k) => k.key === key) ?? PLACE_KINDS[PLACE_KINDS.length - 1];

export const PLACE_ACCESS = [
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Pay per visit' },
  { value: 'members', label: 'Members' },
] as const;
export type PlaceAccess = (typeof PLACE_ACCESS)[number]['value'];
