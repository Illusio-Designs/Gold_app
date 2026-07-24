import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerFcmToken } from './Api';

// Firebase messaging is loaded lazily so a missing/native-unavailable module
// never crashes the app (e.g. in dev without Google Play services).
function getMessaging(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@react-native-firebase/messaging').default;
  } catch (e) {
    console.log('[push] messaging module unavailable:', (e as any)?.message);
    return null;
  }
}

// Ask the OS for permission to show notifications (Android 13+ needs the
// runtime POST_NOTIFICATIONS permission; iOS uses the Firebase prompt).
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          'android.permission.POST_NOTIFICATIONS' as any,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    }
    const messaging = getMessaging();
    if (!messaging) return false;
    const status = await messaging().requestPermission();
    const m = messaging;
    return (
      status === m.AuthorizationStatus.AUTHORIZED ||
      status === m.AuthorizationStatus.PROVISIONAL
    );
  } catch (e) {
    console.log('[push] permission error:', (e as any)?.message);
    return false;
  }
}

// Fetch the device FCM token and register it with the backend for this user.
export async function registerDeviceToken(): Promise<string | null> {
  const messaging = getMessaging();
  if (!messaging) return null;
  try {
    const authToken = await AsyncStorage.getItem('accessToken');
    if (!authToken) return null; // only register for logged-in users

    const token = await messaging().getToken();
    if (!token) return null;

    const stored = await AsyncStorage.getItem('fcmToken');
    // Re-register if the token changed (or was never sent).
    if (stored !== token) {
      await registerFcmToken(token, Platform.OS, authToken);
      await AsyncStorage.setItem('fcmToken', token);
      console.log('[push] token registered');
    }
    return token;
  } catch (e) {
    console.log('[push] registerDeviceToken error:', (e as any)?.message);
    return null;
  }
}

// Ask permission + register the token in one call (used right after login and
// on app start for an already-logged-in user).
export async function initPushForUser(): Promise<void> {
  const ok = await requestNotificationPermission();
  if (ok) await registerDeviceToken();
}

type MessageHandler = (msg: { title?: string; body?: string; data?: any }) => void;

// Subscribe to foreground messages + token refresh. Returns an unsubscribe fn.
export function onForegroundMessage(handler: MessageHandler): () => void {
  const messaging = getMessaging();
  if (!messaging) return () => {};
  const unsubMsg = messaging().onMessage(async (remoteMessage: any) => {
    handler({
      title: remoteMessage?.notification?.title,
      body: remoteMessage?.notification?.body,
      data: remoteMessage?.data,
    });
  });
  const unsubRefresh = messaging().onTokenRefresh(async () => {
    await AsyncStorage.removeItem('fcmToken');
    registerDeviceToken();
  });
  return () => {
    try { unsubMsg && unsubMsg(); } catch {}
    try { unsubRefresh && unsubRefresh(); } catch {}
  };
}

// Fire `handler` when a notification is tapped to open the app (from background
// or cold start).
export function onNotificationOpened(handler: (data: any) => void): () => void {
  const messaging = getMessaging();
  if (!messaging) return () => {};
  const unsub = messaging().onNotificationOpenedApp((remoteMessage: any) => {
    if (remoteMessage) handler(remoteMessage?.data || {});
  });
  messaging()
    .getInitialNotification()
    .then((remoteMessage: any) => {
      if (remoteMessage) handler(remoteMessage?.data || {});
    })
    .catch(() => {});
  return () => {
    try { unsub && unsub(); } catch {}
  };
}

// Clear the stored token on logout so the next user re-registers cleanly.
export async function clearDeviceToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem('fcmToken');
  } catch {}
}
