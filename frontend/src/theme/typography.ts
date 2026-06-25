/**
 * Clinic Design System — Typography
 *
 * Centralized font-size and font-weight tokens.
 */

export const typography = {
  // ── Heading Sizes ──────────────────────────────────
  heading: {
    h1: {
      mobile: "text-4xl", // 36px
      desktop: "md:text-5xl", // 48px
      weight: "font-bold",
      tracking: "tracking-tight",
    },
    h2: {
      mobile: "text-3xl", // 30px
      desktop: "md:text-4xl", // 36px
      weight: "font-bold",
      tracking: "tracking-tight",
    },
    h3: {
      mobile: "text-[22px]",
      desktop: "text-[22px]",
      weight: "font-semibold",
      tracking: "",
    },
    h4: {
      mobile: "text-xl",
      desktop: "text-xl",
      weight: "font-semibold",
      tracking: "",
    },
  },

  // ── Body Sizes ─────────────────────────────────────
  body: {
    default: "text-[19px]", // 19px as requested
    small: "text-[15px]",
    xs: "text-[13px]",
    muted: "text-gray-500",
    leading: "leading-relaxed",
  },

  // ── Navigation ─────────────────────────────────────
  nav: {
    desktop: "text-[18px]",
    mobile: "text-[18px]",
    weight: "font-semibold",
  },

  // ── Button Sizes ───────────────────────────────────
  button: {
    lg: "text-[19px]",
    md: "text-[17px]",
    sm: "text-[14px]",
    weight: "font-semibold",
  },

  // ── Logo ───────────────────────────────────────────
  logo: {
    name: "text-[18px]", // Reduced from 22px for lighter header
    subtitle: "text-[12px]", // Reduced from 13px
    nameWeight: "font-extrabold",
    subtitleWeight: "font-medium",
  },

  // ── Section Title ──────────────────────────────────
  section: {
    title: "text-4xl font-bold tracking-tight text-gray-900 md:text-5xl",
    subtitle: "text-[19px] text-gray-500 leading-relaxed",
  },
} as const

export type ThemeTypography = typeof typography
