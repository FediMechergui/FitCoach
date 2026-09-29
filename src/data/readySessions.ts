import type { SessionType } from '@/db/schema';
import type { ProgramLevel } from './programs';

/**
 * READY SESSIONS — one session, already written, one tap from training.
 *
 * A split answers "which muscles today", a programme answers "what does the
 * week look like", a path answers "what am I becoming". A ready session answers
 * the smallest question of all: "I have forty minutes, what do I do?". Every
 * push-up for every muscle; the best three for the chest; a first pull-up; ten
 * minutes in a hotel room.
 *
 * Each one is a single session, never a plan. Nothing is locked: the exercises
 * are pre-loaded and everything can be added, removed or swapped once inside.
 *
 * "Best three" is a choice, stated as one: three exercises that between them
 * reach every part of the muscle, the first a heavy compound, the last the one
 * that isolates. It is a good answer, not the only one.
 *
 * ⚠️ `key` is a stable identifier (a session is tagged `ready:<key>` in its
 * `style` column, so "done 4 times" keeps counting). Never change or reuse one;
 * adding is always safe. Every `exercises` slug must exist in the library.
 */

export type ReadyGroup =
  | 'pushups'
  | 'best-gym'
  | 'best-home'
  | 'whole'
  | 'bar'
  | 'skills'
  | 'care'
  | 'short'
  | 'combat'
  | 'cardio'
  | 'calm';

export const READY_GROUP_ORDER: ReadyGroup[] = [
  'pushups', 'best-gym', 'best-home', 'whole', 'bar', 'skills', 'care', 'short', 'combat', 'cardio', 'calm',
];

export const READY_GROUP_META: Record<ReadyGroup, { label: string; short: string; blurb: string; icon: string }> = {
  pushups: {
    label: 'Push-ups',
    short: 'Push-ups',
    blurb: 'One movement, aimed at a different muscle each time by where the hands and feet go.',
    icon: 'strength.calisthenics',
  },
  'best-gym': {
    label: 'Best three · in the gym',
    short: 'Best 3 · gym',
    blurb: 'Three exercises per muscle that between them reach all of it. Bars, dumbbells, cables, machines.',
    icon: 'sport.gym',
  },
  'best-home': {
    label: 'Best three · no kit',
    short: 'Best 3 · no kit',
    blurb: 'The same idea with the body as the weight. A bar to hang from helps for the back and the arms.',
    icon: 'stats.muscleMap',
  },
  whole: {
    label: 'Whole muscle & whole body',
    short: 'Whole body',
    blurb: 'Every head of the shoulder, every region of the back, or one exercise for each muscle in a single session.',
    icon: 'stats.muscleMap',
  },
  bar: {
    label: 'Bars, squats & planks',
    short: 'Bars & floor',
    blurb: 'Every grip of the pull-up, every kind of dip, squat, lunge and plank.',
    icon: 'strength.calisthenics',
  },
  skills: {
    label: 'Skills',
    short: 'Skills',
    blurb: 'One skill per session, from its first drill to the move itself. Stop at the step you can hold cleanly.',
    icon: 'core.target',
  },
  care: {
    label: 'Joints & posture',
    short: 'Joints',
    blurb: 'Small work that keeps the big work possible. None of it replaces a physiotherapist for a joint that hurts.',
    icon: 'mindbody.focus',
  },
  short: {
    label: 'Short & anywhere',
    short: 'Short',
    blurb: 'Ten to twenty minutes, a floor and sometimes a chair.',
    icon: 'core.timer',
  },
  combat: {
    label: 'Combat',
    short: 'Combat',
    blurb: 'One subject per session: the six punches, the defence, the kicks, the ground. Solo unless it says otherwise.',
    icon: 'mindbody.samurai',
  },
  cardio: {
    label: 'Conditioning',
    short: 'Conditioning',
    blurb: 'Rope, jumps, carries and sprints, written as sessions rather than left as a list.',
    icon: 'cardio.elevation',
  },
  calm: {
    label: 'Mobility, yoga & calm',
    short: 'Calm',
    blurb: 'Poses by family, the mat classics of Pilates, the breath, and the long stretch.',
    icon: 'mindbody.morning',
  },
};

export interface ReadySession {
  key: string;
  group: ReadyGroup;
  name: string;
  /** what this session is for, in one line */
  why: string;
  sessionType: SessionType;
  level: ProgramLevel;
  minutes: number;
  /** what you need to have at hand, in plain words */
  kit: string;
  /** sets, reps, rest, in plain words */
  prescription: string;
  /** exercise slugs, in the order they should be performed */
  exercises: string[];
  /** what each exercise is there for, in the same order, when the order is the lesson */
  targets?: string[];
  /** said once, plainly, for the ones that can hurt */
  note?: string;
}

const BEST_GYM_RX = '3 to 4 sets each. The first is the heavy one, 5 to 8 reps. The other two, 10 to 15. Rest 2 minutes, then 90 s, then 60 s.';
const BEST_HOME_RX = '3 to 4 sets each, stopping 2 reps short of failure. When 12 clean reps come easily, slow the lowering to 3 seconds or move to a harder version.';

export const READY_SESSIONS: ReadySession[] = [
  // ══════════════════════════ PUSH-UPS ══════════════════════════
  {
    key: 'pushups-every-muscle', group: 'pushups', name: 'Push-ups for every muscle',
    why: 'Nine push-ups, nine targets: the whole front of the body, the arms, and the upper back that holds it all.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 40, kit: 'A floor, and a chair or step for the feet and the hands',
    prescription: '2 sets each, 2 reps short of failure, 60 s rest. Move on when the form goes, not when the number is reached.',
    exercises: ['decline-push-up', 'push-up-wide', 'push-up-hands-elevated-low', 'diamond-push-up', 'pike-push-up', 'push-up-plus', 't-push-up', 'knuckle-push-up', 'reverse-push-up-elbow-press'],
    targets: ['Upper chest', 'Middle chest', 'Lower chest', 'Triceps', 'Shoulders', 'Serratus', 'Obliques', 'Forearms and wrists', 'Upper back'],
  },
  {
    key: 'pushups-grand-tour', group: 'pushups', name: 'The grand tour',
    why: 'Two push-ups for every target. Long, and meant to be: this is the whole catalogue in one sitting.',
    sessionType: 'calisthenics', level: 'advanced', minutes: 60, kit: 'A floor, a chair, a low step',
    prescription: '2 sets each, 8 to 12 reps, 60 s rest. Take 2 minutes between targets.',
    exercises: ['push-up-feet-elevated-high', 'decline-push-up', 'deficit-push-up', 'push-up-wide-pause', 'push-up-hands-elevated-low', 'incline-pushup', 'diamond-push-up', 'sphinx-push-up', 'pike-push-up', 'hindu-push-up', 'spiderman-push-up', 'push-up-shoulder-tap', 'knuckle-push-up', 'reverse-push-up-elbow-press'],
    targets: ['Upper chest', 'Upper chest', 'Middle chest', 'Middle chest', 'Lower chest', 'Lower chest', 'Triceps', 'Triceps', 'Shoulders', 'Shoulders', 'Core', 'Core', 'Forearms', 'Upper back'],
  },
  {
    key: 'pushups-first', group: 'pushups', name: 'Your first push-up',
    why: 'From the wall to the floor, one height at a time. The lowering is where the strength is built.',
    sessionType: 'calisthenics', level: 'beginner', minutes: 20, kit: 'A wall, a kitchen counter, a sturdy box or chair',
    prescription: '3 sets of 8 at the hardest height you can do cleanly, then 3 slow lowerings of 5 seconds, then the plank.',
    exercises: ['wall-push-up', 'push-up-counter-incline', 'box-push-up', 'knee-push-up', 'negative-push-up', 'plank'],
  },
  {
    key: 'pushups-chest-angles', group: 'pushups', name: 'Chest, three angles',
    why: 'Feet high for the upper chest, hands wide and deep for the middle, hands high for the lower.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 30, kit: 'A chair for the feet, two books or handles, a low step',
    prescription: '3 sets each, 8 to 15 reps, 75 s rest.',
    exercises: ['push-up-feet-elevated-high', 'deficit-push-up', 'push-up-wide-pause', 'push-up-hands-elevated-low'],
    targets: ['Upper chest', 'Middle chest, deep stretch', 'Middle chest, paused', 'Lower chest'],
  },
  {
    key: 'pushups-triceps', group: 'pushups', name: 'Triceps push-ups',
    why: 'Hands close and elbows brushing the ribs: the push-up becomes an arm exercise.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 25, kit: 'A floor',
    prescription: '3 sets each, 6 to 12 reps, 75 s rest. On the knees is a fair start for the diamond.',
    exercises: ['diamond-push-up', 'close-grip-push-up', 'military-push-up', 'sphinx-push-up'],
    note: 'The sphinx push-up loads the elbow hard. Start it from the knees and stop at any sharp pain.',
  },
  {
    key: 'pushups-shoulders', group: 'pushups', name: 'Shoulder push-ups',
    why: 'Hips high, head between the hands: the closest a push-up comes to pressing overhead.',
    sessionType: 'calisthenics', level: 'advanced', minutes: 30, kit: 'A floor, a chair for the feet',
    prescription: '3 sets each, 5 to 10 reps, 90 s rest.',
    exercises: ['pike-push-up', 'elevated-pike-push-up', 'hindu-push-up', 'pseudo-planche-pushup'],
  },
  {
    key: 'pushups-core', group: 'pushups', name: 'Push-ups that train the core',
    why: 'Take away a hand or a foot and the trunk has to stop the body from turning.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 30, kit: 'A floor',
    prescription: '3 sets each, 6 to 10 reps a side, 60 s rest. The hips stay level: that is the exercise.',
    exercises: ['t-push-up', 'push-up-shoulder-tap', 'spiderman-push-up', 'cross-body-knee-push-up', 'single-leg-push-up', 'walkout-push-up'],
  },
  {
    key: 'pushups-power', group: 'pushups', name: 'Explosive push-ups',
    why: 'Speed, not fatigue. Every rep leaves the floor or it does not count.',
    sessionType: 'calisthenics', level: 'advanced', minutes: 25, kit: 'A floor that forgives, two low steps',
    prescription: '4 sets of 3 to 5 reps, 2 minutes rest. Stop the set the moment a rep is slow.',
    exercises: ['push-up-explosive', 'staggered-plyo-push-up', 'depth-push-up', 'superman-push-up'],
    note: 'Land with soft elbows, never locked. Not for sore wrists or shoulders.',
  },
  {
    key: 'pushups-one-arm', group: 'pushups', name: 'Road to the one-arm push-up',
    why: 'Move the weight onto one arm a little at a time: archer, uneven, lever, incline, then the slow lowering.',
    sessionType: 'calisthenics', level: 'advanced', minutes: 35, kit: 'A floor, a ball or a book, a bench',
    prescription: '3 sets each, 3 to 6 reps a side, 2 minutes rest. Stay on a step until it gives 3 sets of 6.',
    exercises: ['archer-push-up', 'uneven-push-up', 'lever-push-up', 'one-arm-push-up-incline', 'one-arm-push-up-negative'],
  },
  {
    key: 'pushups-slow-strength', group: 'pushups', name: 'Slow push-ups',
    why: 'The same push-up made heavy by time: four seconds down, a pause at the bottom, a rep and a half.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 30, kit: 'A floor, a band if you have one',
    prescription: '3 sets each, 5 to 8 reps, 90 s rest.',
    exercises: ['push-up-tempo-eccentric', 'push-up-pause-bottom', 'push-up-one-and-a-half', 'push-up-banded'],
  },
  {
    key: 'pushups-hundred', group: 'pushups', name: 'A hundred push-ups',
    why: 'Twenty-five of each, in as few sets as it takes. Write down how many sets: that is the number to beat.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 20, kit: 'A floor, a step',
    prescription: '25 reps of each in as few sets as possible. Rest as long as the set needs, and no longer.',
    exercises: ['push-up', 'push-up-wide', 'close-grip-push-up', 'incline-pushup'],
  },
  {
    key: 'pushups-wrists', group: 'pushups', name: 'Push-ups for wrists and forearms',
    why: 'The fighters version: on the knuckles, on the fingertips, on the backs of the hands.',
    sessionType: 'calisthenics', level: 'advanced', minutes: 20, kit: 'A mat or a folded towel',
    prescription: 'Wrist rocks first, 2 minutes. Then 3 sets each of 5 to 8 reps, from the knees until they are easy.',
    exercises: ['quadruped-wrist-rocks', 'knuckle-push-up', 'fingertip-push-up', 'wrist-push-up'],
    note: 'Always from the knees at first, on something soft. Stop at any pain in the wrist or the fingers.',
  },

  // ══════════════════════════ BEST THREE · GYM ══════════════════════════
  {
    key: 'best-gym-chest', group: 'best-gym', name: 'Chest',
    why: 'A heavy flat press, an incline for the upper chest, a crossover for the lower fibres and the squeeze.',
    sessionType: 'strength', level: 'intermediate', minutes: 35, kit: 'Barbell and bench, dumbbells, cables',
    prescription: BEST_GYM_RX,
    exercises: ['bench-press-barbell', 'db-incline-press', 'cable-crossover'],
    targets: ['Middle chest', 'Upper chest', 'Lower chest'],
  },
  {
    key: 'best-gym-back', group: 'best-gym', name: 'Back',
    why: 'A row for thickness, a pulldown for width, an extension for the lower back.',
    sessionType: 'strength', level: 'intermediate', minutes: 35, kit: 'Barbell, a pulldown station, a back extension bench',
    prescription: BEST_GYM_RX,
    exercises: ['barbell-row', 'lat-pulldown', 'back-extension'],
    targets: ['Mid-back', 'Lats', 'Lower back'],
  },
  {
    key: 'best-gym-shoulders', group: 'best-gym', name: 'Shoulders',
    why: 'One exercise per head: a press for the front, a raise for the side, a face pull for the rear.',
    sessionType: 'strength', level: 'intermediate', minutes: 30, kit: 'Barbell, dumbbells, a cable with a rope',
    prescription: BEST_GYM_RX,
    exercises: ['overhead-press', 'lateral-raise', 'face-pull'],
    targets: ['Front delt', 'Side delt', 'Rear delt'],
  },
  {
    key: 'best-gym-biceps', group: 'best-gym', name: 'Biceps',
    why: 'The long head stretched on the incline, the short head on the preacher, the brachialis under a hammer grip.',
    sessionType: 'strength', level: 'beginner', minutes: 25, kit: 'Dumbbells, an incline bench, a preacher pad',
    prescription: '3 sets each, 8 to 12 reps, 75 s rest. Lower for 3 seconds.',
    exercises: ['incline-db-curl', 'preacher-db-curl', 'hammer-curl'],
    targets: ['Long head', 'Short head', 'Brachialis'],
  },
  {
    key: 'best-gym-triceps', group: 'best-gym', name: 'Triceps',
    why: 'A close-grip press for load, an overhead extension for the long head, a rope pushdown for the lateral head.',
    sessionType: 'strength', level: 'intermediate', minutes: 30, kit: 'Barbell and bench, a cable with a rope',
    prescription: BEST_GYM_RX,
    exercises: ['bench-press-close-grip', 'overhead-cable-extension', 'rope-pushdown'],
    targets: ['All three heads', 'Long head', 'Lateral head'],
  },
  {
    key: 'best-gym-quads', group: 'best-gym', name: 'Quads',
    why: 'The squat, one leg at a time after it, then the extension for the one quad muscle squats reach least.',
    sessionType: 'strength', level: 'intermediate', minutes: 40, kit: 'Barbell and rack, dumbbells, a leg extension machine',
    prescription: BEST_GYM_RX,
    exercises: ['back-squat', 'bulgarian-split-squat', 'leg-extension'],
    targets: ['Vastus', 'Vastus, one leg', 'Rectus femoris'],
  },
  {
    key: 'best-gym-hamstrings', group: 'best-gym', name: 'Hamstrings',
    why: 'They cross two joints, so they need both jobs: a hinge at the hip and a curl at the knee.',
    sessionType: 'strength', level: 'intermediate', minutes: 35, kit: 'Barbell, a leg curl machine, something to anchor the feet',
    prescription: '3 sets each. Deadlift 6 to 10, curl 10 to 15, Nordic lowering 3 to 5 slow reps.',
    exercises: ['romanian-deadlift', 'seated-leg-curl', 'nordic-negative'],
    targets: ['Hip hinge', 'Knee curl', 'Lengthening strength'],
  },
  {
    key: 'best-gym-glutes', group: 'best-gym', name: 'Glutes',
    why: 'A thrust for the squeeze, a lunge for the stretch, an abduction for the side of the hip.',
    sessionType: 'strength', level: 'intermediate', minutes: 35, kit: 'Barbell and bench, dumbbells, an abduction machine or a band',
    prescription: BEST_GYM_RX,
    exercises: ['barbell-hip-thrust', 'db-reverse-lunge', 'hip-abduction-machine'],
    targets: ['Gluteus maximus, shortened', 'Gluteus maximus, stretched', 'Gluteus medius'],
  },
  {
    key: 'best-gym-calves', group: 'best-gym', name: 'Calves & shins',
    why: 'Straight knee for the gastrocnemius, bent knee for the soleus, and the shin muscle nobody trains.',
    sessionType: 'strength', level: 'beginner', minutes: 20, kit: 'Standing and seated calf machines, a wall',
    prescription: '4 sets each, 10 to 15 reps, a full second stretched at the bottom of every rep.',
    exercises: ['standing-calf-machine', 'seated-calf-machine', 'tibialis-raise'],
    targets: ['Gastrocnemius', 'Soleus', 'Tibialis, front of the shin'],
  },
  {
    key: 'best-gym-core', group: 'best-gym', name: 'Core',
    why: 'Bend from the top, lift from the bottom, turn from the side.',
    sessionType: 'strength', level: 'intermediate', minutes: 25, kit: 'A cable with a rope, a pull-up bar',
    prescription: '3 sets each, 10 to 15 reps, 60 s rest.',
    exercises: ['cable-crunch', 'hanging-leg-raise', 'cable-woodchopper'],
    targets: ['Upper abs', 'Lower abs', 'Obliques'],
  },
  {
    key: 'best-gym-forearms', group: 'best-gym', name: 'Forearms & grip',
    why: 'Curl the wrist, extend the wrist, then hold something heavy and walk.',
    sessionType: 'strength', level: 'beginner', minutes: 20, kit: 'A barbell, two heavy dumbbells',
    prescription: '3 sets each. Curls 12 to 20 reps. The carry, 30 to 40 m.',
    exercises: ['barbell-wrist-curl', 'barbell-reverse-wrist-curl', 'farmers-carry'],
    targets: ['Wrist flexors', 'Wrist extensors', 'Grip'],
  },
  {
    key: 'best-gym-neck', group: 'best-gym', name: 'Neck',
    why: 'Front, back and sides, with a plate so light it feels like nothing.',
    sessionType: 'strength', level: 'intermediate', minutes: 15, kit: 'A light plate and a towel, a flat bench',
    prescription: '2 sets each, 15 to 20 slow reps. Begin with 2.5 kg or less.',
    exercises: ['supine-neck-flexion-plate', 'prone-neck-extension-plate', 'plate-lateral-neck-flexion'],
    targets: ['Flexors', 'Extensors', 'Side flexors'],
    note: 'Slow and light, never to failure, never jerked. Stop at any tingling in the arms or any dizziness.',
  },

  // ══════════════════════════ BEST THREE · NO KIT ══════════════════════════
  {
    key: 'best-home-chest', group: 'best-home', name: 'Chest',
    why: 'Feet up for the upper chest, flat for the middle, the dip for the lower.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 30, kit: 'A chair, two sturdy chairs or parallel bars',
    prescription: BEST_HOME_RX,
    exercises: ['decline-push-up', 'push-up', 'dip'],
    targets: ['Upper chest', 'Middle chest', 'Lower chest'],
  },
  {
    key: 'best-home-back', group: 'best-home', name: 'Back',
    why: 'Pull up for the lats, pull in for the mid-back, lift off the floor for the lower back.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 30, kit: 'A bar to hang from, a low bar or a sturdy table',
    prescription: BEST_HOME_RX,
    exercises: ['pull-up', 'inverted-row', 'superman-hold'],
    targets: ['Lats', 'Mid-back', 'Lower back'],
  },
  {
    key: 'best-home-shoulders', group: 'best-home', name: 'Shoulders',
    why: 'A pike push-up to press, a wall handstand to hold, a prone raise for the rear of the shoulder.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 30, kit: 'A floor and a wall',
    prescription: '3 sets each. Pike push-ups 6 to 10. Handstand 20 to 40 s. Raises 12 to 15, slow.',
    exercises: ['pike-push-up', 'wall-handstand', 'prone-w-raise'],
    targets: ['Front delt', 'Front and side delt, held', 'Rear delt'],
  },
  {
    key: 'best-home-biceps', group: 'best-home', name: 'Biceps',
    why: 'The chin-up is the heaviest curl there is. Then a curl on rings or a towel, then a hold.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 25, kit: 'A bar, rings or a strong towel over it',
    prescription: '3 sets each. Chin-ups 5 to 10. Curls 8 to 12. Hold at 90 degrees for 20 to 30 s.',
    exercises: ['chin-up-supinated', 'ring-bicep-curl', 'isometric-curl-hold'],
  },
  {
    key: 'best-home-triceps', group: 'best-home', name: 'Triceps',
    why: 'Diamond push-ups, dips off a bench, and the bodyweight skullcrusher for the long head.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 25, kit: 'A floor, a bench or a chair, a low bar or table edge',
    prescription: BEST_HOME_RX,
    exercises: ['diamond-push-up', 'bench-dip', 'bodyweight-skullcrusher'],
  },
  {
    key: 'best-home-quads', group: 'best-home', name: 'Quads',
    why: 'A split squat taken deep, a step-down on one leg, and the wall sit to finish.',
    sessionType: 'calisthenics', level: 'beginner', minutes: 25, kit: 'A step or the bottom stair, a wall',
    prescription: '3 sets each. Split squats and step-downs 8 to 12 a leg. Wall sit 30 to 60 s.',
    exercises: ['atg-split-squat', 'step-down', 'wall-sit'],
  },
  {
    key: 'best-home-hamstrings', group: 'best-home', name: 'Hamstrings',
    why: 'A hinge on one leg, a curl on sliders or socks, and the slow Nordic lowering.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 25, kit: 'A smooth floor and socks, something to hold the feet down',
    prescription: '3 sets each. Hinge 8 to 10 a leg. Curl 8 to 12. Nordic lowering 3 to 5 reps of 5 seconds.',
    exercises: ['single-leg-rdl', 'slider-leg-curl', 'nordic-negative'],
    targets: ['Hip hinge', 'Knee curl', 'Lengthening strength'],
  },
  {
    key: 'best-home-glutes', group: 'best-home', name: 'Glutes',
    why: 'A thrust on one leg, a lunge that crosses behind, and the fire hydrant for the side of the hip.',
    sessionType: 'calisthenics', level: 'beginner', minutes: 25, kit: 'A sofa or a bench',
    prescription: '3 sets each, 10 to 15 reps a side, a full second squeezed at the top.',
    exercises: ['single-leg-hip-thrust', 'curtsy-lunge', 'fire-hydrant'],
  },
  {
    key: 'best-home-calves', group: 'best-home', name: 'Calves & shins',
    why: 'One leg on a step, the knee bent for the soleus, the heels down for the shin.',
    sessionType: 'calisthenics', level: 'beginner', minutes: 15, kit: 'A step, a wall',
    prescription: '3 sets each, 12 to 20 reps, a full second stretched at the bottom.',
    exercises: ['single-leg-calf-raise', 'bent-knee-calf-raise', 'tibialis-raise'],
    targets: ['Gastrocnemius', 'Soleus', 'Tibialis, front of the shin'],
  },
  {
    key: 'best-home-core', group: 'best-home', name: 'Core',
    why: 'Hold the hollow shape, raise the legs, hold the side.',
    sessionType: 'calisthenics', level: 'beginner', minutes: 20, kit: 'A floor',
    prescription: '3 rounds. Hollow hold 20 to 40 s. Leg raises 8 to 12. Side plank 20 to 40 s a side.',
    exercises: ['hollow-body-hold', 'lying-leg-raise', 'side-plank'],
    targets: ['Upper abs', 'Lower abs', 'Obliques'],
  },
  {
    key: 'best-home-forearms', group: 'best-home', name: 'Forearms & grip',
    why: 'Hang from the bar, hang from a towel, then push up on the knuckles.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 15, kit: 'A bar and a towel',
    prescription: '3 sets each. Hangs to 5 seconds before the grip gives. Push-ups 8 to 12.',
    exercises: ['dead-hang', 'towel-pull-up-hang', 'knuckle-push-up'],
  },
  {
    key: 'best-home-neck', group: 'best-home', name: 'Neck',
    why: 'Pushing against your own hand: strength with nothing moving, which is the safe way to start.',
    sessionType: 'calisthenics', level: 'beginner', minutes: 10, kit: 'Nothing',
    prescription: '3 rounds. Each hold 10 s at about half effort, in every direction.',
    exercises: ['chin-tuck-hold', 'isometric-neck-4-way', 'neck-rotation-isometric'],
    note: 'Half effort is enough. Stop at any tingling in the arms or any dizziness.',
  },

  // ══════════════════════════ WHOLE MUSCLE & WHOLE BODY ══════════════════════════
  {
    key: 'whole-full-body-gym', group: 'whole', name: 'One for each muscle · gym',
    why: 'The single best exercise for each muscle, legs first. A whole body in one session.',
    sessionType: 'strength', level: 'intermediate', minutes: 70, kit: 'A full gym',
    prescription: '3 sets each. The four big lifts 5 to 8 reps, 2 minutes rest. The rest 10 to 12, 60 s rest.',
    exercises: ['back-squat', 'bench-press-barbell', 'barbell-row', 'overhead-press', 'romanian-deadlift', 'barbell-curl', 'triceps-pushdown', 'standing-calf-machine', 'cable-crunch'],
    targets: ['Quads and glutes', 'Chest', 'Back', 'Shoulders', 'Hamstrings', 'Biceps', 'Triceps', 'Calves', 'Core'],
  },
  {
    key: 'whole-full-body-home', group: 'whole', name: 'One for each muscle · no kit',
    why: 'The same session with nothing but the body and something to pull on.',
    sessionType: 'calisthenics', level: 'beginner', minutes: 45, kit: 'A floor, and a low bar or a sturdy table for the rows',
    prescription: '3 sets each, 8 to 15 reps, 60 s rest. Holds 20 to 40 s.',
    exercises: ['bodyweight-squat', 'push-up', 'inverted-row', 'pike-push-up', 'single-leg-glute-bridge', 'hamstring-walkout', 'single-leg-calf-raise', 'hollow-body-hold'],
    targets: ['Quads', 'Chest and triceps', 'Back and biceps', 'Shoulders', 'Glutes', 'Hamstrings', 'Calves', 'Core'],
  },
  {
    key: 'whole-full-body-dumbbells', group: 'whole', name: 'One for each muscle · two dumbbells',
    why: 'A pair of dumbbells and a bench, or a floor. Nothing else is needed for the whole body.',
    sessionType: 'strength', level: 'beginner', minutes: 55, kit: 'Two dumbbells, a bench if there is one',
    prescription: '3 sets each, 8 to 12 reps, 75 s rest.',
    exercises: ['goblet-squat', 'db-bench-press', 'db-one-arm-row', 'db-shoulder-press', 'db-romanian-deadlift', 'db-curl', 'db-overhead-extension', 'db-standing-calf-raise', 'russian-twist'],
  },
  {
    key: 'whole-full-body-kettlebell', group: 'whole', name: 'One kettlebell',
    why: 'Swing, squat, press, hinge, get up, carry. One bell, the whole body.',
    sessionType: 'strength', level: 'intermediate', minutes: 40, kit: 'One kettlebell',
    prescription: 'Halos to warm up. Then 3 to 4 rounds: 15 swings, 8 squats, 6 presses a side, 8 deadlifts, 1 get-up a side, a 30 m carry.',
    exercises: ['kb-halo', 'kettlebell-swing', 'goblet-squat', 'kb-press', 'kb-romanian-deadlift', 'turkish-get-up', 'kb-front-rack-carry'],
  },
  {
    key: 'whole-full-body-bands', group: 'whole', name: 'Bands only',
    why: 'A set of bands fits in a pocket. This is the session for the suitcase.',
    sessionType: 'strength', level: 'beginner', minutes: 35, kit: 'A long band and a small loop band, a door or a post',
    prescription: '3 sets each, 12 to 20 reps, 45 s rest. The band is hardest at the end of the movement: pause there.',
    exercises: ['band-pull-apart', 'push-up-banded', 'spanish-squat', 'banded-good-morning', 'band-face-pull', 'banded-pull-through', 'banded-lateral-walk', 'dead-bug-banded'],
  },
  {
    key: 'whole-machines-first-day', group: 'whole', name: 'First day in a gym',
    why: 'Machines only, so the path of the weight is decided for you while you learn what effort feels like.',
    sessionType: 'strength', level: 'beginner', minutes: 45, kit: 'The machine floor of any gym',
    prescription: '2 sets each, 12 reps with a weight you could lift 15 times. Set the seat before the weight.',
    exercises: ['leg-press', 'chest-press-machine', 'machine-row', 'machine-shoulder-press', 'seated-leg-curl', 'lat-pulldown', 'ab-crunch-machine'],
  },
  {
    key: 'whole-shoulders', group: 'whole', name: 'Shoulders, all three heads',
    why: 'Two exercises per head, and the small rotators that keep the joint centred.',
    sessionType: 'strength', level: 'intermediate', minutes: 50, kit: 'Barbell, dumbbells, cables',
    prescription: '3 sets each. The press 6 to 8. Everything else 12 to 15 with a weight that never needs a swing.',
    exercises: ['overhead-press', 'lateral-raise', 'cable-lateral-raise', 'rear-delt-fly', 'face-pull', 'db-external-rotation'],
    targets: ['Front delt', 'Side delt', 'Side delt, constant tension', 'Rear delt', 'Rear delt and upper back', 'Rotator cuff'],
  },
  {
    key: 'whole-back', group: 'whole', name: 'Back, every region',
    why: 'Lats, mid-back, traps and lower back, two pulls down and two pulls in.',
    sessionType: 'strength', level: 'intermediate', minutes: 55, kit: 'A pull-up bar, barbell, cables, a back extension bench',
    prescription: '3 sets each. Pull-ups and rows 6 to 10. The rest 10 to 15.',
    exercises: ['pull-up', 'lat-pulldown', 'barbell-row', 'seated-cable-row', 'barbell-shrug', 'back-extension'],
    targets: ['Lats', 'Lats', 'Mid-back', 'Mid-back', 'Traps', 'Lower back'],
  },
  {
    key: 'whole-chest', group: 'whole', name: 'Chest, top to bottom',
    why: 'A press and a fly for each of the three regions.',
    sessionType: 'strength', level: 'intermediate', minutes: 55, kit: 'Barbell and benches, dumbbells, cables, a pec deck',
    prescription: '3 sets each. Presses 6 to 10, 2 minutes rest. Flies 12 to 15, 60 s rest.',
    exercises: ['bench-press-incline-barbell', 'cable-fly-incline', 'bench-press-barbell', 'pec-deck', 'db-decline-press', 'cable-crossover'],
    targets: ['Upper chest', 'Upper chest', 'Middle chest', 'Middle chest', 'Lower chest', 'Lower chest'],
  },
  {
    key: 'whole-arms', group: 'whole', name: 'Arms, elbow to wrist',
    why: 'Three for the biceps, three for the triceps, two for the forearm.',
    sessionType: 'strength', level: 'intermediate', minutes: 50, kit: 'Barbell, dumbbells, an incline bench, a cable',
    prescription: '3 sets each, 8 to 12 reps. Pair a curl with an extension and rest 60 s after the pair.',
    exercises: ['barbell-curl', 'bench-press-close-grip', 'incline-db-curl', 'overhead-cable-extension', 'hammer-curl', 'rope-pushdown', 'reverse-curl', 'barbell-wrist-curl'],
  },
  {
    key: 'whole-legs', group: 'whole', name: 'Legs, hip to ankle',
    why: 'Quads, hamstrings, glutes, the inside and outside of the thigh, both calf muscles.',
    sessionType: 'strength', level: 'intermediate', minutes: 70, kit: 'A full gym',
    prescription: '3 sets each. Squat and deadlift 5 to 8, 2 to 3 minutes rest. The rest 10 to 15, 60 to 90 s.',
    exercises: ['back-squat', 'romanian-deadlift', 'bulgarian-split-squat', 'leg-extension', 'seated-leg-curl', 'hip-abduction-machine', 'hip-adduction-machine', 'standing-calf-machine', 'seated-calf-machine'],
  },
  {
    key: 'whole-glutes', group: 'whole', name: 'Glutes, every angle',
    why: 'Thrust, hinge, lunge, kick back, and two for the side of the hip.',
    sessionType: 'strength', level: 'intermediate', minutes: 50, kit: 'Barbell and bench, dumbbells, a cable, a loop band',
    prescription: '3 sets each. Thrust and deadlift 8 to 10. The rest 12 to 20.',
    exercises: ['barbell-hip-thrust', 'romanian-deadlift', 'db-reverse-lunge', 'cable-glute-kickback', 'hip-abduction-machine', 'banded-lateral-walk'],
  },
  {
    key: 'whole-abs', group: 'whole', name: 'Trunk, all the way round',
    why: 'Front, lower, sides, the muscles that resist turning, and the back that balances them.',
    sessionType: 'strength', level: 'intermediate', minutes: 30, kit: 'A cable, a pull-up bar, a back extension bench',
    prescription: '3 sets each, 10 to 15 reps. The Pallof press is held 3 seconds at full reach.',
    exercises: ['cable-crunch', 'hanging-leg-raise', 'cable-woodchopper', 'pallof-press', 'back-extension'],
    targets: ['Upper abs', 'Lower abs', 'Obliques', 'Anti-rotation', 'Lower back'],
  },

  // ══════════════════════════ BARS, SQUATS & PLANKS ══════════════════════════
  {
    key: 'bar-first-pull-up', group: 'bar', name: 'Your first pull-up',
    why: 'Hang, pull the shoulders down, hold the top, lower slowly. The pull-up is built from its end.',
    sessionType: 'calisthenics', level: 'beginner', minutes: 25, kit: 'A bar to hang from, a low bar or a sturdy table',
    prescription: 'Hang 3 × 20 to 30 s. Scapular pulls 3 × 8. Top hold 3 × 10 s. Lowerings 5 × 1 of 5 seconds. Rows 3 × 8.',
    exercises: ['dead-hang', 'scapular-pull-up', 'flexed-arm-hang', 'jumping-pull-up', 'negative-pull-up', 'inverted-row'],
  },
  {
    key: 'bar-pull-ups-every-grip', group: 'bar', name: 'Pull-ups, every grip',
    why: 'Each grip moves the work: wide for the lats, close and underhand for the arms, neutral for the elbows.',
    sessionType: 'calisthenics', level: 'advanced', minutes: 40, kit: 'A pull-up bar, neutral handles if there are any',
    prescription: '2 sets each, 2 reps short of failure, 2 minutes rest.',
    exercises: ['pull-up-wide', 'pull-up', 'pull-up-neutral', 'close-grip-pull-up', 'chin-up', 'mixed-grip-pull-up', 'commando-pull-up'],
  },
  {
    key: 'bar-rows-every-angle', group: 'bar', name: 'Rows, every angle',
    why: 'The pull that balances all the push-ups. The lower the body, the heavier the row.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 30, kit: 'A low bar, rings, or a sturdy table',
    prescription: '3 sets each, 8 to 12 reps, a full second with the chest at the bar.',
    exercises: ['inverted-row', 'inverted-row-underhand', 'inverted-row-wide-grip', 'inverted-row-feet-elevated', 'archer-row'],
  },
  {
    key: 'bar-dips-every-kind', group: 'bar', name: 'Dips, every kind',
    why: 'From holding yourself up to the straight bar. Lean forward for the chest, stay upright for the triceps.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 35, kit: 'Parallel bars, a straight bar, a bench',
    prescription: 'Support hold 3 × 20 s. Then 3 sets each of 5 to 10 reps, 90 s rest.',
    exercises: ['parallel-bar-support-hold', 'negative-dip', 'dip', 'straight-bar-dip', 'bench-dip'],
    note: 'Go only as deep as the shoulder allows without pain at the front of the joint.',
  },
  {
    key: 'bar-park-session', group: 'bar', name: 'The park bars',
    why: 'What to do when you walk up to the bars in the park: pull, dip, row, push, raise the knees, squat.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 40, kit: 'The bars of a calisthenics park',
    prescription: '4 rounds. 5 pull-ups, 8 dips, 10 rows, 12 push-ups, 10 knee raises, 20 squats. Rest 2 minutes between rounds.',
    exercises: ['pull-up', 'dip', 'inverted-row', 'push-up', 'hanging-knee-raise', 'bodyweight-squat'],
  },
  {
    key: 'bar-squats-every-kind', group: 'bar', name: 'Squats, every kind',
    why: 'Feet narrow, feet wide, to the side, on the toes, split, jumping, and held against a wall.',
    sessionType: 'calisthenics', level: 'beginner', minutes: 30, kit: 'A floor and a wall',
    prescription: '2 sets each, 12 to 20 reps, 45 s rest. Wall sit 45 s.',
    exercises: ['bodyweight-squat', 'sumo-squat', 'cossack-squat', 'hindu-squat', 'bodyweight-split-squat', 'jump-squat', 'wall-sit'],
  },
  {
    key: 'bar-lunges-every-direction', group: 'bar', name: 'Lunges, every direction',
    why: 'Forward, back, sideways, crossed behind, stepped through, and jumped.',
    sessionType: 'calisthenics', level: 'beginner', minutes: 25, kit: 'A floor',
    prescription: '2 sets each, 10 reps a leg, 45 s rest.',
    exercises: ['bodyweight-lunge', 'bodyweight-reverse-lunge', 'bodyweight-lateral-lunge', 'curtsy-lunge', 'step-through-lunge', 'jumping-lunge'],
  },
  {
    key: 'bar-planks-all-round', group: 'bar', name: 'Planks, all the way round',
    why: 'Front, side, back, and the hard versions of each. Tension is the measure, not the clock.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 25, kit: 'A floor, a bench for the Copenhagen plank',
    prescription: '2 rounds. Each hold 20 to 40 s, 20 s rest. The hard plank is 10 s at full tension.',
    exercises: ['plank', 'side-plank', 'reverse-plank', 'bear-plank-hold', 'rkc-plank', 'copenhagen-plank-short-lever', 'long-lever-plank'],
  },
  {
    key: 'bar-hanging-abs', group: 'bar', name: 'Abs from the bar',
    why: 'Everything the floor cannot do: the legs lifted against their whole weight.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 25, kit: 'A pull-up bar',
    prescription: 'L-hang 3 × 10 to 20 s. Then 3 sets each of 6 to 12 reps, no swing, 75 s rest.',
    exercises: ['l-hang', 'hanging-knee-raise', 'hanging-oblique-knee-raise', 'hanging-leg-raise', 'toes-to-bar'],
  },
  {
    key: 'bar-glutes-floor', group: 'bar', name: 'Glutes on the floor',
    why: 'Bridges, pumps and kicks. Nothing to set up, nothing to load.',
    sessionType: 'calisthenics', level: 'beginner', minutes: 25, kit: 'A mat, a sofa for the feet',
    prescription: '2 sets each, 15 to 20 reps, a full second squeezed at the top, 30 s rest.',
    exercises: ['glute-bridge', 'glute-bridge-march', 'single-leg-glute-bridge', 'frog-pump', 'donkey-kicks', 'fire-hydrant', 'feet-elevated-glute-bridge'],
  },

  // ══════════════════════════ SKILLS ══════════════════════════
  {
    key: 'skill-handstand', group: 'skills', name: 'The handstand',
    why: 'Wrists, the hollow shape, then the wall: walked up, held, and one hand lifted.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 30, kit: 'A wall and a clear floor',
    prescription: 'Wrists 2 minutes. Hollow 3 × 30 s. Pike push-ups 3 × 6. Wall walks 4 × 1. Wall holds 5 × 20 to 40 s. Shoulder taps 3 × 6.',
    exercises: ['quadruped-wrist-rocks', 'hollow-body-hold', 'pike-push-up', 'handstand-wall-walk', 'wall-handstand', 'wall-handstand-shoulder-tap'],
    note: 'Learn to come down before you go up: walk the feet down the wall, or turn out to one side.',
  },
  {
    key: 'skill-handstand-push-up', group: 'skills', name: 'The handstand push-up',
    why: 'Press the body before the handstand: pike, feet raised, held on the wall, lowered, then pressed.',
    sessionType: 'calisthenics', level: 'advanced', minutes: 35, kit: 'A wall, a chair, something soft for the head',
    prescription: '3 sets each, 3 to 8 reps, 2 minutes rest. Lowerings take 5 seconds.',
    exercises: ['pike-push-up', 'elevated-pike-push-up', 'wall-handstand', 'handstand-push-up-negative', 'wall-handstand-pushup'],
    note: 'Put a folded mat under the head and never drop onto it.',
  },
  {
    key: 'skill-l-sit', group: 'skills', name: 'The L-sit',
    why: 'Push the floor away, learn to lift the legs, then straighten them one step at a time.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 25, kit: 'Two chairs, parallettes or parallel bars, a pull-up bar',
    prescription: 'Support hold 3 × 20 s. Compressions 3 × 10. Tuck hold 4 × 10 to 20 s. L-hang 3 × 10 s. L-sit 5 attempts.',
    exercises: ['parallel-bar-support-hold', 'pike-compression', 'tuck-l-sit', 'l-hang', 'l-sit'],
  },
  {
    key: 'skill-front-lever', group: 'skills', name: 'The front lever',
    why: 'A straight body held level under the bar, reached through the tuck.',
    sessionType: 'calisthenics', level: 'advanced', minutes: 35, kit: 'A pull-up bar or rings',
    prescription: 'Scapular pulls 3 × 8. Hollow 3 × 30 s. Tuck holds 5 × 10 s. Then the hardest tuck you can hold 5 × 5 to 8 s. Rows 3 × 5.',
    exercises: ['scapular-pull-up', 'hollow-body-hold', 'tuck-front-lever', 'advanced-tuck-front-lever', 'tuck-front-lever-row', 'dragon-flag-negative'],
  },
  {
    key: 'skill-planche', group: 'skills', name: 'The planche',
    why: 'The lean comes first and takes months. The wrists decide how fast you may go.',
    sessionType: 'calisthenics', level: 'advanced', minutes: 35, kit: 'A floor, parallettes if the wrists complain',
    prescription: 'Wrists 3 minutes. Scapular push-ups 3 × 10. Leans 5 × 15 s. Pseudo planche push-ups 3 × 6. Tuck holds 5 × 8 s. Crow 3 × 20 s.',
    exercises: ['quadruped-wrist-rocks', 'scapular-push-up', 'planche-lean', 'pseudo-planche-pushup', 'tuck-planche', 'crow-pose'],
    note: 'Elbows stay locked in the lean and the hold. Any pain at the front of the elbow ends the session.',
  },
  {
    key: 'skill-muscle-up', group: 'skills', name: 'The muscle-up',
    why: 'A high pull, a dip on top of the bar, and the turn between them, practised from the top down.',
    sessionType: 'calisthenics', level: 'advanced', minutes: 35, kit: 'A straight pull-up bar with room above it',
    prescription: 'False grip hang 3 × 15 s. Explosive pulls 5 × 3. Chest to bar 3 × 5. Bar dips 3 × 8. Lowerings 5 × 1, slow.',
    exercises: ['false-grip-hang', 'explosive-pull-up', 'chest-to-bar-pull-up', 'straight-bar-dip', 'muscle-up-negative'],
  },
  {
    key: 'skill-pistol-squat', group: 'skills', name: 'The pistol squat',
    why: 'It is an ankle and balance problem before it is a strength one. Both are trained here.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 30, kit: 'A step, a door frame or post to hold',
    prescription: 'Ankle drill 2 × 10 a side. Deep squat 2 × 45 s. Then 3 sets each of 5 a leg, at the hardest step you can control.',
    exercises: ['knee-to-wall-ankle-drill', 'deep-squat-hold', 'assisted-pistol-squat', 'step-down', 'skater-squat', 'shrimp-squat', 'pistol-squat'],
  },
  {
    key: 'skill-human-flag', group: 'skills', name: 'Towards the human flag',
    why: 'The side of the body, made strong enough to hold the rest of it out sideways.',
    sessionType: 'calisthenics', level: 'advanced', minutes: 30, kit: 'A vertical pole or wall bars, a pull-up bar',
    prescription: 'Side planks 3 × 40 s a side. Star planks 3 × 20 s. Oblique knee raises 3 × 8. Clutch flag 5 attempts a side.',
    exercises: ['side-plank', 'star-side-plank', 'hanging-oblique-knee-raise', 'clutch-flag'],
  },

  // ══════════════════════════ JOINTS & POSTURE ══════════════════════════
  {
    key: 'care-shoulders', group: 'care', name: 'Shoulder care',
    why: 'The rotators and the muscles of the shoulder blade, which pressing never trains.',
    sessionType: 'mindbody', level: 'beginner', minutes: 20, kit: 'A light band, a wall',
    prescription: '2 sets each, 12 to 15 slow reps. Light enough that the last rep looks like the first.',
    exercises: ['shoulder-cars', 'wall-slides', 'scapular-push-up', 'band-pull-apart', 'band-external-rotation', 'band-face-pull', 'prone-w-raise'],
  },
  {
    key: 'care-knees', group: 'care', name: 'Knee care',
    why: 'An ankle that bends, a quad that works in the last degrees, and a slow step down.',
    sessionType: 'mindbody', level: 'beginner', minutes: 20, kit: 'A band, a low step, a wall',
    prescription: '2 sets each, 12 to 15 reps. Spanish squat held 30 s. Walk backwards for 3 minutes to finish.',
    exercises: ['knee-to-wall-ankle-drill', 'band-terminal-knee-extension', 'spanish-squat', 'step-down', 'tibialis-raise', 'backward-walking'],
    note: 'Mild discomfort that settles within a day is acceptable. Sharp pain, swelling or giving way is not.',
  },
  {
    key: 'care-lower-back', group: 'care', name: 'Lower back care',
    why: 'Move the spine gently, then teach the trunk to hold it still while the limbs move.',
    sessionType: 'mindbody', level: 'beginner', minutes: 15, kit: 'A mat',
    prescription: 'Cat-cow 10 slow reps. Then 3 rounds: bird dog 6 a side, dead bug 6 a side, side plank 10 s a side, bridge 10.',
    exercises: ['cat-cow', 'bird-dog', 'dead-bug', 'side-plank', 'glute-bridge', 'childs-pose'],
    note: 'Pain that travels down a leg, numbness, or weakness needs a doctor, not an exercise.',
  },
  {
    key: 'care-hips', group: 'care', name: 'Open hips',
    why: 'Rotation in, rotation out, the front of the hip, the back of it, and the bottom of the squat.',
    sessionType: 'mindbody', level: 'beginner', minutes: 20, kit: 'A mat',
    prescription: 'Switches and circles 2 × 8 a side. Each stretch 60 to 90 s a side, breathing out slowly.',
    exercises: ['90-90-hip-switch', 'hip-cars', 'half-kneeling-hip-flexor-stretch', 'pigeon-pose', 'frog-stretch', 'deep-squat-hold'],
  },
  {
    key: 'care-neck-desk', group: 'care', name: 'Neck and upper back, after a desk',
    why: 'The head has been forward for hours. This brings it back over the shoulders.',
    sessionType: 'mindbody', level: 'beginner', minutes: 12, kit: 'A doorway, a wall',
    prescription: 'One round, unhurried. Holds 30 s a side, circles 5 each way, 10 wall slides.',
    exercises: ['chin-tuck-hold', 'neck-cars', 'levator-scapulae-stretch', 'doorway-pec-stretch', 'thread-the-needle', 'wall-slides'],
  },
  {
    key: 'care-wrists-elbows', group: 'care', name: 'Wrists and elbows',
    why: 'For hands that type, grip bars and hold push-ups. The extensors are the half that gets forgotten.',
    sessionType: 'mindbody', level: 'beginner', minutes: 15, kit: 'A light dumbbell, a rubber band, a bar to hang from',
    prescription: '2 sets each, 15 to 20 reps. Hang 2 × 20 s to finish.',
    exercises: ['wrist-cars', 'quadruped-wrist-rocks', 'db-reverse-wrist-curl', 'finger-extension-band', 'dead-hang'],
  },
  {
    key: 'care-ankles-feet', group: 'care', name: 'Ankles and feet',
    why: 'The big toe, the sole, the ankle, then the calf lowered slowly under load.',
    sessionType: 'mindbody', level: 'beginner', minutes: 15, kit: 'A ball, a wall, a step',
    prescription: 'Roll each foot 1 minute. Drills 2 × 10 a side. Heel drops 3 × 10, 3 seconds down.',
    exercises: ['foot-rolling', 'big-toe-mobility', 'knee-to-wall-ankle-drill', 'wall-calf-stretch', 'eccentric-heel-drop', 'toe-walk'],
  },
  {
    key: 'care-posture', group: 'care', name: 'Standing taller',
    why: 'Open the chest and the front of the hips, strengthen what pulls the shoulders back.',
    sessionType: 'mindbody', level: 'beginner', minutes: 15, kit: 'A mat, a doorway, a sofa for the couch stretch',
    prescription: 'Raises 2 × 12, held 2 seconds at the top. Stretches 60 s a side.',
    exercises: ['posture-drills', 'prone-t-raise', 'prone-w-raise', 'chin-tuck-hold', 'doorway-pec-stretch', 'couch-stretch'],
  },
  {
    key: 'care-grip', group: 'care', name: 'A stronger grip',
    why: 'Crush, pinch, support and open the hand. Four kinds of grip, one session.',
    sessionType: 'strength', level: 'beginner', minutes: 20, kit: 'A bar, two dumbbells, two plates, a gripper, a rubber band',
    prescription: '3 sets each. Hangs and holds to 5 seconds before the grip gives. Gripper 8 to 12. Band 20.',
    exercises: ['dead-hang', 'farmers-carry', 'plate-pinch', 'hand-gripper', 'wrist-roller', 'finger-extension-band'],
  },

  // ══════════════════════════ SHORT & ANYWHERE ══════════════════════════
  {
    key: 'short-ten-minutes', group: 'short', name: 'Ten minutes, no kit',
    why: 'Five movements, two rounds, done before the excuse is finished.',
    sessionType: 'calisthenics', level: 'beginner', minutes: 10, kit: 'A floor',
    prescription: '2 rounds, 40 s of work and 20 s of rest on each.',
    exercises: ['push-up', 'bodyweight-squat', 'plank', 'glute-bridge', 'mountain-climber'],
  },
  {
    key: 'short-hotel-room', group: 'short', name: 'Hotel room',
    why: 'Two metres of floor and the chair by the desk.',
    sessionType: 'calisthenics', level: 'beginner', minutes: 20, kit: 'A floor and a chair',
    prescription: '3 rounds. 15 squats, 10 push-ups, 10 lunges a leg, 10 chair dips, 30 s side plank a side, 8 burpees.',
    exercises: ['bodyweight-squat', 'push-up', 'bodyweight-reverse-lunge', 'chair-dip', 'side-plank', 'burpees'],
  },
  {
    key: 'short-desk-break', group: 'short', name: 'Desk break',
    why: 'Five minutes every two hours of sitting. No change of clothes, no sweat.',
    sessionType: 'mindbody', level: 'beginner', minutes: 6, kit: 'Your chair and a doorway',
    prescription: 'One round. 10 chair squats, the flow once through, 30 s in the doorway, 20 s looking at something far away.',
    exercises: ['desk-mobility-flow', 'neck-cars', 'doorway-pec-stretch', 'chair-squat', 'eye-exercises-screen-break'],
  },
  {
    key: 'short-wake-up', group: 'short', name: 'Wake-up',
    why: 'The spine, the hips and the shoulders, moved once before the day starts.',
    sessionType: 'mindbody', level: 'beginner', minutes: 10, kit: 'A mat',
    prescription: 'One round, slowly. 10 cat-cows, 5 stretches a side, 5 breaths in the dog, 45 s in the squat, 3 sun salutations.',
    exercises: ['cat-cow', 'worlds-greatest-stretch', 'downward-dog', 'deep-squat-hold', 'sun-salutations'],
  },
  {
    key: 'short-warm-up-lifting', group: 'short', name: 'Warm-up before lifting',
    why: 'Raise the temperature, open the hips and shoulders, wake the glutes. Then the bar.',
    sessionType: 'mindbody', level: 'beginner', minutes: 10, kit: 'A band or a broomstick',
    prescription: 'One round. 10 reps of each, no stretch held longer than 2 seconds.',
    exercises: ['dynamic-warmup', 'leg-swings', 'squat-to-stand', 'banded-shoulder-dislocates', 'scapular-push-up', 'glute-bridge'],
  },
  {
    key: 'short-cool-down', group: 'short', name: 'Cool-down after training',
    why: 'Bring the breath down first, then hold the long stretches while the muscles are warm.',
    sessionType: 'mindbody', level: 'beginner', minutes: 12, kit: 'A mat, a doorway',
    prescription: '2 minutes of slow breathing, then each stretch 45 to 60 s a side.',
    exercises: ['post-workout-downregulation', 'standing-quad-stretch', 'seated-forward-fold', 'figure-four-stretch', 'overhead-lat-stretch', 'doorway-pec-stretch'],
  },
  {
    key: 'short-before-bed', group: 'short', name: 'Before bed',
    why: 'Nothing here is effort. Legs up, spine turned, breath lengthened.',
    sessionType: 'mindbody', level: 'beginner', minutes: 15, kit: 'A mat or the bed, a wall',
    prescription: 'Each position 2 to 3 minutes. Finish with 4 rounds of the 4-7-8 breath.',
    exercises: ['legs-up-the-wall', 'childs-pose', 'supine-spinal-twist', 'reclined-bound-angle-pose', 'breathing-478', 'pre-sleep-wind-down'],
  },
  {
    key: 'short-fifteen-dumbbells', group: 'short', name: 'Fifteen minutes, two dumbbells',
    why: 'Four movements that cover the body, done as a circuit.',
    sessionType: 'strength', level: 'beginner', minutes: 15, kit: 'Two dumbbells',
    prescription: '4 rounds. 10 thrusters, 10 rows, 10 deadlifts, 30 m carry. Rest 60 s between rounds.',
    exercises: ['db-thruster', 'db-bent-over-row', 'db-deadlift', 'farmers-carry'],
  },

  // ══════════════════════════ COMBAT ══════════════════════════
  {
    key: 'combat-six-punches', group: 'combat', name: 'Boxing: the six punches',
    why: 'Stance first. Then each punch alone, slowly, before any of them are put together.',
    sessionType: 'martial_arts', level: 'beginner', minutes: 30, kit: 'A mirror helps. A bag if there is one',
    prescription: 'Stance 1 round. Then one 2-minute round per punch, 45 s rest. The hand comes back as fast as it went out.',
    exercises: ['boxing-stance-and-guard', 'boxing-jab', 'boxing-cross', 'boxing-lead-hook', 'boxing-rear-hook', 'boxing-lead-uppercut', 'boxing-rear-uppercut'],
  },
  {
    key: 'combat-boxing-defence', group: 'combat', name: 'Boxing: the defence',
    why: 'Block, parry, slip, roll under, roll off the shoulder, pull back and answer.',
    sessionType: 'martial_arts', level: 'intermediate', minutes: 30, kit: 'A rope at shoulder height. A partner for the last three',
    prescription: 'One 3-minute round each, 60 s rest. Eyes on the chest of the partner, never closed.',
    exercises: ['boxing-high-guard-blocking', 'boxing-parry-drill', 'boxing-slip-rope', 'boxing-bob-and-weave', 'boxing-shoulder-roll', 'boxing-pull-counter'],
  },
  {
    key: 'combat-boxing-footwork', group: 'combat', name: 'Boxing: the feet',
    why: 'Punches are thrown from the floor. The feet never cross and never come together.',
    sessionType: 'martial_arts', level: 'beginner', minutes: 25, kit: 'A rope, a line on the floor',
    prescription: '2 rounds of rope. Then one 2-minute round per drill, 45 s rest.',
    exercises: ['ma-skipping', 'boxing-step-drag', 'boxing-pivot-drill', 'boxing-in-and-out', 'boxing-l-step', 'boxing-cutting-off-the-ring'],
  },
  {
    key: 'combat-heavy-bag', group: 'combat', name: 'Heavy bag session',
    why: 'Shadow to warm up, then the body, the uppercut, power, and the punch-out to empty the tank.',
    sessionType: 'martial_arts', level: 'intermediate', minutes: 35, kit: 'A heavy bag, gloves and wraps',
    prescription: '2 rounds of shadow. Then 2 rounds of 3 minutes on each, 60 s rest. Punch-outs are 6 × 20 s.',
    exercises: ['ma-shadow-round', 'boxing-bag-body-shots', 'boxing-uppercut-bag', 'boxing-bag-power-rounds', 'boxing-bag-punch-out'],
    note: 'Wrap the hands every time. A bent wrist on a heavy bag is how wrists get sprained.',
  },
  {
    key: 'combat-thai-kicks', group: 'combat', name: 'Muay Thai: the kicks',
    why: 'The push kick, then the round kick at three heights, the switch, and the check that answers it.',
    sessionType: 'martial_arts', level: 'intermediate', minutes: 35, kit: 'A heavy bag or pads and a holder',
    prescription: 'One 3-minute round each, 60 s rest. 10 kicks a leg, then the other leg.',
    exercises: ['mt-stance-and-footwork', 'mt-teep', 'mt-low-kick', 'mt-body-kick', 'mt-switch-kick', 'mt-check-drill'],
  },
  {
    key: 'combat-thai-knees-elbows', group: 'combat', name: 'Muay Thai: knees and elbows',
    why: 'The close weapons, and the clinch they are thrown from.',
    sessionType: 'martial_arts', level: 'intermediate', minutes: 30, kit: 'A heavy bag, pads, a partner for the clinch',
    prescription: '2 rounds of 3 minutes on each, 60 s rest.',
    exercises: ['mt-straight-knee', 'mt-bag-knees', 'mt-elbows-on-pads', 'ma-clinch-work'],
  },
  {
    key: 'combat-ground-solo', group: 'combat', name: 'The ground, alone',
    why: 'Falling, moving the hips, bridging, getting up. What every grappler drills before a partner arrives.',
    sessionType: 'martial_arts', level: 'beginner', minutes: 25, kit: 'A mat',
    prescription: '3 rounds. 10 breakfalls, shrimps and bridges the length of the mat, 10 stand-ups, 10 sprawls.',
    exercises: ['ma-breakfalls', 'ma-shrimping', 'ma-bridging', 'grappling-technical-stand-up', 'ma-solo-grappling-drills', 'sprawl-drill'],
  },
  {
    key: 'combat-wrestling-entries', group: 'combat', name: 'Wrestling: getting in',
    why: 'Stance and motion, the shot, and two ways to get behind an arm.',
    sessionType: 'martial_arts', level: 'intermediate', minutes: 35, kit: 'A mat and a partner',
    prescription: '3 rounds of 3 minutes on each, 60 s rest. The partner gives the position, not a fight.',
    exercises: ['wrestling-stance-and-motion', 'wrestling-shots', 'sprawl-drill', 'wrestling-arm-drag', 'wrestling-duck-under'],
  },

  // ══════════════════════════ CONDITIONING ══════════════════════════
  {
    key: 'cardio-rope-ladder', group: 'cardio', name: 'Jump rope, five steps',
    why: 'Two feet, alternate feet, knees up, arms crossed, the rope twice under.',
    sessionType: 'cardio', level: 'intermediate', minutes: 20, kit: 'A rope and a floor that forgives',
    prescription: '3 rounds. 60 s on each step, 30 s rest. Stay on a step until it runs a full minute without a miss.',
    exercises: ['jump-rope-basic', 'jump-rope-alternate', 'jump-rope-high-knees', 'jump-rope-crossovers', 'jump-rope-double-unders'],
  },
  {
    key: 'cardio-no-kit', group: 'cardio', name: 'No-kit conditioning',
    why: 'Seven movements, no equipment, and a heart rate that stays up.',
    sessionType: 'cardio', level: 'intermediate', minutes: 20, kit: 'A floor',
    prescription: '3 rounds. 30 s of work, 15 s of rest on each. 90 s between rounds.',
    exercises: ['jumping-jacks', 'high-knees', 'butt-kicks', 'skater-jumps', 'mountain-climbers', 'plank-jacks', 'burpees'],
  },
  {
    key: 'cardio-jumps', group: 'cardio', name: 'Jumps',
    why: 'From the ankle upward: hops, then jumps for height, for distance, and off a box.',
    sessionType: 'calisthenics', level: 'intermediate', minutes: 25, kit: 'A sturdy box, a floor that forgives',
    prescription: 'Hops 3 × 20. Then 4 sets of 5 on each, 90 s rest. Every landing is quiet.',
    exercises: ['pogo-hops', 'jump-squat', 'tuck-jump', 'broad-jump', 'box-jumps', 'depth-jump'],
    note: 'Step down from the box, never jump down. Leave the depth jump out until the others land silently.',
  },
  {
    key: 'cardio-speed-agility', group: 'cardio', name: 'Speed and change of direction',
    why: 'Start fast, move sideways, turn, and above all learn to stop.',
    sessionType: 'cardio', level: 'intermediate', minutes: 30, kit: 'Twenty metres of flat ground, a few cones',
    prescription: 'Landing drill 3 × 5. Then 5 repetitions of each at full speed, walking back as the rest.',
    exercises: ['deceleration-landing-mechanics', 'acceleration-starts', 'lateral-shuffle', 'agility-ladder', 'pro-agility-5-10-5', 'shuttle-runs'],
  },
  {
    key: 'cardio-machine-tour', group: 'cardio', name: 'Tour of the machines',
    why: 'Five machines, five minutes each. Boredom never gets a chance.',
    sessionType: 'cardio', level: 'beginner', minutes: 30, kit: 'The cardio floor of a gym',
    prescription: '5 minutes on each at a pace where you could still speak in short sentences. 1 minute to change machine.',
    exercises: ['rowing-machine', 'assault-bike', 'ski-erg', 'stair-climber', 'treadmill-run'],
  },
  {
    key: 'cardio-carries', group: 'cardio', name: 'Carries',
    why: 'Pick something heavy up and walk with it, in every position there is.',
    sessionType: 'strength', level: 'intermediate', minutes: 25, kit: 'Two dumbbells or kettlebells, a sandbag if there is one',
    prescription: '3 rounds. 30 to 40 m of each, 60 s rest. Walk tall, no leaning.',
    exercises: ['farmers-carry', 'suitcase-carry', 'kb-front-rack-carry', 'overhead-carry', 'sandbag-carry'],
  },

  // ══════════════════════════ MOBILITY, YOGA & CALM ══════════════════════════
  {
    key: 'calm-five-minutes', group: 'calm', name: 'Calm in five minutes',
    why: 'A long breath out, four equal counts, then the room around you, named.',
    sessionType: 'meditation', level: 'beginner', minutes: 5, kit: 'Nothing',
    prescription: '5 double breaths. 2 minutes of box breathing. Then five things seen, four felt, three heard, two smelled, one tasted.',
    exercises: ['physiological-sigh', 'box-breathing', 'grounding-54321'],
  },
  {
    key: 'calm-breath', group: 'calm', name: 'A session of breath',
    why: 'Into the belly, slowed to six a minute, one nostril at a time, hummed, then counted.',
    sessionType: 'meditation', level: 'beginner', minutes: 20, kit: 'Somewhere to sit',
    prescription: '4 minutes on each. Breathe through the nose. If you feel light-headed, breathe normally until it passes.',
    exercises: ['diaphragmatic-breathing', 'coherent-breathing', 'alternate-nostril', 'humming-bhramari', 'breath-counting'],
  },
  {
    key: 'calm-joints-head-to-toe', group: 'calm', name: 'Every joint, head to toe',
    why: 'Each joint taken slowly around the whole of its range, from the neck down.',
    sessionType: 'mindbody', level: 'beginner', minutes: 12, kit: 'Nothing',
    prescription: '3 slow circles each way at every joint. The rest of the body stays still.',
    exercises: ['neck-cars', 'shoulder-cars', 'scapular-cars', 'wrist-cars', 'cat-cow', 'hip-cars', 'ankle-mobility'],
  },
  {
    key: 'calm-full-stretch', group: 'calm', name: 'The long stretch',
    why: 'Nine stretches, top to bottom. The session for the day after.',
    sessionType: 'mindbody', level: 'beginner', minutes: 20, kit: 'A mat, a doorway, a wall',
    prescription: 'Each stretch 45 to 60 s a side. Strong, never painful. Breathe out as you ease further.',
    exercises: ['standing-side-bend-stretch', 'cross-body-shoulder-stretch', 'overhead-triceps-stretch', 'doorway-pec-stretch', 'half-kneeling-hip-flexor-stretch', 'standing-quad-stretch', 'seated-forward-fold', 'figure-four-stretch', 'wall-calf-stretch'],
  },
  {
    key: 'calm-yoga-standing', group: 'calm', name: 'Yoga: the standing poses',
    why: 'The poses every class is built on. Strength in the legs, length in the sides.',
    sessionType: 'mindbody', level: 'beginner', minutes: 25, kit: 'A mat',
    prescription: '5 breaths in each pose, each side. Twice through.',
    exercises: ['warrior-i', 'warrior-ii', 'extended-side-angle-pose', 'triangle-pose', 'pyramid-pose', 'tree-pose', 'standing-forward-fold'],
  },
  {
    key: 'calm-yoga-backbends', group: 'calm', name: 'Yoga: opening the front',
    why: 'Backbends from the gentlest upward, and the fold that undoes them.',
    sessionType: 'mindbody', level: 'intermediate', minutes: 25, kit: 'A mat, a block or a cushion',
    prescription: '5 breaths in each, twice. Rest in the fold for a full minute at the end.',
    exercises: ['sphinx-pose', 'cobra-pose', 'supported-bridge-pose', 'bow-pose', 'camel-pose', 'childs-pose'],
    note: 'The bend comes from the upper back. Any pinching low in the spine means come out of it.',
  },
  {
    key: 'calm-yoga-hips-floor', group: 'calm', name: 'Yoga: hips, on the floor',
    why: 'Long holds close to the ground, ending lying still.',
    sessionType: 'mindbody', level: 'beginner', minutes: 30, kit: 'A mat and a cushion',
    prescription: '2 to 3 minutes in each, each side. 5 minutes lying still at the end.',
    exercises: ['butterfly-stretch', 'lizard-pose', 'pigeon-pose', 'fire-log-pose', 'happy-baby-pose', 'supine-spinal-twist', 'savasana'],
  },
  {
    key: 'calm-pilates-mat', group: 'calm', name: 'Pilates: the mat classics',
    why: 'Ten of the original mat exercises, in the order they are taught.',
    sessionType: 'mindbody', level: 'intermediate', minutes: 30, kit: 'A mat',
    prescription: 'The hundred once. Then 6 to 8 reps of each, flowing from one to the next.',
    exercises: ['pilates-hundred', 'pilates-roll-up', 'pilates-single-leg-circles', 'pilates-rolling-like-a-ball', 'pilates-single-leg-stretch', 'pilates-double-leg-stretch', 'pilates-spine-stretch-forward', 'pilates-saw', 'pilates-swan', 'pilates-swimming'],
  },
  {
    key: 'calm-qigong', group: 'calm', name: 'Qigong morning',
    why: 'Shake loose, stand still, then the eight brocades. Slow enough to do in a courtyard at dawn.',
    sessionType: 'mindbody', level: 'beginner', minutes: 25, kit: 'Two square metres',
    prescription: '2 minutes of shaking. 5 minutes standing. The eight brocades once through. 5 minutes of walking.',
    exercises: ['qigong-shaking', 'zhan-zhuang', 'baduanjin-eight-brocades', 'tai-chi-silk-reeling', 'walking-qigong'],
  },
  {
    key: 'calm-splits', group: 'calm', name: 'Towards the splits',
    why: 'Front of the hip, back of the thigh, inside of the thigh. Months, not weeks.',
    sessionType: 'mindbody', level: 'advanced', minutes: 30, kit: 'A mat, two blocks or stacks of books',
    prescription: 'Swings 2 × 15 a leg to warm up. Each stretch 3 × 45 s a side. Hands on the blocks in the splits.',
    exercises: ['leg-swings', 'half-kneeling-hip-flexor-stretch', 'couch-stretch', 'frog-stretch', 'pancake-stretch', 'middle-split-progression', 'front-split'],
    note: 'Never bounce, never cold. Stop at a strong stretch, well before pain.',
  },
];

export function readySessionsIn(group: ReadyGroup): ReadySession[] {
  return READY_SESSIONS.filter((s) => s.group === group);
}

export function findReadySession(key: string): ReadySession | undefined {
  return READY_SESSIONS.find((s) => s.key === key);
}

/** the tag stored in `sessions.style`, so the same session is counted as itself */
export function readyStyleTag(session: ReadySession): string {
  return `ready:${session.key}`;
}

export function parseReadyStyle(style: string | null | undefined): string | null {
  if (!style || !style.startsWith('ready:')) return null;
  const key = style.slice('ready:'.length);
  return key.length > 0 ? key : null;
}

/** what the session trains, read from its targets or left empty */
export function readyTargetFor(session: ReadySession, index: number): string | null {
  return session.targets?.[index] ?? null;
}
