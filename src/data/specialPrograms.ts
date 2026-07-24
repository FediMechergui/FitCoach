import type { SessionType } from '@/db/schema';
import type { ProgramLevel } from './programs';

/**
 * SPECIAL PROGRAMMES — themed, immersive training built around a real tradition:
 * modern military selection, historical warrior cultures, and practical everyday
 * routines. Each one carries its origin, its ethos, a multi-discipline training
 * week, and a diet that fits how those people actually ate/train.
 *
 * These are **inspired by and adapted** from their sources for a normal person
 * with a phone and limited kit — not literal reconstructions, and never the
 * dangerous parts. Where a tradition included things no app should prescribe
 * (starvation, injury as initiation, forced dehydration), the programme keeps
 * the training principle and drops the harm, and says so in `authenticityNote`.
 *
 * ⚠️ `key` and `days[].key` are stable identifiers (a session is tagged
 * `special:<key>:<day>` in its `style` column). Never change or reuse one;
 * adding is always safe. Every `exercises` slug must exist in the library.
 */

export type SpecialCategory = 'military' | 'historical' | 'lifestyle';

export const SPECIAL_CATEGORY_META: Record<
  SpecialCategory,
  { label: string; blurb: string; icon: string }
> = {
  military: {
    label: 'Military & Special Forces',
    blurb: 'Selection-style preparation from real armed-forces fitness tests.',
    icon: 'mindbody.military',
  },
  historical: {
    label: 'Warriors of History',
    blurb: 'How legendary fighting cultures actually built their bodies.',
    icon: 'mindbody.samurai',
  },
  lifestyle: {
    label: 'Everyday Special Ops',
    blurb: 'Short, equipment-light routines for real life — desk, dawn, travel.',
    icon: 'mindbody.morning',
  },
};

export interface SpecialDay {
  key: string;
  label: string;
  /** each day picks its own discipline — these programmes span categories */
  sessionType: SessionType;
  /** what this day trains, with a line of authentic context */
  focus: string;
  /** exercise slugs to pre-load, in order */
  exercises: string[];
  /** the prescription in plain words */
  prescription: string;
  minutes: number;
}

export interface SpecialMeal {
  label: string;
  detail: string;
}

export interface SpecialDiet {
  name: string;
  /** how these people fuelled, and how to adapt it sanely today */
  approach: string;
  /** the macro slant in one line */
  macroSlant: string;
  /** a representative day of eating */
  sampleDay: SpecialMeal[];
  /** honest caveats — what to keep, what to skip */
  notes: string[];
}

export interface SpecialProgram {
  key: string;
  category: SpecialCategory;
  name: string;
  /** one-line hook */
  tagline: string;
  /** authentic historical / cultural context */
  origin: string;
  /** the mindset the training was built to forge */
  ethos: string;
  level: ProgramLevel;
  daysPerWeek: number;
  blockWeeks: number;
  icon: string;
  accent: string;
  /** what's real vs adapted, stated plainly */
  authenticityNote: string;
  /** for the demanding ones — how to not hurt yourself */
  safetyNote?: string;
  days: SpecialDay[];
  diet: SpecialDiet;
}

export const SPECIAL_PROGRAMS: SpecialProgram[] = [
  // ═══════════════════════════ MILITARY ═══════════════════════════
  {
    key: 'mil-army-acft',
    category: 'military',
    name: 'Army Combat Fitness',
    tagline: 'Train the six events of the modern soldier test.',
    origin:
      'The U.S. Army replaced its decades-old sit-up/push-up/run test with the Army Combat Fitness Test (ACFT) in the early 2020s — six events chosen because they mirror the physical demands of actual combat: lifting a casualty, carrying ammunition, dragging a sled, moving explosively under load.',
    ethos: 'Fit for the task, not for the gym. Strength, power and staying power in one body.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.military',
    accent: '#4B5320',
    authenticityNote:
      'Built directly around the six ACFT events (deadlift, standing power throw, hand-release push-up, sprint-drag-carry, plank, two-mile run). Substitute a trap-bar or dumbbells for the hex-bar and a medicine ball for the ten-pound throw ball.',
    days: [
      { key: 'strength', label: 'Max deadlift', sessionType: 'strength', focus: 'The 3-rep deadlift event — the Army\'s single strongest predictor of task performance.', exercises: ['deadlift', 'back-squat', 'sandbag-clean-press', 'plank'], prescription: 'Deadlift work up to a heavy 3 · squat 4×5 · carries · plank holds', minutes: 60 },
      { key: 'power', label: 'Power & throw', sessionType: 'strength', focus: 'Standing power throw — whole-body explosive extension.', exercises: ['standing-power-throw', 'box-jumps', 'kettlebell-swing', 'hand-release-pushup'], prescription: '5×3 explosive throws · jumps · swings · push-ups to standard', minutes: 45 },
      { key: 'sdc', label: 'Sprint–drag–carry', sessionType: 'cardio', focus: 'The anaerobic gut-check event: sprint, sled drag, lateral, carry, sprint.', exercises: ['sprint-drag-carry', 'sled-push', 'farmers-carry', 'shuttle-runs'], prescription: '5 rounds of the shuttle · full recovery between', minutes: 35 },
      { key: 'run', label: 'Two-mile run', sessionType: 'outdoor', focus: 'The aerobic event — pace judgement over 3.2 km.', exercises: ['easy-run', 'track-intervals'], prescription: 'Alternate: easy base run / 6×800 m at goal pace', minutes: 40 },
      { key: 'ruck', label: 'Ruck march', sessionType: 'outdoor', focus: 'Not tested, but the soldier\'s bread and butter — loaded distance.', exercises: ['rucking'], prescription: 'Build 6→12 km with a 15–20 kg pack, brisk', minutes: 90 },
    ],
    diet: {
      name: 'Field-ready fuelling',
      approach:
        'Military dietitians build around three solid meals plus carbohydrate around hard training, enough protein to recover, and relentless hydration. The goal is sustained energy and fast recovery, not being lean for a photo.',
      macroSlant: 'High carb around training, ~1.6–2 g/kg protein, fats filling the rest.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Oats with milk, eggs, a banana — carbs and protein before PT.' },
        { label: 'Lunch', detail: 'Chicken or beef, rice, plenty of vegetables.' },
        { label: 'Post-training', detail: 'Protein shake or milk plus fruit within the hour.' },
        { label: 'Dinner', detail: 'Fish or lean meat, potatoes or pasta, salad.' },
      ],
      notes: [
        'Hydration is the actual performance lever most people miss — drink to pale-yellow urine.',
        'On heavy ruck or run days, add carbs rather than cutting them.',
      ],
    },
  },
  {
    key: 'mil-seal-prep',
    category: 'military',
    name: 'Navy SEAL Prep',
    tagline: 'Swim, run and calisthenics pyramids — the BUD/S entry standard.',
    origin:
      'Before a candidate ever reaches BUD/S (Basic Underwater Demolition/SEAL training), the Navy publishes a physical-training guide to survive it: distance swimming with fins, timed runs, and enormous volumes of pull-ups, push-ups and sit-ups. The famous "PST" screening test gates entry.',
    ethos: 'The only easy day was yesterday. Volume, water confidence, and a mind that refuses to quit.',
    level: 'advanced',
    daysPerWeek: 6,
    blockWeeks: 12,
    icon: 'mindbody.seal',
    accent: '#00304E',
    authenticityNote:
      'Follows the real Naval Special Warfare prep structure: alternating swim/run days with calisthenics "pyramids". If you can\'t swim yet, that is the first thing to fix — water is non-negotiable for this one; otherwise substitute rowing and be honest that it isn\'t the same.',
    safetyNote:
      'Never train breath-holding or swim alone. Build running volume gradually — stress fractures end more SEAL dreams than any single event.',
    days: [
      { key: 'swim', label: 'Fin swim', sessionType: 'outdoor', focus: 'Distance swimming, ideally with fins — the discipline BUD/S is built on.', exercises: ['swimming-laps', 'swimming'], prescription: 'Build to 1,000–2,000 m continuous · sidestroke as taught', minutes: 45 },
      { key: 'pyramid', label: 'Calisthenics pyramid', sessionType: 'calisthenics', focus: 'Pull-ups, push-ups and sit-ups climbing and descending a pyramid.', exercises: ['pull-up', 'push-up', 'hanging-leg-raise', 'dip'], prescription: 'Pyramid 1-2-3-4-5-4-3-2-1: 1 pull-up : 2 push-ups : 3 sit-ups per step', minutes: 40 },
      { key: 'run', label: 'Timed run', sessionType: 'outdoor', focus: 'Four-mile run in boots-and-utilities pace — a PST staple.', exercises: ['easy-run', 'track-intervals'], prescription: 'Base run, or 6×800 m at goal PST pace', minutes: 40 },
      { key: 'grinder', label: 'The grinder', sessionType: 'calisthenics', focus: 'Nonstop mixed calisthenics — the "grinder" PT that never really ends.', exercises: ['eight-count-bodybuilder', 'push-up', 'flutter-kicks', 'burpees', 'low-crawl'], prescription: '20–30 min circuit, minimal rest, keep moving', minutes: 30 },
      { key: 'swim2', label: 'Water confidence', sessionType: 'outdoor', focus: 'Longer easy swim — treading, comfort, efficiency in the water.', exercises: ['swimming', 'swimming-laps'], prescription: '30–45 min easy, technique-focused', minutes: 40 },
      { key: 'ruck', label: 'Loaded run / ruck', sessionType: 'outdoor', focus: 'Boat crews carry everything. Loaded distance under a pack.', exercises: ['rucking', 'farmers-carry'], prescription: '8–12 km ruck with 15–20 kg', minutes: 90 },
    ],
    diet: {
      name: 'High-volume endurance fuelling',
      approach:
        'Six brutal sessions a week burn enormous energy. The prep diet is unapologetically high in carbohydrate for training volume, high in protein for the constant micro-damage, and heavy on fluids and electrolytes lost to swimming and running.',
      macroSlant: 'Very high carb, high protein, electrolytes prioritised.',
      sampleDay: [
        { label: 'Pre-dawn', detail: 'Banana + coffee before the first swim.' },
        { label: 'Breakfast', detail: 'Large oats + eggs + fruit after PT.' },
        { label: 'Lunch', detail: 'Big rice/pasta bowl with chicken and vegetables.' },
        { label: 'Snacks', detail: 'Milk, nuts, fruit, a second lunch if hungry — you will be.' },
        { label: 'Dinner', detail: 'Fish or beef, potatoes, greens; salt to taste.' },
      ],
      notes: [
        'Under-eating is the failure mode here, not over-eating. Match intake to the volume.',
        'Electrolytes matter as much as calories on double-session days.',
      ],
    },
  },
  {
    key: 'mil-spetsnaz',
    category: 'military',
    name: 'Spetsnaz Conditioning',
    tagline: 'Kettlebells, bodyweight circuits and combat readiness, Russian-style.',
    origin:
      'Soviet and Russian special-forces (Spetsnaz) conditioning leaned on minimal equipment and maximal repeatability: the kettlebell (girya), high-rep bodyweight work, running, and hand-to-hand systems like Combat Sambo. The emphasis was durability in the field with whatever was to hand.',
    ethos: 'Hard, simple, repeatable. Strength you can carry into a fight, not just a gym.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.spetsnaz',
    accent: '#5A5A5A',
    authenticityNote:
      'Inspired by the kettlebell-and-bodyweight tradition that produced modern hardstyle training, plus a Combat Sambo striking/grappling day. The cold-exposure folklore is left out — it belongs with a coach, not an app.',
    days: [
      { key: 'kb', label: 'Kettlebell strength', sessionType: 'strength', focus: 'Swings, cleans and presses — the girya as the whole gym.', exercises: ['kettlebell-swing', 'goblet-squat', 'sandbag-clean-press', 'overhead-carry'], prescription: 'Swings 10×10 · squats & presses 5×5 · carries', minutes: 45 },
      { key: 'circuit', label: 'Bodyweight circuit', sessionType: 'calisthenics', focus: 'High-rep pull-ups, push-ups and core — repeatable anywhere.', exercises: ['pull-up', 'push-up', 'eight-count-bodybuilder', 'hanging-leg-raise'], prescription: 'EMOM or ladders, 25–30 min', minutes: 30 },
      { key: 'sambo', label: 'Combat Sambo', sessionType: 'martial_arts', focus: 'Striking into grappling — the Russian hybrid combat sport.', exercises: ['wrestling-shots', 'sprawl-drill', 'ma-bag-round', 'ma-rolling-round'], prescription: 'Drilling + rounds, 30–40 min', minutes: 40 },
      { key: 'run', label: 'Loaded run', sessionType: 'outdoor', focus: 'Running with a light pack over mixed terrain.', exercises: ['trail-run', 'rucking'], prescription: '40–60 min steady, off-road if possible', minutes: 50 },
      { key: 'grind', label: 'Work capacity', sessionType: 'cardio', focus: 'Sledgehammer, ropes, sled — raw engine building.', exercises: ['sledgehammer-swing', 'battle-ropes', 'sled-push', 'tire-flip'], prescription: '5 rounds, 40 s work / 20 s rest per station', minutes: 30 },
    ],
    diet: {
      name: 'Simple and dense',
      approach:
        'Plain, calorie-dense food that travels: buckwheat (grechka) and other grains, eggs, dark bread, fatty fish, soups, and a lot of it. The archetype is cheap, filling and protein-adequate rather than fussy.',
      macroSlant: 'Balanced, grain-forward carbs, generous protein and fats.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Buckwheat porridge (grechka) with eggs.' },
        { label: 'Lunch', detail: 'Hearty soup (borscht/shchi), dark bread, meat.' },
        { label: 'Snack', detail: 'Tvorog (quark) or kefir with honey.' },
        { label: 'Dinner', detail: 'Fatty fish or beef, potatoes, pickled vegetables.' },
      ],
      notes: ['Grechka and quark are genuinely excellent, cheap staples — worth stealing.'],
    },
  },
  {
    key: 'mil-commando',
    category: 'military',
    name: 'Royal Marines Commando',
    tagline: 'Load-carriage endurance and the Commando spirit.',
    origin:
      'The British Royal Marines earn the green beret through the Commando Tests — among them a 30-mile yomp across Dartmoor under load and a punishing endurance course. Their training prizes carrying weight over distance while still being able to perform at the end.',
    ethos: 'Cheerfulness in the face of adversity. Strength of mind first, legs and lungs to match.',
    level: 'advanced',
    daysPerWeek: 5,
    blockWeeks: 12,
    icon: 'mindbody.commando',
    accent: '#0B3D2E',
    authenticityNote:
      'Built around load carriage ("yomping") and the endurance-course style of full-body work the Commando Tests demand. Progress pack weight and distance slowly and separately — never both in the same week.',
    safetyNote:
      'Loaded marching is the fastest route to overuse injury if rushed. Add ~10% distance or a little weight per week, never both, and look after your feet religiously.',
    days: [
      { key: 'yomp', label: 'The yomp', sessionType: 'outdoor', focus: 'Long loaded march — the Commando signature.', exercises: ['rucking', 'farmers-carry'], prescription: 'Build 8→25 km with a 15–25 kg pack', minutes: 150 },
      { key: 'endurance', label: 'Endurance course', sessionType: 'calisthenics', focus: 'Crawl, carry, climb — full-body work at the end of your legs.', exercises: ['low-crawl', 'bear-crawl', 'rope-climb', 'sandbag-carry', 'burpees'], prescription: 'Circuit of tunnels/carries/climbs, 30–40 min', minutes: 40 },
      { key: 'strength', label: 'Load strength', sessionType: 'strength', focus: 'The strength that makes a pack feel lighter.', exercises: ['back-squat', 'deadlift', 'overhead-carry', 'step-ups'], prescription: '5×5 squat & deadlift · loaded step-ups · carries', minutes: 55 },
      { key: 'run', label: 'Battle run', sessionType: 'outdoor', focus: 'Fast running fresh, then hills.', exercises: ['easy-run', 'hill-sprints'], prescription: '30–40 min run + 6–8 hill sprints', minutes: 45 },
      { key: 'grip', label: 'Grip & core', sessionType: 'calisthenics', focus: 'The rope-climb and fireman-carry qualities.', exercises: ['rope-climb', 'dead-hang', 'plank', 'hanging-leg-raise'], prescription: '4 rounds, quality over speed', minutes: 30 },
    ],
    diet: {
      name: 'Endurance under load',
      approach:
        'Big carbohydrate to fuel long time-on-feet, protein to protect the legs from constant loading, and no fear of calories on yomp days. Recovery food matters as much as the session.',
      macroSlant: 'High carb, solid protein, fats to top up energy.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Porridge with honey and nuts, plus eggs.' },
        { label: 'On the march', detail: 'Flapjack, dried fruit, plenty of water.' },
        { label: 'Recovery', detail: 'Milk + banana + a proper meal within two hours.' },
        { label: 'Dinner', detail: 'Meat or fish, big potatoes/pasta, vegetables.' },
      ],
      notes: ['Feet and fuel win yomps. Refuel on the move — do not arrive empty.'],
    },
  },

  // ═══════════════════════════ HISTORICAL ═══════════════════════════
  {
    key: 'his-roman-legion',
    category: 'historical',
    name: 'Roman Legionary',
    tagline: 'March, drill at the post, dig, and carry — like Vegetius wrote it.',
    origin:
      'The Roman army\'s training is described in Vegetius\' De Re Militari. Recruits marched 20 Roman miles in five hours under a load of 20+ kg (the "iter"), drilled sword and shield against a wooden post (the palus) with weapons heavier than the real thing, practised the pilum throw, swam, and built camps by digging every night.',
    ethos: 'The drill is bloodless battle; the battle is bloody drill. Discipline over heroics.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.roman',
    accent: '#8C1C13',
    authenticityNote:
      'Every day maps to a documented Roman practice: the loaded march (iter), weapons drill at the palus with a heavy wooden gladius, the pilum throw, swimming, and pick-and-shovel camp work (here, loaded carries and digging-pattern hinges).',
    days: [
      { key: 'iter', label: 'The march (iter)', sessionType: 'outdoor', focus: 'Loaded march at the military pace — the legion\'s core skill.', exercises: ['rucking', 'shield-carry-march'], prescription: 'Build toward 20 km with a 20 kg pack at a brisk, steady pace', minutes: 150 },
      { key: 'palus', label: 'Drill at the post', sessionType: 'martial_arts', focus: 'Sword and shield strikes on a post with a heavy training weapon.', exercises: ['sword-swing-drill', 'shield-carry-march', 'ma-shadow-round'], prescription: 'Rounds of cuts, thrusts and guard, weighted stick + load', minutes: 35 },
      { key: 'pilum', label: 'Pilum & power', sessionType: 'strength', focus: 'The javelin throw and the explosive hips behind it.', exercises: ['spear-thrust-drill', 'standing-power-throw', 'kettlebell-swing'], prescription: 'Throw practice + 5×3 power throws + swings', minutes: 40 },
      { key: 'muniment', label: 'Camp work', sessionType: 'strength', focus: 'Digging and carrying — the legion built a fort every night.', exercises: ['sandbag-carry', 'atlas-stone-lift', 'sandbag-clean-press', 'overhead-carry'], prescription: 'Carries + stone lifts + shovel-pattern hinges, 30–40 min', minutes: 40 },
      { key: 'swim', label: 'Swim', sessionType: 'outdoor', focus: 'Every legionary was expected to cross rivers.', exercises: ['swimming', 'swimming-laps'], prescription: '30–40 min continuous', minutes: 35 },
    ],
    diet: {
      name: 'The legionary ration',
      approach:
        'The Roman soldier ran on grain — wheat as bread and as porridge (puls) — supplemented with beans and lentils, cheese, olive oil, salted or fresh meat when available, and heavily watered wine (posca). Overwhelmingly plant- and grain-based, protein-adequate, and remarkably close to a modern high-carb endurance diet.',
      macroSlant: 'Grain-dominant carbs, legumes for protein, olive oil for fat.',
      sampleDay: [
        { label: 'Morning', detail: 'Wheat porridge (puls) or bread with olive oil.' },
        { label: 'Midday', detail: 'Bread, cheese, olives, watered wine (posca).' },
        { label: 'Evening', detail: 'Bean and lentil stew, bread, meat if on hand.' },
      ],
      notes: [
        'Genuinely close to a modern grain-and-legume endurance diet — no reinvention needed.',
        'Posca was vinegar-water, not a health tonic; plain water is fine.',
      ],
    },
  },
  {
    key: 'his-spartan-agoge',
    category: 'historical',
    name: 'Spartan Agoge',
    tagline: 'Running, wrestling and the spear — the warrior schooling of Sparta.',
    origin:
      'The agoge was Sparta\'s state upbringing: from boyhood, citizens trained in running, wrestling and pankration, spear-and-shield (hoplite) fighting, endurance, and toughness to hardship. The phalanx demanded strong legs, a durable grip on a heavy shield (aspis), and the stamina to fight in formation.',
    ethos: 'Come back with your shield or on it. Collective toughness over individual comfort.',
    level: 'advanced',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.spartan',
    accent: '#B22222',
    authenticityNote:
      'Keeps the documented pillars — running, wrestling/pankration, and hoplite spear-and-shield strength — and firmly drops the agoge\'s cruelty (deliberate starvation, beatings). Toughness here means hard training, not harm.',
    safetyNote: 'The historical agoge was abusive by design. This is not. Push effort, never punish yourself.',
    days: [
      { key: 'run', label: 'Endurance run', sessionType: 'outdoor', focus: 'Distance and hills — Spartans ran everywhere, in terrain.', exercises: ['trail-run', 'hill-sprints'], prescription: '40–60 min run + hill repeats', minutes: 55 },
      { key: 'pankration', label: 'Pankration', sessionType: 'martial_arts', focus: 'The Greek striking-and-grappling combat sport.', exercises: ['wrestling-shots', 'sprawl-drill', 'ma-bag-round', 'ma-rolling-round'], prescription: 'Drilling + rounds, 30–40 min', minutes: 40 },
      { key: 'hoplite', label: 'Shield & spear', sessionType: 'strength', focus: 'Carrying the heavy aspis and driving the spear in formation.', exercises: ['shield-carry-march', 'spear-thrust-drill', 'overhead-carry', 'club-swing-drill'], prescription: 'Loaded holds & marches + spear drills, 35 min', minutes: 35 },
      { key: 'strength', label: 'Warrior strength', sessionType: 'strength', focus: 'Legs and back for the phalanx wall.', exercises: ['back-squat', 'deadlift', 'walking-lunge', 'plank'], prescription: '5×5 squat & deadlift · lunges · planks', minutes: 55 },
      { key: 'conditioning', label: 'Stone & carry', sessionType: 'strength', focus: 'Lifting and carrying odd objects — everyday Spartan strength.', exercises: ['atlas-stone-lift', 'farmers-carry', 'sandbag-carry'], prescription: '5 rounds of lift + carry', minutes: 30 },
    ],
    diet: {
      name: 'The black broth & barley',
      approach:
        'Spartans ate simply and communally: barley bread and porridge, the infamous "black broth" (pork, blood and vinegar), figs, cheese, olives and wine. Plain, hearty, grain-and-legume based with modest meat — fuel for work, never indulgence.',
      macroSlant: 'Barley-based carbs, legumes and modest meat for protein, olives for fat.',
      sampleDay: [
        { label: 'Morning', detail: 'Barley porridge with figs and cheese.' },
        { label: 'Midday', detail: 'Barley bread, olives, lentils.' },
        { label: 'Evening', detail: 'Meat or bean stew, bread, a little wine.' },
      ],
      notes: ['The lesson is simplicity and sufficiency, not the literal black broth.'],
    },
  },
  {
    key: 'his-shaolin',
    category: 'historical',
    name: 'Shaolin Warrior Monk',
    tagline: 'Stances, forms, conditioning and stillness — the whole monk.',
    origin:
      'Shaolin monks trained (and train) a complete system: basics (jibengong) of stances and kicks, forms (taolu), body conditioning, flexibility, and — inseparable from the physical — Chan (Zen) meditation and qigong breathing. Endurance, patience and the deep horse stance (mǎbù) are foundational.',
    ethos: 'Chan and martial arts are one. Train the body to quiet the mind, and the mind to steady the body.',
    level: 'intermediate',
    daysPerWeek: 6,
    blockWeeks: 12,
    icon: 'mindbody.shaolin',
    accent: '#C8781E',
    authenticityNote:
      'Maps to the real Shaolin day: stance and basics work, forms/animal movement, gradual body conditioning, flexibility, and daily meditation and qigong. Iron-body conditioning is included only in its safe, gradual form.',
    safetyNote:
      'Body conditioning adapts tissue over months — light, patient, never on joints or bone. Deep stances build in seconds added slowly, not by grinding through pain.',
    days: [
      { key: 'stance', label: 'Stances & basics', sessionType: 'calisthenics', focus: 'The horse stance and basic kicks — the root of everything.', exercises: ['horse-stance', 'bow-stance', 'stance-flow', 'wall-sit'], prescription: 'Stance holds building over weeks + basics, 30–40 min', minutes: 35 },
      { key: 'forms', label: 'Forms & flow', sessionType: 'mindbody', focus: 'Taolu and animal movement — strength through motion.', exercises: ['animal-flow', 'stance-flow', 'sun-salutations'], prescription: 'Flowing sequences, 30–40 min', minutes: 35 },
      { key: 'conditioning', label: 'Body conditioning', sessionType: 'martial_arts', focus: 'Gradual, careful hardening and striking.', exercises: ['iron-body-conditioning', 'ma-bag-round', 'ma-shadow-round'], prescription: 'Light conditioning + rounds, patient progression', minutes: 30 },
      { key: 'strength', label: 'Bodyweight strength', sessionType: 'calisthenics', focus: 'Push, pull and core the monk way.', exercises: ['push-up', 'pull-up', 'handstand-hold', 'hanging-leg-raise'], prescription: 'Progressions, 4 rounds', minutes: 35 },
      { key: 'flexibility', label: 'Flexibility', sessionType: 'mindbody', focus: 'The splits-deep mobility Shaolin is known for.', exercises: ['hamstring-routine', 'adductor-routine', 'hip-mobility', 'deep-squat-hold'], prescription: 'Long holds, PNF where safe, 30 min', minutes: 30 },
      { key: 'chan', label: 'Chan & qigong', sessionType: 'meditation', focus: 'Seated Chan meditation and qigong breathing — half the art.', exercises: ['zazen', 'qigong', 'coherent-breathing'], prescription: '20–30 min seated + breathing', minutes: 25 },
    ],
    diet: {
      name: 'Monastery vegetarian',
      approach:
        'Shaolin monks eat a Buddhist vegetarian diet: rice and grains, tofu and soy, beans, plentiful vegetables, nuts and seeds, no meat and traditionally no strong-smelling alliums. Light, plant-based and remarkably sufficient for their workload thanks to volume and soy protein.',
      macroSlant: 'Plant-based: grain carbs, soy and legume protein, nuts for fat.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Rice congee with pickles and peanuts.' },
        { label: 'Lunch', detail: 'Rice, tofu, mixed vegetables, beans — the main meal.' },
        { label: 'Dinner', detail: 'Noodles or steamed buns with vegetables, lighter.' },
      ],
      notes: [
        'Vegetarian but protein-adequate through soy and legumes — pair the Vegetarian diet-plan style with it.',
        'If you keep meat, the lesson is still the huge vegetable volume.',
      ],
    },
  },
  {
    key: 'his-dagestan',
    category: 'historical',
    name: 'Dagestan Wrestler',
    tagline: 'Mountain running, rope climbs and relentless wrestling.',
    origin:
      'The mountains of Dagestan produce a stream of world-champion wrestlers and mixed martial artists. Their training is famously raw: freestyle wrestling and Combat Sambo from childhood, rope climbing, running and hiking at altitude in the mountains, bodyweight strength, and endless live grappling. Grip, conditioning and mental relentlessness define the style.',
    ethos: 'The mountain makes the man. Out-work, out-last, and never stop moving forward.',
    level: 'advanced',
    daysPerWeek: 6,
    blockWeeks: 12,
    icon: 'mindbody.wrestler',
    accent: '#3A6B35',
    authenticityNote:
      'Reflects the well-documented Dagestani mix — wrestling and Combat Sambo, rope climbs, mountain running and hiking, and bodyweight strength. You don\'t need a mountain; hills, stairs and an incline treadmill stand in.',
    safetyNote:
      'Live wrestling needs a partner, mats and control. Drill solo safely; spar only with supervision. Build the neck slowly.',
    days: [
      { key: 'wrestle', label: 'Wrestling', sessionType: 'martial_arts', focus: 'Shots, sprawls and live rounds — the heart of it.', exercises: ['wrestling-shots', 'sprawl-drill', 'ma-rolling-round', 'neck-bridge'], prescription: 'Drilling + rounds, 40 min', minutes: 40 },
      { key: 'mountain', label: 'Mountain run', sessionType: 'outdoor', focus: 'Running and hiking uphill — the Dagestani engine.', exercises: ['trail-run', 'hill-sprints', 'stairmaster'], prescription: '45–60 min hills, or hill repeats', minutes: 55 },
      { key: 'rope', label: 'Rope & grip', sessionType: 'calisthenics', focus: 'Rope climbs and hangs — the grip that wins ties.', exercises: ['rope-climb', 'dead-hang', 'pull-up', 'farmers-carry'], prescription: '6–10 climbs + grip work', minutes: 30 },
      { key: 'sambo', label: 'Combat Sambo', sessionType: 'martial_arts', focus: 'Adding strikes to the grappling base.', exercises: ['ma-bag-round', 'wrestling-shots', 'ma-rolling-round'], prescription: 'Striking + grappling rounds, 35 min', minutes: 35 },
      { key: 'strength', label: 'Bodyweight strength', sessionType: 'calisthenics', focus: 'Rugged, repeatable strength — no fancy kit.', exercises: ['push-up', 'pull-up', 'pistol-squat', 'hanging-leg-raise', 'eight-count-bodybuilder'], prescription: 'Circuits, 4–5 rounds', minutes: 35 },
      { key: 'conditioning', label: 'Work capacity', sessionType: 'cardio', focus: 'Never-tired conditioning — the Dagestani reputation.', exercises: ['burpees', 'sledgehammer-swing', 'battle-ropes', 'shuttle-runs'], prescription: '5 rounds, 45 s / 15 s', minutes: 30 },
    ],
    diet: {
      name: 'Mountain highland fare',
      approach:
        'Highland Caucasus eating: lamb and beef, khinkal (dumplings) and bread, dried meats, curd cheese, honey, and dried apricots and nuts. Hearty, protein-rich and calorie-dense for cold mountains and heavy work — with fasting discipline during Ramadan for many.',
      macroSlant: 'Protein-forward (lamb, beef, curd), grain dumplings for carbs, nuts for fat.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Curd cheese (tvorog), eggs, bread and honey.' },
        { label: 'Lunch', detail: 'Khinkal with lamb and garlic broth.' },
        { label: 'Snack', detail: 'Dried apricots, walnuts, dried meat.' },
        { label: 'Dinner', detail: 'Grilled lamb or beef, bread, vegetables.' },
      ],
      notes: ['Dense, protein-rich mountain food fits hard grappling volume — just watch total calories if you are not training twice a day.'],
    },
  },
  {
    key: 'his-aztec',
    category: 'historical',
    name: 'Aztec Eagle & Jaguar',
    tagline: 'Running couriers, weapon drills and warrior-school conditioning.',
    origin:
      'Mexica (Aztec) boys trained for war in the telpochcalli and elite calmecac schools: long-distance running (their couriers relayed messages across the empire), weapon drills with the macuahuitl (obsidian war-club) and the atlatl (spear-thrower), wrestling, load carrying, and agility. The Eagle and Jaguar warriors were the elite orders.',
    ethos: 'Born to war and to the sun. Endurance of the courier, ferocity of the jaguar.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.aztec',
    accent: '#1F6F5C',
    authenticityNote:
      'Built from documented Mexica warrior training — long running, war-club and atlatl (spear-thrower) drills, wrestling and load carrying. Weapons become club-swing and spear/throw drills; the ritual elements are left aside.',
    days: [
      { key: 'run', label: 'Courier run', sessionType: 'outdoor', focus: 'Long, steady distance — the Aztec messenger relay.', exercises: ['long-run', 'easy-run'], prescription: 'Build distance, mostly easy pace', minutes: 55 },
      { key: 'weapons', label: 'Club & atlatl', sessionType: 'martial_arts', focus: 'Macuahuitl swings and atlatl (spear-thrower) power.', exercises: ['club-swing-drill', 'spear-thrust-drill', 'standing-power-throw'], prescription: 'Swing & throw drills + power throws, 35 min', minutes: 35 },
      { key: 'wrestle', label: 'Wrestling & agility', sessionType: 'martial_arts', focus: 'Grappling and quick footwork for close combat.', exercises: ['wrestling-shots', 'sprawl-drill', 'agility-ladder', 'shuttle-runs'], prescription: 'Drills + agility, 30–35 min', minutes: 35 },
      { key: 'carry', label: 'Load carrying', sessionType: 'strength', focus: 'Carrying supplies and captives — practical strength.', exercises: ['sandbag-carry', 'farmers-carry', 'atlas-stone-lift', 'step-ups'], prescription: 'Carries + lifts + loaded step-ups, 35 min', minutes: 35 },
      { key: 'bodyweight', label: 'Warrior calisthenics', sessionType: 'calisthenics', focus: 'Bodyweight strength for the young warrior.', exercises: ['push-up', 'pull-up', 'bodyweight-squat', 'plank'], prescription: '4 rounds, moderate reps', minutes: 30 },
    ],
    diet: {
      name: 'The Mesoamerican triad',
      approach:
        'The Aztec diet was built on the "three sisters" — maize (as nixtamalised tortillas and atole), beans and squash — plus chilli, tomatoes, amaranth, chia, and lake protein like fish, insects and spirulina-rich algae. Almost entirely plant-based, high in fibre and complete when maize and beans are combined.',
      macroSlant: 'Maize + bean carbs (complete protein together), chia/amaranth, minimal fat.',
      sampleDay: [
        { label: 'Morning', detail: 'Atole (maize gruel) with amaranth, or tortillas.' },
        { label: 'Midday', detail: 'Beans and squash with tortillas and chilli.' },
        { label: 'Field food', detail: 'Chia and amaranth — the Aztec endurance ration.' },
        { label: 'Evening', detail: 'Maize, beans, tomatoes, fish or algae when available.' },
      ],
      notes: [
        'Maize + beans together form a complete protein — the backbone of the whole diet.',
        'Chia and amaranth are genuine endurance foods worth borrowing.',
      ],
    },
  },
  {
    key: 'his-viking',
    category: 'historical',
    name: 'Viking Strength',
    tagline: 'Lift, carry, row and wrestle like the Norse.',
    origin:
      'Norse life demanded raw functional strength: hauling and rowing longships across oceans, lifting stones (Iceland\'s lifting stones are legendary), farm labour, wrestling (glíma), and axe-and-shield combat. Strength was survival, and feats of lifting were a measure of a person.',
    ethos: 'Strong of arm and stout of heart. Earn your place at the oar and in the wall.',
    level: 'intermediate',
    daysPerWeek: 4,
    blockWeeks: 10,
    icon: 'mindbody.viking',
    accent: '#37587A',
    authenticityNote:
      'Draws on documented Norse physicality — stone lifting, rowing, carrying, glíma wrestling and axe-and-shield work. Rowing machine stands in for the longship; lifting stones become atlas-stone or sandbag lifts.',
    days: [
      { key: 'stone', label: 'Stone strength', sessionType: 'strength', focus: 'Lifting heavy, awkward objects — the Norse strength test.', exercises: ['atlas-stone-lift', 'deadlift', 'sandbag-clean-press', 'farmers-carry'], prescription: 'Stone/deadlift work + carries, 50 min', minutes: 50 },
      { key: 'row', label: 'Longship row', sessionType: 'cardio', focus: 'Rowing endurance — how Vikings crossed seas.', exercises: ['rowing-machine', 'battle-ropes'], prescription: '30–40 min rowing intervals', minutes: 40 },
      { key: 'glima', label: 'Glíma & axe', sessionType: 'martial_arts', focus: 'Norse wrestling and shield-and-axe drills.', exercises: ['wrestling-shots', 'sprawl-drill', 'club-swing-drill', 'shield-carry-march'], prescription: 'Grappling + weapon drills, 35 min', minutes: 35 },
      { key: 'labour', label: 'Farm labour', sessionType: 'strength', focus: 'Carrying, chopping, hauling — everyday Viking work.', exercises: ['sledgehammer-swing', 'sandbag-carry', 'overhead-carry', 'tire-flip'], prescription: '5 rounds of work-capacity stations', minutes: 35 },
    ],
    diet: {
      name: 'The Norse table',
      approach:
        'Vikings ate fish and meat (fresh, dried and smoked), barley and rye as bread and porridge, dairy (skyr, cheese), and preserved vegetables, berries and nuts. High in protein and fat from the sea and herds, with hearty grain carbs — well suited to heavy strength work.',
      macroSlant: 'High protein (fish, meat, skyr), grain carbs, generous fats.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Skyr (strained yoghurt) with berries, rye bread.' },
        { label: 'Lunch', detail: 'Smoked or fresh fish, barley, root vegetables.' },
        { label: 'Dinner', detail: 'Meat stew with barley and greens, cheese.' },
      ],
      notes: ['Skyr and oily fish are excellent, protein-dense staples to borrow.'],
    },
  },
  {
    key: 'his-samurai',
    category: 'historical',
    name: 'Samurai Bushidō',
    tagline: 'The sword, the bow, breath and discipline.',
    origin:
      'The samurai trained the martial arts (bujutsu): kenjutsu with the sword (endless suburi — repeated cutting practice), kyūdō archery, jūjutsu grappling, and — inseparable from technique — Zen meditation and breath control for a calm, decisive mind. Discipline and daily practice (keiko) over flashy strength.',
    ethos: 'Bushidō — the way of the warrior. A still mind and a practised blade.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.samurai',
    accent: '#4A2545',
    authenticityNote:
      'Follows the samurai\'s documented pillars — sword cutting practice (suburi), archery-style shoulder work, jūjutsu grappling, calisthenics, and Zen meditation/breathing. Use a bokken or weighted stick for suburi.',
    days: [
      { key: 'suburi', label: 'Sword cuts (suburi)', sessionType: 'martial_arts', focus: 'Hundreds of repeated overhead cuts — the samurai\'s daily practice.', exercises: ['sword-swing-drill', 'ma-shadow-round'], prescription: 'Sets of controlled cuts building to high volume, 30 min', minutes: 30 },
      { key: 'jujutsu', label: 'Jūjutsu', sessionType: 'martial_arts', focus: 'Close grappling and throws in armour.', exercises: ['wrestling-shots', 'sprawl-drill', 'ma-rolling-round', 'neck-bridge'], prescription: 'Drilling + rounds, 35 min', minutes: 35 },
      { key: 'strength', label: 'Body & core', sessionType: 'calisthenics', focus: 'Bodyweight strength and the trunk that drives the cut.', exercises: ['push-up', 'pull-up', 'hanging-leg-raise', 'plank'], prescription: '4 rounds, moderate', minutes: 30 },
      { key: 'archery', label: 'Bow & shoulders', sessionType: 'strength', focus: 'Kyūdō draws on shoulder and back endurance.', exercises: ['band-pull-apart', 'club-swing-drill', 'overhead-carry', 'rear-delt-fly'], prescription: 'High-rep shoulder endurance work, 30 min', minutes: 30 },
      { key: 'zen', label: 'Zen & breath', sessionType: 'meditation', focus: 'Seated Zen and breath control — the samurai\'s calm.', exercises: ['zazen', 'coherent-breathing', 'box-breathing'], prescription: '20–25 min seated + breathing', minutes: 25 },
    ],
    diet: {
      name: 'The warrior\'s table (washoku)',
      approach:
        'The samurai ate simply: brown rice, miso soup, fish, pickled and simmered vegetables, soy (tofu, natto), and green tea. Ichijū-sansai — "one soup, three sides" — is balanced, lean and easy to digest before training. Light, high in plant and marine protein, low in excess fat.',
      macroSlant: 'Rice carbs, fish and soy protein, minimal added fat.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Rice, miso soup, grilled fish, natto.' },
        { label: 'Lunch', detail: 'Rice bowl with fish or tofu and pickled vegetables.' },
        { label: 'Dinner', detail: 'Simmered vegetables, fish, rice, green tea.' },
      ],
      notes: ['"One soup, three sides" is a genuinely balanced template worth keeping.'],
    },
  },

  // ═══════════════════════════ LIFESTYLE ═══════════════════════════
  {
    key: 'life-office',
    category: 'lifestyle',
    name: 'Office Quick Ops',
    tagline: 'Five to fifteen minutes, no kit, beside your desk.',
    origin:
      'Sitting all day quietly undoes training and posture. This is the antidote: short, no-equipment bursts you can run in work clothes between meetings — the "exercise snacks" that research keeps finding do real good precisely because you\'ll actually do them.',
    ethos: 'The best workout is the one you don\'t skip. Frequent and short beats perfect and rare.',
    level: 'beginner',
    daysPerWeek: 5,
    blockWeeks: 8,
    icon: 'mindbody.office',
    accent: '#3D7EA6',
    authenticityNote:
      'Not a tradition — a practical routine built on the "exercise snack" evidence: brief, frequent, equipment-free movement through a sedentary day.',
    days: [
      { key: 'mobility', label: 'Deskside mobility', sessionType: 'mindbody', focus: 'Undo the chair — hips, spine and shoulders.', exercises: ['desk-mobility-flow', 'posture-drills', 'neck-shoulder-release'], prescription: '5–8 min, any time you\'ve been sitting too long', minutes: 8 },
      { key: 'strength', label: 'Chair & wall strength', sessionType: 'calisthenics', focus: 'Micro-strength with the furniture you have.', exercises: ['incline-pushup', 'chair-dip', 'wall-sit', 'step-ups'], prescription: '3 quick rounds, 10–12 reps each', minutes: 12 },
      { key: 'legs', label: 'Squat snack', sessionType: 'calisthenics', focus: 'A minute of squats every hour beats one big session.', exercises: ['bodyweight-squat', 'calf-raise-step', 'walking-lunge'], prescription: 'Sets scattered through the day, 10–15 min total', minutes: 12 },
      { key: 'reset', label: 'Breathing reset', sessionType: 'meditation', focus: 'Two minutes to drop stress between tasks.', exercises: ['box-breathing', 'physiological-sigh'], prescription: '2–5 min, as needed', minutes: 5 },
    ],
    diet: {
      name: 'Desk-day eating',
      approach:
        'The office diet trap is grazing, sugary coffee and a heavy lunch that crashes you at 3pm. The fix: a protein-forward breakfast, a lighter lunch to stay sharp, planned snacks instead of the biscuit tin, and water in reach all day.',
      macroSlant: 'Protein at each meal, steady carbs, fewer liquid calories.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Eggs or Greek yoghurt with fruit — protein to stay full.' },
        { label: 'Lunch', detail: 'Lean protein + salad/veg; go lighter on the heavy carbs to avoid the slump.' },
        { label: 'Snack', detail: 'Nuts, fruit or yoghurt — planned, not from the vending machine.' },
        { label: 'Dinner', detail: 'A normal balanced meal — you didn\'t burn as much sitting.' },
      ],
      notes: ['Watch liquid calories — the flavoured coffees add up faster than the food.'],
    },
  },
  {
    key: 'life-morning',
    category: 'lifestyle',
    name: 'Home Morning Kickstart',
    tagline: 'A 10–20 minute wake-up, no equipment, before the day starts.',
    origin:
      'A short morning routine sets posture, mood and momentum for the whole day — and getting it done first means nothing can bump it later. Bodyweight only, in your living room, in the time it takes coffee to brew.',
    ethos: 'Win the morning, win the day. Done beats perfect.',
    level: 'beginner',
    daysPerWeek: 6,
    blockWeeks: 8,
    icon: 'mindbody.morning',
    accent: '#E8A33D',
    authenticityNote: 'A practical modern routine — no equipment, home-friendly, scalable to your level.',
    days: [
      { key: 'flow', label: 'Wake-up flow', sessionType: 'mindbody', focus: 'Gently mobilise everything before it wakes up stiff.', exercises: ['sun-salutations', 'joint-cars', 'dynamic-warmup'], prescription: '8–12 min flowing movement', minutes: 12 },
      { key: 'strength', label: 'Bodyweight primer', sessionType: 'calisthenics', focus: 'A little push, pull-ish, squat and core to switch the body on.', exercises: ['push-up', 'bodyweight-squat', 'plank', 'glute-bridge'], prescription: '3 rounds, easy — leave energy for the day', minutes: 15 },
      { key: 'cardio', label: 'Heart-rate lift', sessionType: 'cardio', focus: 'Two or three minutes to feel awake and warm.', exercises: ['jumping-jacks', 'high-knees', 'mountain-climbers'], prescription: '3–5 min light intervals', minutes: 8 },
      { key: 'mind', label: 'Set the mind', sessionType: 'meditation', focus: 'A few breaths and an intention before the noise starts.', exercises: ['coherent-breathing', 'gratitude-practice'], prescription: '5 min seated', minutes: 5 },
    ],
    diet: {
      name: 'Break the fast well',
      approach:
        'A morning routine pairs with a breakfast that actually fuels the day: protein to stay full to lunch, some carbohydrate for energy, and fluids to rehydrate after the night. Keep it simple enough to repeat every day.',
      macroSlant: 'Protein-anchored breakfast, moderate carbs, hydrate first.',
      sampleDay: [
        { label: 'On waking', detail: 'A large glass of water before anything else.' },
        { label: 'Breakfast', detail: 'Eggs or yoghurt + oats or fruit — protein and slow carbs.' },
        { label: 'Coffee', detail: 'Fine — just after water and food, not instead of them.' },
      ],
      notes: ['If you train fasted, keep the session easy and eat soon after.'],
    },
  },
  {
    key: 'life-travel',
    category: 'lifestyle',
    name: 'Hotel & Travel WOD',
    tagline: 'A full workout in a hotel room, zero equipment.',
    origin:
      'Travel is where routines die: no gym, odd hours, a small room. This keeps training alive with bodyweight circuits that fit between a bed and a wall, need no kit, and can be done tired in a strange city.',
    ethos: 'No gym, no excuse. Maintain on the road; build when you\'re home.',
    level: 'beginner',
    daysPerWeek: 4,
    blockWeeks: 8,
    icon: 'mindbody.travel',
    accent: '#6C7A89',
    authenticityNote: 'A practical no-equipment template for maintaining training while travelling — not a tradition, just what works in a hotel room.',
    days: [
      { key: 'full', label: 'Full-body circuit', sessionType: 'calisthenics', focus: 'Hit everything in one round-based session.', exercises: ['push-up', 'bodyweight-squat', 'incline-pushup', 'plank', 'glute-bridge'], prescription: '4 rounds, 40 s work / 20 s rest', minutes: 25 },
      { key: 'sweat', label: 'Room cardio', sessionType: 'cardio', focus: 'Get the heart rate up without leaving the room.', exercises: ['burpees', 'mountain-climbers', 'high-knees', 'eight-count-bodybuilder'], prescription: '5 rounds, 45 s / 15 s', minutes: 20 },
      { key: 'lower', label: 'Legs & core', sessionType: 'calisthenics', focus: 'Single-leg strength needs no weights.', exercises: ['bulgarian-split-squat', 'walking-lunge', 'wall-sit', 'side-plank'], prescription: '3–4 rounds', minutes: 20 },
      { key: 'unwind', label: 'Travel unwind', sessionType: 'mindbody', focus: 'Undo the plane/car and sleep better in a strange bed.', exercises: ['static-stretch-routine', 'desk-mobility-flow', 'breathing-478'], prescription: '10–15 min before bed', minutes: 12 },
    ],
    diet: {
      name: 'Eating on the road',
      approach:
        'Travel eating derails on airport food, restaurant portions and skipped meals. The strategy: anchor each day on protein, pick the vegetable option when you can, carry a couple of stable snacks, and drink water against the dehydration of travel.',
      macroSlant: 'Protein at every meal, vegetables where possible, hydrate hard.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Eggs and fruit from the buffet — skip the pastry pile.' },
        { label: 'Lunch', detail: 'Grilled protein + salad; box half if the portion is huge.' },
        { label: 'Travel snack', detail: 'Nuts, jerky or fruit you brought — beats the vending machine.' },
        { label: 'Dinner', detail: 'Enjoy the local food — just lead with protein and veg.' },
      ],
      notes: ['A litre of water per flight leg fixes half of "travel fatigue".'],
    },
  },
];

export function specialProgramsFor(category: SpecialCategory): SpecialProgram[] {
  return SPECIAL_PROGRAMS.filter((p) => p.category === category);
}

export function findSpecialProgram(key: string): SpecialProgram | undefined {
  return SPECIAL_PROGRAMS.find((p) => p.key === key);
}

/** The `style` tag written onto a session started from a special-programme day. */
export function specialStyleTag(program: SpecialProgram, day: SpecialDay): string {
  return `special:${program.key}:${day.key}`;
}

/** Total planned minutes across a programme week. */
export function specialWeeklyMinutes(program: SpecialProgram): number {
  return program.days.reduce((sum, d) => sum + d.minutes, 0);
}
