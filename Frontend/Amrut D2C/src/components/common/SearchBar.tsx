import React from 'react';
import { View, TextInput, StyleSheet, Image, TouchableOpacity } from 'react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onPress?: () => void;
  onSubmitEditing?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, placeholder = 'Search', onPress, onSubmitEditing }) => {
  const content = (
    <View style={styles.container}>
      <Image source={require('../../assets/img/common/searchicon.png')} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#5D0829"
        value={value}
        onChangeText={onChangeText}
        selectionColor="#5D0829"
        editable={!onPress} // Disable editing when onPress is provided (Home screen)
        onSubmitEditing={onSubmitEditing}
        returnKeyType="search"
      />
      <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <View style={styles.clearCircle}>
          <Image source={require('../../assets/img/common/clearbutton.png')} style={styles.clearIcon} />
        </View>
      </TouchableOpacity>
    </View>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#5D0829',
    paddingHorizontal: 12,
    height: 48,
    marginTop:10,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 6,
    tintColor: '#5D0829',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#5D0829',
    fontWeight: '400',
    fontFamily: 'Montserrat-Regular',
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  clearButton: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
  },
  clearCircle: {
    width: 20,
    height: 20,
    borderRadius: 15,
    borderWidth: 0.5,
    borderColor: '#5D0829',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  clearIcon: {
    width: 8,
    height: 8,
    tintColor: '#6B0D33',
    resizeMode: 'contain',
  },
});

export default SearchBar; 