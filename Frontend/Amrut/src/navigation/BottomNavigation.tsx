import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Collection from '../screens/Collection';
import Cart from '../screens/Cart';
import Profile from '../screens/Profile';
import Home from '../screens/Home';
import CustomOrder from '../screens/CustomOrder';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Product from '../screens/Product';
import { View, TouchableOpacity, Image, Text, StyleSheet, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();
const CollectionStackNav = createNativeStackNavigator();

const icons = {
  Home: {
    active: require('../assets/img/bottombar/activehome.png'),
    inactive: require('../assets/img/bottombar/inactivehome.png'),
  },
  Collection: {
    active: require('../assets/img/bottombar/activecollection.png'),
    inactive: require('../assets/img/bottombar/inactivecollection.png'),
  },
  Cart: {
    active: require('../assets/img/bottombar/activecart.png'),
    inactive: require('../assets/img/bottombar/inactivecart.png'),
  },
  Profile: {
    active: require('../assets/img/bottombar/activeprofile.png'),
    inactive: require('../assets/img/bottombar/inactiveprofile.png'),
  },
};

const labels = {
  Home: 'Home',
  Collection: 'Collection',
  Custom: 'Custom',
  Cart: 'Cart',
  Profile: 'Profile',
};

const tabNames = ['Home', 'Collection', 'Cart', 'Profile'] as const;
type TabName = typeof tabNames[number];

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.tabBarContainer}>
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
        // Type guard for route.name
        const isTabName = (name: string): name is TabName => tabNames.includes(name as TabName);

        // Center-raised Custom Order button (B2).
        if (route.name === 'Custom') {
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.customTab}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={isFocused ? ['#FCE2BF', '#C09E83'] : ['#E9C9A0', '#C09E83']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fab}
              >
                <Text style={styles.fabGlyph}>✦</Text>
              </LinearGradient>
              <Text style={[styles.label, styles.customLabel, isFocused && styles.labelActive]}>
                {labels.Custom}
              </Text>
            </TouchableOpacity>
          );
        }

        if (!isTabName(route.name)) return null;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            style={styles.tabBtn}
            activeOpacity={0.8}
          >
            <Image
              source={isFocused ? icons[route.name].active : icons[route.name].inactive}
              style={[styles.icon, isFocused ? styles.iconActive : styles.iconInactive]}
              resizeMode="contain"
            />
            <Text style={[styles.label, isFocused && styles.labelActive]}>{labels[route.name]}</Text>
          </TouchableOpacity>
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
    <Tab.Screen name="Custom" component={CustomOrder} />
    <Tab.Screen name="Cart" component={Cart} />
    <Tab.Screen name="Profile" component={Profile} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  // B2 · Center-raised Custom — maroon bar with a raised gold Custom button.
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#5D0829',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 66,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    paddingTop: 8,
    overflow: 'visible',
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
  icon: {
    width: 22,
    height: 22,
    tintColor: '#FCE2BF',
  },
  iconActive: {
    opacity: 1,
  },
  iconInactive: {
    opacity: 0.6,
  },
  label: {
    color: '#FCE2BF',
    fontSize: 11,
    fontFamily: 'GlorifyDEMO',
    marginTop: 3,
    opacity: 0.75,
  },
  labelActive: {
    opacity: 1,
    fontWeight: 'bold',
  },
  // Raised center Custom button
  customTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  fab: {
    position: 'absolute',
    top: -26,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#5D0829',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  fabGlyph: {
    fontSize: 24,
    lineHeight: 26,
    color: '#5D0829',
    fontWeight: 'bold',
  },
  customLabel: {
    marginTop: 0,
    marginBottom: 2,
  },
});

export default BottomNavigation;
