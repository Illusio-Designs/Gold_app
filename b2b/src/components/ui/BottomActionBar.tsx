import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing, FONT, fontSize, shadows } from '../../theme/tokens';

interface BottomActionBarProps {
  info?: { label: string; value: string };
  children: React.ReactNode; // usually a Button
  style?: StyleProp<ViewStyle>;
}

// Sticky bottom CTA container. Optional left info column (e.g. "Net weight · 3.8 g")
// plus the action(s) on the right. Replaces the per-screen inline bottom bars.
const BottomActionBar: React.FC<BottomActionBarProps> = ({ info, children, style }) => (
  <View style={[styles.bar, shadows.bar, style]}>
    {info ? (
      <View style={styles.info}>
        <Text style={styles.k}>{info.label}</Text>
        <Text style={styles.v} numberOfLines={1}>{info.value}</Text>
      </View>
    ) : null}
    <View style={styles.actions}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingTop: 11,
    paddingBottom: 15,
  },
  info: { flex: 1 },
  k: { fontFamily: FONT, fontSize: fontSize.caption, color: colors.muted },
  v: { fontFamily: FONT, fontSize: fontSize.subtitle, color: colors.ink, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
});

export default BottomActionBar;
