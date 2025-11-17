import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ImageSourcePropType } from 'react-native';

interface ProfilePhotoNameProps {
  photoSource: ImageSourcePropType;
  cameraIconSource: ImageSourcePropType;
  userName: string;
  onCameraPress?: () => void;
}

const ProfilePhotoName: React.FC<ProfilePhotoNameProps> = ({
  photoSource,
  cameraIconSource,
  userName,
  onCameraPress,
}) => (
  <>
    <View style={styles.profilePhotoWrap}>
      <Image source={photoSource} style={styles.profilePhoto} />
      <TouchableOpacity 
        style={styles.cameraBtn} 
        onPress={() => {
          console.log('[ProfilePhotoName] Camera button pressed');
          if (onCameraPress) {
            onCameraPress();
          }
        }}
        activeOpacity={0.7}
      >
        <Image source={cameraIconSource} style={styles.cameraIcon} />
      </TouchableOpacity>
    </View>
    <Text style={styles.profileName}>{userName}</Text>
  </>
);

const styles = StyleSheet.create({
  profilePhotoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  profilePhoto: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#fff',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#5D0829',
    borderRadius: 18,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    right: 15,
  },
  cameraIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    tintColor: '#FCE2BF',
  },
  profileName: {
    color: '#5D0829',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
    textAlign: 'center',
    marginBottom: 40,
    top: 18,
  },
});

export default ProfilePhotoName; 