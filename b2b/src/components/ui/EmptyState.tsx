import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { colors, spacing, FONT, fontSize } from '../../theme/tokens';

interface EmptyStateProps {
  icon?: any;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

// Centered empty placeholder for cart / orders / search with no results.
const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, action }) => (
  <View style={styles.wrap}>
    {icon ? (
      <View style={styles.iconWrap}>
        <HugeiconsIcon icon={icon} size={34} color={colors.goldDeep} strokeWidth={1.6} />
      </View>
    ) : null}
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    {action ? <View style={styles.action}>{action}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: spacing.xl },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { fontFamily: FONT, fontSize: fontSize.subtitle, color: colors.ink, textAlign: 'center' },
  subtitle: {
    fontFamily: FONT,
    fontSize: fontSize.bodySm,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
  },
  action: { marginTop: spacing.md },
});

export default EmptyState;
