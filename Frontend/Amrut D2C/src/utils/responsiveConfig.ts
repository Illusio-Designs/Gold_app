import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get screen dimensions with fallback
const getScreenDimensions = () => {
  try {
    const { width, height } = Dimensions.get('window');
    return { width: width || 375, height: height || 667 }; // Default fallback values
  } catch (error) {
    console.warn('Error getting screen dimensions, using fallback values');
    return { width: 375, height: 667 }; // Safe fallback values
  }
};

// Initialize with fallback values
let { width, height } = getScreenDimensions();

// Update dimensions when screen changes
Dimensions.addEventListener('change', () => {
  const newDimensions = getScreenDimensions();
  width = newDimensions.width;
  height = newDimensions.height;
});

// Custom responsive functions that work with React Native 0.80.2
export const wp = (percentage: string | number): number => {
  try {
    const num = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    if (isNaN(num)) {
      console.warn('Invalid percentage value for wp:', percentage);
      return 0;
    }
    return (width * num) / 100;
  } catch (error) {
    console.warn('Error in wp function:', error);
    return 0;
  }
};

export const hp = (percentage: string | number): number => {
  try {
    const num = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    if (isNaN(num)) {
      console.warn('Invalid percentage value for hp:', percentage);
      return 0;
    }
    return (height * num) / 100;
  } catch (error) {
    console.warn('Error in hp function:', error);
    return 0;
  }
};

// Screen size breakpoints (in dp)
export const BREAKPOINTS = {
  SMALL: 360,    // Low-end phones
  MEDIUM: 420,   // Most common phones
  LARGE: 480,    // High-end phones
  XLARGE: 600,   // Large phones/tablets
};

// Height breakpoints
export const HEIGHT_BREAKPOINTS = {
  SHORT: 700,    // Short screens
  MEDIUM: 800,   // Medium height
  TALL: 900,     // Tall screens
};

// Responsive spacing values
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
  XXXL: 32,
};

// Responsive font sizes
export const FONT_SIZES = {
  XS: 10,
  SM: 12,
  MD: 14,
  LG: 16,
  XL: 18,
  XXL: 20,
  XXXL: 22,
  TITLE: 24,
  HEADER: 26,
};

// Touch target minimum sizes (for accessibility)
export const TOUCH_TARGETS = {
  MIN_WIDTH: 44,
  MIN_HEIGHT: 44,
  PADDING: 8,
};

// Responsive helpers with error handling
export const getResponsiveValue = (small: number, medium: number, large: number, xlarge?: number) => {
  try {
    if (width < BREAKPOINTS.SMALL) return small;
    if (width < BREAKPOINTS.MEDIUM) return medium;
    if (width < BREAKPOINTS.LARGE) return large;
    return xlarge || large;
  } catch (error) {
    console.warn('Error in getResponsiveValue:', error);
    return medium; // Safe fallback
  }
};

export const getResponsiveHeightValue = (short: number, medium: number, tall: number) => {
  try {
    if (height < HEIGHT_BREAKPOINTS.SHORT) return short;
    if (height < HEIGHT_BREAKPOINTS.MEDIUM) return medium;
    return tall;
  } catch (error) {
    console.warn('Error in getResponsiveHeightValue:', error);
    return medium; // Safe fallback
  }
};

// Platform-specific adjustments
export const getPlatformValue = (ios: number, android: number) => {
  try {
    return Platform.OS === 'ios' ? ios : android;
  } catch (error) {
    console.warn('Error in getPlatformValue:', error);
    return android; // Safe fallback
  }
};

// Safe area adjustments
export const getSafeAreaPadding = () => {
  try {
    return getPlatformValue(50, 40);
  } catch (error) {
    console.warn('Error in getSafeAreaPadding:', error);
    return 40; // Safe fallback
  }
};

// Common responsive styles
export const COMMON_STYLES = {
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  // Header styles
  header: {
    paddingTop: getSafeAreaPadding(),
    paddingHorizontal: getResponsiveValue(16, 20, 24),
  },
  
  // Form styles
  form: {
    width: getResponsiveValue('95%', '92%', '90%'),
    paddingHorizontal: getResponsiveValue(16, 20, 24),
  },
  
  // Input styles
  input: {
    height: getResponsiveValue(44, 48, 52),
    fontSize: getResponsiveValue(FONT_SIZES.SM, FONT_SIZES.MD, FONT_SIZES.LG),
    paddingHorizontal: getResponsiveValue(12, 14, 16),
  },
  
  // Button styles
  button: {
    height: getResponsiveValue(44, 48, 52),
    borderRadius: getResponsiveValue(8, 10, 12),
  },
  
  // Card styles
  card: {
    borderRadius: getResponsiveValue(12, 16, 20),
    padding: getResponsiveValue(12, 16, 20),
    margin: getResponsiveValue(8, 10, 12),
  },
  
  // Text styles
  title: {
    fontSize: getResponsiveValue(FONT_SIZES.XL, FONT_SIZES.XXL, FONT_SIZES.TITLE),
    fontWeight: '700',
  },
  
  subtitle: {
    fontSize: getResponsiveValue(FONT_SIZES.LG, FONT_SIZES.XL, FONT_SIZES.XXL),
    fontWeight: '600',
  },
  
  body: {
    fontSize: getResponsiveValue(FONT_SIZES.SM, FONT_SIZES.MD, FONT_SIZES.LG),
  },
  
  caption: {
    fontSize: getResponsiveValue(FONT_SIZES.XS, FONT_SIZES.SM, FONT_SIZES.MD),
  },
};

// Responsive image sizes with safe fallbacks
export const IMAGE_SIZES = {
  SMALL: {
    width: wp('25%') || 90,
    height: wp('25%') || 90,
  },
  MEDIUM: {
    width: wp('30%') || 108,
    height: wp('30%') || 108,
  },
  LARGE: {
    width: wp('35%') || 126,
    height: wp('35%') || 126,
  },
  XLARGE: {
    width: wp('40%') || 144,
    height: wp('40%') || 144,
  },
};

// Responsive modal sizes with safe fallbacks
export const MODAL_SIZES = {
  SMALL: {
    width: wp('80%') || 288,
    height: wp('60%') || 400,
  },
  MEDIUM: {
    width: wp('85%') || 306,
    height: wp('70%') || 467,
  },
  LARGE: {
    width: wp('90%') || 324,
    height: wp('80%') || 534,
  },
};

// Export screen dimensions for reference with safe fallbacks
export const SCREEN = {
  WIDTH: width || 375,
  HEIGHT: height || 667,
  PIXEL_RATIO: PixelRatio.get() || 1,
  IS_IOS: Platform.OS === 'ios',
  IS_ANDROID: Platform.OS === 'android',
}; 