# Changelog

Patch notes for FitCoach. The in-app **Profile → What's new** mirrors this from
[`src/data/changelog.ts`](src/data/changelog.ts) (the source of truth).

Over-the-air releases are published with `npm run release` (see the README), which
ships the update via EAS to installed apps, tags the release in git, **and publishes
a matching GitHub Release** (from the notes below) — so the repo's Releases tab and
the app's **Profile → App version** both reflect the latest and show "Up to date ✓".

---

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
