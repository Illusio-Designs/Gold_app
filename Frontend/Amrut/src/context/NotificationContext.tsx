import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/Api';
import {
  initPushForUser,
  onForegroundMessage,
  clearDeviceToken,
} from '../services/pushNotifications';

export type AppNotification = {
  id: number;
  title: string;
  body: string;
  type: string;
  data?: any;
  created_at: string;
  is_read: number | boolean;
};

type BannerState = { visible: boolean; title: string; body: string };

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  banner: BannerState;
  hideBanner: () => void;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<BannerState>({ visible: false, title: '', body: '' });
  const bannerTimer = useRef<any>(null);

  const getAuth = async () => {
    const userId = await AsyncStorage.getItem('userId');
    const token = await AsyncStorage.getItem('accessToken');
    return { userId, token };
  };

  const refresh = useCallback(async () => {
    try {
      const { userId, token } = await getAuth();
      if (!userId || !token) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      setLoading(true);
      const [listRes, countRes] = await Promise.all([
        getUserNotifications(userId, token).catch(() => null),
        getUnreadCount(userId, token).catch(() => null),
      ]);
      if (listRes?.notifications) setNotifications(listRes.notifications);
      if (countRes && typeof countRes.unreadCount === 'number') {
        setUnreadCount(countRes.unreadCount);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: number) => {
    const { token } = await getAuth();
    if (!token) return;
    // optimistic
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n)));
    setUnreadCount(c => Math.max(0, c - 1));
    try {
      await markNotificationAsRead(id, token);
    } catch {
      refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    const { userId, token } = await getAuth();
    if (!userId || !token) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
    try {
      await markAllNotificationsAsRead(userId, token);
    } catch {
      refresh();
    }
  }, [refresh]);

  const showBanner = useCallback((title: string, body: string) => {
    setBanner({ visible: true, title, body });
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(
      () => setBanner(b => ({ ...b, visible: false })),
      4000,
    );
  }, []);

  const hideBanner = useCallback(() => setBanner(b => ({ ...b, visible: false })), []);

  const onLogin = useCallback(async () => {
    await initPushForUser();
    await refresh();
  }, [refresh]);

  const onLogout = useCallback(async () => {
    await clearDeviceToken();
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // On mount: load for an already-logged-in user, register push, and listen
  // for foreground messages (banner + badge bump).
  useEffect(() => {
    initPushForUser();
    refresh();
    const unsub = onForegroundMessage(msg => {
      showBanner(msg.title || 'Notification', msg.body || '');
      setUnreadCount(c => c + 1);
      refresh();
    });

    // Real-time via socket, so the bell updates live even without an FCM push
    // (e.g. admin changes an order status while the app is open).
    let socketCleanup: (() => void) | undefined;
    try {
      const SocketService = require('../services/SocketService').default;
      const onOrder = (payload: any) => {
        const order = payload?.order || payload;
        const status = order?.status ? String(order.status) : 'updated';
        const idText = order?.id ? ` #${order.id}` : '';
        showBanner('Order update', `Your order${idText} is now ${status}.`);
        refresh();
      };
      const id1 = SocketService.addEventListener('order-status-updated', onOrder);
      const id2 = SocketService.addEventListener('notification', () => refresh());
      socketCleanup = () => {
        SocketService.removeEventListener('order-status-updated', id1);
        SocketService.removeEventListener('notification', id2);
      };
    } catch (e) {
      // socket not available — in-app list still refreshes on open
    }

    // Refresh whenever the app returns to the foreground.
    const appStateSub = AppState.addEventListener('change', s => {
      if (s === 'active') refresh();
    });

    return () => {
      unsub();
      if (socketCleanup) socketCleanup();
      appStateSub.remove();
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
  }, [refresh, showBanner]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refresh,
        markRead,
        markAllRead,
        banner,
        hideBanner,
        onLogin,
        onLogout,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    // Safe fallback so screens using the hook never crash if the provider
    // isn't mounted (e.g. in isolated tests).
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      refresh: async () => {},
      markRead: async () => {},
      markAllRead: async () => {},
      banner: { visible: false, title: '', body: '' },
      hideBanner: () => {},
      onLogin: async () => {},
      onLogout: async () => {},
    };
  }
  return ctx;
};
