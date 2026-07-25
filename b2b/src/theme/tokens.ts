// Amrut Jewels design tokens — the single source of truth for the revamp.
// Glorify is a single-weight font, so hierarchy comes from SIZE, not weight.

import { Platform } from 'react-native';

export const colors = {
  // brand
  maroon: '#5D0829',
  maroon900: '#3A0619',
  maroon700: '#6B0D33',
  maroon600: '#7C1F43',
  cream: '#FCE2BF',
  creamSoft: '#FBF3E6',
  gold: '#C09E83',
  goldDeep: '#A17C57',

  // neutrals (hue-biased toward the brand, not pure grey)
  ink: '#241A1D',
  muted: '#8F7F84',
  line: '#ECE0D3',
  lineSoft: '#F0E7DA',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F1E8',
  pageBg: '#F5EDE3',

  // semantic
  success: '#2F7D5B',
  successBg: '#E7F3EC',
  warn: '#A5730A',
  warnBg: '#FBF0DC',
  info: '#2A5B9B',
  infoBg: '#E6EEF7',
  danger: '#B0324A',
  dangerBg: '#FBECEA',

  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 9,
  md: 13,
  lg: 17,
  xl: 22,
  round: 999,
} as const;

export const FONT = 'GlorifyDEMO';

// Font sizes tuned to the mockup. `display` for hero titles, down to `caption`.
export const fontSize = {
  display: 24,
  title: 19,
  subtitle: 17,
  body: 14,
  bodySm: 13,
  label: 12,
  caption: 10.5,
} as const;

// Ready-made text styles (all Glorify, weight normal — the global patch enforces it).
export const typography = {
  display: { fontFamily: FONT, fontSize: fontSize.display, color: colors.ink },
  title: { fontFamily: FONT, fontSize: fontSize.title, color: colors.ink },
  subtitle: { fontFamily: FONT, fontSize: fontSize.subtitle, color: colors.ink },
  body: { fontFamily: FONT, fontSize: fontSize.body, color: colors.ink },
  bodySm: { fontFamily: FONT, fontSize: fontSize.bodySm, color: colors.ink },
  label: { fontFamily: FONT, fontSize: fontSize.label, color: colors.muted },
  caption: { fontFamily: FONT, fontSize: fontSize.caption, color: colors.muted },
} as const;

// Cross-platform elevation. iOS uses shadow*, Android uses elevation.
function shadow(elevation: number, opacity: number, radiusPx: number, offsetY: number) {
  return Platform.select({
    ios: {
      shadowColor: '#3A0619',
      shadowOpacity: opacity,
      shadowRadius: radiusPx,
      shadowOffset: { width: 0, height: offsetY },
    },
    android: { elevation },
    default: {},
  }) as object;
}

export const shadows = {
  none: {},
  card: shadow(2, 0.1, 10, 4),
  sheet: shadow(6, 0.16, 18, -6),
  bar: shadow(8, 0.14, 16, -4),
  float: shadow(4, 0.22, 12, 6),
} as const;

export const theme = { colors, spacing, radius, fontSize, typography, shadows, FONT } as const;
export type Theme = typeof theme;
export default theme;
