import type {
  EquipmentType,
  MovementPattern,
  SessionType,
  TrackingType,
} from '@/db/schema';

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
  Pick<SeedExercise, 'equipment' | 'description' | 'instructions' | 'trackingType' | 'met' | 'sessionType' | 'subMuscle'>
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
  };
}

const BB = 'strength.barbell';
const DB_ = 'strength.dumbbell';
const MC = 'strength.machine';
const CB = 'strength.cable';
const BW = 'strength.calisthenics';

export const EXERCISE_LIBRARY: SeedExercise[] = [
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
  }),
  S('push-up-incline', 'Incline Push-Up', 'chest', 'bodyweight', 'horizontal_push', ['chest', 'triceps'], BW, {
    trackingType: 'reps_only', met: 3.5,
    description: 'Hands elevated on a bench — the easiest push-up. Start here if a full push-up is too hard.',
  }),
  S('push-up-decline', 'Decline Push-Up', 'chest', 'bodyweight', 'horizontal_push', ['chest', 'shoulders'], BW, {
    trackingType: 'reps_only', met: 5, description: 'Feet elevated — harder, upper-chest bias.',
  }),
  S('push-up-archer', 'Archer Push-Up', 'chest', 'bodyweight', 'horizontal_push', ['chest', 'triceps'], BW, {
    trackingType: 'reps_only', met: 6, description: 'Shifting onto one arm — a step toward the one-arm push-up.',
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
  S('cable-glute-kickback', 'Cable Kickback', 'glutes', 'cable', 'hinge', ['glutes'], CB, { met: 4 }),
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

  // ══════════════════════════ MEDITATION ══════════════════════════
  { slug: 'guided-meditation', name: 'Guided Meditation', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.meditation', met: 1.3 },
  { slug: 'breathwork', name: 'Breathwork', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.breath', met: 1.3 },
  { slug: 'body-scan', name: 'Body Scan', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.meditation', met: 1 },
  { slug: 'unguided-sit', name: 'Unguided Sit', category: 'meditation', sessionType: 'meditation', muscleGroups: ['mind'], primaryMuscle: 'mind', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.meditation', met: 1 },
];

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
};

for (const e of EXERCISE_LIBRARY) {
  if (!e.subMuscle && SUB_BY_SLUG[e.slug]) e.subMuscle = SUB_BY_SLUG[e.slug];
}

/** Muscle groups used for library filtering. */
export const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads',
  'hamstrings', 'glutes', 'calves', 'core', 'forearms',
] as const;

export const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps', triceps: 'Triceps',
  quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves',
  core: 'Core / Abs', forearms: 'Forearms', cardio: 'Cardio', mobility: 'Mobility', mind: 'Mind',
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell', dumbbell: 'Dumbbell', machine: 'Machine', cable: 'Cable',
  bodyweight: 'Bodyweight', other: 'Other',
};
