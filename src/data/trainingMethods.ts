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
