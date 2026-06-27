import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface StatCardProps {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Numeric or display value */
  value: string;
  /** Label describing the stat */
  label: string;
  /** Optional suffix (e.g. "★", "min") */
  suffix?: string;
  /** Color variant for semantic mapping */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  /** Optional className override */
  className?: string;
}

/**
 * Color variants for stat cards:
 * - primary (teal): default, general stats
 * - secondary (blue): doctor/medical stats
 * - success (green): confirmed/completed stats
 * - warning (orange): pending/attention stats
 * - info (blue-light): informational stats
 */
const variantStyles = {
  primary: {
    container: 'border-teal-100 bg-teal-50/60 hover:border-teal-200',
    iconBg: 'bg-teal-100 text-teal-600',
  },
  secondary: {
    container: 'border-blue-100 bg-blue-50/60 hover:border-blue-200',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  success: {
    container: 'border-green-100 bg-green-50/60 hover:border-green-200',
    iconBg: 'bg-green-100 text-green-600',
  },
  warning: {
    container: 'border-orange-100 bg-orange-50/60 hover:border-orange-200',
    iconBg: 'bg-orange-100 text-orange-600',
  },
  info: {
    container: 'border-sky-100 bg-sky-50/60 hover:border-sky-200',
    iconBg: 'bg-sky-100 text-sky-600',
  },
} as const;

/**
 * Reusable stat/indicator card for trust metrics, KPIs, etc.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <StatCard
 *   icon={Users}
 *   value="5000+"
 *   label="Patients"
 *   variant="success"
 * />
 * ```
 */
export function StatCard({
  icon: Icon,
  value,
  label,
  suffix,
  variant = 'primary',
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border px-4 py-10 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md',
        styles.container,
        className
      )}
    >
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300',
          styles.iconBg
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        {value}
        {suffix && (
          <span className="ml-0.5 text-2xl sm:text-3xl">{suffix}</span>
        )}
      </p>
      <p className="mt-2 text-[16px] font-medium text-gray-500 sm:text-[18px]">
        {label}
      </p>
    </div>
  );
}
