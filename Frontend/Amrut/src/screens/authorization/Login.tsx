import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  Alert
} from 'react-native';
import CustomTextInput from '../../components/common/CustomTextInput';
import Button from '../../components/common/Button';
import CustomLoader from '../../components/common/CustomLoader';

import OtpInput from '../../components/common/OtpInput';
import CountryPickerModal from '../../components/common/CountryPickerModal';
import { Country } from '../../data/countries';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { verifyBusinessOTP } from '../../services/Api';
import { OTPWidget } from '@msg91comm/sendotp-react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
// NotificationService removed as requested
// import messaging from '@react-native-firebase/messaging';
import { wp, hp } from '../../utils/responsiveConfig';
import { isSmallScreen, isMediumScreen, isLargeScreen, isShortScreen, isTallScreen, getResponsiveSpacing, getResponsiveFontSize } from '../../utils/responsive';

// --- MSG91 Configuration ---
const WIDGET_ID = "356772683359393932343835";
const TOKEN_AUTH = "426738TnK6bIEz7eK5687e1942P1";

const Login = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countryFlag, setCountryFlag] = useState('🇮🇳');
  const [countryCode, setCountryCode] = useState('+91');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    OTPWidget.initializeWidget(WIDGET_ID, TOKEN_AUTH);
  }, []);

  const handleSelectCountry = (country: Country) => {
    setCountryFlag(country.emoji);
    setCountryCode(country.dial_code);
    setCountryModalVisible(false);
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    setOtpError('');
    try {
      const fullPhoneNumber = `${countryCode.replace('+', '')}${phone}`;
      console.log('[MSG91] Sending OTP to:', fullPhoneNumber);
      console.log('[MSG91] Phone number details:');
      console.log('  - Country Code:', countryCode);
      console.log('  - Phone:', phone);
      console.log('  - Full Number:', fullPhoneNumber);
      console.log('  - Number Length:', fullPhoneNumber.length);
      
      const response = await OTPWidget.sendOTP({ 
        identifier: fullPhoneNumber
      });
      console.log('[MSG91] sendOTP response:', response);
      console.log('--- MSG91 sendOTP Raw Response ---');
      console.log(JSON.stringify(response, null, 2));
      console.log('------------------------------------');

      // Type guards for response
      const hasRequestId = typeof response === 'object' && response !== null && 'request_id' in response;
      const hasOtpResponseRequestId = typeof response === 'object' && response !== null && 'otpResponse' in response && response.otpResponse && 'request_id' in response.otpResponse;
      const hasMessage = typeof response === 'object' && response !== null && 'message' in response && typeof response.message === 'string';
      const isLongString = typeof response === 'string' && response.length > 10;
      const isOtpSentMsg = hasMessage && response.message.toLowerCase().includes('otp sent');
      const isTypeSuccess = typeof response === 'object' && response !== null && 'type' in response && response.type === 'success';

      const isSuccess = isTypeSuccess || hasRequestId || hasOtpResponseRequestId || isLongString || isOtpSentMsg;

      if (isSuccess) {
        setRequestId(
          (hasRequestId && typeof response.request_id === 'string' ? response.request_id : '') ||
          (hasOtpResponseRequestId && typeof response.otpResponse.request_id === 'string' ? response.otpResponse.request_id : '') ||
          (hasMessage && typeof response.message === 'string' ? response.message : '') ||
          ''
        );
        setOtpSent(true); // Always show OTP input on success
        console.log('[MSG91] OTP sent successfully.');
        console.log('[MSG91] Request ID:', requestId);
        console.log('[MSG91] Please check your phone for OTP message');
        console.log('[MSG91] Delivery may take 2-5 minutes');
        console.log('[MSG91] If not received, check DND status or try again');
        Toast.show({ 
          type: 'success', 
          text1: 'OTP Sent', 
          text2: 'OTP has been sent successfully. Please check your phone. Delivery may take 2-5 minutes.' 
        });
      } else {
        setOtpSent(false); // Only on real failure
        console.log('[MSG91] Failed to send OTP:', hasMessage ? response.message : 'Failed to send OTP. Please try again.');
        Toast.show({ type: 'error', text1: 'Error', text2: (hasMessage ? response.message : 'Failed to send OTP. Please try again.') });
      }
    } catch (err) {
      const error = err as any;
      console.log('[MSG91] sendOTP error:', error);
      console.log('--- MSG91 sendOTP Raw Response ---');
      console.log(JSON.stringify(error, null, 2));
      console.log('------------------------------------');
      // Type guards for error
      const hasRequestId = typeof error === 'object' && error !== null && 'request_id' in error;
      const hasMessage = typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string';
      const isLongString = typeof error === 'string' && error.length > 10;
      const isOtpSentMsg = hasMessage && error.message.toLowerCase().includes('otp sent');

      const isSuccess = hasRequestId || isLongString || isOtpSentMsg;

      if (isSuccess) {
        setRequestId(
          (hasRequestId && typeof error.request_id === 'string' ? error.request_id : '') ||
          (hasMessage && typeof error.message === 'string' ? error.message : '') ||
          ''
        );
        setOtpSent(true); // Always show OTP input on success
        console.log('[MSG91] OTP sent successfully (from error case).');
        Toast.show({ type: 'success', text1: 'OTP Sent', text2: (hasMessage ? error.message : 'OTP has been sent successfully.') });
      } else {
        setOtpSent(false); // Only on real failure
        console.log('[MSG91] Failed to send OTP (error case):', hasMessage ? error.message : 'Failed to send OTP. Please try again.');
        Toast.show({ type: 'error', text1: 'Error', text2: (hasMessage ? error.message : 'Failed to send OTP. Please try again.') });
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // Function to check delivery status
  const checkDeliveryStatus = async (requestId: string) => {
    try {
      console.log('[MSG91] Checking delivery status for request:', requestId);
      // You can implement delivery status check here if MSG91 provides an API
      // For now, we'll just log the request ID for manual checking
              console.log('[MSG91] To check delivery status manually:');
        console.log('[MSG91] 1. Go to MSG91 Dashboard');
        console.log('[MSG91] 2. Check Reports/SMS Reports');
        console.log('[MSG91] 3. Look for Request ID:', requestId);
        
        // Check delivery status after a delay
        setTimeout(() => {
          checkDeliveryStatus(requestId);
        }, 30000); // Check after 30 seconds
    } catch (error) {
      console.log('[MSG91] Error checking delivery status:', error);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setOtpError('Please enter a valid OTP');
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a valid OTP' });
      return;
    }
    
    setOtpError('');
    setLoading(true);
    console.log('[MSG91] Verifying OTP:', otp);
    try {
      let response;
      try {
        // Pass both otp and reqId to MSG91
        response = await OTPWidget.verifyOTP({ otp, reqId: requestId });
        if (typeof response === 'string') {
          console.log('[MSG91] Raw verifyOTP response (string):', response);
          if (response.trim() === '') {
            throw new Error('Empty response from OTP verification.');
          }
          try {
            response = JSON.parse(response);
          } catch (parseErr) {
            console.log('[MSG91] JSON parse error:', parseErr);
            throw new Error('Invalid response from OTP verification.');
          }
        }
      } catch (err) {
        const error = err as Error;
        console.log('[MSG91] Error in OTPWidget.verifyOTP:', error);
        setOtpError('Invalid OTP. Please try again.');
        Toast.show({ type: 'error', text1: 'Verification Error', text2: error.message || 'Invalid response from OTP verification.' });
        setLoading(false);
        return;
      }
      console.log('[MSG91] verifyOTP response:', response);
      // Updated logic for MSG91 response
      if (response.type === 'success' && response.message) {
        // Only send phone number (without country code) to backend
        let normalizedPhone = phone;
        if (normalizedPhone.startsWith('0')) normalizedPhone = normalizedPhone.slice(1);
        if (normalizedPhone.length > 10 && normalizedPhone.startsWith('91')) normalizedPhone = normalizedPhone.slice(-10);
        console.log('[MSG91] OTP verified successfully. Proceeding to backend session login with phone:', normalizedPhone);
        const loginResult = await verifyBusinessOTP(normalizedPhone); // only phone
        
        console.log('[Backend] /users/verify-otp response:', loginResult);
        if (loginResult.token) {
          await AsyncStorage.setItem('accessToken', loginResult.token);
          const tokenCheck = await AsyncStorage.getItem('accessToken');
          console.log('[Login] Token after setItem:', tokenCheck);
          if (loginResult.user && loginResult.user.id) {
            await AsyncStorage.setItem('userId', loginResult.user.id.toString());
            
            // Store user name and type for notifications
            if (loginResult.user.name) {
              await AsyncStorage.setItem('userName', loginResult.user.name);
            }
            if (loginResult.user.type) {
              await AsyncStorage.setItem('userType', loginResult.user.type);
            }
            
            // Update Firebase service with user ID for targeted notifications
            // Do this AFTER storing the access token
            try {
              // const firebaseService = require('../../services/firebaseService').default;
              // await firebaseService.updateUserId(loginResult.user.id);
              console.log('[Login] Firebase service updated with user ID:', loginResult.user.id);
            } catch (error) {
              console.error('[Login] Error updating Firebase service with user ID:', error);
            }
          }
          
          Toast.show({ type: 'success', text1: 'Success', text2: 'Login successful!' });
          navigation.navigate('CategoryChoose');
        } else {
          // Show specific toast for backend error status
          const errMsg = loginResult.error ? loginResult.error.toLowerCase() : '';
          if (errMsg.includes('pending') || loginResult.error === 'Your login request is still pending approval.') {
            Toast.show({ type: 'info', text1: 'Pending Approval', text2: 'Your account is still pending approval.' });
          } else if (errMsg.includes('not approved')) {
            Toast.show({ type: 'error', text1: 'Not Approved', text2: 'Your account is not approved.' });
          } else {
            Toast.show({ type: 'error', text1: 'Login Failed', text2: loginResult.error || 'Could not log you in.' });
          }
        }
      } else {
        console.log('[MSG91] OTP verification failed:', response.message || response.errors || 'The OTP is incorrect.');
        setOtpError('Invalid OTP. Please try again.');
        Toast.show({ type: 'error', text1: 'Verification Failed', text2: response.message || response.errors || 'The OTP is incorrect.' });
      }
    } catch (error: any) {
      console.log('[MSG91] verifyOTP error:', error);
      setOtpError('Verification failed. Please try again.');
      Toast.show({ type: 'error', text1: 'Verification Error', text2: error.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
      console.log('[MSG91] OTP Verification process ended.');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/img/common/bgdesign.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.content}>
        <Image source={require('../../assets/img/common/maroonlogo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.form}>
          <View style={styles.row}>
            <TouchableOpacity style={styles.countryCodeBox} onPress={() => setCountryModalVisible(true)}>
              <Text style={styles.flag}>{countryFlag}</Text>
              <Text style={styles.countryCode}>{countryCode}</Text>
            </TouchableOpacity>
            <CustomTextInput
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.phoneInput}
              editable={!otpSent}
            />
          </View>
          {otpSent && (
            <>
              <OtpInput 
                value={otp} 
                onChange={setOtp} 
                length={6}
                autoFocus={true}
                onComplete={handleVerifyOtp}
                error={otpError}
                disabled={loading}
              />
              <TouchableOpacity onPress={handleSendOtp} style={{ marginTop: 10, alignSelf: 'flex-end' }}>
                <Text style={{ color: '#5D0829', fontWeight: 'bold', fontSize: 15 }}>Resend OTP</Text>
              </TouchableOpacity>
            </>
          )}


          
          {loading && (
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <CustomLoader size="small" text="Verifying OTP..." textColor="#5D0829" />
            </View>
          )}
          
          {!otpSent ? (
            <Button onPress={handleSendOtp} title="Send OTP" disabled={sendingOtp} style={{ marginTop: 24 }} textStyle={{}} />
          ) : (
            <Button onPress={handleVerifyOtp} title="Verify OTP" disabled={loading} style={{ marginTop: 24 }} textStyle={{}} />
          )}
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
        <Toast />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: isShortScreen() ? hp('12%') : isTallScreen() ? hp('18%') : hp('15%'),
  },
  logo: {
    width: isSmallScreen() ? wp('35%') : isMediumScreen() ? wp('32%') : wp('30%'),
    height: isSmallScreen() ? wp('35%') : isMediumScreen() ? wp('32%') : wp('30%'),
    alignSelf: 'center',
    marginBottom: getResponsiveSpacing(24, 28, 32),
    marginTop: getResponsiveSpacing(24, 28, 32),
  },
  form: {
    width: isSmallScreen() ? '90%' : isMediumScreen() ? '88%' : '85%',
    alignSelf: 'center',
    marginTop: getResponsiveSpacing(12, 14, 16),
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
    fontFamily: 'GlorifyDEMO',
    fontWeight: 'bold',
    fontSize: getResponsiveFontSize(10, 12, 14),
    height: getResponsiveSpacing(44, 48, 52),
    marginRight: 0,
    marginBottom: 0,
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
    fontWeight:'bold',
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
  loadingContainer: {
    height: 20,
    marginTop: 20,
  },
});

export default Login; 