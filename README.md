# FitCoach

> Private coaching, nutrition & health app — local-first, offline, Android-first.
> Built from [FitCoach-App-Specification.md](FitCoach-App-Specification.md) (v2.0).
> [APK DOWNLOAD](https://expo.dev/accounts/fedimechergui/projects/fitcoach/builds/ebc43c60-e5d7-4f12-a3e7-e1af515faa34)

FitCoach is a personal fitness companion that combines three pillars in one app:

1. **Session tracking** — a universal check-in / check-out flow across strength,
   calisthenics, cardio, outdoor endurance, sports, mind-body and meditation.
2. **Movement tracking** — pedometer / accelerometer walk & run tracking plus a
   passive daily step counter.
3. **Nutrition & coaching** — precise + "honest-log" food logging, water &
   caffeine trackers, a Mifflin-St Jeor calorie/macro calculator, and a
   rule-based Coach-Tips engine.

It also includes a full **health & wellness suite**: an opt-in smoking tracker,
sleep tracking, accurate alcohol logging (grams, calories, standard drinks &
estimated BAC), detailed body-composition (fat/muscle/water mass + FFMI),
menstrual-cycle tracking with hormone-aware training guidance, a chronic-condition
catalogue, a shareable **FIFA-style athlete card** (PNG export), and **PDF reports**
tailored for a nutritionist or a coach.

A **daily check-in streak meter** on the Home dashboard rewards you for opening the
app every day — with a flame count, a 7-day dot row, your best streak, and progress
toward the next milestone.

It ships with a **510-exercise library** split by muscle group, **individual muscle**
(lats, traps, front/side/rear delts, upper/lower abs, obliques…) and equipment — each
with a beginner illustration, step-by-step form cues and a **mandatory warm-up** — plus
one-tap **training splits** (Push/Pull/Legs, Upper/Lower, Bro, Full-Body, Arnold),
**saved & updatable custom routines**, a **Tunisian & Mediterranean food database**
(salads, Bsisa, Kafteji…), **habit** & **work-hours** trackers, an honest
**muscle-growth readiness** engine, a 12-week **Trends** dashboard, and offline
**prayer times** + **fasting mode** (Ramadan & intermittent).

Everything works **100% offline** on an on-device SQLite database — no account,
no internet required.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo (managed workflow), TypeScript |
| Navigation | `@react-navigation` (bottom tabs + native stack) |
| State | Zustand |
| Database | `expo-sqlite` + `drizzle-orm` (typed schema) |
| Sensors | `expo-sensors` (`Pedometer` + `Accelerometer` fallback) |
| Background | `expo-task-manager` + `expo-background-fetch` (daily steps) |
| Icons | `@expo/vector-icons`, centralized in `src/constants/icon-map.ts` |
| Charts | Custom, built on `react-native-svg` |
| PDF reports | `expo-print` (HTML→PDF) + `expo-sharing` |
| Card export | `react-native-view-shot` (PNG) + `expo-media-library` |
| Photos | `expo-image-picker` (monthly athlete-card photo) |
| Build | EAS Build → signed **APK** (preview) / **AAB** (production) |

## Project structure

```
App.tsx                     App root: DB bootstrap, providers, navigation
index.ts                    Expo entry
app.config.ts               Expo config (permissions, plugins)
eas.json                    EAS build profiles (preview=APK, production=AAB)
drizzle.config.ts           Drizzle Kit config
scripts/make-assets.js      Generates placeholder icon/splash PNGs
src/
  constants/                icon-map.ts (§8), sessionTypes.ts
  data/                     Seed data: exercises, foods, beverages
  db/                       schema.ts, client.ts, bootstrap.ts, seed.ts
  lib/                      Pure domain engines (see below)
  repositories/             Data access + analytics per domain
  stores/                   Zustand stores (user, session, nutrition, walk, smoking,
                            sleep, alcohol, cycle, conditions, usage)
  services/                 backgroundSteps.ts, pdfReport.ts, cardExport.ts
  hooks/                    usePedometer.ts (live step counting)
  theme/                    Design tokens + ThemeProvider
  components/               ui/ primitives, charts/, ExerciseHero, StreakMeter
  navigation/               RootNavigator, TabNavigator, types
  screens/                  onboarding / home / train / nutrition / stats / profile /
                            smoking / health (sleep, alcohol, cycle, conditions)
```

## Domain engines (`src/lib`)

Pure, unit-testable TypeScript — the "insight" half of the app:

- **`calories.ts`** — Mifflin-St Jeor BMR → TDEE (activity multiplier) → goal
  offset → macro split, plus dynamic TDEE refinement from real weight-trend data.
- **`oneRepMax.ts`** — Epley & Brzycki estimated 1-Rep-Max.
- **`met.ts`** — MET-based calorie-burn estimation (incl. pace-aware walk/run).
- **`pedometer.ts`** — accelerometer peak-detection step counter (low-pass filter
  + adaptive threshold + refractory period) as a fallback to the hardware counter.
- **`bodyType.ts`** — ecto/meso/endo estimate from BMI + waist-hip ratio.
- **`recommendations.ts`** — rule-based Coach-Tips engine with transparent reasoning.
- **`smoking.ts`** — smoking health-impact model (life cost, nicotine, money,
  estimated aerobic/VO₂max penalty, resting-HR elevation, quit-benefit timeline).
- **`alcohol.ts`** — accurate alcohol model: pure-alcohol grams (`ml × ABV × 0.789`),
  7 kcal/g energy, standard drinks (WHO 10 g / US 14 g), and Widmark peak-BAC.
- **`sleep.ts`** — sleep-need/debt and a sleep→performance readiness factor.
- **`bodyComposition.ts`** — fat/lean/muscle/water mass reconciliation + FFMI.
- **`cycle.ts`** — menstrual-cycle phases, predictions, and hormone-aware guidance.
- **`rating.ts`** — FIFA/TCG athlete-rating engine (6 attributes + overall & tier).
- **`conditions.ts`** — chronic-condition catalogue with training/nutrition notes.
- **`habits.ts`** — habit impact model (time cost, projections, honest evidence notes).
- **`time.ts`** — time-range math for logging sleep/work as bedtime→wake (handles
  overnight spans and `HH:MM` parsing).

Every formula above is exercised by `npm run verify:engines` (**242 checks**), which
asserts them against known values (BMR, TDEE, 1RM, MET, BAC, FFMI, cycle dates,
time ranges…) and validates library/split integrity.

## Smoking tracker & impact analytics

Opt-in from **Profile → Set up smoking tracker** (or the Nutrition diary card).
Once enabled it:

- Logs cigarettes with one tap (+/− on Home, Nutrition, and the Smoking screen).
- Shows a **smoke-free streak** with the matching US-Surgeon-General recovery
  milestone ("carbon monoxide has cleared", "lung function improving", …).
- Estimates **weekly & projected cost, nicotine, and life-expectancy cost**
  (~11 min/cigarette, Shaw et al. BMJ 2000).
- Estimates **fitness impact**: aerobic-capacity penalty and resting-HR elevation.
- **Correlates with your own logs**: average steps and session calories on days
  you smoked vs. smoke-free days (observational, clearly labelled).
- Feeds **Coach Tips** (e.g. "you trained and smoked today — recovery takes a hit")
  and adds a **Smoking Impact** section to the Stats tab.

All figures are transparent estimates surfaced without judgment.

## Health & wellness suite

Opt-in modules, reachable from **Profile → Health & Wellness** and surfaced on Home,
Stats and Coach Tips:

- **Sleep** — log hours + quality; see 7-night average, sleep debt and a
  performance-readiness factor, plus a correlation of your session output after
  good vs. poor nights.
- **Alcohol** — log beer / wine / spirits / cocktails with adjustable ABV. Computes
  pure-alcohol **grams**, **calories**, **standard drinks**, an **estimated peak BAC**
  (Widmark), weekly total vs. the low-risk guideline, and dry-day count. (33 cl beer
  @ 5%, 75 cl wine @ 9–25%, spirits ≈ 45% are the reference strengths.)
- **Body composition** — a rich weigh-in: weight plus optional body-fat %, muscle
  mass, body-water % and bone mass → derived **fat / lean mass**, muscle-of-lean %,
  water status and **normalized FFMI** with category.
- **Gender & menstrual cycle** — choose your gender identity (with a separate
  biological-sex field kept only for the BMR formula). The opt-in **cycle tracker**
  shows your current phase on a month **calendar** (period / fertile / ovulation),
  predicts your next period, and gives **hormone-aware** training & nutrition guidance
  per phase (follicular = push strength, luteal = favor recovery, …).
- **Chronic conditions** — a catalogue (diabetes, hypertension, asthma, PCOS,
  hypothyroidism, IBS, …) with general, non-diagnostic considerations that flow into
  Coach Tips and the exported reports.

## Athlete card & reports

- **Athlete card** (*Profile → Card & Reports → Athlete card*) — a FIFA/TCG-style card
  with an **Overall** rating and six attributes (STR / END / CON / NUT / REC / DIS)
  computed from your real logged data, a tier (Bronze→Legend), and a **monthly photo**.
  Export it to **PNG** (share or save to Photos) via `react-native-view-shot`.
- **PDF reports** (*Profile → Export PDF reports*) — one-tap **nutritionist** or
  **coach** report rendered on-device (`expo-print`) and opened in the share sheet.
  The nutritionist template leads with nutrition/body-comp/conditions; the coach
  template leads with training/recovery/rating.

## v2 update highlights

- **Per-muscle library (510 exercises)** — every muscle individually: traps (shrugs, high
  pulls), lower back (back extensions, good mornings, bird-dog), glutes (hip thrust,
  kickbacks, abduction machine), each delt head, upper/lower abs and obliques — split by
  barbell / dumbbell / machine-cable / bodyweight, with a `sub_muscle` filter.
- **Mandatory warm-ups** — every muscle group has a required warm-up (from the v2
  reference); active sessions show a warm-up **checklist** before working sets and each
  exercise page shows its muscle's warm-up.
- **Custom routines** — save any session as a named routine from the recap; saving with
  the same name **updates** it. Start routines one-tap from the Train tab.
- **Editable custom exercises** — full category choices (session type, muscle group,
  individual muscle, equipment) matching the library structure; edit any custom exercise
  from the library (pencil icon).
- **Muscle-growth readiness** (Stats → Muscle Growth) — per-muscle scoring against the
  evidence: 10–20 hard sets/week, progressive overload trend, 48–72 h recovery spacing,
  protein ≥1.6 g/kg and 7 h+ sleep gates, plus a realistic natural gain-rate range by
  training age. No fabricated numbers.
- **Trends** (Stats → Trends) — 12 weeks of weekly-bucketed charts: weight, calories,
  protein, water, caffeine, lifting volume, active minutes, steps, sleep, mood, work
  hours, alcohol, cigarettes, habit minutes — plus a fat-distribution card (body type,
  WHR, waist trend).
- **Prayer times** — fully offline solar calculation (Fajr/Sunrise/Dhuhr/Asr/Maghrib/
  Isha) with Tunisia/MWL/ISNA/Egypt/Umm-al-Qura methods, GPS or Tunisian city presets,
  and a next-prayer countdown.
- **Fasting mode** — Ramadan (Suhoor = Fajr, Iftar = Maghrib, auto-synced with prayer
  times) or intermittent eating windows; live fasting timer, fasted-day streak, fasting
  banner in the nutrition diary, and fasted-training guidance.
- **Foods v2** — 9 Tunisian salads (Mechouia, Slata Tounsiya, Houria…), Kafteji, Mlewi
  and **Bsisa**; the honest-log estimator recognizes them by name.
- **Fixed**: the Edit Profile / change-goal screen (now null-safe, validated, and shows
  the recalculated targets immediately after saving).

## Exercise library, splits & beginner guides

- **510 exercises** ([src/data/exercises.ts](src/data/exercises.ts)) organized by muscle
  group and split by equipment family. The library screen filters by **session type ·
  muscle · equipment** and searches by name.
- **Beginner how-to**: each exercise detail shows an SVG **movement illustration**
  (drawn per movement pattern — squat, hinge, press, row, curl…), what it works, the
  gear needed, and **step-by-step form cues** ([ExerciseIllustration](src/components/ExerciseIllustration.tsx)).
- **Training splits** ([src/data/splits.ts](src/data/splits.ts)): Push/Pull/Legs,
  Upper/Lower, Bro, Full-Body and Arnold. Pick a split → pick a day → the session is
  **pre-loaded** with that day's exercises, which you can freely edit.

## Tunisian & Mediterranean food database

The food search ([src/data/foods-tunisian.ts](src/data/foods-tunisian.ts)) adds the full
Tunisian reference — dishes (couscous, brik, lablabi, ojja, mloukhia…), pasta, breads &
sweets, cheeses, milks, legumes, grains, nuts, fruits, meats, seafood and vegetables —
each with estimated macros and a category filter. The **honest-log** estimator also
recognizes Tunisian dishes by name (e.g. "couscous with lamb").

## Habits & work-hours trackers

- **Habits** ([src/lib/habits.ts](src/lib/habits.ts), [HabitsScreen](src/screens/health/HabitsScreen.tsx)):
  a generalized tracker for habits like **doom-scrolling** (time-based) or others you
  choose to log. It reports the honest impact — **time cost** and projected hours/year, a
  **free-day streak**, a **late-night share** (sleep displacement), and a **correlation
  with your own sleep and training**. Crucially, it states **what the evidence actually
  supports** and refuses to invent scary claims where research doesn't back them; framing
  is non-shaming and a slip just restarts a counter.
- **Work hours** ([WorkScreen](src/screens/health/WorkScreen.tsx)): log your day as a
  **start → end** time range (minus breaks) with a focus-quality rating; see weekly totals
  and a gentle nudge when long weeks start crowding out sleep and training.

## Time-range logging

Sleep and work can be logged as a **from → to** time range (`HH:MM`), which derives the
duration in **hours + minutes** (handling overnight spans like 23:30 → 07:00) while
keeping the quick-entry buttons and quality ratings.

## Walk & run tracking (pedometer-first, no GPS)

Tuned for smoothness and battery — GPS was dropped in favour of the phone's own
step hardware ([walkTracking.ts](src/services/walkTracking.ts)):

- On **Start**, FitCoach requests the **Physical-activity** (pedometer) and
  **Notification** permissions in-app — no digging through system settings.
- **Hardware step counter** (TYPE_STEP_COUNTER) is the primary source: it keeps
  counting at the OS level with the screen off and the batched total catches up
  the moment you return. The **accelerometer fallback** runs at 25 Hz (foreground).
- **No more lag**: steps live in an in-memory counter the UI polls directly; SQLite
  is only a crash-safe backup flushed every 3 s (the old per-step DB writes are gone).
- A **sticky notification** pins to the bar for every active session — walk, run
  **and training** — and is dismissed when you finish or discard. Sessions survive
  app restarts and reattach with their step base intact.

> Requires a native build (EAS or a dev client); runtime permissions don't work in
> Expo Go.

## Daily check-in streak

The Home dashboard shows a **streak meter** ([`StreakMeter`](src/components/StreakMeter.tsx))
driven by [`usageRepo`](src/repositories/usageRepo.ts): the app records one `app_open_logs`
row per day on launch, and the meter shows your **current streak** (consecutive days
opened), a **7-day dot row**, your **best** streak and total days, and a progress bar to
the next milestone (3 / 7 / 14 / 30 / 60 / 100 / 200 / 365 days). This is separate from the
*training* streak (consecutive training days) shown in the header and Stats.

## Exercise imagery

Each exercise gets a coherent, self-contained hero image (`ExerciseHero`) — a
session-type–tinted gradient with the exercise's glyph — shown as a thumbnail in the
library and a banner on the exercise detail, so activities are visually recognizable
without shipping copyrighted photos. Real photos/GIFs can replace it later without
changing call sites.

---

## Getting started

```bash
npm install
npm run start           # Expo dev server — press "a" for Android
```

Run on a device with **Expo Go** (sensors/pedometer need a physical device) or
build a dev client:

```bash
npx expo install expo-dev-client
eas build -p android --profile development
```

### Regenerate app icons

The app icon, adaptive icon, splash and favicon in `assets/` are generated by a
small dependency-free raster script (a dumbbell mark on a blue→teal gradient).
Tweak the colors/mark in the script and regenerate:

```bash
node scripts/make-assets.js
```

## Building an installable APK (EAS)

```bash
# One-time
npm install -g eas-cli
eas login
eas build:configure

# Installable APK for your own phone (preview profile → buildType: apk)
npm run build:apk          # eas build -p android --profile preview

# Play Store bundle (production profile → app-bundle)
npm run build:aab          # eas build -p android --profile production
```

EAS handles signing automatically. The `preview` APK can be sideloaded directly.

## Micronutrients & supplements

Beyond macros, FitCoach tracks **vitamins and minerals** and ties them to foods and pills
— without ever touching the calorie/macro math (verified in the engine tests).

- **13 vitamins + 11 minerals + omega-3** with sex-specific RDIs ([micros.ts](src/lib/micros.ts)).
- **194 foods** carry curated per-serving micronutrient data ([foodMicros.ts](src/data/foodMicros.ts));
  logging one stores its scaled micros denormalized on the entry, so history is stable.
  Composite/fast foods contribute macros only — the UI is explicit that micro totals reflect
  "foods & pills with known data", a floor rather than a guess.
- **Micronutrients screen** (Nutrition diary → card): each nutrient as **% of RDI** with
  low/ok/over status, a "running low" gap list, and a food-vs-supplement source split, with
  date paging synced to the diary.
- **Supplements** ([supplements.ts](src/data/supplements.ts), [SupplementsScreen](src/screens/nutrition/SupplementsScreen.tsx)):
  - **Micronutrient pills** (multivitamin, D3, magnesium, zinc, iron, C, B12, omega-3, calcium,
    folate) whose doses **count toward the same micro totals** as food.
  - **Performance & wellness** (creatine, caffeine, beta-alanine, citrulline, whey,
    **ashwagandha**, L-theanine, melatonin, collagen, ZMA, probiotics) tracked for dose &
    consistency with **honest evidence ratings** (strong / moderate / limited / mixed) — no hype.
  - Build a **stack** for one-tap daily logging, with per-supplement streaks.

## Over-the-air updates (no reinstalls)

The app updates itself via **EAS Update** (`expo-updates`): JS and content changes
ship straight into installed builds — no new APK.

```bash
# publish an update with patch notes + a git tag (recommended)
npm run release                       # message = latest CHANGELOG title
npm run release "hotfix: …"           # custom patch-note message

# or a bare update with no tag/notes
npm run update:push                   # = eas update --branch preview
```

`npm run release` reads the current version from [`src/data/changelog.ts`](src/data/changelog.ts),
publishes the JS bundle to the `preview` channel with the patch-note text, creates & pushes a
**git tag**, and publishes a matching **GitHub Release** so the repo's **Releases** tab shows a
titled, "Latest"-badged entry (not just a bare tag). Add a new entry to the top of `changelog.ts`
(and mirror it in [`CHANGELOG.md`](CHANGELOG.md)) before releasing — the app shows it under
**Profile → What's new**, and the GitHub Release body is pulled from the matching `CHANGELOG.md` section.

> The GitHub Release step needs either the **`gh` CLI** (authenticated via `gh auth login`) or a
> **`GITHUB_TOKEN`** env var with `repo` scope. If neither is present, the OTA update and git tag
> still ship and the script prints a "Draft a new release" link to publish the tag manually.

- Installed apps **download the update on launch** and apply it on the next start; **Profile →
  App version** shows the release and an **"Up to date ✓"** status.
- **Profile → Check for app updates** downloads and applies immediately.
- The changelog "version" is a display label, decoupled from the native `version` /
  `runtimeVersion` (which stays fixed so OTA compatibility never breaks).
- `runtimeVersion: { policy: 'appVersion' }` guards compatibility: an update only
  applies to builds whose native runtime matches, so a JS update can never land on
  an APK missing its native modules.
- **Native changes** (new permissions, new native modules, SDK upgrades) still
  require a rebuild: `npm run build:apk`. Rule of thumb — if `package.json` gained
  a native dependency or `app.config.ts` changed, rebuild; otherwise `update:push`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run start` | Expo dev server |
| `npm run android` | Launch on Android |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify:engines` | Run the 173 pure-domain formula checks |
| `npm run db:generate` | Generate Drizzle SQL migrations (optional; runtime uses a bootstrap DDL) |
| `npm run build:apk` | EAS preview APK |
| `npm run build:aab` | EAS production AAB |

## Data & migrations

The schema is defined once in `src/db/schema.ts` (Drizzle) and created at runtime
by an idempotent `CREATE TABLE IF NOT EXISTS` bootstrap in `src/db/bootstrap.ts`
(guarded by `PRAGMA user_version`). Newer columns are added via a guarded
`ALTER TABLE ADD COLUMN` migration step, so an existing dev database upgrades
cleanly.

**Your logs are never broken by library updates.** The exercise library is
**upserted by a stable `slug`** (falling back to name for older databases) rather
than deleted and re-inserted — see [src/db/seed.ts](src/db/seed.ts). Because
`exercise_logs.exercise_id` references those rows, this keeps every past workout
pointing at the right exercise even as the library grows from 46 to 510 entries.
Nutrition/alcohol/session logs likewise store their values denormalized at log
time, so editing a food or exercise definition never rewrites history.

`drizzle-kit generate` is available for diffing/reference but is not required at
runtime, which keeps the managed Expo build free of a Metro `.sql` transformer.

## Privacy

Local-first by design: all health, body, nutrition, smoking, alcohol, sleep and
cycle data stays in an on-device SQLite database. No account or connection is
required; PDF/PNG exports are generated on-device and only leave via the share
sheet you invoke. Cloud sync is an explicit opt-in planned for Phase 2.

Health features (smoking, alcohol, cycle, conditions, BAC, body composition)
surface **general, educational estimates — not medical advice**. FitCoach always
defers to your clinician.

## Roadmap (from the spec)

- **Phase 1 (this build):** universal sessions, full activity library, stats,
  walk/run tracking, nutrition (precise + honest log, water, caffeine), calorie
  calculator, onboarding, local storage, EAS APK — **plus** the health & wellness
  suite: smoking, sleep, alcohol, body composition, gender & menstrual-cycle
  tracking, chronic conditions, the athlete card (PNG), and PDF reports — plus a
  510-exercise library with beginner guides, training splits, a Tunisian food
  database, habit & work-hours trackers, and a daily check-in streak.
- **Phase 2:** dynamic TDEE auto-tuning, barcode scanning, cloud sync, routine
  builder, GPS route maps.
- **Phase 3:** ML recommendations, wearables, deeper report exports (CSV).
