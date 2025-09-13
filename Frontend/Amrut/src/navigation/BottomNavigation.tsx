import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Collection from '../screens/Collection';
import Cart from '../screens/Cart';
import Profile from '../screens/Profile';
import Home from '../screens/Home';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Product from '../screens/Product';
import { View, TouchableOpacity, Image, Text, StyleSheet, Platform } from 'react-native';
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
            {isFocused && isTabName(route.name) ? (
              <View style={styles.activeIconWrapper}>
                <Image
                  source={icons[route.name].active}
                  style={styles.activeIcon}
                  resizeMode="contain"
                />
                <Text style={styles.activeLabelInside}>{labels[route.name]}</Text>
              </View>
            ) : isTabName(route.name) ? (
              <>
                <View style={styles.iconWrapper}>
                  <Image
                    source={icons[route.name].inactive}
                    style={styles.icon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.label}>{labels[route.name]}</Text>
              </>
            ) : null}
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
    <Tab.Screen name="Cart" component={Cart} />
    <Tab.Screen name="Profile" component={Profile} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#5D0829',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: 70,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 15 : 10,
    paddingTop: 20,
    // shadowColor: '#000',
    // shadowOpacity: 0.08,
    // shadowRadius: 8,
    // elevation: 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  iconWrapper: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    padding: 8,
    marginBottom: 0 ,
  },
  activeIconWrapper: {
    backgroundColor: '#FCE2BF', // your highlight color
    borderRadius: 12,           // rounded square
    paddingHorizontal: 8,      // square shape
    paddingVertical: 12,
    marginBottom: 0,            // move square down
    marginTop: 0,              // move square down
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    minWidth: 60,
  },
  activeLabelInside: {
    color: '#5D0829', // maroon
    fontSize: 12,
    fontFamily: 'Glorifydemo-BW3J3',
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: '#FCE2BF',
  },
  activeIcon: {
    width: 20,
    height: 20,
    tintColor: '#5D0829',
  },
  label: {
    color: '#FCE2BF',
    fontSize: 12,
    fontFamily: 'Glorifydemo-BW3J3',
    marginTop: 2,
  },
  activeLabel: {
    color: '#FCE2BF',
    fontSize: 12,
    fontFamily: 'Glorifydemo-BW3J3',
    fontWeight: 'bold',
    marginTop: 2,
  },
});

export default BottomNavigation;
