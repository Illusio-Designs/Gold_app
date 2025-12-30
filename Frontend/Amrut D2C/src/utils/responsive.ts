import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

// Breakpoints based on dp width for phones only:
// Small: width < 360 dp (Low-end phones)
// Medium: 360 dp ≤ width < 420 dp (Most common phones)
// Large: width ≥ 420 dp (High-end phones)

export const isSmallScreen = () => width < 360;
export const isMediumScreen = () => width >= 360 && width < 420;
export const isLargeScreen = () => width >= 420;

// Height-based responsiveness
export const isShortScreen = () => height < 700;
export const isMediumHeight = () => height >= 700 && height < 800;
export const isTallScreen = () => height >= 800;

// Aspect ratio detection
export const getAspectRatio = () => width / height;
export const isWideScreen = () => getAspectRatio() > 0.5; // 18:9, 19:9, etc.
export const isStandardScreen = () => getAspectRatio() <= 0.5; // 16:9 and below

// Pixel density
export const getPixelRatio = () => PixelRatio.get();
export const isHighDensity = () => getPixelRatio() >= 3;
export const isMediumDensity = () => getPixelRatio() >= 2 && getPixelRatio() < 3;
export const isLowDensity = () => getPixelRatio() < 2;

// Responsive spacing helpers
export const getResponsiveSpacing = (small: number, medium: number, large: number) => {
  if (isSmallScreen()) return small;
  if (isMediumScreen()) return medium;
  return large;
};

export const getResponsiveFontSize = (small: number, medium: number, large: number) => {
  if (isSmallScreen()) return small;
  if (isMediumScreen()) return medium;
  return large;
};

// Screen dimensions for reference
export const screenWidth = width;
export const screenHeight = height; 