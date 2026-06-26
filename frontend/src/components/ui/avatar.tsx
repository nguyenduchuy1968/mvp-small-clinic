import { User } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface AvatarProps extends ComponentProps<'div'> {
  /** URL to the avatar image */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Fallback content when no image is provided */
  fallback?: ReactNode;
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
  xl: 'h-24 w-24',
} as const;

const iconSizes = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12',
} as const;

/**
 * Reusable avatar component for displaying user/doctor photos.
 * Falls back to a User icon or custom fallback when no image is provided.
 *
 * Supports both simple usage (props-based) and compound usage (children-based)
 * for backward compatibility with shadcn/ui patterns.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <Avatar src="/photo.jpg" alt="Doctor" size="xl" />
 * <Avatar size="lg" fallback={<span>JD</span>} />
 * <Avatar><AvatarFallback>JD</AvatarFallback></Avatar>
 * ```
 */
export function Avatar({
  src,
  alt = '',
  size = 'md',
  fallback,
  children,
  className,
  ...props
}: AvatarProps & { children?: ReactNode }) {
  // Compound pattern: if children are provided (e.g. <AvatarFallback>), render as wrapper
  if (children) {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-full',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (src) {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-full',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-teal-100 text-teal-600',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {fallback ?? <User className={iconSizes[size]} />}
    </div>
  );
}

/**
 * AvatarFallback — simple wrapper for compound Avatar usage.
 * Renders fallback content inside the avatar container.
 */
export function AvatarFallback({
  className,
  children,
  ...props
}: ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-teal-100 text-teal-600 text-sm font-medium',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
