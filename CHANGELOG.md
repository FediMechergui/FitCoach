# Changelog

Patch notes for FitCoach. The in-app **Profile → What's new** mirrors this from
[`src/data/changelog.ts`](src/data/changelog.ts) (the source of truth).

Over-the-air releases are published with `npm run release` (see the README), which
ships the update via EAS to installed apps, tags the release in git, **and publishes
a matching GitHub Release** (from the notes below) — so the repo's Releases tab and
the app's **Profile → App version** both reflect the latest and show "Up to date ✓".

---

## v2.8 — 2026-07-22 · Programs for every activity, 97 new exercises, recomposition goal
- **Exercise library: 260 → 357.** Cardio now covers the whole gym floor — StairMaster/stepmill,
  spin and recumbent bikes, arc trainer, VersaClimber, curved treadmill, arm ergometer, plus
  interval variants of every machine. Jump rope is a progression in its own right (basic bounce →
  boxer skip → high knees → crossovers → double-unders), and there is a full set of no-equipment
  conditioning (burpees, mountain climbers, shuttle runs, agility ladder, box jumps, bear crawls).
- **Martial arts: 16 → 47 entries.** Beyond the styles, the technical drills that actually make up
  a session: jab–cross and combination drills, footwork, defence (slip/roll/parry), counters, kicks,
  knees and elbows, clinch work, takedown entries, sprawls, shrimping, bridging, guard passing and
  retention, escapes, submission drills, positional sparring, flow rolling, forms/kata, mitt work,
  double-end and speed bag, neck conditioning. Plus Aikido, Capoeira, Sambo, Kung Fu and fencing.
- **19 pre-built programs** ([src/data/programs.ts](src/data/programs.ts)) — the equivalent of a
  training split, for every category. Bodyweight Foundations, Skill & Strength, No-Equipment
  Minimalist; Aerobic Base Builder, Gym Machine Rotation, Fat-Loss Conditioning, Jump Rope
  Progression; Striking Fundamentals, Fight Camp, Grappling Foundations, Traditional Practice;
  Recomposition and Beginner Barbell; Couch-to-5K, 10K Builder, Hills & Trails; Sport Athlete Week;
  Mobility Reset; and an eight-week meditation starter. Every day states its **purpose**, its
  **prescription**, and the program states **what tells you it's working**.
- **New goal — "Build muscle & burn fat".** A deliberately small deficit (3–10% under TDEE, not
  15–22%) with the highest protein of any goal (2.4 g/kg of lean mass), because partitioning is what
  makes recomposition possible, not the deficit. Ships with a matching 4-day training program and a
  coach tip that treats a flat scale as **success** rather than a stall. The goal picker states
  plainly that recomp is real but slow, and works best for beginners, returners and people carrying
  more fat.
- **New goal — "Athletic performance"**: maintenance-to-slightly-above with the most carbs, for when
  training quality matters more than the scale.
- **32 more training methods**: Tabata, 30-20-10, pyramid intervals, stair climbs, bike sprints,
  machine circuits, MAF heart-rate-capped work, recovery spins; rep ladders, greasing the groove,
  tempo negatives, skill practice; footwork, defence & counters, clinch & takedowns, positional
  sparring, flow rolling, solo drills; sport conditioning and small-sided games; tempo, track,
  sprint and rucking; power yoga, recovery & rolling, tai chi; box breathing, walking meditation and
  loving-kindness.
- **Calisthenics skill holds** are now first-class: handstand, wall handstand, L-sit, front and back
  lever progressions, tuck planche, planche lean, human flag, dragon flag, skin-the-cat.
- **Fixed — new exercises never reached existing installs.** The library seed is gated on the schema
  version, which v2.7 didn't bump, so its 27 new exercises only ever appeared on fresh installs.
  Bumping to 9 lands both releases' additions everywhere. Re-seeding remains non-destructive: it
  upserts by slug and never deletes, so every logged set keeps pointing at the same exercise.
- **Fixed — a custom exercise could be overwritten by a built-in of the same name.** The seed's
  name-based fallback (there for pre-slug databases) now skips custom rows, so your own "Burpees"
  survives the library gaining one.

## v2.7 — 2026-07-22 · Expected vs reality, training methods & martial arts
- **Expected vs reality** in Trends: every composition metric (weight, fat mass, lean mass,
  body fat %) now draws a **dashed modelled line against your solid measured line**. The model
  runs on energy balance (7 700 kcal/kg) for *weight*, then partitions fat vs lean using what
  actually moves partitioning — protein intake, hard sets, sleep and cigarettes. Days you didn't
  log are treated as **maintenance**, never invented, and training isn't double-counted (your
  TDEE already carries an activity multiplier). Each chart says, in plain language, why the two
  lines diverge.
- **Martial Arts** is now a first-class category: boxing, Muay Thai, kickboxing, BJJ (gi & no-gi),
  judo, wrestling, karate, taekwondo, MMA and Krav Maga — with bag work, pad rounds, shadow
  boxing, technical drilling, sparring, positional rolling, forms and fight conditioning.
- **Training methods everywhere.** Tap a category on Train and pick *how* you're training:
  splits and your saved routines for lifting, plus 30+ named protocols across all categories —
  5×5, 5/3/1, hypertrophy, German Volume, pyramids, clusters; skill progressions, EMOM, AMRAP,
  circuits; Zone-2, LISS, HIIT, VO₂max intervals, tempo, fartlek; long runs, hill repeats, rucks;
  vinyasa, yin, mobility; breathwork and body scan. Each states its structure, typical duration
  and **how progress is measured in it** (load, reps, duration, distance, rounds or intensity),
  and tags the session so progress compares like-for-like.
- More cardio & sport variations: jump rope, air bike, ski erg, sled push, battle ropes, rowing
  intervals, swimming, squash, climbing, handball, table tennis.
- **Supplements by pill**: spirulina, ashwagandha and shilajit are dosed in **capsules**
  (3 / 2 / 1 per serving) rather than grams, with the mass shown only as context.

## v2.6 — 2026-07-21 · Full body composition & measurements
- **15 tape measurements** in cm (neck, shoulders, chest, waist, upper & lower abdomen, hips,
  both upper arms & forearms, both thighs & calves) — each kept in full history.
- **Log everything your smart scale reports**: body fat %, water %, muscle %, skeletal muscle %,
  bone mass, protein %, visceral fat, retained water and the scale's own BMR reading.
- Clean split between **what you enter** and **what FitCoach calculates**: BMI & category, fat
  weight, lean mass, muscle & skeletal-muscle weights, water weight, bone %, protein weight,
  obesity degree, waist-to-hip, waist-to-height, FFMI and BMR.
- **Composition now drives your calories**: with body fat measured, BMR switches from
  Mifflin-St Jeor to **Katch-McArdle** (lean mass), and protein anchors to lean mass.
- Set or adjust your **goal** any time — every change is saved to a goal history beside your
  measurement history.

## v2.5 — 2026-07-21 · Spirulina, shilajit & a goal-based supplement plan
- Added **Spirulina** (1 g = 3 capsules) with its real vitamin & mineral profile, and **Shilajit**.
  Ashwagandha now matches a 400 mg extract portion (2 capsules).
- New **Supplement Plan**: choose goals (athletic performance, sleep quality, cutting down
  smoking, stress, general wellbeing) and get a timed daily schedule with honest evidence ratings.
- **Safety layer**: caffeine caps and sleep conflicts, mineral spacing (iron/zinc/calcium),
  magnesium duplication, thyroid & pregnancy cautions, melatonin low-dose guidance, shilajit
  purity, and a clear statement that **no supplement treats nicotine dependence**.

## v2.4.3 — 2026-07-20 · Achievements: real badge art restored
- The 100 badges show their full art again — **pre-rendered as images**, so they look identical
  to the originals but can't crash the screen (the earlier white-screen was a native SVG crash,
  invisible to JavaScript error boundaries).
- Tap any **Walk or Run in History** to see its full detail and the **drawn GPS route**.

## v2.4 — 2026-07-20 · Achievements — 100 badges
- **100 achievement badges** across 10 categories (Consistency, Strength, Movement, Nutrition,
  Tunisian & Mediterranean Heritage, Smoking Cessation, Sleep & Work, Alcohol, Faith & Fasting,
  Micronutrients), each with its own inline **SVG** art.
- New **Achievements** screen (Profile → Card & Reports): every badge with, for **60** of them,
  a live progress readout showing exactly how close you are — computed from your own data
  (streaks, workouts, steps, nutrition, sleep, smoking/alcohol, fasting, micros…).
- Overall unlocked counter and per-category tallies. Event-based badges (e.g. exporting your
  card) are shown honestly as "unlocks when you do it".

## v2.3 — 2026-07-19 · Diet planner, self-care & prayer check-ins, smoother tracking
- **Diet plan generator**: auto-builds a day of meals that hits your calorie & macro targets,
  with 5 styles (balanced, high-protein, low-carb, vegetarian, mediterranean) and a **Shuffle**
  for endless same-macro variations. Log any meal — or the whole day — straight to your diary.
- **Home self-care check-ins**: brush teeth ×3, shower, and relax time.
- **Prayer check-ins** on Home when faith mode is on — tick off each of the 5 daily prayers.
  Prayers are also pre-programmed **meditation exercises** with their approximate durations.
- **Smoother walk/run tracking**: step counts reconcile against the hardware counter (via
  `getStepCountAsync`) on every tick and on app-resume, so they no longer lag or reset when you
  background the app or the screen turns off.
- **Add exercises to logged/past sessions** (and custom exercises persist in your library).
- **Fasting** now surfaces in the food logger — it knows whether you're in your fasting or
  eating window when you add food.

## v2.2 — 2026-07-19 · GPS run maps, activity logging, hormones & naps
- Runs are traced by GPS and drawn as a **circuit map**; a persistent foreground-service
  notification keeps recording your path even with the app closed or the screen off.
- Walks show a **live, non-dismissible step counter** in the notification bar.
- Log exercises & activities in **any** session type (cardio, sport, mind-body) — each with
  reps, time or distance — not just strength/calisthenics.
- **Log a past session** from its start–finish time for when you forgot to start the timer.
- New **Hormones** section: what raises/lowers each hormone, low/high signs, and flags you
  can set from your profile (educational, non-diagnostic).
- **Naps**: track daytime naps separately from night sleep.
- More foods: halwa chamia, cordon bleu, milkshakes and sandwich condiments (mayo, garlic
  sauce, harissa, harissa arbi, hummus…), plus omega-3 filled in across foods.

## v2.1 — 2026-07-17 · Micronutrients, supplements & polish
- Micronutrients: 13 vitamins + 11 minerals + omega-3, tracked as % of your RDI.
- 175 foods now carry vitamin/mineral data — logging them fills your daily micros.
- Supplements: vitamin/mineral pills that count toward your micros, plus creatine,
  ashwagandha and more, tracked with honest evidence ratings.
- All estimated numbers now show at most 2 decimals (no more `0.00000025`).
- In-app changelog + "up to date" status and a What's New screen.

## v2.0 — 2026-07-16 · Self-updating app + tracking upgrades
- The app updates itself over-the-air — no reinstalls for content/logic changes.
- Walk/run pedometer rebuilt: smoother, no lag, keeps counting with the screen off.
- Sticky notification for every active session (walk, run and training).
- New foods: chocolate, juices, seeds (chia, pumpkin, helba…) and fast food.
- Body type is now editable, and charts page day-by-day or week-by-week.

## v1.9 — 2026-07-15 · Per-muscle training, growth, prayers & fasting
- 228-exercise library by individual muscle, with mandatory warm-ups.
- Saved & updatable custom routines; editable custom exercises.
- Muscle-growth readiness engine and a 12-week Trends dashboard.
- Offline prayer times and Ramadan / intermittent fasting mode.
