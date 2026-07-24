import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import CustomHeader from '../components/common/CustomHeader';
import { PressableScale, FadeInSlide } from '../components/common/Motion';
import { useWishlist, WishlistItem } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { getProductImageUrl } from '../utils/imageUtils';
import { wp, hp } from '../utils/responsiveConfig';

const resolveImage = (item: WishlistItem) => {
  let url: any = item.image;
  if (url && typeof url === 'string' && !url.startsWith('http')) {
    url = getProductImageUrl(url) || undefined;
  }
  return url && String(url).trim() !== ''
    ? { uri: url }
    : require('../assets/img/home/p1.png');
};

const Wishlist = () => {
  const navigation = useNavigation<any>();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleView = (item: WishlistItem) => {
    navigation.navigate('ProductDetail', { productId: item.id });
  };

  const handleRemove = (item: WishlistItem) => {
    removeFromWishlist(item.id);
    Toast.show({
      type: 'info',
      text1: 'Removed from Wishlist',
      text2: `${item.name || item.sku || 'Item'} removed`,
      position: 'top',
      visibilityTime: 1500,
    });
  };

  const handleAddToCart = async (item: WishlistItem) => {
    if (!item.sku || String(item.sku).trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Cannot add to cart',
        text2: 'This product is missing its SKU.',
        position: 'top',
        visibilityTime: 2500,
      });
      return;
    }
    let imageUrl: any = item.image;
    if (imageUrl && typeof imageUrl === 'string' && !imageUrl.startsWith('http')) {
      imageUrl = getProductImageUrl(imageUrl) || undefined;
    }
    try {
      await addToCart(
        {
          image: imageUrl && String(imageUrl).trim() !== '' ? imageUrl : 'fallback',
          title: item.name || item.sku || 'Product',
          subtitle: 'Jewelry',
          gWeight: item.gross_weight || '',
          nWeight: item.net_weight || '',
          sku: item.sku,
          size: item.size || '',
          length: item.length || '',
          quantity: 1,
        },
        1,
        '',
      );
      Toast.show({
        type: 'success',
        text1: 'Added to Cart',
        text2: `${item.name || item.sku} added to cart`,
        position: 'top',
        visibilityTime: 2000,
      });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add item to cart',
        position: 'top',
        visibilityTime: 2000,
      });
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Wishlist" />

      {wishlist.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.medallion}>
            <Text style={styles.medallionGlyph}>♡</Text>
          </View>
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySub}>
            Tap the heart on any piece to save it here.
          </Text>
          <PressableScale
            style={styles.browseBtn}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.browseText}>Browse Collection</Text>
          </PressableScale>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {wishlist.map((item, idx) => (
            <FadeInSlide
              key={String(item.id) || idx}
              delay={Math.min(idx, 8) * 55}
              style={styles.cardWrap}
            >
              <View style={styles.card}>
                <View style={styles.imageWrap}>
                  <Image source={resolveImage(item)} style={styles.image} resizeMode="cover" />
                  {/* Remove (filled heart) */}
                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => handleRemove(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.heartGlyph}>♥</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.name} numberOfLines={1}>
                  {item.name || item.sku || 'Product'}
                </Text>
                {item.category_name ? (
                  <Text style={styles.sku} numberOfLines={1}>
                    {String(item.category_name).toUpperCase()}
                  </Text>
                ) : null}

                <View style={styles.actions}>
                  <PressableScale
                    style={styles.viewBtn}
                    activeScale={0.96}
                    onPress={() => handleView(item)}
                  >
                    <Text style={styles.viewText}>View</Text>
                  </PressableScale>
                  <PressableScale
                    style={styles.cartBtn}
                    activeScale={0.94}
                    onPress={() => handleAddToCart(item)}
                  >
                    <Image
                      source={require('../assets/img/common/cart.png')}
                      style={styles.cartIcon}
                    />
                  </PressableScale>
                </View>
              </View>
            </FadeInSlide>
          ))}
        </ScrollView>
      )}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 30,
  },
  cardWrap: {
    width: '47%',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EADBC8',
    padding: 10,
    shadowColor: '#5D0829',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrap: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F7F1E8',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: hp('13%'),
    borderRadius: 12,
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FCE2BF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  heartGlyph: {
    color: '#5D0829',
    fontSize: 16,
    marginTop: -1,
  },
  name: {
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
    fontSize: wp('3.8%'),
    fontWeight: '700',
    marginTop: 10,
  },
  sku: {
    color: '#C09E83',
    fontFamily: 'GlorifyDEMO',
    fontSize: wp('2.7%'),
    letterSpacing: 0.6,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  viewBtn: {
    flex: 1,
    backgroundColor: '#5D0829',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewText: {
    color: '#FCE2BF',
    fontFamily: 'GlorifyDEMO',
    fontSize: wp('3.4%'),
    fontWeight: '700',
  },
  cartBtn: {
    width: 36,
    height: 36,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: '#F9F2E7',
    borderWidth: 1,
    borderColor: '#EEE3D3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    tintColor: '#5D0829',
  },
  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  medallion: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F9F2E7',
    borderWidth: 1,
    borderColor: '#EEE3D3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  medallionGlyph: {
    fontSize: 44,
    color: '#C09E83',
    marginTop: -4,
  },
  emptyTitle: {
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    color: '#8A7A80',
    fontFamily: 'GlorifyDEMO',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  browseBtn: {
    marginTop: 22,
    backgroundColor: '#5D0829',
    borderRadius: 12,
    paddingHorizontal: 26,
    paddingVertical: 12,
  },
  browseText: {
    color: '#FCE2BF',
    fontFamily: 'GlorifyDEMO',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default Wishlist;
