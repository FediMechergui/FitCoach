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
 * Since 3.7.0 four groups are about health rather than training: rehabilitation,
 * seniors, pregnancy, after birth. Every session in them carries a note, and
 * the note says who to ask and when to stop. They describe what is commonly
 * done; they never diagnose and never promise.
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
  | 'calm'
  | 'kit'
  | 'rehab'
  | 'gentle'
  | 'mother'
  | 'pilates'
  | 'hyrox';

export const READY_GROUP_ORDER: ReadyGroup[] = [
  'pushups', 'best-gym', 'best-home', 'whole', 'bar', 'skills', 'care', 'short', 'combat', 'cardio', 'calm',
  'kit', 'rehab', 'gentle', 'mother', 'pilates', 'hyrox',
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
  kit: {
    label: 'Kettlebell, bands & straps',
    short: 'Bell & bands',
    blurb: 'One piece of kit and a whole session built on it: a kettlebell, a set of bands, or straps hung from a door or a bar.',
    icon: 'strength.kettlebell',
  },
  rehab: {
    label: 'Rehabilitation, joint by joint',
    short: 'Rehab',
    blurb: 'The exercises physiotherapists commonly give, grouped by what they are used for. The app cannot examine you: an injury that is swollen, unstable, numb or not improving needs to be seen.',
    icon: 'mindbody.joint',
  },
  gentle: {
    label: 'Seniors & the chair',
    short: 'Seniors & chair',
    blurb: 'Strength, balance and movement sitting on a chair or standing beside one. For later life, and for anyone coming back from a long time of doing little.',
    icon: 'mindbody.balance',
  },
  mother: {
    label: 'Pregnancy & after birth',
    short: 'Pregnancy',
    blurb: 'Gentle sessions for pregnancy and a staged return after birth. Agree your activity with your midwife or doctor; they know your pregnancy, the app does not.',
    icon: 'mindbody.breath',
  },
  pilates: {
    label: 'Pilates, mat & reformer',
    short: 'Pilates',
    blurb: 'Classes built on the classical order: the breath and the curl first, the full mat, the reformer, and the advanced repertoire for those who have earned it.',
    icon: 'mindbody.pilates',
  },
  hyrox: {
    label: 'Hyrox, the race format',
    short: 'Hyrox',
    blurb: 'Eight runs of a kilometre, each followed by a station. Sessions for the runs, the stations, the sleds and the ergs, and a simulation of the whole race.',
    icon: 'cardio.hyrox',
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

  {
    key: 'bar-biceps-no-weights', group: 'bar', name: "Biceps without weights",
    why: "The lowering of a chin-up, the chin-up itself, a curl under a table, a curl against your own leg, a hold.",
    sessionType: 'calisthenics', level: 'intermediate', minutes: 25, kit: "A bar, a sturdy table, a towel",
    prescription: "3 sets each. Lowerings 5 x 5 seconds. Chin-ups and curls 6 to 10. Holds 10 s at each of the three angles.",
    exercises: ['chin-up-negative', 'chin-up', 'under-table-bodyweight-curl', 'towel-curl-leg-resistance', 'chin-up-isometric-three-angles'],
  },
  {
    key: 'bar-hamstrings-no-weights', group: 'bar', name: "Hamstrings without weights",
    why: "The hinge, the long bridge on two legs then one, the slow slide, and the Nordic with help.",
    sessionType: 'calisthenics', level: 'intermediate', minutes: 25, kit: "A smooth floor and socks, a band and something to hold the feet down",
    prescription: "3 sets each of 8 to 10 reps. Slides and Nordics are lowered for 4 to 5 seconds.",
    exercises: ['bodyweight-good-morning', 'long-lever-glute-bridge', 'single-leg-long-lever-bridge', 'slider-leg-curl-eccentric', 'band-assisted-nordic-curl', 'nordic-curl-isometric-hold'],
    note: "Hamstrings cramp when they are new to this. Shorten the lever, shake it out, and carry on.",
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

  // ══════════════════════════ KETTLEBELL, BANDS & STRAPS ══════════════════════════
  {
    key: 'kit-kettlebell-first', group: 'kit', name: "Your first kettlebell session",
    why: "Lift it, squat with it, swing it, get up under it, row it, carry it. The six things a bell is for.",
    sessionType: 'strength', level: 'beginner', minutes: 35, kit: "One kettlebell, light enough to press overhead",
    prescription: "3 sets each. Deadlift and squat 8 reps. Swings 10. Half get-up 3 a side. Rows 8 a side. Carry 30 m.",
    exercises: ['kb-sumo-deadlift', 'kb-prying-goblet-squat', 'kettlebell-swing', 'kb-half-get-up', 'kb-single-arm-row', 'kb-front-rack-carry'],
    note: "The swing is a hinge at the hips, not a squat and not a lift with the arms. Learn the deadlift first.",
  },
  {
    key: 'kit-kettlebell-ballistics', group: 'kit', name: "Kettlebell: swing, clean, snatch",
    why: "The fast lifts in the order they are learned, each one a swing that finishes somewhere higher.",
    sessionType: 'strength', level: 'advanced', minutes: 35, kit: "One kettlebell",
    prescription: "4 sets each of 5 to 8 a side, 90 s rest. Every rep starts from a hinge and ends standing tall.",
    exercises: ['kb-dead-stop-swing', 'kb-one-arm-swing', 'kb-clean', 'kb-high-pull', 'kb-half-snatch', 'kb-snatch'],
    note: "Stop the set when the bell starts to pull you forward or bang the forearm. Chalk helps; a tight grip tears hands.",
  },
  {
    key: 'kit-kettlebell-press', group: 'kit', name: "Kettlebell: overhead",
    why: "From the knees to standing, strict to driven by the legs. The shoulder learns to hold before it learns to push.",
    sessionType: 'strength', level: 'intermediate', minutes: 35, kit: "One kettlebell, or two for the see-saw",
    prescription: "Halos to warm up. Then 3 sets each of 5 to 8 a side, 90 s rest.",
    exercises: ['kb-halo', 'kb-half-kneeling-press', 'kb-press', 'kb-push-press', 'kb-see-saw-press', 'kb-floor-press'],
  },
  {
    key: 'kit-kettlebell-doubles', group: 'kit', name: "Two kettlebells",
    why: "Everything heavier and nothing to hide behind: both sides work at once.",
    sessionType: 'strength', level: 'advanced', minutes: 40, kit: "Two kettlebells of the same weight",
    prescription: "4 sets each of 5 reps, 2 minutes rest. Long cycle last: as many clean reps as 2 minutes allow.",
    exercises: ['kb-double-clean', 'kb-double-press', 'kb-double-front-squat', 'kb-double-swing', 'kb-gorilla-row', 'kb-long-cycle'],
  },
  {
    key: 'kit-kettlebell-core', group: 'kit', name: "Kettlebell: the trunk",
    why: "Pass it round the body, drag it under a plank, and hold it overhead while the body moves beneath.",
    sessionType: 'strength', level: 'intermediate', minutes: 25, kit: "One light kettlebell",
    prescription: "3 sets each. Passes 10 each way. Drags 6 a side. Windmill, arm bar and sit-up 5 a side, slowly.",
    exercises: ['kb-around-the-world', 'kb-figure-eight', 'kb-plank-pull-through', 'kb-windmill', 'kb-arm-bar', 'kb-get-up-sit-up'],
    note: "Eyes on the bell whenever it is overhead. Use a bell you could press easily.",
  },
  {
    key: 'kit-bands-upper', group: 'kit', name: "Bands: upper body",
    why: "A push and a pull in each direction, then the arms. A door and a band are the whole gym.",
    sessionType: 'strength', level: 'beginner', minutes: 35, kit: "A long band or a band with handles, and a door anchor",
    prescription: "3 sets each of 12 to 20 reps, 45 s rest. Pause a second where the band is tightest.",
    exercises: ['band-chest-press-standing', 'band-seated-row', 'band-overhead-press', 'band-lat-pulldown', 'band-lateral-raise', 'band-biceps-curl', 'band-triceps-pushdown'],
    note: "Check the band for nicks before every session and never stretch it towards your face.",
  },
  {
    key: 'kit-bands-lower', group: 'kit', name: "Bands: lower body",
    why: "Squat, hinge, split, thrust, curl, raise: the legs from every side with a band underfoot.",
    sessionType: 'strength', level: 'beginner', minutes: 35, kit: "A long band, a bench or sofa for the hip thrust",
    prescription: "3 sets each of 12 to 20 reps, 60 s rest.",
    exercises: ['band-squat', 'band-romanian-deadlift', 'band-split-squat', 'band-hip-thrust', 'band-lying-leg-curl', 'band-calf-raise'],
  },
  {
    key: 'kit-loop-band-glutes', group: 'kit', name: "Loop band: glutes",
    why: "A small loop above the knees turns every movement into work for the side of the hip.",
    sessionType: 'strength', level: 'beginner', minutes: 25, kit: "A loop band",
    prescription: "2 sets each of 15 to 20 reps, 30 s rest. Walks are 10 steps each way.",
    exercises: ['loop-band-squat', 'loop-band-bridge-abduction', 'loop-band-glute-kickback', 'loop-band-fire-hydrant', 'loop-band-standing-hip-abduction', 'banded-lateral-walk', 'monster-walk'],
  },
  {
    key: 'kit-bands-core', group: 'kit', name: "Bands: the trunk",
    why: "The band pulls you round; the trunk refuses. Then the chop, the crunch and the dead bug.",
    sessionType: 'strength', level: 'intermediate', minutes: 25, kit: "A long band with an anchor, a loop band",
    prescription: "3 sets each of 10 to 12 a side. The hold is 20 to 30 s a side.",
    exercises: ['band-pallof-press', 'band-anti-rotation-hold', 'band-woodchop', 'band-kneeling-crunch', 'loop-band-bicycle-crunch', 'dead-bug-banded'],
  },
  {
    key: 'kit-straps-whole-body', group: 'kit', name: "Straps: whole body",
    why: "Squat, row, push, curl the legs, open the shoulders, hold the plank. Step closer or further to set the weight.",
    sessionType: 'calisthenics', level: 'beginner', minutes: 35, kit: "A suspension trainer or rings, anchored above head height",
    prescription: "3 sets each of 8 to 12 reps, 60 s rest. Plank 20 to 40 s.",
    exercises: ['suspension-assisted-squat', 'ring-row', 'ring-push-up', 'suspension-hamstring-curl', 'suspension-y-fly', 'suspension-plank', 'suspension-knee-tuck'],
    note: "Test the anchor with your full weight before the first rep. A door must close towards you and be locked.",
  },
  {
    key: 'kit-straps-upper-back', group: 'kit', name: "Straps: shoulders and upper back",
    why: "The four letters, I, Y, T and W, then a face pull and a row that turns.",
    sessionType: 'calisthenics', level: 'intermediate', minutes: 30, kit: "A suspension trainer or rings",
    prescription: "3 sets each of 8 to 12 slow reps, 60 s rest. Stand taller to make it lighter.",
    exercises: ['suspension-i-fly', 'suspension-y-fly', 'suspension-t-fly', 'suspension-w-fly', 'ring-face-pull', 'suspension-power-pull'],
  },
  {
    key: 'kit-straps-legs', group: 'kit', name: "Straps: legs",
    why: "The straps take a little weight so the legs can go deeper and one at a time.",
    sessionType: 'calisthenics', level: 'intermediate', minutes: 35, kit: "A suspension trainer",
    prescription: "3 sets each of 8 to 12 a leg, 75 s rest.",
    exercises: ['suspension-assisted-squat', 'suspension-bulgarian-split-squat', 'suspension-side-lunge', 'suspension-hamstring-curl', 'suspension-hip-press', 'suspension-assisted-pistol-squat'],
  },
  {
    key: 'kit-straps-core', group: 'kit', name: "Straps: the trunk",
    why: "Feet in the cradles and the floor becomes unsteady. Planks first, then the moving ones.",
    sessionType: 'calisthenics', level: 'advanced', minutes: 30, kit: "A suspension trainer with foot cradles, hung to mid-shin",
    prescription: "Planks 3 x 20 to 40 s. Then 3 sets each of 8 to 12 reps, 60 s rest.",
    exercises: ['suspension-plank', 'suspension-side-plank', 'suspension-knee-tuck', 'suspension-pike', 'suspension-body-saw', 'suspension-kneeling-rollout'],
    note: "The moment the lower back sags, the set is over.",
  },

  // ══════════════════════════ REHABILITATION, JOINT BY JOINT ══════════════════════════
  {
    key: 'rehab-ankle-first-days', group: 'rehab', name: "Ankle sprain: getting it moving",
    why: "Gentle movement while the ankle is still sore: pumps, the alphabet, a seated stretch, the toes.",
    sessionType: 'mindbody', level: 'beginner', minutes: 10, kit: "A towel, a chair",
    prescription: "10 to 20 slow reps of each, two or three times a day. Nothing here should hurt sharply.",
    exercises: ['rehab-ankle-pumps', 'rehab-ankle-alphabet', 'rehab-ankle-towel-calf-stretch', 'rehab-foot-towel-scrunches'],
    note: "This is general information, not treatment. Have the injury assessed first, stay below sharp pain, and stop if it swells, gives way, goes numb or is not improving. If you could not put weight on it, or the bone is tender, get it X-rayed.",
  },
  {
    key: 'rehab-ankle-strength', group: 'rehab', name: "Ankle sprain: strength",
    why: "The band in four directions, then the calf, then standing on it.",
    sessionType: 'mindbody', level: 'beginner', minutes: 20, kit: "A band, a step, a counter to hold",
    prescription: "3 sets each of 12 to 15 slow reps. Balance 3 x 30 s.",
    exercises: ['rehab-ankle-band-dorsiflexion', 'rehab-ankle-band-plantarflexion', 'rehab-ankle-band-eversion', 'rehab-ankle-band-inversion', 'calf-raise-step', 'rehab-ankle-single-leg-balance'],
    note: "This is general information, not treatment. Have the injury assessed first, stay below sharp pain, and stop if it swells, gives way, goes numb or is not improving.",
  },
  {
    key: 'rehab-ankle-return', group: 'rehab', name: "Ankle sprain: back to sport",
    why: "Balance made harder, then small hops, then sideways. The last stage, and the one most often skipped.",
    sessionType: 'mindbody', level: 'intermediate', minutes: 25, kit: "Flat ground, tape for lines, a cushion",
    prescription: "Balance and reaches 3 x 30 s a side. Hops 3 x 5, every landing quiet and held for 2 seconds.",
    exercises: ['rehab-ankle-single-leg-balance', 'rehab-ankle-star-excursion-reach', 'rehab-ankle-tandem-walk', 'rehab-ankle-hop-progression', 'rehab-ankle-lateral-hop-stick'],
    note: "This is general information, not treatment. Have the injury assessed first, stay below sharp pain, and stop if it swells, gives way, goes numb or is not improving. Hopping needs clearance from a physiotherapist.",
  },
  {
    key: 'rehab-tennis-elbow', group: 'rehab', name: "Tennis elbow",
    why: "The outside of the elbow: a stretch, a hold, then the slow lowering that tendons respond to.",
    sessionType: 'mindbody', level: 'beginner', minutes: 15, kit: "A light dumbbell, a flex bar if you have one, a soft ball",
    prescription: "Stretch 3 x 30 s. Hold 5 x 30 to 45 s. Lowerings 3 x 10 to 15, 3 seconds down.",
    exercises: ['rehab-elbow-wrist-extensor-stretch', 'rehab-elbow-isometric-wrist-extension', 'rehab-elbow-eccentric-wrist-extension', 'rehab-elbow-tyler-twist', 'rehab-hand-grip-ball-squeeze'],
    note: "This is general information, not treatment. Have the injury assessed first, stay below sharp pain, and stop if it swells, gives way, goes numb or is not improving.",
  },
  {
    key: 'rehab-golfers-elbow', group: 'rehab', name: "Golfer's elbow",
    why: "The inside of the elbow: the same plan as tennis elbow, turned over.",
    sessionType: 'mindbody', level: 'beginner', minutes: 15, kit: "A light dumbbell, a flex bar if you have one, a soft ball",
    prescription: "Stretch 3 x 30 s. Hold 5 x 30 to 45 s. Lowerings 3 x 10 to 15, 3 seconds down.",
    exercises: ['rehab-elbow-wrist-flexor-stretch', 'rehab-elbow-isometric-wrist-flexion', 'rehab-elbow-eccentric-wrist-flexion', 'rehab-elbow-reverse-tyler-twist', 'rehab-hand-grip-ball-squeeze'],
    note: "This is general information, not treatment. Have the injury assessed first, stay below sharp pain, and stop if it swells, gives way, goes numb or is not improving. Tingling in the ring and little fingers needs to be looked at.",
  },
  {
    key: 'rehab-runners-knee', group: 'rehab', name: "Runner's knee",
    why: "Pain round the kneecap is usually answered at the thigh and the hip, so that is where the work goes.",
    sessionType: 'mindbody', level: 'beginner', minutes: 25, kit: "A mat, a loop band, a low step",
    prescription: "3 sets each of 10 to 15 reps a side. Step-downs slow, the knee tracking over the second toe.",
    exercises: ['rehab-knee-quad-set', 'rehab-knee-straight-leg-raise', 'rehab-hip-side-lying-abduction', 'clamshell', 'rehab-hip-hike', 'step-down'],
    note: "This is general information, not treatment. Have the injury assessed first, stay below sharp pain, and stop if it swells, gives way, goes numb or is not improving. A knee that locks, gives way or swells needs to be examined before it is called runner's knee.",
  },
  {
    key: 'rehab-knee-early', group: 'rehab', name: "Knee: the early exercises",
    why: "Wake the thigh, regain the bend, straighten the last few degrees.",
    sessionType: 'mindbody', level: 'beginner', minutes: 15, kit: "A mat, a rolled towel",
    prescription: "10 reps of each, holding each contraction 5 seconds, two or three times a day.",
    exercises: ['rehab-ankle-pumps', 'rehab-knee-quad-set', 'rehab-knee-heel-slide', 'rehab-knee-short-arc-quad', 'rehab-knee-straight-leg-raise'],
    note: "This is general information, not treatment. Have the injury assessed first, stay below sharp pain, and stop if it swells, gives way, goes numb or is not improving. After an operation, the limits your surgeon or physiotherapist set come before anything written here.",
  },
  {
    key: 'rehab-patellar-tendon', group: 'rehab', name: "Jumper's knee",
    why: "The tendon below the kneecap: long holds first, then slow loading on a slope.",
    sessionType: 'mindbody', level: 'intermediate', minutes: 20, kit: "A band or strap, a wall, a slanted board",
    prescription: "Holds 5 x 30 to 45 s. Decline squats 3 x 8 to 10, 3 seconds down.",
    exercises: ['rehab-knee-isometric-leg-extension', 'wall-sit', 'spanish-squat', 'rehab-knee-decline-single-leg-squat'],
    note: "This is general information, not treatment. Have the injury assessed first, stay below sharp pain, and stop if it swells, gives way, goes numb or is not improving.",
  },
  {
    key: 'rehab-achilles-heel', group: 'rehab', name: "Achilles and heel",
    why: "The calf and the sole of the foot: stretched, held, then lowered slowly off a step.",
    sessionType: 'mindbody', level: 'beginner', minutes: 20, kit: "A step, a wall, a rolled towel",
    prescription: "Stretches 3 x 30 s. Hold 5 x 30 s. Heel drops 3 x 12 to 15 with the knee straight, then bent.",
    exercises: ['wall-calf-stretch', 'rehab-plantar-fascia-stretch', 'rehab-foot-short-foot', 'calf-raise-iso-hold', 'eccentric-heel-drop', 'rehab-achilles-bent-knee-heel-drop', 'rehab-plantar-towel-calf-raise'],
    note: "This is general information, not treatment. Have the injury assessed first, stay below sharp pain, and stop if it swells, gives way, goes numb or is not improving. A sudden snap or a kick-like pain at the back of the heel is an emergency.",
  },
  {
    key: 'rehab-shoulder-early', group: 'rehab', name: "Shoulder: getting it moving",
    why: "The arm moved without being lifted: swung, slid, helped by the other arm, walked up a wall.",
    sessionType: 'mindbody', level: 'beginner', minutes: 15, kit: "A table, a stick, a wall",
    prescription: "10 reps of each. Holds against the wall 5 x 10 s at a light effort.",
    exercises: ['rehab-shoulder-pendulum', 'rehab-shoulder-table-slide', 'rehab-shoulder-supine-cane-flexion', 'rehab-shoulder-wall-walk', 'rehab-shoulder-isometric-external-rotation', 'rehab-shoulder-isometric-internal-rotation'],
    note: "This is general information, not treatment. Have the injury assessed first, stay below sharp pain, and stop if it swells, gives way, goes numb or is not improving. After an operation, the limits your surgeon or physiotherapist set come before anything written here.",
  },
  {
    key: 'rehab-shoulder-strength', group: 'rehab', name: "Shoulder: rotator cuff and blade",
    why: "Turning out, turning in, the punch that works the serratus, and the muscles that set the shoulder blade.",
    sessionType: 'mindbody', level: 'beginner', minutes: 20, kit: "A light band, a mat, a wall",
    prescription: "3 sets each of 12 to 15 slow reps with a band so light the last rep looks like the first.",
    exercises: ['band-external-rotation', 'rehab-shoulder-band-internal-rotation', 'rehab-shoulder-supine-serratus-punch', 'rehab-shoulder-low-row-isometric', 'prone-w-raise', 'wall-slides'],
    note: "This is general information, not treatment. Have the injury assessed first, stay below sharp pain, and stop if it swells, gives way, goes numb or is not improving.",
  },
  {
    key: 'rehab-lower-back', group: 'rehab', name: "Lower back: gentle movement",
    why: "Small movements lying down, to keep a stiff, sore back moving.",
    sessionType: 'mindbody', level: 'beginner', minutes: 15, kit: "A mat",
    prescription: "10 slow reps of each, stretches held 20 to 30 s. Keep whatever eases it; leave out whatever sharpens it.",
    exercises: ['rehab-back-supine-pelvic-tilt', 'rehab-back-knee-to-chest-stretch', 'rehab-back-lower-trunk-rotation', 'rehab-back-prone-press-up', 'rehab-back-mcgill-curl-up', 'bird-dog'],
    note: "This is general information, not treatment. Have the injury assessed first, stay below sharp pain, and stop if it swells, gives way, goes numb or is not improving. Numbness between the legs, loss of bladder or bowel control, or weakness in a leg is an emergency.",
  },
  {
    key: 'rehab-wrist-hand', group: 'rehab', name: "Wrist and hand",
    why: "The tendons of the fingers glided, the wrist moved in every direction, both sides stretched.",
    sessionType: 'mindbody', level: 'beginner', minutes: 10, kit: "A table",
    prescription: "10 slow reps of each, stretches held 20 to 30 s.",
    exercises: ['rehab-hand-tendon-glides', 'wrist-cars', 'rehab-wrist-radial-ulnar-deviation', 'rehab-wrist-prayer-stretch', 'rehab-wrist-reverse-prayer-stretch'],
    note: "This is general information, not treatment. Have the injury assessed first, stay below sharp pain, and stop if it swells, gives way, goes numb or is not improving.",
  },
  {
    key: 'rehab-neck', group: 'rehab', name: "Neck",
    why: "The deep muscles at the front strengthened, the tight ones at the side and the top eased.",
    sessionType: 'mindbody', level: 'beginner', minutes: 12, kit: "A mat, a chair",
    prescription: "Nods and tucks 10 x 5 s. Stretches 3 x 20 to 30 s a side, gently.",
    exercises: ['rehab-neck-deep-flexor-nod', 'chin-tuck-hold', 'rehab-neck-upper-trapezius-stretch', 'rehab-neck-scalene-stretch', 'levator-scapulae-stretch'],
    note: "This is general information, not treatment. Have the injury assessed first, stay below sharp pain, and stop if it swells, gives way, goes numb or is not improving. Neck pain after a fall or a crash, or with dizziness or arm weakness, needs a doctor first.",
  },

  // ══════════════════════════ SENIORS & THE CHAIR ══════════════════════════
  {
    key: 'gentle-seated-whole-body', group: 'gentle', name: "Seated: the whole body",
    why: "Every part of the body moved without leaving the chair, finishing by standing up from it.",
    sessionType: 'calisthenics', level: 'beginner', minutes: 20, kit: "A sturdy chair without wheels",
    prescription: "10 reps of each, unhurried. March for 1 minute. Twice through if it feels good.",
    exercises: ['chair-seated-march', 'chair-seated-shoulder-rolls', 'chair-seated-arm-raises', 'chair-seated-knee-extension', 'chair-seated-heel-raise', 'chair-seated-torso-twist', 'chair-sit-to-stand-hands-assisted'],
    note: "Use a sturdy chair that cannot slide, on a floor that is not slippery. Stop for dizziness, chest pain, or breathlessness that stops you talking.",
  },
  {
    key: 'gentle-seated-stretch', group: 'gentle', name: "Seated: loosening up",
    why: "Neck to ankles, sitting down. A good start to a morning.",
    sessionType: 'mindbody', level: 'beginner', minutes: 12, kit: "A sturdy chair without wheels",
    prescription: "5 slow reps of each movement. Stretches held 15 to 20 s, never bounced.",
    exercises: ['chair-seated-neck-rotation', 'chair-seated-shoulder-rolls', 'chair-seated-chest-stretch', 'chair-seated-side-bend', 'chair-seated-cat-cow', 'chair-seated-hamstring-stretch', 'chair-seated-ankle-circles'],
    note: "Use a sturdy chair that cannot slide, on a floor that is not slippery. Stop for dizziness, chest pain, or breathlessness that stops you talking.",
  },
  {
    key: 'gentle-seated-cardio', group: 'gentle', name: "Seated: getting warm",
    why: "The heart and lungs worked from a chair: marching, tapping, punching, arms and legs together.",
    sessionType: 'cardio', level: 'beginner', minutes: 12, kit: "A sturdy chair without wheels",
    prescription: "1 minute of each with 30 s of rest. You should feel warm and still be able to talk.",
    exercises: ['chair-seated-march', 'chair-seated-toe-raise', 'chair-seated-heel-raise', 'chair-seated-boxing', 'chair-seated-jumping-jacks'],
    note: "Use a sturdy chair that cannot slide, on a floor that is not slippery. Stop for dizziness, chest pain, or breathlessness that stops you talking.",
  },
  {
    key: 'gentle-seated-bands', group: 'gentle', name: "Seated: strength with a band",
    why: "Push, pull, curl, open the knees, straighten the legs. A light band is enough.",
    sessionType: 'strength', level: 'beginner', minutes: 20, kit: "A sturdy chair, a light band",
    prescription: "2 sets each of 10 to 12 slow reps, resting as long as you need.",
    exercises: ['chair-seated-band-chest-press', 'band-seated-row', 'chair-seated-band-biceps-curl', 'chair-seated-band-hip-abduction', 'chair-seated-knee-extension'],
    note: "Use a sturdy chair that cannot slide, on a floor that is not slippery. Stop for dizziness, chest pain, or breathlessness that stops you talking.",
  },
  {
    key: 'gentle-standing-strength', group: 'gentle', name: "Standing: strength beside a chair",
    why: "The legs that get you out of a chair and up the stairs, with a hand on something solid.",
    sessionType: 'calisthenics', level: 'beginner', minutes: 20, kit: "A sturdy chair or a kitchen counter, a wall",
    prescription: "2 sets each of 8 to 10 slow reps. Lower more slowly than you rise.",
    exercises: ['chair-sit-to-stand-slow-lowering', 'chair-supported-heel-raise', 'chair-supported-knee-bend', 'chair-supported-side-leg-raise', 'chair-supported-back-leg-raise', 'chair-supported-knee-curl', 'wall-push-up'],
    note: "Stand beside a kitchen counter or a sturdy chair you can hold. Stop for dizziness, chest pain, or breathlessness that stops you talking.",
  },
  {
    key: 'gentle-balance', group: 'gentle', name: "Balance",
    why: "Feet together, one in front of the other, on one leg, then walking: sideways, on the heels, in a figure of eight.",
    sessionType: 'mindbody', level: 'beginner', minutes: 15, kit: "A kitchen counter to walk along",
    prescription: "Stands 3 x 10 to 30 s. Walks 10 steps each way, twice.",
    exercises: ['senior-tandem-stand', 'chair-supported-single-leg-stand', 'senior-sideways-walking', 'senior-heel-walking', 'senior-clock-reach', 'senior-figure-of-eight-walking'],
    note: "Stand beside a kitchen counter or a sturdy chair you can hold. Stop for dizziness, chest pain, or breathlessness that stops you talking. If you have fallen in the last year, ask your doctor about a supervised balance class.",
  },
  {
    key: 'gentle-everyday', group: 'gentle', name: "The things the day asks for",
    why: "Standing from a chair, stepping over things, climbing stairs, getting down to the floor and up again.",
    sessionType: 'calisthenics', level: 'beginner', minutes: 20, kit: "A sturdy chair, stairs with a handrail, a mat",
    prescription: "5 to 8 reps of each. Floor-to-stand: 2 or 3 times, next to the chair.",
    exercises: ['chair-squat', 'senior-stepping-over-obstacles', 'senior-stair-climbing-handrail', 'senior-timed-up-and-go-practice', 'senior-floor-to-stand-practice'],
    note: "Stand beside a kitchen counter or a sturdy chair you can hold. Stop for dizziness, chest pain, or breathlessness that stops you talking. Practise getting down to the floor only with someone in the house the first time.",
  },

  // ══════════════════════════ PREGNANCY & AFTER BIRTH ══════════════════════════
  {
    key: 'mother-pregnancy-mobility', group: 'mother', name: "Pregnancy: daily mobility",
    why: "Hands and knees takes the weight of the bump off the back. Tilts, rocking, circles, a rest, the breath.",
    sessionType: 'mindbody', level: 'beginner', minutes: 12, kit: "A mat, cushions",
    prescription: "8 to 10 slow reps of each, the rest held up to a minute. Breathe throughout.",
    exercises: ['prenatal-pelvic-tilt-all-fours', 'prenatal-all-fours-rocking', 'prenatal-standing-hip-circles', 'prenatal-wide-knee-childs-pose', 'prenatal-360-breathing'],
    note: "Agree this with your midwife or doctor. Stop and call them for bleeding, leaking fluid, dizziness, chest pain, calf pain or swelling, regular painful contractions, or if the baby moves less.",
  },
  {
    key: 'mother-pregnancy-strength', group: 'mother', name: "Pregnancy: strength",
    why: "Legs, hips and the deep abdominals, all holding on to something, none lying flat.",
    sessionType: 'calisthenics', level: 'beginner', minutes: 25, kit: "A sturdy chair or counter, a mat, a wedge or firm cushions",
    prescription: "2 sets each of 8 to 12 reps at an effort where you could still talk. Breathe out on the effort.",
    exercises: ['prenatal-supported-squat', 'prenatal-sumo-squat-supported', 'prenatal-side-lying-leg-lift', 'prenatal-incline-glute-bridge', 'prenatal-side-plank-knees', 'prenatal-tva-activation'],
    note: "Agree this with your midwife or doctor. Stop and call them for bleeding, leaking fluid, dizziness, chest pain, calf pain or swelling, regular painful contractions, or if the baby moves less. Never hold your breath, and do not lie flat on your back for long after the first trimester.",
  },
  {
    key: 'mother-birth-ball', group: 'mother', name: "Pregnancy: on the birth ball",
    why: "Circles, figures of eight and a small bounce, then the breath. Comfortable for a sore back.",
    sessionType: 'mindbody', level: 'beginner', minutes: 12, kit: "An anti-burst birth ball on a floor that does not slip, a wall within reach",
    prescription: "1 to 2 minutes of each, changing direction halfway.",
    exercises: ['prenatal-birth-ball-pelvic-circles', 'prenatal-birth-ball-figure-eights', 'prenatal-birth-ball-bounce', 'prenatal-360-breathing'],
    note: "Agree this with your midwife or doctor. Stop and call them for bleeding, leaking fluid, dizziness, chest pain, calf pain or swelling, regular painful contractions, or if the baby moves less. Have someone steady you the first time you sit on the ball.",
  },
  {
    key: 'mother-backache', group: 'mother', name: "Pregnancy: for backache",
    why: "Pelvic tilts standing and on all fours, circles, and a supported rest.",
    sessionType: 'mindbody', level: 'beginner', minutes: 10, kit: "A wall, a mat, cushions",
    prescription: "10 slow tilts of each kind, 1 minute of circles, 1 minute of rest.",
    exercises: ['prenatal-pelvic-tilt-standing', 'prenatal-pelvic-tilt-all-fours', 'prenatal-standing-hip-circles', 'prenatal-wide-knee-childs-pose'],
    note: "Agree this with your midwife or doctor. Stop and call them for bleeding, leaking fluid, dizziness, chest pain, calf pain or swelling, regular painful contractions, or if the baby moves less. Back pain that comes and goes in a regular rhythm may be labour: call your maternity unit.",
  },
  {
    key: 'mother-birth-preparation', group: 'mother', name: "Late pregnancy: preparing for birth",
    why: "Letting go is the skill: the slow breath, the pelvic floor softened, a supported squat, a rest on the side.",
    sessionType: 'mindbody', level: 'beginner', minutes: 20, kit: "A birth ball or chair, blocks or a low stool, pillows",
    prescription: "3 to 5 minutes of each breathing practice. Squat hold 3 x 20 to 30 s. Finish with 5 minutes on your side.",
    exercises: ['prenatal-labour-breathing', 'prenatal-pelvic-floor-relaxation', 'prenatal-supported-deep-squat-hold', 'prenatal-all-fours-rocking', 'prenatal-side-lying-rest'],
    note: "Agree this with your midwife or doctor. Stop and call them for bleeding, leaking fluid, dizziness, chest pain, calf pain or swelling, regular painful contractions, or if the baby moves less. Ask before the deep squat if you have a low-lying placenta, a breech baby, a cervical stitch or pelvic girdle pain.",
  },
  {
    key: 'mother-after-first-weeks', group: 'mother', name: "After birth: the first weeks",
    why: "Breath, pelvic floor and the deep abdominals, lying down. Small, and the base of everything that follows.",
    sessionType: 'mindbody', level: 'beginner', minutes: 10, kit: "A bed or a mat",
    prescription: "5 to 10 gentle reps of each, once or twice a day, on the days you feel up to it.",
    exercises: ['postnatal-reconnection-breathing', 'postnatal-pelvic-floor-lying', 'postnatal-tva-activation-lying', 'postnatal-pelvic-tilt-lying', 'postnatal-knee-rolls'],
    note: "Start after your midwife or doctor agrees, later after a caesarean. A doming abdomen, leaking, heaviness in the pelvis, pain or heavier bleeding mean go back a stage and ask.",
  },
  {
    key: 'mother-after-core', group: 'mother', name: "After birth: the core returns",
    why: "The legs begin to move while the trunk holds still: slides, fall-outs, taps, a bridge.",
    sessionType: 'calisthenics', level: 'beginner', minutes: 15, kit: "A mat, socks",
    prescription: "2 sets each of 8 to 10 slow reps. Move on a stage only when the one before is easy and the tummy stays flat.",
    exercises: ['postnatal-reconnection-breathing', 'postnatal-heel-slide', 'postnatal-bent-knee-fall-out', 'postnatal-toe-tap', 'postnatal-glute-bridge', 'prenatal-side-plank-knees'],
    note: "Start after your midwife or doctor agrees, later after a caesarean. A doming abdomen, leaking, heaviness in the pelvis, pain or heavier bleeding mean go back a stage and ask.",
  },
  {
    key: 'mother-after-strength', group: 'mother', name: "After birth: strength for carrying",
    why: "Legs for lifting, the upper back for feeding and carrying, the hips for everything.",
    sessionType: 'calisthenics', level: 'beginner', minutes: 20, kit: "A sturdy chair, a light band, a mat",
    prescription: "2 sets each of 8 to 12 reps, breathing out on the effort.",
    exercises: ['postnatal-posture-reset', 'postnatal-squat-to-chair', 'postnatal-glute-bridge', 'postnatal-standing-band-row', 'prenatal-side-lying-leg-lift'],
    note: "Start after your midwife or doctor agrees, later after a caesarean. A doming abdomen, leaking, heaviness in the pelvis, pain or heavier bleeding mean go back a stage and ask.",
  },
  // ══════════════════════════ PILATES ══════════════════════════
  {
    key: 'pilates-first-class', group: 'pilates', name: "Pilates: the first class",
    why: "The breath, the neutral pelvis and the curl, then the first exercises of the order. Everything later is built on these.",
    sessionType: 'pilates', level: 'beginner', minutes: 25, kit: "A mat",
    prescription: "6 to 8 slow reps of each. Breathe out as you curl or reach, in as you return.",
    exercises: ['pilates-lateral-breathing', 'pilates-chest-lift', 'pilates-pelvic-curl', 'pilates-single-leg-circles', 'pilates-single-leg-stretch', 'pilates-spine-stretch-forward', 'pilates-swimming'],
  },
  {
    key: 'pilates-classical-mat', group: 'pilates', name: "Classical mat, in order",
    why: "The beginner to intermediate mat order of Joseph Pilates, each exercise flowing into the next.",
    sessionType: 'pilates', level: 'intermediate', minutes: 45, kit: "A mat",
    prescription: "5 to 10 reps of each, as one flow. The hundred is 100 pumps of the arms, 5 counts in and 5 out.",
    exercises: ['pilates-hundred', 'pilates-roll-up', 'pilates-single-leg-circles', 'pilates-rolling-like-a-ball', 'pilates-single-leg-stretch', 'pilates-double-leg-stretch', 'pilates-spine-stretch-forward', 'pilates-saw', 'pilates-swan', 'pilates-single-leg-kick', 'pilates-side-kick-series', 'pilates-teaser', 'pilates-seal', 'pilates-push-up'],
    note: "Keep the head down and rest it whenever the neck takes over from the abdominals. Leave out the rolling exercises with a neck or back injury, osteoporosis, or late in pregnancy.",
  },
  {
    key: 'pilates-abdominal-series', group: 'pilates', name: "The abdominal series",
    why: "The five of the series back to back, then the teaser, the plank and the side bend.",
    sessionType: 'pilates', level: 'intermediate', minutes: 25, kit: "A mat",
    prescription: "8 to 10 reps of each with no rest inside the series. 2 rounds if the first was clean.",
    exercises: ['pilates-hundred', 'pilates-single-leg-stretch', 'pilates-double-leg-stretch', 'pilates-scissors', 'pilates-criss-cross', 'pilates-teaser', 'pilates-leg-pull-front', 'pilates-side-bend'],
    note: "Keep the head down and rest it whenever the neck takes over from the abdominals. Leave out the rolling exercises with a neck or back injury, osteoporosis, or late in pregnancy.",
  },
  {
    key: 'pilates-back-posture', group: 'pilates', name: "Pilates for the back",
    why: "Articulation of the spine, then the extension that sitting all day leaves out.",
    sessionType: 'pilates', level: 'beginner', minutes: 25, kit: "A mat",
    prescription: "6 to 8 slow reps of each. Lengthen before you lift; the lift is small.",
    exercises: ['pilates-pelvic-curl', 'pilates-shoulder-bridge', 'pilates-spine-stretch-forward', 'pilates-swan', 'pilates-single-leg-kick', 'pilates-double-leg-kick', 'pilates-swimming', 'pilates-mermaid'],
    note: "Stop for a pinch in the lower back. Back pain with numbness, weakness or pain down the leg needs to be seen before exercise.",
  },
  {
    key: 'pilates-reformer-class', group: 'pilates', name: "Reformer class",
    why: "Footwork, the hundred, straps and rowing, then the elephant, knee stretches and the long stretch. Springs set by the studio.",
    sessionType: 'pilates', level: 'intermediate', minutes: 50, kit: "A reformer, with an instructor until you know the springs",
    prescription: "8 to 10 reps of each. Lighter springs make the core work harder, heavier springs make the legs work harder.",
    exercises: ['reformer-footwork', 'reformer-hundred', 'reformer-feet-in-straps', 'reformer-rowing-series', 'reformer-stomach-massage', 'reformer-elephant', 'reformer-knee-stretches', 'reformer-long-stretch', 'reformer-short-box-series', 'reformer-side-splits', 'reformer-running'],
    note: "Learn the springs and the straps with an instructor first. The carriage moves: never step on or off it while it is free.",
  },
  {
    key: 'pilates-advanced-mat', group: 'pilates', name: "Advanced mat",
    why: "The second half of the classical order, for those who flow through the first: roll over, corkscrew, jackknife, boomerang.",
    sessionType: 'pilates', level: 'advanced', minutes: 50, kit: "A mat",
    prescription: "3 to 5 reps of each, after the hundred and the roll-up as a warm-up.",
    exercises: ['pilates-hundred', 'pilates-roll-up', 'pilates-roll-over', 'pilates-corkscrew', 'pilates-open-leg-rocker', 'pilates-neck-pull', 'pilates-scissors', 'pilates-bicycle', 'pilates-jackknife', 'pilates-boomerang', 'pilates-control-balance', 'pilates-leg-pull-back'],
    note: "Keep the head down and rest it whenever the neck takes over from the abdominals. Leave out the rolling exercises with a neck or back injury, osteoporosis, or late in pregnancy. Never roll onto the neck: the weight stays on the shoulder blades.",
  },
  {
    key: 'pilates-props', group: 'pilates', name: "Pilates with the ring, the ball and the roller",
    why: "Small props give feedback the floor cannot: the ring finds the inner thighs, the roller finds your balance.",
    sessionType: 'pilates', level: 'beginner', minutes: 30, kit: "A mat, a magic circle, a small soft ball, a long foam roller",
    prescription: "8 to 10 slow reps of each. Squeeze the ring gently; it is feedback, not a weight.",
    exercises: ['pilates-magic-circle-bridge-squeeze', 'pilates-magic-circle-chest-press', 'pilates-magic-circle-side-lying-leg-press', 'pilates-small-ball-chest-lift', 'pilates-small-ball-roll-back', 'pilates-foam-roller-arm-arcs', 'pilates-foam-roller-marching', 'pilates-foam-roller-swan'],
  },
  {
    key: 'pilates-mat-second-half', group: 'pilates', name: "The rest of the mat order",
    why: "The exercises the first half leaves out: swan dive, spine twist, the side kicks in full, crab, rocking.",
    sessionType: 'pilates', level: 'advanced', minutes: 40, kit: "A mat",
    prescription: "3 to 6 reps of each, after the hundred and the roll-up to warm up.",
    exercises: ['pilates-hundred', 'pilates-roll-up', 'pilates-swan-dive', 'pilates-spine-twist', 'pilates-side-kick-front-back', 'pilates-side-kick-small-circles', 'pilates-side-kick-bicycle', 'pilates-teaser-ii', 'pilates-hip-twist', 'pilates-kneeling-side-kick', 'pilates-side-twist', 'pilates-crab', 'pilates-rocking'],
    note: "Keep the head down and rest it whenever the neck takes over from the abdominals. Leave out the rolling exercises with a neck or back injury, osteoporosis, or late in pregnancy. Crab and rocking load the neck and the lower back: leave them out until the rest of the order is easy.",
  },
  {
    key: 'pilates-cadillac-chair', group: 'pilates', name: "Cadillac and Wunda chair",
    why: "Springs from above and springs from below: the roll back bar, the leg springs, then the chair for legs and balance.",
    sessionType: 'pilates', level: 'intermediate', minutes: 50, kit: "A Cadillac and a Wunda chair, in a studio",
    prescription: "6 to 8 reps of each, springs set by the instructor.",
    exercises: ['cadillac-roll-back-bar', 'cadillac-seated-push-through', 'cadillac-leg-spring-circles', 'cadillac-leg-spring-frog', 'cadillac-standing-arm-springs', 'wunda-chair-footwork', 'wunda-chair-swan-front', 'wunda-chair-going-up-front'],
    note: "Learn the springs with an instructor. Never let go of a loaded bar or pedal: let it return under control.",
  },
  {
    key: 'pilates-barrels', group: 'pilates', name: "The barrels",
    why: "The ladder barrel and the spine corrector open the front of the body and strengthen the back and the sides.",
    sessionType: 'pilates', level: 'intermediate', minutes: 35, kit: "A ladder barrel and a spine corrector",
    prescription: "5 to 8 reps of each, the stretches held 30 to 45 s.",
    exercises: ['spine-corrector-arm-series', 'spine-corrector-leg-series', 'spine-corrector-swan', 'ladder-barrel-swan', 'ladder-barrel-side-sit-ups', 'ladder-barrel-short-box', 'ladder-barrel-ballet-stretches'],
    note: "Stop for a pinch in the lower back. Side sit-ups are hard on the neck and the back: start with small ranges.",
  },

  // ══════════════════════════ HYROX ══════════════════════════
  {
    key: 'hyrox-first-stations', group: 'hyrox', name: "Hyrox: learn the stations",
    why: "Every station once, at half the race volume, walking between them. Technique first, speed later.",
    sessionType: 'hyrox', level: 'beginner', minutes: 45, kit: "A gym with a SkiErg, a rower, a sled, kettlebells, a sandbag and a wall ball",
    prescription: "1 round at half volume: 500 m ski, 25 m sled push and pull, 40 m burpee jumps, 500 m row, 100 m carry, 50 m lunges, 50 wall balls.",
    exercises: ['hyrox-skierg-1000', 'hyrox-sled-push-50', 'hyrox-sled-pull-50', 'hyrox-burpee-broad-jump-80', 'hyrox-row-1000', 'hyrox-farmers-carry-200', 'hyrox-sandbag-lunges-100', 'hyrox-wall-balls-100'],
    note: "Hyrox is a trademark of its owners; FitCoach is not connected to the race. Build the volume over weeks, and stop for chest pain, dizziness or a pain that changes how you move.",
  },
  {
    key: 'hyrox-race-pace-runs', group: 'hyrox', name: "Hyrox: race-pace kilometres",
    why: "The eight kilometres are more than half the race. Goal pace, rehearsed, measured by GPS laps.",
    sessionType: 'hyrox', level: 'intermediate', minutes: 50, kit: "Running shoes, the phone for GPS laps",
    prescription: "Warm-up kilometre easy, then 6 to 8 x 1 km at goal pace with 90 s rest. Set the laps to 1 km.",
    exercises: ['hyrox-run-1km', 'hybrid-1km-race-pace-repeats', 'hyrox-roxzone-transitions'],
    note: "Hyrox is a trademark of its owners; FitCoach is not connected to the race. Build the volume over weeks, and stop for chest pain, dizziness or a pain that changes how you move.",
  },
  {
    key: 'hyrox-compromised-runs', group: 'hyrox', name: "Hyrox: compromised running",
    why: "A hard station, then a kilometre straight away. The legs learn to run after they have worked.",
    sessionType: 'hyrox', level: 'intermediate', minutes: 55, kit: "A gym with a wall ball and a sandbag, a treadmill or a loop outside",
    prescription: "5 rounds: one station block, then 1 km at race pace. Rest 2 minutes between rounds.",
    exercises: ['hybrid-compromised-running', 'hyrox-wall-ball-unbroken-sets', 'hyrox-run-1km', 'hyrox-sandbag-lunges-100', 'hyrox-burpee-broad-jump-pacing'],
    note: "Hyrox is a trademark of its owners; FitCoach is not connected to the race. Build the volume over weeks, and stop for chest pain, dizziness or a pain that changes how you move.",
  },
  {
    key: 'hyrox-erg-engine', group: 'hyrox', name: "Hyrox: the erg engine",
    why: "The two machine stations as intervals. Even splits are the skill.",
    sessionType: 'hyrox', level: 'intermediate', minutes: 45, kit: "A SkiErg and a rower",
    prescription: "8 x 250 m ski with 60 s rest, then 5 x 500 m row with equal rest.",
    exercises: ['hyrox-skierg-250-repeats', 'hyrox-row-500-repeats', 'hyrox-roxzone-transitions'],
    note: "Hyrox is a trademark of its owners; FitCoach is not connected to the race. Build the volume over weeks, and stop for chest pain, dizziness or a pain that changes how you move.",
  },
  {
    key: 'hyrox-sleds-carries', group: 'hyrox', name: "Hyrox: sleds and carries",
    why: "The heavy half of the race. Heavier than race weight in training, so race weight feels light.",
    sessionType: 'hyrox', level: 'advanced', minutes: 60, kit: "A sled on turf, kettlebells or farmers handles, a sandbag",
    prescription: "6 x 25 m heavy sled push, full rest. 4 x 25 m sled pull. 4 x 50 m heavy carry. 2 x 50 m lunges.",
    exercises: ['hyrox-sled-push-intervals', 'hyrox-sled-pull-50', 'hyrox-farmers-carry-200', 'hyrox-sandbag-lunges-100'],
    note: "Hyrox is a trademark of its owners; FitCoach is not connected to the race. Build the volume over weeks, and stop for chest pain, dizziness or a pain that changes how you move. Brace before each push and pull, and keep the back flat.",
  },
  {
    key: 'hyrox-half-simulation', group: 'hyrox', name: "Hyrox: half simulation",
    why: "Four runs and four stations in race order. Race rhythm without a whole race of fatigue.",
    sessionType: 'hyrox', level: 'advanced', minutes: 50, kit: "A gym with the stations and room to run",
    prescription: "4 x (1 km run + one station at race volume). Note every split; the last run should be no slower than the first.",
    exercises: ['hybrid-half-race-simulation', 'hyrox-run-1km', 'hyrox-skierg-1000', 'hyrox-sled-push-50', 'hyrox-row-1000', 'hyrox-wall-balls-100'],
    note: "Hyrox is a trademark of its owners; FitCoach is not connected to the race. Build the volume over weeks, and stop for chest pain, dizziness or a pain that changes how you move.",
  },
  {
    key: 'hyrox-bricks', group: 'hyrox', name: "Hyrox: run and station bricks",
    why: "One kilometre, then a station, then straight back out. The transition is where races are lost.",
    sessionType: 'hyrox', level: 'intermediate', minutes: 60, kit: "A gym with a sled, a SkiErg, a wall ball and room to run",
    prescription: "4 bricks of 1 km plus a station at race volume, 3 minutes easy between bricks.",
    exercises: ['hyrox-run-skierg-brick', 'hyrox-run-sled-push-brick', 'hyrox-burpee-run-brick', 'hyrox-run-wall-ball-brick', 'hyrox-roxzone-sprint-drill'],
    note: "Hyrox is a trademark of its owners; FitCoach is not connected to the race. Build the volume over weeks, and stop for chest pain, dizziness or a pain that changes how you move.",
  },
  {
    key: 'hyrox-pro-stations', group: 'hyrox', name: "Hyrox Pro: the heavy stations",
    why: "The Pro division changes the weights, not the distances: rehearse the four heavy stations at Pro load.",
    sessionType: 'hyrox', level: 'advanced', minutes: 60, kit: "A sled on turf, Pro-weight kettlebells, a sandbag and a wall ball",
    prescription: "2 rounds of the four at half race distance, full rest between stations.",
    exercises: ['hyrox-pro-sled-push-50', 'hyrox-pro-sled-pull-50', 'hyrox-pro-farmers-carry-200', 'hyrox-pro-sandbag-lunges-100', 'hyrox-pro-wall-balls-100'],
    note: "Hyrox is a trademark of its owners; FitCoach is not connected to the race. Build the volume over weeks, and stop for chest pain, dizziness or a pain that changes how you move. Brace before each push and pull, and keep the back flat.",
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
