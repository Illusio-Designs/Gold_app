import React, { useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet, ImageBackground, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../theme/colors';

const { width, height } = Dimensions.get('window');

const Splash = ({ navigation }) => {
  useEffect(() => {
    console.log('🔔 [SPLASH] Splash screen mounted');
    
    const checkAuthAndNavigate = async () => {
      try {
        console.log('🔔 [SPLASH] Checking user authentication and onboarding status...');
        
        const accessToken = await AsyncStorage.getItem('accessToken');
        const userId = await AsyncStorage.getItem('userId');
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        
        if (accessToken && userId) {
          console.log('🔔 [SPLASH] User logged in, navigating to MainTabs');
          // User is logged in, go directly to home screen
          setTimeout(() => {
            navigation.replace('MainTabs');
          }, 3000);
        } else if (hasSeenOnboarding === 'true') {
          console.log('🔔 [SPLASH] User has seen onboarding, navigating to Login');
          // User has seen onboarding before, go directly to Login
          setTimeout(() => {
            navigation.replace('Login');
          }, 3000);
        } else {
          console.log('🔔 [SPLASH] First time user, navigating to onboarding');
          // First time user, show onboarding flow
          setTimeout(() => {
            navigation.replace('JourneyPane');
          }, 3000);
        }
      } catch (error) {
        console.error('❌ [SPLASH] Error checking authentication:', error);
        // On error, default to onboarding flow
        setTimeout(() => {
          navigation.replace('JourneyPane');
        }, 3000);
      }
    };
    
    checkAuthAndNavigate();
  }, [navigation]);

  return (
    <ImageBackground
      source={require('../../assets/img/splashimg/splashbackground.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/img/splashimg/splashlogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandText}>AMRUTKUMAR GOVINDDAS LLP</Text>
      </View>
    </ImageBackground>
  );
};

const styles=StyleSheet.create({
  container:{
    flex:1,
    width: '100%',
    height: '100%',
    backgroundColor:'#5D0829',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
  },
  brandText: {
    marginTop: 24,
    color: '#C09E83',
    fontSize: 18,
    fontFamily: 'GlorifyDEMO',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
})

export default Splash; 