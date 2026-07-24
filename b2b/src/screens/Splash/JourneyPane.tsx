import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'JourneyPane'>;
};

const { width, height } = Dimensions.get('window');

const JourneyPane = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    console.log('🔔 [JOURNEY] JourneyPane mounted');
    const timer = setTimeout(() => {
      console.log('🔔 [JOURNEY] Navigating to ShreenathjiScreen');
      navigation.replace('ShreenathjiScreen');
    }, 3000); // 3 seconds
    return () => clearTimeout(timer);
  }, [navigation]);

  const markSeen = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (error) {
      console.error('❌ [JOURNEY] Error saving onboarding status:', error);
    }
  };

  const handleSkip = async () => {
    await markSeen();
    navigation.replace('MainTabs');
  };

  const handleNext = () => {
    navigation.replace('ShreenathjiScreen');
  };

  return (
    <ImageBackground
      source={require('../../assets/img/splashimg/splashbackground.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={[styles.content, { paddingTop: insets.top }]}>
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
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.8}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
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
    fontFamily: 'GlorifyDEMO',
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
    fontFamily: 'GlorifyDEMO',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  description: {
    fontSize: 16,
    color: '#C09E83',
    fontFamily: 'GlorifyDEMO',
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  skipButton: {
    backgroundColor: 'rgba(93, 8, 41, 0.8)',
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FCE2BF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  skipButtonText: {
    color: '#FCE2BF',
    fontSize: 16,
    fontFamily: 'GlorifyDEMO',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#FCE2BF',
    paddingHorizontal: 34,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FCE2BF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nextButtonText: {
    color: '#5D0829',
    fontSize: 16,
    fontFamily: 'GlorifyDEMO',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default JourneyPane;
