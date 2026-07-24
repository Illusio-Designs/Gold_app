import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ShoppingCart01Icon } from '@hugeicons/core-free-icons';
import { useCart } from '../../context/CartContext';

type RightAction = {
  icon: any;            // require(...) image source
  onPress: () => void;
};

interface CustomHeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;           // hide the back arrow (tab-root screens)
  showCart?: boolean;           // show the cart icon on the right (default true)
  rightActions?: RightAction[]; // optional cream icons on the right
}

// T2 · Maroon curved app-bar — a bold, premium header used on every page:
// a maroon gradient bar with a curved bottom, cream centered Glorify title,
// a cream back arrow and optional cream action icons. Sits below the status
// row (screens keep their existing top padding as the safe-area gap).
const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  onBack,
  showBack = true,
  showCart = true,
  rightActions = [],
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { getTotalQuantity } = useCart();
  const cartCount = typeof getTotalQuantity === 'function' ? getTotalQuantity() : 0;

  return (
    <LinearGradient
      colors={["#5D0829", "#6B0D33"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.bar, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBack || (() => (navigation as any).goBack())}
            style={styles.side}
          >
            <Image source={require('../../assets/img/common/backarrow.png')} style={styles.backArrow} />
          </TouchableOpacity>
        ) : (
          <View style={styles.side} />
        )}

        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        <View style={styles.rightSide}>
          {rightActions.map((action, i) => (
            <TouchableOpacity key={i} onPress={action.onPress} style={styles.actionBtn}>
              <Image source={action.icon} style={styles.actionIcon} />
            </TouchableOpacity>
          ))}
          {showCart ? (
            <TouchableOpacity onPress={() => (navigation as any).navigate('Cart')} style={styles.actionBtn}>
              <HugeiconsIcon icon={ShoppingCart01Icon} size={22} color="#FCE2BF" strokeWidth={1.8} />
              {cartCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeTxt}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bar: {
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    // soft drop shadow under the bar
    shadowColor: '#5D0829',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  side: {
    width: 56,
    height: 40,
    justifyContent: 'center',
  },
  rightSide: {
    minWidth: 56,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C0392B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#5D0829',
  },
  cartBadgeTxt: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  backArrow: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#FCE2BF',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#FCE2BF',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
  },
  actionBtn: {
    paddingHorizontal: 6,
  },
  actionIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    tintColor: '#FCE2BF',
  },
});

export default CustomHeader;
