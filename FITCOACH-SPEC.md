# FitCoach — Complete Application Specification

**Version 2.64 · documented from source, not from memory.**

This describes every screen, feature, engine and table of FitCoach exactly as it
exists today. It is written to be handed to a designer: every figure names the
function that produces it, every screen lists what it actually renders, and every
count below was measured by running against the real catalogues rather than
estimated. Where something is thin, stubbed, or reachable from only one place,
it says so.

---

## 1. What the app is

A local-first, offline, Android-first fitness and health tracker. Everything is
stored on the device in SQLite; there is no account, no server, and no sync. Two
features reach the network at all: a weather lookup (no key, rounded coordinates)
and the optional photo food logger (the user's own OpenRouter key, stored only on
the device). Everything else works with the radio off.

| | |
|---|---|
| Platform | React Native 0.76.9 / Expo SDK 52, TypeScript |
| Storage | expo-sqlite + drizzle ORM, 41 tables, schema version 32 |
| State | zustand (15 stores) |
| Navigation | React Navigation — 5 bottom tabs + 46 stack routes |
| Package | `com.fitcoach.app`, versionCode 2, runtimeVersion 2.0.0 |
| Updates | Expo OTA; JS-only changes ship without a new APK |
| Dependencies | 30 runtime packages |
| Verification | `scripts/verify-engines.ts` — 1433 pure-function checks, run before every release |

### Verified content inventory

Every number here was produced by executing against the shipped catalogues.

| Catalogue | Count |
|---|---|
| Exercises (total seeded) | 759 |
| Exercises (browsable; 6 are aliases of duplicates) | 753 |
| Foods (catalogue) | 321 |
| Foods (offered in search; 5 generic twins hidden) | 316 |
| Foods carrying a micronutrient profile | 321 |
| Composite recipes (dishes built from ingredients) | 77 |
| Micronutrients tracked, each with an RDI by sex | 26 |
| Training splits (16 days between them) | 5 |
| Training methods | 102 |
| Programmes | 34 |
| Special programmes | 61 |
| Daily challenges | 44 |
| Achievements | 130 |
| Supplements | 28 |
| Nicotine products | 11 |
| Outdoor activities | 7 |
| Released versions (in-app changelog) | 66 |

**Exercise session types:** strength, calisthenics, cardio, outdoor, sport,
mindbody, martial_arts, meditation.

**Exercise difficulty spread (1–5):** 45 / 217 / 374 / 103 / 14.

### Android permissions requested

`ACTIVITY_RECOGNITION`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`,
`ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`,
`FOREGROUND_SERVICE_HEALTH`, `RECEIVE_BOOT_COMPLETED`, `POST_NOTIFICATIONS`,
`READ_MEDIA_IMAGES`, `WRITE_EXTERNAL_STORAGE`, `WAKE_LOCK`, `INTERNET`, and
`CAMERA` (merged in by expo-image-picker).

### The five tabs

`Home` · `Train` · `Nutrition` · `Stats` · `Profile` — everything else is a stack
route pushed over them.

---

## 2. App shell, navigation, onboarding and the design system

FitCoach boots from a single App.tsx that initialises the SQLite database, hydrates four zustand stores, and wraps everything in GestureHandlerRootView → SafeAreaProvider → ThemeProvider → ErrorBoundary → NavigationContainer. Navigation is one native stack (RootNavigator) whose first child is either the Onboarding screen or a 5-tab bottom navigator (Home, Train, Nutrition, Stats, Profile), followed by 46 pushed/modal stack routes. Onboarding is a 6-step wizard that collects name, gender, biological sex, birthdate, height, weight, activity level, goal, pace and optional waist/hip, previews Mifflin-St Jeor targets, then writes the user row, a weigh-in, a nutrition goal and the onboardedAt stamp in one go. The design system is a token file (src/theme/index.ts — 9 typography variants, 7 spacing steps, 5 radii, ~40 colour tokens with a dark and a light palette), a 13-file UI kit in src/components/ui, ~17 shared domain components, 5 chart primitives, and a single semantic icon map (src/constants/icon-map.ts) with 26 namespaces resolving dotted keys onto @expo/vector-icons.

### Screens (5)

#### App (root shell)

**Route** `(not a route) — the React root, rendered from index.ts`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/App.tsx`  
**Reached from** App launch.

Boots the database, hydrates stores, installs the theme/navigation/error providers, and decides between a blank splash, a fatal database screen, or the app.

**Layout, top to bottom**

- `if (!ready)` — a bare <View> filled with colors.bg (#0B1220 dark / #F5F7FB light). No logo, no spinner, no text. This is the entire loading state.
- `if (fatal)` — hard-coded (non-tokenised) screen: background #0B1220, padding 24, vertically centred ScrollView with gap 12. Line 1: "Couldn't start the database" in #FF5D5D, 22px, weight 800. Line 2: `{fatal.name}: {fatal.message}` in #EAF0F7, 15px. There is no retry button and no other affordance — the app is stuck here.
- Normal path: GestureHandlerRootView(flex:1) > SafeAreaProvider > ThemeProvider > ErrorBoundary > NavigationContainer(theme=navTheme) > [ StatusBar style={scheme==='light'?'dark':'light'}, RootNavigator ]

**Interactions**

- None. The loading view and the fatal view have zero touch targets.
- StatusBar bar-style flips with the OS colour scheme.

**What it shows, and from where**

- fatal.name / fatal.message — the Error thrown by `initDatabase()` from src/db/bootstrap.ts
- React Navigation theme colours are mapped from the token palette: primary←colors.primary, background←colors.bg, card←colors.surface, text←colors.text, border←colors.border, notification←colors.accent, layered on DefaultTheme (light) or DarkTheme (dark).

**What it writes**

- initDatabase() (src/db/bootstrap.ts) — idempotent CREATE TABLE IF NOT EXISTS DDL for the whole schema, ALTER TABLE ADD COLUMN backfills, and a version-gated re-seed of EXERCISE_LIBRARY. SCHEMA_VERSION = 32 (v2.64 bump adds 163 exercises).
- useUsageStore.record() → recordAppOpen() writes today's date into the app_open_logs table, then recomputes usageStreak().
- useWalkStore.resume() and services/walkTracking.cleanupOrphanWalk() may touch live_walks.
- registerBackgroundSteps() + syncTodaySteps() (services/backgroundSteps) register the TaskManager background task and sync the hardware step counter.

**Empty, loading and error states**

- Loading: `ready === false` → the blank coloured View. Nothing indicates progress.
- Fatal: only initDatabase() is treated as fatal. Everything else runs inside `safe(label, fn)`, which catches and `console.warn`s `[startup] <label> failed:` — a failed user store, smoking store, usage streak or walk resume is silent to the user.
- Render crash anywhere below: caught by ErrorBoundary (see its own entry).

> The fatal screen hard-codes #0B1220 / #FF5D5D / #EAF0F7 rather than using tokens, because the ThemeProvider is not mounted yet at that point. The three background tasks (registerBackgroundSteps, syncTodaySteps, cleanupOrphanWalk) are fired after setReady(true) and their promises are swallowed with `.catch(() => {})`.

#### ErrorBoundary (crash fallback)

**Route** `(not a route) — wraps the whole NavigationContainer`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ErrorBoundary.tsx`  
**Reached from** Any uncaught error thrown during render below <ErrorBoundary>.

Class component that catches render-time crashes so a JS error shows a readable screen instead of a white screen.

**Layout, top to bottom**

- Full-screen View, backgroundColor #0B1220, padding 24, vertically centred, containing a ScrollView with gap 12.
- Title: "Something went wrong" — #FF5D5D, 22px, weight 800.
- Body copy: "FitCoach hit an error while starting up. This message is here so it isn't just a blank screen — please share it if it keeps happening." — #EAF0F7, 15px.
- A #141C2E card, radius 12, padding 14, containing `{error.name}: {error.message}` in #FFB454 13px/700, and beneath it the first 8 lines of error.stack in #9AA6B8 11px.
- A #4F8CFF button, radius 12, padding 14, centred label "Try again" in #fff/700.

**Interactions**

- "Try again" — `this.setState({ error: null })`, i.e. a pure re-render retry; it does not reload the bundle or reset navigation.

**What it shows, and from where**

- error.name, error.message, error.stack (first 8 lines) from React's getDerivedStateFromError.
- componentDidCatch also console.errors 'FitCoach crashed:' with the component stack, so it lands in adb logcat / Metro.

**What it writes**

- Nothing.

**Empty, loading and error states**

- Only two: children (no error) or the fallback.

> All colours are hard-coded hex, not theme tokens — this screen is identical in light mode.

#### RootNavigator (native stack)

**Route** `createNativeStackNavigator<RootStackParamList> — 47 declared routes`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/navigation/RootNavigator.tsx (route types in src/navigation/types.ts)`  
**Reached from** n/a — root.

The single stack for the whole app. Chooses between the onboarding screen and the tab navigator on `!!user?.onboardedAt`, then declares every pushed and modal page.

**Layout, top to bottom**

- screenOptions (headerBase) applied to every screen: headerStyle.backgroundColor = colors.bg; headerTintColor = colors.text; headerTitleStyle = { fontWeight: '700' }; headerShadowVisible: false; contentStyle.backgroundColor = colors.bg.
- BRANCH A — `!onboarded`: exactly one screen, `Onboarding` (params: undefined), headerShown: false. No other route exists in this branch, so a deep link to anything else cannot resolve before onboarding.
- BRANCH B — `onboarded`: 46 screens, in declaration order below.
- 1. Main — params NavigatorScreenParams<TabParamList> | undefined — component TabNavigator — headerShown: false.
- 2. SessionTypePicker — undefined — title 'Start a Session', presentation: 'modal'.
- 3. LogSession — undefined — title '' (PageHero owns the title), presentation: 'modal'.
- 4. SplitPicker — undefined — title ''.
- 5. MethodPicker — { sessionType: SessionType } — title ''.
- 6. ProgramPicker — { sessionType: SessionType } — title ''.
- 7. SpecialPrograms — undefined — title ''.
- 8. DailyChallenge — undefined — component ChallengeScreen — title ''.
- 9. SpecialProgramDetail — { programKey: string } — title ''.
- 10. ActiveSession — { sessionId: number } — title 'Session', headerBackVisible: false (deliberately traps you in a live session).
- 11. ExerciseLibrary — { pick?: boolean; sessionId?: number; draft?: boolean; sessionType?: SessionType } | undefined — title 'Exercise Library'.
- 12. SessionRecap — { sessionId: number; prCount?: number; stepsAdded?: number } — headerShown: false.
- 13. Walk — { mode?: 'walk' | 'run'; activity?: string } | undefined — title ''.
- 14. SessionHistory — undefined — title 'History'.
- 15. SessionDetail — { sessionId: number } — title 'Session'.
- 16. WalkDetail — { walkId: number } — title 'Walk / Run'.
- 17. AddFood — { meal: MealType; mode?: 'precise' | 'honest' } — title 'Add Food', presentation: 'modal'.
- 18. CustomFood — { id?: number } | undefined — title 'Custom Food', presentation: 'modal'.
- 19. ComposeFood — { id?: number } | undefined — title 'Compose a Dish', presentation: 'modal'.
- 20. PhotoFood — { meal: MealType } — title '', presentation: 'modal'.
- 21. Micronutrients — undefined — title ''.
- 22. Supplements — undefined — title ''.
- 23. SupplementPlan — undefined — title ''.
- 24. DietPlan — undefined — title ''.
- 25. ProgrammeMeals — undefined — title ''.
- 26. ExerciseStats — { exerciseId: number; name: string } — title ''.
- 27. EditProfile — undefined — title 'Edit Profile'.
- 28. Goals — undefined — title ''.
- 29. Smoking — undefined — title ''.
- 30. Sleep — undefined — title ''.
- 31. Work — undefined — title ''.
- 32. Habits — undefined — title ''.
- 33. Alcohol — undefined — title ''.
- 34. Cycle — undefined — title ''.
- 35. Conditions — undefined — title ''.
- 36. Hormones — undefined — title ''.
- 37. Body — undefined — title ''.
- 38. ProfileCard — undefined — title ''.
- 39. Achievements — undefined — title ''.
- 40. Reports — undefined — title ''.
- 41. Growth — undefined — title ''.
- 42. Changelog — undefined — title ''.
- 43. Trends — undefined — title ''.
- 44. Prayers — undefined — title ''.
- 45. Fasting — undefined — title ''.

**Interactions**

- Title ownership rule, stated in a comment at the top of the file and enforced by scripts/verify-engines.ts: a page has exactly one title. Pages that open with a <PageHero> get `title: ''` so the native header carries only the back arrow; forms, lists and modals with no hero keep the bar title. Never both.
- Five routes use `presentation: 'modal'`: SessionTypePicker, LogSession, AddFood, CustomFood, ComposeFood, PhotoFood (six in total).
- ActiveSession sets headerBackVisible: false — the only way out is the screen's own finish/discard actions, which call navigation.navigate('Main') or navigation.replace('SessionRecap', …).
- navigation.replace (not push) is used to hand off into a live session from SessionTypePicker, SplitPicker, MethodPicker (3 call sites), ProgramPicker, SpecialProgramDetail, and from LogSession into SessionDetail — so the picker is not left on the stack behind the session.

**What it shows, and from where**

- `onboarded = !!useUserStore((s) => s.user?.onboardedAt)` — the single switch between the two branches. The user row is loaded by useUserStore.load() in App.tsx via ensureUser() (src/repositories/userRepo.ts).

**What it writes**

- None directly.

**Empty, loading and error states**

- Between App mount and the store's load(), `user` is null, so `onboarded` is false and the Onboarding branch renders. In practice load() runs synchronously in the first effect, before the blank splash is dismissed.

> Entry points observed in the code (which routes are reachable from where): SessionTypePicker ← Home + Train. Walk ← Home ({mode:'walk'}) and Train ({activity:'walk'|'run'|a.key}). SessionHistory ← Train + Profile. SessionDetail ← Train, SessionHistory, LogSession(replace). WalkDetail ← SessionHistory ONLY. SplitPicker ← Train + MethodPicker. MethodPicker ← Train only. ProgramPicker ← MethodPicker ONLY. SpecialPrograms ← Train only; SpecialProgramDetail ← SpecialPrograms only. DailyChallenge ← Train only. ExerciseLibrary ← ActiveSession {pick:true}, SessionDetail {pick:true,sessionId}, LogSession, Profile {pick:false}. ExerciseStats ← ExerciseLibrary ONLY. AddFood/PhotoFood/CustomFood/ComposeFood ← Nutrition and AddFood. Micronutrients/DietPlan/ProgrammeMeals/Fasting ← Nutrition. Supplements ← Micronutrients ONLY; SupplementPlan ← Supplements ONLY. Growth and Trends ← Stats ONLY. Smoking ← Home, Nutrition, Stats, Profile. Sleep/Alcohol/Cycle ← Home + Profile. Work, Habits, Hormones, Conditions, Body, ProfileCard, Achievements, Reports, Goals, EditProfile, Changelog ← Profile ONLY. Prayers ← Home, Profile, Fasting. `Conditions` has NO navigate() call found outside Profile, and `SessionRecap` is only reached by ActiveSession's replace().

#### TabNavigator

**Route** `Main → TabParamList { Home: undefined; Train: undefined; Nutrition: undefined; Stats: undefined; Profile: undefined }`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/navigation/TabNavigator.tsx`  
**Reached from** Rendered as the `Main` stack screen once onboardedAt is set. Also targeted by `navigation.navigate('Main', { screen: 'Nutrition' })` from HomeScreen, and by bare `navigation.navigate('Main')` from ActiveSession, SessionRecap and Walk.

The bottom tab bar — the app's five top-level destinations.

**Layout, top to bottom**

- Tab 1 Home — HomeScreen — icon ICONS.nav.home = Ionicons 'home'.
- Tab 2 Train — TrainScreen — icon ICONS.nav.train = MaterialCommunityIcons 'dumbbell'.
- Tab 3 Nutrition — NutritionScreen — icon ICONS.nav.nutrition = MaterialCommunityIcons 'food-apple'.
- Tab 4 Stats — StatsScreen — icon ICONS.nav.stats = Ionicons 'stats-chart'.
- Tab 5 Profile — ProfileScreen — icon ICONS.nav.profile = Ionicons 'person-circle'.
- Labels are the route names themselves (no tabBarLabel overrides), rendered at fontSize 11 / fontWeight '600'.

**Interactions**

- Tap a tab to switch. No long-press behaviour, no badge, no custom centre button, no swipe between tabs.

**What it shows, and from where**

- Nothing — the bar is static chrome; each tab screen loads its own data.

**What it writes**

- Nothing.

**Empty, loading and error states**

- Active tint theme.colors.primary (#4F8CFF); inactive tint theme.colors.textFaint (#63708A dark / #8B95A6 light).

> tabBarStyle: backgroundColor colors.surface, borderTopColor colors.border, height 62, paddingBottom 8, paddingTop 6. Icons render at the tab navigator's `size` (falls back to 22 if undefined). headerShown: false on every tab, so each tab screen draws its own header inside <Screen>.

#### OnboardingScreen

**Route** `Onboarding — params: undefined`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/onboarding/OnboardingScreen.tsx`  
**Reached from** Automatically, on first launch (and any launch where users.onboarded_at is NULL). There is no route into it once completed — nothing in the codebase ever clears onboardedAt, so onboarding is strictly one-way.

A 6-step wizard, the only screen that exists before onboardedAt is set. It collects the profile needed to compute calorie/macro/water targets, previews those targets, then writes everything and drops the user into the tab navigator.

**Layout, top to bottom**

- Root: SafeAreaView(bg = colors.bg) > KeyboardAvoidingView (behavior 'padding' on iOS, undefined on Android).
- FIXED TOP BAR (padding 16, gap 6): <ProgressBar progress={(step+1)/6} /> then caption in textFaint: "Step {n} of 6".
- SCROLLING BODY (padding 16, gap 16, paddingBottom 24, keyboardShouldPersistTaps='handled').
- — STEP 0 'Welcome' (<Welcome/>): centred column, paddingTop 32, gap 16. A 96×96 tile, borderRadius 28, background colors.primarySoft, containing a 48px MaterialCommunityIcons 'dumbbell' in colors.primary (passed as a raw `def`, bypassing the icon map). Then Text variant='display' centred: "FitCoach". Then body/textMuted centred, maxWidth 300: "Your private coach for training, nutrition and health. Minimal friction during a session, maximum insight afterward." Then four <Feature> rows (icon 20px in colors.primary + body/textMuted, gap 12, self-stretch, gap 10 between rows): 'core.start' → "Track every set, run, sport & sit"; 'nutrition.calories' → "Smart calorie & macro targets"; 'stats.progression' → "Progress charts, PRs & coach tips"; 'core.settings' → "100% offline · your data stays on-device".
- — STEP 1 'About you' (gap 12): h1 "About you"; body/textMuted "This personalizes your calorie, macro, water and caffeine targets."; Input label 'Name', placeholder 'Your name'; label 'Gender' + scrollable SegmentedControl with FOUR options — Male / Female / Non-binary / Other; if gender is not male or female, a second block appears: label "Sex for metabolic calculations (BMR)" + a 2-option SegmentedControl Male/Female; Input label 'Birthdate (YYYY-MM-DD)', placeholder '1995-01-01', keyboardType 'numbers-and-punctuation', default value '1995-01-01'; a <Row> of two flex:1 Inputs — 'Height' suffix 'cm' placeholder '175', and 'Weight' suffix 'kg' placeholder '75', both numeric.
- — STEP 2 'Activity level' (gap 12): h1 "Activity level"; body/textMuted "How active are you outside of logged workouts?"; then five <SelectCard>s built by splitting ACTIVITY_LABELS on ' — ' into title/subtitle: Sedentary/"little/no exercise", Light/"1–3 days/week", Moderate/"3–5 days/week", Active/"6–7 days/week", Very active/"hard training / physical job". Default selection: moderate.
- — STEP 3 'Your goal' (gap 12): h1 "Your goal"; five <SelectCard>s in GOAL_ORDER — Lose fat/"Calorie deficit, protein-forward", Maintain/"Hold your current weight", Build muscle/"Slight surplus, progressive overload", Build muscle & burn fat/"Near maintenance with very high protein and hard lifting — the scale barely moves while composition does", Athletic performance/"Fuelled for training: maintenance-plus, carb-forward"; then a caption/textMuted showing GOAL_NOTES[goal]; then, only when goal !== 'maintain', label 'Pace' + a 3-option SegmentedControl Slow / Moderate / Aggressive. Default goal: maintain, default rate: moderate.
- — STEP 4 'Body-type check' (gap 12): h1 "Body-type check"; body/textMuted "Optional. Waist & hip refine your starting macros. You can skip this."; a Row of two flex:1 numeric Inputs — 'Waist' suffix 'cm' placeholder '82', 'Hip' suffix 'cm' placeholder '98'; then, only when height and weight are both set, a <Card accent={colors.accent}> with a 'stats.bodyFat' icon in the accent, an h3 with BODY_TYPE_LABELS[bodyType] ("Ectomorph-leaning" / "Mesomorph-leaning" / "Endomorph-leaning") and a caption/textMuted with BODY_TYPE_BLURB[bodyType].
- — STEP 5 'Your targets' (gap 12, renders only when `preview` is non-null): h1 "Your targets"; body/textMuted "Calculated with Mifflin-St Jeor · TDEE × {goal label, lowercased}. These auto-refine as you log."; a <Card> with a baseline-aligned row [h2 "Daily calories" | h1 in colors.calories with preview.calorieTarget], a caption/textFaint "BMR {bmr} · TDEE {tdee} kcal", a 12px spacer, then a Row of three <MacroPill>s: Protein {g}g in colors.protein, Carbs {g}g in colors.carbs, Fat {g}g in colors.fat (each an h3 value over a caption/textMuted label).
- FIXED BOTTOM BAR (flexDirection row, gap 12, padding 16): on steps 1–5, a secondary Button 'Back' with flex:1; then either a primary Button flex:2 titled 'Get Started' (step 0) / 'Continue' (steps 1–4), or on step 5 a primary Button 'Start Training' with icon 'core.check'.

**Interactions**

- 'Get Started' / 'Continue' → step+1 (capped at 5). 'Back' → step−1 (hidden on step 0).
- Gate: `canProceed()` returns false ONLY on step 1, and only when all four hold — name.trim() non-empty, heightCm > 100, weightKg > 25, and birthdate matches /^\d{4}-\d{2}-\d{2}$/. Every other step always allows Continue. The disabled Button renders at opacity 0.45 with no explanation of what is missing.
- Gender SegmentedControl: choosing 'male' or 'female' also sets `sex` to the same value; choosing 'non_binary' or 'other' leaves `sex` at its previous value and reveals the BMR sex control.
- SelectCard (activity and goal) is NOT a Pressable — it is a <Card onTouchEnd={onPress}>. There is no pressed state; the selected card gets borderColor primary and backgroundColor primarySoft, and its right-hand icon swaps from 'core.forward' (textFaint) to 'core.check' (primary).
- 'Start Training' → finish() → useUserStore.completeOnboarding(). No confirmation, no loading state; the screen simply unmounts when RootNavigator re-renders with onboarded=true.
- There is no skip, no back-out, and no way to reach onboarding again afterwards.

**What it shows, and from where**

- Body type — estimateBodyType({heightCm, weightKg, waistCm, hipCm, sex}) from src/lib/bodyType.ts, recomputed by useMemo; null until both height and weight parse.
- Target preview — computeTargets({sex, age: ageFromBirthdate(birthdate), heightCm, weightKg, activityLevel, goal, rate}) from src/lib/calories.ts, giving bmr, tdee, calorieTarget and macros.{protein,carbs,fat}. Nothing is read from the database on this screen — the preview is pure computation from the in-memory form state.
- ACTIVITY_LABELS, GOAL_LABELS, GOAL_ORDER, GOAL_BLURBS, GOAL_NOTES, BODY_TYPE_LABELS, BODY_TYPE_BLURB are all constant tables in lib/calories.ts and lib/bodyType.ts.

**What it writes**

- All of it happens inside useUserStore.completeOnboarding(data) (src/stores/userStore.ts), synchronously, in this order:
- 1. estimateBodyType(...) → bodyType.
- 2. updateUser({ name, gender, sex, birthdate, heightCm, activityLevel, goal, rateOfChange, bodyType }) → repositories/userRepo.updateUser → UPDATE on the `users` table (row id = PRIMARY_USER_ID). Name falls back to 'Athlete' if blank.
- 3. addWeighIn(weightKg, { bodyFatPct: null, waistCm, hipCm }) → repositories/userRepo.addWeighIn → deletes any existing row for today and INSERTs into `weigh_ins` (one weigh-in per day; unspecified measurement columns carry forward from the previous same-day row).
- 4. computeTargets(inputsFor(user, weightKg)) then upsertNutritionGoal({ calorieTarget, proteinG, carbsG, fatG, waterGoalMl: recommendedWaterMl(weightKg), caffeineSoftLimitMg: CAFFEINE_SOFT_LIMIT_MG, tdee }) → INSERT/UPDATE on `nutrition_goals`, stamping lastRecalculatedDate = today.
- 5. markOnboarded() → UPDATE users SET onboarded_at = Date.now(). This is the flag RootNavigator switches on.
- 6. get().load() → re-reads user, goal and latest weight into the store, which re-renders RootNavigator into the tab branch.

**Empty, loading and error states**

- Empty: every field starts blank except birthdate ('1995-01-01'), gender ('male'), sex ('male'), activity ('moderate'), goal ('maintain'), rate ('moderate').
- Loading: none — there is no async work anywhere in this flow.
- Error: none. No validation message is ever shown; an invalid birthdate or a too-short height simply leaves 'Continue' greyed out. A throw inside completeOnboarding would surface through the global ErrorBoundary.
- Permission: none requested here.

> Quirks a redesign should know: (a) the birthdate is a free-text field with a regex, not a date picker, and `keyboardType='numbers-and-punctuation'` is an iOS-only keyboard — on Android (the target platform) it falls back to the default keyboard; (b) the gender control offers four values while the schema's GENDERS enum has five — 'prefer_not_to_say' is never offered; (c) OnboardingData supports bodyFatPct but the screen never collects it; (d) experienceLevel (beginner/intermediate/advanced) is NOT collected here — it stays NULL and is set later via the LevelPicker component, where NULL reads as intermediate; (e) step 5 renders nothing at all if `preview` is null, which cannot normally happen because step 1's gate guarantees height and weight.

### Engines behind this area

- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/theme/index.ts`** — The whole design system as data: `palette` (brand + semantic + session-type + macro colours), `darkColors` and `lightColors` (each spreading palette over its own surface set), `spacing`, `radius`, `typography`, `SESSION_TYPE_COLORS`, and the assembled `darkTheme` / `lightTheme` objects typed as `Theme { colors, spacing, radius, typography, dark }`. Dark-first by design; the file's own comment says screens reference tokens and never raw hex so a theme swap is a one-file change.  
  *Constants:* BRAND: primary #4F8CFF, primaryDark #2F6BD8, primarySoft rgba(79,140,255,0.14), accent #33D9A6, accentSoft rgba(51,217,166,0.14). SEMANTIC: success #33D9A6, warning #FFB454, danger #FF5D5D, info #4F8CFF. SESSION-TYPE ACCENTS: strength #4F8CFF, calisthenics #7C6CFF, cardio #FF7A59, outdoor #33D9A6, sport #FFB454, martial_arts #E5533D, mindbody #5FD0E0, meditation #B58CFF, custom #9AA6B2. MACROS: protein #FF6B9D, carbs #4F8CFF, fat #FFB454, fiber #7ED37E, calories #FF7A59, water #4FC3F7, caffeine #B58750. Plus white #FFFFFF, black #000000. DARK SURFACES: bg #0B1220, surface #141C2E, surfaceAlt #1C2740, card #141C2E (same as surface), border #26314A, text #EAF0F7, textMuted #9AA6B8, textFaint #63708A. LIGHT SURFACES: bg #F5F7FB, surface #FFFFFF, surfaceAlt #EEF2F8, card #FFFFFF, border #E1E7F0, text #131A26, textMuted #5A6577, textFaint #8B95A6. SPACING: xs 4, sm 8, md 12, lg 16, xl 24, xxl 32, xxxl 48. RADIUS: sm 8, md 12, lg 16, xl 24, pill 999. TYPOGRAPHY (system font throughout — no custom font is ever loaded): display 34/800/letterSpacing −0.5; h1 26/800/−0.3; h2 20/700; h3 17/700; body 15/500; bodyStrong 15/700; label 13/600; caption 12/500; mono 15/700 with fontVariant ['tabular-nums']. DEAD TOKENS: radius.xl (24) and spacing.xxxl (48) have zero usages in src; palette.primaryDark and palette.accentSoft are referenced only by their own definitions; typography 'mono' is used exactly once (PrayersScreen line 155).
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/theme/ThemeProvider.tsx`** — React context holding a Theme. `ThemeProvider` reads RN's useColorScheme() and memoises lightTheme when the scheme is exactly 'light', darkTheme otherwise (so 'no preference'/null gets dark). `useTheme()` returns the context, defaulting to darkTheme when no provider is mounted.  
  *Constants:* There is no in-app theme toggle and no persisted preference — the OS scheme is the only input. userInterfaceStyle is 'automatic' in app.config.ts.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ui/Text.tsx`** — The typography primitive. Props: variant (any key of `typography`, default 'body'), color (one of 'text'|'textMuted'|'textFaint'|'primary'|'accent'|'danger'|'warning'|'success' OR any raw colour string — resolution is `color in theme.colors ? theme.colors[color] : color`, so ANY token key works, not just the eight in the type), center (boolean → textAlign 'center'), plus all RN TextProps. Style order: variant base → colour → center → passed style.  
  *Constants:* 9 variants, listed under src/theme/index.ts.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ui/Button.tsx`** — Pressable button. Props: title, onPress, variant ('primary'|'secondary'|'ghost'|'danger', default primary), size ('sm'|'md'|'lg', default md), icon (semantic key), disabled, loading, fullWidth (default true), style, color (overrides the brand colour for primary bg and ghost fg). Renders an ActivityIndicator in place of the content while loading; otherwise an optional Icon + a Text (variant 'label' at size sm, else 'bodyStrong').  
  *Constants:* Heights: sm 38, md 48, lg 56. borderRadius = radius.md (12). paddingHorizontal = spacing.lg (16), internal gap 8. Backgrounds: primary = color ?? primary; secondary = surfaceAlt; ghost = transparent with borderWidth 1 / borderColor border; danger = danger. Foregrounds: primary '#fff', secondary text, ghost brand, danger '#fff'. Opacity: 0.45 disabled, 0.85 pressed, else 1. alignSelf 'stretch' when fullWidth, else 'flex-start'. Icon size 22 at lg, otherwise 18.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ui/Card.tsx`** — The surface primitive — a plain View, so it forwards every ViewProp (this is how OnboardingScreen's SelectCard attaches onTouchEnd). Props: padded (default true), accent (a colour string), plus ViewProps.  
  *Constants:* backgroundColor colors.card, borderRadius radius.lg (16), borderWidth 1 / borderColor border, padding spacing.lg (16) when padded else 0. An `accent` adds borderLeftWidth 3 with borderLeftColor = accent — the app's single most-used emphasis device. No shadow or elevation anywhere.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ui/Chip.tsx`** — Pill-shaped filter/tag. Props: label, icon (semantic key), active, color (brand override), onPress, small. Wrapped in a Pressable only when onPress is given, otherwise a bare View. Used in 13 files.  
  *Constants:* borderRadius radius.pill (999), borderWidth 1, gap 5. Padding: 5/10 when small, 7/12 otherwise. Icon size 12 small / 14 normal. Active: background and border = brand (default primary), icon and text '#fff'. Inactive: background surfaceAlt, border border, icon and text textMuted. Text is always variant 'caption' (12/500).
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ui/Icon.tsx`** — The single icon renderer. Props: icon (dotted semantic key), def (an explicit {lib,name} that bypasses the map), size (default 22), color (default theme.colors.text). Resolves via resolveIcon() and dispatches to one of four @expo/vector-icons families.  
  *Constants:* LIBS map covers exactly Ionicons, MaterialCommunityIcons, FontAwesome5, Feather. In practice icon-map.ts only ever emits Ionicons and MaterialCommunityIcons — FontAwesome5 and Feather are declared in the IconLib union but never used by a single entry.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ui/Input.tsx`** — Labelled text field. Props: label, suffix, multiline, plus all TextInputProps. Renders an optional label (variant 'label', textMuted) above a bordered row containing the TextInput and an optional right-hand suffix (variant 'label', textMuted, marginLeft 6).  
  *Constants:* Outer gap 6. Field: background colors.surface, borderRadius radius.md (12), borderWidth 1 / border, paddingHorizontal spacing.md (12). TextInput: colour text, fontSize 15, fontWeight '600', paddingVertical 14 (12 multiline), minHeight 88 when multiline, textAlignVertical 'top' when multiline. placeholderTextColor = textFaint. There is no error state, no helper-text slot, and no focus ring.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ui/PageHero.tsx`** — The standard top of every pushed page — a tinted icon tile, the h1 title, an optional muted subtitle, and an optional `right` slot (a Badge or small button). Props: icon, color (the page accent), title, subtitle, right. Used by 35 screens; those routes all carry `title: ''` in RootNavigator so the native header shows only the back arrow.  
  *Constants:* Tile 44×44, borderRadius radius.md (12), background = tint + '1F' (~12% alpha), icon size 24 in the tint. Row gap 12, outer gap spacing.sm (8). INLINE_SUBTITLE_MAX = 100 — a subtitle of 100 characters or fewer sits inline beside the tile; a longer one runs full width beneath the row. Default tint is colors.primary. scripts/verify-engines.ts asserts the 44 tile, the 24 icon, the h1, and the 100-char rule.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ui/ProgressBar.tsx`** — Horizontal meter. Props: progress (0..1), color, height (default 8), trackColor. The fill width is the clamped fraction; values above 1 are clamped for width but recoloured.  
  *Constants:* borderRadius = height on both track and fill. Track defaults to surfaceAlt. When progress > 1 the fill turns colors.warning (#FFB454) regardless of the requested colour — the app's universal over-target signal. Used at height 4/5/6/8 across the app.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ui/ProgressRing.tsx`** — SVG donut gauge (react-native-svg). Props: progress (0..1, clamped), size (default 120), strokeWidth (default 12), color, trackColor, label, value, children. Renders a track circle plus a dashed-arc progress circle rotated −90° with round caps; the centre shows `children`, or a default stack of value (h2, tabular-nums) over label (caption/textMuted).  
  *Constants:* r = (size − strokeWidth)/2; dash = 2πr × clamped. Over 1 → ring colour becomes colors.warning. Only 4 files use it.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ui/Screen.tsx`** — The page container used by 44 screens. Props: children, scroll (default true), padded (default true), edges (default ['top']), contentStyle, refreshControl. Wraps a SafeAreaView (bg = colors.bg) around either a ScrollView or a flex View.  
  *Constants:* padding = spacing.lg (16) when padded; the scroll variant adds paddingBottom = pad + 96 (clearance for the 62px tab bar plus FABs) and a uniform gap of spacing.lg (16) between children — this 16px rhythm is what SectionHeader compensates for. showsVerticalScrollIndicator false, keyboardShouldPersistTaps 'handled'.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ui/SegmentedControl.tsx`** — Generic single-select pill group. Props: options (SegmentOption<T>[] = {value,label,icon?}), value, onChange, scrollable, accent. Non-scrollable pills take flex:1 and share the width; scrollable ones size to content inside a horizontal ScrollView. Used in 18 files.  
  *Constants:* Container: background colors.surface, borderRadius radius.md (12), borderWidth 1 / border, padding 4, gap 4. Pill: paddingVertical 10, paddingHorizontal 14, borderRadius radius.md, gap 6. Active pill: background = accent ?? primary, icon and label '#fff'; inactive: transparent with textMuted. Label is always variant 'label' (13/600); icons render at 16.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ui/StatTile.tsx`** — The number tile — a Card with an icon+label header row, a big tabular-nums value, and an optional sub-line. Props: icon, label, value (string), sub, accent, flex (default 1). Used in 18 files, almost always inside a <Row>.  
  *Constants:* Header row gap 6, marginBottom 6, icon size 16 tinted with accent ?? textMuted. Value is variant 'h2' (20/700) with fontVariant tabular-nums. Sub is caption/textFaint, marginTop 2. The accent also becomes the Card's 3px left border.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ui/misc.tsx`** — Five small shared primitives. SectionHeader({title, action?, onAction?}) — an h3 with an optional right-hand text link plus a 14px 'core.forward' chevron in primary; used in 34 files. EmptyState({icon='core.info', title, message?}) — centred icon/title/message column; used in 10 files. Divider() — a 1px border-coloured line. Row({children, gap=12, style}) — the flexDirection:'row' shorthand used everywhere. Badge({label, color?}) — a small tinted pill; used in 25 files.  
  *Constants:* SectionHeader deliberately breaks the Screen's uniform 16 gap: marginTop = spacing.sm (8) and marginBottom = −spacing.xs (−4), which nets roughly 24 above / 12 below so the header groups with the content under it. EmptyState: paddingVertical spacing.xxl (32), gap 8, icon size 40 in textFaint, title h3/textMuted centred, message body/textFaint centred at maxWidth 260. Divider: height 1, marginVertical 4. Badge: background = colour + '22' (~13% alpha), paddingHorizontal 8 / paddingVertical 3, borderRadius radius.sm (8), caption text in the colour; defaults to colors.accent.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/constants/icon-map.ts`** — The single source of iconography. Exports IconLib ('Ionicons'|'MaterialCommunityIcons'|'FontAwesome5'|'Feather'), IconDef {lib,name}, the ICONS tree, `resolveIcon(key)` which splits a dotted key on '.' and falls back to ICONS.core.custom for anything unknown, `sessionTypeIcon(type)` and `mealIcon(meal)`.  
  *Constants:* 26 namespaces: nav (5: home, train, nutrition, stats, profile), core (24: start, end, timer, notifications, add, edit, delete, calendar, streak, pr, back, forward, chevronUp, chevronDown, check, target, list, checkFilled, checkEmpty, close, swap, custom, settings, info, warning), strength (15), cardio (18), martial (12), sport (28), mindbody (~85 — yoga/pilates/stretch/meditation/breath/moods plus every special-programme, superhero and world-culture glyph), nutrition (23), smoking (11), sleep (4), alcohol (6), cycle (5), health (4), hormone (10), habits (6), care (4), work (3), micro (2), supp (8), weather (4), after (7), digest (2), faith (10), card (5), report (4), stats (7). sessionTypeIcon maps strength→strength.barbell, calisthenics→strength.calisthenics, cardio→cardio.treadmill, outdoor→cardio.running, sport→sport.soccer, martial_arts→martial.gloves, mindbody→mindbody.yoga, meditation→mindbody.meditation, default→core.custom. mealIcon returns `nutrition.${meal}` for breakfast/lunch/dinner/snack. Two entries are cast `as never` because the glyph name is not in the MCI type union — mindbody.spartan and mindbody.gladiator, both 'shield-sword'; if that glyph is absent at runtime they render blank. The file comments note that absent keys render blank rather than throwing.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/StreakMeter.tsx`** — Daily check-in streak card. Props: { streak: UsageStreak }. Renders a 48×48 flame tile, the current streak as a display-sized number beside 'day(s)', the caption 'Daily check-in streak', a right column with 'Best {longest}' (icon core.pr) and '{totalDays} days total', a 7-dot week row, and — only when a milestone is ahead — a ProgressBar plus the line '{n} more day(s) to a {m}-day streak' (with ' · open the app today to keep it alive' appended when openedToday is false).  
  *Constants:* Flame colour = colors.warning when current > 0, else textFaint; the tile background is flame + '22'. Dots are 26×26 circles, filled with the flame colour and a 14px core.streak glyph when opened, otherwise surfaceAlt with a 6px textFaint dot; today's dot gets a 2px border in colors.text. Day letters come from DOW = ['M','T','W','T','F','S','S'] indexed by (getDay()+6)%7. Data from repositories/usageRepo.usageStreak(): MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365]; the current streak scans back up to 3650 days.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ExerciseHero.tsx`** — Generated exercise imagery in place of copyrighted photos — an SVG linear-gradient tinted by session type with two soft white circles and the exercise's semantic glyph centred in white. Props: iconKey, sessionType, size ('thumb'|'banner', default thumb).  
  *Constants:* thumb = 52×52, radius 12, icon 26. banner = 100% wide × 150 tall, radius 16, icon 56. Gradient runs the session-type colour at opacity 0.9 → 0.35 diagonally. Accent circles at 6% and 8% white opacity, radii 0.7× and 0.5× the height.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ExerciseIllustration.tsx`** — A stick-figure SVG per MovementPattern (horizontal_push, vertical_push, and the rest of the pattern enum), drawn on a 0..100 viewBox with helper primitives for limbs, head, barbell, dumbbell and ground line. Props: pattern, sessionType (default 'strength'), size (default 150), framed (default true).  
  *Constants:* Stroke width SW = 2.6, head radius 5, barbell stroke 2.4 with 3.6-radius plates, dumbbell 6×4.8 rect. Framed background is surfaceAlt with a session-tinted gradient from 12% to 2% opacity; borderRadius 16.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ExercisePeek.tsx`** — Read-only listing of the exercises in a routine, template or finished session — a Divider then numbered rows of [index, 16px tinted icon, name, sub-line]. Props: exercises (PeekExercise[] = {id?, name, iconKey?, primaryMuscle?, subMuscle?, equipmentType?, detail?}), accent, emptyLabel (default 'No exercises in this one yet.').  
  *Constants:* Index column is 18px wide, tabular-nums, marginTop 2. The sub-line prefers `detail` (what was actually logged) and otherwise joins the muscle label with the equipment type using ' · '; muscle labels come from MUSCLE_LABELS / SUB_MUSCLE_LABELS in src/data/exercises. Empty renders just the caption, not an EmptyState.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/LevelPicker.tsx`** — Beginner / Intermediate / Advanced selector that reads and writes the profile directly. Props: compact (default false — when true it drops the Card wrapper and the blurb), color. Also exports the hook `useExperienceLevel()`.  
  *Constants:* Reads useUserStore(s => s.user?.experienceLevel) through levelOrDefault() (NULL reads as intermediate). onChange calls updateProfile({experienceLevel}) which UPDATEs `users` and immediately triggers recalcTargets(). Renders a core.target icon + 'Your level' label, the SegmentedControl of EXPERIENCE_LEVELS, LEVEL_BLURBS[level] (unless compact) and prescriptionLine(level) — all from src/lib/level.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/RouteMap.tsx`** — Offline GPS route drawing — no map tiles are ever fetched. Props: route (LatLng[]), height (default 200), color (default colors.outdoor), markers (default true). Normalises the track with lib/geo.normalizeRoute and draws it as a path.  
  *Constants:* Padding 16 on all sides. A soft shadow path at stroke + '33' width 9 sits under the main path at width 3.5. Start marker: 6px circle in colors.success with a 2px white ring; end marker: same in colors.danger. When normalizeRoute returns null it renders the centred caption 'Waiting for GPS fixes to trace your route…' at the requested height.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/RpeGuide.tsx`** — A collapsible explainer Card shown in every session. Collapsed: core.info icon, 'What is RPE?' and the caption 'How many reps you had left — not how hard it felt. 10 = none left.', with a chevronDown/chevronUp on the right. Expanded: a Divider then one row per RPE_SCALE entry (a 34px-wide chip with the number, '≤5' for the bottom entry, tinted success+'22' when productive) plus a closing paragraph.  
  *Constants:* RPE_SCALE comes from src/lib/effort. Closing copy states 'Roughly 7–10 is where growth happens — that's 0 to 3 reps left.' Local useState, no persistence.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/EatenAtPicker.tsx`** — 'Finished eating' time picker. Props: value (EatenAtChoice), onChange, dateISO (the diary date being logged to). A horizontal scroller of EATEN_AT_PRESETS chips plus an 'At…' chip that reveals a free-text 24h Input, and one caption explaining what was recorded.  
  *Constants:* Presets and resolution live in src/lib/eatenAt (EATEN_AT_PRESETS, parseHHMM, resolveEatenAt, clockOf). Copy: 'Logged as finished just now — the training clock starts from this moment.' / 'Logged as finished at {HH:MM} — the training clock counts from then, not from now.' / 'Enter a time like 13:40.' shown in colors.danger when the typed clock fails to parse. Active-preset detection is a JSON.stringify comparison of the choice objects.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/MealRoutineBar.tsx`** — Saved-meal chips for one meal slot (or for the whole day when mealType is null). Props: mealType (MealType|null), date, onChanged. Renders a wrapped row of chips labelled '{name} · {kcal} kcal' (prefixed '☀ ' for whole-day routines), an inline 'Save … as a routine (n items)' affordance that expands into a name Input + 'Save' button, and the hint 'Tap to log it again · long-press to delete'.  
  *Constants:* Repository: src/repositories/mealRoutineRepo — listMealRoutines, saveableEntryCount, saveMealRoutine, applyMealRoutine, deleteMealRoutine, routineTotals; table `meal_routines` (itemsJson, useCount, lastUsedAt). Renders nothing at all when there are no routines and nothing saveable. Long-press opens an Alert 'Delete "{name}"?' / 'Meals you already logged from it are kept.' with Cancel + destructive Delete. Applying a routine that yields 0 items shows Alert 'Nothing to add'.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/EnergyBalanceCard.tsx`** — Two exports. EnergyBalanceCard({date?}) — the full card: a header row, a three-cell row (burned (training) / eaten / left to eat or over target), a Divider, a 'Training load' meter reading '{exerciseBurned} / {lineKcal} kcal to the line', bal.message, and a fixed explanatory paragraph. EnergyBalanceStrip({onPress?}) — the four-cell Home version: Eaten · Burned · Left|Over · Restore, with 'Eat back ~{n} kcal to protect your goal.' beneath when restoreKcal > 0.  
  *Constants:* Both call energyBalanceFor(date?) from src/repositories/energyRepo and recompute on nutrition-store changes and on useFocusEffect. Both render null when there is no nutrition goal (or when energyRepo throws — it is wrapped in try/catch). Accent: danger when status === 'over_trained', warning when 'over_eaten', else colors.calories. Load bar: trainingLoadFraction(bal) from src/lib/energyBalance; the fill is danger when over, warning above 0.80, else success.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/DigestionCard.tsx`** — 'Can I train yet?' — one card holding two independent meters (Stomach and Smoke), each with its own title, status, ProgressBar and detail line, under a headline that reports whichever clock is later. Props: meals (MealForDigestion[]), smokes (SmokeEvent[]), smokingEnabled, defaultIntensity ('moderate'), compact. Also exports MealDigestionLine({meal}) — a single caption per meal.  
  *Constants:* Re-renders on a 60_000 ms interval so the countdowns move. Computation: trainReadiness({meals, smokes}, intensity, now) from src/lib/readiness, smokeStatus() from src/lib/smokeClock, digestionStatus()/formatWait()/INTENSITY_LABEL from src/lib/digestion. Meter colour thresholds: warning above progress 0.66, otherwise colors.calories (stomach) or colors.danger (smoke); clear = success. Headline icon is core.check when clear, smoking.cigarette when the smoke clock governs, else digest.clock. The non-compact form adds a Light/Normal/Hard SegmentedControl and a paragraph explaining that carbs drain fastest then protein, fat and fibre, and that a drink clears about twice as fast as the same calories as food. Renders null when there are no meals and no smokes.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/PostSessionCard.tsx`** — 'After this session' — the margins between the end of a session and water, food (a window, not a wait), a cigarette, alcohol, a cold plunge and the next hard session, each as a tappable row with its own ProgressBar. Props: endedAt, strain (Strain), margins (Margin[]), compact, title (default 'After this session').  
  *Constants:* Ticks every 60_000 ms. Icons: water→after.water, eat→after.eat, smoke→after.smoke, alcohol→after.alcohol, cold→after.cold, next→after.next. Status tones: 'open'/'window' → success, 'late' → warning, 'wait' → textMuted; the bar turns warning past 66% progress, else colors.calories. Waits of 12 h or more are printed with a weekday prefix. The 'next' row gets no progress bar. Compact mode hides the water and next rows, hides any already-open margin, disables the tap-to-expand, and renders null if nothing is left to show. Card accent is warning for 'brutal'/'hard' strain, else colors.accent. Engine: marginStatuses() and STRAIN_LABEL in src/lib/postSession.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/WeatherCard.tsx`** — Today's weather and what it changes for training. Props: plannedActiveMin (default 45). Shows temperature, 'feels like', a heat-band Badge, a provenance line, an expandable advice list, and an inline manual-entry form behind the pencil icon.  
  *Constants:* Reads latestReading() from repositories/weatherRepo first so the card is never blank offline, then fires fetchLiveWeather() (services/weatherFetch) on mount only if the stored reading is missing or fails isReadingFresh(). Manual entry clamps humidity to 0–100 and wind to >= 0 and saves with source 'manual'. Provenance line reads 'Live' or 'Entered by you', plus humidity, wind and ' · a few hours old' when stale. Advice, bands and colours come from src/lib/weather (weatherAdvice, HEAT_BAND_LABEL, HEAT_BAND_COLOR). Personal context is assembled from listConditions() (respiratory / cardiovascular categories in CONDITION_CATALOGUE) and currentFastingState().fasting — all wrapped in a local safe() so a missing table cannot break the card. Collapsed it shows one bullet plus an '{n} more' link.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/ChallengeWheel.tsx`** — The spin-the-wheel for the daily challenge. Props: segments (ChallengeDef[]), winningIndex, size (default 260), settled, onSpinEnd, onPress. Declarative react-native-svg wedges with an icon per wedge, a fixed chevronDown pointer at 12 o'clock, and a pill 'SPIN' button that disappears once the day is settled.  
  *Constants:* Animation: Animated.timing over 3600 ms with Easing.out(Easing.cubic), useNativeDriver true. The landing angle is decided BEFORE the spin by wheelRotationDeg(winningIndex, n) in src/lib/challengeWheel — the wheel reveals the challenge, it never chooses it. A settled day jumps straight to the final angle with no animation. Wedge fill is DIFFICULTY_COLOR[difficulty] from src/data/challenges, alternating opacity 0.85 / 0.6, stroked 2px in colors.bg; the hub is a circle at 0.3× radius in colors.surface. Icons sit at 0.66× radius, 18px, white. Renders null when there are no segments.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/BadgeSvg.tsx`** — Achievement badge renderer. Props: id, svg (the badge's SVG source), size (default 48). Renders the pre-rendered base64 PNG from src/data/badgeImages via a plain <Image resizeMode='contain'>; if the id has no image it falls back to a pure-RN 'Medallion' built by regex-scraping the fill/stroke/first-path colours out of the SVG string.  
  *Constants:* Medallion: circle at `size`, borderWidth 2.5, an inner dot at 0.42× size. Fallback palette defaults #ECEFF1 / #B0BEC5 / #607D8B. The file's comment is load-bearing for a redesign: rendering these badges through react-native-svg (SvgXml or declarative Path) crashed the Achievements screen NATIVELY — a white screen no JS error boundary can catch — which is why they are PNGs generated by scripts/render-badges.js.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/charts/BarChart.tsx`** — Vertical bars built from flex-height Views, no SVG. Props: data (Bar[] = {label, value, color?}), height (default 160), color, valueFormat.  
  *Constants:* Bars are 80% of their column width, radius 6, minimum height 2px, scaled against (height − 28) and max(1, …). Value labels render at fontSize 9 only when valueFormat is supplied and the value is > 0; axis labels at fontSize 10, single line. Empty data → the centred caption 'Not enough data yet'.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/charts/LineChart.tsx`** — Minimal responsive line chart on react-native-svg with an optional area fill, dots and three dashed gridlines. Props: data (LinePoint[]), height (default 160), color, fill (default true), showDots (default true), yFormat (default rounds to an integer).  
  *Constants:* Padding L40 R12 T12 B20. Gridlines at max, midpoint and min, stroke colors.border with strokeDasharray '3 5'. Line stroke 2.5, dots r=3, area fill = stroke + '1F'. Y labels are absolutely positioned at fontSize 10. Empty → 'Not enough data yet'.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/charts/DualLineChart.tsx`** — Modelled trajectory (dashed, muted) against measured reality (solid with dots), with a legend row underneath. Props: data (DualPoint[] = {date, expected, actual}), height (default 180), expectedColor (default textFaint), actualColor (default primary), expectedLabel ('Expected'), actualLabel ('Actual'), unit.  
  *Constants:* Padding L42 R10 T10 B18. Nulls BREAK the path rather than interpolating — 'a missing weigh-in should look missing, not invented'. A series flatter than 0.5 units is padded by ±0.5 so it still reads. Expected stroke 2 with dasharray '5 4'; actual stroke 2.5 with r=3 dots. Y labels print one decimal below 100 and whole numbers above.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/charts/CalendarHeatmap.tsx`** — GitHub-style consistency grid of week columns. Props: data (DayActivity[] from repositories/statsRepo, chronological), color (default colors.accent). Pads the front so the first column starts on a Monday, then renders 7-row columns plus a Less→More legend.  
  *Constants:* Cells 12×12, radius 3, gap 3. Zero-count cells are surfaceAlt; others are brand + an alpha byte from intensity = 0.35 + 0.65 × (count / max). Legend swatches are 10×10 at fractions [0, 0.4, 0.7, 1].
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/charts/MacroDonut.tsx`** — Calorie-share ring for protein / carbs / fibre / fat with an optional centre value and label. Props: protein, carbs (fibre included, as on every label), fat, fiber (default 0), size (default 140), strokeWidth (default 16), centerLabel, centerValue.  
  *Constants:* Splits come from macroEnergyShares() in src/lib/foodMath, where fibre is CARVED OUT of the carb slice and never added on top. Segment order and colours: protein #FF6B9D, carbs #4F8CFF, fibre #7ED37E, fat #FFB454, over a surfaceAlt track. Butt caps, rotated −90°.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/calories.ts`** — The engine behind onboarding steps 2, 3 and 5. Exports the label tables the wizard renders (ACTIVITY_LABELS, GOAL_LABELS, GOAL_ORDER, GOAL_BLURBS, GOAL_NOTES) and the maths: calculateBMR (Mifflin-St Jeor), calculateBMRFromLeanMass (Katch-McArdle), calculateTDEE, goalOffsetPct, calculateMacros, computeTargets, refineTDEE and recommendedWaterMl/recommendedFiberG.  
  *Constants:* ACTIVITY_MULTIPLIERS: sedentary 1.2, light 1.375, moderate 1.55, active 1.725, very_active 1.9. BMR = 10×kg + 6.25×cm − 5×age, +5 male / −161 female; Katch-McArdle = 370 + 21.6 × leanMassKg, used whenever measured lean mass exists. GOAL OFFSETS as a fraction of TDEE — lose_fat: −0.12 / −0.17 / −0.22; build_muscle: +0.08 / +0.12 / +0.15; recomp: −0.03 / −0.07 / −0.10; performance: 0 / +0.03 / +0.05; maintain: 0 (slow/moderate/aggressive). calorieTarget = max(bmr, round(tdee × (1+offset))) — it never prescribes below BMR. PROTEIN g/kg: maintain 1.8, lose_fat 2.2, build_muscle 2.0, recomp 2.4, performance 1.8; when body-fat % is known and 0 < bf < 60 the basis becomes weight × (1 − bf/100) × 1.15. FAT share of calories: 0.25 for lose_fat and recomp, 0.22 for performance, 0.28 otherwise; carbs are the remainder, floored at 0. refineTDEE: needs >= 10 days, uses 7700 kcal/kg, blends 0.6 × implied + 0.4 × formula and clamps to ±25%. Water = max(2000, round(kg × 35 / 50) × 50) ml. Fibre = max(25 g, 14 g per 1000 kcal).
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/bodyType.ts`** — The engine behind onboarding step 4. estimateBodyType({heightCm, weightKg, waistCm, hipCm, sex}) plus the display tables BODY_TYPE_LABELS and BODY_TYPE_BLURB, and bodyTypeCarbBias.  
  *Constants:* With a waist AND hip present, waist-to-hip ratio dominates: endomorph when whr >= 0.85 (female) / 0.95 (male) or BMI >= 27; ectomorph when whr <= 0.75 (female) / 0.85 (male) AND BMI < 22; otherwise mesomorph. Without them it is BMI alone: < 20 ectomorph, >= 26 endomorph, else mesomorph. Carb bias: +0.05 ectomorph, −0.05 endomorph, 0 mesomorph. The file's own comment insists this is a bias for initial defaults and is never presented as a clinical measurement.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/date.ts`** — ageFromBirthdate(birthdateISO, ref = new Date()) — used by onboarding's preview and by userStore.inputsFor.  
  *Constants:* Returns 30 when the birthdate is null. Subtracts a year when the month/day has not yet come round.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/stores/userStore.ts`** — The zustand store the shell hydrates at startup and the store that owns onboarding's write. State: user, goal, currentWeightKg, hydrated. Actions: load(), updateProfile(patch), logWeight(kg, extra), recalcTargets(opts), completeOnboarding(data).  
  *Constants:* load() = ensureUser() + getNutritionGoal() + latestWeight(). ensureUser() INSERTs a row named 'Athlete' at PRIMARY_USER_ID when none exists — which is why RootNavigator can rely on user being non-null but onboardedAt being NULL. inputsFor() folds in computeBodyComp() from the latest weigh-in, so BMR switches from Mifflin to Katch-McArdle once body composition is measured. recalcTargets() writes a goal_history row via recordGoalChange whenever any of calorieTarget/protein/carbs/fat moved (or when opts.record is set), inside a try/catch so history is best-effort. completeOnboarding writes users, weigh_ins and nutrition_goals then markOnboarded() then load().
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/userRepo.ts`** — Table access for `users`, `weigh_ins`, `profile_photos` and `nutrition_goals`. Onboarding uses getUser, ensureUser, updateUser, markOnboarded, addWeighIn, latestWeight, getNutritionGoal and upsertNutritionGoal.  
  *Constants:* Single-user app: everything defaults to PRIMARY_USER_ID. addWeighIn enforces one weigh-in per day — it reads the existing row for that date, carries forward every WEIGH_IN_FIELDS value the caller did not supply, deletes the row and re-inserts, so a weight-only log never wipes previously entered tape measurements. markOnboarded sets onboarded_at = Date.now(). upsertNutritionGoal stamps lastRecalculatedDate = todayISO() and updates the newest goal row rather than appending.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/usageRepo.ts`** — The daily check-in streak the shell records at every launch and StreakMeter renders. recordAppOpen() inserts today's date into `app_open_logs`; usageStreak() returns { current, longest, openedToday, totalDays, last7, nextMilestone }.  
  *Constants:* MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365]. The current streak counts consecutive days ending today, or ending yesterday if today has not been recorded yet, scanning back at most 3650 days. last7 is always exactly 7 entries, oldest first, each { date, opened, isToday }.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/app.config.ts`** — Expo config — the app's identity and every native permission the UI can depend on.  
  *Constants:* name 'FitCoach', slug 'fitcoach', version 2.0.0 (package.json also 2.0.0, while the product is described as v2.64 — the shipped version number is decoupled because runtimeVersion policy is 'appVersion' and OTA updates must stay compatible), android.versionCode 2, package com.fitcoach.app, orientation 'portrait', userInterfaceStyle 'automatic', newArchEnabled true, scheme 'fitcoach'. Splash: ./assets/splash.png, resizeMode 'contain', backgroundColor #0B1220 — the same hex as darkColors.bg, so the splash matches the app's ground. Adaptive icon background is also #0B1220. EAS Update url set with checkAutomatically 'ON_LOAD'. Android permissions requested: ACTIVITY_RECOGNITION, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, ACCESS_BACKGROUND_LOCATION, FOREGROUND_SERVICE, FOREGROUND_SERVICE_LOCATION, FOREGROUND_SERVICE_HEALTH, RECEIVE_BOOT_COMPLETED, POST_NOTIFICATIONS, READ_MEDIA_IMAGES, WRITE_EXTERNAL_STORAGE, WAKE_LOCK, INTERNET. Plugins: withJitpackExclusive, expo-asset, expo-font, expo-sqlite, expo-location, expo-sensors, expo-notifications, expo-image-picker, expo-media-library.

### Notes for the redesign

THINGS A DESIGNER MUST KNOW.

1. There is no custom typeface. expo-font is in the plugin list but nothing ever calls useFonts and no fontFamily is set anywhere except one 'monospace' on PhotoFoodScreen line 438. Every weight in the type scale is a system-font weight. Adopting a brand face in v3 is a real change, not a swap.

2. There is no elevation or shadow language. Cards are separated purely by a 1px border plus a slightly lighter surface; headerShadowVisible is explicitly false. The only emphasis device is Card's 3px coloured left border (`accent`), used on roughly every domain card in the app.

3. Alpha is expressed as hex suffixes appended to a hex string, in four different strengths that are not tokenised: '1F' (PageHero tile, LineChart area fill), '22' (Badge, StreakMeter tile, RpeGuide chip), '33' (RouteMap shadow line), and the computed byte in CalendarHeatmap. If the palette moves to rgb()/oklch() in v3, every one of these string concatenations breaks silently — they will produce an invalid colour, not an error.

4. Theming is OS-driven only. There is no in-app light/dark toggle and no stored preference; useColorScheme() decides, and anything that is not exactly 'light' gets the dark theme. The light palette exists and is complete, but the two crash screens (App.tsx fatal and ErrorBoundary) hard-code dark hex values and will look wrong in light mode.

5. Dead or near-dead design tokens: radius.xl (24) and spacing.xxxl (48) have zero usages; palette.primaryDark and palette.accentSoft are defined and never referenced; typography.mono is used exactly once. Conversely, `fontVariant: ['tabular-nums']` is applied inline in StatTile, ProgressRing, EnergyBalanceCard and ExercisePeek rather than through the mono variant — the tabular-numbers intent exists but is not expressed through the type scale.

6. The title rule is enforced by a script, not by convention. scripts/verify-engines.ts parses RootNavigator and asserts that any screen containing <PageHero> declares title: '' — and it also asserts PageHero's exact geometry (44px tile, 24px icon, variant h1, INLINE_SUBTITLE_MAX = 100). Changing PageHero's dimensions will fail the repo's own verification unless that script is updated too.

7. Onboarding is one-way and unrecoverable. Nothing in the codebase ever clears users.onboarded_at, so once markOnboarded() runs, the Onboarding route no longer exists in the navigator. There is no "redo setup" and no way to test the flow again short of wiping app data.

8. The loading state is nothing. Between launch and `ready`, the user sees a solid colour rectangle — no logo, no spinner, no progress. Given that initDatabase() runs a full DDL pass and can re-seed hundreds of exercises on a version bump, this is the app's longest unbranded moment.

9. The fatal database screen is a dead end: it has no retry, no "clear data", no support affordance — just the error name and message.

10. OnboardingScreen's SelectCard uses `onTouchEnd` on a plain Card rather than a Pressable. There is no pressed feedback and no accessibility role; it also fires when a scroll gesture happens to end over the card. Two other components (Chip, EnergyBalanceStrip) conditionally wrap themselves in a Pressable only when an onPress prop is passed, so the same visual element is sometimes interactive and sometimes not.

11. Icon coverage is uneven. The icon map has 26 namespaces, but `mindbody` alone holds roughly 85 entries — every special programme, superhero and world-culture glyph was dumped there rather than getting its own namespace. Two entries (mindbody.spartan, mindbody.gladiator, both 'shield-sword') are cast `as never` because the glyph is not in the MaterialCommunityIcons type union, and resolveIcon silently falls back to core.custom for anything unknown, so a wrong key renders a generic shape rather than failing.

12. FontAwesome5 and Feather are wired into Icon.tsx but no entry in the icon map uses them. The whole app is Ionicons + MaterialCommunityIcons.

13. Modal presentation is used for six routes (SessionTypePicker, LogSession, AddFood, CustomFood, ComposeFood, PhotoFood) and nothing else — that is the app's only alternative page transition.

14. ActiveSession is the only screen with headerBackVisible: false. Six picker screens use navigation.replace to hand off into it, so the back stack behind a live session is the tab, not the picker.

15. Several routes are reachable from exactly one place: WalkDetail only from SessionHistory; ProgramPicker only from MethodPicker; Supplements only from Micronutrients; SupplementPlan only from Supplements; ExerciseStats only from ExerciseLibrary; SpecialProgramDetail only from SpecialPrograms; SessionRecap only from ActiveSession's replace(); Growth and Trends only from Stats; and eleven routes (Work, Habits, Hormones, Conditions, Body, ProfileCard, Achievements, Reports, Goals, EditProfile, Changelog) only from ProfileScreen. Profile is effectively a second navigation surface carrying a third of the app.

16. Four components run their own setInterval at 60_000 ms to keep countdowns live: DigestionCard, MealDigestionLine, PostSessionCard and (indirectly) anything hosting them. A redesign that hosts several of these on one screen is running several independent minute timers.

17. Component-level empty states are inconsistent. Screens use <EmptyState> (10 files), charts print the bare caption 'Not enough data yet', RouteMap prints 'Waiting for GPS fixes to trace your route…', ExercisePeek prints a single caption, and EnergyBalanceCard / MealRoutineBar / DigestionCard / ChallengeWheel simply render null and vanish from the layout with no placeholder. There is no single empty-state pattern to inherit.

18. Everything is local-first and synchronous. Repositories are called directly from render bodies and useMemo (energyBalanceFor, listMealRoutines, latestReading, listConditions), wrapped in try/catch or a local safe() helper rather than in a loading state — so there is no skeleton UI anywhere in the app, and a repository throw shows as a missing card rather than an error.

---

## 3. Home Dashboard (Main → Home tab)

The Home tab is a single scrolling stack of ~13 cards that answers four questions in order: are you showing up (check-in streak + training streak), can you train right now (weather, stomach/smoke clocks, post-session margins), how is today's fuel (kcal ring, water ring, step ring, energy-balance strip, macro tiles), and what small things are still undone (self-care taps, prayer taps, coach tips). Everything is read synchronously from SQLite via repositories on every screen focus (useFocusEffect → reload()), plus a pull-to-refresh that calls the same function. It writes in only four places: self-care bumps, prayer toggles, coach-tip dismissals, and — as a side effect of merely opening the screen — freshly generated coach tips. Almost every card self-hides when its data or its opt-in module is absent, so the real Home for a new user is roughly half of what is described here.

### Screens (6)

#### HomeScreen

**Route** `Main → Home (TabParamList 'Home': undefined). Registered in src/navigation/TabNavigator.tsx as <Tab.Screen name="Home" component={HomeScreen}/>; headerShown:false, so there is NO native header — the greeting row is the only title.`  
**Reached from** Default first tab of the bottom tab bar (tab icon ICONS.nav.home = Ionicons 'home', tab bar height 62, active tint theme.colors.primary #4F8CFF, inactive textFaint). Root stack shows Main only once user.onboardedAt is set; otherwise the Onboarding screen replaces it.

The daily dashboard and launch pad: a snapshot of today's readiness, fuel and habits, with two primary actions (Start Session, Walk) and tap-through to Nutrition, Sleep, Cycle, Alcohol, Smoking, Prayers.

**Layout, top to bottom**

- ROOT: <Screen> = SafeAreaView(edges ['top'], bg theme.colors.bg #0B1220 dark) wrapping a ScrollView with contentContainerStyle { padding: 16 (spacing.lg), paddingBottom: 112 (16+96), gap: 16 }, showsVerticalScrollIndicator=false, keyboardShouldPersistTaps='handled'. RefreshControl attached, tintColor = theme.colors.primary. Every child below is separated by the uniform 16 gap.
- 1. GREETING ROW (always). Row, justifyContent space-between, alignItems center. LEFT column: caption in textMuted reading exactly 'Good morning,' / 'Good afternoon,' / 'Good evening,' (comma included; hour<12 / hour<18 / else, from new Date().getHours()); under it an h1 (26px/800) with user?.name, fallback literal 'Athlete'. RIGHT: Row gap 6 alignItems center — Icon 'nav.train' (MaterialCommunityIcons dumbbell) size 18 in primary, then h2 (20px/700) with the training-day streak number, then caption textMuted 'training day' / 'training days' (singular only when streak === 1).
- 2. STREAK METER (conditional: only once usageStore.streak is non-null, i.e. after the first reload()). <StreakMeter> Card with accent border-left 3px = warning #FFB454 when current>0 else textFaint. Inside: (a) header Row — left: a 48×48 rounded-16 tile with background flameColor+'22' holding Icon 'core.streak' (Ionicons flame) size 28, beside it a 'display' number (34px/800, flame-coloured) + body textMuted 'day'/'days', and under that caption textMuted 'Daily check-in streak'; right, right-aligned: Row with Icon 'core.pr' (MaterialCommunityIcons trophy-award) 14 textMuted + label 'Best {longest}', and beneath it caption textFaint '{totalDays} days total'. (b) A 7-day dot row, justified space-between: seven 26×26 circles, filled with the flame colour and holding a white 14px flame icon when that day was opened, otherwise surfaceAlt with a 6px textFaint dot; today's circle gets a 2px border in theme.colors.text. Under each circle a 10px caption with the weekday initial from const DOW = ['M','T','W','T','F','S','S'] indexed by (getDay()+6)%7. (c) Milestone block, rendered only when nextMilestone > current: a 6px-high ProgressBar (progress = current/nextMilestone, flame colour) plus caption textFaint '{n} more day(s) to a {nextMilestone}-day streak' with ' · open the app today to keep it alive' appended when openedToday is false.
- 3. WEATHER CARD (always mounted; content degrades). <WeatherCard plannedActiveMin=45 default>. Card, accent = HEAT_BAND_COLOR[band] or textFaint when there is no reading. (a) Header Row: Icon 'weather.thermo' (MCI thermometer) 22 in the band colour; then either the WITH-READING block — Row baseline-aligned: h3 '{Math.round(tempC)}°C', caption textMuted 'feels like {round(feelsLike)}°' (only when feelsLike !== tempC), and a <Badge> with HEAT_BAND_LABEL ('Cold' | 'Cool' | 'Ideal' | 'Warm' | 'Hot' | 'Extreme heat') tinted band colour at 22 alpha; below it one caption textFaint concatenating 'Live' or 'Entered by you', ' · {humidityPct}% humidity' (when known), ' · wind {windKmh} km/h' (when known and >0), ' · a few hours old' (when the reading is older than 3 h) — or the NO-READING block: bodyStrong 'Weather' + caption textMuted 'Checking…' while fetching else 'No reading yet — fetch it, or type it in.'. Far right: a Pressable Icon 'core.edit' (Ionicons create-outline) 18 textFaint, hitSlop 8, toggling the manual editor. (b) EDITOR (hidden by default): a Row of three flex-1 numeric <Input>s labelled '°C' (placeholder 'e.g. 31'), 'Humidity %' (placeholder 'optional'), 'Wind km/h' (placeholder 'optional'); then a Row of two size-'sm' buttons, 'Save' (primary) and 'Fetch live' / 'Fetching…' (secondary, disabled while fetching); then caption textFaint 'Live needs location and a connection; the advice is identical either way.' (c) ADVICE block (only with a reading), a Pressable that toggles expansion: body text = advice.headline, then bulleted caption lines '• {point}' — one point when collapsed, all points when expanded — and, when there is more than one point, a primary caption reading '{points.length - 1} more' / 'Less'.
- 4. DIGESTION / READINESS CARD (conditional: returns null when meals.length === 0 AND smokes.length === 0). <DigestionCard meals smokes smokingEnabled compact />. Card accent = success when clear, else warning when progress>0.66, else danger if the smoke clock governs, else calories. (a) Header Row: Icon 22 — 'core.check' when clear, 'smoking.cigarette' when the smoke clock governs, else 'digest.clock' (MCI timer-sand); bodyStrong 'Clear to train' or 'Wait {formatWait(remainingMin)}'; caption textMuted either 'Nothing in the way — good to go for a normal session.' or '{The smoke clock|The stomach clock} governs — a normal session at HH:MM; fine now for a walk or mobility.' (the trailing clause only when a lower intensity is already allowed). (b) STOMACH meter: label row 'Stomach' with Icon 'digest.stomach' 14, right-aligned bold status 'wait {formatWait} · HH:MM' or 'clear'; a 4px ProgressBar (compact); caption textFaint, one line, reading '~{loadKcal} kcal still digesting[ across {n} meals ({eatenKcal} kcal eaten)][ — fine now for {intensity label}].' or 'Nothing from today's meals is still in the way.' or 'Nothing logged today.' (c) SMOKE meter, shown when smokingEnabled OR any smoke events exist: identical structure with Icon 'smoking.cigarette', detail '{n} smoked in the last day' / 'nicotine (not smoked)', plus either 'carbon monoxide still on board (~X cigarettes' worth)' or 'heart rate and vessels still in the acute nicotine window', or when clear 'Last one {formatWait} ago — out of the way (CO ~X cigarettes' worth, fading)'. (d) Because Home passes compact, the light/Normal/hard SegmentedControl and the long explanatory paragraph are NOT rendered here — intensity is locked to the default 'moderate'.
- 5. POST-SESSION MARGINS CARD (conditional: only when activePostSession() returns a session). <PostSessionCard endedAt strain margins compact title='After today's session' />. Card accent = warning for hard/brutal strain, else accent green. Header: Icon 'after.session' (MCI clock-check-outline) 22, bodyStrong with the passed title, caption textMuted = capitalised STRAIN_LABEL ('An easy session' | 'A solid session' | 'A hard session' | 'A brutal session') plus ' — ' and up to three drivers (e.g. '18 hard sets, most sets within 2 reps of failure, 12 t moved'). Body: one line per still-relevant margin — compact filters OUT the 'water' and 'next' lines and every margin already open (unless it is the eat WINDOW and we are still inside it). Each line: Icon (after.eat fork-knife / after.smoke smoking-off / after.alcohol glass-cocktail-off / after.cold snowflake), the label ('Eat', 'Smoking', 'Alcohol', 'Cold plunge / ice bath'), a right-aligned bold status string, and a 4px ProgressBar of elapsed/waitMin. Status strings: 'now', 'open since HH:MM', 'from HH:MM (in 1 h 20)', 'Wed 14:30 (in 2 d)'-style for waits ≥12 h, and for the eat window 'now — until HH:MM' / 'from HH:MM (in X) · until HH:MM' / 'window closed HH:MM — still eat, just sooner next time'. In compact mode the lines are NOT pressable and the why/advice text is suppressed.
- 6. PRIMARY RINGS CARD (always). Plain Card (no accent). Row justified space-around, centred. LEFT: <ProgressRing size 128, strokeWidth 12, colour theme.colors.calories #FF7A59, progress = consumed/target> with a centred h2 tabular-nums value = kcal remaining and caption textMuted label 'kcal left'; when progress exceeds 1 the ring stroke turns warning orange. RIGHT: a column (gap 12) of two <MiniRing>s — each is a ProgressRing size 52 / strokeWidth 6 with an 18px icon inside, beside a bodyStrong tabular-nums value and a caption textMuted sub-label. Water: Icon 'nutrition.water' (MCI cup-water) in #4FC3F7, value '{x.x}L', label 'of {y.y}L'. Steps: Icon 'cardio.steps' (MCI shoe-print) in accent #33D9A6, value the locale-formatted step count, label 'of 8,000'.
- 7. ENERGY BALANCE STRIP (conditional: renders null when there is no nutrition goal or energyBalanceFor() throws). <EnergyBalanceStrip onPress→Nutrition tab>. A plain Card wrapped in a Pressable. Header Row: left Icon 'nutrition.calories' (MCI fire) 15 in calories colour + label textMuted 'Calories today'; right caption textFaint 'kcal'. Then four equal centred cells, each an h3 tabular-nums number over a caption textMuted label, in this order: 'Eaten' (bal.consumed, text colour), 'Burned' (bal.exerciseBurned, calories colour), 'Left' or 'Over' (abs(leftToEat); success when ≥0, warning when negative), 'Restore' (bal.restoreKcal; danger when >0, else textFaint). When restoreKcal > 0 a centred caption in danger appends 'Eat back ~{n} kcal to protect your goal.' NOTE: Home uses the STRIP, not the fuller EnergyBalanceCard — the training-load bar, the 'X / Y kcal to the line' row, the status message and the two explanatory paragraphs in EnergyBalanceCard are NOT on Home.
- 8. QUICK ACTIONS ROW (always). A Row (gap 12) of two flex-1 Buttons, both fullWidth={false}, height 48: 'Start Session' (primary #4F8CFF, Icon 'core.start' = Ionicons play-circle 18, white label) and 'Walk' (variant secondary = surfaceAlt background, Icon 'cardio.walk' = MCI walk).
- 9. SELF-CARE SECTION (always). <SectionHeader title='Self-care'> — h3, no action link, marginTop 8 / marginBottom −4. Then a Card containing a Row justified space-around of exactly three flex-1 Pressables, one per SELF_CARE_ITEMS entry: 'Brush teeth' (Icon 'care.brush' MCI toothbrush-paste, colour token info #4F8CFF, target 3, hint 'Morning, midday & night'), 'Shower' (Icon 'care.shower' MCI shower-head, colour token water #4FC3F7, target 1, hint 'Once a day'), 'Relax time' (Icon 'care.relax' MCI spa-outline, colour token mindbody #5FD0E0, target 1, hint 'Unwind & decompress'). Each: a 56×56 circle (radius 28) whose fill is the solid item colour when count ≥ target and colour+'22' otherwise, with a 2px border in the item colour when count>0 else theme.colors.border, holding a 26px icon (white when done, item-coloured otherwise); under it a centred caption in 'text' when count>0 else 'textFaint' with the item label; under that a 10px caption in textFaint showing '{count}/{target}' when target>1, otherwise 'Done ✓' when done, otherwise the hint string.
- 10. PRAYERS SECTION (conditional: only when getPrayerSettings()?.enabled is true). <SectionHeader title='Prayers today' action='Times'> — the action is a primary 'Times' label plus a chevron-forward, navigating to the Prayers screen. Then a Card: a Row justified space-between of five flex-1 Pressables, one per DAILY_PRAYERS = ['fajr','dhuhr','asr','maghrib','isha'] (sunrise from PRAYER_NAMES is deliberately excluded). Each: a 46×46 circle (radius 23) filled success #33D9A6 when done else surfaceAlt, 1.5px border success-or-border, holding a 20px icon — 'core.check' (Ionicons checkmark-circle) white when done, otherwise the prayer's own icon (faith.dawn weather-sunset-up / faith.sun white-balance-sunny / faith.afternoon weather-partly-cloudy / faith.sunset weather-sunset-down / faith.night weather-night) in textMuted; below it an 11px caption with the label ('Fajr','Dhuhr','Asr','Maghrib','Isha') coloured success when done else textFaint. Card footer: a centred caption textFaint '{prayersSet.size} of 5 prayers marked done'.
- 11. COACH TIPS SECTION (conditional: hidden entirely when there are zero non-dismissed tips). A View with gap 12 containing <SectionHeader title='Coach Tips'> (no action) and then up to five Cards, newest first. Each Card carries a left accent bar coloured by CATEGORY_COLOR[tip.category]: training→primary, nutrition→calories, hydration→water, caffeine→caffeine #B58750, recovery→mindbody, activity→accent, smoking→warning, sleep→mindbody, alcohol→warning, cycle→protein #FF6B9D, health→danger; anything unmapped falls back to primary. Layout inside: Row space-between, items flex-start — left a Row gap 10 with Icon 'stats.coachTip' (Ionicons bulb-outline) 20 in warning and a flex-1 column of bodyStrong tip.title over caption textMuted tip.message (marginTop 2); right a Pressable Icon 'core.close' (Ionicons close) 18 textFaint with hitSlop 8 that dismisses.
- 12. TODAY'S NUTRITION SECTION (always). <SectionHeader title="Today's Nutrition" action='Log'> → Nutrition tab. Then two Rows of two <StatTile>s each (a 2×2 grid; the source comments that four across would wrap the labels). Row A: 'Protein' (Icon 'nutrition.protein' MCI egg-fried, accent #FF6B9D, value '{n}g', sub 'of {goal.proteinG}g') and 'Carbs' (Icon 'nutrition.carbs' MCI bread-slice, accent #4F8CFF, sub 'of {goal.carbsG}g'). Row B: 'Fat' (Icon 'nutrition.fat' MCI oil, accent #FFB454, sub 'of {goal.fatG}g') and 'Fibre' (Icon 'nutrition.fiber' MCI leaf, accent #7ED37E, sub 'of {recommendedFiberG(calorieTarget)}g'). Each StatTile is a Card with a left accent bar: a 16px icon + caption textMuted label row, then an h2 tabular-nums value, then a caption textFaint sub.
- 13. RECOVERY ROW (always). A Row of two flex-1 Pressables. LEFT always: a StatTile → Sleep screen, Icon 'sleep.moon' (MCI moon-waning-crescent), accent mindbody #5FD0E0, label 'Sleep', value '{lastNight}h' or the em-dash '—', sub '{avg7d}h avg' or 'Tap to log'. RIGHT is one of two mutually exclusive tiles: when the cycle module is enabled AND a cycle state exists — a StatTile → Cycle screen with Icon 'cycle.flower', label = the phase title ('Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal'), value 'Day {dayOfCycle}', sub 'Period in {daysUntilNextPeriod}d', accent = the phase colour (#FF6B9D / #4F8CFF / #33D9A6 / #B58CFF); otherwise — a StatTile → Alcohol screen with Icon 'alcohol.beer', label 'Alcohol', value 'Log', sub 'tap to track', accent warning.
- 14. SMOKING TILE (conditional: only when the smoking module is enabled). A Pressable Card → Smoking screen, accent green (accent #33D9A6) when smokeFreeStreak>0 else warning. Row space-between: left a Row gap 10 with Icon 'smoking.smokeFree' (MCI smoking-off) or 'smoking.cigarette' (MCI smoking) at 22 in the matching colour, and a flex-1 column — bodyStrong either '{n}-day smoke-free streak' or '{n} cigarette(s) today' (singular only at 1) — plus a caption textMuted reading '~{avgPerDay}/day · −{aerobicPenaltyPct}% aerobic (est.)' or, when impact is null, 'Tap for impact'. Right: Icon 'core.forward' (chevron) 18 textFaint.
- (END — there is nothing below the smoking tile except the 112px bottom padding that clears the tab bar.)

**Interactions**

- Pull-to-refresh anywhere on the scroll view → onRefresh(): sets refreshing true, calls reload() synchronously, sets refreshing false. Because reload() is fully synchronous the spinner is effectively never visible.
- Screen focus (useFocusEffect) → reload(): setDate(todayISO()), refreshNutrition(), getDailySteps(), currentStreak(), refreshCoachTips() [WRITES], loadSmoking(), loadSleep(), loadCycle(), loadUsage(), getSelfCare(), getPrayerSettings(), prayersDone(), activePostSession(). Roughly 15 synchronous SQLite round-trips per focus on the JS thread.
- WeatherCard: tap the pencil icon toggles the manual-entry editor; 'Save' parses °C (comma or dot decimal — rejects silently and stays in edit mode if not finite), clamps humidity to 0–100 and wind to ≥0, writes a 'manual' reading and closes the editor; 'Fetch live' calls fetchLiveWeather() (disabled while in flight); tapping the advice text toggles between one bullet and all bullets.
- DigestionCard on Home is compact, so it has no intensity control and no tappable areas at all — it is display-only. It re-renders on a 60 000 ms interval so the countdowns move.
- PostSessionCard on Home is compact: each margin line is a Pressable but explicitly disabled={compact}, so the why/advice expansion is unreachable from Home. Also ticks every 60 000 ms.
- EnergyBalanceStrip: whole card is a Pressable → navigation.navigate('Main', { screen: 'Nutrition' }).
- Button 'Start Session' → navigation.navigate('SessionTypePicker') (modal, native title 'Start a Session').
- Button 'Walk' → navigation.navigate('Walk', { mode: 'walk' }).
- Self-care circles: single tap calls bumpSelfCare(key) which CYCLES 0→1→…→target→0 (tapping a completed item resets it to zero), then re-reads getSelfCare(). No long-press, no undo affordance.
- Prayer circles: single tap calls togglePrayer(prayer) — inserts the row if absent, DELETES it if present — then re-reads prayersDone().
- Coach tip 'X': dismissCoachTip(id) then setTips(activeCoachTips()). The card disappears immediately; the tip's ruleKey still blocks that rule from re-firing for the rest of the ISO week.
- SectionHeader 'Times' (prayers) → navigation.navigate('Prayers').
- SectionHeader 'Log' (nutrition) → Nutrition tab.
- Sleep tile → navigation.navigate('Sleep'). Cycle tile → navigation.navigate('Cycle'). Alcohol tile → navigation.navigate('Alcohol'). Smoking card → navigation.navigate('Smoking').
- No swipes, no long-presses, no modals and no bottom sheets anywhere on Home.

**What it shows, and from where**

- Greeting name — useUserStore.user.name (userRepo.ensureUser/getUser via userStore.load); fallback 'Athlete'.
- Training-day streak (header) — statsRepo.currentStreak(): walks statsRepo.trainingCalendar(365) for days with count>0, counting back from today, or from yesterday when today has no session yet.
- Check-in streak current/longest/totalDays/last7/nextMilestone — usageRepo.usageStreak() over the app_open_logs table; MILESTONES = [3,7,14,30,60,100,200,365]; the current-streak loop scans up to 3650 days back.
- Weather temp / humidity / wind / source / age — weatherRepo.latestReading(todayISO()) from the weather_readings table (most recent observedAt for today), or services/weatherFetch.fetchLiveWeather() on mount when the stored reading is missing or older than 3 h.
- 'Feels like', band, badge label and colour, headline and bullet points — lib/weather.feelsLikeC → heatIndexC / windChillC, heatBand, HEAT_BAND_LABEL/COLOR, weatherAdvice(reading, ctx). ctx is built in WeatherCard from conditionsRepo.listConditions() cross-referenced against CONDITION_CATALOGUE categories 'respiratory' and 'cardiovascular', plus faithRepo.currentFastingState()?.fasting, with plannedActiveMin fixed at 45.
- Stomach load, wait, ready-at, meal count, eaten kcal — lib/readiness.trainReadiness → lib/digestion.currentDigestion/stomachLoad, fed by lib/digestion.mealsFromEntries(nutritionRepo.foodEntriesForDay(todayISO())) reading the food_entries table.
- Smoke wait, CO load, recent count — lib/readiness.trainReadiness → lib/smokeClock.smokeStatus/coLoad, fed by smokingRepo.recentSmokeEvents() (last 24 h, joined against the smoking product catalogue for combusted / cigaretteEquivalent).
- Post-session strain level and drivers, and each margin's open/wait/window time — postSessionRepo.activePostSession() → postSessionFor(sessionId) → lib/postSession.sessionStrain + postSessionMargins, then lib/postSession.marginStatuses(margins, endedAt, now). Bodyweight for relative tonnage comes from userRepo.latestWeight(); the smoke line is included only when smokingRepo.isSmokingEnabled().
- kcal left (big ring) — lib/format.roundKcal(max(0, goal.calorieTarget − food.calories)); target from useUserStore.goal (nutrition_goals via userRepo.getNutritionGoal), consumed from useNutritionStore.food (nutritionRepo.dayNutrition(today)). Ring progress = consumed/target (unclamped, so it can exceed 1 and turn orange).
- Water value and goal — water = useNutritionStore.beverages.hydrationMl (nutritionRepo.dayBeverages: only beverages flagged hydrating in BEVERAGE_PRESETS count). Goal = weatherRepo.weatherAdjustedWaterGoal(goal.waterGoalMl ?? 2500).totalMl = base + lib/weather.extraWaterMl(feelsLike, 45 min, humidity) — additive only, never subtractive, and zero without a reading for today.
- Steps value — activityRepo.getDailySteps()?.stepCount from daily_step_logs; goal = lib/pedometer.DAILY_STEP_GOAL.
- Eaten / Burned / Left / Restore — energyRepo.energyBalanceFor() → lib/energyBalance.computeEnergyBalance. consumed = nutritionRepo.dayNutrition().calories; exerciseBurned = Σ caloriesBurned over sessionRepo.listSessions({since:today,until:today}) plus activityRepo.listWalkSessions(500) filtered to today; tdee = goal.tdee ?? goal.calorieTarget; bmr = tdee / ACTIVITY_MULTIPLIERS[user.activityLevel] (default 1.55).
- Self-care counts — selfCareRepo.getSelfCare(todayISO()) from the self_care_logs table.
- Prayer done-marks — faithRepo.prayersDone(todayISO()) from the prayer_logs table; the faith toggle from faithRepo.getPrayerSettings().enabled.
- Coach tip title / message / category — coachRepo.activeCoachTips() (coach_tips where dismissed=false, ordered createdAt DESC, LIMIT 5), whose rows are generated by lib/recommendations.generateCoachTips over coachRepo.buildCoachContext().
- Protein / Carbs / Fat / Fibre values — useNutritionStore.food (nutritionRepo.dayNutrition), rounded to whole grams. Targets: goal.proteinG / carbsG / fatG straight off the nutrition_goals row; the fibre target is DERIVED at render time by lib/calories.recommendedFiberG(goal.calorieTarget ?? 2200).
- Sleep last-night and 7-day average — useSleepStore (sleepRepo.sleepForDate(today).hours and sleepRepo.sleepSummary().avg7d, which averages only nights that were actually logged).
- Cycle phase title, day of cycle, days until next period — useCycleStore.state = cycleRepo.currentCycle() → lib/cycle.computeCycle (clamps cycle length to 21–40 days and period length to 2–10 days); label/colour from lib/cycle.PHASE_GUIDANCE.
- Smoking today count, avg/day, aerobic penalty, smoke-free streak — useSmokingStore (smokingRepo.dayCigarettes(today) and smokingRepo.smokingImpact(), whose aerobicPenaltyPct comes from lib/smoking.aerobicPenaltyPct).

**What it writes**

- coachRepo.refreshCoachTips() → INSERT into coach_tips — fires on EVERY screen focus and every pull-to-refresh, not on an explicit user action. It runs buildCoachContext() (which itself issues ~20 further queries) and inserts any draft whose ruleKey has not already produced a row dated on or after lib/date.startOfWeek(today) (Monday-based ISO week).
- coachRepo.dismissCoachTip(id) → UPDATE coach_tips SET dismissed = true.
- selfCareRepo.bumpSelfCare(key) → INSERT or UPDATE self_care_logs (userId, date, key, count); count wraps to 0 once it reaches the item's target.
- faithRepo.togglePrayer(prayer) → INSERT into prayer_logs, or DELETE the existing row for that (user, date, prayer).
- weatherRepo.saveWeatherReading(reading) → INSERT into weather_readings — from the WeatherCard 'Save' button (source 'manual') and from services/weatherFetch.fetchLiveWeather() on success (source 'live'). Every fetch/save appends a new row; nothing is ever updated or pruned.
- nutritionStore.setDate/refresh, the smoking/sleep/cycle/usage store loads, activePostSession() and currentStreak() are all read-only.

**Empty, loading and error states**

- No user row → name shows 'Athlete'. No nutrition goal → calorie target falls back to 2200, water goal to 2500, and the protein/carbs/fat tiles read 'of 0g' while the fibre tile reads 'of 31g' (recommendedFiberG(2200)). The EnergyBalanceStrip renders NOTHING at all in this case, since energyBalanceFor() returns null without a goal.
- No food logged → all macro values 0g, kcal-left ring shows the full target, DigestionCard is absent (no meals, no smokes).
- No steps row for today → 0 of 8,000, empty ring.
- No sessions ever → header streak reads '0 training days'; no post-session card.
- Check-in streak: usageStore.streak starts null, so the StreakMeter is absent on the very first render and appears after reload(). Because nothing in the app ever calls usageStore.record()/usageRepo.recordAppOpen(), app_open_logs is always empty in practice — see notes.
- Weather, no reading yet → grey (textFaint) accent, bodyStrong 'Weather', caption 'No reading yet — fetch it, or type it in.', no advice block, edit pencil still available. While the mount-time fetch is in flight the caption reads 'Checking…'.
- Weather, permission denied / offline / >8 s timeout / non-OK HTTP / malformed body → fetchLiveWeather() swallows everything and returns null; the card silently stays in the no-reading state. There is NO 'location denied' message and no prompt to grant permission — the only recovery path is manual entry.
- Weather, stale reading (>3 h old) → the card still shows the numbers and the full advice, with ' · a few hours old' appended to the source line.
- Manual weather entry with a non-numeric temperature → saveManual() returns early with no feedback; the editor stays open and nothing is written.
- DigestionCard returns null when there are neither meals nor smoke events. With meals but nothing left in the stomach the stomach meter reads 'clear' with a full bar and 'Nothing from today's meals is still in the way.'
- PostSessionCard (compact) returns null when every remaining margin has already opened. activePostSession() also returns null once the session ended more than 12 h ago, or if none of the last 3 sessions has an endTime/durationS.
- Coach Tips section is omitted entirely when there are no undismissed tips — no empty state, no placeholder.
- Sleep tile with nothing logged → value '—', sub 'Tap to log'.
- Cycle tile is replaced by the Alcohol tile whenever the cycle module is off or currentCycle() is null (which also happens when the module is on but lastPeriodStart is unset).
- Prayers section and Smoking tile are entirely absent unless their modules are enabled.
- There is NO loading skeleton, NO spinner and NO error boundary on Home. Only WeatherCard (its `safe()` helper around conditions/fasting) and EnergyBalanceStrip (try/catch around energyBalanceFor) guard against a throwing repository; a throw anywhere else in reload() would take the screen down.

> HomeScreen is a single ~460-line file with one local helper component (MiniRing) defined at the bottom. Its state is entirely local useState (steps, tips, streak, refreshing, care, prayersSet, faithOn, after) plus six zustand stores. Three useMemos have deliberately odd dependency keys: digestMeals is keyed on [food], smokes on [smokingEnabled, smokingToday] (so logging a cigarette re-reads the events), and waterAdj on [goal, food] — meaning a fresh weather reading fetched by WeatherCard does not move the water ring goal until the next focus.

#### WeatherCard

**Route** `n/a — component at src/components/WeatherCard.tsx, rendered as card #3 on Home. Also used elsewhere; Home passes no props, so plannedActiveMin defaults to 45.`  
**Reached from** Rendered inline on Home; not navigable.

Show today's conditions and, more importantly, what they change about training, hydration and pacing — working from the last stored reading so it is never blank offline.

**Layout, top to bottom**

- Header row (icon, temperature/feels-like/band badge, source+humidity+wind+staleness line, edit pencil)
- Collapsible manual-entry editor: three numeric inputs (°C / Humidity % / Wind km/h) + Save and 'Fetch live' buttons + a caption
- Collapsible advice block: headline + 1 or all bullet points + an 'N more'/'Less' link

**Interactions**

- Pencil toggles the editor
- Save writes a manual reading
- 'Fetch live' re-runs the Open-Meteo fetch
- Tapping the advice text expands/collapses the bullet list

**What it shows, and from where**

- tempC / humidityPct / windKmh / source — weatherRepo.latestReading()
- feelsLike — lib/weather.feelsLikeC (heatIndexC above 27 °C, windChillC at or below 10 °C, otherwise the raw temperature)
- band label + colour — lib/weather.heatBand / HEAT_BAND_LABEL / HEAT_BAND_COLOR
- headline and bullets — lib/weather.weatherAdvice, including the extra-water figure from extraWaterMl and the pace penalty from pacePenaltyPct
- staleness — lib/weather.isReadingFresh (3 h window)

**What it writes**

- weatherRepo.saveWeatherReading → weather_readings (manual Save)
- services/weatherFetch.fetchLiveWeather → weatherRepo.saveWeatherReading → weather_readings (live fetch)

**Empty, loading and error states**

- No reading: 'Weather' / 'No reading yet — fetch it, or type it in.'
- Fetching: 'Checking…' and the Fetch button reads 'Fetching…' and is disabled
- Permission denied or offline: silent null, card stays in the no-reading state — no explicit error copy anywhere
- Stale reading: ' · a few hours old' suffix, full advice still shown

> An auto-fetch fires once on mount whenever the stored reading is missing or stale. The condition/fasting context is wrapped in a local `safe()` try/catch, so a broken conditions table degrades the advice rather than crashing the card.

#### DigestionCard (compact)

**Route** `n/a — component at src/components/DigestionCard.tsx, card #4 on Home. Home passes compact.`  
**Reached from** Rendered inline on Home; the non-compact version with the intensity SegmentedControl lives on other screens.

Answer 'can I train yet?' with two independent clocks — the stomach and the smoke — each with its own countdown, bar and one-line explanation.

**Layout, top to bottom**

- Header: status icon, 'Clear to train' or 'Wait {time}', and a caption naming which clock governs
- Stomach meter: title row + status, 4px bar, one-line detail
- Smoke meter (only when the smoking module is on or something was smoked): same structure

**Interactions**

- None on Home — compact suppresses the Light/Normal/Hard SegmentedControl and the explanatory footnote. The card re-renders on a 60-second interval.

**What it shows, and from where**

- Readiness, governor, readyFor — lib/readiness.trainReadiness (the later of the two clocks wins)
- Stomach load / wait / ready-at — lib/digestion.currentDigestion + stomachLoad, from foodEntriesForDay(today)
- Smoke wait / CO load / recent count — lib/smokeClock.smokeStatus + coLoad, from smokingRepo.recentSmokeEvents()

**Empty, loading and error states**

- Returns null when there are no meals and no smoke events
- 'clear' status with a full bar when the stomach load has drained
- 'Nothing smoked in the last day.' when the module is on but nothing was logged

> Because Home hard-codes compact, the answer is always computed for intensity 'moderate' — the user cannot ask 'what about a walk?' from Home.

#### PostSessionCard (compact)

**Route** `n/a — component at src/components/PostSessionCard.tsx, card #5 on Home, titled 'After today's session'.`  
**Reached from** Rendered inline on Home only when postSessionRepo.activePostSession() finds a qualifying session.

After a finished session, show the margins still running before smoking, drinking, eating (a window, not a wait) and a cold plunge — scaled by how hard the session actually was.

**Layout, top to bottom**

- Header: clock icon, the title, and a caption with the strain label plus up to three drivers
- One line per still-relevant margin: icon, label, bold status string, 4px progress bar

**Interactions**

- None on Home — the per-line Pressable is disabled in compact mode, so the why/advice text is unreachable. Ticks every 60 seconds.

**What it shows, and from where**

- Strain level and drivers — lib/postSession.sessionStrain over sessionRepo.getSessionDetail data (duration, completed sets with RPE/to-failure, tonnage, distance) and userRepo.latestWeight()
- Margin waits and windows — lib/postSession.postSessionMargins + marginStatuses

**Empty, loading and error states**

- Returns null when the compact filter leaves no lines (all margins open, none inside a window)
- activePostSession() itself returns null past 12 h after the session end, or when none of the last three sessions has an end time

> Compact deliberately hides the 'Water' line (always open) and the multi-day 'Next hard session' line.

#### StreakMeter

**Route** `n/a — component at src/components/StreakMeter.tsx, card #2 on Home.`  
**Reached from** Rendered inline on Home whenever usageStore.streak is non-null.

Reward simply opening the app each day, independent of training: current streak, best, total days, a 7-day dot row and progress to the next milestone.

**Layout, top to bottom**

- Header: flame tile + big current number + 'Daily check-in streak'; right side 'Best {n}' and '{n} days total'
- 7-day dot row with weekday initials and a ring on today
- Milestone progress bar + '{n} more days to a {m}-day streak' (with the 'open the app today' warning when today is not yet recorded)

**Interactions**

- None — the whole card is display-only, with no tap target.

**What it shows, and from where**

- current / longest / openedToday / totalDays / last7 / nextMilestone — usageRepo.usageStreak() over app_open_logs

**Empty, loading and error states**

- Absent until usageStore.load() has run once
- With an empty app_open_logs table it renders 0 days, a grey flame, seven empty dots and '3 more days to a 3-day streak · open the app today to keep it alive'

> See the top-level notes: nothing in the app writes app_open_logs, so this is its permanent state today.

#### EnergyBalanceStrip

**Route** `n/a — exported from src/components/EnergyBalanceCard.tsx alongside the fuller EnergyBalanceCard; Home renders the STRIP, card #7.`  
**Reached from** Rendered inline on Home; tapping opens the Nutrition tab.

Four numbers at a glance — eaten, burned, left, restore — where 'Restore' is what to eat back to protect the goal after training.

**Layout, top to bottom**

- Header row: fire icon + 'Calories today' on the left, 'kcal' on the right
- Four centred number/label cells: Eaten, Burned, Left|Over, Restore
- Optional danger caption 'Eat back ~{n} kcal to protect your goal.'

**Interactions**

- Tapping the card navigates to Main → Nutrition.

**What it shows, and from where**

- consumed / exerciseBurned / leftToEat / restoreKcal — energyRepo.energyBalanceFor() → lib/energyBalance.computeEnergyBalance

**Empty, loading and error states**

- Renders null when there is no nutrition goal or the computation throws
- 'Left' flips to 'Over' with an absolute value and warning colour once leftToEat goes negative
- 'Restore' is 0 and textFaint unless the day's training has pushed available energy below the goal floor

> It recomputes on food, beverages, nutrition date and every screen focus. The bigger EnergyBalanceCard (training-load bar, 'X / Y kcal to the line', status message, two paragraphs of explanation) is NOT used on Home.

### Engines behind this area

- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/recommendations.ts`** — The pure rule engine behind Coach Tips. generateCoachTips(ctx) walks a fixed list of rules over one aggregated CoachContext object and returns zero or more {category, title, message, ruleKey} drafts. Each rule embeds its own reasoning in the message. Categories used by the rules: activity, training, recovery, nutrition, hydration, caffeine, smoking, sleep, alcohol, cycle. ('health', 'habits' and 'work' exist in the schema enum but no rule currently produces them.)  
  *Constants:* Activity nudge: no session today AND steps < 50% of the step goal AND local hour ≥ 14 — ruleKey is per-day. Training inactive: daysSinceLastSession ≥ 4 (ruleKey splits at 7+). Neglected mind-body: ≥ 21 days. Volume drop: biggest drop ≥ 15% (7 days vs the prior 7). Rest day: consecutiveTrainingDays ≥ 5. Low protein: ≥ 3 of 7 days logged AND ≥ 3 days under 80% of the protein target (the 0.8 factor lives in coachRepo). Weight-trend rules need avgCalories7d, a weight trend and ≥ 4 logged days: lose_fat stalls at trend > −0.05 kg/wk, build_muscle stalls at trend < +0.05, recomp drifts at |trend| > 0.35, lose_fat 'too fast' at trend < −1.0 — all suggest ±150 kcal. Hydration: 7-day average water < 60% of the goal. Caffeine: 7-day average above the soft limit (default 400 mg). Smoking: any cigarette on a training day (per-day key); smoke-free milestones at exactly 1, 3, 7, 14 or 30 days (with three different benefit sentences at ≥14, ≥3 and below); over the self-set daily cap; and sustained use at ≥ 10 cigs/day with an aerobic penalty ≥ 5%. Sleep: 7-day average < 6.5 h; trained today on < 6 h. Alcohol: week grams over the guideline, else drank every day with 0 dry days. Cycle: period within 0–2 days, else a follicular tip, else a luteal tip. The literal `const WEEK = 'w'` suffix on most ruleKeys is what makes them once-per-week.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/coachRepo.ts`** — Assembles the CoachContext (buildCoachContext) from ~20 repository calls, runs the rule engine, persists new tips (refreshCoachTips) and reads them back (activeCoachTips). Also owns dismissCoachTip and a weeklyStepAverage helper used by the Stats screen.  
  *Constants:* DEFAULT_STEP_GOAL = 8000 (a second, independent copy of lib/pedometer.DAILY_STEP_GOAL). Fallbacks when no goal row exists: proteinTarget 140 g, calorieTarget 2200, waterGoalMl 2500, caffeineSoftLimitMg 400. daysUnderProtein7d counts days below proteinTarget × 0.8. weightTrendKgPerWeek is computed over a 21-day window. The 7-day windows use daysAgoISO(6). Dedupe: a draft is skipped when the newest row with the same ruleKey has date >= startOfWeek(today) (Monday-based), dismissed or not. activeCoachTips returns at most 5 rows, dismissed=false, ordered createdAt DESC.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/readiness.ts`** — Combines the two 'can I train now?' clocks. trainReadiness({meals, smokes}, intensity, now) takes the LATER of the stomach wait and the smoke wait, names the governor ('stomach' | 'smoke' | null), and separately answers 'what can I do right now?' by testing hard → moderate → light against both clocks.  
  *Constants:* ORDER = ['hard','moderate','light']. progress is the governing clock's own progress, or 1 when clear. readyAt = now + remainingMin × 60 000.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/digestion.ts`** — The stomach model: a cumulative kcal-equivalent LOAD that drains as dR/dt = −(B + K·R)/s, with s a composition-derived 'slowness'. Not a per-meal timer — a snack lands on top of what is still in there. Solved in closed form (drain / minutesToDrain).  
  *Constants:* EMPTY_BASE_KCAL_PER_MIN = 2.0; EMPTY_RATE_PER_KCAL = 0.004; MIN_MEAL_KCAL = 20 (anything smaller is ignored, which is how 0-kcal drinks fall out); READY_THRESHOLD_KCAL = {light 500, moderate 260, hard 180}; SETTLE_MIN = {light 0, moderate 20, hard 30}; LIQUID_SETTLE_MIN = {light 0, moderate 10, hard 15}; LIQUID_SPEED = 2 (a liquid drains at twice the rate, MIN_SLOWNESS = 0.5); MAX_WAIT_MIN = 300. mealSlowness clamps to 1–2 for solids: 1 + 1.2×max(0, fatShare−0.15) + 0.4×max(0, proteinShare−0.15) + 0.08×(fibre g per 100 kcal, capped at 6). formatWait renders 'clear' / '45 min' / '1 h 20'. INTENSITY_LABEL = {light 'a walk or mobility', moderate 'a normal session', hard 'sprints or heavy lifting'}.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/smokeClock.ts`** — The smoke clock: an acute nicotine floor since the last use of anything, plus a cumulative carbon-monoxide load in cigarette-equivalents that decays exponentially. The later of the two governs, and limitedBy says which.  
  *Constants:* NICOTINE_ACUTE_MIN = {hard: combusted 45 / other 30, moderate: 30 / 20, light: 15 / 10}; CO_HALF_LIFE_MIN = 240; CO_THRESHOLD = {hard 2, moderate 3, light 5} cigarette-equivalents; SMOKE_LOOKBACK_MIN = 1440 (24 h); MAX_SMOKE_WAIT_MIN = 300. coLoad = Σ cigEq × qty × 2^(−Δt/240).
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/postSession.ts`** — Scores how hard a session was (sessionStrain) and derives the six post-session margins from it (postSessionMargins), then places them on a clock (marginStatuses, marginsStillRunning).  
  *Constants:* Strain levels: <0.30 light, <0.60 moderate, <0.85 hard, else brutal. Lifting score = 0.30×(duration/90 min) + 0.45×effort (effectiveSets/24, +0.1 when avg RIR ≤ 2, +0.1×failureShare) + 0.25×(tonnage / (bodyweight × 150)); bodyweight falls back to 75 kg. Cardio score = typeIntensity × (0.4 + 0.6×duration/90), with pace overrides at <6 min/km (→1.0), <8 (→0.8) and >11 (→0.35). Mind-body = 0.15×duration fraction. TYPE_INTENSITY: martial_arts 0.9, sport 0.8, cardio 0.7, outdoor 0.5, custom 0.5, mindbody 0.15, meditation 0.05. Margins, scaled linearly easy→brutal: water 0 min; eat wait 15→30 min with a window closing at 120→60 min; smoking 60→150 min; alcohol 90→300 min; cold plunge 240→360 min for lifting and 0 otherwise; next hard session 1440→4320 min for lifting, 720→2880 otherwise. STRAIN_LABEL = {light 'an easy session', moderate 'a solid session', hard 'a hard session', brutal 'a brutal session'}.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/postSessionRepo.ts`** — activePostSession() picks the most recent finished session whose margins are still running, for the Home card; postSessionFor(id) builds the strain and margin set from the logged sets, tonnage, distance and duration.  
  *Constants:* Scans only the last 3 sessions (listSessions({limit:3})); ignores anything that ended more than 12 h ago (12 × 3 600 000 ms); the 'next hard session' margin is excluded from the still-running test, so it never keeps the card alive on its own.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/weather.ts`** — Pure weather physiology: heat index (NOAA Rothfusz), wind chill (Environment Canada), a single feels-like, six heat bands with labels and colours, a humidity sweat factor, extra fluid needs, a calorie-cost multiplier, a pace penalty, and weatherAdvice() which assembles the headline and bullets from the band plus the user's own conditions and fasting state.  
  *Constants:* heatIndexC applies only at T ≥ 27 °C and RH ≥ 40%; windChillC only at T ≤ 10 °C and wind ≥ 4.8 km/h. Bands on feels-like: cold <5, cool <12, ideal <24, warm <30, hot <38, extreme ≥38. Band colours: cold #4FC3F7, cool #4F8CFF, ideal #33D9A6, warm #FFB454, hot #FF8A3D, extreme #FF5D5D. humiditySweatFactor: 1.0 below 20 °C, ramping RH 40→100% and warmth 20→26 °C to a maximum of 1.4. extraWaterMl: 0 below feels-like 24; per hour 250 ml (24–30), 500 ml (30–38), 750 ml (≥38); a resting bonus of 150 ml (≥24) or 300 ml (≥30); hours = max(0.5, plannedActiveMin/60); the whole thing multiplied by the humidity factor and capped at 3000 ml. pacePenaltyPct: 0 / 3 / 7 / 12 / 20 at feels-like <22 / <27 / <32 / <38 / else, plus up to ~5 points for humidity. calorieCostMultiplier: 1.10 at ≥38, 1.06 at ≥30, 1.03 at ≥24, 1.05 below 5, 1.08 below 0 — advisory only, never written into a logged session. isReadingFresh maxAge = 3 h. 'Very humid' copy triggers at ≥80% RH, 'humid' at ≥60%. cautionOutdoors is set for extreme heat, for hot ≥34, for a cardiac condition in hot/extreme, and for fasting in hot/extreme.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/services/weatherFetch.ts`** — Best-effort live weather. Checks the existing foreground location permission (never requests one), prefers a cached position, falls back to a low-accuracy fix, calls Open-Meteo with no API key, stores the reading and returns it. Every failure path returns null silently.  
  *Constants:* Endpoint https://api.open-meteo.com/v1/forecast with current=temperature_2m,relative_humidity_2m,wind_speed_10m&wind_speed_unit=kmh&timezone=auto. Coordinates are truncated to 2 decimals (~1 km) for privacy. getLastKnownPositionAsync maxAge 30 × 60 000 ms. AbortController timeout 8000 ms. Temperature is rounded to 1 decimal; humidity and wind to whole numbers.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/weatherRepo.ts`** — Persistence and derivation for weather: saveWeatherReading, latestReading (most recent observedAt for a date), freshReading, todaysAdvice, and weatherAdjustedWaterGoal which returns { totalMl, extraMl, feelsLike } so a screen can explain the number.  
  *Constants:* weatherAdjustedWaterGoal defaults plannedActiveMin to 45 and returns the base goal unchanged with extraMl 0 when there is no reading for today. The extra is additive only — weather never lowers the hydration goal.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/usageRepo.ts`** — The daily check-in streak behind StreakMeter: recordAppOpen() inserts one row per day into app_open_logs; usageStreak() derives current, longest, openedToday, totalDays, a last-7 array and the next milestone.  
  *Constants:* MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365]; nextMilestone falls back to `current` when the list is exhausted. The current-streak loop starts at today when today is recorded, otherwise at yesterday, and scans up to 3650 days. last7 is built newest-last (i = 6 → 0).
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/stores/usageStore.ts`** — A three-property zustand store: streak, record() (recordAppOpen + refresh) and load() (refresh only). Home calls load() on every focus.  
  *Constants:* streak starts null, which is why the StreakMeter is absent on the very first render.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/statsRepo.ts`** — currentStreak() supplies the header's training-day count; consecutiveTrainingDays(), daysSinceLastSession(), daysSinceType() and recentVolumeDrops() feed the coach context.  
  *Constants:* currentStreak reads trainingCalendar(365) and counts back from today (or yesterday when today has no session). consecutiveTrainingDays is literally an alias for currentStreak — so the 'Schedule a rest day' rule and the header number are the same figure. recentVolumeDrops compares the last 7 days against the prior 7 for every exercise with weight × reps logged.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/energyRepo.ts + src/lib/energyBalance.ts`** — Today's energy balance for the Home strip: consumed, training burn, left to eat, the over-training 'line' and the restore figure. Returns null without a nutrition goal.  
  *Constants:* Goal floors for available energy (eaten − trained off): build_muscle → TDEE; lose_fat → target − 500; performance → target − 200; maintain/recomp → target − 300; and never below BMR. lineKcal = max(0, consumed − floor); restoreKcal = max(0, floor − (consumed − exercise)). Status thresholds: over_trained when exercise exceeds the line, eat_more when leftToEat > 100, over_eaten when leftToEat < −100, else on_track. BMR is back-derived as tdee / ACTIVITY_MULTIPLIERS[activityLevel] with a 1.55 default. trainingLoadFraction (used only by the full card, not the strip) clamps exerciseBurned / lineKcal to 0..1.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/selfCare.ts + src/repositories/selfCareRepo.ts`** — The three-item daily hygiene checklist and its counter storage. bumpSelfCare cycles the count and wraps to 0 at the target.  
  *Constants:* SELF_CARE_ITEMS = brush (target 3, colour token 'info', hint 'Morning, midday & night'), shower (target 1, colour 'water', hint 'Once a day'), relax (target 1, colour 'mindbody', hint 'Unwind & decompress').
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/faithRepo.ts + src/lib/prayers.ts`** — Prayer settings, the five daily prayer check-ins (insert/delete toggle), and — used elsewhere, not on Home — offline prayer-time computation and fasting state. Home reads getPrayerSettings().enabled, prayersDone() and DAILY_PRAYERS; WeatherCard reads currentFastingState().  
  *Constants:* DAILY_PRAYERS = ['fajr','dhuhr','asr','maghrib','isha'] — five, with 'sunrise' present in PRAYER_NAMES but deliberately excluded from the check-in row. PRAYER_METHODS default to 'tunisia' (Fajr 18°, Isha 18°); Asr shadow factor 1 (Shafi) or 2 (Hanafi); the sun-angle constant for sunrise/maghrib is 0.833°.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/pedometer.ts`** — Supplies the step goal used by the Home ring (and the live walk notification).  
  *Constants:* DAILY_STEP_GOAL = 8000.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/calories.ts`** — recommendedFiberG(calorieTarget) derives the fibre target shown on the Home tile — it is computed at render time, never stored on the goal row.  
  *Constants:* FIBRE_G_PER_1000_KCAL = 14, FIBRE_MIN_G = 25; recommendedFiberG(2200) = 31 g. ACTIVITY_MULTIPLIERS (used by energyRepo) default to 1.55.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/format.ts`** — roundKcal(n) — the whole-number rounding applied to the big ring's 'kcal left'.  
  *Constants:* Returns 0 for any non-finite input.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/cycle.ts`** — PHASE_GUIDANCE supplies the Home cycle tile's label and accent colour; computeCycle derives dayOfCycle, phase and daysUntilNextPeriod.  
  *Constants:* Phase titles/colours: Menstrual #FF6B9D, Follicular #4F8CFF, Ovulation #33D9A6, Luteal #B58CFF. computeCycle clamps cycle length to 21–40 days (default 28) and period length to 2–10 days (default 5).
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/smoking.ts`** — aerobicPenaltyPct(avgCigsPerDay) — the '−X% aerobic (est.)' figure on the Home smoking tile.  
  *Constants:* min(15, round(avg × 0.6 × 10)/10), i.e. 0.6 percentage points per cigarette/day, capped at 15%. restingHrElevation is min(12, round(avg × 0.5)) bpm (not shown on Home).
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/alcohol.ts`** — Supplies the weekly low-risk guideline quoted by the alcohol coach tip.  
  *Constants:* WEEKLY_LOWRISK_G = 100 g/week (a conservative reading of the UK CMO's ~112 g).
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/rating.ts`** — The athlete-card rating engine — six attributes (STR, END, CON, NUT, REC, DIS) each clamped 1–99, an overall, and five tiers. IMPORTANT: this file is NOT used by the Home dashboard at all; its only consumers are src/repositories/cardRepo.ts, src/screens/profile/ProfileCardScreen.tsx and src/lib/reportHtml.ts.  
  *Constants:* STR = 30 + relativeStrength×22 + min(15, sessions/wk × 3). END = 25 + min(45, cardioMin/4) + min(25, steps/400). CON = 30 + min(40, sessions/wk × 9) + min(25, streakDays × 1.5). NUT = 20 + calorieAdherence×35 + proteinAdherence×30 + min(14, loggingDays × 2). REC = 25 + sleepScore (clamped (sleep/8)×45, or a flat 20 when sleep is unknown) + min(18, restDays × 8) − min(25, alcoholG/wk ÷ 8). DIS = 35 + min(20, loggingDays × 3) + min(15, sessions/wk × 3) − min(25, cigs/day × 3) − min(15, alcoholG/wk ÷ 12). Overall = (STR + END + 1.3×CON + 1.1×NUT + REC + 1.1×DIS) / 6.5. Tiers: Legend ≥90 (#B58CFF), Elite ≥80 (#4FC3F7), Gold ≥68 (#FFD54A), Silver ≥55 (#C0C6D0), Bronze below (#CD8B62).
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/theme/index.ts`** — The token source every Home colour resolves through. Dark-first; a light palette exists for a future preference.  
  *Constants:* Dark: bg #0B1220, surface/card #141C2E, surfaceAlt #1C2740, border #26314A, text #EAF0F7, textMuted #9AA6B8, textFaint #63708A. Semantic: primary #4F8CFF, accent/success #33D9A6, warning #FFB454, danger #FF5D5D, info #4F8CFF. Domain: calories #FF7A59, water #4FC3F7, protein #FF6B9D, carbs #4F8CFF, fat #FFB454, fiber #7ED37E, caffeine #B58750, mindbody #5FD0E0. spacing {xs 4, sm 8, md 12, lg 16, xl 24, xxl 32, xxxl 48}; radius {sm 8, md 12, lg 16, xl 24, pill 999}; typography display 34/800, h1 26/800, h2 20/700, h3 17/700, body 15/500, bodyStrong 15/700, label 13/600, caption 12/500.

### Notes for the redesign

GAPS AND ODDITIES A DESIGNER MUST KNOW.

1. THE CHECK-IN STREAK IS DEAD CODE IN PRACTICE. usageStore.record() — the only thing that calls usageRepo.recordAppOpen() — is never invoked anywhere in the app (grep over src/ and App.tsx confirms: the only references to useUsageStore are HomeScreen's two selectors for `streak` and `load`). app_open_logs is therefore never written, so the StreakMeter permanently shows 0 days, 'Best 0', '0 days total', seven empty dots and '3 more days to a 3-day streak · open the app today to keep it alive'. It is the second-largest card on the screen. Either wire record() into app launch or drop the card.

2. TWO DIFFERENT STREAKS, TWO DIFFERENT MEANINGS, ADJACENT. The header shows statsRepo.currentStreak() ('N training days' — consecutive days with a logged session) and immediately below it the StreakMeter shows usageRepo.usageStreak().current ('N days · Daily check-in streak'). Nothing on screen distinguishes them beyond the small caption. Worse, statsRepo.consecutiveTrainingDays() is a literal alias of currentStreak(), so the 'Schedule a rest day' coach tip ('5 training days in a row with no rest') fires off exactly the number the header is celebrating.

3. THE SCREEN WRITES TO THE DATABASE JUST BY BEING LOOKED AT. reload() calls coachRepo.refreshCoachTips() on every focus and every pull-to-refresh. That runs buildCoachContext() (roughly twenty further queries across sessions, nutrition, steps, weight trend, smoking, sleep, alcohol and cycle) and inserts new coach_tips rows. It is the single most expensive thing on Home and it is triggered by navigation, not by intent.

4. EVERYTHING IS SYNCHRONOUS AND UNGUARDED. reload() performs about fifteen blocking SQLite reads on the JS thread with no try/catch, no skeleton and no error boundary. Only WeatherCard (its local `safe()` helper) and EnergyBalanceStrip (a try/catch around energyBalanceFor) tolerate a throwing repository. onRefresh sets refreshing to true and false in the same synchronous tick, so the pull-to-refresh spinner never actually renders — the gesture works, the feedback does not.

5. THREE CARDS SELF-HIDE AND ONE SWAPS IDENTITY. DigestionCard returns null with no meals and no smokes; PostSessionCard returns null when no margin is still running; EnergyBalanceStrip returns null without a nutrition goal; the Coach Tips section vanishes with zero tips; Prayers and the Smoking tile are opt-in modules. And the second recovery tile is Cycle when the cycle module is on, Alcohol when it is not — the same slot, two unrelated features. A brand-new user sees roughly: greeting, an all-zero streak meter, an empty weather card, the rings, quick actions, self-care, the four macro tiles with 'of 0g' targets, a Sleep tile reading '—' and an Alcohol tile. Design the empty case first.

6. HOME DELIBERATELY USES THE CUT-DOWN VARIANTS. DigestionCard and PostSessionCard are both passed compact, which strips their only interactions: the Light/Normal/Hard intensity control (so the readiness answer on Home is always for 'moderate') and the tap-for-why expansion on each margin line. EnergyBalanceStrip is a different component from EnergyBalanceCard — Home never shows the training-load bar, the 'X / Y kcal to the line' row or the status message. If v3 wants those, they exist and are already wired; they are simply not on this screen.

7. STALE-BY-DESIGN DEPENDENCIES. The water ring's goal (waterAdj) is memoised on [goal, food], not on the weather reading — so fetching fresh weather inside WeatherCard does not move the water target until the next focus re-creates the food object. The smoke events memo is keyed on [smokingEnabled, smokingToday] purely so that logging a cigarette elsewhere forces a re-read. Neither is a bug today, but both are load-bearing accidents.

8. NUMBER FORMATTING IS INCONSISTENT. The big ring clamps 'kcal left' at zero (max(0, …)) so it never goes negative, while its own arc is unclamped and silently turns warning-orange past 100% — two different overflow languages in one control. Macros round to whole grams with a plain 'of Ng' sub-label and no progress indication at all; water and steps get rings; calories get a ring AND the four-cell strip below it. There are effectively three visual grammars for 'progress toward a target' stacked within 200 vertical pixels.

9. TWO SOURCES OF TRUTH FOR THE STEP GOAL. lib/pedometer.DAILY_STEP_GOAL = 8000 drives the ring; coachRepo declares its own DEFAULT_STEP_GOAL = 8000 for the sedentary-nudge rule. Neither is user-configurable anywhere.

10. SELF-CARE TAPS WRAP SILENTLY. Tapping a completed self-care circle does not do nothing and does not confirm — bumpSelfCare resets the count to 0. On 'Brush teeth' (target 3) the fourth tap wipes the day's three. There is no undo and no long-press.

11. COACH TIP CATEGORY COLOURS ARE PARTIAL. HomeScreen's local CATEGORY_COLOR map covers 11 of the 13 COACH_CATEGORIES; 'habits' and 'work' fall through to primary. No rule currently emits either, so it is latent rather than visible. Separately, tips are capped at 5 with no 'see all' route — a dismissed tip is gone from the UI but its ruleKey still suppresses that rule for the rest of the ISO week, so dismissing has a week-long silent consequence the user is never told about.

12. THE WEATHER CARD NEVER ASKS FOR PERMISSION. fetchLiveWeather calls Location.getForegroundPermissionsAsync() and returns null if not already granted — it never requests. So a user who has not granted location elsewhere gets a permanently empty weather card whose only hint is the small line inside the (collapsed) editor: 'Live needs location and a connection'. There is no denied-permission state, no retry affordance beyond the pencil, and no error copy for a failed fetch.

13. ROUTE FACTS. Home is TabParamList 'Home' with no params. Outbound navigations from this screen: SessionTypePicker (no params, modal), Walk { mode: 'walk' }, Main → Nutrition (twice — the strip and the 'Log' section action), Prayers, Sleep, Cycle, Alcohol, Smoking. Note the two Nutrition navigations use `navigation.navigate('Main', { screen: 'Nutrition' } as never)` — the `as never` cast is a workaround for the nested-navigator typing and appears verbatim in the source."

---

## 4. Health Tracking — Sleep & naps, Menstrual cycle, Health conditions, Hormones, Alcohol, Habits, Work hours, Body composition (+ the Self-care check-in strip that lives on Home)

Eight pushed detail screens plus one Home fragment, all local-first over expo-sqlite/drizzle with no network, no permissions and no async loading — every read is a synchronous drizzle `.get()/.all()` fired from `useFocusEffect`, so there are literally no loading or error states anywhere in this area. Three of the screens are loggers with real physiological engines behind them (Sleep + naps, Alcohol/Widmark BAC, Body composition), two are catalogue pickers with zero math (Conditions, Hormones), two are thin day-loggers (Work hours, Cycle), and Habits is a hybrid logger + "your own data" correlation view. Every screen opens with the same `PageHero` (44px tinted icon tile + h1 title + optional muted subtitle) because the native stack header is registered with `title: ''` — the hero IS the title. All eight are reached from ProfileScreen → "Health & Wellness" card as `LinkRow`s; Sleep, Cycle and Alcohol additionally have Home-screen tiles.

### Screens (9)

#### SleepScreen

**Route** `Sleep (no params — `Sleep: undefined` in RootStackParamList)`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/health/SleepScreen.tsx`  
**Reached from** ProfileScreen → 'Health & Wellness' card → LinkRow 'Sleep' (icon sleep.moon); Home screen 'Recovery' Row → left StatTile 'Sleep' (Pressable, shows `{lastNight}h` and `{avg7d}h avg` / 'Tap to log').

Log last night's sleep (either as a number of hours or as a bedtime→wake range) plus any daytime naps, and show how rested you actually are once naps are credited at what the nap model says they are worth. Also correlates your own sleep against your own training output.

**Layout, top to bottom**

- PageHero — icon 'sleep.moon' (MaterialCommunityIcons moon-waning-crescent), color theme.colors.mindbody #5FD0E0, title 'Sleep', NO subtitle.
- CARD 1 'Log last night'. Text h3 'How did you sleep?'.
-   SegmentedControl, accent mindbody, 2 options: value 'quick' label 'Quick hours', value 'range' label 'Bedtime → wake'. Default 'quick'.
-   Centered `display` (34px/800) number in mindbody: quick mode → `${hours}h`; range mode → minutesToHM(rangeMins) e.g. '7h 30m'. Under it a caption: assessment.label from assessNight() — 'Under-slept' / 'Well rested' / 'Oversleeping' — colored `success` when status==='optimal', `warning` otherwise. In range mode with unparsable times the caption instead reads 'Enter times as HH:MM'.
-   QUICK MODE: a centered wrapping row of 10 pill buttons, HOUR_OPTIONS = [4, 5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 10], labelled '4h','5h','6h','6.5h','7h','7.5h','8h','8.5h','9h','10h'. Selected = solid mindbody with white label; unselected = surfaceAlt with textMuted label. radius.md, padding 8v/12h.
-   RANGE MODE: two side-by-side Inputs — 'Bedtime' (placeholder '23:30') and 'Wake time' (placeholder '07:00'), keyboardType 'numbers-and-punctuation'. Free-text, no picker, no mask.
-   Quality block: label 'Quality' (textMuted), then a 5-across row of Pressables, each an Icon 'sleep.quality' (MCI 'sleep') size 22 over a 9px caption. Labels from SLEEP_QUALITY_LABELS = ['Terrible','Poor','Okay','Good','Excellent'] → stored as 1..5. Selected icon = mindbody, unselected = surfaceAlt. There is NO way to clear a quality once tapped.
-   Button 'Save last night', icon core.check, color mindbody, full width. Disabled only when mode==='range' && rangeMinutes(bedtime,wakeTime)==null.
- CARD 2 'Naps today'. Header Row: Icon 'sleep.bed' size 18 in info + h3 'Naps today'; right side, only when napMinutesToday > 0, a bodyStrong info-colored `{minutesToHM(napMinutesToday)} total`.
-   Advice caption (textMuted) = napAdvice(summary?.lastNight ?? null, new Date().getHours()) — one of exactly four strings: after 16:00 'Late for a nap — it will cost you tonight. A 10-minute lie-down at most, or push through to bedtime.'; night <6h 'Short night: a full ~90-minute cycle repays the most, or 20 minutes if that is all you have. Before 15:00.'; night <7h 'A little short: 20–25 minutes is the sweet spot — clear-headed on waking, no cost tonight.'; otherwise 'You slept enough: 10–20 minutes for alertness. Longer will just borrow from tonight.'
-   When summary && napCreditToday > 0, an info-colored caption: "Today's naps are worth about {minutesToHM(napCreditToday)} of night sleep — total rest {restToday}h." (restToday renders '—' when no night was logged today).
-   Nap-length chips, centered wrapping row, NAP_OPTIONS = [10, 15, 20, 30, 45, 60, 90] labelled '10m'…'90m'. Selected = solid theme.colors.info (#4F8CFF). Default selection 20.
-   Button 'Add {napMinutes}-min nap', icon core.add, variant 'secondary'.
-   Nap list (only when naps.length > 0), newest first (napsForDate orders by id DESC). Each row: Icon 'sleep.moon' size 14 textFaint, then `{minutesToHM(n.minutes)}` plus ` · {n.startTime}` when a start time exists, then a textFaint caption built live from napValue(): `{NAP_BAND_META[band].label} · {netMin>0 ? 'worth ~{netMin} min of night sleep' : 'no recovery credit at that hour'}` + optional ` · ~{inertiaMin} min groggy on waking` + optional ` · costs ~{nightCostMin} min tonight`. Right edge: Icon core.close size 16, hitSlop 8, deletes that nap.
- SUMMARY BLOCK (only when store.summary != null, i.e. after the first focus): one Row containing FOUR StatTiles side by side — (1) icon sleep.bed, label 'Nights (7d)', value `{avg7d}h` or '—', sub 'night sleep only', accent mindbody; (2) icon sleep.moon, label 'Rest (7d)', value `{avgRest7d}h` or '—', sub 'naps counted', accent info; (3) icon sleep.debt, label 'Sleep debt', value `{debt7d}h` (can be negative), sub 'vs 8h target', accent warning; (4) icon stats.progression, label 'Readiness', value `{round(performanceFactor*100)}%`, sub 'performance', accent success when ≥95 else warning.
- SectionHeader 'Last 7 Nights' + Card containing a BarChart of summary.restSeries — x label is date.slice(8) (day-of-month, 2 chars), y is TOTAL rest hours (night + nap credit), color mindbody, valueFormat prints the raw number above each bar when > 0. Caption under it: 'Total rest per day — night sleep with each day's nap credit added on top.'
- CORRELATION BLOCK (rendered only when goodSleepAvgSessionCal !== null OR poorSleepAvgSessionCal !== null): SectionHeader 'Sleep vs Your Training'; Card with caption 'Average session calories on the days after good vs poor sleep — from your own logs.'; then a row 'After ≥7h sleep' (icon sleep.quality, success) with `{n} kcal`; a Divider; and a row 'After <6h sleep' (icon sleep.debt, warning) with `{n} kcal`. Each row is independently conditional.
- Footer caption, centered, textFaint: 'Sleep is your #1 recovery lever — it drives strength, fat loss and mood more than almost anything else you track.'

**Interactions**

- SegmentedControl quick/range — swaps the hour chips for the two time Inputs and changes what the big display number shows.
- Tap any of the 10 hour chips → setHours (local state only until Save).
- Type into Bedtime / Wake time — parsed by rangeMinutes() on every keystroke; an unparsable value greys out Save and swaps the caption to 'Enter times as HH:MM'.
- Tap any of the 5 quality icons → sets quality 1..5. No deselect.
- 'Save last night' → store.log(hours, quality) in quick mode, store.logRange(bedtime, wakeTime, quality) in range mode; then recomputes the correlation immediately.
- Tap any of the 7 nap-length chips → setNapMinutes; the Add button's title changes with it.
- 'Add {n}-min nap' → store.addNap(n). No start time, no quality is ever passed from this screen.
- Tap the × on a nap row → store.removeNap(id), immediate, NO confirmation dialog.
- useFocusEffect on every focus: store.load() + sleepTrainingCorrelation(30).

**What it shows, and from where**

- Big number in range mode — minutesToHM(rangeMinutes(bedtime, wakeTime)) from src/lib/time.ts (wraps past midnight when end < start).
- 'Under-slept' / 'Well rested' / 'Oversleeping' — assessNight(effectiveHours) in src/lib/sleep.ts.
- napMinutesToday — napMinutesForDate(todayISO()) in sleepRepo (plain sum of nap_logs.minutes).
- Nap advice line — napAdvice() in src/lib/naps.ts.
- napCreditToday / restToday — sleepSummary() → dayRest() in src/lib/naps.ts.
- Per-nap band label, netMin, inertiaMin, nightCostMin — napValue() in src/lib/naps.ts, called inline in the row with ctx.nightHours = summary?.lastNight.
- 'Nights (7d)' — sleepSummary().avg7d → averageSleep() over logged nights only (unlogged nights are NOT counted as zero).
- 'Rest (7d)' — sleepSummary().avgRest7d → mean of dayRest().restHours across days that had a night logged.
- 'Sleep debt' — sleepSummary().debt7d → sleepDebt(restHours[], target 8).
- 'Readiness' % — sleepSummary().performanceFactor → sleepPerformanceFactor(avgRest ?? avg) × 100, rounded.
- 7-bar chart — sleepSummary().restSeries (7 entries from lastNDates(7)).
- 'After ≥7h sleep' / 'After <6h sleep' kcal — sleepTrainingCorrelation(30) in sleepRepo, averaging sessions.caloriesBurned grouped by the session's local start date.

**What it writes**

- logSleep({hours, quality, bedtime?, wakeTime?}) in sleepRepo → table `sleep_logs`. It DELETEs any existing row for the same (userId, date) first, so there is exactly one night per date and re-saving silently overwrites.
- logNap({minutes, startTime: null, quality: null}) in sleepRepo → table `nap_logs` (INSERT, many rows per day allowed).
- deleteNap(id) in sleepRepo → DELETE from `nap_logs`.

**Empty, loading and error states**

- Before the first focus effect resolves: hero + both logger cards render, but the summary tiles, the chart and the correlation block are all absent (summary is null).
- Empty naps: the nap list simply does not render; the '{x} total' badge and the nap-credit caption are hidden.
- No sleep ever logged: avg7d and avgRest7d render '—', debt shows '0h', Readiness shows '100%' (sleepPerformanceFactor(null) returns 1).
- Correlation with no qualifying days: the whole 'Sleep vs Your Training' section is hidden; if only one side qualifies only that one row shows.
- BarChart with zero-length data renders its own 'Not enough data yet' placeholder — but restSeries is always 7 entries, so that never fires here; instead you get seven 2px-tall bars.
- No loading spinner, no error state, no permissions — all reads are synchronous SQLite.

> Real defects/oddities: (1) `const [hours, setHours] = useState(lastNight ?? 8)` reads the store BEFORE load() has run, so it is always 8 on mount and never re-syncs to your actual last night. (2) The screen offers no way to enter a nap START TIME, and nothing else in the codebase calls logNap — so nap_logs.startTime is always null in practice, which means napValue always takes the `h == null` branches: timingFactor 0.95 and nightSleepCostMin = round(minutes × 0.1). The elaborate afternoon-dip / evening-cost timing model is therefore dead code from the UI's point of view. (3) nap_logs.quality (1..5) exists in the schema and in the store signature but no UI writes it. (4) sleepSummary().series (night-only 7-day series) is computed and returned but never rendered — the chart uses restSeries. (5) sleepTrainingCorrelation returns goodNights/poorNights which are never displayed. (6) Four StatTiles in one Row is extremely cramped on a phone — each is a full Card with 16px padding and an h2 value. (7) sleep_logs.notes exists but no UI writes it.

#### CycleScreen (CycleScreen → CycleSetup | CycleDashboard, plus an inline CycleCalendar)

**Route** `Cycle (no params — `Cycle: undefined`)`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/health/CycleScreen.tsx`  
**Reached from** ProfileScreen → 'Health & Wellness' → LinkRow 'Cycle tracking' (icon cycle.flower); Home screen 'Recovery' Row → right tile, but ONLY when cycle tracking is already enabled AND a cycle state exists (otherwise that slot shows the Alcohol tile instead).

Opt-in menstrual-cycle tracking: predicts the current cycle day, phase, next period and ovulation from a simple calendar model, gives phase-specific training and nutrition guidance, and lets you log a period start with symptom tags.

**Layout, top to bottom**

- ROUTER: `CycleScreen` calls load() on focus and renders <CycleDashboard/> when profile.enabled, else <CycleSetup/>.
- — SETUP VARIANT —
- PageHero — icon 'cycle.flower', color theme.colors.protein #FF6B9D, title 'Cycle tracking', subtitle (runs full width, >100 chars): 'Track your menstrual cycle to see how your hormones influence energy, strength and recovery — and time training and nutrition to work with your body, not against it.'
- Card with: Row of two Inputs — 'Cycle length' suffix 'days' default '28', and 'Period length' suffix 'days' default '5' (both numeric); then a full-width Input 'Last period start (YYYY-MM-DD)' pre-filled with todayISO().
- Button 'Enable cycle tracking', icon core.check, color protein.
- Centered textFaint caption: 'Educational guidance only — not medical or contraceptive advice. Stays on your device.'
- — DASHBOARD VARIANT —
- PageHero — icon 'cycle.flower', color = the CURRENT PHASE's color (menstrual #FF6B9D, follicular #4F8CFF, ovulation #33D9A6, luteal #B58CFF), title 'Cycle', right slot = caption 'Day {dayOfCycle} / {cycleLength}'.
- PHASE CARD, accented in the phase color: Row with h2 '{Menstrual|Follicular|Ovulation|Luteal} phase' in the phase color, and — only when state.inFertileWindow — an Icon 'cycle.ovulation' size 20 in theme.colors.accent at the right. Then a textMuted caption = the phase's `hormones` line. Divider. Then two icon+text rows: Icon 'nav.train' + the phase's `training` guidance, and Icon 'nav.nutrition' + the phase's `nutrition` guidance.
- Row of TWO StatTiles: (1) icon cycle.calendar, label 'Next period', value '{daysUntilNextPeriod}d', sub = nextPeriodDate.slice(5) i.e. 'MM-DD', accent protein; (2) icon cycle.ovulation, label 'Ovulation', value = ovulationDate.slice(5), sub 'predicted', accent theme.colors.accent.
- SectionHeader 'This Month' + Card containing CycleCalendar: a Monday-first month grid for the CURRENT calendar month only (no month navigation). 7 header letters 'M T W T F S S'; each day is a 32×32 circle. Fill = phase color at 20% alpha ('+33'), border = the phase color, EXCEPT today which gets a 2px theme.colors.text border. Classification per day re-runs computeCycle() for that date: period → theme.colors.protein, ovulation (exact date match) → theme.colors.warning, fertile window → theme.colors.accent, else transparent/no border. Under the grid a legend Row: 'Period' (in the current phase's color — NOT the calendar's protein), 'Fertile' (accent), 'Ovulation' (warning).
- SectionHeader 'Log Period Start' + Card: caption "Tag today's symptoms (optional), then log."; a wrapping Row of TEN small Chips from CYCLE_SYMPTOMS — 'cramps', 'headache', 'bloating', 'fatigue', 'mood swings', 'cravings', 'back pain', 'tender breasts', 'acne', 'insomnia' — active chips filled in the phase color; then Button 'Period started today', icon 'cycle.drop', color protein.
- HISTORY (only when periods.length > 0): SectionHeader 'History' + Card listing the 8 most recent period logs, each a Row of `{startDate}` (full ISO) on the left and, on the right, `{flow ?? ''}` plus, when symptoms exist, ` · {n} symptoms`. Dividers between rows.
- Button 'Turn off cycle tracking', variant 'ghost', color textMuted.
- — DEGENERATE VARIANT — if profile.enabled but state or profile is null (i.e. lastPeriodStart is null), the whole screen collapses to a bare Screen with an h2 'Set your last period date to see your cycle.' and a default-styled Button 'Log period start today'. No PageHero, no back-out.

**Interactions**

- Setup: three free-text inputs (cycle length, period length, last-period ISO date). No date picker, no validation — `parseInt(cycleLen,10) || 28` and `|| 5` are the only guards, and a malformed date string is stored as-is.
- 'Enable cycle tracking' → store.enable({avgCycleLength, avgPeriodLength, lastPeriodStart}) → upsertCycleProfile with enabled:true → screen flips to the dashboard.
- Tap any of the 10 symptom chips → toggles it in local state (multi-select).
- 'Period started today' → store.logStart(todayISO(), {symptoms}) → inserts a period_logs row, refreshes the profile's lastPeriodStart, runs refineCycleAverages(), then clears the chip selection. Flow is never set from this screen.
- 'Turn off cycle tracking' → store.disable() → upsertCycleProfile({enabled:false}) → screen flips back to Setup. No confirmation.
- The calendar is entirely non-interactive — no day is tappable, no month can be changed.
- History rows are non-interactive — you cannot edit or delete a period log from the UI.

**What it shows, and from where**

- dayOfCycle, phase, cycleLength, nextPeriodDate, daysUntilNextPeriod, ovulationDate, fertileWindow, inPeriod, inFertileWindow — computeCycle() in src/lib/cycle.ts, called via currentCycle() in cycleRepo using the stored profile.
- Phase title / hormones / training / nutrition copy and color — PHASE_GUIDANCE in src/lib/cycle.ts.
- Calendar day classification — computeCycle() re-run per cell inside CycleCalendar.classify() (≈28–31 model evaluations per render).
- History rows — listPeriods(24) in cycleRepo, ordered by startDate DESC, sliced to 8 in the screen. Symptom count parsed by a local safeSymptomCount() that try/catches JSON.parse and returns 0 on bad data.

**What it writes**

- upsertCycleProfile(patch) in cycleRepo → table `cycle_profiles` (single row per user; UPDATE if exists else INSERT). Writes enabled, avgCycleLength, avgPeriodLength, lastPeriodStart.
- logPeriodStart(startDate, {symptoms}) in cycleRepo → INSERT into `period_logs` (startDate, flow null, symptoms as a JSON string, notes null), then upsertCycleProfile({lastPeriodStart}).
- refineCycleAverages() in cycleRepo → recomputes avgCycleLength from the gaps between the last 6 period starts and UPDATEs `cycle_profiles`.

**Empty, loading and error states**

- Not enabled (default) → CycleSetup. This is the state every user starts in; there is no gender gate — the screen is offered to everyone from Profile.
- Enabled but lastPeriodStart null → the bare two-element fallback screen described above.
- periods empty → the History section is hidden entirely.
- No loading/error/permission states.

> The cycle model is purely calendar-arithmetic, no biometrics: cycleLength clamped 21–40, periodLength clamped 2–10, ovulation fixed at cycleLength − 14 days (constant luteal phase), fertile window = ovulation −5 to +1 days. refineCycleAverages only accepts gaps in 21–40 days and needs ≥2 logged periods. Oddities: the calendar legend's 'Period' swatch uses the CURRENT phase color while the calendar itself always paints periods in theme.colors.protein, so they disagree in 3 of 4 phases. period_logs supports flow ('light'|'medium'|'heavy'), endDate and notes, and cycleStore exposes endPeriod(), but NO UI writes any of them — flow renders as an empty string in history. There is no way to correct a mistaken period-start log.

#### ConditionsScreen

**Route** `Conditions (no params — `Conditions: undefined`)`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/health/ConditionsScreen.tsx`  
**Reached from** ProfileScreen → 'Health & Wellness' → LinkRow 'Health conditions' (icon health.medical). Only entry point.

A pure multi-select over a fixed catalogue of 20 chronic conditions. Selecting one stores a row so that coach tips and exported PDF reports can carry the right considerations. Nothing is computed and nothing is scored.

**Layout, top to bottom**

- PageHero — icon 'health.medical' (MCI medical-bag), color theme.colors.danger #FF5D5D, title 'Health conditions', subtitle (full width): 'Tell FitCoach about any chronic conditions so your coach tips and exported reports include the right considerations. This is not medical advice — always follow your clinician.'
- SELECTED BLOCK (only when at least one is active): SectionHeader 'Your conditions ({n})', then one danger-accented Card per active condition containing the stored label in bodyStrong, the catalogue's `consideration` sentence as a textMuted caption beneath it, and an Icon core.close (size 18, hitSlop 8) at the top-right that removes it.
- CATALOGUE: one section per category, in first-appearance order from CONDITION_CATALOGUE (NOT the order of CONDITION_CATEGORY_LABEL): Metabolic, Cardiovascular, Respiratory, Hormonal, Musculoskeletal, Digestive, Other, Mental health. Each is a SectionHeader followed by a wrapping row of pill toggles (radius.pill, 9v/12h padding, 1px border). ON = solid danger fill, white text, icon core.check. OFF = surfaceAlt fill, border, textMuted, icon core.add.
- The 20 pills by category — Metabolic: 'Type 1 Diabetes', 'Type 2 Diabetes'. Cardiovascular: 'Hypertension', 'High Cholesterol', 'Heart Disease'. Respiratory: 'Asthma', 'COPD'. Hormonal: 'Hypothyroidism', 'Hyperthyroidism', 'PCOS'. Musculoskeletal: 'Arthritis / Joint issues', 'Osteoporosis', 'Chronic Lower-Back Pain'. Digestive: 'Celiac Disease', 'IBS'. Other: 'Chronic Kidney Disease', 'Anemia', 'Pregnancy'. Mental health: 'Depression', 'Anxiety'.

**Interactions**

- Tap a catalogue pill → toggles: add(key) if off, remove(key) if on. Immediate write, no confirmation.
- Tap the × on a selected card → remove(key).
- Every active condition appears TWICE on screen at once: once as its own card at the top and once as a filled pill in its category. Both are live toggles for the same record.
- useFocusEffect → load().

**What it shows, and from where**

- The active list — listConditions() in conditionsRepo (WHERE active = true).
- Each card's guidance sentence — CONDITION_CATALOGUE[].consideration in src/lib/conditions.ts, looked up by conditionKey.
- Category headings — CONDITION_CATEGORY_LABEL in src/lib/conditions.ts.

**What it writes**

- addCondition(key) in conditionsRepo → INSERT into `health_conditions` (conditionKey, label and category copied from the catalogue, notes null, active true). It early-returns if the key is already active, so it is idempotent.
- removeCondition(key) in conditionsRepo → hard DELETE from `health_conditions` for that key (it does NOT set active=false, despite the column existing).

**Empty, loading and error states**

- Nothing selected → the 'Your conditions' block is absent and only the eight category sections show.
- No empty state, no loading, no error, no permissions.

> Zero computation on this screen — it is a bag of flags. `health_conditions.notes` exists and conditionsStore.add() accepts a notes argument, but no UI ever supplies one. The `active` boolean is written as true and only ever read by listConditions/hasCondition; removal deletes the row outright, so there is no history of a condition you once had. Category render order is driven by catalogue insertion order, which is why 'Hormonal' comes before 'Musculoskeletal' here but after it in CONDITION_CATEGORY_LABEL.

#### HormonesScreen

**Route** `Hormones (no params — `Hormones: undefined`)`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/health/HormonesScreen.tsx`  
**Reached from** ProfileScreen → 'Health & Wellness' → LinkRow 'Hormones' (icon hormone.gland). Only entry point.

An educational endocrine reference (10 hormones) with an expandable card each — role, what raises/lowers it, signs of low/high, and the single best lifestyle lever — plus an optional three-state flag per hormone so reports stay relevant. FitCoach explicitly cannot measure anything here.

**Layout, top to bottom**

- PageHero — icon 'hormone.gland' (MCI water-percent), color theme.colors.accent #33D9A6, title 'Hormones', subtitle (full width): "The endocrine signals that shape your training, recovery, appetite and mood — what raises or lowers each, and the signs of running low or high. Flag any you're low/high in or monitoring so your reports stay relevant."
- DISCLAIMER Card, warning-accented, with an Icon core.info and the copy: "Educational only — FitCoach can't measure your hormones. This is not a diagnosis. For symptoms or before acting on any of this, get lab work and speak to a clinician."
- FLAGS BLOCK (only when flags.length > 0): SectionHeader 'Your flags ({n})', then one Card per flag accented by status color (low → warning #FFB454, high → danger #FF5D5D, monitoring → info #4F8CFF). Each card: the stored label in bodyStrong, the status label as a caption directly beneath it ('Running low' / 'Running high' / 'Monitoring'), THEN the same status label again as a Badge, then an Icon core.close to clear the flag; below that a caption 'Lever: {def.lever}'.
- CATALOGUE: one section per category in first-appearance order — 'Anabolic & recovery' [Testosterone, Growth Hormone (GH)], 'Reproductive' [Estrogen], 'Stress' [Cortisol], 'Metabolic' [Insulin, Vitamin D (hormone)], 'Thyroid' [Thyroid (T3 / T4 / TSH)], 'Sleep & circadian' [Melatonin], 'Appetite' [Leptin (satiety), Ghrelin (hunger)].
- Each hormone is a Card (accented in its status color when flagged). Collapsed header row: a category Icon `hormone.{category}` size 20 in accent (anabolic → arm-flex, metabolic → fire, stress → head-cog-outline, thyroid → butterfly-outline, sleep → moon, appetite → stomach, reproductive → gender-male-female), the hormone label as h3, the status Badge when flagged, and a chevron Icon (core.forward collapsed / core.back expanded). Under the header, always visible, the one-line `role` as a textMuted caption.
- EXPANDED (one at a time — `expanded` holds a single key): Divider, then four SignalBlocks, each a small icon+colored label followed by bulleted '• ' captions indented 20px — 'Raised / supported by' (hormone.up, success), 'Lowered / disrupted by' (hormone.down, warning), 'Signs it may be low' (core.info, warning), 'Signs it may be high' (core.info, danger). A block renders nothing if its array is empty. Then a nested surfaceAlt Card: label 'Best lever' in accent + the `lever` sentence. Then label 'Flag this hormone' and a Row of THREE equal buttons in STATUS_ORDER = ['low','high','monitoring'] labelled 'Running low' / 'Running high' / 'Monitoring', filled in the status color when active. When a flag exists, a centered 'Clear flag' textFaint tap target below.
- Footer caption, centered: 'Sleep, training, nutrition and stress management move nearly all of these at once — the fundamentals FitCoach already tracks are your biggest hormonal levers.'

**Interactions**

- Tap a hormone card header → expands it and collapses whatever was open (single-open accordion).
- Tap one of the three status buttons → set(key, status). Tapping the already-active status re-writes the same value (no toggle-off).
- 'Clear flag' or the × on a flag card → remove(key).
- A flagged hormone appears twice: once in 'Your flags' at the top and once in its category section.
- useFocusEffect → load().

**What it shows, and from where**

- The flags list — listHormoneFlags() in hormonesRepo (WHERE active = true).
- All reference content — HORMONE_CATALOGUE in src/lib/hormones.ts: 10 entries, each with role, raisedBy[], loweredBy[], lowSigns[], highSigns[], lever.
- Status labels — HORMONE_STATUS_LABEL = {low:'Running low', high:'Running high', monitoring:'Monitoring'}.
- Category headings — HORMONE_CATEGORY_LABEL.

**What it writes**

- setHormoneFlag(key, status, notes?) in hormonesRepo → table `hormone_flags`. UPDATEs status (and preserves existing notes) when a row exists, otherwise INSERTs with the catalogue label and active true.
- removeHormoneFlag(key) in hormonesRepo → hard DELETE from `hormone_flags`.

**Empty, loading and error states**

- No flags → the 'Your flags' block is hidden; the disclaimer and all 10 cards still render.
- All cards collapsed on entry (`expanded` starts null).
- No loading, error or permission states.

> The flag card prints the status label twice in a row — once as a caption under the name and once as a Badge immediately to its right. That is a genuine duplication, not an intentional pattern. `hormone_flags.notes` is supported by the repo and the store signature but nothing in the UI writes it. The `active` column is written true and never flipped — removal deletes the row. This is the longest scrolling screen in the area by far: 10 cards + a flags block + a disclaimer, with each expanded card adding up to ~25 bullet lines.

#### AlcoholScreen

**Route** `Alcohol (no params — `Alcohol: undefined`)`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/health/AlcoholScreen.tsx`  
**Reached from** ProfileScreen → 'Health & Wellness' → LinkRow 'Alcohol' (icon alcohol.beer); Home screen 'Recovery' Row → right tile ('Alcohol' / value 'Log' / sub 'tap to track'), shown only when cycle tracking is NOT enabled.

Log drinks by type/volume/ABV, see the pure-alcohol grams, standard drinks and calories a drink contains before you save it, then see today's total with an estimated peak BAC (Widmark) and the week against a low-risk guideline.

**Layout, top to bottom**

- PageHero — icon 'alcohol.beer', color theme.colors.warning #FFB454, title 'Alcohol', NO subtitle.
- LOGGER Card, h3 'Log a drink'.
-   A wrapping Row of FIVE type buttons (flexGrow 1 each), each a stacked icon+9px-caption tile: Beer (alcohol.beer), Wine (alcohol.wine), Spirit / Liqueur (alcohol.spirit), Cocktail (alcohol.cocktail), Other (alcohol.other). Selected = solid warning with white glyph and label. Default 'beer'.
-   Row of two Inputs: 'Volume' suffix 'ml', and 'ABV ({min}–{max}%)' suffix '%' — the label's range comes from the selected preset's abvRange, so it literally reads 'ABV (3–9%)' for beer, '(9–25%)' wine, '(30–60%)' spirit, '(5–30%)' cocktail, '(0–60%)' other. Both numeric. Selecting a type OVERWRITES both fields with that preset's defaults.
-   A live preview Row of three centered Mini stats (bodyStrong value over a textFaint label): 'Alcohol' `{grams}g`, 'Std drinks' `{n}`, 'Calories' `{kcal}` — recomputed on every keystroke via useMemo(computeDrink).
-   Button 'Add drink', icon core.add, color warning.
- IMPACT BLOCK (only when store.impact != null, i.e. after first focus): Row of THREE StatTiles — (1) icon alcohol.other, label 'Today', value '{todayGrams}g', sub '{todayDrinks} drinks', accent warning; (2) icon nutrition.calories, label 'Alcohol kcal', value '{todayCalories}', sub 'today', accent theme.colors.calories #FF7A59; (3) icon alcohol.bac, label 'Est. peak BAC', value '{bac.toFixed(3)}%', sub = bacLabel(bac) i.e. 'None'|'Minimal'|'Light'|'Impaired'|'Over legal limit'|'Heavy', accent danger when BAC ≥ 0.05 else textMuted.
- BAC Card (only when estimatedPeakBAC > 0), info-accented, caption: 'Estimated peak BAC ≈ {bac}% (Widmark). Roughly {hoursToSober}h to return to zero. Estimate only — never use to decide if you're fit to drive.'
- SectionHeader 'This Week' + Card: a Row with bodyStrong '{weekGrams}g · {weekDrinks} std drinks' on the left and a Badge on the right that reads either 'Over guideline' (danger) or '{dryDays7d} dry days' (success); a ProgressBar of weekGrams / 100 (turns warning-colored automatically when the value exceeds 1, and is clamped to full width); and a textFaint caption: 'Low-risk guideline ≈ 100g/week · {weekCalories} kcal from alcohol this week. Alcohol suppresses muscle protein synthesis and deep sleep, blunting recovery.'
- Card with a 7-day BarChart of grams per day (label = day-of-month, color warning, values rounded).
- TODAY'S DRINKS Card (only when today.entries.length > 0): label "Today's drinks" then one row per entry, newest first (ordered by createdAt DESC), reading '{preset label} · {volume}ml @ {abv}% · {alcoholGrams}g' with the type icon, dividers between, and an Icon core.close size 14 to delete.

**Interactions**

- Tap one of the five type tiles → sets the type AND resets Volume and ABV to that preset's defaults (beer 330ml/5%, wine 150ml/12%, spirit 45ml/45%, cocktail 200ml/12%, other 200ml/10%). Any edits you had made are lost.
- Type in Volume or ABV → the three preview numbers update immediately. Values outside abvRange are accepted; the range is label text only, not validation.
- 'Add drink' → store.add(type, volume, abv, presetLabel). parseFloat(...) || 0, so a blank field logs a 0-gram drink rather than being rejected.
- Tap the × on a drink row → store.remove(id), immediate, no confirmation.
- useFocusEffect → load().

**What it shows, and from where**

- Preview grams / std drinks / calories — computeDrink() in src/lib/alcohol.ts.
- Today totals — alcoholDay(todayISO()) in alcoholRepo (sums the stored alcoholGrams / standardDrinks / calories columns).
- Est. peak BAC — estimateBAC() in src/lib/alcohol.ts via alcoholImpact(); weight comes from latestWeight()?.weightKg with a hard-coded 75kg fallback, sex from getUser()?.sex defaulting to 'male'.
- Hours to sober — hoursToSober(peakBac) = peakBac / 0.015.
- BAC word — bacLabel().
- Week grams / calories / dry days / 7-day series — alcoholImpact() in alcoholRepo.
- Weekly limit — WEEKLY_LOWRISK_G = 100 in src/lib/alcohol.ts.

**What it writes**

- logDrink({type, label, volumeMl, abvPct}) in alcoholRepo → INSERT into `alcohol_entries`. It calls computeDrink() itself and STORES the derived alcoholGrams, standardDrinks and calories alongside the raw volume/ABV.
- deleteDrink(id) in alcoholRepo → DELETE from `alcohol_entries`.

**Empty, loading and error states**

- Before the first load: only the hero and the logger card render (impact and today are null).
- No drinks today: the three StatTiles still render with 0g / 0 kcal / 0.000%; the BAC card is hidden (BAC is 0); the 'Today's drinks' card is hidden.
- Over the guideline: the badge flips to 'Over guideline' in danger and the ProgressBar fills and recolors.
- No loading, error or permission states.

> Model constants: ethanol density 0.789 g/ml, 7 kcal/g ethanol, WHO standard drink 10 g (US 14 g is computed but never shown), Widmark r = 0.68 male / 0.55 female, elimination β = 0.015 %/hour, low-risk 100 g/week. Non-alcohol calories come from a per-type carb density: beer 0.036 g/ml, wine 0.026, spirit 0.0, cocktail 0.09, other 0.03, at 4 kcal/g. Notable: the BAC treats the whole day's intake as one instantaneous dose with hoursElapsed = 0 — there is no drink timestamp in the UI, so it is a strict worst case; `alcoholRecoveryPenaltyPct()` (up to 25% MPS suppression) is exported from lib/alcohol but is NOT used on this screen. `impact.weekDrinks` is recomputed as weekGrams/10 rather than summing the stored standardDrinks, so it can disagree slightly with the per-entry numbers. alcohol_entries.label is written with the preset label but never displayed (the row re-reads the preset).

#### HabitsScreen (+ inline ActiveHabitCard)

**Route** `Habits (no params — `Habits: undefined`)`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/health/HabitsScreen.tsx`  
**Reached from** ProfileScreen → 'Health & Wellness' → LinkRow 'Habits' (icon habits.generic). Only entry point.

Opt-in tracking of five 'habits you want to understand or change'. Each active habit gets a logger, a daily cap, time-cost projections, free-day streaks, a 21-day bar chart, a with/without correlation against your OWN sleep and training, and a verbatim honest statement of what the evidence actually supports.

**Layout, top to bottom**

- PageHero — icon 'habits.generic' (MCI chart-timeline-variant), color theme.colors.mindbody, title 'Habits', subtitle (full width): 'Track habits you want to understand or change. FitCoach shows the honest impact — the time it costs and how it maps onto your own sleep and training — without judgment.'
- ONE ActiveHabitCard PER ENABLED HABIT (accented in the habit's own color), containing top to bottom:
-   Header Row: the habit icon size 22 in its color, the stored label as h3, and — only when freeStreak > 0 — a success Badge '{n}-day free'.
-   LOGGER, which differs by kind. Duration habits (Doom-scrolling #7C6CFF, Procrastination #9AA6B2): an Input 'Minutes' defaulting to '15' beside a small 'Log' Button in the habit color. Count habits (Masturbation #5FD0E0, Mindless snacking #FF7A59, Nail biting #FFB454): a Button '+1 {unit}' (flex 2) beside a secondary 'Undo' Button (flex 1). Count habits have Undo; duration habits do NOT.
-   TODAY vs CAP (only when dailyTarget != null): a Row 'Today' / '{todayMinutes} min | {todayCount}× / {dailyTarget} min|× cap' (the right side turns danger when over) plus a ProgressBar in the habit color, or danger when over.
-   Row of THREE StatTiles: (1) icon habits.time, label 'This week', value = hours with 1 decimal when weekMinutes ≥ 60 else '{n}m', sub = '{weekCount}×' for count habits and empty for duration, accent = habit color; (2) icon habits.free, label 'Free days', value '{freeDays7d}/7', sub 'best {bestFreeStreak}d', accent success; (3) icon smoking.life (MCI timer-sand), label 'Per year', value '{yearHoursProjected}h', sub 'at this rate', accent warning.
-   A textFaint line 'That projected time ≈ {equivalents}.' where equivalents is up to three ' · '-joined phrases from timeEquivalents(): '{n} one-hour training sessions' (only when ≥5), '{n} book(s) read' (yearHours/8, only when ≥1), '{n} full days' (yearHours/24 to 1 dp, only when ≥0.5).
-   LATE-NIGHT FLAG (only when lateNightShare > 0.3): a moon icon plus '{pct}% of these happen late at night — the most likely way this is costing you sleep.'
-   CORRELATION BLOCK (only when a correlation exists and at least one 'with' average is non-null): a Divider, label 'Your data: days with vs without', then an 'Avg sleep' row reading '{a}h with · {b}h without' and an 'Avg session kcal' row reading '{a} with · {b} without' (each row requires BOTH sides to be non-null), then a textFaint 'Observational — over {windowDays} days ({daysWithHabit} with, {daysWithout} without).'
-   A 21-day BarChart in the habit color (x = day-of-month, y = minutes for duration habits / occurrence count for count habits).
-   A Pressable info line that toggles between 'What does the evidence actually say?' and 'Hide'; expanded, it prints the habit's `evidence` paragraph verbatim (these are long — the masturbation entry is ~90 words and explicitly says the research does NOT support the popular claims).
-   A centered textFaint 'Stop tracking this habit'.
- ADD BLOCK (only when there are un-enabled habits left): SectionHeader 'Track a new habit', then one tappable Card per available habit showing its icon, label, blurb and a core.add chevron. The five blurbs: Doom-scrolling 'Passive, compulsive scrolling — especially the late-night kind.'; Masturbation 'Private and optional. Track it only if YOU feel it is getting in the way.'; Mindless snacking 'Eating without hunger — the calories that silently break a deficit.'; Nail biting 'A common stress-driven body-focused habit.'; Procrastination 'Time lost to avoidance when you meant to be working.'
- Footer caption, centered: 'Private and on-device. Streaks are encouragement — a slip just restarts the counter, no shame attached.'

**Interactions**

- Tap an 'available' card → enable(key), which writes a profile seeded from the catalogue defaults and immediately moves the habit to the top of the screen as a full card.
- '+1 {unit}' → add(key, {}) → logs quantity 1, minutes 0.
- 'Log' (duration) → add(key, {minutes: parseFloat(input) || 0}).
- 'Undo' (count only) → undo(key) → deletes the most recent entry for that habit TODAY only (nothing to undo on a later day).
- Tap 'What does the evidence actually say?' → expands the evidence paragraph inside that card.
- 'Stop tracking this habit' → disable(key) → sets enabled false; the card disappears and the habit reappears in 'Track a new habit'. No confirmation. Entries are kept.
- useFocusEffect → load() (reloads profiles and impacts).

**What it shows, and from where**

- Every tile figure — habitImpact(key) in habitsRepo: todayMinutes, weekMinutes, todayCount, weekCount, avgPerDay, freeDays7d, freeStreak, bestFreeStreak, lateNightShare, dailyTarget, overTarget.
- 'Per year' hours — projectedYearHours(weekMinutes) = round(weekMinutes × 52 / 60) in src/lib/habits.ts.
- Time equivalents — timeEquivalents(yearHours) in src/lib/habits.ts.
- With/without averages — habitCorrelation(key, 30) in habitsRepo, joining habit_entries dates against sleep_logs.hours and against sessions.caloriesBurned bucketed by local start date.
- 21-day chart — habitDailySeries(key, 21) in habitsRepo.
- Labels, colors, icons, units, blurbs and the evidence paragraphs — HABIT_CATALOGUE in src/lib/habits.ts.

**What it writes**

- enableHabit(key, patch) in habitsRepo → INSERT/UPDATE `habit_profiles` with label, kind, enabled true, dailyTarget, baselinePerDay (always null from the UI) and minutesPerOccurrence from the catalogue.
- disableHabit(key) → UPDATE `habit_profiles` SET enabled = false (soft; the row and all entries survive).
- logHabit(key, {quantity?, minutes?}) → INSERT into `habit_entries` with quantity defaulting to 1, minutes defaulting to 0, trigger null, and lateNight computed at write time as `hour >= 23 || hour < 5`.
- undoLastHabit(key) → DELETE the newest `habit_entries` row for that key with date = today.

**Empty, loading and error states**

- No habits enabled (the default): the screen is the hero, the 'Track a new habit' list of all five, and the footer. There is no dedicated empty-state illustration.
- All five enabled: the 'Track a new habit' section disappears entirely.
- A habit with no entries yet: the free-streak badge is hidden (freeStreak stays 0 while anyHistory is empty), the correlation block is hidden, and the BarChart renders 21 flat 2px bars.
- Nail biting has no defaultDailyTarget, so its 'Today vs cap' row and ProgressBar never render.
- No loading, error or permission states.

> Two real defects: (1) `const [correlation] = useState(() => habitCorrelation(...))` and `const [series] = useState(() => habitDailySeries(...))` are lazy initializers with no refresh — the correlation numbers and the 21-day chart are captured once when the card first mounts and do NOT update when you log, only when the screen is remounted. (2) The count-habit button label is built as `+1 ${def.unit}` where unit is the plural noun, so it literally reads '+1 times' for three of the five habits. Also: `habit_entries.trigger` and HABIT_TRIGGERS (stress, boredom, loneliness, tired, late night, habit, celebration) exist in the model and the store signature but there is no UI to pick one; `habit_profiles.baselinePerDay` is never written; `minutesFor()` and `avgPerDay` are computed but never displayed. Default caps: doomscrolling 30 min/day, procrastination 30 min/day, masturbation 1×/day, junk snacking 1×/day, nail biting none. Minutes-per-occurrence for count habits: masturbation 15, snacking 5, nail biting 1.

#### WorkScreen

**Route** `Work (no params — `Work: undefined`)`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/health/WorkScreen.tsx`  
**Reached from** ProfileScreen → 'Health & Wellness' → LinkRow 'Work hours' (icon work.briefcase). Only entry point.

Log one work day as a start→end time range minus a break, with a subjective focus rating, and see the week's hours next to your training. The smallest screen in the area.

**Layout, top to bottom**

- PageHero — icon 'work.briefcase', color theme.colors.info #4F8CFF, title 'Work hours', subtitle (full width): 'Log your work day as a time range. Long hours quietly compete with sleep and recovery — seeing them next to your training makes the trade-offs visible.'
- LOGGER Card: a centered `display` figure in info showing minutesToHM(worked) or '—', with the caption 'worked today' under it.
-   A three-field Row: Input 'Start' (placeholder 09:00, flex 1), Input 'End' (placeholder 17:30, flex 1), Input 'Break' suffix 'min' (fixed width 90). Start/End are numbers-and-punctuation free text; Break is numeric.
-   Focus block: label 'Focus quality', then a 5-across row of Pressables, each an Icon 'work.focus' (MCI brain) size 20 over an 8px caption. FOCUS_LABELS = ['Scattered','Low','Okay','Focused','Deep work'] → stored 1..5. Selected = info, unselected = surfaceAlt. No deselect.
-   Button 'Save work day', icon core.check, color info; disabled when the start/end range is unparsable.
- SUMMARY (only when store.summary != null): a Row of THREE StatTiles — (1) icon work.clock, label 'Today', value minutesToHM(todayMinutes), accent info, no sub; (2) icon core.calendar, label 'This week', value '{hours to 1dp}h', sub '{weekDaysWorked} days', accent primary; (3) icon stats.progression, label 'Avg day', value minutesToHM(avgMinutesPerWorkday), accent theme.colors.accent.
- SectionHeader 'Last 7 Days' + Card with a BarChart of hours per day (minutes converted with `Math.round(d.minutes / 6) / 10`, label = day-of-month, color info, valueFormat '{v}h').
- A conditional centered textFaint line, shown only when avgMinutesPerWorkday > 540 (9 hours): "You're averaging over 9h/day. Guard your sleep and training time — that's where long work weeks usually take their toll."

**Interactions**

- Edit Start / End / Break → the big 'worked today' figure recalculates live as max(0, rangeMinutes(start,end) − break). The range wraps past midnight, so a night shift 22:00→06:00 correctly reads 8h.
- Tap one of the 5 focus icons → sets quality 1..5.
- 'Save work day' → store.log({startTime, endTime, breakMinutes, quality}).
- useFocusEffect → load().

**What it shows, and from where**

- The live 'worked today' figure — rangeMinutes() and minutesToHM() from src/lib/time.ts, computed in the component (not the repo).
- Today / week / days worked / average — workSummary() in workRepo.
- 7-day chart — workSummary().series over lastNDates(7).

**What it writes**

- logWork({date?, startTime, endTime, breakMinutes, quality}) in workRepo → table `work_logs`. It recomputes minutes from the range itself, then DELETEs any existing row for that (userId, date) and INSERTs — one record per day, re-saving overwrites.

**Empty, loading and error states**

- Before the first load: hero + logger only, with the defaults 09:00 / 17:30 / 60 min showing '7h 30m'.
- No work logged: the summary tiles show 0m / 0h / 0m ('This week' sub reads '0 days') and the chart is seven flat bars.
- No loading, error or permission states.

> Real defect: all four form fields are initialised from `today?.…` in useState — but `today` is null on mount because load() runs in useFocusEffect afterwards, so the form ALWAYS opens at 09:00 / 17:30 / 60 / no-quality and never reflects the day you already saved. You cannot see or edit today's actual saved values without re-typing them. `work_logs.notes` exists but is never written. There is no history list and no way to delete a day (deleteWork exists in the repo but is unused). `avgWorkHours()` in workRepo is not used by this screen.

#### BodyScreen

**Route** `Body (no params — `Body: undefined`)`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/profile/BodyScreen.tsx`  
**Reached from** ProfileScreen → 'Health & Wellness' → LinkRow 'Body composition' (icon stats.bodyFat). Only entry point.

The measurement screen: you type in weight, whatever your bio-impedance scale reported and whatever you taped, and the engine derives everything else live. Saving writes a weigh-in and recalculates your calorie and macro targets from it. Also where the training goal and rate of change are set.

**Layout, top to bottom**

- PageHero — icon 'stats.bodyFat', color theme.colors.info, title 'Body composition', subtitle (full width): 'Enter what you measure — everything else is calculated. Every save is kept in your history and your calorie & macro targets are recalculated from it.'
- SectionHeader 'You enter · weight' + Card with a single Input 'Weight' suffix 'kg', numeric. This is the ONLY required field.
- Collapsible header (Pressable Row with a chevron) 'You enter · scale readings'. Expanded → a Card with the caption 'Optional — fill in whatever your scale reports. Blank fields are left out of the calculations rather than guessed.' and NINE Inputs laid out two per Row: 'Body fat' %, 'Body water' %, 'Muscle mass' kg, 'Skeletal muscle' kg, 'Bone mass' kg, 'Protein' %, 'Visceral fat' rating, 'Retained water' kg, 'Metabolism (BMR)' kcal.
- Collapsible header 'You enter · measurements (cm)'. Expanded → a Card with FOUR labelled groups, each two Inputs per Row, all suffix 'cm': Upper body — Neck, Shoulders, Chest. Torso — Upper abdomen, Waist, Lower abdomen, Hips. Arms — Upper arm (L), Upper arm (R), Forearm (L), Forearm (R). Legs — Thigh (L), Thigh (R), Calf (L), Calf (R). Fifteen fields total, from MEASUREMENT_FIELDS.
- Button 'Save measurement', icon core.check, disabled until a parseable weight is present.
- CALCULATED BLOCK (only when a weight is typed): SectionHeader 'We calculate', then two Rows of two StatTiles — 'BMI' (value + category sub: Underweight/Normal/Overweight/Obese I/II/III), 'Fat weight' ({kg} + ACE category sub: Essential/Athletic/Fitness/Average/Above average), 'Lean mass' ({kg}), 'FFMI' (normalized value + category sub: Lean/Average/Fit/Muscular/Very muscular/Exceptional).
- Then a Card of ELEVEN CalcRows (label + optional smaller hint on the left, value or '—' on the right): 'Muscle mass' → '{kg} · {pct}%'; 'Skeletal muscle' → '{kg} · {pct}%'; 'Body water' → '{kg} · {pct}%' with hint = waterStatus ('low'|'healthy'|'high'); 'Retained water' → '{kg}'; 'Bone mass' → '{kg} · {pct}%'; 'Protein' → '{kg} · {pct}%'; 'Visceral fat' → rating with hint = visceralStatus ('healthy'|'excess'|'high'); 'Obesity degree' → signed '%' with hint 'vs a BMI-22 ideal weight'; 'Waist-to-hip'; 'Waist-to-height' with hint 'under 0.5 is the usual target'; 'BMR (metabolism)' → '{kcal} kcal' with hint 'Katch-McArdle, from your lean mass' or 'your scale reading'.
- A textFaint note: 'A "—" just means the measurement it needs isn't entered yet — nothing here is estimated or invented.'
- GOAL BLOCK: SectionHeader 'Goal & targets' + Card containing a scrollable SegmentedControl of the five goals in GOAL_ORDER — 'Lose fat', 'Maintain', 'Build muscle', 'Build muscle & burn fat', 'Athletic performance' — followed by that goal's GOAL_NOTES paragraph; an extra textFaint line when 'recomp' is picked ('Train → Strength → Programs has a matching "Recomposition" plan built for these numbers.'); a second SegmentedControl 'Slow / Moderate / Aggressive'; an Input 'Target weight (optional)' suffix 'kg'; a caption 'Current: {kcal} kcal · P {n}g · C {n}g · F {n}g' when a goal record exists; a Button 'Apply goal & recalculate' (icon core.settings, color accent); and a closing textFaint paragraph about Katch-McArdle and lean-mass-anchored protein.
- GOAL HISTORY Card (only when non-empty): label 'Goal history' then up to 10 Rows of '{date} · {goal label}' and '{kcal} kcal · P{g}'.
- MEASUREMENT HISTORY (only when non-empty): SectionHeader 'Measurement history' + a Card of up to 12 entries, newest first, each a Row with '{weight} kg' in bodyStrong over a textFaint '{date}' + optional ' · {n}% fat' + optional ' · waist {n}cm', and a primary-colored Badge '{n}kg muscle' on the right when muscle mass was recorded.

**Interactions**

- Tap either 'You enter · …' header to expand/collapse that field group (both start collapsed, independently).
- Type in any of the 25 inputs — every derived figure in the 'We calculate' block updates live via useMemo, before saving.
- 'Save measurement' → validates weight (Alert 'Weight required' / 'Enter at least your weight to save a measurement.' if missing), then logWeight(weight, extra) which writes the weigh-in AND recalculates nutrition targets, then reloads and shows Alert 'Saved ✓' / 'Measurement recorded — your targets were recalculated from it.'
- Goal SegmentedControl (scrollable, 5 options) and rate SegmentedControl (3 options) — local state only until applied.
- 'Apply goal & recalculate' → updateProfile({goal, rateOfChange}) then recalcTargets({record:true, targetWeightKg, notes:'Goal updated'}), then an Alert showing either '{goal label}\n{kcal} kcal · P {n}g · C {n}g · F {n}g' or 'Log a weigh-in and set your height first.'
- useFocusEffect → reload(): loads the latest weigh-in into the form, the last 30 weigh-ins reversed for history, and the last 10 goal records.
- History rows are read-only — no edit, no delete.

**What it shows, and from where**

- The prefilled form — latestWeight() in userRepo (most recent `weigh_ins` row by date).
- Everything under 'We calculate' — computeBodyComp() in src/lib/bodyComposition.ts, fed the typed values plus user.heightCm and user.sex.
- BMI category — bmiCategory(); fat category — bodyFatCategory() (ACE ranges); FFMI category — ffmiCategory(); visceral bands — visceralStatusOf().
- 'Current:' macro line — useUserStore().goal, i.e. getNutritionGoal() → `nutrition_goals`.
- Goal history — goalHistoryList(10) in goalHistoryRepo.
- Measurement history — weighInHistory() in userRepo, sliced to the last 30, reversed, then 12 rendered.
- Goal labels/notes — GOAL_LABELS, GOAL_ORDER, GOAL_NOTES in src/lib/calories.ts.

**What it writes**

- logWeight → addWeighIn(weightKg, extra) in userRepo → table `weigh_ins`. One row per date: it reads any existing row for today, CARRIES FORWARD every field you did not re-enter, then deletes and re-inserts. So a weight-only log never wipes yesterday's tape numbers if it lands on the same date.
- recalcTargets() in userStore → upsertNutritionGoal() → table `nutrition_goals` (calorieTarget, proteinG, carbsG, fatG, waterGoalMl, caffeineSoftLimitMg, tdee).
- recordGoalChange() in goalHistoryRepo → INSERT into `goal_history` (goal, rateOfChange, targetWeightKg, the four targets, tdee, bmr, basis 'katch'|'mifflin', atWeightKg, atBodyFatPct, notes). Written whenever the numbers move, and forced on 'Apply goal'.
- updateUser({goal, rateOfChange}) in userRepo → table `users`.

**Empty, loading and error states**

- No weigh-in ever recorded: the form is empty, 'Save measurement' is disabled, the whole 'We calculate' block is absent, and both history sections are hidden.
- Weight entered but no height on the user record: BMI, obesity degree, FFMI and waist-to-height all render '—'.
- Weight entered but no body fat: fat weight, lean mass, FFMI and the Katch-McArdle BMR are all '—' (BMR falls back to the scale's own reading if you typed one).
- 'Apply goal' without a weigh-in or a height: Alert 'Goal updated ✓' with the body 'Log a weigh-in and set your height first.'
- Two Alert dialogs are the only modal UI in this whole area. No loading, error or permission states.

> Formulas, exactly as coded: BMI = kg/m² with bands <18.5 / <25 / <30 / <35 / <40. Obesity degree = (weight − 22·m²)/(22·m²)×100. Lean mass = weight − fat mass (fat mass and body-fat% are reconciled from whichever you gave). FFMI = lean/m², normalized = FFMI + 6.1×(1.8 − m), categories <18 Lean, <20 Average, <22 Fit, <24 Muscular, <26 Very muscular, else Exceptional, with a −3 shift for female. Body-fat categories (ACE): male 5/13/17/24, female 13/20/24/31. Healthy body water 50–65% male, 45–60% female. Visceral bands ≤9 healthy, ≤14 excess, else high. BMR = Katch-McArdle 370 + 21.6 × lean, preferred over the scale's own reading; the goal pipeline falls back to Mifflin-St Jeor when lean mass is unknown. Gaps: `fatMassKg` is a supported input in both the schema and the engine but there is NO input for it in COMPOSITION_FIELDS — only body-fat %. `musclePctOfLean` and raw `ffmi` are computed and returned but never rendered (only normalizedFFMI is shown). There is no unit switching here despite the app having a metric/imperial preference — everything is kg/cm. lib/bodyType.ts is NOT used by this screen at all.

#### HomeScreen — 'Self-care' card (fragment only, not a screen of its own)

**Route** `Main → Home (TabParamList.Home: undefined)`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/home/HomeScreen.tsx (lines ~231–266)`  
**Reached from** The Home tab, between the 'Start Session / Walk' quick-action buttons and the (faith-gated) 'Prayers today' card.

The daily hygiene / decompression check-in strip. It is the only surface for src/lib/selfCare.ts and src/repositories/selfCareRepo.ts — there is no SelfCare screen and no route to one.

**Layout, top to bottom**

- SectionHeader 'Self-care'.
- One Card containing a space-around Row of THREE identical tap targets, one per SELF_CARE_ITEMS entry: 'Brush teeth' (icon care.brush, color token 'info', target 3, hint 'Morning, midday & night'), 'Shower' (icon care.shower, color 'water' #4FC3F7, target 1, hint 'Once a day'), 'Relax time' (icon care.relax, color 'mindbody', target 1, hint 'Unwind & decompress').
- Each target is a 56×56 circle with a 2px border, an icon size 26, the label under it, and a third 10px line that reads '{count}/{target}' when target > 1, or 'Done ✓' when a single-target item is complete, or the item's hint when it is not. Filled solid in the item's color at target, tinted (color + '22') below it; the border is the item color once count > 0 and theme.colors.border at zero.

**Interactions**

- Tap a circle → bumpSelfCare(key), which increments by 1 and WRAPS BACK TO 0 once the target is reached (0→1→2→3→0 for brushing). There is no long-press, no decrement, and no way to set an exact count from the UI.

**What it shows, and from where**

- Today's counts — getSelfCare(todayISO()) in selfCareRepo, returning a {key: count} map with missing keys treated as 0.
- Labels, icons, colors, targets and hints — SELF_CARE_ITEMS in src/lib/selfCare.ts.

**What it writes**

- bumpSelfCare(key) in selfCareRepo → UPDATE or INSERT one row of `self_care_logs` per (userId, date, key) with the new count. setSelfCare(key, count) also exists (floored at 0) but nothing calls it from the UI.

**Empty, loading and error states**

- No taps today: all three circles are tinted, borders are the neutral border color, and each shows its hint text.
- No loading, error or permission states.

> self_care_logs is also read by achievementsRepo (30-day window) and by challengeRepo for the 'selfCareDone' metric, which powers the daily challenges 'Three Acts of Care' (target 3) and 'Five Acts of Care' (target 5) — so the counts matter beyond this card. Note the challenge targets (3 and 5) exceed what the three items can total in a day (3 + 1 + 1 = 5), making 'Five Acts of Care' achievable only by completing everything.

### Engines behind this area

- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/sleep.ts`** — Night-sleep assessment and the readiness multiplier. assessNight() classifies a night as short/optimal/long; sleepDebt() sums the shortfall against a target across a window; averageSleep() averages only the nights actually logged; sleepPerformanceFactor() converts recent average rest into a training-readiness multiplier. Model basis stated in the file: National Sleep Foundation 7–9h adult guidance, and the claim that chronic short sleep (<6h) cuts power output, reaction time and time-to-exhaustion.  
  *Constants:* RECOMMENDED_SLEEP_MIN = 7, RECOMMENDED_SLEEP_MAX = 9, SLEEP_TARGET_DEFAULT = 8. Short-night readiness = max(0.2, hours/7). 'Oversleeping' only above 10h (MAX + 1), readiness 0.85. Optimal readiness 1. sleepPerformanceFactor: 1 at ≥7h, otherwise max(0.80, 1 − (7 − hours) × 0.06) — i.e. floors at 0.8 by 5h. sleepDebt rounds to 1 dp and CAN go negative. SLEEP_QUALITY_LABELS = ['Terrible','Poor','Okay','Good','Excellent'].
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/naps.ts`** — The nap-credit model — the most elaborate engine in this area, and the one with the longest documented rationale. It bands a nap by duration, applies a restorative efficiency (a nap minute is worth a FRACTION of a night minute), a circadian timing factor, then caps the credit at the debt the night actually owed, subtracts the sleep pressure the nap spends from tonight, and reports expected sleep inertia and how long the alertness lift lasts. dayRest() folds the day's naps into a single 'rest hours' figure with an overall cap so naps can never substitute for nights. Cited science in the file: Brooks & Lack (2006) — a 10-minute nap improves alertness/cognition for ~155 minutes with no grogginess; NASA/Rosekind (1995) — a 26-minute nap gives +34% performance and +54% alertness; slow-wave sleep past ~25–30 min causing 15–30 min of sleep inertia; ~90 min completing a full N1→N2→SWS→REM cycle; Process S homeostatic pressure being spent by late naps.  
  *Constants:* Bands: micro <10 min, power 10–25, truncated 26–45, recovery 46–80, cycle 81–110, long >110. BAND_EFFICIENCY micro 0.35 / power 0.70 / truncated 0.60 / recovery 0.65 / cycle 0.75 / long 0.70. BAND_INERTIA_MIN 0 / 0 / 20 / 15 / 8 / 20. BAND_ALERTNESS_MIN 60 / 155 / 180 / 200 / 240 / 240. timingFactor: unknown start 0.95, <10:00 0.85, <12:00 0.92, <15:00 1.0, <16:00 0.95, <18:00 0.85, else 0.70. nightSleepCostMin: unknown start = 10% of minutes; before 15:00 = 0; after 15:00 = minutes × (0.15 + 0.45 × lateness) with lateness clamped over 15:00→20:00. Debt handling: if the night met the 8h target, restorative × 0.4 ('mostly bought alertness'); if the nap exceeds the debt, the excess counts at 0.4. MAX_NAP_CREDIT_MIN = 150 per day, DEFAULT_TARGET_HOURS = 8. hourOf() parses 'HH:MM', 'HhMM' or 'H.MM' and rejects out-of-range values.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/cycle.ts`** — Calendar-arithmetic menstrual cycle model plus the four-phase guidance table. computeCycle() derives day-of-cycle (handling many elapsed cycles via modulo), phase, next period date, days until it, ovulation date and the fertile window. PHASE_GUIDANCE supplies the title, a hormone one-liner, a training line and a nutrition line per phase, each with its own color. No biometrics of any kind — no temperature, no HR, no symptom feedback into the prediction.  
  *Constants:* cycleLength clamped 21–40 (default 28), periodLength clamped 2–10 (default 5). Ovulation day = cycleLength − 14 (fixed 14-day luteal phase). Fertile window = ovulation −5 days to +1 day. Phases: menstrual while day ≤ periodLength; follicular until ovulationDay; ovulation on ovulationDay and ovulationDay+1; luteal after. Phase colors: menstrual #FF6B9D, follicular #4F8CFF, ovulation #33D9A6, luteal #B58CFF. CYCLE_SYMPTOMS has 10 entries: cramps, headache, bloating, fatigue, mood swings, cravings, back pain, tender breasts, acne, insomnia. cycleRepo.refineCycleAverages() averages gaps from the last 6 starts, accepting only gaps of 21–40 days and requiring ≥2 periods.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/conditions.ts`** — A static catalogue of 20 chronic conditions in 8 categories, each with a short non-diagnostic 'consideration' sentence used on the screen and in exported reports. No math whatsoever — this file is entirely data plus two lookups (findCondition, CONDITION_CATEGORY_LABEL).  
  *Constants:* 20 conditions; 8 categories (metabolic, cardiovascular, respiratory, musculoskeletal, hormonal, digestive, mental, other). Keys: type1_diabetes, type2_diabetes, hypertension, high_cholesterol, heart_disease, asthma, copd, hypothyroidism, hyperthyroidism, pcos, arthritis, osteoporosis, lower_back_pain, celiac, ibs, kidney_disease, anemia, depression, anxiety, pregnancy.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/hormones.ts`** — A static endocrine reference of 10 hormones across 7 categories. Each entry carries a role line, raisedBy[], loweredBy[], lowSigns[], highSigns[] and a single 'best lever' sentence. No computation — the file is explicit that FitCoach cannot measure hormones and that this is not a diagnosis.  
  *Constants:* 10 hormones: testosterone, estrogen, cortisol, insulin, thyroid (T3/T4/TSH), growth_hormone, melatonin, leptin, ghrelin, vitamin_d. 7 categories with labels: anabolic 'Anabolic & recovery', metabolic 'Metabolic', stress 'Stress', thyroid 'Thyroid', sleep 'Sleep & circadian', appetite 'Appetite', reproductive 'Reproductive'. Three statuses with labels: low 'Running low', high 'Running high', monitoring 'Monitoring'. Bullet counts run 3–6 per list, so a fully expanded card is ~20 bullets.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/alcohol.ts`** — Standards-based alcohol math. alcoholGrams() converts volume × ABV to grams of ethanol by density; computeDrink() adds ethanol calories plus a per-type carbohydrate calorie estimate and expresses the drink in both WHO and US standard drinks; estimateBAC() is the Widmark equation with a sex-specific distribution ratio and a linear elimination term; hoursToSober() inverts the elimination rate; bacLabel() gives a six-band qualitative word; alcoholRecoveryPenaltyPct() estimates muscle-protein-synthesis suppression.  
  *Constants:* ETHANOL_DENSITY = 0.789 g/ml, KCAL_PER_G_ALCOHOL = 7, STD_DRINK_G = 10 (WHO), US_STD_DRINK_G = 14. Widmark r = 0.68 male / 0.55 female; elimination β = 0.015 %/hour; BAC% = grams / (r × kg × 10) − 0.015·t. WEEKLY_LOWRISK_G = 100 (the file notes UK CMO 14 units ≈ 112 g and calls 100 the conservative default). bacLabel bands: 0 'None', <0.03 'Minimal', <0.05 'Light', <0.08 'Impaired', <0.15 'Over legal limit', else 'Heavy'. Presets — beer 330 ml / 5% / range 3–9 / 0.036 carb g per ml; wine 150 / 12 / 9–25 / 0.026; spirit 45 / 45 / 30–60 / 0.0; cocktail 200 / 12 / 5–30 / 0.09; other 200 / 10 / 0–60 / 0.03. Carbs at 4 kcal/g. alcoholRecoveryPenaltyPct = min(25, round(grams/40 × 25)).
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/habits.ts`** — The habit catalogue and its impact math, written under four stated design principles: honest not moralising, your own data over generic claims, time as the common currency, and no shame. Each habit carries a verbatim 'evidence' paragraph that is shown in the app — including one that explicitly states the research does NOT support the popular claims about masturbation lowering testosterone or harming performance. minutesFor() converts either kind to minutes, projectedYearHours() extrapolates the week, and timeEquivalents() reframes that time as sessions/books/days.  
  *Constants:* 5 habits. doomscrolling (duration, #7C6CFF, 30 min/day cap); masturbation (count, #5FD0E0, 15 min per occurrence, 1×/day cap); junk_snacking (count, #FF7A59, 5 min per occurrence, 1×/day cap); nail_biting (count, #FFB454, 1 min per occurrence, NO cap); procrastination (duration, #9AA6B2, 30 min/day cap). projectedYearHours = round(weekMinutes × 52 / 60). timeEquivalents thresholds: training sessions at 1h each shown only when ≥5, books at 8h each shown only when ≥1, full days at 24h shown to 1 dp only when ≥0.5. Late-night is defined at write time in habitsRepo as hour ≥ 23 or hour < 5; the screen flags a habit when lateNightShare > 0.3. HABIT_TRIGGERS (7 values) is defined but unused.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/bodyComposition.ts`** — The body-composition engine, with a strict rule that derived values are NEVER stored so history cannot contradict itself. computeBodyComp() reconciles fat mass against body-fat %, derives lean mass, converts every scale percentage into a kg figure (and vice versa), classifies water and visceral fat, computes BMI, obesity degree, FFMI (raw and height-normalized), waist-to-hip and waist-to-height, and picks a BMR basis. Also owns MEASUREMENT_FIELDS, the ordered tape-measurement list the form and history both render from.  
  *Constants:* Katch-McArdle BMR = 370 + 21.6 × leanMassKg (preferred whenever lean mass is derivable; otherwise the scale's own reading is used and labelled as such). BMI bands: <18.5 Underweight, <25 Normal, <30 Overweight, <35 Obese I, <40 Obese II, else Obese III. Obesity degree uses an ideal weight at BMI 22. Visceral: ≤9 healthy, ≤14 excess, else high. Healthy body water: male 50–65%, female 45–60%. Body-fat categories (American Council on Exercise): male 5/13/17/24, female 13/20/24/31 → Essential/Athletic/Fitness/Average/Above average. FFMI normalized = FFMI + 6.1 × (1.8 − heightM); categories <18 Lean, <20 Average, <22 Fit, <24 Muscular, <26 Very muscular, else Exceptional, with a −3 shift applied for female. MEASUREMENT_FIELDS = 15 circumferences in 4 groups (Upper body 3, Torso 4, Arms 4, Legs 4). All values rounded to 1 dp except BMR and waist ratios (2 dp).
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/bodyType.ts`** — A deliberately lightweight somatotype heuristic from BMI plus optional waist-to-hip ratio, used only to bias initial calorie/macro defaults. IMPORTANT for this area: it is NOT used by BodyScreen at all — it runs in OnboardingScreen (auto-estimate preview) and userStore.completeOnboarding, and can be overridden by hand in EditProfileScreen; the resulting label is only displayed on ProfileScreen, TrendsScreen and the exported report.  
  *Constants:* When WHR is known it dominates: endomorph at WHR ≥ 0.95 male / 0.85 female or BMI ≥ 27; ectomorph at WHR ≤ 0.85 male / 0.75 female AND BMI < 22; else mesomorph. Without WHR: BMI < 20 ectomorph, ≥ 26 endomorph, else mesomorph. bodyTypeCarbBias returns +0.05 for ectomorph, −0.05 for endomorph, 0 otherwise — and is EXPORTED BUT NEVER CALLED anywhere in the codebase (dead code).
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/selfCare.ts`** — Three fixed daily check-in items with a per-day target each. No scoring beyond done/target. Its only UI is the Home screen strip; the counts feed achievements and the daily-challenge 'selfCareDone' metric.  
  *Constants:* brush 'Brush teeth' target 3 hint 'Morning, midday & night' color token 'info'; shower 'Shower' target 1 hint 'Once a day' color 'water'; relax 'Relax time' target 1 hint 'Unwind & decompress' color 'mindbody'. selfCareRepo.bumpSelfCare wraps 0→target→0.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/time.ts`** — HH:MM parsing and range arithmetic shared by SleepScreen (bedtime→wake) and WorkScreen (start→end). rangeMinutes() wraps past midnight when the end is earlier than the start, which is what makes an overnight sleep and a night shift both compute correctly. minutesToHM formats '2h 15m' / '3h' / '45m'; minutesToHours gives 2 dp decimal hours.  
  *Constants:* parseHM accepts strictly /^(\d{1,2}):(\d{2})$/ with h 0–23 and m 0–59 — 'HH.MM' or 'HHhMM' are rejected here (unlike naps.hourOf, which is more permissive). Midnight wrap adds 1440 minutes.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/date.ts`** — All 'day' values in this area are local-time ISO 'YYYY-MM-DD' strings, which is why date comparisons throughout the repos are plain string comparisons. Supplies todayISO, addDays, daysBetween, daysAgoISO and lastNDates — the last of which defines every 7-day and 21-day window on these screens.  
  *Constants:* lastNDates(n) returns oldest-first including today. daysAgoISO(6) is the 7-day window boundary used by sleep, alcohol, work and habits; daysAgoISO(20) is the habits chart window; daysAgoISO(27) is the 4-week alcohol average; 30 days is the correlation window for both sleep and habits.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/calories.ts`** — Not assigned but load-bearing for BodyScreen: it owns the five goals, their display order, their honest notes, and the full BMR → TDEE → goal offset → macro-split pipeline that 'Apply goal & recalculate' and every weigh-in save trigger.  
  *Constants:* GOAL_ORDER = lose_fat, maintain, build_muscle, recomp, performance. Offsets by rate — loss −12/−17/−22%, gain +8/+12/+15%, recomp −3/−7/−10%, performance 0/+3/+5%. Protein g/kg: maintain 1.8, lose_fat 2.2, build_muscle 2.0, recomp 2.4, performance 1.8, anchored to lean mass × 1.15 when body fat is between 0 and 60%. Fat share of calories: 25% on lose_fat/recomp, 22% on performance, 28% otherwise. The target is never allowed below BMR.

### Notes for the redesign

CROSS-CUTTING FACTS A DESIGNER MUST KNOW.

1. Uniform shell. Every one of these eight screens is `<Screen>` (a SafeAreaView with edges=['top'] over a ScrollView, 16px padding, 96px extra bottom padding, uniform 16px gap between children) opening with `<PageHero>`. The native stack header is registered with `options={{ title: '' }}` for all of them, so the only header chrome is a back arrow. A PageHero subtitle of ≤100 characters sits beside the icon tile; longer ones drop to full width below — every subtitle in this area except Sleep's and Alcohol's (which have none) is long-form and drops below.

2. No async, anywhere. Every read is synchronous SQLite through drizzle. There is not one spinner, skeleton, error boundary, retry, or permission prompt in the whole area. The only "state" you can design for is empty vs populated. The one universal artefact of this is that data-dependent blocks are absent on the very first paint (before `useFocusEffect` runs) and appear a frame later.

3. Only two dialogs exist in the area, both `Alert.alert` on BodyScreen ('Weight required', 'Saved ✓', 'Goal updated ✓'). Every destructive action elsewhere — deleting a nap, a drink, a condition, a hormone flag, disabling cycle tracking, stopping a habit — happens instantly with NO confirmation.

4. Recurring form-initialisation bug, in three screens. SleepScreen (`useState(lastNight ?? 8)`), WorkScreen (`useState(today?.startTime ?? '09:00')` and its three siblings) and HabitsScreen (`useState(() => habitCorrelation(...))`, `useState(() => habitDailySeries(...))`) all seed local state from a store or a query BEFORE the focus effect has loaded it, and never re-sync. Practical consequences: Sleep always opens at 8h, Work always opens at 09:00/17:30/60 even when today is already saved, and a habit's correlation numbers and 21-day chart are frozen at mount and do not move when you log.

5. Write semantics differ per tracker and this is visible to users. `sleep_logs` and `work_logs` are ONE ROW PER DAY (delete + insert; re-saving silently overwrites and there is no history list for work). `nap_logs`, `alcohol_entries`, `habit_entries` and `period_logs` are append-many. `weigh_ins` is one row per date but CARRIES FORWARD any field you didn't retype. `health_conditions` and `hormone_flags` are hard-deleted on removal despite both having an `active` column, so there is no record that you once had a condition.

6. Schema columns with no UI at all — a real opportunity list for v3: nap_logs.quality and nap_logs.startTime (nothing in the app writes a nap start time, which silently disables the entire circadian half of the nap engine); sleep_logs.notes; work_logs.notes; period_logs.flow, endDate and notes (cycleStore even exposes endPeriod(), unused); health_conditions.notes; hormone_flags.notes; habit_entries.trigger plus the seven-value HABIT_TRIGGERS list; habit_profiles.baselinePerDay; weigh_ins.fatMassKg (supported by the engine, no input field).

7. Computed-but-never-rendered values: sleepSummary().series (night-only, the chart uses restSeries instead), sleepTrainingCorrelation().goodNights/poorNights, napValue().notes / alertnessMin / restorativeMin / efficiency / timing / repaidDebt (the screen only shows band, netMin, inertiaMin, nightCostMin), NAP_BAND_META[].blurb (the six explanatory paragraphs are written but never displayed), habitImpact().avgPerDay, computeBodyComp().musclePctOfLean and raw ffmi, alcohol computeDrink().usStandardDrinks / alcoholCalories / carbCalories split, alcoholRecoveryPenaltyPct(), avgAlcoholGramsPerWeek(), workRepo.avgWorkHours(), workRepo.deleteWork(), sleepRepo.deleteSleep(), cycleRepo.deletePeriodLog(), selfCareRepo.setSelfCare(), bodyType.bodyTypeCarbBias() (entirely dead).

8. Duplicated affordances. Conditions and Hormones both render every selected item TWICE — once as a card in a 'Your …' block at the top and again as an active pill/card in its category section, both live toggles for the same record. The hormone flag card additionally prints its status label twice in a row (caption + Badge).

9. Density problems worth redesigning. SleepScreen puts FOUR StatTiles in one Row (each is a bordered Card with 16px padding and a 20px value) — the tightest layout in the app. HormonesScreen is a single flat scroll of 10 expandable cards with up to ~20 bullets each plus a flags block and a disclaimer. ConditionsScreen renders 20 pills across 8 sections with no search, no filter and no 'common ones first'.

10. Copy defects. The habit '+1' button reads '+1 times' for three of the five habits (it interpolates the plural unit). The cycle calendar's 'Period' legend swatch takes the CURRENT phase's colour while the calendar always paints periods in theme.colors.protein, so they disagree in three of the four phases.

11. Gating and discoverability. Cycle tracking is offered to everyone from Profile with no gender gate, and the Home tile for it only appears once it is enabled AND a cycle state exists — otherwise that same slot shows the Alcohol tile, so the two trackers compete for one position. Conditions, Hormones, Habits, Work and Body have exactly one entry point each (the Profile 'Health & Wellness' card). Self-care has no screen at all; it exists only as a strip on Home.

12. Colour tokens used across this area (dark theme is the default): mindbody #5FD0E0 (Sleep, Habits), protein #FF6B9D (Cycle), danger #FF5D5D (Conditions), accent #33D9A6 (Hormones), warning #FFB454 (Alcohol), info #4F8CFF (Work, Body, naps), calories #FF7A59, water #4FC3F7, success #33D9A6. Surfaces: bg #0B1220, card/surface #141C2E, surfaceAlt #1C2740, border #26314A; text #EAF0F7 / textMuted #9AA6B8 / textFaint #63708A. Radii sm 8 / md 12 / lg 16 / pill 999. Type scale: display 34/800, h1 26/800, h2 20/700, h3 17/700, body 15/500, label 13/600, caption 12/500.

13. Tone of voice is a deliberate, load-bearing part of this area and must survive a redesign. Three screens carry explicit non-medical disclaimers (Cycle 'Educational guidance only — not medical or contraceptive advice', Conditions 'This is not medical advice — always follow your clinician', Hormones a dedicated warning-accented card). The habits engine's stated principles are 'honest, not moralising' and 'no shame', and its evidence paragraphs deliberately debunk popular claims rather than amplify them. The naps engine writes 'the model says which one you got' rather than inflating a number. BodyScreen's '—' footnote insists nothing is estimated or invented. These are not decorative strings.

---

## 5. Training hub and session setup (Train tab + every route that starts or logs a session)

This is the whole "how do I start training" surface: one hub screen (Train tab) plus eight pushed screens that each offer a different route into a session. Everything funnels into exactly one action — `useSessionStore.begin(type, opts)`, which inserts a row into `sessions` and optionally pre-populates `exercise_logs` from a list of exercise slugs or ids — and then pushes `ActiveSession`. The only exceptions are `LogSession` (writes a finished session after the fact via `logPastSession`) and `DailyChallenge` (writes a `daily_challenges` row, never a session). Content comes from five hand-authored catalogues (5 splits / 16 days, 102 training methods, 34 pre-built programs / 141 days, 61 special programmes / 302 days, 44 daily challenges) plus the user's own saved routines from `custom_routines`. A single profile field, `experienceLevel` (beginner / intermediate / advanced, labelled "Beginner / Intermediate / Pro"), edited inline via `LevelPicker`, changes how many and which exercises get pre-loaded — but only on the Split picker and on strength/calisthenics methods.

### Screens (9)

#### TrainScreen

**Route** `Main → Tab "Train" (TabParamList.Train: undefined). No params. Not a stack screen — it is one of the five bottom tabs.`  
**Reached from** Bottom tab bar ("Train"). Also where the app lands after SessionRecap's "Done" button (navigate('Main')).

The training hub. Every way of starting a session, plus two pre-flight readiness cards, saved routines, and the last 8 sessions.

**Layout, top to bottom**

- <Screen> — SafeAreaView (top edge) + ScrollView, padding 16, gap 16, paddingBottom 112, bg = colors.bg.
- Text variant="h1": "Train".
- IF a session is live (activeId != null): Card accent=colors.accent — Row [Icon 'core.timer' accent + column("Session in progress" bodyStrong / "Tap to resume your check-in" caption textMuted)] and a right-aligned Button size="sm" fullWidth=false titled "Resume". ELSE: Button variant=primary size="lg" icon='core.start' titled "Start a Session".
- Button variant="secondary" icon='stats.muscleMap': "Train a Split (Push / Pull / Legs…)".
- Button variant="ghost" icon='core.calendar': "Log a past session".
- <DigestionCard meals={digestMeals} smokes={smokes} smokingEnabled={smokingOn} defaultIntensity="hard" /> — the "Can I train yet?" card. Renders NOTHING at all when there are no meals and no smoke events today. Otherwise: headline Row ("Clear to train" or "Wait {duration}", with a sub-line naming which clock governs and the ready clock time), then a "Stomach" meter (label + status "wait 1h 20m · 14:35" or "clear" + ProgressBar + detail line "~620 kcal still digesting across 2 meals (940 kcal eaten)"), then a "Smoke" meter (only when smokingEnabled or smokes exist), then a SegmentedControl "Light / Normal / Hard" (local state, defaults to Hard here), then a long explanatory caption. Re-renders on a 60 s interval.
- <WeatherCard plannedActiveMin={60} /> — Card accent = HEAT_BAND_COLOR. Row: Icon 'weather.thermo', "{n}°C" h3 + "feels like {n}°" + heat-band Badge, sub-caption "Live | Entered by you · {h}% humidity · wind {n} km/h · a few hours old", and a right-edge 'core.edit' Pressable that opens a 3-input manual row (°C / Humidity % / Wind km/h) with "Save" and "Fetch live" buttons. Below: advice.headline plus 1 bullet, expandable to all with a "{n} more"/"Less" link. Empty state: "Weather" / "No reading yet — fetch it, or type it in." (or "Checking…" while fetching).
- Pressable → Card accent=colors.warning: Icon 'core.target' 24 + "Daily Challenge" (bodyStrong) / "Spin the wheel — one a day, tracked automatically" (caption, numberOfLines=1) + Icon 'core.forward' 18 textFaint.
- Pressable → Card accent=colors.accent: Icon 'mindbody.special' 24 + "Special Programmes" / "Military, Shaolin, Roman, Spartan, Dagestan… + their diets" (numberOfLines=1) + 'core.forward'.
- Row of two equal Buttons variant="secondary": "Walk" (icon 'cardio.walk') and "Run" (icon 'cardio.running').
- Label "Track outdoors" (variant=label, textMuted) above a horizontal ScrollView of exactly 5 Cards (accent=colors.outdoor, minWidth 104, paddingV 10 / paddingH 14), each Icon 20 + label: Hike ('cardio.hiking'), Trail run ('cardio.marathon'), Ruck ('strength.plate'), Stairs ('cardio.stairs'), Ride ('cardio.cycling'). Walk and Run are filtered out of this strip because they already have buttons above.
- IF routines.length > 0: SectionHeader "My Routines", then one Card per routine (accent=colors.primary). Row = [Pressable(flex:1): Icon 'core.custom' 20 + name (1 line) + caption "{n} exercises · tap to see them" / "…tap to collapse"] [Pressable: Icon 'core.list' → 'core.chevronUp'] [Pressable: Icon 'core.delete' 18 textFaint] [Pressable: Icon 'core.start' 22 primary]. When expanded: <ExercisePeek> (numbered list, icon, name, "{muscle} · {equipment}" sub-line) + Button size="sm" "Start {name}".
- SectionHeader "Train by category", then a wrap grid (gap 12) of exactly 9 Pressable Cards at width '47%', flexGrow 1: Icon 26 in the type colour, h3 label, caption blurb. The nine: Strength "Sets, reps, weight, RPE" (#4F8CFF), Calisthenics "Bodyweight sets & progressions" (#7C6CFF), Cardio "Treadmill, bike, rower, elliptical" (#FF7A59), Outdoor "Run, cycle, swim, hike" (#33D9A6), Sport "Tennis, soccer, basketball…" (#FFB454), Martial Arts "Boxing, Muay Thai, BJJ, karate…" (#E5533D), Mind-Body "Yoga, Pilates, mobility" (#5FD0E0), Meditation "Breathwork, guided, body scan" (#B58CFF), Custom "Anything else" (#9AA6B2).
- SectionHeader "Recent Sessions" with a right-edge action link "All" (only rendered when recent.length > 0) → SessionHistory.
- IF no sessions: <EmptyState icon='core.calendar' title="No sessions yet" message="Start your first session to build your history and stats."/>. ELSE up to 8 Cards, each Row = [Pressable(flex:1): Icon sessionTypeIcon(type) 22 primary + title + meta caption] [Pressable: Icon 'core.list' ⇄ 'core.chevronUp'] [Icon 'core.forward' 18 — decorative, NOT pressable]. Expanded: <ExercisePeek emptyLabel="No exercises were logged in this session."/>.

**Interactions**

- Tap "Start a Session" → navigation.navigate('SessionTypePicker') (modal presentation).
- Tap "Resume" → navigate('ActiveSession', { sessionId: activeId }).
- Tap "Train a Split (Push / Pull / Legs…)" → navigate('SplitPicker').
- Tap "Log a past session" → navigate('LogSession') (modal presentation).
- Tap the Daily Challenge card → navigate('DailyChallenge').
- Tap the Special Programmes card → navigate('SpecialPrograms').
- Tap Walk / Run → navigate('Walk', { activity: 'walk' | 'run' }).
- Tap any of the 5 outdoor chips → navigate('Walk', { activity: <key> }) where key ∈ hike, trail-run, ruck, stairs, cycle.
- Routine: tap the name or the list icon → expands/collapses in place (state `openRoutine`, one at a time, no session started). Tap 'core.start' or "Start {name}" → begin('strength', { label: r.name, prefillExerciseIds: r.exerciseIds }) then navigate('ActiveSession'). NOTE: routines started from here are ALWAYS typed 'strength' regardless of what they contain.
- Routine delete icon → Alert.alert(`Delete “{name}”?`, 'The routine template is removed; logged sessions are untouched.') with Cancel / Delete(destructive). Delete calls deleteRoutine(id) then re-reads listRoutines().
- Tap a category card → navigate('MethodPicker', { sessionType }). Includes 'custom', which lands on a near-empty MethodPicker.
- Recent session: tap the left region → navigate('SessionDetail', { sessionId }). Tap the list icon → lazily calls sessionExercisePeek(s.id) and expands (state `openSession`, one at a time).
- SectionHeader "All" → navigate('SessionHistory').
- DigestionCard intensity SegmentedControl (Light/Normal/Hard) — local, resets to "Hard" on every visit.
- WeatherCard edit pencil → inline manual entry; "Save" writes a reading, "Fetch live" re-fetches; advice bullet list expands/collapses.

**What it shows, and from where**

- Live-session banner ← useSessionStore.resume() → sessionRepo.activeSession() (most recent `sessions` row with endTime IS NULL).
- "My Routines" list ← routinesRepo.listRoutines() → `custom_routines` ordered by updatedAt DESC, each hydrated by JSON.parse(exerciseIds) + exerciseRepo.getExercise(id) (ids that no longer resolve are silently dropped).
- Routine exercise count "{n} exercises" ← r.exercises.length (the RESOLVED count, which can be lower than the stored id count).
- Recent sessions ← sessionRepo.listSessions({ limit: 8 }) → `sessions` WHERE userId, ORDER BY startTime DESC.
- Session title ← s.label ?? SESSION_TYPE_META label for s.sessionType.
- Session meta line ← friendlyDate(s.startTime) (local helper: "Today" / "Yesterday" / toLocaleDateString {month:'short', day:'numeric'}) + formatDurationLong(s.durationS ?? 0) (lib/format: "1h 15m" / "45m" / "30s") + optional `${Math.round(s.totalVolume).toLocaleString()} kg` + optional `${(s.distanceM/1000).toFixed(2)} km`.
- Expanded session exercise list ← sessionRepo.sessionExercisePeek(sessionId) — joins exercise_logs→exercises ordered by orderIndex, and builds a detail string from completed sets: "{n} sets · {volume} kg · {minutes} min".
- Digestion card ← lib/digestion.mealsFromEntries(nutritionRepo.foodEntriesForDay(todayISO())) fed through lib/readiness.trainReadiness and lib/smokeClock.smokeStatus.
- Smoke events ← smokingRepo.recentSmokeEvents(); smoke meter visibility ← smokingRepo.isSmokingEnabled().
- Weather ← weatherRepo.latestReading() first (never blocks), then services/weatherFetch.fetchLiveWeather() on mount if stale/missing; advice from lib/weather.weatherAdvice(reading, ctx) where ctx carries plannedActiveMin=60, respiratory/cardiac condition flags from conditionsRepo + CONDITION_CATALOGUE, and fasting from faithRepo.currentFastingState().
- The 9 category cards ← constants/sessionTypes.SESSION_TYPE_META (static).

**What it writes**

- Starting a routine → sessionStore.begin → sessionRepo.startSession() INSERT into `sessions`, then sessionRepo.addExerciseToSession() INSERT one row per exercise into `exercise_logs` (orderIndex = running count).
- Deleting a routine → routinesRepo.deleteRoutine(id) DELETE FROM `custom_routines`.
- WeatherCard "Save" → weatherRepo.saveWeatherReading(reading) (weather readings table).
- Nothing else on this screen writes.

**Empty, loading and error states**

- No sessions → EmptyState "No sessions yet" and the "All" action link is hidden.
- No routines → the entire "My Routines" section (header included) is not rendered.
- No meals and no smoke events logged today → DigestionCard returns null, so the card simply is not there.
- No weather reading and fetch fails/denied → WeatherCard still renders with "Weather" / "No reading yet — fetch it, or type it in." There is no explicit location-permission message; a failed fetch just leaves the empty copy.
- No live session → the accent "Session in progress" card is replaced by the big "Start a Session" button.
- Everything re-reads on useFocusEffect (resume, listSessions, listRoutines, digestion meals, smoke events, smoking-enabled flag) — there is no loading spinner anywhere; all reads are synchronous SQLite.

> Two quiet inconsistencies for a redesign to resolve: (1) tapping a category card does NOT start a session, it opens MethodPicker — the copy gives no hint of that; (2) a saved routine started from this screen is hard-coded to sessionType 'strength' (MethodPicker starts the same routine as whatever category you came from). The 'core.forward' chevron on each recent-session row is decorative only. The horizontal outdoor strip and the Walk/Run buttons bypass this whole area and go to the Walk tracker, not to ActiveSession.

#### SessionTypePickerScreen

**Route** `SessionTypePicker (params: undefined). Registered with options={{ title: 'Start a Session', presentation: 'modal' }}.`  
**Reached from** TrainScreen "Start a Session" button, and HomeScreen (HomeScreen.tsx:219).

The simplest start path: pick one of the nine session types and go, with an optional pre-session mood rating for the two mind-body types. It pre-loads nothing.

**Layout, top to bottom**

- <Screen> (scroll, padding 16, gap 16). Native header shows the title "Start a Session".
- Text variant="h2": "Pick a session type". (No PageHero here — this screen predates that pattern.)
- Wrap grid (gap 12) of all 9 SESSION_TYPE_META cards at width '47%', flexGrow 1. Each: Icon 26 in the type colour, Text h3 = label, Text caption textMuted = blurb. Selected card gets borderColor = type colour and backgroundColor = colour + '18'.
- IF the selected type's flow === 'mindbody' (i.e. Mind-Body or Meditation only): a Card titled "How do you feel? (before)" (h3) containing a space-between Row of 5 Pressables — emoji at fontSize 30 (opacity 1 when selected, 0.45 otherwise) over a caption label. The five are 😞 Rough, 😕 Meh, 😐 Okay, 🙂 Good, 😄 Great (MOOD_EMOJI / MOOD_LABELS), stored as 1–5.
- Bottom Button: title = "Start {label}" when a type is selected, otherwise "Select a type"; icon 'core.start'; disabled until a type is chosen; colour = the selected type's colour.

**Interactions**

- Tap a type card → selects it (single selection, local state). Selecting a non-mindbody type after choosing a mood leaves the mood value in state but it is discarded on start.
- Tap a mood emoji → sets mood 1–5 (no way to clear it once set).
- Tap "Start {label}" → begin(selected.type, { moodBefore: isMindBody ? mood : undefined }) then navigation.replace('ActiveSession', { sessionId }). `replace`, so backing out of the session does not return here.

**What it shows, and from where**

- The 9 cards ← constants/sessionTypes.SESSION_TYPE_META (static array; label, icon via constants/icon-map.sessionTypeIcon, colour via theme SESSION_TYPE_COLORS, blurb, flow).
- Mood emoji/labels ← constants/sessionTypes.MOOD_EMOJI and MOOD_LABELS (static).

**What it writes**

- sessionStore.begin → sessionRepo.startSession(type, { moodBefore }) INSERT into `sessions` with label NULL, style NULL, splitKey NULL, splitDay NULL, moodBefore = 1–5 or NULL, startTime = Date.now().
- No exercise_logs are written — this path pre-loads nothing.

**Empty, loading and error states**

- Nothing selected → the button reads "Select a type" and is disabled. There is no empty/loading/error state; the list is a static constant.

> Only Mind-Body and Meditation expose the mood question, because they are the only two SESSION_TYPE_META entries with flow: 'mindbody'. Custom has flow: 'cardio'.

#### SplitPickerScreen

**Route** `SplitPicker (params: undefined). options={{ title: '' }} — the native header carries only the back arrow; PageHero is the title.`  
**Reached from** TrainScreen "Train a Split (Push / Pull / Legs…)" button, and the "Pick a split" card inside MethodPicker when sessionType === 'strength'.

Pick a strength split and one of its days; the day's exercise list is pre-loaded into a new 'strength' session, trimmed and filtered by experience level.

**Layout, top to bottom**

- <PageHero icon='strength.barbell' color={colors.strength} title="Training split" subtitle="Pick a split and a day — FitCoach pre-loads that day's exercises so you can just start lifting. You can add or remove anything once you're in."/> (long subtitle → renders full-width beneath the tile).
- <LevelPicker color={colors.strength} /> — full (non-compact) form: a Card with Icon 'core.target' + label "Your level", a SegmentedControl [Beginner | Intermediate | Pro], the level blurb, and the one-line prescription "3 sets × 8–12 (compounds 5–8) · rest ~1.5–2 min (the app times it per set)".
- SectionHeader "Choose a split".
- 5 Pressable Cards, one per SPLITS entry, accent = split colour, highlighted (border + colour+'18' background) when selected. Each: Row[Icon 22 + h3 name, right-aligned caption = daysPerWeek], caption blurb, caption textFaint "Best for: {bestFor}".
- IF a split is selected: SectionHeader "{split.name} — pick your day" then a wrapping Row of Chips, one per day (2–6 of them).
- IF a split AND a day are selected: a preview Card (accent = split colour) containing: h3 = day.label; caption = day.blurb; a wrapping Row of small muscle Chips (MUSCLE_LABELS lookup: Chest, Back, Shoulders, Biceps, Triceps, Quads, Hamstrings, Glutes, Calves, Core / Abs, Forearms); Divider; label "{n} exercises will be pre-loaded" plus, when trimmed, " ({Beginner|Intermediate|Pro}: the first {n} of {m} — the compounds)"; caption "{sets} sets × {reps} (compounds {compoundReps}) · {progression}"; then the numbered list "1. [icon] Exercise name".
- Bottom Button: "Start {day.label}" (or "Pick a split day" disabled), icon 'core.start', colour = split colour.

**Interactions**

- Tap a split card → selects it and RESETS the day to null.
- Tap a day chip → selects it. Re-tapping the same chip does NOT deselect (unlike ProgramPicker, which does).
- LevelPicker segmented control → userStore.updateProfile({ experienceLevel }) — writes to the profile immediately and instantly re-computes the preview list and the prescription line.
- "Start {day}" → begin('strength', { label: `${split.name} · ${day.label}`, splitKey: split.key, splitDay: day.key, prefillSlugs: slugsForLevel(day.exercises, level, difficultyBySlug) }) then navigation.replace('ActiveSession', { sessionId }).

**What it shows, and from where**

- The 5 splits and their 16 days ← src/data/splits.ts SPLITS (static).
- The pre-load preview ← exerciseRepo.exercisesBySlugs(slugsForLevel(day.exercises, level, difficultyBySlug)) — resolves each slug via getExerciseBySlug and silently drops any that are not in the library, so preview.length can be shorter than the trimmed slug list.
- Level, its label and blurb ← lib/level.LEVEL_LABELS / LEVEL_BLURBS via userStore user.experienceLevel (NULL reads as 'intermediate').
- Sets/reps/progression line ← lib/level.LEVEL_PRESCRIPTION[level].

**What it writes**

- LevelPicker → userRepo/userStore.updateProfile({ experienceLevel }) → `users.experience_level`.
- Start → sessionRepo.startSession('strength', { label, splitKey, splitDay }) INSERT into `sessions` (splitKey/splitDay columns are populated only from this screen), then one addExerciseToSession() INSERT into `exercise_logs` per resolved slug, in order.

**Empty, loading and error states**

- No split chosen → only the hero, level picker and the 5 split cards render; the bottom button reads "Pick a split day" and is disabled.
- Split chosen but no day → day chips appear, no preview, button still disabled.
- A day whose slugs are missing from the library → the count line quietly shows fewer exercises; unlike ProgramPicker there is NO explanatory caption about missing exercises here.
- No loading or error state — SPLITS is a constant and exercise lookups are synchronous.

> The trim label compares `preview.length < day.exercises.length`, so it also fires when slugs are missing rather than when the level trimmed them — the wording "the first N of M — the compounds" can therefore be slightly wrong. Splits are strength-only by design (a split is a muscle-group rotation).

#### MethodPickerScreen

**Route** `MethodPicker { sessionType: SessionType }. options={{ title: '' }}.`  
**Reached from** Only from a TrainScreen category card (openCategory). Nothing else navigates here.

The per-category hub: everything you can do inside one session type — splits (strength only), pre-built programs, your saved routines, the named training methods, and a plain free session.

**Layout, top to bottom**

- <PageHero icon={meta.icon} color={meta.color} title={meta.label} subtitle={meta.blurb}/> — e.g. "Strength" / "Sets, reps, weight, RPE".
- <LevelPicker color={meta.color} compact={!trims}/> — `trims = sessionType === 'strength' || 'calisthenics'`. So Strength and Calisthenics get the full Card (with blurb); every other category gets the compact inline form (segmented control + prescription line, no Card, no blurb) even though level changes nothing there.
- IF sessionType === 'strength': SectionHeader "Training splits" + a Pressable Card (accent = meta.color) — Icon 'stats.muscleMap' + "Pick a split" / caption listing the first four split names joined by ' · ' with a trailing ellipsis ("Push / Pull / Legs · Upper / Lower · Bro Split · Full Body…") + 'core.forward'.
- IF programsFor(sessionType).length > 0: SectionHeader "Programs" + a Pressable Card — Icon 'core.calendar' + "{n} pre-built program(s)" / caption = every program name joined by ' · ' (numberOfLines=1) + 'core.forward'. Below it a caption: "A whole week planned out — each day says what it's for, what to do, and what tells you it's working."
- IF routines.length > 0: SectionHeader "My routines" + one Card per routine (accent=colors.primary): Icon 'core.custom' 18 + name + "{n} exercises · tap to see them"/"…tap to collapse", a list/chevronUp toggle, and a 'core.start' icon. Expanded → ExercisePeek + Button "Start {name}" size sm. NOTE: no delete affordance here (delete lives only on TrainScreen).
- IF methodsFor(sessionType).length > 0: SectionHeader "Methods" + caption "Each method is a real protocol with its own way of measuring progress. Tap one to read it; start it to tag the session so you can compare like-for-like over time." Then one Card per method: header Row = Icon 20 + bodyStrong label + caption blurb, with a right-edge Badge "~{typicalMinutes}m". Expanded (accent turns on): Divider, label "How it runs" + structure text, label "Progress measured by · {EFFORT_LABEL[progressBy]}" + progressNote, and a Button size="sm" "Start {label}".
- Button variant="secondary" icon='core.start': "Free session (no method)".
- Footer caption, centred: "Tagging a session with its method is what makes progress comparable — five-by-five against five-by-five, HIIT against HIIT — instead of one undifferentiated pile of workouts."

**Interactions**

- "Pick a split" card → navigate('SplitPicker').
- Programs card → navigate('ProgramPicker', { sessionType }).
- Routine row / list icon → expand-collapse in place (openRoutine). 'core.start' or "Start {name}" → begin(sessionType, { label: r.name, prefillExerciseIds: r.exerciseIds }) then replace('ActiveSession'). Here the routine adopts THIS screen's session type, unlike TrainScreen which forces 'strength'.
- Method card header → expands one method at a time (state `expanded`, keyed by method key).
- "Start {method}" → begin(sessionType, { label: m.label, style: m.key, prefillSlugs: trims && m.prefillSlugs ? slugsForLevel(m.prefillSlugs, level, difficultyBySlug) : m.prefillSlugs }) then replace('ActiveSession'). Level trimming applies ONLY to strength and calisthenics.
- "Free session (no method)" → begin(sessionType) with no options at all, then replace('ActiveSession').
- LevelPicker segmented control → writes experienceLevel to the profile.

**What it shows, and from where**

- Header ← constants/sessionTypes.metaFor(sessionType).
- Method list ← data/trainingMethods.methodsFor(sessionType) — 102 methods total: strength 6, calisthenics 8, cardio 16, martial_arts 14, outdoor 15, sport 11, mindbody 16, meditation 16, custom 0.
- "~{n}m" badge ← method.typicalMinutes (range across the catalogue: 2 min for 'Quick Reset (60 seconds)' to 180 min for 'Adventure / Orienteering').
- "Progress measured by" ← EFFORT_LABEL map: load→"Load lifted", reps→"Reps / quality", duration→"Time", distance→"Distance", rounds→"Rounds", intensity→"Intensity".
- Program count/names ← data/programs.programsFor(sessionType) — 34 programs total: outdoor 7, sport 5, meditation 5, cardio 4, martial_arts 4, mindbody 4, calisthenics 3, strength 2, custom 0.
- Split names caption ← data/splits.SPLITS (first 4 names).
- Routines ← routinesRepo.listRoutines(), re-read on useFocusEffect.

**What it writes**

- begin() → sessionRepo.startSession(sessionType, { label, style }) INSERT into `sessions` — `style` carries the method key (e.g. 'str-5x5', 'car-hiit'), which is what makes like-for-like comparison possible later.
- addExerciseToSession() INSERT per resolved prefill slug / routine exercise id into `exercise_logs`.
- LevelPicker → users.experience_level.

**Empty, loading and error states**

- sessionType='custom': no splits card, no programs card (0 programs), no methods (0 methods) — the screen collapses to hero + compact LevelPicker + (routines if any) + the "Free session" button + footer caption. Functionally that is the only thing Custom offers.
- No saved routines → the "My routines" section is omitted entirely.
- No programs for the type → the Programs card AND its explanatory caption are both omitted.
- No loading or error state anywhere; every source is a constant or a synchronous SQLite read.

> For non-lifting categories the compact LevelPicker is still shown and still writes the profile, but nothing on that screen uses the level — a small honesty gap. Every one of the 102 methods has a prefillSlugs list, so "start a method" always pre-loads something (1 to 9 slugs), assuming the slugs resolve.

#### ProgramPickerScreen

**Route** `ProgramPicker { sessionType: SessionType }. options={{ title: '' }}.`  
**Reached from** Only from the "Programs" card on MethodPicker. There is no other entry point.

Choose one of the pre-built weekly programs for a category, then today's day within it; the day's exercises pre-load and the session is tagged `program:day`.

**Layout, top to bottom**

- IF programsFor(sessionType).length === 0 the screen renders ONLY: <PageHero icon={meta.icon} color={meta.color} title="{meta.label} programs" subtitle="No pre-built program for this category yet — pick a method instead, or start a free session."/> — and nothing else. No button, no back action beyond the header arrow. (Unreachable in practice because MethodPicker hides the entry when the count is 0.)
- Normal path — <PageHero icon={meta.icon} color={meta.color} title="{meta.label} programs" subtitle="A whole week planned out — pick the program, then today's day."/>.
- <LevelPicker color={meta.color} compact /> — always compact here.
- SectionHeader "Choose a program".
- One Pressable Card per program, sorted so programs matching your level come first, then by beginner→intermediate→advanced. Selected card gets border + colour+'18'. Each: Row[Icon 22 + h3 name, right Badge = "Beginner|Intermediate|Advanced" or "{level} · for you" when it matches your level, coloured #3FBF7F / #E8A33D / #E5533D]; caption blurb; a Row of three small Chips "{daysPerWeek}×/week", "{blockWeeks} weeks", "~{h} h/week" (Math.round(weeklyMinutes(p)/60)); caption textFaint "Best for: {bestFor}".
- IF a program is selected: a Card accent=colors.accent with label "How you'll know it's working" + program.progressMarker; then SectionHeader "{program.name} — pick your day" and a wrapping Row of day Chips (2–6 per program).
- IF program AND day: a Card accent=meta.color containing: Row[h3 day.label, Badge "~{day.minutes}m"]; caption day.purpose; Divider; label "Prescription" + day.prescription; IF day.method resolves, label "Method · {method.label}" + method.progressNote; Divider; label "{n} exercise(s) will be pre-loaded"; the numbered list; and IF preview.length < day.exercises.length, a caption "Some of this day's exercises aren't in your library yet — add them from the library once you're in the session."
- Bottom Button "Start {day.label}" / "Pick a day" (disabled), colour = meta.color.
- Footer caption, centred: "Days are pre-loaded, never locked — add, remove or reorder anything once the session starts."

**Interactions**

- Tap a program card → select, and RESET day to null. Tapping the already-selected program DESELECTS it (setProgram(active ? null : p)).
- When a category has exactly one program it is pre-selected on mount (useState initial value).
- Tap a day chip → select; tapping the selected chip deselects it.
- LevelPicker → writes experienceLevel and immediately re-sorts the program list.
- "Start {day}" → begin(sessionType, { label: `${program.name} · ${day.label}`, style: programStyleTag(program, day) = `${program.key}:${day.key}`, prefillSlugs: day.exercises }) then replace('ActiveSession'). NOTE: level does NOT trim a program day's exercises — the full list is always used.

**What it shows, and from where**

- Programs ← data/programs.programsFor(sessionType), 34 total across 141 days.
- "~{n} h/week" ← weeklyMinutes(p) = sum of every day's `minutes`, divided by 60 and rounded.
- Level badge colour ← a LOCAL const LEVEL_COLOR in this file (#3FBF7F / #E8A33D / #E5533D) — hard-coded hex, not theme tokens; the same map is duplicated in SpecialProgramsScreen.
- Level label ← data/programs.LEVEL_LABEL (note: 'advanced' reads "Advanced" here, but lib/level.LEVEL_LABELS renders the same level as "Pro" in the LevelPicker on the same screen).
- Method block ← data/trainingMethods.findMethod(day.method) — optional per day.
- Preview list ← exerciseRepo.exercisesBySlugs(day.exercises) (no level filtering).

**What it writes**

- startSession(sessionType, { label, style }) INSERT into `sessions`; `style` = "programKey:dayKey" e.g. "ma-fight-camp:spar1".
- addExerciseToSession() per resolved slug into `exercise_logs`.
- LevelPicker → users.experience_level.

**Empty, loading and error states**

- Zero programs for the type → hero-only dead-end screen described above.
- One program → auto-selected, so the user lands straight on the day chips.
- Program selected, no day → progressMarker card and day chips render, no preview, button disabled and labelled "Pick a day".
- Missing library slugs → the "Some of this day's exercises aren't in your library yet…" caption appears (this is the one screen that says so).
- No loading/error states.

> Programs are the only place a session's `style` carries a colon-joined program:day tag; achievementsRepo relies on the analogous `special:` prefix for special programmes. Level affects ORDER only here, never content — a beginner can start an advanced program with one tap.

#### SpecialProgramsScreen

**Route** `SpecialPrograms (params: undefined). options={{ title: '' }}.`  
**Reached from** Only the "Special Programmes" card on TrainScreen.

Browse the 61 themed programmes — military, elite sport, historical warrior cultures, superheroes/bodybuilders, urge-busters and everyday routines — grouped by category.

**Layout, top to bottom**

- <PageHero icon='mindbody.special' color={colors.accent} title="Special programmes" subtitle="Train like a soldier, a monk, a legionary — each with its own week and its own diet."/>
- A disclaimer Card (accent=colors.textFaint): Icon 'core.info' 16 + "Every programme is inspired by and adapted from its source for a normal person with limited kit — never the dangerous parts. Each says what's real and what's adapted."
- Then, for each category in SPECIAL_CATEGORY_ORDER (military, athlete, historical, superhero, counters, lifestyle — derived from a PREFERRED_ORDER array with any missing category appended so a new one can never be silently dropped): a SectionHeader with the category label, a caption with the category blurb (marginTop -6), and one Pressable Card per programme.
- Category labels/blurbs: "Military, Tactical & Service" / "Selection-style preparation from real armed-forces and first-responder tests." (6 programmes) · "Elite Sport" / "How the best footballers, boxers, sprinters and swimmers actually train — in season and out." (8) · "Warriors of History" / "How legendary fighting cultures actually built their bodies." (31) · "Superheroes, Legends & Bodybuilders" / "Training inspired by heroes, screen icons and the greatest bodybuilders — real and fictional." (9) · "Quick Counters & Urge-Busters" / "On-demand 2–10 minute protocols to ride out a craving or impulse and shift your focus." (3) · "Everyday Special Ops" / "Short, equipment-light routines for real life — desk, dawn, travel, a single cell." (4).
- Each programme Card (accent = programme.accent): Row[a 44×44 rounded-14 tile with backgroundColor = accent+'22' holding Icon 24, then column(h3 name numberOfLines=1 / caption tagline numberOfLines=2), then Icon 'core.forward' 18]. Below that a wrapping Row of four pills: Badge "{Beginner|Intermediate|Advanced}" in the same hard-coded LEVEL_COLOR map, Chip "{daysPerWeek}×/week", Chip "~{h} h/week", Chip "+ diet" coloured theme.colors.calories.
- Footer caption, centred: "{SPECIAL_PROGRAMS.length} programmes · pick one to read its story, its week and how they ate." → renders as "61 programmes · …".

**Interactions**

- Tap any programme card → navigate('SpecialProgramDetail', { programKey: p.key }).
- That is the only interaction on this screen — no filtering, no search, no level filter, nothing collapses.

**What it shows, and from where**

- Programmes ← data/specialPrograms.SPECIAL_PROGRAMS: 61 entries, 302 training days total. Levels: 7 beginner, 31 intermediate, 23 advanced. 29 of the 61 carry a safetyNote.
- Category grouping ← SPECIAL_CATEGORY_META + SPECIAL_CATEGORY_ORDER.
- "~{h} h/week" ← specialWeeklyMinutes(p)/60 rounded (sum of every day's minutes).
- Level label ← data/programs.LEVEL_LABEL.

**What it writes**

- Nothing. This screen is read-only.

**Empty, loading and error states**

- No empty, loading or error state exists — the whole screen is a static constant. A category with zero programmes would render its header and blurb with nothing beneath it (does not currently happen).

> A 61-item scroll with no search or filter is the obvious redesign target. The category ordering deliberately guards against a new category being invisible (a real bug the comment records: the 'athlete' programmes shipped complete but unreachable when the order array was hard-coded per screen).

#### SpecialProgramDetailScreen

**Route** `SpecialProgramDetail { programKey: string }. options={{ title: '' }}.`  
**Reached from** Only from a card on SpecialProgramsScreen.

One themed programme in full: origin story and ethos, an honesty/safety note, its training week (each day startable), and its diet with real per-meal macros that can be logged to today's food diary.

**Layout, top to bottom**

- IF findSpecialProgram(key) misses: the screen renders a single Text variant="h2" "Programme not found" and nothing else.
- <PageHero icon={program.icon} color={program.accent} title={program.name} subtitle={program.tagline}/>
- A wrapping Row of four pills: Badge level (coloured with program.accent here, unlike the list screen), Chip "{daysPerWeek}×/week", Chip "{blockWeeks} weeks", Chip "~{h} h/week".
- Story Card (accent = program.accent): label "Origin" + program.origin (a full paragraph), Divider, then Row[Icon 'core.pr' + the ethos line in bold italic].
- Honesty Card (accent = colors.textFaint): Icon 'core.info' + label "What's real, what's adapted" + program.authenticityNote. IF program.safetyNote exists (29 of 61): a Divider then Icon 'core.info' in colors.warning + label "Train it safely" (warning-coloured) + the safety note.
- SectionHeader "The training week", then one Card per day (302 days across the catalogue; 4–6 per programme). Collapsed header Row: Icon = metaFor(day.sessionType).icon in that type's colour + bodyStrong day.label + caption day.focus (numberOfLines=1) + right Badge "~{day.minutes}m". Expanded: Divider, label "Prescription" + day.prescription, label "{resolved}/{total} exercises pre-loaded", the numbered exercise list, and Button size="sm" "Start {day.label}" coloured program.accent.
- SectionHeader "{program.diet.name}" (e.g. "Field-ready fuelling", "The legionary ration", "Chanko-nabe, honestly scaled").
- Diet Card (accent = colors.calories): program.diet.approach paragraph; Row[Icon 'nutrition.protein' + program.diet.macroSlant in calories colour]; Divider; Row[label "A day of eating" | caption "≈ {kcal} kcal · {n}P {n}C {n}F"]; then one block per meal — Row[bodyStrong meal.label | (unless hydrationOnly) a Pressable showing "{meal.calories} kcal" + Icon 'core.add'], caption meal.detail, and a textFaint line listing the resolved foods joined by ' · ' with "×{servings}" appended when servings ≠ 1; then one Row per diet note (Icon 'core.info' 14 + the note); then Button size="sm" "Log this whole day to my diary" (icon 'nutrition.calories', calories colour); then a centred caption "Meals log as their real foods, with full macros and micronutrients."
- Footer caption, centred: "Days are pre-loaded, never locked — add, remove or reorder anything once the session starts."

**Interactions**

- Tap a day header → expands/collapses that day (one at a time, state `openDay`). exercisesBySlugs is called lazily, only for the open day.
- "Start {day.label}" → begin(day.sessionType, { label: `${program.name} · ${day.label}`, style: specialStyleTag(program, day) = `special:${program.key}:${day.key}`, prefillSlugs: day.exercises }) then replace('ActiveSession'). The session type comes from the DAY, not the programme — one programme spans categories (across the catalogue: 78 strength days, 57 outdoor, 52 calisthenics, 50 martial_arts, 27 cardio, 16 meditation, 14 mindbody, 8 sport).
- Tap a meal's "{kcal} kcal +" → mealToDiaryInputs(meal).forEach(addPreciseFood) then Alert.alert('Logged', `{meal.label} ({kcal} kcal) added to today's {mealType}.`). No confirmation before writing.
- Tap "Log this whole day to my diary" → logs every non-hydrationOnly meal then Alert.alert('Logged', `{diet.name} — {kcal} kcal across {n} meals added to today's diary.`). Also unconfirmed, and repeatable — tapping twice logs the day twice.
- No level picker on this screen; level never affects a special programme.

**What it shows, and from where**

- Programme ← data/specialPrograms.findSpecialProgram(route.params.programKey).
- Day exercise preview ← exerciseRepo.exercisesBySlugs(day.exercises); the "{n}/{m} exercises pre-loaded" line makes missing library slugs explicit.
- Diet numbers ← lib/specialDiet.dietNutrition(program): looks up data/specialDietPlans.SPECIAL_DIET_BUILDS[program.key] (all 61 programmes have a build), resolves each component id against data/foods.FOOD_DB, scales calories/protein/carbs/fat/fibre and micros by `servings`, rounds calories to whole numbers and macros to one decimal, and sums the meals into the day total. A meal with zero components is flagged hydrationOnly and shows no kcal and no add button.
- Day icon and colour per day ← constants/sessionTypes.metaFor(day.sessionType).

**What it writes**

- Start a day → sessionRepo.startSession(day.sessionType, { label, style: 'special:<programKey>:<dayKey>' }) INSERT into `sessions`, plus one `exercise_logs` row per resolved slug. achievementsRepo reads this `special:` prefix to count distinct special programmes (achievement 118 targets 3).
- Log a meal / log the day → nutritionRepo.addPreciseFood() INSERT into `food_entries` — one row per component food, logMode 'precise', isEstimated false, quantity = servings, macros and micros scaled on insert, date = today.

**Empty, loading and error states**

- Bad programKey → "Programme not found" (h2) and nothing else — no back button beyond the header, no recovery path.
- A day whose slugs are missing → "{n}/{m} exercises pre-loaded" shows the shortfall; a day where none resolve shows "0/{m}" with an empty list and the Start button still enabled (the session begins with no exercises).
- A hydration-only meal → shows its label and detail but no kcal, no + button, and is excluded from "log the whole day".
- No loading or error state on the diet math; a missing food id is simply dropped from the meal (silently lowering the totals).

> The two diet-logging actions write to the food diary with no confirmation dialog and no idempotency — the same day can be logged repeatedly. This is the only screen in the training area that writes nutrition data.

#### ChallengeScreen

**Route** `DailyChallenge (params: undefined). options={{ title: '' }}. Component is exported as `ChallengeScreen`.`  
**Reached from** Only the "Daily Challenge" card on TrainScreen. Nothing on Home or Stats links here.

Spin once a day for a challenge you did not choose, then have it graded automatically from data you already log.

**Layout, top to bottom**

- IF wheelForToday() returns null: <EmptyState icon='core.target' title="No challenges available" message="Every challenge needs something to measure. Enable a tracker or log a session and the wheel will have something to offer."/> — and nothing else.
- <PageHero icon='core.target' color={colors.accent} title="Daily challenge" subtitle="One spin a day. Every challenge is measured from what you actually log — never just ticked."/>
- A centred Card: h3 = "Spin for today" before the day is settled, "Today's challenge" after. When unsettled, a centred caption "One spin a day. Whatever it lands on is yours until midnight — that is rather the point." Then <ChallengeWheel/>: a 260 px SVG disc of 8 wedges (WHEEL_SIZE = 8) filled with DIFFICULTY_COLOR (easy #33D9A6, medium #4F8CFF, hard #FF8A3D) at alternating opacity 0.85/0.6, a 0.3r centre circle, one white 18 px icon per wedge at 0.66r, and a fixed 'core.chevronDown' pointer at the top. Below it a pill "SPIN" button in colors.primary — only while unsettled.
- IF the day has a challenge: a result Card (accent = colors.success when done, otherwise the difficulty colour): Row[Icon 22 + h3 label + caption "{Move|Lift|Fuel|Mind|Care} · {Easy|Medium|Hard} · {10|20|35} pts", plus a Badge "Done ✓" in success green when complete]; the detail sentence; a ProgressBar; a Row["{current} {unit} of {target} {unit}" | "{n}%"]; and a closing caption — "Completed from your logged data — nothing to tick off." when done, otherwise "Tracked automatically. Just go and do it; the app will notice."
- SectionHeader "Your record" then a space-between Row of three StatTiles: "Completed" = stats.completed with sub "of {spun}" (accent primary, icon 'core.target'); "Streak" = stats.streak with sub "best {bestStreak}" (accent warning, icon 'core.streak'); "Points" = stats.points with sub "earned" (accent accent, icon 'core.pr').
- IF history: SectionHeader "Recent" then one Card containing up to 20 rows, Divider-separated: challenge label + "{YYYY-MM-DD} · {difficulty}", with a right-edge Icon 'core.check' in success or 'core.close' in textFaint.

**Interactions**

- Tap SPIN → the wheel calls onPress() IMMEDIATELY (before the animation), which runs spinDailyChallenge(ctx, today) and writes the row; then a 3600 ms Animated.timing with Easing.out(Easing.cubic) rotates to wheelRotationDeg(winningIndex, 8) = 5 full turns minus the winning wedge's centre angle; on completion onSpinEnd() bumps a tick and everything re-reads.
- Once settled the SPIN button disappears and the wheel is set instantly to the winning angle with no animation on subsequent visits.
- There is no manual "mark complete" control anywhere — completion is only ever observed.
- On focus the screen calls refreshChallengeCompletion() then bumps the tick, so finishing the challenge out in the world is noticed on return.

**What it shows, and from where**

- Today's row ← challengeRepo.challengeForDate(todayISO()) → `daily_challenges` WHERE userId AND date.
- The wheel ← challengeRepo.wheelForToday(ctx, date) → lib/challengeWheel.buildDailyWheel(dateISO, { ...ctx, recentKeys }). Segments and winner are BOTH derived from the date via an FNV-1a hash (hashSeed) feeding a mulberry32 generator and a Fisher–Yates shuffle; the winner uses a second generator seeded on `${dateISO}:pick` so the landing slot is uncorrelated with the shuffle. Re-opening the app on the same day gives the same wheel and the same answer.
- recentKeys ← challenge keys from `daily_challenges` in the 14 days STRICTLY BEFORE today; those are excluded from the pool, but only while at least 8 fresh ones remain.
- Eligibility ← ctx.enabled: smoking from smokingRepo.isSmokingEnabled(), prayer from faithRepo.getPrayerSettings()?.enabled, supplements from supplementsRepo.getStack().length > 0, sleep and nutrition hard-coded true. Each read is wrapped in a local safe() so a disabled feature cannot crash the screen.
- Progress "{current} of {target}" ← challengeRepo.measureChallenge → measureMetric(def.metric, date), a 21-branch switch reading real tables: steps/walkDistanceM from activityRepo.getDailySteps; waterMl summing `beverage_entries`; proteinG/fibreG/caloriesLogged/withinCalorieTarget from nutritionRepo.dayNutrition (+ getNutritionGoal, and supplementFoodEntryIds to exclude supplement-created snack rows from the "log every meal" count); sessionMinutes/sessionCount/meditationMinutes/mindbodyMinutes/burnedKcal from `sessions`; hardSets/failureSets/distinctMuscles/newExerciseTried from `set_entries` joined to `exercise_logs` and `exercises`; prayersDone from `prayer_logs`; selfCareDone from `self_care_logs`; supplementsTaken from `supplement_stack` + `supplement_logs`; smokeFreeDay from `smoking_entries` (only combusted products break it, per nicotineProducts.productOrDefault); sleepHours from `sleep_logs`. The whole switch is wrapped in try/catch returning 0.
- Percentage ← lib/challengeWheel.challengeProgress(current, target) = min(1, current/target), 0 when target ≤ 0 or current ≤ 0.
- Stats ← challengeRepo.challengeStats(): spun = all rows; completed = rows with completedAt; points = 10/20/35 per completed difficulty; streak counts back day-by-day from today (or yesterday if today is not yet done) up to 400 days; bestStreak scans all completed dates.
- History ← challengeRepo.challengeHistory(20), newest date first, rows whose key no longer exists in the catalogue are dropped.
- Number formatting ← a local fmt(): values ≥ 1000 use toLocaleString, otherwise rounded to one decimal.

**What it writes**

- SPIN → challengeRepo.spinDailyChallenge() INSERT into `daily_challenges` { userId, date, challengeKey, spunAt }. Idempotent by design: if a row already exists for the date it is returned untouched, so you cannot re-spin for an easier one.
- On focus → challengeRepo.refreshChallengeCompletion() UPDATE `daily_challenges` SET completedAt = now, finalValue = current — only when the metric has reached the target, only once, and never un-set (a step count that dips after a sync cannot take a finished challenge away).

**Empty, loading and error states**

- "No challenges available" EmptyState — effectively UNREACHABLE: 32 of the 44 challenges have no `requires` gate, so eligibleChallenges() can never return an empty array and buildDailyWheel never returns null. Worth deleting or re-purposing.
- Not yet spun → "Spin for today", the explanatory caption, an interactive wheel, and NO result card (the result card only renders when a row exists).
- Spun but not complete → result card with a partial bar and "Tracked automatically. Just go and do it; the app will notice."
- Complete → success accent, "Done ✓" badge, and "Completed from your logged data — nothing to tick off."
- A metric whose feature is off → measureMetric returns 0 rather than an error; there is no "unavailable" UI even though ChallengeMeasurement declares an optional `unavailable` flag (never set by any code path).
- No history → the "Recent" section is omitted entirely.

> 44 challenges in five categories: Move 13, Lift 9, Fuel 11, Mind 7, Care 4. By difficulty: 11 easy, 20 medium, 13 hard. Twelve are feature-gated — 7 require nutrition, 2 sleep, 1 prayer, 1 smoking, 1 supplements. Because only 8 of the 44 appear on any given day, most of the catalogue is invisible to the user; there is no browse-all view.

#### LogSessionScreen

**Route** `LogSession (params: undefined). options={{ title: '', presentation: 'modal' }}.`  
**Reached from** Only the "Log a past session" ghost button on TrainScreen.

Record a session after the fact — pick a type and a start–finish time; duration, calories and (for on-foot cardio) a step contribution are computed.

**Layout, top to bottom**

- <PageHero icon='core.calendar' color={colors.primary} title="Log a past session" subtitle="Forgot to start the timer? Record what you did after the fact — just pick the type and the start–finish time. Duration and calories are worked out for you."/>
- SectionHeader "Type" then a wrap grid (gap 8) of all 9 SESSION_TYPE_META cards at width '47%': Icon 22 + bodyStrong label only (no blurb here, unlike SessionTypePicker). Selected gets border + colour+'18'.
- SectionHeader "When" then a Card with: Input "Date" (placeholder "YYYY-MM-DD", keyboardType numbers-and-punctuation), a Row of two Inputs "Start" (placeholder "18:00") and "Finish" (placeholder "19:00"), and a centred caption that reads "Duration: {2h 15m}" in success green when valid, or "Enter times as HH:MM (finish can be past midnight)" in warning otherwise.
- IF the selected type's flow === 'cardio' (Cardio, Outdoor, Sport, Martial Arts AND Custom): a Card with Input "Distance (optional)" (suffix "km", numeric) and a Row["On foot — count as steps" bodyStrong + "Adds an estimated step count to your day. Turn off for cycling, swimming or rowing." caption | a Switch, default ON, trackColor primary].
- SectionHeader "Exercises (optional)" then a Card: when empty, the caption "Add the specific exercises or activities you did — the same library as a live session."; otherwise a numbered list of the drafted exercises (index, icon, name, and a 'core.close' Pressable to remove). Always ends with Button variant="secondary" size="sm" icon='core.add' "Add exercise from library".
- A Card with Input "Notes (optional)" (placeholder "How it went, what you did…").
- Bottom Button: "Log {selected.label}" / "Pick a type", icon 'core.check', colour = the type colour, disabled unless a type is selected AND the times are valid AND the date matches /^\d{4}-\d{2}-\d{2}$/.
- Footer caption, centred: "Saved straight to your history. Open it afterwards to add the specific exercises you did."

**Interactions**

- Tap a type card → selects it; changing to a non-cardio type hides the distance/on-foot card but keeps the entered values in state (they are only applied when isCardio at save time).
- Date/Start/Finish are free-text Inputs — there is NO date picker and NO time picker anywhere on this screen.
- On-foot Switch toggles step contribution.
- "Add exercise from library" → navigate('ExerciseLibrary', { pick: true, draft: true, sessionType: selected?.type }) — pick mode writing into the exerciseDraftStore, pre-filtered to the chosen type when one is selected.
- Remove an exercise → useExerciseDraftStore.remove(id).
- "Log {type}" → logPastSession(...), clearDraft(), an Alert, then navigation.replace('SessionDetail', { sessionId }).

**What it shows, and from where**

- The 9 type cards ← SESSION_TYPE_META.
- Duration ← lib/time.rangeMinutes(start, end), which wraps past midnight when end < start (diff += 1440), then lib/time.minutesToHM for display ("2h 15m" / "45m").
- Drafted exercises ← useExerciseDraftStore.ids mapped through exerciseRepo.getExercise(id), unresolvable ids filtered out.
- Body weight used for the calorie estimate ← useUserStore.currentWeightKg (falls back to 75 kg inside logPastSession).
- The confirmation Alert body ← "{label} · {duration}" plus " · ~{n} kcal" when caloriesBurned > 0 plus "\n+{n} steps added to your day" when stepsAdded > 0.

**What it writes**

- sessionRepo.logPastSession() INSERT into `sessions` with: durationS = max(1, round((end-start)/1000)); distanceM = round(km × 1000) only when isCardio and a distance was typed; pace = durationS / (distanceM/1000) or null; caloriesBurned from lib distributeSessionCalories using each listed exercise's own metValue spread evenly over the elapsed time, falling back to SESSION_TYPE_MET[type] ?? 4 when no exercises were listed; notes trimmed or null; endTime set, so the row is never treated as an active session.
- One `exercise_logs` INSERT per drafted exercise id, in order.
- contributeSteps({ onFoot, distanceM, durationS, dateISO, sessionId }) — folds an estimated step count and distance into `daily_step_logs` (recorded on the session as stepsAdded / distanceAddedM so a later delete can subtract them exactly; sessions never contribute calories to the daily log, to avoid double counting).
- useExerciseDraftStore.clear() after saving.

**Empty, loading and error states**

- Nothing selected → the button reads "Pick a type" and is disabled.
- Invalid times → the caption turns warning-coloured and reads "Enter times as HH:MM (finish can be past midnight)"; the button stays disabled.
- Invalid date string → no visible message at all; the button is simply disabled. This is the weakest feedback on the screen.
- Zero-length duration (start === finish) → treated as invalid (durationMin must be > 0).
- Empty exercise draft → the explanatory caption instead of a list.
- No loading or error state; a failed save is not possible to surface (logPastSession has no error path).

> `useEffect(() => clearDraft, [clearDraft])` returns clearDraft as the CLEANUP function, so the draft is cleared on unmount rather than on mount — the comment says "Start each visit with a clean draft list". In practice it works, and it is what lets the draft survive the round trip to ExerciseLibrary (which is pushed on top rather than replacing this screen). Note Custom has flow 'cardio', so the distance + on-foot controls appear for it.

### Engines behind this area

- **`src/data/splits.ts`** — The 5 strength splits and their 16 days. Each day is an ordered list of exercise SLUGS (compounds first, which is what makes level-trimming safe), plus muscles, a label and a blurb. Exports SPLITS, findSplit(key), findSplitDay(splitKey, dayKey).  
  *Constants:* 5 splits / 16 days total. Push / Pull / Legs (key 'ppl', #4F8CFF, "3 or 6 days/week", best for "Intermediates who train 3–6× a week") — 3 days: Push (6 exercises), Pull (7), Legs (6). Upper / Lower ('upper_lower', #33D9A6, "4 days/week", "Beginners and intermediates") — 2 days: Upper Body (7), Lower Body (6). Bro Split ('bro', #FF7A59, "5–6 days/week", "Bodybuilding-style training") — 6 days: Chest (6), Back (6), Shoulder (6), Arm (10), Leg (6), Abs (8). Full Body ('full_body', #B58CFF, "2–3 days/week", "Beginners, or anyone short on time") — 2 days: Full Body A (5), Full Body B (5). Arnold Split ('arnold', #FFB454, "6 days/week", "Advanced lifters with time to recover") — 3 days: Chest & Back (6), Shoulders & Arms (6), Legs (5).
- **`src/data/trainingMethods.ts`** — The named protocol catalogue — the 'how' for every category, the way splits are the 'how' for strength. Each method carries a structure line, an EffortMetric it progresses by, a progressNote, typicalMinutes and a prefillSlugs list. Exports TRAINING_METHODS, methodsFor(sessionType), findMethod(key), EFFORT_LABEL.  
  *Constants:* 102 methods. Per type: strength 6, calisthenics 8, cardio 16, martial_arts 14, outdoor 15, sport 11, mindbody 16, meditation 16, custom 0. Every single method has prefillSlugs (1–9 slugs). typicalMinutes spans 2 ('med-reset', Quick Reset) to 180 ('out-adventure'). EffortMetric ∈ load | reps | duration | distance | rounds | intensity, labelled "Load lifted / Reps · quality / Time / Distance / Rounds / Intensity". A method's `key` is written into sessions.style — comparability depends on it never changing.
- **`src/data/programs.ts`** — Pre-built weekly programs — a whole week planned out per category, each day carrying purpose, prescription, minutes, an ordered slug list and an optional method key. Exports PROGRAMS, programsFor, findProgram, programStyleTag, weeklyMinutes, LEVEL_LABEL.  
  *Constants:* 34 programs, 141 days. Per type: outdoor 7, sport 5, meditation 5, cardio 4, martial_arts 4, mindbody 4, calisthenics 3, strength 2, custom 0. daysPerWeek 3–7; blockWeeks 6–20. programStyleTag = `${program.key}:${day.key}`. weeklyMinutes = sum of day.minutes. LEVEL_LABEL renders 'advanced' as "Advanced" (lib/level renders the same level as "Pro"). 'str-beginner' declares daysPerWeek 3 but has only 2 days (A/B alternating) — deliberate, but it makes the chip read oddly.
- **`src/data/specialPrograms.ts`** — The themed programme catalogue: origin story, ethos, authenticityNote, optional safetyNote, a multi-discipline week (each day picks its own sessionType) and a prose diet. Exports SPECIAL_PROGRAMS, SPECIAL_CATEGORY_META, SPECIAL_CATEGORY_ORDER, specialProgramsFor, findSpecialProgram, specialStyleTag, specialWeeklyMinutes.  
  *Constants:* 61 programmes, 302 days. Categories: historical 31, superhero 9, athlete 8, military 6, lifestyle 4, counters 3. Levels: 31 intermediate, 23 advanced, 7 beginner. 29 carry a safetyNote. Day session types across the catalogue: strength 78, outdoor 57, calisthenics 52, martial_arts 50, cardio 27, meditation 16, mindbody 14, sport 8. specialStyleTag = `special:${program.key}:${day.key}` — achievementsRepo splits on ':' index 1 to count distinct programmes. SPECIAL_CATEGORY_ORDER is built from a PREFERRED_ORDER list with any missing category appended, so a new category can never fail to render.
- **`src/data/challenges.ts`** — The daily-challenge pool. Every challenge names a ChallengeMetric the app can read from data the user already logs and a numeric target, so completion is observed rather than claimed. `requires` gates a challenge behind an optional feature.  
  *Constants:* 44 challenges. Categories: Move 13, Lift 9, Fuel 11, Mind 7, Care 4. Difficulty: easy 11, medium 20, hard 13. DIFFICULTY_POINTS = { easy: 10, medium: 20, hard: 35 }. DIFFICULTY_COLOR = { easy '#33D9A6', medium '#4F8CFF', hard '#FF8A3D' }. 12 are gated: nutrition ×7, sleep ×2, prayer ×1, smoking ×1, supplements ×1 — leaving 32 always eligible. 21 distinct metrics. Sample targets: steps 8k/10k/12k/18k, walkDistanceM 5000/7000/10000, sessionMinutes 30/45/75, hardSets 12/20/25, failureSets 3/5, distinctMuscles 3/4, waterMl 2500/3000/4000, proteinG 120/150, fibreG 25/30, meditationMinutes 10/15/25, mindbodyMinutes 20/30, sleepHours 7/8, burnedKcal 400/700, prayersDone 5, selfCareDone 3/5.
- **`src/data/specialDietPlans.ts`** — Maps each special programme key to an ordered list of MealBuild objects (mealType + food components with servings), which lib/specialDiet resolves against FOOD_DB. This is what turns a prose diet into loggable macros.  
  *Constants:* 61 keys — one per special programme, so every programme's diet has real numbers. A build with zero components produces a hydrationOnly meal (no kcal, no add button, excluded from "log the whole day").
- **`src/lib/level.ts`** — The experience-level engine. Defines the three levels, their labels/blurbs, the per-level prescription, and slugsForLevel() — which first drops exercises outside the level's difficulty band (but only when at least min(3, list length) remain, because a thin day you can do beats a full one you cannot), then truncates to maxExercises.  
  *Constants:* EXPERIENCE_LEVELS = ['beginner','intermediate','advanced']; LEVEL_LABELS = Beginner / Intermediate / **Pro**. LEVEL_PRESCRIPTION — beginner: maxExercises 4, '3' sets × '8–12' (compounds '5–8'), rest '~1.5–2 min (the app times it per set)'; intermediate: maxExercises Infinity, '3–4' × '6–12' (compounds '4–8'), rest '~2–3 min on compounds, 1–1.5 on isolation'; advanced: maxExercises Infinity, '4–5' × '5–12' (compounds '3–6'), rest '~3–5 min on heavy compounds, 1.5–2 on isolation'. levelOrDefault(): anything that is not 'beginner' or 'advanced' — including NULL — reads as 'intermediate'. prescriptionLine() builds "{sets} sets × {reps} (compounds {compoundReps}) · rest {restHint}".
- **`src/lib/exerciseDifficulty.ts`** — The 1–5 difficulty scale slugsForLevel filters against. difficultyOf() takes an authored value if present, else a named-skill override matched on slug substring (longest match wins), else equipment base + pattern adjustment clamped to 1–5. suitsLevel() answers whether a difficulty sits in the level's band.  
  *Constants:* Scale 1 Anyone / 2 Beginner / 3 Standard / 4 Hard / 5 Elite. LEVEL_BAND = { beginner: [1,3], intermediate: [2,4], advanced: [2,5] } — bands deliberately overlap and nothing is ever hidden. LEVEL_IDEAL = { beginner 2, intermediate 3, advanced 4 }; levelFit = max(0, 1 − gap × 0.28). EQUIPMENT_BASE = machine 2, cable 2.5, dumbbell 3, bodyweight 3, other 3, barbell 3.5. PATTERN_ADJUST includes vertical_push/vertical_pull/hinge +0.5, squat/lunge +0.25, carry/core −0.25, isolation/triceps_extension/cardio −0.5, biceps_curl/lateral_raise −0.75, mobility −1. ~50 slug overrides pin planche/front-lever/back-lever/human-flag/muscle-up/iron-cross/dragon-flag at 5 and pistol-squat/nordic/handstand-push-up/l-sit/weighted-dip/snatch/turkish-get-up at 4.
- **`src/lib/challengeWheel.ts`** — Builds the day's wheel and decides the winner. Both are pure functions of the date, so the animation is a reveal and not a lottery — closing the app, reopening it, or changing the clock gives the same answer. Also holds the progress/completion maths.  
  *Constants:* WHEEL_SIZE = 8. hashSeed is FNV-1a (offset basis 2166136261, prime 16777619, >>> 0). seededRandom is mulberry32 (increment 0x6d2b79f5). Segments = seededShuffle(pool, mulberry32(hash(dateISO))).slice(0, 8); the winner uses a SECOND generator seeded on hash(`${dateISO}:pick`) so the landing slot is uncorrelated with the shuffle. Recently-spun keys are filtered out only while at least 8 fresh ones remain, otherwise the full eligible set is used. wheelRotationDeg = turns × 360 − winningIndex × (360/n), default turns = 5. challengeProgress = min(1, current/target), 0 if target ≤ 0 or current ≤ 0. isChallengeComplete = target > 0 && current >= target.
- **`src/repositories/challengeRepo.ts`** — Spinning, measuring and completing the daily challenge against `daily_challenges`. challengeForDate / wheelForToday / spinDailyChallenge / measureMetric / measureChallenge / refreshChallengeCompletion / challengeStats / challengeHistory. measureMetric is a 21-branch switch reading the same tables the rest of the app writes; every branch is inside one try/catch that returns 0 rather than crashing.  
  *Constants:* recentKeys() looks back 14 days and STRICTLY before today (including today made the settled pointer land on the wrong wedge). spinDailyChallenge is idempotent — an existing row for the date is returned untouched, so re-spinning for an easier challenge is impossible. refreshChallengeCompletion only ever writes once and never un-completes. Streak scans up to 400 days back, starting at today if today is done and otherwise at yesterday. POINTS = { easy 10, medium 20, hard 35 }. challengeHistory default limit 30 (the screen asks for 20). Notable metric rules: 'caloriesLogged' counts meal slots holding at least one non-supplement entry (a fish-oil tap auto-writes a snack row and must not satisfy "log every meal"); 'withinCalorieTarget' returns 0 when nothing was logged ("you cannot be inside a line you never drew"); 'smokeFreeDay' only breaks on COMBUSTED products, so a nicotine pouch or NRT gum does not fail it; 'burnedKcal' sums session calories + daily step-log calories, which are disjoint by construction because on-foot sessions contribute steps but zero calories to the step log.
- **`src/repositories/routinesRepo.ts`** — Saved custom routines in `custom_routines`. A routine is a name plus a JSON array of exercise ids in performance order. hydrate() JSON.parses the ids and resolves each through exerciseRepo.getExercise, silently dropping ids that no longer exist. saveRoutine UPDATES the existing routine when the trimmed name already exists, so templates evolve instead of piling up duplicates.  
  *Constants:* listRoutines() orders by updatedAt DESC. Table columns: id, userId, name, exerciseIds (TEXT, default '[]'), updatedAt, createdAt. Routines are CREATED only from SessionRecapScreen's "Save as routine" card (saveRoutine(name, sessionExerciseIds(sessionId))), listed on TrainScreen and MethodPicker, and DELETED only from TrainScreen. renameRoutine and updateRoutineExercises exist in the repo but no screen calls them — there is no edit UI at all.
- **`src/stores/sessionStore.ts`** — The single entry point every start path funnels through. begin(type, opts) calls sessionRepo.startSession then addExerciseToSession once per prefillSlugs entry (resolved via exercisesBySlugs) and once per prefillExerciseIds entry, sets the store state, and posts a sticky 'training' ongoing notification. resume() re-reads the active session and re-pins that notification after an app restart.  
  *Constants:* begin opts: label, moodBefore, style, splitKey, splitDay, prefillSlugs, prefillExerciseIds. Default restDurationS = 90. Notification title = `FitCoach — ${label ?? metaFor(type).label} in progress`, body "Session timer is running. Return to FitCoach to log sets and finish." activeSession() = most recent `sessions` row with endTime IS NULL.
- **`src/repositories/sessionRepo.ts`** — The session table itself. Relevant here: startSession (INSERT with label/style/splitKey/splitDay/moodBefore/startTime), addExerciseToSession (INSERT into exercise_logs with orderIndex = current count), listSessions (the recent list), sessionExercisePeek (the in-place expansion), logPastSession (the whole LogSession write), activeSession, deleteSession.  
  *Constants:* logPastSession: durationS = max(1, round((end−start)/1000)); body weight defaults to 75 kg when the profile has none; fallback MET = SESSION_TYPE_MET[type] ?? 4; calories from distributeSessionCalories spreading each listed exercise's own metValue evenly across the elapsed time (a past session has no set-level timing); pace = durationS / (distanceM/1000) or null. sessionExercisePeek builds its detail string from COMPLETED sets only: "{n} set(s)" · "{volume} kg" (Σ weight × reps, rounded, toLocaleString) · "{n} min" (Σ durationS / 60). listSessions supports limit / since / until / type; TrainScreen passes { limit: 8 }.
- **`src/lib/specialDiet.ts`** — Turns a special programme's prose diet into real nutrition: resolves each MealBuild component against FOOD_DB, scales calories/macros/fibre/micros by servings, and builds diary rows. Nothing is invented here — every number comes from the food database.  
  *Constants:* Calories rounded to whole numbers, macros to 1 decimal (r1). A build with zero components → hydrationOnly true. dietNutrition falls back to { mealType: 'snack', components: [] } when a programme has fewer builds than sampleDay entries. mealToDiaryInputs emits one PreciseFoodInput per component with quantity = servings and the food's PER-SERVING macros (nutritionRepo scales on insert).
- **`src/lib/effort.ts`** — Supplies hardSetCredit for the 'hardSets' challenge metric — how much of a working set a set is worth, 0..1, under the effective-reps model.  
  *Constants:* STIMULATING_REP_WINDOW = 5, HARD_SET_MAX_RIR = 4, NO_STIMULUS_RIR = 8, LOW_LOAD_REP_THRESHOLD = 15. Full credit at ≤4 reps in reserve, then a linear taper to 0 by 8 RIR. UNKNOWN effort scores a full set — exactly how every set counted before the feature existed. RPE here is the reps-in-reserve scale (10 = none left), not the 6–20 Borg scale.
- **`src/lib/outdoorActivities.ts`** — The 'Track outdoors' strip on TrainScreen. Seven ground activities, each declaring gait (how a step becomes distance), the sessionType it records as, a MET floor, whether to ask for a carried load, and planned minutes for the weather advice.  
  *Constants:* 7 activities; TrainScreen filters out walk and run, showing 5 chips. metFloor: walk 0, run 0, hike 6, trail-run 9, ruck 6.5, stairs 8, cycle 6. carries = true for hike, ruck, stairs. gait 'none' (GPS-only, no steps) for cycle. plannedMin: walk 60, run 40, hike 120, trail-run 60, ruck 60, stairs 30, cycle 75. sessionType is 'outdoor' for all except run, which records as 'cardio'.
- **`src/constants/sessionTypes.ts`** — SESSION_TYPE_META — the nine session types with label, icon, colour and blurb, plus the `flow` field ('lifting' | 'cardio' | 'mindbody') that decides which extra controls a screen shows. Also MOOD_EMOJI / MOOD_LABELS and metaFor().  
  *Constants:* 9 types. flow 'lifting': strength, calisthenics. flow 'mindbody': mindbody, meditation (the only two that get the pre-session mood question). flow 'cardio': cardio, outdoor, sport, martial_arts AND custom (which is why LogSession shows distance + on-foot for Custom). Colours: strength #4F8CFF, calisthenics #7C6CFF, cardio #FF7A59, outdoor #33D9A6, sport #FFB454, martial_arts #E5533D, mindbody #5FD0E0, meditation #B58CFF, custom #9AA6B2. MOOD_EMOJI = 😞😕😐🙂😄, MOOD_LABELS = Rough / Meh / Okay / Good / Great, stored as 1–5. metaFor() falls back to Strength for an unknown type.
- **`src/lib/time.ts`** — Powers LogSession's time fields. parseHM validates /^(\d{1,2}):(\d{2})$/ with 0–23 h and 0–59 m; rangeMinutes wraps past midnight by adding 1440 when the difference is negative; minutesToHM formats "2h 15m" / "2h" / "45m".  
  *Constants:* rangeMinutes returns null on any unparseable time; LogSession additionally requires the result to be > 0, so start === finish is rejected. The date field is validated only by /^\d{4}-\d{2}-\d{2}$/ — 2026-13-45 passes.
- **`src/components/LevelPicker.tsx`** — The shared level control used on SplitPicker (full), MethodPicker (full for strength/calisthenics, compact otherwise) and ProgramPicker (always compact). Reads userStore.user.experienceLevel through levelOrDefault and writes back with updateProfile on every change.  
  *Constants:* Full form = Card + Icon 'core.target' + label "Your level" + SegmentedControl + LEVEL_BLURBS text + prescriptionLine. Compact = the same minus the Card and the blurb. useExperienceLevel() is the hook form screens use to shape their lists.
- **`src/components/ChallengeWheel.tsx`** — The spin wheel: declarative react-native-svg wedges plus the built-in Animated API, so it ships over the air with no new native dependency. The landing angle is computed before the animation starts — the wheel reveals the day's challenge, it does not choose it.  
  *Constants:* Default size 260 px; wedge radius r−2; centre circle at 0.3r; wedge icons at 0.66r, 18 px, white; alternating opacity 0.85 / 0.6. Spin duration 3600 ms with Easing.out(Easing.cubic). An already-settled day sets the value instantly with 0 turns. onPress (the DB write) fires at the START of the spin, onSpinEnd after it.
- **`src/components/ExercisePeek.tsx`** — The read-only exercise list used by both routine and past-session expansions on TrainScreen and MethodPicker — a numbered running order with icon, name and a sub-line. Exists so looking inside a routine no longer requires starting a session you then have to discard.  
  *Constants:* Sub-line = ex.detail when present (finished sessions: "4 sets · 320 kg"), otherwise "{SUB_MUSCLE_LABELS[subMuscle] ?? MUSCLE_LABELS[primaryMuscle]} · {equipmentType}". Default emptyLabel "No exercises in this one yet."; TrainScreen overrides it for sessions with "No exercises were logged in this session."
- **`src/theme/index.ts + src/components/ui/*`** — The design tokens and primitives every screen here composes from: Screen (SafeAreaView top + ScrollView, padding 16, gap 16, paddingBottom 112), Card (radius 16, 1 px border, padding 16, optional 3 px left accent bar), Button (heights sm 38 / md 48 / lg 56, variants primary/secondary/ghost/danger), Chip (pill, small = padV 5 padH 10), Badge (colour + '22' background, radius 8), StatTile, SectionHeader (marginTop 8, marginBottom −4), EmptyState (icon 40, paddingVertical 32, message maxWidth 260), Divider, Row, PageHero.  
  *Constants:* spacing xs 4 / sm 8 / md 12 / lg 16 / xl 24 / xxl 32 / xxxl 48. radius sm 8 / md 12 / lg 16 / xl 24 / pill 999. Typography h1 26/800, h2 20/700, h3 17/700, body 15/500, bodyStrong 15/700, label 13/600, caption 12/500. Dark palette bg #0B1220, card/surface #141C2E, border #26314A, text #EAF0F7, textMuted #9AA6B8, textFaint #63708A; primary #4F8CFF, accent/success #33D9A6, warning #FFB454, danger #FF5D5D, calories #FF7A59. PageHero puts a subtitle inline beside the 44 px tile only when it is ≤ 100 characters, otherwise full-width beneath — most training-hub subtitles exceed that.

### Notes for the redesign

GAPS AND ODDITIES A DESIGNER MUST KNOW:

1. There are SEVEN distinct ways to start a session and they are not presented as a hierarchy anywhere: (a) SessionTypePicker → bare session, nothing pre-loaded; (b) SplitPicker → strength day, level-trimmed; (c) MethodPicker → a named method, tagged in `style`, level-trimmed only for strength/calisthenics; (d) MethodPicker → \"Free session (no method)\", identical to (a); (e) ProgramPicker → a program day, tagged `program:day`, never level-trimmed; (f) SpecialProgramDetail → a programme day, tagged `special:program:day`; (g) a saved routine, from TrainScreen or MethodPicker. Plus LogSession for a past one, and the Walk tracker for anything on the ground. Nothing on the Train screen explains which is which.

2. Starting a saved routine from TrainScreen hard-codes sessionType 'strength'; starting the SAME routine from MethodPicker uses that screen's category. Same routine, different history bucket.

3. 'custom' is a dead end. It has 0 methods and 0 programs, so tapping the Custom category card lands on a MethodPicker showing only a level picker (which does nothing for it), any routines, and \"Free session (no method)\". ProgramPicker for a category with no programs renders a hero-only screen with no button and no way forward except the back arrow.

4. The ChallengeScreen \"No challenges available\" EmptyState is unreachable: 32 of the 44 challenges have no `requires` gate, so eligibleChallenges() can never be empty. Likewise ChallengeMeasurement declares an `unavailable` flag that no code path ever sets — a disabled feature reads as 0 progress with no explanation.

5. Level labelling is inconsistent on the same screen: LevelPicker renders 'advanced' as \"Pro\" (lib/level.LEVEL_LABELS) while the program badges next to it render it as \"Advanced\" (data/programs.LEVEL_LABEL).

6. The level badge colours (#3FBF7F beginner, #E8A33D intermediate, #E5533D advanced) are hard-coded hex duplicated in ProgramPickerScreen and SpecialProgramsScreen, not theme tokens.

7. Level does very little. It trims and difficulty-filters only on SplitPicker and on strength/calisthenics methods. It does not touch program days, special-programme days, or routines. Yet the picker is shown (and writes the profile) on MethodPicker and ProgramPicker for every category.

8. Missing-slug handling is inconsistent: ProgramPicker explains it (\"Some of this day's exercises aren't in your library yet…\"), SpecialProgramDetail shows it numerically (\"3/5 exercises pre-loaded\"), SplitPicker says nothing and can therefore mislabel a short list as level-trimming.

9. Routines have no edit UI. renameRoutine() and updateRoutineExercises() exist in routinesRepo and are called by nothing. The only way to change a routine is to finish a session and re-save under the same name from SessionRecap. Delete exists only on TrainScreen, not on MethodPicker.

10. LogSession uses free-text Inputs for date and time — no pickers. An invalid date gives no message at all, only a disabled button. The date regex accepts impossible dates.

11. SpecialProgramDetail writes to the food diary with no confirmation and no idempotency: \"Log this whole day to my diary\" can be tapped repeatedly and will duplicate every entry.

12. 61 special programmes and 44 challenges are both browsable only in one fixed order with no search, filter or category jump. Only 8 of the 44 challenges are ever visible in a day, so most of that catalogue is invisible to the user.

13. Navigation style is mixed: TrainScreen uses navigate() for routines (so the session screen can be backed out of into Train), while every picker uses replace(). SessionTypePicker and LogSession are the only modal presentations.

14. The 'core.forward' chevron at the right of each recent-session row is decorative — only the left region of the row is pressable.

15. Everything reads synchronously from SQLite on useFocusEffect, so there are no loading states anywhere in this area, and no error states either — failures are swallowed (challengeRepo's try/catch, WeatherCard's safe(), ChallengeScreen's safe()).

---

## 6. Walking, running and outdoor activities

One screen (`WalkScreen`, route `Walk`) is the live tracker for all seven outdoor ground activities — Walk, Run, Hike, Trail run, Ruck, Stairs, Ride — driven by a catalogue in `src/lib/outdoorActivities.ts`. The activity only changes the label/verb/icon, the MET floor, whether a pack-weight field appears, the weather planning minutes and the blurb; underneath, everything still runs as a `'walk' | 'run'` session. Steps come from three channels (expo-sensors `watchStepCount`, a custom native `step-counter` module reading Android `TYPE_STEP_COUNTER` absolute since-boot, and an accelerometer `StepDetector` stopgap), GPS distance comes from an expo-location foreground-service TaskManager task whose fixes pass a three-gate filter (`src/lib/gpsFilter.ts`) before being appended to a single `live_walks` row in SQLite; GPS distance wins over step-estimated distance whenever a route exists. A 3 s flush timer classifies motion (speed × cadence) and auto-pauses after a 25 s confirmation window; the UI polls the tracker at 1 Hz. Finishing writes one `walk_sessions` row plus a roll-up into `daily_step_logs`, and shows an in-place recap with a tile-free SVG route map and post-session margins.

### Screens (3)

#### WalkScreen

**Route** `Walk { mode?: 'walk' | 'run'; activity?: string } | undefined  (src/navigation/types.ts:39; registered in RootNavigator.tsx:113 with options={{ title: '' }} — the native header shows a back arrow and NO title)`  
**File** `C:\Users\fedim\OneDrive\Bureau\FitCoach\src\screens\train\WalkScreen.tsx`  
**Reached from** HomeScreen.tsx:227 quick-action Button 'Walk' -> navigate('Walk', { mode: 'walk' }); TrainScreen.tsx:177/185 Buttons 'Walk' and 'Run' -> navigate('Walk', { activity: 'walk' | 'run' }); TrainScreen.tsx:200 horizontal 'Track outdoors' ScrollView of 5 Cards (Hike, Trail run, Ruck, Stairs, Ride) -> navigate('Walk', { activity: a.key }). The catalogue is filtered with a.key !== 'walk' && a.key !== 'run', so exactly 5 cards, each a Card with accent theme.colors.outdoor, minWidth 104, the activity icon at size 20 and the label in bodyStrong.

The single live tracker for all seven outdoor ground activities. It resolves an OutdoorActivity from the route params, runs one live walk/run session (steps + GPS route + auto-pause + sticky notification), then swaps in-place to a saved-session recap.

**Layout, top to bottom**

- THE SCREEN HAS THREE MUTUALLY EXCLUSIVE STATES: (A) idle/pre-start, (B) active/tracking, (C) recap. All three render inside <Screen> (ScrollView, padding theme.spacing.lg, paddingBottom pad+96, gap theme.spacing.lg, SafeAreaView edges=['top']).
- --- STATE A: IDLE (no summary, !walk.active) ---
- 1. PageHero — 44x44 tinted tile (radius theme.radius.md, background theme.colors.outdoor + '1F'), icon = activity.icon at size 24, title (variant h1) = activity.label ('Walk' / 'Run' / 'Hike' / 'Trail run' / 'Ruck' / 'Stairs' / 'Ride'). No subtitle. right = <Badge> whose label is 'Pedometer' normally, or 'Accelerometer' when Pedometer.isAvailableAsync() resolved false; colour theme.colors.accent (#33D9A6) or theme.colors.warning (#FFB454) respectively.
- 2. Card, centre-aligned, gap theme.spacing.md: ProgressRing size 200, strokeWidth 16, color theme.colors.accent, progress 0 (hard-coded to 0 when !active). Inside the ring: Text variant='display' with tabular-nums showing walk.steps.toLocaleString(), then Text variant='caption' color='textMuted' reading 'steps'. Below the ring: Text variant='h2' tabular-nums = formatDuration(walk.elapsedS). The moving/paused sub-line is NOT rendered when idle.
- 3. Row of THREE StatTiles: 'Distance' (icon cardio.gps = Ionicons map-outline, accent theme.colors.outdoor), 'Pace' (icon cardio.pace = MaterialCommunityIcons speedometer, no accent), 'Calories' (icon nutrition.calories, accent theme.colors.calories #FF7A59). Each StatTile is a Card with a caption label row and the value in h2 tabular-nums.
- 4. (conditional, rare) Text caption color='warning', centred: 'Motion permission was denied. Enable “Physical activity” for FitCoach in Android settings to count steps.' — shown when !walk.active && walk.permissions && !permissions.motion.
- 5. (conditional) Text caption color='textFaint', centred: 'No hardware step counter detected — FitCoach will use GPS distance and the accelerometer.' — shown when hardwareAvailable === false && !walk.active.
- 6. <WeatherCard plannedActiveMin={activity.plannedMin} /> — 60 walk / 40 run / 120 hike / 60 trail-run / 60 ruck / 30 stairs / 75 ride.
- 7. Card (gap 8) — the activity briefing: (a) Text caption textMuted = activity.blurb (exact strings per activity listed in notes). (b) if requiresGps(activity) (Ride only): Text caption in theme.colors.warning — 'Location must be on for this one — a bike has no steps to count, so the route is the distance.' (c) if activity.carries (Hike, Ruck, Stairs): <Input label='Pack / carried load (kg, optional)' placeholder='0' keyboardType='numeric' />. (d) if carries && loadKg > 0: Text caption textFaint — '{loadKg} kg on your back at {Math.round(weightKg)} kg bodyweight — about {Math.round((loadFactor-1)*100)}% more than carrying nothing.'
- 8. Primary Button — title = activity.verb ('Start walk' / 'Start run' / 'Start hike' / 'Start trail run' / 'Start ruck' / 'Start stair climb' / 'Start ride'), or 'Starting…' while walk.starting; icon core.start, size 'lg', color theme.colors.accent, disabled while starting.
- --- STATE B: ACTIVE (walk.active === true) ---
- 1. PageHero — identical, except the Badge label is now SOURCE_LABEL[walk.source]: 'Pedometer' | 'Accelerometer' | 'GPS'.
- 2. Ring Card — ProgressRing progress = (walk.steps % 1000) / 1000, i.e. the ring refills every 1,000 steps; it is NOT a goal ring. Centre: live step count (display) + 'steps'. Below: elapsed time in h2. Then, only when walk.elapsedS - walk.activeS > 30, a caption: '{formatDuration(activeS)} moving · {formatDuration(elapsedS - activeS)} paused'.
- 3. Row of THREE StatTiles — Distance / Pace / Calories, updating at 1 Hz.
- 4. (conditional) Live route Card — rendered only when walk.usingGps. Header row: Icon cardio.gps size 16 in theme.colors.outdoor + Text variant='label' color='textMuted' 'Live route'. Body: <RouteMap route={walk.route} height={200} />.
- 5. (conditional) Auto-pause Card, accent theme.colors.warning — Icon core.info size 18, Text bodyStrong in warning colour 'Auto-paused', then caption: '{walk.pauseReason || "No movement detected."} It resumes on its own as soon as you start moving again.' pauseReason comes verbatim from classifyMotion(): 'Moving too fast to be on foot — looks like a vehicle, so tracking is paused.' / 'Covering ground with no steps detected — looks like a vehicle, so tracking is paused.' / 'No movement detected — paused until you start again.'
- 6. Tracking-status Card — accent theme.colors.success when BOTH channels are live, else theme.colors.warning. Two <SourceRow> entries, each an Icon (core.check when ok / core.info when not, size 17) plus a label in the row colour and a caption detail. Row 1 label 'Hardware step counter': ok -> 'Reading the device step-counter sensor. Keeps counting with the screen off and catches up the moment you return.'; perms known but not ok -> 'Not active — using the accelerometer, which only counts while the app is open. Enable “Physical activity” for FitCoach in Android settings.'; perms still null -> 'Connecting…'. Row 2 label 'GPS route tracking': ok -> 'Foreground service running — records your path and distance even with the app closed or killed. Steps keep climbing from measured distance.'; not ok -> 'Not active — set Location to “Allow all the time” so tracking survives the screen going off.'; null -> 'Connecting…'.
- 7. (conditional) Text caption textFaint centred — 'Notifications are off — enable them for FitCoach to see the session in your notification bar.' (perms && !perms.notifications && active).
- 8. <WalkWeatherLine /> — a single Row (not a card): Icon weather.thermo size 14 tinted HEAT_BAND_COLOR[band], plus one caption line, numberOfLines 2: '{HEAT_BAND_LABEL[band]}, feels like {Math.round(feelsLike)}° — {advice.points[0]}'. Renders nothing if there is no stored reading, or if the band is 'ideal' or 'cool'.
- 9. Button 'Finish', icon core.end, size 'lg', color theme.colors.danger.
- --- STATE C: RECAP (summary !== null; replaces the whole screen) ---
- 1. Centred block (gap 6, paddingVertical theme.spacing.md): Icon core.check size 48 in theme.colors.accent, then Text variant='h1' = '{activity.label} saved' (e.g. 'Ruck saved').
- 2. (conditional, summary.route.length > 1) Card: Text variant='label' color='textMuted' 'Your route' + <RouteMap route={summary.route} height={220} />.
- 3. Row of TWO StatTiles: 'Steps' (icon cardio.steps = MaterialCommunityIcons shoe-print) and 'Distance' (icon cardio.gps, accent outdoor).
- 4. Row of TWO StatTiles: 'Time' (icon core.timer, formatDuration) and 'Calories' (icon nutrition.calories, sub 'kcal', accent theme.colors.calories).
- 5. <PostSessionCard endedAt={summary.endedAt} strain={strain} margins={margins} title={`After this ${activity.label.toLowerCase()}`} /> — e.g. 'After this trail run'. It lists Water / Eat / Smoking (only if isSmokingEnabled()) / Alcohol / Cold plunge / Next hard session, each with an icon, a countdown or window string, and a ProgressBar; tapping a line expands its 'why' + 'advice'; a footer caption reads 'Tap a line for the why. Estimates from the standard evidence — the harder the session, the more each of these costs, and for longer.' The card re-renders every 60 s.
- 6. Button 'Done' -> navigation.navigate('Main').

**Interactions**

- Start button (idle): setSummary(null), resets the warnedNoGps ref, calls walkStore.start(initialMode) where initialMode = activity.gait === 'run' ? 'run' : 'walk'. For Ride (gait 'none') initialMode is 'walk'.
- Finish button (active): captures walk.route, calls walkStore.stop(), and if a result comes back sets local summary state {steps, distanceM, calories, durationS, route, endedAt: Date.now()}. There is no confirmation dialog and no discard option — you cannot abandon a session without saving it.
- Pack / carried load Input (Hike, Ruck, Stairs only): free text, numeric keyboard, comma accepted (packKg.replace(',', '.')). Only positive finite values count. It is read live for the on-screen calorie figure and is NOT persisted anywhere.
- WeatherCard (idle only): pencil icon (core.edit) toggles a manual-entry block with three Inputs (°C / Humidity % / Wind km/h) and two Buttons 'Save' and 'Fetch live'; tapping the advice text expands/collapses the bullet list ('N more' / 'Less').
- PostSessionCard rows (recap): each margin row is Pressable and toggles an expanded 'why' + 'advice'.
- Done button (recap): navigation.navigate('Main').
- Alert (one-shot, fires once per session): 'Location off — no route map' / 'This session is being tracked by steps only. To draw your route and keep tracking with the screen off, enable Location for FitCoach (“Allow all the time”, or at least “While using the app”) in Android Settings → Apps → FitCoach → Permissions.' Triggered by a useEffect when walk.active && permissions resolved && !permissions.gps; guarded by a useRef so it shows only once.
- useFocusEffect -> walkStore.resume() on every focus: reattaches to a session that survived backgrounding or an app kill.
- useLiveWalk(walk.active): reconciles (hardware baseline + gap recovery + refresh) every 1000 ms AND immediately on AppState 'active', so background steps snap into place the instant you look at the screen.
- There are NO manual pause/resume controls, no lap button, no activity switcher inside the screen, no map zoom/pan (the route map is a static SVG), and no swipe or long-press gestures anywhere on this screen.

**What it shows, and from where**

- Step count (ring centre + Steps tile) — walkStore.steps <- getLiveSnapshot().steps <- walkTracking mem.baseSteps + mem.steps, raised as a floor by reconcileFromHardwareBaseline() (native getStepsSinceBoot() − mem.bootBaseline), catchUpFromGap() (lib/walkRecovery.recoverGapSteps) and Pedometer.getStepCountAsync (iOS only).
- Ring fill — (walk.steps % 1000) / 1000, computed inline in WalkScreen.
- Elapsed time — walkStore.elapsedS = Math.round((Date.now() - startedAt) / 1000), recomputed in walkStore.refresh().
- Moving / paused split — walkStore.activeS <- snapshot.activeSec <- walkTracking.activeMs() = now − startTime − pausedTotalMs − current pause; paused = elapsedS − activeS. Shown only when the gap exceeds 30 s.
- Distance — walkStore.distanceM: when usingGps it is getLiveRouteDistanceM() (activityRepo -> geo.routeDistanceM over the filtered live route); otherwise distanceFromSteps(steps, heightCm, mode, liveCadence(steps, activeSec)) from lib/pedometer. Formatted by lib/format.formatDistance (metric: '<x.xx> km' at >=1000 m else '<n> m'; imperial: miles to 2 dp, or yards below 0.1 mi).
- Pace — computed inline: walk.activeS / (distanceM / 1000), i.e. seconds per km from MOVING time; rendered by formatPace ('m:ss /km' or '/mi'), '—' when null.
- Calories (live) — computed inline in WalkScreen: base = met.walkCalories({weightKg, distanceM, durationSec: elapsedS, activeSec, steps}); paceMet = met.walkRunMet(km/h from moving time); flooredMet = outdoorActivities.activityMet(activity, paceMet); when activity.metFloor > 0 and the floor actually raises the MET -> Math.round(met.netCaloriesFromMet(flooredMet, weightKg, activeSec) * loadFactor), otherwise Math.round(base * loadFactor). loadFactor = loadProfile.loadCalorieFactor(profileFor({slug:'rucking'}), weightKg, loadKg) = min(2, 1 + pack/bodyweight).
- Body weight used in every calorie figure — useUserStore(s => s.currentWeightKg) ?? 75. Height for stride — useUserStore user.heightCm ?? 175 (walkStore.heightCm()).
- Source badge — walkStore.source <- snapshot.source, set by walkTracking.configureSession as hardware ? 'pedometer' : gps ? 'gps' : 'accelerometer'.
- Hardware-available badge fallback — Pedometer.isAvailableAsync() in a mount effect.
- Tracking-status rows — hwActive = walk.source === 'pedometer' || permissions.hardware; gpsActive = walk.usingGps || permissions.gps; permissions from walkTracking.getWalkPermissions().
- Live route polyline — walkStore.route <- getLiveRoute() (activityRepo, parseRoute over live_walks.route_json), drawn by RouteMap via geo.normalizeRoute.
- Auto-pause banner — walkStore.paused / pauseReason <- walkTracking mem, set by evaluateMotion() using motionValidation.classifyMotion.
- Weather line — weatherRepo.latestReading() + lib/weather.weatherAdvice(reading, { plannedActiveMin: 45 }) (note: hard-coded 45, NOT activity.plannedMin); band label/colour from HEAT_BAND_LABEL / HEAT_BAND_COLOR.
- Recap Steps/Distance/Time/Calories — the object returned by walkStore.stop(), which is walkTracking.stopWalkTracking() plus met.walkCalories(...). NOTE: this is the plain walk/run calorie figure with NO MET floor and NO pack multiplier — it can differ from the number the user watched during the session.
- Recap strain + margins — postSession.sessionStrain({ sessionType: activity.sessionType, flow: 'cardio', durationMin, distanceM }) and postSession.postSessionMargins(strain, 'cardio', { smokingEnabled: smokingRepo.isSmokingEnabled() }).

**What it writes**

- activityRepo.startLiveWalk({ mode, source: 'accelerometer' }) -> table live_walks (single row id = 1): active, userId, mode, source, startTime, steps 0, distanceM 0, lastLat/lastLng null, routeJson null, updatedAt.
- activityRepo.patchLiveWalk({ bootStepBaseline }) -> live_walks.boot_step_baseline (the native TYPE_STEP_COUNTER since-boot value at session start).
- activityRepo.patchLiveWalk({ steps }) -> live_walks.steps, every 3 s from the flush timer when dirty; also stamps updated_at.
- activityRepo.patchLiveWalk({ source }) -> live_walks.source once the permission/GPS handshake resolves.
- activityRepo.appendLiveRoutePoints(fixes) -> live_walks.route_json, distance_m, steps (Math.max(existing, stepsFromDistance(distance))), last_lat, last_lng, updated_at. Called from the expo-location TaskManager task, i.e. it keeps writing while the app is backgrounded or killed.
- activityRepo.endLiveWalk() -> live_walks.active = false.
- activityRepo.saveWalkSession({...}) -> table walk_sessions: userId, mode ('walk' | 'run' ONLY), startTime, endTime, steps, distanceM, durationS, caloriesBurned, avgPace (activeSec / km, null when distance 0), source, routeJson (JSON.stringify(route) only when route.length > 1, else null), createdAt.
- activityRepo.addSteps(steps, distanceM, calories, todayISO()) -> table daily_step_logs (called from inside saveWalkSession): increments step_count, distance_m, calories_burned for today.
- weatherRepo.saveWeatherReading(...) -> weather table, only via the WeatherCard's manual entry or live fetch.

**Empty, loading and error states**

- Idle with stale numbers: walkStore is a global zustand store and is never reset after stop(). Re-entering the Walk screen after finishing a session shows the PREVIOUS session's step count and elapsed time frozen in the ring until Start is pressed (start() zeroes steps/distanceM/elapsedS/route — but not paused, pauseReason or activeS, which linger for up to one refresh tick).
- 'Starting…' button label: walkStore.start() sets starting: true then immediately false in the same synchronous block, so this label is effectively never visible.
- Permissions unknown: for the first moment after Start, walk.permissions is null and both tracking-status rows read 'Connecting…' with the card in warning colour.
- GPS denied: the one-shot 'Location off — no route map' Alert; no Live route card; distance falls back to steps; the GPS status row reads 'Not active — set Location to “Allow all the time”…'.
- Motion permission denied: the source badge stays 'Accelerometer', the hardware row explains the accelerometer only counts while the app is open, and (after that session) a warning caption appears on the idle screen.
- No hardware step counter: badge 'Accelerometer' in warning colour and the textFaint caption 'No hardware step counter detected — FitCoach will use GPS distance and the accelerometer.'
- Notifications denied: textFaint caption under the status card.
- RouteMap with too little data: renders its own placeholder — a centred textFaint caption 'Waiting for GPS fixes to trace your route…' — whenever normalizeRoute() returns null (fewer than 2 points, or a bounding box under 1 m on both axes).
- No weather reading: WalkWeatherLine renders nothing; WeatherCard shows 'Weather' + 'No reading yet — fetch it, or type it in.' (or 'Checking…' while fetching).
- Recap with no route: the 'Your route' card is simply omitted (summary.route.length <= 1).
- There is no error state, no retry, no loading spinner anywhere on this screen; every failure path degrades silently to a lesser tracking channel.

> The activity identity is display-only. `activity.key` is never persisted: walkStore.start() collapses all seven activities to 'walk' or 'run' and saveWalkSession writes only that. A hike, ruck, stair climb and ride all come back from history as a 'Walk'; a trail run comes back as a 'Run'. The MET floor and the pack multiplier are applied ONLY to the number rendered live on this screen — the recap tile, the walk_sessions row and the daily_step_logs roll-up all use the plain met.walkCalories figure. Ride (gait 'none') is the sharpest case: it warns that GPS is required, but if GPS fails it silently falls back to distanceFromSteps() with a WALK stride, inventing bicycle distance from pedalling-adjacent steps, and its 6.0 MET floor is discarded when the session is saved. The `motion` field (walking/running/vehicle/stationary) is carried all the way through WalkSnapshot but never read by the store or shown in the UI, and classifyMotion's `countDistance` flag and motionValidation.isPlausibleOnFootSegment are dead code — auto-pause stops the CLOCK (activeSec) but never stops distance or steps accruing.

#### WalkDetailScreen

**Route** `WalkDetail { walkId: number }  (src/navigation/types.ts:42; RootNavigator.tsx:124 with options={{ title: 'Walk / Run' }})`  
**File** `C:\Users\fedim\OneDrive\Bureau\FitCoach\src\screens\train\WalkDetailScreen.tsx`  
**Reached from** ONLY from SessionHistoryScreen's 'Walks & Runs' segment (SessionHistoryScreen.tsx:88) — a Pressable Card per session -> navigate('WalkDetail', { walkId: item.id }). Nothing else in the app links here; the WalkScreen recap does not offer a link to it.

The read-only record of one saved walk/run: header identity, route map, four to six stat tiles, and a destructive delete.

**Layout, top to bottom**

- 1. Header Row (gap 12): a 48x48 tile, borderRadius 16, background accent + '22', holding Icon 'cardio.running' (run) or 'cardio.walk' (walk) at size 26. Accent is theme.colors.outdoor for a run, theme.colors.accent for a walk. Beside it: Text variant='h2' = 'Run' or 'Walk', and under it a caption with the start time formatted via new Date(startTime).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }). At the right edge: <Badge label={SOURCE_LABEL[session.source]}> ('Pedometer' | 'Accelerometer' | 'GPS'), coloured outdoor when source === 'gps', else accent.
- 2a. If parseRoute(session.routeJson).length > 1 — Card with a header Row (Icon cardio.gps size 16 in outdoor + Text label 'Your route') and <RouteMap route={path} height={240} />.
- 2b. Otherwise — Card accent theme.colors.textFaint containing Icon core.info size 18 and this exact caption: 'No GPS route was recorded for this session. Runs draw a route only when location is set to “Allow all the time” (or “While using the app”) — otherwise distance is estimated from steps.'
- 3. Row of TWO StatTiles: 'Steps' (icon cardio.steps) and 'Distance' (icon cardio.gps, accent outdoor).
- 4. Row of TWO StatTiles: 'Time' (icon core.timer, formatDurationLong — '1h 20m' / '45m' / '30s' style) and 'Calories' (icon nutrition.calories, Math.round(caloriesBurned), sub 'kcal', accent theme.colors.calories).
- 5. (conditional, only when session.avgPace is truthy) Row of TWO StatTiles: 'Avg pace' (icon cardio.pace, formatPace) and 'Source' (icon cardio.marathon = MaterialCommunityIcons map-marker-distance, value SOURCE_LABEL[session.source] — the same string already shown in the header Badge).
- 6. Button 'Delete session', variant 'ghost', icon core.delete, color theme.colors.danger.

**Interactions**

- 'Delete session' -> Alert.alert('Delete this session?', 'It will be removed from your history.', [Cancel (style cancel), Delete (style destructive)]). Confirming calls activityRepo.deleteWalkSession(session.id) then navigation.goBack().
- Nothing else is interactive — no edit, no share, no re-name, no route zoom, no map interaction, no scroll-linked splits.

**What it shows, and from where**

- Whole record — activityRepo.getWalkSession(route.params.walkId), memoised on walkId; a single SELECT from walk_sessions by id (note: it does not filter by userId).
- Route polyline — lib/geo.parseRoute(session.routeJson) -> RouteMap -> geo.normalizeRoute.
- Distance / pace formatting — lib/format.formatDistance and formatPace, with unit from useUserStore(s => s.user?.unitPreference ?? 'metric').
- Duration — lib/format.formatDurationLong.
- Calories — Math.round(session.caloriesBurned) as stored (no recomputation).

**What it writes**

- activityRepo.deleteWalkSession(id) -> DELETE from walk_sessions, then activityRepo.removeSteps(row.steps, row.distanceM, row.caloriesBurned, toISODate(row.startTime), row.userId) -> decrements daily_step_logs.step_count / distance_m / calories_burned for the day the session started, each clamped at 0 so a double-delete cannot go negative.

**Empty, loading and error states**

- Session not found (bad id, or already deleted): the whole screen is replaced by Text variant='h2' 'Session not found' plus a Button 'Back' -> navigation.goBack().
- No route recorded: the explanatory info Card described above.
- No avgPace (distance was 0): the third stat Row is omitted entirely, so the screen shows four tiles instead of six.
- No loading state — getWalkSession is a synchronous SQLite read inside useMemo.

> Because the activity key is not persisted, this screen can only ever say 'Walk' or 'Run'. A ruck, hike, stair climb or ride is indistinguishable here from an ordinary walk. The 'Source' tile duplicates the header Badge.

#### SessionHistoryScreen — 'Walks & Runs' segment

**Route** `SessionHistory (undefined params) — RootNavigator.tsx:115`  
**File** `C:\Users\fedim\OneDrive\Bureau\FitCoach\src\screens\train\SessionHistoryScreen.tsx`  
**Reached from** Train tab / history entry points elsewhere in the app.

The only index of saved walk/run sessions, and the only route into WalkDetail.

**Layout, top to bottom**

- 1. A SegmentedControl at the top with exactly two options: { value: 'sessions', label: 'Sessions', icon: 'nav.train' } and { value: 'walks', label: 'Walks & Runs', icon: 'cardio.walk' }.
- 2. When 'walks' is selected: a FlatList over listWalkSessions(200), keyExtractor `w${id}`, contentContainerStyle gap theme.spacing.sm, paddingBottom 40.
- 3. Each row is a Pressable Card, accent theme.colors.outdoor for a run / theme.colors.accent for a walk. Left: Icon cardio.running or cardio.walk at size 22 in that accent. Title line (bodyStrong): '{Run|Walk} · {steps.toLocaleString()} steps', followed by a small Icon cardio.gps at size 13 in outdoor when the row has a route (hasRoute = !!routeJson && routeJson.length > 4). Sub-line (caption, textMuted): '{friendlyDate(startTime)} · {formatDurationLong(durationS)} · {formatDistance(distanceM, 'metric')} · {Math.round(caloriesBurned)} kcal'. Right: Icon core.forward size 18 in textFaint.
- 4. Empty list: <EmptyState icon='cardio.walk' title='No walks yet' /> — a 40 px faint icon over an h3 muted title, no message, no call to action.

**Interactions**

- SegmentedControl toggles Sessions / Walks & Runs.
- Tapping a row -> navigate('WalkDetail', { walkId }).
- useFocusEffect reloads listWalkSessions(200) on every focus.
- No swipe-to-delete, no long-press, no filtering, no search, no date grouping.

**What it shows, and from where**

- The list — activityRepo.listWalkSessions(200) (walk_sessions for the primary user, ordered by start_time DESC, limited to 200).
- Distance is formatted with a HARD-CODED 'metric' unit here, ignoring the user's unitPreference (WalkDetail respects it).

**What it writes**

- Nothing.

**Empty, loading and error states**

- Empty: 'No walks yet'.
- No loading or error state.

> Included because it is the sole entry point to WalkDetail. The metric hard-coding is a real inconsistency for an imperial user.

### Engines behind this area

- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\lib\outdoorActivities.ts`** — The catalogue of the seven outdoor ground activities, and the only thing that differentiates them. Each OutdoorActivity declares key, label, verb, icon, gait ('walk' | 'run' | 'none'), sessionType ('outdoor' | 'cardio' | 'sport'), metFloor, carries, plannedMin and blurb. activityFor(key) falls back to the first entry (Walk) for any unknown key; requiresGps(a) is a.gait === 'none'; activityMet(a, paceMet) = Math.max(a.metFloor, paceMet).  
  *Constants:* THE SEVEN, in catalogue order. 1) walk — 'Walk' / 'Start walk' / icon cardio.walk / gait walk / sessionType 'outdoor' / metFloor 0 / carries false / plannedMin 60 / blurb 'Steps, distance and pace, counted with the screen off.' 2) run — 'Run' / 'Start run' / cardio.running / gait run / sessionType 'cardio' / metFloor 0 / carries false / plannedMin 40 / 'Pace-driven, with the route mapped as you go.' 3) hike — 'Hike' / 'Start hike' / cardio.hiking / gait walk / 'outdoor' / metFloor 6 / carries TRUE / plannedMin 120 / 'Uneven ground and gradient cost more than the same pace on pavement.' 4) trail-run — 'Trail run' / 'Start trail run' / cardio.marathon / gait run / 'outdoor' / metFloor 9 / carries false / plannedMin 60 / 'Rougher and slower than road pace for the same effort — the floor accounts for it.' 5) ruck — 'Ruck' / 'Start ruck' / strength.plate / gait walk / 'outdoor' / metFloor 6.5 / carries TRUE / plannedMin 60 / 'Loaded march. The pack weight scales the burn — carrying 25 % of your bodyweight costs about 25 % more.' 6) stairs — 'Stairs' / 'Start stair climb' / cardio.stairs / gait walk / 'outdoor' / metFloor 8 / carries TRUE / plannedMin 30 / 'Climbing is the most expensive thing you can do on foot per minute.' 7) cycle — 'Ride' / 'Start ride' / cardio.cycling / gait NONE / 'outdoor' / metFloor 6 / carries false / plannedMin 75 / 'GPS only — there are no steps on a bike, so the route provides the distance.' DEFAULT_ACTIVITY_KEY = 'walk'. Only three activities show the pack field; only one is GPS-only; two use the run stride.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\services\walkTracking.ts`** — The session engine. Holds an in-memory `mem` object as the single source of truth while tracking (active, mode, source, hardware, startTime, baseSteps, steps, usingGps, dirty, lastObservedAt, estimated, bootBaseline, paused, pauseReason, pausedTotalMs, pausedSince, pauseCandidateSince, resumeCandidateSince, motion, lastTick*). startWalkTracking(mode) is deliberately split: a synchronous part that opens the live_walks row, zeroes mem, attaches the ACCELEROMETER detector and posts the sticky notification (so the UI flips instantly), and an un-awaited configureSession(mode) that (0) banks getStepsSinceBoot() as bootBaseline, (1) starts GPS route tracking, (2) requests motion + notification permission, (3) upgrades the step source to the hardware pedometer, then publishes livePermissions and patches source. attachStepSource() folds the current subscription's tally into baseSteps before swapping, so mid-session upgrades never lose or double-count. reconcileSteps() applies three upward-only corrections in order: exact hardware baseline (getStepsSinceBoot − bootBaseline), gap recovery, and Pedometer.getStepCountAsync (iOS-only; on Android it throws once and sets stepCountSupported = false so it is never retried). resumeWalkTracking() rebuilds mem from the live_walks row after a background/kill, seeding lastObservedAt from row.updatedAt and bootBaseline from row.bootStepBaseline, restarting the GPS service if it died. stopWalkTracking() snapshots, detaches, stops GPS, ends the live row, dismisses the notification, and returns the final tally with GPS distance preferred over step-estimated distance. cleanupOrphanWalk() runs at app start and kills a stale notification/foreground service when no live session exists.  
  *Constants:* Flush timer interval 3000 ms (persists steps when dirty, stamps lastObservedAt, runs evaluateMotion, refreshes the notification when steps OR rounded distance changed). Accelerometer update interval 40 ms (25 Hz — the comment says 25 Hz). Auto-pause needs PAUSE_CONFIRM_MS = 25,000 ms of pause-worthy motion; resume needs RESUME_CONFIRM_MS = 5,000 ms. evaluateMotion skips ticks under 1000 ms. Default height fallback 175 cm, default weight 75 kg. Source resolution: hardware ? 'pedometer' : gps ? 'gps' : 'accelerometer'. durationS is floored at 1 s, activeSec at 1 s. Sticky notification title `{⏸|🏃|🚶} {steps} steps · {km to 2 dp} km`; body `{12-char block bar} {dayTotal} / 8,000 today` + either `Paused — {reason}` or `{n} min moving[ · includes a background estimate] · tap to finish`. dayTotal = daily_step_logs.step_count + live session steps.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\services\locationTracking.ts`** — GPS route tracking via expo-location's Android foreground service. Defines the TaskManager task ROUTE_TASK = 'fitcoach-route', which maps each delivered LocationObject to a GpsFix {lat, lng, accuracy, speed} — passing accuracy and Doppler speed through untouched — and calls activityRepo.appendLiveRoutePoints(fixes) inside a try/catch so a bad DB write can never crash the headless task. requestLocationPermissions() asks foreground first, then (only if granted) the separate Android 'Allow all the time' background prompt. startRouteTracking(mode) returns false on any failure (no permission, no GPS, Expo Go) and the session silently degrades to step tracking.  
  *Constants:* ROUTE_TASK = 'fitcoach-route'. accuracy: Location.Accuracy.BestForNavigation; timeInterval 3000 ms; distanceInterval 5 m between fixes; pausesUpdatesAutomatically false; showsBackgroundLocationIndicator true; activityType Fitness; foregroundService notificationTitle 'FitCoach — {run|walk} in progress', notificationBody 'Tracking your route with GPS. Return to FitCoach to finish.', notificationColor '#4F8CFF', killServiceOnDestroy false. Android manifest permissions (app.config.ts): ACTIVITY_RECOGNITION, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, ACCESS_BACKGROUND_LOCATION, FOREGROUND_SERVICE, FOREGROUND_SERVICE_LOCATION, FOREGROUND_SERVICE_HEALTH, RECEIVE_BOOT_COMPLETED, POST_NOTIFICATIONS, WAKE_LOCK, INTERNET.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\lib\gpsFilter.ts`** — The three-gate GPS filter, the defence against phantom distance. Gate 1 accuracy: fixes vaguer than MAX_ACCURACY_M are dropped outright; missing accuracy is assumed ASSUMED_ACCURACY_M. Gate 2 Doppler speed: only a STRICTLY POSITIVE coords.speed is treated as evidence (0 and negative mean 'unknown', because Android returns 0.0 with no Doppler solution and iOS returns −1); a positive speed >= IMPOSSIBLE_SPEED_MS is rejected 'impossible', below STATIONARY_SPEED_MS is rejected 'stationary'. Gate 3a segment: the hop from the last accepted point must beat segmentGateM(accuracy) or it is 'jitter'. Gate 3b confinement: if the last CONFINEMENT_WINDOW accepted points fit inside CONFINEMENT_RADIUS_M AND their straightness is below STRAIGHTNESS_MIN, the anchor is HELD — the point is not stored, no distance is credited, and normal crediting resumes on its own once a fix lands genuinely far away. Rejected fixes are dropped from the ROUTE as well as the distance, so the drawn path length always equals the credited distance. Helpers: spreadRadiusM, pathLengthM, straightness, isConfined, totalRejected. Reject reasons counted: invalid | accuracy | jitter | stationary | impossible | confined.  
  *Constants:* MAX_ACCURACY_M = 50 (raised from 30 after a measured 400 m block loop at 35 m accuracy returned 0 m before and 356 m after). ASSUMED_ACCURACY_M = 15. ACCURACY_SLACK = 0.75. VAGUE_ACCURACY_M = 25. VAGUE_SLACK = 1.5. MIN_SEGMENT_M = 4. segmentGateM(a) = max(4, a × (a > 25 ? 1.5 : 0.75)) — so a 40 m fix must move 60 m, a 15 m fix 11.25 m. CONFINEMENT_WINDOW = 5 points. CONFINEMENT_RADIUS_M = 15. STRAIGHTNESS_MIN = 0.35. IMPOSSIBLE_SPEED_MS = 9 and STATIONARY_SPEED_MS = 0.3 are imported from motionValidation.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\lib\motionValidation.ts`** — classifyMotion({speedMs, cadenceSpm}) -> MotionVerdict {kind: 'walking'|'running'|'vehicle'|'stationary', countDistance, shouldPause, reason}. The logic: impossible speed -> vehicle regardless of cadence; fast AND cadence known AND not stepping -> vehicle; slow AND not stepping -> stationary; otherwise walking or running by speed. Also exports segmentSpeedMs(distanceM, elapsedMs) and isPlausibleOnFootSegment (unused). walkTracking feeds it GPS distance delta / step delta over each 3 s tick; when there is no GPS but steps are arriving it short-circuits to 'walking' and confirms resume.  
  *Constants:* VEHICLE_SPEED_MS = 7 (~25 km/h). IMPOSSIBLE_SPEED_MS = 9 (~32 km/h; Bolt peaked ~12.4 — the comment notes the discrepancy). STATIONARY_SPEED_MS = 0.3 (~1 km/h). RUN_SPEED_MS = 2 (~7.2 km/h). MIN_ACTIVE_CADENCE = 20 steps/min. PAUSE_CONFIRM_MS = 25,000. RESUME_CONFIRM_MS = 5,000. The four user-visible reason strings are quoted in the WalkScreen layout above. NOTE: `countDistance` is computed but never read by any caller — auto-pause stops the moving clock, not the distance.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\lib\pedometer.ts`** — Two things. (1) The StepDetector accelerometer fallback: magnitude -> EMA low-pass -> adaptive threshold (running mean + sensitivity × stdev) -> peak on the falling edge, then two extra credibility tests — a minimum peak-to-trough AMPLITUDE (rules out rotation, fidgeting, a phone in a bag) and RHYTHM (consecutive stride intervals must be within a tolerance of each other). Candidates are buffered until the rhythm is proved, then the whole warm-up run is credited at once, so the first strides of a walk are not lost. onSample returns the number of steps credited (0, 1, or the whole banked run). (2) The stride model: strideFactorFor(mode, cadence) interpolates the textbook constants around a reference cadence, so a brisk walk is not measured with a strolling stride. distanceFromSteps / stepsFromDistance / stepsFromDuration / estimateStrideLengthM.  
  *Constants:* DAILY_STEP_GOAL = 8000. StepDetector defaults: smoothing 0.6, sensitivity 1.2, refractoryMs 250 (caps cadence ~4 steps/s), adaptation 0.05, minAmplitude 0.1 g, warmupSteps 3, rhythmTolerance 0.5. MAX_STEP_INTERVAL_MS = 2000 (beyond this the rhythm resets). Initial state filtered/mean = 1 g, variance 0.0025. STRIDE_REFERENCE: walk { factor 0.415, cadence 100, min 0.36, max 0.5 }, run { factor 0.5, cadence 155, min 0.44, max 0.65 }. Scaling: ~0.35 of the cadence ratio deviation (`factor × (1 + (ratio − 1) × 0.35)`), clamped to the min/max. Height fallback 170 cm inside estimateStrideLengthM. stepsFromDuration cadences: 160 spm run, 110 spm walk.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\lib\walkRecovery.ts`** — Pure gap recovery for the blind window when JS was not running. Two paths in order of trust: (1) GPS — if the traced route distance implies more steps than were counted, credit the difference (basis 'gps', estimated false); if GPS is present and consistent, credit nothing. (2) Cadence — otherwise estimate the unobserved window from the session's own measured cadence, capped hard (basis 'cadence', estimated true, which flips the notification to '· includes a background estimate'). measuredCadence() falls back to a default when the observed window is under 30 s or no steps were seen. walkTracking.catchUpFromGap() deliberately does NOTHING when a hardware counter is running and there is no GPS evidence, because watchStepCount delivers the batched background total by itself and adding an estimate would inflate the count.  
  *Constants:* MAX_GAP_CREDIT_MIN = 90 (the longest blind window ever credited). MIN_GAP_SEC = 45 (shorter gaps are not estimated). MAX_CADENCE = { walk: 130, run: 190 } steps/min. DEFAULT_CADENCE = { walk: 100, run: 155 }. measuredCadence needs observedMs >= 0.5 min and observedSteps > 0. Height fallback 170 cm.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\modules\step-counter\`** — A private optional Expo native module, Android-only, that reads Sensor.TYPE_STEP_COUNTER's ABSOLUTE since-boot value — the one thing expo-sensors cannot do (watchStepCount is subscription-relative and getStepCountAsync is iOS-only). It registers a listener at SENSOR_DELAY_FASTEST, takes the first reading, unregisters and resolves. index.ts loads it with requireOptionalNativeModule('StepCounter') so an older OTA-updated APK without the native side degrades gracefully: hasHardwareStepCounter() returns false and getStepsSinceBoot() returns null. This baseline is what makes an EXACT step recovery possible after the app is killed: session steps = current − bootBaseline. A negative delta (device rebooted mid-session) discards the baseline rather than trusting bad arithmetic.  
  *Constants:* READ_TIMEOUT_MS = 2500 (the promise resolves null rather than hanging). Module name 'StepCounter'. expo-module.config.json platforms: ['android'] only — iOS has no native side at all. Manifest declares ACTIVITY_RECOGNITION and uses-feature android.hardware.sensor.stepcounter required=false. getStepsSinceBoot() returns Math.round(value) only when finite and >= 0, else null.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\services\backgroundSteps.ts`** — The passive all-day step counter: an expo-background-fetch TaskManager task (DAILY_STEPS_TASK = 'fitcoach-daily-steps') that snapshots the hardware pedometer for today and writes it to daily_step_logs via activityRepo.setDailySteps. syncTodaySteps() is also called once directly at app start (App.tsx:60). registerBackgroundSteps() bails out when BackgroundFetch status is Restricted or Denied.  
  *Constants:* minimumInterval = 60 × 30 = 1800 s (30 min); stopOnTerminate false; startOnBoot true. Distance from distanceFromSteps(steps, heightCm ?? 175, 'walk'); calories from walkCalories({durationSec: 0}) which falls to the step branch. CRITICAL GAP: it reads Pedometer.getStepCountAsync(midnight, now), which is iOS-ONLY. On Android that call rejects, `.catch(() => null)` yields 0 steps and the function returns early, so on this Android-first app the passive counter effectively never writes anything — the daily step total is fed ONLY by activityRepo.addSteps from saved walk sessions and from on-foot generic sessions (sessionRepo.contributeSteps).
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\repositories\activityRepo.ts`** — All persistence for this area, over three tables. LIVE: getLiveWalk / startLiveWalk / patchLiveWalk / endLiveWalk on the single live_walks row (id = 1), plus appendLiveRoutePoints(fixes) — the function the headless location task calls. It reads the current route from SQLite (the only channel shared with the headless context), runs filterFixes against it, appends only accepted points, adds only the accepted path length, and checkpoints steps as Math.max(existing, stepsFromDistance(distance)) so steps keep climbing while the app is dead. When nothing credible arrives it STILL stamps updatedAt, so the stretch is not later mistaken for a blind window and re-credited from cadence. getLiveRoute() / getLiveRouteDistanceM() (geo.routeDistanceM over the stored route). SESSIONS: saveWalkSession (which also calls addSteps for today), listWalkSessions, getWalkSession, deleteWalkSession (which calls removeSteps to undo the day's totals). DAILY: getDailySteps, setDailySteps, addSteps, removeSteps (clamped at 0), stepHistorySince.  
  *Constants:* LIVE_ID = 1 — there is exactly ONE live session slot for the whole app; starting a walk overwrites any existing row. Height fallback in the headless path is 175 cm (safeUserHeightCm reads the DB directly because the zustand store is not hydrated in a task context). listWalkSessions default limit 30; SessionHistoryScreen asks for 200; achievementsRepo and energyRepo ask for 500. Tables: walk_sessions (mode enum walk|run, source enum pedometer|accelerometer|gps, avgPace = s per km, routeJson text), live_walks (adds boot_step_baseline), daily_step_logs (date, step_count, distance_m, calories_burned).
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\stores\walkStore.ts`** — The zustand bridge between the tracker and the screen. State: active, mode, source, startedAt, steps, distanceM, elapsedS, route, usingGps, permissions, starting, paused, pauseReason, activeS. resume() reattaches from getLiveSnapshot(); start(mode) flips the UI live synchronously and fires startWalkTracking un-awaited; refresh() pulls a snapshot and recomputes distance (GPS if a route exists, else distanceFromSteps with a LIVE cadence estimate); reconcile() awaits reconcileSteps() then refresh(); stop() calls stopWalkTracking(), computes calories and avgPace, writes the walk_sessions row and returns the recap tuple. reset() exists but is never called anywhere.  
  *Constants:* liveCadence(steps, activeSec) returns null until activeSec > 60 AND steps > 30 — before that the stride constant is used unchanged. Height fallback 175 cm, weight fallback 75 kg. avgPace = activeSec / (distanceM / 1000), null when distance is 0. routeJson is only written when route.length > 1. stop() uses met.walkCalories with NO MET floor and NO load factor.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\lib\met.ts`** — The calorie engine. walkRunMet(speedKmh) picks a Compendium MET from a step function of pace; gradeMultiplier(gradePct) adjusts for slope; netCaloriesFromMet subtracts resting metabolism (MET − 1) so the burn is not double-counted against TDEE; walkCalories() is the entry point — pace from MOVING time picks the MET, elevation adjusts it, and there are two fallbacks when distance is unusable.  
  *Constants:* kcal = MET × 3.5 × weightKg / 200 × minutes; net uses max(0, MET − 1). walkRunMet bands: <=0 km/h -> 2.0; <4 -> 2.8 (slow walk); <5.5 -> 3.5 (moderate walk); <6.5 -> 5.0 (brisk walk); <8 -> 7.0 (very brisk/jog); <9.7 -> 9.0 (~10 min/mi); <11.3 -> 10.5; <12.9 -> 11.5; else 12.8 (fast run). gradeMultiplier: +8% per 1% incline, −3% per 1% decline, clamped to [0.85, 2.5]. walkCalories fallbacks: no usable distance but steps > 0 -> steps × 0.03 × (weightKg / 70); nothing but time -> netCaloriesFromMet(2.8, ...). activeSec is clamped with Math.min(activeSec, durationSec). SESSION_TYPE_MET includes outdoor: 9, cardio: 7, sport: 7. NOTE: elevationGainM is a supported parameter but NOTHING in the walk/run path ever passes it — the grade multiplier is always 1 here, so hikes and stair climbs get no elevation credit, only their MET floor.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\lib\geo.ts`** — LatLng = [lat, lng] tuples, metres everywhere. haversine(a,b) great-circle distance; routeDistanceM(route) sums consecutive segments; normalizeRoute(route) projects lat/lng into a 0..1 x/y box for the tile-free circuit drawing, preserving aspect ratio (both axes share one scale), centring the shape and flipping latitude so north is up; parseRoute(json) safely parses stored route JSON, filtering to 2-element arrays.  
  *Constants:* Earth radius R = 6,371,000 m. Metre-per-degree constant 111,320, with longitude corrected by cos(midLat). normalizeRoute returns null when route.length < 2 OR when both spans are under 1 m ('essentially stationary') — that null is what makes RouteMap show its 'Waiting for GPS fixes…' placeholder. Min/max are found with an explicit loop rather than Math.min(...spread), because a route of thousands of fixes overflows the Hermes call stack when spread.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\components\RouteMap.tsx`** — The route drawing. There is NO map: no tiles are fetched, nothing leaves the device. It measures its own width via onLayout, normalises the route through geo.normalizeRoute, and draws an SVG with two stacked <Path> elements — a soft shadow line under the main line — plus optional start/end pins.  
  *Constants:* Default height 200 (WalkScreen live route 200, WalkScreen recap 220, WalkDetail 240). Padding 16 on all sides. Shadow path: stroke = colour + '33' at strokeWidth 9. Main path: strokeWidth 3.5. Both strokeLinejoin/Linecap 'round'. Markers (default on, never disabled by any caller): start Circle r 6 filled theme.colors.success, end Circle r 6 filled theme.colors.danger, both with a 2 px white stroke. Default stroke colour theme.colors.outdoor. Renders nothing until width > 0 (one layout pass). Empty state: centred caption 'Waiting for GPS fixes to trace your route…' in textFaint.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\lib\loadProfile.ts`** — Supplies the pack multiplier for the three carrying activities. WalkScreen calls profileFor({ slug: 'rucking' }) — which resolves to { bwFraction: null, loadMode: 'carried' } — then loadCalorieFactor(profile, bodyweightKg, packKg).  
  *Constants:* carried: min(2, 1 + loggedKg / bodyweightKg) — a 20 kg pack at 80 kg is ×1.25, capped at ×2. (added: min(1.6, 1 + kg / (2 × bw)); external/none: 1.) The file also carries slug entries for rucking, hiking, trekking, mountaineering, stair-climbing-outdoor and outdoor-bootcamp, all loadMode 'carried' — but the WalkScreen hard-codes slug 'rucking' for every carrying activity, so hike and stairs use the ruck profile.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\lib\postSession.ts`** — Drives the recap's PostSessionCard. sessionStrain() is called with flow 'cardio' for every outdoor activity, so it uses the cardio branch: a type intensity multiplied by a duration term, with pace able to raise or lower it. postSessionMargins(strain, 'cardio', ...) then produces the margin list.  
  *Constants:* Cardio score = intensity × (0.4 + 0.6 × min(durationMin/90, 1)). TYPE_INTENSITY: outdoor 0.5, cardio 0.7, sport 0.8 — so Walk/Hike/Trail run/Ruck/Stairs/Ride enter at 0.5 and Run at 0.7. Pace overrides: under 6 min/km -> intensity at least 1 and driver 'a fast pace'; under 8 -> at least 0.8; over 11 -> at most 0.35. Driver strings added at >= 81 min and at >= 8 km ('{x.x} km'). Levels: <0.3 light, <0.6 moderate, <0.85 hard, else brutal; labels 'an easy session' / 'a solid session' / 'a hard session' / 'a brutal session'. Margins (minutes after the end, scaled linearly from easy to brutal): Water 0; Eat wait 15->30 with a window closing 120->60; Smoking 60->150 (only when isSmokingEnabled()); Alcohol 90->300; Cold plunge 0 for cardio (the lifting-only 240->360 rule does not apply); Next hard session 720->2880 min for non-lifting.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\lib\activitySteps.ts`** — NOT used by the walk tracker at all — its only caller is sessionRepo.contributeSteps (src/repositories/sessionRepo.ts:267), which folds a generic on-foot SESSION (logged through the session screen rather than this tracker) into the day's step total. estimateActivitySteps picks the gait from pace, then converts distance -> steps, or duration -> steps when distance is unknown.  
  *Constants:* RUN_SPEED_KMH = 7 is the walk/run gait threshold. Height fallback 170 cm. Steps are added with 0 kcal so the session keeps ownership of the burn; the contribution is recorded on sessions.stepsAdded / distanceAddedM so a delete can subtract exactly what was added.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\lib\format.ts`** — Every number on both screens is rendered through this file.  
  *Constants:* formatDuration -> 'h:mm:ss' above an hour, else 'm:ss' (used for the live clock and the recap Time tile). formatDurationLong -> '1h 20m' / '1h' / '45m' / '30s' (used on WalkDetail and in history rows). formatDistance metric: '<x.xx> km' at >= 1000 m, else '<n> m'; imperial: '<x.xx> mi' at >= 0.1 mi, else '<n> yd' (metres × 1.09361). formatPace: seconds-per-km -> 'm:ss /km', or × 1.609344 -> 'm:ss /mi'; returns '—' for null/0/non-finite.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\services\sessionNotifications.ts + src\lib\progressBar.ts`** — The sticky live-session notification. Channel 'active-session' at AndroidImportance.LOW (silent, no heads-up), vibration disabled, sticky true and autoDismiss false so it cannot be swiped away while tracking. A stable identifier per key ('active-session-walk') means every update replaces in place without flicker. progressBar draws a text bar out of block characters because Android's native notification progress bar is not exposed through expo-notifications.  
  *Constants:* Bar width 12 characters, FILLED '█' / EMPTY '░', rendered as '████████░░░░ 62%'. Notification accent colour '#4F8CFF'. updateOngoingNotification is a no-op unless showOngoingNotification already ran for that key. NOTE: while a GPS session runs the user sees TWO notifications — this counter plus the OS-required foreground-service one from expo-location.
- **`C:\Users\fedim\OneDrive\Bureau\FitCoach\src\lib\weather.ts (+ components/WeatherCard.tsx)`** — Feeds the pre-start WeatherCard and the one-line in-session WalkWeatherLine. weatherAdvice() bands the FEELS-LIKE figure (heat index above 27 °C, wind chill below 10 °C) and returns a headline plus bullet points; WalkScreen shows only points[0] mid-session and reads the stored reading only — it never fetches during a session, deliberately, because the foreground service is already busy.  
  *Constants:* heatBand thresholds on feels-like: <5 'cold', <12 'cool', <24 'ideal', <30 'warm', <38 'hot', else 'extreme heat'. HEAT_BAND_COLOR: cold #4FC3F7, cool #4F8CFF, ideal #33D9A6, warm #FFB454, hot #FF8A3D, extreme #FF5D5D. The in-session line is suppressed entirely for the 'ideal' and 'cool' bands, and hard-codes plannedActiveMin: 45 instead of the activity's own plannedMin.

### Notes for the redesign

GAPS, ODDITIES AND ONE-PLACE-ONLY THINGS — every one of these was read from the code, not inferred.

1. THE ACTIVITY IS NOT PERSISTED. `activityFor()` resolves seven activities, but walkStore.start() collapses them to `'walk' | 'run'` (gait === 'run' ? 'run' : 'walk') and `walk_sessions.mode` is a two-value enum. Hike, Ruck, Stairs and Ride all save as 'Walk'; Trail run saves as 'Run'. WalkDetail and the history list can only ever say 'Walk' or 'Run'. If v3 keeps the seven activities, the schema needs an activity column.

2. THE LIVE CALORIE NUMBER IS NOT THE SAVED ONE. WalkScreen computes calories with the MET floor and the pack multiplier; walkStore.stop() recomputes with plain `walkCalories` — no floor, no load. So for Hike (floor 6), Trail run (9), Ruck (6.5), Stairs (8), Ride (6) and for any carried pack, the recap tile, the walk_sessions row and the daily roll-up all show a LOWER number than the one the user watched climb. This is a straightforward inconsistency, not a rounding difference.

3. RIDE IS THE WEAKEST OF THE SEVEN. gait 'none' means "GPS or nothing", and the screen says so — but nothing enforces it. start() passes 'walk', so if GPS fails the ride silently accrues distance from `distanceFromSteps(steps, height, 'walk')`, i.e. bicycle kilometres invented from a 0.415 × height walking stride. Its 6.0 MET floor is then discarded on save. The auto-pause classifier also has no cycling case: at >= 7 m/s (25 km/h) with a step sensor reporting no cadence, `classifyMotion` returns 'vehicle' and the session auto-pauses — a fast descent will pause a ride.

4. THE PASSIVE ALL-DAY STEP COUNTER DOES NOT WORK ON ANDROID. `syncTodaySteps()` depends on `Pedometer.getStepCountAsync`, which is iOS-only; on Android it rejects and the function returns 0 without writing. On this Android-first app, `daily_step_logs` is fed only by `addSteps` from finished walk sessions and by `sessionRepo.contributeSteps` for on-foot generic sessions. The Home screen's step ring ('of 8,000') therefore shows only tracked activity, never ambient walking — despite the native `step-counter` module already being able to read the absolute since-boot value that would fix it.

5. AUTO-PAUSE STOPS THE CLOCK, NOT THE DISTANCE. `classifyMotion` returns `countDistance: false` for vehicle and stationary verdicts, but no caller reads that field, and `isPlausibleOnFootSegment` is dead code. While paused, `activeMs()` stops advancing (so pace and calories are protected) but GPS fixes keep being appended and steps keep being credited. The gpsFilter's stationary/confinement gates are the only thing standing between a bus ride and inflated distance, and they run in a different process from the pause logic.

6. THE MOTION KIND IS COMPUTED AND THROWN AWAY. `mem.motion` ('walking' | 'running' | 'vehicle' | 'stationary') is maintained every 3 s and carried through `WalkSnapshot.motion`, but walkStore never maps it into state and no UI shows it. There is a free, already-working signal here for a v3 design.

7. NO MANUAL PAUSE. There is no pause button, no resume button, no discard. The only two controls in a session are Start and Finish, and Finish always saves. Pausing is entirely automatic and requires 25 s of confirmation before it engages (5 s to resume).

8. THE RING IS NOT A GOAL RING. `(steps % 1000) / 1000` refills every thousand steps with no label saying so. Users will read it as progress toward something.

9. STALE STATE ON RE-ENTRY. walkStore is global and `reset()` is never called. After finishing a session and navigating away, returning to the Walk screen shows the last session's step count and frozen elapsed time in the ring until Start is pressed. start() also does not clear `paused`, `pauseReason` or `activeS`.

10. ONE LIVE SESSION, GLOBALLY. `live_walks` has a hard-coded `LIVE_ID = 1`. Starting any activity overwrites whatever was there. There is no concept of a second concurrent session, and no guard warns you.

11. TWO NOTIFICATIONS DURING A GPS SESSION: FitCoach's own sticky counter (steps · km, block-character bar, moving minutes, 'tap to finish') plus the OS-mandated expo-location foreground-service notification ('FitCoach — run in progress' / 'Tracking your route with GPS. Return to FitCoach to finish.'). Nothing reconciles them.

12. WALKDETAIL IS REACHABLE FROM EXACTLY ONE PLACE — the 'Walks & Runs' segment of SessionHistoryScreen. The WalkScreen recap does not link to it, and there is no deep link. That history list also hard-codes `formatDistance(..., 'metric')`, ignoring the user's unit preference that WalkDetail honours.

13. THE PACK WEIGHT IS NEVER SAVED. It lives in component state, affects only the live figure, and is lost on Finish. It is also re-typed every session, and all three carrying activities are scored with the hard-coded `slug: 'rucking'` profile.

14. NO ELEVATION ANYWHERE. `walkCalories` accepts `elevationGainM` and `gradeMultiplier` is fully implemented (+8%/−8% per 1% grade, clamped 0.85–2.5), but no walk/run caller ever passes it, and altitude is never read from the GPS fixes. Hike and Stairs are compensated purely by their flat MET floor. `gradeMultiplier` is even imported into WalkScreen and left unused.

15. THE IN-SESSION WEATHER LINE HARD-CODES `plannedActiveMin: 45` instead of the activity's own plannedMin (a 120-minute hike is advised as a 45-minute one), and is suppressed for the 'ideal' and 'cool' bands.

16. FIRST-SECONDS BEHAVIOUR. Every session starts on the ACCELEROMETER, then upgrades to the hardware counter once motion permission lands, then to GPS if it comes up. So the source badge can visibly change from 'Accelerometer' to 'Pedometer' seconds after starting, and the status card sits at 'Connecting… / Connecting…' in warning colour until the handshake resolves. The 'Starting…' button label exists but is never actually visible because `starting` is set true and false in the same synchronous block.

17. RECOVERY IS GENUINELY GOOD AND WORTH KEEPING VISIBLE. Three independent step channels, a since-boot baseline that survives an app kill, a GPS-evidence-first gap recovery that never estimates when a hardware counter is running, all corrections applied as an upward-only floor so they are idempotent. The one user-facing trace of it is the '· includes a background estimate' fragment in the notification body — nothing on screen ever tells the user that a stretch of their session was estimated rather than measured.

18. VERIFICATION EXISTS. `scripts/verify-engines.ts` asserts the gpsFilter and confinement constants (e.g. that VAGUE_SLACK > ACCURACY_SLACK and that a tight wandering cluster is classified as confined), so these numbers are load-bearing and tested — do not change them casually in a redesign.

---

## 7. NUTRITION — diary, logging modes, food catalogue, micronutrients, supplements, digestion clock, diet plans, AI photo logging

Nutrition is the largest section of FitCoach: one bottom-tab diary screen plus nine pushed/modal screens, all pivoting on a single shared diary date held in `nutritionStore` (supplements and micronutrients follow the same date). Six logging modes exist — precise catalogue search, honest free-text with a keyword estimator, AI photo, hand-entered custom food, composed dish built from other foods, and one-tap meal routines — plus two generators (a seeded diet-plan builder and 61 Special-Programme meal plans). Every logged row denormalises macros AND a 26-key micronutrient profile into `food_entries`, so past days never shift when the catalogue or a custom food changes. On top of the diary sit three engines the rest of the app reads: a gastric-emptying "digestion clock" that stacks every meal into one stomach load, a micronutrient engine with sex-specific RDIs and tolerable upper limits, and a beverage/water/caffeine tracker with weather-adjusted goals. The section's governing principle, repeated in code comments and on-screen copy, is that nothing is ever fabricated: foods without measured micro data contribute zero, composite dishes derive micros from real ingredient recipes, and model-sourced numbers are permanently marked as estimates.

### Screens (10)

#### NutritionScreen

**Route** `Nutrition (TabParamList, no params)`  
**Reached from** Bottom tab bar, 3rd of 5 tabs (Home, Train, Nutrition, Stats, Profile). Icon ICONS.nav.nutrition. Tab bar height 62, no header.

The food diary for one day: calorie/macro dashboard, water & caffeine, the four meals with every logged row, and the entry points to every other nutrition screen. It is also where the digestion clock and the smoking quick-tracker live.

**Layout, top to bottom**

- Screen wrapper: ScrollView, padding theme.spacing.lg, paddingBottom lg+96, gap lg, SafeAreaView edges ['top'].
- 1. DATE NAVIGATOR — Row space-between: left chevron (icon 'core.back', 24px, textMuted) → setDate(addDays(date,-1)); centre Text variant h2 showing 'Today' or e.g. 'Mon, Sep 1' (toLocaleDateString with weekday:'short', month:'short', day:'numeric'); right chevron ('core.forward', 24px) disabled and tinted surfaceAlt when the date is today. There is NO date picker — only one day at a time, and no navigation into the future.
- 2. FASTING BANNER — rendered only when currentFastingState() is non-null AND the date is today. Pressable Card, accent = warning when fasting / success when in the eating window, icon 'faith.fasting'. Copy: "Fasting — {nextLabel lowercased} at {nextTime}" or "Eating window — fast begins at {nextTime}"; right-aligned caption is minutesToHM(minutesUntilNext). Taps navigate to 'Fasting' (outside this area).
- 3. CALORIE + MACRO DASHBOARD — one Card, Row justify space-around. Left: MacroDonut (size 140, strokeWidth 16, four arcs in order protein / carbs / fibre / fat sized by CALORIE share, not grams; centre value = Math.round(day calories) in h2, centre label = '/ {calTarget}'). Right column (gap 12, flex 1, paddingLeft 16): four MacroRow blocks — 'Protein', 'Carbs', 'Fat', 'Fibre' — each a caption label on the left, '{value}/{target}g' caption on the right, and a 6px ProgressBar in theme.colors.protein / .carbs / .fat / .fiber.
- 4. DIET PLAN CARD — Pressable Card, accent theme.colors.calories, icon 'nutrition.calories' 20px. Title 'Diet plan'; caption 'Auto-build a day of meals that hits your macros — shuffle for variety'; trailing 'core.forward' chevron 18px textFaint. → navigate('DietPlan').
- 5. PROGRAMME MEALS CARD — Pressable Card, accent theme.colors.accent, icon 'mindbody.special'. Title 'Programme meals'; caption 'Eat like a legionary, a monk or a hero — log any meal with real macros & micros'. → navigate('ProgrammeMeals').
- 6. MICRONUTRIENTS & SUPPLEMENTS CARD — Pressable Card, accent accent, icon 'micro.vitamins'. Title 'Micronutrients & supplements'. Caption has exactly three states: no data → 'Log whole foods or pills to see vitamins & minerals'; gaps > 0 → '{n} vitamin/mineral{s} running low today'; otherwise → 'On track across vitamins & minerals'. → navigate('Micronutrients').
- 7. WATER CARD — a Row containing one flex:1 Card. Top row: ProgressRing (size 44, strokeWidth 5, colour theme.colors.water) with a 'nutrition.water' icon inside; beside it bodyStrong '{L to 2dp} L' and caption 'of {goal to 1dp} L' plus, when the weather adds water, ' (+{extra to 1dp} for the heat)'. Bottom row: three equal quick-add buttons labelled '+250', '+500', '+750' (WATER_QUICK_ADD), each a water-tinted (water+'22') rounded block.
- 8. CAFFEINE CARD — header Row: icon 'nutrition.caffeine' 18px + bodyStrong 'Caffeine'; right side '{mg} / {limit} mg' rendered in warning colour once over the limit. Full-width ProgressBar in theme.colors.caffeine. Below, four equal preset buttons in fixed order coffee / tea / energy_drink / soda, each a surfaceAlt block with the preset icon (18px, caffeine colour) and a 9px caption of the preset label ('Coffee', 'Tea', 'Energy Drink', 'Soda'). One tap logs one default serving.
- 9. SMOKING QUICK-TRACKER — only when the smoking module is enabled AND the date is today. Pressable Card accent warning, icon 'smoking.cigarette'. Title '{n} cigarette{s} today'; caption '{currency}{moneyWeek to 2dp} this week · tap for impact' or 'Tap to see impact' when impact is not loaded. Right: two 38×38 circular buttons — '−' (surfaceAlt, undo) and '+' (warning fill, white, add 1). Card tap → navigate('Smoking').
- 10. WHOLE-DAY MEAL ROUTINE BAR — <MealRoutineBar mealType={null} date={date} />. Renders nothing at all when there are no whole-day routines and nothing saveable. Otherwise: a wrapped row of chips labelled '☀ {name} · {kcal} kcal', then either a 'Save today's whole distribution as a routine ({n} items)' link or an inline name Input + 'Save' button, then the caption 'Tap to log it again · long-press to delete'.
- 11. DIGESTION CARD — rendered only when date === today. See DigestionCard in the engines list: headline 'Clear to train' / 'Wait {formatWait}', two meters (Stomach, and Smoke when the smoking module is on or anything was smoked), a Light/Normal/Hard SegmentedControl, and a long explanatory caption. Returns null when there are no meals and no smoke events.
- 12. MEALS — the four MEAL_TYPES in fixed order breakfast, lunch, dinner, snack, labelled 'Breakfast', 'Lunch', 'Dinner', 'Snacks'. Each block: (a) SectionHeader titled '{Label}' plus ' · {n} kcal' when the meal has any calories, with a right-aligned 'Add' action → navigate('AddFood', { meal }); (b) a per-meal MealRoutineBar; (c) when empty, a dashed-border Pressable Card with the meal icon ('nutrition.breakfast' / '.lunch' / '.dinner' / '.snack') and textFaint copy 'Log breakfast' / 'Log lunch' / 'Log dinner' / 'Log snacks'; (d) when populated, one Card listing every entry separated by Dividers.
- 12b. ENTRY ROW — line 1: the food name (or the free-text description for an honest log), truncated to one line, followed by an 'est.' Badge in warning colour when is_estimated. Line 2 (caption, textFaint): '{HH:MM} · {kcal} kcal · P{n} C{n} F{n} Fb{n}' where the clock comes from the row's createdAt. Line 3, only when the date is today and the row is ≥ 20 kcal: MealDigestionLine — 'Digested — clear for anything' / 'Fine for a normal session · hard training at {HH:MM}' / 'Normal session at {HH:MM} · hard at {HH:MM}'. Right edge: a 16px 'core.close' that deletes the entry immediately with NO confirmation.
- 13. LOGGING ADHERENCE CARD — shown only when honestCount + preciseCount > 0. Label 'Logging style today'; body '{preciseCount} precise · {honestCount} honest-log'; caption 'Consistency matters more than precision — a logged day beats a perfect-but-skipped one.'
- 14. DRINKS TODAY CARD — shown only when the day has beverage entries. Label 'Drinks today', then up to 8 rows (newest first) of '{preset label} · {ml} ml' plus ' · {mg} mg' when the drink carries caffeine, each with a 14px 'core.close' to delete.

**Interactions**

- Back/forward chevrons step the diary date by one day; forward is disabled on today. setDate also moves the micronutrient screen and the supplements screen, because supplementsStore reads its date from nutritionStore.
- Tap the fasting banner → Fasting screen.
- Tap the Diet plan / Programme meals / Micronutrients cards → their screens.
- Water: three quick-add taps (+250, +500, +750 ml) write a beverage row immediately; no undo except deleting from the Drinks today list.
- Caffeine: four preset taps log one default serving each (coffee 240 ml/95 mg, tea 240 ml/47 mg, energy drink 250 ml/80 mg, soda 330 ml/34 mg).
- Smoking: '+' adds one cigarette, '−' undoes the most recent entry for the day; card body opens the Smoking screen.
- SectionHeader 'Add' and the dashed empty card both open AddFood for that meal.
- Meal-routine chips: tap = re-log the whole routine into this day; long-press = confirm-and-delete Alert ('Delete "{name}"?' / 'Meals you already logged from it are kept.').
- 'Save this meal as a routine (n items)' / 'Save today's whole distribution as a routine (n items)' reveals an inline Input ('Name this meal' / "Name this day's distribution", placeholders 'e.g. My usual breakfast' / 'e.g. Ramadan split') and a Save button.
- Delete a diary entry with the × — immediate, no confirmation, no undo.
- Delete a drink with the × — immediate.
- DigestionCard intensity SegmentedControl: Light / Normal / Hard; changes every countdown on the card.
- There is NO way to edit a logged entry anywhere in the app — only delete and re-log. (The honest-log screen's copy 'You can fine-tune any entry later from the diary' promises something that does not exist.)

**What it shows, and from where**

- Calories, protein, carbs, fat, fibre totals and the per-meal grouping — dayNutrition(date) in src/repositories/nutritionRepo.ts (sums food_entries for the date; roundKcal on calories, roundGrams on macros so the sum is clean rather than each row).
- calTarget / proteinG / carbsG / fatG — useUserStore goal (nutrition_goals table); defaults 2200 kcal when absent, 0 for the macro targets.
- Fibre target — recommendedFiberG(calTarget) in src/lib/calories.ts = max(25, round(kcal/1000 × 14)).
- Donut arc sizes — macroEnergyShares() in src/lib/foodMath.ts (fibre carved OUT of the carb slice at 2 kcal/g, never added on top).
- Water litres — dayBeverages(date).hydrationMl (only presets flagged hydrating: water, coffee, tea — energy drinks and sodas do NOT count).
- Water goal — weatherAdjustedWaterGoal(goal.waterGoalMl ?? 2500) in src/repositories/weatherRepo.ts, but only when the date is today; on any past day the raw goal is used with extraMl 0.
- Caffeine mg — dayBeverages(date).caffeineMg; limit = goal.caffeineSoftLimitMg ?? 400.
- Micronutrient gap count — dayMicros(date) in src/repositories/microsRepo.ts fed into microGaps(totals, sex) in src/lib/micros.ts; sex comes from useUserStore (defaults 'male').
- Fasting banner — currentFastingState() in src/repositories/faithRepo.ts.
- Smoking count/impact — useSmokingStore; smoke events for the digestion card — recentSmokeEvents() (24 h window) in src/repositories/smokingRepo.ts.
- Digestion clock inputs — mealsFromEntries() over every diary row of the day, in src/lib/digestion.ts.
- Meal-routine chip totals — routineTotals() in src/repositories/mealRoutineRepo.ts; the saveable count — saveableEntryCount().

**What it writes**

- addBeverage(type, {volumeMl}) → beverage_entries (water quick-adds and the four caffeine presets).
- deleteBeverage(id) → beverage_entries.
- deleteFoodEntry(id) → food_entries.
- applyMealRoutine(id, mealType, date) → one addPreciseFood per snapshot item into food_entries, plus a useCount/lastUsedAt bump on meal_routines.
- saveMealRoutine(name, mealType, date) → meal_routines (skips honest-log rows and supplement-created rows).
- deleteMealRoutine(id) → meal_routines.
- useSmokingStore.add / .undo → smoking_entries.

**Empty, loading and error states**

- No food logged: donut shows '0' over '/ {target}', all four macro bars empty, every meal shows its dashed 'Log …' card, adherence card and drinks card are hidden, DigestionCard renders nothing.
- No goal row: calorie target falls back to 2200, macro targets to 0 (so the macro bars read 'n/0g' and never fill).
- No weather reading today: waterAdj returns the base goal with extraMl 0 and no '(+x for the heat)' suffix.
- Fasting module off: the banner is absent entirely.
- Smoking module off: the smoking card is absent; the Smoke meter inside DigestionCard is also hidden unless events exist.
- Past date: the fasting banner, the digestion card, the per-meal digestion lines and the smoking card are all suppressed — only the diary itself, water/caffeine and routines remain.
- Micronutrient caption when dayMicros has no food-with-micros and no supplements: 'Log whole foods or pills to see vitamins & minerals'.
- Refresh happens on useFocusEffect only — the gap count and fasting state do not update live while the screen stays focused.

> The whole nutrition section is single-date: nutritionStore.date is the one source of truth and supplementsStore.setDate delegates to it. Everything on this screen refreshes only on focus. Deleting an entry is destructive with no confirmation. There is a 'nutrition.barcode' icon defined in the icon map that no screen uses — barcode scanning does not exist.

#### AddFoodScreen

**Route** `AddFood { meal: MealType; mode?: 'precise' | 'honest' } — modal presentation, native header title 'Add Food'`  
**Reached from** NutritionScreen only: the 'Add' action on each meal's SectionHeader, and the dashed 'Log {meal}' empty card. Nothing in the codebase ever passes the `mode` param, so it always opens on 'precise'.

The two hand-logging modes — precise catalogue search and honest free-text — plus the jump-off points to the photo, custom-food and composer screens.

**Layout, top to bottom**

- SafeAreaView edges ['bottom'] + KeyboardAvoidingView (padding behaviour on iOS only).
- HEADER BLOCK (padding lg, gap md): (a) fasting Card — shown whenever currentFastingState() is non-null, computed once on mount, accent warning/success, icon 'faith.fasting' 18px, caption either "You're fasting — eating window opens at {t} ({h m}). Log now only if you're breaking your fast." or 'Eating window open — {h m} until the fast begins at {t}.'; (b) SegmentedControl with two options: 'Precise' (icon 'nutrition.search') and 'Honest Log' (icon 'nutrition.honest'); (c) ghost Button 'Photograph the meal' with icon 'card.camera' → navigate('PhotoFood', { meal }).
- PRECISE — SEARCH STATE: full-width Input, placeholder 'Search foods (e.g. couscous, brik, tuna)'. Below it a horizontal chip strip: 'All' followed by all 30 FOOD_CATEGORIES in alphabetical order — Bread, Cheese, Chocolate, Condiment, Dried fruit, Eid cookie, Fast food, Fat, Fruit, Grain, Juice, Legume, Meat, Milk, Milkshake, Nuts, Offal, Pasta, Pastry, Poultry, Prepared, Salad, Sandwich, Seafood, Seeds, Spread, Tunisian dish, Tunisian drink, Tunisian sweet, Vegetable.
- PRECISE — LIST HEADER (scrolls with the list): a primary-accent Card 'Add your own food' / 'Protein, carbs and fat is enough — calories get worked out.' → ComposeFood is next: an accent Card 'Compose a dish from other foods' / 'Couscous ×1.5, lamb ×1, chickpeas ×0.5 — saved as one food, micros included.' with icon 'nutrition.compose'. Then a textFaint caption '{n} food{s}' giving the current result count.
- PRECISE — RESULT ROW: a Card (accent = theme.colors.accent when the food is the user's own). Line 1: name (1 line, shrinks) + a 🇹🇳 emoji when cuisine === 'tunisian' + the word 'yours' in accent for a custom non-AI food, or 'estimated' in warning for an aiSourced food. Line 2 caption: '{serving} · {calories} kcal' with a '≈' appended when the calorie figure was derived, then ' · P{p} C{c} F{f} Fb{fb}', then ' · liquid' for liquid foods. Right edge: a 'core.edit' pencil for custom foods (opens ComposeFood {id} for a composed dish, CustomFood {id} otherwise), or a primary 'core.add' + for catalogue foods.
- PRECISE — SELECTED STATE (replaces the whole list): Card with icon 'nutrition.calories', h3 name, caption '{serving} · liquid — clears the stomach about twice as fast' or '{serving} · solid'; Input 'Servings' (numeric, initial '1'); the EatenAtPicker; a Divider; then a Row of five figures scaled by the servings — Calories, Protein, Carbs, Fat, Fibre, each a coloured bodyStrong value over a textFaint label. Footer Row: 'Back' (secondary, flex 1) and 'Add to diary' (icon 'core.add', flex 2).
- HONEST MODE: Row with icon 'nutrition.honestAlt' 22px and the copy "Just describe what you actually ate — no judgment. We'll estimate the macros so the day still gets logged."; a multiline Input placeholder 'e.g. "burger, fries and a soda" or "skipped lunch, big dinner"'; a live estimate Card (accent warning) that appears as soon as the text is non-empty — icon 'nutrition.estimated', bodyStrong 'Estimated', the matched keywords joined with commas on one line, then four figures (Calories, Protein, Carbs, Fat) and the caption 'You can fine-tune any entry later from the diary.'; a Card containing the EatenAtPicker; and a Button 'Log it honestly' with icon 'core.check', disabled while the text is blank.

**Interactions**

- SegmentedControl switches between Precise and Honest; switching discards nothing because each mode holds its own state.
- 'Photograph the meal' → PhotoFood.
- Typing in the search box filters by case-insensitive substring on the food name across the user's custom foods + all 316 searchable catalogue foods.
- Category chips filter; tapping the active chip clears it back to 'All'.
- With no query and no category the list is deliberately short: every custom food followed by only the first 25 catalogue foods.
- Tap a result → the selected/quantity state. 'Back' returns to the list.
- Tap the pencil on a custom food → edit it in CustomFood or ComposeFood.
- EatenAtPicker chips: 'Just now', '15 min ago', '30 min ago', '1 h ago', '2 h ago', 'At…' (which reveals a 24-hour time Input).
- 'Add to diary' / 'Log it honestly' write the row and immediately navigation.goBack().

**What it shows, and from where**

- Search results — customFoodsAsItems() (src/repositories/customFoodRepo.ts) concatenated ahead of SEARCH_FOOD_DB (src/data/foods.ts), re-read on every screen focus so a food just created appears at once.
- Per-serving macros and the scaled preview — the FoodItem's own fields × the servings number.
- Honest-mode estimate — estimateFromDescription(text) in src/data/foods.ts (62 keyword heuristics, portion multipliers, mixed-meal fallback).
- Fasting line — currentFastingState() in src/repositories/faithRepo.ts.
- 'Finished eating' resolution caption — resolveEatenAt()/clockOf() in src/lib/eatenAt.ts.

**What it writes**

- nutritionStore.addPrecise → addPreciseFood() → food_entries with log_mode 'precise', is_estimated false, macros multiplied by the servings, the micro profile scaled by scaleMicros() and stored as JSON, and form copied from the food.
- nutritionStore.addHonest → addHonestFood() → food_entries with log_mode 'honest', is_estimated true, free_text_description set, food_name set to the first matched keyword or the literal 'Honest log', fiber_g forced to 0 and no micros at all.
- Both write to the diary date currently held in nutritionStore, not necessarily today.

**Empty, loading and error states**

- No matching foods: the FlatList body is empty but the two creation cards and the '0 foods' caption still render — there is no dedicated empty illustration or 'add "{query}" as a new food' shortcut.
- Fasting module off: the banner is absent.
- Honest mode with a skip phrase ('skipped', 'nothing', 'no lunch', 'no breakfast', 'no dinner', "didn't eat", 'fasted') under 40 characters: the estimate card shows 0/0/0/0 with no matched keywords, and logging records a zero-calorie row.
- Honest mode with text that matches nothing: the estimate falls back to 500 kcal / 20 P / 55 C / 20 F labelled 'mixed meal (rough estimate)'.
- Invalid time in the EatenAtPicker: the caption turns danger red and reads 'Enter a time like 13:40.'

> The `mode` route param exists but is never used by any caller. Honest-log entries carry no fibre and no micronutrients by design, and are excluded from meal routines. The estimate card's promise of later fine-tuning is not implemented anywhere.

#### PhotoFoodScreen

**Route** `PhotoFood { meal: MealType } — modal presentation, empty native header title`  
**Reached from** AddFoodScreen only — the ghost 'Photograph the meal' button. It is not reachable from anywhere else in the app.

Log a meal from a photograph: a free vision model names the foods and estimates portions, the local catalogue supplies the numbers wherever it can, genuinely new foods get their nutrition researched and saved, and nothing is written until the user has reviewed every row.

**Layout, top to bottom**

- STAGE 'no key' (setup): PageHero icon 'nutrition.search', accent colour, title 'Photograph a meal', subtitle 'Connect an OpenRouter key once, and a free model will read your plate.' One Card containing: an explanatory paragraph about creating a free key at openrouter.ai/keys, that it is stored in the app's own database on the phone, that Android backup may copy app data to Google, and that it can be revoked; a secure Input labelled 'OpenRouter API key' with placeholder 'sk-or-v1-…'; a 'Save key' Button disabled while blank; and a caption naming the model — 'Uses minimax/minimax-m3:free, which costs nothing. The free tier allows 20 requests a minute and 50 a day. Your photo is sent to OpenRouter to be read — everything else in FitCoach stays offline.'
- STAGE 'idle': PageHero 'Photograph a meal' / 'A free model names what is on the plate; your own food database supplies the numbers.' Then, conditionally, a Connection-test Card (label 'Connection test', the raw report in a selectable monospace caption, and a ghost 'Hide' button) and an error Card (accent danger) containing failureMessage(error) plus, in smaller textFaint type, lastVisionDetail() — the provider's verbatim words. Then four buttons in order: 'Take a photo' (primary), 'Choose from gallery' (ghost), 'Test the connection' / 'Testing…' (ghost, disabled while running), 'Replace API key' (ghost). Finally an explanatory Card: 'Foods already in your database are logged with their own curated macros and micronutrients — the photo only decides what they are and how much. Anything new is researched, added to your database, and flagged as an estimate. Nothing is logged until you have seen it.'
- STAGE 'looking' / 'researching': PageHero 'Reading your plate'; the chosen photo rendered 200px tall with rounded corners; a Card with an ActivityIndicator and one of two lines — 'Identifying what is on the plate… free models queue when busy, so this can take a minute.' or 'Looking up nutrition for the foods we don't have yet…'. No cancel button.
- STAGE 'review': PageHero titled with the model's dishName (or 'What we found'), subtitle 'Check the portions before logging — a photo judges weight far less well than it names food.'; the photo at 160px; then one Card per identified food; then the meal-total card; then optional warning cards; then a Divider, the EatenAtPicker, a primary log Button and a ghost 'Discard'.
- REVIEW ROW CARD: line 1 is the food's label and a × to remove the row; line 2 is the provenance caption — 'From your food database' (plus ' · seen as "{spokenName}"' when the model called it something else) or 'New food — researched and will be added to your database' (plus ' · {basis}' when the model supplied a source note). Below: a 110px-wide numeric Input labelled 'Portion' with a 'g' suffix, or labelled 'Servings' with no suffix when the matched catalogue food's serving has no gram figure; beside it a caption '{kcal} kcal · P {p} · C {c} · F {f}', plus 'Counted in servings of {serving}.' for serving-unknown rows and 'Set this above zero, or remove it — it will not be logged.' whenever the quantity is ≤ 0.
- MEAL TOTAL CARD (accent): label 'Meal total', h2 '{kcal} kcal', caption 'Protein {p} g · Carbs {c} g · Fat {f} g · Fibre {fb} g', and when any micros survived, '{n} micronutrients counted'.
- DROPPED-FOODS CARD (accent danger, only when something could not be priced): '{n} foods were seen but could not be priced — {names}. Rather than invent numbers, they have been left out, so this meal logs short. Add them by hand if it matters.'
- RESEARCHED-FOODS CARD (accent warning, only when any row is researched): '{n} foods were not in your database, so their nutrition was researched by the model rather than measured. They are saved as an estimate and marked as such wherever they appear.'
- LOG BUTTON: title is 'Nothing to log' (disabled), 'Log this food', or 'Log all {n}' depending on how many rows have quantity > 0.

**Interactions**

- 'Save key' writes the OpenRouter key to the app_kv table and flips the screen to the idle stage.
- 'Take a photo' requests camera permission; 'Choose from gallery' requests media-library permission. Both then launch the picker with quality 0.2, allowsEditing true, a 1:1 aspect crop and base64 on.
- 'Test the connection' runs runDiagnostic() with no image — it prints the last 6 characters and length of the key, the model route, and for each model on the route a one-line verbatim result of a text-only 'Reply with exactly this and nothing else: {"ok":true}' request, including HTTP status, elapsed seconds, finish_reason and the raw reply.
- 'Replace API key' clears the stored key and returns to the setup stage — this exists specifically so a mistyped key is not permanent.
- Editing a row's Portion/Servings number re-scales that row instantly (catalogue rows through scaleCatalogueFood, researched rows through scalePer100g) — the totals card follows.
- × on a row removes it from the plate before logging.
- 'Discard' clears the rows and returns to idle.
- EatenAtPicker as elsewhere.
- The log button writes every row with quantity > 0 and goes back.

**What it shows, and from where**

- Identified foods and portions — identifyFoodInPhoto(base64) in src/services/foodVision.ts, parsed and range-checked by parsePhotoIdentification() in src/lib/aiFood.ts.
- Catalogue matches — rowFromCatalogue() in src/lib/photoMeal.ts using matchFood() in src/lib/foodMatch.ts against customFoodsAsItems() + SEARCH_FOOD_DB (built once on mount).
- Researched nutrition — researchNutrition(names) in src/services/foodVision.ts, one request for every unknown food, parsed by parseNutritionPer100g().
- Per-row nutrition — scaleCatalogueFood() / scalePer100g().
- Meal totals — mealTotals() in src/lib/photoMeal.ts.
- Error copy — failureMessage(VisionFailure) and lastVisionDetail() in src/services/foodVision.ts.

**What it writes**

- setOpenRouterKey(key) → app_kv (key 'openrouter.apiKey'); the same function with '' deletes it.
- createCustomFood({... source: 'ai'}) → custom_foods, one row per distinct researched food, serving '100 g', with its full micro profile and source 'ai' so it is permanently flagged as an estimate. A Set of already-written names prevents one plate duplicating a food.
- nutritionStore.addPrecise → addPreciseFood() → food_entries, one row per loggable row, into the diary date currently selected.

**Empty, loading and error states**

- No key saved: the setup card is the entire screen.
- Permission denied (camera or gallery): the function returns silently — NOTHING is shown to the user. This is a real gap.
- Picker cancelled or no base64 returned: silent return to idle.
- Working stages have no cancel and no progress bar, only the spinner and the copy.
- Identification failed: the error card shows one of eight messages — 'no-key' (add your key), 'offline' ('No connection — the photo needs the internet. Everything else still works offline.'), 'timeout' ('The free model did not answer in time — they queue when busy…'), 'rate-limited' ('Every free model was busy just now…'), 'unauthorised' ('That key was refused. Check it at openrouter.ai/keys.'), 'data-policy' (tells the user to enable free-model training under Settings → Privacy on openrouter.ai), 'unreadable' ("The model's answer couldn't be read…"), or the generic 'That did not work. You can still add the food by hand.'
- Photo contains no food: the model is instructed to return an empty items array → parse returns null → error 'unreadable'.
- Every food resolved to nothing: error 'unreadable' and back to idle.
- Research failed but some rows were already resolved from the catalogue: the screen still goes to review and the unpriced foods appear in the red 'logs short' card rather than being silently dropped.
- All rows edited to zero: the button reads 'Nothing to log' and is disabled.

> This is the only network feature in the nutrition area and the only place personal data leaves the device. The route is walked one named model at a time (never OpenRouter's own `models` array), max 3 models, with an extra non-JSON-mode retry at double the token budget when a model answers in prose. Vision timeout 120 s, text timeout 60 s.

#### CustomFoodScreen

**Route** `CustomFood { id?: number } | undefined — modal presentation, header title 'Custom Food'`  
**Reached from** AddFoodScreen precise mode: the 'Add your own food' header card (no id), or the pencil on a non-composed custom food row (with id). Not reachable from anywhere else.

Create or edit a food the built-in catalogue does not have. The point of the screen is that the calorie field is optional — macros are enough, and the energy figure is derived from them.

**Layout, top to bottom**

- SafeAreaView bottom + KeyboardAvoidingView + ScrollView (padding lg, gap md, paddingBottom 40).
- Card 1: Input 'Name' (placeholder "e.g. Mum's couscous"), Input 'Serving' (placeholder 'e.g. 1 plate (300 g)').
- Card 2: label 'Macros per serving'; a 2×2 grid of numeric Inputs — 'Protein (g)', 'Carbs (g)' on the first row, 'Fat (g)', 'Fibre (g)' on the second; caption 'Fibre is part of carbs — enter it if you know it and the calorie estimate gets sharper.'
- Card 3 (accent warning while derived, theme.colors.calories once overridden): a Row with icon 'nutrition.estimated' or 'nutrition.calories', the live figure '{n} kcal' in bodyStrong, and the word 'estimated' at the right while derived. Below, Input 'Calories (leave blank to work it out)' whose placeholder is the derived number. Caption while derived: 'Worked out from the macros — 4 kcal a gram for protein and carbs, 9 for fat, with fibre at 2. That lands within 10% for 97 of every 100 foods in the database. Type a figure from the label to use it instead.' Once overridden: 'Using the figure you entered.'
- Card 4: label 'Solid or liquid'; a two-option SegmentedControl (Solid | Liquid); a caption explaining the consequence — liquid: 'A drink leaves the stomach about twice as fast as the same calories as food, and settles in a quarter of the time — the training clock runs it that way.'; solid: 'Food eaten with a fork or a spoon. If it is a shake, a juice, a soup or a milk, pick Liquid — the training clock will run it faster.'
- Card 5: label 'Category (optional)'; a wrapped chip grid beginning with 'None', then the categories the user has already used (so their own vocabulary comes first), then the remaining 30 built-in FOOD_CATEGORIES.
- Divider, then a provenance caption with two variants: for an AI-sourced food — 'This food was identified from a photograph and its nutrition researched by a model, so every figure here — including its vitamins and minerals — is an estimate, not measured data. Correct anything that looks wrong; editing keeps the micronutrients it came with.'; otherwise — "Custom foods have no vitamin or mineral data — we won't invent one from a name. They count fully toward calories and macros, and simply add nothing to your micronutrient totals."
- Button 'Save food' / 'Save changes' with icon 'core.check', disabled until valid; when disabled a centred caption 'Needs a name and at least one macro.'; and, when editing, a danger-coloured 'Delete this food' text link at the bottom.

**Interactions**

- Every numeric field is parsed leniently (comma decimals accepted, blanks and junk become 0) and the calorie figure recomputes as you type.
- Typing anything > 0 into the Calories field is what makes the figure yours — the card immediately drops the 'estimated' label and switches accent colour.
- When editing a food whose stored calories were themselves derived, the Calories field opens blank so editing keeps deriving.
- Solid/Liquid segmented control.
- Category chips toggle; tapping the active one clears back to None.
- Save closes the modal.
- 'Delete this food' raises an Alert: 'Delete this food?' / 'Diary entries you already logged with it are kept.' with Cancel and a destructive Delete.

**What it shows, and from where**

- The existing row when editing — getCustomFood(id) in src/repositories/customFoodRepo.ts.
- Derived calories — caloriesFromMacros() in src/lib/foodMath.ts.
- Validity — isCompleteCustomFood() (a name plus at least one of protein/carbs/fat > 0).
- Already-used categories — listCustomFoods() mapped to distinct non-null categories.

**What it writes**

- createCustomFood(input) → custom_foods (new).
- updateCustomFood(id, input) → custom_foods. Deliberately does NOT touch micros_json or source, so editing an AI-researched food's macros cannot erase its micronutrients or launder its estimate into hand-entered data.
- deleteCustomFood(id) → custom_foods. Diary rows already logged keep their copied macros.
- normalise() clamps negatives to 0, clamps fibre to at most the carbs, defaults the serving string to '1 serving', and derives calories when nothing was entered.

**Empty, loading and error states**

- New food: every field blank, the calorie card shows '0 kcal' as an estimate, Save disabled with the 'Needs a name and at least one macro.' caption.
- Editing an AI food: the provenance caption switches to the model-sourced wording.
- Delete is only offered when editing.

> Hand-entered custom foods carry NO micronutrients by design and therefore add nothing to the Micronutrients screen — the copy says so explicitly. The Atwater accuracy claim ('within 10% for 97 of every 100 foods') is a measured figure re-verified by scripts/verify-engines.ts against all catalogue foods.

#### ComposeFoodScreen

**Route** `ComposeFood { id?: number } | undefined — modal presentation, header title 'Compose a Dish'`  
**Reached from** AddFoodScreen precise mode: the 'Compose a dish from other foods' header card (no id), or the pencil on a composed custom food row (with id).

Build a dish out of other foods with quantities — 'Friday couscous': couscous ×1.5, lamb ×1, chickpeas ×0.5 — and save it as one food whose macros AND micronutrients are the sum of its parts.

**Layout, top to bottom**

- PICKER MODE (a full-screen takeover when adding a component): either (a) the search sub-screen — an Input 'Search a food to add…' with a 'core.close' beside it to leave picking, a horizontal chip strip of 'All' + the 30 categories, and a FlatList of at most 40 results, each a Card with the name, the word 'yours' in accent for a custom food, and the caption '{serving} · {kcal} kcal', with a primary + icon; or (b) the quantity sub-screen once a food is tapped — a Card with the h3 food name, caption '{serving} · {kcal} kcal · P{p} C{c} F{f} Fb{fb}', an Input 'How many servings', and buttons 'Back' (flex 1) and 'Add to dish' (flex 2, icon 'core.add').
- COMPOSE MODE — Card 1: Input 'Name the dish' (placeholder 'e.g. Friday couscous'), Input 'One serving is' (placeholder 'e.g. 1 plate', default value '1 plate').
- Card 2: header Row — label "What's in it" and a small 'Add food' Button with a + icon. When empty, the caption 'Add the foods that make up the dish, each with how many servings went in. The totals add up as you go.' When populated, one row per component separated by Dividers: the component name, a caption '{serving size} each · {kcal} kcal', a 64px numeric Input showing the servings with a '×' suffix, and a 'core.close' to remove it.
- Card 3 (accent theme.colors.calories, only when there is at least one component): label 'Per serving of the dish'; a Row of five figures — Calories, Protein, Carbs, Fat, Fibre; a caption that is either '{n} micronutrients summed from the parts — the lamb's iron, the greens' vitamin K — count toward your day exactly as the parts would.' or 'Micronutrients follow from the parts; these components carry none.'; and a second caption listing the recipe as 'name ×1.5 · name ×1 · … +{n} more' (first four components).
- Card 4: label 'Solid or liquid' with a Solid|Liquid SegmentedControl and a caption in three variants — untouched and defaulting to liquid: 'All the parts are drinks, so this is a drink — change it if the dish is really a solid.'; untouched and defaulting to solid: 'At least one part is solid, so the dish is solid — change it if it is really a smoothie or a soup.'; once chosen by hand: 'The training clock runs a drink about twice as fast as the same calories as food.' or 'The training clock runs it as food.'
- Card 5: label 'Category (optional)' with 'None' + the 30 category chips.
- Footer caption: 'Each part is saved as it is right now, so the dish you save is the dish you log next month — even if a food in the database is corrected underneath it.'
- Button 'Save dish' / 'Save changes' with icon 'core.check', disabled until there is a name and at least one component; when disabled, the centred caption 'Needs a name and at least one food.'

**Interactions**

- 'Add food' opens the picker; the × in the picker leaves it.
- Picker search filters by substring; category chips filter by the underlying FOOD_DB category; results are capped at 40.
- Choosing a food asks for servings (comma decimals accepted; anything not finite or ≤ 0 falls back to 1) then adds a snapshot.
- Changing a component's × value re-scales that component's snapshot exactly (macros and micros both).
- × removes a component.
- Solid/Liquid override; until touched it follows the parts.
- Save closes the modal. There is no delete on this screen — a composed food is deleted through CustomFoodScreen.

**What it shows, and from where**

- The pool of composable foods — composableFoods(SEARCH_FOOD_DB, selfId) in src/repositories/customFoodRepo.ts: every custom food (including other composed dishes) plus the catalogue, minus the dish being edited.
- Live totals — composeTotals(components) in src/lib/composedFood.ts.
- The micronutrient count — MICRO_DEFS filtered to keys with a value > 0 in the summed profile.
- The recipe line — describeComponents(components, 4).
- The default form — composedFormDefault(components): liquid only when every part is liquid.

**What it writes**

- createComposedFood(input) / updateComposedFood(id, input) → custom_foods, writing name, serving, the SUMMED macros, components_json (the full per-component snapshot), micros_json (the summed profile), form, calories_estimated forced to false (summed from real figures, not derived), and source — 'ai' whenever ANY component traces back to a photograph-researched custom food, so a composer trip can never launder an estimate into measured data.

**Empty, loading and error states**

- No components: the totals card is hidden and Save is disabled.
- Components with no micro data: the caption says so rather than showing a zero count.
- A food cannot contain itself: wouldCreateCycle() blocks it, and composableFoods() already excludes the dish being edited — the add simply does nothing, with no message.
- Editing loads the stored component list from components_json.

> Every component is a SNAPSHOT taken at the moment it was added, already multiplied by its servings — not a live reference into the catalogue. This is the same rule that makes diary rows and meal routines copy macros at log time.

#### MicronutrientsScreen

**Route** `Micronutrients (no params) — pushed, empty native header title`  
**Reached from** NutritionScreen — the 'Micronutrients & supplements' card. Nothing else links here.

The full 26-nutrient breakdown of the selected diary day: how much of each RDI has been reached, which are running low, which exceed a tolerable upper limit, and where the numbers came from.

**Layout, top to bottom**

- PageHero icon 'micro.vitamins', accent colour, title 'Micronutrients' (no subtitle).
- A second date navigator identical to the diary's: back chevron, an h2 reading 'Micronutrients · Today' or 'Micronutrients · {Mon, Sep 1}', and a forward chevron disabled on today. NOTE: this duplicates the PageHero title on the same screen.
- A secondary Button 'Supplements & pills' with icon 'supp.pill' → navigate('Supplements').
- GAPS CARD (accent warning, only when at least one nutrient is under 50% of RDI): icon 'stats.coachTip' + bodyStrong 'Running low ({n})', then a caption listing the six worst as '{Label} {pct}%' joined by ' · ' with a trailing '…' when there are more.
- Three groups in fixed order, each a SectionHeader followed by one Card of rows: 'Vitamins' (13 rows), 'Minerals' (12 rows), 'Other' (1 row, Omega-3).
- MICRO ROW: a Row with the nutrient label on the left and, on the right, the caption '{formatted amount} / {rdi} {unit}' plus a Badge showing '{pct}%' in the status colour; below, a 6px ProgressBar filled to pct/100 in the same colour; and when the status is 'over', a 10px danger caption 'Above the tolerable upper intake — ease off.'
- SOURCE-SPLIT CARD at the bottom: label 'Where it came from'; caption '{n} of {m} food entries had known micronutrient data', optionally ', plus {k} supplement(s)', then 'Composite/fast foods contribute macros only — totals here reflect foods & pills with known data, so treat them as a floor, not a ceiling.'

**Interactions**

- Back/forward chevrons move the shared diary date (they call nutritionStore.setDate, so the diary and the supplements screen move too).
- 'Supplements & pills' button → Supplements screen.
- Nothing else is tappable — the rows are read-only.

**What it shows, and from where**

- Totals per nutrient — dayMicros(date) in src/repositories/microsRepo.ts, which sums the micros JSON on every food_entries row for the date plus the micros JSON on every supplement_logs row for the date.
- Percentages — percentRdi(total, key, sex) in src/lib/micros.ts with sex from useUserStore (default 'male').
- Status colour — microStatus(): 'over' (#FF5D5D) when the total exceeds the nutrient's tolerable upper intake, 'low' (#FFB454) under 50% of RDI, 'high' (#4F8CFF) over 150% when an upper limit exists, otherwise 'ok' (#33D9A6).
- Gap list — microGaps(totals, sex, 50) — every nutrient under 50%, sorted worst first, with sodium excluded because too much is the problem there, not too little.
- Formatted amounts — formatMicro(): whole numbers at ≥ 100, one decimal at ≥ 10, two decimals below that.
- Source split — dayMicros().foodEntriesWithMicros / foodEntriesTotal / supplementCount.

**What it writes**

- None. This screen is read-only apart from moving the shared date.

**Empty, loading and error states**

- Loading: renders a bare Screen containing the single word 'Loading…' while the first dayMicros call resolves in useFocusEffect.
- No data (no food entry carried micros AND no supplement was logged): everything below the button collapses into one Card reading "No micronutrient data for this day yet. Log whole foods (they carry vitamin/mineral data) or a micronutrient supplement, and it'll show up here." The three group sections and the source card are not rendered at all.
- When data exists but a nutrient has none, the row still renders at 0 / RDI with a 0% badge and a low status.

> Rows are rendered in MICRO_DEFS order, which puts chromium BEFORE iodine among the minerals even though MICRO_KEYS lists them the other way round. The screen never distinguishes a directly-measured micro profile from one derived from a composite recipe, even though FoodItem carries a `microsDerived` flag for exactly that — the flag is set but never read by any UI.

#### SupplementsScreen

**Route** `Supplements (no params) — pushed, empty native header title`  
**Reached from** MicronutrientsScreen — the 'Supplements & pills' button. That is the only route in.

Track pills and powders for the selected diary day: a personal stack with one-tap logging and pill counts, the day's log, and the full 28-entry catalogue with honest evidence ratings.

**Layout, top to bottom**

- PageHero icon 'supp.pill', accent colour, title 'Supplements', subtitle 'Track pills and powders. Vitamin and mineral supplements count toward your micronutrient totals; the few with real energy — whey, fish oil, collagen — log their calories to your diary automatically; performance supplements are tracked for dose and consistency, with honest evidence.'
- Date navigator: back chevron, a centred stack of h2 'Today' or the short date plus, when not today, a warning-coloured caption 'Logging for {date}', and a forward chevron disabled on today.
- PLAN CARD (accent): icon 'stats.coachTip', 'Build a plan for my goals' / 'Performance, sleep, cutting down smoking… get a timed plan with safe doses', chevron → navigate('SupplementPlan').
- 'My stack' SectionHeader plus one StackCard per saved supplement — only rendered when the stack is non-empty.
- STACK CARD: accent success when already logged for the day, otherwise accent. Header Row: the supplement icon (primary tint for micronutrients, accent for ergogenics), the label, and a caption '{dose}' plus ' · {n}-day streak' when a streak exists; on the right either a success Badge 'Logged ✓' or a small 'Take' Button. Divider. Then either the pills-per-portion editor (an Input labelled e.g. 'Capsules per portion' with placeholder 'e.g. 6' and a Save button) or a Row with a primary text link — '{n} {unit}s per portion — tap to change' or 'Set how many {unit}s are in one portion' — and a small secondary Button '+1 {unit}'. Finally, when anything was taken, a textFaint line '{n} {unit}s {today|date} · {x} of a portion'.
- TODAY'S LOG CARD (only when something was logged): label 'Taken today' / 'Taken {date}', then one row per log — '{label}' plus ' · {n} pills' or ' · {dose}' — each with a 14px × to remove it.
- 'Vitamins & minerals' SectionHeader followed by all 15 micronutrient SupplementCards.
- 'Performance & wellness' SectionHeader followed by all 13 ergogenic SupplementCards.
- SUPPLEMENT CARD: Row with the icon, the label, a caption '{defaultDose}' plus ' · {timing}' when present, and an evidence Badge on the right — 'Strong evidence' (#33D9A6), 'Moderate evidence' (#4F8CFF), 'Limited evidence' (#FFB454) or 'Mixed evidence' (#9AA6B2). Below, a tappable primary line 'What does the evidence say?' that expands into the full evidence prose (several of these run to many paragraphs — spirulina's and shilajit's are essay-length). Then two buttons: 'Log now' (flex 2, + icon) and 'Add to stack' / 'In stack ✓' (flex 1, secondary).
- Closing caption: 'Evidence ratings reflect the research, not marketing. "Limited/mixed" doesn't mean useless — it means be realistic. Check with a clinician if you take medication.'

**Interactions**

- Date chevrons move the shared diary date via nutritionStore, so stepping back logs the pills you forgot then rather than adding them to today.
- 'Build a plan for my goals' → SupplementPlan.
- 'Take' logs one full portion; '+1 {unit}' logs a single pill — the honest record when you took two of your usual six.
- Tapping the pills-per-portion line opens an inline editor; saving a non-positive or unparseable number clears the override back to the catalogue default.
- 'Log now' on any catalogue card logs a full portion immediately.
- 'Add to stack' / tapping again to remove — the same button toggles membership.
- × on a row of the day's log deletes it, and deletes the linked diary row when the supplement carried calories.
- Tapping the evidence line expands/collapses it; only one card can be expanded at a time.

**What it shows, and from where**

- Stack — getStack() (supplement_stack, enabled rows only) via useSupplementsStore.
- The day's logs — supplementsForDay(date) ordered newest first.
- Streak — supplementStreak(key): consecutive days with a log, looking back up to 400 days, starting from today or yesterday. NOTE it is always relative to today, never to the date being viewed.
- Pills taken — unitsTakenToday(key, date): the sum of units_taken across every log for that key and date.
- Pills per portion — the stack row's units_per_serving, falling back to the catalogue's unitsPerServing.
- Catalogue — SUPPLEMENTS in src/data/supplements.ts: 15 micronutrient entries (multivitamin, vitamin-d, magnesium, zinc, iron, vitamin-c, vitamin-b12, omega-3, calcium, folate, gsn-multivitamin, gsn-zinc, gsn-mag-b, gsn-fish-oil, spirulina) and 13 ergogenic entries (creatine, caffeine, beta-alanine, citrulline, whey, ashwagandha, shilajit, herbz-testobooster, l-theanine, melatonin, collagen, zma, probiotics).

**What it writes**

- logSupplement(key, {dose, unitsTaken, date}) → supplement_logs, storing the label, category, dose, units taken, and the micro profile scaled by the fraction of a portion actually taken.
- For supplements with a `macros` field (omega-3 18 kcal/2 g fat, gsn-fish-oil 10 kcal/1 g fat, whey 120 kcal/24 P/3 C/1.5 F liquid, beta-alanine 13 kcal, citrulline 24 kcal, collagen 36 kcal) the same call also writes a linked food_entries row into the 'snack' meal named '{label} (supplement)', scaled by the same fraction, and stores its id on the log. Backdated logs stamp that row at 12:00 on the target date so the digestion clock does not read it as just-drunk. Micros stay on the supplement log only, never on the linked food row, so the Micros screen cannot double-count.
- deleteSupplementLog(id) → deletes the linked food_entries row first, then the supplement_logs row.
- addToStack(key, dose) / removeFromStack(key) → supplement_stack.
- setUnitsPerServing(key, n) → supplement_stack.units_per_serving (rounded, or null to clear).

**Empty, loading and error states**

- Empty stack: the 'My stack' section is omitted entirely and the screen opens straight onto the plan card and the catalogue.
- Nothing logged: the 'Taken today' card is omitted.
- On a past date the header adds the warning line 'Logging for {date}'.
- A supplement in the stack whose key no longer exists in the catalogue renders nothing (findSupplement returns undefined and the card is skipped).

> The catalogue is one long unfiltered scroll of 28 fully-rendered cards with no search and no filtering — this is the heaviest single list in the section. Two catalogue entries are the developer's own branded products transcribed from their labels (GSN range, Herbz TestoBooster) and carry very long editorial evidence notes, including explicit warnings that the GSN multi plus GSN zinc together exceed the 40 mg zinc upper limit. Spirulina deliberately records NO vitamin B12 because spirulina's B12 is a pseudo-vitamin; shilajit deliberately records no minerals at all.

#### SupplementPlanScreen

**Route** `SupplementPlan (no params) — pushed, empty native header title`  
**Reached from** SupplementsScreen — the 'Build a plan for my goals' card. Only route in.

Turn a set of goals into a time-slotted supplement protocol drawn only from the catalogue, with dose caps, timing conflicts and real interactions flagged before the plan itself.

**Layout, top to bottom**

- PageHero icon 'supp.pill', accent, title 'Supplement plan', subtitle "Pick what you're actually trying to achieve. FitCoach builds a timed plan from the catalogue, rates each item honestly, and flags the dose caps and interactions that matter."
- 'Your goals' SectionHeader, then a wrapped two-column grid of five goal cards, each ~48% wide: 'Athletic performance' / 'Strength, power & training output' (icon strength.dumbbell); 'Better sleep' / 'Fall asleep faster, sleep deeper' (sleep.moon); 'Reducing smoking' / 'Support while you cut down' (smoking.smokeFree); 'Stress & recovery' / 'Lower stress load, recover better' (hormone.stress); 'General wellbeing' / 'Fill the common gaps' (care.heart). A selected card gains an accent border, an accent-18 tint and a 'core.check' tick.
- When at least one goal is on: first every WARNING-severity note as its own accented Card (danger accent, 'health.medical' icon); then the 'Your daily schedule' SectionHeader.
- SCHEDULE — up to four slot blocks in fixed order, each rendered only when it has items: a Row with a 'core.timer' icon, an h3 slot label and a textFaint '· {when}' — 'Morning · With breakfast', 'Pre-workout · 30–60 min before training', 'Evening · With dinner', 'Before bed · 30–60 min before sleep'. Then one Card listing that slot's items, Divider-separated, core items first.
- PLAN ITEM: the label plus a 'Core' (success) or 'Optional' (textFaint) Badge plus the evidence Badge; the dose in accent colour; the 'why' sentence in textMuted (concatenated when two goals both wanted the same supplement); and on the right either a success tick when it is already in the stack, or a primary + to add it.
- Button 'Add this plan to my stack' (accent, + icon).
- 'Safety & context' SectionHeader, then every remaining note (caution → warning colour with 'health.medical'; info → textFaint with 'core.info').

**Interactions**

- Tapping a goal card toggles it; the plan rebuilds instantly. 'General wellbeing' is on by default.
- The + beside an item adds that one supplement (with its plan dose) to the stack.
- 'Add this plan to my stack' raises an Alert 'Add {n} to your stack?' / 'They will appear on the Supplements screen for one-tap daily logging. You can remove any of them later.' with Cancel and Add; when everything is already saved it instead shows 'Already in your stack' / 'Every supplement in this plan is already saved.'

**What it shows, and from where**

- The plan — buildIntakePlan(goals, ctx) in src/lib/supplementPlan.ts, de-duplicating supplements wanted by more than one goal and merging their reasons.
- Context that drives the safety notes — isSmokingEnabled() / avgCigarettesPerDay(7) from smokingRepo, avgCaffeineSince(daysAgoISO(6)) from nutritionRepo, listConditions() from conditionsRepo; all wrapped in a try/catch so the plan still works without them.
- Doses and evidence levels — the catalogue entry for each key.
- Which items are already saved — useSupplementsStore.stack.

**What it writes**

- addToStack(key, dose) → supplement_stack, either one at a time or in bulk from the confirm dialog.

**Empty, loading and error states**

- Zero goals selected: everything below the grid is replaced by a dashed Card reading 'Pick at least one goal to build a plan.'
- A slot with no items is omitted rather than shown empty.
- Context lookup failure is silent — the plan renders without the caffeine average or the thyroid escalation.

> The safety layer is the substantive part. It always ends with two info notes ('Supplements are the smallest lever…' and 'Educational only, not medical advice…'), and adds conditionally: a hard warning that no supplement treats nicotine dependence when 'Reducing smoking' is picked; the beta-carotene/smoking ATBC-CARET caution; a 400 mg caffeine cap that quotes the user's own diary average; an escalated warning when both caffeine and better sleep are chosen; magnesium+ZMA and zinc+ZMA double-up warnings; iron absorption spacing; an ashwagandha caution that escalates to a warning when a thyroid condition is flagged in conditionsRepo; a melatonin lowest-dose caution; and a shilajit heavy-metal caution.

#### DietPlanScreen

**Route** `DietPlan (no params) — pushed, empty native header title`  
**Reached from** NutritionScreen — the 'Diet plan' card. Only route in.

Generate a whole day of meals from the food database that lands near the user's calorie and macro targets, re-shuffleable, and loggable meal by meal or all at once.

**Layout, top to bottom**

- PageHero icon 'nutrition.calories', calories colour, title 'Diet plan', subtitle 'A day of meals built to hit your targets. Tap "Shuffle" for a fresh combination with the same macros, switch the style, or log a meal straight to your diary.'
- TARGET SUMMARY CARD (accent calories): a Row of five TargetPills — kcal, P, C, F, Fb — each an h3 achieved value in its macro colour over a textFaint '/ {target} {label}'. Below, centred: 'Plan hits {n}% of calories · {n}% protein'.
- 'Style' SectionHeader, then a horizontal strip of five wide (min 120px) selectable blocks: 'Balanced / A bit of everything', 'High protein / Lean, protein-forward', 'Low carb / Fewer carbs, more fat', 'Vegetarian / No meat, fish or poultry', 'Mediterranean / Fish, olive oil, legumes'. The active one fills with theme.colors.calories and white text.
- A Row containing a two-option SegmentedControl ('3 meals' | '4 meals') and a 'Shuffle' Button with icon 'stats.progression'.
- MEALS: for each meal in the plan, a SectionHeader '{Label} · {n} kcal' with a right-aligned 'Log' action, then a Card listing the items separated by Dividers. Each item row: the meal-type icon, '{servings}× {name}' (servings shown to one decimal when fractional), the serving string beneath in textFaint, and on the right '{kcal} kcal · P{p} C{c} F{f} Fb{fb}'.
- Button 'Log the whole day to diary' with icon 'core.check' in the calories colour.
- Closing caption: "Suggestions from your food database — swap anything you don't like and re-shuffle. Whole foods first; composite dishes and sweets are left out of auto-plans."

**Interactions**

- Style blocks switch the food pools and regenerate.
- 3/4-meal SegmentedControl regenerates with a different split.
- 'Shuffle' picks a new random seed (0…1e9) and regenerates a different combination against the same targets.
- The 'Log' action on a meal header writes that meal's items into the diary and raises an Alert 'Added to diary ✓' / '{Label}: {n} item(s) logged.'
- 'Log the whole day to diary' calls the same routine for every meal — which fires ONE ALERT PER MEAL (three or four stacked dialogs).

**What it shows, and from where**

- Targets — useUserStore goal, with defaults 2200 kcal / 150 P / 220 C / 70 F when no goal row exists; the fibre target is recommendedFiberG(calories).
- The plan — generateDietPlan(target, {style, meals, seed}) in src/lib/dietPlan.ts, a deterministic mulberry32-seeded builder.
- Item macros — scaled directly from FOOD_DB entries.

**What it writes**

- nutritionStore.addPrecise per item → addPreciseFood() → food_entries, into the currently selected diary date. Each item is looked up by id in FOOD_DB so the stored per-serving macros, micros and form come from the catalogue rather than from the already-scaled plan figures; quantity is the plan's servings.

**Empty, loading and error states**

- No goal row: the defaults above are used silently.
- A style whose filtered pool has no foods of a role simply omits that item — there is no warning.
- There is no empty state; a plan is always generated.

> The generator only ever proposes catalogue foods, never the user's custom or composed ones (it reads FOOD_DB directly, including search-hidden twins). Composite categories are excluded from the pools: 'Fast food', 'Tunisian dish', 'Tunisian sweet', 'Milkshake', 'Pastry', 'Chocolate'. There is no 'swap this item' control despite the closing caption inviting one — the only lever is Shuffle.

#### ProgrammeMealsScreen

**Route** `ProgrammeMeals (no params) — pushed, empty native header title`  
**Reached from** NutritionScreen — the 'Programme meals' card. Only route in.

Every Special Programme's diet, meal by meal, resolved into real catalogue foods so it can be logged with genuine macros and micronutrients.

**Layout, top to bottom**

- PageHero icon 'nutrition.calories', calories colour, title 'Programme meals', subtitle 'Eat like a legionary, a monk or a hero — every meal logs with its real macros & micros.'
- One section per Special-Programme category, in SPECIAL_CATEGORY_ORDER: 'Military, Tactical & Service', 'Elite Sport', 'Warriors of History', 'Superheroes, Legends & Bodybuilders', 'Quick Counters & Urge-Busters', 'Everyday Special Ops'. Each is a SectionHeader followed by one collapsed Card per programme in that category (61 programmes in total).
- COLLAPSED CARD: a Pressable Row — the programme's own icon and accent colour, the programme name on one line, its diet name beneath in textMuted, and on the right a calories-coloured '≈ {n} kcal' for the whole day.
- EXPANDED CARD (accent = the programme's colour): a Divider, then the diet's one-line macroSlant in textFaint, then one block per meal: a Row with the meal label in bodyStrong and, on the right, either a textFaint 'hydration' for a hydration-only meal or a tappable '{kcal} kcal · {n}P' with a + icon; beneath, a textMuted line listing the component foods as 'name' or 'name ×{servings}' joined by ' · '. Finally a small Button 'Log the whole day' in the programme's accent colour with the 'nutrition.calories' icon.
- Closing caption: 'Meals log as their real component foods — full macros and micronutrients, tracked like anything else.'

**Interactions**

- Tapping a programme header expands it and collapses whichever was open (single-open accordion).
- Tapping a meal's calorie figure logs that meal and raises an Alert 'Logged' / '{Programme} — {meal label} ({n} kcal) added to today's {mealType}.'
- 'Log the whole day' logs every non-hydration meal and raises 'Logged' / '{Programme} — {n} kcal across {m} meals added to today's diary.'
- Hydration-only meals are not tappable.

**What it shows, and from where**

- Per-programme nutrition — dietNutrition(program) in src/lib/specialDiet.ts, which pairs the programme's prose sampleDay (from src/data/specialPrograms.ts) index-for-index with a concrete build from SPECIAL_DIET_BUILDS (src/data/specialDietPlans.ts) and resolves every component id against FOOD_DB.
- Day and meal calories/protein — summed from the resolved foods, never invented here.
- Category labels — SPECIAL_CATEGORY_META.

**What it writes**

- mealToDiaryInputs(meal) → one addPreciseFood() call per component → food_entries, each carrying the catalogue food's per-serving macros, its micro profile and its form, with quantity set to the build's servings.

**Empty, loading and error states**

- A programme with no build entry falls back to an empty snack build, so its meals resolve to 0 kcal with no foods listed.
- A component id missing from FOOD_DB is silently skipped (resolveFood returns null).
- No loading or error state exists — everything is computed synchronously from bundled data.

> This screen writes through addPreciseFood DIRECTLY rather than through nutritionStore, so it ALWAYS logs to today regardless of which diary date the rest of the section is showing — and the Alert copy says 'today' explicitly. It also does not refresh the diary; the Nutrition tab picks the rows up on its next focus. Every meal is logged with a fresh 'now' timestamp, so a whole-day log stacks four meals onto the digestion clock at the same instant.

### Engines behind this area

- **`src/stores/nutritionStore.ts`** — The single source of truth for which day the whole nutrition section is showing. Holds `date`, `food` (DayNutrition) and `beverages` (DayBeverages); exposes setDate, refresh, addPrecise, addHonest, removeFood, addDrink, removeDrink. Every write refreshes both queries. supplementsStore reads its date from here.  
  *Constants:* Initial date = todayISO(). No caching, no memoisation — refresh() re-queries both tables synchronously.
- **`src/repositories/nutritionRepo.ts`** — All diary reads and writes. addPreciseFood multiplies per-serving macros by the quantity and scales the micro profile with it; addHonestFood runs the keyword estimator and stores the description with is_estimated true. dayNutrition groups the day by meal and sums it; dayBeverages sums hydration, pure water and caffeine. Also the trend helpers the rest of the app reads: dailyIntakeSince, avgWaterSince, avgCaffeineSince.  
  *Constants:* Totals are rounded ONCE at the sum (roundKcal to whole calories, roundGrams to one decimal) rather than per row, so every consumer inherits a clean number. Honest logs always store fiber_g = 0 and no micros. Quantity defaults to 1 when 0 or missing — which is why the photo screen filters out zero-quantity rows before logging.
- **`src/repositories/customFoodRepo.ts`** — The user's own foods, in their own table so an app update cannot destroy them. Handles both plain custom foods and composed dishes, converts them to catalogue-shaped FoodItems for search, and resolves the `custom:<n>` id namespace.  
  *Constants:* Id prefix 'custom:'. normalise() clamps negatives to 0 and fibre to ≤ carbs, defaults the serving to '1 serving' and the form to 'solid'. micros_json and `source` are written on CREATE ONLY, deliberately, so editing an AI food's macros cannot erase its micronutrients or relabel it as hand-entered. componentsCarryEstimate() marks a composed dish 'ai' whenever any part traces to a photographed food.
- **`src/repositories/microsRepo.ts`** — dayMicros(date): reads the micros JSON column off every food_entries row and every supplement_logs row for the day, sums them into a full zero-filled profile, and reports how many food entries actually carried data.  
  *Constants:* Returns totals, fromFood, fromSupplements, foodEntriesWithMicros, foodEntriesTotal, supplementCount. Malformed JSON is swallowed and treated as {}.
- **`src/repositories/supplementsRepo.ts`** — The stack, the logs, pill counting, streaks, and the linkage between a macro-bearing supplement and the diary row it creates.  
  *Constants:* A part portion scales both the linked calories and the logged micros by units/unitsPerServing. Backdated logs stamp the linked food row at 12:00 local on that date. Deleting a log deletes its linked food row first. supplementStreak looks back 400 days and starts from today or yesterday. supplementFoodEntryIds() is what keeps meal routines and the log-your-meals challenge from counting a pill as food.
- **`src/repositories/mealRoutineRepo.ts`** — Saved meals and whole-day distributions. Items are a full macro+micro SNAPSHOT of the diary rows at save time, never references. A routine with mealType null is a whole-day routine and appears under every meal.  
  *Constants:* saveMealRoutine excludes honest-log rows (re-logging a guess as a measurement) and supplement-created rows (they would double-count). saveableEntryCount mirrors that filter exactly so the '(n items)' label never over-promises. applyMealRoutine re-logs each item at quantity 1 because the snapshot is already the eaten amount, then increments use_count. Routines are ordered by use_count desc, then created_at desc.
- **`src/lib/micros.ts`** — The micronutrient engine: 26 keys, their labels, units, group, sex-specific RDIs and tolerable upper intakes, plus summing, scaling, percentage, status and gap functions. Purely additive — it never touches calories or macros.  
  *Constants:* 26 nutrients = 13 vitamins + 12 minerals + 1 other. RDIs (male/female): Vitamin A 900/700 µg (upper 3000); Vitamin C 90/75 mg (2000); Vitamin D 15/15 µg (100); Vitamin E 15/15 mg (1000); Vitamin K 120/90 µg; Thiamin B1 1.2/1.1 mg; Riboflavin B2 1.3/1.1 mg; Niacin B3 16/14 mg (35); Pantothenic B5 5/5 mg; Vitamin B6 1.3/1.3 mg (100); Biotin B7 30/30 µg; Folate B9 400/400 µg (1000); Vitamin B12 2.4/2.4 µg; Calcium 1000/1000 mg (2500); Iron 8/18 mg (45); Magnesium 400/310 mg; Phosphorus 700/700 mg; Potassium 3400/2600 mg; Sodium 1500/1500 mg (2300); Zinc 11/8 mg (40); Copper 0.9/0.9 mg (10); Manganese 2.3/1.8 mg (11); Selenium 55/55 µg (400); Chromium 35/25 µg; Iodine 150/150 µg (1100); Omega-3 ALA 1600/1100 mg. Status: 'over' above the upper limit, 'low' under 50% RDI, 'high' above 150% when an upper exists, else 'ok'. microGaps threshold is 50% and skips sodium. All sums round to 2 decimals.
- **`src/lib/foodMath.ts`** — Atwater arithmetic for deriving calories from macros, and the energy-share split that draws the macro donut.  
  *Constants:* 4 kcal/g protein, 4 kcal/g carbohydrate, 9 kcal/g fat, 2 kcal/g FIBRE (fibre is subtracted from carbs then re-added at the lower rate; stated fibre above stated carbs is clamped). Measured accuracy quoted in the source and in the UI: plain 4/4/9 gets 81% of catalogue foods within 10% (90th-percentile error 12.2%); discounting fibre gets 97% within 10% (90th-percentile error 7.1%). parseAmount accepts comma decimals and treats blanks/junk/negatives as 0. isCompleteCustomFood requires a name plus protein+carbs+fat > 0.
- **`src/lib/composedFood.ts`** — The composed-dish model: a FoodComponent is a snapshot already multiplied by its servings; composeTotals sums components (macros rounded once, micros summed or null when none); rescaleComponent re-scales exactly; describeComponents renders the recipe line; wouldCreateCycle blocks self-inclusion.  
  *Constants:* describeComponents shows the first 4 components then '+n more'. composeTotals returns micros: null rather than an all-zero profile when nothing carries data.
- **`src/lib/digestion.ts`** — The digestion clock. Models the stomach as a cumulative LOAD in kcal-equivalents draining at dR/dt = −(B + K·R)/s, where s is the 'slowness' of the mix. Every meal adds to what is already there, so a snack an hour after lunch pushes the wait out rather than starting a fresh timer. Provides stomachLoad, currentDigestion (the whole stack, for 'can I train now?'), digestionStatus (one meal alone, for the diary line), digestionMinutes, formatWait and mealsFromEntries.  
  *Constants:* EMPTY_BASE_KCAL_PER_MIN = 2.0; EMPTY_RATE_PER_KCAL = 0.004; MIN_MEAL_KCAL = 20 (anything smaller adds nothing); MAX_WAIT_MIN = 300. READY_THRESHOLD_KCAL light 500 / moderate 260 / hard 180. SETTLE_MIN (solids) light 0 / moderate 20 / hard 30; LIQUID_SETTLE_MIN light 0 / moderate 10 / hard 15. LIQUID_SPEED = 2 (a drink drains at twice the rate), MIN_SLOWNESS = 0.5. mealSlowness = clamp(1 + 1.2·max(0, fatShare−0.15) + 0.4·max(0, proteinShare−0.15) + 0.08·fibrePer100kcal, 1, 2), halved for liquids; fibrePer100 is itself clamped to 6. Stated calibration: 250 kcal snack + hard → ~30 min; 400 kcal + hard → ~1 h 25; 600 kcal mixed + normal → ~2 h; 600 kcal + hard → ~2 h 35; 1000 kcal fatty + hard → ~4 h 20; a walk after any of them → 0–35 min. INTENSITY_LABEL: light 'a walk or mobility', moderate 'a normal session', hard 'sprints or heavy lifting'.
- **`src/lib/eatenAt.ts`** — Turns the 'when did you finish eating?' answer into the timestamp stored on the diary row, because the digestion clock reads created_at as the moment eating ended.  
  *Constants:* Five presets: 'Just now', '15 min ago', '30 min ago', '1 h ago', '2 h ago', plus a free 24-hour 'At…' field. 'Just now' returns undefined so the row takes the database default. Nothing is ever stored in the future — everything is clamped to now. On a PAST diary date, 'ago' is anchored to noon of that day and 'clock' to that day's local midnight plus the minutes; 'just now' on a past date means 'unknown time' and falls back to the DB default. parseHHMM accepts '13:40', '13h40', '13.40' and '1340'.
- **`src/lib/dietPlan.ts`** — The seeded diet-plan generator. Classifies catalogue foods into roles, filters pools by style, then per meal picks a protein anchor, a carb filler, a fat filler and a vegetable.  
  *Constants:* mulberry32 seeded RNG so a seed reproduces a plan exactly. Meal splits — 3 meals: breakfast 0.33 / lunch 0.37 / dinner 0.30; 4 meals: breakfast 0.28 / lunch 0.32 / dinner 0.30 / snack 0.10. Roles: 'veg' when the category is Vegetable; 'protein' when protein ≥ 10 g AND ≥ 30% of the energy; 'carb' at ≥ 50% carb energy; 'fat' at ≥ 50% fat energy. The protein anchor aims for 80% of the meal's protein target, clamped 0.5–3.5 servings; the carb filler is clamped 0.5–4, the fat filler 0.5–3; servings snap to the nearest 0.5 with a 0.5 minimum. Low-carb uses 40% of the carb target and 120% of the fat target. Excluded categories: Fast food, Tunisian dish, Tunisian sweet, Milkshake, Pastry, Chocolate. Vegetarian drops Meat/Poultry/Seafood/Offal plus a long meat-name regex; Mediterranean keeps fish and legumes but drops Meat, Offal and red-meat names. No vegetable is added to the snack.
- **`src/lib/specialDiet.ts`** — Resolves a Special Programme's prose diet into loggable nutrition by matching each meal build's component ids against FOOD_DB, and converts a resolved meal into PreciseFoodInput rows for the diary.  
  *Constants:* Builds are aligned index-for-index with the programme's sampleDay; a meal with zero components is hydrationOnly and is never logged. mealToDiaryInputs passes the BASE food's per-serving figures with quantity = servings, so the repository does the multiplication exactly once.
- **`src/lib/supplementPlan.ts`** — Goal-driven supplement protocol builder plus its safety layer. Five goals map to catalogue keys with a slot, a reason and a core/optional flag; duplicates across goals merge into one item with both reasons.  
  *Constants:* 5 goals; 4 slots in fixed order morning / preworkout / evening / bed. Recommendations per goal: athletic_performance → creatine (core), whey (core), caffeine, citrulline, beta-alanine; sleep_quality → magnesium (core), l-theanine, melatonin, ashwagandha; quit_smoking → vitamin-c (core), magnesium, ashwagandha, omega-3; stress_recovery → ashwagandha (core), magnesium (core), l-theanine, omega-3; general_wellbeing → vitamin-d (core), omega-3 (core), spirulina, shilajit, multivitamin. Named thresholds in the notes: 400 mg total daily caffeine, none within ~8 h of bed, caffeine half-life ~5–6 h; 20–30 mg/day beta-carotene as the ATBC/CARET risk level against spirulina's ~1.4 mg; zinc upper limit 40 mg; melatonin lowest dose 0.5 mg; smokers need ~35 mg/day more vitamin C.
- **`src/lib/aiFood.ts`** — Everything the model returns is parsed, range-checked and cross-checked here before it can reach the diary. Also owns the model route and the JSON extraction that copes with models that write prose around their answer.  
  *Constants:* MAX_PORTION_G = 2000, MIN_PORTION_G = 1, MAX_ITEMS = 12, ENERGY_TOLERANCE = 0.25 (calories are rebuilt from the macros when they disagree by more than max(15 kcal, 25%)), MICRO_SANITY_MULTIPLE = 40 (a micronutrient beyond 40× the male DV per 100 g is dropped one key at a time — set just above real extremes: Brazil nuts ~34× selenium, table salt ~26× sodium). 100 g of food may not contain more than 100 g of macronutrients. MAX_ROUTE_MODELS = 3, because OpenRouter rejects a longer routing list with a 400 before any model sees it. DEFAULT_MODEL = 'minimax/minimax-m3:free'; FALLBACK_MODELS = dots-studio/dots-3-note-preview:free, google/gemma-4-31b-it:free, google/gemma-4-26b-a4b-it:free. EXCLUDED_MODEL_PATTERNS: 'openrouter/free' (a router that can pick a classifier), 'content-safety', 'guard', 'moderation', 'lyria', 'embed'. Names are cleaned to ≤ 80 chars; confidence defaults to 0.5 and clamps to 0–1; `basis` truncates at 160 chars.
- **`src/lib/foodMatch.ts`** — Token-based fuzzy matching of a spoken food name to a catalogue food — the thing that decides whether a photographed food gets curated numbers or has to be researched.  
  *Constants:* MATCH_MIN_SCORE = 0.75. Score = min(0.99, coverage×0.6 + focus×0.25 + qualifierBonus×0.15), with an exact normalised-name match returning 1. 22 stopwords, 39 preparation qualifiers (cooked, grilled, fried, canned, lean, cup, tbsp…) that break ties but never block a match. Bracketed catalogue descriptions are stripped before matching ('Tuna (canned in water)' must not be found by the word 'water'). Plural handling is deliberately narrow — '-ies'→'y', '-es' only after a sibilant or o, and '-us'/'-is'/'-ss' endings are never stripped (couscous, hummus). A genuine tie between two DIFFERENT identities (whole milk vs skimmed milk) returns null rather than picking by array position.
- **`src/lib/photoMeal.ts`** — Turns identified foods into reviewable rows: catalogue rows scaled to grams, researched rows scaled per 100 g, and the meal total.  
  *Constants:* servingGrams parses a bracketed gram figure first ('1 cup (195g)'), then a leading one ('225 g (1 cup)'). Roughly 36 catalogue foods state a serving with no gram weight (mostly drinks plus a sandwich); those rows fall back to SERVINGS with quantity 1 and the UI swaps the grams box for a servings box. Quantity is ROUNDED FIRST (2 dp) and the nutrition derived from the rounded value, so what is approved on review is exactly what the diary stores.
- **`src/services/foodVision.ts`** — The OpenRouter transport. Two deliberately separate calls: 'what is on the plate?' (image, no nutrition asked for) and 'what is in these foods?' (text, all unknown foods in one request). Never throws into the caller; every failure reads as one of eight named VisionFailure values. Also runDiagnostic, which asks every model on the route the simplest possible question and prints the verbatim answer.  
  *Constants:* VISION_TIMEOUT_MS = 120000 (45 s timed out on real Wi-Fi and read to the user as 'no connection'); TEXT_TIMEOUT_MS = 60000. IDENTIFY_MAX_TOKENS = 1500; NUTRITION_MAX_TOKENS = 2400, doubled on the plain-text retry. temperature 0. One named model per request, walked in order — never OpenRouter's own `models` array, which did not rescue a rate-limited primary. The loop stops immediately on no-key, unauthorised, data-policy or timeout, but moves on after a 429. A model that answers in prose gets one more try without response_format. HTTP 401/403 → 'unauthorised', 429 → 'rate-limited', any body matching /data policy|allowed providers|privacy/ → 'data-policy'. Failure detail records the request size in KB and the seconds waited.
- **`src/data/foods.ts`** — The searchable catalogue and the honest-log estimator. FOOD_DB = 34 generic staples + 287 Tunisian/Mediterranean entries = 321 foods; SEARCH_FOOD_DB is that minus 5 hidden duplicate twins = 316 offered in the pickers. Micros are attached per food: a direct FOOD_MICROS profile where one exists, otherwise a profile derived from the dish's ingredient recipe.  
  *Constants:* 321 catalogue foods; 316 searchable; 5 SEARCH_HIDDEN_IDS (white-rice, almonds, avocado, olive-oil, dried-apricot — each has a richer Tunisian twin). 244 foods carry DIRECT measured micro profiles and 77 carry profiles derived from recipes, so all 321 end up with some micro data. 30 distinct categories, all supplied by the Tunisian file — the 34 generic foods carry no category at all and therefore appear under no chip. Liquid classification: whole categories Milk, Juice, Milkshake, Tunisian drink, plus 8 named ids (milk, whey, miso-soup, tn-chorba-frik, tn-douwida, tn-lablabi, ff-milkshake, ch-hot-chocolate). estimateFromDescription: 62 keyword heuristics (38 Tunisian/regional checked first so 'couscous' is not caught by 'rice', then 24 general), 7 skip patterns that only apply under 40 characters, portion multipliers ×1.4 (big/large/huge/double/extra) and ×0.6 (small/light/little/half), and a 500 kcal / 20 P / 55 C / 20 F 'mixed meal (rough estimate)' fallback when nothing matches.
- **`src/data/foods-tunisian.ts`** — The 287-entry Tunisian and Mediterranean reference — the bulk of the catalogue. Sourced from the Tunisian Diet & Gym Reference, USDA FoodData Central, CIQUAL and typical recipe ratios.  
  *Constants:* By category: Fruit 34, Vegetable 32, Tunisian dish 25, Fast food 17, Dried fruit 15, Cheese 14, Condiment 13, Milk 12, Juice 12, Eid cookie 12, Seafood 11, Tunisian sweet 9, Salad 9, Meat 9, Chocolate 9, Nuts 7, Legume 7, Poultry 6, Milkshake 6, Seeds 5, Pasta 4, Grain 4, Bread 4, Offal 3, Tunisian drink 2, Fat 2, and one each of Spread, Sandwich, Prepared, Pastry.
- **`src/data/foodMicros.ts`** — 253 curated per-serving micronutrient profiles keyed by food id, covering the whole foods that actually move the needle. Composite dishes are deliberately absent rather than guessed.  
  *Constants:* 253 entries; values are rounded USDA/CIQUAL figures expressed per the food's own stated serving, so they scale with quantity exactly like macros. Omitted keys contribute 0.
- **`src/data/foodComposites.ts`** — 77 recipes that write down what a composite dish is actually made of, in servings of foods that DO have measured data, so its micronutrients are the sum of real parts rather than an invention. A component may itself be composite; resolution recurses.  
  *Constants:* 77 recipes, MAX_DEPTH = 4. deriveMacros re-computes each dish's macros from its recipe and scripts/verify-engines.ts fails the build when they drift too far from the macros the food itself declares — a wrong recipe cannot sit here quietly. A measured ingredient is always a leaf and beats any recipe for the same id.
- **`src/data/supplements.ts`** — 28 supplements in two categories: 15 micronutrient pills whose micros feed the same daily totals as food, and 13 ergogenics tracked for dose and consistency with honest evidence prose. Six entries carry real macros and therefore write a linked diary row.  
  *Constants:* Evidence levels and colours: strong #33D9A6, moderate #4F8CFF, limited #FFB454, mixed #9AA6B2. Macro-bearing entries: omega-3 (18 kcal, 2 g fat), gsn-fish-oil (10 kcal, 1 g fat), whey (120 kcal, 24 P, 3 C, 1.5 F, liquid), beta-alanine (13 kcal), citrulline (24 kcal), collagen (36 kcal — calories only, deliberately NOT counted as protein because collagen lacks tryptophan and is low in leucine). unitsPerServing defaults: gsn products 1 capsule/softgel, spirulina 6 tablets (3 g), ashwagandha 2 capsules, herbz-testobooster 2 capsules, whey 1 scoop, collagen 1 scoop, shilajit 1 capsule.
- **`src/data/beverages.ts`** — Per-serving presets for the six beverage types and the quick-add ladder.  
  *Constants:* water 250 ml / 0 mg / hydrating; coffee 240 ml / 95 mg / hydrating; tea 240 ml / 47 mg / hydrating; energy_drink 250 ml / 80 mg / NOT hydrating; soda 330 ml / 34 mg / NOT hydrating; other 250 ml / 0 mg / NOT hydrating. WATER_QUICK_ADD = [250, 500, 750] ml. CAFFEINE_SOFT_LIMIT_MG = 400. Caffeine scales with the logged volume relative to the preset's default volume.
- **`src/data/specialDietPlans.ts`** — 61 concrete meal builds — one per Special Programme — each an array of FOOD_DB ids with serving multiples, aligned index-for-index with that programme's prose sampleDay. Nothing here invents nutrition.  
  *Constants:* 61 programmes across 6 categories. Every id must exist in FOOD_DB and every array must line up with sampleDay; both are asserted in scripts/verify-engines.ts. A hydration-only meal is an empty components array.
- **`src/components/DigestionCard.tsx`** — The 'can I train yet?' card: a headline governed by whichever of the two clocks is later, a Stomach meter and (when relevant) a Smoke meter, an intensity SegmentedControl and an explanatory caption. MealDigestionLine is the per-row diary line.  
  *Constants:* Both re-render on a 60-second tick. Headline colour: success when clear, warning above 66% progress, danger when the smoke clock governs, otherwise the calories colour. Returns null when there are no meals and no smoke events. The Smoke meter shows when the smoking module is on or anything was smoked.
- **`src/components/MealRoutineBar.tsx`** — The routine chips under the day header and under each meal: tap to re-log, long-press to delete, plus the inline save form.  
  *Constants:* Renders nothing at all when there are no routines and nothing saveable. Whole-day routines are prefixed '☀ ' and appear under every meal as well as the day header.
- **`src/components/EatenAtPicker.tsx`** — The 'Finished eating' control shared by AddFood (both modes) and PhotoFood: five preset chips plus an 'At…' chip that reveals a 24-hour time field, with a live caption confirming the resolved time.  
  *Constants:* Caption states: 'Logged as finished just now — the training clock starts from this moment.', 'Logged as finished at {HH:MM} — the training clock counts from then, not from now.', 'Enter a time like 13:40.' (danger), 'Pick a time.'
- **`src/components/charts/MacroDonut.tsx`** — The four-arc calorie-share ring on the diary dashboard. The split itself comes from macroEnergyShares, so fibre is carved out of the carb slice and drawn beside it rather than added on top.  
  *Constants:* Default size 140, strokeWidth 16, butt line caps, arcs drawn from 12 o'clock in order protein, carbs, fibre, fat over a surfaceAlt track.
- **`src/lib/calories.ts (fibre target only)`** — recommendedFiberG(calorieTarget) — the fibre target the diary dashboard and the diet plan both use.  
  *Constants:* FIBRE_G_PER_1000_KCAL = 14, FIBRE_MIN_G = 25; target = max(25, round(kcal/1000 × 14)).
- **`src/repositories/weatherRepo.ts + src/lib/weather.ts (water goal only)`** — weatherAdjustedWaterGoal(baseMl) adds extra water on a hot day using today's latest reading; only applied when the diary date is today.  
  *Constants:* extraWaterMl returns 0 below a 24 °C feels-like. 24–30 °C → 250 ml/h; 30–38 °C → 500 ml/h; above 38 °C → 750 ml/h, over max(0.5 h, plannedActiveMin/60) with plannedActiveMin defaulting to 45. Resting bonus 300 ml at ≥ 30 °C, 150 ml at ≥ 24 °C. Multiplied by a humidity factor and capped at 3000 ml.

### Notes for the redesign

GAPS AND ODDITIES A DESIGNER MUST KNOW:

1. NO EDIT PATH FOR A LOGGED ENTRY. Anywhere in the section, a diary row can only be deleted (a single × with no confirmation and no undo) and re-logged. The honest-log screen explicitly promises "You can fine-tune any entry later from the diary" — that feature does not exist.

2. DATE HANDLING IS INCONSISTENT. NutritionScreen, MicronutrientsScreen, SupplementsScreen and DietPlanScreen all write to the shared diary date. ProgrammeMealsScreen calls addPreciseFood directly and therefore ALWAYS logs to today, and its Alert says so. Date navigation is ±1 day only — there is no calendar or date picker anywhere in the section, and no way to go past today.

3. SINGLE-ENTRY-POINT SCREENS. Micronutrients is reachable only from the Nutrition tab; Supplements only from Micronutrients; SupplementPlan only from Supplements; PhotoFood only from AddFood; CustomFood and ComposeFood only from AddFood's precise-mode list header (or the pencil on a custom row). Nothing on Home, Train, Stats or Profile links into any of them.

4. PHOTO PERMISSION DENIAL IS SILENT. If camera or gallery permission is refused, PhotoFoodScreen simply returns — no message, no state change, nothing on screen. This is the clearest missing state in the section.

5. THE PHOTO FLOW HAS NO CANCEL. Once a photo is sent, the 'looking'/'researching' stage runs to completion or failure with only a spinner; the vision timeout alone is 120 seconds.

6. DUPLICATED TITLE ON MICRONUTRIENTS. The screen renders a PageHero "Micronutrients" and then, directly beneath, an h2 "Micronutrients · Today" as part of its date navigator.

7. THE SUPPLEMENT CATALOGUE IS ONE UNFILTERED 28-CARD SCROLL with no search, no filter and several essay-length evidence blocks (spirulina and shilajit each run to four or five paragraphs). It is the heaviest list in the app.

8. "LOG THE WHOLE DAY" ON DIET PLAN FIRES ONE ALERT PER MEAL — three or four stacked native dialogs in a row.

9. THE DIET PLAN GENERATOR IGNORES THE USER'S OWN FOODS. It reads FOOD_DB directly, so custom and composed foods never appear in a plan, and search-hidden duplicate twins can. Its closing caption invites you to "swap anything you don't like", but there is no swap control — only Shuffle.

10. PROVENANCE THAT IS COMPUTED BUT NEVER SHOWN. FoodItem carries `microsDerived` (true for the 77 dishes whose micros come from an ingredient recipe rather than measurement) and foods.ts exports FOODS_WITH_MICROS — neither is read by any screen. So a designer has a genuine, honest distinction available that the current UI throws away. By contrast `aiSourced` IS shown, as the word "estimated" in search results.

11. AN UNUSED BARCODE ICON. `nutrition.barcode` exists in the icon map; no barcode scanning exists.

12. HONEST LOGS ARE SECOND-CLASS BY DESIGN. They carry zero fibre and zero micronutrients, they are excluded from meal-routine snapshots, and they show the free-text description rather than a food name. Nothing tells the user any of this at log time.

13. STREAKS ARE ALWAYS RELATIVE TO TODAY. supplementStreak takes no date, so viewing a past day still shows the streak ending today.

14. NO PULL-TO-REFRESH ANYWHERE, and the diary refreshes only on focus, so the micronutrient gap count and the fasting banner can be stale while the screen stays open.

15. TWO CATALOGUE ENTRIES ARE THE DEVELOPER'S OWN BRANDED PRODUCTS (the GSN range and Herbz TestoBooster), transcribed from their labels, with warnings written for that specific pairing — notably that the GSN multi (30 mg zinc) plus GSN zinc (30 mg) exceeds the 40 mg upper limit. A redesign should keep the warning mechanism even if those specific products are generalised.

16. THE SECTION'S ETHIC IS EXPLICIT AND SHOULD SURVIVE A REDESIGN: nothing is fabricated. Custom foods contribute no micronutrients rather than invented ones; composite dishes derive micros from real ingredient recipes that are machine-verified against the dish's own macros; a food the photo model could not price is listed in a red "this meal logs short" card rather than being silently dropped; spirulina records no B12 because spirulina's B12 is unusable; shilajit records no minerals at all because there is no honest figure. The UI carries that honesty in copy everywhere, and a redesign that flattens the copy would erase it.

---

## 8. Smoking / Nicotine and Faith (Prayers, Fasting)

Three opt-in, privacy-local modules that live behind the Profile "Personal tracking" list and surface as cards elsewhere. SMOKING is a two-state screen: a settings form until enabled, then an "impact dashboard" that logs any of 11 nicotine products with one tap and converts them into four parallel models — a combustion-weighted cigarette count (health), a raw nicotine total (dependence), a cigarette-only money total, and a decaying carbon-monoxide "smoke clock" that answers "how long until I can train". FAITH is two independent screens: PRAYERS computes the six daily times fully offline from solar position for a GPS fix or one of seven city presets under six calculation methods; FASTING runs a live Ramadan or intermittent-window timer whose Suhoor/Iftar are wired to the prayer calculator's Fajr/Maghrib when configured, plus a fasted-day streak. The post-session margins engine (a separate card shown on Home, Session Recap and Walk, not on these three screens) is the other half of the smoking story: it scales a smoking wait of 60–150 min and an alcohol wait of 90–300 min off a computed session strain score.

### Screens (5)

#### SmokingScreen → SmokingSetup (enable branch)

**Route** `Smoking (no params). Registered in RootNavigator with options={{ title: '' }} so the native header is a bare back arrow; PageHero is the only title.`  
**Reached from** Profile → LinkRow icon 'smoking.cigarette' label 'Smoking tracker' (label becomes 'Smoking impact' once enabled). Also Home smoking tile, Nutrition quick-tracker and Stats 'Smoking Impact' card, but all three of those only render when the tracker is already enabled, so in practice Profile is the only route in.

The opt-in gate. Shown whenever no smoking profile exists or profile.enabled is false. Collects the six numbers the whole model runs on and writes the profile row.

**Layout, top to bottom**

- PageHero — icon 'smoking.cigarette' (MaterialCommunityIcons 'smoking'), colour theme.colors.warning, 44×44 tinted tile, title 'Smoking tracker'. No subtitle.
- Body text, textMuted: "Optional and private. Log cigarettes with a tap and FitCoach shows — honestly, no judgment — how it maps onto your training, steps, money and health, using your own data plus transparent estimates." (rendered only in the enable branch, not the edit branch)
- Card (gap md) — label 'What's your aim?' over a SegmentedControl with exactly two options: value 'quitting' label 'Cut down / quit', value 'tracking' label 'Just track'. Initial value = profile?.mode ?? 'quitting'.
- Same Card, Row of three Inputs: 'Cigarettes / pack' (keyboardType numeric, seeded 20), 'Price / pack' (numeric, seeded 8), 'Cur.' (fixed width 64, free text, seeded '$').
- Same Card, Row of one or two Inputs: 'Typical / day' (numeric, seeded 10) and — only when mode === 'quitting' — 'Daily cap goal' (numeric, seeded 5). Switching to 'Just track' removes the cap field.
- Button — title 'Enable tracker', icon 'core.check', colour warning, full width.
- Caption, centred, textFaint: 'You can turn this off anytime. Nothing leaves your device.'

**Interactions**

- SegmentedControl quitting/tracking — local state only until Save; toggling to 'tracking' hides the cap Input and forces dailyTarget to null on save.
- Five text Inputs, all local state.
- 'Enable tracker' → save(): parseInt(perPack)||20, parseFloat(price)||8, currency||'$', parseInt(baseline)||10, dailyTarget = mode==='quitting' ? parseInt(target)||null : null, nicotineMgPerCig = DEFAULT_SMOKING_SETTINGS.nicotineMgPerCig (1.1 — never editable in the UI). Calls store.enable(patch), which upserts with enabled:true and then refresh().

**What it shows, and from where**

- Seed values for all five fields — useSmokingStore.profile ← getSmokingProfile() (smokingRepo), i.e. the newest smoking_profiles row for PRIMARY_USER_ID ordered by id desc.
- Hardcoded fallbacks when no profile exists: 20 / 8 / '$' / 10 / 5, matching DEFAULT_SMOKING_SETTINGS except dailyTarget.

**What it writes**

- upsertSmokingProfile({enabled:true, mode, cigarettesPerPack, pricePerPack, currency, baselinePerDay, dailyTarget, nicotineMgPerCig}) → table smoking_profiles (columns enabled, mode, cigarettes_per_pack, price_per_pack, currency, nicotine_mg_per_cig, baseline_per_day, daily_target). Insert if no row for the user, otherwise UPDATE the newest row.

**Empty, loading and error states**

- This IS the empty state for the whole module — there is no separate empty screen.
- No loading state: every read is synchronous SQLite.
- No validation and no error state: non-numeric input silently falls back to the || defaults; a negative or zero cigarettesPerPack makes moneyCost() return 0 for everything.

> baselinePerDay ('Typical / day') is stored, is carried into SmokingSettings by settingsFromProfile, and is never read by any calculation anywhere in the codebase. It is a dead input. nicotineMgPerCig is written as 1.1 and only ever changes if the DB is edited by hand; it is the per-unit figure used for cigarettes in totalNicotineMg.

#### SmokingScreen → SmokingSetup (edit branch)

**Route** `Smoking (no params). Not a route — an internal `editing` boolean inside SmokingScreen, so the back arrow leaves the whole screen rather than returning to the dashboard.`  
**Reached from** ImpactDashboard → secondary Button 'Tracker settings' (icon 'core.settings') at the bottom of the dashboard. Only entry point.

Same form, re-entered from the dashboard to change the profile without disabling it.

**Layout, top to bottom**

- PageHero — same icon/colour, title 'Tracker settings'.
- The explanatory paragraph is NOT rendered in this branch.
- Identical Card: aim SegmentedControl, pack/price/currency Row, typical-per-day + cap Row.
- Button 'Save settings', icon 'core.check', colour warning.
- Button 'Cancel', ghost variant.

**Interactions**

- 'Save settings' → updateProfile(patch) then onDone() → returns to the dashboard.
- 'Cancel' → onDone() with nothing written.

**What it shows, and from where**

- Current profile values via useSmokingStore.profile ← getSmokingProfile().

**What it writes**

- upsertSmokingProfile(patch) → smoking_profiles. Note the patch always includes nicotineMgPerCig: 1.1, so an edit resets any hand-tuned value.

**Empty, loading and error states**

- No distinct states; the form is always populated because this branch is unreachable without a profile.

> Because `editing` is state on the parent, the screen swaps in place with no animation and the native back arrow exits to the previous screen instead of cancelling the edit.

#### SmokingScreen → ImpactDashboard

**Route** `Smoking (no params).`  
**Reached from** Profile LinkRow 'Smoking impact'; Home smoking tile (rendered only when smokingEnabled); Nutrition quick-tracker card (smokingEnabled && viewing today); Stats 'Smoking Impact' SectionHeader action 'Details' and the card body itself.

The live tracker and the whole honesty argument: today's count, what else you used, the smoke clock, the smoke-free timeline, the week's money/life/nicotine cost, the modelled fitness penalty, an observational comparison against the user's own steps and session calories, and a 21-day bar chart.

**Layout, top to bottom**

- PageHero — icon 'smoking.cigarette', colour = theme.colors.accent when profile.mode==='quitting' else theme.colors.warning, title 'Smoking', right = Badge 'Quitting' (accent) or Badge 'Tracking' (textMuted).
- TODAY LOGGER Card, accent = danger when over the cap else warning. Left column: caption 'Today'; baseline Row with a display-size tabular-nums number (impact/store `today`) and body-muted 'cig'/'cigs' plus ' / N cap' when dailyTarget is set. Right column: two 44×44 circles — '−' on surfaceAlt (undo) and '+1' on warning with white text (add 1 cigarette).
- Same Card, only when nicotineToday > 0: caption textFaint '{nicotineToday} mg nicotine today' followed by ' · {round(smokedShare*100)}% of it from smoking' when smokedShare < 1, or ' · all of it from smoking' when it equals 1.
- Same Card: a Pressable disclosure row — chevronDown/chevronUp icon (primary) plus primary caption 'Log something else — snus, pouch, vape, patch…' which becomes 'Hide' when open.
- Same Card, when open: NicotineProductPicker — three labelled groups, worst first. Group 1 'Smoked', blurb 'Burning is what does the damage — tar and carbon monoxide.', items Cigarette, Roll-Up, Cigar, Shisha / Hookah, Heated Tobacco (IQOS-style). Group 2 'Smoke-free alternatives', blurb 'Nicotine without combustion. Much lower risk than smoking, not zero.', items Vape / E-Cigarette, Snus, Nicotine Pouch (tobacco-free). Group 3 'Stop-smoking medicines', blurb 'Licensed, dosed and designed to be tapered off.', items Nicotine Gum, Nicotine Lozenge, Nicotine Patch. Each item is a Row: tappable name + a textFaint subline '{nicotineMg} mg nicotine / {unitLabel}' + ' · burned' or ' · smoke-free' + ' · licensed medicine' for NRT, and a small secondary Button '+1' at the right. Footer caption: 'Only the burned ones count toward the life-cost and aerobic figures — that is where the tar and carbon monoxide are. Everything here still counts toward your nicotine, because the dependence is just as real.'
- Same Card, only when dailyTarget != null: ProgressBar with progress = today/target, colour danger when over else warning; when over, a danger caption '{today - target} over today's cap — no judgment, tomorrow's a fresh start.'
- DigestionCard — passed meals=[], smokes=recentSmokeEvents(), smokingEnabled, defaultIntensity='hard', compact. Renders a header row ('Clear to train' or 'Wait {formatWait}' plus a line naming which clock governs and the ready time) and two Meters: 'Stomach' (always present; with meals=[] it always reads status 'clear', full bar, detail 'Nothing logged today.') and 'Smoke' (status 'wait {formatWait} · HH:MM' or 'clear'; detail names either '{n} smoked in the last day' or 'nicotine (not smoked)', then either 'carbon monoxide still on board (~X cigarettes' worth)' or 'heart rate and vessels still in the acute nicotine window', plus ' — fine now for {a walk or mobility|a normal session|sprints or heavy lifting}'). Because compact is true, the light/normal/hard SegmentedControl and the long explanation paragraph are hidden here.
- SMOKE-FREE Card, accent 'accent', only when impact.smokeFreeStreak > 0: 28px 'smoking.smokeFree' icon, h2 '{n} smoke-free day/days', caption '{formatDurationLong(smokeFreeHours*3600)} since your last cigarette' (only when smokeFreeHours is finite); then the reached milestone as bodyStrong accent '✓ {afterLabel}' + muted benefit line; then textFaint 'Next · {afterLabel}: {benefit}'.
- SectionHeader 'This Week'.
- Row of two StatTiles: 'Cigarettes' (icon smoking.cigarette, value impact.week, sub '~{avgPerDay}/day', accent warning) and 'Spent' (icon smoking.money, value '{currency}{moneyWeek.toFixed(2)}', sub '{currency}{moneyYearProjected}/yr', accent calories).
- Row of two StatTiles: 'Life cost' (icon smoking.life, value '{lifeMinutesWeek/60 rounded to 0.1}h', sub 'this week (est.)', accent danger) and 'Nicotine' (icon smoking.heart, value '{nicotineWeekMg}mg', sub 'this week', accent caffeine).
- SectionHeader 'Estimated Fitness Impact'; Card with two rows split by a Divider. Row 1: 'smoking.lungs' icon in info colour, bodyStrong 'Aerobic capacity −{aerobicPenaltyPct}%', caption 'At ~{avgPerDay}/day, carbon monoxide binds haemoglobin and cuts oxygen delivery — blunting endurance and pace. (Estimate.)'. Row 2: 'smoking.heart' in danger, bodyStrong 'Resting heart rate +{restingHrElevationBpm} bpm', caption 'Nicotine is a stimulant that raises resting heart rate and blood pressure, so your heart works harder at rest and in training.'
- CORRELATION block, rendered only when smokingCorrelation(30) is non-null AND at least one of avgStepsSmokeDays / avgSessionCalSmokeDays is non-null: SectionHeader 'Your Data: Smoke vs Smoke-Free Days'; Card opening with 'Last {windowDays} days · {smokeDays} with cigarettes, {cleanDays} smoke-free. Observational — your own logs.'
- CompareRow 'Avg steps' (values via toLocaleString) and CompareRow 'Avg session kcal' — each drawn only when BOTH its smoke and clean averages are non-null. A CompareRow is: label at left, and at right a caption '{+}{pct}% on smoke-free days' in success or danger (suppressed entirely when pct === 0); then two 8px-high bars — a warning bar with the 'smoking.cigarette' icon (smoke value) and an accent bar with the 'smoking.smokeFree' icon (clean value), each scaled against max(smoke, clean, 1) with the formatted value right-aligned in a fixed 64px column.
- Correlation footer, only when lostSessionEquivalent > 0: textFaint 'Reduced aerobic capacity is roughly equivalent to losing {n} of your {sessionsInWindow} sessions' endurance benefit this month.'
- SectionHeader 'Daily Trend'; Card with a BarChart of dailySeries(21) — 21 bars, x-labels are the day-of-month only (date.slice(8)), colour warning, value label printed above a bar only when its value > 0, bars scaled to max(1, …), minimum bar height 2px.
- Button secondary 'Tracker settings', icon 'core.settings'.
- Button ghost 'Turn off tracker', colour textMuted.

**Interactions**

- '+1' circle → store.add(1) → logCigarettes(1, {trigger: undefined, productKey: null}) then refresh().
- '−' circle → store.undo() → undoLastCigarette(): takes the newest smoking_entries row for TODAY (any product), decrements quantity if > 1, otherwise deletes the row. Undo after logging a pouch removes the pouch, not a cigarette.
- Disclosure Pressable toggles the product picker open/closed (local state showProducts).
- Product name Pressable toggles that product's `note` paragraph open; only one can be open at a time (single openKey).
- Product '+1' Button → add(1, undefined, key) → logCigarettes with that product_key.
- DigestionCard is passive here (compact hides its intensity control), but it re-computes on a 60-second interval.
- 'Tracker settings' → setEditing(true) (swaps to the edit form in place).
- 'Turn off tracker' → Alert.alert('Turn off smoking tracker?', 'Your logged history is kept, but the tracker is hidden.') with buttons 'Cancel' (cancel style) and 'Turn off' (destructive) → disable() then navigation.goBack().

**What it shows, and from where**

- today (the big number) — smokingStore.today ← dayCigarettes(todayISO()) ← combustedEquivalents over dayEntries, rounded to one decimal. Combustion-weighted: a pouch adds 0, heated tobacco 0.5, a cigar 4, a shisha session 10.
- '{n} mg nicotine today' — smokingStore.nicotineToday ← dayNicotineMg(settings, today) ← totalNicotineMg (rounded to 0.1).
- '{n}% of it from smoking' — smokingStore.smokedShare ← daySmokedShare ← combustedShare (burned nicotine ÷ all nicotine, rounded to 0.01).
- Cap progress bar and the over-cap line — profile.dailyTarget via impact.dailyTarget.
- Smoke clock (both Meters) — recentSmokeEvents() → smokeStatus()/trainReadiness() at intensity 'hard'.
- '{n} smoke-free days' — impact.smokeFreeStreak ← smokeFreeStreak(): counts back up to 400 days while dayCigarettes(day) === 0, but returns 0 outright when the user has no smoking_entries rows at all.
- '… since your last cigarette' — impact.smokeFreeHours ← smokeFreeHours(): hours since the newest COMBUSTED entry (scans the last 50 rows, then falls back to a full-table scan), Infinity when nothing was ever burned.
- Milestone lines — currentQuitMilestone / nextQuitMilestone over QUIT_TIMELINE.
- 'Cigarettes' tile — impact.week ← cigarettesSince(daysAgoISO(6)), combustion-weighted; sub — impact.avgPerDay ← avgCigarettesPerDay(7).
- 'Spent' tile — impact.moneyWeek ← cigaretteMoneySince(daysAgoISO(6)) (CIGARETTE rows only) rounded to cents; sub — impact.moneyYearProjected = round(weekMoney / 7 × 365).
- 'Life cost' tile — impact.lifeMinutesWeek ← lifeMinutesLost(week) = round(week × 11).
- 'Nicotine' tile — impact.nicotineWeekMg ← round(nicotineMgSince(daysAgoISO(6))), un-weighted, per real product.
- 'Aerobic capacity −X%' — impact.aerobicPenaltyPct ← aerobicPenaltyPct(avgPerDay).
- 'Resting heart rate +X bpm' — impact.restingHrElevationBpm ← restingHrElevation(avgPerDay).
- Correlation window counts, step averages, session-kcal averages, lostSessionEquivalent, sessionsInWindow — smokingCorrelation(30) reading daily_step_logs (stepCount) and sessions (startTime, caloriesBurned) alongside the weighted daily cigarette map.
- 21-day bars — dailySeries(21), combustion-weighted per day, zero-filled for missing days via lastNDates.

**What it writes**

- logCigarettes(n, {trigger, productKey}) → smoking_entries (user_id, date = todayISO(), quantity, product_key — null means cigarette, trigger — always null from this screen, created_at = epoch ms).
- undoLastCigarette() → UPDATE quantity−1 or DELETE on smoking_entries.
- upsertSmokingProfile({enabled:false}) on 'Turn off tracker' → smoking_profiles. History rows are deliberately kept.

**Empty, loading and error states**

- Hard guard: `if (!impact || !profile) return null` — if the profile row exists but smokingImpact() returns null (only possible when enabled is false), the screen renders a completely blank body.
- Zero cigarettes today: the big number shows 0, no nicotine line, no cap warning; the cap ProgressBar still renders at 0 when a target exists.
- Nothing logged in 24 h: the DigestionCard renders NOTHING at all — its own guard is `if (!meals.length && !smokes.length) return null`, and this screen always passes meals=[]. So the 'clear to train' reassurance is invisible exactly when the user is clear.
- smokeFreeStreak === 0 (which includes every brand-new profile with no history): the entire smoke-free/milestone Card is hidden, so a first-time quitter sees no timeline until a full clean day has passed.
- No steps and no session data in the window: the whole 'Your Data' section is hidden. If only one of the two pairs has data, only that CompareRow draws.
- BarChart never shows its 'Not enough data yet' placeholder here — dailySeries(21) always returns 21 rows, so a brand-new user sees 21 flat 2px bars.
- No loading state and no error state anywhere; every read is synchronous.

> Two figures are computed with useState(() => …) rather than useMemo/useFocusEffect: `correlation` (smokingCorrelation(30)) and `series` (dailySeries(21)). They are captured once when the dashboard first mounts and DO NOT update when you log or undo — the bar chart and the comparison bars go stale within the session. Only `today`, `impact`, `nicotineToday`, `smokedShare` (store refresh) and `smokes` (useMemo keyed on today/nicotineToday) move. Also: money counts CIGARETTE rows only, so roll-ups, cigars and shisha are logged as costing nothing at all; the code comments this as deliberate (the profile only knows one price).

#### PrayersScreen

**Route** `Prayers (no params). RootNavigator options={{ title: '' }}.`  
**Reached from** Profile → LinkRow icon 'faith.crescent' label 'Prayer times'. Home → SectionHeader 'Prayers today' action link 'Times' (that whole Home section only appears when prayer settings are enabled). FastingScreen → Button 'Times come from your prayer settings' or 'Set up prayers'.

Configure a location and a calculation method, then show today's six computed times with a live countdown to the next prayer. All astronomy is done on-device; nothing is fetched.

**Layout, top to bottom**

- PageHero — icon 'faith.crescent' (MCI moon-waning-crescent), colour theme.colors.meditation, title 'Prayer times', subtitle "Calculated fully offline from the sun's position at your location. Times can differ a couple of minutes from your local mosque — follow the adhan where it matters." The subtitle is 157 characters, over PageHero's INLINE_SUBTITLE_MAX of 100, so it renders full-width beneath the icon/title row rather than beside it.
- SectionHeader 'Location'.
- Card (gap 10). When settings.latitude != null: a Row with a 16px 'faith.location' icon (Ionicons location-outline, accent colour) and body text = settings.locationName, falling back to '{lat.toFixed(2)}, {lng.toFixed(2)}'.
- Same Card: secondary Button, icon 'faith.location', title 'Use my location (GPS)' which becomes 'Locating…' with the loading spinner while the request is in flight.
- Same Card: caption textMuted 'Or pick a city:' then a wrapping Row of seven small Chips — Tunis, Sfax, Sousse, Kairouan, Bizerte, Gabès, Mecca. A chip is `active` when settings.locationName exactly equals its name (so a GPS fix, stored as 'Current location', leaves every chip inactive).
- SectionHeader 'Calculation method'.
- A wrapping Row of six small Chips coloured meditation: 'Tunisia (Ministry)', 'Muslim World League', 'ISNA (N. America)', 'Egyptian Authority', 'Umm al-Qura (Makkah)', 'Univ. of Karachi'. Active chip = settings.method ?? 'tunisia'.
- NEXT-PRAYER Card, accent meditation, only when times && next: caption 'Next prayer'; a baseline Row with the prayer name as h1 in the meditation colour and the time as h2 in tabular-nums; then caption 'in {minutesToHM(minutesUntil)}' (e.g. 'in 2h 15m').
- SectionHeader 'Today'.
- TODAY Card listing all six PRAYER_NAMES rows with a Divider between each: left = icon + label ('Fajr'/faith.dawn, 'Sunrise'/faith.sunrise, 'Dhuhr'/faith.sun, 'Asr'/faith.afternoon, 'Maghrib'/faith.sunset, 'Isha'/faith.night); right = the time in the 'mono' text variant. The row matching next.key is drawn in bodyStrong and the meditation colour, everything else in body/text with textMuted icons.
- When times or next is null, everything from the Next-prayer Card down is replaced by a single centred textFaint caption: 'Set a location above to see today's times.'

**Interactions**

- 'Use my location (GPS)' → Location.requestForegroundPermissionsAsync(); on grant, Location.getCurrentPositionAsync({accuracy: Balanced}) then upsertPrayerSettings({enabled:true, latitude, longitude, locationName:'Current location'}) and reload().
- Any city Chip → upsertPrayerSettings({enabled:true, latitude, longitude, locationName: c.name}) and reload(). This is the only way to enable prayer times without granting location.
- Any method Chip → upsertPrayerSettings({method: m.key}) and reload(). Written immediately, no save button. Note it does NOT set enabled:true, so tapping a method before setting a location changes the stored method but still shows the empty state.
- A 30-second setInterval bumps a `tick` counter purely to force a re-render so the 'in X' countdown moves. The times themselves are only recomputed by reload() on focus, so the list does not roll over to the next day while the screen is open.

**What it shows, and from where**

- Stored location, name and method — getPrayerSettings() (faithRepo) reading the single prayer_settings row with id = 1.
- The six times — todaysPrayerTimes() → computePrayerTimes({date: new Date(), latitude, longitude, method, asrFactor}) in lib/prayers.
- Next prayer name/time/countdown — nextPrayer(times) in lib/prayers, which iterates Fajr → Dhuhr → Asr → Maghrib → Isha and wraps to tomorrow's Fajr after Isha.
- 'in {…}' formatting — minutesToHM() in lib/time ('2h 15m' / '2h' / '15m').

**What it writes**

- upsertPrayerSettings({enabled, latitude, longitude, locationName}) → table prayer_settings, fixed row id 1 (insert on first write, otherwise update).
- upsertPrayerSettings({method}) → prayer_settings.method.

**Empty, loading and error states**

- Not configured (no row, or enabled false, or lat/lng null): the Location card and method chips render, and everything below is replaced by 'Set a location above to see today's times.'
- PERMISSION DENIED: there is no feedback whatsoever. `if (perm.granted)` simply falls through, the catch block is empty with the comment 'GPS unavailable — city presets still work', and the finally clause just clears the spinner. The button returns to its idle label and nothing on screen changes. This is the most conspicuous gap on the screen.
- GPS error / timeout: identical silent no-op.
- Loading: only the Button's own `loading` prop while locating; no skeleton for the times.
- High latitude: no visible error — the calculator silently falls back (sunrise = dhuhr − 6 h, maghrib = dhuhr + 6 h, fajr = sunrise − 1.5 h, isha = maghrib + 1.5 h, asr = dhuhr + 3.5 h) and prints plausible-looking but non-astronomical times.

> Sunrise is displayed as the second row of the Today card but is deliberately absent from nextPrayer's order array, so it can never be the highlighted 'next' entry. The Asr shadow factor (1 = Standard/Shafi, 2 = Hanafi) exists in the schema, is honoured by computePrayerTimes and is read by todaysPrayerTimes — but there is NO control for it anywhere in the app, so it is permanently 1. There is also no way to turn prayer times OFF from this screen: `enabled` is only ever written as true. The city preset list is six Tunisian cities plus Mecca — clearly a starting point rather than a finished picker.

#### FastingScreen

**Route** `Fasting (no params). RootNavigator options={{ title: '' }}.`  
**Reached from** Profile → LinkRow icon 'faith.fasting' label 'Fasting mode'. Nutrition → the fasting banner at the top of the diary (rendered only when currentFastingState() is non-null and the diary is showing today).

Enable Ramadan or intermittent fasting, run a live timer over the day's window (auto-synced to Fajr/Maghrib when prayer times are configured), keep a fasted-day streak, and show four fixed training tips.

**Layout, top to bottom**

- PageHero — icon 'faith.fasting' (MCI food-off), colour theme.colors.warning, title 'Fasting'. When enabled, right = Badge 'Ramadan' or 'Intermittent' in warning; when disabled, no badge.
- DISABLED BRANCH — body textMuted: 'Track Ramadan or intermittent fasting. FitCoach shows a live fasting timer, adapts the nutrition diary, and keeps a fasted-day streak.'
- DISABLED BRANCH — SegmentedControl with two options: 'ramadan' labelled 'Ramadan', 'intermittent' labelled 'Intermittent (16:8…)'.
- DISABLED BRANCH — Button 'Enable fasting mode', icon 'core.check', colour warning.
- ENABLED — LIVE STATE Card (only when currentFastingState() is non-null), accent warning while fasting / success while eating. Row: h2 'FASTING' (warning) or 'Eating window' (success), with icon 'faith.fasting' or 'nutrition.calories' at the right. Then a full-width ProgressBar of state.progress in the same colour. Then a Row: caption '{nextLabel} at {nextTime}' — nextLabel is literally 'Iftar / eating window' when fasting and 'Fast begins' when not — and bodyStrong '{minutesToHM(minutesUntilNext)} left'. When mode is ramadan AND prayer settings are enabled, a final textFaint line: 'Suhoor ends at Fajr · Iftar at Maghrib — synced with your prayer times.'
- ENABLED — SectionHeader 'Schedule', then a SegmentedControl 'Ramadan' / 'Intermittent' (note: the shorter label here, unlike the disabled branch).
- ENABLED, ramadan + prayers configured — a single secondary Button 'Times come from your prayer settings' with icon 'faith.crescent'.
- ENABLED, ramadan + prayers NOT configured — Card: caption 'Set your location in Prayer times for automatic Suhoor/Iftar — or set them manually:'; a Row of two Inputs 'Suhoor ends' (placeholder '04:00') and 'Iftar' (placeholder '19:00'), both keyboardType 'numbers-and-punctuation'; then a Row of two small Buttons, 'Save times' (primary) and 'Set up prayers' (secondary).
- ENABLED, intermittent — Card: caption 'Eating window (fast outside it):'; Row of two Inputs 'Eating starts' (placeholder '12:00') and 'Eating ends' (placeholder '20:00'); small Button 'Save window'.
- ENABLED — SectionHeader 'Your fasts'; Row of two StatTiles: 'Streak' (icon 'core.streak', value stats.streak, sub 'days', accent warning) and 'Last 30 days' (icon 'core.calendar', value stats.fastedLast30, sub 'fasted', accent accent).
- ENABLED — Button 'I completed today's fast' (icon 'core.check', colour warning), which becomes the disabled 'Today logged ✓' once a row exists for today.
- ENABLED — SectionHeader 'Training while fasting'; Card of four rows, each a 14px 'core.info' icon in accent plus a muted caption, from FASTING_TRAINING_TIPS verbatim: (1) 'Train light-to-moderate while fasted; schedule hard sessions after Iftar / in the eating window.' (2) 'Protect protein: hit your full daily protein target inside the eating window.' (3) 'Front-load hydration — most of your water now has to fit into non-fasting hours.' (4) 'Suhoor with slow carbs, protein and fat (e.g. bsisa, eggs, dates) sustains the day better than a sugary meal.'
- ENABLED — Button ghost 'Turn off fasting mode', colour textMuted.

**Interactions**

- Disabled-branch SegmentedControl → upsertFastingProfile({mode: m}) with no reload() (see notes — the control does not visually move).
- 'Enable fasting mode' → upsertFastingProfile({enabled:true, mode}) then reload().
- Schedule SegmentedControl → upsertFastingProfile({enabled:true, mode: m}) then reload(); switching mode swaps the whole times editor below it.
- 'Times come from your prayer settings' → navigation.navigate('Prayers').
- 'Set up prayers' → navigation.navigate('Prayers').
- Four HH:MM text Inputs (local state, seeded from the profile on reload).
- 'Save times' / 'Save window' — the same saveTimes() in both branches: writes ALL FOUR fields (manualSuhoor, manualIftar, eatingStart, eatingEnd) regardless of which two are visible, then reload().
- 'I completed today's fast' → logFastCompleted() then reload(). Disabled once stats.loggedToday.
- 'Turn off fasting mode' → upsertFastingProfile({enabled:false}) then reload(). No confirmation dialog (unlike the smoking tracker, which does confirm).
- A 30-second setInterval refreshes only `state` (currentFastingState()), so the countdown and the FASTING↔Eating flip happen live; stats and profile only refresh on focus.

**What it shows, and from where**

- enabled / mode / manual times — getFastingProfile() (faithRepo) reading the single fasting_profiles row id 1.
- FASTING vs Eating window, progress bar, next label/time, minutes left — currentFastingState() → resolveWindow(mode, {...}) + fastingState(window, now) in lib/fasting.
- Whether the sync note and the auto-times button show — getPrayerSettings()?.enabled.
- Ramadan window when synced — todaysPrayerTimes().fajr as fastStart and .maghrib as fastEnd.
- Streak and 'Last 30 days' — fastingStats() over fasting_logs.
- '{n} left' formatting — minutesToHM() in lib/time.

**What it writes**

- upsertFastingProfile({enabled, mode}) and upsertFastingProfile({manualSuhoor, manualIftar, eatingStart, eatingEnd}) → table fasting_profiles, fixed row id 1.
- logFastCompleted(todayISO()) → INSERT into fasting_logs (user_id, date, completed = true). It is an insert-if-absent: there is no un-log, no toggle, and no delete path anywhere in the app.

**Empty, loading and error states**

- Disabled: only the intro paragraph, the mode SegmentedControl and the enable Button.
- Enabled but currentFastingState() null: impossible in practice, since the state is null only when the profile is disabled — but the live Card is guarded on `state &&` regardless.
- Stats block is guarded on `stats &&`; fastingStats() always returns an object, so with no history it renders Streak 0 / Last 30 days 0.
- 'Today logged ✓' — the disabled state of the log button.
- Malformed HH:MM input has no validation and no error: hmToMinutes returns null and fastingState substitutes 0 (midnight), silently producing a nonsense window.

> Two real defects. (1) In the disabled branch the SegmentedControl writes the mode but never calls reload(), and its `value` is derived from profile?.mode — so tapping 'Intermittent (16:8…)' before enabling appears to do nothing; the selection only materialises after 'Enable fasting mode'. (2) saveTimes() always writes all four time fields from local state, so saving the intermittent window also overwrites manualSuhoor/manualIftar with whatever was last loaded, and vice versa. Also worth knowing: keyboardType 'numbers-and-punctuation' is iOS-only and degrades to the default keyboard on Android, which is this app's primary platform. The streak query fetches only the last 120 days of logs but the streak loop runs to 130 iterations, so a streak longer than ~120 days is silently truncated.

### Engines behind this area

- **`src/data/nicotineProducts.ts`** — The nicotine product catalogue — 11 entries — and the combustion distinction the entire health model turns on. Each product declares `nicotineMg` (typically ABSORBED per unit), `combusted` (was something burned and inhaled), `cigaretteEquivalent` (how many cigarettes' worth of COMBUSTION damage one unit carries — zero for everything not burned, which the file states is the point rather than an oversight), an optional `isNrt` flag, an icon key and a per-product `note` that states that product's own trade-off. Exports findNicotineProduct(key), DEFAULT_PRODUCT_KEY = 'cigarette', productOrDefault(key) (null → cigarette, so every pre-v2.28 row stays correct without a backfill), and NICOTINE_GROUPS for the picker.  
  *Constants:* COMBUSTED — cigarette: 1.1 mg, cigEq 1.0, unit 'cigarette'. rollup: 1.2 mg, cigEq 1.0, unit 'roll-up'. cigar: 10 mg, cigEq 4, unit 'cigar'. shisha: 3 mg, cigEq 10, unit 'session'. heated (IQOS-style): 1.1 mg, cigEq 0.5, unit 'stick'. NOT COMBUSTED — vape: 2 mg, cigEq 0, unit 'session'. snus: 3.5 mg, cigEq 0, unit 'portion'. pouch: 4 mg, cigEq 0, unit 'pouch'. NRT — nrt-gum: 2 mg, cigEq 0, unit 'piece'. nrt-lozenge: 2 mg, cigEq 0, unit 'lozenge'. nrt-patch: 15 mg, cigEq 0, unit 'patch'. Three groups, worst-first: 'Smoked' [cigarette, rollup, cigar, shisha, heated], 'Smoke-free alternatives' [vape, snus, pouch], 'Stop-smoking medicines' [nrt-gum, nrt-lozenge, nrt-patch]. The header comment describes a `relativeHarm` field for coarse ordering — that field does not exist on the interface or on any entry.
- **`src/lib/smoking.ts`** — The health-impact model. lifeMinutesLost, combustedEquivalents (Σ quantity × cigaretteEquivalent), totalNicotineMg (cigarettes use the user's own nicotineMgPerCig setting, every other product uses its own catalogue figure), combustedShare (burned nicotine ÷ all nicotine — the file argues this is the single most useful number for a switcher, because it falls as you move off cigarettes even while total nicotine stays flat), moneyCost, aerobicPenaltyPct, restingHrElevation, aerobicEfficiency, lostSessionEquivalent, the QUIT_TIMELINE, and currentQuitMilestone / nextQuitMilestone. Cites Shaw/Mishra/Dobson BMJ 2000;320:53 for the 11-minute figure and the US Surgeon General / CDC for the recovery timeline.  
  *Constants:* MINUTES_LOST_PER_CIGARETTE = 11. NICOTINE_MG_PER_CIGARETTE = 1.1 (absorbed). TAR_MG_PER_CIGARETTE = 10 and CO_MG_PER_CIGARETTE = 14 are exported but never used anywhere. DEFAULT_SMOKING_SETTINGS = {20 per pack, 8 per pack, '$', 1.1 mg, baseline 10/day, mode 'quitting'}. aerobicPenaltyPct = min(15, round(avg × 0.6 × 10)/10) — i.e. 0.6 % per cigarette/day, hard-capped at 15 %. restingHrElevation = min(12, round(avg × 0.5)) — 0.5 bpm per cigarette/day, capped at 12 bpm. lostSessionEquivalent = round(sessions × pct / 100 × 10)/10. QUIT_TIMELINE, six milestones: 20 minutes (0.333 h) 'Heart rate and blood pressure drop toward normal.'; 12 hours 'Blood carbon-monoxide level returns to normal — more oxygen to muscles.'; 2 days (48 h) 'Nerve endings regrow; sense of taste and smell improve.'; 2 weeks (336 h) 'Circulation improves; walking and training feel easier.'; 1–3 months (720 h) 'Lung function can improve by up to ~30%.'; 1 year (8760 h) 'Excess risk of coronary heart disease is about half a smoker's.' nicotineMg() and aerobicEfficiency() are exported and never called (nicotineMg is even imported into smokingRepo unused).
- **`src/lib/smokeClock.ts`** — The 'how long after smoking until it is sensible to train' model — two clocks that stack. (1) An ACUTE nicotine floor since the last use of ANY nicotine product, longer when the last thing was burned, scaled by intended intensity. (2) A cumulative CARBON MONOXIDE load in cigarette-equivalents, summed over recent combusted events with exponential decay, that must fall under an intensity threshold. The wait is the later of the two, capped. Exports coLoad(), minutesToDecay(), smokeStatus() (returns null when nothing was used in the lookback window) and currentSmoke(). The physiology comment cites CO binding haemoglobin ~240× more tightly than oxygen, roughly one percentage point of COHb per cigarette, and measurable VO2max loss from ~4 % COHb.  
  *Constants:* NICOTINE_ACUTE_MIN — hard: 45 min after something combusted / 30 min otherwise; moderate: 30 / 20; light: 15 / 10. CO_HALF_LIFE_MIN = 240 (4 h breathing room air). CO_THRESHOLD (cigarette-equivalents on board that are acceptable) — hard 2, moderate 3, light 5. SMOKE_LOOKBACK_MIN = 24 × 60 = 1440. MAX_SMOKE_WAIT_MIN = 300 (the whole answer is clamped to 5 hours). coLoad = Σ cigEq × qty × 2^(−Δt/240) over combusted events inside the lookback. minutesToDecay(load, target) = 240 × log2(load/target), 0 when already under. waitFor = round(min(300, max(nicotineWait, coWait))); `limitedBy` is 'co' when coWait > nicotineWait, else 'nicotine'. readyFor scans hard → moderate → light and returns the first level with zero wait. progress = elapsed / (elapsed + wait). One cigarette on an empty system is under every threshold, so only the acute floor applies; stacking is what makes the CO term take over.
- **`src/repositories/smokingRepo.ts`** — All smoking persistence and every aggregate on the dashboard. Deliberately runs TWO different counts: combustion-weighted for health figures (dayCigarettes, cigarettesSince, dailyCountMap, dailySeries, avgCigarettesPerDay) and raw per-product for nicotine and money (nicotineMgSince, cigaretteMoneySince), with an in-file comment explaining that weighting nicotine would report zero for a pouch-only week and price a shisha session as ten cigarettes, both fabrications. Also builds recentSmokeEvents() for the smoke clock, smokeFreeHours() / smokeFreeStreak(), the SmokingImpact summary, and smokingCorrelation() against the user's own daily_step_logs and sessions.  
  *Constants:* dayCigarettes rounds to 0.1. recentSmokeEvents(hours = 24) reads today's plus yesterday's rows so a 23:40 cigarette still counts against a 00:20 session, and returns [] when the module is off. smokeFreeHours scans the newest 50 rows for the last COMBUSTED entry (falling back to a full scan), so switching to pouches does not reset the recovery timeline — the comment says counting a pouch as a reset would pin a switcher at '20 minutes' forever. smokeFreeStreak walks back up to 400 days and returns 0 when the user has no entries at all. smokingImpact windows: week = cigarettesSince(daysAgoISO(6)), avg = avgCigarettesPerDay(7), moneyYearProjected = round(weekMoney/7 × 365), lifeHoursYearProjected = round(lifeMinutesLost(avg × 365)/60) — computed but never displayed on any screen. smokingCorrelation default window 30 days; averages are null when a bucket is empty. cigaretteMoneySince filters to productOrDefault(key).key === 'cigarette' only.
- **`src/stores/smokingStore.ts`** — Zustand store holding profile, enabled, today, impact, nicotineToday, smokedShare. load() (called on screen focus) reads everything; refresh() re-reads after any write; enable/updateProfile/disable upsert the profile; add(n, trigger, productKey) and undo() write entries then refresh.  
  *Constants:* add() defaults n = 1 and productKey null (= cigarette). The `trigger` parameter (stress, coffee, social…) is plumbed all the way to the smoking_entries.trigger column and is never supplied by any caller — no UI writes it. disable() sets impact to null without touching entries.
- **`src/lib/prayers.ts`** — Offline prayer-time calculation using the PrayTimes.org approach: Julian date → sun declination and equation of time → hour angles for each twilight angle. Exports PRAYER_METHODS, findMethod, PRAYER_NAMES (the six display rows with icons), computePrayerTimes, nextPrayer, and CITY_PRESETS. Times are 'HH:MM' local strings using the device's UTC offset.  
  *Constants:* Six methods (fajrAngle / isha): tunisia 'Tunisia (Ministry)' 18/18°; mwl 'Muslim World League' 18/17°; isna 'ISNA (N. America)' 15/15°; egypt 'Egyptian Authority' 19.5/17.5°; umm_al_qura 'Umm al-Qura (Makkah)' 18.5° and Isha 90 minutes after Maghrib; karachi 'Univ. of Karachi' 18/18°. Default method 'tunisia'. sunAngle = 0.833° (atmospheric refraction + solar radius). Asr angle = −atan2(1, asrFactor + tan|lat − decl|) with asrFactor 1 = Standard/Shafi, 2 = Hanafi (default 1, no UI). dhuhr = 12 + tz − lon/15 − eqt. High-latitude fallbacks when the hour angle is undefined: sunrise = dhuhr − 6 h, maghrib = dhuhr + 6 h, fajr = sunrise − 1.5 h, isha = maghrib + 1.5 h, asr = dhuhr + 3.5 h. nextPrayer iterates Fajr, Dhuhr, Asr, Maghrib, Isha only (Sunrise excluded) and wraps to tomorrow's Fajr. CITY_PRESETS: Tunis 36.8065/10.1815, Sfax 34.7406/10.7603, Sousse 35.8256/10.6369, Kairouan 35.6781/10.0963, Bizerte 37.2744/9.8739, Gabès 33.8815/10.0982, Mecca 21.4225/39.8262.
- **`src/lib/fasting.ts`** — resolveWindow(mode, opts) turns a mode plus prayer times or manual strings into {fastStart, fastEnd}; fastingState(window, now) works out whether you are inside the fast (handling overnight wrap), what is next, minutes until it, and how far through the current phase you are. Also exports the four FASTING_TRAINING_TIPS strings rendered verbatim on the screen.  
  *Constants:* Ramadan: fastStart = prayers.fajr ?? manualSuhoor ?? '04:00'; fastEnd = prayers.maghrib ?? manualIftar ?? '19:00'. Intermittent: fastStart = eatingEnd ?? '20:00'; fastEnd = eatingStart ?? '12:00' (i.e. fasting is defined as OUTSIDE the eating window). inFast test handles wrap: start ≤ end ? now ∈ [start, end) : now ≥ start || now < end. nextLabel is 'Iftar / eating window' while fasting and 'Fast begins' while eating. progress = elapsed/total clamped to 1, with a `|| 24*60` guard so a zero-length window becomes a full day. hmToMinutes returning null (malformed input) silently degrades to 0 = midnight.
- **`src/repositories/faithRepo.ts`** — Persistence for both faith features. Prayer settings and fasting profile are single rows with a hardcoded ROW_ID = 1. todaysPrayerTimes() returns null unless enabled and both coordinates are set. currentFastingState() returns null unless the fasting profile is enabled, and only passes prayer times into resolveWindow when mode === 'ramadan'. Also holds the five-prayer check-in API used by Home (prayersDone / togglePrayer over prayer_logs) and fastingStats().  
  *Constants:* DAILY_PRAYERS = ['fajr','dhuhr','asr','maghrib','isha'] — five, excluding sunrise. togglePrayer deletes the row if present, inserts if absent; presence of a row IS the 'done' record. asrFactor is coerced as (s.asrFactor === 2 ? 2 : 1). fastingStats queries fasting_logs back to daysAgoISO(120), starts the streak at today when today is logged else at yesterday ('today may not be finished yet'), and loops up to 130 iterations; fastedLast30 counts distinct completed dates ≥ daysAgoISO(29). logFastCompleted inserts only when no row exists for that date — there is no un-log.
- **`src/lib/postSession.ts`** — The post-session margins engine: a STRAIN score from what was actually logged, then six margins scaled linearly between an easy-session and a brutal-session value. sessionStrain() weights lifting as 0.30 duration + 0.45 effort + 0.25 relative tonnage; cardio as typeIntensity × (0.4 + 0.6 × duration/90) with pace overrides; mindbody as 0.15 × duration. postSessionMargins() returns water / eat / smoke / alcohol / cold / next, with the smoke line omitted when the smoking module is off. marginStatuses() resolves each into remaining minutes, an openAt and (for 'eat') a byAt window end. marginsStillRunning() ignores the multi-day 'next' line.  
  *Constants:* Strain levels: light < 0.30 ≤ moderate < 0.60 ≤ hard < 0.85 ≤ brutal. STRAIN_LABEL: 'an easy session' / 'a solid session' / 'a hard session' / 'a brutal session'. Lifting: duration full at 90 min; effort full at 24 effective sets, +0.1 when avg RIR ≤ 2, +0.1 × failureShare; volume full at 150 × bodyweight kg (bodyweight defaults to 75 kg). TYPE_INTENSITY: martial_arts 0.9, sport 0.8, cardio 0.7, outdoor 0.5, mindbody 0.15, meditation 0.05, custom 0.5. Pace overrides: < 6 min/km forces intensity to 1, < 8 min/km to at least 0.8, > 11 min/km caps at 0.35. MARGINS (minutes after the session END, linear easy→brutal): Water 0 always. Eat wait 15→30 with a window end (byMin) 120→60 — the window gets SHORTER as the session gets harder. SMOKING 60→150 min, omitted entirely when smokingEnabled is false. ALCOHOL 90→300 min, always shown regardless of any tracker. Cold plunge 240→360 min for lifting, 0 for anything else. Next hard session (same muscles) 1440→4320 min (24→72 h) for lifting, 720→2880 min (12→48 h) otherwise. Copy: smoking's why is 'Breathing is still deep, so smoke deposits further in; carbon monoxide takes the oxygen that repair wants; nicotine narrows the vessels flushing the muscles you just used.'; alcohol cites ~1.5 g/kg cutting MPS by up to a third for the next day.
- **`src/repositories/postSessionRepo.ts`** — postSessionFor(sessionId) builds the strain input from a finished session — completed sets with reps/rpe/toFailure, session.totalVolume, session.distanceM, latestWeight() for bodyweight — and calls postSessionMargins with smokingEnabled: isSmokingEnabled(userId). activePostSession() finds the most recent finished session whose margins are still running, for the Home reminder.  
  *Constants:* endedAt = session.endTime ?? startTime + durationS × 1000; returns null when neither exists. activePostSession scans only the 3 most recent sessions and ignores anything that ended more than 12 h ago (12 × 3_600_000 ms).
- **`src/components/PostSessionCard.tsx`** — Renders the margins. Icons: after.water (cup-water), after.eat (silverware-fork-knife), after.smoke (smoking-off), after.alcohol (glass-cocktail-off), after.cold (snowflake), after.next (calendar-refresh). Each line is its own progress meter. Ticks every 60 s. Tapping a line expands its `why` and `advice`; in compact mode lines are not tappable.  
  *Constants:* Status strings: for the eat window — 'from HH:MM (in X) · until HH:MM', then 'now — until HH:MM', then 'window closed HH:MM — still eat, just sooner next time'. For waits — 'now' when waitMin is 0, 'open since HH:MM' once passed, 'from HH:MM (in X)' while waiting, and for waits ≥ 12 h a weekday prefix ('Tue 19:40 (in 2 d)'). Compact mode (Home) drops the water and next lines and hides anything already open. Header tone is warning for hard/brutal, accent otherwise. Footer (full mode only): 'Tap a line for the why. Estimates from the standard evidence — the harder the session, the more each of these costs, and for longer.'
- **`src/components/DigestionCard.tsx + src/lib/readiness.ts`** — The 'can I train yet?' card used on the Smoking screen (compact, meals=[], intensity 'hard'), Home, Nutrition and Train. trainReadiness() takes the LATER of the stomach wait and the smoke wait and names the governor, because the fix differs — wait out a meal, or don't light the next one. The card draws two independent Meters that are never merged into one bar, and re-renders on a 60-second tick.  
  *Constants:* Guard: returns null when meals.length === 0 AND smokes.length === 0 — which is why the Smoking screen shows nothing here until something is logged. INTENSITY_LABEL: light 'a walk or mobility', moderate 'a normal session', hard 'sprints or heavy lifting'. formatWait: 'clear' at ≤ 0, '{n} min' under an hour, else '{h} h {mm}'. Smoke detail when clear but recent: 'Last one {X} ago — out of the way' plus '(CO ~{n} cigarettes' worth, fading)' only when coLoad > 0.3.
- **`src/lib/restPhysiology.ts`** — The other consumer of the CO load — converts coLoad into carboxyhaemoglobin and into a longer inter-set rest prescription. Only relevant here because it is the second place the smoking module's numbers reach the training engine (via ActiveSessionScreen passing coLoad(recentSmokeEvents())).  
  *Constants:* BASELINE_COHB_PCT = 0.7 (everyone carries it; only the excess is penalised). COHB_PER_CIG_EQ = 3.5 percentage points per cigarette-equivalent on board. MAX_COHB_PCT = 12. O2_LOSS_PER_COHB_PCT = 0.012. MAX_O2_LOSS = 0.2. Note the 3.5 pp/cig-eq here is materially steeper than the '~1 pp per cigarette' stated in smokeClock's own header comment — the two files do not agree.

### Notes for the redesign

THE ONE IDEA THE SMOKING REDESIGN MUST NOT BREAK: there are four parallel accounting systems and mixing them is the failure mode the code repeatedly guards against in comments. (1) The big "Today" number is COMBUSTION-WEIGHTED — logging a pouch, vape, patch, gum or lozenge leaves it at 0.0, heated tobacco adds 0.5, a cigar adds 4, a shisha session adds 10. (2) Nicotine mg is raw per-product and un-weighted. (3) Money counts ONLY rows whose product is literally 'cigarette' — roll-ups, cigars and shisha are recorded as costing nothing, because the profile knows exactly one price. (4) The smoke-free timer resets only on something BURNED, so a switcher's milestones keep advancing while they use pouches. A design that unifies these into one "cigarettes today" figure destroys the module's whole argument.

CONFIRMED DEFECTS AND STALENESS:
- SmokingScreen: `correlation` (smokingCorrelation(30)) and `series` (dailySeries(21)) use useState(() => …), so the "Your Data" comparison and the 21-day bar chart are captured once on mount and never update when you log or undo within the session.
- SmokingScreen: the DigestionCard is passed meals=[] and its own guard is `if (!meals.length && !smokes.length) return null` — so the smoke clock card is invisible exactly when the user is clear, which is when the reassurance would be most useful.
- SmokingScreen: `if (!impact || !profile) return null` renders a totally blank page rather than any fallback.
- FastingScreen disabled branch: the mode SegmentedControl writes to the DB but never reloads, and its value comes from the un-refreshed profile, so it appears not to respond until "Enable fasting mode" is pressed.
- FastingScreen: saveTimes() writes all four time fields from local state in both branches, so saving an intermittent window also overwrites manualSuhoor/manualIftar and vice versa.
- FastingScreen: no confirmation on "Turn off fasting mode" (the smoking tracker does confirm, with an Alert).
- FastingScreen: fastingStats queries 120 days of logs but loops 130 — streaks beyond ~120 days silently truncate.
- PrayersScreen: a DENIED location permission produces absolutely no feedback — `if (perm.granted)` falls through, the catch is empty, only the spinner stops. Same for a GPS timeout. This is the single biggest UX gap in the area.
- PrayersScreen: tapping a method chip writes `method` but not `enabled:true`, so a user who picks a method first still sees the empty state.
- restPhysiology uses 3.5 COHb percentage points per cigarette-equivalent while smokeClock's header comment states "roughly one percentage point per cigarette" — the two models disagree by 3.5×.

MISSING UI FOR THINGS THE DATA MODEL SUPPORTS:
- smoking_entries.trigger (stress, coffee, social…) is in the schema, plumbed through logCigarettes and store.add, and NEVER written by any screen. There is no trigger picker anywhere.
- prayer_settings.asrFactor (1 = Standard/Shafi, 2 = Hanafi) is honoured by the calculator but has no control anywhere in the app; it is permanently 1.
- There is no way to disable prayer times once enabled — `enabled` is only ever written true, and there is no off switch on PrayersScreen (contrast the smoking and fasting screens, both of which have one).
- fasting_logs has no un-log/toggle/delete path; a mistaken "I completed today's fast" cannot be undone in-app.
- deleteSmokingEntry(), dayUnits(), nicotineMg(), aerobicEfficiency(), TAR_MG_PER_CIGARETTE and CO_MG_PER_CIGARETTE are all defined and never called. impact.lifeHoursYearProjected is computed and never displayed. The `icon` field on every nicotine product is never rendered — the picker is text-only.
- baselinePerDay ("Typical / day", a required field on the setup form) is stored, carried into SmokingSettings, and used by nothing.
- nicotineMgPerCig is fixed at 1.1 by the setup form's save() and has no input.

WHERE THIS AREA SURFACES OUTSIDE ITS OWN SCREENS (all need to stay coherent with any redesign):
- Home: a smoking tile (only when enabled) reading "{n}-day smoke-free streak" or "{n} cigarettes today" with sub "~{avg}/day · −{pct}% aerobic (est.)"; a "Prayers today" section (only when prayer settings are enabled) of five 46px circular check-in buttons — Fajr, Dhuhr, Asr, Maghrib, Isha — that toggle prayer_logs rows, footed by "{n} of 5 prayers marked done"; and the compact PostSessionCard titled "After today's session".
- Nutrition: a fasting banner at the top of the diary (today only) reading "Fasting — iftar / eating window at HH:MM" or "Eating window — fast begins at HH:MM"; and a smoking quick-tracker card with its own inline −/+ 38px buttons showing "{n} cigarettes today · {cur}{moneyWeek} this week".
- AddFood: a fasting-aware banner — "You're fasting — eating window opens at HH:MM (X). Log now only if you're breaking your fast." Logging is never blocked.
- Stats: a "Smoking Impact" summary card with avg/day, week money, week life-hours, the aerobic and resting-HR estimates, and a one-line steps comparison.
- Train / ActiveSession: recentSmokeEvents() feeds the readiness card and coLoad() feeds the inter-set rest prescription via restPhysiology.
- WeatherCard: currentFastingState()?.fasting is passed into the weather/hydration context.
- Achievements and the daily-challenge wheel: challenge 'prayers-5' ("All Five", target 5, requires 'prayer') and 'smoke-free' ("A Clean Day", requires 'smoking'); achievements 51–59 (smoking milestones, incl. id 52 keyed to the 12-hour smoke-free mark), 81–89 (fasting/prayer), 104–106 (prayer streaks). Several of these achievement criteria describe behaviour the UI does not actually track (e.g. "Check the app within 15 minutes of the next prayer countdown").

TONE: every string in this area is written to be non-judgmental and to label estimates as estimates ("no judgment, tomorrow's a fresh start", "(Estimate.)", "Observational — your own logs", "This is calculation, not authority… follow the adhan where it matters"). The product-picker ordering is worst-first on purpose so the ordering itself carries information. Any redesign that flattens this into scoreboard language would contradict the code's stated intent.

---

## 9. The live session and its history (ActiveSession, SessionRecap, SessionHistory, SessionDetail, ExerciseLibrary, ExerciseStats, ExercisePeek) plus the rest / calorie / difficulty engines behind them

This area is the check-in → log → check-out loop and everything you can look at afterwards. A session is a row in `sessions` created by `startSession()` the moment you pick a type; `ActiveSessionScreen` is a live view onto the zustand `sessionStore` (it ignores its own `sessionId` route param entirely and renders whatever session the store holds), and it branches into three completely different bodies by `metaFor(sessionType).flow` — `lifting`, `cardio`, `mindbody`. The lifting body is the heavy one: a persisted warm-up checklist, an RPE explainer, per-exercise cards with reorder / swap / delete, a set form whose fields are chosen by the exercise's `trackingType` and whose weight field is relabelled by its `loadProfile`, and — the centrepiece — an evidence-based rest prescription (`prescribeRest`) that is recomputed for every single set from the set itself, the lifter's history, their experience level, and their live physiological state (carbon monoxide on board, kcal still in the stomach, 7-day sleep). `finalizeSession()` then writes duration, volume, per-exercise-MET calories and PR flags in one transaction and hands a `FinalizeResult` to `SessionRecapScreen`. History is two screens: a flat list (`SessionHistoryScreen`, segmented Sessions / Walks & Runs) and an editable detail (`SessionDetailScreen`), which re-derives the per-exercise calorie split on read rather than storing it. `ExerciseLibraryScreen` is the picker and the browser in one screen, with four (sometimes five) stacked scrollable filter rows and a five-dot difficulty grade on every row.

### Screens (7)

#### ActiveSessionScreen

**Route** `ActiveSession { sessionId: number }`  
**Reached from** navigation.replace('ActiveSession') from SessionTypePickerScreen (l.31), SplitPickerScreen (l.44), MethodPickerScreen (l.59/65/71), ProgramPickerScreen (l.63), SpecialProgramDetailScreen (l.56); navigation.navigate from TrainScreen when starting a saved routine (l.65) and from the 'Session in progress / Resume' card (l.101). Registered in RootNavigator with options { title: 'Session', headerBackVisible: false } — there is deliberately no back button.

The live session. Runs the elapsed timer, logs sets/activities, drives the rest timer and its PCr bar, and checks the session out into a recap. It is the only writer of set data during training.

**Layout, top to bottom**

- IMPORTANT: the screen NEVER reads route.params. It renders whatever useSessionStore() holds; the sessionId param is decorative. If store.activeId is null or metaFor() fails: EmptyState title 'No active session', message 'Start one from the Train tab.', plus a Button 'Back' → navigate('Main'). Nothing else renders.
- Wrapper: <Screen> = SafeAreaView(edges top) + ScrollView, contentContainerStyle padding theme.spacing.lg, paddingBottom lg+96, gap theme.spacing.lg, keyboardShouldPersistTaps='handled'.
- 1. TIMER HEADER — Card accent={meta.color}. Row space-between: left Row(gap 10) = Icon meta.icon size 24 in meta.color, then a column with Text variant='h3' {meta.label} and Text variant='caption' color='textMuted' literal 'In progress'. Right: Text variant='display', fontVariant tabular-nums, color meta.color, showing formatDuration(elapsed). elapsed ticks every 1000 ms from Math.round((Date.now() - startedAt)/1000).
- 2. <RestTimerBanner /> — renders null unless restEndsAt is set AND remaining > 0. Card accent={theme.colors.warning}, gap 6. Row: Icon 'core.timer' (warning) + column [Text bodyStrong 'Rest'; if restRx present a caption 'SYSTEM_LABEL[rx.system] · CNS_LABEL[rx.cns]', i.e. 'ATP-PCr (phosphagen) · CNS high' / 'Glycolytic · CNS moderate' / 'Oxidative · CNS low']. Then Text variant='h2' tabular-nums in warning = formatDuration(remaining). Then a Pressable 'Skip' (variant label, textMuted, hitSlop 8) → clearRest(). Below: ProgressBar height 5, progress = pcr/100, color = success when pcr>=90 else warning. Below that: Text caption textFaint 'Creatine phosphate ~{pcr}% refilled' + ', a heavy set wants 90%+' appended only when rx.system === 'phosphagen' (exact copy: ' — a heavy set wants 90%+'). Ticks every 250 ms; auto-calls clearRest() when remaining hits 0.
- 3. <ExerciseSection> — rendered for EVERY session type, not just lifting. Contents in order: (a) WarmupChecklist, lifting only and only when detail.length > 0; (b) <RpeGuide />, lifting only and only when detail.length > 0; (c) when detail.length > 0, a Row space-between with Text label textMuted '{n} exercise' / '{n} exercises' on the left and, lifting only, 'Volume {N} kg' on the right (N = sum of weightKg×reps over completed sets with both present, Math.round + toLocaleString); (d) either the EmptyState or the list of ExerciseLogCards; (e) a secondary Button, icon 'core.add', titled 'Add Exercise' (lifting) or 'Add Exercise / Activity' (everything else) → navigate('ExerciseLibrary', { pick: true }).
- 3a. WARM-UP CHECKLIST — Card accent warning, gap 10. Row: Icon 'core.timer' 18 warning + Text h3 'Warm up first (mandatory)'. Then one Pressable row per DISTINCT primaryMuscle in the session that has an entry in WARMUPS_BY_MUSCLE: Icon 'core.check' (success) when ticked else 'core.add' (textFaint), Text bodyStrong = MUSCLE_LABELS[m] with textDecorationLine 'line-through' when done, and Text caption textMuted = the warm-up prescription string (e.g. chest → 'Arm circles ×15, then 1 light set of push-ups or band presses'; neck → 'Slow nods, turns and tilts ×10 each way, then one round of light 4-way isometric holds (10 s each) — never start the neck cold'). Footer: Text caption textFaint 'Warming up raises muscle temperature and primes the joints — it directly cuts injury risk before your working sets.' When every muscle is ticked the whole Card is REPLACED by a single Row: Icon 'core.check' 16 success + Text caption success 'Warm-ups done — lift safe.' Renders null entirely if no exercise's primaryMuscle has a warm-up entry.
- 3b. RPE GUIDE (src/components/RpeGuide.tsx) — collapsed Card. Header Pressable: Icon 'core.info' 16 textMuted, Text bodyStrong 'What is RPE?', Text caption textMuted 'How many reps you had left — not how hard it felt. 10 = none left.', chevronUp/chevronDown at right. Expanded: Divider then 6 rows from RPE_SCALE — 10 'Could not have done another rep.', 9 'One more rep was in you, no more.', 8 'Two more reps were in you.', 7 'Three more reps — still hard, still counts.', 6 'Four more. Starting to drift out of the growth range.', ≤5 'Comfortable. Warm-up territory.' The 10/9/8/7 pills are tinted success+'22' (productive), 6 and ≤5 are surface. Footer caption: 'Roughly 7–10 is where growth happens — that's 0 to 3 reps left. Below that a set costs you time without buying much. If you genuinely went to the limit, tick "to failure" instead of guessing a number.'
- 3c. EMPTY STATE (detail.length === 0) — EmptyState icon 'strength.dumbbell' / title 'Add your first exercise' / message 'Pick from the library, then log sets as you go.' for lifting; icon 'cardio.running' / title 'Add an activity (optional)' / message 'Log the specific drills or activities you did — each with its own reps, time or distance.' otherwise.
- 3d. EXERCISE LOG CARD (one per exercise, in exerciseLogs.orderIndex order) — Card accent={meta.color}, gap 10. Header Row: position badge Text caption tabular-nums fontWeight 700 '{i+1}/{total}' (coloured accent when this is 'up next', else textFaint); Icon lv.iconKey 20 accent; Text h3 numberOfLines=1 exerciseName; a Badge 'Up next' (accent) on the FIRST exercise with no completed set; then four icon Pressables at the right edge — chevronUp (move up, opacity 0.25 and disabled unless canMoveUp), chevronDown (move down, same rule), 'core.swap' (toggles the alternative picker; tinted accent while open, else textFaint), 'core.delete' (removes the whole exercise log immediately, NO confirmation).
- 3d-i. If any set is completed, a caption textFaint under the header: 'Started — its place in the running order is fixed now. Anything you have not begun can still be moved.' (canMoveUp/canMoveDown are both false once started, and moveExerciseLog() independently refuses.)
- 3d-ii. ALTERNATIVE PICKER (only when the swap icon is toggled on) — a surfaceAlt block, radius md, padding 10. Text label textMuted 'Too hard? Swap for an easier one — same muscle' + ' · {SUB_MUSCLE_LABELS[target.subMuscle]}' when the target has an explicit subMuscle. Up to 6 rows, each a Pressable: exercise name (numberOfLines 1) with a caption underneath reading 'same sub-muscle' in success colour, or 'same muscle' in textFaint; at the right, five 5×5 dots (filled accent up to the estimated difficulty, theme.colors.border beyond) and a 'core.swap' icon in accent. Tapping swaps IN PLACE via replaceExerciseLog (keeps the orderIndex slot) and closes the picker. Empty case copy: 'Nothing in the library trains this muscle more easily. Rather than offer you a different exercise that happens to share a muscle group, it offers nothing.'
- 3d-iii. LOGGED SETS LIST (when lv.sets.length > 0) — one Row per set: set number in a 28px column, then describeSet(s) joined with ' · ' in this order — weight (prefixed '+{n} kg' when loadMode==='added' and n>=0, '{n} kg (assisted)' when negative, '{n} kg load' when loadMode==='carried', plain '{n} kg' otherwise), '{reps} reps', formatDuration(durationS), '{x.xx} km', then 'to failure' OR 'RPE {n}' (never both); falls back to the literal 'logged' if nothing is set. Right column 24px: a trophy Icon 'core.pr' (warning) if isPr, otherwise a Pressable 'core.close' (textFaint) that deletes that set immediately.
- 3d-iv. Divider, then the SET FORM — a Row of Inputs, present/absent by fieldsFor(trackingType) and profileFor(): weight input shown when trackingType==='reps_weight' OR loadMode is 'added'/'carried'; its label is 'Weight / dumbbell' when equipmentType==='dumbbell', else 'Weight' / '+ kg' / 'Load kg' from LOAD_FIELD_LABEL. Reps input ('Reps', placeholder '0') for reps_weight | reps_only | custom, and hidden while 'to failure' is ticked. Minutes input for duration | duration_distance. Distance input ('Distance', placeholder 'km') for distance | duration_distance. A 64px-wide 'RPE' input (placeholder '–') for lifting only, hidden while 'to failure' is ticked. All keyboardType='numeric'.
- 3d-v. FIELD HELP CAPTIONS (textFaint, conditional). Dumbbell + reps_weight: 'One dumbbell, not the pair — 20 kg means 20 in each hand. Keep it the same every time and your progress stays comparable.' loadMode 'added': either 'Weight added on a belt or vest — leave empty for bodyweight, negative for band or machine assistance (−15 = the band takes ~15 kg).' when profile.assistable, else 'Weight added on a belt, vest or between the ankles — leave empty for pure bodyweight.'; both then append ' The set really moves ~{round(bwFraction × bodyKg)} kg of you before the plates.' when bwFraction is known. loadMode 'carried': 'The load you carry — pack, bag, vest or implement. Calories scale with it: ~{X}% more per 20 kg at your weight.' where X = round((min(2, 1 + 20/bodyKg) − 1) × 100) — 25% at 80 kg.
- 3d-vi. TO-FAILURE CHECKBOX (lifting only) — a Pressable Row with Icon 'core.checkFilled' (warning) / 'core.checkEmpty' (textFaint) and one of two captions: unticked 'To failure? Tick if you could not have done one more.' (textMuted); ticked 'To failure — no rep left. Counts as RPE 10, and the reps become a real capacity test.' (warning). Deliberately NOT reset after a set is logged (comment: failure sets come in runs).
- 3d-vii. ACTION ROW — Button 'Add Set' (lifting) / 'Log' (everything else), icon 'core.add', size sm, flex 2. Lifting only: a secondary Button 'Repeat Last', flex 1.
- 3d-viii. REST EXPLANATION (lifting, only after at least one set has been logged on THIS card in THIS mount) — a Pressable line: Icon 'core.timer' 14 warning + caption 'Rest set to {formatRest(restSec)} · {SYSTEM_LABEL} · ~{pct}% 1RM · {CNS_LABEL} — why?' (the pct clause is omitted when pctOneRM is null; 'why?' toggles to 'hide'). Expanded, it lists every string in rx.reasons as '• {reason}' bullets in textFaint, then 'Evidence range for this kind of set: {lo}–{hi}. Override with a preset below.'
- 3d-ix. REST PRESET CHIPS (lifting) — a Row of exactly 5 equal-flex Pressables from REST_PRESETS = [60, 90, 120, 180, 300], rendered '1m', '1.5m', '2m', '3m', '5m' on surfaceAlt, radius sm, paddingVertical 6. Tapping calls startRest(sec) with NO prescription, so the banner loses its system/CNS subtitle and the PCr bar falls back to the textbook τ=45 s.
- 4. GPS CARD (flow === 'cardio' only) — Card, accent theme.colors.outdoor while tracing. Row: Icon 'cardio.gps' 20 (outdoor when on, textFaint when off); Text bodyStrong 'Measuring with GPS' / 'Measure distance with GPS'; caption '{x.xx} km traced — keeps recording with the screen off.' while on, or 'For hiking, cycling, a wander — measured instead of typed.' while off; Button 'Stop' (secondary) / 'Start' (primary), size sm, color outdoor. Below, a <RouteMap height={180}/> once gpsRoute.length > 1. Polls sessionGpsDistanceM() and sessionGpsRoute() every 2000 ms while on.
- 5. CARDIO 'Session details' CARD (flow === 'cardio') — Text h3 'Session details'; a Row of two Inputs, 'Distance' (suffix 'km', placeholder '0.0') and 'Elevation' (suffix 'm', placeholder '0'); when sessionType === 'sport' only, an extra Input 'Score / notes (optional)' placeholder 'e.g. 6-4, 6-3'; then a Row with Text bodyStrong 'On foot — count as steps' + caption 'Adds an estimated step count to your day. Off for cycling, swimming, rowing.' and a Switch (default ON, trackColor true = meta.color); closing caption textFaint 'Distance & elevation are optional — duration and estimated calories are always captured. For a live GPS route map, start a Run from the Train tab.'
- 6. MIND-BODY 'Session details' CARD (flow === 'mindbody') — Text h3 'Session details'; Input 'Technique / style (optional)' with placeholder 'e.g. box breathing' for meditation, 'e.g. vinyasa' otherwise (its value is saved as session.notes, NOT session.style); Text label textMuted 'How do you feel now? (after)'; a Row of the 5 MOOD_EMOJI ['😞','😕','😐','🙂','😄'] at fontSize 28 with MOOD_LABELS ['Rough','Meh','Okay','Good','Great'] underneath — unselected emoji at opacity 0.4, unselected labels textFaint.
- 7. FOOTER — a View with gap sm, marginTop sm: Button 'End Session' icon 'core.end' color meta.color, then Button 'Discard' variant ghost.

**Interactions**

- Move exercise up / down: chevron Pressables (hitSlop 8) → store.moveExercise(logId,'up'|'down') → moveExerciseLog(). Disabled and 25% opacity when i===0 / i===last, and ALWAYS disabled once the exercise has a completed set. The repo also renumbers every sibling densely to 0..n−1 after the swap so deletes can't leave a gap that swallows a move.
- Swap for an easier exercise: 'core.swap' toggles AlternativePicker; picking one calls store.swapExercise → replaceExerciseLog(logId, newId), which reads the old row's orderIndex, deletes the old log AND all its sets, and re-inserts the replacement at the same slot.
- Delete exercise: 'core.delete' → store.removeExercise(logId) → removeExerciseLog() deletes sets then the log. No confirmation dialog.
- Delete a logged set: the 'core.close' icon at the end of a set row → store.removeSet(setId) → deleteSet(). Only offered on non-PR sets; PR sets show a trophy in that slot instead and cannot be deleted from here.
- Add Set / Log: builds a draft {reps, weightKg, rpe, toFailure, durationS, distanceM}, computes the prescription FIRST (so setIndex counts sets before this one), calls store.logSet, then clears reps/weight/rpe/minutes/distance (toFailure deliberately persists), then startRest(rx.restSec, rx). Reps are forced to null when toFailure is ticked in a lifting session.
- Repeat Last: computes a prescription from the last COMPLETED set on this card, then store.repeatLastSet → lastSetForExercise(exerciseId) — which is the most recent set row for that exercise across the WHOLE history for this user (ordered by setEntries.id desc), not necessarily one from this session. Copies reps/weightKg/rpe/toFailure only (never duration or distance). If no completed set exists on this card, falls back to startRest(store.restDurationS) with no prescription.
- Tick / untick a warm-up muscle: Pressable → store.toggleWarmup(muscle) → toggleWarmupDone() writes a JSON string[] to sessions.warmups_done, so it survives leaving the screen and an app restart.
- Tap the rest explanation line: toggles the reasons list and the evidence range.
- Tap a rest preset chip: overrides the running rest with a flat 60/90/120/180/300 s, no prescription attached.
- Skip rest: Pressable in the banner → clearRest() sets restEndsAt to null only; restDurationS and restRx are left as they were.
- GPS Start/Stop: toggleGps(). Stopping writes the measured distance into the 'Distance' input as (m/1000).toFixed(2).
- On-foot Switch: controls whether finalizeSession folds an estimated step count into the day.
- Mood emoji tap: sets moodAfter 1..5 (mind-body only).
- End Session: builds the activity payload (cardio only) and calls store.finish(), then navigation.replace('SessionRecap', { sessionId, prCount, stepsAdded }).
- Discard: Alert 'Discard session?' / 'This will delete the in-progress session.' with buttons 'Keep' (cancel) and 'Discard' (destructive) → store.cancel() → deleteSession() → navigate('Main').

**What it shows, and from where**

- Elapsed clock — local setInterval over store.startedAt, formatted by formatDuration() in lib/format ('m:ss', or 'h:mm:ss' past an hour).
- Session label / icon / colour — metaFor(sessionType) in src/constants/sessionTypes.ts (9 types, 3 flows).
- Exercise list, names, icons, tracking types, equipment, pattern, slug, MET — getSessionDetail(sessionId) in sessionRepo (joins exercise_logs → exercises, ordered by orderIndex; sets ordered by setNumber).
- Total volume 'Volume {N} kg' — computed inline in ExerciseSection: Σ weightKg × reps over completed sets that have both. Not read from the DB.
- Rest seconds, energy system, %1RM, CNS load, reason bullets, evidence range — prescribeRest() in src/lib/restPrescription.ts.
- PCr refill percentage in the banner — pcrRecovered(elapsedRest, rx?.physiology?.tauS) = 1 − e^(−t/τ), τ = 45 s by default, stretched to 45/o2Factor when CO or a full stomach are known.
- Best 1RM and top weight ever for this exercise (used to place the set as a %1RM and to detect a step up) — exerciseProgression(exerciseId) in src/repositories/statsRepo.ts, reduced to max(best1RM) and max(topWeight).
- Live physiological state feeding the prescription — coLoad(recentSmokeEvents()) from lib/smokeClock + repositories/smokingRepo; stomachLoad(mealsFromEntries(foodEntriesForDay(todayISO()))).loadKcal from lib/digestion + repositories/nutritionRepo; sleepSummary().avgRest7d from repositories/sleepRepo. Recomputed every time lv.sets.length changes, wrapped in try/catch that silently returns {}.
- Experience level — levelOrDefault(useUserStore.user.experienceLevel); null reads as 'intermediate'.
- Bodyweight for effective-load and calorie maths — useUserStore.currentWeightKg, defaulting to 75 kg.
- Warm-up prescriptions — WARMUPS_BY_MUSCLE in src/data/exercises.ts (12 muscles); ticked state from warmupsDoneOf(session).
- Easier alternatives with their 1–5 difficulty dots — findEasierAlternatives(target, listExercises({})) in src/lib/exerciseAlternatives.ts.
- Live GPS distance and route — sessionGpsDistanceM() / sessionGpsRoute() in src/services/sessionGps.ts, which read getLiveRouteDistanceM() / getLiveRoute() from activityRepo.

**What it writes**

- startSession() → sessions (row created before this screen opens, by the picker that navigated here).
- addSet(exerciseLogId, draft) → set_entries. Sets setNumber = existing.length + 1, and writes rpe: 10 whenever toFailure is true so anything reading only rpe still sees the truth. completed defaults true.
- deleteSet(setId) → set_entries.
- addExerciseToSession(sessionId, exerciseId, orderIndex?) → exercise_logs (called from the library screen, or via replaceExerciseLog).
- removeExerciseLog(logId) → deletes from set_entries then exercise_logs.
- replaceExerciseLog(logId, newExerciseId) → exercise_logs (delete + insert at the same orderIndex).
- moveExerciseLog(logId, dir) → exercise_logs.order_index for every sibling in the session.
- toggleWarmupDone(sessionId, muscle) → sessions.warmups_done (JSON string[]).
- finalizeSession(sessionId, {...}) → updates sessions.end_time, duration_s, total_volume (lifting only, else null), distance_m, pace, elevation_m, score, calories_burned, mood_after, notes; flags set_entries.is_pr via detectAndFlagPRs; and, for on-foot activities, writes sessions.steps_added / distance_added_m and calls addSteps() → daily_step_logs (with 0 kcal, so the burn isn't double-counted).
- deleteSession(sessionId) on Discard → deletes set_entries, exercise_logs, the sessions row, and calls removeSteps() to unwind any step contribution.
- showOngoingNotification('training', …) / dismissOngoingNotification('training') — the sticky Android notification, channel 'active-session', AndroidImportance.LOW, sticky: true, autoDismiss: false, color '#4F8CFF'.

**Empty, loading and error states**

- No active session: EmptyState 'No active session' / 'Start one from the Train tab.' + 'Back' button. This is what you get if you navigate here with a sessionId but an empty store.
- No exercises yet: the flow-specific EmptyState described in the layout.
- Warm-up card: absent when no exercise's primaryMuscle has a warm-up entry; collapses to the one-line 'Warm-ups done — lift safe.' when all ticked.
- No alternatives: the honest empty message rather than a wrong suggestion.
- Rest banner: entirely absent when no rest is running; disappears the instant remaining hits 0.
- Rest explanation line: absent until the first set is logged on that card in that mount (lastRx is local component state and is lost if the card unmounts).
- GPS already in use: Alert 'A walk or run is already tracking' / 'Finish that session first — only one GPS trace can run at a time.'
- GPS permission denied or unavailable: Alert 'Could not start GPS' / 'Enable Location for FitCoach (ideally “Allow all the time”) to measure distance for this session.'
- GPS route not yet resolvable: RouteMap shows 'Waiting for GPS fixes to trace your route…' (only reachable once gpsRoute.length > 1 and normalizeRoute still returns null).
- Physiology reads failing: try/catch returns {} and the prescription is the unadjusted evidence-based one, with no note shown.
- There is NO loading state anywhere — every read is synchronous expo-sqlite.
- Notification permission denied: showOngoingNotification returns silently; the session runs identically without the sticky notification.

> Biggest structural fact for a redesign: the screen is one 950-line file with four local components (RestTimerBanner, ExerciseSection, ExerciseLogCard, AlternativePicker, WarmupChecklist) and no route-param usage. EXPLOSIVE_RE = /jump|throw|clean|snatch|power|explosive|sprint|plyo|box jump|broad/i is tested against the exercise's display NAME to add +30 s of neural rest — a name-regex sitting inside an otherwise mechanistic engine. The AlternativePicker uses the OLD name-regex difficulty (estimateDifficulty in exerciseAlternatives.ts) while the library screen uses the NEW authored grade (difficultyBySlug / exerciseDifficulty.ts) — the same exercise can therefore show a different number of dots in the two places. store.editSet exists in the store but no screen in this area calls it. The 'style' input on mind-body sessions is passed to finish() as `notes`, so sessions.style is never written from this screen. Deleting an exercise or a set has no undo and no confirmation, unlike deleting a session.

#### SessionRecapScreen

**Route** `SessionRecap { sessionId: number; prCount?: number; stepsAdded?: number }`  
**Reached from** navigation.replace('SessionRecap', …) from ActiveSessionScreen l.151 — the ONLY entry point. Registered with { headerShown: false }, so there is no header and no back affordance; the way out is the 'Done' button.

The check-out screen shown immediately after End Session. Celebrates, states the four-to-six headline numbers, shows the post-session margins, and offers to save the session as a reusable routine.

**Layout, top to bottom**

- Wrapper <Screen> (scrolling, padding lg, gap lg).
- 1. HERO — centred View, gap 6, paddingVertical md: a 72×72 rounded square (radius 24) filled meta.color + '22' containing Icon 'core.check' size 40 in meta.color; Text h1 'Nice work!'; Text body textMuted '{meta.label} session complete'; and, when prCount > 0, a Badge in warning colour reading '{n} new PR 🏆' / '{n} new PRs 🏆'.
- 2. STAT ROW 1 (always) — two StatTiles: 'Duration' (icon core.timer) = formatDurationLong(session.durationS) e.g. '45m' / '1h 20m'; 'Calories' (icon nutrition.calories, accent theme.colors.calories '#FF7A59') = round(session.caloriesBurned) with sub 'kcal (est.)'.
- 3. STAT ROW 2, LIFTING ONLY — 'Total volume' (icon stats.volume, accent primary) = round(session.totalVolume).toLocaleString() with sub 'kg'; 'Exercises' (icon strength.dumbbell) = logs.length.
- 4. STAT ROW 2, NON-LIFTING WITH A DISTANCE — 'Distance' (icon cardio.gps, accent outdoor) = formatDistance(distanceM, unit); 'Pace' (icon cardio.pace) = formatPace(session.pace, unit) e.g. '5:32 /km', or '—' when pace is null.
- 5. <PostSessionCard> — rendered when postSessionFor(sessionId) returns non-null. Card accent = warning for hard/brutal strain else accent. Header: Icon 'after.session' 22, Text bodyStrong 'After this session', caption '{Strain label, capitalised} — {up to 3 drivers} · ended {HH:MM}. The margins scale with how hard it was.' Then one row per Margin key — water, eat, smoke, alcohol, cold, next — each with its icon, its label, a right-aligned status string ('now', 'from 19:40 (in 1 h 20)', 'now — until 20:10', 'window closed 20:10 — still eat, just sooner next time', 'open since 18:20'), its own ProgressBar (height 5, hidden for the 'next' key), and a one-line advice caption that expands on tap into a 'why' + advice pair. Footer caption: 'Tap a line for the why. Estimates from the standard evidence — the harder the session, the more each of these costs, and for longer.' Re-renders every 60 s.
- 6. MOOD CHECK-IN CARD — mind-body flow only, and only when moodBefore or moodAfter exists. Text h3 'Mood check-in', then a Row space-around: the before emoji at fontSize 34 with caption 'Before', an Icon 'core.forward', the after emoji with caption 'After'. Missing values render as '—'.
- 7. EXERCISES CARD — lifting only, logs.length > 0. Text h3 'Exercises', then one Row per exercise: Icon lv.iconKey 18 primary, name (numberOfLines 1), a trophy 'core.pr' 16 in warning when ANY set on it is a PR, and a right-aligned caption '{n} set' / '{n} sets' plus ' · top {kg} kg' when a top weight exists. NOTE: the set count uses only completed sets, but 'top' takes Math.max over ALL sets including uncompleted ones.
- 8. STEPS CARD — only when route.params.stepsAdded is truthy. Card accent primary, Icon 'cardio.walk' 18, Text '+{n} steps added to today's count'.
- 9. <EnergyBalanceCard /> (no date prop, so it reports TODAY) — Card whose accent is danger when over_trained, warning when over_eaten, else calories. Header Text h3 "Today's energy balance". A three-column Row: 'burned (training)', 'eaten', and 'left to eat' (or '+N' with the label 'over target' when negative). Divider, then a 'Training load' meter reading '{exerciseBurned} / {lineKcal} kcal to the line'. Renders nothing at all when no nutrition goal exists.
- 10. SAVE AS ROUTINE CARD — rendered whenever logs.length > 0, for any session type. Card accent primary: Icon 'core.custom' 18 + Text h3 'Save as routine'; caption 'Reuse this exact workout later from the Train tab. Saving with an existing name updates that routine.'; a Row with an Input (placeholder 'e.g. My Push Day', pre-filled with session.label) at flex 2 and a size-sm 'Save' Button at flex 1, disabled while the name is blank. After saving it is replaced by Icon 'core.check' success + Text success 'Saved routine “{name}”' or 'Updated routine “{name}”'.
- 11. Button 'Done', icon 'core.check' → navigation.navigate('Main').

**Interactions**

- Tap any margin row in PostSessionCard → expands to show its 'why' and 'advice' text.
- Type a routine name + tap 'Save' → findRoutineByName() decides the confirmation wording, then saveRoutine(name, sessionExerciseIds(sessionId)).
- 'Done' → navigate('Main'). There is no other exit; headerShown is false.

**What it shows, and from where**

- session row (duration, calories, volume, distance, pace, moods, label) — getSessionDetail(route.params.sessionId) in sessionRepo, read once in a useMemo.
- prCount and stepsAdded — passed through the route params from FinalizeResult; NOT re-derived here.
- Strain level, drivers and the six margins — postSessionFor(sessionId) in src/repositories/postSessionRepo.ts, which calls sessionStrain() and postSessionMargins() in src/lib/postSession.ts (StrainLevel: light | moderate | hard | brutal; MarginKey: water | eat | smoke | alcohol | cold | next). The smoke line depends on isSmokingEnabled(); the alcohol line is always offered.
- Energy balance figures — energyBalanceFor() in src/repositories/energyRepo.ts + trainingLoadFraction() in src/lib/energyBalance.ts.
- Unit preference (metric/imperial) for distance and pace — useUserStore.user.unitPreference, defaulting to 'metric'.

**What it writes**

- saveRoutine(name, exerciseIds) → the routines table via src/repositories/routinesRepo.ts. Nothing else on this screen writes.

**Empty, loading and error states**

- prCount === 0: the PR badge is simply absent.
- postSessionFor returns null when the session has neither endTime nor durationS → the whole PostSessionCard is skipped.
- No nutrition goal: EnergyBalanceCard renders null.
- logs.length === 0: both the Exercises card and the Save-as-routine card disappear, so a cardio session recap is hero + two stat rows + margins + energy balance + Done.
- No loading or error state — a missing session id would throw from getSessionDetail (`Session {id} not found`) and crash the render.

> session.caloriesBurned here is the value finalizeSession stored using the bodyweight at check-out; SessionDetailScreen later re-derives a per-exercise split with the CURRENT bodyweight, so the two screens can disagree for the same session. 'top {kg}' includes non-completed sets. The screen is unreachable except straight after finishing a session — there is no way back to a recap from history.

#### SessionHistoryScreen

**Route** `SessionHistory (no params)`  
**Reached from** TrainScreen's 'Recent' SectionHeader action (l.274) and ProfileScreen's 'Session history' LinkRow (l.245). Header title 'History'.

The flat chronological list of everything logged: training sessions on one tab, GPS walks and runs on the other. Purely a router into the two detail screens.

**Layout, top to bottom**

- SafeAreaView(edges: ['bottom']) — NOT the shared <Screen>, so the two lists own their own scrolling.
- 1. A padded (spacing.lg) View holding a two-option SegmentedControl: { value 'sessions', label 'Sessions', icon 'nav.train' } and { value 'walks', label 'Walks & Runs', icon 'cardio.walk' }. Default 'sessions'.
- 2a. SESSIONS FlatList — one Card per session, accent = metaFor(type).color. Row: Icon sessionTypeIcon(sessionType) size 22 in that colour; Text bodyStrong = session.label ?? meta.label; caption '{friendlyDate} · {formatDurationLong(durationS)}' with ' · {N} kg' appended only when totalVolume is set. Right edge: Icon 'core.forward' 18 textFaint. contentContainerStyle gap sm, paddingBottom 40.
- 2b. WALKS FlatList — one Card per walk, accent = outdoor for a run, accent colour for a walk. Row: Icon 'cardio.running' / 'cardio.walk' 22; Text bodyStrong '{Run|Walk} · {steps} steps' with a small 'cardio.gps' icon (13, outdoor) beside it when routeJson.length > 4; caption '{friendlyDate} · {formatDurationLong(durationS)} · {formatDistance(distanceM,'metric')} · {round(caloriesBurned)} kcal'. Right edge: chevron.
- friendlyDate(ts) resolves to the literals 'Today', 'Yesterday', or toLocaleDateString with { weekday:'short', month:'short', day:'numeric' }.

**Interactions**

- SegmentedControl switches between the two lists.
- Tap a session card → navigate('SessionDetail', { sessionId }).
- Tap a walk card → navigate('WalkDetail', { walkId }).
- No swipe, no long-press, no delete, no filtering, no search, no pull-to-refresh. Both lists reload on focus via useFocusEffect.

**What it shows, and from where**

- Sessions — listSessions({ limit: 200 }) in sessionRepo (userId-scoped, ordered by startTime desc).
- Walks — listWalkSessions(200) in src/repositories/activityRepo.ts.
- Walks distance is ALWAYS formatted metric here (the literal 'metric' is hard-coded), unlike SessionDetail/Recap which honour the user's unit preference.

**What it writes**

- None.

**Empty, loading and error states**

- Sessions empty: EmptyState icon 'core.calendar', title 'No sessions yet', no message.
- Walks empty: EmptyState icon 'cardio.walk', title 'No walks yet', no message.
- No loading or error state.

> Capped at 200 rows each with no pagination — the 201st session is silently invisible. Walks and sessions are two completely separate tables and detail screens; a GPS session started from ActiveSessionScreen's GPS card writes into the live-walk row for tracing but is saved as a SESSION, so it appears on the Sessions tab, not Walks & Runs.

#### SessionDetailScreen

**Route** `SessionDetail { sessionId: number }`  
**Reached from** SessionHistoryScreen (l.59) and TrainScreen's 'Recent' cards (l.288). Header title 'Session'.

A finished session, read and edited. Shows the headline stats, the mood pair, notes, the day's energy balance, and the exercise list with a per-exercise calorie attribution that is recomputed on every read.

**Layout, top to bottom**

- Wrapper <Screen>.
- 1. HEADER Row — a 48×48 rounded square (radius 16) in meta.color + '22' with Icon meta.icon 26; Text h2 = session.label ?? meta.label; caption = new Date(startTime).toLocaleString with { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }.
- 2. STAT ROW 1 — 'Duration' (formatDurationLong) and 'Calories' (round(caloriesBurned), sub 'kcal', accent calories).
- 3. STAT ROW 2 — lifting: 'Volume' (round(totalVolume).toLocaleString, sub 'kg', accent primary) and 'Exercises' (logs.length). Non-lifting with a distance: 'Distance' (accent outdoor) and 'Pace'. Otherwise nothing.
- 4. MOOD CARD — shown for ANY session type (unlike the recap, which restricts it to mind-body) when moodBefore or moodAfter is set. Row space-around: before emoji fontSize 30 + caption 'Before', Icon 'core.forward', after emoji + caption 'After'.
- 5. NOTES CARD — only when session.notes is set. Text label textMuted 'Notes' + the note body.
- 6. <EnergyBalanceCard date={toISODate(startTime)} /> — the balance for the DAY THIS SESSION HAPPENED, not today.
- 7. SectionHeader 'Exercises' with a right-hand action that toggles between 'Edit' and 'Done'.
- 8. EXERCISE LIST — a single Card, gap 12, with a Divider between exercises. Per exercise: Icon lv.iconKey 18 primary + Text bodyStrong name; a right-aligned tabular-nums caption '{n} kcal' in theme.colors.calories when that exercise's attributed burn is > 0; and, while editing, a 'core.delete' 16 Pressable. Beneath, one Row per set: '#{setNumber}' in a 30px textFaint column, then describeSet(s) — NOTE this screen's describeSet is the simple one: '{kg} kg · {reps} reps · {duration} · {km} · to failure|RPE {n}', with no +/assisted/load prefixes and no fallback string ('—' when empty). Right: trophy 'core.pr' 15 warning for a PR, else (editing only) a 'core.close' delete.
- 9. AddSetRow — editing only, per exercise, indented 26px: Inputs labelled 'kg', 'reps', 'min', 'km' shown according to fieldsFor(trackingType), plus a size-sm 'Add' Button. There is NO rpe field and NO to-failure checkbox here, so sets added retroactively can never carry effort data.
- 10. 'Add exercise' secondary Button (editing only) → navigate('ExerciseLibrary', { pick: true, sessionId }).
- 11. ATTRIBUTION FOOTNOTE — shown when burn.basis === 'per-exercise', logs.length > 0 and not editing: 'Calories are attributed to each movement from its own effort (MET) and time at your bodyweight' then either ' — plus {N} kcal over {M} min of rest between sets, priced at recovery rate, not at the exercise's.' when restCalories > 0, or ' — so heavier, harder work shows its real share.' otherwise.
- 12. Button 'Delete Session', variant ghost, icon 'core.delete', color theme.colors.danger.

**Interactions**

- 'Edit' / 'Done' toggles the editing mode, which reveals per-set delete crosses, per-exercise delete icons, the AddSetRow forms and the 'Add exercise' button, and hides the attribution footnote.
- Delete a set → deleteSet(id) + reload. No confirmation.
- Delete an exercise → removeExerciseLog(id) + reload. No confirmation.
- Add a set → addSet(logId, draft) + reload.
- Add an exercise → the library in pick mode with an explicit sessionId, which routes the pick to addExerciseToSession(targetSessionId, ex.id) rather than the live-session store.
- Delete Session → Alert 'Delete session?' / 'This permanently removes it from your history and stats.' with 'Cancel' and destructive 'Delete' → deleteSession() then goBack().
- Reloads via useFocusEffect on every focus, so returning from the library picks up the new exercise.

**What it shows, and from where**

- session + logs + sets — getSessionDetail(sessionId).
- Per-exercise kcal, rest kcal, rest seconds, work seconds, rest MET and the basis flag — sessionCalorieBreakdown(detail, bodyKg) in sessionRepo, which calls distributeSessionCalories() in src/lib/exerciseCalories.ts. Recomputed on every render, never stored.
- The headline 'Calories' StatTile is the STORED session.caloriesBurned, so it can differ from the sum of the per-exercise numbers whenever the user's weight has changed since check-out.
- Energy balance for the session's date — energyBalanceFor(dateISO).
- bodyKg — useUserStore.currentWeightKg ?? 75.

**What it writes**

- addSet(logId, draft) → set_entries (no rpe, no toFailure — the retro form cannot supply them).
- deleteSet(setId) → set_entries.
- removeExerciseLog(logId) → set_entries + exercise_logs.
- deleteSession(sessionId) → set_entries, exercise_logs, sessions, and removeSteps() against daily_step_logs using the recorded steps_added / distance_added_m.

**Empty, loading and error states**

- No exercises and not editing: a dashed-border Card with centred textFaint 'No exercises logged. Tap “Edit” to add some.'
- No nutrition goal: EnergyBalanceCard renders null.
- No notes / no moods: those cards are absent.
- burn.basis === 'session-met' (nothing timed to attribute to): the footnote is hidden and no per-exercise kcal appear.
- No loading or error state; a bad sessionId throws from getSessionDetail.

> This is the only place a finished session can be corrected, and the retro AddSetRow deliberately omits RPE and to-failure — every effort-derived figure downstream (effectiveSets, effortScore, 1RM correction) treats those sets as 'unknown effort', which the effort engine gives FULL hard-set credit to. PRs are not re-detected when sets are added here, so a retro-added heavy set will never be flagged isPr.

#### ExerciseLibraryScreen

**Route** `ExerciseLibrary { pick?: boolean; sessionId?: number; draft?: boolean; sessionType?: SessionType } | undefined`  
**Reached from** ActiveSessionScreen 'Add Exercise' (pick: true, no sessionId → live session); SessionDetailScreen 'Add exercise' (pick: true + sessionId → that session); LogSessionScreen (draft: true + sessionType → the draft store); ProfileScreen 'Exercise library' LinkRow (pick: false → browse). Header title 'Exercise Library'.

One screen doing two jobs: the browser (pick=false → opens ExerciseStats) and the picker (pick=true → adds to a draft list, a specific session, or the live session). Also the create/edit form for custom exercises.

**Layout, top to bottom**

- SafeAreaView(edges ['bottom']) — not <Screen>.
- 1. FILTER BLOCK (padding lg, gap sm), top to bottom: (a) a full-width Input, placeholder 'Search exercises & activities'; (b) a scrollable SegmentedControl of TYPE_FILTERS = 'All' plus all 9 SESSION_TYPE_META labels — Strength, Calisthenics, Cardio, Outdoor, Sport, Martial Arts, Mind-Body, Meditation, Custom; (c) a scrollable SegmentedControl of MUSCLE_FILTERS = 'All muscles' plus the 12 MUSCLE_GROUPS — Chest, Back, Shoulders, Biceps, Triceps, Quads, Hamstrings, Glutes, Calves, Core / Abs, Forearms, Neck (accent theme.colors.accent); (d) CONDITIONALLY, when a specific muscle is selected and sub-muscles exist for it, a scrollable SegmentedControl 'All parts' plus the sub-muscles present, labelled from SUB_MUSCLE_LABELS e.g. 'Lats (width)', 'Mid-Back / Rhomboids', 'Front Delt', 'Triceps (long head)', 'Vastus (outer/inner quad)' (accent primary); (e) a scrollable SegmentedControl of EQUIP_FILTERS = 'All gear', Barbell, Dumbbell, Machine, Cable, Bodyweight (accent theme.colors.warning) — note 'Other' is NOT offered as a filter even though it is a valid equipmentType. So: 4 filter rows normally, 5 when a muscle is chosen.
- 2. FlatList — ListHeaderComponent is a caption textFaint '{n} exercise' / '{n} exercises'. contentContainerStyle gap sm, paddingBottom 120 (clearance for the floating button). keyboardShouldPersistTaps='handled'.
- 3. EXERCISE ROW — a Card per exercise. Left: <ExerciseHero iconKey sessionType /> — a 52×52 radius-12 SVG tile with a session-type-tinted linear gradient (0.9 → 0.35 opacity), two faint white circles, and the exercise's glyph at 26px. Then a four-line text column: (i) Text bodyStrong name, numberOfLines 1; (ii) caption textMuted = '{Muscle} · {Sub-muscle}' when the sub-muscle was inferred rather than recorded, or just the sub-muscle label when it is recorded, joined with ' · {Equipment label}' — falling back to item.category when neither exists; (iii) caption in theme.colors.calories reading '≈ {N} kcal / 10 min · {M} kcal/min' where N = caloriesForReference(met, bodyKg, 10) and M = round(N/10); (iv) caption textFaint = a five-character difficulty bar '●●●○○' followed by the DIFFICULTY_LABELS word — 'Anyone', 'Beginner', 'Standard', 'Hard', 'Elite' — plus ' · {levelNote}' when the exercise sits outside the user's band.
- 4. ROW ACTIONS at the right edge: in pick mode only, an 'core.info' 20 Pressable that opens ExerciseStats without picking; for custom exercises only, a 'core.edit' 18 Pressable in accent; and always a trailing Icon — 'core.add' in pick mode, 'core.forward' when browsing, both size 20 in primary.
- 5. FLOATING BOTTOM AREA (position absolute, bottom 24, left/right 16): either a Button 'Create Custom Exercise' (icon 'core.custom') or, once opened, the ExerciseFormCard.
- 6. EXERCISE FORM CARD (maxHeight 460, gap sm) — Text h3 'New custom exercise' or 'Edit “{name}”'; Input 'Name' placeholder 'e.g. Sled Push'; a scrollable SegmentedControl of all 9 session types; then, ONLY when the type is strength or calisthenics: caption 'Muscle group' + a wrapping Row of 12 small Chips; when the chosen muscle is back, shoulders or core, a caption 'Individual muscle' + small accent Chips (back → Lats/Traps/Mid-Back/Lower Back; shoulders → Front/Side/Rear Delt; core → Upper Abs/Lower Abs/Obliques); then caption 'Equipment' + 6 small warning-coloured Chips (Barbell, Dumbbell, Machine, Cable, Bodyweight, Other). Footer Row: 'Cancel' (secondary, flex 1) and 'Create' / 'Save changes' (flex 2, disabled while the name is blank).

**Interactions**

- Search: free text, debounce-free, matched with SQL LIKE '%q%' against name OR category OR primaryMuscle.
- Type / muscle / sub-muscle / equipment filters: each SegmentedControl is single-select. Changing the muscle resets the sub-muscle to 'all'.
- Tap a row: in pick mode adds and goes back; otherwise navigates to ExerciseStats { exerciseId, name }.
- 'core.info' (pick mode only): opens ExerciseStats without picking, so you can read the how-to before committing.
- 'core.edit' (custom exercises only): opens the form pre-filled.
- Chips in the form toggle — tapping the active one clears it; picking a muscle clears the sub-muscle.
- Creating while in pick mode immediately picks the new exercise; creating while browsing switches the type filter to the new exercise's type and clears the search so it is visibly there.

**What it shows, and from where**

- The exercise rows — listExercises({ sessionType, muscle, equipmentType, search }) in exerciseRepo, ordered by exercises.name, then .filter(e => !ALIAS_SLUGS.has(e.slug)) to hide the 6 duplicate-slug aliases, then re-sorted by levelFit.
- Sub-muscle options — subMusclesFor(muscleItems) in src/lib/subMuscle.ts (recorded subMuscle if present, else inferred from the name + primary muscle).
- kcal reference — caloriesForReference(met, bodyKg, 10) in exerciseCalories, which uses GROSS caloriesFromMet (not the net figure used for attribution). met falls back to SESSION_TYPE_MET[sessionType] ?? 4 when the exercise has none.
- Difficulty and its label — difficultyBySlug(slug) from src/data/exercises.ts (resolved once at module load by difficultyOf()), defaulting to 3 when the slug is unknown — which is every custom exercise, since their slugs are `custom-{timestamp}`.
- levelNote(d, level) — 'Harder than a beginner should start with — build to it.' / 'A step beyond your level; treat it as a goal rather than a staple.' / 'Easier than your level needs — useful as a warm-up.'
- Ordering — sorted by levelFit(d, level) descending, stable-tiebroken by the catalogue's own alphabetical order, so a beginner's list leads with difficulty-2 movements and buries the muscle-up without hiding it.

**What it writes**

- createCustomExercise(...) → exercises (slug `custom-{Date.now()}`, isCustom true, trackingType 'reps_weight' for lifting types else 'duration', iconKey from the session-type meta).
- updateCustomExercise(id, patch) → exercises, guarded by isCustom = true so built-ins can never be edited.
- addExerciseToSession(targetSessionId, ex.id) → exercise_logs, when a sessionId param was supplied.
- useSessionStore.addExercise(ex.id) → exercise_logs, for the live session.
- useExerciseDraftStore.add(ex.id) → in-memory only, for the log-a-past-session draft.

**Empty, loading and error states**

- No matches: EmptyState icon 'nutrition.search', title 'No matches', message 'Try a different filter, or create a custom exercise.'
- muscle === 'all': the sub-muscle filter row does not render at all.
- No loading state; the whole library is a synchronous SQLite read on every filter change.

> DEAD STATE: `const [forMyLevel, setForMyLevel] = useState(false)` at line 82 gates a `suitsLevel` filter at line 121, but setForMyLevel is never called anywhere — there is NO toggle in the UI. The 'only show what fits my level' feature is written and unreachable; the list is always the full, merely re-ordered one. Also note the muscle filter matches primaryMuscle only, not the muscleGroups array, so a bench press never appears under 'Triceps'. The 'Other' equipment type can be assigned in the create form but cannot be filtered for. Custom exercises always grade as 'Standard' (3) because difficultyBySlug can't resolve their generated slugs.

#### ExerciseStatsScreen

**Route** `ExerciseStats { exerciseId: number; name: string }`  
**Reached from** ExerciseLibraryScreen — tapping a row while browsing (l.136), or the 'core.info' icon while picking (l.143). Header title is empty ('').

The single-exercise page: a beginner how-to guide plus the progression charts. Doubles as the library's detail view.

**Layout, top to bottom**

- Wrapper <Screen>.
- 1. <PageHero icon='stats.progression' color=primary title={route.params.name} />.
- 2. EXERCISE GUIDE (when getExercise(id) resolves): (a) <ExerciseIllustration pattern sessionType size={170} />; (b) a wrapping Row of Chips — the primary muscle (icon 'stats.muscleMap', primary), the recorded subMuscle (calisthenics colour), the equipment type (the exercise's own iconKey, accent), and the first 3 raw muscleGroups strings in textMuted; (c) the exercise description as body textMuted when present; (d) a warm-up Card accent warning when the primary muscle has a WARMUPS_BY_MUSCLE entry — Icon 'core.timer' 16 + Text bodyStrong 'Warm-up first (mandatory)' + the prescription caption; (e) a 'How to do it' Card accent accent — Icon 'core.info' 18 + Text h3, then numbered steps in 20px accent-tinted circles with a Divider between each. Steps come from the exercise's bespoke `instructions` if it has any, otherwise the generic PATTERN_CUES for its movement pattern (16 patterns, 3 cues each).
- 3. STAT ROW 1 — 'Best est. 1RM' (icon core.pr, accent warning, sub 'kg') and 'Top weight' (icon strength.barbell, accent primary, sub 'kg').
- 4. STAT ROW 2 — 'Total volume' (icon stats.volume, accent accent, value = round(total/1000)+'k', sub 'kg all-time') and 'Sessions' (icon core.calendar, value = number of distinct days with logged sets).
- 5. SectionHeader 'Progression'.
- 6. A two-option SegmentedControl: 'Est. 1RM' / 'Volume'.
- 7. A Card containing a <LineChart> of one point per day, coloured warning for 1RM and primary for volume, with yFormat abbreviating ≥1000 to '{n}k'.
- 8. Only in the 'Est. 1RM' view: Text label textMuted '1RM formula' and a second SegmentedControl 'Epley' / 'Brzycki'.

**Interactions**

- Metric SegmentedControl — swaps the charted series between best1RM and volume.
- Formula SegmentedControl — re-runs exerciseProgression with 'epley' (default, 1RM = w × (1 + reps/30)) or 'brzycki' (1RM = w × 36 / (37 − reps), invalid at reps ≥ 37).

**What it shows, and from where**

- Progression points — exerciseProgression(exerciseId, formula) in src/repositories/statsRepo.ts: joins set_entries → exercise_logs → sessions for this user, keeps only completed sets with BOTH weight and reps, buckets by ISO date, and per day records max(estimate1RMFromSet), max(weightKg) and Σ weight×reps.
- The 1RM figures are effort-corrected — estimate1RMFromSet() adds the reps-in-reserve back on before applying the formula, so a set at RPE 7 is treated as if it had gone 3 reps further.
- Exercise metadata and instructions — getExercise(id) in exerciseRepo, whose hydrate() falls back to PATTERN_CUES[pattern] when the exercise has no bespoke instructions.

**What it writes**

- None. This screen is read-only.

**Empty, loading and error states**

- progression.length === 0: the whole stats/chart half is replaced by an EmptyState icon 'stats.progression', title 'No history yet', message 'Log this exercise in a session to see progression charts.' — but the PageHero and the full ExerciseGuide still render above it, which is the intended behaviour when reached from the library.
- getExercise returns undefined: the guide block is skipped silently.
- No loading or error state.

> Everything here is weight×reps based, so duration- and distance-tracked exercises (planks, carries, cardio drills) will always show 'No history yet' no matter how often they are logged — exerciseProgression skips any set missing weightKg or reps. The 'Sessions' tile counts distinct DAYS, not sessions: two sessions on one day count once.

#### ExercisePeek (component, src/components/ExercisePeek.tsx — not a routed screen)

**Route** `not routed — a component rendered inline by TrainScreen (recent sessions, l.317; routines, l.242) and MethodPickerScreen (routines, l.161)`  
**Reached from** Tapping the 'core.list' icon on a recent-session card in TrainScreen (which first calls sessionExercisePeek(s.id)), or the equivalent expand control on a saved routine in TrainScreen / MethodPickerScreen. The chevron flips to 'core.chevronUp' while open.

Read a routine's, template's or finished session's exercise list in place, without navigating and without starting anything. Explicitly built so that inspecting a routine no longer requires starting a session you then have to discard.

**Layout, top to bottom**

- A Divider, then one Row per exercise (gap 8, alignItems flex-start).
- Per row: a tabular-nums textFaint index '1.' in an 18px column; Icon (ex.iconKey ?? 'core.custom') size 16 in the accent colour (defaults to primary); then a column with Text body numberOfLines 1 = the exercise name, and beneath it a caption textFaint numberOfLines 1 that shows ex.detail when present, otherwise '{muscle} · {equipmentType}'.
- The muscle label prefers SUB_MUSCLE_LABELS[subMuscle], falling back to MUSCLE_LABELS[primaryMuscle], falling back to the raw key.

**Interactions**

- None — the rows are not pressable. It is a read-only disclosure.

**What it shows, and from where**

- For a finished session: sessionExercisePeek(sessionId) in sessionRepo, which builds the `detail` string from completed sets as '{n} sets · {volume} kg · {minutes} min', including only the parts that are non-zero (volume = Σ weight×reps, minutes = round(Σ durationS / 60)).
- For a routine or template: the caller's own exercise list, in which case `detail` is null and the muscle/equipment line shows instead.

**What it writes**

- None.

**Empty, loading and error states**

- Empty list: a single caption textFaint showing the `emptyLabel` prop — default 'No exercises in this one yet.', overridden by TrainScreen to 'No exercises were logged in this session.'

> The equipmentType is printed raw ('barbell', 'bodyweight') rather than through EQUIPMENT_LABELS, so it appears lower-case here and Title Case everywhere else.

### Engines behind this area

- **`src/stores/sessionStore.ts`** — The zustand store that IS the live session. Holds activeId, sessionType, startedAt, the full SessionDetail, and the rest-timer triple (restEndsAt, restDurationS, restRx). Every mutation writes to SQLite first and then calls refresh(), which re-reads getSessionDetail(activeId) wholesale — there is no optimistic local state. begin() creates the session, optionally pre-populates it from prefillSlugs (resolved in order by exercisesBySlugs) or prefillExerciseIds, and pins the sticky notification. resume() is called by TrainScreen on focus and re-adopts the most recent unfinished session after an app restart, re-pinning its notification. finish() reads the user's current weight, calls finalizeSession, clears all session state and dismisses the notification. cancel() deletes the session outright.  
  *Constants:* restDurationS defaults to 90 s. clearRest() nulls restEndsAt ONLY — restDurationS and restRx persist. finish() passes weightKg = useUserStore.currentWeightKg ?? undefined (which becomes 75 kg inside finalizeSession). Notification body is always 'Session timer is running. Return to FitCoach to log sets and finish.'
- **`src/repositories/sessionRepo.ts`** — All session persistence. startSession / addExerciseToSession / addSet / updateSet / deleteSet / removeExerciseLog / replaceExerciseLog / moveExerciseLog / lastSetForExercise / toggleWarmupDone / getSessionDetail / listSessions / activeSession / deleteSession / logPastSession / sessionExercisePeek / sessionCalorieBreakdown, plus finalizeSession and the PR detector. finalizeSession computes durationS from the wall clock, totalVolume (lifting types only, else null), calories via distributeSessionCalories (unless the caller supplied a figure, e.g. a GPS run), flags PRs, and folds an estimated step count into daily_step_logs for on-foot activities. detectAndFlagPRs walks each exercise's sets in order against the best prior estimated 1RM and marks every set that beats the running maximum.  
  *Constants:* isLifting = sessionType is 'strength' or 'calisthenics' — nothing else ever gets a totalVolume. PR threshold is a strict e > running + 0.01 kg. bestPrior1RM has a BUG: it is called with excludeSessionId but never filters on it, so this session's own earlier sets are already in the 'prior' pool. Fallback bodyweight 75 kg, fallback height 170 cm. addSet forces rpe: 10 whenever toFailure is true. contributeSteps records steps_added / distance_added_m so deleteSession can subtract exactly what it added, and always adds steps with 0 kcal to avoid double-counting the burn. listSessions' `until` filter adds 86,400,000 ms.
- **`src/lib/restPrescription.ts`** — The rest engine. Classifies the set into an energy system from its time under load and its share of 1RM, gives it the base rest that system wants, adds for neural demand, accumulated fatigue and progress attempts, scales by experience level, then hands the parts to restPhysiology and reassembles them. Returns the seconds, the system, the %1RM, the RIR, the CNS load, every component separately, the evidence range, and a human-readable reason for each addition.  
  *Constants:* Tempo for estimating time under load: 3 s/rep when reps ≤ 5, 2.5 s/rep otherwise, 2 s/rep for bodyweight. Classification: phosphagen when work ≤ 20 s AND (pct ≥ 0.85 or reps ≤ 5); glycolytic when work ≤ 90 s; oxidative beyond. Base: phosphagen 210 s compound / 150 s isolation, range 180–300; glycolytic endurance (reps ≥ 15) 90 compound / 60 isolation, range 45–120; glycolytic normal 120 compound / 75 isolation, range 90–180 compound and 60–120 isolation, +30 s when RIR ≤ 1; oxidative 60 s if a duration was logged else 45 s, range 30–90. Neural: +60 s and CNS high at ≥90% 1RM, +30 s and CNS high at ≥85%, CNS moderate at ≥75%; to failure +45 s compound / +30 s isolation; explosive +30 s. Fatigue: min(40, setIndex × 10), plus 30 s past 75 min into the session or 15 s past 45 min. Progress attempt: +30 s. LEVEL_REST_FACTOR beginner 0.85 / intermediate 1 / advanced 1.1. Clamped to MIN_REST_S = 30 and MAX_REST_S = 300, then rounded to the nearest 15 s. PCR_TAU_S = 45 s (half-time ≈ 31 s). pctOneRM is clamped 0.2–1.1 from a known 1RM, or 0.3–1.0 when inferred as 1/(1+(reps+RIR)/30). COMPOUND_PATTERNS = horizontal_push, vertical_push, horizontal_pull, vertical_pull, squat, hinge, lunge, carry (8 patterns). Final assembly: metabolic = (base + fatigue + progress) / o2Factor; neural × neuralFactor; sum × levelFactor.
- **`src/lib/restPhysiology.ts`** — The new oxygen/sleep layer. Converts the state the lifter arrived in into exactly two numbers — an oxygen-delivery fraction that DIVIDES the metabolic part of the rest, and a neural factor that MULTIPLIES the neural part — plus the stretched PCr time constant the progress bar uses. Carbon monoxide and a full stomach act on oxygen (because PCr resynthesis is entirely aerobic, so time-to-a-given-fraction stretches by exactly 1/delivery); sleep acts only on the neural portion, deliberately, because there is no evidence it slows PCr kinetics. Produces a plain-English note for each factor that is appended to the prescription's reasons list.  
  *Constants:* BASELINE_COHB_PCT = 0.7% (only CO above this is penalised). COHB_PER_CIG_EQ = 3.5 percentage points per cigarette-equivalent still on board. MAX_COHB_PCT = 12%. O2_LOSS_PER_COHB_PCT = 0.012 (1.2% of delivery lost per COHb point). MAX_O2_LOSS = 0.2 (never more than 20% impairment claimed). SPLANCHNIC_FULL_KCAL = 700 kcal is a 'full' stomach; MAX_SPLANCHNIC_LOSS = 0.05. SLEEP_NEUTRAL_H = 7 (no allowance at or above); SLEEP_EXCELLENT_H = 8.5 (earns MIN_NEURAL_FACTOR = 0.94); NEURAL_PER_HOUR_SHORT = 0.06 per hour below 7; MAX_NEURAL_FACTOR = 1.3. tauS = round(45 / o2Factor × 10)/10. `neutral` is true only when o2Factor and neuralFactor are both exactly 1, in which case the prescription omits `physiology` and `restBeforeStateSec` entirely and the PCr bar uses the textbook 45 s.
- **`src/lib/exerciseCalories.ts`** — Per-exercise calorie attribution INCLUDING rest. Estimates each exercise's active seconds, scales them by a per-set energy factor (load × intensity), values the work at each exercise's own MET, and then prices the leftover wall-clock time as rest on a decaying post-set recovery curve rather than at the exercise's MET. Attribution uses NET calories (MET − 1) because TDEE already covers resting metabolism.  
  *Constants:* SECONDS_PER_REP = 3. A completed set with neither duration nor reps still counts as 60 s. Rest MET curve: MET(R) = 2 + 2 × (90/R) × (1 − e^(−R/90)), i.e. REST_MET_FLOOR = 2, REST_MET_PEAK = 4, REST_EPOC_TAU_S = 90 s — so 60 s rests average ≈3.4 METs, 3-minute rests ≈2.9, 5-minute rests ≈2.6. The number of rest periods is max(1, completed set count). When logged work exceeds the wall clock the work is scaled down by durationS/totalActive rather than inventing time. When there is no set-level timing at all the duration is split evenly across the listed exercises at their own METs and restCalories is 0. caloriesForReference (the library's '≈ N kcal / 10 min') uses GROSS caloriesFromMet, not net — a deliberate inconsistency documented in the file header.
- **`src/lib/loadProfile.ts`** — What 'load' means for each exercise. Four modes — external (the weight is the load), added (belt/vest kilograms on a bodyweight movement; negative means band/machine assistance), carried (a pack or implement that rides on you), and none. Supplies the bodyweight fraction each movement actually lifts, so weighted calisthenics can be reasoned about in real kilograms; drives the weight field's label and help text on ActiveSessionScreen, the effective load fed to prescribeRest, and the calorie multiplier.  
  *Constants:* ~90 per-slug profiles. bwFraction examples from force-plate data: push-up 0.64, knee/incline push-up 0.5, decline 0.74, pull-up / chin-up / dip 0.96, muscle-up 1.0, inverted row 0.5, bodyweight squat / pistol / wall-sit 0.85, glute bridge 0.5, calf raise 0.95, plank 0.6, crunch 0.3, hanging leg raise 0.35, neck bodyweight 0.08. Pattern fallbacks BW_BY_PATTERN: horizontal_push 0.64, vertical_push 0.7, horizontal_pull 0.55, vertical_pull 0.96, squat 0.85, lunge 0.85, hinge 0.5, calf_raise 0.95, core 0.35, triceps_extension 0.6, curl 0.5; anything else bodyweight defaults to 0.6. effectiveLoadKg for 'added' = max(0, bwFraction × bodyweight + logged). loadCalorieFactor: carried = min(2, 1 + kg/bodyweight); added = min(1.6, 1 + kg/(2 × bodyweight)); external and none = 1. intensityCalorieFactor = clamp(1 + (RPE − 7) × 0.03, 0.88, 1.12); to-failure is treated as RPE 10 → ×1.09. LOAD_FIELD_LABEL: external 'Weight', added '+ kg', carried 'Load kg', none null.
- **`src/lib/oneRepMax.ts`** — 1RM estimation, effort-corrected. Both formulas were derived from sets taken to failure, so a set with reps in reserve breaks their premise; estimate1RMFromSet adds the RIR back on before applying the formula. Used by the PR detector, ExerciseStatsScreen, and the ActiveSessionScreen's %1RM placement.  
  *Constants:* Epley 1RM = w × (1 + reps/30); Brzycki = w × 36/(37 − reps), returning 0 at reps ≥ 37. Both return the weight unchanged at 1 rep. Results rounded to 0.1 kg. ormConfidence: 'high' for a to-failure set, 'medium' for a rated set, 'low' for an unrated one — this classification is computed but not surfaced anywhere in this area.
- **`src/lib/effort.ts`** — How hard a set was and what that means for growth. Supplies repsInReserve (used by the 1RM correction and the rest prescription) and RPE_SCALE (rendered verbatim by RpeGuide in every lifting session). Also the effective-sets / stimulating-reps model used by the stats side. Unknown effort deliberately gets FULL hard-set credit so nobody's history deflates.  
  *Constants:* FAILURE_RIR = 0. STIMULATING_REP_WINDOW = 5 (the last five reps before failure). HARD_SET_MAX_RIR = 4 (full credit at 0–4 RIR, then a linear taper). NO_STIMULUS_RIR = 8. LOW_LOAD_REP_THRESHOLD = 15 reps. FAILURE_OVERUSE_SHARE = 0.6. RPE_SCALE is exactly 6 rows (10, 9, 8, 7, 6, ≤5) with 10/9/8/7 marked productive. effortScore returns null below 25% known-effort share.
- **`src/lib/exerciseDifficulty.ts`** — The NEW five-point difficulty grading shown in the library. Authored value wins; otherwise a named-skill override matched on the slug (longest match wins); otherwise equipment sets a floor and the movement pattern adjusts it. Also defines the per-level band used for ordering the library list.  
  *Constants:* Labels: 1 'Anyone', 2 'Beginner', 3 'Standard', 4 'Hard', 5 'Elite'. EQUIPMENT_BASE: machine 2, cable 2.5, dumbbell 3, barbell 3.5, bodyweight 3, other 3. PATTERN_ADJUST: vertical_push +0.5, vertical_pull +0.5, hinge +0.5, squat +0.25, lunge +0.25, carry −0.25, isolation −0.5, biceps_curl −0.75, lateral_raise −0.75, triceps_extension −0.5, core −0.25, mobility −1, cardio −0.5. 57 SKILL_OVERRIDES — 13 at difficulty 5 (planche, front-lever, back-lever, human-flag, one-arm-pull-up, one-arm-chin, muscle-up, iron-cross, manna, freestanding handstand push-up, freestanding handstand, dragon-flag, ninety-degree-push-up), 26 at 4, and the regressions at 1–2 (wall-push-up 1, knee-push-up 1, glute-bridge 1, dead-bug 1, bird-dog 1, wall-slide 1, cat-cow 1, incline-pushup 2, assisted 2, negative 2, inverted-row 2, australian 2, wall-sit 2). LEVEL_BAND: beginner [1,3], intermediate [2,4], advanced [2,5] — bands overlap on purpose and nothing is ever hidden. LEVEL_IDEAL: beginner 2, intermediate 3, advanced 4. levelFit = max(0, 1 − |d − ideal| × 0.28).
- **`src/lib/exerciseAlternatives.ts`** — The mid-session 'this is too hard, swap it' engine behind the AlternativePicker. A candidate MUST share the primary muscle; when the target names a sub-muscle the candidate must train that same sub-muscle. It ranks same-sub-muscle above same-muscle, then prefers the smallest step down, and returns an empty list rather than a plausible-looking wrong answer.  
  *Constants:* Uses its OWN name-regex difficulty, separate from exerciseDifficulty.ts: EQUIP_BASE machine 1.5, cable 2, band 1.5, dumbbell 2.5, barbell 3, bodyweight 3, other 2.5; HARDER regex (one-arm, planche, muscle-up, front/back lever, human flag, dragon flag, pistol, handstand push) +2; HARDISH (archer, pseudo, typewriter, ring, tuck, shrimp, sissy, nordic, deficit, explosive, plyo, clap) +1; EASIER (assisted, incline, knee, negative, wall, chair, box, band, machine, seated, supported, bench, smith, goblet, half) −1; SKILL (deadlift, squat, clean, snatch, overhead, jerk, turkish) +0.5; clamped 1–5. limit = 6 results. Candidates are restricted to the same FLOW (strength/calisthenics → lifting; cardio/outdoor/sport/martial_arts → cardio; mindbody/meditation → mindbody). If nothing is strictly easier it falls back to same-difficulty lateral swaps.
- **`src/lib/subMuscle.ts`** — Resolves the emphasised sub-muscle for any exercise: the recorded value if it has one, otherwise inferred from the name plus the primary muscle. Drives the library's sub-muscle filter row, the library row's secondary line, and the AlternativePicker's sub-muscle label.  
  *Constants:* Only ~100 built-in exercises carry an explicit subMuscle; the rest are inferred. Inference covers 11 primary muscles (chest, triceps, biceps, forearms, quads, hamstrings, glutes, calves, back, shoulders, core) by keyword — e.g. chest: 'incline'/'decline push'/'pike' → upper_chest, 'dip'/'decline'/'pseudo'/'lower'/'crossover' → lower_chest, else mid_chest; shoulders: 'lateral'/'side' → side_delt, 'rear'/'reverse fly'/'face pull' → rear_delt, else front_delt. Anything outside those 11 returns null.
- **`src/data/exercises.ts`** — The built-in library and its taxonomy. RAW_EXERCISE_LIBRARY is a flat array; EXERCISE_LIBRARY re-maps it to merge pinned SUB_MUSCLE_TAGS and to resolve a difficulty on every entry via difficultyOf(), so no exercise can ship without one. Also exports the warm-up prescriptions, the generic form cues, the muscle/equipment/sub-muscle label maps, the alias set the browser hides, and difficultyBySlug for callers that hold slugs.  
  *Constants:* 759 entries total (413 built with the compact S() helper, 346 as full object literals). 12 MUSCLE_GROUPS. 32 SUB_MUSCLE_LABELS. 12 WARMUPS_BY_MUSCLE prescriptions. 16 PATTERN_CUES sets of 3 cues each. 6 ALIAS_SLUGS hidden from the browser but kept seeded so old logs resolve. 6 EQUIPMENT_LABELS. Explicit sessionType overrides in the data: 66 mindbody, 62 sport, 55 martial_arts, 49 cardio, 44 meditation, 40 calisthenics, 38 outdoor, 17 strength — everything else takes the S() default of 'calisthenics' for bodyweight and 'strength' otherwise. Default MET from S(): 6 for bodyweight, 5 otherwise. The slug is the stable natural key used by the seed UPSERT and must never change. scripts/verify-engines.ts only asserts the library has 150+ entries.
- **`src/services/sessionNotifications.ts`** — The sticky 'session in progress' Android notification. Uses a stable per-key identifier so re-showing replaces it in place with no flicker; sessionStore pins it on begin() and on resume() after an app restart, and dismisses it on finish() and cancel().  
  *Constants:* Channel id 'active-session', name 'Active session', AndroidImportance.LOW (silent, no heads-up), vibration disabled, showBadge false. Content: sticky true, autoDismiss false, color '#4F8CFF'. Every call is wrapped in try/catch — notifications never block a session. Permission is requested lazily on the first show (Android 13+).
- **`src/services/sessionGps.ts`** — GPS distance for ordinary sessions (hike, ride, wander, paddle) as opposed to the dedicated walk/run tracker. Reuses the single live-route row and the single expo-location foreground task, so only one trace can run at a time. Measures distance only — it deliberately does NOT infer steps, because cycling and paddling cover ground without stepping; the 'On foot' Switch on ActiveSessionScreen decides that separately.  
  *Constants:* startSessionGps returns false when a walk/run is already tracking or when the location task will not start (in which case it rolls back the live-walk row). It calls startLiveWalk({ mode: 'walk', source: 'gps' }) — mode 'walk' is chosen only to keep the step maths sane for on-foot cases and is ignored for wheeled ones. ActiveSessionScreen polls it every 2000 ms and lets the measured distance override anything typed into the Distance field.
- **`src/lib/met.ts + src/lib/activitySteps.ts`** — The calorie base and the step contribution. caloriesFromMet is the gross Compendium formula; netCaloriesFromMet subtracts the resting 1 MET, and is what all attribution uses. estimateActivitySteps converts an on-foot session's distance (or, failing that, its duration) into a step count that finalizeSession folds into daily_step_logs.  
  *Constants:* kcal = MET × 3.5 × weightKg / 200 × minutes; net uses max(0, MET − 1). SESSION_TYPE_MET fallbacks: strength 5, calisthenics 6, cardio 7, outdoor 9, sport 7, martial_arts 9.5, mindbody 3, meditation 1.3, custom 4 (and a hard ?? 4 beyond that). RUN_SPEED_KMH = 7 decides walk vs run gait for stride and cadence; height defaults to 170 cm. gradeMultiplier = +8% per 1% incline, −3% per 1% decline, clamped 0.85–2.5 (used by walks, not by session attribution).
- **`src/lib/level.ts`** — Experience level and everything it changes. levelOrDefault is read by both ActiveSessionScreen (to scale the rest) and ExerciseLibraryScreen (to order the list); slugsForLevel trims and level-filters a split day's prefill before the session even starts.  
  *Constants:* Three levels, labelled 'Beginner' / 'Intermediate' / 'Pro'. A NULL profile value reads as intermediate. LEVEL_PRESCRIPTION maxExercises: beginner 4, intermediate and advanced Infinity; sets '3' / '3–4' / '4–5'; reps '8–12' / '6–12' / '5–12'; compound reps '5–8' / '4–8' / '3–6'. slugsForLevel drops out-of-band exercises only if at least min(3, list.length) fit — a thin day you can do beats a full one you cannot.
- **`src/repositories/statsRepo.ts (exerciseProgression) + src/repositories/postSessionRepo.ts`** — exerciseProgression powers both ExerciseStatsScreen's charts and the ActiveSessionScreen's history lookup (best 1RM ever and top weight ever, used to place a set as a share of 1RM and to detect a step up). postSessionFor builds the recap's strain rating and the six after-session margins from what was actually logged.  
  *Constants:* exerciseProgression buckets by ISO date and requires both weightKg and reps, so duration/distance exercises never produce a point. postSessionFor returns null unless the session has an endTime or a durationS; strain levels are light | moderate | hard | brutal; margin keys are water, eat, smoke, alcohol, cold, next; the smoke margin is gated on isSmokingEnabled() while alcohol is always shown. activePostSession only looks at the last 3 sessions and ignores anything more than 12 hours old.

### Notes for the redesign

GAPS AND ODDITIES A DESIGNER MUST KNOW.

1. DEAD FEATURE — the library's level filter. ExerciseLibraryScreen line 82 declares `const [forMyLevel, setForMyLevel] = useState(false)` and line 121 uses it to filter by `suitsLevel`, but `setForMyLevel` is never called. There is no toggle, chip or switch anywhere in the JSX. The 'only show what fits my level' behaviour is fully implemented and completely unreachable; today level only re-ORDERS the list. This is the single most obvious thing to wire up in v3.

2. ActiveSessionScreen ignores its own route param. It declares `ActiveSession { sessionId: number }` and every caller passes one, but the screen never calls useRoute — it renders whatever `useSessionStore()` holds. There is exactly one live session at a time, enforced by `activeSession()` returning the most recent row with a null endTime.

3. TWO DIFFERENT DIFFICULTY ENGINES, visible side by side. The library grades exercises with the authored/derived `difficultyOf` (exerciseDifficulty.ts, resolved once at module load and read via difficultyBySlug). The in-session AlternativePicker grades them with the older name-regex `estimateDifficulty` (exerciseAlternatives.ts). The same exercise can show a different number of dots depending on which screen you are looking at, and custom exercises always grade 'Standard' (3) in the library because their generated `custom-{timestamp}` slugs are not in the difficulty map.

4. THE RECAP IS A DEAD END and is reachable exactly once. It is registered with `headerShown: false` and entered via navigation.replace, so there is no back gesture — the only exit is 'Done'. There is no way to see a session's recap again later; SessionDetail is a different, plainer screen with no PR badge, no strain card, no save-as-routine.

5. THE CALORIE NUMBER IS COMPUTED TWICE WITH DIFFERENT INPUTS. finalizeSession stores caloriesBurned using the bodyweight at check-out; SessionDetailScreen re-derives the whole per-exercise split on read with the CURRENT bodyweight (`sessionCalorieBreakdown(detail, bodyKg)`). The 'Calories' StatTile shows the stored number while the per-exercise kcal chips show the recomputed ones, so on a session from before a weight change they will not sum.

6. bestPrior1RM takes an `excludeSessionId` argument and never uses it. PR detection therefore compares against a pool that already contains the current session's earlier sets. In practice detectAndFlagPRs walks sets in order against a running maximum so the behaviour is mostly right, but the parameter is a lie and the function is not what its name promises.

7. RETRO-LOGGED SETS CAN NEVER CARRY EFFORT. SessionDetailScreen's AddSetRow offers only kg / reps / min / km — no RPE field, no to-failure checkbox. Every set added there is 'unknown effort', which the effort engine deliberately gives FULL hard-set credit to and which the 1RM correction leaves uncorrected. It also does not re-run PR detection, so a heavy retro set will never be flagged.

8. DELETION IS ASYMMETRIC. Deleting a whole session asks for confirmation. Deleting an exercise or an individual set — in either the live session or the detail screen — happens instantly with no confirmation and no undo. On the live screen the delete icon sits 8px from the swap icon in the same header row.

9. THE PHYSIOLOGY LAYER IS INVISIBLE UNTIL YOU TAP 'why?'. The CO / stomach / sleep adjustments change the rest number but are only surfaced as bullet strings inside the collapsed reasons list, and only on the card where the set was just logged (lastRx is local state and is lost when the card unmounts). There is no indicator anywhere that the app knew you had smoked or eaten. Correspondingly `restBeforeStateSec` — the recommendation before the state adjustment, computed specifically so the change would be legible — is never rendered by any screen.

10. THE REST BANNER LOSES ITS EXPLANATION ON A MANUAL OVERRIDE. Tapping a preset chip calls startRest(sec) with no prescription, so restRx becomes null: the banner's 'ATP-PCr (phosphagen) · CNS high' subtitle disappears and the PCr bar silently falls back to the textbook τ=45 s even if the lifter's oxygen delivery is impaired. 'Skip' clears restEndsAt but leaves restRx and restDurationS behind.

11. 'REPEAT LAST' IS GLOBAL, NOT SESSION-LOCAL. It calls lastSetForExercise(exerciseId), which orders by set id descending across the user's entire history — so on the first exercise of a session it repeats a set from a previous session. It copies reps/weight/rpe/toFailure only, never duration or distance, so it is useless for timed or distance-tracked movements yet still rendered for them in lifting sessions.

12. MIND-BODY 'style' IS SAVED AS A NOTE. The 'Technique / style (optional)' input is passed to finish() as `notes`, so sessions.style is never written from the live screen despite the column existing and being settable via startSession's opts.

13. TRACKING-TYPE COVERAGE IS THIN AT THE EDGES. fieldsFor() maps 'custom' to a reps-only form, and `distance`-only exercises get a km field but no duration. Duration and distance exercises never produce a point on ExerciseStatsScreen (exerciseProgression requires both weight and reps), so a plank or a farmer's carry logged fifty times still shows 'No history yet'.

14. SCROLLING FILTER ROWS STACK UP. The library can show five horizontally-scrolling SegmentedControls (type, muscle, sub-muscle, gear, plus the search box) above the list, each an independent horizontal scroll region, with the type row alone holding 10 pills. On a phone this consumes roughly a third of the viewport before a single result appears, and there is no way to collapse them.

15. HISTORY IS CAPPED AND UNFILTERABLE. Both tabs load a hard 200 rows with no pagination, no search, no type filter and no date jump, despite listSessions already supporting `since`, `until` and `type`. The walk tab hard-codes metric distance formatting regardless of the user's unit preference.

16. GPS IS SINGLE-TENANT AND THE FAILURE IS AN ALERT. Only one trace can run at a time (there is one live-route row and one location task); a session that tries while a walk is running gets a modal Alert rather than an inline disabled state. Both GPS failure paths are Alerts, which is the only modal error surface in the whole area.

17. NO LOADING STATES EXIST ANYWHERE, and none are needed — every read is synchronous expo-sqlite. Conversely there are no error states either: a missing session id throws `Session {id} not found` straight out of getSessionDetail and crashes the render.

18. Small copy/format inconsistencies worth unifying in v3: ActiveSessionScreen and SessionDetailScreen each define their own `describeSet` with different output (the live one is load-mode aware and falls back to the literal 'logged'; the detail one is not and falls back to '—'). ExercisePeek prints the raw equipmentType lower-case while everywhere else uses EQUIPMENT_LABELS. The recap's 'top {kg} kg' uses Math.max over all sets including uncompleted ones, while its set count uses completed sets only.

---

## 10. Stats, Progress, Reports, Achievements and Profile

This area is FitCoach's read-back half: one bottom-tab dashboard (Stats) that summarises the week and links into two deep-dives (Muscle Growth, Trends), and one bottom-tab settings/identity hub (Profile) that fans out to the athlete card, the 130-badge achievement catalogue, PDF report export, target editing, profile editing and the in-app changelog. Every number on every screen is computed synchronously from the on-device SQLite database at focus time — there are no async loaders, no spinners other than two `Loading…` text placeholders, and no network calls except the optional expo-updates OTA check. Three separate models sit underneath: a per-muscle "growth readiness" score (proximity-weighted hard sets against a 10–20 set/week band), an expected-vs-actual body-composition projection (7700 kcal ≈ 1 kg, with partitioning driven by protein/sets/sleep/smoking), and a 0–99 FIFA-style athlete rating built from six attributes. The design language is uniform and thin: `Screen` (a padded ScrollView, 16pt gap, 96pt bottom pad), `Card` with an optional 3px left accent border, `PageHero` on every pushed page, `SectionHeader`, `StatTile`, `ProgressBar`, and four hand-rolled charts (LineChart, DualLineChart, BarChart, CalendarHeatmap).

### Screens (11)

#### StatsScreen

**Route** `Stats (TabParamList, no params) — bottom tab #4, headerShown:false, tab icon ICONS.nav.stats, tab bar height 62`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/stats/StatsScreen.tsx`  
**Reached from** Bottom tab bar, 4th position. No params, no other entry.

The week-at-a-glance dashboard: this week's training totals, a 12-week consistency heatmap, volume/session-mix/weight/muscle-balance charts, activity & recovery averages, body composition, optional smoking impact, and the PR list. It is also the only entry point to the Growth and Trends deep-dives.

**Layout, top to bottom**

- Text variant="h1" — literal "Stats" (no PageHero here; the tab screens use a bare h1 while every pushed page uses PageHero)
- Row of TWO pressable StatTiles (deep-dive links): [icon stats.muscleMap, label "Muscle Growth", value "Open", sub "per-muscle readiness", accent theme.colors.accent] → Growth; [icon stats.progression, label "Trends", value "12 wk", sub "everything charted", accent theme.colors.primary] → Trends
- Row of TWO StatTiles: [icon nav.train, "Sessions", value = count, sub "this week", NO accent] and [icon core.streak, "Streak", value = days, sub "days", accent warning]
- Row of THREE StatTiles: [stats.volume, "Volume", `${Math.round(weekVolume/1000)}k`, sub "kg this wk", accent primary]; [nutrition.calories, "Burned", `${Math.round(weekCalories)}`, sub "kcal this wk", accent calories]; [core.timer, "Active", `${Math.round(weekMinutes)}`, sub "min this wk", accent accent]
- SectionHeader "Consistency" → Card containing: a Row with Icon stats.heatmap (18, accent) + caption "Last 12 weeks · {N} active days", then CalendarHeatmap of 84 days (12×12px cells, 3px gaps, 3px radius, Monday-first column padding, 4-step Less→More legend)
- SectionHeader "Weekly Volume" + Card BarChart — rendered ONLY when volumeByWeek.length > 0. 8 bars, label = weekStart.slice(5) i.e. "MM-DD", value formatted as `{n}k` at ≥1000 else rounded kg, colour primary
- SectionHeader "Session Mix" + Card — ONLY when typeCounts is non-empty. One row per session type, sorted by count desc: Icon metaFor(type).icon tinted SESSION_TYPE_COLORS[type] + caption label (Strength, Calisthenics, Cardio, Outdoor, Sport, Martial Arts, Mind-Body, Meditation, Custom), count on the right, then a 6px ProgressBar of count/total in that type's colour
- SectionHeader "Body Weight" + Card — ONLY when weightSeries.length >= 2. LineChart in theme.colors.info; yFormat converts to lb (×2.205, rounded) when unit is imperial. Below it, centred caption "Latest: {formatWeight(lastPoint, unit)}"
- SectionHeader "Muscle-Group Balance" + Card — ONLY when there is set data. Top 8 muscle groups by volume: capitalized group key on the left, `Math.round(vol).toLocaleString()` on the right, 6px ProgressBar of vol/maxMuscle in theme.colors.calisthenics
- SectionHeader "Activity & Recovery" + Row of THREE StatTiles (always rendered): [cardio.steps, "Avg steps", locale-formatted, sub "per day (7d)", accent accent]; [sleep.moon, "Avg sleep", `${avg7d}h` or "—", sub "per night (7d)", accent mindbody]; [alcohol.beer, "Alcohol", `${Math.round(weekGrams)}g`, sub "this week", accent warning]
- SectionHeader "Body Composition" + Row — ONLY when bodyComp exists AND (bodyFatPct != null OR normalizedFFMI != null). Up to three StatTiles, each individually gated: [stats.bodyFat, "Body fat", `{n}%`, accent warning]; [strength.dumbbell, "Lean mass", `{n}kg`, accent primary]; [stats.progression, "FFMI", `{n}`, accent accent]. These tiles have no `sub` line
- SectionHeader "Smoking Impact" with right-hand action "Details" + a whole-card Pressable → Smoking. ONLY when the smoking tracker is enabled. Card accent = accent when smokeFreeStreak > 0, else warning. Contents: Row [Icon smoking.cigarette warning + bodyStrong "~{avgPerDay}/day this week"] and right caption "{currency}{moneyWeek.toFixed(2)} · {hours}h life (est.)"; Divider; Row [Icon smoking.lungs info + "Estimated −{aerobicPenaltyPct}% aerobic capacity · +{restingHrElevationBpm} bpm resting HR"]; optional Row [Icon cardio.steps + "Your steps: {A} on smoke days vs {B} smoke-free (+{pct}%)"] — the percentage suffix appears only when clean days beat smoke days
- SectionHeader "Personal Records" + Card — ONLY when prs.length > 0. Up to 10 rows, Divider between: Icon core.pr (18, warning), exercise name (bodyStrong, numberOfLines 1), sub-caption "{ISO date} · est. 1RM {n} kg", and right-aligned "{weightKg}kg × {reps}"

**Interactions**

- Tap the "Muscle Growth" tile → navigation.navigate('Growth')
- Tap the "Trends" tile → navigation.navigate('Trends')
- Tap "Details" on the Smoking Impact section header → navigate('Smoking')
- Tap anywhere on the Smoking Impact card → navigate('Smoking')
- useFocusEffect re-runs loadStats() on every focus (and the useState initializer runs it once on mount, so it executes twice on first render)
- No filters, chips, toggles, swipes, long-presses or modals anywhere on this screen. Charts are static — no tooltips, no point selection, no date-range control

**What it shows, and from where**

- Sessions this week — listSessions({ since: daysAgoISO(6) }).length (sessionRepo)
- Volume this week — sum of sessions.totalVolume over that same 7-day list, divided by 1000 and rounded to "Nk"
- Burned this week — sum of sessions.caloriesBurned
- Active min this week — sum of sessions.durationS / 60
- Streak — currentStreak() in statsRepo: builds a 365-day trainingCalendar, walks back day by day, and starts the cursor at yesterday if today has no session yet
- Consistency heatmap + "N active days" — trainingCalendar(84) in statsRepo (one row per session, counted per local ISO date)
- Weekly Volume bars — weeklyVolume(8) in statsRepo, bucketed by startOfWeek() (Monday-based), summing sessions.totalVolume
- Session Mix counts — sessionTypeCounts(30) in statsRepo
- Body Weight line — weighInHistory() from userRepo, filtered to the last 180 days, mapped to {x: index, y: weightKg, label: date}
- Muscle-Group Balance — muscleGroupBalance(30) in statsRepo: for every completed set in the last 30 days, volume = weightKg × reps, falling back to reps alone when there is no weight; the volume is added in full to EVERY muscle group in the exercise's muscleGroups JSON array (so a compound double-counts across groups)
- Avg steps — weeklyStepAverage() in coachRepo (mean stepCount over dailyStepLogs rows in the last 7 days; 0 when there are no rows)
- Avg sleep — sleepSummary().avg7d in sleepRepo (mean of nights actually logged, not of 7 calendar days)
- Alcohol this week — alcoholImpact().weekGrams in alcoholRepo
- Body fat / Lean mass / FFMI — computeBodyComp() in lib/bodyComposition, fed the LAST weigh-in (weighInHistory()[last]) plus useUserStore heightCm. normalizedFFMI = leanMass/heightM² normalised to 1.8 m
- Smoking figures — smokingImpact() in smokingRepo (returns null when the tracker is off, which is what hides the whole section)
- Smoking steps correlation — smokingCorrelation(30) in smokingRepo
- Personal Records — personalRecords(20) in statsRepo: setEntries where isPr = true, joined to exercises and sessions, newest first; est1RM via estimate1RMFromSet() (Epley by default, with reps-in-reserve added back before the formula)

**What it writes**

- None. StatsScreen is entirely read-only — it performs no repository writes.

**Empty, loading and error states**

- EMPTY: when weekSessions === 0 AND weightSeries is empty AND no calendar day has a count AND smoking is null, the screen renders only the h1 "Stats" plus EmptyState{icon: 'stats.progression', title: 'Your insights will appear here', message: 'Log a few sessions, weigh-ins and meals and FitCoach will chart your progress.'} and nothing else
- LOADING: none. loadStats() is fully synchronous; there is no spinner and no skeleton
- ERROR: none. Nothing is wrapped in try/catch — a throw inside loadStats() propagates and blanks the screen
- PARTIAL: each section is independently gated, so an account with only weigh-ins shows the tiles, the heatmap and the Body Weight card and nothing else. LineChart/BarChart render the literal text "Not enough data yet" when handed an empty array
- PERMISSIONS: none requested on this screen

> Unit bug worth fixing in v3: the Volume tile always says "kg this wk" and PR rows always say "kg", regardless of the imperial preference — only the Body Weight chart and its "Latest:" caption respect the unit. The muscle-balance bars are not comparable across users or over time (raw kg×reps, double-counted across every tagged muscle group, unnormalised). The Activity & Recovery row always renders, so a user with no steps/sleep/alcohol data sees "0 / — / 0g". `userHeight()` at the bottom of the file reads useUserStore.getState() outside React — it looks like a hook but is not one.

#### GrowthScreen

**Route** `Growth (RootStackParamList, no params) — Stack.Screen options={{ title: '' }}, so the native header carries only a back arrow`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/stats/GrowthScreen.tsx`  
**Reached from** Only from the "Muscle Growth" StatTile on StatsScreen. There is no other route into it.

An explicit, non-flattering readout of how closely the user's real logs match the conditions research ties to hypertrophy: three global gates (protein, sleep, calories), a realistic gain range for their training age, and a per-muscle score card for every muscle trained in the last 4 weeks.

**Layout, top to bottom**

- PageHero: icon stats.muscleMap, colour theme.colors.accent, title "Muscle growth", subtitle "An honest readout: how closely your real logs match the conditions research ties to hypertrophy — volume (10–20 hard sets/muscle/week), progressive overload, recovery, protein and sleep. No invented numbers." (>100 chars, so PageHero renders it full-width beneath the icon tile rather than beside it)
- SectionHeader "Growth conditions" + one Card with three GateRows separated by Dividers. Each GateRow = Icon core.check (success) when passing / core.info (warning) when not, bodyStrong label, muted detail line. (1) "Protein ≥ 1.6 g/kg" → "{n} g/kg (7d avg)" or "no nutrition logs this week". (2) "Sleep ≥ 7 h" → "{n} h avg" or "no sleep logs this week". (3) "Not in a harsh deficit" → "energy supports growth" or "eating far below target — expect maintenance at best"
- Card accent=accent: Icon stats.progression + bodyStrong "Realistic gain at your level: {min}–{max} kg muscle / month" and caption "{label} · training age ~{n} months. Population averages under good conditions — a range, not a promise."
- SectionHeader "Per muscle (last 4 weeks)" then ONE Card per trained muscle, sorted by avgSetsPerWeek4w descending, accent = GROWTH_STATUS_COLOR for its status
- — inside each muscle Card, top to bottom: Row [h3 MUSCLE_LABELS[muscle] | Badge with GROWTH_STATUS_LABEL in the status colour]
- — Row [caption "~{n} hard sets/wk (this week: {n})" | caption "growth zone 10–20"]
- — ProgressBar of avgEffectiveSetsPerWeek4w / 20 in the status colour (note: ProgressBar force-switches to theme.colors.warning whenever progress > 1, i.e. above 20 sets, overriding the status colour)
- — Row of MiniScores (value in bodyStrong above a 10px faint label): "Volume", "Overload", "Recovery", "Effort" (rendered only when effortScore is not null), and "Score" rendered bold in h3
- — optional caption "Averaging {n} rep(s) in reserve" + " · {n}% of sets to failure" + " · {n} logged, {n} counted" (the last clause appears only when raw sets exceed effective sets by more than 0.5)
- — optional caption "Volume trend: {+/-}{n}% vs previous 2 weeks" coloured success when ≥0, warning when negative
- — up to TWO coaching notes, each rendered as "• {note}" in textFaint
- SectionHeader "Total hard sets per week" + Card BarChart of 8 bars labelled "-7w" … "-1w", "now", colour primary, values shown only when > 0
- Centred footer caption "Visible hypertrophy typically needs 8–12+ weeks of these conditions held consistently."

**Interactions**

- None — the screen is entirely non-interactive. No taps, no expand/collapse, no muscle filter, no time-range control. The only navigation is the native back arrow.
- useFocusEffect recomputes growthReport() from scratch on every focus

**What it shows, and from where**

- proteinGPerKg — growthRepo: mean protein over dailyIntakeSince(daysAgoISO(6)) divided by latestWeight()?.weightKg ?? 75. Gate passes at ≥ 1.6; a null value fails the gate
- avgSleep — avgRestHours(7) in sleepRepo (night sleep PLUS nap credit, not night sleep alone). Gate passes at ≥ 7
- calorieOk — growthRepo: avg 7-day intake ≥ goal.calorieTarget × 0.8. Defaults to TRUE when there is no intake or no goal (so an unlogged user is never told they are in a deficit)
- gainRange — naturalGainRangeKgPerMonth(trainingAgeMonths, sex) in lib/growth: <12 months → 0.5–1.0 kg/mo "Beginner (year 1)"; <36 months → 0.25–0.5 "Intermediate (years 2–3)"; else 0.1–0.25 "Advanced (3+ years)". Female halves both ends
- trainingAgeMonths — months since the user's FIRST ever session row, rounded, 0 if none
- per-muscle sets/scores — growthRepo.growthReport() iterating the 12 MUSCLE_GROUPS (chest, back, shoulders, biceps, triceps, quads, hamstrings, glutes, calves, core, forearms, neck), scored by scoreMuscle() in lib/growth
- effective sets — summariseEffort() in lib/effort: each completed set is credited 0..1 by proximity to failure
- weeklySetSeries — growthRepo, 8 weekly buckets of RAW set-row counts over the last 8 weeks

**What it writes**

- None. Read-only.

**Empty, loading and error states**

- INITIAL: report is null on first render → `<Screen><Text>Loading…</Text></Screen>` (a bare unstyled line of text, no spinner)
- EMPTY: when no muscle has avgSetsPerWeek4w > 0 → PageHero (colour theme.colors.strength here, NOT accent — an inconsistency with the populated state) + EmptyState{icon: 'stats.muscleMap', title: 'No strength training logged yet', message: 'Log a few lifting sessions and FitCoach will score each muscle's growth conditions.'}
- NO EFFORT DATA: the "Effort" MiniScore is hidden entirely and the RIR line is suppressed when effortScore() returns null (which it does when known RPE/failure data covers under 25% of sets); instead a note reads 'Mark sets "to failure" or give them an RPE and this can tell how hard you actually trained, not just how often.'
- ERROR: none — growthReport() is not wrapped in try/catch here

> The bottom chart is titled "Total hard sets per week" but plots raw set-row counts, not the proximity-weighted effective sets used everywhere else on the screen. Only trained muscles are listed — an untrained muscle group is simply absent, so there is no visual cue that (say) calves have had zero sets for a month. Muscles are keyed on exercises.primaryMuscle only (not the muscleGroups array), which is a different attribution rule from the Muscle-Group Balance card on StatsScreen.

#### TrendsScreen

**Route** `Trends (RootStackParamList, no params) — options={{ title: '' }}`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/stats/TrendsScreen.tsx`  
**Reached from** Only from the "Trends" StatTile on StatsScreen.

The long view: everything the app tracks, charted on one timeline at either daily (14 buckets) or weekly (12 buckets) granularity, with a pageable window; plus the measured body-composition trend, the expected-vs-actual projection model, and a fat-distribution readout keyed to body type.

**Layout, top to bottom**

- PageHero: icon stats.progression, colour primary, title "Trends", no subtitle
- SegmentedControl (full width, 2 options): "Daily (14 days)" | "Weekly (12 weeks)" — default weekly
- Card pager: [Pressable Icon core.back 22 primary, hitSlop 10] — [centre: bodyStrong rangeLabel "MM-DD → MM-DD", caption "latest" or "{n} window(s) back" · "per day"/"per week"] — [Pressable Icon core.forward, disabled and 30% opacity when page === 0]. Back paging is UNBOUNDED (you can page into empty prehistory forever)
- ChartCard "Body weight (kg, avg per week|day)" accent info, LineChart — only when the weight series has samples
- SectionHeader "Body composition" + one Card per metric (Fat mass, Muscle mass), only when compositionTrend(90) has data: Row [bodyStrong "{label} ({unit})" | caption "{+/-}{n}kg · 90d" coloured success when fat falls or muscle rises, warning otherwise, textMuted at exactly 0]; then a LineChart when there are ≥2 readings (fat in warning colour, muscle in primary) or the copy "One reading so far — log another to see the trend." / "No readings yet."; then the plain-language `reason` sentence
- — then a footnote: "Measured from your weigh-ins. Scale muscle & fat readings swing with hydration — the multi-week trend is what matters, not any single reading. Log body fat / muscle in Profile → Body to fill these in."
- SectionHeader "Expected vs reality" — when the projection has too little data, a single Card accent textFaint with Icon core.info and the copy "Needs at least two weigh-ins and about a week of logged food in the last 60 days. Until then there's nothing honest to compare — so nothing is shown."
- — when it does have data: an intro caption ("The dashed line is where energy balance, protein, training, sleep and smoking say you should be. The solid line is what you actually measured. The gap is the interesting part."), then one Card per series: Row [bodyStrong "{label} ({unit})" | caption "{+/-}{gap}{unit} vs model" coloured success when |gap| < 1 else warning]; DualLineChart (actual = solid primary with 3px dots, expected = dashed textFaint, legend row "Actual" / "Expected (unit)", gaps in either series are broken rather than interpolated); then explainGap() prose
- — then a footnote: "Model basis: 7700 kcal ≈ 1 kg, maintenance {tdee} kcal. Unlogged days count as maintenance rather than being guessed, and training isn't double-counted (your TDEE already includes an activity multiplier)."
- SectionHeader "Fat distribution" + Card accent warning (ALWAYS rendered): bodyStrong body-type label or "Body type not set"; a paragraph that branches three ways on body type (endomorph → central/android storage and waist as the honest signal; ectomorph → stores late, loses fast; otherwise mesomorph → even distribution, WHR tracks well) with an extra sentence appended when sex === 'female' about gynoid storage; a Row of FOUR Minis — "Waist" ({n} cm or —), "Hip", "WHR", "Waist Δ (window)" (signed cm); footnote "Add waist/hip in Body composition weigh-ins to track this precisely. Spot-reduction isn't a thing — distribution is genetic; the deficit chooses the order."
- SectionHeader "Nutrition" + up to four ChartCards, each gated on having samples: "Calories (avg/logged day · target {n})" LineChart colour calories; "Protein (g, avg/logged day)" colour protein; "Water (L, avg/logged day)" colour water, 1 dp; "Caffeine (mg, avg/logged day)" colour caffeine
- SectionHeader "Training": "Lifting volume (kg / week|day)" BarChart primary with k-formatting; "Active minutes / week|day" BarChart accent; "Steps (avg/day)" LineChart accent with k-formatting
- SectionHeader "Rest & recovery": "Sleep (h, avg/logged night)" LineChart mindbody 1 dp; "Post-session mood (1–5)" LineChart meditation 1 dp; "Work hours / week|day" BarChart info with "{n}h" labels
- SectionHeader "Habits impact": "Alcohol (g / week|day)" BarChart warning; "Cigarettes / week|day" BarChart warning; "Tracked-habit minutes / week|day" BarChart calisthenics
- Centred footer caption "Weeks with nothing logged plot as zero — consistency of logging is itself visible here."

**Interactions**

- SegmentedControl toggles granularity between 'daily' and 'weekly' and resets page to 0
- Left chevron pages BACK one full window (page + 1), with no lower bound
- Right chevron pages FORWARD (page − 1), clamped at 0 and visually disabled there
- useFocusEffect reloads trendsData, compositionProjection(60) and compositionTrend(90) on focus and whenever granularity or page changes
- No chart is interactive — no tooltips, no scrubbing, no legend toggling, no per-series hiding

**What it shows, and from where**

- Every WeekPoint series (weight, calories, protein, sleep, steps, volume, activeMinutes, mood, alcohol, cigarettes, habitMinutes, workHours, water, caffeine) — trendsRepo.trendsData({granularity, page}). Weight/calories/protein/sleep/steps/mood/water/caffeine are bucket AVERAGES; volume/activeMinutes/alcohol/cigarettes/habitMinutes/workHours are bucket SUMS. Every value is rounded to 1 dp
- calorieTarget in the calories chart title — getNutritionGoal()?.calorieTarget
- Habit minutes — habitEntries × habitProfiles: duration habits use r.minutes, count habits use quantity × minutesPerOccurrence
- Water — beverageEntries where BEVERAGE_PRESETS[type].hydrating, summed per day then converted to litres
- Fat mass / Muscle mass trend and the 90-day change — projectionRepo.compositionTrend(90); fat mass via computeBodyComp() from bodyFatPct or fatMassKg, muscle mass read directly as muscleMassKg ?? skeletalMuscleKg
- The plain-language `reason` per composition metric — projectionRepo's fatReason()/muscleReason(): direction thresholds are ±0.2 kg, and the text names the averaged calorie balance, whether protein cleared 1.6 g/kg, the total hard sets logged, sleep under 6.5 h and whether the user smokes
- Expected series and gaps — projectionRepo.compositionProjection(60) → lib/projection.projectComposition() + compareToActual(). Metrics are always ['weightKg'], plus ['fatMassKg','leanMassKg','bodyFatPct'] when the starting weigh-in has fat data, plus 'muscleMassKg' only when start muscle exists AND at least 2 weigh-ins carry a muscle reading
- tdee in the footnote — getNutritionGoal()?.tdee ?? 2200
- bodyType / sex / latestWaist / latestHip / whr / waistChange12w — trendsRepo; WHR = waist/hip rounded to 2 dp; waistChange12w = latest waist − the oldest waist reading that falls inside the current window
- explainGap() prose — lib/projection: "tracking closely" when |gap| < 0.7 (or < 1 for body-fat %), otherwise metric-specific text about under-logging, a wrong TDEE estimate, or water retention

**What it writes**

- None. Read-only.

**Empty, loading and error states**

- INITIAL: data null → `<Screen><Text>Loading…</Text></Screen>`
- PROJECTION UNAVAILABLE: compositionProjection is wrapped in try/catch — a throw sets proj to null and the whole "Expected vs reality" section (header included) disappears silently. Same for compositionTrend → comp null hides "Body composition"
- PROJECTION INSUFFICIENT: hasEnoughData requires ≥2 weigh-ins in 60 days AND ≥7 days with logged intake AND a start weight > 0; otherwise the explanatory Card described above
- EMPTY ACCOUNT: the four section headers "Fat distribution", "Nutrition", "Training", "Rest & recovery", "Habits impact" render UNCONDITIONALLY, so a user with no data sees five orphan headers with nothing under them (the Fat distribution card does render, filled with dashes)
- PERMISSIONS: none

> Paging backwards is unbounded, so the user can silently walk into windows of pure zeros with no signal that they have gone past the start of their data. The comp/proj sections do not re-page with the granularity control — they are always fixed at 90 and 60 days regardless of the window selected, which reads as a subtle inconsistency. The "Waist Δ (window)" Mini is labelled by the current window but the field is named waistChange12w.

#### ProfileScreen

**Route** `Profile (TabParamList, no params) — bottom tab #5, headerShown:false`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/profile/ProfileScreen.tsx`  
**Reached from** Bottom tab bar, 5th position.

The identity + settings hub: name/age/height/body-type header, a quick weigh-in logger, the six daily nutrition targets, unit preference, and link lists out to the athlete card, achievements, PDF reports, ten health & wellness trackers, the OTA update check, the changelog, session history, the exercise library and a targets recalculation.

**Layout, top to bottom**

- Header Row: a 64×64 tile (borderRadius 20, backgroundColor theme.colors.primarySoft) holding Icon nav.profile at 38; then h1 user.name and caption "{age} yrs · {heightCm or —} cm · {BODY_TYPE_LABELS[bodyType] or 'Body type —'}"; then a Pressable Icon core.edit (22, textMuted, hitSlop 8) → EditProfile
- Card "Weight": h3 "Weight"; then a Row — left column shows the current weight in variant="display" with tabular-nums (converted with kgToLb and 1 dp when imperial, or "—") over caption "kg|lb · current"; right column (flex 1, marginLeft 16) holds an Input placeholder "Log today's weight" with a kg/lb suffix and numeric keyboard, and a small Button "Log weigh-in" (icon stats.weight) disabled while the field is empty
- SectionHeader "Daily Targets" with right action "Adjust" → Goals — the whole targets block renders only when a nutritionGoal row exists
- Row of THREE StatTiles: [nutrition.calories, "Calories", `{calorieTarget}`, accent calories]; [nutrition.water, "Water", `{(waterGoalMl/1000).toFixed(1)}L`, accent water]; [nutrition.caffeine, "Caffeine", `{caffeineSoftLimitMg}mg`, accent caffeine]
- Row of THREE StatTiles: [nutrition.protein, "Protein", `{n}g`, accent protein]; [nutrition.carbs, "Carbs", `{n}g`, accent carbs]; [nutrition.fat, "Fat", `{n}g`, accent fat]
- Centred caption "{GOAL_LABELS[goal]} · {first half of ACTIVITY_LABELS[activityLevel]} · TDEE {n}" (the TDEE clause is omitted when goal.tdee is null)
- SectionHeader "Units" + SegmentedControl "Metric (kg, km)" | "Imperial (lb, mi)" — changing it calls updateProfile({unitPreference}) which ALSO triggers a full target recalculation as a side effect
- SectionHeader "Card & Reports" + one Card of three LinkRows (icon 20 textMuted, label body, right chevron core.forward 18 textFaint, 12pt vertical padding, Divider between): "Athlete card" (card.trophy) → ProfileCard; "Achievements" (card.star) → Achievements; "Export PDF reports" (report.pdf) → Reports
- SectionHeader "Health & Wellness" + one Card of ELEVEN LinkRows: "Body composition" (stats.bodyFat) → Body; "Sleep" (sleep.moon); "Work hours" (work.briefcase); "Habits" (habits.generic); "Alcohol" (alcohol.beer); "Smoking impact" or "Smoking tracker" (smoking.cigarette — the label depends on useSmokingStore.enabled); "Cycle tracking" (cycle.flower); "Health conditions" (health.medical); "Hormones" (hormone.gland); "Prayer times" (faith.crescent); "Fasting mode" (faith.fasting)
- SectionHeader "App version" + Card whose accent is success when the last check said up-to-date, else primary: bodyStrong "FitCoach v{APP_RELEASE}" (currently 2.64) over a status caption with four variants — "Checking for updates…", "Up to date ✓", "Update available — tap to install", or "Released {APP_RELEASE_DATE} · updates automatically"; a core.check icon appears at the right when up to date; then a Row of two half-width Buttons: "What's new" (secondary, card.star) → Changelog, and "Check for updates"/"Checking…" (card.download)
- SectionHeader "More" + one Card of three LinkRows: "Session history" (core.calendar) → SessionHistory; "Exercise library" (nav.train) → ExerciseLibrary { pick: false }; "Recalculate targets" (core.settings) — runs recalcTargets() inline and shows an Alert
- Card accent=accent with Icon core.info and the privacy paragraph: "Local-first & private. All your health, body and nutrition data stays on this device in an on-device SQLite database — no account or internet required. Cloud sync is an explicit opt-in (Phase 2)."

**Interactions**

- Edit pencil in the header → EditProfile
- Type a weight and tap "Log weigh-in" → parseFloat, lbToKg when imperial, logWeight(kg), input cleared. A falsy parse (0 or NaN) silently does nothing
- "Adjust" on Daily Targets → Goals
- Units SegmentedControl → updateProfile({ unitPreference }) → also recalcTargets()
- 14 LinkRows navigating to: ProfileCard, Achievements, Reports, Body, Sleep, Work, Habits, Alcohol, Smoking, Cycle, Conditions, Hormones, Prayers, Fasting, SessionHistory, ExerciseLibrary
- "What's new" → Changelog
- "Check for updates" → four possible Alerts: 'Updates unavailable' + 'Over-the-air updates only work in an installed build (not in development).' when __DEV__ or !Updates.isEnabled; 'Up to date ✓'; 'Update available' with buttons [Later (cancel), Update now → fetchUpdateAsync + reloadAsync]; 'Update failed'; and 'Update check failed' on a thrown check
- "Recalculate targets" → Alert 'Targets recalculated ✓' with "{kcal} kcal · P {n}g · C {n}g · F {n}g\nWater {n} L", or Alert 'Missing data' + 'Log a weigh-in and set your height first, then recalculate.'
- useFocusEffect calls userStore.load() and smokingStore.load() on every focus

**What it shows, and from where**

- user.name, birthdate→age via ageFromBirthdate() (defaults to 30 when null), heightCm, bodyType — useUserStore.user, hydrated by userRepo.getUser()/ensureUser()
- currentWeightKg — userRepo.latestWeight()?.weightKg (the most recent weighIns row by date)
- calorieTarget / proteinG / carbsG / fatG / waterGoalMl / caffeineSoftLimitMg / tdee — userRepo.getNutritionGoal() (the highest-id nutritionGoals row)
- GOAL_LABELS and ACTIVITY_LABELS — lib/calories
- smokingEnabled — useSmokingStore
- APP_RELEASE / APP_RELEASE_DATE — src/data/changelog.ts, derived from CHANGELOG[0]

**What it writes**

- logWeight() → userRepo.addWeighIn() → table `weighIns` (one row per day; a same-day re-log deletes and reinserts, carrying forward every measurement field the user did not re-enter), then userStore.recalcTargets()
- updateProfile() → userRepo.updateUser() → table `users`, then recalcTargets()
- recalcTargets() → userRepo.upsertNutritionGoal() → table `nutritionGoals`, and goalHistoryRepo.recordGoalChange() → table `goalHistory` whenever calories or any macro actually moved (wrapped in try/catch — history failure never blocks the recalc)

**Empty, loading and error states**

- LOADING: `if (!user) return <Screen><Text>Loading…</Text></Screen>` — a bare text line
- NO GOAL: the entire "Daily Targets" block (header, six tiles, caption) is hidden when getNutritionGoal() returns nothing
- NO WEIGHT: the display number reads "—"
- NO HEIGHT: the header caption reads "— cm", and "Recalculate targets" hits the 'Missing data' branch because recalcTargets bails without user.heightCm
- OTA: 'Updates unavailable' in dev builds; four Alert paths as listed above
- ERROR: update failures are surfaced as Alerts; nothing else on this screen is guarded

> There is no destructive action anywhere — no data export/wipe, no way to delete a weigh-in from here (that lives in BodyScreen). The unit toggle triggering a full target recalculation as a side effect is surprising and undocumented in the UI. The "Health & Wellness" card is an 11-row undifferentiated list, by far the densest block on the screen and the strongest candidate for restructuring in v3.

#### EditProfileScreen

**Route** `EditProfile (RootStackParamList, no params) — Stack.Screen options={{ title: 'Edit Profile' }}`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/profile/EditProfileScreen.tsx`  
**Reached from** Only from the pencil icon in the ProfileScreen header.

Edit the identity and metabolic inputs that drive every calorie/macro number in the app: name, gender, metabolic sex, birthdate, height, activity level, training experience, body type, goal and pace. Saving recalculates targets immediately and shows the new numbers.

**Layout, top to bottom**

- NOTE: this is the ONLY pushed screen in this area with a real native header title and NO PageHero — it opens straight onto the Name field
- Input "Name"
- Label "Gender" + scrollable SegmentedControl with FOUR options: Male, Female, Non-binary, Other. Picking Male or Female also sets the metabolic sex
- Label "Sex for metabolic calculations (BMR)" + SegmentedControl Male | Female — rendered ONLY when gender is non_binary or other
- Input "Birthdate (YYYY-MM-DD)" — the LABEL itself appends " — invalid format" when /^\d{4}-\d{2}-\d{2}$/ fails. Keyboard is numbers-and-punctuation. There is no date picker; it is free text
- Input "Height" with suffix "cm" — label appends " — enter 100–250 cm" when invalid. Validation is heightNum > 100 && heightNum < 250, so exactly 100 and exactly 250 are rejected; an EMPTY field is treated as valid and falls back to the existing height on save
- Label "Activity level" + scrollable SegmentedControl of five, labelled from the first half of ACTIVITY_LABELS: Sedentary, Light, Moderate, Active, Very active
- Label "Training experience" + SegmentedControl Beginner | Intermediate | Pro, with LEVEL_BLURBS as a faint caption beneath (e.g. beginner: "Under a year of consistent training, or coming back after a long break. Fewer exercises, 3 sets, a rep range that teaches the movement.")
- Label "Body type" + SegmentedControl Ectomorph | Mesomorph | Endomorph (BODY_TYPE_LABELS with "-leaning" stripped). When bodyType is null the control DISPLAYS mesomorph as selected without actually setting it; BODY_TYPE_BLURB shows only once a value is chosen
- Card accent=primary "Your goal": h3, then a scrollable SegmentedControl over GOAL_ORDER — "Lose fat", "Maintain", "Build muscle", "Build muscle & burn fat", "Athletic performance" — then GOAL_NOTES for the selection as a muted caption (the recomp note is the longest, four lines about 2.4 g/kg lean mass, hard lifting and sleep)
- — when goal !== 'maintain': label "Pace" + SegmentedControl Slow | Moderate | Aggressive
- — faint caption "Saving recalculates your calorie, macro & water targets immediately and shows you the new numbers."
- Row: Button "Cancel" (secondary, flex 1) and Button "Save"/"Saving…" (icon core.check, flex 2, disabled unless canSave)

**Interactions**

- Ten form controls as listed; all local state until Save
- canSave = non-empty trimmed name AND a valid birthdate format AND a valid-or-empty height AND not already saving
- Save → updateProfile({name (falls back to 'Athlete'), gender, sex, birthdate, heightCm, activityLevel, experienceLevel, goal, rateOfChange, bodyType}) then recalcTargets(), then Alert 'Profile updated ✓' with "Your targets were recalculated:\n\n{kcal} kcal · P {n}g · C {n}g · F {n}g" — or 'Saved. Log a weigh-in so calorie targets can be calculated.' when recalc returns null. The single OK button calls navigation.goBack()
- A thrown save → Alert 'Could not save' with the error message; goBack does NOT happen
- Cancel → goBack, discarding everything

**What it shows, and from where**

- Every field seeds from useUserStore.user, with defaults: gender 'male', sex 'male', birthdate '1995-01-01', activityLevel 'moderate', experienceLevel via levelOrDefault(), goal 'maintain', rateOfChange 'moderate', bodyType null
- The post-save Alert numbers come from userStore.recalcTargets() → lib/calories.computeTargets()

**What it writes**

- userRepo.updateUser() → table `users` (name, gender, sex, birthdate, heightCm, activityLevel, experienceLevel, goal, rateOfChange, bodyType)
- userStore.recalcTargets() → userRepo.upsertNutritionGoal() → table `nutritionGoals`, and goalHistoryRepo.recordGoalChange() → table `goalHistory` (snapshotting goal, rate, calorieTarget, macros, tdee, bmr, basis 'mifflin'|'katch', atWeightKg, atBodyFatPct)
- Note: updateProfile ALREADY calls recalcTargets internally, and save() then calls recalc() again — so targets are recomputed twice per save

**Empty, loading and error states**

- NOT LOADED: `if (!user)` → EmptyState{icon: 'core.info', title: 'Profile not loaded', message: 'Go back and reopen this screen. If it persists, restart the app.'} plus a "Back" Button. This is a deliberate guard — an earlier version blank-screened here
- INVALID INPUT: communicated only by appending text to the field's LABEL (no red border, no inline error row, no helper text under the field) and by disabling Save
- SAVING: the Save button title flips to "Saving…"; the flag is cleared in a finally block
- ERROR: Alert 'Could not save'

> Birthdate is a free-text field validated by regex only — "2099-13-45" passes the format check. Body type shows mesomorph as pre-selected when the profile has none, which will silently write mesomorph the moment the user touches any other control and saves. Gender has four options but only two feed BMR, which the conditional sex control handles well.

#### GoalsScreen

**Route** `Goals (RootStackParamList, no params) — options={{ title: '' }}`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/profile/GoalsScreen.tsx`  
**Reached from** Only from the "Adjust" action on the Daily Targets section header in ProfileScreen.

Manually override the six auto-calculated daily targets (calories, protein, carbs, fat, water, caffeine), with an escape hatch to recompute the four nutrition figures from the profile and latest weight.

**Layout, top to bottom**

- PageHero: icon nutrition.calories, colour theme.colors.calories, title "Targets", subtitle "These override the auto-calculated targets. Use “Auto-recalculate” to reset them from your profile & latest weight."
- Card (gap md): Input "Daily calories" suffix "kcal" numeric; then a Row of three equal-flex Inputs — "Protein" (g), "Carbs" (g), "Fat" (g)
- Card (gap md): Input "Water goal" suffix "ml" numeric (seeded from the goal or '2500'); Input "Caffeine soft limit" suffix "mg" numeric (seeded from the goal or '400')
- Button "Auto-recalculate from profile" — full width, variant secondary, icon core.settings
- Row: Button "Cancel" (variant ghost, flex 1) and Button "Save Targets" (icon core.check, flex 2)

**Interactions**

- Six numeric text fields, all local state
- "Auto-recalculate from profile" → useUserStore.recalcTargets(); on success it rewrites the calories/protein/carbs/fat FIELDS only — water and caffeine are left untouched in the form even though recalc has already written a new waterGoalMl to the database
- "Save Targets" → upsertNutritionGoal({...}) then userStore.load() then goBack()
- "Cancel" → goBack, discarding edits (but NOT undoing an auto-recalculate, which has already written to the DB)

**What it shows, and from where**

- All six fields seed from useUserStore.goal (the nutritionGoals row); water defaults to '2500' and caffeine to '400' when there is no goal
- The auto-recalculate values come from lib/calories.computeTargets() via userStore.recalcTargets()

**What it writes**

- userRepo.upsertNutritionGoal() → table `nutritionGoals`. Parse fall-backs on save are: calories → goal.calorieTarget → 2200; protein → goal.proteinG → 140; carbs → goal.carbsG → 220; fat → goal.fatG → 70; water → 2500; caffeine → 400. goal.tdee is carried through unchanged
- "Auto-recalculate" itself writes: nutritionGoals (via recalcTargets) and potentially a `goalHistory` row

**Empty, loading and error states**

- No loading state, no empty state, no error state, no validation. A blank or non-numeric field silently falls back to the previous value or a hard-coded default on save
- No confirmation that the save succeeded — the screen simply pops

> The screen calls itself an override but a subsequent weigh-in, profile edit or unit-toggle anywhere else in the app runs recalcTargets() and will silently overwrite the manual calorie/macro values (water too). Only caffeineSoftLimitMg is genuinely preserved across recalculation (userStore carries previous?.caffeineSoftLimitMg forward). A manual save writes no goalHistory entry, so hand-set targets are invisible in the goal history shown on BodyScreen.

#### ProfileCardScreen

**Route** `ProfileCard (RootStackParamList, no params) — options={{ title: '' }}`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/profile/ProfileCardScreen.tsx`  
**Reached from** Only from ProfileScreen → "Card & Reports" → "Athlete card".

A FIFA-style athlete card generated from the user's real logged data: an overall 0–99 rating, a tier, six attributes, an archetype word and a monthly photo — exportable as a PNG to the share sheet or the photo library.

**Layout, top to bottom**

- PageHero: icon card.star, colour primary, title "Athlete card", subtitle "Your card is built from your real stats and refreshes as you train. Set this month's photo and share it like a FIFA card."
- THE CARD — a centred View of exactly 300 × 460, borderRadius 24, overflow hidden, held by a ref and captured to PNG: an absolutely-positioned SVG paints a LinearGradient (x1 0,y1 0 → x2 0.6,y2 1) from the tier colour to #0B1220, plus a 4px tier-coloured stroked Rect with rx 24
- — Header row (padding 18, space-between): left column = the overall number at fontSize 46 / weight 900 / lineHeight 48 in white; under it the archetype word UPPERCASED at 14/800 with letterSpacing 1; under that a tier pill on #00000033 (paddingH 8, paddingV 2, radius 8) showing the tier UPPERCASED at 11/800. Right = Icon card.star at 30 in #ffffffcc
- — Photo block (marginTop −6): either the stored photo at 150×150, radius 12, 3px #ffffff55 border, or a #ffffff22 placeholder square with Icon nav.profile at 70 in #ffffffaa
- — Name block: user.name UPPERCASED at 20/900 letterSpacing 0.5 in white, then "{age} yrs · {Month Year}" at 11 in #ffffffaa
- — Attribute block (paddingH 28, paddingT 14, space-between): TWO columns of three rows each — column 1 = STR, END, CON; column 2 = NUT, REC, DIS. Each row is the value at 15/900 in a fixed 26px-wide slot, then the three-letter key at 12/700 in #ffffffcc
- — Absolute footer at bottom 12: "FITCOACH" at 10/700 with letterSpacing 2 in #ffffff88
- Legend Row (wrapping, centred, gap 10): six faint captions — "STR · Strength", "END · Endurance", "CON · Consistency", "NUT · Nutrition", "REC · Recovery", "DIS · Discipline"
- Row of two half-width Buttons: "Add photo"/"Change photo" (secondary, icon card.camera) and "Share PNG" (icon card.share, shows a loading spinner while busy === 'share')
- Full-width ghost Button "Save to Photos" (icon card.download, loading while busy === 'save')

**Interactions**

- "Add photo"/"Change photo" → ImagePicker.requestMediaLibraryPermissionsAsync(), then launchImageLibraryAsync with allowsEditing, aspect [1,1], quality 0.85. The picked file is copied into the app's own document directory before being stored
- "Share PNG" → captureRef at PNG quality 1 to a tmpfile, then Sharing.shareAsync with dialogTitle "Share your athlete card"
- "Save to Photos" → captureRef, then MediaLibrary.requestPermissionsAsync() and saveToLibraryAsync
- Both export buttons are guarded by a single `busy` flag so only one runs at a time
- useFocusEffect recomputes the rating and re-reads the stored photo on every focus

**What it shows, and from where**

- overall, tier, tierColor and the six attributes — cardRepo.computeCardRating() → lib/rating.computeRating(). Overall = (STR×1.0 + END×1.0 + CON×1.3 + NUT×1.1 + REC×1.0 + DIS×1.1) / 6.5, rounded
- Tier thresholds and colours — Legend ≥90 (#B58CFF), Elite ≥80 (#4FC3F7), Gold ≥68 (#FFD54A), Silver ≥55 (#C0C6D0), else Bronze (#CD8B62)
- Archetype word — the highest-scoring attribute mapped through a local ARCHETYPE record: STR→Powerhouse, END→Engine, CON→Ironclad, NUT→Fuelled, REC→Regenerator, DIS→Disciplined
- name and age — useUserStore.user + ageFromBirthdate()
- Month label — new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
- Photo — userRepo.getProfilePhoto(currentMonthKey()) where the key is "YYYY-MM"

**What it writes**

- userRepo.setProfilePhoto(month, uri) → table `profilePhotos` (insert or update on the existing month row)
- services/cardExport.persistProfilePhoto() copies the picked image to `${FileSystem.documentDirectory}profile-photos/{YYYY-MM}.jpg`, deleting any previous file for that month first, and falls back to the original cache URI if the copy throws

**Empty, loading and error states**

- LOADING: `if (!user || !rating) return <Screen><Text>Loading…</Text></Screen>`
- NO PHOTO: the 150×150 placeholder square with a profile icon
- STALE PHOTO: photoStillExists() runs asynchronously after focus; if the stored file has been cleared from disk the URI is dropped and the placeholder shows instead of a blank square
- PHOTO PERMISSION DENIED on pick: the function returns silently with NO message to the user — an unexplained no-op
- MEDIA PERMISSION DENIED on save: Alert 'Photos permission needed' + 'Allow FitCoach to add to your photos to save the card, or use Share instead.'
- EXPORT ERROR: Alert 'Could not export the card' with the message, or 'Unknown error'
- SAVE SUCCESS: Alert 'Saved to Photos' + 'Your athlete card is in your photo library.'
- SHARE SUCCESS: no confirmation (the OS sheet is the feedback). If Sharing.isAvailableAsync() is false, the share path completes with shared:false and says nothing at all

> The card is a fixed 300×460 raster target, so any v3 redesign has to keep it capture-safe (no theme-dependent colours — it hard-codes white text and #0B1220). The silent return on a denied photo-library permission is the one genuinely unhandled state. Achievements #7 ("Scouted") and #8 ("Draft Pick") reference exporting this card, but only #8 has a rule (cardOverall ≥ 70) — #7 is untracked, so exporting never actually unlocks anything.

#### AchievementsScreen

**Route** `Achievements (RootStackParamList, no params) — options={{ title: '' }}`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/profile/AchievementsScreen.tsx`  
**Reached from** Only from ProfileScreen → "Card & Reports" → "Achievements".

The full badge catalogue: 130 achievements across 13 categories, each with pre-rendered art, its criteria sentence, and either live progress read from the user's own data or an explicit 'not auto-tracked yet' marker.

**Layout, top to bottom**

- PageHero: icon card.trophy, colour theme.colors.warning, title "Achievements", no subtitle
- Card accent=warning: a Row with h2 "{unlockedCount}" followed inline by h3 textMuted " / 130", and a right-aligned caption "badges unlocked"; then a ProgressBar of unlocked/130 in warning; then a faint caption "Progress toward badges is read from your own data. A few event-based badges (like exporting your card) unlock when you do them."
- THIRTEEN collapsible category sections, in catalogue order: 1 Consistency & Streaks, 2 Strength & Muscle Growth, 3 Movement & Endurance, 4 Honest Nutrition & Hydration, 5 Tunisian & Mediterranean Heritage, 6 Smoking Cessation & Health Recovery, 7 Mind, Sleep & Work Balance, 8 Mindful Alcohol Moderation, 9 Faith & Fasting, 10 Micronutrients & Supplement Stacks, 11 Self-Care & Devotion, 12 Body Mastery & Special Ops, 13 Daily Challenges — ten badges each
- — each section header is a Pressable Row (paddingTop 8): h3 category name (flex 1), a caption "{done}/{10}" coloured success when complete else textMuted, and a chevron Icon — core.back when open, core.forward when closed (an up/down chevron would read better; the code reuses the horizontal ones)
- — ONLY category 1 is open on mount (useState initial { 1: true }); this is deliberate so all 130 badge images are never mounted at once
- — each open category renders one AchievementRow Card per badge: accent success when unlocked, else no accent; the 48px badge image at full opacity when unlocked and 0.35 when locked; then bodyStrong name (with a core.check in success beside it when unlocked) over a muted caption carrying the badge's criteria sentence verbatim; then on the right either a Badge "Unlocked" (success), or tabular "{current}/{target}", or a faint Icon core.info for untracked badges
- — beneath the row: a 5px warning ProgressBar for tracked-but-locked badges, or the caption "Unlocks when you do it — not auto-tracked yet." for untracked ones
- Centred footer caption "130 badges across 13 categories — grounded in your real streaks, workouts, nutrition, sleep, self-care, faith and health data."

**Interactions**

- Tap a category header to expand or collapse it. Multiple categories can be open at once; state is component-local and resets on unmount
- No other interaction — badges are not tappable, there is no detail sheet, no filter (all / unlocked / locked), no sort, and no share
- useFocusEffect recomputes achievementStats() on every focus — a heavy computation that reads sessions, steps, walks, food, beverages, sleep, smoking, alcohol, prayers, self-care, naps, micros, supplements, challenges, weigh-ins AND runs both growthReport() and computeCardRating()

**What it shows, and from where**

- unlockedCount and every per-badge current/target — lib/achievementRules.evaluateAchievement(def, stats) against achievementsRepo.achievementStats()
- 90 of the 130 badges have a rule and show live progress; 40 have none and render as untracked. The untracked ids are 7, 9, 10, 11, 15, 17, 18, 25, 26, 30, 36, 37, 49, 54, 55, 56, 58, 60, 63, 64, 65, 66, 67, 68, 69, 70, 74, 77, 78, 79, 80, 83, 85, 86, 87, 89, 97, 98, 99, 100 — i.e. category 7 (Mind, Sleep & Work) has only 2 of 10 tracked, category 6 has 5, category 8 has 5, category 9 has 5, category 10 has 6, while categories 11, 12 and 13 are fully tracked
- Badge art — src/data/badgeImages.ts, 130 base64 PNG data URIs rendered through a plain <Image> by components/BadgeSvg.tsx. The raw SVG on each AchievementDef is NOT rendered (react-native-svg crashed this screen natively); it is only parsed for its palette if an image id is ever missing, in which case a two-tone "Medallion" View is drawn instead

**What it writes**

- None. Read-only — there is no achievements table and no unlock timestamp. Unlock state is recomputed from live stats every time the screen opens, so a badge can visibly re-lock if the underlying streak lapses.

**Empty, loading and error states**

- STATS FAILURE: achievementStats() is itself wrapped in try/catch and returns a fully zeroed ZERO_STATS object rather than throwing; the SCREEN wraps the call again and, if that also fails, maps every badge to { current: 0, target: 1, unlocked: false, tracked: false } so the catalogue still renders. There is no error message shown to the user, only a console.warn
- NO DATA: every badge shows locked at 35% opacity with 0/target progress; nothing is empty-stated
- LOADING: none — the computation is synchronous and can be slow on a large database
- Robustness detail: achievementsRepo deliberately avoids Math.max(...spread) (a maxOf reduce helper instead) because spreading hundreds of rows threw RangeError on Hermes and white-screened this screen; the daily-challenges stats call is also `safe()`-wrapped because that table only exists from schema v22

> The header comment in src/data/achievements.ts is stale — it says "120 badges across 12 categories" while the array holds 130 across 13. Six criteria strings contain escaped quotes (ids 14, 16, 18, 67, 93, 96). Category 5 is a Tunisian/Mediterranean heritage set whose rules are regex searches over the concatenated text of the last 90 days of logged food names ("olive oil|zit zitoun|zeitoun", "couscous|kosksi", "harissa", "brik", "lablabi", "bsisa"…), which means they can be unlocked by naming a custom food. Categories differ wildly in how much of them is real: any redesign should surface the tracked/untracked split rather than hiding it in a per-row caption.

#### ReportsScreen

**Route** `Reports (RootStackParamList, no params) — options={{ title: '' }}`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/profile/ReportsScreen.tsx`  
**Reached from** Only from ProfileScreen → "Card & Reports" → "Export PDF reports".

Generate one of two on-device PDF reports — one framed for a nutritionist, one for a coach — and hand it straight to the OS share sheet.

**Layout, top to bottom**

- PageHero: icon report.pdf, colour theme.colors.danger, title "Reports", subtitle "Generate a shareable PDF from your data, tailored for the professional you're working with. It opens the share sheet so you can send or save it."
- SectionHeader "For a Nutritionist" + Card accent=accent: Row [Icon report.nutritionist 22 accent + h3 "Nutrition & body report"]; caption "Calorie & macro targets vs. actual intake (7d/30d), body composition & weight trend, hydration, caffeine, alcohol, sleep, and any declared health conditions."; full-width Button "Generate nutritionist PDF" (icon report.pdf, colour accent, loading spinner while busy)
- SectionHeader "For a Coach" + Card accent=primary: Row [Icon report.coach 22 primary + h3 "Training & recovery report"]; caption "Training volume, session mix, PRs, streaks and steps, plus sleep, recovery, alcohol, your athlete rating, and health considerations."; full-width Button "Generate coach PDF" (icon report.pdf, loading spinner while busy)
- Centred footer caption "Reports are generated on-device from your local data. Nothing is uploaded."

**Interactions**

- Two buttons, each calling exportReport(audience). The pressed button shows a loading state via the local `busy` state (either 'nutritionist' or 'coach'); the other button is NOT disabled while one is running
- Any throw → Alert 'Could not generate report' with the message

**What it shows, and from where**

- Nothing dynamic — the screen renders only static copy. Everything the reports contain is assembled at press time by reportRepo.buildReportData(audience)

**What it writes**

- None to the database. services/pdfReport.exportReport writes a PDF file via expo-print's printToFileAsync and opens Sharing.shareAsync with mimeType application/pdf and dialogTitle "Share coach report" / "Share nutritionist report"

**Empty, loading and error states**

- BUSY: the pressed button shows a spinner and its title stays put; cleared in a finally block
- NO SHARE SHEET: when Sharing.isAvailableAsync() is false, an Alert 'Report generated' shows the raw file URI instead of failing silently
- ERROR: Alert 'Could not generate report'. Notably, reportRepo does `getUser(userId)!` with a non-null assertion — a missing user row throws and surfaces here as that Alert
- No empty state: the buttons are always enabled, so a brand-new account can generate a report full of dashes and zeroes

> The two report variants share one ReportData object and one HTML template; only the SECTION ORDER differs (see lib/reportHtml). Nothing on the screen previews the report or tells the user how long it is.

#### ChangelogScreen

**Route** `Changelog (RootStackParamList, no params) — options={{ title: '' }}`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/profile/ChangelogScreen.tsx`  
**Reached from** Only from ProfileScreen → App version card → "What's new".

The in-app patch notes: every release from v2.64 back to v1.9, plus the current expo-updates runtime and update id.

**Layout, top to bottom**

- PageHero: icon card.star, colour primary, title "What's new", no subtitle
- One Card per CHANGELOG entry — 66 entries, newest first — with accent=primary on the FIRST card and accent=theme.colors.border on all the rest
- — each Card: Row [h3 "v{version}" plus a Badge "Current" in success on the first entry only | faint caption with the ISO date]; then the entry title in bodyStrong textMuted; then every highlight as a Row of [Icon core.check at 14, primary on the first card / textFaint elsewhere] and a muted caption line
- Centred footer block (paddingVertical 8): faint caption "Runtime {Updates.runtimeVersion ?? '—'}" followed by " · update {first 8 chars of Updates.updateId}" or " · bundled build"

**Interactions**

- None whatsoever. No expand/collapse, no search, no version filter, no link-out. Scrolling only

**What it shows, and from where**

- CHANGELOG — src/data/changelog.ts, 66 entries from v2.64 (2026-08-31) down to v1.9 (2026-07-15). Entries carry { version, date, title, highlights[] }
- APP_RELEASE and APP_RELEASE_DATE are derived from CHANGELOG[0] — the display release is deliberately decoupled from the native app.config version so OTA updates keep working against a fixed runtimeVersion
- Updates.runtimeVersion and Updates.updateId — expo-updates

**What it writes**

- None.

**Empty, loading and error states**

- No loading, empty or error state — the array is a static import and is never empty

> All 66 entries render inside the Screen's plain ScrollView with no virtualization and no collapse; recent entries carry six long paragraph-length highlights each, so this is easily the longest scroll in the app. Prime candidate in v3 for collapsing everything below the current release.

#### ExerciseStatsScreen

**Route** `ExerciseStats { exerciseId: number; name: string } — options={{ title: '' }}`  
**File** `C:/Users/fedim/OneDrive/Bureau/FitCoach/src/screens/stats/ExerciseStatsScreen.tsx`  
**Reached from** NOT reachable from any screen in this area — it is pushed from the Exercise Library / session flows only. Included here because it lives in src/screens/stats and is the only other consumer of statsRepo's progression query.

Per-exercise progression: best estimated 1RM, top weight, all-time volume, session count, a progression chart switchable between est. 1RM and volume, and a beginner form guide.

**Layout, top to bottom**

- PageHero: icon stats.progression, colour primary, title = the exercise name from route params
- ExerciseGuide block (when the exercise resolves): an ExerciseIllustration at 170px; a wrapping Row of small Chips — primary muscle (icon stats.muscleMap, primary), sub-muscle (calisthenics), equipment type (accent, with the exercise's own iconKey), plus up to 3 raw muscle-group chips in textMuted; the description paragraph; a warning-accented Card "Warm-up first (mandatory)" with the muscle's warm-up text; and an accent Card "How to do it" with numbered steps in 20px circular badges
- Row of two StatTiles: [core.pr, "Best est. 1RM", rounded kg, sub "kg", accent warning] and [strength.barbell, "Top weight", rounded, sub "kg", accent primary]
- Row of two StatTiles: [stats.volume, "Total volume", "{n}k", sub "kg all-time", accent accent] and [core.calendar, "Sessions", count, no accent]
- SectionHeader "Progression" + SegmentedControl "Est. 1RM" | "Volume" + Card LineChart (warning colour for 1RM, primary for volume, k-formatting above 1000)
- When the 1RM metric is selected: label "1RM formula" + SegmentedControl "Epley" | "Brzycki"

**Interactions**

- Metric SegmentedControl (orm/volume)
- Formula SegmentedControl (epley/brzycki) — visible only in the 1RM metric; changing it re-runs exerciseProgression with the new formula

**What it shows, and from where**

- The whole series — statsRepo.exerciseProgression(exerciseId, formula): all completed sets for that exercise, grouped by local ISO date, keeping the best est. 1RM, the top weight and the summed weight×reps volume per day
- est. 1RM — lib/oneRepMax: Epley w×(1+reps/30) or Brzycki w×36/(37−reps), with reps-in-reserve added back before the formula when RPE or a to-failure flag was logged

**What it writes**

- None.

**Empty, loading and error states**

- EMPTY: when there is no logged history, the screen shows the PageHero, the ExerciseGuide, and EmptyState{icon: 'stats.progression', title: 'No history yet', message: 'Log this exercise in a session to see progression charts.'}

> Out of scope for this area's redesign brief but shares StatTile/LineChart/SegmentedControl conventions with StatsScreen, so it should move with them.

### Engines behind this area

- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/statsRepo.ts`** — The core training-analytics queries behind StatsScreen, ExerciseStatsScreen and the coach/report layers: per-exercise progression, the PR timeline, weekly volume, the training calendar and streak, session-type counts, muscle-group balance, days-since-type, days-since-last-session and recent volume drops. Everything is drizzle-over-expo-sqlite reading sessions/exerciseLogs/setEntries/exercises, filtered in JS after the query in several places.  
  *Constants:* trainingCalendar default 84 days (StatsScreen passes 84 = 12 weeks); currentStreak internally builds a 365-day calendar and allows the streak to survive an untrained today by starting the cursor at yesterday; weeklyVolume default 8 weeks bucketed by Monday-based startOfWeek; sessionTypeCounts and muscleGroupBalance default 30 days; personalRecords is called with limit 20 on Stats and 12 in reports; muscleGroupBalance volume = weightKg × reps, falling back to reps alone when there is no weight, and is added in FULL to every group in the exercise's muscleGroups array; recentVolumeDrops compares the last 7 days against the prior 7. muscleGroupBalance uses startOfDayMs (not new Date(iso)) because the ISO string is a LOCAL date and Date's parser reads it as UTC midnight.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/trendsRepo.ts`** — The bucketing engine for TrendsScreen. Builds a window of N buckets ending at end-of-today, offset by `page × buckets × lenMs`, then drops every tracked signal into it: weigh-ins, food entries (per-day calories/protein), sleep logs, daily step logs, sessions (volume/minutes/mood), alcohol, cigarettes, habit entries, work logs and beverages (hydrating volume + caffeine). Also assembles the fat-distribution context (body type, sex, latest waist/hip, WHR, waist delta).  
  *Constants:* daily = 14 buckets of 1 day; weekly = 12 buckets of 7 days. DAY_MS = 86,400,000. Bucket membership is computed at date + DAY_MS/2 (midday) to avoid timezone edges. Averaged series: weight, calories, protein, sleep, steps, mood, water, caffeine. Summed series: volume, activeMinutes, alcohol, cigarettes, habitMinutes, workHours. All values rounded to 1 dp. rangeLabel is `MM-DD → MM-DD`. WHR rounded to 2 dp, waistChange12w to 1 dp. A bucket with zero samples plots as 0, which is why the footer copy warns about it.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/growth.ts`** — THE MUSCLE-GROWTH MODEL. scoreMuscle() turns per-muscle inputs into a 0–100 readiness score with four sub-scores and a status. Volume scores against a 10–20 effective-set band, overload rewards a rising volume trend, recovery scores rest spacing and is capped by the protein/sleep gates, and effort (from lib/effort) joins only when there is enough RPE/failure data. naturalGainRangeKgPerMonth() gives the realistic gain range by training age.  
  *Constants:* OPTIMAL_SETS_MIN = 10, OPTIMAL_SETS_MAX = 20. Volume score: 0 at 0 sets; (s/10)×70 below 10; 100 inside 10–20; above 20 it decays 5 points per extra set with a floor of 50. Overload score: neutral 60 when unknown, else clamp(60 + trendPct×2, 0, 100); notes fire at ≥+5% and ≤−15%. Recovery: default 70; 45 when avg rest < 1.5 days; 100 between 1.5 and 4.5 days; above 4.5 it decays 12 per day with a floor of 30 and a note past 6 days; capped at 55 when protein fails, at 60 when sleep fails. Weights: without effort data 0.45 volume / 0.25 overload / 0.30 recovery; with it 0.40 / 0.20 / 0.25 / 0.15. Status: 'under-stimulated' at 0 sets; 'growing' at score ≥70 AND calorieOk; 'overreached' above 24 sets with recovery < 60; 'maintaining' at ≥45; else 'under-stimulated'. Gain ranges (kg/month): beginner <12 months 0.5–1.0; intermediate <36 months 0.25–0.5; advanced 0.1–0.25; halved for female. Status colours: growing #33D9A6, maintaining #4F8CFF, under-stimulated #FFB454, overreached #FF5D5D.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/effort.ts`** — The proximity-to-failure model that decides what counts as a 'hard set'. repsInReserve() prefers an explicit to-failure flag over RPE (RPE here is the reps-in-reserve scale, so 10 = failure). hardSetCredit() weights each set 0..1; summariseEffort() aggregates effective sets, avg RIR, failure share, known share and stimulating reps; effortScore() rates effort QUALITY separately from quantity, and effortNotes() produces the coaching lines shown on GrowthScreen.  
  *Constants:* FAILURE_RIR = 0; STIMULATING_REP_WINDOW = 5; HARD_SET_MAX_RIR = 4 (full credit at 0–4 RIR); NO_STIMULUS_RIR = 8 (linear taper from 4 to 8, zero beyond); LOW_LOAD_REP_THRESHOLD = 15 reps with ≥3 RIR flags an under-stimulating light set; FAILURE_OVERUSE_SHARE = 0.6. Unknown effort gets FULL credit (1.0) so old logs never deflate. effortScore returns null when avgRir is unknown or knownShare < 0.25; otherwise 100 at ≤3 RIR, 85 at ≤4, 65 at ≤5, 45 at ≤6, 25 beyond, minus 15 when the failure share exceeds 0.6. effectiveSets are rounded to 2 dp precisely because they get divided by 4 for the weekly average.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/growthRepo.ts`** — Assembles GrowthScreen's report: pulls 4 weeks of completed lifting sets joined to their primary muscle, computes the three gates from nutrition and rest, aggregates per-muscle set counts / effective sets / overload trend / rest spacing, runs scoreMuscle() over all 12 MUSCLE_GROUPS, derives training age from the first-ever session, and builds an 8-week weekly set series for the chart.  
  *Constants:* Window = 4 weeks (28 days) for scoring, 8 weeks for the chart. Protein gate = 7-day average protein / latest weight ≥ 1.6 g/kg (weight falls back to 75 kg). Sleep gate = avgRestHours(7) ≥ 7 (night sleep plus nap credit). Calorie gate = 7-day average intake ≥ calorieTarget × 0.8, and defaults to TRUE when intake or goal is missing. avgSetsPerWeek4w = total rows / 4; avgEffectiveSetsPerWeek4w = effectiveSets / 4. Overload = last 2 weeks vs the prior 2, with volume-less sets excluded from BOTH sides rather than counted as zero. Rest spacing = mean gap in days between distinct training dates for that muscle. trainingAgeMonths = (now − first session) / 30 days, rounded. Muscles are attributed by exercises.primaryMuscle only.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/projection.ts`** — THE BODY-COMPOSITION PROJECTION MODEL used by Trends' 'Expected vs reality'. Energy balance drives total weight change; partitioning between fat and lean is driven by trailing 7-day protein, hard sets, sleep and cigarettes. compareToActual() pairs the modelled trajectory with real weigh-ins and computes the gap at the last point where both exist; explainGap() writes the plain-language interpretation.  
  *Constants:* KCAL_PER_KG = 7700. Unlogged days contribute 0 (treated as maintenance, never guessed). Training calories are deliberately NOT subtracted again because the TDEE already carries an activity multiplier. fatLossFraction: base 0.75; +0.10 at protein ≥1.6 g/kg, −0.10 below 1.0; +0.10 at ≥10 hard sets/week, −0.10 at zero; −0.15 at sleep < 6 h, +0.03 at ≥7 h; clamped 0.5–0.95. leanGainFraction: base 0.35; +0.15 when ≥10 sets/week AND protein ≥1.6; −0.15 at zero sets; −0.10 at sleep < 6 h; −0.05 when smoking; clamped 0.1–0.6. Muscle mass carries the modelled lean change (bone/organ treated as fixed). Trailing windows are 7 days. explainGap calls it 'tracking closely' when |gap| < 0.7 (or < 1 for bodyFatPct). METRIC_META labels: Weight (kg), Fat weight (kg), Lean mass (kg), Muscle mass (kg), Body fat (%).
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/projectionRepo.ts`** — Two functions feeding TrendsScreen. compositionTrend(90) is the plain MEASURED trend of fat mass and muscle mass from weigh-ins, with a generated plain-language reason for each direction. compositionProjection(60) builds the day-by-day DayInput array from real logs (intake, protein, hard sets, sleep, cigarettes), runs projectComposition() and compares it against every weigh-in.  
  *Constants:* compositionTrend defaults to 90 days, compositionProjection to 60 (the screen uses both defaults). tdee falls back to 2200 when there is no goal; start weight falls back to 75 kg for the protein-per-kg basis. Direction thresholds in the reason text: falling below −0.2 kg, rising above +0.2 kg, otherwise 'holding steady'. Muscle mass is read as muscleMassKg ?? skeletalMuscleKg. hasEnoughData = at least 2 weigh-ins in the window AND at least 7 days with logged intake AND a start weight > 0. Metrics shown: always weightKg; plus fatMassKg, leanMassKg and bodyFatPct when the first weigh-in carries fat data; plus muscleMassKg only when a start muscle reading exists AND at least 2 weigh-ins have one.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/calories.ts`** — THE TDEE / TARGET ENGINE behind every number in ProfileScreen's Daily Targets, GoalsScreen's auto-recalculate and EditProfileScreen's save confirmation. Pipeline: BMR (Mifflin-St Jeor, or Katch-McArdle when lean mass is measured) → TDEE (activity multiplier) → goal offset → macro split. Also holds the display labels, the dynamic TDEE refinement, the water heuristic and the fibre target.  
  *Constants:* ACTIVITY_MULTIPLIERS: sedentary 1.2, light 1.375, moderate 1.55, active 1.725, very_active 1.9. Mifflin BMR = 10×kg + 6.25×cm − 5×age, +5 male / −161 female. Katch-McArdle BMR = 370 + 21.6 × leanMassKg. Goal offsets as a fraction of TDEE — lose_fat: −12/−17/−22%; build_muscle: +8/+12/+15%; recomp: −3/−7/−10%; performance: 0/+3/+5%; maintain: 0. calorieTarget = max(BMR, TDEE × (1+offset)) — it is never prescribed below BMR. Protein g/kg by goal: maintain 1.8, lose_fat 2.2, build_muscle 2.0, recomp 2.4, performance 1.8; when body fat is known and between 0 and 60% the basis becomes weight × (1 − bf/100) × 1.15. Fat = 25% of calories for lose_fat and recomp, 22% for performance, 28% otherwise; carbs are the remainder at 4 kcal/g. refineTDEE: needs ≥10 days, blends 0.6 × implied + 0.4 × formula, clamped to ±25%. recommendedWaterMl = max(2000, round(kg × 35 / 50) × 50). Fibre: FIBRE_G_PER_1000_KCAL = 14, FIBRE_MIN_G = 25. GOAL_ORDER = lose_fat, maintain, build_muscle, recomp, performance.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/rating.ts`** — THE ATHLETE-CARD RATING ENGINE. computeRating() maps eleven real-world inputs onto six 1–99 attributes (STR, END, CON, NUT, REC, DIS) and a weighted overall, then a tier and tier colour.  
  *Constants:* Every attribute is clamped 1–99. STR = 30 + relativeStrength×22 + min(15, sessionsPerWeek×3). END = 25 + min(45, weeklyCardioMinutes/4) + min(25, avgStepsPerDay/400). CON = 30 + min(40, sessionsPerWeek×9) + min(25, streakDays×1.5). NUT = 20 + calorieAdherence×35 + proteinAdherence×30 + min(14, loggingDaysPerWeek×2). REC = 25 + sleepScore + min(18, restDaysPerWeek×8) − min(25, alcoholGramsPerWeek/8), where sleepScore = 20 when sleep is unknown, else clamp((hours/8)×45, 0, 45). DIS = 35 + min(20, loggingDays×3) + min(15, sessions×3) − min(25, cigarettesPerDay×3) − min(15, alcoholGramsPerWeek/12). Overall = (STR + END + CON×1.3 + NUT×1.1 + REC + DIS×1.1) / 6.5. Tiers: Legend ≥90 (#B58CFF), Elite ≥80 (#4FC3F7), Gold ≥68 (#FFD54A), Silver ≥55 (#C0C6D0), Bronze below (#CD8B62).
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/cardRepo.ts`** — Builds the RatingInputs from real logs: relative strength from the sum of the best estimated 1RM across the user's top 3 exercises divided by bodyweight, plus session frequency, streak, cardio minutes, steps, calorie/protein adherence, rest hours, rest days, logging days, cigarettes and alcohol.  
  *Constants:* Session frequency window = 28 days (recent28.length / 4); cardio window = 7 days and counts only sessionType in ['cardio','outdoor','sport']. Bodyweight falls back to 75 kg. Calorie adherence = max(0, 1 − |avg − target| / target) with target defaulting to 2200; protein adherence = min(1, avg/target) with target defaulting to 140 and NO penalty for exceeding. restDaysPerWeek = 7 − distinct training days in the last 7. Sleep uses avgRestHours(7) (nights plus nap credit). Cigarettes are counted only when the smoking profile is enabled. alcoholGramsPerWeek is a 4-week average.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/data/achievements.ts`** — THE ACHIEVEMENT CATALOGUE: 130 AchievementDef records ({ id, category, name, criteria, svg }) and a 13-entry ACHIEVEMENT_CATEGORIES array. Category is 1-based and equals ceil(id/10), so each category is exactly ten consecutive ids.  
  *Constants:* 130 badges, 13 categories, 10 each: 1 Consistency & Streaks (ids 1–10), 2 Strength & Muscle Growth (11–20), 3 Movement & Endurance (21–30), 4 Honest Nutrition & Hydration (31–40), 5 Tunisian & Mediterranean Heritage (41–50), 6 Smoking Cessation & Health Recovery (51–60), 7 Mind, Sleep & Work Balance (61–70), 8 Mindful Alcohol Moderation (71–80), 9 Faith & Fasting (81–90), 10 Micronutrients & Supplement Stacks (91–100), 11 Self-Care & Devotion (101–110), 12 Body Mastery & Special Ops (111–120), 13 Daily Challenges (121–130). The file header comment still says '120 badges across 12 categories' — it is stale. Each def carries a raw inline SVG that is NOT rendered at runtime.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/achievementRules.ts`** — The progress rules: a RULES map from achievement id to a function returning { current, target }; unlocked = current >= target. Ids absent from the map return { current: 0, target: 1, unlocked: false, tracked: false } and the UI shows them as 'not auto-tracked yet'.  
  *Constants:* 90 of 130 ids have a rule (TRACKED_ACHIEVEMENT_COUNT = 90); 40 do not. Representative targets: app-open streak 3/7/14/30/100/365 (ids 1–6); card overall 70 (id 8); a first routine, first PR, 10 sets in a week, 10,000 kg session volume (12, 13, 16, 20); steps 5,000 and 10,000, a 7-day 10k streak, 42.2 km in a month, a 500 kcal run, a 60-minute run, END ≥ 75 (21–29); TDEE calculated, 3 calorie-adherent days, 3 macro hits today, a 7-day water streak, a 5-day caffeine streak, protein ≥ 1.6 g/kg today, 30 logged days, a 30-day nutrition streak (31–40); heritage badges are regex searches over 90 days of logged food text plus 3 Tunisian salads and a 30% Tunisian share over 7 days (41–50); smoke-free 12 hours / 7 / 14 / 30 days (51–59); 7 h best sleep and zero sleep debt (61–62); dry days, weekly limit, zero-alcohol week, 7- and 30-day dry streaks (71–76); fasting last-30 and a 7-day fasting streak, prayers enabled, DIS ≥ 75 (81–90); 5 micros at RDI, a supplement stack, a strong-evidence supplement, 7-day creatine, 14-day ashwagandha, zero micro gaps (91–96); 3 brushes, a full self-care day, a 7-day hygiene streak, 5 prayers, a 7-day all-prayer streak, Fajr, a nap, 10 meditations, 60 meditation minutes in a week, a balanced day (101–110); body fat logged, all 15 circumferences, 4 weigh-ins, recomp/performance goal, stacks of 3 and 5, 1/3/10 special-programme sessions, all 8 session types (111–120); challenges spun/completed 1/5/25/100, 7- and 30-day streaks, 10 hard, 5 categories, 500 points (121–130).
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/achievementsRepo.ts`** — Computes the ~70-field AchievementStats object the rules read, pulling from usage, steps, walks, sessions, PRs, routines, custom exercises, growthReport, nutrition, beverages, logged-food text, sleep, smoking, alcohol, faith, micros, supplements, self-care, prayers, naps, challenges, weigh-ins and the card rating. Every sub-computation is individually wrapped in a `safe()` helper, and the public entry point catches everything and returns a fully zeroed ZERO_STATS rather than throwing.  
  *Constants:* Windows: steps 90 days, sessions limit 1000, PRs limit 200, nutrition 60 days, beverages 20 days, logged food 90 days, sleep 30 days, self-care 30 days, prayers 30 days. trailingStreak walks back up to 400 days (usageStreak up to 3650) and starts at yesterday if today is not yet logged. caloriesAdherentDays counts days within ±10% of the calorie target; macroHitsToday counts each of protein/carbs/fat within ±5 g. Water goal defaults to 2500 ml, caffeine limit to 400 mg. The caffeine streak only counts days on which nutrition was actually logged, so an empty diary cannot farm it. Tunisian salad detection matches mechouia, slata, houria, torshi, betterave, poivrons, aubergines, poulpe; the 7-day Tunisian share regex matches couscous, brik, lablabi, mloukhia, ojja, kafteji, bsisa, harissa, mechouia, slata, tajine, merguez, makroudh, tabouna. hasAllMeasurements requires all 15 circumference fields on one weigh-in. maxOf() replaces Math.max(...spread) deliberately — spreading hundreds of rows threw RangeError on Hermes and white-screened the screen.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/data/badgeImages.ts`** — A generated Record<number, string> of 130 base64 PNG data URIs, one per achievement id, produced by scripts/render-badges.js from the catalogue SVGs. components/BadgeSvg.tsx renders these through a plain <Image>, deliberately avoiding react-native-svg (SvgXml crashed the Achievements screen natively — a white screen no JS error boundary could catch), and falls back to a pure-RN two-tone 'Medallion' View parsed from the SVG's own palette when an id is missing.  
  *Constants:* 130 entries, all present. Badges render at 48px on the Achievements rows. The file is ~200 KB of inline base64 and is a generated artefact — never hand-edit it.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/reportRepo.ts`** — Assembles the single ReportData object both PDF variants are built from: profile, latest weight, full body composition, weight trend, nutrition targets vs 7-day and 30-day averages, the 7-day micronutrient picture with its gap list, the supplement stack, training (sessions, streak, weekly volume, session mix, PRs, steps), sleep, alcohol, smoking, menstrual cycle, declared health conditions and the athlete rating.  
  *Constants:* Nutrition averages over 7 days (daysAgoISO(6)) and 30 days (daysAgoISO(29)). Micros are averaged only over the days that carried any micro data (food with micros or a supplement), so an unlogged day is not read as a zero; sodium is excluded from the gap list; 'running low' is below 50% of the RDI, 'covered' is at or above 100%. Training: sessions30d, weeklyVolume(8), sessionMix over 30 days, personalRecords(12), weeklyStepAverage(). weightTrendKgPerWeek(28) is a least-squares slope over the last 28 days, null with fewer than 2 points. smokingImpact() nulls are replaced with an all-zero object whose smokeFreeHours is Infinity. NOTE: `getUser(userId)!` is a non-null assertion — a missing user row throws.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/reportHtml.ts`** — THE PDF DOCUMENT. Pure HTML+CSS from ReportData with no native imports (so it can be rendered and tested in Node). Builds up to twelve sections — Athlete, Body Composition, Nutrition, Micronutrients (7-day average), Supplement Stack, Training & Activity, Sleep, Alcohol, Smoking, Menstrual Cycle, Health Considerations, Athlete Rating — as key/value tables plus two data tables (micro gaps, personal records). Everything is HTML-escaped.  
  *Constants:* Section ORDER is the only difference between audiences. Coach: Athlete, Rating, Training, Sleep, Body Composition, Alcohol, Smoking, Cycle, Nutrition, Supplements, Conditions. Nutritionist: Athlete, Nutrition, Micronutrients, Supplements, Body Composition, Alcohol, Smoking, Sleep, Cycle, Training, Rating, Conditions. Header badge reads 'For your Coach' / 'For your Nutritionist'; H1 is '{name} — Training & Recovery Report' or '— Nutrition & Body Report'. The Smoking section is omitted entirely unless week > 0 or avgPerDay > 0; Body Composition, Nutrition, Micronutrients, Supplements, Cycle and Conditions are each omitted when empty. Styling: 28px page padding, 12px base, accent #4F8CFF, a 3px accent header rule, break-inside: avoid on every section, and a fixed footer 'Generated by FitCoach · Local-first personal health data · Not a medical document.' Two italic disclaimers are embedded — one on the micro estimate, one on user-declared conditions.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/services/pdfReport.ts`** — Turns the HTML into a PDF via expo-print's printToFileAsync (base64: false) and opens Sharing.shareAsync with mimeType application/pdf and UTI com.adobe.pdf. If no share sheet is available it Alerts 'Report generated' with the file URI instead of failing silently. Returns the URI.  
  *Constants:* 28 lines. No page-size or margin options are passed to printToFileAsync — the default is used.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/services/cardExport.ts`** — PNG capture and photo persistence for the athlete card. exportCardPng() captures the ref with react-native-view-shot at format png / quality 1 / result tmpfile, then either requests MediaLibrary permission and saves, or opens the share sheet. persistProfilePhoto() copies a picked image out of the volatile cache directory into the app's document directory keyed by month. photoStillExists() checks a stored URI before the card renders it.  
  *Constants:* Returns a discriminated result: { ok: true, uri, saved, shared } or { ok: false, reason: 'no-view' | 'permission-denied' | 'error', message? } — a denied permission is deliberately NOT treated as an error. Photos land at `${FileSystem.documentDirectory}profile-photos/{YYYY-MM}.jpg`; any existing file for the month is deleted first because copyAsync will not overwrite; a failed copy falls back to the original cache URI.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/userRepo.ts`** — The single-user profile layer: getUser/ensureUser/updateUser, onboarding flags, weigh-in insert and history, the weight trend, monthly profile photos, and the nutrition goal read/upsert. Used by every screen in this area.  
  *Constants:* PRIMARY_USER_ID = 1 — the app is single-user and local-first. addWeighIn enforces one row per day: it reads the existing row, carries forward all 25 optional measurement fields the user did not re-enter, deletes the day's row and reinserts, so a quick weight-only log never wipes the previous tape numbers. WEIGH_IN_FIELDS covers 10 composition readings (bodyFatPct, fatMassKg, muscleMassKg, skeletalMuscleKg, bodyWaterPct, trappedWaterKg, boneMassKg, visceralFatRating, proteinPct, bmrKcal) and 15 circumferences (neck, shoulder, chest, waist, upperAbdomen, lowerAbdomen, hip, armUpperL/R, armLowerL/R, thighL/R, calfL/R). weightTrendKgPerWeek defaults to 21 days (reports pass 28) and returns null below 2 points. currentMonthKey is 'YYYY-MM'. getNutritionGoal returns the highest-id row; upsertNutritionGoal always stamps lastRecalculatedDate = today.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/stores/userStore.ts`** — The zustand store every profile screen reads. Holds user, goal, currentWeightKg and hydrated. load() calls ensureUser + getNutritionGoal + latestWeight. updateProfile() and logWeight() BOTH call recalcTargets() as a side effect. recalcTargets() folds measured body composition into the calorie inputs, writes the new goal and records a goalHistory entry when anything moved. completeOnboarding() estimates a body type, writes the profile and first weigh-in, and computes the initial targets before marking onboarded.  
  *Constants:* inputsFor() feeds computeTargets with the latest weigh-in's bodyFatPct and leanMassKg, so BMR switches to Katch-McArdle whenever lean mass is measured and protein is anchored to lean mass. Height falls back to 175 cm inside the inputs, but recalcTargets bails and returns the existing goal entirely when user.heightCm or a weight is missing. waterGoalMl is always recomputed from bodyweight (a manual override is not preserved); caffeineSoftLimitMg IS carried forward from the previous goal, falling back to CAFFEINE_SOFT_LIMIT_MG. A history entry is written when calorieTarget, proteinG, carbsG or fatG changed, or when the caller passes { record: true }; the write is try/catch'd so history is best-effort and never blocks a recalculation.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/repositories/goalHistoryRepo.ts`** — A log of every goal change / target recalculation — the same idea as weigh-in history. recordGoalChange() inserts into `goalHistory`; goalHistoryList(limit) reads back newest-first; latestGoalRecord() and deleteGoalRecord(id) exist too.  
  *Constants:* Each snapshot stores goal, rateOfChange, targetWeightKg, calorieTarget, proteinG, carbsG, fatG, tdee, bmr, basis ('mifflin' | 'katch'), atWeightKg, atBodyFatPct and notes, dated today by default. goalHistoryList defaults to a limit of 50. IMPORTANT for this area: no screen I was assigned displays goal history — the only consumer is BodyScreen, which shows the last 10 entries as '{date} · {goal label}' / '{kcal} kcal · P{n}'. It is written by ProfileScreen, EditProfileScreen and GoalsScreen (via recalcTargets) but read nowhere in this area.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/energyBalance.ts + src/repositories/energyRepo.ts`** — The daily energy-balance model: target intake vs consumed, training burn, the energy actually available after training, a goal-appropriate floor, the burn 'line' before crossing it, headroom, the eat-back amount, a four-state status and a written message. energyRepo assembles it from the goal, the day's food and that day's sessions plus walks/runs.  
  *Constants:* Floors: build_muscle holds at TDEE; lose_fat allows calorieTarget − 500; performance calorieTarget − 200; maintain and recomp calorieTarget − 300 — and never below BMR, which is back-derived as tdee / ACTIVITY_MULTIPLIERS[activityLevel] (default 1.55). Status thresholds: 'over_trained' when exercise burn exceeds the line; 'eat_more' when more than 100 kcal are left to eat; 'over_eaten' when more than 100 kcal over; else 'on_track'. trainingLoadFraction clamps burn/line to 0..1. NOTE: neither of these is used by ANY screen in this area — energyBalanceFor is consumed only by components/EnergyBalanceCard, which is rendered on SessionRecapScreen and SessionDetailScreen (the Train area). They were on my reading list but have no surface here.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/bodyComposition.ts`** — Turns weigh-in readings into every derived body figure shown on Stats, Trends and the PDF: reconciles fat mass ↔ body-fat %, derives lean mass, muscle and skeletal percentages, water, bone, protein, visceral status, BMI and its category, obesity degree, FFMI and normalized FFMI, waist-to-hip and waist-to-height, and a Katch-McArdle BMR. Derived values are never stored, so history cannot contradict itself.  
  *Constants:* FFMI = leanMassKg / heightM², normalized to 1.8 m. Katch-McArdle BMR = 370 + 21.6 × leanMassKg. Healthy total body water: male 50–65%, female 45–60%. BMI categories: <18.5 Underweight, <25 Normal, <30 Overweight, <35 Obese I, <40 Obese II, else Obese III. Obesity degree measures distance from an ideal weight taken at BMI 22. Visceral fat: ≤9 healthy, ≤14 excess, above that high. Only weightKg is required; every other input is optional and its dependants come back null.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/oneRepMax.ts`** — Estimated 1RM, used by the PR list on StatsScreen, the progression chart on ExerciseStatsScreen, the PR table in the PDF and the relative-strength term in the card rating. Both formulas were derived from sets taken TO FAILURE, so a set with a known RIR has that reserve added back to the rep count before the formula is applied.  
  *Constants:* Epley: 1RM = w × (1 + reps/30). Brzycki: 1RM = w × 36 / (37 − reps), invalid at reps ≥ 37. Epley is the default. A set logged to failure is trusted as-is; a set with a known RPE is corrected upward by its reserve; a set with neither is used raw, so no historical estimate moves unless there was unused effort data beside it. Results are rounded to 1 dp.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/data/changelog.ts`** — The in-app patch notes and the source of the app's displayed version. A ChangelogEntry array, newest first, with APP_RELEASE and APP_RELEASE_DATE derived from entry 0.  
  *Constants:* 66 entries, v2.64 (2026-08-31) down to v1.9 (2026-07-15). The `version` here is a DISPLAY release label deliberately decoupled from app.config.ts's native version, because runtimeVersion uses the appVersion policy and must stay stable for OTA compatibility — bumping the changelog ships via `eas update` without changing the runtime.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/lib/bodyType.ts and src/lib/level.ts`** — Label and blurb sources for the EditProfileScreen pickers and the Trends fat-distribution copy. bodyType also carries the BMI/WHR heuristic used at onboarding; level carries the experience prescription that shapes training elsewhere.  
  *Constants:* BODY_TYPE_LABELS: 'Ectomorph-leaning', 'Mesomorph-leaning', 'Endomorph-leaning' (EditProfile strips '-leaning' for its chips). estimateBodyType: with a WHR available, endomorph at WHR ≥ 0.95 male / 0.85 female or BMI ≥ 27; ectomorph at WHR ≤ 0.85 male / 0.75 female AND BMI < 22; else mesomorph. Without WHR: ectomorph below BMI 20, endomorph at 26 or above. EXPERIENCE_LEVELS = beginner / intermediate / advanced with LEVEL_LABELS 'Beginner' / 'Intermediate' / 'Pro'.
- **`C:/Users/fedim/OneDrive/Bureau/FitCoach/src/components/charts/ (LineChart, DualLineChart, BarChart, CalendarHeatmap)`** — The four hand-rolled charts this area depends on. LineChart and DualLineChart are react-native-svg; BarChart is flex-height Views with no SVG; CalendarHeatmap is a grid of coloured Views.  
  *Constants:* LineChart: default height 160, padding L40/R12/T12/B20, 2.5px stroke, 3px dots, a filled area at stroke+'1F', three dashed gridlines (max / midpoint / min) with 10px y-labels, and the literal empty text 'Not enough data yet'. DualLineChart: default height 180, padding L42/R10/T10/B18, expected drawn dashed (strokeDasharray '5 4', 2px) and actual solid 2.5px with dots, paths BREAK on nulls rather than interpolating, a flat series is padded by ±0.5 for readability, and a centred legend of two 14×2 swatches. BarChart: default height 160, 6px gaps, bars at 80% column width with 6px radius, minimum bar height 2, value labels at 9px shown only when > 0, labels at 10px numberOfLines 1. CalendarHeatmap: 12×12px cells, 3px gaps and radius, Monday-first leading blanks, intensity = 0.35 + 0.65 × (count/max) baked into an alpha hex suffix, and a Less → 4 swatches → More legend. None of the four is interactive.

### Notes for the redesign

THINGS A DESIGNER MUST KNOW.\n\n1. TWO LAYOUT CONVENTIONS COEXIST. Tab screens (StatsScreen, ProfileScreen) open with a bare `Text variant=\"h1\"` and hide the native header. Every pushed screen uses `options={{ title: '' }}` (back arrow only) plus a `PageHero` — EXCEPT EditProfileScreen, which is the sole screen with a real native header title (\"Edit Profile\") and no PageHero. That inconsistency is visible the moment you open it from the pencil icon.\n\n2. EVERYTHING IS SYNCHRONOUS AND RECOMPUTED ON FOCUS. There is no caching layer, no query client and no skeleton state. StatsScreen, GrowthScreen, TrendsScreen, ProfileCardScreen and AchievementsScreen all run their full computation inside useFocusEffect on the JS thread. AchievementsScreen is the worst case: achievementStats() reads sixteen tables AND runs growthReport() AND computeCardRating(). The only two loading affordances in the whole area are the literal strings `Loading…` on GrowthScreen/TrendsScreen/ProfileCardScreen/ProfileScreen.\n\n3. THE HONEST-BY-DESIGN VOICE IS LOAD-BEARING COPY, NOT DECORATION. Growth, Trends and the PDF all carry long explanatory paragraphs that state the model, its basis and its limits (\"a range, not a promise\", \"Unlogged days count as maintenance rather than being guessed\", \"Spot-reduction isn't a thing\", \"An estimate of intake, not a blood test\"). Several of these are the product's whole differentiator. Do not treat them as trimmable filler in a visual pass.\n\n4. KNOWN DEFECTS AND ODDITIES FOUND WHILE READING:\n   • StatsScreen's Volume tile and the entire PR list are hard-coded to \"kg\" regardless of the imperial unit preference. Only the Body Weight chart respects it.\n   • GrowthScreen's PageHero is theme.colors.strength in the empty state and theme.colors.accent in the populated state.\n   • GrowthScreen's bottom chart is titled \"Total hard sets per week\" but plots RAW set counts, not the proximity-weighted effective sets the rest of the screen is built on.\n   • GrowthScreen's set-progress bar silently turns warning-yellow above 20 sets because ProgressBar overrides the colour whenever progress > 1.\n   • TrendsScreen renders five section headers (\"Fat distribution\", \"Nutrition\", \"Training\", \"Rest & recovery\", \"Habits impact\") unconditionally, so an empty account sees orphan headers with nothing under them. Backward paging is unbounded, with no signal that you have walked past the start of your data.\n   • GoalsScreen calls itself an override, but any weigh-in, profile edit or even the units toggle runs recalcTargets() and silently overwrites the manual calorie/macro/water values. Only caffeineSoftLimitMg survives. A manual save also writes no goalHistory row.\n   • EditProfileScreen recalculates targets TWICE per save (updateProfile already calls recalcTargets, then save() calls recalc() again). Its birthdate field is free text validated by regex only, and its body-type control displays mesomorph as pre-selected when the profile has none.\n   • ProfileCardScreen returns silently with no message when photo-library permission is denied at pick time.\n   • ChangelogScreen renders all 66 entries — several with six paragraph-length highlights — in one un-virtualised ScrollView.\n   • src/data/achievements.ts's header comment says \"120 badges across 12 categories\"; the array actually holds 130 across 13.\n\n5. ACHIEVEMENTS ARE HALF-REAL AND THE UI SAYS SO. 90 of 130 have a data rule; 40 render as \"Unlocks when you do it — not auto-tracked yet.\" The gap is not evenly spread — category 7 (Mind, Sleep & Work Balance) has only 2 of 10 tracked, while categories 11, 12 and 13 are fully tracked. There is no achievements table: unlock state is recomputed live every time the screen opens, so a badge earned by a streak can visibly re-lock when the streak lapses, and there is no unlock date or notification anywhere. Badge art is 130 pre-rendered base64 PNGs specifically because rendering the SVGs through react-native-svg crashed the screen natively; any redesign that reaches for the raw SVGs will reintroduce that crash.\n\n6. TWO ASSIGNED FILES HAVE NO SURFACE IN THIS AREA. src/lib/energyBalance.ts and src/repositories/energyRepo.ts are consumed only by components/EnergyBalanceCard, rendered on SessionRecapScreen and SessionDetailScreen (the Train area). And src/repositories/goalHistoryRepo.ts is WRITTEN by three screens here but READ only by BodyScreen, which is not in this area — so the goal history this area generates is invisible within it.\n\n7. ADJACENT SCREENS I DID NOT SPEC. BodyScreen (src/screens/profile/BodyScreen.tsx, 341 lines) is reached from Profile → \"Body composition\" and owns weigh-in entry, the 15 circumference fields, the derived body-composition readout, the goal/pace editor with target weight, the goal history list and the measurement history. It overlaps heavily with EditProfile and Goals (all three can change the goal and trigger a recalculation) and should be redesigned alongside them even though it was assigned elsewhere. ExerciseStatsScreen is specced above but is reached only from the exercise library, never from this area.

---

## 11. The data model and the engine catalogue — src/db/* (schema, bootstrap/migrations, seed, client), all 59 src/lib/* engines, four repositories (kvRepo, weatherRepo, usageRepo, coachRepo), and scripts/verify-engines.ts

This area is the ground truth beneath every screen: one local SQLite file (`fitcoach.db`) with 41 tables — not 42, the brief's count is off by one; `grep -c "CREATE TABLE IF NOT EXISTS"` returns 42 only because the phrase also appears in bootstrap's doc comment — created idempotently at launch by src/db/bootstrap.ts and gated by `PRAGMA user_version`, currently SCHEMA_VERSION = 32. Almost nothing derived is stored: BMI, lean mass, obesity degree, FFMI, TDEE-at-a-moment, digestion clocks, rest prescriptions and growth scores are all recomputed on read by the 59 pure engines in src/lib/, so history can never contradict itself. Those engines are the app's actual product — a MET calorie model, a gastric-emptying clock, a carboxyhaemoglobin decay curve, a phosphocreatine resynthesis curve, a GPS lie-detector, an effective-reps effort model — and every one of them is pure, dependency-free and tested by scripts/verify-engines.ts, which runs 1,426 assertions and fails the build on any regression. The full 41-table column-by-column catalogue is in `notes`; there are no screens in this area, so `screens` is deliberately empty.

### Engines behind this area

- **`src/db/client.ts`** — Opens the single shared SQLite connection and wraps it in drizzle. Every repository imports `db` (drizzle) or `sqlite` (raw) from here; there is no second connection anywhere in the app.  
  *Constants:* DB_NAME = 'fitcoach.db'. Opened with `enableChangeListener: true`, which is what makes drizzle's `useLiveQuery` hook reactive — screens re-render when any write touches their tables. Exports `db`, `sqlite`, `schema`, and type `DB`.
- **`src/db/schema.ts`** — The drizzle relational schema: 41 `sqliteTable` definitions plus the string-literal unions the whole app types against. Timestamps are unix-epoch milliseconds (integer); day-granularity dates are ISO 'YYYY-MM-DD' text; booleans are integer 0/1 via `mode: 'boolean'`. Full column-by-column catalogue is in `notes`.  
  *Constants:* Exported unions a designer will see as pickers: GENDERS (male, female, non_binary, other, prefer_not_to_say); SESSION_TYPES — 9 (strength, calisthenics, cardio, outdoor, sport, martial_arts, mindbody, meditation, custom); TRACKING_TYPES — 6 (reps_weight, reps_only, duration, distance, duration_distance, custom); EQUIPMENT_TYPES — 6 (barbell, dumbbell, machine, cable, bodyweight, other); MOVEMENT_PATTERNS — 16 (horizontal_push, vertical_push, horizontal_pull, vertical_pull, squat, hinge, lunge, curl, triceps_extension, lateral_raise, calf_raise, core, carry, rotation, cardio, mobility); MEAL_TYPES — 4 (breakfast, lunch, dinner, snack); BEVERAGE_TYPES — 6 (water, coffee, tea, energy_drink, soda, other); ALCOHOL_TYPES — 5 (beer, wine, spirit, cocktail, other); HORMONE_STATUSES — 3 (low, high, monitoring); HABIT_KINDS — 2 (count, duration); COACH_CATEGORIES — 13 (training, nutrition, hydration, caffeine, recovery, activity, smoking, sleep, alcohol, cycle, health, habits, work).
- **`src/db/bootstrap.ts`** — Runtime migration. `initDatabase()` sets `PRAGMA journal_mode = WAL` and `foreign_keys = ON` (best-effort), then executes the DDL string one statement at a time — deliberately, so a single failed CREATE cannot abort the rest of the schema and white-screen the app — then runs `ensureColumns()`, then re-seeds the exercise library if `PRAGMA user_version < SCHEMA_VERSION`. No drizzle-kit migration bundles ship; the runtime DDL IS the migration. Guarded by an in-memory `initialized` flag so it is safe to call repeatedly.  
  *Constants:* SCHEMA_VERSION = 32. 41 CREATE TABLE statements, 36 CREATE INDEX statements. ADDED_COLUMNS holds 50 `ALTER TABLE ADD COLUMN` entries applied only when `PRAGMA table_info` shows the column missing, each wrapped in try/catch that only console.warns. Documented version history: 8→9 (v2.8, +111 exercises), 9→10 (v2.9, +124), 10→11 (v2.11, +27 tactical/heritage), 11→12 (v2.12, +2), 12→13 (v2.14, +30 grip/calisthenics/wellness), 13→14 (v2.15, +7 quick-counter), 14→15 (v2.18, live_walks.boot_step_baseline), 15→16 (v2.20, sessions.steps_added/distance_added_m), 16→17 (v2.22, custom_foods), 17→18 (v2.23, set_entries.to_failure), 18→19 (v2.26, +23 shoulder), 19→20 (v2.27, supplement pill counts), 20→21 (v2.28, smoking_entries.product_key + 10 triceps), 21→22 (v2.29, daily_challenges), 22→23 (v2.30, meal_routines), 23→24 (v2.34, supplement_logs.food_entry_id), 24→25 (v2.37, weather_readings), 25→26 (v2.38, custom_foods.components_json/micros_json), 26→27 (v2.44, food_entries.form + custom_foods.form), 27→28 (v2.45, users.experience_level), 28→29 (v2.46, sessions.warmups_done), 29→31 (v2.54, app_kv + custom_foods.source), 31→32 (v2.64, +163 exercises and an authored difficulty on every entry). Version 30 is BURNED — it was used by v2.52, reverted in v2.53; databases that briefly reached it carry a few unused live_walks columns nothing reads, and the number is never reused.
- **`src/db/seed.ts`** — `seedExerciseLibrary()` upserts EXERCISE_LIBRARY into the `exercises` table. It must never delete-and-reinsert: `exercise_logs.exercise_id` points at these rows by id, so wiping the table would orphan every workout ever logged. Matches an existing row by `slug` first, then falls back to lowercased `name` for pre-slug databases (so they adopt the slug instead of duplicating). Rows no longer in the library are left untouched, never deleted. Custom user exercises are never touched.  
  *Constants:* Name-fallback matching is restricted to rows with `isCustom = false` — a user's own "Burpees" must never be silently converted into the built-in one and have its isCustom flipped. Payload writes 15 fields including `muscleGroups` and `instructions` as JSON strings and `iconKey` from the library's `icon`.
- **`src/lib/date.ts`** — The date vocabulary the entire app speaks. Every 'day' value everywhere is ISO 'YYYY-MM-DD' in LOCAL time — `toISODate` builds it from getFullYear/getMonth/getDate, never from toISOString, so a late-evening log never lands on tomorrow. `fromISODate` parses back to a local-midnight Date. Exports: toISODate, todayISO, addDays, fromISODate, daysBetween, startOfDayMs, daysAgoISO, lastNDates, startOfWeek, ageFromBirthdate.  
  *Constants:* `daysBetween(a,b)` = Math.round((a−b)/86,400,000) whole days. `lastNDates(n)` returns n dates oldest-first INCLUDING today. `startOfWeek` is Monday-based: `dow = (getDay()+6) % 7`. `ageFromBirthdate` returns 30 when birthdate is null — a silent default a designer should know about, because a profile with no birthdate still produces a BMR.
- **`src/lib/format.ts`** — Display formatting and unit conversion. The rounding helpers exist because summing a day of food entries in binary floating point lands on things like 419.8000000000002 — correct to fifteen decimals and unshowable — so totals are cleaned at the point they stop being intermediate. Exports: roundTo, roundKcal, roundGrams, formatDuration, formatDurationLong, kgToLb, lbToKg, cmToFtIn, formatWeight, formatDistance, formatPace, formatCalories, clamp, fmtNum, round.  
  *Constants:* kg↔lb factor 2.2046226218; cm→in ÷2.54; miles = m/1609.344; imperial pace multiplies s/km by 1.609344. roundKcal = whole numbers. roundGrams = 1 decimal. formatDuration gives 'h:mm:ss' above an hour else 'm:ss'; formatDurationLong gives '1h 20m' / '45m' / '30s'. formatDistance metric: '2.35 km' at ≥1000 m else '850 m'; imperial: miles at ≥0.1 mi else yards. formatPace returns '—' for null/zero/non-finite. formatWeight is 1 decimal + ' kg'/' lb'. fmtNum defaults to 2 decimals, strips trailing zeros and normalises −0 to 0.
- **`src/lib/time.ts`** — Time-of-day helpers for range logging — sleep bedtime→wake, work start→end. Times are 'HH:MM' 24-hour strings. Exports: parseHM, hmToMinutes, rangeMinutes, minutesToHM, minutesToHours, makeHM.  
  *Constants:* parseHM regex `^(\d{1,2}):(\d{2})$`, rejects h>23 or m>59 (returns null). `rangeMinutes` wraps past midnight: if end−start < 0 it adds 24×60, so 23:30→07:00 is 450 min. minutesToHM: '2h 15m' / '2h' / '45m'. minutesToHours rounds to 2 decimals. makeHM clamps h to 0–23 and m to 0–59 and zero-pads.
- **`src/lib/progressBar.ts`** — Draws a text progress bar out of block characters for Android notifications, because expo-notifications does not expose the native notification progress bar. Renders identically on every device, updates in place with the body text, needs no native module. Exports: progressBar, progressBarWithPct.  
  *Constants:* FILLED = '█', EMPTY = '░'. Default width = 12 characters. Fraction is clamped 0…1 and non-finite reads as 0. progressBarWithPct appends ' 62%' (Math.round of fraction×100).
- **`src/lib/geo.ts`** — Route geometry for GPS tracking. `haversine` great-circle distance in metres; `routeDistanceM` sums segments; `normalizeRoute` projects a lat/lng route into 0..1 x/y for drawing the circuit-map shape, preserving aspect ratio (both axes share one scale), centring the shape in the unit box and flipping latitude so north is up; `parseRoute` safely reads the stored JSON, filtering to well-formed 2-element tuples and swallowing malformed JSON.  
  *Constants:* Earth radius R = 6,371,000 m. Metres-per-degree constant 111,320, with longitude corrected by cos(midLat). normalizeRoute returns null if fewer than 2 points, or if both spans are under 1 m (essentially stationary) — that null is what the UI must render as 'no route'. Min/max are found by an explicit loop rather than Math.min(...spread) because a route of thousands of fixes overflows the Hermes call stack when spread.
- **`src/lib/met.ts`** — MET-based calorie burn. The central identity is kcal = MET × 3.5 × weightKg / 200 × minutes. The important distinction is gross vs NET: `netCaloriesFromMet` uses (MET − 1) because a MET of 1 is sitting still and the calorie target already covers resting metabolism through TDEE — crediting gross double-counts roughly 1 MET × time (about 85 kcal per hour at 80 kg) and quietly corrupts the energy-balance and over-training maths. Also holds the walking/running MET curve and the grade adjustment.  
  *Constants:* SESSION_TYPE_MET fallbacks: strength 5, calisthenics 6, cardio 7, outdoor 9, sport 7, martial_arts 9.5, mindbody 3, meditation 1.3, custom 4. walkRunMet by km/h: ≤0 → 2.0; <4 → 2.8 (slow walk); <5.5 → 3.5 (moderate walk); <6.5 → 5.0 (brisk); <8 → 7.0 (very brisk/jog); <9.7 → 9.0; <11.3 → 10.5; <12.9 → 11.5; else 12.8. gradeMultiplier: +8% energy per 1% incline, −3% per 1% decline, clamped to 0.85–2.5. walkCalories falls back to steps × 0.03 × (weightKg/70) when there is no usable distance, and to netCaloriesFromMet(2.8, …) when there is only time. `activeSec` (moving time, paused/vehicle stretches removed) is used for both the pace and the duration so a paused session does not read as slower and pick a lower MET.
- **`src/lib/calories.ts`** — The calorie and macro calculator — the single source of every target number in the app. Pipeline: BMR (Katch-McArdle when measured lean mass exists, else Mifflin-St Jeor) → TDEE (activity multiplier) → goal offset → macro split. Also holds dynamic TDEE refinement from real trend data, the water heuristic and the fibre target. All the goal-picker copy lives here.  
  *Constants:* ACTIVITY_MULTIPLIERS: sedentary 1.2, light 1.375, moderate 1.55, active 1.725, very_active 1.9. Mifflin: 10·kg + 6.25·cm − 5·age, +5 male / −161 female. Katch-McArdle: 370 + 21.6 × leanMassKg. goalOffsetPct — lose_fat −12/−17/−22%, build_muscle +8/+12/+15%, recomp −3/−7/−10%, performance 0/+3/+5%, maintain 0 (slow/moderate/aggressive). calorieTarget = max(bmr, tdee × (1+offset)) — never prescribes below BMR. Protein per kg by goal: maintain 1.8, lose_fat 2.2, build_muscle 2.0, recomp 2.4, performance 1.8; anchored to lean mass × 1.15 when bodyFatPct is between 0 and 60. Fat share of calories: 25% for lose_fat and recomp, 22% for performance, 28% otherwise; carbs are the remainder, floored at 0. refineTDEE: needs ≥10 days, uses 7700 kcal/kg, blends 0.6 × implied + 0.4 × formula, clamped to ±25% of formula TDEE. recommendedWaterMl = max(2000, round(kg × 35 / 50) × 50). FIBRE_G_PER_1000_KCAL = 14, FIBRE_MIN_G = 25. GOAL_ORDER is fixed: lose_fat, maintain, build_muscle, recomp, performance — new goals go last, never in the middle. GOAL_LABELS, GOAL_BLURBS and GOAL_NOTES carry the exact picker copy, including the deliberately unglamorous recomp note.
- **`src/lib/effort.ts`** — How hard a set actually was, and what that means for growth — the 'effective reps' model. Deliberately refuses to simply reward failure: for hypertrophy, closer to failure is modestly better on a continuous curve, but for strength, failure is not better and may be worse (disproportionate fatigue, fewer reps in following sets, degraded technique). The exception is light high-rep work, where proximity stops being a matter of degree. A logged 'to failure' outranks RPE because people round RPE but do not tick the box by accident.  
  *Constants:* FAILURE_RIR = 0, STIMULATING_REP_WINDOW = 5, HARD_SET_MAX_RIR = 4, NO_STIMULUS_RIR = 8, LOW_LOAD_REP_THRESHOLD = 15 reps, FAILURE_OVERUSE_SHARE = 0.6. hardSetCredit: 1.0 at RIR ≤4, linear taper to 0 at RIR 8, and 1.0 (full credit) when effort is UNKNOWN — so no existing history deflates. effortScore bands by avgRir: ≤3 → 100, ≤4 → 85, ≤5 → 65, ≤6 → 45, else 25; minus 15 if failureShare > 0.6; returns null when knownShare < 0.25. RPE_SCALE is 6 rows with exact copy: 10 'failure' / 9 '1 left' / 8 '2 left' / 7 '3 left' (all productive), 6 '4 left' / 5 '5+ left' (not productive). proximityLabel renders 'to failure', '1 left', or 'N left', and '' when unknown. effectiveSets is rounded to 2 decimals, not 1, because it is divided by 4 for weekly averages and summed across a month.
- **`src/lib/subMuscle.ts`** — Resolves the sub-muscle an exercise emphasises. Only ~100 built-in exercises carry an explicit `subMuscle`; for the rest it infers one from the exercise NAME plus its primary muscle, so every exercise can indicate a region and the library can group a muscle's exercises by it. Explicitly documented as a best-effort hint, never presented as gospel. Exports: subMuscleOf, subMusclesFor.  
  *Constants:* Inference tables by primary muscle — chest → upper_chest ('incline','decline push','pike') / lower_chest ('dip','decline','pseudo','lower','crossover') / else mid_chest; triceps → triceps_long ('skull','overhead','french','extension', and the default) / triceps_lateral ('pushdown','kickback','diamond','press-down'); biceps → brachialis ('hammer','reverse') / biceps_short ('preacher','concentration','spider') / else biceps_long; forearms → wrist_extensors / wrist_flexors / brachioradialis / grip (default); quads → rectus_femoris ('extension','sissy','step', default) / vastus ('hack','press','squat','lunge','split','pistol','shrimp'); hamstrings → hamstrings; glutes → glute_med ('abduction','band walk','clam','medius','lateral') / else glute_max; calves → soleus ('seated','soleus') / else gastrocnemius; back → traps / lower_back / mid_back / lats (default); shoulders → side_delt / rear_delt / else front_delt; core → obliques / lower_abs / upper_abs (default). Anything else returns null. subMusclesFor returns distinct values in first-seen order.
- **`src/lib/achievementRules.ts`** — Progress rules for achievements derivable from stored data. Each rule maps an achievement id to {current, target}; unlocked = current ≥ target. Achievements without a rule are 'criteria-based' (event-driven or not yet tracked, e.g. exporting a PNG card) — they still render with badge and criteria but are explicitly marked as not auto-tracked, so nothing is faked.  
  *Constants:* 90 rules of 130 achievements; TRACKED_ACHIEVEMENT_COUNT = Object.keys(RULES).length = 90. Sample targets a designer will render: app-open streak 3 / 7 / 14 / 30 / 100 / 365; card overall ≥70; first routine 1; first PR 1; 10 sets in a week; 10,000 kg max session volume. `AchievementProgress` carries current, target, unlocked, tracked.
- **`src/lib/activitySteps.ts`** — Turns an on-foot activity (a run, hike, logged outdoor session) into an approximate step count so it can feed the daily step total, the way phones fold a tracked run into steps. It only does the maths — the CALLER decides whether an activity is on foot, because cycling, swimming and rowing cover distance without steps.  
  *Constants:* RUN_SPEED_KMH = 7 — at or above this the gait is treated as running for stride and cadence. Height defaults to 170 cm when unknown. Returns {steps, distanceM, mode}, where distanceM is the given distance or, when only time is known, the distance derived back from the estimated steps.
- **`src/lib/aiFood.ts`** — Turns a vision model's answer about food into numbers the app is willing to store. Nothing the model returns is trusted on arrival: shape is rejected rather than coerced, macro mass in 100 g cannot exceed 100 g, calories must agree with the model's own macros under Atwater (and when they disagree the MACROS win and calories are recomputed), and an absurd micronutrient value is dropped one key at a time rather than poisoning the profile. What survives is stored per 100 g. Also owns the OpenRouter model routing and the JSON extraction that copes with chatty replies.  
  *Constants:* MAX_PORTION_G = 2000, MIN_PORTION_G = 1, MAX_ITEMS = 12, ENERGY_TOLERANCE = 0.25 (25%), MICRO_SANITY_MULTIPLE = 40 (× RDI before a key is dropped), MAX_ROUTE_MODELS = 3. DEFAULT_MODEL = 'minimax/minimax-m3:free' with a FALLBACK_MODELS list and EXCLUDED_MODEL_PATTERNS; `isUsableVisionModel` filters out models that cannot describe an image. `firstBalancedJson` / `extractJson` recover a JSON object from prose.
- **`src/lib/alcohol.ts`** — Standards-based alcohol model: pure-ethanol mass from volume × ABV × density, energy at 7 kcal/g, standard drinks, peak BAC by Widmark with elimination, an hours-to-sober estimate, a plain-language BAC label and a recovery penalty from the last 24 h. Also the five drink presets that drive the log form.  
  *Constants:* ETHANOL_DENSITY = 0.789 g/ml; KCAL_PER_G_ALCOHOL = 7; STD_DRINK_G = 10 (WHO), US_STD_DRINK_G = 14; WEEKLY_LOWRISK_G = 100. Widmark r ≈ 0.68 male / 0.55 female, β ≈ 0.015 %/hour. ALCOHOL_PRESETS (volume ml / ABV% / ABV range / carb g-per-ml): beer 330 / 5 / 3–9 / 0.036; wine 150 / 12 / 9–25 / 0.026; spirit 45 / 45 / 30–60 / 0.0; cocktail 200 / 12 / 5–30 / 0.09; other 200 / 10 / 0–60 / 0.03.
- **`src/lib/bodyComposition.ts`** — The body-composition engine, built on a strict INPUT/DERIVED separation. Inputs are what you measured (scale readings + tape). Everything else — BMI, fat weight, lean mass, percentages, obesity degree, waist ratios, FFMI, Katch BMR — is computed here and NEVER stored, so history cannot contradict itself. Also supplies MEASUREMENT_FIELDS, the labelled+grouped list the measurement form renders from.  
  *Constants:* katchMcArdleBMR = 370 + 21.6 × leanMassKg. FFMI = leanMassKg / heightM², normalised to 1.8 m. Exports bmiOf, bmiCategory, obesityDegree, visceralStatusOf (healthy / excess / high — the schema comment puts the healthy visceral rating at ≤9 on a ~1–59 scale), bodyFatCategory(pct, sex), ffmiCategory(nFFMI, sex). computeBodyComp is the single entry point returning the whole derived BodyComp object.
- **`src/lib/bodyType.ts`** — A lightweight, transparent BMI + waist-to-hip heuristic that guesses ectomorph/mesomorph/endomorph. Used ONLY to bias initial calorie/macro/training defaults; it refreshes as real trend data arrives and is explicitly never presented as a clinical measurement.  
  *Constants:* bmi = kg / m². Exports BODY_TYPE_LABELS ('Ectomorph-leaning' / 'Mesomorph-leaning' / 'Endomorph-leaning' — note the hedged wording) and BODY_TYPE_BLURB with the exact one-line copy for each. `bodyTypeCarbBias` returns the carb multiplier applied downstream.
- **`src/lib/challengeWheel.ts`** — Decides which challenges today's wheel shows and which one it lands on. The critical design point: BOTH the segments and the winner are derived from the DATE, not from the spin — the animation is a reveal, not a lottery. Close the app, reopen it, change the clock, and the same day gives the same answer, which is the only thing that makes completing a challenge mean anything. Being a pure function of (date, eligible set) is also what makes it testable without a database.  
  *Constants:* WHEEL_SIZE = 8 segments. `hashSeed` is FNV-1a 32-bit (offset 2166136261, prime 16777619, `>>> 0` to keep it unsigned because Math.imul can return negatives) — identical on every device and JS engine. `wheelRotationDeg(winningIndex, segmentCount, turns = 5)`. `eligibleChallenges` filters by which optional features are switched on so the wheel never offers the impossible, and `recentKeys` keeps recently-completed challenges off it. Returns null when nothing is eligible.
- **`src/lib/composedFood.ts`** — A meal built from other foods with quantities — 'my Friday couscous'. The one decision that matters: each component is a SNAPSHOT of the source food's macros and micros at the moment it was added, already scaled by its servings — not a reference. The catalogue ships with the app and is replaced on every update, so a recipe holding ids would drift when numbers were corrected or break outright if an id disappeared. The composed food's own totals are the sum of its components, stored on the row and kept in sync on every edit, so logging one is exactly as cheap as logging any other food.  
  *Constants:* `describeComponents(components, max = 4)` builds the summary line. `wouldCreateCycle(candidateId, path)` prevents a composed food containing itself. FoodComponent carries sourceId (catalogue id, 'custom:<n>', or null for a free-typed line — display only), name, servingSize, servings, calories/proteinG/carbsG/fatG/fiberG, micros, and form so a dish of only drinks can default to liquid.
- **`src/lib/conditions.ts`** — The chronic-condition catalogue. Selecting a condition surfaces general, non-diagnostic considerations in reports and coach tips and flags them for a nutritionist or coach. The file states plainly that this is educational context only, not medical advice, and always defers to the user's clinician.  
  *Constants:* 8 categories: metabolic, cardiovascular, respiratory, musculoskeletal, hormonal, digestive, mental, other. Each ConditionDef carries key, label, category and a one-paragraph `consideration` rendered verbatim (e.g. hypertension: 'Avoid breath-holding (Valsalva) on heavy lifts…'). Exports CONDITION_CATALOGUE, findCondition, CONDITION_CATEGORY_LABEL.
- **`src/lib/cycle.ts`** — Menstrual-cycle model — computes day-of-cycle, phase, next period date, ovulation date and fertile window from last period start + average lengths, and maps phases to how oestrogen and progesterone tend to influence energy, strength and recovery. Explicitly general and educational, not medical advice.  
  *Constants:* Cycle length clamped to 21–40 days (default 28); period length clamped 2–10 (default 5). Four phases: menstrual, follicular, ovulation, luteal. dayOfCycle is 1-indexed and handles multiple elapsed cycles via modulo. PHASE_GUIDANCE holds the per-phase training/nutrition copy; CYCLE_SYMPTOMS is the symptom chip list for the period log.
- **`src/lib/dietPlan.ts`** — Generates a day of meals from FOOD_DB that lands close to the user's calorie and macro targets. Deterministic for a given seed — change the seed and the same targets produce a different combination of foods — so a plan can be reproduced. Favours whole foods and protein sufficiency first, then fills carbs and fats around them. Explicitly a suggestion engine, not a prescription.  
  *Constants:* 5 diet styles, each with label and blurb: balanced, high_protein, low_carb, vegetarian, mediterranean. Configurable number of meals. PlanTotals extends the calorie/protein/carbs/fat target with `fiber`, so the plan can show whether it feeds you enough of it.
- **`src/lib/digestion.ts`** — The gastric-emptying clock — how long after eating until it is comfortable and safe to train. Modelled as a stomach LOAD that stacks across meals rather than a per-meal timer: dR/dt = −(B + K·R)/s, where s is the meal's 'slowness' (1.0 for a lean carbohydrate meal, up to ~2 for a fatty one, blended by weight when meals stack). Fat is the biggest brake, protein moderate, fibre adds bulk; liquids are a genuinely different case and run about twice as fast with a much shorter settle.  
  *Constants:* EMPTY_BASE_KCAL_PER_MIN = 2.0; EMPTY_RATE_PER_KCAL = 0.004; MIN_MEAL_KCAL = 20; MAX_WAIT_MIN = 300. READY_THRESHOLD_KCAL by intensity: light 500, moderate 260, hard 180. SETTLE_MIN (solid): light 0, moderate 20, hard 30. LIQUID_SETTLE_MIN: light 0, moderate 10, hard 15. LIQUID_SPEED = 2, MIN_SLOWNESS = 1/LIQUID_SPEED = 0.5. Three intensities (light/moderate/hard) with INTENSITY_LABEL copy; `intensityForSessionType` maps a session type to one. Exports stomachLoad, drain, minutesToDrain, digestionMinutes, digestionStatus, currentDigestion, formatWait, mealsFromEntries.
- **`src/lib/eatenAt.ts`** — Answers 'when was the meal actually finished?'. The digestion clock reads a diary row's `createdAt` as the moment eating ended — right when you log as you finish, wrong when you log lunch at 15:00 because you forgot at 13:00, where the clock would hold you back for two hours you have already waited. Turns the log form's answer into the timestamp to store, with 'just now' as the default that keeps the one-tap flow.  
  *Constants:* EATEN_AT_PRESETS — exactly 5 chips: 'Just now', '15 min ago', '30 min ago', '1 h ago', '2 h ago'. `parseHHMM` accepts '13:40', '13h40', '13.40' and bare '1340', rejecting h>23 / min>59. `resolveEatenAt(choice, dateISO, now)` returns undefined for 'now' (so nothing is written), and `clockOf(ms)` renders the stored time back.
- **`src/lib/energyBalance.ts`** — The day's energy balance and the over-training line: what you ate, what you burned training, what is left to eat, and where the line is before extra training starts working against the goal. The honest bit is stated in the file — the calorie target is already TDEE-based so it assumes a baseline of daily activity; logged TRAINING burn is treated as on top of that, making the numbers lean conservative, which is the safe direction for a warning. A hard floor protects either way: available energy (eaten minus trained off) must never drop below a goal-appropriate minimum and never below BMR.  
  *Constants:* Four statuses: eat_more, on_track, over_eaten, over_trained. The on_track band is ±100 kcal of target — leftToEat > 100 is 'eat_more', < −100 is 'over_eaten'. lineKcal = max(0, consumed − floor); headroom = max(0, line − exercise); over = exercise − line, and any positive `over` forces status over_trained regardless of the ±100 band. restoreKcal = how much to eat back to return available energy to the floor. `trainingLoadFraction` gives the 0→line gauge, clamped 0..1. Each status produces goal-specific message copy (build_muscle, lose_fat and a generic branch all read differently).
- **`src/lib/exerciseAlternatives.ts`** — 'This one's too hard — find me an easier alternative.' The matching is deliberately STRICT, and the file explains why the first version was wrong: accepting any shared muscle group meant a bench press (which lists triceps) could be offered as a swap for a triceps extension, and a rear-delt fly could be traded for an overhead press — the exact substitution that builds the imbalance the rear-delt work existed to fix. A candidate must now share the PRIMARY muscle, full stop; sharing the sub-muscle ranks higher. If nothing suitable exists the answer is an empty list rather than a plausible-looking wrong one.  
  *Constants:* MatchQuality is 0 | 1 | 2 — 2 = same sub-muscle, 1 = same primary muscle only, 0 = no match (excluded). `estimateDifficulty` scores from an EQUIP_BASE table plus name cues (bodyweight skill work scales enormously). Note this is the older name-based difficulty estimate and is now largely superseded by lib/exerciseDifficulty.
- **`src/lib/exerciseCalories.ts`** — Per-exercise calorie attribution. The old model burned one flat session-type MET across a whole session, so MET-11 jump rope and MET-3 stretching in the same session looked identical. This estimates each exercise's active seconds, normalises those shares to span the whole session duration (so rest and transitions are not lost) and values each share at that exercise's own MET. When every exercise shares one MET it reduces EXACTLY to the old flat estimate, so pure-strength sessions see no drift. Attribution uses NET calories; the library's 'what does this movement cost' reference stays gross, because there it is a standalone Compendium figure rather than something added to a daily budget.  
  *Constants:* SECONDS_PER_REP = 3 for reps-tracked movements. Rest between sets is paid at its own rate, not the exercise's: REST_MET_FLOOR = 2, REST_MET_PEAK = 4, REST_EPOC_TAU_S = 90 — `restMetFor(avgRestSeconds)` decays from peak toward floor as rests lengthen. `caloriesForReference(met, weightKg, minutes = 10)` is the library's gross per-movement reference. Also exports setEnergyFactor, activeSecondsFor, weightedActiveSecondsFor, completedSetCount, distributeSessionCalories.
- **`src/lib/exerciseDifficulty.ts`** — A five-point authored difficulty on every exercise, replacing the old regular-expression guess from the exercise NAME ('advanced' in the title made it hard, 'assisted' made it easy) — a fine trick for finding an easier alternative and a poor foundation for anything else, since a pistol squat and a bodyweight squat are the same word plus one. Resolution order: an authored value wins; otherwise a named skill overrides (no rule will ever derive that a human flag is harder than a lateral raise); otherwise equipment sets a floor and movement pattern adjusts it.  
  *Constants:* Scale of 5 with explicit meanings — 1 anyone, first session (glute bridge, wall push-up); 2 teachable in one session (goblet squat, lat pulldown); 3 the standard gym movement, most of the library (bench, squat, barbell row); 4 real strength or months of skill (weighted dip, pistol squat, wall handstand push-up); 5 an advanced skill most people never own (muscle-up, front lever, planche, one-arm pull-up). LEVEL_BAND — beginner [1,3], intermediate [2,4], advanced [2,5]; bands OVERLAP deliberately and nothing is ever hidden, this decides what is offered first. LEVEL_IDEAL — beginner 2, intermediate 3, advanced 4. levelFit = max(0, 1 − gap × 0.28), used for ordering not filtering. levelNote returns null when it fits, else exact copy: 'Harder than a beginner should start with — build to it.' / 'A step beyond your level; treat it as a goal rather than a staple.' / 'Easier than your level needs — useful as a warm-up.' Also exports DIFFICULTY_LABELS and DIFFICULTY_BLURBS.
- **`src/lib/fasting.ts`** — Two fasting modes. Ramadan: fast from Fajr (suhoor end) to Maghrib (iftar), with the window taken from the prayer calculator when configured and from manual times otherwise. Intermittent: eat inside a daily window (e.g. 16:8), fast outside it. `fastingState` returns whether you are fasting, what is next and how far through the current phase you are.  
  *Constants:* FastingState fields: fasting, nextLabel ('iftar' when fasting, 'fast start' when eating), nextTime, minutesUntilNext, window, progress 0..1. FASTING_TRAINING_TIPS is a fixed list rendered verbatim. Manual defaults come from the fasting_profiles row: suhoor 04:00, iftar 19:00, eating window 12:00–20:00.
- **`src/lib/foodMatch.ts`** — Matches a free-text name to a food already in the catalogue. The point is that a match means the entry gets CURATED macros and micronutrients instead of a model's estimate, and it keeps the food database from filling with near-duplicates. Existing pickers search with `name.includes(query)`, which fails on everything a model actually says — word order, plurals, accents, and cooking words the catalogue spells differently ('chicken breast, grilled' vs 'grilled chicken breast') — so matching here is by TOKENS and scored, letting a caller insist on a good match and otherwise fall back.  
  *Constants:* MATCH_MIN_SCORE = 0.75. A 24-word STOPWORD list is dropped before comparing (a, an, the, of, with, and, in, on, or, plain, fresh, homemade, style, served, side, piece, pieces, slice, slices, portion, serving, some, small, large, medium) — but the cooking method ('grilled', 'fried') is deliberately KEPT because it genuinely changes the food. normaliseFoodName strips diacritics via NFD. Splits tokens into core vs qualifier for scoring. Tested against the real catalogue in verify-engines, so a match that regresses fails the build.
- **`src/lib/foodMath.ts`** — Derives a food's calories from its macros so a custom food can be logged from a label that prints only protein/carbs/fat, or from nothing at all for home cooking. Atwater arithmetic with one refinement that matters: fibre is counted inside total carbohydrate on a label but yields roughly 2 kcal/g rather than 4, so treating it as ordinary carbohydrate over-states high-fibre foods (lentils, avocado) by 12–16%.  
  *Constants:* KCAL_PER_G_PROTEIN = 4, KCAL_PER_G_CARB = 4, KCAL_PER_G_FAT = 9, KCAL_PER_G_FIBRE = 2. The accuracy is MEASURED, not assumed, against all 305 real foods in the database (re-run by verify-engines): plain 4/4/9 on total carbs → 81% of foods within 10%, 90th-percentile error 12.2%; fibre discounted to 2 kcal/g → 97% within 10%, 90th-percentile error 7.1%. That is why the UI can honestly label a derived figure 'estimated' and say how close it usually lands. Exports caloriesFromMacros, macroEnergyShares, resolveCalories, parseAmount, isCompleteCustomFood.
- **`src/lib/gpsFilter.ts`** — The GPS lie-detector — decides which fixes are real movement. Two real-world situations produce distance that never happened: a small closed space, where the receiver falls back to cell/Wi-Fi trilateration and wanders by tens of metres with an honest 30–60 m accuracy attached (a phone on a desk can 'cover' a kilometre overnight); and turning on the spot, where the antenna moves a body-width and multipath scatters consecutive fixes. Three independent gates, cheapest first, all of which a fix must clear: accuracy, Doppler speed (measured from carrier phase shift, not position differencing, so it stays near zero while you spin — the single most honest 'am I going somewhere' signal), and confinement.  
  *Constants:* MAX_ACCURACY_M = 50 (raised from 30, which silently dropped EVERY fix of an urban walk — measured on a 400 m block loop at 35 m accuracy: 0 m before, 356 m after, with phantom pacing distance unchanged). ASSUMED_ACCURACY_M = 15 when the receiver reports none. ACCURACY_SLACK = 0.75; VAGUE_ACCURACY_M = 25 above which VAGUE_SLACK = 1.5 applies instead (above 1, so a vague fix must prove it moved further than its own error bar). MIN_SEGMENT_M = 4 absolute floor. CONFINEMENT_WINDOW = 5 recent points — the smallest window where wandering is still distinguishable from walking, kept short because every fix it waits for is phantom distance banked. CONFINEMENT_RADIUS_M = 15. STRAIGHTNESS_MIN = 0.35 (net displacement ÷ path length). Exports filterFixes, segmentGateM, spreadRadiusM, pathLengthM, straightness, isConfined, totalRejected, and a RejectReason union for per-reason counts.
- **`src/lib/growth.ts`** — Per-muscle 'growth readiness'. The file is explicit that an app cannot measure hypertrophy — what it can do is measure how well logged behaviour matches the conditions research ties to growth, and report that transparently. Six inputs: volume (hard sets per muscle per week, weighted by proximity to failure via lib/effort), effort (0–3 RIR band), overload (volume/load trending up), frequency/rest (~2×/week, 48–72 h), protein (~1.6–2.2 g/kg/day) and sleep (7–9 h). Natural rate-of-gain ranges are population averages (McDonald / Aragon models) and are always shown as ranges, never as a promise.  
  *Constants:* OPTIMAL_SETS_MIN = 10, OPTIMAL_SETS_MAX = 20; the volume score is 0 at 0 sets, full inside the 10–20 band and tapers above 24 (junk volume), measured in EFFECTIVE sets. Four statuses: growing, maintaining, under-stimulated, overreached — with GROWTH_STATUS_LABEL and GROWTH_STATUS_COLOR maps. MuscleGrowthScore returns score 0..100 plus volumeScore, overloadScore, recoveryScore, effortScore (null when there is not enough effort data — the UI hides it), setsThisWeek, avgSetsPerWeek4w, effectiveSetsThisWeek, avgEffectiveSetsPerWeek4w, avgRir, failureSharePct, overloadTrendPct and notes[]. Gates: proteinOk, sleepOk, calorieOk (not in a harsh deficit).
- **`src/lib/habits.ts`** — A generalised 'habit I want to change' tracker with four stated design principles: honest not moralising (where popular claims are NOT supported by research the app says so rather than inventing scary numbers to drive engagement), your data over generic claims (the headline impact is the correlation with your own logged sleep and training), time as the honest common currency (measurable, never judgmental), and no shame (streaks encourage, relapse just restarts a counter).  
  *Constants:* Two kinds: count (occurrences) and duration (minutes). Each HabitDef carries key, label, kind, icon, colour, unit, defaultMinutesPerOccurrence, defaultDailyTarget, blurb and an `evidence` string shown VERBATIM in the app. HABIT_TRIGGERS is a 7-chip list: stress, boredom, loneliness, tired, late night, habit, celebration. `projectedYearHours(weekMinutes)` and `timeEquivalents(yearHours)` produce the 'that is N books / N flights' framing.
- **`src/lib/hormones.ts`** — The hormone reference catalogue — for each hormone, what it does, what raises or lowers it, the signs of running low or high, and practical lifestyle levers. Explicitly educational only: the file states the app cannot measure hormones, this is not a diagnosis and not a substitute for lab work; the user flags what they are low/high in or monitoring so guidance is relevant to them.  
  *Constants:* 7 categories: anabolic, metabolic, stress, thyroid, sleep, appetite, reproductive. Each HormoneDef has key, label, category, a one-line `role`, `raisedBy[]` and `loweredBy[]`. HORMONE_STATUS_LABEL covers the three statuses stored on hormone_flags (low, high, monitoring).
- **`src/lib/level.ts`** — Experience level — beginner, intermediate, advanced — and exactly what it changes. The premise is that the same split day is not the same session for a first-year and a tenth-year lifter. It shapes three things and touches no logged data: how many of a split day's or method's exercises are pre-loaded (lists are compounds-first, so trimming keeps the ones that matter), the sets × reps prescription shown with the session, and the rest between sets (via restPrescription).  
  *Constants:* LEVEL_LABELS render as 'Beginner' / 'Intermediate' / 'Pro' — note advanced displays as 'Pro'. LEVEL_PRESCRIPTION: beginner maxExercises 4, 3 sets × 8–12 (compounds 5–8), rest '~1.5–2 min (the app times it per set)'; intermediate maxExercises Infinity, 3–4 sets × 6–12 (compounds 4–8), rest '~2–3 min on compounds, 1–1.5 on isolation'; advanced maxExercises Infinity, 4–5 sets × 5–12 (compounds 3–6), rest '~3–5 min on heavy compounds, 1.5–2 on isolation'. Each carries a `progression` line rendered verbatim. `slugsForLevel` first drops slugs outside the level's difficulty band, but ONLY if at least min(3, list length) survive — a thin day of movements you can do beats a full one you cannot — then trims by count. `levelOrDefault` reads NULL as 'intermediate', so nothing changes until the user picks.
- **`src/lib/loadProfile.ts`** — What 'load' means for every exercise — the variable the calorie engine, the 1RM maths and the set form all need to treat each movement as itself. Four load modes: external (the weight IS the load), added (bodyweight movements taking extra weight; negative means band or machine ASSISTANCE), carried (the load rides on you — ruck, farmers carry, sled, vest — and energy cost scales with it), and none (yoga, breathwork, sprints, rounds — no meaningful load to log).  
  *Constants:* bwFraction comes from force-plate studies (Ebben 2011 and similar): push-up ~64% of bodyweight, from the knees ~49%, feet elevated ~74%; pull-up ~96% (forearms stay on the bar); dip ~96%; bodyweight squat ~85% (shanks stay put); hip thrust / glute bridge ~50–55%; calf raise ~95%. So '8 weighted pull-ups +20 kg at 80 kg bodyweight' resolves to 0.96 × 80 + 20 ≈ 97 kg. Carrying X% of bodyweight costs ≈ X% more (a 20 kg pack at 80 kg ≈ +25%). LOAD_FIELD_LABEL gives the per-mode label for the weight field (null for 'none', which hides it). Slugs not in LOAD_PROFILES fall back by pattern + equipment so a new exercise gets a sensible profile the day it is added.
- **`src/lib/micros.ts`** — The micronutrient engine — vitamins, minerals and a couple of extras with RDI targets so intake shows as % of need. Purely ADDITIVE to the macro/calorie engine: it never touches calories, protein, carbs or fat. Foods without known micro data contribute nothing, and the UI is explicit that totals reflect 'foods & supplements with known data', so nothing is fabricated.  
  *Constants:* 26 MICRO_KEYS in three groups. Vitamins (13): vitaminA_ug, vitaminC_mg, vitaminD_ug, vitaminE_mg, vitaminK_ug, thiamin_mg, riboflavin_mg, niacin_mg, pantothenic_mg, vitaminB6_mg, biotin_ug, folate_ug, vitaminB12_ug. Minerals (12): calcium_mg, iron_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, copper_mg, manganese_mg, selenium_ug, iodine_ug, chromium_ug. Other (1): omega3_mg. RDIs follow US/EU DRIs for adults 19–50, sex-specific where they differ. MicroStatus has 4 values: low, ok, high, over. Exports sumMicros, scaleMicros, percentRdi, microStatus, microGaps, formatMicro, microDef, rdiFor.
- **`src/lib/motionValidation.ts`** — Is this actually walking or running — or a car, or standing still? A GPS trace alone cannot tell a jog from a bus ride; what separates them is CADENCE. Human legs top out around 190 steps/min and a vehicle produces almost none, so speed × cadence classifies motion reliably. The vehicle test deliberately leans on the ABSENCE of cadence rather than speed alone, because a genuinely fast runner keeps their steps.  
  *Constants:* VEHICLE_SPEED_MS = 7 (≈25 km/h); IMPOSSIBLE_SPEED_MS = 9 (≈32 km/h — Bolt peaked ~12.4 but not for a GPS segment); STATIONARY_SPEED_MS = 0.3 (≈1 km/h); RUN_SPEED_MS = 2 (≈7.2 km/h); MIN_ACTIVE_CADENCE = 20 steps/min. PAUSE_CONFIRM_MS = 25,000 and RESUME_CONFIRM_MS = 5,000 — auto-pause takes 25 s to confirm, resume only 5 s, so a crossing does not stop the session instantly but stepping off resumes it fast. Four MotionKinds: walking, running, vehicle, stationary. Exports classifyMotion, segmentSpeedMs, isPlausibleOnFootSegment.
- **`src/lib/naps.ts`** — What a nap is actually worth for recovery. Naps were logged and counted for nothing — the debt, the performance factor, the growth engine's recovery input and the athlete card all read night sleep only, which makes every recovery figure pessimistic after a 90-minute afternoon sleep on a 5-hour night. Modelled from the sleep-stage physiology with citations: Brooks & Lack (2006) 10-minute nap → alertness and cognition improved for up to ~155 min with no grogginess; NASA/Rosekind (1995) 26-minute nap → +34% performance, +54% alertness; past ~25–30 min you enter slow-wave sleep, where waking causes 15–30 min of sleep inertia.  
  *Constants:* 6 bands: micro, power, truncated, recovery, cycle, long. BAND_EFFICIENCY (restorative fraction vs a night-sleep minute): micro 0.35, power 0.7, truncated 0.6, recovery 0.65, cycle 0.75, long 0.7. BAND_INERTIA_MIN (grogginess on waking): micro 0, power 0, truncated 20, recovery 15, cycle 8, long 20. BAND_ALERTNESS_MIN (how long the lift lasts): micro 60, power 155, truncated 180, recovery 200, cycle 240, long 240. MAX_NAP_CREDIT_MIN = 150 — naps cannot replace nights. DEFAULT_TARGET_HOURS = 8. Also exports timingFactor (time-of-day adjustment), nightSleepCostMin (a late nap borrows from tonight), dayRest, describeNap, napAdvice.
- **`src/lib/oneRepMax.ts`** — 1RM estimation, with the assumption everyone forgets made explicit: both Epley and Brzycki were derived from sets taken TO FAILURE, so a set with reps left in the tank breaks the premise. 100 kg × 5 returns 117 kg whether those five were all you had or you stopped with three in reserve — in the second case the honest answer is nearer 127 kg. The standard correction is to add the reps in reserve before applying the formula, exactly what RPE-based load charts do. A failure set is trusted as-is, an RPE'd set is corrected upward, and a set with neither is used raw — so no existing estimate moves unless there was unused effort data next to it.  
  *Constants:* Epley: 1RM = w × (1 + reps/30), returns w unchanged at 1 rep. Brzycki is offered as an alternative; Epley is the default (slightly higher at high reps). ORMConfidence is 3 values — high / medium / low — driven by whether the set was toFailure, RPE'd, or neither. Exports epley1RM, brzycki1RM, estimate1RM, estimateRepsAt, repsAtFailureEquivalent, estimate1RMFromSet, ormConfidence, best1RM.
- **`src/lib/outdoorActivities.ts`** — The catalogue that lets one screen launch every ground activity the way a walk is launched. Previously only walk and run had a proper launcher (one tap, live screen, foreground service, recap) and everything else — hike, ruck, trail run, stair climbing, ride — went through the generic session screen where you had to remember to turn GPS on and nothing knew what the activity was.  
  *Constants:* Each activity declares: `gait` — walk / run / none, where 'none' means GPS-only and no invented step distance (cycling says so rather than inventing distance from arm swing); `sessionType` — what it is recorded as, so it lands in the right stats and the right recovery margins apply; `metFloor` — the floor for the pace-based MET, because a hike at walking pace costs more than a walk at walking pace (Compendium: walking ~3.5, hiking ~6, rucking higher again); `carries` — whether to ask for a pack weight, which then scales burn through loadProfile. DEFAULT_ACTIVITY_KEY = 'walk'. Exports activityFor, activityMet, requiresGps.
- **`src/lib/pedometer.ts`** — The accelerometer step detector — the fallback pedometer for devices without a usable hardware step counter. Reads XYZ at ~50 Hz, computes magnitude, low-pass filters with an EMA, detects peaks above a dynamic threshold (running mean + k·stdev) with a refractory period. Crucially it adds two gates the naive algorithm lacks, because the adaptive threshold DROPS when the phone is nearly still until ordinary sensor noise clears it — which is where phantom steps come from: amplitude (a footfall sends a distinct 0.2–1.5 g shock; rotation and fidgeting produce an order of magnitude less) and periodicity (gait is a metronome; requiring a run of evenly-spaced peaks means an isolated bump or a burst of shaking never becomes a step). Also owns stride length and the step↔distance conversions.  
  *Constants:* MAX_STEP_INTERVAL_MS = 2000 — slower than this between peaks and it is not a continuous gait. DAILY_STEP_GOAL = 8000. STRIDE_REFERENCE: walk { factor 0.415, cadence 100, min 0.36, max 0.5 }, run { factor 0.5, cadence 155, min 0.44, max 0.65 }. The textbook 0.415/0.5 constants are for ONE speed each; step length grows with cadence, so strideFactorFor interpolates at ~0.35 of the cadence ratio and clamps to the human min/max — this is why a brisk walk measured by steps alone used to come back short, and therefore slow. stepsFromDuration uses typical cadences: 110 spm walk, 160 spm run. Height defaults to 170 cm. StepDetectorOptions expose smoothing, sensitivity, refractoryMs, adaptation, minAmplitude, warmupSteps and rhythmTolerance.
- **`src/lib/photoMeal.ts`** — Turns what the model saw into rows you can CHECK before anything is logged — nothing here writes to the database. Each named food takes one of two paths, and which one is the whole point: if the catalogue has it, the catalogue's curated macros and measured micronutrients are used and the model contributes only the name and the portion; if it does not, researched figures are used and saved as a new food marked model-sourced, so an estimate can never later be mistaken for measured data. Portion is the weak link — judging grams from a flat image is far harder than naming the food — which is why every row is editable before logging.  
  *Constants:* PhotoItemSource is 2 values: 'catalogue' | 'researched'. `servingGrams(serving)` parses grams out of a serving string like '1 cup (158g)' and returns null when it cannot. Exports scaleCatalogueFood, rowFromCatalogue, rowFromResearch, unresolvedNames, mealTotals. Tested without a network by verify-engines.
- **`src/lib/postSession.ts`** — The after-session card: the margins to keep — and the one WINDOW to hit — before smoking, drinking, eating, a cold plunge or the next hard session, all scaled by a STRAIN score built from what was actually logged (duration, hard sets and their proximity to failure, tonnage relative to bodyweight, and for cardio the type and pace). Each item carries its own evidence-based rationale rendered verbatim.  
  *Constants:* 6 margins, keys water / eat / smoke / alcohol / cold / next. Water: waitMin 0, always now. Eat: it is a WINDOW not a wait — waitMin scales 15→30 min with strain, byMin scales 120→60 min (harder sessions mean a shorter window), advice '20–40 g protein and some carbohydrate'. Smoking: 60→150 min, only shown when smoking tracking is on. Alcohol: 90→300 min (cites ~1.5 g/kg cutting muscle protein synthesis by up to a third for the next day even with protein). Cold plunge: for LIFTING 240→360 min (cold-water immersion within about an hour blunts the hypertrophy signal — measurably less muscle over months), for cardio 0. Next hard session, same muscles: lifting 24 h→72 h, cardio 12 h→48 h. 4 strain levels: light, moderate, hard, brutal, with STRAIN_LABEL copy. 3 flows: lifting, cardio, mindbody. TYPE_INTENSITY maps session types to an intensity weight. marginStatuses/marginsStillRunning drive the live countdowns.
- **`src/lib/prayers.ts`** — Fully offline prayer-time calculation using the standard astronomical method (the PrayTimes.org approach): sun declination and equation of time from the Julian date, then hour angles for each twilight angle. Times come back as 'HH:MM' local strings using the device's UTC offset. The file states plainly that this is calculation, not authority — mosques and ministries can differ by a few minutes, which is what the method setting covers.  
  *Constants:* 6 methods with exact fajr/isha angles: tunisia 'Tunisia (Ministry)' 18/18; mwl 'Muslim World League' 18/17; isna 'ISNA (N. America)' 15/15; egypt 'Egyptian Authority' 19.5/17.5; umm_al_qura 'Umm al-Qura (Makkah)' 18.5 with isha 90 minutes after Maghrib; karachi 'Univ. of Karachi' 18/18. asrFactor 1 = standard, 2 = hanafi (stored on prayer_settings). PRAYER_NAMES holds the 5 prayers with labels and icons. CITY_PRESETS gives named lat/lng shortcuts. Default method on the settings row is 'tunisia'.
- **`src/lib/projection.ts`** — Expectation vs reality — a transparent model of where body composition SHOULD be heading, so the user can hold it against what actually happened. Three stated rules: energy balance drives total weight change at 7700 kcal ≈ 1 kg, with unlogged days treated as maintenance (contributing 0) rather than guessed, because an unlogged day should never invent a trend; where that change lands (fat vs lean) is decided by PARTITIONING, which is what protein, training, sleep and smoking actually influence; and training calories are deliberately NOT subtracted again, since the app's TDEE already includes an activity multiplier. The divergence between expected and actual is the interesting part.  
  *Constants:* KCAL_PER_KG = 7700. Partitioning levers: protein ≥1.6 g/kg and resistance training push loss toward fat and gain toward lean; short sleep does the opposite (one of the best-evidenced ways to lose lean mass while dieting); smoking gets a modest penalty on lean gain. 5 comparable metrics via CompositionMetric + METRIC_META (label + unit): weightKg, fatMassKg, leanMassKg, muscleMassKg, bodyFatPct. Exports fatLossFraction, leanGainFraction, projectComposition, compareToActual, explainGap.
- **`src/lib/rating.ts`** — The athlete-card rating engine — turns real logged signals into a FIFA/TCG-style overall out of 99 with six attributes, all derived from tracked data so the card is earned rather than cosmetic.  
  *Constants:* 6 attributes with ATTRIBUTE_LABELS: STR Strength, END Endurance, CON Consistency, NUT Nutrition, REC Recovery, DIS Discipline; each clamped 1–99. Overall = (STR×1.0 + END×1.0 + CON×1.3 + NUT×1.1 + REC×1.0 + DIS×1.1) / 6.5 — consistency is weighted highest. STR = 30 + relativeStrength×22 + min(15, sessionsPerWeek×3). END = 25 + min(45, weeklyCardioMinutes/4) + min(25, avgStepsPerDay/400). 5 tiers with exact hex colours: Legend ≥90 #B58CFF, Elite ≥80 #4FC3F7, Gold ≥68 #FFD54A, Silver ≥55 #C0C6D0, Bronze below #CD8B62. 12 RatingInputs including calorieAdherence and proteinAdherence (0..1), cigarettesPerDay and alcoholGramsPerWeek as penalties.
- **`src/lib/readiness.ts`** — 'Can I train now?' — combines the two clocks. The stomach (digestion: everything still digesting, stacked) and the smoke (smokeClock: acute nicotine plus the cumulative carbon-monoxide load, stacked) each say how long to wait for the intensity you intend; the answer is the LATER of the two, and the UI names WHICH one is holding you, because the fix is different — wait out a meal, or don't light the next one.  
  *Constants:* Governor is 'stomach' | 'smoke' | null. Readiness returns remainingMin, ready, readyAt (epoch ms), governor, readyFor (which intensity is fine RIGHT NOW on both counts, or null), progress 0..1, plus the underlying stomach and smoke statuses. Re-exports digestionStatus.
- **`src/lib/recommendations.ts`** — The rule-based coaching engine — pure functions over one aggregated CoachContext object. Each rule returns at most one dismissible tip with a stable `ruleKey` used to dedupe so it fires once per rolling window, and every tip carries transparent reasoning.  
  *Constants:* CoachContext is ~30 fields spanning training/recovery (daysSinceLastSession, consecutiveTrainingDays, daysSinceType per session type with Infinity for never, volumeDrops as {exercise, dropPct}), nutrition over the last 7 days (calorieTarget, proteinTarget, avgCalories7d, daysUnderProtein7d, daysLoggedNutrition7d), weight trend, hydration and caffeine, steps and stepGoal, smoking (cigsToday, avgCigsPerDay7d, smokeFreeStreak, smokingDailyTarget, aerobicPenaltyPct), sleep, alcohol (weekGrams, weeklyLimitG, dryDays7d) and cycle (enabled, phase, daysUntilPeriod). Output tips carry one of the 13 COACH_CATEGORIES.
- **`src/lib/reportHtml.ts`** — Builds the PDF report as pure HTML from a ReportData object, with NO native imports, so it can be rendered and asserted in Node against both a full and a sparse fixture (verify-engines does exactly that). src/services/pdfReport.ts turns the string into a PDF and opens the share sheet.  
  *Constants:* Single export: `buildReportHtml(d: ReportData): string`. Internal helpers esc() (escapes & < > " '), section(title, body) and kv(rows) for two-column key/value tables. Pulls display labels from calories (ACTIVITY_LABELS, GOAL_LABELS), bodyComposition (bodyFatCategory, ffmiCategory), cycle (PHASE_GUIDANCE) and rating (ATTRIBUTE_LABELS) rather than restating them.
- **`src/lib/restPhysiology.ts`** — Adjusts the rest prescription for the state you actually turned up in — through MECHANISM, not mood. The lever is oxygen: phosphocreatine resynthesis is entirely aerobic, which is why it is one of the most oxygen-sensitive processes in exercise physiology (Haseler et al. 1999 measured PCr recovery under three oxygen fractions and found the time constant shortened on 100% O₂ and lengthened markedly in hypoxia). Because recovery follows 1 − e^(−t/τ), if delivery falls to fraction d of normal then τ stretches to τ/d and the time to the SAME fraction stretches by exactly 1/d — so the rest the set already wanted is simply divided by the oxygen you actually have. Three factors: carboxyhaemoglobin from smoking, splanchnic blood diversion from a full stomach, and neural cost from short sleep.  
  *Constants:* BASELINE_COHB_PCT = 0.7; COHB_PER_CIG_EQ = 3.5; MAX_COHB_PCT = 12. O2_LOSS_PER_COHB_PCT = 0.012 with MAX_O2_LOSS = 0.2 (20% ceiling). SPLANCHNIC_FULL_KCAL = 700 with MAX_SPLANCHNIC_LOSS = 0.05 (5%). SLEEP_NEUTRAL_H = 7, SLEEP_EXCELLENT_H = 8.5, NEURAL_PER_HOUR_SHORT = 0.06, MAX_NEURAL_FACTOR = 1.3, MIN_NEURAL_FACTOR = 0.94 — so excellent sleep can SHORTEN rest by up to 6% and severe deprivation can lengthen it by up to 30%. Exports estimateCohbPct, o2DeliveryFactor, neuralRecoveryFactor, pcrTimeFor(fraction, tauS), restPhysiology — which returns an adjusted τ plus a `notes[]` array where each factor explains itself by its mechanism (verify-engines asserts exactly 3 notes when all three are active, and that `physiology` is undefined when nothing is known, so the app says so rather than inventing a reason).
- **`src/lib/restPrescription.ts`** — How long to rest between sets, derived from what the set actually WAS. Classifies the set's energy system — phosphagen (ATP-PCr: no oxygen, no lag, enormous power, tank essentially empty after ~10–15 s all-out; refills ~half in 30 s, ~85–90% by 2 min, ~95%+ by 3–5 min), glycolytic (~15 s to ~2 min, the burn; rest clears the acidosis, 1–3 min, longer for big muscles), or oxidative (long work, short rests fine — the point is often to train under fatigue) — then adds the nervous-system cost of heavy and explosive work and scales by experience level.  
  *Constants:* PCR_TAU_S = 45 s (half-time ≈ 31 s); MIN_REST_S = 30; MAX_REST_S = 300 — rest clamps to 30–300 s. LEVEL_REST_FACTOR: beginner 0.85, intermediate 1, advanced 1.1. Tempo constants for estimating time under load when no duration is logged: 3 s/rep heavy (≤5 reps), 2.5 s/rep normal, 2 s/rep bodyweight. energySystemOf: phosphagen when work ≤20 s AND heavy (≥85% 1RM or ≤5 reps); glycolytic when work ≤90 s; oxidative above. pctOneRMOf clamps to 0.2–1.1 from a known 1RM, or infers from reps + RIR through the Epley relation clamped 0.3–1. rirOf rounds RPE to the nearest half. 3 CnsLoad levels with CNS_LABEL copy ('CNS low' / 'CNS moderate' / 'CNS high'). COMPOUND_PATTERNS is a ReadonlySet of the movement patterns treated as compound. SYSTEM_LABEL and SYSTEM_BLURB carry the exact explanatory copy shown with the timer.
- **`src/lib/selfCare.ts`** — The daily hygiene / relax checklist — the small stabilising habits that keep a routine sustainable. Purely a daily checklist with no scoring beyond done-vs-target.  
  *Constants:* Exactly 3 items with exact labels, icons, colour tokens, targets and hints: brush 'Brush teeth' (care.brush, info, target 3, 'Morning, midday & night'); shower 'Shower' (care.shower, water, target 1, 'Once a day'); relax 'Relax time' (care.relax, mindbody, target 1, 'Unwind & decompress').
- **`src/lib/sleep.ts`** — The night-sleep model. Sleep is treated as the single biggest lever on performance, recovery and body composition, so it is a first-class signal folded into the recovery score and coach tips. Adult sleep-need guidance follows the National Sleep Foundation.  
  *Constants:* RECOMMENDED_SLEEP_MIN = 7, RECOMMENDED_SLEEP_MAX = 9, SLEEP_TARGET_DEFAULT = 8. assessNight returns 3 statuses: 'short' below 7 h with readiness = max(0.2, hours/7); 'long' above 10 h (MAX + 1) with readiness fixed at 0.85; 'optimal' otherwise. SLEEP_QUALITY_LABELS is the 1–5 scale rendered as ['Terrible','Poor','Okay','Good','Excellent']. Also exports sleepDebt, averageSleep, sleepPerformanceFactor.
- **`src/lib/smokeClock.ts`** — How long after smoking until it is sensible to train, and why it STACKS. Two effects on two different clocks. Nicotine is acute: within minutes heart rate is up 10–20 beats, blood pressure is up and the small arteries in skin and muscle are constricted; effects peak in the first quarter-hour and fade over 30–60 minutes, long before the nicotine itself is gone (half-life ~2 h). Every nicotine product does this, smoked or not — a pouch or a vape gets the acute window too, just without the smoke. Carbon monoxide is cumulative and only what BURNS makes it: CO binds haemoglobin ~240× more tightly than oxygen, so each cigarette parks some oxygen-carrying capacity for hours. Two cigarettes an hour apart do not reset each other.  
  *Constants:* NICOTINE_ACUTE_MIN by intensity {combusted, other}: hard {45, 30}, moderate {30, 20}, light {15, 10}. CO_HALF_LIFE_MIN = 240 (4 h breathing room air; literature 4–6 at rest, faster with activity). CO_THRESHOLD in cigarette-equivalents still on board: hard 2, moderate 3, light 5 — one cigarette on an empty system is under every threshold, so only the acute floor applies; stack them and the CO term takes over. SMOKE_LOOKBACK_MIN = 24 × 60. MAX_SMOKE_WAIT_MIN = 300. coLoad = Σ cigEq × qty × 2^(−Δt / half-life). A cigar is several cigarettes' worth and a shisha session, with burning charcoal, is a dozen. Measured VO2max drops noticeably from ~4% COHb.
- **`src/lib/smoking.ts`** — The smoking health-impact model for the opt-in tracker — life minutes lost, money cost, nicotine load, aerobic penalty, resting-HR elevation and the quit-benefit timeline. Every figure is a transparent, cited estimate, surfaced without judgment in the same spirit as the nutrition honest log, and every derived number is presented in-app as an estimate.  
  *Constants:* MINUTES_LOST_PER_CIGARETTE = 11 (Shaw, Mishra & Dobson, BMJ 2000;320:53). NICOTINE_MG_PER_CIGARETTE = 1.1 absorbed (US NIDA / Surgeon General). TAR_MG_PER_CIGARETTE = 10. CO_MG_PER_CIGARETTE = 14. DEFAULT_SMOKING_SETTINGS mirrors the smoking_profiles defaults (20 per pack, 8 per pack, '$', 1.1 mg). QUIT_TIMELINE is the milestone list (US Surgeon General / CDC 'Benefits of Quitting') with currentQuitMilestone and nextQuitMilestone driven by smoke-free hours. aerobicPenaltyPct and restingHrElevation are bounded, clearly-labelled estimates from average cigarettes per day. combustedEquivalents / totalNicotineMg / combustedShare fold the alternative-product catalogue (snus, pouches, vape, NRT) back onto a cigarette scale. lostSessionEquivalent frames the penalty as sessions.
- **`src/lib/specialDiet.ts`** — Turns a Special Programme's prose diet into real, loggable nutrition by resolving each meal's food components against FOOD_DB — so macros and micros come straight from the food database and are never invented here. `mealToDiaryInputs` converts a resolved meal into the exact PreciseFoodInput rows the nutrition repository writes, so a programme meal logs like any other food.  
  *Constants:* Builds a FOOD_BY_ID map over FOOD_DB. ResolvedFood carries id, name, serving, servings, calories, protein, carbs, fat, fiber and micros. Exports mealNutrition, dietNutrition(program), dietNutritionByKey(programKey) (null when unknown) and mealToDiaryInputs.
- **`src/lib/supplementPlan.ts`** — Goal-driven supplement protocol. Turns a set of goals into a concrete, time-slotted intake plan built ONLY from the catalogue, with honest evidence ratings and — the important part — a safety layer that flags dose caps, timing conflicts and real interactions. Stated as educational structure, not medical advice; it never tells you to exceed a tolerable upper intake, and it says plainly when a supplement is not the answer (most notably that nothing here treats nicotine dependence).  
  *Constants:* 5 goals: athletic_performance, sleep_quality, quit_smoking, stress_recovery, general_wellbeing — each a GoalDef with key, label, blurb and icon. 4 slots with SLOT_META (label + when): morning, preworkout, evening, bed. IntakePlan returns PlanItem[] plus SafetyNote[]. EvidenceLevel comes from the supplement catalogue and is shown on every item.
- **`src/lib/walkRecovery.ts`** — Recovers steps missed while the app was suspended or killed. The problem is concrete: JavaScript stops when the screen goes off, so the accelerometer listener stops and `watchStepCount` loses its subscription; Android's hardware counter keeps ticking at OS level, but `Pedometer.getStepCountAsync` — the only API that can read an absolute total over a date range — is iOS-ONLY, so on Android there is no way to ask 'how many steps since I started?'. Two recovery paths in order of trust: GPS (the location foreground service survives being backgrounded and killed, so traced route distance is real evidence — if it implies more steps than were counted, it is trusted) and cadence (estimate the unobserved window from the session's own measured steps-per-minute, deliberately conservative).  
  *Constants:* MAX_GAP_CREDIT_MIN = 90 — the longest unobserved window ever credited, so leaving the app shut for hours can never invent a huge number of steps. MIN_GAP_SEC = 45. MAX_CADENCE { walk 130, run 190 }. DEFAULT_CADENCE { walk 100, run 155 }. Exports measuredCadence and recoverGapSteps; everything is pure so the service just applies the result.
- **`src/lib/weather.ts`** — What today's weather does to today's training. Heat is the one environmental factor that reliably kills athletes and it works through sweat: above ~25 °C the body sheds heat almost entirely by evaporation, and humidity decides whether that works — at 32 °C and 80% humidity the air is nearly saturated and sweat drips instead of evaporating, which is why plain air temperature is a poor guide to risk. Cold is the mirror: below ~10 °C muscles are stiffer at the start, warm-up matters more, and wind strips heat faster than the thermometer suggests. Everything is a function of three numbers the user can type from any weather app when the live fetch is off or offline, and every effect is stated as an advisory adjustment — the app never silently rewrites a logged calorie or a target.  
  *Constants:* 6 heat bands on the FEELS-LIKE figure (thresholds follow heat-index guidance: caution ~27, extreme caution ~32, danger ~41): cold <5, cool <12, ideal <24, warm <30, hot <38, extreme ≥38. HEAT_BAND_LABEL: Cold, Cool, Ideal, Warm, Hot, 'Extreme heat'. HEAT_BAND_COLOR: #4FC3F7, #4F8CFF, #33D9A6, #FFB454, #FF8A3D, #FF5D5D. humiditySweatFactor runs 1.0 in dry air toward 1.4 in saturated air and only engages above 20 °C — the piece 'feels like' does NOT capture, because two days at the same feels-like are not equal for fluid loss. isReadingFresh defaults to a 3-hour max age. Exports heatIndexC (a standard regression, not a guess), windChillC, feelsLikeC, extraWaterMl, calorieCostMultiplier, pacePenaltyPct, weatherAdvice.
- **`src/repositories/kvRepo.ts`** — The tiny JSON key–value store over `app_kv`, for app-level state that is neither a log nor worth a table. Every function swallows its own errors — losing a convenience value is survivable and must never reach the UI. The file states explicitly that nothing here leaves the device, and that the API key in particular is stored ONLY in the app's own database and never in the repository, the JS bundle or an environment file, because the repository is public and a key shipped inside an app can be extracted from it.  
  *Constants:* Two known keys: KV_OPENROUTER_KEY = 'openrouter.apiKey' and KV_OPENROUTER_MODEL = 'openrouter.model'. Functions: kvGet<T> (returns null on missing or malformed JSON), kvSet (upsert via onConflictDoUpdate on the primary key, stamping updatedAt = Date.now()), kvDelete, openRouterKey() (trims and returns null for empty), setOpenRouterKey (an empty string DELETES the row rather than storing '').
- **`src/repositories/weatherRepo.ts`** — Reads and writes `weather_readings`, kept as history so a day's advice can be reconstructed and so the app can work from the last reading it has when the network goes. `latestReading` takes the most recent by observedAt for a day whatever its source; `freshReading` returns it only if still recent enough to act on; `todaysAdvice` runs the weather engine over it; `weatherAdjustedWaterGoal` returns the hydration parts SEPARATELY so a screen can show '2,500 + 400 for the heat' rather than an unexplained number.  
  *Constants:* saveWeatherReading defaults date to todayISO() and observedAt to Date.now(). weatherAdjustedWaterGoal takes plannedActiveMin defaulting to 45 and returns { totalMl, extraMl, feelsLike }; with no reading it returns the base goal, extraMl 0 and feelsLike null. The weather extra ADDS to the user's goal and never subtracts, and only when there is a reading from today.
- **`src/repositories/usageRepo.ts`** — The daily app-open ('check-in') streak over `app_open_logs` — a lightweight engagement streak that rewards opening the app each day, independent of whether you train. One row per day, recorded once on launch via `recordAppOpen` (which no-ops if today's row exists).  
  *Constants:* MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365]; nextMilestone is the first above the current streak, or the current streak itself when past 365. The current streak counts consecutive days ending today, or ending YESTERDAY if today has not been opened yet (cursor starts at 1) — so the streak does not visibly break before you open the app. The scan loop runs up to 3650 days. UsageStreak returns current, longest, openedToday, totalDays, last7 (7 StreakDay entries oldest-first with `opened` and `isToday`) and nextMilestone.
- **`src/repositories/coachRepo.ts`** — Assembles the whole CoachContext from a dozen other repositories, runs the rule engine, persists newly-triggered tips into `coach_tips`, and serves the active ones. This is the widest fan-in in the codebase: it pulls from nutritionRepo, activityRepo, statsRepo, sessionRepo, userRepo, smokingRepo, sleepRepo, alcoholRepo and cycleRepo, plus lib/smoking's aerobicPenaltyPct.  
  *Constants:* DEFAULT_STEP_GOAL = 8000. The nutrition window is the last 7 days (daysAgoISO(6)); a day counts as under protein when it is below 80% of the protein target. Weight trend uses a 21-day window. Dedupe rule: a draft is skipped if the latest tip with the same ruleKey has a date ≥ startOfWeek(today) — dismissed or not — so a rule nudges once per ISO week, not on every app open. activeCoachTips returns at most 5 non-dismissed tips ordered by createdAt descending. Fallback defaults when no goal row exists: calorieTarget 2200, proteinTarget 140, waterGoalMl 2500, caffeineSoftLimitMg 400. dismissCoachTip flips the boolean rather than deleting. `weeklyStepAverage` is a small helper used only by the Stats screen's steps sparkline.
- **`scripts/verify-engines.ts`** — The regression harness for the entire domain layer, and by far the most consequential non-app file in the repo: 3,562 lines, 322 KB, run with `npm run verify:engines` (tsx scripts/verify-engines.ts). It smoke-tests every pure engine against known values, then goes considerably further — it reads SOURCE FILES off disk and asserts on them, so it guards architecture as well as arithmetic. It exits non-zero on any failure. Its section headers double as a plain-English changelog of every bug the project has ever shipped and refuses to ship again.  
  *Constants:* 1,426 `check(name, cond, detail)` assertions across ~100 named sections, each printing ✓/✗ and a final '<pass> passed, <fail> failed'. What it guards beyond the maths: (1) Schema ↔ migration integrity — every column in schema.ts must be reachable by an existing install, i.e. present in bootstrap's CREATE TABLE and in ADDED_COLUMNS, because a column added to schema.ts without an ADDED_COLUMNS entry compiles fine and then throws 'no such column' at runtime on every existing install, which is exactly how walk tracking got hard-broken once. (2) Drizzle ↔ runtime DDL parity table-by-table and column-by-column, with a guard that the parity scan actually parsed ≥25 tables so it cannot silently pass by matching nothing. (3) That `SCHEMA_VERSION = 32` literally appears in bootstrap.ts — because a library expansion only reaches existing installs when the version moves. (4) Navigation integrity — every `navigate('X')` / `replace` / `push` across src/screens and src/components must target a route registered in RootNavigator or TabNavigator. (5) That the data-corrupting `walkBackgroundTask.ts` has not come back, and that step checkpoints stay monotonic (`steps: Math.max(row.steps, impliedSteps)`). (6) That every achievement has rendered badge art and every catalogue icon key resolves. (7) Library integrity — ≥740 browsable (non-alias) exercises, unique slugs, no two browsable exercises sharing a name, every exercise carrying a difficulty of 1–5, all five grades populated with none holding >60% of the library, ≥20 at grade 1 and ≥100 at grade 2, ≥50 at grade 4 and ≥8 at grade 5, and hand-checked gradings (muscle-up = 5, pistol squat = 4, glute bridge = 1, leg extension = 2). (8) That specific screens still read the moving state — e.g. that ActiveSessionScreen.tsx contains `coLoad(recentSmokeEvents())`, `stomachLoad(`, `sleepSummary().avgRest7d` and `pcrRecovered(elapsed, rx?.physiology?.tauS)`.

### Notes for the redesign

THE COUNT IS 41 TABLES, NOT 42. `grep -c "CREATE TABLE IF NOT EXISTS" src/db/bootstrap.ts` returns 42 only because the phrase also appears in bootstrap's own doc comment; there are 41 `sqliteTable(...)` definitions in schema.ts and 41 distinct CREATE TABLE statements in bootstrap, and a diff of the two sets is empty in both directions. No table exists in one and not the other. There are no drizzle relations() definitions and no foreign-key constraints in the DDL — every relationship below is by convention (an integer column holding another table's id), enforced only by repository code. `PRAGMA foreign_keys = ON` is set but has nothing to enforce.

TWO SINGLETON TABLES use a plain `id INTEGER PRIMARY KEY` with no AUTOINCREMENT and are always row id = 1: `live_walks` and `prayer_settings` and `fasting_profiles` (three, in fact). `app_kv` is the only table whose primary key is text.

════════════════════════════════════════════
THE 41 TABLES, COLUMN BY COLUMN
════════════════════════════════════════════

1. users — the single profile row. Columns: id (PK autoinc); name TEXT NOT NULL default 'Athlete'; sex TEXT NOT NULL default 'male', enum male|female, and the comment is explicit that this is BIOLOGICAL SEX used only for metabolic (BMR) formulas; gender TEXT NOT NULL default 'male', enum male|female|non_binary|other|prefer_not_to_say, user-chosen and independent of sex; birthdate TEXT ISO date (nullable — ageFromBirthdate returns 30 when null); height_cm REAL; activity_level TEXT NOT NULL default 'moderate', enum sedentary|light|moderate|active|very_active; goal TEXT NOT NULL default 'maintain', enum lose_fat|maintain|build_muscle|recomp|performance; body_type TEXT enum ectomorph|mesomorph|endomorph (nullable); rate_of_change TEXT NOT NULL default 'moderate', enum slow|moderate|aggressive; unit_preference TEXT NOT NULL default 'metric', enum metric|imperial; experience_level TEXT enum beginner|intermediate|advanced, NULLABLE and NULL reads as intermediate so nothing changes until the user picks; onboarded_at INTEGER epoch ms (null = onboarding not finished); created_at INTEGER NOT NULL default (unixepoch()*1000).

2. weigh_ins — one row per measurement event. Everything except weight_kg is an OPTIONAL measured input, typically read off a bio-impedance scale or a tape. Derived values (BMI, fat weight, lean mass, percentages, obesity degree) are deliberately NOT stored so history can never disagree with itself. Columns: id; user_id; date TEXT ISO; weight_kg REAL NOT NULL; body_fat_pct REAL; fat_mass_kg REAL; muscle_mass_kg REAL; body_water_pct REAL (total body water); bone_mass_kg REAL; skeletal_muscle_kg REAL (skeletal/voluntary muscle — scales report it separately); visceral_fat_rating REAL (scale index ~1–59, ≤9 healthy); protein_pct REAL; bmr_kcal REAL (the scale's own metabolism reading); trapped_water_kg REAL (retained/oedema-style reading). Then 16 circumference columns in cm, all REAL: waist_cm, hip_cm, neck_cm, shoulder_cm, chest_cm, upper_abdomen_cm, lower_abdomen_cm, arm_upper_l_cm, arm_upper_r_cm, arm_lower_l_cm, arm_lower_r_cm, thigh_l_cm, thigh_r_cm, calf_l_cm, calf_r_cm. Plus created_at. Index: idx_weigh_ins_user_date (user_id, date). NOTE for a designer: 28 optional measurement fields — lib/bodyComposition.MEASUREMENT_FIELDS supplies the labels and grouping the form should use.

3. goal_history — every goal change or target recalculation, kept like weigh-ins so the history of targets is visible. Columns: id; user_id; date TEXT; goal TEXT NOT NULL (same 5-value enum); rate_of_change TEXT NOT NULL (slow|moderate|aggressive); target_weight_kg REAL; and a snapshot of what the goal produced — calorie_target REAL NOT NULL, protein_g REAL NOT NULL, carbs_g REAL NOT NULL, fat_g REAL NOT NULL, tdee REAL, bmr REAL, basis TEXT ('katch' when lean mass was known, else 'mifflin'); the context it was calculated from — at_weight_kg REAL, at_body_fat_pct REAL; notes TEXT; created_at. Index (user_id, date).

4. sessions — one row per workout. Columns: id; user_id; session_type TEXT NOT NULL (9-value enum); label TEXT; split_key TEXT (e.g. 'push'|'pull'|'legs'|'upper'|'chest' from the chosen split); split_day TEXT; start_time INTEGER NOT NULL epoch ms; end_time INTEGER; duration_s INTEGER; total_volume REAL (strength, kg); distance_m REAL (outdoor); pace REAL (seconds per km); elevation_m REAL; score TEXT (sport free-text score); style TEXT (mind-body technique/style tag); calories_burned REAL; steps_added INTEGER and distance_added_m REAL — what this session contributed to the day's passive step totals for on-foot activities, recorded so deleting the session subtracts EXACTLY what it added (without these a deleted session's steps kept counting forever); mood_before INTEGER and mood_after INTEGER, both a 1..5 emoji scale; notes TEXT; warmups_done TEXT (JSON string[] of warm-up muscles ticked, kept on the row so leaving and resuming — or restarting the app — does not un-tick them; NULL reads as none); created_at. Index idx_sessions_user_time (user_id, start_time).

5. exercise_logs — an exercise within a session. Columns: id; session_id INTEGER NOT NULL; exercise_id INTEGER NOT NULL; order_index INTEGER NOT NULL default 0 (the running order, which the app is asserted to keep where you put it); superset_group INTEGER (null = not grouped); notes TEXT. Index (session_id). Note there is NO created_at on this table.

6. set_entries — one logged set. Columns: id; exercise_log_id INTEGER NOT NULL; set_number INTEGER NOT NULL; reps INTEGER; weight_kg REAL; rpe REAL (1..10); to_failure INTEGER NOT NULL default 0 as boolean — documented as stronger evidence than RPE because people round RPE but nobody ticks this by accident, so it WINS when both are present and implies RPE 10 / 0 RIR; duration_s INTEGER (duration-tracked movements: cardio, holds, mobility); distance_m REAL (distance-tracked: row, run intervals); is_pr INTEGER NOT NULL default 0 boolean; completed INTEGER NOT NULL default 1 boolean. Index (exercise_log_id). No created_at.

7. exercises — the exercise library, both built-in and user-custom. Columns: id; slug TEXT (the stable natural key that lets the library be upserted without changing ids — nullable for pre-slug rows); name TEXT NOT NULL; category TEXT NOT NULL (e.g. 'barbell', 'bodyweight', 'running'); session_type TEXT NOT NULL (9-value enum); muscle_groups TEXT (JSON array of strings); primary_muscle TEXT (chest/back/quads/…); sub_muscle TEXT (lats/traps/mid_back/lower_back/front_delt/…); equipment_type TEXT (6-value enum); equipment TEXT (free text); pattern TEXT (16-value MOVEMENT_PATTERNS enum, drives the beginner illustration); description TEXT; instructions TEXT (JSON array of step strings); tracking_type TEXT NOT NULL default 'reps_weight' (6-value enum); icon_key TEXT NOT NULL default 'strength.dumbbell'; is_custom INTEGER NOT NULL default 0 boolean; met_value REAL (metabolic equivalent for calorie estimation). Indexes on session_type and primary_muscle. IMPORTANT: `difficulty` is NOT a database column — it is resolved in src/data/exercises.ts at module load (authored value, else named skill, else equipment+pattern) and lives only in memory.

8. custom_routines — saved, updatable workout templates. Columns: id; user_id; name TEXT NOT NULL; exercise_ids TEXT NOT NULL default '[]' (JSON array of exercise ids in performance order); updated_at INTEGER; created_at. Index (user_id).

9. walk_sessions — a completed walk or run. Columns: id; user_id; mode TEXT NOT NULL default 'walk' enum walk|run; start_time INTEGER NOT NULL; end_time INTEGER; steps INTEGER NOT NULL default 0; distance_m REAL NOT NULL default 0; duration_s INTEGER NOT NULL default 0; calories_burned REAL NOT NULL default 0; avg_pace REAL (s per km); source TEXT NOT NULL default 'pedometer' enum pedometer|accelerometer|gps — worth surfacing, since the three have very different confidence; route_json TEXT (GPS route as JSON [[lat,lng],…] for the circuit map); created_at. Index (user_id, start_time).

10. live_walks — SINGLE ROW, id = 1. The in-progress walk/run shared with the background service: the foreground-service location task writes distance in the background, the pedometer writes steps, and the UI POLLS this row, so tracking survives the screen turning off or the app being backgrounded. Columns: id INTEGER PRIMARY KEY (no autoinc); active INTEGER NOT NULL default 0 boolean; user_id INTEGER NOT NULL default 1; mode TEXT NOT NULL default 'walk'; source TEXT NOT NULL default 'pedometer'; start_time INTEGER; steps INTEGER NOT NULL default 0; distance_m REAL NOT NULL default 0; last_lat REAL; last_lng REAL; route_json TEXT (accumulating route while a run is live); updated_at INTEGER; boot_step_baseline INTEGER — the hardware step counter's absolute since-boot value at session start, because that sensor keeps counting while the CPU sleeps AND while our process is dead, so (current − baseline) gives the exact session count even after the app has been killed; NULL when there is no hardware counter. This table has NO created_at and NO index.

11. daily_step_logs — the passive daily step total. Columns: id; user_id; date TEXT NOT NULL; step_count INTEGER NOT NULL default 0; distance_m REAL NOT NULL default 0; calories_burned REAL NOT NULL default 0. UNIQUE(user_id, date) declared inline in the DDL. No created_at.

12. food_entries — the diary. Columns: id; user_id; date TEXT ISO; meal_type TEXT NOT NULL (breakfast|lunch|dinner|snack); log_mode TEXT NOT NULL default 'precise' enum precise|honest — the two logging modes are a first-class distinction in the data; food_name TEXT; free_text_description TEXT (the honest-mode free text); serving_size TEXT; quantity REAL NOT NULL default 1; calories REAL NOT NULL default 0; protein_g, carbs_g, fat_g, fiber_g all REAL NOT NULL default 0; micros TEXT (JSON Partial<MicroProfile> for this entry, already scaled by quantity); form TEXT enum solid|liquid — how the stomach treats it, because liquids clear far faster and skip the solid lag phase; NULL means solid so every pre-existing row reads exactly as it did; is_estimated INTEGER NOT NULL default 0 boolean; created_at — which the DIGESTION CLOCK READS AS THE MOMENT EATING ENDED (see lib/eatenAt for why the log form asks). Index (user_id, date).

13. supplement_stack — the user's configured supplements. Columns: id; user_id; key TEXT NOT NULL (catalogue key); dose TEXT; units_per_serving INTEGER — how many pills make ONE portion of the product you actually own, because brands differ wildly (spirulina is 500 mg tablets from one maker and 1 g capsules from another), so the catalogue default is only a starting point and this is what the app counts with; enabled INTEGER NOT NULL default 1 boolean; created_at. UNIQUE index (user_id, key).

14. supplement_logs — a supplement actually taken. Columns: id; user_id; date TEXT; key TEXT NOT NULL; label TEXT NOT NULL; category TEXT NOT NULL enum micronutrient|ergogenic; dose TEXT; units_taken REAL (how many pills were actually swallowed); food_entry_id INTEGER — the diary row this log created when the supplement carries real macros (fish oil is 10 kcal of fat per softgel), linked so deleting the log deletes its calories too, following the same reversible-delete rule sessions do; micros TEXT (JSON Partial<MicroProfile>); created_at. Index (user_id, date).

15. beverage_entries — hydration and caffeine. Columns: id; user_id; date TEXT; type TEXT NOT NULL enum water|coffee|tea|energy_drink|soda|other; volume_ml REAL NOT NULL default 0; caffeine_mg REAL NOT NULL default 0; created_at. Index (user_id, date).

16. nutrition_goals — the current targets. Columns: id; user_id; calorie_target REAL NOT NULL; protein_g REAL NOT NULL; carbs_g REAL NOT NULL; fat_g REAL NOT NULL; water_goal_ml REAL NOT NULL default 2500; caffeine_soft_limit_mg REAL NOT NULL default 400; tdee REAL; last_recalculated_date TEXT; created_at. Index (user_id). NOTE: there is NO fibre column — the fibre target is DERIVED on read by calories.recommendedFiberG(calorieTarget) precisely so it moves with the calorie target and is never edited by hand.

17. smoking_entries — one row per smoking event. Columns: id; user_id; date TEXT; quantity INTEGER NOT NULL default 1 (units of product_key); product_key TEXT — which nicotine product, and NULL MEANS CIGARETTES, since every entry logged before alternatives existed was a cigarette, so old rows stay correct with no backfill; trigger TEXT (optional context tag: stress, coffee, social…); created_at. Index (user_id, date).

18. smoking_profiles — per-user tracker settings. Columns: id; user_id; enabled INTEGER NOT NULL default 0 boolean (opt-in, off by default); mode TEXT NOT NULL default 'quitting' enum tracking|quitting; cigarettes_per_pack INTEGER NOT NULL default 20; price_per_pack REAL NOT NULL default 8; currency TEXT NOT NULL default '$'; nicotine_mg_per_cig REAL NOT NULL default 1.1; baseline_per_day INTEGER NOT NULL default 10; daily_target INTEGER (the cap, for quitting mode); created_at. Index (user_id).

19. sleep_logs — one night. Columns: id; user_id; date TEXT NOT NULL — explicitly the MORNING/WAKE ISO date the sleep belongs to; hours REAL NOT NULL; quality INTEGER (1..5 subjective); bedtime TEXT optional 'HH:MM'; wake_time TEXT; notes TEXT; created_at. UNIQUE index (user_id, date) — one night per day, so logging is an upsert.

20. nap_logs — daytime naps, separate from night sleep, MANY PER DAY. Columns: id; user_id; date TEXT (the ISO day the nap happened); minutes REAL NOT NULL default 0; start_time TEXT optional 'HH:MM'; quality INTEGER 1..5; created_at. Non-unique index (user_id, date).

21. hormone_flags — user-flagged hormonal status, from the profile. Educational and non-diagnostic. Columns: id; user_id; hormone_key TEXT NOT NULL (catalogue key); label TEXT NOT NULL; status TEXT NOT NULL default 'monitoring' enum low|high|monitoring; notes TEXT; active INTEGER NOT NULL default 1 boolean; created_at. Index (user_id, active).

22. alcohol_entries — a drink. Columns: id; user_id; date TEXT; type TEXT NOT NULL enum beer|wine|spirit|cocktail|other; label TEXT; volume_ml REAL NOT NULL; abv_pct REAL NOT NULL; alcohol_grams REAL NOT NULL; standard_drinks REAL NOT NULL; calories REAL NOT NULL; created_at. Index (user_id, date). Note the computed values ARE stored here (unlike body composition) because they depend on constants that could change.

23. cycle_profiles — menstrual tracking settings. Columns: id; user_id; enabled INTEGER NOT NULL default 0 boolean; avg_cycle_length INTEGER NOT NULL default 28; avg_period_length INTEGER NOT NULL default 5; last_period_start TEXT ISO date; created_at. Index (user_id).

24. period_logs — a period. Columns: id; user_id; start_date TEXT NOT NULL ISO; end_date TEXT (NULL while ongoing); flow TEXT enum light|medium|heavy; symptoms TEXT (JSON array of strings); notes TEXT; created_at. Index (user_id, start_date).

25. health_conditions — the user's selected chronic conditions. Columns: id; user_id; condition_key TEXT NOT NULL (catalogue key); label TEXT NOT NULL; category TEXT (metabolic/cardiovascular/respiratory/…); notes TEXT; active INTEGER NOT NULL default 1 boolean; created_at. Index (user_id, active).

26. habit_profiles — a habit the user wants to change. Columns: id; user_id; habit_key TEXT NOT NULL (catalogue key or 'custom:<slug>'); label TEXT NOT NULL; kind TEXT NOT NULL default 'count' enum count|duration; enabled INTEGER NOT NULL default 1 boolean; daily_target REAL (reduce toward this per-day cap, or minutes/day for duration habits); baseline_per_day REAL (typical baseline before tracking, for savings maths); minutes_per_occurrence REAL (what an average occurrence costs, for count-kind habits); created_at. UNIQUE index (user_id, habit_key).

27. habit_entries — one occurrence. Columns: id; user_id; habit_key TEXT NOT NULL; date TEXT; quantity REAL NOT NULL default 1 (occurrences, for count habits); minutes REAL NOT NULL default 0 (for duration habits); trigger TEXT (late_night, stress, boredom…); late_night INTEGER NOT NULL default 0 boolean — was it after 23:00, used for sleep-displacement impact; created_at. Index (user_id, habit_key, date).

28. work_logs — daily work hours as a time range. Columns: id; user_id; date TEXT; start_time TEXT 'HH:MM'; end_time TEXT 'HH:MM'; minutes REAL NOT NULL default 0 (total worked); break_minutes REAL NOT NULL default 0; quality INTEGER (subjective focus 1..5); notes TEXT; created_at. UNIQUE index (user_id, date) — one work log per day.

29. prayer_settings — SINGLE ROW, id = 1. Columns: id INTEGER PRIMARY KEY; user_id INTEGER NOT NULL default 1; enabled INTEGER NOT NULL default 0 boolean; latitude REAL; longitude REAL; location_name TEXT; method TEXT NOT NULL default 'tunisia' (one of the 6 PRAYER_METHODS keys); asr_factor INTEGER NOT NULL default 1 (1 standard, 2 hanafi); created_at. No index.

30. fasting_profiles — SINGLE ROW, id = 1. Columns: id INTEGER PRIMARY KEY; user_id INTEGER NOT NULL default 1; enabled INTEGER NOT NULL default 0 boolean; mode TEXT NOT NULL default 'ramadan' enum ramadan|intermittent; manual_suhoor TEXT default '04:00' and manual_iftar TEXT default '19:00' (the manual fallbacks used when prayer times are not configured); eating_start TEXT default '12:00' and eating_end TEXT default '20:00' (the intermittent window); created_at. No index.

31. fasting_logs — a completed fast. Columns: id; user_id; date TEXT; completed INTEGER NOT NULL default 1 boolean; created_at. UNIQUE index (user_id, date).

32. self_care_logs — one row per (day, key). Columns: id; user_id; date TEXT; key TEXT NOT NULL — 'brush' | 'shower' | 'relax'; count INTEGER NOT NULL default 0 (how many times done today; targets are brush 3, shower 1, relax 1 from lib/selfCare); created_at. UNIQUE index (user_id, date, key).

33. prayer_logs — which of the 5 daily prayers were performed. The PRESENCE OF A ROW means that prayer was done that day; there is no boolean. Columns: id; user_id; date TEXT; prayer TEXT NOT NULL — fajr | dhuhr | asr | maghrib | isha; created_at. UNIQUE index (user_id, date, prayer). Un-ticking a prayer therefore has to DELETE the row.

34. app_open_logs — the daily check-in streak. Columns: id; user_id; date TEXT (one row per day the app was opened); created_at. UNIQUE index (user_id, date).

35. profile_photos — the monthly athlete-card photo. Columns: id; user_id; month TEXT NOT NULL in 'YYYY-MM' form (not a full date); uri TEXT NOT NULL; created_at. UNIQUE index (user_id, month) — exactly one photo per calendar month.

36. custom_foods — foods the user entered themselves: a home recipe, a local product, anything the built-in database does not carry. Stored per-user and merged into Precise-mode search alongside the built-in catalogue. Columns: id; user_id; name TEXT NOT NULL; serving TEXT NOT NULL; calories REAL NOT NULL default 0; protein, carbs, fat, fiber all REAL NOT NULL default 0; category TEXT; calories_estimated INTEGER NOT NULL default 0 boolean — records that the energy figure was DERIVED FROM THE MACROS rather than read off a label, so the UI can keep saying so instead of quietly promoting an approximation to a measurement; components_json TEXT — for a COMPOSED food, the component list as JSON, where each component is a full macro+micro SNAPSHOT scaled by its servings rather than a live reference into the catalogue (the catalogue is replaced on every app update, so a reference-based recipe would drift or break), and the row's own macros above are the SUM of these, kept in sync on every edit so logging a composed food is exactly as fast as logging any other; micros_json TEXT (micronutrients summed from the components); form TEXT enum solid|liquid, NULL reads as solid; source TEXT enum user|ai — 'ai' means a model identified the food from a photograph and researched its nutrition, so the figures are an estimate however confident they look, and this is kept for the LIFETIME of the row so an estimate can never quietly become fact; NULL or 'user' means you entered them; created_at. Index (user_id, name).

37. daily_challenges — the challenge the wheel landed on, one row per day. The row is written WHEN YOU SPIN, so the challenge is locked in and the wheel cannot be re-spun for a softer one — which is the only thing that makes completing it mean anything. Columns: id; user_id; date TEXT (one challenge per day); challenge_key TEXT NOT NULL; spun_at INTEGER NOT NULL; completed_at INTEGER — stamped by the app when the MEASURED metric first reaches its target, NEVER by a manual 'done' tap; final_value REAL (the metric value at the moment of completion, for the history list); created_at. UNIQUE index (user_id, date).

38. meal_routines — a saved meal you eat often ('my usual breakfast', 'post-training') or a whole day's distribution for a fasting window. Columns: id; user_id; name TEXT NOT NULL; meal_type TEXT enum breakfast|lunch|dinner|snack, and NULL MEANS THE ROUTINE COVERS A WHOLE DAY, with each item carrying its own meal — which is how a fasting distribution gets saved in one go; items_json TEXT NOT NULL default '[]' (JSON array of RoutineItem, a macro SNAPSHOT per food, not references into the catalogue, for the same replaced-on-update reason as composed foods); use_count INTEGER NOT NULL default 0; last_used_at INTEGER; created_at. Index (user_id, meal_type).

39. weather_readings — one row per fetch or manual entry, kept as history so a day's advice can be reconstructed and so trends (training in heat) are possible later. Columns: id; user_id; date TEXT; temp_c REAL NOT NULL; humidity_pct REAL; wind_kmh REAL; source TEXT NOT NULL enum live|manual — shown in the UI, because a typed number and a fetched one deserve different confidence; observed_at INTEGER NOT NULL; created_at. Index (user_id, date).

40. app_kv — the tiny JSON key–value store for app-level state that is neither a log nor worth a table. Columns: key TEXT PRIMARY KEY (the only text PK in the schema); value TEXT NOT NULL (JSON); updated_at INTEGER NOT NULL. Currently holds 'openrouter.apiKey' and 'openrouter.model'. Deliberately the ONLY place the OpenRouter key lives — never in the repository, the JS bundle or an env file, because the repo is public and a key shipped inside an app can be extracted from it.

41. coach_tips — a persisted coaching nudge. Columns: id; user_id; date TEXT; category TEXT NOT NULL (one of the 13 COACH_CATEGORIES); title TEXT NOT NULL; message TEXT NOT NULL; rule_key TEXT NOT NULL (dedupe key so a rule fires once per window); dismissed INTEGER NOT NULL default 0 boolean; created_at. Index (user_id, dismissed).

════════════════════════════════════════════
GAPS, ODDITIES AND THINGS THAT ONLY WORK IN ONE PLACE
════════════════════════════════════════════

• EVERYTHING IS SINGLE-USER IN PRACTICE. Every table carries user_id and every repository defaults it to `PRIMARY_USER_ID` from userRepo. There is no user switcher. A designer can treat user_id as a constant.

• DERIVED-NEVER-STORED IS A HARD RULE for body composition (weigh_ins) and for the fibre target, and the comments say why. It is NOT the rule for alcohol (grams, standard drinks and calories are stored) or for composed foods (totals are stored and kept in sync). Do not assume consistency.

• NULL CARRIES MEANING in at least six places, and each is a deliberate backfill-avoidance decision: users.experience_level NULL = intermediate; food_entries.form and custom_foods.form NULL = solid; smoking_entries.product_key NULL = cigarettes; custom_foods.source NULL = user; sessions.warmups_done NULL = none; meal_routines.meal_type NULL = a whole-day routine. A UI that treats these as "not set" and forces a choice would change behaviour for existing users.

• THREE TABLES HAVE NO created_at: exercise_logs, set_entries, daily_step_logs, live_walks. Anything wanting a timeline of sets has to go up to the session.

• REVERSIBLE DELETES ARE A PATTERN WITH TWO INSTANCES: sessions.steps_added / distance_added_m (so deleting a session subtracts exactly what it added to the day's step total) and supplement_logs.food_entry_id (so deleting a macro-bearing supplement log deletes its diary calories too). verify-engines has a whole section, "Deletes undo their side effects", guarding both.

• `exercises.difficulty` DOES NOT EXIST IN THE DATABASE. It is computed at module load in src/data/exercises.ts and exists only in memory. Any screen that shows difficulty is reading the in-memory library, not a query result. Similarly `aliasOf` — 7 exercises are aliases and must be filtered out of any browsable list.

• SCHEMA VERSION 30 IS PERMANENTLY BURNED (used by v2.52, reverted in v2.53). Databases that briefly reached it carry a few unused live_walks columns that nothing reads. The number is never reused so the two states can never be confused.

• THE MIGRATION MECHANISM IS FRAGILE BY DESIGN AND GUARDED BY A TEST, NOT BY A TYPE. Adding a column to schema.ts without adding it to ADDED_COLUMNS compiles cleanly and then throws "no such column" at runtime on every existing install. verify-engines catches it; TypeScript does not. Any v3 schema change must add to BOTH the DDL string and ADDED_COLUMNS.

• RE-SEEDING IS GATED ON THE VERSION BUMP. New exercises reach existing installs ONLY when SCHEMA_VERSION moves — verify-engines literally asserts the string `const SCHEMA_VERSION = 32;` appears in bootstrap.ts. Shipping a library expansion without a bump silently reaches fresh installs only.

• THE SEED CANNOT DELETE. It upserts by slug (falling back to lowercased name for pre-slug DBs) and leaves removed exercises in place forever, because exercise_logs points at them by id. So the `exercises` table accumulates: rows that are no longer in EXERCISE_LIBRARY still exist and are still selectable unless a screen filters them.

• 26 MICRONUTRIENTS ARE MODELLED BUT MOST FOODS HAVE NONE. The micros layer is explicitly additive and the UI is required to say totals reflect "foods & supplements with known data". A designer must not render a 26-bar grid as though it were complete.

• SEVERAL ENGINES RETURN NULL RATHER THAN A GUESS, and the UI is expected to stay quiet rather than score nothing: effortScore returns null below 25% known effort; growth's effortScore is null and "the UI hides it"; restPhysiology returns `physiology: undefined` when nothing is known; geo.normalizeRoute returns null when there is no drawable route; weatherAdjustedWaterGoal returns feelsLike null with no reading. These are the empty states that matter most in this area.

• THE ONE GENUINELY UNTESTABLE SURFACE is anything reading the device: expo-sqlite, expo-sensors, expo-location. Everything else is pure and covered — 1,426 assertions. If a v3 redesign moves logic INTO a component, it leaves that coverage.

• PERMISSION-DENIED PATHS live outside this area (services/), but the data model records their consequence: walk_sessions.source distinguishes pedometer / accelerometer / gps, live_walks.boot_step_baseline is NULL when there is no hardware counter, and weather_readings.source distinguishes live from manual. Those three columns are the app's honest record of "we could not measure this the good way", and a v3 design should surface them rather than hide them.

---

## Appendix A — Extracted reference

Everything below is parsed directly from the source tree rather than written by
hand, so it cannot drift from the code: every route with its exact TypeScript
params, every screen file, every table and column, every engine with its own
opening line, every repository function, every component prop.

## Navigation map

### Bottom tabs (5)

| Tab | Params |
|---|---|
| `Home` | `undefined` |
| `Train` | `undefined` |
| `Nutrition` | `undefined` |
| `Stats` | `undefined` |
| `Profile` | `undefined` |

### Stack routes (46)

| Route | Params |
|---|---|
| `Onboarding` | `undefined` |
| `Main` | `NavigatorScreenParams<TabParamList> \| undefined` |
| `SessionTypePicker` | `undefined` |
| `LogSession` | `undefined` |
| `SplitPicker` | `undefined` |
| `MethodPicker` | `{ sessionType: SessionType }` |
| `ProgramPicker` | `{ sessionType: SessionType }` |
| `SpecialPrograms` | `undefined` |
| `DailyChallenge` | `undefined` |
| `SpecialProgramDetail` | `{ programKey: string }` |
| `ActiveSession` | `{ sessionId: number }` |
| `ExerciseLibrary` | `\| { pick?: boolean; sessionId?: number; draft?: boolean; sessionType?: SessionType } \| undefined` |
| `SessionRecap` | `{ sessionId: number; prCount?: number; stepsAdded?: number }` |
| `Walk` | `{ mode?: 'walk' \| 'run'; activity?: string } \| undefined` |
| `SessionHistory` | `undefined` |
| `SessionDetail` | `{ sessionId: number }` |
| `WalkDetail` | `{ walkId: number }` |
| `AddFood` | `{ meal: MealType; mode?: 'precise' \| 'honest' }` |
| `PhotoFood` | `{ meal: MealType }` |
| `CustomFood` | `{ id?: number } \| undefined` |
| `ComposeFood` | `{ id?: number } \| undefined` |
| `Micronutrients` | `undefined` |
| `Supplements` | `undefined` |
| `SupplementPlan` | `undefined` |
| `DietPlan` | `undefined` |
| `ProgrammeMeals` | `undefined` |
| `ExerciseStats` | `{ exerciseId: number; name: string }` |
| `EditProfile` | `undefined` |
| `Goals` | `undefined` |
| `Smoking` | `undefined` |
| `Sleep` | `undefined` |
| `Work` | `undefined` |
| `Habits` | `undefined` |
| `Alcohol` | `undefined` |
| `Cycle` | `undefined` |
| `Conditions` | `undefined` |
| `Hormones` | `undefined` |
| `Body` | `undefined` |
| `ProfileCard` | `undefined` |
| `Achievements` | `undefined` |
| `Reports` | `undefined` |
| `Growth` | `undefined` |
| `Trends` | `undefined` |
| `Changelog` | `undefined` |
| `Prayers` | `undefined` |
| `Fasting` | `undefined` |

## Screen files (50)

| File | Component | Lines | Its own summary |
|---|---|---|---|
| `faith/FastingScreen.tsx` | FastingScreen | 227 |  |
| `faith/PrayersScreen.tsx` | PrayersScreen | 168 |  |
| `health/AlcoholScreen.tsx` | AlcoholScreen | 168 |  |
| `health/ConditionsScreen.tsx` | ConditionsScreen | 97 |  |
| `health/CycleScreen.tsx` | CycleScreen | 275 |  |
| `health/HabitsScreen.tsx` | HabitsScreen | 229 |  |
| `health/HormonesScreen.tsx` | HormonesScreen | 183 |  |
| `health/SleepScreen.tsx` | SleepScreen | 277 |  |
| `health/WorkScreen.tsx` | WorkScreen | 103 |  |
| `home/HomeScreen.tsx` | HomeScreen | 459 |  |
| `nutrition/AddFoodScreen.tsx` | AddFoodScreen | 346 |  |
| `nutrition/ComposeFoodScreen.tsx` | ComposeFoodScreen | 294 | Build a dish from other foods with quantities — "Friday couscous": couscous |
| `nutrition/CustomFoodScreen.tsx` | CustomFoodScreen | 255 | Create or edit a food the built-in database doesn't have. |
| `nutrition/DietPlanScreen.tsx` | DietPlanScreen | 179 |  |
| `nutrition/MicronutrientsScreen.tsx` | MicronutrientsScreen | 162 |  |
| `nutrition/NutritionScreen.tsx` | NutritionScreen | 400 |  |
| `nutrition/PhotoFoodScreen.tsx` | PhotoFoodScreen | 499 | Logging a meal from a photograph. |
| `nutrition/ProgrammeMealsScreen.tsx` | ProgrammeMealsScreen | 112 | Every Special Programme diet, meal by meal, loggable straight into the diary |
| `nutrition/SupplementPlanScreen.tsx` | SupplementPlanScreen | 189 |  |
| `nutrition/SupplementsScreen.tsx` | SupplementsScreen | 339 |  |
| `onboarding/OnboardingScreen.tsx` | OnboardingScreen | 431 |  |
| `profile/AchievementsScreen.tsx` | AchievementsScreen | 130 |  |
| `profile/BodyScreen.tsx` | BodyScreen | 341 |  |
| `profile/ChangelogScreen.tsx` | ChangelogScreen | 47 |  |
| `profile/EditProfileScreen.tsx` | EditProfileScreen | 225 | Edit profile / change goal. Rewritten to be null-safe (the previous version |
| `profile/GoalsScreen.tsx` | GoalsScreen | 87 |  |
| `profile/ProfileCardScreen.tsx` | ProfileCardScreen | 184 |  |
| `profile/ProfileScreen.tsx` | ProfileScreen | 292 |  |
| `profile/ReportsScreen.tsx` | ReportsScreen | 74 |  |
| `smoking/SmokingScreen.tsx` | SmokingScreen | 459 |  |
| `stats/ExerciseStatsScreen.tsx` | ExerciseStatsScreen | 202 |  |
| `stats/GrowthScreen.tsx` | GrowthScreen | 184 |  |
| `stats/StatsScreen.tsx` | StatsScreen | 343 |  |
| `stats/TrendsScreen.tsx` | TrendsScreen | 343 | The long-view: 12 weeks of everything, charted week by week — training, |
| `train/ActiveSessionScreen.tsx` | ActiveSessionScreen | 950 |  |
| `train/ChallengeScreen.tsx` | ChallengeScreen | 200 | Spin once a day for a challenge you did not choose. |
| `train/ExerciseLibraryScreen.tsx` | ExerciseLibraryScreen | 418 |  |
| `train/LogSessionScreen.tsx` | LogSessionScreen | 202 |  |
| `train/MethodPickerScreen.tsx` | MethodPickerScreen | 225 |  |
| `train/ProgramPickerScreen.tsx` | ProgramPickerScreen | 201 |  |
| `train/SessionDetailScreen.tsx` | SessionDetailScreen | 261 |  |
| `train/SessionHistoryScreen.tsx` | SessionHistoryScreen | 123 |  |
| `train/SessionRecapScreen.tsx` | SessionRecapScreen | 217 |  |
| `train/SessionTypePickerScreen.tsx` | SessionTypePickerScreen | 88 |  |
| `train/SpecialProgramDetailScreen.tsx` | SpecialProgramDetailScreen | 232 |  |
| `train/SpecialProgramsScreen.tsx` | SpecialProgramsScreen | 108 |  |
| `train/SplitPickerScreen.tsx` | SplitPickerScreen | 143 |  |
| `train/TrainScreen.tsx` | TrainScreen | 343 |  |
| `train/WalkDetailScreen.tsx` | WalkDetailScreen | 116 |  |
| `train/WalkScreen.tsx` | WalkScreen | 380 |  |

## Database — every table and column

41 tables. Schema version 32 (`src/db/bootstrap.ts`).

### `users`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `name` | text | `name` |
| `sex` | text | `sex` |
| `gender` | text | `gender` |
| `birthdate` | text | `birthdate` |
| `height_cm` | real | `heightCm` |
| `activity_level` | text | `activityLevel` |
| `goal` | text | `goal` |
| `body_type` | text | `bodyType` |
| `rate_of_change` | text | `rateOfChange` |
| `unit_preference` | text | `unitPreference` |
| `experience_level` | text | `experienceLevel` |
| `onboarded_at` | integer | `onboardedAt` |
| `created_at` | integer | `createdAt` |

### `weigh_ins`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `weight_kg` | real | `weightKg` |
| `body_fat_pct` | real | `bodyFatPct` |
| `fat_mass_kg` | real | `fatMassKg` |
| `muscle_mass_kg` | real | `muscleMassKg` |
| `body_water_pct` | real | `bodyWaterPct` |
| `bone_mass_kg` | real | `boneMassKg` |
| `skeletal_muscle_kg` | real | `skeletalMuscleKg` |
| `visceral_fat_rating` | real | `visceralFatRating` |
| `protein_pct` | real | `proteinPct` |
| `bmr_kcal` | real | `bmrKcal` |
| `trapped_water_kg` | real | `trappedWaterKg` |
| `waist_cm` | real | `waistCm` |
| `hip_cm` | real | `hipCm` |
| `neck_cm` | real | `neckCm` |
| `shoulder_cm` | real | `shoulderCm` |
| `chest_cm` | real | `chestCm` |
| `upper_abdomen_cm` | real | `upperAbdomenCm` |
| `lower_abdomen_cm` | real | `lowerAbdomenCm` |
| `arm_upper_l_cm` | real | `armUpperLCm` |
| `arm_upper_r_cm` | real | `armUpperRCm` |
| `arm_lower_l_cm` | real | `armLowerLCm` |
| `arm_lower_r_cm` | real | `armLowerRCm` |
| `thigh_l_cm` | real | `thighLCm` |
| `thigh_r_cm` | real | `thighRCm` |
| `calf_l_cm` | real | `calfLCm` |
| `calf_r_cm` | real | `calfRCm` |
| `created_at` | integer | `createdAt` |

### `goal_history`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `goal` | text | `goal` |
| `rate_of_change` | text | `rateOfChange` |
| `target_weight_kg` | real | `targetWeightKg` |
| `calorie_target` | real | `calorieTarget` |
| `protein_g` | real | `proteinG` |
| `carbs_g` | real | `carbsG` |
| `fat_g` | real | `fatG` |
| `tdee` | real | `tdee` |
| `bmr` | real | `bmr` |
| `basis` | text | `basis` |
| `at_weight_kg` | real | `atWeightKg` |
| `at_body_fat_pct` | real | `atBodyFatPct` |
| `notes` | text | `notes` |
| `created_at` | integer | `createdAt` |

### `sessions`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `session_type` | text | `sessionType` |
| `label` | text | `label` |
| `split_key` | text | `splitKey` |
| `split_day` | text | `splitDay` |
| `start_time` | integer | `startTime` |
| `end_time` | integer | `endTime` |
| `duration_s` | integer | `durationS` |
| `total_volume` | real | `totalVolume` |
| `distance_m` | real | `distanceM` |
| `pace` | real | `pace` |
| `elevation_m` | real | `elevationM` |
| `score` | text | `score` |
| `style` | text | `style` |
| `calories_burned` | real | `caloriesBurned` |
| `steps_added` | integer | `stepsAdded` |
| `distance_added_m` | real | `distanceAddedM` |
| `mood_before` | integer | `moodBefore` |
| `mood_after` | integer | `moodAfter` |
| `notes` | text | `notes` |
| `warmups_done` | text | `warmupsDone` |
| `created_at` | integer | `createdAt` |

### `exercise_logs`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `session_id` | integer | `sessionId` |
| `exercise_id` | integer | `exerciseId` |
| `order_index` | integer | `orderIndex` |
| `superset_group` | integer | `supersetGroup` |
| `notes` | text | `notes` |

### `set_entries`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `exercise_log_id` | integer | `exerciseLogId` |
| `set_number` | integer | `setNumber` |
| `reps` | integer | `reps` |
| `weight_kg` | real | `weightKg` |
| `rpe` | real | `rpe` |
| `to_failure` | integer | `toFailure` |
| `duration_s` | integer | `durationS` |
| `distance_m` | real | `distanceM` |
| `is_pr` | integer | `isPr` |
| `completed` | integer | `completed` |

### `exercises`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `slug` | text | `slug` |
| `name` | text | `name` |
| `category` | text | `category` |
| `session_type` | text | `sessionType` |
| `muscle_groups` | text | `muscleGroups` |
| `primary_muscle` | text | `primaryMuscle` |
| `sub_muscle` | text | `subMuscle` |
| `equipment_type` | text | `equipmentType` |
| `equipment` | text | `equipment` |
| `pattern` | text | `pattern` |
| `description` | text | `description` |
| `instructions` | text | `instructions` |
| `tracking_type` | text | `trackingType` |
| `icon_key` | text | `iconKey` |
| `is_custom` | integer | `isCustom` |
| `met_value` | real | `metValue` |

### `custom_routines`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `name` | text | `name` |
| `exercise_ids` | text | `exerciseIds` |
| `updated_at` | integer | `updatedAt` |
| `created_at` | integer | `createdAt` |

### `walk_sessions`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `mode` | text | `mode` |
| `start_time` | integer | `startTime` |
| `end_time` | integer | `endTime` |
| `steps` | integer | `steps` |
| `distance_m` | real | `distanceM` |
| `duration_s` | integer | `durationS` |
| `calories_burned` | real | `caloriesBurned` |
| `avg_pace` | real | `avgPace` |
| `source` | text | `source` |
| `route_json` | text | `routeJson` |
| `created_at` | integer | `createdAt` |

### `live_walks`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `active` | integer | `active` |
| `user_id` | integer | `userId` |
| `mode` | text | `mode` |
| `source` | text | `source` |
| `start_time` | integer | `startTime` |
| `steps` | integer | `steps` |
| `distance_m` | real | `distanceM` |
| `last_lat` | real | `lastLat` |
| `last_lng` | real | `lastLng` |
| `route_json` | text | `routeJson` |
| `updated_at` | integer | `updatedAt` |
| `boot_step_baseline` | integer | `bootStepBaseline` |

### `daily_step_logs`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `step_count` | integer | `stepCount` |
| `distance_m` | real | `distanceM` |
| `calories_burned` | real | `caloriesBurned` |

### `food_entries`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `meal_type` | text | `mealType` |
| `log_mode` | text | `logMode` |
| `food_name` | text | `foodName` |
| `free_text_description` | text | `freeTextDescription` |
| `serving_size` | text | `servingSize` |
| `quantity` | real | `quantity` |
| `calories` | real | `calories` |
| `protein_g` | real | `proteinG` |
| `carbs_g` | real | `carbsG` |
| `fat_g` | real | `fatG` |
| `fiber_g` | real | `fiberG` |
| `micros` | text | `micros` |
| `form` | text | `form` |
| `is_estimated` | integer | `isEstimated` |
| `created_at` | integer | `createdAt` |

### `supplement_stack`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `key` | text | `key` |
| `dose` | text | `dose` |
| `units_per_serving` | integer | `unitsPerServing` |
| `enabled` | integer | `enabled` |
| `created_at` | integer | `createdAt` |

### `supplement_logs`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `key` | text | `key` |
| `label` | text | `label` |
| `category` | text | `category` |
| `dose` | text | `dose` |
| `units_taken` | real | `unitsTaken` |
| `food_entry_id` | integer | `foodEntryId` |
| `micros` | text | `micros` |
| `created_at` | integer | `createdAt` |

### `beverage_entries`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `type` | text | `type` |
| `volume_ml` | real | `volumeMl` |
| `caffeine_mg` | real | `caffeineMg` |
| `created_at` | integer | `createdAt` |

### `nutrition_goals`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `calorie_target` | real | `calorieTarget` |
| `protein_g` | real | `proteinG` |
| `carbs_g` | real | `carbsG` |
| `fat_g` | real | `fatG` |
| `water_goal_ml` | real | `waterGoalMl` |
| `caffeine_soft_limit_mg` | real | `caffeineSoftLimitMg` |
| `tdee` | real | `tdee` |
| `last_recalculated_date` | text | `lastRecalculatedDate` |
| `created_at` | integer | `createdAt` |

### `smoking_entries`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `quantity` | integer | `quantity` |
| `product_key` | text | `productKey` |
| `trigger` | text | `trigger` |
| `created_at` | integer | `createdAt` |

### `smoking_profiles`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `enabled` | integer | `enabled` |
| `mode` | text | `mode` |
| `cigarettes_per_pack` | integer | `cigarettesPerPack` |
| `price_per_pack` | real | `pricePerPack` |
| `currency` | text | `currency` |
| `nicotine_mg_per_cig` | real | `nicotineMgPerCig` |
| `baseline_per_day` | integer | `baselinePerDay` |
| `daily_target` | integer | `dailyTarget` |
| `created_at` | integer | `createdAt` |

### `sleep_logs`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `hours` | real | `hours` |
| `quality` | integer | `quality` |
| `bedtime` | text | `bedtime` |
| `wake_time` | text | `wakeTime` |
| `notes` | text | `notes` |
| `created_at` | integer | `createdAt` |

### `nap_logs`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `minutes` | real | `minutes` |
| `start_time` | text | `startTime` |
| `quality` | integer | `quality` |
| `created_at` | integer | `createdAt` |

### `hormone_flags`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `hormone_key` | text | `hormoneKey` |
| `label` | text | `label` |
| `status` | text | `status` |
| `notes` | text | `notes` |
| `active` | integer | `active` |
| `created_at` | integer | `createdAt` |

### `alcohol_entries`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `type` | text | `type` |
| `label` | text | `label` |
| `volume_ml` | real | `volumeMl` |
| `abv_pct` | real | `abvPct` |
| `alcohol_grams` | real | `alcoholGrams` |
| `standard_drinks` | real | `standardDrinks` |
| `calories` | real | `calories` |
| `created_at` | integer | `createdAt` |

### `cycle_profiles`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `enabled` | integer | `enabled` |
| `avg_cycle_length` | integer | `avgCycleLength` |
| `avg_period_length` | integer | `avgPeriodLength` |
| `last_period_start` | text | `lastPeriodStart` |
| `created_at` | integer | `createdAt` |

### `period_logs`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `start_date` | text | `startDate` |
| `end_date` | text | `endDate` |
| `flow` | text | `flow` |
| `symptoms` | text | `symptoms` |
| `notes` | text | `notes` |
| `created_at` | integer | `createdAt` |

### `health_conditions`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `condition_key` | text | `conditionKey` |
| `label` | text | `label` |
| `category` | text | `category` |
| `notes` | text | `notes` |
| `active` | integer | `active` |
| `created_at` | integer | `createdAt` |

### `habit_profiles`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `habit_key` | text | `habitKey` |
| `label` | text | `label` |
| `kind` | text | `kind` |
| `enabled` | integer | `enabled` |
| `daily_target` | real | `dailyTarget` |
| `baseline_per_day` | real | `baselinePerDay` |
| `minutes_per_occurrence` | real | `minutesPerOccurrence` |
| `created_at` | integer | `createdAt` |

### `habit_entries`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `habit_key` | text | `habitKey` |
| `date` | text | `date` |
| `quantity` | real | `quantity` |
| `minutes` | real | `minutes` |
| `trigger` | text | `trigger` |
| `late_night` | integer | `lateNight` |
| `created_at` | integer | `createdAt` |

### `work_logs`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `start_time` | text | `startTime` |
| `end_time` | text | `endTime` |
| `minutes` | real | `minutes` |
| `break_minutes` | real | `breakMinutes` |
| `quality` | integer | `quality` |
| `notes` | text | `notes` |
| `created_at` | integer | `createdAt` |

### `prayer_settings`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `enabled` | integer | `enabled` |
| `latitude` | real | `latitude` |
| `longitude` | real | `longitude` |
| `location_name` | text | `locationName` |
| `method` | text | `method` |
| `asr_factor` | integer | `asrFactor` |
| `created_at` | integer | `createdAt` |

### `fasting_profiles`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `enabled` | integer | `enabled` |
| `mode` | text | `mode` |
| `manual_suhoor` | text | `manualSuhoor` |
| `manual_iftar` | text | `manualIftar` |
| `eating_start` | text | `eatingStart` |
| `eating_end` | text | `eatingEnd` |
| `created_at` | integer | `createdAt` |

### `fasting_logs`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `completed` | integer | `completed` |
| `created_at` | integer | `createdAt` |

### `self_care_logs`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `key` | text | `key` |
| `count` | integer | `count` |
| `created_at` | integer | `createdAt` |

### `prayer_logs`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `prayer` | text | `prayer` |
| `created_at` | integer | `createdAt` |

### `app_open_logs`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `created_at` | integer | `createdAt` |

### `profile_photos`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `month` | text | `month` |
| `uri` | text | `uri` |
| `created_at` | integer | `createdAt` |

### `custom_foods`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `name` | text | `name` |
| `serving` | text | `serving` |
| `calories` | real | `calories` |
| `protein` | real | `protein` |
| `carbs` | real | `carbs` |
| `fat` | real | `fat` |
| `fiber` | real | `fiber` |
| `category` | text | `category` |
| `calories_estimated` | integer | `caloriesEstimated` |
| `components_json` | text | `componentsJson` |
| `micros_json` | text | `microsJson` |
| `form` | text | `form` |
| `source` | text | `source` |
| `created_at` | integer | `createdAt` |

### `daily_challenges`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `challenge_key` | text | `challengeKey` |
| `spun_at` | integer | `spunAt` |
| `completed_at` | integer | `completedAt` |
| `final_value` | real | `finalValue` |
| `created_at` | integer | `createdAt` |

### `meal_routines`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `name` | text | `name` |
| `meal_type` | text | `mealType` |
| `items_json` | text | `itemsJson` |
| `use_count` | integer | `useCount` |
| `last_used_at` | integer | `lastUsedAt` |
| `created_at` | integer | `createdAt` |

### `app_kv`

| Column | Type | Field |
|---|---|---|
| `key` | text | `key` |
| `value` | text | `value` |
| `updated_at` | integer | `updatedAt` |

### `weather_readings`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `temp_c` | real | `tempC` |
| `humidity_pct` | real | `humidityPct` |
| `wind_kmh` | real | `windKmh` |
| `source` | text | `source` |
| `observed_at` | integer | `observedAt` |
| `created_at` | integer | `createdAt` |

### `coach_tips`

| Column | Type | Field |
|---|---|---|
| `id` | integer | `id` |
| `user_id` | integer | `userId` |
| `date` | text | `date` |
| `category` | text | `category` |
| `title` | text | `title` |
| `message` | text | `message` |
| `rule_key` | text | `ruleKey` |
| `dismissed` | integer | `dismissed` |
| `created_at` | integer | `createdAt` |

## Engines — `src/lib` (59 files)

Every one is pure and covered by `scripts/verify-engines.ts`.

| Module | Exports | What it does (its own words) |
|---|---|---|
| `achievementRules.ts` | 3 |  |
| `activitySteps.ts` | 3 | Turn an on-foot activity (a run, a hike, a logged outdoor session) into an |
| `aiFood.ts` | 21 | Turning a model's answer about food into numbers we're willing to store. |
| `alcohol.ts` | 15 |  |
| `bodyComposition.ts` | 11 | Body-composition engine. |
| `bodyType.ts` | 7 | Body-type quick assessment (spec §3.7). A lightweight, transparent heuristic |
| `calories.ts` | 24 |  |
| `challengeWheel.ts` | 11 |  |
| `composedFood.ts` | 9 |  |
| `conditions.ts` | 5 | Catalogue of common chronic conditions. Selecting a condition lets FitCoach |
| `cycle.ts` | 7 |  |
| `date.ts` | 10 |  |
| `dietPlan.ts` | 8 |  |
| `digestion.ts` | 26 | How long after eating until it is comfortable — and safe — to train. |
| `eatenAt.ts` | 5 | When was the meal actually finished? |
| `effort.ts` | 21 |  |
| `energyBalance.ts` | 5 | Daily energy balance — how much you've eaten, how much you've burned in |
| `exerciseAlternatives.ts` | 6 | "This one's too hard — find me an easier alternative." |
| `exerciseCalories.ts` | 14 | Per-exercise calorie attribution — and what the rest between sets is worth. |
| `exerciseDifficulty.ts` | 10 | How hard an exercise is, and who it is for. |
| `fasting.ts` | 6 |  |
| `foodMatch.ts` | 8 | Matching a name to a food we already have. |
| `foodMath.ts` | 11 | Working out a food's calories from its macros. |
| `format.ts` | 15 |  |
| `geo.ts` | 5 | Geo helpers for GPS route tracking (runs / outdoor sessions). |
| `gpsFilter.ts` | 19 |  |
| `growth.ts` | 9 |  |
| `habits.ts` | 8 |  |
| `hormones.ts` | 6 | Hormone reference — the endocrine signals that most shape training, recovery, |
| `level.ts` | 9 | Experience level — beginner, intermediate, advanced — and what it changes. |
| `loadProfile.ts` | 8 | What "load" means for every exercise — the variables the calorie engine, |
| `met.ts` | 6 | MET-based calorie-burn estimation (spec §3.1 recap, §3.4). |
| `micros.ts` | 15 |  |
| `motionValidation.ts` | 13 | Is this actually walking or running — or a car, or standing still? |
| `naps.ts` | 19 | What a nap is actually worth. |
| `oneRepMax.ts` | 10 | One-Rep-Max estimation (spec §3.3). Two standard formulas; Epley is the |
| `outdoorActivities.ts` | 7 | Outdoor ground activities — everything you launch the way you launch a walk. |
| `pedometer.ts` | 10 | Accelerometer-based step detector — the fallback pedometer for devices whose |
| `photoMeal.ts` | 8 | Turning what a model saw into rows you can check before anything is logged. |
| `postSession.ts` | 13 | After the session: the margins to keep — and the one window to hit — |
| `prayers.ts` | 10 | Prayer-time calculation — fully offline, standard astronomical method (the |
| `progressBar.ts` | 2 | Text progress bars for notifications. |
| `projection.ts` | 14 | Expectation vs reality — a transparent model of where your body composition |
| `rating.ts` | 5 |  |
| `readiness.ts` | 3 | "Can I train now?" — the two clocks that answer it, combined. |
| `recommendations.ts` | 3 |  |
| `reportHtml.ts` | 1 | The report document itself — pure HTML from ReportData, no native imports, so |
| `restPhysiology.ts` | 19 | What the rest of your life does to the rest between your sets. |
| `restPrescription.ts` | 20 | How long to rest between sets — from what the set actually was. |
| `selfCare.ts` | 3 | Daily self-care / hygiene check-ins — the small stabilising habits that keep |
| `sleep.ts` | 9 | Sleep model. Sleep is the single biggest lever on training performance, |
| `smokeClock.ts` | 11 | How long after smoking until it is sensible to train — and why it stacks. |
| `smoking.ts` | 21 | Smoking health-impact model (opt-in tracker). |
| `specialDiet.ts` | 7 | Turns a Special Programme's prose diet into real, loggable nutrition by |
| `subMuscle.ts` | 3 | Sub-muscle resolution. |
| `supplementPlan.ts` | 10 |  |
| `time.ts` | 6 | Time-of-day helpers for range logging (sleep bedtime→wake, work start→end). |
| `walkRecovery.ts` | 8 | Recovering steps missed while the app was suspended or killed. |
| `weather.ts` | 16 | What today's weather does to today's training — and how far to trust it. |

## Repositories — `src/repositories` (35 files)

| Module | Exported functions |
|---|---|
| `achievementsRepo.ts` | `achievementStats` |
| `activityRepo.ts` | `getLiveWalk`, `startLiveWalk`, `patchLiveWalk`, `endLiveWalk`, `appendLiveRoutePoints`, `getLiveRoute`, `getLiveRouteDistanceM`, `saveWalkSession`, `listWalkSessions`, `getWalkSession`, `deleteWalkSession`, `getDailySteps`, `setDailySteps`, `addSteps`, `removeSteps`, `stepHistorySince` |
| `alcoholRepo.ts` | `logDrink`, `deleteDrink`, `drinksForDay`, `alcoholDay`, `alcoholImpact`, `avgAlcoholGramsPerWeek` |
| `cardRepo.ts` | `buildRatingInputs`, `computeCardRating` |
| `challengeRepo.ts` | `challengeForDate`, `wheelForToday`, `spinDailyChallenge`, `measureMetric`, `measureChallenge`, `refreshChallengeCompletion`, `challengeStats`, `challengeHistory` |
| `coachRepo.ts` | `buildCoachContext`, `refreshCoachTips`, `activeCoachTips`, `dismissCoachTip`, `weeklyStepAverage` |
| `conditionsRepo.ts` | `listConditions`, `hasCondition`, `addCondition`, `removeCondition` |
| `customFoodRepo.ts` | `listCustomFoods`, `getCustomFood`, `createCustomFood`, `updateCustomFood`, `deleteCustomFood`, `customFoodsAsItems`, `toFoodItem`, `customFoodIdFrom`, `composedFormDefault`, `createComposedFood`, `updateComposedFood`, `componentsOf`, `composableFoods` |
| `cycleRepo.ts` | `getCycleProfile`, `isCycleEnabled`, `upsertCycleProfile`, `logPeriodStart`, `setPeriodEnd`, `deletePeriodLog`, `listPeriods`, `currentCycle`, `refineCycleAverages` |
| `energyRepo.ts` | `energyBalanceFor` |
| `exerciseRepo.ts` | `getExercise`, `getExerciseBySlug`, `listExercises`, `exercisesBySlugs`, `createCustomExercise`, `updateCustomExercise`, `deleteCustomExercise` |
| `faithRepo.ts` | `getPrayerSettings`, `upsertPrayerSettings`, `todaysPrayerTimes`, `prayersDone`, `togglePrayer`, `getFastingProfile`, `upsertFastingProfile`, `currentFastingState`, `logFastCompleted`, `fastingStats` |
| `goalHistoryRepo.ts` | `recordGoalChange`, `goalHistoryList`, `latestGoalRecord`, `deleteGoalRecord` |
| `growthRepo.ts` | `growthReport` |
| `habitsRepo.ts` | `listHabitProfiles`, `getHabitProfile`, `enableHabit`, `disableHabit`, `logHabit`, `undoLastHabit`, `habitImpact`, `habitCorrelation`, `habitDailySeries` |
| `hormonesRepo.ts` | `listHormoneFlags`, `hormoneFlag`, `setHormoneFlag`, `removeHormoneFlag` |
| `kvRepo.ts` | `kvGet`, `kvSet`, `kvDelete`, `openRouterKey`, `setOpenRouterKey` |
| `mealRoutineRepo.ts` | `parseItems`, `listMealRoutines`, `routineTotals`, `saveMealRoutine`, `applyMealRoutine`, `deleteMealRoutine`, `renameMealRoutine`, `saveableEntryCount` |
| `microsRepo.ts` | `dayMicros` |
| `nutritionRepo.ts` | `addPreciseFood`, `addHonestFood`, `deleteFoodEntry`, `foodEntriesForDay`, `dayNutrition`, `addBeverage`, `deleteBeverage`, `dayBeverages`, `dailyIntakeSince`, `avgWaterSince`, `avgCaffeineSince` |
| `postSessionRepo.ts` | `postSessionFor`, `activePostSession` |
| `projectionRepo.ts` | `compositionTrend`, `compositionProjection` |
| `reportRepo.ts` | `buildReportData` |
| `routinesRepo.ts` | `listRoutines`, `getRoutine`, `findRoutineByName`, `saveRoutine`, `renameRoutine`, `updateRoutineExercises`, `deleteRoutine`, `sessionExerciseIds` |
| `selfCareRepo.ts` | `getSelfCare`, `bumpSelfCare`, `setSelfCare` |
| `sessionRepo.ts` | `startSession`, `addExerciseToSession`, `replaceExerciseLog`, `completedSetsOf`, `addSet`, `updateSet`, `deleteSet`, `removeExerciseLog`, `moveExerciseLog`, `lastSetForExercise`, `finalizeSession`, `logPastSession`, `sessionCalorieBreakdown`, `sessionExercisePeek`, `warmupsDoneOf`, `toggleWarmupDone`, `getSession`, `getSessionDetail`, `listSessions`, `activeSession`, `deleteSession` |
| `sleepRepo.ts` | `logSleep`, `deleteSleep`, `sleepForDate`, `sleepSince`, `sleepSummary`, `logNap`, `deleteNap`, `napsForDate`, `napMinutesForDate`, `avgSleepHours`, `avgRestHours`, `valueOfNap`, `sleepTrainingCorrelation` |
| `smokingRepo.ts` | `getSmokingProfile`, `isSmokingEnabled`, `upsertSmokingProfile`, `settingsFromProfile`, `logCigarettes`, `deleteSmokingEntry`, `dayCigarettes`, `dayUnits`, `dayNicotineMg`, `daySmokedShare`, `dayEntries`, `recentSmokeEvents`, `undoLastCigarette`, `cigarettesSince`, `nicotineMgSince`, `cigaretteMoneySince`, `avgCigarettesPerDay`, `dailySeries`, `smokeFreeHours`, `smokeFreeStreak`, `smokingImpact`, `smokingCorrelation` |
| `statsRepo.ts` | `exerciseProgression`, `personalRecords`, `weeklyVolume`, `trainingCalendar`, `currentStreak`, `sessionTypeCounts`, `muscleGroupBalance`, `daysSinceType`, `consecutiveTrainingDays`, `daysSinceLastSession`, `recentVolumeDrops` |
| `supplementsRepo.ts` | `getStack`, `inStack`, `addToStack`, `setUnitsPerServing`, `unitsPerServingFor`, `removeFromStack`, `logSupplement`, `unitsTakenToday`, `totalUnitsToday`, `supplementFoodEntryIds`, `deleteSupplementLog`, `loggedToday`, `supplementsForDay`, `supplementStreak` |
| `trendsRepo.ts` | `trendsData` |
| `usageRepo.ts` | `recordAppOpen`, `usageStreak` |
| `userRepo.ts` | `getUser`, `ensureUser`, `updateUser`, `markOnboarded`, `isOnboarded`, `addWeighIn`, `latestWeight`, `currentMonthKey`, `getProfilePhoto`, `setProfilePhoto`, `weighInHistory`, `weightTrendKgPerWeek`, `getNutritionGoal`, `upsertNutritionGoal` |
| `weatherRepo.ts` | `saveWeatherReading`, `latestReading`, `freshReading`, `todaysAdvice`, `weatherAdjustedWaterGoal` |
| `workRepo.ts` | `logWork`, `deleteWork`, `workForDate`, `workSummary`, `avgWorkHours` |

## Stores (zustand) (15)

| Module | Exports |
|---|---|
| `alcoholStore.ts` | `useAlcoholStore` |
| `conditionsStore.ts` | `useConditionsStore` |
| `cycleStore.ts` | `useCycleStore` |
| `exerciseDraftStore.ts` | `useExerciseDraftStore` |
| `habitsStore.ts` | `useHabitsStore` |
| `hormonesStore.ts` | `useHormonesStore` |
| `nutritionStore.ts` | `useNutritionStore` |
| `sessionStore.ts` | `useSessionStore` |
| `sleepStore.ts` | `useSleepStore` |
| `smokingStore.ts` | `useSmokingStore` |
| `supplementsStore.ts` | `useSupplementsStore` |
| `usageStore.ts` | `useUsageStore` |
| `userStore.ts` | `useUserStore` |
| `walkStore.ts` | `useWalkStore` |
| `workStore.ts` | `useWorkStore` |

## Services (9)

| Module | Exports |
|---|---|
| `backgroundSteps.ts` | `DAILY_STEPS_TASK`, `syncTodaySteps`, `registerBackgroundSteps` |
| `cardExport.ts` | `exportCardPng`, `persistProfilePhoto`, `photoStillExists` |
| `foodVision.ts` | `hasFoodVisionKey`, `lastVisionDetail`, `identifyFoodInPhoto`, `researchNutrition`, `runDiagnostic`, `failureMessage` |
| `locationTracking.ts` | `ROUTE_TASK`, `requestLocationPermissions`, `isRouteTrackingActive`, `startRouteTracking`, `stopRouteTracking` |
| `pdfReport.ts` | `exportReport` |
| `sessionGps.ts` | `isGpsBusyWithWalk`, `startSessionGps`, `sessionGpsDistanceM`, `sessionGpsRoute`, `isSessionGpsActive`, `stopSessionGps` |
| `sessionNotifications.ts` | `requestNotificationPermission`, `showOngoingNotification`, `updateOngoingNotification`, `dismissOngoingNotification`, `dismissAllSessionNotifications` |
| `walkTracking.ts` | `requestWalkPermissions`, `getLiveSnapshot`, `reconcileSteps`, `getWalkPermissions`, `startWalkTracking`, `resumeWalkTracking`, `stopWalkTracking`, `cleanupOrphanWalk` |
| `weatherFetch.ts` | `fetchLiveWeather` |

## Components

### UI primitives (13)

| Component | Props |
|---|---|
| `Button` | `title`, `onPress`, `variant`, `size`, `icon`, `disabled`, `loading`, `fullWidth`, `style`, `color` |
| `Card` | `padded`, `accent` |
| `Chip` | `label`, `icon`, `active`, `color`, `onPress`, `small` |
| `Icon` | `icon`, `def`, `size`, `color` |
| `Input` | `label`, `suffix`, `multiline` |
| `PageHero` | `icon`, `color`, `title`, `subtitle`, `right` |
| `ProgressBar` | `progress`, `color`, `height`, `trackColor` |
| `ProgressRing` | `progress`, `size`, `strokeWidth`, `color`, `trackColor`, `label`, `value`, `children` |
| `Screen` | `children`, `scroll`, `padded`, `edges`, `contentStyle`, `refreshControl` |
| `SegmentedControl` | `options`, `value`, `onChange`, `scrollable`, `accent` |
| `StatTile` | `icon`, `label`, `value`, `sub`, `accent`, `flex` |
| `Text` | `variant`, `color`, `center` |
| `misc` | `title`, `action`, `onAction` |

### Composite components (16)

| Component | Props |
|---|---|
| `BadgeSvg` | `id`, `svg`, `size` |
| `ChallengeWheel` | `segments`, `winningIndex`, `size`, `settled`, `onSpinEnd`, `onPress` |
| `DigestionCard` | `meals`, `smokes`, `smokingEnabled`, `defaultIntensity`, `compact` |
| `EatenAtPicker` | `value`, `onChange`, `dateISO` |
| `EnergyBalanceCard` | `date` |
| `ErrorBoundary` | `children` |
| `ExerciseHero` | `iconKey`, `sessionType`, `size` |
| `ExerciseIllustration` | `pattern`, `sessionType`, `size`, `framed` |
| `ExercisePeek` | `exercises`, `accent`, `emptyLabel` |
| `LevelPicker` | `compact`, `color` |
| `MealRoutineBar` | `mealType`, `date`, `onChanged` |
| `PostSessionCard` | `endedAt`, `strain`, `margins`, `compact`, `title` |
| `RouteMap` | `route`, `height`, `color`, `markers` |
| `RpeGuide` | — |
| `StreakMeter` | `streak` |
| `WeatherCard` | `plannedActiveMin` |

## Data catalogues — `src/data` (18 files)

| File | Lines | Exports |
|---|---|---|
| `achievements.ts` | 174 | `ACHIEVEMENT_CATEGORIES`, `ACHIEVEMENTS` |
| `badgeImages.ts` | 141 | `BADGE_IMAGES` |
| `beverages.ts` | 72 | `BEVERAGE_PRESETS`, `WATER_QUICK_ADD`, `CAFFEINE_SOFT_LIMIT_MG` |
| `challenges.ts` | 146 | `DIFFICULTY_POINTS`, `DIFFICULTY_LABEL`, `DIFFICULTY_COLOR`, `CHALLENGES`, `findChallenge`, `CATEGORY_LABEL` |
| `changelog.ts` | 855 | `CHANGELOG`, `APP_RELEASE`, `APP_RELEASE_DATE` |
| `exercises.ts` | 2467 | `SUB_MUSCLE_LABELS`, `WARMUPS_BY_MUSCLE`, `PATTERN_CUES`, `EXERCISE_LIBRARY`, `PRAYER_EXERCISE_MINUTES`, `MUSCLE_GROUPS` |
| `foodComposites.ts` | 227 | `FOOD_COMPOSITES` |
| `foodMicros.ts` | 348 | `FOOD_MICROS` |
| `foods-tunisian.ts` | 366 | `TUNISIAN_FOODS` |
| `foods.ts` | 304 | `LIQUID_CATEGORIES`, `LIQUID_FOOD_IDS`, `formOf`, `FOOD_DB`, `SEARCH_FOOD_DB`, `FOODS_WITH_MICROS` |
| `nicotineProducts.ts` | 150 | `NICOTINE_PRODUCTS`, `findNicotineProduct`, `DEFAULT_PRODUCT_KEY`, `NICOTINE_GROUPS` |
| `programs.ts` | 777 | `LEVEL_LABEL`, `PROGRAMS` |
| `specialDietPlans.ts` | 401 | `SPECIAL_DIET_BUILDS` |
| `specialPrograms.ts` | 2440 | `SPECIAL_CATEGORY_META`, `SPECIAL_PROGRAMS`, `SPECIAL_CATEGORY_ORDER` |
| `splits.ts` | 240 | `SPLITS` |
| `subMuscleTags.ts` | 280 | `SUB_MUSCLE_TAGS` |
| `supplements.ts` | 301 | `EVIDENCE_LABEL`, `EVIDENCE_COLOR`, `SUPPLEMENTS` |
| `trainingMethods.ts` | 845 | `TRAINING_METHODS`, `EFFORT_LABEL` |


---

## Appendix B — how to read this

- **Route** is the name in `src/navigation/types.ts`; params are shown in braces.
- Figures name their source function so a redesign can move a number without
  losing where it came from.
- Constants are quoted from the code; if a threshold matters to a design
  decision, it is the real one.

*Generated from the v2.64 source tree.*