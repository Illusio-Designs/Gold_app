import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { API_URL } from '@env';
import { getSliderImageUrl } from '../../utils/imageUtils';

const { width } = Dimensions.get('window');
const SLIDE_WIDTH = width * 0.85;
const SLIDE_HEIGHT = 160;

// Default slides for fallback
const DEFAULT_SLIDES = [
  {
    title: 'RINGS',
    image: require('../../assets/img/home/sliderimg.png'),
    bg: require('../../assets/img/home/sliderbg.png'),
    button: 'Show More',
  },
  {
    title: 'EARRINGS',
    image: require('../../assets/img/home/sliderimg.png'),
    bg: require('../../assets/img/home/sliderbg.png'),
    button: 'Show More',
  },
  {
    title: 'NECKLACE',
    image: require('../../assets/img/home/sliderimg.png'),
    bg: require('../../assets/img/home/sliderbg.png'),
    button: 'Show More',
  },
];

interface SliderItem {
  id: number;
  title: string;
  description?: string;
  image: string;
  link?: string;
  category_id?: number;
  category_name?: string;
  created_at?: string;
}

interface CustomSliderProps {
  sliders?: SliderItem[];
  loading?: boolean;
  onSliderPress?: (slider: SliderItem) => void;
  onShowMore?: (categoryId: number, categoryName: string) => void;
}

const CustomSlider: React.FC<CustomSliderProps> = ({ 
  sliders = [], 
  loading = false,
  onSliderPress,
  onShowMore
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Use API sliders if available, otherwise use default slides
  const slides = sliders && sliders.length > 0 ? sliders.map(slider => {
    console.log('🖼️ Processing slider:', slider);
    const imageUrl = getSliderImageUrl(slider.image_url);
    console.log('🖼️ Constructed image URL:', imageUrl);
    
    return {
      title: slider.title || 'Category',
      image: imageUrl || require('../../assets/img/home/sliderimg.png'),
      bg: require('../../assets/img/home/sliderbg.png'), // Use default background
      button: 'Show More',
      link: slider.link_url || slider.link,
      description: slider.description,
      category_id: slider.category_id,
      category_name: slider.category_name
    };
  }) : DEFAULT_SLIDES;

  // Auto-scroll effect
  React.useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      let nextIndex = (activeIndex + 1) % slides.length;
      scrollRef.current?.scrollTo({ x: nextIndex * SLIDE_WIDTH, animated: true });
      setActiveIndex(nextIndex);
    }, 3500);
    return () => clearInterval(interval);
  }, [activeIndex, slides.length]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    setActiveIndex(idx);
  };

  const handleSliderPress = (slide: any, index: number) => {
    if (onSliderPress && sliders[index]) {
      onSliderPress(sliders[index]);
    }
  };

  if (loading) {
    return (
      <View style={styles.sliderContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading sliders...</Text>
        </View>
      </View>
    );
  }

  // If no slides available, show a placeholder or return null
  if (!slides || slides.length === 0) {
    return (
      <View style={styles.sliderContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No sliders available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sliderContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ alignItems: 'center' }}
        style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT }}
      >
        {slides.map((slide, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleSliderPress(slide, idx)}
            activeOpacity={0.9}
          >
            <ImageBackground
              source={slide.bg}
              style={styles.slide}
              imageStyle={styles.slideBg}
              resizeMode="cover"
            >
              <Text style={styles.title}>{slide.title}</Text>
              <Image 
                source={typeof slide.image === 'string' && slide.image.startsWith('http') ? { uri: slide.image } : slide.image} 
                style={styles.jewelryImg} 
                resizeMode="contain" 
                onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
              />
              <TouchableOpacity 
                style={styles.button}
                onPress={() => {
                  if (slide.category_id && onShowMore) {
                    onShowMore(slide.category_id, slide.category_name || 'Category');
                  }
                }}
              >
                <Text style={styles.buttonText}>{slide.button}</Text>
              </TouchableOpacity>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.dotsRow}>
        {slides.map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, activeIndex === idx && styles.activeDot]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    alignItems: 'center',
    marginVertical: 5,
  },
  slide: {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    borderRadius: 32,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    justifyContent: 'space-between',
    position: 'relative',
  },
  slideBg: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  title: {
    color: '#F8D7C5',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Glorifydemo-BW3J3',
    letterSpacing: 1,
    zIndex: 2,
    flex: 1,
    bottom:25,
    left:40,
  },
  jewelryImg: {
    width: 120,
    height: 120,
    marginLeft: 0,
    zIndex: 2,
    right:100,
    bottom:5,
  },
  button: {
    position: 'absolute',
    right: 24,
    bottom: 20,
    backgroundColor: '#F8D7C5',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 5,
    zIndex: 3,
    
  },
  buttonText: {
    color: '#5D0829',
    fontSize: 14,
    fontFamily: 'Glorifydemo-BW3J3',
    fontWeight: 'bold',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#E2C6C6',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#7B2B3A',
    width: 8,
    height: 8,
    borderRadius: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default CustomSlider; 