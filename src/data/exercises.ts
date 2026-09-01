import type {
  EquipmentType,
  MovementPattern,
  SessionType,
  TrackingType,
} from '@/db/schema';
import { SUB_MUSCLE_TAGS } from './subMuscleTags';
import { difficultyOf, type Difficulty } from '@/lib/exerciseDifficulty';

/**
 * Built-in exercise & activity library.
 *
 * Organized by muscle group and split by equipment family (barbell / dumbbell /
 * machine-cable / bodyweight), per the training reference.
 *
 * ⚠️ `slug` is the stable natural key used by src/db/seed.ts to UPSERT the
 * library. Never change or reuse a slug, and never rename an existing `name`
 * carelessly — ids must stay stable so `exercise_logs` keep pointing at the
 * right exercise. Adding new entries is always safe.
 */
export interface SeedExercise {
  slug: string;
  name: string;
  category: string;
  sessionType: SessionType;
  muscleGroups: string[];
  primaryMuscle?: string;
  /** finer target within the muscle group (lats, traps, front_delt, …) */
  subMuscle?: string;
  equipmentType?: EquipmentType;
  equipment?: string;
  pattern?: MovementPattern;
  description?: string;
  /** step-by-step cues for beginners; falls back to PATTERN_CUES if omitted */
  instructions?: string[];
  trackingType: TrackingType;
  icon: string;
  met?: number;
  /**
   * How hard it is, 1-5 (see lib/exerciseDifficulty for what each number
   * means). Authored where it is known; derived from equipment and movement
   * pattern otherwise, with named skills overriding both. Every entry in
   * EXERCISE_LIBRARY carries one by the time it is exported.
   */
  difficulty?: Difficulty;
  /**
   * This entry is the same movement as `aliasOf` under an older/newer slug.
   * Both rows stay in the database forever (logs point at them), but the
   * library browser lists only the primary, and prefills reference only the
   * primary — so history stops splitting across two ids from here on.
   */
  aliasOf?: string;
}

/** Human labels for sub-muscles (v2 reference: every muscle individually). */
export const SUB_MUSCLE_LABELS: Record<string, string> = {
  lats: 'Lats (width)',
  traps: 'Traps',
  mid_back: 'Mid-Back / Rhomboids',
  lower_back: 'Lower Back',
  front_delt: 'Front Delt',
  side_delt: 'Side Delt',
  rear_delt: 'Rear Delt',
  upper_abs: 'Upper Abs',
  lower_abs: 'Lower Abs',
  obliques: 'Obliques',
  // Chest
  upper_chest: 'Upper Chest',
  mid_chest: 'Mid Chest',
  lower_chest: 'Lower Chest',
  // Arms
  triceps_long: 'Triceps (long head)',
  triceps_lateral: 'Triceps (lateral/medial)',
  biceps_long: 'Biceps (long head)',
  biceps_short: 'Biceps (short head)',
  brachialis: 'Brachialis',
  brachioradialis: 'Brachioradialis',
  // Forearms
  wrist_flexors: 'Wrist Flexors',
  wrist_extensors: 'Wrist Extensors',
  grip: 'Grip / Crush',
  // Legs
  rectus_femoris: 'Rectus Femoris',
  vastus: 'Vastus (outer/inner quad)',
  glute_max: 'Gluteus Maximus',
  glute_med: 'Gluteus Medius',
  gastrocnemius: 'Gastrocnemius',
  soleus: 'Soleus',
  adductors: 'Adductors',
  // Neck
  neck_flexors: 'Neck Flexors (front — SCM, deep flexors)',
  neck_extensors: 'Neck Extensors (back — splenius, suboccipitals)',
  neck_lateral: 'Neck Side Flexors / Rotators (scalenes)',
};

/**
 * Mandatory warm-up before working sets, per muscle group (v2 reference).
 * Shown as a checklist at the top of every strength/calisthenics session.
 */
export const WARMUPS_BY_MUSCLE: Record<string, string> = {
  chest: 'Arm circles ×15, then 1 light set of push-ups or band presses',
  back: 'Scapular pull-ups or band pull-aparts ×15',
  shoulders: 'Arm circles ×15 + band pull-aparts ×15 (front/side/rear)',
  biceps: 'Light band curls ×15',
  triceps: 'Bench dips ×10 or light overhead triceps stretch',
  quads: 'Bodyweight squats ×15 + leg swings',
  hamstrings: 'Leg swings + 1 light RDL set (bar only)',
  glutes: 'Bodyweight glute bridges ×15–20',
  calves: 'Ankle circles + bodyweight calf raises ×20',
  core: 'Cat-camel ×10 + pelvic tilts ×15',
  forearms: 'Wrist circles + light grip squeezes ×20',
  neck: 'Slow nods, turns and tilts ×10 each way, then one round of light 4-way isometric holds (10 s each) — never start the neck cold',
};

/** Generic form cues shown when an exercise has no bespoke instructions. */
export const PATTERN_CUES: Record<MovementPattern, string[]> = {
  horizontal_push: [
    'Set your shoulder blades back and down, chest up.',
    'Lower the weight under control to your mid-chest.',
    'Press away without flaring your elbows to 90° — keep them ~45°.',
  ],
  vertical_push: [
    'Brace your core and squeeze your glutes so you don\'t arch your lower back.',
    'Press straight overhead, finishing with biceps near your ears.',
    'Lower under control to chin/shoulder height.',
  ],
  horizontal_pull: [
    'Hinge forward with a flat back, or use a chest support.',
    'Pull with your elbows, driving them back toward your hips.',
    'Squeeze the shoulder blades together, then lower with control.',
  ],
  vertical_pull: [
    'Start from a full hang / full stretch of the lats.',
    'Pull your elbows down and in toward your ribs; lead with the chest.',
    'Control the way back up — don\'t just drop.',
  ],
  squat: [
    'Feet about shoulder-width, toes slightly out; brace your core.',
    'Sit down and back, knees tracking over your toes, chest tall.',
    'Descend to at least parallel if mobility allows, then drive up through mid-foot.',
  ],
  hinge: [
    'Soft knees. Push your hips BACK, not down — this is a hinge, not a squat.',
    'Keep the bar/weight close to your legs and your back flat throughout.',
    'Stand up by driving your hips forward and squeezing your glutes.',
  ],
  lunge: [
    'Step out and lower straight down — both knees to about 90°.',
    'Keep your torso upright and your front knee over your mid-foot.',
    'Drive through the front heel to return.',
  ],
  curl: [
    'Keep your elbows pinned to your sides — no swinging.',
    'Curl up by contracting the biceps, not by leaning back.',
    'Lower slowly (2–3 s); the negative is where the growth is.',
  ],
  triceps_extension: [
    'Keep your upper arm still — only the forearm moves.',
    'Extend fully and squeeze the triceps at the end.',
    'Return under control without letting the elbow drift.',
  ],
  lateral_raise: [
    'Slight bend in the elbows; lead with the elbows, not the hands.',
    'Raise to about shoulder height — no higher, no momentum.',
    'Lower slowly; light weight is fine here.',
  ],
  calf_raise: [
    'Push all the way up onto the balls of your feet.',
    'Pause at the top for a full squeeze.',
    'Lower slowly until you feel a deep stretch in the calf.',
  ],
  core: [
    'Brace as if bracing for a punch; ribs down, don\'t arch.',
    'Move slowly and deliberately — no jerking.',
    'Breathe; never hold your breath through the whole set.',
  ],
  carry: [
    'Stand tall, shoulders back, core braced.',
    'Walk with controlled steps; don\'t lean.',
    'Grip hard — set the weight down before form breaks.',
  ],
  rotation: [
    'Rotate through your torso, not just your arms.',
    'Keep hips relatively stable; move under control.',
    'Resist the return — that\'s half the work.',
  ],
  cardio: [
    'Warm up 5 minutes at an easy pace.',
    'Hold a pace you can sustain; build gradually week to week.',
    'Cool down and stretch afterwards.',
  ],
  mobility: [
    'Move slowly into the position — never force a stretch.',
    'Breathe deeply and relax into it.',
    'Stop at mild tension, not pain.',
  ],
};

// Compact builder to keep this large table readable.
type Opts = Partial<
  Pick<SeedExercise, 'equipment' | 'description' | 'instructions' | 'trackingType' | 'met' | 'sessionType' | 'subMuscle' | 'aliasOf' | 'difficulty'>
>;
function S(
  slug: string,
  name: string,
  primaryMuscle: string,
  equipmentType: EquipmentType,
  pattern: MovementPattern,
  muscleGroups: string[],
  icon: string,
  opts: Opts = {}
): SeedExercise {
  const isBodyweight = equipmentType === 'bodyweight';
  return {
    slug,
    name,
    category: equipmentType,
    sessionType: opts.sessionType ?? (isBodyweight ? 'calisthenics' : 'strength'),
    muscleGroups,
    primaryMuscle,
    subMuscle: opts.subMuscle,
    equipmentType,
    equipment: opts.equipment ?? equipmentType,
    pattern,
    description: opts.description,
    instructions: opts.instructions,
    trackingType: opts.trackingType ?? 'reps_weight',
    icon,
    met: opts.met ?? (isBodyweight ? 6 : 5),
    difficulty: opts.difficulty,
    aliasOf: opts.aliasOf,
  };
}

const BB = 'strength.barbell';
const DB_ = 'strength.dumbbell';
const MC = 'strength.machine';
const CB = 'strength.cable';
const BW = 'strength.calisthenics';
const NK = 'strength.neck';

const RAW_EXERCISE_LIBRARY: SeedExercise[] = [
  // ══════════════════════════ CHEST ══════════════════════════
  S('bench-press-barbell', 'Barbell Bench Press', 'chest', 'barbell', 'horizontal_push',
    ['chest', 'triceps', 'shoulders'], BB, {
    description: 'The classic horizontal press — the main barbell chest builder.',
    instructions: [
      'Lie flat, eyes under the bar. Grip slightly wider than shoulder-width.',
      'Pull your shoulder blades back and down, feet planted, slight arch.',
      'Lower the bar to your mid-chest with elbows at ~45°, touch lightly.',
      'Press up and slightly back toward your face. Never bounce off the chest.',
    ],
  }),
  S('bench-press-incline-barbell', 'Incline Barbell Bench Press', 'chest', 'barbell', 'horizontal_push',
    ['chest', 'shoulders', 'triceps'], BB, {
    description: 'Bench set to 30–45° — emphasizes the upper chest.',
    instructions: [
      'Set the bench to 30–45°. Any steeper becomes a shoulder press.',
      'Lower the bar to just below your collarbone.',
      'Press up in a straight line, keeping shoulder blades pinned.',
    ],
  }),
  S('bench-press-decline-barbell', 'Decline Barbell Bench Press', 'chest', 'barbell', 'horizontal_push',
    ['chest', 'triceps'], BB, { description: 'Decline angle — emphasizes the lower chest.' }),
  S('bench-press-close-grip', 'Close-Grip Bench Press', 'triceps', 'barbell', 'horizontal_push',
    ['triceps', 'chest'], BB, {
    description: 'Shoulder-width grip — shifts load onto the triceps.',
    instructions: [
      'Grip at about shoulder width — not narrower, or your wrists will complain.',
      'Tuck elbows close to your body as you lower to the lower chest.',
      'Press up, driving through the triceps.',
    ],
  }),
  S('floor-press-barbell', 'Barbell Floor Press', 'chest', 'barbell', 'horizontal_push', ['chest', 'triceps'], BB, {
    description: 'Pressing from the floor — limits range, spares the shoulders.',
  }),
  S('spoto-press', 'Spoto Press', 'chest', 'barbell', 'horizontal_push', ['chest', 'triceps'], BB, {
    description: 'Bench press paused an inch above the chest — kills the bounce.',
  }),
  S('db-bench-press', 'Dumbbell Bench Press', 'chest', 'dumbbell', 'horizontal_push',
    ['chest', 'triceps', 'shoulders'], DB_, {
    description: 'Greater range of motion than the barbell, and each side works alone.',
    instructions: [
      'Sit on the bench with the dumbbells on your thighs, then kick them back as you lie down.',
      'Lower until your elbows are level with your torso — feel the chest stretch.',
      'Press up and slightly together, without clanging the dumbbells.',
    ],
  }),
  S('db-incline-press', 'Incline Dumbbell Press', 'chest', 'dumbbell', 'horizontal_push',
    ['chest', 'shoulders', 'triceps'], DB_, { description: '30–45° incline — upper-chest focused.' }),
  S('db-decline-press', 'Decline Dumbbell Press', 'chest', 'dumbbell', 'horizontal_push', ['chest', 'triceps'], DB_),
  S('db-fly', 'Dumbbell Fly', 'chest', 'dumbbell', 'horizontal_push', ['chest'], DB_, {
    description: 'Isolation — a wide arc that stretches the chest.',
    instructions: [
      'Soft, fixed bend in the elbows — keep that angle the whole set.',
      'Open your arms wide in an arc until you feel a chest stretch.',
      'Hug the weights back together. Go light; this is a stretch, not a press.',
    ],
  }),
  S('db-incline-fly', 'Incline Dumbbell Fly', 'chest', 'dumbbell', 'horizontal_push', ['chest'], DB_),
  S('db-pullover', 'Dumbbell Pullover', 'chest', 'dumbbell', 'vertical_pull', ['chest', 'back', 'core'], DB_, {
    description: 'One dumbbell arcing over the head — hits chest and lats.',
  }),
  S('db-single-arm-press', 'Single-Arm Dumbbell Press', 'chest', 'dumbbell', 'horizontal_push',
    ['chest', 'core', 'triceps'], DB_, { description: 'Unilateral press — big anti-rotation core demand.' }),
  S('db-squeeze-press', 'Squeeze Press', 'chest', 'dumbbell', 'horizontal_push', ['chest', 'triceps'], DB_, {
    description: 'Dumbbells pressed together throughout — constant inner-chest tension.',
  }),
  S('chest-press-machine', 'Chest Press Machine', 'chest', 'machine', 'horizontal_push',
    ['chest', 'triceps', 'shoulders'], MC, {
    description: 'Guided press — the safest way for a beginner to learn to push.',
    instructions: [
      'Set the seat so the handles line up with your mid-chest.',
      'Press out smoothly without locking the elbows hard.',
      'Return slowly until you feel a stretch, then repeat.',
    ],
  }),
  S('pec-deck', 'Pec Deck / Fly Machine', 'chest', 'machine', 'horizontal_push', ['chest'], MC, {
    description: 'Machine fly — isolation with no stabilization needed.',
  }),
  S('cable-crossover', 'Cable Crossover', 'chest', 'cable', 'horizontal_push', ['chest'], CB, {
    description: 'Constant cable tension through a big arc.',
    instructions: [
      'Set the pulleys high, step forward into a split stance.',
      'With a soft elbow bend, bring your hands down and together in front of you.',
      'Squeeze the chest, then let the arms open back up under control.',
    ],
  }),
  S('cable-fly-low-to-high', 'Cable Fly (Low-to-High)', 'chest', 'cable', 'horizontal_push', ['chest'], CB, {
    description: 'Pulleys low, arcing up — upper-chest bias.',
  }),
  S('cable-fly-incline', 'Incline Cable Fly', 'chest', 'cable', 'horizontal_push', ['chest'], CB),
  S('smith-bench-press', 'Smith Machine Bench Press', 'chest', 'machine', 'horizontal_push',
    ['chest', 'triceps'], MC, { description: 'Fixed bar path — good for pressing safely without a spotter.' }),
  S('push-up', 'Push-Up', 'chest', 'bodyweight', 'horizontal_push',
    ['chest', 'triceps', 'shoulders', 'core'], BW, {
    trackingType: 'reps_only',
    met: 4,
    description: 'The foundational bodyweight push.',
    instructions: [
      'Hands slightly wider than shoulders, body in one straight line from head to heels.',
      'Brace your core and squeeze your glutes — no sagging hips.',
      'Lower until your chest is just above the floor, elbows ~45°.',
      'Press back up fully. Too hard? Do them with hands on a bench.',
    ],
  }),
  S('push-up-wide', 'Wide Push-Up', 'chest', 'bodyweight', 'horizontal_push', ['chest', 'shoulders'], BW, {
    trackingType: 'reps_only', met: 4, description: 'Hands wide — more chest, less triceps.',
  }),
  S('push-up-diamond', 'Diamond Push-Up', 'triceps', 'bodyweight', 'horizontal_push', ['triceps', 'chest'], BW, {
    trackingType: 'reps_only', met: 5, description: 'Hands together under the chest — triceps focused.',
    subMuscle: 'triceps_long', aliasOf: 'diamond-push-up',
  }),
  S('push-up-incline', 'Incline Push-Up', 'chest', 'bodyweight', 'horizontal_push', ['chest', 'triceps'], BW, {
    trackingType: 'reps_only', met: 3.5,
    description: 'Hands elevated on a bench — the easiest push-up. Start here if a full push-up is too hard.',
    // Hands up = torso inclined = the force line runs through the LOWER chest.
    // (It is the incline BENCH that hits the upper chest — the push-up flips.)
    subMuscle: 'lower_chest', aliasOf: 'incline-pushup',
  }),
  S('push-up-decline', 'Decline Push-Up', 'chest', 'bodyweight', 'horizontal_push', ['chest', 'shoulders'], BW, {
    trackingType: 'reps_only', met: 5, description: 'Feet elevated — harder, upper-chest bias.',
    aliasOf: 'decline-push-up',
  }),
  S('push-up-archer', 'Archer Push-Up', 'chest', 'bodyweight', 'horizontal_push', ['chest', 'triceps'], BW, {
    trackingType: 'reps_only', met: 6, description: 'Shifting onto one arm — a step toward the one-arm push-up.',
    aliasOf: 'archer-push-up',
  }),
  S('ring-push-up', 'Ring Push-Up', 'chest', 'bodyweight', 'horizontal_push', ['chest', 'core', 'shoulders'], BW, {
    trackingType: 'reps_only', met: 5, description: 'Unstable rings — huge stabilizer demand.',
  }),
  S('dip', 'Dip', 'chest', 'bodyweight', 'horizontal_push', ['chest', 'triceps', 'shoulders'], BW, {
    equipment: 'parallel bars', met: 8,
    description: 'Lean forward for chest, stay upright for triceps.',
    instructions: [
      'Support yourself on the bars, arms locked, shoulders down (not shrugged).',
      'Lean your torso forward slightly to bias the chest.',
      'Lower until your upper arms are about parallel to the floor.',
      'Press back up. Use an assisted-dip machine or a band if you can\'t do one yet.',
    ],
  }),

  // ══════════════════════════ BACK ══════════════════════════
  S('barbell-row', 'Barbell Row', 'back', 'barbell', 'horizontal_pull', ['back', 'biceps'], BB, {
    description: 'Bent-over row — the barbell back builder.',
    instructions: [
      'Hinge at the hips until your torso is ~45° or lower, back flat.',
      'Let the bar hang at arm\'s length, then pull it to your lower ribs/navel.',
      'Drive your elbows back and squeeze your shoulder blades together.',
      'Lower under control. Don\'t heave with your lower back.',
    ],
  }),
  S('pendlay-row', 'Pendlay Row', 'back', 'barbell', 'horizontal_pull', ['back', 'biceps'], BB, {
    description: 'Row from a dead stop on the floor each rep, torso parallel.',
  }),
  S('t-bar-row', 'T-Bar Row', 'back', 'barbell', 'horizontal_pull', ['back', 'biceps'], BB, {
    description: 'Landmine/T-bar row — heavy mid-back loading.',
  }),
  S('yates-row', 'Yates Row', 'back', 'barbell', 'horizontal_pull', ['back', 'biceps'], BB, {
    description: 'More upright underhand row — lats and lower traps.',
  }),
  S('deadlift', 'Barbell Deadlift', 'back', 'barbell', 'hinge',
    ['hamstrings', 'glutes', 'back', 'core'], BB, {
    met: 6,
    description: 'Conventional deadlift — the whole-body hinge.',
    instructions: [
      'Bar over mid-foot, shins almost touching. Feet hip-width.',
      'Hinge and grip just outside your legs. Chest up, flat back, lats tight.',
      'Push the FLOOR away with your legs; the bar drags up your shins.',
      'Stand tall and lock out with your glutes. Don\'t lean back or round.',
    ],
  }),
  S('sumo-deadlift', 'Sumo Deadlift', 'back', 'barbell', 'hinge', ['glutes', 'quads', 'back'], BB, {
    met: 6, description: 'Wide stance, hands inside knees — more hips and quads, less lower back.',
  }),
  S('romanian-deadlift', 'Romanian Deadlift (Barbell)', 'hamstrings', 'barbell', 'hinge',
    ['hamstrings', 'glutes', 'back'], BB, {
    description: 'Top-down hinge — the best hamstring builder.',
    instructions: [
      'Start standing with the bar at your hips, knees softly bent.',
      'Push your hips BACK, sliding the bar down your thighs. Keep the back flat.',
      'Stop when you feel a strong hamstring stretch (usually mid-shin).',
      'Drive your hips forward to stand. Knees stay mostly fixed — this isn\'t a squat.',
    ],
  }),
  S('rack-pull', 'Rack Pull', 'back', 'barbell', 'hinge', ['back', 'glutes', 'traps'], BB, {
    description: 'Partial deadlift from pins — overloads the lockout.',
  }),
  S('db-one-arm-row', 'One-Arm Dumbbell Row', 'back', 'dumbbell', 'horizontal_pull', ['back', 'biceps'], DB_, {
    description: 'Braced single-arm row — great lat stretch and squeeze.',
    instructions: [
      'Place one knee and hand on a bench, back flat and parallel to the floor.',
      'Let the dumbbell hang, feeling a stretch in the lat.',
      'Row it to your hip, elbow driving back and up.',
      'Lower all the way down under control.',
    ],
  }),
  S('db-chest-supported-row', 'Chest-Supported Dumbbell Row', 'back', 'dumbbell', 'horizontal_pull',
    ['back', 'biceps'], DB_, { description: 'Chest on an incline bench — no lower-back strain at all.' }),
  S('renegade-row', 'Renegade Row', 'back', 'dumbbell', 'horizontal_pull', ['back', 'core'], DB_, {
    description: 'Row from a plank — brutal anti-rotation core work.',
  }),
  S('db-romanian-deadlift', 'Dumbbell Romanian Deadlift', 'hamstrings', 'dumbbell', 'hinge',
    ['hamstrings', 'glutes'], DB_),
  S('kroc-row', 'Kroc Row', 'back', 'dumbbell', 'horizontal_pull', ['back', 'biceps', 'traps'], DB_, {
    description: 'Heavy, high-rep dumbbell row with a bit of body english.',
  }),
  S('lat-pulldown', 'Lat Pulldown', 'back', 'cable', 'vertical_pull', ['back', 'biceps'], CB, {
    met: 4,
    description: 'Wide-grip pulldown — builds the V-taper. The pull-up you can scale.',
    instructions: [
      'Grip wider than shoulders, thighs locked under the pad.',
      'Lean back very slightly and pull the bar to your upper chest.',
      'Lead with the elbows, driving them down and in. Squeeze the lats.',
      'Let the bar rise slowly until your arms are fully extended.',
    ],
  }),
  S('lat-pulldown-close', 'Lat Pulldown (Close Grip)', 'back', 'cable', 'vertical_pull', ['back', 'biceps'], CB, {
    met: 4, description: 'Neutral/close grip — more lat stretch, more biceps.',
  }),
  S('lat-pulldown-reverse', 'Lat Pulldown (Reverse Grip)', 'back', 'cable', 'vertical_pull',
    ['back', 'biceps'], CB, { met: 4, description: 'Underhand grip — lower lats and biceps.' }),
  S('seated-cable-row', 'Seated Cable Row', 'back', 'cable', 'horizontal_pull', ['back', 'biceps'], CB, {
    met: 4,
    description: 'Seated horizontal pull — thickness for the mid-back.',
    instructions: [
      'Sit tall with a slight knee bend, chest up.',
      'Pull the handle to your navel, elbows tight to your sides.',
      'Squeeze the shoulder blades, then let the weight stretch you forward — without rounding.',
    ],
  }),
  S('machine-row', 'Machine Row (Chest-Supported)', 'back', 'machine', 'horizontal_pull',
    ['back', 'biceps'], MC, { met: 4, description: 'Chest-supported machine row — beginner-friendly.' }),
  S('assisted-pull-up', 'Assisted Pull-Up Machine', 'back', 'machine', 'vertical_pull',
    ['back', 'biceps'], MC, {
    met: 5,
    description: 'The bridge to your first real pull-up.',
    instructions: [
      'Set the assistance weight HIGHER to make it easier (it counterbalances you).',
      'Pull until your chin clears the bar, chest to the bar.',
      'Lower slowly. Reduce the assistance every week or two.',
    ],
  }),
  S('straight-arm-pulldown', 'Straight-Arm Pulldown', 'back', 'cable', 'vertical_pull', ['back'], CB, {
    met: 4, description: 'Lat isolation with straight arms — no biceps involvement.',
  }),
  S('pull-up', 'Pull-Up', 'back', 'bodyweight', 'vertical_pull', ['back', 'biceps'], BW, {
    equipment: 'pull-up bar', met: 8,
    description: 'Overhand grip — the king of bodyweight pulling.',
    instructions: [
      'Hang from the bar with an overhand grip, slightly wider than shoulders.',
      'Pull your shoulder blades down first, then drive your elbows to your ribs.',
      'Pull until your chin is over the bar; keep the core tight so you don\'t swing.',
      'Lower all the way to a dead hang. Can\'t do one? Use bands or the assisted machine.',
    ],
  }),
  S('pull-up-wide', 'Wide-Grip Pull-Up', 'back', 'bodyweight', 'vertical_pull', ['back'], BW, {
    equipment: 'pull-up bar', met: 8, description: 'Wider grip — more lat width emphasis.',
  }),
  S('pull-up-neutral', 'Neutral-Grip Pull-Up', 'back', 'bodyweight', 'vertical_pull', ['back', 'biceps'], BW, {
    equipment: 'pull-up bar', met: 8, description: 'Palms facing — the most shoulder-friendly pull-up.',
  }),
  S('chin-up', 'Chin-Up', 'back', 'bodyweight', 'vertical_pull', ['back', 'biceps'], BW, {
    equipment: 'pull-up bar', met: 8,
    description: 'Underhand grip — easier than a pull-up and hammers the biceps.',
  }),
  S('inverted-row', 'Inverted Row', 'back', 'bodyweight', 'horizontal_pull', ['back', 'biceps'], BW, {
    trackingType: 'reps_only', met: 5,
    description: 'Body-row under a bar — the beginner\'s horizontal pull.',
    instructions: [
      'Set a bar at hip height. Lie under it and grip it overhand.',
      'Keep your body in one straight line, heels on the floor.',
      'Pull your chest to the bar, squeezing your shoulder blades.',
      'The higher the bar, the easier — start high and lower it as you get strong.',
    ],
  }),
  S('superman-hold', 'Superman Hold', 'back', 'bodyweight', 'core', ['back', 'glutes'], BW, {
    trackingType: 'duration', met: 3, description: 'Prone hold — lower-back and glute endurance.',
  }),
  S('muscle-up', 'Muscle-Up', 'back', 'bodyweight', 'vertical_pull',
    ['back', 'chest', 'triceps', 'shoulders'], BW, {
    equipment: 'pull-up bar', trackingType: 'reps_only', met: 8,
    description: 'Pull-up into a dip — an advanced skill.',
  }),

  // ══════════════════════════ LEGS — QUADS ══════════════════════════
  S('back-squat', 'Barbell Back Squat', 'quads', 'barbell', 'squat', ['quads', 'glutes', 'core'], BB, {
    description: 'The king of leg exercises.',
    instructions: [
      'Bar on your upper back (not your neck). Feet shoulder-width, toes slightly out.',
      'Take a big breath and brace your core hard.',
      'Sit down and back. Knees track over your toes; chest stays up.',
      'Go to at least parallel, then drive up through your whole foot.',
    ],
  }),
  S('front-squat', 'Front Squat', 'quads', 'barbell', 'squat', ['quads', 'core', 'glutes'], BB, {
    description: 'Bar racked on the front delts — very quad and core dominant.',
    instructions: [
      'Rest the bar on your front delts, elbows HIGH and pointing forward.',
      'Squat straight down with a very upright torso.',
      'If the elbows drop, the bar will roll — keep driving them up.',
    ],
  }),
  S('zercher-squat', 'Zercher Squat', 'quads', 'barbell', 'squat', ['quads', 'core', 'glutes'], BB, {
    description: 'Bar held in the crooks of the elbows — huge core demand.',
  }),
  S('overhead-squat', 'Overhead Squat', 'quads', 'barbell', 'squat', ['quads', 'shoulders', 'core'], BB, {
    description: 'Bar locked overhead — a mobility and stability test.',
  }),
  S('goblet-squat', 'Goblet Squat', 'quads', 'dumbbell', 'squat', ['quads', 'glutes', 'core'], DB_, {
    description: 'One dumbbell at the chest — the best squat for a beginner to learn.',
    instructions: [
      'Hold one dumbbell vertically against your chest with both hands.',
      'Feet shoulder-width. Squat straight down, elbows tracking inside your knees.',
      'The weight in front acts as a counterbalance — it keeps you upright.',
      'Drive up through your heels.',
    ],
  }),
  S('db-lunge', 'Dumbbell Lunge', 'quads', 'dumbbell', 'lunge', ['quads', 'glutes', 'hamstrings'], DB_, {
    description: 'Static lunge with dumbbells at your sides.',
  }),
  S('walking-lunge', 'Walking Lunge', 'quads', 'dumbbell', 'lunge', ['quads', 'glutes', 'hamstrings'], DB_, {
    description: 'Lunging forward continuously — great for glutes and conditioning.',
  }),
  S('bulgarian-split-squat', 'Bulgarian Split Squat', 'quads', 'dumbbell', 'lunge',
    ['quads', 'glutes'], DB_, {
    description: 'Rear foot elevated — one of the hardest, most effective leg exercises.',
    instructions: [
      'Place your rear foot on a bench behind you; front foot ~2 steps forward.',
      'Lower straight down until your front thigh is about parallel.',
      'Keep your torso upright and drive through the front heel.',
      'Do all reps on one leg, then swap.',
    ],
  }),
  S('step-up', 'Step-Up', 'quads', 'dumbbell', 'lunge', ['quads', 'glutes'], DB_, {
    description: 'Stepping onto a box — simple, unilateral, joint-friendly.',
  }),
  S('leg-press', 'Leg Press', 'quads', 'machine', 'squat', ['quads', 'glutes'], MC, {
    description: 'Machine press — load the legs heavily with zero balance demand.',
    instructions: [
      'Feet shoulder-width on the platform, mid-height.',
      'Lower until your knees are at about 90° — don\'t let your lower back round off the pad.',
      'Press through your whole foot. Never fully lock the knees out hard.',
    ],
  }),
  S('hack-squat', 'Hack Squat Machine', 'quads', 'machine', 'squat', ['quads', 'glutes'], MC, {
    description: 'Guided squat on a sled — very quad dominant.',
  }),
  S('leg-extension', 'Leg Extension', 'quads', 'machine', 'squat', ['quads'], MC, {
    met: 4,
    description: 'Pure quad isolation.',
    instructions: [
      'Align the machine\'s pivot with your knee joint.',
      'Extend until your legs are straight, squeezing the quads at the top.',
      'Lower slowly — don\'t let the stack slam.',
    ],
  }),
  S('smith-squat', 'Smith Machine Squat', 'quads', 'machine', 'squat', ['quads', 'glutes'], MC, {
    description: 'Fixed bar path squat — easier to balance.',
  }),
  S('bodyweight-squat', 'Bodyweight Squat', 'quads', 'bodyweight', 'squat', ['quads', 'glutes'], BW, {
    trackingType: 'reps_only', met: 5,
    description: 'Master this before you add any weight.',
    instructions: [
      'Feet shoulder-width, toes slightly out, arms out front for balance.',
      'Sit back and down as if to a chair, chest tall.',
      'Go as deep as you can with your heels flat, then stand up.',
    ],
  }),
  S('jump-squat', 'Jump Squat', 'quads', 'bodyweight', 'squat', ['quads', 'glutes', 'calves'], BW, {
    trackingType: 'reps_only', met: 8, description: 'Explosive squat — power and conditioning.',
  }),
  S('pistol-squat', 'Pistol Squat', 'quads', 'bodyweight', 'squat', ['quads', 'glutes', 'core'], BW, {
    trackingType: 'reps_only', met: 6, description: 'Single-leg squat to full depth — advanced.',
  }),
  S('wall-sit', 'Wall Sit', 'quads', 'bodyweight', 'squat', ['quads'], BW, {
    trackingType: 'duration', met: 4, description: 'Isometric hold against a wall — burns.',
  }),

  // ══════════════════════════ LEGS — HAMSTRINGS & GLUTES ══════════════════════════
  S('barbell-hip-thrust', 'Barbell Hip Thrust', 'glutes', 'barbell', 'hinge', ['glutes', 'hamstrings'], BB, {
    description: 'The single best glute builder.',
    instructions: [
      'Upper back on a bench, bar across your hips (use a pad).',
      'Feet flat, shins vertical at the top.',
      'Drive your hips up by squeezing your glutes until your body is a straight line.',
      'Tuck your chin and keep your ribs down — don\'t arch your lower back.',
    ],
  }),
  S('good-morning', 'Good Morning', 'hamstrings', 'barbell', 'hinge', ['hamstrings', 'glutes', 'back'], BB, {
    description: 'Bar on the back, hinge forward — hamstring and lower-back builder.',
  }),
  S('db-hip-thrust', 'Dumbbell Hip Thrust', 'glutes', 'dumbbell', 'hinge', ['glutes'], DB_),
  S('single-leg-db-deadlift', 'Single-Leg Dumbbell Deadlift', 'hamstrings', 'dumbbell', 'hinge',
    ['hamstrings', 'glutes', 'core'], DB_, { description: 'Unilateral hinge — balance and hamstring work.' }),
  S('db-glute-bridge', 'Dumbbell Glute Bridge', 'glutes', 'dumbbell', 'hinge', ['glutes'], DB_),
  S('leg-curl-machine', 'Leg Curl (Machine)', 'hamstrings', 'machine', 'hinge', ['hamstrings'], MC, {
    met: 4,
    description: 'Lying leg curl — direct hamstring isolation.',
    instructions: [
      'Lie face down, pad just above your heels.',
      'Curl your heels toward your glutes, squeezing the hamstrings.',
      'Lower slowly. Keep your hips pressed into the bench.',
    ],
  }),
  S('seated-leg-curl', 'Seated Leg Curl', 'hamstrings', 'machine', 'hinge', ['hamstrings'], MC, {
    met: 4, description: 'Seated version — a great hamstring stretch under load.',
  }),
  S('glute-kickback-machine', 'Glute Kickback Machine', 'glutes', 'machine', 'hinge', ['glutes'], MC, { met: 4 }),
  S('cable-pull-through', 'Cable Pull-Through', 'glutes', 'cable', 'hinge', ['glutes', 'hamstrings'], CB, {
    met: 4, description: 'Rope between the legs — teaches the hip hinge perfectly.',
  }),
  S('glute-bridge', 'Glute Bridge', 'glutes', 'bodyweight', 'hinge', ['glutes'], BW, {
    trackingType: 'reps_only', met: 3,
    description: 'Floor bridge — the starting point for glute training.',
    instructions: [
      'Lie on your back, knees bent, feet flat and close to your glutes.',
      'Drive through your heels and squeeze your glutes to lift your hips.',
      'Pause at the top; don\'t hyperextend your lower back.',
    ],
  }),
  S('nordic-curl', 'Nordic Hamstring Curl', 'hamstrings', 'bodyweight', 'hinge', ['hamstrings'], BW, {
    trackingType: 'reps_only', met: 6,
    description: 'Kneeling eccentric curl — brutally effective hamstring builder.',
  }),
  S('single-leg-rdl', 'Single-Leg RDL (Bodyweight)', 'hamstrings', 'bodyweight', 'hinge',
    ['hamstrings', 'glutes', 'core'], BW, { trackingType: 'reps_only', met: 4 }),
  S('donkey-kicks', 'Donkey Kicks', 'glutes', 'bodyweight', 'hinge', ['glutes'], BW, {
    trackingType: 'reps_only', met: 3,
  }),

  // ══════════════════════════ LEGS — CALVES ══════════════════════════
  S('barbell-calf-raise', 'Barbell Calf Raise', 'calves', 'barbell', 'calf_raise', ['calves'], BB, { met: 4 }),
  S('db-standing-calf-raise', 'Standing Dumbbell Calf Raise', 'calves', 'dumbbell', 'calf_raise',
    ['calves'], DB_, { met: 4 }),
  S('db-seated-calf-raise', 'Seated Dumbbell Calf Raise', 'calves', 'dumbbell', 'calf_raise',
    ['calves'], DB_, { met: 4, description: 'Bent knee — targets the deeper soleus.' }),
  S('standing-calf-machine', 'Standing Calf Raise Machine', 'calves', 'machine', 'calf_raise',
    ['calves'], MC, { met: 4 }),
  S('seated-calf-machine', 'Seated Calf Raise Machine', 'calves', 'machine', 'calf_raise',
    ['calves'], MC, { met: 4 }),
  S('leg-press-calf-raise', 'Leg-Press Calf Raise', 'calves', 'machine', 'calf_raise', ['calves'], MC, { met: 4 }),
  S('calf-raise-step', 'Calf Raise on Step', 'calves', 'bodyweight', 'calf_raise', ['calves'], BW, {
    trackingType: 'reps_only', met: 3,
    instructions: [
      'Stand with the balls of your feet on a step, heels hanging off.',
      'Drop your heels below the step for a deep stretch.',
      'Push up as high as you can onto your toes and pause.',
    ],
  }),
  S('single-leg-calf-raise', 'Single-Leg Calf Raise', 'calves', 'bodyweight', 'calf_raise', ['calves'], BW, {
    trackingType: 'reps_only', met: 4,
  }),
  S('donkey-calf-raise', 'Donkey Calf Raise', 'calves', 'bodyweight', 'calf_raise', ['calves'], BW, {
    trackingType: 'reps_only', met: 4,
  }),

  // ══════════════════════════ SHOULDERS ══════════════════════════
  S('overhead-press', 'Overhead Press', 'shoulders', 'barbell', 'vertical_push',
    ['shoulders', 'triceps', 'core'], BB, {
    description: 'Standing barbell press — the main shoulder builder.',
    instructions: [
      'Bar on your front delts, hands just outside shoulder-width.',
      'Squeeze your glutes and brace hard — this stops you arching your back.',
      'Press the bar straight up, moving your head back slightly out of the way.',
      'Lock out with the bar over your mid-foot, biceps by your ears.',
    ],
  }),
  S('push-press', 'Push Press', 'shoulders', 'barbell', 'vertical_push',
    ['shoulders', 'triceps', 'quads'], BB, { description: 'A small leg dip drives the bar — lets you go heavier.' }),
  S('upright-row', 'Upright Row', 'shoulders', 'barbell', 'lateral_raise', ['shoulders', 'traps'], BB, {
    description: 'Pull the bar to the chest. Use a wider grip to spare the shoulders.',
  }),
  S('db-shoulder-press', 'Dumbbell Shoulder Press', 'shoulders', 'dumbbell', 'vertical_push',
    ['shoulders', 'triceps'], DB_, {
    met: 4,
    description: 'Seated or standing dumbbell press.',
    instructions: [
      'Start with the dumbbells at shoulder height, palms forward.',
      'Press up and slightly in until they nearly touch overhead.',
      'Lower under control to ear level.',
    ],
  }),
  S('arnold-press', 'Arnold Press', 'shoulders', 'dumbbell', 'vertical_push', ['shoulders', 'triceps'], DB_, {
    met: 4, description: 'Rotating press — hits front and side delts through a big range.',
  }),
  S('lateral-raise', 'Dumbbell Lateral Raise', 'shoulders', 'dumbbell', 'lateral_raise', ['shoulders'], DB_, {
    met: 3.5,
    description: 'The exercise that actually builds shoulder WIDTH.',
    instructions: [
      'Stand with dumbbells at your sides, tiny bend in the elbows.',
      'Raise your arms out to the sides, leading with your elbows.',
      'Stop at shoulder height. Lower slowly.',
      'Go LIGHT. If you\'re swinging, the weight is too heavy.',
    ],
  }),
  S('front-raise', 'Dumbbell Front Raise', 'shoulders', 'dumbbell', 'lateral_raise', ['shoulders'], DB_, {
    met: 3.5, description: 'Front-delt isolation.',
  }),
  S('rear-delt-fly', 'Dumbbell Rear-Delt Fly', 'shoulders', 'dumbbell', 'horizontal_pull',
    ['shoulders', 'back'], DB_, {
    met: 3.5,
    description: 'Bent-over fly — the rear delts almost everyone neglects.',
    instructions: [
      'Hinge forward so your torso is nearly parallel to the floor.',
      'With a soft elbow bend, raise the dumbbells out to the sides.',
      'Squeeze the rear delts and upper back. Keep it light and controlled.',
    ],
  }),
  S('db-single-arm-shoulder-press', 'Single-Arm Dumbbell Press (Shoulder)', 'shoulders', 'dumbbell',
    'vertical_push', ['shoulders', 'core'], DB_, { met: 4 }),
  S('machine-shoulder-press', 'Machine Shoulder Press', 'shoulders', 'machine', 'vertical_push',
    ['shoulders', 'triceps'], MC, { met: 4, description: 'Guided overhead press — beginner friendly.' }),
  S('cable-lateral-raise', 'Cable Lateral Raise', 'shoulders', 'cable', 'lateral_raise', ['shoulders'], CB, {
    met: 3.5, description: 'Constant tension through the whole raise.',
  }),
  S('cable-rear-delt-fly', 'Cable Rear-Delt Fly', 'shoulders', 'cable', 'horizontal_pull',
    ['shoulders', 'back'], CB, { met: 3.5 }),
  S('reverse-pec-deck', 'Reverse Pec Deck', 'shoulders', 'machine', 'horizontal_pull',
    ['shoulders', 'back'], MC, { met: 3.5, description: 'Machine rear-delt fly — easy to learn.' }),
  S('pike-push-up', 'Pike Push-Up', 'shoulders', 'bodyweight', 'vertical_push',
    ['shoulders', 'triceps'], BW, {
    trackingType: 'reps_only', met: 5,
    description: 'Hips high, pressing overhead — the bodyweight shoulder press.',
    instructions: [
      'Start in a push-up, then walk your feet in so your hips are high (upside-down V).',
      'Lower the crown of your head toward the floor between your hands.',
      'Press back up. Elevate your feet to make it harder.',
    ],
  }),
  S('handstand-push-up', 'Handstand Push-Up', 'shoulders', 'bodyweight', 'vertical_push',
    ['shoulders', 'triceps', 'core'], BW, {
    trackingType: 'reps_only', met: 8, description: 'Wall-assisted — advanced vertical pressing.',
  }),
  S('y-raise', 'Prone Y-Raise', 'shoulders', 'bodyweight', 'lateral_raise', ['shoulders', 'back'], BW, {
    trackingType: 'reps_only', met: 3, description: 'Lower traps and rear delts — great postural work.',
  }),

  // ══════════════════════════ BICEPS ══════════════════════════
  S('barbell-curl', 'Barbell Curl', 'biceps', 'barbell', 'curl', ['biceps'], BB, {
    met: 3.5,
    description: 'The classic biceps mass builder.',
    instructions: [
      'Stand with the bar at arm\'s length, underhand grip, shoulder-width.',
      'Curl up by bending ONLY at the elbows — keep them pinned to your sides.',
      'Squeeze at the top, then lower slowly all the way down.',
      'No swinging or leaning back. If you need to, lighten the bar.',
    ],
  }),
  S('ez-bar-curl', 'EZ-Bar Curl', 'biceps', 'barbell', 'curl', ['biceps'], BB, {
    met: 3.5, description: 'Angled bar — much kinder to the wrists.',
  }),
  S('reverse-barbell-curl', 'Reverse-Grip Barbell Curl', 'biceps', 'barbell', 'curl',
    ['biceps', 'forearms'], BB, { met: 3.5, description: 'Overhand curl — hits the brachialis and forearms.' }),
  S('drag-curl', 'Drag Curl', 'biceps', 'barbell', 'curl', ['biceps'], BB, {
    met: 3.5, description: 'Bar dragged up the torso, elbows back — pure biceps peak.',
  }),
  S('db-curl', 'Dumbbell Curl', 'biceps', 'dumbbell', 'curl', ['biceps'], DB_, {
    met: 3.5, description: 'Alternating or simultaneous dumbbell curls.',
  }),
  S('hammer-curl', 'Hammer Curl', 'biceps', 'dumbbell', 'curl', ['biceps', 'forearms'], DB_, {
    met: 3.5,
    description: 'Neutral (thumbs-up) grip — builds arm thickness and forearms.',
    instructions: [
      'Hold the dumbbells with palms facing each other, like holding hammers.',
      'Curl straight up without rotating the wrists.',
      'Keep elbows tight to your sides; lower slowly.',
    ],
  }),
  S('concentration-curl', 'Concentration Curl', 'biceps', 'dumbbell', 'curl', ['biceps'], DB_, {
    met: 3.5, description: 'Elbow braced on the inner thigh — maximum isolation.',
  }),
  S('incline-db-curl', 'Incline Dumbbell Curl', 'biceps', 'dumbbell', 'curl', ['biceps'], DB_, {
    met: 3.5, description: 'Arms behind the body — the biggest biceps stretch there is.',
  }),
  S('preacher-db-curl', 'Preacher Dumbbell Curl', 'biceps', 'dumbbell', 'curl', ['biceps'], DB_, { met: 3.5 }),
  S('cross-body-hammer-curl', 'Cross-Body Hammer Curl', 'biceps', 'dumbbell', 'curl',
    ['biceps', 'forearms'], DB_, { met: 3.5 }),
  S('cable-curl', 'Cable Curl', 'biceps', 'cable', 'curl', ['biceps'], CB, {
    met: 3.5, description: 'Constant tension from bottom to top.',
  }),
  S('preacher-curl-machine', 'Preacher Curl Machine', 'biceps', 'machine', 'curl', ['biceps'], MC, {
    met: 3.5, description: 'Arm pad removes all cheating — great for beginners.',
  }),
  S('rope-hammer-curl', 'Cable Rope Hammer Curl', 'biceps', 'cable', 'curl', ['biceps', 'forearms'], CB, { met: 3.5 }),
  S('single-arm-cable-curl', 'Single-Arm Cable Curl', 'biceps', 'cable', 'curl', ['biceps'], CB, { met: 3.5 }),
  S('isometric-curl-hold', 'Isometric Curl Hold', 'biceps', 'bodyweight', 'curl', ['biceps'], BW, {
    trackingType: 'duration', met: 3, description: 'Hold a band/towel curl at 90° — no equipment needed.',
  }),

  // ══════════════════════════ TRICEPS ══════════════════════════
  S('skullcrusher', 'Skullcrusher (EZ-Bar)', 'triceps', 'barbell', 'triceps_extension', ['triceps'], BB, {
    met: 3.5,
    description: 'Lying extension — the big triceps builder.',
    instructions: [
      'Lie on a bench holding an EZ-bar above your chest, arms straight.',
      'Bend ONLY at the elbows, lowering the bar toward your forehead/behind your head.',
      'Keep the upper arms still and angled slightly back.',
      'Extend back up and squeeze the triceps.',
    ],
  }),
  S('jm-press', 'JM Press', 'triceps', 'barbell', 'triceps_extension', ['triceps', 'chest'], BB, {
    met: 4, description: 'A hybrid of close-grip bench and skullcrusher.',
  }),
  S('db-overhead-extension', 'Overhead Dumbbell Extension', 'triceps', 'dumbbell', 'triceps_extension',
    ['triceps'], DB_, {
    met: 3.5,
    description: 'Overhead position stretches the long head of the triceps.',
    instructions: [
      'Hold one dumbbell overhead with both hands, arms straight.',
      'Lower it behind your head by bending the elbows; keep them pointing forward.',
      'Extend back up without letting the elbows flare wide.',
    ],
  }),
  S('db-kickback', 'Dumbbell Kickback', 'triceps', 'dumbbell', 'triceps_extension', ['triceps'], DB_, { met: 3.5 }),
  S('lying-db-extension', 'Lying Dumbbell Extension', 'triceps', 'dumbbell', 'triceps_extension',
    ['triceps'], DB_, { met: 3.5 }),
  S('tate-press', 'Tate Press', 'triceps', 'dumbbell', 'triceps_extension', ['triceps'], DB_, { met: 3.5 }),
  S('triceps-pushdown', 'Cable Triceps Pushdown', 'triceps', 'cable', 'triceps_extension', ['triceps'], CB, {
    met: 3.5,
    description: 'The most beginner-friendly triceps exercise.',
    instructions: [
      'Stand at a high pulley, elbows tucked tight to your sides.',
      'Push the bar/rope down until your arms are fully straight; squeeze.',
      'Let it come back to ~90° WITHOUT letting your elbows drift forward.',
    ],
  }),
  S('overhead-cable-extension', 'Overhead Cable Extension', 'triceps', 'cable', 'triceps_extension',
    ['triceps'], CB, { met: 3.5, description: 'Cable version of the overhead extension — constant tension.' }),
  S('dip-machine', 'Dip Machine', 'triceps', 'machine', 'horizontal_push', ['triceps', 'chest'], MC, { met: 4 }),
  S('single-arm-pushdown', 'Single-Arm Cable Pushdown', 'triceps', 'cable', 'triceps_extension',
    ['triceps'], CB, { met: 3.5 }),
  S('bench-dip', 'Bench Dip', 'triceps', 'bodyweight', 'horizontal_push', ['triceps', 'chest'], BW, {
    trackingType: 'reps_only', met: 5,
    description: 'Hands on a bench behind you — an easy entry to dipping.',
  }),
  S('close-grip-push-up', 'Close-Grip Push-Up', 'triceps', 'bodyweight', 'horizontal_push',
    ['triceps', 'chest'], BW, { trackingType: 'reps_only', met: 5 }),

  // ══════════════════════════ CORE / ABS ══════════════════════════
  S('barbell-rollout', 'Barbell Rollout', 'core', 'barbell', 'core', ['core'], BB, {
    trackingType: 'reps_only', met: 4, description: 'Rolling out on a loaded bar — elite anti-extension work.',
  }),
  S('landmine-rotation', 'Landmine Rotation', 'core', 'barbell', 'rotation', ['core', 'shoulders'], BB, {
    trackingType: 'reps_only', met: 4,
  }),
  S('landmine-anti-rotation-press', 'Landmine Anti-Rotation Press', 'core', 'barbell', 'core',
    ['core', 'shoulders'], BB, { trackingType: 'reps_only', met: 4 }),
  S('db-side-bend', 'Dumbbell Side Bend', 'core', 'dumbbell', 'core', ['core', 'obliques'], DB_, { met: 3 }),
  S('russian-twist', 'Russian Twist', 'core', 'dumbbell', 'rotation', ['core', 'obliques'], DB_, {
    trackingType: 'reps_only', met: 4,
  }),
  S('weighted-sit-up', 'Weighted Sit-Up', 'core', 'dumbbell', 'core', ['core'], DB_, { met: 4 }),
  S('dead-bug', 'Dead Bug', 'core', 'bodyweight', 'core', ['core'], BW, {
    trackingType: 'reps_only', met: 3,
    description: 'The safest core exercise there is — perfect for beginners and bad backs.',
    instructions: [
      'Lie on your back, arms straight up, knees bent at 90° over your hips.',
      'Press your lower back FLAT into the floor and keep it there.',
      'Slowly lower the opposite arm and leg, then return. Alternate sides.',
    ],
  }),
  S('cable-crunch', 'Cable Crunch (Kneeling)', 'core', 'cable', 'core', ['core'], CB, {
    met: 4, description: 'Kneeling crunch on a rope — lets you load the abs progressively.',
  }),
  S('cable-woodchopper', 'Cable Woodchopper', 'core', 'cable', 'rotation', ['core', 'obliques'], CB, {
    trackingType: 'reps_only', met: 4,
  }),
  S('ab-crunch-machine', 'Ab Crunch Machine', 'core', 'machine', 'core', ['core'], MC, { met: 4 }),
  S('plank', 'Plank', 'core', 'bodyweight', 'core', ['core'], BW, {
    trackingType: 'duration', met: 3,
    description: 'The fundamental core hold.',
    instructions: [
      'Forearms on the floor, elbows under your shoulders, body in a straight line.',
      'Squeeze your glutes and pull your ribs down — no sagging or piking.',
      'Breathe normally. Quality over duration: 30 solid seconds beats 2 sloppy minutes.',
    ],
  }),
  S('side-plank', 'Side Plank', 'core', 'bodyweight', 'core', ['core', 'obliques'], BW, {
    trackingType: 'duration', met: 3,
  }),
  S('crunch', 'Crunch', 'core', 'bodyweight', 'core', ['core'], BW, { trackingType: 'reps_only', met: 3 }),
  S('hanging-leg-raise', 'Hanging Leg Raise', 'core', 'bodyweight', 'core', ['core', 'hip flexors'], BW, {
    equipment: 'pull-up bar', trackingType: 'reps_only', met: 4,
    instructions: [
      'Hang from a bar, shoulders active (not fully relaxed).',
      'Raise your legs by curling your pelvis up — not just by lifting the thighs.',
      'Lower slowly and don\'t swing. Bend the knees to make it easier.',
    ],
  }),
  S('bicycle-crunch', 'Bicycle Crunch', 'core', 'bodyweight', 'rotation', ['core', 'obliques'], BW, {
    trackingType: 'reps_only', met: 4,
  }),
  S('mountain-climber', 'Mountain Climber', 'core', 'bodyweight', 'core', ['core', 'shoulders'], BW, {
    trackingType: 'duration', met: 8, description: 'Core + conditioning in one.',
  }),
  S('hollow-body-hold', 'Hollow-Body Hold', 'core', 'bodyweight', 'core', ['core'], BW, {
    trackingType: 'duration', met: 4,
  }),
  S('v-up', 'V-Up', 'core', 'bodyweight', 'core', ['core'], BW, { trackingType: 'reps_only', met: 4 }),

  // ══════════════════════════ NECK ══════════════════════════
  // Three sub-muscles: flexors at the front (sternocleidomastoid + deep
  // flexors), extensors at the back (splenius, semispinalis, suboccipitals),
  // and the side flexors/rotators (scalenes, SCM working one-sided). The neck
  // responds to the same progressive overload as anything else — and is the
  // one group where going slow is not optional: light loads, full control,
  // never into pain, never jerked.
  S('plate-neck-flexion', 'Plate Neck Flexion (lying)', 'neck', 'other', 'core',
    ['neck'], NK, {
    subMuscle: 'neck_flexors', equipment: 'plate',
    description: 'Front of the neck. Lying face-up on a bench, head off the end, a plate (in a towel) on the forehead — curl the chin to the chest and back.',
    instructions: [
      'Lie face-up with your head just off the bench; hold a light plate wrapped in a towel on your forehead.',
      'Tuck the chin and curl the head up until the chin nears the chest, 2 s up.',
      'Lower under control to a gentle stretch — never let the head drop. 15–25 reps; add weight slowly, over weeks.',
    ],
  }),
  S('plate-neck-extension', 'Plate Neck Extension (prone)', 'neck', 'other', 'core',
    ['neck', 'traps'], NK, {
    subMuscle: 'neck_extensors', equipment: 'plate',
    description: 'Back of the neck. Face-down on a bench, head off the end, plate held on the back of the head — lift the head back and up.',
    instructions: [
      'Lie face-down, head off the bench; hold a light plate (towel under it) on the back of your head.',
      'Lift the head back and up to a comfortable extension, 2 s up — do not crank into the top.',
      'Lower slowly to a gentle stretch. 15–25 reps; the extensors take more load than the front, but add it slowly.',
    ],
  }),
  S('plate-lateral-neck-flexion', 'Plate Lateral Neck Flexion (side-lying)', 'neck', 'other', 'core',
    ['neck'], NK, {
    subMuscle: 'neck_lateral', equipment: 'plate',
    description: 'Sides of the neck. Lying on your side, plate on the upper side of the head — bring the ear toward the shoulder and back.',
    instructions: [
      'Lie on your side on a bench, head off the end, light plate (in a towel) held on the side of the head.',
      'Tilt the ear toward the upper shoulder, 2 s, without rotating.',
      'Lower to a gentle stretch. 12–20 reps each side; both sides, always.',
    ],
  }),
  S('neck-harness-extension', 'Neck Harness Extension', 'neck', 'other', 'core',
    ['neck', 'traps'], NK, {
    subMuscle: 'neck_extensors', equipment: 'neck harness',
    description: 'The wrestler\'s and fighter\'s neck builder: a head harness with a plate hanging from it, seated and bent forward — extend the head back against the load.',
    instructions: [
      'Sit on the end of a bench, lean forward with elbows on knees, harness on, plate hanging.',
      'Start with the chin near the chest; extend the head back and up in 2 s.',
      'Lower slowly. 15–25 reps. Start lighter than you think — the neck adapts fast but the joints take weeks.',
    ],
  }),
  S('cable-neck-flexion', 'Cable Neck Flexion (harness)', 'neck', 'cable', 'core',
    ['neck'], NK, {
    subMuscle: 'neck_flexors', equipment: 'cable + harness',
    description: 'Front of the neck against a cable: harness clipped to a low-to-mid pulley behind you, facing away — curl the chin down against the line.',
    instructions: [
      'Clip the harness to a low pulley behind you; stand or sit facing away, slight lean forward.',
      'Curl the chin toward the chest against the cable, 2 s.',
      'Return under control to neutral — do not let the cable pull the head back past it. 15–20 reps.',
    ],
  }),
  S('neck-machine-4-way', 'Neck Machine (4-way)', 'neck', 'machine', 'core',
    ['neck'], NK, {
    subMuscle: 'neck_extensors',
    description: 'The four-way neck machine: pad on the forehead, back of the head, or either side — each direction is its own set.',
    instructions: [
      'Set the pad height to the middle of the forehead / back of the head / temple.',
      'Move through a comfortable range in 2 s each way; never force the end range.',
      'Do all four directions; 12–20 reps each. Light weight, perfect control.',
    ],
  }),
  S('neck-curl-bodyweight', 'Neck Curl (bodyweight)', 'neck', 'bodyweight', 'core',
    ['neck'], NK, {
    subMuscle: 'neck_flexors', trackingType: 'reps_only',
    description: 'The starting point for the front of the neck: lying face-up, curl the chin to the chest and back — no load but the head.',
    instructions: [
      'Lie face-up on the floor or a bench, head supported or just off the end.',
      'Tuck the chin and curl the head up slowly; hold a second at the top.',
      'Lower slowly. 20–30 reps; add a plate when 30 is easy.',
    ],
  }),
  S('neck-extension-bodyweight', 'Neck Extension (bodyweight)', 'neck', 'bodyweight', 'core',
    ['neck', 'traps'], NK, {
    subMuscle: 'neck_extensors', trackingType: 'reps_only',
    description: 'The starting point for the back of the neck: face-down, lift the head back and up against gravity.',
    instructions: [
      'Lie face-down on a bench, head off the end, arms relaxed.',
      'Lift the head back and up to a comfortable extension, 2 s; no cranking.',
      'Lower slowly. 20–30 reps; add a plate when 30 is easy.',
    ],
  }),
  S('isometric-neck-4-way', 'Isometric Neck Holds (4-way, hand resistance)', 'neck', 'bodyweight', 'core',
    ['neck'], NK, {
    subMuscle: 'neck_lateral', trackingType: 'duration', met: 3,
    description: 'Push the head into your own hand — front, back, each side — and hold. The safest way to start, and all a beginner needs for weeks.',
    instructions: [
      'Sit tall. Place a palm on the forehead and push the head forward into it without moving; hold 10–20 s.',
      'Repeat with the hand on the back of the head (push back), then each side (push the ear toward the hand).',
      'Breathe throughout; 2–3 rounds of all four. Build the hold time before anything else.',
    ],
  }),
  S('neck-rotation-isometric', 'Neck Rotation Isometric', 'neck', 'bodyweight', 'rotation',
    ['neck'], NK, {
    subMuscle: 'neck_lateral', trackingType: 'duration', met: 3,
    description: 'The rotators: turn the head into your own hand on the cheek and hold — the strength that resists a twist.',
    instructions: [
      'Sit tall; place a palm on the cheek/jaw.',
      'Try to turn the head toward the hand without letting it move; hold 10–15 s.',
      'Switch sides. 2–3 rounds each; never hold your breath.',
    ],
  }),
  S('band-neck-flexion', 'Band Neck Flexion', 'neck', 'other', 'core',
    ['neck'], NK, {
    subMuscle: 'neck_flexors', equipment: 'band', trackingType: 'reps_only',
    description: 'Front of the neck against a light band anchored behind you, looped over the forehead (a towel under it).',
    instructions: [
      'Anchor a light band behind you at head height; loop it over the forehead with a towel under it.',
      'Step forward to take the slack; tuck and curl the chin down against it, 2 s.',
      'Return under control. 15–20 reps; a lighter band before a heavier one.',
    ],
  }),
  S('band-neck-extension', 'Band Neck Extension', 'neck', 'other', 'core',
    ['neck', 'traps'], NK, {
    subMuscle: 'neck_extensors', equipment: 'band', trackingType: 'reps_only',
    description: 'Back of the neck against a band anchored in front of you, looped over the back of the head.',
    instructions: [
      'Anchor a light band in front of you at head height; loop it around the back of the head (towel under it).',
      'Step back to take the slack; extend the head back against it, 2 s, without shrugging.',
      'Return slowly. 15–20 reps.',
    ],
  }),
  S('band-lateral-neck-flexion', 'Band Lateral Neck Flexion', 'neck', 'other', 'core',
    ['neck'], NK, {
    subMuscle: 'neck_lateral', equipment: 'band', trackingType: 'reps_only',
    description: 'Sides of the neck against a band anchored beside you, looped over the side of the head.',
    instructions: [
      'Anchor a light band beside you at head height; loop it over the side of the head away from the anchor.',
      'Tilt the ear toward the far shoulder against it, 2 s, no rotation.',
      'Return slowly; 12–20 reps each side.',
    ],
  }),

  // ══════════════════════════ FOREARMS / GRIP ══════════════════════════
  S('barbell-wrist-curl', 'Barbell Wrist Curl', 'forearms', 'barbell', 'curl', ['forearms'], BB, { met: 3 }),
  S('barbell-reverse-wrist-curl', 'Reverse Barbell Wrist Curl', 'forearms', 'barbell', 'curl',
    ['forearms'], BB, { met: 3 }),
  S('db-wrist-curl', 'Dumbbell Wrist Curl', 'forearms', 'dumbbell', 'curl', ['forearms'], DB_, { met: 3 }),
  S('db-reverse-wrist-curl', 'Reverse Dumbbell Wrist Curl', 'forearms', 'dumbbell', 'curl',
    ['forearms'], DB_, { met: 3 }),
  S('cable-wrist-curl', 'Cable Wrist Curl', 'forearms', 'cable', 'curl', ['forearms'], CB, { met: 3 }),
  S('farmers-carry', "Farmer's Carry", 'forearms', 'dumbbell', 'carry', ['forearms', 'core', 'traps'], DB_, {
    trackingType: 'duration', met: 5,
    description: 'Walk holding heavy weights — grip, core and traps all at once.',
  }),
  S('dead-hang', 'Dead Hang', 'forearms', 'bodyweight', 'carry', ['forearms', 'back'], BW, {
    equipment: 'pull-up bar', trackingType: 'duration', met: 3,
    description: 'Just hang from a bar — builds grip and decompresses the spine.',
  }),
  S('towel-pull-up-hang', 'Towel Pull-Up Hang', 'forearms', 'bodyweight', 'carry', ['forearms', 'back'], BW, {
    equipment: 'pull-up bar', trackingType: 'duration', met: 4,
  }),

  // ══════════════════════════ TRAPS (v2) ══════════════════════════
  S('barbell-shrug', 'Barbell Shrug', 'back', 'barbell', 'carry', ['traps'], BB, {
    subMuscle: 'traps',
    description: 'The trap builder — heavy weight, small range.',
    instructions: [
      'Hold the bar at arm\'s length in front of your thighs.',
      'Shrug your shoulders STRAIGHT UP toward your ears — don\'t roll them.',
      'Pause at the top, lower slowly. Keep your arms straight the whole set.',
    ],
  }),
  S('behind-back-shrug', 'Behind-the-Back Shrug', 'back', 'barbell', 'carry', ['traps'], BB, { subMuscle: 'traps' }),
  S('barbell-high-pull', 'Barbell High Pull', 'back', 'barbell', 'vertical_pull', ['traps', 'shoulders'], BB, {
    subMuscle: 'traps', description: 'Explosive pull to chest height — traps and upper back power.',
  }),
  S('db-shrug', 'Dumbbell Shrug', 'back', 'dumbbell', 'carry', ['traps'], DB_, { subMuscle: 'traps' }),
  S('farmers-carry-shrug', "Farmer's-Carry Shrug", 'back', 'dumbbell', 'carry', ['traps', 'forearms'], DB_, {
    subMuscle: 'traps', trackingType: 'duration',
  }),
  S('cable-shrug', 'Cable Shrug', 'back', 'cable', 'carry', ['traps'], CB, { subMuscle: 'traps' }),
  S('smith-shrug', 'Smith Machine Shrug', 'back', 'machine', 'carry', ['traps'], MC, { subMuscle: 'traps' }),

  // ══════════════════════════ LOWER BACK (v2) ══════════════════════════
  S('db-good-morning', 'Dumbbell Good Morning', 'hamstrings', 'dumbbell', 'hinge',
    ['hamstrings', 'lower back', 'glutes'], DB_, { subMuscle: 'lower_back' }),
  S('back-extension', 'Back Extension (45° / Roman Chair)', 'back', 'machine', 'hinge',
    ['lower back', 'glutes', 'hamstrings'], MC, {
    subMuscle: 'lower_back',
    description: 'The safest way to build lower-back endurance.',
    instructions: [
      'Set the pad at your hip crease so you can hinge freely.',
      'Lower under control, then raise your torso until your body is straight.',
      'Squeeze your glutes at the top — don\'t hyperextend past neutral.',
    ],
  }),
  S('cable-good-morning', 'Cable Good Morning', 'back', 'cable', 'hinge', ['lower back', 'hamstrings'], CB, {
    subMuscle: 'lower_back',
  }),
  S('hyperextension-bw', 'Bodyweight Hyperextension', 'back', 'bodyweight', 'hinge',
    ['lower back', 'glutes'], BW, { subMuscle: 'lower_back', trackingType: 'reps_only', met: 3 }),
  S('bird-dog', 'Bird-Dog', 'core', 'bodyweight', 'core', ['core', 'lower back'], BW, {
    subMuscle: 'lower_back', trackingType: 'reps_only', met: 3,
    description: 'Opposite arm/leg reach from all fours — spine-safe stability.',
  }),
  S('stiff-leg-deadlift', 'Stiff-Leg Deadlift', 'hamstrings', 'barbell', 'hinge',
    ['hamstrings', 'glutes', 'lower back'], BB, {
    description: 'Like an RDL but from the floor with straighter knees — deep hamstring stretch.',
  }),
  S('glute-ham-raise', 'Glute-Ham Raise', 'hamstrings', 'bodyweight', 'hinge',
    ['hamstrings', 'glutes'], BW, { trackingType: 'reps_only', met: 6 }),

  // ══════════════════════════ GLUTES (v2 additions) ══════════════════════════
  S('barbell-glute-bridge', 'Barbell Glute Bridge', 'glutes', 'barbell', 'hinge', ['glutes'], BB),
  S('cable-glute-kickback', 'Cable Glute Kickback', 'glutes', 'cable', 'hinge', ['glutes'], CB, { met: 4 }),
  S('hip-abduction-machine', 'Hip Abduction Machine', 'glutes', 'machine', 'hinge', ['glutes'], MC, {
    met: 4, description: 'Targets the side glutes (medius) — hip stability and shape.',
  }),
  S('single-leg-glute-bridge', 'Single-Leg Glute Bridge', 'glutes', 'bodyweight', 'hinge', ['glutes'], BW, {
    trackingType: 'reps_only', met: 3.5,
  }),
  S('fire-hydrant', 'Fire Hydrant', 'glutes', 'bodyweight', 'hinge', ['glutes'], BW, {
    trackingType: 'reps_only', met: 3,
  }),

  // ══════════════════════════ SHOULDERS — per delt head (v2) ══════════════════════════
  S('behind-neck-press', 'Behind-the-Neck Press', 'shoulders', 'barbell', 'vertical_push',
    ['shoulders', 'triceps'], BB, {
    subMuscle: 'front_delt',
    description: 'Advanced only — requires excellent shoulder mobility. Skip it if in doubt.',
  }),
  S('cable-front-raise', 'Cable Front Raise', 'shoulders', 'cable', 'lateral_raise', ['shoulders'], CB, {
    subMuscle: 'front_delt', met: 3.5,
  }),
  S('seated-lateral-raise', 'Seated Lateral Raise', 'shoulders', 'dumbbell', 'lateral_raise',
    ['shoulders'], DB_, { subMuscle: 'side_delt', met: 3.5, description: 'Seated removes all momentum — strict side-delt work.' }),
  S('leaning-lateral-raise', 'Leaning Lateral Raise', 'shoulders', 'dumbbell', 'lateral_raise',
    ['shoulders'], DB_, { subMuscle: 'side_delt', met: 3.5 }),
  S('lateral-raise-machine', 'Lateral Raise Machine', 'shoulders', 'machine', 'lateral_raise',
    ['shoulders'], MC, { subMuscle: 'side_delt', met: 3.5 }),
  S('incline-rear-delt-fly', 'Incline-Bench Rear-Delt Fly', 'shoulders', 'dumbbell', 'horizontal_pull',
    ['shoulders', 'back'], DB_, { subMuscle: 'rear_delt', met: 3.5 }),
  S('prone-swimmers', 'Prone Swimmers', 'shoulders', 'bodyweight', 'lateral_raise',
    ['shoulders', 'back'], BW, { subMuscle: 'rear_delt', trackingType: 'reps_only', met: 3 }),

  // ══════════════════════════ CORE — lower abs & obliques (v2) ══════════════════════════
  S('lying-leg-raise', 'Lying Leg Raise', 'core', 'bodyweight', 'core', ['core', 'hip flexors'], BW, {
    subMuscle: 'lower_abs', trackingType: 'reps_only', met: 3.5,
    instructions: [
      'Lie flat, hands under your hips for support.',
      'Raise your legs to vertical, keeping them as straight as comfortable.',
      'Lower SLOWLY without letting your lower back arch off the floor.',
    ],
  }),
  S('reverse-crunch', 'Reverse Crunch', 'core', 'bodyweight', 'core', ['core'], BW, {
    subMuscle: 'lower_abs', trackingType: 'reps_only', met: 3.5,
  }),
  S('flutter-kicks', 'Flutter Kicks', 'core', 'bodyweight', 'core', ['core', 'hip flexors'], BW, {
    subMuscle: 'lower_abs', trackingType: 'duration', met: 4,
  }),
  S('captains-chair-leg-raise', "Captain's-Chair Leg Raise", 'core', 'machine', 'core',
    ['core', 'hip flexors'], MC, { subMuscle: 'lower_abs', trackingType: 'reps_only', met: 4 }),
  S('cable-reverse-crunch', 'Cable Reverse Crunch', 'core', 'cable', 'core', ['core'], CB, {
    subMuscle: 'lower_abs', met: 4,
  }),
  S('weighted-leg-raise', 'Weighted Leg Raise', 'core', 'dumbbell', 'core', ['core', 'hip flexors'], DB_, {
    subMuscle: 'lower_abs', met: 4,
  }),
  S('weighted-crunch', 'Weighted Crunch', 'core', 'dumbbell', 'core', ['core'], DB_, {
    subMuscle: 'upper_abs', met: 4,
  }),
  S('sit-up', 'Sit-Up', 'core', 'bodyweight', 'core', ['core'], BW, {
    subMuscle: 'upper_abs', trackingType: 'reps_only', met: 3.5,
  }),
  S('db-woodchopper', 'Dumbbell Woodchopper', 'core', 'dumbbell', 'rotation', ['core', 'obliques'], DB_, {
    subMuscle: 'obliques', trackingType: 'reps_only', met: 4,
  }),
  S('cable-side-bend', 'Cable Side Bend', 'core', 'cable', 'core', ['core', 'obliques'], CB, {
    subMuscle: 'obliques', met: 3.5,
  }),
  S('rotational-mountain-climber', 'Rotational Mountain Climber', 'core', 'bodyweight', 'rotation',
    ['core', 'obliques'], BW, { subMuscle: 'obliques', trackingType: 'duration', met: 8 }),

  // ══════════════════════════ SCAPULAR CONTROL (v2) ══════════════════════════
  S('scapular-pull-up', 'Scapular Pull-Up', 'back', 'bodyweight', 'vertical_pull', ['back'], BW, {
    subMuscle: 'lats', equipment: 'pull-up bar', trackingType: 'reps_only', met: 4,
    description: 'Dead hang, then pull only the shoulder blades down — the pull-up\'s first inch.',
  }),
  S('scap-retraction-hold', 'Scapular Retraction Hold', 'back', 'bodyweight', 'horizontal_pull',
    ['back'], BW, { subMuscle: 'mid_back', trackingType: 'duration', met: 3 }),

  // ══════════════════════════ OTHER STRENGTH (kept from v1) ══════════════════════════
  S('kettlebell-swing', 'Kettlebell Swing', 'glutes', 'other', 'hinge',
    ['glutes', 'hamstrings', 'core', 'shoulders'], DB_, {
    equipment: 'kettlebell', met: 6,
    description: 'Explosive hip hinge — power and conditioning.',
    instructions: [
      'Hinge back and hike the bell between your legs.',
      'Snap your hips forward explosively — the bell floats up on its own.',
      'It is NOT a squat and NOT a front raise. The power is all hips.',
    ],
  }),
  S('band-pull-apart', 'Resistance Band Pull-Apart', 'back', 'other', 'horizontal_pull',
    ['shoulders', 'back'], 'strength.band', {
    equipment: 'resistance band', trackingType: 'reps_only', met: 3,
    description: 'Great warm-up and posture fixer for the rear delts.',
  }),

  // ══════════════════════════ CARDIO (indoor) ══════════════════════════
  {
    slug: 'treadmill-run', name: 'Treadmill Run', category: 'cardio', sessionType: 'cardio',
    muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine',
    equipment: 'treadmill', pattern: 'cardio', trackingType: 'duration_distance',
    icon: 'cardio.treadmill', met: 9,
  },
  {
    slug: 'stationary-bike', name: 'Stationary Bike', category: 'cardio', sessionType: 'cardio',
    muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine',
    equipment: 'stationary bike', pattern: 'cardio', trackingType: 'duration_distance',
    icon: 'cardio.cycling', met: 7,
  },
  {
    slug: 'rowing-machine', name: 'Rowing Machine', category: 'cardio', sessionType: 'cardio',
    muscleGroups: ['back', 'legs', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine',
    equipment: 'rower', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.rowing', met: 7,
  },
  {
    slug: 'elliptical', name: 'Elliptical', category: 'cardio', sessionType: 'cardio',
    muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine',
    equipment: 'elliptical', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.elliptical', met: 5,
  },
  {
    slug: 'stair-climber', name: 'Stair Climber', category: 'cardio', sessionType: 'cardio',
    muscleGroups: ['legs', 'glutes', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine',
    equipment: 'stair climber', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.treadmill', met: 9,
  },

  // ══════════════════════════ OUTDOOR ENDURANCE ══════════════════════════
  {
    slug: 'outdoor-run', name: 'Outdoor Run', category: 'endurance', sessionType: 'outdoor',
    muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio',
    trackingType: 'duration_distance', icon: 'cardio.running', met: 9.8,
  },
  {
    slug: 'marathon-training', name: 'Long-Distance / Marathon Training', category: 'endurance',
    sessionType: 'outdoor', muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio',
    pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.marathon', met: 10,
  },
  {
    slug: 'road-cycling', name: 'Road Cycling', category: 'endurance', sessionType: 'outdoor',
    muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio',
    trackingType: 'duration_distance', icon: 'cardio.cycling', met: 8,
  },
  {
    slug: 'swimming', name: 'Open-Water / Pool Swim', category: 'endurance', sessionType: 'outdoor',
    muscleGroups: ['full body', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio',
    trackingType: 'duration_distance', icon: 'cardio.swimming', met: 8,
  },
  {
    slug: 'hiking', name: 'Hiking', category: 'endurance', sessionType: 'outdoor',
    muscleGroups: ['legs', 'glutes', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio',
    trackingType: 'duration_distance', icon: 'cardio.hiking', met: 6,
  },

  // ══════════════════════════ SPORTS ══════════════════════════
  { slug: 'soccer', name: 'Soccer', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.soccer', met: 7 },
  { slug: 'tennis', name: 'Tennis', category: 'sport', sessionType: 'sport', muscleGroups: ['full body', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.tennis', met: 7.3 },
  { slug: 'padel', name: 'Padel', category: 'sport', sessionType: 'sport', muscleGroups: ['full body', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.padel', met: 6 },
  { slug: 'basketball', name: 'Basketball', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.basketball', met: 6.5 },
  { slug: 'volleyball', name: 'Volleyball', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'shoulders', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.volleyball', met: 4 },
  { slug: 'badminton', name: 'Badminton', category: 'sport', sessionType: 'sport', muscleGroups: ['full body', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.badminton', met: 5.5 },

  // ══════════════════════════ MIND-BODY ══════════════════════════
  { slug: 'yoga-flow', name: 'Yoga Flow', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['full body', 'flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.yoga', met: 3 },
  { slug: 'pilates', name: 'Pilates', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['core', 'flexibility'], primaryMuscle: 'core', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.pilates', met: 3 },
  { slug: 'stretching', name: 'Stretching / Mobility', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['full body', 'flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.stretch', met: 2.3 },
  { slug: 'foam-rolling', name: 'Foam Rolling', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['full body', 'recovery'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.stretch', met: 2 },

  // ══════════════════════════ MARTIAL ARTS ══════════════════════════
  { slug: 'ma-boxing', name: 'Boxing', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.gloves', met: 9.5 },
  { slug: 'ma-muay-thai', name: 'Muay Thai', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.strike', met: 10 },
  { slug: 'ma-kickboxing', name: 'Kickboxing', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.strike', met: 9.8 },
  { slug: 'ma-bjj', name: 'Brazilian Jiu-Jitsu', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.grapple', met: 9 },
  { slug: 'ma-judo', name: 'Judo', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.grapple', met: 10 },
  { slug: 'ma-wrestling', name: 'Wrestling', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.grapple', met: 10.5 },
  { slug: 'ma-karate', name: 'Karate', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.belt', met: 8.5 },
  { slug: 'ma-taekwondo', name: 'Taekwondo', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['legs', 'full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.belt', met: 9 },
  { slug: 'ma-mma', name: 'MMA', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.spar', met: 10.3 },
  { slug: 'ma-krav-maga', name: 'Krav Maga', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.spar', met: 9 },
  { slug: 'ma-bag-round', name: 'Heavy Bag Round', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body', 'shoulders'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.bag', met: 8.5 },
  { slug: 'ma-pad-round', name: 'Pad Round', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.gloves', met: 9 },
  { slug: 'ma-shadow-round', name: 'Shadow Boxing Round', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.strike', met: 6.5 },
  { slug: 'ma-sparring-round', name: 'Sparring Round', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.spar', met: 10.5 },
  { slug: 'ma-rolling-round', name: 'Rolling Round', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.grapple', met: 9.5 },
  { slug: 'ma-skipping', name: 'Skipping / Jump Rope', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['calves', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.running', met: 11 },

  // ══════════════════════════ MORE CARDIO VARIATIONS ══════════════════════════
  { slug: 'jump-rope', name: 'Jump Rope', category: 'cardio', sessionType: 'cardio', muscleGroups: ['calves', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.running', met: 11 },
  { slug: 'assault-bike', name: 'Assault / Air Bike', category: 'cardio', sessionType: 'cardio', muscleGroups: ['full body', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.cycling', met: 9 },
  { slug: 'ski-erg', name: 'Ski Erg', category: 'cardio', sessionType: 'cardio', muscleGroups: ['back', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.rowing', met: 9 },
  { slug: 'sled-push', name: 'Sled Push / Drag', category: 'cardio', sessionType: 'cardio', muscleGroups: ['quads', 'glutes'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.treadmill', met: 9.5 },
  { slug: 'battle-ropes', name: 'Battle Ropes', category: 'cardio', sessionType: 'cardio', muscleGroups: ['shoulders', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.rowing', met: 8 },
  { slug: 'incline-walk', name: 'Incline Treadmill Walk', category: 'cardio', sessionType: 'cardio', muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.walk', met: 6 },
  { slug: 'swimming-laps', name: 'Swimming (laps)', category: 'cardio', sessionType: 'cardio', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.swimming', met: 8.3 },

  // ══════════════════════════ MORE SPORTS ══════════════════════════
  { slug: 'handball', name: 'Handball', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.basketball', met: 8 },
  { slug: 'table-tennis', name: 'Table Tennis', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.padel', met: 4 },
  { slug: 'squash', name: 'Squash', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.tennis', met: 7.3 },
  { slug: 'climbing', name: 'Climbing / Bouldering', category: 'sport', sessionType: 'sport', muscleGroups: ['back', 'forearms'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.hiking', met: 8 },

  // ══════════════════════════ MEDITATION ══════════════════════════
  { slug: 'guided-meditation', name: 'Guided Meditation', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.meditation', met: 1.3 },
  { slug: 'breathwork', name: 'Breathwork', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.breath', met: 1.3 },
  { slug: 'body-scan', name: 'Body Scan', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.meditation', met: 1 },
  { slug: 'unguided-sit', name: 'Unguided Sit', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.meditation', met: 1 },

  // ── Salat (prayers) as pre-programmed mind-body practice ──────────────────
  // Logged as meditation with each prayer's typical duration (fard + light sunnah).
  { slug: 'prayer-fajr', name: 'Fajr Prayer (Salat)', category: 'prayer', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'faith.dawn', met: 1.8, description: 'Dawn prayer · ~10 min with sunnah.', instructions: ['Approx. duration: 10 minutes.', 'Two rak\'ah sunnah + two rak\'ah fard.'] },
  { slug: 'prayer-dhuhr', name: 'Dhuhr Prayer (Salat)', category: 'prayer', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'faith.sun', met: 1.8, description: 'Midday prayer · ~12 min with sunnah.', instructions: ['Approx. duration: 12 minutes.', 'Four rak\'ah fard (+ sunnah).'] },
  { slug: 'prayer-asr', name: 'Asr Prayer (Salat)', category: 'prayer', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'faith.afternoon', met: 1.8, description: 'Afternoon prayer · ~8 min.', instructions: ['Approx. duration: 8 minutes.', 'Four rak\'ah fard.'] },
  { slug: 'prayer-maghrib', name: 'Maghrib Prayer (Salat)', category: 'prayer', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'faith.sunset', met: 1.8, description: 'Sunset prayer · ~8 min with sunnah.', instructions: ['Approx. duration: 8 minutes.', 'Three rak\'ah fard + two sunnah.'] },
  { slug: 'prayer-isha', name: 'Isha Prayer (Salat)', category: 'prayer', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'faith.night', met: 1.8, description: 'Night prayer · ~14 min with sunnah & witr.', instructions: ['Approx. duration: 14 minutes.', 'Four rak\'ah fard + sunnah + witr.'] },

  // ══════════════════ CALISTHENICS SKILLS (static holds) ══════════════════
  // Isometric skills. They progress by TIME under control, not by reps — and
  // they must be practised fresh, at the start of a session, never fatigued.
  { slug: 'handstand-hold', name: 'Handstand Hold', category: 'bodyweight', sessionType: 'calisthenics', muscleGroups: ['shoulders', 'core'], primaryMuscle: 'shoulders', subMuscle: 'front_delt', equipmentType: 'bodyweight', equipment: 'bodyweight', pattern: 'core', trackingType: 'duration', icon: 'strength.calisthenics', met: 4, description: 'Free-standing handstand. The base skill for all overhead bodyweight work.', instructions: ['Start against a wall — chest-to-wall teaches a straighter line than back-to-wall.', 'Ribs down, glutes squeezed, push the floor away through the shoulders.', 'Balance corrections come from the fingers, not the hips.'] },
  { slug: 'wall-handstand', name: 'Wall Handstand', category: 'bodyweight', sessionType: 'calisthenics', muscleGroups: ['shoulders', 'core'], primaryMuscle: 'shoulders', subMuscle: 'front_delt', equipmentType: 'bodyweight', equipment: 'wall', pattern: 'core', trackingType: 'duration', icon: 'strength.calisthenics', met: 4, description: 'Chest-to-wall hold — the honest version, and the one that builds the position.' },
  { slug: 'l-sit', name: 'L-Sit', category: 'bodyweight', sessionType: 'calisthenics', muscleGroups: ['core', 'quads'], primaryMuscle: 'core', subMuscle: 'lower_abs', equipmentType: 'bodyweight', equipment: 'parallettes / floor', pattern: 'core', trackingType: 'duration', icon: 'strength.core', met: 4, description: 'Legs straight and parallel to the floor, supported on the hands.', instructions: ['Depress the shoulders — push down hard, do not shrug.', 'Start tucked, then one leg, then both.', 'Hamstring flexibility limits this at least as much as core strength does.'] },
  { slug: 'front-lever-hold', name: 'Front Lever (progression)', category: 'bodyweight', sessionType: 'calisthenics', muscleGroups: ['back', 'core'], primaryMuscle: 'back', subMuscle: 'lats', equipmentType: 'bodyweight', equipment: 'bar / rings', pattern: 'core', trackingType: 'duration', icon: 'strength.pullup', met: 5, description: 'Body horizontal under the bar, arms straight. Tuck → advanced tuck → one leg → full.', instructions: ['Arms locked and straight — a bent arm is a different exercise entirely.', 'Posterior pelvic tilt; a sagging lower back is the usual failure.', 'Move up a progression only when you can hold 10+ clean seconds.'] },
  { slug: 'back-lever-hold', name: 'Back Lever (progression)', category: 'bodyweight', sessionType: 'calisthenics', muscleGroups: ['back', 'chest', 'core'], primaryMuscle: 'back', equipmentType: 'bodyweight', equipment: 'bar / rings', pattern: 'core', trackingType: 'duration', icon: 'strength.pullup', met: 5, description: 'Face-down horizontal hold. Go slowly — this position stresses the biceps tendon and shoulder.' },
  { slug: 'tuck-planche', name: 'Tuck Planche', category: 'bodyweight', sessionType: 'calisthenics', muscleGroups: ['shoulders', 'core'], primaryMuscle: 'shoulders', subMuscle: 'front_delt', equipmentType: 'bodyweight', equipment: 'parallettes / floor', pattern: 'core', trackingType: 'duration', icon: 'strength.calisthenics', met: 5, description: 'Knees tucked, feet off the floor, weight fully on the hands. The first real planche step.' },
  { slug: 'planche-lean', name: 'Planche Lean', category: 'bodyweight', sessionType: 'calisthenics', muscleGroups: ['shoulders', 'core'], primaryMuscle: 'shoulders', subMuscle: 'front_delt', equipmentType: 'bodyweight', equipment: 'bodyweight', pattern: 'core', trackingType: 'duration', icon: 'strength.calisthenics', met: 4, description: 'Push-up position leaning far forward — builds the straight-arm strength a planche needs.' },
  { slug: 'human-flag', name: 'Human Flag (progression)', category: 'bodyweight', sessionType: 'calisthenics', muscleGroups: ['obliques', 'shoulders'], primaryMuscle: 'core', subMuscle: 'obliques', equipmentType: 'bodyweight', equipment: 'vertical pole', pattern: 'core', trackingType: 'duration', icon: 'strength.calisthenics', met: 5 },
  { slug: 'dragon-flag', name: 'Dragon Flag', category: 'bodyweight', sessionType: 'calisthenics', muscleGroups: ['core'], primaryMuscle: 'core', subMuscle: 'lower_abs', equipmentType: 'bodyweight', equipment: 'bench', pattern: 'core', trackingType: 'reps_only', icon: 'strength.core', met: 5, description: 'Whole body rigid, pivoting from the shoulders. Lower slowly — the negative is the exercise.' },
  { slug: 'skin-the-cat', name: 'Skin the Cat', category: 'bodyweight', sessionType: 'calisthenics', muscleGroups: ['shoulders', 'back'], primaryMuscle: 'shoulders', equipmentType: 'bodyweight', equipment: 'rings', pattern: 'core', trackingType: 'reps_only', icon: 'strength.calisthenics', met: 4, description: 'Full shoulder rotation through a hang on rings — mobility and strength at end range.' },
  { slug: 'push-up-explosive', name: 'Explosive / Clapping Push-Up', category: 'bodyweight', sessionType: 'calisthenics', muscleGroups: ['chest', 'triceps'], primaryMuscle: 'chest', equipmentType: 'bodyweight', equipment: 'bodyweight', pattern: 'horizontal_push', trackingType: 'reps_only', icon: 'strength.calisthenics', met: 8, description: 'Push hard enough to leave the floor. Stop the set the moment speed drops — this is power work, not endurance.' },
  { slug: 'handstand-walk', name: 'Handstand Walk', category: 'bodyweight', sessionType: 'calisthenics', muscleGroups: ['shoulders', 'core'], primaryMuscle: 'shoulders', equipmentType: 'bodyweight', equipment: 'bodyweight', pattern: 'carry', trackingType: 'duration_distance', icon: 'strength.calisthenics', met: 6 },

  // ══════════════════════ CARDIO MACHINES (full range) ══════════════════════
  // METs from the Compendium of Physical Activities (Ainsworth 2011). Machines
  // that are effort-dependent carry a mid-range value — your logged duration and
  // bodyweight do the rest.
  { slug: 'stairmaster', name: 'StairMaster / Stepmill', category: 'cardio', sessionType: 'cardio', muscleGroups: ['glutes', 'quads', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine', equipment: 'stepmill', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.stairs', met: 9.0, description: 'Revolving staircase — the highest-calorie low-impact machine in most gyms.', instructions: ['Stand tall, hands off the rails (or light touch only).', 'Full foot on each step, drive through the heel.', 'Leaning on the rails cuts the work by up to a third.'] },
  { slug: 'stair-machine-intervals', name: 'Stair Machine Intervals', category: 'cardio', sessionType: 'cardio', muscleGroups: ['glutes', 'quads', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine', equipment: 'stepmill', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.stairs', met: 11, description: 'Alternating hard/easy levels on the stepmill.' },
  { slug: 'spin-bike', name: 'Spin Bike', category: 'cardio', sessionType: 'cardio', muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine', equipment: 'spin bike', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.cycling', met: 8.5, description: 'Weighted-flywheel bike — seated and standing work, heavy resistance.' },
  { slug: 'recumbent-bike', name: 'Recumbent Bike', category: 'cardio', sessionType: 'cardio', muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine', equipment: 'recumbent bike', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.cycling', met: 5.5, description: 'Back-supported bike — easiest on the lower back and knees.' },
  { slug: 'bike-intervals', name: 'Bike Intervals', category: 'cardio', sessionType: 'cardio', muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine', equipment: 'stationary bike', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.interval', met: 10, description: 'Hard efforts against heavy resistance with easy spinning between.' },
  { slug: 'treadmill-intervals', name: 'Treadmill Intervals', category: 'cardio', sessionType: 'cardio', muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine', equipment: 'treadmill', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.interval', met: 11, description: 'Repeated fast runs with walking or jogging recoveries.' },
  { slug: 'treadmill-hill', name: 'Treadmill Hill Run', category: 'cardio', sessionType: 'cardio', muscleGroups: ['legs', 'glutes', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine', equipment: 'treadmill', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.elevation', met: 11, description: 'Running at 4–10% incline — more glute and calf, less impact per km.' },
  { slug: 'curved-treadmill', name: 'Curved (Self-Powered) Treadmill', category: 'cardio', sessionType: 'cardio', muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine', equipment: 'curved treadmill', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.treadmill', met: 12, description: 'Motorless belt driven by you — roughly 30% harder than a motorised one at the same pace.' },
  { slug: 'arc-trainer', name: 'Arc Trainer', category: 'cardio', sessionType: 'cardio', muscleGroups: ['legs', 'glutes', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine', equipment: 'arc trainer', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.elliptical', met: 7.5, description: 'Elliptical-like stride with an adjustable arc — low impact, high resistance.' },
  { slug: 'versaclimber', name: 'VersaClimber', category: 'cardio', sessionType: 'cardio', muscleGroups: ['full body', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine', equipment: 'versaclimber', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.stairs', met: 11, description: 'Vertical climbing — arms and legs together, zero impact.' },
  { slug: 'hand-ergometer', name: 'Arm Bike / Hand Ergometer', category: 'cardio', sessionType: 'cardio', muscleGroups: ['shoulders', 'arms', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine', equipment: 'arm ergometer', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.cycling', met: 5, description: 'Upper-body-only cardio — the option when a leg injury rules out everything else.' },
  { slug: 'rowing-intervals', name: 'Rowing Intervals', category: 'cardio', sessionType: 'cardio', muscleGroups: ['back', 'legs', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine', equipment: 'rower', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.interval', met: 9.5, description: 'Hard 250–500 m pieces with paddling between.' },
  { slug: 'elliptical-intervals', name: 'Elliptical Intervals', category: 'cardio', sessionType: 'cardio', muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'machine', equipment: 'elliptical', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.interval', met: 7.5 },

  // ══════════════════ ROPE & CONDITIONING (no machine needed) ══════════════════
  { slug: 'jump-rope-basic', name: 'Jump Rope — Basic Bounce', category: 'cardio', sessionType: 'cardio', muscleGroups: ['calves', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'other', equipment: 'jump rope', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.jumpRope', met: 10, description: 'Two-foot bounce, one turn per jump — the base every other rope skill is built on.', instructions: ['Elbows in, turn the rope with the wrists, not the shoulders.', 'Jump 2–3 cm only — just enough to clear the rope.', 'Land on the balls of the feet, knees soft.'] },
  { slug: 'jump-rope-alternate', name: 'Jump Rope — Boxer Skip', category: 'cardio', sessionType: 'cardio', muscleGroups: ['calves', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'other', equipment: 'jump rope', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.jumpRope', met: 11, description: 'Shifting weight foot to foot — the rhythm you can hold for a full round.' },
  { slug: 'jump-rope-high-knees', name: 'Jump Rope — High Knees', category: 'cardio', sessionType: 'cardio', muscleGroups: ['legs', 'core', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'other', equipment: 'jump rope', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.jumpRope', met: 12.3 },
  { slug: 'jump-rope-double-unders', name: 'Jump Rope — Double Unders', category: 'cardio', sessionType: 'cardio', muscleGroups: ['calves', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'other', equipment: 'jump rope', pattern: 'cardio', trackingType: 'reps_only', icon: 'cardio.jumpRope', met: 12.3, description: 'Two rope turns per jump — track them as reps, they are a skill before they are conditioning.', instructions: ['Jump a little higher and turn much faster — speed comes from the wrists.', 'Stay tall; piking at the hips is what breaks the set.'] },
  { slug: 'jump-rope-crossovers', name: 'Jump Rope — Crossovers', category: 'cardio', sessionType: 'cardio', muscleGroups: ['shoulders', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'other', equipment: 'jump rope', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.jumpRope', met: 11 },
  { slug: 'burpees', name: 'Burpees', category: 'cardio', sessionType: 'cardio', muscleGroups: ['full body', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'bodyweight', pattern: 'cardio', trackingType: 'reps_only', icon: 'cardio.plyo', met: 8, description: 'Squat, kick back, push-up, jump — the cheapest full-body conditioning there is.' },
  { slug: 'mountain-climbers', name: 'Mountain Climbers', category: 'cardio', sessionType: 'cardio', muscleGroups: ['core', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'bodyweight', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.plyo', met: 8 },
  { slug: 'high-knees', name: 'High Knees (in place)', category: 'cardio', sessionType: 'cardio', muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'bodyweight', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.running', met: 8 },
  { slug: 'jumping-jacks', name: 'Jumping Jacks', category: 'cardio', sessionType: 'cardio', muscleGroups: ['full body', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'bodyweight', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.plyo', met: 7.7 },
  { slug: 'box-step-ups-cardio', name: 'Box Step-Ups (continuous)', category: 'cardio', sessionType: 'cardio', muscleGroups: ['quads', 'glutes', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'other', equipment: 'box', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.stairs', met: 8.5, description: 'The poor man\'s stepmill — knee-height box, alternating legs.' },
  { slug: 'box-jumps', name: 'Box Jumps', category: 'cardio', sessionType: 'cardio', muscleGroups: ['quads', 'glutes', 'calves'], primaryMuscle: 'cardio', equipmentType: 'other', equipment: 'box', pattern: 'cardio', trackingType: 'reps_only', icon: 'cardio.plyo', met: 8, description: 'Explosive jump onto a box — step back down, never rebound down when tired.' },
  { slug: 'shuttle-runs', name: 'Shuttle Runs', category: 'cardio', sessionType: 'cardio', muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'bodyweight', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.agility', met: 9, description: 'Sprint, decelerate, turn, repeat — change of direction is the whole point.' },
  { slug: 'agility-ladder', name: 'Agility Ladder Drills', category: 'cardio', sessionType: 'cardio', muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'other', equipment: 'agility ladder', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.agility', met: 6.5 },
  { slug: 'bear-crawl', name: 'Bear Crawl', category: 'cardio', sessionType: 'cardio', muscleGroups: ['core', 'shoulders'], primaryMuscle: 'cardio', equipmentType: 'bodyweight', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.plyo', met: 7 },
  { slug: 'loaded-carry-cardio', name: 'Loaded Carry (conditioning)', category: 'cardio', sessionType: 'cardio', muscleGroups: ['forearms', 'core', 'traps'], primaryMuscle: 'cardio', equipmentType: 'dumbbell', equipment: 'dumbbells / kettlebells', pattern: 'carry', trackingType: 'duration', icon: 'strength.kettlebell', met: 7.5, description: 'Heavy carries for time — grip, core and conditioning at once.' },
  { slug: 'kettlebell-swing-cardio', name: 'Kettlebell Swings (conditioning)', category: 'cardio', sessionType: 'cardio', muscleGroups: ['glutes', 'hamstrings', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'other', equipment: 'kettlebell', pattern: 'hinge', trackingType: 'reps_only', icon: 'strength.kettlebell', met: 9.8 },
  { slug: 'stationary-march', name: 'Marching in Place', category: 'cardio', sessionType: 'cardio', muscleGroups: ['legs'], primaryMuscle: 'cardio', equipmentType: 'bodyweight', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.walk', met: 3.5, description: 'Lowest-barrier cardio — for deload days, small rooms and bad weather.' },
  { slug: 'dance-cardio', name: 'Dance Cardio', category: 'cardio', sessionType: 'cardio', muscleGroups: ['full body', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'bodyweight', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.plyo', met: 7.3 },
  { slug: 'aqua-jogging', name: 'Aqua Jogging', category: 'cardio', sessionType: 'cardio', muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', equipmentType: 'other', equipment: 'pool', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.swimming', met: 8, description: 'Running form in deep water — zero impact, the standard way to keep run fitness through an injury.' },

  // ══════════════════ MARTIAL ARTS — TECHNICAL DRILLS ══════════════════
  // Rounds are the natural unit here, so most track as duration. Progress in
  // combat sport is technique under fatigue, not load — the methods screen
  // explains how each one is measured.
  { slug: 'ma-jab-cross', name: 'Jab–Cross Drill', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['shoulders', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.gloves', met: 7, description: 'The two punches everything else is built on, thrown until they are automatic.', instructions: ['Turn the lead foot and hip on the jab, the rear foot on the cross.', 'Return the hand to the cheek — every time, especially when tired.', 'Exhale sharply on contact.'] },
  { slug: 'ma-combination-drill', name: 'Combination Drill (3–5 punch)', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.gloves', met: 8.5, description: 'Set combinations thrown on the bag, pads or air until the sequence needs no thought.' },
  { slug: 'ma-footwork-drill', name: 'Footwork Drill', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['legs', 'calves'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.footwork', met: 6.5, description: 'Stepping, pivoting, angling and cutting the ring — no strikes, just position.', instructions: ['Never cross the feet.', 'Step with the near foot first, then recover the stance.', 'Stay in your stance the whole round — that is the drill.'] },
  { slug: 'ma-defense-drill', name: 'Defence Drill (slip / roll / parry)', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['core', 'legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.defense', met: 7, description: 'Slipping, rolling, parrying and blocking — head movement drilled on its own.' },
  { slug: 'ma-counter-drill', name: 'Counter-Attack Drill', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.defense', met: 7.5, description: 'Defend, then answer immediately — the habit that turns defence into offence.' },
  { slug: 'ma-kick-drill', name: 'Kick Drill (roundhouse / teep / front)', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['legs', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.kick', met: 8.5, description: 'Kicks drilled by number on pads, bag or in the air.', instructions: ['Pivot the support foot fully — the hip cannot turn if the foot does not.', 'Return to stance under control; a dropped leg is a takedown.'] },
  { slug: 'ma-knee-elbow-drill', name: 'Knee & Elbow Drill', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['core', 'legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.strike', met: 8.5, description: 'Muay Thai short weapons — from range and from the clinch.' },
  { slug: 'ma-clinch-work', name: 'Clinch Work', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['traps', 'core', 'forearms'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.clinch', met: 9, description: 'Neck control, inside position, off-balancing and knees from the plum.' },
  { slug: 'ma-takedown-entries', name: 'Takedown Entries', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['legs', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.grapple', met: 9, description: 'Level change, penetration step and finish — doubles, singles and body locks.' },
  { slug: 'ma-sprawl-drill', name: 'Sprawl Drill', aliasOf: 'sprawl-drill', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['core', 'legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'reps_only', icon: 'martial.defense', met: 9, description: 'Hips down and back to defend the shot, then back to stance. Counted as reps.' },
  { slug: 'ma-shrimping', name: 'Shrimping / Hip Escapes', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['core', 'obliques'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.grapple', met: 6.5, description: 'The single most important movement in ground fighting — creating space from under someone.' },
  { slug: 'ma-bridging', name: 'Bridging & Rolls', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['glutes', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.grapple', met: 6.5 },
  { slug: 'ma-guard-passing', name: 'Guard Passing Drill', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['core', 'legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.grapple', met: 8.5 },
  { slug: 'ma-guard-retention', name: 'Guard Retention Drill', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['core', 'hamstrings'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.grapple', met: 8 },
  { slug: 'ma-submission-drill', name: 'Submission Drill', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.grapple', met: 7.5, description: 'Repetition of a single finish from a fixed position, both sides.' },
  { slug: 'ma-escape-drill', name: 'Escape Drill (mount / side / back)', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['core', 'full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.defense', met: 8.5, description: 'Getting out of bad positions — the half of grappling most people skip.' },
  { slug: 'ma-positional-sparring', name: 'Positional Sparring', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.spar', met: 9.5, description: 'Live rounds that start and reset from one position — the fastest way to fix a specific hole.' },
  { slug: 'ma-flow-rolling', name: 'Flow Rolling', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.grapple', met: 7, description: 'Light continuous grappling with no resistance spikes — technique at conversational pace.' },
  { slug: 'ma-technical-sparring', name: 'Technical Sparring (light)', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.spar', met: 8.5, description: 'Controlled contact, working assignments rather than trying to win.' },
  { slug: 'ma-forms-kata', name: 'Forms / Kata / Poomsae', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.forms', met: 5.5, description: 'Prearranged sequences run for precision, power and breath control.' },
  { slug: 'ma-mitt-work', name: 'Focus Mitt Work', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.gloves', met: 9, description: 'Coach-led mitt rounds — the closest thing to fighting that is still a drill.' },
  { slug: 'ma-double-end-bag', name: 'Double-End Bag', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['shoulders', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.bag', met: 7.5, description: 'Timing and accuracy against a moving target.' },
  { slug: 'ma-speed-bag', name: 'Speed Bag', aliasOf: 'speed-bag', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['shoulders'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.bag', met: 6, description: 'Rhythm and shoulder endurance.' },
  { slug: 'ma-neck-conditioning', name: 'Neck Conditioning', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['neck', 'traps'], primaryMuscle: 'cardio', pattern: 'core', trackingType: 'duration', icon: 'martial.grapple', met: 4, description: 'Bridges and isometric holds. Build slowly — the neck is not a muscle to rush.', instructions: ['Start with isometric holds against your own hand before any bridging.', 'Never load a bridge with weight until months of bodyweight work.'] },
  { slug: 'ma-fight-conditioning', name: 'Fight Conditioning Circuit', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.spar', met: 10, description: 'Rounds of burpees, sprawls, knees, sprints and carries at fight tempo.' },
  { slug: 'ma-weapon-forms', name: 'Weapon Forms (kobudo / kali / kendo)', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body', 'forearms'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.weapon', met: 6 },
  { slug: 'ma-aikido', name: 'Aikido', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.belt', met: 6.5 },
  { slug: 'ma-capoeira', name: 'Capoeira', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.strike', met: 9 },
  { slug: 'ma-sambo', name: 'Sambo', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.grapple', met: 10 },
  { slug: 'ma-kung-fu', name: 'Kung Fu / Wushu', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.forms', met: 8 },
  { slug: 'ma-fencing', name: 'Fencing', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['legs', 'forearms'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.weapon', met: 6 },

  // ══════════════════ MORE SPORTS ══════════════════
  { slug: 'rugby', name: 'Rugby', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.handball', met: 8.3 },
  { slug: 'futsal', name: 'Futsal', category: 'sport', sessionType: 'sport', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.soccer', met: 8 },
  { slug: 'water-polo', name: 'Water Polo', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.swimming', met: 10 },
  { slug: 'skating', name: 'Skating / Rollerblading', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'glutes'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.skate', met: 7 },
  { slug: 'skiing', name: 'Skiing / Snowboarding', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.ski', met: 7 },
  { slug: 'surfing', name: 'Surfing / Paddleboarding', category: 'sport', sessionType: 'sport', muscleGroups: ['back', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.surf', met: 5 },
  { slug: 'golf-walking', name: 'Golf (walking the course)', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.padel', met: 4.8 },

  // ══════════════════ MORE OUTDOOR ══════════════════
  { slug: 'trail-run', name: 'Trail Run', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.elevation', met: 10.5, description: 'Uneven ground and climbing — harder than the pace suggests.' },
  { slug: 'hill-repeats', name: 'Hill Repeats', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs', 'glutes'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.elevation', met: 12, description: 'Hard efforts up, easy jog down — strength and VO₂max in one session.' },
  { slug: 'track-intervals', name: 'Track Intervals', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.interval', met: 12.5, description: 'Measured repeats (400 m / 800 m / 1 km) with timed recoveries.' },
  { slug: 'sprint-repeats', name: 'Sprint Repeats', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['hamstrings', 'glutes'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.running', met: 13, description: 'Maximal 20–60 m efforts with full recovery. Warm up properly — this is where hamstrings tear.' },
  { slug: 'rucking', name: 'Rucking (weighted walk)', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs', 'back'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.hiking', met: 7, description: 'Walking with a loaded pack — most of the aerobic benefit of running at a fraction of the joint cost.' },
  { slug: 'stair-climbing-outdoor', name: 'Stair Climbing (outdoor)', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['glutes', 'quads'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.stairs', met: 9 },
  { slug: 'mountain-biking', name: 'Mountain Biking', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.cycling', met: 8.5 },
  { slug: 'open-water-swim', name: 'Open-Water Swim', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.swimming', met: 9 },

  // ══════════════════ MORE MIND-BODY ══════════════════
  { slug: 'vinyasa-yoga', name: 'Vinyasa Yoga', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['full body', 'flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.yoga', met: 4 },
  { slug: 'yin-yoga', name: 'Yin Yoga', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.yoga', met: 2.3, description: 'Long passive holds (2–5 min) targeting connective tissue.' },
  { slug: 'hip-mobility', name: 'Hip Mobility Routine', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['glutes', 'flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.stretch', met: 2.5 },
  { slug: 'shoulder-mobility', name: 'Shoulder Mobility Routine', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['shoulders', 'flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.stretch', met: 2.5 },
  { slug: 'thoracic-mobility', name: 'Thoracic / Posture Routine', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['back', 'flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.stretch', met: 2.5 },
  { slug: 'tai-chi', name: 'Tai Chi', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['full body', 'flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'martial.forms', met: 3 },
  { slug: 'animal-flow', name: 'Animal Flow / Ground Mobility', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['full body', 'core'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.pilates', met: 4.5 },

  // ══════════════════════════ SPORTS — TEAM & BALL ══════════════════════════
  { slug: 'american-football', name: 'American Football', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.football', met: 8 },
  { slug: 'cricket', name: 'Cricket', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.cricket', met: 4.8 },
  { slug: 'baseball-softball', name: 'Baseball / Softball', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.baseball', met: 5 },
  { slug: 'field-hockey', name: 'Field Hockey', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.hockey', met: 7.8 },
  { slug: 'ice-hockey', name: 'Ice Hockey', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'glutes'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.hockey', met: 8 },
  { slug: 'lacrosse', name: 'Lacrosse', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.hockey', met: 8 },
  { slug: 'netball', name: 'Netball', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'shoulders'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.basketball', met: 6.5 },
  { slug: 'ultimate-frisbee', name: 'Ultimate Frisbee', category: 'sport', sessionType: 'sport', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.disc', met: 8 },
  { slug: 'beach-volleyball', name: 'Beach Volleyball', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'shoulders'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.volleyball', met: 8, description: 'Sand roughly doubles the leg cost of the same movement.' },
  { slug: 'beach-soccer', name: 'Beach Soccer', category: 'sport', sessionType: 'sport', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.soccer', met: 8.5 },
  { slug: 'dodgeball', name: 'Dodgeball', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.team', met: 5 },

  // ── Racket & court ──
  { slug: 'pickleball', name: 'Pickleball', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.padel', met: 5.5 },
  { slug: 'racquetball', name: 'Racquetball', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.tennis', met: 7 },
  { slug: 'beach-tennis', name: 'Beach Tennis', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.tennis', met: 6.5 },

  // ── Water sports ──
  { slug: 'kayaking', name: 'Kayaking / Canoeing', category: 'sport', sessionType: 'sport', muscleGroups: ['back', 'shoulders', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'sport.paddle', met: 5 },
  { slug: 'rowing-crew', name: 'Rowing (crew / sculling)', category: 'sport', sessionType: 'sport', muscleGroups: ['back', 'legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.rowing', met: 7 },
  { slug: 'sailing', name: 'Sailing', category: 'sport', sessionType: 'sport', muscleGroups: ['core', 'forearms'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.surf', met: 3.3 },
  { slug: 'windsurfing', name: 'Windsurfing / Kitesurfing', category: 'sport', sessionType: 'sport', muscleGroups: ['core', 'back'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.surf', met: 5.5 },
  { slug: 'scuba-diving', name: 'Scuba Diving', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.dive', met: 7 },
  { slug: 'snorkelling', name: 'Snorkelling', category: 'sport', sessionType: 'sport', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.dive', met: 5 },
  { slug: 'water-aerobics', name: 'Water Aerobics', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.swimming', met: 5.5, description: 'Joint-friendly conditioning — the standard option when impact is off the table.' },

  // ── Winter ──
  { slug: 'ice-skating', name: 'Ice Skating', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'glutes'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.skate', met: 7 },
  { slug: 'snowshoeing', name: 'Snowshoeing', category: 'sport', sessionType: 'sport', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'sport.snow', met: 8 },
  { slug: 'curling', name: 'Curling', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.snow', met: 4 },

  // ── Athletics, gym & individual ──
  { slug: 'gymnastics', name: 'Gymnastics', category: 'sport', sessionType: 'sport', muscleGroups: ['full body', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.gym', met: 5.3 },
  { slug: 'trampoline', name: 'Trampoline', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.plyo', met: 4.5 },
  { slug: 'parkour', name: 'Parkour', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.agility', met: 8 },
  { slug: 'track-field', name: 'Track & Field (throws / jumps)', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.target', met: 6 },
  { slug: 'archery', name: 'Archery', category: 'sport', sessionType: 'sport', muscleGroups: ['back', 'shoulders'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.archery', met: 4.3 },
  { slug: 'bowling', name: 'Bowling', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.bowling', met: 3 },
  { slug: 'disc-golf', name: 'Disc Golf', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.disc', met: 4.8 },
  { slug: 'horse-riding', name: 'Horse Riding', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.horse', met: 5.5 },
  { slug: 'skateboarding', name: 'Skateboarding', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.skate', met: 5 },
  { slug: 'bmx-cycling', name: 'BMX / Dirt Jumping', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.cycling', met: 8.5 },
  { slug: 'dance-ballroom', name: 'Ballroom / Latin Dance', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.dance', met: 5.5 },
  { slug: 'dance-hiphop', name: 'Hip-Hop / Street Dance', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.dance', met: 7.3 },
  { slug: 'dance-ballet', name: 'Ballet', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.dance', met: 5 },

  // ── Sport-specific practice (the work that isn't the match) ──
  { slug: 'sport-shooting-drill', name: 'Shooting / Finishing Drill', category: 'sport', sessionType: 'sport', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.target', met: 5.5, description: 'Repetition of the finishing action — the single highest-value use of solo practice time.' },
  { slug: 'sport-passing-drill', name: 'Passing / Ball-Handling Drill', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.team', met: 5 },
  { slug: 'sport-serve-practice', name: 'Serve / Set-Piece Practice', category: 'sport', sessionType: 'sport', muscleGroups: ['shoulders', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'reps_only', icon: 'sport.tennis', met: 4.5, description: 'Counted repetitions of a closed skill — the one place rep count really is the metric.' },
  { slug: 'sport-wall-ball', name: 'Wall Practice (solo rally)', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.tennis', met: 6 },
  { slug: 'sport-keeper-training', name: 'Goalkeeper / Defensive Drill', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'sport.soccer', met: 6 },
  { slug: 'sport-footwork', name: 'Sport Footwork & Agility', category: 'sport', sessionType: 'sport', muscleGroups: ['legs', 'calves'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.agility', met: 7 },
  { slug: 'sport-plyometrics', name: 'Plyometrics (jump training)', category: 'sport', sessionType: 'sport', muscleGroups: ['quads', 'glutes', 'calves'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'reps_only', icon: 'cardio.plyo', met: 8, description: 'Low volume, full recovery, maximum intent. Quality collapses fast — stop when height drops.' },
  { slug: 'sport-warmup', name: 'Sport Warm-Up (RAMP)', category: 'sport', sessionType: 'sport', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'mobility', trackingType: 'duration', icon: 'core.timer', met: 4, description: 'Raise, Activate, Mobilise, Potentiate — the structure most teams use before play.' },

  // ══════════════════════════ OUTDOOR ══════════════════════════
  { slug: 'easy-run', name: 'Easy Run', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.running', met: 8.3, description: 'Conversational pace. Most of your running should be here, and most people run it too fast.' },
  { slug: 'recovery-run', name: 'Recovery Run', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.running', met: 6, description: 'Deliberately slow and short, the day after something hard.' },
  { slug: 'long-run', name: 'Long Run', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.marathon', met: 9.8, description: 'The week\'s distance day. Build it by about 10% a week, never more.' },
  { slug: 'progression-run', name: 'Progression Run', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.pace', met: 10, description: 'Start easy, finish fast — teaches pacing and finishing strong on tired legs.' },
  { slug: 'fartlek-run', name: 'Fartlek Run', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.interval', met: 11, description: 'Unstructured speed play — surge to a landmark, ease off, repeat.' },
  { slug: 'cross-country-run', name: 'Cross-Country Run', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs', 'core'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.elevation', met: 10.3 },
  { slug: 'beach-sand-run', name: 'Beach / Sand Run', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['calves', 'legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.running', met: 11, description: 'Soft sand is far harder than it looks — start with half the distance you would run on road.' },
  { slug: 'hill-sprints', name: 'Hill Sprints', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['glutes', 'hamstrings'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'reps_only', icon: 'cardio.elevation', met: 13, description: 'Short maximal climbs — most of the benefit of sprinting with much less hamstring risk.' },
  { slug: 'brisk-walk', name: 'Brisk Walk', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.walk', met: 4.3 },
  { slug: 'nordic-walking', name: 'Nordic Walking (poles)', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs', 'back'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.walk', met: 6.8, description: 'Poles bring the upper body in — noticeably higher energy cost than walking at the same speed.' },
  { slug: 'trekking', name: 'Trekking / Backpacking', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs', 'back'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.hiking', met: 7.8 },
  { slug: 'mountaineering', name: 'Mountaineering / Scrambling', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs', 'full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.elevation', met: 8 },
  { slug: 'orienteering', name: 'Orienteering', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.gps', met: 9 },
  { slug: 'obstacle-race', name: 'Obstacle Course Training', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.agility', met: 9.5 },
  { slug: 'outdoor-bootcamp', name: 'Outdoor Bootcamp / Park Circuit', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.plyo', met: 8 },
  { slug: 'calisthenics-park', name: 'Calisthenics Park Session', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'strength.calisthenics', met: 6 },
  { slug: 'gravel-cycling', name: 'Gravel / Cyclocross Ride', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.cycling', met: 8.5 },
  { slug: 'cycling-commute', name: 'Bike Commute', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.cycling', met: 6.8, description: 'Training you were going to do anyway — the most reliably repeated session there is.' },
  { slug: 'cycling-hills', name: 'Cycling Hill Climbs', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs', 'glutes'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.elevation', met: 10 },
  { slug: 'cycling-time-trial', name: 'Cycling Time Trial', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.pace', met: 12 },
  { slug: 'paddleboarding', name: 'Stand-Up Paddleboarding', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['core', 'shoulders'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'sport.paddle', met: 6 },
  { slug: 'cross-country-skiing', name: 'Cross-Country Skiing', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['full body'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'sport.ski', met: 9, description: 'One of the highest whole-body aerobic demands of any activity.' },
  { slug: 'ski-touring', name: 'Ski Touring / Splitboarding', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'sport.snow', met: 9 },
  { slug: 'brick-session', name: 'Brick Session (bike → run)', category: 'endurance', sessionType: 'outdoor', muscleGroups: ['legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration_distance', icon: 'cardio.interval', met: 10, description: 'Running straight off the bike. Legs feel wrong for the first kilometre — that is exactly what you are training.' },

  // ══════════════════════════ MIND-BODY ══════════════════════════
  { slug: 'hatha-yoga', name: 'Hatha Yoga', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['full body', 'flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.yoga', met: 2.5, description: 'Slower, held postures with breath — the classic starting point.' },
  { slug: 'ashtanga-yoga', name: 'Ashtanga Yoga', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['full body', 'flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.yoga', met: 4.5, description: 'A fixed, demanding sequence performed in the same order each time.' },
  { slug: 'hot-yoga', name: 'Hot Yoga / Bikram', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['full body', 'flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.yoga', met: 4, description: 'Heated room. Hydrate deliberately — the heat raises perceived effort more than actual work.' },
  { slug: 'restorative-yoga', name: 'Restorative Yoga', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['flexibility', 'recovery'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.spa', met: 2, description: 'Fully supported poses held for minutes. A recovery session, not a workout.' },
  { slug: 'kundalini-yoga', name: 'Kundalini Yoga', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['full body'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.yoga', met: 3 },
  { slug: 'chair-yoga', name: 'Chair / Accessible Yoga', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.yoga', met: 2, description: 'Seated and supported — for limited mobility, injury, or a desk break.' },
  { slug: 'sun-salutations', name: 'Sun Salutations', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['full body'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'reps_only', icon: 'mindbody.yoga', met: 3.5, description: 'Counted rounds of the classic flow — a complete short practice on its own.' },
  { slug: 'reformer-pilates', name: 'Reformer Pilates', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['core', 'legs'], primaryMuscle: 'core', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.pilates', met: 3.5 },
  { slug: 'pilates-core', name: 'Pilates Core Series', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['core'], primaryMuscle: 'core', pattern: 'core', trackingType: 'duration', icon: 'mindbody.pilates', met: 3 },
  { slug: 'barre', name: 'Barre', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['legs', 'glutes', 'core'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.barre', met: 4 },
  { slug: 'qigong', name: 'Qigong', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['full body'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'martial.forms', met: 2.5 },
  { slug: 'somatics', name: 'Somatics / Feldenkrais', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['full body'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.spa', met: 2, description: 'Small, slow, attentive movement aimed at how you move rather than how hard.' },
  { slug: 'dynamic-warmup', name: 'Dynamic Warm-Up', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['full body'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'core.timer', met: 3.5, description: 'Movement-based prep before training. Static stretching belongs after, not here.' },
  { slug: 'joint-cars', name: 'Joint CARs (controlled rotations)', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['full body'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.joint', met: 2.5, description: 'Slow end-range circles at each joint — a daily audit of the range you actually own.' },
  { slug: 'pnf-stretching', name: 'PNF / Contract-Relax Stretching', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.stretch', met: 2.5, description: 'Contract into the stretch, then relax deeper. The most effective way to add passive range.' },
  { slug: 'static-stretch-routine', name: 'Static Stretch Routine', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.stretch', met: 2.3 },
  { slug: 'ankle-mobility', name: 'Ankle Mobility Routine', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['calves', 'flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.joint', met: 2.3, description: 'Usually the real reason a squat won\'t go deep.' },
  { slug: 'wrist-mobility', name: 'Wrist & Elbow Prep', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['forearms', 'flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.joint', met: 2, description: 'Essential before front squats, handstands and any heavy pressing.' },
  { slug: 'neck-shoulder-release', name: 'Neck & Upper-Trap Release', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['neck', 'traps'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.spa', met: 2 },
  { slug: 'spinal-segmentation', name: 'Spinal Segmentation', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['back', 'core'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.stretch', met: 2.3 },
  { slug: 'hamstring-routine', name: 'Hamstring Flexibility Routine', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['hamstrings', 'flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.stretch', met: 2.3 },
  { slug: 'adductor-routine', name: 'Adductor / Groin Routine', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['legs', 'flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.stretch', met: 2.3 },
  { slug: 'deep-squat-hold', name: 'Deep Squat Hold', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['legs', 'flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.stretch', met: 2.5, description: 'Sit at the bottom of a squat and breathe. Accumulate minutes across the day.' },
  { slug: 'couch-stretch', name: 'Couch Stretch (hip flexors)', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['quads', 'flexibility'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.stretch', met: 2.3 },
  { slug: 'balance-training', name: 'Balance Training', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['legs', 'core'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.balance', met: 2.8, description: 'Single-leg and unstable-surface work. One of the few things with real evidence for preventing falls later in life.' },
  { slug: 'posture-drills', name: 'Posture & Desk-Break Drills', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['back', 'shoulders'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.stretch', met: 2, description: 'Short resets through a working day. Frequency beats duration here.' },
  { slug: 'massage-gun', name: 'Massage Gun / Self-Massage', category: 'mindbody', sessionType: 'mindbody', muscleGroups: ['recovery'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.spa', met: 2, description: 'Helps short-term soreness and range. It does not repair tissue — recovery still comes from sleep and food.' },

  // ══════════════════════════ MEDITATION ══════════════════════════
  { slug: 'mindfulness-breath', name: 'Mindfulness of Breath', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.meditation', met: 1.3, description: 'One anchor, return to it each time you notice you have drifted. Noticing IS the practice.' },
  { slug: 'noting-practice', name: 'Noting Practice', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.focus', met: 1.3, description: 'Silently label what arises — "thinking", "hearing", "planning" — then let it go.' },
  { slug: 'open-awareness', name: 'Open Awareness', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.meditation', met: 1.3, description: 'No single object — attention stays wide and receptive.' },
  { slug: 'loving-kindness', name: 'Loving-Kindness (Metta)', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.gratitude', met: 1.3, description: 'Directed goodwill: self, someone close, someone neutral, someone difficult.' },
  { slug: 'self-compassion', name: 'Self-Compassion Break', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.gratitude', met: 1.2, description: 'Three steps for a hard moment: this is hard · everyone struggles · what do I need.' },
  { slug: 'gratitude-practice', name: 'Gratitude Practice', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.gratitude', met: 1.2 },
  { slug: 'journaling', name: 'Reflective Journaling', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.journal', met: 1.3 },
  { slug: 'visualization', name: 'Visualization / Mental Rehearsal', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.focus', met: 1.3, description: 'Rehearsing a performance in detail. Best evidence is in sport — as a supplement to practice, never a replacement.' },
  { slug: 'mantra-meditation', name: 'Mantra Meditation', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.meditation', met: 1.3 },
  { slug: 'zazen', name: 'Zazen (seated Zen)', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.meditation', met: 1.2 },
  { slug: 'vipassana-sit', name: 'Vipassana / Insight Sit', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.meditation', met: 1.2 },
  { slug: 'walking-meditation', name: 'Walking Meditation', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'cardio.walk', met: 2.5 },
  { slug: 'mindful-eating', name: 'Mindful Eating', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'nutrition.snack', met: 1.5, description: 'Eating one meal slowly and without screens — the practice most likely to change how much you eat.' },
  { slug: 'yoga-nidra', name: 'Yoga Nidra / NSDR', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.sleep', met: 1, description: 'Guided lying-down rest between waking and sleep. Useful after poor sleep — not a substitute for it.' },
  { slug: 'progressive-relaxation', name: 'Progressive Muscle Relaxation', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.spa', met: 1.3, description: 'Tense then release each muscle group in turn, head to toe.' },
  { slug: 'autogenic-training', name: 'Autogenic Training', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.spa', met: 1.2 },
  { slug: 'sleep-meditation', name: 'Sleep Meditation', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.night', met: 1 },
  { slug: 'box-breathing', name: 'Box Breathing (4-4-4-4)', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.lungs', met: 1.3 },
  { slug: 'breathing-478', name: '4-7-8 Breathing', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.lungs', met: 1.2, description: 'Long exhale relative to inhale — the pattern most used before sleep.' },
  { slug: 'coherent-breathing', name: 'Coherent Breathing (~5.5/min)', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.waves', met: 1.3, description: 'Equal in and out at about six breaths a minute.' },
  { slug: 'alternate-nostril', name: 'Alternate Nostril (Nadi Shodhana)', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.lungs', met: 1.3 },
  { slug: 'physiological-sigh', name: 'Physiological Sigh', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'reps_only', icon: 'mindbody.lungs', met: 1.2, description: 'Double inhale through the nose, long exhale through the mouth. Two or three is usually enough in the moment.' },
  { slug: 'wim-hof-breathing', name: 'Cyclic Hyperventilation (Wim Hof style)', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.lungs', met: 1.8, description: 'Rounds of deep breathing with breath holds. Never do this in or near water, or while driving — fainting is a real risk.', instructions: ['Sit or lie down. Never practise in water, in a bath, or standing.', 'If you feel faint, stop and breathe normally.', 'Not suitable during pregnancy, or with epilepsy or a heart condition without medical advice.'] },
  { slug: 'humming-bhramari', name: 'Humming Breath (Bhramari)', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.waves', met: 1.2 },

  // ── Faith practices, logged the same way as salat ──
  { slug: 'dhikr', name: 'Dhikr / Tasbih', category: 'prayer', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.dhikr', met: 1.3, description: 'Rhythmic remembrance, counted on the fingers or a tasbih.' },
  { slug: 'quran-recitation', name: 'Qur\'an Recitation', category: 'prayer', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.recite', met: 1.5 },
  { slug: 'dua-supplication', name: 'Du\'a / Supplication', category: 'prayer', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.candle', met: 1.3 },
  { slug: 'contemplative-prayer', name: 'Contemplative Prayer / Reflection', category: 'prayer', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.candle', met: 1.3 },

  // ══════════════════════════ TACTICAL & HERITAGE ══════════════════════════
  // Shared movements used by the Special Programmes (military, historical
  // warrior and practical routines). Generic on purpose so many programmes can
  // reuse them; the programme supplies the context.
  { slug: 'rope-climb', name: 'Rope Climb', category: 'tactical', sessionType: 'calisthenics', muscleGroups: ['back', 'forearms', 'core'], primaryMuscle: 'back', pattern: 'vertical_pull', trackingType: 'reps_only', icon: 'strength.pullup', met: 8, description: 'A staple of military and wrestling training. Legs-assisted first; no-legs when strong.', instructions: ['Grip high, hips under the rope.', 'Clamp the rope with the feet (J-hook or S-wrap) and stand up out of it.', 'Reach, re-clamp, repeat. Descend under control — do not slide (rope burn).'] },
  { slug: 'sandbag-carry', name: 'Sandbag Carry', category: 'tactical', sessionType: 'strength', muscleGroups: ['full body', 'core'], primaryMuscle: 'core', pattern: 'carry', trackingType: 'duration_distance', icon: 'strength.kettlebell', met: 7, description: 'An awkward, shifting load — the closest a gym gets to carrying a real one.' },
  { slug: 'sandbag-clean-press', name: 'Sandbag Clean & Press', category: 'tactical', sessionType: 'strength', muscleGroups: ['full body'], primaryMuscle: 'full body', pattern: 'squat', trackingType: 'reps_weight', icon: 'strength.kettlebell', met: 8, description: 'Floor to overhead with a dead, shifting weight. Total-body power endurance.' },
  { slug: 'overhead-carry', name: 'Overhead Carry', category: 'tactical', sessionType: 'strength', muscleGroups: ['shoulders', 'core'], primaryMuscle: 'shoulders', pattern: 'carry', trackingType: 'duration', icon: 'strength.dumbbell', met: 6, description: 'Load locked overhead, walk. Brutal on the shoulders and the trunk that stabilises them.' },
  { slug: 'atlas-stone-lift', name: 'Stone Lift / Shoulder', category: 'tactical', sessionType: 'strength', muscleGroups: ['back', 'legs', 'core'], primaryMuscle: 'back', pattern: 'hinge', trackingType: 'reps_only', icon: 'strength.kettlebell', met: 8, description: 'Lift a heavy stone (or sandbag) to a platform or shoulder — the oldest strength test there is.', instructions: ['Straddle the stone, hips back, wrap the arms fully under it.', 'Lap it onto the thighs first, then re-grip and extend the hips to stand.', 'Never round-and-yank — this is a lift to respect.'] },
  { slug: 'tire-flip', name: 'Tyre Flip', category: 'tactical', sessionType: 'strength', muscleGroups: ['full body'], primaryMuscle: 'legs', pattern: 'hinge', trackingType: 'reps_only', icon: 'strength.kettlebell', met: 9 },
  { slug: 'sledgehammer-swing', name: 'Sledgehammer Swings', category: 'tactical', sessionType: 'cardio', muscleGroups: ['core', 'shoulders', 'back'], primaryMuscle: 'core', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.rowing', met: 8, description: 'Overhead strikes onto a tyre — rotational power and grip conditioning.' },
  { slug: 'hand-release-pushup', name: 'Hand-Release Push-Up', category: 'tactical', sessionType: 'calisthenics', muscleGroups: ['chest', 'triceps', 'core'], primaryMuscle: 'chest', pattern: 'horizontal_push', trackingType: 'reps_only', icon: 'strength.push', met: 6, description: 'The Army ACFT push-up: chest to deck, lift the hands, reset. No bounce, no cheating range.' },
  { slug: 'eight-count-bodybuilder', name: 'Eight-Count Bodybuilder', category: 'tactical', sessionType: 'calisthenics', muscleGroups: ['full body'], primaryMuscle: 'full body', pattern: 'cardio', trackingType: 'reps_only', icon: 'strength.calisthenics', met: 8, description: 'The military PT classic: squat, plank, legs out, push-up down, push-up up, legs in, stand, jump. One rep, eight counts.' },
  { slug: 'sprint-drag-carry', name: 'Sprint–Drag–Carry', category: 'tactical', sessionType: 'cardio', muscleGroups: ['full body'], primaryMuscle: 'legs', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.agility', met: 9, description: 'The ACFT shuttle: sprint, drag a sled, lateral, carry kettlebells, sprint. Anaerobic and grip-limited.' },
  { slug: 'standing-power-throw', name: 'Standing Power Throw', category: 'tactical', sessionType: 'strength', muscleGroups: ['full body', 'core'], primaryMuscle: 'core', pattern: 'hinge', trackingType: 'reps_only', icon: 'strength.kettlebell', met: 6, description: 'Explosive backward-overhead throw of a medicine ball — whole-body power (ACFT event).' },
  { slug: 'low-crawl', name: 'Low / Leopard Crawl', category: 'tactical', sessionType: 'calisthenics', muscleGroups: ['full body', 'core'], primaryMuscle: 'core', pattern: 'cardio', trackingType: 'duration', icon: 'strength.calisthenics', met: 6, description: 'Stay flat, move fast. Deceptively exhausting; a staple of every ground-combat course.' },
  { slug: 'shield-carry-march', name: 'Loaded Shield March', category: 'tactical', sessionType: 'strength', muscleGroups: ['shoulders', 'legs', 'core'], primaryMuscle: 'shoulders', pattern: 'carry', trackingType: 'duration_distance', icon: 'strength.barbell', met: 6, description: 'March holding a weight at guard — the Roman legionary carried shield and pack for miles.' },
  { slug: 'neck-bridge', name: 'Wrestler’s Neck Bridge', category: 'tactical', sessionType: 'martial_arts', muscleGroups: ['neck', 'core'], primaryMuscle: 'neck', pattern: 'core', trackingType: 'duration', icon: 'martial.grapple', met: 5, description: 'Builds the neck that keeps you safe in grappling and contact sport.', instructions: ['Build up slowly over weeks — the neck is easily overloaded.', 'Front and back bridges; keep the load light and the time short at first.', 'Stop immediately at any sharp or radiating pain.'] },
  { slug: 'sprawl-drill', name: 'Sprawl Drill', category: 'tactical', sessionType: 'martial_arts', muscleGroups: ['full body', 'core'], primaryMuscle: 'core', pattern: 'cardio', trackingType: 'reps_only', icon: 'martial.grapple', met: 8, description: 'Drop the hips back and down to stuff a takedown — the wrestler’s reflex, drilled to exhaustion.' },
  { slug: 'wrestling-shots', name: 'Takedown Shots (drilling)', category: 'tactical', sessionType: 'martial_arts', muscleGroups: ['legs', 'full body'], primaryMuscle: 'legs', pattern: 'cardio', trackingType: 'reps_only', icon: 'martial.grapple', met: 8, description: 'Penetration-step doubles and singles on air or a bag — the shot repeated until it is instinct.' },
  { slug: 'horse-stance', name: 'Horse Stance (Mǎbù)', category: 'heritage', sessionType: 'calisthenics', muscleGroups: ['quads', 'glutes', 'core'], primaryMuscle: 'quads', pattern: 'core', trackingType: 'duration', icon: 'martial.forms', met: 4, description: 'The foundational Shaolin stance: deep, square, held. Legs, patience and breath in one posture.', instructions: ['Feet wide, toes forward, sink until the thighs work — not necessarily parallel at first.', 'Spine tall, weight in the heels, breathe slowly.', 'Build the hold in seconds, not minutes — quality of position over time.'] },
  { slug: 'bow-stance', name: 'Bow Stance (Gōngbù)', category: 'heritage', sessionType: 'calisthenics', muscleGroups: ['legs', 'glutes'], primaryMuscle: 'legs', pattern: 'core', trackingType: 'duration', icon: 'martial.forms', met: 3.5, description: 'Front-weighted lunge stance from kung fu basics — hip stability and rooted balance.' },
  { slug: 'stance-flow', name: 'Stance Transitions (Jīběngōng)', category: 'heritage', sessionType: 'calisthenics', muscleGroups: ['legs', 'core'], primaryMuscle: 'legs', pattern: 'mobility', trackingType: 'duration', icon: 'martial.forms', met: 5, description: 'Flowing between the basic stances — the Shaolin warm-up that is also leg conditioning.' },
  { slug: 'iron-body-conditioning', name: 'Iron-Body Conditioning', category: 'heritage', sessionType: 'martial_arts', muscleGroups: ['full body'], primaryMuscle: 'full body', pattern: 'core', trackingType: 'duration', icon: 'martial.strike', met: 4, description: 'Gradual impact conditioning of the forearms and shins, kung fu / Muay Thai style.', instructions: ['Progress over months, never in one session — this is tissue adaptation, not toughness.', 'Light taps first; increase only when there is no lingering pain or swelling.', 'Never condition a joint, the head, or over bone with no muscle. When in doubt, stop.'] },
  { slug: 'sword-swing-drill', name: 'Sword Cuts (Suburi)', category: 'heritage', sessionType: 'martial_arts', muscleGroups: ['shoulders', 'core', 'forearms'], primaryMuscle: 'shoulders', pattern: 'cardio', trackingType: 'duration', icon: 'martial.strike', met: 5, description: 'Repeated overhead cuts with a bokken or weighted stick — the samurai’s endless suburi.' },
  { slug: 'spear-thrust-drill', name: 'Spear / Pole Drill', category: 'heritage', sessionType: 'martial_arts', muscleGroups: ['shoulders', 'core', 'legs'], primaryMuscle: 'core', pattern: 'cardio', trackingType: 'duration', icon: 'martial.strike', met: 5.5, description: 'Thrusts and recovery with a spear, pilum or staff — reach, footwork and grip.' },
  { slug: 'club-swing-drill', name: 'War-Club / Mace Swings', category: 'heritage', sessionType: 'martial_arts', muscleGroups: ['shoulders', 'back', 'core'], primaryMuscle: 'shoulders', pattern: 'cardio', trackingType: 'duration', icon: 'martial.strike', met: 6, description: 'Weighted swings and figure-eights — shoulder durability the way maces and macuahuitls built it.' },
  { slug: 'incline-pushup', name: 'Incline Push-Up', category: 'tactical', sessionType: 'calisthenics', muscleGroups: ['chest', 'triceps'], primaryMuscle: 'chest', subMuscle: 'lower_chest', pattern: 'horizontal_push', trackingType: 'reps_only', icon: 'strength.push', met: 4, description: 'Hands on a desk, chair or wall — the scalable push-up for the office or a fresh start.' },
  { slug: 'chair-dip', name: 'Chair / Bench Dip', category: 'tactical', sessionType: 'calisthenics', muscleGroups: ['triceps', 'chest'], primaryMuscle: 'triceps', pattern: 'horizontal_push', trackingType: 'reps_only', icon: 'strength.calisthenics', met: 4, description: 'Triceps from a chair edge — no equipment, works anywhere.' },
  { slug: 'desk-mobility-flow', name: 'Deskside Mobility Flow', category: 'tactical', sessionType: 'mindbody', muscleGroups: ['full body'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.stretch', met: 2.3, description: 'A standing reset for hips, spine and shoulders you can run beside a desk in a few minutes.' },
  { slug: 'step-ups', name: 'Step-Ups', category: 'tactical', sessionType: 'calisthenics', muscleGroups: ['quads', 'glutes'], primaryMuscle: 'quads', pattern: 'squat', trackingType: 'reps_only', icon: 'cardio.treadmill', met: 6, description: 'Onto a chair, box or bench — single-leg strength anywhere, loaded or not.' },
  { slug: 'one-arm-pushup', name: 'One-Arm Push-Up', category: 'tactical', sessionType: 'calisthenics', muscleGroups: ['chest', 'triceps', 'core'], primaryMuscle: 'chest', pattern: 'horizontal_push', trackingType: 'reps_only', icon: 'strength.push', met: 8, description: 'The Rocky classic — feet wide, one hand behind the back, brutal on the chest and obliques.', instructions: ['Earn it: press a heavy regular push-up cleanly first, then a slow archer push-up.', 'Feet wide for balance, spare arm behind the back, brace hard against rotating.', 'Lower under control; never let the shoulder collapse.'] },
  { slug: 'speed-bag', name: 'Speed Bag', category: 'tactical', sessionType: 'martial_arts', muscleGroups: ['shoulders', 'forearms'], primaryMuscle: 'shoulders', pattern: 'cardio', trackingType: 'duration', icon: 'martial.gloves', met: 6, description: 'Rhythm, shoulder endurance and hand speed — the boxer’s meditation.' },

  // ══════════════════════════ GRIP & FOREARM ══════════════════════════
  { slug: 'hand-gripper', name: 'Hand Gripper Squeeze', category: 'forearms', sessionType: 'strength', muscleGroups: ['forearms'], primaryMuscle: 'forearms', subMuscle: 'grip', equipmentType: 'other', equipment: 'gripper', pattern: 'curl', trackingType: 'reps_weight', icon: 'strength.dumbbell', met: 3, description: 'Crush grip on a torsion gripper — the classic Captains-of-Crush training.' },
  { slug: 'plate-pinch', name: 'Plate Pinch Hold', category: 'forearms', sessionType: 'strength', muscleGroups: ['forearms'], primaryMuscle: 'forearms', subMuscle: 'grip', equipmentType: 'other', equipment: 'plates', pattern: 'carry', trackingType: 'duration', icon: 'strength.plate', met: 3, description: 'Pinch smooth plates together and hold — brutal on the thumb and pinch grip.' },
  { slug: 'wrist-roller', name: 'Wrist Roller', category: 'forearms', sessionType: 'strength', muscleGroups: ['forearms'], primaryMuscle: 'forearms', subMuscle: 'wrist_flexors', equipmentType: 'other', equipment: 'roller', pattern: 'curl', trackingType: 'reps_only', icon: 'strength.dumbbell', met: 3.5, description: 'Roll a weight up on a cord — forearm flexors and extensors to full fatigue.' },
  { slug: 'reverse-wrist-curl', name: 'Reverse Wrist Curl', category: 'forearms', sessionType: 'strength', muscleGroups: ['forearms'], primaryMuscle: 'forearms', subMuscle: 'wrist_extensors', equipmentType: 'dumbbell', pattern: 'curl', trackingType: 'reps_weight', icon: 'strength.dumbbell', met: 3, description: 'Palms-down wrist curl for the extensors — the antidote to elbow tendinopathy.' },
  { slug: 'reverse-curl', name: 'Reverse Barbell Curl', category: 'forearms', sessionType: 'strength', muscleGroups: ['forearms', 'biceps'], primaryMuscle: 'forearms', subMuscle: 'brachioradialis', equipmentType: 'barbell', pattern: 'curl', trackingType: 'reps_weight', icon: 'strength.barbell', met: 3, description: 'Overhand curl that hammers the brachioradialis and forearm.' },
  { slug: 'farmers-hold', name: 'Farmer\'s Hold', category: 'forearms', sessionType: 'strength', muscleGroups: ['forearms', 'traps'], primaryMuscle: 'forearms', subMuscle: 'grip', equipmentType: 'dumbbell', pattern: 'carry', trackingType: 'duration', icon: 'strength.kettlebell', met: 4, description: 'Stand holding the heaviest dumbbells you can — grip and trap endurance.' },
  { slug: 'towel-hang', name: 'Towel Dead Hang', category: 'forearms', sessionType: 'calisthenics', muscleGroups: ['forearms', 'back'], primaryMuscle: 'forearms', subMuscle: 'grip', equipmentType: 'bodyweight', pattern: 'vertical_pull', trackingType: 'duration', icon: 'strength.pullup', met: 4, description: 'Hang from towels over a bar — a savage grip and finger challenge.' },
  { slug: 'fat-grip-hold', name: 'Fat-Bar / Axle Hold', category: 'forearms', sessionType: 'strength', muscleGroups: ['forearms'], primaryMuscle: 'forearms', subMuscle: 'grip', equipmentType: 'barbell', pattern: 'carry', trackingType: 'duration', icon: 'strength.barbell', met: 3.5, description: 'Thick-bar holds — the fatter the bar, the harder the grip works.' },
  { slug: 'finger-extension-band', name: 'Finger Extensions (band)', category: 'forearms', sessionType: 'strength', muscleGroups: ['forearms'], primaryMuscle: 'forearms', subMuscle: 'wrist_extensors', equipmentType: 'other', equipment: 'band', pattern: 'curl', trackingType: 'reps_only', icon: 'strength.band', met: 2.5, description: 'Open the fingers against a rubber band — balances all that gripping and protects the elbows.' },
  { slug: 'wrist-supination', name: 'Wrist Supination / Pronation', category: 'forearms', sessionType: 'strength', muscleGroups: ['forearms'], primaryMuscle: 'forearms', subMuscle: 'brachioradialis', equipmentType: 'dumbbell', pattern: 'rotation', trackingType: 'reps_weight', icon: 'strength.dumbbell', met: 2.5, description: 'Rotate a weighted handle — the rotational forearm strength for racket and combat sports.' },

  // ══════════════════════════ CALISTHENICS STRENGTH (advanced) ══════════════════════════
  { slug: 'archer-push-up', name: 'Archer Push-Up', category: 'calisthenics', sessionType: 'calisthenics', muscleGroups: ['chest', 'triceps'], primaryMuscle: 'chest', subMuscle: 'mid_chest', equipmentType: 'bodyweight', pattern: 'horizontal_push', trackingType: 'reps_only', icon: 'strength.pushup', met: 7, description: 'Shift weight onto one arm, the other straight out — the bridge toward the one-arm push-up.' },
  { slug: 'pseudo-planche-pushup', name: 'Pseudo-Planche Push-Up', category: 'calisthenics', sessionType: 'calisthenics', muscleGroups: ['chest', 'shoulders'], primaryMuscle: 'chest', subMuscle: 'lower_chest', equipmentType: 'bodyweight', pattern: 'horizontal_push', trackingType: 'reps_only', icon: 'strength.pushup', met: 7, description: 'Hands by the hips, leaning forward — builds the planche lean and front-delt strength.' },
  { slug: 'tuck-planche-hold', name: 'Tuck Planche Hold', category: 'calisthenics', sessionType: 'calisthenics', muscleGroups: ['shoulders', 'core'], primaryMuscle: 'shoulders', subMuscle: 'front_delt', equipmentType: 'bodyweight', pattern: 'core', trackingType: 'duration', icon: 'strength.calisthenics', met: 6, description: 'The first real planche progression — knees tucked, feet off the floor, leaning forward.' },
  { slug: 'ring-row', name: 'Ring / Inverted Row (rings)', category: 'calisthenics', sessionType: 'calisthenics', muscleGroups: ['back', 'biceps'], primaryMuscle: 'back', subMuscle: 'mid_back', equipmentType: 'bodyweight', pattern: 'horizontal_pull', trackingType: 'reps_only', icon: 'strength.pullup', met: 5, description: 'Rows from rings or a bar — the horizontal pull that balances all your pressing.' },
  { slug: 'ring-dip', name: 'Ring Dip', category: 'calisthenics', sessionType: 'calisthenics', muscleGroups: ['chest', 'triceps'], primaryMuscle: 'chest', subMuscle: 'lower_chest', equipmentType: 'bodyweight', pattern: 'horizontal_push', trackingType: 'reps_only', icon: 'strength.calisthenics', met: 7, description: 'Dips on unstable rings — far harder than bars, huge for chest and triceps.' },
  { slug: 'wall-handstand-pushup', name: 'Wall Handstand Push-Up', category: 'calisthenics', sessionType: 'calisthenics', muscleGroups: ['shoulders', 'triceps'], primaryMuscle: 'shoulders', subMuscle: 'front_delt', equipmentType: 'bodyweight', pattern: 'vertical_push', trackingType: 'reps_only', icon: 'strength.calisthenics', met: 7, description: 'Vertical pressing with your own bodyweight — the bodyweight overhead press.' },
  { slug: 'diamond-push-up', name: 'Diamond Push-Up', category: 'calisthenics', sessionType: 'calisthenics', muscleGroups: ['triceps', 'chest'], primaryMuscle: 'triceps', subMuscle: 'triceps_long', equipmentType: 'bodyweight', pattern: 'horizontal_push', trackingType: 'reps_only', icon: 'strength.pushup', met: 6, description: 'Hands together under the chest — shifts the push-up onto the triceps.' },
  { slug: 'decline-push-up', name: 'Decline Push-Up', category: 'calisthenics', sessionType: 'calisthenics', muscleGroups: ['chest', 'shoulders'], primaryMuscle: 'chest', subMuscle: 'upper_chest', equipmentType: 'bodyweight', pattern: 'horizontal_push', trackingType: 'reps_only', icon: 'strength.pushup', met: 6, description: 'Feet elevated — biases the upper chest and front delts.' },
  { slug: 'archer-pull-up', name: 'Archer Pull-Up', category: 'calisthenics', sessionType: 'calisthenics', muscleGroups: ['back', 'biceps'], primaryMuscle: 'back', subMuscle: 'lats', equipmentType: 'bodyweight', pattern: 'vertical_pull', trackingType: 'reps_only', icon: 'strength.pullup', met: 7, description: 'Pull to one hand with the other arm straight — the road to the one-arm pull-up.' },
  { slug: 'commando-pull-up', name: 'Commando Pull-Up', category: 'calisthenics', sessionType: 'calisthenics', muscleGroups: ['back', 'biceps'], primaryMuscle: 'back', subMuscle: 'lats', equipmentType: 'bodyweight', pattern: 'vertical_pull', trackingType: 'reps_only', icon: 'strength.pullup', met: 6, description: 'Pull up alongside the bar, head each side — lats, biceps and grip.' },
  { slug: 'tuck-front-lever', name: 'Tuck Front Lever Hold', category: 'calisthenics', sessionType: 'calisthenics', muscleGroups: ['back', 'core'], primaryMuscle: 'back', subMuscle: 'lats', equipmentType: 'bodyweight', pattern: 'core', trackingType: 'duration', icon: 'strength.pullup', met: 6, description: 'The first front-lever step — hang horizontal with knees tucked.' },
  { slug: 'sissy-squat', name: 'Sissy Squat', category: 'calisthenics', sessionType: 'calisthenics', muscleGroups: ['quads'], primaryMuscle: 'quads', subMuscle: 'rectus_femoris', equipmentType: 'bodyweight', pattern: 'squat', trackingType: 'reps_only', icon: 'strength.calisthenics', met: 5, description: 'Knees forward, torso back — isolates the quads and knee tendons (build up gently).' },
  { slug: 'shrimp-squat', name: 'Shrimp Squat', category: 'calisthenics', sessionType: 'calisthenics', muscleGroups: ['quads', 'glutes'], primaryMuscle: 'quads', subMuscle: 'vastus', equipmentType: 'bodyweight', pattern: 'squat', trackingType: 'reps_only', icon: 'strength.calisthenics', met: 6, description: 'A single-leg squat holding the rear foot — a pistol alternative that\'s kinder on the knee.' },
  { slug: 'hollow-rock', name: 'Hollow Body Rock', category: 'calisthenics', sessionType: 'calisthenics', muscleGroups: ['core'], primaryMuscle: 'core', subMuscle: 'lower_abs', equipmentType: 'bodyweight', pattern: 'core', trackingType: 'reps_only', icon: 'strength.calisthenics', met: 5, description: 'Rock in the hollow position — the gymnastic foundation for every advanced core skill.' },
  { slug: 'nordic-negative', name: 'Nordic Curl Negative', category: 'calisthenics', sessionType: 'calisthenics', muscleGroups: ['hamstrings'], primaryMuscle: 'hamstrings', subMuscle: 'hamstrings', equipmentType: 'bodyweight', pattern: 'hinge', trackingType: 'reps_only', icon: 'strength.calisthenics', met: 6, description: 'Lower under control from the knees — the most protective hamstring exercise there is.' },

  // ══════════════════════════ WELLNESS PROTOCOLS ══════════════════════════
  // Purpose-built mini-routines for quitting smoking, hormones and energy.
  { slug: 'craving-buster-walk', name: 'Craving-Buster Walk', category: 'wellness', sessionType: 'cardio', muscleGroups: ['cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.walk', met: 4, description: 'A brisk 5–10 minute walk the moment a nicotine urge hits — cravings peak and pass in minutes, and moving rides them out.', instructions: ['Start walking the second the urge arrives; don\'t wait it out sitting still.', 'Breathe slowly through the nose; notice the craving rise, peak and fade.', 'Most urges break within 3–5 minutes of movement.'] },
  { slug: 'urge-surf-breathing', name: 'Urge-Surfing Breath', category: 'wellness', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.lungs', met: 1.3, description: 'Ride out a craving by watching it like a wave — slow breathing while you let the urge crest and subside without acting on it.', instructions: ['Name it: "this is a craving, it will pass".', 'Breathe out longer than you breathe in for 2–3 minutes.', 'Don\'t fight the urge — observe it rise and fall. It always falls.'] },
  { slug: 'cold-exposure', name: 'Cold Shower / Plunge Finish', category: 'wellness', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.spa', met: 2, description: 'A short cold finish to a shower for alertness and a mood/energy lift. Effects on hormones are modest and short-lived — the reliable payoff is alertness and resilience.', instructions: ['Finish a normal shower with 30–90 seconds of cold.', 'Breathe slowly and steadily — do not hyperventilate.', 'Skip if you have a heart condition or are pregnant without medical advice; never in open water alone.'] },
  { slug: 'heavy-compound-circuit', name: 'Heavy Compound Circuit', category: 'wellness', sessionType: 'strength', muscleGroups: ['full body'], primaryMuscle: 'full body', pattern: 'squat', trackingType: 'reps_weight', icon: 'strength.barbell', met: 6, description: 'Big multi-joint lifts (squat, deadlift, press, row) at challenging loads — the training most associated with a healthy hormonal profile. Consistency and sleep matter far more than any single session.', instructions: ['Pick 3–4 compound lifts; work in the 5–10 rep range near effort.', 'Prioritise squats, deadlifts, presses and rows.', 'Recovery, sleep and enough food do most of the hormonal work — not heroics.'] },
  { slug: 'sprint-power-bursts', name: 'Sprint Power Bursts', category: 'wellness', sessionType: 'cardio', muscleGroups: ['legs', 'cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.running', met: 12, description: 'Short all-out sprints with full recovery — brief, intense efforts that support metabolic and hormonal health. Warm up well; quality over quantity.', instructions: ['Warm up thoroughly first.', '6–10 × 10–20 s near-max, with full recovery between.', 'Stop when times slow — this is a power session, not a grind.'] },
  { slug: 'morning-sunlight-walk', name: 'Morning Sunlight Walk', category: 'wellness', sessionType: 'outdoor', muscleGroups: ['cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.walk', met: 3.5, description: 'Ten to twenty minutes of outdoor light soon after waking — anchors your body clock, which supports energy, mood, sleep and healthy hormone rhythms.', instructions: ['Get outside within an hour or two of waking.', 'No sunglasses; never look directly at the sun.', 'Even an overcast morning is far brighter than indoor light.'] },
  { slug: 'energy-reset-breath', name: 'Energy-Reset Breathing', category: 'wellness', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.lungs', met: 1.3, description: 'A short paced-breathing reset for a mid-slump energy lift — a gentle few minutes of slightly quicker breathing followed by calm, steady breaths.', instructions: ['Sit tall. 20–30 slightly deeper, quicker breaths, then return to slow, easy breathing.', 'Stop immediately if you feel lightheaded; never do this standing or near water.', 'Not a substitute for sleep — if you\'re exhausted, rest.'] },
  { slug: 'power-pose-reset', name: 'Power-Pose Reset', category: 'wellness', sessionType: 'mindbody', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.meditation', met: 1.5, description: 'Two minutes standing tall and open before something stressful — the evidence is mostly about feeling more confident, which is reason enough to use it.', instructions: ['Stand tall, shoulders back, chest open, for ~2 minutes.', 'Breathe slowly and evenly.', 'Use it before a task you\'re dreading — the point is the felt shift in confidence.'] },

  // ══════════════════════════ QUICK COUNTERS (urge & focus) ══════════════════════════
  // Short, on-demand protocols to ride out a craving or impulse, or to shift
  // focus. Behavioural tools, presented neutrally — the urge passes either way.
  { slug: 'burst-redirect', name: 'Burst Redirect (20 reps)', category: 'counter', sessionType: 'calisthenics', muscleGroups: ['full body'], primaryMuscle: 'full body', pattern: 'cardio', trackingType: 'reps_only', icon: 'strength.calisthenics', met: 8, description: 'When an urge hits, redirect it into a short hard burst — 20 push-ups, squats or burpees. The spike of effort breaks the loop and buys you past the peak.', instructions: ['The moment the urge arrives, drop and do 20 of something hard.', 'Go all-out; the intensity is the point.', 'By the time you catch your breath, the urge has usually passed.'] },
  { slug: 'ten-minute-delay', name: 'The 10-Minute Rule', category: 'counter', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'core.timer', met: 1.2, description: 'Don\'t say no — say "not yet". Set a 10-minute timer and do something else. Urges are waves; almost none survive the full ten minutes.', instructions: ['Tell yourself you can act on it in 10 minutes — just not now.', 'Set a timer and start any other task.', 'When it rings, most of the pull is gone. Re-set it if you need to.'] },
  { slug: 'grounding-54321', name: '5-4-3-2-1 Grounding', category: 'counter', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.focus', met: 1.2, description: 'Pull attention out of the craving and into the room: name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste.', instructions: ['Work slowly through each sense.', 'Say them under your breath or in your head.', 'It interrupts the mental loop and lands you back in the present.'] },
  { slug: 'cold-water-splash', name: 'Cold Water Splash', category: 'counter', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.spa', met: 1.5, description: 'Cold water on the face and wrists triggers a quick calming reflex and a jolt of alertness — a fast physical pattern-break for an urge or a spiral.', instructions: ['Splash cold water on your face, or hold your wrists under the tap.', 'Breathe slowly for a few seconds afterward.', 'Simple, fast, and works almost anywhere.'] },
  { slug: 'environment-change', name: 'Change Your Environment', category: 'counter', sessionType: 'cardio', muscleGroups: ['cardiovascular'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'cardio.walk', met: 3, description: 'Most urges are tied to a place and a cue. Stand up and leave — different room, or outside. Breaking the setting often breaks the urge.', instructions: ['Physically get up and move to a different space.', 'Outside is best; a different room works too.', 'Take a few minutes there before deciding anything.'] },
  { slug: 'halt-check', name: 'HALT Check-In', category: 'counter', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.journal', met: 1.2, description: 'Urges spike when a real need is unmet. Ask: am I Hungry, Angry, Lonely or Tired? Meet the actual need and the urge often deflates on its own.', instructions: ['Run through Hungry / Angry / Lonely / Tired.', 'Whichever fits, address it — eat, cool down, reach out, rest.', 'The craving is often a messenger for one of these.'] },
  { slug: 'hands-busy-task', name: 'Keep the Hands Busy', category: 'counter', sessionType: 'mindbody', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.joint', met: 1.5, description: 'An occupied body is a redirected impulse — grip a stress ball, tidy a drawer, wash the dishes, hold a cold drink. Gives a restless urge somewhere to go.', instructions: ['Pick any small physical task and do it now.', 'Keep the hands and eyes engaged for a few minutes.', 'Bridges the gap until the urge subsides.'] },

  // ── Shoulders, filled out (v2.26) ───────────────────────────────────────────
  // The rear delt and the rotator cuff were the gaps: plenty of pressing and
  // side raises, almost nothing pulling the shoulder back or rotating it. That
  // imbalance is the common one — the front delt gets hit by every press and
  // every bench, and the back of the shoulder never catches up.
  S('face-pull', 'Face Pull', 'shoulders', 'cable', 'horizontal_pull', ['shoulders', 'back'], CB, {
    subMuscle: 'rear_delt', met: 3.5,
    description: 'Rope to the face, elbows high, finishing with the hands back and out. Trains the rear delt and the external rotators together — the single best counterweight to a pressing-heavy programme.',
    instructions: [
      'Set a rope at about face height and take an overhand grip, thumbs back.',
      'Pull the rope toward your forehead, leading with the elbows and keeping them high.',
      'Finish by rotating the hands back and apart, like a double biceps pose.',
      'Light weight, slow return. This is not a rowing movement — if you are leaning back, it is too heavy.',
    ],
  }),
  S('cable-external-rotation', 'Cable External Rotation', 'shoulders', 'cable', 'horizontal_pull', ['shoulders'], CB, {
    subMuscle: 'rear_delt', met: 3,
    description: 'The rotator-cuff movement itself. Unglamorous, very light, and the cheapest shoulder insurance there is if you press often.',
    instructions: [
      'Elbow tucked to your side at 90°, forearm across your body.',
      'Rotate the forearm outward, keeping the elbow pinned to your ribs.',
      'Slow both ways. Loads here are tiny — this is a cuff, not a delt.',
    ],
  }),
  S('cable-upright-row', 'Cable Upright Row', 'shoulders', 'cable', 'lateral_raise', ['shoulders', 'back'], CB, {
    subMuscle: 'side_delt', met: 3.5,
    description: 'Upright row with constant tension. Keep it to chest height and wide — pulling high and narrow is where shoulders get pinched.',
    instructions: ['Wide grip on a straight bar or rope.', 'Lead with the elbows, stop around chest height.', 'If it pinches, widen the grip or drop the height.'],
  }),
  S('cable-y-raise', 'Cable Y-Raise', 'shoulders', 'cable', 'lateral_raise', ['shoulders', 'back'], CB, {
    subMuscle: 'rear_delt', met: 3.5,
    description: 'Raise into a Y overhead against the cable — lower traps and rear delt, and a genuinely useful overhead-health movement.',
  }),
  S('cable-shoulder-press', 'Cable Shoulder Press', 'shoulders', 'cable', 'vertical_push', ['shoulders', 'triceps'], CB, {
    subMuscle: 'front_delt', met: 4,
    description: 'Overhead press with tension that never drops off at the top.',
  }),
  S('plate-loaded-shoulder-press', 'Plate-Loaded Shoulder Press', 'shoulders', 'machine', 'vertical_push', ['shoulders', 'triceps'], MC, {
    subMuscle: 'front_delt', met: 4.5,
    description: 'Hammer-Strength-style press. Each arm moves on its own path, so a strong side cannot carry a weak one.',
  }),
  S('smith-shoulder-press', 'Smith Machine Shoulder Press', 'shoulders', 'machine', 'vertical_push', ['shoulders', 'triceps'], MC, {
    subMuscle: 'front_delt', met: 4.5,
    description: 'Fixed bar path overhead — lets you push closer to failure safely without a spotter.',
  }),
  S('machine-rear-delt-row', 'Machine Rear-Delt Row', 'shoulders', 'machine', 'horizontal_pull', ['shoulders', 'back'], MC, {
    subMuscle: 'rear_delt', met: 3.5,
    description: 'Chest-supported machine row pulled wide and high, so the rear delt does the work instead of the lats.',
  }),
  S('machine-front-raise', 'Machine Front Raise', 'shoulders', 'machine', 'lateral_raise', ['shoulders'], MC, {
    subMuscle: 'front_delt', met: 3,
    description: 'Guided front raise. Most people already get plenty of front delt from pressing — use it sparingly.',
  }),
  S('landmine-press', 'Landmine Press', 'shoulders', 'barbell', 'vertical_push', ['shoulders', 'triceps', 'core'], BB, {
    subMuscle: 'front_delt', met: 5,
    description: 'Pressing on an arc rather than straight up. Far kinder to shoulders that dislike a strict overhead press, and the standing version makes the core work too.',
    instructions: ['One end of a barbell in a landmine or a corner.', 'Press from the front of the shoulder up and slightly forward.', 'Keep the ribs down — no leaning back to finish the rep.'],
  }),
  S('z-press', 'Z-Press', 'shoulders', 'barbell', 'vertical_push', ['shoulders', 'core'], BB, {
    subMuscle: 'front_delt', met: 5,
    description: 'Seated on the floor, legs straight, pressing overhead. Removes every ounce of leg drive and exposes exactly how much of your press was hips.',
  }),
  S('bradford-press', 'Bradford Press', 'shoulders', 'barbell', 'vertical_push', ['shoulders'], BB, {
    subMuscle: 'side_delt', met: 4.5,
    description: 'Half-presses alternating front and back of the head, never locking out. Constant tension, and light by necessity.',
  }),
  S('db-scaption-raise', 'Dumbbell Scaption Raise', 'shoulders', 'dumbbell', 'lateral_raise', ['shoulders'], DB_, {
    subMuscle: 'side_delt', met: 3.5,
    description: 'Raise at about 30–45° in front of you rather than straight out to the side — the plane the shoulder blade actually sits in, and more comfortable for most people than a strict lateral.',
  }),
  S('db-lu-raise', 'Lu Raise', 'shoulders', 'dumbbell', 'lateral_raise', ['shoulders'], DB_, {
    subMuscle: 'side_delt', met: 3.5,
    description: 'A lateral raise carried all the way overhead until the dumbbells touch. Very light, very strict — named after the weightlifter who popularised it.',
  }),
  S('db-powell-raise', 'Powell Raise', 'shoulders', 'dumbbell', 'horizontal_pull', ['shoulders'], DB_, {
    subMuscle: 'rear_delt', met: 3.5,
    description: 'Lying on your side, raising the top arm out and back. Isolates the rear delt about as cleanly as a dumbbell can.',
  }),
  S('db-external-rotation', 'Dumbbell External Rotation', 'shoulders', 'dumbbell', 'horizontal_pull', ['shoulders'], DB_, {
    subMuscle: 'rear_delt', met: 3,
    description: 'Side-lying cuff rotation. Tiny weights, high reps, done for shoulder health rather than size.',
  }),
  S('db-cuban-press', 'Cuban Press', 'shoulders', 'dumbbell', 'vertical_push', ['shoulders'], DB_, {
    subMuscle: 'rear_delt', met: 4,
    description: 'Upright row into an external rotation into an overhead press, as one movement. A whole shoulder warm-up in a single exercise.',
  }),
  S('db-6-way-raise', 'Six-Way Raise', 'shoulders', 'dumbbell', 'lateral_raise', ['shoulders'], DB_, {
    subMuscle: 'side_delt', met: 4,
    description: 'Front raise, out to a T, overhead, and back down the same path. Hits all three heads in one brutal, very light set.',
  }),
  S('kb-bottoms-up-press', 'Bottoms-Up Kettlebell Press', 'shoulders', 'other', 'vertical_push', ['shoulders', 'forearms', 'core'], DB_, {
    subMuscle: 'front_delt', met: 4.5,
    description: 'Pressing a kettlebell upside down. The grip and the shoulder have to stabilise constantly, which is the entire point — you will use a fraction of your normal weight.',
  }),
  S('kb-halo', 'Kettlebell Halo', 'shoulders', 'other', 'mobility', ['shoulders', 'core'], DB_, {
    subMuscle: 'rear_delt', met: 3,
    description: 'Circling a kettlebell around the head. A mobility warm-up that also happens to build stability through the whole shoulder girdle.',
  }),
  S('plate-front-raise', 'Plate Front Raise', 'shoulders', 'other', 'lateral_raise', ['shoulders', 'core'], DB_, {
    subMuscle: 'front_delt', met: 3.5,
    description: 'Front raise holding a plate like a steering wheel — easy to grip, easy to control, and simple to add small jumps to.',
  }),
  S('wall-slides', 'Wall Slides', 'shoulders', 'bodyweight', 'mobility', ['shoulders', 'back'], BW, {
    subMuscle: 'rear_delt', trackingType: 'reps_only', met: 2.5,
    description: 'Forearms on the wall, sliding overhead while keeping contact. Free, needs nothing, and one of the better ways to restore overhead range if you sit at a desk.',
  }),
  S('band-face-pull', 'Band Face Pull', 'shoulders', 'other', 'horizontal_pull', ['shoulders', 'back'], BW, {
    subMuscle: 'rear_delt', trackingType: 'reps_only', met: 3,
    description: 'The face pull with a band instead of a cable — anchor it at head height. Travels in a bag, so there is no excuse on the road.',
  }),

  // ── Triceps machines & cable variety (v2.28) ────────────────────────────────
  // The library had sixteen triceps movements and exactly one machine. Machines
  // matter here more than for most muscles: the triceps is where people train
  // closest to failure, and a fixed path lets you do that without a spotter and
  // without the elbow pain that free-weight extensions can bring on.
  S('triceps-extension-machine', 'Triceps Extension Machine', 'triceps', 'machine', 'triceps_extension', ['triceps'], MC, {
    subMuscle: 'triceps_long', met: 3.5,
    description: 'Seated machine extension. The pad fixes your upper arm, so the elbow does the work and nothing else can cheat the rep — the easiest way to take triceps to genuine failure safely.',
  }),
  S('assisted-dip-machine', 'Assisted Dip Machine', 'triceps', 'machine', 'vertical_push', ['triceps', 'chest', 'shoulders'], MC, {
    subMuscle: 'triceps_long', met: 4,
    description: 'Dips with a counterweight, so you pick the difficulty. The bridge between bench dips and a full bodyweight dip — and note the weight here is ASSISTANCE, so a lower number means a harder set.',
  }),
  S('smith-close-grip-bench', 'Smith Close-Grip Bench Press', 'triceps', 'machine', 'horizontal_push', ['triceps', 'chest'], MC, {
    subMuscle: 'triceps_lateral', met: 4.5,
    description: 'Close-grip pressing on a fixed bar path. Lets you push heavy triceps work close to failure with no spotter.',
  }),
  S('rope-pushdown', 'Rope Pushdown', 'triceps', 'cable', 'triceps_extension', ['triceps'], CB, {
    subMuscle: 'triceps_lateral', met: 3.5,
    description: 'Pushdown with a rope, spreading the ends apart at the bottom. The extra rotation at lockout is what people prefer over the straight bar.',
  }),
  S('v-bar-pushdown', 'V-Bar Pushdown', 'triceps', 'cable', 'triceps_extension', ['triceps'], CB, {
    subMuscle: 'triceps_lateral', met: 3.5,
    description: 'Angled bar pushdown — kinder on the wrists than a straight bar, and you can load it heavier than a rope.',
  }),
  S('reverse-grip-pushdown', 'Reverse-Grip Pushdown', 'triceps', 'cable', 'triceps_extension', ['triceps'], CB, {
    subMuscle: 'triceps_lateral', met: 3.5,
    description: 'Underhand single- or double-hand pushdown. Often reported to bias the inner triceps; keep the load light because the grip gives out first.',
  }),
  S('cable-kickback', 'Cable Triceps Kickback', 'triceps', 'cable', 'triceps_extension', ['triceps'], CB, {
    subMuscle: 'triceps_lateral', met: 3,
    description: 'The dumbbell kickback with constant tension — the cable keeps loading the lockout, which is exactly where the dumbbell version goes weightless.',
  }),
  S('ez-bar-overhead-extension', 'EZ-Bar Overhead Extension', 'triceps', 'barbell', 'triceps_extension', ['triceps'], BB, {
    subMuscle: 'triceps_long', met: 4,
    description: 'Overhead extension with an EZ bar. Overhead is where the long head is stretched, which is the position it responds to best.',
  }),
  S('db-single-arm-overhead-extension', 'Single-Arm Overhead Extension', 'triceps', 'dumbbell', 'triceps_extension', ['triceps'], DB_, {
    subMuscle: 'triceps_long', met: 3.5,
    description: 'One arm at a time overhead, so a stronger side cannot carry the weaker one. Support the working elbow with your free hand.',
  }),
  S('bodyweight-skullcrusher', 'Bodyweight Skullcrusher', 'triceps', 'bodyweight', 'triceps_extension', ['triceps'], BW, {
    subMuscle: 'triceps_long', trackingType: 'reps_only', met: 4,
    description: 'Extensions against a bar or rings set at hip height — lower your head behind the bar and press back out. Change the difficulty by walking your feet in or out.',
  }),

  // ── v2.64: filling the thin corners of the library ──
  // Hamstrings, glutes, calves, arms, core, bodyweight progressions,
  // machine and cable work, and mobility — the areas a whole app needs
  // and this one was short of. Every entry carries an authored
  // difficulty, so the ladders (wall push-up through planche) read as
  // ladders rather than as one flat wall of movements.
  S('advanced-tuck-front-lever', 'Advanced Tuck Front Lever', 'back', 'bodyweight', 'core', ['back', 'core', 'biceps'], 'strength.calisthenics', {
    trackingType: 'duration', met: 5.5, difficulty: 4, description: 'A front lever hold with the knees tucked but the back flat and the hips opened, the step between the tuck and straddle versions.',
  }),
  S('band-assisted-pull-up', 'Band-Assisted Pull-Up', 'back', 'other', 'vertical_pull', ['back', 'biceps'], 'strength.band', {
    trackingType: 'reps_only', met: 5, difficulty: 2, description: 'A pull-up with a resistance band under the foot or knee taking part of your bodyweight, letting you train full reps before you own them.',
  }),
  S('chest-to-bar-pull-up', 'Chest-to-Bar Pull-Up', 'back', 'bodyweight', 'vertical_pull', ['back', 'biceps', 'shoulders'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 6.5, difficulty: 4, description: 'A pull-up pulled high enough to touch the chest to the bar, building the extra range and pulling power a muscle-up needs.',
  }),
  S('inverted-row-feet-elevated', 'Inverted Row (Feet Elevated)', 'back', 'bodyweight', 'horizontal_pull', ['back', 'biceps', 'core'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 5, difficulty: 3, description: 'A horizontal row under a bar with the feet raised on a box, making the body angle steeper and the pull considerably harder.',
  }),
  S('iso-lateral-high-row', 'Iso-Lateral High Row (Plate-Loaded)', 'back', 'machine', 'vertical_pull', ['back', 'biceps'], 'strength.machine', {
    trackingType: 'reps_weight', met: 5, difficulty: 2, description: 'A chest-supported machine pull from above and in front, one arm at a time, hitting the lats on a downward angle.',
  }),
  S('jumping-pull-up', 'Jumping Pull-Up', 'back', 'bodyweight', 'vertical_pull', ['back', 'biceps'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 6, difficulty: 2, description: 'A pull-up started with a jump from the floor so you can train the top half of the movement before you can pull your full weight.',
  }),
  S('lat-pulldown-single-arm', 'Single-Arm Lat Pulldown', 'back', 'cable', 'vertical_pull', ['back', 'biceps'], 'strength.cable', {
    trackingType: 'reps_weight', met: 4, difficulty: 2, description: 'A pulldown with one handle so the lat can be trained through a fuller range and side-to-side gaps get exposed.',
  }),
  S('machine-pullover', 'Machine Pullover', 'back', 'machine', 'vertical_pull', ['back', 'chest'], 'strength.machine', {
    trackingType: 'reps_weight', met: 4, difficulty: 2, description: 'A seated machine that drives the elbows down in an arc, loading the lats through a long range with no grip or biceps limit.',
  }),
  S('negative-pull-up', 'Negative Pull-Up', 'back', 'bodyweight', 'vertical_pull', ['back', 'biceps', 'forearms'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 5, difficulty: 2, description: 'Jump or step to the top of a pull-up and lower slowly under control, the standard way to build a first full rep.',
  }),
  S('seated-back-extension-machine', 'Seated Back Extension Machine', 'back', 'machine', 'hinge', ['back', 'glutes'], 'strength.machine', {
    trackingType: 'reps_weight', met: 3.5, difficulty: 1, description: 'A seated machine that loads spinal extension against a pad, giving lower-back work to people who cannot yet hold a 45-degree bench.',
  }),
  S('seated-cable-row-single-arm', 'Single-Arm Seated Cable Row', 'back', 'cable', 'horizontal_pull', ['back', 'biceps'], 'strength.cable', {
    trackingType: 'reps_weight', met: 4, difficulty: 2, description: 'A seated row performed one arm at a time, allowing extra reach at the front and a harder shoulder-blade squeeze at the back.',
  }),
  S('smith-machine-row', 'Bent-Over Row (Smith Machine)', 'back', 'machine', 'horizontal_pull', ['back', 'biceps'], 'strength.machine', {
    trackingType: 'reps_weight', met: 5, difficulty: 3, description: 'A bent-over row on a fixed vertical bar path, which keeps the bar tracking straight so you can hold a stricter hinge position.',
  }),
  S('straddle-front-lever', 'Straddle Front Lever', 'back', 'bodyweight', 'core', ['back', 'core', 'biceps'], 'strength.calisthenics', {
    trackingType: 'duration', met: 6, difficulty: 5, description: 'A front lever hold with the legs split wide to shorten the lever, the last step before the full front lever.',
  }),
  S('t-bar-row-chest-supported', 'Chest-Supported T-Bar Row', 'back', 'machine', 'horizontal_pull', ['back', 'biceps'], 'strength.machine', {
    trackingType: 'reps_weight', met: 5, difficulty: 2, description: 'A T-bar row with the torso braced against a pad, so heavy mid-back work happens with no lower-back or hinge fatigue.',
  }),
  S('tuck-back-lever', 'Tuck Back Lever', 'back', 'bodyweight', 'core', ['back', 'chest', 'core'], 'strength.calisthenics', {
    trackingType: 'duration', met: 5, difficulty: 3, description: 'A face-down horizontal hold under a bar or rings with the knees tucked, the first step of the back lever progression.',
  }),
  S('barbell-curl-21s', '21s Curl (Barbell)', 'biceps', 'barbell', 'curl', ['biceps', 'forearms'], 'strength.barbell', {
    trackingType: 'reps_weight', met: 4, difficulty: 2, description: 'A curl set of seven bottom-half reps, seven top-half reps and seven full reps performed back to back to accumulate time under tension in every part of the range.',
  }),
  S('bayesian-cable-curl', 'Bayesian Cable Curl', 'biceps', 'cable', 'curl', ['biceps'], 'strength.cable', {
    trackingType: 'reps_weight', met: 3.5, difficulty: 3, description: 'A single-arm cable curl performed facing away from a low pulley with the arm behind the torso, keeping tension on the biceps in the fully stretched position.',
  }),
  S('behind-the-back-cable-curl', 'Behind-the-Back Cable Curl', 'biceps', 'cable', 'curl', ['biceps'], 'strength.cable', {
    trackingType: 'reps_weight', met: 3.5, difficulty: 2, description: 'A single-arm curl with the cable running behind the body from a low pulley, holding the upper arm slightly behind the torso to bias the long head of the biceps.',
  }),
  S('chin-up-supinated', 'Chin-Up (Supinated Grip)', 'biceps', 'bodyweight', 'vertical_pull', ['biceps', 'back'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 6, difficulty: 3, description: 'A bodyweight pull to the bar with palms facing the lifter, loading the biceps heavily alongside the lats.',
  }),
  S('gironda-drag-curl-cable', 'Cable Drag Curl', 'biceps', 'cable', 'curl', ['biceps'], 'strength.cable', {
    trackingType: 'reps_weight', met: 3.5, difficulty: 2, description: 'A cable curl in which the elbows travel backwards and the handle is dragged up the torso, shortening the biceps without letting the front delts take over.',
  }),
  S('machine-bicep-curl-seated', 'Seated Biceps Curl Machine', 'biceps', 'machine', 'curl', ['biceps'], 'strength.machine', {
    trackingType: 'reps_weight', met: 3.5, difficulty: 1, description: 'A machine curl with the upper arms fixed on a pad, giving a stable path for beginners or for high-rep work at the end of a session.',
  }),
  S('seated-dumbbell-curl', 'Seated Dumbbell Curl', 'biceps', 'dumbbell', 'curl', ['biceps', 'forearms'], 'strength.dumbbell', {
    trackingType: 'reps_weight', met: 3.5, difficulty: 1, description: 'A curl performed seated upright on a bench, which prevents leg drive and body English so the biceps do the work.',
  }),
  S('spider-curl-dumbbell', 'Spider Curl (Dumbbell)', 'biceps', 'dumbbell', 'curl', ['biceps', 'forearms'], 'strength.dumbbell', {
    trackingType: 'reps_weight', met: 3.5, difficulty: 2, description: 'A curl performed lying chest-down on an incline bench so the arms hang straight down, removing swing and loading the biceps in the shortened position.',
  }),
  S('waiter-curl', 'Waiter Curl (Dumbbell)', 'biceps', 'dumbbell', 'curl', ['biceps', 'forearms'], 'strength.dumbbell', {
    trackingType: 'reps_weight', met: 3.5, difficulty: 2, description: 'A curl holding a single dumbbell flat between both hands like a tray, which keeps the wrists supinated and concentrates the load on the biceps.',
  }),
  S('weighted-chin-up', 'Weighted Chin-Up', 'biceps', 'bodyweight', 'vertical_pull', ['biceps', 'back'], 'strength.calisthenics', {
    trackingType: 'reps_weight', met: 6.5, difficulty: 4, description: 'A supinated pull-up performed with extra load on a belt or between the feet, used to build maximal biceps and lat strength.',
  }),
  S('zottman-curl', 'Zottman Curl (Dumbbell)', 'biceps', 'dumbbell', 'curl', ['biceps', 'forearms'], 'strength.dumbbell', {
    trackingType: 'reps_weight', met: 3.5, difficulty: 3, description: 'A dumbbell curl lifted with a supinated grip and lowered with a pronated grip, training the biceps on the way up and the forearm extensors and brachioradialis on the way down.',
  }),
  S('eccentric-heel-drop', 'Eccentric Heel Drop', 'calves', 'bodyweight', 'calf_raise', ['calves'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 3, difficulty: 1, description: 'Rise on both feet at the edge of a step, then lower one heel slowly below the step — the standard loading drill for Achilles tendon rehab.',
  }),
  S('pogo-hops', 'Pogo Hops', 'calves', 'bodyweight', 'calf_raise', ['calves', 'quads'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 8, difficulty: 2, description: 'Small, fast rebounding hops driven from the ankles with stiff knees, training calf and Achilles elasticity for running and jumping.',
  }),
  S('seated-barbell-calf-raise', 'Seated Barbell Calf Raise', 'calves', 'barbell', 'calf_raise', ['calves'], 'strength.barbell', {
    trackingType: 'reps_weight', met: 4, difficulty: 2, description: 'Seated with a padded barbell across the thighs and the balls of the feet on a block, pressing up through the toes to load the soleus without a machine.',
  }),
  S('smith-calf-raise', 'Smith Machine Calf Raise', 'calves', 'machine', 'calf_raise', ['calves'], 'strength.machine', {
    trackingType: 'reps_weight', met: 4, difficulty: 2, description: 'Standing calf raises with the bar on the shoulders in a Smith machine, so you can chase heavy loads without balancing the bar.',
  }),
  S('smith-machine-calf-raise', 'Calf Raise (Smith Machine)', 'calves', 'machine', 'calf_raise', ['calves'], 'strength.machine', {
    trackingType: 'reps_weight', met: 3.5, difficulty: 1, description: 'A standing calf raise with the bar fixed on the shoulders, so you can chase a full stretch and squeeze without balancing the load.',
  }),
  S('tib-bar-raise', 'Weighted Tibialis Raise (Tib Bar)', 'calves', 'other', 'calf_raise', ['calves'], 'strength.band', {
    trackingType: 'reps_weight', met: 3.5, difficulty: 2, description: 'Toe raises against a loaded tib bar or ankle strap, adding progressive resistance to the shin muscles for knee and ankle resilience.',
  }),
  S('tibialis-raise', 'Tibialis Raise', 'calves', 'bodyweight', 'calf_raise', ['calves'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 3, difficulty: 1, description: 'Heels planted with your back against a wall, lifting the toes toward the shins to train the tibialis anterior and balance out calf work.',
  }),
  S('toe-walk', 'Toe Walk', 'calves', 'bodyweight', 'carry', ['calves', 'core'], 'strength.calisthenics', {
    trackingType: 'distance', met: 4.5, difficulty: 1, description: 'Walking on the balls of the feet with the heels held high, building calf and foot endurance for a set distance.',
  }),
  S('cable-chest-press-standing', 'Standing Cable Chest Press', 'chest', 'cable', 'horizontal_push', ['chest', 'triceps', 'core'], 'strength.cable', {
    trackingType: 'reps_weight', met: 4.5, difficulty: 2, description: 'A press away from the body from chest-height pulleys while standing, adding a core anti-extension demand to the push.',
  }),
  S('cable-fly-single-arm', 'Single-Arm Cable Fly', 'chest', 'cable', 'horizontal_push', ['chest'], 'strength.cable', {
    trackingType: 'reps_weight', met: 4, difficulty: 2, description: 'A one-arm fly that lets the working side travel across the midline for a longer stretch and squeeze than a two-arm crossover.',
  }),
  S('chest-press-machine-incline', 'Incline Chest Press Machine', 'chest', 'machine', 'horizontal_push', ['chest', 'shoulders', 'triceps'], 'strength.machine', {
    trackingType: 'reps_weight', met: 4.5, difficulty: 1, description: 'A seated pressing machine set on an upward angle to bias the upper chest without needing bench-press balance.',
  }),
  S('iso-lateral-chest-press', 'Iso-Lateral Chest Press (Plate-Loaded)', 'chest', 'machine', 'horizontal_push', ['chest', 'triceps', 'shoulders'], 'strength.machine', {
    trackingType: 'reps_weight', met: 5, difficulty: 2, description: 'A plate-loaded press with independent arms, so each side moves its own load and strength differences cannot be hidden.',
  }),
  S('knee-push-up', 'Knee Push-Up', 'chest', 'bodyweight', 'horizontal_push', ['chest', 'triceps', 'shoulders'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 3.5, difficulty: 1, description: 'A push-up done from the knees instead of the toes, cutting the load so you can build reps toward the full version.',
  }),
  S('korean-dip', 'Korean Dip', 'chest', 'bodyweight', 'horizontal_push', ['chest', 'triceps', 'shoulders'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 6.5, difficulty: 4, description: 'A dip on a straight bar held behind the back, loading the chest and shoulders through a deep and demanding range.',
  }),
  S('smith-machine-incline-press', 'Incline Bench Press (Smith Machine)', 'chest', 'machine', 'horizontal_push', ['chest', 'shoulders', 'triceps'], 'strength.machine', {
    trackingType: 'reps_weight', met: 5, difficulty: 2, description: 'An incline press on a fixed bar path, letting you train the upper chest heavily without a spotter.',
  }),
  S('wall-push-up', 'Wall Push-Up', 'chest', 'bodyweight', 'horizontal_push', ['chest', 'triceps', 'shoulders'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 3, difficulty: 1, description: 'A push-up performed standing with the hands flat on a wall, the easiest entry point for building pressing strength.',
  }),
  S('body-saw-plank', 'Body Saw Plank', 'core', 'bodyweight', 'core', ['core', 'shoulders'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 3.5, difficulty: 3, description: 'In a forearm plank with the feet on sliders, rock the body backward and forward so the lever lengthens, making the plank harder without adding weight.',
  }),
  S('cable-woodchop-high-low', 'Cable Woodchop (High to Low)', 'core', 'cable', 'rotation', ['core', 'shoulders'], 'strength.cable', {
    trackingType: 'reps_weight', met: 4.5, difficulty: 2, description: 'Pull a high cable diagonally across the body to the opposite hip while turning through the trunk, training rotation under steady load.',
  }),
  S('cable-woodchop-low-to-high', 'Reverse Cable Woodchop (Low-to-High)', 'core', 'cable', 'rotation', ['core', 'shoulders'], 'strength.cable', {
    trackingType: 'reps_weight', met: 4, difficulty: 2, description: 'A diagonal rotation pulling from a low pulley up across the body, training the obliques in the opposite direction to the standard chop.',
  }),
  S('captains-chair-knee-raise', 'Captain\'s Chair Knee Raise', 'core', 'machine', 'core', ['core'], 'strength.machine', {
    trackingType: 'reps_only', met: 4, difficulty: 2, description: 'Supported on the forearms in a captain\'s chair rack, lift the knees toward the chest so the abs work without grip or hanging strength limiting the set.',
  }),
  S('copenhagen-plank', 'Copenhagen Plank', 'core', 'bodyweight', 'core', ['core', 'legs'], 'strength.calisthenics', {
    trackingType: 'duration', met: 3, difficulty: 3, description: 'A side plank with the top leg resting on a bench and the body held up through the inner thigh, used to strengthen the adductors and lateral core together.',
  }),
  S('ghd-sit-up', 'GHD Sit-Up', 'core', 'machine', 'core', ['core', 'quads'], 'strength.machine', {
    trackingType: 'reps_only', met: 5, difficulty: 4, description: 'Seated on a glute-ham developer with the hips off the pad, extend back below horizontal and sit up again, training the abs through a much larger range than a floor sit-up.',
  }),
  S('hanging-knee-raise', 'Hanging Knee Raise', 'core', 'bodyweight', 'core', ['core', 'forearms'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 4, difficulty: 2, description: 'Hang from a bar and draw the knees up toward the chest with a controlled descent, serving as the standard bent-leg step toward straight-leg raises.',
  }),
  S('hanging-windshield-wipers', 'Hanging Windshield Wipers', 'core', 'bodyweight', 'rotation', ['core', 'back'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 6, difficulty: 5, description: 'Hanging from a bar with legs raised toward it, sweep the feet side to side in an arc, demanding heavy oblique strength and grip endurance.',
  }),
  S('medicine-ball-rotational-throw', 'Medicine Ball Rotational Throw', 'core', 'other', 'rotation', ['core', 'shoulders'], 'strength.band', {
    trackingType: 'reps_weight', met: 6.5, difficulty: 3, description: 'Stand side-on to a wall and throw a medicine ball hard across the body, developing explosive rotational power for throwing and striking sports.',
  }),
  S('pallof-press', 'Pallof Press (Cable)', 'core', 'cable', 'core', ['core'], 'strength.cable', {
    trackingType: 'reps_weight', met: 3.5, difficulty: 2, description: 'Standing side-on to a cable, press the handle straight out from the chest and resist the pull that tries to rotate you, training the core to prevent rotation rather than produce it.',
  }),
  S('plank-shoulder-tap', 'Plank Shoulder Tap', 'core', 'bodyweight', 'core', ['core', 'shoulders'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 3.5, difficulty: 2, description: 'From a high plank, tap each hand to the opposite shoulder while keeping the hips still, an accessible way to train anti-rotation.',
  }),
  S('side-lying-hip-raise', 'Side-Lying Hip Raise', 'core', 'bodyweight', 'core', ['core', 'glutes'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 3, difficulty: 2, description: 'From a forearm side plank on bent knees, lower and lift the hips repeatedly to work the obliques and lateral hip through a range of motion.',
  }),
  S('stir-the-pot', 'Stir the Pot (Swiss Ball)', 'core', 'other', 'core', ['core', 'shoulders'], 'strength.band', {
    trackingType: 'reps_only', met: 3.5, difficulty: 3, description: 'Plank on the forearms on a Swiss ball and draw slow circles with the elbows, holding a rigid trunk while the support surface keeps moving.',
  }),
  S('swiss-ball-pike', 'Swiss Ball Pike', 'core', 'other', 'core', ['core', 'shoulders'], 'strength.band', {
    trackingType: 'reps_only', met: 4.5, difficulty: 4, description: 'With the shins on a Swiss ball in a push-up position, pull the hips high into a pike and return, a demanding progression toward straight-leg core control.',
  }),
  S('toes-to-bar', 'Toes-to-Bar', 'core', 'bodyweight', 'core', ['core', 'back', 'forearms'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 6.5, difficulty: 4, description: 'From a hang, bring both feet up to touch the bar and return under control, combining full-range hip flexion with lat and grip strength.',
  }),
  S('torso-rotation-machine', 'Torso Rotation Machine', 'core', 'machine', 'rotation', ['core'], 'strength.machine', {
    trackingType: 'reps_weight', met: 3.5, difficulty: 1, description: 'A seated machine with the hips pinned that loads twisting through the trunk to train the obliques directly.',
  }),
  S('tuck-l-sit', 'Tuck L-Sit', 'core', 'bodyweight', 'core', ['core', 'triceps', 'shoulders'], 'strength.calisthenics', {
    trackingType: 'duration', met: 3.5, difficulty: 2, description: 'A support hold on parallettes or the floor with the knees tucked to the chest, the regression that leads to a full L-sit.',
  }),
  S('weighted-plank', 'Weighted Plank', 'core', 'other', 'core', ['core', 'shoulders'], 'strength.band', {
    trackingType: 'duration', met: 3.5, difficulty: 3, description: 'A standard forearm plank with a weight plate placed on the upper back, adding load so the hold builds strength instead of only endurance.',
  }),
  S('barbell-hold-for-time', 'Barbell Static Hold', 'forearms', 'barbell', 'carry', ['forearms', 'back'], 'strength.barbell', {
    trackingType: 'duration', met: 3.5, difficulty: 2, description: 'A timed hold of a loaded barbell at arm\'s length from a rack, used to build grip endurance for deadlifts and rows.',
  }),
  S('rice-bucket-grip-work', 'Rice Bucket Grip Drill', 'forearms', 'other', 'curl', ['forearms'], 'strength.band', {
    trackingType: 'duration', met: 2.5, difficulty: 1, description: 'A timed drill digging, squeezing and rotating the hands through a bucket of rice to train the finger flexors and extensors with low joint stress.',
  }),
  S('suitcase-carry', 'Suitcase Carry', 'forearms', 'dumbbell', 'carry', ['forearms', 'core'], 'strength.dumbbell', {
    trackingType: 'distance', met: 5.5, difficulty: 2, description: 'A loaded walk carrying weight in one hand only, training grip while the core resists sideways lean.',
  }),
  S('b-stance-hip-thrust', 'B-Stance Hip Thrust (Barbell)', 'glutes', 'barbell', 'hinge', ['glutes', 'hamstrings'], 'strength.barbell', {
    trackingType: 'reps_weight', met: 5, difficulty: 3, description: 'Hip thrust with one foot staggered back as a kickstand so most of the load goes through the front leg.',
  }),
  S('banded-lateral-walk', 'Banded Lateral Walk', 'glutes', 'other', 'hinge', ['glutes'], 'strength.band', {
    trackingType: 'duration', met: 3.5, difficulty: 1, description: 'Sideways stepping in a half-squat with a band around the knees to strengthen the hip abductors.',
  }),
  S('bench-reverse-hyper', 'Bench Reverse Hyperextension', 'glutes', 'bodyweight', 'hinge', ['glutes', 'hamstrings', 'back'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 3.5, difficulty: 2, description: 'Lying face down on a bench and raising the legs to hip height, a bodyweight way to train hip extension.',
  }),
  S('cable-hip-abduction', 'Standing Cable Hip Abduction', 'glutes', 'cable', 'hinge', ['glutes'], 'strength.cable', {
    trackingType: 'reps_weight', met: 4, difficulty: 2, description: 'Pulling the leg out to the side against a low pulley, isolating the gluteus medius under constant tension.',
  }),
  S('clamshell', 'Clamshell (Band)', 'glutes', 'other', 'hinge', ['glutes'], 'strength.band', {
    trackingType: 'reps_only', met: 2.5, difficulty: 1, description: 'Side-lying knee opening against a band around the thighs that targets the gluteus medius for hip stability.',
  }),
  S('curtsy-lunge', 'Curtsy Lunge', 'glutes', 'bodyweight', 'lunge', ['glutes', 'quads'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 5, difficulty: 2, description: 'Lunge with the rear leg crossing behind the front, emphasising the gluteus medius and hip control.',
  }),
  S('db-reverse-lunge', 'Reverse Lunge (Dumbbell)', 'glutes', 'dumbbell', 'lunge', ['glutes', 'quads', 'hamstrings'], 'strength.dumbbell', {
    trackingType: 'reps_weight', met: 6, difficulty: 2, description: 'Stepping backward into a lunge with dumbbells, a knee-friendly single-leg lift that favours the glutes.',
  }),
  S('frog-pump', 'Frog Pump', 'glutes', 'bodyweight', 'hinge', ['glutes'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 3, difficulty: 1, description: 'Floor bridge with the soles of the feet together and knees turned out, used for high-rep glute work.',
  }),
  S('ghd-hip-extension', 'GHD Hip Extension', 'glutes', 'machine', 'hinge', ['glutes', 'hamstrings', 'back'], 'strength.machine', {
    trackingType: 'reps_only', met: 4, difficulty: 3, description: 'Raising the torso from a hanging position on a glute-ham developer with the knees fixed, training hip extension alone.',
  }),
  S('glute-bridge-march', 'Glute Bridge March', 'glutes', 'bodyweight', 'hinge', ['glutes', 'core'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 3, difficulty: 2, description: 'Holding a bridge while lifting one knee at a time, training the glutes to keep the hips level on one leg.',
  }),
  S('glute-drive-machine', 'Glute Drive Machine', 'glutes', 'machine', 'hinge', ['glutes', 'hamstrings'], 'strength.machine', {
    trackingType: 'reps_weight', met: 4.5, difficulty: 1, description: 'A seated hip-thrust machine with a padded lap bar, giving the same glute work as a barbell thrust with no setup or bar discomfort.',
  }),
  S('hip-airplane', 'Hip Airplane', 'glutes', 'bodyweight', 'rotation', ['glutes', 'core'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 3, difficulty: 4, description: 'Single-leg hinge with the pelvis rotating open and closed, training hip rotation control and balance.',
  }),
  S('hip-thrust-machine', 'Hip Thrust Machine', 'glutes', 'machine', 'hinge', ['glutes', 'hamstrings'], 'strength.machine', {
    trackingType: 'reps_weight', met: 5, difficulty: 2, description: 'Loaded hip thrust in a fixed machine, removing the bar setup so the glutes can be trained heavy.',
  }),
  S('kb-sumo-deadlift', 'Kettlebell Sumo Deadlift', 'glutes', 'other', 'hinge', ['glutes', 'hamstrings', 'quads'], 'strength.band', {
    trackingType: 'reps_weight', met: 5, difficulty: 1, description: 'Wide-stance deadlift with a kettlebell between the feet, the simplest way to learn a loaded hinge.',
  }),
  S('kneeling-squat', 'Barbell Kneeling Squat', 'glutes', 'barbell', 'hinge', ['glutes', 'hamstrings'], 'strength.barbell', {
    trackingType: 'reps_weight', met: 5, difficulty: 3, description: 'Sitting back and driving the hips forward from a tall kneeling position with a bar on the back, loading hip extension without the knees or ankles.',
  }),
  S('monster-walk', 'Monster Walk (Band)', 'glutes', 'other', 'hinge', ['glutes', 'quads'], 'strength.band', {
    trackingType: 'duration', met: 4, difficulty: 2, description: 'Forward and backward stepping in a half-squat against a band around the knees, building hip abductor endurance.',
  }),
  S('reverse-hack-squat', 'Reverse Hack Squat', 'glutes', 'machine', 'squat', ['glutes', 'quads', 'hamstrings'], 'strength.machine', {
    trackingType: 'reps_weight', met: 5.5, difficulty: 3, description: 'A hack squat performed facing into the pad, which shifts the load onto the glutes and hamstrings through a deep hip range.',
  }),
  S('reverse-hyperextension', 'Reverse Hyperextension (Machine)', 'glutes', 'machine', 'hinge', ['glutes', 'hamstrings', 'back'], 'strength.machine', {
    trackingType: 'reps_weight', met: 4, difficulty: 3, description: 'Swinging the legs up from a fixed torso to train hip extension with very little load on the spine.',
  }),
  S('single-leg-hip-thrust', 'Single-Leg Hip Thrust', 'glutes', 'bodyweight', 'hinge', ['glutes', 'hamstrings'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 4, difficulty: 3, description: 'Hip thrust from a bench with one foot on the floor and the other leg lifted, loading each glute on its own.',
  }),
  S('smith-machine-hip-thrust', 'Hip Thrust (Smith Machine)', 'glutes', 'machine', 'hinge', ['glutes', 'hamstrings'], 'strength.machine', {
    trackingType: 'reps_weight', met: 5, difficulty: 3, description: 'A bench-supported hip thrust with the bar running in the Smith rails, making heavy loads easy to unrack and re-rack alone.',
  }),
  S('step-through-lunge', 'Step-Through Lunge', 'glutes', 'bodyweight', 'lunge', ['glutes', 'quads', 'hamstrings'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 6, difficulty: 3, description: 'Continuous forward-then-backward lunge on the same leg without resting the foot down, training balance and single-leg control.',
  }),
  S('trap-bar-deadlift', 'Trap Bar Deadlift', 'glutes', 'barbell', 'hinge', ['glutes', 'quads', 'hamstrings'], 'strength.barbell', {
    trackingType: 'reps_weight', met: 6, difficulty: 3, description: 'Deadlift from inside a hex bar with neutral handles, an easier-to-learn way to train heavy hip extension.',
  }),
  S('cable-romanian-deadlift', 'Cable Romanian Deadlift', 'hamstrings', 'cable', 'hinge', ['hamstrings', 'glutes', 'back'], 'strength.cable', {
    trackingType: 'reps_weight', met: 4.5, difficulty: 2, description: 'Romanian deadlift against a low cable, keeping tension on the hamstrings through the whole range.',
  }),
  S('deficit-deadlift', 'Deficit Deadlift', 'hamstrings', 'barbell', 'hinge', ['hamstrings', 'glutes', 'back'], 'strength.barbell', {
    trackingType: 'reps_weight', met: 6, difficulty: 4, description: 'Deadlift while standing on a plate or block, adding range of motion to build strength off the floor.',
  }),
  S('dowel-hip-hinge', 'Dowel Hip Hinge', 'hamstrings', 'other', 'hinge', ['hamstrings', 'glutes', 'back'], 'strength.band', {
    trackingType: 'reps_only', met: 2.5, difficulty: 1, description: 'Hinge drill with a dowel held along the spine, teaching a neutral back and a hips-back pattern before adding load.',
  }),
  S('jefferson-curl', 'Jefferson Curl', 'hamstrings', 'dumbbell', 'hinge', ['hamstrings', 'back'], 'strength.dumbbell', {
    trackingType: 'reps_weight', met: 3, difficulty: 4, description: 'Slow segmental roll-down and back up holding a light weight, used to build strength at the end range of hamstring flexibility.',
  }),
  S('snatch-grip-deadlift', 'Snatch-Grip Deadlift', 'hamstrings', 'barbell', 'hinge', ['hamstrings', 'back', 'glutes'], 'strength.barbell', {
    trackingType: 'reps_weight', met: 6, difficulty: 4, description: 'Deadlift with a very wide grip that lengthens the range of motion and loads the upper back and hamstrings hard.',
  }),
  S('staggered-stance-rdl', 'Staggered-Stance Romanian Deadlift (Dumbbell)', 'hamstrings', 'dumbbell', 'hinge', ['hamstrings', 'glutes'], 'strength.dumbbell', {
    trackingType: 'reps_weight', met: 4.5, difficulty: 3, description: 'Romanian deadlift with the rear foot on its toes as a kickstand, shifting most of the load onto the front hamstring.',
  }),
  S('standing-leg-curl', 'Standing Leg Curl (Machine)', 'hamstrings', 'machine', 'hinge', ['hamstrings'], 'strength.machine', {
    trackingType: 'reps_weight', met: 4, difficulty: 2, description: 'Single-leg knee curl performed standing, isolating one hamstring at a time.',
  }),
  S('standing-leg-curl-machine', 'Standing Leg Curl (Single-Leg)', 'hamstrings', 'machine', 'hinge', ['hamstrings', 'calves'], 'strength.machine', {
    trackingType: 'reps_weight', met: 4, difficulty: 2, description: 'A one-leg hamstring curl performed upright with the hip extended, training knee flexion in a position the lying and seated curls miss.',
  }),
  S('swiss-ball-leg-curl', 'Stability Ball Leg Curl', 'hamstrings', 'other', 'hinge', ['hamstrings', 'glutes', 'core'], 'strength.band', {
    trackingType: 'reps_only', met: 4, difficulty: 2, description: 'Bridging with the heels on a stability ball and curling it in, working the hamstrings and glutes together.',
  }),
  S('weighted-nordic-curl', 'Weighted Nordic Curl', 'hamstrings', 'other', 'hinge', ['hamstrings'], 'strength.band', {
    trackingType: 'reps_weight', met: 6, difficulty: 5, description: 'Nordic curl performed holding a plate to the chest, an advanced eccentric overload for the hamstrings.',
  }),
  S('hip-adduction-machine', 'Hip Adduction Machine', 'legs', 'machine', 'squat', ['legs', 'quads'], 'strength.machine', {
    trackingType: 'reps_weight', met: 3.5, difficulty: 1, description: 'A seated machine that squeezes the knees together against resistance to train the inner-thigh adductors.',
  }),
  S('90-90-hip-switch', '90/90 Hip Switch', 'mobility', 'bodyweight', 'mobility', ['mobility', 'glutes', 'legs'], 'mindbody.stretch', {
    trackingType: 'reps_only', met: 2.5, difficulty: 2, sessionType: 'mindbody', description: 'Seated rotation of both legs from one 90/90 position to the other, training internal and external hip rotation.',
  }),
  S('banded-shoulder-dislocates', 'Banded Shoulder Dislocates', 'mobility', 'other', 'mobility', ['mobility', 'shoulders', 'chest'], 'mindbody.stretch', {
    trackingType: 'reps_only', met: 2.5, difficulty: 2, sessionType: 'mindbody', description: 'Passing a band overhead and behind the body with straight arms to open the shoulders before pressing or overhead work.',
  }),
  S('butterfly-stretch', 'Butterfly Stretch', 'mobility', 'bodyweight', 'mobility', ['mobility', 'legs'], 'mindbody.stretch', {
    trackingType: 'duration', met: 2, difficulty: 1, sessionType: 'mindbody', description: 'A seated hold with the soles of the feet together and the knees dropped out, stretching the groin and inner thighs.',
  }),
  S('cat-cow', 'Cat-Cow', 'mobility', 'bodyweight', 'mobility', ['mobility', 'back', 'core'], 'mindbody.stretch', {
    trackingType: 'reps_only', met: 2, difficulty: 1, sessionType: 'mindbody', description: 'Alternating spinal flexion and extension on hands and knees, used to warm the back and hips before training.',
  }),
  S('childs-pose', 'Child\'s Pose', 'mobility', 'bodyweight', 'mobility', ['mobility', 'back', 'glutes'], 'mindbody.stretch', {
    trackingType: 'duration', met: 2, difficulty: 1, sessionType: 'mindbody', description: 'A kneeling rest position with the hips sat back and the arms reaching forward, stretching the lats, lower back and hips.',
  }),
  S('doorway-pec-stretch', 'Doorway Pec Stretch', 'mobility', 'bodyweight', 'mobility', ['mobility', 'chest', 'shoulders'], 'mindbody.stretch', {
    trackingType: 'duration', met: 2, difficulty: 1, sessionType: 'mindbody', description: 'A standing stretch with the forearm braced on a door frame, opening the chest and front of the shoulder.',
  }),
  S('downward-dog', 'Downward Dog', 'mobility', 'bodyweight', 'mobility', ['mobility', 'hamstrings', 'shoulders'], 'mindbody.stretch', {
    trackingType: 'duration', met: 2.5, difficulty: 2, sessionType: 'mindbody', description: 'An inverted V hold on the hands and feet that lengthens the hamstrings, calves and shoulders at once.',
  }),
  S('frog-stretch', 'Frog Stretch', 'mobility', 'bodyweight', 'mobility', ['mobility', 'legs', 'glutes'], 'mindbody.stretch', {
    trackingType: 'duration', met: 2.3, difficulty: 2, sessionType: 'mindbody', description: 'A wide-knee kneeling hold that opens the groin and inner thigh for squatting and lateral movement.',
  }),
  S('front-split', 'Front Split', 'mobility', 'bodyweight', 'mobility', ['mobility', 'hamstrings', 'quads'], 'mindbody.stretch', {
    trackingType: 'duration', met: 2.5, difficulty: 5, sessionType: 'mindbody', description: 'A full lengthwise split held on the floor, the end point of sustained hamstring and hip flexor flexibility work.',
  }),
  S('half-kneeling-hip-flexor-stretch', 'Half-Kneeling Hip Flexor Stretch', 'mobility', 'bodyweight', 'mobility', ['mobility', 'quads', 'glutes'], 'mindbody.stretch', {
    trackingType: 'duration', met: 2, difficulty: 1, sessionType: 'mindbody', description: 'A half-kneeling hold with the pelvis tucked under, stretching the hip flexors of the rear leg.',
  }),
  S('hamstring-nerve-floss', 'Hamstring Nerve Floss', 'mobility', 'bodyweight', 'mobility', ['mobility', 'hamstrings'], 'mindbody.stretch', {
    trackingType: 'reps_only', met: 2, difficulty: 2, sessionType: 'mindbody', description: 'A supine drill repeatedly straightening and bending the raised leg to glide the sciatic nerve and ease hamstring tightness.',
  }),
  S('hip-cars', 'Hip CARs', 'mobility', 'bodyweight', 'mobility', ['mobility', 'glutes', 'legs'], 'mindbody.stretch', {
    trackingType: 'reps_only', met: 2.5, difficulty: 3, sessionType: 'mindbody', description: 'A standing slow full-range circle of one hip while the pelvis stays braced, training active control at the end of hip range.',
  }),
  S('knee-to-wall-ankle-drill', 'Knee-to-Wall Ankle Drill', 'mobility', 'bodyweight', 'mobility', ['mobility', 'calves'], 'mindbody.stretch', {
    trackingType: 'reps_only', met: 2, difficulty: 1, sessionType: 'mindbody', description: 'Driving the knee forward over the toes toward a wall with the heel flat, to build the ankle dorsiflexion a deep squat needs.',
  }),
  S('neck-cars', 'Neck CARs', 'mobility', 'bodyweight', 'mobility', ['mobility', 'neck'], 'mindbody.stretch', {
    trackingType: 'reps_only', met: 2, difficulty: 1, sessionType: 'mindbody', description: 'Slow controlled circles of the head through its full range, used as a daily range check and a warm-up for the neck.',
  }),
  S('open-book-thoracic-rotation', 'Open Book Thoracic Rotation', 'mobility', 'bodyweight', 'mobility', ['mobility', 'back', 'chest'], 'mindbody.stretch', {
    trackingType: 'reps_only', met: 2, difficulty: 2, sessionType: 'mindbody', description: 'A side-lying drill sweeping the top arm across the body to restore rotation through the mid-back.',
  }),
  S('pancake-stretch', 'Pancake Stretch', 'mobility', 'bodyweight', 'mobility', ['mobility', 'hamstrings', 'legs'], 'mindbody.stretch', {
    trackingType: 'duration', met: 2.5, difficulty: 4, sessionType: 'mindbody', description: 'A seated wide-straddle fold with the chest reaching toward the floor, developing deep adductor and hamstring range.',
  }),
  S('pigeon-pose', 'Pigeon Pose', 'mobility', 'bodyweight', 'mobility', ['mobility', 'glutes'], 'mindbody.stretch', {
    trackingType: 'duration', met: 2.3, difficulty: 3, sessionType: 'mindbody', description: 'A floor hold with the front shin angled across the body, targeting the glutes and deep hip rotators.',
  }),
  S('quadruped-wrist-rocks', 'Quadruped Wrist Rocks', 'mobility', 'bodyweight', 'mobility', ['mobility', 'forearms'], 'mindbody.stretch', {
    trackingType: 'reps_only', met: 2, difficulty: 1, sessionType: 'mindbody', description: 'Rocking bodyweight over the hands through several palm and knuckle positions to prepare the wrists for front squats, presses and floor work.',
  }),
  S('scapular-push-up', 'Scapular Push-Up', 'mobility', 'bodyweight', 'mobility', ['mobility', 'back', 'shoulders'], 'mindbody.stretch', {
    trackingType: 'reps_only', met: 2.5, difficulty: 2, sessionType: 'mindbody', description: 'A push-up position where only the shoulder blades move, spreading and squeezing to train serratus control and shoulder health.',
  }),
  S('seated-forward-fold', 'Seated Forward Fold', 'mobility', 'bodyweight', 'mobility', ['mobility', 'hamstrings', 'back'], 'mindbody.stretch', {
    trackingType: 'duration', met: 2, difficulty: 2, sessionType: 'mindbody', description: 'A seated hold reaching toward the feet with the legs straight, stretching the hamstrings and lower back.',
  }),
  S('shoulder-cars', 'Shoulder CARs', 'mobility', 'bodyweight', 'mobility', ['mobility', 'shoulders'], 'mindbody.stretch', {
    trackingType: 'reps_only', met: 2.5, difficulty: 3, sessionType: 'mindbody', description: 'A slow full-range circle of one arm with the torso held still, maintaining the shoulder range you can actively control.',
  }),
  S('standing-quad-stretch', 'Standing Quad Stretch', 'mobility', 'bodyweight', 'mobility', ['mobility', 'quads'], 'mindbody.stretch', {
    trackingType: 'duration', met: 2, difficulty: 1, sessionType: 'mindbody', description: 'A standing hold drawing the heel toward the glute to stretch the quadriceps and hip flexor.',
  }),
  S('thread-the-needle', 'Thread the Needle', 'mobility', 'bodyweight', 'mobility', ['mobility', 'back', 'shoulders'], 'mindbody.stretch', {
    trackingType: 'duration', met: 2, difficulty: 1, sessionType: 'mindbody', description: 'A quadruped hold with one arm threaded under the body, rotating and stretching the upper back and rear shoulder.',
  }),
  S('wall-calf-stretch', 'Wall Calf Stretch', 'mobility', 'bodyweight', 'mobility', ['mobility', 'calves'], 'mindbody.stretch', {
    trackingType: 'duration', met: 2, difficulty: 1, sessionType: 'mindbody', description: 'A standing hold with the ball of the foot against a wall and the heel down, stretching the calf and Achilles.',
  }),
  S('worlds-greatest-stretch', 'World\'s Greatest Stretch', 'mobility', 'bodyweight', 'mobility', ['mobility', 'glutes', 'back'], 'mindbody.stretch', {
    trackingType: 'reps_only', met: 3, difficulty: 2, sessionType: 'mindbody', description: 'A deep lunge with the elbow to the instep and a reach into thoracic rotation, covering hips, groin and upper back in one warm-up movement.',
  }),
  S('banded-neck-rotation', 'Banded Neck Rotation', 'neck', 'other', 'core', ['neck'], 'strength.band', {
    instructions: ['Sit or stand tall with a light band anchored at head height to one side.', 'Turn your head slowly against the band, only as far as stays comfortable.', 'Return under control; never let the band snap your head back.', 'Build up over weeks. The neck responds to little and often, not to load.'], subMuscle: 'neck_lateral', trackingType: 'reps_only', met: 2.5, difficulty: 1, description: 'With a light band anchored to the side of the head, turn the chin toward the shoulder against the band\'s pull to train rotation, which straight flexion and extension work misses.',
  }),
  S('chin-tuck-hold', 'Chin Tuck Hold', 'neck', 'bodyweight', 'core', ['neck'], 'strength.calisthenics', {
    instructions: ['Sit or stand tall, eyes level.', 'Draw the chin straight back, as if making a double chin, without tilting.', 'Hold gently and breathe; you should feel a stretch, never a pinch.', 'Stop immediately if anything sharpens, tingles or refers down an arm.'], subMuscle: 'neck_flexors', trackingType: 'duration', met: 2, difficulty: 1, description: 'Draw the chin gently back and hold, activating the deep neck flexors in a low-load drill commonly used for posture and neck pain.',
  }),
  S('prone-neck-extension-plate', 'Prone Neck Extension (Plate)', 'neck', 'other', 'core', ['neck', 'back'], 'strength.band', {
    instructions: ['Lie face down on a bench with the head clear of the end.', 'Start with NO plate for the first few sessions; learn the range first.', 'Raise the head slowly until level, then lower under control.', 'Add a light plate on a towel only once the bodyweight version is easy.'], subMuscle: 'neck_extensors', trackingType: 'reps_weight', met: 3, difficulty: 3, description: 'Lie face down on a bench with the head off the end and a towel-wrapped plate on the back of the skull, then lift the head through a slow range to load the neck extensors.',
  }),
  S('supine-neck-flexion-plate', 'Supine Neck Flexion (Plate)', 'neck', 'other', 'core', ['neck'], 'strength.band', {
    instructions: ['Lie face up on a bench with the head clear of the end.', 'Start with NO plate; the neck needs less load than you think.', 'Tuck the chin and curl the head up slowly, then lower under control.', 'Never jerk, and stop at once if anything sharpens or refers down an arm.'], subMuscle: 'neck_flexors', trackingType: 'reps_weight', met: 3, difficulty: 3, description: 'Lie face up with the head off a bench and a towel-wrapped plate on the forehead, curling the chin toward the chest to load the neck flexors.',
  }),
  S('anderson-squat', 'Anderson Squat (Pin Squat)', 'quads', 'barbell', 'squat', ['quads', 'glutes', 'core'], 'strength.barbell', {
    trackingType: 'reps_weight', met: 5.5, difficulty: 4, description: 'Each rep starts from a dead stop with the bar resting on rack pins at squat depth, training pure concentric strength with no stretch reflex.',
  }),
  S('assisted-pistol-squat', 'Assisted Pistol Squat (Box)', 'quads', 'bodyweight', 'squat', ['quads', 'glutes', 'core'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 5, difficulty: 2, description: 'A single-leg squat sitting back to a box or holding a support, the standard way to build up to a free pistol squat.',
  }),
  S('band-terminal-knee-extension', 'Terminal Knee Extension (Band)', 'quads', 'other', 'squat', ['quads'], 'strength.band', {
    trackingType: 'reps_only', met: 3, difficulty: 1, description: 'A band pulls the back of the knee forward while you straighten the leg fully, a low-load rehab drill for the last few degrees of knee extension.',
  }),
  S('barbell-split-squat', 'Split Squat (Barbell)', 'quads', 'barbell', 'lunge', ['quads', 'glutes'], 'strength.barbell', {
    trackingType: 'reps_weight', met: 5, difficulty: 3, description: 'Feet fixed in a long stride with the bar on the back, lowering the rear knee toward the floor for heavy single-leg work without stepping.',
  }),
  S('belt-squat', 'Belt Squat (Machine)', 'quads', 'machine', 'squat', ['quads', 'glutes'], 'strength.machine', {
    trackingType: 'reps_weight', met: 5, difficulty: 2, description: 'Squatting with the load hanging from a hip belt instead of the shoulders, so the legs get worked with almost no spinal loading.',
  }),
  S('box-squat', 'Box Squat (Barbell)', 'quads', 'barbell', 'squat', ['quads', 'glutes', 'core'], 'strength.barbell', {
    trackingType: 'reps_weight', met: 5, difficulty: 3, description: 'Back squat to a box set at a fixed height, sitting back and pausing briefly to standardise depth and strengthen the bottom position.',
  }),
  S('broad-jump', 'Standing Broad Jump', 'quads', 'bodyweight', 'squat', ['quads', 'glutes', 'calves'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 8, difficulty: 3, description: 'A maximal two-footed jump forward for distance, landing under control — a simple test and trainer of horizontal leg power.',
  }),
  S('chair-squat', 'Chair Squat (Sit-to-Stand)', 'quads', 'bodyweight', 'squat', ['quads', 'glutes'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 3.5, difficulty: 1, description: 'Squatting down to touch a chair or bench and standing back up, the simplest way to learn the squat and build leg strength from zero.',
  }),
  S('cossack-squat', 'Cossack Squat', 'quads', 'bodyweight', 'squat', ['quads', 'glutes', 'hamstrings'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 4.5, difficulty: 3, description: 'From a very wide stance, sinking fully onto one bent leg with the other straight and toes up, building single-leg strength through a deep side range.',
  }),
  S('cyclist-squat', 'Cyclist Squat (Heel-Elevated)', 'quads', 'barbell', 'squat', ['quads', 'glutes'], 'strength.barbell', {
    trackingType: 'reps_weight', met: 5, difficulty: 3, description: 'Back squat with the heels raised on plates or a wedge and a narrow stance, shifting the work strongly onto the quads.',
  }),
  S('db-lateral-lunge', 'Lateral Lunge (Dumbbell)', 'quads', 'dumbbell', 'lunge', ['quads', 'glutes'], 'strength.dumbbell', {
    trackingType: 'reps_weight', met: 4.5, difficulty: 2, description: 'A wide step to the side, sitting into the stepping leg while the other stays straight, training the legs and adductors sideways.',
  }),
  S('depth-jump', 'Depth Jump', 'quads', 'bodyweight', 'squat', ['quads', 'glutes', 'calves'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 8.5, difficulty: 4, description: 'Stepping off a low box and rebounding into an immediate maximal jump on landing, an advanced plyometric for reactive strength that needs a strength base first.',
  }),
  S('jumping-lunge', 'Jumping Lunge', 'quads', 'bodyweight', 'lunge', ['quads', 'glutes', 'calves'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 8, difficulty: 3, description: 'Explosive lunges that switch legs in mid-air, training single-leg power and conditioning.',
  }),
  S('landmine-squat', 'Landmine Squat', 'quads', 'barbell', 'squat', ['quads', 'glutes', 'core'], 'strength.barbell', {
    trackingType: 'reps_weight', met: 5, difficulty: 2, description: 'Holding the end of a landmine-anchored barbell at the chest and squatting, with the arced bar path making an upright, deep squat easy to hit.',
  }),
  S('pause-squat', 'Pause Squat (Barbell)', 'quads', 'barbell', 'squat', ['quads', 'glutes', 'core'], 'strength.barbell', {
    trackingType: 'reps_weight', met: 5.5, difficulty: 3, description: 'Back squat held motionless for two to three seconds at the bottom before driving up, removing the bounce and building strength out of the hole.',
  }),
  S('pendulum-squat', 'Pendulum Squat (Machine)', 'quads', 'machine', 'squat', ['quads', 'glutes'], 'strength.machine', {
    trackingType: 'reps_weight', met: 5.5, difficulty: 3, description: 'A squat machine whose platform swings on an arc, keeping the torso upright and letting the knees travel through a deep, quad-heavy range.',
  }),
  S('reverse-nordic-curl', 'Reverse Nordic Curl', 'quads', 'bodyweight', 'squat', ['quads', 'core'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 5, difficulty: 4, description: 'Kneeling tall and leaning the whole body backward under control, loading the quads hard in a lengthened position with no equipment.',
  }),
  S('smith-machine-split-squat', 'Split Squat (Smith Machine)', 'quads', 'machine', 'lunge', ['quads', 'glutes'], 'strength.machine', {
    trackingType: 'reps_weight', met: 5.5, difficulty: 4, description: 'A loaded single-leg squat under a fixed bar path, which removes the balance problem so the working leg can be taken to genuine failure.',
  }),
  S('spanish-squat', 'Spanish Squat (Band)', 'quads', 'other', 'squat', ['quads'], 'strength.band', {
    trackingType: 'reps_only', met: 4, difficulty: 2, description: 'Squatting while a heavy band loops behind the knees and anchors in front, keeping the shins vertical and loading the quads and patellar tendon.',
  }),
  S('wall-facing-squat', 'Wall-Facing Squat', 'quads', 'bodyweight', 'squat', ['quads', 'glutes', 'core'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 4, difficulty: 3, description: 'Squatting with the toes a few inches from a wall so any forward lean is blocked, a self-correcting drill for upright squat technique and ankle mobility.',
  }),
  S('advanced-tuck-planche', 'Advanced Tuck Planche', 'shoulders', 'bodyweight', 'core', ['shoulders', 'core', 'chest'], 'strength.calisthenics', {
    subMuscle: 'front_delt', trackingType: 'duration', met: 5.5, difficulty: 4, description: 'A planche hold with the knees tucked, the back flat and the hips level with the shoulders, the step above the tuck planche.',
  }),
  S('crow-pose', 'Crow Pose', 'shoulders', 'bodyweight', 'core', ['shoulders', 'core', 'forearms'], 'strength.calisthenics', {
    subMuscle: 'front_delt', trackingType: 'duration', met: 4, difficulty: 3, description: 'A hand balance with the knees resting on the upper arms, the usual first step into supporting your bodyweight on your hands.',
  }),
  S('elevated-pike-push-up', 'Elevated Pike Push-Up', 'shoulders', 'bodyweight', 'vertical_push', ['shoulders', 'triceps'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 5.5, difficulty: 3, description: 'A pike push-up with the feet on a box, steepening the angle so the shoulders carry more of your bodyweight.',
  }),
  S('full-planche', 'Full Planche', 'shoulders', 'bodyweight', 'core', ['shoulders', 'core', 'chest'], 'strength.calisthenics', {
    subMuscle: 'front_delt', trackingType: 'duration', met: 6, difficulty: 5, description: 'A straight-arm hold with the whole body horizontal and only the hands on the floor, one of the hardest straight-arm strength skills.',
  }),
  S('german-hang', 'German Hang', 'shoulders', 'bodyweight', 'core', ['shoulders', 'chest', 'back'], 'strength.calisthenics', {
    subMuscle: 'front_delt', trackingType: 'duration', met: 3, difficulty: 3, description: 'A straight-arm hang behind the body from rings or a bar, building shoulder extension strength and tolerance for lever work.',
  }),
  S('handstand-wall-walk', 'Handstand Wall Walk', 'shoulders', 'bodyweight', 'core', ['shoulders', 'core', 'triceps'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 5, difficulty: 3, description: 'Walk the feet up a wall from a plank while the hands step in toward it, building the handstand line and shoulder endurance.',
  }),
  S('straddle-planche', 'Straddle Planche', 'shoulders', 'bodyweight', 'core', ['shoulders', 'core', 'chest'], 'strength.calisthenics', {
    subMuscle: 'front_delt', trackingType: 'duration', met: 6, difficulty: 5, description: 'A planche hold with the legs split wide to shorten the lever, the final progression before the full planche.',
  }),
  S('wall-handstand-shoulder-tap', 'Wall Handstand Shoulder Tap', 'shoulders', 'bodyweight', 'core', ['shoulders', 'core'], 'strength.calisthenics', {
    subMuscle: 'front_delt', trackingType: 'reps_only', met: 5, difficulty: 4, description: 'Lift one hand to tap the opposite shoulder while holding a chest-to-wall handstand, training the single-arm loading needed to balance free.',
  }),
  S('bodyweight-triceps-extension-bar', 'Bodyweight Triceps Extension (Bar)', 'triceps', 'bodyweight', 'triceps_extension', ['triceps', 'core'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 5, difficulty: 3, description: 'A triceps extension against bodyweight performed under a fixed bar or Smith machine, lowering the head under the bar and extending the elbows to press back up.',
  }),
  S('cable-overhead-rope-extension-single', 'Single-Arm Overhead Cable Extension', 'triceps', 'cable', 'triceps_extension', ['triceps'], 'strength.cable', {
    trackingType: 'reps_weight', met: 3.5, difficulty: 2, description: 'A one-armed extension with the elbow held overhead against a low pulley, training the long head of the triceps in a stretched position one side at a time.',
  }),
  S('california-press', 'California Press (Barbell)', 'triceps', 'barbell', 'triceps_extension', ['triceps', 'chest'], 'strength.barbell', {
    trackingType: 'reps_weight', met: 5, difficulty: 4, description: 'A bench movement combining a skullcrusher lowering with a close-grip press back to lockout, letting the triceps be trained with more load than a strict extension.',
  }),
  S('negative-dip', 'Negative Dip', 'triceps', 'bodyweight', 'horizontal_push', ['triceps', 'chest', 'shoulders'], 'strength.calisthenics', {
    trackingType: 'reps_only', met: 5, difficulty: 2, description: 'Start at the top of a dip and lower slowly under control, building the strength needed to press back up unassisted.',
  }),
  S('parallel-bar-support-hold', 'Parallel Bar Support Hold', 'triceps', 'bodyweight', 'core', ['triceps', 'shoulders', 'core'], 'strength.calisthenics', {
    trackingType: 'duration', met: 3, difficulty: 1, description: 'A locked-out hold at the top of the dip position on parallel bars, the first step in any dip progression.',
  }),
  S('reverse-grip-cable-pushdown', 'Reverse-Grip Cable Pushdown', 'triceps', 'cable', 'triceps_extension', ['triceps'], 'strength.cable', {
    trackingType: 'reps_weight', met: 3.5, difficulty: 2, description: 'A pushdown taken with an underhand grip on a straight bar, which emphasises the medial head of the triceps.',
  }),
  S('ring-skullcrusher', 'Ring Skullcrusher', 'triceps', 'other', 'triceps_extension', ['triceps', 'core'], 'strength.band', {
    trackingType: 'reps_only', met: 5.5, difficulty: 4, description: 'A bodyweight extension on gymnastic rings where the body is lowered by bending the elbows and driven back to a plank, demanding triceps strength plus shoulder stability.',
  }),
  S('rolling-dumbbell-extension', 'Rolling Dumbbell Extension', 'triceps', 'dumbbell', 'triceps_extension', ['triceps'], 'strength.dumbbell', {
    trackingType: 'reps_weight', met: 4.5, difficulty: 3, description: 'A lying extension in which the dumbbells are rolled back past the head before being pressed up, adding a stretch under load and easing stress on the elbows.',
  }),
  S('triceps-dip-machine', 'Triceps Dip Machine', 'triceps', 'machine', 'triceps_extension', ['triceps', 'chest'], 'strength.machine', {
    trackingType: 'reps_weight', met: 4, difficulty: 1, description: 'A seated machine that mimics the dip with a selectable load, letting the triceps be trained heavily by lifters who cannot yet dip their bodyweight.',
  }),
  S('weighted-dip-triceps', 'Weighted Parallel Bar Dip', 'triceps', 'bodyweight', 'triceps_extension', ['triceps', 'chest'], 'strength.calisthenics', {
    trackingType: 'reps_weight', met: 6, difficulty: 4, description: 'A parallel-bar dip performed upright with added load on a belt, one of the heaviest ways to train the triceps through a full range.',
  }),
];

/**
 * The seeded library, with explicit sub-muscle tags merged in for the exercises
 * whose literal above doesn't already carry one — so every taxonomied exercise
 * ships a pinned `subMuscle` (see src/data/subMuscleTags.ts) rather than relying
 * on runtime inference. Literals that already declare a sub-muscle win.
 */
export const EXERCISE_LIBRARY: SeedExercise[] = RAW_EXERCISE_LIBRARY.map((e) => {
  const withTag =
    !e.subMuscle && e.slug && SUB_MUSCLE_TAGS[e.slug]
      ? { ...e, subMuscle: SUB_MUSCLE_TAGS[e.slug] }
      : e;
  /*
   * Difficulty is resolved once, here, so every consumer reads a number rather
   * than re-deriving one — and so a new exercise cannot ship without one. An
   * authored value wins; otherwise a named skill; otherwise the equipment and
   * pattern decide (see lib/exerciseDifficulty).
   */
  return { ...withTag, difficulty: difficultyOf(withTag) };
});

/**
 * The difficulty of a slug, for callers that hold slugs rather than exercises
 * — prefill lists, saved routines, split days.
 */
const DIFFICULTY_BY_SLUG: ReadonlyMap<string, Difficulty> = new Map(
  EXERCISE_LIBRARY.filter((e) => e.slug && e.difficulty).map((e) => [e.slug!, e.difficulty!])
);

export function difficultyBySlug(slug: string): Difficulty | null {
  return DIFFICULTY_BY_SLUG.get(slug) ?? null;
}

/** Suggested duration (minutes) for the prayer meditation exercises. */
export const PRAYER_EXERCISE_MINUTES: Record<string, number> = {
  'prayer-fajr': 10,
  'prayer-dhuhr': 12,
  'prayer-asr': 8,
  'prayer-maghrib': 8,
  'prayer-isha': 14,
};

/**
 * Sub-muscle backfill for entries defined before v2 introduced `subMuscle`.
 * Applied in-place so every exercise sorts under its individual muscle.
 */
const SUB_BY_SLUG: Record<string, string> = {
  // Back
  'pull-up': 'lats', 'pull-up-wide': 'lats', 'pull-up-neutral': 'lats', 'chin-up': 'lats',
  'lat-pulldown': 'lats', 'lat-pulldown-close': 'lats', 'lat-pulldown-reverse': 'lats',
  'straight-arm-pulldown': 'lats', 'assisted-pull-up': 'lats', 'muscle-up': 'lats',
  'barbell-row': 'mid_back', 'pendlay-row': 'mid_back', 't-bar-row': 'mid_back', 'yates-row': 'mid_back',
  'db-one-arm-row': 'mid_back', 'db-chest-supported-row': 'mid_back', 'renegade-row': 'mid_back',
  'kroc-row': 'mid_back', 'seated-cable-row': 'mid_back', 'machine-row': 'mid_back',
  'inverted-row': 'mid_back', 'band-pull-apart': 'mid_back',
  deadlift: 'lower_back', 'sumo-deadlift': 'lower_back', 'rack-pull': 'lower_back',
  'good-morning': 'lower_back', 'superman-hold': 'lower_back',
  // Shoulders
  'overhead-press': 'front_delt', 'push-press': 'front_delt', 'db-shoulder-press': 'front_delt',
  'arnold-press': 'front_delt', 'front-raise': 'front_delt', 'machine-shoulder-press': 'front_delt',
  'db-single-arm-shoulder-press': 'front_delt', 'pike-push-up': 'front_delt', 'handstand-push-up': 'front_delt',
  'lateral-raise': 'side_delt', 'cable-lateral-raise': 'side_delt', 'upright-row': 'side_delt',
  'rear-delt-fly': 'rear_delt', 'cable-rear-delt-fly': 'rear_delt', 'reverse-pec-deck': 'rear_delt',
  'y-raise': 'rear_delt',
  // Core
  crunch: 'upper_abs', 'weighted-sit-up': 'upper_abs', 'cable-crunch': 'upper_abs',
  'ab-crunch-machine': 'upper_abs', 'v-up': 'upper_abs', 'barbell-rollout': 'upper_abs',
  'hollow-body-hold': 'upper_abs',
  'hanging-leg-raise': 'lower_abs',
  'side-plank': 'obliques', 'bicycle-crunch': 'obliques', 'russian-twist': 'obliques',
  'db-side-bend': 'obliques', 'cable-woodchopper': 'obliques', 'landmine-rotation': 'obliques',
  'landmine-anti-rotation-press': 'obliques',
  // Neck
  'neck-bridge': 'neck_extensors',
};

for (const e of EXERCISE_LIBRARY) {
  if (!e.subMuscle && SUB_BY_SLUG[e.slug]) e.subMuscle = SUB_BY_SLUG[e.slug];
}

/** Muscle groups used for library filtering. */
export const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads',
  'hamstrings', 'glutes', 'calves', 'core', 'forearms', 'neck',
] as const;

export const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps', triceps: 'Triceps',
  quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves',
  core: 'Core / Abs', forearms: 'Forearms', neck: 'Neck', cardio: 'Cardio', mobility: 'Mobility', mind: 'Mind',
};

/**
 * Slugs that are duplicates of another entry — hidden from the library browser
 * (the primary shows instead) but kept seeded so every old log still resolves.
 */
export const ALIAS_SLUGS: ReadonlySet<string> = new Set(
  EXERCISE_LIBRARY.filter((e) => e.aliasOf).map((e) => e.slug)
);

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell', dumbbell: 'Dumbbell', machine: 'Machine', cable: 'Cable',
  bodyweight: 'Bodyweight', other: 'Other',
};
