import type { SessionType } from '@/db/schema';

/**
 * PROGRAMS — pre-programmed weekly plans for every kind of training, the same
 * way `SPLITS` organises a lifting week.
 *
 * A split answers "which muscles today". A program answers the bigger question:
 * what does a whole week of this activity look like, and what is each day *for*?
 * Every day pre-fills its session with real exercises (by slug), so picking a
 * day is one tap from training.
 *
 * ⚠️ `key` and `days[].key` are stable identifiers — a session is tagged with
 * `program:day` in its `style` column so progress stays comparable. Never
 * change or reuse one; adding is always safe.
 */

export type ProgramLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ProgramDay {
  key: string;
  label: string;
  /** what this day is for — the reason it exists in the week */
  purpose: string;
  /** exercise slugs, in the order they should be performed */
  exercises: string[];
  /** the prescription in plain words (sets, rounds, time) */
  prescription: string;
  minutes: number;
  /** optional method key from trainingMethods.ts this day follows */
  method?: string;
}

export interface TrainingProgram {
  key: string;
  sessionType: SessionType;
  name: string;
  blurb: string;
  level: ProgramLevel;
  daysPerWeek: number;
  /** how long to run it before changing something */
  blockWeeks: number;
  bestFor: string;
  /** what actually tells you it's working */
  progressMarker: string;
  icon: string;
  days: ProgramDay[];
}

export const LEVEL_LABEL: Record<ProgramLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const PROGRAMS: TrainingProgram[] = [
  // ══════════════════════════ CALISTHENICS ══════════════════════════
  {
    key: 'cal-foundations',
    sessionType: 'calisthenics',
    name: 'Bodyweight Foundations',
    blurb: 'Three full-body days built on the six basic patterns. If you cannot yet do a pull-up or a full push-up, this is where to start.',
    level: 'beginner',
    daysPerWeek: 3,
    blockWeeks: 8,
    bestFor: 'Your first months of bodyweight training, or coming back after a long break',
    progressMarker: 'Reps at each progression — when a movement hits 3×12 clean, you move to the harder version.',
    icon: 'strength.calisthenics',
    days: [
      {
        key: 'a', label: 'Day A — Push focus',
        purpose: 'Pressing strength and the core that holds a straight line under it.',
        exercises: ['push-up', 'pike-push-up', 'dip', 'plank', 'bodyweight-squat'],
        prescription: '3 sets each · 8–12 reps (planks 30–45 s) · 90 s rest',
        minutes: 40, method: 'cal-progression',
      },
      {
        key: 'b', label: 'Day B — Pull focus',
        purpose: 'The half almost everyone neglects — vertical and horizontal pulling.',
        exercises: ['assisted-pull-up', 'inverted-row', 'chin-up', 'hollow-body-hold', 'glute-bridge'],
        prescription: '3 sets each · 5–10 reps · 2 min rest on the pulls',
        minutes: 40, method: 'cal-progression',
      },
      {
        key: 'c', label: 'Day C — Legs & core',
        purpose: 'Single-leg strength and trunk control, the base for everything athletic.',
        exercises: ['bodyweight-squat', 'bulgarian-split-squat', 'nordic-curl', 'calf-raise-step', 'side-plank', 'hanging-leg-raise'],
        prescription: '3 sets each · 10–15 reps per side · 60–90 s rest',
        minutes: 40,
      },
    ],
  },
  {
    key: 'cal-skill-strength',
    sessionType: 'calisthenics',
    name: 'Skill & Strength',
    blurb: 'Four days pairing a skill practised fresh with the strength work that unlocks it. Handstands, levers, muscle-ups.',
    level: 'advanced',
    daysPerWeek: 4,
    blockWeeks: 12,
    bestFor: 'Solid basics already (10+ pull-ups, 20+ push-ups, a 60 s plank)',
    progressMarker: 'Hold time on the skill and reps on the strength lift. Skill first, always — practise it fresh or you are just training fatigue.',
    icon: 'strength.pullup',
    days: [
      {
        key: 'hs', label: 'Handstand & Press',
        purpose: 'Overhead skill practised unfatigued, then vertical pressing strength.',
        exercises: ['handstand-hold', 'pike-push-up', 'handstand-push-up', 'dip', 'hollow-body-hold'],
        prescription: 'Skill 15 min short holds w/ full rest · then 4×5–8 on the presses',
        minutes: 55, method: 'cal-skill',
      },
      {
        key: 'lever', label: 'Lever & Pull',
        purpose: 'Straight-arm strength plus heavy bent-arm pulling.',
        exercises: ['front-lever-hold', 'l-sit', 'pull-up-wide', 'inverted-row', 'hanging-leg-raise'],
        prescription: 'Skill 15 min · then 5×3–6 weighted or hard-progression pulls',
        minutes: 55, method: 'cal-skill',
      },
      {
        key: 'mu', label: 'Muscle-Up & Explosive',
        purpose: 'Transition power — the gap between a pull-up and a dip.',
        exercises: ['muscle-up', 'pull-up', 'dip', 'push-up-explosive', 'box-jumps'],
        prescription: '6–8 low-rep explosive sets, full rest. Stop when speed drops.',
        minutes: 50, method: 'cal-tempo',
      },
      {
        key: 'legs', label: 'Legs & Conditioning',
        purpose: 'Single-leg strength then a short conditioning finisher.',
        exercises: ['pistol-squat', 'bulgarian-split-squat', 'nordic-curl', 'calf-raise-step', 'burpees'],
        prescription: '4×6–10 per side · finish with 10 min EMOM burpees',
        minutes: 50, method: 'cal-emom',
      },
    ],
  },
  {
    key: 'cal-minimalist',
    sessionType: 'calisthenics',
    name: 'No-Equipment Minimalist',
    blurb: 'Two movements a day, done anywhere, no bar needed. Built for travel, small flats and busy weeks.',
    level: 'beginner',
    daysPerWeek: 5,
    blockWeeks: 6,
    bestFor: 'Weeks where the gym is not happening and something beats nothing',
    progressMarker: 'Total daily reps. Frequency does the work here, not intensity.',
    icon: 'core.timer',
    days: [
      { key: 'push', label: 'Push day', purpose: 'Chest, shoulders, triceps — no equipment at all.', exercises: ['push-up', 'pike-push-up'], prescription: 'Ladder 1-2-3-4-5 and back down · 2 rounds', minutes: 15, method: 'cal-ladder' },
      { key: 'squat', label: 'Squat day', purpose: 'Legs and knee health.', exercises: ['bodyweight-squat', 'bulgarian-split-squat'], prescription: '5 sets × 15–20 reps · 60 s rest', minutes: 15 },
      { key: 'core', label: 'Core day', purpose: 'Trunk stiffness front and side.', exercises: ['plank', 'side-plank', 'hollow-body-hold'], prescription: '4 rounds × 30–45 s each', minutes: 12 },
      { key: 'hinge', label: 'Hinge day', purpose: 'Posterior chain without a barbell.', exercises: ['glute-bridge', 'nordic-curl', 'superman-hold'], prescription: '4 sets × 10–15 reps', minutes: 15 },
      { key: 'cond', label: 'Conditioning day', purpose: 'Get the heart rate up with zero kit.', exercises: ['burpees', 'mountain-climbers', 'jumping-jacks'], prescription: '5 rounds × 40 s work / 20 s rest', minutes: 20, method: 'cal-circuit' },
    ],
  },

  // ══════════════════════════ CARDIO ══════════════════════════
  {
    key: 'car-base',
    sessionType: 'cardio',
    name: 'Aerobic Base Builder',
    blurb: 'Mostly easy, one hard day. The polarised model every endurance coach actually uses — and the one most people get wrong by training everything in the middle.',
    level: 'beginner',
    daysPerWeek: 4,
    blockWeeks: 8,
    bestFor: 'Building real aerobic fitness, resting heart rate and fat oxidation',
    progressMarker: 'More distance at the SAME heart rate. That single number is aerobic fitness.',
    icon: 'cardio.treadmill',
    days: [
      { key: 'z2a', label: 'Zone 2 — long', purpose: 'The session that actually builds the aerobic engine. Easy enough to hold a conversation.', exercises: ['stationary-bike', 'incline-walk'], prescription: '45–60 min conversational · never above the cap', minutes: 55, method: 'car-zone2' },
      { key: 'z2b', label: 'Zone 2 — short', purpose: 'Same again, shorter. Volume is what matters.', exercises: ['elliptical', 'rowing-machine'], prescription: '30–40 min easy', minutes: 35, method: 'car-zone2' },
      { key: 'hard', label: 'Intervals — the one hard day', purpose: 'The single quality session. One is enough at this stage.', exercises: ['treadmill-intervals', 'bike-intervals'], prescription: '5–6 × 3 min hard / 3 min easy', minutes: 40, method: 'car-intervals' },
      { key: 'rec', label: 'Recovery spin', purpose: 'Blood flow, not training. Going hard here is the classic mistake.', exercises: ['recumbent-bike'], prescription: '25 min very easy', minutes: 25, method: 'car-recovery' },
    ],
  },
  {
    key: 'car-machines',
    sessionType: 'cardio',
    name: 'Gym Machine Rotation',
    blurb: 'A different machine every day so nothing gets stale and no single joint takes all the load.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 6,
    bestFor: 'Gym cardio that you will actually keep doing',
    progressMarker: 'Level/resistance at the same duration — logged per machine, so each one has its own trend.',
    icon: 'cardio.elliptical',
    days: [
      { key: 'stairs', label: 'Stair machine', purpose: 'Highest burn per minute of any low-impact machine — glutes do most of it.', exercises: ['stairmaster'], prescription: '25–35 min steady, hands off the rails', minutes: 30, method: 'car-stairs' },
      { key: 'bike', label: 'Bike intervals', purpose: 'Hard efforts with no impact cost at all.', exercises: ['spin-bike', 'assault-bike'], prescription: '8 × 1 min hard / 2 min easy', minutes: 35, method: 'car-bike-sprints' },
      { key: 'tread', label: 'Treadmill hills', purpose: 'Running stimulus at a lower impact per kilometre.', exercises: ['treadmill-hill', 'incline-walk'], prescription: '30 min at 6–10% incline', minutes: 30 },
      { key: 'row', label: 'Rower & ski erg', purpose: 'The only common machines that make the upper back work.', exercises: ['rowing-intervals', 'ski-erg'], prescription: '6 × 500 m with 2 min rest', minutes: 35, method: 'car-intervals' },
      { key: 'mix', label: 'Machine circuit', purpose: 'Everything, briefly. Good for a low-motivation day.', exercises: ['rowing-machine', 'stationary-bike', 'stairmaster', 'elliptical'], prescription: '4 machines × 8 min, no rest between', minutes: 35, method: 'car-machine-circuit' },
    ],
  },
  {
    key: 'car-fatloss',
    sessionType: 'cardio',
    name: 'Fat-Loss Conditioning',
    blurb: 'Built to add burn without wrecking recovery, so your lifting does not suffer while you are in a deficit.',
    level: 'intermediate',
    daysPerWeek: 4,
    blockWeeks: 8,
    bestFor: 'Cutting, alongside lifting — protecting muscle while the deficit does the work',
    progressMarker: 'Work completed at a stable heart rate while weight drops. If output falls with weight, the deficit is too steep.',
    icon: 'cardio.plyo',
    days: [
      { key: 'liss1', label: 'LISS walk', purpose: 'Almost free calories — barely any recovery cost, so it never competes with lifting.', exercises: ['incline-walk'], prescription: '45–60 min brisk walk, 5–8% incline', minutes: 50, method: 'car-liss' },
      { key: 'hiit', label: 'HIIT', purpose: 'Maximum stimulus per minute on the day you have least time.', exercises: ['assault-bike', 'jump-rope-basic'], prescription: '8 rounds × 20 s all-out / 10 s rest × 2 blocks', minutes: 25, method: 'car-tabata' },
      { key: 'circuit', label: 'Bodyweight circuit', purpose: 'Full-body conditioning with zero equipment.', exercises: ['burpees', 'mountain-climbers', 'jumping-jacks', 'high-knees', 'box-step-ups-cardio'], prescription: '5 rounds × 40 s / 20 s', minutes: 30, method: 'car-conditioning' },
      { key: 'liss2', label: 'LISS — second walk', purpose: 'More steps, still no recovery cost.', exercises: ['incline-walk', 'stationary-march'], prescription: '40 min easy', minutes: 40, method: 'car-liss' },
    ],
  },
  {
    key: 'car-rope',
    sessionType: 'cardio',
    name: 'Jump Rope Progression',
    blurb: 'From the first unbroken minute to double-unders. A skill first, conditioning second — which is exactly why it keeps being interesting.',
    level: 'beginner',
    daysPerWeek: 3,
    blockWeeks: 8,
    bestFor: 'Cheap, portable conditioning with a real skill ceiling',
    progressMarker: 'Unbroken time, then unbroken double-unders. Both are counted, not guessed.',
    icon: 'cardio.jumpRope',
    days: [
      { key: 'base', label: 'Base rounds', purpose: 'Build the unbroken minute, then the unbroken three.', exercises: ['jump-rope-basic', 'jump-rope-alternate'], prescription: '8 rounds × 1–3 min · 30 s rest', minutes: 25, method: 'car-rope' },
      { key: 'skill', label: 'Skill day', purpose: 'Crossovers and double-unders practised while fresh.', exercises: ['jump-rope-crossovers', 'jump-rope-double-unders'], prescription: '15 min skill in short sets · then 5 easy rounds', minutes: 30, method: 'car-rope' },
      { key: 'cond', label: 'Conditioning day', purpose: 'Rope as pure conditioning, mixed with bodyweight work.', exercises: ['jump-rope-high-knees', 'burpees', 'mountain-climbers'], prescription: '6 rounds: 90 s rope / 30 s bodyweight', minutes: 30, method: 'car-conditioning' },
    ],
  },

  // ══════════════════════════ MARTIAL ARTS ══════════════════════════
  {
    key: 'ma-striking-fundamentals',
    sessionType: 'martial_arts',
    name: 'Striking Fundamentals',
    blurb: 'A complete beginner striking week: stance and footwork before power, defence before offence, bag work last.',
    level: 'beginner',
    daysPerWeek: 3,
    blockWeeks: 12,
    bestFor: 'Your first year of boxing, kickboxing or Muay Thai',
    progressMarker: 'Rounds completed with technique intact. Technique under fatigue is the whole skill — not how hard you hit fresh.',
    icon: 'martial.gloves',
    days: [
      {
        key: 'foot', label: 'Stance & Footwork',
        purpose: 'Position is what makes a punch land and a punch miss. It comes first for a reason.',
        exercises: ['ma-skipping', 'ma-footwork-drill', 'ma-shadow-round'],
        prescription: 'Rope 3×3 min · footwork 4×3 min · shadow 3×3 min',
        minutes: 45, method: 'ma-footwork',
      },
      {
        key: 'strike', label: 'Basic Strikes',
        purpose: 'Jab, cross, hook, uppercut and the teep — drilled by number until automatic.',
        exercises: ['ma-jab-cross', 'ma-combination-drill', 'ma-bag-round'],
        prescription: 'Drill 4×3 min · bag 5×3 min · 1 min rest',
        minutes: 50, method: 'ma-bag',
      },
      {
        key: 'def', label: 'Defence',
        purpose: 'Slipping, rolling, parrying. Learned late, this is what caps most people.',
        exercises: ['ma-defense-drill', 'ma-counter-drill', 'ma-double-end-bag'],
        prescription: 'Defence 5×3 min · counters 4×3 min · double-end 3×3 min',
        minutes: 50, method: 'ma-defense',
      },
    ],
  },
  {
    key: 'ma-fight-camp',
    sessionType: 'martial_arts',
    name: 'Fight Camp',
    blurb: 'Six days at competition load: sparring twice, hard conditioning twice, technical work between. This is a peak, not a lifestyle — run it for a camp and then back off.',
    level: 'advanced',
    daysPerWeek: 6,
    blockWeeks: 8,
    bestFor: 'Preparing for a fight or grading, with a coach',
    progressMarker: 'Round output late in a session, and how fast heart rate drops between rounds.',
    icon: 'martial.spar',
    days: [
      { key: 'spar1', label: 'Sparring — hard', purpose: 'The session everything else supports.', exercises: ['ma-sparring-round', 'ma-shadow-round'], prescription: '6–8 × 3 min sparring · 1 min rest · shadow to cool down', minutes: 60, method: 'ma-sparring' },
      { key: 'tech1', label: 'Technical drilling', purpose: 'Fix what sparring exposed, at low intensity.', exercises: ['ma-combination-drill', 'ma-mitt-work', 'ma-defense-drill'], prescription: '8×3 min pads & drills at 60%', minutes: 50, method: 'ma-drilling' },
      { key: 'cond', label: 'Fight conditioning', purpose: 'Round-shaped conditioning — 3 min on, 1 min off, like the sport.', exercises: ['ma-fight-conditioning', 'ma-skipping', 'burpees'], prescription: '10 rounds × 3 min work / 1 min rest', minutes: 45, method: 'ma-conditioning' },
      { key: 'clinch', label: 'Clinch & takedowns', purpose: 'The phase most strikers lose and most grapplers win.', exercises: ['ma-clinch-work', 'ma-takedown-entries', 'ma-sprawl-drill'], prescription: '8×3 min clinch rounds', minutes: 50, method: 'ma-clinch' },
      { key: 'spar2', label: 'Sparring — technical', purpose: 'Live but light, working assignments rather than winning.', exercises: ['ma-technical-sparring', 'ma-positional-sparring'], prescription: '6×3 min at 50–60%', minutes: 45, method: 'ma-positional' },
      { key: 'solo', label: 'Solo / recovery', purpose: 'Keep the skill warm without adding damage.', exercises: ['ma-shadow-round', 'ma-forms-kata', 'ma-skipping'], prescription: '30 min easy, technique only', minutes: 30, method: 'ma-solo' },
    ],
  },
  {
    key: 'ma-grappling',
    sessionType: 'martial_arts',
    name: 'Grappling Foundations',
    blurb: 'BJJ, judo or wrestling structured around positions rather than submissions — escapes first, because you cannot attack from under someone.',
    level: 'beginner',
    daysPerWeek: 3,
    blockWeeks: 12,
    bestFor: 'Your first year on the mats',
    progressMarker: 'Time surviving and escaping bad positions in positional rounds. Submissions follow position, never the reverse.',
    icon: 'martial.grapple',
    days: [
      { key: 'move', label: 'Movement & escapes', purpose: 'Shrimping, bridging and getting out. The least glamorous and most important day.', exercises: ['ma-shrimping', 'ma-bridging', 'ma-escape-drill'], prescription: '20 min movement · 6×3 min escape rounds', minutes: 45, method: 'ma-drilling' },
      { key: 'guard', label: 'Guard work', purpose: 'Keeping guard and passing it — both sides of the same skill.', exercises: ['ma-guard-retention', 'ma-guard-passing', 'ma-positional-sparring'], prescription: 'Drill 20 min · positional rounds 6×4 min', minutes: 55, method: 'ma-positional' },
      { key: 'live', label: 'Live rolling', purpose: 'Put it together at a pace you can repeat next week.', exercises: ['ma-flow-rolling', 'ma-rolling-round', 'ma-submission-drill'], prescription: '5×6 min flow · 3×5 min live', minutes: 60, method: 'ma-flow' },
    ],
  },
  {
    key: 'ma-traditional',
    sessionType: 'martial_arts',
    name: 'Traditional Practice',
    blurb: 'Karate, taekwondo, kung fu or aikido: basics, forms and partner work, in the order they are actually taught.',
    level: 'beginner',
    daysPerWeek: 3,
    blockWeeks: 12,
    bestFor: 'Grading-based arts where precision and forms matter as much as sparring',
    progressMarker: 'Forms performed from memory with clean stances, then power and breath added.',
    icon: 'martial.forms',
    days: [
      { key: 'kihon', label: 'Basics (kihon)', purpose: 'Individual techniques repeated from a fixed stance.', exercises: ['ma-jab-cross', 'ma-kick-drill', 'ma-footwork-drill'], prescription: '30–40 min of repetition by count', minutes: 40 },
      { key: 'kata', label: 'Forms (kata / poomsae)', purpose: 'Sequences for precision, power and breath control.', exercises: ['ma-forms-kata', 'ma-weapon-forms'], prescription: 'Each form ×5: slow, normal, full power', minutes: 40, method: 'ma-forms' },
      { key: 'kumite', label: 'Partner work (kumite)', purpose: 'Prearranged, then free — controlled contact throughout.', exercises: ['ma-technical-sparring', 'ma-counter-drill'], prescription: '6×2 min prearranged · 4×2 min free', minutes: 45, method: 'ma-defense' },
    ],
  },

  // ══════════════════════════ STRENGTH ══════════════════════════
  {
    key: 'str-recomp',
    sessionType: 'strength',
    name: 'Recomposition (muscle + fat loss)',
    blurb: 'Four lifting days at maintenance-ish calories with high protein, plus low-cost cardio. The only training half of building muscle while losing fat.',
    level: 'intermediate',
    daysPerWeek: 4,
    blockWeeks: 12,
    bestFor: 'Set your profile goal to "Build muscle & burn fat" so the calories match this training',
    progressMarker: 'Weight roughly flat while lifts climb and the tape shrinks. The scale is the wrong number to watch here — that is the whole point.',
    icon: 'strength.dumbbell',
    days: [
      { key: 'upper1', label: 'Upper — heavy', purpose: 'Heavy pressing and pulling to hold onto strength in a deficit.', exercises: ['bench-press-barbell', 'barbell-row', 'overhead-press', 'pull-up', 'barbell-curl', 'triceps-pushdown'], prescription: '4 sets × 5–8 reps · 2–3 min rest', minutes: 60, method: 'str-5x5' },
      { key: 'lower1', label: 'Lower — heavy', purpose: 'Squat and hinge. The largest muscles are the ones worth defending.', exercises: ['back-squat', 'romanian-deadlift', 'leg-press', 'leg-curl-machine', 'standing-calf-machine'], prescription: '4 sets × 5–8 reps · 3 min rest', minutes: 60, method: 'str-5x5' },
      { key: 'upper2', label: 'Upper — volume', purpose: 'Higher reps and more isolation — the stimulus that keeps muscle while eating less.', exercises: ['db-incline-press', 'seated-cable-row', 'lateral-raise', 'lat-pulldown', 'hammer-curl', 'db-overhead-extension'], prescription: '3–4 sets × 10–15 reps · 60–90 s rest', minutes: 55, method: 'str-hypertrophy' },
      { key: 'lower2', label: 'Lower — volume & core', purpose: 'Legs at higher reps, then core.', exercises: ['bulgarian-split-squat', 'leg-extension', 'leg-curl-machine', 'barbell-hip-thrust', 'hanging-leg-raise', 'plank'], prescription: '3–4 sets × 10–15 reps', minutes: 55, method: 'str-hypertrophy' },
    ],
  },
  {
    key: 'str-beginner',
    sessionType: 'strength',
    name: 'Beginner Barbell',
    blurb: 'Three full-body days, five compound lifts, add weight every session for as long as that keeps working. Nothing has ever beaten this for a first year.',
    level: 'beginner',
    daysPerWeek: 3,
    blockWeeks: 12,
    bestFor: 'Your first 6–12 months with a barbell',
    progressMarker: 'The bar goes up every session. When it stops twice in a row, deload 10% and climb again.',
    icon: 'strength.barbell',
    days: [
      { key: 'a', label: 'Workout A', purpose: 'Squat, press, pull.', exercises: ['back-squat', 'bench-press-barbell', 'barbell-row'], prescription: '3 × 5 reps · 3–5 min rest · +2.5 kg next time', minutes: 50, method: 'str-5x5' },
      { key: 'b', label: 'Workout B', purpose: 'Squat again, overhead, deadlift.', exercises: ['back-squat', 'overhead-press', 'deadlift'], prescription: 'Squat/press 3×5 · deadlift 1×5 · 3–5 min rest', minutes: 50, method: 'str-5x5' },
    ],
  },

  // ══════════════════════════ OUTDOOR ══════════════════════════
  {
    key: 'out-couch-5k',
    sessionType: 'outdoor',
    name: 'Couch to 5K',
    blurb: 'Nine weeks of walk/run intervals that end in a continuous 5 km. The walking is the method, not a compromise.',
    level: 'beginner',
    daysPerWeek: 3,
    blockWeeks: 9,
    bestFor: 'Going from no running at all to 30 continuous minutes',
    progressMarker: 'Run intervals lengthen while walk intervals shrink. Pace does not matter at all yet.',
    icon: 'cardio.running',
    days: [
      { key: 'w1', label: 'Run/walk — short', purpose: 'Intervals with generous walking.', exercises: ['outdoor-run'], prescription: '5 min walk warm-up · 8 × (60–90 s run / 2 min walk) · 5 min walk', minutes: 30 },
      { key: 'w2', label: 'Run/walk — medium', purpose: 'Longer run blocks, same total time.', exercises: ['outdoor-run'], prescription: '5 min walk · 5 × (3 min run / 90 s walk) · 5 min walk', minutes: 32 },
      { key: 'w3', label: 'Continuous attempt', purpose: 'One unbroken run at whatever pace lets you finish.', exercises: ['outdoor-run'], prescription: '5 min walk · 20–30 min continuous easy run', minutes: 35, method: 'car-zone2' },
    ],
  },
  {
    key: 'out-10k',
    sessionType: 'outdoor',
    name: '10K Builder',
    blurb: 'Four runs a week: one long, one fast, one at threshold, one easy. The classic distribution.',
    level: 'intermediate',
    daysPerWeek: 4,
    blockWeeks: 10,
    bestFor: 'Already running 5K comfortably and wanting to double it',
    progressMarker: 'Long-run distance climbing ~10% a week, and interval splits holding at lower effort.',
    icon: 'cardio.marathon',
    days: [
      { key: 'long', label: 'Long run', purpose: 'The distance day. Slow enough to talk, all the way through.', exercises: ['outdoor-run'], prescription: '60–100 min easy · add ~10% per week, never more', minutes: 75, method: 'out-long' },
      { key: 'int', label: 'Track intervals', purpose: 'VO₂max work — the fastest gains, and the highest injury risk. Warm up properly.', exercises: ['track-intervals'], prescription: '6–10 × 400 m with equal jog recovery', minutes: 50, method: 'out-track' },
      { key: 'tempo', label: 'Tempo run', purpose: 'Threshold — comfortably hard, sustained.', exercises: ['outdoor-run'], prescription: '10 min easy · 20–30 min at threshold · 10 min easy', minutes: 50, method: 'out-tempo' },
      { key: 'easy', label: 'Easy run', purpose: 'Recovery volume. Resist making this one hard.', exercises: ['outdoor-run'], prescription: '30–40 min conversational', minutes: 35, method: 'car-zone2' },
    ],
  },
  {
    key: 'out-hills',
    sessionType: 'outdoor',
    name: 'Hills & Trails',
    blurb: 'Climbing as strength work. Trail running, hill repeats and rucking build legs that road running never touches.',
    level: 'intermediate',
    daysPerWeek: 3,
    blockWeeks: 8,
    bestFor: 'Trail races, hiking season, or road runners who keep getting injured',
    progressMarker: 'Vertical metres per week and the pace you hold on the climbs.',
    icon: 'cardio.elevation',
    days: [
      { key: 'reps', label: 'Hill repeats', purpose: 'Strength and VO₂max at once, with less impact than flat speed work.', exercises: ['hill-repeats'], prescription: '8–12 × 60–90 s hard uphill · jog down', minutes: 50, method: 'out-hills' },
      { key: 'trail', label: 'Trail run', purpose: 'Uneven ground trains ankles and stabilisers nothing else reaches.', exercises: ['trail-run'], prescription: '60–90 min by effort, not pace', minutes: 75, method: 'out-long' },
      { key: 'ruck', label: 'Ruck / hike', purpose: 'Loaded time on feet, minimal recovery cost.', exercises: ['rucking', 'hiking'], prescription: '60–90 min with 10–20 kg', minutes: 75, method: 'out-ruck' },
    ],
  },

  // ══════════════════════════ SPORT ══════════════════════════
  {
    key: 'spo-athlete',
    sessionType: 'sport',
    name: 'Sport Athlete Week',
    blurb: 'Match day supported by one skill day, one conditioning day and one recovery day — instead of just turning up and playing.',
    level: 'intermediate',
    daysPerWeek: 4,
    blockWeeks: 12,
    bestFor: 'Anyone playing a sport weekly who wants to stop fading in the last quarter',
    progressMarker: 'Repeat-sprint drop-off — how much slower your last sprint is than your first.',
    icon: 'sport.soccer',
    days: [
      { key: 'match', label: 'Match / game', purpose: 'The reason for everything else in the week.', exercises: ['soccer', 'basketball', 'tennis', 'handball'], prescription: 'Full match, logged by duration', minutes: 90, method: 'spo-match' },
      { key: 'skill', label: 'Skill session', purpose: 'Technique fresh, before any fatigue.', exercises: ['futsal', 'table-tennis', 'squash'], prescription: '45 min technical, low intensity', minutes: 45, method: 'spo-drills' },
      { key: 'cond', label: 'Conditioning', purpose: 'Change of direction and repeat-sprint ability — what actually fails late in a game.', exercises: ['shuttle-runs', 'agility-ladder', 'sprint-repeats', 'box-jumps'], prescription: '30–40 min with full recoveries', minutes: 40, method: 'spo-conditioning' },
      { key: 'rec', label: 'Recovery', purpose: 'The day that makes the other three repeatable.', exercises: ['stretching', 'foam-rolling', 'stationary-bike'], prescription: '30 min easy movement and mobility', minutes: 30, method: 'mb-recovery' },
    ],
  },

  // ══════════════════════════ MIND-BODY ══════════════════════════
  {
    key: 'mb-mobility',
    sessionType: 'mindbody',
    name: 'Mobility Reset',
    blurb: 'Short daily routines targeting the three areas that desk work and lifting stiffen most: hips, shoulders and thoracic spine.',
    level: 'beginner',
    daysPerWeek: 5,
    blockWeeks: 8,
    bestFor: 'Anyone who sits all day, and lifters whose positions are limited by range rather than strength',
    progressMarker: 'Range you can reach and hold under control — not how far someone can push you.',
    icon: 'mindbody.stretch',
    days: [
      { key: 'hips', label: 'Hips', purpose: 'The joint that sitting closes down first.', exercises: ['hip-mobility', 'stretching'], prescription: '15–20 min, 45–60 s per position', minutes: 20, method: 'mb-mobility' },
      { key: 'shoulders', label: 'Shoulders', purpose: 'Overhead range for pressing and hanging.', exercises: ['shoulder-mobility', 'band-pull-apart'], prescription: '15–20 min', minutes: 20, method: 'mb-mobility' },
      { key: 'tspine', label: 'Thoracic & posture', purpose: 'Upper-back extension and rotation.', exercises: ['thoracic-mobility', 'foam-rolling'], prescription: '15–20 min', minutes: 20, method: 'mb-mobility' },
      { key: 'flow', label: 'Full-body flow', purpose: 'Put the pieces together in movement.', exercises: ['vinyasa-yoga', 'animal-flow'], prescription: '30–40 min continuous', minutes: 35, method: 'mb-vinyasa' },
      { key: 'yin', label: 'Yin / long holds', purpose: 'Long passive holds for connective tissue. Best in the evening.', exercises: ['yin-yoga', 'stretching'], prescription: '30 min, 2–5 min per hold', minutes: 30, method: 'mb-yin' },
    ],
  },

  // ══════════════════════════ MEDITATION ══════════════════════════
  {
    key: 'med-starter',
    sessionType: 'meditation',
    name: 'Eight-Week Starter',
    blurb: 'A practice you can actually keep: five short sessions a week, each with a different purpose, none longer than 20 minutes.',
    level: 'beginner',
    daysPerWeek: 5,
    blockWeeks: 8,
    bestFor: 'Building the habit — consistency beats duration by a wide margin at the start',
    progressMarker: 'Sessions per week. Length is a distant second, and chasing it is how most people quit.',
    icon: 'mindbody.meditation',
    days: [
      { key: 'breath', label: 'Breath focus', purpose: 'The foundation. One anchor, return to it when you drift.', exercises: ['breathwork'], prescription: '10 min, counting the breath', minutes: 10, method: 'med-breath' },
      { key: 'box', label: 'Box breathing', purpose: 'Down-regulation you can use before sleep or after stress.', exercises: ['breathwork'], prescription: '4-4-4-4 for 10 min', minutes: 10, method: 'med-box' },
      { key: 'scan', label: 'Body scan', purpose: 'Attention moved deliberately through the body.', exercises: ['body-scan'], prescription: '15–20 min', minutes: 18, method: 'med-scan' },
      { key: 'walk', label: 'Walking meditation', purpose: 'For days when sitting still is not going to happen.', exercises: ['guided-meditation'], prescription: '15 min slow walking', minutes: 15, method: 'med-walking' },
      { key: 'sit', label: 'Unguided sit', purpose: 'No audio, no props — where the practice becomes yours.', exercises: ['unguided-sit'], prescription: '10–20 min', minutes: 15, method: 'med-sit' },
    ],
  },
];

export function programsFor(sessionType: SessionType): TrainingProgram[] {
  return PROGRAMS.filter((p) => p.sessionType === sessionType);
}

export function findProgram(key: string): TrainingProgram | undefined {
  return PROGRAMS.find((p) => p.key === key);
}

/**
 * The `style` tag written onto a session started from a program day, so history
 * and progress can group like with like.
 */
export function programStyleTag(program: TrainingProgram, day: ProgramDay): string {
  return `${program.key}:${day.key}`;
}

/** Total planned minutes across a program week. */
export function weeklyMinutes(program: TrainingProgram): number {
  return program.days.reduce((sum, d) => sum + d.minutes, 0);
}
