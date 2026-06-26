import { useNavigate } from '@tanstack/react-router';
import { Calendar, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AppointmentPublic } from '@/client';
import { AppointmentCard } from '@/components/ui/AppointmentCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface UpcomingAppointmentsWidgetProps {
  /** List of appointments to display */
  appointments?: AppointmentPublic[];
  /** Whether data is still loading */
  isLoading?: boolean;
  /** Locale for date formatting */
  locale?: string;
  /** Optional className override */
  className?: string;
}

/**
 * Dashboard widget that displays upcoming appointments in a compact card list.
 *
 * Supports three states:
 * - **Loading**: Renders skeleton placeholders
 * - **Empty**: Renders EmptyState with a "Book appointment" prompt
 * - **Data**: Renders AppointmentCard for each appointment (max 3)
 *
 * ---
 * **Usage:**
 * ```tsx
 * <UpcomingAppointmentsWidget
 *   appointments={appointments}
 *   isLoading={isLoading}
 *   locale={i18n.language}
 * />
 * ```
 */
export function UpcomingAppointmentsWidget({
  appointments,
  isLoading,
  locale = 'en',
  className,
}: UpcomingAppointmentsWidgetProps) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  // ── Loading State ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <section className={cn('space-y-4', className)}>
        <Skeleton className="h-7 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ── Empty State ────────────────────────────────────────────────
  if (!appointments || appointments.length === 0) {
    return (
      <section className={cn('space-y-4', className)}>
        <h2 className="text-[19px] font-bold text-gray-900">
          {t('recentAppointments.title')}
        </h2>
        <EmptyState
          icon={Calendar}
          title={t('recentAppointments.empty')}
          description="Book your first appointment to get started."
          action={
            <button
              type="button"
              onClick={() => navigate({ to: '/booking' })}
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-700 active:scale-[0.97]"
            >
              {t('quickActions.bookAppointment')}
            </button>
          }
        />
      </section>
    );
  }

  // ── Data State ─────────────────────────────────────────────────
  const displayed = appointments.slice(0, 3);

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-[19px] font-bold text-gray-900">
          {t('recentAppointments.title')}
        </h2>
        {appointments.length > 3 && (
          <button
            type="button"
            onClick={() => navigate({ to: '/appointments' })}
            className="flex items-center gap-1 text-[14px] font-semibold text-teal-600 transition-colors hover:text-teal-700"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {displayed.map((appt) => (
          <AppointmentCard
            key={appt.id}
            doctorName={appt.doctor_name}
            specialty={undefined}
            date={appt.appointment_date}
            time={appt.appointment_time}
            status={appt.status ?? 'pending'}
            locale={locale}
            primaryActionLabel="View Details"
            onPrimaryAction={() =>
              navigate({
                to: '/appointments/$id',
                params: { id: appt.id },
              })
            }
          />
        ))}
      </div>
    </section>
  );
}
