import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerFcmToken } from './Api';

// Firebase messaging is accessed defensively: the native module may be missing
// or Firebase may not be initialised on a given device/build. EVERY call is
// wrapped so a failure degrades gracefully (push simply off) instead of
// crashing the app on launch.
function messagingInstance(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-firebase/messaging').default;
    return mod ? mod() : null;
  } catch (e) {
    console.log('[push] messaging unavailable:', (e as any)?.message);
    return null;
  }
}

function messagingStatic(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@react-native-firebase/messaging').default;
  } catch {
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
    const m = messagingStatic();
    const inst = messagingInstance();
    if (!m || !inst) return false;
    const status = await inst.requestPermission();
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
  try {
    const inst = messagingInstance();
    if (!inst) return null;

    const authToken = await AsyncStorage.getItem('accessToken');
    if (!authToken) return null; // only register for logged-in users

    const token = await inst.getToken();
    if (!token) return null;

    const stored = await AsyncStorage.getItem('fcmToken');
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

// Ask permission + register the token (used after login and on app start for an
// already-logged-in user). Never throws.
export async function initPushForUser(): Promise<void> {
  try {
    const ok = await requestNotificationPermission();
    if (ok) await registerDeviceToken();
  } catch (e) {
    console.log('[push] initPushForUser error:', (e as any)?.message);
  }
}

type MessageHandler = (msg: { title?: string; body?: string; data?: any }) => void;

// Subscribe to foreground messages + token refresh. Returns an unsubscribe fn.
// Any failure yields a no-op unsubscribe instead of throwing.
export function onForegroundMessage(handler: MessageHandler): () => void {
  try {
    const inst = messagingInstance();
    if (!inst) return () => {};
    const unsubMsg = inst.onMessage(async (remoteMessage: any) => {
      handler({
        title: remoteMessage?.notification?.title,
        body: remoteMessage?.notification?.body,
        data: remoteMessage?.data,
      });
    });
    const unsubRefresh = inst.onTokenRefresh(async () => {
      try {
        await AsyncStorage.removeItem('fcmToken');
        registerDeviceToken();
      } catch {}
    });
    return () => {
      try { unsubMsg && unsubMsg(); } catch {}
      try { unsubRefresh && unsubRefresh(); } catch {}
    };
  } catch (e) {
    console.log('[push] onForegroundMessage error:', (e as any)?.message);
    return () => {};
  }
}

// Fire `handler` when a notification is tapped to open the app (background or
// cold start). Never throws.
export function onNotificationOpened(handler: (data: any) => void): () => void {
  try {
    const inst = messagingInstance();
    if (!inst) return () => {};
    const unsub = inst.onNotificationOpenedApp((remoteMessage: any) => {
      if (remoteMessage) handler(remoteMessage?.data || {});
    });
    inst
      .getInitialNotification()
      .then((remoteMessage: any) => {
        if (remoteMessage) handler(remoteMessage?.data || {});
      })
      .catch(() => {});
    return () => {
      try { unsub && unsub(); } catch {}
    };
  } catch (e) {
    console.log('[push] onNotificationOpened error:', (e as any)?.message);
    return () => {};
  }
}

// Clear the stored token on logout so the next user re-registers cleanly.
export async function clearDeviceToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem('fcmToken');
  } catch {}
}
