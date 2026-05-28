/**
 * tokens.ts — Thali design system
 *
 * Single source of truth for every color, size, spacing, and radius value.
 * Uses PixelRatio + Dimensions so layouts adapt across:
 *   - Small Android  : 360×640  (hdpi)
 *   - Normal Android : 390×844  (xxhdpi)
 *   - Large Android  : 412×915  (xxhdpi+)
 *   - Tablet         : 768×1024
 *   - iPhone SE      : 375×667
 *   - iPhone 14 Pro  : 393×852
 *
 * Usage:
 *   import { colors, spacing, font, radius, layout } from '@/tokens'
 */

import { Dimensions, PixelRatio, Platform } from 'react-native'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

// ─── Screen helpers ───────────────────────────────────────────────────────────

export const screen = {
  width: SCREEN_W,
  height: SCREEN_H,
  isSmall: SCREEN_W < 375,        // Galaxy A series small, older budget phones
  isMedium: SCREEN_W >= 375 && SCREEN_W < 410,
  isLarge: SCREEN_W >= 410,       // Pixel 7, Galaxy S series, iPhone Pro Max
  isTablet: SCREEN_W >= 600,
}

// ─── Responsive scale ─────────────────────────────────────────────────────────
// Scales a base value (designed at 390px width) to any screen width.
// Clamped so extreme tablets don't get absurdly large values.

const BASE_WIDTH = 390
export const rs = (size: number, clamp = true): number => {
  const scaled = (SCREEN_W / BASE_WIDTH) * size
  if (!clamp) return scaled
  // Never go below 85% of base or above 130% — keeps things readable everywhere
  return Math.max(size * 0.85, Math.min(size * 1.3, scaled))
}

// Font scale — uses PixelRatio.getFontScale() so user accessibility settings
// (large text) are respected but we still have reasonable bounds
const fontScale = Math.min(PixelRatio.getFontScale(), 1.25)
export const fs = (size: number): number =>
  Math.round((rs(size) / fontScale) * 10) / 10

// ─── Colors ───────────────────────────────────────────────────────────────────

export const colors = {
  // Brand
  primary:        '#1D9E75',
  primaryLight:   '#E1F5EE',
  primaryMid:     '#9FE1CB',
  primaryDark:    '#0F6E56',
  primaryDeep:    '#085041',

  // Semantic
  success:        '#1D9E75',
  successBg:      '#E1F5EE',
  warning:        '#EF9F27',
  warningBg:      '#FAEEDA',
  warningDark:    '#854F0B',
  danger:         '#E24B4A',
  dangerBg:       '#FCEBEB',
  dangerDark:     '#A32D2D',
  info:           '#378ADD',
  infoBg:         '#E6F1FB',

  // Neutrals
  white:          '#FFFFFF',
  background:     '#F8F8F6',
  surface:        '#FFFFFF',
  surfaceAlt:     '#F2F2F0',
  border:         'rgba(0,0,0,0.08)',
  borderMid:      'rgba(0,0,0,0.14)',

  // Text
  textPrimary:    '#1A1A18',
  textSecondary:  '#5C5C5A',
  textHint:       '#9A9A98',
  textOnDark:     '#FFFFFF',
  textOnGreen:    '#FFFFFF',

  // Nav
  navActive:      '#1D9E75',
  navInactive:    '#A0A09E',

  // Overlay
  overlay:        'rgba(0,0,0,0.45)',
  cardShadow:     'rgba(0,0,0,0.06)',
} as const

// ─── Spacing ──────────────────────────────────────────────────────────────────
// 4-point grid, responsive

export const spacing = {
  xxs:  rs(4),
  xs:   rs(8),
  sm:   rs(12),
  md:   rs(16),
  lg:   rs(20),
  xl:   rs(24),
  xxl:  rs(32),
  xxxl: rs(48),
} as const

// ─── Typography ───────────────────────────────────────────────────────────────

export const font = {
  // Sizes
  size: {
    xs:   fs(11),
    sm:   fs(12),
    base: fs(14),
    md:   fs(15),
    lg:   fs(17),
    xl:   fs(20),
    xxl:  fs(24),
    hero: fs(32),
  },
  // Weights — RN only supports these reliably cross-platform
  weight: {
    regular: '400' as const,
    medium:  '500' as const,
    bold:    '700' as const,   // use sparingly
  },
  // Line heights
  leading: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.7,
  },
  // Family — system fonts, zero load time, best rendering per OS
  family: {
    sans: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  },
} as const

// ─── Border radius ────────────────────────────────────────────────────────────

export const radius = {
  xs:   rs(6),
  sm:   rs(10),
  md:   rs(14),
  lg:   rs(18),
  xl:   rs(24),
  full: 9999,
} as const

// ─── Layout ───────────────────────────────────────────────────────────────────

export const layout = {
  // Screen padding — smaller on small phones
  screenPadding:  screen.isSmall ? rs(14) : rs(16),
  // Bottom nav height — accounts for gesture nav bar on Android 10+
  navHeight:      Platform.OS === 'android' ? rs(56) : rs(60),
  // Header height
  headerHeight:   rs(52),
  // Card padding
  cardPadding:    rs(14),
  // Min touch target — WCAG 2.5.5 recommends 44×44pt
  touchTarget:    Math.max(rs(44), 44),
  // Max content width for tablets
  maxContent:     screen.isTablet ? 480 : SCREEN_W,
} as const

// ─── Shadows ──────────────────────────────────────────────────────────────────
// Elevation-based, cross-platform

export const shadow = {
  none: {},
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: {},
  }),
} as const

// ─── Animation durations ─────────────────────────────────────────────────────

export const duration = {
  fast:   150,
  normal: 250,
  slow:   400,
} as const
