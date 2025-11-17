import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  text?: string;
  disabled?: boolean;
}

const Button = ({
  onPress,
  title = 'Register',
  style,
  textStyle,
  loading = false,
  text,
  disabled = false,
}: ButtonProps) => (
  <TouchableOpacity
    style={[styles.button, style, (disabled || loading) ? { opacity: 0.6 } : null]}
    onPress={onPress}
    activeOpacity={0.8}
    disabled={disabled || loading}
  >
    <Text style={[styles.text, textStyle]}>{text || title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#5D0829',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
  },
  text: {
    color: '#FCE2BF' ,
    fontSize: 20,
    fontFamily: 'GlorifyDEMO', // Use your custom font if available
    letterSpacing: 1,
  },
});

export default Button; 