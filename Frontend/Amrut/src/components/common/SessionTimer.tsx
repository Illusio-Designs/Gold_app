import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import TimerCircle from './TimerCircle';
import { useTimer } from '../../context/TimerContext';

interface SessionTimerProps {
  size?: number;
  textColor?: string;
  borderColor?: string;
  activeStrokeColor?: string;
  showDebugButton?: boolean; // Add debug button option
}

const SessionTimer: React.FC<SessionTimerProps> = ({
  size = 38, 
  textColor = '#6B0D33', 
  borderColor = '#fff', 
  activeStrokeColor = '#5D0829',
  showDebugButton = false // Default to false for production
}) => {
  const { remainingMs, displayText, sessionDuration, forceRefreshTimer } = useTimer();

  // Use dynamic session duration from admin - no fallback needed as backend ensures session duration is always set
  const finalRemainingMs = remainingMs > 0 ? remainingMs : 0;
  const finalDisplayText = displayText || 'No session';
  const finalSessionDuration = sessionDuration || 30; // Default to 30 minutes if not set

  const handleDebugRefresh = () => {
    forceRefreshTimer();
  };

  return (
    <>
      <TimerCircle 
        durationMs={finalRemainingMs} 
        displayText={finalDisplayText} 
        size={size} 
        textColor={textColor} 
        borderColor={borderColor} 
        activeStrokeColor={activeStrokeColor}
        sessionDurationMinutes={finalSessionDuration}
      />
      
      {/* Debug button - only show in development */}
      {showDebugButton && (
        <TouchableOpacity 
          style={styles.debugButton} 
          onPress={handleDebugRefresh}
        >
          <Text style={styles.debugButtonText}>🔄</Text>
        </TouchableOpacity>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  debugButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  debugButtonText: {
    fontSize: 10,
    color: 'white',
  },
});

export default SessionTimer; 