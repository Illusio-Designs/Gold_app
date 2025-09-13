import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import SessionTimer from './SessionTimer';

const Header = () => {
  return (
    <View style={styles.headerContainer}>
      <Image source={require('../../assets/img/common/maroonlogo.png')} style={styles.logo} resizeMode="contain" />
      <View style={styles.timerWrapper}>
        <SessionTimer size={45} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  logo: {
    width: 55,
    height: 55,
  },
  timerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    position: 'relative',
  },
});

export default Header; 