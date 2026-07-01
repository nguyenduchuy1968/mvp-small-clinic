import { useNavigate } from '@tanstack/react-router';
import {
  Bookmark,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Copy,
  Home,
  MailCheck,
  User,
  UserPlus,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { BookingBreadcrumb } from '@/components/Booking/BookingBreadcrumb';
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
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Breadcrumb navigation — always visible on confirmation */}
      <BookingBreadcrumb
        items={[
          { label: t('breadcrumb.home'), href: '/' },
          { label: t('breadcrumb.booking'), href: '/booking' },
          { label: t('breadcrumb.confirmation') },
        ]}
      />

      {/* ═══════════════════════════════════════════════════════
         Section 1: Success Hero + Appointment Summary
         ═══════════════════════════════════════════════════════ */}
      <Card className="rounded-2xl border-green-200 bg-linear-to-b from-green-50 to-white shadow-lg overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          {/* ── Hero ──────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-green-100 shadow-inner">
              <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
            </div>
            <h2 className="text-[24px] sm:text-[28px] font-bold text-green-700 tracking-tight">
              {t('confirmation.title')}
            </h2>
            <p className="text-[15px] sm:text-[16px] text-green-600 max-w-md">
              {t('confirmation.successMessage')}
            </p>
          </div>

          {/* ── Appointment Summary ────────────────────────── */}
          <div className="mt-6 rounded-xl border border-green-200 bg-white p-5 sm:p-6 shadow-sm">
            <h3 className="text-[15px] font-semibold text-gray-800 mb-4 text-center">
              {t('confirmation.appointmentSummary')}
            </h3>

            <dl className="space-y-3 text-[14px]">
              {/* Doctor */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50">
                  <User className="h-4 w-4 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <dt className="text-[12px] text-gray-500">
                    {t('confirmation.doctor')}
                  </dt>
                  <dd className="font-semibold text-gray-900 truncate">
                    {appointment.doctor_name ?? '—'}
                  </dd>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50">
                  <Calendar className="h-4 w-4 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <dt className="text-[12px] text-gray-500">
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50">
                  <Clock className="h-4 w-4 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <dt className="text-[12px] text-gray-500">
                    {t('confirmation.time')}
                  </dt>
                  <dd className="font-semibold text-gray-900">
                    {formatTime(appointment.appointment_time)}
                  </dd>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-t border-green-100" />

              {/* ── Booking Reference — highlighted badge ── */}
              <div className="rounded-xl bg-teal-50/50 border border-teal-100 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[13px] font-semibold text-gray-600 shrink-0">
                    {t('confirmation.bookingReference')}
                  </dt>
                  <dd className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[20px] sm:text-[22px] font-bold text-teal-600 tracking-wider truncate">
                      {appointment.booking_number}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-100 transition-all"
                      onClick={handleCopyBookingNumber}
                      title={t('confirmation.copyTooltip')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════
         Section 2: Confirmation Email Sent — Success Card
         ═══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50 shadow-sm p-5 sm:p-6">
        <div className="flex gap-3 sm:gap-4">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-teal-100">
            <MailCheck className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] sm:text-[16px] font-bold text-teal-800">
              {t('confirmation.emailSentTitle')}
            </h3>
            <div className="mt-2 space-y-2 text-[13px] sm:text-[14px] text-slate-700">
              <p>{t('confirmation.emailSentMessage')}</p>
              {/* Email address as a highlighted pill */}
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-100/70 px-4 py-1.5 text-teal-700 font-semibold text-[13px] sm:text-[14px] break-all">
                <MailCheck className="h-3.5 w-3.5 shrink-0" />
                <span>{appointment.patient_email}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {t('confirmation.emailSentDetails')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
         Section 3: What's Next — Icon Checklist
         ═══════════════════════════════════════════════════════ */}
      <Card className="rounded-2xl border-blue-200 bg-blue-50/50 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <h3 className="text-[15px] sm:text-[16px] font-semibold text-gray-800 mb-4">
            {t('confirmation.whatsNext')}
          </h3>
          <ul className="space-y-3 text-[14px] text-gray-600">
            <li className="flex items-start gap-3">
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
              <span>{t('confirmation.whatsNextEmail')}</span>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
              <span>{t('confirmation.whatsNextArrive')}</span>
            </li>
            <li className="flex items-start gap-3">
              <Bookmark className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
              <span>{t('confirmation.whatsNextReference')}</span>
            </li>
            <li className="flex items-start gap-3">
              <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
              <span>{t('confirmation.whatsNextPortal')}</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════
         Section 4: Action Buttons
         ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-2 justify-center flex-wrap">
        {/* Home — tertiary */}
        <Button
          variant="ghost"
          size="lg"
          className="rounded-xl px-6 py-3 text-[15px] font-medium text-gray-500 hover:text-teal-600 hover:bg-teal-50 transition-all order-3 sm:order-1"
          onClick={() => navigate({ to: '/' })}
        >
          <Home className="mr-2 h-4.5 w-4.5" />
          {t('confirmation.home')}
        </Button>

        {/* Book Another Appointment — primary */}
        <Button
          variant="default"
          size="lg"
          className="rounded-xl bg-teal-600 px-8 py-3 text-[15px] sm:text-[16px] font-semibold hover:bg-teal-700 shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 transition-all order-1 sm:order-2"
          onClick={handleNewBooking}
        >
          <Calendar className="mr-2 h-4.5 w-4.5" />
          {t('confirmation.newBooking')}
        </Button>

        {/* Conditional: Create Free Account (guest) or My Appointments (logged in) */}
        {isLoggedIn() ? (
          <Button
            variant="outline"
            size="lg"
            className="rounded-xl border-teal-600 px-7 py-3 text-[15px] font-semibold text-teal-700 hover:bg-teal-50 hover:text-teal-800 transition-all order-2 sm:order-3"
            onClick={() => navigate({ to: '/patient/appointments' })}
          >
            <CalendarCheck className="mr-2 h-4.5 w-4.5" />
            {t('confirmation.myAppointments')}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="lg"
            className="rounded-xl border-teal-600 px-7 py-3 text-[15px] font-semibold text-teal-700 hover:bg-teal-50 hover:text-teal-800 transition-all order-2 sm:order-3"
            onClick={() => navigate({ to: '/activate-account' })}
          >
            <UserPlus className="mr-2 h-4.5 w-4.5" />
            {t('confirmation.createAccount')}
          </Button>
        )}
      </div>
    </div>
  );
}
