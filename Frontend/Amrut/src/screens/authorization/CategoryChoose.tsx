import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ImageBackground, Image, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import Button from '../../components/common/Button';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getCategories } from '../../services/Api';
import CustomLoader from '../../components/common/CustomLoader';
import ScreenLoader from '../../components/common/ScreenLoader';

type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Product: { category: string };
};

const CategoryChoose = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<{ id: number; name: string; description?: string; image?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories for CategoryChoose...');
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
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  // Loading state check
  if (loading) {
    return <ScreenLoader text="Loading Categories..." />;
  }

  const handleCategoryPress = (label: string) => {
    setSelectedCategories(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
    navigation.navigate('Product', { category: label });
  };

  return (
    <ImageBackground
      source={require('../../assets/img/common/bgdesign.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.content}>
        <Image source={require('../../assets/img/common/maroonlogo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Select Your Interests</Text>
        <Text style={styles.subtitle}>Choose categories you're interested in to personalize your experience</Text>
        <View style={styles.form}>
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setDropdownOpen(!dropdownOpen)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedCategories.length > 0 ? selectedCategories.join(', ') : 'Category'}
              </Text>
              <Image
                source={require('../../assets/img/common/arrow.png')}
                style={[styles.dropdownArrow, dropdownOpen && styles.dropdownArrowOpen]}
              />
            </TouchableOpacity>
            {dropdownOpen && (
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
                  data={filteredCategories}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.itemRow}
                      onPress={() => handleCategoryPress(item.name)}
                    >
                      <Text style={styles.itemText}>{item.name}</Text>
                      <View style={[
                        styles.checkboxOuter,
                        selectedCategories.includes(item.name) ? styles.checkboxOuterSelected : null
                      ]}>
                        {selectedCategories.includes(item.name) ? <Text style={styles.tick}>✓</Text> : null}
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
          <Button onPress={() => navigation.navigate('MainTabs')} title="Continue" style={{ marginTop: 24 }} textStyle={{ color: '#FCE2BF', fontFamily: 'Glorifydemo-BW3J3' }} />
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={{ marginTop: 16, alignSelf: 'center' }}>
            <Text style={{ color: '#5D0829', fontSize: 14, textDecorationLine: 'underline' }}>Skip for now</Text>
          </TouchableOpacity>
        </View>
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
    paddingVertical: 180,
  },
  logo: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    marginBottom: 16,
    marginTop: 32,
  },
  title: {
    fontSize: 24,
    color: '#5D0829',
    fontFamily: 'Glorifydemo-BW3J3',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#5D0829',
    fontFamily: 'Glorifydemo-BW3J3',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    opacity: 0.8,
  },
  form: {
    width: '85%',
    alignSelf: 'center',
    marginTop: 16,
  },
  dropdownWrapper: {
    borderWidth: 0.5,
    borderColor: '#5D0829',
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    height: 45,
    marginBottom: 0,
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
});

export default CategoryChoose; 