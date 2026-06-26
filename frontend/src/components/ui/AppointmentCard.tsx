import { Calendar, Clock, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDateLong } from '@/utils/date';

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

const statusVariantMap: Record<
  AppointmentStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  confirmed: 'default',
  pending: 'secondary',
  cancelled: 'destructive',
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
  const badgeVariant = statusVariantMap[statusKey] ?? 'secondary';
  const statusLabel = statusLabelMap[statusKey];

  return (
    <Card
      className={cn(
        'rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
        className
      )}
    >
      <div className="flex flex-col p-5 sm:flex-row sm:items-start sm:gap-4 sm:p-6">
        {/* Doctor Avatar */}
        <div className="mb-4 flex items-center gap-3 sm:mb-0 sm:flex-col sm:items-center">
          <Avatar
            src={doctorPhoto}
            alt={doctorName ?? 'Doctor'}
            size="lg"
            className="shrink-0"
          />
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-3">
          {/* Header: Name + Status Badge */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-[17px] font-bold text-gray-900">
                {doctorName ?? 'Doctor'}
              </h3>
              {specialty && (
                <p className="mt-0.5 text-[14px] text-teal-600 font-medium">
                  {specialty}
                </p>
              )}
            </div>
            <Badge variant={badgeVariant} className="shrink-0">
              {statusLabel}
            </Badge>
          </div>

          {/* Date & Time */}
          <div className="flex flex-wrap gap-x-6 gap-y-1.5">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="text-[14px]">
                {formatDateLong(date, locale)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="text-[14px]">{time}</span>
            </div>
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="text-[13px]">{location}</span>
            </div>
          )}

          {/* Optional children */}
          {children}

          {/* Action Buttons */}
          {(primaryActionLabel || secondaryActionLabel) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {primaryActionLabel && (
                <button
                  type="button"
                  onClick={onPrimaryAction}
                  className="rounded-xl bg-teal-600 px-5 py-2 text-[14px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-700 active:scale-[0.97]"
                >
                  {primaryActionLabel}
                </button>
              )}
              {secondaryActionLabel && (
                <button
                  type="button"
                  onClick={onSecondaryAction}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2 text-[14px] font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-[0.97]"
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
