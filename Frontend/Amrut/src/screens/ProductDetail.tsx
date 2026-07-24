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

const { height } = Dimensions.get('window');

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
      {/* Maroon hero with header + product image */}
      <LinearGradient
        colors={["#43051D", "#5D0829"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.hero}
      >
        <View style={[styles.heroHeader, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.heroBackBtn}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
            activeOpacity={0.7}
          >
            <Image source={require('../assets/img/common/creamback.png')} style={styles.heroBackArrow} />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Product Details</Text>
          <View style={styles.heroBackBtn} />
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.heroImageWrap}
          onPress={() => setImagePreviewVisible(true)}
        >
          <Image source={getProductImage()} style={styles.heroImage} resizeMode="cover" />
        </TouchableOpacity>
      </LinearGradient>

      {/* White sheet that overlaps the hero */}
      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sheetName}>{product.name || product.sku || 'Product Name'}</Text>

          <View style={styles.sheetDetails}>
            {product.size ? (
              <View style={styles.dRow}><Text style={styles.dLabel}>Size</Text><Text style={styles.dValue}>{product.size}</Text></View>
            ) : null}
            {product.length ? (
              <View style={styles.dRow}><Text style={styles.dLabel}>Length</Text><Text style={styles.dValue}>{product.length}</Text></View>
            ) : null}
            {product.sku ? (
              <View style={styles.dRow}><Text style={styles.dLabel}>SKU</Text><Text style={styles.dValue}>{product.sku}</Text></View>
            ) : null}
            {product.purity ? (
              <View style={styles.dRow}><Text style={styles.dLabel}>Purity</Text><Text style={styles.dValue}>{product.purity}</Text></View>
            ) : null}
            {product.mark ? (
              <View style={styles.dRow}><Text style={styles.dLabel}>Mark</Text><Text style={styles.dValue}>{product.mark}</Text></View>
            ) : null}
            {product.gross_weight ? (
              <View style={styles.dRow}><Text style={styles.dLabel}>Gross Weight</Text><Text style={styles.dValue}>{product.gross_weight} g</Text></View>
            ) : null}
            {lessWeight ? (
              <View style={styles.dRow}><Text style={styles.dLabel}>Less Weight</Text><Text style={styles.dValue}>{lessWeight} g</Text></View>
            ) : null}
            {product.net_weight ? (
              <View style={[styles.dRow, styles.dRowLast]}><Text style={styles.dLabel}>Net Weight</Text><Text style={styles.dValue}>{product.net_weight} g</Text></View>
            ) : null}
          </View>

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
      <View style={[styles.addBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <PressableScale style={styles.addBtn} activeScale={0.97} onPress={handleAddToCart}>
          <Text style={styles.addText}>Add to Cart</Text>
        </PressableScale>
      </View>

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

      <Toast />
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
  hero: {
    height: height * 0.42,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    alignItems: 'center',
  },
  heroHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  heroBackBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBackArrow: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#FCE2BF',
  },
  heroTitle: {
    color: '#FCE2BF',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
  },
  heroImageWrap: {
    flex: 1,
    marginTop: 6,
    marginBottom: 22,
    aspectRatio: 0.82,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FCE2BF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
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