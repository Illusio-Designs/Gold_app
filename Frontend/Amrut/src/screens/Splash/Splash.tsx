import React, { useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet, ImageBackground, Image } from 'react-native';
import colors from '../../theme/colors';

const { width, height } = Dimensions.get('window');

const Splash = ({ navigation }) => {
  useEffect(() => {
    console.log('🔔 [SPLASH] Splash screen mounted');
    const timer = setTimeout(() => {
      console.log('🔔 [SPLASH] Navigating to JourneyPane');
      navigation.replace('JourneyPane');
    }, 3000);
    return () => clearTimeout(timer);
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
    fontFamily: 'Glorifydemo-BW3J3',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
})

export default Splash; 