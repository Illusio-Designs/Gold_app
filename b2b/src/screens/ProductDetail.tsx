import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert, Dimensions, TextInput, Modal, Pressable } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProductById } from '../services/Api';
import { useCart } from '../context/CartContext';
import CustomHeader from '../components/common/CustomHeader';
import { DetailSkeleton, PressableScale } from '../components/common/Motion';
import { getProductImageUrl } from '../utils/imageUtils';
import LinearGradient from 'react-native-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Search01Icon, ShoppingBag03Icon, ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { SpecTable, BottomActionBar, Button } from '../components/ui';
import { wp, hp } from '../utils/responsiveConfig';
import { isSmallScreen, isMediumScreen, isLargeScreen, isShortScreen, isTallScreen, getResponsiveSpacing, getResponsiveFontSize } from '../utils/responsive';

import Toast from 'react-native-toast-message';
// Removed client-side watermark overlay; backend already embeds watermark

type RootStackParamList = {
  Home: undefined;
  Product: undefined;
  ProductDetail: { productId: number };
  Cart: undefined;
  // add other routes as needed
};

const { width, height } = Dimensions.get('window');
// Square hero image sized to always fit the maroon hero on any device.
const HERO_IMG = Math.min(width * 0.62, height * 0.3);

const ProductDetail = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { addToCart } = useCart();
  const insets = useSafeAreaInsets();
  
  // @ts-ignore
  const productId = route.params?.productId;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);

  // Fetch product data when component mounts
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError('Product ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        

        const response = await getProductById(productId);
        
        if (response.success && response.data) {
          setProduct(response.data);
        } else {
          setError('Failed to load product details');
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to load product details',
            position: 'top',
            visibilityTime: 3000
          });
        }
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Failed to load product details');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: err.message || 'Failed to load product details',
          position: 'top',
          visibilityTime: 3000
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Get product image source
  const getProductImage = () => {
    if (!product || !product.image) {
      return require('../assets/img/home/p1.png');
    }
    
    // Handle both single image and image array
    let imageUrl = product.image;
    if (Array.isArray(product.images) && product.images.length > 0) {
      imageUrl = product.images[0];
    }
    
    if (imageUrl.startsWith('http')) {
      return { uri: imageUrl };
    } else {
      return { uri: getProductImageUrl(imageUrl) };
    }
  };

  // Show loading state — brand shimmer skeleton
  if (loading) {
    return <DetailSkeleton />;
  }

  // Show error state
  if (error || !product) {
    return (
      <View style={styles.baseBg}>
        <LinearGradient
          colors={["#43051D", "#5D0829"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradientBg}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('Home');
                }
              }}
              activeOpacity={0.7}
            >
              <Image source={require('../assets/img/common/creamback.png')} style={styles.backArrow} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Product Details</Text>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || 'Product not found'}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                setError(null);
                // Re-fetch product
                const fetchProduct = async () => {
                  try {
                    const response = await getProductById(productId);
                    if (response.success && response.data) {
                      setProduct(response.data);
                    } else {
                      setError('Failed to load product details');
                    }
                  } catch (err: any) {
                    setError(err.message || 'Failed to load product details');
                  } finally {
                    setLoading(false);
                  }
                };
                fetchProduct();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const lessWeight = (product.gross_weight && product.net_weight)
    ? (parseFloat(product.gross_weight) - parseFloat(product.net_weight)).toFixed(3)
    : null;

  const handleAddToCart = () => {
    addToCart({
      image: getProductImage(),
      title: product.name || product.sku || 'Product Name',
      subtitle: 'Jewelry',
      gWeight: product.gross_weight ? `${product.gross_weight}` : 'N/A',
      lWeight: lessWeight || 'N/A',
      nWeight: product.net_weight ? `${product.net_weight}` : 'N/A',
      sku: product.sku || 'N/A',
      size: product.size || 'N/A',
      length: product.length || 'N/A',
      quantity: 1,
    }, 1, amount);
    navigation.goBack();
  };

  // D2 · Maroon hero + white sheet
  return (
    <View style={styles.d2Base}>
      {/* Maroon header bar */}
      <View style={[styles.pdHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.pdHeaderBtn}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
          activeOpacity={0.8}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#FCE2BF" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.pdHeaderTitle}>Product Details</Text>
        <View style={styles.pdHeaderBtn} />
      </View>

      {/* Light image area — full product image */}
      <View style={styles.imgArea}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.imgWrap}
          onPress={() => setImagePreviewVisible(true)}
        >
          <Image source={getProductImage()} style={styles.heroImage} resizeMode="contain" />
          <View style={styles.magnifyBadge}>
            <HugeiconsIcon icon={Search01Icon} size={18} color="#5D0829" strokeWidth={2} />
          </View>
        </TouchableOpacity>
      </View>

      {/* White sheet that overlaps the hero */}
      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sheetName}>{product.name || product.sku || 'Product Name'}</Text>

          <Text style={styles.ocHeading}>Specifications</Text>
          <SpecTable
            rows={[
              ...(product.size ? [{ k: 'Size', v: String(product.size) }] : []),
              ...(product.length ? [{ k: 'Length', v: String(product.length) }] : []),
              ...(product.sku ? [{ k: 'SKU', v: String(product.sku) }] : []),
              ...(product.purity ? [{ k: 'Purity', v: String(product.purity) }] : []),
              ...(product.mark ? [{ k: 'Mark', v: String(product.mark) }] : []),
              ...(product.gross_weight ? [{ k: 'Gross Weight', v: `${product.gross_weight} g` }] : []),
              ...(lessWeight ? [{ k: 'Less Weight', v: `${lessWeight} g` }] : []),
              ...(product.net_weight ? [{ k: 'Net Weight', v: `${product.net_weight} g` }] : []),
            ]}
          />

          <Text style={styles.ocHeading}>Other Charges</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="Amount"
            placeholderTextColor="#A47C8C"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </ScrollView>
      </View>

      {/* Sticky Add to Cart */}
      <BottomActionBar
        info={{
          label: 'Net weight',
          value: `${product.net_weight ? product.net_weight + ' g' : '—'}${product.purity ? ' · ' + product.purity : ''}`,
        }}
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Button title="Add to Cart" icon={ShoppingBag03Icon} onPress={handleAddToCart} />
      </BottomActionBar>

      {/* Full-screen image preview */}
      <Modal
        visible={imagePreviewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImagePreviewVisible(false)}
      >
        <View style={styles.imagePreviewBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setImagePreviewVisible(false)}>
            <Image source={getProductImage()} style={styles.imagePreviewImage} resizeMode="contain" />
          </Pressable>
          <TouchableOpacity
            style={styles.imagePreviewCloseBtn}
            onPress={() => setImagePreviewVisible(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.imagePreviewCloseText}>×</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  baseBg: {
    flex: 1,
    backgroundColor: '#FCE2BF',
  },

  /* ===== D2 · Maroon hero + white sheet ===== */
  d2Base: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 14,
    backgroundColor: '#5D0829',
  },
  pdHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdHeaderTitle: {
    color: '#FCE2BF',
    fontSize: 19,
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
  },
  imgArea: {
    backgroundColor: '#FBF3E6',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 22,
    alignItems: 'center',
  },
  imgWrap: {
    width: '88%',
    height: height * 0.32,
    alignSelf: 'center',
    marginTop: 6,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  magnifyBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(252,226,191,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -26,
    paddingTop: 6,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },
  sheetName: {
    color: '#5D0829',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
    marginBottom: 12,
  },
  sheetDetails: {
    marginBottom: 4,
  },
  dRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7DA',
  },
  dRowLast: {
    borderBottomWidth: 0,
  },
  dLabel: {
    color: '#8A7A80',
    fontSize: 14,
    fontFamily: 'GlorifyDEMO',
  },
  dValue: {
    color: '#5D0829',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
  },
  ocHeading: {
    color: '#5D0829',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
    marginTop: 16,
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1.5,
    borderColor: '#C09E83',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#5D0829',
    backgroundColor: '#F9F2E7',
    fontFamily: 'GlorifyDEMO',
  },
  addBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0E7DA',
  },
  addBtn: {
    backgroundColor: '#5D0829',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    color: '#FCE2BF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
    letterSpacing: 0.5,
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.92,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: isShortScreen() ? 40 : isTallScreen() ? 60 : 50,
    paddingHorizontal: getResponsiveSpacing(20, 25, 30),
    marginBottom: 0,
  },
  backBtn: {
    padding: getResponsiveSpacing(6, 8, 10),
    marginRight: 0,
    zIndex: 10,
  },
  backArrow: {
    width: getResponsiveSpacing(20, 24, 28),
    height: getResponsiveSpacing(20, 24, 28),
    resizeMode: 'contain',
  },
  headerTitle: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(18, 22, 26),
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
    flex: 1,
    textAlign: 'center',
    marginLeft: -50, // visually center between icons
  },
  imageCard: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveSpacing(20, 25, 30),
  },
  productImage: {
    width: isSmallScreen() ? wp('70%') : isMediumScreen() ? wp('75%') : wp('80%'),
    height: isSmallScreen() ? hp('25%') : isMediumScreen() ? hp('28%') : hp('30%'),
    borderRadius: 18,
  },
  // Full-screen image preview
  imagePreviewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  imagePreviewCloseBtn: {
    position: 'absolute',
    top: isShortScreen() ? 40 : 55,
    right: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(252,226,191,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imagePreviewCloseText: {
    color: '#FCE2BF',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 22,
  },
  imagePreviewImage: {
    width: '100%',
    height: '100%',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: getResponsiveSpacing(25, 30, 35),
    marginHorizontal: getResponsiveSpacing(25, 30, 35),
  },
  productName: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(16, 20, 24),
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
    flex: 1,
  },
  detailsSection: {
    marginTop: getResponsiveSpacing(18, 22, 26),
    marginHorizontal: getResponsiveSpacing(25, 30, 35),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(8, 10, 12),
  },
  detailLabel: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontFamily: 'GlorifyDEMO',
    fontWeight: '400',
  },
  detailValue: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontFamily: 'GlorifyDEMO',
    fontWeight: '600',
  },
  skuValue: {
    color: '#FCE2BF',
    fontWeight: '600',
  },
  otherChargesHeading: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(16, 20, 24),
    fontFamily: 'GlorifyDEMO',
    fontWeight: '700',
    marginTop: getResponsiveSpacing(12, 15, 18),
    marginBottom: getResponsiveSpacing(10, 12, 14),
    marginHorizontal: getResponsiveSpacing(25, 30, 35),
  },
  otherChargesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: getResponsiveSpacing(20, 25, 30),
    marginBottom: getResponsiveSpacing(8, 10, 12),
  },
  inputBox: {
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: '#FCE2BF',
    borderRadius: 10,
    height: getResponsiveSpacing(34, 38, 42),
    justifyContent: 'center',
    paddingHorizontal: getResponsiveSpacing(10, 12, 14),
  },
  amountBox: {
    flex: 1,
  },
  inputPlaceholder: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontFamily: 'GlorifyDEMO',
    fontWeight: '100',
  },
  addToCartBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: getResponsiveSpacing(60, 70, 80),
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  addToCartText: {
    color: '#5D0829',
    fontSize: getResponsiveFontSize(18, 22, 26),
    fontFamily: 'GlorifyDEMO',
    fontWeight: '700',
  },
  // Loading and Error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getResponsiveSpacing(40, 50, 60),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getResponsiveSpacing(40, 50, 60),
    paddingHorizontal: getResponsiveSpacing(20, 25, 30),
  },
  errorText: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontFamily: 'GlorifyDEMO',
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(20, 25, 30),
  },
  retryButton: {
    backgroundColor: '#FCE2BF',
    borderRadius: getResponsiveSpacing(8, 10, 12),
    paddingVertical: getResponsiveSpacing(8, 10, 12),
    paddingHorizontal: getResponsiveSpacing(16, 20, 24),
  },
  retryButtonText: {
    color: '#5D0829',
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontFamily: 'GlorifyDEMO',
    fontWeight: '600',
  },
});

export default ProductDetail; 