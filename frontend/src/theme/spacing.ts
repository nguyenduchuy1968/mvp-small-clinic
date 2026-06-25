/**
 * Clinic Design System — Spacing
 *
 * Centralized spacing tokens for sections, cards, and layout.
 */

export const spacing = {
  // ── Section Padding ────────────────────────────────
  section: {
    default: 'py-24 md:py-32',
    compact: 'py-16 md:py-20',
    tight: 'py-12 md:py-16',
  },

  // ── Card Padding ───────────────────────────────────
  card: {
    default: 'p-8',
    compact: 'p-6',
    tight: 'p-4',
  },

  // ── Container Width ────────────────────────────────
  container: {
    default: 'max-w-7xl',
    narrow: 'max-w-5xl',
    tight: 'max-w-3xl',
  },

  // ── Grid Gaps ──────────────────────────────────────
  grid: {
    default: 'gap-6 md:gap-8',
    wide: 'gap-8 md:gap-10',
    compact: 'gap-4 md:gap-6',
  },

  // ── Section Margins ────────────────────────────────
  sectionMargin: {
    top: 'mt-16',
    bottom: 'mb-16',
  },

  // ── Element Spacing ────────────────────────────────
  element: {
    stack: 'space-y-6',
    inline: 'gap-6',
    tight: 'gap-2',
  },

  // ── Header ─────────────────────────────────────────
  header: {
    height: 'h-[104px]',
    logoGap: 'gap-2', // Reduced from gap-3 for lighter feel
    navGap: 'gap-6',
    mobileMenuPadding: 'px-6 py-6',
  },

  // ── Mobile Menu ────────────────────────────────────
  mobileMenu: {
    itemPadding: 'px-4 py-[18px]', // 18px vertical padding for large touch targets
    itemMargin: 'mb-4', // 16px margin between items
    containerPadding: 'px-6 py-8',
    languageTopMargin: 'mt-8',
  },
} as const;

export type ThemeSpacing = typeof spacing;
