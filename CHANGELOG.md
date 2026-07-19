# Changelog

Patch notes for FitCoach. The in-app **Profile → What's new** mirrors this from
[`src/data/changelog.ts`](src/data/changelog.ts) (the source of truth).

Over-the-air releases are published with `npm run release` (see the README), which
ships the update via EAS to installed apps, tags the release in git, **and publishes
a matching GitHub Release** (from the notes below) — so the repo's Releases tab and
the app's **Profile → App version** both reflect the latest and show "Up to date ✓".

---

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
