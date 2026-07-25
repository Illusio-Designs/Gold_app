import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Search01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { colors, radius, spacing, FONT, fontSize, shadows } from '../../theme/tokens';

interface AnimatedSearchBarProps {
  hints?: string[];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  // Editable mode: render a real TextInput (used on the Search screen) so the
  // same bar works both as a tappable launcher (Home) and a live input (Search).
  editable?: boolean;
  value?: string;
  onChangeText?: (t: string) => void;
  onSubmitEditing?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const DEFAULT_HINTS = [
  "Search 'rings'",
  "Search 'temple haar'",
  "Search 'jhumka'",
  "Search 'kada'",
  "Search 'mangalsutra'",
];

// Premium search bar. Tappable placeholder that cycles suggestions (Home), or a
// live text input (Search) — same look either way.
const AnimatedSearchBar: React.FC<AnimatedSearchBarProps> = ({
  hints = DEFAULT_HINTS,
  onPress,
  style,
  editable = false,
  value,
  onChangeText,
  onSubmitEditing,
  placeholder = 'Search…',
  autoFocus = false,
}) => {
  const [idx, setIdx] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (editable || hints.length <= 1) return;
    const id = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setIdx((i) => (i + 1) % hints.length);
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      });
    }, 2400);
    return () => clearInterval(id);
  }, [hints, opacity, editable]);

  if (editable) {
    return (
      <View style={[styles.bar, shadows.card, style]}>
        <HugeiconsIcon icon={Search01Icon} size={18} color={colors.muted} strokeWidth={1.8} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          autoFocus={autoFocus}
          returnKeyType="search"
        />
        {value ? (
          <TouchableOpacity onPress={() => onChangeText && onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <HugeiconsIcon icon={Cancel01Icon} size={16} color={colors.muted} strokeWidth={1.9} />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.bar, shadows.card, style]}>
      <HugeiconsIcon icon={Search01Icon} size={18} color={colors.muted} strokeWidth={1.8} />
      <Animated.Text style={[styles.hint, { opacity }]} numberOfLines={1}>
        {hints[idx]}
      </Animated.Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
  },
  hint: { flex: 1, fontFamily: FONT, fontSize: fontSize.body, color: colors.muted },
  input: { flex: 1, fontFamily: FONT, fontSize: fontSize.body, color: colors.ink, paddingVertical: 0 },
});

export default AnimatedSearchBar;
