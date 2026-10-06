import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getLiveWalk } from '@/repositories/activityRepo';
import { crossedSplit, lapState, sessionGpsMarker, tickLaps } from '@/repositories/outdoorRepo';
import { lapEventText, formatClock, formatPaceS, type LapEvent } from '@/lib/gpsLaps';
import { splitLabel } from '@/lib/outdoorSettings';

/**
 * Alerts on the way — a split reached, a rep ended, the rest over.
 *
 * These are the only notifications in the app meant to be FELT: the sticky
 * session notification is deliberately silent, but "400 m — rest" has to
 * reach a runner whose phone is in a pocket. They go on their own channel,
 * with vibration, so muting one never mutes the other.
 *
 * `runOutdoorTick` is called from the background location task after every
 * batch of fixes, and from the screens every second. Both paths share the
 * same persisted state (repositories/outdoorRepo), so an alert fires once.
 */

const ALERT_CHANNEL = 'outdoor-alerts';
let channelReady = false;

async function ensureAlertChannel(): Promise<void> {
  if (channelReady || Platform.OS !== 'android') {
    channelReady = true;
    return;
  }
  try {
    await Notifications.setNotificationChannelAsync(ALERT_CHANNEL, {
      name: 'Splits & intervals',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 120, 250],
      enableVibrate: true,
      showBadge: false,
    });
    channelReady = true;
  } catch {
    // best effort
  }
}

export async function alertNow(title: string, body: string, opts: { foreground?: boolean } = {}): Promise<void> {
  try {
    /*
     * The buzz comes from the alert channel's own vibration pattern, never from
     * the Vibration API: an over-the-air update also runs on the older APK,
     * which was built without the VIBRATE permission, and calling the API there
     * throws in native code. The channel works on both.
     */
    void opts;
    await ensureAlertChannel();
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, color: '#33D9A6' },
      trigger: Platform.OS === 'android' ? ({ channelId: ALERT_CHANNEL } as never) : null,
    });
  } catch {
    // an alert is a convenience; tracking never depends on it
  }
}

/**
 * Advance laps and splits against the live trace, and announce what changed.
 * Returns the lap events so a screen can react (log the set, start the rest).
 */
export function runOutdoorTick(opts: { foreground?: boolean } = {}): LapEvent[] {
  let row;
  try {
    row = getLiveWalk();
  } catch {
    return [];
  }
  if (!row?.active || !row.startTime) return [];
  const now = Date.now();
  const distanceM = row.distanceM ?? 0;

  let routeLen = 0;
  // Laps belong to one session's trace; a stale state never ticks against a walk.
  const marker = sessionGpsMarker();
  const stored = lapState();
  const laps = stored && marker && marker.sessionId === stored.sessionId && row.activity === 'session' ? stored : null;
  if (laps) {
    // Only the lap engine needs the point count; skip the parse otherwise.
    try {
      routeLen = row.routeJson ? (JSON.parse(row.routeJson) as unknown[]).length : 0;
    } catch {
      routeLen = 0;
    }
  }
  const events = laps ? tickLaps({ now, distanceM, routeLen }) : [];
  for (const e of events) {
    const t = lapEventText(e, laps!.exerciseName, laps!.plan);
    void alertNow(t.title, t.body, opts);
  }

  // Splits belong to the whole trace; while laps run, the reps speak instead.
  if (!laps) {
    const split = crossedSplit(row.startTime, distanceM, now);
    if (split) {
      const pace = split.splitS / (split.splitM / 1000);
      void alertNow(
        `${splitLabel(split.index, split.splitM)} · ${formatPaceS(pace)} /km`,
        `${(distanceM / 1000).toFixed(2)} km in ${formatClock((now - row.startTime) / 1000)}`,
        opts
      );
    }
  }
  return events;
}
