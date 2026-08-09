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

export type SpecialCategory = 'military' | 'historical' | 'superhero' | 'lifestyle' | 'counters' | 'athlete';

export const SPECIAL_CATEGORY_META: Record<
  SpecialCategory,
  { label: string; blurb: string; icon: string }
> = {
  military: {
    label: 'Military, Tactical & Service',
    blurb: 'Selection-style preparation from real armed-forces and first-responder tests.',
    icon: 'mindbody.military',
  },
  historical: {
    label: 'Warriors of History',
    blurb: 'How legendary fighting cultures actually built their bodies.',
    icon: 'mindbody.samurai',
  },
  superhero: {
    label: 'Superheroes, Legends & Bodybuilders',
    blurb: 'Training inspired by heroes, screen icons and the greatest bodybuilders — real and fictional.',
    icon: 'mindbody.hero',
  },
  lifestyle: {
    label: 'Everyday Special Ops',
    blurb: 'Short, equipment-light routines for real life — desk, dawn, travel, a single cell.',
    icon: 'mindbody.morning',
  },
  counters: {
    label: 'Quick Counters & Urge-Busters',
    blurb: 'On-demand 2–10 minute protocols to ride out a craving or impulse and shift your focus.',
    icon: 'mindbody.focus',
  },
  athlete: {
    label: 'Elite Sport',
    blurb: 'How the best footballers, boxers, sprinters and swimmers actually train — in season and out.',
    icon: 'sport.gym',
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
  {
    key: 'his-mongol',
    category: 'historical',
    name: 'Mongol Horde',
    tagline: 'The three manly skills — wrestling, riding, archery — and endless endurance.',
    origin:
      'Genghis Khan\'s warriors conquered the largest contiguous empire in history on horseback. Trained from childhood in the "three manly skills" of wrestling (Bökh), horsemanship and archery, they could ride for days, shoot a bow accurately at full gallop, and live off their herds. Stamina, grip and durability over bulk.',
    ethos: 'Ride further, endure longer, loose the arrow true. The steppe rewards the relentless.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.mongol',
    accent: '#7A4B2A',
    authenticityNote:
      'Built on the documented "three manly skills" plus the Mongols\' legendary endurance. Standing archery and club/rein work stand in for horseback shooting; you don\'t need a horse, but do build the grip and the miles.',
    days: [
      { key: 'archery', label: 'Archery & draw strength', sessionType: 'strength', focus: 'The bow at the heart of the Mongol war machine — back and shoulder endurance.', exercises: ['archery', 'band-pull-apart', 'rear-delt-fly', 'dead-hang'], prescription: 'Archery practice + high-rep pulling, 35 min', minutes: 35 },
      { key: 'endurance', label: 'Steppe endurance', sessionType: 'outdoor', focus: 'Riding for days becomes running and rucking for hours.', exercises: ['long-run', 'rucking', 'trail-run'], prescription: 'Long, steady distance', minutes: 70 },
      { key: 'bokh', label: 'Bökh wrestling', sessionType: 'martial_arts', focus: 'Mongolian wrestling — grip, hips and balance.', exercises: ['wrestling-shots', 'sprawl-drill', 'ma-rolling-round', 'neck-bridge'], prescription: 'Drilling + rounds, 35 min', minutes: 35 },
      { key: 'grip', label: 'Rein & grip strength', sessionType: 'strength', focus: 'Hands and forearms that never tire — reins, bow and blade.', exercises: ['farmers-carry', 'dead-hang', 'club-swing-drill', 'overhead-carry'], prescription: 'Carries + hangs + swings, 30 min', minutes: 30 },
      { key: 'mobility', label: 'Saddle mobility', sessionType: 'mindbody', focus: 'Hips and back kept supple for a life in the saddle.', exercises: ['hip-mobility', 'deep-squat-hold', 'thoracic-mobility'], prescription: 'Long holds, 25 min', minutes: 25 },
    ],
    diet: {
      name: 'The nomad\'s herd',
      approach:
        'The Mongols ate almost entirely from their animals: dried meat (borts) ground fine, curd and cheese (aaruul), and fermented mare\'s milk (airag). Very high in protein and fat, very low in carbohydrate — the original portable nomad diet, built for the saddle rather than the plough.',
      macroSlant: 'Very high protein and fat (meat, dairy), minimal carbohydrate.',
      sampleDay: [
        { label: 'Morning', detail: 'Milk tea with dried curd (aaruul).' },
        { label: 'On the move', detail: 'Borts — dried, powdered meat rehydrated in water.' },
        { label: 'Evening', detail: 'Boiled mutton and offal, cheese, fermented mare\'s milk.' },
      ],
      notes: ['A very high-protein, low-carb template — add vegetables and be sensible about saturated fat.'],
    },
  },
  {
    key: 'his-gladiator',
    category: 'historical',
    name: 'Roman Gladiator',
    tagline: 'Weapon drills, a barley belly and the arena.',
    origin:
      'Gladiators trained at a school (ludus) under a lanista, drilling weapons endlessly against the wooden post. They were nicknamed hordearii — "barley men" — for a mostly plant-based barley-and-bean diet, and analysis of the Ephesus gladiator cemetery confirmed it, along with an ash-and-bone tonic drunk for recovery. They deliberately carried a layer of fat over their muscle as protection against cuts.',
    ethos: 'Trained to fight, fed to survive. Skill with the blade, a body built to take a hit.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.gladiator',
    accent: '#9C6B1E',
    authenticityNote:
      'Follows the ludus pattern — heavy weapon drills at the post, carrying and conditioning — and the genuinely documented barley-and-legume "hordearii" diet. Weapons become sword, spear and shield drills with a weighted stick.',
    days: [
      { key: 'armatura', label: 'Weapon drill (armatura)', sessionType: 'martial_arts', focus: 'Cuts, thrusts and guards at the post — the gladiator\'s daily work.', exercises: ['sword-swing-drill', 'shield-carry-march', 'spear-thrust-drill', 'ma-shadow-round'], prescription: 'Rounds of weapon drills, weighted stick, 40 min', minutes: 40 },
      { key: 'strength', label: 'Arena strength', sessionType: 'strength', focus: 'Full-body strength to move an opponent and heavy kit.', exercises: ['deadlift', 'atlas-stone-lift', 'sandbag-clean-press', 'overhead-carry'], prescription: 'Heavy lifts + carries, 50 min', minutes: 50 },
      { key: 'spar', label: 'Sparring', sessionType: 'martial_arts', focus: 'Live-ish combat practice against a partner or bag.', exercises: ['ma-bag-round', 'ma-sparring-round', 'wrestling-shots'], prescription: 'Controlled rounds, 30 min', minutes: 30 },
      { key: 'conditioning', label: 'Sand & carry', sessionType: 'strength', focus: 'Work capacity in the arena sand.', exercises: ['sandbag-carry', 'farmers-carry', 'tire-flip', 'sledgehammer-swing'], prescription: '5 rounds of stations', minutes: 30 },
      { key: 'legs', label: 'Footwork & legs', sessionType: 'calisthenics', focus: 'The legs and footwork that keep you off the blade.', exercises: ['walking-lunge', 'step-ups', 'agility-ladder', 'bodyweight-squat'], prescription: 'Footwork + leg circuit, 30 min', minutes: 30 },
    ],
    diet: {
      name: 'Barley men (hordearii)',
      approach:
        'Gladiators ate a mostly plant-based, carbohydrate-heavy diet of barley, beans and dried fruit — deliberately, to build an insulating layer of fat over the muscle that could absorb a cut. Modern bone analysis backs the barley-and-legume staple and a calcium-rich ash tonic for recovery.',
      macroSlant: 'Very high carb (barley, beans), plant protein, calcium emphasis.',
      sampleDay: [
        { label: 'Morning', detail: 'Barley porridge (puls) with beans.' },
        { label: 'Midday', detail: 'Bean and lentil stew, barley bread, dried fruit.' },
        { label: 'Recovery', detail: 'A calcium-rich drink (they used ash; you have milk/dairy).' },
        { label: 'Evening', detail: 'More barley and legumes; meat occasionally.' },
      ],
      notes: [
        'The historical goal was carrying fat as armour — not what most people want today.',
        'The barley-and-bean base is a genuinely solid, cheap endurance diet.',
      ],
    },
  },
  {
    key: 'his-ninja',
    category: 'historical',
    name: 'Shinobi (Ninja)',
    tagline: 'Stealth, agility, climbing and endurance over brute force.',
    origin:
      'The shinobi of feudal Japan trained for covert work, not the battlefield: extraordinary endurance (they were said to cover huge distances on foot), climbing and balance, swimming, agility and quiet movement, breath control, and just enough combat to escape. Lightness, control and stamina over size.',
    ethos: 'Unseen, unheard, untiring. The body as a tool for getting there and getting away.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.ninja',
    accent: '#2B2B3A',
    authenticityNote:
      'Reflects the shinobi emphasis on endurance, agility, climbing, balance and breath control rather than raw strength. Climbing and rope work stand in for wall-scaling; the covert lore is left as flavour.',
    days: [
      { key: 'agility', label: 'Agility & balance', sessionType: 'calisthenics', focus: 'Quiet feet, quick change of direction, control on unstable ground.', exercises: ['agility-ladder', 'balance-training', 'low-crawl', 'shuttle-runs'], prescription: 'Agility + balance circuit, 30 min', minutes: 30 },
      { key: 'endurance', label: 'Long-distance travel', sessionType: 'outdoor', focus: 'The shinobi\'s legendary ability to cover ground on foot.', exercises: ['long-run', 'trail-run'], prescription: 'Long, steady run', minutes: 60 },
      { key: 'climb', label: 'Climb & grip', sessionType: 'calisthenics', focus: 'Scaling walls — rope climbs, hangs and pulling strength.', exercises: ['rope-climb', 'climbing', 'pull-up', 'dead-hang'], prescription: 'Climbs + grip work, 30 min', minutes: 30 },
      { key: 'combat', label: 'Escape combat', sessionType: 'martial_arts', focus: 'Just enough striking and grappling to break free.', exercises: ['ma-shadow-round', 'wrestling-shots', 'sprawl-drill'], prescription: 'Drills + rounds, 30 min', minutes: 30 },
      { key: 'breath', label: 'Breath & stillness', sessionType: 'meditation', focus: 'Breath control and calm — staying hidden means staying still.', exercises: ['box-breathing', 'coherent-breathing', 'body-scan'], prescription: '20 min breath + stillness', minutes: 20 },
    ],
    diet: {
      name: 'Light and portable',
      approach:
        'Shinobi ate to stay light, quiet and energised: rice and millet, umeboshi (pickled plum) for stamina and against fatigue, miso, sesame, tofu and small dried rations that travelled well. Modest portions, plant-forward, nothing heavy to slow the body down.',
      macroSlant: 'Grain carbs, soy and sesame protein, very light on fat.',
      sampleDay: [
        { label: 'Morning', detail: 'Rice with umeboshi and miso soup.' },
        { label: 'On the move', detail: 'Dried rice balls, sesame, pickled plum.' },
        { label: 'Evening', detail: 'Rice or millet, tofu, vegetables, small portions.' },
      ],
      notes: ['Umeboshi and light, portable grains — the lesson is eating to stay agile, not full.'],
    },
  },
  {
    key: 'his-islamic-conquest',
    category: 'historical',
    name: 'Early Islamic Cavalry',
    tagline: 'The horse-archer, the sword and the endurance of the early conquests.',
    origin:
      'The armies of the early Islamic conquests (7th century) prized the "furusiyya" martial arts — horsemanship, archery and swordsmanship — alongside enormous endurance across desert distances. Warriors trained the bow from the saddle, the sword and spear on foot, wrestling for close quarters, and could cover punishing marches on little.',
    ethos: 'Discipline, mobility and endurance. Skill of the horseman, patience of the desert.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.islamic',
    accent: '#1B7A5A',
    authenticityNote:
      'Built on the documented furusiyya skills — archery, swordsmanship, wrestling and long-distance endurance. Standing archery and stick drills stand in for mounted work; you don\'t need a horse to build the bow arm and the miles.',
    days: [
      { key: 'archery', label: 'Archery & bow arm', sessionType: 'strength', focus: 'The bow was the decisive weapon — back and shoulder endurance to draw it all day.', exercises: ['archery', 'band-pull-apart', 'rear-delt-fly', 'dead-hang'], prescription: 'Archery practice + high-rep pulling, 35 min', minutes: 35 },
      { key: 'sword', label: 'Sword & spear', sessionType: 'martial_arts', focus: 'Cuts, thrusts and guards — the close-quarters skills.', exercises: ['sword-swing-drill', 'spear-thrust-drill', 'ma-shadow-round'], prescription: 'Weapon drills with a stick, 35 min', minutes: 35 },
      { key: 'endurance', label: 'Desert endurance', sessionType: 'outdoor', focus: 'Covering ground — the mobility that won campaigns.', exercises: ['long-run', 'rucking', 'trail-run'], prescription: 'Long steady distance, some loaded', minutes: 70 },
      { key: 'wrestle', label: 'Wrestling & grip', sessionType: 'martial_arts', focus: 'Close combat and the grip that holds reins, bow and blade.', exercises: ['wrestling-shots', 'sprawl-drill', 'farmers-carry', 'dead-hang'], prescription: 'Grappling drills + grip work, 30 min', minutes: 30 },
      { key: 'strength', label: 'Functional strength', sessionType: 'strength', focus: 'The base under every weapon and every mile.', exercises: ['deadlift', 'back-squat', 'overhead-carry', 'pull-up'], prescription: '5×5 on the main lifts', minutes: 50 },
    ],
    diet: {
      name: 'The desert table',
      approach:
        'The early Arabian diet was simple and portable: dates, barley and wheat breads, milk and yoghurt (laban), dried and fresh meat, and olive oil — foods that travelled and sustained long campaigns. Dates in particular were the perfect march ration: dense, quick energy with minerals.',
      macroSlant: 'Date & grain carbs, dairy and meat protein, olive oil fats.',
      sampleDay: [
        { label: 'Morning', detail: 'Dates and milk or laban, barley bread.' },
        { label: 'Midday', detail: 'Bread with olive oil, dried meat, yoghurt.' },
        { label: 'Evening', detail: 'Grilled or stewed meat, barley, dates to finish.' },
      ],
      notes: ['Dates + dairy is a genuinely excellent, portable endurance snack to borrow.'],
    },
  },
  {
    key: 'his-chinese-warrior',
    category: 'historical',
    name: 'Chinese Dynastic Warrior',
    tagline: 'Crossbow, spear, dao and the discipline of the imperial armies.',
    origin:
      'From the Qin and Han armies to later dynasties, the Chinese soldier drilled the crossbow (the era-defining weapon), the spear (qiang), the sabre (dao) and the staff, within rigid formation discipline. Military exams tested strength — drawing heavy bows, lifting weighted stones and wielding the long guandao — alongside skill.',
    ethos: 'Discipline in formation, mastery of the weapon, strength you can prove.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.chinese',
    accent: '#B23B3B',
    authenticityNote:
      'Reflects the weapons and the imperial military-exam strength tests (heavy bow pulls, stone lifting, the weighted guandao). Crossbow becomes archery/pulling; the guandao becomes club and staff drills.',
    days: [
      { key: 'crossbow', label: 'Crossbow & pulling', sessionType: 'strength', focus: 'The crossbow decided battles — heavy pulling strength to span and hold it.', exercises: ['archery', 'pull-up', 'barbell-row', 'dead-hang'], prescription: 'Archery + heavy rows and pulls, 40 min', minutes: 40 },
      { key: 'polearm', label: 'Spear & staff', sessionType: 'martial_arts', focus: 'The qiang and the staff — reach, footwork and endurance.', exercises: ['spear-thrust-drill', 'club-swing-drill', 'ma-shadow-round'], prescription: 'Polearm drills with a staff, 35 min', minutes: 35 },
      { key: 'stone', label: 'Stone & exam strength', sessionType: 'strength', focus: 'The imperial exams tested lifting weighted stones and the guandao overhead.', exercises: ['atlas-stone-lift', 'deadlift', 'overhead-carry', 'sandbag-clean-press'], prescription: 'Heavy lifts + carries, 50 min', minutes: 50 },
      { key: 'sabre', label: 'Dao & formation', sessionType: 'martial_arts', focus: 'Sabre cuts and the conditioning to hold a line.', exercises: ['sword-swing-drill', 'wrestling-shots', 'ma-bag-round'], prescription: 'Sabre drills + rounds, 30 min', minutes: 30 },
      { key: 'conditioning', label: 'March & conditioning', sessionType: 'outdoor', focus: 'Formation marches over distance.', exercises: ['rucking', 'long-run'], prescription: 'Loaded march building distance', minutes: 60 },
    ],
    diet: {
      name: 'The soldier\'s grain',
      approach:
        'The staple of the Chinese armies was grain — millet and rice — supplemented with soy (tofu, fermented beans), vegetables, and meat when available. High in carbohydrate to fuel marching and drilling, with plant and some animal protein. Tea throughout.',
      macroSlant: 'Millet & rice carbs, soy and meat protein, vegetables.',
      sampleDay: [
        { label: 'Morning', detail: 'Rice or millet congee with pickled vegetables.' },
        { label: 'Midday', detail: 'Rice, tofu or meat, stir-fried greens.' },
        { label: 'Evening', detail: 'Noodles or rice with vegetables and some meat.' },
      ],
      notes: ['Grain-and-soy is a cheap, effective base for high training volume.'],
    },
  },
  {
    key: 'his-zulu-impi',
    category: 'historical',
    name: 'Zulu Impi Warrior',
    tagline: 'Barefoot speed, the short spear and Shaka\'s brutal conditioning.',
    origin:
      'Shaka Zulu forged the impi into one of history\'s most formidable forces through relentless conditioning: warriors ran barefoot over rough ground for miles (reputedly 50+ km a day), fought at close range with the iklwa short stabbing spear and cowhide shield, and drilled the "horns of the buffalo" encirclement until it was instinct. Speed, endurance and close-combat aggression.',
    ethos: 'Outrun, encircle, close the distance. Conditioning as a weapon.',
    level: 'advanced',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.tribe',
    accent: '#8A5A2B',
    authenticityNote:
      'Built on the impi\'s documented hallmarks — extreme running endurance, barefoot/minimal footwork, the iklwa-and-shield close combat and fast encirclement drills. Barefoot running is optional and must be built into very gradually; keep shoes if in doubt.',
    safetyNote: 'The historical conditioning was brutal and sometimes lethal by design. Build running volume gradually, and progress barefoot/minimalist work over months, not days — the Achilles and calves need time.',
    days: [
      { key: 'run', label: 'Distance running', sessionType: 'outdoor', focus: 'The impi\'s superpower — covering huge distances on foot, fast.', exercises: ['long-run', 'trail-run', 'beach-sand-run'], prescription: 'Long steady runs, build distance patiently', minutes: 75 },
      { key: 'spear', label: 'Iklwa & shield', sessionType: 'martial_arts', focus: 'The short stabbing spear at close range behind the shield.', exercises: ['spear-thrust-drill', 'shield-carry-march', 'ma-shadow-round'], prescription: 'Stab-and-shield drills, 35 min', minutes: 35 },
      { key: 'agility', label: 'Footwork & speed', sessionType: 'cardio', focus: 'The fast, agile encirclement — the "horns" closing.', exercises: ['sprint-repeats', 'shuttle-runs', 'agility-ladder'], prescription: 'Sprints + agility, full recovery, 30 min', minutes: 30 },
      { key: 'strength', label: 'Warrior strength', sessionType: 'calisthenics', focus: 'Bodyweight and carry strength for the shield arm and the charge.', exercises: ['push-up', 'pull-up', 'overhead-carry', 'walking-lunge'], prescription: 'Bodyweight + carries, 4 rounds', minutes: 35 },
      { key: 'wrestle', label: 'Close combat', sessionType: 'martial_arts', focus: 'Grappling for when the spear is too close.', exercises: ['wrestling-shots', 'sprawl-drill', 'neck-bridge'], prescription: 'Grappling drills, 30 min', minutes: 30 },
    ],
    diet: {
      name: 'The homestead diet',
      approach:
        'The Zulu diet centred on maize (and earlier sorghum) as porridge, amasi (fermented soured milk — a prized staple), beans and vegetables, with beef reserved for feasts and ceremony. High in carbohydrate for the running, with fermented dairy and legume protein.',
      macroSlant: 'Maize/sorghum carbs, fermented dairy (amasi) and legume protein.',
      sampleDay: [
        { label: 'Morning', detail: 'Maize or sorghum porridge with soured milk (amasi).' },
        { label: 'Midday', detail: 'Beans, greens and maize.' },
        { label: 'Evening', detail: 'Maize porridge, vegetables, meat on feast days.' },
      ],
      notes: ['Fermented milk (amasi/kefir-style) plus maize and beans — a solid high-carb endurance base.'],
    },
  },
  {
    key: 'his-egypt-warrior',
    category: 'historical',
    name: 'Ancient Egyptian Warrior',
    tagline: 'The chariot archer, the khopesh and the spearmen of the Nile.',
    origin:
      'The New Kingdom Egyptian army combined fast chariot archers — the elite arm — with disciplined infantry wielding the khopesh (sickle-sword), spears and shields. Depictions show soldiers training with archery, wrestling, stick-fighting and rowing on the Nile. Scribes recorded harsh, systematic drill from a young age.',
    ethos: 'Order and discipline under the sun. The archer\'s eye, the spearman\'s wall.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.egypt',
    accent: '#C79A3B',
    authenticityNote:
      'Reflects the documented Egyptian military skills — archery, the khopesh and spear, wrestling (well attested in tomb art), stick-fighting and Nile rowing. The khopesh becomes a curved-stick sword drill; the chariot bow becomes standing archery.',
    days: [
      { key: 'archery', label: 'Chariot archery', sessionType: 'strength', focus: 'The elite arm — the composite bow, drawn again and again.', exercises: ['archery', 'band-pull-apart', 'rear-delt-fly', 'pull-up'], prescription: 'Archery + pulling endurance, 35 min', minutes: 35 },
      { key: 'khopesh', label: 'Khopesh & spear', sessionType: 'martial_arts', focus: 'The sickle-sword and spear of the infantry.', exercises: ['sword-swing-drill', 'spear-thrust-drill', 'shield-carry-march'], prescription: 'Weapon drills with a stick, 35 min', minutes: 35 },
      { key: 'wrestle', label: 'Wrestling & stick', sessionType: 'martial_arts', focus: 'Wrestling and stick-fighting — both vividly recorded in tomb paintings.', exercises: ['wrestling-shots', 'sprawl-drill', 'ma-shadow-round'], prescription: 'Grappling + stick drills, 30 min', minutes: 30 },
      { key: 'row', label: 'Nile rowing', sessionType: 'cardio', focus: 'Rowing the Nile — the army moved and trained on the river.', exercises: ['rowing-machine', 'battle-ropes'], prescription: '30–40 min rowing intervals', minutes: 40 },
      { key: 'strength', label: 'Builder\'s strength', sessionType: 'strength', focus: 'The carrying and lifting strength of a hard-labouring society.', exercises: ['deadlift', 'sandbag-carry', 'overhead-carry', 'back-squat'], prescription: 'Lifts + carries, 45 min', minutes: 45 },
    ],
    diet: {
      name: 'Bread and beer of the Nile',
      approach:
        'The Egyptian staple was emmer-wheat bread and barley beer (thick, low-alcohol, nourishing), with onions, garlic, pulses (fava beans, lentils), fish from the Nile, and fruit like dates and figs. Very high in carbohydrate, moderate plant and fish protein — the fuel of a grain civilisation.',
      macroSlant: 'Wheat & barley carbs, legume and fish protein, dates & figs.',
      sampleDay: [
        { label: 'Morning', detail: 'Emmer bread with onions, dates and figs.' },
        { label: 'Midday', detail: 'Fava beans or lentils, bread, garlic.' },
        { label: 'Evening', detail: 'Grilled Nile fish, bread, vegetables.' },
      ],
      notes: ['Bread, beans and fish is a genuinely balanced ancient template; skip the beer for training.'],
    },
  },

  // ═══════════════════════════ SUPERHERO & SCREEN LEGENDS ═══════════════════════════
  {
    key: 'hero-saitama',
    category: 'superhero',
    name: 'One Punch Man (Saitama)',
    tagline: '100 push-ups, 100 sit-ups, 100 squats, 10 km run — every single day.',
    origin:
      'In One Punch Man, Saitama becomes the strongest hero alive through one absurdly simple routine done every day without fail for three years: 100 push-ups, 100 sit-ups, 100 squats and a 10 km run — no air conditioning, no heating, three meals a day (a banana in the morning). The manga\'s joke is that there is no secret technique. The lesson is ruthless consistency.',
    ethos: 'No secret, no shortcut. Show up every single day and never stop. (Also: he went bald.)',
    level: 'advanced',
    daysPerWeek: 6,
    blockWeeks: 12,
    icon: 'mindbody.saitama',
    accent: '#F2C200',
    authenticityNote:
      'This is a fictional routine and it is NOT an optimal training plan — 100 daily reps and a 10 km run every day is enormous volume with no progressive overload. Its one real, valuable lesson is consistency. Treat it as a fun challenge to build up to, not a science-based programme.',
    safetyNote:
      'Do not attempt the full 100/100/100 + 10 km on day one — that is an overuse injury waiting to happen. Start with the scaled version, take genuine rest days despite the "every day" mythology, and stop if joints (not muscles) hurt.',
    days: [
      { key: 'hundred', label: 'The Daily Hundred', sessionType: 'calisthenics', focus: 'The canonical routine, once you\'ve earned the volume.', exercises: ['push-up', 'sit-up', 'bodyweight-squat', 'long-run'], prescription: '100 push-ups · 100 sit-ups · 100 squats · then a 10 km run', minutes: 90 },
      { key: 'scaled', label: 'Scaled Hundred (build-up)', sessionType: 'calisthenics', focus: 'For mortals working toward it — broken into sets, shorter run.', exercises: ['push-up', 'sit-up', 'bodyweight-squat', 'easy-run'], prescription: 'Reach 100 of each across the day in sets · 3–5 km run', minutes: 45 },
      { key: 'recovery', label: 'Active recovery', sessionType: 'mindbody', focus: 'Even a fictional hero\'s joints need this. Mobility on tired legs.', exercises: ['static-stretch-routine', 'hip-mobility', 'foam-rolling'], prescription: '20–30 min easy mobility', minutes: 25 },
    ],
    diet: {
      name: 'Three meals (and a banana)',
      approach:
        'Saitama\'s diet is a running joke — "three meals a day" and a banana before training — but the honest takeaway for this volume is simple, sufficient eating: enough total calories to fuel 100s of reps and 10 km daily, enough protein to recover, and no fussing. Under-eating, not over-eating, would break this routine.',
      macroSlant: 'Enough of everything — plenty of carbs for the volume, adequate protein.',
      sampleDay: [
        { label: 'Pre-run', detail: 'A banana (as canon demands) and water.' },
        { label: 'Breakfast', detail: 'Rice or oats, eggs, fruit after the session.' },
        { label: 'Lunch', detail: 'A full plate — protein, rice, vegetables.' },
        { label: 'Dinner', detail: 'Another balanced meal; you earned it.' },
      ],
      notes: ['With this much daily volume, the real risk is eating too little to recover.'],
    },
  },
  {
    key: 'hero-batman',
    category: 'superhero',
    name: 'Batman (Bruce Wayne)',
    tagline: 'Peak human: martial arts, strength, gymnastics and a trained mind.',
    origin:
      'In the comics, Bruce Wayne spent years travelling the world to become the peak of human ability: a master of many martial arts, elite raw strength, gymnastic agility, and the disciplined, detective mind to use it all. The "become Batman" ideal is total: fight, lift, move and think at the highest level.',
    ethos: 'It\'s not who I am underneath, but what I do that defines me. Train everything; master yourself.',
    level: 'advanced',
    daysPerWeek: 6,
    blockWeeks: 16,
    icon: 'mindbody.batman',
    accent: '#2C2C34',
    authenticityNote:
      'A blend of the disciplines the comics attribute to Batman — martial arts, heavy strength, gymnastics/agility, conditioning and mental training. Demanding by design; treat it as a long-term pursuit, not a six-week fix.',
    safetyNote: 'This is a lot of hard training across many disciplines. Sleep, eat and recover like it is part of the programme — because it is.',
    days: [
      { key: 'martial', label: 'Martial arts', sessionType: 'martial_arts', focus: 'Striking and grappling — the Bat is a master of many styles.', exercises: ['ma-shadow-round', 'ma-bag-round', 'wrestling-shots', 'ma-rolling-round'], prescription: 'Technical rounds, 45 min', minutes: 45 },
      { key: 'strength', label: 'Peak strength', sessionType: 'strength', focus: 'Heavy compound lifting for real-world power.', exercises: ['deadlift', 'back-squat', 'bench-press-barbell', 'pull-up'], prescription: '5×5 on the big lifts', minutes: 60 },
      { key: 'gymnastics', label: 'Gymnastics & agility', sessionType: 'calisthenics', focus: 'Bodyweight mastery — move like the cape is real.', exercises: ['muscle-up', 'handstand-hold', 'pistol-squat', 'box-jumps', 'l-sit'], prescription: 'Skill + power work, 40 min', minutes: 40 },
      { key: 'conditioning', label: 'Night conditioning', sessionType: 'cardio', focus: 'The engine for rooftop chases.', exercises: ['sprint-repeats', 'battle-ropes', 'shuttle-runs', 'burpees'], prescription: 'HIIT, 25–30 min', minutes: 30 },
      { key: 'endurance', label: 'Roadwork', sessionType: 'outdoor', focus: 'Base endurance underneath the power.', exercises: ['easy-run', 'trail-run'], prescription: '40–50 min steady', minutes: 45 },
      { key: 'mind', label: 'The detective\'s mind', sessionType: 'meditation', focus: 'Focus, calm and mental rehearsal — half of what makes the Bat.', exercises: ['visualization', 'box-breathing', 'zazen'], prescription: '20 min focus + breath', minutes: 20 },
    ],
    diet: {
      name: 'Peak-human fuelling',
      approach:
        'To train this hard while staying lean and agile, the plate is high in protein, built on whole foods, and timed around training — a clean, performance-first diet with enough carbohydrate to fuel the volume and enough discipline to stay fight-lean. (The actors who played him used exactly this: clean bulk to build, then lean out.)',
      macroSlant: 'High protein, whole-food carbs around training, controlled fats.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Eggs, oats and berries — protein and slow carbs.' },
        { label: 'Lunch', detail: 'Chicken or fish, rice, big vegetables.' },
        { label: 'Pre/post training', detail: 'Protein + fruit around the session.' },
        { label: 'Dinner', detail: 'Lean red meat or fish, potatoes, greens.' },
      ],
      notes: ['Recovery is a training variable here — sleep and food are non-negotiable at this volume.'],
    },
  },
  {
    key: 'hero-bruce-lee',
    category: 'superhero',
    name: 'Bruce Lee',
    tagline: 'Roadwork, obsessive core, grip and the fastest hands alive.',
    origin:
      'Bruce Lee trained with scientific obsession, documented in The Art of Expressing the Human Body: daily roadwork (running), enormous core work (he believed the midsection was central to everything — sit-ups, leg raises, the "flag"), grip and forearm training, isometrics and functional strength, extreme flexibility, and of course his own art, Jeet Kune Do — built around speed, directness and the famous one-inch punch.',
    ethos: 'Be like water. Absorb what is useful, discard what is not, add what is uniquely your own.',
    level: 'advanced',
    daysPerWeek: 6,
    blockWeeks: 12,
    icon: 'mindbody.brucelee',
    accent: '#C0392B',
    authenticityNote:
      'Drawn from Bruce Lee\'s genuinely documented training — daily running, very high-volume core work, grip and forearm training, functional strength and JKD striking. The "flag" here is the dragon flag he helped make famous.',
    days: [
      { key: 'jkd', label: 'JKD striking & speed', sessionType: 'martial_arts', focus: 'Directness and blinding speed — the heart of Jeet Kune Do.', exercises: ['ma-shadow-round', 'ma-bag-round', 'speed-bag', 'ma-jab-cross'], prescription: 'Speed-focused rounds, 40 min', minutes: 40 },
      { key: 'core', label: 'The core obsession', sessionType: 'calisthenics', focus: 'Lee trained abs daily and hard — the engine of every strike.', exercises: ['dragon-flag', 'hanging-leg-raise', 'sit-up', 'flutter-kicks', 'l-sit'], prescription: 'High-volume core circuit, 25 min', minutes: 25 },
      { key: 'roadwork', label: 'Roadwork', sessionType: 'outdoor', focus: 'Daily running — the base of his famous conditioning.', exercises: ['easy-run', 'sprint-repeats'], prescription: '30–40 min run + strides', minutes: 40 },
      { key: 'strength', label: 'Functional strength & grip', sessionType: 'strength', focus: 'Isometrics, forearms and the grip behind the one-inch punch.', exercises: ['pull-up', 'farmers-carry', 'dead-hang', 'wall-sit', 'overhead-carry'], prescription: 'Strength + isometric holds + grip, 35 min', minutes: 35 },
      { key: 'flexibility', label: 'Flexibility', sessionType: 'mindbody', focus: 'The mobility behind his high kicks and fluid movement.', exercises: ['pnf-stretching', 'hamstring-routine', 'hip-mobility', 'adductor-routine'], prescription: 'Long holds, PNF where safe, 30 min', minutes: 30 },
    ],
    diet: {
      name: 'Lean, frequent, protein-first',
      approach:
        'Lee ate to stay lean and explosive: small, frequent meals, a Chinese-influenced diet of rice, vegetables and lean protein, protein shakes and even blended raw-food drinks, plenty of tea, and a firm avoidance of refined, empty carbohydrate. The result was one of the most defined physiques of his era.',
      macroSlant: 'Protein-first, moderate rice carbs, minimal refined sugar.',
      sampleDay: [
        { label: 'Morning', detail: 'Protein shake, tea, a little fruit.' },
        { label: 'Lunch', detail: 'Rice, stir-fried vegetables, lean meat or fish.' },
        { label: 'Snacks', detail: 'Small frequent portions rather than big meals.' },
        { label: 'Dinner', detail: 'Vegetables and lean protein, light on refined carbs.' },
      ],
      notes: ['Small frequent meals and avoiding empty carbs — the lean-and-fast template.'],
    },
  },
  {
    key: 'hero-rocky',
    category: 'superhero',
    name: 'Rocky Balboa',
    tagline: 'Pre-dawn roadwork, one-arm push-ups and the heavy bag.',
    origin:
      'The Rocky montages are pure old-school fighter grit: pre-dawn roadwork up the museum steps, one-arm push-ups, heavy bag and speed bag, jump rope, chasing a chicken for agility, pounding sides of beef in the meat locker, sit-ups and pull-ups, and (infamously) raw eggs. No machines, no science — just relentless, gritty work.',
    ethos: 'It ain\'t about how hard you hit — it\'s about how hard you can get hit and keep moving forward.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.rocky',
    accent: '#7D5A3C',
    authenticityNote:
      'A faithful, gritty take on the training montages — roadwork, boxing, one-arm push-ups, sit-ups, pull-ups, jump rope and explosive step work. Please cook your eggs; raw eggs are a salmonella risk and no better than cooked for protein.',
    days: [
      { key: 'roadwork', label: 'Dawn roadwork', sessionType: 'outdoor', focus: 'The pre-dawn run that opens every montage.', exercises: ['easy-run', 'hill-sprints'], prescription: '30–40 min run + the steps (hills)', minutes: 40 },
      { key: 'boxing', label: 'Bag & speed bag', sessionType: 'martial_arts', focus: 'Heavy bag power and speed-bag rhythm.', exercises: ['ma-bag-round', 'speed-bag', 'ma-shadow-round', 'jump-rope'], prescription: 'Boxing rounds + rope, 35 min', minutes: 35 },
      { key: 'grit', label: 'Gritty strength', sessionType: 'calisthenics', focus: 'One-arm push-ups, sit-ups, pull-ups — no machines.', exercises: ['one-arm-pushup', 'push-up', 'sit-up', 'pull-up'], prescription: 'Old-school circuit to failure, 30 min', minutes: 30 },
      { key: 'power', label: 'Explosive & agility', sessionType: 'cardio', focus: 'Box jumps and the "chicken chase" agility.', exercises: ['box-jumps', 'shuttle-runs', 'agility-ladder', 'burpees'], prescription: 'Explosive circuit, 25 min', minutes: 25 },
      { key: 'meat', label: 'Odd-object power', sessionType: 'strength', focus: 'Pounding the meat locker — raw rotational and swing power.', exercises: ['sledgehammer-swing', 'sandbag-clean-press', 'tire-flip'], prescription: '5 rounds of heavy work', minutes: 30 },
    ],
    diet: {
      name: 'Old-school fighter food',
      approach:
        'The Rocky diet is simple, cheap fighter fare: lean meat, eggs (cooked!), whole grains and plenty of it, with weight-cut discipline before a fight. The lesson is whole-food sufficiency and hard training, not the raw-egg theatrics.',
      macroSlant: 'High protein, honest whole-food carbs, low on frills.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Eggs (cooked) and oats before roadwork.' },
        { label: 'Lunch', detail: 'Lean beef or chicken, rice or potatoes, greens.' },
        { label: 'Snack', detail: 'Cottage cheese or milk — cheap protein.' },
        { label: 'Dinner', detail: 'Meat or fish, pasta, vegetables.' },
      ],
      notes: ['Cook the eggs. Raw eggs carry a salmonella risk and offer no protein advantage.'],
    },
  },
  {
    key: 'hero-captain',
    category: 'superhero',
    name: 'The Super-Soldier (Captain America)',
    tagline: 'The actor-transformation build: heavy hypertrophy, clean bulk.',
    origin:
      'To turn a slim actor into Steve Rogers on screen, trainers use a classic physique-transformation blueprint: a hypertrophy split of heavy compound and accessory work, some athletic/gymnastic movement, and a high-protein calorie surplus (a "clean bulk"). It\'s the archetype of every "how the hero got jacked" magazine feature.',
    ethos: 'The serum was fiction; the work isn\'t. Progressive overload, protein and patience.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 12,
    icon: 'mindbody.shield',
    accent: '#1F3A93',
    authenticityNote:
      'A realistic hypertrophy transformation split — the actual method behind the on-screen superhero physiques — rather than anything super-serum. Progress the loads and eat in a surplus; that is the whole trick.',
    days: [
      { key: 'push', label: 'Push (chest/shoulders/triceps)', sessionType: 'strength', focus: 'Pressing volume for the chest and shoulders.', exercises: ['bench-press-barbell', 'overhead-press', 'db-incline-press', 'lateral-raise', 'triceps-pushdown'], prescription: '4×8–12, 1–2 from failure', minutes: 55 },
      { key: 'pull', label: 'Pull (back/biceps)', sessionType: 'strength', focus: 'The back width and thickness that fills the suit.', exercises: ['pull-up', 'barbell-row', 'seated-cable-row', 'barbell-curl', 'rear-delt-fly'], prescription: '4×8–12', minutes: 55 },
      { key: 'legs', label: 'Legs', sessionType: 'strength', focus: 'Don\'t skip them — the base of the whole physique.', exercises: ['back-squat', 'romanian-deadlift', 'walking-lunge', 'calf-raise-step'], prescription: '4×8–12', minutes: 55 },
      { key: 'athletic', label: 'Athletic day', sessionType: 'calisthenics', focus: 'Move like a hero, not just look like one.', exercises: ['muscle-up', 'box-jumps', 'plank', 'sprint-repeats'], prescription: 'Gymnastic + power work, 35 min', minutes: 35 },
      { key: 'arms', label: 'Arms & core', sessionType: 'strength', focus: 'The detail work — arms and midsection.', exercises: ['barbell-curl', 'overhead-cable-extension', 'hanging-leg-raise', 'cable-crunch'], prescription: '3–4×10–15', minutes: 40 },
    ],
    diet: {
      name: 'The clean bulk',
      approach:
        'Building the super-soldier look means a modest calorie surplus with high protein (around 2 g/kg), carbohydrate to fuel heavy lifting, and mostly whole foods so the gain is muscle rather than fluff. Eat consistently above maintenance and let progressive overload do the rest.',
      macroSlant: 'Calorie surplus, high protein (~2 g/kg), plenty of carbs.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Eggs, oats, whole milk, fruit.' },
        { label: 'Lunch', detail: 'Chicken or beef, rice, vegetables — big portion.' },
        { label: 'Post-workout', detail: 'Protein shake + banana.' },
        { label: 'Dinner', detail: 'Salmon or steak, potatoes, greens; dairy before bed.' },
      ],
      notes: ['Surplus + protein + progressive overload is the whole method — patience does the rest.'],
    },
  },
  {
    key: 'hero-arnold',
    category: 'superhero',
    name: 'Arnold — Golden Era',
    tagline: 'Sky-high volume, chest & back supersets, the pump.',
    origin:
      'Arnold Schwarzenegger built the most famous physique of the Golden Era on enormous volume and frequency — often twice-a-day training, six days a week, with punishing chest-and-back supersets, high sets and a relentless pursuit of "the pump". Full-body twice over across a split, and an almost artistic focus on shape and symmetry.',
    ethos: 'The pump is everything. Volume, frequency and a love of the work itself.',
    level: 'advanced',
    daysPerWeek: 6,
    blockWeeks: 12,
    icon: 'mindbody.bodybuilder',
    accent: '#C0A02C',
    authenticityNote:
      'Modelled on Arnold\'s documented Golden-Era volume split (chest/back supersets, big arms and legs, high sets). This is a LOT of volume — scale the sets down if you\'re not near-advanced or can\'t recover from it.',
    safetyNote: 'Golden-Era volume assumes years of training and near-full-time recovery. Cut the set count until your sleep, food and joints can keep up — soreness is not the goal.',
    days: [
      { key: 'chestback', label: 'Chest & Back (supersets)', sessionType: 'strength', focus: 'The signature superset — antagonists back to back for the ultimate pump.', exercises: ['bench-press-barbell', 'barbell-row', 'db-incline-press', 'pull-up', 'db-fly', 'db-pullover'], prescription: 'Superset chest/back · 4–5 sets × 8–12', minutes: 70 },
      { key: 'legs', label: 'Legs', sessionType: 'strength', focus: 'Squat-led leg volume.', exercises: ['back-squat', 'leg-press', 'romanian-deadlift', 'leg-extension', 'leg-curl-machine', 'standing-calf-machine'], prescription: '5 sets × 8–12, squats deep', minutes: 65 },
      { key: 'shoulders', label: 'Shoulders & Arms', sessionType: 'strength', focus: 'Boulder shoulders and the 21-inch arms.', exercises: ['overhead-press', 'lateral-raise', 'barbell-curl', 'skullcrusher', 'incline-db-curl', 'triceps-pushdown'], prescription: '4–5 sets each, high reps to the pump', minutes: 65 },
      { key: 'chestback2', label: 'Chest & Back (again)', sessionType: 'strength', focus: 'Golden-Era frequency — hit it twice a week.', exercises: ['db-incline-press', 'seated-cable-row', 'cable-crossover', 'lat-pulldown', 'push-up'], prescription: 'Superset · 4 sets × 10–12', minutes: 60 },
      { key: 'legs2', label: 'Legs & Calves', sessionType: 'strength', focus: 'Second leg hit; calves to failure.', exercises: ['front-squat', 'walking-lunge', 'seated-leg-curl', 'standing-calf-machine', 'seated-calf-machine'], prescription: '4–5 sets × 10–15', minutes: 55 },
      { key: 'arms2', label: 'Arms & Core', sessionType: 'strength', focus: 'More arms — you can never have enough, per Arnold.', exercises: ['ez-bar-curl', 'db-overhead-extension', 'hammer-curl', 'single-arm-pushdown', 'hanging-leg-raise', 'cable-crunch'], prescription: '4 sets × 10–15', minutes: 50 },
    ],
    diet: {
      name: 'Golden-Era bulk',
      approach:
        'The Golden-Era approach was a high-protein, whole-food surplus — plenty of meat, eggs, milk and dairy, with rice, potatoes and bread for the carbohydrate to fuel twice-daily training. Big, frequent meals; protein at every one; enough to grow.',
      macroSlant: 'High protein, high whole-food carbs, calorie surplus.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Eggs, oats, whole milk, fruit.' },
        { label: 'Lunch', detail: 'Beef or chicken, rice, vegetables — big portion.' },
        { label: 'Snack', detail: 'Milk and a protein shake between sessions.' },
        { label: 'Dinner', detail: 'Steak or fish, potatoes, greens; dairy before bed.' },
      ],
      notes: ['Whole-food surplus with protein at every meal — the timeless mass template.'],
    },
  },
  {
    key: 'hero-ronnie',
    category: 'superhero',
    name: 'Ronnie Coleman — Mass Monster',
    tagline: 'Heavy weight, high volume. "Yeah buddy, light weight!"',
    origin:
      'Ronnie Coleman won eight Mr. Olympia titles by pairing heavy powerlifting-style loads with bodybuilding volume — famously squatting and deadlifting weights most powerlifters wouldn\'t, for reps, on a high-frequency split. The mantra "everybody wanna be a bodybuilder but don\'t nobody wanna lift no heavy-ass weight" was the whole philosophy.',
    ethos: 'Heavy AND high-volume. Move serious weight, then do it again.',
    level: 'advanced',
    daysPerWeek: 6,
    blockWeeks: 12,
    icon: 'mindbody.bodybuilder',
    accent: '#2E5E3A',
    authenticityNote:
      'Modelled on Ronnie\'s heavy-plus-high-volume style. His loads were exceptional and hard-earned over decades — chase the structure and progression, not his numbers, and never his infamous injuries. Form before ego, always.',
    safetyNote: 'Ronnie\'s later joint problems are a cautionary tale. Do NOT chase maximal loads at high volume without impeccable form and long build-up — that combination is exactly what wears joints out.',
    days: [
      { key: 'back', label: 'Back (heavy)', sessionType: 'strength', focus: 'Deadlifts and heavy rows — the foundation of his frame.', exercises: ['deadlift', 'barbell-row', 'lat-pulldown', 'seated-cable-row', 'straight-arm-pulldown'], prescription: 'Work up heavy, then 4×8–10', minutes: 70 },
      { key: 'legs', label: 'Legs (heavy)', sessionType: 'strength', focus: 'Squats and presses with serious plates.', exercises: ['back-squat', 'leg-press', 'hack-squat', 'leg-extension', 'leg-curl-machine'], prescription: 'Heavy squats, then 4–5×10', minutes: 70 },
      { key: 'chest', label: 'Chest & Shoulders', sessionType: 'strength', focus: 'Heavy pressing volume.', exercises: ['bench-press-barbell', 'db-incline-press', 'overhead-press', 'lateral-raise', 'cable-crossover'], prescription: '4–5 sets × 8–12', minutes: 60 },
      { key: 'arms', label: 'Arms', sessionType: 'strength', focus: 'Heavy curls and extensions.', exercises: ['barbell-curl', 'skullcrusher', 'hammer-curl', 'triceps-pushdown', 'reverse-curl'], prescription: '4 sets × 10–12', minutes: 50 },
      { key: 'back2', label: 'Back & Traps', sessionType: 'strength', focus: 'Second back day — width and thickness.', exercises: ['barbell-row', 'pull-up', 'seated-cable-row', 'barbell-wrist-curl'], prescription: '4 sets × 10', minutes: 55 },
      { key: 'legs2', label: 'Legs & Calves', sessionType: 'strength', focus: 'Second leg day; hamstrings and calves.', exercises: ['romanian-deadlift', 'walking-lunge', 'seated-leg-curl', 'standing-calf-machine'], prescription: '4–5 sets × 10–12', minutes: 55 },
    ],
    diet: {
      name: 'Mass-monster fuelling',
      approach:
        'Ronnie ate for enormous size: very high protein spread across many daily meals, steady carbohydrate to fuel brutal sessions, and a big calorie surplus in the off-season. The principle for a normal lifter is the same at a saner scale — enough protein and enough total food to support the work.',
      macroSlant: 'Very high protein across many meals, high carbs, surplus.',
      sampleDay: [
        { label: 'Meal 1', detail: 'Eggs, grits/oats, whole milk.' },
        { label: 'Meal 2', detail: 'Chicken or beef, rice, vegetables.' },
        { label: 'Meal 3', detail: 'Protein shake + banana between sessions.' },
        { label: 'Meal 4', detail: 'Steak or fish, potatoes, greens.' },
      ],
      notes: ['Protein spread across frequent meals + a surplus — scale the portions to your own size.'],
    },
  },
  {
    key: 'hero-dorian',
    category: 'superhero',
    name: 'Dorian Yates — Blood & Guts',
    tagline: 'Low volume, brutal intensity. One all-out set to failure.',
    origin:
      'Dorian Yates won six Mr. Olympias with the opposite of Golden-Era volume: HIT (High-Intensity Training) — few sets, but each warm-up-then-ONE all-out working set taken to true failure, often beyond with forced reps. Brief, infrequent, savage sessions and long recovery. His "Blood & Guts" training redefined how much a single set could do.',
    ethos: 'One set, everything you have, then grow. Intensity over volume.',
    level: 'advanced',
    daysPerWeek: 4,
    blockWeeks: 10,
    icon: 'mindbody.bodybuilder',
    accent: '#4A2E6E',
    authenticityNote:
      'Modelled on Dorian\'s documented HIT split — thorough warm-ups then one all-out working set per exercise to genuine failure. Training to true failure is demanding on joints and recovery; a spotter and a real warm-up are non-negotiable.',
    safetyNote: 'One-set-to-failure only works with a full warm-up and good form under fatigue. Use a spotter on the big lifts, and don\'t take grinding, form-breaking reps — that\'s how the failure set turns into an injury.',
    days: [
      { key: 'chestbis', label: 'Chest & Biceps', sessionType: 'strength', focus: 'Warm up, then one all-out set each.', exercises: ['db-incline-press', 'chest-press-machine', 'cable-crossover', 'ez-bar-curl', 'incline-db-curl'], prescription: 'Warm-ups + 1 working set to failure each', minutes: 45 },
      { key: 'back', label: 'Back & Rear Delts', sessionType: 'strength', focus: 'The body part he was famous for — brutal, brief.', exercises: ['lat-pulldown', 'barbell-row', 'seated-cable-row', 'rear-delt-fly', 'deadlift'], prescription: 'Warm-ups + 1 all-out set each', minutes: 50 },
      { key: 'shoulderstri', label: 'Shoulders & Triceps', sessionType: 'strength', focus: 'Press and isolate, one hard set apiece.', exercises: ['db-shoulder-press', 'lateral-raise', 'rear-delt-fly', 'triceps-pushdown', 'skullcrusher'], prescription: 'Warm-ups + 1 working set to failure', minutes: 45 },
      { key: 'legs', label: 'Legs', sessionType: 'strength', focus: 'The hardest session — one everything-you-have set on the big lifts.', exercises: ['leg-extension', 'leg-press', 'hack-squat', 'seated-leg-curl', 'standing-calf-machine'], prescription: 'Warm-ups + 1 all-out set each', minutes: 55 },
    ],
    diet: {
      name: 'Lean-mass HIT fuelling',
      approach:
        'Dorian ate for quality mass: high protein, controlled carbohydrate timed around his brief, brutal sessions, and enough total food to recover from failure training without excess fat. Fewer, harder sessions still need real protein and real recovery fuel.',
      macroSlant: 'High protein, carbs timed around training, controlled surplus.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Eggs, oats, protein.' },
        { label: 'Lunch', detail: 'Chicken or turkey, rice, vegetables.' },
        { label: 'Pre/post', detail: 'Protein + fruit around the session.' },
        { label: 'Dinner', detail: 'Lean beef or fish, potatoes, greens.' },
      ],
      notes: ['Fewer sessions still demand full protein and recovery — intensity raises the recovery bill.'],
    },
  },

  // ═══════════════════════════ MILITARY / SERVICE (more) ═══════════════════════════
  {
    key: 'mil-firefighter',
    category: 'military',
    name: 'Firefighter CPAT',
    tagline: 'Loaded stairs, hose drags and forcible entry — the entry test.',
    origin:
      'The Candidate Physical Ability Test is the standardised entry test for firefighters: a stair climb in a weighted vest (plus extra shoulder weight), hose drag, equipment carry, ladder raise and extension, forcible entry (a sledge striking a beam), a search crawl, a victim drag and a ceiling breach — all in sequence, against the clock, in protective gear.',
    ethos: 'Someone\'s worst day is your job. Be strong enough to carry them out.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.firefighter',
    accent: '#C0392B',
    authenticityNote:
      'Each day maps to CPAT events — loaded stairs, drags and carries, forcible entry, and the search crawl — plus the strength base underneath them. Use a weighted vest or pack to make it real.',
    safetyNote: 'Train loaded stair and drag work progressively; the combination of load, heat gear and speed is exactly where real candidates get hurt.',
    days: [
      { key: 'stairs', label: 'Loaded stair climb', sessionType: 'cardio', focus: 'The signature CPAT event — stairs under a heavy vest.', exercises: ['stairmaster', 'incline-walk', 'step-ups'], prescription: '20–30 min stairs with a weighted vest/pack', minutes: 30 },
      { key: 'drag', label: 'Drag & carry', sessionType: 'cardio', focus: 'Hose drag, equipment carry, victim drag.', exercises: ['sled-push', 'sandbag-carry', 'farmers-carry', 'sprint-drag-carry'], prescription: '5 rounds of drags and carries', minutes: 30 },
      { key: 'entry', label: 'Forcible entry & overhead', sessionType: 'strength', focus: 'Sledge strikes and ladder-raise overhead strength.', exercises: ['sledgehammer-swing', 'overhead-carry', 'overhead-press', 'tire-flip'], prescription: 'Strike + overhead work, 35 min', minutes: 35 },
      { key: 'crawl', label: 'Search crawl & core', sessionType: 'calisthenics', focus: 'The low search crawl and the core that survives it.', exercises: ['low-crawl', 'bear-crawl', 'plank', 'hanging-leg-raise'], prescription: 'Crawl circuit + core, 25 min', minutes: 25 },
      { key: 'strength', label: 'Strength base', sessionType: 'strength', focus: 'The raw strength under every rescue.', exercises: ['deadlift', 'back-squat', 'pull-up', 'sandbag-clean-press'], prescription: '5×5 on the big lifts', minutes: 50 },
    ],
    diet: {
      name: 'Shift-worker fuelling',
      approach:
        'Firehouse life means long shifts, broken sleep and the temptation of communal comfort food. The working diet is protein-forward to hold muscle through irregular hours, steady carbohydrate for energy on call, real hydration, and planning around shifts rather than grazing on whatever\'s in the kitchen.',
      macroSlant: 'High protein, steady carbs, hydration-first, planned around shifts.',
      sampleDay: [
        { label: 'Shift start', detail: 'Protein + slow carbs (eggs, oats) to last.' },
        { label: 'Mid-shift', detail: 'Prepared meal: lean protein, rice, vegetables.' },
        { label: 'Call-ready snack', detail: 'Nuts, fruit, yoghurt — not the firehouse cake.' },
        { label: 'Post-shift', detail: 'A proper recovery meal and real hydration.' },
      ],
      notes: ['Sleep and hydration are the two levers shift work breaks — protect both.'],
    },
  },
  {
    key: 'mil-france-legion',
    category: 'military',
    name: 'French Foreign Legion — GCP',
    tagline: 'Marches, ruck loads and the airborne-commando standard.',
    origin:
      'The French Foreign Legion is legendary for its foot-marches and load-carriage endurance — culminating in the képi blanc march and, for the paratroopers (2e REP) and the elite GCP commandos (Groupement des Commandos Parachutistes), airborne insertion, long ruck marches, combat swimming, climbing and close combat. Their conditioning is built on carrying weight, over distance, without complaint.',
    ethos: 'March or die — the Legion\'s old motto turned into relentless load-bearing endurance.',
    level: 'advanced',
    daysPerWeek: 5,
    blockWeeks: 12,
    icon: 'mindbody.legion',
    accent: '#2A3D66',
    authenticityNote:
      'Built on the Legion / GCP hallmarks — ruck marching, running, combat swimming, climbing, obstacle work and close combat. The airborne and live parts are left out; what remains is the load-carriage and endurance base that underpins them.',
    safetyNote: 'Ruck marching under load is where most injuries happen — add distance OR weight, never both at once, and look after your feet obsessively.',
    days: [
      { key: 'ruck', label: 'Long ruck march', sessionType: 'outdoor', focus: 'The Legion\'s signature — carrying a heavy pack over long distance.', exercises: ['rucking', 'trekking'], prescription: 'Build 8→20 km with a 15–25 kg pack, steady', minutes: 120 },
      { key: 'run', label: 'Runs & intervals', sessionType: 'outdoor', focus: 'Base speed and staying power on foot.', exercises: ['long-run', 'track-intervals', 'hill-repeats'], prescription: 'Alternate long run / 8×400 m / hill reps', minutes: 45 },
      { key: 'obstacle', label: 'Obstacle & climb', sessionType: 'calisthenics', focus: 'The commando course — climbing, crawling, hauling yourself over.', exercises: ['rope-climb', 'pull-up', 'low-crawl', 'box-jumps', 'bear-crawl'], prescription: 'Obstacle-style circuit, 4 rounds', minutes: 40 },
      { key: 'swim', label: 'Combat swim', sessionType: 'cardio', focus: 'Water confidence and endurance — core to the commando standard.', exercises: ['swimming-laps'], prescription: '30–45 min continuous, mixed strokes', minutes: 40 },
      { key: 'combat', label: 'Strength & close combat', sessionType: 'strength', focus: 'Load-bearing strength and hand-to-hand.', exercises: ['deadlift', 'sandbag-clean-press', 'overhead-carry', 'wrestling-shots', 'ma-bag-round'], prescription: 'Lifts + carries + combat rounds, 50 min', minutes: 50 },
    ],
    diet: {
      name: 'Field-ration fuelling',
      approach:
        'Legion field feeding is dense and practical — bread, pasta and rice for carbohydrate, tinned and fresh meat and fish for protein, cheese and olive oil for fat, built to fuel long days on foot under load. Plenty of everything, hydration first.',
      macroSlant: 'High carbs for load-carriage, solid protein, generous fats.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Bread, cheese, eggs, coffee before a march.' },
        { label: 'Field meal', detail: 'Pasta or rice with tinned meat or fish.' },
        { label: 'Recovery', detail: 'Protein + carbs and real hydration after the ruck.' },
        { label: 'Dinner', detail: 'Meat or fish, potatoes/pasta, vegetables.' },
      ],
      notes: ['Carbohydrate and hydration are what keep you moving under load — don\'t under-fuel a ruck.'],
    },
  },

  // ═══════════════════════════ LIFESTYLE ═══════════════════════════
  {
    key: 'life-prison',
    category: 'lifestyle',
    name: 'The Cell Workout',
    tagline: 'Serious strength from bodyweight alone, in a tiny space.',
    origin:
      'With no equipment and a few square metres, incarcerated people have long built remarkable strength through high-volume calisthenics and progressions — popularised as "Convict Conditioning" and its "Big Six": push-up, squat, pull-up, leg raise, bridge and handstand push-up, each taken from an easy version to a brutally hard one. Proof that a gym is optional.',
    ethos: 'No weights, no machines, no excuses. Master your own bodyweight, one progression at a time.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 12,
    icon: 'mindbody.prison',
    accent: '#5C6670',
    authenticityNote:
      'Structured around the "Big Six" bodyweight progressions that make this style work. Every movement scales: start at a version you can do cleanly for reps, and only progress when it\'s easy. A pull-up bar (or a sturdy edge) is the one thing worth improvising.',
    safetyNote: 'Progress one step at a time and earn each harder variation — bridges and handstand work especially reward patience and punish rushing.',
    days: [
      { key: 'push', label: 'Push progression', sessionType: 'calisthenics', focus: 'Push-up to one-arm push-up — the upper-body press with no bar.', exercises: ['push-up', 'incline-pushup', 'one-arm-pushup', 'chair-dip'], prescription: 'Work your hardest clean variation, 4–5 sets', minutes: 30 },
      { key: 'legs', label: 'Squat progression', sessionType: 'calisthenics', focus: 'Bodyweight squat to pistol — single-leg strength anywhere.', exercises: ['bodyweight-squat', 'bulgarian-split-squat', 'pistol-squat', 'wall-sit'], prescription: 'Progressions, 4–5 sets', minutes: 30 },
      { key: 'pull', label: 'Pull progression', sessionType: 'calisthenics', focus: 'Rows to pull-ups to muscle-ups — you need something to hang from.', exercises: ['inverted-row', 'pull-up', 'chin-up', 'dead-hang'], prescription: 'Hardest clean variation, 4–5 sets', minutes: 30 },
      { key: 'core', label: 'Core & bridge', sessionType: 'calisthenics', focus: 'Leg raises and bridges — the Convict Conditioning spine work.', exercises: ['hanging-leg-raise', 'l-sit', 'superman-hold', 'plank'], prescription: 'Leg-raise + bridge progressions, 4 sets', minutes: 25 },
      { key: 'skill', label: 'Handstand & finisher', sessionType: 'calisthenics', focus: 'The handstand progression, then a high-volume finisher.', exercises: ['handstand-hold', 'pike-push-up', 'burpees', 'eight-count-bodybuilder'], prescription: 'Skill work + burpee finisher', minutes: 30 },
    ],
    diet: {
      name: 'Cheap, simple, protein-stretched',
      approach:
        'Training with nothing pairs with eating on nearly nothing: cheap, filling, protein-adequate staples — beans and rice, eggs, tinned fish, oats, peanut butter, milk powder. It proves you don\'t need supplements or expensive food to build a strong body, just enough protein and enough total calories.',
      macroSlant: 'Cheap protein (beans, eggs, tinned fish), grain carbs, minimal cost.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Oats with milk and peanut butter.' },
        { label: 'Lunch', detail: 'Rice and beans with tinned fish or eggs.' },
        { label: 'Snack', detail: 'Eggs or a scoop of milk powder — cheap protein.' },
        { label: 'Dinner', detail: 'More rice and beans, vegetables where you can.' },
      ],
      notes: ['Beans + rice is a complete-protein, dirt-cheap base — the whole diet can be built on it.'],
    },
  },
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

  // ═══════════════════════════ QUICK COUNTERS & URGE-BUSTERS ═══════════════════════════
  // Not weekly plans — pick the counter that fits the moment. The "days" are the
  // individual 2–10 minute tools; run one when the urge or the drift hits.
  {
    key: 'ctr-nicotine',
    category: 'counters',
    name: 'Nicotine Urge Buster',
    tagline: 'Ride out the 5-minute craving — it always passes.',
    origin:
      'A nicotine craving feels urgent but it is short: most peak and fade within 3–5 minutes whether or not you smoke. The evidence-based way through is the "4 Ds" — Delay, Deep-breathe, Drink water, Distract — plus movement and an oral substitute. You don\'t have to beat the urge, just outlast it.',
    ethos: 'Not "no" — "not now". Outlast the wave; each one you ride makes the next one weaker.',
    level: 'beginner',
    daysPerWeek: 7,
    blockWeeks: 12,
    icon: 'mindbody.lungs',
    accent: '#C0392B',
    authenticityNote:
      'These are standard, evidence-based smoking-cessation coping tools (the "4 Ds", urge surfing, physical activity, oral substitutes). They help you get through a craving — for quitting for good, combine them with proper support or nicotine-replacement therapy.',
    days: [
      { key: 'walk', label: 'Craving walk (the 4 Ds)', sessionType: 'cardio', focus: 'Delay + distract + move — the single most reliable counter to a craving.', exercises: ['craving-buster-walk', 'ten-minute-delay'], prescription: 'Walk briskly 5 min the moment the urge hits', minutes: 5 },
      { key: 'breathe', label: 'Urge-surf breathing', sessionType: 'meditation', focus: 'Deep-breathe and watch the craving crest and fall.', exercises: ['urge-surf-breathing', 'box-breathing'], prescription: '2–3 min slow breathing', minutes: 3 },
      { key: 'water', label: 'Water & cold splash', sessionType: 'meditation', focus: 'Drink water; a cold splash resets the moment.', exercises: ['cold-water-splash'], prescription: 'A glass of water + cold splash', minutes: 2 },
      { key: 'hands', label: 'Hands & mouth busy', sessionType: 'mindbody', focus: 'An oral/hand substitute for the ritual — gum, water, a toothpick, a task.', exercises: ['hands-busy-task'], prescription: 'Keep hands and mouth occupied 5 min', minutes: 5 },
      { key: 'halt', label: 'HALT check', sessionType: 'meditation', focus: 'Is it really nicotine — or hunger, stress, boredom, tiredness?', exercises: ['halt-check'], prescription: 'Run the HALT check, meet the real need', minutes: 3 },
    ],
    diet: {
      name: 'Craving-proof snacking',
      approach:
        'Quitting is easier on a steady blood sugar and a busy mouth. Keep crunchy, low-calorie substitutes to hand (carrot and celery sticks, sunflower seeds, sugar-free gum), drink water, and don\'t let yourself get too hungry — a blood-sugar dip feels a lot like a nicotine craving.',
      macroSlant: 'Steady blood sugar, crunchy oral substitutes, plenty of water.',
      sampleDay: [
        { label: 'Keep to hand', detail: 'Carrot & celery sticks, sunflower seeds — a crunchy substitute for the hand-to-mouth ritual.' },
        { label: 'Every craving', detail: 'A big glass of water first.' },
        { label: 'Meals', detail: 'Protein + fibre at each meal so blood sugar (and cravings) stay level.' },
      ],
      notes: ['A blood-sugar dip mimics a nicotine craving — regular balanced meals blunt both.'],
    },
  },
  {
    key: 'ctr-urge-reset',
    category: 'counters',
    name: 'Impulse Reset',
    tagline: 'A compulsive urge hits — redirect it and let it pass.',
    origin:
      'Any compulsive urge — porn/masturbation, doom-scrolling, a bad snack, a habit you\'re trying to change — works the same way: a cue triggers a craving that peaks and fades. You can\'t always stop the craving, but you can change what you do with it. The tools are neutral and behavioural: interrupt the cue, redirect the energy, delay, and let the wave pass.',
    ethos: 'The urge is not a command. Interrupt, redirect, delay — you\'re changing a habit, not fighting yourself.',
    level: 'beginner',
    daysPerWeek: 7,
    blockWeeks: 12,
    icon: 'mindbody.focus',
    accent: '#5E35B1',
    authenticityNote:
      'These are standard, non-judgemental habit-change and impulse-control tools (urge surfing, physical redirection, the 10-minute rule, changing your environment, HALT). They apply to any compulsive habit you\'ve decided you want to change. No moralising and no pseudoscience — just what actually helps ride out an urge.',
    days: [
      { key: 'move', label: 'Redirect the energy', sessionType: 'calisthenics', focus: 'Channel the impulse into a short hard burst — it breaks the loop fast.', exercises: ['burst-redirect'], prescription: '20 push-ups / squats / burpees, right now', minutes: 3 },
      { key: 'leave', label: 'Change your environment', sessionType: 'cardio', focus: 'Most urges are tied to a place and a screen — get up and leave it.', exercises: ['environment-change'], prescription: 'Stand up, change rooms or go outside, 5 min', minutes: 5 },
      { key: 'delay', label: 'The 10-minute rule', sessionType: 'meditation', focus: 'Not "no" — "not yet". Set a timer and let the wave pass.', exercises: ['ten-minute-delay', 'grounding-54321'], prescription: 'Set a 10-min timer, do something else', minutes: 10 },
      { key: 'surf', label: 'Urge surfing', sessionType: 'meditation', focus: 'Watch the urge like a wave — it rises, peaks and falls without you acting.', exercises: ['urge-surf-breathing'], prescription: '3–5 min observing the urge, breathing slow', minutes: 5 },
      { key: 'halt', label: 'HALT check', sessionType: 'meditation', focus: 'Compulsions spike on unmet needs — Hungry, Angry, Lonely, Tired?', exercises: ['halt-check', 'cold-water-splash'], prescription: 'Run HALT; meet the real need', minutes: 3 },
    ],
    diet: {
      name: 'Steady-state support',
      approach:
        'Impulse control is weakest when you\'re tired, hungry or running on sugar highs and crashes. Eating for steady energy — protein, fibre, not too much refined sugar — and staying hydrated makes urges quieter and your "no, not now" easier to hold.',
      macroSlant: 'Steady energy: protein + fibre, limit sugar spikes, hydrate.',
      sampleDay: [
        { label: 'Principle', detail: 'Protein + fibre at meals so energy (and willpower) stays level.' },
        { label: 'Avoid', detail: 'Big sugar spikes and crashes — they sap self-control.' },
        { label: 'Hydration', detail: 'Water regularly; mild dehydration frays focus and patience.' },
      ],
      notes: ['Willpower is partly physiological — sleep, steady blood sugar and hydration all strengthen it.'],
    },
  },
  {
    key: 'ctr-focus-shift',
    category: 'counters',
    name: 'Focus Shift',
    tagline: 'Distracted or spiralling — snap attention back in a couple of minutes.',
    origin:
      'When attention drifts, procrastination bites, or a thought loop won\'t let go, you don\'t need willpower — you need a pattern-break. A physiological sigh calms the body in seconds; grounding pulls you into the present; a two-minute movement snack resets the brain; and the "just start for 2 minutes" rule beats procrastination by shrinking the task.',
    ethos: 'Don\'t wait to feel focused — act, and focus follows. Small resets, on demand.',
    level: 'beginner',
    daysPerWeek: 7,
    blockWeeks: 12,
    icon: 'mindbody.focus',
    accent: '#1565C0',
    authenticityNote:
      'A toolkit of quick, well-supported attention resets — physiological sighs, sensory grounding, brief movement, and the two-minute start rule. Use one when you notice you\'ve drifted; none takes more than a few minutes.',
    days: [
      { key: 'sigh', label: 'Physiological sigh', sessionType: 'meditation', focus: 'Two double-inhales and long exhales — the fastest way to drop arousal and refocus.', exercises: ['energy-reset-breath', 'box-breathing'], prescription: '3–5 breaths, then back to the task', minutes: 2 },
      { key: 'ground', label: '5-4-3-2-1 grounding', sessionType: 'meditation', focus: 'Pull attention out of the loop and into the room.', exercises: ['grounding-54321'], prescription: 'Work through the five senses, 2–3 min', minutes: 3 },
      { key: 'move', label: 'Movement snack', sessionType: 'calisthenics', focus: 'A two-minute burst re-oxygenates the brain and breaks the stall.', exercises: ['burst-redirect', 'desk-mobility-flow'], prescription: '2 min of movement, then start', minutes: 3 },
      { key: 'start', label: 'The 2-minute start', sessionType: 'meditation', focus: 'Beat procrastination by promising just two minutes — starting is the hard part.', exercises: ['ten-minute-delay'], prescription: 'Commit to 2 minutes on the task; usually you continue', minutes: 2 },
      { key: 'reset', label: 'Power-pose reset', sessionType: 'mindbody', focus: 'Reset posture and state before a task you\'re avoiding.', exercises: ['power-pose-reset'], prescription: '2 min standing tall, then begin', minutes: 2 },
    ],
    diet: {
      name: 'Fuel for focus',
      approach:
        'Attention runs on steady glucose, hydration and well-timed caffeine. Avoid the big-lunch crash, keep water in reach, and use caffeine early rather than late (and not so much it wrecks your sleep, which is where focus really comes from).',
      macroSlant: 'Steady glucose, hydration, caffeine used early not late.',
      sampleDay: [
        { label: 'Focus blocks', detail: 'Protein + slow carbs beforehand — avoid the heavy, crash-inducing meal.' },
        { label: 'Hydration', detail: 'Water within reach; even mild dehydration dents concentration.' },
        { label: 'Caffeine', detail: 'Earlier in the day, moderate — late caffeine steals the sleep that focus depends on.' },
      ],
      notes: ['The biggest focus lever is sleep — no reset beats being rested.'],
    },
  },

  // ═══════════════ WARRIORS OF THE WORLD — cultures beyond the usual canon ═══════════════
  {
    key: 'his-inuit-hunter',
    category: 'historical',
    name: 'Inuit Arctic Hunter',
    tagline: 'Grip, cold and the strangest strength games on earth.',
    origin:
      'Across the Arctic — Greenland, Nunavut, Alaska, Chukotka — Inuit and Yupik hunters built strength for a world with no wood, no horses and no farms: hauling seal through ice, paddling qajaq (kayak) for hours, and dragging carcasses over pack ice. Their training survives openly as the Arctic Winter Games: the one-foot high kick, the Alaskan high kick, the knuckle hop, the arm pull, the airplane carry. Each event trains a survival capacity — the high kick was reputedly a signal to distant camps that a whale had been landed.',
    ethos: 'The cold does not negotiate. Be strong in the ways the ice asks for.',
    level: 'advanced',
    daysPerWeek: 4,
    blockWeeks: 10,
    icon: 'mindbody.inuit',
    accent: '#3E6E8E',
    authenticityNote:
      'Built from the documented Arctic Games events and the daily work behind them — kayak paddling, hauling, and extraordinary grip and core strength. The knuckle hop is genuinely punishing on the hands and is offered here as a plank/bear-crawl progression instead; nobody should start on their knuckles.',
    safetyNote:
      'The high-kick events are explosive with an awkward landing — warm up properly and progress the height slowly. Cold exposure belongs here culturally, but keep it brief, never alone, and never in open water.',
    days: [
      { key: 'paddle', label: 'Qajaq power', sessionType: 'cardio', focus: 'Kayak hauling — hours of paddling was the hunter\'s daily engine.', exercises: ['kayaking', 'rowing-machine', 'battle-ropes', 'db-one-arm-row'], prescription: 'Paddle or row 30–40 min steady, then pulling accessories', minutes: 45 },
      { key: 'grip', label: 'Ice-haul grip', sessionType: 'strength', focus: 'Dragging a seal across ice by hand — pure grip and posterior chain.', exercises: ['sled-push', 'farmers-carry', 'towel-hang', 'deadlift', 'plate-pinch'], prescription: 'Heavy drags + carries, hangs to failure, deadlift 4×5', minutes: 50 },
      { key: 'kick', label: 'High-kick games', sessionType: 'calisthenics', focus: 'The one-foot and Alaskan high kick — explosive single-leg power.', exercises: ['box-jumps', 'jump-squat', 'pistol-squat', 'hollow-rock', 'bear-crawl'], prescription: 'Jump and single-leg power work, 5×3, full rest', minutes: 40 },
      { key: 'cold', label: 'Cold & endurance', sessionType: 'outdoor', focus: 'Moving long and steady in cold air, as the hunt demanded.', exercises: ['trekking', 'brisk-walk', 'cold-exposure', 'breathwork'], prescription: 'Long cold-weather walk, brief cold finish, breathing', minutes: 60 },
    ],
    diet: {
      name: 'The Arctic table',
      approach:
        'The traditional Inuit diet is one of the most extreme on record: almost entirely marine mammal, fish, caribou and bird, with vanishingly little plant food for most of the year. It works because of what it includes — organ meats and skin supply the vitamin C that no vegetables were there to give, and oily fish supply enormous omega-3. Adapted here to what you can actually buy: very high fat and protein from oily fish and red meat, minimal carbohydrate, and deliberate vitamin C from the few berries and greens available.',
      macroSlant: 'Very high fat and protein from oily fish and red meat; carbs near zero.',
      sampleDay: [
        { label: 'Morning', detail: 'Oily fish and eggs — fat as the primary fuel, exactly as on the ice.' },
        { label: 'Midday', detail: 'Red meat with liver; the organs carry the vitamins the diet has no plants for.' },
        { label: 'Evening', detail: 'More oily fish, with the season\'s berries — the traditional vitamin C source.' },
      ],
      notes: [
        'Do not attempt a literal zero-carb Arctic diet: it worked alongside raw organ meat and a lifetime of adaptation, not as a fashion.',
        'The genuinely transferable lesson is oily fish — the omega-3 intake here is extraordinary and very well evidenced.',
      ],
    },
  },
  {
    key: 'his-amazon-tribe',
    category: 'historical',
    name: 'Amazon River Elite',
    tagline: 'Tree-climbing, blowgun stillness and huka-huka wrestling.',
    origin:
      'The peoples of the Amazon basin — Yanomami, Matsés, Ashaninka, and the Xingu nations — trained for a forest where the ground is a maze and the food is above you or in the water. Days meant hours of trekking under load, climbing for fruit and honey, swimming rivers, and drawing a bow or blowgun with absolute stillness. In the Upper Xingu, the huka-huka wrestling of the Kuarup festival is a formal test of a warrior: kneeling grips, explosive lifts, and enormous shoulder and neck strength.',
    ethos: 'The forest gives to whoever can reach it. Climb, carry, hold still, then explode.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.amazon',
    accent: '#2E6B4F',
    authenticityNote:
      'Drawn from anthropological accounts of Amazonian subsistence and from huka-huka wrestling, which is still practised and filmed today. Blowgun and bow work become archery and pulling endurance; climbing becomes rope and wall climbing.',
    days: [
      { key: 'climb', label: 'Canopy climbing', sessionType: 'sport', focus: 'Reaching fruit, honey and vantage — the forest is vertical.', exercises: ['rope-climb', 'climbing', 'pull-up', 'dead-hang', 'towel-hang'], prescription: 'Climbing + rope work, grip to failure, 40 min', minutes: 45 },
      { key: 'trek', label: 'Forest trek', sessionType: 'outdoor', focus: 'Hours of uneven ground under load — the real conditioning.', exercises: ['trail-run', 'trekking', 'rucking'], prescription: 'Long trek on uneven ground, light pack', minutes: 70 },
      { key: 'wrestle', label: 'Huka-huka', sessionType: 'martial_arts', focus: 'Kneeling Xingu wrestling — grip, shoulders, neck, explosive lift.', exercises: ['ma-wrestling', 'wrestling-shots', 'neck-bridge', 'sprawl-drill', 'ma-clinch-work'], prescription: 'Grappling rounds from the knees, 35 min', minutes: 40 },
      { key: 'bow', label: 'Bow & blowgun', sessionType: 'strength', focus: 'Stillness under tension — the drawn bow held steady.', exercises: ['archery', 'band-pull-apart', 'ring-row', 'farmers-hold', 'plank'], prescription: 'Archery + isometric holds, 30 min', minutes: 35 },
      { key: 'river', label: 'River crossing', sessionType: 'outdoor', focus: 'Swimming and paddling — rivers are the roads here.', exercises: ['swimming', 'kayaking', 'paddleboarding'], prescription: 'Swim or paddle 30–40 min', minutes: 40 },
    ],
    diet: {
      name: 'Forest and river',
      approach:
        'Amazonian diets are built on bitter manioc (cassava) as the staple carbohydrate, plantain and forest fruit, river fish daily, and game meat when the hunt succeeds. Fibre intake is enormous, added sugar is absent, and protein is lean. The nutritional signature that keeps showing up in studies of these communities is exceptional gut and metabolic health — a direct consequence of that fibre and the absence of processed food.',
      macroSlant: 'Starchy roots and plantain, daily river fish, huge fibre, no processed sugar.',
      sampleDay: [
        { label: 'Morning', detail: 'Starchy root or grain porridge with forest fruit.' },
        { label: 'Midday', detail: 'River fish with sweet potato and greens.' },
        { label: 'Evening', detail: 'Beans and root vegetables with whatever the hunt brought.' },
      ],
      notes: [
        'Cassava and plantain aren\'t in the food list, so the build uses sweet potato and the closest starchy roots — same nutritional role.',
        'The transferable part is the fibre: these diets run 60–100 g a day against a typical Western 15–20 g.',
      ],
    },
  },
  {
    key: 'his-plains-nation',
    category: 'historical',
    name: 'Plains Nations Warrior',
    tagline: 'Horsemanship, the runner\'s errand, and the Creator\'s Game.',
    origin:
      'The Lakota, Comanche, Cheyenne and their neighbours built a warrior culture around the horse after its arrival, and around running before it. Comanche horsemanship was rated by contemporaries as the finest light cavalry on the continent. Messages travelled by runners covering enormous distances on foot. Further east, the Haudenosaunee played lacrosse — the Creator\'s Game — in matches that could last days across miles of open ground, explicitly as preparation for war and as medicine.',
    ethos: 'Endurance first, courage in the open, and a game that is also a prayer.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.plains',
    accent: '#B4552D',
    authenticityNote:
      'Assembled from three well-documented pillars — horsemanship, long-distance running messengers, and lacrosse/stickball as martial preparation. "Plains Nations" covers many distinct peoples with their own traditions; this is a respectful composite, not any single nation\'s practice.',
    days: [
      { key: 'run', label: 'Messenger run', sessionType: 'outdoor', focus: 'Covering ground on foot, the errand that had to arrive.', exercises: ['long-run', 'cross-country-run', 'trail-run'], prescription: 'Long steady run, build distance weekly', minutes: 70 },
      { key: 'ride', label: 'Horsemanship', sessionType: 'sport', focus: 'The seat, the grip and the core of a rider.', exercises: ['horse-riding', 'bulgarian-split-squat', 'side-plank', 'db-lunge'], prescription: 'Ride if you can; otherwise hip and core work, 40 min', minutes: 45 },
      { key: 'game', label: 'The Creator\'s Game', sessionType: 'sport', focus: 'Lacrosse — running, catching and hitting for hours.', exercises: ['lacrosse', 'shuttle-runs', 'sport-passing-drill', 'agility-ladder'], prescription: 'Play, or run the drills: sprints, passing, agility', minutes: 50 },
      { key: 'bow', label: 'Bow & counting coup', sessionType: 'strength', focus: 'Archery from horseback and the nerve to close the distance.', exercises: ['archery', 'pull-up', 'band-pull-apart', 'rear-delt-fly'], prescription: 'Archery + pulling strength, 40 min', minutes: 40 },
      { key: 'wrestle', label: 'Wrestling & sprint', sessionType: 'martial_arts', focus: 'Close contest and the raw speed of a raid.', exercises: ['ma-wrestling', 'sprint-repeats', 'wrestling-shots', 'hill-sprints'], prescription: 'Grappling then short sprints, full recovery', minutes: 35 },
    ],
    diet: {
      name: 'Bison and the Three Sisters',
      approach:
        'Plains nutrition was built on bison — eaten fresh and preserved as pemmican, a dense mix of dried meat, rendered fat and berries that is one of the most efficient trail foods ever devised. Agricultural nations added the Three Sisters: maize, beans and squash grown together, which happen to form a complete protein when eaten together, a fact those farmers worked out centuries before anyone wrote down the amino acid profile.',
      macroSlant: 'Lean red meat, maize–bean–squash together, berries and rendered fat.',
      sampleDay: [
        { label: 'Morning', detail: 'Maize porridge with berries — the farming half of the tradition.' },
        { label: 'Midday', detail: 'Lean red meat with squash; the hunting half.' },
        { label: 'Evening', detail: 'Beans, maize and squash together — a complete protein by design.' },
      ],
      notes: [
        'The Three Sisters combination is genuinely elegant nutrition: maize is low in lysine, beans supply it, and squash rounds out the micronutrients.',
        'Pemmican\'s lesson still holds — fat plus protein plus a little fruit sugar is unbeatable trail food.',
      ],
    },
  },
  {
    key: 'his-raramuri',
    category: 'historical',
    name: 'Rarámuri Ultrarunner',
    tagline: 'The people who run. Hundreds of kilometres, in sandals.',
    origin:
      'The Rarámuri (Tarahumara) of the Copper Canyons in Chihuahua call themselves "those who run lightly". Their rarájipari is a running game in which teams kick a wooden ball along canyon trails for distances that regularly pass 100 km and sometimes run for two days without sleep — in huarache sandals cut from tyre rubber. Women run their own version, ariwete, with a hoop. Running is not sport here; it is transport, hunting (game is chased until it drops), ceremony and community, all at once.',
    ethos: 'Run lightly, run long, run together. The distance is not the point — arriving is.',
    level: 'advanced',
    daysPerWeek: 5,
    blockWeeks: 12,
    icon: 'mindbody.raramuri',
    accent: '#C6712F',
    authenticityNote:
      'Faithful to the real thing in structure — very high easy mileage, hills, minimal footwear and a social long run — and honest about the rest: their capacity is built over a lifetime at altitude from childhood. Treat the sandals as a multi-month progression, not a purchase.',
    safetyNote:
      'Minimal footwear is where people hurt themselves. Change one thing at a time, add no more than 10% distance a week, and stop at the first hint of a bone-deep shin or foot ache — that is a stress fracture talking.',
    days: [
      { key: 'long', label: 'Rarájipari long run', sessionType: 'outdoor', focus: 'The ball-kicking distance run — hours, at conversation pace.', exercises: ['long-run', 'trail-run'], prescription: 'Build 15 → 35 km, easy enough to talk throughout', minutes: 150 },
      { key: 'canyon', label: 'Canyon hills', sessionType: 'outdoor', focus: 'Copper Canyon has no flat — up and down is the terrain.', exercises: ['hill-repeats', 'trail-run', 'stair-climbing-outdoor'], prescription: 'Hill repeats on the steepest ground you have', minutes: 55 },
      { key: 'easy', label: 'Easy miles', sessionType: 'outdoor', focus: 'The unglamorous aerobic base under all of it.', exercises: ['easy-run', 'recovery-run'], prescription: 'Genuinely easy — if you can\'t chat, slow down', minutes: 45 },
      { key: 'feet', label: 'Feet & ankles', sessionType: 'mindbody', focus: 'What running in sandals actually demands of the foot.', exercises: ['ankle-mobility', 'single-leg-calf-raise', 'balance-training', 'deep-squat-hold'], prescription: 'Foot and ankle strength, barefoot on grass, 30 min', minutes: 30 },
      { key: 'strength', label: 'Runner\'s strength', sessionType: 'calisthenics', focus: 'The little that keeps a high-mileage runner intact.', exercises: ['bodyweight-squat', 'walking-lunge', 'nordic-negative', 'side-plank', 'glute-bridge'], prescription: 'Light, frequent, never to failure — 3 rounds', minutes: 30 },
    ],
    diet: {
      name: 'Pinole, chia and beans',
      approach:
        'The Rarámuri run those distances on a diet that is roughly 80–90% carbohydrate and almost entirely plant-based: maize as pinole (toasted, ground) and tortillas, pinto beans, squash, chia seeds, and iskiate — chia stirred into water with lime, drunk before and during long runs. Meat is occasional. It is a near-perfect endurance diet arrived at without a sports scientist in sight.',
      macroSlant: 'Very high carbohydrate from maize and beans, chia for the long runs.',
      sampleDay: [
        { label: 'Before the run', detail: 'Chia in water with lime — the traditional iskiate, drunk before setting off.' },
        { label: 'Midday', detail: 'Maize tortillas with pinto beans — the everyday staple pairing.' },
        { label: 'Evening', detail: 'Beans, squash and maize again; meat only now and then.' },
      ],
      notes: [
        'This is genuinely close to what modern endurance nutrition recommends: high carbohydrate, plant-heavy, minimal processing.',
        'Chia earns its reputation here honestly — fibre, omega-3 and a lot of water held in the gut on a long run.',
      ],
    },
  },
  {
    key: 'his-persian-pahlavan',
    category: 'historical',
    name: 'Persian Pahlavan',
    tagline: 'The Zurkhaneh — meel clubs, the sang, and strength as chivalry.',
    origin:
      'The Zurkhaneh ("House of Strength") is a Persian institution over a thousand years old, and UNESCO-recognised: a domed pit where men train Varzesh-e Pahlavani to the beat of a drum and recited Ferdowsi poetry. The tools are unmistakable — meel (heavy wooden clubs) swung overhead, the sang (a pair of enormous wooden shields) pressed while lying down, the kabbadeh (an iron bow) swung across the shoulders, takhteh shena push-ups on a board, and the whirling charkh. Crucially, the pahlavan is judged as much on humility and honour as on strength; the strongest man enters the pit last and bows lowest.',
    ethos: 'Strength without humility is nothing. Train to the drum, bow to the room.',
    level: 'intermediate',
    daysPerWeek: 4,
    blockWeeks: 10,
    icon: 'mindbody.persian',
    accent: '#1F6F8B',
    authenticityNote:
      'Follows the real Zurkhaneh session order — warm-up, shena push-ups, meel swinging, sang pressing, whirling, wrestling — with club swinging and dumbbell/plate work standing in for meel and sang. The koshti pahlavani wrestling that closes a real session is here as grappling.',
    days: [
      { key: 'meel', label: 'Meel & kabbadeh', sessionType: 'strength', focus: 'Club swinging — the shoulder conditioning the Zurkhaneh is famous for.', exercises: ['club-swing-drill', 'sledgehammer-swing', 'db-shoulder-press', 'band-pull-apart', 'wrist-roller'], prescription: 'Club swings in sets of 20–40, then pressing, 40 min', minutes: 45 },
      { key: 'shena', label: 'Takhteh shena', sessionType: 'calisthenics', focus: 'The board push-ups, done in long rhythmic sets to the drum.', exercises: ['push-up', 'diamond-push-up', 'pike-push-up', 'plank', 'hollow-rock'], prescription: 'High-rep push-up ladders in rhythm, 35 min', minutes: 40 },
      { key: 'sang', label: 'Sang pressing', sessionType: 'strength', focus: 'The great shields, pressed alternately while lying down.', exercises: ['db-bench-press', 'db-single-arm-press', 'floor-press-barbell', 'db-pullover'], prescription: 'Alternating presses, high volume, controlled', minutes: 45 },
      { key: 'koshti', label: 'Koshti & whirling', sessionType: 'martial_arts', focus: 'Pahlavani wrestling, and the charkh whirl that ends the session.', exercises: ['ma-wrestling', 'wrestling-shots', 'neck-bridge', 'stance-flow', 'balance-training'], prescription: 'Grappling then spins and balance work, 35 min', minutes: 40 },
    ],
    diet: {
      name: 'The pahlavan\'s table',
      approach:
        'Persian cooking is built on rice, lamb and chicken, yoghurt in everything (as doogh, as sauce, as marinade), enormous quantities of fresh herbs, pulses, walnuts and pomegranate, and dates for sweetness. For a training athlete it lands almost perfectly: substantial carbohydrate, good protein, fermented dairy, and a herb intake most diets never reach.',
      macroSlant: 'Rice and pulses for carbs, lamb and yoghurt for protein, herbs and walnuts throughout.',
      sampleDay: [
        { label: 'Morning', detail: 'Bread with fresh cheese, walnuts and dates — the classic Persian breakfast.' },
        { label: 'Midday', detail: 'Rice with lamb and herbs, yoghurt alongside.' },
        { label: 'Evening', detail: 'Pulses and chicken with pomegranate and greens.' },
      ],
      notes: [
        'Doogh (salted yoghurt drink) after training is a genuinely good recovery drink — protein, fluid and sodium at once.',
        'The herb volume in Persian cooking is a real micronutrient advantage, not a garnish.',
      ],
    },
  },
  {
    key: 'his-hindu-pehlwan',
    category: 'historical',
    name: 'Hindu Pehlwan (Akhara)',
    tagline: 'The mud pit: bethak, dand, gada and thousands of reps.',
    origin:
      'In the akharas of North India and Pakistan, pehlwani wrestlers have trained the same way for centuries: rising before dawn, sweeping the mud pit that is treated as sacred ground, and grinding out enormous volumes of bethak (Hindu squats) and dand (Hindu push-ups) — the legendary Gama Pehlwan, undefeated in a fifty-year career, was reported to do thousands of each daily. Add the gada (mace) swung behind the head, mugdar clubs, rope climbing, and hours of kushti wrestling in the mud. Celibacy, early nights and service to the guru were as much part of the regime as the training.',
    ethos: 'Sweep the pit before you use it. Volume, discipline and a body that never quits.',
    level: 'advanced',
    daysPerWeek: 6,
    blockWeeks: 12,
    icon: 'mindbody.pehlwan',
    accent: '#C2521E',
    authenticityNote:
      'The structure is authentic — daily high-volume bodyweight work, mace and club swinging, rope climbing and wrestling. The rep counts attributed to Gama are not a target: they belong to a man who did nothing else and had done it since childhood. Start at a tenth and build.',
    safetyNote:
      'The mace is genuinely dangerous behind the head. Learn it with a very light implement, and never swing near anyone. Daily training at this volume needs real sleep and real food, or it becomes injury.',
    days: [
      { key: 'bethak', label: 'Bethak (Hindu squats)', sessionType: 'calisthenics', focus: 'The endless squat — the foundation of every pehlwan.', exercises: ['bodyweight-squat', 'jump-squat', 'walking-lunge', 'wall-sit'], prescription: 'Ladder to 300–500 total reps, unbroken as you can', minutes: 40 },
      { key: 'dand', label: 'Dand (Hindu push-ups)', sessionType: 'calisthenics', focus: 'The flowing dive-bomber push-up, done in the hundreds.', exercises: ['push-up', 'pike-push-up', 'archer-push-up', 'sun-salutations'], prescription: 'Ladder to 200–300 total, keep the flow', minutes: 35 },
      { key: 'gada', label: 'Gada & mugdar', sessionType: 'strength', focus: 'The mace and clubs — shoulders built for the grip of a fight.', exercises: ['club-swing-drill', 'sledgehammer-swing', 'kettlebell-swing', 'wrist-roller', 'farmers-hold'], prescription: 'Mace/club swings both directions, 30 min', minutes: 35 },
      { key: 'kushti', label: 'Kushti wrestling', sessionType: 'martial_arts', focus: 'Hours in the mud — the reason for all the rest of it.', exercises: ['ma-wrestling', 'wrestling-shots', 'sprawl-drill', 'ma-clinch-work', 'neck-bridge'], prescription: 'Live wrestling rounds, 45 min', minutes: 50 },
      { key: 'rope', label: 'Rope & grip', sessionType: 'calisthenics', focus: 'Climbing the rope legless, the akhara\'s pulling test.', exercises: ['rope-climb', 'pull-up', 'towel-hang', 'dead-hang', 'hand-gripper'], prescription: 'Climbs and hangs, grip to failure, 30 min', minutes: 35 },
      { key: 'run', label: 'Dawn running', sessionType: 'outdoor', focus: 'The pre-dawn run that opens the akhara day.', exercises: ['easy-run', 'hill-repeats'], prescription: 'Easy 6–10 km before sunrise', minutes: 45 },
    ],
    diet: {
      name: 'The pehlwan khurak',
      approach:
        'The pehlwan\'s khurak (diet) is famous and enormous: litres of milk, hundreds of grams of almonds ground into thandai, ghee by the spoonful, chana (chickpeas), eggs, roti and seasonal fruit. Gama\'s reported intake ran to ten litres of milk and half a kilo of almonds a day. It is unapologetically a mass-gaining diet for a man wrestling for hours daily — scale it to your actual training, not to the legend.',
      macroSlant: 'Milk, almonds, ghee and chickpeas — very high calorie, dairy-led protein.',
      sampleDay: [
        { label: 'Dawn', detail: 'Milk with ground almonds — the thandai that opens the day.' },
        { label: 'Midday', detail: 'Chickpeas with roti and yoghurt; ghee stirred through.' },
        { label: 'Evening', detail: 'Milk, eggs and fruit — recovery for tomorrow\'s pit.' },
      ],
      notes: [
        'Scale it hard. The historic intakes belong to men wrestling four hours a day; copied at a desk they are simply a lot of fat gain.',
        'Milk and almonds is a genuinely strong protein pairing — this part of the tradition holds up.',
      ],
    },
  },
  {
    key: 'his-sikh-nihang',
    category: 'historical',
    name: 'Sikh Nihang (Gatka)',
    tagline: 'Shastar Vidya — the weapon arts of the Khalsa\'s standing army.',
    origin:
      'The Nihang are the Khalsa\'s traditional armed order, formed in the turbulence of 17th- and 18th-century Punjab and never disbanded. Their martial system, Shastar Vidya, teaches the sword, the chakram (throwing quoit), the spear and the staff as one continuous body of movement, practised publicly today as gatka — spinning stick work at speed. Nihang training pairs the weapons with horsemanship, and their gatka is drilled to a rhythm, in formation, at gatherings like Hola Mohalla.',
    ethos: 'A saint and a soldier in one body. Ready always, aggressive never first.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.sikh',
    accent: '#1E5FA8',
    authenticityNote:
      'Built from gatka and Shastar Vidya as they are actually taught — stick and sword forms, footwork, spear and staff, plus the horsemanship and wrestling that accompanied them. The weapons here become stick drills; the spiritual half of the tradition is the practitioner\'s own, not a training prescription.',
    days: [
      { key: 'gatka', label: 'Gatka stick work', sessionType: 'martial_arts', focus: 'The spinning stick — speed, wrists and continuous flow.', exercises: ['ma-weapon-forms', 'sword-swing-drill', 'club-swing-drill', 'wrist-mobility'], prescription: 'Stick forms both hands, building speed, 40 min', minutes: 45 },
      { key: 'footwork', label: 'Panthra footwork', sessionType: 'martial_arts', focus: 'The rhythmic stepping pattern all Nihang movement is built on.', exercises: ['ma-footwork-drill', 'ma-forms-kata', 'agility-ladder', 'stance-flow'], prescription: 'Footwork drills to a beat, 30 min', minutes: 35 },
      { key: 'spear', label: 'Spear & staff', sessionType: 'martial_arts', focus: 'The longer weapons — reach, and the shoulders to hold it.', exercises: ['spear-thrust-drill', 'ma-weapon-forms', 'overhead-carry', 'farmers-hold'], prescription: 'Spear and staff drills, 35 min', minutes: 35 },
      { key: 'strength', label: 'Warrior strength', sessionType: 'strength', focus: 'The base under the weapons: pull, press, carry.', exercises: ['deadlift', 'overhead-press', 'pull-up', 'farmers-carry', 'bodyweight-squat'], prescription: 'Compound lifts 4×5 then carries, 45 min', minutes: 50 },
      { key: 'wrestle', label: 'Wrestling & ride', sessionType: 'martial_arts', focus: 'Close contest and the saddle — both Nihang staples.', exercises: ['ma-wrestling', 'wrestling-shots', 'horse-riding', 'neck-bridge'], prescription: 'Grappling; ride if you can, hip work if not', minutes: 40 },
    ],
    diet: {
      name: 'Langar and the warrior\'s plate',
      approach:
        'Sikh food culture centres on langar — the free communal kitchen, vegetarian by design so anyone can eat. That means dal, chana, roti, rice, yoghurt and ghee, with plenty of vegetables. It is a solid vegetarian training diet: pulse-and-grain protein pairing at every meal, dairy for the rest, and cooking fat that doesn\'t apologise for itself.',
      macroSlant: 'Pulses plus grains at every meal, dairy protein, ghee for cooking fat.',
      sampleDay: [
        { label: 'Morning', detail: 'Yoghurt with roti and fruit.' },
        { label: 'Midday', detail: 'Dal and chana with rice — the langar plate.' },
        { label: 'Evening', detail: 'Lentils, greens and roti with milk.' },
      ],
      notes: ['Dal-and-roti is a complete protein pairing — the amino acids each is short of, the other supplies.'],
    },
  },
  {
    key: 'his-sumo',
    category: 'historical',
    name: 'Sumo Rikishi',
    tagline: 'Shiko, suriashi and butsukari — the oldest training day in sport.',
    origin:
      'Sumo\'s roots run back over 1,500 years as Shinto ritual before it was ever a sport, and the heya (stable) day has barely changed: rikishi rise at 5am and train for hours on an empty stomach. The staples are shiko — the great leg-raising stamp, done hundreds of times daily — suriashi sliding footwork, matawari splits that make Olympic gymnasts wince, teppo pole-striking for the arms, and butsukari-geiko, the brutal charging drill where a wrestler drives a senior across the ring until he physically cannot stand. Only then do they eat.',
    ethos: 'Lowest hips win. Train hungry, eat enormous, sleep after. Ritual before ego.',
    level: 'advanced',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.sumo',
    accent: '#7A2E2E',
    authenticityNote:
      'The session structure is the real heya morning: shiko, suriashi, matawari, teppo, then butsukari. What this programme deliberately does NOT copy is the weight-gain protocol — the chanko-plus-sleep cycle that builds a 150 kg rikishi is a career choice with a documented cost in diabetes and shortened life expectancy, and it has no place in a fitness app.',
    safetyNote:
      'Matawari splits are extreme and in the heya they are forced by a senior sitting on your back. Do not replicate that. Stretch to your own honest limit, warm, over months. Shiko is heavy on the hips — build the count gradually.',
    days: [
      { key: 'shiko', label: 'Shiko stamping', sessionType: 'calisthenics', focus: 'The leg-raise stamp: hips, balance and the ritual heart of sumo.', exercises: ['bodyweight-squat', 'walking-lunge', 'single-leg-rdl', 'balance-training', 'deep-squat-hold'], prescription: 'Shiko-style single-leg raises, 4×25 each side, slow', minutes: 35 },
      { key: 'suriashi', label: 'Suriashi & matawari', sessionType: 'mindbody', focus: 'Sliding footwork low to the clay, and sumo\'s famous hip flexibility.', exercises: ['adductor-routine', 'hip-mobility', 'deep-squat-hold', 'pnf-stretching', 'couch-stretch'], prescription: 'Low sliding footwork then 25 min of honest hip work', minutes: 40 },
      { key: 'butsukari', label: 'Butsukari-geiko', sessionType: 'strength', focus: 'The charging drill — drive a resisting body backwards until empty.', exercises: ['sled-push', 'sandbag-carry', 'zercher-squat', 'front-squat', 'bear-crawl'], prescription: 'Heavy sled drives to exhaustion, 6–8 rounds', minutes: 45 },
      { key: 'teppo', label: 'Teppo & grip', sessionType: 'strength', focus: 'Striking the pole, and the belt grip that decides most bouts.', exercises: ['sledgehammer-swing', 'push-press', 'farmers-hold', 'towel-hang', 'plate-pinch'], prescription: 'Alternating pole strikes then grip work, 35 min', minutes: 40 },
      { key: 'keiko', label: 'Wrestling keiko', sessionType: 'martial_arts', focus: 'Live bouts — the whole morning has been building to this.', exercises: ['ma-wrestling', 'ma-clinch-work', 'wrestling-shots', 'sprawl-drill', 'neck-bridge'], prescription: 'Live rounds from the tachi-ai, 40 min', minutes: 45 },
    ],
    diet: {
      name: 'Chanko-nabe, honestly scaled',
      approach:
        'Chanko-nabe is the rikishi\'s stew: broth with chicken, fish, tofu, egg and mountains of vegetables, eaten with rice and beer in quantities meant to add mass. The stew itself is genuinely excellent food — lean protein, huge vegetable volume, easily digestible. What makes rikishi enormous is not the stew but the protocol around it: training fasted, eating vast portions, then sleeping immediately. This programme takes the chanko and leaves the protocol behind.',
      macroSlant: 'Lean mixed protein and rice with a very high vegetable volume.',
      sampleDay: [
        { label: 'After training', detail: 'Chanko-style: chicken, tofu, egg and vegetables in broth with rice.' },
        { label: 'Second serving', detail: 'Fish and rice with more vegetables — the rikishi eats twice at one sitting.' },
        { label: 'Evening', detail: 'A lighter repeat of the same stew, protein and greens.' },
      ],
      notes: [
        'Eat chanko; skip the sumo weight protocol. The nap-after-a-huge-meal cycle is how rikishi gain mass, and it comes with a real, documented health cost.',
        'As a stew it is close to ideal training food — protein, vegetables and rice in one pot.',
      ],
    },
  },
  {
    key: 'his-maori-toa',
    category: 'historical',
    name: 'Māori Toa',
    tagline: 'Mau rākau, the waka paddle, and the haka as a war engine.',
    origin:
      'The Māori toa (warrior) trained with the taiaha — a long wooden staff fought with at both ends — and the patu, a short close-quarters club, in the discipline of mau rākau. Warfare was preceded by the haka: not a dance but a coordinated display of readiness, performed with the whole body and a great deal of breath. Between wars, the waka (canoe) demanded hours of synchronised paddling across open water, and life on Aotearoa meant hard walking over steep, broken country.',
    ethos: 'Stand with the feet of the land. Breath, voice and weapon as one movement.',
    level: 'intermediate',
    daysPerWeek: 4,
    blockWeeks: 10,
    icon: 'mindbody.maori',
    accent: '#175E54',
    authenticityNote:
      'Built on mau rākau, waka paddling and the physical demands of the haka — all living traditions today. Taiaha work here becomes staff drills. Haka itself is taonga (a cultural treasure) and is referenced with respect rather than prescribed as a workout.',
    days: [
      { key: 'rakau', label: 'Mau rākau', sessionType: 'martial_arts', focus: 'The taiaha — a staff fought at both ends, wrists and stance.', exercises: ['ma-weapon-forms', 'spear-thrust-drill', 'sword-swing-drill', 'stance-flow', 'horse-stance'], prescription: 'Staff forms and strikes, both sides, 40 min', minutes: 45 },
      { key: 'waka', label: 'Waka paddling', sessionType: 'cardio', focus: 'Hours of synchronised paddling across open water.', exercises: ['kayaking', 'rowing-machine', 'rowing-intervals', 'battle-ropes'], prescription: 'Paddle or row 35–45 min, find the rhythm', minutes: 45 },
      { key: 'haka', label: 'Haka conditioning', sessionType: 'cardio', focus: 'The deep stance, the whole-body strike and the breath behind the voice.', exercises: ['horse-stance', 'jump-squat', 'burpees', 'breathwork', 'wall-sit'], prescription: 'Deep-stance holds, explosive reps, breath work', minutes: 30 },
      { key: 'land', label: 'Broken country', sessionType: 'outdoor', focus: 'Moving fast over the steep, unforgiving terrain of home.', exercises: ['trail-run', 'hiking', 'hill-repeats', 'rucking'], prescription: 'Hill walking or trail running, 60 min', minutes: 60 },
    ],
    diet: {
      name: 'Kai from land and sea',
      approach:
        'Traditional Māori kai centred on kūmara (sweet potato), fern root, seafood in abundance — fish, shellfish, eel — and birds, with berries and greens gathered seasonally. Very lean, very high in seafood, and a carbohydrate base of tubers rather than grain. Cooked in the hāngī, an earth oven, which is about as gentle a cooking method as exists.',
      macroSlant: 'Sweet potato and root carbs, abundant seafood, lean and unprocessed.',
      sampleDay: [
        { label: 'Morning', detail: 'Sweet potato with eggs and greens.' },
        { label: 'Midday', detail: 'Fish and shellfish with kūmara — the seafood the coast provided daily.' },
        { label: 'Evening', detail: 'Lean meat or fish with root vegetables and berries.' },
      ],
      notes: ['Kūmara plus seafood is a genuinely excellent athletic base — slow carbohydrate, lean protein, iodine and omega-3.'],
    },
  },
  {
    key: 'his-maasai-moran',
    category: 'historical',
    name: 'Maasai Moran',
    tagline: 'Walking all day, the adumu jump, and the spear.',
    origin:
      'The moran are the warrior age-set of the Maasai of Kenya and Tanzania — young men who spend years living apart, herding cattle across enormous distances and defending them. Their conditioning comes from the work itself: walking twenty or more kilometres a day at a steady pace behind the herd, in the heat, at altitude. The adumu — the jumping dance where warriors take turns leaping straight up as high as they can, without letting the heels touch — is both a display and a genuinely brutal plyometric test. The spear and the shield complete the picture.',
    ethos: 'Walk further than anyone thinks reasonable. Jump higher than the man before you.',
    level: 'beginner',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.maasai',
    accent: '#B23A2E',
    authenticityNote:
      'Faithful to what the moran life actually involves — very high daily walking volume, standing jumps, spear work and load carrying. Maasai endurance is a lifetime\'s accumulation of walking, which is why this programme starts at beginner level and simply asks for consistency.',
    days: [
      { key: 'walk', label: 'The herder\'s day', sessionType: 'outdoor', focus: 'Steady walking, hours of it — the whole basis of moran fitness.', exercises: ['brisk-walk', 'trekking', 'nordic-walking'], prescription: 'Build to 15–20 km at a comfortable, unhurried pace', minutes: 150 },
      { key: 'adumu', label: 'Adumu jumping', sessionType: 'calisthenics', focus: 'The jumping dance — standing vertical leaps, heels off the ground.', exercises: ['jump-squat', 'box-jumps', 'single-leg-calf-raise', 'high-knees'], prescription: 'Standing jumps 6×8, full recovery, land soft', minutes: 30 },
      { key: 'spear', label: 'Spear & shield', sessionType: 'martial_arts', focus: 'The moran\'s weapons, and the shoulder to carry them all day.', exercises: ['spear-thrust-drill', 'shield-carry-march', 'overhead-carry', 'standing-power-throw'], prescription: 'Spear drills and throws, carries, 35 min', minutes: 35 },
      { key: 'carry', label: 'Load & water', sessionType: 'strength', focus: 'Carrying water and calves — the unglamorous strength of the job.', exercises: ['farmers-carry', 'sandbag-carry', 'overhead-carry', 'rucking'], prescription: 'Loaded carries, long distance, 30 min', minutes: 35 },
      { key: 'run', label: 'Highland running', sessionType: 'outdoor', focus: 'The Rift Valley altitude that made this region the running capital of the world.', exercises: ['easy-run', 'long-run', 'hill-repeats'], prescription: 'Easy running, add hills as you settle in', minutes: 50 },
    ],
    diet: {
      name: 'Milk, meat and blood',
      approach:
        'The traditional Maasai diet is famously narrow: cow\'s milk above all, meat on occasion, and cattle blood mixed with milk — a genuine practice, drawn without killing the animal. It is very high in protein and saturated fat with almost no plant food, and yet cardiovascular disease was historically rare, which researchers attribute to the sheer volume of daily walking. Adapted here to milk, fermented dairy and lean red meat, with the vegetables a non-herding life needs.',
      macroSlant: 'Dairy-dominant protein and fat, lean red meat, very low carbohydrate.',
      sampleDay: [
        { label: 'Morning', detail: 'Milk and fermented milk — the staple, drunk in quantity.' },
        { label: 'Midday', detail: 'Lean red meat with milk.' },
        { label: 'Evening', detail: 'Meat and dairy again, with greens the traditional diet lacked.' },
      ],
      notes: [
        'The blood is authentic and is not being recommended — milk and lean meat carry the same nutrition safely.',
        'The lesson researchers keep drawing from the Maasai is the walking, not the diet: 20 km a day changes what a diet can get away with.',
      ],
    },
  },
  {
    key: 'his-turkish-pehlivan',
    category: 'historical',
    name: 'Turkish Oil Wrestler',
    tagline: 'Kırkpınar — the oldest tournament still running, fought in olive oil.',
    origin:
      'Yağlı güreş, Turkish oil wrestling, has been contested at Kırkpınar in Edirne since 1346, making it the longest continuously-held sporting tournament on earth. Wrestlers wear leather kispet trousers and are drenched head to toe in olive oil, which makes any conventional grip impossible — the only reliable hold is inside the opponent\'s trousers. Bouts once ran until someone could not continue; matches lasting a full day are recorded. The result is a wrestler built for grip strength that survives oil, and an engine that survives forty minutes of it.',
    ethos: 'Nothing here can be held. Win with your engine and your grip anyway.',
    level: 'advanced',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.turkish',
    accent: '#4E7A2E',
    authenticityNote:
      'Structured around what oil wrestling actually demands — extreme grip endurance under slipperiness, huge aerobic capacity for long bouts, and hip/back strength for lifting a greased opponent. Towel and fat-grip work stands in for the oil.',
    safetyNote: 'Grip work at this volume irritates elbows and forearms fast. Build the hangs gradually and take a full day off if the tendons complain.',
    days: [
      { key: 'grip', label: 'Oiled grip', sessionType: 'strength', focus: 'Holding what refuses to be held — grip endurance above all.', exercises: ['towel-hang', 'fat-grip-hold', 'farmers-hold', 'towel-pull-up-hang', 'hand-gripper', 'plate-pinch'], prescription: 'Towel hangs and thick-grip holds, 6 rounds to failure', minutes: 40 },
      { key: 'wrestle', label: 'Long bouts', sessionType: 'martial_arts', focus: 'Forty-minute matches — the engine is the weapon.', exercises: ['ma-wrestling', 'ma-clinch-work', 'wrestling-shots', 'ma-positional-sparring'], prescription: 'Long continuous rounds, 3×12 min', minutes: 50 },
      { key: 'strength', label: 'Lifting a greased man', sessionType: 'strength', focus: 'Hips and back — how you lift someone you cannot grip.', exercises: ['deadlift', 'zercher-squat', 'barbell-row', 'atlas-stone-lift', 'sandbag-clean-press'], prescription: 'Heavy hinge and awkward-object lifts, 45 min', minutes: 50 },
      { key: 'engine', label: 'Kırkpınar engine', sessionType: 'cardio', focus: 'Aerobic base deep enough to still be wrestling in the fortieth minute.', exercises: ['easy-run', 'rowing-intervals', 'assault-bike', 'ma-fight-conditioning'], prescription: 'Zone-2 work then hard intervals, 45 min', minutes: 45 },
      { key: 'neck', label: 'Neck & core', sessionType: 'calisthenics', focus: 'The wrestler\'s armour: neck, back and midsection.', exercises: ['neck-bridge', 'ma-neck-conditioning', 'hollow-rock', 'back-extension', 'plank'], prescription: 'Neck and trunk work, controlled, 30 min', minutes: 30 },
    ],
    diet: {
      name: 'The Edirne wrestler\'s plate',
      approach:
        'Turkish training food is straightforward and effective: lamb and chicken, bulgur and rice, yoghurt with everything, olive oil generously, white beans, lentils, and enormous quantities of fresh vegetables and bread. For a heavy athlete training daily it supplies plenty of carbohydrate, solid protein and the fat to hold it together.',
      macroSlant: 'Bulgur and rice for carbs, lamb and yoghurt for protein, olive oil throughout.',
      sampleDay: [
        { label: 'Morning', detail: 'Eggs, white cheese, olives and bread — the Turkish breakfast.' },
        { label: 'Midday', detail: 'Lamb with bulgur and yoghurt.' },
        { label: 'Evening', detail: 'White beans with rice, salad and olive oil.' },
      ],
      notes: ['Yoghurt at every meal is a quiet advantage — protein, calcium and an easy way to hit intake when appetite is flagging.'],
    },
  },
  {
    key: 'his-celtic-highland',
    category: 'historical',
    name: 'Celtic Highland Warrior',
    tagline: 'The caber, the stone and the Fianna\'s impossible entrance exam.',
    origin:
      'The Highland Games are a living fossil of Gaelic warrior testing: the caber toss, the stone put, the hammer throw, the weight over the bar — all of them recognisable as trials of the strength a clan warrior needed. Irish legend records the Fianna\'s entrance requirements in the same spirit: to run through a wood without breaking a branch, to leap a stick your own height, to pass under one your knee-height, and to pull a thorn from your foot at a full sprint without slowing. Ridiculous, and a perfect description of agility, power and pain tolerance.',
    ethos: 'Throw heavy things a long way. Move through the wood without touching it.',
    level: 'intermediate',
    daysPerWeek: 4,
    blockWeeks: 10,
    icon: 'mindbody.celtic',
    accent: '#3F6B8C',
    authenticityNote:
      'The Highland Games events are real and unchanged; the Fianna trials are from the Fenian Cycle, which is literature rather than a training log — used here for the qualities they describe, not as history.',
    days: [
      { key: 'throw', label: 'Caber & stone', sessionType: 'strength', focus: 'The throwing events — whole-body power into an awkward object.', exercises: ['atlas-stone-lift', 'standing-power-throw', 'sandbag-clean-press', 'push-press', 'tire-flip'], prescription: 'Explosive lifts and throws, 5×3, full recovery', minutes: 50 },
      { key: 'strength', label: 'Clan strength', sessionType: 'strength', focus: 'The base: deadlift, squat, press, carry.', exercises: ['deadlift', 'back-squat', 'overhead-press', 'farmers-carry', 'barbell-shrug'], prescription: 'Heavy compounds 5×5, then carries', minutes: 55 },
      { key: 'fianna', label: 'Fianna trials', sessionType: 'calisthenics', focus: 'Agility, leaping and ducking — the wood you pass through untouched.', exercises: ['box-jumps', 'agility-ladder', 'bear-crawl', 'parkour', 'shuttle-runs'], prescription: 'Jump, duck, weave — circuits for 35 min', minutes: 40 },
      { key: 'hills', label: 'Highland hills', sessionType: 'outdoor', focus: 'The country itself — steep, wet and long.', exercises: ['hiking', 'hill-repeats', 'rucking', 'trail-run'], prescription: 'Hill walking under load, 60–75 min', minutes: 70 },
    ],
    diet: {
      name: 'Oats, milk and game',
      approach:
        'The Highland diet before the modern era was oats above all — as porridge, as bannocks — with dairy, barley, root vegetables, game, and sea fish on the coasts. Oats are a genuinely superb athletic staple: slow carbohydrate, beta-glucan fibre, a decent protein content for a grain. Add dairy and meat and you have a working strength diet with no supplements in sight.',
      macroSlant: 'Oats and barley for carbs, dairy and game meat for protein.',
      sampleDay: [
        { label: 'Morning', detail: 'Porridge with milk — the Highland breakfast, unchanged.' },
        { label: 'Midday', detail: 'Game or beef with barley and root vegetables.' },
        { label: 'Evening', detail: 'Fish or meat with potatoes, greens and cheese.' },
      ],
      notes: ['Oats and milk is one of the cheapest, best mass-and-strength breakfasts there is — the tradition got that right.'],
    },
  },
  {
    key: 'his-korean-hwarang',
    category: 'historical',
    name: 'Hwarang of Silla',
    tagline: 'The Flowering Knights — archery, taekkyeon and five commandments.',
    origin:
      'The Hwarang were an elite youth corps of the Silla kingdom (roughly 6th–9th century Korea), drawn from noble families and trained together in a way that mixed martial skill with poetry, music and Buddhist study. Their military education covered archery — a Korean speciality then and now — horsemanship, swordsmanship and the kicking art of taekkyeon, with long journeys through the mountains as both training and pilgrimage. The monk Won Gwang gave them five commandments, one of which was to never retreat in battle.',
    ethos: 'Loyalty, courage, discretion in killing. A warrior who can also write a poem.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.hwarang',
    accent: '#7A4E9B',
    authenticityNote:
      'Built from the documented Hwarang curriculum — archery, horsemanship, swordwork, taekkyeon and mountain travel — plus the contemplative half of their education, which was not decoration but half the point. Modern "Hwarang Do" is a 20th-century creation and is not what this draws on.',
    days: [
      { key: 'archery', label: 'Gungdo archery', sessionType: 'strength', focus: 'The Korean bow — the skill Silla was known for across the region.', exercises: ['archery', 'band-pull-apart', 'ring-row', 'rear-delt-fly', 'scap-retraction-hold'], prescription: 'Archery plus pulling endurance, 40 min', minutes: 40 },
      { key: 'taekkyeon', label: 'Taekkyeon', sessionType: 'martial_arts', focus: 'The old Korean kicking art — rhythmic, flowing, deceptive footwork.', exercises: ['ma-taekwondo', 'ma-kick-drill', 'ma-footwork-drill', 'ma-forms-kata', 'stance-flow'], prescription: 'Kicking and stepping drills to a rhythm, 40 min', minutes: 45 },
      { key: 'sword', label: 'Sword & horse', sessionType: 'martial_arts', focus: 'Swordsmanship and the saddle — the noble half of the training.', exercises: ['sword-swing-drill', 'ma-weapon-forms', 'horse-riding', 'ma-fencing'], prescription: 'Sword forms; ride if you can, 35 min', minutes: 40 },
      { key: 'mountain', label: 'Mountain pilgrimage', sessionType: 'outdoor', focus: 'Long journeys through the mountains — training and pilgrimage at once.', exercises: ['hiking', 'trekking', 'hill-repeats', 'stair-climbing-outdoor'], prescription: 'Long mountain walk, 75 min+', minutes: 80 },
      { key: 'mind', label: 'Poetry & sitting', sessionType: 'meditation', focus: 'The other half of a Hwarang education — study, music, stillness.', exercises: ['zazen', 'journaling', 'unguided-sit', 'walking-meditation'], prescription: 'Sit 20 min, then write — both were required', minutes: 30 },
    ],
    diet: {
      name: 'Rice, kimchi and the sea',
      approach:
        'Korean food is built on rice, fermented vegetables (kimchi above all), soybean paste, seaweed, and generous seafood — with meat as a smaller component historically. It is high in carbohydrate, rich in fermented foods, and unusually high in iodine and sea minerals thanks to the seaweed. Fermentation is the through-line: the diet is a live-culture diet by default.',
      macroSlant: 'Rice-based carbs, fermented vegetables and soy, seafood protein.',
      sampleDay: [
        { label: 'Morning', detail: 'Rice with soup, fermented vegetables and egg.' },
        { label: 'Midday', detail: 'Rice with fish and seaweed — the everyday plate.' },
        { label: 'Evening', detail: 'Tofu and vegetables with rice and pickles.' },
      ],
      notes: ['Fermented vegetables at every meal is one of the more robust dietary habits in the world — cheap, and good for the gut.'],
    },
  },
  {
    key: 'his-inca-chasqui',
    category: 'historical',
    name: 'Inca Chasqui Runner',
    tagline: 'Relay messengers at 4,000 m — 240 km a day, by leg.',
    origin:
      'The Inca ran an empire without the wheel or the horse, on the legs of the chasqui: relay runners posted every few kilometres along the Qhapaq Ñan road network, each sprinting his leg at full effort before handing the message and the quipu to the next. Fresh fish is recorded as reaching Cusco from the Pacific — some 400 km, much of it above 3,000 m — in under two days. Chasqui were selected as boys and trained for years at altitude, chewing coca for the thin air and carrying a conch to announce their arrival.',
    ethos: 'Your leg of it, at full speed. The message is more important than your comfort.',
    level: 'advanced',
    daysPerWeek: 5,
    blockWeeks: 12,
    icon: 'mindbody.inca',
    accent: '#B08428',
    authenticityNote:
      'Structured on the real chasqui method, which is essentially interval training: hard efforts over a short leg, repeated, rather than a slow ultra. The altitude is the part you can\'t replicate at sea level — hill work is the honest substitute. Coca is not part of this programme.',
    days: [
      { key: 'relay', label: 'The relay leg', sessionType: 'outdoor', focus: 'Hard efforts over a couple of kilometres — the chasqui\'s actual unit of work.', exercises: ['track-intervals', 'sprint-repeats', 'fartlek-run'], prescription: '6×1.5 km hard with full recovery — run your leg, then rest', minutes: 55 },
      { key: 'mountain', label: 'Mountain road', sessionType: 'outdoor', focus: 'The Qhapaq Ñan climbed relentlessly — so does this.', exercises: ['hill-repeats', 'trail-run', 'stair-climbing-outdoor', 'mountaineering'], prescription: 'Long climbing run or hike, 70 min', minutes: 70 },
      { key: 'base', label: 'Aerobic base', sessionType: 'outdoor', focus: 'The easy volume that makes the hard legs repeatable.', exercises: ['easy-run', 'long-run', 'recovery-run'], prescription: 'Easy running, conversational throughout', minutes: 60 },
      { key: 'lungs', label: 'Thin-air work', sessionType: 'mindbody', focus: 'Breathing capacity — the chasqui\'s real specialisation.', exercises: ['breathwork', 'box-breathing', 'coherent-breathing', 'alternate-nostril'], prescription: 'Breathing protocols, 20 min, seated and safe', minutes: 25 },
      { key: 'legs', label: 'Runner\'s legs', sessionType: 'calisthenics', focus: 'Keeping the legs together under high mileage on hard ground.', exercises: ['walking-lunge', 'single-leg-calf-raise', 'nordic-negative', 'single-leg-rdl', 'side-plank'], prescription: 'Single-leg strength, light and frequent', minutes: 30 },
    ],
    diet: {
      name: 'Quinoa, potato and the high Andes',
      approach:
        'Andean nutrition is built on the potato — hundreds of varieties, freeze-dried as chuño for storage — plus quinoa, maize, beans and the occasional guinea pig or llama. Quinoa is a genuine complete protein, unusual among plants, and the whole combination is a high-carbohydrate, high-altitude endurance diet that supported an empire of runners.',
      macroSlant: 'Potato and maize carbs with quinoa protein; very little fat.',
      sampleDay: [
        { label: 'Morning', detail: 'Grain porridge with maize — the runner\'s pre-dawn meal.' },
        { label: 'Midday', detail: 'Potato with beans and greens.' },
        { label: 'Evening', detail: 'Grain and beans with meat when there is any.' },
      ],
      notes: [
        'Quinoa isn\'t in the food list yet, so the build uses amaranth — its close Andean relative with a near-identical profile.',
        'Potatoes are underrated for endurance: dense carbohydrate, potassium, and very satiating.',
      ],
    },
  },
  {
    key: 'his-filipino-kali',
    category: 'historical',
    name: 'Filipino Kali',
    tagline: 'Weapons first — the blade teaches the empty hand.',
    origin:
      'Filipino martial arts — kali, eskrima, arnis — invert the usual order: a student starts with the stick and the blade, and learns empty-hand fighting afterwards, because the principles transfer downward, not upward. Developed across an archipelago with a long history of raiding and resistance, it is fast, angular and relentlessly practical. Lapu-Lapu\'s defeat of Magellan at Mactan in 1521 is the origin story every school tells. Modern arnis is the Philippines\' national martial art, taught in schools.',
    ethos: 'The weapon is the teacher. Flow, angles, and both hands equally.',
    level: 'intermediate',
    daysPerWeek: 4,
    blockWeeks: 10,
    icon: 'mindbody.kali',
    accent: '#1D6FA8',
    authenticityNote:
      'Reflects how FMA is genuinely taught — single stick, double stick (sinawali), knife awareness, then empty hand — with heavy emphasis on both sides of the body and on flow drills. Live blade work is not part of this and never should be without an instructor.',
    days: [
      { key: 'single', label: 'Single stick', sessionType: 'martial_arts', focus: 'The twelve angles of attack — the alphabet of the whole art.', exercises: ['ma-weapon-forms', 'sword-swing-drill', 'ma-combination-drill', 'wrist-mobility'], prescription: 'Angle drills both hands, 40 min', minutes: 45 },
      { key: 'sinawali', label: 'Sinawali (double stick)', sessionType: 'martial_arts', focus: 'Weaving double-stick patterns — coordination at speed.', exercises: ['ma-weapon-forms', 'ma-combination-drill', 'ma-footwork-drill', 'club-swing-drill'], prescription: 'Sinawali patterns, build tempo, 35 min', minutes: 40 },
      { key: 'empty', label: 'Panantukan', sessionType: 'martial_arts', focus: 'Filipino boxing — the empty-hand expression of the same angles.', exercises: ['ma-boxing', 'ma-jab-cross', 'ma-knee-elbow-drill', 'ma-pad-round', 'ma-defense-drill'], prescription: 'Boxing and trapping rounds, 40 min', minutes: 45 },
      { key: 'condition', label: 'Speed & grip', sessionType: 'strength', focus: 'Forearms, wrists and speed — what stick work runs on.', exercises: ['wrist-roller', 'hand-gripper', 'reverse-wrist-curl', 'speed-bag', 'ma-skipping'], prescription: 'Forearm and speed work, 30 min', minutes: 35 },
    ],
    diet: {
      name: 'Rice, fish and vinegar',
      approach:
        'Filipino food is rice at every meal, fish and pork, and a great deal of vinegar and citrus — adobo, kinilaw, sinigang. Coastal and lean when you steer toward the grilled and soured dishes rather than the fried ones. Rice is the training fuel; fish and eggs carry the protein.',
      macroSlant: 'Rice-heavy carbohydrate, fish and pork protein, vinegar-soured vegetables.',
      sampleDay: [
        { label: 'Morning', detail: 'Rice with egg and dried fish — the classic silog breakfast.' },
        { label: 'Midday', detail: 'Fish or chicken adobo with rice and greens.' },
        { label: 'Evening', detail: 'Soured soup with fish, vegetables and rice.' },
      ],
      notes: ['Steer to the grilled, soured and stewed dishes over the fried ones and this is a clean, high-carb training diet.'],
    },
  },
  {
    key: 'his-aboriginal-hunter',
    category: 'historical',
    name: 'Aboriginal Australian Hunter',
    tagline: 'Persistence hunting, the woomera throw, and reading the country.',
    origin:
      'Aboriginal Australian cultures are the oldest continuous cultures on earth, and their hunting demanded a specific and unusual fitness: the ability to track and walk down game over hours in extreme heat, to throw a spear with a woomera (a lever that roughly doubles the range), and to cover vast distances between water sources with a total mastery of where those sources were. Persistence hunting — following an animal until heat exhaustion stops it — is a whole-body endurance discipline that humans are, uniquely, built for.',
    ethos: 'Read the country, then outlast whatever is in it.',
    level: 'intermediate',
    daysPerWeek: 4,
    blockWeeks: 10,
    icon: 'mindbody.aboriginal',
    accent: '#A85B2B',
    authenticityNote:
      'Built on the documented physical demands — long-distance walking and tracking in heat, spear-throwing with a woomera, and climbing. Aboriginal cultures are many and distinct, with knowledge that belongs to their communities; this covers only the general physical practices, respectfully and at a distance.',
    safetyNote: 'Heat is the real hazard in this one. Carry more water than you think you need, go early or late, and stop at the first sign of dizziness or a headache.',
    days: [
      { key: 'persist', label: 'Persistence walk-run', sessionType: 'outdoor', focus: 'Hours of alternating walking and running — how a human outlasts an antelope.', exercises: ['long-run', 'brisk-walk', 'trekking', 'fartlek-run'], prescription: 'Alternate 10 min running / 5 min walking for 90 min', minutes: 90 },
      { key: 'throw', label: 'Woomera throwing', sessionType: 'strength', focus: 'The spear-thrower — a whole-body rotational throw with a lever.', exercises: ['standing-power-throw', 'spear-thrust-drill', 'cable-woodchopper', 'landmine-rotation', 'db-woodchopper'], prescription: 'Rotational throws 6×5 each side, explosive', minutes: 35 },
      { key: 'track', label: 'Tracking & climbing', sessionType: 'outdoor', focus: 'Moving over rough country, climbing for honey, water and vantage.', exercises: ['climbing', 'rope-climb', 'orienteering', 'bear-crawl'], prescription: 'Navigate a route with climbing on the way, 50 min', minutes: 55 },
      { key: 'heat', label: 'Heat & carry', sessionType: 'strength', focus: 'Carrying water and game across country in the heat.', exercises: ['farmers-carry', 'overhead-carry', 'rucking', 'sandbag-carry'], prescription: 'Loaded carries over distance, 35 min', minutes: 40 },
    ],
    diet: {
      name: 'Bush tucker',
      approach:
        'Traditional Aboriginal diets varied enormously by country but shared a shape: very lean game meat (kangaroo is among the leanest red meat there is), fish and shellfish on the coasts, seeds ground into damper, tubers, and native fruits — the Kakadu plum has the highest recorded vitamin C of any fruit on earth. Extremely low in fat, high in protein and fibre, with zero processed food.',
      macroSlant: 'Very lean game protein, seed and tuber carbs, high fibre, minimal fat.',
      sampleDay: [
        { label: 'Morning', detail: 'Seed-ground bread with fruit — damper and bush fruit.' },
        { label: 'Midday', detail: 'Lean red meat with root vegetables.' },
        { label: 'Evening', detail: 'Fish with greens and tubers.' },
      ],
      notes: ['Kangaroo is genuinely exceptional meat — around 2% fat with high iron and zinc. Lean beef is the closest common substitute.'],
    },
  },
  {
    key: 'his-muay-boran',
    category: 'historical',
    name: 'Siamese Muay Boran',
    tagline: 'The ancient style — nine weapons, rope-bound fists.',
    origin:
      'Muay Boran ("ancient boxing") is the battlefield ancestor of modern Muay Thai, from the Siamese armies of Ayutthaya. Fighters wrapped their fists in hemp rope (kaad chuek) rather than gloves, and the art recognised nine weapons rather than eight — head strikes included. The legend of Nai Khanom Tom, captured by the Burmese in 1767 and freed after defeating ten of their champions in succession, is commemorated as Thai Boxer\'s Day every March. Training was conditioning-heavy: running, skipping, and thousands of kicks on banana trees.',
    ethos: 'Every limb is a weapon. Condition until being hit stops mattering.',
    level: 'advanced',
    daysPerWeek: 6,
    blockWeeks: 12,
    icon: 'mindbody.thai',
    accent: '#B8452E',
    authenticityNote:
      'Follows the traditional Thai camp day — dawn run, skipping, bag and pad work, clinch, and enormous kick volume — with the Muay Boran additions of elbows and grappling throws. Shin conditioning is the part people get wrong: on a heavy bag, over months. Not on trees, and never with a stick.',
    safetyNote:
      'Never condition shins by striking hard objects — that reputation comes from misunderstood tradition and causes real bone injury. Bag work builds the same tolerance safely. Head strikes stay out of sparring entirely.',
    days: [
      { key: 'run', label: 'Dawn road work', sessionType: 'outdoor', focus: 'The 5am run every Thai camp still starts with.', exercises: ['easy-run', 'hill-repeats', 'sprint-repeats'], prescription: '8–10 km easy, sprints at the end', minutes: 50 },
      { key: 'kicks', label: 'Kick volume', sessionType: 'martial_arts', focus: 'Hundreds of round kicks a side — the signature of the art.', exercises: ['ma-muay-thai', 'ma-kick-drill', 'ma-bag-round', 'ma-skipping'], prescription: '200+ kicks each leg on the bag, 45 min', minutes: 50 },
      { key: 'elbow', label: 'Elbows & knees', sessionType: 'martial_arts', focus: 'The close-range weapons that define Boran.', exercises: ['ma-knee-elbow-drill', 'ma-clinch-work', 'ma-pad-round', 'ma-combination-drill'], prescription: 'Elbow and knee rounds on pads, 40 min', minutes: 45 },
      { key: 'clinch', label: 'Clinch & throws', sessionType: 'martial_arts', focus: 'The Thai clinch and the throws Boran kept from the battlefield.', exercises: ['ma-clinch-work', 'ma-wrestling', 'ma-takedown-entries', 'neck-bridge', 'ma-neck-conditioning'], prescription: 'Clinch sparring and throws, 40 min', minutes: 45 },
      { key: 'condition', label: 'Fight conditioning', sessionType: 'calisthenics', focus: 'The body that absorbs five rounds — core, neck, and lungs.', exercises: ['ma-fight-conditioning', 'burpees', 'hollow-rock', 'weighted-sit-up', 'iron-body-conditioning'], prescription: 'Circuit to exhaustion, 30 min', minutes: 35 },
      { key: 'spar', label: 'Technical sparring', sessionType: 'martial_arts', focus: 'Light, technical rounds — the camp\'s way of learning without damage.', exercises: ['ma-technical-sparring', 'ma-shadow-round', 'ma-footwork-drill', 'ma-counter-drill'], prescription: 'Light technical rounds only, 40 min', minutes: 45 },
    ],
    diet: {
      name: 'The Thai camp plate',
      approach:
        'Thai fighters eat rice at every meal, with grilled chicken or fish, eggs, and som tam (green papaya salad) — light, spicy and high-volume. Camps run on rice and lean protein, with fruit for sugar. Weight-cutting culture in Thai boxing is severe and is deliberately left out of this: everything here is fuelling, not cutting.',
      macroSlant: 'Rice-based carbohydrate, lean grilled protein, high vegetable volume.',
      sampleDay: [
        { label: 'After road work', detail: 'Rice with eggs and fruit, after the dawn run.' },
        { label: 'Midday', detail: 'Grilled chicken with rice and papaya salad.' },
        { label: 'Evening', detail: 'Fish with rice and vegetables, after the second session.' },
      ],
      notes: ['Thai weight-cutting is genuinely dangerous and none of it is reproduced here — eat to train, not to make a number.'],
    },
  },
  {
    key: 'hero-luchador',
    category: 'superhero',
    name: 'El Santo — Lucha Libre',
    tagline: 'The masked legend: flight, showmanship and a hidden face.',
    origin:
      'Rodolfo Guzmán Huerta wrestled as El Santo for nearly five decades, never removing his silver mask in public — he was buried in it. Beyond the ring he starred in more than fifty films as a masked crime-fighting hero, making him Mexico\'s closest thing to a real superhero. Lucha libre itself is built on speed and flight rather than grinding power: the high-flying luchador is light, explosive, and extraordinarily conditioned, with a repertoire of aerial moves that demand gymnastics-level body control.',
    ethos: 'The mask is the character. Move fast, fly high, never break the illusion.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'mindbody.luchador',
    accent: '#C0A02C',
    authenticityNote:
      'Trains the qualities a high-flying luchador actually needs — relative strength, explosive jumping, gymnastic body control, neck and landing conditioning, and an engine for long matches. The aerial moves themselves are not prescribed: they need a ring, a trained partner and a coach, and they are genuinely dangerous without all three.',
    safetyNote:
      'Do not practise wrestling bumps or aerial moves without a ring and a qualified coach. Everything in this programme is the athletic preparation, done safely on the ground.',
    days: [
      { key: 'relative', label: 'Relative strength', sessionType: 'calisthenics', focus: 'Strong for your bodyweight — the luchador\'s whole physical premise.', exercises: ['pull-up', 'muscle-up', 'dip', 'pistol-squat', 'handstand-hold'], prescription: 'Low reps, high quality, 5 rounds', minutes: 45 },
      { key: 'fly', label: 'Explosive & landing', sessionType: 'calisthenics', focus: 'Jumping high and, more importantly, absorbing the landing.', exercises: ['box-jumps', 'jump-squat', 'trampoline', 'sport-plyometrics', 'shrimp-squat'], prescription: 'Plyometrics with controlled landings, 6×5', minutes: 40 },
      { key: 'gym', label: 'Body control', sessionType: 'sport', focus: 'Gymnastic control — the rolls, the rotation, knowing where you are.', exercises: ['gymnastics', 'parkour', 'animal-flow', 'skin-the-cat', 'handstand-walk'], prescription: 'Tumbling and body-control work, 40 min', minutes: 45 },
      { key: 'neck', label: 'Neck & core armour', sessionType: 'strength', focus: 'The neck and trunk that survive taking bumps for twenty years.', exercises: ['neck-bridge', 'ma-neck-conditioning', 'hollow-rock', 'back-extension', 'weighted-sit-up'], prescription: 'Neck and trunk conditioning, controlled, 30 min', minutes: 35 },
      { key: 'engine', label: 'Match engine', sessionType: 'cardio', focus: 'Twenty minutes of flat-out performance, three nights a week.', exercises: ['ma-wrestling', 'assault-bike', 'burpees', 'jump-rope-basic', 'shuttle-runs'], prescription: 'Intervals matched to match length, 35 min', minutes: 40 },
    ],
    diet: {
      name: 'Fuelling the flight',
      approach:
        'A high-flying luchador needs to stay light without losing power, which makes this a relative-strength diet: enough protein to hold muscle, carbohydrate timed around training rather than spread thin, and enough total food to recover from five sessions a week. Mexican staples do this well — corn tortillas, beans, eggs, grilled meat and a lot of vegetables.',
      macroSlant: 'Moderate carbs timed around training, high protein, controlled total calories.',
      sampleDay: [
        { label: 'Morning', detail: 'Eggs with corn tortillas and fruit.' },
        { label: 'Midday', detail: 'Grilled chicken with beans, rice and salad.' },
        { label: 'Post-training', detail: 'Protein with fruit, straight after the session.' },
        { label: 'Evening', detail: 'Lean beef with vegetables and a small carb portion.' },
      ],
      notes: ['Staying light is a strength strategy here, not an aesthetic one — cut too far and the flying goes first.'],
    },
  },

  // ═══════════════════════════ ELITE SPORT ═══════════════════════════
  // How professionals in each sport actually train. The recurring surprise for
  // most people is how LITTLE of it is lifting: an elite footballer's week is
  // mostly ball work and running, with two gym sessions protecting the rest.
  {
    key: 'ath-footballer',
    category: 'athlete',
    name: 'Professional Footballer',
    tagline: 'The in-season week — high-speed running, not chasing a pump.',
    origin:
      'A top-flight footballer covers 10–13 km a match, but the number that decides careers is the 1–2 km of it above 20 km/h. Modern clubs periodise the week around the game: hard days early, sharp and short before matchday, and a strict rule that high-speed running must be exposed in training or the hamstrings will find it in the match instead. Strength work is twice a week and exists mainly to keep players available.',
    ethos: 'Available beats impressive. The best ability is being fit on Saturday.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 8,
    icon: 'sport.soccer',
    accent: '#2E7D32',
    authenticityNote:
      'Follows the real MD-4 to MD-1 club structure: the heaviest load furthest from the match, tapering to sharpness. Adapted for one training group and no pitch staff — the principle to keep is that high-speed running is trained, not avoided.',
    safetyNote:
      'Hamstring injuries in football almost always come from sprinting under fatigue with no build-up. Reach near-maximum speed at least once a week when fresh, and never introduce sprinting straight into a tired session.',
    days: [
      { key: 'strength', label: 'MD-4 · Strength', sessionType: 'strength', focus: 'Heavy lower body, far enough from the match to recover.', exercises: ['back-squat', 'romanian-deadlift', 'nordic-curl', 'bulgarian-split-squat', 'db-shoulder-press'], prescription: 'Compounds 4×4–6, Nordics 3×5 · the Nordics are the hamstring insurance', minutes: 55 },
      { key: 'endurance', label: 'MD-3 · Engine', sessionType: 'cardio', focus: 'Repeated high-intensity efforts — the shape of a real match.', exercises: ['shuttle-runs', 'sprint-repeats', 'ma-skipping', 'agility-ladder'], prescription: '4×4 min hard with 3 min recovery, then shuttles', minutes: 50 },
      { key: 'speed', label: 'MD-2 · Top speed', sessionType: 'outdoor', focus: 'Maximum-velocity running while fresh — the session people skip.', exercises: ['sprint-repeats', 'hill-sprints', 'sport-plyometrics', 'dynamic-warmup'], prescription: '6–8×40 m flying sprints, full recovery. Quality only', minutes: 40 },
      { key: 'ball', label: 'MD-1 · Sharpness', sessionType: 'sport', focus: 'Short, sharp, technical. Legs stay fresh for the match.', exercises: ['soccer', 'sport-passing-drill', 'sport-footwork', 'sport-shooting-drill'], prescription: '35 min of ball work, nothing heavy', minutes: 40 },
      { key: 'match', label: 'Matchday', sessionType: 'sport', focus: 'The reason for all of it.', exercises: ['soccer'], prescription: '90 min · this is the session', minutes: 95 },
    ],
    diet: {
      name: 'Fuelling for the fixture',
      approach:
        'Football nutrition is carbohydrate periodisation: intake rises toward matchday and drops on light days. Carbs are the fuel for repeated sprinting, and playing glycogen-depleted shows up as a collapse in high-speed running in the last twenty minutes. Protein sits around 1.6–2 g/kg to hold muscle through a long season.',
      macroSlant: 'Carbs scaled to the day, 1.6–2 g/kg protein, hydration tightly managed.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Oats, eggs and fruit — the day starts with carbohydrate.' },
        { label: 'Pre-training', detail: 'Rice or pasta with lean protein, 2–3 hours before.' },
        { label: 'Post-training', detail: 'Protein and fast carbs inside the hour.' },
        { label: 'Dinner', detail: 'Fish or lean meat, potatoes or rice, plenty of vegetables.' },
      ],
      notes: [
        'The classic mistake is under-eating carbohydrate and blaming fitness for a fade that was fuel.',
        'Hydration status is measurable and matters: a 2% loss is a measurable drop in sprint performance.',
      ],
    },
  },
  {
    key: 'ath-basketballer',
    category: 'athlete',
    name: 'Professional Basketballer',
    tagline: 'Jump, land, repeat — and survive an 82-game season.',
    origin:
      'Basketball is a jumping sport played on a hard floor for eight months. An NBA player takes off and lands dozens of times a game, and the training reflects it: plyometrics and landing mechanics, single-leg strength, ankle and knee resilience, plus enough conditioning for the constant change of direction. Load management exists because the sport\'s volume, not its intensity, is what breaks people.',
    ethos: 'Jump high, land well, play again on Thursday.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 8,
    icon: 'sport.basketball',
    accent: '#EF6C00',
    authenticityNote:
      'Built on the priorities pro strength coaches actually work on in-season: landing mechanics, single-leg strength, ankle stiffness and change of direction. The jump training is deliberately low-volume and high-quality, which is how it is really prescribed.',
    safetyNote:
      'Plyometrics are quality work, not conditioning. Once your landings get noisy or your knees start caving inward, the set is over — that is the point at which jump training starts causing the injuries it prevents.',
    days: [
      { key: 'jump', label: 'Jump & land', sessionType: 'calisthenics', focus: 'Take-off power, and the landing that protects the knee.', exercises: ['box-jumps', 'jump-squat', 'single-leg-calf-raise', 'sport-plyometrics', 'balance-training'], prescription: 'Low volume, full recovery — 5×3, land silently', minutes: 40 },
      { key: 'strength', label: 'Single-leg strength', sessionType: 'strength', focus: 'One leg at a time, because that is how the sport is played.', exercises: ['bulgarian-split-squat', 'single-leg-rdl', 'step-up', 'nordic-negative', 'calf-raise-step'], prescription: '4×6–8 per leg, controlled', minutes: 50 },
      { key: 'court', label: 'Court work', sessionType: 'sport', focus: 'Skill under fatigue — shooting when the legs are gone.', exercises: ['basketball', 'sport-shooting-drill', 'shuttle-runs', 'agility-ladder'], prescription: 'Skill work then conditioned shooting, 50 min', minutes: 55 },
      { key: 'condition', label: 'Change of direction', sessionType: 'cardio', focus: 'Decelerating and re-accelerating — the real athletic cost.', exercises: ['shuttle-runs', 'agility-ladder', 'sprint-repeats', 'bear-crawl'], prescription: 'Shuttles and cuts, 20 min of work inside 35', minutes: 35 },
      { key: 'upper', label: 'Upper & core', sessionType: 'strength', focus: 'Contact strength for holding position in the paint.', exercises: ['bench-press-barbell', 'pull-up', 'db-shoulder-press', 'plank', 'landmine-rotation'], prescription: '4×6–8, then trunk work', minutes: 45 },
    ],
    diet: {
      name: 'Season-long fuelling',
      approach:
        'Tall athletes on a long travel schedule need a high total intake and a routine that survives hotels and late tip-offs. Carbohydrate supports the running volume, protein is spread across the day rather than piled into dinner, and post-game eating matters because the next game is often 48 hours away.',
      macroSlant: 'High total intake, protein spread evenly, carbs around games.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Large oats with eggs and fruit.' },
        { label: 'Pre-game', detail: 'Rice and chicken 3 hours out; something light and sweet nearer tip-off.' },
        { label: 'Post-game', detail: 'Protein and carbohydrate immediately — recovery starts on the bus.' },
        { label: 'Dinner', detail: 'Salmon or beef with potatoes and greens.' },
      ],
      notes: ['Two games in three nights is a fuelling problem before it is a fitness problem.'],
    },
  },
  {
    key: 'ath-boxer',
    category: 'athlete',
    name: 'Professional Boxer',
    tagline: 'Road work at dawn, rounds in the afternoon, twelve weeks to fight night.',
    origin:
      'The boxing camp is one of the oldest structured training programmes in sport and it has barely changed: early road work for the aerobic base, gym work in the afternoon on bag, pads and sparring, and a long taper into the fight. What has changed is the strength work — modern camps lift, where an older generation feared getting "muscle-bound", and the evidence backs the modern view.',
    ethos: 'The fight is won in the weeks nobody watches.',
    level: 'advanced',
    daysPerWeek: 6,
    blockWeeks: 12,
    icon: 'sport.boxing',
    accent: '#C62828',
    authenticityNote:
      'Follows the real camp shape — road work, bag and pad rounds, sparring, and a taper. Sparring is the one part you cannot do alone or safely without a coach, and this programme does not pretend otherwise.',
    safetyNote:
      'Do not spar without a coach, proper headgear and someone who knows how to stop it. Repeated head impacts are cumulative and are the sport\'s real cost — technical sparring is where you learn; hard sparring every week is where careers get short.',
    days: [
      { key: 'roadwork', label: 'Dawn road work', sessionType: 'outdoor', focus: 'The aerobic base a twelve-round fight is built on.', exercises: ['easy-run', 'hill-repeats', 'sprint-repeats'], prescription: '6–10 km easy, sprints at the finish', minutes: 50 },
      { key: 'bag', label: 'Bag rounds', sessionType: 'martial_arts', focus: 'Punch output and the shape of a real round.', exercises: ['ma-bag-round', 'ma-jab-cross', 'ma-combination-drill', 'ma-skipping'], prescription: '10×3 min on the bag, 1 min rest', minutes: 50 },
      { key: 'pads', label: 'Pads & technique', sessionType: 'martial_arts', focus: 'Timing, accuracy and reading a moving target.', exercises: ['ma-pad-round', 'ma-mitt-work', 'ma-counter-drill', 'ma-defense-drill', 'ma-footwork-drill'], prescription: '8 rounds on the pads', minutes: 45 },
      { key: 'strength', label: 'Strength & power', sessionType: 'strength', focus: 'Force behind the shot without carrying useless weight.', exercises: ['deadlift', 'push-press', 'pull-up', 'landmine-rotation', 'standing-power-throw'], prescription: 'Low reps, explosive intent, 4×3–5', minutes: 45 },
      { key: 'spar', label: 'Technical sparring', sessionType: 'martial_arts', focus: 'Learning under real pressure — light and technical.', exercises: ['ma-technical-sparring', 'ma-positional-sparring', 'ma-shadow-round'], prescription: 'Controlled rounds only, with a coach present', minutes: 45 },
      { key: 'condition', label: 'Fight conditioning', sessionType: 'calisthenics', focus: 'The neck, core and lungs that survive twelve rounds.', exercises: ['ma-fight-conditioning', 'ma-neck-conditioning', 'weighted-sit-up', 'burpees', 'jump-rope-basic'], prescription: 'Circuit at round tempo, 30 min', minutes: 35 },
    ],
    diet: {
      name: 'Camp and the weight cut',
      approach:
        'Camp nutrition serves two jobs at once: fuelling six sessions a week and arriving at a weight. The safe version does the losing early and slowly, so the last week is a small adjustment rather than a crisis. Protein stays high to hold muscle in a deficit, carbohydrate is timed around the hard sessions, and fluid is managed rather than manipulated.',
      macroSlant: 'Moderate deficit, high protein, carbohydrate placed around training.',
      sampleDay: [
        { label: 'Before road work', detail: 'Light — coffee and a banana; the run is mostly aerobic.' },
        { label: 'Breakfast', detail: 'Eggs and oats after the run.' },
        { label: 'Pre-gym', detail: 'Rice with chicken, a couple of hours before the rounds.' },
        { label: 'Dinner', detail: 'Fish or lean meat, vegetables, a measured carb portion.' },
      ],
      notes: [
        'Severe dehydration cuts are the genuinely dangerous part of this sport outside the ring. Lose the weight in the weeks, not the last night.',
        'Fighting in a big deficit is how you gas in the later rounds — the diet is a performance decision, not just a scale one.',
      ],
    },
  },
  {
    key: 'ath-sprinter',
    category: 'athlete',
    name: 'Elite Sprinter',
    tagline: 'Ten seconds of work and a week of preparing for it.',
    origin:
      'Sprint training is the most misunderstood programme in sport: it is almost entirely rest. A 100 m specialist runs very little volume, but every metre is at or near maximum, with long recoveries — six to eight minutes between efforts — because sprinting slowly does not train sprinting. The gym is heavy and low-rep, the plyometrics are sharp, and the whole week is arranged so the nervous system is fresh for the fast days.',
    ethos: 'Fast, then rest. There is no such thing as a tired sprint session.',
    level: 'advanced',
    daysPerWeek: 4,
    blockWeeks: 10,
    icon: 'cardio.running',
    accent: '#F9A825',
    authenticityNote:
      'The structure is genuinely how sprinters train: low volume, maximum intensity, very long recoveries, heavy lifting, and hard/easy alternation. The temptation to add volume is exactly what turns a sprint programme into a middle-distance one.',
    safetyNote:
      'Sprinting is the highest hamstring-risk activity there is. Warm up thoroughly and build up over weeks — the first fast session after a lay-off is where the tears happen.',
    days: [
      { key: 'accel', label: 'Acceleration', sessionType: 'outdoor', focus: 'The first thirty metres — the phase that decides most races.', exercises: ['sprint-repeats', 'sled-push', 'hill-sprints', 'dynamic-warmup'], prescription: '6×30 m from blocks or a push, 5 min recovery', minutes: 50 },
      { key: 'maxv', label: 'Maximum velocity', sessionType: 'outdoor', focus: 'Top-end speed with flying starts — pure quality.', exercises: ['sprint-repeats', 'track-intervals', 'sport-plyometrics'], prescription: '4–6×40 m flying, 8 min recovery. Stop when times drop', minutes: 55 },
      { key: 'lift', label: 'Heavy lifting', sessionType: 'strength', focus: 'Force production. Heavy, low reps, long rests.', exercises: ['back-squat', 'deadlift', 'push-press', 'barbell-high-pull', 'box-jumps'], prescription: '5×3 at a genuinely heavy load, 3–4 min rests', minutes: 60 },
      { key: 'tempo', label: 'Tempo & recovery', sessionType: 'cardio', focus: 'Easy running that aids recovery without touching the fast system.', exercises: ['easy-run', 'stretching', 'hip-mobility', 'foam-rolling'], prescription: 'Relaxed 100s at 70%, then mobility', minutes: 40 },
    ],
    diet: {
      name: 'Power-to-weight',
      approach:
        'A sprinter is a power athlete: high protein to build and hold the muscle that produces force, enough carbohydrate to fuel a nervous-system-heavy week, and a body composition managed carefully because every kilogram has to be accelerated. Not a low-carb sport, despite the low training volume.',
      macroSlant: 'High protein, moderate carbs timed to the fast days, lean composition.',
      sampleDay: [
        { label: 'Breakfast', detail: 'Eggs, oats and fruit.' },
        { label: 'Pre-session', detail: 'Rice and chicken a few hours before the track.' },
        { label: 'Post-session', detail: 'Protein and carbohydrate straight after.' },
        { label: 'Dinner', detail: 'Beef or fish with potatoes and vegetables.' },
      ],
      notes: ['Cutting weight at the cost of force is the wrong trade — it is power-to-weight, not weight alone.'],
    },
  },
  {
    key: 'ath-marathoner',
    category: 'athlete',
    name: 'Elite Marathon Runner',
    tagline: '80% easy, 20% hard — and the discipline to keep the easy days easy.',
    origin:
      'Elite marathoners run enormous weekly volume, and the striking thing to anyone watching is how slow most of it is. The 80/20 distribution — roughly four-fifths of running below the first ventilatory threshold — turns up again and again in the training logs of the best distance runners, and holds from the Kenyan camps of Iten to European professionals. The hard sessions are genuinely hard; the easy days protect them.',
    ethos: 'Run easy on the easy days so you can run hard on the hard ones.',
    level: 'advanced',
    daysPerWeek: 6,
    blockWeeks: 16,
    icon: 'cardio.marathon',
    accent: '#00838F',
    authenticityNote:
      'The 80/20 split, the long run, the threshold session and a strict easy pace are all genuine features of elite distance training. The volume here is scaled well below a professional\'s 160–220 km a week — that figure takes years to build and is not a target to jump to.',
    safetyNote:
      'Nearly every running injury traces to adding volume too quickly. Cap increases around 10% a week, and take the easy days genuinely easy — running them at a moderate pace is the single most common way amateurs get hurt.',
    days: [
      { key: 'long', label: 'The long run', sessionType: 'outdoor', focus: 'The cornerstone. Time on feet, at a pace you could hold all day.', exercises: ['long-run'], prescription: 'Build 20 → 32 km, conversational throughout', minutes: 140 },
      { key: 'threshold', label: 'Threshold', sessionType: 'outdoor', focus: 'Comfortably hard — the pace you could hold for an hour.', exercises: ['progression-run', 'track-intervals', 'fartlek-run'], prescription: '4×8 min at threshold, 2 min float', minutes: 60 },
      { key: 'intervals', label: 'Intervals', sessionType: 'outdoor', focus: 'The sharp end — VO2max work, sparingly.', exercises: ['track-intervals', 'hill-repeats', 'sprint-repeats'], prescription: '6×1 km hard, equal recovery', minutes: 55 },
      { key: 'easy1', label: 'Easy run', sessionType: 'outdoor', focus: 'Volume at a genuinely easy effort. Discipline, not laziness.', exercises: ['easy-run', 'recovery-run'], prescription: '10–14 km easy — if in doubt, slower', minutes: 65 },
      { key: 'easy2', label: 'Easy + strides', sessionType: 'outdoor', focus: 'Easy running with a few short pick-ups to keep the legs quick.', exercises: ['easy-run', 'sprint-repeats'], prescription: '10 km easy, then 6×20 s strides', minutes: 60 },
      { key: 'strength', label: 'Runner\'s strength', sessionType: 'calisthenics', focus: 'The small amount of strength work that keeps a high-mileage runner whole.', exercises: ['single-leg-rdl', 'nordic-negative', 'single-leg-calf-raise', 'side-plank', 'glute-bridge'], prescription: 'Twice weekly, light, never to failure', minutes: 30 },
    ],
    diet: {
      name: 'Fuelling the mileage',
      approach:
        'Very high carbohydrate — distance runners are the clearest case in sport where carbs are the performance variable. Protein around 1.6 g/kg supports the constant repair of high-volume running, iron status is monitored closely because distance runners lose it, and race-day fuelling is rehearsed in training rather than improvised.',
      macroSlant: 'Very high carbohydrate, moderate protein, iron watched carefully.',
      sampleDay: [
        { label: 'Pre-run', detail: 'Something light and carbohydrate-based before the morning run.' },
        { label: 'Breakfast', detail: 'Large oats with fruit and eggs after training.' },
        { label: 'Lunch', detail: 'Rice or pasta with lean protein and vegetables.' },
        { label: 'Dinner', detail: 'Carbohydrate again, with fish or red meat for iron.' },
      ],
      notes: [
        'Under-fuelling is the endemic problem in distance running, and in its severe form (RED-S) it costs bone density, hormones and years of progress.',
        'Practise race fuelling in training. Nothing new on race day is a rule that exists because people learn it the hard way.',
      ],
    },
  },
  {
    key: 'ath-swimmer',
    category: 'athlete',
    name: 'Olympic Swimmer',
    tagline: 'Kilometres in the pool, and a shoulder that has to survive them.',
    origin:
      'Competitive swimmers cover enormous distances — commonly 8–15 km a day across two sessions — with technique work threaded through everything because in water, drag beats power. Dryland training exists mostly to protect the shoulder: a swimmer performs tens of thousands of overhead rotations a week, and the rotator cuff and upper back are what keeps that sustainable.',
    ethos: 'Technique before effort. In water, being smoother is faster than being stronger.',
    level: 'advanced',
    daysPerWeek: 6,
    blockWeeks: 12,
    icon: 'cardio.swimming',
    accent: '#0277BD',
    authenticityNote:
      'Reflects a real swim programme: high pool volume, technique sets, sprint work, and dryland aimed squarely at shoulder health rather than size. Pool sessions obviously need a pool; rowing is a substitute for the engine but not for the technique.',
    safetyNote:
      'Swimmer\'s shoulder is an overuse injury, and it comes from volume added faster than the cuff can adapt. The dryland pulling and external-rotation work is not optional filler — it is the thing that keeps the shoulder in the sport.',
    days: [
      { key: 'endurance', label: 'Aerobic set', sessionType: 'outdoor', focus: 'The long steady kilometres that build the engine.', exercises: ['swimming-laps', 'swimming'], prescription: '3–5 km of continuous and broken swimming', minutes: 75 },
      { key: 'technique', label: 'Technique', sessionType: 'outdoor', focus: 'Drills and stroke correction — drag costs more than power gains.', exercises: ['swimming', 'swimming-laps', 'breathwork'], prescription: 'Drill sets, 40 min, quality over distance', minutes: 45 },
      { key: 'sprint', label: 'Sprint set', sessionType: 'outdoor', focus: 'Short maximum efforts with full recovery.', exercises: ['swimming-laps', 'open-water-swim'], prescription: '10×50 m maximum, long rests', minutes: 45 },
      { key: 'dryland', label: 'Dryland & shoulders', sessionType: 'strength', focus: 'Everything that keeps the shoulder in the water.', exercises: ['face-pull', 'cable-external-rotation', 'pull-up', 'db-scaption-raise', 'y-raise', 'plank'], prescription: 'Higher reps, controlled, 40 min', minutes: 45 },
      { key: 'power', label: 'Power', sessionType: 'strength', focus: 'Force for starts and turns, which decide close races.', exercises: ['box-jumps', 'deadlift', 'pull-up', 'standing-power-throw', 'kettlebell-swing'], prescription: 'Explosive lifts and throws, 4×4', minutes: 45 },
      { key: 'mobility', label: 'Mobility & recovery', sessionType: 'mindbody', focus: 'Thoracic and shoulder range — the swimmer\'s maintenance work.', exercises: ['thoracic-mobility', 'shoulder-mobility', 'wall-slides', 'foam-rolling', 'stretching'], prescription: '30 min of range and recovery work', minutes: 30 },
    ],
    diet: {
      name: 'Fuelling two sessions a day',
      approach:
        'Swimmers burn enormous energy — cold water and long doubles push daily needs very high — and the practical problem is eating enough between a 5am and a 4pm session. High carbohydrate, protein spread across the day, and deliberate eating immediately after the morning swim so the afternoon one is not run on empty.',
      macroSlant: 'Very high total energy, high carbohydrate, protein spread across the day.',
      sampleDay: [
        { label: 'Pre-dawn', detail: 'Something small and sweet before the early session.' },
        { label: 'After the morning swim', detail: 'A proper meal — oats, eggs, fruit, milk.' },
        { label: 'Lunch', detail: 'Rice or pasta with chicken and vegetables.' },
        { label: 'Dinner', detail: 'Fish or beef with potatoes and greens.' },
      ],
      notes: ['The classic swimmer error is skipping post-morning food and arriving at the afternoon session already empty.'],
    },
  },
  {
    key: 'ath-cyclist',
    category: 'athlete',
    name: 'Pro Cyclist',
    tagline: 'Long endurance base, short savage intervals, watts per kilogram.',
    origin:
      'Professional road cycling is a polarised sport: long, genuinely easy endurance rides making up most of the week, punctuated by very hard interval sessions. The metric that decides climbing races is watts per kilogram, which makes cycling unusually sensitive to body composition — and unusually prone to athletes taking that too far. Gym work is minimal in season and aimed at bone density and the hips.',
    ethos: 'Ride lots, mostly easy. Then, occasionally, ride very hard indeed.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 12,
    icon: 'cardio.cycling',
    accent: '#6A1B9A',
    authenticityNote:
      'Follows the polarised model used across professional endurance cycling — a large easy base with a small dose of very hard work — rather than the moderate-intensity middle ground most amateurs default to.',
    safetyNote:
      'Cycling is not weight-bearing, so bone density needs looking after separately — the squats and jumps in the strength day are there for exactly that reason, not for cycling power.',
    days: [
      { key: 'base', label: 'Endurance base', sessionType: 'outdoor', focus: 'Long, steady, genuinely easy. The bulk of the week.', exercises: ['road-cycling', 'gravel-cycling'], prescription: '3–5 hours at a conversational effort', minutes: 210 },
      { key: 'threshold', label: 'Threshold intervals', sessionType: 'cardio', focus: 'Sustained power — the engine of a time trial.', exercises: ['cycling-time-trial', 'bike-intervals', 'spin-bike'], prescription: '4×10 min at threshold, 5 min easy', minutes: 75 },
      { key: 'vo2', label: 'VO2max intervals', sessionType: 'cardio', focus: 'The very hard end, in small doses.', exercises: ['bike-intervals', 'cycling-hills', 'assault-bike'], prescription: '5×4 min flat out, equal recovery', minutes: 60 },
      { key: 'recovery', label: 'Recovery spin', sessionType: 'outdoor', focus: 'Easy enough to feel pointless. That is correct.', exercises: ['road-cycling', 'cycling-commute'], prescription: '60–90 min very easy, high cadence', minutes: 75 },
      { key: 'strength', label: 'Strength & bone', sessionType: 'strength', focus: 'Hips, and the loading that a non-impact sport never provides.', exercises: ['back-squat', 'romanian-deadlift', 'single-leg-rdl', 'box-jumps', 'plank'], prescription: '3×5 heavy, plus jumps for bone', minutes: 45 },
    ],
    diet: {
      name: 'Fuelling the ride',
      approach:
        'Carbohydrate is the currency of cycling. Long rides are fuelled on the bike — modern practice pushes 60–90 g of carbohydrate an hour on hard days — and daily intake tracks the training load closely. Cycling has a well-documented problem with under-fuelling in pursuit of watts per kilogram, and the endpoint of that is lost bone density and disrupted hormones, not a better climber.',
      macroSlant: 'Carbohydrate scaled to the ride, protein steady, fuelling done on the bike.',
      sampleDay: [
        { label: 'Pre-ride', detail: 'Oats and fruit before a long day out.' },
        { label: 'On the bike', detail: 'Carbohydrate every hour on hard or long rides — this is the part people skip.' },
        { label: 'Post-ride', detail: 'Protein and carbohydrate immediately.' },
        { label: 'Dinner', detail: 'Rice or potatoes with fish or lean meat and vegetables.' },
      ],
      notes: [
        'Chasing watts per kilogram by cutting weight is the sport\'s classic trap. Under-fuelling costs bone, hormones and eventually the watts too.',
        'Fuelling on the bike is a trainable skill — the gut adapts to what you practise giving it.',
      ],
    },
  },
  {
    key: 'ath-tennis',
    category: 'athlete',
    name: 'Pro Tennis Player',
    tagline: 'Hundreds of direction changes, a rotational serve, and five-set stamina.',
    origin:
      'A tennis match is hundreds of short sprints with constant deceleration, played over anything from ninety minutes to five hours. The physical priorities are lateral movement and braking, rotational power for the serve and groundstrokes, and enough aerobic base to still be moving in the fourth set. It is also strikingly asymmetric — one arm does the hitting — which is why the training deliberately works both sides.',
    ethos: 'First to the ball, still moving in the fifth set.',
    level: 'intermediate',
    daysPerWeek: 5,
    blockWeeks: 10,
    icon: 'sport.tennis',
    accent: '#558B2F',
    authenticityNote:
      'Built on the real physical demands — multidirectional movement, deceleration, rotational power and shoulder care for the serve. The asymmetry work is included because tennis loads one side hard and coaches genuinely train against it.',
    days: [
      { key: 'movement', label: 'Court movement', sessionType: 'cardio', focus: 'Lateral speed and braking — most points are won getting there.', exercises: ['agility-ladder', 'shuttle-runs', 'sport-footwork', 'sprint-repeats'], prescription: 'Multidirectional drills, 30 min of work', minutes: 45 },
      { key: 'rotation', label: 'Rotational power', sessionType: 'strength', focus: 'The serve and the groundstroke — power through the trunk.', exercises: ['landmine-rotation', 'cable-woodchopper', 'landmine-anti-rotation-press', 'standing-power-throw', 'russian-twist'], prescription: 'Explosive rotation both sides, 4×6', minutes: 45 },
      { key: 'court', label: 'On court', sessionType: 'sport', focus: 'The sport itself — technique, patterns, and points.', exercises: ['tennis', 'sport-serve-practice', 'sport-wall-ball'], prescription: '60–90 min of hitting and points', minutes: 75 },
      { key: 'strength', label: 'Legs & shoulder', sessionType: 'strength', focus: 'Single-leg strength, and the shoulder that serves 100+ times a match.', exercises: ['bulgarian-split-squat', 'single-leg-rdl', 'face-pull', 'cable-external-rotation', 'db-scaption-raise'], prescription: 'Legs 4×6, shoulder work higher rep', minutes: 50 },
      { key: 'engine', label: 'Match stamina', sessionType: 'cardio', focus: 'Repeated hard efforts with short recoveries — a match, essentially.', exercises: ['shuttle-runs', 'easy-run', 'jump-rope-basic', 'sport-plyometrics'], prescription: 'Intervals matched to point length: 10 s on, 20 s off', minutes: 40 },
    ],
    diet: {
      name: 'Playing long',
      approach:
        'Matches can run five hours in heat, which makes tennis nutrition largely a hydration and in-match fuelling problem. Carbohydrate before and during play, deliberate sodium replacement for heavy sweaters, and enough daily protein to recover for the next round rather than the next week.',
      macroSlant: 'Carbs before and during play, sodium managed, protein steady.',
      sampleDay: [
        { label: 'Pre-match', detail: 'Pasta or rice with lean protein, 2–3 hours before.' },
        { label: 'During play', detail: 'Carbohydrate and electrolytes at changeovers — long matches are won here.' },
        { label: 'Post-match', detail: 'Protein and carbohydrate immediately; recovery is short between rounds.' },
        { label: 'Dinner', detail: 'Balanced plate with a solid carbohydrate portion.' },
      ],
      notes: ['Cramping in the fifth set is usually a fluid and sodium failure, not a fitness one.'],
    },
  },
];

export function specialProgramsFor(category: SpecialCategory): SpecialProgram[] {
  return SPECIAL_PROGRAMS.filter((p) => p.category === category);
}

/**
 * The order categories are shown in, guaranteed to include every one of them.
 *
 * The screens used to keep their own hard-coded array, and adding a category
 * meant remembering to edit two unrelated files — which is exactly how the
 * Elite Sport programmes shipped complete and invisible. The preferred order
 * below is a *preference*: anything missing from it is appended rather than
 * dropped, so a new category can never fail to render.
 */
const PREFERRED_ORDER: SpecialCategory[] = [
  'military',
  'athlete',
  'historical',
  'superhero',
  'counters',
  'lifestyle',
];

export const SPECIAL_CATEGORY_ORDER: SpecialCategory[] = (() => {
  const all = Object.keys(SPECIAL_CATEGORY_META) as SpecialCategory[];
  const ordered = PREFERRED_ORDER.filter((c) => all.includes(c));
  return [...ordered, ...all.filter((c) => !ordered.includes(c))];
})();

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
