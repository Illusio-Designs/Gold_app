import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { isSmallScreen, isMediumScreen, isLargeScreen } from '../../utils/responsive';

type CategoryFilterGroupProps = {
  onSelect: (value: string) => void;
  selected?: string;
  style?: ViewStyle;
  categories?: { id: number; name: string; description?: string; image?: string }[];
  loading?: boolean;
};

const CategoryFilterGroup = ({ onSelect, selected = 'all', style, categories = [], loading = false }: CategoryFilterGroupProps) => {
  // Add "All" option to the beginning
  const allCategories = [{ id: 0, name: 'All', value: 'all' }, ...categories];

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {allCategories.map((cat, idx) => {
        // For "All" button, use 'all', for others use category name
        const categoryValue = cat.id === 0 ? 'all' : cat.name.toLowerCase();
        const isSelected = selected === categoryValue;
        
        return (
          <TouchableOpacity
            key={cat.id || idx}
            style={[styles.button, isSelected ? styles.selected : styles.unselected, idx !== 0 && { marginLeft: 8 }]}
            onPress={() => onSelect(categoryValue)}
            activeOpacity={0.85}
          >
            <Text style={[styles.text, isSelected ? styles.selectedText : styles.unselectedText]}>{cat.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: isSmallScreen()? 5 : isMediumScreen() ? 6 : isLargeScreen()? 10 : 8, 
  
    // paddingHorizontal will be set dynamically
  },
  loadingText: {
    color: '#5D0829',
    fontSize: 14,
    fontFamily: 'Glorifydemo-BW3J3',
    textAlign: 'center',
  },
  button: {
    borderRadius: isSmallScreen() ? 12 : isMediumScreen() ? 16 : isLargeScreen() ? 22 : 16,
    paddingVertical: isSmallScreen() ? 6 : isMediumScreen() ? 8 : isLargeScreen() ? 10 : 8,
    paddingHorizontal: isSmallScreen() ? 12 : isMediumScreen() ? 16 : isLargeScreen() ? 25 : 25,
    borderWidth: 0.5,
    borderColor: '#5D0829',
    minWidth: isSmallScreen() ? 30 : isMediumScreen() ? 40 : isLargeScreen() ? 50 : 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: '#5D0829',
  },
  unselected: {
    backgroundColor: '#fff',
  },
  text: {
    fontFamily: 'Glorifydemo-BW3J3',
    fontSize: isSmallScreen() ? 12 : isMediumScreen() ? 14 : isLargeScreen() ? 18 : 14,
    fontWeight: '700',
  },
  selectedText: {
    color: '#FCE2BF',
  },
  unselectedText: {
    color: '#5D0829',
  },
});

export default CategoryFilterGroup; 