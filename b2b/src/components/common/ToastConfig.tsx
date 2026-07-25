import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  CheckmarkCircle02Icon,
  Alert02Icon,
  InformationCircleIcon,
} from '@hugeicons/core-free-icons';
import { colors, radius, FONT } from '../../theme/tokens';

// Amrut-branded toast cards. The app calls Toast.show({ type: 'success' | 'error'
// | 'info', text1, text2 }) all over, but nothing rendered because <Toast /> was
// never mounted and there was no config. These cards match the maroon/cream look:
// a cream card with a colored accent rail + icon, so a checkout error (or any
// toast) is actually visible instead of silently swallowed.
type ToastProps = {
  text1?: string;
  text2?: string;
};

const Card: React.FC<{
  accent: string;
  icon: any;
  text1?: string;
  text2?: string;
}> = ({ accent, icon, text1, text2 }) => (
  <View style={styles.card}>
    <View style={[styles.rail, { backgroundColor: accent }]} />
    <View style={[styles.iconWrap, { backgroundColor: accent }]}>
      <HugeiconsIcon icon={icon} size={20} color={colors.cream} strokeWidth={2} />
    </View>
    <View style={styles.textWrap}>
      {text1 ? (
        <Text style={styles.title} numberOfLines={1}>
          {text1}
        </Text>
      ) : null}
      {text2 ? (
        <Text style={styles.body} numberOfLines={3}>
          {text2}
        </Text>
      ) : null}
    </View>
  </View>
);

export const toastConfig = {
  success: ({ text1, text2 }: ToastProps) => (
    <Card accent={colors.success} icon={CheckmarkCircle02Icon} text1={text1} text2={text2} />
  ),
  error: ({ text1, text2 }: ToastProps) => (
    <Card accent={colors.danger} icon={Alert02Icon} text1={text1} text2={text2} />
  ),
  info: ({ text1, text2 }: ToastProps) => (
    <Card accent={colors.maroon} icon={InformationCircleIcon} text1={text1} text2={text2} />
  ),
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '92%',
    minHeight: 60,
    backgroundColor: colors.creamSoft,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingRight: 16,
    overflow: 'hidden',
    // premium float shadow
    shadowColor: colors.maroon900,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rail: {
    width: 5,
    alignSelf: 'stretch',
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: FONT,
    fontSize: 14.5,
    color: colors.ink,
    marginBottom: 2,
  },
  body: {
    fontFamily: FONT,
    fontSize: 12.5,
    color: colors.muted,
    lineHeight: 17,
  },
});

export default toastConfig;
