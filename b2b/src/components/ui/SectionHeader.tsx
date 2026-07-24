import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, FONT, fontSize } from '../../theme/tokens';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

// "Title + optional See all" row with the signature gold tick before the title.
const SectionHeader: React.FC<SectionHeaderProps> = ({ title, actionLabel, onAction }) => (
  <View style={styles.row}>
    <View style={styles.titleWrap}>
      <View style={styles.tick} />
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
    </View>
    {actionLabel ? (
      <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
        <Text style={styles.action}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  tick: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: colors.gold,
    marginRight: 9,
  },
  title: { fontFamily: FONT, fontSize: fontSize.subtitle, color: colors.ink, flex: 1 },
  action: { fontFamily: FONT, fontSize: fontSize.label, color: colors.maroon },
});

export default SectionHeader;
