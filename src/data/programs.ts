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

  // ══════════════════════════ SPORT (more) ══════════════════════════
  {
    key: 'spo-off-season',
    sessionType: 'sport',
    name: 'Off-Season Build',
    blurb: 'The one window where you can actually get stronger and faster without a match to protect on Saturday. Waste it and you start next season where you finished this one.',
    level: 'intermediate',
    daysPerWeek: 4,
    blockWeeks: 10,
    bestFor: 'The weeks between seasons, when nothing needs preserving',
    progressMarker: 'Strength and sprint numbers climbing. Skill work drops to maintenance so the physical qualities can move.',
    icon: 'strength.barbell',
    days: [
      { key: 'power', label: 'Power & speed', purpose: 'Fast, fresh, low volume — the quality that fades first and returns slowest.', exercises: ['sport-plyometrics', 'sprint-repeats', 'box-jumps', 'sport-footwork'], prescription: '40–120 foot contacts · full recovery · stop when height or speed drops', minutes: 45, method: 'spo-plyometrics' },
      { key: 'strength', label: 'Strength', purpose: 'Heavy lifting, the base under every athletic quality.', exercises: ['back-squat', 'deadlift', 'bench-press-barbell', 'barbell-row'], prescription: '4–5 sets × 3–6 reps · 3 min rest', minutes: 60, method: 'str-5x5' },
      { key: 'cond', label: 'Conditioning', purpose: 'Aerobic base now, so the sharp work in pre-season has somewhere to land.', exercises: ['easy-run', 'rowing-machine', 'assault-bike'], prescription: '40–50 min easy, or 6 × 3 min hard / 3 min easy', minutes: 45, method: 'car-zone2' },
      { key: 'skill', label: 'Skill maintenance', purpose: 'Keep the hands and feet alive without adding fatigue.', exercises: ['sport-serve-practice', 'sport-passing-drill', 'sport-wall-ball'], prescription: '30 min technical, relaxed', minutes: 30, method: 'spo-technical' },
    ],
  },
  {
    key: 'spo-in-season',
    sessionType: 'sport',
    name: 'In-Season Maintenance',
    blurb: 'Two short gym sessions that hold your strength without stealing anything from match day. In season, the match is the training — everything else exists to protect it.',
    level: 'intermediate',
    daysPerWeek: 3,
    blockWeeks: 20,
    bestFor: 'A competitive season with a weekly fixture',
    progressMarker: 'Performing as well in the last month of the season as the first. Holding ground IS the win here.',
    icon: 'core.calendar',
    days: [
      { key: 'gym1', label: 'Gym — heavy & short', purpose: 'Enough load to keep strength, far too little to make you sore.', exercises: ['back-squat', 'bench-press-barbell', 'barbell-row'], prescription: '3 sets × 3–5 reps at ~85% · nothing to failure · in and out in 35 min', minutes: 35, method: 'spo-in-season' },
      { key: 'gym2', label: 'Gym — power & prehab', purpose: 'Stay explosive, keep the injury-prone tissues strong.', exercises: ['box-jumps', 'nordic-curl', 'bulgarian-split-squat', 'side-plank'], prescription: '2–3 sets each, submaximal', minutes: 35 },
      { key: 'match', label: 'Match day', purpose: 'The point of the week. Warm up properly, then play.', exercises: ['sport-warmup', 'soccer', 'basketball', 'tennis'], prescription: 'RAMP warm-up · full match', minutes: 100, method: 'spo-match' },
    ],
  },
  {
    key: 'spo-racket',
    sessionType: 'sport',
    name: 'Racket Sport Player',
    blurb: 'Tennis, padel, squash or badminton — built around the two things that actually decide points: first-step speed and a reliable serve.',
    level: 'beginner',
    daysPerWeek: 4,
    blockWeeks: 10,
    bestFor: 'Club players who want to stop losing to their own footwork',
    progressMarker: 'Serve success rate out of a fixed number of attempts, and reaching balls you used to watch go past.',
    icon: 'sport.tennis',
    days: [
      { key: 'serve', label: 'Serve & technique', purpose: 'A closed skill you can drill alone, and the only shot fully under your control.', exercises: ['sport-serve-practice', 'sport-wall-ball'], prescription: '80–120 counted serves · log makes/attempts', minutes: 40, method: 'spo-technical' },
      { key: 'foot', label: 'Footwork & agility', purpose: 'Split step, first step, recovery step. Most missed balls are footwork, not swing.', exercises: ['sport-footwork', 'agility-ladder', 'shuttle-runs'], prescription: '8–10 short drills, full recovery', minutes: 35, method: 'spo-speed-agility' },
      { key: 'play', label: 'Match play', purpose: 'Points under real pressure.', exercises: ['tennis', 'padel', 'squash', 'badminton'], prescription: '60–90 min of sets or games', minutes: 75, method: 'spo-match' },
      { key: 'body', label: 'Shoulder & body care', purpose: 'Racket sports are brutally one-sided — this is the day that keeps you playing.', exercises: ['rear-delt-fly', 'band-pull-apart', 'shoulder-mobility', 'thoracic-mobility'], prescription: '3 sets each, light', minutes: 30, method: 'mb-mobility' },
    ],
  },
  {
    key: 'spo-team-preseason',
    sessionType: 'sport',
    name: 'Team Sport Pre-Season',
    blurb: 'Six weeks from off-season to match-ready: base first, then sharpness, then the game itself. Reversing that order is how pre-season injuries happen.',
    level: 'advanced',
    daysPerWeek: 5,
    blockWeeks: 6,
    bestFor: 'The build-up before a season starts',
    progressMarker: 'Repeat-sprint drop-off shrinking week to week — the thing that fails in the final quarter.',
    icon: 'sport.team',
    days: [
      { key: 'base', label: 'Aerobic base', purpose: 'The engine everything else runs on. Built first, and unglamorously.', exercises: ['easy-run', 'cycling-commute'], prescription: '40–60 min conversational', minutes: 50, method: 'car-zone2' },
      { key: 'rsa', label: 'Repeat-sprint ability', purpose: 'The specific quality team sport demands: sprint, recover, sprint again.', exercises: ['shuttle-runs', 'sprint-repeats'], prescription: '3 sets × 6 × 30 m with 20 s recovery', minutes: 40, method: 'spo-conditioning' },
      { key: 'strength', label: 'Strength', purpose: 'Force production, and the tissue tolerance that prevents soft-tissue injuries.', exercises: ['back-squat', 'romanian-deadlift', 'nordic-curl', 'barbell-hip-thrust'], prescription: '4 × 5 · Nordics every week without fail', minutes: 55, method: 'str-5x5' },
      { key: 'ssg', label: 'Small-sided games', purpose: 'Game fitness with more touches and more running than a full match.', exercises: ['futsal', 'soccer', 'basketball'], prescription: '6 × 5 min with 2 min rest', minutes: 50, method: 'spo-scrimmage' },
      { key: 'recovery', label: 'Recovery', purpose: 'Pre-season fails from accumulated fatigue more often than from lack of work.', exercises: ['foam-rolling', 'yin-yoga', 'brisk-walk'], prescription: '30–40 min easy', minutes: 35, method: 'mb-recovery' },
    ],
  },

  // ══════════════════════════ OUTDOOR (more) ══════════════════════════
  {
    key: 'out-half-marathon',
    sessionType: 'outdoor',
    name: 'Half Marathon Build',
    blurb: 'Twelve weeks to 21.1 km. Four runs a week, only one of them hard — the distribution that gets people to the start line uninjured.',
    level: 'intermediate',
    daysPerWeek: 4,
    blockWeeks: 12,
    bestFor: 'Comfortable at 10K and wanting to double it',
    progressMarker: 'Long-run distance climbing by about 10% a week, with a cut-back week every fourth. Skipping the cut-back is the classic mistake.',
    icon: 'cardio.marathon',
    days: [
      { key: 'long', label: 'Long run', purpose: 'The session that makes the distance possible. Slow is correct.', exercises: ['long-run'], prescription: 'Build 12 → 20 km over the block · every 4th week, cut back 30%', minutes: 100, method: 'out-long' },
      { key: 'tempo', label: 'Tempo', purpose: 'Threshold work — the pace you can hold for about an hour.', exercises: ['outdoor-run'], prescription: '15 min easy · 25–35 min at threshold · 10 min easy', minutes: 55, method: 'out-tempo' },
      { key: 'easy', label: 'Easy run', purpose: 'Volume without cost. Resist making this one hard.', exercises: ['easy-run'], prescription: '35–50 min conversational', minutes: 45, method: 'out-easy' },
      { key: 'prog', label: 'Progression run', purpose: 'Finishing fast on tired legs — exactly what race day asks for.', exercises: ['progression-run'], prescription: 'Thirds: easy, moderate, hard', minutes: 45, method: 'out-progression' },
    ],
  },
  {
    key: 'out-cycling-base',
    sessionType: 'outdoor',
    name: 'Cycling Base',
    blurb: 'Polarised riding: lots of easy, a little very hard, almost nothing in between. The middle is where most riders live and least improve.',
    level: 'intermediate',
    daysPerWeek: 4,
    blockWeeks: 12,
    bestFor: 'Building endurance for long rides or sportives',
    progressMarker: 'More distance at the same heart rate, and climbs that used to hurt becoming steady.',
    icon: 'cardio.cycling',
    days: [
      { key: 'long', label: 'Long ride', purpose: 'Hours in the saddle. Nothing replaces them.', exercises: ['road-cycling', 'gravel-cycling'], prescription: '2–4 h mostly easy', minutes: 150, method: 'out-longride' },
      { key: 'hills', label: 'Hill repeats', purpose: 'Strength on the bike, and the confidence to stay seated on a climb.', exercises: ['cycling-hills'], prescription: '5–8 × 4–6 min climbing hard · descend easy', minutes: 75, method: 'out-hills' },
      { key: 'commute', label: 'Commutes', purpose: 'Free volume from a ride you were making anyway.', exercises: ['cycling-commute'], prescription: 'Easy out, steady home', minutes: 45, method: 'out-commute' },
      { key: 'tt', label: 'Time trial effort', purpose: 'One measured hard effort — a number to compare month to month.', exercises: ['cycling-time-trial'], prescription: '20 min all-out on the same route every time', minutes: 60, method: 'out-tempo' },
    ],
  },
  {
    key: 'out-triathlon',
    sessionType: 'outdoor',
    name: 'Triathlon Starter (sprint)',
    blurb: 'Six sessions covering three sports plus the transition between them. Sprint distance: 750 m swim, 20 km bike, 5 km run.',
    level: 'intermediate',
    daysPerWeek: 6,
    blockWeeks: 12,
    bestFor: 'A first sprint triathlon, with a swimming background or lessons',
    progressMarker: 'Each discipline improving separately, and the brick run stopping feeling strange.',
    icon: 'cardio.swimming',
    days: [
      { key: 'swim1', label: 'Swim — technique', purpose: 'In swimming, technique buys more speed than fitness does.', exercises: ['swimming-laps'], prescription: '30–40 min drills and short repeats', minutes: 40 },
      { key: 'swim2', label: 'Swim — open water', purpose: 'Sighting, wetsuit, crowds, cold. All of it needs rehearsing.', exercises: ['open-water-swim'], prescription: '30–45 min continuous with sighting practice', minutes: 45 },
      { key: 'bike', label: 'Bike — long', purpose: 'The longest leg by time. Comfort matters more than power.', exercises: ['road-cycling'], prescription: '60–90 min steady', minutes: 75, method: 'out-longride' },
      { key: 'run', label: 'Run — easy', purpose: 'Keep the legs running without adding fatigue to the other two.', exercises: ['easy-run'], prescription: '30–40 min conversational', minutes: 35, method: 'out-easy' },
      { key: 'brick', label: 'Brick (bike → run)', purpose: 'The only way to prepare for how the first kilometre off the bike feels.', exercises: ['brick-session'], prescription: '45 min ride · fast change · 15 min run', minutes: 70, method: 'out-brick' },
      { key: 'strength', label: 'Strength & mobility', purpose: 'The session endurance athletes skip and then get injured without.', exercises: ['back-squat', 'nordic-curl', 'plank', 'hip-mobility'], prescription: '3 sets each, moderate', minutes: 40 },
    ],
  },
  {
    key: 'out-trek-prep',
    sessionType: 'outdoor',
    name: 'Trek & Altitude Prep',
    blurb: 'Preparing for a multi-day trek or a big mountain day: loaded time on feet, climbing legs, and — the part everyone forgets — descending legs.',
    level: 'intermediate',
    daysPerWeek: 4,
    blockWeeks: 10,
    bestFor: 'A trek, a long-distance trail, or a summit attempt',
    progressMarker: 'Pack weight and vertical metres, built separately. Never add load and distance in the same week.',
    icon: 'cardio.hiking',
    days: [
      { key: 'longhike', label: 'Long loaded hike', purpose: 'The rehearsal session — same boots, same pack, same socks.', exercises: ['trekking', 'rucking'], prescription: '3–6 h with full pack, on terrain', minutes: 240, method: 'out-adventure' },
      { key: 'vert', label: 'Vertical day', purpose: 'Climbing legs. Stairs work when there are no hills.', exercises: ['stair-climbing-outdoor', 'hill-repeats', 'stairmaster'], prescription: '400–800 m of ascent', minutes: 70, method: 'out-hills' },
      { key: 'down', label: 'Descent tolerance', purpose: 'Downhill is what wrecks quads and knees on day three. Train it deliberately.', exercises: ['trail-run', 'walking-lunge', 'bulgarian-split-squat'], prescription: 'Controlled descents · 3 × 12 slow eccentric lunges', minutes: 60 },
      { key: 'strength', label: 'Legs & core', purpose: 'Step-ups and carries — the two patterns a trek is actually made of.', exercises: ['box-step-ups-cardio', 'loaded-carry-cardio', 'calf-raise-step', 'plank'], prescription: '4 sets each, loaded', minutes: 45 },
    ],
  },

  // ══════════════════════════ MIND-BODY (more) ══════════════════════════
  {
    key: 'mb-yoga-foundations',
    sessionType: 'mindbody',
    name: 'Yoga Foundations',
    blurb: 'Eight weeks from never having done yoga to a practice you can run on your own. Four sessions a week, none of them requiring flexibility you do not have yet.',
    level: 'beginner',
    daysPerWeek: 4,
    blockWeeks: 8,
    bestFor: 'Starting yoga, or returning after years away',
    progressMarker: 'Steadier breathing in the same pose. Depth follows breath — chasing depth first is how people get hurt.',
    icon: 'mindbody.yoga',
    days: [
      { key: 'hatha', label: 'Hatha — the basics', purpose: 'Slow held postures. Learn the shapes before adding flow.', exercises: ['hatha-yoga', 'sun-salutations'], prescription: '40 min · poses held 30–60 s · rest whenever needed', minutes: 40, method: 'mb-hatha' },
      { key: 'flow', label: 'Vinyasa flow', purpose: 'Link the shapes to the breath.', exercises: ['vinyasa-yoga', 'sun-salutations'], prescription: '35–45 min continuous', minutes: 40, method: 'mb-vinyasa' },
      { key: 'strength', label: 'Strength & balance', purpose: 'Standing poses and balances — the athletic half of yoga.', exercises: ['balance-training', 'hatha-yoga', 'deep-squat-hold'], prescription: '35 min holds and balances', minutes: 35, method: 'mb-balance' },
      { key: 'restore', label: 'Restorative', purpose: 'Fully supported, evening practice. The one that helps you sleep.', exercises: ['restorative-yoga', 'yin-yoga'], prescription: '30–40 min, 5 min per pose', minutes: 35, method: 'mb-restorative' },
    ],
  },
  {
    key: 'mb-lifter-mobility',
    sessionType: 'mindbody',
    name: "Lifter's Mobility",
    blurb: 'The five restrictions that limit most lifts: ankles for squat depth, hips for the bottom position, thoracic spine and shoulders for overhead, wrists for front rack.',
    level: 'intermediate',
    daysPerWeek: 4,
    blockWeeks: 8,
    bestFor: 'Lifters whose positions are limited by range rather than strength',
    progressMarker: 'Range that holds a week later, and better positions under the bar. Range that vanishes overnight was never yours.',
    icon: 'strength.barbell',
    days: [
      { key: 'squat', label: 'Squat prep', purpose: 'Ankles, adductors and the bottom position.', exercises: ['ankle-mobility', 'adductor-routine', 'deep-squat-hold', 'hip-mobility'], prescription: '20 min · 60–90 s per position', minutes: 20, method: 'mb-cars' },
      { key: 'overhead', label: 'Overhead prep', purpose: 'Thoracic extension and shoulder flexion — usually the real limit, not the shoulder itself.', exercises: ['thoracic-mobility', 'shoulder-mobility', 'wrist-mobility'], prescription: '20 min', minutes: 20, method: 'mb-cars' },
      { key: 'hinge', label: 'Hinge & posterior chain', purpose: 'Hamstrings and hips, for deadlifts that start from the right place.', exercises: ['hamstring-routine', 'couch-stretch', 'spinal-segmentation'], prescription: '20 min with PNF on the hamstrings', minutes: 20, method: 'mb-pnf' },
      { key: 'flow', label: 'Full-body flow', purpose: 'Put it together and move.', exercises: ['animal-flow', 'joint-cars', 'vinyasa-yoga'], prescription: '30 min continuous', minutes: 30, method: 'mb-vinyasa' },
    ],
  },
  {
    key: 'mb-desk-worker',
    sessionType: 'mindbody',
    name: 'Desk-Worker Reset',
    blurb: 'Built for a working day, not a studio. Five short routines targeting exactly what sitting shortens — none longer than 20 minutes, most under 10.',
    level: 'beginner',
    daysPerWeek: 5,
    blockWeeks: 8,
    bestFor: 'Long hours at a desk, stiff hips and an aching neck',
    progressMarker: 'Number of breaks actually taken per day. Frequency beats duration here by a wide margin.',
    icon: 'mindbody.stretch',
    days: [
      { key: 'micro', label: 'Micro-breaks', purpose: 'Three to five minutes every 90 — the highest-value habit on this list.', exercises: ['posture-drills', 'chair-yoga'], prescription: '3–5 min, several times a day', minutes: 5, method: 'mb-desk' },
      { key: 'hips', label: 'Hip openers', purpose: 'Sitting shortens the hip flexors first and worst.', exercises: ['couch-stretch', 'hip-mobility', 'deep-squat-hold'], prescription: '15 min, 90 s per side', minutes: 15, method: 'mb-mobility' },
      { key: 'neck', label: 'Neck & shoulders', purpose: 'Screen posture, undone.', exercises: ['neck-shoulder-release', 'thoracic-mobility', 'band-pull-apart'], prescription: '15 min', minutes: 15 },
      { key: 'wake', label: 'Morning wake-up', purpose: 'Ten minutes that make the whole day move better.', exercises: ['joint-cars', 'sun-salutations', 'dynamic-warmup'], prescription: '10 min on waking', minutes: 10, method: 'mb-cars' },
      { key: 'evening', label: 'Evening wind-down', purpose: 'Long holds and slow breathing before bed.', exercises: ['yin-yoga', 'static-stretch-routine'], prescription: '20 min, 2–3 min per hold', minutes: 20, method: 'mb-yin' },
    ],
  },

  // ══════════════════════════ MEDITATION (more) ══════════════════════════
  {
    key: 'med-stress',
    sessionType: 'meditation',
    name: 'Stress Reduction (8 weeks)',
    blurb: 'Modelled on the structure used in mindfulness-based stress reduction courses: a longer formal sit, plus short practices you can actually deploy in a bad moment.',
    level: 'beginner',
    daysPerWeek: 6,
    blockWeeks: 8,
    bestFor: 'High stress, a racing mind, or trouble switching off after work',
    progressMarker: 'Noticing stress earlier — catching it building rather than after it has arrived.',
    icon: 'mindbody.spa',
    days: [
      { key: 'scan', label: 'Body scan', purpose: 'The core practice. Attention moved deliberately through the body.', exercises: ['body-scan'], prescription: '20–30 min lying down', minutes: 25, method: 'med-scan' },
      { key: 'breath', label: 'Breath focus', purpose: 'One anchor, returned to again and again.', exercises: ['mindfulness-breath'], prescription: '15–20 min seated', minutes: 18, method: 'med-breath' },
      { key: 'noting', label: 'Noting', purpose: 'Labelling thoughts creates the gap between having one and being had by one.', exercises: ['noting-practice'], prescription: '15 min', minutes: 15, method: 'med-noting' },
      { key: 'pmr', label: 'Progressive relaxation', purpose: 'The most physical way in — useful on days sitting still feels impossible.', exercises: ['progressive-relaxation'], prescription: '18 min, head to toe', minutes: 18, method: 'med-pmr' },
      { key: 'walk', label: 'Walking practice', purpose: 'Takes the practice off the cushion and into the day.', exercises: ['walking-meditation'], prescription: '15 min slow walking', minutes: 15, method: 'med-walking' },
      { key: 'reset', label: 'In-the-moment resets', purpose: 'Two sighs, used when it is actually happening. Deployed beats perfect.', exercises: ['physiological-sigh', 'box-breathing'], prescription: 'Several times a day, 1–2 min each', minutes: 5, method: 'med-reset' },
    ],
  },
  {
    key: 'med-sleep',
    sessionType: 'meditation',
    name: 'Sleep & Wind-Down',
    blurb: 'A pre-sleep routine built on long exhales and lying-down practices. Give it weeks, not nights — one good night proves nothing either way.',
    level: 'beginner',
    daysPerWeek: 7,
    blockWeeks: 6,
    bestFor: 'Trouble falling asleep, or a mind that starts up the moment the lights go off',
    progressMarker: 'Time to fall asleep, averaged over a week. Track it in Sleep, not by how last night felt.',
    icon: 'mindbody.night',
    days: [
      { key: 'breath478', label: '4-7-8 breathing', purpose: 'Long exhale relative to inhale — the pattern most used before sleep.', exercises: ['breathing-478'], prescription: '4–8 cycles in bed, lights already off', minutes: 8, method: 'med-sleep' },
      { key: 'nidra', label: 'Yoga Nidra / NSDR', purpose: 'Guided lying-down rest. Falling asleep during it is fine.', exercises: ['yoga-nidra'], prescription: '20–30 min', minutes: 25, method: 'med-nidra' },
      { key: 'scan', label: 'Body scan in bed', purpose: 'Somewhere for attention to go that is not tomorrow.', exercises: ['sleep-meditation', 'body-scan'], prescription: '15–20 min, no goal of staying awake', minutes: 18, method: 'med-scan' },
      { key: 'pmr', label: 'Progressive relaxation', purpose: 'For nights when the body is wired rather than the mind.', exercises: ['progressive-relaxation'], prescription: '15 min', minutes: 15, method: 'med-pmr' },
      { key: 'coherent', label: 'Coherent breathing', purpose: 'Six breaths a minute, an hour before bed rather than in it.', exercises: ['coherent-breathing'], prescription: '10–15 min in the evening', minutes: 12, method: 'med-coherent' },
    ],
  },
  {
    key: 'med-focus',
    sessionType: 'meditation',
    name: 'Focus & Performance',
    blurb: 'Concentration training plus mental rehearsal — aimed at competition, exams and any deep work that keeps getting interrupted by your own attention.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 8,
    bestFor: 'Athletes before competition, and anyone whose work needs long unbroken attention',
    progressMarker: 'How quickly you notice you have drifted. Catching it at 5 seconds instead of 5 minutes is the entire skill.',
    icon: 'mindbody.focus',
    days: [
      { key: 'concentration', label: 'Concentration', purpose: 'One object, held. Pure attention training.', exercises: ['mindfulness-breath', 'mantra-meditation'], prescription: '20 min, no phone in the room', minutes: 20, method: 'med-breath' },
      { key: 'rehearsal', label: 'Mental rehearsal', purpose: 'Rehearse the performance in detail, including recovering from a mistake.', exercises: ['visualization'], prescription: '12 min, first person, real time', minutes: 12, method: 'med-visualization' },
      { key: 'open', label: 'Open awareness', purpose: 'Wide attention — the counterpart to narrow focus.', exercises: ['open-awareness'], prescription: '20 min', minutes: 20, method: 'med-open' },
      { key: 'reset', label: 'Pre-performance reset', purpose: 'A 60-second routine you can run in the moments before it starts.', exercises: ['physiological-sigh', 'box-breathing'], prescription: '2–5 min immediately before performing', minutes: 5, method: 'med-reset' },
      { key: 'review', label: 'Reflection', purpose: 'Written review — what worked, what did not, what changes.', exercises: ['journaling'], prescription: '8–10 min after training or competing', minutes: 10, method: 'med-gratitude' },
    ],
  },
  {
    key: 'med-faith',
    sessionType: 'meditation',
    name: 'Faith Practice',
    blurb: 'The five daily prayers as the spine of the week, with dhikr, recitation and du\'a around them. Logged like any other practice, without turning worship into a scoreboard.',
    level: 'beginner',
    daysPerWeek: 7,
    blockWeeks: 12,
    bestFor: 'Keeping a consistent daily practice alongside training',
    progressMarker: 'Consistency across the week. The point is the practice itself, not a number going up.',
    icon: 'mindbody.candle',
    days: [
      { key: 'fajr', label: 'Fajr & morning dhikr', purpose: 'The dawn prayer, followed by remembrance — the quietest part of the day.', exercises: ['prayer-fajr', 'dhikr'], prescription: 'Salat + 5–10 min dhikr', minutes: 20, method: 'med-dhikr' },
      { key: 'midday', label: 'Dhuhr & Asr', purpose: 'The two prayers that break up a working day.', exercises: ['prayer-dhuhr', 'prayer-asr'], prescription: 'Salat at their times', minutes: 20 },
      { key: 'evening', label: 'Maghrib & Isha', purpose: 'Sunset and night prayers, closing the day.', exercises: ['prayer-maghrib', 'prayer-isha'], prescription: 'Salat + witr', minutes: 25 },
      { key: 'recite', label: 'Recitation', purpose: 'A daily portion, however small, kept up consistently.', exercises: ['quran-recitation'], prescription: '10–20 min', minutes: 15 },
      { key: 'dua', label: 'Du\'a & reflection', purpose: 'Supplication and honest reflection on the day.', exercises: ['dua-supplication', 'gratitude-practice'], prescription: '10 min', minutes: 10, method: 'med-gratitude' },
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
