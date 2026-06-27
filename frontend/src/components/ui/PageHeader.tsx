import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { spacing } from '@/theme/spacing';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  /** Background variant */
  variant?: 'default' | 'muted';
}

/**
 * Reusable page-level header with title, optional description, and action area.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <PageHeader
 *   title="Our Doctors"
 *   description="Meet our experienced medical team"
 * >
 *   <Button>Book Now</Button>
 * </PageHeader>
 * ```
 */
export function PageHeader({
  title,
  description,
  children,
  className,
  variant = 'default',
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'px-4 text-center',
        variant === 'muted' ? 'bg-[#F3F4F6]' : 'bg-white',
        spacing.section.compact,
        className
      )}
    >
      <div className={cn('mx-auto max-w-2xl')}>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mx-auto mt-4 max-w-xl text-xl text-gray-500 leading-relaxed">
            {description}
          </p>
        )}
        {children && (
          <div className="mt-8 flex justify-center gap-4">{children}</div>
        )}
      </div>
    </div>
  );
}
