import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  StyleProp,
  KeyboardTypeOptions,
} from 'react-native';
import { colors, radius, spacing, FONT, fontSize } from '../../theme/tokens';

interface LabeledFieldProps {
  label: string;
  value?: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

// Labeled bordered input on the cream field background used across forms.
const LabeledField: React.FC<LabeledFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType,
  multiline = false,
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  right,
  style,
}) => (
  <View style={[styles.wrap, style]}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.field, multiline && styles.multiline, !editable && styles.readonly]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        editable={editable}
        keyboardType={keyboardType}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
      />
      {right}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  label: {
    fontFamily: FONT,
    fontSize: fontSize.label,
    color: colors.muted,
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.creamSoft,
    paddingHorizontal: 13,
    minHeight: 48,
  },
  multiline: { minHeight: 90, alignItems: 'flex-start', paddingVertical: 10 },
  readonly: { opacity: 0.75 },
  input: {
    flex: 1,
    fontFamily: FONT,
    fontSize: fontSize.body,
    color: colors.ink,
    paddingVertical: 10,
  },
});

export default LabeledField;
