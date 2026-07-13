# FitCoach — Private Coaching, Nutrition & Health App
### Android App Specification Document

**Version:** 2.0
**Purpose:** Full functional and technical specification for a personal fitness-tracking, nutrition-coaching, and health-analytics Android application.

> **Changelog v1 → v2:** tech stack moved to React Native + Expo (SQLite kept), APK packaging via EAS Build, added a full iconography system, expanded exercise types (Calisthenics, Pilates, Yoga, Meditation/Mindfulness, outdoor & sports activities like marathon/running, cycling, tennis, soccer), and enhanced nutrition tracking with an "honest log" mode plus water and coffee/caffeine tracking.

---

## 1. Vision

FitCoach is a personal Android companion that acts as a private coach. It removes the guesswork from training and diet by combining three pillars in one app:

1. **Session Tracking** — log every set, rep, and weight in real time via a check-in / check-out flow, across strength, cardio, calisthenics, mind-body, and outdoor/sport sessions.
2. **Movement Tracking** — use the phone's accelerometer/pedometer to log walks, runs, and daily steps.
3. **Nutrition & Recommendations** — track meals (including an honest, judgment-free log), water and caffeine intake, calculate calorie needs, and receive personalized coaching advice based on body metrics and progress trends.

The guiding principle: **minimal friction during a session, maximum insight afterward.**

---

## 2. Target Platform & Tech Stack

| Item | Choice |
|---|---|
| OS | Android 8.0 (API 26) and above |
| Framework | **React Native + Expo** (managed workflow) |
| Language | TypeScript |
| UI | React Native core components + a design-system layer (custom theme: spacing, color tokens, typography) built on top of `react-native-paper` or `tamagui` |
| Icons | `@expo/vector-icons` (bundles Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 — no extra native linking needed) |
| Local Database | **SQLite** via `expo-sqlite`, accessed through `drizzle-orm` (typed schema + migrations) |
| Sensors | `expo-sensors` → `Pedometer` (hardware step counter) and `Accelerometer` (raw motion, fallback pedometer algorithm) |
| Location (optional) | `expo-location` for route/distance on outdoor sessions |
| Navigation | `@react-navigation` (bottom tabs: Home / Train / Nutrition / Stats / Profile, + stack navigators per tab) |
| State Management | Zustand (lightweight, no boilerplate) |
| Background tracking | `expo-task-manager` + `expo-background-fetch` for passive daily step counting while the app is closed |
| Charts | `victory-native` or `react-native-gifted-charts` |
| Build & Packaging | **EAS Build** (Expo Application Services) — builds a signed Android **APK** (or AAB) in the cloud without ejecting from Expo, no local Android Studio setup required |
| Offline-first | Yes — 100% of core features work with no internet connection |
| Optional Cloud Sync | Supabase or Firebase (Phase 2) |

### 2.1 Build & Distribution (EAS)

```
# One-time setup
npx expo install expo-dev-client
eas login
eas build:configure

# eas.json — build profiles
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }   // <- direct installable APK, for testing on your own phone
    },
    "production": {
      "android": { "buildType": "app-bundle" }  // <- AAB, for Play Store submission later
    }
  }
}

# Generate the installable APK
eas build -p android --profile preview
```

- The `preview` profile produces a downloadable **.apk** file you can sideload directly onto your phone (or share) — no Play Store needed.
- The `production` profile produces an **.aab** for eventual Play Store release.
- EAS handles the signing keystore automatically (or you can supply your own).
- `expo-sqlite` databases are bundled with the app and persist locally on-device; no native module linking is required since Expo manages it.

---

## 3. Core Modules

### 3.1 Session Tracking (Check-in / Check-out)

Every activity — lifting, a run, a soccer match, a meditation sit — follows the same universal flow, but the fields captured adapt to the **session type**.

**Check-in**
- User taps **"Start Session"** → picks a session type (see §3.2) → timer begins.
- Optional: select a saved routine/template to auto-populate exercises.

**During the session (Strength/Calisthenics type)**
- Add exercises from the **Exercise Library** (searchable, filterable).
- Each exercise logs **sets**: reps, weight (kg/lb toggle), RPE (1–10, optional), auto rest-timer between sets.
- "Repeat last set" quick-button auto-fills previous weight/reps for fast logging.
- Superset/circuit grouping supported.

**During the session (Cardio/Outdoor/Sport type)**
- Duration, distance (GPS or manual), pace, elevation (if available), RPE, and — for sports like tennis/soccer — optional score/sets-won or minutes-played fields.

**During the session (Mind-body type — Meditation, Yoga, Pilates)**
- Duration, technique/style tag, and an optional mood check-in (before/after, simple emoji scale).

**Check-out**
- Recap screen: duration, total volume (strength) or distance/pace (cardio) or duration+mood (mind-body), personal records auto-detected, estimated calories burned (MET-based), muscle groups worked (body-map heatmap for strength/calisthenics).
- Session saved permanently to history and feeds the Statistics module.

---

### 3.2 Exercise & Activity Library

A structured, filterable library covering strength, bodyweight, mind-body, and outdoor/sport activity types.

**Top-level Session Types:**

| Session Type | Examples | Primary tracked fields |
|---|---|---|
| **Strength / Resistance** | Barbell, dumbbell, machine, cable, kettlebell, resistance band | Sets, reps, weight, RPE |
| **Calisthenics** | Pull-ups, dips, push-up variations, pistol squats, muscle-ups, planche/handstand progressions | Sets, reps, added weight (optional), skill progression level |
| **Cardio (indoor)** | Treadmill, stationary bike, rower, elliptical, stair climber | Duration, distance, pace/resistance, calories |
| **Outdoor Endurance** | Running, marathon/half-marathon training, cycling, swimming, hiking | Distance, pace, elevation, duration, splits |
| **Racket & Team Sports** | Tennis, padel, soccer, basketball, volleyball, badminton | Duration, RPE, optional score/sets, calories (MET-based) |
| **Mind-Body / Flexibility** | Yoga, Pilates, stretching, mobility work, foam rolling | Duration, style/technique, intensity |
| **Meditation / Mindfulness** | Breathwork, guided meditation, body scan, unguided sit | Duration, technique, mood before/after |
| **Custom** | Anything not covered above | User-defined fields |

**Each exercise/activity entry contains:** name, category tags, primary/secondary muscles (where relevant), short instructional description, default tracking unit, and an assigned icon (see §8).

**Custom exercises/activities:** users can create and save their own, choosing which fields to track (reps+weight, duration, distance, or a free mix).

---

### 3.3 Statistics & Analytics

Every logged session feeds a personal analytics engine.

**Per-exercise/activity statistics:**
- Progression chart of max weight / estimated 1-Rep-Max over time (Epley or Brzycki formula) for strength/calisthenics
- Pace and distance progression for running/cycling/swimming
- Volume trend (weight × reps × sets) per week/month
- Personal Records (PRs) timeline across all session types

**Global statistics:**
- Weekly/monthly training frequency and consistency streak (calendar heatmap, GitHub-style)
- Total volume lifted (all-time, monthly, weekly)
- Muscle-group balance chart
- Session duration trends, broken down by session type
- Calories burned — training + outdoor/sport + walking combined
- Body-weight trend chart
- Meditation/mindfulness minutes streak
- Mood-over-time trend (from mind-body session check-ins)

---

### 3.4 Movement & Outdoor Tracking (Walk / Run / Sport)

**Step & Walk tracking:**
- User taps **"Start Walk"** (or "Start Run" for pace-focused sessions).
- App uses the device's **hardware step counter** (`expo-sensors` `Pedometer`, backed by `TYPE_STEP_COUNTER`) as the primary source, with a raw **accelerometer-based pedometer algorithm** as a fallback:
  1. Read accelerometer XYZ at high frequency (~50Hz).
  2. Compute magnitude vector: `mag = sqrt(x² + y² + z²)`.
  3. Apply a low-pass filter to smooth noise.
  4. Detect peaks above a dynamic threshold to count each step.
- Tracks: step count, elapsed time, distance (steps × stride length, or GPS if enabled), pace, calories burned.
- Optional GPS route map and speed graph via `expo-location`.

**Outdoor endurance & sport sessions:**
- Same check-in/check-out flow, tailored fields: distance/splits for running & marathon training, laps for swimming, elevation for hiking/cycling, and duration + RPE + optional score for tennis/soccer/team sports.

**Background daily step counter:** passively counts all-day steps (via `expo-task-manager` background fetch) and displays a daily step-goal ring, independent of any explicit "Walk" session.

---

### 3.5 Nutrition & Diet Tracking

- **Food log** organized by meal (Breakfast, Lunch, Dinner, Snacks).
- Two logging modes:
  - **Precise mode:** search the built-in food database or enter custom macros (calories, protein, carbs, fat, fiber per serving); barcode scanning in Phase 2.
  - **Honest log mode:** a fast, judgment-free freeform entry — "what did you *actually* eat" — where the user types a plain-language description (e.g., "burger, fries, and a soda" or "skipped lunch, big dinner") and the app estimates calories/macros from the description, flags it visually as an *estimate*, and lets the user adjust. This exists specifically so off-plan meals or uncertain days still get logged instead of skipped — accuracy of the daily picture matters more than perfect precision on any single entry.
- **Water intake tracker:** quick-add buttons (+250 ml / +500 ml / custom), daily goal ring (e.g., 2.5 L), reminder notifications (opt-in).
- **Coffee & caffeine tracker:** log coffee, tea, energy drinks, or soda by cup/serving; app estimates total daily caffeine (mg) using per-beverage-type defaults (editable), with a soft daily-limit indicator (e.g., 400 mg guideline) — informational only, not a hard restriction.
- Daily nutrition dashboard: calories consumed vs. goal, macro breakdown (ring chart), water ring, caffeine total.
- Weekly nutrition trends and adherence score, including how often "honest log" vs "precise" entries were used (helps the user see their own logging consistency, not to judge food choices).

---

### 3.6 Smart Calorie Calculator

Calculates personalized calorie and macro targets based on user profile.

**Inputs:** age, sex, height, current weight, body-fat estimate (optional), activity level, goal (lose fat / maintain / build muscle), and rate of desired change.

**Calculation pipeline:**
1. **BMR (Basal Metabolic Rate)** — Mifflin-St Jeor equation:
   - Men: `BMR = 10×weight(kg) + 6.25×height(cm) − 5×age + 5`
   - Women: `BMR = 10×weight(kg) + 6.25×height(cm) − 5×age − 161`
2. **TDEE (Total Daily Energy Expenditure)** = `BMR × Activity Multiplier`
   - Sedentary: ×1.2, Light: ×1.375, Moderate: ×1.55, Active: ×1.725, Very active: ×1.9
3. **Dynamic adjustment:** TDEE is refined automatically over time by comparing actual logged calories vs. actual weight-trend changes.
4. **Goal offset:** Fat loss → TDEE − 15–20% · Maintenance → TDEE · Muscle gain → TDEE + 10–15%
5. **Macro split** (adjustable): Protein 1.6–2.2 g/kg body weight · Fat 20–30% of calories · Carbs remainder.

The calculator factors in calories burned from logged sessions (strength, cardio, outdoor, sport) for an "adjusted daily budget" — base goal + exercise calories = today's total allowance.

---

### 3.7 Personalized Recommendations Engine

Rule-based coaching logic (Phase 1), evolving toward ML-based refinement (Phase 3).

**Body-type-aware suggestions:** body type estimated from height/weight/waist-hip inputs (Ectomorph/Mesomorph/Endomorph-leaning) biases initial calorie/macro defaults and training volume suggestions; recommendations refresh weekly based on real trend data.

**Types of recommendations generated:**
- **Training:** flags neglected muscle groups or session types (e.g., "no mobility work in 3 weeks"), suggests deload weeks after detecting fatigue patterns, recommends progressive overload increments.
- **Nutrition:** flags days significantly under/over calorie or protein targets, suggests recalibrating calorie target if weight trend stalls or moves too fast.
- **Hydration/Caffeine:** gentle nudge if water intake is consistently low or caffeine is trending high.
- **Recovery:** flags consecutive high-volume sessions with no rest day; suggests a rest or mind-body/mobility day.
- **Activity:** suggests a walk or light cardio if daily step count is far below goal and no session is planned.

All recommendations appear as dismissible "Coach Tips" cards on the home dashboard with brief transparent reasoning (e.g., "Your bench volume dropped 20% over 2 weeks — consider a deload.").

---

## 4. Data Models (Simplified Schema)

```
User
 ├─ id, name, sex, birthdate, height_cm
 ├─ activity_level, goal, body_type
 └─ unit_preference (metric/imperial)

WeighIn
 ├─ id, user_id, date, weight_kg, body_fat_pct (optional)

Session
 ├─ id, user_id, session_type (strength/calisthenics/cardio/outdoor/sport/mindbody/meditation/custom)
 ├─ start_time, end_time, label
 ├─ total_volume (strength), distance_m (outdoor), duration_s
 ├─ calories_burned
 ├─ mood_before, mood_after (mind-body/meditation only)
 └─ exercise_logs: [ExerciseLog]  |  activity_detail: {distance, pace, elevation, score}

ExerciseLog
 ├─ id, session_id, exercise_id
 └─ sets: [SetEntry]

SetEntry
 ├─ id, exercise_log_id, set_number
 ├─ reps, weight_kg, rpe, is_pr (bool)

Exercise (library)
 ├─ id, name, category, session_type, muscle_groups[], equipment
 ├─ tracking_type, icon_key

WalkSession
 ├─ id, user_id, start_time, end_time
 ├─ steps, distance_m, calories_burned, avg_pace

DailyStepLog
 ├─ id, user_id, date, step_count

FoodEntry
 ├─ id, user_id, date, meal_type
 ├─ log_mode (precise/honest)
 ├─ food_name, free_text_description (honest mode)
 ├─ calories, protein_g, carbs_g, fat_g, serving_size
 └─ is_estimated (bool)

BeverageEntry
 ├─ id, user_id, date, type (water/coffee/tea/energy_drink/soda/other)
 ├─ volume_ml, caffeine_mg (estimated or user-edited)

NutritionGoal
 ├─ id, user_id, calorie_target, protein_g, carbs_g, fat_g
 ├─ water_goal_ml, caffeine_soft_limit_mg
 └─ last_recalculated_date

CoachTip
 ├─ id, user_id, date, category, message, dismissed (bool)
```

---

## 5. Key User Flows

**Flow A — Strength/Calisthenics Session**
`Home → Start Session → Select type: Strength/Calisthenics → Select/Skip Template → Add Exercise → Log Sets (repeat) → Rest Timer (auto) → End Session → Recap → Auto-saved to Stats`

**Flow B — Outdoor / Sport Session**
`Home → Start Session → Select type: Run/Cycle/Tennis/Soccer/etc → (GPS + accelerometer track in background) → Live stats overlay → End Session → Recap → Auto-saved`

**Flow C — Mind-Body / Meditation Session**
`Home → Start Session → Select type: Meditation/Yoga/Pilates → Mood check-in (before) → Timer runs → Mood check-in (after) → Recap`

**Flow D — Nutrition**
`Home → Diary Tab → Select Meal → Precise search OR "Log it honestly" free text → Macro dashboard updates → Water/Coffee quick-add buttons on same screen`

**Flow E — Onboarding (first launch)**
`Welcome → Personal Info → Activity Level → Goal Selection → Body-type Quick Assessment → Calorie/Macro/Water/Caffeine Targets Generated → Home Dashboard`

---

## 6. Technical Architecture

```
┌───────────────────────────────────────┐
│              UI Layer                  │  React Native + Expo, react-navigation
├───────────────────────────────────────┤
│           State (Zustand stores)       │  session store, nutrition store, user store
├───────────────────────────────────────┤
│           Repository Layer             │  Workout / Nutrition / Activity / User repos
├───────────────────────────────────────┤
│              Data Sources              │
│  ├─ SQLite via expo-sqlite + drizzle   │
│  ├─ expo-sensors (Pedometer/Accel.)    │
│  ├─ expo-location (optional GPS)       │
│  ├─ Bundled food DB (JSON/SQLite)      │
│  └─ Optional Cloud Sync (Phase 2)      │
└───────────────────────────────────────┘
```

**Key Expo/RN packages:**
- `expo-sqlite` + `drizzle-orm` — local relational storage with typed schema/migrations
- `expo-sensors` — `Pedometer` and `Accelerometer` APIs for step/motion tracking
- `expo-task-manager` + `expo-background-fetch` — background step counting when app is closed
- `expo-notifications` — rest-timer alerts, hydration reminders, weekly recap
- `expo-location` — optional GPS for outdoor sessions
- `@expo/vector-icons` — full icon system (see §8)
- `victory-native` / `react-native-gifted-charts` — progression and trend charts
- `eas-build` — cloud APK/AAB generation, no native Android Studio project required

---

## 7. Notifications & Coaching Touchpoints

- Rest-timer completion alert during a strength session
- Daily step-goal and water-goal progress notifications (opt-in)
- "You haven't logged a session in 4 days" gentle nudge
- Weekly recap notification: volume, steps, nutrition adherence, meditation minutes
- Coach Tip push when a significant trend is detected

---

## 8. Iconography System

All icons come from `@expo/vector-icons` (no extra native linking needed) — primarily `MaterialCommunityIcons` and `Ionicons`, with `FontAwesome5` for a few sport-specific glyphs. Centralizing them in one map (`icon-map.ts`) keeps the whole app visually consistent and makes it trivial to swap icon sets later.

### 8.1 Navigation & Core Screens

| Screen / Action | Icon (library:name) |
|---|---|
| Home dashboard | `Ionicons:home` |
| Train tab | `MaterialCommunityIcons:dumbbell` |
| Nutrition tab | `MaterialCommunityIcons:food-apple` |
| Stats tab | `Ionicons:stats-chart` |
| Profile/Settings | `Ionicons:person-circle` |
| Start Session (generic) | `Ionicons:play-circle` |
| End Session / Check-out | `Ionicons:stop-circle` |
| Timer / Rest timer | `Ionicons:timer-outline` |
| Notifications | `Ionicons:notifications-outline` |
| Add / Quick-add (+) | `Ionicons:add-circle` |
| Edit | `Ionicons:create-outline` |
| Delete | `Ionicons:trash-outline` |
| Calendar / History | `Ionicons:calendar-outline` |
| Streak / Fire | `Ionicons:flame` |
| Personal Record badge | `MaterialCommunityIcons:trophy-award` |

### 8.2 Strength & Calisthenics

| Item | Icon |
|---|---|
| Barbell exercise | `MaterialCommunityIcons:weight-lifter` |
| Dumbbell exercise | `MaterialCommunityIcons:dumbbell` |
| Machine exercise | `MaterialCommunityIcons:cog-outline` |
| Cable exercise | `MaterialCommunityIcons:cable-data` |
| Kettlebell | `MaterialCommunityIcons:kettlebell` |
| Resistance band | `MaterialCommunityIcons:vector-line` |
| Calisthenics / bodyweight | `MaterialCommunityIcons:human-handsup` |
| Pull-up / bar work | `MaterialCommunityIcons:human-handsup` (bar variant asset) |
| Core / Abs | `MaterialCommunityIcons:ab-testing` (placeholder) or custom "core" icon |
| Legs / Squat pattern | `MaterialCommunityIcons:yoga` (as a leg/hip glyph) |
| Push pattern | `Ionicons:arrow-up-circle-outline` |
| Pull pattern | `Ionicons:arrow-down-circle-outline` |

### 8.3 Cardio, Outdoor & Sports

| Item | Icon |
|---|---|
| Treadmill / Indoor run | `MaterialCommunityIcons:run` |
| Outdoor Running | `Ionicons:walk` / `MaterialCommunityIcons:run-fast` |
| Marathon / Long-distance | `MaterialCommunityIcons:run-fast` + `MaterialCommunityIcons:map-marker-distance` |
| Cycling | `MaterialCommunityIcons:bike` |
| Swimming | `MaterialCommunityIcons:swim` |
| Rowing machine | `MaterialCommunityIcons:rowing` |
| Elliptical | `MaterialCommunityIcons:elevation-rise` (placeholder) |
| Hiking | `MaterialCommunityIcons:hiking` |
| Soccer | `MaterialCommunityIcons:soccer` |
| Tennis | `MaterialCommunityIcons:tennis` |
| Padel/Racket sports | `MaterialCommunityIcons:tennis-ball` |
| Basketball | `MaterialCommunityIcons:basketball` |
| Volleyball | `MaterialCommunityIcons:volleyball` |
| Badminton | `MaterialCommunityIcons:badminton` |
| Walk session | `MaterialCommunityIcons:walk` |
| Steps counter | `MaterialCommunityIcons:shoe-print` |
| GPS route | `Ionicons:map-outline` |
| Pace/Speed | `MaterialCommunityIcons:speedometer` |
| Elevation | `MaterialCommunityIcons:image-filter-hdr` |

### 8.4 Mind-Body & Meditation

| Item | Icon |
|---|---|
| Yoga | `MaterialCommunityIcons:yoga` |
| Pilates | `MaterialCommunityIcons:human` (or a dedicated Pilates asset) |
| Stretching / Mobility | `MaterialCommunityIcons:stretch-to-page-outline` (placeholder for a stretch pose glyph) |
| Meditation | `MaterialCommunityIcons:meditation` |
| Breathwork | `Ionicons:cloud-outline` (used as a "breath" metaphor) |
| Mood check-in | `Ionicons:happy-outline` / `Ionicons:sad-outline` (emoji scale) |

### 8.5 Nutrition, Water & Caffeine

| Item | Icon |
|---|---|
| Meal — Breakfast | `MaterialCommunityIcons:food-croissant` |
| Meal — Lunch | `MaterialCommunityIcons:food-drumstick-outline` |
| Meal — Dinner | `MaterialCommunityIcons:food-turkey` |
| Meal — Snack | `MaterialCommunityIcons:food-apple-outline` |
| Precise food search | `Ionicons:search` |
| Honest log (freeform) | `MaterialCommunityIcons:pencil-outline` + `Ionicons:chatbubble-ellipses-outline` |
| Estimated entry flag | `Ionicons:help-circle-outline` |
| Barcode scan (Phase 2) | `Ionicons:barcode-outline` |
| Water intake | `MaterialCommunityIcons:cup-water` |
| Coffee | `MaterialCommunityIcons:coffee` |
| Tea | `MaterialCommunityIcons:tea` |
| Energy drink | `MaterialCommunityIcons:cup` |
| Soda | `MaterialCommunityIcons:bottle-soda-classic-outline` |
| Caffeine gauge | `MaterialCommunityIcons:lightning-bolt-outline` |
| Protein | `MaterialCommunityIcons:egg-fried` |
| Carbs | `MaterialCommunityIcons:bread-slice` |
| Fat | `MaterialCommunityIcons:oil` |
| Calories | `MaterialCommunityIcons:fire` |

### 8.6 Stats & Body

| Item | Icon |
|---|---|
| Weight trend | `MaterialCommunityIcons:scale-bathroom` |
| Body-fat % | `MaterialCommunityIcons:human-male-height` |
| Muscle-group heatmap | `MaterialCommunityIcons:human` |
| Volume chart | `Ionicons:bar-chart-outline` |
| Progression line chart | `Ionicons:trending-up` |
| Consistency calendar heatmap | `Ionicons:grid-outline` |
| Coach Tip card | `Ionicons:bulb-outline` |

> **Implementation note:** store this mapping as a single typed object (`ICONS.strength.barbell`, `ICONS.nutrition.water`, etc.) in `src/constants/icon-map.ts` so every screen references icons by semantic key rather than hardcoding library/name strings — this makes a future icon-set swap (or adding user-selectable icon themes) a one-file change.

---

## 9. MVP Roadmap

**Phase 1 — Core MVP (React Native + Expo)**
- Universal session check-in/check-out (strength, calisthenics, cardio, outdoor, sport, mind-body, meditation)
- Exercise/activity library covering all session types above
- Basic statistics (progression charts, PRs, volume, mood/meditation trends)
- Walk/Run mode with `expo-sensors` Pedometer + accelerometer fallback
- Nutrition diary: precise + honest-log modes, water tracker, coffee/caffeine tracker, static-formula calorie calculator
- Onboarding + body-type quick assessment
- Local-only storage (`expo-sqlite`), no login required
- Packaged and distributed as a signed **.apk** via **EAS Build**

**Phase 2 — Smart Layer**
- Dynamic TDEE auto-adjustment based on real trend data
- Rule-based Coach Tips engine
- Barcode food scanning
- Cloud backup/sync (Supabase/Firebase) + multi-device support
- Custom routine/template builder
- GPS route maps for outdoor sessions

**Phase 3 — Advanced Coaching**
- ML-based recommendation refinement
- Social/sharing features (optional, private by default)
- Wearable integration (Wear OS, heart-rate sensors)
- Export reports (PDF/CSV) for personal trainers or doctors

---

## 10. Privacy Note

All health, body, and nutrition data is inherently sensitive. The MVP is designed **local-first** — SQLite on-device, no account or internet connection required to use core features — with cloud sync as an explicit opt-in in Phase 2, encrypted in transit and at rest.

---

*End of specification.*
