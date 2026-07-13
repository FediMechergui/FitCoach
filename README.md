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

Plus an **opt-in smoking tracker** that maps cigarette use onto your training,
steps, money and health with transparent, evidence-based estimates and
correlations drawn from your own data.

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
  stores/                   Zustand stores (user, session, nutrition, walk, smoking)
  services/                 backgroundSteps.ts (passive step counting)
  hooks/                    usePedometer.ts (live step counting)
  theme/                    Design tokens + ThemeProvider
  components/               ui/ primitives + charts/
  navigation/               RootNavigator, TabNavigator, types
  screens/                  onboarding / home / train / nutrition / stats / profile / smoking
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
| `npm run db:generate` | Generate Drizzle SQL migrations (optional; runtime uses a bootstrap DDL) |
| `npm run build:apk` | EAS preview APK |
| `npm run build:aab` | EAS production AAB |

## Data & migrations

The schema is defined once in `src/db/schema.ts` (Drizzle) and created at runtime
by an idempotent `CREATE TABLE IF NOT EXISTS` bootstrap in `src/db/bootstrap.ts`
(guarded by `PRAGMA user_version`). The built-in exercise library is seeded on
first launch. `drizzle-kit generate` is available for diffing/reference but is
not required at runtime, which keeps the managed Expo build free of a Metro
`.sql` transformer.

## Privacy

Local-first by design: all health, body, nutrition and smoking data stays in an
on-device SQLite database. No account or connection is required. Cloud sync is an
explicit opt-in planned for Phase 2.

## Roadmap (from the spec)

- **Phase 1 (this build):** universal sessions, full activity library, stats,
  walk/run tracking, nutrition (precise + honest log, water, caffeine), calorie
  calculator, onboarding, smoking tracker, local storage, EAS APK.
- **Phase 2:** dynamic TDEE auto-tuning, barcode scanning, cloud sync, routine
  builder, GPS route maps.
- **Phase 3:** ML recommendations, wearables, PDF/CSV export.
