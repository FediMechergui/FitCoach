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
  { slug: 'ma-sprawl-drill', name: 'Sprawl Drill', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['core', 'legs'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'reps_only', icon: 'martial.defense', met: 9, description: 'Hips down and back to defend the shot, then back to stance. Counted as reps.' },
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
  { slug: 'ma-speed-bag', name: 'Speed Bag', category: 'martial arts', sessionType: 'martial_arts', muscleGroups: ['shoulders'], primaryMuscle: 'cardio', pattern: 'cardio', trackingType: 'duration', icon: 'martial.bag', met: 6, description: 'Rhythm and shoulder endurance.' },
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
  { slug: 'incline-pushup', name: 'Incline Push-Up', category: 'tactical', sessionType: 'calisthenics', muscleGroups: ['chest', 'triceps'], primaryMuscle: 'chest', pattern: 'horizontal_push', trackingType: 'reps_only', icon: 'strength.push', met: 4, description: 'Hands on a desk, chair or wall — the scalable push-up for the office or a fresh start.' },
  { slug: 'chair-dip', name: 'Chair / Bench Dip', category: 'tactical', sessionType: 'calisthenics', muscleGroups: ['triceps', 'chest'], primaryMuscle: 'triceps', pattern: 'horizontal_push', trackingType: 'reps_only', icon: 'strength.calisthenics', met: 4, description: 'Triceps from a chair edge — no equipment, works anywhere.' },
  { slug: 'desk-mobility-flow', name: 'Deskside Mobility Flow', category: 'tactical', sessionType: 'mindbody', muscleGroups: ['full body'], primaryMuscle: 'mobility', pattern: 'mobility', trackingType: 'duration', icon: 'mindbody.stretch', met: 2.3, description: 'A standing reset for hips, spine and shoulders you can run beside a desk in a few minutes.' },
  { slug: 'step-ups', name: 'Step-Ups', category: 'tactical', sessionType: 'calisthenics', muscleGroups: ['quads', 'glutes'], primaryMuscle: 'quads', pattern: 'squat', trackingType: 'reps_only', icon: 'cardio.treadmill', met: 6, description: 'Onto a chair, box or bench — single-leg strength anywhere, loaded or not.' },
  { slug: 'one-arm-pushup', name: 'One-Arm Push-Up', category: 'tactical', sessionType: 'calisthenics', muscleGroups: ['chest', 'triceps', 'core'], primaryMuscle: 'chest', pattern: 'horizontal_push', trackingType: 'reps_only', icon: 'strength.push', met: 8, description: 'The Rocky classic — feet wide, one hand behind the back, brutal on the chest and obliques.', instructions: ['Earn it: press a heavy regular push-up cleanly first, then a slow archer push-up.', 'Feet wide for balance, spare arm behind the back, brace hard against rotating.', 'Lower under control; never let the shoulder collapse.'] },
  { slug: 'speed-bag', name: 'Speed Bag', category: 'tactical', sessionType: 'martial_arts', muscleGroups: ['shoulders', 'forearms'], primaryMuscle: 'shoulders', pattern: 'cardio', trackingType: 'duration', icon: 'martial.gloves', met: 6, description: 'Rhythm, shoulder endurance and hand speed — the boxer’s meditation.' },
];

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
