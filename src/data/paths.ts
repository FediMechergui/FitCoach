import type { SessionType } from '@/db/schema';

/**
 * Paths — the long road to becoming something.
 *
 * A special programme is one week, repeated. A path is a sequence of STAGES:
 * each stage is a template week, walked until a gate is met, and then the next
 * stage begins. Stage one assumes nothing; stage five describes someone who
 * trains the way a practitioner does.
 *
 * The gate is measured — sessions of the stage actually logged, weeks actually
 * spent in it, and for a few paths a run actually run or a rank actually held.
 * The benchmarks beside it are guidance: a skill cannot be measured by a
 * phone, and the path says so rather than pretending.
 *
 * GENERATED from the authored path files by scripts kept outside the repo;
 * every exercise slug is checked against the library by the engine suite.
 */

export type PathDiscipline = 'combat' | 'team' | 'racket' | 'endurance' | 'strength' | 'skill' | 'outdoor';

export const DISCIPLINE_LABEL: Record<PathDiscipline, string> = {
  combat: 'Combat',
  team: 'Team sports',
  racket: 'Racket sports',
  endurance: 'Endurance',
  strength: 'Strength',
  skill: 'Skill',
  outdoor: 'Outdoor',
};

export const DISCIPLINE_ORDER: PathDiscipline[] = ['combat', 'team', 'racket', 'endurance', 'strength', 'skill', 'outdoor'];

export interface PathDay {
  key: string;
  label: string;
  sessionType: SessionType;
  focus: string;
  /** exercise slugs, in the order they are done */
  exercises: string[];
  prescription: string;
  minutes: number;
}

export interface PathGate {
  /** sessions of this stage that must be logged */
  sessions: number;
  /** weeks that must pass inside the stage */
  weeks: number;
  /** a single tracked run or walk of at least this distance, since the stage began */
  longestRunKm?: number;
  /** overall strength rank, as a rung index on the Carthage ladder (0 Sand … 7 Hannibal) */
  overallTier?: number;
}

export interface PathStage {
  key: string;
  name: string;
  /** what you can do by the end of it */
  aim: string;
  /** typical length */
  weeks: number;
  sessionsPerWeek: number;
  days: PathDay[];
  gate: PathGate;
  /** guidance, not measured */
  benchmarks: string[];
  coachNote: string;
}

export interface TrainingPath {
  key: string;
  name: string;
  /** the noun: "Boxer" */
  become: string;
  discipline: PathDiscipline;
  tagline: string;
  whoFor: string;
  /** what this app cannot teach, and where a coach, a club or a partner is needed */
  honesty: string;
  safety: string;
  icon: string;
  accent: string;
  stages: PathStage[];
}

export const TRAINING_PATHS: TrainingPath[] = [
  {
    "key": "path-boxer",
    "name": "Become a boxer",
    "become": "Boxer",
    "discipline": "combat",
    "tagline": "From your first jab to training like an amateur in fight camp, one stage at a time.",
    "whoFor": "Anyone who has never thrown a punch and wants to learn boxing properly, whether or not they ever plan to step into a ring for a bout.",
    "honesty": "An app cannot see your guard drop or your chin lift. From stage 3 you need a coach to correct technique, and from stage 4 a boxing club with supervised partners. Do not spar without one.",
    "safety": "Wrap your hands and wear bag gloves for every bag round. Spar only under supervision with 16 oz gloves, headguard and gumshield. Stop and see a doctor after any head knock that leaves you dazed.",
    "icon": "martial.gloves",
    "accent": "#D9483B",
    "stages": [
      {
        "key": "s1",
        "name": "Stance and the jab",
        "aim": "You hold a balanced stance, move in all four directions without crossing your feet, and throw a straight jab and cross that return to the guard.",
        "weeks": 6,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "technique",
            "label": "Technique day",
            "sessionType": "martial_arts",
            "focus": "Stance, step-drag movement and the jab, first in the air and then on the bag",
            "exercises": [
              "ma-skipping",
              "boxing-step-drag",
              "boxing-jab",
              "ma-shadow-round",
              "ma-bag-round"
            ],
            "prescription": "Skip 3 x 2 min. Step-drag 3 x 2 min. Jab 4 x 2 min. Shadow 2 x 2 min. Bag 2 x 2 min, jab only. 1 min rest throughout.",
            "minutes": 40
          },
          {
            "key": "guard-and-cross",
            "label": "Guard and cross day",
            "sessionType": "martial_arts",
            "focus": "Adding the cross behind the jab and learning to block behind a high guard",
            "exercises": [
              "ma-skipping",
              "ma-footwork-drill",
              "boxing-jab",
              "boxing-cross",
              "boxing-high-guard-blocking",
              "ma-shadow-round"
            ],
            "prescription": "Skip 3 x 2 min. Footwork 2 x 2 min. Jab 3 x 2 min, cross 3 x 2 min, guard 2 x 2 min. Finish with 2 x 2 min shadow, 1 min rest.",
            "minutes": 45
          },
          {
            "key": "base-strength",
            "label": "Base strength day",
            "sessionType": "calisthenics",
            "focus": "Bodyweight strength for legs, trunk and shoulders so the joints tolerate punching",
            "exercises": [
              "bodyweight-squat",
              "push-up-incline",
              "inverted-row",
              "glute-bridge",
              "plank",
              "dead-bug",
              "shoulder-mobility"
            ],
            "prescription": "3 sets of 10-12 on each movement, plank 3 x 20-30 s, 60 s rest. Finish with 5 min of shoulder mobility.",
            "minutes": 35
          },
          {
            "key": "easy-roadwork",
            "label": "Easy roadwork day",
            "sessionType": "outdoor",
            "focus": "Building an aerobic base with walking and short, easy running intervals",
            "exercises": [
              "brisk-walk",
              "run-walk-intervals",
              "wall-calf-stretch"
            ],
            "prescription": "5 min brisk walk, then 8 x (1 min easy jog, 2 min walk). You should be able to talk. Stretch calves 2 x 30 s per side.",
            "minutes": 30
          }
        ],
        "gate": {
          "sessions": 14,
          "weeks": 4
        },
        "benchmarks": [
          "Skip rope for 3 minutes without more than two trips",
          "Throw 20 jabs on the bag with the hand returning to the cheek every time",
          "Move forward, back, left and right for a full round without crossing or clicking your feet"
        ],
        "coachNote": "Stance and balance come before power. If your feet come together or your weight tips forward when you punch, slow down and fix that first."
      },
      {
        "key": "s2",
        "name": "Four punches and defence",
        "aim": "You throw the jab, cross, hook and uppercut with hip rotation, and you can slip, roll, parry and block on your own against imagined punches.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "punches",
            "label": "Punch mechanics day",
            "sessionType": "martial_arts",
            "focus": "Hooks and uppercuts added to the straight punches, each drilled one at a time",
            "exercises": [
              "ma-skipping",
              "boxing-jab",
              "boxing-cross",
              "boxing-lead-hook",
              "boxing-lead-uppercut",
              "boxing-rear-uppercut",
              "ma-bag-round"
            ],
            "prescription": "Skip 3 x 3 min. Each punch 2 x 2 min in the mirror. Then 4 x 2 min on the bag, single punches and the 1-2 only. 1 min rest.",
            "minutes": 55
          },
          {
            "key": "defence",
            "label": "Defence day",
            "sessionType": "martial_arts",
            "focus": "Head movement under the rope, parries and blocks, then shadow boxing that mixes them in",
            "exercises": [
              "ma-skipping",
              "boxing-slip-rope",
              "boxing-bob-and-weave",
              "boxing-parry-drill",
              "boxing-high-guard-blocking",
              "ma-shadow-round"
            ],
            "prescription": "Skip 3 x 3 min. Slip rope 3 x 2 min, bob and weave 3 x 2 min, parry and block 2 x 2 min each. Shadow 3 x 2 min, 1 min rest.",
            "minutes": 55
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "General strength with light loads: squat, hinge, push, pull and anti-rotation",
            "exercises": [
              "goblet-squat",
              "db-romanian-deadlift",
              "db-one-arm-row",
              "push-up",
              "pallof-press",
              "band-pull-apart"
            ],
            "prescription": "3 x 10 on squat, hinge and row. Push-ups 3 sets leaving 2 in reserve. Pallof press 3 x 10 per side. Pull-aparts 3 x 15.",
            "minutes": 45
          },
          {
            "key": "roadwork",
            "label": "Roadwork day",
            "sessionType": "outdoor",
            "focus": "Continuous easy running with a few relaxed accelerations at the end",
            "exercises": [
              "easy-run",
              "strides",
              "static-stretch-routine"
            ],
            "prescription": "20-30 min easy run at talking pace. Then 4 x 15 s strides with a walk back. 8 min of stretching to finish.",
            "minutes": 40
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6
        },
        "benchmarks": [
          "Throw each of the four punches on the bag without the other hand leaving your face",
          "Slip and roll along the rope for a 2-minute round without standing up tall",
          "Run 25 minutes continuously at an easy pace"
        ],
        "coachNote": "Power comes from the floor and the hips, not the arm. Film yourself: the rear heel should turn on the cross and the hand should come straight back."
      },
      {
        "key": "s3",
        "name": "Combinations and bag craft",
        "aim": "You put 3 to 5 punch combinations together with footwork before and after, work head and body, and sustain six 3-minute bag rounds.",
        "weeks": 10,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "combinations",
            "label": "Combination day",
            "sessionType": "martial_arts",
            "focus": "Building 3 to 5 punch combinations with body shots, on pads when a coach is available",
            "exercises": [
              "ma-shadow-round",
              "ma-jab-cross",
              "ma-combination-drill",
              "boxing-body-jab",
              "boxing-liver-shot",
              "ma-mitt-work"
            ],
            "prescription": "Shadow 3 x 3 min. Jab-cross 2 x 3 min. Combinations 3 x 3 min. Body jab and liver shot 2 x 3 min each. Pads 3 x 3 min. 1 min rest.",
            "minutes": 70
          },
          {
            "key": "footwork",
            "label": "Footwork and timing day",
            "sessionType": "martial_arts",
            "focus": "Pivots, angles and in-and-out movement, then timing on the double-end bag",
            "exercises": [
              "jump-rope-alternate",
              "boxing-pivot-drill",
              "boxing-l-step",
              "boxing-in-and-out",
              "ma-double-end-bag",
              "ma-shadow-round"
            ],
            "prescription": "Boxer skip 3 x 3 min. Pivot, L-step and in-and-out 2 x 3 min each. Double-end bag 3 x 3 min. Shadow 2 x 3 min. 1 min rest.",
            "minutes": 60
          },
          {
            "key": "bag-craft",
            "label": "Bag craft day",
            "sessionType": "martial_arts",
            "focus": "Heavy bag rounds with a job for each round, finishing on punch-out intervals",
            "exercises": [
              "ma-skipping",
              "ma-bag-round",
              "boxing-bag-body-shots",
              "boxing-uppercut-bag",
              "ma-speed-bag",
              "boxing-bag-punch-out"
            ],
            "prescription": "Skip 3 x 3 min. Bag 3 x 3 min, body shots 2 x 3 min, uppercut bag 2 x 3 min, speed bag 2 x 3 min. Punch-out 6 x 20 s on, 40 s off.",
            "minutes": 70
          },
          {
            "key": "strength",
            "label": "Strength and power day",
            "sessionType": "strength",
            "focus": "Heavier lower-body and pulling strength plus rotational power for punching",
            "exercises": [
              "trap-bar-deadlift",
              "bulgarian-split-squat",
              "landmine-press",
              "pull-up",
              "medicine-ball-rotational-throw",
              "hanging-knee-raise",
              "face-pull"
            ],
            "prescription": "Deadlift 4 x 5. Split squat 3 x 8 per leg. Landmine press 3 x 8 per arm. Pull-ups 4 sets. Throws 4 x 5 per side. Core and face pulls 3 x 12.",
            "minutes": 60
          },
          {
            "key": "roadwork",
            "label": "Roadwork day",
            "sessionType": "outdoor",
            "focus": "Steady running with changes of pace that mimic the rhythm of a round",
            "exercises": [
              "easy-run",
              "fartlek-run",
              "strides"
            ],
            "prescription": "10 min easy run. Then 20 min fartlek: 1 min hard, 2 min easy. 5 min easy to cool down and 4 x 15 s strides.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 40,
          "weeks": 8
        },
        "benchmarks": [
          "Complete 6 x 3-minute heavy bag rounds with 1 minute rest and tidy technique in the last round",
          "Throw a 4-punch combination and finish with a pivot or step off the line every time",
          "Keep the double-end bag moving for a full round without it hitting you clean"
        ],
        "coachNote": "Every combination ends with a move, not a pose. Punch, then pivot, step out or slip. Standing still to admire your work is how beginners get hit."
      },
      {
        "key": "s4",
        "name": "Partner work and body sparring",
        "aim": "You work with a partner under a coach: catching and countering, defence-only rounds, body sparring and conditioned sparring with one agreed task.",
        "weeks": 10,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "partner-drills",
            "label": "Partner drill day",
            "sessionType": "martial_arts",
            "focus": "Catch, parry and counter drills with a partner, plus holding pads for them in return",
            "exercises": [
              "ma-shadow-round",
              "boxing-catch-and-shoot",
              "boxing-pull-counter",
              "ma-counter-drill",
              "boxing-defence-only-rounds",
              "ma-mitt-work",
              "ma-pad-holding"
            ],
            "prescription": "Shadow 3 x 3 min. Catch and shoot, pull counter and counter drill 3 x 3 min each. Defence-only 3 x 2 min. Pads 3 x 3 min, then hold 3 x 3 min.",
            "minutes": 90
          },
          {
            "key": "conditioned-sparring",
            "label": "Conditioned sparring day",
            "sessionType": "martial_arts",
            "focus": "Supervised body sparring and situational rounds with one agreed task per round",
            "exercises": [
              "ma-shadow-round",
              "boxing-inside-fighting",
              "boxing-body-sparring",
              "boxing-situational-sparring",
              "ma-technical-sparring",
              "ma-neck-conditioning"
            ],
            "prescription": "Shadow 3 x 3 min. Inside drill 2 x 3 min. Body sparring 3 x 2 min. Situational 3 x 2 min. Technical sparring 2 x 2 min at half power. Neck work 5 min.",
            "minutes": 75
          },
          {
            "key": "bag-and-defence",
            "label": "Bag and defence day",
            "sessionType": "martial_arts",
            "focus": "Power rounds on the bag with slips, rolls and shoulder rolls built into each one",
            "exercises": [
              "ma-skipping",
              "boxing-bag-power-rounds",
              "boxing-slip-bag",
              "boxing-shoulder-roll",
              "ma-double-end-bag",
              "boxing-bag-punch-out"
            ],
            "prescription": "Skip 3 x 3 min. Power rounds 4 x 3 min. Slip bag 3 x 3 min. Shoulder roll 2 x 3 min. Double-end 3 x 3 min. Punch-out 8 x 20 s on, 40 s off.",
            "minutes": 75
          },
          {
            "key": "strength",
            "label": "Strength and power day",
            "sessionType": "strength",
            "focus": "Maximal strength in low volume, explosive throws, and neck and shoulder resilience",
            "exercises": [
              "front-squat",
              "romanian-deadlift",
              "push-press",
              "barbell-row",
              "medicine-ball-slam",
              "landmine-rotation",
              "band-neck-extension"
            ],
            "prescription": "Front squat 4 x 4. RDL 3 x 6. Push press 4 x 4. Row 3 x 8. Slams 4 x 6. Landmine rotation 3 x 8 per side. Neck 3 x 12.",
            "minutes": 60
          },
          {
            "key": "roadwork",
            "label": "Roadwork day",
            "sessionType": "outdoor",
            "focus": "Aerobic running followed by short hill sprints for repeat power",
            "exercises": [
              "easy-run",
              "hill-sprints",
              "static-stretch-routine"
            ],
            "prescription": "30 min easy run, then 8 x 10 s hill sprints with a slow walk back down. 8 min of stretching for hips and calves.",
            "minutes": 55
          }
        ],
        "gate": {
          "sessions": 40,
          "weeks": 8
        },
        "benchmarks": [
          "Complete 3 rounds of body sparring while staying calm and keeping your eyes open under pressure",
          "Catch or parry a partner's jab and return your own within the same beat",
          "Hold pads safely for a partner for 3 rounds",
          "Run 5 km without stopping, at a pace you could hold a conversation at"
        ],
        "coachNote": "Sparring at this stage is a drill, not a fight. Agree the power level before the bell and keep it. A partner who trusts you will teach you more."
      },
      {
        "key": "s5",
        "name": "Fight camp",
        "aim": "You train like an amateur boxer preparing for a bout: open sparring each week, pad work on a game plan, roadwork, and a taper in the final week.",
        "weeks": 8,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "sparring",
            "label": "Sparring day",
            "sessionType": "martial_arts",
            "focus": "Supervised open sparring over amateur round lengths with recovery practised between rounds",
            "exercises": [
              "ma-shadow-round",
              "boxing-situational-sparring",
              "ma-sparring-round",
              "boxing-cutting-off-the-ring",
              "fight-prep-between-rounds-breathing",
              "ma-neck-conditioning"
            ],
            "prescription": "Shadow 3 x 3 min. Situational 2 x 3 min. Sparring 4-6 x 3 min, 1 min rest with breathing drill. Ring-cutting 2 x 3 min. Neck 5 min. No sparring in fight week.",
            "minutes": 80
          },
          {
            "key": "pads-and-tactics",
            "label": "Pads and tactics day",
            "sessionType": "martial_arts",
            "focus": "Pad rounds built around a game plan, angles against both stances and reflex work",
            "exercises": [
              "fight-prep-corner-pad-warm-up",
              "ma-mitt-work",
              "boxing-open-stance-angles",
              "boxing-catch-and-shoot",
              "boxing-cobra-bag",
              "ma-double-end-bag"
            ],
            "prescription": "Corner warm-up 10 min. Pads 5 x 3 min. Angle work 3 x 3 min. Catch and shoot 2 x 3 min. Reflex bag and double-end 3 x 3 min each. 1 min rest.",
            "minutes": 80
          },
          {
            "key": "bag-conditioning",
            "label": "Bag conditioning day",
            "sessionType": "martial_arts",
            "focus": "High-output bag rounds and a fight circuit; replaced by a light shakeout in fight week",
            "exercises": [
              "ma-skipping",
              "boxing-bag-power-rounds",
              "boxing-hand-weight-shadowboxing",
              "boxing-bag-punch-out",
              "ma-fight-conditioning",
              "fight-prep-shakeout"
            ],
            "prescription": "Skip 3 x 3 min. Bag 6 x 3 min at fight pace. Hand-weight shadow 2 x 2 min. Punch-out 10 x 20 s. Circuit 10 min. Fight week: 20 min shakeout only.",
            "minutes": 75
          },
          {
            "key": "roadwork",
            "label": "Roadwork day",
            "sessionType": "outdoor",
            "focus": "Threshold running and sprints matched to the work-to-rest pattern of rounds",
            "exercises": [
              "recovery-run",
              "tempo-run",
              "sprint-repeats",
              "boxing-roadwork-intervals"
            ],
            "prescription": "Alternate weekly: 10 min easy + 20 min tempo + 6 x 30 s sprints, or 6 x 3 min hard roadwork intervals with 1 min jog. Halve it in the final 10 days.",
            "minutes": 50
          },
          {
            "key": "strength",
            "label": "Power maintenance day",
            "sessionType": "strength",
            "focus": "Short, fast strength work that keeps power without leaving you sore for sparring",
            "exercises": [
              "trap-bar-deadlift",
              "push-press",
              "medicine-ball-rotational-throw",
              "medicine-ball-slam",
              "pallof-press",
              "face-pull"
            ],
            "prescription": "Deadlift 3 x 3 fast. Push press 3 x 3. Throws 4 x 4 per side. Slams 3 x 5. Pallof press and face pulls 2 x 12. Drop this day in fight week.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 6
        },
        "benchmarks": [
          "Spar 4 x 3-minute rounds at a controlled pace and still think clearly in the last round",
          "Hold fight pace on the bag for 6 x 3-minute rounds with 1 minute rest",
          "Run 3 km in under 15 minutes on a flat course or track",
          "Complete a full taper week without adding extra hard sessions"
        ],
        "coachNote": "Camp is about arriving fresh, not proving toughness. Hard sparring is limited to one or two days a week, and the last ten days get lighter, not harder."
      }
    ]
  },
  {
    "key": "path-nak-muay",
    "name": "Become a Muay Thai fighter",
    "become": "Nak Muay",
    "discipline": "combat",
    "tagline": "Learn the eight limbs in order: teep, kicks, knees, elbows and clinch, then pads and sparring.",
    "whoFor": "Beginners who want to learn Muay Thai or kickboxing from the first stance, and are willing to spend months on basics before any sparring.",
    "honesty": "Kicking mechanics, clinch and elbows cannot be learned safely from a screen. You need a Muay Thai gym and a pad holder from stage 3, and a coach supervising all clinch and sparring work.",
    "safety": "Shins, hips and knees take months to adapt, so build kick volume slowly. Spar with shin guards, 16 oz gloves, gumshield and groin guard. Elbows in sparring are touched, never thrown.",
    "icon": "martial.kick",
    "accent": "#E08A1E",
    "stages": [
      {
        "key": "s1",
        "name": "Stance and the teep",
        "aim": "You stand in a balanced Thai stance, throw a teep that pushes the bag away without falling forward, and add a basic jab and cross.",
        "weeks": 6,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "technique",
            "label": "Technique day",
            "sessionType": "martial_arts",
            "focus": "Stance, footwork and the teep, plus straight punches in shadow boxing",
            "exercises": [
              "ma-skipping",
              "ma-footwork-drill",
              "mt-teep",
              "boxing-jab",
              "boxing-cross",
              "ma-shadow-round"
            ],
            "prescription": "Skip 3 x 2 min. Footwork 2 x 2 min. Teep 4 x 2 min, alternate legs. Jab and cross 2 x 2 min each. Shadow 2 x 2 min. 1 min rest.",
            "minutes": 45
          },
          {
            "key": "kick-basics",
            "label": "Kick basics day",
            "sessionType": "martial_arts",
            "focus": "First roundhouse mechanics at low height, the guard, and easy rounds on the bag",
            "exercises": [
              "ma-skipping",
              "mt-teep",
              "ma-kick-drill",
              "boxing-high-guard-blocking",
              "ma-bag-round"
            ],
            "prescription": "Skip 3 x 2 min. Teep 3 x 2 min. Kick drill 4 x 2 min at knee height, 10 slow reps per leg per round. Guard 2 x 2 min. Bag 3 x 2 min.",
            "minutes": 45
          },
          {
            "key": "base-strength",
            "label": "Base strength and hips day",
            "sessionType": "calisthenics",
            "focus": "Bodyweight strength and single-leg balance, with hip mobility for kicking",
            "exercises": [
              "bodyweight-squat",
              "push-up-incline",
              "glute-bridge",
              "single-leg-rdl",
              "cossack-squat",
              "plank",
              "hip-mobility"
            ],
            "prescription": "3 x 10-12 on squat, push-up and bridge. Single-leg RDL and Cossack squat 3 x 6 per side. Plank 3 x 30 s. Hip mobility 8 min.",
            "minutes": 40
          },
          {
            "key": "easy-roadwork",
            "label": "Easy roadwork day",
            "sessionType": "outdoor",
            "focus": "Building an aerobic base and loosening the hamstrings afterwards",
            "exercises": [
              "brisk-walk",
              "run-walk-intervals",
              "hamstring-routine"
            ],
            "prescription": "5 min brisk walk, then 8 x (1 min easy jog, 2 min walk). Finish with 8 min of hamstring stretching.",
            "minutes": 35
          }
        ],
        "gate": {
          "sessions": 14,
          "weeks": 4
        },
        "benchmarks": [
          "Teep the heavy bag 10 times per leg and return to stance without stumbling",
          "Balance on one leg with the other knee raised for 20 seconds per side",
          "Skip rope for 3 minutes without more than two trips"
        ],
        "coachNote": "Balance on the standing leg is the skill behind every kick. Rise onto the ball of the foot and turn it out; do not chase height yet."
      },
      {
        "key": "s2",
        "name": "Kicks and checks",
        "aim": "You throw low, body and switch kicks with the hip turned over, and you can check a kick and block punches while staying in stance.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "kicks",
            "label": "Kicking day",
            "sessionType": "martial_arts",
            "focus": "Low, body and switch kicks drilled slowly first and then for rounds on the bag",
            "exercises": [
              "ma-skipping",
              "mt-teep",
              "mt-low-kick",
              "mt-body-kick",
              "mt-switch-kick",
              "ma-bag-round"
            ],
            "prescription": "Skip 3 x 3 min. Teep 2 x 3 min. Low kick and body kick 3 x 3 min each, switch kick 2 x 3 min. Bag 3 x 3 min mixing them. 1 min rest.",
            "minutes": 65
          },
          {
            "key": "defence-and-hands",
            "label": "Defence and hands day",
            "sessionType": "martial_arts",
            "focus": "Checking kicks, blocking and parrying punches, and adding the hook to the hands",
            "exercises": [
              "ma-shadow-round",
              "mt-check-drill",
              "boxing-high-guard-blocking",
              "boxing-parry-drill",
              "boxing-lead-hook",
              "ma-jab-cross"
            ],
            "prescription": "Shadow 3 x 3 min. Check drill 3 x 3 min. Guard and parry 2 x 3 min each. Lead hook 2 x 3 min. Jab-cross 2 x 3 min. 1 min rest.",
            "minutes": 60
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "General strength with an emphasis on hips, adductors and the lower leg",
            "exercises": [
              "goblet-squat",
              "db-romanian-deadlift",
              "db-one-arm-row",
              "db-reverse-lunge",
              "pallof-press",
              "copenhagen-plank",
              "tibialis-raise"
            ],
            "prescription": "3 x 10 on squat, RDL, row and lunge. Pallof press 3 x 10 per side. Copenhagen plank 3 x 15 s per side. Tibialis raise 3 x 15.",
            "minutes": 50
          },
          {
            "key": "roadwork",
            "label": "Roadwork day",
            "sessionType": "outdoor",
            "focus": "Continuous easy running, a few strides and adductor flexibility for higher kicks",
            "exercises": [
              "easy-run",
              "strides",
              "adductor-routine"
            ],
            "prescription": "20-30 min easy run at talking pace. 4 x 15 s strides with a walk back. 8 min adductor routine.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6
        },
        "benchmarks": [
          "Throw 20 body kicks per leg on the bag with the hip turned over and the shin landing, not the foot",
          "Check with either leg and return to stance in balance, 10 times in a row",
          "Run 25 minutes continuously at an easy pace"
        ],
        "coachNote": "Swing the kick from the hip like a bat, do not snap it from the knee. The standing foot pivots and the same-side arm swings down for balance."
      },
      {
        "key": "s3",
        "name": "Knees, elbows and clinch",
        "aim": "You throw knees and elbows on the bag and pads, hold a basic clinch position with correct posture, and sustain five 3-minute bag rounds.",
        "weeks": 10,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "knees-and-elbows",
            "label": "Knees and elbows day",
            "sessionType": "martial_arts",
            "focus": "Straight knees and the basic elbows, drilled in the air, on the bag and on pads",
            "exercises": [
              "ma-shadow-round",
              "ma-knee-elbow-drill",
              "mt-bag-knees",
              "mt-elbows-on-pads",
              "mt-teep",
              "ma-bag-round"
            ],
            "prescription": "Shadow 3 x 3 min. Knee and elbow drill 3 x 3 min. Bag knees 3 x 3 min. Elbows on pads 3 x 2 min. Teep 2 x 3 min. Bag 2 x 3 min. 1 min rest.",
            "minutes": 70
          },
          {
            "key": "clinch",
            "label": "Clinch day",
            "sessionType": "martial_arts",
            "focus": "Cooperative clinch with a partner: pummeling, posture, knees and simple off-balancing",
            "exercises": [
              "ma-pummeling",
              "ma-clinch-work",
              "mt-clinch-sweeps",
              "mt-bag-knees",
              "ma-neck-conditioning"
            ],
            "prescription": "Pummeling 3 x 3 min. Clinch work 4 x 3 min at low resistance. Sweeps 3 x 3 min, partner falls safely. Bag knees 3 x 2 min. Neck 5 min.",
            "minutes": 60
          },
          {
            "key": "bag-kicks",
            "label": "Bag and kick volume day",
            "sessionType": "martial_arts",
            "focus": "Kick volume on the heavy bag, including the first high kicks and shin conditioning",
            "exercises": [
              "ma-skipping",
              "mt-body-kick",
              "mt-switch-kick",
              "mt-high-kick",
              "mt-low-kick-bag-conditioning",
              "ma-bag-round"
            ],
            "prescription": "Skip 3 x 3 min. Body kick 3 x 3 min. Switch and high kick 2 x 3 min each. Low-kick conditioning 3 x 2 min. Free bag 3 x 3 min. 1 min rest.",
            "minutes": 70
          },
          {
            "key": "strength",
            "label": "Strength and power day",
            "sessionType": "strength",
            "focus": "Heavier hinge and single-leg strength, pulling for the clinch and trunk rotation",
            "exercises": [
              "trap-bar-deadlift",
              "bulgarian-split-squat",
              "landmine-press",
              "lat-pulldown",
              "medicine-ball-rotational-throw",
              "cable-woodchopper",
              "band-neck-extension"
            ],
            "prescription": "Deadlift 4 x 5. Split squat 3 x 8 per leg. Landmine press 3 x 8. Pulldown 4 x 8. Throws 4 x 5 per side. Woodchopper and neck 3 x 12.",
            "minutes": 60
          },
          {
            "key": "roadwork",
            "label": "Roadwork day",
            "sessionType": "outdoor",
            "focus": "Steady running with pace changes to prepare for round-based work",
            "exercises": [
              "easy-run",
              "fartlek-run",
              "adductor-routine"
            ],
            "prescription": "10 min easy run, 20 min fartlek (1 min hard, 2 min easy), 5 min easy. Finish with 8 min adductor routine.",
            "minutes": 50
          }
        ],
        "gate": {
          "sessions": 40,
          "weeks": 8
        },
        "benchmarks": [
          "Hold clinch posture for a 3-minute cooperative round without your head being pulled down",
          "Complete 5 x 3-minute bag rounds using punches, kicks and knees in every round",
          "Throw 50 alternating straight knees on the bag without losing hip drive"
        ],
        "coachNote": "In the clinch, posture beats strength: hips in, head up, elbows tight. If you are pulling with your arms and bending at the waist, reset."
      },
      {
        "key": "s4",
        "name": "Pads and Dutch combinations",
        "aim": "You flow punch-to-kick combinations on pads and with a partner, hold pads yourself, and keep your output through five hard pad rounds.",
        "weeks": 10,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "thai-pads",
            "label": "Thai pad day",
            "sessionType": "martial_arts",
            "focus": "Full pad rounds with a holder calling strikes, plus learning to hold for a partner",
            "exercises": [
              "ma-shadow-round",
              "mt-thai-pad-rounds",
              "mt-elbows-on-pads",
              "mt-catch-and-return-kick",
              "ma-pad-holding"
            ],
            "prescription": "Shadow 3 x 3 min. Thai pads 5 x 3 min, 1 min rest. Elbows 2 x 2 min. Catch and return 3 x 3 min. Hold pads for your partner 5 x 3 min.",
            "minutes": 90
          },
          {
            "key": "dutch-combos",
            "label": "Dutch combination day",
            "sessionType": "martial_arts",
            "focus": "Punch combinations finished with a low kick, drilled with a partner and then sparred lightly",
            "exercises": [
              "ma-combination-drill",
              "boxing-liver-shot",
              "kb-dutch-combo-drill",
              "mt-low-kick",
              "ma-counter-drill",
              "ma-technical-sparring"
            ],
            "prescription": "Combinations 3 x 3 min. Liver shot 2 x 3 min. Dutch drill 5 x 3 min with a partner at 50%. Low kick 2 x 3 min. Counters 3 x 3 min. Technical sparring 3 x 2 min.",
            "minutes": 80
          },
          {
            "key": "clinch-conditioning",
            "label": "Clinch and conditioning day",
            "sessionType": "martial_arts",
            "focus": "Clinch rounds with rising resistance, then knees and a conditioning circuit",
            "exercises": [
              "ma-pummeling",
              "ma-clinch-work",
              "mt-clinch-sweeps",
              "mt-bag-knees",
              "mt-low-kick-bag-conditioning",
              "ma-fight-conditioning"
            ],
            "prescription": "Pummeling 2 x 3 min. Clinch 5 x 3 min. Sweeps 3 x 3 min. Bag knees 3 x 2 min, 100 knees per round target. Low-kick bag 2 x 2 min. Circuit 10 min.",
            "minutes": 75
          },
          {
            "key": "strength",
            "label": "Strength and power day",
            "sessionType": "strength",
            "focus": "Low-volume maximal strength and explosive throws, with neck and adductor work",
            "exercises": [
              "front-squat",
              "romanian-deadlift",
              "push-press",
              "barbell-row",
              "medicine-ball-slam",
              "landmine-rotation",
              "neck-harness-extension"
            ],
            "prescription": "Front squat 4 x 4. RDL 3 x 6. Push press 4 x 4. Row 3 x 8. Slams 4 x 6. Landmine rotation 3 x 8 per side. Neck 3 x 12.",
            "minutes": 60
          },
          {
            "key": "roadwork",
            "label": "Roadwork day",
            "sessionType": "outdoor",
            "focus": "Longer easy running followed by short hill sprints",
            "exercises": [
              "easy-run",
              "hill-sprints",
              "static-stretch-routine"
            ],
            "prescription": "35 min easy run, then 8 x 10 s hill sprints with a walk back down. 8 min of stretching for hips and hamstrings.",
            "minutes": 60
          }
        ],
        "gate": {
          "sessions": 40,
          "weeks": 8
        },
        "benchmarks": [
          "Complete 5 x 3-minute Thai pad rounds and still kick with good form in the last one",
          "Finish a 3-punch combination with a low kick without pausing between hands and leg",
          "Hold pads safely for a partner's kicks and knees for a full session",
          "Run 5 km without stopping, at a pace you could hold a conversation at"
        ],
        "coachNote": "Combinations must end with a kick or a check, never with your hands down. The Dutch drill works only if both partners keep the power honest and light."
      },
      {
        "key": "s5",
        "name": "Sparring and fight preparation",
        "aim": "You train like an amateur nak muay in camp: technical and open sparring, clinch sparring, hard pads, roadwork and a taper before the bout.",
        "weeks": 8,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "sparring",
            "label": "Sparring day",
            "sessionType": "martial_arts",
            "focus": "Supervised technical and open sparring over fight-length rounds, with clinch rounds",
            "exercises": [
              "ma-shadow-round",
              "ma-technical-sparring",
              "ma-sparring-round",
              "ma-clinch-work",
              "fight-prep-between-rounds-breathing",
              "ma-neck-conditioning"
            ],
            "prescription": "Shadow 3 x 3 min. Technical sparring 3 x 3 min. Sparring 3-5 x 3 min, breathing drill in rests. Clinch sparring 3 x 3 min. Neck 5 min. None in fight week.",
            "minutes": 80
          },
          {
            "key": "pads",
            "label": "Fight pads day",
            "sessionType": "martial_arts",
            "focus": "Pad rounds at fight pace built on your game plan, with a corner-style warm-up",
            "exercises": [
              "fight-prep-corner-pad-warm-up",
              "mt-thai-pad-rounds",
              "kb-dutch-combo-drill",
              "mt-elbows-on-pads",
              "mt-catch-and-return-kick"
            ],
            "prescription": "Corner warm-up 10 min. Thai pads 5 x 3 min at fight pace, 1 min rest. Dutch drill 3 x 3 min. Elbows 2 x 2 min. Catch and return 3 x 3 min.",
            "minutes": 75
          },
          {
            "key": "bag-conditioning",
            "label": "Bag conditioning day",
            "sessionType": "martial_arts",
            "focus": "High-output bag and knee rounds; replaced by a light shakeout in fight week",
            "exercises": [
              "ma-skipping",
              "ma-bag-round",
              "mt-bag-knees",
              "mt-low-kick-bag-conditioning",
              "ma-fight-conditioning",
              "fight-prep-shakeout"
            ],
            "prescription": "Skip 3 x 3 min. Bag 5 x 3 min at fight pace. Knees 3 x 2 min. Low-kick bag 2 x 2 min. Circuit 10 min. Fight week: 20 min shakeout only.",
            "minutes": 70
          },
          {
            "key": "roadwork",
            "label": "Roadwork day",
            "sessionType": "outdoor",
            "focus": "Threshold running and sprints, reduced sharply in the last ten days",
            "exercises": [
              "recovery-run",
              "tempo-run",
              "sprint-repeats"
            ],
            "prescription": "10 min easy, 20 min tempo, then 6 x 30 s sprints with 90 s walk. Swap for a 20 min recovery run in the final 10 days.",
            "minutes": 50
          },
          {
            "key": "strength",
            "label": "Power maintenance day",
            "sessionType": "strength",
            "focus": "Short, fast strength work that keeps power without soreness",
            "exercises": [
              "trap-bar-deadlift",
              "push-press",
              "medicine-ball-rotational-throw",
              "medicine-ball-slam",
              "pallof-press",
              "face-pull"
            ],
            "prescription": "Deadlift 3 x 3 fast. Push press 3 x 3. Throws 4 x 4 per side. Slams 3 x 5. Pallof press and face pulls 2 x 12. Drop this day in fight week.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 6
        },
        "benchmarks": [
          "Spar 3 x 3-minute rounds with controlled power and check or answer most kicks",
          "Hold fight pace on Thai pads for 5 x 3-minute rounds with 1 minute rest",
          "Clinch spar for 3 rounds without gassing or losing posture",
          "Run 3 km in under 15 minutes on a flat course or track"
        ],
        "coachNote": "Most sparring should be light and technical. Hard rounds are rare and supervised. You should leave camp healthy, with your shins and head intact."
      }
    ]
  },
  {
    "key": "path-grappler",
    "name": "Become a grappler",
    "become": "Grappler",
    "discipline": "combat",
    "tagline": "A wrestling base, judo entries and jiu-jitsu on the ground, from first breakfall to live rolling.",
    "whoFor": "Beginners with no mat experience who want to learn to take people down, control them and submit them, in a gi or without one.",
    "honesty": "Grappling is learned on another body. Solo drills build movement, but from stage 2 every technique day needs a partner and a mat, and throws, submissions and live rounds need a qualified coach.",
    "safety": "Learn to fall before you are thrown. Tap early and release at once when tapped. Apply joint locks slowly. Keep nails short and skin clean. Never drop your weight onto a partner's neck or knees.",
    "icon": "martial.grapple",
    "accent": "#3F7FBF",
    "stages": [
      {
        "key": "s1",
        "name": "Movement and breakfalls",
        "aim": "You fall backwards, sideways and forwards without hurting yourself, and move on the mat with hip escapes, bridges and technical stand-ups.",
        "weeks": 6,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "mat-movement",
            "label": "Mat movement day",
            "sessionType": "martial_arts",
            "focus": "Breakfalls and the solo movements that every escape and sweep is built from",
            "exercises": [
              "ma-breakfalls",
              "ma-shrimping",
              "ma-bridging",
              "ma-solo-grappling-drills",
              "wrestling-stance-and-motion"
            ],
            "prescription": "Breakfalls 3 x 10 each direction from squat height. Shrimping 4 mat lengths. Bridging 3 x 10 per side. Solo drills 3 x 3 min. Stance 3 x 2 min.",
            "minutes": 45
          },
          {
            "key": "stance-and-falls",
            "label": "Stance and sprawl day",
            "sessionType": "martial_arts",
            "focus": "Wrestling stance, level change and sprawl, with more breakfall practice",
            "exercises": [
              "wrestling-stance-and-motion",
              "ma-sprawl-drill",
              "ma-breakfalls",
              "ma-solo-grappling-drills",
              "ma-bridging"
            ],
            "prescription": "Stance and motion 4 x 2 min. Sprawls 4 x 8. Breakfalls 3 x 10 each direction. Solo drills 3 x 3 min. Bridging 2 x 10 per side. 1 min rest.",
            "minutes": 45
          },
          {
            "key": "base-strength",
            "label": "Base strength day",
            "sessionType": "calisthenics",
            "focus": "Bodyweight pulling, squatting and trunk strength, plus grip from hanging",
            "exercises": [
              "bodyweight-squat",
              "inverted-row",
              "push-up-incline",
              "glute-bridge",
              "dead-hang",
              "plank",
              "bear-crawl"
            ],
            "prescription": "3 x 10-12 on squat, row, push-up and bridge. Dead hang 3 x 20 s. Plank 3 x 30 s. Bear crawl 4 x 20 s. 60 s rest.",
            "minutes": 40
          },
          {
            "key": "mobility",
            "label": "Mobility day",
            "sessionType": "mindbody",
            "focus": "Hips, spine, neck and wrists: the joints grappling loads the most",
            "exercises": [
              "hip-mobility",
              "90-90-hip-switch",
              "cat-cow",
              "neck-cars",
              "quadruped-wrist-rocks",
              "deep-squat-hold"
            ],
            "prescription": "Hip routine 8 min. 90/90 switches 2 x 10. Cat-cow 2 x 10. Neck CARs 3 slow circles each way. Wrist rocks 2 x 10. Deep squat hold 3 x 45 s.",
            "minutes": 30
          }
        ],
        "gate": {
          "sessions": 14,
          "weeks": 4
        },
        "benchmarks": [
          "Back and side breakfall from standing with the chin tucked and the head never touching the mat",
          "Hip escape the length of the mat on both sides without stopping",
          "Hold a wrestling stance and move in it for 2 minutes without standing upright"
        ],
        "coachNote": "Falling well is the first technique, not a warm-up. Chin tucked, slap with the whole arm, never post a straight hand behind you."
      },
      {
        "key": "s2",
        "name": "Positions and escapes",
        "aim": "You know mount, side control, back and guard, and can escape the bottom of each against a partner giving light, cooperative resistance.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "escapes",
            "label": "Escape day",
            "sessionType": "martial_arts",
            "focus": "Escapes from mount, side control and back, drilled with a cooperative partner",
            "exercises": [
              "ma-shrimping",
              "ma-bridging",
              "ma-escape-drill",
              "ma-guard-retention",
              "wrestling-bottom-stand-up"
            ],
            "prescription": "Shrimp and bridge 5 min each. Escape drill 4 x 4 min, one position per round, swap roles. Guard retention 3 x 3 min. Stand-ups 3 x 8.",
            "minutes": 60
          },
          {
            "key": "standing-basics",
            "label": "Standing basics day",
            "sessionType": "martial_arts",
            "focus": "Stance, grips and underhooks with a partner, and defending the shot with a sprawl",
            "exercises": [
              "ma-breakfalls",
              "wrestling-stance-and-motion",
              "ma-grip-fighting",
              "ma-pummeling",
              "ma-sprawl-drill"
            ],
            "prescription": "Breakfalls 3 x 10. Stance 3 x 2 min. Grip fighting 4 x 2 min. Pummeling 4 x 2 min at easy pace. Sprawls 4 x 8. 1 min rest.",
            "minutes": 55
          },
          {
            "key": "fundamentals-class",
            "label": "Fundamentals class day",
            "sessionType": "martial_arts",
            "focus": "A coached beginners class, followed by extra repetitions of the day's position",
            "exercises": [
              "ma-solo-grappling-drills",
              "ma-bjj",
              "ma-escape-drill",
              "ma-guard-passing"
            ],
            "prescription": "Solo drills 10 min. Fundamentals class 45-60 min with no live rolling. Then 10 min escape reps and 10 min basic guard pass reps with a partner.",
            "minutes": 90
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "General strength with loaded carries and hanging for grip",
            "exercises": [
              "goblet-squat",
              "db-romanian-deadlift",
              "db-one-arm-row",
              "db-bench-press",
              "farmers-carry",
              "pallof-press",
              "dead-hang"
            ],
            "prescription": "3 x 10 on squat, RDL, row and press. Farmer's carry 4 x 30 s. Pallof press 3 x 10 per side. Dead hang 3 x 30 s.",
            "minutes": 50
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6
        },
        "benchmarks": [
          "Escape mount and side control against a cooperative partner, on both sides",
          "Name and hold the six main positions and know which are good and which are bad for you",
          "Pummel for underhooks for 2 minutes without standing tall or crossing your feet"
        ],
        "coachNote": "Position comes before submission. Learn to be comfortable and breathe slowly on the bottom; panic burns energy and gives up your arms."
      },
      {
        "key": "s3",
        "name": "Takedowns and guard",
        "aim": "You hit a double leg, single leg and two judo throws on a cooperative partner, and you can hold, sweep from and pass a basic guard in positional rounds.",
        "weeks": 10,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "wrestling",
            "label": "Wrestling day",
            "sessionType": "martial_arts",
            "focus": "Shots and finishes for the double and single leg, with the snap-down as a counter",
            "exercises": [
              "wrestling-stance-and-motion",
              "wrestling-shots",
              "wrestling-double-leg-finish",
              "wrestling-single-leg-finish",
              "wrestling-snap-down-front-headlock",
              "ma-sprawl-drill"
            ],
            "prescription": "Stance 3 x 2 min. Shots 5 x 8. Double-leg and single-leg finishes 4 x 3 min each, swap roles. Snap-down 3 x 3 min. Sprawls 4 x 10.",
            "minutes": 70
          },
          {
            "key": "judo",
            "label": "Judo entries day",
            "sessionType": "martial_arts",
            "focus": "Grips, entries and two throws, with breakfalls for the partner being thrown",
            "exercises": [
              "ma-breakfalls",
              "ma-grip-fighting",
              "ma-uchikomi",
              "judo-o-soto-gari",
              "judo-seoi-nage",
              "ma-throw-drill"
            ],
            "prescription": "Breakfalls 3 x 10. Grip fighting 3 x 2 min. Uchikomi 6 x 10. O-soto-gari and seoi-nage 3 x 4 min each. Throws onto a crash mat 4 x 5.",
            "minutes": 70
          },
          {
            "key": "guard",
            "label": "Guard day",
            "sessionType": "martial_arts",
            "focus": "Open guard, retention, sweeps and passing, finishing with positional sparring from guard",
            "exercises": [
              "bjj-open-guard-work",
              "ma-guard-retention",
              "ma-sweep-drill",
              "ma-guard-passing",
              "ma-positional-sparring"
            ],
            "prescription": "Open guard 3 x 4 min. Retention 3 x 3 min. Sweeps 3 x 4 min. Passing 3 x 4 min. Positional sparring from guard 5 x 3 min at 60-70% effort.",
            "minutes": 75
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "Heavier pulling, hinging and squatting, with carries and neck work",
            "exercises": [
              "trap-bar-deadlift",
              "front-squat",
              "barbell-row",
              "pull-up",
              "overhead-press",
              "farmers-carry",
              "band-neck-extension"
            ],
            "prescription": "Deadlift 4 x 5. Front squat 3 x 6. Row 4 x 8. Pull-ups 4 sets. Press 3 x 8. Farmer's carry 4 x 40 s. Neck 3 x 12.",
            "minutes": 65
          },
          {
            "key": "conditioning",
            "label": "Conditioning day",
            "sessionType": "cardio",
            "focus": "Rowing, sled and crawling intervals for whole-body work capacity",
            "exercises": [
              "rowing-machine",
              "rowing-intervals",
              "sled-push",
              "rope-sled-pull",
              "bear-crawl"
            ],
            "prescription": "Row 10 min easy. Then 6 x 1 min hard row, 1 min easy. Sled push 6 x 20 m. Sled pull 4 x 20 m. Bear crawl 4 x 30 s. Rest as needed.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 40,
          "weeks": 8
        },
        "benchmarks": [
          "Complete 10 clean double legs and 10 single legs on a cooperative partner, both sides",
          "Throw a partner with o-soto-gari and seoi-nage while keeping hold of their sleeve as they land",
          "Win or hold your guard for 3 minutes in positional sparring against a partner of similar size"
        ],
        "coachNote": "Entries matter more than finishes. Hundreds of correct level changes and uchikomi now make the throw appear on its own later."
      },
      {
        "key": "s4",
        "name": "Submissions and chains",
        "aim": "You attack with the main submissions from dominant positions, link a second attack when the first fails, and chain takedowns into control.",
        "weeks": 10,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "submissions",
            "label": "Submission day",
            "sessionType": "martial_arts",
            "focus": "The core submissions drilled slowly for precision, then hunted in positional rounds",
            "exercises": [
              "bjj-armbar-drill",
              "bjj-triangle-drill",
              "bjj-kimura-americana",
              "bjj-back-control-rnc",
              "ma-positional-sparring"
            ],
            "prescription": "Armbar, triangle, kimura/americana and back attack 3 x 4 min each, swap roles. Positional sparring from mount and back 6 x 3 min.",
            "minutes": 80
          },
          {
            "key": "chains",
            "label": "Chain day",
            "sessionType": "martial_arts",
            "focus": "Linking attacks: takedown to pin, failed submission to the next, turtle to the back",
            "exercises": [
              "wrestling-chain-wrestling",
              "wrestling-mat-returns",
              "grappling-turtle-attacks",
              "bjj-submission-chains",
              "bjj-leg-lock-entries",
              "ma-flow-rolling"
            ],
            "prescription": "Chain wrestling 4 x 3 min. Mat returns 3 x 3 min. Turtle attacks 3 x 3 min. Submission chains 4 x 4 min. Leg lock entries 3 x 3 min. Flow roll 3 x 5 min.",
            "minutes": 85
          },
          {
            "key": "first-rolls",
            "label": "Takedowns and first rolls day",
            "sessionType": "martial_arts",
            "focus": "A third throw, takedown entries against movement, then supervised first live rounds",
            "exercises": [
              "ma-uchikomi",
              "judo-uchi-mata",
              "ma-takedown-entries",
              "ma-positional-sparring",
              "ma-flow-rolling",
              "ma-rolling-round"
            ],
            "prescription": "Uchikomi 5 x 10. Uchi-mata 3 x 4 min. Entries 4 x 3 min. Positional sparring 4 x 3 min. Flow roll 2 x 5 min. Rolling 3 x 5 min at 70%.",
            "minutes": 85
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "Heavy pulling and odd-object strength, with direct grip and neck training",
            "exercises": [
              "deadlift",
              "zercher-squat",
              "sandbag-clean-press",
              "barbell-row",
              "suitcase-carry",
              "plate-pinch",
              "neck-harness-extension"
            ],
            "prescription": "Deadlift 4 x 4. Zercher squat 3 x 6. Sandbag clean and press 4 x 5. Row 4 x 8. Suitcase carry 4 x 20 m per side. Pinch 3 x 20 s. Neck 3 x 12.",
            "minutes": 65
          },
          {
            "key": "conditioning",
            "label": "Conditioning day",
            "sessionType": "cardio",
            "focus": "Match-length intervals on the bike and sled with short rests",
            "exercises": [
              "assault-bike",
              "rowing-intervals",
              "sled-push",
              "rope-sled-pull",
              "battle-ropes"
            ],
            "prescription": "Bike 8 min easy. Then 5 rounds of 5 min: 1 min row hard, sled push 20 m, sled pull 20 m, ropes 30 s, easy bike to finish. 90 s rest.",
            "minutes": 50
          }
        ],
        "gate": {
          "sessions": 40,
          "weeks": 8
        },
        "benchmarks": [
          "Finish an armbar, triangle, kimura and rear naked choke on a partner resisting at about half effort",
          "Switch to a second attack within two seconds when the first is defended",
          "Complete 3 x 5-minute rolling rounds while breathing through your nose in the rests"
        ],
        "coachNote": "Apply every submission slowly enough that your partner has time to tap. Speed in the finish is how training partners get injured and stop trusting you."
      },
      {
        "key": "s5",
        "name": "Live rolling and competition",
        "aim": "You train like a competitor: regular live rolling and standing randori, shark tank rounds, a game plan from your best positions, and a taper.",
        "weeks": 8,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "rolling",
            "label": "Live rolling day",
            "sessionType": "martial_arts",
            "focus": "Full rolling rounds, gi or no-gi, with recovery breathing between rounds",
            "exercises": [
              "ma-flow-rolling",
              "ma-rolling-round",
              "bjj-no-gi-rolling",
              "judo-newaza-randori",
              "fight-prep-between-rounds-breathing"
            ],
            "prescription": "Flow roll 2 x 5 min. Rolling 4 x 6 min. No-gi 2 x 5 min. Newaza randori 3 x 3 min. 1 min rest with breathing drill. Halve volume in the last week.",
            "minutes": 80
          },
          {
            "key": "randori",
            "label": "Standing randori day",
            "sessionType": "martial_arts",
            "focus": "Live takedown rounds from the feet, with grip fighting and mat returns",
            "exercises": [
              "ma-uchikomi",
              "ma-grip-fighting",
              "ma-takedown-sparring",
              "wrestling-live-goes",
              "wrestling-mat-returns"
            ],
            "prescription": "Uchikomi 5 x 10. Grip fighting 4 x 2 min. Takedown sparring 5 x 3 min. Live goes 4 x 2 min. Mat returns 3 x 3 min. 1 min rest.",
            "minutes": 70
          },
          {
            "key": "competition-sharpening",
            "label": "Competition sharpening day",
            "sessionType": "martial_arts",
            "focus": "Drilling your own game plan, starting from bad positions, and shark tank rounds",
            "exercises": [
              "wrestling-chain-wrestling",
              "bjj-submission-chains",
              "ma-positional-sparring",
              "ma-shark-tank",
              "fight-prep-weigh-in-week-technical"
            ],
            "prescription": "Chains 3 x 4 min each. Positional sparring from your worst spots 5 x 3 min. Shark tank 1 x match length. Final week: light technical session only.",
            "minutes": 75
          },
          {
            "key": "strength",
            "label": "Power maintenance day",
            "sessionType": "strength",
            "focus": "Low-volume heavy lifts that keep strength without adding fatigue to the mat",
            "exercises": [
              "trap-bar-deadlift",
              "front-squat",
              "barbell-row",
              "push-press",
              "farmers-carry",
              "neck-harness-extension"
            ],
            "prescription": "Deadlift 3 x 3. Front squat 3 x 3. Row 3 x 6. Push press 3 x 3. Farmer's carry 3 x 30 s. Neck 2 x 12. Drop this day in competition week.",
            "minutes": 45
          },
          {
            "key": "conditioning",
            "label": "Conditioning day",
            "sessionType": "cardio",
            "focus": "Hard intervals at match length, reduced sharply in the last ten days",
            "exercises": [
              "assault-bike",
              "bike-intervals",
              "rowing-intervals",
              "sprint-power-bursts"
            ],
            "prescription": "Bike 8 min easy. 6 x (30 s all-out, 90 s easy) on the bike. Row 4 x 2 min hard, 2 min easy. Power bursts 4 x 10 s. Halve it in the final 10 days.",
            "minutes": 40
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 6
        },
        "benchmarks": [
          "Roll 5 x 6-minute rounds with 1 minute rest against partners of different sizes",
          "Score a takedown in live standing rounds against a partner of similar weight and experience",
          "Describe your game plan: one takedown, one guard, one pass and two finishes you trust",
          "Stay calm through a full shark tank round"
        ],
        "coachNote": "Roll to learn, not to win the room. Put yourself in bad positions on purpose, protect your partners, and save full intensity for competition day."
      }
    ]
  },
  {
    "key": "path-mma",
    "name": "Become a mixed martial artist",
    "become": "Mixed Martial Artist",
    "discipline": "combat",
    "tagline": "Striking, wrestling and ground work built one range at a time, then joined into MMA.",
    "whoFor": "People who already train a little, in the gym or in one martial art, and want a structured road to training all the ranges of MMA together.",
    "honesty": "MMA cannot be self-taught. You need a gym with striking and grappling coaches, a mat, a wall or cage and partners from stage 2. This plan organises your week; it does not replace coaching.",
    "safety": "Spar light, with 16 oz or MMA sparring gloves, shin guards, gumshield and groin guard. No strikes to a grounded partner's head in training. Tap early. Rest after any head knock and get checked.",
    "icon": "martial.strike",
    "accent": "#8A5CC2",
    "stages": [
      {
        "key": "s1",
        "name": "Striking base",
        "aim": "You hold a stance that works for both punching and defending takedowns, and throw straight punches, a hook, a teep and a low and body kick.",
        "weeks": 6,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "boxing",
            "label": "Boxing day",
            "sessionType": "martial_arts",
            "focus": "Straight punches, the lead hook, basic defence and footwork in a slightly wider stance",
            "exercises": [
              "ma-skipping",
              "ma-footwork-drill",
              "ma-jab-cross",
              "boxing-lead-hook",
              "ma-defense-drill",
              "ma-shadow-round",
              "ma-bag-round"
            ],
            "prescription": "Skip 3 x 3 min. Footwork 2 x 3 min. Jab-cross 3 x 3 min. Hook 2 x 3 min. Defence 2 x 3 min. Shadow 2 x 3 min. Bag 3 x 3 min. 1 min rest.",
            "minutes": 65
          },
          {
            "key": "kicks",
            "label": "Kicking day",
            "sessionType": "martial_arts",
            "focus": "Teep, low kick and body kick with checks, drilled slowly and then on the bag",
            "exercises": [
              "ma-shadow-round",
              "mt-teep",
              "mt-low-kick",
              "mt-body-kick",
              "mt-check-drill",
              "ma-bag-round"
            ],
            "prescription": "Shadow 2 x 3 min. Teep 3 x 3 min. Low kick and body kick 3 x 3 min each. Checks 2 x 3 min. Bag 3 x 3 min mixing hands and kicks.",
            "minutes": 60
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "General strength across squat, hinge, push, pull and carry",
            "exercises": [
              "goblet-squat",
              "db-romanian-deadlift",
              "db-one-arm-row",
              "db-bench-press",
              "farmers-carry",
              "pallof-press",
              "band-pull-apart"
            ],
            "prescription": "3 x 10 on squat, RDL, row and press. Farmer's carry 4 x 30 s. Pallof press 3 x 10 per side. Pull-aparts 3 x 15.",
            "minutes": 50
          },
          {
            "key": "roadwork",
            "label": "Roadwork and mobility day",
            "sessionType": "outdoor",
            "focus": "Easy aerobic running followed by hip mobility for kicking and wrestling",
            "exercises": [
              "easy-run",
              "strides",
              "hip-mobility"
            ],
            "prescription": "25-30 min easy run at talking pace. 4 x 15 s strides with a walk back. 10 min hip mobility routine.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 19,
          "weeks": 4
        },
        "benchmarks": [
          "Complete 5 x 3-minute bag rounds mixing punches and kicks with 1 minute rest",
          "Throw 20 body kicks per leg with the hip turned over and return to stance in balance",
          "Run 30 minutes continuously at an easy pace"
        ],
        "coachNote": "An MMA stance is a compromise: low enough to sprawl, light enough to kick. Do not copy a pure boxing stance with a heavy front foot."
      },
      {
        "key": "s2",
        "name": "Wrestling and wall work",
        "aim": "You shoot and finish a double and single leg, sprawl on a partner's shot, and fight for underhooks and get back up against a wall.",
        "weeks": 8,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "wrestling",
            "label": "Wrestling day",
            "sessionType": "martial_arts",
            "focus": "Stance, level change, shots and finishes, with the sprawl as the first defence",
            "exercises": [
              "wrestling-stance-and-motion",
              "wrestling-shots",
              "wrestling-double-leg-finish",
              "wrestling-single-leg-finish",
              "ma-sprawl-drill"
            ],
            "prescription": "Stance 3 x 2 min. Shots 5 x 8. Double-leg finish 4 x 3 min. Single-leg finish 4 x 3 min, swap roles. Sprawls 4 x 10. 1 min rest.",
            "minutes": 65
          },
          {
            "key": "wall-work",
            "label": "Wall work day",
            "sessionType": "martial_arts",
            "focus": "Underhooks, clinch and wall wrestling, plus standing up and returning a partner to the mat",
            "exercises": [
              "ma-breakfalls",
              "ma-pummeling",
              "ma-clinch-work",
              "ma-cage-wrestling",
              "wrestling-bottom-stand-up",
              "wrestling-mat-returns"
            ],
            "prescription": "Breakfalls 3 x 10. Pummeling 3 x 3 min. Clinch 3 x 3 min. Wall wrestling 4 x 3 min at 50-60%. Stand-ups 3 x 8. Mat returns 3 x 3 min.",
            "minutes": 70
          },
          {
            "key": "striking",
            "label": "Striking maintenance day",
            "sessionType": "martial_arts",
            "focus": "Keeping the hands and kicks sharp with combinations, pads and bag rounds",
            "exercises": [
              "ma-shadow-round",
              "ma-combination-drill",
              "ma-kick-drill",
              "ma-mitt-work",
              "ma-bag-round"
            ],
            "prescription": "Shadow 3 x 3 min. Combinations 3 x 3 min. Kick drill 3 x 3 min. Pads 4 x 3 min. Bag 3 x 3 min. 1 min rest.",
            "minutes": 65
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "Heavier hinge and pull for takedowns, with single-leg work and the neck",
            "exercises": [
              "trap-bar-deadlift",
              "bulgarian-split-squat",
              "barbell-row",
              "landmine-press",
              "lat-pulldown",
              "farmers-carry",
              "band-neck-extension"
            ],
            "prescription": "Deadlift 4 x 5. Split squat 3 x 8 per leg. Row 4 x 8. Landmine press 3 x 8. Pulldown 3 x 10. Farmer's carry 4 x 40 s. Neck 3 x 12.",
            "minutes": 60
          },
          {
            "key": "conditioning",
            "label": "Conditioning day",
            "sessionType": "cardio",
            "focus": "Machine and sled intervals that spare the joints after wrestling",
            "exercises": [
              "rowing-machine",
              "rowing-intervals",
              "sled-push",
              "bear-crawl"
            ],
            "prescription": "Row 10 min easy. Then 6 x 1 min hard, 1 min easy. Sled push 6 x 20 m. Bear crawl 4 x 30 s. Rest as needed between sets.",
            "minutes": 40
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 6
        },
        "benchmarks": [
          "Hit 10 clean double legs and 10 single legs on a cooperative partner, both sides",
          "Sprawl and circle to a front headlock on a partner's shot at half speed",
          "Get back to your feet from the wall against a partner resisting at about half effort"
        ],
        "coachNote": "Change level by bending the knees, not the back. A shot with the head down and the hips behind is a gift to the other person's guillotine."
      },
      {
        "key": "s3",
        "name": "The ground game",
        "aim": "You escape bad positions, get back to your feet, pass and hold top position, and know where strikes fit on the ground in controlled drills.",
        "weeks": 10,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "bottom-game",
            "label": "Escapes and stand-ups day",
            "sessionType": "martial_arts",
            "focus": "Hip escapes, bridging, escapes from pins and the technical stand-up back to the feet",
            "exercises": [
              "ma-shrimping",
              "ma-bridging",
              "ma-solo-grappling-drills",
              "ma-escape-drill",
              "ma-guard-retention",
              "wrestling-bottom-stand-up"
            ],
            "prescription": "Shrimp and bridge 5 min each. Solo drills 3 x 3 min. Escape drill 4 x 4 min. Guard retention 3 x 3 min. Stand-ups 4 x 8. Swap roles each round.",
            "minutes": 70
          },
          {
            "key": "top-game",
            "label": "Top control day",
            "sessionType": "martial_arts",
            "focus": "Passing, holding position, controlled ground-and-pound on pads and two finishes",
            "exercises": [
              "ma-guard-passing",
              "ma-ground-and-pound",
              "bjj-back-control-rnc",
              "bjj-kimura-americana",
              "ma-positional-sparring"
            ],
            "prescription": "Passing 3 x 4 min. Ground-and-pound 4 x 3 min on a bag or pads. Back control 3 x 4 min. Kimura/americana 3 x 4 min. Positional sparring 5 x 3 min, no strikes.",
            "minutes": 80
          },
          {
            "key": "stand-up",
            "label": "Striking and wrestling day",
            "sessionType": "martial_arts",
            "focus": "Maintaining earlier stages: pad rounds, shots, sprawls and wall work",
            "exercises": [
              "ma-shadow-round",
              "mt-thai-pad-rounds",
              "ma-mitt-work",
              "wrestling-shots",
              "ma-sprawl-drill",
              "ma-cage-wrestling"
            ],
            "prescription": "Shadow 3 x 3 min. Thai pads 3 x 3 min. Mitts 3 x 3 min. Shots 4 x 8. Sprawls 4 x 10. Wall wrestling 3 x 3 min. 1 min rest.",
            "minutes": 70
          },
          {
            "key": "strength",
            "label": "Strength and power day",
            "sessionType": "strength",
            "focus": "Maximal strength in low volume with rotational throws and grip",
            "exercises": [
              "front-squat",
              "romanian-deadlift",
              "push-press",
              "pull-up",
              "medicine-ball-rotational-throw",
              "suitcase-carry",
              "neck-harness-extension"
            ],
            "prescription": "Front squat 4 x 4. RDL 3 x 6. Push press 4 x 4. Pull-ups 4 sets. Throws 4 x 5 per side. Suitcase carry 4 x 20 m. Neck 3 x 12.",
            "minutes": 60
          },
          {
            "key": "roadwork",
            "label": "Roadwork day",
            "sessionType": "outdoor",
            "focus": "Aerobic running with pace changes and short hill sprints",
            "exercises": [
              "easy-run",
              "fartlek-run",
              "hill-sprints"
            ],
            "prescription": "10 min easy run. 20 min fartlek: 1 min hard, 2 min easy. Then 6 x 10 s hill sprints with a walk back down.",
            "minutes": 50
          }
        ],
        "gate": {
          "sessions": 40,
          "weeks": 8
        },
        "benchmarks": [
          "Escape mount and side control and return to your feet against a partner at half effort",
          "Hold top position for a 3-minute positional round against a partner trying to escape",
          "Finish a rear naked choke and a kimura on a partner resisting at about half effort"
        ],
        "coachNote": "In MMA the first job on the bottom is to get up or get on top, not to play guard. Build the habit of the technical stand-up now."
      },
      {
        "key": "s4",
        "name": "Putting the ranges together",
        "aim": "You move between striking, clinch, takedown and ground without pausing: strikes into shots, sprawl back to strikes, and wall to mat to feet.",
        "weeks": 10,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "shoot-boxing",
            "label": "Shoot-boxing day",
            "sessionType": "martial_arts",
            "focus": "Strikes that set up takedowns and sprawls that return to striking, then light sparring",
            "exercises": [
              "ma-shadow-round",
              "mma-shoot-boxing-drill",
              "ma-takedown-entries",
              "ma-sprawl-drill",
              "ma-counter-drill",
              "ma-technical-sparring"
            ],
            "prescription": "Shadow 3 x 3 min with level changes. Shoot-boxing 5 x 3 min. Entries 3 x 3 min. Sprawls 4 x 10. Counters 3 x 3 min. Technical sparring 3 x 3 min.",
            "minutes": 80
          },
          {
            "key": "transitions",
            "label": "Transitions day",
            "sessionType": "martial_arts",
            "focus": "Wall to takedown to ground control and back up, drilled as one continuous sequence",
            "exercises": [
              "mma-transitions-drill",
              "ma-cage-wrestling",
              "ma-ground-and-pound",
              "wrestling-bottom-stand-up",
              "wrestling-mat-returns",
              "ma-positional-sparring"
            ],
            "prescription": "Transitions 5 x 4 min. Wall wrestling 4 x 3 min. Ground-and-pound 3 x 3 min on pads. Stand-ups 3 x 8. Mat returns 3 x 3 min. Positional sparring 4 x 3 min.",
            "minutes": 85
          },
          {
            "key": "grappling",
            "label": "Grappling day",
            "sessionType": "martial_arts",
            "focus": "No-gi chains, leg lock awareness and the first full grappling rounds",
            "exercises": [
              "wrestling-chain-wrestling",
              "bjj-submission-chains",
              "bjj-leg-lock-entries",
              "ma-flow-rolling",
              "bjj-no-gi-rolling"
            ],
            "prescription": "Chain wrestling 4 x 3 min. Submission chains 4 x 4 min. Leg lock entries and defence 3 x 3 min. Flow roll 2 x 5 min. No-gi rolling 4 x 5 min.",
            "minutes": 80
          },
          {
            "key": "strength",
            "label": "Strength and power day",
            "sessionType": "strength",
            "focus": "Heavy lifts and explosive work, kept short so mat sessions stay sharp",
            "exercises": [
              "trap-bar-deadlift",
              "zercher-squat",
              "push-press",
              "barbell-row",
              "medicine-ball-slam",
              "landmine-rotation",
              "neck-harness-extension"
            ],
            "prescription": "Deadlift 4 x 4. Zercher squat 3 x 5. Push press 4 x 4. Row 4 x 6. Slams 4 x 6. Landmine rotation 3 x 8 per side. Neck 3 x 12.",
            "minutes": 60
          },
          {
            "key": "conditioning",
            "label": "Conditioning day",
            "sessionType": "cardio",
            "focus": "Five-minute rounds of mixed work that match the length of an MMA round",
            "exercises": [
              "assault-bike",
              "sled-push",
              "battle-ropes",
              "medicine-ball-slams",
              "rope-sled-pull"
            ],
            "prescription": "Bike 8 min easy. Then 4 x 5-min rounds: bike 1 min hard, sled push 20 m, ropes 30 s, slams 10, sled pull 20 m, repeat. 1 min rest.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 40,
          "weeks": 8
        },
        "benchmarks": [
          "Finish a takedown set up by strikes 5 times in a 3-minute drill round",
          "Sprawl, separate and land a counter combination without pausing between the two",
          "Complete 4 x 5-minute no-gi rolling rounds with 1 minute rest"
        ],
        "coachNote": "The gaps between ranges are where fights are decided. Drill the moment of change, not just each range: hands up after the sprawl, posture after the takedown."
      },
      {
        "key": "s5",
        "name": "MMA sparring and camp",
        "aim": "You train like an amateur mixed martial artist in camp: light MMA sparring, separate striking and grappling rounds, conditioning and a taper.",
        "weeks": 8,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "mma-sparring",
            "label": "MMA sparring day",
            "sessionType": "martial_arts",
            "focus": "Supervised light MMA sparring over full rounds with all ranges open",
            "exercises": [
              "ma-shadow-round",
              "mma-shoot-boxing-drill",
              "mma-transitions-drill",
              "mma-light-sparring",
              "fight-prep-between-rounds-breathing"
            ],
            "prescription": "Shadow 3 x 3 min. Shoot-boxing 2 x 3 min. Transitions 2 x 4 min. MMA sparring 3-5 x 5 min, light contact, breathing drill in rests. None in fight week.",
            "minutes": 80
          },
          {
            "key": "striking",
            "label": "Striking day",
            "sessionType": "martial_arts",
            "focus": "Pad rounds on the game plan and technical stand-up sparring with takedown threats",
            "exercises": [
              "fight-prep-corner-pad-warm-up",
              "mt-thai-pad-rounds",
              "kb-dutch-combo-drill",
              "ma-mitt-work",
              "ma-technical-sparring"
            ],
            "prescription": "Corner warm-up 10 min. Thai pads 4 x 5 min. Dutch drill 3 x 3 min. Mitts 3 x 3 min. Technical sparring 3 x 3 min. 1 min rest.",
            "minutes": 75
          },
          {
            "key": "grappling",
            "label": "Grappling day",
            "sessionType": "martial_arts",
            "focus": "Live wrestling, wall work and rolling, finishing with shark tank rounds",
            "exercises": [
              "wrestling-live-goes",
              "ma-cage-wrestling",
              "bjj-no-gi-rolling",
              "ma-positional-sparring",
              "ma-shark-tank",
              "fight-prep-shakeout"
            ],
            "prescription": "Live goes 4 x 2 min. Wall wrestling 3 x 3 min. No-gi rolling 3 x 5 min. Positional sparring 3 x 3 min. Shark tank 1 x 5 min. Fight week: shakeout only.",
            "minutes": 80
          },
          {
            "key": "strength",
            "label": "Power maintenance day",
            "sessionType": "strength",
            "focus": "Short, fast strength work that keeps power without soreness",
            "exercises": [
              "trap-bar-deadlift",
              "push-press",
              "barbell-row",
              "medicine-ball-rotational-throw",
              "pallof-press",
              "face-pull"
            ],
            "prescription": "Deadlift 3 x 3 fast. Push press 3 x 3. Row 3 x 6. Throws 4 x 4 per side. Pallof press and face pulls 2 x 12. Drop this day in fight week.",
            "minutes": 45
          },
          {
            "key": "roadwork",
            "label": "Roadwork day",
            "sessionType": "outdoor",
            "focus": "Threshold running and sprints, reduced sharply in the last ten days",
            "exercises": [
              "recovery-run",
              "tempo-run",
              "sprint-repeats"
            ],
            "prescription": "10 min easy, 20 min tempo, then 6 x 30 s sprints with 90 s walk. Swap for a 20 min recovery run in the final 10 days.",
            "minutes": 50
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 6
        },
        "benchmarks": [
          "Spar 3 x 5-minute light MMA rounds and stay composed when the range changes",
          "Hold fight pace on pads for 3 x 5-minute rounds with 1 minute rest",
          "Roll 3 x 5-minute rounds straight after wall wrestling without gassing",
          "Finish camp with no injury that stops you training"
        ],
        "coachNote": "MMA sparring is kept light because there is so much to practise and so many ways to get hurt. Hard rounds are rare, planned and supervised."
      }
    ]
  },
  {
    "key": "path-footballer",
    "name": "Become a footballer",
    "become": "Footballer",
    "discipline": "team",
    "tagline": "From your first clean touch to a full 11-a-side season, built one stage at a time.",
    "whoFor": "Anyone who wants to play real football, from people who have never trained with a ball to street players who want structure and match fitness.",
    "honesty": "An app cannot watch your touch, correct your body shape or give you teammates. From stage 3 you need regular partners, and for 11-a-side a club and a coach. Tactics are learned in a team, not alone.",
    "safety": "Hamstring, groin, ankle and knee injuries are the common ones. Do the full warm-up every session, keep the Nordic and Copenhagen work, raise sprint volume slowly, and wear shin guards in any game.",
    "icon": "sport.soccer",
    "accent": "#2E9E5B",
    "stages": [
      {
        "key": "s1",
        "name": "Ball mastery and first touch",
        "aim": "You can keep the ball close with both feet at a jog, control a pass off a wall in one or two touches, and run 20 minutes without stopping.",
        "weeks": 8,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "ball-mastery",
            "label": "Ball mastery day",
            "sessionType": "sport",
            "focus": "Hundreds of touches with both feet: sole, inside, outside, laces.",
            "exercises": [
              "sport-warmup",
              "football-juggling",
              "football-cone-dribbling",
              "football-weak-foot",
              "football-first-touch-wall"
            ],
            "prescription": "10 min warm-up. Juggling 3 x 3 min. Cone dribbling 6 x 90 s, walk back. Weak foot only 10 min. Wall work 10 min, two touches.",
            "minutes": 60
          },
          {
            "key": "first-touch",
            "label": "First touch and passing day",
            "sessionType": "sport",
            "focus": "Receiving on the back foot, opening the body, passing with the inside of the foot.",
            "exercises": [
              "sport-warmup",
              "football-first-touch-wall",
              "sport-passing-drill",
              "football-rondo",
              "football-five-a-side"
            ],
            "prescription": "Wall work 4 x 4 min, alternate feet. Partner passing 15 min at 8-12 m. Rondo 4v1 or 3v1, 4 x 3 min. Finish with 15 min of easy small-sided play.",
            "minutes": 70
          },
          {
            "key": "base-strength",
            "label": "Bodyweight strength day",
            "sessionType": "calisthenics",
            "focus": "Legs, hips and trunk strong enough to run, cut and land without breaking down.",
            "exercises": [
              "bodyweight-squat",
              "bodyweight-reverse-lunge",
              "glute-bridge",
              "knee-push-up",
              "calf-raise-step",
              "plank",
              "side-plank"
            ],
            "prescription": "3 rounds: 12 squats, 8 lunges per leg, 15 bridges, 8 push-ups, 15 calf raises, 30 s plank, 20 s side plank per side. 60 s rest between rounds.",
            "minutes": 35
          },
          {
            "key": "aerobic-base",
            "label": "Easy running day",
            "sessionType": "outdoor",
            "focus": "Build the engine: easy continuous running at a pace where you can talk.",
            "exercises": [
              "run-walk-intervals",
              "easy-run",
              "strides",
              "leg-swings"
            ],
            "prescription": "Weeks 1-4: 8 x (2 min jog, 1 min walk). Weeks 5-8: 20-25 min easy run. Finish with 4 x 60 m relaxed strides and leg swings.",
            "minutes": 35
          }
        ],
        "gate": {
          "sessions": 19,
          "weeks": 6
        },
        "benchmarks": [
          "Juggle 15 times in a row using both feet",
          "Dribble a slalom of 8 cones with each foot without losing the ball",
          "Control 20 wall passes in a row with two touches, weak foot included",
          "Jog 20 minutes without walking or stopping"
        ],
        "coachNote": "Touches, not drills. The players who get good are the ones who spend the most minutes with a ball at their feet. Use the weak foot every session, even when it is embarrassing."
      },
      {
        "key": "s2",
        "name": "Passing, receiving and 1v1",
        "aim": "You can pass and receive on the move with both feet, keep the ball in a rondo, beat a defender with a change of pace and jockey an attacker without diving in.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "passing",
            "label": "Passing and receiving day",
            "sessionType": "sport",
            "focus": "Short and medium passing on the move, scanning before the ball arrives.",
            "exercises": [
              "sport-warmup",
              "sport-passing-drill",
              "football-first-touch-wall",
              "football-rondo",
              "football-long-passing"
            ],
            "prescription": "Pass and move in pairs 15 min. Wall work one touch 3 x 3 min. Rondo 5v2, 5 x 3 min. Long passing 20 balls per foot at 25-30 m.",
            "minutes": 75
          },
          {
            "key": "one-v-one",
            "label": "1v1 day",
            "sessionType": "sport",
            "focus": "Attacking a defender at speed and defending side-on with patience.",
            "exercises": [
              "fifa-11-plus-warm-up",
              "football-cone-dribbling",
              "football-1v1-attacking",
              "football-1v1-defending",
              "football-five-a-side"
            ],
            "prescription": "20 min warm-up. Cone work 5 x 60 s. 1v1 attacking 10 reps, 1v1 defending 10 reps, full rest between. 20 min small-sided game.",
            "minutes": 80
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "First loaded lifts, single-leg control and the start of hamstring protection.",
            "exercises": [
              "goblet-squat",
              "db-romanian-deadlift",
              "step-up",
              "db-one-arm-row",
              "push-up",
              "nordic-negative",
              "side-plank"
            ],
            "prescription": "Squat, RDL, step-up and row 3 x 10. Push-ups 3 x max minus 2. Nordic negatives 2 x 4 with a 4 s lower. Side plank 3 x 25 s per side.",
            "minutes": 50
          },
          {
            "key": "running",
            "label": "Running day",
            "sessionType": "outdoor",
            "focus": "Aerobic running with changes of pace, the way a match actually feels.",
            "exercises": [
              "easy-run",
              "fartlek-run",
              "strides",
              "hip-mobility"
            ],
            "prescription": "10 min easy, then 15-20 min fartlek (1 min hard, 2 min easy), 5 min easy. 6 x 60 m strides. 5 min hip mobility to finish.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6
        },
        "benchmarks": [
          "Complete 10 passes in a row in a 5v2 rondo as a team, regularly",
          "Hit a 25 m pass to a partner's feet 6 times out of 10 with your strong foot",
          "Stay on your feet and delay an attacker for 5 seconds in a 1v1",
          "Run 30 minutes with changes of pace without stopping"
        ],
        "coachNote": "Look before you receive. Check your shoulder every time the ball travels. A good first touch into space is worth more than any trick you have seen in a video."
      },
      {
        "key": "s3",
        "name": "Finishing, crossing, positional play",
        "aim": "You can finish with both feet from inside the box, deliver and attack crosses, and hold a position in a possession game instead of chasing the ball.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "finishing",
            "label": "Finishing and crossing day",
            "sessionType": "sport",
            "focus": "Shots on target from realistic positions, crosses and runs into the box.",
            "exercises": [
              "fifa-11-plus-warm-up",
              "sport-shooting-drill",
              "football-crossing-finishing",
              "football-heading",
              "football-weak-foot"
            ],
            "prescription": "Finishing 40 shots, half after a first touch. Crossing and finishing 20 deliveries per side. Heading 2 x 10 with a light ball. Weak foot finishing 10 min.",
            "minutes": 85
          },
          {
            "key": "positional",
            "label": "Positional play day",
            "sessionType": "sport",
            "focus": "Width, depth, support angles and switching play under pressure.",
            "exercises": [
              "sport-warmup",
              "football-rondo",
              "football-positional-play",
              "football-long-passing",
              "football-1v1-defending",
              "football-five-a-side"
            ],
            "prescription": "Rondo 10 min. Positional game 4v4+2, 5 x 4 min, 2 min rest. Switching play 15 min. 1v1 defending 8 reps. 20 min game with a two-touch limit.",
            "minutes": 90
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "Heavier lower-body strength plus hamstring and groin protection.",
            "exercises": [
              "trap-bar-deadlift",
              "bulgarian-split-squat",
              "barbell-hip-thrust",
              "pallof-press",
              "nordic-curl",
              "copenhagen-plank"
            ],
            "prescription": "Trap bar deadlift 4 x 5. Split squat 3 x 8 per leg. Hip thrust 3 x 8. Pallof press 3 x 10 per side. Nordics 3 x 5. Copenhagen plank 3 x 15 s per side.",
            "minutes": 55
          },
          {
            "key": "speed",
            "label": "Speed and agility day",
            "sessionType": "cardio",
            "focus": "Short accelerations, braking and changes of direction while fresh.",
            "exercises": [
              "acceleration-starts",
              "deceleration-landing-mechanics",
              "agility-ladder",
              "pro-agility-5-10-5",
              "box-jumps"
            ],
            "prescription": "Landing mechanics 3 x 5. Ladder 6 passes. Acceleration 8 x 15 m, walk back. 5-10-5 shuttle 6 reps, 90 s rest. Box jumps 3 x 5. Stop when speed drops.",
            "minutes": 45
          },
          {
            "key": "aerobic",
            "label": "Tempo running day",
            "sessionType": "outdoor",
            "focus": "Sustained running a little harder than comfortable to raise match stamina.",
            "exercises": [
              "easy-run",
              "tempo-run",
              "strides",
              "hamstring-routine"
            ],
            "prescription": "10 min easy, 2 x 10 min tempo with 3 min jog between, 5 min easy. 4 strides. Hamstring routine 5 min. Optional day; drop it if legs are heavy.",
            "minutes": 50
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6
        },
        "benchmarks": [
          "Hit the target with 7 of 10 shots from the edge of the box, strong foot",
          "Deliver 6 of 10 crosses into the area between the penalty spot and six-yard box",
          "Keep your position and offer a passing angle through a full 4-minute possession game",
          "Complete 5 Nordic curls with control on the way down"
        ],
        "coachNote": "Finishing is about placement and calm, not power. In possession games, ask where the space is before you ask for the ball. You need partners from here on; solo work is no longer enough."
      },
      {
        "key": "s4",
        "name": "Match fitness",
        "aim": "You can press, recover and sprint repeatedly for a full small-sided game, and your technique holds up when you are tired.",
        "weeks": 8,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "pressing",
            "label": "Pressing day",
            "sessionType": "sport",
            "focus": "Pressing triggers, counter-pressing after losing the ball, and sprinting with the ball.",
            "exercises": [
              "fifa-11-plus-warm-up",
              "football-pressing-drill",
              "football-rsa-with-ball",
              "football-positional-play",
              "sport-scrimmage"
            ],
            "prescription": "Pressing drill 6 x 2 min, 2 min rest. Sprints with the ball 2 x 6 x 30 m, 25 s rest, 4 min between sets. Possession game 3 x 5 min. Scrimmage 15 min.",
            "minutes": 90
          },
          {
            "key": "small-sided",
            "label": "Small-sided games day",
            "sessionType": "sport",
            "focus": "High-intensity games on a small pitch: the best football conditioning there is.",
            "exercises": [
              "fifa-11-plus-warm-up",
              "football-rondo",
              "football-five-a-side",
              "football-crossing-finishing"
            ],
            "prescription": "Rondo 10 min. 4v4 or 5v5: 4 x 8 min at full intensity, 3 min rest. Finish with 15 min crossing and finishing while tired.",
            "minutes": 85
          },
          {
            "key": "repeat-sprint",
            "label": "Repeated sprint day",
            "sessionType": "cardio",
            "focus": "Repeated sprints with short recovery and high-intensity aerobic intervals.",
            "exercises": [
              "acceleration-starts",
              "shuttle-runs",
              "norwegian-4x4",
              "yo-yo-intermittent-recovery-test",
              "lateral-shuffle"
            ],
            "prescription": "Starts 6 x 20 m. Shuttles 2 x 6 x 40 m (20 out, 20 back), 20 s rest. Then 4 x 4 min hard, 3 min jog. Swap the intervals for the Yo-Yo test every fourth week.",
            "minutes": 55
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "Maintain and build strength while running load is high.",
            "exercises": [
              "back-squat",
              "romanian-deadlift",
              "db-reverse-lunge",
              "db-lateral-lunge",
              "nordic-curl",
              "copenhagen-plank"
            ],
            "prescription": "Back squat 4 x 5. RDL 3 x 6. Reverse lunge 3 x 8 per leg. Lateral lunge 2 x 8 per side. Nordics 3 x 6. Copenhagen plank 3 x 20 s per side.",
            "minutes": 55
          },
          {
            "key": "club",
            "label": "Club training day",
            "sessionType": "sport",
            "focus": "Train with a team: organised practice, a coach, and a game at the end.",
            "exercises": [
              "fifa-11-plus-warm-up",
              "sport-team-practice",
              "football-free-kick-practice",
              "static-stretch-routine"
            ],
            "prescription": "Full club session 75-90 min. Stay 10 min after for 15 free kicks. Stretch 5-10 min. If you have no club yet, replace with a 7-a-side game.",
            "minutes": 100
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 6
        },
        "benchmarks": [
          "Play 4 x 8 minutes of 5-a-side at full effort without your touch falling apart",
          "Reach level 16 or higher on the Yo-Yo intermittent recovery test (level 1)",
          "Hold sprint times within 10 percent across 6 x 30 m with 25 s rest",
          "Train with a club or organised group at least once a week"
        ],
        "coachNote": "Fitness in football means repeating sprints and still making good decisions. Do the hard running with the ball whenever you can, and never add sprint volume and lifting load in the same week."
      },
      {
        "key": "s5",
        "name": "The playing season",
        "aim": "You play 11-a-side most weeks, know your role at set pieces, and manage your week around the match so you arrive fresh and stay uninjured.",
        "weeks": 12,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "match",
            "label": "Match day",
            "sessionType": "sport",
            "focus": "A full 11-a-side match, friendly or league, with a proper warm-up.",
            "exercises": [
              "fifa-11-plus-warm-up",
              "football-11-a-side-match",
              "static-stretch-routine"
            ],
            "prescription": "20 min warm-up including sprints at full speed. 90 min match or as many minutes as the coach gives you. 10 min easy stretching afterwards.",
            "minutes": 120
          },
          {
            "key": "recovery",
            "label": "Recovery day",
            "sessionType": "mindbody",
            "focus": "The day after the match: move, loosen up, and check what hurts.",
            "exercises": [
              "foam-rolling",
              "hip-mobility",
              "adductor-routine",
              "hamstring-routine",
              "recovery-spin"
            ],
            "prescription": "15-20 min very easy spin or walk first, then 10 min foam rolling and 5 min each of hip, adductor and hamstring work. Nothing should be hard today.",
            "minutes": 45
          },
          {
            "key": "team-training",
            "label": "Team training day",
            "sessionType": "sport",
            "focus": "Tactical work with the team: shape, pressing and building from the back.",
            "exercises": [
              "fifa-11-plus-warm-up",
              "sport-team-practice",
              "football-positional-play",
              "football-pressing-drill",
              "football-rondo"
            ],
            "prescription": "Club session 90 min. This is the hardest training day of the week, placed 3-4 days before the match. Add nothing extra afterwards.",
            "minutes": 100
          },
          {
            "key": "set-pieces",
            "label": "Set pieces and sharpness day",
            "sessionType": "sport",
            "focus": "Corners, free kicks, penalties and short sharp finishing, 1-2 days before the match.",
            "exercises": [
              "sport-warmup",
              "football-corner-routines",
              "football-free-kick-practice",
              "football-penalty-practice",
              "football-heading",
              "football-crossing-finishing"
            ],
            "prescription": "Corner routines 20 min, attacking and defending. 15 free kicks, 10 penalties. Heading 2 x 8. Crossing and finishing 15 min. Low volume, high quality.",
            "minutes": 70
          },
          {
            "key": "in-season-strength",
            "label": "In-season strength day",
            "sessionType": "strength",
            "focus": "Short heavy session to keep strength and protect hamstrings, groin and calves.",
            "exercises": [
              "trap-bar-deadlift",
              "bulgarian-split-squat",
              "barbell-hip-thrust",
              "pallof-press",
              "nordic-curl",
              "copenhagen-plank",
              "single-leg-calf-raise"
            ],
            "prescription": "Deadlift 3 x 4. Split squat 2 x 6 per leg. Hip thrust 2 x 8. Pallof 2 x 10. Nordics 2 x 6. Copenhagen 2 x 20 s. Calf raise 2 x 12. At least 3 days before the match.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 48,
          "weeks": 10
        },
        "benchmarks": [
          "Play 60 minutes or more of 11-a-side in at least 8 matches",
          "Know your marking and attacking job at corners for and against",
          "Complete the full injury-prevention warm-up before every session and match",
          "Keep lifting once a week through the whole season"
        ],
        "coachNote": "In season, the match is the hardest session of the week and everything else serves it. Most injuries come from players who stop lifting and stop warming up once the games begin."
      }
    ]
  },
  {
    "key": "path-handballer",
    "name": "Become a handball player",
    "become": "Handball player",
    "discipline": "team",
    "tagline": "Learn to pass on the run, shoot in the air and defend as a unit, then play matches.",
    "whoFor": "Beginners who want to play handball properly, and casual players who want a throwing arm, legs and a shoulder that last a whole season.",
    "honesty": "Handball is a contact team sport played seven against seven. This app can structure your training and your strength work, but defence, timing and legal contact must be learned in a club with a coach and a goalkeeper.",
    "safety": "Throwing shoulders, knees on landing, ankles and fingers take the damage. Build throwing volume slowly, land on two feet when learning, keep the shoulder and hamstring work, and stop throwing through pain.",
    "icon": "sport.handball",
    "accent": "#3B82C4",
    "stages": [
      {
        "key": "s1",
        "name": "Passing and basic shots",
        "aim": "You can catch with two hands and pass accurately while running, respect the three-step rule, and hit the corners of the goal with a standing shot.",
        "weeks": 8,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "passing",
            "label": "Passing day",
            "sessionType": "sport",
            "focus": "Catching with two hands and passing in motion with a high elbow.",
            "exercises": [
              "sport-warmup",
              "sport-passing-drill",
              "handball-passing-in-motion",
              "sport-throwing-practice",
              "handball-standing-shot"
            ],
            "prescription": "Stationary passing in pairs 10 min, both hands. Passing in motion 5 x 3 min. 40 throws at a wall target. Standing shot 20 reps at half power.",
            "minutes": 60
          },
          {
            "key": "shooting",
            "label": "Shooting and footwork day",
            "sessionType": "sport",
            "focus": "Three-step rhythm into a standing shot, plus basic court movement.",
            "exercises": [
              "sport-warmup",
              "sport-footwork",
              "handball-standing-shot",
              "handball-7m-throws",
              "sport-scrimmage"
            ],
            "prescription": "Footwork 10 min. Three steps and shoot 30 reps, aim low corners. 7 m throws 15 reps. Finish with 15 min of small-sided play, no hard contact.",
            "minutes": 65
          },
          {
            "key": "base-strength",
            "label": "Bodyweight and shoulder day",
            "sessionType": "calisthenics",
            "focus": "General strength with early care for the throwing shoulder.",
            "exercises": [
              "bodyweight-squat",
              "glute-bridge",
              "knee-push-up",
              "inverted-row",
              "y-raise",
              "plank",
              "band-pull-apart"
            ],
            "prescription": "3 rounds: 12 squats, 15 bridges, 8 push-ups, 8 rows, 10 Y-raises, 30 s plank, 15 pull-aparts. 60 s rest between rounds.",
            "minutes": 35
          },
          {
            "key": "aerobic-base",
            "label": "Easy running day",
            "sessionType": "outdoor",
            "focus": "Basic endurance so you can train for an hour without fading.",
            "exercises": [
              "run-walk-intervals",
              "easy-run",
              "strides",
              "shoulder-mobility"
            ],
            "prescription": "Weeks 1-4: 8 x (2 min jog, 1 min walk). Weeks 5-8: 20-25 min easy run. 4 relaxed strides. 5 min shoulder mobility to finish.",
            "minutes": 35
          }
        ],
        "gate": {
          "sessions": 19,
          "weeks": 6
        },
        "benchmarks": [
          "Complete 20 passes in motion with a partner without a drop",
          "Take three steps and shoot without a travelling fault, every time",
          "Hit a chosen low corner with 6 of 10 standing shots from 8 m",
          "Jog 20 minutes without walking or stopping"
        ],
        "coachNote": "Elbow above the shoulder on every throw. A low elbow is slow, inaccurate and hard on the joint. Fix it now at half power, because it will not fix itself at full speed."
      },
      {
        "key": "s2",
        "name": "Jump shot and feints",
        "aim": "You can take off from the correct leg and shoot in the air over a block, land safely, and beat a defender with a simple body feint.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "jump-shot",
            "label": "Jump shot day",
            "sessionType": "sport",
            "focus": "Take-off from the opposite leg, shooting at the top of the jump, safe landing.",
            "exercises": [
              "sport-warmup",
              "handball-passing-in-motion",
              "handball-jump-shot",
              "sport-plyometrics",
              "handball-7m-throws"
            ],
            "prescription": "Passing in motion 10 min. Jump shot 40 reps from 9 m, first 15 without a goalkeeper. Plyometrics 3 x 6 jumps. 7 m throws 10 reps.",
            "minutes": 75
          },
          {
            "key": "feints",
            "label": "Feints and 1v1 day",
            "sessionType": "sport",
            "focus": "Beating a defender and staying in front of an attacker.",
            "exercises": [
              "sport-warmup",
              "sport-footwork",
              "handball-feints-1v1",
              "handball-blocking-footwork",
              "handball-standing-shot",
              "sport-scrimmage"
            ],
            "prescription": "Footwork 10 min. Feints 1v1, 12 reps each side. Defensive footwork 5 x 45 s. Hip shots 15 reps. 20 min game, controlled contact only.",
            "minutes": 80
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "First loaded lifts, with rotator cuff and upper-back work for the throwing arm.",
            "exercises": [
              "goblet-squat",
              "db-romanian-deadlift",
              "db-one-arm-row",
              "db-shoulder-press",
              "db-external-rotation",
              "face-pull",
              "side-plank"
            ],
            "prescription": "Squat, RDL, row 3 x 10. Shoulder press 3 x 8. External rotation 3 x 12 light. Face pull 3 x 15. Side plank 3 x 25 s per side.",
            "minutes": 50
          },
          {
            "key": "landing",
            "label": "Jumping and conditioning day",
            "sessionType": "cardio",
            "focus": "Landing mechanics, lateral movement and short shuttles.",
            "exercises": [
              "deceleration-landing-mechanics",
              "box-jumps",
              "lateral-shuffle",
              "shuttle-runs",
              "jump-rope-basic"
            ],
            "prescription": "Landing mechanics 3 x 6. Box jumps 4 x 5, step down. Lateral shuffle 6 x 20 s. Shuttles 8 x 20 m out and back, 30 s rest. Rope 3 x 2 min.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6
        },
        "benchmarks": [
          "Score 5 of 10 jump shots from 9 m against a goalkeeper or at marked corners",
          "Land from every jump shot balanced, knees not collapsing inward",
          "Beat a passive defender with a feint to both sides",
          "Complete 8 x 40 m shuttles with 30 s rest at a steady time"
        ],
        "coachNote": "Learn the landing before the height. Most knee injuries in handball happen coming down from a shot. Two feet, soft knees, every rep, until it is automatic."
      },
      {
        "key": "s3",
        "name": "Fast break, wing and pivot",
        "aim": "You can run and finish a fast break, shoot from the wing at a narrow angle, and work with a pivot on the six-metre line.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "fast-break",
            "label": "Fast break day",
            "sessionType": "sport",
            "focus": "First and second wave counter-attacks: long pass, sprint, finish.",
            "exercises": [
              "sport-warmup",
              "handball-passing-in-motion",
              "handball-fast-break",
              "handball-jump-shot",
              "sport-scrimmage"
            ],
            "prescription": "Passing in motion 10 min. Fast break 3 x 6 reps full court, 3 min between sets. Jump shots 20 reps. Scrimmage 20 min, score from breaks counts double.",
            "minutes": 85
          },
          {
            "key": "positions",
            "label": "Wing and pivot day",
            "sessionType": "sport",
            "focus": "Position-specific shooting and combinations with the back court.",
            "exercises": [
              "sport-warmup",
              "handball-wing-shooting",
              "handball-pivot-work",
              "handball-crossing-combinations",
              "handball-feints-1v1"
            ],
            "prescription": "Wing shots 15 per side. Pivot work 20 receptions and turns. Crossing combinations 15 min. Feints 1v1, 10 reps. Try every position before you choose one.",
            "minutes": 85
          },
          {
            "key": "strength",
            "label": "Strength and power day",
            "sessionType": "strength",
            "focus": "Lower-body strength and rotational power for the shot.",
            "exercises": [
              "trap-bar-deadlift",
              "bulgarian-split-squat",
              "landmine-press",
              "medicine-ball-rotational-throw",
              "cable-external-rotation",
              "pallof-press",
              "pull-up"
            ],
            "prescription": "Deadlift 4 x 5. Split squat 3 x 8 per leg. Landmine press 3 x 8. Rotational throw 3 x 6 per side. External rotation 3 x 12. Pallof 3 x 10. Pull-ups 3 x max minus 1.",
            "minutes": 60
          },
          {
            "key": "speed",
            "label": "Speed and agility day",
            "sessionType": "cardio",
            "focus": "Accelerations over 10-20 m and sharp changes of direction.",
            "exercises": [
              "acceleration-starts",
              "deceleration-landing-mechanics",
              "pro-agility-5-10-5",
              "skater-jumps",
              "box-jumps"
            ],
            "prescription": "Starts 8 x 15 m, walk back. Landing 2 x 6. 5-10-5 shuttle 6 reps, 90 s rest. Skater jumps 3 x 8 per side. Box jumps 3 x 5.",
            "minutes": 40
          },
          {
            "key": "club",
            "label": "Club training day",
            "sessionType": "sport",
            "focus": "Organised team practice with a goalkeeper and real defenders.",
            "exercises": [
              "sport-warmup",
              "sport-team-practice",
              "handball",
              "handball-7m-throws"
            ],
            "prescription": "Full club session 75-90 min including a game. 10 x 7 m throws afterwards. If you have no club yet, play a pick-up game and start looking for one.",
            "minutes": 95
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6
        },
        "benchmarks": [
          "Finish 7 of 10 fast breaks with a shot on target",
          "Score from the wing at a narrow angle 4 times in 10",
          "Receive on the line as a pivot, turn and shoot under light contact",
          "Have trained with a club or organised group at least 4 times"
        ],
        "coachNote": "A fast break is won in the first three steps after the ball is regained. Sprint first, look for the ball second. From this stage you need a team; find a club."
      },
      {
        "key": "s4",
        "name": "Defence and match fitness",
        "aim": "You can hold your place in a 6-0 or 5-1 defence, make legal contact, block shots, and keep your intensity through repeated attacks and retreats.",
        "weeks": 8,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "defence",
            "label": "Defensive systems day",
            "sessionType": "sport",
            "focus": "Stepping out, sliding, handing over attackers and legal body contact.",
            "exercises": [
              "sport-warmup",
              "handball-blocking-footwork",
              "handball-defensive-system",
              "sport-tackling-drill",
              "handball-gk-reaction"
            ],
            "prescription": "Footwork 5 x 45 s. Defence drill 6-0 then 5-1, 25 min. Contact drill 10 min, chest to chest, arms controlled. Goalkeeper reaction 10 min or shoot for the keeper.",
            "minutes": 85
          },
          {
            "key": "attack",
            "label": "Attack against set defence",
            "sessionType": "sport",
            "focus": "Breaking an organised defence with crossings, the pivot and the wings.",
            "exercises": [
              "sport-warmup",
              "handball-crossing-combinations",
              "handball-pivot-work",
              "handball-wing-shooting",
              "handball-jump-shot",
              "sport-scrimmage"
            ],
            "prescription": "Crossing combinations 20 min. Pivot and wing finishing 15 min. Jump shots over a block 20 reps. 6v6 positional attack 20 min.",
            "minutes": 90
          },
          {
            "key": "match-fitness",
            "label": "Match fitness day",
            "sessionType": "cardio",
            "focus": "Repeated high-intensity efforts with short rests, as in a match.",
            "exercises": [
              "acceleration-starts",
              "shuttle-runs",
              "thirty-fifteen-ift",
              "hiit-session",
              "lateral-shuffle"
            ],
            "prescription": "Starts 6 x 15 m. Shuttles 2 x 8 x 40 m, 20 s rest. Then 2 x 6 min of 15 s hard, 15 s easy. Replace the intervals with the 30-15 test every fourth week.",
            "minutes": 50
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "Heavy legs, overhead power and hamstring and groin protection.",
            "exercises": [
              "back-squat",
              "romanian-deadlift",
              "push-press",
              "medicine-ball-slam",
              "pull-up",
              "nordic-curl",
              "copenhagen-plank"
            ],
            "prescription": "Squat 4 x 5. RDL 3 x 6. Push press 3 x 5. Ball slam 3 x 8. Pull-ups 3 x 6. Nordics 3 x 5. Copenhagen plank 3 x 20 s per side.",
            "minutes": 60
          },
          {
            "key": "club",
            "label": "Club training day",
            "sessionType": "sport",
            "focus": "Team practice and a training game at full intensity.",
            "exercises": [
              "sport-warmup",
              "sport-team-practice",
              "handball-fast-break",
              "handball"
            ],
            "prescription": "Full club session 90 min. Ask the coach for feedback on your defensive position. Stretch the shoulder and hips for 5 min after.",
            "minutes": 95
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 6
        },
        "benchmarks": [
          "Defend a full 6v6 attack in a 6-0 without losing your neighbour's side",
          "Make contact with the chest and bent arms, not by pushing or grabbing from behind",
          "Play 2 x 15 minutes of full-court handball at match pace",
          "Squat your own bodyweight for 5 reps with good depth"
        ],
        "coachNote": "Defence in handball is footwork and communication before it is strength. Talk all the time, move your feet before you use your arms, and you will concede fewer goals and fewer suspensions."
      },
      {
        "key": "s5",
        "name": "Match play and joint care",
        "aim": "You play competitive matches in a defined position, handle the weekly load, and keep your shoulder and knees healthy across a season.",
        "weeks": 12,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "match",
            "label": "Match day",
            "sessionType": "sport",
            "focus": "A full handball match with a complete warm-up including throwing.",
            "exercises": [
              "sport-warmup",
              "handball-match",
              "static-stretch-routine"
            ],
            "prescription": "25 min warm-up: run, mobility, passing, 15 progressive shots. 2 x 30 min match. 10 min easy stretching afterwards.",
            "minutes": 100
          },
          {
            "key": "team-training",
            "label": "Team training day",
            "sessionType": "sport",
            "focus": "Tactical session: defensive system, set plays and transition.",
            "exercises": [
              "sport-warmup",
              "sport-team-practice",
              "handball-defensive-system",
              "handball-crossing-combinations",
              "handball-fast-break",
              "handball-7m-throws"
            ],
            "prescription": "Club session 90 min. Hardest session of the week, 3-4 days before the match. 10 x 7 m throws at the end if you take them in games.",
            "minutes": 100
          },
          {
            "key": "position",
            "label": "Position-specific day",
            "sessionType": "sport",
            "focus": "Volume in your own position: wing, back court, pivot or goalkeeper.",
            "exercises": [
              "sport-warmup",
              "handball-wing-shooting",
              "handball-pivot-work",
              "handball-jump-shot",
              "handball-feints-1v1",
              "handball-gk-reaction"
            ],
            "prescription": "Pick the two drills for your position and do 30-40 quality reps of each. 10 reps of feints. Cap total hard throws at 80 for the session.",
            "minutes": 70
          },
          {
            "key": "strength-care",
            "label": "Strength and joint care day",
            "sessionType": "strength",
            "focus": "In-season strength with rotator cuff and knee tendon work.",
            "exercises": [
              "trap-bar-deadlift",
              "landmine-press",
              "spanish-squat",
              "cable-external-rotation",
              "face-pull",
              "nordic-curl",
              "copenhagen-plank"
            ],
            "prescription": "Deadlift 3 x 4. Landmine press 3 x 6. Spanish squat 3 x 30 s hold. External rotation 3 x 12. Face pull 3 x 15. Nordics 2 x 6. Copenhagen 2 x 20 s.",
            "minutes": 50
          },
          {
            "key": "recovery",
            "label": "Recovery day",
            "sessionType": "mindbody",
            "focus": "Day after the match: restore the shoulder, upper back and hips.",
            "exercises": [
              "foam-rolling",
              "shoulder-mobility",
              "thoracic-mobility",
              "sleeper-stretch",
              "hip-mobility"
            ],
            "prescription": "10 min foam rolling, then 5-8 min each of shoulder, thoracic and hip mobility. Sleeper stretch 3 x 30 s, gentle. No throwing today.",
            "minutes": 40
          }
        ],
        "gate": {
          "sessions": 48,
          "weeks": 10
        },
        "benchmarks": [
          "Play in at least 8 competitive matches across the stage",
          "Finish a match and throw pain-free two days later",
          "Keep one strength session every week of the season",
          "Know your role in the team's main defensive system and two set plays"
        ],
        "coachNote": "Count your throws. Shoulder trouble comes from sudden jumps in volume, not from one hard shot. Keep the cuff work and the lifting all season, especially when you feel fine."
      }
    ]
  },
  {
    "key": "path-basketballer",
    "name": "Become a basketball player",
    "become": "Basketball player",
    "discipline": "team",
    "tagline": "Build a repeatable shot, a handle and the legs to defend, then learn to play five on five.",
    "whoFor": "Beginners with a ball and a hoop nearby, and playground players who want reliable fundamentals and the fitness for full-court games.",
    "honesty": "This app cannot see your shooting form or teach team defence, spacing and reads. Film your shot or ask a coach to check it, and from stage 3 you need people to play against. Five on five needs a team.",
    "safety": "Ankle sprains and knee tendon pain are the main risks, with jammed fingers close behind. Learn to land and stop, keep calf and single-leg strength work, and increase jumping volume gradually.",
    "icon": "sport.basketball",
    "accent": "#E0772F",
    "stages": [
      {
        "key": "s1",
        "name": "Form shooting and handling",
        "aim": "You can shoot with the same form every time from close range, dribble with either hand without looking at the ball, and pass off a wall cleanly.",
        "weeks": 8,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "shooting",
            "label": "Form shooting day",
            "sessionType": "sport",
            "focus": "One-hand form close to the rim, then free throws with a fixed routine.",
            "exercises": [
              "sport-warmup",
              "basketball-form-shooting",
              "basketball-mikan-drill",
              "basketball-free-throws"
            ],
            "prescription": "Form shooting 100 makes from 1-3 m, five spots. Mikan drill 3 x 1 min. Free throws 5 x 10, same routine every time. Record makes.",
            "minutes": 55
          },
          {
            "key": "handling",
            "label": "Ball-handling day",
            "sessionType": "sport",
            "focus": "Stationary and moving dribbles with both hands, eyes up.",
            "exercises": [
              "sport-warmup",
              "basketball-two-ball-handling",
              "basketball-cone-dribbling",
              "sport-wall-ball",
              "sport-footwork"
            ],
            "prescription": "Stationary dribbling 10 min, one ball first, then two. Cone dribbling 8 x 45 s, weak hand twice as often. Wall passes 3 x 30. Jump stops and pivots 10 min.",
            "minutes": 55
          },
          {
            "key": "base-strength",
            "label": "Bodyweight strength day",
            "sessionType": "calisthenics",
            "focus": "Legs, trunk and calves, plus ankle range for landing.",
            "exercises": [
              "bodyweight-squat",
              "glute-bridge",
              "knee-push-up",
              "inverted-row",
              "calf-raise-step",
              "plank",
              "ankle-mobility"
            ],
            "prescription": "3 rounds: 12 squats, 15 bridges, 8 push-ups, 8 rows, 15 calf raises, 30 s plank. 60 s rest between rounds. Finish with 5 min ankle mobility.",
            "minutes": 35
          },
          {
            "key": "conditioning",
            "label": "Easy conditioning day",
            "sessionType": "cardio",
            "focus": "Low-impact aerobic base and first landing practice.",
            "exercises": [
              "jump-rope-basic",
              "zone-2-cardio",
              "lateral-shuffle",
              "deceleration-landing-mechanics"
            ],
            "prescription": "Rope 5 x 1 min. 20 min easy cardio at a talking pace. Lateral shuffle 4 x 20 s. Landing mechanics 3 x 5, quiet two-foot landings.",
            "minutes": 40
          }
        ],
        "gate": {
          "sessions": 19,
          "weeks": 6
        },
        "benchmarks": [
          "Make 8 of 10 form shots from 2 m from five different spots",
          "Make 6 of 10 free throws with the same routine each time",
          "Dribble the length of the court with your weak hand without looking down",
          "Jump stop and pivot on either foot without travelling"
        ],
        "coachNote": "Stay close to the rim until the form is the same every time. Moving back too early builds a push shot that takes years to undo. Makes matter more than range right now."
      },
      {
        "key": "s2",
        "name": "Layups, footwork and defence",
        "aim": "You can finish layups with either hand at speed, stop and pivot under control, and stay in front of a dribbler in a defensive stance.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "finishing",
            "label": "Layups and finishing day",
            "sessionType": "sport",
            "focus": "Two-step rhythm, finishing off the glass with both hands.",
            "exercises": [
              "sport-warmup",
              "basketball-mikan-drill",
              "basketball-layup-lines",
              "basketball-form-shooting",
              "basketball-free-throws"
            ],
            "prescription": "Mikan 3 x 1 min. Layups 25 per hand from the wing, then 10 per hand at speed. Form shooting 50 makes. Free throws 3 x 10.",
            "minutes": 65
          },
          {
            "key": "defence",
            "label": "Defence and footwork day",
            "sessionType": "sport",
            "focus": "Stance, slides, closeouts and containing the ball.",
            "exercises": [
              "sport-warmup",
              "sport-footwork",
              "basketball-closeout-drill",
              "sport-keeper-training",
              "basketball-cone-dribbling",
              "sport-scrimmage"
            ],
            "prescription": "Footwork 10 min. Closeouts 3 x 8. Defensive slides and 1v1 containment 15 min. Cone dribbling 6 x 45 s. 20 min half-court game.",
            "minutes": 80
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "First loaded lifts with single-leg and calf work.",
            "exercises": [
              "goblet-squat",
              "db-romanian-deadlift",
              "step-up",
              "db-one-arm-row",
              "push-up",
              "single-leg-calf-raise",
              "side-plank"
            ],
            "prescription": "Squat, RDL, step-up and row 3 x 10. Push-ups 3 x max minus 2. Single-leg calf raise 3 x 10. Side plank 3 x 25 s per side.",
            "minutes": 50
          },
          {
            "key": "jump-land",
            "label": "Jumping and conditioning day",
            "sessionType": "cardio",
            "focus": "Landing quality, low-level jumps and court-length shuttles.",
            "exercises": [
              "deceleration-landing-mechanics",
              "box-jumps",
              "lateral-shuffle",
              "shuttle-runs",
              "jump-rope-alternate"
            ],
            "prescription": "Landing 3 x 6. Box jumps 4 x 5, step down. Shuffle 6 x 20 s. Court-length shuttles 8 reps, 30 s rest. Rope 3 x 2 min.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6
        },
        "benchmarks": [
          "Make 8 of 10 layups with each hand at a jog",
          "Make 5 of 10 weak-hand layups at full speed",
          "Slide with a dribbler for the width of the court without crossing your feet",
          "Make 7 of 10 free throws with the same routine"
        ],
        "coachNote": "Defence is the fastest way onto any team. Stay low, keep your feet moving and your hands off the ball-handler. Nobody needs to give you the ball for you to defend well."
      },
      {
        "key": "s3",
        "name": "Shooting on the move, rebounding",
        "aim": "You can shoot off the catch and off one or two dribbles from mid-range, box out before going for the ball, and use a basic post move.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "shooting",
            "label": "Catch and dribble shooting",
            "sessionType": "sport",
            "focus": "Footwork into the shot: catch and shoot, then pull-ups off the dribble.",
            "exercises": [
              "sport-warmup",
              "basketball-form-shooting",
              "basketball-catch-and-shoot",
              "basketball-pull-up-jumper",
              "basketball-free-throws"
            ],
            "prescription": "Form shooting 30 makes. Catch and shoot 100 attempts from five spots. Pull-ups 50 attempts, both directions. Free throws 3 x 10 between blocks.",
            "minutes": 75
          },
          {
            "key": "rebounding",
            "label": "Rebounding and post day",
            "sessionType": "sport",
            "focus": "Boxing out, securing the ball, and scoring with your back to the basket.",
            "exercises": [
              "sport-warmup",
              "basketball-rebounding-box-out",
              "basketball-post-moves",
              "basketball-layup-lines",
              "basketball-closeout-drill",
              "sport-scrimmage"
            ],
            "prescription": "Box-out drill 15 min. Post moves 10 per side: drop step and hook. Contested layups 20. Closeouts 2 x 8. 20 min half-court game.",
            "minutes": 85
          },
          {
            "key": "handling",
            "label": "Handle and finishing day",
            "sessionType": "sport",
            "focus": "Changes of direction at speed into a finish or a pull-up.",
            "exercises": [
              "basketball-two-ball-handling",
              "basketball-cone-dribbling",
              "basketball-pull-up-jumper",
              "basketball-mikan-drill"
            ],
            "prescription": "Two-ball 10 min. Cone dribbling 8 x 45 s into a finish. Pull-ups off a crossover 30 attempts. Reverse Mikan 3 x 1 min.",
            "minutes": 55
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "Heavier lifting for jumping, contact and holding position.",
            "exercises": [
              "trap-bar-deadlift",
              "bulgarian-split-squat",
              "barbell-hip-thrust",
              "db-shoulder-press",
              "pallof-press",
              "pull-up"
            ],
            "prescription": "Deadlift 4 x 5. Split squat 3 x 8 per leg. Hip thrust 3 x 8. Shoulder press 3 x 8. Pallof press 3 x 10 per side. Pull-ups 3 x max minus 1.",
            "minutes": 55
          },
          {
            "key": "speed",
            "label": "Speed and jump day",
            "sessionType": "cardio",
            "focus": "First-step quickness, change of direction and jumps while fresh.",
            "exercises": [
              "acceleration-starts",
              "pro-agility-5-10-5",
              "skater-jumps",
              "box-jumps",
              "lateral-shuffle"
            ],
            "prescription": "Starts 8 x 10 m, walk back. 5-10-5 shuttle 6 reps, 90 s rest. Skater jumps 3 x 8 per side. Box jumps 4 x 4. Shuffle 4 x 15 s. Stop when you slow down.",
            "minutes": 40
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6
        },
        "benchmarks": [
          "Make 50 of 100 catch-and-shoot attempts from mid-range",
          "Make 4 of 10 pull-up jumpers going each direction",
          "Make contact and box out before looking for the ball on every shot in a game",
          "Score with a drop step from either block against light defence"
        ],
        "coachNote": "Your feet shoot the ball. Be set, balanced and square before the catch and the shot becomes the same one you built in stage 1. Count makes and write them down."
      },
      {
        "key": "s4",
        "name": "Pick-and-roll and 3x3",
        "aim": "You can run and defend a pick-and-roll, make the basic read from it, and compete in half-court 3x3 games with little rest.",
        "weeks": 8,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "pick-and-roll",
            "label": "Pick-and-roll day",
            "sessionType": "sport",
            "focus": "Using the screen, reading the defender, and setting a legal screen and rolling.",
            "exercises": [
              "sport-warmup",
              "basketball-pick-and-roll",
              "basketball-pull-up-jumper",
              "basketball-catch-and-shoot",
              "basketball-post-moves"
            ],
            "prescription": "Pick-and-roll reads 30 min: 2v0, then 2v2. Play both handler and screener. Pull-ups off the screen 30. Pop and shoot 30. Roll finishes 20.",
            "minutes": 85
          },
          {
            "key": "three-on-three",
            "label": "3x3 game day",
            "sessionType": "sport",
            "focus": "Half-court games to 21 or 10 minutes: decisions under pressure.",
            "exercises": [
              "sport-warmup",
              "basketball-closeout-drill",
              "basketball-rebounding-box-out",
              "basketball-3x3"
            ],
            "prescription": "Closeouts 2 x 8. Box-out 10 min. 3x3 games: 4-6 games to 21 or 10 min each, 3 min between games.",
            "minutes": 85
          },
          {
            "key": "shooting",
            "label": "Shooting volume day",
            "sessionType": "sport",
            "focus": "High-volume shooting at game speed, free throws when tired.",
            "exercises": [
              "basketball-form-shooting",
              "basketball-catch-and-shoot",
              "basketball-pull-up-jumper",
              "basketball-free-throws",
              "basketball-two-ball-handling"
            ],
            "prescription": "Form 30 makes. 150 catch-and-shoot attempts including threes. 50 pull-ups. Free throws in pairs after each block, 40 total. Two-ball 5 min.",
            "minutes": 70
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "Heavy legs, overhead power and groin protection.",
            "exercises": [
              "back-squat",
              "romanian-deadlift",
              "db-reverse-lunge",
              "push-press",
              "pull-up",
              "copenhagen-plank"
            ],
            "prescription": "Squat 4 x 5. RDL 3 x 6. Reverse lunge 3 x 8 per leg. Push press 3 x 5. Pull-ups 3 x 6. Copenhagen plank 3 x 20 s per side.",
            "minutes": 55
          },
          {
            "key": "conditioning",
            "label": "Court conditioning day",
            "sessionType": "cardio",
            "focus": "Repeated sprints and slides with short recovery.",
            "exercises": [
              "shuttle-runs",
              "agility-t-test",
              "hiit-session",
              "lateral-shuffle",
              "box-jumps"
            ],
            "prescription": "Box jumps 3 x 5. T-test 4 reps. Court shuttles: 6 x down-and-back twice, 45 s rest. Then 8 min of 15 s hard, 15 s easy. Shuffle 4 x 20 s.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 6
        },
        "benchmarks": [
          "Make the right read (shoot, drive or pass to the roller) in most 2v2 pick-and-rolls",
          "Play four 3x3 games in a session and still defend in the last one",
          "Make 35 of 100 three-point attempts off the catch",
          "Make 8 of 10 free throws when tired, straight after sprints"
        ],
        "coachNote": "In 3x3 there is nowhere to hide. Every possession asks you to guard, rebound and make a decision. Play against people better than you as often as you can."
      },
      {
        "key": "s5",
        "name": "Full-court play",
        "aim": "You play full-court five on five, run the floor in transition, know your role in a team, and have the conditioning to defend in the fourth quarter.",
        "weeks": 12,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "game",
            "label": "Game day",
            "sessionType": "sport",
            "focus": "Full-court 5v5, league game or organised scrimmage.",
            "exercises": [
              "sport-warmup",
              "basketball-full-court-scrimmage",
              "basketball-free-throws",
              "static-stretch-routine"
            ],
            "prescription": "20 min warm-up with layups and shooting. 4 x 10 min game or 60 min of full-court runs. 20 free throws straight after. Stretch 10 min.",
            "minutes": 100
          },
          {
            "key": "team-training",
            "label": "Team training day",
            "sessionType": "sport",
            "focus": "Team offence and defence, transition, and pick-and-roll coverage.",
            "exercises": [
              "sport-warmup",
              "sport-team-practice",
              "basketball-pick-and-roll",
              "basketball-closeout-drill",
              "basketball-rebounding-box-out",
              "basketball-3x3"
            ],
            "prescription": "Club session 90 min. If training with friends instead: pick-and-roll 20 min, shell defence and closeouts 20 min, box-out 10 min, 3x3 for 30 min.",
            "minutes": 95
          },
          {
            "key": "shooting",
            "label": "Shooting day",
            "sessionType": "sport",
            "focus": "Maintain the shot: game spots, game speed, tracked numbers.",
            "exercises": [
              "basketball-form-shooting",
              "basketball-catch-and-shoot",
              "basketball-pull-up-jumper",
              "basketball-free-throws"
            ],
            "prescription": "Form 30 makes. 200 shots from the spots you actually shoot from in games. Free throws 50, in sets of two. Record every number.",
            "minutes": 60
          },
          {
            "key": "strength",
            "label": "Strength and power day",
            "sessionType": "strength",
            "focus": "In-season strength, jump power and hamstring care.",
            "exercises": [
              "depth-jump",
              "trap-bar-deadlift",
              "front-squat",
              "bulgarian-split-squat",
              "db-shoulder-press",
              "pallof-press",
              "nordic-curl"
            ],
            "prescription": "Depth jumps 3 x 4 first. Deadlift 3 x 4. Front squat 3 x 5. Split squat 2 x 6 per leg. Press 3 x 6. Pallof 2 x 10. Nordics 2 x 6. Two days before a game at the latest.",
            "minutes": 55
          },
          {
            "key": "conditioning",
            "label": "Conditioning day",
            "sessionType": "cardio",
            "focus": "High-intensity intervals to hold pace for four quarters.",
            "exercises": [
              "acceleration-starts",
              "shuttle-runs",
              "norwegian-4x4",
              "thirty-fifteen-ift",
              "lateral-shuffle"
            ],
            "prescription": "Starts 6 x 10 m. Shuttles 2 x 6 court lengths, 30 s rest. 4 x 4 min hard, 3 min easy. Swap intervals for the 30-15 test monthly. Skip in weeks with two games.",
            "minutes": 50
          }
        ],
        "gate": {
          "sessions": 48,
          "weeks": 10
        },
        "benchmarks": [
          "Play 8 or more full-court games of at least 40 minutes",
          "Sprint back on defence on every possession in the last quarter",
          "Make 70 percent of free throws across the stage",
          "Know your role in your team's offence and its pick-and-roll coverage"
        ],
        "coachNote": "Full court rewards the player who runs, talks and makes the simple pass. Conditioning is what lets your skills show up late in a game. Keep the shooting numbers honest."
      }
    ]
  },
  {
    "key": "path-racket",
    "name": "Become a padel and tennis player",
    "become": "Padel and tennis player",
    "discipline": "racket",
    "tagline": "Learn to rally, serve and play the net, then use the glass and compete in real matches.",
    "whoFor": "Beginners picking up a racket for the first time and social players who want sound technique, better movement and a body that handles regular matches.",
    "honesty": "Grips, swing paths and the serve motion are very hard to learn without someone watching. Take a few lessons early, especially for the serve. You need a partner for almost everything and a court with glass for padel.",
    "safety": "Elbow, shoulder, wrist and lower-back overuse and rolled ankles are the usual problems. Raise serve and smash volume slowly, keep the cuff and forearm work, and use proper court shoes.",
    "icon": "sport.padel",
    "accent": "#9AAE2B",
    "stages": [
      {
        "key": "s1",
        "name": "Footwork and rallying",
        "aim": "You can split step, get behind the ball and keep a cooperative rally of ten shots going on forehand and backhand at a gentle pace.",
        "weeks": 8,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "forehand",
            "label": "Forehand and footwork day",
            "sessionType": "sport",
            "focus": "Ready position, split step, and a forehand hit with control over the net.",
            "exercises": [
              "sport-warmup",
              "tennis-footwork-split-step",
              "sport-wall-ball",
              "sport-rally-drill",
              "tennis-forehand-crosscourt"
            ],
            "prescription": "Footwork 10 min. Wall rally 3 x 4 min. Fed balls 40 forehands. Cross-court forehand rally 15 min, count the longest rally. Half pace throughout.",
            "minutes": 60
          },
          {
            "key": "backhand",
            "label": "Backhand and rally day",
            "sessionType": "sport",
            "focus": "Backhand basics, then mixed rallies on a tennis or padel court.",
            "exercises": [
              "sport-warmup",
              "tennis-footwork-split-step",
              "tennis-backhand-drill",
              "sport-rally-drill",
              "padel"
            ],
            "prescription": "Footwork 5 min. Backhand drill 40 fed balls. Mixed rally 15 min. Finish with 20 min of relaxed padel or mini-tennis, no scoring.",
            "minutes": 60
          },
          {
            "key": "base-strength",
            "label": "Bodyweight strength day",
            "sessionType": "calisthenics",
            "focus": "Legs for lunging to the ball, trunk control, and healthy shoulders.",
            "exercises": [
              "bodyweight-squat",
              "bodyweight-reverse-lunge",
              "glute-bridge",
              "knee-push-up",
              "bird-dog",
              "plank",
              "band-pull-apart"
            ],
            "prescription": "3 rounds: 12 squats, 8 lunges per leg, 15 bridges, 8 push-ups, 8 bird-dogs per side, 30 s plank, 15 pull-aparts. 60 s rest between rounds.",
            "minutes": 35
          },
          {
            "key": "movement",
            "label": "Movement and aerobic day",
            "sessionType": "cardio",
            "focus": "Side-to-side movement and an easy aerobic base.",
            "exercises": [
              "jump-rope-basic",
              "lateral-shuffle",
              "agility-ladder",
              "zone-2-cardio"
            ],
            "prescription": "Rope 5 x 1 min. Lateral shuffle 6 x 15 s. Ladder 6 passes. Then 20 min easy cardio at a pace where you can talk.",
            "minutes": 40
          }
        ],
        "gate": {
          "sessions": 19,
          "weeks": 6
        },
        "benchmarks": [
          "Rally 10 shots in a row cross-court on the forehand with a partner",
          "Rally 10 shots in a row on the backhand side with a partner",
          "Split step before every shot your partner hits",
          "Keep 20 wall shots going in a row without a miss"
        ],
        "coachNote": "Control before power. Aim a metre over the net and well inside the lines. If you can keep ten balls in play, you will already beat most people who only try to hit hard."
      },
      {
        "key": "s2",
        "name": "Serve and return",
        "aim": "You can start a point reliably with a tennis serve and a padel underarm serve, return into the court, and play out short points.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "serve",
            "label": "Serve and return day",
            "sessionType": "sport",
            "focus": "Toss, rhythm and contact on the serve; a compact blocked return.",
            "exercises": [
              "sport-warmup",
              "tennis-serve-practice",
              "sport-serve-practice",
              "tennis-return-of-serve",
              "shoulder-mobility"
            ],
            "prescription": "Tennis serve 60 balls at second-serve pace, both boxes. Padel underarm serve 30 balls. Return 40 balls. Shoulder mobility 5 min. Stop serving if the shoulder aches.",
            "minutes": 70
          },
          {
            "key": "rally",
            "label": "Rally and points day",
            "sessionType": "sport",
            "focus": "Longer rallies with direction, then points starting with a serve.",
            "exercises": [
              "tennis-footwork-split-step",
              "tennis-forehand-crosscourt",
              "tennis-backhand-drill",
              "sport-rally-drill",
              "tennis"
            ],
            "prescription": "Footwork 5 min. Forehand cross-court 10 min, backhand cross-court 10 min, down the line 10 min. Then 30 min of points, serve included.",
            "minutes": 75
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "First loaded lifts, lateral leg strength and rotator cuff work.",
            "exercises": [
              "goblet-squat",
              "db-romanian-deadlift",
              "db-lateral-lunge",
              "db-one-arm-row",
              "db-external-rotation",
              "face-pull",
              "side-plank"
            ],
            "prescription": "Squat, RDL and row 3 x 10. Lateral lunge 3 x 8 per side. External rotation 3 x 12 light. Face pull 3 x 15. Side plank 3 x 25 s per side.",
            "minutes": 50
          },
          {
            "key": "agility",
            "label": "Agility day",
            "sessionType": "cardio",
            "focus": "Braking, pushing off and recovering to the middle.",
            "exercises": [
              "deceleration-landing-mechanics",
              "lateral-shuffle",
              "agility-ladder",
              "shuttle-runs",
              "jump-rope-alternate"
            ],
            "prescription": "Landing and braking 3 x 6. Shuffle 6 x 20 s. Ladder 6 passes. Shuttles 8 x 10 m out and back, 30 s rest. Rope 3 x 2 min.",
            "minutes": 40
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6
        },
        "benchmarks": [
          "Land 7 of 10 tennis second serves in the correct box",
          "Land 9 of 10 padel serves in the box with the ball staying low",
          "Return 6 of 10 serves into play, tennis and padel",
          "Play a full set or an hour of points without losing count of the score"
        ],
        "coachNote": "A serve you can repeat beats a serve that is fast once in five. Build the toss and the rhythm first. Get a coach to look at it at least once; serve faults become permanent quickly."
      },
      {
        "key": "s3",
        "name": "Net, overheads and glass",
        "aim": "You can volley and finish overhead at the net, play the ball after it rebounds off the padel glass, and hit a controlled bandeja.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "net",
            "label": "Net play day",
            "sessionType": "sport",
            "focus": "Volleys, the approach shot and the overhead on a tennis court.",
            "exercises": [
              "sport-warmup",
              "tennis-volley-net-play",
              "tennis-approach-and-volley",
              "tennis-overhead-smash",
              "tennis-serve-practice"
            ],
            "prescription": "Volleys 15 min, forehand and backhand. Approach and volley 20 reps. Overheads 30 balls at 70 percent. Serves 40 balls.",
            "minutes": 75
          },
          {
            "key": "padel-glass",
            "label": "Padel glass day",
            "sessionType": "sport",
            "focus": "Reading the rebound, the lob to take the net, and defending overheads.",
            "exercises": [
              "sport-warmup",
              "padel-glass-rebounds",
              "padel-lob-net-transition",
              "padel-bandeja-vibora",
              "padel"
            ],
            "prescription": "Back-glass rebounds 15 min, then side glass 10 min. Lob and move to the net 20 reps. Bandeja 30 balls, control not power. 30 min of games.",
            "minutes": 85
          },
          {
            "key": "baseline",
            "label": "Baseline day",
            "sessionType": "sport",
            "focus": "Keep the groundstrokes and return growing while you add new shots.",
            "exercises": [
              "tennis-footwork-split-step",
              "tennis-forehand-crosscourt",
              "tennis-backhand-drill",
              "tennis-return-of-serve",
              "sport-rally-drill"
            ],
            "prescription": "Footwork 5 min. Cross-court rallies 2 x 10 min per side. Returns 40 balls. Two cross-court then one down the line pattern, 15 min.",
            "minutes": 65
          },
          {
            "key": "strength",
            "label": "Strength and power day",
            "sessionType": "strength",
            "focus": "Lower-body strength and rotational power with shoulder care.",
            "exercises": [
              "trap-bar-deadlift",
              "bulgarian-split-squat",
              "landmine-press",
              "seated-cable-row",
              "medicine-ball-rotational-throw",
              "cable-external-rotation",
              "pallof-press"
            ],
            "prescription": "Deadlift 4 x 5. Split squat 3 x 8 per leg. Landmine press and row 3 x 8. Rotational throw 3 x 6 per side. External rotation 3 x 12. Pallof 3 x 10.",
            "minutes": 55
          },
          {
            "key": "speed",
            "label": "Court speed day",
            "sessionType": "cardio",
            "focus": "First-step speed and lateral power over 3-10 metres.",
            "exercises": [
              "acceleration-starts",
              "pro-agility-5-10-5",
              "skater-jumps",
              "lateral-shuffle",
              "box-jumps"
            ],
            "prescription": "Starts 8 x 10 m, walk back. 5-10-5 shuttle 6 reps, 90 s rest. Skater jumps 3 x 8 per side. Shuffle 4 x 15 s. Box jumps 3 x 5.",
            "minutes": 40
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6
        },
        "benchmarks": [
          "Keep a volley-to-volley exchange of 10 shots with a partner",
          "Let the ball pass, turn and return 7 of 10 balls off the back glass",
          "Hit 6 of 10 bandejas deep into the court without giving up the net",
          "Put away 6 of 10 easy overheads on a tennis court"
        ],
        "coachNote": "In padel, the glass is your friend: let the ball come off it and give yourself time. Most beginners lose points by rushing a ball they should have let bounce off the wall."
      },
      {
        "key": "s4",
        "name": "Tactics and match play",
        "aim": "You can build points with a plan, hold the net as a pair in padel, play tennis singles and doubles sets, and adjust when a plan is not working.",
        "weeks": 8,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "tennis-match",
            "label": "Tennis match play day",
            "sessionType": "sport",
            "focus": "Sets with a simple plan: serve to a target, first ball cross-court.",
            "exercises": [
              "sport-warmup",
              "tennis-serve-practice",
              "tennis-return-of-serve",
              "tennis-singles-match"
            ],
            "prescription": "Serve 30 balls to targets, return 20 balls. Play two sets or 75 min. Decide one tactical aim before you start and review it after.",
            "minutes": 100
          },
          {
            "key": "padel-match",
            "label": "Padel match play day",
            "sessionType": "sport",
            "focus": "Taking and holding the net as a pair, lobbing to win it back.",
            "exercises": [
              "sport-warmup",
              "padel-glass-rebounds",
              "padel-lob-net-transition",
              "padel-bandeja-vibora",
              "padel-match"
            ],
            "prescription": "Glass rebounds 10 min. Lob and net transition 10 min. Bandeja and vibora 20 balls each. Match: best of three sets or 75 min.",
            "minutes": 100
          },
          {
            "key": "patterns",
            "label": "Patterns and doubles day",
            "sessionType": "sport",
            "focus": "Rehearsed patterns of play, then doubles to practise positioning.",
            "exercises": [
              "tennis-approach-and-volley",
              "tennis-forehand-crosscourt",
              "tennis-backhand-drill",
              "tennis-volley-net-play",
              "tennis-doubles-match"
            ],
            "prescription": "Approach and volley 20 reps. Cross-court patterns 2 x 10 min. Volleys 10 min. Doubles: one set, talk with your partner between points.",
            "minutes": 90
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "Heavy legs, rotation and the pulling strength that protects the shoulder.",
            "exercises": [
              "back-squat",
              "romanian-deadlift",
              "db-lateral-lunge",
              "cable-woodchopper",
              "db-external-rotation",
              "pull-up",
              "copenhagen-plank"
            ],
            "prescription": "Squat 4 x 5. RDL 3 x 6. Lateral lunge 3 x 8 per side. Woodchopper 3 x 10 per side. External rotation 3 x 12. Pull-ups 3 x 6. Copenhagen 3 x 20 s.",
            "minutes": 55
          },
          {
            "key": "conditioning",
            "label": "Match conditioning day",
            "sessionType": "cardio",
            "focus": "Short hard efforts with short rests, like a long rally followed by 20 seconds.",
            "exercises": [
              "shuttle-runs",
              "agility-t-test",
              "hiit-session",
              "lateral-shuffle",
              "jump-rope-alternate"
            ],
            "prescription": "T-test 4 reps. Shuttles 2 x 8 x 10 m out and back, 20 s rest. Then 10 min of 15 s hard, 20 s easy. Shuffle 4 x 20 s. Rope 2 x 2 min.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 6
        },
        "benchmarks": [
          "Complete 6 tennis matches of at least two sets",
          "Complete 6 padel matches, holding the net position with your partner",
          "Name your plan before a match and say afterwards whether you followed it",
          "Keep your first-serve percentage above 50 in a match"
        ],
        "coachNote": "Most points at this level end in an error, not a winner. Make the opponent hit one more ball, serve to the weaker side, and in padel win the net with the lob rather than with power."
      },
      {
        "key": "s5",
        "name": "Competitive play",
        "aim": "You enter tournaments or league matches in padel, tennis or both, prepare physically for back-to-back matches, and manage your arm through a season.",
        "weeks": 12,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "competition",
            "label": "Competition day",
            "sessionType": "sport",
            "focus": "A league or tournament match in tennis or padel, with a full warm-up.",
            "exercises": [
              "sport-warmup",
              "tennis-singles-match",
              "padel-match",
              "static-stretch-routine"
            ],
            "prescription": "20 min warm-up with progressive serves and overheads. Play one competitive match, tennis or padel. 10 min easy stretching afterwards.",
            "minutes": 110
          },
          {
            "key": "technical",
            "label": "Technical day",
            "sessionType": "sport",
            "focus": "Serve, return and net work at match intensity with targets.",
            "exercises": [
              "sport-warmup",
              "tennis-serve-practice",
              "tennis-return-of-serve",
              "tennis-volley-net-play",
              "tennis-overhead-smash",
              "sport-rally-drill"
            ],
            "prescription": "Serves 60 balls to targets, mix first and second. Returns 40. Volleys 15 min. Overheads 30. Rally drill 20 min at match pace. Cap overheads and serves at 100.",
            "minutes": 85
          },
          {
            "key": "padel",
            "label": "Padel specific day",
            "sessionType": "sport",
            "focus": "Glass defence, overhead variety and net transitions with your partner.",
            "exercises": [
              "sport-warmup",
              "padel-glass-rebounds",
              "padel-bandeja-vibora",
              "padel-lob-net-transition",
              "padel-match"
            ],
            "prescription": "Double-glass rebounds 15 min. Bandeja and vibora 30 balls each to targets. Lob and net transition 15 min. One practice set with your regular partner.",
            "minutes": 85
          },
          {
            "key": "strength",
            "label": "Strength and arm care day",
            "sessionType": "strength",
            "focus": "In-season strength with shoulder, elbow and hamstring protection.",
            "exercises": [
              "trap-bar-deadlift",
              "bulgarian-split-squat",
              "landmine-press",
              "medicine-ball-rotational-throw",
              "face-pull",
              "cable-external-rotation",
              "db-reverse-wrist-curl"
            ],
            "prescription": "Deadlift 3 x 4. Split squat 2 x 6 per leg. Landmine press 3 x 6. Throw 3 x 5 per side. Face pull 3 x 15. External rotation 3 x 12. Reverse wrist curl 3 x 15 slow.",
            "minutes": 50
          },
          {
            "key": "conditioning",
            "label": "Speed and conditioning day",
            "sessionType": "cardio",
            "focus": "Court speed plus intervals so the third set feels like the first.",
            "exercises": [
              "acceleration-starts",
              "pro-agility-5-10-5",
              "lateral-shuffle",
              "tabata-intervals",
              "thirty-fifteen-ift"
            ],
            "prescription": "Starts 6 x 10 m. 5-10-5 shuttle 5 reps. Shuffle 4 x 15 s. Two 4-min blocks of 20 s hard, 10 s easy, 4 min between. Swap for the 30-15 test monthly.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 48,
          "weeks": 10
        },
        "benchmarks": [
          "Play at least 8 competitive matches in a league or tournament",
          "Play two matches in one weekend and recover for training by midweek",
          "Keep one strength session every week of the season",
          "Finish matches with no elbow or shoulder pain the next day"
        ],
        "coachNote": "Competition exposes the second serve and the legs. Train both all season. If the elbow or shoulder starts to complain, cut serve and smash volume first, not the strength work."
      }
    ]
  },
  {
    "key": "path-runner",
    "name": "Become a distance runner",
    "become": "Distance runner",
    "discipline": "endurance",
    "tagline": "From run/walk intervals to a marathon build, one patient block of mileage at a time.",
    "whoFor": "Anyone who can walk briskly for 30 minutes and wants to run far. No running background needed; returning runners can repeat stage 1 quickly and move on.",
    "honesty": "The app can plan and track your running but cannot watch your stride, fit your shoes or diagnose pain. A running club or coach helps with pacing and form, and a physio is the right call for pain that lasts beyond a week.",
    "safety": "Most running injuries come from adding distance too fast. Keep easy days truly easy, raise weekly volume by about 10 percent at most, and stop for sharp or one-sided pain. Drink and slow down in heat.",
    "icon": "cardio.marathon",
    "accent": "#D9573B",
    "stages": [
      {
        "key": "s1",
        "name": "Run/walk to 5 km",
        "aim": "Jog 5 km without walking breaks at a pace where you could still talk in short sentences, three times a week, without sore shins or knees.",
        "weeks": 10,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "run-walk",
            "label": "Run/walk intervals",
            "sessionType": "outdoor",
            "focus": "Build continuous running through short jog and walk repeats",
            "exercises": [
              "brisk-walk",
              "run-walk-intervals",
              "wall-calf-stretch"
            ],
            "prescription": "5 min brisk walk, then 8 x (1 min jog / 90 s walk) in week 1. Lengthen the jogs each week until you run 25 min non-stop by week 8. Calf stretch to finish.",
            "minutes": 35
          },
          {
            "key": "base-strength",
            "label": "Bodyweight strength",
            "sessionType": "calisthenics",
            "focus": "Legs, hips and trunk strong enough to absorb running impact",
            "exercises": [
              "bodyweight-squat",
              "glute-bridge",
              "calf-raise-step",
              "bodyweight-reverse-lunge",
              "plank",
              "bird-dog"
            ],
            "prescription": "3 rounds: 12 squats, 12 bridges, 15 calf raises, 8 lunges per leg, 30 s plank, 8 bird-dogs per side. Rest 60 s between rounds.",
            "minutes": 30
          },
          {
            "key": "long-run-walk",
            "label": "Longer run/walk",
            "sessionType": "outdoor",
            "focus": "The longest outing of the week, always at talking pace",
            "exercises": [
              "brisk-walk",
              "run-walk-intervals",
              "easy-run"
            ],
            "prescription": "5 min walk, then run/walk for 30-45 min total. From week 8 replace the intervals with one continuous easy run, building to 5 km.",
            "minutes": 45
          },
          {
            "key": "mobility",
            "label": "Mobility and recovery",
            "sessionType": "mindbody",
            "focus": "Ankles, hips and calves kept loose between running days",
            "exercises": [
              "leg-swings",
              "ankle-mobility",
              "hip-mobility",
              "standing-quad-stretch"
            ],
            "prescription": "10 leg swings per leg each direction, 5 min ankle routine, 8 min hip routine, 2 x 30 s quad stretch per side. Optional fourth day.",
            "minutes": 20
          }
        ],
        "gate": {
          "sessions": 24,
          "weeks": 8,
          "longestRunKm": 5
        },
        "benchmarks": [
          "Run 30 minutes continuously without stopping to walk",
          "Finish a 5 km run and feel you could have gone a little further",
          "Hold a plank for 45 seconds and do 15 single-leg calf raises per side"
        ],
        "coachNote": "Go slower than feels necessary. If you cannot speak a full sentence you are running too fast, and speed is the main reason beginners stop in week three."
      },
      {
        "key": "s2",
        "name": "10 km with strides",
        "aim": "Run 10 km continuously, hold four runs a week for a month, and run relaxed 20-second strides with good posture.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "easy-strides",
            "label": "Easy run and strides",
            "sessionType": "outdoor",
            "focus": "Aerobic running plus short fast accelerations for form",
            "exercises": [
              "easy-run",
              "strides",
              "leg-swings"
            ],
            "prescription": "Leg swings, then 5-7 km easy. Finish with 4-6 x 20 s strides building to fast but relaxed, walking back fully between each.",
            "minutes": 50
          },
          {
            "key": "gym-strength",
            "label": "Runner strength",
            "sessionType": "strength",
            "focus": "Loaded single-leg and hip work to protect knees and Achilles",
            "exercises": [
              "goblet-squat",
              "db-romanian-deadlift",
              "step-up",
              "db-standing-calf-raise",
              "side-plank"
            ],
            "prescription": "3 x 10 goblet squat, 3 x 10 Romanian deadlift, 3 x 8 step-ups per leg, 3 x 15 calf raises, 3 x 30 s side plank per side. Rest 90 s.",
            "minutes": 40
          },
          {
            "key": "fartlek",
            "label": "Fartlek day",
            "sessionType": "outdoor",
            "focus": "First taste of faster running, by feel rather than by the clock",
            "exercises": [
              "easy-run",
              "fartlek-run",
              "wall-calf-stretch"
            ],
            "prescription": "10 min easy, then 6-8 x (1 min brisk / 2 min easy jog), 10 min easy to finish. Brisk means controlled, not a sprint.",
            "minutes": 45
          },
          {
            "key": "long-run",
            "label": "Long run",
            "sessionType": "outdoor",
            "focus": "Extend the long run by about 1 km a week towards 10 km",
            "exercises": [
              "long-run",
              "brisk-walk",
              "foam-rolling"
            ],
            "prescription": "Start at 6 km and add 1 km per week up to 10-11 km, all at talking pace. 5 min walk to cool down, then 5-10 min foam rolling.",
            "minutes": 75
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6,
          "longestRunKm": 10
        },
        "benchmarks": [
          "Run 10 km without stopping at an easy effort",
          "Hold 20-25 km per week for three weeks in a row without pain",
          "Complete 6 strides with the last as smooth as the first"
        ],
        "coachNote": "Strides teach you to run fast while relaxed. Tall posture, quick feet, loose shoulders. They are not sprints and should never leave you out of breath for long."
      },
      {
        "key": "s3",
        "name": "Half-marathon base",
        "aim": "Run 16 km as a long run, hold 20 minutes at tempo effort, and sustain 35-45 km a week across four or five runs.",
        "weeks": 10,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "tempo",
            "label": "Tempo run",
            "sessionType": "outdoor",
            "focus": "Comfortably hard running at about one-hour race effort",
            "exercises": [
              "easy-run",
              "tempo-run",
              "strides"
            ],
            "prescription": "15 min easy, then 2 x 10 min at tempo with 3 min jog between, building to 1 x 20-25 min. 10 min easy and 4 strides to finish.",
            "minutes": 60
          },
          {
            "key": "hills",
            "label": "Hill repeats",
            "sessionType": "outdoor",
            "focus": "Leg strength and running economy on a moderate slope",
            "exercises": [
              "easy-run",
              "hill-repeats",
              "recovery-run"
            ],
            "prescription": "15 min easy, 6-10 x 60 s uphill at hard but even effort, jog down to recover, then 10 min very easy.",
            "minutes": 55
          },
          {
            "key": "strength",
            "label": "Strength day",
            "sessionType": "strength",
            "focus": "Heavier lower-body strength with trunk stability",
            "exercises": [
              "trap-bar-deadlift",
              "bulgarian-split-squat",
              "single-leg-db-deadlift",
              "standing-calf-machine",
              "pallof-press",
              "copenhagen-plank"
            ],
            "prescription": "3 x 6 deadlift, 3 x 8 split squat per leg, 3 x 8 single-leg deadlift, 3 x 12 calf raise, 3 x 10 Pallof press per side, 2 x 20 s Copenhagen plank.",
            "minutes": 50
          },
          {
            "key": "long-run",
            "label": "Long run",
            "sessionType": "outdoor",
            "focus": "Build the long run from 11 km to 16-18 km",
            "exercises": [
              "long-run",
              "progression-run",
              "static-stretch-routine"
            ],
            "prescription": "12-18 km easy. Every second week run the last 3 km as a progression, a little quicker each km. 10 min of stretching after.",
            "minutes": 110
          },
          {
            "key": "recovery",
            "label": "Recovery and mobility",
            "sessionType": "mindbody",
            "focus": "Very easy jogging and tissue care to absorb the week",
            "exercises": [
              "recovery-run",
              "hip-mobility",
              "couch-stretch",
              "foam-rolling"
            ],
            "prescription": "20-30 min recovery jog slower than easy pace, then 8 min hip routine, 2 x 45 s couch stretch per side and 10 min foam rolling.",
            "minutes": 50
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 8,
          "longestRunKm": 16
        },
        "benchmarks": [
          "Run 16 km at easy pace and recover within two days",
          "Hold tempo effort for 20 minutes without slowing in the second half",
          "Deadlift roughly your own bodyweight for 6 clean reps"
        ],
        "coachNote": "Tempo is controlled discomfort, not a race. If you cannot finish the last repetition at the same pace as the first, you started too fast."
      },
      {
        "key": "s4",
        "name": "Marathon build",
        "aim": "Run 26 km as a long run, hold 55-70 km a week across five runs, and handle one interval and one tempo session weekly.",
        "weeks": 12,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "intervals",
            "label": "Track intervals",
            "sessionType": "outdoor",
            "focus": "Repeats at 5-10 km race effort to raise aerobic ceiling",
            "exercises": [
              "easy-run",
              "track-intervals",
              "strides"
            ],
            "prescription": "15 min easy and 4 strides, then 5-6 x 1000 m at 10 km effort with 2-3 min jog, or 8 x 800 m. 10 min easy to cool down.",
            "minutes": 70
          },
          {
            "key": "medium-long",
            "label": "Medium-long run",
            "sessionType": "outdoor",
            "focus": "A second longer aerobic run in the middle of the week",
            "exercises": [
              "easy-run",
              "progression-run",
              "leg-swings"
            ],
            "prescription": "Leg swings, then 14-18 km. First two-thirds easy, last third as a steady progression to marathon effort.",
            "minutes": 95
          },
          {
            "key": "tempo",
            "label": "Tempo and threshold",
            "sessionType": "outdoor",
            "focus": "Longer threshold blocks, finishing with relaxed jogging",
            "exercises": [
              "easy-run",
              "tempo-run",
              "recovery-run"
            ],
            "prescription": "15 min easy, 3 x 12 min at tempo with 3 min jog, or 30 min continuous. 10-15 min recovery jog to finish.",
            "minutes": 75
          },
          {
            "key": "strength",
            "label": "Strength maintenance",
            "sessionType": "strength",
            "focus": "Keep strength with low volume so legs stay fresh for long runs",
            "exercises": [
              "back-squat",
              "romanian-deadlift",
              "walking-lunge",
              "standing-calf-machine",
              "nordic-curl",
              "dead-bug"
            ],
            "prescription": "3 x 5 squat, 3 x 6 Romanian deadlift, 2 x 10 walking lunge per leg, 3 x 12 calf raise, 2 x 5 Nordic curl, 3 x 10 dead bug.",
            "minutes": 45
          },
          {
            "key": "long-run",
            "label": "Long run",
            "sessionType": "outdoor",
            "focus": "The key session: 20 km rising to 26-28 km with fuel practice",
            "exercises": [
              "long-run",
              "marathon-training",
              "static-stretch-routine"
            ],
            "prescription": "20-28 km easy, adding 2 km most weeks with a cut-back every fourth week. Practise drinking and eating every 30-40 min. Stretch after.",
            "minutes": 120
          }
        ],
        "gate": {
          "sessions": 48,
          "weeks": 10,
          "longestRunKm": 26
        },
        "benchmarks": [
          "Run 26 km and be able to run easy again two days later",
          "Hold 55 km or more per week for four consecutive weeks",
          "Take fluid and carbohydrate on the run without stomach trouble"
        ],
        "coachNote": "The long run and total weekly volume build the marathon. When tired, drop the interval session first and never the long run or the easy days."
      },
      {
        "key": "s5",
        "name": "Marathon specific and taper",
        "aim": "Run 32 km with a section at goal pace, race a tune-up half, then taper for three weeks and start a marathon rested.",
        "weeks": 10,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "marathon-pace",
            "label": "Marathon-pace long run",
            "sessionType": "outdoor",
            "focus": "Long runs with blocks at goal marathon pace",
            "exercises": [
              "long-run",
              "marathon-training",
              "strides"
            ],
            "prescription": "28-32 km with 3 x 5 km or 12-16 km at goal pace inside it. Peak three weeks out, then cut the long run to 20, 16 and 10 km during taper.",
            "minutes": 120
          },
          {
            "key": "tune-up",
            "label": "Tempo or tune-up race",
            "sessionType": "outdoor",
            "focus": "Threshold work, or a 10 km or half-marathon race as rehearsal",
            "exercises": [
              "easy-run",
              "tempo-run",
              "road-race"
            ],
            "prescription": "Most weeks: 15 min easy, 2 x 20 min at tempo, 10 min easy. Once in the block replace it with a tune-up race in full race kit.",
            "minutes": 80
          },
          {
            "key": "easy-strides",
            "label": "Easy run and strides",
            "sessionType": "outdoor",
            "focus": "Aerobic volume that keeps legs turning over",
            "exercises": [
              "easy-run",
              "strides",
              "recovery-run"
            ],
            "prescription": "10-14 km easy with 6 x 20 s strides. In taper weeks cut the distance by a third but keep the strides.",
            "minutes": 70
          },
          {
            "key": "strength",
            "label": "Light strength",
            "sessionType": "strength",
            "focus": "Minimal strength to hold what you built; stop 10 days out",
            "exercises": [
              "goblet-squat",
              "db-romanian-deadlift",
              "step-up",
              "db-standing-calf-raise",
              "side-plank"
            ],
            "prescription": "2 x 8 each at moderate load, 2 x 30 s side plank per side. No new exercises and no sessions in the last 10 days before the race.",
            "minutes": 30
          },
          {
            "key": "recovery",
            "label": "Recovery and mobility",
            "sessionType": "mindbody",
            "focus": "Short jog and mobility to arrive at race day fresh",
            "exercises": [
              "recovery-run",
              "hip-mobility",
              "hamstring-routine",
              "foam-rolling"
            ],
            "prescription": "20-30 min very easy jog, 8 min hip routine, 8 min hamstring routine, 10 min foam rolling. Keep this day in every taper week.",
            "minutes": 50
          }
        ],
        "gate": {
          "sessions": 40,
          "weeks": 8,
          "longestRunKm": 32
        },
        "benchmarks": [
          "Run 32 km with at least 12 km at goal marathon pace",
          "Race a half-marathon and recover inside a week",
          "Have a tested plan for shoes, kit, pacing and fuelling on race day",
          "Cut volume in the taper without adding extra hard sessions"
        ],
        "coachNote": "Nothing you do in the last three weeks makes you fitter, but plenty can make you tired. Trust the taper, keep a little pace work and sleep more."
      }
    ]
  },
  {
    "key": "path-sprinter",
    "name": "Become a sprinter",
    "become": "Sprinter",
    "discipline": "endurance",
    "tagline": "Drills, acceleration, top speed and speed endurance, built on strength and full recoveries.",
    "whoFor": "Healthy adults who want to run 60 m to 400 m fast. You should be able to jog 15 minutes and squat your bodyweight pain-free before stage 2.",
    "honesty": "The app cannot see your mechanics or time you accurately. Block settings, drill quality and race tactics need a sprint coach and a track club. Hand timing on your own is only a rough guide.",
    "safety": "Hamstring strains are the main risk. Warm up for 20 minutes or more, never sprint flat out when cold or tired, keep Nordic curls in every stage, and stop the session at the first tightness.",
    "icon": "cardio.interval",
    "accent": "#E0A526",
    "stages": [
      {
        "key": "s1",
        "name": "General prep and drills",
        "aim": "Perform A-skips and B-skips with rhythm, run relaxed strides at 80 percent, and complete basic strength and landing work pain-free.",
        "weeks": 8,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "drills",
            "label": "Drills and strides",
            "sessionType": "sport",
            "focus": "Sprint posture, front-side mechanics and relaxed accelerations",
            "exercises": [
              "sport-warmup",
              "athletics-a-skips",
              "athletics-b-skips",
              "athletics-hurdle-mobility",
              "strides"
            ],
            "prescription": "15 min warm-up, 3 x 20 m A-skips, 3 x 20 m B-skips, 2 x 8 hurdle walkovers, then 6 x 60 m strides at 75-80 percent, walk back recovery.",
            "minutes": 50
          },
          {
            "key": "strength",
            "label": "General strength",
            "sessionType": "strength",
            "focus": "Learn the main lifts with light loads and full range",
            "exercises": [
              "goblet-squat",
              "db-romanian-deadlift",
              "db-reverse-lunge",
              "db-hip-thrust",
              "nordic-negative",
              "plank"
            ],
            "prescription": "3 x 10 goblet squat, 3 x 10 Romanian deadlift, 3 x 8 reverse lunge per leg, 3 x 12 hip thrust, 2 x 4 slow Nordic negatives, 3 x 40 s plank.",
            "minutes": 50
          },
          {
            "key": "tempo",
            "label": "Extensive tempo",
            "sessionType": "outdoor",
            "focus": "Easy aerobic running on grass to build work capacity",
            "exercises": [
              "easy-run",
              "strides",
              "leg-swings"
            ],
            "prescription": "Leg swings, 10 min easy jog, then 8-10 x 100 m at 65-70 percent on grass with 60 s walk between. Should feel smooth, never strained.",
            "minutes": 40
          },
          {
            "key": "landing",
            "label": "Jump and landing prep",
            "sessionType": "calisthenics",
            "focus": "Low-level plyometrics and ankle stiffness",
            "exercises": [
              "pogo-hops",
              "deceleration-landing-mechanics",
              "broad-jump",
              "single-leg-calf-raise",
              "glute-bridge-march"
            ],
            "prescription": "3 x 15 pogo hops, 3 x 5 landing drills, 3 x 4 broad jumps with a stuck landing, 3 x 12 single-leg calf raise, 2 x 10 bridge march.",
            "minutes": 35
          }
        ],
        "gate": {
          "sessions": 19,
          "weeks": 6
        },
        "benchmarks": [
          "A-skips and B-skips over 20 m without losing posture or rhythm",
          "Six 60 m strides at 80 percent with no tightness the next day",
          "Goblet squat a third of your bodyweight for 10 reps to full depth"
        ],
        "coachNote": "Drills are only useful done well. Stay tall, hips high, foot landing under the hip. Ten good metres beat forty sloppy ones."
      },
      {
        "key": "s2",
        "name": "Acceleration and blocks",
        "aim": "Drive out of a three-point or block start and accelerate hard over 30 m with a forward lean and full-force pushes.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "acceleration",
            "label": "Acceleration day",
            "sessionType": "sport",
            "focus": "First 30 m: projection, shin angles and powerful pushes",
            "exercises": [
              "sport-warmup",
              "athletics-a-skips",
              "acceleration-starts",
              "athletics-acceleration-runs-30m",
              "athletics-block-starts"
            ],
            "prescription": "20 min warm-up with skips, 4 x 10 m and 4 x 20 m starts, 4 x 30 m accelerations, then 4 block starts over 10 m. Rest 1 min per 10 m sprinted.",
            "minutes": 70
          },
          {
            "key": "max-strength",
            "label": "Max strength",
            "sessionType": "strength",
            "focus": "Heavy lower-body strength for force into the ground",
            "exercises": [
              "back-squat",
              "trap-bar-deadlift",
              "barbell-hip-thrust",
              "bulgarian-split-squat",
              "nordic-curl",
              "hanging-knee-raise"
            ],
            "prescription": "4 x 5 squat, 3 x 5 trap bar deadlift, 3 x 8 hip thrust, 3 x 6 split squat per leg, 3 x 5 Nordic curl, 3 x 10 knee raise. Rest 2-3 min on main lifts.",
            "minutes": 65
          },
          {
            "key": "hills",
            "label": "Hill and sled sprints",
            "sessionType": "outdoor",
            "focus": "Resisted acceleration on a slope",
            "exercises": [
              "easy-run",
              "hill-sprints",
              "strides",
              "sled-push"
            ],
            "prescription": "10 min easy and drills, 8 x 20-30 m hill sprints with walk-down plus 90 s rest, 4 x 15 m sled push if available, then 3 easy strides.",
            "minutes": 50
          },
          {
            "key": "power",
            "label": "Power and throws",
            "sessionType": "strength",
            "focus": "Explosive triple extension with throws and light Olympic lifts",
            "exercises": [
              "hang-power-clean",
              "medicine-ball-slam",
              "athletics-med-ball-underhand-throw",
              "kettlebell-swing",
              "pallof-press"
            ],
            "prescription": "5 x 3 hang power clean, 3 x 6 ball slams, 3 x 5 underhand forward throws, 3 x 10 swings, 3 x 10 Pallof press per side. Full speed every rep.",
            "minutes": 50
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6
        },
        "benchmarks": [
          "Hold a forward body angle for the first 10 m without popping upright",
          "Set your blocks and start consistently on a clap or whistle",
          "Back squat 1.25 times bodyweight for 5 reps to full depth",
          "Five Nordic curls under control, lowering for at least 3 seconds"
        ],
        "coachNote": "Acceleration is pushing, not reaching. Rest fully between sprints: if the rep is slower than the last one, the session is finished."
      },
      {
        "key": "s3",
        "name": "Max velocity",
        "aim": "Reach and hold top speed upright and relaxed through flying 30 m sprints and wicket runs, without overstriding.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "max-velocity",
            "label": "Max velocity day",
            "sessionType": "sport",
            "focus": "Upright sprinting at top speed with full recovery",
            "exercises": [
              "sport-warmup",
              "athletics-a-skips",
              "athletics-wicket-runs",
              "athletics-flying-30s",
              "athletics-hurdle-mobility"
            ],
            "prescription": "20 min warm-up and skips, 6 x wicket runs, then 4-5 x flying 30 m with a 30 m build-up, 6-8 min rest between. Hurdle walkovers to finish.",
            "minutes": 75
          },
          {
            "key": "acceleration",
            "label": "Acceleration and blocks",
            "sessionType": "sport",
            "focus": "Keep starts sharp and extend them to 40 m",
            "exercises": [
              "sport-warmup",
              "athletics-b-skips",
              "athletics-block-starts",
              "athletics-acceleration-runs-30m",
              "athletics-bounding"
            ],
            "prescription": "Warm-up and skips, 6 block starts over 20 m, 3 x 30 m and 2 x 40 m accelerations, then 3 x 30 m bounding. Rest 3-5 min between sprints.",
            "minutes": 65
          },
          {
            "key": "strength-power",
            "label": "Strength and power",
            "sessionType": "strength",
            "focus": "Heavy lifts at lower volume, plus Olympic lift variations",
            "exercises": [
              "power-clean",
              "front-squat",
              "romanian-deadlift",
              "barbell-hip-thrust",
              "weighted-nordic-curl",
              "hanging-leg-raise"
            ],
            "prescription": "5 x 2 power clean, 4 x 3 front squat, 3 x 6 Romanian deadlift, 3 x 6 hip thrust, 3 x 5 Nordic curl, 3 x 8 leg raise.",
            "minutes": 60
          },
          {
            "key": "plyometrics",
            "label": "Plyometrics",
            "sessionType": "calisthenics",
            "focus": "Reactive strength and stiff ground contacts",
            "exercises": [
              "pogo-hops",
              "depth-jump",
              "broad-jump",
              "tuck-jump",
              "eccentric-heel-drop"
            ],
            "prescription": "3 x 20 pogo hops, 4 x 4 depth jumps from 30-40 cm, 4 x 3 broad jumps, 3 x 5 tuck jumps, 2 x 12 heel drops. About 60-80 contacts in total.",
            "minutes": 40
          },
          {
            "key": "tempo",
            "label": "Tempo and mobility",
            "sessionType": "outdoor",
            "focus": "Easy running and mobility to recover between speed days",
            "exercises": [
              "easy-run",
              "strides",
              "recovery-run",
              "hamstring-nerve-floss"
            ],
            "prescription": "5 min easy jog, 8 x 100 m at 70 percent on grass with 60 s walk, 5 min recovery jog, then 2 x 10 hamstring floss per leg.",
            "minutes": 35
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6
        },
        "benchmarks": [
          "Four flying 30 m sprints within 3 percent of your best on the day",
          "Wicket runs with even rhythm and the foot landing under the hip",
          "Power clean 0.9 times bodyweight for 2 reps"
        ],
        "coachNote": "Top speed comes from relaxation. Loose jaw, loose hands, fast feet. Straining makes you slower and is how hamstrings get pulled."
      },
      {
        "key": "s4",
        "name": "Speed endurance",
        "aim": "Hold form through 150 m reps and 400 m race-pace work, run the bend well, and recover between hard sessions.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "speed-endurance",
            "label": "Speed endurance",
            "sessionType": "sport",
            "focus": "Long sprints at 90-95 percent with long recoveries",
            "exercises": [
              "sport-warmup",
              "athletics-a-skips",
              "athletics-flying-30s",
              "athletics-speed-endurance-150s",
              "athletics-bend-running"
            ],
            "prescription": "Full warm-up, 2 x flying 30 m, then 3-4 x 150 m at 90-95 percent with 8-10 min rest, or 3 x 200 m on the bend. Stop when form breaks.",
            "minutes": 80
          },
          {
            "key": "race-pace",
            "label": "400 m pace work",
            "sessionType": "sport",
            "focus": "Rhythm and lactate tolerance at 400 m race pace",
            "exercises": [
              "sport-warmup",
              "athletics-b-skips",
              "athletics-400m-race-pace-reps",
              "athletics-bend-running",
              "athletics-hurdle-mobility"
            ],
            "prescription": "Warm-up, then 2 sets of 3 x 200 m at 400 m goal pace, 2 min between reps, 8 min between sets. Walkovers to cool down.",
            "minutes": 70
          },
          {
            "key": "speed",
            "label": "Speed maintenance",
            "sessionType": "sport",
            "focus": "Short, fast work so top speed is not lost",
            "exercises": [
              "sport-warmup",
              "athletics-block-starts",
              "athletics-acceleration-runs-30m",
              "athletics-wicket-runs",
              "athletics-bounding"
            ],
            "prescription": "4 block starts over 30 m, 3 x 30 m accelerations, 4 wicket runs, 2 x 30 m bounding. Full recovery; low volume and high quality.",
            "minutes": 60
          },
          {
            "key": "strength",
            "label": "Strength maintenance",
            "sessionType": "strength",
            "focus": "Hold strength with reduced volume",
            "exercises": [
              "trap-bar-deadlift",
              "hang-power-clean",
              "barbell-split-squat",
              "barbell-hip-thrust",
              "nordic-curl",
              "copenhagen-plank"
            ],
            "prescription": "3 x 3 trap bar deadlift, 4 x 2 hang power clean, 2 x 6 split squat per leg, 3 x 6 hip thrust, 2 x 5 Nordic curl, 2 x 20 s Copenhagen plank.",
            "minutes": 50
          },
          {
            "key": "recovery",
            "label": "Recovery and mobility",
            "sessionType": "mindbody",
            "focus": "Restore range after lactic sessions",
            "exercises": [
              "hip-mobility",
              "hamstring-routine",
              "couch-stretch",
              "foam-rolling",
              "easy-run"
            ],
            "prescription": "10 min easy jog, 8 min hip routine, 8 min hamstring routine, 2 x 45 s couch stretch per side, 10 min foam rolling.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6
        },
        "benchmarks": [
          "Three 150 m reps at 95 percent with under 5 percent drop-off",
          "Run a 200 m bend in lane without drifting wide",
          "Hold posture and arm action in the last 50 m of a 300 m effort"
        ],
        "coachNote": "These sessions hurt and need 48 hours before the next fast day. Long rests are part of the work, not laziness."
      },
      {
        "key": "s5",
        "name": "Competition phase",
        "aim": "Race 100 m, 200 m or 400 m at club meets with a rehearsed warm-up, consistent starts and training volume cut to stay sharp.",
        "weeks": 10,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "race-model",
            "label": "Race modelling",
            "sessionType": "sport",
            "focus": "Rehearse race segments at full speed from blocks",
            "exercises": [
              "sport-warmup",
              "athletics-a-skips",
              "athletics-block-starts",
              "athletics-flying-30s",
              "athletics-relay-baton-exchange"
            ],
            "prescription": "Race-day warm-up, 3 block starts over 30 m, 2 x 60 m from blocks, 2 x flying 30 m. 8 min rests. Add 4-6 baton exchanges if you run relays.",
            "minutes": 70
          },
          {
            "key": "special-endurance",
            "label": "Special endurance",
            "sessionType": "sport",
            "focus": "One hard long-sprint session in non-race weeks",
            "exercises": [
              "sport-warmup",
              "athletics-speed-endurance-150s",
              "athletics-400m-race-pace-reps",
              "athletics-bend-running"
            ],
            "prescription": "2 x 150 m at 95 percent with 10 min rest, then 1 x 300 m at 400 m pace, or 2 x 200 m on the bend. Skip this session in race week.",
            "minutes": 65
          },
          {
            "key": "meet",
            "label": "Race day or time trial",
            "sessionType": "sport",
            "focus": "Compete, or run a timed trial under race conditions",
            "exercises": [
              "sport-warmup",
              "athletics-wicket-runs",
              "athletics-block-starts",
              "track-field",
              "static-stretch-routine"
            ],
            "prescription": "45 min warm-up finishing 15 min before the start, 2 practice starts, then race 1-2 events. Easy jog and stretching after.",
            "minutes": 120
          },
          {
            "key": "power",
            "label": "Power maintenance",
            "sessionType": "strength",
            "focus": "Short, fast lifting that leaves no fatigue",
            "exercises": [
              "power-clean",
              "box-squat",
              "barbell-hip-thrust",
              "medicine-ball-rotational-throw",
              "nordic-curl"
            ],
            "prescription": "4 x 2 power clean, 3 x 3 box squat at about 80 percent, 2 x 5 hip thrust, 3 x 5 throws per side, 2 x 4 Nordic curl. No lifting within 3 days of a race.",
            "minutes": 40
          },
          {
            "key": "recovery",
            "label": "Recovery and mobility",
            "sessionType": "mindbody",
            "focus": "Keep range and freshness between meets",
            "exercises": [
              "dynamic-warmup",
              "hip-mobility",
              "hamstring-nerve-floss",
              "foam-rolling"
            ],
            "prescription": "10 min dynamic warm-up routine, 8 min hip mobility, 2 x 10 nerve floss per leg, 10 min foam rolling. The day after each race.",
            "minutes": 30
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 8
        },
        "benchmarks": [
          "Race at least three times and record an official time",
          "Repeat the same warm-up routine before every race",
          "React to the gun from blocks without false starting",
          "Finish the block with no hamstring or Achilles problems"
        ],
        "coachNote": "In season you are sharpening, not building. Do less than you think you need, and arrive at the start line fresh."
      }
    ]
  },
  {
    "key": "path-swimmer",
    "name": "Become a swimmer",
    "become": "Swimmer",
    "discipline": "endurance",
    "tagline": "From first relaxed lengths of freestyle to four strokes, threshold sets and the open sea.",
    "whoFor": "Adults who can stand in the shallow end without fear and want to swim properly. Non-swimmers should take lessons first; this path starts at floating and breathing.",
    "honesty": "Stroke technique is hard to feel and impossible for the app to see. A swim teacher or masters squad coach on the pool deck will fix in one session what takes months alone. Starts and tumble turns need supervised teaching.",
    "safety": "Never swim alone in open water, whatever your level. Go with a partner and a tow float, stay along the shore, check currents and weather, and leave cold water early. Never hyperventilate before breath holds.",
    "icon": "cardio.swimming",
    "accent": "#2F9BD6",
    "stages": [
      {
        "key": "s1",
        "name": "Water confidence and freestyle",
        "aim": "Swim 200 m of freestyle without stopping, breathing to the side every two or three strokes, and tread water for two minutes.",
        "weeks": 8,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "technique",
            "label": "Freestyle technique",
            "sessionType": "cardio",
            "focus": "Body position, exhaling under water and side breathing",
            "exercises": [
              "swim-drills",
              "swim-kick-set",
              "swim-freestyle",
              "treading-water"
            ],
            "prescription": "200 m of drills in 25s (push and glide, side kick, catch-up), 4 x 25 m kick with a board, 6-8 x 25 m freestyle with 30 s rest, 2 x 60 s treading water.",
            "minutes": 40
          },
          {
            "key": "lengths",
            "label": "Easy lengths",
            "sessionType": "cardio",
            "focus": "Relaxed continuous swimming, building length by length",
            "exercises": [
              "swim-freestyle",
              "swim-backstroke",
              "swim-sculling-drills",
              "treading-water"
            ],
            "prescription": "8 x 50 m freestyle with 30-45 s rest, building towards 4 x 100 m. 4 x 25 m easy backstroke, 4 x 25 m sculling, 2 min treading water.",
            "minutes": 40
          },
          {
            "key": "dryland",
            "label": "Dryland basics",
            "sessionType": "calisthenics",
            "focus": "Shoulder health and a trunk that holds a straight line",
            "exercises": [
              "prone-swimmers",
              "dead-bug",
              "hollow-body-hold",
              "y-raise",
              "scapular-push-up",
              "flutter-kicks"
            ],
            "prescription": "3 rounds: 10 prone swimmers, 10 dead bugs, 20 s hollow hold, 10 Y-raises, 10 scapular push-ups, 20 s flutter kicks. Rest 60 s.",
            "minutes": 25
          },
          {
            "key": "mobility",
            "label": "Shoulder and ankle mobility",
            "sessionType": "mindbody",
            "focus": "Range for a long streamline and a loose kick",
            "exercises": [
              "shoulder-mobility",
              "thoracic-mobility",
              "ankle-mobility",
              "overhead-lat-stretch"
            ],
            "prescription": "8 min shoulder routine, 8 min thoracic routine, 5 min ankle routine, 2 x 40 s lat stretch per side. Optional fourth day.",
            "minutes": 25
          }
        ],
        "gate": {
          "sessions": 19,
          "weeks": 6
        },
        "benchmarks": [
          "Swim 200 m freestyle non-stop without holding the wall",
          "Breathe to the side with one goggle still in the water",
          "Tread water for 2 minutes and float on your back for 1 minute"
        ],
        "coachNote": "Breathe out steadily under water. Almost every beginner who feels out of breath after one length is holding their breath, not unfit."
      },
      {
        "key": "s2",
        "name": "Four strokes",
        "aim": "Swim 50 m each of backstroke and breaststroke, 25 m of butterfly with legal technique, and complete 1500 m in a session.",
        "weeks": 10,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "strokes",
            "label": "Stroke school",
            "sessionType": "cardio",
            "focus": "Backstroke, breaststroke timing and the butterfly body wave",
            "exercises": [
              "swim-drills",
              "swim-backstroke",
              "swim-breaststroke",
              "swim-butterfly",
              "swim-underwater-dolphin-kick"
            ],
            "prescription": "300 m freestyle warm-up, 200 m drills, 4 x 50 m backstroke, 4 x 50 m breaststroke, 6 x 25 m dolphin kick, 4 x 25 m butterfly with long rest.",
            "minutes": 55
          },
          {
            "key": "kick-pull",
            "label": "Kick and pull sets",
            "sessionType": "cardio",
            "focus": "Isolate the legs and the catch to build each half of the stroke",
            "exercises": [
              "swim-freestyle",
              "swim-kick-set",
              "swim-pull-set",
              "swim-sculling-drills"
            ],
            "prescription": "300 m easy, 6 x 50 m kick with a board on 20 s rest, 4 x 25 m sculling, 6 x 100 m pull with a buoy on 20 s rest, 100 m easy.",
            "minutes": 55
          },
          {
            "key": "aerobic",
            "label": "Aerobic freestyle",
            "sessionType": "cardio",
            "focus": "Longer repeats at a steady, repeatable pace",
            "exercises": [
              "swim-freestyle",
              "swim-intervals",
              "swim-backstroke"
            ],
            "prescription": "200 m warm-up, 5 x 200 m freestyle with 30 s rest at even pace, 4 x 50 m backstroke easy, 100 m cool-down.",
            "minutes": 50
          },
          {
            "key": "dryland",
            "label": "Dryland strength",
            "sessionType": "strength",
            "focus": "Pulling strength, rotator cuff and hips",
            "exercises": [
              "lat-pulldown",
              "seated-cable-row",
              "face-pull",
              "db-external-rotation",
              "goblet-squat",
              "plank"
            ],
            "prescription": "3 x 10 pulldown, 3 x 10 row, 3 x 15 face pull, 2 x 12 external rotation per arm, 3 x 10 goblet squat, 3 x 45 s plank.",
            "minutes": 40
          }
        ],
        "gate": {
          "sessions": 24,
          "weeks": 8
        },
        "benchmarks": [
          "Swim a continuous 400 m freestyle at an even, relaxed pace",
          "Swim breaststroke with a glide and the kick finishing before the pull",
          "Complete 25 m of butterfly without the stroke falling apart"
        ],
        "coachNote": "Learn butterfly in short, fresh repeats. Two good strokes and a rest teach more than a struggling length."
      },
      {
        "key": "s3",
        "name": "Turns and threshold",
        "aim": "Tumble turn on every freestyle wall, dive from the side or blocks, and hold your CSS pace through 10 x 100 m.",
        "weeks": 10,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "threshold",
            "label": "CSS threshold set",
            "sessionType": "cardio",
            "focus": "Sustained work at critical swim speed with short rests",
            "exercises": [
              "swim-freestyle",
              "swim-drills",
              "swim-css-threshold-set",
              "swim-backstroke"
            ],
            "prescription": "400 m warm-up with drills, then 8-10 x 100 m at CSS pace on 15-20 s rest, or 5 x 200 m. 200 m easy backstroke to cool down.",
            "minutes": 60
          },
          {
            "key": "skills",
            "label": "Starts and turns",
            "sessionType": "cardio",
            "focus": "Flip turns, streamline off the wall and racing starts",
            "exercises": [
              "swim-starts-and-turns",
              "swim-underwater-dolphin-kick",
              "swim-sprint-25s-50s",
              "swim-freestyle"
            ],
            "prescription": "300 m easy, 15 min of turn practice from mid-pool, 8 x 15 m underwater kick off the wall, 6 dives, 6 x 25 m fast with 45 s rest.",
            "minutes": 55
          },
          {
            "key": "aerobic",
            "label": "Aerobic mixed strokes",
            "sessionType": "cardio",
            "focus": "Volume across all strokes with kick and pull",
            "exercises": [
              "swim-freestyle",
              "swim-kick-set",
              "swim-pull-set",
              "swim-breaststroke",
              "swim-intervals"
            ],
            "prescription": "400 m freestyle, 8 x 50 m kick, 4 x 200 m pull, 4 x 100 m breaststroke, 4 x 100 m freestyle descending. About 2400 m.",
            "minutes": 65
          },
          {
            "key": "dryland",
            "label": "Dryland strength",
            "sessionType": "strength",
            "focus": "Pull-ups, shoulder stability and leg drive for walls",
            "exercises": [
              "band-assisted-pull-up",
              "db-one-arm-row",
              "landmine-press",
              "cable-external-rotation",
              "jump-squat",
              "pallof-press"
            ],
            "prescription": "4 x 6 assisted or full pull-ups, 3 x 10 row per arm, 3 x 8 landmine press, 2 x 15 external rotation, 3 x 6 jump squat, 3 x 10 Pallof press.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 8
        },
        "benchmarks": [
          "Tumble turn at both ends through a 400 m freestyle",
          "Hold the same pace, within 2 seconds, across 10 x 100 m",
          "Dive and streamline past the flags before the first stroke"
        ],
        "coachNote": "Find your CSS pace with a 400 m and 200 m time trial and respect it. Threshold sets work because the pace is even, not because the first rep is fast."
      },
      {
        "key": "s4",
        "name": "IM and sprint sets",
        "aim": "Swim a 200 m individual medley with legal turns, sprint 50 m at full effort, and cover 3000 m in a session.",
        "weeks": 10,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "im",
            "label": "Individual medley",
            "sessionType": "cardio",
            "focus": "All four strokes in order, including the transitions",
            "exercises": [
              "swim-freestyle",
              "swim-im-set",
              "swim-butterfly",
              "swim-breaststroke",
              "swim-starts-and-turns"
            ],
            "prescription": "400 m warm-up, 8 x 100 m IM on 30 s rest, 4 x 50 m butterfly to backstroke, 4 x 50 m breaststroke to freestyle, 10 min IM turns.",
            "minutes": 65
          },
          {
            "key": "sprint",
            "label": "Sprint set",
            "sessionType": "cardio",
            "focus": "Maximum speed with long rest and sharp underwaters",
            "exercises": [
              "swim-drills",
              "swim-underwater-dolphin-kick",
              "swim-sprint-25s-50s",
              "swim-starts-and-turns",
              "swim-freestyle"
            ],
            "prescription": "500 m warm-up with drills, 6 x 15 m underwater kick, 8 x 25 m from a dive at full speed on 90 s rest, 4 x 50 m fast on 3 min, 300 m easy.",
            "minutes": 60
          },
          {
            "key": "threshold",
            "label": "Threshold and pull",
            "sessionType": "cardio",
            "focus": "Longer CSS work to keep the aerobic base",
            "exercises": [
              "swim-freestyle",
              "swim-css-threshold-set",
              "swim-pull-set",
              "swim-kick-set"
            ],
            "prescription": "400 m warm-up, 3 x 400 m at CSS plus 2-3 s per 100 m on 40 s rest, 6 x 100 m pull with paddles, 6 x 50 m kick, 200 m easy.",
            "minutes": 65
          },
          {
            "key": "dryland",
            "label": "Dryland power",
            "sessionType": "strength",
            "focus": "Pulling power and explosive legs for starts",
            "exercises": [
              "lat-pulldown-single-arm",
              "barbell-row",
              "trap-bar-deadlift",
              "medicine-ball-slam",
              "face-pull",
              "ab-wheel-rollout"
            ],
            "prescription": "3 x 8 single-arm pulldown, 3 x 8 row, 3 x 5 trap bar deadlift, 3 x 8 ball slams, 3 x 15 face pull, 3 x 8 rollouts. Rest 2 min on main lifts.",
            "minutes": 50
          },
          {
            "key": "mobility",
            "label": "Shoulder care",
            "sessionType": "mindbody",
            "focus": "Keep shoulders healthy as volume rises",
            "exercises": [
              "shoulder-cars",
              "banded-shoulder-dislocates",
              "sleeper-stretch",
              "open-book-thoracic-rotation",
              "foam-roller-thoracic-extension"
            ],
            "prescription": "2 x 5 shoulder CARs per side, 2 x 12 dislocates, 2 x 40 s sleeper stretch per side, 2 x 8 open books, 2 x 10 thoracic extensions.",
            "minutes": 20
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 8
        },
        "benchmarks": [
          "Swim a 200 m IM with legal strokes and turns throughout",
          "Swim 50 m freestyle from a dive at full effort and record the time",
          "Complete a 3000 m session without shoulder pain"
        ],
        "coachNote": "Sprint sets need real rest. If you shorten the rest it becomes an aerobic set and you never practise swimming fast."
      },
      {
        "key": "s5",
        "name": "Race prep and open water",
        "aim": "Race in a pool gala or masters meet and swim 1500 m in the sea along the shore with a partner, sighting without breaking rhythm.",
        "weeks": 10,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "race-pace",
            "label": "Race-pace set",
            "sessionType": "cardio",
            "focus": "Broken swims at goal race pace, from a dive",
            "exercises": [
              "swim-freestyle",
              "swim-starts-and-turns",
              "swim-sprint-25s-50s",
              "swim-intervals",
              "swim-im-set"
            ],
            "prescription": "600 m warm-up, 4 dives, then 3 x broken 200 m (4 x 50 m on 10 s rest) at goal pace with 4 min between, 4 x 100 m IM easy, 200 m cool-down.",
            "minutes": 65
          },
          {
            "key": "threshold",
            "label": "Threshold endurance",
            "sessionType": "cardio",
            "focus": "Long even-paced sets that carry over to open water",
            "exercises": [
              "swim-freestyle",
              "swim-css-threshold-set",
              "swim-pull-set",
              "swim-drills"
            ],
            "prescription": "400 m warm-up, 15 x 100 m at CSS on 15 s rest or 3 x 500 m, lifting the head to sight twice per length on the last set. 300 m pull, 200 m easy.",
            "minutes": 70
          },
          {
            "key": "open-water",
            "label": "Open-water swim",
            "sessionType": "outdoor",
            "focus": "Sea swimming along the shore with a partner, never alone",
            "exercises": [
              "sea-swim-along-shore",
              "open-water-swim",
              "treading-water"
            ],
            "prescription": "With a partner and a tow float: 5 min acclimatising, then 1000-2000 m parallel to the shore, sighting every 6-8 strokes. 2 min treading water mid-swim.",
            "minutes": 60
          },
          {
            "key": "dryland",
            "label": "Dryland maintenance",
            "sessionType": "strength",
            "focus": "Hold strength at low volume through race season",
            "exercises": [
              "lat-pulldown",
              "seated-cable-row",
              "landmine-press",
              "goblet-squat",
              "band-pull-apart",
              "hollow-rock"
            ],
            "prescription": "3 x 8 pulldown, 3 x 8 row, 3 x 8 landmine press, 3 x 8 goblet squat, 3 x 15 band pull-apart, 3 x 12 hollow rocks.",
            "minutes": 35
          },
          {
            "key": "taper",
            "label": "Taper and sharpen",
            "sessionType": "cardio",
            "focus": "Short, fast and fresh in the last 10 days before a race",
            "exercises": [
              "swim-freestyle",
              "swim-drills",
              "swim-starts-and-turns",
              "swim-sprint-25s-50s"
            ],
            "prescription": "400 m easy, 200 m drills, 4 dives with 15 m breakouts, 4 x 25 m at race speed on 2 min rest, 200 m easy. About half normal volume.",
            "minutes": 40
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 8
        },
        "benchmarks": [
          "Enter and finish a pool race with a legal start and turns",
          "Swim 1500 m in open water with a partner, sighting on a fixed landmark",
          "Know the entry, exit and conditions of your sea swim before getting in"
        ],
        "coachNote": "Open water is a different sport from the pool. Go with someone, stay close to shore, and get out the moment you feel cold or unsure. No swim is worth going alone."
      }
    ]
  },
  {
    "key": "path-hybrid",
    "name": "Become a hybrid athlete",
    "become": "Hybrid athlete",
    "discipline": "endurance",
    "tagline": "Strong and enduring at once: lift, run and finish a fitness race without falling apart.",
    "whoFor": "People who want to lift and run without giving up either, and may want to enter a fitness race with running and work stations. Starts from walking and light weights.",
    "honesty": "The app cannot judge your running form, sled technique or pacing. Race equipment, sled surfaces and weights differ by event, so check the rulebook, and try the real stations at a gym that has them before race day.",
    "safety": "Running volume and heavy lifting compete for recovery. Raise weekly running by about 10% at most, keep hard runs apart from heavy leg days, and treat shin, Achilles or knee pain that lasts as a reason to cut back.",
    "icon": "cardio.interval",
    "accent": "#4A7FD1",
    "stages": [
      {
        "key": "s1",
        "name": "Base strength, easy running",
        "aim": "You lift twice and run or run-walk twice a week, and you can cover 5 km on foot without stopping to recover.",
        "weeks": 6,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "strength-a",
            "label": "Full body A",
            "sessionType": "strength",
            "focus": "Squat, push, pull and hinge with dumbbells, learning positions.",
            "exercises": [
              "goblet-squat",
              "db-bench-press",
              "db-one-arm-row",
              "db-romanian-deadlift",
              "plank"
            ],
            "prescription": "Goblet squat 3 x 10, dumbbell bench 3 x 10, row 3 x 10 per side, Romanian deadlift 3 x 10, plank 3 x 30 s. Leave 2-3 reps in reserve.",
            "minutes": 45
          },
          {
            "key": "run-walk",
            "label": "Run-walk",
            "sessionType": "outdoor",
            "focus": "Short running intervals with walking breaks at a pace you could talk at.",
            "exercises": [
              "brisk-walk",
              "run-walk-intervals",
              "wall-calf-stretch"
            ],
            "prescription": "5 min brisk walk, then 8 x 1 min run and 2 min walk. Add 30 s to the run each week. Finish with calf stretches.",
            "minutes": 35
          },
          {
            "key": "strength-b",
            "label": "Full body B",
            "sessionType": "strength",
            "focus": "Hinge from the floor, overhead press, pulldown, lunges and a carry.",
            "exercises": [
              "trap-bar-deadlift",
              "db-shoulder-press",
              "lat-pulldown",
              "db-reverse-lunge",
              "farmers-carry",
              "dead-bug"
            ],
            "prescription": "Trap bar deadlift 3 x 6, shoulder press 3 x 10, pulldown 3 x 10, reverse lunge 3 x 8 per leg, farmer's carry 3 x 30 m, dead bug 3 x 8 per side.",
            "minutes": 50
          },
          {
            "key": "long-easy",
            "label": "Longer easy session",
            "sessionType": "outdoor",
            "focus": "The longest outing of the week, all of it easy, run-walk as needed.",
            "exercises": [
              "brisk-walk",
              "easy-run",
              "standing-quad-stretch"
            ],
            "prescription": "5 min walk, then 25-40 min easy running with walk breaks whenever breathing gets hard. Build toward a continuous 5 km.",
            "minutes": 50
          }
        ],
        "gate": {
          "sessions": 19,
          "weeks": 4,
          "longestRunKm": 5
        },
        "benchmarks": [
          "Run 20 minutes without a walk break at a pace you can talk at.",
          "Lift in all four basic patterns without pain and with stable form.",
          "Complete four sessions in a week without needing extra rest days."
        ],
        "coachNote": "Run slower than you think you should. Easy running builds the engine; running every session hard is the most common reason people quit or get hurt."
      },
      {
        "key": "s2",
        "name": "Structured lifting and intervals",
        "aim": "You follow a lower/upper barbell split, run one interval session and one long run each week, and can row or ski at a steady hard pace.",
        "weeks": 8,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "lower",
            "label": "Lower strength",
            "sessionType": "strength",
            "focus": "Barbell squat and hinge with single-leg and trunk work.",
            "exercises": [
              "back-squat",
              "romanian-deadlift",
              "walking-lunge",
              "leg-curl-machine",
              "captains-chair-knee-raise"
            ],
            "prescription": "Back squat 4 x 5, Romanian deadlift 3 x 8, walking lunge 3 x 10 per leg, leg curl 3 x 12, knee raise 3 x 10.",
            "minutes": 60
          },
          {
            "key": "intervals",
            "label": "Run intervals",
            "sessionType": "outdoor",
            "focus": "Controlled fast running with equal recovery, framed by easy running.",
            "exercises": [
              "easy-run",
              "track-intervals",
              "strides"
            ],
            "prescription": "10 min easy, 6 x 400 m at a hard but repeatable pace with 90 s walk-jog, 4 x 20 s strides, 10 min easy.",
            "minutes": 45
          },
          {
            "key": "upper",
            "label": "Upper strength",
            "sessionType": "strength",
            "focus": "Press and pull in both directions, with shoulder and trunk health work.",
            "exercises": [
              "bench-press-barbell",
              "pull-up",
              "overhead-press",
              "seated-cable-row",
              "face-pull",
              "pallof-press"
            ],
            "prescription": "Bench 4 x 5, pull-ups 4 sets short of failure, overhead press 3 x 6, cable row 3 x 10, face pull 3 x 15, Pallof press 3 x 10 per side.",
            "minutes": 60
          },
          {
            "key": "erg",
            "label": "Erg engine",
            "sessionType": "cardio",
            "focus": "Rowing and ski erg technique and steady intervals.",
            "exercises": [
              "rowing-machine",
              "rowing-intervals",
              "ski-erg"
            ],
            "prescription": "Row 10 min easy, then 5 x 500 m at a hard steady pace with 90 s rest. Ski erg 4 x 250 m with 60 s rest. Keep stroke rate controlled.",
            "minutes": 45
          },
          {
            "key": "long-run",
            "label": "Long run",
            "sessionType": "outdoor",
            "focus": "One long easy run that grows a little each week.",
            "exercises": [
              "long-run",
              "strides",
              "brisk-walk"
            ],
            "prescription": "45-60 min at talking pace, building to 8 km or more. 4 x 15 s relaxed strides at the end, then a 5 min walk.",
            "minutes": 65
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 6,
          "longestRunKm": 8
        },
        "benchmarks": [
          "Run 8 km without stopping and feel able to train the next day.",
          "Row 1,000 m and ski 1,000 m at an even pace from start to finish.",
          "Squat and deadlift loads are still rising while running volume goes up."
        ],
        "coachNote": "Keep hard things hard and easy things easy. If leg strength starts dropping, the first thing to cut is intensity in the runs, not the lifting."
      },
      {
        "key": "s3",
        "name": "Functional conditioning",
        "aim": "You can do every typical race station with sound technique: sled push and pull, carries, lunges, wall balls, burpee broad jumps, row and ski.",
        "weeks": 8,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "lower",
            "label": "Lower strength",
            "sessionType": "strength",
            "focus": "Front squat and deadlift for sled and carry strength, with hamstring work.",
            "exercises": [
              "front-squat",
              "deadlift",
              "bulgarian-split-squat",
              "weighted-nordic-curl",
              "copenhagen-plank"
            ],
            "prescription": "Front squat 4 x 5, deadlift 3 x 4, split squat 3 x 8 per leg, Nordic curl 3 x 5 with body weight or light load, Copenhagen plank 3 x 20 s per side.",
            "minutes": 65
          },
          {
            "key": "stations",
            "label": "Station practice",
            "sessionType": "cardio",
            "focus": "Learn each station at moderate load with full recovery between efforts.",
            "exercises": [
              "ski-erg",
              "sled-push",
              "rope-sled-pull",
              "burpee-broad-jumps",
              "rowing-intervals",
              "sandbag-walking-lunges",
              "wall-ball"
            ],
            "prescription": "Ski 3 x 500 m, sled push 4 x 25 m, sled pull 4 x 25 m, burpee broad jumps 3 x 20 m, row 3 x 500 m, sandbag lunges 3 x 25 m, wall balls 3 x 20. Rest 90 s.",
            "minutes": 70
          },
          {
            "key": "tempo",
            "label": "Tempo run",
            "sessionType": "outdoor",
            "focus": "Sustained running at a comfortably hard pace.",
            "exercises": [
              "easy-run",
              "tempo-run",
              "strides"
            ],
            "prescription": "10 min easy, 3 x 8 min at tempo with 2 min jog, 10 min easy. Finish with 4 x 20 s strides.",
            "minutes": 50
          },
          {
            "key": "upper-carry",
            "label": "Upper and carries",
            "sessionType": "strength",
            "focus": "Overhead power, pulling strength and heavy loaded carries.",
            "exercises": [
              "push-press",
              "weighted-pull-up",
              "db-bench-press",
              "farmers-carry",
              "sandbag-carry",
              "wall-ball"
            ],
            "prescription": "Push press 4 x 5, weighted pull-up 4 x 5, dumbbell bench 3 x 10, farmer's carry 4 x 50 m, sandbag carry 3 x 50 m, wall balls 2 x 30.",
            "minutes": 60
          },
          {
            "key": "long-run",
            "label": "Long run",
            "sessionType": "outdoor",
            "focus": "Long easy run building toward 10 km and beyond.",
            "exercises": [
              "long-run",
              "strides",
              "brisk-walk"
            ],
            "prescription": "60-70 min easy, building to 10 km or more. Add 4 relaxed strides at the end and walk 5 min.",
            "minutes": 75
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 6,
          "longestRunKm": 10
        },
        "benchmarks": [
          "Wall balls to full depth and target height for 40 unbroken reps.",
          "Push and pull a sled at race-like load for 25 m without stalling.",
          "Carry race-weight farmer's handles for 100 m with at most one set-down."
        ],
        "coachNote": "Efficiency at stations saves more time than fitness does. Learn the low sled position, a steady wall-ball rhythm and a breathing pattern for the ergs."
      },
      {
        "key": "s4",
        "name": "Race simulations",
        "aim": "You run on tired legs straight after stations, complete half and full race simulations, and know the pace you can hold for the whole event.",
        "weeks": 8,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "strength",
            "label": "Strength maintenance",
            "sessionType": "strength",
            "focus": "One heavy full-body session to hold strength while race work increases.",
            "exercises": [
              "back-squat",
              "bench-press-barbell",
              "trap-bar-deadlift",
              "pull-up",
              "weighted-leg-raise"
            ],
            "prescription": "Squat 3 x 4, bench 3 x 5, trap bar deadlift 3 x 4, pull-ups 3 sets, leg raise 3 x 10. Heavy but never to failure.",
            "minutes": 60
          },
          {
            "key": "compromised",
            "label": "Compromised running",
            "sessionType": "cardio",
            "focus": "Alternate 1 km runs with single stations to practise running on heavy legs.",
            "exercises": [
              "treadmill-run",
              "ski-erg",
              "sled-push",
              "burpee-broad-jumps",
              "rowing-machine",
              "loaded-carry-cardio"
            ],
            "prescription": "4-5 rounds: 1 km run at race pace, then one station (ski 500 m, sled 50 m, burpee broad jumps 40 m, row 500 m, carry 100 m). No rest beyond the transition.",
            "minutes": 70
          },
          {
            "key": "threshold",
            "label": "Threshold run",
            "sessionType": "outdoor",
            "focus": "Longer repeats at threshold pace, with hills on alternate weeks.",
            "exercises": [
              "easy-run",
              "tempo-run",
              "hill-repeats"
            ],
            "prescription": "10 min easy, then 4 x 1 km at threshold with 90 s jog. Alternate weeks: 8 x 60 s hill repeats with a jog down. 10 min easy to finish.",
            "minutes": 55
          },
          {
            "key": "simulation",
            "label": "Race simulation",
            "sessionType": "cardio",
            "focus": "Half or full simulation at planned race pace, stations in race order.",
            "exercises": [
              "stationary-bike",
              "fitness-race-simulation",
              "sandbag-walking-lunges",
              "wall-ball",
              "zone-2-cardio"
            ],
            "prescription": "10 min easy bike, then a half simulation (4 runs, 4 stations). Every third week do the full format. Finish on lunges and wall balls, 10 min easy cool-down.",
            "minutes": 90
          },
          {
            "key": "long-run",
            "label": "Long run",
            "sessionType": "outdoor",
            "focus": "Long run with a faster finish to practise pushing when tired.",
            "exercises": [
              "long-run",
              "progression-run",
              "brisk-walk"
            ],
            "prescription": "70-80 min, 12 km or more. Most weeks all easy; every second week run the last 15 min as a progression to tempo. Walk 5 min after.",
            "minutes": 85
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 6,
          "longestRunKm": 12
        },
        "benchmarks": [
          "One full race simulation completed with even 1 km splits from first to last.",
          "Your run pace straight after the sled is within 20 s per km of your fresh pace.",
          "You know your target split for every station and every run."
        ],
        "coachNote": "Most of the race is running. Pace the first half so the runs after the sleds and lunges stay steady; that is where the time is won or lost."
      },
      {
        "key": "s5",
        "name": "Race prep and taper",
        "aim": "You sharpen at race pace, cut volume over the last two weeks, and reach the start line fresh with a written pacing and fuelling plan.",
        "weeks": 6,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "strength",
            "label": "Strength touch",
            "sessionType": "strength",
            "focus": "Short heavy-ish lifting to keep strength without soreness.",
            "exercises": [
              "front-squat",
              "push-press",
              "lat-pulldown",
              "kettlebell-swing",
              "pallof-press"
            ],
            "prescription": "Front squat 3 x 3, push press 3 x 3, pulldown 3 x 8, swings 3 x 10, Pallof press 2 x 10 per side. Drop this session in race week.",
            "minutes": 40
          },
          {
            "key": "race-pace",
            "label": "Race-pace stations",
            "sessionType": "cardio",
            "focus": "Stations at race load and pace with short runs between them.",
            "exercises": [
              "treadmill-run",
              "sled-push",
              "rope-sled-pull",
              "burpee-broad-jumps",
              "wall-ball",
              "ski-erg"
            ],
            "prescription": "3 rounds: 800 m run at race pace, then two stations at race load and distance. Rotate stations weekly. In race week do one round only.",
            "minutes": 55
          },
          {
            "key": "race-run",
            "label": "Race-pace run",
            "sessionType": "outdoor",
            "focus": "Kilometre repeats at goal race pace with short recoveries.",
            "exercises": [
              "easy-run",
              "track-intervals",
              "strides"
            ],
            "prescription": "10 min easy, 6 x 1 km at goal race run pace with 60 s rest, 4 x 20 s strides, 10 min easy. Cut to 3 x 1 km in race week.",
            "minutes": 50
          },
          {
            "key": "long-easy",
            "label": "Long easy run",
            "sessionType": "outdoor",
            "focus": "Hold aerobic fitness with a shrinking long run, then loosen up.",
            "exercises": [
              "long-run",
              "brisk-walk",
              "hip-mobility"
            ],
            "prescription": "Weeks 1-3: 10-12 km easy. Week 4: 8 km. Week 5: 6 km. Race week: 20-30 min easy two days before. Walk 5 min and do hip mobility after.",
            "minutes": 70
          }
        ],
        "gate": {
          "sessions": 19,
          "weeks": 4,
          "longestRunKm": 10
        },
        "benchmarks": [
          "You have a written plan: pace per run, target per station, what you drink and when.",
          "You have trained in the shoes and kit you will race in.",
          "Resting heart rate and mood are normal or better in the final week."
        ],
        "coachNote": "Fitness is already built by now. The taper only works if you actually do less; resist the urge to test yourself in the last ten days."
      }
    ]
  },
  {
    "key": "path-powerlifter",
    "name": "Become a powerlifter",
    "become": "Powerlifter",
    "discipline": "strength",
    "tagline": "Squat, bench and deadlift, built from an empty bar to a nine-attempt meet day.",
    "whoFor": "Anyone who wants to get measurably strong on three barbell lifts and is willing to repeat them for years. No lifting experience needed to start.",
    "honesty": "The app cannot see your bar path, depth or lockout. Film your lifts and have a coach or an experienced lifter check them. Competition rules, commands and equipment checks are learned at a club and at a real meet.",
    "safety": "Most injuries come from jumping load too fast or grinding ugly reps. Use safety bars or spotters on squat and bench, never a thumbless grip on bench, and stop a set when position breaks.",
    "icon": "strength.barbell",
    "accent": "#C2453A",
    "stages": [
      {
        "key": "s1",
        "name": "Learning the three lifts",
        "aim": "You can squat to depth, bench with a stable touch point and deadlift from the floor with a flat back, all with light loads and the same form every rep.",
        "weeks": 4,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "squat-day",
            "label": "Squat day",
            "sessionType": "strength",
            "focus": "Learn the squat pattern from goblet to barbell, then simple back and trunk work.",
            "exercises": [
              "squat-to-stand",
              "goblet-squat",
              "back-squat",
              "db-one-arm-row",
              "plank"
            ],
            "prescription": "Goblet squat 2 x 10, back squat 3 x 5 starting with the empty bar, row 3 x 10 per side, plank 3 x 30 s. Add 2.5 kg only if every rep looked the same.",
            "minutes": 50
          },
          {
            "key": "bench-day",
            "label": "Bench day",
            "sessionType": "strength",
            "focus": "Set-up, shoulder blades back and down, bar to the same spot on the chest every rep.",
            "exercises": [
              "band-pull-apart",
              "bench-press-barbell",
              "db-bench-press",
              "lat-pulldown",
              "dead-bug"
            ],
            "prescription": "Pull-aparts 2 x 15, bench 3 x 5 from the empty bar, dumbbell bench 2 x 10, pulldown 3 x 10, dead bug 3 x 8 per side.",
            "minutes": 50
          },
          {
            "key": "deadlift-day",
            "label": "Deadlift day",
            "sessionType": "strength",
            "focus": "Hinge first, then pull from the floor with a braced, neutral back.",
            "exercises": [
              "dowel-hip-hinge",
              "kb-sumo-deadlift",
              "deadlift",
              "back-extension",
              "side-plank"
            ],
            "prescription": "Dowel hinge 2 x 10, kettlebell deadlift 2 x 8, barbell deadlift 3 x 5 light, back extension 2 x 12, side plank 3 x 20 s per side.",
            "minutes": 50
          }
        ],
        "gate": {
          "sessions": 10,
          "weeks": 3
        },
        "benchmarks": [
          "Squat the empty bar for 5 reps with the hip crease below the top of the knee.",
          "Bench with feet planted and the bar touching the same place on every rep.",
          "Deadlift 5 reps from the floor without your lower back rounding."
        ],
        "coachNote": "Load is irrelevant here. You are building the movement you will repeat thousands of times, so leave every set with reps in reserve and film from the side."
      },
      {
        "key": "s2",
        "name": "Linear progression",
        "aim": "You add weight to the bar almost every session on a simple three-day plan and finish with honest sets of five well above your starting loads.",
        "weeks": 10,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "day-a",
            "label": "Squat and bench",
            "sessionType": "strength",
            "focus": "Heavy sets of five on squat and bench, then rowing and trunk work.",
            "exercises": [
              "back-squat",
              "bench-press-barbell",
              "barbell-row",
              "ab-wheel-rollout"
            ],
            "prescription": "Squat 3 x 5, bench 3 x 5, row 3 x 8, rollout 3 x 8. Add 2.5 kg to squat and 1-2.5 kg to bench each session while all reps are clean.",
            "minutes": 60
          },
          {
            "key": "day-b",
            "label": "Squat, press, deadlift",
            "sessionType": "strength",
            "focus": "Lighter squat, overhead press and one heavy set of deadlift.",
            "exercises": [
              "back-squat",
              "overhead-press",
              "deadlift",
              "chin-up",
              "weighted-plank"
            ],
            "prescription": "Squat 2 x 5 at 80% of day A, press 3 x 5, deadlift 1 x 5 heavy after warm-ups, chin-ups 3 sets short of failure, plank 3 x 40 s.",
            "minutes": 60
          },
          {
            "key": "day-c",
            "label": "Squat and bench again",
            "sessionType": "strength",
            "focus": "Repeat the main lifts, then hamstrings and upper back.",
            "exercises": [
              "back-squat",
              "bench-press-barbell",
              "romanian-deadlift",
              "lat-pulldown",
              "face-pull"
            ],
            "prescription": "Squat 3 x 5, bench 3 x 5, Romanian deadlift 3 x 8, pulldown 3 x 10, face pull 3 x 15. If you miss reps twice at a load, drop 10% and build back.",
            "minutes": 60
          }
        ],
        "gate": {
          "sessions": 24,
          "weeks": 8,
          "overallTier": 1
        },
        "benchmarks": [
          "Three sets of five on squat at a load that was a one-set maximum two months ago.",
          "You warm up the same way every session and know your working weights by heart.",
          "You have reset a stalled lift once and come back past the old load."
        ],
        "coachNote": "Small jumps, every session, no missed workouts. The programme works because it is boring. Eat and sleep enough to recover or the progress stops early."
      },
      {
        "key": "s3",
        "name": "Volume and variations",
        "aim": "You handle four sessions a week, train each lift twice, and use pause squats, deficit pulls and close-grip bench to fix the weak part of each lift.",
        "weeks": 12,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "squat-volume",
            "label": "Squat volume",
            "sessionType": "strength",
            "focus": "Competition squat for volume, then a paused variation and leg accessories.",
            "exercises": [
              "back-squat",
              "pause-squat",
              "leg-press",
              "leg-curl-machine",
              "ab-wheel-rollout"
            ],
            "prescription": "Squat 4 x 6 at about 75%, pause squat 3 x 3 with a 2 s pause, leg press 3 x 10, leg curl 3 x 12, rollout 3 x 8.",
            "minutes": 75
          },
          {
            "key": "bench-volume",
            "label": "Bench volume",
            "sessionType": "strength",
            "focus": "Competition bench for volume, close-grip for triceps, rows to balance the pressing.",
            "exercises": [
              "bench-press-barbell",
              "bench-press-close-grip",
              "db-incline-press",
              "seated-cable-row",
              "triceps-pushdown",
              "face-pull"
            ],
            "prescription": "Bench 5 x 5 at about 75%, close-grip 3 x 8, incline dumbbell 3 x 10, row 4 x 10, pushdown 3 x 12, face pull 3 x 15.",
            "minutes": 75
          },
          {
            "key": "deadlift-volume",
            "label": "Deadlift volume",
            "sessionType": "strength",
            "focus": "Deadlift from the floor, deficit pulls for speed off the floor, front squat for the back.",
            "exercises": [
              "deadlift",
              "deficit-deadlift",
              "front-squat",
              "back-extension",
              "weighted-plank"
            ],
            "prescription": "Deadlift 4 x 4 at about 78%, deficit deadlift 3 x 5 lighter, front squat 3 x 6, back extension 3 x 12, weighted plank 3 x 30 s.",
            "minutes": 75
          },
          {
            "key": "bench-variation",
            "label": "Bench variation",
            "sessionType": "strength",
            "focus": "Second bench day with a paused variation, overhead work and upper-back volume.",
            "exercises": [
              "spoto-press",
              "overhead-press",
              "pull-up",
              "db-chest-supported-row",
              "skullcrusher",
              "rear-delt-fly"
            ],
            "prescription": "Spoto press 4 x 5, overhead press 3 x 8, pull-ups 4 sets, chest-supported row 3 x 10, skullcrusher 3 x 12, rear-delt fly 3 x 15.",
            "minutes": 70
          }
        ],
        "gate": {
          "sessions": 38,
          "weeks": 10,
          "overallTier": 2
        },
        "benchmarks": [
          "You can name where each lift fails: out of the hole, off the chest, off the floor or at lockout.",
          "A paused squat and a paused bench feel controlled at 80% of your best.",
          "You recover from four sessions a week without joints aching into the next one."
        ],
        "coachNote": "Weekly jumps replace session jumps. Most sets should end with two reps in reserve; the volume does the work, not the grind."
      },
      {
        "key": "s4",
        "name": "Intensity and heavy singles",
        "aim": "You lift heavy doubles and singles with competition standards: paused bench, full depth, no hitching, and you can call your own rep quality honestly.",
        "weeks": 10,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "heavy-squat",
            "label": "Heavy squat",
            "sessionType": "strength",
            "focus": "Work up to a heavy top set, then back-off sets and pin squats for the sticking point.",
            "exercises": [
              "back-squat",
              "anderson-squat",
              "bulgarian-split-squat",
              "weighted-leg-raise"
            ],
            "prescription": "Squat top set of 2-3 at 85-92%, then 3 x 4 at 80%. Pin squat 3 x 3, split squat 3 x 8 per leg, leg raise 3 x 10.",
            "minutes": 80
          },
          {
            "key": "heavy-bench",
            "label": "Heavy bench",
            "sessionType": "strength",
            "focus": "Paused competition bench heavy, pin press for lockout, heavy rowing.",
            "exercises": [
              "bench-press-barbell",
              "pin-bench-press",
              "barbell-row",
              "jm-press",
              "band-pull-apart"
            ],
            "prescription": "Paused bench top set of 2-3 at 85-92%, then 4 x 4 at 80%. Pin press 3 x 4, row 4 x 8, JM press 3 x 10, pull-aparts 3 x 20.",
            "minutes": 80
          },
          {
            "key": "heavy-deadlift",
            "label": "Heavy deadlift",
            "sessionType": "strength",
            "focus": "Heavy pulls from the floor, rack pulls for lockout, trunk work against rotation.",
            "exercises": [
              "deadlift",
              "rack-pull",
              "good-morning",
              "lat-pulldown",
              "pallof-press"
            ],
            "prescription": "Deadlift top set of 2 at 85-92%, then 3 x 3 at 80%. Rack pull 3 x 3, good morning 3 x 8, pulldown 3 x 10, Pallof press 3 x 10 per side.",
            "minutes": 80
          },
          {
            "key": "secondary",
            "label": "Secondary day",
            "sessionType": "strength",
            "focus": "Lighter paused squat and close-grip bench to keep frequency without adding fatigue.",
            "exercises": [
              "pause-squat",
              "bench-press-close-grip",
              "t-bar-row",
              "reverse-hyperextension",
              "face-pull"
            ],
            "prescription": "Pause squat 4 x 3 at 70%, close-grip bench 4 x 6, T-bar row 4 x 10, reverse hyper 3 x 12, face pull 3 x 15. Nothing close to failure.",
            "minutes": 65
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 8,
          "overallTier": 3
        },
        "benchmarks": [
          "A heavy single at 90% moves without a change in technique from your warm-ups.",
          "Every bench rep is paused on the chest long enough for a referee to call press.",
          "You take a lighter week every fourth or fifth week without being told to."
        ],
        "coachNote": "Heavy does not mean maximal. Save true maximum attempts for testing days; a missed lift in training costs more recovery than it teaches."
      },
      {
        "key": "s5",
        "name": "Meet preparation",
        "aim": "You peak for a date: volume drops, singles climb to your planned openers, and you run a full mock meet with commands and timed attempts.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "comp-squat",
            "label": "Competition squat",
            "sessionType": "strength",
            "focus": "Squat singles toward the opener, short back-off work, hips kept loose.",
            "exercises": [
              "hip-mobility",
              "back-squat",
              "pause-squat",
              "leg-curl-machine",
              "weighted-plank"
            ],
            "prescription": "Squat single at 88-95% then 2 x 3 at 80%, pause squat 2 x 3 at 70%, leg curl 2 x 12, plank 3 x 45 s. Final week: opener only, then rest.",
            "minutes": 70
          },
          {
            "key": "comp-bench",
            "label": "Competition bench",
            "sessionType": "strength",
            "focus": "Bench singles with full start, press and rack commands.",
            "exercises": [
              "bench-press-barbell",
              "spoto-press",
              "seated-cable-row",
              "triceps-pushdown"
            ],
            "prescription": "Paused bench single at 88-95% then 3 x 3 at 80%, Spoto press 2 x 4, row 3 x 10, pushdown 2 x 15. Have someone call the commands.",
            "minutes": 65
          },
          {
            "key": "comp-deadlift",
            "label": "Competition deadlift",
            "sessionType": "strength",
            "focus": "Deadlift singles, light hinge work, lats and trunk.",
            "exercises": [
              "deadlift",
              "romanian-deadlift",
              "lat-pulldown",
              "side-plank"
            ],
            "prescription": "Deadlift single at 88-95% then 2 x 2 at 80%, Romanian deadlift 2 x 6 light, pulldown 3 x 10, side plank 3 x 30 s. Last heavy pull 10-14 days out.",
            "minutes": 65
          },
          {
            "key": "mock-meet",
            "label": "Mock meet",
            "sessionType": "strength",
            "focus": "All three lifts in meet order with three attempts each and real rest between flights.",
            "exercises": [
              "back-squat",
              "bench-press-barbell",
              "deadlift",
              "foam-rolling"
            ],
            "prescription": "Three attempts per lift: opener you could triple, a small personal best, then a stretch. Do this once, 3-4 weeks out. Other weeks: openers only.",
            "minutes": 120
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6,
          "overallTier": 4
        },
        "benchmarks": [
          "You have chosen openers you could make on your worst day.",
          "You have completed nine attempts in one session and know how long your warm-up takes.",
          "You know your federation's rules for depth, pause, commands and approved kit."
        ],
        "coachNote": "The peak is about arriving fresh, not fitter. Cut volume, keep intensity, and do not test anything new in the last two weeks."
      }
    ]
  },
  {
    "key": "path-bodybuilder",
    "name": "Become a physique athlete",
    "become": "Physique athlete",
    "discipline": "strength",
    "tagline": "Build muscle on purpose: sound technique, progressive overload and enough volume, for years.",
    "whoFor": "People whose main goal is muscle size, shape and proportion, from a first gym session to training like someone preparing for a physique show.",
    "honesty": "The app cannot judge your physique, posing or stage condition, and it does not plan contest diets. Extreme dieting, dehydration and drug use are outside this app and carry real health risks. Compete only with a qualified coach and medical oversight.",
    "safety": "Overuse of elbows, shoulders and knees is the usual problem, from too much volume too soon. Add sets gradually and control the lowering phase. Prolonged hard dieting harms hormones, mood and heart health.",
    "icon": "strength.dumbbell",
    "accent": "#9A5FC4",
    "stages": [
      {
        "key": "s1",
        "name": "Full-body basics",
        "aim": "You train the whole body three times a week on stable machine and dumbbell lifts, feel the target muscle working, and log every set.",
        "weeks": 6,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "full-a",
            "label": "Full body A",
            "sessionType": "strength",
            "focus": "Machine-based session to learn pushing, pulling and leg patterns safely.",
            "exercises": [
              "leg-press",
              "chest-press-machine",
              "lat-pulldown",
              "machine-shoulder-press",
              "leg-curl-machine",
              "ab-crunch-machine"
            ],
            "prescription": "2-3 sets of 10-12 on each lift, 2-3 reps left in reserve, 90 s rest. Ab machine 3 x 12. Lower every rep under control for 2-3 s.",
            "minutes": 50
          },
          {
            "key": "full-b",
            "label": "Full body B",
            "sessionType": "strength",
            "focus": "Dumbbell and cable session with free-weight balance demands.",
            "exercises": [
              "goblet-squat",
              "db-bench-press",
              "seated-cable-row",
              "db-romanian-deadlift",
              "lateral-raise",
              "cable-crunch"
            ],
            "prescription": "3 sets of 10-12 on each lift, lateral raise 3 x 15, cable crunch 3 x 15. Add weight only when you reach the top of the rep range on all sets.",
            "minutes": 50
          },
          {
            "key": "full-c",
            "label": "Full body C",
            "sessionType": "strength",
            "focus": "Different angles for the same muscles, plus direct arm work.",
            "exercises": [
              "hack-squat",
              "db-incline-press",
              "machine-row",
              "back-extension",
              "db-curl",
              "triceps-pushdown"
            ],
            "prescription": "3 sets of 10-12 on the first four lifts, curls and pushdowns 2 x 12-15. Rest 90 s. Same exercises every week so progress is visible.",
            "minutes": 50
          }
        ],
        "gate": {
          "sessions": 14,
          "weeks": 4
        },
        "benchmarks": [
          "Every lift done through full range with a controlled lowering phase.",
          "Your log shows more weight or reps on most lifts than in week one.",
          "You can tell a set that ended two reps from failure from one that ended five away."
        ],
        "coachNote": "Consistency and technique beat any programme detail at this point. Show up three times a week and make each rep look the same."
      },
      {
        "key": "s2",
        "name": "Upper/lower progression",
        "aim": "You train four days a week on an upper/lower split and add weight or reps to your main lifts in the 6-12 range nearly every week.",
        "weeks": 10,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "upper-a",
            "label": "Upper A",
            "sessionType": "strength",
            "focus": "Heavier pressing and rowing, then shoulders and arms.",
            "exercises": [
              "bench-press-barbell",
              "barbell-row",
              "db-shoulder-press",
              "lat-pulldown",
              "ez-bar-curl",
              "rope-pushdown"
            ],
            "prescription": "Bench 4 x 6-8, row 4 x 6-8, shoulder press 3 x 8-10, pulldown 3 x 10, curl 3 x 10-12, pushdown 3 x 10-12.",
            "minutes": 65
          },
          {
            "key": "lower-a",
            "label": "Lower A",
            "sessionType": "strength",
            "focus": "Squat-led leg day with hamstrings, calves and abs.",
            "exercises": [
              "back-squat",
              "romanian-deadlift",
              "leg-extension",
              "seated-leg-curl",
              "standing-calf-machine",
              "captains-chair-knee-raise"
            ],
            "prescription": "Squat 4 x 6-8, Romanian deadlift 3 x 8-10, leg extension 3 x 12, leg curl 3 x 12, calf raise 4 x 10-12, knee raise 3 x 12.",
            "minutes": 65
          },
          {
            "key": "upper-b",
            "label": "Upper B",
            "sessionType": "strength",
            "focus": "Higher-rep upper day with incline pressing, pull-ups and isolation work.",
            "exercises": [
              "db-incline-press",
              "pull-up",
              "cable-crossover",
              "db-chest-supported-row",
              "lateral-raise",
              "hammer-curl",
              "skullcrusher"
            ],
            "prescription": "Incline press 3 x 8-12, pull-ups 3 sets near failure, crossover 3 x 12-15, row 3 x 10-12, lateral raise 4 x 12-15, hammer curl and skullcrusher 3 x 10-12.",
            "minutes": 70
          },
          {
            "key": "lower-b",
            "label": "Lower B",
            "sessionType": "strength",
            "focus": "Hip-led leg day with single-leg work and glutes.",
            "exercises": [
              "leg-press",
              "barbell-hip-thrust",
              "bulgarian-split-squat",
              "leg-curl-machine",
              "seated-calf-machine",
              "cable-crunch"
            ],
            "prescription": "Leg press 4 x 10-12, hip thrust 3 x 8-10, split squat 3 x 10 per leg, leg curl 3 x 12, seated calf 4 x 12-15, cable crunch 3 x 12.",
            "minutes": 65
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 8
        },
        "benchmarks": [
          "Main lifts are up clearly from the start of the stage at the same rep count.",
          "Most working sets finish one to three reps short of failure.",
          "You eat enough protein and total food that body weight holds or rises slowly."
        ],
        "coachNote": "Progressive overload is the driver: same exercises, a little more weight or one more rep. If the log is flat for three weeks, look at sleep and food first."
      },
      {
        "key": "s3",
        "name": "Push, pull, legs",
        "aim": "You train five days a week, hit each muscle about twice, and know roughly how many weekly sets each of your muscle groups grows on and recovers from.",
        "weeks": 12,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "push",
            "label": "Push",
            "sessionType": "strength",
            "focus": "Chest, shoulders and triceps: one heavy press, one incline, then isolation.",
            "exercises": [
              "bench-press-barbell",
              "db-incline-press",
              "machine-shoulder-press",
              "cable-lateral-raise",
              "pec-deck",
              "overhead-cable-extension"
            ],
            "prescription": "Bench 4 x 6-8, incline 3 x 8-10, shoulder press 3 x 10, cable lateral 4 x 12-15, pec deck 3 x 12-15, overhead extension 3 x 12.",
            "minutes": 70
          },
          {
            "key": "pull",
            "label": "Pull",
            "sessionType": "strength",
            "focus": "Back width and thickness, rear delts and biceps.",
            "exercises": [
              "pull-up",
              "t-bar-row",
              "lat-pulldown-close",
              "seated-cable-row",
              "reverse-pec-deck",
              "incline-db-curl",
              "rope-hammer-curl"
            ],
            "prescription": "Pull-ups 4 sets, T-bar row 4 x 8-10, close pulldown 3 x 10-12, cable row 3 x 10-12, reverse pec deck 3 x 15, incline curl and hammer curl 3 x 10-12.",
            "minutes": 70
          },
          {
            "key": "legs",
            "label": "Legs",
            "sessionType": "strength",
            "focus": "Quads, hamstrings, glutes and calves in one full session.",
            "exercises": [
              "back-squat",
              "leg-press",
              "romanian-deadlift",
              "leg-extension",
              "seated-leg-curl",
              "standing-calf-machine"
            ],
            "prescription": "Squat 4 x 6-8, leg press 3 x 10-12, Romanian deadlift 3 x 8-10, leg extension 3 x 12-15, leg curl 3 x 12, calf raise 4 x 10-12.",
            "minutes": 75
          },
          {
            "key": "upper",
            "label": "Shoulders and arms",
            "sessionType": "strength",
            "focus": "Second weekly hit for delts, biceps and triceps, plus upper chest.",
            "exercises": [
              "overhead-press",
              "db-incline-fly",
              "lateral-raise",
              "face-pull",
              "ez-bar-preacher-curl",
              "skullcrusher",
              "triceps-pushdown"
            ],
            "prescription": "Overhead press 4 x 6-8, incline fly 3 x 12, lateral raise 4 x 12-15, face pull 3 x 15, preacher curl 3 x 10, skullcrusher 3 x 10, pushdown 3 x 12.",
            "minutes": 65
          },
          {
            "key": "lower",
            "label": "Posterior chain",
            "sessionType": "strength",
            "focus": "Second leg day led by hips and hamstrings, with abs.",
            "exercises": [
              "barbell-hip-thrust",
              "hack-squat",
              "walking-lunge",
              "leg-curl-machine",
              "seated-calf-machine",
              "cable-crunch"
            ],
            "prescription": "Hip thrust 4 x 8-10, hack squat 3 x 10-12, walking lunge 3 x 12 per leg, leg curl 4 x 10-12, seated calf 4 x 12-15, cable crunch 3 x 12-15.",
            "minutes": 65
          }
        ],
        "gate": {
          "sessions": 48,
          "weeks": 10,
          "overallTier": 1
        },
        "benchmarks": [
          "You can state your weekly hard sets per muscle group and whether each is growing.",
          "You plan a lighter week when performance drops instead of pushing on.",
          "Progress photos in the same light every four weeks show visible change."
        ],
        "coachNote": "More volume helps only up to what you recover from. Start at about 10 hard sets per muscle a week, add slowly, and deload when lifts go backwards."
      },
      {
        "key": "s4",
        "name": "Weak points and intensity",
        "aim": "You pick one or two lagging muscle groups, give them extra volume and priority, and use drop sets, rest-pause and slow lowering where they are safe.",
        "weeks": 12,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "chest-back",
            "label": "Chest and back",
            "sessionType": "strength",
            "focus": "Paired pressing and pulling from several angles.",
            "exercises": [
              "bench-press-incline-barbell",
              "seal-row",
              "db-bench-press",
              "iso-lateral-lat-pulldown",
              "cable-fly-low-to-high",
              "straight-arm-pulldown"
            ],
            "prescription": "Incline bench 4 x 6-8, seal row 4 x 8, dumbbell bench 3 x 10, pulldown 3 x 10-12, low-to-high fly 3 x 12-15 with a drop set, straight-arm pulldown 3 x 15.",
            "minutes": 75
          },
          {
            "key": "quads",
            "label": "Quad-led legs",
            "sessionType": "strength",
            "focus": "Quad-dominant squatting with machine work taken close to failure.",
            "exercises": [
              "hack-squat",
              "cyclist-squat",
              "pendulum-squat",
              "leg-extension",
              "reverse-nordic-curl",
              "leg-press-calf-raise"
            ],
            "prescription": "Hack squat 4 x 8, heel-elevated squat 3 x 10, pendulum squat 3 x 10-12, leg extension 3 x 15 with rest-pause on the last set, reverse Nordic 2 x 10, calves 4 x 12.",
            "minutes": 75
          },
          {
            "key": "delts-arms",
            "label": "Delts and arms",
            "sessionType": "strength",
            "focus": "All three delt heads, then biceps and triceps from long and short positions.",
            "exercises": [
              "db-shoulder-press",
              "leaning-lateral-raise",
              "cable-rear-delt-fly",
              "bayesian-cable-curl",
              "spider-curl-dumbbell",
              "jm-press",
              "db-single-arm-overhead-extension"
            ],
            "prescription": "Shoulder press 4 x 8, leaning lateral 4 x 12-15, rear-delt fly 4 x 15, Bayesian curl 3 x 12, spider curl 3 x 12, JM press 3 x 10, overhead extension 3 x 12.",
            "minutes": 70
          },
          {
            "key": "posterior",
            "label": "Hamstrings and glutes",
            "sessionType": "strength",
            "focus": "Hinge-led lower day with glute and adductor work.",
            "exercises": [
              "stiff-leg-deadlift",
              "b-stance-hip-thrust",
              "seated-leg-curl",
              "glute-ham-raise",
              "hip-adduction-machine",
              "seated-calf-machine"
            ],
            "prescription": "Stiff-leg deadlift 4 x 8, B-stance hip thrust 3 x 10 per side, seated leg curl 4 x 10-12, glute-ham raise 3 x 8, adduction 3 x 15, seated calf 4 x 15.",
            "minutes": 70
          },
          {
            "key": "weak-point",
            "label": "Weak-point day",
            "sessionType": "strength",
            "focus": "Extra session for your lagging areas. The default targets upper chest, side delts and lats.",
            "exercises": [
              "smith-machine-incline-press",
              "machine-pullover",
              "lateral-raise-machine",
              "cable-crossover",
              "lat-pulldown-single-arm",
              "cable-crunch"
            ],
            "prescription": "4 sets of 10-15 on the lifts for your weak points, 2-3 sets on the rest. One intensity technique per muscle at most. Swap lifts to match your own weak points.",
            "minutes": 60
          }
        ],
        "gate": {
          "sessions": 48,
          "weeks": 10,
          "overallTier": 2
        },
        "benchmarks": [
          "You have named your weak points from photos or a judge's or coach's feedback.",
          "A prioritised muscle gets 4-6 more weekly sets while others drop to maintenance.",
          "Intensity techniques are used on machines and cables, not on heavy barbell lifts."
        ],
        "coachNote": "Specialising means taking volume away elsewhere. You cannot prioritise everything; hold strong areas at maintenance and spend recovery where it shows."
      },
      {
        "key": "s5",
        "name": "Contest-style preparation",
        "aim": "You hold muscle and training loads through a long, moderate fat-loss phase, add steady cardio, and train like someone 12 weeks out from a show.",
        "weeks": 12,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "push",
            "label": "Push",
            "sessionType": "strength",
            "focus": "Keep pressing loads as heavy as in the building phase, with slightly fewer sets.",
            "exercises": [
              "bench-press-incline-barbell",
              "iso-lateral-chest-press",
              "machine-shoulder-press",
              "cable-lateral-raise",
              "cable-fly-incline",
              "rope-pushdown"
            ],
            "prescription": "Incline bench 3 x 6-8, chest press 3 x 8-10, shoulder press 3 x 10, cable lateral 4 x 12-15, incline cable fly 3 x 12, pushdown 3 x 12.",
            "minutes": 65
          },
          {
            "key": "pull",
            "label": "Pull",
            "sessionType": "strength",
            "focus": "Back thickness and width, rear delts and biceps, loads held steady.",
            "exercises": [
              "weighted-pull-up",
              "t-bar-row-chest-supported",
              "iso-lateral-high-row",
              "machine-pullover",
              "reverse-pec-deck",
              "cable-curl"
            ],
            "prescription": "Weighted pull-up 3 x 6-8, chest-supported T-bar row 3 x 8-10, high row 3 x 10, pullover 3 x 12, reverse pec deck 3 x 15, cable curl 3 x 12.",
            "minutes": 65
          },
          {
            "key": "legs",
            "label": "Legs",
            "sessionType": "strength",
            "focus": "Machine-led leg day that is safe when energy is low.",
            "exercises": [
              "hack-squat",
              "leg-press",
              "romanian-deadlift",
              "leg-extension",
              "seated-leg-curl",
              "standing-calf-machine"
            ],
            "prescription": "Hack squat 3 x 8, leg press 3 x 10-12, Romanian deadlift 3 x 8-10, leg extension 3 x 12-15, leg curl 3 x 12, calf raise 4 x 12.",
            "minutes": 70
          },
          {
            "key": "upper-detail",
            "label": "Upper detail",
            "sessionType": "strength",
            "focus": "Second upper session for delts, arms, upper back and abs.",
            "exercises": [
              "db-incline-press",
              "seated-cable-row",
              "seated-lateral-raise",
              "face-pull",
              "incline-db-curl",
              "overhead-cable-extension",
              "weighted-leg-raise"
            ],
            "prescription": "Incline press 3 x 10, cable row 3 x 10, lateral raise 4 x 15, face pull 3 x 15, incline curl 3 x 12, overhead extension 3 x 12, leg raise 3 x 12.",
            "minutes": 65
          },
          {
            "key": "conditioning",
            "label": "Steady cardio",
            "sessionType": "cardio",
            "focus": "Low-impact steady cardio to raise energy use without hurting leg recovery.",
            "exercises": [
              "incline-walk",
              "stair-climber",
              "zone-2-cardio",
              "stretching"
            ],
            "prescription": "30-45 min at a pace you can talk at: incline walk, stair climber or other steady cardio. Finish with 10 min stretching. Add minutes slowly, not all at once.",
            "minutes": 50
          }
        ],
        "gate": {
          "sessions": 48,
          "weeks": 10
        },
        "benchmarks": [
          "Main lift loads stay within about 5-10% of your best while body weight drops.",
          "Weight loss is slow: roughly half a percent to one percent of body weight a week.",
          "Sleep, mood and training drive are monitored, and you stop the diet if they collapse."
        ],
        "coachNote": "Train as heavy as before; the diet does the fat loss. Stage-level leanness is not healthy to hold, and crash diets, dehydration and drugs are outside this app and carry real risks."
      }
    ]
  },
  {
    "key": "path-strongman",
    "name": "Become a strongman or strongwoman",
    "become": "Strongman",
    "discipline": "strength",
    "tagline": "Lift it, carry it, load it, press it: barbell strength turned into moving heavy objects.",
    "whoFor": "People who like being strong in awkward ways and enjoy carrying, loading and pressing odd objects. Start with no lifting background; the first stage is plain gym work.",
    "honesty": "Logs, yokes, stones and frames are rarely in a normal gym, and their technique is taught hands-on. From stage 3 you need a strongman gym or club with the implements and people who can show you how to pick, lap and load.",
    "safety": "Odd objects are dropped, not saved. Train on a clear floor, learn to bail, and build carry and stone loads slowly. Biceps tears come from curling stones and tyres with bent arms; keep arms long and lift with hips.",
    "icon": "strength.kettlebell",
    "accent": "#B8732E",
    "stages": [
      {
        "key": "s1",
        "name": "General strength base",
        "aim": "You squat, hinge, press and row with sound form, and you can carry a moderate load in each hand for 40 metres without losing posture.",
        "weeks": 6,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "squat-press",
            "label": "Squat and press",
            "sessionType": "strength",
            "focus": "Learn the squat and the standing press, with rowing and trunk work.",
            "exercises": [
              "goblet-squat",
              "back-squat",
              "overhead-press",
              "db-one-arm-row",
              "plank"
            ],
            "prescription": "Goblet squat 2 x 10, back squat 3 x 5 light, overhead press 3 x 6, row 3 x 10 per side, plank 3 x 30 s.",
            "minutes": 50
          },
          {
            "key": "hinge-carry",
            "label": "Hinge and carry",
            "sessionType": "strength",
            "focus": "Learn to pick a load off the floor with the hips, then hold and carry it.",
            "exercises": [
              "dowel-hip-hinge",
              "trap-bar-deadlift",
              "db-bench-press",
              "lat-pulldown",
              "farmers-hold",
              "suitcase-carry"
            ],
            "prescription": "Dowel hinge 2 x 10, trap bar deadlift 3 x 6, dumbbell bench 3 x 8, pulldown 3 x 10, farmer's hold 3 x 30 s, suitcase carry 3 x 20 m per side.",
            "minutes": 55
          },
          {
            "key": "full-body",
            "label": "Full body",
            "sessionType": "strength",
            "focus": "Extra leg and pressing volume, hamstrings and a first loaded carry.",
            "exercises": [
              "leg-press",
              "db-shoulder-press",
              "romanian-deadlift",
              "seated-cable-row",
              "farmers-carry",
              "dead-bug"
            ],
            "prescription": "Leg press 3 x 10, dumbbell shoulder press 3 x 8, Romanian deadlift 3 x 8, cable row 3 x 10, farmer's carry 4 x 20 m, dead bug 3 x 8 per side.",
            "minutes": 55
          }
        ],
        "gate": {
          "sessions": 14,
          "weeks": 4
        },
        "benchmarks": [
          "Squat and deadlift for 5 reps with the same form on the first and last rep.",
          "Press a barbell overhead to a full lockout without leaning back.",
          "Carry half your body weight in total for 40 m without setting it down."
        ],
        "coachNote": "Strongman is built on ordinary strength. Learn to brace and to hinge now; every event later is one of those two things under an awkward load."
      },
      {
        "key": "s2",
        "name": "Carries and odd objects",
        "aim": "You train four days a week, push your barbell lifts up steadily, and handle farmer's walks, sandbag carries and a sandbag to the shoulder.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "squat",
            "label": "Squat day",
            "sessionType": "strength",
            "focus": "Back and front squat for leg and upper-back strength, then trunk work.",
            "exercises": [
              "back-squat",
              "front-squat",
              "walking-lunge",
              "back-extension",
              "weighted-plank"
            ],
            "prescription": "Back squat 4 x 5, front squat 3 x 5, walking lunge 3 x 10 per leg, back extension 3 x 12, weighted plank 3 x 30 s.",
            "minutes": 65
          },
          {
            "key": "press",
            "label": "Press day",
            "sessionType": "strength",
            "focus": "Strict press and push press, triceps and upper back.",
            "exercises": [
              "overhead-press",
              "push-press",
              "bench-press-close-grip",
              "pull-up",
              "face-pull"
            ],
            "prescription": "Overhead press 4 x 5, push press 3 x 5, close-grip bench 3 x 8, pull-ups 4 sets short of failure, face pull 3 x 15.",
            "minutes": 60
          },
          {
            "key": "deadlift",
            "label": "Deadlift day",
            "sessionType": "strength",
            "focus": "Pull from the floor, hamstrings, upper back and thick-bar grip.",
            "exercises": [
              "deadlift",
              "romanian-deadlift",
              "barbell-row",
              "barbell-shrug",
              "fat-grip-hold"
            ],
            "prescription": "Deadlift 4 x 4, Romanian deadlift 3 x 8, barbell row 4 x 8, shrug 3 x 12, thick-bar hold 3 x 20-30 s.",
            "minutes": 65
          },
          {
            "key": "carry",
            "label": "Carry day",
            "sessionType": "strength",
            "focus": "Farmer's walk, sandbag carry and the first ground-to-shoulder work.",
            "exercises": [
              "farmers-carry",
              "sandbag-carry",
              "sandbag-clean-press",
              "strongman-sandbag-to-shoulder",
              "overhead-carry",
              "sled-push"
            ],
            "prescription": "Farmer's carry 5 x 20 m, sandbag carry 4 x 20 m, sandbag clean and press 3 x 5, sandbag to shoulder 3 x 3 per side, overhead carry 3 x 15 m, sled 4 x 20 m.",
            "minutes": 60
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6,
          "overallTier": 1
        },
        "benchmarks": [
          "Farmer's walk your own body weight in total for 20 m with a fast pick.",
          "Lap and shoulder a sandbag of about half your body weight on both sides.",
          "Push press more than you can strict press by a clear margin."
        ],
        "coachNote": "Carries are a skill: fast pick, short quick steps, eyes up. Do not go heavier until the run looks smooth at the current weight."
      },
      {
        "key": "s3",
        "name": "Log, axle and yoke",
        "aim": "You clean and press a log and an axle, walk a yoke for 15-20 metres, and pull from a frame, with barbell strength still rising behind it.",
        "weeks": 10,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "press",
            "label": "Log and axle press",
            "sessionType": "strength",
            "focus": "Learn the log clean from the lap and the axle continental or clean, then press.",
            "exercises": [
              "strongman-log-press",
              "strongman-axle-clean-press",
              "z-press",
              "db-incline-press",
              "triceps-pushdown",
              "band-pull-apart"
            ],
            "prescription": "Log clean and press 5 x 3, axle clean and press 4 x 3, Z-press 3 x 8, incline dumbbell 3 x 10, pushdown 3 x 12, pull-aparts 3 x 20.",
            "minutes": 70
          },
          {
            "key": "squat-yoke",
            "label": "Squat and yoke",
            "sessionType": "strength",
            "focus": "Heavy squats, then yoke walks and front-loaded squatting for stone strength.",
            "exercises": [
              "back-squat",
              "strongman-yoke-carry",
              "zercher-squat",
              "glute-ham-raise",
              "ab-wheel-rollout"
            ],
            "prescription": "Back squat 5 x 4, yoke 5 x 15 m starting near your body weight, Zercher squat 3 x 6, glute-ham raise 3 x 8, rollout 3 x 10.",
            "minutes": 70
          },
          {
            "key": "deadlift",
            "label": "Deadlift day",
            "sessionType": "strength",
            "focus": "Floor and deficit pulls, frame deadlift for reps, rows and pinch grip.",
            "exercises": [
              "deadlift",
              "deficit-deadlift",
              "strongman-frame-deadlift-reps",
              "t-bar-row",
              "plate-pinch"
            ],
            "prescription": "Deadlift 4 x 3, deficit deadlift 3 x 5, frame deadlift 2 x 8-10, T-bar row 4 x 8, plate pinch 3 x 20 s.",
            "minutes": 70
          },
          {
            "key": "events",
            "label": "Event practice",
            "sessionType": "strength",
            "focus": "Moving events at moderate load for clean technique, plus power from the floor.",
            "exercises": [
              "power-clean",
              "farmers-carry",
              "strongman-sandbag-to-shoulder",
              "tire-flip",
              "sled-push"
            ],
            "prescription": "Power clean 4 x 3, farmer's carry 4 x 20 m with a turn, sandbag to shoulder 4 x 2 per side, tyre flip 4 x 4, sled 4 x 20 m.",
            "minutes": 65
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 8,
          "overallTier": 2
        },
        "benchmarks": [
          "Log clean and press for 3 reps with the log rolled high on the chest before the dip.",
          "Yoke walk of 20 m without a drop and without the yoke swinging.",
          "Frame or trap bar deadlift for 8 reps with a locked-out finish on each one."
        ],
        "coachNote": "Implement technique first, load second. A log pressed from a poor rack position stalls for years; find a gym with the kit and ask to be shown."
      },
      {
        "key": "s4",
        "name": "Events and medleys",
        "aim": "You train two event days a week, run timed medleys, lift stones or heavy sandbags to a platform, and keep one heavy press and one heavy lower day.",
        "weeks": 10,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "press",
            "label": "Overhead day",
            "sessionType": "strength",
            "focus": "Log for a top set, circus dumbbell, leg-drive pressing and upper back.",
            "exercises": [
              "strongman-log-press",
              "strongman-circus-dumbbell",
              "push-jerk",
              "bench-press-incline-barbell",
              "seal-row",
              "face-pull"
            ],
            "prescription": "Log top set of 2-3 then 3 x 4 lighter, circus dumbbell 4 x 2 per side, push jerk 3 x 3, incline bench 3 x 8, seal row 4 x 8, face pull 3 x 15.",
            "minutes": 75
          },
          {
            "key": "lower",
            "label": "Heavy lower",
            "sessionType": "strength",
            "focus": "Front and box squats, partial pulls for lockout, and lower-back work.",
            "exercises": [
              "front-squat",
              "box-squat",
              "rack-pull",
              "good-morning",
              "reverse-hyperextension"
            ],
            "prescription": "Front squat 4 x 3, box squat 3 x 5, rack pull 4 x 3, good morning 3 x 8, reverse hyper 3 x 12.",
            "minutes": 75
          },
          {
            "key": "moving-events",
            "label": "Moving events",
            "sessionType": "strength",
            "focus": "Yoke, farmer's and carry medleys run against the clock.",
            "exercises": [
              "strongman-yoke-carry",
              "farmers-carry",
              "strongman-husafell-carry",
              "strongman-medley",
              "rope-sled-pull"
            ],
            "prescription": "Yoke 4 x 20 m, farmer's 4 x 20 m, Husafell or sandbag carry 2 x max distance, then one timed medley of 2-3 implements. Sled pull 3 x 15 m.",
            "minutes": 70
          },
          {
            "key": "loading-events",
            "label": "Loading and throwing",
            "sessionType": "strength",
            "focus": "Stones, kegs, tyre and wheel: hip extension under awkward loads.",
            "exercises": [
              "atlas-stone-lift",
              "strongman-keg-toss",
              "tire-flip",
              "strongman-conans-wheel",
              "kettlebell-swing"
            ],
            "prescription": "Stone to platform or shoulder 5 x 2, keg toss 6 throws, tyre flip 3 x 5, Conan's wheel 2 x max distance, kettlebell swing 3 x 15.",
            "minutes": 70
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 8,
          "overallTier": 3
        },
        "benchmarks": [
          "A two-implement medley finished inside 60 seconds without a drop.",
          "A stone or sandbag of around your body weight loaded to a chest-high platform.",
          "You recover from two event days a week without your lower back staying sore."
        ],
        "coachNote": "Events tax the back and grip far more than gym lifts of the same weight. Rotate heavy, fast and light event weeks rather than going heavy on everything."
      },
      {
        "key": "s5",
        "name": "Competition preparation",
        "aim": "You train the exact events, weights and distances of a chosen novice or open competition, rehearse them in order, and arrive rested.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "contest-press",
            "label": "Contest press",
            "sessionType": "strength",
            "focus": "The press event from your competition, at contest weight and format.",
            "exercises": [
              "strongman-log-press",
              "strongman-axle-clean-press",
              "push-press",
              "lat-pulldown",
              "band-pull-apart"
            ],
            "prescription": "Contest implement: build to contest weight, then the contest format (max reps in 60 s or max weight). Second implement 3 x 3, push press 3 x 5, pulldown 3 x 10.",
            "minutes": 70
          },
          {
            "key": "contest-lower",
            "label": "Contest deadlift and squat",
            "sessionType": "strength",
            "focus": "The deadlift event as written, with squat kept in for strength.",
            "exercises": [
              "strongman-frame-deadlift-reps",
              "deadlift",
              "back-squat",
              "back-extension",
              "weighted-plank"
            ],
            "prescription": "Contest deadlift format once a fortnight; other weeks deadlift 3 x 3 at 80%. Squat 3 x 4, back extension 3 x 10, weighted plank 3 x 30 s.",
            "minutes": 70
          },
          {
            "key": "rehearsal",
            "label": "Event rehearsal",
            "sessionType": "strength",
            "focus": "Contest events in contest order, with contest rest between them.",
            "exercises": [
              "strongman-yoke-carry",
              "farmers-carry",
              "strongman-medley",
              "atlas-stone-lift",
              "strongman-sandbag-to-shoulder"
            ],
            "prescription": "Run 3-4 contest events in order at 90-100% of contest weight, one full run each. Last full rehearsal 10-14 days out, then cut loads by a third.",
            "minutes": 90
          },
          {
            "key": "conditioning",
            "label": "Conditioning and recovery",
            "sessionType": "cardio",
            "focus": "Short hard efforts that match event length, then mobility for hips and back.",
            "exercises": [
              "sled-push",
              "loaded-carry-cardio",
              "assault-bike",
              "hip-mobility",
              "foam-rolling"
            ],
            "prescription": "Sled 6 x 20 m, light carry 4 x 40 m, air bike 6 x 30 s hard with 90 s easy, then 10 min hip mobility and rolling.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6,
          "overallTier": 3
        },
        "benchmarks": [
          "You have done every contest event at contest weight at least twice.",
          "You know the rules for each event: start commands, drops, time limits, allowed kit.",
          "You have a plan for food, warm-ups and chalk or tacky on the day."
        ],
        "coachNote": "Pick a novice competition and train for that event list, not for strongman in general. The last week is for rest and travel, not for proving anything."
      }
    ]
  },
  {
    "key": "path-calisthenics",
    "name": "Become a calisthenics athlete",
    "become": "Calisthenics athlete",
    "discipline": "skill",
    "tagline": "From a first push-up to muscle-ups, handstands and levers, on a bar and the floor.",
    "whoFor": "People who want strength they can show on a bar, with little equipment. You can start without being able to do a single pull-up.",
    "honesty": "Handstands, levers and muscle-ups depend on body positions you cannot see yourself. Film often, and learn dynamic or freestyle moves with experienced people at a park or gym. Skill timelines vary a lot with body weight and limb length.",
    "safety": "Wrists, elbows and shoulders adapt slower than muscle. Warm up wrists every session, add straight-arm work gradually, and back off at the first sign of tendon pain rather than training through it.",
    "icon": "strength.calisthenics",
    "accent": "#2E9E8F",
    "stages": [
      {
        "key": "s1",
        "name": "Bodyweight foundations",
        "aim": "You can do clean push-ups, rows under a low bar, a 30-second hollow hold and a 30-second dead hang with shoulders active.",
        "weeks": 6,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "push",
            "label": "Push day",
            "sessionType": "calisthenics",
            "focus": "Push-up progressions with a rigid body line, plus trunk holds.",
            "exercises": [
              "wrist-mobility",
              "incline-pushup",
              "knee-push-up",
              "push-up",
              "plank",
              "hollow-body-hold"
            ],
            "prescription": "Wrist prep 3 min. Pick the push-up level where you get 3 x 6-10 clean reps. Plank 3 x 30 s, hollow hold 3 x 15-20 s.",
            "minutes": 40
          },
          {
            "key": "pull",
            "label": "Pull day",
            "sessionType": "calisthenics",
            "focus": "Hanging, shoulder blade control and horizontal pulling.",
            "exercises": [
              "dead-hang",
              "scapular-pull-up",
              "inverted-row",
              "superman-hold",
              "dead-bug"
            ],
            "prescription": "Dead hang 4 x 15-30 s, scapular pull-ups 3 x 8, inverted row 4 x 6-10, superman hold 3 x 20 s, dead bug 3 x 8 per side.",
            "minutes": 40
          },
          {
            "key": "legs-core",
            "label": "Legs and core",
            "sessionType": "calisthenics",
            "focus": "Squat, lunge and bridge patterns through full range, and side trunk strength.",
            "exercises": [
              "bodyweight-squat",
              "bodyweight-reverse-lunge",
              "glute-bridge",
              "calf-raise-step",
              "hollow-body-hold",
              "side-plank"
            ],
            "prescription": "Squat 3 x 15, reverse lunge 3 x 10 per leg, glute bridge 3 x 15, calf raise 3 x 15, hollow hold 3 x 20 s, side plank 3 x 20 s per side.",
            "minutes": 40
          }
        ],
        "gate": {
          "sessions": 14,
          "weeks": 4
        },
        "benchmarks": [
          "10 push-ups with chest to the floor and no sagging hips.",
          "10 inverted rows with the chest touching the bar.",
          "Dead hang and hollow hold for 30 seconds each."
        ],
        "coachNote": "Every later skill is a hollow body plus active shoulders. Learn those two positions now and hold them on every rep."
      },
      {
        "key": "s2",
        "name": "First pull-ups and dips",
        "aim": "You can do your first strict pull-ups and parallel-bar dips, hold a support position with locked arms, and balance a short crow pose.",
        "weeks": 8,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "pull",
            "label": "Pull-up day",
            "sessionType": "calisthenics",
            "focus": "Negatives, assisted reps and holds at the top to build the first pull-up.",
            "exercises": [
              "negative-pull-up",
              "band-assisted-pull-up",
              "flexed-arm-hang",
              "inverted-row-feet-elevated",
              "hanging-knee-raise"
            ],
            "prescription": "Negatives 5 x 3 with a 5 s lowering, band-assisted pull-ups 3 x 6, flexed-arm hang 3 x 10-15 s, elevated rows 3 x 8, knee raises 3 x 8.",
            "minutes": 50
          },
          {
            "key": "push",
            "label": "Dip day",
            "sessionType": "calisthenics",
            "focus": "Support strength on bars, dip negatives and overhead pushing basics.",
            "exercises": [
              "parallel-bar-support-hold",
              "negative-dip",
              "bench-dip",
              "push-up",
              "pike-push-up",
              "scapular-push-up"
            ],
            "prescription": "Support hold 4 x 20 s, negative dips 4 x 4, bench dips 2 x 10, push-ups 3 x 10-15, pike push-ups 3 x 6, scapular push-ups 2 x 12.",
            "minutes": 50
          },
          {
            "key": "legs",
            "label": "Leg day",
            "sessionType": "calisthenics",
            "focus": "Single-leg strength and hamstring work toward the pistol squat.",
            "exercises": [
              "bodyweight-split-squat",
              "step-ups",
              "assisted-pistol-squat",
              "cossack-squat",
              "nordic-negative",
              "single-leg-calf-raise"
            ],
            "prescription": "Split squat 3 x 12 per leg, step-ups 3 x 10, box pistols 3 x 5, Cossack squat 2 x 8, Nordic negatives 3 x 4, calf raise 3 x 12 per leg.",
            "minutes": 50
          },
          {
            "key": "skill-core",
            "label": "Balance and core",
            "sessionType": "calisthenics",
            "focus": "First hand-balancing, wall handstand time and compression strength.",
            "exercises": [
              "wrist-mobility",
              "crow-pose",
              "wall-handstand",
              "tuck-l-sit",
              "hollow-rock"
            ],
            "prescription": "Wrist prep 5 min, crow pose 6 x 10 s attempts, chest-to-wall handstand 4 x 20-30 s, tuck L-sit 5 x 10 s, hollow rocks 3 x 12.",
            "minutes": 40
          }
        ],
        "gate": {
          "sessions": 26,
          "weeks": 6
        },
        "benchmarks": [
          "3 strict pull-ups from a dead hang, chin over the bar, no kick.",
          "5 parallel-bar dips to at least a 90-degree elbow.",
          "30-second chest-to-wall handstand with a straight body."
        ],
        "coachNote": "Frequent, clean, sub-maximal sets build the first pull-up faster than fighting for one ugly rep. Stop each set while the reps still look good."
      },
      {
        "key": "s3",
        "name": "Weighted basics",
        "aim": "You have 10 pull-ups and 12 dips, add load to both, squat on one leg, and hold an L-sit and a tuck front lever.",
        "weeks": 10,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "pull",
            "label": "Weighted pull",
            "sessionType": "calisthenics",
            "focus": "Loaded pull-ups, one-arm-biased rows and hanging compression.",
            "exercises": [
              "weighted-pull-up",
              "chin-up",
              "archer-row",
              "l-hang",
              "hanging-leg-raise"
            ],
            "prescription": "Weighted pull-up 5 x 4, chin-ups 3 x 8, archer rows 3 x 6 per side, L-hang 4 x 15 s, hanging leg raise 3 x 8.",
            "minutes": 60
          },
          {
            "key": "push",
            "label": "Weighted push",
            "sessionType": "calisthenics",
            "focus": "Loaded dips, harder push-up variations and first planche leaning.",
            "exercises": [
              "weighted-dip-triceps",
              "elevated-pike-push-up",
              "push-up-archer",
              "pseudo-planche-pushup",
              "ring-support-hold"
            ],
            "prescription": "Weighted dip 5 x 5, elevated pike push-up 4 x 6, archer push-up 3 x 6 per side, pseudo-planche push-up 3 x 8, ring support 3 x 20 s.",
            "minutes": 60
          },
          {
            "key": "legs",
            "label": "Single-leg strength",
            "sessionType": "calisthenics",
            "focus": "Pistol and shrimp squats, full Nordic curls and jumping.",
            "exercises": [
              "pistol-squat",
              "shrimp-squat",
              "nordic-curl",
              "jump-squat",
              "single-leg-glute-bridge",
              "tibialis-raise"
            ],
            "prescription": "Pistol squat 4 x 4 per leg, shrimp squat 3 x 5, Nordic curl 3 x 5, jump squat 3 x 8, single-leg bridge 3 x 12, tibialis raise 2 x 15.",
            "minutes": 55
          },
          {
            "key": "skill",
            "label": "Skill day",
            "sessionType": "calisthenics",
            "focus": "Handstand line, L-sit and the first lever shapes, all done fresh.",
            "exercises": [
              "wall-handstand",
              "handstand-wall-walk",
              "l-sit",
              "tuck-front-lever",
              "skin-the-cat",
              "false-grip-hang"
            ],
            "prescription": "Wall handstand 5 x 30 s, wall walks 3 x 3, L-sit 6 x 10 s, tuck front lever 5 x 10 s, skin the cat 3 x 3, false grip hang 3 x 15 s.",
            "minutes": 50
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 8
        },
        "benchmarks": [
          "10 strict pull-ups and 12 dips in one set each.",
          "One pull-up and one dip with about a quarter of your body weight added.",
          "3 pistol squats per leg and a 15-second L-sit."
        ],
        "coachNote": "Skills are strength in disguise. The muscle-up and lever come quickly to people with heavy weighted pull-ups and dips, and slowly to everyone else."
      },
      {
        "key": "s4",
        "name": "Muscle-up, handstand, levers",
        "aim": "You can do a strict bar muscle-up, hold a freestanding handstand for 15 seconds, and hold an advanced tuck front lever and tuck back lever.",
        "weeks": 12,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "muscle-up",
            "label": "Muscle-up day",
            "sessionType": "calisthenics",
            "focus": "High explosive pulls, the transition, and straight-bar dips.",
            "exercises": [
              "explosive-pull-up",
              "chest-to-bar-pull-up",
              "muscle-up-negative",
              "straight-bar-dip",
              "muscle-up",
              "false-grip-hang"
            ],
            "prescription": "Explosive pull-ups 5 x 3, chest-to-bar 3 x 5, muscle-up negatives 4 x 3, straight-bar dips 3 x 8, then muscle-up singles, 5-8 attempts with full rest.",
            "minutes": 60
          },
          {
            "key": "handstand",
            "label": "Handstand day",
            "sessionType": "calisthenics",
            "focus": "Freestanding balance, wall handstand push-ups and planche leaning.",
            "exercises": [
              "wrist-mobility",
              "wall-handstand-shoulder-tap",
              "handstand-hold",
              "wall-handstand-pushup",
              "planche-lean",
              "tuck-planche"
            ],
            "prescription": "Wrist prep 5 min, shoulder taps 3 x 10, 15 min of freestanding kick-ups, wall handstand push-ups 4 x 4, planche lean 4 x 15 s, tuck planche 5 x 8 s.",
            "minutes": 60
          },
          {
            "key": "lever",
            "label": "Lever day",
            "sessionType": "calisthenics",
            "focus": "Front and back lever progressions with weighted pulling to support them.",
            "exercises": [
              "advanced-tuck-front-lever",
              "front-lever-raise",
              "tuck-back-lever",
              "weighted-pull-up",
              "dragon-flag",
              "toes-to-bar"
            ],
            "prescription": "Advanced tuck front lever 6 x 8 s, tuck lever raises 3 x 5, tuck back lever 4 x 10 s, weighted pull-up 4 x 4, dragon flag 3 x 4, toes-to-bar 3 x 8.",
            "minutes": 60
          },
          {
            "key": "legs",
            "label": "Legs and hips",
            "sessionType": "calisthenics",
            "focus": "Keep single-leg strength and power while the upper body does skill work.",
            "exercises": [
              "pistol-squat",
              "skater-squat",
              "sissy-squat",
              "nordic-curl",
              "broad-jump",
              "copenhagen-plank"
            ],
            "prescription": "Pistol squat 4 x 6 per leg, skater squat 3 x 6, sissy squat 3 x 8, Nordic curl 4 x 5, broad jump 4 x 3, Copenhagen plank 3 x 20 s per side.",
            "minutes": 50
          }
        ],
        "gate": {
          "sessions": 38,
          "weeks": 10
        },
        "benchmarks": [
          "One strict muscle-up with no kip and both arms turning over together.",
          "A 15-second freestanding handstand, entered with a controlled kick-up.",
          "A 10-second advanced tuck front lever with hips at shoulder height."
        ],
        "coachNote": "Practise skills first in the session, fresh, in short holds with long rests. Tired skill practice trains the wrong position."
      },
      {
        "key": "s5",
        "name": "Statics and park sessions",
        "aim": "You link muscle-ups, levers and handstands into short routines, train straddle-level statics, and run your own park sessions.",
        "weeks": 12,
        "sessionsPerWeek": 5,
        "days": [
          {
            "key": "static-pull",
            "label": "Pulling statics",
            "sessionType": "calisthenics",
            "focus": "Straddle front lever, back lever and one-arm pulling progressions.",
            "exercises": [
              "straddle-front-lever",
              "front-lever-hold",
              "back-lever-hold",
              "one-arm-pull-up",
              "ice-cream-maker",
              "weighted-pull-up"
            ],
            "prescription": "Straddle front lever 6 x 6-8 s, hardest full-lever progression 3 x 5 s, back lever 4 x 10 s, one-arm progression 4 x 2 per side, ice cream makers 3 x 5, weighted pull-up 3 x 3.",
            "minutes": 70
          },
          {
            "key": "static-push",
            "label": "Pushing statics",
            "sessionType": "calisthenics",
            "focus": "Handstand push-ups, press to handstand and planche progressions.",
            "exercises": [
              "handstand-hold",
              "handstand-push-up",
              "press-to-handstand",
              "advanced-tuck-planche",
              "tuck-planche-push-up",
              "straddle-planche"
            ],
            "prescription": "Handstand 5 x 30 s, handstand push-up 4 x 4, press progression 4 x 3, advanced tuck planche 5 x 8 s, tuck planche push-up 3 x 5, straddle attempts 4 x 3-5 s.",
            "minutes": 70
          },
          {
            "key": "dynamics",
            "label": "Bar and ring dynamics",
            "sessionType": "calisthenics",
            "focus": "Muscle-up volume on bar and rings, and moving handstands.",
            "exercises": [
              "muscle-up",
              "ring-muscle-up",
              "typewriter-pull-up",
              "ring-dip",
              "handstand-walk"
            ],
            "prescription": "Bar muscle-up 5 x 3, ring muscle-up 4 x 2, typewriter pull-up 3 x 4 per side, ring dip 3 x 8, handstand walk 5 x 5-10 m.",
            "minutes": 60
          },
          {
            "key": "legs-mobility",
            "label": "Legs and mobility",
            "sessionType": "calisthenics",
            "focus": "Advanced single-leg work plus the compression and bridge range statics need.",
            "exercises": [
              "dragon-pistol-squat",
              "pistol-squat",
              "nordic-curl",
              "pike-compression",
              "v-sit",
              "full-bridge"
            ],
            "prescription": "Dragon pistol 3 x 4 per leg, pistol 3 x 8, Nordic curl 4 x 6, pike compression 3 x 10, V-sit 5 x 8 s, full bridge 4 x 15 s.",
            "minutes": 55
          },
          {
            "key": "park",
            "label": "Park session",
            "sessionType": "calisthenics",
            "focus": "Open session outdoors: link moves into short routines and train with other people.",
            "exercises": [
              "calisthenics-park",
              "muscle-up",
              "human-flag",
              "clutch-flag",
              "l-sit-pull-up",
              "elbow-lever"
            ],
            "prescription": "60-75 min at a park. Build 3-5 move combinations, 6-8 rounds with full rest. Flag work 5 x 5 s per side. Finish with L-sit pull-ups 3 x 5.",
            "minutes": 75
          }
        ],
        "gate": {
          "sessions": 48,
          "weeks": 10
        },
        "benchmarks": [
          "5 strict muscle-ups in a row and a muscle-up into a held L-sit or lever.",
          "A 5-second straddle front lever and a 30-second freestanding handstand.",
          "A 30-second routine of at least four linked moves without coming off the bar."
        ],
        "coachNote": "Straight-arm statics take years, not months. Cycle hard and easy weeks, keep weighted basics in the plan, and let elbows and wrists set the pace."
      }
    ]
  },
  {
    "key": "path-climber",
    "name": "Become a climber",
    "become": "Climber",
    "discipline": "skill",
    "tagline": "Footwork first, then ropes, lead falls and board training, ending on real rock.",
    "whoFor": "Anyone who can hang from a bar for a few seconds and climb a ladder. Stage 1 is indoor bouldering on the easiest grades; no strength base is required.",
    "honesty": "Belaying, lead climbing, clipping and anchor cleaning must be learned in person from a qualified instructor and checked before you use them. The app cannot teach rope safety and will not pretend to. Outdoors, go with an experienced partner.",
    "safety": "Falls and finger pulley injuries are the main risks. Learn to fall on mats, check knots and belay devices with your partner every climb, wear a helmet outdoors, and keep off small edges and hangboards for the first year.",
    "icon": "cardio.elevation",
    "accent": "#8A6FD1",
    "stages": [
      {
        "key": "s1",
        "name": "Bouldering and footwork",
        "aim": "Climb the easiest two grades at your wall with quiet, precise feet and straight arms, and fall or step down onto mats under control.",
        "weeks": 8,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "movement",
            "label": "Movement session",
            "sessionType": "sport",
            "focus": "Easy boulders with attention on feet, hips and straight arms",
            "exercises": [
              "climbing-silent-feet-drill",
              "climbing-indoor-bouldering",
              "climbing"
            ],
            "prescription": "15 min easy climbing as a warm-up, 15 min silent feet on the easiest problems, then 45 min trying 8-10 problems with 2-3 min rest between attempts.",
            "minutes": 80
          },
          {
            "key": "volume",
            "label": "Easy volume",
            "sessionType": "sport",
            "focus": "Many easy problems to build a movement library",
            "exercises": [
              "climbing-indoor-bouldering",
              "climbing-silent-feet-drill",
              "climbing-antagonist-circuit"
            ],
            "prescription": "Climb 15-20 problems well within your level, down-climbing where you can. Finish with 2 rounds of the antagonist circuit.",
            "minutes": 70
          },
          {
            "key": "strength",
            "label": "General strength",
            "sessionType": "calisthenics",
            "focus": "Pulling base, trunk and shoulder stability off the wall",
            "exercises": [
              "dead-hang",
              "inverted-row",
              "scapular-pull-up",
              "push-up-incline",
              "hollow-body-hold",
              "bodyweight-squat"
            ],
            "prescription": "3 x 20 s dead hang on a bar, 3 x 8 inverted row, 3 x 6 scapular pull-ups, 3 x 8 incline push-ups, 3 x 20 s hollow hold, 3 x 12 squats.",
            "minutes": 35
          },
          {
            "key": "mobility",
            "label": "Hip and wrist mobility",
            "sessionType": "mindbody",
            "focus": "Open hips for high steps; prepare wrists and forearms",
            "exercises": [
              "hip-mobility",
              "frog-stretch",
              "wrist-mobility",
              "shoulder-mobility",
              "deep-squat-hold"
            ],
            "prescription": "8 min hip routine, 2 x 45 s frog stretch, 5 min wrist prep, 6 min shoulder routine, 2 x 45 s deep squat hold.",
            "minutes": 25
          }
        ],
        "gate": {
          "sessions": 19,
          "weeks": 6
        },
        "benchmarks": [
          "Climb ten easy problems in a session without feet slipping or scraping",
          "Fall from low on the wall and land on bent legs, rolling back",
          "Hang from a bar with straight arms for 30 seconds"
        ],
        "coachNote": "Look at your foot until it is placed. Beginners pull with their arms because they do not trust their feet, and trust only comes from watching them land."
      },
      {
        "key": "s2",
        "name": "Top-rope and endurance",
        "aim": "Tie in and belay top-rope after instruction, climb routes of 10-15 m without resting on the rope, and do 15 minutes of continuous easy climbing.",
        "weeks": 10,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "top-rope",
            "label": "Top-rope routes",
            "sessionType": "sport",
            "focus": "Longer routes, resting positions and pacing",
            "exercises": [
              "climbing-indoor-bouldering",
              "climbing-top-rope",
              "climbing-silent-feet-drill"
            ],
            "prescription": "Only after a belay course. 15 min easy bouldering, then 6-8 top-rope routes, swapping with your partner, shaking out at each good hold.",
            "minutes": 90
          },
          {
            "key": "endurance",
            "label": "ARC endurance laps",
            "sessionType": "sport",
            "focus": "Continuous easy climbing to build forearm endurance",
            "exercises": [
              "climbing-top-rope",
              "climbing-arc-training",
              "climbing-antagonist-circuit"
            ],
            "prescription": "Warm up on 2 easy routes, then 2-3 x 10-15 min of continuous climbing at a light pump, 10 min rest between. Antagonist circuit to finish.",
            "minutes": 80
          },
          {
            "key": "bouldering",
            "label": "Bouldering technique",
            "sessionType": "sport",
            "focus": "Harder moves: flagging, drop knees and body tension",
            "exercises": [
              "climbing-indoor-bouldering",
              "climbing-silent-feet-drill",
              "climbing"
            ],
            "prescription": "20 min warm-up, then 50 min on problems at your limit grade and one below, repeating each send with better footwork. 3 min rest between tries.",
            "minutes": 80
          },
          {
            "key": "strength",
            "label": "Pull and push strength",
            "sessionType": "calisthenics",
            "focus": "Work towards strict pull-ups with balanced pushing",
            "exercises": [
              "negative-pull-up",
              "inverted-row-feet-elevated",
              "push-up",
              "hanging-knee-raise",
              "side-plank",
              "y-raise"
            ],
            "prescription": "4 x 4 slow negatives, 3 x 8 feet-elevated rows, 3 x 10 push-ups, 3 x 10 knee raises, 3 x 30 s side plank per side, 3 x 10 Y-raises.",
            "minutes": 40
          }
        ],
        "gate": {
          "sessions": 24,
          "weeks": 8
        },
        "benchmarks": [
          "Pass a belay check at your wall and catch a top-rope fall",
          "Climb five routes in a session without weighting the rope",
          "Stay on the wall for 15 minutes of easy climbing",
          "Three strict pull-ups from a dead hang, chin over the bar"
        ],
        "coachNote": "Do the partner check every single climb: knot, harness, belay device, locked carabiner. Experienced climbers get hurt when they skip it."
      },
      {
        "key": "s3",
        "name": "Lead and fall practice",
        "aim": "Lead indoor routes with clean clipping after a lead course, take practice falls calmly, and keep shoulders healthy with antagonist work.",
        "weeks": 10,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "lead",
            "label": "Lead climbing",
            "sessionType": "sport",
            "focus": "Clipping positions, rope management and pacing on lead",
            "exercises": [
              "climbing-top-rope",
              "climbing-lead",
              "climbing-fall-practice"
            ],
            "prescription": "Only after a lead course. Warm up on 2 top-rope routes, lead 5-6 routes two grades below your top-rope limit, then 4-6 practice falls from above a clip.",
            "minutes": 100
          },
          {
            "key": "endurance",
            "label": "Route endurance",
            "sessionType": "sport",
            "focus": "Back-to-back routes to extend time on the wall",
            "exercises": [
              "climbing-arc-training",
              "climbing-top-rope",
              "climbing-lead"
            ],
            "prescription": "15 min ARC laps, then 4 sets of 2 routes back to back with 8 min rest between sets. Choose routes you can finish while pumped.",
            "minutes": 90
          },
          {
            "key": "bouldering",
            "label": "Power bouldering",
            "sessionType": "sport",
            "focus": "Short, hard problems to raise the top end",
            "exercises": [
              "climbing-indoor-bouldering",
              "climbing-limit-bouldering",
              "climbing-silent-feet-drill"
            ],
            "prescription": "25 min progressive warm-up, 40 min on 3-4 problems near your limit with 3-4 min rest, then 10 min of easy silent-feet climbing.",
            "minutes": 80
          },
          {
            "key": "antagonist",
            "label": "Antagonist and core",
            "sessionType": "strength",
            "focus": "Pushing, rotator cuff and finger extensors to balance pulling",
            "exercises": [
              "db-shoulder-press",
              "db-bench-press",
              "band-face-pull",
              "db-external-rotation",
              "finger-extension-band",
              "reverse-wrist-curl",
              "hanging-leg-raise"
            ],
            "prescription": "3 x 10 shoulder press, 3 x 10 bench press, 3 x 15 face pull, 2 x 12 external rotation, 3 x 20 finger extensions, 2 x 15 reverse wrist curl, 3 x 8 leg raise.",
            "minutes": 40
          },
          {
            "key": "mobility",
            "label": "Mobility",
            "sessionType": "mindbody",
            "focus": "Hips, thoracic spine and forearms",
            "exercises": [
              "90-90-hip-switch",
              "pancake-stretch",
              "thoracic-mobility",
              "quadruped-wrist-rocks",
              "overhead-lat-stretch"
            ],
            "prescription": "2 x 10 hip switches, 2 x 60 s pancake, 8 min thoracic routine, 2 x 12 wrist rocks, 2 x 40 s lat stretch per side.",
            "minutes": 25
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 8
        },
        "benchmarks": [
          "Pass a lead check and lead five routes without back-clipping or z-clipping",
          "Take a planned lead fall and give a soft catch as belayer",
          "Six strict pull-ups and ten push-ups with good form"
        ],
        "coachNote": "Fear of falling limits more climbers than strength. Practise small, planned falls with a belayer you trust, and build up gradually every week."
      },
      {
        "key": "s4",
        "name": "Limit and power endurance",
        "aim": "Project boulders at your limit over several sessions, complete a full 4x4, and train on a board without finger pain.",
        "weeks": 10,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "limit",
            "label": "Limit bouldering",
            "sessionType": "sport",
            "focus": "Few, maximal attempts on moves you can barely do",
            "exercises": [
              "climbing-indoor-bouldering",
              "climbing-limit-bouldering",
              "climbing-training-board"
            ],
            "prescription": "30 min warm-up, then 45 min on 2-3 limit problems: 4-5 quality tries each with 4-5 min rest. Finish with 20 min on the board at moderate grades.",
            "minutes": 100
          },
          {
            "key": "power-endurance",
            "label": "4x4 intervals",
            "sessionType": "sport",
            "focus": "Sustained hard climbing while pumped",
            "exercises": [
              "climbing-indoor-bouldering",
              "climbing-4x4-boulder-intervals",
              "climbing-arc-training"
            ],
            "prescription": "Warm up, then 4 problems two grades below your limit climbed back to back, 4 rounds, 4 min rest between rounds. 10 min easy laps to cool down.",
            "minutes": 80
          },
          {
            "key": "lead",
            "label": "Lead projecting",
            "sessionType": "sport",
            "focus": "Working a hard route in sections, then linking it",
            "exercises": [
              "climbing-top-rope",
              "climbing-lead",
              "climbing-fall-practice"
            ],
            "prescription": "2 warm-up routes, 2 practice falls, then 3-4 attempts on a route at your limit, resting 15 min between goes. Rehearse the crux and clips.",
            "minutes": 110
          },
          {
            "key": "strength",
            "label": "Finger and pull strength",
            "sessionType": "sport",
            "focus": "Introduce hangboard work carefully, plus weighted pulling",
            "exercises": [
              "climbing-hangboard",
              "weighted-pull-up",
              "climbing-antagonist-circuit"
            ],
            "prescription": "After a full warm-up: 5 x 10 s hangs on a 20 mm edge, half crimp, feet assisted if needed, 3 min rest. Then 4 x 4 weighted pull-ups and the antagonist circuit.",
            "minutes": 60
          },
          {
            "key": "mobility",
            "label": "Recovery and mobility",
            "sessionType": "mindbody",
            "focus": "Forearm, shoulder and hip care between hard days",
            "exercises": [
              "wrist-mobility",
              "shoulder-cars",
              "hip-cars",
              "frog-stretch",
              "foam-rolling"
            ],
            "prescription": "5 min wrist prep, 2 x 5 shoulder CARs and hip CARs per side, 2 x 60 s frog stretch, 10 min foam rolling on lats and forearms.",
            "minutes": 25
          }
        ],
        "gate": {
          "sessions": 32,
          "weeks": 8
        },
        "benchmarks": [
          "Send a boulder that took at least three sessions to work out",
          "Finish all four rounds of a 4x4 without falling on the last round",
          "Hang a 20 mm edge for 10 seconds at bodyweight, pain-free"
        ],
        "coachNote": "Fingers adapt far slower than muscles. Stop the hangboard at any sharp pain in a finger or palm, and never train fingers when tired."
      },
      {
        "key": "s5",
        "name": "Outdoor sport climbing",
        "aim": "Lead bolted routes on real rock with an experienced partner, clean an anchor as taught, and keep indoor training going between trips.",
        "weeks": 12,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "rock",
            "label": "Rock day",
            "sessionType": "sport",
            "focus": "Leading bolted routes outside, well below your indoor grade",
            "exercises": [
              "climbing-outdoor-sport",
              "climbing-lead",
              "climbing-fall-practice"
            ],
            "prescription": "With an experienced partner, helmet on: 2 easy warm-up routes, then 4-6 leads starting three grades below your gym level. Rehearse anchor cleaning on the ground first.",
            "minutes": 120
          },
          {
            "key": "lead-gym",
            "label": "Indoor lead endurance",
            "sessionType": "sport",
            "focus": "Route fitness for long outdoor pitches",
            "exercises": [
              "climbing-lead",
              "climbing-arc-training",
              "climbing-top-rope"
            ],
            "prescription": "Warm up, then 3 sets of 2 lead routes back to back with 10 min rest, finishing with 15 min of ARC laps on top-rope.",
            "minutes": 100
          },
          {
            "key": "power",
            "label": "Board and limit session",
            "sessionType": "sport",
            "focus": "Keep power with one short, hard session a week",
            "exercises": [
              "climbing-training-board",
              "climbing-limit-bouldering",
              "climbing-hangboard"
            ],
            "prescription": "30 min warm-up, 40 min board or limit problems with 4 min rests, then 5 x 10 s hangs on a 20 mm edge. Skip the hangs in a week with two rock days.",
            "minutes": 80
          },
          {
            "key": "strength",
            "label": "Strength and antagonists",
            "sessionType": "calisthenics",
            "focus": "Pull strength, shoulders and trunk for steep rock",
            "exercises": [
              "pull-up",
              "archer-row",
              "dip",
              "toes-to-bar",
              "push-up",
              "dead-hang"
            ],
            "prescription": "4 x 6 pull-ups, 3 x 6 archer rows per side, 3 x 8 dips, 3 x 8 toes-to-bar, 3 x 12 push-ups, 2 x 40 s dead hang.",
            "minutes": 45
          },
          {
            "key": "approach",
            "label": "Approach fitness",
            "sessionType": "outdoor",
            "focus": "Walking uphill with a rope and rack on your back",
            "exercises": [
              "hiking",
              "rucking",
              "climbing-via-ferrata"
            ],
            "prescription": "60-90 min hike on hilly ground carrying 8-10 kg. Optionally a guided via ferrata day instead, with the correct lanyard set.",
            "minutes": 90
          }
        ],
        "gate": {
          "sessions": 38,
          "weeks": 10
        },
        "benchmarks": [
          "Lead five different outdoor routes and lower off safely each time",
          "Clean a sport anchor under supervision before doing it alone",
          "Check rock quality, bolts and the fall zone before leaving the ground",
          "Lead outside within two grades of your indoor level"
        ],
        "coachNote": "Rock is not a gym. Bolts can be old, holds can break and nobody set the route for you. Start far below your indoor grade and go with people who know the crag."
      }
    ]
  },
  {
    "key": "path-rider",
    "name": "Become a horse rider",
    "become": "Horse rider",
    "discipline": "outdoor",
    "tagline": "An independent seat first, then canter, schooling, jumping and riding across country.",
    "whoFor": "Anyone with access to a riding school who wants to ride well rather than sit as a passenger. No experience needed; stage 1 is on the lunge with an instructor.",
    "honesty": "You cannot learn to ride from an app. Every mounted session here needs a riding school, a qualified instructor and a horse suited to your level. The app plans the week, tracks it and covers fitness off the horse.",
    "safety": "Falls and kicks are real risks. Wear a certified helmet every time you mount, boots with a heel, and a body protector for jumping and cross-country. Never ride out alone, and ride only horses matched to your ability.",
    "icon": "sport.horse",
    "accent": "#9C6B3F",
    "stages": [
      {
        "key": "s1",
        "name": "Balance and rising trot",
        "aim": "Mount, walk, halt and steer on your own, and hold a rising trot on the correct diagonal for several minutes without gripping the reins.",
        "weeks": 10,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "lunge",
            "label": "Lunge lesson",
            "sessionType": "sport",
            "focus": "Seat and balance with the instructor controlling the horse",
            "exercises": [
              "equestrian-stable-work",
              "equestrian-lunge-lesson",
              "equestrian-rising-trot"
            ],
            "prescription": "15 min grooming and tacking up with help, 20-30 min on the lunge in walk and trot with arm and leg exercises, then 10 min rising trot on the lunge.",
            "minutes": 60
          },
          {
            "key": "lesson",
            "label": "Arena lesson",
            "sessionType": "sport",
            "focus": "Walk, halt, steering and first rising trot off the lunge",
            "exercises": [
              "equestrian-stable-work",
              "equestrian-rising-trot",
              "equestrian-flatwork"
            ],
            "prescription": "Tack up, then a 45 min instructor-led lesson: transitions walk to halt, large circles, and rising trot in sets of 2-3 min. Untack and brush off after.",
            "minutes": 75
          },
          {
            "key": "rider-fitness",
            "label": "Rider fitness",
            "sessionType": "calisthenics",
            "focus": "Trunk and hip strength for a still, upright seat",
            "exercises": [
              "dead-bug",
              "bird-dog",
              "glute-bridge",
              "side-plank",
              "bodyweight-squat",
              "wall-sit"
            ],
            "prescription": "3 rounds: 10 dead bugs, 8 bird-dogs per side, 15 bridges, 25 s side plank per side, 12 squats, 30 s wall sit. Rest 60 s.",
            "minutes": 30
          },
          {
            "key": "mobility",
            "label": "Hip mobility",
            "sessionType": "mindbody",
            "focus": "Open hips and adductors so the leg can hang long",
            "exercises": [
              "hip-mobility",
              "adductor-routine",
              "butterfly-stretch",
              "half-kneeling-hip-flexor-stretch",
              "cat-cow"
            ],
            "prescription": "8 min hip routine, 6 min adductor routine, 2 x 45 s butterfly, 2 x 40 s hip flexor stretch per side, 2 x 10 cat-cow.",
            "minutes": 25
          }
        ],
        "gate": {
          "sessions": 24,
          "weeks": 8
        },
        "benchmarks": [
          "Lead, groom and tack up a quiet horse with supervision",
          "Rise to the trot for 5 minutes and change diagonal when asked",
          "Walk and trot on the lunge with arms out and no reins"
        ],
        "coachNote": "Your hands are not for balance. If you catch yourself pulling on the reins to stay on, ask for more time on the lunge. Nobody outgrows it."
      },
      {
        "key": "s2",
        "name": "Seat and canter",
        "aim": "Sit the trot without bouncing, canter both reins on the correct lead in an arena, and ride short periods without stirrups.",
        "weeks": 12,
        "sessionsPerWeek": 3,
        "days": [
          {
            "key": "canter",
            "label": "Canter lesson",
            "sessionType": "sport",
            "focus": "Transitions into and out of canter, sitting deep",
            "exercises": [
              "equestrian-rising-trot",
              "equestrian-sitting-trot",
              "equestrian-canter-work"
            ],
            "prescription": "10 min walk and rising trot to warm up, 10 min sitting trot in short sets, then canter transitions on each rein, 1-2 circuits at a time, under instruction.",
            "minutes": 60
          },
          {
            "key": "seat",
            "label": "No-stirrups and lunge",
            "sessionType": "sport",
            "focus": "A deeper, independent seat through work without stirrups",
            "exercises": [
              "equestrian-lunge-lesson",
              "equestrian-no-stirrups",
              "equestrian-sitting-trot"
            ],
            "prescription": "15 min on the lunge, then 3-4 x 3 min without stirrups in walk and sitting trot with rests between. Take the stirrups back before you start gripping.",
            "minutes": 50
          },
          {
            "key": "yard",
            "label": "Stable work and hack",
            "sessionType": "sport",
            "focus": "Horse care and a quiet ride out in company",
            "exercises": [
              "equestrian-stable-work",
              "equestrian-trail-ride",
              "equestrian-rising-trot"
            ],
            "prescription": "45 min mucking out, grooming and tack cleaning, then a 45 min escorted hack in walk and trot. Always with an instructor or experienced rider.",
            "minutes": 100
          },
          {
            "key": "rider-fitness",
            "label": "Rider strength",
            "sessionType": "strength",
            "focus": "Hips, adductors and trunk against rotation",
            "exercises": [
              "goblet-squat",
              "db-romanian-deadlift",
              "pallof-press",
              "clamshell",
              "copenhagen-plank",
              "suitcase-carry"
            ],
            "prescription": "3 x 10 goblet squat, 3 x 10 Romanian deadlift, 3 x 10 Pallof press per side, 2 x 15 clamshell, 2 x 15 s Copenhagen plank, 3 x 20 m suitcase carry per side.",
            "minutes": 40
          },
          {
            "key": "mobility",
            "label": "Mobility and balance",
            "sessionType": "mindbody",
            "focus": "Pelvic control and balance for following the horse",
            "exercises": [
              "pilates-core",
              "90-90-hip-switch",
              "balance-training",
              "frog-stretch",
              "thoracic-mobility"
            ],
            "prescription": "15 min Pilates core series, 2 x 10 hip switches, 5 min balance work, 2 x 45 s frog stretch, 6 min thoracic routine.",
            "minutes": 35
          }
        ],
        "gate": {
          "sessions": 29,
          "weeks": 10
        },
        "benchmarks": [
          "Canter a 20 m circle on each rein and return to trot when you choose",
          "Sit the trot for 2 minutes with relaxed hips and quiet hands",
          "Ride 5 minutes without stirrups in walk and trot"
        ],
        "coachNote": "Canter is learned in the transitions, not by going round and round. Ask for many short canters and prepare each one properly."
      },
      {
        "key": "s3",
        "name": "Schooling and trail riding",
        "aim": "School a horse through accurate circles, transitions and changes of rein, and ride out for an hour or more over varied ground in company.",
        "weeks": 12,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "flatwork",
            "label": "Flatwork schooling",
            "sessionType": "sport",
            "focus": "Accuracy, rhythm and contact: school figures and transitions",
            "exercises": [
              "equestrian-rising-trot",
              "equestrian-flatwork",
              "equestrian-canter-work",
              "equestrian-sitting-trot"
            ],
            "prescription": "10 min loose-rein walk and trot, 30 min of 20 m and 15 m circles, serpentines and transitions within and between paces, 10 min canter, 10 min cool-down walk.",
            "minutes": 60
          },
          {
            "key": "trail",
            "label": "Trail ride",
            "sessionType": "sport",
            "focus": "Balance over hills and uneven ground, riding in a group",
            "exercises": [
              "equestrian-stable-work",
              "equestrian-trail-ride",
              "equestrian-canter-work"
            ],
            "prescription": "Tack up and check girth and hooves, then 60-90 min hack with trot and controlled canter stretches where the ground is safe. Walk the last 10 min home.",
            "minutes": 120
          },
          {
            "key": "seat",
            "label": "Seat and poles",
            "sessionType": "sport",
            "focus": "No-stirrups work and ground poles as preparation for jumping",
            "exercises": [
              "equestrian-no-stirrups",
              "equestrian-sitting-trot",
              "equestrian-flatwork"
            ],
            "prescription": "10 min warm-up, 3 x 5 min without stirrups including canter if secure, then 20 min over ground poles in trot and canter in a light seat.",
            "minutes": 55
          },
          {
            "key": "rider-fitness",
            "label": "Rider strength",
            "sessionType": "strength",
            "focus": "Leg endurance for light seat and a stable upper body",
            "exercises": [
              "bulgarian-split-squat",
              "single-leg-db-deadlift",
              "barbell-hip-thrust",
              "hip-adduction-machine",
              "seated-cable-row",
              "stir-the-pot"
            ],
            "prescription": "3 x 8 split squat per leg, 3 x 8 single-leg deadlift, 3 x 10 hip thrust, 3 x 12 adduction, 3 x 10 row, 3 x 10 stir the pot.",
            "minutes": 45
          },
          {
            "key": "mobility",
            "label": "Mobility",
            "sessionType": "mindbody",
            "focus": "Hips, lower back and shoulders after long hours in the saddle",
            "exercises": [
              "hip-cars",
              "pigeon-pose",
              "couch-stretch",
              "open-book-thoracic-rotation",
              "childs-pose"
            ],
            "prescription": "2 x 5 hip CARs per side, 2 x 60 s pigeon per side, 2 x 45 s couch stretch, 2 x 8 open books, 60 s child's pose.",
            "minutes": 20
          }
        ],
        "gate": {
          "sessions": 38,
          "weeks": 10
        },
        "benchmarks": [
          "Ride a 15 m circle in trot that is round and the same size each time",
          "Hack out for an hour in a group, keeping a safe distance",
          "Hold a light seat in trot over a line of poles",
          "Catch, tack up and turn out a horse unaided"
        ],
        "coachNote": "Ride the transition before the movement. A horse that is listening in walk-trot-walk will be listening in everything else."
      },
      {
        "key": "s4",
        "name": "Jumping and dressage",
        "aim": "Jump a small course of 60-80 cm in a balanced rhythm and ride an introductory dressage test accurately from memory.",
        "weeks": 12,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "jumping",
            "label": "Show jumping lesson",
            "sessionType": "sport",
            "focus": "Light seat, rhythm and straightness over small fences",
            "exercises": [
              "equestrian-flatwork",
              "equestrian-canter-work",
              "equestrian-show-jumping"
            ],
            "prescription": "Instructor present, helmet and body protector. 20 min flat warm-up, poles and a cross-pole, grids, then a course of 6-8 fences at 60-80 cm ridden twice.",
            "minutes": 60
          },
          {
            "key": "dressage",
            "label": "Dressage test practice",
            "sessionType": "sport",
            "focus": "Accuracy at the markers and smooth transitions",
            "exercises": [
              "equestrian-flatwork",
              "equestrian-sitting-trot",
              "equestrian-dressage-test"
            ],
            "prescription": "20 min schooling the test movements separately, then ride the full test twice with 5 min walk between. Have someone call or score it if possible.",
            "minutes": 60
          },
          {
            "key": "hack",
            "label": "Conditioning hack",
            "sessionType": "sport",
            "focus": "Fitness work for horse and rider outside the arena",
            "exercises": [
              "equestrian-stable-work",
              "equestrian-trail-ride",
              "equestrian-no-stirrups"
            ],
            "prescription": "Yard duties, then 75 min hack with hill work in trot and 2-3 steady canters. 5 min without stirrups in walk on the way home.",
            "minutes": 110
          },
          {
            "key": "rider-fitness",
            "label": "Strength and power",
            "sessionType": "strength",
            "focus": "Leg strength for the jumping position and shock absorption",
            "exercises": [
              "front-squat",
              "romanian-deadlift",
              "db-lateral-lunge",
              "cable-hip-adduction",
              "landmine-anti-rotation-press",
              "back-extension"
            ],
            "prescription": "3 x 6 front squat, 3 x 8 Romanian deadlift, 3 x 8 lateral lunge per side, 3 x 12 adduction, 3 x 8 anti-rotation press, 3 x 12 back extension.",
            "minutes": 50
          },
          {
            "key": "cardio",
            "label": "Aerobic fitness",
            "sessionType": "cardio",
            "focus": "General stamina so you still ride well at the end of a round",
            "exercises": [
              "stationary-bike",
              "rowing-machine",
              "jump-rope-basic"
            ],
            "prescription": "15 min bike at steady effort, 10 min rowing, then 5 x 1 min skipping with 1 min rest. Should leave you warm, not exhausted.",
            "minutes": 35
          }
        ],
        "gate": {
          "sessions": 38,
          "weeks": 10
        },
        "benchmarks": [
          "Jump a course of 8 fences at 70 cm in an even canter rhythm",
          "Ride an introductory dressage test from memory without going off course",
          "Stay in balance when a horse stops or runs out at a fence"
        ],
        "coachNote": "Rhythm jumps the fence. Keep the canter the same before, over and after, look up at the next fence, and let the horse do the jumping."
      },
      {
        "key": "s5",
        "name": "Cross-country and endurance",
        "aim": "Ride cross-country fences or a marked endurance distance in control, managing pace and your horse's fitness and welfare.",
        "weeks": 12,
        "sessionsPerWeek": 4,
        "days": [
          {
            "key": "cross-country",
            "label": "Cross-country schooling",
            "sessionType": "sport",
            "focus": "Solid fences, banks, ditches and water at controlled pace",
            "exercises": [
              "equestrian-canter-work",
              "equestrian-show-jumping",
              "equestrian-cross-country"
            ],
            "prescription": "Instructor present, body protector on. 20 min warm-up, 3-4 show jumps, then school individual cross-country fences before linking 5-8 together.",
            "minutes": 90
          },
          {
            "key": "endurance",
            "label": "Endurance ride",
            "sessionType": "sport",
            "focus": "Long distance at steady pace, monitoring the horse",
            "exercises": [
              "equestrian-stable-work",
              "equestrian-endurance-riding",
              "equestrian-trail-ride"
            ],
            "prescription": "15-30 km at steady trot and canter with walk breaks, in company. Check the horse's breathing and legs at the halfway point and offer water.",
            "minutes": 120
          },
          {
            "key": "schooling",
            "label": "Flat and jump schooling",
            "sessionType": "sport",
            "focus": "Keep the basics: suppleness, accuracy and grid work",
            "exercises": [
              "equestrian-flatwork",
              "equestrian-dressage-test",
              "equestrian-show-jumping",
              "equestrian-no-stirrups"
            ],
            "prescription": "25 min flatwork including a test ride-through, 20 min grid or course work at 80-90 cm, 5 min without stirrups to finish.",
            "minutes": 60
          },
          {
            "key": "rider-fitness",
            "label": "Rider strength",
            "sessionType": "strength",
            "focus": "Strength endurance for long periods in a galloping position",
            "exercises": [
              "trap-bar-deadlift",
              "walking-lunge",
              "barbell-hip-thrust",
              "farmers-carry",
              "pallof-press",
              "wall-sit"
            ],
            "prescription": "3 x 5 trap bar deadlift, 3 x 12 walking lunge per leg, 3 x 8 hip thrust, 3 x 30 m farmer's carry, 3 x 10 Pallof press, 3 x 60 s wall sit.",
            "minutes": 50
          },
          {
            "key": "recovery",
            "label": "Mobility and recovery",
            "sessionType": "mindbody",
            "focus": "Look after hips and back during a heavy riding week",
            "exercises": [
              "yoga-flow",
              "adductor-routine",
              "pigeon-pose",
              "supine-spinal-twist",
              "foam-rolling"
            ],
            "prescription": "20 min yoga flow, 6 min adductor routine, 2 x 60 s pigeon per side, 2 x 45 s spinal twist, 10 min foam rolling.",
            "minutes": 45
          }
        ],
        "gate": {
          "sessions": 38,
          "weeks": 10
        },
        "benchmarks": [
          "Ride a schooling cross-country round or a 20 km endurance ride in control",
          "Hold a galloping position for 3 minutes without resting on the horse's neck",
          "Judge pace and bring the horse back to trot whenever you choose",
          "Cool down, wash off and check your horse after hard work"
        ],
        "coachNote": "The horse's welfare comes first. A tired horse makes mistakes at solid fences, so pull up early when it feels flat, and walk the course before you ride it."
      }
    ]
  }
];

export const findPath = (key: string | null | undefined): TrainingPath | undefined => TRAINING_PATHS.find((p) => p.key === key);

/** Typical weeks from the first session to the end of the last stage. */
export const pathWeeks = (p: TrainingPath): number => p.stages.reduce((s, st) => s + st.weeks, 0);
