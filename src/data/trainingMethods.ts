import type { SessionType } from '@/db/schema';

/**
 * Training METHODS — the "how" for every category, the same way splits are the
 * "how" for strength.
 *
 * Each method is a real, named protocol with the structure you'd actually
 * follow, an honest note on what it's good for, and what drives progress in it
 * (so the app can track effort meaningfully instead of just counting minutes).
 * Picking one pre-fills the session and tags it, so progress can be compared
 * like-for-like over time.
 */

export type EffortMetric = 'load' | 'reps' | 'duration' | 'distance' | 'rounds' | 'intensity';

export interface TrainingMethod {
  key: string;
  sessionType: SessionType;
  label: string;
  blurb: string;
  /** how the session is structured */
  structure: string;
  /** what "getting better" looks like in this method — drives the progress view */
  progressBy: EffortMetric;
  progressNote: string;
  /** typical session length, minutes */
  typicalMinutes: number;
  /** exercise slugs to pre-fill, when the method implies specific work */
  prefillSlugs?: string[];
  icon: string;
}

export const TRAINING_METHODS: TrainingMethod[] = [
  // ══════════════ STRENGTH ══════════════ (splits live separately; these are protocols)
  {
    key: 'str-5x5', sessionType: 'strength', label: '5×5 Linear', icon: 'strength.barbell',
    blurb: 'Five sets of five on the big lifts, adding weight each session.',
    structure: '2–3 compound lifts · 5 sets × 5 reps · 3–5 min rest · add 2.5 kg when all sets hit.',
    progressBy: 'load', progressNote: 'Progress = the bar goes up. Stalling twice means deload 10%.',
    typicalMinutes: 55,
  },
  {
    key: 'str-531', sessionType: 'strength', label: '5/3/1 Waves', icon: 'strength.barbell',
    blurb: 'Percentage-based monthly waves around one main lift per day.',
    structure: 'One main lift to a top set (5/3/1 by week) + accessories. 4-week wave, then reset +2.5–5 kg.',
    progressBy: 'load', progressNote: 'Progress = training max climbing wave over wave, not every session.',
    typicalMinutes: 60,
  },
  {
    key: 'str-hypertrophy', sessionType: 'strength', label: 'Hypertrophy 8–12', icon: 'strength.dumbbell',
    blurb: 'Classic muscle-building rep range at 1–3 reps from failure.',
    structure: '4–6 exercises · 3–4 sets × 8–12 reps · 60–90 s rest · 10–20 hard sets per muscle per week.',
    progressBy: 'reps', progressNote: 'Progress = more reps at the same load, then add load and repeat.',
    typicalMinutes: 60,
  },
  {
    key: 'str-gvt', sessionType: 'strength', label: 'German Volume (10×10)', icon: 'strength.barbell',
    blurb: 'Ten sets of ten at ~60% — brutal volume, short blocks only.',
    structure: 'One main movement · 10 sets × 10 reps · 60–90 s rest. Run 4–6 weeks max.',
    progressBy: 'load', progressNote: 'Progress = completing all 100 reps, then +2.5 kg next block.',
    typicalMinutes: 65,
  },
  {
    key: 'str-pyramid', sessionType: 'strength', label: 'Pyramid Sets', icon: 'strength.machine',
    blurb: 'Climb the weight while reps drop, then come back down.',
    structure: '12 → 10 → 8 → 6 reps up in load, optionally back down. 2–3 exercises.',
    progressBy: 'load', progressNote: 'Progress = a heavier top of the pyramid at the same bottom-end reps.',
    typicalMinutes: 50,
  },
  {
    key: 'str-cluster', sessionType: 'strength', label: 'Cluster / Rest-Pause', icon: 'strength.kettlebell',
    blurb: 'Break a heavy set into mini-sets with short rests to add quality reps.',
    structure: 'Heavy set to near-failure, rest 15–20 s, repeat ×2–3 as one cluster.',
    progressBy: 'reps', progressNote: 'Progress = more total quality reps in the cluster at the same load.',
    typicalMinutes: 45,
  },

  // ══════════════ CALISTHENICS ══════════════
  {
    key: 'cal-progression', sessionType: 'calisthenics', label: 'Skill Progressions', icon: 'strength.calisthenics',
    blurb: 'Work the next hardest variation of a movement until it is clean.',
    structure: 'Pick 3–4 patterns · 3–5 sets of the hardest variation you can control · full rest.',
    progressBy: 'reps', progressNote: 'Progress = harder variation unlocked, or more clean reps of the current one.',
    typicalMinutes: 45,
  },
  {
    key: 'cal-emom', sessionType: 'calisthenics', label: 'EMOM', icon: 'core.timer',
    blurb: 'Every Minute On the Minute — fixed work, the clock sets your rest.',
    structure: '10–20 min · a set at the top of each minute · rest is whatever is left.',
    progressBy: 'rounds', progressNote: 'Progress = more reps per minute, or holding the pace for more minutes.',
    typicalMinutes: 20,
  },
  {
    key: 'cal-amrap', sessionType: 'calisthenics', label: 'AMRAP', icon: 'core.timer',
    blurb: 'As Many Rounds As Possible in a fixed window.',
    structure: 'Fixed circuit · as many rounds as possible in 10–20 min · rest as needed.',
    progressBy: 'rounds', progressNote: 'Progress = more rounds in the same window. Directly comparable session to session.',
    typicalMinutes: 20,
  },
  {
    key: 'cal-circuit', sessionType: 'calisthenics', label: 'Circuit', icon: 'strength.calisthenics',
    blurb: 'Stations back-to-back for conditioning plus strength-endurance.',
    structure: '5–8 stations · 40 s work / 20 s change · 3–4 laps.',
    progressBy: 'rounds', progressNote: 'Progress = more laps or more reps per station at the same work:rest.',
    typicalMinutes: 30,
  },

  // ══════════════ CARDIO ══════════════
  {
    key: 'car-zone2', sessionType: 'cardio', label: 'Zone 2 (Easy)', icon: 'cardio.treadmill',
    blurb: 'Conversational pace — the aerobic base that everything else sits on.',
    structure: '30–90 min steady, able to hold a conversation. Nose-breathing pace.',
    progressBy: 'duration', progressNote: 'Progress = same easy effort covering more distance, or a lower heart rate for the same pace.',
    typicalMinutes: 45,
  },
  {
    key: 'car-liss', sessionType: 'cardio', label: 'LISS', icon: 'cardio.walk',
    blurb: 'Low-intensity steady state — recovery-friendly, easy to accumulate.',
    structure: '30–60 min at a genuinely easy, sustainable pace.',
    progressBy: 'duration', progressNote: 'Progress = more accumulated minutes per week without extra fatigue.',
    typicalMinutes: 40,
  },
  {
    key: 'car-hiit', sessionType: 'cardio', label: 'HIIT', icon: 'cardio.running',
    blurb: 'Short, very hard bursts with real recovery. Potent but costly.',
    structure: '8–12 × 30 s near-max / 90 s easy. Cap at 1–2 sessions a week.',
    progressBy: 'intensity', progressNote: 'Progress = holding a higher output across all intervals, not just the first.',
    typicalMinutes: 25,
  },
  {
    key: 'car-intervals', sessionType: 'cardio', label: 'Intervals', icon: 'cardio.pace',
    blurb: 'Repeats at a target pace with controlled rest.',
    structure: '4–8 × 2–5 min at threshold · equal or half rest.',
    progressBy: 'intensity', progressNote: 'Progress = same pace at lower effort, or more reps at the same pace.',
    typicalMinutes: 40,
  },
  {
    key: 'car-tempo', sessionType: 'cardio', label: 'Tempo', icon: 'cardio.pace',
    blurb: 'Comfortably hard, sustained — raises the pace you can hold.',
    structure: '20–40 min continuous at a "comfortably hard" pace, plus warm-up/cool-down.',
    progressBy: 'intensity', progressNote: 'Progress = a faster pace held for the same duration.',
    typicalMinutes: 40,
  },
  {
    key: 'car-fartlek', sessionType: 'cardio', label: 'Fartlek', icon: 'cardio.running',
    blurb: 'Unstructured speed play — surge, cruise, repeat by feel.',
    structure: '30–45 min mixing easy running with random surges of 30 s–3 min.',
    progressBy: 'duration', progressNote: 'Progress = more time spent surging within the same run.',
    typicalMinutes: 35,
  },

  // ══════════════ MARTIAL ARTS ══════════════
  {
    key: 'ma-shadow', sessionType: 'martial_arts', label: 'Shadow Work', icon: 'martial.strike',
    blurb: 'Technique and movement with no resistance — where form is built.',
    structure: '3–6 rounds × 3 min, focusing on one correction per round.',
    progressBy: 'rounds', progressNote: 'Progress = cleaner mechanics and more rounds held at full intent.',
    typicalMinutes: 20,
  },
  {
    key: 'ma-bag', sessionType: 'martial_arts', label: 'Bag Work', icon: 'martial.bag',
    blurb: 'Power and conditioning on the heavy bag.',
    structure: '5–10 rounds × 3 min / 1 min rest. Combinations, then free work.',
    progressBy: 'rounds', progressNote: 'Progress = more rounds at the same output, or higher output per round.',
    typicalMinutes: 35,
  },
  {
    key: 'ma-pads', sessionType: 'martial_arts', label: 'Pad Work', icon: 'martial.gloves',
    blurb: 'Partner-fed combinations — timing, accuracy and reaction.',
    structure: '5–8 rounds × 3 min with a pad holder, drilling set combinations.',
    progressBy: 'rounds', progressNote: 'Progress = sharper timing and combinations landing clean under fatigue.',
    typicalMinutes: 35,
  },
  {
    key: 'ma-drilling', sessionType: 'martial_arts', label: 'Technical Drilling', icon: 'martial.grapple',
    blurb: 'Repetition of a single technique with a cooperative partner.',
    structure: 'Pick 1–3 techniques · high-rep reps each side · slow, then progressive resistance.',
    progressBy: 'reps', progressNote: 'Progress = the technique working against increasing resistance.',
    typicalMinutes: 30,
  },
  {
    key: 'ma-sparring', sessionType: 'martial_arts', label: 'Sparring', icon: 'martial.spar',
    blurb: 'Live, resisting practice — the real test. Manage the volume.',
    structure: '3–6 rounds × 3 min, controlled intensity. Hard sparring at most weekly.',
    progressBy: 'rounds', progressNote: 'Progress = staying composed and technical for more rounds. Track head impacts honestly and rest properly.',
    typicalMinutes: 30,
  },
  {
    key: 'ma-rolling', sessionType: 'martial_arts', label: 'Rolling (Grappling)', icon: 'martial.grapple',
    blurb: 'Live grappling rounds — BJJ, wrestling, judo newaza.',
    structure: '4–8 rounds × 5–6 min with varied partners.',
    progressBy: 'rounds', progressNote: 'Progress = better positions reached and less energy burned per round.',
    typicalMinutes: 45,
  },
  {
    key: 'ma-forms', sessionType: 'martial_arts', label: 'Forms / Kata', icon: 'martial.belt',
    blurb: 'Prescribed sequences — precision, balance and control.',
    structure: 'Run the form slowly for precision, then at speed. 5–10 repetitions.',
    progressBy: 'reps', progressNote: 'Progress = cleaner execution and forms retained at full speed.',
    typicalMinutes: 25,
  },
  {
    key: 'ma-conditioning', sessionType: 'martial_arts', label: 'Fight Conditioning', icon: 'cardio.running',
    blurb: 'Sport-specific engine work built on round timing.',
    structure: 'Circuits on 3 min / 1 min round timing — burpees, sprawls, sled, skipping.',
    progressBy: 'rounds', progressNote: 'Progress = output holding steady across later rounds instead of falling off.',
    typicalMinutes: 30,
  },

  // ══════════════ OUTDOOR ══════════════
  {
    key: 'out-long', sessionType: 'outdoor', label: 'Long Slow Distance', icon: 'cardio.marathon',
    blurb: 'The weekly long one — builds durability more than speed.',
    structure: '60–150 min easy. Increase weekly distance by no more than ~10%.',
    progressBy: 'distance', progressNote: 'Progress = more distance at the same easy effort.',
    typicalMinutes: 90,
  },
  {
    key: 'out-hills', sessionType: 'outdoor', label: 'Hill Repeats', icon: 'cardio.elevation',
    blurb: 'Strength for runners — power without the pounding of flat sprints.',
    structure: '6–10 × 60–90 s uphill hard · jog down recovery.',
    progressBy: 'rounds', progressNote: 'Progress = more repeats, or the same repeats faster.',
    typicalMinutes: 40,
  },
  {
    key: 'out-hike', sessionType: 'outdoor', label: 'Hike / Ruck', icon: 'cardio.hiking',
    blurb: 'Load-carrying endurance — high aerobic value, low joint cost.',
    structure: '60–180 min over varied terrain, optionally with a weighted pack.',
    progressBy: 'duration', progressNote: 'Progress = more distance, elevation or carried load at the same effort.',
    typicalMinutes: 120,
  },

  // ══════════════ SPORT ══════════════
  {
    key: 'spo-match', sessionType: 'sport', label: 'Match Play', icon: 'sport.soccer',
    blurb: 'Competitive play — the point of the training.',
    structure: 'Full game or match. Log the score and how you felt.',
    progressBy: 'duration', progressNote: 'Progress = holding performance deeper into the game.',
    typicalMinutes: 90,
  },
  {
    key: 'spo-drills', sessionType: 'sport', label: 'Skill Drills', icon: 'sport.tennis',
    blurb: 'Isolated technical repetition away from the chaos of a match.',
    structure: '3–5 drills · high repetition · short rests.',
    progressBy: 'reps', progressNote: 'Progress = higher success rate under speed and fatigue.',
    typicalMinutes: 45,
  },

  // ══════════════ MIND-BODY ══════════════
  {
    key: 'mb-vinyasa', sessionType: 'mindbody', label: 'Vinyasa Flow', icon: 'mindbody.yoga',
    blurb: 'Breath-linked movement — mobility with a mild aerobic edge.',
    structure: '30–60 min continuous flow, breath-paced.',
    progressBy: 'duration', progressNote: 'Progress = deeper positions held with calmer breathing.',
    typicalMinutes: 45,
  },
  {
    key: 'mb-yin', sessionType: 'mindbody', label: 'Yin / Long Holds', icon: 'mindbody.stretch',
    blurb: 'Passive long holds targeting connective tissue.',
    structure: '3–5 min per position, fully relaxed, 6–10 positions.',
    progressBy: 'duration', progressNote: 'Progress = longer comfortable holds and better end-range.',
    typicalMinutes: 40,
  },
  {
    key: 'mb-mobility', sessionType: 'mindbody', label: 'Mobility Circuit', icon: 'mindbody.stretch',
    blurb: 'Active range work — the joints you actually use in training.',
    structure: 'Target 3–4 joints · controlled articular rotations + loaded stretches.',
    progressBy: 'reps', progressNote: 'Progress = more usable active range, not just passive flexibility.',
    typicalMinutes: 20,
  },

  // ══════════════ MEDITATION ══════════════
  {
    key: 'med-breath', sessionType: 'meditation', label: 'Breathwork', icon: 'mindbody.breath',
    blurb: 'Paced breathing — the fastest lever on the nervous system.',
    structure: 'Box breathing or 4-7-8 · 5–15 min.',
    progressBy: 'duration', progressNote: 'Progress = longer comfortable sessions and faster down-regulation.',
    typicalMinutes: 10,
  },
  {
    key: 'med-scan', sessionType: 'meditation', label: 'Body Scan', icon: 'mindbody.meditation',
    blurb: 'Attention swept through the body — good for sleep onset.',
    structure: '10–30 min, moving attention head to toe.',
    progressBy: 'duration', progressNote: 'Progress = staying with it longer without drifting.',
    typicalMinutes: 15,
  },
  {
    key: 'med-sit', sessionType: 'meditation', label: 'Unguided Sit', icon: 'mindbody.meditation',
    blurb: 'Plain sitting practice — no audio, no props.',
    structure: '10–30 min, one anchor (breath or sound).',
    progressBy: 'duration', progressNote: 'Progress = consistency across the week matters more than session length.',
    typicalMinutes: 15,
  },

  // ══════════════ CARDIO — MACHINE & PROTOCOL VARIATIONS ══════════════
  {
    key: 'car-tabata', sessionType: 'cardio', label: 'Tabata', icon: 'cardio.interval',
    blurb: 'Twenty seconds all-out, ten seconds off, eight times. Four minutes that hurt.',
    structure: '8 rounds × (20 s max effort / 10 s rest) = 4 min per block · 1–3 blocks · 5 min easy between.',
    progressBy: 'intensity', progressNote: 'Progress = holding the SAME output on round 8 as round 1. Fading is the failure mode, not stopping.',
    typicalMinutes: 20, prefillSlugs: ['assault-bike'],
  },
  {
    key: 'car-30-20-10', sessionType: 'cardio', label: '30-20-10', icon: 'cardio.interval',
    blurb: 'A Danish protocol: 30 s easy, 20 s moderate, 10 s sprint — repeated.',
    structure: '5 × (30 s easy / 20 s moderate / 10 s sprint) = one 5-min block · 2–4 blocks · 2 min between.',
    progressBy: 'rounds', progressNote: 'Progress = adding a block. Shown to improve 5 k time on ~half the usual volume.',
    typicalMinutes: 30,
  },
  {
    key: 'car-pyramid', sessionType: 'cardio', label: 'Pyramid Intervals', icon: 'cardio.pace',
    blurb: 'Intervals that climb then descend — 1-2-3-4-3-2-1 minutes.',
    structure: 'Work 1→4→1 min hard with equal easy recoveries. Any machine.',
    progressBy: 'duration', progressNote: 'Progress = a taller pyramid, or the same pyramid at a higher level/pace.',
    typicalMinutes: 35,
  },
  {
    key: 'car-stairs', sessionType: 'cardio', label: 'Stair Machine Climb', icon: 'cardio.stairs',
    blurb: 'The stepmill — highest calorie burn per minute of any low-impact machine.',
    structure: '20–40 min steady, or 1 min hard / 2 min easy levels. Hands off the rails.',
    progressBy: 'intensity', progressNote: 'Progress = a higher level for the same duration. Leaning on the rails silently undoes it.',
    typicalMinutes: 30, prefillSlugs: ['stairmaster'],
  },
  {
    key: 'car-bike-sprints', sessionType: 'cardio', label: 'Bike Sprints', icon: 'cardio.cycling',
    blurb: 'Short maximal efforts against heavy resistance — the safest way to sprint.',
    structure: '6–10 × 10–20 s all-out · 2–3 min easy spin between · long warm-up.',
    progressBy: 'intensity', progressNote: 'Progress = higher peak watts/RPM, and less drop-off across the set.',
    typicalMinutes: 30, prefillSlugs: ['spin-bike'],
  },
  {
    key: 'car-machine-circuit', sessionType: 'cardio', label: 'Machine Circuit', icon: 'cardio.elliptical',
    blurb: 'Rotate through the cardio floor — no single machine long enough to get boring.',
    structure: '4–6 machines × 5–8 min each, moderate effort, no rest between stations.',
    progressBy: 'duration', progressNote: 'Progress = more total time, or the same time at a higher level per machine.',
    typicalMinutes: 40, prefillSlugs: ['rowing-machine', 'stationary-bike', 'stairmaster', 'elliptical'],
  },
  {
    key: 'car-rope', sessionType: 'cardio', label: 'Jump Rope Rounds', icon: 'cardio.jumpRope',
    blurb: 'Rope by the round — the boxer\'s conditioning, and a skill in its own right.',
    structure: '5–12 rounds × 3 min · 30–60 s rest · rotate bounce, boxer skip, high knees, double-unders.',
    progressBy: 'rounds', progressNote: 'Progress = more rounds unbroken, then harder variations inside the round.',
    typicalMinutes: 30, prefillSlugs: ['jump-rope-basic', 'jump-rope-alternate', 'jump-rope-double-unders'],
  },
  {
    key: 'car-maf', sessionType: 'cardio', label: 'MAF / Heart-Rate Capped', icon: 'cardio.pace',
    blurb: 'Aerobic base built under a hard heart-rate ceiling (roughly 180 − age).',
    structure: '30–90 min never exceeding the cap — slow down, even to a walk, rather than break it.',
    progressBy: 'distance', progressNote: 'Progress = covering more ground at the SAME heart rate. That is aerobic fitness, precisely measured.',
    typicalMinutes: 50,
  },
  {
    key: 'car-recovery', sessionType: 'cardio', label: 'Recovery Spin', icon: 'cardio.cycling',
    blurb: 'Deliberately easy blood-flow work the day after something hard.',
    structure: '20–35 min very easy, conversational, low resistance. Stop before it feels like training.',
    progressBy: 'duration', progressNote: 'This one is not meant to progress — going harder defeats its purpose.',
    typicalMinutes: 25, prefillSlugs: ['recumbent-bike'],
  },
  {
    key: 'car-conditioning', sessionType: 'cardio', label: 'Bodyweight Conditioning', icon: 'cardio.plyo',
    blurb: 'No machines, no equipment — burpees, climbers, jacks, shuttles.',
    structure: '4–6 movements × 40 s work / 20 s rest · 3–5 rounds.',
    progressBy: 'rounds', progressNote: 'Progress = more reps inside the same work window, or an extra round.',
    typicalMinutes: 25, prefillSlugs: ['burpees', 'mountain-climbers', 'jumping-jacks', 'high-knees'],
  },

  // ══════════════ CALISTHENICS — MORE VARIATIONS ══════════════
  {
    key: 'cal-ladder', sessionType: 'calisthenics', label: 'Rep Ladder', icon: 'strength.pullup',
    blurb: 'Climb 1-2-3-4-5 reps and back down — high volume that never hits failure.',
    structure: 'One or two movements · ladder up to 5–8 and back · rest = the reps you just did.',
    progressBy: 'reps', progressNote: 'Progress = a taller ladder, or a harder progression at the same height.',
    typicalMinutes: 30,
  },
  {
    key: 'cal-greasing', sessionType: 'calisthenics', label: 'Greasing the Groove', icon: 'core.timer',
    blurb: 'Frequent easy sets through the day — never near failure, never sore.',
    structure: 'One movement, ~50% of max reps, 5–10 times across the day, every day.',
    progressBy: 'reps', progressNote: 'Progress = your max climbs without ever having trained to it. Skill, not fatigue.',
    typicalMinutes: 10,
  },
  {
    key: 'cal-tempo', sessionType: 'calisthenics', label: 'Tempo / Slow Negatives', icon: 'core.timer',
    blurb: 'Slow the lowering phase to make bodyweight feel heavier without adding weight.',
    structure: '3–5 sets · 3–5 reps · 4–6 s lowering, 1 s pause, controlled up.',
    progressBy: 'duration', progressNote: 'Progress = a longer negative under control, then more reps at that tempo.',
    typicalMinutes: 35,
  },
  {
    key: 'cal-skill', sessionType: 'calisthenics', label: 'Skill Practice (holds)', icon: 'strength.calisthenics',
    blurb: 'Handstand, lever, planche and L-sit work — practised fresh, never fatigued.',
    structure: '15–25 min of short holds with full rest, before any conditioning work.',
    progressBy: 'duration', progressNote: 'Progress = a longer clean hold, or a harder lever position at the same time.',
    typicalMinutes: 25,
  },

  // ══════════════ MARTIAL ARTS — MORE VARIATIONS ══════════════
  {
    key: 'ma-footwork', sessionType: 'martial_arts', label: 'Footwork & Movement', icon: 'martial.footwork',
    blurb: 'Position before power — stepping, pivoting, angles and ring-craft.',
    structure: '4–6 rounds × 3 min: forward/back, lateral, pivots, cutting angles. No strikes.',
    progressBy: 'rounds', progressNote: 'Progress = holding stance and balance for the whole round without crossing the feet.',
    typicalMinutes: 25, prefillSlugs: ['ma-footwork-drill'],
  },
  {
    key: 'ma-defense', sessionType: 'martial_arts', label: 'Defence & Counters', icon: 'martial.defense',
    blurb: 'Slipping, rolling, parrying — then answering immediately.',
    structure: '5–8 rounds × 3 min alternating pure defence and defence-into-counter.',
    progressBy: 'rounds', progressNote: 'Progress = getting hit less in the same drill, and countering without a pause.',
    typicalMinutes: 30, prefillSlugs: ['ma-defense-drill', 'ma-counter-drill'],
  },
  {
    key: 'ma-clinch', sessionType: 'martial_arts', label: 'Clinch & Takedowns', icon: 'martial.clinch',
    blurb: 'The space between striking and the ground — control, off-balancing, entries.',
    structure: '6–10 rounds × 3 min: neck control, inside position, entries, sprawls.',
    progressBy: 'rounds', progressNote: 'Progress = winning inside position more often, and finishing entries against resistance.',
    typicalMinutes: 40, prefillSlugs: ['ma-clinch-work', 'ma-takedown-entries', 'ma-sprawl-drill'],
  },
  {
    key: 'ma-positional', sessionType: 'martial_arts', label: 'Positional Sparring', icon: 'martial.spar',
    blurb: 'Live rounds from one fixed position, reset every time it changes.',
    structure: '5–8 rounds × 3–5 min from a chosen position (guard, side, back, back-to-cage).',
    progressBy: 'rounds', progressNote: 'Progress = escaping or advancing sooner. The single fastest way to fix a specific hole.',
    typicalMinutes: 40, prefillSlugs: ['ma-positional-sparring'],
  },
  {
    key: 'ma-flow', sessionType: 'martial_arts', label: 'Flow Rolling', icon: 'martial.grapple',
    blurb: 'Continuous light grappling — no resistance spikes, no ego, no injuries.',
    structure: '3–6 rounds × 6–10 min at conversational intensity.',
    progressBy: 'duration', progressNote: 'Progress = smoother transitions and longer rounds without gassing or tensing up.',
    typicalMinutes: 40, prefillSlugs: ['ma-flow-rolling'],
  },
  {
    key: 'ma-solo', sessionType: 'martial_arts', label: 'Solo Drills (no partner)', icon: 'martial.forms',
    blurb: 'What to train alone — shadow, shrimping, bridging, forms, rope.',
    structure: '30–40 min: rope · shadow rounds · movement drills · forms.',
    progressBy: 'rounds', progressNote: 'Progress = crispness and volume. Keeps skill alive between gym sessions.',
    typicalMinutes: 35, prefillSlugs: ['ma-shadow-round', 'ma-shrimping', 'ma-bridging', 'ma-forms-kata'],
  },

  // ══════════════ SPORT & OUTDOOR — MORE VARIATIONS ══════════════
  {
    key: 'spo-conditioning', sessionType: 'sport', label: 'Sport Conditioning', icon: 'cardio.agility',
    blurb: 'Change of direction, acceleration and repeat-sprint ability for your sport.',
    structure: 'Shuttles, ladder work, sprint repeats and small-sided games. 30–45 min.',
    progressBy: 'intensity', progressNote: 'Progress = less drop-off across repeated sprints — that is what fades in the last quarter.',
    typicalMinutes: 40, prefillSlugs: ['shuttle-runs', 'agility-ladder', 'sprint-repeats'],
  },
  {
    key: 'spo-scrimmage', sessionType: 'sport', label: 'Small-Sided Games', icon: 'sport.soccer',
    blurb: 'Reduced-size games — far more touches and far more running than a full match.',
    structure: '4–8 blocks × 4–6 min with short rests.',
    progressBy: 'rounds', progressNote: 'Progress = maintaining quality in the last blocks, not just the first.',
    typicalMinutes: 45,
  },
  {
    key: 'out-tempo', sessionType: 'outdoor', label: 'Tempo Run', icon: 'cardio.pace',
    blurb: 'Comfortably hard, sustained — the pace you could hold for about an hour.',
    structure: '10 min easy · 20–40 min at threshold · 10 min easy.',
    progressBy: 'distance', progressNote: 'Progress = a faster pace at the same effort, or holding threshold longer.',
    typicalMinutes: 50, prefillSlugs: ['outdoor-run'],
  },
  {
    key: 'out-track', sessionType: 'outdoor', label: 'Track Intervals', icon: 'cardio.interval',
    blurb: 'Measured repeats on a track — the most precise way to track running fitness.',
    structure: '6–12 × 400 m, or 5–6 × 800 m, with timed jog recoveries.',
    progressBy: 'distance', progressNote: 'Progress = the same splits at lower effort, or faster splits with the same recovery.',
    typicalMinutes: 50, prefillSlugs: ['track-intervals'],
  },
  {
    key: 'out-sprints', sessionType: 'outdoor', label: 'Sprint Work', icon: 'cardio.running',
    blurb: 'Maximal short efforts with full recovery. Warm up thoroughly first.',
    structure: '6–10 × 20–60 m at 100%, walk-back recovery (2–4 min).',
    progressBy: 'intensity', progressNote: 'Progress = top speed. Quality only — when times drop off, the session is over.',
    typicalMinutes: 35, prefillSlugs: ['sprint-repeats'],
  },
  {
    key: 'out-ruck', sessionType: 'outdoor', label: 'Rucking', icon: 'cardio.hiking',
    blurb: 'Loaded walking — most of the aerobic return of running at a fraction of the joint cost.',
    structure: '45–90 min at 5–6 km/h with 8–20 kg. Start at ~10% bodyweight.',
    progressBy: 'distance', progressNote: 'Progress = distance first, then load. Never add both in the same week.',
    typicalMinutes: 60, prefillSlugs: ['rucking'],
  },

  // ══════════════ MIND-BODY & MEDITATION — MORE VARIATIONS ══════════════
  {
    key: 'mb-power', sessionType: 'mindbody', label: 'Power Yoga', icon: 'mindbody.yoga',
    blurb: 'Strength-biased flow — holds long enough to be actual training.',
    structure: '45–60 min continuous, arm balances and long standing holds.',
    progressBy: 'duration', progressNote: 'Progress = longer holds with steady breathing rather than deeper end-range.',
    typicalMinutes: 50, prefillSlugs: ['vinyasa-yoga'],
  },
  {
    key: 'mb-recovery', sessionType: 'mindbody', label: 'Recovery & Rolling', icon: 'mindbody.stretch',
    blurb: 'Foam rolling and easy stretching on rest days.',
    structure: '15–25 min: roll the big groups, then easy holds. Nothing painful.',
    progressBy: 'duration', progressNote: 'Progress is not the goal — this is a recovery input, and gets measured by how you train next.',
    typicalMinutes: 20, prefillSlugs: ['foam-rolling', 'stretching'],
  },
  {
    key: 'mb-taichi', sessionType: 'mindbody', label: 'Tai Chi', icon: 'martial.forms',
    blurb: 'Slow continuous forms — balance, control and calm in one practice.',
    structure: '20–45 min of form work at a constant unhurried pace.',
    progressBy: 'duration', progressNote: 'Progress = longer forms from memory, and steadier balance through transitions.',
    typicalMinutes: 30, prefillSlugs: ['tai-chi'],
  },
  {
    key: 'med-box', sessionType: 'meditation', label: 'Box Breathing', icon: 'mindbody.breath',
    blurb: 'Four counts in, hold, out, hold — the fastest way to drop arousal.',
    structure: '4-4-4-4 for 5–15 min. Useful before sleep and after conflict.',
    progressBy: 'duration', progressNote: 'Progress = a longer comfortable count (5-5-5-5, 6-6-6-6) without straining.',
    typicalMinutes: 10, prefillSlugs: ['box-breathing'],
  },
  {
    key: 'med-walking', sessionType: 'meditation', label: 'Walking Meditation', icon: 'cardio.walk',
    blurb: 'Attention on the feet, slow and deliberate — sitting is not the only way.',
    structure: '10–30 min slow walking, attention on contact and breath.',
    progressBy: 'duration', progressNote: 'Progress = fewer moments of autopilot across the same distance.',
    typicalMinutes: 20, prefillSlugs: ['walking-meditation'],
  },
  {
    key: 'med-loving-kindness', sessionType: 'meditation', label: 'Loving-Kindness', icon: 'mindbody.moodHappy',
    blurb: 'Directed goodwill practice — the best-evidenced meditation for mood.',
    structure: '10–20 min: self → someone close → someone neutral → someone difficult.',
    progressBy: 'duration', progressNote: 'Progress = reaching the harder categories without forcing it.',
    typicalMinutes: 15, prefillSlugs: ['loving-kindness', 'self-compassion'],
  },

  // ══════════════ SPORT — the work that isn't the match ══════════════
  {
    key: 'spo-technical', sessionType: 'sport', label: 'Technical Repetition', icon: 'sport.target',
    blurb: 'One closed skill, many correct repetitions — serves, free throws, penalties.',
    structure: '20–40 min on a single skill · sets of 10–20 with a short reset · track makes/attempts.',
    progressBy: 'reps', progressNote: 'Progress = success rate at a fixed number of attempts. Count it or it is just practice-shaped time.',
    typicalMinutes: 35, prefillSlugs: ['sport-serve-practice', 'sport-shooting-drill'],
  },
  {
    key: 'spo-deliberate', sessionType: 'sport', label: 'Deliberate Practice', icon: 'sport.gym',
    blurb: 'Work at the edge of your ability with immediate feedback — the opposite of just playing.',
    structure: 'Pick the ONE thing you are worst at · 30–45 min on it alone · film it or get a coach\'s eye.',
    progressBy: 'reps', progressNote: 'Progress = the weakness stops being the weakness. Uncomfortable by design — comfortable practice is maintenance.',
    typicalMinutes: 45,
  },
  {
    key: 'spo-speed-agility', sessionType: 'sport', label: 'Speed & Agility', icon: 'cardio.agility',
    blurb: 'Acceleration, deceleration and change of direction — short, fast, fully rested.',
    structure: 'Thorough warm-up · 6–10 short efforts (5–20 m) · full recovery between · stop when times slow.',
    progressBy: 'intensity', progressNote: 'Progress = faster times when fresh. Doing this tired trains something else entirely.',
    typicalMinutes: 35, prefillSlugs: ['sport-footwork', 'shuttle-runs', 'agility-ladder'],
  },
  {
    key: 'spo-plyometrics', sessionType: 'sport', label: 'Plyometrics', icon: 'cardio.plyo',
    blurb: 'Jump training for power. Low volume, maximum intent.',
    structure: '3–5 exercises × 3–5 reps · full recovery · 40–120 contacts per session, no more.',
    progressBy: 'intensity', progressNote: 'Progress = height/distance per jump. When it drops, the session is over — more reps just add joint load.',
    typicalMinutes: 30, prefillSlugs: ['sport-plyometrics', 'box-jumps'],
  },
  {
    key: 'spo-in-season', sessionType: 'sport', label: 'In-Season Maintenance', icon: 'core.calendar',
    blurb: 'Enough training to hold your qualities, little enough to play well at the weekend.',
    structure: '2 short sessions/week · heavy but low volume · nothing to failure · nothing new within 72 h of a match.',
    progressBy: 'load', progressNote: 'Progress is not the aim — holding strength while playing well is. Match performance is the metric.',
    typicalMinutes: 35,
  },
  {
    key: 'spo-off-season', sessionType: 'sport', label: 'Off-Season Build', icon: 'strength.barbell',
    blurb: 'The one window to actually get stronger and fitter without a match to protect.',
    structure: '3–4 sessions/week of real strength and conditioning + reduced skill work.',
    progressBy: 'load', progressNote: 'Progress = strength and conditioning markers climbing before pre-season starts.',
    typicalMinutes: 60,
  },
  {
    key: 'spo-return', sessionType: 'sport', label: 'Return to Play', icon: 'mindbody.spa',
    blurb: 'Graded rebuild after injury — running before cutting, cutting before contact.',
    structure: 'Straight-line running → change of direction → non-contact drills → full training → match.',
    progressBy: 'duration', progressNote: 'Progress = clearing each stage with no next-day reaction. Skipping a stage is how re-injury happens.',
    typicalMinutes: 40,
  },

  // ══════════════ OUTDOOR — more variations ══════════════
  {
    key: 'out-easy', sessionType: 'outdoor', label: 'Easy / Conversational', icon: 'cardio.running',
    blurb: 'The bread-and-butter run. Most people do this too fast and wonder why nothing improves.',
    structure: '30–60 min at a pace where you could hold a conversation in full sentences.',
    progressBy: 'distance', progressNote: 'Progress = more weekly distance at the same easy effort. This is where fitness is built.',
    typicalMinutes: 45, prefillSlugs: ['easy-run'],
  },
  {
    key: 'out-progression', sessionType: 'outdoor', label: 'Progression Run', icon: 'cardio.pace',
    blurb: 'Start easy, finish fast — teaches pacing and finishing on tired legs.',
    structure: 'Thirds: easy · moderate · hard. Or last 10 min at threshold.',
    progressBy: 'distance', progressNote: 'Progress = a faster final third for the same starting pace.',
    typicalMinutes: 45, prefillSlugs: ['progression-run'],
  },
  {
    key: 'out-recovery', sessionType: 'outdoor', label: 'Recovery Run', icon: 'cardio.walk',
    blurb: 'Short and genuinely slow, the day after hard work.',
    structure: '20–35 min, slower than feels right. Walk hills if you need to.',
    progressBy: 'duration', progressNote: 'Not a session to progress — its whole value is in staying easy.',
    typicalMinutes: 30, prefillSlugs: ['recovery-run'],
  },
  {
    key: 'out-hill-sprints', sessionType: 'outdoor', label: 'Hill Sprints', icon: 'cardio.elevation',
    blurb: 'Short maximal climbs — sprint benefits with much less hamstring risk.',
    structure: '6–10 × 8–12 s maximal uphill · walk down · full recovery.',
    progressBy: 'reps', progressNote: 'Progress = more reps at the same quality, then a steeper hill. Never both at once.',
    typicalMinutes: 30, prefillSlugs: ['hill-sprints'],
  },
  {
    key: 'out-longride', sessionType: 'outdoor', label: 'Long Ride', icon: 'cardio.cycling',
    blurb: 'The cycling equivalent of the long run — hours at an easy, steady effort.',
    structure: '90 min – 4 h mostly easy, with the last hour steady if you feel good.',
    progressBy: 'distance', progressNote: 'Progress = more distance at the same heart rate, and finishing feeling able to continue.',
    typicalMinutes: 120, prefillSlugs: ['road-cycling', 'gravel-cycling'],
  },
  {
    key: 'out-brick', sessionType: 'outdoor', label: 'Brick Session', icon: 'cardio.interval',
    blurb: 'Run straight off the bike. The first kilometre feels wrong — that is the point.',
    structure: '45–90 min ride → change in under 5 min → 15–30 min run.',
    progressBy: 'duration', progressNote: 'Progress = the transition kilometre feeling normal sooner.',
    typicalMinutes: 90, prefillSlugs: ['brick-session'],
  },
  {
    key: 'out-commute', sessionType: 'outdoor', label: 'Commute as Training', icon: 'cardio.cycling',
    blurb: 'Training you were going to do anyway — by far the most reliably repeated session.',
    structure: 'Ride or walk/run to work. Easy in, harder home if you feel like it.',
    progressBy: 'distance', progressNote: 'Progress = days per week you commuted actively. Consistency is the whole benefit.',
    typicalMinutes: 40, prefillSlugs: ['cycling-commute'],
  },
  {
    key: 'out-adventure', sessionType: 'outdoor', label: 'Adventure / Orienteering', icon: 'cardio.gps',
    blurb: 'Long, unstructured time outdoors — navigation, terrain and weather doing the work.',
    structure: '2–6 h by feel. Fuel and water planned in advance, route shared with someone.',
    progressBy: 'duration', progressNote: 'Progress = more time on feet with less wreckage afterwards.',
    typicalMinutes: 180, prefillSlugs: ['orienteering', 'trekking'],
  },

  // ══════════════ MIND-BODY — more variations ══════════════
  {
    key: 'mb-hatha', sessionType: 'mindbody', label: 'Hatha Yoga', icon: 'mindbody.yoga',
    blurb: 'Slower held postures with the breath — the least intimidating way in.',
    structure: '30–60 min, poses held 30–60 s, rest whenever you need it.',
    progressBy: 'duration', progressNote: 'Progress = steadier breathing in the same pose, before any thought of going deeper.',
    typicalMinutes: 45, prefillSlugs: ['hatha-yoga'],
  },
  {
    key: 'mb-ashtanga', sessionType: 'mindbody', label: 'Ashtanga Series', icon: 'mindbody.yoga',
    blurb: 'A fixed sequence in the same order every time — progress is unusually easy to see.',
    structure: '60–90 min, primary series, breath-linked throughout.',
    progressBy: 'duration', progressNote: 'Progress = further into the series with the breath still even.',
    typicalMinutes: 75, prefillSlugs: ['ashtanga-yoga'],
  },
  {
    key: 'mb-restorative', sessionType: 'mindbody', label: 'Restorative', icon: 'mindbody.spa',
    blurb: 'Fully supported poses held for minutes. A recovery input, not a workout.',
    structure: '4–6 poses × 5–10 min with bolsters, blocks and blankets.',
    progressBy: 'duration', progressNote: 'No progression to chase — its value shows up in how you sleep and train next.',
    typicalMinutes: 45, prefillSlugs: ['restorative-yoga'],
  },
  {
    key: 'mb-cars', sessionType: 'mindbody', label: 'Joint Prep (CARs)', icon: 'mindbody.joint',
    blurb: 'Slow end-range circles at every joint — a daily audit of the range you actually own.',
    structure: '10–15 min · 3–5 slow rotations per joint, head to ankles.',
    progressBy: 'duration', progressNote: 'Progress = a bigger circle under control, with no compensating from the joints either side.',
    typicalMinutes: 12, prefillSlugs: ['joint-cars'],
  },
  {
    key: 'mb-pnf', sessionType: 'mindbody', label: 'PNF Stretching', icon: 'mindbody.stretch',
    blurb: 'Contract into the stretch, then relax deeper — the most effective way to add passive range.',
    structure: 'Per position: 20–30 s stretch · 6 s contraction · relax deeper · repeat ×3.',
    progressBy: 'duration', progressNote: 'Progress = new range that holds a week later. Range that vanishes overnight was never yours.',
    typicalMinutes: 25, prefillSlugs: ['pnf-stretching'],
  },
  {
    key: 'mb-warmup', sessionType: 'mindbody', label: 'Dynamic Warm-Up', icon: 'core.timer',
    blurb: 'Movement-based prep before training. Static stretching belongs after, not here.',
    structure: 'RAMP: raise the heart rate · activate · mobilise · potentiate. 8–12 min.',
    progressBy: 'duration', progressNote: 'Progress shows up in the session that follows, not in the warm-up itself.',
    typicalMinutes: 10, prefillSlugs: ['dynamic-warmup'],
  },
  {
    key: 'mb-balance', sessionType: 'mindbody', label: 'Balance Training', icon: 'mindbody.balance',
    blurb: 'Single-leg and unstable-surface work — one of the few things with real evidence for preventing falls later.',
    structure: '10–20 min: single-leg holds, eyes closed, unstable surfaces, reaching patterns.',
    progressBy: 'duration', progressNote: 'Progress = longer holds, then eyes closed, then an unstable surface. One variable at a time.',
    typicalMinutes: 15, prefillSlugs: ['balance-training'],
  },
  {
    key: 'mb-barre', sessionType: 'mindbody', label: 'Barre / Pilates Sculpt', icon: 'mindbody.barre',
    blurb: 'High-rep small-range work — burns a lot, builds endurance rather than strength.',
    structure: '45 min of small pulses and holds, legs and glutes led.',
    progressBy: 'duration', progressNote: 'Progress = holding position through the full set. For strength, this supplements lifting rather than replacing it.',
    typicalMinutes: 45, prefillSlugs: ['barre'],
  },
  {
    key: 'mb-qigong', sessionType: 'mindbody', label: 'Qigong', icon: 'martial.forms',
    blurb: 'Slow breath-led movement sets — gentle, repeatable, easy on the joints.',
    structure: '20–40 min of repeated movement sets with coordinated breathing.',
    progressBy: 'duration', progressNote: 'Progress = longer sessions from memory, breath leading the movement rather than following it.',
    typicalMinutes: 30, prefillSlugs: ['qigong'],
  },
  {
    key: 'mb-desk', sessionType: 'mindbody', label: 'Desk-Break Routine', icon: 'mindbody.stretch',
    blurb: 'Short resets through a working day. Frequency beats duration by a mile here.',
    structure: '3–5 min every 90 min: stand, extend, rotate, walk. Five short beats one long.',
    progressBy: 'duration', progressNote: 'Progress = number of breaks taken per day, not minutes per break.',
    typicalMinutes: 5, prefillSlugs: ['posture-drills', 'chair-yoga'],
  },

  // ══════════════ MEDITATION — more variations ══════════════
  {
    key: 'med-noting', sessionType: 'meditation', label: 'Noting Practice', icon: 'mindbody.focus',
    blurb: 'Silently label what arises — "thinking", "hearing", "planning" — then let go.',
    structure: '10–25 min. One soft label per event, no analysis.',
    progressBy: 'duration', progressNote: 'Progress = noticing sooner. Catching a thought at 5 seconds instead of 5 minutes is the skill.',
    typicalMinutes: 15, prefillSlugs: ['noting-practice'],
  },
  {
    key: 'med-open', sessionType: 'meditation', label: 'Open Awareness', icon: 'mindbody.meditation',
    blurb: 'No single object — attention stays wide. Usually easier after some breath practice.',
    structure: '15–30 min sitting with whatever is most obvious, without choosing.',
    progressBy: 'duration', progressNote: 'Progress = staying wide without drifting into daydreaming.',
    typicalMinutes: 20, prefillSlugs: ['open-awareness'],
  },
  {
    key: 'med-nidra', sessionType: 'meditation', label: 'Yoga Nidra / NSDR', icon: 'mindbody.sleep',
    blurb: 'Guided lying-down rest. Genuinely useful after a bad night — and not a substitute for one.',
    structure: '15–30 min lying down, guided body rotation and breath awareness.',
    progressBy: 'duration', progressNote: 'Progress = feeling restored afterwards. Falling asleep is fine and common.',
    typicalMinutes: 20, prefillSlugs: ['yoga-nidra'],
  },
  {
    key: 'med-pmr', sessionType: 'meditation', label: 'Progressive Relaxation', icon: 'mindbody.spa',
    blurb: 'Tense then release each muscle group in turn — the most physical way in, good for beginners.',
    structure: '15–20 min, head to toe: 5 s tension, 15 s release.',
    progressBy: 'duration', progressNote: 'Progress = noticing tension you were carrying without realising.',
    typicalMinutes: 18, prefillSlugs: ['progressive-relaxation'],
  },
  {
    key: 'med-sleep', sessionType: 'meditation', label: 'Wind-Down for Sleep', icon: 'mindbody.night',
    blurb: 'Long-exhale breathing and body scanning in bed, lights already low.',
    structure: '4-7-8 or 4-8 breathing for 5 min, then a body scan until you drift.',
    progressBy: 'duration', progressNote: 'Progress = falling asleep faster over weeks. One good night proves nothing either way.',
    typicalMinutes: 15, prefillSlugs: ['breathing-478', 'sleep-meditation'],
  },
  {
    key: 'med-coherent', sessionType: 'meditation', label: 'Coherent Breathing', icon: 'mindbody.waves',
    blurb: 'Equal in and out at about six breaths a minute.',
    structure: '5 s in, 5 s out for 10–20 min. A metronome or app helps at first.',
    progressBy: 'duration', progressNote: 'Progress = holding the rhythm without effort, and lengthening to 6 s each way.',
    typicalMinutes: 15, prefillSlugs: ['coherent-breathing'],
  },
  {
    key: 'med-reset', sessionType: 'meditation', label: 'Quick Reset (60 seconds)', icon: 'mindbody.lungs',
    blurb: 'For the moment itself — two physiological sighs and back to what you were doing.',
    structure: 'Double inhale through the nose, long exhale through the mouth. Repeat 2–3 times.',
    progressBy: 'reps', progressNote: 'Progress = remembering to use it. Deployed in the moment, it beats a perfect session you skip.',
    typicalMinutes: 2, prefillSlugs: ['physiological-sigh'],
  },
  {
    key: 'med-visualization', sessionType: 'meditation', label: 'Mental Rehearsal', icon: 'mindbody.focus',
    blurb: 'Rehearse a performance in detail. Best evidence is in sport — as a supplement to practice, never a replacement.',
    structure: '10–15 min: first person, real time, all senses, including how you recover from a mistake.',
    progressBy: 'duration', progressNote: 'Progress = clearer, longer rehearsal without the mind wandering.',
    typicalMinutes: 12, prefillSlugs: ['visualization'],
  },
  {
    key: 'med-gratitude', sessionType: 'meditation', label: 'Gratitude & Journaling', icon: 'mindbody.journal',
    blurb: 'Written reflection — the lowest-friction practice for most people, and well supported for mood.',
    structure: '5–10 min: three specific things, and why each happened.',
    progressBy: 'duration', progressNote: 'Progress = specificity. "My brother called" beats "my family".',
    typicalMinutes: 8, prefillSlugs: ['gratitude-practice', 'journaling'],
  },
  {
    key: 'med-dhikr', sessionType: 'meditation', label: 'Dhikr / Remembrance', icon: 'mindbody.dhikr',
    blurb: 'Rhythmic remembrance, counted on the fingers or a tasbih.',
    structure: '5–20 min, a fixed count or a fixed time.',
    progressBy: 'duration', progressNote: 'Progress = consistency across the week — most naturally kept right after salat.',
    typicalMinutes: 10, prefillSlugs: ['dhikr'],
  },
];

export function methodsFor(sessionType: SessionType): TrainingMethod[] {
  return TRAINING_METHODS.filter((m) => m.sessionType === sessionType);
}

export function findMethod(key: string): TrainingMethod | undefined {
  return TRAINING_METHODS.find((m) => m.key === key);
}

export const EFFORT_LABEL: Record<EffortMetric, string> = {
  load: 'Load lifted',
  reps: 'Reps / quality',
  duration: 'Time',
  distance: 'Distance',
  rounds: 'Rounds',
  intensity: 'Intensity',
};
