import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import CustomHeader from '../components/common/CustomHeader';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { PackageIcon, SparklesIcon, UserIcon } from '@hugeicons/core-free-icons';
import { useNotifications, AppNotification } from '../context/NotificationContext';
import { EmptyState } from '../components/ui';

const iconForType = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('custom')) return SparklesIcon;
  if (t.includes('regist') || t.includes('business') || t.includes('approve') || t.includes('login'))
    return UserIcon;
  return PackageIcon; // orders + default
};

const timeAgo = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr).getTime();
  if (isNaN(d)) return '';
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const Notifications = () => {
  const { notifications, unreadCount, loading, refresh, markRead, markAllRead } =
    useNotifications();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const renderItem = ({ item }: { item: AppNotification }) => {
    const unread = !item.is_read || item.is_read === 0;
    return (
      <TouchableOpacity
        style={[styles.card, unread && styles.cardUnread]}
        activeOpacity={0.8}
        onPress={() => unread && markRead(item.id)}
      >
        <View style={[styles.iconWrap, unread ? styles.iconUnread : styles.iconRead]}>
          <HugeiconsIcon
            icon={iconForType(item.type)}
            size={20}
            color={unread ? '#5D0829' : '#C09E83'}
            strokeWidth={1.8}
          />
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.msg} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
        </View>
        {unread ? <View style={styles.dot} /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Notifications" showCart={false} showBell={false} />

      <FlatList
        data={notifications}
        keyExtractor={(n) => String(n.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        ListHeaderComponent={
          notifications.length > 0 && unreadCount > 0 ? (
            <View style={styles.headerRow}>
              <Text style={styles.headerCount}>{unreadCount} unread</Text>
              <TouchableOpacity onPress={markAllRead}>
                <Text style={styles.markAll}>Mark all read</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon={PackageIcon}
            title="No notifications yet"
            subtitle="Order updates and account alerts will show up here."
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30, flexGrow: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerCount: { color: '#8A7A80', fontSize: 13, fontFamily: 'GlorifyDEMO' },
  markAll: { color: '#5D0829', fontSize: 13, fontWeight: '700', fontFamily: 'GlorifyDEMO' },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE3D3',
    padding: 13,
    marginBottom: 10,
  },
  cardUnread: {
    borderColor: 'rgba(192,158,131,0.7)',
    backgroundColor: '#FFFDF9',
    shadowColor: '#5D0829',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconUnread: { backgroundColor: '#F6ECDD' },
  iconRead: { backgroundColor: '#F7F1E8' },
  body: { flex: 1 },
  title: { color: '#2A1A20', fontSize: 14.5, fontWeight: '800', fontFamily: 'GlorifyDEMO' },
  msg: { color: '#7a6a70', fontSize: 12.5, marginTop: 2, lineHeight: 17, fontFamily: 'GlorifyDEMO' },
  time: { color: '#b0a39a', fontSize: 11, marginTop: 5, fontFamily: 'GlorifyDEMO' },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#5D0829',
    marginLeft: 8,
    marginTop: 4,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 90 },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F9F2E7',
    borderWidth: 1,
    borderColor: '#EADBC8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { color: '#5D0829', fontSize: 18, fontWeight: '700', fontFamily: 'GlorifyDEMO' },
  emptySub: {
    color: '#8A7A80',
    fontSize: 13,
    fontFamily: 'GlorifyDEMO',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 19,
  },
});

export default Notifications;
