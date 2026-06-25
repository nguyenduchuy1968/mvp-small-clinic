/**
 * Clinic Design System — Border Radius
 *
 * Centralized radius tokens for consistent rounding.
 */

export const radius = {
  // ── Buttons ────────────────────────────────────────
  button: {
    DEFAULT: "rounded-xl",
    sm: "rounded-lg",
    full: "rounded-full",
  },

  // ── Cards ──────────────────────────────────────────
  card: {
    DEFAULT: "rounded-2xl",
    compact: "rounded-xl",
  },

  // ── Inputs ─────────────────────────────────────────
  input: {
    DEFAULT: "rounded-xl",
    sm: "rounded-lg",
  },

  // ── Navigation ─────────────────────────────────────
  nav: {
    container: "rounded-xl",
    item: "rounded-lg",
  },

  // ── Logo ───────────────────────────────────────────
  logo: {
    container: "rounded-xl",
  },

  // ── Icons ──────────────────────────────────────────
  icon: {
    container: "rounded-xl",
    circular: "rounded-full",
  },

  // ── Dialogs / Modals ───────────────────────────────
  dialog: {
    DEFAULT: "rounded-2xl",
  },

  // ── Mobile Menu ────────────────────────────────────
  mobileMenu: {
    item: "rounded-2xl", // 12-16px rounded for premium feel
  },
} as const

export type ThemeRadius = typeof radius
