import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { resolveCategoryIcon } from '../../utils/categoryIcons';
import { colors, FONT, fontSize } from '../../theme/tokens';

interface CategoryIconTileProps {
  name: string;
  iconName?: string;
  onPress?: () => void;
}

// Round "Shop by Category" tile rendering a category by its stored icon name.
const CategoryIconTile: React.FC<CategoryIconTileProps> = ({ name, iconName, onPress }) => (
  <TouchableOpacity style={styles.wrap} activeOpacity={0.8} onPress={onPress}>
    <View style={styles.circle}>
      <HugeiconsIcon icon={resolveCategoryIcon(iconName)} size={40} color={colors.goldDeep} strokeWidth={1.7} />
    </View>
    <Text style={styles.name} numberOfLines={1}>{name}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: 84, marginRight: 4 },
  circle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 8,
    fontFamily: FONT,
    fontSize: fontSize.label,
    color: colors.maroon,
    textAlign: 'center',
  },
});

export default CategoryIconTile;
