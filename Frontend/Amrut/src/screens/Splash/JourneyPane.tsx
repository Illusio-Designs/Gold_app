import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, Image, Dimensions, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'JourneyPane'>;
};

const { width, height } = Dimensions.get('window');

const JourneyPane = ({ navigation }: Props) => {
  useEffect(() => {
    console.log('🔔 [JOURNEY] JourneyPane mounted');
    const timer = setTimeout(() => {
      console.log('🔔 [JOURNEY] Navigating to ShreenathjiScreen');
      navigation.replace('ShreenathjiScreen');
    }, 8000); // Changed from 3000 to 8000 (8 seconds)
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <ImageBackground
      source={require('../../assets/img/splashimg/splashbackground.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.content}>
        <Image
          source={require('../../assets/img/splashimg/splashlogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome to Your Journey</Text>
        <Text style={styles.subtitle}>Discover the world of Amrutkumar Govinddas</Text>
        <Text style={styles.description}>
          Experience our rich heritage, quality products, and exceptional service
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={() => navigation.replace('Login')}
        activeOpacity={0.8}
      >
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#5D0829',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    color: '#FCE2BF',
    fontFamily: 'Glorifydemo-BW3J3',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#C09E83',
    fontFamily: 'Glorifydemo-BW3J3',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  description: {
    fontSize: 16,
    color: '#C09E83',
    fontFamily: 'Glorifydemo-BW3J3',
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  skipButton: {
    position: 'absolute',
    bottom: 50,
    right: 30,
    backgroundColor: 'rgba(93, 8, 41, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FCE2BF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  skipButtonText: {
    color: '#FCE2BF',
    fontSize: 16,
    fontFamily: 'Glorifydemo-BW3J3',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default JourneyPane;
