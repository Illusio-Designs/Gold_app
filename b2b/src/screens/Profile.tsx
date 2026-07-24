import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Alert, Platform, Linking, PermissionsAndroid } from 'react-native';
import CustomHeader from '../components/common/CustomHeader';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import ProfilePhotoName from '../components/common/ProfilePhotoName';
import CustomLoader from '../components/common/CustomLoader';
import ScreenLoader from '../components/common/ScreenLoader';
import { launchCamera } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../services/Api';
import { APP_VERSION } from '../config/appInfo';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { wp, hp } from '../utils/responsiveConfig';
import { isSmallScreen, isMediumScreen, isLargeScreen, isShortScreen, isTallScreen, getResponsiveSpacing, getResponsiveFontSize } from '../utils/responsive';
import { useNavigationLoader } from '../context/NavigationContext';
import LoginPromptModal from '../components/common/LoginPromptModal';
import { useLoginPrompt } from '../hooks/useLoginPrompt';

const { width } = Dimensions.get('window');

const Profile = () => {
  const navigation = useNavigation();
  const { showLoader } = useNavigationLoader();
  const [photoUri, setPhotoUri] = useState(require('../assets/img/profile/profilephoto.png'));
  const [uploading, setUploading] = useState(false);
  const [userName, setUserName] = useState('Guest');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const isFocused = useIsFocused();
  const { clearCartOnLogout } = useCart();
  const { onLogout } = useNotifications();
  const { showLoginPrompt, checkAndPromptLogin, closeLoginPrompt } = useLoginPrompt();

  // Check if user is logged in whenever screen comes into focus
  useEffect(() => {
    if (isFocused) {
      checkAndPromptLogin();
    }
  }, [isFocused]);

  
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
          setUserName(user.name || 'Guest');
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
            setUserName(user.name || 'Guest');
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
          setUserName(user.name || 'Guest');
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


  const handleCameraPress = async () => {
    console.log('[Profile] Camera button pressed');

    // Ask permission on Android
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'We need camera access to update your profile photo.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        }
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission required', 'Please allow camera permission to take a profile photo.');
        return;
      }
    }

    const openCamera = () =>
      new Promise((resolve) => {
        launchCamera(
          {
            mediaType: 'photo',
            quality: 0.85,
            includeBase64: false,
            saveToPhotos: false,
            maxHeight: 2000,
            maxWidth: 2000,
            cameraType: 'back',
          },
          resolve
        );
      });

    const response: any = await openCamera();
    console.log('[Profile] Camera response:', response);

    if (response?.didCancel) return;
    if (response?.errorCode) {
      Alert.alert('Error', response.errorMessage || 'Failed to open camera');
      return;
    }

    const asset = response?.assets?.[0];
    if (!asset?.uri) return;

    // Upload via authenticated profile update so backend processes/stores correctly.
    setUploading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const storedUserId = await AsyncStorage.getItem('userId');
      const userStr = await AsyncStorage.getItem('user');

      if (!token || !storedUserId) {
        Alert.alert('Login required', 'Please login again to update your profile photo.');
        return;
      }
      if (!userStr) {
        Alert.alert('Error', 'User data not found. Please open Edit Profile once and try again.');
        return;
      }

      const user = JSON.parse(userStr);
      const { updateUserProfile, getUserById } = require('../services/Api');

      const fileUri =
        Platform.OS === 'ios' && !asset.uri.startsWith('file://')
          ? `file://${asset.uri}`
          : asset.uri;

      const profileData: any = {
        // Keep existing fields so we don't accidentally overwrite them with null
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        address_line1: user.address_line1,
        address_line2: user.address_line2,
        landmark: user.landmark,
        state: user.state,
        city: user.city,
        country: user.country,
        gst_number: user.gst_number,
        pan_number: user.pan_number,
        business_name: user.business_name,
        status: user.status,
        remarks: user.remarks,
        image: {
          uri: fileUri,
          name: asset.fileName || `profile_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        },
      };

      await updateUserProfile(storedUserId, profileData, token);

      // Re-fetch user so we use the processed filename from backend
      const refreshed = await getUserById(storedUserId, token);
      const refreshedUser = refreshed.user || refreshed;
      await AsyncStorage.setItem('user', JSON.stringify(refreshedUser));
      if (refreshedUser.image) {
        const imgUrl = refreshedUser.image.startsWith('http')
          ? refreshedUser.image
          : `${BASE_URL.replace(/\/api$/, '')}/uploads/profile/${refreshedUser.image}?t=${Date.now()}`;
        setPhotoUri({ uri: imgUrl });
      }
    } catch (err) {
      console.log('[Profile] Profile photo update error:', err);
      Alert.alert('Error', 'Failed to update profile photo');
    } finally {
      setUploading(false);
    }
  };

  // Diagnostic: is this device's push token registered on the backend?
  const handleCheckPush = async () => {
    try {
      const authToken = await AsyncStorage.getItem('accessToken');
      if (!authToken) {
        Alert.alert('Not logged in', 'Please log in to check push status.');
        return;
      }
      const { getPushTokenStatus } = require('../services/Api');
      const { getCurrentFcmToken, registerDeviceToken } = require('../services/pushNotifications');

      // Try to (re)register first, then read status + device token.
      await registerDeviceToken();
      const [status, deviceToken] = await Promise.all([
        getPushTokenStatus(authToken).catch(() => null),
        getCurrentFcmToken(),
      ]);

      const registered = status && status.registered;
      const lines = [
        `Backend registered: ${registered ? 'YES ✓' : 'NO ✗'}`,
        `Tokens on server: ${status ? status.count : 0}`,
        '',
        'Device FCM token:',
        deviceToken ? deviceToken : '(none — Firebase/Play services unavailable)',
      ];
      if (deviceToken) console.log('[Push] FCM token:', deviceToken);

      const buttons: any[] = [{ text: 'OK' }];
      if (deviceToken) {
        buttons.unshift({
          text: 'Copy token',
          onPress: () => {
            try {
              const Clipboard = require('@react-native-clipboard/clipboard').default;
              Clipboard.setString(deviceToken);
              Alert.alert('Copied', 'Token copied. Paste it into Firebase Console → Cloud Messaging → Send test message.');
            } catch {
              Alert.alert('Token', deviceToken);
            }
          },
        });
      }
      Alert.alert('Push notification status', lines.join('\n'), buttons);
    } catch (e) {
      Alert.alert('Error', 'Could not check push status.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmAccountDeletion,
        },
      ]
    );
  };

  const confirmAccountDeletion = () => {
    Alert.alert(
      'Final Confirmation',
      'This will permanently delete all your data including:\n• Profile information\n• Order history\n• Personal data\n\nType "DELETE" to confirm:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'I understand, DELETE my account',
          style: 'destructive',
          onPress: executeAccountDeletion,
        },
      ]
    );
  };

  const executeAccountDeletion = async () => {
    // Our official account-deletion portal — the /delete page on the company
    // website, which submits the request to our own backend
    // (POST /api/account-deletion). The form there collects name, business and
    // mobile number to identify the account, then our team processes it.
    const deletionUrl = 'https://amrutkumargovinddasllp.com/delete';

    try {
      const supported = await Linking.canOpenURL(deletionUrl);

      if (supported) {
        await Linking.openURL(deletionUrl);
        Alert.alert(
          'Account Deletion',
          'You have been redirected to our account deletion portal. Please complete the request there and our team will process it.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Unable to Open Link',
          `Please visit ${deletionUrl} to request account deletion.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[Profile] Delete account error:', error);
      Alert.alert(
        'Error',
        `Unable to open the deletion portal. Please visit ${deletionUrl} in your browser.`
      );
    }
  };

  const handleLogout = async () => {
    try {
      // Don't clear cart on logout - preserve for same user
      // Cart will only be cleared when a different user logs in
      
      // Notification service removed as requested
      
      // Clear local storage
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('userId');
      await onLogout();

      // Navigate to login screen
      if ((navigation as any).reset) {
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else if ((navigation as any).navigate) {
        (navigation as any).navigate('Login');
      }
    } catch (error) {
      console.error('[Profile] Logout error:', error);
      // Even if data clearing fails, try to clear and redirect
      // Don't clear cart on logout - preserve for same user
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('userId');
      
      if ((navigation as any).reset) {
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else if ((navigation as any).navigate) {
        (navigation as any).navigate('Login');
      }
    }
  };

  // Show loading state while profile is being fetched
  if (loading) {
    return null;
  }

  return (
    <View style={styles.baseBg}>
      <CustomHeader title="My Profile" showBack={false} />
      <View style={styles.body}>
      <ProfilePhotoName
        photoSource={photoUri}
        cameraIconSource={require('../assets/img/profile/editprofile.png')}
        userName={userName}
      />{/* photo upload is done in Edit Profile */}

      {/* Menu Buttons */}
      <View style={styles.menuWrap}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => (navigation as any).navigate('EditProfile')}
        >
          <Image source={require('../assets/img/profile/profile.png')} style={styles.menuIcon} />
          <Text style={styles.menuText}>Edit Profile</Text>
          <Image source={require('../assets/img/profile/nextarrow.png')} style={styles.menuArrow} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => (navigation as any).navigate('Custom')}
        >
          <Text style={styles.menuGlyph}>✦</Text>
          <Text style={styles.menuText}>Custom Order</Text>
          <Image source={require('../assets/img/profile/nextarrow.png')} style={styles.menuArrow} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={handleCheckPush}
        >
          <Text style={styles.menuGlyph}>🔔</Text>
          <Text style={styles.menuText}>Notification Status</Text>
          <Image source={require('../assets/img/profile/nextarrow.png')} style={styles.menuArrow} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={handleDeleteAccount}
        >
          <Image source={require('../assets/img/profile/logout.png')} style={[styles.menuIcon, {tintColor: '#dc2626'}]} />
          <Text style={[styles.menuText, {color: '#dc2626'}]}>Delete Account</Text>
          <Image source={require('../assets/img/profile/nextarrow.png')} style={styles.menuArrow} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn} onPress={handleLogout}>
          <Image source={require('../assets/img/profile/logout.png')} style={styles.menuIcon} />
          <Text style={styles.menuText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {/* App version — the installed store build */}
      <View style={styles.versionLineContainer}>
        <Text style={styles.versionLineText}>v{APP_VERSION}</Text>
      </View>
      </View>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={closeLoginPrompt}
        title="Login Required"
        message="Please login to access your profile"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  baseBg: {
    flex: 1,
    backgroundColor: '#fff',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingTop: getResponsiveSpacing(16, 20, 24),
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
    fontFamily: 'GlorifyDEMO',
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
    borderWidth: 1,
    borderColor: '#EEE3D3',
    paddingVertical: getResponsiveSpacing(11, 13, 15),
    paddingHorizontal: getResponsiveSpacing(14, 18, 22),
    marginBottom: getResponsiveSpacing(11, 13, 14),
    shadowColor: '#5D0829',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 2,
  },
  menuIcon: {
    width: getResponsiveSpacing(24, 28, 32),
    height: getResponsiveSpacing(24, 28, 32),
    resizeMode: 'contain',
    marginRight: getResponsiveSpacing(12, 16, 20),
    tintColor: '#5D0829',
  },
  menuGlyph: {
    width: getResponsiveSpacing(24, 28, 32),
    fontSize: getResponsiveFontSize(20, 22, 24),
    color: '#5D0829',
    textAlign: 'center',
    marginRight: getResponsiveSpacing(12, 16, 20),
  },
  menuText: {
    color: '#5D0829',
    fontSize: getResponsiveFontSize(15, 17, 19),
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
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
    fontFamily: 'GlorifyDEMO',
    opacity: 0.7,
  },
});

export default Profile; 