import { AlertCircle, Check, Clock, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Appointment statuses supported by the Patient Portal UI.
 *
 * Maps to backend enum values (`pending | confirmed | cancelled`)
 * plus `completed` which is prepared for future use.
 */
export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus | undefined | null;
}

/**
 * Solid-color status badge with icon for the Patient Portal.
 *
 * - **confirmed** → solid green background, white text, white Check icon
 * - **cancelled** → solid orange background, white text, white X icon
 * - **pending**   → solid amber background, white text, white Clock icon
 * - **completed** → solid blue background, white text, white AlertCircle icon
 *
 * All variants use a rounded pill shape with high contrast for accessibility.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <AppointmentStatusBadge status="confirmed" />
 * ```
 */
export function AppointmentStatusBadge({
  status,
}: AppointmentStatusBadgeProps) {
  const { t } = useTranslation('appointments');

  if (!status) return null;

  const label = t(`status.${status}`, { defaultValue: status });

  // Solid background variants with white text and white icons
  const variantMap: Record<
    AppointmentStatus,
    { bg: string; Icon: typeof Check }
  > = {
    confirmed: {
      bg: 'bg-green-600 dark:bg-green-500',
      Icon: Check,
    },
    cancelled: {
      bg: 'bg-orange-500 dark:bg-orange-400',
      Icon: XCircle,
    },
    pending: {
      bg: 'bg-amber-500 dark:bg-amber-400',
      Icon: Clock,
    },
    completed: {
      bg: 'bg-blue-600 dark:bg-blue-500',
      Icon: AlertCircle,
    },
  };

  const { bg, Icon } = variantMap[status] ?? variantMap.pending;

  return (
    <Badge
      variant="default"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold leading-none text-white shadow-sm',
        bg
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {label}
    </Badge>
  );
}
