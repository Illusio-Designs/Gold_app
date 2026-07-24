import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Animated, Easing } from 'react-native';

type SuccessOverlayProps = {
  visible: boolean;
  message?: string;
  onDone?: () => void;
  duration?: number;
};

/**
 * A brand-styled in-screen success animation (maroon circle + spring checkmark)
 * used in place of toast pop-ups for key confirmations like "OTP Verified".
 * Auto-dismisses after `duration` ms and calls `onDone`.
 */
const SuccessOverlay: React.FC<SuccessOverlayProps> = ({
  visible,
  message = 'Success',
  onDone,
  duration = 1400,
}) => {
  const scale = useRef(new Animated.Value(0)).current;
  const check = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0);
    check.setValue(0);
    opacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.timing(check, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    const t = setTimeout(() => onDone?.(), duration);
    return () => clearTimeout(t);
  }, [visible, duration, onDone, scale, check, opacity]);

  if (!visible) return null;

  const checkScale = check.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <View style={styles.circle}>
            <Animated.Text style={[styles.check, { transform: [{ scale: checkScale }] }]}>✓</Animated.Text>
          </View>
          <Text style={styles.msg}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30,4,15,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 210,
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#5D0829',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  circle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#5D0829',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  check: {
    color: '#FCE2BF',
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 46,
  },
  msg: {
    color: '#5D0829',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
    textAlign: 'center',
  },
});

export default SuccessOverlay;
