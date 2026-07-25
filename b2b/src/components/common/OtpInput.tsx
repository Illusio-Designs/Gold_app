import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  style?: any;
  boxStyle?: any;
}

// Single-field OTP entry disguised as 6 boxes.
//
// The old version used 6 separate TextInputs, each maxLength={1}. On iOS the
// one-time-code autofill ("From Messages, 2413…") can only populate ONE field,
// so it dropped a single digit into box 0 and the rest stayed blank — autofill
// looked broken. A hidden, full-width TextInput with maxLength={6} +
// textContentType="oneTimeCode" receives the FULL code from iOS autofill (and
// SMS Retriever on Android), and we paint 6 read-only boxes on top of it. One
// real field => autofill fills all six.
const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, style, boxStyle }) => {
  const inputRef = useRef<TextInput | null>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    // keep digits only, cap at 6
    const digits = text.replace(/\D/g, '').slice(0, 6);
    onChange(digits);
  };

  const focus = () => inputRef.current?.focus();

  const cells = [...Array(6)].map((_, idx) => {
    const char = value[idx] || '';
    // active cell = the next empty slot (or the last one when full)
    const isActive = focused && (idx === value.length || (value.length === 6 && idx === 5));
    return (
      <View
        key={idx}
        style={[
          styles.box,
          boxStyle,
          isActive && styles.boxActive,
          char ? styles.boxFilled : null,
        ]}
      >
        <Text style={styles.boxText}>{char || ''}</Text>
      </View>
    );
  });

  return (
    <TouchableWithoutFeedback onPress={focus}>
      <View style={[styles.container, style]}>
        {cells}

        {/* The real input — transparent and stretched across all 6 boxes so a
            tap anywhere focuses it and the caret/selection stay invisible. */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={value}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          caretHidden
          textContentType="oneTimeCode"
          autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
          importantForAutofill="yes"
          returnKeyType="done"
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    position: 'relative',
  },
  box: {
    width: 40,
    height: 48,
    borderWidth: 1,
    borderColor: '#5D0829',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    backgroundColor: '#FBF3E6',
  },
  boxActive: {
    borderColor: '#C09E83',
    borderWidth: 2,
  },
  boxText: {
    fontSize: 20,
    fontFamily: 'GlorifyDEMO',
    color: '#5D0829',
    fontWeight: 'bold',
  },
  // Covers the whole row; transparent text/background so only the boxes show.
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    color: 'transparent',
    fontSize: 20,
  },
});

export default OtpInput;
