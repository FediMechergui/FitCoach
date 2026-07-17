# Changelog

Patch notes for FitCoach. The in-app **Profile → What's new** mirrors this from
[`src/data/changelog.ts`](src/data/changelog.ts) (the source of truth).

Over-the-air releases are published with `npm run release` (see the README), which
tags the release in git and ships the update via EAS to installed apps — so the
app's **Profile → App version** always reflects the latest and shows "Up to date ✓".

---

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
