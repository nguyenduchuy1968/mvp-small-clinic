import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface FeatureCardProps {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Optional className override */
  className?: string;
  /** Visual variant */
  variant?: 'default' | 'compact';
}

/**
 * Reusable feature highlight card — used for About section, benefits, etc.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <FeatureCard
 *   icon={Stethoscope}
 *   title="Professional Doctors"
 *   description="Highly qualified team dedicated to your care."
 * />
 * ```
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
  variant = 'default',
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        'group rounded-2xl border border-gray-200 bg-[#F9FAFB] text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-teal-200',
        variant === 'default' ? 'p-8' : 'p-6',
        className
      )}
    >
      <div
        className={cn(
          'mx-auto flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-all duration-300 group-hover:bg-teal-100 group-hover:scale-110',
          variant === 'default' ? 'h-16 w-16' : 'h-12 w-12'
        )}
      >
        <Icon className={variant === 'default' ? 'h-8 w-8' : 'h-6 w-6'} />
      </div>
      <h3
        className={cn(
          'font-semibold text-gray-900',
          variant === 'default' ? 'mt-6 text-[22px]' : 'mt-4 text-lg'
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          'text-gray-500 leading-relaxed',
          variant === 'default' ? 'mt-3 text-[19px]' : 'mt-2 text-[15px]'
        )}
      >
        {description}
      </p>
    </div>
  );
}
