import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, Image, TextInput, TouchableOpacity, Platform, ScrollView, Alert } from 'react-native';
import CustomHeader from '../components/common/CustomHeader';
import ProfilePhotoName from '../components/common/ProfilePhotoName';
import Button from '../components/common/Button';
import CustomTextInput from '../components/common/CustomTextInput';
import ScreenLoader from '../components/common/ScreenLoader';

import CountryPickerModal from '../components/common/CountryPickerModal';
import CityPickerModal from '../components/common/CityPickerModal';
import { countryCities, cityToState } from '../data/cities';
import { Country } from '../data/countries';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import axios from 'axios';
import { updateUserProfile, getUserById, BASE_URL } from '../services/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const EditProfile = () => {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [pin, setPin] = useState('');
  const [name, setName] = useState('Wade Warrant');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [business, setBusiness] = useState('');
  const [gst, setGst] = useState('');
  const [landmark, setLandmark] = useState('');
  const [remarks, setRemarks] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countryFlag, setCountryFlag] = useState('🇮🇳');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneError, setPhoneError] = useState('');
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [pinError, setPinError] = useState('');
  const [photoUri, setPhotoUri] = useState<{ uri: string } | null>(null);
  const [imageAsset, setImageAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserIdAndData = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        setUserId(id);
        const token = await AsyncStorage.getItem('accessToken');
        if (id && token) {
          const res = await getUserById(id, token);
          const user = res.user || res; // handle { user: {...} } or just {...}
          
          console.log('[EditProfile] API Response:', res);
          console.log('[EditProfile] User data:', user);
          console.log('[EditProfile] User fields:', {
            name: user.name,
            email: user.email,
            phone_number: user.phone_number,
            address_line1: user.address_line1,
            address_line2: user.address_line2,
            landmark: user.landmark,
            state: user.state,
            city: user.city,
            pin: user.pin,
            business_name: user.business_name,
            gst_number: user.gst_number,
            remarks: user.remarks,
            country: user.country,
            image: user.image
          });
          
          await AsyncStorage.setItem('user', JSON.stringify(user));
          setName(user.name || '');
          setEmail(user.email || '');
          setPhone(user.phone_number || '');
          setAddress1(user.address_line1 || '');
          setAddress2(user.address_line2 || '');
          setLandmark(user.landmark || '');
          setState(user.state || '');
          setCity(user.city || '');
          setPin(user.pin || '');
          setBusiness(user.business_name || '');
          setGst(user.gst_number || '');
          setRemarks(user.remarks || '');
          if (user.country) {
            setCountryCode(user.country);
          }
          if (user.image) {
            const imgUrl = user.image.startsWith('http')
              ? user.image
              : `${BASE_URL.replace(/\/api$/, '')}/uploads/profile/${user.image}?t=${Date.now()}`;
            setPhotoUri({ uri: imgUrl });
            console.log('[EditProfile] Image URL:', imgUrl);
          }
        } else {
          // fallback to AsyncStorage if no id/token
          console.log('[EditProfile] No userId/token, using AsyncStorage fallback');
          const userStr = await AsyncStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            console.log('[EditProfile] AsyncStorage user data:', user);
            setName(user.name || '');
            setEmail(user.email || '');
            setPhone(user.phone_number || '');
            setAddress1(user.address_line1 || '');
            setAddress2(user.address_line2 || '');
            setState(user.state || '');
            setCity(user.city || '');
            setPin(user.pin || '');
            setBusiness(user.business_name || '');
            setGst(user.gst_number || '');
            setRemarks(user.remarks || '');
            if (user.country) {
              setCountryCode(user.country);
            }
            if (user.image) {
              const imgUrl = user.image.startsWith('http')
                ? user.image
                : `${BASE_URL.replace(/\/api$/, '')}/uploads/profile/${user.image}?t=${Date.now()}`;
              setPhotoUri({ uri: imgUrl });
              console.log('[EditProfile] Image URL:', imgUrl);
            }
          }
        }
      } catch (error: any) {
        console.error('[EditProfile] Error fetching user data:', error);
        console.error('[EditProfile] Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
      }
    };
    fetchUserIdAndData();
  }, []);

  const handleSelectCountry = (country: Country) => {
    setCountryFlag(country.emoji);
    setCountryCode(country.dial_code);
    setCountryModalVisible(false);
    validatePhone(phone, country.dial_code);
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
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
      isValid = /^([6-9][0-9]{9})$/.test(digitsOnly);
      if (!isValid) errorMsg = 'Enter a valid 10-digit Indian mobile number.';
    } else if (dialCode === '+1') {
      isValid = /^([2-9][0-9]{9})$/.test(digitsOnly);
      if (!isValid) errorMsg = 'Enter a valid 10-digit US number.';
    } else if (dialCode === '+44') {
      isValid = /^(7[0-9]{9,10})$/.test(digitsOnly);
      if (!isValid) errorMsg = 'Enter a valid UK mobile number.';
    } else {
      isValid = digitsOnly.length >= 6;
      if (!isValid) errorMsg = 'Enter a valid phone number.';
    }
    setPhoneError(isValid ? '' : errorMsg);
  };

  const validatePin = (pinValue: string, countryCode: string) => {
    let isValid = false;
    let errorMsg = '';
    if (!pinValue) {
      setPinError('');
      return;
    }
    if (countryCode === '+91') {
      isValid = /^[1-9][0-9]{5}$/.test(pinValue);
      if (!isValid) errorMsg = 'Enter a valid 6-digit Indian pin code.';
    } else if (countryCode === '+1') {
      isValid = /^\d{5}(-\d{4})?$/.test(pinValue);
      if (!isValid) errorMsg = 'Enter a valid US zip code.';
    } else if (countryCode === '+44') {
      isValid = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(pinValue);
      if (!isValid) errorMsg = 'Enter a valid UK postcode.';
    } else {
      isValid = /^\d{4,}$/.test(pinValue);
      if (!isValid) errorMsg = 'Enter a valid pin/zip code.';
    }
    setPinError(isValid ? '' : errorMsg);
  };

  const handleCameraPress = () => {
    console.log('[EditProfile] Camera button pressed');
    launchImageLibrary(
      { 
        mediaType: 'photo', 
        quality: 0.8,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
      },
      (response) => {
        console.log('[EditProfile] Image picker response:', response);
        if (response.didCancel) {
          console.log('[EditProfile] User cancelled image picker');
          return;
        }
        if (response.errorCode) {
          console.log('[EditProfile] Image picker error:', response.errorCode, response.errorMessage);
          Alert.alert('Error', response.errorMessage || 'Failed to open gallery');
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          console.log('[EditProfile] Selected asset:', asset);
          if (asset.uri) {
            setPhotoUri({ uri: asset.uri });
            setImageAsset(asset);
          }
        }
      }
    );
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const userStr = await AsyncStorage.getItem('user');
      let currentStatus = null;
      if (userStr) {
        const user = JSON.parse(userStr);
        currentStatus = user.status || null;
      }
      const profileData: any = {
        name,
        email,
        phone_number: phone,
        address_line1: address1,
        address_line2: address2,
        landmark,
        state,
        city,
        pin,
        business_name: business,
        gst_number: gst,
        remarks,
        status: currentStatus, // Always include status
        // ...add other fields as needed
      };
      if (imageAsset) {
        profileData.image = {
          uri: imageAsset.uri!,
          name: imageAsset.fileName || 'profile.jpg',
          type: imageAsset.type || 'image/jpeg',
        } as any;
      }
      // Retrieve token from AsyncStorage
      const token = await AsyncStorage.getItem('accessToken');
      console.log('[EditProfile] Token before update:', token);
      if (!token) {
        Alert.alert('Error', 'Access token missing. Please log in again.');
        setLoading(false);
        return;
      }
      if (!userId) {
        Alert.alert('Error', 'User ID not found. Please log in again.');
        setLoading(false);
        return;
      }
      console.log('Token used for update:', token);
      const res = await updateUserProfile(userId, profileData, token);
      if (res && res.message) {
        // Store updated user in AsyncStorage if returned
        if (res.user) {
          await AsyncStorage.setItem('user', JSON.stringify(res.user));
        }
        let msg = res.message;
        if (res.remainingTime !== undefined) {
          msg += `\nSession remaining: ${Math.floor(res.remainingTime / 60)} min ${res.remainingTime % 60} sec`;
        }
        Alert.alert('Success', msg);
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Update failed');
      }
    } catch (err: any) {
      console.log('Update error:', err?.error || err);
      Alert.alert('Error', err?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  // Show screen loader when processing profile update
  if (loading) {
    return <ScreenLoader text="Updating Profile..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <CustomHeader title="Edit Profile" />
        <ProfilePhotoName
          photoSource={photoUri || require('../assets/img/profile/profilephoto.png')}
          cameraIconSource={require('../assets/img/profile/editprofile.png')}
          userName={name}
          onCameraPress={handleCameraPress}
        />
        {loading && <View style={styles.loadingContainer} />}
        <View style={styles.form}>
          <CustomTextInput placeholder="Name" value={name} onChangeText={setName} />
          <CustomTextInput placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <View style={styles.row}>
            <TouchableOpacity style={styles.countryCodeBox} onPress={() => setCountryModalVisible(true)}>
              <Text style={styles.flag}>{countryFlag}</Text>
              <Text style={styles.countryCode}>{countryCode}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.phoneInput}
              placeholder="Phone Number"
              placeholderTextColor="#A47C8C"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
            />
          </View>
          {phoneError ? <Text style={{ color: 'red', fontSize: 12, marginBottom: 10, marginLeft: 5 }}>{phoneError}</Text> : null}
          <CustomTextInput placeholder="Address line-1" value={address1} onChangeText={setAddress1} />
          <CustomTextInput placeholder="Address line-2" value={address2} onChangeText={setAddress2} />
          <CustomTextInput placeholder="Landmark" value={landmark} onChangeText={setLandmark} />
          <View style={styles.row}>
            <TouchableOpacity style={styles.cityStatePinInput} activeOpacity={0.7} onPress={() => setCityModalVisible(true)}>
              <TextInput
                style={[
                  styles.textInputNoPadding,
                  city.length > 8 ? { fontSize: 11 } : { fontSize: 13 }
                ]}
                placeholder="City"
                placeholderTextColor="#A47C8C"
                value={city}
                editable={false}
                pointerEvents="none"
              />
              <Image
                source={require('../assets/img/common/arrow.png')}
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
                  state.length > 8 ? { fontSize: 11 } : { fontSize: 13 }
                ]}
                placeholder="State"
                placeholderTextColor="#A47C8C"
                value={state}
                editable={false}
                pointerEvents="none"
              />
              <Image
                source={require('../assets/img/common/arrow.png')}
                style={[
                  styles.arrowIcon,
                  state.length > 8 ? { right: 4 } : { right: 10 }
                ]}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.cityStatePinInput}
              placeholder="Pin code"
              placeholderTextColor="#A47C8C"
              value={pin}
              onChangeText={text => {
                setPin(text);
                validatePin(text, countryCode);
              }}
              keyboardType="number-pad"
            />
          </View>
          {pinError ? <Text style={{ color: 'red', fontSize: 12, marginBottom: 10, marginLeft: 5 }}>{pinError}</Text> : null}
          <CityPickerModal
            visible={cityModalVisible}
            onClose={() => setCityModalVisible(false)}
            onSelect={(selectedCity) => {
              setCity(selectedCity);
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
              return countryCities[code] || [];
            })()}
          />
          <CustomTextInput placeholder="Business Name" value={business} onChangeText={setBusiness} />
          <CustomTextInput placeholder="Remarks" value={remarks} onChangeText={setRemarks} />
          <CustomTextInput placeholder="GST Number / PAN Number" value={gst} onChangeText={setGst} />
          <Button
            onPress={handleUpdateProfile}
            style={{ marginTop: 16 }}
            textStyle={{}}
            title={loading ? 'Updating...' : 'Update'}
            disabled={loading}
          />
        </View>
      </ScrollView>
      <CountryPickerModal
        visible={countryModalVisible}
        onClose={() => setCountryModalVisible(false)}
        onSelect={handleSelectCountry}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical:40,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 0,
  },
  form: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingHorizontal: 10,
    marginTop: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    columnGap: 8,
    marginTop: -3,
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#5D0829',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    color: ' #5D082980',
    fontWeight: 'bold',
  },
  flag: {
    fontSize: 18,
    marginRight: 4,
  },
  countryCode: {
    fontSize: 14,
    color: '#5D082980',
    fontFamily: 'GlorifyDEMO',
    fontWeight: 'bold',
  },
  phoneInput: {
    flex: 1,
    marginLeft: 8,
    padding: 10,
    borderWidth: 0.5,
    borderColor: '#5D0829',
    borderRadius: 14,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
    fontWeight: 'bold',
  },
  cityStatePinInput: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#5D0829',
    borderRadius: 12,
    backgroundColor: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'GlorifyDEMO',
    color: '#A47C8C',
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginRight: 2,
    height: 39,
    justifyContent: 'center',
  },
  textInputNoPadding: {
    flex: 1,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'GlorifyDEMO',
    color: '#A47C8C',
    paddingHorizontal: 5,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  arrowIcon: {
    position: 'absolute',
    right: 10,
    width: 14,
    height: 6,
    resizeMode: 'contain',
    tintColor: '#5D0829',
  },
  loadingContainer: {
    height: 20,
    marginVertical: 10,
  },
});

export default EditProfile; 