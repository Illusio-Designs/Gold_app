import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Diamond01Icon } from '@hugeicons/core-free-icons';
import { ShimmerImage } from '../common/Motion';
import Chip from './Chip';
import { colors, radius, spacing, FONT, fontSize } from '../../theme/tokens';

interface ProductCardProps {
  name: string;
  weight?: string;
  imageUri?: string | null;
  fallbackIcon?: any;
  onPress?: () => void;
}

// Catalogue card: product image (or icon fallback) + name + weight chip + View.
// No price, no add-to-cart — B2B is quote-based.
const ProductCard: React.FC<ProductCardProps> = ({
  name,
  weight,
  imageUri,
  fallbackIcon = Diamond01Icon,
  onPress,
}) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
    <View style={styles.tile}>
      {imageUri ? (
        <ShimmerImage source={{ uri: imageUri }} style={styles.img} resizeMode="cover" />
      ) : (
        <HugeiconsIcon icon={fallbackIcon} size={58} color={colors.goldDeep} strokeWidth={1.5} />
      )}
    </View>
    <View style={styles.meta}>
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      {weight ? <Chip label={weight} style={styles.chip} /> : null}
      <View style={styles.viewBtn}>
        <Text style={styles.viewTxt}>View</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  tile: {
    aspectRatio: 1,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: { width: '100%', height: '100%' },
  meta: { padding: spacing.sm - 2 },
  name: { fontFamily: FONT, fontSize: fontSize.bodySm, color: colors.ink },
  chip: { marginTop: 5 },
  viewBtn: {
    marginTop: 10,
    backgroundColor: colors.maroon,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewTxt: { fontFamily: FONT, fontSize: fontSize.bodySm, color: colors.cream },
});

export default ProductCard;
