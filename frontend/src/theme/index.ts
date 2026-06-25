/**
 * Clinic Design System — Theme
 *
 * Single entry point for all design tokens.
 * Import this to access the complete theme.
 *
 * Usage:
 *   import { theme } from '@/theme';
 *   // theme.colors.primary.DEFAULT
 *   // theme.typography.heading.h1
 *   // theme.spacing.section.default
 *
 * Or import individual modules:
 *   import { colors } from '@/theme/colors';
 *   import { typography } from '@/theme/typography';
 */

import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} as const;

export type Theme = typeof theme;
