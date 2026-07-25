import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, spacing, FONT, fontSize } from '../../theme/tokens';
import FlagIN from './FlagIN';

interface PhoneFieldProps {
  label?: string;
  value?: string;
  onChangeText?: (t: string) => void;
  dialCode?: string;
  editable?: boolean;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}

// Phone input with the India flag + dial code prefix.
const PhoneField: React.FC<PhoneFieldProps> = ({
  label = 'Phone Number',
  value,
  onChangeText,
  dialCode = '+91',
  editable = true,
  placeholder = '98765 43210',
  style,
}) => (
  <View style={[styles.wrap, style]}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <View style={[styles.field, !editable && styles.readonly]}>
      <FlagIN />
      <Text style={styles.code}>{dialCode}</Text>
      <View style={styles.divider} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        editable={editable}
        keyboardType="phone-pad"
        maxLength={12}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  label: { fontFamily: FONT, fontSize: fontSize.label, color: colors.muted, marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.creamSoft,
    paddingHorizontal: 13,
    minHeight: 50,
  },
  readonly: { opacity: 0.75 },
  code: { fontFamily: FONT, fontSize: fontSize.body, color: colors.maroon },
  divider: { width: 1, height: 22, backgroundColor: colors.line },
  input: { flex: 1, fontFamily: FONT, fontSize: fontSize.body, color: colors.ink, paddingVertical: 12 },
});

export default PhoneField;
