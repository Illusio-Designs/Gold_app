import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { getProductImageUrl } from '../../utils/imageUtils';
// Removed client-side watermark overlay; backend already embeds watermark

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
}

const CartItemCard: React.FC<CartItemCardProps> = ({
  image,
  title,
  subtitle,
  gWeight,
  nWeight,
  quantity = 1,
  onRemove,
  showRemarkAndAmount = false,
  readonly = false,
  maroonPaddingBottom = 0,
  amount = '',
}) => {
  // Calculate loss weight (gross weight - net weight)
  const calculateLossWeight = (gross: string, net: string): string => {
    try {
      const grossWeight = parseFloat(gross);
      const netWeight = parseFloat(net);
      if (!isNaN(grossWeight) && !isNaN(netWeight)) {
        return (grossWeight - netWeight).toFixed(3);
      }
    } catch (error) {
      console.warn('[CartItemCard] Error calculating loss weight:', error);
    }
    return '0.000';
  };

  const lWeight = calculateLossWeight(gWeight, nWeight);
  return (
    <View style={styles.bgContainer}>
      <View style={styles.cardContainer}>
        <View style={styles.row}>
          {(() => {
            // Handle different image formats
            let imageSource = null;
            
            if (image) {
              if (typeof image === 'number') {
                // Local image (require())
                imageSource = image;
              } else if (image.uri) {
                // Remote image with URI - process through imageUtils
                const imageUrl = getProductImageUrl(image.uri);
                if (imageUrl) {
                  imageSource = { uri: imageUrl };
                }
              } else if (typeof image === 'string') {
                // String URL - convert to proper format using imageUtils
                if (image === 'fallback') {
                  // Use fallback image
                  imageSource = require('../../assets/img/home/p1.png');
                } else {
                  const imageUrl = getProductImageUrl(image);
                  if (imageUrl) {
                    imageSource = { uri: imageUrl };
                  }
                }
              }
            }
            
            if (imageSource) {
              return (
                <Image 
                  source={imageSource} 
                  style={styles.productImage}
                  resizeMode="cover"
                  onError={(error) => {
                    console.error('[CartItemCard] Image failed to load:', error.nativeEvent);
                  }}
                />
              );
            } else {
              return (
                <View style={[styles.productImage, styles.placeholderImage]}>
                  <Text style={styles.placeholderText}>No Image</Text>
                </View>
              );
            }
          })()}
          <View style={styles.infoContainer}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
              {!readonly && (
                <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
                  <Text style={styles.removeText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
            {/* Removed quantity controls */}
          </View>
        </View>
      </View>
      <View style={[styles.maroonSection, { paddingBottom: maroonPaddingBottom }]}>
        <View style={styles.weightsRow}>
          <Text style={styles.weightText}>G.W = {gWeight}</Text>
          <Text style={styles.weightText}>L.W = {lWeight}</Text>
          <Text style={styles.weightText}>N.W = {nWeight}</Text>
        </View>
        {showRemarkAndAmount && (
          <>
            <View style={styles.divider} />
            <View style={styles.remarkAmountRow}>
              <Text style={styles.amountLabel}>Amount: {amount || 'N/A'}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const CARD_WIDTH = 310;
const CARD_HEIGHT = 160;

const styles = StyleSheet.create({
  bgContainer: {
    backgroundColor: '#5D0829',
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: '#5D0829',
    width: CARD_WIDTH,
    alignSelf: 'center',
    marginBottom: 25,
    padding: 0,
    overflow: 'visible',
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius:22,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 10,
    paddingVertical:10,
    zIndex: 2,
    flex: 1,
    overflow: 'visible',
    height: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D0829',
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#5D0829',
    marginTop: 0,
    marginBottom: 0,
  },
  removeBtn: {
    marginLeft: 0,
    padding: 0,
  },
  removeText: {
    fontSize: 20,
    color: '#5D0829',
    fontWeight: '500',
    right:10,
    bottom:7,
  },
  maroonSection: {
    backgroundColor: '#5D0829',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 12,
    zIndex: 1,
    flex: 1,
    justifyContent: 'flex-end',
  },
  weightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  weightText: {
    color: '#FCE2BF',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#FCE2BF',
    opacity: 0.6,
    marginVertical: 8,
    width: '110%',
    alignSelf: 'center',
    marginLeft: 0,
    marginRight: 0,
  },
  remarkAmountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    paddingHorizontal: 6,
    paddingBottom:10,
  },
  amountLabel: {
    color: '#FCE2BF',
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.95,
  },
});

export default CartItemCard;
