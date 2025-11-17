import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

interface CustomTextInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  style?: any;
  placeholderTextColor?: string;
  secureTextEntry?: boolean;
  rightIcon?: React.ReactNode;
  editable?: boolean;
}

const CustomTextInput = ({ 
  placeholder, 
  value, 
  onChangeText, 
  keyboardType = 'default',
  style,
  placeholderTextColor = '#A47C8C',
  secureTextEntry = false,
  rightIcon,
  editable = true,
}: CustomTextInputProps) => (
  <>
    <TextInput 
      style={[styles.input, { fontWeight: 'bold' }, style]} 
      placeholder={placeholder} 
      value={value} 
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholderTextColor={placeholderTextColor}
      secureTextEntry={secureTextEntry}
      editable={editable}
    />
    {rightIcon ? (
      <>{rightIcon}</>
    ) : null}
  </>
);

const styles = StyleSheet.create({
  input: {
    borderWidth: 0.5,
    borderColor: '#5D0829',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#5D0829',
    marginBottom: 12,
    backgroundColor: '#fff',
    fontFamily: 'GlorifyDEMO',
  },
});

export default CustomTextInput; 