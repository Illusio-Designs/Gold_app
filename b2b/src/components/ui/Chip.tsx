import React from 'react';
import { Text, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { colors, radius, FONT, fontSize } from '../../theme/tokens';

type Tone = 'soft' | 'active';

interface ChipProps {
  label: string;
  tone?: Tone;
  style?: StyleProp<TextStyle>;
}

// Small inline tag for weight / purity / meta. `soft` = cream, `active` = maroon.
const Chip: React.FC<ChipProps> = ({ label, tone = 'soft', style }) => (
  <Text style={[styles.chip, tone === 'active' ? styles.active : styles.soft, style]}>
    {label}
  </Text>
);

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    fontFamily: FONT,
    fontSize: fontSize.caption,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
    borderWidth: 1,
  },
  soft: {
    color: colors.goldDeep,
    backgroundColor: colors.creamSoft,
    borderColor: colors.line,
  },
  active: {
    color: colors.cream,
    backgroundColor: colors.maroon,
    borderColor: colors.maroon,
  },
});

export default Chip;
