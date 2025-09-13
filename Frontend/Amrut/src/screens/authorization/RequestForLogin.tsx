import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, FlatList, ImageBackground, Text, TextInput } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { checkUserExists, getCategories, requestLogin } from '../../services/Api';
import CustomTextInput from '../../components/common/CustomTextInput';
import Button from '../../components/common/Button';
import CustomLoader from '../../components/common/CustomLoader';
import ScreenLoader from '../../components/common/ScreenLoader';
import CountryPickerModal from '../../components/common/CountryPickerModal';


import { Country } from '../../data/countries';

const RequestForLogin = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countryFlag, setCountryFlag] = useState('🇮🇳');
  const [countryCode, setCountryCode] = useState('+91');
  const [userExists, setUserExists] = useState(false);
  const [userId, setUserId] = useState<number | null>(null); // <-- add userId state
  const [categories, setCategories] = useState<{ id: number; name: string; description?: string; image?: string }[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  // Remove selectedCategory state
  const [search, setSearch] = useState('');
  const [requestingLogin, setRequestingLogin] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<{ id: number; name: string; description?: string; image?: string }[]>([]);

  const handleSelectCountry = (country: Country) => {
    console.log('Country selected:', country);
    setCountryFlag(country.emoji);
    setCountryCode(country.dial_code);
    setCountryModalVisible(false);
  };

  // Fetch categories once when userExists becomes true
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories...');
        const response = await getCategories();
        console.log('Categories API response:', response);
        
        if (response && response.success && response.data && Array.isArray(response.data)) {
          console.log(`✅ Loaded ${response.data.length} categories:`, response.data);
          setCategories(response.data);
        } else {
          console.warn('❌ Invalid categories response format:', response);
          setCategories([]);
        }
      } catch (err) {
        console.error('❌ Error fetching categories:', err);
        setCategories([]);
      }
    };
    if (userExists) {
      console.log('User exists, fetching categories');
      fetchCategories();
    }
  }, [userExists]);

  const handleCheckUserAndRequestLogin = async () => {
    setLoading(true);
    console.log('Checking if user exists for phone:', phone);
    try {
      const response = await checkUserExists({ phone_number: phone });
      console.log('Check user exists response:', response);
      setUserExists(response.exists);
      if (response.exists) {
        setUserId(response.userId); // <-- store userId
      } else {
        setUserId(null);
      }
      if (!response.exists) {
        Toast.show({ type: 'info', text1: 'User not found', text2: 'Redirecting to registration...' });
        setTimeout(() => {
          console.log('Navigating to Register');
          navigation.navigate('Register');
        }, 1500);
        return;
      }
      Toast.show({ type: 'success', text1: 'User found', text2: 'Please select a category.' });
      // No need to fetch categories here, handled by useEffect
    } catch (err) {
      let errorMessage = 'Failed to check user.';
      let shouldRetry = false;
      
      if (err && typeof err === 'object') {
        if ('error' in err && typeof (err as any).error === 'string') {
          errorMessage = (err as any).error;
        }
        if ('retry' in err && (err as any).retry === true) {
          shouldRetry = true;
        }
      }
      
      console.log('Error checking user exists:', err);
      Toast.show({ 
        type: 'error', 
        text1: 'Error', 
        text2: errorMessage,
        position: 'bottom'
      });
      
      // If it's a database connection issue, show retry option
      if (shouldRetry) {
        Toast.show({
          type: 'info',
          text1: 'Connection Issue',
          text2: 'Tap to retry',
          position: 'bottom',
          onPress: () => {
            setTimeout(() => {
              handleCheckUserAndRequestLogin();
            }, 1000);
          }
        });
      }
    } finally {
      setLoading(false);
      console.log('Set loading to false');
    }
  };

  const handleRequestLogin = async () => {
    if (selectedCategories.length === 0) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please select at least one category.' });
      return;
    }
    setRequestingLogin(true);
    if (!userId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'User not found. Please check your number.' });
      setRequestingLogin(false);
      return;
    }
    // Block if pending/approved/logged_in request exists
    try {
      const response = await requestLogin({
        phone_number: phone,
        categoryIds: selectedCategories.map(cat => cat.id),
        country_code: countryCode,
        userId: userId,
      });
      console.log('Login request successful');
      Toast.show({ type: 'success', text1: 'Login Requested', text2: 'Login requested for selected categories.' });
      setTimeout(() => {
        console.log('Navigating to Login');
        navigation.navigate('Login');
      }, 1500);
    } catch (err: any) {
      const errMsg = err.error ? err.error.toLowerCase() : '';
      if (
        errMsg.includes('pending') ||
        errMsg.includes('approved') ||
        errMsg.includes('logged_in') ||
        errMsg.includes('active') ||
        err.error === 'You already have an active request for one or more selected categories'
      ) {
        setPendingRequest(true);
        Toast.show({ type: 'info', text1: 'Already Requested', text2: 'You have an active login request. Wait for approval or session expiry.' });
        setRequestingLogin(false);
        return;
      } else if (errMsg.includes('not approved')) {
        Toast.show({ type: 'error', text1: 'Not Approved', text2: 'You are not approved, please wait for approval.' });
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: err.error || 'Failed to request login.' });
      }
    } finally {
      setRequestingLogin(false);
      console.log('Set requestingLogin to false');
    }
  };

  // Show screen loader when processing login request
  if (requestingLogin) {
    return <ScreenLoader text="Processing Login Request..." />;
  }

  return (
    <ImageBackground
      source={require('../../assets/img/common/bgdesign.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.content}>
        <Image source={require('../../assets/img/common/maroonlogo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.form}>
          {/* Phone input row with country picker */}
          <View style={styles.row}>
            <TouchableOpacity style={styles.countryCodeBox} onPress={() => setCountryModalVisible(true)}>
              <Text style={styles.flag}>{countryFlag}</Text>
              <Text style={styles.countryCode}>{countryCode}</Text>
            </TouchableOpacity>
            <CustomTextInput
              placeholder="Enter your number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.phoneInput}
              editable={!userExists}
            />
          </View>
          {/* Always show the Check User button below the phone input, which checks the user */}
          {!userExists && (
            <Button
              onPress={handleCheckUserAndRequestLogin}
              title={loading ? 'Checking...' : 'Check User'}
              style={{ marginTop: 8, marginBottom: 8 }}
              textStyle={{}}
              disabled={loading}
            />
          )}
          {/* Show loader when checking user */}
          {loading && (
            <View style={{ marginTop: 8, alignItems: 'center' }}>
              <CustomLoader size="small" text="Checking user..." textColor="#5D0829" />
            </View>
          )}
          {/* Register prompt if user not found */}
          {!userExists && !pendingRequest && (
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: '#5D0829', fontSize: 14 }}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={{ color: '#5D0829', fontSize: 14, textDecorationLine: 'underline', fontWeight: 'bold' }}>Register</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#5D0829', fontSize: 14 }}>If already requested for login, go to  </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={{ color: '#5D0829', fontSize: 14, textDecorationLine: 'underline', fontWeight: 'bold' }}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {pendingRequest && (
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 12, alignSelf: 'center' }}>
              <Text style={{ color: '#5D0829', fontSize: 14, textDecorationLine: 'underline', fontWeight: 'bold' }}>
                If you have already requested for login, please login.
              </Text>
            </TouchableOpacity>
          )}
          {/* Category dropdown if user exists */}
          {userExists && (
            <>
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownButtonText}>
                    {selectedCategories.length === 0 ? 'Category' : selectedCategories.map(cat => cat.name).join(', ')}
                  </Text>
                  <Image
                    source={require('../../assets/img/common/arrow.png')}
                    style={[styles.dropdownArrow, categoryDropdownOpen && styles.dropdownArrowOpen]}
                  />
                </TouchableOpacity>
                {categoryDropdownOpen && (
                  <View style={styles.dropdownList}>
                    <View style={styles.searchRow}>
                      <Image
                        source={require('../../assets/img/common/searchicon.png')}
                        style={styles.searchIcon}
                      />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search"
                        placeholderTextColor="#A47C8C"
                        value={search}
                        onChangeText={setSearch}
                      />
                      <TouchableOpacity onPress={() => setSearch('')}>
                        <Text style={styles.clearSearch}>×</Text>
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={categories.filter(cat => cat.name.toLowerCase().includes(search.toLowerCase()))}
                      keyExtractor={item => item.id.toString()}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.itemRow}
                          onPress={() => {
                            setSelectedCategories(prev => {
                              const exists = prev.find(cat => cat.id === item.id);
                              if (exists) {
                                return prev.filter(cat => cat.id !== item.id);
                              } else {
                                return [...prev, item];
                              }
                            });
                          }}
                        >
                          <Text style={styles.itemText}>{item.name}</Text>
                          <View style={[
                            styles.checkboxOuter,
                            selectedCategories.some(cat => cat.id === item.id) ? styles.checkboxOuterSelected : null
                          ]}>
                            {selectedCategories.some(cat => cat.id === item.id) ? <Text style={styles.tick}>✓</Text> : null}
                          </View>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}
              </View>
              <Button
                onPress={handleRequestLogin}
                title={requestingLogin ? 'Requesting...' : 'Request for Login'}
                style={{ marginTop: 24 }}
                textStyle={{}}
                disabled={requestingLogin || selectedCategories.length === 0}
              />
              {/* Show loader when requesting login */}
              {requestingLogin && (
                <View style={{ marginTop: 16, alignItems: 'center' }}>
                  <CustomLoader size="small" text="Requesting login..." textColor="#5D0829" />
                </View>
              )}
            </>
          )}

          {/* Add register prompt below the button */}
          {userExists && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 }}>
              <Text style={{ color: '#5D0829', fontSize: 14 }}>Already requested for the login </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={{ color: '#5D0829', fontSize: 14, textDecorationLine: 'underline', fontWeight: 'bold' }}>Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    paddingVertical: 120,
  },
  logo: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    marginBottom: 32,
    marginTop: 32,
  },
  form: {
    width: '85%',
    alignSelf: 'center',
    marginTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#5D0829',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#5D0829',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dropdownWrapper: {
    borderWidth: 0.5,
    borderColor: '#5D0829',
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    height: 45,
    marginBottom: 0,
    marginTop: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    height: 44,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#5D0829',
    fontFamily: 'Glorifydemo-BW3J3',
    fontWeight: 'bold',
  },
  dropdownArrow: {
    width: 18,
    height: 10,
    tintColor: '#5D0829',
    transform: [{ rotate: '0deg' }],
  },
  dropdownArrowOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownList: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#5D0829',
    zIndex: 100,
    padding: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 0.5,
    borderBottomColor: '#5D0829',
    marginBottom: 8,
    paddingBottom: 0,
    width: '95%',
    alignSelf: 'center',
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 2,
    marginTop: 3,
    resizeMode: 'contain',
    tintColor: '#5D0829',
  },
  searchInput: {
    flex: 1,
    height: 36,
    borderWidth: 0,
    color: '#5D0829',
    fontFamily: 'Glorifydemo-BW3J3',
    fontSize: 15,
    backgroundColor: 'transparent',
    paddingTop: 0,
    fontWeight: 'bold',
  },
  clearSearch: {
    fontSize: 18,
    color: '#5D0829',
    marginLeft: 10,
    fontWeight: 'bold',
    marginTop: 2,
    fontFamily: 'Glorifydemo-BW3J3',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 2,
    borderBottomWidth: 0,
    borderBottomColor: '#eee',
  },
  itemText: {
    flex: 1,
    color: '#5D0829',
    fontFamily: 'Glorifydemo-BW3J3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxOuter: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#5D0829',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxOuterSelected: {
    backgroundColor: '#5D0829',
    borderColor: '#5D0829',
  },
  tick: {
    color: '#FCE2BF',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Glorifydemo-BW3J3',
  },
  button: {
    backgroundColor: '#5D0829',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  buttonText: {
    color: '#FCE2BF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#5D0829',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    fontFamily: 'Glorifydemo-BW3J3',
    fontWeight: 'bold',
    fontSize: 12,
    height: 48,
    marginRight: 0,
    marginBottom: 0,
  },
  flag: {
    fontSize: 20,
    marginRight: 6,
  },
  countryCode: {
    fontSize: 14,
    color: '#5D082980',
    fontWeight: 'bold',
    fontFamily: 'Glorifydemo-BW3J3',
  },
  phoneInput: {
    flex: 1,
    marginLeft: 8,
    marginBottom: 0,
    height: 48,
  },
  debugText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Glorifydemo-BW3J3',
  },
});

export default RequestForLogin; 