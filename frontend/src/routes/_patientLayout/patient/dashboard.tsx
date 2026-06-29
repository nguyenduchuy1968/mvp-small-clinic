import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { PlaceholderAppointment } from '@/components/PatientDashboard';
import {
  PatientDashboardNextAppointment,
  PatientDashboardQuickActions,
  PatientDashboardSkeleton,
  PatientDashboardUpcomingAppointments,
  PatientDashboardWelcome,
} from '@/components/PatientDashboard';
import { ErrorState } from '@/components/ui/ErrorState';
import { usePatient } from '@/hooks/usePatient';
import { usePatientAppointments } from '@/hooks/usePatientAppointments';
import { getClinicTodayString } from '@/utils/date';

import type { AppointmentStatus } from '@/components/Appointments/AppointmentStatusBadge';

export const Route = createFileRoute('/_patientLayout/patient/dashboard')({
  component: PatientDashboard,
  head: () => ({
    meta: [{ title: 'Patient Dashboard' }],
  }),
});

/**
 * Map a backend AppointmentPublic to the PlaceholderAppointment shape
 * used by the dashboard components.
 */
function toPlaceholderAppointment(
  apt: {
    id: string;
    doctor_name?: string | null;
    appointment_date: string;
    appointment_time: string;
    status?: string | null;
    booking_number?: string | null;
    doctor_id: string;
    patient_name: string;
    patient_phone: string;
  }
): PlaceholderAppointment {
  return {
    id: apt.id,
    doctorName: apt.doctor_name ?? 'Doctor',
    specialty: '', // specialty is not returned by the appointments endpoint
    date: apt.appointment_date,
    time: apt.appointment_time,
    status: (apt.status as AppointmentStatus) ?? 'pending',
    location: '', // location is not returned by the appointments endpoint
    bookingNumber: apt.booking_number ?? '',
  };
}

function PatientDashboard() {
  const { t, i18n } = useTranslation('patient');

  // ── Data hooks ──────────────────────────────────────────────────
  const {
    data: patient,
    isLoading: patientLoading,
    error: patientError,
    refetch: refetchPatient,
  } = usePatient();

  const patientId = patient?.id;
  const {
    data: appointmentsData,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = usePatientAppointments(patientId);

  const isLoading = patientLoading || appointmentsLoading;
  const error = patientError || appointmentsError;

  // ── Derived data ────────────────────────────────────────────────
  const todayStr = getClinicTodayString();

  const { nextAppointment, upcomingAppointments } = useMemo(() => {
    if (!appointmentsData?.data) {
      return { nextAppointment: null, upcomingAppointments: [] };
    }

    // Filter to future appointments (date >= today)
    const future = appointmentsData.data
      .filter((apt) => apt.appointment_date >= todayStr)
      // Sort ascending by date, then by time
      .sort((a, b) => {
        const dateCmp = a.appointment_date.localeCompare(b.appointment_date);
        if (dateCmp !== 0) return dateCmp;
        return a.appointment_time.localeCompare(b.appointment_time);
      });

    const next = future.length > 0 ? future[0] : null;

    return {
      nextAppointment: next
        ? toPlaceholderAppointment(next)
        : null,
      upcomingAppointments: future
        .slice(1) // exclude the next appointment (already shown in hero)
        .map((apt) => toPlaceholderAppointment(apt)),
    };
  }, [appointmentsData, todayStr, i18n.language]);

  // ── Loading state ───────────────────────────────────────────────
  if (isLoading) {
    return <PatientDashboardSkeleton />;
  }

  // ── Error state ─────────────────────────────────────────────────
  if (error) {
    return (
      <ErrorState
        title={t('dashboard.error.title')}
        description={t('dashboard.error.description')}
        retryLabel={t('dashboard.error.retry')}
        onRetry={() => {
          refetchPatient();
          refetchAppointments();
        }}
      />
    );
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* ── Welcome Card ──────────────────────────────────────────── */}
      <PatientDashboardWelcome patientName={patient?.full_name ?? 'Patient'} />

      {/* ── Next Appointment Hero ─────────────────────────────────── */}
      <PatientDashboardNextAppointment
        appointment={nextAppointment}
        locale={i18n.language}
        onViewDetails={(id) => console.log('View details for appointment:', id)}
        onCancel={(id) => console.log('Cancel appointment:', id)}
      />

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      <PatientDashboardQuickActions />

      {/* ── Upcoming Appointments ─────────────────────────────────── */}
      <PatientDashboardUpcomingAppointments
        appointments={upcomingAppointments}
        locale={i18n.language}
        isLoading={false}
      />
    </div>
  );
}

export default PatientDashboard;
