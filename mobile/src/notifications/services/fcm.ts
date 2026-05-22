import messaging from '@react-native-firebase/messaging';
import { notificationApi } from '../api/notificationApi';

/**
 * FCM integration. All calls are wrapped so a device without Google Play
 * services (or a denied permission) degrades gracefully — the in-app inbox +
 * socket still work, just without OS-level push.
 */

export async function requestPushPermission(): Promise<boolean> {
  try {
    const status = await messaging().requestPermission();
    return (
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

/** Fetch the device token and register it with the backend. */
export async function registerDeviceToken(): Promise<string | null> {
  try {
    if (!(await requestPushPermission())) return null;
    const token = await messaging().getToken();
    if (token) await notificationApi.registerDevice(token);
    return token;
  } catch {
    return null;
  }
}

export async function unregisterDeviceToken(): Promise<void> {
  try {
    const token = await messaging().getToken();
    if (token) await notificationApi.unregisterDevice(token);
  } catch {
    /* best-effort on logout */
  }
}

/** Keep the backend in sync when FCM rotates the token. Returns an unsubscribe. */
export function onTokenRefresh(): () => void {
  return messaging().onTokenRefresh((token) => {
    void notificationApi.registerDevice(token);
  });
}

/** Foreground messages (OS shows nothing) — surface via the provided callback. */
export function onForegroundMessage(cb: (title?: string, body?: string) => void): () => void {
  return messaging().onMessage(async (msg) => {
    cb(msg.notification?.title, msg.notification?.body);
  });
}
