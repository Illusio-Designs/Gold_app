import React, { useRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  style?: any;
  boxStyle?: any;
}

const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, style, boxStyle }) => {
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, idx: number) => {
    let newValue = value.split('');
    if (text.length > 1) {
      // If user pastes or types multiple digits, fill as much as possible
      const chars = text.split('');
      for (let i = 0; i < chars.length && idx + i < 6; i++) {
        newValue[idx + i] = chars[i].replace(/\D/g, '');
      }
      onChange(newValue.join('').slice(0, 6));
      if (idx + chars.length < 6) {
        inputs.current[idx + chars.length]?.focus();
      }
      return;
    }
    if (/^\d$/.test(text)) {
      newValue[idx] = text;
      onChange(newValue.join('').slice(0, 6));
      if (idx < 5) {
        inputs.current[idx + 1]?.focus();
      }
    } else if (text === '') {
      newValue[idx] = '';
      onChange(newValue.join('').slice(0, 6));
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {[...Array(6)].map((_, idx) => (
        <TextInput
          key={idx}
          ref={ref => (inputs.current[idx] = ref)}
          style={[styles.box, boxStyle]}
          keyboardType="number-pad"
          maxLength={1}
          value={value[idx] || ''}
          onChangeText={text => handleChange(text, idx)}
          onKeyPress={e => handleKeyPress(e, idx)}
          autoFocus={idx === 0}
          placeholder="-"
          placeholderTextColor="#A47C8C"
          textAlign="center"
          returnKeyType="next"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  box: {
    width: 40,
    height: 48,
    borderWidth: 1,
    borderColor: '#5D0829',
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 20,
    fontFamily: 'GlorifyDEMO',
    color: '#5D0829',
    marginHorizontal: 4,
    fontWeight: 'bold',
  },
});

export default OtpInput; 