# FitCoach

> Private coaching, nutrition & health app — local-first, offline, Android-first.
> Built from [FitCoach-App-Specification.md](FitCoach-App-Specification.md) (v2.0).

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

Every formula above is exercised by `npm run verify:engines` (**53 checks**), which
asserts them against known values (BMR, TDEE, 1RM, MET, BAC, FFMI, cycle dates…).

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

Placeholder icons live in `assets/`. Replace them with real art, or regenerate
the placeholders:

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

## Scripts

| Script | Purpose |
|---|---|
| `npm run start` | Expo dev server |
| `npm run android` | Launch on Android |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify:engines` | Run the 53 pure-domain formula checks |
| `npm run db:generate` | Generate Drizzle SQL migrations (optional; runtime uses a bootstrap DDL) |
| `npm run build:apk` | EAS preview APK |
| `npm run build:aab` | EAS production AAB |

## Data & migrations

The schema is defined once in `src/db/schema.ts` (Drizzle) and created at runtime
by an idempotent `CREATE TABLE IF NOT EXISTS` bootstrap in `src/db/bootstrap.ts`
(guarded by `PRAGMA user_version`). Newer columns are added via a guarded
`ALTER TABLE ADD COLUMN` migration step, so an existing dev database upgrades
cleanly. The built-in exercise library is seeded on first launch. `drizzle-kit
generate` is available for diffing/reference but is not required at runtime,
which keeps the managed Expo build free of a Metro `.sql` transformer.

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
  tracking, chronic conditions, the athlete card (PNG), and PDF reports.
- **Phase 2:** dynamic TDEE auto-tuning, barcode scanning, cloud sync, routine
  builder, GPS route maps.
- **Phase 3:** ML recommendations, wearables, deeper report exports (CSV).
