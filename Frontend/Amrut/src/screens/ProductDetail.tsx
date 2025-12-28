import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert, Dimensions, TextInput, Modal, Pressable } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getProductById } from '../services/Api';
import { useCart } from '../context/CartContext';
import CustomHeader from '../components/common/CustomHeader';
import CustomLoader from '../components/common/CustomLoader';
import ScreenLoader from '../components/common/ScreenLoader';
import { getProductImageUrl } from '../utils/imageUtils';
import LinearGradient from 'react-native-linear-gradient';
import { wp, hp } from '../utils/responsiveConfig';
import { isSmallScreen, isMediumScreen, isLargeScreen, isShortScreen, isTallScreen, getResponsiveSpacing, getResponsiveFontSize } from '../utils/responsive';

import Toast from 'react-native-toast-message';
// Removed client-side watermark overlay; backend already embeds watermark
import SessionTimer from '../components/common/SessionTimer';

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
        
        Toast.show({
          type: 'info',
          text1: 'Loading',
          text2: 'Fetching product details',
          position: 'top',
          visibilityTime: 1000
        });

        const response = await getProductById(productId);
        
        if (response.success && response.data) {
          setProduct(response.data);
          Toast.show({
            type: 'success',
            text1: 'Loaded',
            text2: 'Product details loaded successfully',
            position: 'top',
            visibilityTime: 1500
          });
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

  // Show loading state
  if (loading) {
    return <ScreenLoader text="Loading Product Details..." backgroundColor="#43051D" textColor="#FCE2BF" />;
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
            <SessionTimer size={50} textColor="#FCE2BF" borderColor="#FCE2BF" activeStrokeColor="#FCE2BF" />
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
          <SessionTimer size={50} textColor="#FCE2BF" borderColor="#FCE2BF" activeStrokeColor="#FCE2BF" />
        </View>
        {/* Product Image Card */}
        <View style={styles.imageCard}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setImagePreviewVisible(true)}
          >
            <Image 
              source={getProductImage()} 
              style={styles.productImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>

        {/* Full-screen image preview (tap image to open) */}
        <Modal
          visible={imagePreviewVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setImagePreviewVisible(false)}
        >
          <View style={styles.imagePreviewBackdrop}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => setImagePreviewVisible(false)}
            >
              <Image
                source={getProductImage()}
                style={styles.imagePreviewImage}
                resizeMode="contain"
              />
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
        {/* Product Name and Quantity Selector */}
        <View style={styles.productRow}>
          <Text style={styles.productName}>{product.name || product.sku || 'Product Name'}</Text>
        </View>
        {/* Product Details Section */}
        <View style={styles.detailsSection}>
          {product.size && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Size</Text>
              <Text style={styles.detailValue}>{product.size}</Text>
            </View>
          )}
          {product.length && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Length</Text>
              <Text style={styles.detailValue}>{product.length}</Text>
            </View>
          )}
          {product.sku && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>SKU</Text>
              <Text style={[styles.detailValue, styles.skuValue]}>{product.sku}</Text>
            </View>
          )}
          {product.purity && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purity</Text>
              <Text style={styles.detailValue}>{product.purity}</Text>
            </View>
          )}
          {product.mark && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mark</Text>
              <Text style={styles.detailValue}>{product.mark}</Text>
            </View>
          )}
          {product.gross_weight && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gross Weight</Text>
              <Text style={styles.detailValue}>{product.gross_weight} g</Text>
            </View>
          )}
          {product.gross_weight && product.net_weight && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Less Weight</Text>
              <Text style={styles.detailValue}>
                {(parseFloat(product.gross_weight) - parseFloat(product.net_weight)).toFixed(3)} g
              </Text>
            </View>
          )}
          {product.net_weight && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Net Weight</Text>
              <Text style={styles.detailValue}>{product.net_weight} g</Text>
            </View>
          )}
        </View>
        {/* Other Charges Section */}
        <Text style={styles.otherChargesHeading}>Other Charges</Text>
        <View style={styles.otherChargesRow}>
          <TextInput
            style={[styles.inputBox, styles.amountBox, { color: '#FCE2BF' }]}
            placeholder="Amount"
            placeholderTextColor="#FCE2BF"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>
        {/* More content goes here */}
      </LinearGradient>
              {/* Add to Cart Button at the bottom */}
        <TouchableOpacity 
          style={styles.addToCartBtn}
          onPress={() => {
            addToCart({
              image: getProductImage(),
              title: product.name || product.sku || 'Product Name',
              subtitle: 'Jewelry',
              gWeight: product.gross_weight ? `${product.gross_weight}` : 'N/A',
              lWeight: (product.gross_weight && product.net_weight) ? 
                `${(parseFloat(product.gross_weight) - parseFloat(product.net_weight)).toFixed(3)}` : 'N/A',
              nWeight: product.net_weight ? `${product.net_weight}` : 'N/A',
              sku: product.sku || 'N/A',
              size: product.size || 'N/A',
              length: product.length || 'N/A',
              quantity: 1,
            }, 1, amount);
            
            Toast.show({
              type: 'success',
              text1: 'Added to Cart',
              text2: `${product.name || product.sku} added to cart`,
              position: 'top',
              visibilityTime: 2000
            });
            
            navigation.goBack();
          }}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        
        {/* Toast component for notifications */}
        <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  baseBg: {
    flex: 1,
    backgroundColor: '#FCE2BF',
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
    fontFamily: 'Glorifydemo-BW3J3',
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
    fontFamily: 'Glorifydemo-BW3J3',
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
    fontFamily: 'Glorifydemo-BW3J3',
    fontWeight: '400',
  },
  detailValue: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontFamily: 'Glorifydemo-BW3J3',
    fontWeight: '600',
  },
  skuValue: {
    color: '#FCE2BF',
    fontWeight: '600',
  },
  otherChargesHeading: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(16, 20, 24),
    fontFamily: 'Glorifydemo-BW3J3',
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
    fontFamily: 'Glorifydemo-BW3J3',
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
    fontFamily: 'Glorifydemo-BW3J3',
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
    fontFamily: 'Glorifydemo-BW3J3',
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
    fontFamily: 'Glorifydemo-BW3J3',
    fontWeight: '600',
  },
});

export default ProductDetail; 