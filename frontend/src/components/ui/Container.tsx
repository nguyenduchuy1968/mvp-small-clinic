import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { spacing } from '@/theme/spacing';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'main' | 'header' | 'footer';
  /** Container width variant */
  width?: keyof typeof spacing.container;
}

/**
 * Reusable layout container that applies theme-based max-width and horizontal padding.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <Container width="narrow">
 *   <p>Content</p>
 * </Container>
 * ```
 */
export function Container({
  children,
  className,
  as: Tag = 'div',
  width = 'default',
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        'mx-auto px-4 sm:px-6 lg:px-8',
        spacing.container[width],
        className
      )}
    >
      {children}
    </Tag>
  );
}
