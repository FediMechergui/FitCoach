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
