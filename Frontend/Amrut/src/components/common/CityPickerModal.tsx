import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';

interface CityPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: string) => void;
  cities: string[];
}

const CityPickerModal: React.FC<CityPickerModalProps> = ({ visible, onClose, onSelect, cities }) => {
  const [search, setSearch] = useState('');

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (city: string) => {
    onSelect(city);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a city..."
            placeholderTextColor="#A47C8C"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={filteredCities}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.cityItem}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.cityName}>{item}</Text>
            </TouchableOpacity>
          )}
          keyboardShouldPersistTaps="handled"
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: Platform.OS === 'ios' ? 0 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#5D0829',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    color: '#5D0829',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#5D0829',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cityItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cityName: {
    fontSize: 16,
    color: '#5D0829',
  },
});

export default CityPickerModal; 