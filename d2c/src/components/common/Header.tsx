import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ShoppingBag03Icon } from '@hugeicons/core-free-icons';
import { useCart } from '../../context/CartContext';

// Top bar for the D2C Home screen — matches the B2B look: brand logo, a short
// greeting, and a shopping-bag cart button with a live item-count badge.
const Header = () => {
  const navigation = useNavigation<any>();
  const { getTotalQuantity } = useCart();
  const cartCount = typeof getTotalQuantity === 'function' ? getTotalQuantity() : 0;

  return (
    <View style={styles.headerContainer}>
      <Image
        source={require('../../assets/img/common/maroonlogo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.greet}>
        <Text style={styles.greetSmall}>Welcome to</Text>
        <Text style={styles.greetName}>Amrut Jewels</Text>
      </View>
      <TouchableOpacity
        style={styles.cartBtn}
        onPress={() => navigation.navigate('Cart')}
        activeOpacity={0.8}
      >
        <HugeiconsIcon icon={ShoppingBag03Icon} size={22} color="#5D0829" strokeWidth={1.8} />
        {cartCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>{cartCount > 9 ? '9+' : cartCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  logo: {
    width: 48,
    height: 48,
  },
  greet: {
    flex: 1,
    marginLeft: 10,
  },
  greetSmall: {
    color: '#8A7A80',
    fontSize: 12,
    fontFamily: 'GlorifyDEMO',
  },
  greetName: {
    color: '#5D0829',
    fontSize: 17,
    fontFamily: 'GlorifyDEMO',
  },
  cartBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FCE2BF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#5D0829',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeTxt: {
    color: '#FCE2BF',
    fontSize: 10,
    fontFamily: 'GlorifyDEMO',
  },
});

export default Header;
