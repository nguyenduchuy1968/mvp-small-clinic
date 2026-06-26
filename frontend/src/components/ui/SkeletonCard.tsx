import { cn } from '@/lib/utils';

import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonCardProps {
  /** Optional className override */
  className?: string;
}

/**
 * A single skeleton card placeholder.
 * Useful when you need fine-grained control over the skeleton layout.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <div className="grid grid-cols-3 gap-6">
 *   {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
 * </div>
 * ```
 */
export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-[#F9FAFB] shadow-sm',
        className
      )}
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
  );
}
