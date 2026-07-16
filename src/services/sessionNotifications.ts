import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Sticky "session in progress" notifications for walks, runs and training
 * sessions. The notification stays pinned in the bar (Android `sticky`) while a
 * session is active so the user always knows tracking is live, and is dismissed
 * on finish/discard.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = 'active-session';
let channelReady = false;
const activeIds: Record<string, string> = {};

async function ensureChannel(): Promise<void> {
  if (channelReady || Platform.OS !== 'android') {
    channelReady = true;
    return;
  }
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Active session',
      importance: Notifications.AndroidImportance.LOW, // silent, no heads-up popup
      vibrationPattern: [0],
      enableVibrate: false,
      showBadge: false,
    });
    channelReady = true;
  } catch {
    // channel creation is best-effort
  }
}

/** Ask for notification permission (Android 13+ requires it at runtime). */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    await ensureChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

/** Show (or replace) the sticky notification for a session kind. */
export async function showOngoingNotification(key: string, title: string, body: string): Promise<void> {
  try {
    const ok = await requestNotificationPermission();
    if (!ok) return;
    if (activeIds[key]) {
      await Notifications.dismissNotificationAsync(activeIds[key]).catch(() => {});
      delete activeIds[key];
    }
    activeIds[key] = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sticky: true, // Android: not swipe-dismissable while the session runs
        autoDismiss: false,
        color: '#4F8CFF',
      },
      trigger: Platform.OS === 'android' ? ({ channelId: CHANNEL_ID } as never) : null,
    });
  } catch {
    // notifications are a convenience — never block the session on them
  }
}

/** Dismiss the sticky notification for a session kind. */
export async function dismissOngoingNotification(key: string): Promise<void> {
  try {
    if (activeIds[key]) {
      await Notifications.dismissNotificationAsync(activeIds[key]);
      delete activeIds[key];
    }
  } catch {
    // ignore
  }
}

/** Clear anything left over from a crash/kill (called once at startup). */
export async function dismissAllSessionNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch {
    // ignore
  }
}
