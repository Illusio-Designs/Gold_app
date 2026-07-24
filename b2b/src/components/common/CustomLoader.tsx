import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

interface CustomLoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  textColor?: string;
  containerStyle?: ViewStyle;
}

const CustomLoader: React.FC<CustomLoaderProps> = ({
  size = 'medium',
  text,
  textColor = '#5D0829',
  containerStyle
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 60;
      case 'large':
        return 120;
      default:
        return 80;
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <LottieView
        source={require('../../assets/animations/jIoTP711Yj.json')}
        autoPlay
        loop
        style={{ width: getSize(), height: getSize() }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
});

export default CustomLoader;

