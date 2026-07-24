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

export type SpecialCategory = 'military' | 'historical' | 'superhero' | 'lifestyle';

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
    label: 'Superheroes & Screen Legends',
    blurb: 'Training inspired by heroes and the icons — real and fictional — behind them.',
    icon: 'mindbody.hero',
  },
  lifestyle: {
    label: 'Everyday Special Ops',
    blurb: 'Short, equipment-light routines for real life — desk, dawn, travel, a single cell.',
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
