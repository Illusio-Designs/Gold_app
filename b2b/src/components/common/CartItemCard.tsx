import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getProductImageUrl } from '../../utils/imageUtils';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { ShimmerImage } from './Motion';
import { colors, radius, FONT } from '../../theme/tokens';

interface CartItemCardProps {
  image: any;
  title: string;
  subtitle: string;
  gWeight: string;
  nWeight: string;
  quantity?: number;
  onRemove?: () => void;
  showRemarkAndAmount?: boolean;
  readonly?: boolean;
  maroonPaddingBottom?: number;
  amount?: string;
  customAmount?: string;
  customQuantity?: number;
}

// Clean, full-width cart/order item: white card + thumbnail + name, with a cream
// G.W / L.W / N.W strip. No price (B2B is quote-based).
const CartItemCard: React.FC<CartItemCardProps> = ({
  image,
  title,
  subtitle,
  gWeight,
  nWeight,
  quantity = 1,
  onRemove,
  readonly = false,
  customQuantity,
}) => {
  const calculateLossWeight = (gross: string, net: string): string => {
    const g = parseFloat(gross);
    const n = parseFloat(net);
    if (!isNaN(g) && !isNaN(n)) return (g - n).toFixed(3);
    return '0.000';
  };
  const lWeight = calculateLossWeight(gWeight, nWeight);
  const qty = customQuantity ?? quantity;

  const resolveSource = () => {
    if (!image) return null;
    if (typeof image === 'number') return image;
    if (image.uri) {
      const u = getProductImageUrl(image.uri);
      return u ? { uri: u } : null;
    }
    if (typeof image === 'string') {
      if (image === 'fallback') return require('../../assets/img/home/p1.png');
      const u = getProductImageUrl(image);
      return u ? { uri: u } : null;
    }
    return null;
  };
  const imageSource = resolveSource();

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        {imageSource ? (
          <ShimmerImage source={imageSource} style={styles.thumb} radius={12} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.placeholder]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <View style={styles.mid}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}{qty > 1 ? ` · ${qty} pc` : ''}
          </Text>
        </View>
        {!readonly && (
          <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <HugeiconsIcon icon={Delete02Icon} size={18} color={colors.danger} strokeWidth={1.8} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.weights}>
        <View style={styles.cell}>
          <Text style={styles.k}>G.W</Text>
          <Text style={styles.v}>{gWeight} g</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.k}>L.W</Text>
          <Text style={styles.v}>{lWeight} g</Text>
        </View>
        <View style={[styles.cell, styles.cellLast]}>
          <Text style={styles.k}>N.W</Text>
          <Text style={styles.v}>{nWeight} g</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: colors.creamSoft,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
  },
  placeholderText: { color: colors.muted, fontSize: 10, fontFamily: FONT },
  mid: { flex: 1 },
  title: { fontFamily: FONT, fontSize: 14, color: colors.ink },
  subtitle: { fontFamily: FONT, fontSize: 12, color: colors.muted, marginTop: 2 },
  removeBtn: { paddingLeft: 8 },
  weights: {
    flexDirection: 'row',
    backgroundColor: colors.creamSoft,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  cellLast: { borderRightWidth: 0 },
  k: { fontFamily: FONT, fontSize: 9.5, color: colors.muted, marginBottom: 2 },
  v: { fontFamily: FONT, fontSize: 12, color: colors.maroon },
});

export default CartItemCard;
