import React, { useEffect } from 'react';
import { StyleSheet, ImageBackground, Dimensions, TouchableOpacity, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'FamilyTree'>;
};

const { width, height } = Dimensions.get('window');

const FamilyTree = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(async () => {
      // Mark onboarding as seen before navigating to MainTabs
      try {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        console.log('🔔 [FAMILY TREE] Onboarding marked as seen');
      } catch (error) {
        console.error('❌ [FAMILY TREE] Error saving onboarding status:', error);
      }
      navigation.replace('MainTabs');
    }, 3000); // 3 seconds
    return () => clearTimeout(timer);
  }, [navigation]);

  // Last onboarding screen — both Next and Skip finish onboarding.
  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (error) {
      console.error('❌ [FAMILY TREE] Error saving onboarding status:', error);
    }
    navigation.replace('MainTabs');
  };

  return (
    <ImageBackground
      source={require('../../assets/img/splashimg/FamilyTree.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <TouchableOpacity style={styles.skipButton} onPress={finishOnboarding} activeOpacity={0.8}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={finishOnboarding} activeOpacity={0.85}>
          <Text style={styles.nextButtonText}>Get Started</Text>
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
    paddingHorizontal: 30,
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

export default FamilyTree;