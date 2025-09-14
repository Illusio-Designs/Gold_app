import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Alert, Platform } from 'react-native';
import CustomHeader from '../components/common/CustomHeader';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import ProfilePhotoName from '../components/common/ProfilePhotoName';
import CustomLoader from '../components/common/CustomLoader';
import ScreenLoader from '../components/common/ScreenLoader';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../services/Api';
import { logoutUser, getLatestVersion } from '../services/Api';
import { useCart } from '../context/CartContext';
// NotificationService removed as requested
import { wp, hp } from '../utils/responsiveConfig';
import { isSmallScreen, isMediumScreen, isLargeScreen, isShortScreen, isTallScreen, getResponsiveSpacing, getResponsiveFontSize } from '../utils/responsive';
import Toast from 'react-native-toast-message';
import { useNavigationLoader } from '../context/NavigationContext';

const { width } = Dimensions.get('window');

const Profile = () => {
  const navigation = useNavigation();
  const { showLoader } = useNavigationLoader();
  const [photoUri, setPhotoUri] = useState(require('../assets/img/profile/profilephoto.png'));
  const [uploading, setUploading] = useState(false);
  const [userName, setUserName] = useState('Wade Warrant');
  const [loading, setLoading] = useState(true);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [userId, setUserId] = useState(null);
  const isFocused = useIsFocused();
  const { clearCartOnLogout } = useCart();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('accessToken');
        if (userId && token) {
          setUserId(parseInt(userId));
          const res = await require('../services/Api').getUserById(userId, token);
          const user = res.user || res;
          await AsyncStorage.setItem('user', JSON.stringify(user));
          setUserName(user.name || 'Wade Warrant');
          if (user.image) {
            const imgUrl = user.image.startsWith('http')
              ? user.image
              : `${BASE_URL.replace(/\/api$/, '')}/uploads/profile/${user.image}?t=${Date.now()}`;
            setPhotoUri({ uri: imgUrl });
            console.log('[Profile] Image URL:', imgUrl);
          } else {
            setPhotoUri(require('../assets/img/profile/profilephoto.png'));
            console.log('[Profile] No image, using default');
          }
        } else {
          // fallback to AsyncStorage
          const userStr = await AsyncStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            setUserName(user.name || 'Wade Warrant');
            if (user.image) {
              const imgUrl = user.image.startsWith('http')
                ? user.image
                : `${BASE_URL.replace(/\/api$/, '')}/uploads/profile/${user.image}?t=${Date.now()}`;
              setPhotoUri({ uri: imgUrl });
              console.log('[Profile] Image URL:', imgUrl);
            } else {
              setPhotoUri(require('../assets/img/profile/profilephoto.png'));
              console.log('[Profile] No image, using default');
            }
          }
        }
      } catch (err) {
        // fallback to AsyncStorage
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserName(user.name || 'Wade Warrant');
          if (user.image) {
            const imgUrl = user.image.startsWith('http')
              ? user.image
              : `${BASE_URL.replace(/\/api$/, '')}/uploads/profile/${user.image}?t=${Date.now()}`;
            setPhotoUri({ uri: imgUrl });
            console.log('[Profile] Image URL:', imgUrl);
          } else {
            setPhotoUri(require('../assets/img/profile/profilephoto.png'));
            console.log('[Profile] No image, using default');
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [isFocused]);

  // Get current app version info from API
  useEffect(() => {
    const getCurrentAppVersion = async () => {
      try {
        console.log('[Profile] Fetching app version from API...');
        const platform = Platform.OS; // Dynamic platform detection
        const versionInfo = await getLatestVersion(platform);
        
        if (versionInfo && versionInfo.version) {
          console.log('[Profile] Version info received:', versionInfo);
          setAppVersion(versionInfo.version);
        } else {
          console.log('[Profile] No version info received, using fallback');
          setAppVersion('1.0.0'); // Fallback version
        }
      } catch (error) {
        console.error('[Profile] Error getting app version from API:', error);
        // Use fallback version if API fails
        setAppVersion('1.0.0');
      }
    };
    getCurrentAppVersion();
  }, []);



  const handleCameraPress = async () => {
    console.log('[Profile] Camera button pressed');
    launchImageLibrary(
      { 
        mediaType: 'photo', 
        quality: 0.8,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
      },
      async (response) => {
        console.log('[Profile] Image picker response:', response);
        if (response.didCancel) {
          console.log('[Profile] User cancelled image picker');
          return;
        }
        if (response.errorCode) {
          console.log('[Profile] Image picker error:', response.errorCode, response.errorMessage);
          Alert.alert('Error', response.errorMessage || 'Failed to open gallery');
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          console.log('[Profile] Selected asset:', asset);
          if (asset.uri) {
            setUploading(true);
            try {
              const formData = new FormData();
              formData.append('profile', {
                uri: asset.uri,
                name: asset.fileName || 'profile.jpg',
                type: asset.type || 'image/jpeg',
              });

              // Use your backend's upload endpoint
              const res = await axios.post(`${BASE_URL}/upload/profile`, formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              });

              if (res.data && res.data.url) {
                setPhotoUri({ uri: res.data.url });
                Alert.alert('Success', 'Profile image updated!');
              } else {
                Alert.alert('Error', 'Upload failed');
              }
            } catch (err) {
              console.log('[Profile] Upload error:', err);
              Alert.alert('Error', 'Upload failed');
            } finally {
              setUploading(false);
            }
          }
        }
      }
    );
  };

  const handleLogout = async () => {
    try {
      // Get the current token
      const token = await AsyncStorage.getItem('accessToken');
      
      // Call backend logout API if we have a token
      if (token) {
        await logoutUser(token);
      }
      
      // Don't clear cart on logout - preserve for same user
      // Cart will only be cleared when a different user logs in
      
      // Notification service removed as requested
      
      // Clear local storage
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('sessionExpiry');
      await AsyncStorage.removeItem('sessionDurationMinutes');
      await AsyncStorage.removeItem('userId');
      
      // Navigate to login screen
      if ((navigation as any).reset) {
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'RequestForLogin' }],
        });
      } else if ((navigation as any).navigate) {
        (navigation as any).navigate('RequestForLogin');
      }
    } catch (error) {
      console.error('[Profile] Logout error:', error);
      // Even if backend logout fails, clear local data and redirect
      // Don't clear cart on logout - preserve for same user
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('sessionExpiry');
      await AsyncStorage.removeItem('sessionDurationMinutes');
      await AsyncStorage.removeItem('userId');
      
      if ((navigation as any).reset) {
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'RequestForLogin' }],
        });
      } else if ((navigation as any).navigate) {
        (navigation as any).navigate('RequestForLogin');
      }
    }
  };

  // Show loading state while profile is being fetched
  if (loading) {
    return <ScreenLoader text="Loading Profile..." />;
  }

  return (
    <View style={styles.baseBg}>
      <CustomHeader title="My Profile" timer={true} />
      <ProfilePhotoName
        photoSource={photoUri}
        cameraIconSource={require('../assets/img/profile/editprofile.png')}
        userName={userName}
        onCameraPress={handleCameraPress}
      />
      {uploading && <CustomLoader size="small" text="Uploading..." textColor="#5D0829" />}
      
      {/* Menu Buttons */}
      <View style={styles.menuWrap}>
        <TouchableOpacity 
          style={styles.menuBtn} 
          onPress={() => {
            showLoader('Loading Edit Profile...', 2000);
            (navigation as any).navigate('EditProfile');
          }}
        >
          <Image source={require('../assets/img/profile/profile.png')} style={styles.menuIcon} />
          <Text style={styles.menuText}>Edit Profile</Text>
          <Image source={require('../assets/img/profile/nextarrow.png')} style={styles.menuArrow} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuBtn} 
          onPress={() => {
            showLoader('Loading Orders...', 2500);
            (navigation as any).navigate('Orders');
          }}
        >
          <Image source={require('../assets/img/profile/order.png')} style={styles.menuIcon} />
          <Text style={styles.menuText}>My Orders</Text>
          <Image source={require('../assets/img/profile/nextarrow.png')} style={styles.menuArrow} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn} onPress={handleLogout}>
          <Image source={require('../assets/img/profile/logout.png')} style={styles.menuIcon} />
          <Text style={styles.menuText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {/* Simple App Version */}
      <View style={styles.versionLineContainer}>
        <Text style={styles.versionLineText}>v{appVersion}</Text>
      </View>
      
      {/* Toast for notifications */}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  baseBg: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: isShortScreen() ? 40 : isTallScreen() ? 60 : 50,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing(20, 24, 28),
    marginBottom: 0,
    width: '100%',
  },
  backBtn: {
    padding: 0,
    marginRight: 0,
  },
  backArrow: {
    width: getResponsiveSpacing(20, 24, 28),
    height: getResponsiveSpacing(20, 24, 28),
    resizeMode: 'contain',
    tintColor: '#5D0829',
  },
  headerTitle: {
    color: '#5D0829',
    fontSize: getResponsiveFontSize(18, 22, 26),
    fontWeight: '700',
    fontFamily: 'Glorifydemo-BW3J3',
    flex: 1,
    textAlign: 'center',
    marginLeft: -24,
  },
  menuWrap: {
    width: isSmallScreen() ? '90%' : isMediumScreen() ? '88%' : '85%',
    marginTop: getResponsiveSpacing(6, 8, 10),
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: '#C09E83',
    paddingVertical: getResponsiveSpacing(8, 10, 12),
    paddingHorizontal: getResponsiveSpacing(14, 18, 22),
    marginBottom: getResponsiveSpacing(14, 18, 22),
  },
  menuIcon: {
    width: getResponsiveSpacing(24, 28, 32),
    height: getResponsiveSpacing(24, 28, 32),
    resizeMode: 'contain',
    marginRight: getResponsiveSpacing(12, 16, 20),
    tintColor: '#5D0829',
  },
  menuText: {
    color: '#5D0829',
    fontSize: getResponsiveFontSize(15, 17, 19),
    fontWeight: '700',
    fontFamily: 'Glorifydemo-BW3J3',
    flex: 1,
  },
  menuArrow: {
    width: getResponsiveSpacing(14, 16, 18),
    height: getResponsiveSpacing(14, 16, 18),
    resizeMode: 'contain',
    tintColor: '#5D0829',
  },
  versionLineContainer: {
    width: isSmallScreen() ? '90%' : isMediumScreen() ? '88%' : '85%',
    marginTop: getResponsiveSpacing(10, 12, 14),
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: '#C09E83',
    paddingVertical: getResponsiveSpacing(8, 10, 12),
    paddingHorizontal: getResponsiveSpacing(14, 18, 22),
    marginBottom: getResponsiveSpacing(14, 18, 22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionLineText: {
    color: '#5D0829',
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '400',
    fontFamily: 'Glorifydemo-BW3J3',
    opacity: 0.7,
  },

});

export default Profile; 