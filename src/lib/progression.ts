/**
 * Progression — experience, level and titles.
 *
 * Experience is never stored and never awarded by a tap. It is COMPUTED, every
 * time, from the record the app already keeps: sessions finished, minutes
 * trained, records set, challenges kept, badges earned. Delete a session and
 * its experience goes with it; restore a backup and the level is what the
 * record says it is. There is no counter to drift and nothing to farm by
 * opening a screen.
 *
 * A level is the long game — it only ever asks "how much have you done". The
 * strength rank (lib/ranks) asks "how strong are you now". Two different
 * questions, deliberately not merged into one number.
 *
 * Everything here is pure.
 */

export interface XpInputs {
  /** finished training sessions, all types */
  sessions: number;
  /** minutes inside those sessions */
  sessionMinutes: number;
  /** personal records set */
  prs: number;
  /** tracked walks and runs */
  walks: number;
  /** points EARNED from daily challenges and weekly quests (spending never takes experience away) */
  challengePoints: number;
  /** badges unlocked */
  badges: number;
  /** rest days taken on purpose */
  restDays: number;
  /** path stages graduated */
  pathStages: number;
  /** distinct days the app was checked in on */
  checkInDays: number;
}

export const XP_RULES = {
  session: 25,
  /** per ten minutes trained, capped per session on average by `minutesCapPerSession` */
  perTenMinutes: 5,
  minutesCapPerSession: 120,
  pr: 20,
  walk: 10,
  /** one experience point per challenge point earned */
  challengePoint: 1,
  badge: 40,
  restDay: 5,
  pathStage: 150,
  checkIn: 2,
} as const;

export interface XpLine {
  key: keyof XpInputs;
  label: string;
  count: number;
  xp: number;
}

/** Where the experience came from, line by line — the screen shows its working. */
export function xpBreakdown(i: XpInputs): XpLine[] {
  const minutes = Math.min(Math.max(0, i.sessionMinutes), Math.max(0, i.sessions) * XP_RULES.minutesCapPerSession);
  const n = (v: number) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
  return [
    { key: 'sessions', label: 'Sessions finished', count: n(i.sessions), xp: n(i.sessions) * XP_RULES.session },
    { key: 'sessionMinutes', label: 'Minutes trained', count: n(minutes), xp: Math.floor(n(minutes) / 10) * XP_RULES.perTenMinutes },
    { key: 'prs', label: 'Personal records', count: n(i.prs), xp: n(i.prs) * XP_RULES.pr },
    { key: 'walks', label: 'Walks and runs', count: n(i.walks), xp: n(i.walks) * XP_RULES.walk },
    { key: 'challengePoints', label: 'Challenge and quest points', count: n(i.challengePoints), xp: n(i.challengePoints) * XP_RULES.challengePoint },
    { key: 'badges', label: 'Badges earned', count: n(i.badges), xp: n(i.badges) * XP_RULES.badge },
    { key: 'pathStages', label: 'Path stages graduated', count: n(i.pathStages), xp: n(i.pathStages) * XP_RULES.pathStage },
    { key: 'restDays', label: 'Rest days taken', count: n(i.restDays), xp: n(i.restDays) * XP_RULES.restDay },
    { key: 'checkInDays', label: 'Days checked in', count: n(i.checkInDays), xp: n(i.checkInDays) * XP_RULES.checkIn },
  ];
}

export const totalXp = (i: XpInputs): number => xpBreakdown(i).reduce((s, l) => s + l.xp, 0);

/** Experience needed to REACH a level. Level 1 is free; each level costs 100 more than the last. */
export function xpForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return 50 * n * (n - 1);
}

export const MAX_LEVEL = 99;

export interface LevelState {
  level: number;
  xp: number;
  /** experience at which this level began, and the next begins */
  floor: number;
  next: number | null;
  /** 0..1 through the current level */
  progress: number;
  toNext: number | null;
}

export function levelFromXp(raw: number): LevelState {
  const xp = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
  // Invert 50·n·(n−1) ≤ xp.
  let level = Math.floor((1 + Math.sqrt(1 + (4 * xp) / 50)) / 2);
  level = Math.min(MAX_LEVEL, Math.max(1, level));
  while (level < MAX_LEVEL && xpForLevel(level + 1) <= xp) level++;
  while (level > 1 && xpForLevel(level) > xp) level--;
  const floor = xpForLevel(level);
  const next = level >= MAX_LEVEL ? null : xpForLevel(level + 1);
  return {
    level,
    xp,
    floor,
    next,
    progress: next == null ? 1 : Math.min(1, Math.max(0, (xp - floor) / (next - floor))),
    toNext: next == null ? null : next - xp,
  };
}

// ── Titles ───────────────────────────────────────────────────────────────────

/** What a title is judged on — a small, honest summary of the record. */
export interface TitleFacts {
  level: number;
  sessions: number;
  bestTrainingStreak: number;
  challengesCompleted: number;
  hardChallengesCompleted: number;
  badges: number;
  /** tier index on the Carthage ladder (0 sand … 7 hannibal); -1 when unranked */
  overallTier: number;
  /** the best tier any single lift has reached; -1 when unranked */
  bestLiftTier: number;
  walks: number;
  pathStages: number;
  tunisianShare7d: number;
  restDays: number;
}

export interface TitleDef {
  key: string;
  name: string;
  /** what the word means, for the ones said in derja */
  meaning?: string;
  /** how it is earned, in one line */
  how: string;
  earned: (f: TitleFacts) => boolean;
}

/**
 * Titles are worn, one at a time, under the name. Some are said the way they
 * are said at a Tunisian gym door; each of those carries its meaning.
 */
export const TITLES: TitleDef[] = [
  { key: 'newcomer', name: 'Newcomer', how: 'Yours from the first day.', earned: () => true },
  { key: 'regular', name: 'Regular', how: 'Finish 10 sessions.', earned: (f) => f.sessions >= 10 },
  { key: 'mel-houma', name: 'Mel Houma', meaning: 'from the neighbourhood — a familiar face', how: 'Finish 25 sessions.', earned: (f) => f.sessions >= 25 },
  { key: 'iron-habit', name: 'Iron Habit', how: 'Hold a 14-day training streak.', earned: (f) => f.bestTrainingStreak >= 14 },
  { key: 'well-rested', name: 'Well Rested', how: 'Take 10 rest days on purpose.', earned: (f) => f.restDays >= 10 },
  { key: 'salt-and-sea', name: 'Salt and Sea', how: 'Track 20 walks or runs.', earned: (f) => f.walks >= 20 },
  { key: 'heritage-table', name: 'Heritage Table', how: 'Eat mostly Tunisian for a week (half your logged food or more).', earned: (f) => f.tunisianShare7d >= 0.5 },
  { key: 'harissa-heart', name: 'Harissa Heart', how: 'Complete 10 hard challenges.', earned: (f) => f.hardChallengesCompleted >= 10 },
  { key: 'batal', name: 'Batal', meaning: 'champion', how: 'Complete 50 daily challenges.', earned: (f) => f.challengesCompleted >= 50 },
  { key: 'collector', name: 'Collector', how: 'Earn 50 badges.', earned: (f) => f.badges >= 50 },
  { key: 'pathfinder', name: 'Pathfinder', how: 'Graduate a stage of any path.', earned: (f) => f.pathStages >= 1 },
  { key: 'olive-keeper', name: 'Olive Keeper', how: 'Reach Olive overall on the ladder.', earned: (f) => f.overallTier >= 3 },
  { key: 'maalem', name: 'Maalem', meaning: 'master of a craft', how: 'Take any single lift to Marble.', earned: (f) => f.bestLiftTier >= 5 },
  { key: 'rayes', name: 'Rayes', meaning: 'captain', how: 'Reach level 20.', earned: (f) => f.level >= 20 },
  { key: 'carthaginian', name: 'Carthaginian', how: 'Reach Carthage overall on the ladder.', earned: (f) => f.overallTier >= 6 },
  { key: 'hannibal', name: 'Hannibal', how: 'Reach Hannibal overall on the ladder.', earned: (f) => f.overallTier >= 7 },
];

export const DEFAULT_TITLE = 'newcomer';
export const findTitle = (key: string | null | undefined): TitleDef | undefined => TITLES.find((t) => t.key === key);

export function earnedTitles(f: TitleFacts): TitleDef[] {
  return TITLES.filter((t) => {
    try {
      return t.earned(f);
    } catch {
      return false;
    }
  });
}

/** The title actually worn: the chosen one if it is still earned, else the highest earned. */
export function wornTitle(chosen: string | null | undefined, f: TitleFacts): TitleDef {
  const earned = earnedTitles(f);
  const pick = earned.find((t) => t.key === chosen);
  return pick ?? earned[earned.length - 1] ?? TITLES[0];
}

/** How many badges a profile may pin. */
export const SHOWCASE_SLOTS = 3;

/** Keep only ids that are unlocked, unique, and within the slots. */
export function sanitizeShowcase(ids: unknown, unlocked: Set<number>): number[] {
  if (!Array.isArray(ids)) return [];
  const out: number[] = [];
  for (const v of ids) {
    const id = Number(v);
    if (Number.isInteger(id) && unlocked.has(id) && !out.includes(id)) out.push(id);
    if (out.length >= SHOWCASE_SLOTS) break;
  }
  return out;
}
