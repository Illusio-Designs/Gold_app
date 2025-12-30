import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { isSmallScreen, isMediumScreen, getResponsiveSpacing, getResponsiveFontSize } from '../../utils/responsive';

const { width } = Dimensions.get('window');

type LoginPromptModalProps = {
  visible: boolean;
  onClose: () => void;
  message?: string;
  title?: string;
};

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  visible,
  onClose,
  message = 'Please login to continue',
  title = 'Login Required',
}) => {
  const navigation = useNavigation();

  const handleLogin = () => {
    onClose();
    // Navigate to Login screen
    (navigation as any).navigate('Login');
  };

  const handleRegister = () => {
    onClose();
    // Navigate to Register screen
    (navigation as any).navigate('Register');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              {/* Logo */}
              <Image
                source={require('../../assets/img/common/maroonlogo.png')}
                style={styles.logo}
                resizeMode="contain"
              />

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              <Text style={styles.message}>{message}</Text>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>

              {/* Register Button */}
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                activeOpacity={0.8}
              >
                <Text style={styles.registerButtonText}>Create Account</Text>
              </TouchableOpacity>

              {/* Continue as Guest */}
              <TouchableOpacity
                style={styles.guestButton}
                onPress={()=>{
                    navigation.goBack();
                    onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.guestButtonText}>Continue Browsing</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: getResponsiveSpacing(24, 28, 32),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: isSmallScreen() ? 80 : isMediumScreen() ? 90 : 100,
    height: isSmallScreen() ? 80 : isMediumScreen() ? 90 : 100,
    marginBottom: getResponsiveSpacing(16, 20, 24),
  },
  title: {
    fontSize: getResponsiveFontSize(20, 22, 24),
    fontWeight: '700',
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
    marginBottom: getResponsiveSpacing(8, 10, 12),
    textAlign: 'center',
  },
  message: {
    fontSize: getResponsiveFontSize(14, 15, 16),
    color: '#666',
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(24, 28, 32),
    lineHeight: getResponsiveFontSize(20, 22, 24),
    paddingHorizontal: getResponsiveSpacing(8, 10, 12),
  },
  loginButton: {
    backgroundColor: '#5D0829',
    paddingVertical: getResponsiveSpacing(14, 16, 18),
    paddingHorizontal: getResponsiveSpacing(32, 36, 40),
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(12, 14, 16),
    shadowColor: '#5D0829',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FCE2BF',
    fontSize: getResponsiveFontSize(16, 17, 18),
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
  },
  registerButton: {
    backgroundColor: '#fff',
    paddingVertical: getResponsiveSpacing(14, 16, 18),
    paddingHorizontal: getResponsiveSpacing(32, 36, 40),
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(12, 14, 16),
    borderWidth: 2,
    borderColor: '#5D0829',
  },
  registerButtonText: {
    color: '#5D0829',
    fontSize: getResponsiveFontSize(16, 17, 18),
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
  },
  guestButton: {
    paddingVertical: getResponsiveSpacing(8, 10, 12),
    paddingHorizontal: getResponsiveSpacing(16, 18, 20),
  },
  guestButtonText: {
    color: '#999',
    fontSize: getResponsiveFontSize(13, 14, 15),
    fontFamily: 'GlorifyDEMO',
    textDecorationLine: 'underline',
  },
});

export default LoginPromptModal;
