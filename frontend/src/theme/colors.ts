/**
 * Clinic Design System — Colors
 *
 * Single source of truth for all color tokens.
 * These values map to the CSS custom properties in index.css
 * and provide a typed API for component usage.
 */

export const colors = {
  // ── Brand ──────────────────────────────────────────
  primary: {
    DEFAULT: '#14B8A6', // teal-500
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },
  secondary: {
    DEFAULT: '#2563EB', // blue-600
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  accent: {
    orange: {
      DEFAULT: '#F97316', // orange-500
      50: '#FFF7ED',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C',
      500: '#F97316',
      600: '#EA580C',
      700: '#C2410C',
    },
  },

  // ── Neutral / Background ───────────────────────────
  background: {
    DEFAULT: '#F8FAFC', // slate-50
    card: '#F9FAFB', // gray-50
    section: '#F3F4F6', // gray-100
    white: '#FFFFFF',
  },
  text: {
    DEFAULT: '#1F2937', // gray-800
    muted: '#6B7280', // gray-500
    light: '#9CA3AF', // gray-400
    inverse: '#FFFFFF',
  },
  border: {
    DEFAULT: '#E5E7EB', // gray-200
    light: '#F3F4F6', // gray-100
  },

  // ── Semantic ───────────────────────────────────────
  success: {
    DEFAULT: '#10B981',
    light: '#D1FAE5',
  },
  warning: {
    DEFAULT: '#F59E0B',
    light: '#FEF3C7',
  },
  error: {
    DEFAULT: '#EF4444',
    light: '#FEE2E2',
  },

  // ── Navigation ─────────────────────────────────────
  nav: {
    bg: '#E8F4FA',
    border: '#D6EAF5',
    hoverBg: '#FFFFFF',
    hoverText: '#2563EB',
    text: '#4B5563', // gray-600
  },

  // ── Footer ─────────────────────────────────────────
  footer: {
    bg: '#052049',
    text: '#93C5FD', // blue-200
    heading: '#14B8A6', // teal-400
  },

  // ── Medical Theme ──────────────────────────────────
  medical: {
    teal: {
      iconBg: '#F0FDFA',
      iconText: '#0D9488',
    },
    blue: {
      cardBg: '#EFF6FF',
      cardBorder: '#DBEAFE',
      iconBg: '#DBEAFE',
      iconText: '#2563EB',
    },
  },

  // ── Trust Indicators ───────────────────────────────
  trust: {
    cardBg: '#EFF6FF',
    cardBorder: '#DBEAFE',
    iconBg: '#DBEAFE',
    iconText: '#2563EB',
  },
} as const;

export type ThemeColors = typeof colors;
