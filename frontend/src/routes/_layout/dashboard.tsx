import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import {
  QuickActionsWidget,
  StatisticsCard,
  UpcomingAppointmentsWidget,
  WelcomeSection,
} from '@/components/Dashboard';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppointments } from '@/hooks/useAppointments';
import useAuth from '@/hooks/useAuth';
import { useDoctors } from '@/hooks/useDoctors';

export const Route = createFileRoute('/_layout/dashboard')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: 'Dashboard' }],
  }),
});

function RouteComponent() {
  const { t, i18n } = useTranslation('dashboard');
  const { user } = useAuth();
  const { data: appointmentsData, isLoading: isAppointmentsLoading } =
    useAppointments();
  const { data: doctorsData, isLoading: isDoctorsLoading } = useDoctors();

  const appointments = appointmentsData?.data;
  const totalDoctors = doctorsData?.data?.length ?? 0;

  return (
    <div className="space-y-8 pb-8">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <PageHeader
        title={t('title')}
        description="Overview of your clinic activity and appointments"
      />

      {/* ── Welcome Section ─────────────────────────────────────── */}
      <WelcomeSection user={user} />

      {/* ── Statistics Grid ─────────────────────────────────────── */}
      <StatisticsCard
        appointments={appointments}
        totalDoctors={totalDoctors}
        isLoading={isAppointmentsLoading || isDoctorsLoading}
      />

      {/* ── Quick Actions ───────────────────────────────────────── */}
      <QuickActionsWidget />

      {/* ── Upcoming Appointments ───────────────────────────────── */}
      <UpcomingAppointmentsWidget
        appointments={appointments}
        isLoading={isAppointmentsLoading}
        locale={i18n.language}
      />

      {/* ==========================================================
          FUTURE-READY PLACEHOLDERS
          These sections are structurally prepared for upcoming
          features. Uncomment and implement when the backend
          supports them.

          ── Appointment History ────────────────────────────────
          <section className="space-y-4">
            <h2 className="text-[19px] font-bold text-gray-900">
              Appointment History
            </h2>
            <p className="text-[14px] text-gray-500">
              View your past appointments and visit history.
            </p>
          </section>

          ── Medical Records ────────────────────────────────────
          <section className="space-y-4">
            <h2 className="text-[19px] font-bold text-gray-900">
              Medical Records
            </h2>
            <p className="text-[14px] text-gray-500">
              Access your medical records and prescriptions.
            </p>
          </section>

          ── Notifications ──────────────────────────────────────
          <section className="space-y-4">
            <h2 className="text-[19px] font-bold text-gray-900">
              Notifications
            </h2>
            <p className="text-[14px] text-gray-500">
              Stay updated with appointment reminders and clinic news.
            </p>
          </section>

          ── Invoices & Payments ────────────────────────────────
          <section className="space-y-4">
            <h2 className="text-[19px] font-bold text-gray-900">
              Invoices & Payments
            </h2>
            <p className="text-[14px] text-gray-500">
              View and manage your invoices and payment history.
            </p>
          </section>
      ========================================================== */}
    </div>
  );
}
