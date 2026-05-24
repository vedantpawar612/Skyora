// AI Yoga Trainer - Theme Configuration
// Premium dark fitness theme with gradients and glassmorphism

export const COLORS = {
  // Primary palette
  primary: '#6C63FF',
  primaryLight: '#9C88FF',
  primaryDark: '#4834DF',
  
  // Accent
  accent: '#00D9A6',
  accentLight: '#00F5C0',
  accentDark: '#00B386',
  
  // Backgrounds
  background: '#0A0E21',
  backgroundLight: '#1A1A2E',
  backgroundCard: '#16213E',
  backgroundElevated: '#1E2A4A',
  
  // Surfaces (glassmorphic)
  surface: 'rgba(255, 255, 255, 0.05)',
  surfaceLight: 'rgba(255, 255, 255, 0.08)',
  surfaceBorder: 'rgba(255, 255, 255, 0.1)',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B0BEC5',
  textMuted: '#607D8B',
  textAccent: '#00D9A6',
  
  // Status
  success: '#00E676',
  warning: '#FFD600',
  error: '#FF5252',
  info: '#448AFF',
  
  // Difficulty levels
  beginner: '#00E676',
  intermediate: '#FFD600',
  advanced: '#FF5252',
  
  // Skeleton overlay
  jointGood: '#00E676',
  jointClose: '#FFD600',
  jointBad: '#FF5252',
  boneLine: '#6C63FF',
  
  // Gradients
  gradientPrimary: ['#6C63FF', '#9C88FF'],
  gradientAccent: ['#00D9A6', '#00F5C0'],
  gradientDark: ['#0A0E21', '#1A1A2E'],
  gradientCard: ['rgba(108, 99, 255, 0.15)', 'rgba(0, 217, 166, 0.05)'],
  gradientHero: ['#6C63FF', '#00D9A6'],
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  body: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
  display: 48,
};

export const FONTS = {
  light: { fontWeight: '300' },
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semiBold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  extraBold: { fontWeight: '800' },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
};

export const ANIMATION = {
  fast: 200,
  medium: 350,
  slow: 500,
  verySlow: 800,
};
