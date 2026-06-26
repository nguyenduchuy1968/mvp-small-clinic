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
  /** Optional className override */
  className?: string;
}

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
 * />
 * ```
 */
export function StatCard({
  icon: Icon,
  value,
  label,
  suffix,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-blue-200',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-all duration-300">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {value}
        {suffix && (
          <span className="ml-0.5 text-2xl sm:text-3xl">{suffix}</span>
        )}
      </p>
      <p className="mt-1 text-[15px] font-medium text-gray-500 sm:text-[17px]">
        {label}
      </p>
    </div>
  );
}
