import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface TimerCircleProps {
  durationMs?: number;
  displayText?: string;
  size?: number;
  textColor?: string;
  borderColor?: string;
  activeStrokeColor?: string;
  sessionDurationMinutes?: number; // Add session duration prop
}

const TimerCircle: React.FC<TimerCircleProps> = ({
  durationMs = 0, // No default - should always come from backend
  displayText = 'No session',
  size = 38,
  textColor = '#6B0D33',
  borderColor = '#fff',
  activeStrokeColor = '#5D0829',
  sessionDurationMinutes = 30 // Default to 30 minutes if not provided
}) => {
  const animated = useRef(new Animated.Value(1)).current; // Start from 1 (full circle)
  const STROKE_WIDTH = 1; // Increased stroke width for better visibility
  const RADIUS = (size - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  useEffect(() => {
    if (durationMs > 0 && sessionDurationMinutes > 0) {
      // Calculate the progress based on actual session duration
      const totalDurationMs = sessionDurationMinutes * 60 * 1000; // Convert minutes to milliseconds
      const progress = Math.max(0, Math.min(1, durationMs / totalDurationMs));
      
      // If this is the first render or the session just started, set initial state
      if (durationMs === totalDurationMs || animated._value === 1) {
        animated.setValue(1);
      }
      
      // Animate from current value to the calculated progress
      Animated.timing(animated, {
        toValue: progress, // 1 = full circle, 0 = empty circle
        duration: 300, // Quick animation to update the circle
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else {
      // No session or no time left - show empty circle
      animated.setValue(0);
    }
  }, [animated, durationMs, sessionDurationMinutes]);

  const strokeDashoffset = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0], // 0 = full circle, CIRCUMFERENCE = empty circle
  });



  return (
    <View style={[styles.timerWrapper, { width: size, height: size }]}>
      {/* Background circle */}
      <View style={[styles.backgroundCircle, { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        borderWidth: STROKE_WIDTH,
        borderColor: borderColor,
        opacity: 0.3
      }]} />
      
      {/* Progress circle using SVG */}
      <Svg width={size} height={size} style={styles.svgOverlay}>
        <AnimatedCircle
          stroke={activeStrokeColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={`${CIRCUMFERENCE}, ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      
      {/* Text overlay */}
      <View style={[styles.timerTextWrapper, { width: size, height: size }]} pointerEvents="none">
        <Text style={[styles.timerText, { color: textColor }]}>{displayText || 'Timer'}</Text>
      </View>
    </View>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  timerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backgroundCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  timerTextWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default TimerCircle; 