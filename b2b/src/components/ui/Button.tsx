import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { colors, radius, spacing, FONT, fontSize } from '../../theme/tokens';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'md' | 'sm';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: any; // Hugeicons icon object
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

// The single button primitive for the app. Primary = maroon fill, outline =
// maroon border, ghost = text only. Use everywhere instead of hand-rolled CTAs.
const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const fg = isPrimary ? colors.cream : colors.maroon;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        isPrimary && styles.primary,
        isOutline && styles.outline,
        variant === 'ghost' && styles.ghost,
        fullWidth && styles.full,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icon ? (
            <HugeiconsIcon icon={icon} size={size === 'sm' ? 15 : 17} color={fg} strokeWidth={1.9} />
          ) : null}
          <Text
            style={[
              styles.text,
              { color: fg, fontSize: size === 'sm' ? fontSize.label : fontSize.bodySm },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: radius.md,
  },
  md: { paddingVertical: 13, paddingHorizontal: spacing.lg },
  sm: { paddingVertical: 8, paddingHorizontal: spacing.md },
  primary: { backgroundColor: colors.maroon },
  outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.maroon },
  ghost: { backgroundColor: colors.transparent },
  full: { flex: 1, alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
  text: { fontFamily: FONT },
});

export default Button;
