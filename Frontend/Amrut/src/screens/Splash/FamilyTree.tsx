import React, { useEffect } from 'react';
import { StyleSheet, ImageBackground, Dimensions, TouchableOpacity, Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'FamilyTree'>;
};

const { width, height } = Dimensions.get('window');

const FamilyTree = ({ navigation }: Props) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 8000); // Changed from 3000 to 8000 (8 seconds)
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <ImageBackground
      source={require('../../assets/img/splashimg/FamilyTree.png')}
      style={styles.container}
      resizeMode="cover"
    >
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

export default FamilyTree; 