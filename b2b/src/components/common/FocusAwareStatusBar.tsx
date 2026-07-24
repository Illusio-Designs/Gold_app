import React from 'react';
import { StatusBar, StatusBarProps } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

// Only the focused screen drives the status-bar appearance, so screens with a
// maroon header (light icons) and screens with a light top bar (dark icons)
// can each set the correct battery/clock colour without fighting each other.
const FocusAwareStatusBar: React.FC<StatusBarProps> = props => {
  const isFocused = useIsFocused();
  return isFocused ? <StatusBar {...props} /> : null;
};

export default FocusAwareStatusBar;
