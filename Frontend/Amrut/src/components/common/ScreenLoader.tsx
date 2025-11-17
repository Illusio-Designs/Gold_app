import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { wp, hp } from '../../utils/responsiveConfig';
import { isSmallScreen, isMediumScreen, isLargeScreen, getResponsiveFontSize } from '../../utils/responsive';

interface ScreenLoaderProps {
  text?: string;
  textColor?: string;
  backgroundColor?: string;
}

const ScreenLoader: React.FC<ScreenLoaderProps> = ({
  text = 'Loading...',
  textColor = '#5D0829',
  backgroundColor = '#FFFFFF'
}) => {
  const getLoaderSize = () => {
    if (isSmallScreen()) return 120;
    if (isMediumScreen()) return 140;
    if (isLargeScreen()) return 160;
    return 140;
  };

  const getTextSize = () => {
    return getResponsiveFontSize(14, 16, 18);
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.loaderContainer}>
        <LottieView
          source={require('../../assets/animations/jIoTP711Yj.json')}
          autoPlay
          loop
          style={{ width: getLoaderSize(), height: getLoaderSize() }}
        />
        <Text style={[styles.loadingText, { color: textColor, fontSize: getTextSize() }]}>
          {text}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: hp('2%'),
    fontFamily: 'GlorifyDEMO',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ScreenLoader;

