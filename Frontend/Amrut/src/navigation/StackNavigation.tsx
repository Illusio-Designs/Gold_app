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
import CategoryChoose from '../screens/authorization/CategoryChoose';
import Product from '../screens/Product';
import ProductDetail from '../screens/ProductDetail';
import Search from '../screens/Search';
import EditProfile from '../screens/EditProfile';
import Orders from '../screens/Orders';
import { CartProvider } from '../context/CartContext';
import { NavigationProvider } from '../context/NavigationContext';
import NavigationLoader from '../components/common/NavigationLoader';

const Stack = createNativeStackNavigator();

const StackNavigation = () => {
  const navigationRef = useRef(null);

  return (
    <NavigationProvider>
      <CartProvider>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="JourneyPane" component={JourneyPane} />
            <Stack.Screen name="ShreenathjiScreen" component={ShreenathjiScreen} />
            <Stack.Screen name="FamilyTree" component={FamilyTree} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="CategoryChoose" component={CategoryChoose} />
            <Stack.Screen name="MainTabs" component={BottomNavigation} />
            <Stack.Screen name="Product" component={Product} />
            <Stack.Screen name="ProductDetail" component={ProductDetail} />
            <Stack.Screen name="Search" component={Search} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen name="Orders" component={Orders} />
          </Stack.Navigator>
          <NavigationLoader />
        </NavigationContainer>
      </CartProvider>
    </NavigationProvider>
  );
};

export default StackNavigation;

