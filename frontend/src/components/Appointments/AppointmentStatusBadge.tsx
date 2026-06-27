import { useTranslation } from 'react-i18next';

import type { AppointmentStatus } from '@/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus | undefined | null;
}

/**
 * Status badge with semantic color mapping:
 * - confirmed → green (success)
 * - pending → orange (warning/attention)
 * - cancelled → red (destructive)
 */
export function AppointmentStatusBadge({
  status,
}: AppointmentStatusBadgeProps) {
  const { t } = useTranslation('appointments');

  if (!status) return null;

  const label = t(`status.${status}`, { defaultValue: status });

  // Semantic color classes with text-gray-900 for maximum readability
  const colorClass =
    status === 'confirmed'
      ? 'bg-green-100 text-gray-900 border-green-300 dark:bg-green-900/40 dark:text-gray-100 dark:border-green-700'
      : status === 'pending'
        ? 'bg-orange-100 text-gray-900 border-orange-300 dark:bg-orange-900/40 dark:text-gray-100 dark:border-orange-700'
        : status === 'cancelled'
          ? 'bg-red-100 text-gray-900 border-red-300 dark:bg-red-900/40 dark:text-gray-100 dark:border-red-700'
          : 'bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-800/40 dark:text-gray-100 dark:border-gray-600';

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold px-3 py-1 text-[13px] leading-none min-h-8 inline-flex items-center',
        colorClass
      )}
    >
      {label}
    </Badge>
  );
}
