import { Calendar, Clock, Hash, Info, MapPin, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDateLong } from '@/utils/date';

import type { AppointmentStatus } from '@/components/Appointments/AppointmentStatusBadge';

/**
 * Placeholder data for the next appointment.
 * Will be replaced with real data when backend integration is added.
 */
export interface PlaceholderAppointment {
  id: string;
  doctorName: string;
  doctorPhoto?: string;
  specialty: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  location: string;
  bookingNumber: string;
}

interface PatientDashboardNextAppointmentProps {
  /** The next upcoming appointment, or null to show empty state */
  appointment: PlaceholderAppointment | null;
  /** Current locale for date formatting */
  locale?: string;
  /** Callback when "View Details" is clicked */
  onViewDetails?: (id: string) => void;
  /** Callback when "Cancel" is clicked */
  onCancel?: (id: string) => void;
  /** Optional className override */
  className?: string;
}

/**
 * Semantic status badge colors using theme-aware tokens.
 *
 * - confirmed → green (success)
 * - pending   → orange (warning/attention)
 * - cancelled → red (destructive)
 */
const statusColorMap: Record<AppointmentStatus, string> = {
  confirmed:
    'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
  pending:
    'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700',
  cancelled:
    'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
  completed:
    'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
};

/**
 * Accent bar colors for the top of the card.
 */
const accentColorMap: Record<AppointmentStatus, string> = {
  confirmed: 'bg-green-500',
  pending: 'bg-orange-500',
  cancelled: 'bg-red-500',
  completed: 'bg-blue-500',
};

/**
 * i18n key suffix for each appointment status.
 */
const statusI18nKey: Record<AppointmentStatus, string> = {
  confirmed: 'dashboard.nextAppointment.statusConfirmed',
  pending: 'dashboard.nextAppointment.statusPending',
  cancelled: 'dashboard.nextAppointment.statusCancelled',
  completed: 'dashboard.nextAppointment.statusCompleted',
};

/**
 * Hero card for the next upcoming appointment on the Patient Dashboard.
 *
 * Shows a large, visually prominent card with doctor info, date, time,
 * location, booking number, and action buttons.
 * Falls back to an empty state when no appointment is provided.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <PatientDashboardNextAppointment
 *   appointment={nextAppointment}
 *   locale={i18n.language}
 *   onViewDetails={(id) => navigate({ to: `/patient/appointments/${id}` })}
 * />
 * ```
 */
export function PatientDashboardNextAppointment({
  appointment,
  locale = 'en',
  onViewDetails,
  onCancel,
  className,
}: PatientDashboardNextAppointmentProps) {
  const { t } = useTranslation('patient');

  if (!appointment) {
    return (
      <Card
        className={cn(
          'border-dashed border-2 border-gray-300 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/30',
          className
        )}
      >
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-card-foreground">
              {t('dashboard.nextAppointment.noAppointment')}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('dashboard.nextAppointment.noAppointmentDesc')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusKey = appointment.status;
  const localizedStatus = t(statusI18nKey[statusKey]);

  return (
    <Card className={cn('overflow-hidden border-0 shadow-md', className)}>
      {/* Colored top accent bar */}
      <div
        className={cn('h-2 w-full', accentColorMap[statusKey])}
        aria-hidden="true"
      />

      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-card-foreground">
          {t('dashboard.nextAppointment.title')}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* ── Doctor info row ─────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <Avatar
            src={appointment.doctorPhoto}
            alt={appointment.doctorName}
            size="lg"
            className="h-16 w-16 shrink-0 border-2 border-border"
          />
          <div>
            <h3 className="text-lg font-bold text-card-foreground">
              {appointment.doctorName}
            </h3>
            <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
              {appointment.specialty}
            </p>
          </div>
        </div>

        <Separator />

        {/* ── Appointment details grid ───────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Date */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/30">
              <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('dashboard.nextAppointment.labelDate')}
              </p>
              <p className="text-sm font-semibold text-card-foreground">
                {formatDateLong(appointment.date, locale)}
              </p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('dashboard.nextAppointment.labelTime')}
              </p>
              <p className="text-sm font-semibold text-card-foreground">
                {appointment.time}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-900/30">
              <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('dashboard.nextAppointment.labelLocation')}
              </p>
              <p className="text-sm font-semibold text-card-foreground">
                {appointment.location}
              </p>
            </div>
          </div>

          {/* Booking Number */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/30">
              <Hash className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('dashboard.nextAppointment.labelBooking')}
              </p>
              <p className="text-sm font-semibold text-card-foreground">
                {appointment.bookingNumber}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Cancel info message ────────────────────────────────── */}
        <Alert variant="default" className="border-0 bg-muted/50 px-4 py-3">
          <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
            {t('dashboard.nextAppointment.cancelInfo')}
          </AlertDescription>
        </Alert>

        {/* ── Localized status badge + Action buttons ────────────── */}
        <div className="flex flex-col gap-4">
          {/* Status badge — localized, no "STATUS:" label */}
          <Badge
            variant="outline"
            className={cn(
              'w-fit shrink-0 font-semibold px-3 py-1 text-xs leading-none',
              statusColorMap[statusKey]
            )}
          >
            {localizedStatus}
          </Badge>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="default"
              size="lg"
              onClick={() => onViewDetails?.(appointment.id)}
              aria-label={t('dashboard.nextAppointment.ariaViewDetails', {
                doctorName: appointment.doctorName,
              })}
            >
              {t('dashboard.nextAppointment.viewDetails')}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onCancel?.(appointment.id)}
              className="bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
              aria-label={t('dashboard.nextAppointment.ariaCancel', {
                doctorName: appointment.doctorName,
              })}
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              {t('dashboard.nextAppointment.cancel')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
