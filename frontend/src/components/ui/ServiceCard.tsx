import type { LucideIcon } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Service title */
  title: string;
  /** Service description */
  description: string;
  /** Optional className override */
  className?: string;
}

/**
 * Reusable service card for displaying medical services or feature offerings.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <ServiceCard
 *   icon={Stethoscope}
 *   title="General Consultation"
 *   description="Comprehensive health check-ups for all ages."
 * />
 * ```
 */
export function ServiceCard({
  icon: Icon,
  title,
  description,
  className,
}: ServiceCardProps) {
  return (
    <Card
      className={cn(
        'group rounded-2xl border border-gray-200 bg-[#F9FAFB] p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-teal-200',
        className
      )}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-all duration-300 group-hover:bg-teal-100 group-hover:scale-110">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-[22px] font-semibold text-gray-900">{title}</h3>
      <p className="mt-3 text-[19px] text-gray-500 leading-relaxed">
        {description}
      </p>
    </Card>
  );
}
