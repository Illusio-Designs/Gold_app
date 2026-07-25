import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import CustomTextInput from '../../components/common/CustomTextInput';
import Button from '../../components/common/Button';
import CountryPickerModal from '../../components/common/CountryPickerModal';
import { FlagIN } from '../../components/ui';
import { Country } from '../../data/countries';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MSG91_WIDGET_ID, MSG91_TOKEN_AUTH } from '@env';
import { OTPWidget } from '@msg91comm/sendotp-react-native';
import { wp, hp } from '../../utils/responsiveConfig';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { isSmallScreen, isMediumScreen, isLargeScreen, isShortScreen, isTallScreen, getResponsiveSpacing, getResponsiveFontSize } from '../../utils/responsive';

// --- MSG91 Configuration (from .env via @env — not hardcoded in source) ---
const WIDGET_ID = MSG91_WIDGET_ID;
const TOKEN_AUTH = MSG91_TOKEN_AUTH;

// Step 1 of the login flow: collect the phone number and send an OTP. On
// success we move to the dedicated OtpVerify screen (step 2).
const Login = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [phone, setPhone] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countryFlag, setCountryFlag] = useState('🇮🇳');
  const [countryCode, setCountryCode] = useState('+91');
  const [sendingOtp, setSendingOtp] = useState(false);
  const keyboardHeight = useKeyboardHeight();

  useEffect(() => {
    OTPWidget.initializeWidget(WIDGET_ID, TOKEN_AUTH);
  }, []);

  const handleSelectCountry = (country: Country) => {
    setCountryFlag(country.emoji);
    setCountryCode(country.dial_code);
    setCountryModalVisible(false);
  };

  const handleSendOtp = async () => {
    if (!phone || phone.replace(/\D/g, '').length < 6) {
      Alert.alert('Enter phone number', 'Please enter a valid phone number.');
      return;
    }
    setSendingOtp(true);
    try {
      const fullPhoneNumber = `${countryCode.replace('+', '')}${phone}`;
      const response: any = await OTPWidget.sendOTP({ identifier: fullPhoneNumber });

      const hasRequestId = typeof response === 'object' && response !== null && 'request_id' in response;
      const hasOtpResponseRequestId = typeof response === 'object' && response !== null && 'otpResponse' in response && response.otpResponse && 'request_id' in response.otpResponse;
      const hasMessage = typeof response === 'object' && response !== null && 'message' in response && typeof response.message === 'string';
      const isLongString = typeof response === 'string' && response.length > 10;
      const isOtpSentMsg = hasMessage && response.message.toLowerCase().includes('otp sent');
      const isTypeSuccess = typeof response === 'object' && response !== null && 'type' in response && response.type === 'success';
      const isSuccess = isTypeSuccess || hasRequestId || hasOtpResponseRequestId || isLongString || isOtpSentMsg;

      if (isSuccess) {
        const reqId =
          (hasRequestId && typeof response.request_id === 'string' ? response.request_id : '') ||
          (hasOtpResponseRequestId && typeof response.otpResponse.request_id === 'string' ? response.otpResponse.request_id : '') ||
          (hasMessage && typeof response.message === 'string' ? response.message : '') ||
          '';
        navigation.navigate('OtpVerify', { phone, countryCode, requestId: reqId });
      } else {
        Alert.alert('Error', hasMessage ? response.message : 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      const error = err as any;
      const hasRequestId = typeof error === 'object' && error !== null && 'request_id' in error;
      const hasMessage = typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string';
      const isLongString = typeof error === 'string' && error.length > 10;
      const isOtpSentMsg = hasMessage && error.message.toLowerCase().includes('otp sent');
      const isSuccess = hasRequestId || isLongString || isOtpSentMsg;

      if (isSuccess) {
        const reqId =
          (hasRequestId && typeof error.request_id === 'string' ? error.request_id : '') ||
          (hasMessage && typeof error.message === 'string' ? error.message : '') ||
          '';
        navigation.navigate('OtpVerify', { phone, countryCode, requestId: reqId });
      } else {
        Alert.alert('Error', hasMessage ? error.message : 'Failed to send OTP. Please try again.');
      }
    } finally {
      setSendingOtp(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/img/common/bgdesign.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image source={require('../../assets/img/common/maroonlogo.png')} style={styles.logo} resizeMode="contain" />

          <View style={styles.form}>
            <Text style={styles.heading}>Welcome Back</Text>
            <Text style={styles.subheading}>Enter your phone number to continue.</Text>

            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.countryCodeBox} onPress={() => setCountryModalVisible(true)}>
                {countryCode === '+91' ? (
                  <FlagIN />
                ) : (
                  <Text style={styles.flag}>{countryFlag}</Text>
                )}
                <Text style={styles.countryCode}>{countryCode}</Text>
              </TouchableOpacity>
              <CustomTextInput
                placeholder="0000000000"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={styles.phoneInput}
              />
            </View>
          </View>

          <View style={styles.orContinueWithRow}>
            <View style={styles.line} />
            <Text style={styles.orContinueWithText}>Or Continue With</Text>
            <View style={styles.line} />
          </View>
          <View style={styles.registerRow}>
            <Text style={styles.noAccountText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Register</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.skipLoginButton}
            onPress={() => navigation.navigate('MainTabs')}
            activeOpacity={0.7}
          >
            <Text style={styles.skipLoginText}>Skip Login</Text>
          </TouchableOpacity>

          <CountryPickerModal
            visible={countryModalVisible}
            onClose={() => setCountryModalVisible(false)}
            onSelect={handleSelectCountry}
          />
        </ScrollView>

        {/* Primary action pinned above the keyboard */}
        <View style={[styles.bottomBar, { marginBottom: keyboardHeight }]}>
          <Button onPress={handleSendOtp} title={sendingOtp ? 'Sending…' : 'Continue'} disabled={sendingOtp} style={{ marginTop: 0 }} textStyle={{}} />
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: isShortScreen() ? hp('3%') : hp('5%'),
    paddingBottom: hp('3%'),
  },
  bottomBar: {
    paddingHorizontal: wp('7.5%'),
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1,
    borderTopColor: '#F0E7DA',
  },
  logo: {
    width: isSmallScreen() ? wp('35%') : isMediumScreen() ? wp('32%') : wp('30%'),
    height: isSmallScreen() ? wp('35%') : isMediumScreen() ? wp('32%') : wp('30%'),
    alignSelf: 'center',
    marginBottom: getResponsiveSpacing(18, 22, 26),
    marginTop: getResponsiveSpacing(18, 22, 26),
  },
  form: {
    width: isSmallScreen() ? '90%' : isMediumScreen() ? '88%' : '85%',
    alignSelf: 'center',
    marginTop: getResponsiveSpacing(8, 10, 12),
  },
  heading: {
    color: '#5D0829',
    fontSize: getResponsiveFontSize(24, 27, 30),
    fontFamily: 'GlorifyDEMO',
    fontWeight: '700',
  },
  subheading: {
    color: '#8A7A80',
    fontSize: getResponsiveFontSize(12, 13, 14),
    fontFamily: 'GlorifyDEMO',
    marginTop: 4,
    marginBottom: getResponsiveSpacing(18, 22, 26),
  },
  label: {
    color: '#5D0829',
    fontSize: getResponsiveFontSize(12, 13, 14),
    fontFamily: 'GlorifyDEMO',
    fontWeight: '700',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(8, 10, 12),
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#5D0829',
    borderRadius: 15,
    paddingHorizontal: getResponsiveSpacing(12, 14, 16),
    paddingVertical: getResponsiveSpacing(6, 8, 10),
    backgroundColor: '#fff',
    height: getResponsiveSpacing(44, 48, 52),
  },
  flag: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    marginRight: getResponsiveSpacing(4, 6, 8),
  },
  countryCode: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#5D082980',
    fontWeight: 'bold',
    fontFamily: 'GlorifyDEMO',
  },
  phoneInput: {
    flex: 1,
    marginLeft: getResponsiveSpacing(6, 8, 10),
    marginBottom: 0,
    height: getResponsiveSpacing(44, 48, 52),
  },
  orContinueWithRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: getResponsiveSpacing(24, 28, 32),
    marginBottom: getResponsiveSpacing(6, 8, 10),
    width: isSmallScreen() ? '95%' : isMediumScreen() ? '92%' : '90%',
    alignSelf: 'center',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  orContinueWithText: {
    marginHorizontal: getResponsiveSpacing(6, 8, 10),
    color: '#999999',
    fontFamily: 'GlorifyDEMO',
    fontSize: getResponsiveFontSize(10, 12, 14),
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveSpacing(6, 8, 10),
  },
  noAccountText: {
    color: '#010F1C',
    fontSize: getResponsiveFontSize(10, 12, 14),
  },
  registerText: {
    color: '#5D0829',
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontFamily: 'GlorifyDEMO',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  skipLoginButton: {
    marginTop: getResponsiveSpacing(20, 24, 28),
    backgroundColor: 'rgba(93, 8, 41, 0.1)',
    paddingHorizontal: getResponsiveSpacing(24, 28, 32),
    paddingVertical: getResponsiveSpacing(12, 14, 16),
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#5D0829',
    alignSelf: 'center',
    width: isSmallScreen() ? '80%' : isMediumScreen() ? '75%' : '70%',
  },
  skipLoginText: {
    color: '#5D0829',
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontFamily: 'GlorifyDEMO',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Login;
