import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SessionTimer from './SessionTimer';
import { useTimer } from '../../context/TimerContext';

interface CustomHeaderProps {
  title: string;
  timer?: boolean;
  onBack?: () => void;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ title, timer, onBack }) => {
  const navigation = useNavigation();
  const { displayText } = useTimer();

  return (
    <View style={styles.headerRow}>
      <TouchableOpacity onPress={onBack || (() => (navigation as any).goBack())} style={styles.backBtn}>
        <Image source={require('../../assets/img/common/backarrow.png')} style={styles.backArrow} />
      </TouchableOpacity>
      <Text style={styles.header}>{title}</Text>
      <View style={{ flex: 1 }} />
      {timer && <SessionTimer size={45} />}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  backArrow: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    tintColor: '#6B0D33',
  },
  header: {
    color: '#6B0D33',
    fontSize: 26,
    fontWeight: '700',
    marginLeft: 2,
    fontFamily: 'Glorifydemo-BW3J3'
  },
});

export default CustomHeader; 