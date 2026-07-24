import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { colors, radius, spacing, FONT, fontSize, shadows } from '../../theme/tokens';

interface AnimatedSearchBarProps {
  hints?: string[];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_HINTS = [
  "Search 'rings'",
  "Search 'temple haar'",
  "Search 'jhumka'",
  "Search 'kada'",
  "Search 'mangalsutra'",
];

// Tappable header search whose placeholder cycles suggestions with a soft fade.
const AnimatedSearchBar: React.FC<AnimatedSearchBarProps> = ({
  hints = DEFAULT_HINTS,
  onPress,
  style,
}) => {
  const [idx, setIdx] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (hints.length <= 1) return;
    const id = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setIdx((i) => (i + 1) % hints.length);
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      });
    }, 2400);
    return () => clearInterval(id);
  }, [hints, opacity]);

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
});

export default AnimatedSearchBar;
