import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  /** Main error heading */
  title: string;
  /** Optional error description */
  description?: string;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Optional retry button label */
  retryLabel?: string;
  /** Optional additional action below the retry button */
  children?: ReactNode;
  /** Optional className override */
  className?: string;
}

/**
 * Reusable error state component for API failures, network errors, etc.
 *
 * Displays a warning icon, error title, description, and a retry button.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <ErrorState
 *   title="Failed to load data"
 *   description="Something went wrong. Please try again."
 *   onRetry={() => refetch()}
 * />
 * ```
 */
export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  children,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className
      )}
      role="alert"
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
        <AlertTriangle className="h-10 w-10 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-md text-[16px] text-gray-500 dark:text-gray-400 leading-relaxed">
          {description}
        </p>
      )}
      {onRetry && (
        <Button
          variant="default"
          size="lg"
          onClick={onRetry}
          className="mt-6 gap-2"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {retryLabel}
        </Button>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
