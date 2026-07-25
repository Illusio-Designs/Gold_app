import React from 'react';
import { View, StyleSheet } from 'react-native';

// Small India flag drawn with views (no image asset): saffron / white / green
// stripes with a navy Ashoka-chakra ring in the middle band.
const FlagIN: React.FC<{ width?: number }> = ({ width = 23 }) => {
  const height = Math.round((width * 15) / 23);
  const band = height / 3;
  return (
    <View style={[styles.flag, { width, height }]}>
      <View style={{ height: band, backgroundColor: '#FF9933' }} />
      <View style={{ height: band, backgroundColor: '#FFFFFF' }} />
      <View style={{ height: band, backgroundColor: '#138808' }} />
      <View style={[styles.chakra, { width: band * 0.7, height: band * 0.7, top: band + band * 0.15 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  flag: {
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  chakra: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0A3A8F',
  },
});

export default FlagIN;
