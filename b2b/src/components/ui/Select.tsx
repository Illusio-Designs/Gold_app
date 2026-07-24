import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { colors, radius, spacing, FONT, fontSize } from '../../theme/tokens';

interface SelectProps {
  label: string;
  value?: string;
  placeholder?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

// Labeled dropdown trigger (opens a picker on press). Matches LabeledField styling.
const Select: React.FC<SelectProps> = ({ label, value, placeholder = 'Select', onPress, style }) => (
  <View style={[styles.wrap, style]}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.field} activeOpacity={0.7} onPress={onPress}>
      <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
        {value || placeholder}
      </Text>
      <HugeiconsIcon icon={ArrowDown01Icon} size={17} color={colors.maroon} strokeWidth={1.9} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  label: { fontFamily: FONT, fontSize: fontSize.label, color: colors.muted, marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.creamSoft,
    paddingHorizontal: 13,
    minHeight: 48,
  },
  value: { flex: 1, fontFamily: FONT, fontSize: fontSize.body, color: colors.ink },
  placeholder: { color: colors.muted },
});

export default Select;
