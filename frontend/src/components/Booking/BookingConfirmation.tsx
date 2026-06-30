import { useNavigate } from '@tanstack/react-router';
import {
  AlertTriangle,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Copy,
  Home,
  User,
  UserPlus,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { BookingBreadcrumb } from '@/components/Booking/BookingBreadcrumb';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { isLoggedIn } from '@/hooks/useAuth';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { formatDateLong } from '@/utils/date';

/**
 * Minimal appointment data returned by the public confirmation endpoint.
 * This is a subset of AppointmentPublic — only fields the confirmation
 * page actually needs. No PII beyond patient_email is exposed.
 */
/**
 * Minimal appointment data returned by the public confirmation endpoint.
 * All fields are readonly to accept both the full AppointmentPublic from
 * the create mutation and the trimmed response from the public endpoint.
 */
export interface AppointmentConfirmationData {
  readonly id: string;
  readonly doctor_name?: string | null;
  readonly appointment_date: string;
  readonly appointment_time: string;
  readonly booking_number?: string | null;
  readonly patient_email?: string | null;
  readonly status?: string;
}

interface BookingConfirmationProps {
  appointment: AppointmentConfirmationData;
  onNewBooking?: () => void;
}

function formatTime(time: string): string {
  return time.length > 5 ? time.slice(0, 5) : time;
}

export function BookingConfirmation({
  appointment,
  onNewBooking,
}: BookingConfirmationProps) {
  const { t, i18n } = useTranslation('booking');
  const navigate = useNavigate();
  const [, copy] = useCopyToClipboard();

  const handleCopyBookingNumber = async () => {
    if (!appointment.booking_number) return;
    const ok = await copy(appointment.booking_number);
    if (ok) {
      toast.success(t('confirmation.copySuccess'));
    } else {
      toast.error(t('common:states.error'));
    }
  };

  const handleNewBooking = () => {
    onNewBooking?.();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Breadcrumb navigation — always visible on confirmation */}
      <BookingBreadcrumb
        items={[
          { label: t('breadcrumb.home'), href: '/' },
          { label: t('breadcrumb.booking') },
        ]}
      />

      {/* Section 1: Premium Success Card */}
      <Card className="rounded-2xl border-green-200 bg-linear-to-b from-green-50 to-white shadow-lg overflow-hidden">
        <CardContent className="p-8 sm:p-10">
          <div className="flex flex-col items-center gap-4 text-center">
            {/* Large success icon */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 shadow-inner">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>

            {/* Title */}
            <h2 className="text-[26px] sm:text-[28px] font-bold text-green-700 tracking-tight">
              {t('confirmation.title')}
            </h2>

            {/* Success message */}
            <p className="text-[17px] text-green-600 max-w-md">
              {t('confirmation.successMessage')}
            </p>
          </div>

          {/* Appointment Summary Card */}
          <div className="mt-8 rounded-xl border border-green-200 bg-white p-6 sm:p-7 shadow-sm">
            <h3 className="text-[16px] font-semibold text-gray-800 mb-5 text-center">
              {t('confirmation.appointmentSummary')}
            </h3>

            <dl className="space-y-4 text-[15px]">
              {/* Doctor */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50">
                  <User className="h-4.5 w-4.5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <dt className="text-[13px] text-gray-500">
                    {t('confirmation.doctor')}
                  </dt>
                  <dd className="font-semibold text-gray-900 truncate">
                    {appointment.doctor_name ?? '—'}
                  </dd>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50">
                  <Calendar className="h-4.5 w-4.5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <dt className="text-[13px] text-gray-500">
                    {t('confirmation.date')}
                  </dt>
                  <dd className="font-semibold text-gray-900">
                    {formatDateLong(
                      appointment.appointment_date,
                      i18n.language
                    )}
                  </dd>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50">
                  <Clock className="h-4.5 w-4.5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <dt className="text-[13px] text-gray-500">
                    {t('confirmation.time')}
                  </dt>
                  <dd className="font-semibold text-gray-900">
                    {formatTime(appointment.appointment_time)}
                  </dd>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-t border-green-100" />

              {/* Booking Number — visually dominant */}
              <div className="flex items-center justify-between pt-1">
                <dt className="text-[14px] font-semibold text-gray-600">
                  {t('confirmation.bookingReference')}
                </dt>
                <dd className="flex items-center gap-2">
                  <span className="font-mono text-[22px] font-bold text-teal-600 tracking-wider">
                    {appointment.booking_number}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-all"
                    onClick={handleCopyBookingNumber}
                    title={t('confirmation.copyTooltip')}
                  >
                    <Copy className="h-4.5 w-4.5" />
                  </Button>
                </dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Attention Message */}
      <Alert
        variant="warning"
        className="rounded-2xl border-orange-200 bg-orange-50 shadow-sm"
      >
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <AlertTitle className="text-[16px] font-bold text-orange-700">
              {t('confirmation.attentionTitle')}
            </AlertTitle>
            <AlertDescription className="text-[14px] text-orange-600 mt-1">
              <p>{t('confirmation.attentionMessage')}</p>
              <p className="font-semibold text-orange-800 mt-2">
                {appointment.patient_email}
              </p>
              <p className="whitespace-pre-line mt-2">
                {t('confirmation.attentionMessageEmail')}
              </p>
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Section 3: What's Next — Info Box */}
      <Card className="rounded-2xl border-blue-200 bg-blue-50/50 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <h3 className="text-[16px] font-semibold text-gray-800 mb-4">
            {t('confirmation.whatsNext')}
          </h3>
          <ul className="space-y-3 text-[14px] text-gray-600">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              <span>{t('confirmation.whatsNextEmail')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              <span>{t('confirmation.whatsNextArrive')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              <span>{t('confirmation.whatsNextReference')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              <span>{t('confirmation.whatsNextPortal')}</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 4: Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
        {/* Home — secondary */}
        <Button
          variant="outline"
          size="lg"
          className="rounded-xl border-gray-300 px-8 py-3 text-[16px] font-semibold hover:bg-gray-50 hover:border-teal-400 transition-all"
          onClick={() => navigate({ to: '/' })}
        >
          <Home className="mr-2 h-5 w-5" />
          {t('confirmation.home')}
        </Button>

        {/* Book Another Appointment — primary */}
        <Button
          variant="default"
          size="lg"
          className="rounded-xl bg-teal-600 px-8 py-3 text-[16px] font-semibold hover:bg-teal-700 shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 transition-all"
          onClick={handleNewBooking}
        >
          <Calendar className="mr-2 h-5 w-5" />
          {t('confirmation.newBooking')}
        </Button>

        {/* Conditional: Create Free Account (guest) or My Appointments (logged in) */}
        {isLoggedIn() ? (
          <Button
            variant="outline"
            size="lg"
            className="rounded-xl border-teal-600 px-8 py-3 text-[16px] font-semibold text-teal-700 hover:bg-teal-50 hover:text-teal-800 transition-all"
            onClick={() => navigate({ to: '/patient/appointments' })}
          >
            <CalendarCheck className="mr-2 h-5 w-5" />
            {t('confirmation.myAppointments')}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="lg"
            className="rounded-xl border-teal-600 px-8 py-3 text-[16px] font-semibold text-teal-700 hover:bg-teal-50 hover:text-teal-800 transition-all"
            onClick={() => navigate({ to: '/activate-account' })}
          >
            <UserPlus className="mr-2 h-5 w-5" />
            {t('confirmation.createAccount')}
          </Button>
        )}
      </div>
    </div>
  );
}
