/**
 * In-app changelog / patch notes.
 *
 * `version` here is a DISPLAY release label and is intentionally decoupled from
 * the native app version (`app.config.ts` → `version`), which must stay stable
 * because `runtimeVersion: { policy: 'appVersion' }` ties over-the-air update
 * compatibility to it. Bumping a changelog release ships via `eas update` and
 * does NOT change the runtime, so OTA keeps working on the installed APK.
 *
 * Newest entry first. `APP_RELEASE` is what the app shows as "current version".
 */

export interface ChangelogEntry {
  version: string;
  date: string; // ISO
  title: string;
  highlights: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.19',
    date: '2026-07-27',
    title: 'Auto-pause in vehicles, accurate calories, GPS for every activity',
    highlights: [
      'Auto-pause: if you get in a car or bus, or just stand still, tracking pauses itself and resumes when you start moving again — so a drive never lands in your walk. It tells a bus ride from a run by looking at cadence, not just speed, so a genuine sprint is never mistaken for a vehicle.',
      'Calories are properly accurate now. They exclude resting metabolism (your calorie target already covers that, so counting it twice was inflating every session), they use MOVING time rather than wall-clock, and they account for climbing.',
      'Because of that, session and walk calorie figures are lower than before — and correct. The energy-balance and over-training numbers are now trustworthy.',
      'GPS distance for any activity that covers ground: hiking, cycling, a wander, a paddle. Start it from an Outdoor, Cardio or Sport session and it measures distance instead of you typing it, drawing the route as you go.',
      'The sticky notification’s progress bar now tracks your whole DAY, so it no longer restarts at zero when a session begins — and it refreshes on distance as well as steps, so a ride still animates.',
      'Pace is measured from moving time too, so pausing at a crossing no longer makes you look slower than you ran.',
    ],
  },
  {
    version: '2.18',
    date: '2026-07-26',
    title: 'True hardware step counting (needs the new APK)',
    highlights: [
      'FitCoach now reads your phone’s step-counter sensor directly, at the hardware level — including its absolute since-boot total, which Expo’s standard sensor API cannot expose.',
      'That means an exact step count even if the app is killed mid-walk: your session baseline is banked at the start, so steps are always (sensor now − baseline), no matter what happened in between.',
      'The sensor keeps counting while the CPU sleeps and while the app is dead, so nothing is lost with the screen off.',
      'Requires installing the new APK — native sensor code cannot arrive over-the-air. Install it over your existing app: same package and signing key, so all your data, history and progress are kept.',
      'Until then everything still works on the previous build: the app detects the native module is absent and falls back to the pedometer and GPS.',
    ],
  },
  {
    version: '2.17',
    date: '2026-07-26',
    title: 'Walk & run tracking rebuilt: hardware steps + GPS on both',
    highlights: [
      'Step counting is now tied to the device’s hardware step-counter sensor as the primary source — it keeps accumulating with the screen off and catches up the instant you return, instead of falling back to the accelerometer.',
      'GPS is now on for walks as well as runs. Its foreground service is what genuinely survives the screen going off and the app being killed.',
      'Steps keep climbing even if the app is killed: the background location task now checkpoints your step count from measured GPS distance, and only ever raises it.',
      'A sticky, non-dismissible notification appears the moment a session starts, with a live progress bar, steps, distance and elapsed time.',
      'The tracking screen now shows both channels separately — hardware step counter and GPS route tracking — so you can see exactly what is live.',
      'Fixed a crash that stopped walks starting at all, and fixed the Home calorie strip so it updates the moment you log food.',
    ],
  },
  {
    version: '2.16',
    date: '2026-07-26',
    title: 'Outdoor activities feed your steps + a don\'t-over-train line',
    highlights: [
      'On-foot activities now add to your daily steps: log a run, hike or outdoor walk (past or live) with a distance or duration and it folds an estimated step count into your day — with an "On foot" toggle you switch off for cycling, swimming or rowing.',
      'New "Today\'s energy balance" card after any session: how much you burned in training, how much you\'ve eaten, and how much is left to eat toward your goal.',
      'The over-training line: a gauge and plain-language warning showing when extra training would start working against the goal you set — losing a bulk\'s surplus, or pushing a cut past a safe deficit (never below your BMR).',
      'A simple 4-value calorie strip on Home — eaten · burned · left · restore — at a glance, with "restore" telling you how much to eat back to protect your goal.',
      'It leans deliberately cautious — your calorie target already assumes everyday activity, so logged training counts on top.',
    ],
  },
  {
    version: '2.15',
    date: '2026-07-25',
    title: 'Legion, ancient warriors, bodybuilders & quick urge-counters',
    highlights: [
      'New Special Programmes — French Foreign Legion (GCP) in Military; Early Islamic Cavalry, Chinese Dynastic Warrior, Zulu Impi and Ancient Egyptian Warrior in Warriors of History.',
      'Bodybuilding legends join Superheroes & Legends: Arnold (Golden-Era volume), Ronnie Coleman (heavy mass) and Dorian Yates (Blood & Guts HIT) — each with its real training split and diet.',
      'New Quick Counters & Urge-Busters section: on-demand 2–10 minute protocols to ride out a nicotine craving, reset a compulsive impulse, or shift your focus — using standard, non-judgemental behavioural tools (urge surfing, the 10-minute rule, movement redirection, grounding, HALT).',
      'Seven new quick-counter exercises (burst redirect, 10-minute rule, 5-4-3-2-1 grounding, cold-water splash, change environment, HALT check, keep-hands-busy).',
      'Every new programme still logs its diet into Nutrition with real macros & micros.',
    ],
  },
  {
    version: '2.14',
    date: '2026-07-25',
    title: 'Grip work, easier alternatives, sub-muscles & composition trends',
    highlights: [
      'Find alternative: in a session, tap the swap icon on any exercise to switch a hard movement for an easier one that works the same muscle.',
      'Any session you assemble — free, custom, any type — can now be saved as a reusable routine, not just lifting.',
      'Sub-muscles everywhere: every one of the 263 muscle-group exercises now has its sub-muscle pinned (Back → Lats vs Mid-Back, Chest → Upper/Mid/Lower…). Filter a muscle to drill into its regions, and each exercise shows the part it emphasises.',
      'Bigger library: hand-grip & forearm training, advanced calisthenics (archer/ring/planche/lever work) and wellness protocols for cutting down smoking, hormones and energy.',
      'Bro split gains an Abs day, and Arm day now includes forearms.',
      'Trends: a Body composition section charts your measured fat mass and muscle mass over time, and tells you in plain language why each is rising or falling.',
      'More foods: dried fruits, mloukhia variations (beef/chicken/veg), pâté, droô, assidat boufriwa, and homemade Eid cookies (ghraïba, samsa, baklawa, kaâk…).',
    ],
  },
  {
    version: '2.13',
    date: '2026-07-24',
    title: 'Programme diets are now real, loggable nutrition',
    highlights: [
      'Every Special Programme meal is now built from real foods with full macros and micronutrients — no more prose-only diets.',
      'New "Programme meals" screen in the Nutrition tab: browse all 24 programme diets, see each meal\'s calories, protein and food breakdown, and log any meal — or a whole day — straight to your diary.',
      'On a programme\'s page, tap any meal to log it, or "Log this whole day" — it adds the real component foods so your macros and vitamins/minerals update exactly like normal food logging.',
      'Added a few whole-food staples the historical diets needed (barley, buckwheat/grechka, amaranth, corn tortillas, miso soup, dried apricots) with real per-serving macros.',
    ],
  },
  {
    version: '2.12',
    date: '2026-07-24',
    title: 'Superhero training, 10 more programmes & 20 new achievements',
    highlights: [
      'New Superheroes & Screen Legends section: train like One Punch Man (Saitama\'s 100-100-100 + 10 km), Batman, Bruce Lee, Rocky Balboa and the super-soldier (Captain America) — each honest about what\'s real vs fictional.',
      'More Special Programmes: Mongol Horde, Roman Gladiator, Shinobi (Ninja), Firefighter CPAT and The Cell Workout (Convict Conditioning) — every one with its own training week and diet.',
      'Special Programmes now span 24 programmes across 4 sections (Military & Service, Warriors of History, Superheroes & Screen Legends, Everyday Special Ops).',
      'Achievements expanded from 100 to 120 badges across 12 categories — two new sections: Self-Care & Devotion (tooth-brushing, showers, the five daily prayers, naps, meditation) and Body Mastery & Special Ops (body-composition logging, all-15 measurements, recomposition goal, supplement stacks, Special Programme sessions).',
      'The new badges read your real data — brush all three times, complete the five prayers, log your first nap or body-fat weigh-in, finish a Special Programme session — and show exactly how close you are.',
    ],
  },
  {
    version: '2.11',
    date: '2026-07-24',
    title: 'Special Programmes — train like a soldier, a monk, a legionary',
    highlights: [
      'New Special Programmes section on Train: 14 themed programmes, each with its real history, a full multi-discipline training week, and the diet those people actually ate.',
      'Military & Special Forces: Army Combat Fitness (the six ACFT events), Navy SEAL Prep (swim/run/pyramids), Spetsnaz Conditioning (kettlebell & combat sambo), Royal Marines Commando (load-carriage yomps).',
      'Warriors of History: Roman Legionary (march, drill at the post, dig), Spartan Agoge, Shaolin Warrior Monk (stances, forms, Chan meditation), Dagestan Wrestler (mountain runs, rope climbs), Aztec Eagle & Jaguar, Viking Strength, Samurai Bushidō.',
      'Everyday Special Ops: Office Quick Ops (deskside, 5–15 min), Home Morning Kickstart, and a Hotel & Travel WOD for zero-equipment days.',
      'Each programme is honest about what\'s real and what\'s adapted, carries a safety note where the training is demanding, and 27 new tactical & heritage exercises back them up (rope climb, sandbag work, horse stance, sword cuts, sprawls and more).',
      'Every day pre-loads its exercises and tags the session so your progress groups like-for-like — start any day in one tap.',
    ],
  },
  {
    version: '2.10',
    date: '2026-07-23',
    title: 'Real calories per exercise · muscle mass vs the model',
    highlights: [
      'Every exercise now shows its real calorie cost. The library lists kcal per 10 minutes (and per minute) at your bodyweight for each movement and variation — jump rope reads far higher than stretching, because it is.',
      'Session calories are now attributed per exercise from each movement\'s own effort (MET) and time, not one flat rate for the whole session. Open any session to see how much each exercise actually burned — and it works retroactively on your past sessions too.',
      'Expected vs reality now covers muscle mass and fat weight. The muscle-mass line tracks what your training, protein and sleep should be building, against your scale\'s measured muscle reading — with a reminder that scale muscle swings with hydration, so trust the trend.',
      'A mixed session (say a run plus some lifting) finally reflects its mix instead of averaging everything to one number — while a straight single-activity session reads exactly as before.',
    ],
  },
  {
    version: '2.9',
    date: '2026-07-22',
    title: 'Sport, outdoor, mind-body & meditation — all built out',
    highlights: [
      'Sport went from 17 to 62: team and ball games, racket sports, water and winter sports, gymnastics, dance, riding, archery — plus the practice that is not the match (shooting, passing, serve reps, wall work, footwork, plyometrics and a proper RAMP warm-up).',
      'Outdoor went from 13 to 37: easy, long, recovery, progression, fartlek, cross-country, sand and hill running; gravel, commuting, hill and time-trial cycling; Nordic walking, trekking, mountaineering, orienteering, paddleboarding, cross-country skiing and brick sessions.',
      'Mind-body went from 11 to 38: hatha, ashtanga, hot, restorative, kundalini and chair yoga; reformer and mat Pilates, barre, qigong, somatics; ankle, wrist, hamstring, adductor and spinal routines; CARs, PNF stretching, balance training and desk-break drills.',
      'Meditation went from 9 to 37: noting, open awareness, loving-kindness, self-compassion, gratitude, journaling, visualization, mantra, zazen, vipassana, mindful eating, yoga nidra/NSDR and progressive relaxation — plus box, 4-7-8, coherent, alternate-nostril and physiological-sigh breathing.',
      'Faith practices now sit alongside the five prayers: dhikr/tasbih, Qur\'an recitation, du\'a and contemplative reflection, with a Faith Practice program built around them.',
      '15 more programs — Off-Season Build, In-Season Maintenance, Racket Sport Player, Team Pre-Season; Half Marathon, Cycling Base, Triathlon Starter, Trek & Altitude Prep; Yoga Foundations, Lifter\'s Mobility, Desk-Worker Reset; Stress Reduction, Sleep & Wind-Down, Focus & Performance and Faith Practice — plus 35 more methods.',
    ],
  },
  {
    version: '2.8',
    date: '2026-07-22',
    title: 'Programs for every activity, 97 new exercises, recomp goal',
    highlights: [
      'The exercise library grew from 260 to 357. Cardio machines are all there now — StairMaster, spin & recumbent bikes, arc trainer, VersaClimber, curved treadmill, arm bike — plus jump rope (bounce, boxer skip, high knees, double-unders, crossovers) and no-equipment conditioning.',
      'Martial arts went from 16 entries to 47: technical drills for striking, footwork, defence, clinch, takedowns, guard work, escapes, submissions, forms, mitt and bag work, plus Aikido, Capoeira, Sambo, Kung Fu and fencing.',
      '19 pre-built programs — a whole planned week for every category, not just lifting. Each day says what it is for, what to do, and what tells you it is working.',
      'New goal: Build muscle & burn fat. Near-maintenance calories with the highest protein of any goal, a matching 4-day training program, and a coach tip that reads a flat scale as success instead of a stall.',
      'Also new: athletic-performance goal, 32 more training methods (Tabata, 30-20-10, MAF, rep ladders, greasing the groove, positional sparring, hill and track work, box breathing…), calisthenics skill holds, and more sports and mind-body work.',
      'Fixed: new exercises were only reaching fresh installs. Everything added in 2.7 and 2.8 now lands on existing accounts too — and a custom exercise of yours can no longer be overwritten by a built-in of the same name.',
    ],
  },
  {
    version: '2.7',
    date: '2026-07-22',
    title: 'Expected vs reality, training methods & martial arts',
    highlights: [
      'Trends now shows expected vs reality: a dashed model line (from your calories, protein, training, sleep and smoking) against your actual measured weight, fat mass, lean mass and body fat — plus a plain-language read on why they differ.',
      'New Martial Arts category — boxing, Muay Thai, BJJ, judo, wrestling, karate, taekwondo, MMA, Krav Maga — with bag, pads, drilling, sparring, rolling, forms and fight-conditioning protocols.',
      'Every category now has real training methods, not just a blank session: 5x5, 5/3/1, hypertrophy, German Volume, pyramids, clusters; EMOM, AMRAP, circuits, progressions; Zone-2, LISS, HIIT, intervals, tempo, fartlek; long runs, hill repeats, rucks; vinyasa, yin, mobility; breathwork and more.',
      'Tap a category on Train to pick how you are training — splits, your routines, or a method — and each session is tagged so progress compares like-for-like.',
      'More cardio and sport variations (jump rope, air bike, ski erg, sled, battle ropes, swimming, squash, climbing, handball, table tennis).',
      'Spirulina, ashwagandha and shilajit are now dosed in capsules rather than grams.',
    ],
  },
  {
    version: '2.6',
    date: '2026-07-21',
    title: 'Full body composition & measurements',
    highlights: [
      'Track 15 tape measurements (neck, shoulders, chest, waist, upper/lower abdomen, hips, both arms & forearms, both thighs & calves) — all kept in history.',
      'Log everything your scale reports: body fat, water, muscle & skeletal muscle, bone, protein %, visceral fat, retained water and its BMR reading.',
      'Clear split between what you enter and what FitCoach calculates: BMI, fat weight, lean mass, muscle & skeletal-muscle %, water weight, bone %, protein weight, obesity degree, waist-to-hip, waist-to-height, FFMI and BMR.',
      'Your calories now follow your composition — with body fat measured, BMR uses Katch-McArdle (lean mass) instead of a height/weight formula, and protein is anchored to lean mass.',
      'Set or adjust your goal any time; every change is saved to a goal history alongside your measurement history.',
    ],
  },
  {
    version: '2.5',
    date: '2026-07-21',
    title: 'Spirulina, shilajit & a goal-based supplement plan',
    highlights: [
      'Added Spirulina (1 g = 3 capsules) with its real vitamin & mineral content, and Shilajit — plus Ashwagandha now matches your 400 mg (2-capsule) portion.',
      'New Supplement Plan: pick your goals (performance, sleep, cutting down smoking, stress, wellbeing) and get a timed daily schedule with honest evidence ratings.',
      'Built-in safety layer: caffeine caps and sleep conflicts, mineral spacing, thyroid and pregnancy cautions, melatonin dosing, shilajit purity — and a clear note that no supplement treats nicotine dependence.',
      'One tap adds the whole plan to your stack for daily logging.',
    ],
  },
  {
    version: '2.4.3',
    date: '2026-07-20',
    title: 'Achievements: real badge art restored',
    highlights: [
      'The 100 achievement badges now show their full, colourful art again — pre-rendered as images so they look exactly like the originals but can never crash the screen (the earlier white-screen was native SVG rendering).',
      'Tap any Walk or Run in History → see its full details and drawn GPS route.',
    ],
  },
  {
    version: '2.4',
    date: '2026-07-20',
    title: 'Achievements — 100 badges',
    highlights: [
      '100 achievement badges across 10 categories (streaks, strength, movement, nutrition, Tunisian heritage, quitting smoking, sleep, alcohol, faith & fasting, micronutrients), each with its own SVG art.',
      'New Achievements screen in Profile → Card & Reports: see every badge and, for 60 of them, exactly how far you are from unlocking — read straight from your own data.',
      'Overall progress counter and per-category tallies.',
    ],
  },
  {
    version: '2.3',
    date: '2026-07-19',
    title: 'Diet planner, self-care & prayer check-ins, smoother tracking',
    highlights: [
      'Diet plan generator: auto-builds a day of meals that hits your macro targets, with styles (balanced, high-protein, low-carb, vegetarian, mediterranean) and a Shuffle for endless same-macro variations — log any meal straight to your diary.',
      'Home self-care check-ins: brush teeth ×3, shower and relax time to keep your routine stable.',
      'Prayer check-ins on Home when faith mode is on — tick off each of the 5 daily prayers; prayers are also pre-programmed meditation exercises with their approximate times.',
      'Smoother walk/run tracking: steps now reconcile against the hardware counter, so they no longer lag or reset when you leave the app or the screen turns off.',
      'You can now add exercises to logged & past sessions (and custom exercises stay in your library).',
      'Fasting now shows in the food logger too — it knows when you\'re in your fasting vs eating window.',
    ],
  },
  {
    version: '2.2',
    date: '2026-07-19',
    title: 'GPS run maps, activity logging, hormones & naps',
    highlights: [
      'Runs now draw your route as a circuit map, tracked by GPS with a pinned notification that keeps recording even with the app closed.',
      'Walks show a live, non-dismissible step counter in your notification bar.',
      'Log exercises & activities in ANY session — cardio, sport and mind-body, not just lifting — each with reps, time or distance.',
      'Forgot to start a session? Log a past one from its start–finish time.',
      'New Hormones section: what raises/lowers each, low/high signs, and flags you can set from your profile.',
      'Sleep now tracks daytime naps separately from your night sleep.',
      'More foods: halwa chamia, cordon bleu, milkshakes, and sandwich condiments (mayo, garlic sauce, harissa, harissa arbi, hummus…) — with omega-3 filled in across foods.',
    ],
  },
  {
    version: '2.1',
    date: '2026-07-17',
    title: 'Micronutrients, supplements & polish',
    highlights: [
      'Micronutrients: 13 vitamins + 11 minerals + omega-3, tracked as % of your RDI.',
      '175 foods now carry vitamin/mineral data — logging them fills your daily micros.',
      'Supplements: vitamin/mineral pills that count toward your micros, plus creatine, ashwagandha and more tracked with honest evidence ratings.',
      'All estimated numbers now show at most 2 decimals (no more 0.00000025).',
      'In-app changelog + "up to date" status, and this What\'s New screen.',
    ],
  },
  {
    version: '2.0',
    date: '2026-07-16',
    title: 'Self-updating app + tracking upgrades',
    highlights: [
      'The app now updates itself over-the-air — no reinstalls for content/logic changes.',
      'Walk/run pedometer rebuilt: smoother, no lag, keeps counting with the screen off.',
      'Sticky notification for every active session (walk, run and training).',
      'New foods: chocolate, juices, seeds (chia, pumpkin, helba…) and fast food.',
      'Body type is now editable, and charts page day-by-day or week-by-week.',
    ],
  },
  {
    version: '1.9',
    date: '2026-07-15',
    title: 'Per-muscle training, growth, prayers & fasting',
    highlights: [
      '228-exercise library by individual muscle, with mandatory warm-ups.',
      'Saved & updatable custom routines; editable custom exercises.',
      'Muscle-growth readiness engine and a 12-week Trends dashboard.',
      'Offline prayer times and Ramadan / intermittent fasting mode.',
    ],
  },
];

/** The current display release (top of the changelog). */
export const APP_RELEASE = CHANGELOG[0].version;
export const APP_RELEASE_DATE = CHANGELOG[0].date;
