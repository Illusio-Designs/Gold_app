import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { wp, hp } from '../../utils/responsiveConfig';
import { isSmallScreen, isMediumScreen, isLargeScreen, getResponsiveFontSize } from '../../utils/responsive';
import { useNavigationLoader } from '../../context/NavigationContext';

const NavigationLoader: React.FC = () => {
  const { isLoaderVisible, loaderText, loaderDuration, hideLoader } = useNavigationLoader();
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  useEffect(() => {
    if (isLoaderVisible) {
      setIsVisible(true);
      // Fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        hideLoader();
      }, loaderDuration);

      return () => clearTimeout(timer);
    } else {
      handleHide();
    }
  }, [isLoaderVisible, loaderDuration, hideLoader]);

  const handleHide = () => {
    // Fade out and scale down
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
    });
  };

  if (!isVisible) return null;

  const getLoaderSize = () => {
    if (isSmallScreen()) return 140;
    if (isMediumScreen()) return 160;
    if (isLargeScreen()) return 180;
    return 160;
  };

  const getTextSize = () => {
    return getResponsiveFontSize(16, 18, 20);
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      <View style={styles.overlay} />
      <View style={styles.loaderContainer}>
        <LottieView
          source={require('../../assets/animations/jIoTP711Yj.json')}
          autoPlay
          loop
          style={{ width: getLoaderSize(), height: getLoaderSize() }}
        />
        <Text style={[styles.loadingText, { fontSize: getTextSize() }]}>
          {loaderText}
        </Text>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  loadingText: {
    marginTop: hp('2%'),
    marginBottom: hp('3%'),
    fontFamily: 'GlorifyDEMO',
    fontWeight: '700',
    textAlign: 'center',
    color: '#5D0829',
  },
  progressBar: {
    width: wp('60%'),
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5D0829',
    borderRadius: 2,
    width: '100%',
  },
});

export default NavigationLoader;
