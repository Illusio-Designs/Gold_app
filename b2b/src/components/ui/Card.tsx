import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, spacing, shadows } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  padded?: boolean;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Generic white surface with the brand border + optional soft shadow.
const Card: React.FC<CardProps> = ({ children, padded = true, elevated = false, style }) => (
  <View
    style={[
      styles.card,
      padded && styles.padded,
      elevated ? shadows.card : null,
      style,
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
  },
  padded: { padding: spacing.md },
});

export default Card;
