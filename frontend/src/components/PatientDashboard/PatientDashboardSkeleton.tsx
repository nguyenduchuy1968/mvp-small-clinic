import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PatientDashboardSkeletonProps {
  /** Optional className override */
  className?: string;
}

/**
 * Full-page skeleton loader for the Patient Dashboard.
 *
 * Mirrors the layout of the actual dashboard with skeleton placeholders
 * for the welcome card, next appointment hero, quick actions, and
 * upcoming appointments sections.
 *
 * ---
 * **Usage:**
 * ```tsx
 * {isLoading && <PatientDashboardSkeleton />}
 * ```
 */
export function PatientDashboardSkeleton({
  className,
}: PatientDashboardSkeletonProps) {
  const { t } = useTranslation('patient');

  return (
    <div className={cn('space-y-8', className)} role="status" aria-label={t('dashboard.skeleton.loading')}>
      {/* Screen reader only text */}
      <span className="sr-only">{t('dashboard.skeleton.loading')}</span>

      {/* Welcome card skeleton */}
      <Card className="overflow-hidden border-0">
        <div className="h-2 w-full bg-gray-200" aria-hidden="true" />
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <Skeleton className="h-20 w-20 shrink-0 rounded-full sm:h-24 sm:w-24" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-3/4 sm:w-1/2" />
            <Skeleton className="h-5 w-full sm:w-2/3" />
          </div>
        </div>
      </Card>

      {/* Next appointment skeleton */}
      <Card className="overflow-hidden border-0 shadow-md">
        <div className="h-2 w-full bg-gray-200" aria-hidden="true" />
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Quick actions skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5"
            >
              <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming appointments skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:gap-6 sm:p-7"
            >
              <Skeleton className="mb-4 h-16 w-16 shrink-0 rounded-full sm:mb-0 sm:h-20 sm:w-20" />
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-44" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-10 w-32 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
