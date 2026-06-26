import {
  ArrowLeft,
  Calendar,
  Clock,
  Hash,
  Mail,
  Phone,
  StickyNote,
  User,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AppointmentPublic } from '@/client';
import { AppointmentStatusBadge } from '@/components/Appointments/AppointmentStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppointment } from '@/hooks/useAppointment';
import { useUpdateAppointmentStatus } from '@/hooks/useUpdateAppointmentStatus';
import { cn } from '@/lib/utils';
import { formatDateForDisplay, formatDateLong } from '@/utils/date';

interface AppointmentDetailsProps {
  appointmentId: string;
  onBack: () => void;
}

// ── Detail Row ───────────────────────────────────────────────────
function DetailRow({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | React.ReactNode;
  subValue?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-gray-900">{value}</div>
        {subValue && <p className="text-[12px] text-gray-500">{subValue}</p>}
        <p className="text-[12px] text-gray-400">{label}</p>
      </div>
    </div>
  );
}

// ── Info Card ────────────────────────────────────────────────────
function InfoCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6',
        className
      )}
    >
      <h3 className="mb-4 text-[15px] font-bold text-gray-900">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ── Appointment Info Card ────────────────────────────────────────
function AppointmentInfoCard({
  appointment,
  t,
  locale,
}: {
  appointment: AppointmentPublic;
  t: (key: string) => string;
  locale: string;
}) {
  return (
    <InfoCard title={t('detail.appointmentInfo')}>
      {appointment.booking_number && (
        <DetailRow
          icon={Hash}
          label={t('list.columns.bookingRef')}
          value={
            <span className="font-mono text-[13px] font-bold text-teal-600">
              {appointment.booking_number}
            </span>
          }
        />
      )}
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-gray-500">
          {t('list.columns.status')}
        </span>
        <AppointmentStatusBadge status={appointment.status} />
      </div>
      <DetailRow
        icon={Calendar}
        label={formatDateForDisplay(appointment.appointment_date, locale)}
        value={formatDateLong(appointment.appointment_date, locale)}
      />
      <DetailRow
        icon={Clock}
        label="Time"
        value={appointment.appointment_time}
      />
      {appointment.created_at && (
        <DetailRow
          icon={Calendar}
          label={t('detail.createdAt')}
          value={new Date(appointment.created_at).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          subValue={new Date(appointment.created_at).toLocaleTimeString(
            locale,
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          )}
        />
      )}
    </InfoCard>
  );
}

// ── Patient Info Card ────────────────────────────────────────────
function PatientInfoCard({
  appointment,
  t,
}: {
  appointment: AppointmentPublic;
  t: (key: string) => string;
}) {
  return (
    <InfoCard title={t('detail.patientInfo')}>
      <DetailRow icon={User} label="Name" value={appointment.patient_name} />
      <DetailRow icon={Phone} label="Phone" value={appointment.patient_phone} />
      {appointment.patient_email && (
        <DetailRow
          icon={Mail}
          label="Email"
          value={appointment.patient_email}
        />
      )}
      {appointment.contact_method && (
        <DetailRow
          icon={Phone}
          label={t('detail.contactMethod')}
          value={
            <span className="capitalize">{appointment.contact_method}</span>
          }
        />
      )}
    </InfoCard>
  );
}

// ── Doctor Info Card ─────────────────────────────────────────────
function DoctorInfoCard({
  appointment,
  t,
}: {
  appointment: AppointmentPublic;
  t: (key: string) => string;
}) {
  return (
    <InfoCard title={t('detail.doctorInfo')}>
      <DetailRow
        icon={User}
        label="Doctor"
        value={appointment.doctor_name ?? appointment.doctor_id}
      />
    </InfoCard>
  );
}

// ── Notes Card ───────────────────────────────────────────────────
function NotesCard({
  appointment,
  t,
}: {
  appointment: AppointmentPublic;
  t: (key: string) => string;
}) {
  if (!appointment.notes) return null;

  return (
    <InfoCard title={t('detail.notes')}>
      <div className="flex items-start gap-3">
        <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <p className="text-[14px] text-gray-600 whitespace-pre-wrap leading-relaxed">
          {appointment.notes}
        </p>
      </div>
    </InfoCard>
  );
}

// ── Loading State ────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export function AppointmentDetails({
  appointmentId,
  onBack,
}: AppointmentDetailsProps) {
  const { t, i18n } = useTranslation(['appointments', 'common']);
  const locale = i18n.language;

  const { data: appointment, isLoading } = useAppointment(appointmentId);
  const updateStatus = useUpdateAppointmentStatus();

  const handleCancel = () => {
    const confirmed = window.confirm(t('updateStatus.cancelMessage'));
    if (!confirmed) return;

    updateStatus.mutate({
      appointmentId,
      requestBody: { status: 'cancelled' },
    });
  };

  // ── Loading State ──────────────────────────────────────────────
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // ── Not Found / Error State ────────────────────────────────────
  if (!appointment) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-[14px] font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common:actions.back')}
        </button>
        <EmptyState
          icon={XCircle}
          title="Appointment not found"
          description="The appointment you are looking for does not exist or has been removed."
          action={
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-700 active:scale-[0.97]"
            >
              {t('common:actions.back')}
            </button>
          }
        />
      </div>
    );
  }

  // ── Data State ─────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-[14px] font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-[0.97]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common:actions.back')}
      </button>

      {/* Page Header */}
      <PageHeader
        title={t('detail.title')}
        description={`${t('list.columns.id')}: ${appointment.id}`}
      />

      {/* Info Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <AppointmentInfoCard appointment={appointment} t={t} locale={locale} />
        <PatientInfoCard appointment={appointment} t={t} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DoctorInfoCard appointment={appointment} t={t} />
        <NotesCard appointment={appointment} t={t} />
      </div>

      {/* Cancel Action */}
      {appointment.status === 'confirmed' && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={updateStatus.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-red-700 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="h-4 w-4" />
            {t('actions.cancel')}
          </button>
        </div>
      )}
    </div>
  );
}
