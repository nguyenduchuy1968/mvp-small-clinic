/**
 * Clinic Design System — Shadows
 *
 * Centralized shadow tokens for consistent elevation.
 */

export const shadows = {
  // ── Card Shadows ───────────────────────────────────
  card: {
    DEFAULT: 'shadow-sm',
    hover: 'shadow-lg',
    active: 'shadow-md',
  },

  // ── Button Shadows ─────────────────────────────────
  button: {
    DEFAULT: 'shadow-sm',
    hover: 'shadow-md',
    active: 'shadow-md',
  },

  // ── Navigation ─────────────────────────────────────
  nav: {
    container: 'shadow-sm',
  },

  // ── Header ─────────────────────────────────────────
  header: {
    DEFAULT: 'shadow-sm',
  },

  // ── Dropdown / Menu ────────────────────────────────
  dropdown: {
    DEFAULT: 'shadow-lg',
  },

  // ── Soft (for decorative elements) ─────────────────
  soft: 'shadow-sm',
  medium: 'shadow-md',
  large: 'shadow-lg',
  xl: 'shadow-xl',
} as const;

export type ThemeShadows = typeof shadows;
