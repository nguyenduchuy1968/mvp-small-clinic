import { Calendar, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';

import { AppointmentCard } from '@/components/ui/AppointmentCard';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

import type { PlaceholderAppointment } from './PatientDashboardNextAppointment';

interface PatientDashboardUpcomingAppointmentsProps {
  /** List of upcoming appointments (placeholder data) */
  appointments: PlaceholderAppointment[];
  /** Current locale for date formatting */
  locale?: string;
  /** Whether the data is still loading */
  isLoading?: boolean;
  /** Optional className override */
  className?: string;
}

/**
 * Upcoming Appointments section for the Patient Dashboard.
 *
 * Displays a list of upcoming appointment cards using the reusable
 * AppointmentCard component. Falls back to EmptyState when no
 * appointments are provided.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <PatientDashboardUpcomingAppointments
 *   appointments={upcomingAppointments}
 *   locale={i18n.language}
 * />
 * ```
 */
export function PatientDashboardUpcomingAppointments({
  appointments,
  locale = 'en',
  isLoading = false,
  className,
}: PatientDashboardUpcomingAppointmentsProps) {
  const { t } = useTranslation('patient');
  const navigate = useNavigate();

  if (isLoading) {
    return null; // Skeleton is handled by the parent
  }

  return (
    <section
      className={cn('space-y-4', className)}
      aria-label={t('dashboard.upcomingAppointments.ariaLabel')}
    >
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">
          {t('dashboard.upcomingAppointments.title')}
        </h2>
        {appointments.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/patient/appointments' })}
            className="gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            aria-label={t('dashboard.upcomingAppointments.viewAll')}
          >
            {t('dashboard.upcomingAppointments.viewAll')}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Appointment list or empty state */}
      {appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={t('dashboard.upcomingAppointments.empty')}
          description={t('dashboard.upcomingAppointments.emptyDesc')}
          action={
            <Button
              variant="default"
              size="lg"
              onClick={() => navigate({ to: '/booking' })}
            >
              {t('dashboard.quickActions.bookAppointment')}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <AppointmentCard
              key={apt.id}
              doctorName={apt.doctorName}
              doctorPhoto={apt.doctorPhoto}
              specialty={apt.specialty}
              date={apt.date}
              time={apt.time}
              status={apt.status}
              location={apt.location}
              locale={locale}
              primaryActionLabel={t('dashboard.upcomingAppointments.viewDetails')}
              onPrimaryAction={() =>
                navigate({ to: `/patient/appointments/${apt.id}` })
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
