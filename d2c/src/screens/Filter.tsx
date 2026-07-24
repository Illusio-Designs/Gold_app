import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, PanResponder, Animated, Dimensions } from 'react-native';
import Button from '../components/common/Button';
import CustomLoader from '../components/common/CustomLoader';
import ScreenLoader from '../components/common/ScreenLoader';
import { getCategories } from '../services/Api';
const SIZES = ['5.5"', '6"', '6.25"', '6.5"'];
const LENGTHS = ['12-14', '14-16', '16-18', '18-20'];
const PURITIES = ['18K', '20K', '22K', '24K'];
const SLIDER_WIDTH = Dimensions.get('window').width - 80;
const SLIDER_MIN = 0;
const SLIDER_MAX = 10;

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(val, max));
}

type CustomWeightSliderProps = {
  value: number;
  onValueChange: (val: number) => void;
  min?: number;
  max?: number;
};

const CustomWeightSlider = ({ value, onValueChange, min = SLIDER_MIN, max = SLIDER_MAX }: CustomWeightSliderProps) => {
  const [thumbX, setThumbX] = useState(((value - min) / (max - min)) * SLIDER_WIDTH);
  const [dragging, setDragging] = useState(false);
  const [dragDx, setDragDx] = useState(0);
  const [internalValue, setInternalValue] = useState(value);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDragging(true);
        setDragDx(0);
      },
      onPanResponderMove: (e, gestureState) => {
        setDragDx(gestureState.dx);
        let newX = clamp(thumbX + gestureState.dx, 0, SLIDER_WIDTH);
        let newValue = min + (newX / SLIDER_WIDTH) * (max - min);
        setInternalValue(Number(newValue.toFixed(1)));
        onValueChange(Number(newValue.toFixed(1)));
      },
      onPanResponderRelease: (e, gestureState) => {
        let newX = clamp(thumbX + gestureState.dx, 0, SLIDER_WIDTH);
        setThumbX(newX);
        setDragging(false);
        setDragDx(0);
      },
    })
  ).current;

  React.useEffect(() => {
    const newX = ((value - min) / (max - min)) * SLIDER_WIDTH;
    setThumbX(newX);
    setInternalValue(value);
  }, [value]);

  const currentThumbX = dragging ? clamp(thumbX + dragDx, 0, SLIDER_WIDTH) : thumbX;

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.track} />
      <View
        style={[
          sliderStyles.thumb,
          { left: currentThumbX - 10 },
        ]}
        {...panResponder.panHandlers}
      />
      <View style={sliderStyles.labelRow}>
        <Text style={sliderStyles.labelText}>0gm</Text>
        <View style={{ flex: 1 }} />
        <Text style={sliderStyles.labelText}>10gm</Text>
      </View>
    </View>
  );
};

const sliderStyles = StyleSheet.create({
  container: {
    width: SLIDER_WIDTH,
    height: 70,
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 10,
  },
  track: {
    height: 2,
    backgroundColor: '#5D0829',
    borderRadius: 1,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 29,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#5D0829',
    position: 'absolute',
    top: 20,
    left: -10,
    zIndex: 2,
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    width: '100%',
    paddingHorizontal: 2,
  },
  labelText: {
    color: '#6B0D33',
    fontFamily: 'GlorifyDEMO',
    fontSize: 14,
    fontWeight: '700',
  },
});

type FilterProps = {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
};

const Filter = ({ visible, onClose, onApply }: FilterProps) => {
  const [categories, setCategories] = useState<{ id: number; name: string; description?: string; image?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [weight, setWeight] = useState<number>(5);
  const [selectedSize, setSelectedSize] = useState('5.5"');
  const [selectedLength, setSelectedLength] = useState('16-18');
  const [selectedPurity, setSelectedPurity] = useState('18K');

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories for Filter...');
        const response = await getCategories();
        console.log('Categories API response:', response);
        
        if (response && response.success && response.data && Array.isArray(response.data)) {
          console.log(`✅ Loaded ${response.data.length} categories:`, response.data);
          setCategories(response.data);
          if (response.data.length > 0) {
            setSelectedCategory(response.data[0].name);
          }
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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <Text style={styles.header}>Filter</Text>
              <TouchableOpacity onPress={onClose}><Text style={styles.reset}>Reset</Text></TouchableOpacity>
            </View>
            <Text style={styles.label}>Categories</Text>
                         {loading ? (
               <View style={styles.loadingContainer}>
                 <CustomLoader size="large" text="Loading categories..." textColor="#5D0829" />
               </View>
             ) : (
              <View style={styles.optionsRow}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.optionBtn, selectedCategory === cat.name && styles.selectedOption]}
                    onPress={() => setSelectedCategory(cat.name)}
                  >
                    <Text style={[styles.optionText, selectedCategory === cat.name && styles.selectedOptionText]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={styles.label}>Weight</Text>
            {/* Slider removed. Add your custom slider or another solution here. */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 2, marginTop: 18, marginBottom: 10 }}>
              <Text style={{ color: '#6B0D33', fontFamily: 'GlorifyDEMO', fontSize: 14, fontWeight: '700' }}>0gm</Text>
              <Text style={{ color: '#6B0D33', fontFamily: 'GlorifyDEMO', fontSize: 14, fontWeight: '700' }}>10gm</Text>
            </View>
            <Text style={styles.label}>Size</Text>
            <View style={styles.optionsRow}>
              {SIZES.map(size => (
                <TouchableOpacity
                  key={size}
                  style={[styles.optionBtn, selectedSize === size && styles.selectedOption]}
                  onPress={() => setSelectedSize(size)}
                >
                  <Text style={[styles.optionText, selectedSize === size && styles.selectedOptionText]}>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Length <Text style={styles.inch}>(inch)</Text></Text>
            <View style={styles.optionsRow}>
              {LENGTHS.map(length => (
                <TouchableOpacity
                  key={length}
                  style={[styles.optionBtn, selectedLength === length && styles.selectedOption]}
                  onPress={() => setSelectedLength(length)}
                >
                  <Text style={[styles.optionText, selectedLength === length && styles.selectedOptionText]}>{length}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Purity</Text>
            <View style={styles.optionsRow}>
              {PURITIES.map(purity => (
                <TouchableOpacity
                  key={purity}
                  style={[styles.optionBtn, selectedPurity === purity && styles.selectedOption]}
                  onPress={() => setSelectedPurity(purity)}
                >
                  <Text style={[styles.optionText, selectedPurity === purity && styles.selectedOptionText]}>{purity}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Show Results" onPress={onApply} style={{ marginTop: 30, marginBottom: 10, alignSelf: 'center', width: '100%' }} textStyle={{}} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: '80%',
    maxHeight: '95%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B0D33',
    fontSize: 16,
    fontFamily: 'GlorifyDEMO',
    textAlign: 'center',
  },
  header: {
    color: '#6B0D33',
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
  },
  reset: {
    color: '#6B0D33',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'GlorifyDEMO',
    textDecorationLine: 'underline',
  },
  label: {
    color: '#6B0D33',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'GlorifyDEMO',
    marginTop: 18,
    marginBottom: 8,
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  weightLabel: {
    color: '#6B0D33',
    fontSize: 14,
    fontFamily: 'GlorifyDEMO',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 8,
  },
  optionBtn: {
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#5D0829',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#5D0829',
  },
  optionText: {
    color: '#5D0829',
    fontFamily: 'GlorifyDEMO',
    fontSize: 14,
    fontWeight: '700',
  },
  selectedOptionText: {
    color: '#FCE2BF',
  },
  inch: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B0D33',
  },
  showBtn: {
    marginTop: 30,
    marginBottom: 10,
    alignSelf: 'center',
    width: '100%',
  },
});

export default Filter; 