import React, { useState, useEffect, useRef } from 'react';
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
import Button from '../../components/common/Button';
import OtpInput from '../../components/common/OtpInput';
import SuccessOverlay from '../../components/common/SuccessOverlay';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { verifyBusinessOTP } from '../../services/Api';
import { OTPWidget } from '@msg91comm/sendotp-react-native';
import RealtimeDataService from '../../services/RealtimeDataService';
import { useNotifications } from '../../context/NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNOtpVerify from 'react-native-otp-verify';
import { wp, hp } from '../../utils/responsiveConfig';
import { isShortScreen, isTallScreen, getResponsiveFontSize } from '../../utils/responsive';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';

const RESEND_SECONDS = 30;

// Mask the middle of the number: +91 455 XXXX XXX style
const maskPhone = (code: string, phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return `${code} ${digits}`;
  const head = digits.slice(0, 3);
  const tail = digits.slice(-2);
  return `${code} ${head} ${'X'.repeat(Math.max(0, digits.length - 5))} ${tail}`;
};

// Step 2 of the login flow: enter the OTP that was just sent.
const OtpVerify = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const { phone = '', countryCode = '+91', requestId: initialRequestId = '' } = route.params || {};
  const { onLogin } = useNotifications();
  const keyboardHeight = useKeyboardHeight();

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState(initialRequestId);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [showSuccess, setShowSuccess] = useState(false);
  const timerRef = useRef<any>(null);

  // Countdown for the resend button.
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Android SMS auto-read → fill the OTP automatically.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    RNOtpVerify.getOtp()
      .then(() => RNOtpVerify.addListener((message: string) => {
        const match = message && message.match(/\b\d{6}\b/);
        if (match) setOtp(match[0]);
      }))
      .catch(() => {});
    return () => {
      try { RNOtpVerify.removeListener(); } catch {}
    };
  }, []);

  const restartTimer = () => {
    setSecondsLeft(RESEND_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => (s > 0 ? s - 1 : 0));
    }, 1000);
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;
    try {
      const fullPhoneNumber = `${countryCode.replace('+', '')}${phone}`;
      const response: any = await OTPWidget.sendOTP({ identifier: fullPhoneNumber });
      const reqId =
        (response && response.request_id) ||
        (response && response.otpResponse && response.otpResponse.request_id) ||
        (response && response.message) ||
        requestId;
      setRequestId(reqId);
      setOtp('');
      setOtpError('');
      restartTimer();
    } catch (e) {
      // MSG91 sometimes throws even on success; keep the timer running regardless.
      restartTimer();
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setOtpError('Please enter a valid OTP');
      return;
    }
    setOtpError('');
    setLoading(true);
    try {
      let response: any;
      try {
        response = await OTPWidget.verifyOTP({ otp, reqId: requestId });
        if (typeof response === 'string') {
          if (response.trim() === '') throw new Error('Empty response from OTP verification.');
          response = JSON.parse(response);
        }
      } catch (err) {
        setOtpError('Invalid OTP. Please try again.');
        setLoading(false);
        return;
      }

      if (response.type === 'success' && response.message) {
        let normalizedPhone = phone;
        if (normalizedPhone.startsWith('0')) normalizedPhone = normalizedPhone.slice(1);
        if (normalizedPhone.length > 10 && normalizedPhone.startsWith('91')) normalizedPhone = normalizedPhone.slice(-10);

        const loginResult = await verifyBusinessOTP(normalizedPhone);
        if (loginResult.token) {
          await AsyncStorage.setItem('accessToken', loginResult.token);
          if (loginResult.user && loginResult.user.id) {
            await AsyncStorage.setItem('userId', loginResult.user.id.toString());
            if (loginResult.user.name) await AsyncStorage.setItem('userName', loginResult.user.name);
            if (loginResult.user.type) await AsyncStorage.setItem('userType', loginResult.user.type);
          }
          RealtimeDataService.reconnectWithAuth?.();
          onLogin().catch(() => {});
          setShowSuccess(true);
        } else {
          Alert.alert('Login Failed', loginResult.error || 'Could not log you in.');
        }
      } else {
        setOtpError('Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      setOtpError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
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
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Image source={require('../../assets/img/common/backarrow.png')} style={styles.backArrow} />
          </TouchableOpacity>

          <View style={styles.form}>
            <Text style={styles.heading}>Enter Your OTP</Text>
            <Text style={styles.subheading}>
              Enter the code that we have sent to{'\n'}
              <Text style={styles.phoneText}>{maskPhone(countryCode, phone)}</Text>
            </Text>

            <OtpInput value={otp} onChange={setOtp} />
            {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

            <View style={styles.resendRow}>
              {secondsLeft > 0 ? (
                <Text style={styles.resendMuted}>Resend OTP in {secondsLeft}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendActive}>Resend OTP</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.resendActive}>Change number</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Verify button — pinned above the keyboard so it stays reachable */}
        <View style={[styles.bottomBar, { marginBottom: keyboardHeight }]}>
          <Button onPress={handleVerifyOtp} title={loading ? 'Verifying…' : 'Verify Code'} disabled={loading} style={{ marginTop: 0 }} textStyle={{}} />
        </View>
      </View>

      <SuccessOverlay
        visible={showSuccess}
        message={'OTP Verified'}
        onDone={() => {
          setShowSuccess(false);
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        }}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: wp('7.5%'),
    paddingTop: isShortScreen() ? hp('2.5%') : hp('4%'),
    paddingBottom: hp('3%'),
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(93,8,41,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('3%'),
  },
  backArrow: { width: 22, height: 22, resizeMode: 'contain', tintColor: '#5D0829' },
  form: { width: '100%' },
  heading: {
    color: '#5D0829',
    fontSize: getResponsiveFontSize(26, 29, 32),
    fontFamily: 'GlorifyDEMO',
    fontWeight: '700',
  },
  subheading: {
    color: '#8A7A80',
    fontSize: getResponsiveFontSize(13, 14, 15),
    fontFamily: 'GlorifyDEMO',
    marginTop: 8,
    marginBottom: hp('3%'),
    lineHeight: 21,
  },
  phoneText: { color: '#5D0829', fontWeight: '700' },
  errorText: {
    color: '#C0392B',
    fontSize: 12.5,
    fontFamily: 'GlorifyDEMO',
    marginTop: 4,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp('2%'),
  },
  resendMuted: {
    color: '#8A7A80',
    fontSize: getResponsiveFontSize(13, 14, 15),
    fontFamily: 'GlorifyDEMO',
  },
  resendActive: {
    color: '#5D0829',
    fontSize: getResponsiveFontSize(13, 14, 15),
    fontWeight: 'bold',
    fontFamily: 'GlorifyDEMO',
  },
  bottomBar: {
    paddingHorizontal: wp('7.5%'),
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1,
    borderTopColor: '#F0E7DA',
  },
});

export default OtpVerify;
