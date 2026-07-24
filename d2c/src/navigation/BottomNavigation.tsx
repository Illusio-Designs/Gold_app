import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Collection from '../screens/Collection';
import Cart from '../screens/Cart';
import Profile from '../screens/Profile';
import Home from '../screens/Home';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Product from '../screens/Product';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Home01Icon,
  Diamond01Icon,
  ShoppingBag03Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';

const Tab = createBottomTabNavigator();
const CollectionStackNav = createNativeStackNavigator();

// Rounded Hugeicons for each consumer tab (matches the B2B look).
const tabIcons = {
  Home: Home01Icon,
  Collection: Diamond01Icon,
  Cart: ShoppingBag03Icon,
  Profile: UserIcon,
};

const labels = {
  Home: 'Home',
  Collection: 'Collection',
  Cart: 'Cart',
  Profile: 'Profile',
};

const tabNames = ['Home', 'Collection', 'Cart', 'Profile'] as const;
type TabName = typeof tabNames[number];

// A flat, in-bar tab. When active the icon sits inside a perfect-circle gold
// pill that stays fully within the bar.
const TabItem = ({
  name,
  isFocused,
  onPress,
  accessibilityLabel,
}: {
  name: TabName;
  isFocused: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) => {
  const anim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 90,
    }).start();
  }, [isFocused, anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.tabBtn}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <HugeiconsIcon
            icon={tabIcons[name]}
            size={23}
            color={isFocused ? '#5D0829' : '#FCE2BF'}
            strokeWidth={1.8}
          />
        </Animated.View>
      </View>
      <Text style={[styles.label, isFocused && styles.labelActive]}>{labels[name]}</Text>
    </TouchableOpacity>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        const isTabName = (name: string): name is TabName => tabNames.includes(name as TabName);
        if (!isTabName(route.name)) return null;

        return (
          <TabItem
            key={route.key}
            name={route.name}
            isFocused={isFocused}
            onPress={onPress}
            accessibilityLabel={options.tabBarAccessibilityLabel}
          />
        );
      })}
    </View>
  );
};

const CollectionStack = () => (
  <CollectionStackNav.Navigator screenOptions={{ headerShown: false }}>
    <CollectionStackNav.Screen name="CollectionMain" component={Collection} />
    <CollectionStackNav.Screen name="Product" component={Product} />
  </CollectionStackNav.Navigator>
);

const BottomNavigation = () => (
  <Tab.Navigator
    initialRouteName="Home"
    screenOptions={{ headerShown: false }}
    tabBar={props => <CustomTabBar {...props} />}
  >
    <Tab.Screen name="Home" component={Home} />
    <Tab.Screen name="Collection" component={CollectionStack} />
    <Tab.Screen name="Cart" component={Cart} />
    <Tab.Screen name="Profile" component={Profile} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  // Flat maroon bar — every tab equal, active tab highlighted inside the bar.
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#5D0829',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    shadowColor: '#5D0829',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 12,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22, // exactly half -> perfect circle
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconWrapActive: {
    backgroundColor: '#FCE2BF',
  },
  label: {
    color: '#FCE2BF',
    fontSize: 11,
    fontFamily: 'GlorifyDEMO',
    marginTop: 2,
    opacity: 0.75,
  },
  labelActive: {
    opacity: 1,
    fontWeight: 'bold',
  },
});

export default BottomNavigation;
