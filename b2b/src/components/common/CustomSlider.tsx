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
  image_url?: string;
  link?: string;
  link_url?: string;
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
              {/* Balanced two-column layout: text block on the left, product
                  image on the right — no more overlapping absolute elements. */}
              <View style={styles.slideRow}>
                <View style={styles.textCol}>
                  <Text style={styles.eyebrow}>FEATURED</Text>
                  <Text style={styles.title} numberOfLines={2}>{slide.title}</Text>
                  {slide.description ? (
                    <Text style={styles.desc} numberOfLines={2}>{slide.description}</Text>
                  ) : null}
                  <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (slide.category_id && onShowMore) {
                        onShowMore(slide.category_id, slide.category_name || 'Category');
                      }
                    }}
                  >
                    <Text style={styles.buttonText}>{slide.button}</Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={typeof slide.image === 'string' && slide.image.startsWith('http') ? { uri: slide.image } : slide.image}
                  style={styles.jewelryImg}
                  resizeMode="contain"
                  onError={(error) => console.log('Slider image load error:', error?.nativeEvent?.error)}
                />
              </View>
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
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(192,158,131,0.45)', // subtle gold hairline
  },
  slideBg: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  slideRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 22,
    paddingRight: 14,
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  eyebrow: {
    color: '#E7C9A9',
    fontSize: 11,
    fontFamily: 'GlorifyDEMO',
    letterSpacing: 2,
    marginBottom: 4,
    opacity: 0.9,
  },
  jewelryImg: {
    width: 128,
    height: 128,
  },
  title: {
    color: '#FCE2BF',
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: 'GlorifyDEMO',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  desc: {
    color: '#F0D9C4',
    fontSize: 12,
    fontFamily: 'GlorifyDEMO',
    marginTop: 4,
    opacity: 0.9,
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#FCE2BF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  buttonText: {
    color: '#5D0829',
    fontSize: 13,
    fontFamily: 'GlorifyDEMO',
    fontWeight: 'bold',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2C6C6',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#C09E83', // gold active pill
    width: 18,
    height: 6,
    borderRadius: 3,
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