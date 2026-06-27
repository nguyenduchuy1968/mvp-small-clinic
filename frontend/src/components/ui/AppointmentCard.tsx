import { Calendar, Clock, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDateLong } from '@/utils/date';

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

/**
 * Semantic status badge colors:
 * - confirmed → green (success)
 * - pending → orange (warning/attention)
 * - cancelled → red (destructive)
 */
const statusColorMap: Record<AppointmentStatus, string> = {
  confirmed:
    'bg-green-100 text-gray-900 border-green-300 dark:bg-green-900/40 dark:text-gray-100 dark:border-green-700',
  pending:
    'bg-orange-100 text-gray-900 border-orange-300 dark:bg-orange-900/40 dark:text-gray-100 dark:border-orange-700',
  cancelled:
    'bg-red-100 text-gray-900 border-red-300 dark:bg-red-900/40 dark:text-gray-100 dark:border-red-700',
};

const statusLabelMap: Record<AppointmentStatus, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  cancelled: 'Cancelled',
};

interface AppointmentCardProps {
  /** Doctor's full name */
  doctorName?: string | null;
  /** URL to doctor's photo */
  doctorPhoto?: string;
  /** Medical specialty */
  specialty?: string | null;
  /** Appointment date in YYYY-MM-DD format */
  date: string;
  /** Appointment time in HH:MM format */
  time: string;
  /** Appointment status */
  status?: AppointmentStatus | null;
  /** Optional location text */
  location?: string | null;
  /** Locale for date formatting */
  locale?: string;
  /** Label for the primary action button */
  primaryActionLabel?: string;
  /** Callback for the primary action */
  onPrimaryAction?: () => void;
  /** Label for the secondary action button */
  secondaryActionLabel?: string;
  /** Callback for the secondary action */
  onSecondaryAction?: () => void;
  /** Optional children rendered between info and actions */
  children?: ReactNode;
  /** Optional className override */
  className?: string;
}

/**
 * Reusable appointment card for displaying appointment details
 * in a card format. Used in Patient Dashboard, Appointment List, etc.
 *
 * Supports status badge, action buttons, and optional children for extensibility.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <AppointmentCard
 *   doctorName="Dr. Nguyen Van A"
 *   specialty="General Practitioner"
 *   date="2026-06-30"
 *   time="09:00"
 *   status="confirmed"
 *   locale="en"
 *   primaryActionLabel="View Details"
 *   onPrimaryAction={() => navigate({ to: "/appointments/$id", params: { id } })}
 * />
 * ```
 */
export function AppointmentCard({
  doctorName,
  doctorPhoto,
  specialty,
  date,
  time,
  status,
  location,
  locale = 'en',
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  children,
  className,
}: AppointmentCardProps) {
  const statusKey = status ?? 'pending';
  const badgeColor = statusColorMap[statusKey] ?? statusColorMap.pending;
  const statusLabel = statusLabelMap[statusKey];

  return (
    <Card
      className={cn(
        'rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
        className
      )}
    >
      <div className="flex flex-col p-6 sm:flex-row sm:items-start sm:gap-6 sm:p-7">
        {/* Doctor Avatar */}
        <div className="mb-4 flex items-center gap-3 sm:mb-0 sm:flex-col sm:items-center">
          <Avatar
            src={doctorPhoto}
            alt={doctorName ?? 'Doctor'}
            size="xl"
            className="shrink-0 h-16 w-16 sm:h-20 sm:w-20"
          />
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Header: Name + Status Badge */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[18px] font-bold text-gray-900">
                {doctorName ?? 'Doctor'}
              </h3>
              {specialty && (
                <p className="mt-0.5 text-[15px] text-teal-600 font-medium">
                  {specialty}
                </p>
              )}
            </div>
            <Badge
              variant="outline"
              className={cn('shrink-0 font-semibold px-3 py-1 text-[13px] leading-none min-h-8 inline-flex items-center', badgeColor)}
            >
              {statusLabel}
            </Badge>
          </div>

          {/* Date & Time */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="text-[15px]">
                {formatDateLong(date, locale)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="text-[15px]">{time}</span>
            </div>
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="text-[14px]">{location}</span>
            </div>
          )}

          {/* Optional children */}
          {children}

          {/* Action Buttons */}
          {(primaryActionLabel || secondaryActionLabel) && (
            <div className="mt-2 flex flex-wrap gap-3">
              {primaryActionLabel && (
                <button
                  type="button"
                  onClick={onPrimaryAction}
                  className="rounded-xl bg-teal-600 px-6 py-2.5 text-[15px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-700 active:scale-[0.97]"
                >
                  {primaryActionLabel}
                </button>
              )}
              {secondaryActionLabel && (
                <button
                  type="button"
                  onClick={onSecondaryAction}
                  className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-[15px] font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-[0.97]"
                >
                  {secondaryActionLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
