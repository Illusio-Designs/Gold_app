import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import Button from '../../components/common/Button';
import CustomTextInput from '../../components/common/CustomTextInput';
import ScreenLoader from '../../components/common/ScreenLoader';
// import RNPickerSelect from 'react-native-picker-select';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CountryPickerModal from '../../components/common/CountryPickerModal';
import { Country } from '../../data/countries';
import CityPickerModal from '../../components/common/CityPickerModal';
import { countryCities, cityToState } from '../../data/cities';
import { registerUser } from '../../services/Api';
import Toast from 'react-native-toast-message';
import { wp, hp } from '../../utils/responsiveConfig';
import { isSmallScreen, isMediumScreen, isLargeScreen, isShortScreen, isTallScreen, getResponsiveSpacing, getResponsiveFontSize } from '../../utils/responsive';


type RootStackParamList = {
  Splash: undefined;
  ShreenathjiScreen: undefined;
  FamilyTree: undefined;
  Register: undefined;
  RequestForLogin: undefined;
  Login: undefined;
  MainTabs: undefined;
  Product: undefined;
  ProductDetail: undefined;
  Search: undefined;
  EditProfile: undefined;
  Orders: undefined;
};

const Register = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [business, setBusiness] = useState('');
  const [gst, setGst] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countryFlag, setCountryFlag] = useState('🇮🇳');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneError, setPhoneError] = useState('');
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [pinError, setPinError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [landmark, setLandmark] = useState('');
  const [remarks, setRemarks] = useState('');
  
     // Validation states
   const [nameError, setNameError] = useState('');
   const [emailError, setEmailError] = useState('');
   const [passwordError, setPasswordError] = useState('');
   const [address1Error, setAddress1Error] = useState('');
   const [address2Error, setAddress2Error] = useState('');
   const [landmarkError, setLandmarkError] = useState('');
   const [cityError, setCityError] = useState('');
   const [stateError, setStateError] = useState('');
   const [businessError, setBusinessError] = useState('');
   const [gstError, setGstError] = useState('');

  const handleSelectCountry = (country: Country) => {
    console.log('Country selected:', country);
    setCountryFlag(country.emoji);
    setCountryCode(country.dial_code);
    setCountryModalVisible(false);
    validatePhone(phone, country.dial_code);
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    console.log('Phone changed:', text);
    validatePhone(text, countryCode);
  };

  const validatePhone = (phoneNumber: string, dialCode: string) => {
    if (!phoneNumber) {
      setPhoneError('');
      return;
    }

    let isValid = false;
    let errorMsg = '';
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    if (dialCode === '+91') {
      // India: 10 digits, starts with 6-9
      isValid = /^([6-9][0-9]{9})$/.test(digitsOnly);
      if (!isValid) errorMsg = 'Enter a valid 10-digit Indian mobile number.';
    } else if (dialCode === '+1') {
      // US: 10 digits, starts with 2-9
      isValid = /^([2-9][0-9]{9})$/.test(digitsOnly);
      if (!isValid) errorMsg = 'Enter a valid 10-digit US number.';
    } else if (dialCode === '+44') {
      // UK: 10 or 11 digits, starts with 7 (for mobiles)
      isValid = /^(7[0-9]{9,10})$/.test(digitsOnly);
      if (!isValid) errorMsg = 'Enter a valid UK mobile number.';
    } else {
      // Default: at least 6 digits
      isValid = digitsOnly.length >= 6;
      if (!isValid) errorMsg = 'Enter a valid phone number.';
    }
    setPhoneError(isValid ? '' : errorMsg);
    if (!isValid) {
      console.log('Phone validation failed:', errorMsg);
    }
  };

  const validatePin = (pinValue: string, countryCode: string) => {
    let isValid = false;
    let errorMsg = '';
    if (!pinValue) {
      setPinError('');
      return;
    }
    if (countryCode === '+91') {
      // India: 6 digits, starts with 1-9
      isValid = /^[1-9][0-9]{5}$/.test(pinValue);
      if (!isValid) errorMsg = 'Enter a valid 6-digit Indian pin code.';
    } else if (countryCode === '+1') {
      // US: 5 digits or 5+4
      isValid = /^\d{5}(-\d{4})?$/.test(pinValue);
      if (!isValid) errorMsg = 'Enter a valid US zip code.';
    } else if (countryCode === '+44') {
      // UK: basic postcode regex
      isValid = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(pinValue);
      if (!isValid) errorMsg = 'Enter a valid UK postcode.';
    } else {
      // Default: at least 4 digits
      isValid = /^\d{4,}$/.test(pinValue);
      if (!isValid) errorMsg = 'Enter a valid pin/zip code.';
    }
    setPinError(isValid ? '' : errorMsg);
    if (!isValid) {
      console.log('Pin validation failed:', errorMsg);
    }
  };

  // Validation functions for required fields
  const validateRequiredField = (value: string, fieldName: string, setError: (error: string) => void) => {
    if (!value || value.trim() === '') {
      setError(`${fieldName} is required`);
      return false;
    }
    setError('');
    return true;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email.trim() === '') {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password || password.trim() === '') {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateAllFields = () => {
    let isValid = true;
    
    // Validate only required fields (Address, Landmark, and PAN/GST are now optional)
    isValid = validateRequiredField(name, 'Name', setNameError) && isValid;
    isValid = validateEmail(email) && isValid;
    isValid = validatePassword(password) && isValid;
    isValid = validateRequiredField(phone, 'Phone number', setPhoneError) && isValid;
    // Address fields are now optional - removed validation
    isValid = validateRequiredField(city, 'City', setCityError) && isValid;
    isValid = validateRequiredField(state, 'State', setStateError) && isValid;
    isValid = validateRequiredField(pin, 'Pin code', setPinError) && isValid;
    isValid = validateRequiredField(business, 'Business name', setBusinessError) && isValid;
    // GST/PAN field is now optional - removed validation
    
    // Phone validation (already has specific validation)
    if (!phone || phone.trim() === '') {
      setPhoneError('Phone number is required');
      isValid = false;
    } else if (phoneError) {
      isValid = false;
    }
    
    // Pin validation (already has specific validation)
    if (!pin || pin.trim() === '') {
      setPinError('Pin code is required');
      isValid = false;
    } else if (pinError) {
      isValid = false;
    }
    
    return isValid;
  };

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    
    // Clear all previous validation errors (keeping only required field errors)
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setPhoneError('');
    // Address and landmark fields are now optional - no need to clear errors
    setCityError('');
    setStateError('');
    setPinError('');
    setBusinessError('');
    // GST field is now optional - no need to clear error
    
    // Validate all fields before proceeding
    if (!validateAllFields()) {
      setError('Please fill in all required fields correctly');
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please fill in all required fields correctly' });
      return;
    }
    
    setLoading(true);
    console.log('Starting registration...');
    try {
      const userData = {
        type: 'business', // or 'admin', adjust as needed
        name: name.trim(),
        email: email.trim(),
        password,
        phone_number: phone.trim(),
        address_line1: address1.trim() || null, // Optional field - send null if empty
        address_line2: address2.trim() || null, // Optional field - send null if empty
        landmark: landmark.trim() || null, // Optional field - send null if empty
        state: state.trim(),
        city: city.trim(),
        country: countryCode,
        gst_number: gst.trim() || null, // Optional field - send null if empty
        pan_number: null, // Optional field - set to null
        business_name: business.trim(),
        remarks: remarks.trim(), // Optional field
        image: null, // Add image upload logic if needed
      };
      console.log('Register user data:', userData);
      await registerUser(userData);
      setSuccess('Registration successful!');
      Toast.show({ type: 'success', text1: 'Success', text2: 'User registered successfully!' });
      setTimeout(() => {
        console.log('Navigating to RequestForLogin');
        navigation.navigate('RequestForLogin');
      }, 1000);
    } catch (err: any) {
      setError(err.error || 'Registration failed.');
      console.log('Registration error:', err);
      Toast.show({ type: 'error', text1: 'Error', text2: err.error || 'Registration failed.' });
    } finally {
      setLoading(false);
      console.log('Set loading to false');
    }
  };

  // Show screen loader when processing registration
  if (loading) {
    return <ScreenLoader text="Processing Registration..." />;
  }

  return (
   
    <ImageBackground
      source={require('../../assets/img/common/bgdesign.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={require('../../assets/img/common/maroonlogo.png')} style={styles.logo} resizeMode="contain" />
        
        {/* Required fields note */}
        <Text style={styles.requiredNote}>* Required fields. Address and PAN/GST are optional.</Text>
        
        <View style={styles.form}>
          <CustomTextInput 
            placeholder="Name *" 
            value={name} 
            onChangeText={(text) => {
              setName(text);
              if (nameError) validateRequiredField(text, 'Name', setNameError);
            }} 
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          
          <CustomTextInput 
            placeholder="Email *" 
            value={email} 
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) validateEmail(text);
            }} 
            keyboardType="email-address" 
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          
          <CustomTextInput
            placeholder="Password *"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) validatePassword(text);
            }}
            secureTextEntry={!showPassword}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          <View style={styles.row}>
            <TouchableOpacity style={styles.countryCodeBox} onPress={() => setCountryModalVisible(true)}>
              <Text style={styles.flag}>{countryFlag}</Text>
              <Text style={styles.countryCode}>{countryCode}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.phoneInput}
              placeholder="Phone Number *"
              placeholderTextColor="#A47C8C"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
            />
          </View>
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
          <CustomTextInput 
            placeholder="Address line-1 (Optional)" 
            value={address1} 
            onChangeText={(text) => {
              setAddress1(text);
              // Remove validation as field is now optional
            }} 
          />
          
          <CustomTextInput 
            placeholder="Address line-2 (Optional)" 
            value={address2} 
            onChangeText={(text) => {
              setAddress2(text);
              // Remove validation as field is now optional
            }} 
          />
          
          <CustomTextInput 
            placeholder="Landmark (Optional)" 
            value={landmark} 
            onChangeText={(text) => {
              setLandmark(text);
              // Remove validation as field is now optional
            }} 
          />
          {landmarkError ? <Text style={styles.errorText}>{landmarkError}</Text> : null}
          <View style={styles.row}>
            <TouchableOpacity style={styles.cityStatePinInput} activeOpacity={0.7} onPress={() => setCityModalVisible(true)}>
              <TextInput
                style={[
                  styles.textInputNoPadding,
                  city.length > 8 ? { fontSize: 11 } : { fontSize: 13 }
                ]}
                placeholder="City *"
                placeholderTextColor="#A47C8C"
                value={city}
                editable={false}
                pointerEvents="none"
              />
              <Image
                source={require('../../assets/img/common/arrow.png')}
                style={[
                  styles.arrowIcon,
                  city.length > 8 ? { right: 4 } : { right: 10 }
                ]}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cityStatePinInput} activeOpacity={0.7}>
              <TextInput
                style={[
                  styles.textInputNoPadding,
                  state.length > 8 ? { fontSize: 12 } : { fontSize: 14 }
                ]}
                placeholder="State *"
                placeholderTextColor="#A47C8C"
                value={state}
                editable={false}
                pointerEvents="none"
              />
              <Image
                source={require('../../assets/img/common/arrow.png')}
                style={[
                  styles.arrowIcon,
                  state.length > 8 ? { right: 4 } : { right: 10 }
                ]}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.cityStatePinInput}
              placeholder="Pin code *"
              placeholderTextColor="#A47C8C"
              value={pin}
              onChangeText={text => {
                setPin(text);
                validatePin(text, countryCode);
              }}
              keyboardType="number-pad"
            />
          </View>
          {cityError ? <Text style={styles.errorText}>{cityError}</Text> : null}
          {stateError ? <Text style={styles.errorText}>{stateError}</Text> : null}
          {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}
          
          <CityPickerModal
            visible={cityModalVisible}
            onClose={() => setCityModalVisible(false)}
            onSelect={(selectedCity) => {
              setCity(selectedCity);
              // Auto-fill state for Indian cities
              if (countryCode === '+91' && cityToState[selectedCity]) {
                setState(cityToState[selectedCity]);
              }
              setCityModalVisible(false);
            }}
            cities={(() => {
              let code = '';
              if (countryCode === '+91') code = 'IN';
              else if (countryCode === '+1') code = 'US';
              else if (countryCode === '+44') code = 'GB';
              else if (countryCode === '+61') code = 'AU';
              else if (countryCode === '+81') code = 'JP';
              else if (countryCode === '+49') code = 'DE';
              else if (countryCode === '+33') code = 'FR';
              else if (countryCode === '+39') code = 'IT';
              else if (countryCode === '+86') code = 'CN';
              else if (countryCode === '+55') code = 'BR';
              else if (countryCode === '+7') code = 'RU';
              else if (countryCode === '+27') code = 'ZA';
              else if (countryCode === '+34') code = 'ES';
              else if (countryCode === '+52') code = 'MX';
              else if (countryCode === '+90') code = 'TR';
              else if (countryCode === '+82') code = 'KR';
              else if (countryCode === '+966') code = 'SA';
              else if (countryCode === '+971') code = 'AE';
              else if (countryCode === '+1-CA') code = 'CA';
              else code = 'IN'; // fallback to India
              console.log('City modal code:', code, 'Cities:', countryCities[code]);
              return countryCities[code] || countryCities['IN'];
            })()}
          />
          <CustomTextInput 
            placeholder="Business Name *" 
            value={business} 
            onChangeText={(text) => {
              setBusiness(text);
              if (businessError) validateRequiredField(text, 'Business name', setBusinessError);
            }} 
          />
          {businessError ? <Text style={styles.errorText}>{businessError}</Text> : null}
          
          <CustomTextInput placeholder="Remarks" value={remarks} onChangeText={setRemarks} />
          
          <CustomTextInput 
            placeholder="GST Number / PAN Number (Optional)" 
            value={gst} 
            onChangeText={(text) => {
              setGst(text);
              // Remove validation as field is now optional
            }} 
          />
          {/* Removed error display as field is now optional */}
          <Button
            onPress={handleRegister}
            style={{}}
            textStyle={{}}
            loading={loading}
            text={loading ? 'Registering...' : 'Register'}
          />
        </View>
        {error ? <Text style={{ color: 'red', textAlign: 'center', marginTop: 8 }}>{error}</Text> : null}
        {success ? <Text style={{ color: 'green', textAlign: 'center', marginTop: 8 }}>{success}</Text> : null}
      </ScrollView>
      <CountryPickerModal
        visible={countryModalVisible}
        onClose={() => setCountryModalVisible(false)}
        onSelect={handleSelectCountry}
      />
      <Toast />
    </ImageBackground>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: getResponsiveSpacing(16, 20, 24),
  },
  logo: {
    width: isSmallScreen() ? wp('35%') : isMediumScreen() ? wp('32%') : wp('30%'),
    height: isSmallScreen() ? wp('35%') : isMediumScreen() ? wp('32%') : wp('30%'),
    alignSelf: 'center',
    marginBottom: 0,
    marginTop: Platform.OS === 'ios' ? (isShortScreen() ? 40 : isTallScreen() ? 80 : 60) : (isShortScreen() ? 30 : isTallScreen() ? 70 : 50),
  },
  form: {
    width: isSmallScreen() ? '95%' : isMediumScreen() ? '92%' : '90%',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: getResponsiveSpacing(12, 14, 16),
    marginTop: getResponsiveSpacing(8, 10, 12),
  },
  input: {
    borderWidth: 0.5,
    borderColor: '#5D0829',
    borderRadius: 8,
    paddingHorizontal: getResponsiveSpacing(12, 14, 16),
    paddingVertical: getResponsiveSpacing(8, 10, 12),
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#5D0829',
    marginBottom: getResponsiveSpacing(4, 6, 8),
    backgroundColor: '#fff',
    fontFamily: 'Glorifydemo-BW3J3',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(8, 10, 12),
    columnGap: getResponsiveSpacing(6, 8, 10),
    marginTop: -3,
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#5D0829',
    borderRadius: 14,
    paddingHorizontal: getResponsiveSpacing(12, 14, 16),
    paddingVertical: getResponsiveSpacing(6, 8, 10),
    backgroundColor: '#fff',
    color: ' #5D082980',
    fontWeight: 'bold',
  },
  flag: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    marginRight: getResponsiveSpacing(3, 4, 5),
  },
  countryCode: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#5D082980',
    fontFamily: 'Glorifydemo-BW3J3',
    fontWeight:'bold'
  },
  dropdownWrapper: {
    flex: 1,
    position: 'relative',
  },
  dropdownContainer: {
    borderWidth: 0.5,
    borderColor: '#5D0829',
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    height: getResponsiveSpacing(40, 44, 48),
    marginBottom: 0,
  },
  pinInput: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#5D0829',
    borderRadius: 12,
    backgroundColor: '#fff',
    height: getResponsiveSpacing(40, 44, 48),
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: 'bold',
    fontFamily: 'Glorifydemo-BW3J3',
    color: '#A47C8C',
    paddingHorizontal: getResponsiveSpacing(10, 12, 14),
    paddingVertical: getResponsiveSpacing(8, 10, 12),
  },
  dropdownText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontFamily: 'Glorifydemo-BW3J3',
  },
  dropdownArrow: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    marginLeft: getResponsiveSpacing(6, 8, 10),
    color: '#5D0829',
  },
  dropdownList: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#5D0829',
    borderRadius: 8,
    zIndex: 10,
    elevation: 10,
  },
  dropdownItem: {
    padding: getResponsiveSpacing(10, 12, 14),
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#5D0829',
    fontFamily: 'Glorifydemo-BW3J3',
  },
  phoneInput: {
    flex: 1,
    marginLeft: getResponsiveSpacing(6, 8, 10),
    padding: getResponsiveSpacing(8, 10, 12),
    borderWidth: 0.5,
    borderColor: '#5D0829',
    borderRadius: 14,
    backgroundColor: '#fff',
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#5D0829',
    fontFamily: 'Glorifydemo-BW3J3',
    fontWeight:'bold'
  },
  cityStatePinInput: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#5D0829',
    borderRadius: 12,
    backgroundColor: '#fff',
    fontSize: getResponsiveFontSize(11, 13, 15),
    fontWeight: 'bold',
    fontFamily: 'Glorifydemo-BW3J3',
    color: '#A47C8C',
    paddingHorizontal: getResponsiveSpacing(6, 8, 10),
    paddingVertical: getResponsiveSpacing(8, 10, 12),
    marginRight: 2,
    height: getResponsiveSpacing(35, 39, 43),
    justifyContent: 'center',
  },
  textInputNoPadding: {
    flex: 1,
    fontSize: getResponsiveFontSize(11, 13, 15),
    fontWeight: 'bold',
    fontFamily: 'Glorifydemo-BW3J3',
    color: '#A47C8C',
    paddingHorizontal: 5,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  arrowIcon: {
    position: 'absolute',
    right: 10,
    width: getResponsiveSpacing(12, 14, 16),
    height: getResponsiveSpacing(4, 6, 8),
    resizeMode: 'contain',
    tintColor: '#5D0829',
  },
  errorText: {
    color: '#dc2626',
    fontSize: getResponsiveFontSize(11, 12, 13),
    marginBottom: getResponsiveSpacing(4, 6, 8),
    marginLeft: 5,
    fontFamily: 'Glorifydemo-BW3J3',
  },
  requiredNote: {
    color: '#6B7280',
    fontSize: getResponsiveFontSize(12, 13, 14),
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(8, 10, 12),
    fontFamily: 'Glorifydemo-BW3J3',
    fontStyle: 'italic',
  },
});

export default Register; 