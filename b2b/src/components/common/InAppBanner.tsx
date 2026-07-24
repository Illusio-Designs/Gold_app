import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { PackageIcon } from '@hugeicons/core-free-icons';
import { useNotifications } from '../../context/NotificationContext';

// A brand banner that slides down from the top when a push arrives while the
// app is open. Tapping it (or waiting) dismisses it.
const InAppBanner: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  const insets = useSafeAreaInsets();
  const { banner, hideBanner } = useNotifications();
  const y = useRef(new Animated.Value(-160)).current;

  useEffect(() => {
    Animated.spring(y, {
      toValue: banner.visible ? 0 : -160,
      useNativeDriver: true,
      friction: 9,
      tension: 70,
    }).start();
  }, [banner.visible, y]);

  return (
    <Animated.View
      pointerEvents={banner.visible ? 'auto' : 'none'}
      style={[
        styles.wrap,
        { paddingTop: insets.top + 8, transform: [{ translateY: y }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => {
          hideBanner();
          onPress && onPress();
        }}
      >
        <View style={styles.icon}>
          <HugeiconsIcon icon={PackageIcon} size={20} color="#5D0829" strokeWidth={1.8} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>{banner.title}</Text>
          {banner.body ? (
            <Text style={styles.msg} numberOfLines={2}>{banner.body}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    zIndex: 1000,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEE3D3',
    shadowColor: '#5D0829',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 10,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F6ECDD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  body: { flex: 1 },
  title: { color: '#2A1A20', fontSize: 14.5, fontWeight: '800', fontFamily: 'GlorifyDEMO' },
  msg: { color: '#7a6a70', fontSize: 12.5, marginTop: 2, fontFamily: 'GlorifyDEMO' },
});

export default InAppBanner;
