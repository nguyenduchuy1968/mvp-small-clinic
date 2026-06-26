import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Icon component from lucide-react */
  icon?: LucideIcon;
  /** Main heading text */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional action button or content */
  action?: ReactNode;
  /** Optional className override */
  className?: string;
}

/**
 * Reusable empty state component for empty lists, no results, etc.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <EmptyState
 *   icon={Search}
 *   title="No doctors found"
 *   description="Try adjusting your search or filter criteria."
 *   action={<Button onClick={...}>Clear Filters</Button>}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-[15px] text-gray-500 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
