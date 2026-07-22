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
