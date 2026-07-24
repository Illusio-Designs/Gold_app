import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomNavigation from './BottomNavigation';
import Splash from '../screens/Splash/Splash';
import JourneyPane from '../screens/Splash/JourneyPane';
import ShreenathjiScreen from '../screens/Splash/ShreenathjiScreen';
import FamilyTree from '../screens/Splash/FamilyTree';
import Register from '../screens/authorization/Register';
import Login from '../screens/authorization/Login';
import Product from '../screens/Product';
import ProductDetail from '../screens/ProductDetail';
import Search from '../screens/Search';
import EditProfile from '../screens/EditProfile';
import Orders from '../screens/Orders';
import Wishlist from '../screens/Wishlist';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { NavigationProvider } from '../context/NavigationContext';
import NavigationLoader from '../components/common/NavigationLoader';
import { setUnauthorizedHandler } from '../services/Api';

const Stack = createNativeStackNavigator();

const StackNavigation = () => {
  const navigationRef = useRef<any>(null);

  // On session expiry (401), clear-and-reset back to Login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      try {
        navigationRef.current?.reset({ index: 0, routes: [{ name: 'Login' }] });
      } catch {}
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  return (
    <NavigationProvider>
      <CartProvider>
        <WishlistProvider>
        <NavigationContainer ref={navigationRef}>
          {/* Start app on Splash screen */}
          <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="JourneyPane" component={JourneyPane} />
            <Stack.Screen name="ShreenathjiScreen" component={ShreenathjiScreen} />
            <Stack.Screen name="FamilyTree" component={FamilyTree} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="MainTabs" component={BottomNavigation} />
            <Stack.Screen name="Product" component={Product} />
            <Stack.Screen name="ProductDetail" component={ProductDetail} />
            <Stack.Screen name="Search" component={Search} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen name="Orders" component={Orders} />
            <Stack.Screen name="Wishlist" component={Wishlist} />
          </Stack.Navigator>
          <NavigationLoader />
        </NavigationContainer>
        </WishlistProvider>
      </CartProvider>
    </NavigationProvider>
  );
};

export default StackNavigation;

