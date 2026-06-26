import { cn } from '@/lib/utils';

import { Skeleton } from '@/components/ui/skeleton';

interface LoadingCardProps {
  /** Number of skeleton cards to render */
  count?: number;
  /** Grid columns configuration */
  columns?: string;
  /** Optional className override */
  className?: string;
}

/**
 * Reusable loading skeleton grid for card-based layouts.
 * Renders a grid of skeleton cards with avatar, title, text, and button placeholders.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <LoadingCard count={6} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
 * ```
 */
export function LoadingCard({
  count = 3,
  columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  className,
}: LoadingCardProps) {
  return (
    <div className={cn('grid gap-6 md:gap-8', columns, className)}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200 bg-[#F9FAFB] shadow-sm"
        >
          <div className="flex flex-col items-center px-6 pt-8 pb-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="mt-4 h-6 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-5/6" />
            <Skeleton className="mt-6 h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
