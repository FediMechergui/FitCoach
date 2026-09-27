import type { ChallengeRequirement } from '@/data/challenges';
import { isSmokingEnabled } from './smokingRepo';
import { getStack } from './supplementsRepo';
import { getPrayerSettings } from './faithRepo';

/**
 * Which optional trackers are switched on — what the wheel and the weekly
 * quests may ask for. A tracker that cannot be read counts as off: an
 * impossible quest is worse than a missing one.
 */
export function enabledTrackers(): Partial<Record<ChallengeRequirement, boolean>> {
  const safe = (fn: () => boolean): boolean => {
    try {
      return fn();
    } catch {
      return false;
    }
  };
  return {
    smoking: safe(() => isSmokingEnabled()),
    prayer: safe(() => !!getPrayerSettings()?.enabled),
    supplements: safe(() => getStack().length > 0),
    sleep: true,
    nutrition: true,
  };
}
